import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';
import { RSI } from 'technicalindicators';

const RSIChart = forwardRef(({ data, height = 150, isDark = false }, ref) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const rsiSeriesRef = useRef();

  useImperativeHandle(ref, () => ({
    updateChart: (newData) => {
      updateChart(newData);
    },
    applyOptions: (options) => {
      if (chartRef.current) {
        chartRef.current.applyOptions(options);
      }
    }
  }));

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1a1a2e' : '#ffffff' },
        textColor: isDark ? '#e0e0e0' : '#2c3e50',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        timeVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    };

    chartRef.current = createChart(chartContainerRef.current, chartOptions);

    // Set y-axis scale to 0-100 for RSI
    chartRef.current.priceScale('right').applyOptions({
      scaleMargins: { top: 0.1, bottom: 0.1 },
      autoScale: false,
      mode: 1, // Normal price scale mode
      visible: true,
    });

    rsiSeriesRef.current = chartRef.current.addSeries(LineSeries, {
      color: '#2196F3',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    // Add horizontal lines for overbought/oversold levels
    rsiSeriesRef.current.createPriceLine({
      price: 70,
      color: '#f23645',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: 'Overbought',
    });

    rsiSeriesRef.current.createPriceLine({
      price: 50,
      color: isDark ? '#666' : '#999',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: 'Midline',
    });

    rsiSeriesRef.current.createPriceLine({
      price: 30,
      color: '#00bcd4',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: 'Oversold',
    });

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
      updateChart(data);
    }
  }, [data]);

  const updateChart = (candleData) => {
    if (!candleData || !candleData.c || !candleData.t || !rsiSeriesRef.current) {
      return;
    }

    try {
      // Calculate RSI with 14-period default
      const rsiInput = {
        values: candleData.c.map(price => parseFloat(price)),
        period: 14
      };
      
      const rsiValues = RSI.calculate(rsiInput);
      
      // Create RSI data points, starting from index 14 (after RSI calculation period)
      const rsiData = rsiValues.map((rsi, index) => ({
        time: candleData.t[index + 13], // RSI starts from 14th candle
        value: rsi
      }));

      rsiSeriesRef.current.setData(rsiData);
      
      // Set the visible range to 0-100 for RSI
      chartRef.current.priceScale('right').applyOptions({
        scaleMargins: { top: 0.1, bottom: 0.1 },
        autoScale: false,
      });
      
      chartRef.current.timeScale().fitContent();
    } catch (error) {
      console.warn('Error calculating or displaying RSI:', error);
    }
  };

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
});

RSIChart.displayName = 'RSIChart';

export default RSIChart;
