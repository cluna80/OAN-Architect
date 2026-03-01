import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader, X, Brain, Sparkles, Settings } from 'lucide-react';

interface Message {
  role: 'user' | 'entity';
  content: string;
  entity_name?: string;
  timestamp: Date;
}

interface EntityChatProps {
  nodeId: string;
  entityName: string;
  entityData: any;
  onClose: () => void;
}

export const EntityChat: React.FC<EntityChatProps> = ({ 
  nodeId, 
  entityName, 
  entityData,
  onClose 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }]);
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/entities/${nodeId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      
      const data = await response.json();
      
      if (data.message) {
        setMessages(prev => [...prev, { 
          role: 'entity', 
          content: data.message,
          entity_name: data.entity,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'entity', 
        content: 'âŒ Connection error. Make sure Ollama is running (ollama serve) and backend is active.',
        entity_name: entityName,
        timestamp: new Date()
      }]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedPrompts = [
    "How do you feel about your performance?",
    "What's your current strategy?",
    "Tell me about your strengths and weaknesses",
    "What would you do differently next time?",
    "How confident are you in your abilities?"
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-gradient-to-br from-[#0a0a1f] to-[#0f0f2e] border-2 border-[#22d3ee] rounded-2xl shadow-2xl shadow-[#22d3ee]/30 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#22d3ee]/20 bg-gradient-to-r from-[#22d3ee]/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Brain className="w-8 h-8 text-[#22d3ee]" />
                <Sparkles className="w-4 h-4 text-[#c084fc] absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {entityName}
                  <span className="text-sm font-normal text-[#22d3ee]">AI Entity</span>
                </h2>
                <div className="flex gap-4 mt-1 text-xs text-white/60">
                  <span>í²ª Confidence: <span className="text-[#22d3ee] font-mono">{entityData.reputation || 50}%</span></span>
                  <span>í¿† Record: <span className="text-white font-mono">{entityData.wins || 0}W-{entityData.losses || 0}L</span></span>
                  <span>âš¡ XP: <span className="text-[#c084fc] font-mono">{entityData.experience || 0}</span></span>
                </div>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0a0a1f]/40">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="relative inline-block mb-6">
                <MessageCircle className="w-20 h-20 text-[#22d3ee]/20" />
                <Brain className="w-10 h-10 text-[#22d3ee] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Start Conversing with {entityName}</h3>
              <p className="text-white/60 mb-6">This entity has real memory, experiences, and emotions</p>
              
              <div className="space-y-2 max-w-md mx-auto">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Suggested Questions:</p>
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(prompt)}
                    className="w-full text-left px-4 py-2 bg-[#22d3ee]/10 hover:bg-[#22d3ee]/20 border border-[#22d3ee]/20 rounded-lg text-sm text-white/80 transition-all hover:border-[#22d3ee]/40"
                  >
                    í²¬ {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}
            >
              <div
                className={`max-w-[75%] ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-[#c084fc]/30 to-[#c084fc]/10 border-2 border-[#c084fc]/40'
                    : 'bg-gradient-to-br from-[#22d3ee]/20 to-[#22d3ee]/5 border-2 border-[#22d3ee]/30'
                } rounded-2xl p-4 shadow-lg`}
              >
                {msg.role === 'entity' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#22d3ee]/20">
                    <Brain className="w-4 h-4 text-[#22d3ee]" />
                    <span className="text-xs text-[#22d3ee] font-bold uppercase tracking-wider">
                      {msg.entity_name}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="text-[10px] text-[#c084fc]/60 mb-2 text-right">
                    You â€¢ {msg.timestamp.toLocaleTimeString()}
                  </div>
                )}
                <p className="text-base leading-relaxed text-white whitespace-pre-wrap font-medium">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start animate-in slide-in-from-bottom duration-300">
              <div className="bg-gradient-to-br from-[#22d3ee]/20 to-[#22d3ee]/5 border-2 border-[#22d3ee]/30 px-6 py-4 rounded-2xl flex items-center gap-3">
                <Loader className="w-5 h-5 text-[#22d3ee] animate-spin" />
                <span className="text-sm text-white/60">{entityName} is thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-[#22d3ee]/20 bg-gradient-to-r from-[#22d3ee]/5 to-transparent">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${entityName} anything...`}
              disabled={loading}
              rows={2}
              className="flex-1 bg-white/5 border-2 border-white/10 focus:border-[#22d3ee] rounded-xl px-4 py-3 text-white text-base placeholder:text-white/40 outline-none transition-all disabled:opacity-50 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 bg-gradient-to-br from-[#22d3ee] to-[#22d3ee]/80 hover:from-[#22d3ee]/90 hover:to-[#22d3ee]/70 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#22d3ee]/30 hover:shadow-[#22d3ee]/50 flex items-center gap-2 font-bold"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
          <p className="text-xs text-white/40 mt-3 flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Press <kbd className="px-2 py-0.5 bg-white/10 rounded text-white/60">Enter</kbd> to send â€¢ 
            <kbd className="px-2 py-0.5 bg-white/10 rounded text-white/60">Shift + Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
};
