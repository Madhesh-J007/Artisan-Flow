import { useState } from "react";
import { Eyebrow, BackButton, Card, FieldRow, BtnPrimary } from "./UI.jsx";
import { generateArtisanMatchExplanation } from "../engine/scoringEngine.js";

const DIMENSIONS = [
  ["Craft match", "craftMatch"],
  ["Location fit", "locationFit"],
  ["Capacity fit", "capacityFit"],
  ["Price fit", "priceFit"],
  ["Buyer requirements", "buyerReqFit"]
];

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function RetailerArtisanDetail({ requirement, artisan, onBack, onContactSent }) {
  const [status, setStatus] = useState("idle"); // 'idle' | 'sending' | 'sent' | 'error'
  const [errorMsg, setErrorMsg] = useState("");
  const explanation = generateArtisanMatchExplanation(requirement, artisan);

  async function handleContact() {
    setStatus("sending");
    setErrorMsg("");
    try {
      await onContactSent(); // caller performs the real Firestore write; throws on failure
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err?.message || "Couldn't send the request. Check your connection and try again.");
    }
  }

  return (
    <div className="p-7 pb-24 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <BackButton onClick={onBack} />
        <h3 className="font-display text-xl">{artisan.name}</h3>
      </div>

      <Card>
        <FieldRow label="Craft" value={cap(artisan.craft)} />
        <FieldRow label="Product" value={cap(artisan.product)} />
        <FieldRow label="Location" value={artisan.location} />
        <FieldRow label="Weekly capacity" value={`${artisan.weeklyCapacityUnits} units`} />
        <FieldRow label="Cost per unit" value={`₹${artisan.productionCostPerUnit}`} />
        <FieldRow label="Experience" value={`${artisan.yearsExperience} years`} />
      </Card>

      <Eyebrow>Match breakdown</Eyebrow>
      <div className="mb-1">
        {DIMENSIONS.map(([label, key]) => {
          const val = Math.round(artisan.breakdown[key] * 100);
          return (
            <div key={key} className="text-xs text-ivoryDim mb-2">
              <span className="flex justify-between mb-0.5">
                <span>{label}</span>
                <span>{val}%</span>
              </span>
              <div className="bg-[#3a322c] h-1.5 rounded overflow-hidden">
                <div className="h-full bg-brass rounded transition-all duration-500" style={{ width: `${val}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-brass/10 border border-brass/35 rounded-[14px] px-4 py-3.5 my-3.5 text-sm">
        <Eyebrow>Why this match</Eyebrow>
        <div>{explanation}</div>
      </div>

      {status === "error" && (
        <div className="text-bad text-xs bg-bad/10 border border-bad/30 rounded-lg px-3 py-2 mt-3">
          {errorMsg}
        </div>
      )}

      <BtnPrimary onClick={handleContact} className="mt-2" disabled={status === "sending" || status === "sent"}>
        {status === "sending"
          ? "Sending..."
          : status === "sent"
          ? "Request sent ✓"
          : status === "error"
          ? "Try again →"
          : `Contact ${artisan.name} →`}
      </BtnPrimary>
    </div>
  );
}
