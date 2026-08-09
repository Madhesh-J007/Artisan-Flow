import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase.js";

export default function RetailerSentRequests({ uid }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "requests"), where("retailerId", "==", uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      snap => {
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => {
        console.error("RetailerSentRequests listener failed:", err);
        setError(err.code === "failed-precondition"
          ? "Firestore needs a composite index for this query — check the browser console for a link to create it."
          : `Couldn't load sent requests (${err.code}).`);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  if (loading) return <p className="text-ivoryDim text-sm">Loading...</p>;

  if (error) {
    return (
      <div className="text-bad text-xs bg-bad/10 border border-bad/30 rounded-lg px-3 py-2">
        {error}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center mt-16">
        <p className="text-ivoryDim text-sm">
          No requests sent yet. Find an artisan and tap "Contact" to reach out.
        </p>
      </div>
    );
  }

  return (
    <div>
      {requests.map(req => (
        <div key={req.id} className="bg-raised rounded-[14px] p-4 px-[18px] mb-3 border border-[#3a322c]">
          <div className="flex justify-between items-start mb-1.5">
            <div className="text-[15px] font-semibold">{req.artisanName}</div>
            <StatusBadge status={req.status} />
          </div>
          <div className="text-sm text-ivoryDim">{req.requirementTitle}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Tag>{req.craft}</Tag>
            <Tag>{Math.round(req.matchScore * 100)}% fit</Tag>
          </div>
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
