import { db, storage } from "hatchable";
export const access = "admin";
export const methods = ["GET","POST"];
export default async function(req,res) {
  if(req.method==="GET") {
    const rows=(await db.query("SELECT d.id,d.operator_id,o.name AS operator_name,d.document_type,d.original_filename,d.bytes,d.review_status,d.review_note,d.created_at,d.updated_at,d.storage_key FROM operator_documents d JOIN operators o ON o.id=d.operator_id ORDER BY d.created_at DESC")).rows;
    const documents=await Promise.all(rows.map(async d=>({id:d.id,operator_id:d.operator_id,operator_name:d.operator_name,document_type:d.document_type,original_filename:d.original_filename,bytes:d.bytes,review_status:d.review_status,review_note:d.review_note,created_at:d.created_at,url:await storage.url(d.storage_key,{ttl:300})})));
    return res.json({documents});
  }
  const id=String(req.body?.document_id||""), status=String(req.body?.review_status||""), note=String(req.body?.review_note||"").trim().slice(0,500);
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["approved","rejected"].includes(status)||(status==="rejected"&&!note)) return res.status(400).json({error:"Provide a document, valid review decision and a rejection reason when rejecting."});
  const updated=await db.transaction([
    {sql:"UPDATE operator_documents SET review_status=$1,verification_status=$1,review_note=$2,reviewed_at=now(),updated_at=now() WHERE id=$3 RETURNING id,operator_id,document_type,review_status,review_note",params:[status,note,id]},
    {sql:"UPDATE operators SET status='pending' WHERE id=(SELECT operator_id FROM operator_documents WHERE id=$1) AND status='approved' AND $2='rejected'",params:[id,status]}
  ]);
  if(!updated.results[0].rows.length) return res.status(404).json({error:"Document not found."});
  const reviewed=updated.results[0].rows[0];
  await db.query("INSERT INTO operator_admin_audit(actor_user_id,action,target_type,target_id,operator_id,reason,details) VALUES($1,$2,'operator_document',$3,$4,$5,$6::jsonb)",[String(req.user?.id||"admin"),"document_"+status,id,reviewed.operator_id,note,JSON.stringify({document_type:reviewed.document_type,review_status:status})]);
  return res.json({document:reviewed,message:"Document review saved. If a previously approved operator no longer has all required approvals, its account has been returned to pending review."});
}