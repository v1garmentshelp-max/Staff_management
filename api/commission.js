import { getPool, handleOptions, ok, err } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;

  const pool = getPool();
  const urlPath = req.url.split('?')[0];
  const parts = urlPath.split('/').filter(Boolean);
  
  // parts: ["api", "commission", "month", "staffId"]
  const month = parts[2];
  const staffId = parts[3];

  if (req.method === 'GET') {
    if (!month) return err(res, 'Month required', 400);
    try {
      const { rows } = await pool.query(
        'SELECT * FROM commission_targets WHERE month=$1 ORDER BY created_at',
        [month]
      );
      return ok(res, rows.map(r => ({
        staffId: r.staff_id, month: r.month,
        target: Number(r.target), sales: Number(r.sales),
        rate: Number(r.rate), pool: Number(r.pool),
        empComm: Number(r.emp_comm), helpTotal: Number(r.help_total),
        perHelper: Number(r.per_helper), achievement: Number(r.achievement),
        helpers: r.helpers || [],
      })));
    } catch (e) { return err(res, e.message); }
  }

  if (req.method === 'POST') {
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

  if (req.method === 'DELETE') {
    if (!month || !staffId) return err(res, 'Month and Staff ID required', 400);
    try {
      await pool.query(
        'DELETE FROM commission_targets WHERE month=$1 AND staff_id=$2',
        [month, staffId]
      );
      return ok(res, { ok: true });
    } catch (e) { return err(res, e.message); }
  }

  return err(res, 'Method not allowed', 405);
}
