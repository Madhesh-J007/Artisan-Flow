// The 4 questions the agent asks, shared between the scripted demo flow
// (VoiceIntake.jsx) and the real live-voice flow (LiveVoiceIntake.jsx).
// Keeping these in one place means both paths ask identically and stay in sync.

export const AGENT_QUESTIONS = [
  {
    field: "craft",
    agentTamil: "வணக்கம்! என்ன கைவினை செய்கிறீர்கள்?",
    agentEn: "Hi! What craft do you do?"
  },
  {
    field: "location",
    agentTamil: "நல்லது. நீங்கள் எந்த ஊரில் இருக்கிறீர்கள்?",
    agentEn: "Great. Which town are you in?"
  },
  {
    field: "weeklyCapacityUnits",
    agentTamil: "வாரத்திற்கு எத்தனை தயாரிக்க முடியும்?",
    agentEn: "How many can you make per week?"
  },
  {
    field: "productionCostPerUnit",
    agentTamil: "ஒன்றுக்கு எவ்வளவு செலவாகும்?",
    agentEn: "What does each one cost to make?"
  }
];
