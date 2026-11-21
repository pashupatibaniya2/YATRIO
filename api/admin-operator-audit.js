import { db } from "hatchable";
export const access="admin";
export const methods=["GET"];
export default async function(req,res){
 const limit=Math.min(200,Math.max(1,Number(req.query.limit)||80));
 const operatorId=String(req.query.operator_id||"");
 if(operatorId&&!/^[0-9a-f-]{36}$/i.test(operatorId))return res.status(400).json({error:"Invalid operator filter."});
 const q=operatorId
  ? await db.query("SELECT a.id,a.actor_user_id,a.action,a.target_type,a.target_id,a.operator_id,a.reason,a.details,a.created_at,o.name AS operator_name FROM operator_admin_audit a LEFT JOIN operators o ON o.id=a.operator_id WHERE a.operator_id=$1 ORDER BY a.created_at DESC LIMIT $2",[operatorId,limit])
  : await db.query("SELECT a.id,a.actor_user_id,a.action,a.target_type,a.target_id,a.operator_id,a.reason,a.details,a.created_at,o.name AS operator_name FROM operator_admin_audit a LEFT JOIN operators o ON o.id=a.operator_id ORDER BY a.created_at DESC LIMIT $1",[limit]);
 return res.json({events:q.rows});
}