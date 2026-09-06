# 10 — Services Marketplace & Map/Geolocation Readiness

Scope: service-provider marketplace (vets, groomers, trainers, dog hotels, walkers, pet stores) and
map/geolocation features across the app.

## 1. Data model: what the schema supports

`partner_type` enum (`supabase/migrations/001_initial_schema.sql:4-7`):

```sql
create type partner_type as enum (
  'shelter','breed_rescue','veterinarian','dog_school',
  'boarding','grooming','walker','dog_friendly_place','transport','other'
);
```

`partners` table columns (`001_initial_schema.sql:74-93`, full list): `id, name, slug, type, status,
verified, description, country, city, address, phone, email, website, logo_url, cover_url, metadata
(jsonb), created_at, updated_at`.

Observations on the data model itself:
- `type` genuinely supports non-shelter service categories: veterinarian, dog_school (trainer),
  boarding (hotel), grooming, walker, dog_friendly_place, transport, other. This matches the
  `PARTNER_TYPES` list rendered in the partner-registration form (`src/app/partner/register/page.tsx:7-18`),
  confirming both ends (form input and DB enum) agree on the same nine non-"other" categories.
- There is **no coordinate storage**. `grep -rni "latitude\|longitude\|coordinates\|\blat\b\|\blng\b"
  src supabase` → **0 hits** anywhere in the entire repository, migrations included. Location is
  string-only (`country`, `city`, free-text `address`), not geocoded.
- `metadata jsonb` exists as a free-form column but is never read or written anywhere in application
  code (`grep -rn "metadata\." src` = 0 hits excluding Next.js's own `generateMetadata`/`export const
  metadata` SEO exports, which are unrelated). It is not being used as an escape hatch for
  lat/lng either.
- No `partner_services`, `service_categories`, `pricing`, or `availability` table exists — a partner
  row has no bookable-slot, price-list, or service-menu concept at all, regardless of type.

## 2. Map/geolocation libraries: none installed

`package.json` dependencies (full list, verified again this session): `@base-ui/react,
@supabase/ssr, @supabase/supabase-js, class-variance-authority, clsx, lucide-react, next, react,
react-dom, resend, shadcn, tailwind-merge, tw-animate-css`. No `leaflet`, `react-leaflet`,
`mapbox-gl`, `@react-google-maps/api`, `google-map-react`, or any mapping library.

Repo-wide search:

```
grep -rni "leaflet"            -> 0 hits
grep -rni "mapbox"             -> 0 hits
grep -rni "google maps"        -> 0 hits
grep -rni "@react-google-maps" -> 0 hits
grep -rni "GOOGLE_MAPS\|MAPBOX" (env/config files too) -> 0 hits
```

No map API key is configured in any `.env*`, `next.config.ts`, or source file (checked this session).

## 3. Every place the word "map" (térkép) actually appears in the UI

- `src/app/menhelyek/page.tsx:64-69` — a literal placeholder box, not a real map:

  ```tsx
  {/* Map placeholder */}
  <div className="bg-white rounded-2xl border border-[#E2E8F0] mb-10 h-72 flex flex-col items-center justify-center shadow-sm">
    <span className="text-6xl mb-4">🗺️</span>
    <p className="text-xl font-semibold text-[#4A5568]">Interaktív térkép hamarosan</p>
    <p className="text-sm text-[#4A5568] mt-2">Hamarosan megtekintheted a menhelyeket egy interaktív európai térképen.</p>
  </div>
  ```

  Translation: "Interactive map coming soon." This is the single, explicit, self-admitted
  placeholder for the entire map feature.

- `src/app/bobilos-utazas/page.tsx:57` — a hero CTA button links to `href="#terkep"` ("go to map"),
  but no element with `id="terkep"` exists anywhere in that same file (`grep -n "terkep"
  src/app/bobilos-utazas/page.tsx` returns only that one line) — the anchor link is **BROKEN** (dead
  in-page scroll target, resolves to top of page).

No other file in the repo references a map.

## 4. Does any UI let a user browse/filter by service-provider type?

Searched every query against the `partners` table (`grep -rn 'from("partners")' src`):

| File | Query | Type filter? |
|---|---|---|
| `src/app/page.tsx:67` | count of approved partners (homepage stat) | No |
| `src/app/admin/dashboard/page.tsx:17-19` | counts by status (admin) | No |
| `src/app/admin/partners/page.tsx:28-33` | full list with `if (sp.type) query = query.eq("type", sp.type)` | **Yes — but admin-only** |
| `src/app/admin/partners/[id]/page.tsx:22` | single partner by id (admin detail view) | No |
| `src/app/partner/register/page.tsx:83` | insert on signup | N/A (write) |
| `src/app/partner/profile/page.tsx:72` | partner's own profile (partner-portal self-service) | No |
| `src/app/partners/[slug]/page.tsx:49,70` | single partner by slug (public profile page) | No |

**The only place in the entire codebase that filters partners by `type` is the internal admin panel**
(`src/app/admin/partners/page.tsx:33`, gated behind `/admin/*` auth). There is no consumer-facing
route that lets a visitor say "show me groomers" or "show me vets" and get a filtered, real list back
from the `partners` table.

`/szolgaltatasok` (`src/app/szolgaltatasok/page.tsx`, full file read) is a 100% static marketing page:
zero imports of Supabase, zero `async`/`await`, zero `useState`/`useEffect`. Its "Szolgáltatásaink"
grid (lines 3-12) is a hardcoded array of 8 generic category cards (menhelyek, vets, "kutyás
szolgáltatók" as one lumped card, transport, volunteers, fostering, knowledge base, donations) with
no links to filtered results — clicking them does nothing (they are plain `<div>`s, not `<Link>`s).
The "partnerTypes" quick-picker at the bottom (lines 21-27, 123-134: Menhely/Fajtamentő/Állatorvos/
Kutyaiskola/Kutyapanzió) all link to the same place regardless of which icon is clicked:
`href="/csatlakozas"` (the partner-signup page) — none of them link to a filtered browse view.

`/menhelyek` (`src/app/menhelyek/page.tsx`, full file read) is also 100% static: a hardcoded
6-entry `shelters` array (lines 3-10) with fake names, ratings, and dog counts, none of it from
Supabase (`grep -n "createClient\|supabase" src/app/menhelyek/page.tsx` = 0 hits). Its search bar,
country dropdown, and type dropdown (lines 39-60: options are only "Menhely"/"Fajtamentő" — vets,
groomers, walkers etc. are not even listed as filter options here) have no `onChange` handlers, no
`useState`, and the page isn't a Client Component (no `"use client"` directive) — the entire filter
bar is inert decoration. The "Keresés" (Search) button does nothing. Card links point to
`/menhelyek/${shelter.id}` (e.g. `/menhelyek/1`), but **no such dynamic route exists**
(`find src/app/menhelyek -type d` returns no subdirectory — only `page.tsx` at the top level) — these
links are **BROKEN** (404 on click).

The one genuinely working, Supabase-backed detail page is `/partners/[slug]/page.tsx` (full file
read): it fetches a single partner by slug, renders a type badge via a `partnerTypeLabel` map that
does cover all nine service types correctly, shows that partner's available dogs, and a plain-text
contact block (phone/email/website/address — no embedded map, no coordinates). This page is reachable
only if the visitor already knows/has a link to a specific slug — there is no working index page that
lists and links to partners of a given type for a user to arrive here organically.

## 5. Distance sorting

`NOT_FOUND`. With no coordinates stored (§1) there is no way to compute distance, and no ORDER BY on
any query approximates it (all queries either fetch by id/slug or filter by exact-match
`country`/`city` string — see `src/app/kutyak/page.tsx:107-111`, which does real, working `.eq
("country", country)` / `.eq("city", city)` filtering for **dogs**, not partners — dogs listing has
functioning location filtering; partner/service listing does not).

## 6. Club-discount pricing on service pages

`NOT_FOUND` — depends entirely on the Dog Club feature (report 09), which does not exist at all, so
there is no discount concept to display anywhere near partner/service listings.

## 7. Summary

| Capability | Status | Evidence |
|---|---|---|
| Data model supports service-provider types | **PARTIAL** (WORKING for storage, missing for geo) | `partner_type` enum + registration form agree on 9 categories; no lat/lng/coordinates column exists at all |
| Public browsing of services by type | **PLACEHOLDER** | Only admin panel filters by type (`admin/partners/page.tsx:33`); `/szolgaltatasok` and `/menhelyek` are static, non-functional |
| Partner/service detail page | **WORKING** (for whatever type, once you have the slug) | `/partners/[slug]/page.tsx` is real, Supabase-backed, generic across all 9 types |
| Map UI | **PLACEHOLDER** (explicitly labeled "coming soon" in the UI itself) | `src/app/menhelyek/page.tsx:64-69` |
| Map library/API integration | **NOT_FOUND** | No leaflet/mapbox/Google Maps dependency or key anywhere |
| Distance sorting | **NOT_FOUND** | No coordinates to sort by |
| Location text-filtering (country/city) | **WORKING for dogs, NOT_FOUND for partners/services** | `src/app/kutyak/page.tsx:107-111` works; no equivalent exists for `partners` outside the admin panel |
| Club-discount pricing display | **NOT_FOUND** | Depends on Dog Club, which doesn't exist (report 09) |
| `/menhelyek/[id]` detail route (linked from the shelter grid) | **BROKEN** | Cards link to `/menhelyek/{id}`; no such route directory exists |
| Bobilos-utazas "#terkep" anchor | **BROKEN** | No element with `id="terkep"` on that page |

**Bottom line:** the database *could* support a real service-provider marketplace with maps (the
`partner_type` enum is already broad and correct), but every consumer-facing surface for browsing,
filtering, or geolocating services is either 100% static marketing copy with fake data
(`/szolgaltatasok`, `/menhelyek`) or explicitly marked "coming soon" (the map). The only real,
working, DB-backed piece is the single-partner profile page, which is unreachable through any working
browse/search/filter/map flow for an ordinary visitor.
