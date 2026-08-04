import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/bejelentkezes?redirect=/profil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#F7F8F5] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-6">Profilom</h1>
        <ProfileForm
          userId={user.id}
          email={user.email ?? ""}
          initialFullName={profile?.full_name ?? ""}
        />
      </div>
    </div>
  );
}
