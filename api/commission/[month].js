import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;

  const pool = getPool();
  const { month, staffId } = req.query;

  // GET /api/commission/[month]
  if (req.method === 'GET') {
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

  // DELETE /api/commission/[month]?staffId=xxx
  if (req.method === 'DELETE') {
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
