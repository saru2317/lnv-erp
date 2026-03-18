import React, { useState } from 'react'
import { EMPLOYEES } from './_sharedData'

const STEPS_PAYROLL = ['Attendance Lock','Deduction Calc','OT & Arrears','Net Pay Preview','Post & Generate']

export default function PayrollProcess() {
  const nav = require('react-router-dom').useNavigate()
  const [step, setStep] = useState(0)
  const [month, setMonth] = useState('February 2025')
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const runStep = () => {
    setRunning(true)
    setTimeout(() => { setRunning(false); if(step<4) setStep(s=>s+1); else setDone(true) }, 1500)
  }

  if (done) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}>💰</div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:'var(--odoo-green)'}}>
        Payroll Posted — {month}!
      </div>
      <div style={{fontSize:'13px',color:'var(--odoo-gray)'}}>
        {EMPLOYEES.length} payslips generated · Bank transfer initiated · FI journal posted
      </div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/hcm/pay/payslip')}>View Payslips</button>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/print/payslip')}>Print Payslip</button>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/hcm/pay/billcontrol')}>Pay Bill Control</button>
        <button className="btn btn-p sd-bsm" onClick={() => { setDone(false); setStep(0) }}>New Month</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Payroll Processing <small>{month}</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" onChange={e=>setMonth(e.target.value)}>
            <option>February 2025</option><option>March 2025</option>
          </select>
        </div>
      </div>

      {/* Progress steps */}
      <div style={{display:'flex',gap:'0',marginBottom:'24px',background:'#fff',borderRadius:'8px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
        {STEPS_PAYROLL.map((s,i)=>(
          <div key={s} style={{flex:1,padding:'14px',textAlign:'center',
            background:i<step?'var(--odoo-green)':i===step?'var(--odoo-purple)':'#fff',
            color:i<=step?'#fff':'var(--odoo-gray)',fontSize:'12px',fontWeight:'700',
            borderRight:'1px solid var(--odoo-border)'}}>
            <div style={{fontSize:'16px',marginBottom:'4px'}}>{i<step?'✅':i===step?'▶':'○'}</div>
            {s}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="fi-panel">
        <div className="fi-panel-hdr"><h3>{step===0?'🔒 Attendance Lock':step===1?'➖ Deductions':step===2?'⏱️ OT & Arrears':step===3?'👁️ Net Pay Preview':'📤 Post & Generate'}</h3></div>
        <div className="fi-panel-body">
          {step===0 && (
            <div>
              <div className="pp-alert info">Attendance for <strong>{month}</strong> will be locked. No further corrections allowed after this step.</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginTop:'12px'}}>
                {[['Working Days','26'],['Total Present','138 avg'],['Total Absent','10 emp-days'],
                  ['Leave Days','22 emp-days'],['LOP Days','3 emp-days'],['OT Hours','48.5 hrs']].map(([l,v])=>(
                  <div key={l} style={{background:'#F8F9FA',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                    <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',marginBottom:'4px'}}>{l}</div>
                    <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'18px',color:'var(--odoo-purple)'}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step===1 && (
            <div>
              <div className="pp-alert info">Auto-calculating PF, ESI, PT, LOP deductions for all employees.</div>
              <table className="fi-data-table">
                <thead><tr><th>Deduction</th><th>Employees</th><th>Total Amount</th></tr></thead>
                <tbody>
                  {[['PF Employee (12%)',EMPLOYEES.length,'₹28,560'],['ESI Employee (0.75%)',EMPLOYEES.filter(e=>e.basic<=17500).length,'₹4,820'],
                    ['Professional Tax (PT)',EMPLOYEES.length,'₹22,200'],['LOP Deduction',3,'₹1,840']].map(([d,n,amt])=>(
                    <tr key={d}><td>{d}</td><td style={{textAlign:'center'}}>{n}</td><td style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-red)'}}>{amt}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {step===2 && (
            <div>
              <div className="pp-alert info">Adding approved OT (48.5 hrs) and any pending arrears to payroll.</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                {[['Approved OT Pay','₹4,820','var(--odoo-green)'],['Arrears (if any)','₹0','var(--odoo-gray)'],['Bonus (if declared)','₹0','var(--odoo-gray)'],['Advance Deduction','₹2,000','var(--odoo-red)']].map(([l,v,c])=>(
                  <div key={l} style={{background:'#F8F9FA',borderRadius:'8px',padding:'14px',display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:'13px',fontWeight:'600'}}>{l}</span>
                    <strong style={{fontFamily:'DM Mono,monospace',color:c}}>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step===3 && (
            <div>
              <div className="pp-alert success">Net pay calculated for all {EMPLOYEES.length} employees. Review before posting.</div>
              <table className="fi-data-table">
                <thead><tr><th>Emp</th><th>Gross</th><th>Deductions</th><th>Net Pay</th></tr></thead>
                <tbody>
                  {EMPLOYEES.slice(0,5).map(e=>{
                    const gross=e.basic+Math.round(e.basic*0.30)+Math.round(e.basic*0.10)+800+500
                    const ded=Math.min(Math.round(e.basic*0.12),1800)+Math.round(gross*0.0075)+150
                    return (
                      <tr key={e.id}>
                        <td><strong>{e.name}</strong></td>
                        <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>{gross.toLocaleString()}</td>
                        <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-red)'}}>{ded.toLocaleString()}</td>
                        <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)',fontWeight:'800'}}>{(gross-ded).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                  <tr style={{fontWeight:'700',background:'#F8F9FA'}}><td>... +{EMPLOYEES.length-5} more employees</td><td colSpan={3}></td></tr>
                </tbody>
              </table>
              <div style={{background:'var(--odoo-purple)',color:'#fff',borderRadius:'8px',padding:'14px',marginTop:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:'11px',opacity:.8}}>TOTAL NET PAY BILL</div>
                  <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'24px'}}>₹18,40,280</div>
                </div>
                <div style={{fontSize:'12px',opacity:.8}}>148 employees · Feb 2025</div>
              </div>
            </div>
          )}
          {step===4 && (
            <div>
              <div className="pp-alert warn">⚠️ <strong>Final step!</strong> This will generate payslips, post the salary journal in FI, and initiate bank transfer batch.</div>
              {[['📄 Generate payslips for all 148 employees','✅'],
                ['💳 Create bank transfer file (NEFT batch)','✅'],
                ['📒 Post salary journal to FI (GL entries)','✅'],
                ['📊 Update PF/ESI registers','✅'],
                ['📧 Email payslips to employees','Optional']].map(([task,status])=>(
                <div key={task} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--odoo-border)',fontSize:'13px'}}>
                  <span>{task}</span><strong style={{color:'var(--odoo-green)'}}>{status}</strong>
                </div>
              ))}
            </div>
          )}

          <div style={{marginTop:'16px',display:'flex',gap:'10px'}}>
            {step>0 && <button className="btn btn-s sd-bsm" onClick={()=>setStep(s=>s-1)}>← Back</button>}
            <button className="btn btn-p sd-bsm" onClick={runStep} disabled={running} style={{minWidth:'160px'}}>
              {running?'⏳ Processing...':step<4?'▶ Run This Step':'📤 Post Payroll'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
