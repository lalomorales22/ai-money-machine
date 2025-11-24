import * as d3 from 'd3';

export type ModelProvider = 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'XAI';

export interface AnalysisResult {
    text: string;
    sources?: { title: string; uri: string }[];
}

export interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: 'Central' | 'Satellite' | 'Outer';
  ticker: string;
  marketCap?: string;
  desc?: string;
  val: number; // For radius
  sentimentScore: number; // 0-100, 50 is neutral
  // Explicitly add simulation properties to satisfy TypeScript and persistence logic
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  type: 'Investment' | 'Services' | 'Hardware';
  value: number; // For thickness
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface NewsItem {
  id: string;
  timestamp: number;
  headline: string;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  relatedTickers: string[];
  type: 'CAPEX' | 'INVESTMENT' | 'PARTNERSHIP' | 'INSIDER';
}

export interface Signal {
  id: string;
  ticker: string;
  action: 'BUY' | 'SHORT' | 'HOLD';
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  reason: string;
  timestamp: number;
  relatedNewsId?: string;
  modelUsed?: ModelProvider;
}

export enum FlowType {
  INVESTMENT = 'Investment', // Green
  SERVICES = 'Services', // Blue
  HARDWARE = 'Hardware' // Pink
}