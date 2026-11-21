-- YATRIO V70: expand the Nepal destination catalogue and city selectors.
INSERT INTO marketplace_destinations (slug,name,province,tagline,highlights,sort_order) VALUES
('bhaktapur','Bhaktapur','Bagmati','A living heritage city of courtyards, pagodas and traditional craft','{Durbar Square,Nyatapola Temple,Pottery Square}',9),
('lalitpur','Lalitpur (Patan)','Bagmati','Art, architecture and Newari culture in the Kathmandu Valley','{Patan Durbar Square,Golden Temple,Traditional crafts}',10),
('nagarkot','Nagarkot','Bagmati','Himalayan sunrise viewpoints and quiet hill retreats','{Sunrise views,Hiking,Hill resorts}',11),
('bandipur','Bandipur','Gandaki','A beautifully preserved hilltop bazaar with mountain panoramas','{Old bazaar,Mountain views,Local culture}',12),
('gorkha','Gorkha','Gandaki','Historic hill country and the legacy of the Gorkha kingdom','{Gorkha Durbar,History,Hill landscapes}',13),
('jomsom','Jomsom','Gandaki','A dramatic gateway to the Mustang region and Kali Gandaki valley','{Kali Gandaki,Muktinath gateway,Mountain scenery}',14),
('mustang','Mustang','Gandaki','High-altitude desert landscapes, monasteries and ancient settlements','{Lo Manthang,Desert landscapes,Local heritage}',15),
('manang','Manang','Gandaki','A Himalayan village and trekking gateway beneath the Annapurna range','{Annapurna Circuit,Mountain trails,Highland culture}',16),
('lukla','Lukla','Koshi','The famous gateway town for journeys into the Everest region','{Everest gateway,Mountain flights,Trekking routes}',17),
('everest-region','Everest Region','Koshi','Iconic Himalayan trails, Sherpa communities and mountain panoramas','{Everest Base Camp,Sherpa culture,Sagarmatha National Park}',18),
('rara-lake','Rara Lake','Karnali','A remote alpine lake surrounded by forests and mountain wilderness','{Rara National Park,Alpine lake,Nature trails}',19),
('bardiya','Bardiya','Lumbini','A western Terai wilderness destination known for conservation and wildlife','{Bardiya National Park,Wildlife,Tharu culture}',20),
('koshi-tappu','Koshi Tappu','Koshi','Wetlands and birdlife in one of Nepal’s celebrated nature reserves','{Birdwatching,Wetlands,Wildlife conservation}',21),
('hetauda','Hetauda','Bagmati','A relaxed gateway city connecting the central hills and Terai','{Makwanpur,Local markets,Central Nepal}',22),
('tansen','Tansen','Lumbini','A historic hill town with old bazaars and sweeping valley views','{Rani Mahal,Old bazaar,Palpa culture}',23),
('nepalgunj','Nepalgunj','Lumbini','A western Nepal hub and gateway to remote Himalayan journeys','{Bageshwori Temple,Local markets,Western gateway}',24),
('dhangadhi','Dhangadhi','Sudurpashchim','A lively far-western city and base for exploring the region','{Far-west culture,Local food,Shuklaphanta gateway}',25),
('bhedetar','Bhedetar','Koshi','A cool hill station with panoramic views above the eastern plains','{Viewpoints,Mountain air,Local food}',26),
('butwal','Butwal','Lumbini','A western Nepal gateway city connecting the Terai and nearby hill destinations','{Local markets,Western gateway,Regional connections}',27),
('janakpur','Janakpur','Madhesh','A rich centre of Mithila art and heritage','{Janaki Mandir,Mithila culture,Pilgrimage}',7),
('biratnagar','Biratnagar','Koshi','An eastern hub for business and onward travel','{Eastern gateway,Local markets,Regional connections}',8)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name,province=EXCLUDED.province,tagline=EXCLUDED.tagline,highlights=EXCLUDED.highlights,status='published',sort_order=EXCLUDED.sort_order;

INSERT INTO cities (name,province,country)
SELECT x.name,x.province,'Nepal'
FROM (VALUES
('Bhaktapur','Bagmati'),('Lalitpur','Bagmati'),('Nagarkot','Bagmati'),('Bandipur','Gandaki'),('Gorkha','Gandaki'),
('Jomsom','Gandaki'),('Manang','Gandaki'),('Lukla','Koshi'),('Hetauda','Bagmati'),('Tansen','Lumbini'),
('Nepalgunj','Lumbini'),('Dhangadhi','Sudurpashchim'),('Bhedetar','Koshi'),('Janakpur','Madhesh')
) AS x(name,province)
WHERE NOT EXISTS (SELECT 1 FROM cities c WHERE lower(c.name)=lower(x.name));