const team = [
  { name: "Kovács Anna", role: "Alapító & CEO", emoji: "👩", bg: "bg-amber-100" },
  { name: "Tóth Péter", role: "CTO", emoji: "👨‍💻", bg: "bg-blue-100" },
  { name: "Németh Júlia", role: "Közösségépítés", emoji: "👩‍🤝‍👩", bg: "bg-green-100" },
  { name: "Szabó Márton", role: "Partnerkapcsolatok", emoji: "🤝", bg: "bg-purple-100" },
  { name: "Fekete Nóra", role: "Design", emoji: "🎨", bg: "bg-pink-100" },
  { name: "Varga Dávid", role: "Önkéntes koordinátor", emoji: "❤️", bg: "bg-red-100" },
];

const values = [
  { icon: "❤️", title: "Minden élet számít", desc: "Hiszünk abban, hogy minden kutya megérdemel egy szerető otthont." },
  { icon: "🤝", title: "Közösség", desc: "Együtt többet érünk el. Összekötjük a segítőket és a segítségre szorulókat." },
  { icon: "🛡️", title: "Biztonság", desc: "Az örökbefogadók és a kutyák biztonsága mindig az első." },
  { icon: "🌍", title: "Határokon átívelő", desc: "Ország határain túl is segítünk – mert a szeretet nem ismer határokat." },
];

const partnerLogos = [
  { bg: "bg-amber-50", label: "Állatorvosi Kamara" },
  { bg: "bg-green-50", label: "Állatvédő Szövetség" },
  { bg: "bg-blue-50", label: "EU Pet Network" },
  { bg: "bg-purple-50", label: "Dog Rescue Europe" },
  { bg: "bg-orange-50", label: "PetFriendly" },
  { bg: "bg-teal-50", label: "VetCare EU" },
];

export default function RolunkPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {/* Mission */}
      <section className="bg-[#1A3D2B] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🐾</div>
          <p className="text-sm font-semibold text-[#52B788] uppercase tracking-wider mb-3">A mi történetünk</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Összekötjük őket,<br />akik segítenek.
          </h1>
          <p className="text-xl text-[#A7C4A3] max-w-3xl mx-auto leading-relaxed">
            A RescueConnect 2024-ben indult, azzal a céllal, hogy egyetlen platformon összehozza a menhelyeket, fajtamentőket, állatorvosokat, önkénteseket és örökbefogadókat – határokon átívelve.
          </p>
        </div>
      </section>

      {/* Mission statement */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-[#3D7A3D] uppercase tracking-wider mb-3">Küldetésünk</p>
              <h2 className="text-3xl font-bold text-[#1C1C1C] mb-6">Egy helyen minden, ami egy kutya jobb életéhez kell.</h2>
              <p className="text-[#4A5568] leading-relaxed mb-4">
                Minden évben több százezer kutya vár örökbefogadóra Európa menhelyein. Mi azért vagyunk itt, hogy megkönnyítsük ezt a folyamatot – az örökbefogadástól a szállításig, az állatorvosi ellátástól az önkéntes programokig.
              </p>
              <p className="text-[#4A5568] leading-relaxed">
                Hiszünk abban, hogy a technológia és a közösség erejével minden kutya megtalálhatja a szerető otthonát.
              </p>
            </div>
            <div className="bg-[#E8F5E9] rounded-3xl p-8 text-center">
              <div className="text-[6rem] mb-4">🐕</div>
              <p className="text-2xl font-bold text-[#1A3D2B]">„Mert minden élet számít."</p>
              <p className="text-[#4A5568] mt-3">— A RescueConnect csapata</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-[#F7F8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#3D7A3D] uppercase tracking-wider mb-2">Amiben hiszünk</p>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">Értékeink</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-[#1C1C1C] mb-2">{v.title}</h3>
                <p className="text-sm text-[#4A5568] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#3D7A3D] uppercase tracking-wider mb-2">Az emberek mögötte</p>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">A csapatunk</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className={`w-20 h-20 mx-auto mb-3 ${member.bg} rounded-2xl flex items-center justify-center text-4xl`}>
                  {member.emoji}
                </div>
                <p className="font-bold text-[#1C1C1C] text-sm">{member.name}</p>
                <p className="text-xs text-[#4A5568]">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-[#F7F8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[#3D7A3D] uppercase tracking-wider mb-2">Együttműködők</p>
            <h2 className="text-2xl font-bold text-[#1C1C1C]">Partnereink</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {partnerLogos.map((p) => (
              <div key={p.label} className={`${p.bg} rounded-2xl h-20 flex items-center justify-center p-4 border border-white shadow-sm`}>
                <span className="text-xs font-semibold text-[#4A5568] text-center leading-tight">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="kapcsolat" className="py-16 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-[#1C1C1C] mb-4">Lépj kapcsolatba velünk</h2>
              <p className="text-[#4A5568] mb-6">Kérdésed van? Szívesen segítünk.</p>
              <div className="space-y-4">
                {[
                  { icon: "📧", label: "Email", value: "hello@rescueconnect.eu" },
                  { icon: "📍", label: "Iroda", value: "Budapest, Magyarország" },
                  { icon: "📱", label: "Telefon", value: "+36 1 234 5678" },
                ].map((contact) => (
                  <div key={contact.label} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-xl shrink-0">
                      {contact.icon}
                    </div>
                    <div>
                      <p className="text-xs text-[#4A5568]">{contact.label}</p>
                      <p className="font-semibold text-[#1C1C1C] text-sm">{contact.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <form className="bg-[#F7F8F5] rounded-2xl p-6 border border-[#E2E8F0]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Neve</label>
                  <input type="text" placeholder="Teljes név" className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Email</label>
                  <input type="email" placeholder="email@example.com" className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4A5568] mb-2">Üzenet</label>
                  <textarea placeholder="Miben segíthetünk?" rows={4} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] bg-white resize-none" />
                </div>
                <button className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3.5 rounded-2xl transition-colors">
                  Küldés →
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
