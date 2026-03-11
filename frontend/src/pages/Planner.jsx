import React, { useState, useEffect, useRef } from "react";
import { generateSchedule, formatTime } from "../lib/plannerUtils.js";

const POMODORO_TIME = 25 * 60;

export default function Planner() {
  const [step, setStep] = useState(1); // 1: input, 2: view
  const [subjects, setSubjects] = useState("");
  const [hours, setHours] = useState(2);
  const [schedule, setSchedule] = useState([]);
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");

  // Pomodoro state
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("normal"); // normal | focus
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      alert("Time is up! Great job! 🎉 Have a reward!");
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  const [busy, setBusy] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const form = new FormData();
    form.append("file", file);
    try {
      setBusy(true);
      const data = await apiFetch("/api/extract-text", { method: "POST", body: form });
      setFileText(data.text || "");
    } catch (e) {
      alert("Failed to extract text from document.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    const subjs = subjects.split(",").map((s) => s.trim()).filter(Boolean);
    
    setBusy(true);
    try {
      const data = await apiFetch("/api/smart-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            subjects: subjs, 
            hours: Number(hours),
            document_text: fileText 
        }),
      });
      setSchedule(data.schedule || []);
      setStep(2);
    } catch (e) {
      alert("Could not create AI schedule.");
    } finally {
      setBusy(false);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(POMODORO_TIME);
  };

  if (mode === "focus") {
    return (
      <div className="focus-overlay">
        <div className="focus-content">
          <div className="timer-large">{formatTime(timeLeft)}</div>
          <div className="current-task">
            <h3>Current Task</h3>
            <p>{schedule[0]?.sessions[0]?.subject || "Focus Time"}</p>
          </div>
          <div className="focus-actions">
            <button className="btn-circle" onClick={toggleTimer}>
              {isRunning ? "Pause" : "Start"}
            </button>
            <button className="btn-circle btn-stop" onClick={() => { setIsRunning(false); setMode("normal"); }}>
              Stop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="card-title">Smart Schedule Planner</h2>
      
      {step === 1 && (
        <div className="planner-setup">
          <p className="card-subtitle">Tell us what you want to study!</p>
          <div className="settings-group">
            <label className="settings-label">Subjects (comma separated) OR Upload Document</label>
            <input 
              className="text-area" 
              style={{ minHeight: "40px", marginBottom: "10px" }} 
              value={subjects} 
              onChange={(e) => setSubjects(e.target.value)} 
              placeholder="Math, Science, History..." 
            />
            <div className="file-upload-zone">
                <input type="file" id="planner-upload" hidden onChange={handleFileUpload} />
                <label htmlFor="planner-upload" className="chip chip-primary">
                    {fileName ? `Uploaded: ${fileName}` : "📁 Upload Study Document"}
                </label>
            </div>
          </div>
          <div className="settings-group">
            <label className="settings-label">Hours per day</label>
            <input 
              type="number" 
              className="settings-select" 
              value={hours} 
              onChange={(e) => setHours(e.target.value)} 
            />
          </div>
          <button className="btn-primary" onClick={handleCreate} disabled={busy}>
            {busy ? "Optimizing..." : "Create Study Plan"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="planner-view">
          <div className="card-subsection">
            <h3 className="card-subheading">Your Weekly Plan</h3>
            <div className="schedule-list" style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "20px" }}>
              {schedule.map((day, dIdx) => (
                <div key={dIdx} style={{ marginBottom: "12px" }}>
                  <strong>{day.day}</strong>
                  {day.sessions.map((s, sIdx) => (
                    <div key={sIdx} style={{ fontSize: "0.85rem", marginLeft: "10px" }}>
                      {s.startTime} - {s.subject} ({s.duration}h)
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="pomodoro-timer card-subsection">
            <h3 className="card-subheading">Focus Timer</h3>
            <div className="timer-display" style={{ fontSize: "2rem", margin: "10px 0" }}>
              {formatTime(timeLeft)}
            </div>
            <div className="actions-row">
              <button className="btn-primary" onClick={toggleTimer}>
                {isRunning ? "Pause" : "Start"}
              </button>
              <button className="btn-secondary" onClick={resetTimer}>
                Reset
              </button>
              <button className="btn-ghost" onClick={() => setMode("focus")}>
                Focus Mode
              </button>
            </div>
          </div>
          
          <button className="btn-ghost" style={{ marginTop: "20px" }} onClick={() => setStep(1)}>
            ← Back to settings
          </button>
        </div>
      )}
    </div>
  );
}

