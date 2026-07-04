import { requireAdmin } from "@/lib/admin";

export default async function AdminActivityPage() {
  const { supabase } = await requireAdmin();

  const { data: logs } = await supabase
    .from("activity_logs")
    .select("id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Tevékenység napló</h1>
        <p className="text-[#4A5568] text-sm mt-0.5">Utolsó 100 esemény</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F8F5] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568]">Esemény</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568] hidden sm:table-cell">Entitás</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568]">Dátum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {(logs ?? []).map(log => (
              <tr key={log.id} className="hover:bg-[#F7F8F5] transition-colors">
                <td className="px-5 py-3 font-medium text-[#1C1C1C] font-mono text-xs">{log.action}</td>
                <td className="px-5 py-3 text-xs text-[#4A5568] hidden sm:table-cell">
                  {log.entity_type ?? "–"} {log.entity_id ? `/ ${log.entity_id.slice(0, 8)}…` : ""}
                </td>
                <td className="px-5 py-3 text-xs text-[#4A5568]">{new Date(log.created_at).toLocaleString("hu-HU")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(logs ?? []).length === 0 && <div className="text-center py-12 text-[#4A5568]">Nincs napló bejegyzés</div>}
      </div>
    </div>
  );
}
