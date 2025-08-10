# Redis Cache Inspection Guide

## Overview
This guide shows you how to view and inspect the contents of your Redis cache for the Stock Trading Application.

## Method 1: Backend API Endpoints (Recommended)

### 1. List All Cache Keys
```bash
curl http://localhost:3001/api/cache/keys
```
**Returns:**
- Total number of keys
- List of all keys with TTL, type, and category
- Organized by cache categories (stock, quote, company, search)

**Example Output:**
```json
{
  "totalKeys": 12,
  "keys": [
    {
      "key": "stock:aapl:1d:1mo",
      "ttl": "3048s",
      "type": "string",
      "category": "stock"
    },
    {
      "key": "search:apple",
      "ttl": "1241s",
      "type": "string",
      "category": "search"
    }
  ]
}
```

### 2. Inspect Specific Cache Key
```bash
curl "http://localhost:3001/api/cache/inspect/CACHE_KEY"
```
**Examples:**
```bash
# Inspect stock data
curl "http://localhost:3001/api/cache/inspect/stock:aapl:1d:1mo"

# Inspect search results
curl "http://localhost:3001/api/cache/inspect/search:apple"

# Inspect company info
curl "http://localhost:3001/api/cache/inspect/company:aapl"

# Inspect quote data
curl "http://localhost:3001/api/cache/inspect/quote:aapl"
```

**Returns:**
- Full cached data (JSON parsed)
- TTL information
- Cache key metadata
- Data size in bytes

### 3. Cache Management
```bash
# Check cache status
curl http://localhost:3001/api/cache/status

# Clear all cache
curl -X DELETE http://localhost:3001/api/cache/clear

# Delete specific key
curl -X DELETE "http://localhost:3001/api/cache/key/search:apple"
```

## Method 2: Direct Redis CLI Access

### 1. Interactive Redis CLI
```bash
docker exec -it stock-app-redis redis-cli
```

Once inside the CLI, you can use these commands:
```redis
# List all keys
KEYS *

# List keys by pattern
KEYS stock:*
KEYS quote:*
KEYS search:*
KEYS company:*

# Get value of specific key
GET "stock:aapl:1d:1mo"

# Check TTL (time to live)
TTL "stock:aapl:1d:1mo"

# Check if key exists
EXISTS "stock:aapl:1d:1mo"

# Get key type
TYPE "stock:aapl:1d:1mo"

# Delete specific key
DEL "stock:aapl:1d:1mo"

# Clear all cache
FLUSHALL

# Exit CLI
EXIT
```

### 2. Non-Interactive Redis Commands
```bash
# List all keys
docker exec stock-app-redis redis-cli KEYS "*"

# Get specific key value
docker exec stock-app-redis redis-cli GET "search:apple"

# Check TTL
docker exec stock-app-redis redis-cli TTL "search:apple"

# Delete key
docker exec stock-app-redis redis-cli DEL "search:apple"

# Get Redis info
docker exec stock-app-redis redis-cli INFO memory
```

## Cache Key Patterns

| Pattern | Description | Example | TTL |
|---------|-------------|---------|-----|
| `stock:{symbol}:{period}:{range}` | Historical stock data | `stock:aapl:1d:1mo` | 1 hour |
| `quote:{symbol}` | Live stock quotes | `quote:aapl` | 1 minute |
| `company:{symbol}` | Company information | `company:aapl` | 24 hours |
| `search:{query}` | Search results | `search:apple` | 30 minutes |

## Understanding TTL Values

- `3600s` = 1 hour (stock data)
- `60s` = 1 minute (quotes)
- `86400s` = 24 hours (company info)
- `1800s` = 30 minutes (search results)
- `never` = No expiration

## Cache Categories

### Stock Data (`stock:*`)
Contains historical price data with OHLCV values:
```json
{
  "chart": {
    "t": [timestamps],
    "o": [open_prices],
    "h": [high_prices],
    "l": [low_prices],
    "c": [close_prices],
    "v": [volumes]
  },
  "symbol": "AAPL",
  "period": "1d",
  "range": "1mo"
}
```

### Quote Data (`quote:*`)
Contains current stock quote information:
```json
{
  "c": 229.35,     // current price
  "d": 9.32,       // change
  "dp": 4.24,      // change percent
  "h": 230.99,     // high
  "l": 219.25,     // low
  "o": 220.82,     // open
  "pc": 220.03     // previous close
}
```

### Company Info (`company:*`)
Contains company details:
```json
{
  "name": "Apple Inc.",
  "industry": "Consumer Electronics",
  "sector": "Technology",
  "country": "United States",
  "employees": 150000,
  "marketCap": 3500000000000
}
```

### Search Results (`search:*`)
Contains stock search results:
```json
{
  "query": "apple",
  "results": [
    {
      "symbol": "AAPL",
      "description": "Apple Inc.",
      "type": "Common Stock",
      "exchange": "NMS"
    }
  ]
}
```

## Redis Memory Usage

Check Redis memory usage:
```bash
# Memory info
docker exec stock-app-redis redis-cli INFO memory

# Key count
docker exec stock-app-redis redis-cli DBSIZE

# Memory usage by key
docker exec stock-app-redis redis-cli MEMORY USAGE "stock:aapl:1d:1mo"
```

## Monitoring Cache Performance

### Cache Hit/Miss Monitoring
Monitor backend logs for cache performance:
```bash
docker-compose logs backend | grep -E "(Cache HIT|Cache MISS)"
```

Look for these log patterns:
- `📦 Cache HIT for {symbol}` - Data served from cache
- `🌐 Cache MISS - Fetching fresh data for {symbol}` - Data fetched from API
- `💾 Cached data for {symbol}` - Data stored in cache

### Performance Metrics
You can track:
- Cache hit ratio (hits vs misses)
- Response times (cached vs API calls)
- Memory usage growth
- Key expiration patterns

## Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is running
docker ps | grep redis

# Check Redis logs
docker-compose logs redis

# Test Redis connectivity
docker exec stock-app-redis redis-cli ping
```

### Cache Not Working
1. Check backend logs for Redis connection errors
2. Verify Redis service is running in Docker
3. Test cache endpoints manually
4. Check if keys are being created

### Memory Issues
If Redis runs out of memory:
```bash
# Check current memory usage
docker exec stock-app-redis redis-cli INFO memory

# Clear cache if needed
curl -X DELETE http://localhost:3001/api/cache/clear
```

## Quick Reference Commands

```bash
# View all cache contents (formatted)
curl -s http://localhost:3001/api/cache/keys | ConvertFrom-Json | ConvertTo-Json -Depth 3

# Count cache keys by category
docker exec stock-app-redis redis-cli KEYS "stock:*" | wc -l
docker exec stock-app-redis redis-cli KEYS "quote:*" | wc -l
docker exec stock-app-redis redis-cli KEYS "search:*" | wc -l
docker exec stock-app-redis redis-cli KEYS "company:*" | wc -l

# Monitor Redis in real-time
docker exec stock-app-redis redis-cli MONITOR
```
