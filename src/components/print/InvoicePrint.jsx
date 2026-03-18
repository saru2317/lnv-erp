/**
 * InvoicePrint — GST Tax Invoice (A4)
 * Matches InvoiceNew.jsx data structure
 */
import React from 'react'
import PrintWrapper from './PrintWrapper'

const COMPANY = {
  name:   'LNV Manufacturing Pvt. Ltd.',
  gstin:  '33AABCL1234F1Z5',
  pan:    'AABCL1234F',
  addr:   'Plot No. 42, SIDCO Industrial Estate, Ranipet — 632401, Tamil Nadu',
  phone:  '+91 99440 01234',
  email:  'accounts@lnvmfg.com',
  cin:    'U28910TN2018PTC123456',
  state:  'Tamil Nadu',
  stCode: '33',
}

// Sample data — in real use, pass as props
const SAMPLE_INVOICE = {
  invNo:    'INV-2026-0125',
  date:     '17 Mar 2026',
  due:      '16 Apr 2026',
  soRef:    'SO-2026-0124',
  ewb:      'EWB-2026-00441',
  irn:      'a5c6e7f...IRN',
  supplyState: 'Tamil Nadu (33)',
  customer: {
    name:   'Sri Lakshmi Mills Pvt Ltd',
    gstin:  '33AAACS1234P1Z5',
    addr:   '14, Industrial Area, Tirupur — 641604, Tamil Nadu',
    state:  'Tamil Nadu',
    stCode: '33',
  },
  lines: [
    { sl:1, hsn:'8448 59 90', desc:'ARISER COMFACT SYSTEM',  unit:'Nos', qty:100, rate:1200, disc:0, gstPct:18, taxable:120000, cgst:10800, sgst:10800, igst:0, total:141600 },
    { sl:2, hsn:'8448 49 00', desc:'COMPACT SPARES — SET',   unit:'Set', qty:50,  rate:2100, disc:5, gstPct:12, taxable:99750,  cgst:5985,  sgst:5985,  igst:0, total:111720 },
    { sl:3, hsn:'8448 49 10', desc:'LATTICE APRONS C121',    unit:'Nos', qty:200, rate:450,  disc:0, gstPct:18, taxable:90000,  cgst:8100,  sgst:8100,  igst:0, total:106200 },
  ],
  bank: { name:'State Bank of India', acNo:'12345678901', ifsc:'SBIN0001234', branch:'Ranipet Branch' },
  terms: 'Net 30 days. Goods once sold will not be taken back.',
}

const fmt = n => n?.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
const toWords = n => {
  if (!n) return 'Zero'
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  if (n < 20) return ones[n]
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '')
  if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + toWords(n%100) : '')
  if (n < 100000) return toWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + toWords(n%1000) : '')
  if (n < 10000000) return toWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + toWords(n%100000) : '')
  return toWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + toWords(n%10000000) : '')
}

const th = { padding:'6px 8px', border:'1px solid #ccc', background:'#3D2B3D',
  color:'#fff', fontSize:10, fontWeight:700, textAlign:'center' }
const td = (align='center') => ({ padding:'5px 8px', border:'1px solid #ddd', fontSize:10, textAlign:align, verticalAlign:'middle' })

export default function InvoicePrint({ invoice, onClose }) {
  const inv = invoice || SAMPLE_INVOICE
  const totals = inv.lines.reduce((a,l) => ({
    taxable: a.taxable + l.taxable,
    cgst:    a.cgst    + l.cgst,
    sgst:    a.sgst    + l.sgst,
    igst:    a.igst    + l.igst,
    total:   a.total   + l.total,
  }), { taxable:0, cgst:0, sgst:0, igst:0, total:0 })

  const inWords = toWords(Math.round(totals.total)) + ' Rupees Only'

  return (
    <PrintWrapper title={`Tax Invoice — ${inv.invNo}`} onClose={onClose}>
      <div className="print-page">

        {/* ── HEADER ── */}
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'stretch', marginBottom:12,
          borderBottom:'3px solid #714B67', paddingBottom:12 }}>
          {/* Company */}
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:22,
              fontWeight:900, color:'#714B67', letterSpacing:-1 }}>
              {COMPANY.name}
            </div>
            <div style={{ fontSize:9.5, color:'#555', marginTop:3, lineHeight:1.6 }}>
              {COMPANY.addr}<br/>
              Ph: {COMPANY.phone} · {COMPANY.email}<br/>
              GSTIN: <strong>{COMPANY.gstin}</strong> &nbsp;|&nbsp;
              PAN: <strong>{COMPANY.pan}</strong> &nbsp;|&nbsp;
              CIN: {COMPANY.cin}
            </div>
          </div>
          {/* Invoice title box */}
          <div style={{ textAlign:'right', minWidth:160 }}>
            <div style={{ background:'#714B67', color:'#fff', padding:'6px 16px',
              borderRadius:'6px 6px 0 0', fontFamily:'Syne,sans-serif',
              fontSize:16, fontWeight:800, letterSpacing:1 }}>
              TAX INVOICE
            </div>
            <div style={{ border:'1px solid #714B67', borderTop:'none',
              padding:'8px 12px', borderRadius:'0 0 6px 6px', lineHeight:1.7 }}>
              <div><span style={{ color:'#555', fontSize:9 }}>Invoice No. </span>
                <strong style={{ fontSize:12, fontFamily:'DM Mono,monospace',
                  color:'#714B67' }}>{inv.invNo}</strong></div>
              <div><span style={{ color:'#555', fontSize:9 }}>Date: </span>
                <strong>{inv.date}</strong></div>
              <div><span style={{ color:'#555', fontSize:9 }}>Due Date: </span>
                <strong>{inv.due}</strong></div>
              {inv.soRef && <div><span style={{ color:'#555', fontSize:9 }}>SO Ref: </span>
                <strong style={{ fontFamily:'DM Mono,monospace' }}>{inv.soRef}</strong></div>}
            </div>
          </div>
        </div>

        {/* ── BILL TO / SHIP TO ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
          gap:8, marginBottom:12 }}>
          <div style={{ border:'1px solid #ddd', borderRadius:4, padding:'8px 10px' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#714B67',
              textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>Bill To</div>
            <div style={{ fontWeight:700, fontSize:11 }}>{inv.customer.name}</div>
            <div style={{ fontSize:9.5, color:'#555', lineHeight:1.6, marginTop:2 }}>
              {inv.customer.addr}<br/>
              State: {inv.customer.state} ({inv.customer.stCode})<br/>
              GSTIN: <strong>{inv.customer.gstin}</strong>
            </div>
          </div>
          <div style={{ border:'1px solid #ddd', borderRadius:4, padding:'8px 10px' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#714B67',
              textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>Ship To</div>
            <div style={{ fontWeight:700, fontSize:11 }}>{inv.customer.name}</div>
            <div style={{ fontSize:9.5, color:'#555', lineHeight:1.6, marginTop:2 }}>
              {inv.customer.addr}<br/>
              State: {inv.customer.state} ({inv.customer.stCode})
            </div>
          </div>
          <div style={{ border:'1px solid #ddd', borderRadius:4, padding:'8px 10px' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#714B67',
              textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>Document Info</div>
            <table style={{ width:'100%', fontSize:9.5, borderCollapse:'collapse' }}>
              {[
                ['Place of Supply', inv.supplyState],
                ['E-Way Bill', inv.ewb || '—'],
                ['IRN', inv.irn ? inv.irn.slice(0,16)+'…' : '—'],
                ['Reverse Charge', 'No'],
              ].map(([k,v]) => (
                <tr key={k}>
                  <td style={{ color:'#555', paddingBottom:3, paddingRight:6 }}>{k}</td>
                  <td style={{ fontWeight:600, fontFamily:'DM Mono,monospace',
                    fontSize:9 }}>{v}</td>
                </tr>
              ))}
            </table>
          </div>
        </div>

        {/* ── LINE ITEMS ── */}
        <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:0 }}>
          <thead>
            <tr>
              {['#','HSN/SAC','Description','Unit','Qty','Rate (₹)','Disc%','Taxable (₹)','CGST','SGST','IGST','Total (₹)'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l,i) => (
              <tr key={i} style={{ background: i%2===0 ? '#fff' : '#FAFAFA' }}>
                <td style={td()}>{l.sl}</td>
                <td style={{...td(), fontFamily:'DM Mono,monospace', fontSize:9}}>{l.hsn}</td>
                <td style={{...td('left'), fontWeight:600}}>{l.desc}</td>
                <td style={td()}>{l.unit}</td>
                <td style={{...td(), fontFamily:'DM Mono,monospace'}}>{l.qty}</td>
                <td style={{...td('right'), fontFamily:'DM Mono,monospace'}}>{fmt(l.rate)}</td>
                <td style={td()}>{l.disc > 0 ? l.disc+'%' : '—'}</td>
                <td style={{...td('right'), fontFamily:'DM Mono,monospace'}}>{fmt(l.taxable)}</td>
                <td style={{...td(), fontSize:9}}>
                  <div>{fmt(l.cgst)}</div>
                  <div style={{color:'#888',fontSize:8}}>{l.gstPct/2}%</div>
                </td>
                <td style={{...td(), fontSize:9}}>
                  <div>{fmt(l.sgst)}</div>
                  <div style={{color:'#888',fontSize:8}}>{l.gstPct/2}%</div>
                </td>
                <td style={td()}>{l.igst > 0 ? fmt(l.igst) : '—'}</td>
                <td style={{...td('right'), fontWeight:700, fontFamily:'DM Mono,monospace',
                  color:'#714B67'}}>{fmt(l.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background:'#F5F0F5' }}>
              <td colSpan={7} style={{...td('right'), fontWeight:700, fontSize:11}}>SUBTOTALS</td>
              <td style={{...td('right'), fontWeight:700, fontFamily:'DM Mono,monospace'}}>{fmt(totals.taxable)}</td>
              <td style={{...td('right'), fontWeight:700, fontFamily:'DM Mono,monospace'}}>{fmt(totals.cgst)}</td>
              <td style={{...td('right'), fontWeight:700, fontFamily:'DM Mono,monospace'}}>{fmt(totals.sgst)}</td>
              <td style={td()}>—</td>
              <td style={{...td('right'), fontWeight:800, fontFamily:'DM Mono,monospace',
                color:'#714B67', fontSize:12}}>{fmt(totals.total)}</td>
            </tr>
          </tfoot>
        </table>

        {/* ── TOTAL SUMMARY ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto',
          gap:12, marginTop:12, marginBottom:12 }}>
          {/* Amount in words */}
          <div style={{ border:'1px solid #ddd', borderRadius:4, padding:'8px 10px' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#714B67',
              textTransform:'uppercase', marginBottom:3 }}>Amount in Words</div>
            <div style={{ fontWeight:600, fontSize:10.5, textTransform:'capitalize' }}>
              {inWords}
            </div>
          </div>
          {/* Amount box */}
          <div style={{ border:'1px solid #714B67', borderRadius:4,
            overflow:'hidden', minWidth:200 }}>
            {[
              ['Taxable Amount', totals.taxable, false],
              ['CGST', totals.cgst, false],
              ['SGST', totals.sgst, false],
              ['IGST', totals.igst > 0 ? totals.igst : null, false],
              ['Round Off', 0, false],
            ].filter(([,v]) => v !== null).map(([label, val]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between',
                padding:'4px 10px', borderBottom:'1px solid #eee', fontSize:10 }}>
                <span style={{ color:'#555' }}>{label}</span>
                <span style={{ fontFamily:'DM Mono,monospace', fontWeight:600 }}>
                  {fmt(val)}
                </span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between',
              padding:'7px 10px', background:'#714B67', color:'#fff' }}>
              <span style={{ fontWeight:700, fontSize:12 }}>TOTAL</span>
              <span style={{ fontFamily:'DM Mono,monospace', fontWeight:800, fontSize:13 }}>
                ₹{fmt(totals.total)}
              </span>
            </div>
          </div>
        </div>

        {/* ── BANK + TERMS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
          gap:12, marginBottom:14 }}>
          <div style={{ border:'1px solid #ddd', borderRadius:4, padding:'8px 10px' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#714B67',
              textTransform:'uppercase', marginBottom:5 }}>Bank Details</div>
            <table style={{ fontSize:10, width:'100%', borderCollapse:'collapse' }}>
              {[
                ['Bank', inv.bank.name],
                ['A/C No.', inv.bank.acNo],
                ['IFSC', inv.bank.ifsc],
                ['Branch', inv.bank.branch],
              ].map(([k,v]) => (
                <tr key={k}>
                  <td style={{ color:'#555', paddingBottom:3, paddingRight:10 }}>{k}</td>
                  <td style={{ fontWeight:600, fontFamily:'DM Mono,monospace', fontSize:9.5 }}>{v}</td>
                </tr>
              ))}
            </table>
          </div>
          <div style={{ border:'1px solid #ddd', borderRadius:4, padding:'8px 10px' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#714B67',
              textTransform:'uppercase', marginBottom:5 }}>Terms & Conditions</div>
            <div style={{ fontSize:9.5, color:'#555', lineHeight:1.6 }}>
              {inv.terms}
            </div>
          </div>
        </div>

        {/* ── SIGNATURE ── */}
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'flex-end', borderTop:'1px solid #ddd', paddingTop:12 }}>
          <div style={{ fontSize:9, color:'#888' }}>
            This is a computer generated invoice and does not require physical signature.
          </div>
          <div style={{ textAlign:'center', minWidth:160 }}>
            <div style={{ height:40, borderBottom:'1px solid #333',
              marginBottom:4, width:140 }} />
            <div style={{ fontSize:9, fontWeight:700 }}>
              For {COMPANY.name}
            </div>
            <div style={{ fontSize:9, color:'#555' }}>Authorised Signatory</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:12, paddingTop:8,
          borderTop:'1px solid #eee', fontSize:8, color:'#aaa' }}>
          {COMPANY.name} · GSTIN: {COMPANY.gstin} · {COMPANY.addr}
        </div>

      </div>
    </PrintWrapper>
  )
}
