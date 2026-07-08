import type { ReactNode } from "react";
import Link from "next/link";

const navItems = [
  { href: "/partner/dashboard", icon: "🏠", label: "Áttekintés" },
  { href: "/partner/dogs", icon: "🐾", label: "Kutyáim" },
  { href: "/partner/dogs/new", icon: "➕", label: "Új kutya" },
  { href: "/partner/applications", icon: "📨", label: "Jelentkezések" },
  { href: "/partner/profile", icon: "⚙️", label: "Profil" },
];

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F8F5] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 bg-[#1A3D2B] flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="block">
            <div className="text-white font-bold text-xl">MyDog</div>
            <div className="text-[#A7C4A3] text-xs mt-0.5">Partner Portal</div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#A7C4A3] hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-2 text-[#A7C4A3] hover:text-white text-xs transition-colors">
            ← Vissza a főoldalra
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-[#1A3D2B] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-white font-bold">MyDog <span className="text-[#A7C4A3] text-xs font-normal">Partner Portal</span></Link>
        <nav className="flex gap-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-[#A7C4A3] hover:text-white text-lg" title={item.label}>
              {item.icon}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
