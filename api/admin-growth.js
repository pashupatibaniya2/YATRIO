import { db } from "hatchable";
export const access = "admin";
export const methods = ["GET"];
export default async function(req,res) {
  const [summary, referrals, applications] = await Promise.all([
    db.query("SELECT count(*)::int AS total, count(*) FILTER (WHERE status='pending')::int AS pending, count(*) FILTER (WHERE status='approved')::int AS approved, count(*) FILTER (WHERE status='rejected')::int AS rejected, count(*) FILTER (WHERE status='suspended')::int AS suspended FROM operators WHERE owner_user_id IS NOT NULL"),
    db.query("SELECT c.code,o.id AS operator_id,o.name AS operator_name,count(DISTINCT a.id)::int AS referrals,count(DISTINCT a.id) FILTER (WHERE referred.status='approved')::int AS approved_referrals,count(DISTINCT a.id) FILTER (WHERE referred.status='pending')::int AS pending_referrals,count(DISTINCT clicks.id)::int AS clicks FROM operator_referral_codes c JOIN operators o ON o.id=c.operator_id LEFT JOIN operator_referral_attributions a ON a.referral_code=c.code LEFT JOIN operators referred ON referred.id=a.new_operator_id LEFT JOIN operator_referral_click_events clicks ON clicks.referral_code=c.code WHERE o.owner_user_id IS NOT NULL GROUP BY c.code,o.id,o.name ORDER BY count(DISTINCT clicks.id) DESC,count(DISTINCT a.id) DESC,o.name ASC"),
    db.query("SELECT o.id,o.name,o.contact_name,o.phone,o.status,o.created_at,(SELECT count(*) FROM operator_documents d WHERE d.operator_id=o.id AND d.review_status='approved')::int AS approved_documents,c.code AS referral_code FROM operators o LEFT JOIN operator_referral_attributions a ON a.new_operator_id=o.id LEFT JOIN operator_referral_codes c ON c.code=a.referral_code WHERE o.owner_user_id IS NOT NULL ORDER BY o.created_at DESC LIMIT 100")
  ]);
  const s=summary.rows[0]||{};
  return res.json({
    summary:{total:Number(s.total||0),pending:Number(s.pending||0),approved:Number(s.approved||0),rejected:Number(s.rejected||0),suspended:Number(s.suspended||0),referrals:referrals.rows.reduce((n,x)=>n+Number(x.referrals||0),0),referred_approvals:referrals.rows.reduce((n,x)=>n+Number(x.approved_referrals||0),0)},
    referrals:referrals.rows,
    applications:applications.rows
  });
}