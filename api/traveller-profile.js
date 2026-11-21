import { db, storage } from "hatchable";
export const access = "user";
export const methods = ["GET","PUT"];
const clean=(v,n=120)=>String(v||"").trim().slice(0,n);
const defaults={booking_updates:true,trip_tips:false,offers:false};
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in to view your traveller profile."});
 const base=await db.query("SELECT email,name,image FROM users WHERE id=$1 LIMIT 1",[uid]);
 const saved=await db.query("SELECT full_name,phone,home_city,emergency_name,emergency_phone,emergency_relationship,travel_preferences,notification_preferences,avatar_storage_key,updated_at FROM traveller_profiles WHERE user_id=$1",[uid]);
 const current=saved.rows[0]||{};
 const avatarUrl=current.avatar_storage_key?await storage.url(current.avatar_storage_key):base.rows[0]?.image||"";
 if(req.method==="GET")return res.json({profile:{email:base.rows[0]?.email||req.user?.email||"",full_name:current.full_name||base.rows[0]?.name||"",phone:current.phone||"",home_city:current.home_city||"",emergency_name:current.emergency_name||"",emergency_phone:current.emergency_phone||"",emergency_relationship:current.emergency_relationship||"",travel_preferences:current.travel_preferences||{},notification_preferences:{...defaults,...(current.notification_preferences||{})},avatar_url:avatarUrl}});
 const name=clean(req.body?.full_name,100),phone=clean(req.body?.phone,30),city=clean(req.body?.home_city,80);
 const emergencyName=clean(req.body?.emergency_name,100),emergencyPhone=clean(req.body?.emergency_phone,30),relationship=clean(req.body?.emergency_relationship,50);
 const prefs=req.body?.travel_preferences||{},notifications=req.body?.notification_preferences||{};
 if(name.length<2)return res.status(400).json({error:"Please enter your full name (at least 2 characters)."});
 if(phone&&!/^[+0-9() .-]{7,30}$/.test(phone))return res.status(400).json({error:"Enter a valid phone number."});
 if(emergencyPhone&&!/^[+0-9() .-]{7,30}$/.test(emergencyPhone))return res.status(400).json({error:"Enter a valid emergency contact phone number."});
 if((emergencyName||emergencyPhone)&&(!emergencyName||!emergencyPhone))return res.status(400).json({error:"Enter both the emergency contact name and phone number, or leave both blank."});
 const safePrefs={travel_style:["adventure","culture","nature","relaxed","family","food"].includes(prefs.travel_style)?prefs.travel_style:"",seat_preference:["window","aisle","no_preference"].includes(prefs.seat_preference)?prefs.seat_preference:"no_preference",dietary_notes:clean(prefs.dietary_notes,160)};
 const safeNotifications={booking_updates:notifications.booking_updates!==false,trip_tips:notifications.trip_tips===true,offers:notifications.offers===true};
 await db.query("INSERT INTO traveller_profiles(user_id,full_name,phone,home_city,emergency_name,emergency_phone,emergency_relationship,travel_preferences,notification_preferences) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb) ON CONFLICT(user_id) DO UPDATE SET full_name=EXCLUDED.full_name,phone=EXCLUDED.phone,home_city=EXCLUDED.home_city,emergency_name=EXCLUDED.emergency_name,emergency_phone=EXCLUDED.emergency_phone,emergency_relationship=EXCLUDED.emergency_relationship,travel_preferences=EXCLUDED.travel_preferences,notification_preferences=EXCLUDED.notification_preferences,updated_at=now()",[uid,name,phone,city,emergencyName,emergencyPhone,relationship,JSON.stringify(safePrefs),JSON.stringify(safeNotifications)]);
 return res.json({profile:{email:base.rows[0]?.email||req.user?.email||"",full_name:name,phone,home_city:city,emergency_name:emergencyName,emergency_phone:emergencyPhone,emergency_relationship:relationship,travel_preferences:safePrefs,notification_preferences:safeNotifications,avatar_url:avatarUrl},message:"Traveller profile and preferences saved."});
}