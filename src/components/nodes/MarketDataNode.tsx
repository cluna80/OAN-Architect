import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { TrendingUp, TrendingDown, Activity, Wifi } from 'lucide-react';

export const MarketDataNode = ({ data }: any) => {
  const [marketData, setMarketData] = useState({
    price: 52000,
    change: 0,
    volume: 0,
    source: 'Loading...',
    high_24h: 0,
    low_24h: 0
  });

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const response = await fetch('http://localhost:8000/trading/market');
        const data = await response.json();
        setMarketData(data);
      } catch (error) {
        console.error('Market data error:', error);
      }
    };

    fetchMarket();
    const interval = setInterval(fetchMarket, 2000);
    return () => clearInterval(interval);
  }, []);

  const isPositive = marketData.change >= 0;
  const isLive = marketData.source === 'Binance Live';

  return (
    <div className="bg-gradient-to-br from-[#0f0f1e] to-[#1a1a2e] border-2 border-cyan-400/40 rounded-xl p-4 min-w-[280px] shadow-2xl">
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-white text-sm">
            {data.label || 'Market Data'}
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 rounded-md">
          <Wifi className={`w-3 h-3 ${isLive ? 'text-green-400' : 'text-yellow-400'}`} />
          <span className="text-[9px] text-cyan-300 font-bold">
            {isLive ? 'LIVE' : 'SIM'}
          </span>
        </div>
      </div>

      {/* Price Display */}
      <div className="bg-black/30 rounded-lg p-3 mb-3">
        <div className="text-xs text-cyan-300 mb-1">BTC/USDT</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">
            ${marketData.price.toLocaleString()}
          </span>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-bold">
              {isPositive ? '+' : ''}{marketData.change.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* 24h Stats */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-[10px] text-white/60 mb-1">24h High</div>
          <div className="text-sm font-bold text-green-400">
            ${marketData.high_24h?.toLocaleString() || 'N/A'}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-[10px] text-white/60 mb-1">24h Low</div>
          <div className="text-sm font-bold text-red-400">
            ${marketData.low_24h?.toLocaleString() || 'N/A'}
          </div>
        </div>
      </div>

      {/* Volume */}
      <div className="bg-white/5 rounded-lg p-2">
        <div className="text-[10px] text-white/60 mb-1">24h Volume</div>
        <div className="text-sm font-bold text-cyan-400">
          {(marketData.volume / 1000).toFixed(1)}K BTC
        </div>
      </div>

      {/* Source */}
      <div className="mt-2 pt-2 border-t border-white/10 text-[9px] text-white/40 text-center">
        {marketData.source}
      </div>
    </div>
  );
};
