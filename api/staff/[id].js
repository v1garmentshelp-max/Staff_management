import { getPool, camelStaff, handleOptions, ok, err, addAudit } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;

  const pool = getPool();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT * FROM staff WHERE id=$1', [id]);
      if (!rows.length) return err(res, 'Not found', 404);
      return ok(res, camelStaff(rows[0]));
    } catch (e) { return err(res, e.message); }
  }

  if (req.method === 'PUT') {
    const s = req.body;
    try {
      const { rows } = await pool.query(`
        UPDATE staff SET
          name=$2,designation=$3,branch=$4,aadhar=$5,phone=$6,alt_phone=$7,
          dob=$8,salary=$9,fixed_cutting=$10,advance=$11,extra_advance=$12,
          monthly_recovery=$13,total_outstanding=$14,total_savings=$15,updated_at=NOW()
        WHERE id=$1 RETURNING *`,
        [id, s.name, s.designation||'', s.branch||'', s.aadhar||'',
         s.phone||'', s.altPhone||'', s.dob||'',
         s.salary||0, s.fixedCutting||0, s.advance||0,
         s.extraAdvance||0, s.monthlyRecovery||0,
         s.totalOutstanding||0, s.totalSavings||0]
      );
      if (!rows.length) return err(res, 'Not found', 404);
      await addAudit(pool, id, 'UPDATE_STAFF', null, null, JSON.stringify(s));
      return ok(res, camelStaff(rows[0]));
    } catch (e) { return err(res, e.message); }
  }

  if (req.method === 'DELETE') {
    try {
      const { rows } = await pool.query(
        'UPDATE staff SET active=FALSE,updated_at=NOW() WHERE id=$1 RETURNING name', [id]
      );
      await addAudit(pool, id, 'DELETE_STAFF', null, rows[0]?.name, null);
      return ok(res, { ok: true });
    } catch (e) { return err(res, e.message); }
  }

  return err(res, 'Method not allowed', 405);
}
