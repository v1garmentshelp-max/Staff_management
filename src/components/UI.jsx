import { useEffect, useRef } from 'react';

export function Modal({ title, onClose, children, width=480 }) {
  useEffect(()=>{ const h=e=>{ if(e.key==='Escape') onClose(); }; window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h); },[onClose]);
  return (
    <div className="modal-overlay" onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{maxWidth:width}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px 14px',borderBottom:'1px solid var(--border)'}}>
          <h3 style={{fontSize:16,fontWeight:600,color:'var(--g800)'}}>{title}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><i className="ti ti-x" style={{fontSize:16}}/></button>
        </div>
        <div style={{padding:22}}>{children}</div>
      </div>
    </div>
  );
}

export function Toast({ message, type='success', onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,3200); return()=>clearTimeout(t); },[onDone]);
  const icons={success:'ti-check',error:'ti-x',warn:'ti-alert-triangle',info:'ti-info-circle'};
  return <div className={`toast toast-${type}`}><i className={`ti ${icons[type]}`} style={{fontSize:15,flexShrink:0}}/><span>{message}</span></div>;
}

export function Field({ label, children, hint, required }) {
  return (
    <div className="field">
      <label>{label}{required&&<span style={{color:'var(--r600)',marginLeft:2}}>*</span>}</label>
      {children}
      {hint&&<p className="hint">{hint}</p>}
    </div>
  );
}

export function StatCard({ icon, label, value, sub, color='var(--g800)', accent='var(--g50)', onClick }) {
  return (
    <div className="card" onClick={onClick}
      style={{padding:'14px 18px',display:'flex',gap:12,alignItems:'flex-start',cursor:onClick?'pointer':'default',transition:'box-shadow .15s'}}
      onMouseEnter={e=>{ if(onClick) e.currentTarget.style.boxShadow='var(--sh-md)'; }}
      onMouseLeave={e=>{ if(onClick) e.currentTarget.style.boxShadow='var(--sh-sm)'; }}>
      <div style={{width:38,height:38,borderRadius:9,background:accent,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <i className={`ti ${icon}`} style={{fontSize:19,color}}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:11,color:'var(--t3)',fontWeight:500,marginBottom:2}}>{label}</p>
        <p style={{fontSize:21,fontWeight:700,color:'var(--t1)',lineHeight:1.2}}>{value}</p>
        {sub&&<p style={{fontSize:11,color:'var(--t3)',marginTop:2}}>{sub}</p>}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, message, onConfirm, onCancel, danger=false, confirmLabel }) {
  return (
    <Modal title={title} onClose={onCancel} width={400}>
      <p style={{color:'var(--t2)',fontSize:13,lineHeight:1.65,marginBottom:18}}>{message}</p>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button className={`btn btn-sm ${danger?'btn-danger':'btn-primary'}`} onClick={onConfirm}>
          {confirmLabel||(danger?'Delete':'Confirm')}
        </button>
      </div>
    </Modal>
  );
}

export function EmptyState({ icon, title, sub }) {
  return (
    <div style={{padding:'40px 24px',textAlign:'center'}}>
      <i className={`ti ${icon}`} style={{fontSize:36,color:'var(--t3)',display:'block',marginBottom:10}}/>
      <p style={{fontWeight:600,color:'var(--t2)',marginBottom:3}}>{title}</p>
      {sub&&<p style={{fontSize:12,color:'var(--t3)'}}>{sub}</p>}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{display:'flex',background:'var(--s2)',borderRadius:8,padding:3,gap:2}}>
      {tabs.map(([id,icon,label])=>(
        <button key={id} onClick={()=>onChange(id)} className="btn btn-sm"
          style={{background:active===id?'var(--surface)':'transparent',border:active===id?'1px solid var(--border)':'1px solid transparent',color:active===id?'var(--g800)':'var(--t3)',boxShadow:active===id?'var(--sh-sm)':'none',fontWeight:active===id?600:400}}>
          <i className={`ti ${icon}`}/> {label}
        </button>
      ))}
    </div>
  );
}

export function SectionHeader({ title, children }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      <div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>{children}</div>
    </div>
  );
}
