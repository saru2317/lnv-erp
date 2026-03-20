import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CHECKLIST_ITEMS = {
  'Quarterly PM': [
    'Check & lubricate all spindle bearings',
    'Inspect and replace worn ring travellers',
    'Clean and blow down spindle blade area',
    'Check spindle speed — target 17,500 RPM',
    'Inspect and tension all drive belts',
    'Check and align drafting rollers',
    'Test emergency stop and safety guards',
    'Check control panel — all indicator lamps',
  ],
  'Monthly PM': [
    'Lubricate machine bearings',
    'Clean machine surfaces and oil spillage',
    'Inspect drive belts for wear',
    'Check electrical connections — tighten',
    'Test safety devices and guards',
    'Log meter reading and cycle count',
  ],
}

export default function PMWorkOrder() {
  const nav = useNavigate()
  const [pmType, setPmType] = useState('Quarterly PM')
  const [checks, setChecks] = useState(CHECKLIST_ITEMS['Quarterly PM'].map((c,i)=>({id:i,label:c,done:false,remark:''})))
  const [saved, setSaved] = useState(false)

  const toggle = (id) => setChecks(checks.map(c => c.id===id ? {...c, done:!c.done} : c))
  const doneCount = checks.filter(c=>c.done).length
  const pct = Math.round(doneCount/checks.length*100)

  const switchType = (t) => {
    setPmType(t)
    setChecks(CHECKLIST_ITEMS[t].map((c,i)=>({id:i,label:c,done:false,remark:''})))
  }

  if (saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}></div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:'var(--odoo-green)'}}>PMW-2025-012 Completed!</div>
      <div style={{fontSize:'13px',color:'var(--odoo-gray)'}}>Checklist: {doneCount}/{checks.length} items · Next PM auto-scheduled</div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/print/wo')}>Print WO</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/schedule')}>← PM Schedule</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/pm/log')}>View Log</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">PM Work Order <small>PMW-2025-012 · Maintenance Execution</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/schedule')}>← Back</button>
          <button className="btn btn-s sd-bsm">Save Progress</button>
          <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)} disabled={pct<100}>
            {pct===100 ? ' Complete PM' : `${pct}% Done`}
          </button>
        </div>
      </div>

      {/* WO Header */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Work Order Details</div>
        <div className="fi-form-sec-body">
          <div className="acct-strip">
            {[['WO No.','PMW-2025-012'],['Machine','SPG-01 · Ring Frame M/C'],['PM Type',pmType],
              ['Technician','Suresh M.'],['Start Date','01 Mar 2025'],['PM Schedule','PMS-001']].map(([l,v])=>(
              <div key={l} className="acct-strip-item"><span>{l}</span><div>{v}</div></div>
            ))}
          </div>

          {/* PM type toggle */}
          <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
            {Object.keys(CHECKLIST_ITEMS).map(t=>(
              <button key={t} className={`btn ${pmType===t?'btn-p':'btn-s'} sd-bsm`} onClick={() => switchType(t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">
           PM Checklist — {pmType}
          <span style={{marginLeft:'auto',fontSize:'12px',color:'var(--odoo-gray)'}}>
            {doneCount}/{checks.length} completed
          </span>
        </div>
        <div style={{padding:'0'}}>
          {/* Progress bar */}
          <div style={{padding:'10px 14px 0',borderBottom:'1px solid var(--odoo-border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
              <span>Completion Progress</span>
              <strong style={{color:pct===100?'var(--odoo-green)':pct>50?'var(--odoo-orange)':'var(--odoo-blue)'}}>{pct}%</strong>
            </div>
            <div style={{background:'#F0EEEB',borderRadius:'4px',height:'8px',marginBottom:'12px'}}>
              <div style={{width:`${pct}%`,height:'100%',borderRadius:'4px',
                background:pct===100?'var(--odoo-green)':pct>50?'var(--odoo-orange)':'var(--odoo-blue)',transition:'width .3s'}}></div>
            </div>
          </div>
          {checks.map((c,i)=>(
            <div key={c.id} style={{
              display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',
              borderBottom:'1px solid var(--odoo-border)',
              background:c.done?'#F0FFF8':'inherit',
              transition:'background .2s'
            }}>
              <input type="checkbox" checked={c.done} onChange={() => toggle(c.id)}
                style={{width:'18px',height:'18px',cursor:'pointer',accentColor:'var(--odoo-green)'}}/>
              <div style={{flex:1}}>
                <span style={{fontSize:'13px',fontWeight:'600',
                  textDecoration:c.done?'line-through':'none',
                  color:c.done?'var(--odoo-gray)':'var(--odoo-dark)'}}>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)',marginRight:'8px'}}>
                    {String(i+1).padStart(2,'0')}
                  </span>
                  {c.label}
                </span>
              </div>
              <input placeholder="Remark..." value={c.remark}
                onChange={e=>setChecks(checks.map(x=>x.id===c.id?{...x,remark:e.target.value}:x))}
                style={{width:'160px',border:'1px solid var(--odoo-border)',borderRadius:'4px',
                  padding:'4px 8px',fontSize:'11px',color:'var(--odoo-gray)'}}/>
              {c.done && <span style={{color:'var(--odoo-green)',fontSize:'16px'}}></span>}
            </div>
          ))}

          {pct===100 && (
            <div className="pp-alert success" style={{margin:'14px'}}>
               All checklist items completed! You can now close this PM Work Order.
            </div>
          )}
        </div>
      </div>

      {/* Spare Parts Used */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Spare Parts Used</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>Spare Part</th><th>Part No.</th><th>Qty Used</th><th>Cost</th></tr></thead>
            <tbody>
              <tr>
                <td>Ring Travellers Set</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>SP-0021</td>
                <td><input type="number" defaultValue="2" style={{width:'60px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px'}}/></td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>₹480</td>
              </tr>
              <tr>
                <td>Lubricant — Spindle Oil</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>SP-0055</td>
                <td><input type="number" defaultValue="1" style={{width:'60px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px'}}/></td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>₹320</td>
              </tr>
            </tbody>
          </table>
          <div style={{padding:'10px 14px'}}><button className="btn btn-s sd-bsm">Add Spare Used</button></div>
        </div>
      </div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/schedule')}>← Back</button>
        <button className="btn btn-s sd-bsm">Save Progress</button>
        <button className="btn btn-p sd-bsm" disabled={pct<100} onClick={() => setSaved(true)}>
          {pct===100?' Complete PM':`Complete Checklist First (${pct}%)`}
        </button>
      </div>
    </div>
  )
}
