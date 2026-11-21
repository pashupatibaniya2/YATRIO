import { db } from "hatchable";
export const access="user";
export const methods=["GET"];
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in to view travel documents."});
 const [bus,market]=await Promise.all([
  db.query("SELECT bk.id,bk.pnr AS booking_ref,'bus' AS booking_type,bk.passenger_name AS traveler_name,bk.passenger_email AS traveler_email,bk.passenger_phone AS traveler_phone,bk.seat_numbers,bk.total_amount,bk.currency,bk.status,bk.payment_mode,COALESCE((SELECT p.status FROM payment_transactions p WHERE p.booking_type='bus' AND p.booking_id=bk.id ORDER BY p.created_at DESC LIMIT 1),'not_started') AS payment_status,bk.created_at,o.name AS provider_name,ca.name AS origin_city,cz.name AS destination_city,s.departure_at,s.arrival_at,b.name AS service_name,ta.name AS origin_terminal,tz.name AS destination_terminal FROM bookings bk JOIN schedules s ON s.id=bk.schedule_id JOIN buses b ON b.id=s.bus_id JOIN operators o ON o.id=b.operator_id JOIN routes r ON r.id=s.route_id JOIN terminals ta ON ta.id=r.origin_terminal_id JOIN terminals tz ON tz.id=r.destination_terminal_id JOIN cities ca ON ca.id=ta.city_id JOIN cities cz ON cz.id=tz.city_id WHERE bk.customer_user_id=$1 ORDER BY bk.created_at DESC LIMIT 100",[uid]),
  db.query("SELECT b.id,b.booking_ref,'marketplace' AS booking_type,b.traveler_name,b.traveler_email,b.traveler_phone,b.quantity,b.currency,b.total_amount,b.status,b.payment_status,b.created_at,p.business_name AS provider_name,l.title AS service_name,l.city AS origin_city,a.starts_at AS departure_at,a.ends_at AS arrival_at FROM marketplace_bookings b JOIN marketplace_listings l ON l.id=b.listing_id JOIN marketplace_providers p ON p.id=b.provider_id JOIN marketplace_availability a ON a.id=b.availability_id WHERE b.user_id=$1 ORDER BY b.created_at DESC LIMIT 100",[uid])
 ]);
 const bookings=[...bus.rows,...market.rows].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 return res.json({documents:bookings.map(x=>{const isPaid=x.payment_status==="paid"||x.payment_status==="succeeded";const isTicket=x.booking_type==="bus"&&x.status==="confirmed"&&isPaid;return {...x,document_type:isTicket?"confirmed_bus_ticket":isPaid?"paid_booking_receipt":"booking_summary",is_paid:isPaid,is_ticket:isTicket};})});
}