import { db, config } from "hatchable";
export const access = "user";
export const methods = ["POST"];
const SITE = "https://yatrio-nepal-bus.hatchable.site";
const ESEWA_URL = "https://epay.esewa.com.np/api/epay/main/v2/form";
const KHALTI_URL = "https://khalti.com/api/v2";
const enc = new TextEncoder();
async function hmacBase64(secret,message) {
  const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",key,enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
function qr(url){return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data="+encodeURIComponent(url)}
export default async function(req,res) {
  const bookingId=String(req.body?.booking_id||"");
  const provider=String(req.body?.provider||"khalti").toLowerCase();
  if(!/^[0-9a-f-]{36}$/i.test(bookingId)) return res.status(400).json({error:"A valid bus booking ID is required."});
  if(!["khalti","esewa","fonepay"].includes(provider)) return res.status(400).json({error:"Unsupported payment provider."});
  const userId=String(req.user.id);
  const found=await db.query("SELECT id,pnr,total_amount,currency,status,customer_user_id,hold_expires_at,passenger_name,passenger_email,passenger_phone FROM bookings b WHERE b.id=$1 AND b.customer_user_id=$2 AND (SELECT count(*) FROM seat_inventory si WHERE si.booking_id=b.id AND si.status='held' AND si.hold_expires_at>now())=cardinality(b.seat_numbers)",[bookingId,userId]);
  if(!found.rows.length) return res.status(404).json({error:"Bus reservation not found or its seat hold is no longer valid."});
  const booking=found.rows[0];
  if(booking.status!=="awaiting_payment"||!booking.hold_expires_at||new Date(booking.hold_expires_at).getTime()<=Date.now()) return res.status(409).json({error:"The reservation is no longer awaiting payment. Please select your seats again."});
  const amount=Number(booking.total_amount),amountPaisa=Math.round(amount*100);
  if(!Number.isFinite(amount)||amount<10||Math.abs(amountPaisa/100-amount)>0.001) return res.status(400).json({error:"Wallet checkout requires an exact NPR amount of at least NPR 10."});
  let configValues={};
  if(provider==="khalti") configValues.secret=await config.get("KHALTI_LIVE_SECRET_KEY");
  if(provider==="esewa") {configValues.secret=await config.get("ESEWA_SECRET_KEY");configValues.product=await config.get("ESEWA_PRODUCT_CODE");}
  if(provider==="fonepay") {configValues.secret=await config.get("FONEPAY_SECRET_KEY");configValues.merchant=await config.get("FONEPAY_MERCHANT_CODE");configValues.username=await config.get("FONEPAY_USERNAME");configValues.password=await config.get("FONEPAY_PASSWORD");}
  if(provider==="fonepay"&&(!configValues.secret||!configValues.merchant||!configValues.username||!configValues.password)) return res.status(503).json({error:"Fonepay Dynamic QR is implemented, but YATRIO still needs its live merchant code, HMAC secret, API username and API password from Fonepay. No payment was initiated."});
  if(provider==="khalti"&&!configValues.secret) return res.status(503).json({error:"Khalti production credentials are not configured. No payment was initiated."});
  if(provider==="esewa"&&(!configValues.secret||!configValues.product)) return res.status(503).json({error:"eSewa production merchant product code and signing secret are not configured. No payment was initiated."});
  await db.query("UPDATE payment_transactions SET status='failed',failure_reason='Previous checkout attempt expired',updated_at=now() WHERE booking_type='bus' AND booking_id=$1 AND user_id=$2 AND provider=$3 AND status IN ('initiated','pending') AND (expires_at<=now() OR created_at<now()-interval '30 minutes')",[bookingId,userId,provider]);
  const existing=await db.query("SELECT id,checkout_url,status,expires_at,provider_payload FROM payment_transactions WHERE booking_type='bus' AND booking_id=$1 AND user_id=$2 AND provider=$3 AND status IN ('initiated','pending') AND expires_at>now() ORDER BY created_at DESC LIMIT 1",[bookingId,userId,provider]);
  if(existing.rows.length&&existing.rows[0].checkout_url&&provider==="khalti") return res.json({payment_id:existing.rows[0].id,payment_url:existing.rows[0].checkout_url,qr_url:qr(existing.rows[0].checkout_url),amount,currency:"NPR",status:existing.rows[0].status,reused:true,provider,mode:"production"});
  if(existing.rows.length&&provider==="fonepay"&&existing.rows[0].provider_payload?.qr_message) return res.json({payment_id:existing.rows[0].id,provider,mode:"production",amount,currency:"NPR",status:existing.rows[0].status,prn:existing.rows[0].provider_payment_id,qr_message:existing.rows[0].provider_payload.qr_message,qr_url:qr(existing.rows[0].provider_payload.qr_message),expires_at:existing.rows[0].expires_at,reused:true});
  const orderId="YTRIO-BUS-"+crypto.randomUUID().replace(/-/g,"").slice(0,18).toUpperCase();
  const inserted=await db.query("INSERT INTO payment_transactions (booking_type,booking_id,booking_ref,user_id,provider,mode,amount,amount_paisa,currency,purchase_order_id,status) VALUES ('bus',$1,$2,$3,$4,'production',$5,$6,'NPR',$7,'initiated') RETURNING id",[booking.id,booking.pnr,userId,provider,amount,amountPaisa,orderId]);
  const paymentId=inserted.rows[0].id;
  try {
    if(provider==="khalti") {
      const response=await fetch(KHALTI_URL+"/epayment/initiate/",{method:"POST",headers:{"Authorization":"Key "+configValues.secret,"Content-Type":"application/json"},body:JSON.stringify({return_url:SITE+"/api/bus-payment-callback?provider=khalti",website_url:SITE,amount:amountPaisa,purchase_order_id:orderId,purchase_order_name:"YATRIO bus "+booking.pnr,customer_info:{name:booking.passenger_name,email:booking.passenger_email||"",phone:booking.passenger_phone}})});
      const data=await response.json();
      if(!response.ok||!data.pidx||!data.payment_url) throw new Error(String(data.detail||data.error_key||"Khalti initiation failed"));
      const expiry=data.expires_at?new Date(data.expires_at):new Date(Date.now()+30*60*1000);
      await db.transaction([
        {sql:"UPDATE payment_transactions SET provider_payment_id=$1,checkout_url=$2,expires_at=$3,status='pending',provider_payload=$4::jsonb,updated_at=now() WHERE id=$5",params:[data.pidx,data.payment_url,expiry.toISOString(),JSON.stringify({expires_in:data.expires_in||null}),paymentId]},
        {sql:"UPDATE bookings SET payment_mode='khalti',hold_expires_at=$1 WHERE id=$2 AND customer_user_id=$3 AND status='awaiting_payment'",params:[expiry.toISOString(),bookingId,userId]},
        {sql:"UPDATE seat_inventory SET hold_expires_at=$1 WHERE booking_id=$2 AND status='held'",params:[expiry.toISOString(),bookingId]}
      ]);
      return res.status(201).json({payment_id:paymentId,payment_url:data.payment_url,qr_url:qr(data.payment_url),amount,currency:"NPR",status:"pending",provider,mode:"production",expires_at:expiry.toISOString()});
    }
    if(provider==="esewa") {
      const transactionUuid=orderId;
      const fields={amount:amount.toFixed(2),tax_amount:"0",total_amount:amount.toFixed(2),transaction_uuid:transactionUuid,product_code:String(configValues.product),product_service_charge:"0",product_delivery_charge:"0",success_url:SITE+"/api/bus-payment-callback?provider=esewa",failure_url:SITE+"/api/bus-payment-callback?provider=esewa&failed=1&transaction_uuid="+encodeURIComponent(transactionUuid),signed_field_names:"total_amount,transaction_uuid,product_code"};
      fields.signature=await hmacBase64(configValues.secret,"total_amount="+fields.total_amount+",transaction_uuid="+transactionUuid+",product_code="+fields.product_code);
      await db.transaction([
        {sql:"UPDATE payment_transactions SET provider_payment_id=$1,checkout_url=$2,expires_at=now()+interval '20 minutes',status='pending',provider_payload=$3::jsonb,updated_at=now() WHERE id=$4",params:[transactionUuid,ESEWA_URL,JSON.stringify({product_code:fields.product_code}),paymentId]},
        {sql:"UPDATE bookings SET payment_mode='esewa',hold_expires_at=now()+interval '20 minutes' WHERE id=$1 AND customer_user_id=$2 AND status='awaiting_payment'",params:[bookingId,userId]},
        {sql:"UPDATE seat_inventory SET hold_expires_at=now()+interval '20 minutes' WHERE booking_id=$1 AND status='held'",params:[bookingId]}
      ]);
      return res.status(201).json({payment_id:paymentId,provider,mode:"production",amount,currency:"NPR",status:"pending",form_url:ESEWA_URL,form_fields:fields,transaction_uuid:transactionUuid,message:"Continue to eSewa secure payment. YATRIO confirms the ticket only after signed response and server-side status verification."});
    }
    if(provider==="fonepay") {
      const prn="YTR"+crypto.randomUUID().replace(/-/g,"").slice(0,22).toUpperCase();
      const remarks1="YATRIOBUS";
      const remarks2=String(booking.pnr||"BUSBOOKING").replace(/[^A-Za-z0-9]/g,"").slice(0,25)||"BUSBOOKING";
      const message=[amount.toFixed(2),prn,String(configValues.merchant),remarks1,remarks2].join(",");
      const key=await crypto.subtle.importKey("raw",enc.encode(configValues.secret),{name:"HMAC",hash:"SHA-512"},false,["sign"]);
      const signed=await crypto.subtle.sign("HMAC",key,enc.encode(message));
      const dataValidation=Array.from(new Uint8Array(signed),b=>b.toString(16).padStart(2,"0")).join("");
      const endpoint="https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload";
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({amount:amount.toFixed(2),remarks1,remarks2,prn,merchantCode:String(configValues.merchant),dataValidation,username:String(configValues.username),password:String(configValues.password)})});
      const data=await response.json();
      if(!response.ok||data.success!==true||data.status!=="CREATED"||!data.qrMessage) throw new Error(String(data.message||data.errorCode||"Fonepay did not create the dynamic QR"));
      const expiry=new Date(Date.now()+15*60*1000);
      await db.transaction([
        {sql:"UPDATE payment_transactions SET provider_payment_id=$1,expires_at=$2,status='pending',provider_payload=$3::jsonb,updated_at=now() WHERE id=$4",params:[prn,expiry.toISOString(),JSON.stringify({qr_message:data.qrMessage,websocket_url:data.thirdpartyQrWebSocketUrl||null,merchant_code:String(configValues.merchant),amount}),paymentId]},
        {sql:"UPDATE bookings SET payment_mode='fonepay',hold_expires_at=$1 WHERE id=$2 AND customer_user_id=$3 AND status='awaiting_payment'",params:[expiry.toISOString(),bookingId,userId]},
        {sql:"UPDATE seat_inventory SET hold_expires_at=$1 WHERE booking_id=$2 AND status='held'",params:[expiry.toISOString(),bookingId]}
      ]);
      return res.status(201).json({payment_id:paymentId,provider,mode:"production",amount,currency:"NPR",status:"pending",prn,qr_message:data.qrMessage,qr_url:qr(data.qrMessage),expires_at:expiry.toISOString(),message:"Scan this one-time Fonepay QR using a supported Nepali bank or wallet app. YATRIO confirms payment only after server-to-server status verification."});
    }
    return res.status(400).json({error:"Unsupported payment provider."});
  } catch(e) {
    await db.query("UPDATE payment_transactions SET status='failed',failure_reason=$1,updated_at=now() WHERE id=$2",[String(e.message||"Provider initiation failed").slice(0,500),paymentId]);
    return res.status(502).json({error:"The wallet could not start checkout. No payment was confirmed. Please retry."});
  }
}