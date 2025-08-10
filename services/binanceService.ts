import type { Candle, MarketData } from '../types';
import { useAppStore } from '../store/useAppStore';

// --- Rate Limiter Intelligent ---

const BINANCE_API_WEIGHT_LIMIT = 1200;
const RATE_LIMIT_INTERVAL_MS = 60000; // 1 minute
const API_ENDPOINTS = [
    'https://api.binance.com',
    'https://api1.binance.com',
    'https://api2.binance.com',
    'https://api3.binance.com'
];


interface QueuedRequest {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    endpoint: string;
    params: Record<string, string | number>;
    weight: number;
}

const BinanceRateLimiter = {
    queue: [] as QueuedRequest[],
    usedWeight: 0,
    isProcessing: false,
    resetTimestamp: Date.now() + RATE_LIMIT_INTERVAL_MS,

    updateWeight(newWeight: number) {
        const now = Date.now();
        if (now > this.resetTimestamp) {
            this.usedWeight = newWeight;
            this.resetTimestamp = now + RATE_LIMIT_INTERVAL_MS;
        } else {
            this.usedWeight = Math.max(this.usedWeight, newWeight);
        }
        
        useAppStore.getState().setBinanceApiStatus({
            usedWeight: this.usedWeight,
            limit: BINANCE_API_WEIGHT_LIMIT
        });

        this.processQueue();
    },

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        const now = Date.now();
        if (now > this.resetTimestamp) {
            this.usedWeight = 0;
            this.resetTimestamp = now + RATE_LIMIT_INTERVAL_MS;
        }

        while (this.queue.length > 0 && this.usedWeight + this.queue[0].weight <= BINANCE_API_WEIGHT_LIMIT) {
            const request = this.queue.shift();
            if (request) {
                this.usedWeight += request.weight;
                this.executeRequest(request);
            }
        }

        this.isProcessing = false;
        
        if (this.queue.length > 0) {
            setTimeout(() => this.processQueue(), 50);
        }
    },

    async executeRequest(req: QueuedRequest) {
        const { endpoint, params } = req;
        const queryString = new URLSearchParams(params as any).toString();
        const targetPath = `${endpoint}?${queryString}`;

        for (const baseUrl of API_ENDPOINTS) {
            const fullUrl = `${baseUrl}${targetPath}`;
            try {
                const response = await fetch(fullUrl, {
                    signal: AbortSignal.timeout(8000),
                    cache: 'no-store'
                });

                const usedWeightHeader = response.headers.get('x-mbx-used-weight-1m');
                if (usedWeightHeader) {
                    this.updateWeight(parseInt(usedWeightHeader, 10));
                }

                if (!response.ok) {
                    console.warn(`[Binance] Request to ${baseUrl} failed with status ${response.status}, trying next...`);
                    continue;
                }

                const data = await response.json();
                req.resolve(data);
                this.processQueue();
                return;

            } catch (error) {
                console.warn(`[Binance] Request attempt to ${baseUrl} failed:`, error);
            }
        }
        
        console.error(`[Binance] All fetch attempts failed for ${endpoint}.`);
        this.usedWeight = Math.max(0, this.usedWeight - req.weight); // Refund weight on failure
        req.reject(new Error(`Binance API request failed for ${endpoint}`));
        this.processQueue();
    },

    add(endpoint: string, params: Record<string, string | number>, weight: number = 1): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push({ resolve, reject, endpoint, params, weight });
            this.processQueue();
        });
    }
};

// --- Fonctions Utilitaires ---

export function mapTimeframeToBinance(timeframe: string): string {
    const unit = timeframe.slice(-1).toLowerCase();
    const value = timeframe.slice(0, -1);
    if (['h', 'm', 'd', 'w'].includes(unit)) {
        return `${value}${unit}`;
    }
    return '1h'; // Fallback
}

function parseRestCandle(data: any[]): Candle {
    return {
        time: parseInt(data[0], 10),
        open: parseFloat(data[1]),
        high: parseFloat(data[2]),
        low: parseFloat(data[3]),
        close: parseFloat(data[4]),
        volume: parseFloat(data[5]),
    };
}

// --- Analyse des Données WebSocket ---

export function parseWebSocketData(data: any): { isClosed: boolean; candle: Candle, pair: string } {
    const kline = data.k;
    const rawPair = data.s;
    const quoteAsset = rawPair.endsWith('USDT') ? 'USDT' : rawPair.endsWith('USDC') ? 'USDC' : '';
    if (!quoteAsset) {
        return { isClosed: kline.x, candle: {} as Candle, pair: '' };
    }
    const baseAsset = rawPair.substring(0, rawPair.length - quoteAsset.length);
    const pair = `${baseAsset}/${quoteAsset}`;
    return {
        isClosed: kline.x,
        candle: {
            time: kline.t, open: parseFloat(kline.o), high: parseFloat(kline.h),
            low: parseFloat(kline.l), close: parseFloat(kline.c), volume: parseFloat(kline.v),
        },
        pair: pair
    };
}


// --- Fonctions de Récupération de l'API ---

export async function fetchHistoricalCandles(pair: string, timeframe: string, limit: number = 1000, endTime?: number): Promise<Candle[]> {
    const symbol = pair.replace('/', '');
    const interval = mapTimeframeToBinance(timeframe);
    
    const params: Record<string, string | number> = {
        symbol,
        interval,
        limit,
    };
    if (endTime) {
        params.endTime = endTime;
    }

    try {
        const data = await BinanceRateLimiter.add('/api/v3/klines', params, 1);
        
        if (data.code === -1121) {
            console.warn(`Symbole invalide pour la récupération des données historiques : ${pair}`);
            return [];
        }
        if (!Array.isArray(data)) {
            console.warn(`Format de réponse inattendu de Binance pour ${pair}: ${JSON.stringify(data)}`);
            return [];
        }

        return data.map(parseRestCandle);
    } catch (error) {
        console.error(`Échec de la récupération des données historiques pour ${pair} :`, error);
        return [];
    }
}

export async function fetchAllHistoricalCandles(
    pair: string,
    timeframe: string,
    period: string, // "3m", "1y", "2y", "all"
    onProgress: (progress: { progress: number; messageKey: string; messagePayload?: Record<string, string | number> }) => void
): Promise<Candle[]> {
    const BINANCE_API_LIMIT = 1000;
    const now = Date.now();
    let startTime = 0;
    switch (period) {
        case '3m': startTime = now - 3 * 30 * 24 * 60 * 60 * 1000; break;
        case '1y': startTime = now - 365 * 24 * 60 * 60 * 1000; break;
        case '2y': startTime = now - 2 * 365 * 24 * 60 * 60 * 1000; break;
        case 'all': startTime = new Date('2021-01-01T00:00:00Z').getTime(); break;
        default: return fetchHistoricalCandles(pair, timeframe, 1000);
    }

    let allCandles: Candle[] = [];
    let currentEndTime = now;
    let isFirstFetch = true;
    let totalCalls = 0;
    
    const timeframeMsMap: { [key: string]: number } = { 'm': 60000, 'h': 3600000, 'd': 86400000, 'w': 604800000 };
    const binanceTf = mapTimeframeToBinance(timeframe);
    const unit = binanceTf.slice(-1);
    const value = parseInt(binanceTf.slice(0, -1));
    const timeframeMs = (timeframeMsMap[unit] || 0) * value;

    if(timeframeMs === 0) return fetchHistoricalCandles(pair, timeframe, 1000);

    const estimatedTotalCandles = (now - startTime) / timeframeMs;
    const estimatedTotalCalls = Math.ceil(estimatedTotalCandles / BINANCE_API_LIMIT);

    while (true) {
        try {
            onProgress({
                progress: Math.min(99, (totalCalls / estimatedTotalCalls) * 100),
                messageKey: 'binance_fetch_batch',
                messagePayload: { batch: totalCalls + 1, total: isFinite(estimatedTotalCalls) ? String(estimatedTotalCalls) : 'beaucoup' }
            });
            
            const newCandles = await fetchHistoricalCandles(pair, timeframe, BINANCE_API_LIMIT, isFirstFetch ? undefined : currentEndTime);
            totalCalls++;

            if (newCandles.length === 0) break;
            
            const oldestCandleTime = newCandles[0].time;
            allCandles = [...newCandles.filter(c => c.time >= startTime), ...allCandles];
            
            if (oldestCandleTime <= startTime || newCandles.length < BINANCE_API_LIMIT) break;

            currentEndTime = oldestCandleTime - 1; 
            isFirstFetch = false;
        } catch (error) {
            console.error("Erreur lors de la récupération du bloc :", error);
            throw new Error('binance_fetch_chunk_fail');
        }
    }

    onProgress({ progress: 100, messageKey: 'binance_finalizing_data' });
    const uniqueCandles = Array.from(new Map(allCandles.map(c => [c.time, c])).values());
    uniqueCandles.sort((a, b) => a.time - b.time);
    return uniqueCandles;
}

export async function fetch24hTickerData(): Promise<any[]> {
    try {
        const data = await BinanceRateLimiter.add('/api/v3/ticker/24hr', {}, 40);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Échec de la récupération des données du ticker 24h :', error);
        return [];
    }
}