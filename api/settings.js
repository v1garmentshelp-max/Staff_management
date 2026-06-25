import { getPool, handleOptions, ok, err } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;

  const pool = getPool();
  const urlPath = req.url.split('?')[0];
  const parts = urlPath.split('/').filter(Boolean);
  
  // parts: ["api", "settings", "holidays", "date"] or ["api", "settings", "key"]
  const sub = parts[2];
  const date = parts[3];

  if (req.method === 'GET') {
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

  if (req.method === 'PUT') {
    if (!sub) return err(res, 'Setting key required', 400);
    const { value } = req.body;
    try {
      await pool.query(`
        INSERT INTO settings (key,value) VALUES ($1,$2)
        ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()`,
        [sub, String(value)]
      );
      return ok(res, { ok: true });
    } catch (e) { return err(res, e.message); }
  }

  if (req.method === 'POST') {
    if (sub === 'holidays') {
      const { date: hDate, name } = req.body;
      try {
        await pool.query(`
          INSERT INTO holidays (date,name) VALUES ($1,$2)
          ON CONFLICT (date) DO UPDATE SET name=$2`,
          [hDate, name || 'Custom Holiday']
        );
        return ok(res, { ok: true });
      } catch (e) { return err(res, e.message); }
    }
  }

  if (req.method === 'DELETE') {
    if (sub === 'holidays' && date) {
      try {
        await pool.query('DELETE FROM holidays WHERE date=$1', [date]);
        return ok(res, { ok: true });
      } catch (e) { return err(res, e.message); }
    }
  }

  return err(res, 'Method not allowed', 405);
}
