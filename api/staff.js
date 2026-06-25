import { getPool, camelStaff, handleOptions, ok, err, addAudit } from './_db.js';

function toSnake(s) {
  return s.replace(/[A-Z]/g, l => '_' + l.toLowerCase());
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;

  const pool = getPool();
  
  const urlPath = req.url.split('?')[0];
  const parts = urlPath.split('/').filter(Boolean);
  
  const isBulk = parts[2] === 'bulk';
  const id = parts[2] && parts[2] !== 'bulk' ? parts[2] : null;

  // POST — Bulk Import or Add Staff
  if (req.method === 'POST') {
    if (isBulk) {
      const { changes } = req.body;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        let updated = 0, added = 0;

        const addRows = changes.filter(c => c.type === 'add');
        if (addRows.length > 0) {
          const valuesPlaceholders = [];
          const params = [];
          let idx = 1;
          for (const c of addRows) {
            const m = c.mapped || {};
            valuesPlaceholders.push(`($${idx},$${idx+1},$${idx+2},$${idx+3},$${idx+4},$${idx+5},$${idx+6},$${idx+7},$${idx+8},$${idx+9},$${idx+10},$${idx+11},$${idx+12},$${idx+13},$${idx+14})`);
            params.push(
              m.id||c.id, m.name||c.name, m.designation||'', m.branch||'',
              m.aadhar||'', m.phone||'', m.altPhone||'', m.dob||'',
              m.salary||0, m.fixedCutting||0, m.advance||0, m.extraAdvance||0,
              m.monthlyRecovery||0, m.totalOutstanding||0, m.totalSavings||0
            );
            idx += 15;
          }
          await client.query(`
            INSERT INTO staff (id,name,designation,branch,aadhar,phone,alt_phone,dob,
              salary,fixed_cutting,advance,extra_advance,monthly_recovery,total_outstanding,total_savings)
            VALUES ${valuesPlaceholders.join(',')}
            ON CONFLICT (id) DO NOTHING`,
            params
          );
          added = addRows.length;
        }

        const updateRows = changes.filter(c => c.type === 'update');
        for (const c of updateRows) {
          if (c.diffs && c.diffs.length > 0) {
            const setClauses = [];
            const params = [c.id];
            c.diffs.forEach(d => {
              const col = toSnake(d.field);
              params.push(d.new);
              setClauses.push(`${col}=$${params.length}`);
            });
            await client.query(
              `UPDATE staff SET ${setClauses.join(', ')}, updated_at=NOW() WHERE id=$1`,
              params
            );
          }
          updated++;
        }

        await client.query(
          'INSERT INTO import_logs (rows_updated,rows_added,changes_json) VALUES ($1,$2,$3)',
          [updated, added, JSON.stringify(changes)]
        );
        await client.query('COMMIT');
        return ok(res, { ok: true, updated, added });
      } catch (e) {
        await client.query('ROLLBACK');
        return err(res, e.message);
      } finally { client.release(); }
    } else {
      // Add staff
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
  }

  // GET
  if (req.method === 'GET') {
    if (id) {
      try {
        const { rows } = await pool.query('SELECT * FROM staff WHERE id=$1', [id]);
        if (!rows.length) return err(res, 'Not found', 404);
        return ok(res, camelStaff(rows[0]));
      } catch (e) { return err(res, e.message); }
    } else {
      try {
        const { rows } = await pool.query(
          'SELECT * FROM staff WHERE active=TRUE ORDER BY id'
        );
        return ok(res, rows.map(camelStaff));
      } catch (e) { return err(res, e.message); }
    }
  }

  // PUT — Update Staff
  if (req.method === 'PUT') {
    if (!id) return err(res, 'ID required', 400);
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

  // DELETE
  if (req.method === 'DELETE') {
    if (!id) return err(res, 'ID required', 400);
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
