import { Handle, Position } from 'reactflow';
import { TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';

export const MarketDataNode = ({ data, selected }: any) => {
  const price = data.price || 52000;
  const change = data.change || 0;
  const volume = data.volume || 1000000;
  const trend = data.trend || 'SIDEWAYS';

  const getTrendIcon = () => {
    if (trend === 'UP') return <TrendingUp className="w-4 h-4 text-[#10b981]" />;
    if (trend === 'DOWN') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-yellow-400" />;
  };

  const getTrendColor = () => {
    if (trend === 'UP') return 'border-[#10b981]';
    if (trend === 'DOWN') return 'border-red-400';
    return 'border-[#f59e0b]';
  };

  return (
    <div className={`px-4 py-3 shadow-lg rounded-md bg-[#0a0a1f] border-2 transition-all duration-300 ${
      selected 
        ? 'border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
        : `${getTrendColor()}/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]`
    } hover:scale-105`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[#f59e0b] border-none" />
      
      <div className="flex flex-col gap-2 min-w-[180px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-1">
          <span className="text-[10px] font-mono text-[#f59e0b] uppercase tracking-wider">
            Live Market
          </span>
          <Activity className="w-4 h-4 text-[#f59e0b] animate-pulse" />
        </div>
        
        <div className="text-sm font-bold text-white mb-1">{data.label}</div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">Price:</span>
            <span className="text-white font-mono text-base font-bold">${price.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">24h Change:</span>
            <span className={`font-mono flex items-center gap-1 ${change >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
              {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>

          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">Trend:</span>
            <span className="flex items-center gap-1">
              {getTrendIcon()}
              <span className="font-mono text-white/80">{trend}</span>
            </span>
          </div>
          
          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">Volume:</span>
            <span className="text-white/80 font-mono">${(volume / 1000000).toFixed(1)}M</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[#f59e0b] border-none" />
    </div>
  );
};
