import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const STATUS_LABEL: Record<string, string> = {
  available: "Elérhető", adopted: "Örökbefogadott",
  pending_review: "Jóváhagyás alatt", reserved: "Foglalt",
  not_available: "Nem elérhető",
};

const STATUS_COLOR: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  adopted: "bg-blue-100 text-blue-700",
  pending_review: "bg-amber-100 text-amber-700",
  reserved: "bg-purple-100 text-purple-700",
  not_available: "bg-gray-100 text-gray-700",
};

export default async function PartnerDogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/partner/login");

  const { data: membership } = await supabase
    .from("partner_members")
    .select("partner_id")
    .eq("profile_id", user.id)
    .single();

  if (!membership) redirect("/partner/dashboard");

  const { data: dogs } = await supabase
    .from("dogs")
    .select("id, name, breed, age_years, age_months, gender, size, status, primary_image_url, created_at")
    .eq("partner_id", membership.partner_id)
    .order("created_at", { ascending: false });

  const dogList = dogs ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1C]">Kutyáim</h1>
          <p className="text-[#4A5568] text-sm mt-0.5">{dogList.length} kutya</p>
        </div>
        <Link href="/partner/dogs/new" className="bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
          ➕ Új kutya
        </Link>
      </div>

      {dogList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-16 text-center">
          <div className="text-5xl mb-4">🐾</div>
          <p className="text-[#4A5568] mb-4">Még nincs feltöltött kutyád.</p>
          <Link href="/partner/dogs/new" className="bg-[#1B4D2F] text-white px-6 py-3 rounded-xl font-semibold text-sm">
            Első kutya feltöltése
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {dogList.map(dog => (
            <div key={dog.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#F7F8F5]">
                {dog.primary_image_url ? (
                  <Image src={dog.primary_image_url} alt={dog.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🐕</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-[#1C1C1C]">{dog.name}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[dog.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {STATUS_LABEL[dog.status] ?? dog.status}
                  </span>
                </div>
                <p className="text-sm text-[#4A5568]">
                  {dog.breed ?? "Ismeretlen fajta"} · {dog.age_years ?? 0} éves · {dog.gender === "male" ? "Kan" : "Szuka"}
                </p>
              </div>
              <Link
                href={`/partner/dogs/${dog.id}/edit`}
                className="text-sm font-medium text-[#1A3D2B] hover:underline flex-shrink-0"
              >
                Szerkesztés →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
