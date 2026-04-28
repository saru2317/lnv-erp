import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const STATUS_CFG = {
  open:        { label:'Open',        bg:'#D4EDDA', color:'#155724', icon:'\u2713' },
  soft_closed: { label:'Soft Closed', bg:'#FFF3CD', color:'#856404', icon:'\uD83D\uDD12' },
  hard_closed: { label:'Hard Closed', bg:'#F8D7DA', color:'#721C24', icon:'\uD83D\uDED1' },
}

const FY_STATUS = {
  open:   { label:'Active',  bg:'#D4EDDA', color:'#155724' },
  closed: { label:'Closed',  bg:'#F8D7DA', color:'#721C24' },
}

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

export default function PeriodLock() {
  const [fys,      setFys]      = useState([])
  const [selFY,    setSelFY]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null) // { type:'lock'|'reopen'|'close_fy', period/fy }
  const [lockType, setLockType] = useState('soft')
  const [remarks,  setRemarks]  = useState('')
  const [acting,   setActing]   = useState(false)
  const [newFYYear,setNewFYYear]= useState(new Date().getFullYear())
  const [showNewFY,setShowNewFY]= useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/fiscal-years`, { headers: hdr2() })
      const d = await r.json()
      const list = d.data || []
      setFys(list)
      if (!selFY && list.length) setSelFY(list[0].id)
    } catch { toast.error('Failed to load fiscal years') }
    finally { setLoading(false) }
  }, [selFY])

  useEffect(() => { load() }, [load])

  const currentFY   = fys.find(f => f.id === selFY)
  const periods     = currentFY?.periods || []
  const openCount   = periods.filter(p => p.status === 'open').length
  const softCount   = periods.filter(p => p.status === 'soft_closed').length
  const hardCount   = periods.filter(p => p.status === 'hard_closed').length

  const doLock = async () => {
    if (!modal) return
    setActing(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/periods/${modal.period.id}/lock`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ lockType, remarks, lockedByName:'Admin' })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setModal(null); setRemarks(''); load()
    } catch (e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  const doReopen = async () => {
    if (!modal) return
    setActing(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/periods/${modal.period.id}/reopen`, {
        method:'POST', headers: hdr()
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setModal(null); load()
    } catch (e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  const doCloseFY = async () => {
    if (!modal) return
    setActing(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/fiscal-years/${modal.fy.id}/close`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ remarks })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setModal(null); setRemarks(''); load()
    } catch (e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  const createFY = async () => {
    try {
      const res = await fetch(`${BASE_URL}/fi/fiscal-years`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ startYear: parseInt(newFYYear) })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setShowNewFY(false); load()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Period Lock / Year-End Close
          <small> SAP OB52 equivalent · Control posting periods</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm" onClick={() => setShowNewFY(true)}>+ New Fiscal Year</button>
          {currentFY?.status === 'open' && (
            <button className="btn btn-p sd-bsm"
              style={{ background:'#DC3545', border:'1px solid #DC3545' }}
              onClick={() => setModal({ type:'close_fy', fy: currentFY })}>
              Year-End Close
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="fi-alert info" style={{ marginBottom:14 }}>
        <strong>Soft Close:</strong> No new postings — can be reopened by admin.
        <strong style={{ marginLeft:16 }}>Hard Close:</strong> Permanently locked — cannot be reopened.
        Year-End Close hard locks all 12 periods.
      </div>

      {/* FY Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {fys.map(fy => {
          const sc = FY_STATUS[fy.status] || FY_STATUS.open
          return (
            <div key={fy.id} onClick={() => setSelFY(fy.id)}
              style={{ padding:'8px 16px', borderRadius:8, cursor:'pointer',
                border:`2px solid ${selFY===fy.id ? '#714B67' : '#E0D5E0'}`,
                background: selFY===fy.id ? '#EDE0EA' : '#fff',
                transition:'all .15s' }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#714B67' }}>{fy.code}</div>
              <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>{fy.label}</div>
              <span style={{ background:sc.bg, color:sc.color, fontSize:10, fontWeight:700,
                padding:'1px 7px', borderRadius:8, marginTop:4, display:'inline-block' }}>
                {sc.label}
              </span>
            </div>
          )
        })}
      </div>

      {currentFY && (
        <>
          {/* KPIs */}
          <div className="fi-kpi-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:14 }}>
            {[
              { cls:'purple', label:'Fiscal Year',   val: currentFY.code,       sub: currentFY.label },
              { cls:'green',  label:'Open Periods',  val: openCount,            sub: 'Posting allowed' },
              { cls:'orange', label:'Soft Closed',   val: softCount,            sub: 'Admin can reopen' },
              { cls:'red',    label:'Hard Closed',   val: hardCount,            sub: 'Permanently locked' },
            ].map(k => (
              <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
                <div className="fi-kpi-label">{k.label}</div>
                <div className="fi-kpi-value">{k.val}</div>
                <div className="fi-kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Period Table */}
          {loading ? (
            <div style={{ padding:30, textAlign:'center', color:'#6C757D' }}>Loading periods...</div>
          ) : (
            <table className="fi-data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Month</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th style={{ textAlign:'center' }}>Status</th>
                  <th>Locked By</th>
                  <th>Locked At</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {periods.map(p => {
                  const sc = STATUS_CFG[p.status] || STATUS_CFG.open
                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)', fontSize:12 }}>
                        {p.period}
                      </td>
                      <td style={{ fontWeight:600 }}>{p.label}</td>
                      <td style={{ fontSize:11 }}>
                        {new Date(p.startDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                      </td>
                      <td style={{ fontSize:11 }}>
                        {new Date(p.endDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                      </td>
                      <td style={{ textAlign:'center' }}>
                        <span style={{ background:sc.bg, color:sc.color, padding:'3px 10px',
                          borderRadius:10, fontSize:11, fontWeight:700 }}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td style={{ fontSize:11, color:'#6C757D' }}>{p.lockedByName || '—'}</td>
                      <td style={{ fontSize:11, color:'#6C757D' }}>
                        {p.lockedAt ? new Date(p.lockedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}
                      </td>
                      <td style={{ fontSize:11, color:'#6C757D', maxWidth:160 }}>{p.remarks || '—'}</td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          {p.status === 'open' && (
                            <button className="btn-xs"
                              style={{ background:'#FFF3CD', color:'#856404', border:'1px solid #FFEEBA' }}
                              onClick={() => { setModal({ type:'lock', period: p }); setLockType('soft'); setRemarks('') }}>
                              Lock
                            </button>
                          )}
                          {p.status === 'soft_closed' && (
                            <>
                              <button className="btn-xs"
                                style={{ background:'#D4EDDA', color:'#155724', border:'1px solid #C3E6CB' }}
                                onClick={() => setModal({ type:'reopen', period: p })}>
                                Reopen
                              </button>
                              <button className="btn-xs"
                                style={{ background:'#F8D7DA', color:'#721C24', border:'1px solid #F5C6CB' }}
                                onClick={() => { setModal({ type:'lock', period: p }); setLockType('hard'); setRemarks('') }}>
                                Hard Lock
                              </button>
                            </>
                          )}
                          {p.status === 'hard_closed' && (
                            <span style={{ fontSize:10, color:'#721C24', fontWeight:600 }}>Permanent</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* New FY panel */}
      {showNewFY && (
        <div style={{ background:'#fff', border:'1px solid #E0D5E0', borderRadius:8, padding:20, marginTop:14 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:'#714B67', marginBottom:12 }}>
            Create New Fiscal Year
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
            <div>
              <label style={lbl}>Start Year (April)</label>
              <input type="number" style={{ ...inp, width:120 }} value={newFYYear}
                onChange={e => setNewFYYear(e.target.value)} placeholder="2026"/>
              <div style={{ fontSize:10, color:'#6C757D', marginTop:3 }}>
                Creates FY{newFYYear}-{String(parseInt(newFYYear)+1).slice(2)} with 12 periods
              </div>
            </div>
            <button className="btn btn-p sd-bsm" onClick={createFY}>Create Fiscal Year</button>
            <button className="btn btn-s sd-bsm" onClick={() => setShowNewFY(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Lock / Reopen / Close FY Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:28, width:460,
            boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>

            {/* LOCK modal */}
            {modal.type === 'lock' && (
              <>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16,
                  color: lockType==='hard' ? '#721C24' : '#856404', marginBottom:4 }}>
                  {lockType === 'hard' ? 'Hard Lock Period' : 'Soft Close Period'}
                </div>
                <div style={{ fontSize:13, color:'#6C757D', marginBottom:14 }}>
                  Period: <strong>{modal.period.label} ({modal.period.period})</strong>
                </div>

                <div style={{ marginBottom:12 }}>
                  <label style={lbl}>Lock Type</label>
                  <div style={{ display:'flex', gap:10 }}>
                    {[['soft','Soft Close — Admin can reopen'],['hard','Hard Close — Permanent']].map(([k,l]) => (
                      <label key={k} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:12 }}>
                        <input type="radio" value={k} checked={lockType===k} onChange={() => setLockType(k)}/>
                        {l}
                      </label>
                    ))}
                  </div>
                </div>

                {lockType === 'hard' && (
                  <div style={{ background:'#F8D7DA', border:'1px solid #F5C6CB', borderRadius:6,
                    padding:'8px 12px', fontSize:11, color:'#721C24', marginBottom:12, fontWeight:600 }}>
                    WARNING: Hard close CANNOT be undone. No postings will be allowed for this period ever again.
                  </div>
                )}

                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>Remarks</label>
                  <input style={inp} value={remarks} onChange={e => setRemarks(e.target.value)}
                    placeholder="Month-end close, audit complete..."
                    onFocus={e => e.target.style.borderColor='#714B67'}
                    onBlur={e => e.target.style.borderColor='#E0D5E0'}/>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-p sd-bsm" disabled={acting} onClick={doLock}
                    style={{ background: lockType==='hard'?'#DC3545':'#856404',
                      border: `1px solid ${lockType==='hard'?'#DC3545':'#856404'}` }}>
                    {acting ? 'Locking...' : lockType==='hard' ? 'Confirm Hard Lock' : 'Soft Close'}
                  </button>
                  <button className="btn btn-s sd-bsm" onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            )}

            {/* REOPEN modal */}
            {modal.type === 'reopen' && (
              <>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'#155724', marginBottom:4 }}>
                  Reopen Period
                </div>
                <div style={{ fontSize:13, color:'#6C757D', marginBottom:14 }}>
                  Period: <strong>{modal.period.label} ({modal.period.period})</strong>
                </div>
                <div style={{ background:'#D4EDDA', border:'1px solid #C3E6CB', borderRadius:6,
                  padding:'8px 12px', fontSize:12, color:'#155724', marginBottom:14 }}>
                  This will reopen the period for posting. Only soft-closed periods can be reopened.
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-p sd-bsm" disabled={acting} onClick={doReopen}
                    style={{ background:'#28A745', border:'1px solid #28A745' }}>
                    {acting ? 'Reopening...' : 'Confirm Reopen'}
                  </button>
                  <button className="btn btn-s sd-bsm" onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            )}

            {/* YEAR END CLOSE modal */}
            {modal.type === 'close_fy' && (
              <>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'#721C24', marginBottom:4 }}>
                  Year-End Close — {modal.fy.code}
                </div>
                <div style={{ fontSize:13, color:'#6C757D', marginBottom:14 }}>
                  {modal.fy.label}
                </div>
                <div style={{ background:'#F8D7DA', border:'1px solid #F5C6CB', borderRadius:6,
                  padding:'10px 14px', fontSize:11, color:'#721C24', marginBottom:14 }}>
                  <strong>This action is IRREVERSIBLE.</strong><br/>
                  All 12 periods will be HARD CLOSED permanently.<br/>
                  A year-end closing JV will be posted.<br/>
                  No transactions can be posted to this year after closing.
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>Remarks</label>
                  <input style={inp} value={remarks} onChange={e => setRemarks(e.target.value)}
                    placeholder="Annual audit complete, signed off by..."
                    onFocus={e => e.target.style.borderColor='#714B67'}
                    onBlur={e => e.target.style.borderColor='#E0D5E0'}/>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-p sd-bsm" disabled={acting} onClick={doCloseFY}
                    style={{ background:'#DC3545', border:'1px solid #DC3545' }}>
                    {acting ? 'Closing...' : 'Confirm Year-End Close'}
                  </button>
                  <button className="btn btn-s sd-bsm" onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
