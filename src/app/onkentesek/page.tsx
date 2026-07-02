const steps = [
  { icon: "📝", title: "Regisztrálj", desc: "Töltsd ki az önkéntes regisztrációs űrlapot és add meg kompetenciáidat." },
  { icon: "✅", title: "Jóváhagyás", desc: "Csapatunk 48 órán belül felülvizsgálja és jóváhagyja a jelentkezésedet." },
  { icon: "🐾", title: "Kezdd el!", desc: "Csatlakozz a platformhoz és kezdj el segíteni a kutyáknak!" },
];

const benefits = [
  { icon: "🌍", label: "Csatlakozz 8 000+ önkénteshez" },
  { icon: "📜", label: "Önkéntes igazolás" },
  { icon: "💬", label: "Saját önkéntes profil" },
  { icon: "🎓", label: "Képzési anyagok" },
  { icon: "🏆", label: "Elismertség és díjak" },
  { icon: "❤️", label: "Csináld, ami igazán fontos" },
];

export default function OnkentesekPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {/* Hero */}
      <section className="bg-[#1A3D2B] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#52B788] uppercase tracking-wider mb-3">Önkéntes program</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Légy te is részese valami csodálatosnak!
          </h1>
          <p className="text-xl text-[#A7C4A3] max-w-2xl mx-auto mb-8">
            Csatlakozz 8 000+ önkénteshez, akik nap mint nap segítik a kutyákat egy jobb élet felé.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: "8 000+", label: "Önkéntes" },
              { value: "32", label: "Ország" },
              { value: "15k+", label: "Segített kutya" },
              { value: "4.9", label: "Önkéntes elégedettség" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-[#A7C4A3] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to volunteer */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[#1C1C1C]">Hogyan lehetsz önkéntes?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-[#E8F5E9] rounded-2xl flex items-center justify-center text-2xl">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-[#3D7A3D] mb-1">0{i + 1}</div>
                <h3 className="font-bold text-[#1C1C1C] mb-2">{step.title}</h3>
                <p className="text-sm text-[#4A5568] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-[#F7F8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#1C1C1C]">Miért legyél önkéntes?</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {benefits.map((b) => (
              <div key={b.label} className="bg-white rounded-2xl p-4 text-center border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">{b.icon}</div>
                <p className="text-xs font-semibold text-[#1C1C1C] leading-tight">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration form */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#1C1C1C]">Önkéntes regisztráció</h2>
            <p className="text-[#4A5568] mt-2">Töltsd ki az alábbi űrlapot és mi felvesszük veled a kapcsolatot!</p>
          </div>
          <form className="bg-[#F7F8F5] rounded-2xl p-8 border border-[#E2E8F0]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-semibold text-[#4A5568] mb-2">Teljes név *</label>
                <input
                  type="text"
                  placeholder="Kiss János"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4A5568] mb-2">Email cím *</label>
                <input
                  type="email"
                  placeholder="janos@email.com"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white"
                />
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Ország</label>
              <select className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white">
                <option value="">Válassz országot</option>
                <option>🇭🇺 Magyarország</option>
                <option>🇩🇪 Németország</option>
                <option>🇦🇹 Ausztria</option>
                <option>🇸🇰 Szlovákia</option>
              </select>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Mivel szeretnél segíteni?</label>
              <div className="grid grid-cols-2 gap-3">
                {["Szállítás", "Ideiglen. befogadás", "Adminisztráció", "Közösségi média", "Fordítás", "Egyéb"].map((area) => (
                  <label key={area} className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer">
                    <input type="checkbox" className="rounded accent-[#3D7A3D]" />
                    {area}
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#4A5568] mb-2">Üzenet (opcionális)</label>
              <textarea
                placeholder="Mesélj magadról és tapasztalataidról..."
                rows={4}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-4 rounded-2xl transition-colors text-base"
            >
              Önkéntes jelentkezés küldése →
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
