import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","PUT"];
async function owner(uid){return (await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 LIMIT 1",[uid])).rows[0]}
export default async function(req,res) {
 const op=await owner(String(req.user.id));
 if(!op)return res.status(404).json({error:"Complete operator registration first."});
 if(op.status!=="approved")return res.status(403).json({error:"Your operator account must be approved and active to manage buses."});
 if(req.method==="GET"){
  const rows=await db.query("SELECT b.id,b.name,b.registration_no,b.bus_type,b.capacity,b.status,(SELECT count(*) FROM bus_seats bs WHERE bs.bus_id=b.id) AS seat_count,(SELECT count(*) FROM schedules s WHERE s.bus_id=b.id) AS schedule_count FROM buses b WHERE b.operator_id=$1 ORDER BY b.name",[op.id]);
  return res.json({buses:rows.rows});
 }
 const name=String(req.body?.name||"").trim(),reg=String(req.body?.registration_no||"").trim().toUpperCase(),type=String(req.body?.bus_type||"Deluxe").trim().slice(0,60),capacity=Number(req.body?.capacity||32);
 if(req.method==="POST"){
  if(name.length<2||reg.length<3||!Number.isInteger(capacity)||capacity<4||capacity>80)return res.status(400).json({error:"Enter a bus name, registration number and capacity between 4 and 80."});
  const bus=await db.query("INSERT INTO buses (operator_id,name,registration_no,bus_type,capacity) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,registration_no,bus_type,capacity,status",[op.id,name,reg,type,capacity]);
  await db.query("INSERT INTO bus_seats (bus_id,seat_number,seat_type) SELECT $1,'S'||n,'standard' FROM generate_series(1,$2) n",[bus.rows[0].id,capacity]);
  return res.status(201).json({bus:bus.rows[0],message:"Bus created with "+capacity+" seats."});
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
  const used=await db.query("SELECT count(*) AS n FROM schedules WHERE bus_id=$1",[id]);
  if(Number(used.rows[0]?.n)>0)return res.status(409).json({error:"Seat capacity cannot be changed after schedules have been created. Add a new bus with the correct layout instead."});
  await db.query("DELETE FROM bus_seats WHERE bus_id=$1",[id]);
  await db.query("INSERT INTO bus_seats (bus_id,seat_number,seat_type) SELECT $1,'S'||n,'standard' FROM generate_series(1,$2) n",[id,capacity]);
 }
 const updated=await db.query("UPDATE buses SET name=$1,registration_no=$2,bus_type=$3,capacity=$4 WHERE id=$5 AND operator_id=$6 RETURNING id,name,registration_no,bus_type,capacity,status",[name,reg,type,capacity,id,op.id]);
 return res.json({bus:updated.rows[0],message:"Bus details updated."});
}