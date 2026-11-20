import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","PUT"];
const allowed = new Set(["ac","wifi","charging","water","blanket","reclining_seats","toilet"]);
export default async function(req,res) {
  const uid=String(req.user.id);
  const found=await db.query("SELECT o.id,o.name,o.slug,o.description,o.phone,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 AND ou.role IN ('owner','admin') ORDER BY o.created_at DESC LIMIT 1",[uid]);
  if(!found.rows.length)return res.status(404).json({error:"Operator account not found."});
  const op=found.rows[0];
  if(req.method==="GET")return res.json({operator:op});
  if(op.status!=="approved")return res.status(403).json({error:"Your operator profile can be published after verification."});
  const description=String(req.body?.description||"").trim().slice(0,1200);
  const phone=String(req.body?.phone||"").trim().slice(0,40);
  if(description.length<30)return res.status(400).json({error:"Add at least 30 characters describing your company and services."});
  if(phone.length<7)return res.status(400).json({error:"Enter a valid public contact phone number."});
  const updated=await db.query("UPDATE operators SET description=$1,phone=$2 WHERE id=$3 RETURNING id,name,slug,description,phone,status",[description,phone,op.id]);
  return res.json({operator:updated.rows[0],message:"Your public operator profile has been updated."});
}