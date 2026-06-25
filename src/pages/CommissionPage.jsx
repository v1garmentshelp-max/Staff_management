import { useState } from 'react';
import { Modal, Field, SectionHeader, EmptyState } from '../components/UI.jsx';
import { formatMonth, inr, monthKey, todayStr } from '../utils/helpers.js';

function CommissionModal({ staff, existing, onSave, onClose }) {
  const [form,setForm]=useState(existing||{staffId:'',target:0,sales:0,rate:1,helpers:[]});
  const [helperInput,setHelperInput]=useState('');
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  const empName = id => staff.find(s=>s.id===id)?.name||id;
  const pool    = Math.round(Number(form.sales)*Number(form.rate)/100);
  const empPct  = 70; const helpPct=30;
  const empComm = Math.round(pool*empPct/100);
  const helpTotal=Math.round(pool*helpPct/100);
  const perHelper= form.helpers.length>0?Math.round(helpTotal/form.helpers.length):0;
  const achievement=Number(form.target)>0?Math.min(100,Math.round(Number(form.sales)/Number(form.target)*100)):0;

  function addHelper(){
    const id=helperInput.trim();
    if(!id||form.helpers.includes(id)){setHelperInput('');return;}
    if(!staff.find(s=>s.id===id)){return;}
    f('helpers',[...form.helpers,id]); setHelperInput('');
  }
  function save(){ onSave(form); onClose(); }

  return (
    <Modal title={existing?'Edit Commission Target':'Set Commission Target'} onClose={onClose} width={540}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>
        <Field label="Employee">
          <select value={form.staffId} onChange={e=>f('staffId',e.target.value)}>
            <option value="">Select employee…</option>
            {staff.map(s=><option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
          </select>
        </Field>
        <Field label="Commission Rate (%)" hint="e.g. 1">
          <input type="number" min={0} max={100} step={0.1} value={form.rate} onChange={e=>f('rate',e.target.value)}/>
        </Field>
        <Field label="Sales Target (₹)">
          <input type="number" min={0} value={form.target} onChange={e=>f('target',e.target.value)}/>
        </Field>
        <Field label="Actual Sales (₹)">
          <input type="number" min={0} value={form.sales} onChange={e=>f('sales',e.target.value)}/>
        </Field>
      </div>

      {/* Helpers */}
      <Field label="Helper Employee IDs" hint="Enter ID and press Add">
        <div style={{display:'flex',gap:6}}>
          <input value={helperInput} onChange={e=>setHelperInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addHelper()} placeholder="e.g. 1005"/>
          <button className="btn btn-sm" onClick={addHelper} style={{flexShrink:0}}><i className="ti ti-plus"/></button>
        </div>
        {form.helpers.length>0&&(
          <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:8}}>
            {form.helpers.map(id=>(
              <span key={id} style={{display:'flex',alignItems:'center',gap:4,padding:'2px 8px',background:'var(--b100)',borderRadius:99,fontSize:11,color:'var(--b600)',fontWeight:500}}>
                {empName(id)}
                <button onClick={()=>f('helpers',form.helpers.filter(h=>h!==id))} style={{background:'none',border:'none',cursor:'pointer',color:'var(--b600)',fontSize:12,lineHeight:1}}>×</button>
              </span>
            ))}
          </div>
        )}
      </Field>

      {/* Live preview */}
      {form.staffId&&Number(form.sales)>0&&(
        <div style={{padding:14,background:'var(--g50)',borderRadius:10,border:'1px solid var(--g100)',marginBottom:4}}>
          <p style={{fontSize:12,fontWeight:600,color:'var(--g800)',marginBottom:10}}>Commission Breakdown</p>
          <div style={{height:6,background:'var(--border)',borderRadius:99,marginBottom:10,overflow:'hidden'}}>
            <div style={{height:'100%',width:achievement+'%',background:achievement>=100?'#1a6b35':'var(--g700)',borderRadius:99}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[['Target',inr(form.target),'var(--t2)'],['Actual Sales',inr(form.sales),'var(--g800)'],['Achievement',achievement+'%',achievement>=100?'#1a6b35':'var(--a600)'],['Commission Pool',inr(pool),'var(--b600)'],['Employee (70%)',inr(empComm),'#1a6b35'],['Helpers (30%)',`${inr(helpTotal)} ÷ ${form.helpers.length||1} = ${inr(perHelper)} each`,'var(--b600)']].map(([l,v,c])=>(
              <div key={l} style={{padding:'8px 10px',background:'var(--surface)',borderRadius:7,border:'1px solid var(--border)'}}>
                <p style={{fontSize:10,color:'var(--t3)',marginBottom:2}}>{l}</p>
                <p style={{fontSize:13,fontWeight:600,color:c}}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="divider"/>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
        <button className="btn btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-sm btn-primary" onClick={save} disabled={!form.staffId}><i className="ti ti-device-floppy"/> Save</button>
      </div>
    </Modal>
  );
}

export default function CommissionPage({ staff, curMonth, setCurMonth, getCommission, setCommissionForMonth, allAtt, showToast }) {
  const [modal,setModal]=useState(null); // null | 'add' | entry object
  const data = getCommission(curMonth);

  const months=(()=>{const s=new Set();s.add(curMonth);s.add(monthKey());return [...s].sort().reverse();})();
  const empName=id=>staff.find(s=>s.id===id)?.name||id;

  function saveEntry(form){
    const pool=Math.round(Number(form.sales)*Number(form.rate)/100);
    const empComm=Math.round(pool*0.7);
    const helpTotal=Math.round(pool*0.3);
    const perHelper=form.helpers.length>0?Math.round(helpTotal/form.helpers.length):0;
    const entry={...form,pool,empComm,helpTotal,perHelper,achievement:Number(form.target)>0?Math.min(100,Math.round(Number(form.sales)/Number(form.target)*100)):0};
    let newData;
    if(modal&&modal!=='add'){
      newData=data.map(d=>d.staffId===form.staffId?entry:d);
    } else {
      newData=[...data.filter(d=>d.staffId!==form.staffId),entry];
    }
    setCommissionForMonth(curMonth,newData);
    showToast('Commission saved');
    setModal(null);
  }

  function deleteEntry(id){ setCommissionForMonth(curMonth,data.filter(d=>d.staffId!==id)); showToast('Deleted'); }

  const totalPool=data.reduce((a,d)=>a+d.pool,0);
  const totalEmp=data.reduce((a,d)=>a+d.empComm,0);

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:18}}>
        {[['ti-target','Targets Set',data.length,'var(--g800)','var(--g50)'],['ti-coins','Total Pool',inr(totalPool),'var(--b600)','var(--b100)'],['ti-user','Employee Earnings',inr(totalEmp),'#1a6b35','#d4edda']].map(([ic,lb,v,c,acc])=>(
          <div key={lb} className="card" style={{padding:'13px 16px',display:'flex',gap:10,alignItems:'center'}}>
            <div style={{width:36,height:36,borderRadius:9,background:acc,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><i className={`ti ${ic}`} style={{fontSize:18,color:c}}/></div>
            <div><p style={{fontSize:11,color:'var(--t3)',fontWeight:500}}>{lb}</p><p style={{fontSize:18,fontWeight:700}}>{v}</p></div>
          </div>
        ))}
      </div>

      <SectionHeader title={`Commission — ${formatMonth(curMonth)}`}>
        <select value={curMonth} onChange={e=>setCurMonth(e.target.value)} style={{width:'auto'}}>
          {months.map(m=><option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
        <button className="btn btn-sm btn-primary" onClick={()=>setModal('add')}><i className="ti ti-plus"/> Set Target</button>
      </SectionHeader>

      <div className="card" style={{overflow:'auto'}}>
        {data.length===0
          ? <EmptyState icon="ti-target" title="No commission targets set" sub="Click 'Set Target' to assign a sales target to an employee."/>
          : (
          <table>
            <thead>
              <tr>
                <th>Employee</th><th>Target</th><th>Actual Sales</th><th>Achievement</th>
                <th>Rate</th><th>Pool</th><th>Employee (70%)</th><th>Helpers (30%)</th><th>Per Helper</th><th>Helpers</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d=>(
                <tr key={d.staffId}>
                  <td style={{fontWeight:500}}>{empName(d.staffId)}<div style={{fontSize:11,color:'var(--t3)'}}>{d.staffId}</div></td>
                  <td>{inr(d.target)}</td>
                  <td style={{fontWeight:500,color:'var(--g800)'}}>{inr(d.sales)}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:60,height:5,background:'var(--border)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{height:'100%',width:d.achievement+'%',background:d.achievement>=100?'#1a6b35':'var(--g700)',borderRadius:99}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:600,color:d.achievement>=100?'#1a6b35':'var(--a600)'}}>{d.achievement}%</span>
                    </div>
                  </td>
                  <td>{d.rate}%</td>
                  <td style={{color:'var(--b600)',fontWeight:500}}>{inr(d.pool)}</td>
                  <td style={{color:'#1a6b35',fontWeight:600}}>{inr(d.empComm)}</td>
                  <td>{inr(d.helpTotal)}</td>
                  <td>{d.helpers.length>0?inr(d.perHelper):'—'}</td>
                  <td style={{fontSize:11,color:'var(--t3)',maxWidth:150,whiteSpace:'normal'}}>{d.helpers.map(h=>empName(h)).join(', ')||'None'}</td>
                  <td>
                    <div style={{display:'flex',gap:3}}>
                      <button className="btn btn-xs btn-icon" onClick={()=>setModal(d)} title="Edit"><i className="ti ti-edit"/></button>
                      <button className="btn btn-xs btn-icon btn-danger" onClick={()=>deleteEntry(d.staffId)} title="Delete"><i className="ti ti-trash"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal&&<CommissionModal staff={staff} existing={modal==='add'?null:modal} onSave={saveEntry} onClose={()=>setModal(null)}/>}
    </div>
  );
}
