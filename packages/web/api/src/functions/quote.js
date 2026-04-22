const { app } = require('@azure/functions');

const YAHOO_HEADERS = {
    'Referer': 'https://finance.yahoo.com/',
    'Origin': 'https://finance.yahoo.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
};

app.http('quote', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request) => {
        const symbol = request.query.get('symbol');
        const interval = request.query.get('interval') || '1d';
        const range = request.query.get('range') || '1d';

        if (!symbol) {
            return { status: 400, body: 'symbol query param is required' };
        }

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

        const upstream = await fetch(url, { headers: YAHOO_HEADERS });
        const body = await upstream.text();

        return {
            status: upstream.status,
            headers: { 'Content-Type': 'application/json' },
            body,
        };
    },
});
