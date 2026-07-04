import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  draft: "Piszkozat", pending_review: "Jóváhagyásra vár",
  approved: "Jóváhagyott", rejected: "Elutasított", suspended: "Felfüggesztett",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700", pending_review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
  suspended: "bg-orange-100 text-orange-700",
};
const TYPE_LABEL: Record<string, string> = {
  shelter: "Menhely", breed_rescue: "Fajtamentő", veterinarian: "Állatorvos",
  dog_school: "Kutyaiskola", boarding: "Szálláshely", grooming: "Groomer",
  walker: "Sétáltató", dog_friendly_place: "Kutyabarát hely", transport: "Szállítás", other: "Egyéb",
};

interface PageProps {
  searchParams: Promise<{ status?: string; type?: string; q?: string }>;
}

export default async function AdminPartnersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("partners")
    .select("id, name, type, status, country, city, verified, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.type) query = query.eq("type", sp.type);
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);

  const { data: partners, count } = await query.limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1C]">Partnerek</h1>
          <p className="text-[#4A5568] text-sm mt-0.5">{count ?? 0} partner</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-6 flex flex-wrap gap-3">
        {["", "pending_review", "approved", "draft", "rejected", "suspended"].map(s => (
          <Link key={s || "all"} href={s ? `/admin/partners?status=${s}` : "/admin/partners"}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${sp.status === s || (!sp.status && !s) ? "bg-[#1A3D2B] text-white" : "bg-[#F7F8F5] text-[#4A5568] hover:bg-[#E8F5E9]"}`}>
            {s ? STATUS_LABEL[s] : "Összes"}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F8F5] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568]">Partner</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568] hidden sm:table-cell">Típus</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568] hidden md:table-cell">Ország</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568]">Státusz</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568] hidden lg:table-cell">Regisztrált</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {(partners ?? []).map(p => (
              <tr key={p.id} className="hover:bg-[#F7F8F5] transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium text-[#1C1C1C]">{p.name}</div>
                  {p.verified && <div className="text-xs text-[#3D7A3D]">✓ Ellenőrzött</div>}
                </td>
                <td className="px-5 py-3 text-[#4A5568] hidden sm:table-cell">{TYPE_LABEL[p.type] ?? p.type}</td>
                <td className="px-5 py-3 text-[#4A5568] hidden md:table-cell">{p.country}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-[#4A5568] text-xs hidden lg:table-cell">
                  {new Date(p.created_at).toLocaleDateString("hu-HU")}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/partners/${p.id}`} className="text-xs font-semibold text-[#1A3D2B] hover:underline">
                    Részletek →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(partners ?? []).length === 0 && (
          <div className="text-center py-12 text-[#4A5568]">Nincs találat</div>
        )}
      </div>
    </div>
  );
}
