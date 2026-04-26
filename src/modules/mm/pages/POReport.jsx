import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN',
  {minimumFractionDigits:0, maximumFractionDigits:0})
const fmtL = n => {
  const v = Number(n||0)
  return v>=100000 ? '₹'+( v/100000).toFixed(1)+'L'
    : v>=1000 ? '₹'+(v/1000).toFixed(1)+'K' : fmtC(v)
}

export default function POReport() {
  const [pos,     setPOs]    = useState([])
  const [invs,    setInvs]   = useState([])
  const [loading, setLoad]   = useState(true)
  const [year,    setYear]   = useState(new Date().getFullYear())
  const [month,   setMonth]  = useState(new Date().getMonth()+1)
  const [catFilter,setCat]   = useState('All')

  useEffect(()=>{
    setLoad(true)
    Promise.all([
      fetch(`${BASE_URL}/mm/po`,
        { headers:{ Authorization:`Bearer ${getToken()}` }})
        .then(r=>r.json()),
      fetch(`${BASE_URL}/mm/invoices`,
        { headers:{ Authorization:`Bearer ${getToken()}` }})
        .then(r=>r.json()),
    ]).then(([pd,id])=>{
      setPOs(pd.data||[])
      setInvs(id.data||[])
    }).catch(e=>toast.error(e.message))
    .finally(()=>setLoad(false))
  },[])

  // Filter POs by month/year/category
  const filteredPOs = pos.filter(p => {
    const d = new Date(p.poDate)
    const matchDate = d.getFullYear()===year && d.getMonth()+1===month
    const matchCat  = catFilter==='All' ||
      p.purchaseCategory===catFilter
    return matchDate && matchCat
  })

  // Group by vendor
  const vendorMap = {}
  filteredPOs.forEach(p => {
    if (!vendorMap[p.vendorName]) {
      vendorMap[p.vendorName] = {
        vendor:   p.vendorName,
        poCount:  0,
        poValue:  0,
        grnValue: 0,
        invValue: 0,
        paidAmt:  0,
        outstanding: 0
      }
    }
    const v = vendorMap[p.vendorName]
    v.poCount  += 1
    v.poValue  += parseFloat(p.totalAmount||0)
    v.grnValue += parseFloat(p.totalAmount||0) *
      (p.status==='GRN_DONE'?1:p.status==='PARTIAL_GRN'?0.5:0)
  })

  // Enrich with invoice data
  invs.forEach(inv => {
    const d = new Date(inv.invDate)
    if (d.getFullYear()!==year || d.getMonth()+1!==month) return
    if (vendorMap[inv.vendorName]) {
      vendorMap[inv.vendorName].invValue  += parseFloat(inv.totalAmount||0)
      vendorMap[inv.vendorName].paidAmt   += parseFloat(inv.paidAmount||0)
      vendorMap[inv.vendorName].outstanding += parseFloat(inv.balance||0)
    }
  })

  const rows = Object.values(vendorMap)
  const totals = rows.reduce((acc,r)=>({
    poCount:  acc.poCount  + r.poCount,
    poValue:  acc.poValue  + r.poValue,
    grnValue: acc.grnValue + r.grnValue,
    invValue: acc.invValue + r.invValue,
    paidAmt:  acc.paidAmt  + r.paidAmt,
    outstanding: acc.outstanding + r.outstanding,
  }),{ poCount:0, poValue:0, grnValue:0,
    invValue:0, paidAmt:0, outstanding:0 })

  const months = ['Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec']
  const categories = ['All','Raw Material',
    'Spares & Consumables','Packing Material',
    'Chemicals','Capital Goods','Services']

  return (
    <div>
      {/* Sticky Header */}
      <div style={{ position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8',
        borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Purchase Register
            <small>ME2N · Purchase Analytics</small>
          </div>
          <div className="lv-acts">
            <select value={month}
              onChange={e=>setMonth(parseInt(e.target.value))}
              style={{ padding:'6px 10px',
                border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12,
                cursor:'pointer' }}>
              {months.map((m,i)=>(
                <option key={m} value={i+1}>{m} {year}</option>
              ))}
            </select>
            <select value={catFilter}
              onChange={e=>setCat(e.target.value)}
              style={{ padding:'6px 10px',
                border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12,
                cursor:'pointer' }}>
              {categories.map(c=>(
                <option key={c}>{c}</option>
              ))}
            </select>
            <button className="btn btn-s sd-bsm">
              Export Excel
            </button>
            <button className="btn btn-s sd-bsm"
              onClick={()=>window.print()}>
              Print
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          { l:'Total POs',   v:totals.poCount,
            sub:months[month-1]+' '+year,
            c:'#714B67', bg:'#EDE0EA' },
          { l:'PO Value',    v:fmtL(totals.poValue),
            sub:'Gross purchase value',
            c:'#0C5460', bg:'#D1ECF1' },
          { l:'GRN Value',   v:fmtL(totals.grnValue),
            sub:totals.poValue>0
              ?Math.round(totals.grnValue/totals.poValue*100)+'% received'
              :'0% received',
            c:'#155724', bg:'#D4EDDA' },
          { l:'Outstanding', v:fmtL(totals.outstanding),
            sub:'Pending payment',
            c: totals.outstanding>0?'#DC3545':'#155724',
            bg:totals.outstanding>0?'#F8D7DA':'#D4EDDA' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg,
            borderRadius:8, padding:'12px 14px',
            border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c,
              fontWeight:700, textTransform:'uppercase' }}>
              {k.l}
            </div>
            <div style={{ fontSize:20, fontWeight:800,
              color:k.c, fontFamily:'Syne,sans-serif',
              marginTop:2 }}>{k.v}</div>
            <div style={{ fontSize:10, color:k.c,
              opacity:.7 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center',
          color:'#6C757D' }}>⏳ Generating report...</div>
      ) : rows.length===0 ? (
        <div style={{ padding:60, textAlign:'center',
          color:'#6C757D', background:'#fff',
          borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32 }}>📊</div>
          <div style={{ fontWeight:700, marginTop:8 }}>
            No data for {months[month-1]} {year}
          </div>
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0',
          borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%',
            borderCollapse:'collapse', fontSize:12 }}>
            <thead style={{ background:'#F8F4F8',
              position:'sticky', top:60 }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Vendor','POs','PO Value',
                  'GRN Value','Invoiced','Paid',
                  'Outstanding','On-time %'].map(h=>(
                  <th key={h} style={{ padding:'8px 12px',
                    fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:
                      h==='Vendor'||h==='POs'?'left':'right',
                    textTransform:'uppercase',
                    letterSpacing:.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>{
                const onTime = r.poCount>0
                  ? Math.round((r.poCount -
                    (r.outstanding>0?1:0))/r.poCount*100)
                  : 100
                return (
                  <tr key={r.vendor} style={{
                    borderBottom:'1px solid #F0EEF0',
                    background:i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'9px 12px',
                      fontWeight:700 }}>{r.vendor}</td>
                    <td style={{ padding:'9px 12px',
                      textAlign:'center', fontWeight:700,
                      color:'#714B67' }}>{r.poCount}</td>
                    <td style={{ padding:'9px 12px',
                      textAlign:'right',
                      fontFamily:'DM Mono,monospace' }}>
                      {fmtC(r.poValue)}
                    </td>
                    <td style={{ padding:'9px 12px',
                      textAlign:'right',
                      fontFamily:'DM Mono,monospace',
                      color:'#155724' }}>
                      {fmtC(r.grnValue)}
                    </td>
                    <td style={{ padding:'9px 12px',
                      textAlign:'right',
                      fontFamily:'DM Mono,monospace' }}>
                      {fmtC(r.invValue)}
                    </td>
                    <td style={{ padding:'9px 12px',
                      textAlign:'right',
                      fontFamily:'DM Mono,monospace',
                      color:'#155724', fontWeight:700 }}>
                      {fmtC(r.paidAmt)}
                    </td>
                    <td style={{ padding:'9px 12px',
                      textAlign:'right',
                      fontFamily:'DM Mono,monospace',
                      fontWeight:800,
                      color:r.outstanding>0
                        ?'#DC3545':'#155724' }}>
                      {fmtC(r.outstanding)}
                    </td>
                    <td style={{ padding:'9px 12px',
                      textAlign:'right', fontWeight:800,
                      color:onTime>=90?'#155724'
                        :onTime>=75?'#856404':'#DC3545' }}>
                      {onTime}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Total Row */}
            <tfoot style={{ background:'#F8F4F8',
              borderTop:'2px solid #714B67' }}>
              <tr>
                <td style={{ padding:'10px 12px',
                  fontWeight:800, color:'#714B67',
                  fontFamily:'Syne,sans-serif' }}>
                  TOTAL
                </td>
                <td style={{ padding:'10px 12px',
                  textAlign:'center', fontWeight:800 }}>
                  {totals.poCount}
                </td>
                {[totals.poValue, totals.grnValue,
                  totals.invValue, totals.paidAmt].map((v,i)=>(
                  <td key={i} style={{ padding:'10px 12px',
                    textAlign:'right', fontWeight:800,
                    fontFamily:'DM Mono,monospace' }}>
                    {fmtC(v)}
                  </td>
                ))}
                <td style={{ padding:'10px 12px',
                  textAlign:'right', fontWeight:800,
                  fontFamily:'DM Mono,monospace',
                  color:totals.outstanding>0
                    ?'#DC3545':'#155724' }}>
                  {fmtC(totals.outstanding)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
