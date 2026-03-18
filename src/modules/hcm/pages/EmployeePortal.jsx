import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ME = {id:'EMP-004',name:'Rajesh Kumar',dept:'Production',desg:'Operator',shift:'B',grade:'W2'}
const LEAVES=[{type:'EL',bal:12},{type:'CL',bal:8},{type:'SL',bal:10},{type:'FH',bal:5}]
const PAYSLIPS=[{m:'February 2025',net:13840},{m:'January 2025',net:13540},{m:'December 2024',net:13840}]

export default function EmployeePortal() {
  const nav = useNavigate()
  const [tab,setTab]=useState('home')
  const [leaveForm,setLeaveForm]=useState({type:'CL',from:'',to:'',reason:''})
  const [submitted,setSubmitted]=useState(false)

  return (
    <div>
      <div style={{background:'var(--odoo-purple)',borderRadius:'10px',padding:'20px',color:'#fff',marginBottom:'16px'}}>
        <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'50%',background:'rgba(255,255,255,.2)',
            display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'20px'}}>RK</div>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'18px'}}>Welcome, {ME.name}! 👋</div>
            <div style={{fontSize:'12px',opacity:.8}}>{ME.desg} · {ME.dept} · {ME.grade} · Shift {ME.shift}</div>
            <div style={{fontSize:'11px',opacity:.6,marginTop:'2px'}}>{ME.id} · {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:'4px',marginBottom:'16px',background:'#fff',borderRadius:'8px',padding:'6px',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        {[['home','🏠 Home'],['leave','📅 Apply Leave'],['payslip','💰 Payslips'],['attendance','📊 Attendance']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'8px',border:'none',borderRadius:'6px',cursor:'pointer',
            fontSize:'12px',fontWeight:'700',background:tab===t?'var(--odoo-purple)':'transparent',
            color:tab===t?'#fff':'var(--odoo-gray)',transition:'all .2s'}}>{l}</button>
        ))}
      </div>

      {tab==='home' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'16px'}}>
            {LEAVES.map(l=>(
              <div key={l.type} style={{background:'#fff',borderRadius:'8px',padding:'14px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',textAlign:'center'}}>
                <span className={`leave-${l.type.toLowerCase()}`}>{l.type}</span>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'24px',color:'var(--odoo-green)',margin:'6px 0'}}>{l.bal}</div>
                <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>days available</div>
              </div>
            ))}
          </div>
          <div className="fi-panel"><div className="fi-panel-hdr"><h3>⚡ Quick Actions</h3></div>
            <div className="fi-panel-body" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              {[['📅 Apply Leave',()=>setTab('leave')],['💰 View Payslip',()=>setTab('payslip')],
                ['📊 Attendance',()=>setTab('attendance')],['📄 HR Policies',()=>nav('/hcm/policy')]].map(([l,fn])=>(
                <button key={l} className="btn btn-s sd-bsm" style={{justifyContent:'flex-start'}} onClick={fn}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==='leave' && (
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📅 Apply for Leave</h3></div>
          <div className="fi-panel-body">
            {submitted ? (
              <div style={{textAlign:'center',padding:'20px'}}>
                <div style={{fontSize:'36px',marginBottom:'10px'}}>✅</div>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',color:'var(--odoo-green)'}}>Leave Applied!</div>
                <div style={{fontSize:'13px',color:'var(--odoo-gray)',margin:'8px 0'}}>Application sent to your supervisor for approval.</div>
                <button className="btn btn-s sd-bsm" onClick={()=>setSubmitted(false)}>Apply Another</button>
              </div>
            ) : (
              <div>
                <div className="fi-form-row">
                  <div className="fi-form-grp"><label>Leave Type</label>
                    <select className="fi-form-ctrl" onChange={e=>setLeaveForm(f=>({...f,type:e.target.value}))}>
                      {LEAVES.map(l=><option key={l.type} value={l.type}>{l.type} — {l.bal} days available</option>)}
                    </select>
                  </div>
                  <div className="fi-form-grp"><label>From Date</label><input type="date" className="fi-form-ctrl" onChange={e=>setLeaveForm(f=>({...f,from:e.target.value}))}/></div>
                  <div className="fi-form-grp"><label>To Date</label><input type="date" className="fi-form-ctrl" onChange={e=>setLeaveForm(f=>({...f,to:e.target.value}))}/></div>
                </div>
                <div className="fi-form-grp"><label>Reason</label>
                  <textarea className="fi-form-ctrl" rows={3} placeholder="Reason for leave..." onChange={e=>setLeaveForm(f=>({...f,reason:e.target.value}))}></textarea>
                </div>
                <button className="btn btn-p sd-bsm" onClick={()=>setSubmitted(true)}>Submit Application</button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab==='payslip' && (
        <div className="fi-panel"><div className="fi-panel-hdr"><h3>My Payslips</h3></div>
          <div className="fi-panel-body">
            {PAYSLIPS.map(p=>(
              <div key={p.m} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                <div><div style={{fontWeight:'700',fontSize:'13px'}}>{p.m}</div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>Net Pay: <strong style={{color:'var(--odoo-purple)'}}>₹{p.net.toLocaleString()}</strong></div>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button className="btn-xs" onClick={()=>nav('/hcm/pay/payslip')}>View</button>
                  <button className="btn-xs">PDF</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='attendance' && (
        <div className="pp-alert info"><strong>Feb 2025:</strong> Present 24/26 days · 0 Absent · 1 CL · 1 WFH · 3.5 hrs OT</div>
      )}
    </div>
  )
}
