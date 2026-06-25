import { getPool, camelStaff, handleOptions, ok, err, addAudit } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;

  const pool = getPool();

  // GET — all staff
  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM staff WHERE active=TRUE ORDER BY id'
      );
      return ok(res, rows.map(camelStaff));
    } catch (e) { return err(res, e.message); }
  }

  // POST — add staff
  if (req.method === 'POST') {
    const s = req.body;
    try {
      const { rows } = await pool.query(`
        INSERT INTO staff
          (id,name,designation,branch,aadhar,phone,alt_phone,dob,salary,
           fixed_cutting,advance,extra_advance,monthly_recovery,total_outstanding,total_savings)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        RETURNING *`,
        [s.id, s.name, s.designation||'', s.branch||'', s.aadhar||'',
         s.phone||'', s.altPhone||'', s.dob||'',
         s.salary||0, s.fixedCutting||0, s.advance||0,
         s.extraAdvance||0, s.monthlyRecovery||0,
         s.totalOutstanding||0, s.totalSavings||0]
      );
      await addAudit(pool, rows[0].id, 'ADD_STAFF', null, null, s.name);
      return ok(res, camelStaff(rows[0]), 201);
    } catch (e) { return err(res, e.message); }
  }

  return err(res, 'Method not allowed', 405);
}
