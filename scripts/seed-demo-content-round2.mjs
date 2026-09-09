// Round 2: tops up every remaining partner_type (breed_rescue, dog_school,
// boarding, grooming, walker, dog_friendly_place, transport, other) to 10
// rows each, matching the "Szolgáltatásaink" (/szolgaltatasok) category
// cards. Shelter (20) and veterinarian (10) from round 1 already meet or
// exceed 10, so they're untouched here. Same isolated CI Test project as
// round 1 (see scripts/seed-demo-content.mjs) — never production.
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.test", quiet: true });

const SEED_BATCH = "demo-seed-2026-09-09-round2";

const url = process.env.TEST_SUPABASE_URL;
const serviceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("Missing TEST_SUPABASE_URL / TEST_SUPABASE_SERVICE_ROLE_KEY in .env.test");
}
const supabase = createClient(url, serviceKey);

function slugify(text) {
  const map = { á: "a", é: "e", í: "i", ó: "o", ö: "o", ő: "o", ú: "u", ü: "u", ű: "u" };
  return text
    .toLowerCase()
    .replace(/[áéíóöőúüű]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const cities = [
  { city: "Budapest", country: "HU" }, { city: "Debrecen", country: "HU" }, { city: "Szeged", country: "HU" },
  { city: "Pécs", country: "HU" }, { city: "Győr", country: "HU" }, { city: "Berlin", country: "DE" },
  { city: "München", country: "DE" }, { city: "Hamburg", country: "DE" }, { city: "Köln", country: "DE" },
  { city: "Frankfurt", country: "DE" }, { city: "Madrid", country: "ES" }, { city: "Barcelona", country: "ES" },
  { city: "Valencia", country: "ES" }, { city: "Sevilla", country: "ES" }, { city: "Zaragoza", country: "ES" },
  { city: "Paris", country: "FR" }, { city: "Lyon", country: "FR" }, { city: "Marseille", country: "FR" },
  { city: "Toulouse", country: "FR" }, { city: "Bordeaux", country: "FR" }, { city: "Nantes", country: "FR" },
  { city: "Nice", country: "FR" }, { city: "Milano", country: "IT" }, { city: "Roma", country: "IT" },
  { city: "Torino", country: "IT" }, { city: "Bologna", country: "IT" }, { city: "Napoli", country: "IT" },
];
function cityAt(i) {
  return cities[i % cities.length];
}
const phoneCC = { HU: "+36", DE: "+49", ES: "+34", FR: "+33", IT: "+39" };
function phoneFor(country, i) {
  return `${phoneCC[country] ?? "+36"} 30 ${String(200 + i).padStart(3, "0")} ${String(2000 + i * 7).slice(-4)}`;
}

const extraPartnerNames = {
  breed_rescue: ["Border Collie Mentőszolgálat", "Husky Rescue Nordics", "Beagle Baráti Kör Mentés", "Staffie Second Chance UK", "Podenco Rescue Portugal"],
  dog_school: ["Kutyaakadémia Debrecen", "Hundetraining Frankfurt", "Club Canino Sevilla", "Académie Canine Toulouse", "Accademia Cinofila Torino"],
  boarding: ["Kutyaszálló Szeged", "Tierpension Stuttgart", "Hotel Canino Bilbao", "Pension Chiens Nice", "Dog Hotel Bologna"],
  grooming: ["Szőrmeglepetés Szalon", "Fellpflege Studio Leipzig", "Estilismo Canino Sevilla", "Toilettage Chic Bordeaux", "Grooming Style Napoli"],
  walker: ["Kutyafutás Egyesület", "Spaziergang Plus Dresden", "Paseo Feliz Zaragoza", "Balade Canine Nantes", "Passeggiate Canine Torino"],
  dog_friendly_place: ["Kutyabarát Park Debrecen", "Hundewiese Frankfurt", "Parque Canino Sevilla", "Parc Canin Bordeaux", "Area Cani Torino"],
  transport: ["Kontinens Kutyaszállítás", "Tiertransport Nord", "Transporte Mascotas Sur", "Transport Rapide Chiens", "Trasporti Animali Nord"],
  other: ["Kutyás Jogi Tanácsadás", "Hunde-Rechtsberatung", "Asesoría Legal Mascotas", "Conseil Juridique Animaux", "Consulenza Legale Animali"],
};

const typeDescription = {
  breed_rescue: (n, c) => `A ${n} fajtaspecifikus mentőszervezet, amely ${c} környékén segít otthont találni rászoruló kutyáknak.`,
  dog_school: (n, c) => `A ${n} kutyakiképzést és viselkedés-tanácsadást kínál ${c}-ben, kezdőtől haladó szintig.`,
  boarding: (n, c) => `A ${n} biztonságos, szeretetteljes ideiglenes szállást biztosít kutyáknak ${c}-ben, amíg gazdáik utaznak.`,
  grooming: (n, c) => `A ${n} teljes körű kutyakozmetikai szolgáltatásokat nyújt ${c}-ben: fürdetés, szőrvágás, körömvágás.`,
  walker: (n, c) => `A ${n} megbízható sétáltató szolgáltatás ${c}-ben, elfoglalt gazdik kutyáinak.`,
  dog_friendly_place: (n, c) => `A ${n} kutyabarát hely ${c}-ben, ahol a négylábú barátok is szívesen látott vendégek.`,
  transport: (n, c) => `A ${n} biztonságos, EU-kompatibilis kutyaszállítást szervez határokon átnyúlóan is, ${c} központtal.`,
  other: (n, c) => `A ${n} kiegészítő szolgáltatásokat nyújt kutyatulajdonosoknak ${c}-ben és környékén.`,
};

function buildPartner(name, type, globalIndex) {
  const { city, country } = cityAt(globalIndex);
  const slug = `${slugify(name)}-${slugify(city)}-${globalIndex}`;
  return {
    name,
    slug,
    type,
    status: "approved",
    verified: true,
    description: typeDescription[type](name, city),
    country,
    city,
    address: `${["Fő utca", "Kossuth utca", "Petőfi tér", "Rákóczi út", "Szabadság utca"][globalIndex % 5]} ${1 + (globalIndex % 40)}.`,
    phone: phoneFor(country, globalIndex),
    email: `info@${slugify(name)}.example.com`,
    website: `https://${slugify(name)}.example.com`,
    logo_url: `https://picsum.photos/seed/${slug}-logo/300/300`,
    cover_url: `https://picsum.photos/seed/${slug}-cover/1200/400`,
    metadata: { seed_batch: SEED_BATCH },
  };
}

const partnerRows = [];
let gi = 70; // continue after round 1's 0-69
for (const [type, names] of Object.entries(extraPartnerNames)) {
  for (const name of names) partnerRows.push(buildPartner(name, type, gi++));
}

console.log(`Inserting ${partnerRows.length} additional partners (round 2)...`);
const { data: inserted, error } = await supabase.from("partners").insert(partnerRows).select("id, slug, name, type");
if (error) throw error;
console.log(`  -> ${inserted.length} partners inserted.`);

const byType = {};
for (const p of inserted) byType[p.type] = (byType[p.type] ?? 0) + 1;
console.log("By type (round 2 additions):", byType);
console.log("\nSample slugs:");
for (const p of inserted.slice(0, 5)) console.log(`  /partners/${p.slug}`);
