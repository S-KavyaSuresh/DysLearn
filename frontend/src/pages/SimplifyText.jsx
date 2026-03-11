import React, { useEffect, useMemo, useState } from "react";
import mermaid from "mermaid";
import { apiFetch, getApiBase } from "../lib/api.js";

const RESULT_TABS = [
  { id: "simplified", label: "Simplified text" },
  { id: "keypoints", label: "Keypoints" },
  { id: "examples", label: "Examples" },
  { id: "mindmap", label: "Mindmap" },
  { id: "summary", label: "Summary" },
  { id: "layman", label: "Layman terms" },
  { id: "visuals", label: "Visual examples" },
];

export default function SimplifyText() {
  const [mode, setMode] = useState("text"); // text | voice | document
  const [text, setText] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [fileText, setFileText] = useState("");
  const [activeResult, setActiveResult] = useState("simplified");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mindmapSvg, setMindmapSvg] = useState(null);
  const [visuals, setVisuals] = useState([]); // {prompt, imageDataUrl}
  const [fileB64, setFileB64] = useState(null);
  const [isPdf, setIsPdf] = useState(false);

  const inputText = useMemo(() => {
    if (mode === "text") return text;
    if (mode === "voice") return voiceText;
    return fileText;
  }, [mode, text, voiceText, fileText]);

  useEffect(() => {
    setMindmapSvg(null);
  }, [result?.mindmap]);

  async function onUpload(file) {
    if (!file) return;
    setIsPdf(file.type === "application/pdf" || file.name.endsWith(".pdf"));
    
    // Read as base64 for vision processing if it's a PDF
    const reader = new FileReader();
    reader.onload = (e) => {
        const b64 = e.target.result.split(",")[1];
        setFileB64(b64);
    };
    reader.readAsDataURL(file);

    if (file.type === "text/plain") {
      const t = await file.text();
      setFileText(t);
      return;
    }
    const form = new FormData();
    form.append("file", file);
    try {
      const data = await apiFetch("/api/extract-text", { method: "POST", body: form });
      setFileText(data.text || "");
    } catch (e) {
      console.error("Text extraction failed, will rely on vision if PDF:", e);
    }
  }

  async function simplify() {
    const trimmed = inputText.trim();
    if (!trimmed) {
      alert("Please enter, speak, or upload some text first.");
      return;
    }
    setBusy(true);
    setResult(null);
    setVisuals([]);
    try {
      const data = await apiFetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            text: trimmed, 
            mode,
            is_pdf: mode === "document" && isPdf,
            file_b64: mode === "document" ? fileB64 : null
        }),
      });
      setResult(data);
    } catch (e) {
      alert(e.message || "Could not simplify right now.");
    } finally {
      setBusy(false);
    }
  }

  function readAloud() {
    if (!result) return;
    let toSpeak = "";
    if (activeResult === "simplified") toSpeak = result.simplified;
    if (activeResult === "keypoints") toSpeak = (result.keypoints || []).join(". ");
    if (activeResult === "examples") toSpeak = (result.examples || []).join(". ");
    if (activeResult === "summary") toSpeak = result.summary;
    if (activeResult === "layman") toSpeak = result.layman;
    if (activeResult === "mindmap") toSpeak = "Mindmap is shown visually.";
    if (activeResult === "visuals") toSpeak = "Choose a prompt to generate an image.";

    if (!toSpeak) return;
    if (!("speechSynthesis" in window)) {
      alert("Read aloud is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(toSpeak);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  async function renderMindmap() {
    if (!result?.mindmap) return;
    mermaid.initialize({ startOnLoad: false, theme: "default" });
    const id = `mindmap-${Date.now()}`;
    const { svg } = await mermaid.render(id, result.mindmap);
    setMindmapSvg(svg);
  }

  useEffect(() => {
    if (activeResult !== "mindmap") return;
    if (!result?.mindmap) return;
    renderMindmap().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeResult, result?.mindmap]);

  async function generateImage(prompt) {
    try {
      if (!window.puter) {
        alert("Puter.js not loaded yet.");
        return;
      }
      const img = await window.puter.ai.txt2img(prompt);
      // Puter returns an HTMLImageElement or similar. We need the src.
      setVisuals((prev) => [{ prompt, imageDataUrl: img.src }, ...prev]);
    } catch (e) {
      console.error(e);
      alert("Could not generate image right now.");
    }
  }

  return (
    <div>
      <h2 className="card-title">Simplify Text</h2>
      <p className="card-subtitle">
        Enter text, speak, or upload documents to simplify content for easier reading.
      </p>

      <div className="chip-row">
        <button className={`chip ${mode === "text" ? "chip-primary" : ""}`} type="button" onClick={() => setMode("text")}>
          Enter text
        </button>
        <button className={`chip ${mode === "voice" ? "chip-primary" : ""}`} type="button" onClick={() => setMode("voice")}>
          Voice input
        </button>
        <button className={`chip ${mode === "document" ? "chip-primary" : ""}`} type="button" onClick={() => setMode("document")}>
          Upload document
        </button>
      </div>

      {mode === "text" && (
        <div className="simplify-input-area">
          <textarea className="text-area" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text here to simplify..." />
        </div>
      )}

      {mode === "voice" && (
        <div className="simplify-input-area">
          <p className="card-subtitle">Voice capture can be added next (browser dependent). For now, paste your transcript here.</p>
          <textarea className="text-area" rows={4} value={voiceText} onChange={(e) => setVoiceText(e.target.value)} placeholder="Your spoken words will appear here..." />
        </div>
      )}

      {mode === "document" && (
        <div className="simplify-input-area">
          <input type="file" accept=".txt,.pdf,.docx" onChange={(e) => onUpload(e.target.files?.[0])} />
          <textarea className="text-area" rows={4} value={fileText} onChange={(e) => setFileText(e.target.value)} placeholder="Extracted text preview will appear here..." />
        </div>
      )}

      <div className="actions-row">
        <button className="btn-primary" type="button" onClick={simplify} disabled={busy}>
          {busy ? "Simplifying…" : "Simplify text"}
        </button>
        <button className="btn-ghost" type="button" onClick={readAloud} disabled={!result}>
          Read aloud
        </button>
      </div>

      <div className="simplify-results">
        <div className="simplify-tabs">
          {RESULT_TABS.map((t) => (
            <button
              key={t.id}
              className={`simplify-tab ${activeResult === t.id ? "simplify-tab-active" : ""}`}
              type="button"
              onClick={() => setActiveResult(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="simplify-result-content">
          {!result && <p className="card-subtitle">Your results will appear here.</p>}

          {result && activeResult === "simplified" && <div>{result.simplified}</div>}

          {result && activeResult === "keypoints" && (
            <ul>
              {result.keypoints?.length > 0 ? (
                result.keypoints.map((k, i) => <li key={i}>{k}</li>)
              ) : (
                <li>No keypoints found for this text.</li>
              )}
            </ul>
          )}

          {result && activeResult === "examples" && (
            <ol>
              {result.examples?.length > 0 ? (
                result.examples.map((ex, i) => <li key={i}>{ex}</li>)
              ) : (
                <li>No examples found for this text.</li>
              )}
            </ol>
          )}

          {result && activeResult === "summary" && <div>{result.summary}</div>}
          {result && activeResult === "layman" && <div>{result.layman}</div>}

          {result && activeResult === "mindmap" && (
            <div className="mindmap-wrap">
              {!mindmapSvg ? (
                <p className="card-subtitle">Rendering mindmap…</p>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: mindmapSvg }} />
              )}
            </div>
          )}

          {result && activeResult === "visuals" && (
            <div>
              <div className="card-subtitle" style={{ marginBottom: 10 }}>
                Click a prompt to generate an image.
              </div>
              <div className="chip-row">
                {(result.visuals || []).map((p, i) => (
                  <button key={i} className="chip" type="button" onClick={() => generateImage(p)}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="visuals-grid">
                {visuals.map((v, i) => (
                  <div className="visual-card" key={`${v.prompt}-${i}`}>
                    {v.imageDataUrl ? (
                      <img className="visual-img" src={v.imageDataUrl} alt="Visual example" />
                    ) : (
                      <div className="card-subtitle">No image returned.</div>
                    )}
                    <div className="visual-caption">{v.prompt}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card-subtitle" style={{ marginTop: 10 }}>
        API base: <strong>{getApiBase()}</strong>
      </div>
    </div>
  );
}

