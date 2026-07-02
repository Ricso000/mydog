"use client";

import { useState } from "react";

const partnerTypes = [
  { id: "menhely", icon: "🏠", label: "Menhely", desc: "Állami vagy magán menhely" },
  { id: "fajtamento", icon: "🐾", label: "Fajtamentő", desc: "Fajta-specifikus mentőszervezet" },
  { id: "allatorvos", icon: "💉", label: "Állatorvos", desc: "Állatorvosi rendelő vagy klinika" },
  { id: "kutyaiskola", icon: "🎓", label: "Kutyaiskola", desc: "Képzés és tréning" },
  { id: "kutyapanzio", icon: "🏨", label: "Kutyapanzió", desc: "Szállás és gondozás" },
  { id: "setalyato", icon: "🦮", label: "Sétáltató", desc: "Kutyasétáltatás szolgáltatás" },
  { id: "szallito", icon: "🚐", label: "Szállító", desc: "Kutya szállítás" },
  { id: "onkentes", icon: "❤️", label: "Önkéntes", desc: "Egyéni önkéntes" },
  { id: "tamogato", icon: "🎁", label: "Támogató cég", desc: "Vállalati támogató" },
];

const benefits = [
  { icon: "🌍", label: "Európai láthatóság", desc: "30+ ország közönségének mutatkozz be." },
  { icon: "🐕", label: "Ingyenes kutyafeltöltés", desc: "Adj fel örökbefogadható kutyákat." },
  { icon: "📊", label: "Statisztikák", desc: "Részletes betekintés és analitika." },
  { icon: "🤝", label: "Közösség", desc: "Kapcsolódj más szervezetekhez." },
];

export default function CsatlakozasPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {/* Hero */}
      <section className="bg-[#1A3D2B] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#52B788] uppercase tracking-wider mb-3">Csatlakozás</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Csatlakozz partnerként</h1>
          <p className="text-[#A7C4A3] text-lg max-w-2xl mx-auto">
            Regisztrálj a MyDog platformra és segíts kutyák életét jobbá tenni.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Partner type selector */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-[#1C1C1C] mb-2 text-center">Válaszd ki a partnertípusodat</h2>
          <p className="text-sm text-[#4A5568] text-center mb-6">Kattints a számodra megfelelő kategóriára</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {partnerTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelected(type.id)}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all text-left ${
                  selected === type.id
                    ? "border-[#1A3D2B] bg-[#E8F5E9]"
                    : "border-[#E2E8F0] bg-white hover:border-[#3D7A3D] hover:bg-[#F7F8F5]"
                }`}
              >
                <span className="text-3xl">{type.icon}</span>
                <div>
                  <p className="font-bold text-[#1C1C1C] text-sm">{type.label}</p>
                  <p className="text-xs text-[#4A5568]">{type.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Registration form */}
        <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-sm mb-10">
          <h2 className="text-xl font-bold text-[#1C1C1C] mb-6">Regisztrációs adatok</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Szervezet neve / Teljes név *</label>
              <input
                type="text"
                placeholder="Pl. Happy Paws Rescue"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Email cím *</label>
              <input
                type="email"
                placeholder="info@menhely.hu"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Telefon</label>
              <input
                type="tel"
                placeholder="+36 20 123 4567"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Ország *</label>
              <select className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
                <option value="">Válassz országot</option>
                <option>🇭🇺 Magyarország</option>
                <option>🇩🇪 Németország</option>
                <option>🇦🇹 Ausztria</option>
                <option>🇸🇰 Szlovákia</option>
                <option>🇨🇿 Csehország</option>
                <option>🇵🇱 Lengyelország</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Város</label>
              <input
                type="text"
                placeholder="Budapest"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Weboldal</label>
              <input
                type="url"
                placeholder="https://www.menhely.hu"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D]"
              />
            </div>
          </div>
          <div className="mt-5">
            <label className="block text-sm font-semibold text-[#4A5568] mb-2">Rövid bemutatkozás</label>
            <textarea
              placeholder="Mutasd be szervezetedet, tevékenységedet..."
              rows={4}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] resize-none"
            />
          </div>
          <div className="mt-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-[#3D7A3D]" />
              <span className="text-sm text-[#4A5568]">
                Elfogadom a MyDog <a href="#" className="text-[#1A3D2B] underline">Általános Szerződési Feltételeit</a> és <a href="#" className="text-[#1A3D2B] underline">Adatvédelmi Szabályzatát</a>.
              </span>
            </label>
          </div>
          <button
            type="submit"
            className="mt-6 w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-4 rounded-2xl transition-colors text-base"
          >
            Regisztráció küldése →
          </button>
        </div>

        {/* Benefits */}
        <div>
          <h2 className="text-xl font-bold text-[#1C1C1C] mb-6 text-center">Miért érdemes csatlakozni?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b) => (
              <div key={b.label} className="bg-white rounded-2xl p-5 border border-[#E2E8F0] text-center shadow-sm">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-bold text-[#1C1C1C] text-sm mb-1">{b.label}</h3>
                <p className="text-xs text-[#4A5568]">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
