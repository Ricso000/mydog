import Link from "next/link";
import Image from "next/image";

const allDogs = [
  { id: 1,  name: "Luna",   age: "2 éves",   gender: "Szuka", breed: "Keverék",          country: "🇩🇪", countryName: "Németország",   size: "Közepes", img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: 2,  name: "Max",    age: "4 éves",   gender: "Kan",   breed: "Labrador keverék", country: "🇭🇺", countryName: "Magyarország",  size: "Nagy",    img: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: 3,  name: "Bella",  age: "1.5 éves", gender: "Szuka", breed: "Border Collie",    country: "🇪🇸", countryName: "Spanyolország", size: "Közepes", img: "https://images.unsplash.com/photo-1503256207526-0d5523f31059?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: 4,  name: "Rocky",  age: "3 éves",   gender: "Kan",   breed: "Staffi keverék",   country: "🇫🇷", countryName: "Franciaország", size: "Közepes", img: "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: 5,  name: "Molly",  age: "5 éves",   gender: "Szuka", breed: "Beagle",            country: "🇮🇹", countryName: "Olaszország",   size: "Kis",     img: "https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: 6,  name: "Charlie",age: "2 éves",   gender: "Kan",   breed: "Golden Retriever", country: "🇳🇱", countryName: "Hollandia",     size: "Nagy",    img: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: 7,  name: "Daisy",  age: "1 éves",   gender: "Szuka", breed: "Keverék",          country: "🇵🇱", countryName: "Lengyelország", size: "Kis",     img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: 8,  name: "Jack",   age: "6 éves",   gender: "Kan",   breed: "Német juhász",     country: "🇦🇹", countryName: "Ausztria",      size: "Nagy",    img: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: 9,  name: "Nina",   age: "3 éves",   gender: "Szuka", breed: "Husky keverék",    country: "🇩🇪", countryName: "Németország",   size: "Közepes", img: "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: 10, name: "Bruno",  age: "7 éves",   gender: "Kan",   breed: "Rottweiler keverék",country:"🇭🇺", countryName: "Magyarország",  size: "Nagy",    img: "https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: 11, name: "Coco",   age: "2 éves",   gender: "Szuka", breed: "Uszkár keverék",   country: "🇫🇷", countryName: "Franciaország", size: "Kis",     img: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: 12, name: "Rex",    age: "4 éves",   gender: "Kan",   breed: "Malinois keverék", country: "🇨🇿", countryName: "Csehország",    size: "Nagy",    img: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=300&fit=crop&auto=format&q=80" },
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
                  <input type="text" placeholder="Kutya neve, fajta..." className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Ország</label>
                  <select className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
                    <option>Összes ország</option>
                    <option>🇭🇺 Magyarország</option>
                    <option>🇩🇪 Németország</option>
                    <option>🇪🇸 Spanyolország</option>
                    <option>🇫🇷 Franciaország</option>
                    <option>🇮🇹 Olaszország</option>
                    <option>🇳🇱 Hollandia</option>
                    <option>🇵🇱 Lengyelország</option>
                    <option>🇦🇹 Ausztria</option>
                    <option>🇨🇿 Csehország</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Fajta</label>
                  <select className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
                    <option>Összes fajta</option>
                    <option>Keverék</option>
                    <option>Labrador</option>
                    <option>Border Collie</option>
                    <option>Golden Retriever</option>
                    <option>Német juhász</option>
                    <option>Husky</option>
                    <option>Beagle</option>
                    <option>Uszkár</option>
                    <option>Malinois</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Kor</label>
                  <select className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
                    <option>Összes kor</option>
                    <option>Kölyök (0-1 év)</option>
                    <option>Fiatal (1-3 év)</option>
                    <option>Felnőtt (3-7 év)</option>
                    <option>Idős (7+ év)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Méret</label>
                  <select className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
                    <option>Összes méret</option>
                    <option>Kis (0-10 kg)</option>
                    <option>Közepes (10-25 kg)</option>
                    <option>Nagy (25+ kg)</option>
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
                <button className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors">Szűrés</button>
                <button className="w-full text-sm text-[#4A5568] hover:text-[#1A3D2B] underline">Szűrők törlése</button>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {allDogs.map((dog) => (
                <div key={dog.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0]">
                  <div className="relative h-48 w-full">
                    <Image
                      src={dog.img}
                      alt={`${dog.name} – ${dog.breed}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                    <button className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-[#9CA3AF] hover:text-red-500 transition-colors shadow-sm" aria-label="Kedvencekhez">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-bold text-[#1C1C1C] mb-0.5">{dog.name}</h3>
                    <p className="text-xs text-[#4A5568] mb-0.5">{dog.age} · {dog.gender} · {dog.size}</p>
                    <p className="text-xs text-[#4A5568] mb-0.5">{dog.breed}</p>
                    <p className="text-xs text-[#4A5568] mb-3">{dog.country} {dog.countryName}</p>
                    <Link href={`/kutyak/${dog.id}`} className="block w-full text-center bg-[#E8F5E9] hover:bg-[#1B4D2F] hover:text-white text-[#1A3D2B] font-semibold py-2 rounded-xl transition-colors text-sm">
                      Megnézem
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-10">
              <button className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-[#E8F5E9] flex items-center justify-center text-sm font-medium">←</button>
              {[1, 2, 3].map((p) => (
                <button key={p} className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${p === 1 ? "bg-[#1B4D2F] text-white" : "border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-[#E8F5E9]"}`}>{p}</button>
              ))}
              <span className="text-[#4A5568] px-2">...</span>
              <button className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-[#E8F5E9] flex items-center justify-center text-sm font-medium">54</button>
              <button className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-[#E8F5E9] flex items-center justify-center text-sm font-medium">→</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
