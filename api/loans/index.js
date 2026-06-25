import { getPool, handleOptions, ok, err } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (handleOptions(req, res) !== false) return;
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const pool = getPool();
  try {
    const { rows: loans }    = await pool.query('SELECT * FROM loans');
    const { rows: payments } = await pool.query('SELECT * FROM loan_payments ORDER BY paid_at DESC');
    const result = {};
    loans.forEach(l => {
      result[l.staff_id] = {
        total:    Number(l.total_amount),
        monthly:  Number(l.monthly_emi),
        remaining:Number(l.remaining),
        payments: payments
          .filter(p => p.staff_id === l.staff_id)
          .map(p => ({ amount: Number(p.amount), note: p.note, date: p.paid_at })),
      };
    });
    return ok(res, result);
  } catch (e) { return err(res, e.message); }
}
