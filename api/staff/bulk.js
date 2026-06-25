import { getPool, handleOptions, ok, err } from '../_db.js';

function toSnake(s) {
  return s.replace(/[A-Z]/g, l => '_' + l.toLowerCase());
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const pool = getPool();
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
}
