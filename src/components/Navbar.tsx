"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/kutyak", label: "Kutyák" },
  { href: "/menhelyek", label: "Menhelyek" },
  { href: "/fajtamentok", label: "Fajtamentők" },
  { href: "/szolgaltatasok", label: "Szolgáltatások" },
  { href: "/gyerekeknek", label: "Gyerekeknek" },
  { href: "/bobilos-utazas", label: "Utazás kutyával" },
  { href: "/hirek", label: "Hírek" },
  { href: "/rolunk", label: "Rólunk" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-[#1A3D2B] rounded-xl flex items-center justify-center text-lg">
              🐾
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold text-[#1A3D2B]">RescueConnect</span>
              <span className="text-[10px] text-[#6B7280] hidden sm:block">Együtt a boldogabb kutyákért</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-[13px] font-medium text-[#374151] hover:text-[#1A3D2B] hover:bg-[#F0FDF4] rounded-lg transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/kedvencek"
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#374151] hover:text-[#1A3D2B] px-3 py-1.5 rounded-lg hover:bg-[#F0FDF4] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Kedvencek
            </Link>
            <button className="flex items-center gap-1 text-[13px] font-medium text-[#374151] hover:text-[#1A3D2B] px-3 py-1.5 rounded-lg hover:bg-[#F0FDF4] transition-colors border border-[#E5E7EB]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
              HU
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="p-1.5 text-[#374151] hover:text-[#1A3D2B] hover:bg-[#F0FDF4] rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <Link
              href="/csatlakozas"
              className="text-[13px] font-semibold text-white bg-[#1A3D2B] hover:bg-[#15312200] px-5 py-2 rounded-xl transition-colors"
              style={{ backgroundColor: "#1A3D2B" }}
            >
              Regisztráció
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg text-[#4A5568] hover:bg-[#E8F5E9] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menü"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E2E8F0] bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm font-medium text-[#4A5568] hover:text-[#1A3D2B] hover:bg-[#E8F5E9] rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
              <Link href="/csatlakozas" className="block px-3 py-2 text-sm font-semibold text-white bg-[#1A3D2B] rounded-xl text-center" onClick={() => setMobileOpen(false)}>
                Regisztráció
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
