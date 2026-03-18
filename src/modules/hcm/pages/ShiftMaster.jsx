import React, { useState } from 'react'

const SHIFTS = [
  {code:'GEN',name:'General Shift',in:'09:00',out:'17:30',break:30,hrs:8,ot_after:8,ot_rate:1.5,applies:'Staff',days:'Mon-Sat',weekoff:'Sun',clr:'var(--odoo-purple)'},
  {code:'A',  name:'A Shift (Morning)',in:'06:00',out:'14:00',break:30,hrs:8,ot_after:8,ot_rate:2.0,applies:'Worker',days:'All 7',weekoff:'Rotational',clr:'var(--odoo-green)'},
  {code:'B',  name:'B Shift (Afternoon)',in:'14:00',out:'22:00',break:30,hrs:8,ot_after:8,ot_rate:2.0,applies:'Worker',days:'All 7',weekoff:'Rotational',clr:'var(--odoo-blue)'},
  {code:'C',  name:'C Shift (Night)',in:'22:00',out:'06:00',break:30,hrs:8,ot_after:8,ot_rate:2.5,applies:'Worker',days:'All 7',weekoff:'Rotational',clr:'var(--odoo-orange)'},
  {code:'EXT',name:'Extended (Staff OT)',in:'09:00',out:'21:00',break:60,hrs:11,ot_after:8.5,ot_rate:1.5,applies:'Staff',days:'Weekdays',weekoff:'Sat-Sun',clr:'var(--odoo-red)'},
]

const OT_RULES = [
  {category:'Worker (Factory Act)',ot_calc:'Hourly Rate × 2 (Double)',min_ot:'30 mins',max_ot:'Unlimited',approval:'Supervisor',payout:'Monthly with salary'},
  {category:'Staff (Monthly)',ot_calc:'Monthly Basic ÷ 208 hrs × 1.5',min_ot:'1 hour',max_ot:'50 hrs/month',approval:'Manager',payout:'Monthly with salary'},
  {category:'Contractor',ot_calc:'As per contract rate',min_ot:'1 hour',max_ot:'As agreed',approval:'Contractor supervisor',payout:'Contractor invoice'},
]

export default function ShiftMaster() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Shift Master <small>Shift Configuration & OT Rules</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm">Add Shift</button>
        </div>
      </div>

      <div className="pp-alert info">⚙️ <strong>Shift assignment</strong> is done per employee in Employee Master. Week-off logic is defined per shift below. OT is auto-calculated from attendance punch-out time.</div>

      {/* Shift cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'14px',marginBottom:'20px'}}>
        {SHIFTS.map(s=>(
          <div key={s.code} style={{background:'#fff',borderRadius:'10px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',
            borderLeft:`4px solid ${s.clr}`,cursor:'pointer',transition:'all .15s',
            border:`1.5px solid ${expanded===s.code?s.clr:'transparent'}`,borderLeftWidth:'4px'}}
            onClick={() => setExpanded(expanded===s.code?null:s.code)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'16px',color:s.clr}}>{s.code}</div>
                <div style={{fontWeight:'700',fontSize:'13px',color:'var(--odoo-dark)'}}>{s.name}</div>
              </div>
              <span style={{background:`${s.clr}18`,color:s.clr,padding:'3px 10px',borderRadius:'10px',fontSize:'11px',fontWeight:'700'}}>{s.applies}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginTop:'12px',fontSize:'12px'}}>
              {[['🕐 In',s.in],['🕕 Out',s.out],['☕ Break',`${s.break} min`],['⏱️ Hours',`${s.hrs} hrs`],
                ['📅 Days',s.days],['🏖️ Week Off',s.weekoff]].map(([l,v])=>(
                <div key={l}>
                  <span style={{color:'var(--odoo-gray)'}}>{l}: </span>
                  <strong style={{fontFamily:l==='🕐 In'||l==='🕕 Out'?'DM Mono,monospace':'inherit'}}>{v}</strong>
                </div>
              ))}
            </div>
            <div style={{marginTop:'10px',padding:'8px',background:`${s.clr}10`,borderRadius:'6px',fontSize:'11px'}}>
              <strong>OT Rate:</strong> {s.ot_rate}× rate after {s.ot_after} hrs
            </div>
          </div>
        ))}
      </div>

      {/* OT Rules */}
      <div className="fi-panel">
        <div className="fi-panel-hdr"><h3>⏱️ Overtime Rules by Employee Category</h3></div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>Category</th><th>OT Calculation</th><th>Min OT</th><th>Max OT</th><th>Approval</th><th>Payout</th></tr></thead>
            <tbody>
              {OT_RULES.map(r=>(
                <tr key={r.category}>
                  <td><strong>{r.category}</strong></td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-blue)'}}>{r.ot_calc}</td>
                  <td>{r.min_ot}</td>
                  <td>{r.max_ot}</td>
                  <td>{r.approval}</td>
                  <td>{r.payout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Week-off logic */}
      <div className="fi-panel" style={{marginTop:'14px'}}>
        <div className="fi-panel-hdr"><h3>📅 Week-Off Logic</h3></div>
        <div className="fi-panel-body">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
            {[{type:'Staff — Fixed',rule:'Sunday is week-off for all staff. Saturdays: Working (1st/3rd Sat off optional per policy)',clr:'var(--odoo-blue)'},
              {type:'Worker — Rotational',rule:'Week-off rotates weekly. Each shift crew gets one day off per 7-day cycle. Posted in advance via roster.',clr:'var(--odoo-green)'},
              {type:'Contractor',rule:'As per contract terms. Usually 1 day off per week. Managed by contractor supervisor.',clr:'var(--odoo-orange)'},
            ].map(w=>(
              <div key={w.type} style={{background:'#F8F9FA',borderRadius:'8px',padding:'14px',borderLeft:`3px solid ${w.clr}`}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:w.clr,marginBottom:'6px'}}>{w.type}</div>
                <div style={{fontSize:'12px',color:'var(--odoo-gray)',lineHeight:'1.5'}}>{w.rule}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
