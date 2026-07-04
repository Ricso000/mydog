import type { ReactNode } from "react";
import Link from "next/link";

const navItems = [
  { href: "/admin/dashboard", icon: "📊", label: "Áttekintés" },
  { href: "/admin/partners", icon: "🏠", label: "Partnerek" },
  { href: "/admin/dogs", icon: "🐾", label: "Kutyák" },
  { href: "/admin/applications", icon: "📋", label: "Kérelmek" },
  { href: "/admin/users", icon: "👥", label: "Felhasználók" },
  { href: "/admin/activity", icon: "📜", label: "Napló" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F0F2EF] flex">
      <aside className="hidden lg:flex w-60 bg-[#0F2419] flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="block">
            <div className="text-white font-bold text-xl">MyDog</div>
            <div className="text-[#7FAF7F] text-xs mt-0.5">Admin Portal</div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#A7C4A3] hover:bg-white/10 hover:text-white transition-colors text-sm font-medium">
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link href="/partner/dashboard" className="flex items-center gap-2 text-[#A7C4A3] hover:text-white text-xs transition-colors">
            ← Partner Portal
          </Link>
          <Link href="/" className="flex items-center gap-2 text-[#A7C4A3] hover:text-white text-xs transition-colors">
            ← Főoldal
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-[#0F2419] px-4 py-3 flex items-center justify-between">
        <span className="text-white font-bold text-sm">MyDog <span className="text-[#7FAF7F] font-normal">Admin</span></span>
        <nav className="flex gap-3">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-[#A7C4A3] hover:text-white text-base" title={item.label}>
              {item.icon}
            </Link>
          ))}
        </nav>
      </div>

      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
