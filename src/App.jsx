import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flag,
  X,
  RotateCcw,
  ClipboardPaste,
  FileUp,
  ChevronRight,
} from "lucide-react";

// ---------- design tokens ----------
const COLORS = {
  ink: "#12172B",
  inkSoft: "#2A3150",
  paper: "#ECEEE7",
  paperDeep: "#E1E4DB",
  paperLine: "#C9CDBF",
  yellow: "#FFC64B",
  yellowDeep: "#E8AC1E",
  coral: "#E15B3F",
  coralSoft: "#F7DED7",
  teal: "#1B8A6B",
  tealSoft: "#D9EEE5",
  muted: "#6B7280",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600;6..72,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
`;

function gradeFromScore(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

async function analyzeResume(resumeText, jdText) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jdText }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

const LOADING_LINES = [
  "Reading the resume top to bottom…",
  "Checking formatting and structure…",
  "Weighing impact vs. filler…",
  "Cross-checking keywords…",
  "Drafting the report…",
];

export default function App() {
  const [tab, setTab] = useState("paste");
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [loadingLine, setLoadingLine] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);
  const loadingTimer = useRef(null);

  const startLoadingCycle = useCallback(() => {
    setLoadingLine(0);
    let i = 0;
    loadingTimer.current = setInterval(() => {
      i = (i + 1) % LOADING_LINES.length;
      setLoadingLine(i);
    }, 1400);
  }, []);

  const stopLoadingCycle = useCallback(() => {
    if (loadingTimer.current) clearInterval(loadingTimer.current);
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    try {
      if (file.name.toLowerCase().endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        setResumeText(res.value.trim());
      } else {
        const text = await file.text();
        setResumeText(text.trim());
      }
    } catch (e) {
      setErrorMsg("Couldn't read that file. Try pasting the text instead.");
    }
  };

  const analyze = async () => {
    if (!resumeText.trim()) {
      setErrorMsg("Add resume text first — paste it or upload a file.");
      return;
    }
    setErrorMsg("");
    setStatus("loading");
    startLoadingCycle();
    try {
      const json = await analyzeResume(resumeText, jdText);
      setResult(json);
      setStatus("done");
    } catch (e) {
      setErrorMsg(e.message || "Analysis failed. Please try again.");
      setStatus("error");
    } finally {
      stopLoadingCycle();
    }
  };

  const reset = () => {
    setResult(null);
    setStatus("idle");
    setErrorMsg("");
  };

  const grade = result ? gradeFromScore(result.overallScore) : null;

  return (
    <div
      style={{ background: COLORS.ink, fontFamily: "Inter, sans-serif", minHeight: "100vh" }}
      className="w-full p-4 md:p-8"
    >
      <style>{FONTS}</style>

      {/* header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div
          className="flex items-center gap-2 mb-3"
          style={{ color: COLORS.yellow, fontFamily: "IBM Plex Mono, monospace" }}
        >
          <span className="text-xs tracking-widest uppercase">Review Desk</span>
          <span style={{ color: COLORS.inkSoft }}>/</span>
          <span className="text-xs tracking-widest uppercase" style={{ color: "#8890B5" }}>
            Resume Analysis
          </span>
        </div>
        <h1
          style={{ fontFamily: "Newsreader, serif", color: COLORS.paper }}
          className="text-4xl md:text-5xl font-semibold leading-tight"
        >
          Get your resume graded,
          <br />
          line by line.
        </h1>
        <p className="mt-3 max-w-xl" style={{ color: "#9AA1C4" }}>
          Paste your resume, optionally drop in a job description, and get a
          scored report with specific fixes — not just a vague "looks good."
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* LEFT: intake panel styled like a paper sheet */}
        <div
          style={{
            background: COLORS.paper,
            border: `1px solid ${COLORS.paperLine}`,
          }}
          className="rounded-sm p-5 md:p-6 relative"
        >
          {/* tabs */}
          <div className="flex gap-1 mb-4" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
            <button
              onClick={() => setTab("paste")}
              className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wide rounded-sm"
              style={{
                background: tab === "paste" ? COLORS.ink : "transparent",
                color: tab === "paste" ? COLORS.paper : COLORS.muted,
              }}
            >
              <ClipboardPaste size={14} /> Paste
            </button>
            <button
              onClick={() => setTab("upload")}
              className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wide rounded-sm"
              style={{
                background: tab === "upload" ? COLORS.ink : "transparent",
                color: tab === "upload" ? COLORS.paper : COLORS.muted,
              }}
            >
              <FileUp size={14} /> Upload
            </button>
          </div>

          {tab === "paste" ? (
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here…"
              className="w-full rounded-sm p-3 text-sm resize-none"
              style={{
                background: COLORS.paperDeep,
                border: `1px solid ${COLORS.paperLine}`,
                color: COLORS.ink,
                minHeight: "220px",
                fontFamily: "Inter, sans-serif",
              }}
            />
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-sm py-10"
                style={{
                  border: `1.5px dashed ${COLORS.paperLine}`,
                  background: COLORS.paperDeep,
                  color: COLORS.muted,
                }}
              >
                <Upload size={22} />
                <span className="text-sm">
                  {fileName ? fileName : "Click to upload .txt or .docx"}
                </span>
              </button>
              {resumeText && (
                <p className="text-xs mt-2" style={{ color: COLORS.muted }}>
                  {resumeText.length.toLocaleString()} characters loaded
                </p>
              )}
            </div>
          )}

          <div className="mt-4">
            <div
              className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wide"
              style={{ color: COLORS.muted, fontFamily: "IBM Plex Mono, monospace" }}
            >
              <FileText size={13} /> Job description (optional)
            </div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the target job description to check keyword match…"
              className="w-full rounded-sm p-3 text-sm resize-none"
              style={{
                background: COLORS.paperDeep,
                border: `1px solid ${COLORS.paperLine}`,
                color: COLORS.ink,
                minHeight: "100px",
                fontFamily: "Inter, sans-serif",
              }}
            />
          </div>

          {errorMsg && (
            <div
              className="mt-3 text-sm flex items-center gap-2 rounded-sm px-3 py-2"
              style={{ background: COLORS.coralSoft, color: "#9A3A24" }}
            >
              <AlertTriangle size={14} /> {errorMsg}
            </div>
          )}

          <button
            onClick={analyze}
            disabled={status === "loading"}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-sm font-medium text-sm"
            style={{
              background: status === "loading" ? COLORS.paperLine : COLORS.ink,
              color: status === "loading" ? COLORS.muted : COLORS.paper,
              cursor: status === "loading" ? "default" : "pointer",
            }}
          >
            <Sparkles size={16} />
            {status === "loading" ? "Analyzing…" : "Analyze resume"}
          </button>
        </div>

        {/* RIGHT: report panel */}
        <div
          style={{ background: COLORS.ink, border: `1px solid ${COLORS.inkSoft}` }}
          className="rounded-sm p-5 md:p-6 min-h-[420px] flex flex-col"
        >
          {status === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ border: `1.5px dashed ${COLORS.inkSoft}` }}
              >
                <FileText size={24} color="#8890B5" />
              </div>
              <p style={{ color: "#8890B5" }} className="text-sm max-w-xs">
                Your report will show up here once you submit a resume for
                review.
              </p>
            </div>
          )}

          {status === "loading" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <div
                className="w-10 h-10 rounded-full mb-5 animate-spin"
                style={{
                  border: `3px solid ${COLORS.inkSoft}`,
                  borderTopColor: COLORS.yellow,
                }}
              />
              <p
                style={{ color: COLORS.paper, fontFamily: "IBM Plex Mono, monospace" }}
                className="text-xs uppercase tracking-wide"
              >
                {LOADING_LINES[loadingLine]}
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <AlertTriangle size={28} color={COLORS.coral} />
              <p className="text-sm mt-3 max-w-xs" style={{ color: "#C9CDDF" }}>
                {errorMsg}
              </p>
              <button
                onClick={analyze}
                className="mt-4 flex items-center gap-2 text-xs uppercase tracking-wide px-3 py-2 rounded-sm"
                style={{ background: COLORS.inkSoft, color: COLORS.paper }}
              >
                <RotateCcw size={13} /> Try again
              </button>
            </div>
          )}

          {status === "done" && result && (
            <div>
              {/* header row: stamp + summary */}
              <div className="flex items-start gap-5 mb-6">
                <div
                  className="flex flex-col items-center justify-center rounded-full shrink-0"
                  style={{
                    width: 96,
                    height: 96,
                    border: `2px dashed ${COLORS.yellow}`,
                    transform: "rotate(-7deg)",
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  <span style={{ color: COLORS.yellow, fontSize: 28, fontWeight: 600 }}>
                    {grade}
                  </span>
                  <span style={{ color: "#8890B5", fontSize: 10 }}>
                    {result.overallScore}/100
                  </span>
                </div>
                <div className="flex-1">
                  <div
                    className="text-xs uppercase tracking-wide mb-1"
                    style={{ color: "#8890B5", fontFamily: "IBM Plex Mono, monospace" }}
                  >
                    Editor's summary
                  </div>
                  <p style={{ color: COLORS.paper, fontFamily: "Newsreader, serif" }} className="text-lg leading-snug">
                    {result.summary}
                  </p>
                </div>
                <button onClick={reset} title="Start over">
                  <X size={16} color="#8890B5" />
                </button>
              </div>

              {/* ATS score line */}
              <div
                className="flex items-center justify-between mb-6 px-3 py-2 rounded-sm"
                style={{ background: COLORS.inkSoft }}
              >
                <span
                  className="text-xs uppercase tracking-wide"
                  style={{ color: "#C9CDDF", fontFamily: "IBM Plex Mono, monospace" }}
                >
                  ATS compatibility
                </span>
                <span style={{ color: COLORS.yellow, fontFamily: "IBM Plex Mono, monospace" }}>
                  {result.atsScore}/100
                </span>
              </div>

              {/* category meters, ledger style */}
              <div className="mb-6">
                {result.categories?.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 mb-2.5">
                    <span
                      className="text-xs w-28 shrink-0"
                      style={{ color: "#C9CDDF", fontFamily: "IBM Plex Mono, monospace" }}
                    >
                      {c.name}
                    </span>
                    <div
                      className="flex-1 rounded-full overflow-hidden"
                      style={{ height: 6, background: COLORS.inkSoft }}
                    >
                      <div
                        style={{
                          width: `${c.score}%`,
                          height: "100%",
                          background: COLORS.yellow,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs w-8 text-right"
                      style={{ color: "#8890B5", fontFamily: "IBM Plex Mono, monospace" }}
                    >
                      {c.score}
                    </span>
                  </div>
                ))}
              </div>

              {/* strengths / weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <div
                    className="flex items-center gap-1.5 text-xs uppercase tracking-wide mb-2"
                    style={{ color: COLORS.teal, fontFamily: "IBM Plex Mono, monospace" }}
                  >
                    <CheckCircle2 size={13} /> Strengths
                  </div>
                  <ul className="space-y-1.5">
                    {result.strengths?.map((s, i) => (
                      <li key={i} className="text-sm flex gap-2" style={{ color: "#DADFEE" }}>
                        <span style={{ color: COLORS.teal }}>—</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div
                    className="flex items-center gap-1.5 text-xs uppercase tracking-wide mb-2"
                    style={{ color: COLORS.coral, fontFamily: "IBM Plex Mono, monospace" }}
                  >
                    <AlertTriangle size={13} /> Weaknesses
                  </div>
                  <ul className="space-y-1.5">
                    {result.weaknesses?.map((s, i) => (
                      <li key={i} className="text-sm flex gap-2" style={{ color: "#DADFEE" }}>
                        <span style={{ color: COLORS.coral }}>—</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* keywords, only if jd given */}
              {(result.matchedKeywords?.length > 0 || result.missingKeywords?.length > 0) && (
                <div className="mb-6">
                  <div
                    className="text-xs uppercase tracking-wide mb-2"
                    style={{ color: "#8890B5", fontFamily: "IBM Plex Mono, monospace" }}
                  >
                    Keyword match
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.matchedKeywords?.map((k, i) => (
                      <span
                        key={"m" + i}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                        style={{ background: COLORS.tealSoft, color: "#0F5C46" }}
                      >
                        <CheckCircle2 size={11} /> {k}
                      </span>
                    ))}
                    {result.missingKeywords?.map((k, i) => (
                      <span
                        key={"x" + i}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                        style={{ background: COLORS.coralSoft, color: "#9A3A24" }}
                      >
                        <Flag size={11} /> {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* rewrites, track-changes style */}
              {result.rewrites?.length > 0 && (
                <div>
                  <div
                    className="text-xs uppercase tracking-wide mb-2"
                    style={{ color: "#8890B5", fontFamily: "IBM Plex Mono, monospace" }}
                  >
                    Suggested rewrites
                  </div>
                  <div className="space-y-3">
                    {result.rewrites.map((r, i) => (
                      <div
                        key={i}
                        className="rounded-sm p-3"
                        style={{ background: COLORS.inkSoft }}
                      >
                        <p
                          className="text-sm mb-1.5"
                          style={{ color: "#8890B5", textDecoration: "line-through" }}
                        >
                          {r.original}
                        </p>
                        <div className="flex items-start gap-1.5">
                          <ChevronRight size={14} color={COLORS.yellow} className="shrink-0 mt-0.5" />
                          <p
                            className="text-sm"
                            style={{
                              color: COLORS.ink,
                              background: `linear-gradient(180deg, transparent 60%, ${COLORS.yellow} 60%)`,
                              display: "inline",
                            }}
                          >
                            {r.improved}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={reset}
                className="mt-6 flex items-center gap-2 text-xs uppercase tracking-wide"
                style={{ color: "#8890B5", fontFamily: "IBM Plex Mono, monospace" }}
              >
                <RotateCcw size={13} /> Analyze another
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
