import React, { useMemo, useState } from "react";
import FeatureTabs from "./components/FeatureTabs.jsx";
import SettingsBanner from "./components/SettingsBanner.jsx";
import FloatingSupport from "./components/FloatingSupport.jsx";
import UserAccountPanel from "./components/UserAccountPanel.jsx";

import SimplifyText from "./pages/SimplifyText.jsx";
import GamifiedLearning from "./pages/GamifiedLearning.jsx";
import Breaktime from "./pages/Breaktime.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Planner from "./pages/Planner.jsx";

export default function App() {
  const [activeTab, setActiveTab] = useState("simplify");

  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const panel = useMemo(() => {
    switch (activeTab) {
      case "simplify":
        return <SimplifyText />;
      case "planner":
        return <Planner />;
      case "gamified":
        return <GamifiedLearning />;
      case "breaktime":
        return <Breaktime />;
      case "dashboard":
        return <Dashboard />;
      default:
        return <SimplifyText />;
    }
  }, [activeTab]);

  return (
    <div className={`app-root ${aiOpen ? "ai-open" : ""}`}>
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-mark">Dys</span>
          <span className="logo-mark-alt">Learn</span>
        </div>
        <div className="app-header-right">
          <button
            className="user-avatar"
            type="button"
            aria-label="User account"
            onClick={() => setUserPanelOpen((v) => !v)}
          >
            <span className="user-avatar-initials">U</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="main-content">
          <FeatureTabs active={activeTab} onChange={setActiveTab} />
          <section className="card main-panel main-panel-active">{panel}</section>
        </section>
      </main>

      <SettingsBanner />

      <FloatingSupport aiOpen={aiOpen} onAiOpenChange={setAiOpen} />

      <UserAccountPanel open={userPanelOpen} onClose={() => setUserPanelOpen(false)} />
    </div>
  );
}

