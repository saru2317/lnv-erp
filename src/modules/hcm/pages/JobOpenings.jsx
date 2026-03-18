import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const JOBS = [
  {id:'JOB-024',title:'Ring Frame Operator',dept:'Production',type:'Worker',positions:3,filled:1,posted:'15 Feb',closing:'31 Mar',priority:'High',sb:'badge-open',sl:'Open'},
  {id:'JOB-023',title:'QC Inspector',dept:'Quality',type:'Staff',positions:1,filled:0,posted:'10 Feb',closing:'28 Mar',priority:'High',sb:'badge-open',sl:'Open'},
  {id:'JOB-022',title:'Maintenance Technician',dept:'Maintenance',type:'Worker',positions:2,filled:1,posted:'01 Feb',closing:'15 Mar',priority:'Medium',sb:'badge-progress',sl:'In Progress'},
  {id:'JOB-021',title:'Sr. Accounts Executive',dept:'Accounts',type:'Staff',positions:1,filled:1,posted:'20 Jan',closing:'—',priority:'Low',sb:'badge-done',sl:'Filled'},
  {id:'JOB-020',title:'Warehouse Supervisor',dept:'Warehouse',type:'Staff',positions:1,filled:0,posted:'05 Feb',closing:'20 Mar',priority:'Medium',sb:'badge-open',sl:'Open'},
]

export default function JobOpenings() {
  const nav = useNavigate()
  const [chip, setChip] = useState('All')
  const [modal, setModal] = useState(null)
  const filtered = chip==='All'?JOBS:JOBS.filter(j=>j.sl===chip)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Job Openings <small>Recruitment Pipeline</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/hcm/candidates')}>👥 Candidates</button>
          <button className="btn btn-p sd-bsm" onClick={() => setModal('new')}>➕ New Position</button>
        </div>
      </div>

      <div className="hcm-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        {[{cls:'purple',l:'Open Positions',v:'4',s:'Across 4 departments'},
          {cls:'blue',l:'In Process',v:'8',s:'Candidates being evaluated'},
          {cls:'green',l:'Offered',v:'2',s:'Offer letters sent'},
          {cls:'orange',l:'Avg Time to Hire',v:'22 days',s:'Target: ≤ 30 days'},
        ].map(k=>(
          <div key={k.l} className={`hcm-kpi-card ${k.cls}`}>
            <div className="hcm-kpi-label">{k.l}</div>
            <div className="hcm-kpi-value">{k.v}</div>
            <div className="hcm-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="pp-chips">
        {['All','Open','In Progress','Filled'].map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={()=>setChip(c)}>
            {c} <span>{c==='All'?JOBS.length:JOBS.filter(j=>j.sl===c).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Job ID</th><th>Position</th><th>Dept</th><th>Type</th>
          <th>Positions</th><th>Filled</th><th>Posted</th><th>Closing</th><th>Priority</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(j=>(
            <tr key={j.id} style={{cursor:'pointer'}} onClick={() => nav('/hcm/candidates')}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{j.id}</strong></td>
              <td><strong>{j.title}</strong></td>
              <td>{j.dept}</td>
              <td><span style={{fontSize:'11px',fontWeight:'600',
                color:j.type==='Staff'?'var(--odoo-blue)':'var(--odoo-orange)'}}>{j.type}</span></td>
              <td style={{textAlign:'center'}}>{j.positions}</td>
              <td style={{textAlign:'center',color:j.filled===j.positions?'var(--odoo-green)':j.filled>0?'var(--odoo-orange)':'var(--odoo-gray)'}}>
                {j.filled}/{j.positions}</td>
              <td style={{fontSize:'11px'}}>{j.posted}</td>
              <td style={{fontSize:'11px',color:j.closing==='—'?'var(--odoo-gray)':'inherit'}}>{j.closing}</td>
              <td><span style={{fontWeight:'700',fontSize:'12px',
                color:j.priority==='High'?'var(--odoo-red)':j.priority==='Medium'?'var(--odoo-orange)':'var(--odoo-blue)'}}>
                {j.priority}
              </span></td>
              <td><span className={`badge ${j.sb}`}>{j.sl}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                <button className="btn-xs pri" onClick={() => nav('/hcm/candidates')}>Pipeline</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div className="fi-modal-overlay" onClick={() => setModal(null)}>
          <div className="fi-modal-box" onClick={e=>e.stopPropagation()}>
            <div className="fi-modal-hdr">➕ New Job Opening <button className="fi-modal-close" onClick={() => setModal(null)}>✕</button></div>
            <div className="fi-modal-body">
              <div className="fi-form-row"><div className="fi-form-grp"><label>Position Title <span>*</span></label><input className="fi-form-ctrl" placeholder="e.g. Ring Frame Operator"/></div>
              <div className="fi-form-grp"><label>Department</label>
                <select className="fi-form-ctrl"><option>Production</option><option>Quality</option><option>Maintenance</option><option>Accounts</option></select>
              </div></div>
              <div className="fi-form-row">
                <div className="fi-form-grp"><label>Employee Type</label>
                  <select className="fi-form-ctrl"><option>Worker</option><option>Staff</option><option>Contractor</option></select>
                </div>
                <div className="fi-form-grp"><label>No. of Positions</label><input type="number" className="fi-form-ctrl" defaultValue="1"/></div>
              </div>
              <div className="fi-form-grp"><label>Job Description</label><textarea className="fi-form-ctrl" rows={3} placeholder="Key responsibilities and requirements..."></textarea></div>
              <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
                <button className="btn btn-s sd-bsm" onClick={()=>setModal(null)}>Cancel</button>
                <button className="btn btn-p sd-bsm" onClick={()=>setModal(null)}>💾 Create Opening</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
