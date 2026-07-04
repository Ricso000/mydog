"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") === "unauthorized" ? "Nincs admin jogosultságod." : "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError("Hibás email vagy jelszó."); setLoading(false); return; }
    // Role check happens server-side in dashboard
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0F2419] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-[#1A3D2B] mb-1">MyDog</div>
          <p className="text-[#4A5568] text-sm">Admin belépés</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1C1C] mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C1C1C] mb-1.5">Jelszó</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D]" />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
            {loading ? "Belépés..." : "Belépés"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-[#4A5568] hover:text-[#1A3D2B]">← Vissza a főoldalra</Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return <Suspense><AdminLoginForm /></Suspense>;
}
