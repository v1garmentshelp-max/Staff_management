import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const pool = getPool();
  const { staffId, month, amount } = req.body;

  try {
    await pool.query(`
      INSERT INTO savings_confirmations (staff_id, month, amount)
      VALUES ($1,$2,$3)
      ON CONFLICT (staff_id, month) DO NOTHING`,
      [staffId, month, amount]
    );
    await pool.query(`
      UPDATE staff SET
        total_savings=(SELECT COALESCE(SUM(amount),0) FROM savings_confirmations WHERE staff_id=$1),
        updated_at=NOW()
      WHERE id=$1`, [staffId]
    );
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message); }
}
