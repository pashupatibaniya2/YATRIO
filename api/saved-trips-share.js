import { db } from "hatchable";
export const access = "user";
export const methods = ["POST"];
export default async function(req,res) {
 const id=String(req.body?.id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"A valid saved trip is required."});
 const token=crypto.randomUUID();
 const r=await db.query("UPDATE saved_trips SET is_shared=TRUE,share_token=$3,updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING share_token",[id,String(req.user.id),token]);
 if(!r.rows.length)return res.status(404).json({error:"Trip not found."});
 return res.json({url:"https://yatrio-nepal-bus.hatchable.site/shared-trip.html?token="+r.rows[0].share_token});
}