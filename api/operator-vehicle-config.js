import { db } from "hatchable";
export const access="user";
export const methods=["GET","PUT"];
const choices=new Set(["front_left","front_right","mid_left","mid_right","rear_left","rear_right","front","rear","none"]);
function cleanExterior(input){
 const v=input&&typeof input==="object"?input:{};
 const color=(x,f)=>/^#[0-9a-f]{6}$/i.test(String(x||""))?String(x).toLowerCase():f;
 const pick=(x,allowed,f)=>allowed.includes(String(x))?String(x):f;
 return {body_style:pick(v.body_style,["standard_coach","high_deck","tourist","sleeper"],"standard_coach"),primary_color:color(v.primary_color,"#f3f6f7"),secondary_color:color(v.secondary_color,"#176b87"),trim_color:color(v.trim_color,"#18a999"),window_tint:pick(v.window_tint,["clear","light","dark"],"light"),headlight_style:pick(v.headlight_style,["modern","classic","led"],"led"),wheel_style:pick(v.wheel_style,["standard","alloy","premium"],"alloy"),luggage_bays:v.luggage_bays!==false,brand_text:String(v.brand_text||"YATRIO").replace(/[<>]/g,"").trim().slice(0,32)};
}
function clean(input){
 const v=input&&typeof input==="object"?input:{};
 const pick=x=>choices.has(String(x))?String(x):"none";
 const doors=Array.isArray(v.doors)?[...new Set(v.doors.map(pick).filter(x=>x!=="none"))].slice(0,4):["mid_left","front_right"];
 const exits=Array.isArray(v.emergency_exits)?[...new Set(v.emergency_exits.map(pick).filter(x=>x!=="none"))].slice(0,4):["rear_left","rear_right"];
 return {deck_count:Number(v.deck_count)===2?2:1,driver_position:["front_left","front_right"].includes(v.driver_position)?v.driver_position:"front_left",conductor_position:["front_left","front_right","mid_left","mid_right","none"].includes(v.conductor_position)?v.conductor_position:"none",doors,stairs:pick(v.stairs)==="none"?"rear_right":pick(v.stairs),emergency_exits:exits,exterior:cleanExterior(v.exterior)};
}
async function operator(uid){return (await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 LIMIT 1",[uid])).rows[0]}
export default async function(req,res){
 const op=await operator(String(req.user.id));
 if(!op)return res.status(404).json({error:"Complete operator registration first."});
 if(op.status!=="approved")return res.status(403).json({error:"Your operator account must be approved and active."});
 const busId=String(req.method==="GET"?req.query.bus_id:req.body?.bus_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(busId))return res.status(400).json({error:"A valid bus_id is required."});
 const bus=(await db.query("SELECT id,capacity,seat_layout_config FROM buses WHERE id=$1 AND operator_id=$2",[busId,op.id])).rows[0];
 if(!bus)return res.status(404).json({error:"Bus not found in your operator account."});
 const config=bus.seat_layout_config||{};
 if(req.method==="GET")return res.json({bus_id:bus.id,vehicle:clean(config.vehicle),deck_count:Number(config.vehicle?.deck_count)||1,exterior:cleanExterior(config.vehicle?.exterior)});
 const vehicle=clean(req.body?.vehicle),seats=Array.isArray(config.seats)?config.seats:[];
 if(seats.some(s=>Number(s.deck||1)>vehicle.deck_count))return res.status(409).json({error:"This bus has seats assigned to the upper deck. Move those seats to deck 1 before switching to a single-deck configuration."});
 await db.query("UPDATE buses SET seat_layout_config=$1::jsonb WHERE id=$2 AND operator_id=$3",[JSON.stringify({...config,vehicle}),busId,op.id]);
 return res.json({message:"Fleet configuration saved. The 3D cabin will use these vehicle features.",vehicle});
}