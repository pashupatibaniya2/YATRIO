import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET","POST"];
export default async function(req,res) {
 if(req.method==="GET"){
  const {rows}=await db.query("SELECT o.id,o.name,o.slug,o.phone,o.description,o.registration_no,o.contact_name,o.status,o.created_at,(SELECT count(*) FROM operator_documents d WHERE d.operator_id=o.id) AS document_count,(SELECT count(*) FROM operator_documents d WHERE d.operator_id=o.id AND d.review_status='approved') AS approved_document_count FROM operators o ORDER BY o.created_at DESC");
  return res.json({operators:rows});
 }
 const id=String(req.body?.operator_id||""),status=String(req.body?.status||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["approved","rejected","suspended","unsuspended"].includes(status))return res.status(400).json({error:"Provide an operator and valid review action."});
 let target=status;
 if(status==="approved"||status==="unsuspended"){
  const docs=await db.query("SELECT count(*) AS total,count(*) FILTER (WHERE review_status='approved') AS approved FROM operator_documents WHERE operator_id=$1",[id]);
  if(Number(docs.rows[0]?.total)!==4||Number(docs.rows[0]?.approved)!==4){
   if(status==="approved")return res.status(409).json({error:"Approve all four required operator documents before approving this operator."});
   target="pending";
  } else target="approved";
 }
 const updated=await db.query("UPDATE operators SET status=$1 WHERE id=$2 AND ($1<>'approved' OR ((SELECT count(*) FROM operator_documents WHERE operator_id=$2)=4 AND (SELECT count(*) FROM operator_documents WHERE operator_id=$2 AND review_status='approved')=4)) RETURNING id,name,status",[target,id]);
 if(!updated.rows.length){
  const exists=await db.query("SELECT id FROM operators WHERE id=$1",[id]);
  if(exists.rows.length&&target==="approved")return res.status(409).json({error:"The four required documents changed during review. Refresh the application and verify all four documents again."});
  return res.status(404).json({error:"Operator application not found."});
 }
 const message=status==="suspended"?"Operator suspended. Public departures and new reservations are now disabled.":status==="unsuspended"?(target==="approved"?"Operator unsuspended and reactivated.":"Operator unsuspended to pending review because all four required documents are not currently approved."):"Operator status updated.";
 return res.json({operator:updated.rows[0],message});
}