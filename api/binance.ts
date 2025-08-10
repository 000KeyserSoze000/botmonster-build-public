
// api/binance.ts

export const config = {
  runtime: 'edge',
};

// All official Spot API clusters
const API_ENDPOINTS = [
    'https://api.binance.com',
    'https://api1.binance.com',
    'https://api2.binance.com',
    'https://api3.binance.com'
];

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { endpoint, params } = await request.json();

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Missing endpoint in request body' }), { status: 400 });
    }

    const queryString = new URLSearchParams(params as any).toString();
    const targetPath = `${endpoint}?${queryString}`;

    for (const baseUrl of API_ENDPOINTS) {
      const fullUrl = `${baseUrl}${targetPath}`;
      try {
        const response = await fetch(fullUrl, {
          signal: AbortSignal.timeout(8000), // 8-second timeout for each request
          cache: 'no-store'
        });

        if (!response.ok) {
          console.warn(`[Proxy] Request to ${baseUrl} failed with status ${response.status}, trying next...`);
          continue;
        }

        await response.clone().json();

        const usedWeight = response.headers.get('x-mbx-used-weight-1m');
        const headers = new Headers({
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'x-mbx-used-weight-1m',
        });

        if (usedWeight) {
            headers.set('x-mbx-used-weight-1m', usedWeight);
        }

        return new Response(response.body, {
            status: 200,
            headers: headers,
        });

      } catch (error) {
        console.warn(`[Proxy] Request attempt to ${baseUrl} failed:`, error);
      }
    }
    
    console.error('[Proxy] All sequential fetch attempts to Binance failed.');
    return new Response(JSON.stringify({ error: 'Binance API proxy failed after trying all endpoints' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Proxy] Error parsing request body:', error);
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
