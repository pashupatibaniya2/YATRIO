import { db } from "hatchable";
export const access = "user";
export const methods = ["GET"];
export default async function(req,res) {
  const userId=String(req.user.id);
  const found=await db.query("SELECT o.id,o.name,o.status,c.code FROM operators o JOIN operator_users ou ON ou.operator_id=o.id LEFT JOIN operator_referral_codes c ON c.operator_id=o.id WHERE ou.user_id=$1 ORDER BY o.created_at DESC LIMIT 1",[userId]);
  if(!found.rows.length)return res.status(404).json({error:"No operator account is linked to this user."});
  const op=found.rows[0];
  if(op.status!=="approved")return res.status(403).json({error:"Referral links are available after your operator account is approved.",operator_status:op.status});
  let code=op.code;
  if(!code){
    code="YTR"+op.id.replace(/-/g,"").slice(0,8).toUpperCase();
    const saved=await db.query("INSERT INTO operator_referral_codes (operator_id,code) VALUES ($1,$2) ON CONFLICT (operator_id) DO UPDATE SET code=operator_referral_codes.code RETURNING code",[op.id,code]);
    code=saved.rows[0].code;
  }
  const counts=await db.query("SELECT count(*)::int AS total,count(*) FILTER (WHERE o.status='approved')::int AS approved,count(*) FILTER (WHERE o.status='pending')::int AS pending FROM operator_referral_attributions a JOIN operators o ON o.id=a.new_operator_id WHERE a.referred_by_operator_id=$1",[op.id]);
  const c=counts.rows[0]||{};
  return res.json({operator:{id:op.id,name:op.name,status:op.status},code,share_path:"/operator.html?ref="+encodeURIComponent(code),referrals:{total:Number(c.total||0),approved:Number(c.approved||0),pending:Number(c.pending||0)}});
}