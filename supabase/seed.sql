-- Seed: 3 demo partners + 12 dogs

insert into partners (id, name, slug, type, status, verified, description, country, city, email, website, metadata) values
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Happy Paws Rescue',
  'happy-paws-rescue',
  'shelter',
  'approved',
  true,
  'Berlini menhely, ahol több mint 120 kutyának adunk átmeneti otthont és segítünk új gazdát találni.',
  'DE',
  'Berlin',
  'info@happypaws.de',
  'https://happypaws.de',
  '{"capacity": 120, "founded_year": 2010, "languages": ["de","en"]}'::jsonb
),
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Magyar Állatvédők',
  'magyar-allatvedo',
  'shelter',
  'approved',
  true,
  'Budapest szívében működő menhely, ahol 89 kutya keres új otthont.',
  'HU',
  'Budapest',
  'info@magyarallatvedo.hu',
  'https://magyarallatvedo.hu',
  '{"capacity": 89, "founded_year": 2005, "languages": ["hu","en"]}'::jsonb
),
(
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Paws of Spain',
  'paws-of-spain',
  'shelter',
  'approved',
  true,
  'Madridi menhely 156 örökbefogadásra váró kutyával.',
  'ES',
  'Madrid',
  'hola@pawsofspain.es',
  'https://pawsofspain.es',
  '{"capacity": 156, "founded_year": 2008, "languages": ["es","en"]}'::jsonb
);

insert into dogs (id, partner_id, name, breed, mixed_breed, age_years, age_months, gender, size, description, status, is_vaccinated, is_neutered, is_chipped, is_dewormed, is_transportable, good_with_kids, good_with_dogs, country, city, primary_image_url) values
(
  'd1000001-0000-0000-0000-000000000001',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Luna', 'Keverék', true, 2, 0, 'female', 'medium',
  'Luna egy nagyon barátságos és játékos kutya, aki imádja az embereket és más kutyákat is. Aktív családnak keresünk gazdát, ahol sok szeretetet kap.',
  'available', true, true, true, true, true, true, true,
  'DE', 'Berlin',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop&auto=format&q=85'
),
(
  'd1000001-0000-0000-0000-000000000002',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Max', 'Labrador keverék', true, 4, 0, 'male', 'large',
  'Max egy kedves, nyugodt Labrador keverék. Gyerekekkel és más kutyákkal is jól kijön. Tapasztalt gazdának ajánljuk.',
  'available', true, true, true, true, true, true, true,
  'HU', 'Budapest',
  'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&h=600&fit=crop&auto=format&q=85'
),
(
  'd1000001-0000-0000-0000-000000000003',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Bella', 'Border Collie', false, 1, 6, 'female', 'medium',
  'Bella egy energikus Border Collie, aki imád tanulni és játszani. Aktív gazdának ideális, aki sportol vagy fut.',
  'available', true, false, true, true, true, false, true,
  'ES', 'Madrid',
  'https://images.unsplash.com/photo-1503256207526-0d5523f31059?w=800&h=600&fit=crop&auto=format&q=85'
),
(
  'd1000001-0000-0000-0000-000000000004',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Rocky', 'Staffi keverék', true, 3, 0, 'male', 'medium',
  'Rocky egy erős, de nagyon szerető Staffi keverék. Egyedüli kutyás háztartásba ajánljuk, sok szeretettel.',
  'available', true, true, true, true, false, true, false,
  'DE', 'Berlin',
  'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=800&h=600&fit=crop&auto=format&q=85'
),
(
  'd1000001-0000-0000-0000-000000000005',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Molly', 'Beagle', false, 5, 0, 'female', 'small',
  'Molly egy édes Beagle, aki imád szaglászni és felfedezni. Kerttel rendelkező házba ajánljuk.',
  'available', true, true, true, true, true, true, true,
  'HU', 'Budapest',
  'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=600&fit=crop&auto=format&q=85'
),
(
  'd1000001-0000-0000-0000-000000000006',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Charlie', 'Golden Retriever', false, 2, 0, 'male', 'large',
  'Charlie egy gyönyörű Golden Retriever, aki mindenkit szeret. Ideális első kutyának is.',
  'available', true, true, true, true, true, true, true,
  'ES', 'Madrid',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop&auto=format&q=85'
),
(
  'd1000001-0000-0000-0000-000000000007',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Daisy', 'Keverék', true, 1, 0, 'female', 'small',
  'Daisy egy apró kis keverék, tele energiával és szerelemmel. Kisebb lakásba is ideális.',
  'available', true, true, true, true, true, true, true,
  'DE', 'Berlin',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop&auto=format&q=85'
),
(
  'd1000001-0000-0000-0000-000000000008',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Jack', 'Német juhász', false, 6, 0, 'male', 'large',
  'Jack egy tapasztalt, higgadt Német juhász. Tréning után nagyon engedelmes, tapasztalt gazdának ajánljuk.',
  'available', true, true, true, true, false, false, false,
  'HU', 'Budapest',
  'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800&h=600&fit=crop&auto=format&q=85'
),
(
  'd1000001-0000-0000-0000-000000000009',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Nina', 'Husky keverék', true, 3, 0, 'female', 'medium',
  'Nina egy gyönyörű Husky keverék, aki imád futni. Aktív gazdának ideális, rendszeres mozgással.',
  'available', true, false, true, true, true, false, true,
  'ES', 'Madrid',
  'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=800&h=600&fit=crop&auto=format&q=85'
),
(
  'd1000001-0000-0000-0000-000000000010',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Bruno', 'Rottweiler keverék', true, 7, 0, 'male', 'large',
  'Bruno egy idős, de nagyon szerető Rottweiler keverék. Csendes, tapasztalt gazdának ajánljuk.',
  'available', true, true, true, true, false, true, false,
  'DE', 'Berlin',
  'https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=800&h=600&fit=crop&auto=format&q=85'
),
(
  'd1000001-0000-0000-0000-000000000011',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Coco', 'Uszkár keverék', true, 2, 0, 'female', 'small',
  'Coco egy aranyos kis uszkár keverék, aki allergiásoknak is ideális lehet. Nagyon okos és tanulékony.',
  'available', true, true, true, true, true, true, true,
  'HU', 'Budapest',
  'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=800&h=600&fit=crop&auto=format&q=85'
),
(
  'd1000001-0000-0000-0000-000000000012',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Rex', 'Malinois keverék', true, 4, 0, 'male', 'large',
  'Rex egy intelligens, munkabíró Malinois keverék. Tapasztalt, aktív gazdának ajánljuk.',
  'available', true, true, true, true, true, false, false,
  'ES', 'Madrid',
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&h=600&fit=crop&auto=format&q=85'
);
