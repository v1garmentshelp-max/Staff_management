import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const pool = getPool();
  const { staffIds, date } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    for (const id of staffIds) {
      await client.query(`
        INSERT INTO attendance (staff_id, date, status)
        VALUES ($1,$2,'P')
        ON CONFLICT (staff_id, date) DO NOTHING`,
        [id, date]
      );
    }
    await client.query('COMMIT');
    return ok(res, { ok: true, marked: staffIds.length });
  } catch (e) {
    await client.query('ROLLBACK');
    return err(res, e.message);
  } finally { client.release(); }
}
