import { Handle, Position } from 'reactflow';
import { MessageSquareCode } from 'lucide-react';

export const PromptNode = ({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-md bg-[#0a0a1f] border-2 transition-all duration-300 ${selected ? 'border-[#f472b6] shadow-[0_0_15px_rgba(244,114,182,0.5)]' : 'border-[#c084fc] shadow-[0_0_10px_rgba(192,132,252,0.2)]'} min-w-[200px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[#22d3ee] border-none" />
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 border-b border-white/10 pb-1">
          <MessageSquareCode className="w-4 h-4 text-[#c084fc]" />
          <span className="text-[10px] font-mono text-[#c084fc] uppercase tracking-wider">Ollama Prompt</span>
        </div>
        
        <div className="text-xs font-mono text-white/80 bg-black/40 p-2 rounded border border-white/5 italic line-clamp-3">
          {data.prompt || "Enter decision logic prompt..."}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[#f472b6] border-none" />
    </div>
  );
};
