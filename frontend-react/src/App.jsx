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

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Trading Dashboard
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  className="w-64"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className={`absolute top-full mt-1 w-full ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto`}>
                  {searchResults.slice(0, 10).map((result, index) => (
                    <div
                      key={index}
                      className={`px-4 py-2 cursor-pointer ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-900'} border-b last:border-b-0`}
                      onClick={() => selectStock(result.symbol, `${result.symbol} - ${result.description}`)}
                    >
                      <div className="font-medium">{result.symbol}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {result.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDark(!isDark)}
              className={`p-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Chart */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {symbol} - {companyInfo?.name || 'Loading...'}
                    </CardTitle>
                    {currentPrice && (
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          ${formatPrice(currentPrice.c)}
                        </span>
                        <span className="text-lg">
                          {formatChange(currentPrice.d, currentPrice.dp)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Select value={chartType} onValueChange={setChartType}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="candlestick">Candlestick</SelectItem>
                        <SelectItem value="line">Line</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1m">1m</SelectItem>
                        <SelectItem value="5m">5m</SelectItem>
                        <SelectItem value="15m">15m</SelectItem>
                        <SelectItem value="1h">1h</SelectItem>
                        <SelectItem value="1d">1d</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={range} onValueChange={setRange}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
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
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loading chart data...
                      </div>
                    </div>
                  </div>
                ) : (
                  <TradingChart
                    ref={mainChartRef}
                    data={currentData}
                    height={400}
                    chartType={chartType}
                    isDark={isDark}
                  />
                )}
              </CardContent>
            </Card>

            {/* Volume Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Volume
                </CardTitle>
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  RSI (14)
                </CardTitle>
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

          {/* Technical Analysis Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            {companyInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Company Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Industry
                    </div>
                    <div className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {companyInfo.finnhubIndustry || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Market Cap
                    </div>
                    <div className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {companyInfo.marketCapitalization ? `$${(companyInfo.marketCapitalization / 1000).toFixed(2)}B` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Exchange
                    </div>
                    <div className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {companyInfo.exchange || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Country
                    </div>
                    <div className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {companyInfo.country || 'N/A'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Data */}
            {currentPrice && (
              <Card>
                <CardHeader>
                  <CardTitle className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Market Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Open</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>${formatPrice(currentPrice.o)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>High</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>${formatPrice(currentPrice.h)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Low</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>${formatPrice(currentPrice.l)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Previous Close</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>${formatPrice(currentPrice.pc)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technical Indicators Summary */}
            <Card>
              <CardHeader>
                <CardTitle className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Technical Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                    Overall Signal
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    Hold
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Moving Averages</span>
                    <span className="text-yellow-600">Neutral</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Technical Indicators</span>
                    <span className="text-yellow-600">Neutral</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Summary</span>
                    <span className="text-blue-600">Hold</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
