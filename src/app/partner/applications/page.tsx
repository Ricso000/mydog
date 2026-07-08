"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Beküldve", reviewing: "Folyamatban",
  approved: "Jóváhagyva", rejected: "Elutasítva", withdrawn: "Visszavonva",
};
const STATUS_COLOR: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700", reviewing: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-700",
};
// withdrawn is applicant-initiated — partners only move between these
const PARTNER_STATUSES = ["submitted", "reviewing", "approved", "rejected"];

type AppRow = {
  id: string;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  message: string | null;
  created_at: string;
  dog: { id: string; name: string } | null;
};

export default function PartnerApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [filter, setFilter] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/partner/login"); return; }
    const { data: m } = await supabase.from("partner_members").select("partner_id").eq("profile_id", user.id).single();
    if (!m) { router.push("/partner/dashboard"); return; }

    const { data, error: fetchError } = await supabase
      .from("adoption_applications")
      .select("id, status, contact_name, contact_email, contact_phone, message, created_at, dog:dogs(id, name)")
      .eq("partner_id", m.partner_id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Nem sikerült betölteni a jelentkezéseket.");
    } else {
      setApps((data ?? []).map((a) => ({
        ...a,
        dog: Array.isArray(a.dog) ? (a.dog[0] ?? null) : a.dog,
      })) as AppRow[]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(id: string, status: string) {
    setSavingId(id);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("adoption_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) {
      setError("Nem sikerült a státusz módosítása: " + updateError.message);
    } else {
      setApps((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
    }
    setSavingId(null);
  }

  const filtered = filter ? apps.filter((a) => a.status === filter) : apps;
  const newCount = apps.filter((a) => a.status === "submitted").length;

  if (loading) return <div className="text-center py-20 text-[#4A5568]">Betöltés...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Jelentkezések</h1>
        {newCount > 0 && (
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
            {newCount} új
          </span>
        )}
      </div>
      <p className="text-sm text-[#4A5568] mb-6">A kutyáidra érkezett örökbefogadási jelentkezések.</p>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["", ...PARTNER_STATUSES].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === s ? "bg-[#1A3D2B] text-white" : "bg-white border border-[#E2E8F0] text-[#4A5568] hover:bg-[#E8F5E9]"
            }`}
          >
            {s ? STATUS_LABEL[s] : "Összes"}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl mb-4">{error}</p>}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center text-[#4A5568]">
          <div className="text-4xl mb-3">📭</div>
          {filter ? "Nincs jelentkezés ezzel a státusszal." : "Még nem érkezett jelentkezés a kutyáidra."}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#1C1C1C]">{app.contact_name ?? "Névtelen"}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[app.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABEL[app.status] ?? app.status}
                    </span>
                  </div>
                  <div className="text-sm text-[#4A5568] mt-1">
                    {app.dog ? (
                      <>Kutya: <Link href={`/kutyak/${app.dog.id}`} className="font-semibold text-[#1A3D2B] hover:underline">{app.dog.name}</Link></>
                    ) : "Kutya: törölve"}
                    {" · "}
                    {new Date(app.created_at).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                </div>
                <select
                  value={app.status}
                  disabled={savingId === app.id}
                  onChange={(e) => changeStatus(app.id, e.target.value)}
                  className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#4A5568] bg-white focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] disabled:opacity-60"
                >
                  {PARTNER_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                  {!PARTNER_STATUSES.includes(app.status) && (
                    <option value={app.status}>{STATUS_LABEL[app.status] ?? app.status}</option>
                  )}
                </select>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#4A5568] mb-3">
                {app.contact_email && (
                  <a href={`mailto:${app.contact_email}`} className="text-[#1A3D2B] hover:underline">✉️ {app.contact_email}</a>
                )}
                {app.contact_phone && (
                  <a href={`tel:${app.contact_phone}`} className="text-[#1A3D2B] hover:underline">📞 {app.contact_phone}</a>
                )}
              </div>

              {app.message && (
                <p className="text-sm text-[#4A5568] bg-[#F7F8F5] rounded-xl px-4 py-3 whitespace-pre-wrap">{app.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
