import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN',
  {minimumFractionDigits:2,maximumFractionDigits:2})

const STATUS = {
  DRAFT:       { bg:'#E9ECEF', color:'#383D41', label:'Draft'       },
  APPROVED:    { bg:'#D4EDDA', color:'#155724', label:'Approved'     },
  SENT:        { bg:'#D1ECF1', color:'#0C5460', label:'Sent'         },
  PARTIAL_GRN: { bg:'#FFF3CD', color:'#856404', label:'Partial GRN'  },
  GRN_DONE:    { bg:'#EDE0EA', color:'#714B67', label:'GRN Done'     },
  CANCELLED:   { bg:'#F8D7DA', color:'#721C24', label:'Cancelled'    },
}

function FollowUpModal({ po, onClose }) {
  const [followups, setFollowups] = useState([])
  const [note, setNote]   = useState('')
  const [date, setDate]   = useState(new Date().toISOString().split('T')[0])
  const [type, setType]   = useState('Call')
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    try {
      const saved = JSON.parse(
        localStorage.getItem(`po_followup_${po.id}`)||'[]')
      setFollowups(saved)
    } catch {}
  },[])

  const addFollowup = () => {
    if (!note) return toast.error('Enter followup note!')
    const newEntry = {
      id: Date.now(),
      type, date, note,
      by: JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name||'User',
      createdAt: new Date().toISOString()
    }
    const updated = [newEntry, ...followups]
    setFollowups(updated)
    localStorage.setItem(`po_followup_${po.id}`,
      JSON.stringify(updated))
    setNote('')
    toast.success('Follow-up recorded!')
  }

  return (
    <div style={{ position:'fixed', inset:0,
      background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10,
        width:560, maxHeight:'85vh', display:'flex',
        flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#0C5460', padding:'14px 20px',
          display:'flex', justifyContent:'space-between',
          alignItems:'center', borderRadius:'10px 10px 0 0' }}>
          <h3 style={{ color:'#fff', margin:0, fontSize:15,
            fontWeight:700 }}>
            📞 Supplier Follow-up — {po.poNo}
          </h3>
          <span onClick={onClose}
            style={{ color:'#fff', cursor:'pointer',
              fontSize:20 }}>✕</span>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:16 }}>
          {/* Add new */}
          <div style={{ background:'#F8F7FA', borderRadius:8,
            padding:14, marginBottom:14,
            border:'1px solid #E0D5E0' }}>
            <div style={{ fontWeight:700, fontSize:12,
              color:'#0C5460', marginBottom:10 }}>
              + New Follow-up
            </div>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 1fr', gap:10,
              marginBottom:10 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700,
                  color:'#495057', display:'block',
                  marginBottom:3, textTransform:'uppercase' }}>
                  Type
                </label>
                <select value={type}
                  onChange={e=>setType(e.target.value)}
                  style={{ padding:'7px 10px',
                    border:'1.5px solid #E0D5E0',
                    borderRadius:5, fontSize:12,
                    outline:'none', width:'100%' }}>
                  {['Call','Email','WhatsApp',
                    'Visit','SMS','Meeting'].map(t=>(
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700,
                  color:'#495057', display:'block',
                  marginBottom:3, textTransform:'uppercase' }}>
                  Date
                </label>
                <input type="date"
                  value={date}
                  onChange={e=>setDate(e.target.value)}
                  style={{ padding:'7px 10px',
                    border:'1.5px solid #E0D5E0',
                    borderRadius:5, fontSize:12,
                    outline:'none', width:'100%',
                    boxSizing:'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700,
                color:'#495057', display:'block',
                marginBottom:3, textTransform:'uppercase' }}>
                Note / Response
              </label>
              <textarea value={note}
                onChange={e=>setNote(e.target.value)}
                rows={2} placeholder="Supplier response, commitment date, remarks..."
                style={{ padding:'7px 10px',
                  border:'1.5px solid #E0D5E0',
                  borderRadius:5, fontSize:12,
                  outline:'none', width:'100%',
                  boxSizing:'border-box', resize:'vertical' }} />
            </div>
            <div style={{ display:'flex',
              justifyContent:'flex-end', marginTop:8 }}>
              <button onClick={addFollowup}
                style={{ padding:'7px 20px',
                  background:'#0C5460', color:'#fff',
                  border:'none', borderRadius:6,
                  fontSize:12, cursor:'pointer',
                  fontWeight:700 }}>
                + Add Follow-up
              </button>
            </div>
          </div>

          {/* History */}
          <div style={{ fontWeight:700, fontSize:12,
            color:'#714B67', marginBottom:8 }}>
            Follow-up History ({followups.length})
          </div>
          {followups.length===0 ? (
            <div style={{ padding:20, textAlign:'center',
              color:'#6C757D', fontSize:12 }}>
              No follow-ups recorded yet
            </div>
          ) : followups.map(f=>(
            <div key={f.id} style={{ padding:'10px 14px',
              border:'1px solid #E0D5E0', borderRadius:8,
              marginBottom:8, background:'#fff' }}>
              <div style={{ display:'flex',
                justifyContent:'space-between',
                alignItems:'center', marginBottom:4 }}>
                <div style={{ display:'flex', gap:8,
                  alignItems:'center' }}>
                  <span style={{ padding:'2px 8px',
                    borderRadius:8, fontSize:10,
                    fontWeight:700,
                    background:'#D1ECF1', color:'#0C5460' }}>
                    {f.type}
                  </span>
                  <span style={{ fontSize:11,
                    color:'#6C757D' }}>
                    {new Date(f.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <span style={{ fontSize:11, color:'#aaa' }}>
                  by {f.by}
                </span>
              </div>
              <div style={{ fontSize:12, color:'#1C1C1C' }}>
                {f.note}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'12px 20px',
          borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end',
          background:'#F8F7FA',
          borderRadius:'0 0 10px 10px' }}>
          <button onClick={onClose}
            style={{ padding:'8px 24px',
              background:'#714B67', color:'#fff',
              border:'none', borderRadius:6,
              fontSize:13, fontWeight:700,
              cursor:'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function CancelModal({ po, onSave, onCancel }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const cancel = async () => {
    if (!reason) return toast.error('Reason required!')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/mm/po/${po.id}`,
        { method:'PATCH', headers:authHdrs(),
          body:JSON.stringify({ status:'CANCELLED' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('PO Cancelled')
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0,
      background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10,
        width:440, overflow:'hidden',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#DC3545', padding:'14px 20px',
          display:'flex', justifyContent:'space-between',
          alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0,
            fontSize:15, fontWeight:700 }}>
            ❌ Cancel PO
          </h3>
          <span onClick={onCancel}
            style={{ color:'#fff', cursor:'pointer',
              fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20 }}>
          <div style={{ fontSize:13, color:'#495057',
            marginBottom:12 }}>
            <strong>{po.poNo}</strong> — {po.vendorName}
            <br/>
            <span style={{ fontSize:11, color:'#6C757D' }}>
              Total: {fmtC(po.totalAmount)}
            </span>
          </div>
          <label style={{ fontSize:11, fontWeight:700,
            color:'#495057', display:'block',
            marginBottom:4 }}>
            Cancellation Reason *
          </label>
          <textarea value={reason}
            onChange={e=>setReason(e.target.value)}
            rows={3} placeholder="Reason for cancellation..."
            style={{ padding:'8px 10px',
              border:'1.5px solid #E0D5E0',
              borderRadius:5, fontSize:12,
              outline:'none', width:'100%',
              boxSizing:'border-box', resize:'vertical' }} />
        </div>
        <div style={{ padding:'12px 20px',
          borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end',
          gap:10, background:'#F8F7FA' }}>
          <button onClick={onCancel}
            style={{ padding:'8px 20px', background:'#fff',
              color:'#6C757D',
              border:'1.5px solid #E0D5E0',
              borderRadius:6, fontSize:13,
              cursor:'pointer' }}>
            Back
          </button>
          <button onClick={cancel} disabled={saving}
            style={{ padding:'8px 24px',
              background:'#DC3545', color:'#fff',
              border:'none', borderRadius:6,
              fontSize:13, fontWeight:700,
              cursor:'pointer' }}>
            {saving?'⏳':'❌'} Cancel PO
          </button>
        </div>
      </div>
    </div>
  )
}

export default function POView() {
  const nav  = useNavigate()
  const { id } = useParams()
  const [po,      setPO]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFollowup, setShowFollowup] = useState(false)
  const [showCancel,   setShowCancel]   = useState(false)
  const followupCount = (() => {
    try {
      return JSON.parse(
        localStorage.getItem(`po_followup_${po?.id}`)||'[]').length
    } catch { return 0 }
  })()

  useEffect(()=>{
    if (!id) { nav('/mm/po'); return }
    fetch(`${BASE_URL}/mm/po/${id}`,
      { headers:authHdrs2() })
      .then(r=>r.json())
      .then(d=>{
        if (d.data) setPO(d.data)
        else toast.error('PO not found')
      })
      .catch(e=>toast.error(e.message))
      .finally(()=>setLoading(false))
  },[id])

  if (loading) return (
    <div style={{ padding:60, textAlign:'center',
      color:'#6C757D' }}>
      ⏳ Loading PO...
    </div>
  )

  if (!po) return (
    <div style={{ padding:60, textAlign:'center',
      color:'#6C757D' }}>
      PO not found.
      <button className="btn btn-p sd-bsm"
        style={{ marginLeft:12 }}
        onClick={()=>nav('/mm/po')}>
        Back to List
      </button>
    </div>
  )

  const sc = STATUS[po.status]||STATUS.DRAFT

  const subTotal  = parseFloat(po.subTotal||0)
  const totalGST  = parseFloat(po.totalGST||0)
  const grandTotal= parseFloat(po.totalAmount||0)

  return (
    <div>
      {/* Header */}
      <div className="lv-hdr">
        <div>
          <div className="lv-ttl">
            {po.poNo}
            <span style={{ marginLeft:10, padding:'3px 10px',
              borderRadius:10, fontSize:12, fontWeight:700,
              background:sc.bg, color:sc.color }}>
              {sc.label}
            </span>
          </div>
          <div style={{ fontSize:11, color:'#6C757D',
            marginTop:2 }}>
            {po.vendorName} · {new Date(po.poDate)
              .toLocaleDateString('en-IN')} ·
            {po.purchaseCategory}
          </div>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm"
            onClick={()=>nav('/mm/po')}>
            ← Back
          </button>
          {po.status==='DRAFT' && (
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav(`/mm/po/edit/${po.id}`)}>
              ✏️ Edit
            </button>
          )}
          <button className="btn btn-s sd-bsm"
            onClick={()=>setShowFollowup(true)}>
            📞 Follow-up
            {followupCount>0 && (
              <span style={{ marginLeft:4, background:'#DC3545',
                color:'#fff', borderRadius:'50%',
                width:16, height:16, fontSize:10,
                display:'inline-flex', alignItems:'center',
                justifyContent:'center' }}>
                {followupCount}
              </span>
            )}
          </button>
          <button className="btn btn-s sd-bsm"
            onClick={()=>window.print()}>
            🖨️ Print PO
          </button>
          {!['CANCELLED','CLOSED','GRN_DONE'].includes(po.status) && (
            <button className="btn btn-s sd-bsm"
              style={{ color:'#DC3545',
                borderColor:'#DC3545' }}
              onClick={()=>setShowCancel(true)}>
              ❌ Cancel
            </button>
          )}
          {['APPROVED','PARTIAL_GRN'].includes(po.status) && (
            <button className="btn btn-p sd-bsm"
              onClick={()=>nav(`/mm/grn/new?po=${po.id}`)}>
              📦 Record GRN
            </button>
          )}
        </div>
      </div>

      {/* PO Details */}
      <div style={{ display:'grid',
        gridTemplateColumns:'1fr 1fr 1fr',
        gap:14, marginBottom:14 }}>
        {/* Vendor */}
        <div style={{ background:'#fff', borderRadius:8,
          border:'1px solid #E0D5E0', padding:14 }}>
          <div style={{ fontSize:10, fontWeight:700,
            color:'#6C757D', textTransform:'uppercase',
            marginBottom:6 }}>Vendor</div>
          <div style={{ fontWeight:700, fontSize:14,
            color:'#1C1C1C' }}>{po.vendorName}</div>
          <div style={{ fontSize:11, color:'#6C757D',
            marginTop:2 }}>
            {po.vendorGstin||'No GSTIN'}
          </div>
        </div>

        {/* Delivery */}
        <div style={{ background:'#fff', borderRadius:8,
          border:'1px solid #E0D5E0', padding:14 }}>
          <div style={{ fontSize:10, fontWeight:700,
            color:'#6C757D', textTransform:'uppercase',
            marginBottom:6 }}>Delivery</div>
          <div style={{ fontWeight:600, fontSize:13 }}>
            {po.deliveryLocation||'—'}
          </div>
          <div style={{ fontSize:11, color:'#6C757D',
            marginTop:2 }}>
            Expected:{' '}
            {po.deliveryDate
              ? new Date(po.deliveryDate)
                  .toLocaleDateString('en-IN')
              : '—'}
          </div>
        </div>

        {/* Order Info */}
        <div style={{ background:'#fff', borderRadius:8,
          border:'1px solid #E0D5E0', padding:14 }}>
          <div style={{ fontSize:10, fontWeight:700,
            color:'#6C757D', textTransform:'uppercase',
            marginBottom:6 }}>Order Details</div>
          {[
            ['PO Date',      new Date(po.poDate)
              .toLocaleDateString('en-IN')],
            ['Payment',      po.paymentTerms||'—'],
            ['PR Ref',       po.prNo||'—'],
            ['CS Ref',       po.csNo||'—'],
            ['Valid To',     po.validTo
              ?new Date(po.validTo).toLocaleDateString('en-IN')
              :'—'],
          ].map(([l,v])=>(
            <div key={l} style={{ display:'flex',
              justifyContent:'space-between',
              fontSize:11, marginBottom:3 }}>
              <span style={{ color:'#6C757D' }}>{l}</span>
              <strong style={{ color:'#1C1C1C' }}>{v}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Line Items */}
      <div style={{ background:'#fff', borderRadius:8,
        border:'1px solid #E0D5E0',
        overflow:'hidden', marginBottom:14 }}>
        <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
          padding:'8px 16px' }}>
          <span style={{ color:'#fff', fontSize:13,
            fontWeight:700 }}>📦 Line Items</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',
            borderCollapse:'collapse', fontSize:12 }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['#','Item','HSN','Spec','Qty','Unit','Rate',
                  'Disc%','Taxable','GST%','CGST','SGST',
                  'IGST','Total','Received','Pending'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px',
                    fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'right',
                    textTransform:'uppercase',
                    letterSpacing:.3, whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(po.lines||[]).map((l,i)=>(
                <tr key={i} style={{
                  borderBottom:'1px solid #F0EEF0',
                  background:i%2===0?'#fff':'#FDFBFD' }}>
                  <td style={{ padding:'8px 10px',
                    textAlign:'center', color:'#6C757D',
                    fontWeight:700 }}>{i+1}</td>
                  <td style={{ padding:'8px 10px',
                    fontWeight:600,
                    textAlign:'left',
                    minWidth:140 }}>{l.itemName}</td>
                  <td style={{ padding:'8px 10px',
                    fontFamily:'DM Mono,monospace',
                    fontSize:11, color:'#6C757D' }}>
                    {l.hsnCode||'—'}
                  </td>
                  <td style={{ padding:'8px 10px',
                    fontSize:11, color:'#6C757D',
                    textAlign:'left' }}>
                    {l.specification||'—'}
                  </td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'right', fontWeight:700 }}>
                    {parseFloat(l.qty||0)}
                  </td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'center' }}>{l.unit}</td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'right',
                    fontFamily:'DM Mono,monospace' }}>
                    {fmtC(l.rate)}
                  </td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'right', color:'#6C757D' }}>
                    {parseFloat(l.discount||0)}%
                  </td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    background:'#F8F9FA' }}>
                    {fmtC(l.taxableAmt)}
                  </td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'center' }}>
                    {parseFloat(l.gstRate||0)}%
                  </td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    color:'#E06F39', fontSize:11 }}>
                    {fmtC(l.cgst)}
                  </td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    color:'#E06F39', fontSize:11 }}>
                    {fmtC(l.sgst)}
                  </td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    color:'#E06F39', fontSize:11 }}>
                    {fmtC(l.igst)}
                  </td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    fontWeight:800, color:'#714B67',
                    background:'#EDE0EA' }}>
                    {fmtC(l.totalAmt)}
                  </td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'right', color:'#155724',
                    fontWeight:700 }}>
                    {parseFloat(l.receivedQty||0)} {l.unit}
                  </td>
                  <td style={{ padding:'8px 10px',
                    textAlign:'right',
                    color: parseFloat(l.pendingQty||0)>0
                      ?'#856404':'#155724',
                    fontWeight:700 }}>
                    {parseFloat(l.pendingQty||0)} {l.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals + Approval */}
      <div style={{ display:'grid',
        gridTemplateColumns:'1fr 300px', gap:14,
        marginBottom:14 }}>
        {/* Approval trail */}
        <div style={{ background:'#fff', borderRadius:8,
          border:'1px solid #E0D5E0', padding:14 }}>
          <div style={{ fontWeight:700, fontSize:12,
            color:'#714B67', marginBottom:10 }}>
            Approval Trail
          </div>
          {po.approvedBy ? (
            <div style={{ display:'flex', gap:10,
              alignItems:'center' }}>
              <div style={{ width:36, height:36,
                background:'#D4EDDA', borderRadius:'50%',
                display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:18 }}>
                ✅
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>
                  {po.approvedBy}
                </div>
                <div style={{ fontSize:11, color:'#6C757D' }}>
                  Approved on{' '}
                  {po.approvedAt
                    ? new Date(po.approvedAt)
                        .toLocaleDateString('en-IN')
                    : '—'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize:12, color:'#856404',
              background:'#FFF3CD', padding:'8px 12px',
              borderRadius:6 }}>
              ⏳ Pending approval
            </div>
          )}
          {po.remarks && (
            <div style={{ marginTop:10, fontSize:12,
              color:'#6C757D', borderTop:'1px solid #F0EEF0',
              paddingTop:10 }}>
              📝 {po.remarks}
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div style={{ background:'#fff', borderRadius:8,
          border:'1px solid #E0D5E0', padding:14 }}>
          {[
            ['Sub Total',   fmtC(subTotal),   '#1C1C1C'],
            ['Total GST',   fmtC(totalGST),   '#E06F39'],
            ['Grand Total', fmtC(grandTotal),  '#155724'],
          ].map(([l,v,c],i)=>(
            <div key={l} style={{ display:'flex',
              justifyContent:'space-between',
              padding:'7px 0',
              borderBottom:i<2?'1px solid #F0EEF0':'none',
              borderTop:i===2?'2px solid #714B67':'none',
              marginTop:i===2?4:0 }}>
              <span style={{ fontSize:i===2?14:12,
                fontWeight:i===2?800:600,
                color:i===2?'#714B67':'#6C757D',
                fontFamily:i===2?'Syne,sans-serif':'inherit' }}>
                {l}
              </span>
              <span style={{ fontFamily:'DM Mono,monospace',
                fontSize:i===2?16:13,
                fontWeight:i===2?800:600, color:c }}>
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showFollowup && (
        <FollowUpModal po={po}
          onClose={()=>setShowFollowup(false)} />
      )}
      {showCancel && (
        <CancelModal po={po}
          onSave={()=>{ setShowCancel(false); nav('/mm/po') }}
          onCancel={()=>setShowCancel(false)} />
      )}
    </div>
  )
}
