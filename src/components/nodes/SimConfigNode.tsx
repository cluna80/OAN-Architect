import { Handle, Position } from 'reactflow';
import { Settings2, Activity } from 'lucide-react';

export const SimConfigNode = ({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-md bg-[#0a0a1f] border-2 transition-all duration-300 ${selected ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]'}`}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 border-b border-white/10 pb-1">
          <Settings2 className="w-4 h-4 text-white" />
          <span className="text-[10px] font-mono text-white uppercase tracking-wider">Simulation Config</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-white/60 uppercase">Cycles/Sec</span>
            <span className="text-xs font-mono text-[#22d3ee]">{data.cyclesPerSec || 60}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-white/60 uppercase">Match Sim</span>
            <div className={`w-3 h-3 rounded-full ${data.matchSim ? 'bg-[#22d3ee] shadow-[0_0_5px_#22d3ee]' : 'bg-white/10'}`} />
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-white border-none" />
    </div>
  );
};
