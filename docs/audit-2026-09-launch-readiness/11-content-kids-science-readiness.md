# 11 — Content Readiness: Kids, Knowledge/News, Science

Audit date: 2026-09-06. Method: direct source read + `find`/`grep` over `src/app`, `src/components`, plus one live `curl` against the (already-running) local dev server. No source was modified.

Classification buckets used below, per spec:
- **real dynamic feature** — content is fetched from a CMS/DB table at request time
- **static hardcoded content** — a real page with real copy/design, but content lives in the JSX/TS source, not a CMS or DB
- **placeholder** — a stub page, minimal/filler content
- **future concept** — referenced in nav/copy but no page exists (404)

---

## Summary table

| Area | Status | Bucket |
|---|---|---|
| Kids (`/gyerekeknek`) | PARTIAL | static hardcoded content (page) + placeholder (interactive features) |
| Knowledge / News (`/hirek`) | NOT_FOUND | future concept (nav link, no route, 404) |
| Knowledge / "Tudástár" (services page mention) | NOT_FOUND | future concept (copy only, no page, no link) |
| Science (research/university/publications) | NOT_FOUND | not present anywhere in the codebase |

---

## 1. Kids (`/gyerekeknek`)

File: `src/app/gyerekeknek/page.tsx` (160 lines, full file read).

**Structure observed:**
- Hero section with heading/subheading and a "Mit tanulhatsz nálunk?" (What can you learn here?) card listing 4 static learning topics (`learningItems`, lines 17–22): understanding dog language, responsible pet ownership, animal welfare, good deeds. This is the "responsible-ownership education" / "safety-etiquette" content the spec asked about — it exists only as four one-line icon+label chips, not as actual educational copy, articles, or safety guidance text.
- "Mesék a kutyusokról" (Stories) section (lines 3–8, 67–94): 4 story cards (`stories` array) with only a title, age-range badge, and emoji — e.g. `{ title: "Bátor Mancs kalandja", age: "5-8 éveseknek", ... }`. **There is no actual story text or content anywhere** — each card is a decorative tile with an "📖 Olvasás" (Read) `<button>` (line 86–88) that has **no `onClick` handler and no `href`** — clicking it does nothing.
- "Játékok és kvízek" (Games/quizzes) section (lines 10–15, 96–116): 4 game cards (`games` array: Kvíz, Párosító játék, Gondozási kihívás, Színezők) again with only icon/title/description and a `<button>` with no handler — none of the quiz/matching-game/coloring-page functionality exists; these are non-functional decorative buttons.
- Bottom cards section (lines 118–156): "Tudtad?" fun-fact box (one static sentence about dogs recognizing 150 sounds), a "Heti küldetés" (weekly quest) progress bar hardcoded to 3/5 with no state or backend, a "Rajzpályázat" (drawing contest) card with a non-functional "Részvétel" button, and a "Szülőknek és tanároknak" (parents/teachers) card with a non-functional "Anyagok letöltése" (download materials) button.

**Content CMS check:** grep of the file and directory shows no `fetch`, no `supabase.from(...)`, no `import` of any data-fetching hook — every array (`stories`, `games`, `learningItems`) is a literal constant defined at the top of the file (lines 3–22). **Content is 100% hardcoded JSX/TS, not pulled from any CMS or DB table.**

**Parent-facing layer:** The only parent/teacher-facing element is the single card at line 146–153 ("Szülőknek és tanároknak — Oktatási segédanyagok és tanmenet tippek") with a decorative, non-functional download button. There is no separate parent portal, no downloadable PDF, no linked resource.

**Classification: PARTIAL.**
- The page shell (hero, sections, copy, design) is a **static hardcoded content** page — real, designed, on-brand Hungarian copy.
- But every interactive/content-delivery element inside it (story reading, quizzes, matching game, coloring-page download, weekly-quest tracking, drawing-contest entry, parent materials download) is a **placeholder**: the UI affordance exists (a button) but there is zero backing functionality — no onClick, no route, no file, no state.

---

## 2. Knowledge / News

**Nav evidence:** `src/components/Navbar.tsx` line 16: `{ href: "/hirek", label: "Hírek" }` — appears in both the desktop nav (line 56–65) and the mobile nav (line 149–161), so it's a prominent, always-visible top-level nav item.

**Route existence check:**
```
find src/app -type d -iname "*hir*"   → (no output — no directory named hirek/hirek* exists)
find src/app -name page.tsx | sort    → confirms no src/app/hirek/page.tsx among the 34 routes in the app
```
**Live confirmation:** `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/hirek` → **`404`**.

**Classification: NOT_FOUND / future concept.** The "Hírek" (News) nav link is real and rendered on every page, but clicking it 404s. There is no knowledge-base, blog, or news content anywhere in the codebase — this is a nav link to a page that was never built.

**Secondary "Tudástár" (Knowledge base) mention:** `src/app/szolgaltatasok/page.tsx` line 10: one entry in the static `services` array — `{ icon: "📚", title: "Tudástár & Tanácsok", desc: "Cikkek, videók és szakértői tanácsok az örökbefogadásról, a kutya neveléséről és egészségéről.", color: "bg-teal-50" }`. This renders as a plain, non-clickable description card in a services grid (line 104–112 renders `services.map` as `<div>` tiles, not `<Link>`s) — it is descriptive marketing copy about a knowledge base that doesn't exist as a page or link anywhere. **Classification: future concept** (mentioned in copy, no page, not even linkable, so no 404 to observe — it was never wired to a route at all).

---

## 3. Science (research / university / publications)

Searched the full `src/` tree case-insensitively for: `science`, `kutatás`/`kutatas` (research), `egyetem` (university), `publikáció`/`publikacio` (publication), `researcher`, `research`:
```
grep -rniE "science|kutatás|kutatas|egyetem|publikáció|publikacio|researcher|research" src/
→ (zero matches)
```
No page, component, nav link, or piece of copy anywhere in the codebase references scientific research, university partnerships, researcher profiles, or publications.

**Classification: NOT_FOUND.** This content area does not exist in any form — not even as a placeholder or a nav mention. It appears to be entirely absent from the current build (no evidence it was ever planned in-repo).

---

## Evidence index

- `src/app/gyerekeknek/page.tsx` (full file, 160 lines) — hardcoded arrays lines 3–22; non-functional buttons lines 86–88, 109–111, 142–144, 150–152.
- `src/components/Navbar.tsx:16` — `/hirek` nav link definition.
- `find src/app -name page.tsx` — full route list, no `hirek` or `tudastar` route present.
- `curl http://localhost:3000/hirek` → `404` (live, read-only GET).
- `src/app/szolgaltatasok/page.tsx:10` — "Tudástár & Tanácsok" static description card, no link.
- `grep -rniE "science|kutatás|..."` over `src/` — zero results (science/research area NOT_FOUND).
