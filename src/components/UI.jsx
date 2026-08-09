import { useState } from "react";

export function Eyebrow({ children }) {
  return (
    <div className="text-[11px] tracking-[0.14em] uppercase text-brass font-semibold mb-2.5">
      {children}
    </div>
  );
}

export function BtnPrimary({ children, onClick, className = "", disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-[15px] rounded-full font-semibold text-[15px] bg-clay text-ivory hover:bg-clayBright active:scale-[0.97] transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function BtnGhost({ children, onClick, className = "", disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-[15px] rounded-full font-semibold text-[15px] bg-transparent border border-[#4a413a] text-ivoryDim active:scale-[0.97] transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={`bg-raised rounded-[14px] p-4 px-[18px] mb-3 border border-[#3a322c] ${className}`}
    >
      {children}
    </div>
  );
}

export function FieldRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-dashed border-[#3a322c] last:border-none text-sm">
      <span className="text-ivoryDim">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export function Toast({ message, show }) {
  return (
    <div
      className={`fixed bottom-[30px] left-1/2 -translate-x-1/2 bg-raised border border-brass text-ivory py-3 px-5 rounded-full text-[13px] z-50 max-w-[90%] text-center transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5 pointer-events-none"
      }`}
      style={{ transform: show ? "translateX(-50%)" : "translateX(-50%) translateY(20px)" }}
    >
      {message}
    </div>
  );
}

export function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="bg-none border-none text-ivoryDim text-xl px-2 py-1">
      ←
    </button>
  );
}

export function DashboardHeader({ title, subtitle, tabs, activeTab, onTabChange, onLogout }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <Eyebrow>{subtitle}</Eyebrow>
          <h2 className="font-display text-2xl -mt-1">{title}</h2>
        </div>
        <button onClick={onLogout} className="text-[11px] text-ivoryDim border border-[#4a413a] rounded-full px-3 py-1.5">
          Log out
        </button>
      </div>
      {tabs && (
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition ${
                activeTab === tab.key
                  ? "bg-clay/20 border-clay text-ivory"
                  : "bg-raised border-[#4a413a] text-ivoryDim"
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="ml-1.5 bg-clay text-ivory text-[10px] px-1.5 py-0.5 rounded-full">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Text-to-speech playback (Tamil) --------------------------------

let cachedVoices = [];
let voicesLoadPromise = null;

function loadVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve([]);
  if (cachedVoices.length > 0) return Promise.resolve(cachedVoices);
  if (voicesLoadPromise) return voicesLoadPromise;

  voicesLoadPromise = new Promise(resolve => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      cachedVoices = existing;
      resolve(existing);
      return;
    }
    // Chrome/Edge often return an empty list until this event fires once.
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };
    // Safety timeout in case the event never fires on some browsers.
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
  });

  return voicesLoadPromise;
}

function pickBestVoice(voices, preferredLangPrefix) {
  const exact = voices.find(v => v.lang?.toLowerCase().startsWith(preferredLangPrefix));
  if (exact) return exact;
  // No Tamil voice installed on this device/browser — fall back to any
  // Indian-English voice if available, otherwise the browser default.
  return voices.find(v => v.lang?.toLowerCase().startsWith("en-in")) || voices[0] || null;
}

/**
 * Standalone speak function, usable outside the button (e.g. auto-playing
 * the agent's question as soon as it appears, so voice output is something
 * the person *hears* by default rather than something they have to remember
 * to tap). Returns a promise that resolves when speech ends, so callers can
 * sequence things if needed.
 */
export function speakText(text, lang = "ta-IN") {
  return new Promise(resolve => {
    if (!window.speechSynthesis || !text) {
      resolve();
      return;
    }
    loadVoices().then(voices => {
      const voice = pickBestVoice(voices, lang.split("-")[0].toLowerCase());
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voice?.lang || lang;
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  });
}

/**
 * Speaker button for reading text aloud. Defaults to Tamil (ta-IN); if no
 * Tamil voice is installed on the device, it falls back to whatever voice is
 * available and says so via the `lang` it ends up using — this is a real
 * device/browser limitation (Tamil voice packs aren't universal), not a bug.
 */
export function SpeakButton({ text, lang = "ta-IN", className = "" }) {
  const [state, setState] = useState("idle"); // 'idle' | 'loading' | 'speaking' | 'unsupported'

  async function handleClick() {
    if (!window.speechSynthesis) {
      setState("unsupported");
      return;
    }
    if (state === "speaking") {
      window.speechSynthesis.cancel();
      setState("idle");
      return;
    }

    setState("loading");
    const voices = await loadVoices();
    const voice = pickBestVoice(voices, lang.split("-")[0].toLowerCase());

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang || lang;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;

    utterance.onstart = () => setState("speaking");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");

    window.speechSynthesis.cancel(); // stop anything already playing
    window.speechSynthesis.speak(utterance);
  }

  if (state === "unsupported") {
    return <span className="text-[11px] text-ivoryDim">Voice playback not supported on this browser</span>;
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-brass border border-brass/40 rounded-full px-3 py-1.5 hover:bg-brass/10 transition ${className}`}
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
        {state === "speaking" ? (
          <path d="M6 6h4v12H6zm8 0h4v12h-4z" />
        ) : (
          <path d="M8 5v14l11-7z" />
        )}
      </svg>
      {state === "loading" ? "Loading voice..." : state === "speaking" ? "Stop" : "Listen"}
    </button>
  );
}
