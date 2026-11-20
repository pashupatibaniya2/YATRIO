const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const labels={stays:"Hotel & stay",rides:"Local ride & transfer",experiences:"Tour & experience"};
const units={per_person:"per person",per_night:"per night",per_vehicle:"per vehicle",per_trip:"per trip",per_booking:"per booking"};
let current=null;
const requestedCategory=new URLSearchParams(location.search).get("category");
if(requestedCategory && ["stays","rides","experiences"].includes(requestedCategory)) document.querySelector("#filters [name=category]").value=requestedCategory;
const requestedCity=new URLSearchParams(location.search).get("city");
if(requestedCity) document.querySelector("#filters [name=city]").value=requestedCity;
async function load(){
 const f=new FormData(document.getElementById("filters"));
 const params=new URLSearchParams();for(const [k,v] of f.entries())if(v.trim())params.set(k,v.trim());
 const r=await fetch("/api/marketplace-listings?"+params.toString());const d=await r.json();
 const root=document.getElementById("listings");
 if(!r.ok)throw new Error(d.error||"Unable to load listings");
 document.getElementById("resultCount").textContent=d.count+" currently bookable partner listings";
 if(!d.listings.length){root.innerHTML='<div class="empty"><b>No bookable listings found yet.</b><br>Try another destination or check back as partners join YATRIO.</div>';return;}
 root.innerHTML=d.listings.map(x=>'<article class="card"><div class="photo">'+(x.category_slug==="stays"?"⌂":x.category_slug==="rides"?"🚙":"✦")+'</div><div class="body"><div class="meta">'+esc(labels[x.category_slug]||x.category_slug)+' · '+esc(x.city)+'</div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description||"A service from "+x.business_name)+'</p><div class="price">NPR '+Number(x.price_from).toLocaleString("en-IN")+' <small>/ '+esc(units[x.price_unit]||x.price_unit)+'</small></div><p style="min-height:0;margin:6px 0 0">Provided by '+esc(x.business_name)+'</p><button class="btn" onclick="openListing(\''+x.id+'\')">View availability</button></div></article>').join("");
}
async function openListing(id){
 const modal=document.getElementById("modal"),detail=document.getElementById("detail");modal.classList.add("open");detail.innerHTML="<p>Loading service details…</p>";
 const r=await fetch("/api/marketplace-listings?id="+encodeURIComponent(id));const d=await r.json();if(!r.ok){detail.innerHTML='<p class="status error">'+esc(d.error)+'</p>';return;}current=d.listing;
 detail.innerHTML='<div class="meta">'+esc(labels[current.category_slug])+' · '+esc(current.city)+'</div><h2>'+esc(current.title)+'</h2><p>'+esc(current.description)+'</p><p><b>'+esc(current.business_name)+'</b> · '+esc(current.address||current.city)+'</p><h3 style="font:700 16px Manrope">Choose an available date / time</h3><div class="slotlist">'+(d.availability.length?d.availability.map(s=>'<div class="slot"><span>'+new Date(s.starts_at).toLocaleString()+'<br><small>'+s.remaining+' remaining · NPR '+Number(s.price).toLocaleString("en-IN")+'</small></span><button onclick="showBooking(\''+s.id+'\','+Number(s.price)+','+Number(s.remaining)+')">Select</button></div>').join(""):'<p>No future availability is currently published.</p>')+'</div><div id="bookingForm"></div>';
}
function showBooking(slotId,price,remaining){
 document.getElementById("bookingForm").innerHTML='<h3 style="font:700 16px Manrope">Send booking request</h3><form id="bookForm" class="formgrid"><input type="hidden" name="availability_id" value="'+slotId+'"><div class="field"><label>Traveller name</label><input name="traveler_name" required minlength="2"></div><div class="field"><label>Phone</label><input name="traveler_phone" required minlength="7"></div><div class="field"><label>Email (optional)</label><input name="traveler_email" type="email"></div><div class="field"><label>Quantity (max '+Math.min(20,remaining)+')</label><input name="quantity" type="number" min="1" max="'+Math.min(20,remaining)+'" value="1" required></div><div class="field full"><label>Notes (optional)</label><textarea name="customer_note"></textarea></div><div class="field full"><button class="btn" type="submit">Request booking · NPR '+price.toLocaleString("en-IN")+' / unit</button><div id="bookStatus" class="status"></div></div></form>';
 document.getElementById("bookForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const payload=Object.fromEntries(f.entries());payload.listing_id=current.id;payload.quantity=Number(payload.quantity);const b=e.currentTarget.querySelector("button"),st=document.getElementById("bookStatus");b.disabled=true;b.textContent="Sending request…";try{const r=await fetch("/api/marketplace-bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const d=await r.json();if(r.status===401){location.href="/login.html?next="+encodeURIComponent("/explore.html");return;}if(!r.ok)throw new Error(d.error||"Booking request failed");st.textContent=d.message+" Reference: "+d.booking.booking_ref;e.currentTarget.reset();}catch(err){st.className="status error";st.textContent=err.message;}finally{b.disabled=false;b.textContent="Request booking · NPR "+price.toLocaleString("en-IN")+" / unit";}});
}
document.getElementById("filters").addEventListener("submit",e=>{e.preventDefault();load().catch(showError)});
document.getElementById("close").addEventListener("click",()=>document.getElementById("modal").classList.remove("open"));
document.getElementById("modal").addEventListener("click",e=>{if(e.target.id==="modal")e.currentTarget.classList.remove("open")});
function showError(e){document.getElementById("listings").innerHTML='<div class="empty">'+esc(e.message)+'</div>'}
load().catch(showError);