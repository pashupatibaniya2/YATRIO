import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","PUT"];
export default async function(req,res) {
  const userId=String(req.user.id);
  if(req.method==="GET") {
    const result=await db.query("SELECT p.id AS provider_id,p.category_slug,p.business_name,p.status AS provider_status,p.commission_rate,l.id AS listing_id,l.title,l.description,l.city,l.province,l.address,l.price_from,l.price_unit,l.cover_image_url,l.attributes,l.status,l.created_at FROM marketplace_providers p LEFT JOIN marketplace_listings l ON l.provider_id=p.id WHERE p.user_id=$1 ORDER BY p.created_at DESC,l.created_at DESC",[userId]);
    return res.json({items:result.rows});
  }
  if(req.method==="POST") {
    const category=String(req.body.category_slug||"").trim().toLowerCase();
    const title=String(req.body.title||"").trim();
    const description=String(req.body.description||"").trim().slice(0,2500);
    const city=String(req.body.city||"").trim();
    const province=String(req.body.province||"").trim();
    const address=String(req.body.address||"").trim();
    const price=Number(req.body.price_from);
    const unit=String(req.body.price_unit||"per_person");
    const image=String(req.body.cover_image_url||"").trim();
    if(!["stays","rides","experiences"].includes(category)) return res.status(400).json({error:"This listing category is not enabled in the generic marketplace yet. Bus schedules continue in the bus operator portal."});
    if(title.length<3||city.length<2||!Number.isFinite(price)||price<=0||!["per_person","per_night","per_vehicle","per_trip","per_booking"].includes(unit)) return res.status(400).json({error:"Enter a title, city, valid positive price and supported price unit."});
    const provider=await db.query("SELECT id,business_name,description,commission_rate FROM marketplace_providers WHERE user_id=$1 AND category_slug=$2 AND status='approved'",[userId,category]);
    if(!provider.rows.length) return res.status(403).json({error:"An approved provider account for this category is required before creating listings."});
    const result=await db.query("INSERT INTO marketplace_listings (provider_id,user_id,category_slug,title,description,city,province,address,price_from,price_unit,cover_image_url,provider_business_name,provider_description,provider_commission_rate,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'draft') RETURNING id,title,category_slug,city,price_from,price_unit,status",[provider.rows[0].id,userId,category,title,description,city,province,address,price,unit,image,provider.rows[0].business_name,provider.rows[0].description,provider.rows[0].commission_rate]);
    return res.status(201).json({listing:result.rows[0],message:"Listing saved as a draft. Add availability before publishing."});
  }
  const id=String(req.body.listing_id||"");
  const status=String(req.body.status||"");
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["published","paused","draft"].includes(status)) return res.status(400).json({error:"Provide a valid listing and status."});
  const result=await db.query("UPDATE marketplace_listings l SET status=$1,updated_at=now() FROM marketplace_providers p WHERE l.provider_id=p.id AND l.id=$2 AND l.user_id=$3 AND p.user_id=$3 AND p.status='approved' AND ( $1<>'published' OR EXISTS (SELECT 1 FROM marketplace_availability a WHERE a.listing_id=l.id AND a.status='active' AND a.starts_at>now() AND a.reserved_quantity<a.capacity)) RETURNING l.id,l.title,l.status",[status,id,userId]);
  if(!result.rows.length) return res.status(409).json({error:"Listing not found, provider not approved, or no future availability exists. Add an availability slot before publishing."});
  res.json({listing:result.rows[0],message:"Listing status updated."});
}