import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import ArtisanDashboard from "./components/ArtisanDashboard.jsx";
import RetailerDashboard from "./components/RetailerDashboard.jsx";

function Router() {
  const { firebaseUser, userDoc, loading } = useAuth();

  let content;
  if (loading) {
    content = (
      <div className="p-7 pt-24 text-center text-ivoryDim text-sm">Loading...</div>
    );
  } else if (!firebaseUser || !userDoc) {
    content = <AuthScreen />;
  } else if (userDoc.role === "artisan") {
    content = <ArtisanDashboard />;
  } else {
    content = <RetailerDashboard />;
  }

  return (
    <div className="min-h-screen bg-bg text-ivory font-body md:bg-[radial-gradient(ellipse_at_top,#2c2521_0%,#171310_70%)]">
      <div className="md:flex md:items-center md:justify-center md:min-h-screen md:py-10 md:px-6 md:gap-14">
        <div className="hidden lg:block max-w-sm">
          <div className="text-[11px] tracking-[0.14em] uppercase text-brass font-semibold mb-3">
            Artisan Flow — Prototype
          </div>
          <h2 className="font-display text-3xl leading-tight mb-4">
            A two-sided marketplace: Tamil-voice artisans, real registered buyers
          </h2>
          <p className="text-ivoryDim text-sm leading-relaxed">
            Real accounts, real Firestore data. Artisans speak a profile and
            see ranked opportunities plus incoming buyer requests. Retailers
            post a requirement and get ranked, real registered artisans —
            same explainable engine, applied both ways.
          </p>
          <p className="text-[#5f564d] text-xs mt-8">
            Built for the National Startup Hackathon 2026
          </p>
        </div>

        <div className="w-full max-w-[420px] min-h-screen md:min-h-0 md:h-[840px] bg-bg border-x md:border border-[#3a322c] relative md:rounded-[36px] md:shadow-2xl md:shadow-black/60 overflow-hidden">
          <div className="h-full overflow-y-auto">{content}</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
