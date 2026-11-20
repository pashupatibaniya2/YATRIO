import { db } from "hatchable";
export const access = "public";
export const methods = ["GET"];
export default async function(req,res) {
  const from = String(req.query.from || "").trim();
  const to = String(req.query.to || "").trim();
  const date = String(req.query.date || "").trim();
  const { rows } = await db.query(
    "SELECT s.id AS schedule_id, o.name AS operator_name, o.slug AS operator_slug, b.name AS bus_name, b.bus_type, r.distance_km, r.duration_label, a.name AS origin_terminal, z.name AS destination_terminal, ca.name AS origin_city, cz.name AS destination_city, s.departure_at, s.arrival_at, s.fare, (SELECT count(*) FROM seat_inventory si WHERE si.schedule_id=s.id AND (si.status='available' OR (si.status='held' AND si.hold_expires_at < now()))) AS available_seats FROM schedules s JOIN buses b ON b.id=s.bus_id JOIN operators o ON o.id=b.operator_id JOIN routes r ON r.id=s.route_id JOIN terminals a ON a.id=r.origin_terminal_id JOIN terminals z ON z.id=r.destination_terminal_id JOIN cities ca ON ca.id=a.city_id JOIN cities cz ON cz.id=z.city_id WHERE o.status='approved' AND s.status='scheduled' AND s.departure_at > now() AND ($1='' OR lower(ca.name)=lower($1)) AND ($2='' OR lower(cz.name)=lower($2)) AND ($3='' OR to_char(s.departure_at AT TIME ZONE 'Asia/Kathmandu','YYYY-MM-DD')=$3) ORDER BY s.departure_at ASC",
    [from,to,date]
  );
  res.json({ results: rows, demo_data: true, message: "Sample operator and schedule data for MVP testing." });
}