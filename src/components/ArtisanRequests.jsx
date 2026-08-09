import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "../firebase.js";
import { Eyebrow } from "./UI.jsx";

export default function ArtisanRequests({ uid }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "requests"), where("artisanId", "==", uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      snap => {
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => {
        console.error("ArtisanRequests listener failed:", err);
        setError(err.code === "failed-precondition"
          ? "Firestore needs a composite index for this query — check the browser console for a link to create it."
          : `Couldn't load requests (${err.code}).`);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  async function respond(requestId, status) {
    await updateDoc(doc(db, "requests", requestId), { status });
  }

  if (loading) {
    return <p className="text-ivoryDim text-sm">Loading requests...</p>;
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center mt-16">
        <p className="text-ivoryDim text-sm">
          No requests yet. When a retailer contacts you, it'll show up here in real time.
        </p>
      </div>
    );
  }

  return (
    <div>
      {requests.map(req => (
        <div key={req.id} className="bg-raised rounded-[14px] p-4 px-[18px] mb-3 border border-[#3a322c]">
          <div className="flex justify-between items-start mb-1.5">
            <div className="text-[15px] font-semibold">{req.retailerName}</div>
            <StatusBadge status={req.status} />
          </div>
          <div className="text-xs text-ivoryDim mb-2">{req.buyerType}</div>
          <div className="text-sm mb-1">{req.requirementTitle}</div>
          <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
            <Tag>{req.craft}</Tag>
            <Tag>{req.location}</Tag>
            <Tag>₹{req.priceRangeMin}–{req.priceRangeMax}</Tag>
            <Tag>{req.quantityNeeded} units</Tag>
            <Tag>{Math.round(req.matchScore * 100)}% fit</Tag>
          </div>

          {req.status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => respond(req.id, "accepted")}
                className="flex-1 py-2.5 rounded-full border border-good text-good text-xs font-semibold"
              >
                Accept
              </button>
              <button
                onClick={() => respond(req.id, "declined")}
                className="flex-1 py-2.5 rounded-full border border-[#4a413a] text-ivoryDim text-xs font-semibold"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-brass/20 text-brass border-brass/40",
    accepted: "bg-good/20 text-good border-good/40",
    declined: "bg-[#4a413a] text-ivoryDim border-[#4a413a]"
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

function Tag({ children }) {
  return (
    <span className="text-[11px] text-ivoryDim bg-bg px-2.5 py-[3px] rounded-full border border-[#3a322c]">
      {children}
    </span>
  );
}
