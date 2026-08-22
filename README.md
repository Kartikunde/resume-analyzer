# AI Resume Analyzer

A local, full-stack resume grading tool. Paste or upload a resume (and
optionally a job description), and get back a scored report: overall score,
ATS compatibility, category breakdown, strengths/weaknesses, keyword match,
and concrete bullet-point rewrites — powered by the Claude API.

## Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node + Express (small proxy server that talks to the Anthropic
  API so your API key never touches the browser)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your API key**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and paste in your key from
   https://console.anthropic.com/settings/keys

3. **Run it**
   ```bash
   npm run dev
   ```
   This starts the API server on `http://localhost:3001` and the Vite dev
   server on `http://localhost:5173` at the same time. Open
   `http://localhost:5173` in your browser.

## Project structure
```
resume-analyzer/
├── server/
│   └── index.js        # Express API — proxies /api/analyze to Anthropic
├── src/
│   ├── App.jsx          # Main UI component
│   ├── main.jsx          # React entry point
│   └── index.css         # Tailwind entry
├── index.html
├── vite.config.js        # Dev proxy: /api -> localhost:3001
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── .env.example
```

## Notes
- File upload supports `.txt` and `.docx` (parsed client-side with
  `mammoth`). PDF upload isn't included — copy-paste the text instead, or
  add a PDF-parsing step to `handleFile` in `src/App.jsx` if you'd like.
- The model used is set in `.env` via `ANTHROPIC_MODEL` (defaults to
  `claude-sonnet-5`). Change it any time without touching code.
- To build a production bundle: `npm run build`, then serve `dist/` with
  any static host, alongside the Express server (or deploy `server/index.js`
  separately, e.g. on Render/Fly/a VPS, and point the frontend at it).
