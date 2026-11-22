import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST","PUT"];
async function operator(uid){
 return (await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 UNION SELECT o.id,o.status FROM operators o WHERE o.owner_user_id=$1 LIMIT 1",[uid])).rows[0];
}
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in."});
 const op=await operator(uid);
 if(!op)return res.status(404).json({error:"Operator account not found."});
 if(op.status!=="approved")return res.status(403).json({error:"Your operator account must be approved before managing drivers."});
 if(req.method==="GET"){
  const [drivers,schedules]=await Promise.all([
   db.query("SELECT id,full_name,phone,whatsapp_opt_in,driver_contact_consent,active,created_at FROM operator_drivers WHERE operator_id=$1 ORDER BY active DESC,full_name",[op.id]),
   db.query("SELECT s.id AS schedule_id,s.departure_at,s.arrival_at,b.name AS bus_name,r1.name AS origin,r2.name AS destination,d.id AS driver_id,d.full_name AS driver_name,a.share_driver_phone FROM schedules s JOIN buses b ON b.id=s.bus_id JOIN routes r ON r.id=s.route_id LEFT JOIN terminals r1 ON r1.id=r.origin_terminal_id LEFT JOIN terminals r2 ON r2.id=r.destination_terminal_id LEFT JOIN schedule_driver_assignments a ON a.schedule_id=s.id AND a.operator_id=$1 LEFT JOIN operator_drivers d ON d.id=a.driver_id WHERE b.operator_id=$1 AND s.departure_at>now()-interval '12 hours' AND s.departure_at<now()+interval '45 days' ORDER BY s.departure_at LIMIT 150",[op.id])
  ]);
  return res.json({drivers:drivers.rows,schedules:schedules.rows});
 }
 if(req.method==="POST"){
  const name=String(req.body?.full_name||"").trim().replace(/\s+/g," ");
  const phone=String(req.body?.phone||"").trim();
  const whatsapp=req.body?.whatsapp_opt_in===true;
  const consent=req.body?.driver_contact_consent===true;
  if(name.length<2||name.length>120||phone.length>30)return res.status(400).json({error:"Enter a driver name (2–120 characters) and a valid-length phone number."});
  if(whatsapp&&!/^\+[1-9]\d{7,14}$/.test(phone.replace(/[() .-]/g,"")))return res.status(400).json({error:"WhatsApp opt-in requires a valid international E.164 phone number."});
  if(consent&&!phone)return res.status(400).json({error:"A phone number is required before recording contact-sharing consent."});
  const row=await db.query("INSERT INTO operator_drivers(operator_id,user_id,full_name,phone,whatsapp_opt_in,driver_contact_consent) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,full_name,phone,whatsapp_opt_in,driver_contact_consent,active",[op.id,uid,name,phone,whatsapp,consent]);
  return res.status(201).json({driver:row.rows[0],message:"Driver profile saved. Passenger contact sharing remains off until you assign the driver and enable sharing."});
 }
 const scheduleId=String(req.body?.schedule_id||"");
 const driverId=String(req.body?.driver_id||"");
 const share=req.body?.share_driver_phone===true;
 if(!/^[0-9a-f-]{36}$/i.test(scheduleId))return res.status(400).json({error:"Choose a valid scheduled trip."});
 const schedule=await db.query("SELECT s.id FROM schedules s JOIN buses b ON b.id=s.bus_id WHERE s.id=$1 AND b.operator_id=$2 AND s.status='scheduled' AND s.departure_at>now()-interval '12 hours' AND s.departure_at<now()+interval '45 days'",[scheduleId,op.id]);
 if(!schedule.rows.length)return res.status(404).json({error:"Scheduled trip not found in your operator account."});
 if(!driverId){
  await db.query("DELETE FROM schedule_driver_assignments WHERE schedule_id=$1 AND operator_id=$2",[scheduleId,op.id]);
  return res.json({ok:true,message:"Driver assignment removed. Passenger driver details are no longer available."});
 }
 if(!/^[0-9a-f-]{36}$/i.test(driverId))return res.status(400).json({error:"Choose a valid driver."});
 const driver=await db.query("SELECT id,driver_contact_consent,phone FROM operator_drivers WHERE id=$1 AND operator_id=$2 AND active=true",[driverId,op.id]);
 if(!driver.rows.length)return res.status(404).json({error:"Active driver not found in your operator account."});
 if(share&&(!driver.rows[0].driver_contact_consent||!driver.rows[0].phone))return res.status(400).json({error:"The driver has not consented to sharing their phone number. Keep contact sharing off or update the driver's consent first."});
 await db.query("INSERT INTO schedule_driver_assignments(schedule_id,driver_id,operator_id,user_id,share_driver_phone) VALUES($1,$2,$3,$4,$5) ON CONFLICT(schedule_id) DO UPDATE SET driver_id=EXCLUDED.driver_id,operator_id=EXCLUDED.operator_id,user_id=EXCLUDED.user_id,share_driver_phone=EXCLUDED.share_driver_phone,updated_at=now()",[scheduleId,driverId,op.id,uid,share]);
 return res.json({ok:true,message:share?"Driver assigned; their phone number will be visible on the private passenger trip link with recorded consent.":"Driver assigned. Their phone number remains private to the operator."});
}