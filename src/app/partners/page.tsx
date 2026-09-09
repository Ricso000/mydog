import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Partnereink – MyDog",
  description: "Böngészd a MyDog partner menhelyeit, állatorvosait és szolgáltatóit.",
};

const countryEmoji: Record<string, string> = {
  DE: "🇩🇪", HU: "🇭🇺", ES: "🇪🇸", FR: "🇫🇷", IT: "🇮🇹",
  NL: "🇳🇱", PL: "🇵🇱", AT: "🇦🇹", CZ: "🇨🇿", RO: "🇷🇴",
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

const PAGE_SIZE = 24;

interface PageProps {
  searchParams: Promise<{ type?: string; page?: string }>;
}

type PartnerRow = {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string | null;
  country: string | null;
  verified: boolean;
  logo_url: string | null;
};

export default async function PartnersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const type = sp.type ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  let partners: PartnerRow[] = [];
  let totalCount = 0;
  const countsByType: Record<string, number> = {};

  try {
    const supabase = await createClient();

    let query = supabase
      .from("partners")
      .select("id, name, slug, type, city, country, verified, logo_url", { count: "exact" })
      .eq("status", "approved")
      .order("name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    const typeList = type ? type.split(",").filter(Boolean) : [];
    if (typeList.length === 1) query = query.eq("type", typeList[0]);
    else if (typeList.length > 1) query = query.in("type", typeList);

    const { data, count } = await query;
    partners = (data ?? []) as PartnerRow[];
    totalCount = count ?? 0;

    const { data: allApproved } = await supabase
      .from("partners")
      .select("type")
      .eq("status", "approved");
    (allApproved ?? []).forEach((row) => {
      countsByType[row.type] = (countsByType[row.type] ?? 0) + 1;
    });
  } catch {
    partners = [];
  }

  const totalAll = Object.values(countsByType).reduce((a, b) => a + b, 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function typeUrl(t: string) {
    const params = new URLSearchParams();
    if (t) params.set("type", t);
    return `/partners${params.toString() ? `?${params.toString()}` : ""}`;
  }
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    params.set("page", String(p));
    return `/partners?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      <section className="bg-[#1A3D2B] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#52B788] uppercase tracking-wider mb-3">
            Partnereink
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            Menhelyek, állatorvosok és szolgáltatók
          </h1>
          <p className="text-[#A7C4A3] text-base max-w-2xl mx-auto">
            {totalAll} regisztrált partner Európa-szerte.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Type filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href={typeUrl("")}
            className={`text-sm font-semibold px-4 py-2 rounded-full border transition-colors ${
              !type
                ? "bg-[#1B4D2F] text-white border-[#1B4D2F]"
                : "bg-white text-[#4A5568] border-[#E2E8F0] hover:border-[#3D7A3D]"
            }`}
          >
            Összes ({totalAll})
          </Link>
          {Object.entries(partnerTypeLabel).map(([t, label]) => (
            <Link
              key={t}
              href={typeUrl(t)}
              className={`text-sm font-semibold px-4 py-2 rounded-full border transition-colors ${
                type === t
                  ? "bg-[#1B4D2F] text-white border-[#1B4D2F]"
                  : "bg-white text-[#4A5568] border-[#E2E8F0] hover:border-[#3D7A3D]"
              }`}
            >
              {label} ({countsByType[t] ?? 0})
            </Link>
          ))}
        </div>

        {partners.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-bold text-[#1C1C1C] mb-2">Nincs találat</h2>
            <p className="text-[#4A5568]">Próbálj más szűrővel keresni.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {partners.map((partner) => {
              const emoji = partner.country ? (countryEmoji[partner.country] ?? "") : "";
              return (
                <Link
                  key={partner.id}
                  href={`/partners/${partner.slug}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0] flex flex-col"
                >
                  <div className="relative h-32 w-full bg-[#E8F5E9]">
                    {partner.logo_url ? (
                      <Image
                        src={partner.logo_url}
                        alt={partner.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🏠</div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#E8F5E9] text-[#1A3D2B] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {partnerTypeLabel[partner.type] ?? partner.type}
                      </span>
                      {partner.verified && (
                        <span className="text-[#3D7A3D] text-xs" title="Ellenőrzött partner">✓ Ellenőrzött</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#1C1C1C] mb-1">{partner.name}</h3>
                    <p className="text-xs text-[#4A5568] mt-auto">
                      {emoji} {partner.city ?? ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={pageUrl(p)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold ${
                  p === page
                    ? "bg-[#1B4D2F] text-white"
                    : "bg-white border border-[#E2E8F0] text-[#4A5568] hover:border-[#3D7A3D]"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
