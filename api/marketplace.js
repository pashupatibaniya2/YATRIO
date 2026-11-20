import { db } from "hatchable";
export const access = "public";
export const methods = ["GET"];
export default async function(req,res) {
  const [categories,destinations] = await Promise.all([
    db.query("SELECT c.slug,c.name,c.tagline,c.description,c.icon,c.sort_order,COUNT(p.id) FILTER (WHERE p.status='approved')::int AS verified_providers FROM marketplace_categories c LEFT JOIN marketplace_providers p ON p.category_slug=c.slug WHERE c.status='active' GROUP BY c.id ORDER BY c.sort_order"),
    db.query("SELECT slug,name,province,tagline,highlights FROM marketplace_destinations WHERE status='published' ORDER BY sort_order")
  ]);
  res.json({categories:categories.rows,destinations:destinations.rows,inventory_notice:"Destination information is inspirational. Only services explicitly shown as available in search are bookable.",marketplace_status:"partner_onboarding"});
}