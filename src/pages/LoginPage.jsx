import { useState } from 'react';
import { APP_PASSWORD } from '../utils/constants.js';

export default function LoginPage({ onLogin }) {
  const [pw,setPw]=useState(''); const [err,setErr]=useState(false); const [shake,setShake]=useState(false);
  function attempt() {
    if(pw===APP_PASSWORD){ onLogin(); }
    else{ setErr(true); setShake(true); setTimeout(()=>setShake(false),450); setTimeout(()=>setErr(false),2000); }
  }
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(145deg,#0a2218,#1a5c3a 60%,#0a2a1a)',display:'flex',alignItems:'center',justifyContent:'center',padding:24,position:'relative',overflow:'hidden'}}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}.lcard{animation:fadeUp .4s ease both}`}</style>
      <div style={{position:'absolute',top:-100,right:-100,width:360,height:360,borderRadius:'50%',background:'rgba(201,162,39,.06)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-60,left:-60,width:240,height:240,borderRadius:'50%',background:'rgba(38,138,89,.07)',pointerEvents:'none'}}/>
      <div className="lcard" style={{background:'rgba(255,255,255,.97)',borderRadius:20,padding:'42px 46px',width:'100%',maxWidth:400,boxShadow:'0 32px 80px rgba(0,0,0,.35)',animation:shake?'shake .4s ease':undefined}}>
        <div style={{textAlign:'center',marginBottom:30}}>
          <div style={{width:58,height:58,borderRadius:15,background:'var(--g800)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:26,boxShadow:'0 8px 24px rgba(26,92,58,.3)'}}>🛒</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:28,color:'var(--g800)',fontWeight:700,marginBottom:3}}>Vandana Mall</h1>
          <p style={{fontSize:12,color:'var(--t3)'}}>Staff Management System</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
          <div style={{flex:1,height:1,background:'var(--border)'}}/>
          <span style={{fontSize:10,color:'var(--t3)',fontWeight:500,textTransform:'uppercase',letterSpacing:'.06em'}}>Manager Access</span>
          <div style={{flex:1,height:1,background:'var(--border)'}}/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--t2)',marginBottom:5}}>Password</label>
          <div style={{position:'relative'}}>
            <i className="ti ti-lock" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:15,color:err?'var(--r600)':'var(--t3)',transition:'color .2s'}}/>
            <input type="password" placeholder="Enter password" value={pw}
              onChange={e=>{setPw(e.target.value);setErr(false);}}
              onKeyDown={e=>e.key==='Enter'&&attempt()} autoFocus
              style={{paddingLeft:33,borderColor:err?'var(--r600)':undefined,boxShadow:err?'0 0 0 3px rgba(192,57,43,.1)':undefined}}/>
          </div>
          {err&&<p style={{fontSize:11,color:'var(--r600)',marginTop:5,display:'flex',alignItems:'center',gap:4}}><i className="ti ti-alert-circle" style={{fontSize:12}}/>Incorrect password. Please try again.</p>}
        </div>
        <button className="btn btn-primary" onClick={attempt} style={{width:'100%',justifyContent:'center',padding:'9px',fontSize:13,borderRadius:8}}>
          <i className="ti ti-login"/> Enter Dashboard
        </button>
        <p style={{textAlign:'center',fontSize:11,color:'var(--t3)',marginTop:18}}>Vandana Shopping Mall · Manager Portal</p>
      </div>
    </div>
  );
}
