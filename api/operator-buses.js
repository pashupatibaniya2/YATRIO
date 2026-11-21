import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","PUT"];
async function owner(uid){return (await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 LIMIT 1",[uid])).rows[0]}
function cleanExterior(v){
 if(!v||typeof v!=="object")return undefined;
 const color=(x,f)=>/^#[0-9a-f]{6}$/i.test(String(x||""))?String(x).toLowerCase():f;
 const pick=(x,a,f)=>a.includes(String(x))?String(x):f;
 return {body_style:pick(v.body_style,["standard_coach","high_deck","tourist","sleeper"],"standard_coach"),primary_color:color(v.primary_color,"#f3f6f7"),secondary_color:color(v.secondary_color,"#176b87"),trim_color:color(v.trim_color,"#18a999"),window_tint:pick(v.window_tint,["clear","light","dark"],"light"),headlight_style:pick(v.headlight_style,["modern","classic","led"],"led"),wheel_style:pick(v.wheel_style,["standard","alloy","premium"],"alloy"),luggage_bays:v.luggage_bays!==false,brand_text:String(v.brand_text||"YATRIO").replace(/[<>]/g,"").trim().slice(0,32)};
}
function cleanVehicle(v){
 if(!v||typeof v!=="object")return undefined;
 const valid=["front_left","front_right","mid_left","mid_right","rear_left","rear_right","none"];
 const pos=x=>valid.includes(String(x))?String(x):"none";
 const list=(x,fallback)=>Array.isArray(x)?[...new Set(x.map(pos).filter(p=>p!=="none"))].slice(0,4):fallback;
 return {deck_count:Number(v.deck_count)===2?2:1,driver_position:["front_left","front_right"].includes(v.driver_position)?v.driver_position:"front_left",conductor_position:pos(v.conductor_position),stairs:pos(v.stairs)==="none"?"rear_right":pos(v.stairs),doors:list(v.doors,["mid_left","front_right"]),emergency_exits:list(v.emergency_exits,["rear_left","rear_right"]),...(cleanExterior(v.exterior)?{exterior:cleanExterior(v.exterior)}:{})};
}
function cleanLayoutConfig(input,type){
 const raw=input&&typeof input==="object"?input:{};
 const layout=["auto","coach_2x2","sofa_2x1","sleeper_2x1"].includes(raw.layout)?raw.layout:"auto";
 const color=(v,fallback)=>/^#[0-9a-f]{6}$/i.test(String(v||""))?String(v).toLowerCase():fallback;
 const width=Number(raw.cabin_width),spacing=Number(raw.row_spacing);
 const seats=Array.isArray(raw.seats)?raw.seats.slice(0,80).map(s=>({seat_number:String(s.seat_number||"").trim().toUpperCase(),seat_type:["standard","sofa","sleeper_berth"].includes(s.seat_type)?s.seat_type:"standard",row:Number(s.row)||1,col:Number(s.col)||1,deck:Number(s.deck)||1})):null;
 return {layout,cabin_width:Number.isFinite(width)?Math.max(2.1,Math.min(2.7,width)):2.45,row_spacing:Number.isFinite(spacing)?Math.max(.6,Math.min(1.05,spacing)):.74,interior_color:color(raw.interior_color,"#e5eef0"),seat_color:color(raw.seat_color,"#2e6474"),...(seats?{seats}:{}),...(cleanVehicle(raw.vehicle)?{vehicle:cleanVehicle(raw.vehicle)}:{})};
}
export default async function(req,res) {
 const op=await owner(String(req.user.id));
 if(!op)return res.status(404).json({error:"Complete operator registration first."});
 if(op.status!=="approved")return res.status(403).json({error:"Your operator account must be approved and active to manage buses."});
 if(req.method==="GET"){
  const rows=await db.query("SELECT b.id,b.name,b.registration_no,b.bus_type,b.capacity,b.status,b.amenities,b.seat_layout_config,(SELECT count(*) FROM bus_seats bs WHERE bs.bus_id=b.id) AS seat_count,(SELECT count(*) FROM schedules s WHERE s.bus_id=b.id) AS schedule_count FROM buses b WHERE b.operator_id=$1 ORDER BY b.name",[op.id]);
  return res.json({buses:rows.rows});
 }
 const name=String(req.body?.name||"").trim(),reg=String(req.body?.registration_no||"").trim().toUpperCase(),type=String(req.body?.bus_type||"Deluxe").trim().slice(0,60),seatType=/sleeper|berth/i.test(type)?"sleeper_berth":/sofa|2\s*\+\s*1/i.test(type)?"sofa":"standard",layoutConfig=cleanLayoutConfig(req.body?.seat_layout_config,type),capacity=Number(req.body?.capacity||32),allowedAmenities=new Set(["ac","wifi","charging","water","blanket","reclining_seats","toilet"]),amenities=Array.isArray(req.body?.amenities)?[...new Set(req.body.amenities.map(String).filter(x=>allowedAmenities.has(x)))]:[];
 if(req.method==="POST"){
  if(name.length<2||reg.length<3||!Number.isInteger(capacity)||capacity<4||capacity>80)return res.status(400).json({error:"Enter a bus name, registration number and capacity between 4 and 80."});
  const busId=crypto.randomUUID();
  const created=await db.transaction([
   {sql:"INSERT INTO buses (id,operator_id,name,registration_no,bus_type,capacity,amenities,seat_layout_config) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,name,registration_no,bus_type,capacity,status,amenities,seat_layout_config",params:[busId,op.id,name,reg,type,capacity,amenities,layoutConfig]},
   {sql:"INSERT INTO bus_seats (bus_id,seat_number,seat_type) SELECT $1,'S'||n,$3 FROM generate_series(1,$2) n",params:[busId,capacity,seatType]},
   {sql:"SELECT CASE WHEN (SELECT count(*) FROM bus_seats WHERE bus_id=$1) <> $2 THEN 1/0 ELSE 1 END",params:[busId,capacity]}
  ]);
  return res.status(201).json({bus:created.results[0].rows[0],message:"Bus created with "+capacity+" seats."});
 }
 const id=String(req.body?.bus_id||""),status=String(req.body?.status||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"A valid bus_id is required."});
 const current=(await db.query("SELECT id,capacity FROM buses WHERE id=$1 AND operator_id=$2",[id,op.id])).rows[0];
 if(!current)return res.status(404).json({error:"Bus not found in your operator account."});
 if(status==="active"||status==="inactive"){
  if(status==="active") {
   const schedules=await db.query("SELECT count(*) AS n FROM schedules WHERE bus_id=$1 AND status='scheduled' AND departure_at>now()",[id]);
   // Reactivation is allowed; public availability still depends on operator and schedule approval.
  }
  const updated=await db.query("UPDATE buses SET status=$1 WHERE id=$2 AND operator_id=$3 RETURNING id,name,registration_no,bus_type,capacity,status",[status,id,op.id]);
  return res.json({bus:updated.rows[0],message:"Bus "+status+"."});
 }
 if(name.length<2||reg.length<3||!Number.isInteger(capacity)||capacity<4||capacity>80)return res.status(400).json({error:"Enter a bus name, registration number and capacity between 4 and 80."});
 if(capacity!==Number(current.capacity)){
  // Capacity changes are allowed only before any schedule exists; discard old seat coordinates.
  delete layoutConfig.seats;
  try{
   await db.transaction([
    {sql:"UPDATE buses SET name=$1,registration_no=$2,bus_type=$3,capacity=$4,amenities=$7,seat_layout_config=$8 WHERE id=$5 AND operator_id=$6 AND NOT EXISTS (SELECT 1 FROM schedules WHERE bus_id=$5) RETURNING id",params:[name,reg,type,capacity,id,op.id,amenities,layoutConfig]},
    {sql:"SELECT CASE WHEN (SELECT capacity FROM buses WHERE id=$1 AND operator_id=$2) <> $3 THEN 1/0 ELSE 1 END",params:[id,op.id,capacity]},
    {sql:"DELETE FROM bus_seats WHERE bus_id=$1",params:[id]},
    {sql:"INSERT INTO bus_seats (bus_id,seat_number,seat_type) SELECT $1,'S'||n,$3 FROM generate_series(1,$2) n",params:[id,capacity,seatType]}
   ]);
  }catch(e){return res.status(409).json({error:"Seat capacity cannot be changed after a schedule has been created, or the registration number is already in use. Add a new bus with the correct layout instead."});}
  const updated=await db.query("SELECT id,name,registration_no,bus_type,capacity,status,amenities,seat_layout_config FROM buses WHERE id=$1 AND operator_id=$2",[id,op.id]);
  return res.json({bus:updated.rows[0],message:"Bus details and seat layout updated."});
 }
 const updated=await db.query("UPDATE buses SET name=$1,registration_no=$2,bus_type=$3,capacity=$4,amenities=$7,seat_layout_config=$8 WHERE id=$5 AND operator_id=$6 RETURNING id,name,registration_no,bus_type,capacity,status,amenities,seat_layout_config",[name,reg,type,capacity,id,op.id,amenities,layoutConfig]);
 return res.json({bus:updated.rows[0],message:"Bus details updated."});
}