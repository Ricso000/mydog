import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();

  // Fetch all stats in parallel
  const [
    { count: totalPartners },
    { count: pendingPartners },
    { count: approvedPartners },
    { count: totalDogs },
    { count: availableDogs },
    { count: pendingApplications },
    { count: newUsers },
  ] = await Promise.all([
    supabase.from("partners").select("*", { count: "exact", head: true }),
    supabase.from("partners").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("partners").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("dogs").select("*", { count: "exact", head: true }),
    supabase.from("dogs").select("*", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("adoption_applications").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const stats = [
    { label: "Összes partner", value: totalPartners ?? 0, icon: "🏠", color: "bg-white" },
    { label: "Jóváhagyásra vár", value: pendingPartners ?? 0, icon: "⏳", color: "bg-amber-50", urgent: (pendingPartners ?? 0) > 0 },
    { label: "Jóváhagyott partner", value: approvedPartners ?? 0, icon: "✅", color: "bg-green-50" },
    { label: "Összes kutya", value: totalDogs ?? 0, icon: "🐾", color: "bg-white" },
    { label: "Elérhető kutya", value: availableDogs ?? 0, icon: "🐕", color: "bg-white" },
    { label: "Nyitott kérelem", value: pendingApplications ?? 0, icon: "📋", color: "bg-blue-50" },
    { label: "Új felhasználó (30 nap)", value: newUsers ?? 0, icon: "👤", color: "bg-white" },
  ];

  const quickActions = [
    { href: "/admin/partners?status=pending_review", label: "Partnerek jóváhagyása", icon: "🏠", desc: `${pendingPartners ?? 0} vár` },
    { href: "/admin/dogs", label: "Kutyák kezelése", icon: "🐾", desc: `${totalDogs ?? 0} kutya` },
    { href: "/admin/applications", label: "Kérelmek átnézése", icon: "📋", desc: `${pendingApplications ?? 0} nyitott` },
    { href: "/admin/users", label: "Felhasználók", icon: "👥", desc: "Szerepkör kezelés" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Admin áttekintés</h1>
        <p className="text-[#4A5568] text-sm mt-1">Platform statisztikák és gyors műveletek</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`${s.color} ${"urgent" in s && s.urgent ? "ring-2 ring-amber-400" : ""} rounded-2xl border border-[#E2E8F0] p-5`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold text-[#1A3D2B]">{s.value}</div>
            <div className="text-xs text-[#4A5568] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="font-bold text-[#1C1C1C] mb-4">Gyors műveletek</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map(a => (
          <Link key={a.href} href={a.href}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-md hover:border-[#3D7A3D] transition-all group">
            <div className="text-2xl mb-2">{a.icon}</div>
            <div className="font-semibold text-[#1C1C1C] group-hover:text-[#1A3D2B] text-sm">{a.label}</div>
            <div className="text-xs text-[#4A5568] mt-0.5">{a.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
