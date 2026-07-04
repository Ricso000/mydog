import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

const APP_STATUS_LABEL: Record<string, string> = {
  submitted: "Beküldve", under_review: "Vizsgálat alatt",
  approved: "Jóváhagyva", rejected: "Elutasítva", withdrawn: "Visszavonva",
};
const APP_STATUS_COLOR: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700", under_review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-700",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminApplicationsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("adoption_applications")
    .select("id, status, contact_name, contact_email, created_at, dog:dogs(name, breed), partner:partners(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (sp.status) query = query.eq("status", sp.status);

  const { data: applications, count } = await query.limit(50);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Örökbefogadási kérelmek</h1>
        <p className="text-[#4A5568] text-sm mt-0.5">{count ?? 0} kérelem</p>
      </div>

      {/* Status filters */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-6 flex flex-wrap gap-2">
        {["", "submitted", "under_review", "approved", "rejected", "withdrawn"].map(s => (
          <Link key={s || "all"} href={s ? `/admin/applications?status=${s}` : "/admin/applications"}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${sp.status === s || (!sp.status && !s) ? "bg-[#1A3D2B] text-white" : "bg-[#F7F8F5] text-[#4A5568] hover:bg-[#E8F5E9]"}`}>
            {s ? APP_STATUS_LABEL[s] : "Összes"}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F8F5] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568]">Kérelmező</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568] hidden sm:table-cell">Kutya</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568] hidden md:table-cell">Partner</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568]">Státusz</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568] hidden lg:table-cell">Dátum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {(applications ?? []).map(app => {
              const dog = Array.isArray(app.dog) ? app.dog[0] : app.dog;
              const partner = Array.isArray(app.partner) ? app.partner[0] : app.partner;
              return (
                <tr key={app.id} className="hover:bg-[#F7F8F5] transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-[#1C1C1C]">{app.contact_name ?? "Névtelen"}</div>
                    <div className="text-xs text-[#4A5568]">{app.contact_email}</div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <div className="text-sm text-[#1C1C1C]">{dog?.name ?? "–"}</div>
                    <div className="text-xs text-[#4A5568]">{dog?.breed ?? ""}</div>
                  </td>
                  <td className="px-5 py-3 text-[#4A5568] text-sm hidden md:table-cell">{partner?.name ?? "–"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${APP_STATUS_COLOR[app.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {APP_STATUS_LABEL[app.status] ?? app.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-[#4A5568] hidden lg:table-cell">
                    {new Date(app.created_at).toLocaleDateString("hu-HU")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(applications ?? []).length === 0 && <div className="text-center py-12 text-[#4A5568]">Nincs kérelem</div>}
      </div>
    </div>
  );
}
