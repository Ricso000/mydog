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

const partnerTypeLabel: Record<string, string> = {
  shelter: "Menhely",
  breed_rescue: "Fajtamentő",
  veterinarian: "Állatorvos",
  dog_school: "Kutyaiskola",
  boarding: "Panzió",
  grooming: "Kutyakozmetika",
  walker: "Kutyasétáltató",
  dog_friendly_place: "Kutyabarát hely",
  transport: "Szállítás",
  other: "Egyéb",
};

function formatAge(age_years: number | null, age_months: number | null): string {
  if (age_years === null && age_months === null) return "Ismeretlen kor";
  if ((age_years ?? 0) === 0 && (age_months ?? 0) > 0) return `${age_months} hónapos`;
  if ((age_months ?? 0) === 6) return `${age_years}.5 éves`;
  return `${age_years} éves`;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: partner } = await supabase
    .from("partners")
    .select("name, description, city, country")
    .eq("slug", slug)
    .single();
  if (!partner) return { title: "Partner nem található – MyDog" };
  return {
    title: `${partner.name} – MyDog Partner`,
    description:
      partner.description ?? `${partner.name} – kutyaadoptions és mentések`,
    openGraph: {
      title: partner.name,
      description: partner.description ?? "",
    },
  };
}

export default async function PartnerProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!partner) notFound();

  const { data: dogs } = await supabase
    .from("dogs")
    .select(
      "id, name, breed, age_years, age_months, gender, size, primary_image_url, country, city"
    )
    .eq("partner_id", partner.id)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(12);

  const emoji = partner.country ? (countryEmoji[partner.country] ?? "") : "";
  const cName = partner.country
    ? (countryName[partner.country] ?? partner.country)
    : "";
  const typeLabel = partnerTypeLabel[partner.type] ?? partner.type;

  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {/* Cover */}
      <div className="relative h-56 w-full">
        {partner.cover_url ? (
          <Image
            src={partner.cover_url}
            alt={`${partner.name} borítókép`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1A3D2B] to-[#3D7A3D]" />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo + basic info */}
        <div className="relative -mt-12 mb-6 flex items-end gap-5">
          <div className="w-24 h-24 rounded-2xl border-4 border-white bg-[#E8F5E9] flex items-center justify-center text-4xl shadow-md overflow-hidden shrink-0">
            {partner.logo_url ? (
              <Image
                src={partner.logo_url}
                alt={`${partner.name} logó`}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              "🏠"
            )}
          </div>
          <div className="pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-[#1C1C1C]">{partner.name}</h1>
              {partner.verified && (
                <span className="bg-[#E8F5E9] text-[#1A3D2B] text-xs font-semibold px-2 py-0.5 rounded-full">
                  ✓ Ellenőrzött
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="bg-[#F7F8F5] border border-[#E2E8F0] text-[#4A5568] text-xs px-2 py-0.5 rounded-full">
                {typeLabel}
              </span>
              {partner.country && (
                <span className="text-sm text-[#4A5568]">
                  {emoji} {partner.city ? `${partner.city}, ` : ""}
                  {cName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {partner.description && (
              <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                <h2 className="text-lg font-bold text-[#1C1C1C] mb-3">Rólunk</h2>
                <p className="text-[#4A5568] text-sm leading-relaxed">{partner.description}</p>
              </section>
            )}

            {/* Available dogs */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1C1C1C]">
                  Örökbefogadható kutyák{" "}
                  {dogs && dogs.length > 0 && (
                    <span className="text-sm font-normal text-[#4A5568]">({dogs.length})</span>
                  )}
                </h2>
              </div>
              {!dogs || dogs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center">
                  <div className="text-4xl mb-3">🐾</div>
                  <p className="text-[#4A5568]">Jelenleg nincs örökbefogadható kutya.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {dogs.map((dog) => {
                    const dEmoji = dog.country ? (countryEmoji[dog.country] ?? "") : "";
                    const dAge = formatAge(dog.age_years ?? null, dog.age_months ?? null);
                    const dGender = dog.gender ? (genderLabel[dog.gender] ?? dog.gender) : "";
                    const dSize = dog.size ? (sizeLabel[dog.size] ?? dog.size) : "";
                    const dImg =
                      dog.primary_image_url ??
                      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&auto=format&q=80";
                    return (
                      <div
                        key={dog.id}
                        className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] hover:shadow-md transition-shadow"
                      >
                        <div className="relative h-44 w-full">
                          <Image
                            src={dImg}
                            alt={`${dog.name} – ${dog.breed ?? "kutya"}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 50vw"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-base font-bold text-[#1C1C1C] mb-0.5">{dog.name}</h3>
                          <p className="text-xs text-[#4A5568] mb-0.5">
                            {dAge} · {dGender} · {dSize}
                          </p>
                          <p className="text-xs text-[#4A5568] mb-3">
                            {dog.breed ?? "Keverék"} {dEmoji && `· ${dEmoji} ${dog.city ?? ""}`}
                          </p>
                          <Link
                            href={`/kutyak/${dog.id}`}
                            className="block w-full text-center bg-[#E8F5E9] hover:bg-[#1B4D2F] hover:text-white text-[#1A3D2B] font-semibold py-2 rounded-xl transition-colors text-sm"
                          >
                            Megnézem
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Contact card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <h2 className="text-base font-bold text-[#1C1C1C] mb-4">Elérhetőség</h2>
              <div className="space-y-3 text-sm text-[#4A5568]">
                {partner.phone && (
                  <div className="flex items-start gap-2">
                    <span>📞</span>
                    <a href={`tel:${partner.phone}`} className="hover:text-[#1A3D2B]">
                      {partner.phone}
                    </a>
                  </div>
                )}
                {partner.email && (
                  <div className="flex items-start gap-2">
                    <span>✉️</span>
                    <a href={`mailto:${partner.email}`} className="hover:text-[#1A3D2B] break-all">
                      {partner.email}
                    </a>
                  </div>
                )}
                {partner.website && (
                  <div className="flex items-start gap-2">
                    <span>🌐</span>
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#1A3D2B] break-all"
                    >
                      {partner.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {partner.address && (
                  <div className="flex items-start gap-2">
                    <span>📍</span>
                    <span>{partner.address}</span>
                  </div>
                )}
                {!partner.phone && !partner.email && !partner.website && (
                  <p className="text-[#9CA3AF] text-xs">Nincs megadott elérhetőség.</p>
                )}
              </div>
            </div>

            <Link
              href="/kutyak"
              className="block text-center text-sm text-[#4A5568] hover:text-[#1A3D2B] border border-[#E2E8F0] bg-white rounded-2xl py-3 px-4 transition-colors"
            >
              ← Vissza a kutyák listájához
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
