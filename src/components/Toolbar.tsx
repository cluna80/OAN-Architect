import React, { useState, useEffect } from 'react';
import { 
  Zap, MessageSquare, Users, Settings, Save, Play, Square,
  FileJson, Package, Wallet, TrendingUp, Bot, Rocket 
} from 'lucide-react';
import { useGraphStore } from '../stores/useGraphStore';
import { TemplateSelector } from './TemplateSelector';
import { startSimulation, stopSimulation, getSimulation } from '../services/simulationEngine';

export const Toolbar = () => {
  const { addNode, nodes } = useGraphStore();
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const sim = getSimulation();
      if (sim) {
        setIsSimulating(sim.isActive());
        setCycleCount(sim.getCycleCount());
      } else {
        setIsSimulating(false);
        setCycleCount(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleRunSim = () => {
    const oanEntities = nodes.filter(n => n.type === 'entity' && n.data.oan_entity_id);
    
    if (oanEntities.length === 0) {
      alert('⚠️ No OAN entities found!\n\n1. Add Entity nodes\n2. Click "Initialize Brain" on each\n3. Then click Run Sim');
      return;
    }

    if (isSimulating) {
      stopSimulation();
      setIsSimulating(false);
      setCycleCount(0);
    } else {
      startSimulation({
        speed: 2000,
        autoTrain: true,
        autoMatch: true,
        maxCycles: 30
      });
      setIsSimulating(true);
    }
  };

  const nodeButtons = [
    { 
      type: 'entity', 
      label: 'Entity', 
      icon: Zap, 
      color: 'text-[#22d3ee]',
      bgColor: 'bg-[#22d3ee]/10 hover:bg-[#22d3ee]/20 border-[#22d3ee]/30'
    },
    { 
      type: 'wallet', 
      label: 'Wallet', 
      icon: Wallet, 
      color: 'text-[#10b981]',
      bgColor: 'bg-[#10b981]/10 hover:bg-[#10b981]/20 border-[#10b981]/30'
    },
    { 
      type: 'marketData', 
      label: 'Market', 
      icon: TrendingUp, 
      color: 'text-[#f59e0b]',
      bgColor: 'bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 border-[#f59e0b]/30'
    },
    { 
      type: 'tradingAgent', 
      label: 'Trader', 
      icon: Bot, 
      color: 'text-[#8b5cf6]',
      bgColor: 'bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border-[#8b5cf6]/30'
    },
    { 
      type: 'prompt', 
      label: 'Prompt', 
      icon: MessageSquare, 
      color: 'text-[#c084fc]',
      bgColor: 'bg-[#c084fc]/10 hover:bg-[#c084fc]/20 border-[#c084fc]/30'
    },
    { 
      type: 'relationship', 
      label: 'Relation', 
      icon: Users, 
      color: 'text-[#f472b6]',
      bgColor: 'bg-[#f472b6]/10 hover:bg-[#f472b6]/20 border-[#f472b6]/30'
    },
    { 
      type: 'simConfig', 
      label: 'Config', 
      icon: Settings, 
      color: 'text-white',
      bgColor: 'bg-white/10 hover:bg-white/20 border-white/30'
    },
  ];

  return (
    <>
      <div className="h-16 bg-[#0a0a1f] border-b border-white/10 px-6 flex items-center justify-between backdrop-blur-xl">
        {/* Left - Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#c084fc] to-[#22d3ee] rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">OAN ARCHITECT</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Web3 Agent Protocol</p>
          </div>
        </div>

        {/* Center - Node Buttons */}
        <div className="flex gap-2">
          {nodeButtons.map((btn) => (
            <button
              key={btn.type}
              onClick={() => addNode(btn.type as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${btn.bgColor}`}
              title={`Add ${btn.label} Node`}
            >
              <btn.icon className={`w-4 h-4 ${btn.color}`} />
              <span className={`text-sm font-medium ${btn.color}`}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Right - Actions */}
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#c084fc]/20 to-[#8b5cf6]/20 hover:from-[#c084fc]/30 hover:to-[#8b5cf6]/30 border border-[#c084fc]/40 rounded-lg transition-all"
          >
            <Rocket className="w-4 h-4 text-[#c084fc]" />
            <span className="text-sm text-[#c084fc] font-medium">Templates</span>
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all">
            <Save className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/80">Save</span>
          </button>
          
          <button 
            onClick={handleRunSim}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isSimulating 
                ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-400/40' 
                : 'bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 border border-[#22d3ee]/40'
            }`}
          >
            {isSimulating ? (
              <>
                <Square className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400 font-medium">Stop ({cycleCount})</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-[#22d3ee]" />
                <span className="text-sm text-[#22d3ee] font-medium">Run Sim</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showTemplates && <TemplateSelector onClose={() => setShowTemplates(false)} />}
    </>
  );
};
