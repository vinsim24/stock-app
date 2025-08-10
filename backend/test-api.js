// Simple test file to check Finnhub API directly
const axios = require('axios');
require('dotenv').config();

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

async function testFinnhubAPI() {
  try {
    console.log('Testing Finnhub API with key:', FINNHUB_API_KEY);
    
    // Test 1: Basic quote
    console.log('\n1. Testing basic quote...');
    const quoteResponse = await axios.get(`${FINNHUB_BASE_URL}/quote?symbol=AAPL&token=${FINNHUB_API_KEY}`);
    console.log('Quote response:', quoteResponse.data);
    
    // Test 2: Company profile
    console.log('\n2. Testing company profile...');
    const profileResponse = await axios.get(`${FINNHUB_BASE_URL}/stock/profile2?symbol=AAPL&token=${FINNHUB_API_KEY}`);
    console.log('Profile response:', profileResponse.data);
    
    // Test 3: Candles with different parameters
    console.log('\n3. Testing candles...');
    const to = Math.floor(Date.now() / 1000);
    const from = to - (7 * 24 * 60 * 60); // 7 days ago
    
    const candlesUrl = `${FINNHUB_BASE_URL}/stock/candle?symbol=AAPL&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
    console.log('Candles URL:', candlesUrl);
    
    const candlesResponse = await axios.get(candlesUrl);
    console.log('Candles response:', candlesResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testFinnhubAPI();
