# Felhasználói fiók rendszer — Design Spec

Dátum: 2026-07-23
Státusz: Jóváhagyva, implementáció előtt

## Kontextus

A RescueConnect (MyDog) oldalon jelenleg:
- **Partner (menhely) oldal** teljesen működik: regisztráció (`/partner/register`), belépés (`/partner/login`), kutya feltöltés, admin jóváhagyás utáni publikus megjelenés.
- **Felhasználói (nem partner) oldal** gyakorlatilag hiányzik:
  - Nincs regisztrációs form közönséges látogatóknak sehol.
  - A fő navigáció/footer "Regisztráció" gombja a `/csatlakozas` oldalra mutat, ami egy díszlet form (nincs `<form>`, `onSubmit`, state, vagy Supabase hívás).
  - `/bejelentkezes` csak belépést tud (`signInWithPassword`), fiók létrehozására nincs mód.
  - A `favorite_dogs` / `favorite_partners` táblák és RLS szabályok megvannak az adatbázisban, de a UI szívecske gombjai (`src/app/kutyak/[id]/page.tsx:187-199, 290-292`) nincsenek bekötve — nincs `onClick`.
  - A `/kedvencek` route linkelve van a Navbarban és a Footerben, de az oldal nem létezik (404).
  - Az `adoption_applications` tábla működik (bejelentkezés nélkül is be lehet adni jelentkezést), de a felhasználónak nincs saját nézete a jelentkezéseiről.
  - A `notifications` tábla létezik, de nincs semmilyen frontend hozzá.

Az adatbázis séma (profiles, favorite_dogs, favorite_partners, adoption_applications, notifications — `supabase/migrations/001_initial_schema.sql`) már teljes egészében készen áll, RLS szabályokkal együtt. Ez a projekt tehát **frontend és bekötési munka**, nem sématervezés.

## Cél

Egy teljes, működő felhasználói fiók rendszer (v1), ami lefedi:
1. Regisztráció és belépés
2. Profil megtekintés/szerkesztés
3. Kedvencek (kutyák és menhelyek) — működő szívecske gombok
4. Saját örökbefogadási jelentkezések listája és állapota
5. Alap értesítések (olvasatlan jelzés a Navbarban)

## Nem cél (v1-ben kimarad)

- Email-megerősítés a regisztrációnál (kikapcsolva, amíg a Resend domain hitelesítés nincs kész — ld. `email-resend-test-mode` projekt-memória). Később bekapcsolható, amint a domain hitelesítve van.
- Social login (Google stb.)
- Jelszó-emlékeztető / "elfelejtett jelszó" flow — ha szükséges, külön körben.
- Anonim (bejelentkezés nélkül beadott) jelentkezések utólagos összekapcsolása egy később létrehozott fiókkal.
- Donations / virtual adoptions frontend (külön, már jelzett jövőbeli munka).

## Útvonalak

| Útvonal | Állapot | Funkció |
|---|---|---|
| `/regisztracio` | új | Felhasználói regisztráció (`supabase.auth.signUp`) |
| `/csatlakozas` | javítva | Törött díszlet → választó oldal: "Kutyát keresek" → `/regisztracio`, "Menhely/szolgáltató vagyok" → `/partner/register` |
| `/bejelentkezes` | meglévő, változatlan logika | Sikeres belépés utáni redirect célja bővül (pl. `/profil`) |
| `/profil` | új | Név/avatar szerkesztés, kijelentkezés |
| `/kedvencek` | új (jelenleg 404) | Saját kedvenc kutyák + kedvenc menhelyek listája |
| `/jelentkezeseim` | új | Saját örökbefogadási jelentkezések + állapotuk |

## Auth-szerkezet

- **Supabase Auth**: email-confirmation kikapcsolva — regisztráció után azonnali belépés, ugyanaz a minta mint a `partner/register/page.tsx:64-100`-ban, csak `partners` insert nélkül (a `handle_new_user` trigger már automatikusan létrehozza a `profiles` sort `role: 'user'` alapértelmezéssel).
- **`src/proxy.ts`**: a `matcher` bővül `/profil`, `/kedvencek`, `/jelentkezeseim` útvonalakkal. Ugyanaz a mintázat mint a jelenlegi `/partner/*` védelem (proxy.ts:34-38): bejelentkezés nélkül → `/bejelentkezes?redirect=<eredeti út>`.
- **Navbar auth-tudatossá tétele**: a root `src/app/layout.tsx` (server component) lekéri a bejelentkezett usert szerver oldalon és propként adja át a `Navbar`-nak (jelenleg a Navbar teljesen kliens oldali, auth-ismeret nélküli — `src/components/Navbar.tsx`). A Navbar ez alapján dönt:
  - Bejelentkezve: profil-menü (név, "Kedvencek", "Jelentkezéseim", "Kijelentkezés").
  - Kijelentkezve: jelenlegi "Regisztráció" gomb (a `/csatlakozas` választóra mutat) + új "Bejelentkezés" link.
  - Kliens oldalon `supabase.auth.onAuthStateChange` biztosítja az azonnali frissülést (pl. kijelentkezés gombra nem kell teljes reload).

## Kedvencek bekötése

- Új kliens komponens: `FavoriteButton` (props: `dogId` vagy `partnerId`), ami a megfelelő `favorite_dogs`/`favorite_partners` sort toggle-öli (insert ha nincs, delete ha van), optimista UI-frissítéssel.
- Bekötés a meglévő, jelenleg üres gombokba: `src/app/kutyak/[id]/page.tsx:187-199` (szívecske ikon) és `:290-292` ("Kedvencekhez adom" gomb).
- Ha a felhasználó nincs bejelentkezve és a gombra kattint: irányítás `/bejelentkezes?redirect=<aktuális út>`-ra. A kutyák böngészése és megtekintése bejelentkezés nélkül is elérhető marad — csak a kedvencelés kér fiókot.

## Jelentkezéseim + Értesítések

- `/jelentkezeseim`: lista az `adoption_applications` tábla `applicant_id = auth.uid()` sorairól (RLS ezt már engedi: `001_initial_schema.sql:322`), állapot-jelzéssel (`application_status` enum: submitted/reviewing/accepted/rejected).
- Értesítés: amikor egy partner egy jelentkezés állapotát módosítja, egy insert kerül a `notifications` táblába a meglévő `adoption_update` típussal (`notification_type` enum, `001_initial_schema.sql:36-39` — nincs szükség új migrációra). A Navbarban egy kis pötty jelzi az olvasatlan (`read = false`) értesítéseket; kattintásra lenyíló lista, megnyitáskor "olvasottá" jelölés.

## Hibakezelés

- Duplikált email regisztrációnál: Supabase hibaüzenet magyar fordítása, ugyanazzal a mintával mint `bejelentkezes/page.tsx:22-25`.
- Kedvenc toggle hiba (pl. hálózati hiba): optimista UI visszaállítása + rövid hibaüzenet.
- Jogosultsági hiba (RLS elutasítás) bármelyik oldalon: felhasználóbarát hibaüzenet, nem nyers Supabase hibakód.

## Tesztelés

Manuális böngészős smoke test a fő útvonalon:
1. Regisztráció a `/regisztracio`-n → azonnali belépés.
2. Kedvenc hozzáadása egy kutyához a `/kutyak/[id]`-n → megjelenik a `/kedvencek`-en.
3. Örökbefogadási jelentkezés beadása → megjelenik a `/jelentkezeseim`-ben, helyes állapottal.
4. RLS-ellenőrzés: egy második teszt-fiókkal bejelentkezve az első fiók kedvencei/jelentkezései nem látszanak.
5. Navbar helyesen vált bejelentkezett/kijelentkezett állapot között, `/profil` és `/kedvencek` proxy-védelme működik (bejelentkezés nélkül redirect történik).

