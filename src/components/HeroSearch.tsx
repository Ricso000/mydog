"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const tabs = [
  { label: "Kutyák keresése", icon: "🐾", href: null },
  { label: "Menhelyek",       icon: "🏠", href: "/menhelyek" },
  { label: "Fajtamentők",     icon: "🐕", href: "/fajtamentok" },
  { label: "Állatorvosok",    icon: "💉", href: "/szolgaltatasok" },
  { label: "Kutyabarát",      icon: "📍", href: "/szolgaltatasok" },
];

const countryOptions = [
  { value: "",   label: "Összes ország" },
  { value: "HU", label: "Magyarország" },
  { value: "DE", label: "Németország" },
  { value: "AT", label: "Ausztria" },
  { value: "RO", label: "Románia" },
  { value: "ES", label: "Spanyolország" },
];

const breedOptions = [
  { value: "",                 label: "Összes fajta" },
  { value: "Keverék",          label: "Keverék" },
  { value: "Labrador",         label: "Labrador" },
  { value: "Border Collie",    label: "Border Collie" },
  { value: "Golden Retriever", label: "Golden Retriever" },
];

const ageOptions = [
  { value: "",       label: "Bármennyi" },
  { value: "puppy",  label: "Kölyök (0–1 év)" },
  { value: "young",  label: "Fiatal (1–3 év)" },
  { value: "adult",  label: "Felnőtt (3–7 év)" },
  { value: "senior", label: "Idős (7+ év)" },
];

const sizeOptions = [
  { value: "",       label: "Bármennyi" },
  { value: "small",  label: "Kis (–10 kg)" },
  { value: "medium", label: "Közepes (10–25 kg)" },
  { value: "large",  label: "Nagy (25+ kg)" },
];

function Chevron({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Csak szállítható kutyák"
      onClick={() => onChange(!on)}
      className="relative w-11 h-6 shrink-0 cursor-pointer"
    >
      <div className={`w-11 h-6 rounded-full transition-colors ${on ? "bg-[#1A3D2B]" : "bg-[#D1D5DB]"}`}></div>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"} left-0`}></div>
    </button>
  );
}

export function HeroSearch() {
  const router = useRouter();
  const [country, setCountry] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [size, setSize] = useState("");
  const [transportable, setTransportable] = useState(false);

  function search() {
    const params = new URLSearchParams();
    if (breed) params.set("q", breed);
    if (country) params.set("country", country);
    if (age) params.set("age", age);
    if (size) params.set("size", size);
    if (transportable) params.set("transportable", "1");
    const qs = params.toString();
    router.push(qs ? `/kutyak?${qs}` : "/kutyak");
  }

  const filterDefs = [
    { label: "Ország", value: country, set: setCountry, options: countryOptions },
    { label: "Fajta",  value: breed,   set: setBreed,   options: breedOptions },
    { label: "Kor",    value: age,     set: setAge,     options: ageOptions },
    { label: "Méret",  value: size,    set: setSize,    options: sizeOptions },
  ];

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden">

      {/* Tabs: text on desktop, icons-only on mobile */}
      <div className="flex items-stretch border-b border-[#F3F4F6] overflow-x-auto">
        {tabs.map((tab) =>
          tab.href === null ? (
            <button
              key={tab.label}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors flex-1 sm:flex-none bg-[#1A3D2B] text-white"
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ) : (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors flex-1 sm:flex-none text-[#6B7280] hover:text-[#1A3D2B] hover:bg-[#F9FAFB]"
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          )
        )}
      </div>

      <div className="p-4 sm:p-5">
        {/* Mobile: stacked filters */}
        <div className="flex flex-col sm:hidden gap-3">
          {filterDefs.map(({ label, value, set, options }) => (
            <div key={label} className="relative">
              <label className="absolute left-3 top-2 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide pointer-events-none">{label}</label>
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full appearance-none bg-white border border-[#E5E7EB] rounded-xl px-3 pt-6 pb-2.5 text-[14px] text-[#111827] font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
              >
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Chevron className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
            </div>
          ))}

          {/* Szállítható toggle */}
          <div className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-xl px-4 py-3.5">
            <div>
              <div className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Szállítható</div>
              <div className="text-[14px] text-[#111827] font-medium mt-0.5">Csak szállíthatók</div>
            </div>
            <Toggle on={transportable} onChange={setTransportable} />
          </div>

          {/* Full-width search button on mobile */}
          <button
            onClick={search}
            className="flex items-center justify-center gap-2 text-white font-semibold py-4 rounded-2xl text-[15px] shadow-sm w-full active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#1A3D2B" }}
          >
            <SearchIcon className="w-5 h-5" />
            Keresés
          </button>
        </div>

        {/* Desktop: side-by-side filters */}
        <div className="hidden sm:flex flex-wrap lg:flex-nowrap items-end gap-3">
          {filterDefs.map(({ label, value, set, options }) => (
            <div key={label} className="flex-1 min-w-[120px]">
              <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">{label}</label>
              <div className="relative">
                <select
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full appearance-none bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[13px] text-[#374151] font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]"
                >
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Chevron className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
              </div>
            </div>
          ))}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">Szállítható</label>
            <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2.5 h-[42px]">
              <span className="text-[13px] text-[#374151] font-medium flex-1">Csak szállíthatók</span>
              <Toggle on={transportable} onChange={setTransportable} />
            </div>
          </div>
          <button
            onClick={search}
            className="flex items-center gap-2 text-white font-semibold px-7 py-2.5 rounded-xl text-[14px] shrink-0 shadow-sm hover:opacity-95 transition-opacity"
            style={{ backgroundColor: "#1A3D2B", minHeight: "42px" }}
          >
            <SearchIcon className="w-4 h-4" />
            Keresés
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-[#6B7280]">
          <span>🐾</span>
          <span>Több mint <strong className="text-[#1A3D2B] font-bold">18 450</strong> kutya <strong className="text-[#1A3D2B] font-bold">32</strong> országban</span>
        </div>
      </div>
    </div>
  );
}
