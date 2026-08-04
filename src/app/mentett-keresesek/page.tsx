import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteSavedSearchButton from "@/components/DeleteSavedSearchButton";

function filtersToQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) return;
    params.set(key, value === true ? "1" : String(value));
  });
  return params.toString();
}

function filtersToLabel(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  if (filters.q) parts.push(`"${filters.q}"`);
  if (filters.country) parts.push(String(filters.country));
  if (filters.city) parts.push(String(filters.city));
  if (filters.size) parts.push(String(filters.size));
  if (filters.gender) parts.push(String(filters.gender));
  if (filters.age) parts.push(String(filters.age));
  if (filters.transportable) parts.push("szállítható");
  return parts.length > 0 ? parts.join(" · ") : "Összes kutya";
}

export default async function MentettKeresesekPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/bejelentkezes?redirect=/mentett-keresesek");

  const { data: searches } = await supabase
    .from("saved_searches")
    .select("id, filters, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#F7F8F5] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2">Mentett kereséseim</h1>
        <p className="text-sm text-[#4A5568] mb-6">
          Amikor egy új, a keresésednek megfelelő kutya kerül fel az oldalra, értesítést kapsz.
        </p>
        {!searches || searches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center text-[#4A5568]">
            <div className="text-4xl mb-3">🔍</div>
            Még nincs mentett keresésed.{" "}
            <Link href="/kutyak" className="text-[#1A3D2B] font-semibold hover:underline">Keress most</Link>.
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#1C1C1C]">{filtersToLabel(s.filters as Record<string, unknown>)}</p>
                  <p className="text-xs text-[#4A5568] mt-1">
                    Mentve: {new Date(s.created_at).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/kutyak?${filtersToQueryString(s.filters as Record<string, unknown>)}`}
                    className="bg-[#E8F5E9] hover:bg-[#1B4D2F] hover:text-white text-[#1A3D2B] font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                  >
                    Megnézem
                  </Link>
                  <DeleteSavedSearchButton id={s.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
