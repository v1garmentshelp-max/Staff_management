import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const pool = getPool();
  try {
    const { rows: s } = await pool.query('SELECT key,value FROM settings');
    const { rows: h } = await pool.query(
      "SELECT to_char(date,'YYYY-MM-DD') AS date, name FROM holidays ORDER BY date"
    );
    const settings = {};
    s.forEach(r => { settings[r.key] = r.value; });
    return ok(res, { ...settings, holidays: h });
  } catch (e) { return err(res, e.message); }
}
