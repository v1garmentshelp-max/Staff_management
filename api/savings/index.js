import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const pool = getPool();
  try {
    const { rows } = await pool.query(`
      SELECT staff_id,
        COALESCE(json_agg(month ORDER BY month) FILTER (WHERE month IS NOT NULL),'[]') AS confirmed,
        COALESCE(SUM(amount),0) AS total
      FROM savings_confirmations GROUP BY staff_id
    `);
    const result = {};
    rows.forEach(r => {
      result[r.staff_id] = { confirmed: r.confirmed, total: Number(r.total) };
    });
    return ok(res, result);
  } catch (e) { return err(res, e.message); }
}
