const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;

// Suppress Yahoo Finance deprecation notices immediately after import
yahooFinance.suppressNotices(['ripHistorical']);

const cacheService = require('./cacheService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize cache service
async function initializeServices() {
    console.log('🚀 Initializing services...');
    
    // Suppress Yahoo Finance deprecation notices
    yahooFinance.suppressNotices(['ripHistorical']);
    
    await cacheService.connect();
}

// Initialize services on startup
initializeServices().catch(console.error);

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

        // Generate cache key for historical data
        const cacheKey = cacheService.getStockDataKey(symbol, period, range);
        
        // Try to get data from cache first
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
            console.log(`📦 Cache HIT for ${symbol} ${period} ${range}`);
            return res.json({
                ...cachedData,
                cached: true,
                cacheTime: new Date().toISOString()
            });
        }
        
        console.log(`🌐 Cache MISS - Fetching fresh data for ${symbol} ${period} ${range}`);

        // Map frontend periods to valid Yahoo Finance intervals
        const intervalMapping = {
            '1m': '1m',    // 1 minute
            '2m': '2m',    // 2 minute
            '5m': '5m',    // 5 minute
            '15m': '15m',  // 15 minute
            '30m': '30m',  // 30 minute
            '60m': '60m',  // 60 minute  
            '90m': '90m',  // 90 minute
            '1h': '1h',    // 1 hour
            '1d': '1d',    // 1 day
            '5d': '5d',    // 5 day
            '1wk': '1wk',  // 1 week
            '1mo': '1mo',  // 1 month
            '3mo': '3mo'   // 3 month
        };

        const validInterval = intervalMapping[period] || '1d';

        // Helper function to get start date
        const getStartDate = (range) => {
            const now = new Date();
            switch (range) {
                case '1d': return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
                case '5d': return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
                case '1mo': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                case '3mo': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                case '6mo': return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                case '2y': return new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
                default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }
        };

        const result = await yahooFinance.chart(symbol, {
            period1: getStartDate(range),
            period2: new Date(),
            interval: validInterval
        });

        if (!result || !result.quotes || result.quotes.length === 0) {
            return res.status(404).json({ error: 'No data found for the given symbol' });
        }

        // Transform data to match expected format
        const stockData = {
            chart: {
                t: result.quotes.map(quote => Math.floor(new Date(quote.date).getTime() / 1000)),
                o: result.quotes.map(quote => quote.open || quote.close),
                h: result.quotes.map(quote => quote.high || quote.close),
                l: result.quotes.map(quote => quote.low || quote.close),
                c: result.quotes.map(quote => quote.close),
                v: result.quotes.map(quote => quote.volume || 0)
            },
            symbol: symbol,
            period: period,
            range: range,
            fetchTime: new Date().toISOString()
        };

        // Cache the historical data for 1 hour
        await cacheService.set(cacheKey, stockData, cacheService.CACHE_DURATIONS.HISTORICAL_DATA);
        console.log(`💾 Cached data for ${symbol} ${period} ${range}`);

        res.json({
            ...stockData,
            cached: false
        });

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

        // Generate cache key for live quote
        const cacheKey = cacheService.getQuoteKey(symbol);
        
        // Try to get quote from cache first (short cache for live data)
        const cachedQuote = await cacheService.get(cacheKey);
        if (cachedQuote) {
            console.log(`📦 Cache HIT for quote ${symbol}`);
            return res.json({
                ...cachedQuote,
                cached: true,
                cacheTime: new Date().toISOString()
            });
        }
        
        console.log(`🌐 Cache MISS - Fetching fresh quote for ${symbol}`);

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
            t: Math.floor(new Date().getTime() / 1000),
            fetchTime: new Date().toISOString()
        };

        // Cache the live quote for 1 minute only
        await cacheService.set(cacheKey, quote, cacheService.CACHE_DURATIONS.LIVE_QUOTE);
        console.log(`💾 Cached quote for ${symbol}`);

        res.json({
            ...quote,
            cached: false
        });

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

        // Generate cache key for company info
        const cacheKey = cacheService.getCompanyInfoKey(symbol);
        
        // Try to get company info from cache first (longer cache for static data)
        const cachedInfo = await cacheService.get(cacheKey);
        if (cachedInfo) {
            console.log(`📦 Cache HIT for company info ${symbol}`);
            return res.json({
                ...cachedInfo,
                cached: true,
                cacheTime: new Date().toISOString()
            });
        }
        
        console.log(`🌐 Cache MISS - Fetching fresh company info for ${symbol}`);

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
            finnhubIndustry: result.assetProfile?.industry || 'N/A',
            fetchTime: new Date().toISOString()
        };

        // Cache company info for 24 hours (static data)
        await cacheService.set(cacheKey, companyInfo, cacheService.CACHE_DURATIONS.COMPANY_INFO);
        console.log(`💾 Cached company info for ${symbol}`);

        res.json({
            ...companyInfo,
            cached: false
        });

    } catch (error) {
        console.error('Error fetching company info:', error);
        res.status(500).json({ 
            error: 'Failed to fetch company information',
            details: error.message 
        });
    }
});

// Search stocks (Real-time, no caching for immediate results)
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length < 1) {
            return res.json({
                query: q,
                results: [],
                fetchTime: new Date().toISOString(),
                cached: false
            });
        }

        console.log(`🔍 Searching for: "${q}" (real-time)`);

        const result = await yahooFinance.search(q, {
            quotesCount: 15,
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

        const searchResults = {
            query: q,
            results: stocks,
            fetchTime: new Date().toISOString(),
            cached: false
        };

        res.json(searchResults);

    } catch (error) {
        console.error('Error searching stocks:', error);
        res.status(500).json({ 
            error: 'Failed to search stocks',
            details: error.message,
            query: req.query.q || '',
            results: [],
            cached: false
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        redis: cacheService.isConnected ? 'connected' : 'disconnected'
    });
});

// Cache management endpoints
app.get('/api/cache/status', async (req, res) => {
    try {
        res.json({
            connected: cacheService.isConnected,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get cache status' });
    }
});

app.get('/api/cache/keys', async (req, res) => {
    try {
        if (!cacheService.isConnected || !cacheService.client) {
            return res.status(503).json({ error: 'Redis not connected' });
        }

        const keys = await cacheService.client.keys('*');
        const keysWithInfo = [];

        for (const key of keys) {
            const ttl = await cacheService.client.ttl(key);
            const type = await cacheService.client.type(key);
            keysWithInfo.push({
                key,
                ttl: ttl === -1 ? 'never' : `${ttl}s`,
                type,
                category: key.split(':')[0] // stock, quote, company, search
            });
        }

        res.json({
            totalKeys: keys.length,
            keys: keysWithInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get cache keys', details: error.message });
    }
});

app.get('/api/cache/inspect/:key', async (req, res) => {
    try {
        if (!cacheService.isConnected || !cacheService.client) {
            return res.status(503).json({ error: 'Redis not connected' });
        }

        const { key } = req.params;
        const value = await cacheService.client.get(key);
        const ttl = await cacheService.client.ttl(key);
        const type = await cacheService.client.type(key);

        if (value === null) {
            return res.status(404).json({ error: 'Key not found' });
        }

        res.json({
            key,
            value: JSON.parse(value),
            ttl: ttl === -1 ? 'never' : `${ttl}s`,
            type,
            size: Buffer.byteLength(value, 'utf8'),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to inspect cache key', details: error.message });
    }
});

app.delete('/api/cache/clear', async (req, res) => {
    try {
        const success = await cacheService.flushAll();
        res.json({ 
            success,
            message: success ? 'Cache cleared successfully' : 'Failed to clear cache',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});

app.delete('/api/cache/key/:key', async (req, res) => {
    try {
        if (!cacheService.isConnected || !cacheService.client) {
            return res.status(503).json({ error: 'Redis not connected' });
        }

        const { key } = req.params;
        const result = await cacheService.client.del(key);
        
        res.json({
            success: result === 1,
            message: result === 1 ? 'Key deleted successfully' : 'Key not found',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete cache key' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Stock Trading API Server running on port ${PORT}`);
    console.log(`📊 Available endpoints:`);
    console.log(`   GET  /api/stock/:symbol      - Get historical stock data (cached: 1h)`);
    console.log(`   GET  /api/quote/:symbol      - Get current stock quote (cached: 1m)`);
    console.log(`   GET  /api/company/:symbol    - Get company information (cached: 24h)`);
    console.log(`   GET  /api/search?q=query     - Search for stocks (cached: 30m)`);
    console.log(`   GET  /health                 - Health check`);
    console.log(`💾 Cache Management:`);
    console.log(`   GET  /api/cache/status       - Cache connection status`);
    console.log(`   GET  /api/cache/keys         - List all cache keys`);
    console.log(`   GET  /api/cache/inspect/:key - Inspect specific cache key`);
    console.log(`   DELETE /api/cache/clear      - Clear all cache`);
    console.log(`   DELETE /api/cache/key/:key   - Delete specific cache key`);
    console.log(`💾 Redis caching: ${cacheService.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await cacheService.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await cacheService.disconnect();
    process.exit(0);
});