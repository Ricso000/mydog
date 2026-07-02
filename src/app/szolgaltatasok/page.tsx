import Link from "next/link";

const services = [
  { icon: "🏠", title: "Menhelyek & Fajtamentők", desc: "Több mint 2 500 partner szervezet Európa-szerte. Szűrd fajta, ország és méret szerint.", color: "bg-green-50" },
  { icon: "💉", title: "Állatorvosok", desc: "Megbízható állatorvos partnerek az egészségügyi vizsgálathoz és az örökbefogadás előkészítéséhez.", color: "bg-blue-50" },
  { icon: "🐕", title: "Kutyás szolgáltatók", desc: "Kutya iskola, panzió, sétáltató, groomer – minden amihez a kutyád fejlődéséhez szükséged lesz.", color: "bg-amber-50" },
  { icon: "🚐", title: "Szállítás & Logisztika", desc: "Biztonságos szállítás határon átnyúlóan is. Tapasztalt partnerekkel, EU-kompatibilis dokumentumokkal.", color: "bg-orange-50" },
  { icon: "❤️", title: "Önkéntes hálózat", desc: "Csatlakozz 8 000+ önkénteshez, akik segítik a kutyák útját a menhely és az új otthon között.", color: "bg-red-50" },
  { icon: "🏡", title: "Ideiglenes befogadás", desc: "Adj ideiglenes otthont egy kutyának, amíg megtalálja végleges gazdáját.", color: "bg-purple-50" },
  { icon: "📚", title: "Tudástár & Tanácsok", desc: "Cikkek, videók és szakértői tanácsok az örökbefogadásról, a kutya neveléséről és egészségéről.", color: "bg-teal-50" },
  { icon: "🎁", title: "Támogathatsz", desc: "Adományoddal közvetlenül segíted a menhelyeket és az önkénteseket.", color: "bg-pink-50" },
];

const howItWorks = [
  { icon: "🔍", title: "Keresés", desc: "Keresd meg a hozzád legközelebb lévő menhelyt vagy szolgáltatást." },
  { icon: "💬", title: "Kapcsolatfelvétel", desc: "Vedd fel a kapcsolatot közvetlenül a platformon." },
  { icon: "🚐", title: "Logisztika", desc: "Szervezzük a szállítást, ha szükséges." },
  { icon: "🏡", title: "Új otthon", desc: "A kutya megtalálja végleges, szerető otthonát." },
];

const partnerTypes = [
  { icon: "🏠", label: "Menhely" },
  { icon: "🐾", label: "Fajtamentő" },
  { icon: "💉", label: "Állatorvos" },
  { icon: "🐕", label: "Kutyaiskola" },
  { icon: "🏨", label: "Kutyapanzió" },
];

export default function SzolgaltatasokPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {/* Hero */}
      <section className="bg-white border-b border-[#E2E8F0] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-[#3D7A3D] uppercase tracking-wider mb-3">Átfogó ökoszisztéma</p>
              <h1 className="text-4xl lg:text-5xl font-bold text-[#1C1C1C] leading-tight mb-6">
                Minden, amire egy kutyának és gazdijának szüksége van.
              </h1>
              <p className="text-lg text-[#4A5568] leading-relaxed mb-8">
                A MyDog több mint egy örökbefogadási platform. Egy teljes ökoszisztéma, amelyből senki sem marad ki.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/kutyak" className="inline-flex items-center justify-center gap-2 bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold px-8 py-4 rounded-2xl transition-colors">
                  Kutyák böngészése
                </Link>
                <Link href="/csatlakozas" className="inline-flex items-center justify-center gap-2 border-2 border-[#1A3D2B] text-[#1A3D2B] hover:bg-[#E8F5E9] font-semibold px-8 py-4 rounded-2xl transition-colors">
                  Partner leszek
                </Link>
              </div>
            </div>

            {/* How it works steps */}
            <div className="bg-[#F7F8F5] rounded-2xl p-6 border border-[#E2E8F0]">
              <h2 className="text-lg font-bold text-[#1C1C1C] mb-6">Hogyan működik?</h2>
              <div className="space-y-4">
                {howItWorks.map((step, i) => (
                  <div key={step.title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-lg shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#3D7A3D]">0{i + 1}</span>
                        <h3 className="font-semibold text-[#1C1C1C] text-sm">{step.title}</h3>
                      </div>
                      <p className="text-sm text-[#4A5568]">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#1A3D2B] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { value: "18 450+", label: "Megmentett kutya" },
              { value: "1 250+", label: "Menhely & fajtamentő" },
              { value: "4 300+", label: "Önkéntes" },
              { value: "32", label: "Ország" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-[#A7C4A3] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#3D7A3D] uppercase tracking-wider mb-2">Minden egy helyen</p>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">Szolgáltatásaink</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <div key={s.title} className={`${s.color} rounded-2xl p-6 hover:shadow-md transition-shadow border border-white`}>
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-base font-bold text-[#1C1C1C] mb-2">{s.title}</h3>
                <p className="text-sm text-[#4A5568] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner section */}
      <section className="bg-white py-16 border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#1C1C1C] mb-3">Csatlakozz partnerként</h2>
            <p className="text-[#4A5568]">Válaszd ki a számodra megfelelő partnertípust</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {partnerTypes.map((p) => (
              <Link
                key={p.label}
                href="/csatlakozas"
                className="flex flex-col items-center gap-2 p-5 bg-[#F7F8F5] hover:bg-[#E8F5E9] border border-[#E2E8F0] hover:border-[#3D7A3D] rounded-2xl transition-all w-32"
              >
                <span className="text-3xl">{p.icon}</span>
                <span className="text-sm font-semibold text-[#1C1C1C]">{p.label}</span>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link href="/csatlakozas" className="inline-flex items-center gap-2 bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold px-10 py-4 rounded-2xl transition-colors">
              Regisztráció indítása →
            </Link>
          </div>
        </div>
      </section>

      {/* Trust footer bar */}
      <section className="bg-[#F7F8F5] py-10 border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            {[
              { icon: "🛡️", label: "Biztonságos platform" },
              { icon: "🌍", label: "Európa-szerte" },
              { icon: "💸", label: "Regisztráció ingyenes" },
              { icon: "🤝", label: "Közösségi támogatás" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-semibold text-[#4A5568]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
