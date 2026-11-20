CREATE TABLE IF NOT EXISTS marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'compass',
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketplace_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  highlights TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketplace_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  category_slug TEXT NOT NULL REFERENCES marketplace_categories(slug),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  base_city TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_slug)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_providers_status ON marketplace_providers(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_providers_category ON marketplace_providers(category_slug, status);
INSERT INTO marketplace_categories (slug,name,tagline,description,icon,sort_order) VALUES
('buses','Intercity buses','Comfortable journeys between cities','Compare intercity and tourist bus services across Nepal.','bus',1),
('stays','Hotels & stays','A place to feel at home','Discover hotels, resorts, homestays and guesthouses.','hotel',2),
('rides','Local rides & transfers','Get there with less hassle','Find taxis, jeeps, private vehicles and airport transfers.','car',3),
('experiences','Tours & experiences','Make the journey memorable','Explore local guides, sightseeing, trekking and activities.','mountain',4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_destinations (slug,name,province,tagline,highlights,sort_order) VALUES
('kathmandu','Kathmandu','Bagmati','Culture, heritage and the gateway to the Himalayas',ARRAY['Heritage sites','Food and culture','Gateway journeys'],1),
('pokhara','Pokhara','Gandaki','Lakeside calm with mountain views and adventure',ARRAY['Phewa Lake','Annapurna views','Adventure activities'],2),
('chitwan','Chitwan','Bagmati','Jungle experiences and wildlife encounters',ARRAY['National park','Wildlife experiences','Tharu culture'],3),
('lumbini','Lumbini','Lumbini','A peaceful journey to the birthplace of Buddha',ARRAY['Sacred Garden','Monasteries','Pilgrimage'],4),
('dharan','Dharan','Koshi','A lively eastern Nepal city and hill-country gateway',ARRAY['Local food','Bhedetar gateway','Eastern Nepal'],5),
('ilam','Ilam','Koshi','Tea gardens, green hills and quiet escapes',ARRAY['Tea gardens','Hill views','Nature walks'],6),
('janakpur','Janakpur','Madhesh','A rich centre of Mithila art and heritage',ARRAY['Janaki Mandir','Mithila culture','Pilgrimage'],7),
('biratnagar','Biratnagar','Koshi','An eastern hub for business and onward travel',ARRAY['Eastern gateway','Local markets','Regional connections'],8)
ON CONFLICT (slug) DO NOTHING;