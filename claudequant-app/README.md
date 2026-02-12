# ClaudeQuant

**Find the story hidden in the numbers.**

A PhD-level data scientist powered by Claude Opus 4.6. Built as a product prototype demonstrating how Anthropic's Claude platform could expand into quantitative data science.

## Quick Start

```bash
# Install dependencies
npm install

# Add your Anthropic API key
cp .env.local.example .env.local
# Edit .env.local and add your key: ANTHROPIC_API_KEY=sk-ant-...

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub
2. Import to [Vercel](https://vercel.com/new)
3. Add environment variable: `ANTHROPIC_API_KEY` = your key
4. Deploy

That's it. Vercel handles the rest.

## Architecture

```
claudequant-app/
├── app/
│   ├── api/chat/route.js    # Streaming API proxy → Claude Opus 4.6
│   ├── ClaudeQuant.jsx      # Main React component (all UI + client logic)
│   ├── layout.js            # Root layout
│   └── page.js              # Entry point
├── lib/
│   ├── system-prompt.js     # The "soul" of Quant — system prompt for Claude
│   └── use-chat-stream.js   # Reusable streaming hook
├── .env.local               # API key (git-ignored)
└── package.json
```

### How it works

1. **Welcome screen** — User picks a task card or types a custom prompt
2. **Streaming API** — Frontend sends conversation history + data context to `/api/chat`
3. **Claude Opus 4.6** — Responds with the system prompt personality ("Quant")
4. **Hybrid rendering** — Local CSV analysis (charts, stats) runs client-side for instant results; open-ended questions stream from the API
5. **Data context** — When a CSV is loaded, summary statistics are appended to API calls so Claude can reference the actual data

### Key design decisions

- **Streaming SSE** for real-time response rendering (not polling)
- **Hybrid local + API** — chart rendering and basic stats run client-side for instant feedback; complex reasoning goes to Claude
- **System prompt** carefully tuned for data science persona with domain-specific behavioral guidelines
- **No database** — sessions are ephemeral (prototype scope)

## Built by

Dev Gupta — [iyo.dev](https://iyo.dev)
