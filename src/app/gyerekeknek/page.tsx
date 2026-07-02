import Link from "next/link";

const stories = [
  { title: "Bátor Mancs kalandja", age: "5-8 éveseknek", color: "bg-green-100", badge: "🟢", emoji: "🐕" },
  { title: "Lili és a kiskutya", age: "4-7 éveseknek", color: "bg-yellow-100", badge: "🟡", emoji: "🐶" },
  { title: "Szimat naplója", age: "6-9 éveseknek", color: "bg-purple-100", badge: "🟣", emoji: "🦮" },
  { title: "A gazdi, aki megmentett", age: "7-12 éveseknek", color: "bg-blue-100", badge: "🔵", emoji: "🐕‍🦺" },
];

const games = [
  { icon: "❓", title: "Kvíz", desc: "Teszteld a kutyás tudásodat!", color: "bg-amber-50", btn: "Kvíz indítása" },
  { icon: "🎴", title: "Párosító játék", desc: "Párosítsd össze a kutyákat!", color: "bg-green-50", btn: "Játék indítása" },
  { icon: "🏆", title: "Gondozási kihívás", desc: "Gondozd virtuális kutyádat!", color: "bg-blue-50", btn: "Kihívás kezdése" },
  { icon: "🎨", title: "Színezők", desc: "Töltsd le és színezd be!", color: "bg-purple-50", btn: "Letöltés" },
];

const learningItems = [
  { icon: "👂", label: "Megérteni a kutyák nyelvét" },
  { icon: "🐾", label: "Felelős állattartás" },
  { icon: "❤️", label: "Állatvédelem" },
  { icon: "🌟", label: "Jó cselekedetek" },
];

export default function GyerekekNekPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#E8F5E9] to-[#F7F8F5] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-[#1A3D2B] text-white text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                Gyerekeknek
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#1C1C1C] leading-tight mb-6">
                Tanulj, játssz és szeresd a kutyákat!
              </h1>
              <p className="text-lg text-[#4A5568] mb-8 leading-relaxed">
                A MyDog gyerek sarkában meséken, játékokon és kvízeken keresztül tanulhatsz a kutyákról és az állatvédelemről.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="#mesek" className="inline-flex items-center justify-center gap-2 bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold px-8 py-4 rounded-2xl transition-colors">
                  📖 Mesék olvasása
                </Link>
                <Link href="#jatekok" className="inline-flex items-center justify-center gap-2 border-2 border-[#1A3D2B] text-[#1A3D2B] hover:bg-[#E8F5E9] font-semibold px-8 py-4 rounded-2xl transition-colors">
                  🎮 Játékok
                </Link>
              </div>
            </div>

            {/* Right – What you can learn */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm">
              <h2 className="text-lg font-bold text-[#1C1C1C] mb-5">Mit tanulhatsz nálunk? 🐾</h2>
              <div className="space-y-3">
                {learningItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-[#F7F8F5] rounded-xl">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-semibold text-[#1C1C1C] text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stories */}
      <section id="mesek" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[#3D7A3D] uppercase tracking-wider mb-2">Olvasni szórakoztató</p>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">Mesék a kutyusokról</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stories.map((story) => (
              <div key={story.title} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0] cursor-pointer">
                <div className={`h-44 ${story.color} flex items-center justify-center text-7xl`}>
                  {story.emoji}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{story.badge}</span>
                    <span className="text-xs text-[#4A5568]">{story.age}</span>
                  </div>
                  <h3 className="font-bold text-[#1C1C1C] mb-3">{story.title}</h3>
                  <button className="w-full bg-[#E8F5E9] hover:bg-[#1B4D2F] hover:text-white text-[#1A3D2B] font-semibold py-2.5 rounded-xl transition-colors text-sm">
                    📖 Olvasás
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games */}
      <section id="jatekok" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[#3D7A3D] uppercase tracking-wider mb-2">Szórakozás és tanulás</p>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">Játékok és kvízek</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <div key={game.title} className={`${game.color} rounded-2xl p-6 hover:shadow-md transition-shadow border border-white`}>
                <div className="text-4xl mb-3">{game.icon}</div>
                <h3 className="font-bold text-[#1C1C1C] mb-2">{game.title}</h3>
                <p className="text-sm text-[#4A5568] mb-4">{game.desc}</p>
                <button className="w-full bg-white hover:bg-[#1B4D2F] hover:text-white text-[#1A3D2B] border border-[#E2E8F0] font-semibold py-2 rounded-xl transition-colors text-sm">
                  {game.btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom cards */}
      <section className="py-16 bg-[#F7F8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm">
              <div className="text-3xl mb-3">🤔</div>
              <h3 className="font-bold text-[#1C1C1C] mb-2">Tudtad?</h3>
              <p className="text-sm text-[#4A5568]">A kutyák több mint 150 különböző hangot is fel tudnak ismerni – köztük a te hangod!</p>
            </div>
            <div className="bg-[#E8F5E9] rounded-2xl p-6 border border-[#3D7A3D]/20">
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="font-bold text-[#1C1C1C] mb-2">Heti küldetés</h3>
              <p className="text-sm text-[#4A5568] mb-3">Teljesíts 5 feladatból 3-at és nyerj matrica packot!</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className={`flex-1 h-2 rounded-full ${i <= 3 ? "bg-[#3D7A3D]" : "bg-[#3D7A3D]/20"}`} />
                ))}
              </div>
              <p className="text-xs text-[#4A5568] mt-1">3/5 feladat</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-bold text-[#1C1C1C] mb-2">Rajzpályázat</h3>
              <p className="text-sm text-[#4A5568] mb-4">Rajzold le álmaid kutyáját és nyerj jutalmat!</p>
              <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded-xl transition-colors text-sm">
                Részvétel
              </button>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <div className="text-3xl mb-3">👨‍👩‍👧</div>
              <h3 className="font-bold text-[#1C1C1C] mb-2">Szülőknek és tanároknak</h3>
              <p className="text-sm text-[#4A5568] mb-4">Oktatási segédanyagok és tanmenet tippek.</p>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-xl transition-colors text-sm">
                Anyagok letöltése
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
