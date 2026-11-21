import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","PUT"];
async function getOperator(uid){
 return (await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 LIMIT 1",[uid])).rows[0];
}
function defaultSeats(rows,capacity,busType){
 const perRow=/sofa|sleeper|berth/i.test(String(busType||""))?3:4;
 return rows.slice(0,capacity).map((s,i)=>({seat_number:s.seat_number,seat_type:s.seat_type||"standard",row:Math.floor(i/perRow)+1,col:i%perRow+1}));
}
function validateSeats(input,capacity){
 if(!Array.isArray(input)||input.length!==capacity)throw new Error("The seat map must contain exactly "+capacity+" seats.");
 const seenNames=new Set(),seenSlots=new Set();
 return input.map((s,i)=>{
  const seat_number=String(s?.seat_number||"").trim().toUpperCase();
  const row=Number(s?.row),col=Number(s?.col),seat_type=String(s?.seat_type||"standard");
  if(!/^[A-Z0-9-]{1,8}$/.test(seat_number))throw new Error("Seat numbers must be 1–8 letters, numbers or hyphens.");
  if(seenNames.has(seat_number))throw new Error("Duplicate seat number: "+seat_number+".");
  if(!Number.isInteger(row)||row<1||row>20||!Number.isInteger(col)||col<1||col>4)throw new Error("Seat positions must use rows 1–20 and columns 1–4.");
  if(!["standard","sofa","sleeper_berth"].includes(seat_type))throw new Error("Choose a valid seat type.");
  const slot=row+":"+col;if(seenSlots.has(slot))throw new Error("Two seats cannot occupy the same position (row "+row+", column "+col+").");
  seenNames.add(seat_number);seenSlots.add(slot);
  return {seat_number,seat_type,row,col};
 });
}
export default async function(req,res){
 const op=await getOperator(String(req.user.id));
 if(!op)return res.status(404).json({error:"Complete operator registration first."});
 if(op.status!=="approved")return res.status(403).json({error:"Your operator account must be approved and active."});
 const busId=String(req.method==="GET"?req.query.bus_id:req.body?.bus_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(busId))return res.status(400).json({error:"A valid bus_id is required."});
 const bus=(await db.query("SELECT id,capacity,bus_type,seat_layout_config FROM buses WHERE id=$1 AND operator_id=$2",[busId,op.id])).rows[0];
 if(!bus)return res.status(404).json({error:"Bus not found in your operator account."});
 const existing=(await db.query("SELECT seat_number,seat_type FROM bus_seats WHERE bus_id=$1 ORDER BY seat_number",[busId])).rows;
 if(req.method==="GET"){
  const configured=Array.isArray(bus.seat_layout_config?.seats)?bus.seat_layout_config.seats:null;
  const defaults=defaultSeats(existing,Number(bus.capacity),bus.bus_type);
  const map=new Map((configured||[]).map(s=>[String(s.seat_number),s]));
  const seats=defaults.map(s=>({...s,...(map.get(s.seat_number)||{})}));
  return res.json({bus:{id:bus.id,capacity:bus.capacity,bus_type:bus.bus_type,seat_layout_config:bus.seat_layout_config},seats,editable:(await db.query("SELECT NOT EXISTS(SELECT 1 FROM schedules WHERE bus_id=$1) AS editable",[busId])).rows[0].editable});
 }
 let seats;
 try{seats=validateSeats(req.body?.seats,Number(bus.capacity));}catch(e){return res.status(400).json({error:e.message});}
 const lock=(await db.query("SELECT NOT EXISTS(SELECT 1 FROM schedules WHERE bus_id=$1) AS editable",[busId])).rows[0];
 if(!lock.editable)return res.status(409).json({error:"This bus already has schedules. Its seat identities are locked to protect existing bookings and holds. Create a new bus to use a different seat map."});
 const config={...(bus.seat_layout_config||{}),seats};
 const ops=[
  {sql:"UPDATE buses SET seat_layout_config=$1::jsonb WHERE id=$2 AND operator_id=$3",params:[JSON.stringify(config),busId,op.id]},
  {sql:"DELETE FROM bus_seats WHERE bus_id=$1",params:[busId]},
  ...seats.map(s=>({sql:"INSERT INTO bus_seats (bus_id,seat_number,seat_type) VALUES ($1,$2,$3)",params:[busId,s.seat_number,s.seat_type]})),
  {sql:"SELECT CASE WHEN (SELECT count(*) FROM bus_seats WHERE bus_id=$1) <> $2 THEN 1/0 ELSE 1 END",params:[busId,bus.capacity]}
 ];
 await db.transaction(ops);
 return res.json({message:"Visual seat map saved. "+seats.length+" seats are ready for future schedules.",seats});
}