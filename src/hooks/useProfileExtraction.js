import { useState } from "react";

// Generic last-resort default, used only if live-voice extraction fails AND
// there's no preset to fall back to (the scripted flow has its own
// preset-based fallback instead — see VoiceIntake.jsx).
const GENERIC_FALLBACK = {
  craft: "pottery",
  product: "handmade craft items",
  productKeywords: ["handmade", "craft"],
  location: "Chennai",
  weeklyCapacityUnits: 20,
  productionCostPerUnit: 150,
  yearsExperience: 5,
  languagePreference: "Tamil"
};

/**
 * Shared Profile Extraction Agent caller. Both the scripted demo flow and the
 * real live-voice flow feed a transcript in here and get a structured profile
 * back — same API call, same fallback behavior, so neither path can silently
 * drift out of sync with the other.
 */
export function useProfileExtraction() {
  const [status, setStatus] = useState("idle"); // 'idle' | 'extracting' | 'done'
  const [profile, setProfile] = useState(null);
  const [usedFallback, setUsedFallback] = useState(false);

  async function run(transcript, fallbackProfile = GENERIC_FALLBACK) {
    setStatus("extracting");
    setUsedFallback(false);

    try {
      const res = await fetch("/api/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || `Extraction request failed (${res.status})`);
      }
      if (!data.profile) throw new Error("No profile returned");

      setProfile({ ...data.profile, languagePreference: "Tamil" });
    } catch (err) {
      console.warn("Profile extraction failed, using fallback:", err.message);
      setProfile({ ...fallbackProfile, languagePreference: "Tamil" });
      setUsedFallback(true);
    } finally {
      setStatus("done");
    }
  }

  function reset() {
    setStatus("idle");
    setProfile(null);
    setUsedFallback(false);
  }

  return { status, profile, usedFallback, run, reset };
}
