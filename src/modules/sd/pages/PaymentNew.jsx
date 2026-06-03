// ═══════════════════════════════════════════════════════════════════
// LNV ERP — SD / PaymentNew.jsx  (F-28 Customer Receipt)
// Full wired: Customer → open invoices → record receipt → auto JV
// URL params: ?customerId=&invoiceId= for pre-fill from InvoiceList
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
  borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057',
  display:'block', marginBottom:3, textTransform:'uppercase' }
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })

const MODES = ['NEFT','RTGS','IMPS','UPI','Cheque','Cash','DD']
const BANKS = ['HDFC Bank','SBI','ICICI Bank','Axis Bank','Kotak Bank','Yes Bank','Other']

const today = () => new Date().toISOString().split('T')[0]

export default function PaymentNew() {
  const nav         = useNavigate()
  const [params]    = useSearchParams()
  const preCustomer = params.get('customerId')
  const preInvoice  = params.get('invoiceId') || params.get('invId')

  const [customers,   setCustomers]   = useState([])
  const [invoices,    setInvoices]    = useState([])   // open invoices for selected customer
  const [receiptNo,   setReceiptNo]   = useState('Auto-generated')
  const [saving,      setSaving]      = useState(false)
  const [loadingInv,  setLoadingInv]  = useState(false)

  const [form, setForm] = useState({
    customerId:   preCustomer || '',
    customerName: '',
    invoiceId:    preInvoice  || '',
    invoiceNo:    '',
    amount:       '',
    paymentMode:  'NEFT',
    chequeNo:     '',
    bankRef:      '',
    bank:         'HDFC Bank',
    paymentDate:  today(),
    remarks:      '',
  })

  const selInvoice = invoices.find(inv => String(inv.id) === String(form.invoiceId))
  const outstanding = selInvoice
    ? Math.max(0, parseFloat(selInvoice.grandTotal||0) - parseFloat(selInvoice.paidAmt||0))
    : null

  // ── Mount: load customers + receipt number ───────────────────────
  useEffect(() => {
    Promise.all([
      sdApi.getCustomers(),
      fetch(`${import.meta.env.VITE_API_URL||'http://localhost:3000/api'}/sd/payments`,
        { headers:{ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` }})
        .then(r=>r.json()).catch(()=>({data:[]})),
    ]).then(([cR, pmtR]) => {
      setCustomers(cR.data || cR || [])
      // Generate preview receipt no from count
      const cnt = (pmtR.data||[]).length + 1
      setReceiptNo(`RCP-${new Date().getFullYear()}-${String(cnt).padStart(4,'0')}`)
    })

    if (preCustomer) loadCustomerInvoices(preCustomer)
  }, [])

  // ── Load open invoices for customer ─────────────────────────────
  const loadCustomerInvoices = async (custId) => {
    if (!custId) { setInvoices([]); return }
    setLoadingInv(true)
    try {
      const res = await sdApi.getInvoices({ customerId:custId })
      const open = (res.data||[]).filter(inv =>
        ['POSTED','PARTIAL','OVERDUE'].includes(inv.status))
      setInvoices(open)
      // If preInvoice, pre-fill amount
      if (preInvoice && open.length) {
        const inv = open.find(i => String(i.id) === String(preInvoice))
        if (inv) {
          const outstanding = parseFloat(inv.grandTotal||0) - parseFloat(inv.paidAmt||0)
          setForm(f => ({
            ...f,
            invoiceId:   inv.id,
            invoiceNo:   inv.invoiceNo,
            amount:      outstanding.toFixed(2),
          }))
        }
      }
    } catch(e) { toast.error('Could not load invoices: ' + e.message) }
    finally { setLoadingInv(false) }
  }

  const onCustomerChange = (custId) => {
    const c = customers.find(c => String(c.id||c.customerId) === String(custId))
    setForm(f => ({
      ...f,
      customerId:   custId,
      customerName: c?.name || c?.customerName || '',
      invoiceId:    '',
      invoiceNo:    '',
      amount:       '',
    }))
    setInvoices([])
    loadCustomerInvoices(custId)
  }

  const onInvoiceChange = (invId) => {
    const inv = invoices.find(i => String(i.id) === String(invId))
    const outstanding = inv
      ? Math.max(0, parseFloat(inv.grandTotal||0) - parseFloat(inv.paidAmt||0))
      : 0
    setForm(f => ({
      ...f,
      invoiceId: invId,
      invoiceNo: inv?.invoiceNo || '',
      amount:    outstanding > 0 ? outstanding.toFixed(2) : '',
    }))
  }

  // ── Save ─────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.customerName) return toast.error('Select a customer!')
    if (!form.amount || parseFloat(form.amount) <= 0)
      return toast.error('Enter amount received!')
    if (form.paymentMode === 'Cheque' && !form.chequeNo)
      return toast.error('Enter cheque number!')
    if (['NEFT','RTGS','IMPS','UPI'].includes(form.paymentMode) && !form.bankRef)
      return toast.error('Enter transaction / UTR reference!')

    setSaving(true)
    try {
      const payload = {
        customerId:   form.customerId   || null,
        customerName: form.customerName,
        invoiceId:    form.invoiceId    || null,
        invoiceNo:    form.invoiceNo    || null,
        amount:       parseFloat(form.amount),
        paymentMode:  form.paymentMode,
        chequeNo:     form.chequeNo     || null,
        bankRef:      form.bankRef      || null,
        paymentDate:  form.paymentDate,
        notes:        form.remarks      || null,
      }

      const res = await sdApi.createPayment(payload)
      if (res.error) throw new Error(res.error)

      toast.success(`${res.data?.receiptNo || receiptNo} recorded! JV: ${res.jeNo||'—'}`)
      nav('/sd/payments')
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  const isCheque = form.paymentMode === 'Cheque'
  const needsRef = ['NEFT','RTGS','IMPS','UPI'].includes(form.paymentMode)

  return (
    <div>
      {/* Header */}
      <div className="lv-hdr">
        <div className="lv-ttl">
          Record Customer Receipt
          <small style={{ fontFamily:'DM Mono,monospace', fontSize:10 }}>
            F-28 · {receiptNo}
          </small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/sd/payments')}>← Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving ? '⏳ Saving...' : '✅ Post Receipt'}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* ── Left: Customer + Invoice Selection ── */}
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">👤 Customer & Invoice</div>
          <div className="fi-form-sec-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>

            <div>
              <label style={lbl}>Customer *</label>
              <select style={inp} value={form.customerId} onChange={e => onCustomerChange(e.target.value)}>
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c.id||c.customerId} value={c.id||c.customerId}>
                    {c.code} — {c.name||c.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={lbl}>
                Invoice {loadingInv ? '(loading…)' : `(${invoices.length} open)`}
              </label>
              <select style={inp} value={form.invoiceId}
                onChange={e => onInvoiceChange(e.target.value)}
                disabled={!form.customerId || loadingInv}>
                <option value="">-- Advance / On-Account (no invoice) --</option>
                {invoices.map(inv => {
                  const pending = Math.max(0, parseFloat(inv.grandTotal||0) - parseFloat(inv.paidAmt||0))
                  return (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNo} · ₹{Math.round(pending).toLocaleString('en-IN')} pending
                      {inv.status === 'OVERDUE' ? ' ⚠️' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Invoice outstanding card */}
            {selInvoice && (
              <div style={{ background:'#FFF3CD', border:'1px solid #FFEAA7',
                borderRadius:6, padding:'10px 14px', fontSize:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {[
                    ['Invoice No',  selInvoice.invoiceNo],
                    ['Grand Total', fmtC(selInvoice.grandTotal)],
                    ['Paid',        fmtC(selInvoice.paidAmt||0)],
                    ['Outstanding', fmtC(outstanding)],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <span style={{ fontSize:10, color:'#856404', fontWeight:700 }}>{k}</span>
                      <div style={{ fontFamily:'DM Mono,monospace', fontWeight:700,
                        color: k==='Outstanding' ? '#721C24' : '#495057' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={lbl}>Receipt Date *</label>
              <input type="date" style={inp} value={form.paymentDate}
                onChange={e => setForm(f => ({ ...f, paymentDate:e.target.value }))} />
            </div>
          </div>
        </div>

        {/* ── Right: Payment Details ── */}
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">💳 Payment Details</div>
          <div className="fi-form-sec-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>

            <div>
              <label style={lbl}>Amount Received (₹) *</label>
              <input type="number" style={{ ...inp, fontSize:15, fontWeight:700,
                background:'#F0FFF4', borderColor:'#38A169' }}
                value={form.amount} min={0} step="0.01"
                onChange={e => setForm(f => ({ ...f, amount:e.target.value }))}
                placeholder="0.00" />
              {outstanding !== null && parseFloat(form.amount||0) > outstanding + 0.01 && (
                <div style={{ fontSize:10, color:'#856404', marginTop:3 }}>
                  ⚠️ Amount exceeds outstanding ({fmtC(outstanding)}) — advance will be recorded
                </div>
              )}
            </div>

            <div>
              <label style={lbl}>Payment Mode *</label>
              <select style={inp} value={form.paymentMode}
                onChange={e => setForm(f => ({ ...f, paymentMode:e.target.value }))}>
                {MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            {isCheque && (
              <div>
                <label style={lbl}>Cheque Number *</label>
                <input style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                  value={form.chequeNo}
                  onChange={e => setForm(f => ({ ...f, chequeNo:e.target.value }))}
                  placeholder="Cheque No." />
              </div>
            )}

            {(needsRef || isCheque) && (
              <div>
                <label style={lbl}>{isCheque ? 'Bank Branch' : 'Transaction Ref / UTR *'}</label>
                <input style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                  value={form.bankRef}
                  onChange={e => setForm(f => ({ ...f, bankRef:e.target.value }))}
                  placeholder={isCheque ? 'Bank branch name' : 'UTR / Transaction ID'} />
              </div>
            )}

            <div>
              <label style={lbl}>Bank</label>
              <select style={inp} value={form.bank}
                onChange={e => setForm(f => ({ ...f, bank:e.target.value }))}>
                {BANKS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label style={lbl}>Remarks</label>
              <textarea style={{ ...inp, resize:'vertical' }} rows={2}
                value={form.remarks}
                onChange={e => setForm(f => ({ ...f, remarks:e.target.value }))}
                placeholder="Payment notes, cheque date, etc..." />
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary footer ── */}
      <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center',
        gap:16, marginBottom:20, padding:'12px 0' }}>
        {form.amount && parseFloat(form.amount) > 0 && (
          <div style={{ background:'#D4EDDA', border:'1px solid #C3E6CB',
            borderRadius:6, padding:'10px 20px', textAlign:'right' }}>
            <div style={{ fontSize:10, color:'#155724', fontWeight:700, textTransform:'uppercase' }}>
              Recording Receipt
            </div>
            <div style={{ fontSize:22, fontWeight:800, fontFamily:'DM Mono,monospace', color:'#155724' }}>
              {fmtC(parseFloat(form.amount||0))}
            </div>
            <div style={{ fontSize:10, color:'#155724' }}>
              {form.paymentMode}{form.bank ? ` · ${form.bank}` : ''}
              {form.customerName ? ` · ${form.customerName}` : ''}
            </div>
          </div>
        )}
        <div className="fi-form-acts" style={{ marginBottom:0 }}>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/sd/payments')}>Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving ? '⏳ Posting...' : '✅ Post Receipt & JV'}
          </button>
        </div>
      </div>
    </div>
  )
}
