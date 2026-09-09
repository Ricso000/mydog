// One-off demo/QA content seeder — populates the isolated `MyDog CI Test`
// Supabase project (never production) with fictional shelters, vets, other
// partner types, and dogs so the Preview deployment has real browsable
// content. Reads TEST_SUPABASE_URL / TEST_SUPABASE_SERVICE_ROLE_KEY from
// .env.test. Safe to re-run — every seeded row is tagged via
// metadata.seed_batch so it can be found and removed later.
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.test", quiet: true });

const SEED_BATCH = "demo-seed-2026-09-09";

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
  { city: "Budapest", country: "HU" },
  { city: "Debrecen", country: "HU" },
  { city: "Szeged", country: "HU" },
  { city: "Pécs", country: "HU" },
  { city: "Győr", country: "HU" },
  { city: "Berlin", country: "DE" },
  { city: "München", country: "DE" },
  { city: "Hamburg", country: "DE" },
  { city: "Köln", country: "DE" },
  { city: "Madrid", country: "ES" },
  { city: "Barcelona", country: "ES" },
  { city: "Valencia", country: "ES" },
  { city: "Paris", country: "FR" },
  { city: "Lyon", country: "FR" },
  { city: "Marseille", country: "FR" },
  { city: "Milano", country: "IT" },
  { city: "Roma", country: "IT" },
  { city: "Amsterdam", country: "NL" },
  { city: "Warszawa", country: "PL" },
  { city: "Wien", country: "AT" },
  { city: "Praha", country: "CZ" },
  { city: "Cluj-Napoca", country: "RO" },
];
function cityAt(i) {
  return cities[i % cities.length];
}

const phoneCC = { HU: "+36", DE: "+49", ES: "+34", FR: "+33", IT: "+39", NL: "+31", PL: "+48", AT: "+43", CZ: "+420", RO: "+40" };
function phoneFor(country, i) {
  return `${phoneCC[country] ?? "+36"} 30 ${String(100 + i).padStart(3, "0")} ${String(1000 + i * 7).slice(-4)}`;
}

const shelterNames = [
  "Reménység Állatmenhely", "Négy Mancs Menedék", "Új Esély Kutyamentés", "Szívvel-Lélekkel Menhely",
  "Örökzöld Állatotthon", "Napsugár Menhely", "Csaholó Barátok Egyesülete", "Hűség Állatvédő Alapítvány",
  "Happy Tails Rescue", "Safe Haven Animal Shelter", "Loyal Paws Rescue Center", "Second Chance Hundehilfe",
  "Refugio Los Amigos", "Refugio Patitas Felices", "Refuge Cœur de Chien", "SOS Chiens Abandonnés",
  "Rifugio Amici a Quattro Zampe", "Canile Speranza", "Dierenopvang De Vriendschap", "Schronisko Cztery Łapy",
];

const vetNames = [
  "Dr. Kovács Állatorvosi Rendelő", "PetCare Állatorvosi Centrum", "Tierklinik am Stadtpark",
  "Tierärztliche Praxis Nordstadt", "Clínica Veterinaria San Martín", "Hospital Veterinario Central",
  "Cabinet Vétérinaire du Parc", "Clinica Veterinaria Roma Sud", "Dierenkliniek Amsterdam Centrum",
  "Klinika Weterynaryjna Warszawa",
];

const otherPartnerNames = {
  breed_rescue: ["Magyar Vizsla Mentés Egyesület", "Labrador Rescue Deutschland", "Galgo Rescue España", "Berger Allemand Sauvetage France", "Bassotto Salvataggio Italia"],
  dog_school: ["Kutyaiskola Budapest", "Hundeschule Berlin-Mitte", "Escuela Canina Madrid", "École Canine de Paris", "Scuola Cinofila Milano"],
  boarding: ["Kutyapanzió Pest", "Hundepension München", "Residencia Canina Valencia", "Pension Canine Lyon", "Pensione per Cani Roma"],
  grooming: ["Mancsmosoda Kutyakozmetika", "Hundesalon Hamburg", "Peluquería Canina Barcelona", "Salon de Toilettage Marseille", "Salone di Toelettatura Milano"],
  walker: ["Sétáltató Csapat Budapest", "Gassi-Service Köln", "Paseadores Caninos Madrid", "Les Promeneurs de Chiens", "Amsterdam Dog Walkers"],
  dog_friendly_place: ["Kutyabarát Kávézó Budapest", "Hundefreundliches Café Berlin", "Café Perro Amigo Madrid", "Café Chien Bienvenu Paris", "Bar Cane Benvenuto Milano"],
  transport: ["EU Kutyaszállítás Kft.", "Tiertransport Deutschland", "Transporte Animal España", "Transport Animalier France", "Trasporto Animali Italia"],
  other: ["Kutyás Egészségbiztosítás", "Hunde-Versicherung Plus", "Seguro para Mascotas Feliz", "Assurance Animaux Confiance", "Assicurazione Cani Sereno"],
};

const typeDescription = {
  shelter: (n, c) => `A ${n} ${c}-ben működő állatmenhely, amely gazdátlan kutyáknak biztosít ideiglenes otthont, amíg végleges gazdára nem találnak.`,
  veterinarian: (n, c) => `A ${n} teljes körű állatorvosi ellátást nyújt ${c}-ben: oltás, ivartalanítás, chippezés és sürgősségi ellátás.`,
  breed_rescue: (n, c) => `A ${n} fajtaspecifikus mentőszervezet, amely ${c} környékén segít otthont találni rászoruló kutyáknak.`,
  dog_school: (n, c) => `A ${n} kutyakiképzést és viselkedés-tanácsadást kínál ${c}-ben, kezdőtől haladó szintig.`,
  boarding: (n, c) => `A ${n} biztonságos, szeretetteljes ideiglenes szállást biztosít kutyáknak ${c}-ben, amíg gazdáik utaznak.`,
  grooming: (n, c) => `A ${n} teljes körű kutyakozmetikai szolgáltatásokat nyújt ${c}-ben: fürdetés, szőrvágás, körömvágás.`,
  walker: (n, c) => `A ${n} megbízható sétáltató szolgáltatás ${c}-ben, elfoglalt gazdik kutyáinak.`,
  dog_friendly_place: (n, c) => `A ${n} kutyabarát hely ${c}-ben, ahol a négylábú barátok is szívesen látott vendégek.`,
  transport: (n, c) => `A ${n} biztonságos, EU-kompatibilis kutyaszállítást szervez határokon átnyúlóan is, ${c} központtal.`,
  other: (n, c) => `A ${n} kiegészítő szolgáltatásokat nyújt kutyatulajdonosoknak ${c}-ben és környékén.`,
};

function buildPartner(name, type, index, globalIndex) {
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
let gi = 0;
for (const name of shelterNames) partnerRows.push(buildPartner(name, "shelter", gi, gi++));
for (const name of vetNames) partnerRows.push(buildPartner(name, "veterinarian", gi, gi++));
for (const [type, names] of Object.entries(otherPartnerNames)) {
  for (const name of names) partnerRows.push(buildPartner(name, type, gi, gi++));
}

console.log(`Inserting ${partnerRows.length} partners...`);
const { data: insertedPartners, error: partnerErr } = await supabase
  .from("partners")
  .insert(partnerRows)
  .select("id, slug, name, type");
if (partnerErr) throw partnerErr;
console.log(`  -> ${insertedPartners.length} partners inserted.`);

const shelterPartners = insertedPartners.filter((p) => p.type === "shelter");

// ---------------------------------------------------------------------
// Dogs (30), distributed across the 20 shelter partners
// ---------------------------------------------------------------------
const dogNames = [
  "Buksi", "Morzsa", "Rex", "Bodri", "Lili", "Csoki", "Maci", "Foltos", "Szimba", "Picur",
  "Bella", "Max", "Luna", "Charlie", "Milo", "Coco", "Duke", "Nala", "Teddy", "Zeus",
  "Rocky", "Daisy", "Bruno", "Loki", "Sasha", "Toby", "Bailey", "Oscar", "Ginger", "Buddy",
];
const breeds = [
  "Keverék", "Magyar Vizsla", "Labrador Retriever", "Beagle", "Border Collie", "Jack Russell Terrier",
  "Németjuhász", "Cocker Spaniel", "Mudi", "Puli", "Golden Retriever", "Foxterrier", "Dalmata",
  "Husky", "Yorkshire Terrier", "Bichon Frise", "Staffordshire Terrier", "Tacskó", "Chihuahua", "Boxer",
];
const colors = ["fekete", "barna", "fehér", "szürke", "fekete-fehér", "vörös", "aranyszínű", "cirmos barna"];
const sizes = ["small", "medium", "large", "xlarge"];

function buildDog(i, partner) {
  const name = dogNames[i % dogNames.length];
  const breed = breeds[i % breeds.length];
  const isPuppy = i % 6 === 0;
  const placedogId = 1 + (i % 130);
  return {
    partner_id: partner.id,
    name,
    breed,
    mixed_breed: breed === "Keverék",
    age_years: isPuppy ? 0 : 1 + (i % 9),
    age_months: isPuppy ? 2 + (i % 10) : i % 12,
    gender: i % 2 === 0 ? "male" : "female",
    size: sizes[i % sizes.length],
    color: colors[i % colors.length],
    description: `${name} egy ${isPuppy ? "kölyök" : `${1 + (i % 9)} éves`} ${breed.toLowerCase()} kutya, aki a(z) ${partner.name} gondozásában várja, hogy szerető gazdára találjon. Játékos, emberszerető és hamar megszokja új otthonát.`,
    status: "available",
    is_vaccinated: i % 5 !== 0,
    is_neutered: i % 4 !== 0,
    is_chipped: i % 3 !== 0,
    is_dewormed: true,
    is_transportable: i % 2 === 0,
    good_with_kids: i % 3 !== 1,
    good_with_dogs: i % 4 !== 3,
    good_with_cats: i % 5 === 0,
    country: partner.country,
    city: partner.city,
    primary_image_url: `https://placedog.net/600/450?id=${placedogId}`,
  };
}

// shelterPartners rows only carry id/slug/name/type — fetch city/country back
const { data: shelterFull, error: shelterFullErr } = await supabase
  .from("partners")
  .select("id, name, city, country")
  .in("id", shelterPartners.map((p) => p.id));
if (shelterFullErr) throw shelterFullErr;

const dogRows = [];
for (let i = 0; i < 30; i++) {
  const partner = shelterFull[i % shelterFull.length];
  dogRows.push(buildDog(i, partner));
}

console.log(`Inserting ${dogRows.length} dogs...`);
const { data: insertedDogs, error: dogErr } = await supabase
  .from("dogs")
  .insert(dogRows)
  .select("id, name, primary_image_url");
if (dogErr) throw dogErr;
console.log(`  -> ${insertedDogs.length} dogs inserted.`);

// ---------------------------------------------------------------------
// Extra gallery photos per dog (media table), where possible
// ---------------------------------------------------------------------
const mediaRows = [];
insertedDogs.forEach((dog, i) => {
  mediaRows.push({
    entity_type: "dog",
    entity_id: dog.id,
    media_type: "image",
    url: dog.primary_image_url,
    alt_text: dog.name,
    sort_order: 0,
  });
  for (let k = 1; k <= 2; k++) {
    const extraId = 1 + ((i * 3 + k * 11) % 130);
    mediaRows.push({
      entity_type: "dog",
      entity_id: dog.id,
      media_type: "image",
      url: `https://placedog.net/600/450?id=${extraId}`,
      alt_text: dog.name,
      sort_order: k,
    });
  }
});

console.log(`Inserting ${mediaRows.length} media rows...`);
const { error: mediaErr } = await supabase.from("media").insert(mediaRows);
if (mediaErr) throw mediaErr;
console.log("  -> media rows inserted.");

console.log("\nDone. Seed batch tag:", SEED_BATCH);
console.log(`Partners: ${insertedPartners.length} (shelter: ${shelterFull.length}, veterinarian: 10, other: ${insertedPartners.length - shelterFull.length - 10})`);
console.log(`Dogs: ${insertedDogs.length}`);

console.log("\nSample partner slugs:");
for (const p of insertedPartners.slice(0, 5)) console.log(`  /partners/${p.slug}`);
console.log("\nSample dog ids:");
for (const d of insertedDogs.slice(0, 5)) console.log(`  /kutyak/${d.id}`);
