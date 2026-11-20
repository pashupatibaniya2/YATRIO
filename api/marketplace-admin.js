import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET","POST"];
export default async function(req,res) {
  if(req.method==="GET") {
    const [providers,counts] = await Promise.all([
      db.query("SELECT id,category_slug,business_name,contact_name,phone,registration_number,base_city,description,status,admin_note,created_at FROM marketplace_providers ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END,created_at DESC"),
      db.query("SELECT status,COUNT(*)::int AS count FROM marketplace_providers GROUP BY status")
    ]);
    return res.json({providers:providers.rows,counts:counts.rows});
  }
  const id=String(req.body.provider_id||"");
  const status=String(req.body.status||"");
  const note=String(req.body.admin_note||"").trim().slice(0,500);
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["approved","rejected","suspended"].includes(status)) return res.status(400).json({error:"Provide a valid provider and review status."});
  const result=await db.query("UPDATE marketplace_providers SET status=$1,admin_note=$2,updated_at=now() WHERE id=$3 RETURNING id,business_name,category_slug,status,admin_note",[status,note,id]);
  if(!result.rows.length) return res.status(404).json({error:"Partner application not found."});
  res.json({provider:result.rows[0],message:"Partner application status updated."});
}