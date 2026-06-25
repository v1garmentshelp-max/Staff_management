import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const pool = getPool();
  const d = req.body;
  try {
    await pool.query(`
      INSERT INTO commission_targets
        (staff_id,month,target,sales,rate,pool,emp_comm,help_total,per_helper,achievement,helpers)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (staff_id,month) DO UPDATE SET
        target=$3,sales=$4,rate=$5,pool=$6,emp_comm=$7,help_total=$8,
        per_helper=$9,achievement=$10,helpers=$11,updated_at=NOW()`,
      [d.staffId, d.month, d.target, d.sales, d.rate, d.pool,
       d.empComm, d.helpTotal, d.perHelper, d.achievement, d.helpers || []]
    );
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message); }
}
