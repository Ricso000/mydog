# Auto.de-ihletett fejlesztések Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring 3 auto.de-inspired improvements to the dog listing experience: trust badges on listing cards, a Country→City cascading filter, and a saved-search-with-notification subsystem.

**Architecture:** Two small, self-contained UI/query enhancements to the existing `/kutyak` page and filter component, plus one new subsystem (table + RLS + UI + DB triggers) reusing the `notifications` infrastructure built in the felhasznaloi-fiok plan's Task 10.

**Tech Stack:** Next.js 16.2.10 (App Router), React 19.2.4, TypeScript, Tailwind CSS v4, Supabase (Postgres/Auth), PL/pgSQL triggers.

## Global Constraints

- **This plan depends on the felhasznaloi-fiok plan's Task 10 being complete** (the `notifications` table's RLS and the `NotificationBell` component must already exist). Do not start Task 15 (or Task 14's Navbar edit) before confirming that.
- No test framework exists in this repo (only `npm run lint`, `npm run build`, `npm run dev`, `npm run start`). Every task's verification is: lint, build, and manual/static checks — same adaptation as the felhasznaloi-fiok plan.
- Match existing UI conventions exactly: color tokens `#1A3D2B`, `#1B4D2F`, `#3D7A3D`, `#4A5568`, `#E2E8F0`, `#F7F8F5`, `#E8F5E9`. All UI copy in Hungarian.
- Database migrations are applied manually via the Supabase Dashboard SQL Editor (confirmed project workflow). New migrations continue the existing numbering — the felhasznaloi-fiok plan's Task 10 adds `007_adoption_notifications.sql`, so this plan starts at `008_saved_searches.sql`.
- Login is currently platform-blocked project-wide pending a manual Supabase Dashboard step (a separate, already-flagged prerequisite in the felhasznaloi-fiok plan). Live logged-in verification is not possible until that's done — code/build/lint verification and static RLS/trigger-logic tracing substitute, exactly as established in that plan's Tasks 6-9.
- Do not modify `supabase/migrations/001_initial_schema.sql` through `007_adoption_notifications.sql` — new schema changes go in new `008_*.sql` / `009_*.sql` files.

---

### Task 11: Trust/compatibility badges on `/kutyak` listing cards

**Files:**
- Modify: `src/app/kutyak/page.tsx`

**Interfaces:**
- Consumes: existing `dogs` table columns `is_vaccinated`, `is_neutered`, `good_with_kids`, `good_with_dogs`, `good_with_cats` (all `boolean`, nullable — already exist, no migration needed).
- Produces: none consumed by later tasks in this plan.

- [ ] **Step 1: Add the new columns to the select query and the `DogRow` type**

Old (`src/app/kutyak/page.tsx`):
```tsx
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
```
New:
```tsx
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
  is_vaccinated: boolean | null;
  is_neutered: boolean | null;
  good_with_kids: boolean | null;
  good_with_dogs: boolean | null;
  good_with_cats: boolean | null;
  partner: {
    name: string;
    country: string | null;
    city: string | null;
    verified: boolean;
    slug: string;
  } | null;
};
```

Old:
```tsx
    let query = supabase
      .from("dogs")
      .select("id, name, breed, age_years, age_months, gender, size, country, city, primary_image_url, partner:partners(name, country, city, verified, slug)", {
        count: "exact",
      })
      .eq("status", "available");
```
New:
```tsx
    let query = supabase
      .from("dogs")
      .select("id, name, breed, age_years, age_months, gender, size, country, city, primary_image_url, is_vaccinated, is_neutered, good_with_kids, good_with_dogs, good_with_cats, partner:partners(name, country, city, verified, slug)", {
        count: "exact",
      })
      .eq("status", "available");
```

- [ ] **Step 2: Render the badges on each card**

Old:
```tsx
                        <p className="text-xs text-[#4A5568] mb-0.5">{dog.breed ?? "Keverék"}</p>
                        <p className="text-xs text-[#4A5568] mb-1">
                          {emoji} {cName}
                        </p>
                        {dog.partner && (
```
New:
```tsx
                        <p className="text-xs text-[#4A5568] mb-0.5">{dog.breed ?? "Keverék"}</p>
                        <p className="text-xs text-[#4A5568] mb-1">
                          {emoji} {cName}
                        </p>
                        {(dog.is_vaccinated || dog.is_neutered || dog.good_with_kids || dog.good_with_dogs || dog.good_with_cats) && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {dog.is_vaccinated && (
                              <span className="bg-[#E8F5E9] text-[#1A3D2B] text-[10px] font-semibold px-2 py-0.5 rounded-full">Oltva</span>
                            )}
                            {dog.is_neutered && (
                              <span className="bg-[#E8F5E9] text-[#1A3D2B] text-[10px] font-semibold px-2 py-0.5 rounded-full">Ivartalanítva</span>
                            )}
                            {dog.good_with_kids && (
                              <span className="bg-[#E8F5E9] text-[#1A3D2B] text-[10px] font-semibold px-2 py-0.5 rounded-full">Gyerekbarát</span>
                            )}
                            {dog.good_with_dogs && (
                              <span className="bg-[#E8F5E9] text-[#1A3D2B] text-[10px] font-semibold px-2 py-0.5 rounded-full">Kutyabarát</span>
                            )}
                            {dog.good_with_cats && (
                              <span className="bg-[#E8F5E9] text-[#1A3D2B] text-[10px] font-semibold px-2 py-0.5 rounded-full">Macskabarát</span>
                            )}
                          </div>
                        )}
                        {dog.partner && (
```

- [ ] **Step 3: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 4: Manual verification**

Run `npm run dev`, open `/kutyak`, confirm at least one card shows badges (check the Supabase `dogs` table for a row with `is_vaccinated = true` etc., or use the existing seed data — `supabase/seed.sql` likely has sample dogs with some flags set). Confirm cards for dogs with no flags set show no badge row (no empty gap).

- [ ] **Step 5: Commit**

```bash
git add src/app/kutyak/page.tsx
git commit -m "feat: show trust/compatibility badges on dog listing cards"
```

---

### Task 12: Ország → Város (Country → City) cascading filter on `/kutyak`

**Files:**
- Modify: `src/app/kutyak/page.tsx`
- Modify: `src/components/KutyakFilters.tsx`

**Interfaces:**
- Produces: `KutyakFilters` now requires a prop `{ citiesByCountry: Record<string, string[]> }`.

- [ ] **Step 1: Fetch the country→city map and apply the `city` filter in `page.tsx`**

Old (`PageProps` interface):
```tsx
interface PageProps {
  searchParams: Promise<{
    q?: string;
    country?: string;
    size?: string;
    gender?: string;
    age?: string;
    transportable?: string;
    page?: string;
    sort?: string;
  }>;
}
```
New:
```tsx
interface PageProps {
  searchParams: Promise<{
    q?: string;
    country?: string;
    city?: string;
    size?: string;
    gender?: string;
    age?: string;
    transportable?: string;
    page?: string;
    sort?: string;
  }>;
}
```

Old:
```tsx
  const q = sp.q ?? "";
  const country = sp.country ?? "";
  const size = sp.size ?? "";
```
New:
```tsx
  const q = sp.q ?? "";
  const country = sp.country ?? "";
  const city = sp.city ?? "";
  const size = sp.size ?? "";
```

Old:
```tsx
    if (country) {
      query = query.eq("country", country);
    }
    if (size) {
```
New:
```tsx
    if (country) {
      query = query.eq("country", country);
    }
    if (city) {
      query = query.eq("city", city);
    }
    if (size) {
```

Old (right after the main `dogs` query result is processed, before `const totalPages = ...`):
```tsx
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
```
New:
```tsx
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

  let citiesByCountry: Record<string, string[]> = {};
  try {
    const supabase = await createClient();
    const { data: cityRows } = await supabase
      .from("dogs")
      .select("country, city")
      .eq("status", "available")
      .not("city", "is", null);

    (cityRows ?? []).forEach((row) => {
      if (!row.country || !row.city) return;
      if (!citiesByCountry[row.country]) citiesByCountry[row.country] = [];
      if (!citiesByCountry[row.country].includes(row.city)) {
        citiesByCountry[row.country].push(row.city);
      }
    });
    Object.keys(citiesByCountry).forEach((c) => citiesByCountry[c].sort());
  } catch {
    citiesByCountry = {};
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
```

Old (`pageUrl` helper):
```tsx
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (country) params.set("country", country);
    if (size) params.set("size", size);
```
New:
```tsx
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (country) params.set("country", country);
    if (city) params.set("city", city);
    if (size) params.set("size", size);
```

Old (rendering `<KutyakFilters />`):
```tsx
            <Suspense
              fallback={
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 h-96 animate-pulse" />
              }
            >
              <KutyakFilters />
            </Suspense>
```
New:
```tsx
            <Suspense
              fallback={
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 h-96 animate-pulse" />
              }
            >
              <KutyakFilters citiesByCountry={citiesByCountry} />
            </Suspense>
```

- [ ] **Step 2: Add the City select to `KutyakFilters.tsx`, cascading from Country**

Old:
```tsx
export function KutyakFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [country, setCountry] = useState(sp.get("country") ?? "");
  const [size, setSize] = useState(sp.get("size") ?? "");
```
New:
```tsx
interface KutyakFiltersProps {
  citiesByCountry: Record<string, string[]>;
}

export function KutyakFilters({ citiesByCountry }: KutyakFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [country, setCountry] = useState(sp.get("country") ?? "");
  const [city, setCity] = useState(sp.get("city") ?? "");
  const [size, setSize] = useState(sp.get("size") ?? "");
```

Old (`apply` function):
```tsx
  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (country) params.set("country", country);
    if (size) params.set("size", size);
```
New:
```tsx
  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (country) params.set("country", country);
    if (city) params.set("city", city);
    if (size) params.set("size", size);
```

Old (`reset` function):
```tsx
  function reset() {
    setQ("");
    setCountry("");
    setSize("");
```
New:
```tsx
  function reset() {
    setQ("");
    setCountry("");
    setCity("");
    setSize("");
```

Old (Country select block):
```tsx
        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-[#4A5568] mb-2">Ország</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass}>
            <option value="">Összes ország</option>
            {countryOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Size */}
```
New:
```tsx
        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-[#4A5568] mb-2">Ország</label>
          <select
            value={country}
            onChange={(e) => { setCountry(e.target.value); setCity(""); }}
            className={selectClass}
          >
            <option value="">Összes ország</option>
            {countryOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* City (cascades from Country) */}
        {country && citiesByCountry[country] && citiesByCountry[country].length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-[#4A5568] mb-2">Város</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
              <option value="">Összes város</option>
              {citiesByCountry[country].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Size */}
```

- [ ] **Step 3: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 4: Manual verification**

Run `npm run dev`, open `/kutyak`. Select a country that has dogs with a `city` set — confirm a "Város" select appears with the right cities. Select a city and click "Szűrés" — confirm the URL gains a `city=` param and the results narrow accordingly. Switch country — confirm the city selection resets. Select a country with no cities (if any exist) — confirm no City select appears (no broken empty dropdown).

- [ ] **Step 5: Commit**

```bash
git add src/app/kutyak/page.tsx src/components/KutyakFilters.tsx
git commit -m "feat: add Country to City cascading filter on /kutyak"
```

---

### Task 13: `saved_searches` table + RLS

**Files:**
- Create: `supabase/migrations/008_saved_searches.sql`

**Interfaces:**
- Produces: `saved_searches` table (`id`, `profile_id`, `name`, `filters jsonb`, `created_at`), consumed by Task 14 (UI) and Task 15 (trigger).

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================
-- SAVED SEARCHES
-- ============================================================
create table saved_searches (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  name        text,
  filters     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index on saved_searches(profile_id);

alter table saved_searches enable row level security;

create policy "Users manage own saved searches" on saved_searches for all using (profile_id = auth.uid());
```

- [ ] **Step 2: Apply the migration manually**

Open the Supabase Dashboard → SQL Editor for this project → paste the contents of `supabase/migrations/008_saved_searches.sql` → Run.

Verify: `select * from saved_searches limit 1;` in the SQL Editor should return an empty result set with no error (confirms the table exists and is queryable).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/008_saved_searches.sql
git commit -m "feat: add saved_searches table with owner-only RLS"
```

---

### Task 14: "Mentés keresésként" button + `/mentett-keresesek` page

**Files:**
- Modify: `src/components/KutyakFilters.tsx`
- Create: `src/app/mentett-keresesek/page.tsx`
- Create: `src/components/DeleteSavedSearchButton.tsx`
- Modify: `src/proxy.ts`
- Modify: `src/components/Navbar.tsx`

**Interfaces:**
- Consumes: `saved_searches` table from Task 13.
- Produces: `/mentett-keresesek` route, protected by proxy; `DeleteSavedSearchButton` component, props `{ id: string }`.

- [ ] **Step 1: Add the save-search button to `KutyakFilters.tsx`**

Old (imports):
```tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
```
New:
```tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
```

Old (inside the component, after the existing state hooks — this comes after Task 12's `city` state hook):
```tsx
  const [transportable, setTransportable] = useState(sp.get("transportable") === "1");
  const [sort, setSort] = useState(sp.get("sort") ?? "newest");
```
New:
```tsx
  const [transportable, setTransportable] = useState(sp.get("transportable") === "1");
  const [sort, setSort] = useState(sp.get("sort") ?? "newest");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  async function saveSearch() {
    setSaving(true);
    setSaveMessage("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/bejelentkezes?redirect=/kutyak");
      return;
    }
    const filters = { q, country, city, size, gender, age, transportable };
    const { error } = await supabase.from("saved_searches").insert({ profile_id: user.id, filters });
    setSaveMessage(error ? "Nem sikerült menteni a keresést." : "Keresés elmentve.");
    setSaving(false);
  }
```

Old (the two buttons at the bottom of the filter panel):
```tsx
        <button
          onClick={apply}
          className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Szűrés
        </button>
        <button
          onClick={reset}
          className="w-full text-sm text-[#4A5568] hover:text-[#1A3D2B] underline"
        >
          Szűrők törlése
        </button>
```
New:
```tsx
        <button
          onClick={apply}
          className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Szűrés
        </button>
        <button
          onClick={saveSearch}
          disabled={saving}
          className="w-full border-2 border-[#1A3D2B] text-[#1A3D2B] hover:bg-[#E8F5E9] font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {saving ? "Mentés..." : "Mentés keresésként"}
        </button>
        {saveMessage && <p className="text-xs text-center text-[#4A5568]">{saveMessage}</p>}
        <button
          onClick={reset}
          className="w-full text-sm text-[#4A5568] hover:text-[#1A3D2B] underline"
        >
          Szűrők törlése
        </button>
```

- [ ] **Step 2: Create the delete button component**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DeleteSavedSearchButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("saved_searches").delete().eq("id", id);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-600 hover:underline disabled:opacity-60"
    >
      {loading ? "Törlés..." : "Törlés"}
    </button>
  );
}
```

- [ ] **Step 3: Create the `/mentett-keresesek` page**

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteSavedSearchButton from "@/components/DeleteSavedSearchButton";

function filtersToQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) return;
    params.set(key, String(value));
  });
  return params.toString();
}

function filtersToLabel(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  if (filters.q) parts.push(`"${filters.q}"`);
  if (filters.country) parts.push(String(filters.country));
  if (filters.city) parts.push(String(filters.city));
  if (filters.size) parts.push(String(filters.size));
  if (filters.gender) parts.push(String(filters.gender));
  if (filters.age) parts.push(String(filters.age));
  if (filters.transportable) parts.push("szállítható");
  return parts.length > 0 ? parts.join(" · ") : "Összes kutya";
}

export default async function MentettKeresesekPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/bejelentkezes?redirect=/mentett-keresesek");

  const { data: searches } = await supabase
    .from("saved_searches")
    .select("id, filters, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#F7F8F5] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2">Mentett kereséseim</h1>
        <p className="text-sm text-[#4A5568] mb-6">
          Amikor egy új, a keresésednek megfelelő kutya kerül fel az oldalra, értesítést kapsz.
        </p>
        {!searches || searches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center text-[#4A5568]">
            <div className="text-4xl mb-3">🔍</div>
            Még nincs mentett keresésed.{" "}
            <Link href="/kutyak" className="text-[#1A3D2B] font-semibold hover:underline">Keress most</Link>.
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#1C1C1C]">{filtersToLabel(s.filters as Record<string, unknown>)}</p>
                  <p className="text-xs text-[#4A5568] mt-1">
                    Mentve: {new Date(s.created_at).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/kutyak?${filtersToQueryString(s.filters as Record<string, unknown>)}`}
                    className="bg-[#E8F5E9] hover:bg-[#1B4D2F] hover:text-white text-[#1A3D2B] font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                  >
                    Megnézem
                  </Link>
                  <DeleteSavedSearchButton id={s.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Protect the route in `proxy.ts`**

Old:
```ts
  const isUserAccountPage = path === '/profil' || path === '/kedvencek' || path === '/jelentkezeseim'
```
New:
```ts
  const isUserAccountPage = path === '/profil' || path === '/kedvencek' || path === '/jelentkezeseim' || path === '/mentett-keresesek'
```

Old (matcher config):
```ts
export const config = {
  matcher: ['/partner/:path*', '/admin/:path*', '/profil', '/kedvencek', '/jelentkezeseim', '/bejelentkezes', '/regisztracio'],
}
```
New:
```ts
export const config = {
  matcher: ['/partner/:path*', '/admin/:path*', '/profil', '/kedvencek', '/jelentkezeseim', '/mentett-keresesek', '/bejelentkezes', '/regisztracio'],
}
```

- [ ] **Step 5: Add a Navbar link**

In `src/components/Navbar.tsx`, the account dropdown (desktop) and mobile menu were built in the felhasznaloi-fiok plan's Tasks 5 and 10. Find the dropdown's link list (it contains `Profilom`, `Kedvenceim`, `Jelentkezéseim`, then the sign-out button) and add a new link for `Mentett kereséseim` right before the sign-out button, in both the desktop dropdown and the mobile menu's logged-in block. Match the exact styling of the adjacent links (e.g. `className="block px-4 py-2 text-sm text-[#374151] hover:bg-[#F0FDF4]"` for desktop, or the equivalent mobile class already used for `Jelentkezéseim`). If the exact surrounding code differs from this description (e.g. link order, class names) because of how Tasks 5/10 actually landed, match the real current file — read it first, then insert consistently.

- [ ] **Step 6: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 7: Manual verification**

Run `npm run dev`. Logged out: `curl -sI http://localhost:3000/mentett-keresesek` should redirect to `/bejelentkezes`. Since live login is still blocked platform-wide, that's the extent of what can be verified now — note this limitation in the report, following the same pattern as Tasks 6-9 of the felhasznaloi-fiok plan.

- [ ] **Step 8: Commit**

```bash
git add src/components/KutyakFilters.tsx src/components/DeleteSavedSearchButton.tsx src/app/mentett-keresesek/page.tsx src/proxy.ts src/components/Navbar.tsx
git commit -m "feat: add saved-search UI and /mentett-keresesek page"
```

---

### Task 15: DB triggers — notify on matching saved search

**Files:**
- Create: `supabase/migrations/009_saved_search_notifications.sql`

**Interfaces:**
- Consumes: `saved_searches` (Task 13), `notifications` table (felhasznaloi-fiok plan Task 10).

**Why two trigger points:** a dog becomes *publicly visible* only when BOTH `dogs.status = 'available'` AND its owning partner has `partners.status = 'approved'` (confirmed via the existing RLS policy `"Public can read dogs of approved partners"`, `supabase/migrations/001_initial_schema.sql:312-313`). Since a dog can be created before its partner is approved, matching must be triggered from both directions: (a) whenever a dog is inserted or updated to `status = 'available'`, check if its partner is already approved; (b) whenever a partner is approved, re-check all of that partner's already-`available` dogs.

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================
-- SAVED SEARCH MATCH NOTIFICATIONS
-- ============================================================

-- Returns true if a dog row matches a saved search's filters jsonb.
-- filters shape: { q, country, city, size, gender, age, transportable }
-- (same vocabulary as the /kutyak page's query params)
create or replace function dog_matches_saved_search(p_dog dogs, p_filters jsonb)
returns boolean language plpgsql as $$
declare
  v_age_bucket text;
begin
  if p_filters ? 'q' and p_filters->>'q' <> '' then
    if not (p_dog.name ilike '%' || (p_filters->>'q') || '%' or p_dog.breed ilike '%' || (p_filters->>'q') || '%') then
      return false;
    end if;
  end if;
  if p_filters ? 'country' and p_filters->>'country' <> '' and p_dog.country is distinct from p_filters->>'country' then
    return false;
  end if;
  if p_filters ? 'city' and p_filters->>'city' <> '' and p_dog.city is distinct from p_filters->>'city' then
    return false;
  end if;
  if p_filters ? 'size' and p_filters->>'size' <> '' and p_dog.size::text is distinct from p_filters->>'size' then
    return false;
  end if;
  if p_filters ? 'gender' and p_filters->>'gender' <> '' and p_dog.gender::text is distinct from p_filters->>'gender' then
    return false;
  end if;
  if p_filters ? 'transportable' and (p_filters->>'transportable')::boolean is true and coalesce(p_dog.is_transportable, false) = false then
    return false;
  end if;
  if p_filters ? 'age' and p_filters->>'age' <> '' then
    v_age_bucket := case
      when coalesce(p_dog.age_years, 0) = 0 then 'puppy'
      when p_dog.age_years between 1 and 2 then 'young'
      when p_dog.age_years between 3 and 6 then 'adult'
      when p_dog.age_years >= 7 then 'senior'
      else null
    end;
    if v_age_bucket is distinct from p_filters->>'age' then
      return false;
    end if;
  end if;
  return true;
end;
$$;

-- Notifies every saved search whose filters match the given (now-visible) dog.
create or replace function notify_matching_saved_searches(p_dog_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_dog dogs%rowtype;
  v_search record;
begin
  select * into v_dog from dogs where id = p_dog_id;
  if not found or v_dog.status <> 'available' then
    return;
  end if;
  if not exists (select 1 from partners where id = v_dog.partner_id and status = 'approved') then
    return;
  end if;

  for v_search in select * from saved_searches loop
    if dog_matches_saved_search(v_dog, v_search.filters) then
      insert into notifications (user_id, type, title, body, data)
      values (
        v_search.profile_id,
        'system',
        'Új kutya a mentett keresésedhez',
        v_dog.name || ' megjelent az oldalon, és illik az egyik mentett keresésedhez.',
        jsonb_build_object('dog_id', v_dog.id, 'saved_search_id', v_search.id)
      );
    end if;
  end loop;
end;
$$;

-- Trigger point 1: a dog is created or its status changes to 'available'
create or replace function trg_dogs_notify_saved_searches()
returns trigger language plpgsql as $$
begin
  if new.status = 'available' and (tg_op = 'INSERT' or old.status is distinct from 'available') then
    perform notify_matching_saved_searches(new.id);
  end if;
  return new;
end;
$$;

create trigger on_dog_available_notify_saved_searches
  after insert or update of status on dogs
  for each row execute procedure trg_dogs_notify_saved_searches();

-- Trigger point 2: a partner is approved — re-check its already-available dogs
create or replace function trg_partner_approved_notify_saved_searches()
returns trigger language plpgsql as $$
declare
  v_dog_id uuid;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    for v_dog_id in select id from dogs where partner_id = new.id and status = 'available' loop
      perform notify_matching_saved_searches(v_dog_id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_partner_approved_notify_saved_searches
  after update of status on partners
  for each row execute procedure trg_partner_approved_notify_saved_searches();
```

- [ ] **Step 2: Apply the migration manually**

Open the Supabase Dashboard → SQL Editor for this project → paste the contents of `supabase/migrations/009_saved_search_notifications.sql` → Run.

- [ ] **Step 3: Verify with real SQL, end-to-end, entirely inside the SQL Editor** (this does not require a logged-in browser session, so it is NOT blocked by the pending Task 1 login issue)

Run this sequence in the Supabase SQL Editor, adjusting ids to real ones from your `profiles`/`partners` tables:

```sql
-- 1. Pick (or temporarily create) a profile id and an approved partner id you can use for the test.
select id from profiles limit 1;
select id from partners where status = 'approved' limit 1;

-- 2. Insert a saved search for that profile matching on country = 'HU'.
insert into saved_searches (profile_id, filters)
values ('<profile-id-from-step-1>', '{"country": "HU"}'::jsonb)
returning id;

-- 3. Insert a new dog for the approved partner with country = 'HU', status = 'available'.
insert into dogs (partner_id, name, country, status)
values ('<approved-partner-id-from-step-1>', 'Trigger Teszt Kutya', 'HU', 'available')
returning id;

-- 4. Confirm a notification was created for the profile.
select * from notifications where user_id = '<profile-id-from-step-1>' order by created_at desc limit 1;

-- 5. Clean up the test rows.
delete from dogs where name = 'Trigger Teszt Kutya';
delete from saved_searches where filters = '{"country": "HU"}'::jsonb and profile_id = '<profile-id-from-step-1>';
delete from notifications where data->>'dog_id' = '<dog-id-from-step-3>';
```

Expected: step 4 returns a row with `type = 'system'`, `title = 'Új kutya a mentett keresésedhez'`, and `data->>'dog_id'` matching the dog inserted in step 3. This proves the whole trigger chain works without needing a live app session.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/009_saved_search_notifications.sql
git commit -m "feat: notify users when a new dog matches their saved search"
```

---

### Task 16: "Kövesd a menhelyet" (Follow partner) button + notification on new dog

**Files:**
- Create: `src/components/FollowPartnerButton.tsx`
- Modify: `src/app/partners/[slug]/page.tsx`
- Create: `supabase/migrations/010_partner_follow_notifications.sql`

**Interfaces:**
- Consumes: existing `favorite_partners` table (`profile_id`, `partner_id`, `created_at`) and its RLS policy `"Users manage own partner favorites" for all using (profile_id = auth.uid())` — both already exist (`supabase/migrations/001_initial_schema.sql:253-258,333`), no schema change needed for the button itself.
- Produces: `FollowPartnerButton` props `{ partnerId: string; isLoggedIn: boolean; initialFollowing: boolean; redirectPath: string }`. The existing `/kedvencek` page (felhasznaloi-fiok plan, Task 8) already queries and renders `favorite_partners` — it will automatically start showing followed partners once this button exists, no changes needed there.

- [ ] **Step 1: Create the FollowPartnerButton component**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface FollowPartnerButtonProps {
  partnerId: string;
  isLoggedIn: boolean;
  initialFollowing: boolean;
  redirectPath: string;
}

export default function FollowPartnerButton({
  partnerId,
  isLoggedIn,
  initialFollowing,
  redirectPath,
}: FollowPartnerButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/bejelentkezes?redirect=${redirectPath}`);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/bejelentkezes?redirect=${redirectPath}`);
      setLoading(false);
      return;
    }

    const next = !following;
    setFollowing(next); // optimistic

    const result = next
      ? await supabase.from("favorite_partners").insert({ profile_id: user.id, partner_id: partnerId })
      : await supabase.from("favorite_partners").delete().eq("profile_id", user.id).eq("partner_id", partnerId);

    if (result.error) {
      setFollowing(!next); // revert on failure
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60 ${
        following
          ? "bg-[#E8F5E9] text-[#1A3D2B] border border-[#1A3D2B]"
          : "bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white"
      }`}
    >
      {following ? "Követve ✓" : "Menhely követése"}
    </button>
  );
}
```

- [ ] **Step 2: Wire it into the partner profile page**

In `src/app/partners/[slug]/page.tsx`, add the import:

Old:
```tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
```
New:
```tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FollowPartnerButton from "@/components/FollowPartnerButton";
```

Old (right after `partner` is fetched and validated, before the `dogs` query):
```tsx
  if (!partner) notFound();

  const { data: dogs } = await supabase
```
New:
```tsx
  if (!partner) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isFollowing = false;
  if (user) {
    const { data: followRow } = await supabase
      .from("favorite_partners")
      .select("partner_id")
      .eq("profile_id", user.id)
      .eq("partner_id", partner.id)
      .maybeSingle();
    isFollowing = !!followRow;
  }

  const { data: dogs } = await supabase
```

Old (the badges row right after the name/verified heading, closing the `pb-2` info block):
```tsx
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
```
New:
```tsx
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
            <div className="mt-3">
              <FollowPartnerButton
                partnerId={partner.id}
                isLoggedIn={!!user}
                initialFollowing={isFollowing}
                redirectPath={`/partners/${slug}`}
              />
            </div>
          </div>
        </div>
```

- [ ] **Step 3: Write the follower-notification migration**

Create `supabase/migrations/010_partner_follow_notifications.sql`. This is additive — it does NOT modify `009_saved_search_notifications.sql`; Postgres allows multiple independent triggers on the same table/event, so this coexists with Task 15's triggers without conflict.

```sql
-- ============================================================
-- PARTNER FOLLOW NOTIFICATIONS
-- ============================================================

-- Notifies every follower of a dog's partner when that dog becomes publicly visible.
create or replace function notify_partner_followers(p_dog_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_dog dogs%rowtype;
  v_follow record;
begin
  select * into v_dog from dogs where id = p_dog_id;
  if not found or v_dog.status <> 'available' then
    return;
  end if;
  if not exists (select 1 from partners where id = v_dog.partner_id and status = 'approved') then
    return;
  end if;

  for v_follow in select * from favorite_partners where partner_id = v_dog.partner_id loop
    insert into notifications (user_id, type, title, body, data)
    values (
      v_follow.profile_id,
      'partner_message',
      'Új kutya egy követett menhelytől',
      v_dog.name || ' megjelent az oldalon — egy általad követett menhely új kutyája.',
      jsonb_build_object('dog_id', v_dog.id, 'partner_id', v_dog.partner_id)
    );
  end loop;
end;
$$;

-- Trigger point 1: a dog is created or its status changes to 'available'
create or replace function trg_dogs_notify_partner_followers()
returns trigger language plpgsql as $$
begin
  if new.status = 'available' and (tg_op = 'INSERT' or old.status is distinct from 'available') then
    perform notify_partner_followers(new.id);
  end if;
  return new;
end;
$$;

create trigger on_dog_available_notify_partner_followers
  after insert or update of status on dogs
  for each row execute procedure trg_dogs_notify_partner_followers();

-- Trigger point 2: a partner is approved — re-check its already-available dogs
create or replace function trg_partner_approved_notify_partner_followers()
returns trigger language plpgsql as $$
declare
  v_dog_id uuid;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    for v_dog_id in select id from dogs where partner_id = new.id and status = 'available' loop
      perform notify_partner_followers(v_dog_id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_partner_approved_notify_partner_followers
  after update of status on partners
  for each row execute procedure trg_partner_approved_notify_partner_followers();
```

- [ ] **Step 4: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 5: Manual verification**

Live login now works (Task 1 of the felhasznaloi-fiok plan is done). Log in, open any partner's profile page (`/partners/<slug>`), click "Menhely követése" — confirm it flips to "Követve ✓", and check the `favorite_partners` table for the new row. Open `/kedvencek` — confirm the followed partner now appears in the "Menhelyek" section (this page already renders `favorite_partners`, built in the felhasznaloi-fiok plan's Task 8 — no changes needed there). For the migration, apply it manually in the Supabase Dashboard SQL Editor (same workflow as Tasks 8/9/10 of the felhasznaloi-fiok plan and this plan's Task 13), then verify with the same style of SQL-only test as Task 15: insert a test dog for a partner you follow, confirm a `notifications` row appears for your profile.

- [ ] **Step 6: Commit**

```bash
git add src/components/FollowPartnerButton.tsx src/app/partners/\[slug\]/page.tsx supabase/migrations/010_partner_follow_notifications.sql
git commit -m "feat: add partner-follow button and new-dog notifications for followers"
```

---

### Task 17: Wire up the "Megosztás" (share) button on the dog detail page

**Files:**
- Create: `src/components/ShareButton.tsx`
- Modify: `src/app/kutyak/[id]/page.tsx`

**Interfaces:**
- Produces: `ShareButton` props `{ title: string; text: string; url: string }` — self-contained, no other task depends on it.

**Why this is safe to build now:** the button already exists in the markup (`src/app/kutyak/[id]/page.tsx:203-212`) but has no `onClick` — identical situation to the favorite heart buttons before Task 7 of the felhasznaloi-fiok plan. This uses the browser's native Web Share API (supported on mobile Safari/Chrome and most desktop browsers) with a clipboard-copy fallback for browsers that don't support it (e.g. desktop Firefox) — no backend change needed.

- [ ] **Step 1: Create the ShareButton component**

```tsx
"use client";
import { useState } from "react";

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled the native share sheet — not an error
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Megosztás"
      className="relative w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#4A5568] hover:border-[#3D7A3D] transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      {copied && (
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#1A3D2B] text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
          Link másolva!
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Replace the dead button in the dog detail page**

In `src/app/kutyak/[id]/page.tsx`, add the import:

Old:
```tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FavoriteButton from "@/components/FavoriteButton";
```
New:
```tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
```

Old (the dead share button, right after the `FavoriteButton` icon variant):
```tsx
                <FavoriteButton dogId={dog.id} isLoggedIn={!!user} initialFavorited={isFavorited} variant="icon" />
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
```
New:
```tsx
                <FavoriteButton dogId={dog.id} isLoggedIn={!!user} initialFavorited={isFavorited} variant="icon" />
                <ShareButton
                  title={`${dog.name} – MyDog`}
                  text={`${dog.name} örökbefogadásra vár a MyDog oldalon!`}
                  url={`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://rescueconnect-nu.vercel.app"}/kutyak/${dog.id}`}
                />
```

Note: `process.env.NEXT_PUBLIC_SITE_URL` is read here in the server component (`page.tsx`) and passed down as a plain string prop — this matches the exact pattern already used in `src/app/layout.tsx`'s `metadataBase`. `ShareButton` itself never reads the env var directly.

- [ ] **Step 3: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 4: Manual verification**

Open any dog detail page in a browser. On a device/browser with Web Share API support (most mobile browsers, and recent desktop Chrome/Edge/Safari), clicking the share icon should open the native share sheet with the dog's name and a link. On a browser without support (e.g. desktop Firefox), clicking it should copy the URL to the clipboard and show a "Link másolva!" tooltip for ~2 seconds. Verify the copied link actually opens the correct dog when pasted into a new tab.

- [ ] **Step 5: Commit**

```bash
git add src/components/ShareButton.tsx src/app/kutyak/\[id\]/page.tsx
git commit -m "feat: wire up the share button on the dog detail page"
```

---

## Plan Self-Review Notes

- **Spec coverage:** all 3 originally in-scope items (badges, cascading filter, saved search + notifications) have tasks; the 2 already-satisfied items (how-it-works section, partner CTA) are explicitly called out as done, no task created for them. Two additional items (Tasks 16-17) were added 2026-08-03 after further research into mobile.de, per user request — both build on existing, already-approved schema/RLS (`favorite_partners`) or existing dead UI (`Megosztás` button), keeping the same low-risk, additive pattern as the rest of this plan.
- **Cross-task consistency:** Task 12's `citiesByCountry` prop threading and Task 14's `saveSearch` function both reference the exact same filter field set (`q, country, city, size, gender, age, transportable`) used by `/kutyak`'s existing query params — verified consistent across Tasks 11, 12, 14, and 15's `dog_matches_saved_search` filter-key vocabulary.
- **Known gap turned into an explicit test:** Task 15's verification step is unusual in that it's fully testable via the SQL Editor alone (no live browser session needed), unlike Tasks 11-14 which are limited by the still-pending login blocker — this was called out explicitly so the implementer doesn't skip real verification when it's actually available. This same SQL-only testability applies to Task 16's new migration.
- **Task 16 deliberately does not touch `009_saved_search_notifications.sql`**: adding a second, independent set of triggers on the same `dogs`/`partners` events is safe in Postgres (multiple triggers per table/event all fire independently) and avoids re-touching an already-reviewed, not-yet-applied migration file.
- **Task 16/17 do not depend on each other or on Task 15** — they could be executed in either order, or in parallel by two different controllers, though this plan executes everything sequentially for simplicity.
