import { db } from "hatchable";
export const access = "public";
export const methods = ["GET"];
export default async function(req,res) {
  const id=String(req.query.id||"").trim();
  if(id) {
    if(!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({error:"A valid listing id is required."});
    const item=await db.query("SELECT l.id,l.category_slug,l.title,l.description,l.city,l.province,l.address,l.price_from,l.currency,l.price_unit,l.cover_image_url,l.attributes,l.provider_business_name AS business_name,l.provider_description,l.city AS base_city FROM marketplace_listings l WHERE l.id=$1 AND l.status='published'",[id]);
    if(!item.rows.length) return res.status(404).json({error:"This service is not currently available."});
    const slots=await db.query("SELECT id,starts_at,ends_at,capacity-reserved_quantity AS remaining,COALESCE(price_override,$2) AS price FROM marketplace_availability WHERE listing_id=$1 AND status='active' AND starts_at>now() AND reserved_quantity<capacity ORDER BY starts_at LIMIT 60",[id,item.rows[0].price_from]);
    return res.json({listing:item.rows[0],availability:slots.rows,bookable:slots.rows.length>0});
  }
  const category=String(req.query.category||"").trim().toLowerCase();
  const city=String(req.query.city||"").trim();
  const q=String(req.query.q||"").trim().slice(0,80);
  if(category && !["buses","stays","rides","experiences"].includes(category)) return res.status(400).json({error:"Unknown travel category."});
  const result=await db.query("SELECT l.id,l.category_slug,l.title,l.description,l.city,l.province,l.price_from,l.currency,l.price_unit,l.cover_image_url,l.provider_business_name AS business_name,COALESCE((SELECT sum(a.capacity-a.reserved_quantity) FROM marketplace_availability a WHERE a.listing_id=l.id AND a.status='active' AND a.starts_at>now()),0)::int AS available_quantity,(SELECT min(a.starts_at) FROM marketplace_availability a WHERE a.listing_id=l.id AND a.status='active' AND a.starts_at>now() AND a.reserved_quantity<a.capacity) AS next_available_at FROM marketplace_listings l WHERE l.status='published' AND ($1='' OR l.category_slug=$1) AND ($2='' OR lower(l.city)=lower($2)) AND ($3='' OR (l.title ILIKE '%'||$3||'%' OR l.description ILIKE '%'||$3||'%' OR l.city ILIKE '%'||$3||'%')) AND EXISTS (SELECT 1 FROM marketplace_availability a WHERE a.listing_id=l.id AND a.status='active' AND a.starts_at>now() AND a.reserved_quantity<a.capacity) ORDER BY next_available_at ASC,l.created_at DESC LIMIT 100",[category,city,q]);
  res.json({listings:result.rows,count:result.rows.length,currency:"NPR",notice:"Only published listings from approved providers with upcoming availability are shown."});
}