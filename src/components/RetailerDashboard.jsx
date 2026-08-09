import { useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.js";
import { DEFAULT_WEIGHTS, rankArtisansForRequirement } from "../engine/scoringEngine.js";
import { useAuth } from "../context/AuthContext.jsx";
import { DashboardHeader, Toast } from "./UI.jsx";
import RetailerRequirement from "./RetailerRequirement.jsx";
import RetailerMatches from "./RetailerMatches.jsx";
import RetailerArtisanDetail from "./RetailerArtisanDetail.jsx";
import RetailerSentRequests from "./RetailerSentRequests.jsx";

export default function RetailerDashboard() {
  const { firebaseUser, userDoc, logout } = useAuth();
  const [tab, setTab] = useState("find"); // 'find' | 'sent'
  const [view, setView] = useState("form"); // 'form' | 'matches' | 'detail'
  const [requirement, setRequirement] = useState(null);
  const [rankedArtisans, setRankedArtisans] = useState([]);
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [loadingArtisans, setLoadingArtisans] = useState(false);
  const [toast, setToast] = useState({ message: "", show: false });

  function showToast(message) {
    setToast({ message, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2200);
  }

  async function handleRequirementSubmit(req) {
    setRequirement(req);
    setLoadingArtisans(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "artisan"), where("profileComplete", "==", true));
      const snap = await getDocs(q);
      const artisans = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (artisans.length === 0) {
        showToast("No registered artisans yet — ask one to sign up and complete their profile.");
        setLoadingArtisans(false);
        return;
      }

      const ranked = rankArtisansForRequirement(req, artisans, DEFAULT_WEIGHTS);
      setRankedArtisans(ranked);
      setView("matches");
    } catch (err) {
      showToast("Couldn't load artisans. Check your Firebase setup.");
    } finally {
      setLoadingArtisans(false);
    }
  }

  function handleSelectArtisan(artisan) {
    setSelectedArtisan(artisan);
    setView("detail");
  }

  async function handleContactSent() {
    const artisan = selectedArtisan;
    try {
      await addDoc(collection(db, "requests"), {
        retailerId: firebaseUser.uid,
        retailerName: userDoc.name,
        buyerType: requirement.buyerType,
        artisanId: artisan.id,
        artisanName: artisan.name,
        requirementTitle: requirement.title,
        craft: requirement.craft,
        location: requirement.location,
        quantityNeeded: requirement.quantityNeeded,
        priceRangeMin: requirement.priceRangeMin,
        priceRangeMax: requirement.priceRangeMax,
        matchScore: artisan.score,
        status: "pending",
        createdAt: serverTimestamp()
      });
      showToast(`Request sent to ${artisan.name}.`);
      // Deliberately not navigating away here — RetailerArtisanDetail shows its
      // own "Request sent ✓" confirmation first; the user backs out manually.
    } catch (err) {
      // Re-throw so RetailerArtisanDetail's catch block shows a real inline
      // error instead of a false "sent" state. This was the original bug:
      // success was previously assumed regardless of whether this write worked.
      throw new Error(err?.message || "Failed to send request. Please try again.");
    }
  }

  return (
    <div className="p-7 pb-24 animate-fade-in">
      <DashboardHeader
        title={userDoc?.name || "Retailer"}
        subtitle="Retailer Dashboard"
        tabs={[
          { key: "find", label: "Find Artisans" },
          { key: "sent", label: "Sent Requests" }
        ]}
        activeTab={tab}
        onTabChange={k => {
          setTab(k);
          if (k === "find") setView(requirement ? "matches" : "form");
        }}
        onLogout={logout}
      />

      {tab === "find" && view === "form" && (
        <RetailerRequirementInline onSubmit={handleRequirementSubmit} loading={loadingArtisans} />
      )}
      {tab === "find" && view === "matches" && (
        <RetailerMatchesInline
          requirement={requirement}
          rankedArtisans={rankedArtisans}
          onBack={() => setView("form")}
          onSelect={handleSelectArtisan}
        />
      )}
      {tab === "find" && view === "detail" && (
        <RetailerArtisanDetail
          requirement={requirement}
          artisan={selectedArtisan}
          onBack={() => setView("matches")}
          onContactSent={handleContactSent}
        />
      )}
      {tab === "sent" && <RetailerSentRequests uid={firebaseUser.uid} />}

      <Toast message={toast.message} show={toast.show} />
    </div>
  );
}

// Inline variants without their own back-button headers, since the dashboard
// tab bar already provides navigation context.
function RetailerRequirementInline({ onSubmit, loading }) {
  return (
    <div className="-mt-2">
      <RetailerRequirement onBack={() => {}} onSubmit={onSubmit} hideHeader />
      {loading && <p className="text-ivoryDim text-xs mt-3 text-center">Finding matched artisans...</p>}
    </div>
  );
}

function RetailerMatchesInline({ requirement, rankedArtisans, onBack, onSelect }) {
  return (
    <div className="-mt-2">
      <button onClick={onBack} className="text-xs text-ivoryDim mb-3 underline">
        ← Edit requirement
      </button>
      <RetailerMatches
        requirement={requirement}
        rankedArtisans={rankedArtisans}
        onBack={onBack}
        onSelect={onSelect}
        hideHeader
      />
    </div>
  );
}
