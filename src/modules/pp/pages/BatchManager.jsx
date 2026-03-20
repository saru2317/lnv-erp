import React, { useState } from 'react'
import { BATCHES, JOB_CARDS, ITEMS, INDUSTRIES, WORK_CENTERS } from './_ppConfig'

export default function BatchManager() {
  const [batches, setBatches]   = useState(BATCHES)
  const [showNew, setShowNew]   = useState(false)
  const [selStage, setSelStage] = useState('')
  const [selWC,    setSelWC]    = useState('')
  const [selJobs,  setSelJobs]  = useState([])
  const [toast,    setToast]    = useState('')

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  // All pending job cards that are batch-type
  const pendingJobs = JOB_CARDS.filter(j => {
    const item = ITEMS.find(i => i.id === j.itemId)
    return item?.prodType === 'batch' && j.status !== 'Done'
  })

  const stageOptions = [...new Set(pendingJobs.flatMap(j => {
    const item = ITEMS.find(i => i.id === j.itemId)
    return INDUSTRIES[item?.industry]?.stages?.map(s => s.name) || []
  }))]

  const filteredJobs = selStage
    ? pendingJobs.filter(j => {
        const item = ITEMS.find(i => i.id === j.itemId)
        return INDUSTRIES[item?.industry]?.stages?.some(s => s.name === selStage)
      })
    : pendingJobs

  const totalQtySelected = selJobs.reduce((sum, jid) => {
    const j = JOB_CARDS.find(j => j.id === jid)
    return sum + (j?.qty || 0)
  }, 0)

  const wc = WORK_CENTERS.find(w => w.id === selWC)
  const capacityPct = wc ? Math.min(100, Math.round((totalQtySelected / wc.capacity) * 100)) : 0

  const toggleJob = jid => setSelJobs(s => s.includes(jid) ? s.filter(x => x !== jid) : [...s, jid])

  const createBatch = () => {
    if (!selStage || !selWC || selJobs.length === 0) { alert('Select stage, WC, and at least one job'); return }
    const id = `BATCH-${String(batches.length + 8).padStart(3,'0')}`
    setBatches(b => [{
      id, date: new Date().toISOString().slice(0,10), stage: selStage, wcId: selWC,
      jobCards: selJobs, totalQty: totalQtySelected, status:'Pending',
      startTime:'', endTime:'', operator:'—'
    }, ...b])
    setSelJobs([]); setSelStage(''); setSelWC(''); setShowNew(false)
    showToast(`${id} created with ${selJobs.length} jobs!`)
  }

  const statusColor = s => ({Running:'var(--odoo-orange)',Done:'var(--odoo-green)',Pending:'var(--odoo-gray)',Cancelled:'var(--odoo-red)'}[s]||'var(--odoo-gray)')
  const statusBg    = s => ({Running:'#FFF3E0',Done:'#E8F5E9',Pending:'#F5F5F5',Cancelled:'#FFEBEE'}[s]||'#F5F5F5')

  return (
    <div>
      {toast && <div style={{ position:'fixed',top:'60px',right:'20px',background:'var(--odoo-green)',color:'#fff',padding:'10px 16px',borderRadius:'8px',fontWeight:'700',zIndex:999 }}>{toast}</div>}

      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Batch Manager <small>Club multiple jobs into one tank/furnace batch</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={() => setShowNew(!showNew)}>+ New Batch</button>
        </div>
      </div>

      {/* Concept banner */}
      <div style={{ padding:'10px 14px',background:'#E3F2FD',borderRadius:'8px',marginBottom:'14px',fontSize:'12px',color:'#1565C0',display:'flex',gap:'8px',alignItems:'center' }}>
        <span style={{ fontSize:'18px' }}>🪣</span>
        <div>
          <strong>Batch Concept:</strong> Multiple job cards (different customers) clubbed into ONE tank/furnace batch execution.
          Each job tracked separately but processed together to maximise capacity. Billed individually per job card.
        </div>
      </div>

      {/* New batch creator */}
      {showNew && (
        <div className="fi-panel" style={{ marginBottom:'16px',border:'2px solid var(--odoo-blue)' }}>
          <div className="fi-panel-hdr"><h3>Create New Batch</h3></div>
          <div className="fi-panel-body">
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' }}>

              <div>
                <div className="sd-form-grid" style={{ marginBottom:'10px' }}>
                  <div className="sd-field">
                    <label>Process Stage</label>
                    <select value={selStage} onChange={e => { setSelStage(e.target.value); setSelJobs([]) }}>
                      <option value="">Select Stage</option>
                      {stageOptions.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="sd-field">
                    <label>Work Centre / Tank / Furnace</label>
                    <select value={selWC} onChange={e => setSelWC(e.target.value)}>
                      <option value="">Select Work Centre</option>
                      {WORK_CENTERS.filter(w => w.status === 'Active').map(w => (
                        <option key={w.id} value={w.id}>{w.name} (Cap: {w.capacity} {w.unit})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Capacity meter */}
                {wc && (
                  <div style={{ padding:'10px 12px',background:'#F8F9FA',borderRadius:'8px',marginBottom:'10px' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'6px',fontSize:'12px' }}>
                      <span><strong>{wc.name}</strong></span>
                      <span style={{ fontWeight:'700',color: capacityPct>100?'var(--odoo-red)':capacityPct>80?'var(--odoo-orange)':'var(--odoo-green)' }}>
                        {totalQtySelected} / {wc.capacity} {wc.unit} ({capacityPct}%)
                      </span>
                    </div>
                    <div style={{ height:'8px',background:'#E0E0E0',borderRadius:'4px',overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${Math.min(capacityPct,100)}%`,transition:'width .3s',
                        background: capacityPct>100?'var(--odoo-red)':capacityPct>80?'var(--odoo-orange)':'var(--odoo-green)',borderRadius:'4px' }} />
                    </div>
                    {capacityPct>100&&<div style={{ fontSize:'10px',color:'var(--odoo-red)',marginTop:'4px',fontWeight:'700' }}> Over capacity! Reduce job selection.</div>}
                  </div>
                )}

                <button className="btn btn-p btn-s" onClick={createBatch} disabled={!selStage||!selWC||selJobs.length===0||capacityPct>100}>
                   Create Batch ({selJobs.length} jobs, {totalQtySelected} pcs)
                </button>
                <button className="btn btn-s sd-bsm" style={{ marginLeft:'8px' }} onClick={() => setShowNew(false)}>Cancel</button>
              </div>

              {/* Job card selector */}
              <div>
                <div style={{ fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',marginBottom:'6px',textTransform:'uppercase' }}>
                  Select Job Cards to Club {selStage ? `(Stage: ${selStage})` : ''}
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:'4px',maxHeight:'240px',overflow:'auto' }}>
                  {filteredJobs.length === 0
                    ? <div style={{ padding:'20px',textAlign:'center',color:'var(--odoo-gray)',fontSize:'12px' }}>No matching batch-type jobs{selStage?' for this stage':''}</div>
                    : filteredJobs.map(j => {
                        const item    = ITEMS.find(i => i.id === j.itemId)
                        const iind    = INDUSTRIES[item?.industry]
                        const checked = selJobs.includes(j.id)
                        const remaining = wc ? wc.capacity - totalQtySelected : 999999
                        const canAdd  = checked || remaining >= j.qty
                        return (
                          <div key={j.id} onClick={() => canAdd && toggleJob(j.id)}
                            style={{ display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'6px',cursor:canAdd?'pointer':'not-allowed',
                              border:'1px solid',borderColor:checked?'var(--odoo-blue)':'var(--odoo-border)',
                              background:checked?'#E3F2FD':'#fff',opacity:canAdd?1:0.5 }}>
                            <div style={{ width:'16px',height:'16px',borderRadius:'3px',border:'2px solid',borderColor:checked?'var(--odoo-blue)':'#CCC',background:checked?'var(--odoo-blue)':'#fff',display:'flex',alignItems:'center',justifyContent:'center' }}>
                              {checked&&<span style={{ color:'#fff',fontSize:'10px',lineHeight:1 }}></span>}
                            </div>
                            <span style={{ fontSize:'14px' }}>{iind?.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:'11px',fontWeight:'700' }}>{j.id} — {j.customerName}</div>
                              <div style={{ fontSize:'10px',color:'var(--odoo-gray)' }}>{j.item} · {j.qty} {j.unit} · DC: {j.dcNo}</div>
                            </div>
                            <span style={{ fontWeight:'800',fontSize:'12px',color:'var(--odoo-blue)' }}>{j.qty}</span>
                          </div>
                        )
                      })
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch list */}
      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr><th>Batch ID</th><th>Date</th><th>Stage / Process</th><th>Work Centre</th><th>Job Cards</th><th>Total Qty</th><th>Status</th><th>Timing</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {batches.map(b => {
              const wcInfo = WORK_CENTERS.find(w => w.id === b.wcId)
              return (
                <tr key={b.id}>
                  <td><strong style={{ fontFamily:'DM Mono,monospace',color:'var(--odoo-blue)',fontSize:'12px' }}>{b.id}</strong></td>
                  <td style={{ fontSize:'12px' }}>{b.date}</td>
                  <td style={{ fontWeight:'700',fontSize:'12px' }}>{b.stage}</td>
                  <td style={{ fontSize:'12px' }}>{wcInfo?.name || b.wcId}</td>
                  <td>
                    <div style={{ display:'flex',gap:'3px',flexWrap:'wrap' }}>
                      {b.jobCards.map(jid => (
                        <span key={jid} style={{ padding:'2px 6px',background:'#EDE0EA',borderRadius:'4px',fontSize:'10px',fontWeight:'700',color:'var(--odoo-purple)' }}>{jid}</span>
                      ))}
                    </div>
                    <div style={{ fontSize:'10px',color:'var(--odoo-gray)',marginTop:'2px' }}>
                      {b.jobCards.map(jid => JOB_CARDS.find(j=>j.id===jid)?.customerName).filter(Boolean).join(' · ')}
                    </div>
                  </td>
                  <td><strong style={{ fontSize:'14px',color:'var(--odoo-blue)' }}>{b.totalQty}</strong> <span style={{ fontSize:'10px',color:'var(--odoo-gray)' }}>pcs</span></td>
                  <td>
                    <span style={{ padding:'3px 8px',borderRadius:'8px',fontSize:'10px',fontWeight:'700',
                      background:statusBg(b.status),color:statusColor(b.status) }}>
                      ● {b.status}
                    </span>
                  </td>
                  <td style={{ fontSize:'11px' }}>
                    {b.startTime && <div>▶ {b.startTime}</div>}
                    {b.endTime   && <div>⏹ {b.endTime}</div>}
                    {!b.startTime && <span style={{ color:'var(--odoo-gray)' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display:'flex',gap:'4px' }}>
                      {b.status==='Pending'  && <button className="btn-act-edit" onClick={()=>showToast(`${b.id} started!`)}>▶ Start</button>}
                      {b.status==='Running'  && <button className="btn-act-view" onClick={()=>showToast(`${b.id} completed!`)}>⏹ Done</button>}
                      {b.status==='Done'     && <button className="btn-act-view">Report</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginTop:'14px' }}>
        {[
          { l:'Total Batches',  v:batches.length,                              c:'var(--odoo-purple)', i:'🪣' },
          { l:'Running Now',    v:batches.filter(b=>b.status==='Running').length,c:'var(--odoo-orange)',i:'▶' },
          { l:'Completed',      v:batches.filter(b=>b.status==='Done').length, c:'var(--odoo-green)', i:'' },
          { l:'Jobs Clubbed',   v:batches.reduce((s,b)=>s+b.jobCards.length,0),c:'var(--odoo-blue)',  i:'' },
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
