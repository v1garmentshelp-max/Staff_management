import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const pool = getPool();
  const { date, name } = req.body;
  try {
    await pool.query(`
      INSERT INTO holidays (date,name) VALUES ($1,$2)
      ON CONFLICT (date) DO UPDATE SET name=$2`,
      [date, name || 'Custom Holiday']
    );
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message); }
}
