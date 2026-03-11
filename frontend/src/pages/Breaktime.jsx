import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api.js";

const WORDS = ["LEARN", "STUDY", "SMART", "DYSLEXIA", "REWARD", "FOCUS", "HAPPY", "BRAVE", "KIND", "SHINE"];

export default function Breaktime() {
  const [activeGame, setActiveGame] = useState(null); 
  const [quote, setQuote] = useState("Loading inspiration...");

  // Simon Says State
  const [simonSequence, setSimonSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [simonStatus, setSimonStatus] = useState("idle"); 

  // Word Game State
  const [currentWord, setCurrentWord] = useState("");
  const [displayWord, setDisplayWord] = useState(""); // scrambled or missing letters
  const [userGuess, setUserGuess] = useState("");

  // Breathing State
  const [breathPhase, setBreathPhase] = useState("Inhale");
  const [breathCount, setBreathCount] = useState(0);

  // Memory/Pair Matching State
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);

  // Bubble Pop State
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);

  // Math State
  const [equation, setEquation] = useState({ q: "", a: 0 });
  const [level, setLevel] = useState(1);
  const [activeColor, setActiveColor] = useState(null);

  const fetchQuote = useCallback(async () => {
    try {
      const data = await apiFetch("/api/quote");
      setQuote(data.quote);
    } catch (e) {
      setQuote("You are doing an amazing job! Keep going! 🌟");
    }
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // Breathing Timer
  useEffect(() => {
    if (activeGame === "breathing") {
      const timer = setInterval(() => {
        setBreathPhase((p) => {
            if (p === "Inhale") return "Hold";
            if (p === "Hold") return "Exhale";
            return "Inhale";
        });
        setBreathCount(c => c + 1);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [activeGame]);

  // Bubble Spawner
  useEffect(() => {
    if (activeGame === "bubble") {
      const spawn = setInterval(() => {
        const newBubble = {
          id: Date.now(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          size: Math.random() * 40 + 30
        };
        setBubbles(prev => [...prev, newBubble].slice(-10));
      }, 1000);
      return () => clearInterval(spawn);
    }
  }, [activeGame]);

  // Simon Logic
  const startSimon = () => {
    setLevel(1);
    const newSeq = [Math.floor(Math.random() * 4)];
    setSimonSequence(newSeq);
    setUserSequence([]);
    playSequence(newSeq);
  };

  const playSequence = async (seq) => {
    setSimonStatus("playing");
    for (const colorIdx of seq) {
      await new Promise(r => setTimeout(r, 400));
      setActiveColor(colorIdx);
      await new Promise(r => setTimeout(r, 600));
      setActiveColor(null);
    }
    setSimonStatus("user");
  };

  const handleSimonClick = (idx) => {
    if (simonStatus !== "user") return;
    const newSeq = [...userSequence, idx];
    setUserSequence(newSeq);
    
    if (idx !== simonSequence[newSeq.length - 1]) {
      alert(`Game Over! You reached level ${level}`);
      setSimonStatus("idle");
      setActiveGame(null);
      return;
    }

    if (newSeq.length === simonSequence.length) {
      setLevel(l => l + 1);
      const nextSeq = [...simonSequence, Math.floor(Math.random() * 4)];
      setSimonSequence(nextSeq);
      setUserSequence([]);
      setTimeout(() => playSequence(nextSeq), 1000);
    }
  };

  // Memory Logic
  const startMemory = () => {
    const icons = ["🍎", "🐶", "🚀", "🎨", "🧩", "☀️"];
    const pair = [...icons, ...icons].sort(() => Math.random() - 0.5);
    setCards(pair);
    setFlipped([]);
    setSolved([]);
    setActiveGame("memory");
  };

  const handleCardClick = (idx) => {
    if (flipped.length === 2 || solved.includes(idx) || flipped.includes(idx)) return;
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setSolved([...solved, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  // Missing Letters Logic
  const startMissingLetters = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const chars = word.split("");
    const missingIdx = Math.floor(Math.random() * chars.length);
    const hidden = [...chars];
    hidden[missingIdx] = "_";
    setCurrentWord(word);
    setDisplayWord(hidden.join(" "));
    setUserGuess("");
    setActiveGame("missing");
  };

  // Math Logic
  const startMath = () => {
    const range = level * 10;
    const a = Math.floor(Math.random() * range) + 1;
    const b = Math.floor(Math.random() * range) + 1;
    setEquation({ q: `${a} + ${b} = ?`, a: a + b });
    setUserGuess("");
    setActiveGame("math");
  };

  // Pattern Match Logic
  const [pattern, setPattern] = useState([]);
  const startPattern = () => {
    setLevel(1);
    const p = Array.from({ length: 3 }, () => ["🔴", "🔵", "🟡", "🟢"][Math.floor(Math.random() * 4)]);
    setPattern(p);
    setUserGuess("");
    setActiveGame("pattern");
  };

  return (
    <div className="breaktime-page">
      <header className="page-header" style={{ marginBottom: "20px", textAlign: "center" }}>
        <h2 className="card-title">Break Time & Encouragement</h2>
        <div className="quote-box" style={{ 
            background: "var(--color-accent-soft)", 
            padding: "15px", 
            borderRadius: "15px", 
            marginTop: "10px",
            fontStyle: "italic",
            color: "var(--color-accent-strong)"
        }}>
          "{quote}"
          <button className="text-button" style={{ marginLeft: "10px" }} onClick={fetchQuote}>New Quote</button>
        </div>
      </header>
      
      {!activeGame && (
        <div className="games-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          <button className="chip chip-primary" onClick={() => { setActiveGame("simon"); startSimon(); }}>Simon Says</button>
          <button className="chip chip-primary" onClick={startMemory}>Pair Matching</button>
          <button className="chip chip-primary" onClick={startMissingLetters}>Missing Letters</button>
          <button className="chip chip-primary" onClick={() => setActiveGame("breathing")}>Breathing</button>
          <button className="chip chip-primary" onClick={() => { setActiveGame("bubble"); setScore(0); }}>Bubble Pop</button>
          <button className="chip chip-primary" onClick={() => { setLevel(1); startMath(); }}>Math Levels</button>
          <button className="chip chip-primary" onClick={startPattern}>Pattern Match</button>
        </div>
      )}

      {activeGame === "simon" && (
        <div className="game-container" style={{ textAlign: "center" }}>
          <h3>Simon Says - Level {level}</h3>
          <p>{simonStatus === "playing" ? "Watch..." : "Your turn!"}</p>
          <div className="simon-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", maxWidth: "220px", margin: "20px auto" }}>
            {[0, 1, 2, 3].map(i => (
              <button 
                key={i} 
                style={{ 
                  width: "100px", height: "100px", 
                  background: ["#ff5f5f", "#5fafff", "#5fff7f", "#ffff5f"][i],
                  border: "none", borderRadius: "20px", cursor: "pointer",
                  boxShadow: activeColor === i ? "0 0 20px white" : "0 4px 0 rgba(0,0,0,0.1)",
                  opacity: activeColor === i ? 1 : 0.6,
                  transform: activeColor === i ? "scale(1.05)" : "scale(1)",
                  transition: "all 0.1s"
                }}
                onClick={() => handleSimonClick(i)}
              />
            ))}
          </div>
          <button className="btn-ghost" onClick={() => setActiveGame(null)}>Finish Break</button>
        </div>
      )}

      {activeGame === "memory" && (
        <div className="game-container" style={{ textAlign: "center" }}>
          <h3>Pair Matching</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", maxWidth: "300px", margin: "20px auto" }}>
            {cards.map((card, i) => (
              <button 
                key={i}
                style={{ 
                    height: "60px", fontSize: "1.5rem", borderRadius: "10px", border: "1px solid #ddd",
                    background: solved.includes(i) || flipped.includes(i) ? "#fff" : "var(--color-accent)"
                }}
                onClick={() => handleCardClick(i)}
              >
                {(solved.includes(i) || flipped.includes(i)) ? card : "?"}
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => setActiveGame(null)}>Back</button>
        </div>
      )}

      {activeGame === "missing" && (
        <div className="game-container" style={{ textAlign: "center" }}>
          <h3>Find the Missing Letter</h3>
          <p style={{ fontSize: "2rem", letterSpacing: "8px", margin: "20px 0" }}>{displayWord}</p>
          <input 
            className="settings-select" style={{ width: "100px", textAlign: "center", fontSize: "1.2rem" }}
            value={userGuess} maxLength={1}
            onChange={(e) => setUserGuess(e.target.value.toUpperCase())}
          />
          <div className="actions-row" style={{ justifyContent: "center" }}>
            <button className="btn-primary" onClick={() => {
              if (currentWord.includes(userGuess) && userGuess !== "") {
                alert("Great job! 🌟");
                startMissingLetters();
              } else {
                alert("Try another letter!");
              }
            }}>Check</button>
            <button className="btn-ghost" onClick={() => setActiveGame(null)}>Back</button>
          </div>
        </div>
      )}

      {activeGame === "breathing" && (
        <div className="game-container" style={{ textAlign: "center", padding: "40px" }}>
          <div className={`breathing-circle ${breathPhase.toLowerCase()}`} style={{ 
            width: "160px", height: "160px", borderRadius: "50%", 
            background: "linear-gradient(135deg, #709dff, #4f7cff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 30px", color: "#fff", fontSize: "1.2rem", fontWeight: "bold",
            transition: "transform 3s ease-in-out",
            transform: breathPhase === "Inhale" ? "scale(1.3)" : breathPhase === "Exhale" ? "scale(0.8)" : "scale(1.3)"
          }}>
            {breathPhase}
          </div>
          <p>Relax and follow the circle...</p>
          <button className="btn-ghost" onClick={() => setActiveGame(null)}>I feel refreshed</button>
        </div>
      )}

      {activeGame === "bubble" && (
        <div className="game-container" style={{ textAlign: "center", height: "300px", position: "relative", overflow: "hidden", background: "#f0f7ff", borderRadius: "20px" }}>
          <div style={{ position: "absolute", top: "10px", left: "10px" }}>Score: {score}</div>
          {bubbles.map(b => (
            <button 
              key={b.id}
              style={{
                position: "absolute", left: `${b.x}%`, top: `${b.y}%`,
                width: `${b.size}px`, height: `${b.size}px`, borderRadius: "50%",
                background: "rgba(79, 124, 255, 0.4)", border: "2px solid #4f7cff",
                cursor: "pointer", transition: "transform 0.1s"
              }}
              onClick={() => {
                setScore(s => s + 1);
                setBubbles(prev => prev.filter(p => p.id !== b.id));
              }}
            />
          ))}
          <button className="btn-ghost" style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)" }} onClick={() => setActiveGame(null)}>Stop</button>
        </div>
      )}

      {activeGame === "math" && (
        <div className="game-container" style={{ textAlign: "center" }}>
          <h3>Math Challenge - Level {level}</h3>
          <p style={{ fontSize: "2rem", margin: "20px 0" }}>{equation.q}</p>
          <input 
            type="number" className="settings-select" style={{ width: "120px", textAlign: "center" }}
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
          />
          <div className="actions-row" style={{ justifyContent: "center" }}>
            <button className="btn-primary" onClick={() => {
              if (parseInt(userGuess) === equation.a) {
                alert("Correct! Level UP! ⭐");
                setLevel(l => l + 1);
                startMath();
              } else {
                alert("Not quite, try again!");
              }
            }}>Solve</button>
            <button className="btn-ghost" onClick={() => setActiveGame(null)}>Back</button>
          </div>
        </div>
      )}

      {activeGame === "pattern" && (
        <div className="game-container" style={{ textAlign: "center" }}>
          <h3>Pattern Match - Level {level}</h3>
          <p>Complete the pattern!</p>
          <div style={{ fontSize: "2rem", margin: "20px 0" }}>
            {pattern.slice(0, -1).join(" ")} ?
          </div>
          <div className="chip-row" style={{ justifyContent: "center" }}>
            {["🔴", "🔵", "🟡", "🟢"].map(emoji => (
              <button key={emoji} className="chip" onClick={() => {
                if (emoji === pattern[pattern.length - 1]) {
                   alert("Fantastic! 🌈");
                   setLevel(l => l + 1);
                   const nextP = Array.from({ length: 2 + level }, () => ["🔴", "🔵", "🟡", "🟢"][Math.floor(Math.random() * 4)]);
                   setPattern(nextP);
                } else {
                   alert("Try again!");
                }
              }}>{emoji}</button>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => setActiveGame(null)} style={{ marginTop: "20px" }}>Back</button>
        </div>
      )}
    </div>
  );
}
