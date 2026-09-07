"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetNewPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // The recovery link's tokens arrive in the URL fragment (#access_token=...
    // &refresh_token=...&type=recovery) — the project's Supabase email
    // templates use the implicit-flow ConfirmationURL style, not PKCE's
    // ?code=. The Supabase client here defaults to PKCE-oriented URL
    // detection (supabase-js v2 default), which only looks for a `code`
    // query param and never processes a hash fragment — so the fragment is
    // parsed manually here and the session established explicitly via
    // setSession(), rather than relying on automatic detection.
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (error) {
          setInvalid(true);
        } else {
          // Clear the sensitive tokens from the visible URL/history.
          window.history.replaceState(null, "", window.location.pathname);
          setReady(true);
        }
      });
    } else {
      // Fall back to checking for an already-established session (e.g. this
      // page was reached a second time after the fragment was already
      // consumed and cleared).
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
        else setInvalid(true);
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError("Nem sikerült a jelszó módosítása: " + updateError.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/bejelentkezes"), 2000);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">🐾</div>
          <h2 className="text-xl font-bold text-[#1C1C1C] mb-2">Jelszó frissítve!</h2>
          <p className="text-[#4A5568]">Átirányítunk a bejelentkezéshez...</p>
        </div>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 w-full max-w-md text-center">
          <p className="text-[#4A5568] mb-4">
            Ez a link érvénytelen vagy lejárt. Kérj egy új jelszó-visszaállító emailt.
          </p>
          <Link href="/jelszo-visszaallitas" className="text-[#1A3D2B] font-semibold hover:underline">
            Új visszaállító email kérése
          </Link>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4">
        <p className="text-[#4A5568]">Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#1A3D2B]">MyDog</Link>
          <p className="text-[#4A5568] text-sm mt-1">Új jelszó beállítása</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1C1C] mb-1.5">Új jelszó</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent"
              placeholder="min. 6 karakter"
            />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? "Mentés..." : "Jelszó mentése"}
          </button>
        </form>
      </div>
    </div>
  );
}
