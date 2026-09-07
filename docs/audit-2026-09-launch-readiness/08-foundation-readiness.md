# 08 — Foundation / Nonprofit-Donation Readiness

Scope: Foundation landing page, mission, one-time/recurring donation, virtual adoption, donor
account, donor history, receipts, impact updates, corporate supporters, sponsorship display, SZJA 1%
education section, grant content. Cross-referenced against report 07's finding that the `donations`
table has no reachable write path.

## 1. Is there a dedicated Foundation route?

`find src/app -maxdepth 2 -type d` (full route list, reproduced from this session):

```
admin, admin/activity, admin/applications, admin/dashboard, admin/dogs, admin/login, admin/partners,
admin/users, api, api/applications, bejelentkezes, bobilos-utazas, csatlakozas, fajtamentok,
gyerekeknek, jelentkezeseim, kedvencek, kutyak, kutyak/[id], menhelyek, mentett-keresesek,
onkentesek, partner, partner/applications, partner/dashboard, partner/dogs, partner/login,
partner/profile, partner/register, partners, partners/[slug], profil, regisztracio, rolunk,
szolgaltatasok
```

`find src/app -iname "*alapitvany*" -o -iname "*foundation*" -o -iname "*adomany*"` → **0 results**.

**Status: NOT_FOUND.** There is no `/alapitvany`, `/foundation`, `/adomany`, or similarly named route.
The closest analog is `/rolunk` ("About us", `src/app/rolunk/page.tsx`), which is a generic company
about-page (mission blurb, team photos with placeholder emoji avatars, fake partner-logo grid, a
contact form) — not a donation-oriented Foundation page. It contains **zero** donation CTA, donate
button, or link to any giving mechanism (`grep -n "donat\|Adományoz\|Támogat" src/app/rolunk/page.tsx`
= 0 hits).

## 2. Item-by-item

| Item | Evidence | Status |
|---|---|---|
| Foundation landing page | No route named for it exists (§1); `/rolunk` is a generic about-us page with no donation framing | **NOT_FOUND** |
| Mission statement | `src/app/rolunk/page.tsx:30-64` — hero + "Küldetésünk" (mission) section, fully hardcoded JSX text, no CMS/DB read | **UI_ONLY** (present, static copy only) |
| One-time donation | `/szolgaltatasok` has one static card, "🎁 Támogathatsz", with descriptive text only, no `href`, no button, no form (`src/app/szolgaltatasok/page.tsx:11`). `donations` table exists (`supabase/migrations/001_initial_schema.sql:173-184`) but has no INSERT RLS policy anywhere in migrations 001–010 and no service-role API route creates rows in it — confirmed by report 07 §1 | **PLACEHOLDER** |
| Recurring donation | No `interval`/`frequency`/`recurring` column on `donations`; no UI concept of a recurring gift anywhere (`grep -rni "recurring\|havi adomány\|rendszeres támogat" src` = 0 hits, this session) | **NOT_FOUND** |
| Virtual adoption | `virtual_adoptions` table exists with `monthly_amount`, `status` (`active`/`paused`/`cancelled`) (`001_initial_schema.sql:189-196`), but `grep -rn "virtual_adopt" src` = 0 — no page, component, or copy references it at all, not even as marketing text. RLS has select-only policy, no insert path (report 07 §1) | **PLACEHOLDER** (schema-only, entirely unreachable — weaker than UI_ONLY since there isn't even front-end copy mentioning it) |
| Donor account | `/profil` (`src/app/profil/page.tsx`) is the only account-settings page; it reads `profiles.full_name` and renders a single `ProfileForm` (name edit only, `src/components/ProfileForm.tsx` not read further as out of scope, but `profil/page.tsx` itself queries nothing donation-related). No "donor" concept, no donor badge/tier, no separate donor-account view | **NOT_FOUND** |
| Donor history | No page or query anywhere selects from `donations` where `donor_id = auth.uid()` despite the RLS policy `"Users see own donations"` existing for exactly that purpose (`001_initial_schema.sql:342`) — the policy is unused dead code; `grep -rn "from(\"donations\")\|from('donations')" src` = 0 hits in application code | **NOT_FOUND** |
| Receipts | `src/lib/email.ts` (full file read) sends exactly two transactional emails: `sendApplicationReceivedToPartner` and `sendApplicationConfirmationToApplicant` — both adoption-application notifications via Resend. No donation-receipt, no tax-deduction email, no invoice generator anywhere (`grep -rn "receipt\|nyugta\|számla" src` = 0 hits) | **NOT_FOUND** |
| Impact updates | No "impact"/"hatás" content section found on `/rolunk` or `/szolgaltatasok` (`grep -rni "impact\|hatás" src/app/rolunk/page.tsx src/app/szolgaltatasok/page.tsx` = 0 hits); stat blocks that exist (e.g. "18 450+ Megmentett kutya" in `szolgaltatasok/page.tsx:83`) are static marketing numbers, not donor-funded-outcome reporting tied to any donation | **NOT_FOUND** |
| Corporate supporters | `grep -rni "corporate\|vállalati\|sponsor" src` = 0 hits, this session. `/rolunk` has a "Partnereink" (Our partners) logo grid (`src/app/rolunk/page.tsx:17-24, 106-121`) but the six entries ("Állatorvosi Kamara", "EU Pet Network", "Dog Rescue Europe", etc.) are hardcoded placeholder labels in colored boxes, not real logos, not linked to any DB row, and not framed as financial sponsors — they read as generic "as seen with" trust badges | **PLACEHOLDER** |
| Sponsorship display | Same as above — no distinct sponsorship tier/display beyond the static logo grid | **PLACEHOLDER** |
| SZJA 1% education section | `grep -rni "szja\|1%\|1 százalék\|adószám" src supabase` = 0 hits anywhere in the repository | **NOT_FOUND** |
| Grant content | `grep -rni "grant\b\|pályázat" src` returns one unrelated hit, `src/app/gyerekeknek/page.tsx:140` ("Rajzpályázat" — a children's drawing contest, not institutional grant funding). No grant-seeking, grant-received, or grant-application content exists | **NOT_FOUND** |

## 3. Marketing-copy-only vs. mechanically backed — summary

Everything that exists under the Foundation umbrella is **marketing copy with zero backing
mechanics**:

- Mission statement, values, team, partner-logo grid on `/rolunk` — static JSX, no data source, no
  donation linkage.
- The one donation-adjacent artifact, the "Támogathatsz" card on `/szolgaltatasok`, is not even
  clickable — it has no `href`/`onClick`, so it isn't UI_ONLY in the sense of "a working dead-end
  button," it's inert descriptive text inside a grid.
- The database has two tables that *could* back a donation/virtual-adoption feature
  (`donations`, `virtual_adoptions`), but per report 07 §1 they have no INSERT RLS policy anywhere
  across all ten migrations and no service-role backend route creates rows in them either. They are
  unreachable dead schema, not a backend that's merely unconnected to a UI.
- No donor account, donor history, receipt, or impact-reporting surface exists at all — not as a
  stub page, not as a "coming soon," simply absent.

**Overall Foundation readiness: NOT_FOUND as a distinct product surface.** What exists is one
generic about-us marketing page (`/rolunk`) plus one non-functional donation mention buried in the
services page; there is no launchable Foundation/donation feature for a September 2026 go-live.
