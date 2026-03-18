import React, { useState } from 'react'

const DEFAULT_LEAVE_TYPES = [
  {code:'EL',name:'Earned Leave',days:15,carry:true,encash:true,period:'Annual',accrual:'1.25/month',medical:false,notice:'7 days',active:true},
  {code:'CL',name:'Casual Leave',days:12,carry:false,encash:false,period:'Annual',accrual:'1/month',medical:false,notice:'1 day',active:true},
  {code:'SL',name:'Sick Leave',days:12,carry:false,encash:false,period:'Annual',accrual:'1/month',medical:true,notice:'Same day',active:true},
  {code:'FH',name:'Festival Holiday',days:5,carry:false,encash:false,period:'Annual',accrual:'Fixed',medical:false,notice:'Pre-declared',active:true},
  {code:'ML',name:'Maternity Leave',days:182,carry:false,encash:false,period:'Per Occurrence',accrual:'On event',medical:true,notice:'N/A',active:true},
  {code:'PL',name:'Paternity Leave',days:7,carry:false,encash:false,period:'Per Occurrence',accrual:'On event',medical:false,notice:'N/A',active:true},
  {code:'LOP',name:'Loss of Pay',days:999,carry:false,encash:false,period:'As Needed',accrual:'N/A',medical:false,notice:'N/A',active:true},
]

const WEEKOFF_OPTIONS = [
  {id:'sun_only',label:'Sunday Only',desc:'6 working days · 1 week-off (Sunday)'},
  {id:'sun_sat',label:'Sunday + Alternate Saturday',desc:'5½ working days · 1st & 3rd Sat off'},
  {id:'sun_allsat',label:'Sunday + All Saturdays',desc:'5 working days · All weekends off (Staff only)'},
  {id:'rotational',label:'Rotational Week-Off',desc:'1 day off per 7-day cycle — rotates per roster (Workers)'},
]

export default function LeavePolicy() {
  const [leaves, setLeaves] = useState(DEFAULT_LEAVE_TYPES)
  const [weekoff, setWeekoff] = useState({Staff:'sun_allsat',Worker:'rotational',Contractor:'rotational'})
  const [saved, setSaved] = useState(false)
  const [modal, setModal] = useState(null)

  const toggleLeave = (code) => setLeaves(ls=>ls.map(l=>l.code===code?{...l,active:!l.active}:l))
  const updateDays = (code,val) => setLeaves(ls=>ls.map(l=>l.code===code?{...l,days:parseInt(val)||0}:l))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Leave & Week-Off Policy <small>Company-defined rules</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => setModal('add')}>➕ Add Leave Type</button>
          <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>💾 Save Policy</button>
        </div>
      </div>

      {saved && <div className="pp-alert success">✅ Leave policy saved! Changes will apply from 1 April 2025 onwards.</div>}

      <div className="pp-alert info">🔧 <strong>Company-configurable:</strong> Enable/disable leave types, change entitlements, carry-forward rules. These policies apply to all employees. Department-specific overrides can be set per employee.</div>

      {/* Leave Types */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📅 Leave Types Configuration</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr>
              <th>Active</th><th>Code</th><th>Leave Type</th><th>Entitlement (days/yr)</th>
              <th>Carry Forward</th><th>Encashable</th><th>Accrual</th><th>Medical Cert?</th><th>Notice</th>
            </tr></thead>
            <tbody>
              {leaves.map(l=>(
                <tr key={l.code} style={{opacity:l.active?1:.5}}>
                  <td>
                    <input type="checkbox" checked={l.active} onChange={()=>toggleLeave(l.code)}
                      style={{width:'18px',height:'18px',accentColor:'var(--odoo-green)',cursor:'pointer'}}/>
                  </td>
                  <td><span className={`leave-${l.code.toLowerCase()}`}>{l.code}</span></td>
                  <td><strong>{l.name}</strong></td>
                  <td>
                    <input type="number" value={l.days} onChange={e=>updateDays(l.code,e.target.value)}
                      disabled={l.code==='LOP'} min="0" max="365"
                      style={{width:'70px',border:'1.5px solid var(--odoo-border)',borderRadius:'5px',
                        padding:'5px 8px',fontSize:'13px',fontWeight:'700',textAlign:'center',
                        background:l.code==='LOP'?'#F8F9FA':'#fff'}}/>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span style={{color:l.carry?'var(--odoo-green)':'var(--odoo-gray)',fontWeight:'700'}}>{l.carry?'✅ Yes':'✕ No'}</span>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span style={{color:l.encash?'var(--odoo-green)':'var(--odoo-gray)',fontWeight:'700'}}>{l.encash?'✅ Yes':'✕ No'}</span>
                  </td>
                  <td style={{fontSize:'12px',color:'var(--odoo-gray)'}}>{l.accrual}</td>
                  <td style={{textAlign:'center'}}>
                    <span style={{color:l.medical?'var(--odoo-orange)':'var(--odoo-gray)'}}>{l.medical?'⚠️ Yes':'—'}</span>
                  </td>
                  <td style={{fontSize:'12px'}}>{l.notice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Week-Off Rules */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📅 Week-Off Configuration per Employee Category</div>
        <div className="fi-form-sec-body">
          {Object.entries(weekoff).map(([cat,selected])=>(
            <div key={cat} style={{marginBottom:'16px'}}>
              <div style={{fontWeight:'700',fontSize:'13px',color:'var(--odoo-dark)',marginBottom:'8px'}}>
                {cat === 'Staff' ? '👔' : cat==='Worker'?'🔧':'🏗️'} {cat}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'8px'}}>
                {WEEKOFF_OPTIONS.map(opt=>(
                  <label key={opt.id} style={{
                    display:'flex',gap:'10px',alignItems:'flex-start',padding:'10px 12px',
                    borderRadius:'8px',cursor:'pointer',
                    border:`2px solid ${selected===opt.id?'var(--odoo-purple)':'var(--odoo-border)'}`,
                    background:selected===opt.id?'#F7F0F5':'#fff',transition:'all .15s'}}>
                    <input type="radio" name={`weekoff_${cat}`} checked={selected===opt.id}
                      onChange={()=>setWeekoff(w=>({...w,[cat]:opt.id}))}
                      style={{marginTop:'2px',accentColor:'var(--odoo-purple)'}}/>
                    <div>
                      <div style={{fontWeight:'700',fontSize:'13px'}}>{opt.label}</div>
                      <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginTop:'2px'}}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Year Settings */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">⚙️ Leave Year Settings</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Leave Year</label>
              <select className="fi-form-ctrl"><option>January to December</option><option>April to March</option><option>Custom</option></select>
            </div>
            <div className="fi-form-grp"><label>EL Credit Date</label>
              <select className="fi-form-ctrl"><option>1st January (Annual)</option><option>Monthly (1.25 days/month)</option></select>
            </div>
            <div className="fi-form-grp"><label>CL/SL Credit Date</label>
              <select className="fi-form-ctrl"><option>1st January (Annual)</option><option>Monthly (1 day/month)</option></select>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Max EL Carry Forward (days)</label><input type="number" className="fi-form-ctrl" defaultValue="45"/></div>
            <div className="fi-form-grp"><label>Max EL Encashment per year</label><input type="number" className="fi-form-ctrl" defaultValue="30"/></div>
            <div className="fi-form-grp"><label>Leave Application allowed</label>
              <select className="fi-form-ctrl"><option>Advance only (before leave)</option><option>Advance + Retroactive (within 3 days)</option></select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
