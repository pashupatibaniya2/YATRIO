import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET"];
export default async function(req,res) {
  const result = await db.query(
    "SELECT id,booking_type,booking_ref,provider,mode,amount,currency,purchase_order_id,provider_payment_id,status,failure_reason,created_at,verified_at FROM payment_transactions ORDER BY created_at DESC LIMIT 200"
  );
  const totals = await db.query(
    "SELECT count(*)::int AS attempts,count(*) FILTER (WHERE status='succeeded')::int AS succeeded,count(*) FILTER (WHERE status IN ('initiated','pending'))::int AS pending,COALESCE(sum(amount) FILTER (WHERE status='succeeded'),0) AS verified_total FROM payment_transactions"
  );
  return res.json({payments:result.rows,summary:totals.rows[0]});
}