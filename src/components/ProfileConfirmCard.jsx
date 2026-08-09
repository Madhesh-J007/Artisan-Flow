import { Eyebrow, BtnPrimary, BtnGhost, Card, FieldRow } from "./UI.jsx";

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ProfileConfirmCard({ status, profile, usedFallback, onConfirm, onRestart }) {
  if (status === "extracting") {
    return (
      <div className="text-center mt-8 animate-fade-in">
        <div className="inline-block w-6 h-6 border-2 border-brass border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-ivoryDim text-sm">Extracting your profile...</p>
      </div>
    );
  }

  if (status !== "done" || !profile) return null;

  return (
    <div className="animate-fade-in mt-2">
      <Eyebrow>Extracted profile</Eyebrow>
      {usedFallback && (
        <div className="text-[11px] text-brass bg-brass/10 border border-brass/30 rounded-lg px-3 py-2 mb-2.5">
          Used offline profile matching (extraction service unavailable).
        </div>
      )}
      <Card>
        <FieldRow label="Craft" value={cap(profile.craft)} />
        <FieldRow label="Product" value={cap(profile.product)} />
        <FieldRow label="Cost / unit" value={`₹${profile.productionCostPerUnit}`} />
        <FieldRow label="Capacity" value={`${profile.weeklyCapacityUnits}/week`} />
        <FieldRow label="Location" value={profile.location} />
      </Card>

      <BtnPrimary onClick={() => onConfirm(profile)} className="mt-2">
        Save profile →
      </BtnPrimary>
      <BtnGhost onClick={onRestart} className="mt-2.5">
        Start over
      </BtnGhost>
    </div>
  );
}
