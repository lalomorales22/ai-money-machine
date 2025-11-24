import { GoogleGenAI, Type } from "@google/genai";
import { Signal, NewsItem } from '../types';

let genAI: GoogleGenAI | null = null;

export const initializeGemini = () => {
  if (process.env.API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

export const analyzeSignal = async (signal: Signal, newsContext: NewsItem): Promise<string> => {
  if (!genAI) {
    return "AI Analysis Unavailable: API Key not found. This signal suggests a momentum shift based on standard capital flow logic.";
  }

  try {
    const prompt = `
      You are an expert Wall Street Quantitative Analyst.
      Analyze this trade signal based on the following news event in the AI Supply Chain.
      
      News: "${newsContext.headline}"
      Signal: ${signal.action} ${signal.ticker} (${signal.strength})
      Reasoning Given: ${signal.reason}

      Provide a concise, 3-sentence deep-dive analysis explaining the "Second Order Effects" of this money flow. 
      Why does this specific flow matter for the ticker? Use professional fintech terminology (e.g., "CapEx rotation", "margin expansion", "flywheel effect").
      Keep it punchy and direct.
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analysis failed to generate.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Error connecting to AI Analyst. Please try again.";
  }
};

export const findStockConnections = async (ticker: string, existingNodeIds: string[]): Promise<{
  companyName: string;
  description: string;
  connections: { targetId: string; type: 'Investment' | 'Services' | 'Hardware'; direction: 'INFLOW' | 'OUTFLOW'; reason: string }[]
}> => {
  if (!genAI) {
      // Mock fallback if no API key
      return {
          companyName: ticker,
          description: "Market Data Unavailable",
          connections: [{ targetId: 'Nvidia', type: 'Hardware', direction: 'OUTFLOW', reason: 'Default Sector Correlation' }]
      };
  }

  try {
      const prompt = `
          Analyze the company with ticker symbol "${ticker}".
          1. Provide its full Company Name.
          2. Provide a very short description (max 5 words) relative to AI.
          3. Identify supply chain relationships with these specific companies: ${existingNodeIds.join(', ')}.
          
          For each connection, determine the capital flow direction:
          - OUTFLOW: Money flows FROM ${ticker} TO the existing company (e.g., paying for Cloud or Hardware).
          - INFLOW: Money flows FROM the existing company TO ${ticker} (e.g., Investment or paying for IP/Services).

          Return the data in JSON format conforming to the schema.
          Only include strong, well-known relationships (Customer, Supplier, Investor).
      `;

      const response = await genAI.models.generateContent({
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
      console.error("Gemini connection analysis failed", error);
      return {
           companyName: ticker,
           description: "AI Analysis Failed",
           connections: []
      };
  }
};