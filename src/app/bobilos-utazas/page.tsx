import Link from "next/link";

const features = [
  { icon: "⛺", title: "Kutyabarát kempingek", desc: "Szűrhető adatbázis a kutyabarát éjszakázási helyekről Európa-szerte." },
  { icon: "🗺️", title: "Útvonal tervező", desc: "Tervezd meg az utad kutyabarát pihenőkkel és megállókkal." },
  { icon: "📋", title: "Szabályok & tippek", desc: "Ország-specifikus belépési és közlekedési szabályok kutyásoknak." },
  { icon: "👥", title: "Közösség & élmények", desc: "Csatlakozz bobilos kutyás közösséghez, oszd meg élményeid." },
];

const photoPlaceholders = [
  { bg: "bg-amber-100", emoji: "🏕️", label: "Kemping" },
  { bg: "bg-green-100", emoji: "🌲", label: "Erdei séta" },
  { bg: "bg-blue-100", emoji: "🏖️", label: "Tengerpart" },
  { bg: "bg-orange-100", emoji: "🏔️", label: "Hegyvidék" },
];

export default function BobilosUtazasPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A3D2B] to-[#3D7A3D] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-block bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              ÚJ! Bobilos kalandok kutyáddal
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Szabadság. Kaland.{" "}
              <span className="text-[#52B788]">Kutyáddal.</span>
            </h1>
            <p className="text-xl text-[#A7C4A3] mb-8 leading-relaxed max-w-2xl">
              Fedezz fel kutyabarát kempingeket, tervezz útvonalakat és csatlakozz a bobilos kutya közösséghez. Mert a legjobb kalandok megosztva a legjobb barátaiddal vannak.
            </p>
            <Link
              href="#terkep"
              className="inline-flex items-center gap-2 bg-white text-[#1A3D2B] hover:bg-[#E8F5E9] font-bold px-8 py-4 rounded-2xl transition-colors text-base"
            >
              Fedezd fel a lehetőségeket →
            </Link>
          </div>
        </div>
      </section>

      {/* Feature icons row */}
      <section className="bg-white border-b border-[#E2E8F0] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-sm font-semibold text-[#1C1C1C]">{f.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#3D7A3D] uppercase tracking-wider mb-2">Minden, ami kell</p>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">Útitárs a legjobb barátodnak</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Feature list */}
            <div className="space-y-6">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4 p-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-2xl shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1C1C1C] mb-1">{f.title}</h3>
                    <p className="text-sm text-[#4A5568] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-2 gap-4">
              {photoPlaceholders.map((p) => (
                <div key={p.label} className={`${p.bg} rounded-2xl h-44 flex flex-col items-center justify-center gap-2`}>
                  <span className="text-5xl">{p.emoji}</span>
                  <span className="text-sm font-semibold text-[#4A5568]">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#E8F5E9] py-12 border-y border-[#3D7A3D]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { value: "2 350+", label: "bobilos kutya" },
              { value: "780+", label: "megosztott hely" },
              { value: "15 000+", label: "közösségi tag" },
              { value: "32", label: "országban" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-[#1A3D2B]">{stat.value}</div>
                <div className="text-sm text-[#4A5568] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-[#1C1C1C] mb-3">Csatlakozz a közösséghez</h2>
          <p className="text-[#4A5568] mb-8 max-w-2xl mx-auto">
            Oszd meg kedvenc bobilos élményeidet, adj tippeket más kutyásoknak és fedezz fel új helyeket a közösség segítségével.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto mb-8">
            {[
              { bg: "bg-green-50", emoji: "📸", label: "Képek megosztása" },
              { bg: "bg-amber-50", emoji: "⭐", label: "Helyszín értékelése" },
              { bg: "bg-blue-50", emoji: "💬", label: "Kérdések & Válaszok" },
            ].map((c) => (
              <div key={c.label} className={`${c.bg} rounded-2xl p-6 flex flex-col items-center gap-2`}>
                <span className="text-4xl">{c.emoji}</span>
                <span className="font-semibold text-[#1C1C1C] text-sm">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App download - dark green */}
      <section className="bg-[#1A3D2B] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-3">Minden úton veletek vagyunk</h2>
              <p className="text-[#A7C4A3] text-lg mb-8 max-w-lg">
                Töltsd le az alkalmazásunkat és vigyél magaddal mindent, amire szükséged van a bobilos kalandhoz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex items-center gap-3 bg-white text-[#1A3D2B] hover:bg-[#E8F5E9] font-semibold px-6 py-3.5 rounded-2xl transition-colors">
                  <span className="text-2xl">🍎</span>
                  <div className="text-left">
                    <div className="text-xs text-[#4A5568]">Letöltés az</div>
                    <div className="font-bold">App Store-ból</div>
                  </div>
                </button>
                <button className="flex items-center gap-3 bg-white text-[#1A3D2B] hover:bg-[#E8F5E9] font-semibold px-6 py-3.5 rounded-2xl transition-colors">
                  <span className="text-2xl">🤖</span>
                  <div className="text-left">
                    <div className="text-xs text-[#4A5568]">Elérhető a</div>
                    <div className="font-bold">Google Play-en</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="w-64 h-64 bg-white/10 rounded-3xl flex items-center justify-center">
              <span className="text-[8rem]">📱</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quote + CTA */}
      <section className="py-16 bg-[#F7F8F5]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <blockquote className="text-2xl font-semibold text-[#1C1C1C] italic mb-6">
            „Az élet legjobb kalandjai kutyával a legjobb baráttal."
          </blockquote>
          <p className="text-[#4A5568] mb-8">Csatlakozz és kezdj el tervezni a következő kalandot!</p>
          <Link
            href="/csatlakozas"
            className="inline-flex items-center gap-2 bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold px-10 py-4 rounded-2xl transition-colors"
          >
            Regisztrálok →
          </Link>
        </div>
      </section>
    </div>
  );
}
