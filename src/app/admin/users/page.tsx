import { requireAdmin } from "@/lib/admin";
import { UserRoleAction } from "@/components/admin/UserRoleAction";

export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin();

  const { data: users, count } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Felhasználók</h1>
        <p className="text-[#4A5568] text-sm mt-0.5">{count ?? 0} felhasználó</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F8F5] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568]">Felhasználó</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568]">Szerepkör</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568] hidden md:table-cell">Regisztrált</th>
              <th className="px-5 py-3 text-xs font-semibold text-[#4A5568]">Művelet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {(users ?? []).map(u => (
              <tr key={u.id} className="hover:bg-[#F7F8F5] transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium text-[#1C1C1C]">{u.full_name || "–"}</div>
                  <div className="text-xs text-[#4A5568] font-mono">{u.id.slice(0, 8)}…</div>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    u.role === "admin" ? "bg-purple-100 text-purple-700" :
                    u.role === "partner" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>{u.role}</span>
                </td>
                <td className="px-5 py-3 text-xs text-[#4A5568] hidden md:table-cell">
                  {new Date(u.created_at).toLocaleDateString("hu-HU")}
                </td>
                <td className="px-5 py-3">
                  <UserRoleAction userId={u.id} currentRole={u.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
