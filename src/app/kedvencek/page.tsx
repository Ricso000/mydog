import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import FavoriteButton from "@/components/FavoriteButton";

export default async function KedvencekPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/bejelentkezes?redirect=/kedvencek");

  const { data: favoriteDogsData } = await supabase
    .from("favorite_dogs")
    .select("dog:dogs(id, name, breed, primary_image_url, city)")
    .eq("profile_id", user.id);

  const { data: favoritePartnersData } = await supabase
    .from("favorite_partners")
    .select("partner:partners(id, name, slug, city, country, verified)")
    .eq("profile_id", user.id);

  const dogs = (favoriteDogsData ?? [])
    .map((f) => (Array.isArray(f.dog) ? f.dog[0] : f.dog))
    .filter((d): d is NonNullable<typeof d> => !!d);

  const partners = (favoritePartnersData ?? [])
    .map((f) => (Array.isArray(f.partner) ? f.partner[0] : f.partner))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div className="min-h-screen bg-[#F7F8F5] py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-6">Kedvenceim</h1>

        <h2 className="text-lg font-bold text-[#1C1C1C] mb-4">Kutyák</h2>
        {dogs.length === 0 ? (
          <p className="text-[#4A5568] mb-10">
            Még nincs kedvenc kutyád.{" "}
            <Link href="/kutyak" className="text-[#1A3D2B] font-semibold hover:underline">Böngéssz a kutyák között</Link>.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {dogs.map((dog) => (
              <div key={dog.id} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <Link href={`/kutyak/${dog.id}`} className="block relative w-full h-40 bg-[#E8F5E9]">
                  {dog.primary_image_url && (
                    <Image src={dog.primary_image_url} alt={dog.name} fill className="object-cover" />
                  )}
                </Link>
                <div className="p-4 flex items-center justify-between gap-2">
                  <div>
                    <Link href={`/kutyak/${dog.id}`} className="font-bold text-[#1C1C1C] hover:text-[#1A3D2B]">{dog.name}</Link>
                    <p className="text-xs text-[#4A5568]">{dog.breed ?? "Keverék"} · {dog.city}</p>
                  </div>
                  <FavoriteButton dogId={dog.id} isLoggedIn={true} initialFavorited={true} variant="icon" />
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-lg font-bold text-[#1C1C1C] mb-4">Menhelyek</h2>
        {partners.length === 0 ? (
          <p className="text-[#4A5568]">
            Még nincs kedvenc menhelyed.{" "}
            <Link href="/menhelyek" className="text-[#1A3D2B] font-semibold hover:underline">Böngéssz a menhelyek között</Link>.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {partners.map((partner) => (
              <Link
                key={partner.id}
                href={`/partners/${partner.slug}`}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-4 hover:border-[#3D7A3D] transition-colors"
              >
                <p className="font-bold text-[#1C1C1C]">
                  {partner.name}
                  {partner.verified && <span className="ml-1.5 text-[#3D7A3D] text-xs">✓</span>}
                </p>
                <p className="text-xs text-[#4A5568]">{partner.city}, {partner.country}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
