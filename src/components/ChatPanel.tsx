import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, Send, Loader, ChevronDown, Brain, 
  Bot, X, Minimize2, Maximize2, Users, Zap
} from 'lucide-react';
import { useGraphStore } from '../stores/useGraphStore';

interface Message {
  role: 'user' | 'agent' | 'conversation';
  content: string;
  agentName?: string;
  timestamp: Date;
  conversation?: Array<{
    entity: string;
    message: string;
    stats?: any;
  }>;
}

export const ChatPanel = () => {
  const { nodes } = useGraphStore();
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agents = nodes.filter(n => 
    (n.type === 'entity' && n.data.oan_entity_id) || 
    (n.type === 'tradingAgent')
  );

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !selectedAgent) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }]);
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/entities/${selectedAgent}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      
      const data = await response.json();
      
      if (data.message) {
        setMessages(prev => [...prev, { 
          role: 'agent', 
          content: data.message,
          agentName: data.entity,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: '❌ Error: Make sure Ollama is running and backend is active.',
        agentName: selectedAgentData?.data.label,
        timestamp: new Date()
      }]);
    }
    setLoading(false);
  };

  const handleEntityConversation = async () => {
    const oanEntities = agents.filter(a => a.type === 'entity' && a.data.oan_entity_id);
    
    if (oanEntities.length < 2) {
      alert('Need at least 2 OAN entities for a conversation!');
      return;
    }

    setLoading(true);
    
    try {
      // Pick two random entities
      const e1 = oanEntities[Math.floor(Math.random() * oanEntities.length)];
      const e2 = oanEntities.filter(e => e.id !== e1.id)[Math.floor(Math.random() * (oanEntities.length - 1))];

      const response = await fetch('http://localhost:8000/entities/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_a_id: e1.id,
          entity_b_id: e2.id,
          topic: "What do you think about your recent matches?"
        })
      });

      const data = await response.json();

      if (data.conversation) {
        setMessages(prev => [...prev, {
          role: 'conversation',
          content: `${data.conversation[0].entity} and ${data.conversation[1].entity} are talking...`,
          timestamp: new Date(),
          conversation: data.conversation
        }]);
      }
    } catch (error) {
      console.error('Conversation error:', error);
    }

    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 bottom-4 p-4 bg-gradient-to-br from-[#22d3ee] to-[#8b5cf6] rounded-full shadow-2xl hover:shadow-[#22d3ee]/50 transition-all z-50"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed left-0 bottom-0 w-80 bg-gradient-to-br from-[#0a0a1f] to-[#0f0f2e] border-2 border-[#22d3ee] rounded-tr-2xl shadow-2xl z-50">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#22d3ee]" />
            <span className="font-bold text-white">Agent Chat</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-16 bottom-0 w-96 bg-gradient-to-br from-[#0a0a1f] to-[#0f0f2e] border-r-2 border-[#22d3ee] shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#22d3ee]/20 bg-gradient-to-r from-[#22d3ee]/10 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#22d3ee]" />
            <span className="font-bold text-white">Entity Communication</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <Minimize2 className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={handleEntityConversation}
          disabled={loading || agents.filter(a => a.type === 'entity' && a.data.oan_entity_id).length < 2}
          className="w-full mb-3 px-3 py-2 bg-gradient-to-r from-[#8b5cf6]/20 to-[#c084fc]/20 hover:from-[#8b5cf6]/30 hover:to-[#c084fc]/30 border border-[#8b5cf6]/40 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Users className="w-4 h-4 text-[#8b5cf6]" />
          <span className="text-sm text-[#8b5cf6] font-medium">Entity Conversation</span>
        </button>

        {/* Agent Selector */}
        <div className="space-y-2">
          <label className="text-xs text-white/60 uppercase tracking-wider">
            Or Chat 1-on-1
          </label>
          <select
            value={selectedAgent || ''}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="w-full bg-white/5 border-2 border-white/10 focus:border-[#22d3ee] rounded-lg px-3 py-2 text-white text-sm outline-none transition-all"
          >
            <option value="">Choose an agent...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.type === 'entity' ? '���' : '���'} {agent.data.label}
                {agent.type === 'entity' && ` (${agent.data.wins || 0}W-${agent.data.losses || 0}L)`}
              </option>
            ))}
          </select>
        </div>

        {selectedAgentData && (
          <div className="mt-3 p-2 bg-[#22d3ee]/10 border border-[#22d3ee]/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-white/80">
              {selectedAgentData.type === 'entity' ? (
                <>
                  <Brain className="w-4 h-4 text-[#22d3ee]" />
                  <span>Confidence: {selectedAgentData.data.reputation || 50}%</span>
                  <span>•</span>
                  <span>XP: {selectedAgentData.data.experience || 0}</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 text-[#8b5cf6]" />
                  <span>{selectedAgentData.data.strategy}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <p className="text-white/60 text-sm mb-4">
              No conversations yet
            </p>
            <p className="text-white/40 text-xs">
              Click "Entity Conversation" to watch entities talk,<br/>
              or select an agent for 1-on-1 chat
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx}>
              {msg.role === 'conversation' && msg.conversation ? (
                <div className="bg-gradient-to-br from-[#8b5cf6]/10 to-transparent border border-[#8b5cf6]/30 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-[#8b5cf6] font-bold uppercase border-b border-[#8b5cf6]/20 pb-2">
                    <Users className="w-4 h-4" />
                    Entity Conversation
                  </div>
                  
                  {msg.conversation.map((turn, tidx) => (
                    <div key={tidx} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-3 h-3 text-[#22d3ee]" />
                        <span className="text-xs font-bold text-[#22d3ee]">{turn.entity}</span>
                        {turn.stats && (
                          <span className="text-xs text-white/40">
                            ({turn.stats.wins}W-{turn.stats.losses}L, {Math.round(turn.stats.confidence * 100)}%)
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white leading-relaxed">{turn.message}</p>
                    </div>
                  ))}
                  
                  <span className="text-[9px] text-white/40 block text-right">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ) : (
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#c084fc]/30 to-[#c084fc]/10 border border-[#c084fc]/40'
                        : 'bg-gradient-to-br from-[#22d3ee]/20 to-[#22d3ee]/5 border border-[#22d3ee]/30'
                    }`}
                  >
                    {msg.role === 'agent' && (
                      <div className="flex items-center gap-2 mb-1 pb-1 border-b border-[#22d3ee]/20">
                        <Brain className="w-3 h-3 text-[#22d3ee]" />
                        <span className="text-[10px] text-[#22d3ee] font-bold uppercase">
                          {msg.agentName}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                    <span className="text-[9px] text-white/40 mt-1 block">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-center">
            <div className="bg-[#22d3ee]/10 border border-[#22d3ee]/30 px-4 py-2 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 text-[#22d3ee] animate-spin" />
              <span className="text-xs text-white/60">Entities thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#22d3ee]/20 bg-gradient-to-r from-[#22d3ee]/5 to-transparent">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={selectedAgent ? "Ask anything..." : "Select an agent first"}
            disabled={!selectedAgent || loading}
            className="flex-1 bg-white/5 border border-white/10 focus:border-[#22d3ee] rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/40 outline-none transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || !selectedAgent}
            className="px-4 py-2 bg-gradient-to-br from-[#22d3ee] to-[#22d3ee]/80 hover:from-[#22d3ee]/90 hover:to-[#22d3ee]/70 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
