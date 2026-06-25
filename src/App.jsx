import { useState, useEffect, useCallback } from 'react';
import { lsGet, lsSet } from './utils/helpers.js';
import { useAppState }    from './hooks/useAppState.js';
import { Toast }          from './components/UI.jsx';
import LoginPage          from './pages/LoginPage.jsx';
import DashboardPage      from './pages/DashboardPage.jsx';
import SheetPage          from './pages/SheetPage.jsx';
import CommissionPage     from './pages/CommissionPage.jsx';
import SettingsPage       from './pages/SettingsPage.jsx';
import AuditPage          from './pages/AuditPage.jsx';

const NAV = [
  ['dashboard', 'ti-layout-dashboard', 'Dashboard'],
  ['sheet',     'ti-table',            'Sheet'],
  ['commission','ti-target',           'Commission'],
  ['audit',     'ti-shield-check',     'Audit Log'],
  ['settings',  'ti-settings',         'Settings'],
];

function NavBtn({ id, icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:6,
      padding:'6px 12px', borderRadius:7, border:'none',
      background: active ? 'var(--g50)' : 'transparent',
      color:      active ? 'var(--g800)' : 'var(--t2)',
      fontFamily:'var(--font)', fontSize:13,
      fontWeight: active ? 600 : 400,
      cursor:'pointer', transition:'all .13s',
    }}>
      <i className={`ti ${icon}`} style={{ fontSize:15 }}/>
      {label}
    </button>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => lsGet('vm_authed', false));
  const [page,   setPage]   = useState('dashboard');
  const [toast,  setToast]  = useState(null);

  useEffect(() => lsSet('vm_authed', authed), [authed]);

  const showToast = useCallback((message, type='success') => setToast({ message, type }), []);

  const A = useAppState();

  // Global keyboard shortcuts
  useEffect(() => {
    function kh(e) {
      if ((e.ctrlKey||e.metaKey) && e.key==='z' && !e.shiftKey) { e.preventDefault(); A.undo(); showToast('Undone','info'); }
      if ((e.ctrlKey||e.metaKey) && (e.key==='y'||(e.key==='z'&&e.shiftKey))) { e.preventDefault(); A.redo(); showToast('Redone','info'); }
    }
    window.addEventListener('keydown', kh);
    return () => window.removeEventListener('keydown', kh);
  }, [A, showToast]);

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  if (A.loading) return (
    <div style={{minHeight:'100vh',background:'var(--g900)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div style={{width:48,height:48,borderRadius:12,background:'var(--g800)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🛒</div>
      <div style={{color:'#fff',fontFamily:'var(--font-display)',fontSize:22}}>Vandana Mall</div>
      <div style={{color:'rgba(255,255,255,.5)',fontSize:13}}>Connecting to database…</div>
      <div style={{width:200,height:3,background:'rgba(255,255,255,.1)',borderRadius:99,overflow:'hidden',marginTop:8}}>
        <div style={{height:'100%',background:'var(--g600)',borderRadius:99,animation:'loadbar 1.5s ease-in-out infinite'}}/>
      </div>
      <style>{`@keyframes loadbar{0%{width:0%;margin-left:0}50%{width:60%;margin-left:20%}100%{width:0%;margin-left:100%}}`}</style>
    </div>
  );

  if (A.error) return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,padding:24}}>
      <i className="ti ti-database-off" style={{fontSize:48,color:'var(--r600)'}}/>
      <h2 style={{fontSize:20,fontWeight:600}}>Database Connection Failed</h2>
      <p style={{fontSize:14,color:'var(--t2)',maxWidth:400,textAlign:'center'}}>{A.error}</p>
      <p style={{fontSize:12,color:'var(--t3)',textAlign:'center'}}>Make sure the backend is running on port 4000 and your Neon database is accessible.</p>
      <button className="btn btn-primary" onClick={A.reload}><i className="ti ti-refresh"/> Retry Connection</button>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

      {/* Topbar */}
      <header style={{
        position:'sticky', top:0, zIndex:100,
        background:'var(--surface)', borderBottom:'1px solid var(--border)',
        height:'var(--topbar)', display:'flex', alignItems:'center',
        padding:'0 20px', gap:12, boxShadow:'var(--sh-sm)',
      }}>
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:9, flexShrink:0, marginRight:4 }}>
          <div style={{ width:32,height:32,borderRadius:8,background:'var(--g800)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17 }}>🛒</div>
          <div>
            <div style={{ fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,color:'var(--g800)',lineHeight:1 }}>Vandana Mall</div>
            <div style={{ fontSize:10,color:'var(--t3)',lineHeight:1,marginTop:1 }}>Staff Manager</div>
          </div>
        </div>

        <div style={{ width:1,height:26,background:'var(--border)',flexShrink:0 }}/>

        {/* Nav */}
        <nav style={{ display:'flex', gap:2, flex:1, overflowX:'auto' }}>
          {NAV.map(([id,icon,label]) => (
            <NavBtn key={id} id={id} icon={icon} label={label} active={page===id} onClick={()=>setPage(id)}/>
          ))}
        </nav>

        {/* Right controls */}
        <div style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={()=>{ A.undo(); showToast('Undone','info'); }} disabled={!A.canUndo} title="Undo (Ctrl+Z)">
            <i className="ti ti-arrow-back-up" style={{ fontSize:15 }}/>
          </button>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={()=>{ A.redo(); showToast('Redone','info'); }} disabled={!A.canRedo} title="Redo (Ctrl+Y)">
            <i className="ti ti-arrow-forward-up" style={{ fontSize:15 }}/>
          </button>
          <div style={{ width:1,height:22,background:'var(--border)' }}/>
          {/* Branch badge */}
          <div style={{ display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:7,background:'var(--g50)',border:'1px solid var(--g100)' }}>
            <i className="ti ti-building-store" style={{ fontSize:13,color:'var(--g800)' }}/>
            <span style={{ fontSize:11,fontWeight:500,color:'var(--g800)',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
              {A.curBranch}
            </span>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={()=>{ setAuthed(false); setPage('dashboard'); }} style={{ color:'var(--t3)' }}>
            <i className="ti ti-logout" style={{ fontSize:14 }}/> Logout
          </button>
        </div>
      </header>

      {/* Page content */}
      <main style={{ padding:'18px 22px', maxWidth:1800, margin:'0 auto' }}>
        {page==='dashboard' && (
          <DashboardPage
            staff={A.staff} allAtt={A.allAtt} monthAtt={A.monthAtt}
            holidays={A.holidays} weeklyOff={A.weeklyOff}
            curMonth={A.curMonth} setCurMonth={A.setCurMonth} allMonths={A.allMonths}
            curBranch={A.curBranch} setCurBranch={A.setCurBranch}
            markAllPresent={A.markAllPresent} markOne={A.markOne}
            addStaff={A.addStaff} updateStaff={A.updateStaff} deleteStaff={A.deleteStaff}
            getSavings={A.getSavings} confirmSavings={A.confirmSavings} unconfirmSavings={A.unconfirmSavings}
            getLoan={A.getLoan} setLoan={A.setLoan} addLoanPayment={A.addLoanPayment}
            getCommission={A.getCommission}
            undo={A.undo} redo={A.redo} canUndo={A.canUndo} canRedo={A.canRedo}
            pushHistoryDirect={A.pushHistoryDirect} snapshot={A.snapshot}
            bulkSetStaff={A.bulkSetStaff} applyBulkImport={A.applyBulkImport}
            showToast={showToast}
          />
        )}
        {page==='sheet' && (
          <SheetPage
            staff={A.staff} setStaffDirect={A.bulkSetStaff}
            allAtt={A.allAtt} setAllAttDirect={A.bulkSetAllAtt}
            weeklyOff={A.weeklyOff} holidays={A.holidays}
            curMonth={A.curMonth} setCurMonth={A.setCurMonth} allMonths={A.allMonths}
            pushHistoryDirect={A.pushHistoryDirect} snapshot={A.snapshot}
            undo={A.undo} redo={A.redo} canUndo={A.canUndo} canRedo={A.canRedo}
            showToast={showToast}
          />
        )}
        {page==='commission' && (
          <CommissionPage
            staff={A.staff} curMonth={A.curMonth} setCurMonth={A.setCurMonth} allMonths={A.allMonths}
            getCommission={A.getCommission} setCommissionForMonth={A.setCommissionForMonth}
            allAtt={A.allAtt} showToast={showToast}
          />
        )}
        {page==='audit' && (
          <AuditPage auditLog={A.auditLog} staff={A.staff}/>
        )}
        {page==='settings' && (
          <SettingsPage
            holidays={A.holidays} weeklyOff={A.weeklyOff}
            setWeeklyOff={A.setWeeklyOff}
            addHoliday={A.addHoliday} removeHoliday={A.removeHoliday}
            waConfig={A.waConfig} setWaConfig={A.setWaConfig}
            showToast={showToast}
          />
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}
