import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:2 })

const BLANK = {
  type:'receivable', partyName:'', partyType:'customer',
  bankName:'', chequeNo:'', chequeDate:'', amount:'',
  purpose:'', invoiceRef:'', remarks:''
}

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block',
  marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }

const STATUS_CFG = {
  pending:   { label:'Pending',   bg:'#FFF3CD', color:'#856404' },
  presented: { label:'Presented', bg:'#D1ECF1', color:'#0C5460' },
  cleared:   { label:'Cleared',   bg:'#D4EDDA', color:'#155724' },
  bounced:   { label:'Bounced',   bg:'#F8D7DA', color:'#721C24' },
  cancelled: { label:'Cancelled', bg:'#E2E3E5', color:'#383D41' },
}

export default function PDCRegister() {
  const [rows,     setRows]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [typeTab,  setTypeTab]  = useState('all')       // all | receivable | payable
  const [statusTab,setStatusTab]= useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(BLANK)
  const [saving,   setSaving]   = useState(false)
  const [actionModal, setActionModal] = useState(null) // { pdc, action }
  const [bounceReason, setBounceReason] = useState('')
  const [bounceCharge, setBounceCharge] = useState('')
  const [acting,   setActing]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeTab !== 'all')   params.set('type',   typeTab)
      if (statusTab !== 'all') params.set('status', statusTab)
      const r = await fetch(`${BASE_URL}/fi/pdc?${params}`, { headers: hdr2() })
      const d = await r.json()
      setRows(d.data || [])
    } catch { toast.error('Failed to load PDC register') }
    finally { setLoading(false) }
  }, [typeTab, statusTab])

  useEffect(() => { load() }, [load])

  const F = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  const save = async () => {
    if (!form.partyName || !form.chequeNo || !form.chequeDate || !form.amount)
      return toast.error('Party name, cheque no, date and amount are required')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/pdc`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setShowForm(false); setForm(BLANK); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const doAction = async () => {
    if (!actionModal) return
    setActing(true)
    try {
      const { pdc, action } = actionModal
      let url = `${BASE_URL}/fi/pdc/${pdc.id}/${action}`
      let body = {}
      if (action === 'bounce') {
        body = { reason: bounceReason, bounceCharge: parseFloat(bounceCharge||0) }
      }
      const res = await fetch(url, { method:'POST', headers: hdr(), body: JSON.stringify(body) })
      const d   = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setActionModal(null); setBounceReason(''); setBounceCharge(''); load()
    } catch (e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  const summary = {
    pendingAmt:   rows.filter(r=>r.status==='pending').reduce((a,r)=>a+r.amount,0),
    presentedAmt: rows.filter(r=>r.status==='presented').reduce((a,r)=>a+r.amount,0),
    clearedAmt:   rows.filter(r=>r.status==='cleared').reduce((a,r)=>a+r.amount,0),
    bouncedAmt:   rows.filter(r=>r.status==='bounced').reduce((a,r)=>a+r.amount,0),
    receivable:   rows.filter(r=>r.type==='receivable').reduce((a,r)=>a+r.amount,0),
    payable:      rows.filter(r=>r.type==='payable').reduce((a,r)=>a+r.amount,0),
  }

  const upcoming = rows.filter(r => {
    if (r.status !== 'pending') return false
    const diff = (new Date(r.chequeDate) - new Date()) / 86400000
    return diff >= 0 && diff <= 7
  })

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">PDC Register
          <small> Post-Dated Cheques — Receivable &amp; Payable</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={()=>{ setForm(BLANK); setShowForm(true) }}>+ Add PDC</button>
        </div>
      </div>

      {/* Due this week alert */}
      {upcoming.length > 0 && (
        <div className="fi-alert warn" style={{marginBottom:14}}>
          <strong>{upcoming.length} cheque{upcoming.length>1?'s':''} due this week</strong> — {upcoming.map(u=>`${u.chequeNo} (${INR(u.amount)})`).join(' · ')}
        </div>
      )}

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
        {[
          { cls:'orange', label:'Pending',   val: INR(summary.pendingAmt),   sub:`${rows.filter(r=>r.status==='pending').length} cheques`  },
          { cls:'blue',   label:'Presented', val: INR(summary.presentedAmt), sub:`${rows.filter(r=>r.status==='presented').length} in bank` },
          { cls:'green',  label:'Cleared',   val: INR(summary.clearedAmt),   sub:`${rows.filter(r=>r.status==='cleared').length} done`      },
          { cls:'red',    label:'Bounced',   val: INR(summary.bouncedAmt),   sub:`${rows.filter(r=>r.status==='bounced').length} cheques`   },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Receivable vs Payable summary */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        {[
          { label:'Total PDC Receivable (from customers)', amt: summary.receivable, color:'#155724', bg:'#D4EDDA' },
          { label:'Total PDC Payable (to vendors)',        amt: summary.payable,    color:'#004085', bg:'#CCE5FF' },
        ].map(r=>(
          <div key={r.label} style={{background:r.bg,borderRadius:8,padding:'10px 16px',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12,fontWeight:600,color:r.color}}>{r.label}</span>
            <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:16,color:r.color}}>{INR(r.amt)}</span>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:20,marginBottom:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#714B67',marginBottom:14}}>
            Register Post-Dated Cheque
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Type</label>
              <select style={{...inp,cursor:'pointer'}}
                value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                <option value="receivable">Receivable (from customer)</option>
                <option value="payable">Payable (to vendor)</option>
              </select>
            </div>
            <div>
              <label style={lbl}>{form.type==='receivable'?'Customer':'Vendor'} Name *</label>
              <input style={inp} {...F('partyName')} placeholder="Party name"
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Bank Name</label>
              <input style={inp} {...F('bankName')} placeholder="HDFC Bank / SBI..."
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Cheque No *</label>
              <input style={{...inp,fontFamily:'DM Mono,monospace'}} {...F('chequeNo')} placeholder="123456"
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Cheque Date *</label>
              <input type="date" style={inp} {...F('chequeDate')}/>
            </div>
            <div>
              <label style={lbl}>Amount (₹) *</label>
              <input type="number" style={inp} {...F('amount')} placeholder="0"
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Invoice Ref</label>
              <input style={inp} {...F('invoiceRef')} placeholder="INV-2026-001"
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Purpose</label>
              <input style={inp} {...F('purpose')} placeholder="Against invoice / advance..."
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
              {saving ? 'Saving...' : 'Register PDC'}
            </button>
            <button className="btn btn-s sd-bsm" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:4}}>
          {[['all','All'],['receivable','Receivable'],['payable','Payable']].map(([k,l])=>(
            <button key={k} onClick={()=>setTypeTab(k)} style={{
              padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid #E0D5E0',
              background:typeTab===k?'#714B67':'#fff',
              color:typeTab===k?'#fff':'#6C757D'
            }}>{l}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:4}}>
          {[['all','All Status'],['pending','Pending'],['presented','Presented'],['cleared','Cleared'],['bounced','Bounced']].map(([k,l])=>(
            <button key={k} onClick={()=>setStatusTab(k)} style={{
              padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid #E0D5E0',
              background:statusTab===k?'#495057':'#fff',
              color:statusTab===k?'#fff':'#6C757D'
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading PDC register...</div>
      ) : rows.length === 0 ? (
        <div style={{padding:50,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          No PDCs found. Click &quot;+ Add PDC&quot; to register a post-dated cheque.
        </div>
      ) : (
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>PDC No.</th>
              <th>Type</th>
              <th>Party</th>
              <th>Bank / Cheque</th>
              <th>Cheque Date</th>
              <th style={{textAlign:'right'}}>Amount</th>
              <th>Invoice Ref</th>
              <th style={{textAlign:'center'}}>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const sc = STATUS_CFG[r.status] || STATUS_CFG.pending
              const daysToDate = Math.ceil((new Date(r.chequeDate) - new Date()) / 86400000)
              const isUrgent = daysToDate >= 0 && daysToDate <= 3 && r.status === 'pending'
              return (
                <tr key={r.id} style={{background: isUrgent ? '#FFFEF0' : 'transparent'}}>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>
                    {r.pdcNo}
                    {isUrgent && <span style={{marginLeft:4,fontSize:9,background:'#FFC107',
                      color:'#212529',padding:'1px 5px',borderRadius:8,fontWeight:800}}>DUE SOON</span>}
                  </td>
                  <td>
                    <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                      background: r.type==='receivable'?'#D4EDDA':'#D1ECF1',
                      color: r.type==='receivable'?'#155724':'#0C5460'}}>
                      {r.type==='receivable'?'Receivable':'Payable'}
                    </span>
                  </td>
                  <td>
                    <div style={{fontWeight:600,fontSize:12}}>{r.partyName}</div>
                    {r.purpose && <div style={{fontSize:10,color:'#6C757D'}}>{r.purpose}</div>}
                  </td>
                  <td>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700}}>{r.chequeNo}</div>
                    <div style={{fontSize:10,color:'#6C757D'}}>{r.bankName||'—'}</div>
                  </td>
                  <td style={{fontSize:12}}>
                    {r.chequeDate ? new Date(r.chequeDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                    {daysToDate >= 0 && r.status==='pending' && (
                      <div style={{fontSize:10,color: daysToDate<=3?'#DC3545':'#6C757D'}}>
                        {daysToDate===0 ? 'Today' : `in ${daysToDate}d`}
                      </div>
                    )}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:13}}>
                    {INR(r.amount)}
                  </td>
                  <td style={{fontSize:11,color:'#6C757D'}}>{r.invoiceRef||'—'}</td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:sc.bg,color:sc.color,padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                      {sc.label}
                    </span>
                    {r.bounceReason && (
                      <div style={{fontSize:10,color:'#721C24',marginTop:2}}>{r.bounceReason}</div>
                    )}
                  </td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      {r.status==='pending' && (
                        <button className="btn-xs" style={{background:'#D1ECF1',color:'#0C5460',border:'1px solid #BEE5EB'}}
                          onClick={()=>setActionModal({pdc:r,action:'present'})}>Present</button>
                      )}
                      {r.status==='presented' && (
                        <>
                          <button className="btn-xs" style={{background:'#D4EDDA',color:'#155724',border:'1px solid #C3E6CB'}}
                            onClick={()=>setActionModal({pdc:r,action:'clear'})}>Clear</button>
                          <button className="btn-xs" style={{background:'#F8D7DA',color:'#721C24',border:'1px solid #F5C6CB'}}
                            onClick={()=>setActionModal({pdc:r,action:'bounce'})}>Bounce</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Action confirmation modal */}
      {actionModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:1000,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:440,boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,marginBottom:4,
              color: actionModal.action==='clear'?'#155724':actionModal.action==='bounce'?'#721C24':'#0C5460'}}>
              {{present:'Present to Bank',clear:'Mark as Cleared',bounce:'Mark as Bounced'}[actionModal.action]}
            </div>
            <div style={{fontSize:13,color:'#6C757D',marginBottom:14}}>
              PDC: <strong>{actionModal.pdc.pdcNo}</strong> — {actionModal.pdc.partyName} — {INR(actionModal.pdc.amount)}
            </div>

            {actionModal.action === 'clear' && (
              <div style={{background:'#D4EDDA',border:'1px solid #C3E6CB',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#155724',marginBottom:14}}>
                Clearing will post a Journal Entry: Dr Bank A/c → Cr PDC {actionModal.pdc.type === 'receivable' ? 'Receivable' : 'Payable'}
              </div>
            )}

            {actionModal.action === 'bounce' && (
              <div style={{marginBottom:14}}>
                <div style={{background:'#F8D7DA',border:'1px solid #F5C6CB',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#721C24',marginBottom:10}}>
                  Marking as bounced will reverse the PDC entry and notify the customer.
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div>
                    <label style={lbl}>Bounce Reason</label>
                    <input style={inp} value={bounceReason} onChange={e=>setBounceReason(e.target.value)}
                      placeholder="Insufficient funds / MICR mismatch..."
                      onFocus={e=>e.target.style.borderColor='#714B67'}
                      onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                  </div>
                  <div>
                    <label style={lbl}>Bank Charge (₹)</label>
                    <input type="number" style={inp} value={bounceCharge}
                      onChange={e=>setBounceCharge(e.target.value)} placeholder="500"
                      onFocus={e=>e.target.style.borderColor='#714B67'}
                      onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                  </div>
                </div>
              </div>
            )}

            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p sd-bsm" disabled={acting} onClick={doAction}
                style={{
                  background: actionModal.action==='bounce'?'#DC3545':actionModal.action==='clear'?'#28A745':'#17A2B8',
                  border:`1px solid ${actionModal.action==='bounce'?'#DC3545':actionModal.action==='clear'?'28A745':'#17A2B8'}`
                }}>
                {acting ? 'Processing...' : 'Confirm'}
              </button>
              <button className="btn btn-s sd-bsm" onClick={()=>{ setActionModal(null); setBounceReason(''); setBounceCharge('') }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
