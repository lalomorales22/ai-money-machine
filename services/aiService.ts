import { GoogleGenAI, Type } from "@google/genai";
import { Signal, NewsItem, ModelProvider } from '../types';

// Configuration for API Keys (In a real app, these come from process.env)
// For this demo, we check process.env, but the UI allows overrides if needed.
const API_KEYS: Record<ModelProvider, string | undefined> = {
  'GEMINI': process.env.API_KEY,
  'OPENAI': process.env.OPENAI_API_KEY,
  'ANTHROPIC': process.env.ANTHROPIC_API_KEY,
  'XAI': process.env.XAI_API_KEY
};

let activeProvider: ModelProvider = 'GEMINI';

// Gemini Instance
let geminiClient: GoogleGenAI | null = null;

export const initializeAI = (provider: ModelProvider = 'GEMINI') => {
  activeProvider = provider;
  if (provider === 'GEMINI' && API_KEYS.GEMINI) {
    geminiClient = new GoogleGenAI({ apiKey: API_KEYS.GEMINI });
  }
};

export const setProvider = (provider: ModelProvider) => {
    activeProvider = provider;
    // Re-init if switching back to Gemini
    if (provider === 'GEMINI' && !geminiClient && API_KEYS.GEMINI) {
        geminiClient = new GoogleGenAI({ apiKey: API_KEYS.GEMINI });
    }
};

const getSystemPrompt = () => `
  You are an expert Wall Street Quantitative Analyst for "The AI Money Machine".
  Your job is to analyze capital flows in the AI supply chain.
  Keep responses punchy, professional, and focused on "Second Order Effects" (e.g., if MSFT spends CapEx, NVDA benefits).
`;

export const analyzeSignal = async (signal: Signal, newsContext: NewsItem): Promise<string> => {
  const prompt = `
    News: "${newsContext.headline}"
    Signal: ${signal.action} ${signal.ticker} (${signal.strength})
    Reasoning: ${signal.reason}

    Provide a concise, 3-sentence deep-dive analysis explaining the financial mechanics of this flow.
    Why does this specific flow matter for the ticker?
  `;

  try {
    switch (activeProvider) {
      case 'GEMINI':
        if (!geminiClient) return "Gemini API Key missing.";
        const gResponse = await geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: getSystemPrompt() + "\n" + prompt,
        });
        return gResponse.text || "No analysis generated.";

      case 'OPENAI':
        // Mocking fetch for OpenAI - In real app, use fetch to https://api.openai.com/v1/chat/completions
        if (!API_KEYS.OPENAI) return "OpenAI API Key missing in environment.";
        return `[OpenAI GPT-4 Analysis]: This confirms a structural rotation into ${signal.ticker}. The volatility implied by the news suggests institutional accumulation.`;

      case 'ANTHROPIC':
        if (!API_KEYS.ANTHROPIC) return "Anthropic API Key missing in environment.";
        return `[Claude 3 Opus Analysis]: The synergistic effects of this partnership likely expand ${signal.ticker}'s TAM by 15% over the next quarter.`;

      case 'XAI':
        if (!API_KEYS.XAI) return "xAI API Key missing in environment.";
        return `[Grok Analysis]: Looking at the raw data, this is a massive liquidity injection. ${signal.ticker} is going to the moon based on compute demand.`;

      default:
        return "Unknown Provider";
    }
  } catch (error) {
    console.error(`${activeProvider} analysis error:`, error);
    return `Error connecting to ${activeProvider}. Check console/keys.`;
  }
};

export const findStockConnections = async (ticker: string, existingNodeIds: string[]): Promise<{
  companyName: string;
  description: string;
  connections: { targetId: string; type: 'Investment' | 'Services' | 'Hardware'; direction: 'INFLOW' | 'OUTFLOW'; reason: string }[]
}> => {
  
  // Only Gemini 2.5 Flash supports the structured JSON schema output easily for this demo
  // If another provider is selected, we fallback to Gemini or a Mock if Gemini key is missing.
  
  if (!geminiClient) {
      return {
          companyName: ticker,
          description: "Market Data Unavailable (Gemini Key Required)",
          connections: [{ targetId: 'Nvidia', type: 'Hardware', direction: 'OUTFLOW', reason: 'Default Sector Correlation' }]
      };
  }

  try {
      const prompt = `
          Analyze the company with ticker symbol "${ticker}".
          1. Full Company Name.
          2. Short description (max 5 words) relative to AI.
          3. Identify supply chain relationships with: ${existingNodeIds.join(', ')}.
          
          Determine capital flow direction (INFLOW/OUTFLOW).
          Return valid JSON.
      `;

      const response = await geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      companyName: { type: Type.STRING },
                      description: { type: Type.STRING },
                      connections: {
                          type: Type.ARRAY,
                          items: {
                              type: Type.OBJECT,
                              properties: {
                                  targetId: { type: Type.STRING },
                                  type: { type: Type.STRING, enum: ['Investment', 'Services', 'Hardware'] },
                                  direction: { type: Type.STRING, enum: ['INFLOW', 'OUTFLOW'] },
                                  reason: { type: Type.STRING }
                              }
                          }
                      }
                  }
              }
          }
      });

      const text = response.text;
      if (!text) throw new Error("No response text");
      return JSON.parse(text);

  } catch (error) {
      console.error("Connection analysis failed", error);
      return {
           companyName: ticker,
           description: "Analysis Failed",
           connections: []
      };
  }
};
