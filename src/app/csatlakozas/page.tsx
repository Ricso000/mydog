import Link from "next/link";

export default function CsatlakozasPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      <section className="bg-[#1A3D2B] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#52B788] uppercase tracking-wider mb-3">Csatlakozás</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Hogyan szeretnél csatlakozni?</h1>
          <p className="text-[#A7C4A3] text-lg max-w-2xl mx-auto">
            Válaszd ki, melyik írja le téged jobban.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/regisztracio"
            className="bg-white rounded-3xl p-8 border-2 border-[#E2E8F0] hover:border-[#3D7A3D] hover:bg-white transition-colors text-center block"
          >
            <div className="text-4xl mb-4">🐕</div>
            <h2 className="text-xl font-bold text-[#1C1C1C] mb-2">Kutyát keresek</h2>
            <p className="text-sm text-[#4A5568]">
              Fiókot szeretnék, hogy kedvenceket mentsem és nyomon kövessem az örökbefogadási jelentkezéseimet.
            </p>
            <span className="inline-block mt-5 text-[#1A3D2B] font-semibold">Felhasználói regisztráció →</span>
          </Link>

          <Link
            href="/partner/register"
            className="bg-white rounded-3xl p-8 border-2 border-[#E2E8F0] hover:border-[#3D7A3D] hover:bg-white transition-colors text-center block"
          >
            <div className="text-4xl mb-4">🏠</div>
            <h2 className="text-xl font-bold text-[#1C1C1C] mb-2">Menhely / szolgáltató vagyok</h2>
            <p className="text-sm text-[#4A5568]">
              Kutyákat szeretnék feltölteni örökbefogadásra, vagy szolgáltatóként megjelenni a platformon.
            </p>
            <span className="inline-block mt-5 text-[#1A3D2B] font-semibold">Partner regisztráció →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
