import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PerformanceData {
  timestamp: string;
  winRate: number;
  profit: number;
  trades: number;
}

export const PerformanceChart = ({ agentId }: { agentId: string }) => {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [stats, setStats] = useState({ winRate: 0, profit: 0, trend: 'neutral' });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/cognitive/performance/${agentId}`);
        const history = await response.json();
        setData(history.data || []);
        setStats(history.summary || { winRate: 0, profit: 0, trend: 'neutral' });
      } catch (error) {
        console.error('Error fetching performance:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [agentId]);

  const maxProfit = Math.max(...data.map(d => d.profit), 100);
  const minProfit = Math.min(...data.map(d => d.profit), -100);
  const range = maxProfit - minProfit;

  return (
    <div className="bg-gradient-to-br from-[#0a0a1f] to-[#1a1a3f] border-2 border-purple-400/40 rounded-xl p-4 min-w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-white">Learning Progress</span>
        </div>
        <div className="flex items-center gap-2">
          {stats.trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : stats.trend === 'down' ? (
            <TrendingDown className="w-4 h-4 text-red-400" />
          ) : (
            <Activity className="w-4 h-4 text-gray-400" />
          )}
          <span className={`text-sm font-bold ${
            stats.winRate >= 0.5 ? 'text-green-400' : 'text-red-400'
          }`}>
            {(stats.winRate * 100).toFixed(0)}% Win Rate
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-32 bg-black/20 rounded-lg p-2 mb-3">
        <svg className="w-full h-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(pct => (
            <line
              key={pct}
              x1="0"
              y1={`${pct}%`}
              x2="100%"
              y2={`${pct}%`}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          ))}

          {/* Win rate line */}
          {data.length > 1 && (
            <polyline
              points={data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 100 - (d.winRate * 100);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="rgb(34, 197, 94)"
              strokeWidth="2"
              opacity="0.8"
            />
          )}

          {/* Profit line */}
          {data.length > 1 && range > 0 && (
            <polyline
              points={data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 100 - ((d.profit - minProfit) / range * 100);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="rgb(147, 51, 234)"
              strokeWidth="2"
              opacity="0.6"
            />
          )}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-white/40 pr-1">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span className="text-white/60">Win Rate</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-purple-500"></div>
          <span className="text-white/60">Profit Trend</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/5 rounded p-2">
          <div className="text-white/60 mb-1">Total Profit</div>
          <div className={`font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.profit.toFixed(0)}
          </div>
        </div>
        <div className="bg-white/5 rounded p-2">
          <div className="text-white/60 mb-1">Trades</div>
          <div className="font-bold text-white">{data.length}</div>
        </div>
      </div>
    </div>
  );
};
