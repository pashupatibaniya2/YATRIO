-- YATRIO V146: nationwide destination expansion across all seven provinces.
-- These are destination ideas, not evidence of live transport or bookable services.
INSERT INTO marketplace_destinations (slug,name,province,tagline,highlights,sort_order) VALUES
('dhulikhel','Dhulikhel','Bagmati','A hill town with Himalayan viewpoints and heritage lanes','{Himalayan panoramas,Old town,Day hikes}',28),
('panauti','Panauti','Bagmati','A historic Newari settlement known for temples and traditional streets','{Indreshwar Temple,Newari heritage,Historic lanes}',29),
('kirtipur','Kirtipur','Bagmati','A historic hilltop town with Newari culture and valley views','{Bagh Bhairab,Newari food,Valley views}',30),
('pharping','Pharping','Bagmati','A spiritual hill destination with monasteries and sacred caves','{Asura Cave,Monasteries,Quiet trails}',31),
('ghandruk','Ghandruk','Gandaki','A Gurung village with close-up Annapurna-region mountain scenery','{Gurung culture,Annapurna views,Heritage village}',32),
('ghorepani','Ghorepani','Gandaki','A classic trekking stop on the route to Poon Hill','{Poon Hill,Trekking,Mountain sunrise}',33),
('besisahar','Besisahar','Gandaki','A gateway town for the Annapurna Circuit and Marshyangdi valley','{Annapurna Circuit,Marshyangdi Valley,Local markets}',34),
('damauli','Damauli','Gandaki','A central hill-town stop beside the Seti and Madi river valleys','{River valleys,Local culture,Regional gateway}',35),
('kanyam','Kanyam','Koshi','Tea gardens and rolling green hills in eastern Nepal','{Tea gardens,Scenic drives,Viewpoints}',36),
('birtamod','Birtamod','Koshi','An eastern Terai hub for journeys towards tea country and hill districts','{Eastern gateway,Local markets,Tea-country access}',37),
('itahari','Itahari','Koshi','A major eastern transport junction connecting the Terai and hills','{Transport hub,Local food,Eastern Nepal}',38),
('phidim','Phidim','Koshi','A hill-town base for exploring Panchthar and eastern highlands','{Panchthar hills,Local culture,Highland views}',39),
('taplejung','Taplejung','Koshi','A remote eastern Himalayan gateway for the Kanchenjunga region','{Kanchenjunga region,Mountain trails,Local heritage}',40),
('pathibhara','Pathibhara','Koshi','A revered highland pilgrimage destination in Taplejung district','{Pathibhara Temple,Pilgrimage,Highland landscapes}',41),
('bardibas','Bardibas','Madhesh','A road junction linking the eastern Terai with hill destinations','{Regional gateway,Local markets,Terai landscapes}',42),
('jaleshwar','Jaleshwar','Madhesh','A borderland town with local religious and Mithila cultural heritage','{Mithila culture,Local temples,Regional markets}',43),
('malangwa','Malangwa','Madhesh','A district-centre town and gateway to the central-eastern Terai','{Local markets,Terai culture,Regional gateway}',44),
('gaur','Gaur','Madhesh','A southern Terai town with regional culture and cross-border trade links','{Terai culture,Local markets,Regional history}',45),
('tilaurakot','Tilaurakot','Lumbini','An important archaeological site associated with ancient Kapilavastu','{Archaeology,Ancient Kapilavastu,Heritage walks}',46),
('ramgram','Ramgram','Lumbini','A Buddhist heritage destination associated with an ancient stupa site','{Ramagrama Stupa,Buddhist heritage,Quiet countryside}',47),
('devdaha','Devdaha','Lumbini','A heritage area linked with the life story and traditions of the Buddha','{Buddhist heritage,Community culture,Historic sites}',48),
('kapilvastu','Kapilvastu','Lumbini','A historic district with archaeological and Buddhist heritage landscapes','{Ancient sites,Archaeology,Local heritage}',49),
('swargadwari','Swargadwari','Lumbini','A hilltop pilgrimage destination in the western hills','{Swargadwari Temple,Pilgrimage,Hill scenery}',50),
('jumla','Jumla','Karnali','A remote Himalayan district known for highland culture and apple-growing valleys','{Karnali culture,Apple orchards,Highland trails}',51),
('sinja-valley','Sinja Valley','Karnali','A historic valley associated with the medieval Khasa civilisation','{Khasa heritage,Archaeology,Mountain valley}',52),
('shey-phoksundo','Shey Phoksundo','Karnali','A spectacular high-altitude lake and protected landscape in Dolpo','{Phoksundo Lake,Shey Phoksundo National Park,Remote trekking}',53),
('dolpo','Dolpo','Karnali','A remote trans-Himalayan region of high passes, monasteries and traditional settlements','{Upper Dolpo,High-altitude trails,Monasteries}',54),
('simikot','Simikot','Karnali','A remote mountain gateway for journeys into Humla and Limi Valley','{Humla gateway,Limi Valley,Mountain culture}',55),
('khaptad','Khaptad National Park','Sudurpashchim','A highland plateau of meadows, forests and quiet trekking routes','{Khaptad plateau,Meadows,Forest trails}',56),
('dadeldhura','Dadeldhura','Sudurpashchim','A far-western hill town with historic sites and panoramic ridgelines','{Amargadhi Fort,Hill views,Far-west culture}',57),
('tikapur','Tikapur','Sudurpashchim','A western Terai town and gateway to riverine and wetland landscapes','{Karnali river,Community culture,Terai gateway}',58),
('shuklaphanta','Shuklaphanta','Sudurpashchim','A protected grassland landscape known for wildlife and open-country scenery','{Shuklaphanta National Park,Grasslands,Wildlife}',59),
('api-nampa','Api Nampa','Sudurpashchim','A remote protected Himalayan landscape in the far-western mountains','{Api Himal,Protected landscape,Remote trekking}',60),
('doti','Doti','Sudurpashchim','A historic far-western hill district with traditional settlements and river valleys','{Khadyauli heritage,Seti river,Far-west culture}',61)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name,province=EXCLUDED.province,tagline=EXCLUDED.tagline,highlights=EXCLUDED.highlights,status='published',sort_order=EXCLUDED.sort_order;

INSERT INTO cities (name,province,country)
SELECT x.name,x.province,'Nepal'
FROM (VALUES
('Dhulikhel','Bagmati'),('Panauti','Bagmati'),('Kirtipur','Bagmati'),('Pharping','Bagmati'),
('Ghandruk','Gandaki'),('Ghorepani','Gandaki'),('Besisahar','Gandaki'),('Damauli','Gandaki'),
('Kanyam','Koshi'),('Birtamod','Koshi'),('Itahari','Koshi'),('Phidim','Koshi'),('Taplejung','Koshi'),('Pathibhara','Koshi'),
('Bardibas','Madhesh'),('Jaleshwar','Madhesh'),('Malangwa','Madhesh'),('Gaur','Madhesh'),
('Tilaurakot','Lumbini'),('Ramgram','Lumbini'),('Devdaha','Lumbini'),('Kapilvastu','Lumbini'),('Swargadwari','Lumbini'),
('Jumla','Karnali'),('Sinja Valley','Karnali'),('Shey Phoksundo','Karnali'),('Dolpo','Karnali'),('Simikot','Karnali'),
('Khaptad','Sudurpashchim'),('Dadeldhura','Sudurpashchim'),('Tikapur','Sudurpashchim'),('Shuklaphanta','Sudurpashchim'),('Api Nampa','Sudurpashchim'),('Doti','Sudurpashchim')
) AS x(name,province)
WHERE NOT EXISTS (SELECT 1 FROM cities c WHERE lower(c.name)=lower(x.name));