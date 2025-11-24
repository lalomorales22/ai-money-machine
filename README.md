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

## How to Run

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/lalomorales22/ai-money-machine.git
   cd ai-money-machine
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory. You must add your API keys to enable the "Deep Analyze" features.
   ```env
   # Required for Gemini 2.5 Analysis (Default)
   API_KEY=your_gemini_api_key

   # Optional: For multi-model support
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   XAI_API_KEY=your_xai_key
   ```

4. **Start the Development Server**:
   ```bash
   npm start
   # or
   npm run dev
   ```
   Open your browser to [http://localhost:3000](http://localhost:3000) (or the URL provided in the terminal) to launch the dashboard.

### Building for Production

To create a production-ready build:
```bash
npm run build
```

## Architecture

- **Frontend**: React 18, Tailwind CSS, FontAwesome.
- **Visualization**: D3.js.
- **AI Integration**: Google GenAI SDK (Gemini) + Fetch adapters for others.
- **Persistence**: `dbService.ts` (LocalStorage wrapper).
