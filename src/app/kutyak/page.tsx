import Link from "next/link";

const allDogs = [
  { id: 1, name: "Luna", age: "2 éves", gender: "Szuka", breed: "Keverék", country: "🇩🇪", countryName: "Németország", bg: "bg-amber-100", emoji: "🐕", size: "Közepes" },
  { id: 2, name: "Max", age: "4 éves", gender: "Kan", breed: "Labrador keverék", country: "🇭🇺", countryName: "Magyarország", bg: "bg-orange-100", emoji: "🦮", size: "Nagy" },
  { id: 3, name: "Bella", age: "1.5 éves", gender: "Szuka", breed: "Border Collie", country: "🇪🇸", countryName: "Spanyolország", bg: "bg-yellow-100", emoji: "🐕‍🦺", size: "Közepes" },
  { id: 4, name: "Rocky", age: "3 éves", gender: "Kan", breed: "Staffi keverék", country: "🇫🇷", countryName: "Franciaország", bg: "bg-stone-100", emoji: "🐶", size: "Közepes" },
  { id: 5, name: "Molly", age: "5 éves", gender: "Szuka", breed: "Beagle", country: "🇮🇹", countryName: "Olaszország", bg: "bg-amber-50", emoji: "🐕", size: "Kis" },
  { id: 6, name: "Charlie", age: "2 éves", gender: "Kan", breed: "Golden Retriever", country: "🇳🇱", countryName: "Hollandia", bg: "bg-yellow-50", emoji: "🦮", size: "Nagy" },
  { id: 7, name: "Daisy", age: "1 éves", gender: "Szuka", breed: "Keverék", country: "🇵🇱", countryName: "Lengyelország", bg: "bg-lime-50", emoji: "🐕", size: "Kis" },
  { id: 8, name: "Jack", age: "6 éves", gender: "Kan", breed: "Német juhász", country: "🇦🇹", countryName: "Ausztria", bg: "bg-orange-50", emoji: "🐕‍🦺", size: "Nagy" },
  { id: 9, name: "Nina", age: "3 éves", gender: "Szuka", breed: "Husky keverék", country: "🇩🇪", countryName: "Németország", bg: "bg-slate-100", emoji: "🐶", size: "Közepes" },
  { id: 10, name: "Bruno", age: "7 éves", gender: "Kan", breed: "Rottweiler keverék", country: "🇭🇺", countryName: "Magyarország", bg: "bg-amber-200", emoji: "🐕", size: "Nagy" },
  { id: 11, name: "Coco", age: "2 éves", gender: "Szuka", breed: "Poodle keverék", country: "🇫🇷", countryName: "Franciaország", bg: "bg-pink-50", emoji: "🐩", size: "Kis" },
  { id: 12, name: "Rex", age: "4 éves", gender: "Kan", breed: "Malinois keverék", country: "🇨🇿", countryName: "Csehország", bg: "bg-teal-50", emoji: "🐕‍🦺", size: "Nagy" },
];

export default function KutyakPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#1C1C1C] mb-6">Szűrők</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Keresés</label>
                  <input
                    type="text"
                    placeholder="Kutya neve, fajta..."
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Ország</label>
                  <select className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
                    <option value="">Összes ország</option>
                    <option value="hu">🇭🇺 Magyarország</option>
                    <option value="de">🇩🇪 Németország</option>
                    <option value="es">🇪🇸 Spanyolország</option>
                    <option value="fr">🇫🇷 Franciaország</option>
                    <option value="it">🇮🇹 Olaszország</option>
                    <option value="nl">🇳🇱 Hollandia</option>
                    <option value="pl">🇵🇱 Lengyelország</option>
                    <option value="at">🇦🇹 Ausztria</option>
                    <option value="cz">🇨🇿 Csehország</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Fajta</label>
                  <select className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
                    <option value="">Összes fajta</option>
                    <option>Keverék</option>
                    <option>Labrador</option>
                    <option>Border Collie</option>
                    <option>Golden Retriever</option>
                    <option>Német juhász</option>
                    <option>Husky</option>
                    <option>Beagle</option>
                    <option>Poodle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Kor</label>
                  <select className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
                    <option value="">Összes kor</option>
                    <option value="puppy">Kölyök (0-1 év)</option>
                    <option value="young">Fiatal (1-3 év)</option>
                    <option value="adult">Felnőtt (3-7 év)</option>
                    <option value="senior">Idős (7+ év)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Méret</label>
                  <select className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
                    <option value="">Összes méret</option>
                    <option value="small">Kis (0-10 kg)</option>
                    <option value="medium">Közepes (10-25 kg)</option>
                    <option value="large">Nagy (25+ kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Ivar</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer">
                      <input type="checkbox" className="rounded accent-[#3D7A3D]" /> Szuka
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer">
                      <input type="checkbox" className="rounded accent-[#3D7A3D]" /> Kan
                    </label>
                  </div>
                </div>

                <button className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors">
                  Szűrés
                </button>

                <button className="w-full text-sm text-[#4A5568] hover:text-[#1A3D2B] underline">
                  Szűrők törlése
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1C1C1C]">Kutyák keresése</h1>
                <p className="text-sm text-[#4A5568] mt-1">Találatok: <strong>1 287 kutya</strong></p>
              </div>
              <select className="border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#4A5568] bg-white focus:outline-none focus:ring-2 focus:ring-[#3D7A3D]">
                <option>Legfrissebb</option>
                <option>Kor szerint (fiatal)</option>
                <option>Kor szerint (idős)</option>
              </select>
            </div>

            {/* Dog grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {allDogs.map((dog) => (
                <div key={dog.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0]">
                  <div className={`h-48 ${dog.bg} flex items-center justify-center text-7xl`}>
                    {dog.emoji}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-base font-bold text-[#1C1C1C]">{dog.name}</h3>
                        <p className="text-xs text-[#4A5568]">{dog.age} · {dog.gender} · {dog.size}</p>
                      </div>
                      <button className="p-1.5 text-[#4A5568] hover:text-red-500 transition-colors" aria-label="Kedvencekhez">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-[#4A5568] mb-1">{dog.breed}</p>
                    <p className="text-xs text-[#4A5568] mb-3">{dog.country} {dog.countryName}</p>
                    <Link
                      href={`/kutyak/${dog.id}`}
                      className="block w-full text-center bg-[#E8F5E9] hover:bg-[#1B4D2F] hover:text-white text-[#1A3D2B] font-semibold py-2 rounded-xl transition-colors text-sm"
                    >
                      Megnézem
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-10">
              <button className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-[#E8F5E9] transition-colors flex items-center justify-center text-sm font-medium">
                ←
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                    p === 1
                      ? "bg-[#1B4D2F] text-white"
                      : "border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-[#E8F5E9]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <span className="text-[#4A5568] px-2">...</span>
              <button className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-[#E8F5E9] transition-colors flex items-center justify-center text-sm font-medium">
                54
              </button>
              <button className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-[#E8F5E9] transition-colors flex items-center justify-center text-sm font-medium">
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
