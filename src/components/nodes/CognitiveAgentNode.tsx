import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Brain, Zap, Heart, Battery, Sparkles, Play, Square, History, Wallet, RotateCcw } from 'lucide-react';
import { cognitiveApi } from '../../services/cognitiveApi';

export const CognitiveAgentNode = ({ data, id }: any) => {
  const [isActive, setIsActive] = useState(false);
  const [emotion, setEmotion] = useState('calm');
  const [energy, setEnergy] = useState(100);
  const [reasoning, setReasoning] = useState('Initializing AI brain...');
  const [useLLM, setUseLLM] = useState(true);
  const [stats, setStats] = useState({
    profit: 0,
    trades: 0,
    winRate: 0,
    wins: 0,
    losses: 0,
    balance: 10000
  });
  const [memoryCount, setMemoryCount] = useState(0);
  const [activeTradingSession, setActiveTradingSession] = useState<string | null>(null);

  const emotionColors: Record<string, string> = {
    calm: 'text-blue-400 border-blue-400',
    greedy: 'text-green-400 border-green-400',
    fearful: 'text-red-400 border-red-400',
    aggressive: 'text-orange-400 border-orange-400'
  };

  const emotionIcons: Record<string, string> = {
    calm: 'Ì∏å',
    greedy: 'Ì¥ë',
    fearful: 'Ì∏∞',
    aggressive: 'Ì∏§'
  };

  const currentEmotionColor = emotionColors[emotion] || 'text-white border-white/20';
  const currentEmotionIcon = emotionIcons[emotion] || 'Ì¥ñ';
  const energyColor = energy > 70 ? 'bg-green-500' : energy > 40 ? 'bg-yellow-500' : 'bg-red-500';

  // Find ANY active trading session using the new endpoint
  useEffect(() => {
    if (!isActive) return;

    const findActiveSession = async () => {
      try {
        const response = await fetch('http://localhost:8000/trading/sessions/active');
        const data = await response.json();
        
        if (data.sessions && data.sessions.length > 0) {
          // Use the first active session
          const sessionId = data.sessions[0].id;
          setActiveTradingSession(sessionId);
          console.log(`[${data.label}] Connected to trading session: ${sessionId}`);
        } else {
          // No active sessions, create our own
          const newSession = `cognitive-${id}`;
          setActiveTradingSession(newSession);
          await fetch(`http://localhost:8000/trading/start/${newSession}`, { method: 'POST' });
          console.log(`[${data.label}] Created new session: ${newSession}`);
        }
      } catch (error) {
        console.error('Error finding trading session:', error);
        // Fallback
        setActiveTradingSession(`cognitive-${id}`);
      }
    };

    findActiveSession();
    // Re-check every 10 seconds in case a new trading agent starts
    const interval = setInterval(findActiveSession, 10000);
    
    return () => clearInterval(interval);
  }, [isActive, id, data.label]);

  // Fetch balance from trading session
  useEffect(() => {
    if (!isActive || !activeTradingSession) return;

    const balanceInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/trading/stats/${activeTradingSession}`);
        if (response.ok) {
          const tradingStats = await response.json();
          
          setStats({
            balance: tradingStats.balance || 10000,
            profit: tradingStats.profit || 0,
            trades: tradingStats.trades || 0,
            wins: tradingStats.wins || 0,
            losses: (tradingStats.trades || 0) - (tradingStats.wins || 0),
            winRate: tradingStats.win_rate ? tradingStats.win_rate / 100 : 0
          });
          
          setMemoryCount(tradingStats.trades || 0);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    }, 1000);

    return () => clearInterval(balanceInterval);
  }, [isActive, activeTradingSession]);

  // Main cognitive loop
  useEffect(() => {
    if (!isActive || !activeTradingSession) return;

    const interval = setInterval(async () => {
      try {
        const decision = await cognitiveApi.getDecision(id, null, useLLM);
        
        if (decision.emotion) setEmotion(decision.emotion);
        if (decision.energy?.percentage) setEnergy(decision.energy.percentage);
        if (decision.reasoning) setReasoning(decision.reasoning);

        if (decision.action === 'buy' || decision.action === 'sell') {
          const tradeResponse = await fetch(
            `http://localhost:8000/trading/auto/${activeTradingSession}?confidence=${decision.confidence || 0.5}`,
            { method: 'POST' }
          );
          const tradeResult = await tradeResponse.json();
          
          if (tradeResult.stats) {
            await cognitiveApi.updateEmotion(
              id, 
              tradeResult.stats.profit,
              tradeResult.stats.win_rate / 100
            );
            
            console.log(`[${data.label}] ${decision.action.toUpperCase()}: $${tradeResult.profit?.toFixed(2)} | Balance: $${tradeResult.stats.balance.toFixed(2)}`);
          }
        }

        if (decision.energy?.percentage && decision.energy.percentage < 20) {
          await cognitiveApi.rest(id);
        }

      } catch (error) {
        console.error('Cognitive decision error:', error);
        setReasoning('Error connecting to AI brain');
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isActive, id, useLLM, data.label, activeTradingSession]);

  const handleReset = async () => {
    await cognitiveApi.clearMemory(id);
    setMemoryCount(0);
    setReasoning('Memory cleared!');
    setTimeout(() => setReasoning('Initializing AI brain...'), 2000);
  };

  return (
    <div className={`relative bg-gradient-to-br from-[#0a0a1f] to-[#1a1a3f] border-2 ${currentEmotionColor} rounded-xl p-4 min-w-[320px] shadow-2xl transition-all ${isActive ? 'ring-2 ring-purple-500/50' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-white text-sm">{data.label || 'AI Trader'}</span>
          <span className="text-xl">{currentEmotionIcon}</span>
        </div>
        <div className="flex items-center gap-1">
          {useLLM && <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />}
          {isActive && <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />}
          {memoryCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-md">
              <History className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-purple-400 font-bold">{memoryCount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-green-400 text-xs">
            <Wallet className="w-3 h-3" />
            <span>Wallet</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-green-400">${stats.balance.toFixed(2)}</span>
            <span className={`text-[10px] ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="flex items-center gap-1 text-white/60 mb-1">
            <Heart className="w-3 h-3" />
          </div>
          <span className={`font-bold capitalize text-[10px] ${currentEmotionColor.split(' ')[0]}`}>
            {emotion}
          </span>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-white/60 mb-1 text-[10px]">Trades</div>
          <span className="font-bold text-white text-sm">
            {stats.trades}
          </span>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-white/60 mb-1 text-[10px]">W/L</div>
          <span className="font-bold text-white text-sm">
            {stats.wins}/{stats.losses}
          </span>
        </div>
      </div>

      {reasoning && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 mb-3 max-h-16 overflow-hidden">
          <div className="text-[9px] text-purple-300 mb-1 flex items-center justify-between">
            <span>AI REASONING</span>
            {useLLM && <span className="text-yellow-400">Ì∑†</span>}
          </div>
          <p className="text-[9px] text-white/80 line-clamp-2 leading-tight">{reasoning}</p>
        </div>
      )}

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg font-medium text-xs transition-all ${
            isActive
              ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-400'
              : 'bg-green-500/20 hover:bg-green-500/30 border border-green-400/40 text-green-400'
          }`}
        >
          {isActive ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isActive ? 'STOP' : 'START'}</span>
        </button>

        <button
          onClick={() => setUseLLM(!useLLM)}
          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
            useLLM
              ? 'bg-purple-500/20 border border-purple-400/40 text-purple-400'
              : 'bg-white/10 border border-white/20 text-white/60'
          }`}
        >
          {useLLM ? 'Ì∑†' : 'Ì≥è'}
        </button>

        <button
          onClick={handleReset}
          className="px-2 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/40 text-orange-400 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      <div className="pt-2 border-t border-white/10 flex justify-between text-[9px] text-white/40">
        <span>Win: {(stats.winRate * 100).toFixed(0)}%</span>
        {activeTradingSession && (
          <span className="text-purple-400 text-[8px]">Ì¥ó Active</span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};
