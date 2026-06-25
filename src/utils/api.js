// ── Base URL — change this to your deployed backend URL when deploying ─────────
export const API_BASE = import.meta.env.VITE_API_URL || '';

async function req(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const get  = (path)        => req('GET',    path);
const post = (path, body)  => req('POST',   path, body);
const put  = (path, body)  => req('PUT',    path, body);
const del  = (path)        => req('DELETE', path);

// ── Staff ─────────────────────────────────────────────────────────────────────
export const api = {
  // Staff
  getStaff:        ()        => get('/api/staff'),
  addStaff:        (data)    => post('/api/staff', data),
  updateStaff:     (id,data) => put(`/api/staff/${id}`, data),
  deleteStaff:     (id)      => del(`/api/staff/${id}`),
  bulkImport:      (changes) => post('/api/staff/bulk', { changes }),

  // Attendance
  getAttendance:   (month)        => get(`/api/attendance/${month}`),
  markOne:         (staffId,date,status) => post('/api/attendance', { staffId, date, status }),
  markAllPresent:  (staffIds,date)       => post('/api/attendance/bulk-present', { staffIds, date }),
  getAttMonths:    ()              => get('/api/attendance/months'),

  // Savings
  getSavings:      ()              => get('/api/savings'),
  confirmSavings:  (staffId,month,amount) => post('/api/savings/confirm',   { staffId, month, amount }),
  unconfirmSavings:(staffId,month)        => post('/api/savings/unconfirm', { staffId, month }),

  // Loans
  getLoans:        ()              => get('/api/loans'),
  getLoan:         (staffId)       => get(`/api/loans/${staffId}`),
  saveLoan:        (staffId,data)  => put(`/api/loans/${staffId}`, data),
  addLoanPayment:  (staffId,amount,note) => post(`/api/loans/${staffId}/payment`, { amount, note }),

  // Commission
  getCommission:   (month)         => get(`/api/commission/${month}`),
  saveCommission:  (data)          => post('/api/commission', data),
  deleteCommission:(month,staffId) => del(`/api/commission/${month}/${staffId}`),

  // Settings
  getSettings:     ()              => get('/api/settings'),
  setSetting:      (key,value)     => put(`/api/settings/${key}`, { value }),
  addHoliday:      (date,name)     => post('/api/settings/holidays', { date, name }),
  removeHoliday:   (date)          => del(`/api/settings/holidays/${date}`),

  // Audit
  getAudit:        ()              => get('/api/audit'),
  addAudit:        (entry)         => post('/api/audit', entry),
};
