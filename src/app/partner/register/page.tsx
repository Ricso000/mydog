"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PARTNER_TYPES = [
  { value: "shelter", label: "Menhely" },
  { value: "breed_rescue", label: "Fajtamentő" },
  { value: "veterinarian", label: "Állatorvos" },
  { value: "dog_school", label: "Kutya iskola" },
  { value: "boarding", label: "Szálláshely" },
  { value: "grooming", label: "Groomer" },
  { value: "walker", label: "Kutya sétatárs" },
  { value: "dog_friendly_place", label: "Kutyabarát hely" },
  { value: "transport", label: "Szállítás" },
  { value: "other", label: "Egyéb" },
];

const COUNTRIES = [
  { value: "HU", label: "Magyarország" },
  { value: "DE", label: "Németország" },
  { value: "AT", label: "Ausztria" },
  { value: "ES", label: "Spanyolország" },
  { value: "FR", label: "Franciaország" },
  { value: "IT", label: "Olaszország" },
  { value: "NL", label: "Hollandia" },
  { value: "PL", label: "Lengyelország" },
  { value: "CZ", label: "Csehország" },
  { value: "RO", label: "Románia" },
];

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "", password: "", full_name: "",
    partner_name: "", partner_type: "shelter",
    country: "HU", city: "", phone: "", website: "", short_description: "",
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password || !form.partner_name || !form.partner_type) {
      setError("Kérjük, töltsd ki a kötelező mezőket.");
      return;
    }
    if (form.password.length < 6) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    });

    if (authError || !authData.user) {
      setError(authError?.message || "Regisztrációs hiba. Próbáld újra.");
      setLoading(false);
      return;
    }

    // 2. Create partner record (trigger will auto-add user to partner_members)
    const slug = form.partner_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 50);

    const { error: partnerError } = await supabase.from("partners").insert({
      name: form.partner_name,
      slug: `${slug}-${Date.now()}`,
      type: form.partner_type,
      country: form.country,
      city: form.city || null,
      phone: form.phone || null,
      website: form.website || null,
      description: form.short_description || null,
      status: "draft",
      verified: false,
    });

    if (partnerError) {
      setError("Partner profil létrehozása sikertelen: " + partnerError.message);
      setLoading(false);
      return;
    }

    router.push("/partner/dashboard");
    router.refresh();
  }

  const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-[#1C1C1C] mb-1.5";

  return (
    <div className="min-h-screen bg-[#F7F8F5] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#1A3D2B]">MyDog</Link>
          <p className="text-[#4A5568] text-sm mt-1">Partner regisztráció</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account */}
            <div>
              <h2 className="font-bold text-[#1C1C1C] mb-4">Fiók adatok</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Teljes név</label>
                  <input type="text" value={form.full_name} onChange={e => set("full_name", e.target.value)} className={inputClass} placeholder="Nagy Péter" />
                </div>
                <div>
                  <label className={labelClass}>Email cím *</label>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required className={inputClass} placeholder="email@example.com" />
                </div>
                <div>
                  <label className={labelClass}>Jelszó *</label>
                  <input type="password" value={form.password} onChange={e => set("password", e.target.value)} required className={inputClass} placeholder="min. 6 karakter" />
                </div>
              </div>
            </div>

            {/* Partner */}
            <div>
              <h2 className="font-bold text-[#1C1C1C] mb-4">Partner adatok</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Szervezet neve *</label>
                  <input type="text" value={form.partner_name} onChange={e => set("partner_name", e.target.value)} required className={inputClass} placeholder="Pl. Happy Paws Menhely" />
                </div>
                <div>
                  <label className={labelClass}>Típus *</label>
                  <select value={form.partner_type} onChange={e => set("partner_type", e.target.value)} required className={inputClass}>
                    {PARTNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Ország *</label>
                  <select value={form.country} onChange={e => set("country", e.target.value)} className={inputClass}>
                    {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Város</label>
                  <input type="text" value={form.city} onChange={e => set("city", e.target.value)} className={inputClass} placeholder="Budapest" />
                </div>
                <div>
                  <label className={labelClass}>Telefonszám</label>
                  <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} className={inputClass} placeholder="+36 1 234 5678" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Weboldal</label>
                  <input type="url" value={form.website} onChange={e => set("website", e.target.value)} className={inputClass} placeholder="https://example.com" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Rövid bemutatkozás</label>
                  <textarea value={form.short_description} onChange={e => set("short_description", e.target.value)} rows={3} className={inputClass} placeholder="Néhány mondat a szervezetről..." />
                </div>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

            <button type="submit" disabled={loading} className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-60">
              {loading ? "Regisztráció..." : "Regisztrálok partnerként →"}
            </button>
          </form>
          <p className="text-center text-sm text-[#4A5568] mt-6">
            Már van fiókod?{" "}
            <Link href="/partner/login" className="text-[#1A3D2B] font-semibold hover:underline">Lépj be</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
