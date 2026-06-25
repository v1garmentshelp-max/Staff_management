import { useState } from 'react';
import { Modal, Field } from './UI.jsx';
import { genId } from '../utils/helpers.js';
import { BRANCHES, DESIGNATIONS } from '../utils/constants.js';

export default function StaffModal({ existing, onSave, onClose }) {
  const [form,setForm]=useState(existing||{id:'',name:'',designation:'',branch:'',aadhar:'',phone:'',altPhone:'',dob:'',salary:'',fixedCutting:'',advance:'0',extraAdvance:'0',monthlyRecovery:'0',totalOutstanding:'0',totalSavings:'0'});
  const [errors,setErrors]=useState({});
  const f=(k,v)=>{ setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:undefined})); };
  function validate(){ const e={}; if(!form.name.trim()) e.name='Required'; if(!form.salary||Number(form.salary)<0) e.salary='Required'; return e; }
  function save(){
    const e=validate(); if(Object.keys(e).length){setErrors(e);return;}
    onSave({...form,id:form.id.trim()||genId('VM'),salary:Number(form.salary),fixedCutting:Number(form.fixedCutting||0),advance:Number(form.advance||0),extraAdvance:Number(form.extraAdvance||0),monthlyRecovery:Number(form.monthlyRecovery||0),totalOutstanding:Number(form.totalOutstanding||0),totalSavings:Number(form.totalSavings||0)});
    onClose();
  }
  const err=(k)=>errors[k]&&<p style={{fontSize:11,color:'var(--r600)',marginTop:3}}>{errors[k]}</p>;
  const ni=(k,opts={})=><input value={form[k]||''} onChange={e=>f(k,e.target.value)} style={{borderColor:errors[k]?'var(--r600)':undefined}} {...opts}/>;
  const nn=(k,opts={})=><input type="number" min={0} value={form[k]||''} onChange={e=>f(k,e.target.value)} {...opts}/>;

  return (
    <Modal title={existing?'Edit Staff Member':'Add New Staff Member'} onClose={onClose} width={620}>
      {/* Section: Identity */}
      <p style={{fontSize:11,fontWeight:600,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Identity</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>
        <Field label="Employee ID" hint={existing?'Cannot be changed':'Auto-generated if blank'}>
          {ni('id',{disabled:!!existing,placeholder:'e.g. 1085',style:{background:existing?'var(--s2)':undefined}})}
        </Field>
        <Field label="Full Name" required>{ni('name',{placeholder:'e.g. KINTHALI SURESH'})}{err('name')}</Field>
        <Field label="Designation">
          <select value={form.designation} onChange={e=>f('designation',e.target.value)}>
            <option value="">Select…</option>
            {DESIGNATIONS.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Branch">
          <select value={form.branch} onChange={e=>f('branch',e.target.value)}>
            <option value="">Select…</option>
            {BRANCHES.filter(b=>b!=='ALL BRANCHES').map(b=><option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Aadhar Number">{ni('aadhar',{placeholder:'XXXX XXXX XXXX'})}</Field>
        <Field label="Date of Birth"><input type="date" value={form.dob||''} onChange={e=>f('dob',e.target.value)}/></Field>
        <Field label="Phone">{ni('phone',{placeholder:'10-digit',maxLength:10})}</Field>
        <Field label="Alternate Phone">{ni('altPhone',{placeholder:'10-digit',maxLength:10})}</Field>
      </div>

      <div className="divider"/>
      {/* Section: Financials */}
      <p style={{fontSize:11,fontWeight:600,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Financial Details</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 14px'}}>
        <Field label="Monthly Salary (₹)" required>{nn('salary',{placeholder:'e.g. 15000'})}{err('salary')}</Field>
        <Field label="Fixed Cutting / Month (₹)" hint="Savings deduction">{nn('fixedCutting',{placeholder:'e.g. 500'})}</Field>
        <Field label="Advance (₹)" hint="Recovered same month">{nn('advance',{placeholder:'0'})}</Field>
        <Field label="Extra Advance / Loan (₹)" hint="Long-term loan total">{nn('extraAdvance',{placeholder:'0'})}</Field>
        <Field label="Monthly Recovery (₹)" hint="Loan instalment">{nn('monthlyRecovery',{placeholder:'0'})}</Field>
        <Field label="Total Outstanding (₹)" hint="Remaining loan balance">{nn('totalOutstanding',{placeholder:'0'})}</Field>
        <Field label="Total Savings (₹)" hint="Accumulated savings">{nn('totalSavings',{placeholder:'0'})}</Field>
      </div>

      <div className="divider"/>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
        <button className="btn btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-sm btn-primary" onClick={save}><i className="ti ti-device-floppy"/>{existing?'Save Changes':'Add Staff'}</button>
      </div>
    </Modal>
  );
}
