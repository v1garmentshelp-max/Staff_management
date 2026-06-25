import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'PUT') return err(res, 'Method not allowed', 405);

  const pool = getPool();
  const { key } = req.query;
  const { value } = req.body;

  try {
    await pool.query(`
      INSERT INTO settings (key,value) VALUES ($1,$2)
      ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()`,
      [key, String(value)]
    );
    return ok(res, { ok: true });
  } catch (e) { return err(res, e.message); }
}
