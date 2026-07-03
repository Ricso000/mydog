import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  draft: "Piszkozat",
  pending_review: "Jóváhagyás alatt",
  approved: "Jóváhagyott",
  rejected: "Visszautasított",
  suspended: "Felfüggesztett",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-orange-100 text-orange-700",
};

export default async function PartnerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/partner/login");

  // Get partner via partner_members
  const { data: membership } = await supabase
    .from("partner_members")
    .select("partner_id, role, partner:partners(*)")
    .eq("profile_id", user.id)
    .single();

  if (!membership) {
    return (
      <div className="text-center py-20">
        <p className="text-[#4A5568] mb-4">Még nincs partner profilod.</p>
        <Link href="/partner/register" className="bg-[#1B4D2F] text-white px-6 py-3 rounded-xl font-semibold">
          Partner profil létrehozása
        </Link>
      </div>
    );
  }

  // Handle partner being returned as array or object depending on Supabase version
  const partnerRaw = membership.partner as unknown;
  const partner = (Array.isArray(partnerRaw) ? partnerRaw[0] : partnerRaw) as Record<string, unknown>;

  // Dog stats
  const { data: dogs } = await supabase
    .from("dogs")
    .select("id, status")
    .eq("partner_id", partner.id as string);

  const total = dogs?.length ?? 0;
  const available = dogs?.filter(d => d.status === "available").length ?? 0;
  const pending = dogs?.filter(d => d.status === "pending_review").length ?? 0;

  const partnerStatus = partner.status as string;
  const statusLabel = STATUS_LABEL[partnerStatus] ?? partnerStatus;
  const statusColor = STATUS_COLOR[partnerStatus] ?? "bg-gray-100 text-gray-700";

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Üdvözöljük, {partner.name as string}!</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
          {partnerStatus !== "approved" && (
            <span className="text-xs text-[#4A5568]">— a profil jóváhagyása folyamatban</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Összes kutya", value: total, icon: "🐾" },
          { label: "Elérhető", value: available, icon: "✅" },
          { label: "Jóváhagyás alatt", value: pending, icon: "⏳" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-3xl font-bold text-[#1A3D2B]">{stat.value}</div>
            <div className="text-sm text-[#4A5568] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="font-bold text-[#1C1C1C] mb-4">Gyors műveletek</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { href: "/partner/dogs/new", icon: "➕", label: "Új kutya feltöltése", desc: "Adj hozzá egy új kutyát a rendszerhez" },
          { href: "/partner/dogs", icon: "🐾", label: "Kutyáim kezelése", desc: `${total} kutya a profilodon` },
          { href: "/partner/profile", icon: "⚙️", label: "Profil szerkesztése", desc: "Szervezeti adatok frissítése" },
          ...(partnerStatus === "approved" ? [{ href: `/menhelyek/${partner.slug as string}`, icon: "👁️", label: "Publikus profil", desc: "Így látják a látogatók" }] : []),
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-md hover:border-[#3D7A3D] transition-all group"
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <div className="font-semibold text-[#1C1C1C] group-hover:text-[#1A3D2B]">{action.label}</div>
            <div className="text-sm text-[#4A5568] mt-0.5">{action.desc}</div>
          </Link>
        ))}
      </div>

      {partnerStatus === "draft" && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="font-semibold text-amber-800 mb-1">A partner profil jóváhagyásra vár</p>
          <p className="text-sm text-amber-700">A feltöltött kutyák csak az admin jóváhagyása után jelennek meg a publikus keresőben. Töltsd ki a profilt minél részletesebben!</p>
        </div>
      )}
    </div>
  );
}
