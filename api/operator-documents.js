import { db, storage } from "hatchable";
export const access = "user";
export const methods = ["GET","POST"];
const TYPES = new Set(["business_registration","pan_vat","transport_license","authorized_contact_id"]);
const MAX_BYTES = 5 * 1024 * 1024;
function validFile(file) {
  const b = file.buffer;
  if (!b || !b.length || b.length > MAX_BYTES) return false;
  const t = file.contentType || "";
  if (t === "application/pdf") return b.length > 4 && b[0]===37 && b[1]===80 && b[2]===68 && b[3]===70;
  if (t === "image/jpeg") return b.length > 3 && b[0]===255 && b[1]===216 && b[2]===255;
  if (t === "image/png") return b.length > 8 && b[0]===137 && b[1]===80 && b[2]===78 && b[3]===71;
  if (t === "image/webp") return b.length > 12 && b.toString("ascii",0,4)==="RIFF" && b.toString("ascii",8,12)==="WEBP";
  return false;
}
export default async function(req,res) {
  const uid=String(req.user.id);
  const op=(await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 LIMIT 1",[uid])).rows[0];
  if(!op) return res.status(404).json({error:"Register your operator account first."});
  if(req.method==="GET") {
    const rows=(await db.query("SELECT id,document_type,original_filename,bytes,review_status,review_note,created_at,updated_at FROM operator_documents WHERE operator_id=$1 ORDER BY document_type",[op.id])).rows;
    return res.json({documents:rows,operator_status:op.status,required_documents:[...TYPES]});
  }
  const type=String(req.body?.document_type||"");
  const file=(req.files||[]).find(f=>f.field==="file");
  if(!TYPES.has(type)) return res.status(400).json({error:"Choose a valid document category."});
  if(!file) return res.status(400).json({error:"Choose a document to upload."});
  if(!validFile(file)) return res.status(415).json({error:"Upload a valid PDF, JPG, PNG or WEBP file up to 5 MB."});
  const ext={"application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.contentType];
  const previous=(await db.query("SELECT storage_key FROM operator_documents WHERE operator_id=$1 AND document_type=$2",[op.id,type])).rows[0];
  const key="operator-documents/"+op.id+"/"+type+"-"+crypto.randomUUID()+"."+ext;
  await storage.put(key,file.buffer,file.contentType);
  const statements=[{
    sql:"INSERT INTO operator_documents (operator_id,user_id,document_type,file_reference,storage_key,original_filename,content_type,bytes,verification_status,review_status,review_note,reviewed_at,updated_at) VALUES ($1,$2,$3,$4,$4,$5,$6,$7,'pending','pending','',NULL,now()) ON CONFLICT (operator_id,document_type) DO UPDATE SET user_id=EXCLUDED.user_id,file_reference=EXCLUDED.file_reference,storage_key=EXCLUDED.storage_key,original_filename=EXCLUDED.original_filename,content_type=EXCLUDED.content_type,bytes=EXCLUDED.bytes,verification_status='pending',review_status='pending',review_note='',reviewed_at=NULL,updated_at=now() RETURNING id,document_type,original_filename,bytes,review_status,review_note,created_at,updated_at",
    params:[op.id,uid,type,key,String(file.filename||"document").slice(0,180),file.contentType,file.buffer.length]
  }];
  statements.push({sql:"UPDATE operators SET status='pending' WHERE id=$1 AND status='approved'",params:[op.id]});
  const saved=await db.transaction(statements);
  if(previous?.storage_key && previous.storage_key!==key) await storage.del(previous.storage_key);
  return res.status(201).json({document:saved.results[0].rows[0],message:"Document uploaded and queued for verification. Replaced documents require YATRIO review before the operator account is active again."});
}