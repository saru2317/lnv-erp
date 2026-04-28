import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const INR2 = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

const TYPE_CFG = {
  prepaid: { label:'Prepaid',  color:'#004085', bg:'#CCE5FF', desc:'Expense paid in advance — amortize monthly' },
  accrual: { label:'Accrual',  color:'#155724', bg:'#D4EDDA', desc:'Expense incurred not yet paid — recognize monthly' },
}

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const BLANK = { type:'prepaid', name:'', totalAmount:'', startDate:'', endDate:'',
  debitAcct:'', creditAcct:'', narration:'', remarks:'' }

// Account suggestions by type
const ACCOUNTS = {
  prepaid: {
    debit:  [{ code:'1400', name:'Prepaid Expenses' }, { code:'1410', name:'Prepaid Insurance' }, { code:'1420', name:'Prepaid Rent' }],
    credit: [{ code:'1200', name:'Bank Account' }, { code:'2100', name:'Accounts Payable' }],
    drLabel:'Prepaid Asset A/c (Dr)', crLabel:'Bank / AP (Cr)',
  },
  accrual: {
    debit:  [{ code:'5300', name:'Insurance Expense' }, { code:'5400', name:'Audit Fees' }, { code:'5500', name:'Depreciation' }, { code:'5100', name:'Rent Expense' }],
    credit: [{ code:'2200', name:'Accrued Liabilities' }, { code:'2210', name:'Accrued Expenses' }],
    drLabel:'Expense A/c (Dr)', crLabel:'Accrued Liability (Cr)',
  }
}

export default function AccrualsAndPrepayments() {
  const now   = new Date()
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(BLANK)
  const [editId,     setEditId]     = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [sel,        setSel]        = useState(null)       // detail view
  const [postModal,  setPostModal]  = useState(null)       // { entry, period }
  const [runPeriod,  setRunPeriod]  = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`)
  const [runAllModal,setRunAllModal]= useState(false)
  const [running,    setRunning]    = useState(false)
  const [runResults, setRunResults] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = typeFilter==='all' ? `${BASE_URL}/fi/accruals` : `${BASE_URL}/fi/accruals?type=${typeFilter}`
      const r   = await fetch(url, { headers: hdr2() })
      const d   = await r.json()
      setRows(d.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [typeFilter])

  useEffect(() => { load() }, [load])

  const F = k => ({ value: form[k]??'', onChange: e => setForm(p=>({...p,[k]:e.target.value})) })

  // Compute preview months when dates change
  const previewMonths = () => {
    if (!form.startDate || !form.endDate) return null
    const s = new Date(form.startDate), e = new Date(form.endDate)
    const m = (e.getFullYear()-s.getFullYear())*12 + (e.getMonth()-s.getMonth()) + 1
    if (m <= 0) return null
    return { months: m, monthly: parseFloat(form.totalAmount||0)/m }
  }
  const preview = previewMonths()

  const save = async () => {
    if (!form.name || !form.totalAmount || !form.startDate || !form.endDate || !form.debitAcct || !form.creditAcct)
      return toast.error('All fields required')
    if (new Date(form.endDate) <= new Date(form.startDate))
      return toast.error('End date must be after start date')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/accruals`, {
        method:'POST', headers: hdr(), body: JSON.stringify(form)
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setShowForm(false); setForm(BLANK); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const postPeriod = async () => {
    if (!postModal) return
    setRunning(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/accruals/${postModal.entry.id}/post/${postModal.period}`, {
        method:'POST', headers: hdr()
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setPostModal(null); setSel(null); load()
    } catch (e) { toast.error(e.message) }
    finally { setRunning(false) }
  }

  const runAll = async () => {
    setRunning(true); setRunResults(null)
    try {
      const res = await fetch(`${BASE_URL}/fi/accruals/run-period`, {
        method:'POST', headers: hdr(), body: JSON.stringify({ period: runPeriod })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setRunResults(d.results || [])
      load()
    } catch (e) { toast.error(e.message) }
    finally { setRunning(false) }
  }

  const filtered = rows.filter(r => typeFilter==='all' || r.type===typeFilter)
  const totalPrepaid = rows.filter(r=>r.type==='prepaid').reduce((a,r)=>a+r.remainingAmt,0)
  const totalAccrual = rows.filter(r=>r.type==='accrual').reduce((a,r)=>a+r.remainingAmt,0)
  const pendingThisMonth = rows.filter(r => r.schedules?.some(s=>s.period===runPeriod&&s.status==='pending'))

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Accruals &amp; Prepayments
          <small> SAP FBS1 · Monthly amortization &amp; expense recognition</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm" onClick={()=>{ setShowForm(true); setForm(BLANK) }}>+ New Entry</button>
          <button className="btn btn-p sd-bsm" onClick={()=>{ setRunAllModal(true); setRunResults(null) }}>
            Run Period
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        {Object.entries(TYPE_CFG).map(([k,tc])=>(
          <div key={k} style={{ background:tc.bg, borderRadius:8, padding:'10px 14px',
            border:`1px solid ${tc.color}22`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700, color:tc.color, fontSize:12 }}>{tc.label}</div>
              <div style={{ fontSize:11, color:'#495057', marginTop:2 }}>{tc.desc}</div>
            </div>
            <div style={{ fontFamily:'DM Mono,monospace', fontWeight:800, fontSize:18, color:tc.color }}>
              {INR(k==='prepaid'?totalPrepaid:totalAccrual)}
              <div style={{ fontSize:10, fontWeight:400, color:'#6C757D', textAlign:'right' }}>remaining</div>
            </div>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:14 }}>
        {[
          { cls:'purple', label:'Total Entries',        val: rows.length,              sub:`${rows.filter(r=>r.status==='active').length} active` },
          { cls:'blue',   label:'Prepaid Balance',      val: INR(totalPrepaid),        sub:'Asset to amortize' },
          { cls:'green',  label:'Accrual Balance',      val: INR(totalAccrual),        sub:'Liability to recognize' },
          { cls:'orange', label:'Due This Month',       val: pendingThisMonth.length,  sub:`${runPeriod} pending` },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ background:'#fff', border:'1px solid #E0D5E0', borderRadius:8, padding:20, marginBottom:16 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:'#714B67', marginBottom:14 }}>
            New {form.type==='prepaid'?'Prepaid Expense':'Accrual Entry'}
          </div>
          {/* Type toggle */}
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {Object.entries(TYPE_CFG).map(([k,tc])=>(
              <div key={k} onClick={()=>setForm(p=>({...p,type:k,debitAcct:'',creditAcct:''}))}
                style={{ padding:'8px 16px', borderRadius:8, cursor:'pointer',
                  border:`2px solid ${form.type===k?tc.color:'#E0D5E0'}`,
                  background: form.type===k?tc.bg:'#fff', transition:'all .15s' }}>
                <div style={{ fontWeight:700, color:tc.color, fontSize:12 }}>{tc.label}</div>
                <div style={{ fontSize:10, color:'#6C757D' }}>{tc.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Name *</label>
              <input style={inp} {...F('name')} placeholder={form.type==='prepaid'?'Prepaid Insurance FY2025-26':'Accrued Audit Fees'}
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Total Amount (₹) *</label>
              <input type="number" style={inp} {...F('totalAmount')} placeholder="120000"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Start Date *</label>
              <input type="date" style={inp} {...F('startDate')}/>
            </div>
            <div>
              <label style={lbl}>End Date *</label>
              <input type="date" style={inp} {...F('endDate')}/>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>{ACCOUNTS[form.type]?.drLabel || 'Debit Account'} *</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.debitAcct} onChange={e=>setForm(p=>({...p,debitAcct:e.target.value}))}>
                <option value="">Select...</option>
                {(ACCOUNTS[form.type]?.debit||[]).map(a=><option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>{ACCOUNTS[form.type]?.crLabel || 'Credit Account'} *</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.creditAcct} onChange={e=>setForm(p=>({...p,creditAcct:e.target.value}))}>
                <option value="">Select...</option>
                {(ACCOUNTS[form.type]?.credit||[]).map(a=><option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Narration</label>
              <input style={inp} {...F('narration')} placeholder="Monthly amortization..."
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div style={{ background:'#EDE0EA', borderRadius:6, padding:'10px 14px', marginBottom:12, fontSize:12 }}>
              <strong>{preview.months} months</strong> · Monthly: <strong>{INR2(preview.monthly)}</strong>
              <span style={{ marginLeft:12, color:'#6C757D' }}>
                JV each month: Dr {form.debitAcct||'???'} / Cr {form.creditAcct||'???'} — {INR2(preview.monthly)}
              </span>
            </div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
              {saving ? 'Creating...' : 'Create Entry'}
            </button>
            <button className="btn btn-s sd-bsm" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Type filter */}
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {[['all','All'],['prepaid','Prepaid'],['accrual','Accrual']].map(([k,l])=>(
          <button key={k} onClick={()=>setTypeFilter(k)} style={{
            padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
            border:'1px solid #E0D5E0',
            background:typeFilter===k?'#714B67':'#fff',
            color:typeFilter===k?'#fff':'#6C757D'
          }}>{l}</button>
        ))}
      </div>

      {/* Main table */}
      {loading ? <div style={{ padding:30, textAlign:'center', color:'#6C757D' }}>Loading...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Code</th><th>Name</th><th>Type</th>
            <th>Period</th>
            <th style={{ textAlign:'right' }}>Total</th>
            <th style={{ textAlign:'right' }}>Posted</th>
            <th style={{ textAlign:'right' }}>Remaining</th>
            <th style={{ textAlign:'center' }}>Progress</th>
            <th style={{ textAlign:'center' }}>Status</th>
            <th></th>
          </tr></thead>
          <tbody>
            {filtered.length===0 ? (
              <tr><td colSpan={10} style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
                No entries. Click &quot;+ New Entry&quot; to create a prepaid or accrual.
              </td></tr>
            ) : filtered.map(r=>{
              const tc  = TYPE_CFG[r.type]||TYPE_CFG.prepaid
              const pct = Math.round((r.postedAmt||0)/r.totalAmount*100)
              return (
                <tr key={r.id} onClick={()=>setSel(sel?.id===r.id?null:r)} style={{ cursor:'pointer' }}>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)', fontSize:11 }}>{r.code}</td>
                  <td style={{ fontWeight:600, fontSize:12 }}>{r.name}
                    {r.remarks&&<div style={{ fontSize:10, color:'#6C757D' }}>{r.remarks}</div>}
                  </td>
                  <td><span style={{ background:tc.bg, color:tc.color, padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>{tc.label}</span></td>
                  <td style={{ fontSize:11, color:'#6C757D' }}>
                    {r.startDate?new Date(r.startDate).toLocaleDateString('en-IN',{month:'short',year:'numeric'}):'—'}
                    {' → '}
                    {r.endDate?new Date(r.endDate).toLocaleDateString('en-IN',{month:'short',year:'numeric'}):'—'}
                  </td>
                  <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace' }}>{INR(r.totalAmount)}</td>
                  <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace', color:'#155724' }}>{INR(r.postedAmt||0)}</td>
                  <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700,
                    color:r.remainingAmt<=0?'#6C757D':'#714B67' }}>
                    {r.remainingAmt>0?INR(r.remainingAmt):'—'}
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <div style={{ background:'#F0EEEB', borderRadius:4, height:8, width:80, overflow:'hidden', display:'inline-block' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:'#28A745', borderRadius:4 }}/>
                    </div>
                    <div style={{ fontSize:10, color:'#6C757D', marginTop:1 }}>{pct}%</div>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span style={{
                      background: r.status==='completed'?'#D4EDDA':r.status==='cancelled'?'#E2E3E5':'#D1ECF1',
                      color:      r.status==='completed'?'#155724':r.status==='cancelled'?'#383D41':'#0C5460',
                      padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700
                    }}>{r.status}</span>
                  </td>
                  <td onClick={e=>e.stopPropagation()}>
                    <button className="btn-xs" onClick={()=>setSel(sel?.id===r.id?null:r)}>
                      {sel?.id===r.id?'Close':'Schedule'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Schedule detail panel */}
      {sel && (
        <div style={{ marginTop:12, background:'#fff', border:'1px solid #E0D5E0', borderRadius:8, padding:16 }}>
          <div style={{ fontWeight:700, color:'#714B67', marginBottom:10, fontSize:13 }}>
            {sel.code} — {sel.name} · Amortization Schedule ({sel.months} months)
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ background:'#F8F4F8' }}>
                  <th style={{ padding:'6px 10px', textAlign:'left', fontWeight:700, color:'#714B67' }}>Period</th>
                  <th style={{ padding:'6px 10px', textAlign:'right', fontWeight:700 }}>Amount</th>
                  <th style={{ padding:'6px 10px', textAlign:'center', fontWeight:700 }}>Status</th>
                  <th style={{ padding:'6px 10px', fontWeight:700 }}>JV No.</th>
                  <th style={{ padding:'6px 10px', fontWeight:700 }}>Posted At</th>
                  <th style={{ padding:'6px 10px', fontWeight:700 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(sel.schedules||[]).map((s,i)=>(
                  <tr key={i} style={{ borderTop:'1px solid #F0EEEB',
                    background: s.period===runPeriod?'#FFFEF0': i%2===0?'#fff':'#FAFAFA' }}>
                    <td style={{ padding:'5px 10px', fontFamily:'DM Mono,monospace', fontWeight:600 }}>{s.period}</td>
                    <td style={{ padding:'5px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700 }}>{INR2(s.amount)}</td>
                    <td style={{ padding:'5px 10px', textAlign:'center' }}>
                      <span style={{
                        background: s.status==='posted'?'#D4EDDA':'#FFF3CD',
                        color:      s.status==='posted'?'#155724':'#856404',
                        padding:'2px 7px', borderRadius:8, fontSize:10, fontWeight:700
                      }}>{s.status}</span>
                    </td>
                    <td style={{ padding:'5px 10px', fontFamily:'DM Mono,monospace', fontSize:10, color:'#714B67' }}>{s.jeNo||'—'}</td>
                    <td style={{ padding:'5px 10px', fontSize:10, color:'#6C757D' }}>
                      {s.postedAt?new Date(s.postedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}
                    </td>
                    <td style={{ padding:'5px 10px' }}>
                      {s.status==='pending'&&(
                        <button className="btn-xs" style={{ background:'#D4EDDA', color:'#155724', border:'1px solid #C3E6CB' }}
                          onClick={()=>setPostModal({ entry:sel, period:s.period })}>
                          Post
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post single period modal */}
      {postModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:28, width:420, boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'#714B67', marginBottom:4 }}>
              Post {postModal.period}
            </div>
            <div style={{ fontSize:13, color:'#6C757D', marginBottom:14 }}>
              {postModal.entry.name} — {INR2(postModal.entry.monthlyAmount)}
            </div>
            <div style={{ background:'#EDE0EA', borderRadius:6, padding:'8px 12px', marginBottom:14, fontSize:12 }}>
              JV: Dr {postModal.entry.debitAcct} / Cr {postModal.entry.creditAcct} — {INR2(postModal.entry.monthlyAmount)}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-p sd-bsm" disabled={running} onClick={postPeriod}>
                {running?'Posting...':'Confirm Post'}
              </button>
              <button className="btn btn-s sd-bsm" onClick={()=>setPostModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Run all modal */}
      {runAllModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:28, width:500, boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'#714B67', marginBottom:4 }}>
              Run All Accruals for Period
            </div>
            <div style={{ fontSize:13, color:'#6C757D', marginBottom:14 }}>
              Posts all pending accrual &amp; prepaid entries for selected period.
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Period (YYYY-MM) *</label>
              <input style={inp} type="month" value={runPeriod} onChange={e=>setRunPeriod(e.target.value)}
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div style={{ background:'#EDE0EA', borderRadius:6, padding:'8px 12px', marginBottom:14, fontSize:12 }}>
              {pendingThisMonth.length} entries pending for {runPeriod}
            </div>

            {runResults && (
              <div style={{ maxHeight:180, overflowY:'auto', border:'1px solid #E0D5E0', borderRadius:6, marginBottom:14 }}>
                {runResults.map((r,i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px',
                    borderBottom:'1px solid #F0EEEB', fontSize:11, background:'#F0FFF4' }}>
                    <span style={{ fontFamily:'DM Mono,monospace', fontWeight:600 }}>{r.code}</span>
                    <span>{r.name}</span>
                    <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'#155724' }}>{INR(r.amount)}</span>
                    <span style={{ color:'#714B67', fontSize:10 }}>{r.jeNo}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-p sd-bsm" disabled={running} onClick={runAll}>
                {running?'Posting...':'Post All Pending'}
              </button>
              <button className="btn btn-s sd-bsm" onClick={()=>{ setRunAllModal(false); setRunResults(null) }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
