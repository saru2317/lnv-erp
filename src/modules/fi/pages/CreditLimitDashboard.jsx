import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:0 })

export default function CreditLimitDashboard() {
  const [rows,      setRows]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')
  const [holdModal, setHoldModal] = useState(null)  // { id, name, hold }
  const [holdReason,setHoldReason]= useState('')
  const [acting,    setActing]    = useState(false)
  const [checkModal,setCheckModal]= useState(null)  // live credit check
  const [checkCust, setCheckCust] = useState('')
  const [checkAmt,  setCheckAmt]  = useState('')
  const [checking,  setChecking]  = useState(false)
  const [checkResult,setCheckResult]=useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/credit-limit/status`, { headers: hdr2() })
      const d = await r.json()
      setRows(d.data || [])
    } catch { toast.error('Failed to load credit status') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(r => {
    const s = search.toLowerCase()
    const matchSearch = !s || r.name?.toLowerCase().includes(s) || r.code?.toLowerCase().includes(s)
    const matchFilter = filter === 'all'
      || (filter === 'over' && r.status === 'over_limit')
      || (filter === 'overdue' && r.status === 'overdue')
      || (filter === 'hold' && r.creditHold)
      || (filter === 'ok' && r.status === 'ok' && !r.creditHold)
    return matchSearch && matchFilter
  })

  const summary = {
    total:    rows.length,
    overLimit:rows.filter(r=>r.status==='over_limit').length,
    overdue:  rows.filter(r=>r.status==='overdue').length,
    onHold:   rows.filter(r=>r.creditHold).length,
    ok:       rows.filter(r=>r.status==='ok'&&!r.creditHold).length,
    totalOS:  rows.reduce((a,r)=>a+r.outstanding,0),
    totalLimit:rows.reduce((a,r)=>a+r.creditLimit,0),
  }

  const toggleHold = async () => {
    if (!holdModal) return
    setActing(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/credit-limit/hold`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ customerId: holdModal.id, hold: holdModal.hold, reason: holdReason })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setHoldModal(null); setHoldReason(''); load()
    } catch (e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  const runCheck = async () => {
    if (!checkCust || !checkAmt) return toast.error('Select customer and amount')
    setChecking(true); setCheckResult(null)
    try {
      const res = await fetch(`${BASE_URL}/fi/credit-limit/check`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ customerId: checkCust, newInvoiceAmt: parseFloat(checkAmt) })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setCheckResult(d)
    } catch (e) { toast.error(e.message) }
    finally { setChecking(false) }
  }

  const statusCfg = {
    over_limit: { label:'Over Limit', bg:'#F8D7DA', color:'#721C24' },
    overdue:    { label:'Overdue',    bg:'#FFF3CD', color:'#856404' },
    ok:         { label:'OK',         bg:'#D4EDDA', color:'#155724' },
  }

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Credit Limit Dashboard
          <small> Customer Outstanding vs Credit Limit</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => { setCheckModal(true); setCheckResult(null) }}>
            Live Credit Check
          </button>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:14}}>
        {[
          { cls:'purple', label:'Total Customers',   val: summary.total,          sub:'with credit limit set' },
          { cls:'green',  label:'Within Limit',      val: summary.ok,             sub:'all clear' },
          { cls:'orange', label:'Overdue',           val: summary.overdue,        sub:'follow up needed' },
          { cls:'red',    label:'Over Limit',        val: summary.overLimit,      sub:'block new orders' },
          { cls:'red',    label:'On Hold',           val: summary.onHold,         sub:'credit hold active' },
        ].map(k => (
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Overall utilization bar */}
      {summary.totalLimit > 0 && (
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:'12px 16px',marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:12}}>
            <span style={{fontWeight:700,color:'#714B67'}}>Total Portfolio Utilization</span>
            <span style={{fontFamily:'DM Mono,monospace',fontWeight:700}}>
              {INR(summary.totalOS)} / {INR(summary.totalLimit)} — {Math.round(summary.totalOS/summary.totalLimit*100)}%
            </span>
          </div>
          <div style={{background:'#F0EEEB',borderRadius:4,height:10,overflow:'hidden'}}>
            <div style={{
              height:'100%', borderRadius:4,
              width:`${Math.min(100,Math.round(summary.totalOS/summary.totalLimit*100))}%`,
              background: summary.totalOS/summary.totalLimit > 0.9 ? '#DC3545'
                        : summary.totalOS/summary.totalLimit > 0.7 ? '#FFC107' : '#28A745',
              transition:'width .4s'
            }}/>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <input className="sd-search" placeholder="Search customer..." value={search}
          onChange={e=>setSearch(e.target.value)} style={{width:200}}/>
        {[['all','All'],['ok','OK'],['overdue','Overdue'],['over','Over Limit'],['hold','On Hold']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{
            padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
            border:'1px solid #E0D5E0',
            background: filter===k?'#714B67':'#fff',
            color: filter===k?'#fff':'#6C757D'
          }}>{l} ({k==='all'?rows.length:k==='ok'?summary.ok:k==='overdue'?summary.overdue:k==='over'?summary.overLimit:summary.onHold})</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading credit status...</div>
      ) : filtered.length === 0 ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          {rows.length === 0
            ? 'No customers with credit limits set. Go to Customer Master → set Credit Limit.'
            : 'No customers match this filter.'}
        </div>
      ) : (
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th style={{textAlign:'right'}}>Credit Limit</th>
              <th style={{textAlign:'right'}}>Outstanding</th>
              <th style={{textAlign:'right'}}>Overdue</th>
              <th style={{textAlign:'right'}}>Available</th>
              <th style={{width:140}}>Utilization</th>
              <th style={{textAlign:'center'}}>Status</th>
              <th style={{textAlign:'center'}}>Hold</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const util = r.creditLimit > 0 ? Math.min(100, Math.round(r.outstanding/r.creditLimit*100)) : 0
              const sc   = statusCfg[r.status] || statusCfg.ok
              const barColor = util >= 100 ? '#DC3545' : util >= 80 ? '#FFC107' : '#28A745'
              return (
                <tr key={r.id} style={{opacity: r.creditHold ? 0.8 : 1}}>
                  <td>
                    <div style={{fontWeight:700,fontSize:12}}>{r.name}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'#6C757D'}}>{r.code}</div>
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(r.creditLimit)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',
                    color: r.outstanding > r.creditLimit ? '#DC3545' : '#333',
                    fontWeight: r.outstanding > r.creditLimit ? 800 : 400
                  }}>{INR(r.outstanding)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',
                    color: r.overdue > 0 ? '#856404' : '#6C757D'}}>
                    {r.overdue > 0 ? INR(r.overdue) : '—'}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',
                    color: r.available > 0 ? '#155724' : '#DC3545',fontWeight:700}}>
                    {r.available > 0 ? INR(r.available) : INR(0)}
                  </td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{flex:1,background:'#F0EEEB',borderRadius:3,height:7,overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:3,width:`${util}%`,background:barColor,transition:'width .3s'}}/>
                      </div>
                      <span style={{fontSize:11,fontFamily:'DM Mono,monospace',fontWeight:700,
                        color:barColor,minWidth:34,textAlign:'right'}}>{util}%</span>
                    </div>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:sc.bg,color:sc.color,padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                      {sc.label}
                    </span>
                  </td>
                  <td style={{textAlign:'center'}}>
                    {r.creditHold ? (
                      <span style={{background:'#F8D7DA',color:'#721C24',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                        HOLD
                      </span>
                    ) : (
                      <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                        Active
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn-xs"
                      style={{background: r.creditHold?'#D4EDDA':'#F8D7DA',
                        color: r.creditHold?'#155724':'#721C24',
                        border:`1px solid ${r.creditHold?'#C3E6CB':'#F5C6CB'}`}}
                      onClick={() => setHoldModal({ id:r.id, name:r.name, hold:!r.creditHold })}>
                      {r.creditHold ? 'Release' : 'Hold'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Hold / Release Modal */}
      {holdModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:1000,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:420,boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,
              color: holdModal.hold ? '#721C24' : '#155724',marginBottom:4}}>
              {holdModal.hold ? 'Place Credit Hold' : 'Release Credit Hold'}
            </div>
            <div style={{fontSize:13,color:'#6C757D',marginBottom:16}}>
              Customer: <strong>{holdModal.name}</strong>
            </div>
            {holdModal.hold && (
              <div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:6,
                padding:'8px 12px',fontSize:12,color:'#856404',marginBottom:14}}>
                Placing a credit hold will block all new Sales Orders for this customer until released.
              </div>
            )}
            <div style={{marginBottom:14}}>
              <label style={{...lbl,display:'block'}}>Reason</label>
              <input style={inp} value={holdReason} onChange={e=>setHoldReason(e.target.value)}
                placeholder={holdModal.hold ? 'Overdue payment, bounced cheque...' : 'Payment received, limit revised...'}
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}
              />
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p sd-bsm" disabled={acting} onClick={toggleHold}
                style={{background: holdModal.hold ? '#DC3545' : '#28A745',
                  border: holdModal.hold ? '1px solid #DC3545' : '1px solid #28A745'}}>
                {acting ? 'Saving...' : holdModal.hold ? 'Confirm Hold' : 'Confirm Release'}
              </button>
              <button className="btn btn-s sd-bsm" onClick={()=>setHoldModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Live Credit Check Modal */}
      {checkModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:1000,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:460,boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67',marginBottom:16}}>
              Live Credit Check
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <label style={lbl}>Customer</label>
                <select style={{...inp,cursor:'pointer'}} value={checkCust}
                  onChange={e=>{ setCheckCust(e.target.value); setCheckResult(null) }}>
                  <option value="">Select customer...</option>
                  {rows.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>New Invoice Amount (₹)</label>
                <input style={inp} type="number" value={checkAmt}
                  onChange={e=>{ setCheckAmt(e.target.value); setCheckResult(null) }}
                  placeholder="500000"
                  onFocus={e=>e.target.style.borderColor='#714B67'}
                  onBlur={e=>e.target.style.borderColor='#E0D5E0'}
                />
              </div>
            </div>
            {checkResult && (
              <div style={{background: checkResult.overLimit ? '#FFF3CD' : '#D4EDDA',
                border:`1px solid ${checkResult.overLimit ? '#FFEEBA' : '#C3E6CB'}`,
                borderRadius:8,padding:'12px 16px',marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,
                  color: checkResult.overLimit ? '#856404' : '#155724',marginBottom:8}}>
                  {checkResult.overLimit ? 'CREDIT LIMIT EXCEEDED' : 'Credit OK — Proceed'}
                </div>
                {[
                  ['Credit Limit',   INR(checkResult.creditLimit)],
                  ['Current OS',     INR(checkResult.outstanding)],
                  ['New Invoice',    INR(parseFloat(checkAmt)||0)],
                  ['Total After',    INR(checkResult.newTotal)],
                  ['Available',      INR(checkResult.available)],
                ].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'3px 0',
                    borderBottom:'1px solid rgba(0,0,0,.05)'}}>
                    <span style={{color:'#6C757D'}}>{l}</span>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:700}}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p sd-bsm" disabled={checking} onClick={runCheck}>
                {checking ? 'Checking...' : 'Check Credit'}
              </button>
              <button className="btn btn-s sd-bsm" onClick={()=>{ setCheckModal(null); setCheckResult(null); setCheckCust(''); setCheckAmt('') }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block',
  marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }
