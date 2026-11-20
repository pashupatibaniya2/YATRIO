const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const labels={buses:"Intercity buses",stays:"Hotels & stays",rides:"Local rides",experiences:"Tours & experiences"};
async function load(){
 const r=await fetch("/api/marketplace-admin",{redirect:"manual"});
 if(r.status===401||r.type==="opaqueredirect"){location.href="https://hatchable.com/console/login";return;}
 if(r.status===403){document.getElementById("rows").innerHTML='<tr><td colspan="7" class="error">Admin access is required.</td></tr>';return;}
 const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load applications");
 const c={pending:0,approved:0,rejected:0,suspended:0};d.providers.forEach(p=>c[p.status]=(c[p.status]||0)+1);
 document.getElementById("stats").innerHTML=[["Applications",d.providers.length],["Pending",c.pending],["Approved",c.approved],["Rejected / suspended",c.rejected+c.suspended]].map(x=>'<div class="stat"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join("");
 document.getElementById("rows").innerHTML=d.providers.length?d.providers.map(p=>'<tr><td><b>'+esc(p.business_name)+'</b><br><span class="muted">'+esc(p.description)+'</span></td><td>'+esc(labels[p.category_slug]||p.category_slug)+'</td><td>'+esc(p.contact_name)+'<br>'+esc(p.phone)+'</td><td>'+esc(p.base_city)+'</td><td>'+esc(p.registration_number)+'</td><td><span class="pill '+esc(p.status)+'">'+esc(p.status)+'</span></td><td><div class="actions">'+(p.status==="pending"?'<button class="approve" onclick="review(\''+p.id+'\',\'approved\')">Approve</button><button class="reject" onclick="review(\''+p.id+'\',\'rejected\')">Reject</button>':'<button class="suspend" onclick="review(\''+p.id+'\',\'suspended\')">Suspend</button>')+'</div></td></tr>').join(""):'<tr><td colspan="7" class="empty">No partner applications yet.</td></tr>';
}
async function review(id,status){
 const note=prompt("Optional internal review note:")||"";
 const r=await fetch("/api/marketplace-admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider_id:id,status,admin_note:note})});
 const d=await r.json();if(!r.ok){alert(d.error||"Update failed");return;}document.getElementById("message").textContent=d.message;load();
}
load().catch(e=>document.getElementById("rows").innerHTML='<tr><td colspan="7" class="error">'+esc(e.message)+'</td></tr>');