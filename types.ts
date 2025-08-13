<<<<<<< HEAD

export enum NavItem {
  Dashboard = 'Tableau de bord',
  Analytics = 'Analyses',
  Settings = 'Paramètres',
  Releases = 'Publications'
}
=======
import type { ReactNode } from 'react';

// --- INTERFACES DE BASE ---

export type MarketStructureEvent = {
  type: 'BOS' | 'Choch';
  direction: 'bullish' | 'bearish';
  price: number;
  time: number;
};

export interface SwingPoint {
  candle: Candle;
  index: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Indicateurs dynamiques
  rsi?: number;
  macd?: { macd: number; signal: number; histogram: number; };
  atr?: number;
  bollingerBands?: { upper: number; middle: number; lower: number; };
  stochastic?: { k: number; d: number; };
  ichimoku?: { conversion: number; base: number; spanA: number; spanB: number; lagging: number; };
  supertrend?: { value: number; direction: number; };
  vwap?: number;
  obv?: number;
  isOB?: boolean;
  grabType?: 'high' | 'low';
  marketStructure?: MarketStructureEvent;
  fvgRange?: { bottom: number; top: number; time: number; mitigatedTime?: number; direction: 'bullish' | 'bearish' };
  obRange?: { top: number; bottom: number; time: number; direction: 'bullish' | 'bearish' };
  isLiquidityGrab?: boolean;
  // Indicateurs pré-calculés pour la performance
  htfEma?: number;
  fastEma?: number;
  slowEma?: number;
  volumeSma?: number;
  adx?: number;
  [key: string]: any; 
}

export interface PivotPoints {
  P: number;
  R1: number;
  S1: number;
  R2: number;
  S2: number;
  R3: number;
  S3: number;
}

export type TradingMode = 'Backtest' | 'Paper' | 'Live';
export type ExitReason = 'TP' | 'SL' | 'Trailing Stop' | 'Manual Close';
export type BacktestPlaybackState = 'idle' | 'playing' | 'paused' | 'loading';
export type AlertEventType = 'step' | 'signal' | 'tp' | 'sl' | 'grab';
export type SoundName = 'none' | 'chime' | 'notify' | 'success' | 'buzz';
export type Language = 'en' | 'fr';

// --- TYPES DE CONFIGURATION ---

export interface SettingConfig {
  id: string;
  labelKey?: string;
  label?: string; // Pour les stratégies générées par IA
  type: 'number' | 'toggle';
  helpTextKey?: string;
  helpText?: string; // Pour les stratégies générées par IA
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}

export interface IndicatorConfig {
  id: keyof IndicatorSettings;
  labelKey?: string;
  label?: string; // Pour les stratégies générées par IA
  icon?: ReactNode;
}

export interface IndicatorSettings {
  showFVG?: boolean;
  showOB?: boolean;
  showSwings?: boolean;
  showLiquidityGrabs?: boolean;
  showVolumeProfile?: boolean;
  showVolumeAnomaly?: boolean;
  showPivots?: boolean;
  showFastEma?: boolean;
  showSlowEma?: boolean;
  showRsi?: boolean;
  showMacd?: boolean;
  showAtr?: boolean;
  showBollingerBands?: boolean;
  showStochastic?: boolean;
  showIchimoku?: boolean;
  showSupertrend?: boolean;
  showVwap?: boolean;
  showObv?: boolean;
  showDivergence?: boolean;
  [key: string]: boolean | undefined;
}

export interface GlobalRiskSettings {
    totalCapital: number;
    confirmTrades: boolean;
    commission: number;
    slippage: number;
    useBnbFees: boolean;
    riskManagementMode: 'pro' | 'simple';
    riskPerTrade: number;
    maxConcurrentRisk: number;
    fixedPositionAmount: number;
    maxOpenPositions: number;
}

export interface SocialSettings {
  telegramHandle: string;
  twitterHandle: string;
  instagramHandle: string;
}

export interface SoundSettings {
    entry: SoundName;
    grab: SoundName;
    tp: SoundName;
    sl: SoundName;
}

// --- TYPES DE STRATÉGIE ---

interface BaseStrategySettings {
    strategyId: string;
    enabled: boolean;
}

export interface OrderFlowSettings extends BaseStrategySettings {
    strategyId: 'order-flow-smc';
    htfEmaPeriod: number;
    swingLookback: number;
    zoneSearchWindow: number;
    riskRewardRatio: number;
    trailingStop: number;
    mtfTimeframe: string;
}

export interface ScalpingSettings extends BaseStrategySettings {
    strategyId: 'scalping-ema-cross';
    fastEmaPeriod: number;
    slowEmaPeriod: number;
    trailingStop: number;
    adxPeriod: number;
    adxThreshold: number;
    useMtfFilter: boolean;
    mtfTimeframe: string;
    mtfEmaPeriod: number;
    riskRewardRatio: number;
    swingLookbackForSL: number;
}

export interface VolumeAnomalySettings extends BaseStrategySettings {
    strategyId: 'volume-anomaly-scalper';
    volumeSmaPeriod: number;
    volumeFactor: number;
    riskRewardRatio: number;
    stopLossPercent: number;
}

export interface RsiDivergenceSettings extends BaseStrategySettings {
    strategyId: 'rsi-divergence-hunter';
    rsiPeriod: number;
    rsiOversoldThreshold: number;
    confirmationCandleLookback: number;
    riskRewardRatio: number;
    swingLookbackForSL: number;
}

export interface TestSettings extends BaseStrategySettings {
    strategyId: 'test-strategy';
    stopLossPercent: number;
    riskRewardRatio: number;
}

export type StrategySettings = OrderFlowSettings | ScalpingSettings | VolumeAnomalySettings | RsiDivergenceSettings | TestSettings;
export type AllStrategySettingsKeys = keyof OrderFlowSettings | keyof ScalpingSettings | keyof VolumeAnomalySettings | keyof RsiDivergenceSettings | keyof TestSettings;

export interface Condition {
    type: string;
    params_ref?: Partial<Record<string, AllStrategySettingsKeys>>;
    detailsKey?: string;
    details?: string;
    detailsPayload?: Record<string, string | number>;
}

export interface StrategyStep {
    nameKey?: string;
    name?: string;
    status: StepStatus;
    detailsKey?: string;
    details?: string;
    detailsPayload?: Record<string, string | number>;
}

export interface DeclarativeStrategyLogic {
    indicatorsToProcess: ('SMC' | 'EMA' | 'ADX' | 'VolumeSMA' | 'RSI' | 'HTF_EMA' | 'MACD' | 'ATR' | 'BollingerBands' | 'Stochastic' | 'Ichimoku' | 'Supertrend' | 'VWAP' | 'OBV')[];
    steps: { nameKey?: string; name?: string; conditions: Condition[]; }[];
    exitLogic: {
        stopLoss: { type: 'swing_low' | 'percent_below_low' | 'atr' | 'fixed_percent'; params_ref: Partial<Record<string, AllStrategySettingsKeys>>; };
        takeProfit: { type: 'rr_ratio' | 'atr'; params_ref: Partial<Record<string, AllStrategySettingsKeys>>; };
        trailingStop?: { type: 'percent'; params_ref: Partial<Record<string, AllStrategySettingsKeys>>; };
    };
}

export interface ImperativeStrategyLogic {
    run: (candles: Candle[], settings: StrategySettings, pair: string, isSignalOnly: boolean, prevState?: StrategyState, htfCandles?: Candle[]) => StrategyState;
    processCandles?: (candles: Candle[], settings: StrategySettings, htfCandles?: Candle[]) => Candle[];
}

export type StrategyLogic = DeclarativeStrategyLogic | ImperativeStrategyLogic;

export interface StrategyDefinition {
  id: string;
  nameKey?: string;
  name?: string;
  logic: StrategyLogic;
  defaultSettings: StrategySettings;
  settingsConfig: SettingConfig[];
  indicatorConfig: IndicatorConfig[];
  descriptionKey?: string;
  description?: string;
  chartRenderer: 'lightweight' | 'tradingview';
  getInitialSteps?: () => StrategyStep[];
}

// --- TYPES DE DONNÉES DE L'APPLICATION ---

export interface Trade {
    id: string;
    sessionId: string;
    pair: string;
    strategyId: string;
    strategyNameKey?: string;
    strategyName?: string;
    timeframe: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    time: number;
    mode: TradingMode;
    status: 'open' | 'closed' | 'pending';
    sl: number;
    tp: number;
    exitPrice?: number;
    exitTime?: number;
    exitReason?: ExitReason;
    pnl?: number;
    pnlAmount?: number;
    trailingStopPrice?: number;
    highestPriceSoFar?: number;
    lowestPriceSoFar?: number;
    positionSize: number;
    plannedRR?: number;
    realizedRR?: number;
    duration?: string;
    durationMs?: number;
}

export interface Alert {
    type: 'grab' | 'entry' | 'info' | 'short-entry';
    messageKey: string;
    messagePayload?: Record<string, string | number>;
    time: number;
    direction?: 'LONG' | 'SHORT';
    sl?: number;
    tp?: number;
    entryPrice?: number;
}

export type StepStatus = 'met' | 'waiting' | 'pending' | 'unmet' | 'invalid';

export interface StrategyState {
    steps: StrategyStep[];
    alert: Alert | null;
    strategyId?: string;
    signalFired?: boolean;
    lastProcessedTime?: number;
    [key: string]: any; 
}

export interface BacktestStats {
    netProfit: number; profitFactor: number; totalTrades: number; winningTrades: number; losingTrades: number; winRate: number;
    averageGain: number; averageLoss: number; bestTradePnl: number; worstTradePnl: number; maxDrawdown: number;
    averageDuration: string; averageWinDuration: string; averageLossDuration: string;
    averageRR: number; longestWinningStreak: number; longestLosingStreak: number;
    equityCurve: { time: number; value: number }[]; pnlDistribution: { bucket: string; count: number }[];
}

export interface BacktestSession {
  id: string; date: number; pair: string; timeframe: string; strategyId: string;
  strategyNameKey?: string; strategyName?: string; stats: BacktestStats; settings: StrategySettings;
}

export interface PortfolioBacktestStats {
    globalStats: BacktestStats;
    performanceByPair: Record<string, { netProfit: number; totalTrades: number; winRate: number; profitFactor: number }>;
}

export interface PortfolioBacktestSession {
    id: string; date: number; timeframe: string; strategyId: string; strategyNameKey?: string; strategyName?: string;
    stats: PortfolioBacktestStats; settings: StrategySettings; watchlistName: string;
}

export interface Session {
    id: string; startTime: number; endTime?: number; strategyId: string;
    strategyNameKey?: string; strategyName?: string; mode: TradingMode;
}

export interface SessionSummary {
  id: string; startTime: number; endTime: number; mode: TradingMode; strategyId: string;
  strategyNameKey?: string; strategyName?: string; stats: BacktestStats;
}

export type ScannerTimeframe = '15m' | '1H' | '4H' | '1D';
export type TrendDirection = 'any' | 'bullish' | 'bearish';
export type TrendStatusValue = 'bullish' | 'bearish' | 'neutral' | 'loading';
export type TrendStatus = Record<ScannerTimeframe, TrendStatusValue>;

export interface MarketData {
  symbol: string; baseAsset: string; quoteAsset: string; lastPrice: string;
  priceChangePercent: string; quoteVolume: string; trendStatus?: TrendStatus;
  matchedStrategyState?: StrategyState;
}

export interface ScannerFilters {
  minVolume24h: number; trendTimeframes: ScannerTimeframe[]; trendDirection: TrendDirection;
  strategyId?: string; strategyStep?: number;
}

export interface ScannerPreset { name: string; filters: ScannerFilters; }
export type WatchlistCollection = Record<string, string[]>;
export interface BinanceApiStatus { usedWeight: number; limit: number; }

export interface AlertEvent {
    id: string; time: number; pair: string; type: AlertEventType; messageKey: string;
    messagePayload?: Record<string, string | number>; timeframe: string;
    strategyName?: string; strategyNameKey?: string;
}

export interface LogEntry {
  time: number; type: 'info' | 'signal' | 'trade' | 'error' | 'risk'; messageKey: string;
  messagePayload?: Record<string, string | number>;
}

export interface HelpArticle { id: string; titleKey: string; contentKey: string; }
export interface HeatmapCellData {
    pair: string; timeframe: string; score: number; isHot: boolean; trendStrength: number;
    signalProgress: number; statusTextKey: string; statusTextPayload?: Record<string, string | number>;
}
export type HeatmapData = Map<string, HeatmapCellData>;
export interface MarketRegime {
    regime: 'trending' | 'ranging' | 'volatile';
    reasonKey: string; reasonPayload?: Record<string, string | number>;
}

// --- ZUSTAND STORE SLICES ---

export type ConfirmationAction = keyof CoreActions | keyof TradeActions | keyof BacktestActions;
export interface ConfirmationModalConfig {
    isOpen: boolean;
    titleKey: string;
    messageKey: string;
    messagePayload?: Record<string, string | number>;
    confirmAction: ConfirmationAction | null;
    confirmActionPayload?: any;
    confirmButtonTextKey: string;
    confirmButtonVariant: 'danger' | 'primary';
}


export interface CoreState {
  language: Language;
  activeStrategyId: string;
  strategyDefinitions: Map<string, StrategyDefinition>;
  tradingMode: TradingMode;
  previousTradingMode: TradingMode | null;
  timeframe: string;
  activePair: string;
  quoteAsset: 'USDT' | 'USDC';
  isDBHydrated: boolean;
  binanceApiStatus: BinanceApiStatus;
  isStrategyEngineRunning: boolean;
}
export interface CoreActions {
  setLanguage: (lang: Language) => void;
  hydrateFromDB: () => Promise<void>;
  importStrategy: (strategyJson: string) => void;
  deleteStrategy: (id: string) => void;
  setActiveStrategyId: (id: string) => void;
  _setTradingMode: (mode: TradingMode) => void;
  setTimeframe: (tf: string) => void;
  setActivePair: (pair: string) => void;
  setQuoteAsset: (asset: 'USDT' | 'USDC') => void;
  setBinanceApiStatus: (status: BinanceApiStatus) => void;
  handleModeChange: (newMode: TradingMode) => void;
  handleMasterSwitchToggle: (strategyIdentifier: string) => void;
  clearHistory: () => Promise<void>;
}
export type CoreSlice = CoreState & CoreActions;


export interface UiState {
  isSidebarCollapsed: boolean; isScannerPanelCollapsed: boolean; isBottomPanelCollapsed: boolean; isWatchlistBarOpen: boolean;
  latestAlert: Alert | null;
  confirmationModalConfig: ConfirmationModalConfig;
  showWatchlistModal: boolean; showSettingsModal: boolean; showStrategyInfoModal: boolean;
  showAiAnalysisPanel: boolean; showRobotStopModal: boolean; showAiStrategyGeneratorModal: boolean;
  showStrategyManagerModal: boolean;
  onboardingStep: number; hasCompletedOnboarding: boolean; showWelcomeModal: boolean;
  isMobileLeftPanelOpen: boolean; isMobileRightPanelOpen: boolean; isMobileBottomPanelOpen: boolean;
  isHelpModalOpen: boolean;
  activeHelpArticleId: string | null;
}
export interface UiActions {
  toggleSidebar: () => void; toggleScannerPanel: () => void; toggleBottomPanel: () => void;
  setIsWatchlistBarOpen: (isOpen: boolean) => void;
  setLatestAlert: (alert: Alert | null) => Promise<void>;
  showConfirmation: (config: Omit<ConfirmationModalConfig, 'isOpen'>) => void;
  hideConfirmation: () => void;
  executeConfirmation: () => void;
  setShowWatchlistModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void; setShowStrategyInfoModal: (show: boolean) => void;
  setShowAiAnalysisPanel: (show: boolean) => void; setShowRobotStopModal: (show: boolean) => void;
  setShowAiStrategyGeneratorModal: (show: boolean) => void;
  setShowStrategyManagerModal: (show: boolean) => void;
  startOnboarding: () => void; nextOnboardingStep: () => void; endOnboarding: () => void;
  setShowWelcomeModal: (show: boolean) => void;
  toggleMobileLeftPanel: () => void; toggleMobileRightPanel: () => void; toggleMobileBottomPanel: () => void; closeMobilePanels: () => void;
  openHelpModal: (articleId: string) => void;
  closeHelpModal: () => void;
}
export type UiSlice = UiState & UiActions;
export interface OnboardingStepConfig {
  targetId: string;
  titleKey: string;
  contentKey: string;
  placement: 'bottom' | 'top' | 'left' | 'right';
  isActionable?: boolean;
}


export interface DataState {
  rawCandlesMap: Map<string, Candle[]>;
  processedCandlesMap: Map<string, Candle[]>;
  htfCandlesMap: Map<string, Candle[]>;
  strategyStateMap: Map<string, StrategyState>;
  isDataLoading: boolean; lastTickTime: number;
  heatmapData: HeatmapData; marketRegime: MarketRegime | null;
}
export interface DataActions {
  setRawCandlesMap: (map: Map<string, Candle[]>) => void;
  setProcessedCandlesMap: (map: Map<string, Candle[]>) => void;
  setHtfCandlesMap: (map: Map<string, Candle[]>) => void; 
  updateCandle: (pair: string, candle: Candle) => void;
  setStrategyStateMap: (map: Map<string, StrategyState>) => void; 
  updateStrategyState: (pair: string, state: StrategyState) => void;
  setIsDataLoading: (isLoading: boolean) => void; 
  setLastTickTime: (time: number) => void;
  setHeatmapData: (data: HeatmapData) => void; 
  setMarketRegime: (regime: MarketRegime | null) => void;
}
export type DataSlice = DataState & DataActions;


export interface TradeState {
  trades: Trade[]; openTrades: Map<TradingMode, Trade[]>;
  pendingTrade: Omit<Trade, 'id' | 'mode' | 'status'> | null;
  logs: LogEntry[]; alertFeed: AlertEvent[];
  currentSession: Map<TradingMode, Session | null>;
  sessionHistory: SessionSummary[]; selectedSessionFromHistory: SessionSummary | null;
  showSessionStartModal: boolean;
}
export interface TradeActions {
  addTrade: (trade: Trade) => void; addOpenTrade: (trade: Trade) => void;
  closeTrade: (tradeId: string, exitPrice: number, exitReason: ExitReason) => void;
  setPendingTrade: (trade: Omit<Trade, 'id' | 'mode' | 'status'> | null) => void;
  addLog: (log: Omit<LogEntry, 'time'>) => void;
  addAlertToFeed: (alert: Omit<AlertEvent, 'id' | 'time' | 'strategyName' | 'strategyNameKey'>) => void;
  reviewEventInChart: (event: AlertEvent) => void; exitReviewMode: () => void;
  addSessionToHistory: (session: SessionSummary) => void; clearSessionHistory: () => void;
  setSelectedSessionFromHistory: (session: SessionSummary | null) => void;
  manualCloseTrade: (tradeId: string) => void; confirmTrade: (payload?: { sizeMultiplier: number }) => void;
  continueSession: () => void; startNewSession: (mode: TradingMode, strategyIdentifier: string) => void;
  startNewSessionAndCloseTrades: (strategyIdentifier: string) => void; startNewSessionAndMigrateTrades: (strategyIdentifier: string) => void;
  stopRobotAndCloseTrades: () => void; stopRobotAndKeepTrades: () => void;
  setShowSessionStartModal: (show: boolean) => void;
  calculatePositionSize: (entryPrice: number, stopLoss: number) => number;
}
export type TradeSlice = TradeState & TradeActions;


export interface BacktestState {
  isVisualBacktest: boolean;
  backtestHistoricalData: Candle[]; backtestPlaybackState: BacktestPlaybackState;
  backtestCandleIndex: number; backtestSpeed: number; backtestClosedTrades: Trade[];
  backtestHistory: BacktestSession[]; selectedBacktestSession: BacktestSession | null;
  backtestLoadingProgress: BacktestLoadingProgress;
  portfolioBacktestSession: PortfolioBacktestSession | null; showPortfolioSummaryModal: boolean;
  isOptimizing: boolean; optimizationProgress: number; optimizationResults: OptimizationResult[] | null;
  comparisonSessionIds: string[]; showComparisonModal: boolean;
}
export interface BacktestActions {
  setIsVisualBacktest: (isVisual: boolean) => void; startBacktest: (pair: string, timeframe: string, period: string) => void;
  runQuickBacktest: (pair: string, timeframe: string, period: string, strategyIdentifier: string) => void;
  runPortfolioBacktest: (timeframe: string, period: string, strategyIdentifier: string) => void;
  setBacktestPlaybackState: (state: BacktestPlaybackState) => void; setBacktestHistoricalData: (data: Candle[]) => void;
  setBacktestCandleIndex: (index: number) => void; setBacktestSpeed: (speed: number) => void;
  addBacktestClosedTrade: (trade: Trade) => void; setSelectedBacktestSession: (session: BacktestSession | null) => void;
  addBacktestToHistory: (session: BacktestSession) => void; clearBacktestHistory: () => void;
  resetBacktest: () => void; setBacktestLoadingProgress: (progress: Partial<BacktestLoadingProgress>) => void;
  setPortfolioBacktestSession: (session: PortfolioBacktestSession | null) => void; setShowPortfolioSummaryModal: (show: boolean) => void;
  startOptimization: (params: OptimizationParameterConfig[]) => void; clearOptimizationResults: () => void;
  applyOptimizationSettings: (settings: StrategySettings) => void;
  toggleComparisonSessionId: (sessionId: string) => void; setShowComparisonModal: (show: boolean) => void;
}
export type BacktestSlice = BacktestState & BacktestActions;
export interface BacktestLoadingProgress { isLoading: boolean; messageKey: string; messagePayload?: Record<string, string | number>; progress: number; }
export interface OptimizationParameterConfig { id: keyof StrategySettings; start: number; end: number; step: number; }
export interface OptimizationResult { settings: StrategySettings; stats: BacktestStats; }


export interface ScannerState {
  isScanning: boolean; scannerResults: MarketData[]; scannerFilters: ScannerFilters;
  scannerPresets: ScannerPreset[]; activePresetName: string | null; isPresetManagerOpen: boolean;
}
export interface ScannerActions {
  setScannerFilters: (filters: Partial<ScannerFilters>) => void; runMarketScan: () => Promise<void>;
  selectPairFromScanner: (scannerResult: MarketData) => void;
  saveScannerPreset: (name: string, filters: ScannerFilters) => void; loadScannerPreset: (name: string) => void;
  deleteScannerPreset: (name: string) => void; setActivePresetName: (name: string | null) => void;
  setIsPresetManagerOpen: (isOpen: boolean) => void;
}
export type ScannerSlice = ScannerState & ScannerActions;
export interface PairScannerInfo {
  isHot: boolean;
  status: string;
  completedSteps: number;
  activeStepIndex: number | null;
}

export interface AiCopilotSuggestion {
  settings: Partial<StrategySettings>;
  rationale: string;
}

export interface AiState {
  aiState: { analysis: string; isLoading: boolean; error: string; };
  aiCopilotSuggestions: AiCopilotSuggestion[] | null; isCopilotLoading: boolean; aiCopilotError: string | null;
  aiStrategyGeneratorState: { isLoading: boolean; generatedStrategyJson: string | null; error: string | null; };
}
export interface AiActions {
  setAiState: (update: Partial<AiState['aiState']>) => void;
  requestCopilotSuggestions: (userPrompt: string, systemInstruction: string) => Promise<void>;
  clearCopilotSuggestions: () => void;
  generateAiStrategy: (prompt: string) => Promise<void>; clearAiStrategyGenerator: () => void;
}
export type AiSlice = AiState & AiActions;


export interface SettingsState {
  soundSettings: SoundSettings; allWatchlists: WatchlistCollection; activeWatchlistName: string;
  strategySettingsMap: Record<string, StrategySettings>; indicatorSettings: IndicatorSettings;
  globalRiskSettings: GlobalRiskSettings; socialSettings: SocialSettings;
}
export interface SettingsActions {
  setSoundSettings: (settings: SoundSettings) => void;
  updateWatchlists: (newCollection: WatchlistCollection, newActiveName: string) => void;
  updateStrategySettings: (updater: (prev: StrategySettings) => StrategySettings) => void;
  resetStrategySettings: () => void;
  setIndicatorSettings: (updater: React.SetStateAction<IndicatorSettings>) => void;
  setGlobalRiskSettings: (updater: React.SetStateAction<GlobalRiskSettings>) => void;
  setSocialSettings: (settings: SocialSettings) => void;
}
export type SettingsSlice = SettingsState & SettingsActions;

export interface SecurityState {
  geminiApiKey: string | null;
  binanceApiKey: string | null;
  binanceApiSecret: string | null;
  isTauri: boolean;
}
export interface SecurityActions {
  checkIsTauri: () => void;
  setApiKeys: (keys: { gemini: string; binanceKey: string; binanceSecret: string; }) => Promise<void>;
  loadApiKeys: () => Promise<void>;
}
export type SecuritySlice = SecurityState & SecurityActions;


export interface AppState extends CoreSlice, UiSlice, DataSlice, TradeSlice, BacktestSlice, ScannerSlice, AiSlice, SettingsSlice, SecuritySlice {}
>>>>>>> 5611a383835355478ce2f9664b79ce8c0d75787a
