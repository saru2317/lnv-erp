import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN',
  {minimumFractionDigits:2,maximumFractionDigits:2})
const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
  borderRadius:5, fontSize:12, outline:'none', width:'100%',
  boxSizing:'border-box', fontFamily:'DM Sans,sans-serif',
  background:'#fff' }

export default function VendorInvNew() {
  const nav = useNavigate()
  const [pos,     setPOs]    = useState([])
  const [grns,    setGRNs]   = useState([])
  const [selPO,   setSelPO]  = useState(null)
  const [selGRN,  setSelGRN] = useState(null)
  const [saving,  setSaving] = useState(false)
  const [invNo,   setInvNo]  = useState('Auto-generated')
  const [lines,   setLines]  = useState([])
  const [tds,     setTds]    = useState(0)

  const [form, setForm] = useState({
    vendorInvNo: '',
    invDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    poId: '', poNo: '',
    grnNo: '',
    vendorName: '', vendorGstin: '',
    placeOfSupply: '33 - Tamil Nadu',
    paymentMethod: 'Bank Transfer (NEFT/RTGS)',
    remarks: ''
  })

  useEffect(()=>{
    // Load approved POs
    fetch(`${BASE_URL}/mm/po?status=APPROVED,GRN_DONE,PARTIAL_GRN`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setPOs(d.data||[]))
      .catch(()=>{})
    // Get next invoice number
    fetch(`${BASE_URL}/mm/invoices/next-no`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setInvNo(d.invNo||'VINV-AUTO'))
      .catch(()=>{})
  },[])

  const onPOChange = async (e) => {
    const po = pos.find(p=>p.id===parseInt(e.target.value))
    if (!po) return
    setSelPO(po)
    setForm(f=>({ ...f,
      poId: po.id, poNo: po.poNo,
      vendorName: po.vendorName,
      vendorGstin: po.vendorGstin||'',
    }))
    // Load lines from PO
    setLines((po.lines||[]).map(l=>({
      itemName:  l.itemName,
      hsnCode:   l.hsnCode||'',
      qty:       parseFloat(l.receivedQty||l.qty||0),
      unit:      l.unit,
      rate:      parseFloat(l.rate||0),
      discount:  parseFloat(l.discount||0),
      gstRate:   parseFloat(l.gstRate||18),
      taxableAmt:parseFloat(l.taxableAmt||0),
      cgst:      parseFloat(l.cgst||0),
      sgst:      parseFloat(l.sgst||0),
      igst:      parseFloat(l.igst||0),
      totalAmt:  parseFloat(l.totalAmt||0),
      matched:   true
    })))
    // Load GRNs for this PO
    fetch(`${BASE_URL}/wm/grn?poId=${po.id}`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setGRNs(d.data||[]))
      .catch(()=>{})
  }

  const subTotal  = lines.reduce((s,l)=>s+l.taxableAmt,0)
  const totalCGST = lines.reduce((s,l)=>s+l.cgst,0)
  const totalSGST = lines.reduce((s,l)=>s+l.sgst,0)
  const totalIGST = lines.reduce((s,l)=>s+l.igst,0)
  const totalGST  = totalCGST+totalSGST+totalIGST
  const tdsAmt    = parseFloat(tds||0)
  const grandTotal= subTotal+totalGST-tdsAmt

  const save = async (status='DRAFT') => {
    if (!form.vendorName) return toast.error('Select a PO first!')
    if (!form.vendorInvNo) return toast.error('Vendor Invoice No. required!')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/mm/invoices`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({
            ...form,
            subTotal, totalGST, totalAmount:grandTotal,
            tdsAmount: tdsAmt,
            grnNo: selGRN?.grnNo||'',
          })})
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      nav('/mm/invoices')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const sHdr = (title) => (
    <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
      padding:'8px 16px' }}>
      <span style={{ color:'#fff', fontSize:13,
        fontWeight:700, fontFamily:'Syne,sans-serif' }}>
        {title}
      </span>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column',
      height:'100%', overflow:'hidden' }}>

      {/* Sticky Header */}
      <div style={{ flexShrink:0, position:'sticky', top:0,
        zIndex:100, background:'#F8F4F8',
        borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Enter Vendor Invoice
            <small style={{ marginLeft:8,
              fontFamily:'DM Mono,monospace',
              color:'#714B67' }}>{invNo}</small>
          </div>
          <div className="lv-acts">
            {/* Flow steps */}
            <div style={{ display:'flex', gap:0,
              marginRight:8, fontSize:11 }}>
              {['GRN Done','Invoice Entry','Verification','Payment']
                .map((s,i)=>(
                <div key={s} style={{ display:'flex',
                  alignItems:'center' }}>
                  <span style={{ padding:'3px 10px',
                    background:i===1?'#714B67':'#D4EDDA',
                    color:i===1?'#fff':'#155724',
                    fontSize:10, fontWeight:700,
                    borderRadius:i===0?'10px 0 0 10px'
                      :i===3?'0 10px 10px 0':'0' }}>
                    {s}
                  </span>
                  {i<3 && <span style={{ color:'#6C757D',
                    fontSize:14 }}>›</span>}
                </div>
              ))}
            </div>
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav('/mm/invoices')}>✕ Cancel</button>
            <button className="btn btn-s sd-bsm"
              disabled={saving} onClick={()=>save('DRAFT')}>
              💾 Save Draft
            </button>
            <button className="btn btn-p sd-bsm"
              disabled={saving} onClick={()=>save('PENDING')}>
              {saving?'⏳ Posting...':'📤 Post Invoice'}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div style={{ flex:1, overflowY:'auto',
        padding:'14px 0', paddingBottom:40 }}>

        {/* Header Section */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', marginBottom:14 }}>
          {sHdr('📋 Invoice Header')}
          <div style={{ padding:16, background:'#fff' }}>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 1fr 1fr',
              gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700,
                  color:'#495057', display:'block',
                  marginBottom:3, textTransform:'uppercase' }}>
                  Invoice No. (Internal)
                </label>
                <input style={{ ...inp, background:'#F8F4F8',
                  color:'#714B67', fontWeight:700 }}
                  value={invNo} readOnly />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700,
                  color:'#495057', display:'block',
                  marginBottom:3, textTransform:'uppercase' }}>
                  Vendor Invoice No. *
                </label>
                <input style={inp} value={form.vendorInvNo}
                  placeholder="e.g. LTM/2025/0125"
                  onChange={e=>setForm(f=>({...f,
                    vendorInvNo:e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700,
                  color:'#495057', display:'block',
                  marginBottom:3, textTransform:'uppercase' }}>
                  Invoice Date *
                </label>
                <input type="date" style={inp}
                  value={form.invDate}
                  onChange={e=>setForm(f=>({...f,
                    invDate:e.target.value}))} />
              </div>
            </div>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 1fr 1fr',
              gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700,
                  color:'#495057', display:'block',
                  marginBottom:3, textTransform:'uppercase' }}>
                  Reference PO *
                </label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={form.poId}
                  onChange={onPOChange}>
                  <option value="">-- Select PO --</option>
                  {pos.map(p=>(
                    <option key={p.id} value={p.id}>
                      {p.poNo} · {p.vendorName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700,
                  color:'#495057', display:'block',
                  marginBottom:3, textTransform:'uppercase' }}>
                  GRN Reference
                </label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={form.grnNo}
                  onChange={e=>{
                    const g = grns.find(g=>g.grnNo===e.target.value)
                    setSelGRN(g||null)
                    setForm(f=>({...f, grnNo:e.target.value}))
                  }}>
                  <option value="">-- Select GRN --</option>
                  {grns.map(g=>(
                    <option key={g.id} value={g.grnNo}>
                      {g.grnNo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700,
                  color:'#495057', display:'block',
                  marginBottom:3, textTransform:'uppercase' }}>
                  Due Date
                </label>
                <input type="date" style={inp}
                  value={form.dueDate}
                  onChange={e=>setForm(f=>({...f,
                    dueDate:e.target.value}))} />
              </div>
            </div>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700,
                  color:'#495057', display:'block',
                  marginBottom:3, textTransform:'uppercase' }}>
                  Vendor
                </label>
                <input style={{ ...inp, background:'#F8F9FA' }}
                  value={form.vendorName} readOnly />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700,
                  color:'#495057', display:'block',
                  marginBottom:3, textTransform:'uppercase' }}>
                  Vendor GSTIN
                </label>
                <input style={{ ...inp, background:'#F8F9FA' }}
                  value={form.vendorGstin} readOnly />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700,
                  color:'#495057', display:'block',
                  marginBottom:3, textTransform:'uppercase' }}>
                  Payment Method
                </label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={form.paymentMethod}
                  onChange={e=>setForm(f=>({...f,
                    paymentMethod:e.target.value}))}>
                  {['Bank Transfer (NEFT/RTGS)',
                    'RTGS','Cheque','UPI','Cash'].map(m=>(
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor info bar */}
        {selPO && (
          <div style={{ background:'#F8F4F8', borderRadius:8,
            padding:'10px 16px', marginBottom:14,
            border:'1px solid #E0D5E0',
            display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ width:36, height:36,
              background:'#714B67', borderRadius:'50%',
              display:'flex', alignItems:'center',
              justifyContent:'center', color:'#fff',
              fontWeight:800, fontSize:13 }}>
              {selPO.vendorName?.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>
                {selPO.vendorName}
              </div>
              <div style={{ fontSize:11, color:'#6C757D' }}>
                {selPO.vendorGstin||'No GSTIN'} ·
                PO: {selPO.poNo} ·
                Total: {fmtC(selPO.totalAmount)}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <span style={{ padding:'3px 10px', borderRadius:8,
                fontSize:11, fontWeight:700,
                background:'#D4EDDA', color:'#155724' }}>
                ✅ 3-Way Match: PO + GRN + Invoice
              </span>
            </div>
          </div>
        )}

        {/* Line Items */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', marginBottom:14 }}>
          {sHdr('📦 Invoice Line Items (from GRN/PO)')}
          {lines.length===0 ? (
            <div style={{ padding:30, textAlign:'center',
              color:'#6C757D', fontSize:12, background:'#fff' }}>
              Select a PO above to load line items
            </div>
          ) : (
            <div style={{ overflowX:'auto', background:'#fff' }}>
              <table style={{ width:'100%',
                borderCollapse:'collapse', fontSize:12 }}>
                <thead style={{ background:'#F8F4F8' }}>
                  <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                    {['#','HSN','Description','Qty','Unit',
                      'Rate','Taxable','GST%',
                      'CGST','SGST','IGST','Total','Match'].map(h=>(
                      <th key={h} style={{ padding:'7px 10px',
                        fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'right',
                        textTransform:'uppercase',
                        letterSpacing:.3 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l,i)=>(
                    <tr key={i} style={{
                      borderBottom:'1px solid #F0EEF0',
                      background:i%2===0?'#fff':'#FDFBFD' }}>
                      <td style={{ padding:'7px 10px',
                        textAlign:'center',
                        color:'#6C757D' }}>{i+1}</td>
                      <td style={{ padding:'7px 10px',
                        fontFamily:'DM Mono,monospace',
                        fontSize:11, color:'#6C757D',
                        textAlign:'right' }}>
                        {l.hsnCode||'—'}
                      </td>
                      <td style={{ padding:'7px 10px',
                        fontWeight:600, textAlign:'left',
                        minWidth:160 }}>
                        {l.itemName}
                      </td>
                      <td style={{ padding:'7px 10px',
                        textAlign:'right', fontWeight:700 }}>
                        {l.qty}
                      </td>
                      <td style={{ padding:'7px 10px',
                        textAlign:'center' }}>{l.unit}</td>
                      <td style={{ padding:'7px 10px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace' }}>
                        {fmtC(l.rate)}
                      </td>
                      <td style={{ padding:'7px 10px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        background:'#F8F9FA' }}>
                        {fmtC(l.taxableAmt)}
                      </td>
                      <td style={{ padding:'7px 10px',
                        textAlign:'center' }}>
                        {l.gstRate}%
                      </td>
                      <td style={{ padding:'7px 10px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        color:'#E06F39', fontSize:11 }}>
                        {fmtC(l.cgst)}
                      </td>
                      <td style={{ padding:'7px 10px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        color:'#E06F39', fontSize:11 }}>
                        {fmtC(l.sgst)}
                      </td>
                      <td style={{ padding:'7px 10px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        color:'#E06F39', fontSize:11 }}>
                        {fmtC(l.igst)}
                      </td>
                      <td style={{ padding:'7px 10px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        fontWeight:800, color:'#714B67',
                        background:'#EDE0EA' }}>
                        {fmtC(l.totalAmt)}
                      </td>
                      <td style={{ padding:'7px 10px',
                        textAlign:'center' }}>
                        <span style={{ padding:'2px 8px',
                          borderRadius:8, fontSize:10,
                          fontWeight:700,
                          background:'#D4EDDA',
                          color:'#155724' }}>
                          ✅ Matched
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{ display:'flex',
          justifyContent:'flex-end', marginBottom:14 }}>
          <div style={{ width:340, border:'1px solid #E0D5E0',
            borderRadius:8, overflow:'hidden' }}>
            {sHdr('💰 Invoice Summary')}
            <div style={{ padding:16, background:'#fff' }}>
              {[
                ['Sub Total (Taxable)', fmtC(subTotal),   '#1C1C1C'],
                ['Total CGST',          fmtC(totalCGST),  '#E06F39'],
                ['Total SGST',          fmtC(totalSGST),  '#E06F39'],
                ['Total IGST',          fmtC(totalIGST),  '#E06F39'],
              ].map(([l,v,c])=>(
                <div key={l} style={{ display:'flex',
                  justifyContent:'space-between',
                  padding:'5px 0',
                  borderBottom:'1px solid #F0EEF0',
                  fontSize:12 }}>
                  <span style={{ color:'#6C757D' }}>{l}</span>
                  <span style={{ fontFamily:'DM Mono,monospace',
                    color:c, fontWeight:600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display:'flex',
                justifyContent:'space-between',
                padding:'5px 0',
                borderBottom:'1px solid #F0EEF0',
                fontSize:12, alignItems:'center' }}>
                <span style={{ color:'#6C757D' }}>
                  TDS Deductible
                </span>
                <input type="number" min={0}
                  value={tds}
                  onChange={e=>setTds(e.target.value)}
                  style={{ width:100, padding:'3px 6px',
                    border:'1px solid #E0D5E0',
                    borderRadius:4, fontSize:11,
                    textAlign:'right',
                    fontFamily:'DM Mono,monospace' }} />
              </div>
              <div style={{ display:'flex',
                justifyContent:'space-between',
                padding:'10px 0 0',
                borderTop:'2px solid #714B67',
                marginTop:4 }}>
                <span style={{ fontSize:14, fontWeight:800,
                  color:'#714B67',
                  fontFamily:'Syne,sans-serif' }}>
                  Invoice Total
                </span>
                <span style={{ fontFamily:'DM Mono,monospace',
                  fontSize:16, fontWeight:800,
                  color:'#155724' }}>
                  {fmtC(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div style={{ border:'1px solid #E0D5E0',
          borderRadius:8, overflow:'hidden' }}>
          {sHdr('📝 Remarks')}
          <div style={{ padding:16, background:'#fff' }}>
            <textarea value={form.remarks}
              onChange={e=>setForm(f=>({...f,
                remarks:e.target.value}))}
              rows={2} style={{ ...inp, resize:'vertical' }}
              placeholder="Any notes about this invoice..." />
          </div>
        </div>

      </div>
    </div>
  )
}
