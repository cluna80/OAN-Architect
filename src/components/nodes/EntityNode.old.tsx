import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, Shield, Brain, Trophy, Target, TrendingUp, MessageCircle } from 'lucide-react';
import { useOANEngine } from '../../hooks/useOANEngine';
import { EntityChat } from '../EntityChat';

export const EntityNode = ({ data, selected, id }: any) => {
  const { createOANEntity, trainEntity } = useOANEngine();
  const [showChat, setShowChat] = useState(false);

  const handleInitialize = async () => {
    if (!data.oan_entity_id) {
      await createOANEntity(id, data.label);
    }
  };

  const handleQuickTrain = async () => {
    if (data.oan_entity_id) {
      await trainEntity(id, 'strength', 5);
    }
  };

  const isOANConnected = !!data.oan_entity_id;
  const winRate = data.energy || 0;
  const confidence = data.reputation || 50;
  const wins = data.wins || 0;
  const losses = data.losses || 0;
  const xp = data.experience || 0;

  return (
    <>
      <div className={`px-4 py-3 shadow-lg rounded-md bg-[#0a0a1f] border-2 transition-all duration-300 ${
        selected 
          ? 'border-[#c084fc] shadow-[0_0_15px_rgba(192,132,252,0.5)]' 
          : isOANConnected 
            ? 'border-[#22d3ee] shadow-[0_0_10px_rgba(34,211,238,0.3)]'
            : 'border-[#6b7280] shadow-[0_0_10px_rgba(107,114,128,0.2)]'
      } hover:scale-105`}>
        <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[#f472b6] border-none" />
        
        <div className="flex flex-col gap-2 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1">
            <span className="text-[10px] font-mono text-[#22d3ee] uppercase tracking-wider">
              {isOANConnected ? `ID: ${data.oan_entity_id?.substring(0, 8)}` : 'Not Connected'}
            </span>
            <Brain className={`w-4 h-4 ${isOANConnected ? 'text-[#22d3ee] animate-pulse' : 'text-gray-500'}`} />
          </div>
          
          <div className="text-sm font-bold text-white mb-1">{data.label}</div>
          
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] text-white/60 uppercase">
                <span className="flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> Confidence
                </span>
                <span>{confidence}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#c084fc] to-[#22d3ee] transition-all duration-500" 
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] text-white/60 uppercase">
                <span className="flex items-center gap-1">
                  <Trophy className="w-2.5 h-2.5" /> Win Rate
                </span>
                <span>{winRate}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#f472b6] to-[#c084fc] transition-all duration-500" 
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>

            {isOANConnected && (
              <>
                <div className="flex items-center justify-between text-[10px] text-white/60">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Record:
                  </span>
                  <span className="font-mono text-white">
                    {wins}W - {losses}L
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/60">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    XP:
                  </span>
                  <span className="font-mono text-[#22d3ee]">
                    {xp} / {Math.floor(xp / 100) * 100 + 100}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-1 mt-2 pt-2 border-t border-white/10">
            {!isOANConnected ? (
              <button
                onClick={handleInitialize}
                className="flex-1 px-2 py-1 text-[10px] font-mono uppercase bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 text-[#22d3ee] rounded transition-colors"
              >
                <Brain className="w-3 h-3 inline mr-1" />
                Initialize Brain
              </button>
            ) : (
              <>
                <button
                  onClick={handleQuickTrain}
                  className="flex-1 px-2 py-1 text-[10px] font-mono uppercase bg-[#c084fc]/20 hover:bg-[#c084fc]/30 text-[#c084fc] rounded transition-colors"
                >
                  <Zap className="w-3 h-3 inline mr-1" />
                  Train
                </button>
                <button
                  onClick={() => setShowChat(true)}
                  className="flex-1 px-2 py-1 text-[10px] font-mono uppercase bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 text-[#22d3ee] rounded transition-colors"
                >
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  Chat
                </button>
              </>
            )}
          </div>
        </div>

        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[#22d3ee] border-none" />
      </div>

      {showChat && (
        <EntityChat
          nodeId={id}
          entityName={data.label}
          entityData={data}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
};
