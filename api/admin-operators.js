import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET","POST"];
export default async function(req,res) {
 if(req.method==="GET"){
  const {rows}=await db.query("SELECT id,name,slug,phone,description,status,created_at FROM operators ORDER BY created_at DESC");
  return res.json({operators:rows});
 }
 const id=String(req.body.operator_id||""),status=String(req.body.status||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["approved","rejected","suspended"].includes(status))return res.status(400).json({error:"Provide an operator and valid review status."});
 const updated=await db.query("UPDATE operators SET status=$1 WHERE id=$2 RETURNING id,name,status",[status,id]);
 if(!updated.rows.length)return res.status(404).json({error:"Operator application not found."});
 res.json({operator:updated.rows[0]});
}