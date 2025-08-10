const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Finnhub API configuration
const FINNHUB_API_KEY = 'cshd2c9r01qp5dp3k6pgcshd2c9r01qp5dp3k6q0';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Routes

// Get stock data
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { period = '1d', range = '1mo' } = req.query;

        console.log(`Fetching stock data for ${symbol} with period: ${period}, range: ${range}`);

        // Map frontend periods to valid Yahoo Finance intervals
        const intervalMapping = {
            '1m': '1d',    // 1 minute -> daily data
            '2m': '1d',    // 2 minute -> daily data
            '5m': '1d',    // 5 minute -> daily data
            '15m': '1d',   // 15 minute -> daily data
            '30m': '1d',   // 30 minute -> daily data
            '60m': '1d',   // 60 minute -> daily data
            '90m': '1d',   // 90 minute -> daily data
            '1h': '1d',    // 1 hour -> daily data
            '1d': '1d',    // 1 day -> daily data
            '5d': '1d',    // 5 day -> daily data
            '1wk': '1wk',  // 1 week -> weekly data
            '1mo': '1mo',  // 1 month -> monthly data
            '3mo': '1mo'   // 3 month -> monthly data
        };

        const validInterval = intervalMapping[period] || '1d';

        const result = await yahooFinance.historical(symbol, {
            period1: range === '1d' ? '2024-01-01' : 
                     range === '5d' ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                     range === '1mo' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                     range === '3mo' ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                     range === '6mo' ? new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                     range === '1y' ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                     range === '2y' ? new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                     '2022-01-01',
            period2: new Date().toISOString().split('T')[0],
            interval: validInterval
        });

        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'No data found for the given symbol' });
        }

        // Transform data to match expected format
        const chart = {
            t: result.map(item => Math.floor(new Date(item.date).getTime() / 1000)),
            o: result.map(item => item.open),
            h: result.map(item => item.high),
            l: result.map(item => item.low),
            c: result.map(item => item.close),
            v: result.map(item => item.volume)
        };

        res.json({ chart });

    } catch (error) {
        console.error('Error fetching stock data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch stock data',
            details: error.message 
        });
    }
});

// Get current quote
app.get('/api/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        console.log(`Fetching quote for ${symbol}`);

        const result = await yahooFinance.quoteSummary(symbol, {
            modules: ['price', 'summaryDetail']
        });

        if (!result || !result.price) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        const quote = {
            c: result.price.regularMarketPrice,
            d: result.price.regularMarketChange,
            dp: result.price.regularMarketChangePercent * 100,
            h: result.price.regularMarketDayHigh,
            l: result.price.regularMarketDayLow,
            o: result.price.regularMarketOpen,
            pc: result.price.regularMarketPreviousClose,
            t: Math.floor(new Date().getTime() / 1000)
        };

        res.json(quote);

    } catch (error) {
        console.error('Error fetching quote:', error);
        res.status(500).json({ 
            error: 'Failed to fetch quote',
            details: error.message 
        });
    }
});

// Get company information
app.get('/api/company/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        console.log(`Fetching company info for ${symbol}`);

        const result = await yahooFinance.quoteSummary(symbol, {
            modules: ['assetProfile', 'summaryDetail', 'price']
        });

        if (!result) {
            return res.status(404).json({ error: 'Company information not found' });
        }

        const companyInfo = {
            name: result.price?.shortName || result.price?.longName || 'N/A',
            industry: result.assetProfile?.industry || 'N/A',
            sector: result.assetProfile?.sector || 'N/A',
            country: result.assetProfile?.country || 'N/A',
            website: result.assetProfile?.website || 'N/A',
            description: result.assetProfile?.longBusinessSummary || 'N/A',
            employees: result.assetProfile?.fullTimeEmployees || 0,
            marketCap: result.summaryDetail?.marketCap || 0,
            exchange: result.price?.exchangeName || 'N/A',
            currency: result.price?.currency || 'USD',
            finnhubIndustry: result.assetProfile?.industry || 'N/A'
        };

        res.json(companyInfo);

    } catch (error) {
        console.error('Error fetching company info:', error);
        res.status(500).json({ 
            error: 'Failed to fetch company information',
            details: error.message 
        });
    }
});

// Search stocks
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length < 1) {
            return res.json([]);
        }

        console.log(`Searching for: ${q}`);

        const result = await yahooFinance.search(q, {
            quotesCount: 10,
            newsCount: 0
        });

        const stocks = result.quotes
            .filter(quote => quote.typeDisp === 'Equity' && quote.exchange)
            .map(quote => ({
                symbol: quote.symbol,
                description: quote.longname || quote.shortname || quote.symbol,
                type: 'Common Stock',
                exchange: quote.exchange
            }));

        res.json(stocks);

    } catch (error) {
        console.error('Error searching stocks:', error);
        res.status(500).json({ 
            error: 'Failed to search stocks',
            details: error.message 
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Stock Trading API Server running on port ${PORT}`);
    console.log(`📊 Available endpoints:`);
    console.log(`   GET  /api/stock/:symbol      - Get historical stock data`);
    console.log(`   GET  /api/quote/:symbol      - Get current stock quote`);
    console.log(`   GET  /api/company/:symbol    - Get company information`);
    console.log(`   GET  /api/search?q=query     - Search for stocks`);
    console.log(`   GET  /health                 - Health check`);
});