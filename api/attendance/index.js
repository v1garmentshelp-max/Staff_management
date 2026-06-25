import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const pool = getPool();
  const { staffId, date, status } = req.body;

  try {
    if (!status) {
      await pool.query(
        'DELETE FROM attendance WHERE staff_id=$1 AND date=$2',
        [staffId, date]
      );
    } else {
      await pool.query(`
        INSERT INTO attendance (staff_id, date, status)
        VALUES ($1,$2,$3)
        ON CONFLICT (staff_id, date) DO UPDATE SET status=$3, updated_at=NOW()`,
        [staffId, date, status]
      );
    }
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message); }
}
