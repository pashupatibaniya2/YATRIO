import { db } from "hatchable";
export const access="user";
export const methods=["GET","PUT"];
async function getOperator(uid){
 return (await db.query("SELECT o.id,o.name,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 UNION SELECT o.id,o.name,o.status FROM operators o WHERE o.owner_user_id=$1 LIMIT 1",[uid])).rows[0];
}
function makeRules(base,fees){
 if(!Array.isArray(fees)||fees.length!==base.length) return null;
 const out=[];
 for(let i=0;i<base.length;i++){
  const fee=Number(fees[i]);
  const cap=Number(base[i].fee_percent);
  if(!Number.isFinite(fee)||fee<0||fee>cap||fee>100) return null;
  out.push({...base[i],fee_percent:fee,refund_percent:100-fee});
 }
 return out;
}
export default async function(req,res){
 const uid=String(req.user?.id||"");
 const op=await getOperator(uid);
 if(!op)return res.status(404).json({error:"Operator account not found."});
 if(op.status!=="approved")return res.status(403).json({error:"Your operator account must be approved before managing cancellation terms."});
 const baseRow=(await db.query("SELECT rules,updated_at FROM yatrio_cancellation_policy WHERE id=1")).rows[0];
 if(!baseRow)return res.status(503).json({error:"Platform cancellation policy is unavailable."});
 const own=(await db.query("SELECT rules,updated_at FROM operator_cancellation_policies WHERE operator_id=$1",[op.id])).rows[0];
 if(req.method==="GET")return res.json({operator:{id:op.id,name:op.name},platform_rules:baseRow.rules,operator_rules:own?.rules||null,updated_at:own?.updated_at||null,using_platform_default:!own});
 const rules=makeRules(baseRow.rules,req.body?.fees);
 if(!rules)return res.status(400).json({error:"Enter one valid fee for every platform time band. Each operator fee must be between 0% and the platform maximum for that band."});
 const saved=await db.query("INSERT INTO operator_cancellation_policies(operator_id,rules,updated_by,updated_at) VALUES($1,$2::jsonb,$3,now()) ON CONFLICT(operator_id) DO UPDATE SET rules=EXCLUDED.rules,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING rules,updated_at",[op.id,JSON.stringify(rules),uid]);
 return res.json({operator_rules:saved.rows[0].rules,updated_at:saved.rows[0].updated_at,using_platform_default:false,message:"Your operator cancellation terms are saved. They can only offer equal or higher passenger refunds than the platform minimum."});
}