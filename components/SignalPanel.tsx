import React, { useState } from 'react';
import { Signal, NewsItem } from '../types';
import { analyzeSignal } from '../services/geminiService';

interface SignalPanelProps {
  signals: Signal[];
  news: NewsItem[];
  onAddStock: (ticker: string) => void;
}

const SignalPanel: React.FC<SignalPanelProps> = ({ signals, news, onAddStock }) => {
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [newTicker, setNewTicker] = useState("");

  const handleAnalyze = async (signal: Signal) => {
    setSelectedSignalId(signal.id);
    setLoading(true);
    setAnalysis("");
    
    const relatedNews = news.find(n => n.id === signal.relatedNewsId) || { headline: "Unknown Source", timestamp: 0 } as NewsItem;
    const result = await analyzeSignal(signal, relatedNews);
    
    setAnalysis(result);
    setLoading(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTicker.trim()) {
        onAddStock(newTicker.trim().toUpperCase());
        setNewTicker("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-obsidian-light border-l border-gray-800">
      <div className="p-4 border-b border-gray-800 bg-obsidian z-10 sticky top-0">
        <h2 className="text-white font-mono font-bold flex items-center gap-2">
          <i className="fa-solid fa-bolt text-neon-green"></i>
          TRADER ACTIONS
        </h2>
      </div>

      {/* Add Stock Input */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/30">
        <form onSubmit={handleAddSubmit} className="flex gap-2">
            <input 
                type="text" 
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                placeholder="ADD TICKER (e.g. PLTR)" 
                className="w-full bg-black border border-gray-700 text-white text-xs font-mono px-2 py-1.5 focus:border-neon-green focus:outline-none rounded uppercase placeholder-gray-600"
            />
            <button 
                type="submit"
                className="bg-gray-800 hover:bg-gray-700 text-neon-green border border-gray-700 px-3 py-1.5 rounded text-xs font-bold font-mono transition-colors"
            >
                <i className="fa-solid fa-plus"></i>
            </button>
        </form>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {signals.length === 0 && <p className="text-gray-600 font-mono text-xs text-center mt-10">Scanning for alpha...</p>}
        
        {signals.map((signal) => (
          <div key={signal.id} className={`relative p-4 border ${signal.action === 'BUY' ? 'border-neon-green/30 bg-green-900/10' : signal.action === 'HOLD' ? 'border-gray-600/30 bg-gray-800/10' : 'border-neon-red/30 bg-red-900/10'} rounded-lg transition-all`}>
            {/* Timestamp */}
            <div className="absolute top-3 right-3 text-[9px] text-gray-500 font-mono">
                {new Date(signal.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>

            <div className="flex justify-between items-start mb-2 pr-6">
                <div>
                    <span className={`text-xl font-black tracking-tighter ${signal.action === 'BUY' ? 'text-neon-green' : signal.action === 'HOLD' ? 'text-gray-400' : 'text-neon-red'}`}>
                        {signal.action} {signal.ticker}
                    </span>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-1">
                        Signal Strength: <span className="text-white">{signal.strength}</span>
                    </div>
                </div>
            </div>
            
            <p className="text-xs text-gray-300 mb-3 border-l-2 border-gray-600 pl-2 italic">
                {signal.reason}
            </p>

            {/* AI Analysis Button / Content */}
            <div className="mt-3 pt-3 border-t border-gray-800/50">
               {selectedSignalId === signal.id ? (
                   <div className="bg-black/50 p-2 rounded text-xs font-mono text-gray-300">
                       <h4 className="text-neon-blue mb-1 flex items-center gap-1">
                           <i className="fa-solid fa-brain"></i> Gemini Analysis
                       </h4>
                       {loading ? (
                           <span className="animate-pulse">Analyzing capital flow derivatives...</span>
                       ) : (
                           <p className="leading-relaxed">{analysis}</p>
                       )}
                   </div>
               ) : (
                   <button 
                    onClick={() => handleAnalyze(signal)}
                    className="w-full py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-neon-blue border border-neon-blue/20 rounded font-mono transition-colors flex items-center justify-center gap-2">
                       <i className="fa-solid fa-wand-magic-sparkles"></i> DEEP ANALYZE
                   </button>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignalPanel;