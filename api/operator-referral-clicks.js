import { db } from "hatchable";
export const access = "public";
export const methods = ["POST"];
export default async function(req,res) {
  const code=String(req.body?.code||"").trim().toUpperCase();
  const visitor=String(req.body?.visitor_key||"").trim();
  const campaign=String(req.body?.campaign||"operator-referral").trim().slice(0,60)||"operator-referral";
  if(!/^[A-Z0-9]{6,20}$/.test(code)||!/^[a-zA-Z0-9_-]{12,80}$/.test(visitor))
    return res.status(400).json({error:"A valid referral code and anonymous visitor key are required."});
  const found=await db.query("SELECT c.operator_id FROM operator_referral_codes c JOIN operators o ON o.id=c.operator_id WHERE c.code=$1 AND o.status='approved'",[code]);
  if(!found.rows.length)return res.status(404).json({error:"Referral code is not active."});
  await db.query("INSERT INTO operator_referral_click_events (referral_code,operator_id,campaign,visitor_key) VALUES ($1,$2,$3,$4) ON CONFLICT (referral_code,visitor_key) DO NOTHING",[code,found.rows[0].operator_id,campaign,visitor]);
  return res.json({ok:true,tracked:true});
}