// Technical indicator calculation utilities for React frontend
// Ported from vanilla frontend's technicalIndicators.js

export function calculateSMA(data, period) {
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

export function calculateEMA(data, period) {
  const multiplier = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push((data[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
  }
  return ema;
}

export function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return [];
  const gains = [];
  const losses = [];
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
  const rsi = [100 - (100 / (1 + (avgGain / avgLoss)))];
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    rsi.push(100 - (100 / (1 + (avgGain / avgLoss))));
  }
  return rsi;
}

export function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const macdLine = [];
  for (let i = 0; i < Math.min(fastEMA.length, slowEMA.length); i++) {
    macdLine.push(fastEMA[i] - slowEMA[i]);
  }
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = [];
  for (let i = 0; i < Math.min(macdLine.length, signalLine.length); i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  };
}

export function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  const sma = calculateSMA(prices, period);
  const upperBand = [];
  const lowerBand = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    upperBand.push(sma[i - period + 1] + (standardDeviation * stdDev));
    lowerBand.push(sma[i - period + 1] - (standardDeviation * stdDev));
  }
  return {
    upper: upperBand,
    middle: sma,
    lower: lowerBand
  };
}
