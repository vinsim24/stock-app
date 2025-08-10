import { createChart, ColorType, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';

export class LightweightChart {
  constructor(containerId, themeOptions = null) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with id '${containerId}' not found`);
      return;
    }
    
    this.chart = null;
    this.candlestickSeries = null;
    this.lineSeries = null;
    this.areaSeries = null;
    this.movingAverages = new Map();
    this.themeOptions = themeOptions;
    
    try {
      this.initChart();
      console.log(`TradingViewChart v5 initialized for container: ${containerId}`);
    } catch (error) {
      console.error('Error initializing TradingViewChart:', error);
      this.container.innerHTML = `<div style="color: #ef5350; padding: 20px; background: #1e1e1e; border-radius: 4px;">Error loading chart: ${error.message}</div>`;
    }
  }

  initChart() {
    // Clean container
    this.container.innerHTML = '';
    
    // Default chart configuration for v5
    const defaultOptions = {
      layout: {
        background: { type: ColorType.Solid, color: '#1e1e1e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 0, // Normal crosshair mode
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    };

    // Merge with theme options if provided
    const chartOptions = this.themeOptions ? 
      { ...defaultOptions, ...this.themeOptions } : 
      defaultOptions;
    
    // Chart configuration for v5
    this.chart = createChart(this.container, chartOptions);

    // Set chart size
    this.chart.applyOptions({
      width: this.container.clientWidth,
      height: this.container.clientHeight || 400,
    });

    // Create default candlestick series using v5 API
    this.candlestickSeries = this.chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    console.log('TradingView chart v5 initialized successfully');

    // Handle container resize
    this.resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== this.container) return;
      const { width, height } = entries[0].contentRect;
      if (this.chart && width > 0 && height > 0) {
        this.chart.applyOptions({ width, height });
      }
    });
    this.resizeObserver.observe(this.container);
  }

  updateChart(candleData, chartType = 'candlestick', movingAverages = []) {
    console.log('TradingViewChart.updateChart called:', { 
      chartType, 
      movingAverages, 
      dataLength: candleData?.t?.length 
    });
    
    if (!candleData || !candleData.t || !this.chart) {
      console.error('Invalid candle data or chart not initialized:', candleData);
      return;
    }

    // Convert data for lightweight-charts v5
    const chartData = candleData.t.map((timestamp, i) => ({
      time: timestamp, // v5 accepts Unix timestamp directly
      open: parseFloat(candleData.o[i]),
      high: parseFloat(candleData.h[i]),
      low: parseFloat(candleData.l[i]),
      close: parseFloat(candleData.c[i]),
    }));

    console.log('Chart data sample:', chartData.slice(0, 3));

    // Clear existing moving averages
    this.movingAverages.forEach(series => {
      try {
        this.chart.removeSeries(series);
      } catch (e) {
        console.warn('Error removing series:', e);
      }
    });
    this.movingAverages.clear();

    // Handle different chart types
    this.switchChartType(chartType, chartData);

    // Add moving averages
    if (movingAverages && movingAverages.length > 0) {
      this.addMovingAverages(candleData, movingAverages);
    }

    // Fit content to show all data
    try {
      this.chart.timeScale().fitContent();
    } catch (error) {
      console.warn('Error fitting content:', error);
    }
  }

  switchChartType(chartType, chartData) {
    // Remove existing series
    if (this.candlestickSeries) {
      try {
        this.chart.removeSeries(this.candlestickSeries);
        this.candlestickSeries = null;
      } catch (e) {
        console.warn('Error removing candlestick series:', e);
      }
    }
    
    if (this.lineSeries) {
      try {
        this.chart.removeSeries(this.lineSeries);
        this.lineSeries = null;
      } catch (e) {
        console.warn('Error removing line series:', e);
      }
    }

    if (this.areaSeries) {
      try {
        this.chart.removeSeries(this.areaSeries);
        this.areaSeries = null;
      } catch (e) {
        console.warn('Error removing area series:', e);
      }
    }

    switch (chartType) {
      case 'line':
        this.lineSeries = this.chart.addSeries(LineSeries, {
          color: '#2196F3',
          lineWidth: 2,
        });
        
        const lineData = chartData.map(item => ({
          time: item.time,
          value: item.close,
        }));
        
        console.log('Setting line data:', lineData.slice(0, 3));
        this.lineSeries.setData(lineData);
        break;

      case 'area':
        this.areaSeries = this.chart.addSeries(AreaSeries, {
          lineColor: '#2196F3',
          topColor: 'rgba(33, 150, 243, 0.4)',
          bottomColor: 'rgba(33, 150, 243, 0.0)',
          lineWidth: 2,
        });
        
        const areaData = chartData.map(item => ({
          time: item.time,
          value: item.close,
        }));
        
        console.log('Setting area data:', areaData.slice(0, 3));
        this.areaSeries.setData(areaData);
        break;

      case 'bar':
        // Use CandlestickSeries with modified styling to look like OHLC bars
        this.candlestickSeries = this.chart.addSeries(CandlestickSeries, {
          upColor: 'transparent',
          downColor: 'transparent',
          borderVisible: true,
          wickVisible: true,
          borderUpColor: '#26a69a',
          borderDownColor: '#ef5350',
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });
        
        console.log('Setting bar data:', chartData.slice(0, 3));
        this.candlestickSeries.setData(chartData);
        break;

      case 'candlestick':
      default:
        this.candlestickSeries = this.chart.addSeries(CandlestickSeries, {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });
        
        console.log('Setting candlestick data:', chartData.slice(0, 3));
        this.candlestickSeries.setData(chartData);
        break;
    }
  }

  addMovingAverages(candleData, movingAverages) {
      movingAverages.forEach(period => {
        try {
          const maData = this.calculateMovingAverage(candleData.c, period);
          const maSeries = this.chart.addSeries(LineSeries, {
            color: this.getMAColor(period),
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          
          const maChartData = candleData.t.map((timestamp, i) => ({
            time: timestamp,
            value: maData[i],
          })).filter(item => item.value !== null && !isNaN(item.value));
        
          console.log(`MA${period} data points:`, maChartData.length);
          if (maChartData.length > 0) {
            maSeries.setData(maChartData);
            this.movingAverages.set(period, maSeries);
          }
        } catch (error) {
          console.error(`Error adding MA${period}:`, error);
        }
      });
    }

  calculateMovingAverage(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  }

  getMAColor(period) {
    const colors = {
      5: '#FF6B6B',   // Red
      9: '#4ECDC4',   // Teal
      21: '#45B7D1',  // Blue
      50: '#96CEB4',  // Green
      200: '#FFEAA7' // Yellow
    };
    return colors[period] || '#95a5a6';
  }

  applyOptions(options) {
    if (this.chart) {
      this.chart.applyOptions(options);
    }
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.chart) {
      this.chart.remove();
      this.chart = null;
    }
  }
}

export class VolumeChart {
  constructor(containerId, themeOptions = null) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Volume container with id '${containerId}' not found`);
      return;
    }
    
    // Volume chart initialization
    this.chart = null;
    this.volumeSeries = null;
    this.themeOptions = themeOptions;
    
    try {
      this.initChart();
      console.log(`VolumeChart v5 initialized for container: ${containerId}`);
    } catch (error) {
      console.error('Error initializing VolumeChart:', error);
      this.container.innerHTML = '<div style="color: #ef5350; padding: 20px; background: #1e1e1e; border-radius: 4px;">Error loading volume chart</div>';
    }
  }

  initChart() {
    this.container.innerHTML = '';
    
    // Default configuration
    const defaultOptions = {
      layout: {
        background: { type: ColorType.Solid, color: '#1e1e1e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        timeVisible: false,
      },
      width: this.container.clientWidth,
      height: this.container.clientHeight || 150,
    };

    // Merge with theme options if provided
    const chartOptions = this.themeOptions ? 
      { ...defaultOptions, ...this.themeOptions, width: this.container.clientWidth, height: this.container.clientHeight || 150 } : 
      defaultOptions;
    
    this.chart = createChart(this.container, chartOptions);

    this.volumeSeries = this.chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    // Handle container resize
    this.resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== this.container) return;
      const { width, height } = entries[0].contentRect;
      if (this.chart && width > 0 && height > 0) {
        this.chart.applyOptions({ width, height });
      }
    });
    this.resizeObserver.observe(this.container);
  }

  updateChart(candleData) {
    if (!candleData || !candleData.v || !candleData.t || !this.chart || !this.volumeSeries) {
      console.error('Invalid volume data or chart not initialized');
      return;
    }

    const volumeData = candleData.t.map((timestamp, i) => ({
      time: timestamp, // v5 accepts Unix timestamp directly
      value: parseInt(candleData.v[i]),
      color: candleData.c[i] >= candleData.o[i] ? '#26a69a' : '#ef5350'
    }));

    console.log('Volume data sample:', volumeData.slice(0, 3));
    this.volumeSeries.setData(volumeData);
    
    try {
      this.chart.timeScale().fitContent();
    } catch (error) {
      console.warn('Error fitting volume chart content:', error);
    }
  }

  applyOptions(options) {
    if (this.chart) {
      this.chart.applyOptions(options);
    }
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.chart) {
      this.chart.remove();
      this.chart = null;
    }
  }
}

export class RSIChart {
  constructor(containerId, themeOptions = null) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`RSI container with id '${containerId}' not found`);
      return;
    }
    
    this.chart = null;
    this.rsiSeries = null;
    this.overboughtSeries = null;
    this.oversoldSeries = null;
    this.themeOptions = themeOptions;
    
    try {
      this.initChart();
      console.log(`RSIChart v5 initialized for container: ${containerId}`);
    } catch (error) {
      console.error('Error initializing RSIChart:', error);
      this.container.innerHTML = '<div style="color: #ef5350; padding: 20px; background: #1e1e1e; border-radius: 4px;">Error loading RSI chart</div>';
    }
  }

  initChart() {
    this.container.innerHTML = '';
    
    // Default configuration
    const defaultOptions = {
      layout: {
        background: { type: ColorType.Solid, color: '#1e1e1e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        timeVisible: false,
      },
      width: this.container.clientWidth,
      height: this.container.clientHeight || 150,
    };

    // Merge with theme options if provided
    const chartOptions = this.themeOptions ? 
      { ...defaultOptions, ...this.themeOptions, width: this.container.clientWidth, height: this.container.clientHeight || 150 } : 
      defaultOptions;
    
    this.chart = createChart(this.container, chartOptions);

    // RSI line
    this.rsiSeries = this.chart.addSeries(LineSeries, {
      color: '#2196F3',
      lineWidth: 2,
    });

    // Overbought line (70)
    this.overboughtSeries = this.chart.addSeries(LineSeries, {
      color: 'rgba(255, 0, 0, 0.5)',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Oversold line (30)
    this.oversoldSeries = this.chart.addSeries(LineSeries, {
      color: 'rgba(0, 255, 0, 0.5)',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Handle container resize
    this.resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== this.container) return;
      const { width, height } = entries[0].contentRect;
      if (this.chart && width > 0 && height > 0) {
        this.chart.applyOptions({ width, height });
      }
    });
    this.resizeObserver.observe(this.container);
  }

  updateChart(timestamps, rsiData) {
    if (!this.rsiSeries || !timestamps || !rsiData || timestamps.length === 0) {
      console.error('Invalid RSI data or chart not initialized');
      return;
    }

    try {
      const rsiChartData = timestamps.map((timestamp, i) => ({
        time: timestamp, // v5 accepts Unix timestamp directly
        value: rsiData[i],
      })).filter(item => !isNaN(item.value) && item.value !== null);

      const overboughtData = timestamps.map(timestamp => ({
        time: timestamp,
        value: 70,
      }));

      const oversoldData = timestamps.map(timestamp => ({
        time: timestamp,
        value: 30,
      }));

      console.log('RSI data points:', rsiChartData.length);
      this.rsiSeries.setData(rsiChartData);
      this.overboughtSeries.setData(overboughtData);
      this.oversoldSeries.setData(oversoldData);
      
      this.chart.timeScale().fitContent();
    } catch (error) {
      console.error('Error updating RSI chart:', error);
    }
  }

  applyOptions(options) {
    if (this.chart) {
      this.chart.applyOptions(options);
    }
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.chart) {
      this.chart.remove();
      this.chart = null;
    }
  }
}
