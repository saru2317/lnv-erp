import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const fmt  = n => n ? `₹${parseFloat(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}` : '₹0.00'
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const STATUS_CLR = {
  DRAFT:    '#6C757D', SENT:'#1565C0', APPROVED:'#155724',
  REJECTED:'#721C24', EXPIRED:'#856404',
}

export default function QuotationView() {
  const nav = useNavigate()
  const { id } = useParams()
  const [quote,   setQuote]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/crm/quotations/${id}`, { headers:hdr2() })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setQuote(d.data)
    } catch(e) { toast.error('Failed to load quotation') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (id) load() }, [id])

  const [showPOForm, setShowPOForm] = useState(false)
  const [poForm,     setPOForm]     = useState({ poReference:'', poDate:'' })

  const updateStatus = async (status) => {
    setSaving(true)
    try {
      const r = await fetch(`${BASE_URL}/crm/quotations/${id}`, {
        method:'PATCH', headers:hdr(),
        body: JSON.stringify({ status })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setQuote(q=>({...q, status}))
      toast.success(`Status updated to ${status}`)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const saveCustomerPO = async () => {
    if (!poForm.poReference) { toast.error('Enter customer PO number'); return }
    setSaving(true)
    try {
      const r = await fetch(`${BASE_URL}/crm/quotations/${id}`, {
        method:'PATCH', headers:hdr(),
        body: JSON.stringify({
          poReference: poForm.poReference,
          poDate:      poForm.poDate ? new Date(poForm.poDate) : null,
          status:      'APPROVED', // PO received = approved
        })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setQuote(q=>({...q, poReference:poForm.poReference, poDate:poForm.poDate, status:'APPROVED'}))
      setShowPOForm(false)
      toast.success(`Customer PO ${poForm.poReference} saved — Quotation Approved!`)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // Convert CRM Quotation → SD Sales Order
  const convertToSO = () => {
    if (!quote) return
    const params = new URLSearchParams({
      fromQuot:     quote.quotNo,
      quotId:       quote.id,
      customerId:   quote.customerId || '',
      customerName: quote.customerName || '',
      amount:       quote.grandTotal || '',
      poReference:  quote.poReference || '',
      poDate:       quote.poDate || '',
      notes:        `From CRM Quotation ${quote.quotNo}${quote.poReference ? ` · Customer PO: ${quote.poReference}` : ''}`,
    })
    nav(`/sd/orders/new?${params}`)
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading…</div>
  if (!quote)  return <div style={{padding:40,textAlign:'center',color:'#C62828'}}>Quotation not found</div>

  const sc      = STATUS_CLR[quote.status] || '#6C757D'
  const isExpired = quote.validTill && new Date(quote.validTill) < new Date()
  const lines   = quote.lines || []

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <button onClick={()=>nav('/crm/quotations')}
              style={{background:'none',border:'none',cursor:'pointer',color:'#6C757D',fontSize:12}}>
              ← Quotations
            </button>
            <span style={{color:'#6C757D'}}>/</span>
            <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
              {quote.quotNo}
            </span>
            <span style={{padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:700,
              background:sc+'22',color:sc}}>{quote.status}</span>
            {isExpired && quote.status!=='APPROVED' &&
              <span style={{padding:'3px 8px',borderRadius:6,fontSize:10,fontWeight:700,
                background:'#FFF3CD',color:'#856404'}}>⚠️ EXPIRED</span>}
          </div>
          <div style={{fontSize:12,color:'#6C757D'}}>
            {quote.customerName} · Created {fmtD(quote.createdAt)}
            {quote.validTill && ` · Valid till ${fmtD(quote.validTill)}`}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {quote.status==='DRAFT' && (
            <button onClick={()=>updateStatus('SENT')} disabled={saving}
              style={{padding:'7px 14px',background:'#1565C0',color:'#fff',border:'none',
                borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              📧 Send to Customer
            </button>
          )}
          {quote.status==='SENT' && (
            <>
              <button onClick={()=>{ setPOForm({poReference:quote.poReference||'',poDate:quote.poDate||''}); setShowPOForm(true) }} disabled={saving}
                style={{padding:'7px 14px',background:'#E8F5E9',color:'#155724',border:'1px solid #A5D6A7',
                  borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                📄 Customer PO Received
              </button>
              <button onClick={()=>updateStatus('APPROVED')} disabled={saving}
                style={{padding:'7px 14px',background:'#D4EDDA',color:'#155724',border:'1px solid #C3E6CB',
                  borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                ✅ Mark Approved
              </button>
              <button onClick={()=>updateStatus('REJECTED')} disabled={saving}
                style={{padding:'7px 14px',background:'#F8D7DA',color:'#721C24',border:'1px solid #F5C6CB',
                  borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                ✗ Mark Rejected
              </button>
            </>
          )}
          {quote.status==='APPROVED' && (
            <button onClick={convertToSO}
              style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',
                borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              🚀 Convert to Sales Order
            </button>
          )}
          <button onClick={()=>window.print()}
            style={{padding:'7px 14px',background:'#fff',border:'1px solid var(--odoo-border)',
              borderRadius:6,fontSize:12,cursor:'pointer'}}>
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Customer PO Received Modal */}
      {showPOForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:10,padding:24,width:460,
            boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,
              color:'#155724',marginBottom:4}}>📄 Customer PO Received</div>
            <div style={{fontSize:12,color:'#6C757D',marginBottom:18}}>
              Enter the PO number the customer sent against our quotation <strong>{quote.quotNo}</strong>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',
                marginBottom:4,textTransform:'uppercase'}}>Customer PO Number *</label>
              <input value={poForm.poReference}
                onChange={e=>setPOForm(f=>({...f,poReference:e.target.value}))}
                placeholder="e.g. MILL/PO/2026/145"
                style={{width:'100%',padding:'8px 10px',border:'1.5px solid #A5D6A7',
                  borderRadius:6,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'DM Mono,monospace'}} />
            </div>
            <div style={{marginBottom:18}}>
              <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',
                marginBottom:4,textTransform:'uppercase'}}>Customer PO Date</label>
              <input type="date" value={poForm.poDate}
                onChange={e=>setPOForm(f=>({...f,poDate:e.target.value}))}
                style={{width:'100%',padding:'8px 10px',border:'1.5px solid var(--odoo-border)',
                  borderRadius:6,fontSize:12,outline:'none',boxSizing:'border-box'}} />
            </div>
            <div style={{background:'#E8F5E9',padding:10,borderRadius:6,fontSize:11,
              color:'#2E7D32',marginBottom:16}}>
              ✅ Saving PO will automatically mark this quotation as <strong>APPROVED</strong>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowPOForm(false)}
                style={{padding:'7px 16px',borderRadius:6,border:'1px solid var(--odoo-border)',
                  background:'#fff',fontSize:12,cursor:'pointer'}}>Cancel</button>
              <button onClick={saveCustomerPO} disabled={saving}
                style={{padding:'7px 16px',borderRadius:6,border:'none',
                  background:'#155724',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                {saving?'Saving…':'✓ Save Customer PO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer PO Badge */}
      {quote.poReference && (
        <div style={{background:'#E8F5E9',border:'1px solid #A5D6A7',borderRadius:8,
          padding:'10px 16px',marginBottom:14,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:20}}>📄</span>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:'#155724'}}>
              Customer PO Received
            </div>
            <div style={{fontSize:12,color:'#2E7D32'}}>
              PO No: <strong style={{fontFamily:'DM Mono,monospace'}}>{quote.poReference}</strong>
              {quote.poDate && <span style={{marginLeft:12}}>
                Date: {new Date(quote.poDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
              </span>}
            </div>
          </div>
          {quote.status==='APPROVED' && (
            <button onClick={convertToSO}
              style={{marginLeft:'auto',padding:'7px 16px',background:'#714B67',color:'#fff',
                border:'none',borderRadius:6,fontWeight:700,fontSize:12,cursor:'pointer'}}>
              🚀 Convert to Sales Order
            </button>
          )}
        </div>
      )}

      {/* Status banners */}
      {quote.status==='APPROVED' && !quote.poReference && (
        <div style={{background:'#D4EDDA',border:'1px solid #C3E6CB',borderRadius:8,
          padding:'10px 16px',marginBottom:14,fontSize:12,color:'#155724',fontWeight:600}}>
          ✅ Quotation Approved — Click <strong>📄 Customer PO Received</strong> to record the PO, then convert to Sales Order.
        </div>
      )}
      {quote.status==='APPROVED' && quote.poReference && (
        <div style={{background:'#D4EDDA',border:'1px solid #C3E6CB',borderRadius:8,
          padding:'10px 16px',marginBottom:14,fontSize:12,color:'#155724',fontWeight:600}}>
          ✅ Quotation Approved with Customer PO — Ready to convert to Sales Order.
        </div>
      )}
        <div style={{background:'#D4EDDA',border:'1px solid #C3E6CB',borderRadius:8,
          padding:'10px 16px',marginBottom:14,fontSize:12,color:'#155724',fontWeight:600}}>
          ✅ Quotation Approved! Click <strong>Convert to Sales Order</strong> to create an SO in the Sales module.
        </div>
      )}
      {quote.status==='REJECTED' && (
        <div style={{background:'#F8D7DA',border:'1px solid #F5C6CB',borderRadius:8,
          padding:'10px 16px',marginBottom:14,fontSize:12,color:'#721C24'}}>
          ✗ Quotation rejected by customer.
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14}}>
        <div>
          {/* Customer Info */}
          <div className="fi-panel" style={{marginBottom:12}}>
            <div className="fi-panel-hdr"><h3>Customer Details</h3></div>
            <div className="fi-panel-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[
                  ['Customer',     quote.customerName],
                  ['GSTIN',        quote.customerGstin||'—'],
                  ['State',        quote.customerState||'—'],
                  ['Payment Terms',quote.paymentTerms||'—'],
                  ['Delivery Terms',quote.deliveryTerms||'—'],
                  ['Valid Till',   fmtD(quote.validTill)],
                ].map(([k,v])=>(
                  <div key={k} style={{padding:'8px 10px',background:'#F8F9FA',borderRadius:6}}>
                    <div style={{fontSize:10,color:'#6C757D',fontWeight:700,textTransform:'uppercase',marginBottom:2}}>{k}</div>
                    <div style={{fontSize:12,fontWeight:600}}>{v}</div>
                  </div>
                ))}
              </div>
              {quote.notes && (
                <div style={{marginTop:10,padding:'8px 10px',background:'#FFF3CD',borderRadius:6,fontSize:12,color:'#856404'}}>
                  📝 {quote.notes}
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>Items / Services</h3></div>
            <div className="fi-panel-body" style={{padding:0}}>
              {lines.length === 0 ? (
                <div style={{padding:20,textAlign:'center',color:'#6C757D',fontSize:12}}>No line items</div>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#F0EEEB'}}>
                      {['#','Item Code','Description','Qty','UOM','Rate','Disc%','Amount'].map(h=>(
                        <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:11,
                          fontWeight:700,color:'#6C757D'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid #F0EEEB'}}>
                        <td style={{padding:'8px 10px',fontSize:12,color:'#6C757D'}}>{i+1}</td>
                        <td style={{padding:'8px 10px'}}>
                          <code style={{fontSize:11,color:'#714B67',background:'#EDE0EA',
                            padding:'1px 5px',borderRadius:3}}>{l.itemCode||'—'}</code>
                        </td>
                        <td style={{padding:'8px 10px',fontSize:12,fontWeight:600}}>{l.description}</td>
                        <td style={{padding:'8px 10px',fontSize:12}}>{l.qty}</td>
                        <td style={{padding:'8px 10px',fontSize:11,color:'#6C757D'}}>{l.uom}</td>
                        <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',fontSize:12}}>
                          {fmt(l.rate)}
                        </td>
                        <td style={{padding:'8px 10px',fontSize:11,
                          color:parseFloat(l.discount||0)>0?'#E65100':'#6C757D'}}>
                          {parseFloat(l.discount||0)}%
                        </td>
                        <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',
                          fontWeight:700,fontSize:12,color:'#2E7D32'}}>
                          {fmt(l.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right panel — Amount summary */}
        <div>
          <div className="fi-panel" style={{marginBottom:12}}>
            <div className="fi-panel-hdr"><h3>Amount Summary</h3></div>
            <div className="fi-panel-body">
              {[
                ['Taxable Amount', fmt(quote.taxableAmt), '#1C1C1C'],
                ['CGST',           fmt(quote.cgst),       '#1565C0'],
                ['SGST',           fmt(quote.sgst),       '#1565C0'],
                ['IGST',           fmt(quote.igst),       '#117A65'],
              ].map(([l,v,c])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',
                  padding:'7px 0',borderBottom:'1px solid #F0EEEB',fontSize:12}}>
                  <span style={{color:'#6C757D'}}>{l}</span>
                  <span style={{fontWeight:600,color:c,fontFamily:'DM Mono,monospace'}}>{v}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',
                padding:'12px 0',fontSize:16,fontWeight:800}}>
                <span>Grand Total</span>
                <span style={{color:'#2E7D32',fontFamily:'DM Mono,monospace'}}>{fmt(quote.grandTotal)}</span>
              </div>

              {/* Convert button in panel too */}
              {quote.status==='APPROVED' && (
                <button onClick={convertToSO} style={{width:'100%',padding:'10px',
                  background:'#714B67',color:'#fff',border:'none',borderRadius:6,
                  fontWeight:700,fontSize:13,cursor:'pointer',marginTop:8}}>
                  🚀 Convert to Sales Order
                </button>
              )}
            </div>
          </div>

          {/* Lead link */}
          {quote.crmLeadId && (
            <div className="fi-panel">
              <div className="fi-panel-hdr"><h3>Linked Lead</h3></div>
              <div className="fi-panel-body">
                <button onClick={()=>nav(`/crm/leads/${quote.crmLeadId}`)}
                  style={{width:'100%',padding:'8px',background:'#EDE0EA',color:'#714B67',
                    border:'none',borderRadius:6,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                  🔗 View Lead / Opportunity
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
