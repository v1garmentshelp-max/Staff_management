import { useState } from 'react';
import { SectionHeader, EmptyState } from '../components/UI.jsx';

export default function AuditPage({ auditLog, staff }) {
  const [search, setSearch] = useState('');
  const empName = id => staff.find(s=>s.id===id)?.name || id;

  const filtered = auditLog.filter(l =>
    (l.staffId && empName(l.staffId).toLowerCase().includes(search.toLowerCase())) ||
    (l.action  && l.action.toLowerCase().includes(search.toLowerCase())) ||
    (l.source  && l.source.toLowerCase().includes(search.toLowerCase()))
  );

  const ACTION_COLOR = {
    UPDATE:'var(--b600)', CONFIRM_SAVINGS:'#1a6b35', LOAN_UPDATE:'var(--r600)',
    LOAN_PAYMENT:'var(--a600)', DELETE:'var(--r600)',
  };
  const ACTION_ICON = {
    UPDATE:'ti-edit', CONFIRM_SAVINGS:'ti-piggy-bank', LOAN_UPDATE:'ti-credit-card',
    LOAN_PAYMENT:'ti-cash', DELETE:'ti-trash',
  };

  return (
    <div>
      <SectionHeader title="Audit Log">
        <div style={{ position:'relative' }}>
          <i className="ti ti-search" style={{ position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',fontSize:13,pointerEvents:'none' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee or action…" style={{ paddingLeft:29,width:200 }}/>
        </div>
        <span style={{ fontSize:12,color:'var(--t3)' }}>{filtered.length} entries</span>
      </SectionHeader>

      <div className="card" style={{ overflow:'auto', maxHeight:'calc(100vh - 180px)' }}>
        {filtered.length===0
          ? <EmptyState icon="ti-shield-check" title="No audit entries" sub="Changes to staff data will appear here."/>
          : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Employee</th>
                <th>Field</th>
                <th>Previous Value</th>
                <th>New Value</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l=>(
                <tr key={l.id}>
                  <td style={{ fontSize:11,color:'var(--t3)',whiteSpace:'nowrap' }}>
                    {new Date(l.ts).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </td>
                  <td>
                    <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:99,background:'var(--s2)',fontSize:11,fontWeight:600,color:ACTION_COLOR[l.action]||'var(--t2)' }}>
                      <i className={`ti ${ACTION_ICON[l.action]||'ti-dots'}`} style={{ fontSize:11 }}/>
                      {l.action.replace(/_/g,' ')}
                    </span>
                  </td>
                  <td style={{ fontWeight:500 }}>{l.staffId ? empName(l.staffId) : '—'}</td>
                  <td style={{ fontSize:12,color:'var(--t3)' }}>{l.field||'—'}</td>
                  <td style={{ fontSize:12,color:'var(--r600)' }}>{l.oldVal!==null&&l.oldVal!==undefined ? String(l.oldVal) : '—'}</td>
                  <td style={{ fontSize:12,color:'#1a6b35',fontWeight:500 }}>{l.newVal!==null&&l.newVal!==undefined ? (typeof l.newVal==='object'?JSON.stringify(l.newVal):String(l.newVal)) : '—'}</td>
                  <td>
                    <span style={{ fontSize:11,padding:'1px 7px',borderRadius:99,background:l.source==='import'?'var(--b100)':'var(--s2)',color:l.source==='import'?'var(--b600)':'var(--t3)',fontWeight:500 }}>
                      {l.source||'manual'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
