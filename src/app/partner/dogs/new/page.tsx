"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { DogImageUpload } from "@/components/DogImageUpload";

const GENDERS = [{ value: "male", label: "Kan" }, { value: "female", label: "Szuka" }];
const SIZES = [
  { value: "small", label: "Kis (< 10 kg)" },
  { value: "medium", label: "Közepes (10–25 kg)" },
  { value: "large", label: "Nagy (25–40 kg)" },
  { value: "xlarge", label: "Óriás (40+ kg)" },
];
const COUNTRIES = [
  { value: "HU", label: "Magyarország" }, { value: "DE", label: "Németország" },
  { value: "AT", label: "Ausztria" }, { value: "ES", label: "Spanyolország" },
  { value: "FR", label: "Franciaország" }, { value: "IT", label: "Olaszország" },
  { value: "NL", label: "Hollandia" }, { value: "PL", label: "Lengyelország" },
  { value: "CZ", label: "Csehország" }, { value: "RO", label: "Románia" },
];

const DEFAULT_FORM = {
  name: "", breed: "", mixed_breed: false, age_years: "", age_months: "0",
  gender: "male", size: "medium", color: "", description: "",
  is_vaccinated: false, is_neutered: false, is_chipped: false, is_dewormed: false,
  is_transportable: false, good_with_kids: false, good_with_dogs: false, good_with_cats: false,
  country: "HU", city: "", primary_image_url: "",
};

export default function NewDogPage() {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partnerId, setPartnerId] = useState<string | null>(null);

  useEffect(() => {
    async function getPartner() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/partner/login"); return; }
      const { data: m } = await supabase.from("partner_members").select("partner_id").eq("profile_id", user.id).single();
      if (m) setPartnerId(m.partner_id);
    }
    getPartner();
  }, [router]);

  function setField(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerId) { setError("Partner azonosító nem található."); return; }
    if (!form.name.trim()) { setError("A kutya neve kötelező."); return; }
    if (!form.gender) { setError("A nem megadása kötelező."); return; }
    if (!form.size) { setError("A méret megadása kötelező."); return; }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: insertError } = await supabase.from("dogs").insert({
      partner_id: partnerId,
      name: form.name.trim(),
      breed: form.breed || null,
      mixed_breed: form.mixed_breed,
      age_years: form.age_years !== "" ? parseInt(form.age_years) : null,
      age_months: parseInt(form.age_months) || 0,
      gender: form.gender,
      size: form.size,
      color: form.color || null,
      description: form.description || null,
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
      status: "available",
    });

    if (insertError) {
      setError("Hiba a kutya mentésekor: " + insertError.message);
      setLoading(false);
      return;
    }

    router.push("/partner/dogs");
    router.refresh();
  }

  const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-[#1C1C1C] mb-1.5";
  const checkboxClass = "flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/partner/dogs" className="text-[#4A5568] hover:text-[#1A3D2B] text-sm">← Vissza</Link>
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Új kutya feltöltése</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#E2E8F0] p-8 space-y-8">
        {/* Basic info */}
        <section>
          <h2 className="font-bold text-[#1C1C1C] mb-4">Alapadatok</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Név *</label>
              <input type="text" value={form.name} onChange={e => setField("name", e.target.value)} required className={inputClass} placeholder="pl. Bodri" />
            </div>
            <div>
              <label className={labelClass}>Fajta</label>
              <input type="text" value={form.breed} onChange={e => setField("breed", e.target.value)} className={inputClass} placeholder="pl. Labrador" />
            </div>
            <div>
              <label className={labelClass}>Szín</label>
              <input type="text" value={form.color} onChange={e => setField("color", e.target.value)} className={inputClass} placeholder="pl. Arany" />
            </div>
            <div>
              <label className={labelClass}>Nem *</label>
              <select value={form.gender} onChange={e => setField("gender", e.target.value)} required className={inputClass}>
                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Méret *</label>
              <select value={form.size} onChange={e => setField("size", e.target.value)} required className={inputClass}>
                {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Kor (év)</label>
              <input type="number" min="0" max="30" value={form.age_years} onChange={e => setField("age_years", e.target.value)} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Kor (hónap)</label>
              <select value={form.age_months} onChange={e => setField("age_months", e.target.value)} className={inputClass}>
                {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Ország</label>
              <select value={form.country} onChange={e => setField("country", e.target.value)} className={inputClass}>
                {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Város</label>
              <input type="text" value={form.city} onChange={e => setField("city", e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Leírás</label>
              <textarea value={form.description} onChange={e => setField("description", e.target.value)} rows={4} className={inputClass} placeholder="Mesélj a kutyáról..." />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Fotó</label>
              <DogImageUpload partnerId={partnerId} value={form.primary_image_url} onChange={url => setField("primary_image_url", url)} />
            </div>
          </div>

          <label className={`${checkboxClass} mt-3`}>
            <input type="checkbox" checked={form.mixed_breed} onChange={e => setField("mixed_breed", e.target.checked)} className="w-4 h-4 accent-[#1A3D2B]" />
            Keverék kutya
          </label>
        </section>

        {/* Health */}
        <section>
          <h2 className="font-bold text-[#1C1C1C] mb-4">Egészségügyi adatok</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["is_vaccinated", "Oltott"],
              ["is_neutered", "Ivartalanított"],
              ["is_chipped", "Chipes"],
              ["is_dewormed", "Féreghajtott"],
            ].map(([field, label]) => (
              <label key={field} className={checkboxClass}>
                <input type="checkbox" checked={form[field as keyof typeof form] as boolean} onChange={e => setField(field, e.target.checked)} className="w-4 h-4 accent-[#1A3D2B]" />
                {label}
              </label>
            ))}
          </div>
        </section>

        {/* Compatibility */}
        <section>
          <h2 className="font-bold text-[#1C1C1C] mb-4">Kompatibilitás</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["is_transportable", "Szállítható"],
              ["good_with_kids", "Gyerekekkel is"],
              ["good_with_dogs", "Más kutyákkal is"],
              ["good_with_cats", "Macskákkal is"],
            ].map(([field, label]) => (
              <label key={field} className={checkboxClass}>
                <input type="checkbox" checked={form[field as keyof typeof form] as boolean} onChange={e => setField(field, e.target.checked)} className="w-4 h-4 accent-[#1A3D2B]" />
                {label}
              </label>
            ))}
          </div>
        </section>

        {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

        <div className="flex gap-3">
          <Link href="/partner/dogs" className="flex-1 text-center border-2 border-[#E2E8F0] text-[#4A5568] hover:border-[#1A3D2B] font-semibold py-3 rounded-xl transition-colors">
            Mégse
          </Link>
          <button type="submit" disabled={loading} className="flex-1 bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
            {loading ? "Mentés..." : "Kutya feltöltése →"}
          </button>
        </div>
      </form>
    </div>
  );
}
