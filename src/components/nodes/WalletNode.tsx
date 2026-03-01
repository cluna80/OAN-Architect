import { Handle, Position } from 'reactflow';
import { Wallet, TrendingUp, DollarSign } from 'lucide-react';

export const WalletNode = ({ data, selected }: any) => {
  const balance = data.balance || 10000;
  const profit = data.profit || 0;
  const trades = data.trades || 0;

  return (
    <div className={`px-4 py-3 shadow-lg rounded-md bg-[#0a0a1f] border-2 transition-all duration-300 ${
      selected 
        ? 'border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
        : 'border-[#10b981]/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
    } hover:scale-105`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[#10b981] border-none" />
      
      <div className="flex flex-col gap-2 min-w-[180px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-1">
          <span className="text-[10px] font-mono text-[#10b981] uppercase tracking-wider">
            Wallet
          </span>
          <Wallet className="w-4 h-4 text-[#10b981]" />
        </div>
        
        <div className="text-sm font-bold text-white mb-1">{data.label}</div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">Balance:</span>
            <span className="text-[#10b981] font-mono">${balance.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">Profit/Loss:</span>
            <span className={`font-mono ${profit >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
              {profit >= 0 ? '+' : ''}${profit.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">Trades:</span>
            <span className="text-white font-mono">{trades}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[#10b981] border-none" />
    </div>
  );
};
