import { Eyebrow, BackButton } from "./UI.jsx";

export default function OpportunitiesList({ profile, rankedList, onBack, onSelect }) {
  return (
    <div className="p-7 pb-24 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <BackButton onClick={onBack} />
        <div>
          <Eyebrow>Ranked for you</Eyebrow>
          <h3 className="font-display text-xl -mt-2">
            {rankedList.length} opportunities for {profile.name}
          </h3>
        </div>
      </div>
      <p className="text-ivoryDim mt-0 mb-4">
        Ranked by craft match, distance, capacity, and price fit — not just a list.
      </p>

      <div>
        {rankedList.slice(0, 8).map(opp => {
          const pct = Math.round(opp.score * 100);
          return (
            <div
              key={opp.id}
              onClick={() => onSelect(opp)}
              className="bg-raised rounded-[14px] p-4 px-[18px] mb-3 border border-[#3a322c] cursor-pointer active:scale-[0.98] transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-[15px] font-semibold max-w-[76%]">{opp.title}</div>
                <div className="bg-indigo text-ivory text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                  {pct}% fit
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Tag>{opp.type}</Tag>
                <Tag>{opp.location}</Tag>
                <Tag>₹{opp.priceRangeMin}–{opp.priceRangeMax}</Tag>
                <Tag>{opp.quantityNeeded} units</Tag>
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
