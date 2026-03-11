import React, { useState, useEffect } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    points: 120,
    streak: 5,
    badges: 3,
    studyTime: "12h 30m",
    quizzesCompleted: 8,
    accuracy: "85%",
    dailyProgress: [20, 45, 30, 60, 85, 45, 90], // last 7 days points
  });

  return (
    <div>
      <h2 className="card-title">My Learning Dashboard</h2>
      <p className="card-subtitle">Great job! You're making amazing progress.</p>

      <div className="dashboard-grid">
        <div className="metric">
          <div className="metric-label">Total points</div>
          <div className="metric-value">{stats.points}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Streak</div>
          <div className="metric-value">{stats.streak} days</div>
        </div>
        <div className="metric">
          <div className="metric-label">Badges</div>
          <div className="metric-value">{stats.badges}</div>
        </div>
      </div>

      <div className="card-subsection">
        <h3 className="card-subheading">Badges Earned</h3>
        <div className="chip-row">
          <span className="chip chip-primary">Consistent Learner 🌟</span>
          <span className="chip chip-primary">Quiz Master 🧠</span>
          <span className="chip chip-primary">100 Points Club 🏆</span>
        </div>
      </div>

      <div className="card-subsection">
        <h3 className="card-subheading">Learning Progress (Last 7 Days)</h3>
        <div className="progress-graph-container" style={{ margin: "20px 0", height: "150px" }}>
            <svg viewBox="0 0 700 150" style={{ width: "100%", height: "100%" }}>
                <polyline
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={stats.dailyProgress.map((p, i) => `${i * 100 + 50},${150 - (p * 1.2 + 20)}`).join(" ")}
                />
                {stats.dailyProgress.map((p, i) => (
                    <circle key={i} cx={i * 100 + 50} cy={150 - (p * 1.2 + 20)} r="6" fill="var(--color-accent-strong)" />
                ))}
                <text x="50" y="145" fontSize="12" fill="#888">Mon</text>
                <text x="150" y="145" fontSize="12" fill="#888">Tue</text>
                <text x="250" y="145" fontSize="12" fill="#888">Wed</text>
                <text x="350" y="145" fontSize="12" fill="#888">Thu</text>
                <text x="450" y="145" fontSize="12" fill="#888">Fri</text>
                <text x="550" y="145" fontSize="12" fill="#888">Sat</text>
                <text x="650" y="145" fontSize="12" fill="#888">Sun</text>
            </svg>
        </div>
      </div>

      <div className="card-subsection report-section">
        <h3 className="card-subheading">Teacher / Parent Report Center</h3>
        <div className="report-grid">
            <div className="report-card">
                <h4>Parent Summary</h4>
                <p>Child shows high engagement in <strong>Math</strong> and <strong>Science</strong>. Accuracy has improved by 12% this week.</p>
                <button className="text-button">Download Weekly Report</button>
            </div>
            <div className="report-card">
                <h4>Teacher Insights</h4>
                <p>Focus periods are consistent (average 25 mins). Recommended next step: Phonics levels 3 & 4.</p>
                <button className="text-button">Message Support</button>
            </div>
        </div>
        
        <div className="dashboard-grid" style={{ marginTop: "15px" }}>
          <div className="metric mini">
            <div className="metric-label">Time on Task</div>
            <div className="metric-value">{stats.studyTime}</div>
          </div>
          <div className="metric mini">
            <div className="metric-label">Exercises</div>
            <div className="metric-value">{stats.quizzesCompleted}</div>
          </div>
          <div className="metric mini">
            <div className="metric-label">Accuracy</div>
            <div className="metric-value">{stats.accuracy}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

