import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n  => n != null ? '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits:2 }) : '—'
const fmtD = s  => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

const STATUS_STYLE = {
  DRAFT:     { bg:'#F8F9FA', c:'#6C757D' },
  OPEN:      { bg:'#D1ECF1', c:'#0C5460' },
  CONFIRMED: { bg:'#D4EDDA', c:'#155724' },
  PROCESSING:{ bg:'#FFF3CD', c:'#856404' },
  DELIVERED: { bg:'#CCE5FF', c:'#004085' },
  PAID:      { bg:'#D4EDDA', c:'#155724' },
  CANCELLED: { bg:'#F8D7DA', c:'#721C24' },
}

export default function SOView() {
  const nav        = useNavigate()
  const { id }     = useParams()
  const [so,       setSO]       = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`${BASE}/sd/orders/${id}`, { headers: hdr2() })
      .then(r => r.json())
      .then(d => {
        if (d.data) setSO(d.data)
        else toast.error('SO not found')
      })
      .catch(() => toast.error('Failed to load SO'))
      .finally(() => setLoading(false))
  }, [id])

  const confirm = async () => {
    if (!window.confirm(`Confirm ${so.soNo}?`)) return
    setActing(true)
    try {
      const res  = await fetch(`${BASE}/sd/orders/${id}/confirm`, { method:'POST', headers: hdr() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${so.soNo} confirmed!`)
      setSO(prev => ({ ...prev, status:'CONFIRMED' }))
    } catch(e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  const deleteSO = async () => {
    if (!window.confirm(`Delete ${so.soNo}? This cannot be undone.`)) return
    setActing(true)
    try {
      const res  = await fetch(`${BASE}/sd/orders/${id}`, { method:'DELETE', headers: hdr() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${so.soNo} deleted!`)
      nav('/sd/orders')
    } catch(e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  // Parse lines — supports both lineItems JSON and relational lines[]
  const getLines = () => {
    if (!so) return []
    // lineItems is JSON field (new)
    if (so.lineItems) {
      try {
        const parsed = typeof so.lineItems === 'string' ? JSON.parse(so.lineItems) : so.lineItems
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {}
    }
    // lines[] is relational (old)
    if (Array.isArray(so.lines) && so.lines.length > 0) return so.lines
    return []
  }

  if (loading) return (
    <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>
      <div style={{ fontSize:32 }}>⏳</div>Loading Sales Order...
    </div>
  )

  if (!so) return (
    <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>
      <div style={{ fontSize:32 }}>❌</div>
      Sales Order not found.
      <br/>
      <button className="btn btn-s sd-bsm" style={{ marginTop:12 }}
        onClick={() => nav('/sd/orders')}>← Back</button>
    </div>
  )

  const lines     = getLines()
  const statusSt  = STATUS_STYLE[(so.status||'DRAFT').toUpperCase()] || STATUS_STYLE.DRAFT
  const isDraft   = ['DRAFT','OPEN'].includes((so.status||'').toUpperCase())
  const canInvoice= ['CONFIRMED','PROCESSING','DELIVERED'].includes((so.status||'').toUpperCase())

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
        borderRadius:8, padding:'16px 20px', marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ fontFamily:'DM Mono,monospace', fontSize:20,
                fontWeight:800, color:'#714B67' }}>
                {so.soNo}
              </span>
              <span style={{ background: statusSt.bg, color: statusSt.c,
                padding:'3px 12px', borderRadius:10,
                fontSize:11, fontWeight:700 }}>
                {(so.status||'DRAFT').toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize:12, color:'#6C757D', display:'flex',
              gap:16, flexWrap:'wrap' }}>
              <span>📅 {fmtD(so.orderDate || so.date)}</span>
              <span>👤 {so.customerName}</span>
              {so.poReference && <span>PO: {so.poReference}</span>}
              {so.deliveryDate && <span>Delivery: {fmtD(so.deliveryDate)}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="btn btn-s sd-bsm"
              onClick={() => nav('/sd/orders')}>← Back</button>
            {isDraft && (
              <>
                <button className="btn btn-s sd-bsm"
                  onClick={() => nav(`/sd/orders/new?editId=${id}`)}
                  style={{ color:'#714B67', borderColor:'#714B67' }}>
                  ✏️ Edit
                </button>
                <button className="btn btn-s sd-bsm"
                  style={{ background:'#D4EDDA', color:'#155724',
                    border:'1.5px solid #C3E6CB' }}
                  disabled={acting} onClick={confirm}>
                  ✅ Confirm SO
                </button>
                <button className="btn btn-s sd-bsm"
                  style={{ background:'#F8D7DA', color:'#721C24',
                    border:'1.5px solid #F5C6CB' }}
                  disabled={acting} onClick={deleteSO}>
                  🗑️ Delete
                </button>
              </>
            )}
            {canInvoice && (
              <button className="btn btn-p sd-bsm"
                onClick={() => nav(`/sd/invoices/new?soId=${id}`)}>
                + Create Invoice
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          ['Taxable Amount', fmtC(so.taxableAmt), '#1A5276'],
          ['GST',           fmtC((parseFloat(so.cgst||0)+parseFloat(so.sgst||0)+parseFloat(so.igst||0))), '#856404'],
          ['Grand Total',   fmtC(so.grandTotal),  '#155724'],
          ['Items',         `${lines.length} item(s)`, '#714B67'],
        ].map(([l,v,c]) => (
          <div key={l} style={{ background:'#fff', border:'1.5px solid #E0D5E0',
            borderRadius:8, padding:'12px 16px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#6C757D',
              textTransform:'uppercase', marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:800, color:c,
              fontFamily:'DM Mono,monospace' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:14 }}>
        {/* ── Line Items ── */}
        <div>
          <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
            borderRadius:8, overflow:'hidden' }}>
            <div style={{ background:'#714B67', padding:'10px 16px',
              color:'#fff', fontWeight:700, fontSize:13 }}>
              📦 Line Items ({lines.length})
            </div>
            {lines.length === 0 ? (
              <div style={{ padding:30, textAlign:'center', color:'#6C757D',
                fontSize:12 }}>
                No line items found.
                {isDraft && (
                  <div style={{ marginTop:8 }}>
                    <button className="btn btn-s sd-bsm"
                      onClick={() => nav(`/sd/orders/new?editId=${id}`)}>
                      Edit SO to add items
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <table className="fi-data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>HSN</th>
                    <th style={{ textAlign:'right' }}>Qty</th>
                    <th>Unit</th>
                    <th style={{ textAlign:'right' }}>Rate</th>
                    <th style={{ textAlign:'right' }}>Disc%</th>
                    <th style={{ textAlign:'right' }}>Taxable</th>
                    <th style={{ textAlign:'right' }}>GST%</th>
                    <th style={{ textAlign:'right' }}>CGST</th>
                    <th style={{ textAlign:'right' }}>SGST</th>
                    <th style={{ textAlign:'right' }}>IGST</th>
                    <th style={{ textAlign:'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                      <td style={{ color:'#6C757D', fontSize:11 }}>{i+1}</td>
                      <td>
                        <div style={{ fontWeight:600, fontSize:12 }}>
                          {l.itemName || l.description}
                        </div>
                        {l.itemCode && (
                          <div style={{ fontSize:10, color:'#714B67',
                            fontFamily:'DM Mono,monospace' }}>
                            {l.itemCode}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize:11, color:'#6C757D',
                        fontFamily:'DM Mono,monospace' }}>
                        {l.hsnCode || '—'}
                      </td>
                      <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                        fontWeight:700 }}>
                        {parseFloat(l.qty||0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontSize:11, color:'#6C757D' }}>
                        {l.unit || 'Nos'}
                      </td>
                      <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace' }}>
                        {fmtC(l.rate || l.unitPrice)}
                      </td>
                      <td style={{ textAlign:'right', fontSize:11, color:'#6C757D' }}>
                        {parseFloat(l.discPct||0)}%
                      </td>
                      <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace' }}>
                        {fmtC(l.taxable || l.taxableAmt)}
                      </td>
                      <td style={{ textAlign:'right', fontSize:11, color:'#6C757D' }}>
                        {parseFloat(l.gstPct || l.gstRate || 18)}%
                      </td>
                      <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                        fontSize:11 }}>
                        {fmtC(l.cgst)}
                      </td>
                      <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                        fontSize:11 }}>
                        {fmtC(l.sgst)}
                      </td>
                      <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                        fontSize:11 }}>
                        {fmtC(l.igst)}
                      </td>
                      <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                        fontWeight:700, color:'#714B67' }}>
                        {fmtC(l.total || l.totalAmt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr style={{ background:'#F8F4F8', fontWeight:700 }}>
                    <td colSpan={7} style={{ textAlign:'right', fontSize:12,
                      color:'#714B67', padding:'10px 14px' }}>
                      TOTALS
                    </td>
                    <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                      color:'#1A5276' }}>
                      {fmtC(so.taxableAmt)}
                    </td>
                    <td></td>
                    <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                      fontSize:11 }}>
                      {fmtC(so.cgst)}
                    </td>
                    <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                      fontSize:11 }}>
                      {fmtC(so.sgst)}
                    </td>
                    <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                      fontSize:11 }}>
                      {fmtC(so.igst)}
                    </td>
                    <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                      color:'#155724', fontSize:14 }}>
                      {fmtC(so.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* ── Right Panel: Order Details ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Order Info */}
          <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
            borderRadius:8, overflow:'hidden' }}>
            <div style={{ background:'#F8F4F8', padding:'8px 14px',
              fontWeight:700, fontSize:12, color:'#714B67' }}>
              📋 Order Info
            </div>
            <div style={{ padding:'12px 16px' }}>
              {[
                ['SO Number',     so.soNo],
                ['Order Date',    fmtD(so.orderDate || so.date)],
                ['Delivery Date', fmtD(so.deliveryDate)],
                ['PO Reference',  so.poReference],
                ['PO Date',       fmtD(so.poDate)],
                ['Priority',      so.deliveryPriority || 'Normal'],
                ['Reason',        so.reasonForOrder],
              ].filter(([,v]) => v && v !== '—').map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between',
                  padding:'5px 0', borderBottom:'1px solid #F8F4F8',
                  fontSize:12 }}>
                  <span style={{ color:'#6C757D' }}>{l}</span>
                  <span style={{ fontWeight:600, color:'#1A1A2E',
                    textAlign:'right', maxWidth:'60%' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
            borderRadius:8, overflow:'hidden' }}>
            <div style={{ background:'#F8F4F8', padding:'8px 14px',
              fontWeight:700, fontSize:12, color:'#714B67' }}>
              👤 Customer
            </div>
            <div style={{ padding:'12px 16px' }}>
              {[
                ['Name',      so.customerName],
                ['GSTIN',     so.customerGstin],
                ['Bill To',   so.billToAddress],
                ['Ship To',   so.shipToAddress],
              ].filter(([,v]) => v).map(([l,v]) => (
                <div key={l} style={{ marginBottom:8, fontSize:12 }}>
                  <div style={{ color:'#6C757D', fontSize:10,
                    textTransform:'uppercase', fontWeight:700 }}>{l}</div>
                  <div style={{ fontWeight:600, color:'#1A1A2E',
                    marginTop:2, lineHeight:1.4 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Terms */}
          <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
            borderRadius:8, overflow:'hidden' }}>
            <div style={{ background:'#F8F4F8', padding:'8px 14px',
              fontWeight:700, fontSize:12, color:'#714B67' }}>
              💳 Payment & Terms
            </div>
            <div style={{ padding:'12px 16px' }}>
              {[
                ['Payment Terms', so.paymentTerms],
                ['Incoterms',     so.incoterms],
                ['Freight Terms', so.freightTerms],
                ['Currency',      so.currency || 'INR'],
                ['Sales Org',     so.salesOrg],
                ['Distribution',  so.distributionChannel],
                ['T&C',           so.termsAndConditions],
              ].filter(([,v]) => v).map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between',
                  padding:'5px 0', borderBottom:'1px solid #F8F4F8',
                  fontSize:12 }}>
                  <span style={{ color:'#6C757D' }}>{l}</span>
                  <span style={{ fontWeight:600, color:'#1A1A2E' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Remarks */}
          {(so.remarks || so.notes || so.specialInstructions) && (
            <div style={{ background:'#FFF3CD', border:'1px solid #FFE69C',
              borderRadius:8, padding:'12px 16px', fontSize:12 }}>
              <div style={{ fontWeight:700, color:'#856404',
                marginBottom:6 }}>📝 Remarks</div>
              <div style={{ color:'#6C757D', lineHeight:1.5 }}>
                {so.remarks || so.notes || so.specialInstructions}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
