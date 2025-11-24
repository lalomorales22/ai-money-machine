import React from 'react';
import { NewsItem } from '../types';

interface NewsFeedProps {
  news: NewsItem[];
}

const NewsFeed: React.FC<NewsFeedProps> = ({ news }) => {
  return (
    <div className="flex flex-col h-full bg-obsidian-light border-r border-gray-800">
      <div className="p-4 border-b border-gray-800 bg-obsidian z-10 sticky top-0">
        <h2 className="text-white font-mono font-bold flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          LIVE WIRE
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {news.length === 0 && <p className="text-gray-600 font-mono text-xs">Waiting for market data...</p>}
        {news.map((item) => (
          <div key={item.id} className="p-3 border-l-2 border-gray-700 bg-gray-900/50 hover:bg-gray-800 transition-colors cursor-default">
             <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.impact === 'HIGH' ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'
                }`}>
                    {item.type}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
             </div>
             <p className="text-sm text-gray-300 font-mono leading-tight">{item.headline}</p>
             <div className="mt-2 flex gap-1">
                 {item.relatedTickers.map(t => (
                     <span key={t} className="text-[10px] text-neon-green border border-neon-green/30 px-1 rounded bg-black/50">${t}</span>
                 ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;