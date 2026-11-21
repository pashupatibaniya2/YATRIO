import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","PUT"];
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in to view your traveller profile."});
 const base=await db.query("SELECT email,name,image FROM users WHERE id=$1 LIMIT 1",[uid]);
 const saved=await db.query("SELECT full_name,phone,home_city,updated_at FROM traveller_profiles WHERE user_id=$1",[uid]);
 const current=saved.rows[0]||{};
 if(req.method==="GET")return res.json({profile:{email:base.rows[0]?.email||req.user?.email||"",full_name:current.full_name||base.rows[0]?.name||"",phone:current.phone||"",home_city:current.home_city||"",avatar_url:base.rows[0]?.image||""}});
 const name=String(req.body?.full_name||"").trim().slice(0,100);
 const phone=String(req.body?.phone||"").trim().slice(0,30);
 const city=String(req.body?.home_city||"").trim().slice(0,80);
 if(name.length<2)return res.status(400).json({error:"Please enter your full name (at least 2 characters)."});
 if(phone && !/^[+0-9() .-]{7,30}$/.test(phone))return res.status(400).json({error:"Enter a valid phone number."});
 await db.query("INSERT INTO traveller_profiles(user_id,full_name,phone,home_city) VALUES($1,$2,$3,$4) ON CONFLICT(user_id) DO UPDATE SET full_name=EXCLUDED.full_name,phone=EXCLUDED.phone,home_city=EXCLUDED.home_city,updated_at=now()",[uid,name,phone,city]);
 return res.json({profile:{email:base.rows[0]?.email||req.user?.email||"",full_name:name,phone,home_city:city,avatar_url:base.rows[0]?.image||""},message:"Traveller profile updated."});
}