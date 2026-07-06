import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

const countryEmoji: Record<string, string> = {
  DE: "🇩🇪", HU: "🇭🇺", ES: "🇪🇸", FR: "🇫🇷", IT: "🇮🇹",
  NL: "🇳🇱", PL: "🇵🇱", AT: "🇦🇹", CZ: "🇨🇿", RO: "🇷🇴"
};
const countryName: Record<string, string> = {
  DE: "Németország", HU: "Magyarország", ES: "Spanyolország",
  FR: "Franciaország", IT: "Olaszország", NL: "Hollandia",
  PL: "Lengyelország", AT: "Ausztria", CZ: "Csehország", RO: "Románia"
};
const genderLabel: Record<string, string> = { male: "Kan", female: "Szuka" };

const staticFeaturedDogs = [
  { id: "d1000001-0000-0000-0000-000000000001", name: "Luna",    age_years: 2, age_months: 0, gender: "female", breed: "Keverék",          country: "DE", primary_image_url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: "d1000001-0000-0000-0000-000000000002", name: "Max",     age_years: 4, age_months: 0, gender: "male",   breed: "Labrador keverék", country: "HU", primary_image_url: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: "d1000001-0000-0000-0000-000000000003", name: "Bella",   age_years: 1, age_months: 6, gender: "female", breed: "Border Collie",    country: "ES", primary_image_url: "https://images.unsplash.com/photo-1503256207526-0d5523f31059?w=400&h=300&fit=crop&auto=format&q=80" },
  { id: "d1000001-0000-0000-0000-000000000004", name: "Rocky",   age_years: 3, age_months: 0, gender: "male",   breed: "Staffi keverék",   country: "DE", primary_image_url: "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=400&h=300&fit=crop&auto=format&q=80" },
];

function formatAge(age_years: number | null, age_months: number | null): string {
  if (age_years === null && age_months === null) return "Ismeretlen kor";
  if ((age_years ?? 0) === 0 && (age_months ?? 0) > 0) return `${age_months} hónapos`;
  if ((age_months ?? 0) === 6) return `${age_years}.5 éves`;
  return `${age_years} éves`;
}

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

export default async function HomePage() {
  let featuredDogs = staticFeaturedDogs as typeof staticFeaturedDogs;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("dogs")
      .select("id, name, breed, age_years, age_months, gender, country, primary_image_url")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(4);
    if (data && data.length > 0) {
      featuredDogs = data as typeof staticFeaturedDogs;
    }
  } catch {
    // use static fallback
  }
  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden lg:min-h-[520px]">
        {/* DESKTOP background image */}
        <Image
          src="/hero-dog.png"
          alt=""
          aria-hidden
          fill
          priority
          className="hidden lg:block object-cover object-center"
          sizes="(min-width: 1024px) 100vw, 1px"
        />
        {/* DESKTOP overlay */}
        <div
          className="absolute inset-0 hidden lg:block"
          style={{ background: "linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 30%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0.0) 75%)" }}
        />

        {/* MOBILE background */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-[#E9F3E7] via-[#F6FAF4] to-[#F7F8F5]" />
        <div
          className="absolute -top-24 -right-20 w-72 h-72 rounded-full lg:hidden"
          style={{ background: "radial-gradient(circle, rgba(61,122,61,0.16) 0%, rgba(61,122,61,0) 70%)" }}
        />
        <div
          className="absolute top-32 -left-24 w-64 h-64 rounded-full lg:hidden"
          style={{ background: "radial-gradient(circle, rgba(26,61,43,0.10) 0%, rgba(26,61,43,0) 70%)" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 lg:pt-14 lg:pb-52">
          <div className="max-w-[560px] mx-auto lg:mx-0 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-[#1A3D2B] text-[12px] font-semibold px-3.5 py-1.5 rounded-full mb-5 shadow-sm border border-[#DCEBD8]">
              <span>🐾</span>
              <span>Több ezer kutya vár szerető otthonra</span>
              <span>❤️</span>
            </div>

            <h1 className="font-bold leading-[1.1] mb-4 text-[#111827] tracking-tight" style={{ fontSize: "clamp(2.1rem, 8vw, 3.5rem)" }}>
              Együtt egy jobb életért
              <br />
              <span style={{ color: "#1A3D2B" }}>minden kutyának.</span>
            </h1>

            <p className="text-[15px] lg:text-[16px] leading-relaxed mb-6 text-[#4B5563] max-w-[420px] mx-auto lg:mx-0 lg:max-w-none">
              Nemzetközi platform örökbefogadáshoz, menhelyekhez,
              fajtamentőkhöz, állatorvosokhoz és kutyás szolgáltatókhoz.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/kutyak"
                className="inline-flex items-center justify-center gap-2 text-white font-semibold px-6 py-4 lg:py-3.5 rounded-2xl transition-colors text-[15px] lg:text-[14px] shadow-lg shadow-[#1A3D2B]/20 w-full sm:w-auto active:scale-[0.98]"
                style={{ backgroundColor: "#1A3D2B" }}
              >
                🐾 Kutyák böngészése
              </Link>
              <Link
                href="/szolgaltatasok"
                className="inline-flex items-center justify-center gap-2 border border-[#D1D5DB] bg-white/85 backdrop-blur-sm text-[#374151] hover:bg-white font-semibold px-6 py-4 lg:py-3.5 rounded-2xl transition-colors text-[15px] lg:text-[14px] shadow-sm w-full sm:w-auto active:scale-[0.98]"
              >
                ❤️ Hogyan működik?
              </Link>
            </div>

            {/* MOBILE image card */}
            <div className="relative mt-8 lg:hidden rounded-3xl overflow-hidden shadow-xl aspect-[4/3] ring-1 ring-black/5">
              <Image
                src="/hero-dog.png"
                alt="Boldog golden retriever természetes környezetben"
                fill
                priority
                className="object-cover object-[68%_22%]"
                sizes="(max-width: 1024px) 100vw, 1px"
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md text-[12px] font-semibold text-[#1A3D2B]">
                <span>🛡️</span>
                <span>Ellenőrzött menhelyek</span>
              </div>
              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md text-[12px] font-semibold text-[#1A3D2B]">
                <span>🐾</span>
                <span>18 450+ kutya · 32 ország</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH WIDGET ─────────────────────────────────────────── */}
      <div className="relative z-20 -mt-14 lg:-mt-36 px-4 sm:px-6 lg:px-8 pb-2">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden">

          {/* Tabs: text on desktop, icons-only on mobile */}
          <div className="flex items-stretch border-b border-[#F3F4F6] overflow-x-auto">
            {[
              { label: "Kutyák keresése", icon: "🐾" },
              { label: "Menhelyek",       icon: "🏠" },
              { label: "Fajtamentők",     icon: "🐕" },
              { label: "Állatorvosok",    icon: "💉" },
              { label: "Kutyabarát",      icon: "📍" },
            ].map((tab, i) => (
              <button
                key={tab.label}
                className={`flex items-center justify-center gap-1.5 px-3 sm:px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors flex-1 sm:flex-none ${
                  i === 0 ? "bg-[#1A3D2B] text-white" : "text-[#6B7280] hover:text-[#1A3D2B] hover:bg-[#F9FAFB]"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-5">
            {/* Mobile: stacked filters */}
            <div className="flex flex-col sm:hidden gap-3">
              {[
                { label: "Ország",    options: ["Összes ország", "Magyarország", "Németország", "Ausztria", "Románia", "Spanyolország"] },
                { label: "Fajta",     options: ["Összes fajta", "Keverék", "Labrador", "Border Collie", "Golden Retriever"] },
                { label: "Kor",       options: ["Bármennyi", "Kölyök (0–1 év)", "Fiatal (1–3 év)", "Felnőtt (3–7 év)", "Idős (7+ év)"] },
                { label: "Méret",     options: ["Bármennyi", "Kis (–10 kg)", "Közepes (10–25 kg)", "Nagy (25+ kg)"] },
              ].map(({ label, options }) => (
                <div key={label} className="relative">
                  <label className="absolute left-3 top-2 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide pointer-events-none">{label}</label>
                  <select className="w-full appearance-none bg-white border border-[#E5E7EB] rounded-xl px-3 pt-6 pb-2.5 text-[14px] text-[#111827] font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]">
                    {options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              ))}

              {/* Szállítható toggle */}
              <div className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-xl px-4 py-3.5">
                <div>
                  <div className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Szállítható</div>
                  <div className="text-[14px] text-[#111827] font-medium mt-0.5">Csak szállíthatók</div>
                </div>
                <div className="relative w-11 h-6 shrink-0">
                  <div className="w-11 h-6 bg-[#D1D5DB] rounded-full"></div>
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>

              {/* Full-width search button on mobile */}
              <Link
                href="/kutyak"
                className="flex items-center justify-center gap-2 text-white font-semibold py-4 rounded-2xl text-[15px] shadow-sm w-full"
                style={{ backgroundColor: "#1A3D2B" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Keresés
              </Link>
            </div>

            {/* Desktop: side-by-side filters */}
            <div className="hidden sm:flex flex-wrap lg:flex-nowrap items-end gap-3">
              {[
                { label: "Ország", options: ["Összes ország", "Magyarország", "Németország", "Ausztria", "Románia", "Spanyolország"] },
                { label: "Fajta",  options: ["Összes fajta", "Keverék", "Labrador", "Border Collie", "Golden Retriever"] },
                { label: "Kor",    options: ["Bármennyi", "Kölyök (0–1 év)", "Fiatal (1–3 év)", "Felnőtt (3–7 év)", "Idős (7+ év)"] },
                { label: "Méret",  options: ["Bármennyi", "Kis (–10 kg)", "Közepes (10–25 kg)", "Nagy (25+ kg)"] },
              ].map(({ label, options }) => (
                <div key={label} className="flex-1 min-w-[120px]">
                  <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">{label}</label>
                  <div className="relative">
                    <select className="w-full appearance-none bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[13px] text-[#374151] font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 focus:border-[#1A3D2B]">
                      {options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ))}
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
              <Link href="/kutyak" className="flex items-center gap-2 text-white font-semibold px-7 py-2.5 rounded-xl text-[14px] shrink-0 shadow-sm" style={{ backgroundColor: "#1A3D2B", minHeight: "42px" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Keresés
              </Link>
            </div>

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
            <Link href="/kutyak" className="text-[13px] font-semibold text-[#1A3D2B] hover:underline">Összes megtekintése →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredDogs.map((dog) => {
              const emoji = dog.country ? (countryEmoji[dog.country] ?? "") : "";
              const cName = dog.country ? (countryName[dog.country] ?? dog.country) : "";
              const ageStr = formatAge(dog.age_years ?? null, dog.age_months ?? null);
              const gStr = dog.gender ? (genderLabel[dog.gender] ?? dog.gender) : "";
              const imgSrc = dog.primary_image_url ?? "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&auto=format&q=80";
              return (
                <div key={dog.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#E5E7EB]">
                  <div className="relative h-48 w-full">
                    <Image src={imgSrc} alt={dog.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                    <button className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-[#9CA3AF] hover:text-red-500 transition-colors shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-[15px] font-bold text-[#111827] mb-0.5">{dog.name}</h3>
                    <p className="text-[13px] text-[#6B7280] mb-0.5">{ageStr} · {gStr} · {dog.breed ?? "Keverék"}</p>
                    <p className="text-[13px] text-[#6B7280] mb-4">{emoji} {cName}</p>
                    <Link href={`/kutyak/${dog.id}`} className="block w-full text-center bg-[#F0FDF4] hover:bg-[#1A3D2B] hover:text-white text-[#1A3D2B] font-semibold py-2.5 rounded-xl transition-colors text-[13px]">
                      Megnézem
                    </Link>
                  </div>
                </div>
              );
            })}
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
                <div className="w-16 h-16 mx-auto mb-4 bg-[#F0FDF4] rounded-2xl flex items-center justify-center text-3xl shadow-sm">{step.icon}</div>
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
              <h2 className="text-[28px] lg:text-[34px] font-bold text-white mb-3">Légy te is részese valami csodálatosnak!</h2>
              <p className="text-[15px] mb-8 max-w-lg" style={{ color: "#A7C4A3" }}>
                Csatlakozz a MyDog közösségéhez és segíts kutyákat jobb életet találni.
              </p>
              <Link href="/csatlakozas" className="inline-flex items-center gap-2 bg-white text-[#1A3D2B] hover:bg-[#F0FDF4] font-bold px-7 py-3.5 rounded-xl transition-colors text-[15px]">
                Csatlakozom →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 shrink-0">
              {[{ value: "30+", label: "ország" }, { value: "2500+", label: "menhely" }, { value: "15k+", label: "örökbefogadás" }, { value: "8k+", label: "önkéntes" }].map((stat) => (
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
            <p className="mt-3 text-[15px] text-[#6B7280] max-w-xl mx-auto">Minden, amire egy kutya jobb életéhez szükség van – egy platformon.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[#E5E7EB]">
                <div className="w-12 h-12 bg-[#F0FDF4] rounded-xl flex items-center justify-center text-2xl mb-4">{s.icon}</div>
                <h3 className="text-[14px] font-bold text-[#111827] mb-2">{s.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/szolgaltatasok" className="inline-flex items-center gap-2 border border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F9FAFB] font-semibold px-7 py-3 rounded-xl transition-colors text-[14px]">
              Összes szolgáltatás →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
