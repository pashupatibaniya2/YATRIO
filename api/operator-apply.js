import { db } from "hatchable";
export const access = "user";
export const methods = ["POST"];
export default async function(req,res) {
  const userId = String(req.user.id);
  const name = String(req.body.business_name || "").trim();
  const phone = String(req.body.phone || "").trim();
  const registration = String(req.body.registration_no || "").trim();
  const contactName = String(req.body.contact_name || req.user.name || "").trim();
  const referralCode = String(req.body.referral_code || "").trim().toUpperCase();
  if (name.length < 3 || phone.length < 7 || registration.length < 3 || !contactName) {
    return res.status(400).json({error:"Business name, contact person, phone and registration number are required."});
  }
  const existing = await db.query("SELECT id,status FROM operators WHERE owner_user_id=$1",[userId]);
  if (existing.rows.length) return res.status(409).json({error:"An operator application already exists for this account.",operator:existing.rows[0]});
  let referrerId = null;
  if (referralCode) {
    const referral = await db.query("SELECT c.operator_id FROM operator_referral_codes c JOIN operators o ON o.id=c.operator_id WHERE c.code=$1 AND o.status='approved'",[referralCode]);
    if (!referral.rows.length) return res.status(400).json({error:"This operator referral code is invalid or no longer active. Remove the code or ask the referring operator for a current link."});
    referrerId = referral.rows[0].operator_id;
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,36)+"-"+crypto.randomUUID().slice(0,6);
  const operatorId=crypto.randomUUID();
  const statements=[
    {sql:"INSERT INTO operators (id,name,slug,description,phone,status,owner_user_id,registration_no,contact_name) VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8) RETURNING id,name,slug,status,phone,registration_no,contact_name",params:[operatorId,name,slug,"Operator application submitted for verification.",phone,userId,registration,contactName]},
    {sql:"INSERT INTO operator_users (operator_id,user_id,role) VALUES ($1,$2,'owner')",params:[operatorId,userId]}
  ];
  if (referrerId) statements.push({sql:"INSERT INTO operator_referral_attributions (new_operator_id,referral_code,referred_by_operator_id) VALUES ($1,$2,$3)",params:[operatorId,referralCode,referrerId]});
  const created=await db.transaction(statements);
  res.status(201).json({operator:created.results[0].rows[0],message:"Application submitted. Yatrio will verify your operator details before enabling schedule publishing.",referred:!!referrerId});
}