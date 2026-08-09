import { Eyebrow, BackButton } from "./UI.jsx";

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function RetailerMatches({ requirement, rankedArtisans, onBack, onSelect, hideHeader = false }) {
  return (
    <div className={hideHeader ? "" : "p-7 pb-24 animate-fade-in"}>
      {!hideHeader && (
        <div className="flex items-center gap-2.5 mb-4">
          <BackButton onClick={onBack} />
          <div>
            <Eyebrow>Matched for your requirement</Eyebrow>
            <h3 className="font-display text-xl -mt-2">{requirement.title}</h3>
          </div>
        </div>
      )}
      {hideHeader && <h3 className="font-display text-xl mb-1">{requirement.title}</h3>}
      <p className="text-ivoryDim mt-0 mb-4">
        Ranked by craft match, distance, capacity, and price fit — the same engine artisans see, applied in reverse.
      </p>

      <div>
        {rankedArtisans.map(artisan => {
          const pct = Math.round(artisan.score * 100);
          return (
            <div
              key={artisan.id}
              onClick={() => onSelect(artisan)}
              className="bg-raised rounded-[14px] p-4 px-[18px] mb-3 border border-[#3a322c] cursor-pointer active:scale-[0.98] transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-[15px] font-semibold">{artisan.name}</div>
                  <div className="text-xs text-ivoryDim">{cap(artisan.craft)} · {artisan.location}</div>
                </div>
                <div className="bg-indigo text-ivory text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                  {pct}% fit
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Tag>{artisan.weeklyCapacityUnits} units/week</Tag>
                <Tag>₹{artisan.productionCostPerUnit}/unit cost</Tag>
                <Tag>{artisan.yearsExperience} yrs experience</Tag>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="text-[11px] text-ivoryDim bg-bg px-2.5 py-[3px] rounded-full border border-[#3a322c]">
      {children}
    </span>
  );
}
