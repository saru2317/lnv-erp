import React, { useState } from 'react'

const POLICIES = [
  {id:'POL-001',title:'Leave Policy',cat:'Leave',version:'v2.1',updated:'01 Jan 2025',
   icon:'📅',summary:'EL-15, CL-12, SL-12, FH-5 days per year. EL carry-forward max 45 days. EL encashment up to 30 days/year. Application required in advance except SL.'},
  {id:'POL-002',title:'Code of Conduct',cat:'General',version:'v1.3',updated:'15 Mar 2024',
   icon:'🤝',summary:'Professional behaviour at all times. Respect for all colleagues regardless of level. Zero tolerance for harassment. Mobile phones not permitted on plant floor.'},
  {id:'POL-003',title:'Attendance & Punctuality',cat:'Attendance',version:'v2.0',updated:'01 Apr 2024',
   icon:'⏰',summary:'3 late arrivals in a month = half-day LOP. Absence without intimation = LOP + written warning. Biometric punch mandatory. Buddy-punching is a dismissal offence.'},
  {id:'POL-004',title:'Salary & Compensation',cat:'Payroll',version:'v1.5',updated:'01 Jan 2025',
   icon:'💰',summary:'Salary credited by 1st of every month. OT paid with regular salary. Advance up to 50% of basic, once per year, recoverable over 3 months.'},
  {id:'POL-005',title:'Safety & PPE',cat:'Safety',version:'v3.0',updated:'01 Jun 2024',
   icon:'🦺',summary:'Hard hats, safety shoes and ear protection mandatory on plant floor at all times. Violation = verbal warning (1st), written warning (2nd), suspension (3rd).'},
  {id:'POL-006',title:'Grievance Redressal',cat:'HR',version:'v1.2',updated:'01 Jan 2024',
   icon:'📣',summary:'Submit grievance to HR in writing → Supervisor responds within 3 working days → HR resolution within 7 days → Escalation to Management if unresolved.'},
  {id:'POL-007',title:'Training & Development',cat:'Learning',version:'v1.0',updated:'15 Apr 2024',
   icon:'📚',summary:'All workers: 8 hrs safety training/year mandatory. Staff: 16 hrs skill development. Sponsorship for job-relevant certifications with 2-year bond clause.'},
  {id:'POL-008',title:'IT & Data Security',cat:'IT',version:'v1.1',updated:'01 Mar 2024',
   icon:'🔒',summary:'Company systems for official use only. No personal USB drives. ERP access as per RBAC role. Password change every 90 days mandatory.'},
]

const CATS = ['All','Leave','General','Attendance','Payroll','Safety','HR','Learning','IT']

export default function HRPolicy() {
  const [active, setActive] = useState(null)
  const [cat, setCat] = useState('All')
  const [editModal, setEditModal] = useState(null)

  const filtered = cat === 'All' ? POLICIES : POLICIES.filter(p => p.cat === cat)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">HR Policies <small>Company Policy Documents</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export All</button>
          <button className="btn btn-p sd-bsm" onClick={() => setEditModal('new')}>➕ Add Policy</button>
        </div>
      </div>

      <div className="pp-chips">
        {CATS.map(c => (
          <div key={c} className={`pp-chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>
            {c} {c !== 'All' && <span>{POLICIES.filter(p => p.cat === c).length}</span>}
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'14px'}}>
        {filtered.map(p => (
          <div key={p.id} style={{
            background:'#fff',borderRadius:'10px',padding:'18px',
            boxShadow:'0 1px 4px rgba(0,0,0,.08)',cursor:'pointer',transition:'all .15s',
            border:`2px solid ${active === p.id ? 'var(--odoo-purple)' : 'transparent'}`}}
            onClick={() => setActive(active === p.id ? null : p.id)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
              <span style={{fontSize:'32px'}}>{p.icon}</span>
              <span style={{background:'#EDE0EA',color:'var(--odoo-purple)',padding:'2px 8px',
                borderRadius:'4px',fontSize:'11px',fontWeight:'700'}}>{p.cat}</span>
            </div>
            <div style={{fontWeight:'800',fontSize:'14px',color:'var(--odoo-dark)',marginBottom:'4px'}}>{p.title}</div>
            <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginBottom:'8px'}}>
              {p.id} · {p.version} · Updated: {p.updated}
            </div>

            {active === p.id && (
              <div style={{marginTop:'10px',padding:'12px',background:'#F8F9FA',borderRadius:'8px',
                fontSize:'12px',color:'var(--odoo-dark)',lineHeight:'1.6',borderLeft:'3px solid var(--odoo-purple)'}}>
                {p.summary}
                <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
                  <button className="btn-xs pri" onClick={e=>{e.stopPropagation();setEditModal(p)}}>✏️ Edit</button>
                  <button className="btn-xs" onClick={e=>e.stopPropagation()}>⬇️ PDF</button>
                  <button className="btn-xs" onClick={e=>e.stopPropagation()}>📧 Share</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editModal && editModal !== 'new' && (
        <div className="fi-modal-overlay" onClick={() => setEditModal(null)}>
          <div className="fi-modal-box" onClick={e => e.stopPropagation()}>
            <div className="fi-modal-hdr">✏️ Edit — {editModal.title}
              <button className="fi-modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <div className="fi-modal-body">
              <div className="fi-form-grp"><label>Title</label><input className="fi-form-ctrl" defaultValue={editModal.title}/></div>
              <div className="fi-form-grp"><label>Summary / Content</label>
                <textarea className="fi-form-ctrl" rows={5} defaultValue={editModal.summary}></textarea></div>
              <div className="fi-form-row">
                <div className="fi-form-grp"><label>Version</label><input className="fi-form-ctrl" defaultValue={editModal.version}/></div>
                <div className="fi-form-grp"><label>Category</label>
                  <select className="fi-form-ctrl" defaultValue={editModal.cat}>
                    {CATS.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
                <button className="btn btn-s sd-bsm" onClick={() => setEditModal(null)}>Cancel</button>
                <button className="btn btn-p sd-bsm" onClick={() => setEditModal(null)}>💾 Save Policy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editModal === 'new' && (
        <div className="fi-modal-overlay" onClick={() => setEditModal(null)}>
          <div className="fi-modal-box" onClick={e => e.stopPropagation()}>
            <div className="fi-modal-hdr">➕ New Policy <button className="fi-modal-close" onClick={() => setEditModal(null)}>✕</button></div>
            <div className="fi-modal-body">
              <div className="fi-form-grp"><label>Policy Title <span>*</span></label><input className="fi-form-ctrl" placeholder="e.g. Travel Reimbursement Policy"/></div>
              <div className="fi-form-row">
                <div className="fi-form-grp"><label>Category</label>
                  <select className="fi-form-ctrl">{CATS.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}</select>
                </div>
                <div className="fi-form-grp"><label>Version</label><input className="fi-form-ctrl" defaultValue="v1.0"/></div>
              </div>
              <div className="fi-form-grp"><label>Policy Content <span>*</span></label>
                <textarea className="fi-form-ctrl" rows={5} placeholder="Describe the policy rules and guidelines..."></textarea>
              </div>
              <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
                <button className="btn btn-s sd-bsm" onClick={() => setEditModal(null)}>Cancel</button>
                <button className="btn btn-p sd-bsm" onClick={() => setEditModal(null)}>💾 Create Policy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
