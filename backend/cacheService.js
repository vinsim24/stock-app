const redis = require('redis');

class CacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            console.log(`Connecting to Redis at: ${redisUrl}`);
            
            this.client = redis.createClient({
                url: redisUrl,
                retry_strategy: (options) => {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        console.log('Redis connection refused, retrying...');
                        return Math.min(options.attempt * 100, 3000);
                    }
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        return new Error('Retry time exhausted');
                    }
                    if (options.attempt > 10) {
                        return undefined;
                    }
                    return Math.min(options.attempt * 100, 3000);
                }
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('✅ Redis connected successfully');
                this.isConnected = true;
            });

            this.client.on('ready', () => {
                console.log('✅ Redis client ready');
                this.isConnected = true;
            });

            this.client.on('end', () => {
                console.log('Redis connection ended');
                this.isConnected = false;
            });

            await this.client.connect();
            return true;
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.isConnected = false;
            return false;
        }
    }

    async get(key) {
        if (!this.isConnected || !this.client) {
            return null;
        }
        
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    }

    async set(key, value, expireInSeconds = 3600) {
        if (!this.isConnected || !this.client) {
            return false;
        }
        
        try {
            await this.client.setEx(key, expireInSeconds, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Redis SET error:', error);
            return false;
        }
    }

    async del(key) {
        if (!this.isConnected || !this.client) {
            return false;
        }
        
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error('Redis DEL error:', error);
            return false;
        }
    }

    async exists(key) {
        if (!this.isConnected || !this.client) {
            return false;
        }
        
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Redis EXISTS error:', error);
            return false;
        }
    }

    async flushAll() {
        if (!this.isConnected || !this.client) {
            return false;
        }
        
        try {
            await this.client.flushAll();
            return true;
        } catch (error) {
            console.error('Redis FLUSHALL error:', error);
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            try {
                await this.client.disconnect();
                console.log('Redis disconnected');
            } catch (error) {
                console.error('Error disconnecting Redis:', error);
            }
        }
    }

    // Cache key generators
    getStockDataKey(symbol, period, range) {
        return `stock:${symbol.toLowerCase()}:${period}:${range}`;
    }

    getQuoteKey(symbol) {
        return `quote:${symbol.toLowerCase()}`;
    }

    getCompanyInfoKey(symbol) {
        return `company:${symbol.toLowerCase()}`;
    }

    getSearchKey(query) {
        return `search:${query.toLowerCase()}`;
    }

    // Cache duration constants (in seconds)
    get CACHE_DURATIONS() {
        return {
            HISTORICAL_DATA: 3600,    // 1 hour for historical data
            LIVE_QUOTE: 60,           // 1 minute for live quotes
            COMPANY_INFO: 86400,      // 24 hours for company info
            SEARCH_RESULTS: 1800      // 30 minutes for search results
        };
    }
}

module.exports = new CacheService();
