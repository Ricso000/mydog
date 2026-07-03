"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const GENDERS = [{ value: "male", label: "Kan" }, { value: "female", label: "Szuka" }];
const SIZES = [
  { value: "small", label: "Kis (< 10 kg)" },
  { value: "medium", label: "Közepes (10–25 kg)" },
  { value: "large", label: "Nagy (25–40 kg)" },
  { value: "xlarge", label: "Óriás (40+ kg)" },
];
const STATUSES = [
  { value: "available", label: "Elérhető" },
  { value: "reserved", label: "Foglalt" },
  { value: "adopted", label: "Örökbefogadott" },
  { value: "not_available", label: "Nem elérhető" },
];
const COUNTRIES = [
  { value: "HU", label: "Magyarország" }, { value: "DE", label: "Németország" },
  { value: "AT", label: "Ausztria" }, { value: "ES", label: "Spanyolország" },
  { value: "FR", label: "Franciaország" }, { value: "IT", label: "Olaszország" },
  { value: "NL", label: "Hollandia" }, { value: "PL", label: "Lengyelország" },
  { value: "CZ", label: "Csehország" }, { value: "RO", label: "Románia" },
];

export default function EditDogPage() {
  const router = useRouter();
  const params = useParams();
  const dogId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setFormState] = useState({
    name: "", breed: "", mixed_breed: false, age_years: "", age_months: "0",
    gender: "male", size: "medium", color: "", description: "", status: "available",
    is_vaccinated: false, is_neutered: false, is_chipped: false, is_dewormed: false,
    is_transportable: false, good_with_kids: false, good_with_dogs: false, good_with_cats: false,
    country: "HU", city: "", primary_image_url: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/partner/login"); return; }

      // Check membership
      const { data: m } = await supabase.from("partner_members").select("partner_id").eq("profile_id", user.id).single();
      if (!m) { router.push("/partner/dogs"); return; }

      // Fetch dog — verify it belongs to the partner
      const { data: dog, error: fetchError } = await supabase
        .from("dogs")
        .select("*")
        .eq("id", dogId)
        .eq("partner_id", m.partner_id)
        .single();
      if (fetchError || !dog) { router.push("/partner/dogs"); return; }

      setFormState({
        name: dog.name ?? "",
        breed: dog.breed ?? "",
        mixed_breed: dog.mixed_breed ?? false,
        age_years: dog.age_years?.toString() ?? "",
        age_months: dog.age_months?.toString() ?? "0",
        gender: dog.gender ?? "male",
        size: dog.size ?? "medium",
        color: dog.color ?? "",
        description: dog.description ?? "",
        status: dog.status ?? "available",
        is_vaccinated: dog.is_vaccinated ?? false,
        is_neutered: dog.is_neutered ?? false,
        is_chipped: dog.is_chipped ?? false,
        is_dewormed: dog.is_dewormed ?? false,
        is_transportable: dog.is_transportable ?? false,
        good_with_kids: dog.good_with_kids ?? false,
        good_with_dogs: dog.good_with_dogs ?? false,
        good_with_cats: dog.good_with_cats ?? false,
        country: dog.country ?? "HU",
        city: dog.city ?? "",
        primary_image_url: dog.primary_image_url ?? "",
      });
      setLoading(false);
    }
    load();
  }, [dogId, router]);

  function set(field: string, value: string | boolean) {
    setFormState(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("A kutya neve kötelező."); return; }
    setSaving(true);
    setError("");
    setSuccess(false);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("dogs").update({
      name: form.name.trim(),
      breed: form.breed || null,
      mixed_breed: form.mixed_breed,
      age_years: form.age_years !== "" ? parseInt(form.age_years) : null,
      age_months: parseInt(form.age_months) || 0,
      gender: form.gender,
      size: form.size,
      color: form.color || null,
      description: form.description || null,
      status: form.status,
      is_vaccinated: form.is_vaccinated,
      is_neutered: form.is_neutered,
      is_chipped: form.is_chipped,
      is_dewormed: form.is_dewormed,
      is_transportable: form.is_transportable,
      good_with_kids: form.good_with_kids,
      good_with_dogs: form.good_with_dogs,
      good_with_cats: form.good_with_cats,
      country: form.country,
      city: form.city || null,
      primary_image_url: form.primary_image_url || null,
    }).eq("id", dogId);

    if (updateError) { setError("Mentési hiba: " + updateError.message); }
    else { setSuccess(true); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Biztosan törölni szeretnéd ezt a kutyát?")) return;
    const supabase = createClient();
    await supabase.from("dogs").delete().eq("id", dogId);
    router.push("/partner/dogs");
    router.refresh();
  }

  const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-[#1C1C1C] mb-1.5";
  const checkboxClass = "flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer";

  if (loading) return <div className="text-center py-20 text-[#4A5568]">Betöltés...</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/partner/dogs" className="text-[#4A5568] hover:text-[#1A3D2B] text-sm">← Vissza</Link>
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Kutya szerkesztése</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#E2E8F0] p-8 space-y-8">
        <section>
          <h2 className="font-bold text-[#1C1C1C] mb-4">Alapadatok</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Név *</label>
              <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fajta</label>
              <input type="text" value={form.breed} onChange={e => set("breed", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Szín</label>
              <input type="text" value={form.color} onChange={e => set("color", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nem *</label>
              <select value={form.gender} onChange={e => set("gender", e.target.value)} required className={inputClass}>
                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Méret *</label>
              <select value={form.size} onChange={e => set("size", e.target.value)} required className={inputClass}>
                {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Kor (év)</label>
              <input type="number" min="0" max="30" value={form.age_years} onChange={e => set("age_years", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kor (hónap)</label>
              <select value={form.age_months} onChange={e => set("age_months", e.target.value)} className={inputClass}>
                {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Státusz</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} className={inputClass}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
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
              <label className={labelClass}>Leírás</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Fotó URL</label>
              <input type="url" value={form.primary_image_url} onChange={e => set("primary_image_url", e.target.value)} className={inputClass} placeholder="https://..." />
            </div>
          </div>
          <label className={`${checkboxClass} mt-3`}>
            <input type="checkbox" checked={form.mixed_breed} onChange={e => set("mixed_breed", e.target.checked)} className="w-4 h-4 accent-[#1A3D2B]" />
            Keverék kutya
          </label>
        </section>

        <section>
          <h2 className="font-bold text-[#1C1C1C] mb-4">Egészségügyi adatok</h2>
          <div className="grid grid-cols-2 gap-3">
            {[["is_vaccinated","Oltott"],["is_neutered","Ivartalanított"],["is_chipped","Chipes"],["is_dewormed","Féreghajtott"]].map(([f,l]) => (
              <label key={f} className={checkboxClass}>
                <input type="checkbox" checked={form[f as keyof typeof form] as boolean} onChange={e => set(f, e.target.checked)} className="w-4 h-4 accent-[#1A3D2B]" />
                {l}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-bold text-[#1C1C1C] mb-4">Kompatibilitás</h2>
          <div className="grid grid-cols-2 gap-3">
            {[["is_transportable","Szállítható"],["good_with_kids","Gyerekekkel is"],["good_with_dogs","Más kutyákkal is"],["good_with_cats","Macskákkal is"]].map(([f,l]) => (
              <label key={f} className={checkboxClass}>
                <input type="checkbox" checked={form[f as keyof typeof form] as boolean} onChange={e => set(f, e.target.checked)} className="w-4 h-4 accent-[#1A3D2B]" />
                {l}
              </label>
            ))}
          </div>
        </section>

        {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
        {success && <p className="text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl">✓ Sikeresen mentve.</p>}

        <div className="flex gap-3">
          <button type="button" onClick={handleDelete} className="border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3 px-5 rounded-xl transition-colors text-sm">
            Törlés
          </button>
          <div className="flex-1" />
          <Link href="/partner/dogs" className="border-2 border-[#E2E8F0] text-[#4A5568] hover:border-[#1A3D2B] font-semibold py-3 px-5 rounded-xl transition-colors text-sm">
            Mégse
          </Link>
          <button type="submit" disabled={saving} className="bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 px-8 rounded-xl transition-colors disabled:opacity-60">
            {saving ? "Mentés..." : "Mentés"}
          </button>
        </div>
      </form>
    </div>
  );
}
