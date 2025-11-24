import React, { useState, useEffect, useCallback } from 'react';
import GalaxyGraph from './components/GalaxyGraph';
import NewsFeed from './components/NewsFeed';
import SignalPanel from './components/SignalPanel';
import { GraphData, NewsItem, Signal, Node, FlowType, Link, ModelProvider } from './types';
import { INITIAL_GRAPH_DATA, NEWS_TEMPLATES } from './constants';
import { initializeAI, findStockConnections, setProvider } from './services/aiService';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>(INITIAL_GRAPH_DATA);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [currentModel, setCurrentModel] = useState<ModelProvider>('GEMINI');

  // Initialize Services & Restore DB
  useEffect(() => {
    initializeAI('GEMINI');
    dbService.init();
    
    // Load historical data from DB
    const savedSignals = dbService.getSignals();
    const savedNews = dbService.getNews();
    if (savedSignals.length > 0) setSignals(savedSignals);
    if (savedNews.length > 0) setNews(savedNews);
  }, []);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newModel = e.target.value as ModelProvider;
      setCurrentModel(newModel);
      setProvider(newModel);
  };

  // Simulation Logic
  useEffect(() => {
    const interval = setInterval(() => {
      // 30% chance to trigger a news event every tick (3 seconds)
      if (Math.random() > 0.7) {
        generateMarketEvent();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [graphData]); 

  const generateMarketEvent = () => {
    // 1. Pick a random template
    const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
    
    // 2. Pick random actors
    const sourceNodes = graphData.nodes.filter(n => n.group === 'Central' || n.group === 'Satellite');
    const targetNodes = graphData.nodes;
    
    const source = sourceNodes[Math.floor(Math.random() * sourceNodes.length)];
    let target = targetNodes[Math.floor(Math.random() * targetNodes.length)];
    
    while (target.id === source.id) {
        target = targetNodes[Math.floor(Math.random() * targetNodes.length)];
    }

    // 3. Construct News Item
    const headline = template.headline.replace("{source}", source.id).replace("{target}", target.id);
    const newNewsItem: NewsItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        headline,
        impactLevel: template.impact as any,
        relatedTickers: [source.ticker, target.ticker].filter(t => t !== 'PVT'), 
        type: template.type as any
    };

    // Save to State and DB
    setNews(prev => [newNewsItem, ...prev].slice(0, 20)); 
    dbService.insertNews(newNewsItem);

    // 4. STRATEGY ENGINE
    // We update sentiment scores rather than firing blind signals.
    // Sentiment > 75 = BUY, Sentiment < 25 = SHORT.
    
    // Calculate Impact Direction
    let impactScore = template.impact === 'HIGH' ? 15 : 5;
    
    // Determine target based on template signal logic
    let strategyTarget = target;
    let sentimentDelta = 0;

    if (template.signal === 'BUY_TARGET') {
        strategyTarget = target;
        sentimentDelta = impactScore;
        updateGraphLink(source.id, target.id, FlowType.INVESTMENT);
    } else if (template.signal === 'LONG_HARDWARE') {
        // Find Nvidia
        const nvda = graphData.nodes.find(n => n.ticker === 'NVDA');
        if (nvda) strategyTarget = nvda;
        sentimentDelta = impactScore;
        updateGraphLink(source.id, 'Nvidia', FlowType.HARDWARE);
    } else if (template.signal === 'SHORT_HARDWARE') {
        const nvda = graphData.nodes.find(n => n.ticker === 'NVDA');
        if (nvda) strategyTarget = nvda;
        sentimentDelta = -impactScore;
    } else if (template.signal === 'SHORT_SOURCE') {
        strategyTarget = source;
        sentimentDelta = -impactScore;
    }

    if (strategyTarget && strategyTarget.ticker !== 'PVT') {
        // Update the Node's Sentiment Score
        setGraphData(prev => {
            const newNodes = prev.nodes.map(n => {
                if (n.id === strategyTarget.id) {
                    const newScore = Math.min(100, Math.max(0, n.sentimentScore + sentimentDelta));
                    
                    // Check for Signal Trigger
                    let generatedSignal: Signal | null = null;
                    
                    // Logic: Only fire BUY if score > 75 AND we weren't already just bought (simplified)
                    if (newScore > 75 && n.sentimentScore <= 75) {
                        generatedSignal = {
                            id: Date.now().toString(),
                            ticker: strategyTarget.ticker,
                            action: 'BUY',
                            strength: 'STRONG',
                            reason: `Momentum Breakout. Sentiment Score: ${newScore}/100 triggered by ${source.id} news.`,
                            timestamp: Date.now(),
                            relatedNewsId: newNewsItem.id,
                            modelUsed: currentModel
                        };
                    } 
                    // Logic: Only fire SHORT if score < 25
                    else if (newScore < 25 && n.sentimentScore >= 25) {
                        generatedSignal = {
                            id: Date.now().toString(),
                            ticker: strategyTarget.ticker,
                            action: 'SHORT',
                            strength: 'STRONG',
                            reason: `Trend Collapse. Sentiment Score: ${newScore}/100 triggered by ${source.id} news.`,
                            timestamp: Date.now(),
                            relatedNewsId: newNewsItem.id,
                            modelUsed: currentModel
                        };
                    }

                    if (generatedSignal) {
                        setSignals(s => [generatedSignal!, ...s].slice(0, 10));
                        dbService.insertSignal(generatedSignal);
                    }

                    return { ...n, sentimentScore: newScore };
                }
                return n;
            });
            return { ...prev, nodes: newNodes };
        });
    }
  };

  const updateGraphLink = (sourceId: string, targetId: string, type: FlowType) => {
      setGraphData(prev => {
          const links = [...prev.links];
          // We use strings for source/target when adding new links
          // GalaxyGraph will handle the string->object resolution
          const existingLinkIndex = links.findIndex(l => 
            (typeof l.source === 'object' ? (l.source as Node).id : l.source) === sourceId && 
            (typeof l.target === 'object' ? (l.target as Node).id : l.target) === targetId
          );

          if (existingLinkIndex >= 0) {
              const newLink = { ...links[existingLinkIndex], value: links[existingLinkIndex].value + 2 };
              links[existingLinkIndex] = newLink;
          } else {
              links.push({
                  source: sourceId,
                  target: targetId,
                  type,
                  value: 2
              });
          }
          return { ...prev, links };
      });
  };

  const handleAddStock = async (ticker: string) => {
      if (graphData.nodes.find(n => n.ticker === ticker)) return;

      const tempSignal: Signal = {
          id: Date.now().toString(),
          ticker: ticker,
          action: 'HOLD',
          strength: 'WEAK',
          reason: `Analyzing supply chain via ${currentModel}...`,
          timestamp: Date.now(),
          modelUsed: currentModel
      };
      setSignals(prev => [tempSignal, ...prev]);

      const data = await findStockConnections(ticker, graphData.nodes.map(n => n.id));

      const newNode: Node = {
          id: data.companyName,
          group: 'Outer',
          ticker: ticker,
          val: 20,
          desc: data.description,
          sentimentScore: 50 // Start neutral
      };

      const newLinks: Link[] = data.connections
        .filter(c => graphData.nodes.some(n => n.id === c.targetId))
        .map(c => {
          const isOutflow = c.direction === 'OUTFLOW';
          return {
              source: isOutflow ? newNode.id : c.targetId,
              target: isOutflow ? c.targetId : newNode.id,
              type: c.type as FlowType,
              value: 3
          };
      });

      setGraphData(prev => ({
          nodes: [...prev.nodes, newNode],
          links: [...prev.links, ...newLinks]
      }));

      const successSignal: Signal = {
          id: Date.now().toString(),
          ticker: ticker,
          action: 'HOLD',
          strength: 'MODERATE',
          reason: `Integrated. Found ${newLinks.length} connections.`,
          timestamp: Date.now(),
          modelUsed: currentModel
      };
      
      setSignals(prev => [successSignal, ...prev]);
      dbService.insertSignal(successSignal);
  };

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-gray-200 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-gray-800 bg-obsidian flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center text-black font-bold text-xs">
                AI
            </div>
            <h1 className="font-mono text-lg font-bold tracking-tight text-white">THE AI MONEY MACHINE</h1>
        </div>
        
        <div className="flex items-center gap-6">
            {/* Model Selector */}
            <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-mono">BRAIN:</label>
                <select 
                    value={currentModel}
                    onChange={handleModelChange}
                    className="bg-gray-900 border border-gray-700 text-neon-blue text-xs font-mono rounded px-2 py-1 focus:outline-none focus:border-neon-blue"
                >
                    <option value="GEMINI">GOOGLE GEMINI 2.5</option>
                    <option value="OPENAI">OPENAI GPT-4</option>
                    <option value="ANTHROPIC">CLAUDE 3.5</option>
                    <option value="XAI">xAI GROK</option>
                </select>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-gray-500 border-l border-gray-800 pl-4">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    DB: CONNECTED
                </span>
            </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        <aside className="md:col-span-3 h-full overflow-hidden">
            <NewsFeed news={news} />
        </aside>

        <section className="md:col-span-6 h-full relative bg-obsidian border-x border-gray-900 flex flex-col">
            <div className="flex-1 relative">
                <GalaxyGraph data={graphData} onNodeClick={handleNodeClick} />
                
                <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur border border-gray-800 p-4 rounded-lg pointer-events-none">
                    {selectedNode ? (
                        <div>
                             <div className="flex justify-between items-center mb-1">
                                <h3 className="text-neon-green font-bold text-lg">{selectedNode.id} ({selectedNode.ticker})</h3>
                                <span className={`text-xs font-mono px-2 py-0.5 rounded ${selectedNode.sentimentScore > 60 ? 'bg-green-900 text-green-300' : selectedNode.sentimentScore < 40 ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-400'}`}>
                                    SENTIMENT: {Math.round(selectedNode.sentimentScore)}/100
                                </span>
                             </div>
                             <p className="text-sm text-gray-400">{selectedNode.desc}</p>
                             <div className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full transition-all duration-500 ${selectedNode.sentimentScore > 50 ? 'bg-neon-green' : 'bg-neon-red'}`} 
                                    style={{ width: `${selectedNode.sentimentScore}%` }}
                                 ></div>
                             </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-white font-bold text-sm mb-1">WAITING FOR SELECTION...</h3>
                            <p className="text-xs text-gray-500 font-mono">Select a node to view detailed capital flows or watch the feed for algorithmic updates.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>

        <aside className="md:col-span-3 h-full overflow-hidden">
            <SignalPanel signals={signals} news={news} onAddStock={handleAddStock} />
        </aside>

      </main>
    </div>
  );
};

export default App;