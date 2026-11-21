import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET","POST","PATCH"];

const stages = new Set(["new","contacted","interested","application_started","converted","not_interested"]);
const clean = (v,max=240) => String(v??"").trim().slice(0,max);

export default async function(req,res) {
  if(req.method==="GET") {
    const [districts,leads,campaigns,operators,leadCount] = await Promise.all([
      db.query(`SELECT t.province,t.district,t.target_count,
        count(l.id)::int AS leads,
        count(l.id) FILTER (WHERE l.status='contacted')::int AS contacted,
        count(l.id) FILTER (WHERE l.status='interested')::int AS interested,
        count(l.id) FILTER (WHERE l.status='application_started')::int AS application_started,
        count(l.id) FILTER (WHERE l.status='converted')::int AS converted,
        count(l.id) FILTER (WHERE l.status='not_interested')::int AS not_interested
        FROM operator_acquisition_targets t
        LEFT JOIN operator_acquisition_leads l ON l.province=t.province AND l.district=t.district
        GROUP BY t.province,t.district,t.target_count
        ORDER BY CASE t.province WHEN 'Sudurpashchim' THEN 1 WHEN 'Karnali' THEN 2 WHEN 'Lumbini' THEN 3 WHEN 'Gandaki' THEN 4 WHEN 'Bagmati' THEN 5 WHEN 'Madhesh' THEN 6 ELSE 7 END,t.district`),
      db.query(`SELECT id,business_name,contact_name,phone,email,province,district,status,source,campaign,notes,next_follow_up_at,created_at
        FROM operator_acquisition_leads ORDER BY
        CASE status WHEN 'new' THEN 1 WHEN 'contacted' THEN 2 WHEN 'interested' THEN 3 WHEN 'application_started' THEN 4 WHEN 'converted' THEN 5 ELSE 6 END,
        next_follow_up_at NULLS LAST,created_at DESC LIMIT 150`),
      db.query(`SELECT campaign,count(*)::int AS clicks,count(DISTINCT referral_code)::int AS referral_codes,
        count(DISTINCT referral_code || ':' || visitor_key)::int AS unique_visits
        FROM operator_referral_click_events GROUP BY campaign ORDER BY count(*) DESC,campaign ASC`),
      db.query("SELECT count(*)::int AS approved FROM operators WHERE owner_user_id IS NOT NULL AND status='approved'"),
      db.query("SELECT count(*)::int AS total FROM operator_acquisition_leads")
    ]);
    const totalLeads=leads.rows.length;
    const byProvince={};
    for(const d of districts.rows) {
      if(!byProvince[d.province]) byProvince[d.province]={province:d.province,districts:0,target:0,leads:0,contacted:0,interested:0,application_started:0,converted:0};
      const p=byProvince[d.province];p.districts++;p.target+=Number(d.target_count||0);p.leads+=Number(d.leads||0);p.contacted+=Number(d.contacted||0);p.interested+=Number(d.interested||0);p.application_started+=Number(d.application_started||0);p.converted+=Number(d.converted||0);
    }
    return res.json({
      summary:{districts:districts.rows.length,target:districts.rows.reduce((n,x)=>n+Number(x.target_count||0),0),leads:Number(leadCount.rows[0]?.total||0),new:leads.rows.filter(x=>x.status==="new").length,contacted:leads.rows.filter(x=>x.status==="contacted").length,interested:leads.rows.filter(x=>x.status==="interested").length,application_started:leads.rows.filter(x=>x.status==="application_started").length,converted:leads.rows.filter(x=>x.status==="converted").length,approved_operators:Number(operators.rows[0]?.approved||0)},
      provinces:Object.values(byProvince),districts:districts.rows,leads:leads.rows,campaigns:campaigns.rows
    });
  }

  const body=req.body||{},action=clean(body.action,40);
  if(action==="set_target") {
    const province=clean(body.province,80),district=clean(body.district,100),target=Number(body.target_count);
    if(!province||!district||!Number.isInteger(target)||target<0||target>5000) return res.status(400).json({error:"Choose a valid district and a whole-number target from 0 to 5,000."});
    const result=await db.query("UPDATE operator_acquisition_targets SET target_count=$1,updated_by=$2,updated_at=now() WHERE province=$3 AND district=$4 RETURNING province,district,target_count",[target,String(req.member?.id||"admin"),province,district]);
    if(!result.rows.length) return res.status(404).json({error:"District not found."});
    return res.json({target:result.rows[0]});
  }
  if(action==="create_lead") {
    const business=clean(body.business_name,180),contact=clean(body.contact_name,120),phone=clean(body.phone,40),email=clean(body.email,180),province=clean(body.province,80),district=clean(body.district,100),source=clean(body.source,80)||"manual",campaign=clean(body.campaign,100),notes=clean(body.notes,2000),follow=clean(body.next_follow_up_at,10);
    if(!business||!contact||!phone||!province||!district) return res.status(400).json({error:"Business, contact, phone, province and district are required."});
    if(!/^[+0-9() .-]{7,40}$/.test(phone)) return res.status(400).json({error:"Enter a valid contact phone number."});
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:"Enter a valid email address or leave it blank."});
    if(follow&&!/^\d{4}-\d{2}-\d{2}$/.test(follow)) return res.status(400).json({error:"Follow-up date must use YYYY-MM-DD."});
    const result=await db.query(`INSERT INTO operator_acquisition_leads
      (business_name,contact_name,phone,email,province,district,source,campaign,notes,next_follow_up_at,created_by)
      SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::date,$11
      WHERE EXISTS (SELECT 1 FROM operator_acquisition_targets WHERE province=$5 AND district=$6)
      RETURNING id,business_name,contact_name,phone,email,province,district,status,source,campaign,notes,next_follow_up_at,created_at`,
      [business,contact,phone,email,province,district,source,campaign,notes,follow||null,String(req.user.id)]);
    if(!result.rows.length) return res.status(400).json({error:"Select a district that belongs to the chosen province."});
    return res.status(201).json({lead:result.rows[0]});
  }
  if(action==="update_lead") {
    const leadId=clean(body.id,50),status=clean(body.status,40),notes=clean(body.notes,2000),follow=clean(body.next_follow_up_at,10);
    if(!/^[0-9a-f-]{36}$/i.test(leadId)||!stages.has(status)) return res.status(400).json({error:"Choose a valid lead and pipeline status."});
    if(follow&&!/^\d{4}-\d{2}-\d{2}$/.test(follow)) return res.status(400).json({error:"Follow-up date must use YYYY-MM-DD."});
    const result=await db.query("UPDATE operator_acquisition_leads SET status=$1,notes=$2,next_follow_up_at=$3::date,updated_at=now() WHERE id=$4 RETURNING id,business_name,status,notes,next_follow_up_at",[status,notes,follow||null,leadId]);
    if(!result.rows.length) return res.status(404).json({error:"Lead not found."});
    return res.json({lead:result.rows[0]});
  }
  return res.status(400).json({error:"Unknown acquisition action."});
}