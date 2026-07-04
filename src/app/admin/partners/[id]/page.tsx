import { requireAdmin } from "@/lib/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PartnerActions } from "@/components/admin/PartnerActions";

const STATUS_LABEL: Record<string, string> = {
  draft: "Piszkozat", pending_review: "Jóváhagyásra vár",
  approved: "Jóváhagyott", rejected: "Elutasított", suspended: "Felfüggesztett",
};
const TYPE_LABEL: Record<string, string> = {
  shelter: "Menhely", breed_rescue: "Fajtamentő", veterinarian: "Állatorvos",
  dog_school: "Kutyaiskola", boarding: "Szálláshely", grooming: "Groomer",
  walker: "Sétáltató", dog_friendly_place: "Kutyabarát hely", transport: "Szállítás", other: "Egyéb",
};

export default async function AdminPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: partner }, { data: dogs }, { data: logs }] = await Promise.all([
    supabase.from("partners").select("*").eq("id", id).single(),
    supabase.from("dogs").select("id, name, breed, status, primary_image_url, created_at").eq("partner_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("activity_logs").select("id, action, metadata, created_at").eq("entity_type", "partner").eq("entity_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  if (!partner) notFound();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/partners" className="text-[#4A5568] hover:text-[#1A3D2B] text-sm">← Partnerek</Link>
        <h1 className="text-2xl font-bold text-[#1C1C1C]">{partner.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="font-bold text-[#1C1C1C] mb-4">Alapadatok</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {([
                ["Típus", TYPE_LABEL[partner.type] ?? partner.type],
                ["Ország", partner.country],
                ["Város", partner.city ?? "–"],
                ["Státusz", STATUS_LABEL[partner.status] ?? partner.status],
                ["Regisztrált", new Date(partner.created_at).toLocaleDateString("hu-HU")],
                ["Ellenőrzött", partner.verified ? "Igen" : "Nem"],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[#4A5568] text-xs">{k}</dt>
                  <dd className="font-medium text-[#1C1C1C]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {partner.description && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <h2 className="font-bold text-[#1C1C1C] mb-3">Bemutatkozás</h2>
              <p className="text-sm text-[#4A5568] leading-relaxed">{partner.description}</p>
            </div>
          )}

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="font-bold text-[#1C1C1C] mb-3">Kapcsolat</h2>
            <dl className="space-y-2 text-sm">
              {partner.email && <div><dt className="text-[#4A5568] text-xs">Email</dt><dd>{partner.email}</dd></div>}
              {partner.phone && <div><dt className="text-[#4A5568] text-xs">Telefon</dt><dd>{partner.phone}</dd></div>}
              {partner.website && (
                <div>
                  <dt className="text-[#4A5568] text-xs">Weboldal</dt>
                  <dd><a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-[#1A3D2B] hover:underline">{partner.website}</a></dd>
                </div>
              )}
            </dl>
          </div>

          {/* Dogs */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="font-bold text-[#1C1C1C] mb-4">Feltöltött kutyák ({dogs?.length ?? 0})</h2>
            <div className="space-y-2">
              {(dogs ?? []).map(d => (
                <div key={d.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F7F8F5] flex-shrink-0 relative">
                    {d.primary_image_url
                      ? <Image src={d.primary_image_url} alt={d.name} fill className="object-cover" sizes="32px" />
                      : <span className="flex items-center justify-center h-full text-sm">🐕</span>}
                  </div>
                  <span className="text-sm font-medium text-[#1C1C1C] flex-1">{d.name}</span>
                  <span className="text-xs text-[#4A5568]">{d.breed ?? "Keverék"}</span>
                  <Link href="/admin/dogs" className="text-xs text-[#1A3D2B] hover:underline">→</Link>
                </div>
              ))}
              {(dogs ?? []).length === 0 && <p className="text-sm text-[#4A5568]">Nincs feltöltött kutya.</p>}
            </div>
          </div>

          {/* Activity log */}
          {(logs ?? []).length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <h2 className="font-bold text-[#1C1C1C] mb-4">Előzmények</h2>
              <div className="space-y-2">
                {(logs ?? []).map(log => (
                  <div key={log.id} className="flex items-center gap-3 text-sm py-1">
                    <span className="text-[#4A5568] text-xs w-24 flex-shrink-0">{new Date(log.created_at).toLocaleDateString("hu-HU")}</span>
                    <span className="font-medium text-[#1C1C1C]">{log.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions sidebar */}
        <div>
          <PartnerActions partnerId={id} currentStatus={partner.status} />
        </div>
      </div>
    </div>
  );
}
