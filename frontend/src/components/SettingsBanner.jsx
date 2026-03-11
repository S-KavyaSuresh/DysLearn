import React, { useEffect, useMemo, useState, useRef } from "react";

const FONT_MAP = {
  lexend:
    '"Lexend", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  atkinson:
    '"Atkinson Hyperlegible", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export default function SettingsBanner() {
  const [open, setOpen] = useState(true);

  const [fontFamily, setFontFamily] = useState("lexend");
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [wordSpacing, setWordSpacing] = useState(0.1);
  const [letterSpacing, setLetterSpacing] = useState(0.04);
  const [theme, setTheme] = useState("calm");
  const [soothingSound, setSoothingSound] = useState("none");
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);

  const SOUND_URLS = {
    ocean: "https://www.soundjay.com/nature/ocean-waves-1.mp3",
    breeze: "https://www.soundjay.com/nature/wind-breeze-01.mp3",
    rain: "https://www.soundjay.com/nature/rain-01.mp3",
  };

  const family = useMemo(() => FONT_MAP[fontFamily] || FONT_MAP.lexend, [fontFamily]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-family-base", family);
    root.style.setProperty("--font-size-base", `${fontSize}px`);
    root.style.setProperty("--line-height-base", `${lineHeight}`);
    root.style.setProperty("--word-spacing-base", `${wordSpacing}em`);
    root.style.setProperty("--letter-spacing-base", `${letterSpacing}em`);
  }, [family, fontSize, lineHeight, wordSpacing, letterSpacing]);

  useEffect(() => {
    document.body.classList.remove("theme-warm", "theme-dark", "theme-high-contrast");
    if (theme === "warm") document.body.classList.add("theme-warm");
    if (theme === "dark") document.body.classList.add("theme-dark");
    if (theme === "high-contrast") document.body.classList.add("theme-high-contrast");
  }, [theme]);

  const toggleAudio = (sound) => {
    if (soothingSound === sound && isPlaying) {
      setIsPlaying(false);
      audioRef.current?.pause();
    } else {
      setSoothingSound(sound);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = SOUND_URLS[sound];
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
    }
  };

  const stopAudio = () => {
    setIsPlaying(false);
    audioRef.current?.pause();
    setSoothingSound("none");
  };

  return (
    <aside
      className={`settings-banner ${open ? "settings-banner-open" : "settings-banner-closed"}`}
      aria-label="Reading and comfort settings"
    >
      <button
        className="settings-toggle-handle"
        type="button"
        aria-label={open ? "Collapse settings panel" : "Expand settings panel"}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{open ? ">" : "<"}</span>
      </button>

      <div className="settings-content" style={{ visibility: open ? "visible" : "hidden" }}>
        {open && <h2 className="settings-title">Comfort Settings</h2>}

        <div className="settings-group">
          <label className="settings-label" htmlFor="fontFamilySelect">
            Font style
          </label>
          <select
            id="fontFamilySelect"
            className="settings-select"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            <option value="lexend">Lexend (recommended)</option>
            <option value="atkinson">Atkinson Hyperlegible</option>
            <option value="system">System default</option>
          </select>
        </div>

        <div className="settings-group">
          <label className="settings-label" htmlFor="fontSizeRange">
            Font size
          </label>
          <input
            id="fontSizeRange"
            type="range"
            min="14"
            max="28"
            value={fontSize}
            className="settings-range"
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
        </div>

        <div className="settings-group">
          <label className="settings-label" htmlFor="lineHeightRange">
            Line spacing
          </label>
          <input
            id="lineHeightRange"
            type="range"
            min="1.2"
            max="2"
            step="0.1"
            value={lineHeight}
            className="settings-range"
            onChange={(e) => setLineHeight(Number(e.target.value))}
          />
        </div>

        <div className="settings-group">
          <label className="settings-label" htmlFor="wordSpacingRange">
            Word spacing
          </label>
          <input
            id="wordSpacingRange"
            type="range"
            min="0"
            max="0.6"
            step="0.05"
            value={wordSpacing}
            className="settings-range"
            onChange={(e) => setWordSpacing(Number(e.target.value))}
          />
        </div>

        <div className="settings-group">
          <label className="settings-label" htmlFor="letterSpacingRange">
            Letter spacing
          </label>
          <input
            id="letterSpacingRange"
            type="range"
            min="0"
            max="0.3"
            step="0.02"
            value={letterSpacing}
            className="settings-range"
            onChange={(e) => setLetterSpacing(Number(e.target.value))}
          />
        </div>

        <div className="settings-group">
          <label className="settings-label" htmlFor="themeSelect">
            Theme
          </label>
          <select
            id="themeSelect"
            className="settings-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="calm">Calm blue (default)</option>
            <option value="warm">Warm sand</option>
            <option value="dark">Night mode</option>
            <option value="high-contrast">High contrast</option>
          </select>
        </div>
        <div className="settings-group">
          <label className="settings-label">Soothing sounds</label>
          <div className="chip-row" style={{ marginTop: "8px" }}>
            <button
              className={`chip ${soothingSound === "ocean" && isPlaying ? "chip-primary" : ""}`}
              onClick={() => toggleAudio("ocean")}
            >
              Ocean
            </button>
            <button
              className={`chip ${soothingSound === "breeze" && isPlaying ? "chip-primary" : ""}`}
              onClick={() => toggleAudio("breeze")}
            >
              Breeze
            </button>
            <button
              className={`chip ${soothingSound === "rain" && isPlaying ? "chip-primary" : ""}`}
              onClick={() => toggleAudio("rain")}
            >
              Rain
            </button>
          </div>
          {isPlaying && (
            <button className="btn-ghost" style={{ marginTop: "8px", width: "100%" }} onClick={stopAudio}>
              Stop Sound
            </button>
          )}
          <audio ref={audioRef} />
        </div>
      </div>
    </aside>
  );
}

