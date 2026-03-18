import React, { useState } from 'react'
import { FISCAL_YEARS } from './_configData'

const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']

export default function FiscalYear() {
  const [years,    setYears]    = useState(FISCAL_YEARS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label:'', start:'', end:'', status:'Upcoming' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const activeY = years.find(y => y.status === 'Active')

  const handleSave = () => {
    if (!form.label || !form.start || !form.end) { alert('All fields required'); return }
    const id = `FY-${form.start.slice(0,4)}`
    setYears(ys => [...ys, { id, ...form, periods:12, locked:false }])
    setForm({ label:'', start:'', end:'', status:'Upcoming' })
    setShowForm(false)
  }

  const setActive = id => {
    setYears(ys => ys.map(y => ({ ...y, status: y.id===id ? 'Active' : y.status==='Active' ? 'Closed' : y.status })))
  }

  const statusColor = s => ({ Active:'#117A65', Closed:'#757575', Upcoming:'#1A5276' }[s] || '#555')
  const statusBg    = s => ({ Active:'#E8F5E9', Closed:'#F5F5F5', Upcoming:'#E3F2FD' }[s] || '#F5F5F5')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Fiscal Years <small>Financial year & accounting periods</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={() => setShowForm(!showForm)}>+ New Fiscal Year</button>
        </div>
      </div>

      {/* Active FY banner */}
      {activeY && (
        <div style={{ padding:'14px 16px', background:'linear-gradient(135deg,#117A65,#0E6655)', borderRadius:'10px', color:'#fff', marginBottom:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <span style={{ fontSize:'32px' }}>📅</span>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:'800', fontSize:'16px' }}>Active: {activeY.label}</div>
              <div style={{ fontSize:'12px', opacity:.85 }}>{activeY.start} → {activeY.end} &nbsp;·&nbsp; {activeY.periods} periods</div>
            </div>
            <div style={{ marginLeft:'auto', textAlign:'right' }}>
              <div style={{ fontSize:'11px', opacity:.75 }}>Status</div>
              <div style={{ fontWeight:'800', fontSize:'14px' }}>🟢 Active & Unlocked</div>
            </div>
          </div>
          {/* Period progress bar */}
          <div style={{ marginTop:'12px' }}>
            <div style={{ fontSize:'11px', opacity:.75, marginBottom:'6px' }}>Periods — Apr 2025 to Mar 2026</div>
            <div style={{ display:'flex', gap:'3px' }}>
              {MONTHS.map((m, i) => {
                const isPast = i < 11 // Mar 2026 = index 11
                const isCurr = i === 10 // Mar 2026
                return (
                  <div key={m} style={{ flex:1, padding:'3px 0', borderRadius:'3px', textAlign:'center', fontSize:'9px', fontWeight:'700',
                    background: isCurr ? '#FFC107' : isPast ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.2)',
                    color: isCurr ? '#000' : '#fff' }}>
                    {m}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fi-panel" style={{ marginBottom:'16px', border:'2px solid var(--odoo-purple)' }}>
          <div className="fi-panel-hdr"><h3>New Fiscal Year</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field"><label>Label *</label><input value={form.label} onChange={e=>set('label',e.target.value)} placeholder="e.g. FY 2026-27" /></div>
              <div className="sd-field"><label>Start Date *</label><input type="date" value={form.start} onChange={e=>set('start',e.target.value)} /></div>
              <div className="sd-field"><label>End Date *</label><input type="date" value={form.end} onChange={e=>set('end',e.target.value)} /></div>
              <div className="sd-field">
                <label>Status</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)}>
                  <option>Upcoming</option><option>Active</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
              <button className="btn btn-p btn-s" onClick={handleSave}>✓ Create</button>
              <button className="btn btn-s sd-bsm" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        {years.map(y => (
          <div key={y.id} className="fi-panel" style={{ margin:0, borderLeft:`4px solid ${statusColor(y.status)}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px', padding:'12px 16px' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
                  <strong style={{ fontSize:'14px', fontFamily:'Syne,sans-serif' }}>{y.label}</strong>
                  <span style={{ padding:'2px 8px', borderRadius:'8px', fontSize:'10px', fontWeight:'700',
                    background:statusBg(y.status), color:statusColor(y.status) }}>● {y.status}</span>
                  {y.locked && <span style={{ padding:'2px 8px', borderRadius:'8px', fontSize:'10px', fontWeight:'700', background:'#F5F5F5', color:'#757575' }}>🔒 Locked</span>}
                </div>
                <div style={{ fontSize:'12px', color:'var(--odoo-gray)' }}>
                  {y.start} → {y.end} &nbsp;·&nbsp; {y.periods} accounting periods
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                {y.status === 'Upcoming' && (
                  <button className="btn btn-p btn-s" onClick={() => setActive(y.id)}>Set Active</button>
                )}
                {y.status === 'Active' && !y.locked && (
                  <button className="btn btn-s sd-bsm" onClick={() => setYears(ys => ys.map(x => x.id===y.id ? {...x, locked:true} : x))}>
                    🔒 Lock Year
                  </button>
                )}
                {y.status === 'Active' && (
                  <button className="btn btn-s sd-bsm" onClick={() => setYears(ys => ys.map(x => x.id===y.id ? {...x, status:'Closed', locked:true} : x))}>
                    📁 Close Year
                  </button>
                )}
              </div>
            </div>

            {/* Period grid for active year */}
            {y.status === 'Active' && (
              <div style={{ padding:'0 16px 12px' }}>
                <div style={{ display:'flex', gap:'4px' }}>
                  {MONTHS.map((m, i) => {
                    const isPast = i < 11
                    const isCurr = i === 10
                    return (
                      <div key={m} style={{ flex:1, padding:'4px 2px', borderRadius:'4px', textAlign:'center', fontSize:'10px', fontWeight:'700',
                        background: isCurr ? 'var(--odoo-orange)' : isPast ? '#E8F5E9' : '#F0F0F0',
                        color: isCurr ? '#fff' : isPast ? '#2E7D32' : '#9E9E9E',
                        border:`1px solid ${isCurr?'var(--odoo-orange)':isPast?'#A5D6A7':'#E0E0E0'}` }}>
                        {m}
                        <div style={{ fontSize:'8px', fontWeight:'400' }}>{isPast?'✓':isCurr?'NOW':'—'}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
