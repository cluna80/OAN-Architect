import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Brain, Zap, Heart, Battery, Sparkles, Play, Square } from 'lucide-react';
import { cognitiveApi } from '../../services/cognitiveApi';

export const CognitiveAgentNode = ({ data, id }: any) => {
  const [isActive, setIsActive] = useState(false);
  const [emotion, setEmotion] = useState('calm');
  const [energy, setEnergy] = useState(100);
  const [reasoning, setReasoning] = useState('');
  const [useLLM, setUseLLM] = useState(true);
  const [stats, setStats] = useState({
    profit: 0,
    trades: 0,
    winRate: 0
  });

  const emotionColors = {
    calm: 'text-blue-400 border-blue-400',
    greedy: 'text-green-400 border-green-400',
    fearful: 'text-red-400 border-red-400',
    aggressive: 'text-orange-400 border-orange-400'
  };

  const emotionIcons = {
    calm: 'í¸Œ',
    greedy: 'í´‘',
    fearful: 'í¸°',
    aggressive: 'í¸¤'
  };

  const energyColor = energy > 70 ? 'bg-green-500' : 
                      energy > 40 ? 'bg-yellow-500' : 
                      'bg-red-500';

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(async () => {
        try {
          // Get AI decision
          const decision = await cognitiveApi.getDecision(id, null, useLLM);
          
          setEmotion(decision.emotion);
          setEnergy(decision.energy.percentage);
          setReasoning(decision.reasoning);

          // Simulate trade execution
          if (decision.action === 'buy' || decision.action === 'sell') {
            const profit = Math.random() * 200 - 100;
            const newStats = {
              ...stats,
              profit: stats.profit + profit,
              trades: stats.trades + 1,
              winRate: profit > 0 ? 
                ((stats.winRate * stats.trades + 1) / (stats.trades + 1)) :
                ((stats.winRate * stats.trades) / (stats.trades + 1))
            };
            setStats(newStats);

            // Update emotion based on performance
            await cognitiveApi.updateEmotion(id, newStats.profit, newStats.winRate);
          }

          // Rest if low energy
          if (decision.energy.percentage < 20) {
            await cognitiveApi.rest(id);
          }

        } catch (error) {
          console.error('Cognitive decision error:', error);
        }
      }, 5000); // Every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isActive, id, useLLM, stats]);

  return (
    <div className={`relative bg-gradient-to-br from-[#0a0a1f] to-[#1a1a3f] border-2 ${emotionColors[emotion as keyof typeof emotionColors] || 'border-white/20'} rounded-xl p-4 min-w-[280px] shadow-2xl ${isActive ? 'animate-pulse-slow' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-white">{data.label}</span>
          <span className="text-2xl">{emotionIcons[emotion as keyof typeof emotionIcons] || 'í´–'}</span>
        </div>
        <div className="flex items-center gap-1">
          {useLLM && <Sparkles className="w-4 h-4 text-yellow-400" title="AI Brain Active" />}
          {isActive && <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />}
        </div>
      </div>

      {/* Energy Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-white/60 mb-1">
          <div className="flex items-center gap-1">
            <Battery className="w-3 h-3" />
            <span>Energy</span>
          </div>
          <span>{Math.round(energy)}%</span>
        </div>
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full ${energyColor} transition-all duration-500`}
            style={{ width: `${energy}%` }}
          />
        </div>
      </div>

      {/* Emotion & Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="flex items-center gap-1 text-white/60 mb-1">
            <Heart className="w-3 h-3" />
            <span>Emotion</span>
          </div>
          <span className={`font-bold capitalize ${emotionColors[emotion as keyof typeof emotionColors].split(' ')[0]}`}>
            {emotion}
          </span>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-white/60 mb-1">P/L</div>
          <span className={`font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.profit.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 mb-3">
          <div className="text-[10px] text-purple-300 mb-1">AI REASONING:</div>
          <p className="text-xs text-white/80 line-clamp-2">{reasoning}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
            isActive
              ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-400'
              : 'bg-green-500/20 hover:bg-green-500/30 border border-green-400/40 text-green-400'
          }`}
        >
          {isActive ? (
            <>
              <Square className="w-4 h-4" />
              <span>STOP</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>START</span>
            </>
          )}
        </button>

        <button
          onClick={() => setUseLLM(!useLLM)}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            useLLM
              ? 'bg-purple-500/20 border border-purple-400/40 text-purple-400'
              : 'bg-white/10 border border-white/20 text-white/60'
          }`}
          title="Toggle AI Brain"
        >
          {useLLM ? 'AI' : 'RULE'}
        </button>
      </div>

      {/* Stats Footer */}
      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-[10px] text-white/40">
        <span>Trades: {stats.trades}</span>
        <span>Win Rate: {(stats.winRate * 100).toFixed(0)}%</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};
