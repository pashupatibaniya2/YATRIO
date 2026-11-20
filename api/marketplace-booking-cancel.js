import { db } from "hatchable";
export const access = "user";
export const methods = ["POST"];
export default async function(req,res) {
  const userId=String(req.user.id);
  const id=String(req.body.booking_id||"");
  if(!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({error:"A valid booking_id is required."});
  const result=await db.query("UPDATE marketplace_bookings SET status='cancelled',updated_at=now() WHERE id=$1 AND user_id=$2 AND status='pending_provider_confirmation' RETURNING id,booking_ref,status",[id,userId]);
  if(!result.rows.length) return res.status(409).json({error:"Only your pending booking requests can be cancelled in this version. Contact YATRIO support for a provider-confirmed request."});
  res.json({booking:result.rows[0],message:"Booking request cancelled. Reserved availability has been released. No refund was needed because no payment was collected."});
}