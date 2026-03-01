import React, { useState } from 'react';
import { useGraphStore } from '../stores/useGraphStore';
import { useOANEngine } from '../hooks/useOANEngine';
import { 
  X, Save, Trash2, Sliders, Info, Brain, Zap, Shield, 
  Swords, Target, Heart, Gauge, TrendingUp, Users, Flag 
} from 'lucide-react';

export const Sidebar = () => {
  const { selectedNode, updateNodeData, setSelectedNode, setNodes, nodes } = useGraphStore();
  const { trainEntity, simulateMatch } = useOANEngine();
  
  const [training, setTraining] = useState(false);
  const [matchTarget, setMatchTarget] = useState<string>('');

  if (!selectedNode) {
    return (
      <div className="w-96 bg-[#0a0a1f]/80 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-white/40 mb-4">
          <Info className="w-5 h-5" />
          <span className="text-sm font-medium">Select a node to edit properties</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center opacity-20">
            <Sliders className="w-16 h-16 mx-auto mb-2" />
            <p className="text-xs uppercase tracking-widest">No Selection</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    setNodes(nodes.filter(n => n.id !== selectedNode.id));
    setSelectedNode(null);
  };

  const handleTrainSkill = async (skill: string, intensity: number) => {
    if (!selectedNode.data.oan_entity_id) return;
    setTraining(true);
    await trainEntity(selectedNode.id, skill, intensity);
    setTraining(false);
  };

  const handleRunMatch = async () => {
    if (!matchTarget || !selectedNode.data.oan_entity_id) return;
    const result = await simulateMatch(selectedNode.id, matchTarget);
    if (result) {
      alert(`Match Result: ${result.result.winner === 1 ? selectedNode.data.label : 'Opponent'} wins! Score: ${result.result.score_a.toFixed(1)} - ${result.result.score_b.toFixed(1)}`);
    }
  };

  const isOANConnected = !!selectedNode.data.oan_entity_id;
  const otherEntities = nodes.filter(n => 
    n.type === 'entity' && 
    n.id !== selectedNode.id && 
    n.data.oan_entity_id
  );

  return (
    <div className="w-96 bg-[#0a0a1f]/90 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${isOANConnected ? 'bg-[#22d3ee]' : 'bg-[#6b7280]'}`} />
          {isOANConnected ? 'Entity Control' : 'Properties'}
        </h2>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Common Fields */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Entity Name</label>
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#c084fc] outline-none transition-all"
          />
        </div>

        {/* OAN Connection Status */}
        {selectedNode.type === 'entity' && (
          <div className={`p-3 rounded border ${isOANConnected ? 'bg-[#22d3ee]/10 border-[#22d3ee]/20' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-2 text-xs">
              <Brain className={`w-4 h-4 ${isOANConnected ? 'text-[#22d3ee]' : 'text-white/40'}`} />
              <span className={isOANConnected ? 'text-[#22d3ee]' : 'text-white/40'}>
                {isOANConnected ? `Connected: ${selectedNode.data.oan_entity_id?.substring(0, 12)}...` : 'Not Connected to OAN'}
              </span>
            </div>
          </div>
        )}

        {/* Entity Brain Stats (Read-Only) */}
        {selectedNode.type === 'entity' && isOANConnected && (
          <div className="space-y-4 p-4 bg-white/5 rounded border border-white/10">
            <h3 className="text-[10px] uppercase tracking-widest text-[#22d3ee] font-bold flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Brain Statistics
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-white/40 mb-1">Confidence</div>
                <div className="text-white font-mono">{selectedNode.data.reputation || 50}%</div>
              </div>
              <div>
                <div className="text-white/40 mb-1">Win Rate</div>
                <div className="text-white font-mono">{selectedNode.data.energy || 0}%</div>
              </div>
              <div>
                <div className="text-white/40 mb-1">Record</div>
                <div className="text-white font-mono">{selectedNode.data.wins || 0}W-{selectedNode.data.losses || 0}L</div>
              </div>
              <div>
                <div className="text-white/40 mb-1">Experience</div>
                <div className="text-[#22d3ee] font-mono">{selectedNode.data.experience || 0} XP</div>
              </div>
            </div>
          </div>
        )}

        {/* Skill Training Controls (OAN Connected) */}
        {selectedNode.type === 'entity' && isOANConnected && (
          <div className="space-y-4 p-4 bg-[#c084fc]/5 rounded border border-[#c084fc]/20">
            <h3 className="text-[10px] uppercase tracking-widest text-[#c084fc] font-bold flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Skill Training
            </h3>
            
            {['strength', 'agility', 'stamina', 'skill'].map((skill) => (
              <div key={skill} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold flex items-center gap-1">
                    {skill === 'strength' && <Swords className="w-3 h-3" />}
                    {skill === 'agility' && <Zap className="w-3 h-3" />}
                    {skill === 'stamina' && <Heart className="w-3 h-3" />}
                    {skill === 'skill' && <Target className="w-3 h-3" />}
                    {skill.charAt(0).toUpperCase() + skill.slice(1)}
                  </label>
                  <button
                    onClick={() => handleTrainSkill(skill, 10)}
                    disabled={training}
                    className="px-2 py-1 text-[9px] font-mono uppercase bg-[#c084fc]/20 hover:bg-[#c084fc]/30 text-[#c084fc] rounded transition-colors disabled:opacity-50"
                  >
                    {training ? 'Training...' : 'Train +10'}
                  </button>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#c084fc] to-[#22d3ee] transition-all duration-500"
                    style={{ width: `${((selectedNode.data.stats && selectedNode.data.stats[skill]) || 50)}%` }}
                  />
                </div>
                <div className="text-[10px] text-white/40 font-mono text-right">
                  {((selectedNode.data.stats && selectedNode.data.stats[skill]) || 50).toFixed(1)}
                </div>
              </div>
            ))}
            
            <div className="pt-3 border-t border-white/10 flex gap-2">
              <button
                onClick={() => {
                  handleTrainSkill('strength', 5);
                  handleTrainSkill('agility', 5);
                  handleTrainSkill('stamina', 5);
                  handleTrainSkill('skill', 5);
                }}
                disabled={training}
                className="flex-1 px-3 py-2 text-[10px] font-mono uppercase bg-[#c084fc]/20 hover:bg-[#c084fc]/30 text-[#c084fc] rounded transition-colors disabled:opacity-50"
              >
                <Zap className="w-3 h-3 inline mr-1" />
                Train All +5
              </button>
            </div>
          </div>
        )}

        {/* Match Simulation (OAN Connected) */}
        {selectedNode.type === 'entity' && isOANConnected && otherEntities.length > 0 && (
          <div className="space-y-4 p-4 bg-[#f472b6]/5 rounded border border-[#f472b6]/20">
            <h3 className="text-[10px] uppercase tracking-widest text-[#f472b6] font-bold flex items-center gap-2">
              <Users className="w-3 h-3" />
              Match Simulation
            </h3>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
                Select Opponent
              </label>
              <select
                value={matchTarget}
                onChange={(e) => setMatchTarget(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#f472b6] outline-none"
              >
                <option value="">Choose entity...</option>
                {otherEntities.map(entity => (
                  <option key={entity.id} value={entity.id}>
                    {entity.data.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleRunMatch}
              disabled={!matchTarget}
              className="w-full px-3 py-2 text-[10px] font-mono uppercase bg-[#f472b6]/20 hover:bg-[#f472b6]/30 text-[#f472b6] rounded transition-colors disabled:opacity-50"
            >
              <Swords className="w-3 h-3 inline mr-1" />
              Simulate Match
            </button>
          </div>
        )}

        {/* Manual Overrides (Not Connected to OAN) */}
        {selectedNode.type === 'entity' && !isOANConnected && (
          <>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                Confidence ({selectedNode.data.reputation}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedNode.data.reputation}
                onChange={(e) => updateNodeData(selectedNode.id, { reputation: parseInt(e.target.value) })}
                className="w-full accent-[#c084fc]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                Win Rate ({selectedNode.data.energy}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedNode.data.energy}
                onChange={(e) => updateNodeData(selectedNode.id, { energy: parseInt(e.target.value) })}
                className="w-full accent-[#22d3ee]"
              />
            </div>
            
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <p className="text-[10px] text-yellow-500">
                ⚠️ Manual mode - Initialize Brain for real OAN control
              </p>
            </div>
          </>
        )}

        {/* Prompt Node */}
        {selectedNode.type === 'prompt' && (
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Ollama Prompt</label>
            <textarea
              value={selectedNode.data.prompt}
              onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-xs font-mono focus:border-[#f472b6] outline-none transition-all resize-none"
              placeholder="Enter AI decision logic..."
            />
          </div>
        )}

        {/* Relationship Node */}
        {selectedNode.type === 'relationship' && (
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
              Trust Level ({Math.round((selectedNode.data.trust || 0) * 100)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedNode.data.trust}
              onChange={(e) => updateNodeData(selectedNode.id, { trust: parseFloat(e.target.value) })}
              className="w-full accent-[#f472b6]"
            />
          </div>
        )}

        {/* Sim Config Node */}
        {selectedNode.type === 'simConfig' && (
          <>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                Cycles Per Second
              </label>
              <input
                type="number"
                value={selectedNode.data.cyclesPerSec}
                onChange={(e) => updateNodeData(selectedNode.id, { cyclesPerSec: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-white outline-none transition-all"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
              <span className="text-xs text-white/80">Match Simulation</span>
              <button
                onClick={() => updateNodeData(selectedNode.id, { matchSim: !selectedNode.data.matchSim })}
                className={`w-10 h-5 rounded-full transition-all relative ${selectedNode.data.matchSim ? 'bg-[#22d3ee]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${selectedNode.data.matchSim ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto pt-6 border-t border-white/10 flex gap-2">
        <button
          onClick={handleDelete}
          className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded py-2 text-xs font-bold uppercase tracking-wider transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
};
