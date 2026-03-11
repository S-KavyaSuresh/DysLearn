import React, { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api.js";

export default function AIAssistant({ open, onClose, encouragement, onClearEncouragement }) {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi there! 👋 I'm your study buddy. Whether you have a tough school question or just need a little boost, I'm here for you! How are you feeling today?" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, open]);

  useEffect(() => {
    if (!encouragement) return;
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: encouragement },
      { role: "bot", text: "How else can I help you today?" }
    ]);
    onClearEncouragement?.();
  }, [encouragement, onClearEncouragement]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }, { role: "bot", text: "Thinking…" }]);

    try {
      const data = await apiFetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      setMessages((prev) => {
        const copy = [...prev];
        // replace last bot "Thinking…"
        const idx = copy.map((m) => m.text).lastIndexOf("Thinking…");
        if (idx >= 0) copy[idx] = { role: "bot", text: data.answer || "I couldn't answer that." };
        return copy;
      });
    } catch (e) {
      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.map((m) => m.text).lastIndexOf("Thinking…");
        if (idx >= 0) copy[idx] = { role: "bot", text: "Sorry, I couldn’t reach the assistant right now." };
        return copy;
      });
    }
  }

  if (!open) return null;

  return (
    <section className={`ai-assistant-panel ${open ? "open" : ""}`} aria-hidden={!open}>
      <header className="ai-assistant-header">
        <div>
          <div className="ai-assistant-title">AI Study Assistant</div>
          <div className="ai-assistant-subtitle">Ask clear, study-related questions.</div>
        </div>
        <button className="icon-button" type="button" aria-label="Close AI assistant" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="ai-assistant-body">
        <div className="ai-messages">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`ai-message ${m.role === "user" ? "ai-message-user" : "ai-message-bot"}`}
            >
              {m.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form
          className="ai-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            type="text"
            className="ai-input"
            placeholder="Type your question here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn-primary" type="submit">
            Send
          </button>
        </form>
      </div>
    </section>
  );
}

