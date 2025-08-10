import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { BarChart2, TrendingUp, Info, Activity, Award } from 'lucide-react';

export default function Sidebar({
  signal,
  indicators,
  marketData,
  companyInfo,
  analysis,
  isDark
}) {
  return (
    <aside className={
      `w-full max-w-xs mx-auto lg:mx-0 rounded-xl p-0 lg:p-0 space-y-5 ` +
      (isDark ? 'bg-[#181c20] text-white' : 'bg-[#181c20] text-white border border-gray-800 shadow')
    }>
      {/* Overall Signal */}
      <Card className="rounded-xl shadow border border-gray-800 bg-[#23272e]">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <Award className="h-5 w-5 text-blue-400" />
          <CardTitle className="text-base font-semibold tracking-tight text-blue-300">Overall Signal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-bold ${signal?.signal === 'STRONG SELL' ? 'bg-red-900 text-red-300 border border-red-700' : signal?.signal === 'STRONG BUY' ? 'bg-green-900 text-green-300 border border-green-700' : 'bg-yellow-900 text-yellow-300 border border-yellow-700'}`}>{signal?.signal || '---'}</span>
            <span className="text-xs text-blue-200">{signal?.confidence}</span>
          </div>
          <div className="text-xs mb-1 text-gray-300">{signal?.description || ''}</div>
          <div className="text-xs text-gray-500">Based on {signal?.timeframe || '---'} of data</div>
        </CardContent>
      </Card>

      {/* Technical Indicators */}
      <Card className="rounded-xl shadow border border-gray-800 bg-[#23272e]">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <Activity className="h-5 w-5 text-pink-400" />
          <CardTitle className="text-base font-semibold tracking-tight text-pink-300">Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs">RSI (14):</span>
            <span className="px-2 py-1 rounded bg-gray-900 text-yellow-300 border border-yellow-700 text-xs font-mono">{indicators?.rsi ?? '---'}</span>
            <span className="text-xs">SMA (20):</span>
            <span className="px-2 py-1 rounded bg-gray-900 text-red-300 border border-red-700 text-xs font-mono">{indicators?.sma ?? '---'}</span>
            <span className="text-xs">EMA (20):</span>
            <span className="px-2 py-1 rounded bg-gray-900 text-blue-300 border border-blue-700 text-xs font-mono">{indicators?.ema ?? '---'}</span>
            <span className="text-xs">MACD:</span>
            <span className="px-2 py-1 rounded bg-gray-900 text-purple-300 border border-purple-700 text-xs font-mono">{indicators?.macd ?? '---'}</span>
            <span className="text-xs">Bollinger %:</span>
            <span className="px-2 py-1 rounded bg-gray-900 text-orange-300 border border-orange-700 text-xs font-mono">{indicators?.boll ?? '---'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Market Data */}
      <Card className="rounded-xl shadow border border-gray-800 bg-[#23272e]">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <BarChart2 className="h-5 w-5 text-cyan-400" />
          <CardTitle className="text-base font-semibold tracking-tight text-cyan-300">Market Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
            <div>Open:</div>
            <div className="text-cyan-200">{marketData?.open ?? '---'}</div>
            <div>High:</div>
            <div className="text-cyan-200">{marketData?.high ?? '---'}</div>
            <div>Low:</div>
            <div className="text-cyan-200">{marketData?.low ?? '---'}</div>
            <div>Prev Close:</div>
            <div className="text-cyan-200">{marketData?.prevClose ?? '---'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card className="rounded-xl shadow border border-gray-800 bg-[#23272e]">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <Info className="h-5 w-5 text-green-400" />
          <CardTitle className="text-base font-semibold tracking-tight text-green-300">Company Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
            <div>Industry:</div>
            <div className="text-green-200">{companyInfo?.industry ?? '---'}</div>
            <div>Exchange:</div>
            <div className="text-green-200">{companyInfo?.exchange ?? '---'}</div>
            <div>Country:</div>
            <div className="text-green-200">{companyInfo?.country ?? '---'}</div>
            <div>Market Cap:</div>
            <div className="text-green-200">{companyInfo?.marketCap ?? '---'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Panels */}
      <Card className="rounded-xl shadow border border-gray-800 bg-[#23272e]">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <TrendingUp className="h-5 w-5 text-yellow-400" />
          <CardTitle className="text-base font-semibold tracking-tight text-yellow-300">Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-1 text-sm"><span className="font-semibold">Price:</span> <span className="text-yellow-200">{analysis?.price ?? '---'}</span></div>
          <div className="mb-1 text-sm"><span className="font-semibold">Breakout:</span> <span className="text-yellow-200">{analysis?.breakout ?? '---'}</span></div>
          <div className="text-sm"><span className="font-semibold">Volume:</span> <span className="text-yellow-200">{analysis?.volume ?? '---'}</span></div>
        </CardContent>
      </Card>
    </aside>
  );
}
