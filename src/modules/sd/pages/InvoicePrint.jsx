import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ Authorization: `Bearer ${tok()}` })
const fmtD = s => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
const fmtC = n => '₹' + parseFloat(n||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })

function toWords(n) {
  n = Math.floor(n)
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven',
    'Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  if (n===0) return 'Zero'
  if (n<20) return a[n]
  if (n<100) return b[Math.floor(n/10)]+(n%10?' '+a[n%10]:'')
  if (n<1000) return a[Math.floor(n/100)]+' Hundred'+(n%100?' '+toWords(n%100):'')
  if (n<100000) return toWords(Math.floor(n/1000))+' Thousand'+(n%1000?' '+toWords(n%1000):'')
  if (n<10000000) return toWords(Math.floor(n/100000))+' Lakh'+(n%100000?' '+toWords(n%100000):'')
  return toWords(Math.floor(n/10000000))+' Crore'+(n%10000000?' '+toWords(n%10000000):'')
}

export default function InvoicePrint() {
  const { id } = useParams()
  const nav    = useNavigate()
  const [inv,     setInv]     = useState(null)
  const [co,      setCo]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetch(`${BASE}/sd/invoices/${id}`, { headers: hdr() })
      .then(r => r.json())
      .then(async d => {
        const data = d.data || d
        // Block if no IRN
        if (!data.irn) {
          setError('e-Invoice (IRN) not generated. Please generate IRN before printing.')
          setLoading(false)
          return
        }
        // Load company from localStorage
        let c = {}
        try { c = JSON.parse(localStorage.getItem('lnv_company') || '{}') } catch {}
        // Fetch customer for ship address if not on invoice
        if (!data.shipToAddress && data.customerId) {
          try {
            const cr = await fetch(`${BASE}/sd/customers/${data.customerId}`, { headers: hdr() })
            const cd = await cr.json()
            const cust = cd.data || cd
            if (!data.billToAddress) data.billToAddress = [cust.address, cust.city, cust.state, cust.pincode].filter(Boolean).join(', ')
            data.shipToAddress = data.billToAddress
          } catch {}
        }
        setCo({
          name:      c.name      || 'LNV Manufacturing Pvt. Ltd.',
          address:   c.address   || 'Plot No. 42, SIDCO Industrial Estate',
          city:      c.city      || 'Ranipet',
          state:     c.state     || 'Tamil Nadu',
          pincode:   c.pincode   || '632401',
          gstin:     c.gstin     || '33AABCL1234F1Z5',
          pan:       c.pan       || 'AABCL1234F',
          phone:     c.phone     || '',
          email:     c.email     || '',
          bankName:  c.bankName  || 'HDFC Bank',
          bankBranch:c.bankBranch|| '',
          accountNo: c.accountNo || '',
          ifsc:      c.ifsc      || '',
          stateCode: c.stateCode || '33',
        })
        setInv(data)
      })
      .catch(() => setError('Failed to load invoice'))
      .finally(() => setLoading(false))
  }, [id])

  // No auto-print — user clicks Print button manually

  if (loading) return <div style={{ padding:40, textAlign:'center', fontFamily:'Arial' }}>⏳ Loading...</div>

  if (error) return (
    <div style={{ padding:40, textAlign:'center', fontFamily:'Arial' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
      <div style={{ fontSize:18, fontWeight:700, color:'#DC3545', marginBottom:12 }}>{error}</div>
      <div style={{ fontSize:13, color:'#666', marginBottom:24 }}>
        Go to <strong>Sales → GST Compliance → e-Invoice</strong> and generate IRN for this invoice first.
      </div>
      <button onClick={() => nav(`/sd/invoices/${id}`)} style={{ padding:'8px 24px', background:'#714B67', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>
        ← Back to Invoice
      </button>
    </div>
  )

  const lines   = Array.isArray(inv.lines) ? inv.lines : (() => { try { return JSON.parse(inv.lines||'[]') } catch { return [] } })()
  const cgst    = parseFloat(inv.cgst    || 0)
  const sgst    = parseFloat(inv.sgst    || 0)
  const igst    = parseFloat(inv.igst    || 0)
  const taxable = parseFloat(inv.taxableAmt || inv.totalAmt || 0)
  const grand   = parseFloat(inv.grandTotal || inv.totalAmt || 0)
  const isIGST  = igst > 0
  const paise   = Math.round((grand % 1) * 100)
  const amtWords = toWords(Math.floor(grand)) + ' Rupees' + (paise > 0 ? ' and ' + toWords(paise) + ' Paise' : '') + ' Only'

  const B = '1px solid #333'
  const th = { border:B, padding:'5px 7px', background:'#E8DDE8', fontSize:10, fontWeight:700, textAlign:'center', color:'#333' }
  const td = (align='left') => ({ border:B, padding:'4px 7px', fontSize:10, textAlign:align, verticalAlign:'top' })

  return (<>
    <style>{`
      @media print {
        @page { size: A4 portrait; margin: 8mm; }
        body * { visibility: hidden; }
        .inv-page, .inv-page * { visibility: visible; }
        .inv-page { position: fixed; top:0; left:0; width:100%; background:#fff; }
        .no-print { display: none !important; }
      }
      body { font-family: Arial, sans-serif; background: #f0f0f0; margin:0; }
      .inv-page { max-width:210mm; margin:0 auto; background:#fff; padding:6mm; box-sizing:border-box; }
      table { border-collapse:collapse; width:100%; }
    `}</style>

    {/* Controls */}
    <div className="no-print" style={{ background:'#714B67', padding:'10px 20px', display:'flex', gap:10, alignItems:'center' }}>
      <button onClick={() => nav(`/sd/invoices/${id}`)} style={{ padding:'6px 16px', background:'#fff', color:'#714B67', border:'none', borderRadius:5, cursor:'pointer', fontWeight:600 }}>← Back</button>
      <button onClick={() => window.print()} style={{ padding:'6px 16px', background:'#28A745', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontWeight:600 }}>🖨️ Print / Save PDF</button>
      <span style={{ color:'#fff', fontSize:12, marginLeft:8 }}>Invoice: {inv.invoiceNo} | IRN: ✅ Generated</span>
    </div>

    <div className="inv-page">

      {/* ── COMPANY HEADER ── */}
      <table style={{ marginBottom:0 }}>
        <tbody><tr>
          <td style={{ border:B, padding:'8px 12px', width:'65%', verticalAlign:'top' }}>
            <div style={{ fontSize:16, fontWeight:900, color:'#714B67' }}>{co.name}</div>
            <div style={{ fontSize:10, marginTop:2 }}>{co.address}, {co.city} - {co.pincode}, {co.state}</div>
            <div style={{ fontSize:10, marginTop:2 }}>
              <strong>GSTIN:</strong> {co.gstin} &nbsp;|&nbsp; <strong>PAN:</strong> {co.pan} &nbsp;|&nbsp; <strong>State Code:</strong> {co.stateCode}
            </div>
            {(co.phone||co.email) && <div style={{ fontSize:10, marginTop:2 }}>
              {co.phone && <><strong>Ph:</strong> {co.phone} &nbsp;|&nbsp;</>}
              {co.email && <><strong>Email:</strong> {co.email}</>}
            </div>}
          </td>
          <td style={{ border:B, padding:'8px 12px', textAlign:'center', verticalAlign:'middle', background:'#F9F6F8' }}>
            <div style={{ fontSize:20, fontWeight:900, color:'#714B67', letterSpacing:1 }}>TAX INVOICE</div>
            <div style={{ fontSize:9, color:'#888', marginTop:2 }}>Original for Recipient</div>
            <div style={{ fontSize:9, color:'#888' }}>As per GST Act 2017</div>
          </td>
        </tr></tbody>
      </table>

      {/* ── INVOICE META ── */}
      <table style={{ marginTop:-1 }}>
        <tbody><tr>
          <td style={{ border:B, padding:'5px 10px', width:'25%' }}>
            <div style={{ fontSize:9, color:'#666' }}>Invoice No.</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#714B67' }}>{inv.invoiceNo}</div>
          </td>
          <td style={{ border:B, padding:'5px 10px', width:'20%' }}>
            <div style={{ fontSize:9, color:'#666' }}>Invoice Date</div>
            <div style={{ fontSize:12, fontWeight:700 }}>{fmtD(inv.date||inv.createdAt)}</div>
          </td>
          <td style={{ border:B, padding:'5px 10px', width:'20%' }}>
            <div style={{ fontSize:9, color:'#666' }}>Due Date</div>
            <div style={{ fontSize:12, fontWeight:700 }}>{fmtD(inv.dueDate)}</div>
          </td>
          <td style={{ border:B, padding:'5px 10px', width:'20%' }}>
            <div style={{ fontSize:9, color:'#666' }}>SO Ref</div>
            <div style={{ fontSize:11 }}>{inv.soRef || '—'}</div>
          </td>
          <td style={{ border:B, padding:'5px 10px', width:'15%' }}>
            <div style={{ fontSize:9, color:'#666' }}>Place of Supply</div>
            <div style={{ fontSize:11 }}>{inv.customerState || co.state}</div>
          </td>
        </tr></tbody>
      </table>

      {/* ── BILL TO / SHIP TO ── */}
      <table style={{ marginTop:-1 }}>
        <tbody><tr>
          <td style={{ border:B, padding:'7px 10px', width:'50%', verticalAlign:'top' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#714B67', background:'#F0EBF0', padding:'2px 6px', marginBottom:5, marginLeft:-4, marginRight:-4, marginTop:-4 }}>BILL TO</div>
            <div style={{ fontSize:12, fontWeight:700 }}>{inv.customerName}</div>
            <div style={{ fontSize:10, marginTop:3, lineHeight:1.5 }}>{inv.billToAddress || '—'}</div>
            <div style={{ fontSize:10, marginTop:3 }}>
              <strong>GSTIN:</strong> {inv.customerGstin || 'URP (Unregistered)'}
            </div>
          </td>
          <td style={{ border:B, padding:'7px 10px', width:'50%', verticalAlign:'top', borderLeft:'none' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#714B67', background:'#F0EBF0', padding:'2px 6px', marginBottom:5, marginLeft:-4, marginRight:-4, marginTop:-4 }}>SHIP TO</div>
            <div style={{ fontSize:12, fontWeight:700 }}>{inv.customerName}</div>
            <div style={{ fontSize:10, marginTop:3, lineHeight:1.5 }}>{inv.shipToAddress || inv.billToAddress || '—'}</div>
            {inv.dcRef && <div style={{ fontSize:10, marginTop:3 }}><strong>DC Ref:</strong> {inv.dcRef}</div>}
          </td>
        </tr></tbody>
      </table>

      {/* ── LINE ITEMS ── */}
      <table style={{ marginTop:-1 }}>
        <thead>
          <tr>
            <th style={{ ...th, width:22 }}>#</th>
            <th style={th}>Description of Goods / Services</th>
            <th style={{ ...th, width:50 }}>HSN / SAC</th>
            <th style={{ ...th, width:38 }}>Qty</th>
            <th style={{ ...th, width:30 }}>UOM</th>
            <th style={{ ...th, width:65 }}>Rate (₹)</th>
            <th style={{ ...th, width:70 }}>Taxable (₹)</th>
            {isIGST
              ? <th style={{ ...th, width:65 }}>IGST<br/>Rate | Amt</th>
              : <><th style={{ ...th, width:60 }}>CGST<br/>Rate | Amt</th><th style={{ ...th, width:60 }}>SGST<br/>Rate | Amt</th></>
            }
            <th style={{ ...th, width:75 }}>Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr><td colSpan={isIGST?9:10} style={{ ...td('center'), color:'#888', padding:16 }}>No line items</td></tr>
          ) : lines.map((l, i) => {
            const qty   = parseFloat(l.qty || l.quantity || 0)
            const rate  = parseFloat(l.rate || l.unitPrice || l.price || 0)
            const txbl  = parseFloat(l.taxableAmt || l.amount || l.totalAmt || (qty * rate) || 0)
            const gRate = parseFloat(l.gstRate || l.taxRate || 18)
            const cAmt  = parseFloat(l.cgst || (txbl * gRate / 200))
            const sAmt  = parseFloat(l.sgst || (txbl * gRate / 200))
            const iAmt  = parseFloat(l.igst || (txbl * gRate / 100))
            const tot   = parseFloat(l.lineTotal || l.totalAmt || (txbl + (isIGST ? iAmt : cAmt + sAmt)))
            return (
              <tr key={i} style={{ background: i%2===0 ? '#fff' : '#faf8fb' }}>
                <td style={td('center')}>{i+1}</td>
                <td style={td()}>
                  <div style={{ fontWeight:600 }}>{l.itemName || l.description || '—'}</div>
                  {l.itemCode && <div style={{ fontSize:8, color:'#888' }}>{l.itemCode}</div>}
                </td>
                <td style={td('center')}>{l.hsnCode || l.hsn || '—'}</td>
                <td style={td('right')}>{qty}</td>
                <td style={td('center')}>{l.uom || l.unit || 'Nos'}</td>
                <td style={td('right')}>{rate > 0 ? fmtC(rate) : '—'}</td>
                <td style={td('right')}>{fmtC(txbl)}</td>
                {isIGST
                  ? <td style={td('center')}>{gRate}%<br/><strong>{fmtC(iAmt)}</strong></td>
                  : <><td style={td('center')}>{gRate/2}%<br/><strong>{fmtC(cAmt)}</strong></td>
                     <td style={td('center')}>{gRate/2}%<br/><strong>{fmtC(sAmt)}</strong></td></>
                }
                <td style={{ ...td('right'), fontWeight:700 }}>{fmtC(tot)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* ── TOTALS + WORDS ── */}
      <table style={{ marginTop:-1 }}>
        <tbody><tr>
          <td style={{ border:B, padding:'7px 10px', width:'55%', verticalAlign:'top' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#666', marginBottom:3 }}>AMOUNT IN WORDS</div>
            <div style={{ fontSize:11, fontStyle:'italic', fontWeight:600 }}>{amtWords}</div>
            {inv.notes && <div style={{ fontSize:10, marginTop:8, color:'#555' }}><strong>Note:</strong> {inv.notes}</div>}
          </td>
          <td style={{ border:B, padding:0, verticalAlign:'top' }}>
            <table>
              <tbody>
                {[
                  ['Taxable Amount', fmtC(taxable)],
                  ...(isIGST ? [['IGST', fmtC(igst)]] : [['CGST', fmtC(cgst)], ['SGST', fmtC(sgst)]]),
                  ['Round Off', '₹0.00'],
                ].map(([k,v]) => (
                  <tr key={k}>
                    <td style={{ fontSize:10, padding:'3px 10px', borderBottom:'1px solid #eee' }}>{k}</td>
                    <td style={{ fontSize:10, padding:'3px 10px', textAlign:'right', borderBottom:'1px solid #eee' }}>{v}</td>
                  </tr>
                ))}
                <tr style={{ background:'#714B67', color:'#fff' }}>
                  <td style={{ fontSize:13, fontWeight:800, padding:'6px 10px' }}>GRAND TOTAL</td>
                  <td style={{ fontSize:13, fontWeight:800, padding:'6px 10px', textAlign:'right' }}>{fmtC(grand)}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr></tbody>
      </table>

      {/* ── IRN + QR ── */}
      <table style={{ marginTop:-1 }}>
        <tbody><tr>
          <td style={{ border:B, padding:'7px 10px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#155724', marginBottom:4 }}>🏛️ e-INVOICE DETAILS</div>
                <table><tbody>
                  {[
                    ['IRN',      inv.irn],
                    ['Ack No.',  inv.ackNo || '—'],
                    ['Ack Date', inv.ackDate ? new Date(inv.ackDate).toLocaleString('en-IN') : '—'],
                  ].map(([k,v]) => (
                    <tr key={k}>
                      <td style={{ fontSize:9, color:'#666', width:60, paddingBottom:2, paddingRight:8, verticalAlign:'top' }}>{k}</td>
                      <td style={{ fontSize: k==='IRN' ? 9 : 10, fontFamily: k==='IRN'||k==='Ack No.'?'monospace':'inherit', fontWeight: k==='IRN'?700:400, color: k==='IRN'?'#155724':'#333', wordBreak:'break-all' }}>{v}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
              {inv.qrCode && (
                <div style={{ textAlign:'center', flexShrink:0 }}>
                  <img src={inv.qrCode} alt="QR" style={{ width:88, height:88, border:'1px solid #ddd' }} />
                  <div style={{ fontSize:8, color:'#888', marginTop:2 }}>Scan to verify on GST Portal</div>
                </div>
              )}
            </div>
          </td>
        </tr></tbody>
      </table>

      {/* ── BANK + SIGNATURE ── */}
      <table style={{ marginTop:-1 }}>
        <tbody><tr>
          <td style={{ border:B, padding:'7px 10px', width:'55%', verticalAlign:'top' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#714B67', marginBottom:5 }}>BANK DETAILS</div>
            <table><tbody>
              {[
                ['Bank Name',   co.bankName  || '—'],
                ['Branch',      co.bankBranch|| '—'],
                ['Account No.', co.accountNo || '—'],
                ['IFSC Code',   co.ifsc      || '—'],
              ].map(([k,v]) => (
                <tr key={k}>
                  <td style={{ fontSize:10, color:'#666', width:90, paddingBottom:2 }}>{k}</td>
                  <td style={{ fontSize:10, fontWeight:600 }}>{v}</td>
                </tr>
              ))}
            </tbody></table>
          </td>
          <td style={{ border:B, padding:'7px 10px', textAlign:'center', verticalAlign:'top', borderLeft:'none' }}>
            <div style={{ fontSize:10, fontWeight:700, marginBottom:40 }}>For {co.name}</div>
            <div style={{ borderTop:B, paddingTop:4, fontSize:10 }}>Authorised Signatory</div>
            <div style={{ fontSize:9, color:'#888', marginTop:2 }}>This is a computer generated invoice</div>
          </td>
        </tr></tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop:4, fontSize:8, color:'#aaa', textAlign:'center', borderTop:'1px solid #eee', paddingTop:3 }}>
        Generated by LNV ERP &nbsp;|&nbsp; {co.name} &nbsp;|&nbsp; GSTIN: {co.gstin}
      </div>

    </div>
  </>)
}
