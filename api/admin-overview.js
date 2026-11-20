import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET"];
export default async function(req,res) {
  const [core,operatorStatus,providerStatus,listingStatus,settlements,recent,schedules] = await Promise.all([
    db.query(`SELECT
      (SELECT count(*)::int FROM operators) AS operators_total,
      (SELECT count(*)::int FROM operators WHERE status='pending') AS operators_pending,
      (SELECT count(*)::int FROM operators WHERE status='approved') AS operators_approved,
      (SELECT count(*)::int FROM buses) AS buses_total,
      (SELECT count(*)::int FROM schedules) AS schedules_total,
      (SELECT count(*)::int FROM schedules WHERE status='scheduled' AND departure_at>now()) AS schedules_upcoming,
      (SELECT count(*)::int FROM bookings) AS bus_bookings_total,
      (SELECT COALESCE(sum(total_amount),0)::numeric(14,2) FROM bookings) AS bus_booking_value,
      (SELECT count(*)::int FROM marketplace_providers) AS providers_total,
      (SELECT count(*)::int FROM marketplace_listings) AS listings_total,
      (SELECT count(*)::int FROM marketplace_listings WHERE status='published') AS listings_published,
      (SELECT count(*)::int FROM marketplace_bookings) AS marketplace_bookings_total,
      (SELECT COALESCE(sum(total_amount),0)::numeric(14,2) FROM marketplace_bookings) AS marketplace_booking_value,
      (SELECT COALESCE(sum(commission_amount),0)::numeric(14,2) FROM yatrio_commission_ledger) AS expected_commission,
      (SELECT count(*)::int FROM yatrio_commission_ledger WHERE settlement_status='pending_settlement') AS pending_settlements`),
    db.query("SELECT status,count(*)::int AS count FROM operators GROUP BY status"),
    db.query("SELECT status,count(*)::int AS count FROM marketplace_providers GROUP BY status"),
    db.query("SELECT status,count(*)::int AS count FROM marketplace_listings GROUP BY status"),
    db.query("SELECT settlement_status,count(*)::int AS count,COALESCE(sum(provider_payout_amount),0)::numeric(14,2) AS payout_value FROM yatrio_commission_ledger GROUP BY settlement_status"),
    db.query(`SELECT * FROM (
      SELECT bk.created_at,bk.pnr AS booking_ref,bk.passenger_name AS customer_name,bk.status,bk.total_amount,bk.currency,'bus'::text AS booking_type,o.name AS provider_name,'Intercity bus'::text AS category
      FROM bookings bk LEFT JOIN operators o ON o.id=bk.operator_id
      UNION ALL
      SELECT mb.created_at,mb.booking_ref,mb.traveler_name,mb.status,mb.total_amount,mb.currency,'marketplace'::text,p.business_name,mb.category_slug
      FROM marketplace_bookings mb LEFT JOIN marketplace_providers p ON p.id=mb.provider_id
    ) x ORDER BY created_at DESC LIMIT 12`),
    db.query(`SELECT s.id,s.departure_at,s.arrival_at,s.fare,s.status,b.name AS bus_name,o.name AS operator_name,ca.name AS origin,cz.name AS destination
      FROM schedules s JOIN buses b ON b.id=s.bus_id JOIN operators o ON o.id=b.operator_id
      JOIN routes r ON r.id=s.route_id JOIN terminals ta ON ta.id=r.origin_terminal_id JOIN terminals tz ON tz.id=r.destination_terminal_id
      JOIN cities ca ON ca.id=ta.city_id JOIN cities cz ON cz.id=tz.city_id
      WHERE s.departure_at>now() ORDER BY s.departure_at ASC LIMIT 8`)
  ]);
  return res.json({
    generated_at:new Date().toISOString(),
    metrics:core.rows[0],
    operator_status:operatorStatus.rows,
    provider_status:providerStatus.rows,
    listing_status:listingStatus.rows,
    settlements:settlements.rows,
    recent_bookings:recent.rows,
    upcoming_departures:schedules.rows,
    financial_note:"Booking value and expected commission are operational snapshots, not recognized revenue. Demo bookings and unpaid requests are not collected money. No payment gateway or provider payout is active."
  });
}