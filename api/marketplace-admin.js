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
  if(!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({error:"Provide a valid provider id."});
  if(req.body.action==="delete") {
    await db.query("DELETE FROM marketplace_bookings WHERE provider_id=$1",[id]);
    await db.query("DELETE FROM marketplace_listings WHERE provider_id=$1",[id]);
    const deleted=await db.query("DELETE FROM marketplace_providers WHERE id=$1 RETURNING id,business_name",[id]);
    if(!deleted.rows.length) return res.status(404).json({error:"Partner application not found."});
    return res.json({provider:deleted.rows[0],message:"Provider and its marketplace listings were deleted."});
  }
  if(!["approved","rejected","suspended"].includes(status)) return res.status(400).json({error:"Choose approved, rejected or suspended."});
  const result=await db.transaction([
    {sql:"UPDATE marketplace_providers SET status=$1,admin_note=$2,updated_at=now() WHERE id=$3 RETURNING id,business_name,description,commission_rate,category_slug,status,admin_note",params:[status,note,id]},
    {sql:"UPDATE marketplace_listings l SET provider_business_name=p.business_name,provider_description=p.description,provider_commission_rate=p.commission_rate,status=CASE WHEN $2<>'approved' AND l.status='published' THEN 'paused' ELSE l.status END,updated_at=now() FROM marketplace_providers p WHERE p.id=$1 AND l.provider_id=p.id",params:[id,status]}
  ]);
  if(!result.results[0].rows.length) return res.status(404).json({error:"Partner application not found."});
  const provider=result.results[0].rows[0];
  res.json({provider,message:"Partner application status updated."});
}