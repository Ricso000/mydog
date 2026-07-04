import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { KutyakFilters } from "@/components/KutyakFilters";

export const metadata = {
  title: "Kutyák keresése – MyDog",
  description:
    "Találd meg az ideális kutyát! Böngészd az örökbefogadható kutyákat ország, fajta és kor szerint.",
};

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

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    country?: string;
    size?: string;
    gender?: string;
    age?: string;
    page?: string;
    sort?: string;
  }>;
}

type DogRow = {
  id: string;
  name: string;
  breed: string | null;
  age_years: number | null;
  age_months: number | null;
  gender: string | null;
  size: string | null;
  country: string | null;
  city: string | null;
  primary_image_url: string | null;
  partner: {
    name: string;
    country: string | null;
    city: string | null;
    verified: boolean;
    slug: string;
  } | null;
};

export default async function KutyakPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const q = sp.q ?? "";
  const country = sp.country ?? "";
  const size = sp.size ?? "";
  const gender = sp.gender ?? "";
  const age = sp.age ?? "";
  const sort = sp.sort ?? "newest";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  let dogs: DogRow[] = [];
  let totalCount = 0;

  try {
    const supabase = await createClient();

    let query = supabase
      .from("dogs")
      .select("id, name, breed, age_years, age_months, gender, size, country, city, primary_image_url, partner:partners(name, country, city, verified, slug)", {
        count: "exact",
      })
      .eq("status", "available");

    if (q) {
      query = query.or(`name.ilike.%${q}%,breed.ilike.%${q}%`);
    }
    if (country) {
      query = query.eq("country", country);
    }
    if (size) {
      query = query.eq("size", size);
    }
    if (gender) {
      query = query.eq("gender", gender);
    }
    if (age) {
      if (age === "puppy") {
        query = query.gte("age_years", 0).lte("age_years", 0);
      } else if (age === "young") {
        query = query.gte("age_years", 1).lte("age_years", 2);
      } else if (age === "adult") {
        query = query.gte("age_years", 3).lte("age_years", 6);
      } else if (age === "senior") {
        query = query.gte("age_years", 7);
      }
    }

    if (sort === "youngest") {
      query = query.order("age_years", { ascending: true });
    } else if (sort === "oldest") {
      query = query.order("age_years", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + PAGE_SIZE - 1);

    const { data, count, error } = await query;

    if (!error && data) {
      dogs = data.map((d) => ({
        ...d,
        partner: Array.isArray(d.partner) ? (d.partner[0] ?? null) : d.partner,
      })) as DogRow[];
      totalCount = count ?? 0;
    }
  } catch {
    // leave empty, show empty state
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Build URL helper preserving all current filters
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (country) params.set("country", country);
    if (size) params.set("size", size);
    if (gender) params.set("gender", gender);
    if (age) params.set("age", age);
    if (sort && sort !== "newest") params.set("sort", sort);
    params.set("page", String(p));
    return `/kutyak?${params.toString()}`;
  }

  // Build pagination page numbers
  const pageNumbers: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pageNumbers.push(i);
    }
    if (page < totalPages - 2) pageNumbers.push("...");
    pageNumbers.push(totalPages);
  }

  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters (Client Component) */}
          <aside className="lg:w-72 shrink-0">
            <Suspense
              fallback={
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 h-96 animate-pulse" />
              }
            >
              <KutyakFilters />
            </Suspense>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1C1C1C]">Kutyák keresése</h1>
                <p className="text-sm text-[#4A5568] mt-1">
                  Találatok: <strong>{totalCount} kutya</strong>
                </p>
              </div>
            </div>

            {dogs.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🐾</div>
                <h2 className="text-xl font-bold text-[#1C1C1C] mb-2">Nincs találat</h2>
                <p className="text-[#4A5568]">Próbálj más szűrőkkel keresni.</p>
                <Link
                  href="/kutyak"
                  className="mt-4 inline-block text-sm text-[#3D7A3D] hover:underline"
                >
                  Szűrők törlése
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {dogs.map((dog) => {
                  const emoji = dog.country ? (countryEmoji[dog.country] ?? "") : "";
                  const cName = dog.country ? (countryName[dog.country] ?? dog.country) : "";
                  const ageStr = formatAge(dog.age_years ?? null, dog.age_months ?? null);
                  const gStr = dog.gender ? (genderLabel[dog.gender] ?? dog.gender) : "";
                  const sStr = dog.size ? (sizeLabel[dog.size] ?? dog.size) : "";
                  const imgSrc =
                    dog.primary_image_url ??
                    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&auto=format&q=80";

                  return (
                    <div
                      key={dog.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0]"
                    >
                      <div className="relative h-48 w-full">
                        <Image
                          src={imgSrc}
                          alt={`${dog.name} – ${dog.breed ?? "kutya"}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-bold text-[#1C1C1C] mb-0.5">{dog.name}</h3>
                        <p className="text-xs text-[#4A5568] mb-0.5">
                          {ageStr} · {gStr} · {sStr}
                        </p>
                        <p className="text-xs text-[#4A5568] mb-0.5">{dog.breed ?? "Keverék"}</p>
                        <p className="text-xs text-[#4A5568] mb-1">
                          {emoji} {cName}
                        </p>
                        {dog.partner && (
                          <p className="text-xs mb-3">
                            {dog.partner.slug ? (
                              <Link
                                href={`/partners/${dog.partner.slug}`}
                                className="text-[#3D7A3D] hover:underline"
                              >
                                {dog.partner.name}
                              </Link>
                            ) : (
                              <span className="text-[#4A5568]">{dog.partner.name}</span>
                            )}
                          </p>
                        )}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                {page > 1 && (
                  <Link
                    href={pageUrl(page - 1)}
                    className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-[#E8F5E9] flex items-center justify-center text-sm font-medium"
                  >
                    ←
                  </Link>
                )}
                {pageNumbers.map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="text-[#4A5568] px-2">
                      ...
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={pageUrl(p as number)}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors flex items-center justify-center ${
                        p === page
                          ? "bg-[#1B4D2F] text-white"
                          : "border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-[#E8F5E9]"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
                {page < totalPages && (
                  <Link
                    href={pageUrl(page + 1)}
                    className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-[#E8F5E9] flex items-center justify-center text-sm font-medium"
                  >
                    →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
