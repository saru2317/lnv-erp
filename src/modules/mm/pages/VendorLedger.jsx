import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN',
  {minimumFractionDigits:2, maximumFractionDigits:2})

function PayModal({ vendor, balance, onSave, onCancel }) {
  const [amount, setAmount] = useState(parseFloat(balance||0))
  const [mode,   setMode]   = useState('NEFT')
  const [ref,    setRef]    = useState('')
  const [date,   setDate]   = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0',
    borderRadius:5, fontSize:12, outline:'none', width:'100%',
    boxSizing:'border-box' }

  const save = async () => {
    if (!amount || parseFloat(amount)<=0)
      return toast.error('Enter valid amount!')
    if (!ref) return toast.error('Reference No. required!')
    setSaving(true)
    try {
      // Pay all pending invoices for this vendor
      const res  = await fetch(
        `${BASE_URL}/mm/invoices?vendorCode=${vendor.vendorCode}`,
        { headers:authHdrs2() })
      const data = await res.json()
      const pending = (data.data||[]).filter(i=>
        ['PENDING','PARTIAL','OVERDUE'].includes(i.status))

      let remaining = parseFloat(amount)
      for (const inv of pending) {
        if (remaining <= 0) break
        const payAmt = Math.min(remaining, parseFloat(inv.balance||0))
        await fetch(`${BASE_URL}/mm/invoices/${inv.id}/pay`,
          { method:'PATCH', headers:authHdrs(),
            body:JSON.stringify({
              payAmount:payAmt, paymentMode:mode,
              paymentRef:ref
            })})
        remaining -= payAmt
      }
      toast.success(`Payment of ${fmtC(amount)} recorded!`)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0,
      background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:440,
        overflow:'hidden',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#155724', padding:'14px 20px',
          display:'flex', justifyContent:'space-between',
          alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontSize:15,
            fontWeight:700 }}>💳 Record Payment</h3>
          <span onClick={onCancel}
            style={{ color:'#fff', cursor:'pointer',
              fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20,
          display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:'#D4EDDA', padding:'10px 14px',
            borderRadius:8, fontSize:12 }}>
            <strong>{vendor.vendorName}</strong><br/>
            Outstanding Balance:
            <strong style={{ color:'#DC3545' }}>
              {' '}{fmtC(balance)}
            </strong>
          </div>
          {[
            ['Pay Amount *',      'number', amount,
              e=>setAmount(e.target.value),     'Amount'],
            ['Reference No. *',   'text',   ref,
              e=>setRef(e.target.value),        'UTR/Cheque No.'],
            ['Payment Date',      'date',   date,
              e=>setDate(e.target.value),       ''],
          ].map(([l,t,v,fn,ph])=>(
            <div key={l}>
              <label style={{ fontSize:11, fontWeight:700,
                color:'#495057', display:'block',
                marginBottom:3 }}>{l}</label>
              <input type={t} style={inp} value={v}
                placeholder={ph} onChange={fn} />
            </div>
          ))}
          <div>
            <label style={{ fontSize:11, fontWeight:700,
              color:'#495057', display:'block',
              marginBottom:3 }}>Payment Mode</label>
            <select style={{ ...inp, cursor:'pointer' }}
              value={mode} onChange={e=>setMode(e.target.value)}>
              {['NEFT','RTGS','Cheque','Cash','UPI',
                'Bank Transfer'].map(m=>(
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ padding:'12px 20px',
          borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'space-between',
          gap:10, background:'#F8F7FA' }}>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setAmount(balance)}
              style={{ padding:'8px 16px', background:'#D4EDDA',
                color:'#155724', border:'1px solid #C3E6CB',
                borderRadius:6, fontSize:12,
                cursor:'pointer', fontWeight:600 }}>
              Full {fmtC(balance)}
            </button>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onCancel}
              style={{ padding:'8px 20px', background:'#fff',
                color:'#6C757D', border:'1.5px solid #E0D5E0',
                borderRadius:6, fontSize:13,
                cursor:'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving}
              style={{ padding:'8px 24px',
                background:'#155724', color:'#fff',
                border:'none', borderRadius:6,
                fontSize:13, fontWeight:700,
                cursor:'pointer' }}>
              {saving?'⏳':'💳'} Pay Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VendorLedger() {
  const nav = useNavigate()
  const [vendors,   setVendors]  = useState([])
  const [selVendor, setSelVendor]= useState(null)
  const [invoices,  setInvoices] = useState([])
  const [loading,   setLoading]  = useState(false)
  const [showPay,   setShowPay]  = useState(false)
  const [dateFrom,  setDateFrom] = useState('')
  const [dateTo,    setDateTo]   = useState('')

  useEffect(()=>{
    fetch(`${BASE_URL}/mm/vendors`, { headers:authHdrs2() })
      .then(r=>r.json())
      .then(d=>{
        const list = d.data||[]
        setVendors(list)
        if (list.length>0) loadLedger(list[0])
      }).catch(()=>{})
  },[])

  const loadLedger = async (vendor) => {
    setSelVendor(vendor)
    setLoading(true)
    try {
      const res  = await fetch(
        `${BASE_URL}/mm/invoices?vendorCode=${vendor.vendorCode}`,
        { headers:authHdrs2() })
      const data = await res.json()
      setInvoices(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }

  // Build ledger rows from invoices
  const ledgerRows = []
  let runningBal = 0

  // Opening
  ledgerRows.push({
    date:'Opening Balance', particulars:'Opening Balance',
    ref:'—', debit:0, credit:0, balance:0, type:'opening'
  })

  // Sort invoices by date
  const sorted = [...invoices].sort((a,b)=>
    new Date(a.invDate)-new Date(b.invDate))

  sorted.forEach(inv => {
    // Invoice (Debit - we owe vendor)
    const invAmt = parseFloat(inv.totalAmount||0)
    runningBal += invAmt
    ledgerRows.push({
      date:    new Date(inv.invDate).toLocaleDateString('en-IN'),
      particulars: `Purchase — ${inv.poNo||inv.invNo}`,
      ref:     inv.invNo,
      debit:   invAmt,
      credit:  0,
      balance: runningBal,
      status:  inv.status,
      type:    'invoice'
    })

    // Payment (Credit - we paid vendor)
    const paidAmt = parseFloat(inv.paidAmount||0)
    if (paidAmt > 0) {
      runningBal -= paidAmt
      ledgerRows.push({
        date:    inv.paymentDate
          ? new Date(inv.paymentDate).toLocaleDateString('en-IN')
          : '—',
        particulars: `Payment — ${inv.paymentMode||'Bank'}`,
        ref:     inv.paymentRef||'—',
        debit:   0,
        credit:  paidAmt,
        balance: runningBal,
        type:    'payment'
      })
    }
  })

  const totalOutstanding = invoices.reduce((s,i)=>
    s+parseFloat(i.balance||0), 0)
  const totalDebit  = invoices.reduce((s,i)=>
    s+parseFloat(i.totalAmount||0), 0)
  const totalCredit = invoices.reduce((s,i)=>
    s+parseFloat(i.paidAmount||0), 0)
  const overdueInvs = invoices.filter(i=>
    i.status==='PENDING' && i.dueDate &&
    new Date(i.dueDate)<new Date())

  return (
    <div>
      {/* Sticky Header */}
      <div style={{ position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8',
        borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Vendor Ledger
            <small>Outstanding & Transaction History</small>
          </div>
          <div className="lv-acts">
            <select style={{ padding:'6px 10px',
              border:'1px solid #E0D5E0', borderRadius:5,
              fontSize:12, cursor:'pointer', minWidth:200 }}
              value={selVendor?.vendorCode||''}
              onChange={e=>{
                const v=vendors.find(v=>v.vendorCode===e.target.value)
                if(v) loadLedger(v)
              }}>
              {vendors.map(v=>(
                <option key={v.vendorCode} value={v.vendorCode}>
                  {v.vendorCode} — {v.vendorName}
                </option>
              ))}
            </select>
            <button className="btn btn-s sd-bsm">Export</button>
            {totalOutstanding>0 && (
              <button className="btn btn-p sd-bsm"
                onClick={()=>setShowPay(true)}>
                💳 Record Payment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Summary Card */}
      {selVendor && (
        <div style={{ background:'#fff', borderRadius:8,
          border:'1px solid #E0D5E0', padding:20,
          marginBottom:14 }}>
          <div style={{ display:'flex',
            justifyContent:'space-between',
            alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif',
                fontSize:18, fontWeight:700 }}>
                {selVendor.vendorName}
              </div>
              <div style={{ fontSize:12, color:'#6C757D' }}>
                {selVendor.vendorCode} ·
                {selVendor.gstin||'No GSTIN'} ·
                {selVendor.city||''}
              </div>
            </div>
            {/* Summary boxes */}
            <div style={{ display:'flex', gap:12 }}>
              {[
                ['Total Purchases', fmtC(totalDebit),   '#714B67'],
                ['Total Paid',      fmtC(totalCredit),  '#155724'],
                ['Outstanding',     fmtC(totalOutstanding),
                  totalOutstanding>0?'#DC3545':'#155724'],
              ].map(([l,v,c])=>(
                <div key={l} style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:'#6C757D' }}>
                    {l}
                  </div>
                  <div style={{ fontFamily:'Syne,sans-serif',
                    fontSize:20, fontWeight:800, color:c }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {overdueInvs.length>0 && (
            <div style={{ marginTop:12, background:'#F8D7DA',
              borderRadius:6, padding:'8px 12px',
              fontSize:12, color:'#721C24',
              display:'flex', justifyContent:'space-between',
              alignItems:'center' }}>
              <span>
                🔴 <strong>{overdueInvs.length} invoice(s)
                overdue</strong> — Pay immediately!
              </span>
              <button onClick={()=>setShowPay(true)}
                style={{ padding:'4px 14px',
                  background:'#DC3545', color:'#fff',
                  border:'none', borderRadius:5,
                  fontSize:11, cursor:'pointer',
                  fontWeight:700 }}>
                Pay Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ledger Table */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center',
          color:'#6C757D' }}>⏳ Loading ledger...</div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0',
          borderRadius:8, overflow:'hidden',
          marginBottom:14 }}>
          <table style={{ width:'100%',
            borderCollapse:'collapse', fontSize:12 }}>
            <thead style={{ background:'#F8F4F8',
              position:'sticky', top:60 }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Date','Particulars','Ref No.',
                  'Debit (₹)','Credit (₹)',
                  'Balance (₹)','Status'].map(h=>(
                  <th key={h} style={{ padding:'9px 12px',
                    fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:
                      ['Debit (₹)','Credit (₹)',
                       'Balance (₹)'].includes(h)
                       ?'right':'left',
                    textTransform:'uppercase',
                    letterSpacing:.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledgerRows.map((r,i)=>(
                <tr key={i} style={{
                  borderBottom:'1px solid #F0EEF0',
                  background:
                    r.type==='opening'?'#F8F4F8':
                    r.type==='payment'?'#F0FFF4':'#fff',
                  fontStyle:
                    r.type==='opening'?'italic':'normal' }}>
                  <td style={{ padding:'8px 12px',
                    fontSize:11, color:'#6C757D',
                    whiteSpace:'nowrap' }}>{r.date}</td>
                  <td style={{ padding:'8px 12px',
                    fontWeight:
                      r.type==='opening'?400:600 }}>
                    {r.particulars}
                  </td>
                  <td style={{ padding:'8px 12px',
                    fontFamily:'DM Mono,monospace',
                    fontSize:11, color:'#6C757D' }}>
                    {r.ref}
                  </td>
                  <td style={{ padding:'8px 12px',
                    textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    color: r.debit>0?'#DC3545':'#ccc',
                    fontWeight: r.debit>0?700:400 }}>
                    {r.debit>0?fmtC(r.debit):'—'}
                  </td>
                  <td style={{ padding:'8px 12px',
                    textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    color: r.credit>0?'#155724':'#ccc',
                    fontWeight: r.credit>0?700:400 }}>
                    {r.credit>0?fmtC(r.credit):'—'}
                  </td>
                  <td style={{ padding:'8px 12px',
                    textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    fontWeight:700,
                    color: r.balance>0?'#856404'
                      :r.balance<0?'#DC3545':'#155724' }}>
                    {fmtC(Math.abs(r.balance))}
                    {r.balance<0?' (Advance)':''}
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    {r.status && (
                      <span style={{ padding:'2px 8px',
                        borderRadius:10, fontSize:10,
                        fontWeight:700,
                        background:
                          r.status==='PAID'   ?'#D4EDDA':
                          r.status==='PARTIAL'?'#D1ECF1':
                          r.status==='OVERDUE'?'#F8D7DA':
                                               '#FFF3CD',
                        color:
                          r.status==='PAID'   ?'#155724':
                          r.status==='PARTIAL'?'#0C5460':
                          r.status==='OVERDUE'?'#721C24':
                                               '#856404' }}>
                        {r.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {/* Closing balance row */}
              <tr style={{ background:'#FFF3CD',
                borderTop:'2px solid #856404' }}>
                <td colSpan={5} style={{ padding:'10px 12px',
                  fontWeight:800, fontSize:13,
                  color:'#856404',
                  fontFamily:'Syne,sans-serif' }}>
                  Closing Outstanding Balance
                </td>
                <td style={{ padding:'10px 12px',
                  textAlign:'right',
                  fontFamily:'DM Mono,monospace',
                  fontSize:15, fontWeight:800,
                  color: totalOutstanding>0
                    ?'#DC3545':'#155724' }}>
                  {fmtC(totalOutstanding)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Action Buttons */}
      {totalOutstanding>0 && (
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-p sd-bsm"
            onClick={()=>setShowPay(true)}>
            💳 Pay {fmtC(totalOutstanding)} (Full)
          </button>
          <button className="btn btn-s sd-bsm"
            onClick={()=>setShowPay(true)}>
            Partial Payment
          </button>
        </div>
      )}

      {showPay && selVendor && (
        <PayModal
          vendor={selVendor}
          balance={totalOutstanding}
          onSave={()=>{ setShowPay(false); loadLedger(selVendor) }}
          onCancel={()=>setShowPay(false)} />
      )}
    </div>
  )
}
