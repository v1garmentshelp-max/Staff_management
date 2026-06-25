import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const { month } = req.query;

  // Special case: /api/attendance/months/list
  if (month === 'months') {
    const pool = getPool();
    try {
      const { rows } = await pool.query(
        "SELECT DISTINCT to_char(date,'YYYY-MM') AS month FROM attendance ORDER BY month DESC"
      );
      return ok(res, rows.map(r => r.month));
    } catch (e) { return err(res, e.message); }
  }

  const pool = getPool();
  try {
    const { rows } = await pool.query(
      "SELECT staff_id, to_char(date,'YYYY-MM-DD') AS date, status FROM attendance WHERE to_char(date,'YYYY-MM')=$1",
      [month]
    );
    const result = {};
    rows.forEach(r => {
      if (!result[r.staff_id]) result[r.staff_id] = {};
      result[r.staff_id][r.date] = r.status;
    });
    return ok(res, result);
  } catch (e) { return err(res, e.message); }
}
