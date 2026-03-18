import React, { useState } from 'react'
import { EMPLOYEES } from './_sharedData'

const DAYS = Array.from({length:28},(_,i)=>i+1)
const ATT_STATUS = ['P','P','P','P','P','WK','P','P','P','P','P','WK','P','LV','P','P','P','P','WK','P','P','P','P','P','WK','P','P','P']
const ATT_COLORS = {P:'att-p',A:'att-a',LV:'att-lv',WK:'att-wk',H:'att-h',OT:'att-ot','P+OT':'att-ot','HD':'att-h'}

// Slightly varied attendance per employee
const getAtt = (empIdx, day) => {
  const statuses = ['P','P','P','P','P','WK','P','P','P','P','P','WK','P','P','P','P','P','P','WK','P','P','P','P','P','WK','P','P','P']
  if (day===14 && empIdx===1) return 'LV'
  if (day===21 && empIdx===3) return 'A'
  if (day===5 && empIdx===0) return 'P+OT'
  if (day===12 && empIdx===2) return 'P+OT'
  return statuses[(day-1)%statuses.length]
}

export default function AttendanceRegister() {
  const [month, setMonth] = useState('February 2025')
  const [dept, setDept] = useState('All')

  const filtered = dept==='All' ? EMPLOYEES : EMPLOYEES.filter(e=>e.dept===dept)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Attendance Register <small>{month}</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" onChange={e=>setMonth(e.target.value)}>
            <option>February 2025</option><option>March 2025</option>
          </select>
          <select className="fi-filter-select" onChange={e=>setDept(e.target.value)}>
            <option>All</option><option>Production</option><option>Quality</option><option>Maintenance</option><option>Accounts</option>
          </select>
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm">📤 Post to Payroll</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'14px',fontSize:'11px'}}>
        {[['P','Present','att-p'],['A','Absent','att-a'],['LV','Leave','att-lv'],
          ['WK','Week Off','att-wk'],['H','Holiday','att-h'],['P+OT','Present + OT','att-ot']].map(([code,label,cls])=>(
          <div key={code} style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <span className={`att-cell ${cls}`} style={{width:'24px',height:'24px',fontSize:'9px'}}>{code}</span>
            <span style={{color:'var(--odoo-gray)'}}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse',minWidth:'max-content',width:'100%'}}>
          <thead>
            <tr style={{background:'#F0EEEB'}}>
              <th style={{padding:'10px 12px',fontSize:'11px',fontWeight:'700',textAlign:'left',position:'sticky',left:0,background:'#F0EEEB',zIndex:2,minWidth:'180px',borderBottom:'2px solid var(--odoo-border)'}}>Employee</th>
              <th style={{padding:'10px 8px',fontSize:'11px',fontWeight:'700',textAlign:'left',position:'sticky',left:180,background:'#F0EEEB',zIndex:2,minWidth:'80px',borderBottom:'2px solid var(--odoo-border)'}}>Shift</th>
              {DAYS.map(d=>(
                <th key={d} style={{padding:'6px 2px',fontSize:'10px',fontWeight:'700',textAlign:'center',minWidth:'30px',borderBottom:'2px solid var(--odoo-border)',
                  color:[6,13,20,27].includes(d)?'var(--odoo-orange)':'var(--odoo-dark)'}}>{d}</th>
              ))}
              <th style={{padding:'10px 8px',fontSize:'11px',fontWeight:'700',textAlign:'center',borderBottom:'2px solid var(--odoo-border)'}}>P</th>
              <th style={{padding:'10px 8px',fontSize:'11px',fontWeight:'700',textAlign:'center',borderBottom:'2px solid var(--odoo-border)'}}>A</th>
              <th style={{padding:'10px 8px',fontSize:'11px',fontWeight:'700',textAlign:'center',borderBottom:'2px solid var(--odoo-border)'}}>LV</th>
              <th style={{padding:'10px 8px',fontSize:'11px',fontWeight:'700',textAlign:'center',borderBottom:'2px solid var(--odoo-border)'}}>OT hrs</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp,ei)=>{
              const attRow = DAYS.map(d=>getAtt(ei,d))
              const present = attRow.filter(a=>a==='P'||a==='P+OT').length
              const absent = attRow.filter(a=>a==='A').length
              const leave = attRow.filter(a=>a==='LV').length
              const ot = attRow.filter(a=>a==='P+OT').length * 2
              return (
                <tr key={emp.id} style={{borderBottom:'1px solid var(--odoo-border)'}}>
                  <td style={{padding:'8px 12px',position:'sticky',left:0,background:'#fff',zIndex:1,boxShadow:'2px 0 4px rgba(0,0,0,.04)'}}>
                    <div style={{fontWeight:'700',fontSize:'12px'}}>{emp.name}</div>
                    <div style={{fontSize:'10px',color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace'}}>{emp.id} · {emp.dept}</div>
                  </td>
                  <td style={{padding:'8px',position:'sticky',left:180,background:'#fff',zIndex:1}}>
                    <span className={`shift-${emp.shift.toLowerCase().replace('general','gen')}`}>{emp.shift}</span>
                  </td>
                  {attRow.map((att,di)=>(
                    <td key={di} style={{padding:'3px 2px',textAlign:'center'}}>
                      <span className={`att-cell ${ATT_COLORS[att]||'att-p'}`}
                        style={{fontSize:'8px',width:'24px',height:'24px'}}>
                        {att.replace('+OT','*')}
                      </span>
                    </td>
                  ))}
                  <td style={{textAlign:'center',fontWeight:'700',color:'var(--odoo-green)',fontSize:'12px'}}>{present}</td>
                  <td style={{textAlign:'center',fontWeight:'700',color:absent>0?'var(--odoo-red)':'var(--odoo-gray)',fontSize:'12px'}}>{absent||'—'}</td>
                  <td style={{textAlign:'center',fontWeight:'700',color:'var(--odoo-blue)',fontSize:'12px'}}>{leave||'—'}</td>
                  <td style={{textAlign:'center',fontWeight:'700',color:'var(--odoo-purple)',fontSize:'12px',fontFamily:'DM Mono,monospace'}}>{ot||'—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
