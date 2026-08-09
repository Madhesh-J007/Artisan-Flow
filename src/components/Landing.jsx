import { Eyebrow } from "./UI.jsx";

export default function Landing({ onSelectRole }) {
  return (
    <div className="p-7 pt-16 pb-24 animate-fade-in">
      <div className="text-center mt-4">
        <Eyebrow>Artisan Flow</Eyebrow>
        <h1 className="font-display text-[32px] leading-tight">
          உங்கள் கைவினை.
          <br />
          உங்கள் வருமானம்.
        </h1>
        <p className="text-ivoryDim mt-3.5">
          Connecting rural artisans directly with the buyers looking for them.
        </p>
      </div>

      <div className="mt-12">
        <div className="text-[11px] tracking-[0.1em] uppercase text-ivoryDim mb-3 text-center">
          Continue as
        </div>

        <button
          onClick={() => onSelectRole("artisan")}
          className="w-full bg-raised border border-[#4a413a] text-left px-[18px] py-5 rounded-[14px] flex justify-between items-center mb-3 active:scale-[0.98] transition"
        >
          <div>
            <div className="font-semibold text-ivory">I'm an Artisan</div>
            <div className="text-xs text-ivoryDim mt-0.5 font-tamil">
              பேசுங்கள், வாய்ப்புகளைக் கண்டறியுங்கள்
            </div>
          </div>
          <span className="text-clayBright text-xl">→</span>
        </button>

        <button
          onClick={() => onSelectRole("retailer")}
          className="w-full bg-raised border border-[#4a413a] text-left px-[18px] py-5 rounded-[14px] flex justify-between items-center active:scale-[0.98] transition"
        >
          <div>
            <div className="font-semibold text-ivory">I'm a Retailer / Buyer</div>
            <div className="text-xs text-ivoryDim mt-0.5">
              Post a requirement, find matched artisans
            </div>
          </div>
          <span className="text-indigo text-xl">→</span>
        </button>
      </div>

      <p className="text-[11px] text-[#5f564d] text-center mt-10">
        Prototype build — National Startup Hackathon 2026
      </p>
    </div>
  );
}
