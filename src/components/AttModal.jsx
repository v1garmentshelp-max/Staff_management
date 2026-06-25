import { Modal } from './UI.jsx';
import { dateRange,isWeeklyOff,isHoliday,getFirstDOW,todayStr,monthKey,formatMonth,DAY_ABBR } from '../utils/helpers.js';

const CYCLE=['P','PL','UL','A',null];
const next = cur => CYCLE[(CYCLE.indexOf(cur)+1)%CYCLE.length];
const BG={P:'#d4edda',PL:'var(--b100)',UL:'var(--a100)',A:'var(--r100)'};
const CL={P:'#1a6b35',PL:'var(--b600)',UL:'var(--a600)',A:'var(--r600)'};

export default function AttModal({staffName,staffId,sAtt,curMonth,weeklyOff,holidays,onMark,onClose}) {
  const days=dateRange(curMonth), first=getFirstDOW(curMonth), today=todayStr(), isCur=monthKey(today)===curMonth;
  function click(d){ if(!isCur||isWeeklyOff(d,weeklyOff)||isHoliday(d,holidays)||d>today) return; onMark(staffId,d,next(sAtt[d]||null)); }
  return (
    <Modal title={`${staffName} — ${formatMonth(curMonth)}`} onClose={onClose} width={520}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:3}}>
        {DAY_ABBR.map(d=><div key={d} style={{textAlign:'center',fontSize:11,fontWeight:600,color:'var(--t3)',padding:'3px 0'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
        {Array(first).fill(null).map((_,i)=><div key={'b'+i}/>)}
        {days.map(d=>{
          const off=isWeeklyOff(d,weeklyOff),hol=isHoliday(d,holidays),st=sAtt[d],isToday=d===today,fut=d>today;
          let bg=off?'var(--p100)':hol?'var(--g50)':fut?'var(--s2)':BG[st]||'var(--s2)';
          let col=off?'var(--p600)':hol?'var(--g700)':fut?'var(--border2)':CL[st]||'var(--t3)';
          return (
            <div key={d} onClick={()=>click(d)} style={{borderRadius:7,background:bg,padding:'7px 3px',textAlign:'center',cursor:(!off&&!hol&&!fut&&isCur)?'pointer':'default',border:isToday?'2px solid var(--g800)':'2px solid transparent',transition:'all .1s'}}>
              <div style={{fontSize:12,fontWeight:600,color:col}}>{Number(d.slice(8))}</div>
              <div style={{fontSize:10,color:col}}>{off?'Off':hol?'Hol':st||'—'}</div>
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:'5px 12px',marginTop:14}}>
        {[['#d4edda','#1a6b35','Present'],['var(--b100)','var(--b600)','Paid Leave'],['var(--a100)','var(--a600)','Unpaid Leave'],['var(--r100)','var(--r600)','Absent'],['var(--p100)','var(--p600)','Weekly Off'],['var(--g50)','var(--g700)','Holiday']].map(([bg,c,l])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:4,fontSize:11}}>
            <div style={{width:10,height:10,borderRadius:3,background:bg,flexShrink:0}}/><span style={{color:c,fontWeight:500}}>{l}</span>
          </div>
        ))}
      </div>
      {isCur&&<p style={{fontSize:11,color:'var(--t3)',marginTop:8,textAlign:'center'}}><i className="ti ti-info-circle"/> Click a day to cycle P → PL → UL → A → clear</p>}
    </Modal>
  );
}
