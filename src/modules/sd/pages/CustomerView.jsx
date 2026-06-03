import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })
const fmtC = n => n != null ? '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'
const fmtD = s => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

export default function CustomerView() {
  const nav        = useNavigate()
  const { id }     = useParams()
  const [cust,     setCust]    = useState(null)
  const [loading,  setLoading] = useState(true)
  const [tab,      setTab]     = useState('overview')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`${BASE}/sd/customers/${id}`, { headers: hdr2() })
      .then(r => r.json())
      .then(d => {
        if (d.data) setCust(d.data)
        else toast.error('Customer not found')
      })
      .catch(() => toast.error('Failed to load customer'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>
      <div style={{ fontSize:32 }}>⏳</div>
      Loading customer...
    </div>
  )

  if (!cust) return (
    <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>
      <div style={{ fontSize:32 }}>❌</div>
      Customer not found.
      <br/>
      <button className="btn btn-s sd-bsm" style={{ marginTop:12 }}
        onClick={() => nav('/sd/customers')}>← Back to Customers</button>
    </div>
  )

  // Parse shipToAddresses
  const shipTos = (() => {
    const raw = cust.shipToAddresses
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    try { return JSON.parse(raw) } catch { return [] }
  })()

  const statusStyle = {
    active:   { bg:'#D4EDDA', c:'#155724' },
    inactive: { bg:'#F5F5F5', c:'#6C757D' },
    overdue:  { bg:'#F8D7DA', c:'#721C24' },
  }[cust.status?.toLowerCase()] || { bg:'#D4EDDA', c:'#155724' }

  const TABS = [
    { id:'overview',  label:'Overview'           },
    { id:'address',   label:'Addresses'          },
    { id:'financial', label:'Credit & Payment'   },
    { id:'txns',      label:`Transactions (${(cust.invoices||[]).length})` },
  ]

  const Field = ({ label, value, mono }) => (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#6C757D',
        textTransform:'uppercase', marginBottom:2 }}>
        {label}
      </div>
      <div style={{ fontSize:13, fontWeight:600, color:'#1A1A2E',
        fontFamily: mono ? 'DM Mono,monospace' : 'inherit' }}>
        {value || '—'}
      </div>
    </div>
  )

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
        borderRadius:8, padding:'16px 20px', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'flex-start',
          justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            {/* Customer code + name */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:'DM Mono,monospace', fontSize:12,
                color:'#714B67', fontWeight:700,
                background:'#EDE0EA', padding:'2px 10px', borderRadius:6 }}>
                {cust.code || `#${cust.id}`}
              </span>
              <span style={{ background: cust.type==='A' ? '#D4EDDA' : '#E8F4FD',
                color: cust.type==='A' ? '#155724' : '#1A5276',
                fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:8 }}>
                Type {cust.type || 'B'}
              </span>
              <span style={{ background: statusStyle.bg, color: statusStyle.c,
                fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:8 }}>
                {(cust.status || 'ACTIVE').toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:'#1A1A2E',
              marginTop:6, fontFamily:'Syne,sans-serif' }}>
              {cust.name}
            </div>
            <div style={{ fontSize:12, color:'#6C757D', marginTop:4,
              display:'flex', gap:16, flexWrap:'wrap' }}>
              {cust.gstin && <span>🏢 GSTIN: <strong style={{ fontFamily:'DM Mono,monospace' }}>{cust.gstin}</strong></span>}
              {cust.phone && <span>📞 {cust.phone}</span>}
              {cust.email && <span>✉️ {cust.email}</span>}
              {cust.city  && <span>📍 {cust.city}{cust.state ? `, ${cust.state}` : ''}</span>}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="btn btn-s sd-bsm"
              onClick={() => nav('/sd/customers')}>
              ← Back
            </button>
            <button className="btn btn-s sd-bsm"
              onClick={() => nav(`/mdm/customers?edit=${cust.id}`)}
              style={{ color:'#714B67', borderColor:'#714B67' }}>
              ✏️ Edit in MDM
            </button>
            <button className="btn btn-p sd-bsm"
              onClick={() => nav(`/sd/invoices/new?customerId=${cust.id}&customerName=${encodeURIComponent(cust.name)}`)}>
              + New Invoice
            </button>
            <button className="btn btn-s sd-bsm"
              onClick={() => nav(`/sd/orders/new?customerId=${cust.id}`)}>
              + New SO
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
          gap:10, marginTop:16 }}>
          {[
            ['Total Business', fmtC(cust.totalBusiness), '#714B67'],
            ['Outstanding',    fmtC(cust.outstanding),   cust.outstanding > 0 ? '#DC3545' : '#155724'],
            ['Credit Limit',   fmtC(cust.creditLimit),   '#1A5276'],
            ['Credit Days',    `${cust.creditDays || 30} days`, '#856404'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background:'#F8F4F8', borderRadius:8,
              padding:'10px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#6C757D',
                textTransform:'uppercase' }}>{l}</div>
              <div style={{ fontSize:18, fontWeight:800, color: c,
                fontFamily:'DM Mono,monospace', marginTop:4 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:4, marginBottom:12 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'7px 18px', borderRadius:6, fontSize:12,
              fontWeight:700, cursor:'pointer', border:'1.5px solid',
              background: tab===t.id ? '#714B67' : '#fff',
              color:      tab===t.id ? '#fff'    : '#714B67',
              borderColor: '#714B67' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
        borderRadius:8, padding:'20px' }}>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'#714B67',
                marginBottom:12, paddingBottom:8,
                borderBottom:'1.5px solid #F0EEF0' }}>
                General Information
              </div>
              <Field label="Customer Name"  value={cust.name} />
              <Field label="Customer Code"  value={cust.code || `#${cust.id}`} mono />
              <Field label="Customer Type"  value={cust.type === 'A' ? 'Type A — Key Account' : 'Type B — Regular'} />
              <Field label="Mobile / Phone" value={cust.phone} />
              <Field label="Email"          value={cust.email} />
              <Field label="Website"        value={cust.website} />
              <Field label="Currency"       value={cust.currency || 'INR'} />
              <Field label="Price List"     value={cust.priceList || 'Standard'} />
              <Field label="Sales Rep"      value={cust.salesRep || cust.salesExec} />
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'#714B67',
                marginBottom:12, paddingBottom:8,
                borderBottom:'1.5px solid #F0EEF0' }}>
                Tax Information
              </div>
              <Field label="GSTIN"          value={cust.gstin} mono />
              <Field label="GST Type"       value={cust.gstRegType || cust.gstType || 'Regular'} />
              <Field label="PAN No."        value={cust.pan} mono />
              <Field label="Primary Address" value={
                [cust.address, cust.city, cust.state, cust.pincode].filter(Boolean).join(', ')
              } />
            </div>
          </div>
        )}

        {/* ── ADDRESS TAB ── */}
        {tab === 'address' && (
          <div>
            {/* Primary Billing Address */}
            <div style={{ fontWeight:700, fontSize:13, color:'#714B67',
              marginBottom:10 }}>
              📍 Billing Address (Primary)
            </div>
            <div style={{ background:'#F8F4F8', borderRadius:8,
              padding:'14px 18px', marginBottom:16,
              border:'1.5px solid #E0D5E0' }}>
              {cust.address
                ? <div style={{ fontSize:13, lineHeight:1.7 }}>
                    {cust.address}<br/>
                    {[cust.city, cust.state, cust.pincode].filter(Boolean).join(', ')}
                  </div>
                : <div style={{ color:'#6C757D', fontSize:12 }}>No billing address saved</div>
              }
            </div>

            {/* Ship-to Addresses */}
            <div style={{ fontWeight:700, fontSize:13, color:'#714B67',
              marginBottom:10 }}>
              🚚 Ship-to Addresses ({shipTos.length})
            </div>
            {shipTos.length === 0 ? (
              <div style={{ color:'#6C757D', fontSize:12, padding:'16px',
                background:'#F8F9FA', borderRadius:8,
                border:'1.5px dashed #DEE2E6', textAlign:'center' }}>
                No ship-to addresses. Add from MDM → Customer Master.
              </div>
            ) : (
              <div style={{ display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
                {shipTos.map((s, i) => (
                  <div key={i} style={{ background:'#F8F9FA', borderRadius:8,
                    padding:'12px 16px', border:'1.5px solid #E0D5E0' }}>
                    <div style={{ fontWeight:700, fontSize:12, color:'#714B67',
                      marginBottom:6 }}>
                      {s.isDefault ? '★ ' : ''}{s.label || `Ship-to ${i+1}`}
                    </div>
                    <div style={{ fontSize:12, color:'#495057', lineHeight:1.6 }}>
                      {s.address}<br/>
                      {[s.city, s.state, s.pincode].filter(Boolean).join(', ')}
                    </div>
                    {s.gstin && (
                      <div style={{ fontSize:11, color:'#6C757D', marginTop:4,
                        fontFamily:'DM Mono,monospace' }}>
                        GSTIN: {s.gstin}
                      </div>
                    )}
                    {s.contactPerson && (
                      <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>
                        Contact: {s.contactPerson} {s.phone && `· ${s.phone}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FINANCIAL TAB ── */}
        {tab === 'financial' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'#714B67',
                marginBottom:12, paddingBottom:8,
                borderBottom:'1.5px solid #F0EEF0' }}>
                Credit Terms
              </div>
              <Field label="Credit Limit"   value={fmtC(cust.creditLimit)} />
              <Field label="Credit Days"    value={`${cust.creditDays || 30} days`} />
              <Field label="Payment Terms"  value={cust.paymentTerms || 'Net 30'} />
              <Field label="Outstanding"    value={fmtC(cust.outstanding)} />
              <Field label="Overdue Limit"  value={fmtC(cust.overdueLimit)} />
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'#714B67',
                marginBottom:12, paddingBottom:8,
                borderBottom:'1.5px solid #F0EEF0' }}>
                Bank Details
              </div>
              <Field label="Bank Name"    value={cust.bankName} />
              <Field label="Branch"       value={cust.bankBranch} />
              <Field label="Account No."  value={cust.accountNo} mono />
              <Field label="IFSC Code"    value={cust.ifsc} mono />
            </div>
          </div>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {tab === 'txns' && (
          <div>
            {(cust.invoices || []).length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📄</div>
                No transactions yet for this customer.
                <br/>
                <button className="btn btn-p sd-bsm" style={{ marginTop:12 }}
                  onClick={() => nav(`/sd/invoices/new?customerId=${cust.id}&customerName=${encodeURIComponent(cust.name)}`)}>
                  + Create First Invoice
                </button>
              </div>
            ) : (
              <table className="fi-data-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th style={{ textAlign:'right' }}>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(cust.invoices || []).map((inv, i) => {
                    const statusStyle = {
                      PAID:    { bg:'#D4EDDA', c:'#155724' },
                      PENDING: { bg:'#FFF3CD', c:'#856404' },
                      OVERDUE: { bg:'#F8D7DA', c:'#721C24' },
                      DRAFT:   { bg:'#F8F9FA', c:'#6C757D' },
                    }[inv.status?.toUpperCase()] || { bg:'#F8F9FA', c:'#6C757D' }
                    return (
                      <tr key={i} style={{ cursor:'pointer' }}
                        onClick={() => nav(`/sd/invoices/${inv.id || i}`)}>
                        <td style={{ fontFamily:'DM Mono,monospace', fontSize:11,
                          color:'#714B67', fontWeight:700 }}>
                          {inv.invoiceNo}
                        </td>
                        <td style={{ fontSize:12 }}>{fmtD(inv.invoiceDate)}</td>
                        <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                          fontWeight:700 }}>
                          {fmtC(inv.grandTotal)}
                        </td>
                        <td style={{ fontSize:12, color:'#6C757D' }}>
                          {fmtD(inv.dueDate)}
                        </td>
                        <td>
                          <span style={{ background:statusStyle.bg, color:statusStyle.c,
                            padding:'2px 8px', borderRadius:10,
                            fontSize:10, fontWeight:700 }}>
                            {inv.status || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
