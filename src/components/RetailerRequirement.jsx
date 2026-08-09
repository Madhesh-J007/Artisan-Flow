import { useState } from "react";
import { Eyebrow, BtnPrimary, BackButton } from "./UI.jsx";

const CRAFTS = ["pottery", "weaving", "bamboo craft"];
const LOCATIONS = ["Chennai", "Madurai", "Coimbatore", "Thoothukudi", "Tirunelveli", "Bengaluru"];

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function RetailerRequirement({ onBack, onSubmit, hideHeader = false }) {
  const [form, setForm] = useState({
    title: "",
    craft: "pottery",
    location: "Chennai",
    quantityNeeded: 100,
    timelineWeeks: 6,
    priceRangeMin: 150,
    priceRangeMax: 300,
    buyerType: "D2C brand"
  });

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    const productKeywordsByCraft = {
      pottery: ["terracotta", "pottery", "decor"],
      weaving: ["handloom", "cotton", "textile"],
      "bamboo craft": ["bamboo", "cane", "basket"]
    };

    const requirement = {
      id: "req_custom",
      type: "Custom Requirement",
      title: form.title || `Sourcing ${form.craft} — ${form.quantityNeeded} units`,
      craft: form.craft,
      productKeywords: productKeywordsByCraft[form.craft],
      location: form.location,
      quantityNeeded: Number(form.quantityNeeded),
      timelineWeeks: Number(form.timelineWeeks),
      priceRangeMin: Number(form.priceRangeMin),
      priceRangeMax: Number(form.priceRangeMax),
      buyerRequirements: ["quality consistency", "sample approval"],
      buyerType: form.buyerType
    };

    onSubmit(requirement);
  }

  return (
    <div className={hideHeader ? "" : "p-7 pb-24 animate-fade-in"}>
      {!hideHeader && (
        <div className="flex items-center gap-2.5 mb-4">
          <BackButton onClick={onBack} />
          <Eyebrow>Post a requirement</Eyebrow>
        </div>
      )}
      <h2 className="font-display text-2xl mb-2">What are you sourcing?</h2>
      <p className="text-ivoryDim mb-5">
        Fill this in once — we'll match and rank artisans against it instantly.
      </p>

      <div className="space-y-4">
        <Field label="Requirement title (optional)">
          <input
            type="text"
            placeholder="e.g. Bulk terracotta decor for Q4 launch"
            value={form.title}
            onChange={e => update("title", e.target.value)}
            className="w-full bg-raised border border-[#4a413a] rounded-xl px-4 py-3 text-sm text-ivory placeholder:text-ivoryDim/50 outline-none focus:border-brass"
          />
        </Field>

        <Field label="Craft category">
          <Select value={form.craft} onChange={v => update("craft", v)} options={CRAFTS.map(c => ({ value: c, label: cap(c) }))} />
        </Field>

        <Field label="Your location">
          <Select value={form.location} onChange={v => update("location", v)} options={LOCATIONS.map(l => ({ value: l, label: l }))} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity needed">
            <input
              type="number"
              value={form.quantityNeeded}
              onChange={e => update("quantityNeeded", e.target.value)}
              className="w-full bg-raised border border-[#4a413a] rounded-xl px-4 py-3 text-sm text-ivory outline-none focus:border-brass"
            />
          </Field>
          <Field label="Timeline (weeks)">
            <input
              type="number"
              value={form.timelineWeeks}
              onChange={e => update("timelineWeeks", e.target.value)}
              className="w-full bg-raised border border-[#4a413a] rounded-xl px-4 py-3 text-sm text-ivory outline-none focus:border-brass"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price min (₹/unit)">
            <input
              type="number"
              value={form.priceRangeMin}
              onChange={e => update("priceRangeMin", e.target.value)}
              className="w-full bg-raised border border-[#4a413a] rounded-xl px-4 py-3 text-sm text-ivory outline-none focus:border-brass"
            />
          </Field>
          <Field label="Price max (₹/unit)">
            <input
              type="number"
              value={form.priceRangeMax}
              onChange={e => update("priceRangeMax", e.target.value)}
              className="w-full bg-raised border border-[#4a413a] rounded-xl px-4 py-3 text-sm text-ivory outline-none focus:border-brass"
            />
          </Field>
        </div>

        <Field label="Buyer type">
          <Select
            value={form.buyerType}
            onChange={v => update("buyerType", v)}
            options={["D2C brand", "Export house", "Government", "Trade association"].map(b => ({ value: b, label: b }))}
          />
        </Field>
      </div>

      <BtnPrimary onClick={handleSubmit} className="mt-6">
        Find matched artisans →
      </BtnPrimary>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs text-ivoryDim mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-raised border border-[#4a413a] rounded-xl px-4 py-3 text-sm text-ivory outline-none focus:border-brass appearance-none"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
