import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';
import { monthKey, todayStr, clone } from '../utils/helpers.js';

const HIST = 50;

export function useAppState() {
  const [staff,      setStaff]      = useState([]);
  const [allAtt,     setAllAtt]     = useState({});
  const [allSavings, setAllSavings] = useState({});
  const [loans,      setLoans]      = useState({});
  const [commission, setCommission] = useState({});
  const [holidays,   setHolidays]   = useState([]);
  const [weeklyOff,  setWeeklyOff_] = useState(0);
  const [waConfig,   setWaConfig_]  = useState({ token:'', phoneId:'' });
  const [auditLog,   setAuditLog]   = useState([]);
  const [attMonths,  setAttMonths]  = useState([]);
  const [curMonth,   setCurMonth_]  = useState(monthKey());
  const [curBranch,  setCurBranch]  = useState('ALL BRANCHES');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [history,    setHistory]    = useState([]);
  const [future,     setFuture]     = useState([]);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadAttendance(curMonth); }, [curMonth]);
  useEffect(() => { loadCommission(curMonth); }, [curMonth]);

  async function loadAll() {
    setLoading(true); setError(null);
    try {
      const [staffData, savingsData, loansData, settingsData, auditData, attMonthsData] = await Promise.all([
        api.getStaff(), api.getSavings(), api.getLoans(),
        api.getSettings(), api.getAudit(), api.getAttMonths(),
      ]);
      setStaff(staffData);
      setAllSavings(savingsData);
      setLoans(loansData);
      setHolidays((settingsData.holidays || []).map(h => h.date));
      setWeeklyOff_(Number(settingsData.weekly_off || 0));
      setWaConfig_({ token: settingsData.wa_token || '', phoneId: settingsData.wa_phone_id || '' });
      setAuditLog(auditData);
      setAttMonths(attMonthsData);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function loadAttendance(month) {
    try {
      const data = await api.getAttendance(month);
      setAllAtt(prev => ({ ...prev, [month]: data }));
    } catch(e) { console.error('loadAttendance:', e.message); }
  }

  async function loadCommission(month) {
    try {
      const data = await api.getCommission(month);
      setCommission(prev => ({ ...prev, [month]: data }));
    } catch(e) { console.error('loadCommission:', e.message); }
  }

  const monthAtt = allAtt[curMonth] || {};

  function snap() {
    return {
      staff: clone(staff), allAtt: clone(allAtt),
      allSavings: clone(allSavings), loans: clone(loans),
      commission: clone(commission), holidays: [...holidays], weeklyOff,
    };
  }
  function pushH(s) { setHistory(h => [...h.slice(-(HIST-1)), s]); setFuture([]); }
  function applySnap(s) {
    setStaff(s.staff); setAllAtt(s.allAtt); setAllSavings(s.allSavings);
    setLoans(s.loans); setCommission(s.commission);
    setHolidays(s.holidays); setWeeklyOff_(s.weeklyOff);
  }

  const undo = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture(f => [snap(), ...f]);
    applySnap(prev);
    setHistory(h => h.slice(0, -1));
  }, [history]);

  const redo = useCallback(() => {
    if (!future.length) return;
    const next = future[0];
    setHistory(h => [...h, snap()]);
    applySnap(next);
    setFuture(f => f.slice(1));
  }, [future]);

  async function addAuditEntry(action, staffId, field, oldVal, newVal, source='manual') {
    setAuditLog(prev => [{ id:Date.now(), ts:new Date().toISOString(), action, staffId, field, oldVal, newVal, source }, ...prev.slice(0,999)]);
    try { await api.addAudit({ action, staffId, field, oldVal, newVal, source }); } catch{}
  }

  // ── Attendance ──────────────────────────────────────────────────────────────
  async function markAllPresent() {
    const d = todayStr();
    if (monthKey(d) !== curMonth) return false;
    const s = snap(); pushH(s);
    const cur = clone(allAtt[curMonth] || {});
    staff.forEach(st => { if (!cur[st.id]?.[d]) { cur[st.id] = { ...(cur[st.id]||{}), [d]: 'P' }; } });
    setAllAtt(prev => ({ ...prev, [curMonth]: cur }));
    try {
      await api.markAllPresent(staff.map(s => s.id), d);
      if (!attMonths.includes(curMonth)) setAttMonths(p => [curMonth, ...p]);
    } catch(e) { console.error('markAllPresent:', e.message); }
    return true;
  }

  async function markOne(staffId, date, status) {
    const s = snap(); pushH(s);
    setAllAtt(prev => {
      const cur = clone(prev[curMonth] || {});
      cur[staffId] = { ...(cur[staffId]||{}), [date]: status };
      return { ...prev, [curMonth]: cur };
    });
    try {
      await api.markOne(staffId, date, status);
      if (!attMonths.includes(curMonth)) setAttMonths(p => [curMonth, ...p]);
    } catch(e) { console.error('markOne:', e.message); }
  }

  // ── Staff ───────────────────────────────────────────────────────────────────
  async function addStaff(member) {
    const s = snap(); pushH(s);
    try {
      const created = await api.addStaff(member);
      setStaff(prev => [...prev, created]);
      await addAuditEntry('ADD_STAFF', created.id, null, null, created.name);
    } catch(e) { console.error('addStaff:', e.message); throw e; }
  }

  async function updateStaff(id, changes) {
    const s = snap(); pushH(s);
    const existing = staff.find(x => x.id === id);
    setStaff(prev => prev.map(x => x.id === id ? { ...x, ...changes } : x));
    try {
      await api.updateStaff(id, { ...existing, ...changes });
      await addAuditEntry('UPDATE_STAFF', id, null, null, JSON.stringify(changes));
    } catch(e) {
      setStaff(prev => prev.map(x => x.id === id ? existing : x));
      console.error('updateStaff:', e.message);
    }
  }

  async function deleteStaff(id) {
    const s = snap(); pushH(s);
    const name = staff.find(x => x.id === id)?.name;
    setStaff(prev => prev.filter(x => x.id !== id));
    try { await api.deleteStaff(id); await addAuditEntry('DELETE_STAFF', id, null, name, null); }
    catch(e) { console.error('deleteStaff:', e.message); }
  }

  // ── Savings ─────────────────────────────────────────────────────────────────
  function getSavings(id) { return allSavings[id] || { confirmed: [], total: 0 }; }

  async function confirmSavings(id, month) {
    const emp = staff.find(x => x.id === id); if (!emp) return;
    const amount = Number(emp.fixedCutting || 0);
    const s = snap(); pushH(s);
    setAllSavings(prev => {
      const r = prev[id] || { confirmed: [], total: 0 };
      if (r.confirmed.includes(month)) return prev;
      return { ...prev, [id]: { confirmed: [...r.confirmed, month], total: r.total + amount } };
    });
    setStaff(prev => prev.map(x => x.id === id ? { ...x, totalSavings: (x.totalSavings||0) + amount } : x));
    try { await api.confirmSavings(id, month, amount); await addAuditEntry('CONFIRM_SAVINGS', id, 'savings', null, amount); }
    catch(e) { console.error('confirmSavings:', e.message); }
  }

  async function unconfirmSavings(id, month) {
    const emp = staff.find(x => x.id === id); if (!emp) return;
    const amount = Number(emp.fixedCutting || 0);
    const s = snap(); pushH(s);
    setAllSavings(prev => {
      const r = prev[id] || { confirmed: [], total: 0 };
      if (!r.confirmed.includes(month)) return prev;
      return { ...prev, [id]: { confirmed: r.confirmed.filter(m => m !== month), total: Math.max(0, r.total - amount) } };
    });
    setStaff(prev => prev.map(x => x.id === id ? { ...x, totalSavings: Math.max(0, (x.totalSavings||0) - amount) } : x));
    try { await api.unconfirmSavings(id, month); } catch(e) { console.error('unconfirmSavings:', e.message); }
  }

  // ── Loans ───────────────────────────────────────────────────────────────────
  function getLoan(id) { return loans[id] || { total: 0, monthly: 0, remaining: 0, payments: [] }; }

  async function setLoan(id, data) {
    const s = snap(); pushH(s);
    setLoans(prev => ({ ...prev, [id]: { ...(prev[id]||{}), ...data } }));
    setStaff(prev => prev.map(x => x.id === id ? { ...x, extraAdvance: data.total, monthlyRecovery: data.monthly, totalOutstanding: data.remaining } : x));
    try { await api.saveLoan(id, data); await addAuditEntry('LOAN_UPDATE', id, 'loan', null, JSON.stringify(data)); }
    catch(e) { console.error('setLoan:', e.message); }
  }

  async function addLoanPayment(id, amount, note='') {
    const s = snap(); pushH(s);
    const now = new Date().toISOString();
    setLoans(prev => {
      const cur = prev[id] || { total:0, monthly:0, remaining:0, payments:[] };
      return { ...prev, [id]: { ...cur, remaining: Math.max(0, cur.remaining - amount), payments: [...cur.payments, { amount, note, date: now }] } };
    });
    try { await api.addLoanPayment(id, amount, note); await addAuditEntry('LOAN_PAYMENT', id, 'remaining', null, amount); }
    catch(e) { console.error('addLoanPayment:', e.message); }
  }

  // ── Holidays ─────────────────────────────────────────────────────────────────
  async function addHoliday(date, name='Custom Holiday') {
    const s = snap(); pushH(s);
    setHolidays(prev => [...new Set([...prev, date])].sort());
    try { await api.addHoliday(date, name); } catch(e) { console.error('addHoliday:', e.message); }
  }

  async function removeHoliday(date) {
    const s = snap(); pushH(s);
    setHolidays(prev => prev.filter(d => d !== date));
    try { await api.removeHoliday(date); } catch(e) { console.error('removeHoliday:', e.message); }
  }

  async function setWeeklyOff(val) {
    const s = snap(); pushH(s);
    setWeeklyOff_(val);
    try { await api.setSetting('weekly_off', String(val)); } catch(e) { console.error('setWeeklyOff:', e.message); }
  }

  async function setWaConfig(cfg) {
    setWaConfig_(cfg);
    try { await api.setSetting('wa_token', cfg.token||''); await api.setSetting('wa_phone_id', cfg.phoneId||''); }
    catch(e) { console.error('setWaConfig:', e.message); }
  }

  // ── Commission ───────────────────────────────────────────────────────────────
  function getCommission(month) { return commission[month] || []; }

  async function setCommissionForMonth(month, data) {
    const s = snap(); pushH(s);
    setCommission(prev => ({ ...prev, [month]: data }));
    try {
      const existing = commission[month] || [];
      for (const old of existing) {
        if (!data.find(d => d.staffId === old.staffId)) await api.deleteCommission(month, old.staffId);
      }
      for (const entry of data) await api.saveCommission({ ...entry, month });
    } catch(e) { console.error('setCommission:', e.message); }
  }

  // ── Bulk setters ─────────────────────────────────────────────────────────────
  function bulkSetStaff(fn) { const s = snap(); pushH(s); setStaff(fn); }
  function bulkSetAllAtt(fn) { const s = snap(); pushH(s); setAllAtt(fn); }
  async function applyBulkImport(changes) {
    try { await api.bulkImport(changes); } catch(e) { console.error('bulkImport:', e.message); throw e; }
  }
  const pushHistoryDirect = useCallback((s) => pushH(s), []);
  const snapshot = useCallback(snap, [staff, allAtt, allSavings, loans, commission, holidays, weeklyOff]);

  function setCurMonth(m) {
    setCurMonth_(m);
  }

  const allMonths = (() => {
    const s = new Set(attMonths);
    s.add(curMonth); s.add(monthKey());
    return [...s].sort().reverse();
  })();

  return {
    staff, allAtt, monthAtt, allSavings, loans, auditLog,
    holidays, weeklyOff, waConfig, curMonth, curBranch,
    commission, allMonths, loading, error,
    canUndo: history.length > 0, canRedo: future.length > 0,
    setCurMonth, setCurBranch, setWaConfig, setWeeklyOff,
    undo, redo, snapshot, pushHistoryDirect,
    markAllPresent, markOne,
    addStaff, updateStaff, deleteStaff,
    getSavings, confirmSavings, unconfirmSavings,
    getLoan, setLoan, addLoanPayment,
    addHoliday, removeHoliday,
    getCommission, setCommissionForMonth,
    bulkSetStaff, bulkSetAllAtt, applyBulkImport,
    addAudit: addAuditEntry,
    reload: loadAll,
  };
}
