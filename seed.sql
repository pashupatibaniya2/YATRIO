INSERT INTO operators (name, slug, description, phone, status)
SELECT 'Himalayan Express', 'himalayan-express', 'Sample operator for product demonstration', '+977-9800000001', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE slug='himalayan-express');
INSERT INTO operators (name, slug, description, phone, status)
SELECT 'Mountain Line Travels', 'mountain-line', 'Sample operator for product demonstration', '+977-9800000002', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE slug='mountain-line');
INSERT INTO cities (name, province) SELECT 'Kathmandu','Bagmati' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name='Kathmandu');
INSERT INTO cities (name, province) SELECT 'Pokhara','Gandaki' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name='Pokhara');
INSERT INTO cities (name, province) SELECT 'Sauraha','Bagmati' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name='Sauraha');
INSERT INTO cities (name, province) SELECT 'Butwal','Lumbini' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name='Butwal');
INSERT INTO cities (name, province) SELECT 'Biratnagar','Koshi' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name='Biratnagar');
INSERT INTO cities (name, province) SELECT 'Dharan','Koshi' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name='Dharan');
INSERT INTO terminals (city_id,name,address) SELECT c.id,'Gongabu Bus Park','Kathmandu' FROM cities c WHERE c.name='Kathmandu' AND NOT EXISTS (SELECT 1 FROM terminals t WHERE t.name='Gongabu Bus Park');
INSERT INTO terminals (city_id,name,address) SELECT c.id,'Tourist Bus Park','Pokhara' FROM cities c WHERE c.name='Pokhara' AND NOT EXISTS (SELECT 1 FROM terminals t WHERE t.name='Tourist Bus Park');
INSERT INTO terminals (city_id,name,address) SELECT c.id,'Sauraha Bus Stop','Sauraha' FROM cities c WHERE c.name='Sauraha' AND NOT EXISTS (SELECT 1 FROM terminals t WHERE t.name='Sauraha Bus Stop');
INSERT INTO terminals (city_id,name,address) SELECT c.id,'Butwal Bus Park','Butwal' FROM cities c WHERE c.name='Butwal' AND NOT EXISTS (SELECT 1 FROM terminals t WHERE t.name='Butwal Bus Park');
INSERT INTO terminals (city_id,name,address) SELECT c.id,'Biratnagar Bus Park','Biratnagar' FROM cities c WHERE c.name='Biratnagar' AND NOT EXISTS (SELECT 1 FROM terminals t WHERE t.name='Biratnagar Bus Park');
INSERT INTO terminals (city_id,name,address) SELECT c.id,'Dharan Bus Park','Dharan' FROM cities c WHERE c.name='Dharan' AND NOT EXISTS (SELECT 1 FROM terminals t WHERE t.name='Dharan Bus Park');
INSERT INTO routes (origin_terminal_id,destination_terminal_id,distance_km,duration_label)
SELECT a.id,b.id,x.km,x.duration FROM terminals a, terminals b, (SELECT 'Gongabu Bus Park' a,'Tourist Bus Park' b,200 km,'7–8 hours' duration UNION ALL SELECT 'Gongabu Bus Park','Sauraha Bus Stop',165,'5–6 hours' UNION ALL SELECT 'Gongabu Bus Park','Butwal Bus Park',265,'7–9 hours' UNION ALL SELECT 'Gongabu Bus Park','Biratnagar Bus Park',375,'10–12 hours' UNION ALL SELECT 'Gongabu Bus Park','Dharan Bus Park',390,'10–12 hours') x
WHERE a.name=x.a AND b.name=x.b AND NOT EXISTS (SELECT 1 FROM routes r WHERE r.origin_terminal_id=a.id AND r.destination_terminal_id=b.id);
INSERT INTO buses (operator_id,name,registration_no,bus_type,capacity)
SELECT o.id,'Himalayan Deluxe Coach','DEMO-001','Deluxe AC',32 FROM operators o WHERE o.slug='himalayan-express' AND NOT EXISTS (SELECT 1 FROM buses WHERE registration_no='DEMO-001');
INSERT INTO buses (operator_id,name,registration_no,bus_type,capacity)
SELECT o.id,'Mountain Tourist Coach','DEMO-002','Tourist Sofa',32 FROM operators o WHERE o.slug='mountain-line' AND NOT EXISTS (SELECT 1 FROM buses WHERE registration_no='DEMO-002');
INSERT INTO bus_seats (bus_id,seat_number,seat_type)
SELECT b.id,'A'||n,'standard' FROM buses b CROSS JOIN generate_series(1,16) n WHERE b.registration_no='DEMO-001' AND NOT EXISTS (SELECT 1 FROM bus_seats s WHERE s.bus_id=b.id);
INSERT INTO bus_seats (bus_id,seat_number,seat_type)
SELECT b.id,'B'||n,'standard' FROM buses b CROSS JOIN generate_series(1,16) n WHERE b.registration_no='DEMO-002' AND NOT EXISTS (SELECT 1 FROM bus_seats s WHERE s.bus_id=b.id);
INSERT INTO schedules (bus_id,route_id,departure_at,arrival_at,fare)
SELECT b.id,r.id, d.departure, d.arrival, d.fare
FROM buses b JOIN operators o ON o.id=b.operator_id JOIN routes r ON true
JOIN terminals a ON a.id=r.origin_terminal_id JOIN terminals z ON z.id=r.destination_terminal_id
JOIN (SELECT 'Tourist Bus Park' dest, '2026-11-21 07:00+05:45'::timestamptz departure,'2026-11-21 15:00+05:45'::timestamptz arrival,1200 fare UNION ALL
SELECT 'Sauraha Bus Stop','2026-11-21 06:30+05:45','2026-11-21 12:00+05:45',900 UNION ALL
SELECT 'Butwal Bus Park','2026-11-21 19:00+05:45','2026-11-22 03:00+05:45',1400 UNION ALL
SELECT 'Biratnagar Bus Park','2026-11-21 16:00+05:45','2026-11-22 04:00+05:45',1800 UNION ALL
SELECT 'Dharan Bus Park','2026-11-21 17:00+05:45','2026-11-22 05:00+05:45',1800) d ON z.name=d.dest
WHERE a.name='Gongabu Bus Park' AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.bus_id=b.id AND s.route_id=r.id AND s.departure_at=d.departure)
AND ((d.dest IN ('Tourist Bus Park','Sauraha Bus Stop','Butwal Bus Park') AND b.registration_no='DEMO-001') OR (d.dest IN ('Biratnagar Bus Park','Dharan Bus Park') AND b.registration_no='DEMO-002'));
INSERT INTO seat_inventory (schedule_id,seat_id)
SELECT s.id,bs.id FROM schedules s JOIN buses b ON b.id=s.bus_id JOIN bus_seats bs ON bs.bus_id=b.id
WHERE NOT EXISTS (SELECT 1 FROM seat_inventory si WHERE si.schedule_id=s.id AND si.seat_id=bs.id);