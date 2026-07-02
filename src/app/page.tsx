import Link from "next/link";
import Image from "next/image";

const featuredDogs = [
  { id: 1, name: "Luna", age: "2 éves", gender: "Szuka", breed: "Keverék", country: "🇩🇪 Németország", bg: "bg-amber-100", emoji: "🐕" },
  { id: 2, name: "Max", age: "4 éves", gender: "Kan", breed: "Labrador keverék", country: "🇭🇺 Magyarország", bg: "bg-orange-100", emoji: "🦮" },
  { id: 3, name: "Bella", age: "1.5 éves", gender: "Szuka", breed: "Border Collie", country: "🇪🇸 Spanyolország", bg: "bg-yellow-100", emoji: "🐕‍🦺" },
  { id: 4, name: "Rocky", age: "3 éves", gender: "Kan", breed: "Staffi keverék", country: "🇫🇷 Franciaország", bg: "bg-stone-100", emoji: "🐶" },
];

const howItWorks = [
  { icon: "🔍", title: "Keresd meg", desc: "Böngészd a rendelkezésre álló kutyákat szűrők segítségével, ország, fajta és kor szerint." },
  { icon: "💬", title: "Vedd fel a kapcsolatot", desc: "Lépj kapcsolatba közvetlenül a menhellyel vagy fajtamentővel a platformunkon keresztül." },
  { icon: "🏠", title: "Örökbefogadás", desc: "Töltsd ki az örökbefogadási kérelmet és kezdd meg a folyamatot a menhely segítségével." },
  { icon: "🚐", title: "Szállítás", desc: "Segítünk a kutya biztonságos szállításában, akár határon átnyúlóan is." },
];

const services = [
  { icon: "🏠", title: "Menhelyek & Fajtamentők", desc: "2 500+ partner menhely és fajtamentő szervezet Európából." },
  { icon: "💉", title: "Állatorvosok", desc: "Megbízható állatorvosok az örökbefogadás előtt és után." },
  { icon: "🐕", title: "Kutyás szolgáltatók", desc: "Kutyaiskola, panzió, sétáltató – minden, amire szükséged van." },
  { icon: "🚐", title: "Szállítás & Logisztika", desc: "Biztonságos szállítás Európa-szerte, tapasztalt partnerekkel." },
];

const trustItems = [
  { icon: "🛡️", title: "Ellenőrzött menhelyek", desc: "Minden partnerünket ellenőrizzük" },
  { icon: "❤️", title: "Biztonságos örökbefogadás", desc: "Átlátható folyamat, jogi háttérrel" },
  { icon: "🚛", title: "Nemzetközi szállítás", desc: "Önkéntesek és partnerek hálózata" },
  { icon: "👥", title: "Közösség és támogatás", desc: "Egy közösség, akik hisznek a második esélyben" },
  { icon: "🎁", title: "Minden élet számít", desc: "Segíts te is, hogy több kutya boldog életet élhessen" },
];

const searchTabs = ["🐾 Kutyák keresése", "🏠 Menhelyek", "🐕 Fajtamentők", "💉 Állatorvosok", "📍 Kutyabarát helyek"];

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "580px" }}>

        {/* Full-bleed background image */}
        <Image
          src="/hero-dog.png"
          alt="Boldog golden retriever természetes környezetben"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />

        {/* Left-side gradient overlay so text is readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 30%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0.0) 75%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-52">
          <div className="max-w-[560px]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-[#1A3D2B] text-[13px] font-semibold px-4 py-2 rounded-full mb-6 shadow-sm border border-white/60">
              <span>🐾</span>
              <span>Több ezer kutya vár szerető otthonra</span>
              <span>❤️</span>
            </div>

            {/* Headline */}
            <h1 className="font-bold leading-[1.12] mb-5" style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)", color: "#111827" }}>
              Együtt egy jobb életért
              <br />
              <span style={{ color: "#1A3D2B" }}>minden kutyának.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[16px] leading-relaxed mb-8" style={{ color: "#374151" }}>
              Nemzetközi platform örökbefogadáshoz, menhelyekhez,<br className="hidden sm:block" />
              fajtamentőkhöz, állatorvosokhoz és kutyás szolgáltatókhoz.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/kutyak"
                className="inline-flex items-center justify-center gap-2 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-[15px] shadow-md"
                style={{ backgroundColor: "#1A3D2B" }}
              >
                🐾 Kutyák böngészése
              </Link>
              <Link
                href="/szolgaltatasok"
                className="inline-flex items-center justify-center gap-2 border border-[#D1D5DB] bg-white/80 backdrop-blur-sm text-[#374151] hover:bg-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-[15px] shadow-sm"
              >
                ❤️ Hogyan működik?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH WIDGET (overlaps hero) ─────────────────────────── */}
      <div className="relative z-20 -mt-36 px-4 sm:px-6 lg:px-8 pb-2">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden">

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-[#F3F4F6] overflow-x-auto">
            {searchTabs.map((tab, i) => (
              <button
                key={tab}
                className={`flex items-center gap-1.5 px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  i === 0
                    ? "bg-[#1A3D2B] text-white"
                    : "text-[#6B7280] hover:text-[#1A3D2B] hover:bg-[#F9FAFB]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="p-5">
            <div className="flex flex-wrap lg:flex-nowrap items-end gap-3">
              {/* Ország */}
              <div className="flex-1 min-w-[130px]">
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">Ország</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[13px] text-[#374151] font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]">
                    <option>Összes ország</option>
                    <option>Magyarország</option>
                    <option>Németország</option>
                    <option>Ausztria</option>
                    <option>Románia</option>
                    <option>Spanyolország</option>
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Fajta */}
              <div className="flex-1 min-w-[130px]">
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">Fajta</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[13px] text-[#374151] font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]">
                    <option>Összes fajta</option>
                    <option>Keverék</option>
                    <option>Labrador</option>
                    <option>Border Collie</option>
                    <option>Golden Retriever</option>
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Kor */}
              <div className="flex-1 min-w-[110px]">
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">Kor</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[13px] text-[#374151] font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]">
                    <option>Bármennyi</option>
                    <option>Kölyök (0–1 év)</option>
                    <option>Fiatal (1–3 év)</option>
                    <option>Felnőtt (3–7 év)</option>
                    <option>Idős (7+ év)</option>
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Méret */}
              <div className="flex-1 min-w-[110px]">
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">Méret</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[13px] text-[#374151] font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]">
                    <option>Bármennyi</option>
                    <option>Kis (–10 kg)</option>
                    <option>Közepes (10–25 kg)</option>
                    <option>Nagy (25+ kg)</option>
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Szállítható toggle */}
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">Szállítható</label>
                <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2.5 h-[42px]">
                  <span className="text-[13px] text-[#374151] font-medium flex-1">Csak szállíthatók</span>
                  <div className="relative w-10 h-5 shrink-0">
                    <div className="w-10 h-5 bg-[#D1D5DB] rounded-full"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>

              {/* Search button */}
              <Link
                href="/kutyak"
                className="flex items-center gap-2 text-white font-semibold px-7 py-2.5 rounded-xl transition-colors text-[14px] shrink-0 shadow-sm"
                style={{ backgroundColor: "#1A3D2B", minHeight: "42px" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Keresés
              </Link>
            </div>

            {/* Stats under filters */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-[#6B7280]">
              <span>🐾</span>
              <span>Több mint <strong className="text-[#1A3D2B] font-bold">18 450</strong> kutya <strong className="text-[#1A3D2B] font-bold">32</strong> országban</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRUST BAR ─────────────────────────────────────────────── */}
      <section className="bg-white border-y border-[#F3F4F6] mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-3">
            {trustItems.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-[13px] font-bold text-[#111827]">{item.title}</div>
                  <div className="text-[12px] text-[#6B7280] leading-snug mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED DOGS ─────────────────────────────────────────── */}
      <section className="bg-[#F7F8F5] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[12px] font-bold text-[#3D7A3D] uppercase tracking-widest mb-1">Örökbefogadásra várnak</p>
              <h2 className="text-[28px] font-bold text-[#111827]">Kiemelt kutyák</h2>
            </div>
            <Link href="/kutyak" className="text-[13px] font-semibold text-[#1A3D2B] hover:underline flex items-center gap-1">
              Összes megtekintése →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredDogs.map((dog) => (
              <div key={dog.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#E5E7EB]">
                <div className={`h-48 ${dog.bg} flex items-center justify-center text-7xl relative`}>
                  {dog.emoji}
                  <button className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-[#9CA3AF] hover:text-red-500 transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="text-[15px] font-bold text-[#111827] mb-0.5">{dog.name}</h3>
                  <p className="text-[13px] text-[#6B7280] mb-0.5">{dog.age} · {dog.gender} · {dog.breed}</p>
                  <p className="text-[13px] text-[#6B7280] mb-4">{dog.country}</p>
                  <Link
                    href={`/kutyak/${dog.id}`}
                    className="block w-full text-center bg-[#F0FDF4] hover:bg-[#1A3D2B] hover:text-white text-[#1A3D2B] font-semibold py-2.5 rounded-xl transition-colors text-[13px]"
                  >
                    Megnézem
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[12px] font-bold text-[#3D7A3D] uppercase tracking-widest mb-2">Egyszerű folyamat</p>
            <h2 className="text-[28px] font-bold text-[#111827]">Hogyan működik?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#F0FDF4] rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                  {step.icon}
                </div>
                <div className="text-[11px] font-bold text-[#3D7A3D] mb-1 tracking-wider">0{i + 1}</div>
                <h3 className="text-[15px] font-bold text-[#111827] mb-2">{step.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: "#1A3D2B" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left">
              <h2 className="text-[28px] lg:text-[34px] font-bold text-white mb-3">
                Légy te is részese valami csodálatosnak!
              </h2>
              <p className="text-[15px] mb-8 max-w-lg" style={{ color: "#A7C4A3" }}>
                Csatlakozz a RescueConnect közösségéhez és segíts kutyákat jobb életet találni.
              </p>
              <Link
                href="/csatlakozas"
                className="inline-flex items-center gap-2 bg-white text-[#1A3D2B] hover:bg-[#F0FDF4] font-bold px-7 py-3.5 rounded-xl transition-colors text-[15px]"
              >
                Csatlakozom →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 shrink-0">
              {[
                { value: "30+", label: "ország" },
                { value: "2500+", label: "menhely" },
                { value: "15k+", label: "örökbefogadás" },
                { value: "8k+", label: "önkéntes" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl p-5 text-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <div className="text-[28px] font-bold text-white">{stat.value}</div>
                  <div className="text-[13px] mt-1" style={{ color: "#A7C4A3" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES PREVIEW ──────────────────────────────────────── */}
      <section className="bg-[#F7F8F5] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[12px] font-bold text-[#3D7A3D] uppercase tracking-widest mb-2">Átfogó segítség</p>
            <h2 className="text-[28px] font-bold text-[#111827]">Szolgáltatásaink</h2>
            <p className="mt-3 text-[15px] text-[#6B7280] max-w-xl mx-auto">
              Minden, amire egy kutya jobb életéhez szükség van – egy platformon.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[#E5E7EB]">
                <div className="w-12 h-12 bg-[#F0FDF4] rounded-xl flex items-center justify-center text-2xl mb-4">
                  {s.icon}
                </div>
                <h3 className="text-[14px] font-bold text-[#111827] mb-2">{s.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/szolgaltatasok"
              className="inline-flex items-center gap-2 border border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F9FAFB] font-semibold px-7 py-3 rounded-xl transition-colors text-[14px]"
            >
              Összes szolgáltatás →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
