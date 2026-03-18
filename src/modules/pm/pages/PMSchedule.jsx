import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SCHEDULES = [
  {id:'PMS-001',mc:'SPG-01',name:'Ring Frame Machine 01',type:'Quarterly PM',freq:'90 days',lastPM:'01 Nov 2024',nextPM:'01 Feb 2025',overdue:28,checklist:8,status:'Overdue',sb:'badge-critical',priority:'High'},
  {id:'PMS-002',mc:'CB-01', name:'Carding Beater',      type:'Monthly PM',freq:'30 days', lastPM:'15 Jan 2025',nextPM:'15 Feb 2025',overdue:14,checklist:6,status:'Overdue',sb:'badge-critical',priority:'High'},
  {id:'PMS-003',mc:'OE-01', name:'OE Spinning Machine', type:'Monthly PM', freq:'30 days', lastPM:'01 Feb 2025',nextPM:'01 Mar 2025',overdue:0, checklist:5,status:'Due Today',sb:'badge-hold',priority:'High'},
  {id:'PMS-004',mc:'WND-01',name:'Winding Machine',     type:'Monthly PM', freq:'30 days', lastPM:'05 Feb 2025',nextPM:'05 Mar 2025',overdue:-4,checklist:7,status:'In 4 days',sb:'badge-progress',priority:'Medium'},
  {id:'PMS-005',mc:'SPG-02',name:'Ring Frame Machine 02',type:'Quarterly PM',freq:'90 days',lastPM:'15 Dec 2024',nextPM:'15 Mar 2025',overdue:-14,checklist:8,status:'In 14 days',sb:'badge-released',priority:'Medium'},
  {id:'PMS-006',mc:'BLW-01',name:'Blow Room',           type:'Half-Yearly',freq:'180 days',lastPM:'01 Sep 2024',nextPM:'01 Mar 2025',overdue:0, checklist:12,status:'Due Today',sb:'badge-hold',priority:'High'},
  {id:'PMS-007',mc:'CRD-01',name:'Carding Machine',     type:'Monthly PM', freq:'30 days', lastPM:'20 Feb 2025',nextPM:'20 Mar 2025',overdue:-19,checklist:6,status:'In 19 days',sb:'badge-done',priority:'Low'},
  {id:'PMS-008',mc:'DRW-01',name:'Drawing Frame',       type:'Monthly PM', freq:'30 days', lastPM:'18 Feb 2025',nextPM:'18 Mar 2025',overdue:-17,checklist:5,status:'In 17 days',sb:'badge-done',priority:'Low'},
]

export default function PMSchedule() {
  const nav = useNavigate()
  const [chip, setChip] = useState('All')
  const filtered = chip==='All' ? SCHEDULES :
    chip==='Overdue' ? SCHEDULES.filter(s=>s.overdue>0) :
    chip==='Due Soon' ? SCHEDULES.filter(s=>s.overdue<=0&&s.overdue>=-7) :
    SCHEDULES.filter(s=>s.overdue<-7)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">PM Schedule <small>IW31 · Preventive Maintenance Calendar</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">📅 Calendar View</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pm/workorder')}>🔧 Create PM Work Order</button>
        </div>
      </div>

      <div className="pp-alert warn">⚠️ <strong>2 PMs Overdue</strong> — SPG-01 (28 days) and CB-01 (14 days) require immediate attention.</div>

      <div className="pp-chips">
        {['All','Overdue','Due Soon','Upcoming'].map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={() => setChip(c)}>{c}
            <span>{c==='All'?SCHEDULES.length:c==='Overdue'?SCHEDULES.filter(s=>s.overdue>0).length:c==='Due Soon'?SCHEDULES.filter(s=>s.overdue<=0&&s.overdue>=-7).length:SCHEDULES.filter(s=>s.overdue<-7).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Schedule ID</th><th>Machine</th><th>PM Type</th><th>Frequency</th>
          <th>Last PM</th><th>Next Due</th><th>Checklist Items</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(s=>(
            <tr key={s.id} style={{background:s.overdue>0?'#FFF5F5':s.overdue===0?'#FFFBF0':'inherit'}}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{s.id}</strong></td>
              <td>
                <strong>{s.mc}</strong>
                <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{s.name}</div>
              </td>
              <td>{s.type}</td>
              <td style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{s.freq}</td>
              <td>{s.lastPM}</td>
              <td style={{fontWeight:'600',color:s.overdue>0?'var(--odoo-red)':s.overdue===0?'var(--odoo-orange)':'inherit'}}>{s.nextPM}</td>
              <td style={{textAlign:'center'}}>{s.checklist} items</td>
              <td><span className={`badge ${s.sb}`}>
                {s.overdue>0?`⚠️ ${s.overdue}d Overdue`:s.overdue===0?'⏰ Due Today':s.status}
              </span></td>
              <td>
                <div style={{display:'flex',gap:'4px'}}>
                  <button className="btn-xs pri" onClick={() => nav('/pm/workorder')}>
                    {s.overdue>=0?'🔧 Start PM':'Schedule'}
                  </button>
                  <button className="btn-xs">Edit</button>
                  <button className="btn-xs" onClick={()=>nav('/print/wo')}>Print</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
