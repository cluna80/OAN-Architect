import React, { useState } from 'react';
import { 
  X, Save, Brain, Zap, Shield, Swords, Heart, Target, 
  TrendingUp, Users, MessageCircle, Image as ImageIcon,
  Settings, Activity
} from 'lucide-react';
import { useGraphStore } from '../stores/useGraphStore';
import { useOANEngine } from '../hooks/useOANEngine';
import { ImageDropZone } from './ImageDropZone';
import { EntityChat } from './EntityChat';

interface EntityConfigWindowProps {
  nodeId: string;
  entityData: any;
  onClose: () => void;
}

export const EntityConfigWindow: React.FC<EntityConfigWindowProps> = ({
  nodeId,
  entityData,
  onClose
}) => {
  const { updateNodeData, nodes } = useGraphStore();
  const { trainEntity, simulateMatch } = useOANEngine();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'training' | 'appearance' | 'chat'>('overview');
  const [training, setTraining] = useState(false);
  const [matchTarget, setMatchTarget] = useState('');

  const isOANConnected = !!entityData.oan_entity_id;
  const otherEntities = nodes.filter(n => 
    n.type === 'entity' && 
    n.id !== nodeId && 
    n.data.oan_entity_id
  );

  const handleTrainSkill = async (skill: string, intensity: number) => {
    if (!isOANConnected) return;
    setTraining(true);
    await trainEntity(nodeId, skill, intensity);
    setTraining(false);
  };

  const handleRunMatch = async () => {
    if (!matchTarget || !isOANConnected) return;
    const result = await simulateMatch(nodeId, matchTarget);
    if (result) {
      alert(`Match Result!\n\n${entityData.label} vs ${nodes.find(n => n.id === matchTarget)?.data.label}\n\nScore: ${result.result.score_a.toFixed(1)} - ${result.result.score_b.toFixed(1)}\n\nWinner: ${result.result.winner === 1 ? entityData.label : 'Opponent'}`);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'training', label: 'Training', icon: Zap },
    { id: 'appearance', label: 'Appearance', icon: ImageIcon },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[90vh] bg-gradient-to-br from-[#0a0a1f] to-[#0f0f2e] border-2 border-[#c084fc] rounded-2xl shadow-2xl shadow-[#c084fc]/30 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-[#c084fc]/20 bg-gradient-to-r from-[#c084fc]/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Settings className="w-8 h-8 text-[#c084fc] animate-spin-slow" />
                <Brain className={`w-5 h-5 absolute -top-1 -right-1 ${isOANConnected ? 'text-[#22d3ee] animate-pulse' : 'text-white/40'}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{entityData.label}</h2>
                <p className="text-sm text-white/60">
                  {isOANConnected 
                    ? `Entity ID: ${entityData.oan_entity_id?.substring(0, 20)}...`
                    : 'Not connected to OAN Protocol'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-all hover:rotate-90 duration-300"
            >
              <X className="w-6 h-6 text-white/60" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#c084fc]/20 border-2 border-[#c084fc]/40 text-[#c084fc]'
                    : 'bg-white/5 border-2 border-transparent text-white/60 hover:border-white/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#22d3ee]/20 to-[#22d3ee]/5 border-2 border-[#22d3ee]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-[#22d3ee]" />
                    <span className="text-xs text-white/60 uppercase">Confidence</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{entityData.reputation || 50}%</div>
                </div>

                <div className="bg-gradient-to-br from-[#f472b6]/20 to-[#f472b6]/5 border-2 border-[#f472b6]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-[#f472b6]" />
                    <span className="text-xs text-white/60 uppercase">Win Rate</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{entityData.energy || 0}%</div>
                </div>

                <div className="bg-gradient-to-br from-[#c084fc]/20 to-[#c084fc]/5 border-2 border-[#c084fc]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Swords className="w-5 h-5 text-[#c084fc]" />
                    <span className="text-xs text-white/60 uppercase">Record</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {entityData.wins || 0}W-{entityData.losses || 0}L
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#22d3ee]/20 to-[#22d3ee]/5 border-2 border-[#22d3ee]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-[#22d3ee]" />
                    <span className="text-xs text-white/60 uppercase">Experience</span>
                  </div>
                  <div className="text-2xl font-bold text-[#22d3ee] font-mono">
                    {entityData.experience || 0} XP
                  </div>
                </div>
              </div>

              {/* Skills Overview */}
              {isOANConnected && entityData.stats && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#c084fc]" />
                    Current Skills
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(entityData.stats).map(([skill, value]) => (
                      <div key={skill}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-white/80 capitalize">{skill}</span>
                          <span className="text-[#22d3ee] font-mono">{(value as number).toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#c084fc] to-[#22d3ee] transition-all duration-500"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Simulation */}
              {isOANConnected && otherEntities.length > 0 && (
                <div className="bg-gradient-to-br from-[#f472b6]/10 to-transparent border border-[#f472b6]/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#f472b6]" />
                    Quick Match
                  </h3>
                  <div className="flex gap-3">
                    <select
                      value={matchTarget}
                      onChange={(e) => setMatchTarget(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#f472b6] outline-none"
                    >
                      <option value="">Select opponent...</option>
                      {otherEntities.map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.data.label} ({entity.data.wins || 0}W-{entity.data.losses || 0}L)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleRunMatch}
                      disabled={!matchTarget}
                      className="px-6 py-3 bg-gradient-to-r from-[#f472b6] to-[#f472b6]/80 text-white rounded-lg font-bold disabled:opacity-50 hover:shadow-lg hover:shadow-[#f472b6]/30 transition-all flex items-center gap-2"
                    >
                      <Swords className="w-5 h-5" />
                      Fight!
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRAINING TAB */}
          {activeTab === 'training' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#c084fc]/10 to-transparent border border-[#c084fc]/20 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-[#c084fc]" />
                  Skill Training
                </h3>
                
                {['strength', 'agility', 'stamina', 'skill'].map((skill) => (
                  <div key={skill} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {skill === 'strength' && <Swords className="w-5 h-5 text-red-400" />}
                        {skill === 'agility' && <Zap className="w-5 h-5 text-yellow-400" />}
                        {skill === 'stamina' && <Heart className="w-5 h-5 text-green-400" />}
                        {skill === 'skill' && <Target className="w-5 h-5 text-blue-400" />}
                        <span className="text-lg font-bold text-white capitalize">{skill}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTrainSkill(skill, 5)}
                          disabled={training || !isOANConnected}
                          className="px-3 py-1 text-sm bg-[#c084fc]/20 hover:bg-[#c084fc]/30 text-[#c084fc] rounded-lg transition-all disabled:opacity-50"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleTrainSkill(skill, 10)}
                          disabled={training || !isOANConnected}
                          className="px-3 py-1 text-sm bg-[#c084fc]/20 hover:bg-[#c084fc]/30 text-[#c084fc] rounded-lg transition-all disabled:opacity-50"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleTrainSkill(skill, 20)}
                          disabled={training || !isOANConnected}
                          className="px-3 py-1 text-sm bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 text-[#22d3ee] rounded-lg transition-all disabled:opacity-50"
                        >
                          +20
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#c084fc] to-[#22d3ee] transition-all duration-500"
                        style={{ width: `${((entityData.stats && entityData.stats[skill]) || 50)}%` }}
                      />
                    </div>
                    <div className="text-sm text-white/60 mt-1 text-right font-mono">
                      {((entityData.stats && entityData.stats[skill]) || 50).toFixed(1)} / 100
                    </div>
                  </div>
                ))}

                <div className="mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => {
                      ['strength', 'agility', 'stamina', 'skill'].forEach(skill => 
                        handleTrainSkill(skill, 10)
                      );
                    }}
                    disabled={training || !isOANConnected}
                    className="w-full py-3 bg-gradient-to-r from-[#c084fc] to-[#22d3ee] text-white rounded-lg font-bold hover:shadow-lg hover:shadow-[#c084fc]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    {training ? 'Training...' : 'Train All Skills (+10)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-[#c084fc]" />
                  Robot Appearance
                </h3>
                
                <ImageDropZone
                  currentImage={entityData.spriteUrl}
                  onImageChange={(url) => updateNodeData(nodeId, { spriteUrl: url })}
                  entityName={entityData.label}
                />

                <div className="mt-6 p-4 bg-[#22d3ee]/10 border border-[#22d3ee]/20 rounded-lg">
                  <p className="text-sm text-white/80">
                    í²¡ <strong>Tip:</strong> Use transparent PNG images for best results. 
                    Recommended size: 512x512px or larger.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="h-full">
              {isOANConnected ? (
                <EntityChat
                  nodeId={nodeId}
                  entityName={entityData.label}
                  entityData={entityData}
                  onClose={() => {}}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Brain className="w-16 h-16 mx-auto mb-4 text-white/20" />
                    <p className="text-white/60 mb-4">Entity must be connected to OAN to chat</p>
                    <button
                      className="px-6 py-3 bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 text-[#22d3ee] rounded-lg transition-all"
                    >
                      Initialize Brain First
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
