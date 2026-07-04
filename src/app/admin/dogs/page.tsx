import { requireAdmin } from "@/lib/admin";
import Image from "next/image";
import Link from "next/link";
import { DogStatusAction } from "@/components/admin/DogStatusAction";

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

const DOG_STATUS_LABEL: Record<string, string> = {
  available: "Elérhető", adopted: "Örökbefogadott",
  reserved: "Foglalt", not_available: "Nem elérhető",
};
const DOG_STATUS_COLOR: Record<string, string> = {
  available: "bg-green-100 text-green-700", adopted: "bg-blue-100 text-blue-700",
  reserved: "bg-purple-100 text-purple-700", not_available: "bg-gray-100 text-gray-700",
};

export default async function AdminDogsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("dogs")
    .select("id, name, breed, status, primary_image_url, created_at, partner:partners(id, name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);

  const { data: dogs, count } = await query.limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1C]">Kutyák</h1>
          <p className="text-[#4A5568] text-sm mt-0.5">{count ?? 0} kutya</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-6 flex flex-wrap gap-2">
        {["", "available", "adopted", "reserved", "not_available"].map(s => (
          <Link key={s || "all"} href={s ? `/admin/dogs?status=${s}` : "/admin/dogs"}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${sp.status === s || (!sp.status && !s) ? "bg-[#1A3D2B] text-white" : "bg-[#F7F8F5] text-[#4A5568] hover:bg-[#E8F5E9]"}`}>
            {s ? DOG_STATUS_LABEL[s] : "Összes"}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F8F5] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568]">Kutya</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568] hidden sm:table-cell">Partner</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568]">Státusz</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568] hidden lg:table-cell">Feltöltve</th>
              <th className="px-5 py-3 text-xs font-semibold text-[#4A5568]">Művelet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {(dogs ?? []).map(dog => {
              const partner = Array.isArray(dog.partner) ? dog.partner[0] : dog.partner;
              return (
                <tr key={dog.id} className="hover:bg-[#F7F8F5] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#F7F8F5] flex-shrink-0">
                        {dog.primary_image_url
                          ? <Image src={dog.primary_image_url} alt={dog.name} fill className="object-cover" sizes="40px" />
                          : <div className="flex items-center justify-center h-full text-lg">🐕</div>}
                      </div>
                      <div>
                        <div className="font-medium text-[#1C1C1C]">{dog.name}</div>
                        <div className="text-xs text-[#4A5568]">{dog.breed ?? "Keverék"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[#4A5568] hidden sm:table-cell text-xs">{partner?.name ?? "–"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOG_STATUS_COLOR[dog.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {DOG_STATUS_LABEL[dog.status] ?? dog.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-[#4A5568] hidden lg:table-cell">{new Date(dog.created_at).toLocaleDateString("hu-HU")}</td>
                  <td className="px-5 py-3">
                    <DogStatusAction dogId={dog.id} currentStatus={dog.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(dogs ?? []).length === 0 && <div className="text-center py-12 text-[#4A5568]">Nincs találat</div>}
      </div>
    </div>
  );
}
