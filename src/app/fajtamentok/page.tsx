import Link from "next/link";

const rescueGroups = [
  { id: 1, name: "Magyar Husky Mentők", breed: "Szibériai Husky", country: "🇭🇺", city: "Budapest", dogs: 12, emoji: "🐺", bg: "bg-slate-100" },
  { id: 2, name: "Golden Rescue HU", breed: "Golden Retriever", country: "🇭🇺", city: "Debrecen", dogs: 8, emoji: "🦮", bg: "bg-amber-100" },
  { id: 3, name: "DE Labrador Retter", breed: "Labrador", country: "🇩🇪", city: "Berlin", dogs: 23, emoji: "🐕", bg: "bg-yellow-100" },
  { id: 4, name: "Border Collie Rescue EU", breed: "Border Collie", country: "🇬🇧", city: "London", dogs: 15, emoji: "🐕‍🦺", bg: "bg-green-100" },
  { id: 5, name: "Staffi Mentők", breed: "Staffordshire Terrier", country: "🇭🇺", city: "Pécs", dogs: 7, emoji: "🐶", bg: "bg-orange-100" },
  { id: 6, name: "Pudel Rettung AT", breed: "Poodle", country: "🇦🇹", city: "Wien", dogs: 5, emoji: "🐩", bg: "bg-pink-100" },
];

const breeds = ["Labrador Retriever", "Golden Retriever", "Husky", "Border Collie", "Staffi", "Poodle", "Beagle", "Malinois", "Rottweiler", "Német juhász", "Dobermann", "Dalmatian"];

export default function FajtamentokPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {/* Hero */}
      <section className="bg-[#1A3D2B] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#52B788] uppercase tracking-wider mb-3">Fajta-specifikus mentés</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Fajtamentők</h1>
          <p className="text-[#A7C4A3] text-lg max-w-2xl mx-auto">
            Fajta-specifikus mentőszervezetek Európa-szerte. Szakértők, akik szívükön viselik az adott fajta sorsát.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breed pills */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1C1C1C] mb-4">Keresés fajta szerint</h2>
          <div className="flex flex-wrap gap-2">
            {breeds.map((breed) => (
              <button
                key={breed}
                className="px-4 py-2 bg-white border border-[#E2E8F0] hover:border-[#3D7A3D] hover:bg-[#E8F5E9] text-sm font-medium text-[#4A5568] hover:text-[#1A3D2B] rounded-full transition-colors"
              >
                {breed}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rescueGroups.map((group) => (
            <div key={group.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0]">
              <div className={`h-36 ${group.bg} flex items-center justify-center text-6xl`}>
                {group.emoji}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-[#1C1C1C] mb-1">{group.name}</h3>
                <p className="text-sm text-[#3D7A3D] font-semibold mb-1">Fajta: {group.breed}</p>
                <p className="text-sm text-[#4A5568] mb-1">{group.country} {group.city}</p>
                <p className="text-sm text-[#4A5568] mb-4">🐕 {group.dogs} kutya elérhető</p>
                <Link
                  href={`/menhelyek/${group.id}`}
                  className="block w-full text-center bg-[#E8F5E9] hover:bg-[#1B4D2F] hover:text-white text-[#1A3D2B] font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Kutyák megtekintése
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-[#E8F5E9] rounded-2xl p-8 text-center border border-[#3D7A3D]/20">
          <h3 className="text-xl font-bold text-[#1A3D2B] mb-2">Fajtamentő szervezet vagy?</h3>
          <p className="text-[#4A5568] mb-6">Regisztrálj és listázd a nálad lévő kutyákat ingyen!</p>
          <Link
            href="/csatlakozas"
            className="inline-flex items-center gap-2 bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold px-8 py-3 rounded-2xl transition-colors"
          >
            Partner regisztráció →
          </Link>
        </div>
      </div>
    </div>
  );
}
