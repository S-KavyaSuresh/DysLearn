import React, { useState } from "react";
import AIAssistant from "./AIAssistant.jsx";

const QUOTES = [
  "You are doing a great job! Keep going!",
  "Every step forward is a victory.",
  "You are stronger than you think.",
  "Mistakes are proof that you are trying.",
  "You have a unique way of seeing the world, and that's a superpower!",
  "Keep your head up, you're learning something new every minute!",
];

export default function FloatingSupport({ aiOpen, onAiOpenChange }) {
  const [encouragement, setEncouragement] = useState("");

  const triggerEncouragement = async () => {
    onAiOpenChange(true);
    setEncouragement("Thinking of something supportive for you...");
    try {
      const { apiFetch } = await import("../lib/api.js");
      const data = await apiFetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: "I'm feeling a bit discouraged and anxious about my studies because of my dyslexia. Can you give me a very short, supportive, and precise encouraging message?" 
        }),
      });
      setEncouragement(data.answer || "You're doing great! Keep it up.");
    } catch (e) {
      setEncouragement("You are doing an amazing job! Keep going!");
    }
  };

  return (
    <>
      <div className="floating-support">
        {!aiOpen && (
          <button
            className="encouragement-button"
            type="button"
            onClick={triggerEncouragement}
          >
            <span>Need encouragement?</span>
          </button>
        )}

        <button
          className="ai-assistant-fab"
          type="button"
          aria-label="Open AI Study Assistant"
          onClick={() => onAiOpenChange(true)}
        >
          AI
        </button>
      </div>

      <AIAssistant
        open={aiOpen}
        onClose={() => onAiOpenChange(false)}
        encouragement={encouragement}
        onClearEncouragement={() => setEncouragement("")}
      />
    </>
  );
}

