import { db } from "hatchable";
export const access = "user";
export const methods = ["POST"];
export default async function(req,res) {
 const uid=String(req.user.id),name=String(req.body.name||"").trim(),reg=String(req.body.registration_no||"").trim().toUpperCase(),type=String(req.body.bus_type||"Deluxe");
 const capacity=Number(req.body.capacity||32);
 if(name.length<2||reg.length<3||!Number.isInteger(capacity)||capacity<4||capacity>80)return res.status(400).json({error:"Enter a bus name, registration number and capacity between 4 and 80."});
 const {rows}=await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 LIMIT 1",[uid]);
 if(!rows.length)return res.status(404).json({error:"Complete operator registration first."});
 if(rows[0].status!=="approved")return res.status(403).json({error:"Your operator account must be approved before adding buses."});
 const bus=await db.query("INSERT INTO buses (operator_id,name,registration_no,bus_type,capacity) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,registration_no,bus_type,capacity",[rows[0].id,name,reg,type,capacity]);
 await db.query("INSERT INTO bus_seats (bus_id,seat_number,seat_type) SELECT $1,'S'||n,'standard' FROM generate_series(1,$2) n",[bus.rows[0].id,capacity]);
 res.status(201).json({bus:bus.rows[0],message:"Bus created with "+capacity+" seats."});
}