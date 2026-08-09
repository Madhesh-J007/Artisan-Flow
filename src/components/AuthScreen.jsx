import { useState } from "react";
import { Eyebrow, BtnPrimary, BtnGhost } from "./UI.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("register"); // 'register' | 'login'
  const [role, setRole] = useState("artisan"); // 'artisan' | 'retailer'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        if (!name.trim()) throw new Error("Please enter your name.");
        await register(email.trim(), password, role, name.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDemoLogin(demoEmail, demoPassword) {
    setError("");
    setBusy(true);
    try {
      await login(demoEmail, demoPassword);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-7 pt-14 pb-24 animate-fade-in">
      <div className="text-center mb-6">
        <Eyebrow>Artisan Flow</Eyebrow>
        <h1 className="font-display text-[28px] leading-tight">
          {mode === "register" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-ivoryDim mt-2 text-sm">
          {mode === "register"
            ? "Register once — buyers and artisans connect through the same platform."
            : "Log in to see your matches and requests."}
        </p>
      </div>

      <div className="bg-brass/10 border border-brass/30 rounded-xl px-4 py-3.5 mb-6">
        <div className="text-[11px] tracking-[0.1em] uppercase text-brass font-semibold mb-2.5">
          Reviewing this project?
        </div>
        <p className="text-xs text-ivoryDim mb-3">
          Skip registration and log straight into a populated demo account with existing
          profiles, matches, and requests already in place.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleDemoLogin("meenakshi.artisan@test.com", "artisan123")}
            className="flex-1 py-2.5 rounded-lg bg-clay/20 border border-clay/50 text-ivory text-xs font-semibold disabled:opacity-50"
          >
            View as Artisan
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleDemoLogin("aravind.retailer@test.com", "retailer123")}
            className="flex-1 py-2.5 rounded-lg bg-indigo/30 border border-indigo/60 text-ivory text-xs font-semibold disabled:opacity-50"
          >
            View as Retailer
          </button>
        </div>
      </div>

      {mode === "register" && (
        <div className="flex gap-2 mb-5">
          <RoleTab active={role === "artisan"} onClick={() => setRole("artisan")} label="I'm an Artisan" />
          <RoleTab active={role === "retailer"} onClick={() => setRole("retailer")} label="I'm a Retailer" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === "register" && (
          <Input
            label="Your name"
            value={name}
            onChange={setName}
            placeholder={role === "artisan" ? "e.g. Meenakshi" : "e.g. Aravind (Coastal Décor Co.)"}
          />
        )}
        <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />

        {error && <div className="text-bad text-xs bg-bad/10 border border-bad/30 rounded-lg px-3 py-2">{error}</div>}

        <BtnPrimary className="mt-1" disabled={busy}>
          {busy ? "Please wait..." : mode === "register" ? "Create account →" : "Log in →"}
        </BtnPrimary>
      </form>

      <BtnGhost
        className="mt-3"
        onClick={() => {
          setMode(mode === "register" ? "login" : "register");
          setError("");
        }}
      >
        {mode === "register" ? "Already have an account? Log in" : "New here? Create an account"}
      </BtnGhost>
    </div>
  );
}

function RoleTab({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition ${
        active ? "bg-clay/20 border-clay text-ivory" : "bg-raised border-[#4a413a] text-ivoryDim"
      }`}
    >
      {label}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <div className="text-xs text-ivoryDim mb-1.5">{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-raised border border-[#4a413a] rounded-xl px-4 py-3 text-sm text-ivory placeholder:text-ivoryDim/50 outline-none focus:border-brass"
      />
    </div>
  );
}

function friendlyError(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "That email is already registered — try logging in instead.";
  if (code.includes("invalid-credential") || code.includes("wrong-password")) return "Incorrect email or password.";
  if (code.includes("user-not-found")) return "No account found with that email.";
  if (code.includes("weak-password")) return "Password should be at least 6 characters.";
  if (code.includes("invalid-email")) return "Please enter a valid email address.";
  return err?.message || "Something went wrong. Please try again.";
}
