// ═══════════════════════════════════════════════════════════════════
// LNV ERP — MM / VendorPaymentRequest.jsx
// Advance payment request & invoice payment request
// Flow: MM creates → PENDING → FI approves → FI posts PV → PAID
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const INR  = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const STATUS_CFG = {
  PENDING:  { bg:'#FFF3CD', c:'#856404', label:'Pending Approval' },
  APPROVED: { bg:'#D4EDDA', c:'#155724', label:'Approved' },
  REJECTED: { bg:'#F8D7DA', c:'#721C24', label:'Rejected' },
  PAID:     { bg:'#CCE5FF', c:'#004085', label:'Paid' },
}
const Badge = ({ s }) => {
  const cfg = STATUS_CFG[s] || STATUS_CFG.PENDING
  return <span style={{ background:cfg.bg, color:cfg.c, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>{cfg.label}</span>
}

const inp = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block', marginBottom:3, textTransform:'uppercase' }

export default function VendorPaymentRequest() {
  const location   = useLocation()
  const [reqs,     setReqs]     = useState([])
  const [vendors,  setVendors]  = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ vendorCode:'', vendorName:'', vendorGstin:'', invoiceRef:'', invoiceAmt:0, requestAmt:'', isAdvance:false, purpose:'', payMode:'NEFT', notes:'' })

  const sf = (k,v) => setForm(f=>({...f,[k]:v}))

  // Auto-fill from URL params (triggered from PO or Invoice)
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    if (!p.get('vendorName')) return
    const isAdv = p.get('isAdvance') === 'true'
    setForm({
      vendorCode:  p.get('vendorCode')  || '',
      vendorName:  p.get('vendorName')  || '',
      vendorGstin: p.get('vendorGstin') || '',
      invoiceRef:  p.get('invoiceRef')  || '',
      invoiceAmt:  parseFloat(p.get('invoiceAmt')  || 0),
      requestAmt:  parseFloat(p.get('requestAmt')  || 0),
      isAdvance:   isAdv,
      purpose:     p.get('purpose')     || (isAdv ? 'Advance Payment' : 'Invoice Payment'),
      payMode:     'NEFT',
      notes:       p.get('notes')       || '',
    })
    // Load invoices for this vendor if invoice payment
    if (!isAdv && p.get('vendorCode')) {
      fetch(`${BASE}/mm/invoices?vendorCode=${p.get('vendorCode')}&status=PENDING`, { headers:hdr2() })
        .then(r=>r.json()).then(d=>setInvoices(d.data||[])).catch(()=>{})
    }
    setShowForm(true)
  }, [location.search])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rR, vR] = await Promise.all([
        fetch(`${BASE}/mm/payment-requests`, { headers:hdr2() }).then(r=>r.json()),
        fetch(`${BASE}/vendors`, { headers:hdr2() }).then(r=>r.json()),
      ])
      setReqs(rR.data||[])
      setVendors(vR.data||[])
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const onVendorSelect = async (code) => {
    const v = vendors.find(x=>x.code===code)
    sf('vendorCode', code)
    sf('vendorName', v?.name||'')
    sf('vendorGstin', v?.gstin||'')
    // Load pending invoices for this vendor
    if (code) {
      try {
        const r = await fetch(`${BASE}/mm/invoices?vendorCode=${code}&status=PENDING`, { headers:hdr2() })
        const d = await r.json()
        setInvoices(d.data||[])
      } catch {}
    }
  }

  const onInvSelect = (invNo) => {
    sf('invoiceRef', invNo)
    const inv = invoices.find(i=>i.invNo===invNo)
    if (inv) {
      sf('invoiceAmt', parseFloat(inv.balance||inv.totalAmount||0))
      sf('requestAmt', parseFloat(inv.balance||inv.totalAmount||0))
    }
  }

  const save = async () => {
    if (!form.vendorName || !form.requestAmt) return toast.error('Vendor and amount required')
    try {
      const r = await fetch(`${BASE}/mm/payment-requests`, {
        method:'POST', headers:hdr(), body:JSON.stringify(form)
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success(d.message)
      setShowForm(false)
      setForm({ vendorCode:'', vendorName:'', vendorGstin:'', invoiceRef:'', invoiceAmt:0, requestAmt:'', isAdvance:false, purpose:'', payMode:'NEFT', notes:'' })
      load()
    } catch(e) { toast.error(e.message) }
  }

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Vendor Payment Requests
          <small> Advance & Invoice Payments</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={()=>setShowForm(true)}>+ New Request</button>
        </div>
      </div>

      {/* Info */}
      <div style={{ background:'#D1ECF1', border:'1px solid #BEE5EB', borderRadius:6, padding:'8px 14px', marginBottom:12, fontSize:12, color:'#0C5460' }}>
        💡 <strong>Flow:</strong> MM raises request → FI approves → FI posts Payment Voucher → Vendor paid
      </div>

      {/* List */}
      <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'#F8F9FA', borderBottom:'1px solid #E8E0E8' }}>
              {['Request No','Vendor','Invoice Ref','Amount','Type','Status','Date','Approved By'].map(h=>(
                <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6C757D' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#6C757D' }}>Loading...</td></tr>
            ) : reqs.length===0 ? (
              <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color:'#CCC' }}>
                No payment requests yet. Click "+ New Request" to create one.
              </td></tr>
            ) : reqs.map(r=>(
              <tr key={r.id} style={{ borderBottom:'1px solid #F0F0F0' }}>
                <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67' }}>{r.prNo}</td>
                <td style={{ padding:'8px 12px', fontWeight:600 }}>{r.vendorName}</td>
                <td style={{ padding:'8px 12px', color:'#6C757D', fontFamily:'DM Mono,monospace', fontSize:11 }}>{r.invoiceRef||'—'}</td>
                <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace', fontWeight:700 }}>{INR(r.requestAmt)}</td>
                <td style={{ padding:'8px 12px' }}>
                  <span style={{ background:r.isAdvance?'#FFF3CD':'#D4EDDA', color:r.isAdvance?'#856404':'#155724',
                    padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700 }}>
                    {r.isAdvance?'ADVANCE':'INVOICE'}
                  </span>
                </td>
                <td style={{ padding:'8px 12px' }}><Badge s={r.status} /></td>
                <td style={{ padding:'8px 12px', color:'#6C757D' }}>{fmtD(r.createdAt)}</td>
                <td style={{ padding:'8px 12px', color:'#6C757D' }}>{r.approvedBy||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:12, width:600, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ background:'linear-gradient(135deg,#1C1C1C,#333)', color:'#fff', padding:'14px 20px', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontWeight:800, fontSize:14 }}>New Vendor Payment Request</span>
              <button onClick={()=>setShowForm(false)} style={{ background:'transparent', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div style={{ gridColumn:'span 2' }}>
                  <label style={lbl}>Select Vendor *</label>
                  <select style={inp} value={form.vendorCode} onChange={e=>onVendorSelect(e.target.value)}>
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v=><option key={v.code} value={v.code}>{v.code} — {v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Payment Type</label>
                  <div style={{ display:'flex', gap:12, padding:'8px 0' }}>
                    {[['Invoice Payment', false],['Advance Payment', true]].map(([label, val])=>(
                      <label key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer' }}>
                        <input type="radio" checked={form.isAdvance===val} onChange={()=>sf('isAdvance',val)} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                {!form.isAdvance && invoices.length > 0 && (
                  <div>
                    <label style={lbl}>Select Invoice</label>
                    <select style={inp} value={form.invoiceRef} onChange={e=>onInvSelect(e.target.value)}>
                      <option value="">-- Select Invoice --</option>
                      {invoices.map(i=><option key={i.id} value={i.invNo}>{i.invNo} — {INR(i.balance||i.totalAmount)}</option>)}
                    </select>
                  </div>
                )}
                {!form.isAdvance && (
                  <div>
                    <label style={lbl}>Invoice Amount</label>
                    <input type="number" style={{...inp, background:'#F8F9FA'}} value={form.invoiceAmt} readOnly />
                  </div>
                )}
                <div>
                  <label style={lbl}>Request Amount (₹) *</label>
                  <input type="number" style={inp} value={form.requestAmt} onChange={e=>sf('requestAmt',e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label style={lbl}>Payment Mode</label>
                  <select style={inp} value={form.payMode} onChange={e=>sf('payMode',e.target.value)}>
                    {['NEFT','RTGS','IMPS','Cheque','Cash','UPI'].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:'span 2' }}>
                  <label style={lbl}>Purpose / Narration</label>
                  <input style={inp} value={form.purpose} onChange={e=>sf('purpose',e.target.value)} placeholder="Payment purpose..." />
                </div>
                <div style={{ gridColumn:'span 2' }}>
                  <label style={lbl}>Notes</label>
                  <textarea style={{...inp, resize:'vertical'}} rows={2} value={form.notes} onChange={e=>sf('notes',e.target.value)} />
                </div>
              </div>
              <div style={{ background:'#FFF3CD', border:'1px solid #FFEAA7', borderRadius:6, padding:'8px 12px', marginBottom:14, fontSize:11, color:'#856404' }}>
                ⚡ After submission → FI will review and approve → Payment Voucher will be created automatically
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setShowForm(false)} style={{ padding:'8px 20px', background:'#fff', border:'1px solid #DDD', borderRadius:6, fontSize:13, cursor:'pointer' }}>Cancel</button>
                <button onClick={save} style={{ padding:'8px 24px', background:'#1C1C1C', color:'#fff', border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  Submit for Approval →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
