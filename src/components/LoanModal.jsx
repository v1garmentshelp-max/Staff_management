import { useState } from 'react';
import { Modal, Field } from './UI.jsx';
import { inr, formatDate } from '../utils/helpers.js';

export default function LoanModal({ staff, loanData, onSave, onPayment, onClose }) {
  const [tab,setTab]=useState('details');
  const [form,setForm]=useState({ total:loanData.total||0, monthly:loanData.monthly||0, remaining:loanData.remaining||0 });
  const [payAmt,setPayAmt]=useState('');
  const [payNote,setPayNote]=useState('');

  function saveDetails(){ onSave(form); onClose(); }
  function makePayment(){
    const amt=Number(payAmt);
    if(!amt||amt<=0){ return; }
    onPayment(amt,payNote);
    setPayAmt(''); setPayNote('');
  }

  const pct = form.total>0 ? Math.round(((form.total-form.remaining)/form.total)*100) : 0;

  return (
    <Modal title={`Loan / Extra Advance — ${staff.name}`} onClose={onClose} width={500}>
      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:18,borderBottom:'1px solid var(--border)',paddingBottom:10}}>
        {[['details','ti-settings','Loan Details'],['payments','ti-history','Payment History']].map(([t,ic,lb])=>(
          <button key={t} onClick={()=>setTab(t)} className="btn btn-sm"
            style={{background:tab===t?'var(--g50)':'transparent',borderColor:tab===t?'var(--g800)':'transparent',color:tab===t?'var(--g800)':'var(--t3)'}}>
            <i className={`ti ${ic}`}/> {lb}
          </button>
        ))}
      </div>

      {tab==='details' && (
        <>
          {/* Progress bar */}
          {form.total>0&&(
            <div style={{marginBottom:18,padding:14,background:'var(--s2)',borderRadius:10,border:'1px solid var(--border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:12,color:'var(--t2)',fontWeight:500}}>Repayment Progress</span>
                <span style={{fontSize:12,fontWeight:600,color:'var(--g800)'}}>{pct}%</span>
              </div>
              <div style={{height:8,background:'var(--border)',borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',width:pct+'%',background:'var(--g700)',borderRadius:99,transition:'width .3s'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                <span style={{fontSize:11,color:'var(--t3)'}}>Paid: {inr(form.total-form.remaining)}</span>
                <span style={{fontSize:11,color:'var(--r600)',fontWeight:500}}>Remaining: {inr(form.remaining)}</span>
              </div>
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>
            <Field label="Total Loan Amount (₹)">
              <input type="number" min={0} value={form.total} onChange={e=>setForm(p=>({...p,total:Number(e.target.value)}))}/>
            </Field>
            <Field label="Monthly Recovery (₹)" hint="Deducted from salary each month">
              <input type="number" min={0} value={form.monthly} onChange={e=>setForm(p=>({...p,monthly:Number(e.target.value)}))}/>
            </Field>
            <Field label="Remaining Balance (₹)">
              <input type="number" min={0} value={form.remaining} onChange={e=>setForm(p=>({...p,remaining:Number(e.target.value)}))}/>
            </Field>
          </div>
          <div className="divider"/>
          {/* Quick repayment */}
          <p style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>Record a Payment</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>
            <Field label="Payment Amount (₹)">
              <input type="number" min={0} value={payAmt} onChange={e=>setPayAmt(e.target.value)} placeholder="e.g. 5000"/>
            </Field>
            <Field label="Note (optional)">
              <input value={payNote} onChange={e=>setPayNote(e.target.value)} placeholder="e.g. Early repayment"/>
            </Field>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
            <button className="btn btn-sm" style={{color:'var(--g800)',borderColor:'var(--g200)',background:'var(--g50)'}} onClick={makePayment} disabled={!payAmt||Number(payAmt)<=0}>
              <i className="ti ti-plus"/> Record Payment
            </button>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={saveDetails}><i className="ti ti-device-floppy"/> Save</button>
            </div>
          </div>
        </>
      )}

      {tab==='payments' && (
        <div>
          {(!loanData.payments||loanData.payments.length===0)
            ? <p style={{color:'var(--t3)',fontSize:13,textAlign:'center',padding:'20px 0'}}>No payments recorded yet.</p>
            : <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:340,overflowY:'auto'}}>
                {[...loanData.payments].reverse().map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'var(--s2)',borderRadius:8,border:'1px solid var(--border)'}}>
                    <div>
                      <p style={{fontWeight:600,fontSize:13,color:'var(--g800)'}}>{inr(p.amount)}</p>
                      <p style={{fontSize:11,color:'var(--t3)',marginTop:2}}>{p.note||'—'}</p>
                    </div>
                    <p style={{fontSize:11,color:'var(--t3)'}}>{new Date(p.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                  </div>
                ))}
              </div>
          }
        </div>
      )}
    </Modal>
  );
}
