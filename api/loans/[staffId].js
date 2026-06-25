import { getPool, handleOptions, ok, err, addAudit } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;

  const pool = getPool();
  const { staffId } = req.query;

  // GET single loan
  if (req.method === 'GET') {
    try {
      const { rows: loans }    = await pool.query('SELECT * FROM loans WHERE staff_id=$1', [staffId]);
      const { rows: payments } = await pool.query(
        'SELECT * FROM loan_payments WHERE staff_id=$1 ORDER BY paid_at DESC', [staffId]
      );
      if (!loans.length) return ok(res, { total:0, monthly:0, remaining:0, payments:[] });
      const l = loans[0];
      return ok(res, {
        total: Number(l.total_amount), monthly: Number(l.monthly_emi),
        remaining: Number(l.remaining),
        payments: payments.map(p => ({ amount: Number(p.amount), note: p.note, date: p.paid_at })),
      });
    } catch (e) { return err(res, e.message); }
  }

  // PUT upsert loan
  if (req.method === 'PUT') {
    const { total, monthly, remaining } = req.body;
    try {
      await pool.query(`
        INSERT INTO loans (staff_id,total_amount,monthly_emi,remaining)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (staff_id) DO UPDATE SET
          total_amount=$2,monthly_emi=$3,remaining=$4,updated_at=NOW()`,
        [staffId, total, monthly, remaining]
      );
      await pool.query(
        'UPDATE staff SET extra_advance=$2,monthly_recovery=$3,total_outstanding=$4,updated_at=NOW() WHERE id=$1',
        [staffId, total, monthly, remaining]
      );
      await addAudit(pool, staffId, 'LOAN_UPDATE', 'loan', null, JSON.stringify({ total, monthly, remaining }));
      return ok(res, { ok: true });
    } catch (e) { return err(res, e.message); }
  }

  // POST payment — /api/loans/[staffId]?action=payment
  if (req.method === 'POST') {
    const { amount, note } = req.body;
    try {
      await pool.query(
        'INSERT INTO loan_payments (staff_id,amount,note) VALUES ($1,$2,$3)',
        [staffId, amount, note || '']
      );
      await pool.query(
        'UPDATE loans SET remaining=GREATEST(0,remaining-$2),updated_at=NOW() WHERE staff_id=$1',
        [staffId, amount]
      );
      await pool.query(
        'UPDATE staff SET total_outstanding=(SELECT remaining FROM loans WHERE staff_id=$1),updated_at=NOW() WHERE id=$1',
        [staffId]
      );
      await addAudit(pool, staffId, 'LOAN_PAYMENT', 'remaining', null, amount);
      return ok(res, { ok: true });
    } catch (e) { return err(res, e.message); }
  }

  return err(res, 'Method not allowed', 405);
}
