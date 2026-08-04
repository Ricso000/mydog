# Auto.de-ihletett fejlesztések — Design Spec

Dátum: 2026-07-23
Státusz: Jóváhagyva, implementáció előtt (a felhasználói fiók rendszer plan Task 10 után indul)

## Kontextus

Az auto.de (autó-kereskedő oldal) elemzése alapján 5 ötlet merült fel, amiből a felhasználó mind az 5-öt jóváhagyta. Vizsgálat után:

- **"Hogyan működik" bizalomépítő szekció**: már létezik a főoldalon (`src/app/page.tsx:240-258`, "Hogyan működik?" cím, 4 lépéses ikon-grid). **Nincs teendő ezzel** — nem duplikáljuk máshova, kivéve ha a felhasználó külön kéri.
- **Partner-regisztrációs CTA mindenhol**: már megvan (`/csatlakozas` → `/partner/register`, footer + navbar). **Nincs teendő.**

A maradék 3 tényleges fejlesztési munka:

1. **Bizalom-jelvények a kutya-kártyákon** — a `/kutyak` (kereső/lista) oldal kártyái jelenleg nem mutatják az `is_vaccinated`, `is_neutered`, `good_with_kids`, `good_with_dogs`, `good_with_cats` mezőket, pedig ezek már léteznek az adatbázisban (`supabase/migrations/001_initial_schema.sql:110-136`), és a kutya-részletező oldal (`/kutyak/[id]`) már meg is jeleníti őket. A lista-kártyákon (`src/app/kutyak/page.tsx:227-273`) viszont hiányoznak — pedig auto.de is közvetlenül a kártyán mutatja a lényeges infót (fogyasztás, garancia), kattintás nélkül.

2. **Ország → Város kaszkádoló szűrő** — jelenleg a `/kutyak` szűrő (`src/components/KutyakFilters.tsx`) csak egy lapos Ország legördülőt kínál, várost egyáltalán nem lehet szűrni, és nincs semmilyen egymásra épülő (kaszkádoló) szűrőpár sehol. Auto.de-n a Márka → Modell egymásra épül; nálunk ennek a legjobb megfelelője az Ország → Város, mivel mindkét mező létezik a `dogs` táblában (`country`, `city`), csak `city` nincs kihasználva szűrésre.

3. **Mentett keresés + értesítés** — auto.de "Gespeicherte Suchen" funkciója teljesen hiányzik nálunk (ellenőrizve: nincs `saved_search`/`alert`/`watchlist` fogalom sehol a kódban vagy sémában). Ez egy új alrendszer: a felhasználó elmentheti az aktuális szűrését, és amikor egy új, illeszkedő kutya megjelenik a nyilvános keresőben, értesítést kap — ez közvetlenül a most épülő `notifications` táblára és `NotificationBell` komponensre épül (a felhasználói fiók terv Task 10-e).

## Cél

1. Kutya-kártyák (`/kutyak` lista) mutassák a bizalom-jelvényeket (oltva, ivartalanítva, gyerek/kutya/macskabarát).
2. `/kutyak` szűrő kapjon Ország → Város kaszkádoló szűrést (a Város opciók az adott országban ténylegesen elérhető kutyák városaiból származnak).
3. Felhasználók elmenthessék a keresésüket, és kapjanak értesítést, amikor egy új, illeszkedő kutya nyilvánosan láthatóvá válik (azaz `dogs.status = 'available'` ÉS a kutya partnere `status = 'approved'`).

## Nem cél

- Nincs "ár" fogalom kutyáknál, így az auto.de árkedvezmény/finanszírozás-vizuál nem releváns.
- A mentett keresés v1-ben nem támogat email-értesítést, csak az alkalmazáson belüli értesítést (a `notifications` tábla + `NotificationBell`, amit a Task 10 épít) — email-csatorna külön kör.
- Fajta (`breed`) szerinti kaszkádoló szűrő nem kell külön, mert a meglévő szabad szöveges keresés (`q`) már `ilike` egyezést csinál a `breed` mezőre is (`src/app/kutyak/page.tsx:97-98`).

## Függőség

Ez a terv a felhasználói fiók rendszer terv (`docs/superpowers/plans/2026-07-23-felhasznaloi-fiok.md`) **Task 10-ére épül** (a `notifications` tábla RLS-e és a `NotificationBell` komponens már megvan onnantól) — ez a terv csak azután indul, hogy az a plan lezárult.

## Adatmodell-változások

- Új tábla: `saved_searches` (`id`, `profile_id`, `name`, `filters jsonb`, `created_at`), RLS: tulajdonos kezelheti a sajátját (ugyanaz a minta, mint `favorite_dogs`).
- Két új DB trigger (`dogs` insert/update, `partners` update) ami meghívja a közös `notify_matching_saved_searches(dog_id)` függvényt, amikor egy kutya ténylegesen nyilvánosan láthatóvá válik — ez lefedi mindkét esetet: (a) egy már jóváhagyott partner új kutyát ad fel, (b) egy admin jóváhagy egy partnert, aminek már voltak "available" kutyái.

## Útvonalak

| Útvonal | Állapot | Funkció |
|---|---|---|
| `/kutyak` | módosítva | Bizalom-jelvények a kártyákon, Ország→Város szűrő, "Mentés keresésként" gomb |
| `/mentett-keresesek` | új | Saját mentett keresések listája, törlés, "Megnézem" link a `/kutyak`-ra visszatöltve a szűrőkkel |

## Hibakezelés

- "Mentés keresésként" bejelentkezés nélkül → irányítás `/bejelentkezes?redirect=/kutyak`-ra (ugyanaz a minta, mint a kedvencek gomboknál).
- A trigger-alapú egyezés-vizsgálat hibája (pl. törölt kutya) nem eshet ki más funkcionalitást — a trigger csak a `notifications` táblába ír, semmilyen más műveletet nem befolyásol.

## Tesztelés

Mivel a login jelenleg platform-szinten blokkolt (a felhasználói fiók terv Task 1-je még nincs kész), ugyanaz a korlátozás vonatkozik erre a tervre is: kód/build/lint szinten minden ellenőrizhető, élő bejelentkezéses teszt (keresés mentése, majd egy új kutya feladása után az értesítés megjelenése) csak azután végezhető el, hogy a Supabase "Confirm email" beállítás ki lett kapcsolva.

## Kiegészítés (2026-08-03): mobile.de kutatás alapján 2 új tétel

Időközben a Task 1 (email-megerősítés) és a 007-es migráció is élesedett, így a felhasználói fiók rendszer élőben tesztelhető és tesztelve is lett (regisztráció → belépés → kedvenc → jelentkezés mind működik). A Task 11-13 is elkészült eddig.

A felhasználó ezután a mobile.de-t (nem az auto.de-t) jelölte meg jobb referenciaként, és kérte annak áttekintését is. A mobile.de app-jából 2 új, gyorsan hozzáadható ötlet került jóváhagyásra:

4. **"Kövesd a menhelyet"** — mobile.de-n nemcsak egy adott hirdetést, hanem egy egész kereskedőt is lehet követni ("Follow trusted dealers for personalized direct offers"). Nálunk ehhez **már létezik** a `favorite_partners` tábla és RLS (`supabase/migrations/001_initial_schema.sql:253-258,333`), csak soha nem volt hozzá UI. Ez ugyanazt a minta ismétli meg, mint a mentett keresés (Task 13-15), csak egy adott partnerre szűkítve: egy "Menhely követése" gomb a partner-profil oldalon (`src/app/partners/[slug]/page.tsx`) + egy trigger, ami értesíti a követőket, amikor a menhely új, nyilvánosan látható kutyát tölt fel.

5. **Megosztás gomb bekötése** — a kutya-részletező oldalon (`src/app/kutyak/[id]/page.tsx:203-212`) már ott van egy "Megosztás" gomb, de jelenleg semmit nem csinál (pontosan úgy, ahogy a szívecske-gombok sem csináltak semmit a Task 7 előtt). Ezt natív böngésző-megosztással (Web Share API, vágólapra-másolás fallback-kel) be lehet kötni.

### Nem cél (ezekhez az új tételekhez)

- A mobile.de AI-alapú beszélgetős keresője ("mobee") **külön, nagyobb tervezési kört igényel** (LLM-integráció) — nem része ennek a tervnek, csak megjegyzésre került.
