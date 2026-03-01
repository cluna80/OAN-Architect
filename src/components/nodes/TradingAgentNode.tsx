import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Play, Square, TrendingUp, TrendingDown } from 'lucide-react';
import { useGraphStore } from '../../stores/useGraphStore';
import { tradingManager } from '../../services/tradingSessionManager';

export const TradingAgentNode = ({ data, selected, id }: any) => {
  const { updateNodeData, nodes } = useGraphStore();

  const isActive = data.isActive || false;
  const strategy = data.strategy || 'Market Making';
  const winRate = data.winRate || 0;
  const totalTrades = data.totalTrades || 0;
  const profit = data.profit || 0;

  const handleStart = async () => {
    console.log('íº€ Starting:', id);
    
    try {
      // Start backend session
      const response = await fetch(`http://localhost:8000/trading/start/${id}`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        console.log('âœ… Session started!');
        
        // Update node state
        updateNodeData(id, { isActive: true });

        // Use TradingSessionManager (prevents duplicate intervals)
        tradingManager.start(id, (stats) => {
          // Update this node
          updateNodeData(id, {
            winRate: stats.win_rate,
            totalTrades: stats.trades,
            profit: stats.profit
          });

          // Update connected wallet
          const wallet = nodes.find(n => n.type === 'wallet');
          if (wallet) {
            updateNodeData(wallet.id, {
              balance: stats.balance,
              profit: stats.profit,
              trades: stats.trades
            });
          }
        }, 0.5);
      }
    } catch (error) {
      console.error('âŒ Failed to start:', error);
      alert('Backend not running on port 8000?');
    }
  };

  const handleStop = () => {
    console.log('í»‘ Stopping:', id);
    
    // Stop the trading manager
    tradingManager.stop(id);
    
    // Update node state
    updateNodeData(id, { isActive: false });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActive) {
        tradingManager.stop(id);
      }
    };
  }, []);

  // Update callback if component re-renders while active
  useEffect(() => {
    if (isActive) {
      tradingManager.updateCallback(id, (stats) => {
        updateNodeData(id, {
          winRate: stats.win_rate,
          totalTrades: stats.trades,
          profit: stats.profit
        });

        const wallet = nodes.find(n => n.type === 'wallet');
        if (wallet) {
          updateNodeData(wallet.id, {
            balance: stats.balance,
            profit: stats.profit,
            trades: stats.trades
          });
        }
      });
    }
  }, [isActive, id, nodes]);

  return (
    <div className={`px-4 py-3 shadow-lg rounded-md bg-[#0a0a1f] border-2 transition-all duration-300 ${
      selected 
        ? 'border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.5)]' 
        : isActive
          ? 'border-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.3)] animate-pulse'
          : 'border-[#6b7280] shadow-[0_0_10px_rgba(107,114,128,0.2)]'
    } hover:scale-105`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[#8b5cf6] border-none" />
      
      <div className="flex flex-col gap-2 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-1">
          <span className="text-[10px] font-mono text-[#8b5cf6] uppercase tracking-wider">
            {isActive ? 'í²Ží²Ží²Ž LIVE TRADING' : 'âš« INACTIVE'}
          </span>
          <Bot className={`w-4 h-4 ${isActive ? 'text-[#8b5cf6] animate-pulse' : 'text-gray-500'}`} />
        </div>
        
        <div className="text-sm font-bold text-white mb-1">{data.label}</div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">Strategy:</span>
            <span className="text-[#8b5cf6] font-mono text-[9px]">{strategy}</span>
          </div>
          
          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">Win Rate:</span>
            <span className={`font-mono ${winRate >= 60 ? 'text-[#10b981]' : winRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {winRate.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">Trades:</span>
            <span className="text-white font-mono">{totalTrades}</span>
          </div>

          <div className="flex justify-between text-[10px]">
            <span className="text-white/60">Profit/Loss:</span>
            <span className={`font-mono flex items-center gap-1 ${profit >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
              {profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-1 mt-1 pt-1 border-t border-white/10">
            {!isActive ? (
              <button 
                onClick={handleStart}
                className="flex-1 px-2 py-1 text-[9px] font-mono uppercase bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] rounded transition-colors flex items-center justify-center gap-1"
              >
                <Play className="w-3 h-3" />
                START
              </button>
            ) : (
              <button 
                onClick={handleStop}
                className="flex-1 px-2 py-1 text-[9px] font-mono uppercase bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors flex items-center justify-center gap-1"
              >
                <Square className="w-3 h-3" />
                STOP
              </button>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[#8b5cf6] border-none" />
    </div>
  );
};
