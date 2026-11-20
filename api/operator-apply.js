import { db } from "hatchable";
export const access = "user";
export const methods = ["POST"];
export default async function(req,res) {
  const userId = String(req.user.id);
  const name = String(req.body.business_name || "").trim();
  const phone = String(req.body.phone || "").trim();
  const registration = String(req.body.registration_no || "").trim();
  const contactName = String(req.body.contact_name || req.user.name || "").trim();
  if (name.length < 3 || phone.length < 7 || registration.length < 3 || !contactName) {
    return res.status(400).json({error:"Business name, contact person, phone and registration number are required."});
  }
  const existing = await db.query("SELECT id,status FROM operators WHERE owner_user_id=$1",[userId]);
  if (existing.rows.length) return res.status(409).json({error:"An operator application already exists for this account.",operator:existing.rows[0]});
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,36)+"-"+crypto.randomUUID().slice(0,6);
  const created = await db.query(
    "INSERT INTO operators (name,slug,description,phone,status,owner_user_id,registration_no,contact_name) VALUES ($1,$2,$3,$4,'pending',$5,$6,$7) RETURNING id,name,slug,status,phone,registration_no,contact_name",
    [name,slug,"Operator application submitted for verification.",phone,userId,registration,contactName]
  );
  await db.query("INSERT INTO operator_users (operator_id,user_id,role) VALUES ($1,$2,'owner')",[created.rows[0].id,userId]);
  res.status(201).json({operator:created.rows[0],message:"Application submitted. Yatrio will verify your operator details before enabling schedule publishing."});
}