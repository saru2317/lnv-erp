import React, { useState } from 'react'
import { MOULDS, INDUSTRIES, calcShotOutput } from './_ppConfig'

const MOULD_MATERIALS = ['P20 Steel','H13 Steel','S7 Steel','D2 Steel','Aluminum','Beryllium Copper','EN31','Mild Steel']
const MOULD_STATUS    = ['Active','Inactive','Under Repair','Retired']

export default function MouldMaster() {
  const [moulds,   setMoulds]   = useState(MOULDS)
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [calcQty,  setCalcQty]  = useState({})
  const [form, setForm] = useState({ name:'', industry:'injection_moulding', cavity:'', machine:'', material:'P20 Steel', maxShots:'500000', shots:'0', status:'Active' })
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const mouldIndustries = Object.entries(INDUSTRIES).filter(([,v]) => v.mouldConcept)

  const handleSave = () => {
    if (!form.name || !form.cavity) { alert('Mould name and cavity count required'); return }
    if (editId) {
      setMoulds(m => m.map(md => md.id===editId ? { ...md, ...form, cavity:parseInt(form.cavity), shots:parseInt(form.shots), maxShots:parseInt(form.maxShots) } : md))
      setEditId(null)
    } else {
      const id = `M-${String(moulds.length+5).padStart(3,'0')}`
      setMoulds(m => [...m, { id, ...form, cavity:parseInt(form.cavity), shots:parseInt(form.shots), maxShots:parseInt(form.maxShots), lastMaint: new Date().toISOString().slice(0,10) }])
    }
    setForm({ name:'', industry:'injection_moulding', cavity:'', machine:'', material:'P20 Steel', maxShots:'500000', shots:'0', status:'Active' })
    setShowForm(false)
  }

  const handleEdit = m => {
    setForm({ name:m.name, industry:m.industry, cavity:m.cavity, machine:m.machine, material:m.material, maxShots:m.maxShots, shots:m.shots, status:m.status })
    setEditId(m.id); setShowForm(true)
  }

  const lifePct      = m => Math.min(100, Math.round((m.shots / m.maxShots) * 100))
  const lifeColor    = p => p > 90 ? 'var(--odoo-red)' : p > 70 ? 'var(--odoo-orange)' : 'var(--odoo-green)'
  const statusBadge  = s => ({ Active:'#E8F5E9,#2E7D32', Inactive:'#F5F5F5,#757575', 'Under Repair':'#FFF3E0,#E65100', Retired:'#FFEBEE,#C62828' }[s]||'#F5F5F5,#757575').split(',')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Mould / Cavity Master <small>{moulds.length} moulds · Shot life tracking</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={() => { setEditId(null); setShowForm(true) }}>+ New Mould</button>
        </div>
      </div>

      {/* Concept banner */}
      <div style={{ padding:'10px 14px',background:'#FFF3E0',borderRadius:'8px',marginBottom:'14px',fontSize:'12px',color:'#E65100',display:'flex',gap:'8px',alignItems:'center' }}>
        <span style={{ fontSize:'18px' }}>💉</span>
        <div>
          <strong>Mould Concept:</strong> 1 Shot = Cavity count pieces. &nbsp;·&nbsp;
          Job Qty ÷ Cavity = Shots needed. &nbsp;·&nbsp;
          Shot counter tracks mould life (max shots before maintenance).
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="fi-panel" style={{ marginBottom:'16px',border:'2px solid var(--odoo-orange)' }}>
          <div className="fi-panel-hdr"><h3>{editId ? '✏️ Edit Mould' : '➕ New Mould'}</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field" style={{ gridColumn:'1/-1' }}>
                <label>Mould Name *</label>
                <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. PP Cap Mould 20ml" />
              </div>
              <div className="sd-field">
                <label>Industry</label>
                <select value={form.industry} onChange={e=>set('industry',e.target.value)}>
                  {mouldIndustries.map(([k,v])=><option key={k} value={k}>{v.icon} {v.name}</option>)}
                </select>
              </div>
              <div className="sd-field">
                <label>Cavity Count *</label>
                <input type="number" value={form.cavity} onChange={e=>set('cavity',e.target.value)} placeholder="e.g. 4" min="1" />
              </div>
              <div className="sd-field">
                <label>Machine</label>
                <input value={form.machine} onChange={e=>set('machine',e.target.value)} placeholder="e.g. IMM-150T" />
              </div>
              <div className="sd-field">
                <label>Mould Material</label>
                <select value={form.material} onChange={e=>set('material',e.target.value)}>
                  {MOULD_MATERIALS.map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="sd-field">
                <label>Max Shots (life)</label>
                <input type="number" value={form.maxShots} onChange={e=>set('maxShots',e.target.value)} />
              </div>
              <div className="sd-field">
                <label>Current Shots Used</label>
                <input type="number" value={form.shots} onChange={e=>set('shots',e.target.value)} />
              </div>
              <div className="sd-field">
                <label>Status</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)}>
                  {MOULD_STATUS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {/* Preview calc */}
            {form.cavity > 0 && (
              <div style={{ marginTop:'10px',padding:'10px 14px',background:'#FFF8E1',borderRadius:'6px',fontSize:'12px',color:'#E65100' }}>
                💡 <strong>For 1000 pcs:</strong> {Math.ceil(1000/parseInt(form.cavity||1))} shots · Output: {Math.ceil(1000/parseInt(form.cavity||1))*parseInt(form.cavity||1)} pcs
                &nbsp;|&nbsp; Life used: {form.maxShots>0?((parseInt(form.shots||0)/parseInt(form.maxShots))*100).toFixed(1):0}%
              </div>
            )}
            <div style={{ display:'flex',gap:'8px',marginTop:'12px' }}>
              <button className="btn btn-p btn-s" onClick={handleSave}>✓ {editId?'Update':'Save'} Mould</button>
              <button className="btn btn-s sd-bsm" onClick={()=>{setShowForm(false);setEditId(null)}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Mould cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'12px' }}>
        {moulds.map(m => {
          const ind   = INDUSTRIES[m.industry]
          const pct   = lifePct(m)
          const lc    = lifeColor(pct)
          const [sbg,sclr] = statusBadge(m.status)
          const qty   = calcQty[m.id] || ''
          const shot  = qty ? calcShotOutput(parseInt(qty), m.cavity) : null

          return (
            <div key={m.id} className="fi-panel" style={{ margin:0 }}>
              <div className="fi-panel-hdr" style={{ padding:'10px 14px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:'8px',flex:1 }}>
                  <span style={{ fontSize:'22px' }}>{ind?.icon||'🔲'}</span>
                  <div>
                    <div style={{ fontWeight:'800',fontSize:'13px' }}>{m.name}</div>
                    <div style={{ fontSize:'11px',fontFamily:'DM Mono,monospace',color:'var(--odoo-gray)' }}>{m.id} · {m.machine}</div>
                  </div>
                </div>
                <span style={{ padding:'3px 8px',borderRadius:'8px',fontSize:'10px',fontWeight:'700',background:sbg,color:sclr }}>● {m.status}</span>
              </div>
              <div className="fi-panel-body" style={{ padding:'10px 14px' }}>
                {/* Cavity & specs */}
                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',marginBottom:'10px' }}>
                  {[['🔲 Cavity',m.cavity,'var(--odoo-orange)'],['⚙️ Machine',m.machine,'var(--odoo-blue)'],['🔩 Material',m.material,'var(--odoo-purple)']].map(([l,v,c])=>(
                    <div key={l} style={{ textAlign:'center',padding:'6px',background:'#F8F9FA',borderRadius:'6px' }}>
                      <div style={{ fontSize:'9px',color:'var(--odoo-gray)',marginBottom:'2px' }}>{l}</div>
                      <div style={{ fontWeight:'800',fontSize:'12px',color:c }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Shot life bar */}
                <div style={{ marginBottom:'10px' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'4px' }}>
                    <span style={{ fontWeight:'700' }}>Shot Life</span>
                    <span style={{ color:lc,fontWeight:'700' }}>{m.shots.toLocaleString()} / {m.maxShots.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div style={{ height:'6px',background:'#E0E0E0',borderRadius:'3px',overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${pct}%`,background:lc,borderRadius:'3px',transition:'width .5s' }} />
                  </div>
                  {pct > 90 && <div style={{ fontSize:'10px',color:'var(--odoo-red)',marginTop:'3px',fontWeight:'700' }}>⚠️ Due for maintenance!</div>}
                  {pct > 70 && pct <= 90 && <div style={{ fontSize:'10px',color:'var(--odoo-orange)',marginTop:'3px' }}>⚡ Schedule maintenance soon</div>}
                </div>

                {/* Shot calculator */}
                <div style={{ padding:'8px',background:'#FFF8E1',borderRadius:'6px',border:'1px solid #FFE082' }}>
                  <div style={{ fontSize:'10px',fontWeight:'700',color:'#E65100',marginBottom:'4px' }}>💉 Shot Calculator</div>
                  <div style={{ display:'flex',gap:'6px',alignItems:'center' }}>
                    <input type="number" value={qty} onChange={e=>setCalcQty(c=>({...c,[m.id]:e.target.value}))}
                      placeholder="Enter job qty"
                      style={{ flex:1,padding:'4px 8px',border:'1px solid #FFE082',borderRadius:'4px',fontSize:'11px' }} />
                    <span style={{ fontSize:'11px',color:'var(--odoo-gray)' }}>pcs</span>
                  </div>
                  {shot && (
                    <div style={{ display:'flex',gap:'6px',marginTop:'6px' }}>
                      <div style={{ flex:1,textAlign:'center',padding:'4px',background:'#fff',borderRadius:'4px' }}>
                        <div style={{ fontWeight:'800',fontSize:'16px',color:'#E65100' }}>{shot.shots}</div>
                        <div style={{ fontSize:'9px',color:'var(--odoo-gray)' }}>Shots</div>
                      </div>
                      <div style={{ flex:1,textAlign:'center',padding:'4px',background:'#fff',borderRadius:'4px' }}>
                        <div style={{ fontWeight:'800',fontSize:'16px',color:'var(--odoo-green)' }}>{shot.output}</div>
                        <div style={{ fontSize:'9px',color:'var(--odoo-gray)' }}>Output Pcs</div>
                      </div>
                      <div style={{ flex:1,textAlign:'center',padding:'4px',background:'#fff',borderRadius:'4px' }}>
                        <div style={{ fontWeight:'800',fontSize:'16px',color:'var(--odoo-purple)' }}>{m.maxShots-m.shots-shot.shots >= 0 ? (m.maxShots-m.shots-shot.shots).toLocaleString() : '⚠️'}</div>
                        <div style={{ fontSize:'9px',color:'var(--odoo-gray)' }}>Remaining</div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display:'flex',gap:'4px',marginTop:'8px' }}>
                  <button className="btn-act-edit" onClick={()=>handleEdit(m)}>✏️ Edit</button>
                  <div style={{ fontSize:'10px',color:'var(--odoo-gray)',marginLeft:'auto',alignSelf:'center' }}>Last maint: {m.lastMaint}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary KPIs */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginTop:'14px' }}>
        {[
          { l:'Total Moulds',    v:moulds.length,                                   c:'var(--odoo-purple)', i:'🔲' },
          { l:'Active',         v:moulds.filter(m=>m.status==='Active').length,      c:'var(--odoo-green)', i:'✅' },
          { l:'Due Maintenance',v:moulds.filter(m=>lifePct(m)>90).length,           c:'var(--odoo-red)',   i:'⚠️' },
          { l:'Total Cavities', v:moulds.reduce((s,m)=>s+m.cavity,0),               c:'var(--odoo-orange)',i:'💉' },
        ].map(k => (
          <div key={k.l} className="crm-kpi-card" style={{ borderLeftColor:k.c }}>
            <div className="crm-kpi-icon">{k.i}</div>
            <div className="crm-kpi-val" style={{ color:k.c }}>{k.v}</div>
            <div className="crm-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
