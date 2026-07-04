import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const countryEmoji: Record<string, string> = {
  DE: "🇩🇪", HU: "🇭🇺", ES: "🇪🇸", FR: "🇫🇷", IT: "🇮🇹",
  NL: "🇳🇱", PL: "🇵🇱", AT: "🇦🇹", CZ: "🇨🇿", RO: "🇷🇴",
};
const countryName: Record<string, string> = {
  DE: "Németország", HU: "Magyarország", ES: "Spanyolország",
  FR: "Franciaország", IT: "Olaszország", NL: "Hollandia",
  PL: "Lengyelország", AT: "Ausztria", CZ: "Csehország", RO: "Románia",
};
const genderLabel: Record<string, string> = { male: "Kan", female: "Szuka" };
const sizeLabel: Record<string, string> = {
  small: "Kis", medium: "Közepes", large: "Nagy", xlarge: "Óriás",
};

function formatAge(age_years: number | null, age_months: number | null): string {
  if (age_years === null && age_months === null) return "Ismeretlen kor";
  if ((age_years ?? 0) === 0 && (age_months ?? 0) > 0) return `${age_months} hónapos`;
  if ((age_months ?? 0) === 6) return `${age_years}.5 éves`;
  return `${age_years} éves`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: dog } = await supabase
    .from("dogs")
    .select("name, breed, description, primary_image_url, city, country")
    .eq("id", id)
    .single();
  if (!dog) return { title: "Kutya nem található – MyDog" };
  return {
    title: `${dog.name} – ${dog.breed ?? "Keverék"} | MyDog`,
    description:
      dog.description ??
      `${dog.name} örökbefogadásra vár ${dog.city ?? ""}, ${dog.country ?? ""}`,
    openGraph: {
      title: `${dog.name} örökbefogadásra vár`,
      description: dog.description ?? `${dog.name} – ${dog.breed ?? "Keverék"}`,
      images: dog.primary_image_url ? [{ url: dog.primary_image_url }] : [],
    },
  };
}

export default async function KutyaDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: dogData } = await supabase
    .from("dogs")
    .select("*, partner:partners(id, name, country, city, verified, slug, phone, email)")
    .eq("id", id)
    .single();

  if (!dogData) {
    notFound();
  }

  const dog = {
    ...dogData,
    partner: Array.isArray(dogData.partner)
      ? (dogData.partner[0] ?? null)
      : dogData.partner,
  };

  // Fetch media
  const { data: mediaData } = await supabase
    .from("media")
    .select("url, alt_text, sort_order")
    .eq("entity_type", "dog")
    .eq("entity_id", id)
    .order("sort_order");

  const staticThumbnails = [
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=160&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=160&fit=crop&auto=format&q=75&sat=-30",
    "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=160&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=200&h=160&fit=crop&auto=format&q=80",
  ];

  const images = mediaData && mediaData.length > 0 ? mediaData.map((m) => m.url) : [];
  const thumbnails =
    images.length > 0
      ? images
      : dog.primary_image_url
      ? [dog.primary_image_url, ...staticThumbnails.slice(1)]
      : staticThumbnails;

  const mainImage = thumbnails[0] ?? staticThumbnails[0];

  // Similar dogs
  const { data: similarDogs } = await supabase
    .from("dogs")
    .select("id, name, breed, age_years, age_months, gender, primary_image_url")
    .eq("status", "available")
    .neq("id", id)
    .eq("size", dog.size ?? "medium")
    .limit(3);

  const emoji = dog.country ? (countryEmoji[dog.country] ?? "") : "";
  const cName = dog.country ? (countryName[dog.country] ?? dog.country) : "";
  const ageStr = formatAge(dog.age_years ?? null, dog.age_months ?? null);
  const gStr = dog.gender ? (genderLabel[dog.gender] ?? dog.gender) : "";
  const sStr = dog.size ? (sizeLabel[dog.size] ?? dog.size) : "";

  const infoRows = [
    { label: "Oltva", value: dog.is_vaccinated ? "Igen" : "Nem" },
    { label: "Ivartalanítva", value: dog.is_neutered ? "Igen" : "Nem" },
    { label: "Chipelve", value: dog.is_chipped ? "Igen" : "Nem" },
    { label: "Féreghajtva", value: dog.is_dewormed ? "Igen" : "Nem" },
    { label: "Kor", value: ageStr },
    { label: "Méret", value: sStr },
  ];

  const badges = [
    sStr && `${sStr} méretű`,
    dog.is_transportable && "Szállítható",
    dog.good_with_kids && "Gyerekek mellé is",
    dog.good_with_dogs && "Más kutyákkal is",
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/kutyak"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#4A5568] hover:text-[#1A3D2B] mb-8 transition-colors"
        >
          ← Vissza a kereséshez
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left – Photo */}
          <div>
            <div className="relative rounded-3xl overflow-hidden h-[450px] shadow-sm mb-4">
              <Image
                src={mainImage}
                alt={`${dog.name} kutya fotó`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {thumbnails.slice(0, 4).map((src, i) => (
                <div
                  key={i}
                  className={`relative rounded-xl overflow-hidden h-20 cursor-pointer border-2 ${
                    i === 0 ? "border-[#1A3D2B]" : "border-transparent"
                  } hover:border-[#3D7A3D] transition-colors`}
                >
                  <Image
                    src={src}
                    alt={`${dog.name} fotó ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right – Details */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-[#3D7A3D] mb-1">
                  {emoji} {dog.city}, {cName}
                </p>
                <h1 className="text-4xl font-bold text-[#1C1C1C] mb-2">{dog.name}</h1>
                <p className="text-[#4A5568]">
                  {ageStr} · {gStr} · {sStr} méretű
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#4A5568] hover:text-red-500 hover:border-red-300 transition-colors"
                  aria-label="Kedvencekhez"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
                <button
                  className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#4A5568] hover:border-[#3D7A3D] transition-colors"
                  aria-label="Megosztás"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="bg-[#E8F5E9] text-[#1A3D2B] text-sm font-medium px-3 py-1.5 rounded-full"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {dog.partner && (
              <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-xl">
                  🏠
                </div>
                <div>
                  <p className="text-xs text-[#4A5568]">Menhely</p>
                  <p className="font-semibold text-[#1C1C1C]">
                    {dog.partner.slug ? (
                      <Link
                        href={`/partners/${dog.partner.slug}`}
                        className="hover:text-[#3D7A3D] transition-colors"
                      >
                        {dog.partner.name}
                      </Link>
                    ) : (
                      dog.partner.name
                    )}
                    {dog.partner.verified && (
                      <span className="ml-1.5 text-[#3D7A3D] text-xs">✓ Ellenőrzött</span>
                    )}
                  </p>
                  <p className="text-xs text-[#4A5568]">
                    {dog.partner.country
                      ? `${countryEmoji[dog.partner.country] ?? ""} ${dog.partner.city ?? ""}, ${
                          countryName[dog.partner.country] ?? dog.partner.country
                        }`
                      : dog.partner.city}
                  </p>
                </div>
              </div>
            )}

            {dog.description && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[#1C1C1C] mb-3">Rólam</h2>
                <p className="text-[#4A5568] leading-relaxed text-sm">{dog.description}</p>
              </div>
            )}

            <div className="bg-[#F7F8F5] rounded-2xl p-5 mb-6">
              <h2 className="text-base font-bold text-[#1C1C1C] mb-4">Információk</h2>
              <div className="grid grid-cols-2 gap-3">
                {infoRows.map((info) => (
                  <div key={info.label} className="flex items-center gap-2">
                    <span className="text-[#3D7A3D] text-sm">✓</span>
                    <span className="text-sm text-[#4A5568]">
                      <span className="font-medium">{info.label}:</span> {info.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/kutyak/${dog.id}/kapcsolat`}
                className="w-full text-center bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-4 rounded-2xl transition-colors"
              >
                Kapcsolatfelvétel a menhellyel
              </Link>
              <button className="w-full border-2 border-[#1A3D2B] text-[#1A3D2B] hover:bg-[#E8F5E9] font-semibold py-3.5 rounded-2xl transition-colors">
                Kedvencekhez adom ♡
              </button>
            </div>
          </div>
        </div>

        {/* Similar dogs */}
        {similarDogs && similarDogs.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-[#1C1C1C] mb-6">Hasonló kutyák</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similarDogs.map((s) => {
                const sAge = formatAge(s.age_years ?? null, s.age_months ?? null);
                const sGender = s.gender ? (genderLabel[s.gender] ?? s.gender) : "";
                const sImg =
                  s.primary_image_url ??
                  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&auto=format&q=80";
                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-40 w-full">
                      <Image
                        src={sImg}
                        alt={`${s.name} – ${s.breed ?? "kutya"}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-bold text-[#1C1C1C] mb-0.5">{s.name}</h3>
                      <p className="text-xs text-[#4A5568] mb-3">
                        {sAge} · {sGender} · {s.breed ?? "Keverék"}
                      </p>
                      <Link
                        href={`/kutyak/${s.id}`}
                        className="block w-full text-center bg-[#E8F5E9] hover:bg-[#1B4D2F] hover:text-white text-[#1A3D2B] font-semibold py-2 rounded-xl transition-colors text-sm"
                      >
                        Megnézem
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
