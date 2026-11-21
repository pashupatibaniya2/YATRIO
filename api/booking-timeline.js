import { db } from "hatchable";
export const access="user";
export const methods=["GET"];
export default async function(req,res){
 const uid=String(req.user?.id||""),type=String(req.query.booking_type||""),id=String(req.query.booking_id||"");
 if(!["bus","marketplace"].includes(type)||!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"A valid booking is required."});
 let booking;
 if(type==="bus"){
  const q=await db.query("SELECT id,pnr AS booking_ref,status,created_at,total_amount,currency FROM bookings WHERE id=$1 AND customer_user_id=$2",[id,uid]);booking=q.rows[0];
 }else{
  const q=await db.query("SELECT id,booking_ref,status,payment_status,created_at,total_amount,currency FROM marketplace_bookings WHERE id=$1 AND user_id=$2",[id,uid]);booking=q.rows[0];
 }
 if(!booking)return res.status(404).json({error:"Booking not found."});
 const events=await db.query("SELECT id,event_type,title,detail,created_at FROM booking_timeline WHERE user_id=$1 AND booking_type=$2 AND booking_id=$3 ORDER BY created_at ASC",[uid,type,id]);
 const notifications=await db.query("SELECT id,event_type,title,message,created_at FROM booking_notifications WHERE user_id=$1 AND booking_type=$2 AND booking_id=$3 ORDER BY created_at ASC",[uid,type,id]);
 const merged=[...events.rows,...notifications.rows.map(x=>({id:x.id,event_type:x.event_type,title:x.title,detail:x.message,created_at:x.created_at}))];
 if(!merged.some(x=>x.event_type==="booking_created"))merged.push({id:"created",event_type:"booking_created",title:"Booking request created",detail:"Your booking record was created in YATRIO.",created_at:booking.created_at});
 return res.json({booking,timeline:merged.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at))});
}