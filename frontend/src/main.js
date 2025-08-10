import './style.css';
import { LightweightChart, VolumeChart, RSIChart } from './lightweightChart.js';
import { TechnicalIndicators } from './technicalIndicators.js';

class TradingApp {
    constructor() {
        this.currentSymbol = 'AAPL';
        this.currentData = null;
        this.companyInfo = null;
        this.currentPrice = null;
        this.searchResults = [];
        this.isDarkTheme = false;
        
        this.initializeCharts();
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeCharts() {
        console.log('Initializing charts...');
        
        // Check if containers exist
        const priceContainer = document.getElementById('priceChart');
        const volumeContainer = document.getElementById('volumeChart');
        const rsiContainer = document.getElementById('rsiChart');
        
        console.log('Price container:', priceContainer);
        console.log('Volume container:', volumeContainer);
        console.log('RSI container:', rsiContainer);
        
        this.priceChart = new LightweightChart('priceChart');
        this.volumeChart = new VolumeChart('volumeChart');
        this.rsiChart = new RSIChart('rsiChart');
        
        this.technicalIndicators = new TechnicalIndicators();
        console.log('Charts initialized successfully');
    }

    initializeEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('stockSearch');
        const searchButton = document.getElementById('searchButton');
        const searchResults = document.getElementById('searchResults');
        
        searchInput.addEventListener('input', (e) => {
            this.searchStocks(e.target.value);
        });
        
        searchButton.addEventListener('click', () => {
            this.selectStock(searchInput.value.trim().toUpperCase());
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.selectStock(searchInput.value.trim().toUpperCase());
            }
        });

        // Chart controls
        document.getElementById('chartType').addEventListener('change', (e) => {
            this.updateChartType(e.target.value);
        });
        
        // Moving Averages multiple select
        document.getElementById('movingAverages').addEventListener('change', () => {
            this.updateCharts();
        });
        
        document.getElementById('period').addEventListener('change', () => {
            this.loadStockData();
        });
        
        document.getElementById('range').addEventListener('change', () => {
            this.loadStockData();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Click outside to close search results
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.classList.add('hidden');
            }
        });
    }

    async loadInitialData() {
        await this.loadStockData();
        await this.loadCompanyInfo();
        await this.loadCurrentPrice();
    }

    async loadStockData() {
        try {
            const period = document.getElementById('period').value;
            const range = document.getElementById('range').value;
            
            console.log(`Loading stock data for ${this.currentSymbol} with period: ${period}, range: ${range}`);
            
            const response = await fetch(`http://localhost:3001/api/stock/${this.currentSymbol}?period=${period}&range=${range}`);
            const data = await response.json();
            
            console.log('Received data from backend:', data);
            
            if (data && data.chart) {
                this.currentData = data.chart;
                console.log('Chart data assigned:', this.currentData);
                this.updateCharts();
            } else {
                console.error('No chart data received:', data);
            }
        } catch (error) {
            console.error('Error loading stock data:', error);
        }
    }

    async loadCompanyInfo() {
        try {
            const response = await fetch(`http://localhost:3001/api/company/${this.currentSymbol}`);
            const data = await response.json();
            this.companyInfo = data;
            this.updateCompanyInfo();
        } catch (error) {
            console.error('Error loading company info:', error);
        }
    }

    async loadCurrentPrice() {
        try {
            const response = await fetch(`http://localhost:3001/api/quote/${this.currentSymbol}`);
            const data = await response.json();
            this.currentPrice = data;
            this.updatePriceInfo();
        } catch (error) {
            console.error('Error loading current price:', error);
        }
    }

    async searchStocks(query) {
        if (!query.trim()) {
            document.getElementById('searchResults').classList.add('hidden');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.searchResults = data || [];
            this.displaySearchResults();
        } catch (error) {
            console.error('Error searching stocks:', error);
        }
    }

    displaySearchResults() {
        const resultsContainer = document.getElementById('searchResults');
        
        if (this.searchResults.length === 0) {
            resultsContainer.classList.add('hidden');
            return;
        }

        resultsContainer.innerHTML = this.searchResults.slice(0, 10).map(result => `
            <div class="search-result-item" onclick="app.selectStock('${result.symbol}', '${result.description}')">
                <div class="result-symbol">${result.symbol}</div>
                <div class="result-description">${result.description}</div>
            </div>
        `).join('');
        
        resultsContainer.classList.remove('hidden');
    }

    selectStock(symbol, description = '') {
        this.currentSymbol = symbol.toUpperCase();
        document.getElementById('stockSearch').value = description || symbol;
        document.getElementById('searchResults').classList.add('hidden');
        document.getElementById('stockSymbol').textContent = this.currentSymbol;
        
        this.loadInitialData();
    }

    updateCharts() {
        if (!this.currentData) return;

        console.log('Updating charts with data:', this.currentData);

        // Update main price chart
        const chartType = document.getElementById('chartType').value;
        const selectedMAs = this.getSelectedMovingAverages();
        this.priceChart.updateChart(this.currentData, chartType, selectedMAs);
        
        // Update volume chart
        this.volumeChart.updateChart(this.currentData);
        
        // Calculate and update RSI
        const rsiData = this.technicalIndicators.calculateRSI(this.currentData.c, 14);
        this.rsiChart.updateChart(this.currentData.t, rsiData);
        
        // Update technical analysis sidebar
        this.updateTechnicalAnalysis();
    }

    updateChartType(type) {
        if (this.currentData) {
            const selectedMAs = this.getSelectedMovingAverages();
            this.priceChart.updateChart(this.currentData, type, selectedMAs);
        }
    }

    getSelectedMovingAverages() {
        const selectElement = document.getElementById('movingAverages');
        const selectedMAs = [];
        
        if (selectElement) {
            const selectedOptions = Array.from(selectElement.selectedOptions);
            selectedOptions.forEach(option => {
                selectedMAs.push(parseInt(option.value));
            });
        }
        
        console.log('Selected Moving Averages:', selectedMAs);
        return selectedMAs;
    }

    updatePriceInfo() {
        if (!this.currentPrice) return;

        const price = this.currentPrice.c || 0;
        const change = this.currentPrice.d || 0;
        const changePercent = this.currentPrice.dp || 0;

        document.getElementById('stockPrice').textContent = `$${price.toFixed(2)}`;
        
        const changeElement = document.getElementById('stockChange');
        const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
        changeElement.textContent = changeText;
        changeElement.className = `stock-change ${change >= 0 ? 'positive' : 'negative'}`;

        // Update market data
        document.getElementById('openPrice').textContent = `$${(this.currentPrice.o || 0).toFixed(2)}`;
        document.getElementById('highPrice').textContent = `$${(this.currentPrice.h || 0).toFixed(2)}`;
        document.getElementById('lowPrice').textContent = `$${(this.currentPrice.l || 0).toFixed(2)}`;
        document.getElementById('previousClose').textContent = `$${(this.currentPrice.pc || 0).toFixed(2)}`;
    }

    updateCompanyInfo() {
        if (!this.companyInfo) return;

        document.getElementById('industry').textContent = this.companyInfo.finnhubIndustry || 'N/A';
        document.getElementById('exchange').textContent = this.companyInfo.exchange || 'N/A';
        document.getElementById('country').textContent = this.companyInfo.country || 'N/A';
        
        const marketCap = this.companyInfo.marketCapitalization;
        if (marketCap) {
            const marketCapText = marketCap > 1000 ? 
                `$${(marketCap / 1000).toFixed(2)}B` : 
                `$${marketCap.toFixed(2)}M`;
            document.getElementById('marketCap').textContent = marketCapText;
        } else {
            document.getElementById('marketCap').textContent = 'N/A';
        }
    }

    updateTechnicalAnalysis() {
        if (!this.currentData || !this.currentData.c || this.currentData.c.length === 0) {
            console.log('No data available for technical analysis');
            return;
        }

        const data = this.currentData;
        const closingPrices = data.c;
        const highPrices = data.h;
        const lowPrices = data.l;
        const volumes = data.v;
        const timestamps = data.t;
        
        // Current price info
        const currentPrice = closingPrices[closingPrices.length - 1];
        const previousPrice = closingPrices[closingPrices.length - 2];
        const change = currentPrice - previousPrice;
        const changePercent = ((change / previousPrice) * 100);
        
        // Price Analysis
        this.updatePriceAnalysis(currentPrice, change, changePercent, highPrices, lowPrices);
        
        // Breakout Analysis
        this.updateBreakoutAnalysis(closingPrices, highPrices, lowPrices);
        
        // Volume Analysis
        this.updateVolumeAnalysis(volumes, closingPrices);
        
        // Technical Indicators
        this.updateTechnicalIndicators(closingPrices, highPrices, lowPrices);
        
        // Overall Signal
        this.updateOverallSignal(closingPrices, highPrices, lowPrices, volumes, timestamps.length);
        
        console.log('Comprehensive Technical Analysis Updated');
    }

    updatePriceAnalysis(currentPrice, change, changePercent, highPrices, lowPrices) {
        // Calculate 20-day range
        const period = Math.min(20, highPrices.length);
        const recentHighs = highPrices.slice(-period);
        const recentLows = lowPrices.slice(-period);
        const rangeHigh = Math.max(...recentHighs);
        const rangeLow = Math.min(...recentLows);
        const rangePosition = ((currentPrice - rangeLow) / (rangeHigh - rangeLow)) * 100;
        
        // Update DOM
        document.getElementById('analysisCurrentPrice').textContent = `$${currentPrice.toFixed(2)}`;
        
        const changeElement = document.getElementById('analysisChange');
        const changeText = `${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
        changeElement.textContent = changeText;
        changeElement.className = `value ${change >= 0 ? 'signal-bullish' : 'signal-bearish'}`;
        
        document.getElementById('rangePosition').textContent = `${rangePosition.toFixed(1)}% of 20-day range`;
    }

    updateBreakoutAnalysis(closingPrices, highPrices, lowPrices) {
        const currentPrice = closingPrices[closingPrices.length - 1];
        const period = Math.min(20, closingPrices.length);
        
        // Calculate resistance and support levels
        const recentHighs = highPrices.slice(-period);
        const recentLows = lowPrices.slice(-period);
        const resistance = Math.max(...recentHighs);
        const support = Math.min(...recentLows);
        
        // Determine breakout signal
        let signal = 'NEUTRAL';
        let signalClass = 'signal-neutral';
        let description = 'Price trading within normal range';
        
        const resistanceThreshold = resistance * 0.99; // 1% below resistance
        const supportThreshold = support * 1.01; // 1% above support
        
        if (currentPrice >= resistanceThreshold) {
            signal = 'BREAKOUT';
            signalClass = 'signal-breakout';
            description = 'Price broke above 20-day high - potential upward momentum';
        } else if (currentPrice <= supportThreshold) {
            signal = 'BREAKDOWN';
            signalClass = 'signal-bearish';
            description = 'Price broke below 20-day low - potential downward pressure';
        } else if (currentPrice > (resistance * 0.95)) {
            signal = 'APPROACHING RESISTANCE';
            signalClass = 'signal-neutral';
            description = 'Price approaching resistance level - watch for breakout';
        }
        
        // Update DOM
        const signalElement = document.getElementById('breakoutSignal');
        signalElement.textContent = signal;
        signalElement.className = `value ${signalClass}`;
        
        document.getElementById('resistanceLevel').textContent = `$${resistance.toFixed(2)}`;
        document.getElementById('supportLevel').textContent = `$${support.toFixed(2)}`;
        document.getElementById('breakoutDescription').textContent = description;
    }

    updateVolumeAnalysis(volumes, closingPrices) {
        const currentVolume = volumes[volumes.length - 1];
        const period = Math.min(20, volumes.length);
        const recentVolumes = volumes.slice(-period);
        const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / period;
        const volumeRatio = currentVolume / avgVolume;
        
        // Determine volume signal
        let signal = 'NORMAL VOLUME';
        let signalClass = 'signal-neutral';
        let description = 'Volume within normal range';
        
        if (volumeRatio >= 2.0) {
            signal = 'HIGH VOLUME';
            signalClass = 'signal-high-volume';
            description = 'Elevated volume suggests strong interest in current move';
        } else if (volumeRatio >= 1.5) {
            signal = 'ABOVE AVERAGE';
            signalClass = 'signal-bullish';
            description = 'Above average volume supporting price movement';
        } else if (volumeRatio <= 0.5) {
            signal = 'LOW VOLUME';
            signalClass = 'signal-bearish';
            description = 'Low volume may indicate weak conviction in move';
        }
        
        // Format volume
        const formatVolume = (vol) => {
            if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
            if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
            if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
            return vol.toString();
        };
        
        // Update DOM
        const volumeSignalElement = document.getElementById('volumeSignal');
        volumeSignalElement.textContent = signal;
        volumeSignalElement.className = `value ${signalClass}`;
        
        document.getElementById('currentVolume').textContent = formatVolume(currentVolume);
        document.getElementById('volumeRatio').textContent = `${volumeRatio.toFixed(2)}x (${((volumeRatio - 1) * 100).toFixed(0)}%)`;
        document.getElementById('volumeDescription').textContent = description;
    }

    updateTechnicalIndicators(closingPrices, highPrices, lowPrices) {
        const currentPrice = closingPrices[closingPrices.length - 1];
        
        // Calculate RSI (14-period)
        const rsiData = this.technicalIndicators.calculateRSI(closingPrices, Math.min(14, closingPrices.length - 1));
        const currentRSI = rsiData.length > 0 ? rsiData[rsiData.length - 1] : null;
        
        // Calculate SMA (20-period)
        const smaData = this.technicalIndicators.calculateSMA(closingPrices, Math.min(20, closingPrices.length));
        const currentSMA = smaData.length > 0 ? smaData[smaData.length - 1] : null;
        
        // Calculate EMA (20-period)
        const emaData = this.technicalIndicators.calculateEMA(closingPrices, Math.min(20, closingPrices.length));
        const currentEMA = emaData.length > 0 ? emaData[emaData.length - 1] : null;
        
        // Calculate MACD
        const macdData = this.technicalIndicators.calculateMACD(closingPrices);
        const currentMACD = macdData.macd.length > 0 ? macdData.macd[macdData.macd.length - 1] : null;
        const currentSignal = macdData.signal.length > 0 ? macdData.signal[macdData.signal.length - 1] : null;
        
        // Calculate Bollinger Bands
        const bollingerData = this.technicalIndicators.calculateBollingerBands(closingPrices, Math.min(20, closingPrices.length));
        let bollingerPosition = null;
        if (bollingerData.upper.length > 0 && bollingerData.lower.length > 0) {
            const upperBand = bollingerData.upper[bollingerData.upper.length - 1];
            const lowerBand = bollingerData.lower[bollingerData.lower.length - 1];
            const bandRange = upperBand - lowerBand;
            bollingerPosition = ((currentPrice - lowerBand) / bandRange) * 100;
        }
        
        // Update DOM elements with color coding
        const rsiElement = document.getElementById('currentRSI');
        if (rsiElement && currentRSI !== null) {
            rsiElement.textContent = currentRSI.toFixed(2);
            // Color code RSI
            if (currentRSI >= 70) {
                rsiElement.className = 'value signal-bearish'; // Overbought
            } else if (currentRSI <= 30) {
                rsiElement.className = 'value signal-bullish'; // Oversold
            } else {
                rsiElement.className = 'value signal-neutral';
            }
        }
        
        const smaElement = document.getElementById('currentSMA');
        if (smaElement && currentSMA !== null) {
            smaElement.textContent = `$${currentSMA.toFixed(2)}`;
            // Color code based on price vs SMA
            if (currentPrice > currentSMA) {
                smaElement.className = 'value signal-bullish';
            } else {
                smaElement.className = 'value signal-bearish';
            }
        }
        
        const emaElement = document.getElementById('currentEMA');
        if (emaElement && currentEMA !== null) {
            emaElement.textContent = `$${currentEMA.toFixed(2)}`;
            // Color code based on price vs EMA
            if (currentPrice > currentEMA) {
                emaElement.className = 'value signal-bullish';
            } else {
                emaElement.className = 'value signal-bearish';
            }
        }
        
        const macdElement = document.getElementById('currentMACD');
        if (macdElement && currentMACD !== null && currentSignal !== null) {
            const macdDiff = currentMACD - currentSignal;
            macdElement.textContent = macdDiff.toFixed(4);
            // Color code based on MACD vs Signal line
            if (macdDiff > 0) {
                macdElement.className = 'value signal-bullish';
            } else {
                macdElement.className = 'value signal-bearish';
            }
        }
        
        const bollingerElement = document.getElementById('bollingerPosition');
        if (bollingerElement && bollingerPosition !== null) {
            bollingerElement.textContent = `${bollingerPosition.toFixed(1)}%`;
            // Color code based on position in bands
            if (bollingerPosition >= 80) {
                bollingerElement.className = 'value signal-bearish'; // Near upper band
            } else if (bollingerPosition <= 20) {
                bollingerElement.className = 'value signal-bullish'; // Near lower band
            } else {
                bollingerElement.className = 'value signal-neutral';
            }
        }
        
        console.log('Technical Indicators Updated:', {
            RSI: currentRSI?.toFixed(2),
            SMA: currentSMA?.toFixed(2),
            EMA: currentEMA?.toFixed(2),
            MACD: currentMACD?.toFixed(4),
            BollingerPos: bollingerPosition?.toFixed(1)
        });
    }

    updateOverallSignal(closingPrices, highPrices, lowPrices, volumes, dataPoints) {
        const currentPrice = closingPrices[closingPrices.length - 1];
        
        // Calculate multiple indicators for overall signal
        const sma20 = this.technicalIndicators.calculateSMA(closingPrices, Math.min(20, closingPrices.length));
        const currentSMA = sma20[sma20.length - 1];
        
        const rsi = this.technicalIndicators.calculateRSI(closingPrices, Math.min(14, closingPrices.length - 1));
        const currentRSI = rsi[rsi.length - 1];
        
        // Volume analysis
        const currentVolume = volumes[volumes.length - 1];
        const period = Math.min(20, volumes.length);
        const avgVolume = volumes.slice(-period).reduce((sum, vol) => sum + vol, 0) / period;
        const volumeRatio = currentVolume / avgVolume;
        
        // Price trend analysis
        const period20 = Math.min(20, closingPrices.length);
        const recentHighs = highPrices.slice(-period20);
        const resistance = Math.max(...recentHighs);
        const priceVsResistance = currentPrice / resistance;
        
        // Scoring system
        let bullishSignals = 0;
        let bearishSignals = 0;
        let totalSignals = 0;
        
        // RSI signals
        if (currentRSI) {
            totalSignals++;
            if (currentRSI > 70) bearishSignals++; // Overbought
            else if (currentRSI < 30) bullishSignals++; // Oversold
            else if (currentRSI > 50) bullishSignals++; // Above midline
            else bearishSignals++; // Below midline
        }
        
        // Price vs SMA
        if (currentSMA) {
            totalSignals++;
            if (currentPrice > currentSMA) bullishSignals++;
            else bearishSignals++;
        }
        
        // Volume signal
        totalSignals++;
        if (volumeRatio > 1.5) bullishSignals++; // High volume is generally bullish
        else if (volumeRatio < 0.7) bearishSignals++; // Low volume can be bearish
        
        // Breakout signal
        totalSignals++;
        if (priceVsResistance > 0.99) bullishSignals++; // Near or above resistance
        else if (priceVsResistance < 0.90) bearishSignals++; // Well below resistance
        
        // Calculate overall signal
        const bullishPercentage = (bullishSignals / totalSignals) * 100;
        let signal, signalClass, confidence, description;
        
        if (bullishPercentage >= 75) {
            signal = 'STRONG BUY';
            signalClass = 'signal-strong-buy';
            confidence = 'High';
            description = 'Breakout confirmed with high volume - strong bullish signal';
        } else if (bullishPercentage >= 60) {
            signal = 'BUY';
            signalClass = 'signal-bullish';
            confidence = 'Medium';
            description = 'Multiple bullish indicators align - positive outlook';
        } else if (bullishPercentage >= 40) {
            signal = 'HOLD';
            signalClass = 'signal-neutral';
            confidence = 'Low';
            description = 'Mixed signals - wait for clearer direction';
        } else if (bullishPercentage >= 25) {
            signal = 'SELL';
            signalClass = 'signal-bearish';
            confidence = 'Medium';
            description = 'Multiple bearish indicators - consider reducing position';
        } else {
            signal = 'STRONG SELL';
            signalClass = 'signal-strong-sell';
            confidence = 'High';
            description = 'Multiple strong bearish signals - high risk environment';
        }
        
        // Update DOM
        const overallSignalElement = document.getElementById('overallSignal');
        overallSignalElement.textContent = signal;
        overallSignalElement.className = `value ${signalClass}`;
        
        document.getElementById('signalConfidence').textContent = confidence;
        document.getElementById('overallDescription').textContent = description;
        document.getElementById('dataTimeframe').textContent = `Based on ${dataPoints} days of data`;
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.body.classList.toggle('dark-theme', this.isDarkTheme);
        
        const themeButton = document.getElementById('themeToggle');
        themeButton.textContent = this.isDarkTheme ? '☀️' : '🌙';
        
        // Update charts theme
        const themeOptions = this.isDarkTheme ? {
            layout: {
                background: { type: 'solid', color: '#000' },
                textColor: '#fff'
            }
        } : {
            layout: {
                background: { type: 'solid', color: '#fff' },
                textColor: '#000'
            }
        };
        
        this.priceChart.applyOptions(themeOptions);
        this.volumeChart.applyOptions(themeOptions);
        this.rsiChart.applyOptions(themeOptions);
    }
}

// Initialize the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new TradingApp();
    });
} else {
    // DOM is already loaded
    window.app = new TradingApp();
}
