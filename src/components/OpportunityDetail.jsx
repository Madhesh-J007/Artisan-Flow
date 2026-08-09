import { Eyebrow, BackButton, Card, FieldRow, SpeakButton } from "./UI.jsx";
import {
  generateExplanation,
  generateExplanationTamil,
  generateNegotiationScript,
  generateNegotiationScriptTamil
} from "../engine/scoringEngine.js";

const DIMENSIONS = [
  ["Craft match", "craftMatch"],
  ["Location fit", "locationFit"],
  ["Capacity fit", "capacityFit"],
  ["Price fit", "priceFit"],
  ["Buyer requirements", "buyerReqFit"]
];

export default function OpportunityDetail({ profile, opp, onBack, onFeedback }) {
  const explanation = generateExplanation(profile, opp);
  const explanationTamil = generateExplanationTamil(profile, opp);
  const negotiation = generateNegotiationScript(profile, opp);
  const negotiationTamil = generateNegotiationScriptTamil(profile, opp);

  return (
    <div className="p-7 pb-24 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <BackButton onClick={onBack} />
        <h3 className="font-display text-xl">{opp.type}</h3>
      </div>

      <Card>
        <h3 className="font-display text-lg mb-1.5">{opp.title}</h3>
        <FieldRow label="Buyer type" value={opp.buyerType} />
        <FieldRow label="Location" value={opp.location} />
        <FieldRow label="Quantity" value={`${opp.quantityNeeded} units`} />
        <FieldRow label="Timeline" value={`${opp.timelineWeeks} weeks`} />
        <FieldRow label="Price band" value={`₹${opp.priceRangeMin}–₹${opp.priceRangeMax}`} />
      </Card>

      <Eyebrow>Match breakdown</Eyebrow>
      <div className="mb-1">
        {DIMENSIONS.map(([label, key]) => {
          const val = Math.round(opp.breakdown[key] * 100);
          return (
            <div key={key} className="text-xs text-ivoryDim mb-2">
              <span className="flex justify-between mb-0.5">
                <span>{label}</span>
                <span>{val}%</span>
              </span>
              <div className="bg-[#3a322c] h-1.5 rounded overflow-hidden">
                <div
                  className="h-full bg-brass rounded transition-all duration-500"
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-brass/10 border border-brass/35 rounded-[14px] px-4 py-3.5 my-3.5 text-sm">
        <div className="flex justify-between items-start mb-1.5">
          <Eyebrow>Why this match</Eyebrow>
          <SpeakButton text={explanationTamil} />
        </div>
        <div>{explanation}</div>
      </div>

      <div className="bg-indigo/20 border border-indigo/50 rounded-[14px] px-4 py-3.5 my-3.5 text-sm">
        <div className="flex justify-between items-start mb-1.5">
          <Eyebrow>Negotiation helper</Eyebrow>
          <SpeakButton text={negotiationTamil} />
        </div>
        <div>{negotiation}</div>
      </div>

      <Eyebrow>Was this useful?</Eyebrow>
      <div className="flex gap-2.5 mt-2">
        <button
          onClick={() => onFeedback("good")}
          className="flex-1 py-3.5 rounded-full border border-[#4a413a] bg-raised text-ivory font-semibold text-sm hover:border-good hover:text-good transition"
        >
          👍 Good match
        </button>
        <button
          onClick={() => onFeedback("bad")}
          className="flex-1 py-3.5 rounded-full border border-[#4a413a] bg-raised text-ivory font-semibold text-sm hover:border-bad hover:text-bad transition"
        >
          👎 Not for me
        </button>
      </div>
    </div>
  );
}
