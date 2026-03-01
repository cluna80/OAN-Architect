import React, { useState } from 'react';
import { X, Rocket, FileText, ChevronRight, Zap } from 'lucide-react';
import { getTemplateList, getTemplate } from '../templates';
import { useGraphStore } from '../stores/useGraphStore';

interface TemplateSelectorProps {
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onClose }) => {
  const { setNodes, setEdges } = useGraphStore();
  const templates = getTemplateList();

  const loadTemplate = (templateKey: string) => {
    const template = getTemplate(templateKey);
    if (template) {
      setNodes(template.nodes);
      setEdges(template.edges);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gradient-to-br from-[#0a0a1f] to-[#0f0f2e] border-2 border-[#c084fc] rounded-2xl shadow-2xl shadow-[#c084fc]/30 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#c084fc]/20 bg-gradient-to-r from-[#c084fc]/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="w-8 h-8 text-[#c084fc]" />
              <div>
                <h2 className="text-2xl font-bold text-white">Demo Templates</h2>
                <p className="text-sm text-white/60">Choose a pre-built demo to get started</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-all hover:rotate-90 duration-300"
            >
              <X className="w-6 h-6 text-white/60" />
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {templates.map((template) => (
            <button
              key={template.key}
              onClick={() => loadTemplate(template.key)}
              className="w-full p-6 bg-gradient-to-br from-white/5 to-transparent border-2 border-white/10 hover:border-[#c084fc]/40 rounded-xl transition-all hover:scale-[1.02] text-left group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-[#c084fc]" />
                    <h3 className="text-lg font-bold text-white group-hover:text-[#c084fc] transition-colors">
                      {template.name}
                    </h3>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {template.description}
                  </p>
                  
                  <div className="mt-4 flex items-center gap-2 text-xs text-[#c084fc]">
                    <FileText className="w-4 h-4" />
                    <span>Click to load template</span>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-[#c084fc] group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}

          {/* Coming Soon Templates */}
          <div className="p-6 bg-white/5 border-2 border-dashed border-white/20 rounded-xl opacity-50">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="w-5 h-5 text-white/60" />
              <h3 className="text-lg font-bold text-white/60">More Demos Coming Soon</h3>
            </div>
            <p className="text-sm text-white/40">
              • Multi-Agent Swarm Trading<br />
              • NFT Market Analyzer<br />
              • DeFi Yield Optimizer<br />
              • Prediction Market Agent
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
