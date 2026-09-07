"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/jelszo-visszaallitas/uj-jelszo`,
    });
    setLoading(false);
    if (resetError) {
      setError("Hiba történt. Kérjük, próbáld újra.");
      return;
    }
    // Always show the same success state regardless of whether the email
    // exists — do not reveal account existence via this form.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">🐾</div>
          <h2 className="text-xl font-bold text-[#1C1C1C] mb-2">Ellenőrizd az emailjeidet!</h2>
          <p className="text-[#4A5568]">
            Ha létezik fiók ezzel az email címmel, hamarosan kapsz egy emailt a jelszó visszaállításához.
          </p>
          <Link href="/bejelentkezes" className="inline-block mt-6 text-[#1A3D2B] font-semibold hover:underline">
            Vissza a bejelentkezéshez
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#1A3D2B]">MyDog</Link>
          <p className="text-[#4A5568] text-sm mt-1">Jelszó visszaállítása</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1C1C] mb-1.5">Email cím</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent"
              placeholder="nev@example.com"
            />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? "Küldés..." : "Visszaállító email küldése"}
          </button>
        </form>
        <p className="text-center text-sm text-[#4A5568] mt-6">
          <Link href="/bejelentkezes" className="text-[#1A3D2B] font-semibold hover:underline">Vissza a bejelentkezéshez</Link>
        </p>
      </div>
    </div>
  );
}
