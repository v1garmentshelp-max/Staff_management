import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { SectionHeader, Tabs } from '../components/UI.jsx';
import { dateRange,isWeeklyOff,isHoliday,todayStr,monthKey,calcSalary,formatMonth,inr } from '../utils/helpers.js';
import { ATT_STATUSES, BRANCHES, DESIGNATIONS } from '../utils/constants.js';

function EditCell({ value, onChange, numeric, options, disabled }) {
  const [ed,setEd]=useState(false); const [val,setVal]=useState(''); const ref=useRef();
  function start(){ if(disabled) return; setVal(value??''); setEd(true); setTimeout(()=>ref.current?.focus(),0); }
  function commit(){ setEd(false); const v=numeric?Number(val):val; if(v!==value) onChange(v); }
  if(disabled) return <div title={value??'—'} style={{padding:'8px 12px',color:'var(--t3)',fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{value??'—'}</div>;
  if(ed){
    if(options) return <select ref={ref} value={val} onChange={e=>setVal(e.target.value)} onBlur={commit} style={{border:'none',background:'#fffde7',padding:'8px 12px',fontSize:13,width:'100%',outline:'none'}}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>;
    return <input ref={ref} type={numeric?'number':'text'} value={val} onChange={e=>setVal(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit();if(e.key==='Escape')setEd(false);}} style={{border:'none',background:'#fffde7',padding:'8px 12px',fontSize:13,width:'100%',outline:'none'}}/>;
  }
  return <div title={value??''} onClick={start} style={{padding:'8px 12px',cursor:'cell',fontSize:13,minHeight:36,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{value??''}</div>;
}

function AttCell({ value, disabled, isToday, onChange }) {
  const [ed,setEd]=useState(false); const [val,setVal]=useState(''); const ref=useRef();
  const BG={P:'#d4edda',PL:'var(--b100)',UL:'var(--a100)',A:'var(--r100)'};
  const CL={P:'#1a6b35',PL:'var(--b600)',UL:'var(--a600)',A:'var(--r600)'};
  function start(){ if(disabled) return; setVal(value||''); setEd(true); setTimeout(()=>ref.current?.focus(),0); }
  function commit(){ setEd(false); onChange(val); }
  if(ed) return <td style={{padding:0,outline:isToday?'2px solid var(--g800)':undefined,outlineOffset:-2}}><input ref={ref} value={val} onChange={e=>setVal(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit();if(e.key==='Escape')setEd(false);}} maxLength={2} style={{width:'100%',border:'none',background:'#fffde7',textAlign:'center',padding:'7px 2px',fontSize:11,fontWeight:600,outline:'none',textTransform:'uppercase'}}/></td>;
  return <td onClick={start} style={{textAlign:'center',padding:'7px 2px',background:disabled?'var(--s2)':BG[value]||'var(--surface)',cursor:disabled?'default':'cell',outline:isToday?'2px solid var(--g800)':undefined,outlineOffset:-2}}><span style={{fontSize:11,fontWeight:600,color:CL[value]||'var(--t3)'}}>{value||(disabled?'':'—')}</span></td>;
}

export default function SheetPage({
  staff,setStaffDirect,allAtt,setAllAttDirect,allMonths,weeklyOff,holidays,
  curMonth,setCurMonth,pushHistoryDirect,snapshot,undo,redo,canUndo,canRedo,showToast,
}) {
  const [tab,setTab]=useState('staff');
  // months come from parent allMonths prop
  const months = (typeof allMonths !== 'undefined' && allMonths.length) ? allMonths : [curMonth];
  const days=dateRange(curMonth); const todaySt=todayStr(); const monthAt=allAtt[curMonth]||{};
  const DAY=['Su','Mo','Tu','We','Th','Fr','Sa'];

  const STAFF_COLS=[
    {k:'id',l:'ID',w:70,disabled:true},{k:'name',l:'Name',w:160},{k:'designation',l:'Designation',w:130,options:DESIGNATIONS},
    {k:'branch',l:'Branch',w:150,options:BRANCHES.filter(b=>b!=='ALL BRANCHES')},
    {k:'aadhar',l:'Aadhar',w:155},{k:'phone',l:'Phone',w:115},{k:'altPhone',l:'Alt Phone',w:115},{k:'dob',l:'DOB',w:110},
    {k:'salary',l:'Salary',w:110,numeric:true},{k:'fixedCutting',l:'Fixed Cut',w:95,numeric:true},
    {k:'_commEarned',l:'Commission',w:110,disabled:true},
    {k:'advance',l:'Advance',w:90,numeric:true},{k:'extraAdvance',l:'Extra Adv',w:90,numeric:true},
    {k:'monthlyRecovery',l:'Loan EMI',w:90,numeric:true},{k:'totalOutstanding',l:'Outstanding',w:100,numeric:true},
    {k:'totalSavings',l:'Tot Savings',w:100,numeric:true},
  ];

  function editStaffCell(idx,key,val){
    pushHistoryDirect(snapshot());
    setStaffDirect(prev=>prev.map((s,i)=>i===idx?{...s,[key]:val}:s));
  }
  function editAttCell(sId,d,rawVal){
    const v=rawVal.toUpperCase().trim();
    if(!ATT_STATUSES.includes(v)&&v!=='') return;
    pushHistoryDirect(snapshot());
    setAllAttDirect(prev=>{
      const cur=prev[curMonth]||{}; const sAtt=cur[sId]||{};
      if(v===''){const{[d]:_,...rest}=sAtt;return{...prev,[curMonth]:{...cur,[sId]:rest}};}
      return{...prev,[curMonth]:{...cur,[sId]:{...sAtt,[d]:v}}};
    });
  }

  function downloadExcel(){
    const wb=XLSX.utils.book_new();
    const staffRows=staff.map(s=>{
      const sAtt=(allAtt[curMonth]||{})[s.id]||{};
      const sal=calcSalary(s,sAtt,curMonth,weeklyOff,holidays);
      return{'ID':s.id,'Name':s.name,'Designation':s.designation,'Branch':s.branch,'Aadhar':s.aadhar,'Phone':s.phone,'Alt Phone':s.altPhone,'DOB':s.dob,'Salary':s.salary,'Fixed Cutting':s.fixedCutting,'Commission':sal.commEarned||0,'Advance':s.advance,'Extra Advance':s.extraAdvance,'Monthly Recovery':s.monthlyRecovery,'Outstanding':s.totalOutstanding,'Total Savings':s.totalSavings,'Days Present':sal.daysPresent,'PL':sal.daysPL,'UL':sal.daysUL,'Absent':sal.daysAbsent,'Paid Days':sal.paidDays,'Till-date Salary':sal.tillDateSalary,'Net Payable':sal.netPayable};
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(staffRows),'Staff');
    const attRows=staff.map(s=>{
      const sAtt=(allAtt[curMonth]||{})[s.id]||{};
      const row={'ID':s.id,'Name':s.name};
      days.forEach(d=>{row[d.slice(8)]=isWeeklyOff(d,weeklyOff)?'Off':isHoliday(d,holidays)?'Hol':sAtt[d]||'';});
      return row;
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(attRows),`Attendance_${curMonth}`);
    XLSX.writeFile(wb,`Vandana_${curMonth}.xlsx`);
    showToast('Excel downloaded!');
  }

  return (
    <div>
      <SectionHeader title={`Sheet View — ${formatMonth(curMonth)}`}>
        <select value={curMonth} onChange={e=>setCurMonth(e.target.value)} style={{width:'auto'}}>
          {months.map(m=><option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
        <Tabs tabs={[['staff','ti-table','Staff Details'],['att','ti-calendar-stats','Attendance']]} active={tab} onChange={setTab}/>
        <div style={{display:'flex',gap:3}}>
          <button className="btn btn-sm btn-icon" onClick={undo} disabled={!canUndo} title="Undo"><i className="ti ti-arrow-back-up"/></button>
          <button className="btn btn-sm btn-icon" onClick={redo} disabled={!canRedo} title="Redo"><i className="ti ti-arrow-forward-up"/></button>
        </div>
        <button className="btn btn-sm btn-primary" onClick={downloadExcel}><i className="ti ti-download"/> Download Excel</button>
      </SectionHeader>

      {tab==='staff'&&(
        <div className="card" style={{overflow:'auto',maxHeight:'calc(100vh - 220px)'}}>
          <div style={{padding:'8px 14px',fontSize:11,color:'var(--t3)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:5}}>
            <i className="ti ti-table-options" style={{fontSize:13}}/> Click any cell to edit. Syncs to Dashboard instantly.
          </div>
          <table style={{tableLayout:'fixed'}}>
            <thead><tr>{STAFF_COLS.map(c=><th key={c.k} style={{width:c.w}}>{c.l}</th>)}<th style={{width:120}}>Till-date</th><th style={{width:110}}>Net Payable</th></tr></thead>
            <tbody>
              {staff.map((s,idx)=>{
                const sAtt=(allAtt[curMonth]||{})[s.id]||{};
                const sal=calcSalary(s,sAtt,curMonth,weeklyOff,holidays);
                return (
                  <tr key={s.id}>
                    {STAFF_COLS.map(c=><td key={c.k} style={{padding:0}}><EditCell value={s[c.k]} numeric={c.numeric} disabled={c.disabled} options={c.options} onChange={v=>editStaffCell(idx,c.k,v)}/></td>)}
                    <td style={{padding:'8px 12px',color:'var(--g800)',fontWeight:600}}>{inr(sal.tillDateSalary)}</td>
                    <td style={{padding:'8px 12px',fontWeight:700,color:sal.netPayable<0?'var(--r600)':'var(--t1)'}}>{inr(sal.netPayable)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab==='att'&&(
        <div className="card" style={{overflow:'auto',maxHeight:'calc(100vh - 220px)'}}>
          <div style={{padding:'8px 14px',fontSize:11,color:'var(--t3)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:5}}>
            <i className="ti ti-table-options" style={{fontSize:13}}/> Click a cell → type P, PL, UL or A → Enter. Weekly off & holidays are read-only.
          </div>
          <table style={{tableLayout:'fixed',minWidth:160+days.length*46}}>
            <thead>
              <tr>
                <th style={{width:160,position:'sticky',left:0,zIndex:2,background:'var(--s2)'}}>Name</th>
                {days.map(d=>{
                  const off=isWeeklyOff(d,weeklyOff),hol=isHoliday(d,holidays);
                  return <th key={d} style={{width:46,textAlign:'center',padding:'6px 2px',background:off?'var(--p100)':hol?'var(--g50)':'var(--s2)',color:off?'var(--p600)':hol?'var(--g700)':'var(--t3)'}}>
                    <div style={{fontSize:12}}>{d.slice(8)}</div>
                    <div style={{fontSize:9,fontWeight:400}}>{off?'Off':hol?'Hol':DAY[new Date(d+'T00:00:00').getDay()]}</div>
                  </th>;
                })}
              </tr>
            </thead>
            <tbody>
              {staff.map(s=>(
                <tr key={s.id}>
                  <td style={{fontWeight:500,fontSize:13,position:'sticky',left:0,background:'var(--surface)',zIndex:1,padding:'7px 12px'}}>{s.name}</td>
                  {days.map(d=>{
                    const off=isWeeklyOff(d,weeklyOff),hol=isHoliday(d,holidays),fut=d>todaySt;
                    if(off||hol) return <td key={d} style={{textAlign:'center',padding:'7px 2px',background:off?'var(--p100)':'var(--g50)'}}><span style={{fontSize:11,color:off?'var(--p600)':'var(--g700)'}}>{off?'☀':'✦'}</span></td>;
                    return <AttCell key={d} value={monthAt[s.id]?.[d]} disabled={fut} isToday={d===todaySt} onChange={v=>editAttCell(s.id,d,v)}/>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
