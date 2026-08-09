import { useState, useEffect, useRef } from "react";
import { Eyebrow, SpeakButton, speakText } from "./UI.jsx";
import { AGENT_QUESTIONS } from "../data/agentQuestions.js";
import { useProfileExtraction } from "../hooks/useProfileExtraction.js";
import ProfileConfirmCard from "./ProfileConfirmCard.jsx";

const SpeechRecognitionAPI =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

/**
 * Real Tamil speech recognition using the browser's native Web Speech API —
 * same family of browser API as the TTS in UI.jsx, no API key, no cost.
 * This is the "proof of real tech" moment: actual microphone input, actually
 * transcribed, actually sent to the real Profile Extraction Agent. The
 * scripted flow in VoiceIntake.jsx remains the reliable fallback for the
 * main demo path — this is the bonus live moment when conditions allow it.
 */
export default function LiveVoiceIntake({ userName, onConfirm, onAbandon }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);
  const messagesLiveRef = useRef([]);
  const extraction = useProfileExtraction();

  const supported = !!SpeechRecognitionAPI;

  useEffect(() => {
    if (!supported) return;
    const first = AGENT_QUESTIONS[0];
    const initial = [
      {
        speaker: "agent",
        tamil: `வணக்கம் ${userName}! ` + first.agentTamil.replace("வணக்கம்! ", ""),
        en: `Hi ${userName}! ` + first.agentEn.replace("Hi! ", "")
      }
    ];
    setMessages(initial);
    messagesLiveRef.current = initial;
  }, [userName, supported]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, interimText]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  function addMessage(msg) {
    setMessages(prev => {
      const next = [...prev, msg];
      messagesLiveRef.current = next;
      return next;
    });
  }

  function startListening() {
    setError(null);
    setInterimText("");

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "ta-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = event => {
      let finalTranscript = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interim += transcript;
      }
      if (interim) setInterimText(interim);
      if (finalTranscript) handleFinalTranscript(finalTranscript.trim());
    };

    recognition.onerror = event => {
      setListening(false);
      setInterimText("");
      const errorMessages = {
        "not-allowed": "Microphone permission was denied. Allow mic access and try again.",
        "no-speech": "Didn't catch that — no speech detected. Try again.",
        "audio-capture": "No microphone found on this device.",
        network: "Network error during recognition. Check your connection."
      };
      setError(errorMessages[event.error] || `Recognition error: ${event.error}`);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  function handleFinalTranscript(text) {
    setInterimText("");
    addMessage({ speaker: "user", tamil: text, en: null });

    const nextIndex = stepIndex + 1;
    if (nextIndex < AGENT_QUESTIONS.length) {
      setTimeout(() => {
        const next = AGENT_QUESTIONS[nextIndex];
        addMessage({ speaker: "agent", tamil: next.agentTamil, en: next.agentEn });
        setStepIndex(nextIndex);
      }, 500);
    } else {
      setTimeout(() => {
        setDone(true);
        const fullTranscript = messagesLiveRef.current
          .filter(m => m.speaker === "user")
          .map(m => m.tamil)
          .join(" ");
        extraction.run(fullTranscript);
      }, 400);
    }
  }

  if (!supported) {
    return (
      <div className="p-7 pb-24 animate-fade-in">
        <Eyebrow>Live voice</Eyebrow>
        <h2 className="font-display text-2xl mb-2">Not supported in this browser</h2>
        <p className="text-ivoryDim mb-5">
          Real voice recognition needs Chrome or Edge. Use the scripted demo instead for this browser.
        </p>
        <button onClick={onAbandon} className="text-sm text-brass underline">
          ← Back to demo profiles
        </button>
      </div>
    );
  }

  return (
    <div className="p-7 pb-24 animate-fade-in flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <Eyebrow>Live voice — real recognition</Eyebrow>
        <button onClick={onAbandon} className="text-[11px] text-ivoryDim underline">
          Use scripted demo instead
        </button>
      </div>
      <h2 className="font-display text-2xl mb-2">Speak for real</h2>
      <p className="text-ivoryDim mb-4">
        This uses your actual microphone and real Tamil speech recognition — answer in your own words.
      </p>

      <div ref={scrollRef} className="space-y-3 max-h-[340px] overflow-y-auto pr-1 mb-2">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.speaker === "agent" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                m.speaker === "agent"
                  ? "bg-raised border border-[#3a322c] rounded-tl-sm"
                  : "bg-clay/20 border border-clay/40 rounded-tr-sm"
              }`}
            >
              <div className="font-tamil text-[15px] leading-snug">{m.tamil}</div>
              {m.en && <div className="text-[12px] text-ivoryDim italic mt-0.5">{m.en}</div>}
              {m.speaker === "agent" && (
                <div className="mt-1.5">
                  <SpeakButton text={m.tamil} />
                </div>
              )}
            </div>
          </div>
        ))}
        {interimText && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-clay/10 border border-clay/25 border-dashed rounded-tr-sm">
              <div className="font-tamil text-[15px] leading-snug text-ivoryDim italic">{interimText}...</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-bad text-xs bg-bad/10 border border-bad/30 rounded-lg px-3 py-2 mb-3">{error}</div>
      )}

      {!done && (
        <div className="flex flex-col items-center my-6">
          <button
            onClick={startListening}
            disabled={listening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition ${
              listening ? "bg-bad animate-pulse-ring" : "bg-clay"
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-ivory">
              <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.93V21h2v-3.07A7 7 0 0019 11h-2z" />
            </svg>
          </button>
          <div className="text-ivoryDim text-sm mt-3">
            {listening ? "Listening... speak now" : "Tap and speak your answer"}
          </div>
        </div>
      )}

      <ProfileConfirmCard
        status={extraction.status}
        profile={extraction.profile}
        usedFallback={extraction.usedFallback}
        onConfirm={onConfirm}
        onRestart={() => window.location.reload()}
      />
    </div>
  );
}
