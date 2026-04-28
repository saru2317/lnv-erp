import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:0 })

const FREQ_CFG = {
  monthly:   { label:'Monthly',   color:'#155724', bg:'#D4EDDA' },
  quarterly: { label:'Quarterly', color:'#0C5460', bg:'#D1ECF1' },
  yearly:    { label:'Yearly',    color:'#856404', bg:'#FFF3CD' },
}

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const BLANK = {
  name:'', frequency:'monthly', dayOfMonth:1,
  debitAcct:'', creditAcct:'', amount:'', narration:'',
  startDate:'', endDate:'', remarks:''
}

// Common expense accounts for quick selection
const DEBIT_SUGGESTIONS  = [
  { code:'5100', name:'Rent Expense'        },
  { code:'5110', name:'Office Rent'         },
  { code:'5200', name:'Telephone & Internet'},
  { code:'5300', name:'Insurance'           },
  { code:'5400', name:'Professional Fees'   },
  { code:'5500', name:'Depreciation'        },
  { code:'5600', name:'Utilities'           },
  { code:'5700', name:'Repairs & Maintenance'},
]
const CREDIT_SUGGESTIONS = [
  { code:'2100', name:'Accounts Payable'    },
  { code:'1200', name:'Bank Account'        },
  { code:'2200', name:'Accrued Liabilities' },
]

export default function RecurringEntries() {
  const [rows,      setRows]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(BLANK)
  const [editId,    setEditId]    = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [runModal,  setRunModal]  = useState(null)   // single run
  const [runAllModal,setRunAllModal] = useState(false)
  const [period,    setPeriod]    = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [postDate,  setPostDate]  = useState(new Date().toISOString().split('T')[0])
  const [running,   setRunning]   = useState(false)
  const [runResults,setRunResults]= useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/recurring`, { headers: hdr2() })
      const d = await r.json()
      setRows(d.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const F = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  const openNew  = () => { setForm(BLANK); setEditId(null); setShowForm(true) }
  const openEdit = r   => { setForm({ ...r, startDate: r.startDate?.split('T')[0]||'', endDate: r.endDate?.split('T')[0]||'' }); setEditId(r.id); setShowForm(true) }

  const save = async () => {
    if (!form.name || !form.debitAcct || !form.creditAcct || !form.amount)
      return toast.error('Name, debit/credit account and amount required')
    setSaving(true)
    try {
      const url    = editId ? `${BASE_URL}/fi/recurring/${editId}` : `${BASE_URL}/fi/recurring`
      const method = editId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: hdr(), body: JSON.stringify(form) })
      const d      = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message || 'Saved')
      setShowForm(false); setEditId(null); setForm(BLANK); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const toggle = async id => {
    try {
      const res = await fetch(`${BASE_URL}/fi/recurring/${id}/toggle`, { method:'POST', headers: hdr() })
      const d   = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      load()
    } catch (e) { toast.error(e.message) }
  }

  const runSingle = async () => {
    if (!runModal) return
    setRunning(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/recurring/${runModal.id}/run`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ postDate, period })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setRunModal(null); load()
    } catch (e) { toast.error(e.message) }
    finally { setRunning(false) }
  }

  const runAll = async () => {
    setRunning(true); setRunResults(null)
    try {
      const res = await fetch(`${BASE_URL}/fi/recurring/run-all`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ period, postDate })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setRunResults(d.results || [])
      load()
    } catch (e) { toast.error(e.message) }
    finally { setRunning(false) }
  }

  const active    = rows.filter(r => r.isActive)
  const inactive  = rows.filter(r => !r.isActive)
  const monthlyAmt = active.filter(r=>r.frequency==='monthly').reduce((a,r)=>a+r.amount,0)
  const dueThisMonth = active.filter(r => r.frequency==='monthly' || (r.frequency==='quarterly' && new Date().getMonth()%3===0) || (r.frequency==='yearly' && new Date().getMonth()===3))

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Recurring Entries
          <small> SAP FBD1 · Auto-post monthly/quarterly/yearly JVs</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm" onClick={openNew}>+ New Entry</button>
          <button className="btn btn-p sd-bsm" onClick={() => { setRunAllModal(true); setRunResults(null) }}>
            Run All for Period
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:14 }}>
        {[
          { cls:'purple', label:'Total Recurring',     val: rows.length,           sub: `${active.length} active` },
          { cls:'green',  label:'Monthly Commitment',  val: INR(monthlyAmt),       sub: 'Per month auto-post' },
          { cls:'orange', label:'Due This Month',      val: dueThisMonth.length,   sub: 'Ready to post' },
          { cls:'red',    label:'Inactive',            val: inactive.length,       sub: 'Paused entries' },
        ].map(k => (
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div style={{ background:'#fff', border:'1px solid #E0D5E0', borderRadius:8, padding:20, marginBottom:16 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:'#714B67', marginBottom:14 }}>
            {editId ? 'Edit Recurring Entry' : 'New Recurring Entry'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Entry Name *</label>
              <input style={inp} {...F('name')} placeholder="Monthly Rent / Insurance / Audit Fees"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Frequency *</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.frequency} onChange={e=>setForm(p=>({...p,frequency:e.target.value}))}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Day of Month</label>
              <input type="number" style={inp} min="1" max="28" {...F('dayOfMonth')}
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Amount (₹) *</label>
              <input type="number" style={inp} {...F('amount')} placeholder="85000"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Debit Account (Dr) *</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.debitAcct} onChange={e=>setForm(p=>({...p,debitAcct:e.target.value}))}>
                <option value="">Select account...</option>
                {DEBIT_SUGGESTIONS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Credit Account (Cr) *</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.creditAcct} onChange={e=>setForm(p=>({...p,creditAcct:e.target.value}))}>
                <option value="">Select account...</option>
                {CREDIT_SUGGESTIONS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Narration</label>
              <input style={inp} {...F('narration')} placeholder="Factory rent — monthly posting"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Start Date (optional)</label>
              <input type="date" style={inp} {...F('startDate')}/>
            </div>
            <div>
              <label style={lbl}>End Date (optional)</label>
              <input type="date" style={inp} {...F('endDate')}/>
            </div>
            <div>
              <label style={lbl}>Remarks</label>
              <input style={inp} {...F('remarks')} placeholder="Contract ref, vendor name..."
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
          </div>

          {/* Preview JV */}
          {form.debitAcct && form.creditAcct && form.amount && (
            <div style={{ background:'#EDE0EA', borderRadius:6, padding:'8px 14px', marginBottom:12, fontSize:12 }}>
              JV Preview: <strong>Dr {form.debitAcct}</strong> {INR(form.amount)} / <strong>Cr {form.creditAcct}</strong> {INR(form.amount)}
              <span style={{ marginLeft:12, color:'#6C757D' }}>
                {form.frequency === 'monthly' ? 'Every month' : form.frequency === 'quarterly' ? 'Every quarter' : 'Every year'} on day {form.dayOfMonth}
              </span>
            </div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Create Entry'}
            </button>
            <button className="btn btn-s sd-bsm" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ padding:30, textAlign:'center', color:'#6C757D' }}>Loading recurring entries...</div>
      ) : (
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>Code</th><th>Name</th><th>Frequency</th><th>Day</th>
              <th>Dr Account</th><th>Cr Account</th>
              <th style={{ textAlign:'right' }}>Amount</th>
              <th>Next Run</th><th>Last Run</th><th>Runs</th>
              <th style={{ textAlign:'center' }}>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={12} style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
                No recurring entries. Click &quot;+ New Entry&quot; to add.
              </td></tr>
            ) : rows.map(r => {
              const fc = FREQ_CFG[r.frequency] || FREQ_CFG.monthly
              const isOverdue = r.nextRun && new Date(r.nextRun) < new Date() && r.isActive
              return (
                <tr key={r.id} style={{ opacity: r.isActive ? 1 : 0.6 }}>
                  <td style={{ fontFamily:'DM Mono,monospace', fontSize:11, fontWeight:700, color:'var(--odoo-purple)' }}>{r.code}</td>
                  <td style={{ fontWeight:600, fontSize:12 }}>{r.name}
                    {r.remarks && <div style={{ fontSize:10, color:'#6C757D' }}>{r.remarks}</div>}
                  </td>
                  <td>
                    <span style={{ background:fc.bg, color:fc.color, padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>
                      {fc.label}
                    </span>
                  </td>
                  <td style={{ textAlign:'center', fontSize:12 }}>{r.dayOfMonth}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:'#714B67' }}>{r.debitAcct}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:'#0C5460' }}>{r.creditAcct}</td>
                  <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:13 }}>{INR(r.amount)}</td>
                  <td style={{ fontSize:11, color: isOverdue ? '#DC3545' : '#333', fontWeight: isOverdue ? 700 : 400 }}>
                    {r.nextRun || '—'}
                    {isOverdue && <div style={{ fontSize:9, color:'#DC3545', fontWeight:700 }}>OVERDUE</div>}
                  </td>
                  <td style={{ fontSize:11, color:'#6C757D' }}>
                    {r.lastRunDate ? new Date(r.lastRunDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '—'}
                    {r.lastJeNo && <div style={{ fontSize:9, fontFamily:'DM Mono,monospace', color:'#714B67' }}>{r.lastJeNo}</div>}
                  </td>
                  <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace', fontSize:12 }}>{r.runCount || 0}</td>
                  <td style={{ textAlign:'center' }}>
                    <div onClick={() => toggle(r.id)} style={{
                      width:36, height:20, borderRadius:10, cursor:'pointer', transition:'all .2s',
                      background: r.isActive ? '#28A745' : '#CCC',
                      position:'relative', display:'inline-block'
                    }}>
                      <div style={{
                        position:'absolute', top:2, width:16, height:16, borderRadius:'50%',
                        background:'#fff', transition:'left .2s',
                        left: r.isActive ? 18 : 2
                      }}/>
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:3 }}>
                      <button className="btn-xs" onClick={() => openEdit(r)}>Edit</button>
                      {r.isActive && (
                        <button className="btn-xs" style={{ background:'#D4EDDA', color:'#155724', border:'1px solid #C3E6CB' }}
                          onClick={() => setRunModal(r)}>
                          Run
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Run Single Modal */}
      {runModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:28, width:440, boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'#714B67', marginBottom:4 }}>
              Post Recurring Entry
            </div>
            <div style={{ fontSize:13, color:'#6C757D', marginBottom:14 }}>
              <strong>{runModal.name}</strong> — {INR(runModal.amount)}
            </div>
            <div style={{ background:'#EDE0EA', borderRadius:6, padding:'8px 12px', marginBottom:14, fontSize:12 }}>
              JV: Dr {runModal.debitAcct} / Cr {runModal.creditAcct} — {INR(runModal.amount)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={lbl}>Post Date</label>
                <input type="date" style={inp} value={postDate} onChange={e => setPostDate(e.target.value)}/>
              </div>
              <div>
                <label style={lbl}>Period (YYYY-MM)</label>
                <input style={inp} value={period} onChange={e => setPeriod(e.target.value)} placeholder="2026-04"
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-p sd-bsm" disabled={running} onClick={runSingle}>
                {running ? 'Posting...' : `Post ${INR(runModal.amount)}`}
              </button>
              <button className="btn btn-s sd-bsm" onClick={() => setRunModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Run All Modal */}
      {runAllModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:28, width:520, boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'#714B67', marginBottom:4 }}>
              Run All Recurring Entries
            </div>
            <div style={{ fontSize:13, color:'#6C757D', marginBottom:14 }}>
              Posts JVs for all active recurring entries due this period.
            </div>
            <div style={{ background:'#EDE0EA', borderRadius:6, padding:'10px 14px', marginBottom:14, fontSize:12 }}>
              <div style={{ fontWeight:700, marginBottom:4 }}>Will post:</div>
              {active.filter(r => r.frequency === 'monthly').map(r => (
                <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'2px 0' }}>
                  <span>{r.name}</span>
                  <strong>{INR(r.amount)}</strong>
                </div>
              ))}
              <div style={{ borderTop:'1px solid #C8B8C8', marginTop:6, paddingTop:6, fontWeight:800, display:'flex', justifyContent:'space-between' }}>
                <span>Total</span><span>{INR(monthlyAmt)}</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={lbl}>Period *</label>
                <input style={inp} value={period} onChange={e => setPeriod(e.target.value)} placeholder="2026-04" type="month"
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              </div>
              <div>
                <label style={lbl}>Post Date</label>
                <input type="date" style={inp} value={postDate} onChange={e => setPostDate(e.target.value)}/>
              </div>
            </div>

            {/* Results */}
            {runResults && (
              <div style={{ maxHeight:180, overflowY:'auto', border:'1px solid #E0D5E0', borderRadius:6, marginBottom:14 }}>
                {runResults.map((r, i) => (
                  <div key={i} style={{
                    display:'flex', justifyContent:'space-between', padding:'6px 10px',
                    borderBottom:'1px solid #F0EEEB', fontSize:11,
                    background: r.status==='posted'?'#F0FFF4': r.status==='already_posted'?'#FFF3CD':'#F8F9FA'
                  }}>
                    <span style={{ fontFamily:'DM Mono,monospace', fontWeight:600 }}>{r.code}</span>
                    <span>{r.name}</span>
                    <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700,
                      color: r.status==='posted'?'#155724': r.status==='already_posted'?'#856404':'#6C757D' }}>
                      {r.status==='posted' ? INR(r.amount) : r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-p sd-bsm" disabled={running} onClick={runAll}>
                {running ? 'Posting...' : `Post All — ${INR(monthlyAmt)}`}
              </button>
              <button className="btn btn-s sd-bsm" onClick={() => { setRunAllModal(false); setRunResults(null) }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
