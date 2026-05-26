/**
 * POPrint — Purchase Order Print (A4)
 * Route: /print/po/:id
 * Fetches real PO data from API
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')

const COMPANY = {
  name:    'LNV Manufacturing Pvt. Ltd.',
  addr:    'Plot No. 42, SIDCO Industrial Estate, Ranipet — 632401, Tamil Nadu',
  gstin:   '33AABCL1234F1Z5',
  phone:   '+91 99440 01234',
  email:   'purchase@lnvmfg.com',
  web:     'www.lnvmfg.com',
  state:   'Tamil Nadu',
  stateCode: '33',
}

const fmt  = n => Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
const fmtQ = n => Number(n||0).toLocaleString('en-IN', { maximumFractionDigits:3 })

function numToWords(n) {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  const w = n => {
    if (n < 20) return a[n]
    if (n < 100) return b[Math.floor(n/10)] + (n%10 ? ' '+a[n%10] : '')
    if (n < 1000) return a[Math.floor(n/100)]+' Hundred'+(n%100?' '+w(n%100):'')
    if (n < 100000) return w(Math.floor(n/1000))+' Thousand'+(n%1000?' '+w(n%1000):'')
    if (n < 10000000) return w(Math.floor(n/100000))+' Lakh'+(n%100000?' '+w(n%100000):'')
    return w(Math.floor(n/10000000))+' Crore'+(n%10000000?' '+w(n%10000000):'')
  }
  const r = Math.round(n)
  return 'Rupees ' + w(r) + ' Only'
}

export default function POPrint() {
  const { id } = useParams()
  const nav    = useNavigate()
  const [po,   setPo]  = useState(null)
  const [load, setLoad]= useState(true)

  useEffect(() => {
    fetch(`${BASE}/mm/po/${id}`, { headers:{ Authorization:`Bearer ${tok()}` } })
      .then(r=>r.json()).then(d=>{ setPo(d.data); setLoad(false) })
      .catch(()=>setLoad(false))
  }, [id])

  if (load) return <div style={{padding:60,textAlign:'center',fontFamily:'Arial'}}>⏳ Loading PO...</div>
  if (!po)  return <div style={{padding:60,textAlign:'center',fontFamily:'Arial'}}>PO not found</div>

  const lines   = po.lines || []
  const addDeds = (() => { try { return JSON.parse(po.addDeductions||'[]') } catch { return [] } })()
  const adds    = addDeds.filter(a=>a.type==='Addition')
  const deds    = addDeds.filter(a=>a.type==='Deduction')

  const subTotal  = lines.reduce((s,l)=>s+parseFloat(l.taxableAmt||0), 0)
  const totalCGST = lines.reduce((s,l)=>s+parseFloat(l.cgst||0), 0)
  const totalSGST = lines.reduce((s,l)=>s+parseFloat(l.sgst||0), 0)
  const totalIGST = lines.reduce((s,l)=>s+parseFloat(l.igst||0), 0)
  const totalGST  = totalCGST+totalSGST+totalIGST
  const lineCharges = lines.reduce((s,l)=>
    s+parseFloat(l.freight||0)+parseFloat(l.packing||0)+parseFloat(l.insurance||0)+parseFloat(l.otherCharges||0), 0)
  const addAmt    = adds.reduce((s,a)=>s+parseFloat(a.amount||0), 0)
  const dedAmt    = deds.reduce((s,a)=>s+parseFloat(a.amount||0), 0)
  const gross     = subTotal+totalGST+lineCharges+addAmt-dedAmt
  const roundOff  = Math.round(gross)-gross
  const netTotal  = Math.round(gross)

  const isIntra = po.vendorGstin?.slice(0,2) === COMPANY.stateCode
  const poDate  = po.poDate ? new Date(po.poDate).toLocaleDateString('en-IN') : '—'

  const tdS = { border:'1px solid #888', padding:'4px 6px', fontSize:11 }
  const thS = { ...tdS, background:'#EEEEEE', fontWeight:700, textAlign:'center', fontSize:10 }

  return (
    <>
      {/* No-print toolbar */}
      <div style={{ position:'fixed',top:0,left:0,right:0,zIndex:999,
        background:'#714B67',padding:'8px 16px',
        display:'flex',alignItems:'center',gap:12,
        printVisibility:'hidden' }}
        className="no-print">
        <button onClick={()=>nav(`/mm/po/${id}`)}
          style={{ padding:'4px 14px',background:'rgba(255,255,255,.2)',
            border:'1px solid rgba(255,255,255,.4)',borderRadius:4,
            color:'#fff',cursor:'pointer',fontSize:12 }}>← Back</button>
        <span style={{ color:'#fff',fontWeight:700,fontSize:14 }}>
          Purchase Order — {po.poNo}
        </span>
        <button onClick={()=>window.print()}
          style={{ marginLeft:'auto',padding:'6px 20px',
            background:'#fff',color:'#714B67',
            border:'none',borderRadius:4,fontWeight:700,
            cursor:'pointer',fontSize:13 }}>
          🖨️ Print / Save PDF
        </button>
      </div>

      <style>{`
        @media print {
          .no-print { display:none !important; }
          body { margin:0; padding:0; }
        }
        @page { size:A4; margin:10mm; }
      `}</style>

      {/* A4 Document */}
      <div style={{ maxWidth:800, margin:'60px auto 40px',
        background:'#fff', fontFamily:'Arial,sans-serif',
        fontSize:11, color:'#000',
        border:'1px solid #ccc', boxShadow:'0 2px 10px rgba(0,0,0,.1)' }}>

        {/* Title */}
        <div style={{ textAlign:'center', fontWeight:800, fontSize:16,
          padding:'10px 0', letterSpacing:1,
          borderBottom:'2px solid #000' }}>
          PURCHASE ORDER
        </div>

        {/* Vendor + PO Info */}
        <div style={{ display:'flex', borderBottom:'1px solid #888' }}>
          {/* Vendor */}
          <div style={{ flex:1, padding:'10px 12px', borderRight:'1px solid #888' }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>
              {po.vendorName}
            </div>
            {po.vendorAddress && <div style={{ marginBottom:2 }}>{po.vendorAddress}</div>}
            {po.vendorGstin && (
              <div><strong>GSTIN No : </strong>{po.vendorGstin}</div>
            )}
            <div>
              <strong>State : </strong>{po.vendorState || '—'}
              {po.vendorGstin && <span> , <strong>State Code : </strong>{po.vendorGstin.slice(0,2)}</span>}
            </div>
          </div>
          {/* PO Details */}
          <div style={{ width:255, padding:'10px 12px' }}>
            {[
              ['PO No',     po.poNo],
              ['PO Dt',     poDate],
              ['GSTIN',     COMPANY.gstin],
              po.prNo && ['PR Ref', po.prNo],
              po.csNo && ['CS Ref', po.csNo],
              po.validTo && ['Valid To', new Date(po.validTo).toLocaleDateString('en-IN')],
              po.paymentTerms && ['Payment', po.paymentTerms],
            ].filter(Boolean).map(([l,v])=>(
              <div key={l} style={{ display:'flex', gap:4, padding:'1px 0' }}>
                <span style={{ fontWeight:700, whiteSpace:'nowrap', minWidth:70 }}>{l}</span>
                <span>: {v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['S.No','Item Description','HSN Code','UOM','GST Rate',
                'Qty','Rate/UOM INR','Disc%','Disc Amt','Amount INR']
                .map(h=><th key={h} style={thS}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {lines.map((l,i)=>{
              const qty     = parseFloat(l.qty||0)
              const rate    = parseFloat(l.rate||0)
              const disc    = parseFloat(l.discount||0)
              const discAmt = qty*rate*disc/100
              const amount  = parseFloat(l.taxableAmt||(qty*rate*(1-disc/100)))
              const gstR    = parseFloat(l.gstRate||0)
              return (
                <tr key={i}>
                  <td style={{...tdS,textAlign:'center'}}>{i+1}</td>
                  <td style={tdS}>
                    <div style={{fontWeight:600}}>{l.itemName}</div>
                    {l.specification&&<div style={{color:'#555',fontSize:10}}>{l.specification}</div>}
                  </td>
                  <td style={{...tdS,textAlign:'center'}}>{l.hsnCode||''}</td>
                  <td style={{...tdS,textAlign:'center'}}>{l.unit}</td>
                  <td style={{...tdS,textAlign:'center'}}>{gstR}%</td>
                  <td style={{...tdS,textAlign:'right'}}>{fmtQ(qty)}</td>
                  <td style={{...tdS,textAlign:'right'}}>{fmt(rate)}</td>
                  <td style={{...tdS,textAlign:'right'}}>{disc>0?disc.toFixed(2):'0.00'}</td>
                  <td style={{...tdS,textAlign:'right'}}>{fmt(discAmt)}</td>
                  <td style={{...tdS,textAlign:'right',fontWeight:600}}>{fmt(amount)}</td>
                </tr>
              )
            })}
            {/* Blank rows */}
            {Array(Math.max(0,6-lines.length)).fill(0).map((_,i)=>(
              <tr key={`b${i}`}>
                {Array(10).fill(0).map((_,j)=>(
                  <td key={j} style={{...tdS,height:22}}></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer: T&C + Totals */}
        <div style={{ display:'flex', borderTop:'1px solid #888' }}>
          {/* T&C */}
          <div style={{ flex:1, padding:'8px 12px', borderRight:'1px solid #888' }}>
            <div style={{marginBottom:6}}>
              <strong>Remarks : </strong>{po.remarks||''}
            </div>
            <div>
              <strong>Terms and Conditions :</strong>
              <div style={{marginTop:3,lineHeight:1.8}}>
                {po.paymentTerms&&<div><strong>Payment Terms</strong> : {po.paymentTerms}</div>}
                {po.deliveryLocation&&<div><strong>Delivery Term</strong> : {po.deliveryLocation}</div>}
                {adds.map((a,i)=><div key={i}><strong>{a.description}</strong> : ₹{fmt(a.amount)}</div>)}
                {po.termsConditions&&<div style={{marginTop:4,whiteSpace:'pre-line',fontSize:10}}>{po.termsConditions}</div>}
              </div>
            </div>
          </div>
          {/* Totals */}
          <div style={{ width:250, padding:'8px 12px' }}>
            {[
              ['Total Amount (₹)', fmt(subTotal), false],
              isIntra && totalCGST>0 && ['CGST', fmt(totalCGST), false],
              isIntra && totalSGST>0 && ['SGST', fmt(totalSGST), false],
              !isIntra && totalIGST>0 && ['IGST', fmt(totalIGST), false],
              lineCharges>0 && ['Freight/Packing/Ins', fmt(lineCharges), false],
              ...adds.map(a=>[`+ ${a.description}`, fmt(a.amount), false]),
              ...deds.map(a=>[`- ${a.description}`, fmt(a.amount), false]),
              ['Round Off', fmt(roundOff), false],
            ].filter(Boolean).map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'2px 0',borderBottom:'1px solid #eee'}}>
                <span style={{fontWeight:600}}>{l}</span>
                <span>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex',justifyContent:'space-between',
              padding:'5px 0',borderTop:'2px solid #000',marginTop:2 }}>
              <span style={{fontWeight:800,fontSize:13}}>Net Amount (₹)</span>
              <span style={{fontWeight:800,fontSize:13}}>{fmt(netTotal)}</span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div style={{ display:'flex',justifyContent:'space-between',
          borderTop:'1px solid #888',padding:'6px 12px' }}>
          <div><strong>Amount In Words : </strong>{numToWords(netTotal)}</div>
          <div style={{fontWeight:700}}>Net Amount (₹){fmt(netTotal)}</div>
        </div>

        {/* Instruction */}
        <div style={{ padding:'6px 12px',fontSize:10,lineHeight:1.5,
          borderTop:'1px solid #888',borderBottom:'1px solid #888' }}>
          Kindly acknowledge the receipt of this order and ensure delivery at our address as per
          scheduled dates. Our GSTIN and Order number must appear on all packing slips, delivery
          challans and invoices (Two Copies). Inspection report should be provided along with materials.
        </div>

        {/* Signatures */}
        <div style={{ display:'flex',borderBottom:'1px solid #888' }}>
          {['Prepared By','Checked','Authorised By'].map((s,i)=>(
            <div key={s} style={{ flex:1, padding:'12px',
              borderRight:i<2?'1px solid #888':'none', minHeight:55 }}>
              <div style={{fontSize:11}}>{s}</div>
              {i===1&&<div style={{textAlign:'center',fontWeight:700,fontSize:12,marginTop:8}}>
                for {COMPANY.name}
              </div>}
            </div>
          ))}
        </div>

        {/* Company Footer */}
        <div style={{ display:'flex',justifyContent:'space-between',
          padding:'8px 12px',fontSize:10 }}>
          <div>
            <div style={{fontWeight:700,fontSize:12,marginBottom:2}}>{COMPANY.name}</div>
            <div>{COMPANY.addr}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div><strong>Phone : </strong>{COMPANY.phone}</div>
            <div><strong>GSTIN : </strong>{COMPANY.gstin}</div>
            <div><strong>Email : </strong>{COMPANY.email}</div>
            <div><strong>Web : </strong>{COMPANY.web}</div>
          </div>
        </div>
      </div>
    </>
  )
}
