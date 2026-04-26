import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
  borderRadius:5, fontSize:12, outline:'none', width:'100%',
  boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }

const STATUS = {
  OPEN:      { bg:'#D1ECF1', color:'#0C5460', label:'Open'      },
  PARTIAL:   { bg:'#FFF3CD', color:'#856404', label:'Partial'   },
  RECEIVED:  { bg:'#D4EDDA', color:'#155724', label:'Received'  },
  CONVERTED: { bg:'#EDE0EA', color:'#714B67', label:'Converted' },
  CLOSED:    { bg:'#E9ECEF', color:'#6C757D', label:'Closed'    },
}

// ── RFQ Detail Modal — add this to RFQList.jsx ───────────
// Shows: RFQ info + all supplier quotes side by side

function RFQDetailModal({ rfq, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch(`${BASE_URL}/mm/rfq/${rfq.id}`,
      { headers:{ Authorization:`Bearer ${getToken()}` }})
      .then(r=>r.json())
      .then(d=>{ setDetail(d.data); setLoading(false) })
      .catch(()=>setLoading(false))
  },[])

  const fmtC = n => !n||isNaN(n)||parseFloat(n)===0
    ? '—'
    : '₹'+Number(n).toLocaleString('en-IN',
        {minimumFractionDigits:2,maximumFractionDigits:2})

  const parseLines = (linesStr) => {
    try { return JSON.parse(linesStr||'[]') } catch { return [] }
  }

  const calc = (l) => {
    const q=parseFloat(l.qty||0), r=parseFloat(l.rate||0)
    const d=parseFloat(l.disc||l.discPct||0)
    const g=parseFloat(l.gst||l.gstRate||18)
    const pk=parseFloat(l.packing||0), fr=parseFloat(l.freight||0)
    const basic=q*r*(1-d/100)
    const gstAmt=basic*g/100
    const total=basic+gstAmt+pk+fr
    return { basic, gstAmt, total, perUnit:q>0?total/q:0 }
  }

  const vendorColors = ['#714B67','#0C5460','#856404','#155724']
  const vendorBgs    = ['#EDE0EA','#D1ECF1','#FFF3CD','#D4EDDA']

  if (loading) return (
    <div style={{ position:'fixed', inset:0,
      background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10,
        padding:40, textAlign:'center', color:'#6C757D' }}>
        ⏳ Loading RFQ details...
      </div>
    </div>
  )

  const quotes  = detail?.quotes||[]
  const rfqLines= detail?.lines||[]
  const vendorList = (() => {
    try { return JSON.parse(detail?.vendors||'[]') } catch { return [] }
  })()

  return (
    <div style={{ position:'fixed', inset:0,
      background:'rgba(0,0,0,.55)',
      display:'flex', alignItems:'center',
      justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10,
        width:'96%', maxWidth:1100, maxHeight:'92vh',
        display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#0C5460,#155724)',
          padding:'14px 20px', flexShrink:0,
          display:'flex', justifyContent:'space-between',
          alignItems:'center', borderRadius:'10px 10px 0 0' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0, fontSize:16,
              fontFamily:'Syne,sans-serif', fontWeight:800 }}>
              📋 RFQ Detail Report — {detail?.rfqNo}
            </h3>
            <p style={{ color:'rgba(255,255,255,.7)',
              margin:'3px 0 0', fontSize:12 }}>
              PR: {detail?.prNo||'—'} &nbsp;|&nbsp;
              Subject: {detail?.subject||'—'} &nbsp;|&nbsp;
              Deadline: {detail?.deadline
                ? new Date(detail.deadline).toLocaleDateString('en-IN')
                : '—'}
            </p>
          </div>
          <span onClick={onClose}
            style={{ color:'#fff', cursor:'pointer',
              fontSize:22, lineHeight:1 }}>✕</span>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:16 }}>

          {/* Summary bar */}
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(4,1fr)',
            gap:10, marginBottom:16 }}>
            {[
              { l:'Items',          v:rfqLines.length,    c:'#714B67' },
              { l:'Vendors Sent',   v:vendorList.length,  c:'#0C5460' },
              { l:'Quotes Received',v:quotes.length,      c:'#155724' },
              { l:'Pending Quotes',
                v:Math.max(0,vendorList.length-quotes.length),
                c:'#856404' },
            ].map(k=>(
              <div key={k.l} style={{ background:'#F8F7FA',
                borderRadius:8, padding:'10px 14px',
                border:`2px solid ${k.c}22` }}>
                <div style={{ fontSize:10, color:k.c,
                  fontWeight:700, textTransform:'uppercase' }}>
                  {k.l}
                </div>
                <div style={{ fontSize:22, fontWeight:800,
                  color:k.c, fontFamily:'Syne,sans-serif' }}>
                  {k.v}
                </div>
              </div>
            ))}
          </div>

          {/* Vendors sent to */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700,
              color:'#495057', textTransform:'uppercase',
              marginBottom:6, letterSpacing:.3 }}>
              Enquiry Sent To:
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {vendorList.map((v,i)=>{
                const hasQuote = quotes.some(q=>
                  q.vendorName?.toLowerCase()===v?.toLowerCase())
                return (
                  <span key={i} style={{ padding:'4px 12px',
                    borderRadius:12, fontSize:12, fontWeight:600,
                    background: hasQuote?'#D4EDDA':'#FFF3CD',
                    color: hasQuote?'#155724':'#856404',
                    border: `1px solid ${hasQuote?'#C3E6CB':'#FFE69C'}` }}>
                    {hasQuote?'✅':'⏳'} {v}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Quote comparison table */}
          {quotes.length===0 ? (
            <div style={{ padding:30, textAlign:'center',
              color:'#6C757D', background:'#F8F7FA',
              borderRadius:8, border:'2px dashed #E0D5E0' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📭</div>
              <div style={{ fontWeight:700 }}>No quotes received yet</div>
              <div style={{ fontSize:12, marginTop:4 }}>
                Use "Add Quote" to record supplier quotations
              </div>
            </div>
          ) : (
            <>
              {/* Side by side quote comparison */}
              <div style={{ fontSize:12, fontWeight:700,
                color:'#714B67', marginBottom:8,
                fontFamily:'Syne,sans-serif' }}>
                📊 Supplier Quote Comparison
              </div>
              <div style={{ overflowX:'auto', border:'1px solid #E0D5E0',
                borderRadius:8, marginBottom:14 }}>
                <table style={{ width:'100%',
                  borderCollapse:'collapse', fontSize:11,
                  minWidth: 500 + quotes.length*200 }}>
                  <thead>
                    <tr>
                      <th style={{ padding:'8px 12px',
                        background:'#F8F4F8',
                        border:'1px solid #E0D5E0',
                        fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'left',
                        minWidth:160 }}>
                        Item / Details
                      </th>
                      <th style={{ padding:'8px 12px',
                        background:'#F8F4F8',
                        border:'1px solid #E0D5E0',
                        fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'center',
                        width:70 }}>Qty</th>
                      <th style={{ padding:'8px 12px',
                        background:'#F8F4F8',
                        border:'1px solid #E0D5E0',
                        fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'center',
                        width:60 }}>Unit</th>
                      {quotes.map((q,qi)=>(
                        <th key={qi} style={{ padding:'8px 10px',
                          border:'1px solid #E0D5E0',
                          fontSize:11, fontWeight:800,
                          textAlign:'center', minWidth:200,
                          background: vendorBgs[qi%4],
                          color: vendorColors[qi%4] }}>
                          <div style={{ fontSize:12 }}>
                            {q.vendorName}
                          </div>
                          <div style={{ fontSize:9,
                            fontWeight:500, marginTop:2,
                            color:'#6C757D' }}>
                            Ref: {q.quoteRef||'—'} &nbsp;|&nbsp;
                            Valid: {q.validityDays}d
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rfqLines.map((item,itemIdx)=>{
                      // Find lowest rate for this item across all quotes
                      const itemRates = quotes.map(q=>{
                        const qLines = parseLines(q.lines)
                        const ql = qLines[itemIdx]
                        return ql ? parseLines(q.lines)[itemIdx] : null
                      })
                      const validRates = itemRates
                        .map(ql=>ql?parseFloat(ql.rate||0):0)
                        .filter(r=>r>0)
                      const minRate = validRates.length
                        ? Math.min(...validRates) : 0

                      return (
                        <React.Fragment key={itemIdx}>
                          {/* Item header row */}
                          <tr>
                            <td style={{ padding:'8px 12px',
                              background:'#F8F4F8',
                              border:'1px solid #E0D5E0',
                              fontWeight:700, color:'#1C1C1C' }}>
                              {itemIdx+1}. {item.itemName}
                              {item.specification && (
                                <div style={{ fontSize:10,
                                  color:'#6C757D', fontWeight:400 }}>
                                  {item.specification}
                                </div>
                              )}
                            </td>
                            <td style={{ padding:'8px 12px',
                              border:'1px solid #E0D5E0',
                              textAlign:'center', fontWeight:700,
                              color:'#714B67' }}>
                              {parseFloat(item.qty||0)}
                            </td>
                            <td style={{ padding:'8px 12px',
                              border:'1px solid #E0D5E0',
                              textAlign:'center',
                              color:'#6C757D' }}>
                              {item.unit}
                            </td>
                            {quotes.map((q,qi)=>{
                              const qLines = parseLines(q.lines)
                              const ql     = qLines[itemIdx]
                              if (!ql||!parseFloat(ql.rate||0)) {
                                return (
                                  <td key={qi}
                                    style={{ padding:'8px',
                                      border:'1px solid #E0D5E0',
                                      textAlign:'center',
                                      color:'#ccc',
                                      background:'#FAFAFA' }}>
                                    Not quoted
                                  </td>
                                )
                              }
                              const c      = calc(ql)
                              const isL1   = parseFloat(ql.rate||0)===minRate
                              return (
                                <td key={qi}
                                  style={{ padding:'6px 8px',
                                    border:'1px solid #E0D5E0',
                                    background: isL1
                                      ?'#D4EDDA':'#fff',
                                    verticalAlign:'top' }}>
                                  {/* Rate section */}
                                  <div style={{ marginBottom:4 }}>
                                    <div style={{ display:'flex',
                                      justifyContent:'space-between',
                                      alignItems:'center' }}>
                                      <span style={{ fontSize:9,
                                        color:'#6C757D',
                                        textTransform:'uppercase' }}>
                                        Rate/Unit
                                      </span>
                                      {isL1 && (
                                        <span style={{ fontSize:9,
                                          background:'#155724',
                                          color:'#fff', padding:'1px 5px',
                                          borderRadius:4,
                                          fontWeight:700 }}>L1</span>
                                      )}
                                    </div>
                                    <div style={{
                                      fontFamily:'DM Mono,monospace',
                                      fontSize:14, fontWeight:800,
                                      color: isL1?'#155724':'#714B67' }}>
                                      {fmtC(ql.rate)}
                                    </div>
                                  </div>
                                  {/* Details grid */}
                                  <div style={{ display:'grid',
                                    gridTemplateColumns:'1fr 1fr',
                                    gap:'2px 8px', fontSize:10,
                                    color:'#495057' }}>
                                    {[
                                      ['Disc', (ql.disc||ql.discPct||0)+'%'],
                                      ['GST',  (ql.gst||ql.gstRate||18)+'%'],
                                      ['Packing', fmtC(ql.packing||0)],
                                      ['Freight', fmtC(ql.freight||0)],
                                    ].map(([l,v])=>(
                                      <div key={l}>
                                        <span style={{ color:'#999' }}>
                                          {l}:
                                        </span>{' '}
                                        <strong>{v}</strong>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Totals */}
                                  <div style={{ marginTop:4,
                                    paddingTop:4,
                                    borderTop:'1px solid #E0D5E0' }}>
                                    <div style={{ display:'flex',
                                      justifyContent:'space-between',
                                      fontSize:10 }}>
                                      <span style={{ color:'#6C757D' }}>
                                        Basic
                                      </span>
                                      <span style={{
                                        fontFamily:'DM Mono,monospace' }}>
                                        {fmtC(c.basic)}
                                      </span>
                                    </div>
                                    <div style={{ display:'flex',
                                      justifyContent:'space-between',
                                      fontSize:10 }}>
                                      <span style={{ color:'#E06F39' }}>
                                        GST
                                      </span>
                                      <span style={{
                                        fontFamily:'DM Mono,monospace',
                                        color:'#E06F39' }}>
                                        {fmtC(c.gstAmt)}
                                      </span>
                                    </div>
                                    <div style={{ display:'flex',
                                      justifyContent:'space-between',
                                      fontSize:11, fontWeight:800,
                                      marginTop:2 }}>
                                      <span>Total</span>
                                      <span style={{
                                        fontFamily:'DM Mono,monospace',
                                        color: isL1?'#155724':'#714B67' }}>
                                        {fmtC(c.total)}
                                      </span>
                                    </div>
                                    <div style={{ display:'flex',
                                      justifyContent:'space-between',
                                      fontSize:10,
                                      borderTop:'1px dashed #E0D5E0',
                                      marginTop:3, paddingTop:3 }}>
                                      <span style={{ color:'#6C757D' }}>
                                        Cost/Unit
                                      </span>
                                      <span style={{
                                        fontFamily:'DM Mono,monospace',
                                        fontWeight:700,
                                        color: isL1?'#155724':'#495057' }}>
                                        {fmtC(c.perUnit)}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        </React.Fragment>
                      )
                    })}

                    {/* Grand total row */}
                    <tr style={{ background:'#F8F4F8',
                      borderTop:'2px solid #714B67' }}>
                      <td colSpan={3} style={{ padding:'10px 12px',
                        fontWeight:800, fontSize:13,
                        border:'1px solid #E0D5E0',
                        fontFamily:'Syne,sans-serif',
                        color:'#714B67' }}>
                        Grand Total (All Items)
                      </td>
                      {quotes.map((q,qi)=>{
                        const qLines = parseLines(q.lines)
                        const grandTotal = qLines.reduce((s,ql)=>
                          s+calc(ql).total, 0)
                        const allTotals = quotes.map(q2=>{
                          const ql2=parseLines(q2.lines)
                          return ql2.reduce((s,l)=>s+calc(l).total,0)
                        }).filter(v=>v>0)
                        const isLowest = grandTotal>0 &&
                          grandTotal===Math.min(...allTotals)
                        return (
                          <td key={qi}
                            style={{ padding:'10px 8px',
                              border:'1px solid #E0D5E0',
                              textAlign:'center',
                              background: isLowest
                                ?'#D4EDDA':'#EDE0EA',
                              fontFamily:'DM Mono,monospace',
                              fontSize:14, fontWeight:800,
                              color: isLowest?'#155724':'#714B67' }}>
                            {grandTotal>0?fmtC(grandTotal):'—'}
                            {isLowest && (
                              <div style={{ fontSize:10,
                                fontWeight:700, marginTop:2 }}>
                                ✅ LOWEST
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>

                    {/* Terms row */}
                    <tr style={{ background:'#F8F7FA' }}>
                      <td colSpan={3} style={{ padding:'8px 12px',
                        fontWeight:700, fontSize:11,
                        border:'1px solid #E0D5E0',
                        color:'#6C757D' }}>
                        Remarks / Terms
                      </td>
                      {quotes.map((q,qi)=>(
                        <td key={qi} style={{ padding:'8px',
                          border:'1px solid #E0D5E0',
                          fontSize:10, color:'#495057' }}>
                          {q.remarks||'—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px',
          borderTop:'1px solid #E0D5E0', flexShrink:0,
          display:'flex', justifyContent:'space-between',
          alignItems:'center', background:'#F8F7FA',
          borderRadius:'0 0 10px 10px' }}>
          <div style={{ fontSize:11, color:'#6C757D' }}>
            🟢 Green = L1 (Lowest) &nbsp;|&nbsp;
            ✅ Checked vendors = Quote received
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>window.print()}
              style={{ padding:'8px 16px', background:'#fff',
                color:'#714B67',
                border:'1.5px solid #714B67',
                borderRadius:6, fontSize:12,
                cursor:'pointer', fontWeight:600 }}>
              🖨️ Print
            </button>
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
    </div>
  )
}


// ── New RFQ Modal ─────────────────────────────────────────
function RFQModal({ prs, items, onSave, onCancel }) {
  const [hdr, setHdr] = useState({
    prNo:'', subject:'',
    deadline: new Date(Date.now()+7*86400000).toISOString().split('T')[0],
    vendorInput:''
  })
  const [vendors, setVendors] = useState([''])
  const [vendorList, setVendorList] = useState([])
  const [lines,   setLines]   = useState([{
    itemCode:'', itemName:'', specification:'',
    qty:1, unit:'Nos', remarks:''
  }])
  const [saving, setSaving] = useState(false)

  // Load vendor list on mount
  useEffect(()=>{
    fetch(`${BASE_URL}/mm/vendors`,
      {headers:{Authorization:`Bearer ${getToken()}`}})
      .then(r=>r.json())
      .then(d=>setVendorList(d.data||[]))
      .catch(()=>{})
  },[])

  // Load PR items when PR selected
  const onPRChange = async (prId) => {
    if (!prId) return
    try {
      const res  = await fetch(`${BASE_URL}/mm/pr/${prId}/items`,
        { headers:authHdrs2() })
      const data = await res.json()
      if (data.data?.lines?.length) {
        setLines(data.data.lines.map(l=>({
          itemCode: l.itemCode||'',
          itemName: l.itemName,
          specification: l.specification||'',
          qty: parseFloat(l.qty)||1,
          unit: l.unit||'Nos',
          remarks:''
        })))
        setHdr(p=>({...p, prNo:data.data.prNo}))
        toast.success('PR items loaded!')
      }
    } catch(e){ toast.error(e.message) }
  }

  const save = async () => {
    if (!lines[0].itemName) return toast.error('Add at least one item!')
    const validVendors = vendors.filter(v=>v.trim())
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/mm/rfq`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({
            prNo:hdr.prNo, subject:hdr.subject,
            deadline:hdr.deadline,
            vendors:validVendors, lines
          })})
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10,
        width:'90%', maxWidth:800, maxHeight:'92vh',
        overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#0C5460', padding:'14px 20px',
          display:'flex', justifyContent:'space-between',
          alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0,
            fontFamily:'Syne,sans-serif', fontSize:15,
            fontWeight:700 }}>📨 New Enquiry / RFQ</h3>
          <span onClick={onCancel}
            style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:20,
          display:'flex', flexDirection:'column', gap:14 }}>

          {/* Header */}
          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700,
                color:'#495057', display:'block',
                marginBottom:3, textTransform:'uppercase' }}>
                Load from PR
              </label>
              <select style={{ ...inp, cursor:'pointer' }}
                onChange={e=>onPRChange(e.target.value)}>
                <option value="">-- Select PR (optional) --</option>
                {prs.filter(p=>p.status==='HOD_APPROVED').map(p=>(
                  <option key={p.id} value={p.id}>
                    {p.prNo} — {p.department}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700,
                color:'#495057', display:'block',
                marginBottom:3, textTransform:'uppercase' }}>
                Subject / Description
              </label>
              <input style={inp} value={hdr.subject}
                onChange={e=>setHdr(p=>({...p,subject:e.target.value}))}
                placeholder="e.g. Enquiry for Cotton Sliver" />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700,
                color:'#495057', display:'block',
                marginBottom:3, textTransform:'uppercase' }}>
                Quote Deadline
              </label>
              <input type="date" style={inp} value={hdr.deadline}
                onChange={e=>setHdr(p=>({...p,deadline:e.target.value}))} />
            </div>
          </div>

          {/* Vendors to send */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:6 }}>
              <label style={{ fontSize:11, fontWeight:700,
                color:'#495057', textTransform:'uppercase' }}>
                Send Enquiry To (Vendors)
              </label>
              <button onClick={()=>setVendors(p=>[...p,''])}
                style={{ padding:'3px 10px', background:'#714B67',
                  color:'#fff', border:'none', borderRadius:4,
                  fontSize:11, cursor:'pointer' }}>
                + Add Vendor
              </button>
            </div>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {vendors.map((v,i)=>(
                <div key={i} style={{ display:'flex', gap:4 }}>
                  <select style={{ ...inp, flex:1, cursor:'pointer' }}
                    value={v}
                    onChange={e=>{
                      const copy=[...vendors]
                      copy[i]=e.target.value
                      setVendors(copy)
                    }}>
                    <option value="">-- Select Vendor {i+1} --</option>
                    {vendorList.map(vd=>(
                      <option key={vd.vendorCode} value={vd.vendorName}>
                        {vd.vendorCode} — {vd.vendorName}
                      </option>
                    ))}
                  </select>
                  {vendors.length>1 && (
                    <button onClick={()=>setVendors(p=>p.filter((_,idx)=>idx!==i))}
                      style={{ padding:'4px 8px', background:'#DC3545',
                        color:'#fff', border:'none', borderRadius:4,
                        cursor:'pointer' }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:6 }}>
              <label style={{ fontSize:11, fontWeight:700,
                color:'#495057', textTransform:'uppercase' }}>
                Items / Materials Required
              </label>
              <button onClick={()=>setLines(p=>[...p,{
                itemCode:'', itemName:'', specification:'',
                qty:1, unit:'Nos', remarks:''
              }])} style={{ padding:'3px 10px', background:'#714B67',
                color:'#fff', border:'none', borderRadius:4,
                fontSize:11, cursor:'pointer' }}>
                + Add Row
              </button>
            </div>
            <div style={{ border:'1px solid #E0D5E0', borderRadius:6,
              overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse',
                fontSize:12 }}>
                <thead style={{ background:'#F8F4F8' }}>
                  <tr style={{ borderBottom:'1px solid #E0D5E0' }}>
                    {['#','Item Name','Specification',
                      'Qty','Unit','Remarks',''].map(h=>(
                      <th key={h} style={{ padding:'7px 10px',
                        fontSize:10, fontWeight:700, color:'#6C757D',
                        textAlign:'left', textTransform:'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l,i)=>(
                    <tr key={i} style={{
                      borderBottom:'1px solid #F0EEF0' }}>
                      <td style={{ padding:'4px 8px', color:'#6C757D',
                        textAlign:'center', width:30 }}>{i+1}</td>
                      <td style={{ padding:'4px 6px', minWidth:160 }}>
                        <select style={{ ...inp, fontSize:11,
                          marginBottom:2, cursor:'pointer' }}
                          value={l.itemCode}
                          onChange={e=>{
                            const item = items.find(it=>it.itemCode===e.target.value)
                            const copy = [...lines]
                            copy[i] = { ...copy[i], itemCode:e.target.value,
                              itemName:item?.itemName||copy[i].itemName }
                            setLines(copy)
                          }}>
                          <option value="">-- Select Item --</option>
                          {items.map(it=>(
                            <option key={it.itemCode} value={it.itemCode}>
                              {it.itemName}
                            </option>
                          ))}
                        </select>
                        {!l.itemCode && (
                          <input style={{ ...inp, fontSize:11 }}
                            placeholder="Or type item name"
                            value={l.itemName}
                            onChange={e=>{
                              const copy=[...lines]
                              copy[i]={...copy[i],itemName:e.target.value}
                              setLines(copy)
                            }} />
                        )}
                      </td>
                      <td style={{ padding:'4px 6px', minWidth:110 }}>
                        <input style={{ ...inp, fontSize:11 }}
                          placeholder="Brand/grade/spec"
                          value={l.specification}
                          onChange={e=>{
                            const copy=[...lines]
                            copy[i]={...copy[i],specification:e.target.value}
                            setLines(copy)
                          }} />
                      </td>
                      <td style={{ padding:'4px 6px', width:70 }}>
                        <input type="number" style={{ ...inp, fontSize:11 }}
                          value={l.qty} min={0}
                          onChange={e=>{
                            const copy=[...lines]
                            copy[i]={...copy[i],qty:e.target.value}
                            setLines(copy)
                          }} />
                      </td>
                      <td style={{ padding:'4px 6px', width:80 }}>
                        <select style={{ ...inp, fontSize:11, cursor:'pointer' }}
                          value={l.unit}
                          onChange={e=>{
                            const copy=[...lines]
                            copy[i]={...copy[i],unit:e.target.value}
                            setLines(copy)
                          }}>
                          {['Nos','Kg','Ltr','Mtr','Box','Set',
                            'Pcs','MT','Roll','Pack'].map(u=>(
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding:'4px 6px', minWidth:100 }}>
                        <input style={{ ...inp, fontSize:11 }}
                          placeholder="Remarks"
                          value={l.remarks}
                          onChange={e=>{
                            const copy=[...lines]
                            copy[i]={...copy[i],remarks:e.target.value}
                            setLines(copy)
                          }} />
                      </td>
                      <td style={{ padding:'4px 6px', width:36 }}>
                        {lines.length>1 && (
                          <button onClick={()=>setLines(p=>p.filter((_,idx)=>idx!==i))}
                            style={{ background:'#DC3545', color:'#fff',
                              border:'none', borderRadius:4,
                              padding:'3px 7px', cursor:'pointer',
                              fontSize:11 }}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ padding:'12px 20px',
          borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end',
          gap:10, background:'#F8F7FA' }}>
          <button onClick={onCancel}
            style={{ padding:'8px 20px', background:'#fff',
              color:'#6C757D', border:'1.5px solid #E0D5E0',
              borderRadius:6, fontSize:13, cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding:'8px 24px',
              background:saving?'#999':'#0C5460',
              color:'#fff', border:'none', borderRadius:6,
              fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {saving?'⏳ Saving...':'📨 Send Enquiry'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Record Quotation Modal ────────────────────────────────
function QuoteModal({ rfq, vendors, onSave, onCancel }) {
  const [form, setForm] = useState({
    vendorCode:'', vendorName:'', quoteRef:'',
    quoteDate: new Date().toISOString().split('T')[0],
    validityDays:30, remarks:''
  })

  const initLines = () => {
    const src = rfq.lines||[]
    if (src.length > 0) {
      return src.map(l=>({
        itemName:l.itemName||'', spec:l.specification||'',
        qty:parseFloat(l.qty||1), unit:l.unit||'Nos',
        rate:'', disc:'', packing:'', freight:'', gst:18
      }))
    }
    return [{itemName:'',spec:'',qty:1,unit:'Nos',rate:'',disc:'',packing:'',freight:'',gst:18}]
  }

  const [rows, setRows]   = useState(initLines)
  const [saving,setSaving]= useState(false)

  const upd = (i,f,v) => setRows(p=>p.map((r,idx)=>idx===i?{...r,[f]:v}:r))

  const calc = r => {
    const q=parseFloat(r.qty||0), rt=parseFloat(r.rate||0)
    const d=parseFloat(r.disc||0), g=parseFloat(r.gst||18)
    const pk=parseFloat(r.packing||0), fr=parseFloat(r.freight||0)
    const basic = q*rt*(1-d/100)
    const gstAmt= basic*g/100
    const total = basic+gstAmt+pk+fr
    return { basic, gstAmt, total, perUnit:q>0?total/q:0 }
  }

  const fmtC = n => !n||isNaN(n)?'—':'₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})

  const save = async () => {
    if (!form.vendorName) return toast.error('Select vendor!')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/mm/rfq/${rfq.id}/quote`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({ ...form, lines:rows }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const inp2 = { width:'100%', padding:'4px 5px', border:'1px solid #C3E6CB',
    borderRadius:4, fontSize:11, textAlign:'right',
    fontFamily:'DM Mono,monospace', background:'#FFFDE7', outline:'none' }

  const grandTotal = rows.reduce((s,r)=>s+calc(r).total, 0)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:'95%',
        maxWidth:960, maxHeight:'90vh', display:'flex',
        flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background:'#155724', padding:'12px 20px', flexShrink:0,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          borderRadius:'10px 10px 0 0' }}>
          <h3 style={{ color:'#fff', margin:0, fontSize:15,
            fontFamily:'Syne,sans-serif', fontWeight:700 }}>
            📥 Record Quotation — {rfq.rfqNo}
          </h3>
          <span onClick={onCancel}
            style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>

        {/* Body - scrollable */}
        <div style={{ overflowY:'auto', flex:1, padding:16 }}>

          {/* Vendor + meta fields */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr',
            gap:12, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                display:'block', marginBottom:3, textTransform:'uppercase' }}>
                Vendor / Supplier *
              </label>
              <select style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
                borderRadius:5, fontSize:12, outline:'none', width:'100%',
                cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}
                value={form.vendorCode}
                onChange={e=>{
                  const v=vendors.find(vd=>vd.vendorCode===e.target.value)
                  setForm(p=>({...p,vendorCode:e.target.value,vendorName:v?.vendorName||''}))
                }}>
                <option value="">-- Select Vendor --</option>
                {vendors.map(v=>(
                  <option key={v.vendorCode} value={v.vendorCode}>
                    {v.vendorCode} — {v.vendorName}
                  </option>
                ))}
              </select>
            </div>
            {[['Quote Ref','quoteRef','text','Ref No.'],
              ['Quote Date','quoteDate','date',''],
              ['Validity Days','validityDays','number','30']].map(([l,f,t,ph])=>(
              <div key={f}>
                <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                  display:'block', marginBottom:3, textTransform:'uppercase' }}>{l}</label>
                <input type={t} style={{ padding:'7px 10px',
                  border:'1.5px solid #E0D5E0', borderRadius:5,
                  fontSize:12, outline:'none', width:'100%',
                  boxSizing:'border-box' }}
                  value={form[f]} placeholder={ph}
                  onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} />
              </div>
            ))}
          </div>

          {/* Items table */}
          <div style={{ border:'2px solid #155724', borderRadius:6,
            marginBottom:14 }}>
            <div style={{ background:'#155724', padding:'7px 12px',
              display:'flex', justifyContent:'space-between',
              alignItems:'center' }}>
              <span style={{ color:'#fff', fontSize:12,
                fontWeight:700 }}>📋 Item-wise Rates</span>
              <button onClick={()=>setRows(p=>[...p,{
                itemName:'',spec:'',qty:1,unit:'Nos',
                rate:'',disc:'',packing:'',freight:'',gst:18
              }])} style={{ padding:'2px 10px', background:'rgba(255,255,255,.2)',
                color:'#fff', border:'1px solid rgba(255,255,255,.5)',
                borderRadius:4, fontSize:11, cursor:'pointer' }}>
                + Row
              </button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse',
                fontSize:11, minWidth:800 }}>
                <thead>
                  <tr style={{ background:'#D4EDDA' }}>
                    {['#','Item','Spec','Qty','Unit',
                      'Rate','Disc%','Packing','Freight','GST%',
                      'Basic','GST Amt','Total','Cost/Unit'].map(h=>(
                      <th key={h} style={{ padding:'6px 8px', fontSize:10,
                        fontWeight:700, color:'#155724',
                        border:'1px solid #C3E6CB',
                        textAlign:'center', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r,i)=>{
                    const c = calc(r)
                    return (
                      <tr key={i} style={{
                        background:i%2===0?'#fff':'#F8FFF8' }}>
                        <td style={{ padding:'4px 6px', textAlign:'center',
                          border:'1px solid #E8F5E9',
                          color:'#6C757D', fontWeight:700 }}>{i+1}</td>
                        <td style={{ border:'1px solid #E8F5E9',
                          padding:'3px 4px', minWidth:140 }}>
                          <input style={{ ...inp2, textAlign:'left' }}
                            value={r.itemName}
                            placeholder="Item name"
                            onChange={e=>upd(i,'itemName',e.target.value)} />
                        </td>
                        <td style={{ border:'1px solid #E8F5E9',
                          padding:'3px 4px', minWidth:80 }}>
                          <input style={{ ...inp2, textAlign:'left' }}
                            value={r.spec}
                            onChange={e=>upd(i,'spec',e.target.value)} />
                        </td>
                        <td style={{ border:'1px solid #E8F5E9',
                          padding:'3px 4px', width:55 }}>
                          <input type="number" style={inp2}
                            value={r.qty} min={0}
                            onChange={e=>upd(i,'qty',e.target.value)} />
                        </td>
                        <td style={{ border:'1px solid #E8F5E9',
                          padding:'3px 4px', width:60 }}>
                          <select style={{ ...inp2, textAlign:'left' }}
                            value={r.unit}
                            onChange={e=>upd(i,'unit',e.target.value)}>
                            {['Nos','Kg','Ltr','Mtr','Box','Set','Pcs'].map(u=>(
                              <option key={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        {[['rate',70],['disc',45],['packing',60],['freight',60]].map(([f,w])=>(
                          <td key={f} style={{ border:'1px solid #E8F5E9',
                            padding:'3px 4px', width:w }}>
                            <input type="number" style={inp2}
                              value={r[f]} min={0}
                              onChange={e=>upd(i,f,e.target.value)} />
                          </td>
                        ))}
                        <td style={{ border:'1px solid #E8F5E9',
                          padding:'3px 4px', width:55 }}>
                          <select style={{ ...inp2, textAlign:'left' }}
                            value={r.gst}
                            onChange={e=>upd(i,'gst',e.target.value)}>
                            {[0,5,12,18,28].map(g=>(
                              <option key={g} value={g}>{g}%</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding:'4px 6px',
                          border:'1px solid #E8F5E9',
                          textAlign:'right', fontFamily:'DM Mono,monospace',
                          background:'#F8F9FA' }}>
                          {parseFloat(r.rate||0)>0?fmtC(c.basic):'—'}
                        </td>
                        <td style={{ padding:'4px 6px',
                          border:'1px solid #E8F5E9',
                          textAlign:'right', fontFamily:'DM Mono,monospace',
                          color:'#E06F39', background:'#FFF8F0' }}>
                          {parseFloat(r.rate||0)>0?fmtC(c.gstAmt):'—'}
                        </td>
                        <td style={{ padding:'4px 6px',
                          border:'1px solid #E8F5E9',
                          textAlign:'right', fontFamily:'DM Mono,monospace',
                          fontWeight:700, color:'#714B67',
                          background:'#EDE0EA' }}>
                          {parseFloat(r.rate||0)>0?fmtC(c.total):'—'}
                        </td>
                        <td style={{ padding:'4px 6px',
                          border:'1px solid #E8F5E9',
                          textAlign:'right', fontFamily:'DM Mono,monospace',
                          fontWeight:700, color:'#155724',
                          background:'#D4EDDA' }}>
                          {parseFloat(r.rate||0)>0?fmtC(c.perUnit):'—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background:'#D4EDDA',
                    borderTop:'2px solid #155724' }}>
                    <td colSpan={11} style={{ padding:'7px 10px',
                      fontWeight:700, fontSize:12, color:'#155724',
                      border:'1px solid #C3E6CB' }}>
                      Grand Total
                    </td>
                    <td colSpan={3} style={{ padding:'7px 10px',
                      textAlign:'right', fontFamily:'DM Mono,monospace',
                      fontWeight:800, fontSize:14, color:'#155724',
                      border:'1px solid #C3E6CB' }}>
                      {fmtC(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label style={{ fontSize:10, fontWeight:700, color:'#495057',
              display:'block', marginBottom:3, textTransform:'uppercase' }}>
              Remarks / Terms
            </label>
            <textarea value={form.remarks} rows={2}
              style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
                borderRadius:5, fontSize:12, outline:'none', width:'100%',
                boxSizing:'border-box', resize:'vertical' }}
              onChange={e=>setForm(p=>({...p,remarks:e.target.value}))}
              placeholder="Delivery terms, payment terms, lead time..." />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          flexShrink:0, display:'flex', justifyContent:'space-between',
          alignItems:'center', background:'#F8F7FA',
          borderRadius:'0 0 10px 10px' }}>
          <div style={{ fontSize:11, color:'#6C757D' }}>
            💡 Record all vendor quotes → Create CS to compare
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onCancel}
              style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
                border:'1.5px solid #E0D5E0', borderRadius:6,
                fontSize:13, cursor:'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving}
              style={{ padding:'8px 24px',
                background:saving?'#999':'#155724', color:'#fff',
                border:'none', borderRadius:6, fontSize:13,
                fontWeight:700, cursor:'pointer' }}>
              {saving?'⏳ Saving...':'💾 Save Quotation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


// ── MAIN RFQ LIST ─────────────────────────────────────────
export default function RFQList() {
  const nav = useNavigate()
  const [rfqs,     setRFQs]    = useState([])
  const [prs,      setPRs]     = useState([])
  const [items,    setItems]   = useState([])
  const [vendors,  setVendors] = useState([])
  const [loading,  setLoading] = useState(true)
  const [showNew,  setShowNew] = useState(false)
  const [quoteRFQ, setQuoteRFQ]= useState(null)
  const [detailRFQ,setDetailRFQ]=useState(null)
  const [chip,     setChip]    = useState('all')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rfqRes, prRes, itemRes, venRes] = await Promise.all([
        fetch(`${BASE_URL}/mm/rfq`,     { headers:authHdrs2() }),
        fetch(`${BASE_URL}/mm/pr`,      { headers:authHdrs2() }),
        fetch(`${BASE_URL}/mm/items`,   { headers:authHdrs2() }),
        fetch(`${BASE_URL}/mm/vendors`, { headers:authHdrs2() }),
      ])
      const [rfqData, prData, itemData, venData] = await Promise.all([
        rfqRes.json(), prRes.json(), itemRes.json(), venRes.json()
      ])
      setRFQs(rfqData.data||[])
      setPRs(prData.data||[])
      setItems(itemData.data||[])
      setVendors(venData.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchAll() }, [])

  const filtered = chip==='all'
    ? rfqs : rfqs.filter(r=>r.status===chip)

  const kpi = {
    open:     rfqs.filter(r=>r.status==='OPEN').length,
    partial:  rfqs.filter(r=>r.status==='PARTIAL').length,
    received: rfqs.filter(r=>r.status==='RECEIVED').length,
    converted:rfqs.filter(r=>r.status==='CONVERTED').length,
  }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          RFQ / Enquiries <small>ME41 · Request for Quotation</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-p sd-bsm"
            onClick={()=>setShowNew(true)}>
            ＋ New Enquiry
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          { l:'Open',      v:kpi.open,      c:'#0C5460', bg:'#D1ECF1' },
          { l:'Partial',   v:kpi.partial,   c:'#856404', bg:'#FFF3CD' },
          { l:'Received',  v:kpi.received,  c:'#155724', bg:'#D4EDDA' },
          { l:'Converted', v:kpi.converted, c:'#714B67', bg:'#EDE0EA' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg, borderRadius:8,
            padding:'10px 14px', border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c, fontWeight:700,
              textTransform:'uppercase' }}>{k.l}</div>
            <div style={{ fontSize:24, fontWeight:800, color:k.c,
              fontFamily:'Syne,sans-serif' }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Chips */}
      <div className="mm-chips">
        {[['all','All'],['OPEN','Open'],['PARTIAL','Partial'],
          ['RECEIVED','Received'],['CONVERTED','Converted']].map(([k,l])=>(
          <div key={k} className={`mm-chip${chip===k?' on':''}`}
            onClick={()=>setChip(k)}>
            {l} <strong style={{ marginLeft:4 }}>
              {k==='all'?rfqs.length:rfqs.filter(r=>r.status===k).length}
            </strong>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          ⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8,
          border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📨</div>
          <div style={{ fontWeight:700 }}>No RFQs / Enquiries</div>
          <button className="btn btn-p sd-bsm"
            style={{ marginTop:12 }}
            onClick={()=>setShowNew(true)}>
            + New Enquiry
          </button>
        </div>
      ) : (
        <table className="mm-tbl">
          <thead>
            <tr>
              <th>RFQ No.</th><th>Date</th><th>PR No.</th>
              <th>Subject</th><th>Items</th>
              <th>Vendors</th><th>Quotes Received</th>
              <th>Deadline</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r=>{
              const sc = STATUS[r.status]||STATUS.OPEN
              const vendorList = (() => {
                try { return JSON.parse(r.vendors||'[]') } catch { return [] }
              })()
              return (
                <tr key={r.id}>
                  <td><strong style={{ color:'var(--odoo-purple)',
                    fontFamily:'DM Mono,monospace', fontSize:12 }}>
                    {r.rfqNo}</strong></td>
                  <td style={{ fontSize:11, color:'#6C757D' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ fontFamily:'DM Mono,monospace',
                    fontSize:11, color:'#6C757D' }}>
                    {r.prNo||'—'}
                  </td>
                  <td style={{ fontSize:12 }}>
                    {r.subject||'—'}
                  </td>
                  <td style={{ textAlign:'center', fontWeight:700,
                    color:'#714B67' }}>
                    {r.lines?.length||0}
                  </td>
                  <td style={{ fontSize:11 }}>
                    {vendorList.slice(0,2).join(', ')}
                    {vendorList.length>2 &&
                      ` +${vendorList.length-2} more`}
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span style={{ fontWeight:700,
                      color:r.quotedCount>0?'#155724':'#6C757D' }}>
                      {r.quotedCount||0}/{vendorList.length||'—'}
                    </span>
                  </td>
                  <td style={{ fontSize:11,
                    color: r.deadline&&new Date(r.deadline)<new Date()
                      ?'#DC3545':'#6C757D' }}>
                    {r.deadline
                      ?new Date(r.deadline).toLocaleDateString('en-IN')
                      :'—'}
                  </td>
                  <td>
                    <span style={{ padding:'2px 8px', borderRadius:10,
                      fontSize:11, fontWeight:700,
                      background:sc.bg, color:sc.color }}>
                      {sc.label}
                    </span>
                  </td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn-xs"
                        onClick={()=>setDetailRFQ(r)}>
                        📋 Detail
                      </button>
                      <button className="btn-xs"
                        onClick={()=>setQuoteRFQ(r)}>
                        📥 Add Quote
                      </button>
                      {r.quotedCount>0 && (
                        <button className="btn-xs pri"
                          onClick={()=>nav(
                            `/mm/cs/new?rfq=${r.id}&prNo=${r.prNo||''}`)}>
                          📊 CS
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

      {showNew && (
        <RFQModal prs={prs} items={items}
          onSave={()=>{ setShowNew(false); fetchAll() }}
          onCancel={()=>setShowNew(false)} />
      )}

      {quoteRFQ && (
        <QuoteModal rfq={quoteRFQ}
          vendors={vendors}
          onSave={()=>{ setQuoteRFQ(null); fetchAll() }}
          onCancel={()=>setQuoteRFQ(null)} />
      )}

      {detailRFQ && (
        <RFQDetailModal rfq={detailRFQ}
          onClose={()=>setDetailRFQ(null)} />
      )}
    </div>
  )
}
