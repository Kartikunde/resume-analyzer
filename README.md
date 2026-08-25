# AI Resume Analyzer

A local, full-stack resume grading tool. Paste or upload a resume, and get back a scored report: overall score,
ATS compatibility, category breakdown, strengths/weaknesses, keyword match.

## Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node + Express 

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your API key**
   ```bash
   cp .env.example .env
   ```

3. **Run it**
   ```bash
   npm run dev
   ```
   This starts the API server on `http://localhost:3001` and the Vite dev
   server on `http://localhost:5173` at the same time.

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
- File upload supports `.txt` and `.docx`. PDF upload isn't included — copy-paste the text instead, or
  add a PDF-parsing step to `handleFile` in `src/App.jsx` if you'd like.
- The model used is set in `.env` via `ANTHROPIC_MODEL`. Change it any time without touching code.
- To build a production bundle: `npm run build`, then serve `dist/` with
  any static host, alongside the Express server (or deploy `server/index.js`
  separately, e.g. on Render/Fly/a VPS, and point the frontend at it).

  <img width="1357" height="878" alt="Screenshot 2026-08-22 212156" src="https://github.com/user-attachments/assets/190ba2e3-3ac9-4867-8d27-dfa7b6677efe" />

