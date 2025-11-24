import { GraphData, Node, Link, FlowType } from './types';

// Add default sentimentScore: 50 (Neutral) to all nodes
export const INITIAL_NODES: Node[] = [
  // The Source (Buyers/Cloud)
  { id: 'Microsoft', group: 'Central', ticker: 'MSFT', val: 40, desc: 'Mega-Cap Cloud Provider', sentimentScore: 65 },
  { id: 'Google', group: 'Central', ticker: 'GOOGL', val: 35, desc: 'Hyperscaler', sentimentScore: 60 },
  { id: 'Oracle', group: 'Satellite', ticker: 'ORCL', val: 25, desc: 'Enterprise Cloud', sentimentScore: 55 },
  { id: 'Meta', group: 'Central', ticker: 'META', val: 30, desc: 'Social/AI Giant', sentimentScore: 58 },
  { id: 'IBM', group: 'Satellite', ticker: 'IBM', val: 20, desc: 'Enterprise AI', sentimentScore: 50 },
  { id: 'Salesforce', group: 'Satellite', ticker: 'CRM', val: 26, desc: 'Enterprise SaaS', sentimentScore: 58 },

  // The Hardware (The First Flow)
  { id: 'Nvidia', group: 'Central', ticker: 'NVDA', val: 45, desc: 'The King of Hardware', sentimentScore: 80 },
  { id: 'AMD', group: 'Satellite', ticker: 'AMD', val: 25, desc: 'GPU Competitor', sentimentScore: 55 },
  { id: 'Intel', group: 'Satellite', ticker: 'INTC', val: 15, desc: 'Legacy Chipmaker', sentimentScore: 30 },
  { id: 'TSMC', group: 'Central', ticker: 'TSM', val: 38, desc: 'The Foundry', sentimentScore: 70 },
  { id: 'SuperMicro', group: 'Satellite', ticker: 'SMCI', val: 22, desc: 'AI Servers', sentimentScore: 45 },
  { id: 'Arista', group: 'Satellite', ticker: 'ANET', val: 20, desc: 'AI Networking', sentimentScore: 60 },
  { id: 'ARM', group: 'Satellite', ticker: 'ARM', val: 24, desc: 'Chip Architecture', sentimentScore: 62 },
  { id: 'Broadcom', group: 'Satellite', ticker: 'AVGO', val: 28, desc: 'Custom AI Silicon', sentimentScore: 65 },
  { id: 'Dell', group: 'Satellite', ticker: 'DELL', val: 20, desc: 'AI Servers', sentimentScore: 55 },

  // The Unicorns (The Second Flow)
  { id: 'OpenAI', group: 'Central', ticker: 'PVT', val: 35, desc: 'LLM Leader', sentimentScore: 85 },
  { id: 'Palantir', group: 'Satellite', ticker: 'PLTR', val: 28, desc: 'AI Operating System', sentimentScore: 75 },
  { id: 'CoreWeave', group: 'Satellite', ticker: 'PVT', val: 20, desc: 'GPU Cloud', sentimentScore: 65 },
  { id: 'Mistral', group: 'Outer', ticker: 'PVT', val: 15, desc: 'European AI', sentimentScore: 60 },
  { id: 'xAI', group: 'Satellite', ticker: 'PVT', val: 20, desc: 'Musk AI', sentimentScore: 70 },
  { id: 'Figure AI', group: 'Outer', ticker: 'PVT', val: 12, desc: 'Robotics', sentimentScore: 55 },
  { id: 'Nebius', group: 'Outer', ticker: 'NBIS', val: 15, desc: 'AI Infrastructure', sentimentScore: 50 },
  { id: 'SoundHound', group: 'Outer', ticker: 'SOUN', val: 10, desc: 'Voice AI', sentimentScore: 48 },
  { id: 'Recursion', group: 'Outer', ticker: 'RXRX', val: 12, desc: 'BioTech AI', sentimentScore: 52 },
  { id: 'Snowflake', group: 'Satellite', ticker: 'SNOW', val: 22, desc: 'Data Cloud', sentimentScore: 50 },
  { id: 'Databricks', group: 'Satellite', ticker: 'PVT', val: 20, desc: 'Data AI', sentimentScore: 60 },
];

export const INITIAL_LINKS: Link[] = [
  // CapEx Flows (Hardware Buying) - Pink
  { source: 'Microsoft', target: 'Nvidia', type: FlowType.HARDWARE, value: 5 },
  { source: 'Google', target: 'Nvidia', type: FlowType.HARDWARE, value: 5 },
  { source: 'Meta', target: 'Nvidia', type: FlowType.HARDWARE, value: 5 },
  { source: 'Oracle', target: 'Nvidia', type: FlowType.HARDWARE, value: 3 },
  { source: 'Oracle', target: 'AMD', type: FlowType.HARDWARE, value: 2 },
  { source: 'Microsoft', target: 'AMD', type: FlowType.HARDWARE, value: 2 },
  { source: 'Nvidia', target: 'TSMC', type: FlowType.HARDWARE, value: 8 },
  { source: 'AMD', target: 'TSMC', type: FlowType.HARDWARE, value: 6 },
  { source: 'SuperMicro', target: 'Nvidia', type: FlowType.HARDWARE, value: 6 },
  { source: 'Meta', target: 'Arista', type: FlowType.HARDWARE, value: 4 },
  { source: 'Microsoft', target: 'Arista', type: FlowType.HARDWARE, value: 4 },
  { source: 'Google', target: 'Broadcom', type: FlowType.HARDWARE, value: 6 },
  { source: 'Meta', target: 'Broadcom', type: FlowType.HARDWARE, value: 5 },
  { source: 'Dell', target: 'Nvidia', type: FlowType.HARDWARE, value: 5 },

  // Investment Flows (Funding) - Green
  { source: 'Microsoft', target: 'OpenAI', type: FlowType.INVESTMENT, value: 8 },
  { source: 'Nvidia', target: 'CoreWeave', type: FlowType.INVESTMENT, value: 4 },
  { source: 'Nvidia', target: 'SoundHound', type: FlowType.INVESTMENT, value: 2 },
  { source: 'Nvidia', target: 'Recursion', type: FlowType.INVESTMENT, value: 2 },
  { source: 'Nvidia', target: 'ARM', type: FlowType.INVESTMENT, value: 3 },
  { source: 'Microsoft', target: 'Mistral', type: FlowType.INVESTMENT, value: 3 },
  { source: 'Oracle', target: 'xAI', type: FlowType.INVESTMENT, value: 4 },
  { source: 'Salesforce', target: 'Snowflake', type: FlowType.INVESTMENT, value: 3 },
  
  // Services Flows (Cloud Compute) - Blue
  { source: 'OpenAI', target: 'Microsoft', type: FlowType.SERVICES, value: 6 },
  { source: 'xAI', target: 'Oracle', type: FlowType.SERVICES, value: 4 },
  { source: 'Mistral', target: 'Microsoft', type: FlowType.SERVICES, value: 2 },
  { source: 'Palantir', target: 'Microsoft', type: FlowType.SERVICES, value: 3 },
  { source: 'Palantir', target: 'Google', type: FlowType.SERVICES, value: 2 },
  { source: 'ARM', target: 'Nvidia', type: FlowType.SERVICES, value: 5 },
  { source: 'Snowflake', target: 'Microsoft', type: FlowType.SERVICES, value: 3 },
  { source: 'Databricks', target: 'Google', type: FlowType.SERVICES, value: 3 },
  { source: 'IBM', target: 'Meta', type: FlowType.SERVICES, value: 2 },
];

export const INITIAL_GRAPH_DATA: GraphData = {
  nodes: INITIAL_NODES,
  links: INITIAL_LINKS
};

// Templates for generating mock news
export const NEWS_TEMPLATES = [
  { headline: "{source} announces $2B additional investment in {target}.", type: 'INVESTMENT', impact: 'HIGH', signal: 'BUY_TARGET' },
  { headline: "{source} reports massive CapEx increase for {target} H100 chips.", type: 'CAPEX', impact: 'HIGH', signal: 'LONG_HARDWARE' },
  { headline: "{source} cuts server spending forecast by 15%.", type: 'CAPEX', impact: 'MEDIUM', signal: 'SHORT_HARDWARE' },
  { headline: "{source} signs multi-year cloud compute deal with {target}.", type: 'PARTNERSHIP', impact: 'MEDIUM', signal: 'LONG_BOTH' },
  { headline: "Insider selling detected at {source} amidst valuation concerns.", type: 'INSIDER', impact: 'LOW', signal: 'SHORT_SOURCE' },
];