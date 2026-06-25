import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { StatCard, SectionHeader, ConfirmModal, EmptyState } from '../components/UI.jsx';
import StaffModal        from '../components/StaffModal.jsx';
import AttModal          from '../components/AttModal.jsx';
import LoanModal         from '../components/LoanModal.jsx';
import ImportPreviewModal from '../components/ImportPreviewModal.jsx';
import { calcSalary, todayStr, monthKey, inr, formatMonth, normKey, clone } from '../utils/helpers.js';
import { ATT_STATUSES, ATT_LABELS, BRANCHES } from '../utils/constants.js';

const ATT_BG  = {P:'#d4edda',PL:'var(--b100)',UL:'var(--a100)',A:'var(--r100)'};
const ATT_COL = {P:'#1a6b35',PL:'var(--b600)',UL:'var(--a600)',A:'var(--r600)'};

function buildWhatsApp(s,sal,savings,loan,isConf,curMonth) {
  const [y,m]=curMonth.split('-');
  const ML=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const label=`${ML[Number(m)-1]} ${y}`;
  return `Hi ${s.name},\n\n📋 *Attendance & Salary — ${label}*\n━━━━━━━━━━━━━━━━━━━━━\n*Attendance*\nPresent       : ${sal.daysPresent}\nPaid Leave    : ${sal.daysPL}\nUnpaid Leave  : ${sal.daysUL}\nAbsent        : ${sal.daysAbsent}\nPaid Days     : ${sal.paidDays}\n\n*Salary*\nMonthly Salary   : ${inr(s.salary)}\nDaily Rate       : ${inr(sal.dailyRate)}\nTill-date Salary : ${inr(sal.tillDateSalary)}\nFixed Cutting    : ${inr(sal.fixedCut)}\nAdvance Deducted : ${inr(sal.advanceCut)}\nLoan Recovery    : ${inr(sal.loanCut)}\nCommission Earned : ${inr(sal.commEarned)}\nNet Payable       : ${inr(sal.netPayable)}\n\n💰 *Savings*\nMonthly Deduction : ${inr(s.fixedCutting)}\nThis Month        : ${isConf?'✅ Confirmed':'⏳ Pending'}\nTotal Savings     : ${inr(savings.total)}\n\n🏦 *Loan*\nTotal Loan        : ${inr(loan.total)}\nMonthly Recovery  : ${inr(loan.monthly)}\nRemaining         : ${inr(loan.remaining)}\n\n— Vandana Shopping Mall Management`;
}

function ColHeaders({ sortCol, sortDir, onSort, colFilters, setColFilters }) {
  const cols = [
    {k:'id',l:'ID',w:70,f:true,s:true}, {k:'name',l:'Name',w:160,f:true,s:true}, {k:'_att',l:'Today',w:170},
    {k:'designation',l:'Role',w:130,f:true,s:true}, {k:'branch',l:'Branch',w:150,f:true,s:true},
    {k:'phone',l:'Phone',w:115,f:true,s:true}, {k:'altPhone',l:'Alt Phone',w:115,f:true},
    {k:'aadhar',l:'Aadhar',w:155,f:true}, {k:'dob',l:'DOB',w:110},
    {k:'salary',l:'Salary',w:110,s:true}, {k:'fixedCutting',l:'Fixed Cut',w:95,s:true},
    {k:'_comm',l:'Comm.',w:90}, {k:'advance',l:'Advance',w:90,s:true},
    {k:'extraAdvance',l:'Loan',w:90,s:true}, {k:'monthlyRecovery',l:'EMI',w:90,s:true},
    {k:'totalOutstanding',l:'Outstdng',w:100,s:true}, {k:'_confirm',l:'Savings',w:100},
    {k:'totalSavings',l:'Tot. Sav',w:100,s:true},
    {k:'_p',l:'P',w:40}, {k:'_pl',l:'PL',w:40}, {k:'_ul',l:'UL',w:40}, {k:'_a',l:'A',w:40},
    {k:'_tillDate',l:'Till-date',w:110}, {k:'_net',l:'Net Payable',w:110}, {k:'_actions',l:'',w:140}
  ];
  return (
    <tr>
      {cols.map(c => (
        <th key={c.k} style={{minWidth:c.w, position:'relative'}}>
          <div style={{display:'flex', alignItems:'center', gap:4, cursor:c.s?'pointer':'default'}} onClick={()=>c.s&&onSort(c.k)}>
            {c.l}
            {c.s && <i className={`ti ti-sort-${sortCol===c.k?(sortDir==='asc'?'ascending':'descending'):'unsorted'}`} style={{fontSize:12, opacity:sortCol===c.k?1:0.3}}/>}
          </div>
          {c.f && (
            <input
              value={colFilters[c.k]||''}
              onChange={e=>setColFilters(p=>({...p, [c.k]:e.target.value}))}
              placeholder="Filter..."
              style={{width:'100%', padding:'2px 4px', fontSize:10, marginTop:4, border:'1px solid var(--border)', borderRadius:4, fontWeight:400}}
              onClick={e=>e.stopPropagation()}
            />
          )}
        </th>
      ))}
    </tr>
  );
}

export default function DashboardPage({
  staff,allAtt,monthAtt,holidays,weeklyOff,curMonth,setCurMonth,curBranch,setCurBranch,
  allMonths,
  markAllPresent,markOne,addStaff,updateStaff,deleteStaff,
  getSavings,confirmSavings,unconfirmSavings,getLoan,setLoan,addLoanPayment,
  getCommission,
  undo,redo,canUndo,canRedo,pushHistoryDirect,snapshot,bulkSetStaff,showToast,
  applyBulkImport
}) {
  const [search,     setSearch]     = useState('');
  const [addModal,   setAddModal]   = useState(false);
  const [editStaff,  setEditStaff]  = useState(null);
  const [attStaff,   setAttStaff]   = useState(null);
  const [loanStaff,  setLoanStaff]  = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [importChanges, setImportChanges] = useState(null);
  const [filterAdv,  setFilterAdv]  = useState(false);
  const [filterLoan, setFilterLoan] = useState(false);
  const [filterDesig,setFilterDesig]= useState('ALL');
  const [colFilters, setColFilters] = useState({});  // {colKey: filterText}
  const [sortCol,    setSortCol]    = useState(null);
  const [sortDir,    setSortDir]    = useState('asc');
  const importRef = useRef();

  const todaySt    = todayStr();
  const isCurMonth = monthKey(todaySt)===curMonth;

  const months = allMonths || [curMonth];

  // Get commission earned by a staff member in curMonth
  function getStaffCommission(staffId) {
    const commData = getCommission ? getCommission(curMonth) : [];
    const entry = commData.find(d => d.staffId === staffId);
    if (!entry) {
      // Check if this staff is a helper
      const helperEntry = commData.find(d => (d.helpers||[]).includes(staffId));
      if (helperEntry) return helperEntry.perHelper || 0;
      return 0;
    }
    return entry.empComm || 0;
  }

  // Branch filter
  const branchStaff = curBranch==='ALL BRANCHES' ? staff : staff.filter(s=>s.branch===curBranch);

  // Search + extra filters + col filters + sort
  const filtered = (() => {
    let arr = branchStaff.filter(s=>{
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())||String(s.id).includes(search);
      const matchAdv    = !filterAdv   || Number(s.advance)>0;
      const matchLoan   = !filterLoan  || getLoan(s.id).remaining>0;
      const matchDesig  = filterDesig==='ALL' || s.designation===filterDesig;
      // column filters
      const matchCols   = Object.entries(colFilters).every(([k,v])=>{
        if(!v) return true;
        const val = String(s[k]||'').toLowerCase();
        return val.includes(v.toLowerCase());
      });
      return matchSearch&&matchAdv&&matchLoan&&matchDesig&&matchCols;
    });
    if(sortCol){
      arr=[...arr].sort((a,b)=>{
        let av=a[sortCol]||'', bv=b[sortCol]||'';
        if(!isNaN(Number(av))&&!isNaN(Number(bv))){ av=Number(av); bv=Number(bv); }
        else { av=String(av).toLowerCase(); bv=String(bv).toLowerCase(); }
        if(av<bv) return sortDir==='asc'?-1:1;
        if(av>bv) return sortDir==='asc'?1:-1;
        return 0;
      });
    }
    return arr;
  })();

  // Summary
  const presentToday  = branchStaff.filter(s=>(monthAtt[s.id]||{})[todaySt]==='P').length;
  const plToday       = branchStaff.filter(s=>(monthAtt[s.id]||{})[todaySt]==='PL').length;
  const absentToday   = branchStaff.filter(s=>(monthAtt[s.id]||{})[todaySt]==='A').length;
  const unmarked      = isCurMonth ? branchStaff.filter(s=>!(monthAtt[s.id]||{})[todaySt]).length : 0;
  const withAdvance   = branchStaff.filter(s=>Number(s.advance)>0).length;
  const withLoan      = branchStaff.filter(s=>getLoan(s.id).remaining>0).length;

  // ── Excel import ────────────────────────────────────────────────────────────
  function handleImportFile(e) {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=evt=>{
      try {
        const wb=XLSX.read(evt.target.result,{type:'binary'});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const rows=XLSX.utils.sheet_to_json(ws,{defval:''});
        const MERGE=['advance','extraAdvance','totalSavings'];
        const NUM=['salary','fixedCutting','advance','extraAdvance','monthlyRecovery','totalOutstanding','totalSavings'];
        const FIELD_MAP={
          'id':['id','empid','employeeid'],'name':['name','fullname','staffname','employeename'],
          'designation':['designation','role','position'],'branch':['branch','branchname'],
          'aadhar':['aadhar','aadharnumber','aadharno'],'phone':['phone','phoneno','mobile','mobileno'],
          'altPhone':['alternatemobileno','altmobile','altphone','phone2'],
          'dob':['dob','dateofbirth','birthdate'],
          'salary':['salary','monthlysalary','ctc'],'fixedCutting':['fixedcutting','fixedcut','savings','savingspermonth'],
          'advance':['advance','advancetaken'],'extraAdvance':['extraadvance','loan','loanamount'],
          'monthlyRecovery':['monthlyrecovery','loanrecovery','emiamount'],
          'totalOutstanding':['totaloutstanding','remainingloan','loanbalance'],
          'totalSavings':['totalsavings','accumulatedsavings'],
        };
        const changes=[];
        rows.forEach(row=>{
          const r={}; Object.keys(row).forEach(k=>{r[normKey(k)]=row[k];});
          const mapped={};
          Object.entries(FIELD_MAP).forEach(([ourKey,aliases])=>{
            for(const alias of aliases){const v=r[alias]; if(v!==undefined&&v!==''){mapped[ourKey]=String(v).trim();return;}}
          });
          NUM.forEach(k=>{if(mapped[k]!==undefined) mapped[k]=Number(mapped[k])||0;});
          const rowId=String(mapped.id||'').trim();
          const rowName=String(mapped.name||'').trim().toUpperCase();
          if(!rowId&&!rowName) return;
          const exist=staff.find(s=>(rowId&&String(s.id)===rowId)||(rowName&&s.name.toUpperCase()===rowName));
          if(exist){
            const diffs=[];
            Object.entries(mapped).forEach(([k,newV])=>{
              if(k==='id'||k==='name') return;
              let finalV=newV;
              if(MERGE.includes(k)) finalV=(Number(exist[k])||0)+(Number(newV)||0);
              if(String(finalV)!==String(exist[k]||'')) diffs.push({field:k,old:exist[k],new:finalV,importedVal:newV});
            });
            if(diffs.length) changes.push({type:'update',id:exist.id,name:exist.name,diffs,mapped});
          } else if(rowName){
            const generatedId = rowId || `VM${String(Date.now() + changes.length).slice(-5)}`;
            const mappedWithId = { ...mapped, id: generatedId };
            changes.push({type:'add',id:generatedId,name:rowName,diffs:[],mapped:mappedWithId});
          }
        });
        if(!changes.length){showToast('No changes detected in import','info');return;}
        setImportChanges(changes);
      } catch(err){ showToast('Import failed: '+err.message,'error'); }
    };
    reader.readAsBinaryString(file);
    e.target.value='';
  }

  async function applyImport(finalChanges) {
    const toApply = finalChanges || importChanges;
    const snap=snapshot();
    const newStaff=clone(staff);
    toApply.forEach(c=>{
      if(c.type==='update'){
        const idx=newStaff.findIndex(s=>String(s.id)===String(c.id));
        if(idx<0) return;
        c.diffs.forEach(d=>{ newStaff[idx][d.field]=d.new; });
      } else {
        newStaff.push({id:c.id,name:c.name,designation:'',branch:'',aadhar:'',phone:'',altPhone:'',dob:'',salary:0,fixedCutting:0,advance:0,extraAdvance:0,monthlyRecovery:0,totalOutstanding:0,totalSavings:0,...(c.mapped||{})});
      }
    });
    try {
      if (applyBulkImport) await applyBulkImport(toApply);
      pushHistoryDirect(snap);
      bulkSetStaff(()=>newStaff);
      setImportChanges(null);
      const upd=toApply.filter(c=>c.type==='update').length;
      const add=toApply.filter(c=>c.type==='add').length;
      showToast(`Import applied — ${upd} updated, ${add} added`);
    } catch(e) {
      showToast('Import failed to save to database', 'error');
    }
  }

  function handleMarkAll(){ const ok=markAllPresent(); if(ok) showToast(`All staff marked Present`); else showToast('Current month only','warn'); }

  function sendWA(s,sal,savings,loan,isConf) {
    const msg=buildWhatsApp(s,sal,savings,loan,isConf,curMonth);
    const waCfg=JSON.parse(localStorage.getItem('vm_wa')||'{}');
    if(waCfg.token&&waCfg.phoneId&&s.phone){
      fetch(`https://graph.facebook.com/v18.0/${waCfg.phoneId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${waCfg.token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:`91${s.phone}`,type:'text',text:{body:msg}})})
        .then(r=>r.json()).then(d=>{ if(d.messages) showToast(`Sent to ${s.name}`); else showToast('WA error: '+d.error?.message,'error'); })
        .catch(()=>showToast('Network error','error'));
    } else {
      window.open(`https://wa.me/91${s.phone}?text=${encodeURIComponent(msg)}`,'_blank');
      showToast('Opened WhatsApp Web');
    }
  }

  return (
    <div>
      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:10,marginBottom:18}}>
        <StatCard icon="ti-users"          label="Total Staff"       value={branchStaff.length}  color="var(--g800)"   accent="var(--g50)"/>
        <StatCard icon="ti-user-check"     label="Present Today"     value={presentToday}         color="#1a6b35"       accent="#d4edda"/>
        <StatCard icon="ti-beach"          label="On Leave"          value={plToday}              color="var(--b600)"   accent="var(--b100)"/>
        <StatCard icon="ti-user-off"       label="Absent Today"      value={absentToday}          color="var(--r600)"   accent="var(--r100)"/>
        {isCurMonth&&<StatCard icon="ti-clock-question" label="Unmarked"   value={unmarked}         color="var(--a600)"   accent="var(--a100)"/>}
        <StatCard icon="ti-cash"           label="With Advance"      value={withAdvance}          color="var(--a600)"   accent="var(--a100)"  onClick={()=>{setFilterAdv(p=>!p);setFilterLoan(false);}} />
        <StatCard icon="ti-credit-card"    label="Pending Loans"     value={withLoan}             color="var(--r600)"   accent="var(--r100)"  onClick={()=>{setFilterLoan(p=>!p);setFilterAdv(false);}} />
      </div>

      {/* Active filter badge */}
      {(filterAdv||filterLoan)&&(
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,padding:'6px 12px',background:'var(--a100)',borderRadius:8,width:'fit-content'}}>
          <i className="ti ti-filter" style={{fontSize:13,color:'var(--a600)'}}/>
          <span style={{fontSize:12,color:'var(--a600)',fontWeight:500}}>Filtered: {filterAdv?'With Advance':'Pending Loans'}</span>
          <button className="btn btn-xs" onClick={()=>{setFilterAdv(false);setFilterLoan(false);}} style={{color:'var(--a600)',borderColor:'var(--a600)',marginLeft:4}}>Clear</button>
        </div>
      )}

      {/* Controls */}
      <SectionHeader title={`Staff — ${formatMonth(curMonth)}${Object.values(colFilters).some(v=>v)||filterDesig!=='ALL'?' (Filtered)':''}`}>
        <div style={{position:'relative'}}>
          <i className="ti ti-search" style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',fontSize:13,pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or ID…" style={{paddingLeft:29,width:180}}/>
        </div>
        <select value={curBranch} onChange={e=>setCurBranch(e.target.value)} style={{width:'auto'}}>
          {BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filterDesig} onChange={e=>setFilterDesig(e.target.value)} style={{width:'auto'}}>
          <option value="ALL">All Designations</option>
          {[...new Set(staff.map(s=>s.designation).filter(Boolean))].sort().map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select value={curMonth} onChange={e=>setCurMonth(e.target.value)} style={{width:'auto'}}>
          {months.map(m=><option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
        {/* Clear all column filters button */}
        {Object.values(colFilters).some(v=>v) && (
          <button className="btn btn-sm btn-danger" onClick={()=>setColFilters({})} title="Clear all column filters">
            <i className="ti ti-filter-off"/> Clear Filters
          </button>
        )}
        {isCurMonth&&<button className="btn btn-sm btn-primary" onClick={handleMarkAll}><i className="ti ti-checks"/> Mark All Present</button>}
        <button className="btn btn-sm" onClick={()=>setAddModal(true)}><i className="ti ti-user-plus"/> Add Staff</button>
        <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={handleImportFile}/>
        <button className="btn btn-sm" onClick={()=>importRef.current?.click()}><i className="ti ti-file-import"/> Import</button>
        <div style={{display:'flex',gap:3}}>
          <button className="btn btn-sm btn-icon" onClick={undo} disabled={!canUndo} title="Undo"><i className="ti ti-arrow-back-up"/></button>
          <button className="btn btn-sm btn-icon" onClick={redo} disabled={!canRedo} title="Redo"><i className="ti ti-arrow-forward-up"/></button>
        </div>
      </SectionHeader>

      {/* Table */}
      <div className="card" style={{overflow:'auto',maxHeight:'calc(100vh - 310px)'}}>
        {filtered.length===0
          ? <EmptyState icon="ti-users" title="No staff found" sub="Adjust your search or branch filter."/>
          : (
          <table>
            <thead>
              <ColHeaders
                sortCol={sortCol} sortDir={sortDir}
                onSort={(col)=>{ if(sortCol===col){setSortDir(d=>d==='asc'?'desc':'asc');}else{setSortCol(col);setSortDir('asc');} }}
                colFilters={colFilters}
                setColFilters={setColFilters}
              />
            </thead>
            <tbody>
              {filtered.map(s=>{
                const sAtt      = monthAtt[s.id]||{};
                const commEarned = getStaffCommission(s.id);
                const sal        = calcSalary({...s,_commEarned:commEarned},sAtt,curMonth,weeklyOff,holidays);
                const saved  = getSavings(s.id);
                const loan   = getLoan(s.id);
                const isConf = saved.confirmed.includes(curMonth);
                const todayStat = sAtt[todaySt];
                return (
                  <tr key={s.id}>
                    <td style={{color:'var(--t3)',fontSize:11,fontWeight:500}}>{s.id}</td>
                    <td style={{fontWeight:600,minWidth:160}}>{s.name}</td>
                    <td style={{minWidth:170}}>
                      {isCurMonth
                        ? <div style={{display:'flex',gap:3}}>
                            {ATT_STATUSES.map(st=>(
                              <button key={st} onClick={()=>markOne(s.id,todaySt,st)} className="btn btn-xs"
                                style={{background:todayStat===st?ATT_BG[st]:'var(--s2)',borderColor:todayStat===st?ATT_COL[st]:'var(--border)',color:todayStat===st?ATT_COL[st]:'var(--t3)',fontWeight:600,minWidth:30,justifyContent:'center'}}
                                title={ATT_LABELS[st]}>{st}</button>
                            ))}
                          </div>
                        : <span style={{color:'var(--t3)',fontSize:12}}>Past month</span>
                      }
                    </td>
                    <td><span style={{fontSize:12,color:'var(--t2)'}}>{s.designation||'—'}</span></td>
                    <td><span style={{fontSize:11,padding:'2px 7px',borderRadius:99,background:'var(--g50)',color:'var(--g800)',fontWeight:500,border:'1px solid var(--g100)',whiteSpace:'nowrap'}}>{s.branch||'—'}</span></td>
                    <td style={{fontSize:12,color:'var(--t2)'}}>{s.phone||'—'}</td>
                    <td style={{fontSize:12,color:'var(--t3)'}}>{s.altPhone||'—'}</td>
                    <td style={{fontSize:12,color:'var(--t3)',letterSpacing:'.01em'}}>{s.aadhar||'—'}</td>
                    <td style={{fontSize:12,color:'var(--t2)'}}>{s.dob||'—'}</td>
                    <td style={{fontWeight:500}}>{inr(s.salary)}</td>
                    <td style={{color:'var(--b600)',fontWeight:500}}>{inr(s.fixedCutting)}</td>
                    <td>
                      <span style={{fontWeight:600,color:commEarned>0?'#1a6b35':'var(--t3)',background:commEarned>0?'#d4edda':'var(--s2)',padding:'2px 8px',borderRadius:99,fontSize:12}}>
                        {commEarned>0?'+'+inr(commEarned):'—'}
                      </span>
                    </td>
                    <td style={{color:Number(s.advance)>0?'var(--a600)':'var(--t3)'}}>{inr(s.advance)}</td>
                    <td>
                      <button onClick={()=>setLoanStaff(s)} className="btn btn-xs"
                        style={{color:Number(s.extraAdvance)>0||loan.remaining>0?'var(--r600)':'var(--t3)',borderColor:Number(s.extraAdvance)>0||loan.remaining>0?'var(--r100)':'var(--border)',background:Number(s.extraAdvance)>0||loan.remaining>0?'var(--r50)':'var(--s2)'}}>
                        {inr(loan.remaining||s.extraAdvance||0)}
                      </button>
                    </td>
                    <td style={{color:'var(--r600)',fontWeight:500}}>{inr(s.monthlyRecovery)}</td>
                    <td style={{color:'var(--r600)'}}>{inr(loan.remaining||s.totalOutstanding||0)}</td>
                    <td>
                      <button onClick={()=>isConf?unconfirmSavings(s.id,curMonth):confirmSavings(s.id,curMonth)}
                        className="btn btn-xs"
                        style={{background:isConf?'#d4edda':'var(--s2)',borderColor:isConf?'#1a6b35':'var(--border)',color:isConf?'#1a6b35':'var(--t2)'}}>
                        <i className={`ti ${isConf?'ti-check':'ti-clock'}`}/>{isConf?'Confirmed':'Confirm'}
                      </button>
                    </td>
                    <td style={{fontWeight:600,color:'var(--b600)'}}>{inr(saved.total)}</td>
                    <td style={{color:'#1a6b35',fontWeight:600}}>{sal.daysPresent}</td>
                    <td style={{color:'var(--b600)'}}>{sal.daysPL}</td>
                    <td style={{color:'var(--a600)'}}>{sal.daysUL}</td>
                    <td style={{color:'var(--r600)'}}>{sal.daysAbsent}</td>
                    <td style={{fontWeight:600,color:'var(--g800)'}}>{inr(sal.tillDateSalary)}</td>
                    <td><span style={{fontWeight:700,color:sal.netPayable<0?'var(--r600)':'var(--t1)'}}>{inr(sal.netPayable)}</span></td>
                    <td>
                      <div style={{display:'flex',gap:3}}>
                        <button className="btn btn-xs btn-icon" onClick={()=>setAttStaff(s)} title="Attendance calendar"><i className="ti ti-calendar"/></button>
                        <button className="btn btn-xs btn-icon" onClick={()=>setLoanStaff(s)} title="Loan details"><i className="ti ti-credit-card"/></button>
                        <button className="btn btn-xs btn-icon" onClick={()=>setEditStaff(s)} title="Edit"><i className="ti ti-edit"/></button>
                        <button className="btn btn-xs btn-icon" onClick={()=>sendWA(s,sal,saved,loan,isConf)} title="WhatsApp" style={{color:'#25d366',borderColor:'#b2dfce'}}><i className="ti ti-brand-whatsapp"/></button>
                        <button className="btn btn-xs btn-icon btn-danger" onClick={()=>setConfirmDel(s)} title="Delete"><i className="ti ti-trash"/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {addModal&&<StaffModal onSave={d=>{addStaff(d);showToast('Staff added');setAddModal(false);}} onClose={()=>setAddModal(false)}/>}
      {editStaff&&<StaffModal existing={editStaff} onSave={d=>{updateStaff(editStaff.id,d);showToast('Updated');setEditStaff(null);}} onClose={()=>setEditStaff(null)}/>}
      {attStaff&&<AttModal staffName={attStaff.name} staffId={attStaff.id} sAtt={monthAtt[attStaff.id]||{}} curMonth={curMonth} weeklyOff={weeklyOff} holidays={holidays} onMark={markOne} onClose={()=>setAttStaff(null)}/>}
      {loanStaff&&<LoanModal staff={loanStaff} loanData={getLoan(loanStaff.id)} onSave={d=>{setLoan(loanStaff.id,d);updateStaff(loanStaff.id,{extraAdvance:d.total,monthlyRecovery:d.monthly,totalOutstanding:d.remaining});showToast('Loan updated');}} onPayment={(amt,note)=>{addLoanPayment(loanStaff.id,amt,note);showToast(`Payment of ${inr(amt)} recorded`);}} onClose={()=>setLoanStaff(null)}/>}
      {confirmDel&&<ConfirmModal title="Delete Staff Member" message={`Permanently delete ${confirmDel.name}? All data will be removed.`} danger onConfirm={()=>{deleteStaff(confirmDel.id);setConfirmDel(null);showToast(`${confirmDel.name} removed`);}} onCancel={()=>setConfirmDel(null)}/>}
      {importChanges&&<ImportPreviewModal changes={importChanges} onConfirm={(final)=>applyImport(final)} onCancel={()=>setImportChanges(null)}/>}
    </div>
  );
}
