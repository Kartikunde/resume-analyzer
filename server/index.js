import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3001;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const API_KEY = process.env.ANTHROPIC_API_KEY;

function buildPrompt(resumeText, jdText) {
  return `You are a senior technical recruiter and resume editor. Analyze the RESUME below${
    jdText ? " against the JOB DESCRIPTION" : ""
  }. Be specific, concrete, and honest — do not inflate scores.

RESUME:
"""
${resumeText}
"""
${jdText ? `\nJOB DESCRIPTION:\n"""\n${jdText}\n"""\n` : ""}
Return ONLY a single valid JSON object (no markdown fences, no commentary, no preamble) with this exact shape:
{
  "overallScore": number (0-100),
  "atsScore": number (0-100, how well this would parse/match in an ATS system),
  "categories": [
    {"name": "Impact", "score": number 0-100},
    {"name": "Clarity", "score": number 0-100},
    {"name": "Formatting", "score": number 0-100},
    {"name": "Keyword Match", "score": number 0-100}
  ],
  "strengths": [string, ...] (2-4 concise items),
  "weaknesses": [string, ...] (2-4 concise items),
  "matchedKeywords": [string, ...] (only if a job description was given, else empty array),
  "missingKeywords": [string, ...] (only if a job description was given, else empty array),
  "rewrites": [
    {"original": string (a real weak bullet pulled from the resume, verbatim or near-verbatim), "improved": string (a stronger rewrite, one line)}
  ] (2-3 items),
  "summary": string (2-3 sentences, direct, plain language)
}
If no job description was provided, set "Keyword Match" score based on general industry keyword strength instead, and leave matchedKeywords/missingKeywords as empty arrays.`;
}

app.post("/api/analyze", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        error:
          "Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.",
      });
    }

    const { resumeText, jdText } = req.body;
    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ error: "resumeText is required" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: buildPrompt(resumeText, jdText) }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const text = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    const cleaned = text.replace(/^```json/i, "").replace(/```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(502).json({ error: "Model did not return valid JSON", raw: text });
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
