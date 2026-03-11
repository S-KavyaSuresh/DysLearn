import React, { useState } from "react";
import { apiFetch } from "../lib/api.js";

export default function GamifiedLearning() {
  const [mode, setMode] = useState("text"); // text | upload
  const [text, setText] = useState("");
  const [fileText, setFileText] = useState("");
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");

  async function onUpload(file) {
    if (!file) return;
    if (file.type === "text/plain") {
      setFileText(await file.text());
      return;
    }
    const form = new FormData();
    form.append("file", file);
    const data = await apiFetch("/api/extract-text", { method: "POST", body: form });
    setFileText(data.text || "");
  }

  async function generate() {
    const src = (mode === "text" ? text : fileText).trim();
    if (!src) {
      alert("Please add study text first.");
      return;
    }
    setBusy(true);
    setQuestions([]);
    setIdx(0);
    setScore(0);
    setFeedback("");
    try {
      const data = await apiFetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: src, count: 6 }),
      });
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
    } catch (e) {
      alert(e.message || "Could not generate quiz.");
    } finally {
      setBusy(false);
    }
  }

  function answer(choiceIndex) {
    const q = questions[idx];
    if (!q) return;
    const correct = Number(q.answerIndex);
    if (choiceIndex === correct) {
      setScore((s) => s + 10);
      setFeedback(`Correct! ${q.explanation || ""}`);
    } else {
      const correctText = q.choices?.[correct] ?? "the correct choice";
      setFeedback(`Not quite. Correct: ${correctText}. ${q.explanation || ""}`);
    }

    setTimeout(() => {
      setFeedback("");
      if (idx < questions.length - 1) setIdx((i) => i + 1);
    }, 1200);
  }

  const q = questions[idx];

  return (
    <div>
      <h2 className="card-title">Gamified Learning</h2>
      <p className="card-subtitle">
        Upload notes (or paste text), generate quizzes, and earn points.
      </p>

      <div className="chip-row">
        <button className={`chip ${mode === "text" ? "chip-primary" : ""}`} type="button" onClick={() => setMode("text")}>
          Paste text
        </button>
        <button className={`chip ${mode === "upload" ? "chip-primary" : ""}`} type="button" onClick={() => setMode("upload")}>
          Upload document
        </button>
      </div>

      {mode === "text" && (
        <textarea className="text-area" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your study material here..." />
      )}

      {mode === "upload" && (
        <div>
          <input type="file" accept=".txt,.pdf,.docx" onChange={(e) => onUpload(e.target.files?.[0])} />
          <textarea className="text-area" rows={4} value={fileText} onChange={(e) => setFileText(e.target.value)} placeholder="Extracted text preview will appear here..." />
        </div>
      )}

      <div className="actions-row">
        <button className="btn-primary" type="button" onClick={generate} disabled={busy}>
          {busy ? "Generating…" : "Generate quiz"}
        </button>
      </div>

      <div className="simplify-results">
        <div className="simplify-result-content">
          {!questions.length && !busy && <p className="card-subtitle">Your quiz will appear here after clicking "Generate quiz".</p>}
          {busy && <p className="card-subtitle">AI is reading your text and creating questions...</p>}

          {questions.length > 0 && !q && (
            <div>
              <strong>Quiz complete!</strong>
              <div className="card-subtitle" style={{ marginTop: 8 }}>
                Final score: <strong>{score}</strong>
              </div>
            </div>
          )}

          {q && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <strong>Question {idx + 1}</strong> of {questions.length}
                </div>
                <div>
                  <strong>Score:</strong> {score}
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>{q.question}</div>
              <div className="chip-row">
                {(q.choices || []).map((c, i) => (
                  <button key={i} className="chip" type="button" onClick={() => answer(i)} disabled={Boolean(feedback)}>
                    {c}
                  </button>
                ))}
              </div>
              {feedback && <div className="card-subtitle" style={{ marginTop: 10 }}>{feedback}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

