"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  { value: "HU", label: "Magyarország" }, { value: "DE", label: "Németország" },
  { value: "AT", label: "Ausztria" }, { value: "ES", label: "Spanyolország" },
  { value: "FR", label: "Franciaország" }, { value: "IT", label: "Olaszország" },
  { value: "NL", label: "Hollandia" }, { value: "PL", label: "Lengyelország" },
  { value: "CZ", label: "Csehország" }, { value: "RO", label: "Románia" },
];

export default function PartnerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", country: "HU", city: "",
    address: "", phone: "", email: "", website: "", logo_url: "", cover_url: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/partner/login"); return; }

      const { data: membership } = await supabase
        .from("partner_members")
        .select("partner_id, partner:partners(*)")
        .eq("profile_id", user.id)
        .single();

      if (!membership) { setLoading(false); return; }
      const partnerRaw = membership.partner as unknown;
      const p = (Array.isArray(partnerRaw) ? partnerRaw[0] : partnerRaw) as Record<string, unknown>;
      setPartnerId(p.id as string);
      setForm({
        name: (p.name as string) ?? "",
        slug: (p.slug as string) ?? "",
        description: (p.description as string) ?? "",
        country: (p.country as string) ?? "HU",
        city: (p.city as string) ?? "",
        address: (p.address as string) ?? "",
        phone: (p.phone as string) ?? "",
        email: (p.email as string) ?? "",
        website: (p.website as string) ?? "",
        logo_url: (p.logo_url as string) ?? "",
        cover_url: (p.cover_url as string) ?? "",
      });
      setLoading(false);
    }
    load();
  }, [router]);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerId) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("partners")
      .update({
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        country: form.country,
        city: form.city || null,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        logo_url: form.logo_url || null,
        cover_url: form.cover_url || null,
      })
      .eq("id", partnerId);

    if (updateError) {
      setError("Mentés sikertelen: " + updateError.message);
    } else {
      setSuccess(true);
    }
    setSaving(false);
  }

  const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-[#1C1C1C] mb-1.5";

  if (loading) return <div className="text-center py-20 text-[#4A5568]">Betöltés...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2">Partner profil</h1>
      <p className="text-[#4A5568] text-sm mb-8">Szerkeszd a szervezeted adatait. A jóváhagyást az admin végzi.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#E2E8F0] p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Szervezet neve *</label>
            <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>URL slug</label>
            <input type="text" value={form.slug} onChange={e => set("slug", e.target.value)} className={inputClass} placeholder="pl. happy-paws" />
            <p className="text-xs text-[#4A5568] mt-1">Csak kisbetű, szám és kötőjel</p>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Bemutatkozás</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} className={inputClass} placeholder="Mesélj a szervezetedről..." />
          </div>
          <div>
            <label className={labelClass}>Ország</label>
            <select value={form.country} onChange={e => set("country", e.target.value)} className={inputClass}>
              {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Város</label>
            <input type="text" value={form.city} onChange={e => set("city", e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Cím</label>
            <input type="text" value={form.address} onChange={e => set("address", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telefon</label>
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Weboldal</label>
            <input type="url" value={form.website} onChange={e => set("website", e.target.value)} className={inputClass} placeholder="https://" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Logo URL</label>
            <input type="url" value={form.logo_url} onChange={e => set("logo_url", e.target.value)} className={inputClass} placeholder="https://" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Borítókép URL</label>
            <input type="url" value={form.cover_url} onChange={e => set("cover_url", e.target.value)} className={inputClass} placeholder="https://" />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
        {success && <p className="text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl">✓ Profil sikeresen mentve.</p>}

        <button type="submit" disabled={saving} className="bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 px-8 rounded-xl transition-colors disabled:opacity-60">
          {saving ? "Mentés..." : "Mentés"}
        </button>
      </form>
    </div>
  );
}
