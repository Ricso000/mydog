"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const countryOptions = [
  { value: "HU", label: "🇭🇺 Magyarország" },
  { value: "DE", label: "🇩🇪 Németország" },
  { value: "ES", label: "🇪🇸 Spanyolország" },
  { value: "FR", label: "🇫🇷 Franciaország" },
  { value: "IT", label: "🇮🇹 Olaszország" },
  { value: "NL", label: "🇳🇱 Hollandia" },
  { value: "PL", label: "🇵🇱 Lengyelország" },
  { value: "AT", label: "🇦🇹 Ausztria" },
  { value: "CZ", label: "🇨🇿 Csehország" },
  { value: "RO", label: "🇷🇴 Románia" },
];

const selectClass =
  "w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white";

export function KutyakFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [country, setCountry] = useState(sp.get("country") ?? "");
  const [size, setSize] = useState(sp.get("size") ?? "");
  const [gender, setGender] = useState(sp.get("gender") ?? "");
  const [age, setAge] = useState(sp.get("age") ?? "");
  const [transportable, setTransportable] = useState(sp.get("transportable") === "1");
  const [sort, setSort] = useState(sp.get("sort") ?? "newest");

  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (country) params.set("country", country);
    if (size) params.set("size", size);
    if (gender) params.set("gender", gender);
    if (age) params.set("age", age);
    if (transportable) params.set("transportable", "1");
    if (sort && sort !== "newest") params.set("sort", sort);
    router.push(`/kutyak?${params.toString()}`);
  }

  function reset() {
    setQ("");
    setCountry("");
    setSize("");
    setGender("");
    setAge("");
    setTransportable(false);
    setSort("newest");
    router.push("/kutyak");
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 sticky top-24">
      <h2 className="text-lg font-bold text-[#1C1C1C] mb-6">Szűrők</h2>
      <div className="space-y-5">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-[#4A5568] mb-2">Keresés</label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kutya neve, fajta..."
            onKeyDown={(e) => e.key === "Enter" && apply()}
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-[#4A5568] mb-2">Ország</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass}>
            <option value="">Összes ország</option>
            {countryOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-semibold text-[#4A5568] mb-2">Méret</label>
          <select value={size} onChange={(e) => setSize(e.target.value)} className={selectClass}>
            <option value="">Összes méret</option>
            <option value="small">Kis (0–10 kg)</option>
            <option value="medium">Közepes (10–25 kg)</option>
            <option value="large">Nagy (25+ kg)</option>
            <option value="xlarge">Óriás</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-semibold text-[#4A5568] mb-2">Ivar</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer">
              <input
                type="radio"
                name="gender"
                value=""
                checked={gender === ""}
                onChange={() => setGender("")}
                className="accent-[#3D7A3D]"
              />{" "}
              Mindkét
            </label>
            <label className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === "female"}
                onChange={() => setGender("female")}
                className="accent-[#3D7A3D]"
              />{" "}
              Szuka
            </label>
            <label className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === "male"}
                onChange={() => setGender("male")}
                className="accent-[#3D7A3D]"
              />{" "}
              Kan
            </label>
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-semibold text-[#4A5568] mb-2">Kor</label>
          <select value={age} onChange={(e) => setAge(e.target.value)} className={selectClass}>
            <option value="">Összes kor</option>
            <option value="puppy">Kölyök (0–1 év)</option>
            <option value="young">Fiatal (1–3 év)</option>
            <option value="adult">Felnőtt (3–7 év)</option>
            <option value="senior">Idős (7+ év)</option>
          </select>
        </div>

        {/* Transportable */}
        <div>
          <label className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer">
            <input
              type="checkbox"
              checked={transportable}
              onChange={(e) => setTransportable(e.target.checked)}
              className="accent-[#3D7A3D] w-4 h-4"
            />
            Csak szállítható kutyák
          </label>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-semibold text-[#4A5568] mb-2">Sorrend</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass}>
            <option value="newest">Legfrissebb</option>
            <option value="youngest">Kor szerint (fiatal)</option>
            <option value="oldest">Kor szerint (idős)</option>
          </select>
        </div>

        <button
          onClick={apply}
          className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Szűrés
        </button>
        <button
          onClick={reset}
          className="w-full text-sm text-[#4A5568] hover:text-[#1A3D2B] underline"
        >
          Szűrők törlése
        </button>
      </div>
    </div>
  );
}
