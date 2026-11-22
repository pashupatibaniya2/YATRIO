import { db, email, config } from "hatchable";
const SITE="https://yatrio-nepal-bus.hatchable.site";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=(v,c="NPR")=>c+" "+Number(v||0).toLocaleString("en-IN");
const messages={
 bus_request:{title:"Bus reservation created",subject:"Your YATRIO bus reservation needs payment",message:"Your seat reservation is on hold. Complete wallet payment before the hold expires; your ticket is not confirmed yet."},
 bus_paid:{title:"Bus ticket confirmed",subject:"Payment received — your YATRIO bus ticket is confirmed",message:"Your wallet payment has been verified and your bus booking is confirmed. Keep your booking reference handy when boarding."},
 bus_review:{title:"Payment received — booking under review",subject:"YATRIO received payment; booking needs review",message:"The wallet provider verified payment, but the seat hold could not be confirmed. YATRIO needs to review this booking; please do not travel until you receive confirmation."},
 marketplace_request:{title:"Booking request received",subject:"YATRIO received your travel booking request",message:"Your stay or experience request has been sent to the provider. It is not confirmed or paid until the provider and payment statuses are updated."},
 marketplace_confirmed:{title:"Provider confirmed your request",subject:"Your YATRIO provider confirmed the booking",message:"The provider accepted your booking request. Payment is still separate unless your booking record says paid."},
 marketplace_rejected:{title:"Booking request declined",subject:"Update on your YATRIO booking request",message:"The provider declined the request. Please choose another available stay or experience."},
 marketplace_cancelled:{title:"Booking request cancelled",subject:"Your YATRIO booking request was cancelled",message:"Your pending booking request was cancelled. No payment was collected for this request."},
 marketplace_paid:{title:"Marketplace payment confirmed",subject:"Payment received for your YATRIO booking",message:"Your payment was verified and the marketplace booking is marked paid. Keep this reference for your provider."},
 bus_cancelled:{title:"Bus reservation cancelled",subject:"Your YATRIO bus reservation was cancelled",message:"Your unpaid bus reservation was cancelled and its held seats were released."},
 bus_expired:{title:"Bus seat hold expired",subject:"Your YATRIO seat reservation expired",message:"The payment window for your bus seat hold expired. The seats have been released; please search again before starting a new reservation."}
};
function e164(v){
 const s=String(v||"").trim().replace(/[() .-]/g,"");
 return /^\+[1-9]\d{7,14}$/.test(s)?s:"";
}
async function tripLink(bookingType,bookingId){
 if(bookingType!=="bus")return "";
 const b=await db.query("SELECT schedule_id,customer_user_id FROM bookings WHERE id=$1",[bookingId]);
 if(!b.rows.length)return "";
 const token=crypto.randomUUID().replace(/-/g,"")+crypto.randomUUID().replace(/-/g,"");
 await db.query("INSERT INTO bus_trip_share_links(booking_id,schedule_id,user_id,token,expires_at) SELECT $1,$2,$3,$4,s.departure_at+interval '12 hours' FROM schedules s WHERE s.id=$2 ON CONFLICT(booking_id) DO UPDATE SET schedule_id=EXCLUDED.schedule_id,user_id=EXCLUDED.user_id,token=CASE WHEN bus_trip_share_links.expires_at>now() THEN bus_trip_share_links.token ELSE EXCLUDED.token END,expires_at=EXCLUDED.expires_at",[bookingId,b.rows[0].schedule_id,String(b.rows[0].customer_user_id||""),token]);
 const saved=await db.query("SELECT token FROM bus_trip_share_links WHERE booking_id=$1",[bookingId]);
 return saved.rows[0]?.token?SITE+"/bus-live.html?token="+encodeURIComponent(saved.rows[0].token):"";
}
async function sendWhatsApp({notificationId,userId,phone,name,template,bookingRef,service,amount,currency,when,details,shareUrl}){
 const profile=await db.query("SELECT phone,notification_preferences FROM traveller_profiles WHERE user_id=$1",[String(userId)]);
 const prefs=profile.rows[0]?.notification_preferences||{};
 if(prefs.whatsapp_updates!==true){
  await db.query("UPDATE booking_notifications SET whatsapp_status='skipped',whatsapp_error='Traveller has not opted in to WhatsApp booking updates' WHERE id=$1",[notificationId]);
  return {sent:false,reason:"not_opted_in"};
 }
 const recipient=e164(phone||profile.rows[0]?.phone);
 if(!recipient){
  await db.query("UPDATE booking_notifications SET whatsapp_status='skipped',whatsapp_error='A valid E.164 WhatsApp number is required' WHERE id=$1",[notificationId]);
  return {sent:false,reason:"invalid_phone"};
 }
 const [token,phoneId,version,templateName,language]=await Promise.all([
  config.get("WHATSAPP_ACCESS_TOKEN"),config.get("WHATSAPP_PHONE_NUMBER_ID"),config.get("WHATSAPP_GRAPH_API_VERSION"),config.get("WHATSAPP_BOOKING_TEMPLATE_NAME"),config.get("WHATSAPP_TEMPLATE_LANGUAGE")
 ]);
 if(!token||!phoneId||!templateName||!version){
  await db.query("UPDATE booking_notifications SET recipient_whatsapp=$1,whatsapp_status='not_configured',whatsapp_error='WhatsApp Cloud API credentials or approved template are not configured' WHERE id=$2",[recipient,notificationId]);
  return {sent:false,reason:"not_configured"};
 }
 const params=[name||"traveller",template.title,bookingRef,service||"YATRIO journey",when||"To be confirmed",money(amount,currency),details||template.message,shareUrl||SITE+"/marketplace-account.html"];
 try{
  const response=await fetch("https://graph.facebook.com/"+String(version).replace(/^\/?/,"")+"/"+encodeURIComponent(phoneId)+"/messages",{
   method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
   body:JSON.stringify({messaging_product:"whatsapp",recipient_type:"individual",to:recipient,type:"template",template:{name:templateName,language:{code:language||"en"},components:[{type:"body",parameters:params.map(text=>({type:"text",text:String(text).slice(0,1024)}))}]}})
  });
  const data=await response.json();
  if(!response.ok||!data.messages?.[0]?.id)throw new Error(String(data.error?.message||"WhatsApp provider did not accept the message").slice(0,450));
  await db.query("UPDATE booking_notifications SET recipient_whatsapp=$1,whatsapp_status='sent',whatsapp_message_id=$2,whatsapp_error=NULL,whatsapp_sent_at=now() WHERE id=$3",[recipient,String(data.messages[0].id).slice(0,500),notificationId]);
  return {sent:true};
 }catch(e){
  await db.query("UPDATE booking_notifications SET recipient_whatsapp=$1,whatsapp_status='failed',whatsapp_error=$2 WHERE id=$3",[recipient,String(e?.message||"WhatsApp delivery failed").slice(0,500),notificationId]);
  console.error("YATRIO WhatsApp delivery failed",String(e?.message||"").slice(0,160));
  return {sent:false,reason:"provider_error"};
 }
}
export async function notifyBooking({userId,bookingType,bookingId,bookingRef,eventType,to,name,service,amount,currency="NPR",when,details="",phone=""}){
 if(!userId||!bookingId||!bookingRef||!messages[eventType])return {sent:false,reason:"missing_context"};
 const template=messages[eventType];
 const context=await db.query("SELECT recipient_email,booking_updates FROM get_booking_notification_context($1,$2,$3)",[String(userId),bookingType,bookingId]);
 const enabled=context.rows[0]?.booking_updates!==false;
 const recipient=String(to||context.rows[0]?.recipient_email||"").trim().slice(0,254);
 const inserted=await db.query("SELECT record_booking_notification($1,$2,$3,$4,$5,$6,$7,$8,$9) AS id",[String(userId),bookingType,bookingId,bookingRef,eventType,template.title,template.message,recipient,enabled&&recipient?"not_attempted":"skipped"]);
 const notificationId=inserted.rows[0]?.id;
 if(!notificationId)return {sent:false,reason:"already_recorded"};
 const shareUrl=await tripLink(bookingType,bookingId);
 const safeName=esc(name||"traveller"),safeService=esc(service||"YATRIO journey"),safeRef=esc(bookingRef),safeWhen=esc(when||"Not provided"),safeDetails=esc(details),safeAmount=esc(money(amount,currency));
 const html='<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#183247"><div style="background:#102a43;color:#fff;padding:22px 26px;border-radius:14px 14px 0 0"><div style="font-weight:800;letter-spacing:2px;color:#9ce3d8">YATRIO</div><h1 style="font-size:23px;margin:12px 0 0">'+esc(template.title)+'</h1></div><div style="border:1px solid #e1eaf0;border-top:0;padding:24px;border-radius:0 0 14px 14px"><p>Hello '+safeName+',</p><p>'+esc(template.message)+'</p><table style="width:100%;border-collapse:collapse"><tr><td style="padding:9px;border-bottom:1px solid #e7eef2;color:#718096">Reference</td><td style="padding:9px;border-bottom:1px solid #e7eef2;font-weight:bold">'+safeRef+'</td></tr><tr><td style="padding:9px;border-bottom:1px solid #e7eef2;color:#718096">Journey / service</td><td style="padding:9px;border-bottom:1px solid #e7eef2">'+safeService+'</td></tr><tr><td style="padding:9px;border-bottom:1px solid #e7eef2;color:#718096">Amount</td><td style="padding:9px;border-bottom:1px solid #e7eef2">'+safeAmount+'</td></tr><tr><td style="padding:9px;border-bottom:1px solid #e7eef2;color:#718096">Date / time</td><td style="padding:9px;border-bottom:1px solid #e7eef2">'+safeWhen+'</td></tr></table>'+(safeDetails?'<p>'+safeDetails+'</p>':'')+(shareUrl?'<p><a href="'+shareUrl+'">Open secure bus trip location</a></p>':'')+'<p style="margin-top:22px"><a href="'+SITE+'/traveller-documents.html" style="background:#18a999;color:white;text-decoration:none;padding:11px 16px;border-radius:8px;font-weight:bold">View travel documents</a></p><p style="font-size:11px;color:#718096">This is a transactional booking update. Always check your YATRIO account for the latest booking and payment status.</p></div></div>';
 const textBody="Hello "+(name||"traveller")+",\n\n"+template.message+"\nReference: "+bookingRef+"\nJourney/service: "+(service||"YATRIO journey")+"\nAmount: "+money(amount,currency)+"\nDate/time: "+(when||"Not provided")+"\n"+(shareUrl?"Secure trip location: "+shareUrl+"\n":"")+"\nTravel documents: "+SITE+"/traveller-documents.html\n\nCheck your YATRIO account for the latest status.";
 if(enabled&&recipient){
  try{
   const result=await email.send({to:recipient,subject:template.subject+" · "+bookingRef,html,text:textBody});
   if(!result?.success)throw new Error("Email provider did not confirm delivery acceptance.");
   await db.query("SELECT update_booking_notification_email($1,'sent',$2,NULL)",[notificationId,String(result?.message_id||result?.ses_message_id||"").slice(0,500)]);
  }catch(e){
   await db.query("SELECT update_booking_notification_email($1,'failed',NULL,$2)",[notificationId,String(e?.message||"Email delivery failed").slice(0,500)]);
   console.error("YATRIO booking email failed",String(e?.message||"").slice(0,180));
  }
 }
 try{await sendWhatsApp({notificationId,userId,phone,name,template,bookingRef,service,amount,currency,when,details,shareUrl});}catch(e){console.error("WhatsApp booking notification could not be recorded.");}
 return {recorded:true,whatsapp:"attempted"};
}