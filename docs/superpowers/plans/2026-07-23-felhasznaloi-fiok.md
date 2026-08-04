# Felhasználói fiók rendszer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete regular-user account system for RescueConnect/MyDog — registration, login (already exists), profile editing, working favorites, an adoption-application history view, and a basic unread-notification badge — wired to the database schema that already exists.

**Architecture:** Next.js App Router pages/components calling Supabase directly from client components (matching the existing `partner/*` pattern) and server components for data fetching + auth gating (matching `partner/dashboard`). One new DB migration adds a trigger to auto-create notifications on application status change, since the `notifications` table currently has no INSERT policy.

**Tech Stack:** Next.js 16.2.10 (App Router), React 19.2.4, TypeScript, Tailwind CSS v4, `@supabase/ssr` + `@supabase/supabase-js`, Supabase Postgres/Auth/Storage.

## ⚠️ Kézi lépések, mielőtt ez a funkció élesben működik

**FRISSÍTVE 2026-08-04, a teljes branch (17 task, 2 terv) lezárása után** — ez a lista most már mindkét tervhez tartozó összes kézi lépést tartalmazza egy helyen (a végső branch-review kifejezetten ezt kérte, mert korábban csak a 007-es migráció szerepelt itt, a 008/009/010 az auto-de-ihletett-fejlesztesek.md fájlban volt csak elszórva task-szinten).

Minden kód kész, buildel és le van reviewzve (17/17 task Approved, + 2 teljes branch-review). A kódbázison kívül, a Supabase Dashboardon keresztül **öt dolgot csak a projekt tulajdonosa tud megcsinálni**:

**1. Email-megerősítés kikapcsolása — ✅ MEGTÖRTÉNT (2026-08-03, screenshottal megerősítve)**
Supabase Dashboard → Authentication → Providers → Email → "Confirm email" kikapcsolva.

**2. `007_adoption_notifications.sql` — ✅ MEGTÖRTÉNT (2026-08-03, screenshottal megerősítve: "Success. No rows returned")**
Ellenőrzésképp bármikor lefuttatható:
```sql
select * from pg_trigger where tgname = 'on_application_status_change';
```
Várt eredmény: 1 sor.

**3. `008_saved_searches.sql` — ⬜ MÉG HÁTRAVAN**
Enélkül a "Mentés keresésként" gomb, a `/mentett-keresesek` oldal és a Navbar "Mentett kereséseim" linkje mind adatbázis-hibával elszáll (a `saved_searches` tábla nem létezik). Supabase Dashboard → SQL Editor → illeszd be a `supabase/migrations/008_saved_searches.sql` teljes tartalmát → Run.

**4. `009_saved_search_notifications.sql` — ⬜ MÉG HÁTRAVAN (a 008 UTÁN futtatandó, mert a `saved_searches` táblára épül)**
Supabase Dashboard → SQL Editor → illeszd be a `supabase/migrations/009_saved_search_notifications.sql` teljes tartalmát → Run. Ellenőrzés (böngésző nélkül, tisztán SQL-lel):
```sql
-- 1. Válassz egy profilt és egy jóváhagyott partnert
select id from profiles limit 1;
select id from partners where status = 'approved' limit 1;

-- 2. Ments el egy keresést az adott profilnak
insert into saved_searches (profile_id, filters)
values ('<profil-id>', '{"country": "HU"}'::jsonb)
returning id;

-- 3. Adj fel egy új kutyát a jóváhagyott partnernek
insert into dogs (partner_id, name, country, status)
values ('<partner-id>', 'Trigger Teszt Kutya', 'HU', 'available')
returning id;

-- 4. Ellenőrizd, hogy létrejött-e az értesítés
select * from notifications where user_id = '<profil-id>' order by created_at desc limit 1;

-- 5. Takarítsd el a teszt-sorokat
delete from dogs where name = 'Trigger Teszt Kutya';
delete from saved_searches where filters = '{"country": "HU"}'::jsonb and profile_id = '<profil-id>';
```

**5. `010_partner_follow_notifications.sql` — ⬜ MÉG HÁTRAVAN**
Supabase Dashboard → SQL Editor → illeszd be a `supabase/migrations/010_partner_follow_notifications.sql` teljes tartalmát → Run. Ellenőrzés ugyanazzal a mintával, mint a 4. pontban, csak `favorite_partners` táblába szúrva be egy sort a `saved_searches` helyett, és a partner `status`-át `'approved'`-ra állítva (ha még nem az) a trigger második ágának teszteléséhez.

**Sorrend fontos**: a 008-at a 009 előtt kell futtatni (a 009 a `saved_searches` táblára hivatkozik). A 007 és a 010 egymástól és a többitől függetlenek, bármikor futtathatók.

A `/jelentkezeseim` élő tesztjéhez (007-hez): ha nincs egyetlen `adoption_applications` sor sem `applicant_id`-val, előbb hozz létre egy teszt-jelentkezést bejelentkezve a `/kutyak/[id]/kapcsolat` oldalon.

## Global Constraints

- Follow the file-convention naming already in this repo: `proxy.ts` (not `middleware.ts` — Next 16 renamed and deprecated `middleware`; this repo already uses the current convention, confirmed against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`).
- No test framework is installed in this repo (`package.json` has no jest/vitest/playwright — only `lint`, `build`, `dev`, `start`). Every task's "test" step is therefore: `npm run lint`, `npm run build` (this also type-checks), and a manual browser verification against the local dev server (`npm run dev`). Do not introduce a new test framework as part of this plan — out of scope and not requested.
- Match existing UI conventions exactly: color tokens `#1A3D2B` (dark green / headers), `#1B4D2F` (primary buttons), `#3D7A3D` (accents/focus rings), `#4A5568` (secondary text), `#E2E8F0` (borders), `#F7F8F5` (page background), `#E8F5E9` (light green hover/badge). All UI copy in Hungarian, matching the tone of existing pages (`bejelentkezes`, `partner/register`).
- Client components that call Supabase use `createClient` from `@/lib/supabase/client`; server components use `createClient` (async) from `@/lib/supabase/server`. Never use a service-role key — none exists in this codebase, and none should be added.
- Database migrations are applied manually via the Supabase Dashboard SQL Editor (confirmed project workflow — code pushes deploy the app, but SQL migrations are run by hand). Do not attempt `supabase db push` or assume a CI migration step exists.
- Do not modify `supabase/migrations/001_initial_schema.sql` through `006_partner_applications.sql` — they are already applied. New schema changes go in a new `007_*.sql` file.

---

### Task 1: Disable Supabase email confirmation for new signups

**Files:** None (Supabase Dashboard configuration change only).

**Interfaces:**
- Produces: signups via `supabase.auth.signUp()` return an active session immediately (no email confirmation gate) — required by every later task that calls `signUp`.

- [ ] **Step 1: Change the Supabase Auth setting**

In the Supabase Dashboard for this project: **Authentication → Sign In / Providers → Email** → turn the **"Confirm email"** toggle **OFF** → Save. (Exact menu path may vary slightly by dashboard version; look for the email-provider settings under Authentication.)

- [ ] **Step 2: Verify via curl that signup now returns a session immediately**

```bash
cd "/Users/bankirichard/Desktop/Cursor fejlesztések/MyDog projekt/rescueconnect"
set -a; source .env.local; set +a
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"plan-test-$(date +%s)@example.com\",\"password\":\"testpass123\"}" \
  | python3 -m json.tool
```

Expected: the JSON response contains a non-null `"access_token"` (top-level). If instead you only see user fields with `"confirmation_sent_at"` set and no `access_token`, the toggle hasn't taken effect — recheck Step 1.

- [ ] **Step 3: No commit needed**

This step changes no files. Note in your summary/PR description that the Supabase Auth "Confirm email" setting was turned off, since it isn't visible in the diff.

---

### Task 2: Fix `/csatlakozas` into a working chooser page

**Files:**
- Modify: `src/app/csatlakozas/page.tsx` (full replacement — current content is a non-functional decorative form with no `<form>`, `onSubmit`, or Supabase call)

**Interfaces:**
- Consumes: none
- Produces: links to `/regisztracio` (Task 3) and `/partner/register` (already exists)

- [ ] **Step 1: Replace the page content**

```tsx
import Link from "next/link";

export default function CsatlakozasPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      <section className="bg-[#1A3D2B] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#52B788] uppercase tracking-wider mb-3">Csatlakozás</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Hogyan szeretnél csatlakozni?</h1>
          <p className="text-[#A7C4A3] text-lg max-w-2xl mx-auto">
            Válaszd ki, melyik írja le téged jobban.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/regisztracio"
            className="bg-white rounded-3xl p-8 border-2 border-[#E2E8F0] hover:border-[#3D7A3D] hover:bg-white transition-colors text-center block"
          >
            <div className="text-4xl mb-4">🐕</div>
            <h2 className="text-xl font-bold text-[#1C1C1C] mb-2">Kutyát keresek</h2>
            <p className="text-sm text-[#4A5568]">
              Fiókot szeretnék, hogy kedvenceket mentsek és nyomon kövessem az örökbefogadási jelentkezéseimet.
            </p>
            <span className="inline-block mt-5 text-[#1A3D2B] font-semibold">Felhasználói regisztráció →</span>
          </Link>

          <Link
            href="/partner/register"
            className="bg-white rounded-3xl p-8 border-2 border-[#E2E8F0] hover:border-[#3D7A3D] hover:bg-white transition-colors text-center block"
          >
            <div className="text-4xl mb-4">🏠</div>
            <h2 className="text-xl font-bold text-[#1C1C1C] mb-2">Menhely / szolgáltató vagyok</h2>
            <p className="text-sm text-[#4A5568]">
              Kutyákat szeretnék feltölteni örökbefogadásra, vagy szolgáltatóként megjelenni a platformon.
            </p>
            <span className="inline-block mt-5 text-[#1A3D2B] font-semibold">Partner regisztráció →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors. (`/regisztracio` doesn't exist yet — that's fine, `Link` doesn't fail the build for routes created in a later task.)

- [ ] **Step 3: Manual check**

Run `npm run dev`, open `http://localhost:3000/csatlakozas`, confirm both cards render and are clickable (the "Kutyát keresek" link will 404 until Task 3 lands — that's expected at this point).

- [ ] **Step 4: Commit**

```bash
git add src/app/csatlakozas/page.tsx
git commit -m "fix: replace broken /csatlakozas decorative form with working chooser"
```

---

### Task 3: `/regisztracio` — user registration page

**Files:**
- Create: `src/app/regisztracio/page.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/client` (existing)
- Produces: a working `/regisztracio` route; on success, redirects to `/profil` (built in Task 6) or to the `redirect` query param if present — same convention as `src/app/bejelentkezes/page.tsx`.

- [ ] **Step 1: Create the registration page**

```tsx
"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Kérjük, add meg az email címed és a jelszavad.");
      return;
    }
    if (password.length < 6) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError) {
      setError(
        authError.message === "User already registered"
          ? "Ezzel az email címmel már létezik fiók."
          : authError.message
      );
      setLoading(false);
      return;
    }

    const redirectTo = searchParams.get("redirect") || "/profil";
    router.push(redirectTo);
    router.refresh();
  }

  const inputClass =
    "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-[#1C1C1C] mb-1.5";

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#1A3D2B]">MyDog</Link>
          <p className="text-[#4A5568] text-sm mt-1">Felhasználói fiók létrehozása</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Teljes név</label>
            <input
              type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className={inputClass} placeholder="Nagy Éva"
            />
          </div>
          <div>
            <label className={labelClass}>Email cím</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className={inputClass} placeholder="nev@example.com"
            />
          </div>
          <div>
            <label className={labelClass}>Jelszó</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className={inputClass} placeholder="min. 6 karakter"
            />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? "Regisztráció..." : "Regisztráció"}
          </button>
        </form>
        <p className="text-center text-sm text-[#4A5568] mt-6">
          Már van fiókod?{" "}
          <Link href="/bejelentkezes" className="text-[#1A3D2B] font-semibold hover:underline">Lépj be</Link>
        </p>
        <p className="text-center text-sm text-[#4A5568] mt-2">
          Menhely vagy szolgáltató vagy?{" "}
          <Link href="/partner/register" className="text-[#1A3D2B] font-semibold hover:underline">Regisztrálj partnerként</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center">
          <p className="text-[#4A5568]">Betöltés...</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
```

- [ ] **Step 2: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 3: Manual verification**

Run `npm run dev`, open `http://localhost:3000/regisztracio`, register with a fresh email + password (≥6 chars). Expected: redirected to `/profil` (which will 404 until Task 6 — confirm the redirect *attempt* happens, i.e., the URL bar changes to `/profil`, rather than staying on `/regisztracio` with an error). In the Supabase Dashboard → Authentication → Users, confirm the new user appears and is already confirmed (no pending-confirmation state) — this also validates Task 1.

- [ ] **Step 4: Commit**

```bash
git add src/app/regisztracio/page.tsx
git commit -m "feat: add user registration page at /regisztracio"
```

---

### Task 4: Extend `proxy.ts` to protect user account routes

**Files:**
- Modify: `src/proxy.ts:26-44`

**Interfaces:**
- Consumes: none new
- Produces: unauthenticated visits to `/profil`, `/kedvencek`, `/jelentkezeseim` redirect to `/bejelentkezes?redirect=<path>`; authenticated visits to `/bejelentkezes` or `/regisztracio` redirect to `/profil`.

- [ ] **Step 1: Update the proxy logic and matcher**

In `src/proxy.ts`, replace:

```ts
  const path = request.nextUrl.pathname
  const isPartnerPage = path.startsWith('/partner')
  const isAuthPage = path === '/partner/login' || path === '/partner/register'

  const isAdminPage = path.startsWith('/admin')
  const isAdminLogin = path === '/admin/login'

  if (isPartnerPage && !isAuthPage && !user) {
    const redirectUrl = new URL('/partner/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/partner/dashboard', request.url))
  }

  if (isAdminPage && !isAdminLogin && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/partner/:path*', '/admin/:path*'],
}
```

with:

```ts
  const path = request.nextUrl.pathname
  const isPartnerPage = path.startsWith('/partner')
  const isAuthPage = path === '/partner/login' || path === '/partner/register'

  const isAdminPage = path.startsWith('/admin')
  const isAdminLogin = path === '/admin/login'

  const isUserAccountPage = path === '/profil' || path === '/kedvencek' || path === '/jelentkezeseim'
  const isUserAuthPage = path === '/bejelentkezes' || path === '/regisztracio'

  if (isPartnerPage && !isAuthPage && !user) {
    const redirectUrl = new URL('/partner/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/partner/dashboard', request.url))
  }

  if (isAdminPage && !isAdminLogin && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (isUserAccountPage && !user) {
    const redirectUrl = new URL('/bejelentkezes', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  if (isUserAuthPage && user) {
    return NextResponse.redirect(new URL('/profil', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/partner/:path*', '/admin/:path*', '/profil', '/kedvencek', '/jelentkezeseim', '/bejelentkezes', '/regisztracio'],
}
```

- [ ] **Step 2: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 3: Manual verification**

Run `npm run dev`. While logged out, open `http://localhost:3000/profil` directly — expect an immediate redirect to `/bejelentkezes?redirect=%2Fprofil` (404 page is fine for `/profil` itself until Task 6, but the redirect must happen *before* that 404 renders — check the URL bar changes). Log in via `/bejelentkezes`, then open `/bejelentkezes` again — expect redirect to `/profil`.

- [ ] **Step 4: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: protect /profil, /kedvencek, /jelentkezeseim behind auth in proxy"
```

---

### Task 5: Auth-aware Navbar (root layout + Navbar component)

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/Navbar.tsx`

**Interfaces:**
- Produces: `Navbar` now requires props `{ user: { id: string; email: string | null } | null; fullName: string | null }`. Any other place that renders `<Navbar />` (none currently besides `layout.tsx`) would need updating — confirmed via `grep -rn "<Navbar" src` returning only `layout.tsx`.

- [ ] **Step 1: Make the root layout fetch the current user and profile**

In `src/app/layout.tsx`, add the import and change the component to an async function that fetches auth state:

Replace:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
```
with:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
```

Replace:
```tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hu"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#1C1C1C]">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```
with:
```tsx
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    fullName = profile?.full_name || null;
  }

  return (
    <html
      lang="hu"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#1C1C1C]">
        <Navbar user={user ? { id: user.id, email: user.email ?? null } : null} fullName={fullName} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add auth props and account menu to Navbar**

In `src/components/Navbar.tsx`, replace the imports and function signature:

Old:
```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
```
New:
```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
```

Old:
```tsx
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
```
New:
```tsx
interface NavbarProps {
  user: { id: string; email: string | null } | null;
  fullName: string | null;
}

export default function Navbar({ user, fullName }: NavbarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  }

  const displayName = fullName || user?.email || "Fiókom";
```

Old (the decorative, non-functional person-icon button that currently sits right before the "Regisztráció" link):
```tsx
            <button className="p-1.5 text-[#374151] hover:text-[#1A3D2B] hover:bg-[#F0FDF4] rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <Link
              href="/csatlakozas"
```
New:
```tsx
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[#374151] hover:text-[#1A3D2B] px-2 py-1.5 rounded-lg hover:bg-[#F0FDF4] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="max-w-[100px] truncate">{displayName}</span>
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-2 z-50">
                    <Link href="/profil" onClick={() => setAccountOpen(false)} className="block px-4 py-2 text-sm text-[#374151] hover:bg-[#F0FDF4]">Profilom</Link>
                    <Link href="/kedvencek" onClick={() => setAccountOpen(false)} className="block px-4 py-2 text-sm text-[#374151] hover:bg-[#F0FDF4]">Kedvenceim</Link>
                    <Link href="/jelentkezeseim" onClick={() => setAccountOpen(false)} className="block px-4 py-2 text-sm text-[#374151] hover:bg-[#F0FDF4]">Jelentkezéseim</Link>
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Kijelentkezés</button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/bejelentkezes"
                className="text-[13px] font-medium text-[#374151] hover:text-[#1A3D2B] px-3 py-1.5 rounded-lg hover:bg-[#F0FDF4] transition-colors border border-[#E5E7EB]"
              >
                Bejelentkezés
              </Link>
            )}
            <Link
              href="/csatlakozas"
```

- [ ] **Step 3: Update the mobile menu**

Old:
```tsx
            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
              <Link href="/csatlakozas" className="block px-3 py-2 text-sm font-semibold text-white bg-[#1A3D2B] rounded-xl text-center" onClick={() => setMobileOpen(false)}>
                Regisztráció
              </Link>
            </div>
```
New:
```tsx
            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
              {user ? (
                <>
                  <Link href="/profil" className="block px-3 py-2 text-sm font-medium text-[#4A5568] hover:text-[#1A3D2B]" onClick={() => setMobileOpen(false)}>Profilom</Link>
                  <Link href="/kedvencek" className="block px-3 py-2 text-sm font-medium text-[#4A5568] hover:text-[#1A3D2B]" onClick={() => setMobileOpen(false)}>Kedvenceim</Link>
                  <Link href="/jelentkezeseim" className="block px-3 py-2 text-sm font-medium text-[#4A5568] hover:text-[#1A3D2B]" onClick={() => setMobileOpen(false)}>Jelentkezéseim</Link>
                  <button
                    onClick={() => { setMobileOpen(false); handleSignOut(); }}
                    className="block w-full text-left px-3 py-2 text-sm font-semibold text-red-600"
                  >
                    Kijelentkezés
                  </button>
                </>
              ) : (
                <>
                  <Link href="/bejelentkezes" className="block px-3 py-2 text-sm font-medium text-[#4A5568] hover:text-[#1A3D2B]" onClick={() => setMobileOpen(false)}>Bejelentkezés</Link>
                  <Link href="/csatlakozas" className="block px-3 py-2 text-sm font-semibold text-white bg-[#1A3D2B] rounded-xl text-center" onClick={() => setMobileOpen(false)}>
                    Regisztráció
                  </Link>
                </>
              )}
            </div>
```

Note: the existing "HU" language-selector button (between the Kedvencek link and the account button) and the Kedvencek link itself are untouched — only the previously non-functional person-icon button is repurposed.

- [ ] **Step 4: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed. If TypeScript complains about `Navbar` props anywhere else, it means another caller renders `<Navbar />` without props — search with `grep -rn "<Navbar" src` and update it (there should be none besides `layout.tsx`).

- [ ] **Step 5: Manual verification**

Run `npm run dev`. Logged out: confirm the navbar shows "Bejelentkezés" + "Regisztráció". Log in via `/bejelentkezes`: confirm the navbar now shows your name (or email) with a dropdown containing Profilom / Kedvenceim / Jelentkezéseim / Kijelentkezés (the linked pages will 404 until later tasks — that's fine, confirm the dropdown itself opens/closes and links are correct). Click "Kijelentkezés": confirm you're redirected to `/` and the navbar reverts to the logged-out state without a manual page reload.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/components/Navbar.tsx
git commit -m "feat: make Navbar auth-aware with account menu and sign-out"
```

---

### Task 6: `/profil` page

**Files:**
- Create: `src/app/profil/page.tsx`
- Create: `src/components/ProfileForm.tsx`

**Interfaces:**
- Produces: `ProfileForm` component with props `{ userId: string; email: string; initialFullName: string }` — self-contained, not consumed elsewhere in this plan.

- [ ] **Step 1: Create the profile page (server component)**

```tsx
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
```

- [ ] **Step 2: Create the profile edit form (client component)**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  userId: string;
  email: string;
  initialFullName: string;
}

export default function ProfileForm({ userId, email, initialFullName }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (updateError) {
      setError("Nem sikerült menteni: " + updateError.message);
    } else {
      setMessage("Mentve.");
    }
    setSaving(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const inputClass =
    "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-[#1C1C1C] mb-1.5";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className={labelClass}>Email cím</label>
          <input type="email" value={email} disabled className={`${inputClass} bg-[#F7F8F5] text-[#4A5568]`} />
        </div>
        <div>
          <label className={labelClass}>Teljes név</label>
          <input
            type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className={inputClass} placeholder="Nagy Éva"
          />
        </div>
        {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
        {message && <p className="text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl">{message}</p>}
        <button
          type="submit" disabled={saving}
          className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          {saving ? "Mentés..." : "Mentés"}
        </button>
      </form>
      <button
        onClick={handleSignOut}
        className="w-full mt-4 border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-xl transition-colors"
      >
        Kijelentkezés
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 4: Manual verification**

Log in, open `/profil`, confirm your email is shown (disabled field) and full name field is pre-filled if you set one at registration. Change the name, click "Mentés", confirm "Mentve." appears. Reload the page — confirm the new name persisted. Click "Kijelentkezés" — confirm redirect to `/` and logged-out navbar state.

- [ ] **Step 5: Commit**

```bash
git add src/app/profil/page.tsx src/components/ProfileForm.tsx
git commit -m "feat: add /profil page for viewing and editing user profile"
```

---

### Task 7: `FavoriteButton` component + wire into dog detail page

**Files:**
- Create: `src/components/FavoriteButton.tsx`
- Modify: `src/app/kutyak/[id]/page.tsx`

**Interfaces:**
- Produces: `FavoriteButton` component, props `{ dogId: string; isLoggedIn: boolean; initialFavorited: boolean; variant: "icon" | "full" }` — reused as-is by Task 8 (`/kedvencek` list, always with `variant="icon"` and `initialFavorited={true}`).

- [ ] **Step 1: Create the FavoriteButton component**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface FavoriteButtonProps {
  dogId: string;
  isLoggedIn: boolean;
  initialFavorited: boolean;
  variant: "icon" | "full";
}

export default function FavoriteButton({ dogId, isLoggedIn, initialFavorited, variant }: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/bejelentkezes?redirect=/kutyak/${dogId}`);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/bejelentkezes?redirect=/kutyak/${dogId}`);
      setLoading(false);
      return;
    }

    const next = !favorited;
    setFavorited(next); // optimistic

    const result = next
      ? await supabase.from("favorite_dogs").insert({ profile_id: user.id, dog_id: dogId })
      : await supabase.from("favorite_dogs").delete().eq("profile_id", user.id).eq("dog_id", dogId);

    if (result.error) {
      setFavorited(!next); // revert on failure
    }
    setLoading(false);
    router.refresh(); // keeps other FavoriteButton instances on the page (and /kedvencek) in sync
  }

  if (variant === "full") {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`w-full border-2 font-semibold py-3.5 rounded-2xl transition-colors disabled:opacity-60 ${
          favorited
            ? "border-red-300 bg-red-50 text-red-600"
            : "border-[#1A3D2B] text-[#1A3D2B] hover:bg-[#E8F5E9]"
        }`}
      >
        {favorited ? "Kedvenceim között ♥" : "Kedvencekhez adom ♡"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label="Kedvencekhez"
      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
        favorited
          ? "border-red-300 text-red-500 bg-red-50"
          : "border-[#E2E8F0] bg-white text-[#4A5568] hover:text-red-500 hover:border-red-300"
      }`}
    >
      <svg className="w-5 h-5" fill={favorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
```

- [ ] **Step 2: Fetch current user + favorite status in the dog detail page**

In `src/app/kutyak/[id]/page.tsx`, add the import:

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
import FavoriteButton from "@/components/FavoriteButton";
```

Old (right after the `dog` object is built, before the media fetch):
```tsx
  const dog = {
    ...dogData,
    partner: Array.isArray(dogData.partner)
      ? (dogData.partner[0] ?? null)
      : dogData.partner,
  };

  // Fetch media
```
New:
```tsx
  const dog = {
    ...dogData,
    partner: Array.isArray(dogData.partner)
      ? (dogData.partner[0] ?? null)
      : dogData.partner,
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isFavorited = false;
  if (user) {
    const { data: favRow } = await supabase
      .from("favorite_dogs")
      .select("dog_id")
      .eq("profile_id", user.id)
      .eq("dog_id", id)
      .maybeSingle();
    isFavorited = !!favRow;
  }

  // Fetch media
```

- [ ] **Step 3: Replace the two non-functional favorite buttons**

Old (the small square heart-icon button):
```tsx
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
```
New:
```tsx
                <FavoriteButton dogId={dog.id} isLoggedIn={!!user} initialFavorited={isFavorited} variant="icon" />
```

Old (the full-width "Kedvencekhez adom" button near the bottom CTA):
```tsx
              <button className="w-full border-2 border-[#1A3D2B] text-[#1A3D2B] hover:bg-[#E8F5E9] font-semibold py-3.5 rounded-2xl transition-colors">
                Kedvencekhez adom ♡
              </button>
```
New:
```tsx
              <FavoriteButton dogId={dog.id} isLoggedIn={!!user} initialFavorited={isFavorited} variant="full" />
```

- [ ] **Step 4: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 5: Manual verification**

Open any dog detail page while logged out, click either heart button — expect redirect to `/bejelentkezes?redirect=/kutyak/<id>`. Log in, revisit the same dog page, click the heart — expect it to turn filled/red immediately, and both button instances (top-right icon and bottom full-width) to show the favorited state after the `router.refresh()`. Click again to un-favorite — expect it to revert. In the Supabase Dashboard, check the `favorite_dogs` table to confirm rows are actually inserted/deleted.

- [ ] **Step 6: Commit**

```bash
git add src/components/FavoriteButton.tsx src/app/kutyak/\[id\]/page.tsx
git commit -m "feat: wire up favorite buttons on dog detail page"
```

---

### Task 8: `/kedvencek` page

**Files:**
- Create: `src/app/kedvencek/page.tsx`

**Interfaces:**
- Consumes: `FavoriteButton` from Task 7 (`{ dogId, isLoggedIn, initialFavorited, variant }`)

- [ ] **Step 1: Create the favorites page**

```tsx
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
```

Note: clicking the remove button on this page deletes the row and then calls `router.refresh()` (inside `FavoriteButton`), which re-runs this server component and drops the card from the list — no separate local-list-filtering logic needed.

- [ ] **Step 2: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 3: Manual verification**

Log in, favorite 1-2 dogs from their detail pages, then open `/kedvencek` — confirm they appear with image, name, breed, city. Click the heart on a card in this list — confirm the card disappears after the refresh. Confirm the "Menhelyek" section shows the empty-state message (favoriting a partner isn't wired to any UI yet in this plan — it's schema-supported but there's no partner-favorite button anywhere to test with, so this section will show the empty state in practice; that's expected).

- [ ] **Step 4: Commit**

```bash
git add src/app/kedvencek/page.tsx
git commit -m "feat: add /kedvencek page listing favorite dogs and partners"
```

---

### Task 9: `/jelentkezeseim` page + link submitted applications to the logged-in applicant

**Files:**
- Modify: `src/app/api/applications/route.ts`
- Create: `src/app/jelentkezeseim/page.tsx`

**Interfaces:**
- Produces: `adoption_applications.applicant_id` is now populated when the submitter is logged in (previously always `null`, which meant `/jelentkezeseim` would have been permanently empty even for logged-in users — this fix is required for Task 9's page to ever show data).

- [ ] **Step 1: Set `applicant_id` when the submitter is authenticated**

In `src/app/api/applications/route.ts`, replace:

```ts
  const supabase = await createClient();

  // The dog row is the source of truth for the partner — don't trust client-sent partner ids
  const { data: dog, error: dogError } = await supabase
```
with:
```ts
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The dog row is the source of truth for the partner — don't trust client-sent partner ids
  const { data: dog, error: dogError } = await supabase
```

Replace:
```ts
  const { error: insertError } = await supabase.from("adoption_applications").insert({
    dog_id: dog.id,
    partner_id: dog.partner_id,
    contact_name: name,
    contact_email: email,
    contact_phone: phone,
    message,
    status: "submitted",
  });
```
with:
```ts
  const { error: insertError } = await supabase.from("adoption_applications").insert({
    dog_id: dog.id,
    partner_id: dog.partner_id,
    applicant_id: user?.id ?? null,
    contact_name: name,
    contact_email: email,
    contact_phone: phone,
    message,
    status: "submitted",
  });
```

- [ ] **Step 2: Create the applications-history page**

```tsx
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
```

- [ ] **Step 3: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 4: Manual verification**

Log in as a regular user, go to a dog detail page, submit an adoption application via the "Kapcsolatfelvétel a menhellyel" flow. Then open `/jelentkezeseim` — confirm the application appears with the correct dog name, date, and "Beküldve" status. In the Supabase Dashboard, check `adoption_applications.applicant_id` is set to your user id (not null) on that row.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/applications/route.ts src/app/jelentkezeseim/page.tsx
git commit -m "feat: add /jelentkezeseim page and link applications to logged-in applicants"
```

---

### Task 10: Notifications — status-change trigger + NotificationBell in Navbar

**Files:**
- Create: `supabase/migrations/007_adoption_notifications.sql`
- Create: `src/components/NotificationBell.tsx`
- Modify: `src/components/Navbar.tsx`

**Interfaces:**
- Consumes: `notifications` table (existing schema: `id, user_id, type, title, body, read, data, created_at`)
- Produces: `NotificationBell` component, props `{ userId: string }` — rendered only when `user` is present in `Navbar`.

**Why a DB trigger and not a client-side insert:** the `notifications` table currently has RLS policies for `select` and `update` (own rows) but **no `insert` policy at all** (`supabase/migrations/001_initial_schema.sql:328-329` — confirmed no insert policy exists anywhere in the migrations). A partner's browser client inserting a notification row for a *different* user (the applicant) would be silently rejected by RLS. The existing codebase's own pattern for this exact situation is a `security definer` Postgres trigger (see `handle_new_user` and `handle_new_partner` in `001_initial_schema.sql` and `002_partner_portal.sql`) — a trigger function owned by the database runs with elevated privileges and bypasses RLS, so this plan follows that established convention instead of adding a new insert policy.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/007_adoption_notifications.sql`:

```sql
-- Auto-notify applicants when their adoption application status changes
create or replace function notify_application_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  dog_name text;
  status_label text;
begin
  if new.applicant_id is not null and new.status is distinct from old.status then
    select name into dog_name from dogs where id = new.dog_id;

    status_label := case new.status
      when 'submitted' then 'Beküldve'
      when 'reviewing' then 'Folyamatban'
      when 'approved' then 'Jóváhagyva'
      when 'rejected' then 'Elutasítva'
      when 'withdrawn' then 'Visszavonva'
      else new.status
    end;

    insert into notifications (user_id, type, title, body, data)
    values (
      new.applicant_id,
      'adoption_update',
      'Jelentkezésed státusza módosult',
      coalesce(dog_name, 'A kutya') || ' jelentkezésedhez tartozó státusz: ' || status_label || '.',
      jsonb_build_object('application_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger on_application_status_change
  after update on adoption_applications
  for each row execute procedure notify_application_status_change();
```

- [ ] **Step 2: Apply the migration manually**

Open the Supabase Dashboard → SQL Editor for this project → paste the contents of `supabase/migrations/007_adoption_notifications.sql` → Run. (Confirmed project workflow: migrations are applied by hand in the SQL Editor, not via CLI push.)

Verify: `select * from pg_trigger where tgname = 'on_application_status_change';` in the SQL Editor should return one row.

- [ ] **Step 3: Create the NotificationBell component**

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadUnreadCount() {
      const supabase = createClient();
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    }
    loadUnreadCount();
  }, [userId]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      setNotifications(data ?? []);
      setLoaded(true);

      const unreadIds = (data ?? []).filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
        setUnreadCount(0);
        setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      }
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label="Értesítések"
        className="relative p-1.5 text-[#374151] hover:text-[#1A3D2B] hover:bg-[#F0FDF4] rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-2 z-50 max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#4A5568]">Nincs még értesítésed.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="px-4 py-2.5 border-b border-[#F0FDF4] last:border-0">
                <p className="text-sm font-semibold text-[#1C1C1C]">{n.title}</p>
                {n.body && <p className="text-xs text-[#4A5568] mt-0.5">{n.body}</p>}
              </div>
            ))
          )}
          <Link
            href="/jelentkezeseim"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-xs text-[#1A3D2B] font-semibold hover:bg-[#F0FDF4] mt-1"
          >
            Összes jelentkezésem →
          </Link>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire NotificationBell into the Navbar**

In `src/components/Navbar.tsx`, add the import:

Old:
```tsx
import { createClient } from "@/lib/supabase/client";
```
New:
```tsx
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";
```

Replace the opening of the logged-in branch (added in Task 5):

Old:
```tsx
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
```
New:
```tsx
            {user ? (
              <>
                <NotificationBell userId={user.id} />
                <div className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
```

And close the fragment right after that branch's closing `</div>`:

Old:
```tsx
                )}
              </div>
            ) : (
```
New:
```tsx
                )}
                </div>
              </>
            ) : (
```

(Indentation of the lines in between is unchanged and slightly inconsistent after this edit — that's cosmetic only, not a compile error; run Prettier/ESLint autofix if the repo has one configured, otherwise leave as-is.)

- [ ] **Step 5: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 6: Manual verification**

As a partner user, open `/partner/applications`, change an application's status (e.g. from "Beküldve" to "Folyamatban") for an application that has a real `applicant_id` (submit a fresh test application while logged in as a regular user first, per Task 9's verification, so there's an applicant to notify). Then log in as that applicant and check the Navbar bell — expect an unread badge showing "1". Click the bell — expect the notification text to appear and the badge to clear. Reload the page and reopen the bell — expect the notification still listed but no longer counted as unread.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/007_adoption_notifications.sql src/components/NotificationBell.tsx src/components/Navbar.tsx
git commit -m "feat: notify applicants on adoption application status change"
```

---

## Plan Self-Review Notes

- **Spec coverage:** registration (Task 3), `/csatlakozas` fix (Task 2), profile (Task 6), favorites (Tasks 7-8), application history (Task 9), notifications (Task 10), auth-aware nav + route protection (Tasks 4-5), email-confirmation decision (Task 1) — all six spec sections have a corresponding task.
- **Gap found and fixed during planning:** the spec assumed the `adoption_applications` insert path already captured `applicant_id` for logged-in submitters. It doesn't (`src/app/api/applications/route.ts` never set it) — Task 9 now fixes this as a prerequisite, otherwise `/jelentkezeseim` would always be empty.
- **Gap found and fixed during planning:** the spec's notification approach (partner inserts a notification row client-side) would fail — `notifications` has no RLS insert policy. Task 10 uses a `security definer` trigger instead, matching the codebase's existing pattern for privileged inserts (`handle_new_user`, `handle_new_partner`).
- **Known v1 simplifications (not bugs):** favoriting a *partner* has no UI trigger anywhere yet (schema/RLS support it, and `/kedvencek` will render them if any exist, but nothing in this plan creates one) — matches the spec's non-goals, since only the dog-favorite buttons were called out explicitly. The notification bell is desktop-only in the Navbar; mobile users can still reach `/jelentkezeseim` from the mobile menu.
