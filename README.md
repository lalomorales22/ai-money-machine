# The AI Money Machine

**Github:** [lalomorales22/ai-money-machine](https://github.com/lalomorales22/ai-money-machine)

A high-performance fintech dashboard that visualizes the "Capital Rotation" within the Artificial Intelligence ecosystem. This application tracks money flows from Hyperscalers (Microsoft, Google) to Hardware (Nvidia, AMD) and downstream to Unicorns (OpenAI, CoreWeave).

## Features

- **Galaxy Graph Visualization**: Interactive D3.js force-directed graph showing capital pathways (CapEx, Investment, Services).
- **Sentiment Strategy Engine**: Advanced signal logic that prevents "flip-flopping". Signals are only triggered when a stock's momentum score crosses key thresholds (75 for Buy, 25 for Short).
- **Multi-Model AI Analysis**: Analyze specific trade signals using:
  - Google Gemini 2.5 Flash
  - OpenAI GPT-4
  - Anthropic Claude 3.5
  - xAI Grok
- **Simulated Database**: Persistent storage of signals and news using LocalStorage (mimicking a SQLite DB).
- **Live News Simulation**: Algorithmic news generation that impacts sentiment scores in real-time.

## Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/lalomorales22/ai-money-machine.git
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory (or configure via your deployment platform):
   ```env
   API_KEY=your_gemini_key_here
   OPENAI_API_KEY=your_openai_key_here
   ANTHROPIC_API_KEY=your_claude_key_here
   XAI_API_KEY=your_grok_key_here
   ```

3. **Run**:
   Open `index.html` in a modern browser or serve via a static file server.

## Architecture

- **Frontend**: React 18, Tailwind CSS, FontAwesome.
- **Visualization**: D3.js.
- **AI Integration**: Google GenAI SDK (Gemini) + Fetch adapters for others.
- **Persistence**: `dbService.ts` (LocalStorage wrapper).
