import { db } from "hatchable";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 const r=await db.query("SELECT rules,updated_at FROM yatrio_cancellation_policy WHERE id=1");
 if(!r.rows.length) return res.status(503).json({error:"Cancellation policy is temporarily unavailable."});
 return res.json({currency:"NPR",rules:r.rows[0].rules,updated_at:r.rows[0].updated_at});
}