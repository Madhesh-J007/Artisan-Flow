import { useState, useEffect, useRef } from "react";
import { Eyebrow, SpeakButton, speakText } from "./UI.jsx";
import { AGENT_QUESTIONS } from "../data/agentQuestions.js";
import { useProfileExtraction } from "../hooks/useProfileExtraction.js";
import ProfileConfirmCard from "./ProfileConfirmCard.jsx";
import LiveVoiceIntake from "./LiveVoiceIntake.jsx";

// PRESETS drive the scripted answers so different test accounts can get
// realistic, *different* profiles instead of everyone landing on the same
// pottery/Madurai/40-units/₹120 combo. Chosen to spread sensibly across
// craft, location, capacity, price, and experience against opportunities.json.
const LOCATION_TAMIL = {
  Chennai: "சென்னையில்",
  Madurai: "மதுரையில்",
  Coimbatore: "கோயம்புத்தூரில்",
  Thoothukudi: "தூத்துக்குடியில்",
  Tirunelveli: "திருநெல்வேலியில்",
  Bengaluru: "பெங்களூரில்"
};

const PRESETS = [
  {
    id: "pottery-madurai",
    label: "Pottery — Madurai",
    craft: "pottery",
    craftTamil: "மண்பாண்டங்கள்",
    craftEn: "I make pottery.",
    product: "hand-painted terracotta pots and decor items",
    productKeywords: ["terracotta", "pottery", "hand-painted", "decor"],
    location: "Madurai",
    weeklyCapacityUnits: 40,
    productionCostPerUnit: 120,
    yearsExperience: 10
  },
  {
    id: "pottery-bengaluru",
    label: "Pottery — Bengaluru",
    craft: "pottery",
    craftTamil: "மண்பாண்டங்கள்",
    craftEn: "I make pottery.",
    product: "premium hand-painted decorative vases",
    productKeywords: ["hand-painted", "pottery", "vases", "decor"],
    location: "Bengaluru",
    weeklyCapacityUnits: 15,
    productionCostPerUnit: 280,
    yearsExperience: 6
  },
  {
    id: "weaving-madurai",
    label: "Weaving — Madurai",
    craft: "weaving",
    craftTamil: "நெசவு வேலை",
    craftEn: "I weave handloom cotton textiles.",
    product: "handloom cotton sarees and fabric",
    productKeywords: ["handloom", "cotton", "saree", "textile"],
    location: "Madurai",
    weeklyCapacityUnits: 25,
    productionCostPerUnit: 650,
    yearsExperience: 12
  },
  {
    id: "weaving-coimbatore",
    label: "Weaving — Coimbatore",
    craft: "weaving",
    craftTamil: "நெசவு வேலை",
    craftEn: "I weave natural-dye handloom cotton.",
    product: "natural-dye handloom cotton textiles",
    productKeywords: ["handloom", "cotton", "natural dye", "textile"],
    location: "Coimbatore",
    weeklyCapacityUnits: 12,
    productionCostPerUnit: 520,
    yearsExperience: 4
  },
  {
    id: "bamboo-thoothukudi",
    label: "Bamboo craft — Thoothukudi",
    craft: "bamboo craft",
    craftTamil: "மூங்கில் கைவினை",
    craftEn: "I make bamboo baskets and mats.",
    product: "bamboo baskets and woven mats",
    productKeywords: ["bamboo", "cane", "basket"],
    location: "Thoothukudi",
    weeklyCapacityUnits: 50,
    productionCostPerUnit: 90,
    yearsExperience: 8
  },
  {
    id: "bamboo-tirunelveli",
    label: "Bamboo craft — Tirunelveli",
    craft: "bamboo craft",
    craftTamil: "மூங்கில் கைவினை",
    craftEn: "I make decorative bamboo items.",
    product: "decorative bamboo home items",
    productKeywords: ["bamboo", "cane", "decor"],
    location: "Tirunelveli",
    weeklyCapacityUnits: 20,
    productionCostPerUnit: 160,
    yearsExperience: 3
  }
];

function buildConversation(preset) {
  const answers = {
    craft: {
      userTamil: `${preset.craftTamil} செய்கிறேன்.`,
      userEn: preset.craftEn,
      value: preset.craft
    },
    location: {
      userTamil: `${LOCATION_TAMIL[preset.location] || preset.location} இருக்கிறேன்.`,
      userEn: `I'm in ${preset.location}.`,
      value: preset.location
    },
    weeklyCapacityUnits: {
      userTamil: `வாரத்திற்கு ${preset.weeklyCapacityUnits} யூனிட்.`,
      userEn: `${preset.weeklyCapacityUnits} units a week.`,
      value: preset.weeklyCapacityUnits
    },
    productionCostPerUnit: {
      userTamil: `ஒன்றுக்கு ${preset.productionCostPerUnit} ரூபாய்.`,
      userEn: `About ${preset.productionCostPerUnit} rupees each.`,
      value: preset.productionCostPerUnit
    }
  };

  return AGENT_QUESTIONS.map(q => ({
    agentTamil: q.agentTamil,
    agentEn: q.agentEn,
    field: q.field,
    ...answers[q.field]
  }));
}

export default function VoiceIntake({ userName, onConfirm }) {
  // 'mode-select' | 'preset-picker' | 'preset-conversation' | 'live'
  const [mode, setMode] = useState("mode-select");
  const [preset, setPreset] = useState(null);
  const [messages, setMessages] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [awaitingTap, setAwaitingTap] = useState(true);
  const [conversationDone, setConversationDone] = useState(false);
  const scrollRef = useRef(null);
  const extraction = useProfileExtraction();
  const conversation = preset ? buildConversation(preset) : [];

  useEffect(() => {
    if (!preset) return;
    const first = conversation[0];
    const greetingTamil = `வணக்கம் ${userName}! ` + first.agentTamil.replace("வணக்கம்! ", "");
    setMessages([
      {
        speaker: "agent",
        tamil: greetingTamil,
        en: `Hi ${userName}! ` + first.agentEn.replace("Hi! ", "")
      }
    ]);
    speakText(greetingTamil);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName, preset]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function handleMicTap() {
    if (!awaitingTap || listening) return;
    setListening(true);
    setAwaitingTap(false);
    const step = conversation[stepIndex];
    setTimeout(() => {
      setListening(false);
      typeOutAnswer(step);
    }, 900);
  }

  function typeOutAnswer(step) {
    const fullText = step.userTamil;
    let i = 0;
    setMessages(prev => [...prev, { speaker: "user", tamil: "", en: step.userEn, typing: true }]);
    const interval = setInterval(() => {
      i++;
      const revealed = fullText.slice(0, i);
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { speaker: "user", tamil: revealed, en: step.userEn, typing: i < fullText.length };
        return copy;
      });
      if (i >= fullText.length) {
        clearInterval(interval);
        advanceConversation();
      }
    }, 28);
  }

  function advanceConversation() {
    const nextIndex = stepIndex + 1;
    if (nextIndex < conversation.length) {
      setTimeout(() => {
        const next = conversation[nextIndex];
        setMessages(prev => [...prev, { speaker: "agent", tamil: next.agentTamil, en: next.agentEn }]);
        speakText(next.agentTamil);
        setStepIndex(nextIndex);
        setAwaitingTap(true);
      }, 500);
    } else {
      setTimeout(() => {
        setConversationDone(true);
        const transcript = conversation.map(step => step.userEn).join(" ");
        const fallback = {
          craft: preset.craft,
          product: preset.product,
          productKeywords: preset.productKeywords,
          location: preset.location,
          weeklyCapacityUnits: preset.weeklyCapacityUnits,
          productionCostPerUnit: preset.productionCostPerUnit,
          yearsExperience: preset.yearsExperience
        };
        extraction.run(transcript, fallback);
      }, 400);
    }
  }

  // --- Mode select screen ---
  if (mode === "mode-select") {
    return (
      <div className="p-7 pb-24 animate-fade-in">
        <Eyebrow>Build your profile</Eyebrow>
        <h2 className="font-display text-2xl mb-2">How do you want to answer?</h2>
        <p className="text-ivoryDim mb-5">
          Both paths end at the same real Profile Extraction Agent — only how the answers get
          captured differs.
        </p>

        <button
          onClick={() => setMode("live")}
          className="w-full text-left bg-raised border border-brass/50 hover:border-brass rounded-xl px-4 py-4 transition mb-3"
        >
          <div className="text-sm font-semibold text-brass">🎙️ Speak for real</div>
          <div className="text-xs text-ivoryDim mt-1">
            Uses your actual microphone with live Tamil speech recognition. Needs Chrome or Edge.
          </div>
        </button>

        <button
          onClick={() => setMode("preset-picker")}
          className="w-full text-left bg-raised border border-[#3a322c] hover:border-[#4a413a] rounded-xl px-4 py-4 transition"
        >
          <div className="text-sm font-semibold">Try a scripted demo profile</div>
          <div className="text-xs text-ivoryDim mt-1">
            Reliable, repeatable — good for a live pitch demo. Pick a preset scenario below.
          </div>
        </button>
      </div>
    );
  }

  // --- Live voice mode ---
  if (mode === "live") {
    return (
      <LiveVoiceIntake userName={userName} onConfirm={onConfirm} onAbandon={() => setMode("mode-select")} />
    );
  }

  // --- Preset picker screen ---
  if (mode === "preset-picker") {
    return (
      <div className="p-7 pb-24 animate-fade-in">
        <div className="flex justify-between items-start mb-2">
          <Eyebrow>Build your profile</Eyebrow>
          <button onClick={() => setMode("mode-select")} className="text-[11px] text-ivoryDim underline">
            ← Back
          </button>
        </div>
        <h2 className="font-display text-2xl mb-2">Which artisan profile is this?</h2>
        <p className="text-ivoryDim mb-4">
          Dev/demo only — picks which scripted answers get spoken. What happens after is real:
          the transcript is sent to a live Profile Extraction Agent (Claude API) that returns
          structured JSON.
        </p>
        <div className="space-y-2.5">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setPreset(p);
                setMode("preset-conversation");
              }}
              className="w-full text-left bg-raised border border-[#3a322c] hover:border-brass rounded-xl px-4 py-3 transition"
            >
              <div className="text-sm font-semibold">{p.label}</div>
              <div className="text-xs text-ivoryDim mt-0.5">
                {p.weeklyCapacityUnits}/wk · ₹{p.productionCostPerUnit}/unit · {p.yearsExperience} yrs exp
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Scripted conversation ---
  return (
    <div className="p-7 pb-24 animate-fade-in flex flex-col h-full">
      <Eyebrow>Build your profile</Eyebrow>
      <h2 className="font-display text-2xl mb-2">Let's set up your profile</h2>
      <p className="text-ivoryDim mb-4">Tap the mic each time to answer — just speak naturally.</p>

      <div ref={scrollRef} className="space-y-3 max-h-[340px] overflow-y-auto pr-1 mb-2">
        {messages.map((m, idx) => (
          <ChatBubble key={idx} speaker={m.speaker} tamil={m.tamil} en={m.en} typing={m.typing} />
        ))}
      </div>

      {!conversationDone && (
        <div className="flex flex-col items-center my-6">
          <button
            onClick={handleMicTap}
            disabled={!awaitingTap}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition ${
              awaitingTap ? "bg-clay animate-pulse-ring" : "bg-[#4a413a] opacity-50"
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-ivory">
              <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.93V21h2v-3.07A7 7 0 0019 11h-2z" />
            </svg>
          </button>
          <div className="text-ivoryDim text-sm mt-3">
            {listening ? "Listening..." : awaitingTap ? "Tap to answer" : "..."}
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

function ChatBubble({ speaker, tamil, en, typing }) {
  const isAgent = speaker === "agent";
  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isAgent
            ? "bg-raised border border-[#3a322c] rounded-tl-sm"
            : "bg-clay/20 border border-clay/40 rounded-tr-sm"
        }`}
      >
        <div className="font-tamil text-[15px] leading-snug">
          {tamil}
          {typing && <span className="inline-block w-1.5 h-4 bg-ivoryDim ml-0.5 animate-pulse align-middle" />}
        </div>
        {!typing && <div className="text-[12px] text-ivoryDim italic mt-0.5">{en}</div>}
        {isAgent && !typing && tamil && (
          <div className="mt-1.5">
            <SpeakButton text={tamil} />
          </div>
        )}
      </div>
    </div>
  );
}
