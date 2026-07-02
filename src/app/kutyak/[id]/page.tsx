import Link from "next/link";
import Image from "next/image";

const thumbnails = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=160&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=160&fit=crop&auto=format&q=75&sat=-30",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=160&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=200&h=160&fit=crop&auto=format&q=80",
];

export default function KutyaDetailPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/kutyak" className="inline-flex items-center gap-2 text-sm font-medium text-[#4A5568] hover:text-[#1A3D2B] mb-8 transition-colors">
          ← Vissza a kereséshez
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left – Photo */}
          <div>
            <div className="relative rounded-3xl overflow-hidden h-[450px] shadow-sm mb-4">
              <Image
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop&auto=format&q=85"
                alt="Luna kutya fotó"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {thumbnails.map((src, i) => (
                <div key={i} className={`relative rounded-xl overflow-hidden h-20 cursor-pointer border-2 ${i === 0 ? "border-[#1A3D2B]" : "border-transparent"} hover:border-[#3D7A3D] transition-colors`}>
                  <Image src={src} alt={`Luna fotó ${i + 1}`} fill className="object-cover" sizes="100px" />
                </div>
              ))}
            </div>
          </div>

          {/* Right – Details */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-[#3D7A3D] mb-1">🇩🇪 Berlin, Németország</p>
                <h1 className="text-4xl font-bold text-[#1C1C1C] mb-2">Luna</h1>
                <p className="text-[#4A5568]">2 éves · Szuka · Közepes méretű</p>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#4A5568] hover:text-red-500 hover:border-red-300 transition-colors" aria-label="Kedvencekhez">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#4A5568] hover:border-[#3D7A3D] transition-colors" aria-label="Megosztás">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {["Közepes méretű", "Aktív", "Barátságos", "Gyerekek mellé is"].map((badge) => (
                <span key={badge} className="bg-[#E8F5E9] text-[#1A3D2B] text-sm font-medium px-3 py-1.5 rounded-full">{badge}</span>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] mb-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-xl">🏠</div>
              <div>
                <p className="text-xs text-[#4A5568]">Menhely</p>
                <p className="font-semibold text-[#1C1C1C]">Happy Paws Rescue</p>
                <p className="text-xs text-[#4A5568]">🇩🇪 Berlin, Németország · ⭐ 4.9</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#1C1C1C] mb-3">Rólam</h2>
              <p className="text-[#4A5568] leading-relaxed text-sm">
                Szia, Luna vagyok! 2 éves keverék szuka, teli energiával és szeretettel. Szeretem a hosszú sétákat, a labdát és az emberek társaságát. Gyerekekkel is jól kijövök, és más kutyákkal is baráti vagyok. Egy aktív, szerető otthonban virágoznék igazán. Várom az örökbe fogadómat! 🐾
              </p>
            </div>

            <div className="bg-[#F7F8F5] rounded-2xl p-5 mb-6">
              <h2 className="text-base font-bold text-[#1C1C1C] mb-4">Információk</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Oltva", value: "Igen" },
                  { label: "Ivartalanítva", value: "Igen" },
                  { label: "Chipelve", value: "Igen" },
                  { label: "Féreghajtva", value: "Igen" },
                  { label: "Kor", value: "2 év" },
                  { label: "Méret", value: "Közepes (~15 kg)" },
                ].map((info) => (
                  <div key={info.label} className="flex items-center gap-2">
                    <span className="text-[#3D7A3D] text-sm">✓</span>
                    <span className="text-sm text-[#4A5568]"><span className="font-medium">{info.label}:</span> {info.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/kutyak/1/kapcsolat" className="w-full text-center bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-4 rounded-2xl transition-colors">
                Kapcsolatfelvétel a menhellyel
              </Link>
              <button className="w-full border-2 border-[#1A3D2B] text-[#1A3D2B] hover:bg-[#E8F5E9] font-semibold py-3.5 rounded-2xl transition-colors">
                Kedvencekhez adom ♡
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
