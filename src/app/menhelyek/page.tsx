import Link from "next/link";

const shelters = [
  { id: 1, name: "Happy Paws Rescue", country: "🇩🇪", city: "Berlin", rating: "4.9", dogs: 120, bg: "bg-green-100", emoji: "🏠" },
  { id: 2, name: "Magyar Állatvédők", country: "🇭🇺", city: "Budapest", rating: "4.8", dogs: 89, bg: "bg-red-50", emoji: "🐾" },
  { id: 3, name: "Paws of Spain", country: "🇪🇸", city: "Madrid", rating: "4.7", dogs: 156, bg: "bg-orange-50", emoji: "🏡" },
  { id: 4, name: "French Rescue", country: "🇫🇷", city: "Paris", rating: "4.6", dogs: 67, bg: "bg-blue-50", emoji: "🐕" },
  { id: 5, name: "Hund Hilfe", country: "🇩🇪", city: "München", rating: "4.9", dogs: 203, bg: "bg-yellow-50", emoji: "🦮" },
  { id: 6, name: "PL Animal Help", country: "🇵🇱", city: "Warszawa", rating: "4.5", dogs: 44, bg: "bg-teal-50", emoji: "🐶" },
];

export default function MenhelyekPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {/* Hero */}
      <section className="bg-[#1A3D2B] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#52B788] uppercase tracking-wider mb-3">Partner szervezetek</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Menhelyek és fajtamentők</h1>
          <p className="text-[#A7C4A3] text-lg max-w-2xl mx-auto">
            2 500+ partner menhely és fajtamentő szervezet Európa-szerte. Mindannyian egy célért dolgoznak: jobb életet adni a kutyáknak.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              href="/csatlakozas"
              className="inline-flex items-center gap-2 bg-white text-[#1A3D2B] hover:bg-[#E8F5E9] font-bold px-8 py-3.5 rounded-2xl transition-colors"
            >
              Partner regisztráció
            </Link>
            <button className="inline-flex items-center gap-2 border-2 border-white/40 text-white hover:bg-white/10 font-semibold px-8 py-3.5 rounded-2xl transition-colors">
              Keresés a listában
            </button>
          </div>
        </div>
      </section>

      {/* Search/filter bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-10">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Menhely neve..."
            className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D]"
          />
          <select className="border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
            <option value="">Összes ország</option>
            <option>🇭🇺 Magyarország</option>
            <option>🇩🇪 Németország</option>
            <option>🇪🇸 Spanyolország</option>
            <option>🇫🇷 Franciaország</option>
          </select>
          <select className="border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
            <option value="">Típus</option>
            <option>Menhely</option>
            <option>Fajtamentő</option>
          </select>
          <button className="bg-[#1B4D2F] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#1A3D2B] transition-colors shrink-0">
            Keresés
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Map placeholder */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] mb-10 h-72 flex flex-col items-center justify-center shadow-sm">
          <span className="text-6xl mb-4">🗺️</span>
          <p className="text-xl font-semibold text-[#4A5568]">Interaktív térkép hamarosan</p>
          <p className="text-sm text-[#4A5568] mt-2">Hamarosan megtekintheted a menhelyeket egy interaktív európai térképen.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            { value: "2 500+", label: "Partner menhely" },
            { value: "30+", label: "Ország" },
            { value: "15 000+", label: "Örökbefogadás" },
            { value: "4.8", label: "Átlag értékelés" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-[#E2E8F0]">
              <div className="text-2xl font-bold text-[#1A3D2B]">{stat.value}</div>
              <div className="text-sm text-[#4A5568] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Shelter grid */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1C1C1C]">Kiemelt partnerek</h2>
          <p className="text-sm text-[#4A5568]">6 menhely megjelenítve</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shelters.map((shelter) => (
            <div key={shelter.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0]">
              <div className={`h-36 ${shelter.bg} flex items-center justify-center text-6xl`}>
                {shelter.emoji}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-[#1C1C1C]">{shelter.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-amber-500">
                    <span>⭐</span>
                    <span className="font-semibold">{shelter.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-[#4A5568] mb-1">{shelter.country} {shelter.city}</p>
                <p className="text-sm text-[#3D7A3D] font-semibold mb-4">🐕 {shelter.dogs} kutya örökbefogadásra vár</p>
                <div className="flex gap-2">
                  <Link
                    href={`/menhelyek/${shelter.id}`}
                    className="flex-1 text-center bg-[#E8F5E9] hover:bg-[#1B4D2F] hover:text-white text-[#1A3D2B] font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    Profil megtekintése
                  </Link>
                  <button className="px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[#4A5568] hover:border-[#3D7A3D] transition-colors text-sm">
                    💬
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-[#E8F5E9] rounded-2xl p-8 text-center border border-[#3D7A3D]/20">
          <h3 className="text-xl font-bold text-[#1A3D2B] mb-2">Te is menhely vagy fajtamentő?</h3>
          <p className="text-[#4A5568] mb-6">Csatlakozz és add fel kutyáidat a platformra ingyen!</p>
          <Link
            href="/csatlakozas"
            className="inline-flex items-center gap-2 bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold px-8 py-3 rounded-2xl transition-colors"
          >
            Regisztráció →
          </Link>
        </div>
      </div>
    </div>
  );
}
