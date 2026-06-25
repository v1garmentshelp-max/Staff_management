import { useState } from 'react';
import { Field } from '../components/UI.jsx';
import { formatDate, todayStr } from '../utils/helpers.js';
import { WEEK_DAYS, HOLIDAY_NAMES } from '../utils/constants.js';

export default function SettingsPage({ holidays, weeklyOff, setWeeklyOff, addHoliday, removeHoliday, waConfig, setWaConfig, showToast }) {
  const [newHol,setNewHol]=useState(''); const [newName,setNewName]=useState('');
  const [wa,setWa]=useState(waConfig); const [showTok,setShowTok]=useState(false);
  const today=todayStr();
  const upcoming=holidays.filter(d=>d>=today).sort();
  const past=holidays.filter(d=>d<today).sort().reverse();

  function handleAdd(){
    if(!newHol){showToast('Select a date','warn');return;}
    if(holidays.includes(newHol)){showToast('Already a holiday','warn');return;}
    addHoliday(newHol); setNewHol(''); setNewName(''); showToast('Holiday added');
  }
  function saveWa(){ setWaConfig(wa); showToast('WhatsApp config saved'); }

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>
      <div className="card" style={{padding:22}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
          <div style={{width:36,height:36,borderRadius:9,background:'var(--g50)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className="ti ti-calendar-event" style={{fontSize:18,color:'var(--g800)'}}/>
          </div>
          <div><h3 style={{fontSize:15,fontWeight:600}}>Holidays and Weekly Off</h3><p style={{fontSize:11,color:'var(--t3)'}}>Configure paid days off</p></div>
        </div>
        <div style={{padding:13,background:'var(--s2)',borderRadius:9,border:'1px solid var(--border)',marginBottom:18}}>
          <label style={{fontSize:12,fontWeight:500,color:'var(--t2)',display:'block',marginBottom:7}}>Weekly Off Day</label>
          <select value={weeklyOff} onChange={e=>{setWeeklyOff(Number(e.target.value));showToast('Weekly off updated');}}>
            {WEEK_DAYS.map((d,i)=><option key={i} value={i}>{d}</option>)}
          </select>
          <p style={{fontSize:11,color:'var(--t3)',marginTop:5}}>All {WEEK_DAYS[weeklyOff]}s are paid weekly off.</p>
        </div>
        <p style={{fontSize:12,fontWeight:500,color:'var(--t2)',marginBottom:8}}>Add Custom Holiday</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 10px',marginBottom:8}}>
          <Field label="Date"><input type="date" value={newHol} onChange={e=>setNewHol(e.target.value)}/></Field>
          <Field label="Name (optional)"><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Pongal"/></Field>
        </div>
        <button className="btn btn-sm btn-primary" onClick={handleAdd} style={{width:'100%',justifyContent:'center',marginBottom:16}}>
          <i className="ti ti-plus"/> Add Holiday
        </button>
        <p style={{fontSize:11,fontWeight:500,color:'var(--t3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'}}>Upcoming ({upcoming.length})</p>
        <div style={{maxHeight:220,overflowY:'auto',display:'flex',flexDirection:'column',gap:5}}>
          {upcoming.length===0&&<p style={{fontSize:12,color:'var(--t3)',padding:'6px 0'}}>None configured.</p>}
          {upcoming.map(d=>(
            <div key={d} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'var(--s2)',borderRadius:8,border:'1px solid var(--border)'}}>
              <div><p style={{fontSize:13,fontWeight:500}}>{formatDate(d)}</p><p style={{fontSize:11,color:'var(--t3)'}}>{HOLIDAY_NAMES[d]||'Custom holiday'}</p></div>
              <button className="btn btn-xs btn-danger" onClick={()=>{removeHoliday(d);showToast('Holiday removed');}}><i className="ti ti-trash"/></button>
            </div>
          ))}
        </div>
        {past.length>0&&(
          <details style={{marginTop:12,fontSize:12}}>
            <summary style={{cursor:'pointer',color:'var(--t3)',marginBottom:6}}>Past holidays ({past.length})</summary>
            <div style={{maxHeight:110,overflowY:'auto',display:'flex',flexDirection:'column',gap:3,opacity:.65}}>
              {past.map(d=>(
                <div key={d} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 8px'}}>
                  <span>{formatDate(d)} - {HOLIDAY_NAMES[d]||'Custom'}</span>
                  <button className="btn btn-xs" onClick={()=>{removeHoliday(d);showToast('Removed');}}><i className="ti ti-x"/></button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div className="card" style={{padding:22}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
            <div style={{width:36,height:36,borderRadius:9,background:'#e8f8ef',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-brand-whatsapp" style={{fontSize:18,color:'#25d366'}}/>
            </div>
            <div><h3 style={{fontSize:15,fontWeight:600}}>WhatsApp Business API</h3><p style={{fontSize:11,color:'var(--t3)'}}>For direct payslip sending</p></div>
          </div>
          <div style={{padding:10,background:'#fff8e1',borderRadius:8,border:'1px solid #ffe082',marginBottom:16,fontSize:12,color:'#7a5c00',lineHeight:1.6}}>
            Leave blank to use WhatsApp Web fallback instead.
          </div>
          <Field label="Access Token" hint="From Meta App, WhatsApp API Setup">
            <div style={{position:'relative'}}>
              <input type={showTok?'text':'password'} value={wa.token} onChange={e=>setWa(p=>({...p,token:e.target.value}))} placeholder="EAAxxxxxxxxxx"/>
              <button type="button" onClick={()=>setShowTok(p=>!p)} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--t3)',fontSize:14}}>
                <i className={`ti ${showTok?'ti-eye-off':'ti-eye'}`}/>
              </button>
            </div>
          </Field>
          <Field label="Phone Number ID" hint="Numeric ID from WhatsApp API Setup">
            <input value={wa.phoneId} onChange={e=>setWa(p=>({...p,phoneId:e.target.value}))} placeholder="e.g. 123456789012345"/>
          </Field>
          <button className="btn btn-primary btn-sm" onClick={saveWa} style={{width:'100%',justifyContent:'center',marginTop:4}}>
            <i className="ti ti-device-floppy"/> Save Configuration
          </button>
        </div>
        <div className="card" style={{padding:20}}>
          <p style={{fontSize:13,fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
            <i className="ti ti-help-circle" style={{color:'var(--g800)'}}/>How to get API credentials
          </p>
          <ol style={{paddingLeft:16,fontSize:12,color:'var(--t2)',lineHeight:2,display:'flex',flexDirection:'column',gap:1}}>
            <li>Go to developers.facebook.com</li>
            <li>Create or open your Meta App</li>
            <li>Add WhatsApp product to the app</li>
            <li>Under API Setup, copy your Phone Number ID</li>
            <li>Generate a Permanent Access Token</li>
            <li>Paste both above and save</li>
          </ol>
          <div style={{marginTop:12,padding:10,background:'var(--g50)',borderRadius:8,fontSize:11,color:'var(--g700)'}}>
            Credentials stored locally in your browser only.
          </div>
        </div>
        <div className="card" style={{padding:20}}>
          <p style={{fontSize:13,fontWeight:600,marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
            <i className="ti ti-database" style={{color:'var(--g800)'}}/>Database Status
          </p>
          <p style={{fontSize:12,color:'var(--t2)',lineHeight:1.7}}>
            Data is currently stored in browser localStorage. Connect DigitalOcean PostgreSQL after finalising the UI.
          </p>
          <div style={{marginTop:10,padding:10,background:'var(--a100)',borderRadius:8,fontSize:11,color:'var(--a600)',fontWeight:500}}>
            Download Excel monthly as backup until database is connected.
          </div>
        </div>
      </div>
    </div>
  );
}
