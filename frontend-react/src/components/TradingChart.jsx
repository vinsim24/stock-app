import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';

const TradingChart = forwardRef(({ 
  data, 
  chartType = 'candlestick', 
  movingAverages = [], 
  height = 400,
  isDark = false 
}, ref) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();
  const movingAverageSeriesRef = useRef(new Map());

  useImperativeHandle(ref, () => ({
    updateChart: (newData, newChartType, newMovingAverages) => {
      updateChart(newData, newChartType, newMovingAverages);
    },
    applyOptions: (options) => {
      if (chartRef.current) {
        chartRef.current.applyOptions(options);
      }
    }
  }));

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with theme-based options
    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1a1a2e' : '#ffffff' },
        textColor: isDark ? '#e0e0e0' : '#2c3e50',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
        horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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
      width: chartContainerRef.current.clientWidth,
      height: height,
    };

    chartRef.current = createChart(chartContainerRef.current, chartOptions);

    // Create initial series
    createSeries(chartType);

    // Handle resize
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const { width, height } = entries[0].contentRect;
      if (chartRef.current && width > 0 && height > 0) {
        chartRef.current.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [height, isDark]);

  useEffect(() => {
    if (data && chartRef.current) {
      updateChart(data, chartType, movingAverages);
    }
  }, [data, chartType, movingAverages]);

  const createSeries = (type) => {
    if (!chartRef.current) return;

    // Remove existing series
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
    }
    movingAverageSeriesRef.current.forEach(series => {
      chartRef.current.removeSeries(series);
    });
    movingAverageSeriesRef.current.clear();

    // Create new series based on type
    switch (type) {
      case 'line':
        seriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: '#2196F3',
          lineWidth: 2,
        });
        break;
      case 'area':
        seriesRef.current = chartRef.current.addSeries(AreaSeries, {
          topColor: 'rgba(33, 150, 243, 0.3)',
          bottomColor: 'rgba(33, 150, 243, 0.1)',
          lineColor: '#2196F3',
          lineWidth: 2,
        });
        break;
      case 'bar':
        seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
          upColor: 'transparent',
          downColor: 'transparent',
          borderVisible: true,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          borderUpColor: '#26a69a',
          borderDownColor: '#ef5350',
        });
        break;
      default: // candlestick
        seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });
    }
  };

  const updateChart = (candleData, type, mas) => {
    if (!candleData || !chartRef.current) return;

    // Create series if it doesn't exist or type changed
    if (!seriesRef.current || type !== chartType) {
      createSeries(type);
    }

    // Convert data based on chart type
    let chartData;
    if (type === 'line' || type === 'area') {
      chartData = candleData.t?.map((timestamp, i) => ({
        time: timestamp,
        value: parseFloat(candleData.c[i]),
      })) || [];
    } else {
      chartData = candleData.t?.map((timestamp, i) => ({
        time: timestamp,
        open: parseFloat(candleData.o[i]),
        high: parseFloat(candleData.h[i]),
        low: parseFloat(candleData.l[i]),
        close: parseFloat(candleData.c[i]),
      })) || [];
    }

    if (seriesRef.current && chartData.length > 0) {
      seriesRef.current.setData(chartData);
    }

    // Add moving averages
    if (mas && mas.length > 0 && candleData.c) {
      mas.forEach(period => {
        if (!movingAverageSeriesRef.current.has(period)) {
          const maSeries = chartRef.current.addSeries(LineSeries, {
            color: getMAColor(period),
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          movingAverageSeriesRef.current.set(period, maSeries);
        }

        const maData = calculateMovingAverage(candleData.c, period);
        const maChartData = candleData.t.slice(period - 1).map((timestamp, i) => ({
          time: timestamp,
          value: maData[i],
        }));

        movingAverageSeriesRef.current.get(period).setData(maChartData);
      });
    }

    // Fit content
    try {
      chartRef.current.timeScale().fitContent();
    } catch (error) {
      console.warn('Error fitting chart content:', error);
    }
  };

  const calculateMovingAverage = (prices, period) => {
    const result = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + parseFloat(b), 0);
      result.push(sum / period);
    }
    return result;
  };

  const getMAColor = (period) => {
    const colors = {
      5: '#FF6B6B',   // Red
      9: '#4ECDC4',   // Teal  
      21: '#45B7D1',  // Blue
      50: '#96CEB4',  // Green
      200: '#FFEAA7' // Yellow
    };
    return colors[period] || '#95a5a6';
  };

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
});

TradingChart.displayName = 'TradingChart';

export default TradingChart;
