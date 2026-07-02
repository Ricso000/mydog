import Link from "next/link";

const footerLinks = {
  kutyak: {
    title: "Kutyák",
    links: [
      { href: "/kutyak", label: "Összes kutya" },
      { href: "/kutyak?filter=kolyok", label: "Kölykök" },
      { href: "/kutyak?filter=idosebb", label: "Idősebb kutyák" },
      { href: "/kutyak?filter=kulfold", label: "Külföldi kutyák" },
      { href: "/kedvencek", label: "Kedvenceim" },
    ],
  },
  menhelyek: {
    title: "Menhelyek",
    links: [
      { href: "/menhelyek", label: "Összes menhely" },
      { href: "/fajtamentok", label: "Fajtamentők" },
      { href: "/menhelyek?country=hu", label: "Magyar menhelyek" },
      { href: "/menhelyek?country=de", label: "Német menhelyek" },
      { href: "/csatlakozas", label: "Partner regisztráció" },
    ],
  },
  szolgaltatasok: {
    title: "Szolgáltatások",
    links: [
      { href: "/szolgaltatasok", label: "Összes szolgáltatás" },
      { href: "/szolgaltatasok#allatorvos", label: "Állatorvosok" },
      { href: "/szolgaltatasok#szallitas", label: "Szállítás" },
      { href: "/bobilos-utazas", label: "Bobilos utazás" },
      { href: "/gyerekeknek", label: "Gyerekeknek" },
    ],
  },
  rolunk: {
    title: "Rólunk",
    links: [
      { href: "/rolunk", label: "A csapatunk" },
      { href: "/onkentesek", label: "Önkéntesek" },
      { href: "/rolunk#kapcsolat", label: "Kapcsolat" },
      { href: "/rolunk#adatvedelom", label: "Adatvédelem" },
      { href: "/rolunk#aszf", label: "ÁSZF" },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="bg-[#1A3D2B] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🐾</span>
              <span className="text-xl font-bold">RescueConnect</span>
            </Link>
            <p className="text-sm text-[#A7C4A3] leading-relaxed mb-4">
              Összekötjük a megmentett kutyákat az örökbefogadókkal, a menhelyeket az önkéntesekkel.
            </p>
            <p className="text-sm font-semibold text-[#52B788] italic">
              „Mert minden élet számít."
            </p>
            <div className="flex gap-3 mt-6">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="TikTok">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#A7C4A3] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#A7C4A3]">
            © 2026 RescueConnect. Minden jog fenntartva.
          </p>
          <p className="text-sm text-[#A7C4A3]">
            Készítve ❤️ a kutyákért
          </p>
        </div>
      </div>
    </footer>
  );
}
