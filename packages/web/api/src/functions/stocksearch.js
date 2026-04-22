const { app } = require('@azure/functions');

const YAHOO_HEADERS = {
    'Referer': 'https://finance.yahoo.com/',
    'Origin': 'https://finance.yahoo.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
};

app.http('stocksearch', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request) => {
        const query = request.query.get('q');
        const quotesCount = request.query.get('quotesCount') || '10';
        const newsCount = request.query.get('newsCount') || '0';
        const listsCount = request.query.get('listsCount') || '0';

        if (!query) {
            return { status: 400, body: 'q query param is required' };
        }

        const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=${quotesCount}&newsCount=${newsCount}&listsCount=${listsCount}`;

        const upstream = await fetch(url, { headers: YAHOO_HEADERS });
        const body = await upstream.text();

        return {
            status: upstream.status,
            headers: { 'Content-Type': 'application/json' },
            body,
        };
    },
});
