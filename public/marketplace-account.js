const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function load(){
 const r=await fetch("/api/travel-bookings");
 if(r.status===401){location.href="/login.html?next="+encodeURIComponent("/marketplace-account.html");return;}
 const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load bookings");
 const root=document.getElementById("bookings");
 if(!d.bookings.length){root.innerHTML='<div class="empty">You have no YATRIO bookings yet.<br><br><a href="/">Search buses</a> · <a href="/explore.html">Explore stays, rides and experiences</a></div>';return;}
 root.innerHTML=d.bookings.map(b=>{
  const bus=b.booking_type==="bus";
  const route=bus?esc(b.origin_city)+" → "+esc(b.destination_city):esc(b.origin_city);
  const when=b.departure_at?new Date(b.departure_at).toLocaleString():"";
  const seats=bus&&b.seat_numbers&&b.seat_numbers.length?'<p>Seats: '+b.seat_numbers.map(esc).join(", ")+'</p>':"";
  const detail=bus?"Passenger: "+esc(b.traveler_name):"Quantity: —";
  const paymentLabel=bus?(b.payment_status==="succeeded"?"Paid · Khalti verified":b.payment_status.replaceAll("_"," ")):b.payment_status;
  const pay=bus&&b.status==="awaiting_payment"&&b.payment_status!=="succeeded"?'<button class="btn" data-bus-pay="'+b.id+'">Pay bus fare · Khalti</button>':(!bus&&b.status==="provider_confirmed"&&b.payment_status!=="paid"?'<button class="btn" data-pay="'+b.id+'">Pay with Khalti (sandbox)</button>':"");
  const cancel=bus&&b.status==="awaiting_payment"?'<button class="btn" data-bus-cancel="'+esc(b.id)+'">Cancel reservation</button>':(bus&&b.status==="confirmed"&&b.payment_status==="succeeded"?'<button class="btn" data-bus-refund="'+esc(b.id)+'">View cancellation & refund</button>':(!bus&&b.status==="pending_provider_confirmation"?'<button class="btn" onclick="cancelBooking(\''+b.id+'\')">Cancel request</button>':""));
  return '<article class="card"><div class="head"><div><h2>'+esc(b.service_name)+' · '+esc(b.booking_ref)+'</h2><p>'+esc(b.provider_name)+' · '+route+' · '+(bus?"Intercity bus":"Marketplace")+'</p></div><span class="pill '+esc(b.status)+'">'+esc(b.status.replaceAll("_"," "))+'</span></div><p>'+when+' · '+detail+'</p>'+seats+'<p><b>'+esc(b.currency)+' '+Number(b.total_amount).toLocaleString("en-IN")+'</b> · Payment: '+esc(paymentLabel)+'</p><p>Contact: '+esc(b.traveler_phone)+'</p>'+cancel+pay+'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a class="btn" href="/booking-timeline.html?booking_type='+b.booking_type+'&booking_id='+encodeURIComponent(b.id)+'">View timeline</a><a class="btn" href="/communications.html?booking_type='+b.booking_type+'&booking_id='+encodeURIComponent(b.id)+'">Message provider</a><a class="btn" href="/support.html">Get help</a></div></article>';
 }).join("");
 root.querySelectorAll("[data-pay]").forEach(btn=>btn.addEventListener("click",()=>payBooking(btn.dataset.pay)));
 root.querySelectorAll("[data-bus-pay]").forEach(btn=>btn.addEventListener("click",()=>payBusBooking(btn.dataset.busPay)));
 root.querySelectorAll("[data-bus-cancel]").forEach(btn=>btn.addEventListener("click",()=>cancelBusBooking(btn.dataset.busCancel)));
 root.querySelectorAll("[data-bus-refund]").forEach(btn=>btn.addEventListener("click",()=>requestBusCancellation(btn.dataset.busRefund)));
}
async function cancelBusBooking(id){if(!confirm("Cancel this unpaid reservation and release the held seats?"))return;const r=await fetch("/api/bus-booking-cancel",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({booking_id:id})});const d=await r.json();if(!r.ok){alert(d.error||"Could not cancel reservation");return;}alert(d.message||"Reservation cancelled.");load();}
async function requestBusCancellation(id){
 try{
  const qres=await fetch("/api/bus-cancellation-requests?booking_id="+encodeURIComponent(id));
  const q=await qres.json();if(!qres.ok)throw new Error(q.error||"Could not calculate cancellation estimate");
  if(q.existing_request){alert("An active cancellation request already exists. Status: "+q.existing_request.status);return;}
  const x=q.quote,cur=q.booking.currency||"NPR";
  const summary="Departure: "+new Date(q.booking.departure_at).toLocaleString()+"\\nTime remaining: "+x.hours_before_departure+" hours\\nCancellation fee: "+x.fee_percent+"% ("+cur+" "+x.fee_amount.toFixed(2)+")\\nEstimated refund: "+x.refund_percent+"% ("+cur+" "+x.estimated_refund.toFixed(2)+")\\n\\nSubmit a cancellation request for review?";
  if(!confirm(summary))return;
  const reason=prompt("Please tell us why you are cancelling (minimum 5 characters):");if(reason===null)return;
  const r=await fetch("/api/bus-cancellation-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({booking_id:id,reason})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not submit cancellation request");
  alert(d.message+"\\nEstimated refund: "+cur+" "+Number(d.request.estimated_refund).toFixed(2));
  load();
 }catch(e){alert(e.message)}
}
async function payBusBooking(id){const r=await fetch("/api/bus-payment-initiate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({booking_id:id,provider:"khalti"})});const d=await r.json();if(!r.ok){alert(d.error||"Could not start bus fare payment");return;}if(d.payment_url){location.href=d.payment_url;return;}alert(d.message||"Payment is pending.");}
async function payBooking(id){if(!confirm("Continue to Khalti sandbox checkout? This is a test payment, not a live charge."))return;const r=await fetch("/api/payment-initiate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({booking_id:id})});const d=await r.json();if(!r.ok){alert(d.error||"Could not start payment");return;}if(d.payment_url){location.href=d.payment_url;return;}alert(d.message||"Payment is pending.");}
async function cancelBooking(id){if(!confirm("Cancel this pending booking request?"))return;const r=await fetch("/api/marketplace-booking-cancel",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({booking_id:id})});const d=await r.json();if(!r.ok){alert(d.error||"Cancellation failed");return;}load();}
load().catch(e=>document.getElementById("bookings").innerHTML='<div class="empty">'+esc(e.message)+'</div>');