import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, ColorType, HistogramSeries } from 'lightweight-charts';

const VolumeChart = forwardRef(({ data, height = 150, isDark = false }, ref) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const volumeSeriesRef = useRef();

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
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        timeVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    };

    chartRef.current = createChart(chartContainerRef.current, chartOptions);

    volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
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
    if (!candleData || !candleData.v || !candleData.t || !volumeSeriesRef.current) {
      return;
    }

    const volumeData = candleData.t.map((timestamp, i) => ({
      time: timestamp,
      value: parseInt(candleData.v[i]),
      color: candleData.c[i] >= candleData.o[i] ? '#26a69a' : '#ef5350'
    }));

    volumeSeriesRef.current.setData(volumeData);
    
    try {
      chartRef.current.timeScale().fitContent();
    } catch (error) {
      console.warn('Error fitting volume chart content:', error);
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

VolumeChart.displayName = 'VolumeChart';

export default VolumeChart;
