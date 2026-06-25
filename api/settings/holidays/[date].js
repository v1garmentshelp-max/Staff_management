import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'DELETE') return err(res, 'Method not allowed', 405);

  const pool = getPool();
  const { date } = req.query;
  try {
    await pool.query('DELETE FROM holidays WHERE date=$1', [date]);
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message); }
}
