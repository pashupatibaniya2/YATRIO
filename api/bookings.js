import { db } from "hatchable";
export const access = "user";
export const methods = ["POST"];
export default async function(req,res) {
  const scheduleId = String(req.body.schedule_id || "");
  const name = String(req.body.passenger_name || "").trim();
  const phone = String(req.body.passenger_phone || "").trim();
  const email = String(req.body.passenger_email || "").trim();
  const seatIds = Array.isArray(req.body.seat_ids) ? [...new Set(req.body.seat_ids.map(String))] : [];
  if (!/^[0-9a-f-]{36}$/i.test(scheduleId) || !name || !phone || seatIds.length < 1 || seatIds.length > 6 || seatIds.some(x => !/^[0-9a-f-]{36}$/i.test(x))) {
    return res.status(400).json({error:"Enter passenger name, phone and select 1–6 valid seats."});
  }
  const { rows: scheduleRows } = await db.query(
    "SELECT s.fare,s.bus_id,b.operator_id,o.commission_rate FROM schedules s JOIN buses b ON b.id=s.bus_id JOIN operators o ON o.id=b.operator_id WHERE s.id=$1 AND s.status='scheduled' AND s.departure_at > now() AND o.status='approved' AND b.status='active'",
    [scheduleId]
  );
  if (!scheduleRows.length) return res.status(404).json({error:"This departure is no longer available."});
  const token = crypto.randomUUID();
  const held = await db.query(
    "UPDATE seat_inventory SET status='held', hold_token=$1, hold_expires_at=now()+interval '8 minutes' WHERE schedule_id=$2 AND id=ANY($3::uuid[]) AND (status='available' OR (status='held' AND hold_expires_at < now())) RETURNING id, seat_id",
    [token,scheduleId,seatIds]
  );
  if (held.rows.length !== seatIds.length) {
    await db.query("UPDATE seat_inventory SET status='available', hold_token=NULL, hold_expires_at=NULL WHERE hold_token=$1",[token]);
    return res.status(409).json({error:"One or more selected seats have just been taken. Please refresh the seat map."});
  }
  const { rows: seatRows } = await db.query("SELECT seat_number FROM bus_seats WHERE id=ANY($1::uuid[]) ORDER BY seat_number",[held.rows.map(x=>x.seat_id)]);
  const fare = Number(scheduleRows[0].fare);
  const gross = fare * seatIds.length;
  const rate = Number(scheduleRows[0].commission_rate);
  const commission = Math.round((gross * rate / 100) * 100) / 100;
  const payout = Math.round((gross - commission) * 100) / 100;
  const pnr = "YT" + crypto.randomUUID().replace(/-/g,"").slice(0,8).toUpperCase();
  try {
    const created = await db.query(
      "INSERT INTO bookings (pnr,schedule_id,passenger_name,passenger_email,passenger_phone,seat_numbers,total_amount,status,payment_mode,customer_user_id,operator_id,commission_rate,commission_amount,provider_payout_amount,currency,hold_expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'awaiting_payment','demo',$8,$9,$10,$11,$12,'NPR',now()+interval '8 minutes') RETURNING id,pnr,total_amount,status,created_at,commission_amount,provider_payout_amount,hold_expires_at",
      [pnr,scheduleId,name,email,phone,seatRows.map(x=>x.seat_number),gross,req.user?.id ? String(req.user.id) : null,scheduleRows[0].operator_id,rate,commission,payout]
    );
    const linked=await db.query("UPDATE seat_inventory SET booking_id=$1 WHERE hold_token=$2 AND status='held' AND hold_expires_at > now() RETURNING id",[created.rows[0].id,token]);
    if(linked.rows.length!==seatIds.length) throw new Error("The seat hold expired before the reservation could be completed. Please select seats again.");
    res.status(201).json({booking:created.rows[0], seats:seatRows.map(x=>x.seat_number), hold_expires_in_minutes:8, demo_payment:true, message:"Demo reservation created. No money has been collected and this is not a confirmed travel ticket."});
  } catch (e) {
    await db.query("UPDATE bookings SET status='expired' WHERE pnr=$1 AND status='awaiting_payment'",[pnr]);
    await db.query("UPDATE seat_inventory SET status='available',hold_token=NULL,hold_expires_at=NULL,booking_id=NULL WHERE hold_token=$1",[token]);
    const message=String(e.message||"");
    return res.status(409).json({error:message.startsWith("The seat hold expired")?message:"Reservation could not be completed. Please refresh the seat map and try again."});
  }
}