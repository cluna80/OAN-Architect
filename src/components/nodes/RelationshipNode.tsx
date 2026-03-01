import { Handle, Position } from 'reactflow';
import { HeartHandshake } from 'lucide-react';

export const RelationshipNode = ({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-md bg-[#0a0a1f] border-2 transition-all duration-300 ${selected ? 'border-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-[#f472b6] shadow-[0_0_10px_rgba(244,114,182,0.2)]'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-[#c084fc] border-none" />
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 border-b border-white/10 pb-1">
          <HeartHandshake className="w-4 h-4 text-[#f472b6]" />
          <span className="text-[10px] font-mono text-[#f472b6] uppercase tracking-wider">Relationship</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] text-white/60 uppercase">
            <span>Trust Level</span>
            <span>{Math.round((data.trust || 0.5) * 100)}%</span>
          </div>
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#22d3ee]" 
              style={{ width: `${(data.trust || 0.5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-[#c084fc] border-none" />
    </div>
  );
};
