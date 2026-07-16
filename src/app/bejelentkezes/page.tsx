"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Hibás email cím vagy jelszó.");
      setLoading(false);
      return;
    }
    const redirectTo = searchParams.get("redirect") || "/";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#1A3D2B]">MyDog</Link>
          <p className="text-[#4A5568] text-sm mt-1">Bejelentkezés a fiókodba</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1C1C] mb-1.5">Email cím</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent"
              placeholder="nev@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C1C1C] mb-1.5">Jelszó</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? "Belépés..." : "Belépés"}
          </button>
        </form>
        <p className="text-center text-sm text-[#4A5568] mt-6">
          Menhely vagy szolgáltató vagy?{" "}
          <Link href="/csatlakozas" className="text-[#1A3D2B] font-semibold hover:underline">Csatlakozz partnerként</Link>
        </p>
      </div>
    </div>
  );
}

export default function UserLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center"><p className="text-[#4A5568]">Betöltés...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
