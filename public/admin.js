const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const n=v=>Number(v||0).toLocaleString("en-IN");
const money=v=>"NPR "+n(v);
function bars(root,rows,order){const map=Object.fromEntries(rows.map(x=>[x.status,x.count]));const max=Math.max(1,...order.map(x=>map[x]||0));root.innerHTML=order.map(s=>'<div class="barrow"><span>'+esc(s.replaceAll("_"," "))+'</span><div class="track"><div class="fill" style="width:'+((map[s]||0)/max*100)+'%"></div></div><strong>'+n(map[s]||0)+'</strong></div>').join("")||'<div class="muted">No records yet.</div>';}
async function load(){
 const r=await fetch("/api/admin-overview");
 if(r.status===401){location.href="https://hatchable.com/console/login";return;}
 if(r.status===403){document.getElementById("metrics").innerHTML='<div class="error">Administrator access is required to view this dashboard.</div>';return;}
 const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load dashboard");
 const m=d.metrics;
 const cards=[
 ["Bus operators",m.operators_total,m.operators_approved+" approved"],
 ["Buses",m.buses_total,m.schedules_upcoming+" upcoming departures"],
 ["Bus bookings",m.bus_bookings_total,money(m.bus_booking_value)+" recorded value"],
 ["Travel partners",m.providers_total,m.listings_published+" published listings"],
 ["Marketplace bookings",m.marketplace_bookings_total,money(m.marketplace_booking_value)+" recorded value"],
 ["Total booking value",money(Number(m.bus_booking_value)+Number(m.marketplace_booking_value)),"Not equivalent to collected revenue"],
 ["Expected commission",money(m.expected_commission),"Ledger snapshot · not cash received"],
 ["Pending settlements",m.pending_settlements,"No payouts are currently processed"]
 ];
 document.getElementById("metrics").innerHTML=cards.map(x=>'<article class="metric"><label>'+x[0]+'</label><strong>'+x[1]+'</strong><small>'+x[2]+'</small></article>').join("");
 bars(document.getElementById("operatorBars"),d.operator_status,["pending","approved","rejected","suspended"]);
 bars(document.getElementById("providerBars"),d.provider_status,["pending","approved","rejected","suspended"]);
 document.getElementById("recent").innerHTML=d.recent_bookings.length?d.recent_bookings.map(b=>'<tr><td><b>'+esc(b.booking_ref)+'</b><br><span class="muted">'+esc(b.customer_name)+'</span></td><td>'+esc(b.category.replaceAll("_"," "))+'</td><td>'+esc(b.provider_name||"—")+'</td><td>'+money(b.total_amount)+'</td><td><span class="pill '+esc(b.status)+'">'+esc(b.status.replaceAll("_"," "))+'</span></td></tr>').join(""):'<tr><td colspan="5" class="empty">No bookings recorded yet.</td></tr>';
 document.getElementById("departures").innerHTML=d.upcoming_departures.length?d.upcoming_departures.map(s=>'<tr><td>'+new Date(s.departure_at).toLocaleString()+'</td><td><b>'+esc(s.origin)+' → '+esc(s.destination)+'</b></td><td>'+esc(s.operator_name)+'<br><span class="muted">'+esc(s.bus_name)+'</span></td><td>'+money(s.fare)+'</td><td><span class="pill '+esc(s.status)+'">'+esc(s.status)+'</span></td></tr>').join(""):'<tr><td colspan="5" class="empty">No upcoming departures.</td></tr>';
 document.getElementById("settlements").innerHTML=d.settlements.length?d.settlements.map(s=>'<div class="barrow"><span>'+esc(s.settlement_status.replaceAll("_"," "))+'</span><div class="track"><div class="fill" style="width:'+(s.count?100:0)+'%"></div></div><strong>'+n(s.count)+'</strong></div><div class="muted" style="font-size:11px;margin:-7px 0 4px 109px">Provider payout snapshot: '+money(s.payout_value)+'</div>').join(""):'<div class="muted">No commission ledger entries yet.</div>';
 const inv=[["Total bus bookings",m.bus_bookings_total],["Marketplace bookings",m.marketplace_bookings_total],["All listings",m.listings_total],["Published listings",m.listings_published],["All schedules",m.schedules_total],["Upcoming schedules",m.schedules_upcoming]];
 document.getElementById("inventory").innerHTML='<div class="barrow"><span>Inventory</span><div></div><strong>Records</strong></div>'+inv.map(x=>'<div class="barrow"><span>'+x[0]+'</span><div class="track"><div class="fill" style="width:'+(Number(x[1])?100:0)+'%"></div></div><strong>'+n(x[1])+'</strong></div>').join("");
 document.getElementById("updated").textContent="Last refreshed: "+new Date(d.generated_at).toLocaleString()+" · "+d.financial_note;
}
load().catch(e=>document.getElementById("metrics").innerHTML='<div class="error">'+esc(e.message)+'</div>');