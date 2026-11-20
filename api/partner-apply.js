import { db } from "hatchable";
export const access = "user";
export const methods = ["POST"];
export default async function(req,res) {
  const userId = String(req.user.id);
  const category = String(req.body.category_slug || "").trim().toLowerCase();
  const business = String(req.body.business_name || "").trim();
  const contact = String(req.body.contact_name || req.user.name || "").trim();
  const phone = String(req.body.phone || "").trim();
  const registration = String(req.body.registration_number || "").trim();
  const city = String(req.body.base_city || "").trim();
  const description = String(req.body.description || "").trim().slice(0,1200);
  if (!["buses","stays","rides","experiences"].includes(category)) return res.status(400).json({error:"Choose a valid travel service category."});
  if (business.length < 2 || contact.length < 2 || phone.length < 7 || registration.length < 3 || city.length < 2) return res.status(400).json({error:"Business name, contact person, phone, registration number and base city are required."});
  const exists = await db.query("SELECT id,status FROM marketplace_providers WHERE user_id=$1 AND category_slug=$2",[userId,category]);
  if (exists.rows.length) return res.status(409).json({error:"You already have an application for this service category.",application:exists.rows[0]});
  const result = await db.query("INSERT INTO marketplace_providers (user_id,category_slug,business_name,contact_name,phone,registration_number,base_city,description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,category_slug,business_name,base_city,status,created_at",[userId,category,business,contact,phone,registration,city,description]);
  res.status(201).json({application:result.rows[0],message:"Your partner application has been received. It will remain pending until YATRIO completes its verification."});
}