import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Search, Sun, Moon, TrendingUp } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/Select';

import TradingChart from './components/TradingChart';
import VolumeChart from './components/VolumeChart';
import RSIChart from './components/RSIChart';
import Sidebar from './components/Sidebar';
import MultiSelect from './components/ui/MultiSelect';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands
} from './lib/indicators';

function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('');
  const [chartType, setChartType] = useState('candlestick');
  const [period, setPeriod] = useState('1d');
  const [range, setRange] = useState('1mo');
  const [isDark, setIsDark] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  // Technical indicators and analysis state
  const [indicators, setIndicators] = useState({});
  const [signal, setSignal] = useState({});
  const [analysis, setAnalysis] = useState({});
  // Moving averages selection
  const [selectedMAs, setSelectedMAs] = useState([20]);

  const movingAverageOptions = [
    { value: 5, label: 'MA 5' },
    { value: 9, label: 'MA 9' },
    { value: 21, label: 'MA 21' },
    { value: 50, label: 'MA 50' },
    { value: 200, label: 'MA 200' },
  ];
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const mainChartRef = useRef();
  const volumeChartRef = useRef();
  const rsiChartRef = useRef();

  const API_BASE = 'http://localhost:3001/api';

  useEffect(() => {
    loadStockData();
    loadCompanyInfo();
    loadCurrentPrice();
  }, [symbol, period, range]);

  // Calculate technical indicators and analysis when data changes
  useEffect(() => {
    if (!currentData || !currentData.c || currentData.c.length === 0) return;
    const closing = currentData.c.map(Number);
    const high = currentData.h?.map(Number) || [];
    const low = currentData.l?.map(Number) || [];
    const volumes = currentData.v?.map(Number) || [];
    const timestamps = currentData.t || [];
    // Technical indicators
    const rsiArr = calculateRSI(closing, Math.min(14, closing.length - 1));
    const smaArr = calculateSMA(closing, Math.min(20, closing.length));
    const emaArr = calculateEMA(closing, Math.min(20, closing.length));
    const macdObj = calculateMACD(closing);
    const bollObj = calculateBollingerBands(closing, Math.min(20, closing.length));
    const currentPrice = closing[closing.length - 1];
    const currentRSI = rsiArr.length > 0 ? rsiArr[rsiArr.length - 1] : null;
    const currentSMA = smaArr.length > 0 ? smaArr[smaArr.length - 1] : null;
    const currentEMA = emaArr.length > 0 ? emaArr[emaArr.length - 1] : null;
    const currentMACD = macdObj.macd.length > 0 && macdObj.signal.length > 0 ? (macdObj.macd[macdObj.macd.length - 1] - macdObj.signal[macdObj.signal.length - 1]) : null;
    let bollingerPosition = null;
    if (bollObj.upper.length > 0 && bollObj.lower.length > 0) {
      const upperBand = bollObj.upper[bollObj.upper.length - 1];
      const lowerBand = bollObj.lower[bollObj.lower.length - 1];
      const bandRange = upperBand - lowerBand;
      bollingerPosition = ((currentPrice - lowerBand) / bandRange) * 100;
    }
    setIndicators({
      rsi: currentRSI ? currentRSI.toFixed(2) : '---',
      sma: currentSMA ? `$${currentSMA.toFixed(2)}` : '---',
      ema: currentEMA ? `$${currentEMA.toFixed(2)}` : '---',
      macd: currentMACD !== null ? currentMACD.toFixed(4) : '---',
      boll: bollingerPosition !== null ? `${bollingerPosition.toFixed(1)}%` : '---'
    });

    // Price analysis
    const prevPrice = closing[closing.length - 2];
    const change = currentPrice - prevPrice;
    const changePercent = (change / prevPrice) * 100;
    // 20-day range
    const period = Math.min(20, high.length);
    const recentHighs = high.slice(-period);
    const recentLows = low.slice(-period);
    const rangeHigh = Math.max(...recentHighs);
    const rangeLow = Math.min(...recentLows);
    const rangePosition = ((currentPrice - rangeLow) / (rangeHigh - rangeLow)) * 100;
    setAnalysis({
      price: `$${currentPrice.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}, ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%) | ${rangePosition.toFixed(1)}% of 20d range`,
      breakout: (() => {
        const resistance = rangeHigh;
        const support = rangeLow;
        if (currentPrice >= resistance * 0.99) return `BREAKOUT: Above 20d high ($${resistance.toFixed(2)})`;
        if (currentPrice <= support * 1.01) return `BREAKDOWN: Below 20d low ($${support.toFixed(2)})`;
        if (currentPrice > resistance * 0.95) return `APPROACHING RESISTANCE: $${resistance.toFixed(2)}`;
        return 'Within normal range';
      })(),
      volume: (() => {
        const currentVolume = volumes[volumes.length - 1];
        const avgVolume = volumes.slice(-period).reduce((sum, v) => sum + v, 0) / period;
        const volumeRatio = currentVolume / avgVolume;
        if (volumeRatio >= 2.0) return 'HIGH VOLUME';
        if (volumeRatio >= 1.5) return 'ABOVE AVERAGE';
        if (volumeRatio <= 0.5) return 'LOW VOLUME';
        return 'NORMAL VOLUME';
      })()
    });

    // Overall signal
    // (Simple scoring system as in vanilla)
    let bullish = 0, bearish = 0, total = 0;
    if (currentRSI) {
      total++;
      if (currentRSI > 70) bearish++;
      else if (currentRSI < 30) bullish++;
      else if (currentRSI > 50) bullish++;
      else bearish++;
    }
    if (currentSMA) {
      total++;
      if (currentPrice > currentSMA) bullish++;
      else bearish++;
    }
    // Volume
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(-period).reduce((sum, v) => sum + v, 0) / period;
    const volumeRatio = currentVolume / avgVolume;
    total++;
    if (volumeRatio > 1.5) bullish++;
    else if (volumeRatio < 0.7) bearish++;
    // Breakout
    total++;
    const priceVsResistance = currentPrice / rangeHigh;
    if (priceVsResistance > 0.99) bullish++;
    else if (priceVsResistance < 0.90) bearish++;
    const bullishPct = (bullish / total) * 100;
    let sig, conf, desc;
    if (bullishPct >= 75) {
      sig = 'STRONG BUY'; conf = 'High'; desc = 'Breakout confirmed with high volume - strong bullish signal';
    } else if (bullishPct >= 60) {
      sig = 'BUY'; conf = 'Medium'; desc = 'Multiple bullish indicators align - positive outlook';
    } else if (bullishPct >= 40) {
      sig = 'HOLD'; conf = 'Low'; desc = 'Mixed signals - wait for clearer direction';
    } else if (bullishPct >= 25) {
      sig = 'SELL'; conf = 'Medium'; desc = 'Multiple bearish indicators - consider reducing position';
    } else {
      sig = 'STRONG SELL'; conf = 'High'; desc = 'Multiple strong bearish signals - high risk environment';
    }
    setSignal({
      signal: sig,
      confidence: conf,
      timeframe: `${period}d`,
      description: desc
    });
  }, [currentData]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const loadStockData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/stock/${symbol}`, {
        params: { period, range }
      });
      
      if (response.data && response.data.chart) {
        setCurrentData(response.data.chart);
        updateCharts(response.data.chart);
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE}/company/${symbol}`);
      setCompanyInfo(response.data);
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  const loadCurrentPrice = async () => {
    try {
      const response = await axios.get(`${API_BASE}/quote/${symbol}`);
      setCurrentPrice(response.data);
    } catch (error) {
      console.error('Error loading current price:', error);
    }
  };

  const updateCharts = (data) => {
    if (mainChartRef.current) {
      mainChartRef.current.updateChart(data, chartType);
    }
    if (volumeChartRef.current) {
      volumeChartRef.current.updateChart(data);
    }
    if (rsiChartRef.current) {
      rsiChartRef.current.updateChart(data);
    }
  };

  const searchStocks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/search`, {
        params: { q: query }
      });
      setSearchResults(response.data || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    searchStocks(value);
  };

  const selectStock = (selectedSymbol, description) => {
    setSymbol(selectedSymbol);
    setSearchInput(description || selectedSymbol);
    setShowSearchResults(false);
  };

  const handleSearch = () => {
    const cleanSymbol = searchInput.trim().toUpperCase();
    if (cleanSymbol) {
      setSymbol(cleanSymbol);
      setShowSearchResults(false);
    }
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toFixed(2) : '---';
  };

  const formatChange = (change, changePercent) => {
    const isPositive = change >= 0;
    return (
      <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {isPositive ? '+' : ''}{formatPrice(change)} ({isPositive ? '+' : ''}{formatPrice(changePercent)}%)
      </span>
    );
  };

  const formatMarketCap = (marketCap) => {
    if (!marketCap || marketCap === 'N/A' || marketCap === 0) return 'N/A';
    
    const num = typeof marketCap === 'string' ? parseFloat(marketCap) : marketCap;
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1e12) {
      return `$${(num / 1e12).toFixed(2)}T`;
    } else if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b px-8 py-3 shadow-sm`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <TrendingUp className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Trading Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  className="w-56"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className={`absolute top-full mt-1 w-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto`}>
                  {searchResults.slice(0, 10).map((result, index) => (
                    <div
                      key={index}
                      className={`px-4 py-2 cursor-pointer ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-900'} border-b last:border-b-0`}
                      onClick={() => selectStock(result.symbol, `${result.symbol} - ${result.description}`)}
                    >
                      <div className="font-medium">{result.symbol}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{result.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              className={`p-2 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Charts Column */}
          <div className="space-y-6">
            {/* Main Chart */}
            <Card className="shadow-lg border border-gray-800 bg-[#23272e] rounded-xl">
              <CardHeader className="pb-2 flex flex-row items-center gap-2 border-b border-gray-700">
                <span className="text-blue-400 text-xl">📈</span>
                <CardTitle className="text-lg font-semibold tracking-tight text-blue-300">Price Chart</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                  <div>
                    <span className="block text-2xl font-bold text-white">{symbol} <span className="text-base font-normal text-gray-400">{companyInfo?.name || 'Loading...'}</span></span>
                    {currentPrice && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="px-3 py-1 rounded bg-gray-900 text-2xl font-bold text-white border border-gray-700">${formatPrice(currentPrice.c)}</span>
                        <span className={`px-2 py-1 rounded text-base font-semibold border ${currentPrice.d >= 0 ? 'bg-green-900 text-green-300 border-green-700' : 'bg-red-900 text-red-300 border-red-700'}`}>{formatChange(currentPrice.d, currentPrice.dp)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                    <div className="flex flex-col items-start gap-1">
                      <label className="text-xs text-gray-400">Chart Type:</label>
                      <Select value={chartType} onValueChange={setChartType}>
                        <SelectTrigger className="w-32"/>
                        <SelectContent>
                          <SelectItem value="candlestick">Candlestick</SelectItem>
                          <SelectItem value="line">Line</SelectItem>
                          <SelectItem value="area">Area</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <label className="text-xs text-gray-400">Period:</label>
                      <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-20"/>
                        <SelectContent>
                          <SelectItem value="1m">1m</SelectItem>
                          <SelectItem value="5m">5m</SelectItem>
                          <SelectItem value="15m">15m</SelectItem>
                          <SelectItem value="1h">1h</SelectItem>
                          <SelectItem value="1d">1d</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <label className="text-xs text-gray-400">Range:</label>
                      <Select value={range} onValueChange={setRange}>
                        <SelectTrigger className="w-20"/>
                        <SelectContent>
                          <SelectItem value="1d">1D</SelectItem>
                          <SelectItem value="5d">5D</SelectItem>
                          <SelectItem value="1mo">1M</SelectItem>
                          <SelectItem value="3mo">3M</SelectItem>
                          <SelectItem value="6mo">6M</SelectItem>
                          <SelectItem value="1y">1Y</SelectItem>
                          <SelectItem value="2y">2Y</SelectItem>
                          <SelectItem value="5y">5Y</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <label className="text-xs text-gray-400">Moving Averages:</label>
                      <MultiSelect
                        options={movingAverageOptions}
                        values={selectedMAs}
                        onChange={setSelectedMAs}
                        placeholder="Moving Averages"
                        className="w-48"
                      />
                    </div>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="text-lg text-gray-400">Loading chart data...</div>
                    </div>
                  </div>
                ) : (
                  <TradingChart
                    ref={mainChartRef}
                    data={currentData}
                    height={400}
                    chartType={chartType}
                    isDark={isDark}
                    movingAverages={selectedMAs}
                  />
                )}
              </CardContent>
            </Card>
            {/* Volume Chart */}
            <Card className="shadow">
              <CardHeader className="pb-1">
                <CardTitle className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <VolumeChart
                  ref={volumeChartRef}
                  data={currentData}
                  height={150}
                  isDark={isDark}
                />
              </CardContent>
            </Card>
            {/* RSI Chart */}
            <Card className="shadow">
              <CardHeader className="pb-1">
                <CardTitle className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>RSI (14)</CardTitle>
              </CardHeader>
              <CardContent>
                <RSIChart
                  ref={rsiChartRef}
                  data={currentData}
                  height={150}
                  isDark={isDark}
                />
              </CardContent>
            </Card>
          </div>
          {/* Sidebar: All info panels and technical analysis */}
          <Sidebar
            signal={signal}
            indicators={indicators}
            marketData={currentPrice ? {
              open: formatPrice(currentPrice.o),
              high: formatPrice(currentPrice.h),
              low: formatPrice(currentPrice.l),
              prevClose: formatPrice(currentPrice.pc)
            } : {}}
            companyInfo={companyInfo ? {
              industry: companyInfo.finnhubIndustry || companyInfo.industry,
              exchange: companyInfo.exchange,
              country: companyInfo.country,
              marketCap: formatMarketCap(companyInfo.marketCap)
            } : {}}
            analysis={analysis}
            isDark={isDark}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
