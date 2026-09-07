# 16 — Test and Build Report

Audit date: 2026-09-06. All commands run from repo root `/Users/bankirichard/Developer/MyDog projekt/rescueconnect`. No source was modified; no errors found below were fixed.

## 1. Production build — `npm run build`

**Command**: `npm run build` (→ `next build`)
**Result**: **PASS** — compiled successfully, TypeScript check embedded in the build passed, all 36 routes generated.

Full output:

```
> mydog@0.1.0 build
> next build

▲ Next.js 16.2.10 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 7.2s
  Running TypeScript ...
  Finished TypeScript in 4.7s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/36) ...
  Generating static pages using 7 workers (9/36)
  Generating static pages using 7 workers (18/36)
  Generating static pages using 7 workers (27/36)
✓ Generating static pages using 7 workers (36/36) in 316ms
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /admin
├ ƒ /admin/activity
├ ƒ /admin/applications
├ ƒ /admin/dashboard
├ ƒ /admin/dogs
├ ƒ /admin/login
├ ƒ /admin/partners
├ ƒ /admin/partners/[id]
├ ƒ /admin/users
├ ƒ /api/applications
├ ƒ /bejelentkezes
├ ƒ /bobilos-utazas
├ ƒ /csatlakozas
├ ƒ /fajtamentok
├ ƒ /gyerekeknek
├ ƒ /jelentkezeseim
├ ƒ /kedvencek
├ ƒ /kutyak
├ ƒ /kutyak/[id]
├ ƒ /kutyak/[id]/kapcsolat
├ ƒ /menhelyek
├ ƒ /mentett-keresesek
├ ƒ /onkentesek
├ ƒ /partner
├ ƒ /partner/applications
├ ƒ /partner/dashboard
├ ƒ /partner/dogs
├ ƒ /partner/dogs/[id]/edit
├ ƒ /partner/dogs/new
├ ƒ /partner/login
├ ƒ /partner/profile
├ ƒ /partner/register
├ ƒ /partners/[slug]
├ ƒ /profil
├ ƒ /regisztracio
├ ƒ /rolunk
└ ƒ /szolgaltatasok


ƒ Proxy (Middleware)

ƒ  (Dynamic)  server-rendered on demand
```

Notes:
- Every route is marked `ƒ` (dynamic/server-rendered on demand) — there are no statically prerendered (`○`) pages. This is expected for an app where nearly every page reads the authenticated user or live Supabase data server-side (e.g. `src/app/layout.tsx:58-71` calls `supabase.auth.getUser()` on every request).
- `ƒ Proxy (Middleware)` confirms `src/proxy.ts` (Next.js 16's renamed middleware convention) was picked up and bundled.
- This build ran against the real production Supabase project (`.env.local` values), per the task instructions — it is a build-time-only check; no writes occurred.
- **36 routes** compiled, matching the file count under `src/app/**/page.tsx` + `src/app/api/applications/route.ts` (35 pages + 1 API route = 36).

## 2. Lint — `npx eslint .`

**Command**: `npx eslint .`
**Result**: **FAIL** — 5 errors, 0 warnings.

Full output:

```
/Users/bankirichard/Developer/MyDog projekt/rescueconnect/src/app/admin/dashboard/page.tsx
  24:35  error  Error: Cannot call impure function during render

`Date.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

/Users/bankirichard/Developer/MyDog projekt/rescueconnect/src/app/admin/dashboard/page.tsx:24:35
  22 |     supabase.from("adoption_applications").select("*", { count: "exact", head: true }).eq("status", "submitted"),
  23 |     supabase.from("profiles").select("*", { count: "exact", head: true })
> 24 |       .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
     |                                   ^^^^^^^^^^ Cannot call impure function
  25 |   ]);
  26 |
  27 |   const stats = [  react-hooks/purity

/Users/bankirichard/Developer/MyDog projekt/rescueconnect/src/app/bobilos-utazas/page.tsx
  194:68  error  `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`  react/no-unescaped-entities

/Users/bankirichard/Developer/MyDog projekt/rescueconnect/src/app/partner/applications/page.tsx
  62:21  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/bankirichard/Developer/MyDog projekt/rescueconnect/src/app/partner/applications/page.tsx:62:21
  60 |   }, [router]);
  61 |
> 62 |   useEffect(() => { load(); }, [load]);
     |                     ^^^^ Avoid calling setState() directly within an effect
  63 |
  64 |   async function changeStatus(id: string, status: string) {
  65 |     setSavingId(id);  react-hooks/set-state-in-effect

/Users/bankirichard/Developer/MyDog projekt/rescueconnect/src/app/rolunk/page.tsx
  59:89  error  `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`  react/no-unescaped-entities

/Users/bankirichard/Developer/MyDog projekt/rescueconnect/src/components/Footer.tsx
  69:40  error  `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`  react/no-unescaped-entities

✖ 5 problems (5 errors, 0 warnings)
```

Breakdown (exact file:line):

| # | File:line | Rule | Type |
|---|---|---|---|
| 1 | `src/app/admin/dashboard/page.tsx:24:35` | `react-hooks/purity` | Impure `Date.now()` call during render (React 19 compiler-era rule) |
| 2 | `src/app/bobilos-utazas/page.tsx:194:68` | `react/no-unescaped-entities` | Raw `"` in JSX text |
| 3 | `src/app/partner/applications/page.tsx:62:21` | `react-hooks/set-state-in-effect` | `setState` called synchronously inside a `useEffect` body (`useEffect(() => { load(); }, [load])` at line 62) |
| 4 | `src/app/rolunk/page.tsx:59:89` | `react/no-unescaped-entities` | Raw `"` in JSX text |
| 5 | `src/components/Footer.tsx:69:40` | `react/no-unescaped-entities` | Raw `"` in JSX text |

Note: the build (`npm run build`) succeeded despite these lint errors — Next.js's build-time ESLint integration and a standalone `npx eslint .` run are not automatically gated together in this project's scripts (`package.json:8` `"lint": "eslint"` is a separate script from `"build": "next build"`, and the build log above shows no ESLint step, only a TypeScript step). This confirms lint is **not enforced at build/deploy time** — these 5 errors could reach production undetected under the current setup.

## 3. Type check — `npx tsc --noEmit`

**Command**: `npx tsc --noEmit`
**Result**: **PASS** — zero output, zero errors.

`tsconfig.json:8` has `"strict": true`, so this is a strict-mode clean pass (not a loosely configured check). Combined with the embedded "Running TypeScript ... Finished TypeScript in 4.7s" step inside `npm run build` (§1) which also passed, TypeScript correctness is solid across the codebase as of this audit.

## 4. Test framework

**Command**: `find . -iname "*.test.*" -o -iname "*.spec.*" | grep -v node_modules`
**Result**: no output (zero matches).

**package.json scripts** (`package.json:5-8`): `dev`, `build`, `start`, `lint` — no `test` script.
**devDependencies** (`package.json:29-36`): `@tailwindcss/postcss`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`, `tailwindcss`, `typescript` — no vitest, jest, playwright, cypress, or any test runner.

**NOT_FOUND: no test framework configured, 0 automated tests exist.** This is a hard gap for a founder-facing launch-readiness review: there is no automated regression safety net for the auth/RLS-gated flows, the adoption application flow, or the admin/partner portals. Any change ships on the strength of manual testing and the TypeScript/build checks above only.

## 5. Security review

See `12-security-and-permissions.md` (separate report) — not duplicated here per task scope.

## 6. Summary

| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | PASS |
| Lint | `npx eslint .` | FAIL (5 errors) |
| Typecheck | `npx tsc --noEmit` | PASS (strict mode) |
| Tests | `find . -iname "*.test.*" -o -iname "*.spec.*"` | NOT_FOUND (0 tests, no framework) |
