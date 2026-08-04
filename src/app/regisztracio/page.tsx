"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Kérjük, add meg az email címed és a jelszavad.");
      return;
    }
    if (password.length < 6) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError) {
      setError(
        authError.message === "User already registered"
          ? "Ezzel az email címmel már létezik fiók."
          : authError.message
      );
      setLoading(false);
      return;
    }

    const redirectTo = searchParams.get("redirect") || "/profil";
    router.push(redirectTo);
    router.refresh();
  }

  const inputClass =
    "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-[#1C1C1C] mb-1.5";

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#1A3D2B]">MyDog</Link>
          <p className="text-[#4A5568] text-sm mt-1">Felhasználói fiók létrehozása</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Teljes név</label>
            <input
              type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className={inputClass} placeholder="Nagy Éva"
            />
          </div>
          <div>
            <label className={labelClass}>Email cím</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className={inputClass} placeholder="nev@example.com"
            />
          </div>
          <div>
            <label className={labelClass}>Jelszó</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className={inputClass} placeholder="min. 6 karakter"
            />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? "Regisztráció..." : "Regisztráció"}
          </button>
        </form>
        <p className="text-center text-sm text-[#4A5568] mt-6">
          Már van fiókod?{" "}
          <Link href="/bejelentkezes" className="text-[#1A3D2B] font-semibold hover:underline">Lépj be</Link>
        </p>
        <p className="text-center text-sm text-[#4A5568] mt-2">
          Menhely vagy szolgáltató vagy?{" "}
          <Link href="/partner/register" className="text-[#1A3D2B] font-semibold hover:underline">Regisztrálj partnerként</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center">
          <p className="text-[#4A5568]">Betöltés...</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
