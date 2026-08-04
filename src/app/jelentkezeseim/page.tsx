import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Beküldve",
  reviewing: "Folyamatban",
  approved: "Jóváhagyva",
  rejected: "Elutasítva",
  withdrawn: "Visszavonva",
};
const STATUS_COLOR: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-700",
};

export default async function JelentkezeseimPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/bejelentkezes?redirect=/jelentkezeseim");

  const { data: appsData } = await supabase
    .from("adoption_applications")
    .select("id, status, message, created_at, dog:dogs(id, name, primary_image_url)")
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false });

  const apps = (appsData ?? []).map((a) => ({
    ...a,
    dog: Array.isArray(a.dog) ? (a.dog[0] ?? null) : a.dog,
  }));

  return (
    <div className="min-h-screen bg-[#F7F8F5] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-6">Jelentkezéseim</h1>

        {apps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center text-[#4A5568]">
            <div className="text-4xl mb-3">📭</div>
            Még nem adtál be örökbefogadási jelentkezést.{" "}
            <Link href="/kutyak" className="text-[#1A3D2B] font-semibold hover:underline">Böngéssz a kutyák között</Link>.
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div>
                    {app.dog ? (
                      <Link href={`/kutyak/${app.dog.id}`} className="font-bold text-[#1C1C1C] hover:text-[#1A3D2B]">
                        {app.dog.name}
                      </Link>
                    ) : (
                      <span className="font-bold text-[#1C1C1C]">Kutya törölve</span>
                    )}
                    <p className="text-xs text-[#4A5568] mt-1">
                      {new Date(app.created_at).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[app.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {STATUS_LABEL[app.status] ?? app.status}
                  </span>
                </div>
                {app.message && (
                  <p className="text-sm text-[#4A5568] bg-[#F7F8F5] rounded-xl px-4 py-3 whitespace-pre-wrap mt-2">{app.message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
