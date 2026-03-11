import React, { useEffect, useState } from "react";

export default function UserAccountPanel({ open, onClose }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [goal, setGoal] = useState("");

  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      const panel = document.getElementById("userAccountPanel");
      if (panel && !panel.contains(e.target)) onClose?.();
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <section className="user-account-panel user-account-panel-open" id="userAccountPanel" aria-hidden={!open}>
      <div className="user-account-title">Your account</div>
      <div className="user-account-field">
        <label htmlFor="userNameInput">Name</label>
        <input id="userNameInput" type="text" placeholder="Student name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="user-account-field">
        <label htmlFor="userRoleInput">Role</label>
        <input id="userRoleInput" type="text" placeholder="Student / Parent / Teacher" value={role} onChange={(e) => setRole(e.target.value)} />
      </div>
      <div className="user-account-field">
        <label htmlFor="userGoalInput">Learning goal</label>
        <input id="userGoalInput" type="text" placeholder="e.g. Improve reading, exam prep" value={goal} onChange={(e) => setGoal(e.target.value)} />
      </div>
      <div className="user-account-actions">
        <button className="btn-ghost" type="button" onClick={onClose}>
          Close
        </button>
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            // Placeholder for persistence; we’ll store in DB later.
            onClose?.();
          }}
        >
          Save
        </button>
      </div>
    </section>
  );
}

