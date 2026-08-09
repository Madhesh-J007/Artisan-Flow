import { useState } from "react";
import opportunities from "../data/opportunities.json";
import { DEFAULT_WEIGHTS, rankOpportunities, adjustWeights } from "../engine/scoringEngine.js";
import { useAuth } from "../context/AuthContext.jsx";
import { DashboardHeader, Toast } from "./UI.jsx";
import VoiceIntake from "./VoiceIntake.jsx";
import OpportunityDetail from "./OpportunityDetail.jsx";
import ArtisanRequests from "./ArtisanRequests.jsx";

export default function ArtisanDashboard() {
  const { firebaseUser, userDoc, updateArtisanProfile, logout } = useAuth();
  const [tab, setTab] = useState("opportunities"); // 'opportunities' | 'requests'
  const [view, setView] = useState("list"); // 'list' | 'detail'
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [rankedList, setRankedList] = useState(() =>
    userDoc?.profileComplete ? rankOpportunities(userDoc, opportunities, DEFAULT_WEIGHTS) : []
  );
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [toast, setToast] = useState({ message: "", show: false });

  function showToast(message) {
    setToast({ message, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2200);
  }

  async function handleProfileConfirmed(profileFields) {
    await updateArtisanProfile(profileFields);
    const merged = { ...userDoc, ...profileFields, profileComplete: true };
    const ranked = rankOpportunities(merged, opportunities, weights);
    setRankedList(ranked);
  }

  function handleSelectOpportunity(opp) {
    setSelectedOpp(opp);
    setView("detail");
  }

  function handleFeedback(reaction) {
    const feedback = { opportunityId: selectedOpp.id, reaction, reason: null };
    const newWeights = adjustWeights(weights, feedback, selectedOpp, userDoc);
    setWeights(newWeights);
    const reRanked = rankOpportunities(userDoc, opportunities, newWeights);
    setRankedList(reRanked);
    showToast(reaction === "good" ? "Got it — showing more like this." : "Got it — adjusting your recommendations...");
    setTimeout(() => setView("list"), 900);
  }

  if (!userDoc) return <p className="p-7 text-ivoryDim text-sm">Loading your profile...</p>;

  if (!userDoc.profileComplete) {
    return <VoiceIntake userName={userDoc.name} onConfirm={handleProfileConfirmed} />;
  }

  return (
    <div className="p-7 pb-24 animate-fade-in">
      <DashboardHeader
        title={userDoc.name}
        subtitle="Artisan Dashboard"
        tabs={[
          { key: "opportunities", label: "Opportunities" },
          { key: "requests", label: "Buyer Requests" }
        ]}
        activeTab={tab}
        onTabChange={k => {
          setTab(k);
          setView("list");
        }}
        onLogout={logout}
      />

      {tab === "opportunities" && view === "list" && (
        <OpportunitiesListInline profile={userDoc} rankedList={rankedList} onSelect={handleSelectOpportunity} />
      )}
      {tab === "opportunities" && view === "detail" && (
        <OpportunityDetail
          profile={userDoc}
          opp={selectedOpp}
          onBack={() => setView("list")}
          onFeedback={handleFeedback}
        />
      )}
      {tab === "requests" && <ArtisanRequests uid={firebaseUser.uid} />}

      <Toast message={toast.message} show={toast.show} />
    </div>
  );
}

// Thin wrapper so OpportunitiesList (which has its own header/back button)
// can be reused inline within the dashboard's tab body.
function OpportunitiesListInline({ profile, rankedList, onSelect }) {
  return (
    <div className="-mt-4">
      <p className="text-ivoryDim text-sm mb-3">
        Ranked by craft match, distance, capacity, and price fit.
      </p>
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
              <span className="text-[11px] text-ivoryDim bg-bg px-2.5 py-[3px] rounded-full border border-[#3a322c]">
                {opp.type}
              </span>
              <span className="text-[11px] text-ivoryDim bg-bg px-2.5 py-[3px] rounded-full border border-[#3a322c]">
                {opp.location}
              </span>
              <span className="text-[11px] text-ivoryDim bg-bg px-2.5 py-[3px] rounded-full border border-[#3a322c]">
                ₹{opp.priceRangeMin}–{opp.priceRangeMax}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
