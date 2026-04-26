import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN',
  {minimumFractionDigits:2,maximumFractionDigits:2})

export default function PaymentList() {
  const nav = useNavigate()
  const [pays,    setPays]   = useState([])
  const [loading, setLoad]   = useState(true)
  const [search,  setSearch] = useState('')
  const [chip,    setChip]   = useState('all')

  const fetch_ = useCallback(async () => {
    setLoad(true)
    try {
      // Load all paid/partial invoices as payment register
      const res  = await fetch(`${BASE_URL}/mm/invoices`,
        { headers: authHdrs2() })
      const data = await res.json()
      // Filter only those with payment
      const withPay = (data.data||[]).filter(i=>
        parseFloat(i.paidAmount||0) > 0)
      setPays(withPay)
    } catch(e){ toast.error(e.message) }
    finally { setLoad(false) }
  },[])

  useEffect(()=>{ fetch_() },[])

  const filtered = pays.filter(p => {
    const matchChip = chip==='all' || p.paymentMode?.toLowerCase()===chip
    const matchSearch = !search ||
      p.invNo?.toLowerCase().includes(search.toLowerCase()) ||
      p.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      p.paymentRef?.toLowerCase().includes(search.toLowerCase())
    return matchChip && matchSearch
  })

  const totalPaid = pays.reduce((s,p)=>
    s+parseFloat(p.paidAmount||0), 0)

  return (
    <div>
      {/* Sticky Header */}
      <div style={{ position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8',
        borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Vendor Payments
            <small>Payment Register</small>
          </div>
          <div className="lv-acts">
            <input placeholder="Search vendor, ref, invoice..."
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{ padding:'6px 12px',
                border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12, width:200 }} />
            <button className="btn btn-s sd-bsm">Export</button>
            <button className="btn btn-p sd-bsm"
              onClick={()=>nav('/mm/ledger')}>
              💳 Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          { l:'Total Payments', v:pays.length,
            c:'#714B67', bg:'#EDE0EA' },
          { l:'Total Paid',     v:fmtC(totalPaid),
            c:'#155724', bg:'#D4EDDA' },
          { l:'NEFT / RTGS',
            v:pays.filter(p=>
              ['NEFT','RTGS','Bank Transfer'].includes(p.paymentMode)).length,
            c:'#0C5460', bg:'#D1ECF1' },
          { l:'Cheque / Others',
            v:pays.filter(p=>
              ['Cheque','Cash','UPI'].includes(p.paymentMode)).length,
            c:'#856404', bg:'#FFF3CD' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg,
            borderRadius:8, padding:'10px 14px',
            border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c,
              fontWeight:700, textTransform:'uppercase' }}>
              {k.l}
            </div>
            <div style={{ fontSize:k.l==='Total Paid'?15:22,
              fontWeight:800, color:k.c,
              fontFamily:'Syne,sans-serif', marginTop:2 }}>
              {k.v}
            </div>
          </div>
        ))}
      </div>

      {/* Mode chips */}
      <div className="mm-chips" style={{ marginBottom:12 }}>
        {[['all','All'],['neft','NEFT'],
          ['rtgs','RTGS'],['cheque','Cheque'],
          ['upi','UPI'],['cash','Cash']].map(([k,l])=>(
          <div key={k} className={`mm-chip${chip===k?' on':''}`}
            onClick={()=>setChip(k)}>
            {l}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center',
          color:'#6C757D' }}>⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center',
          color:'#6C757D', background:'#fff',
          borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32 }}>💳</div>
          <div style={{ fontWeight:700, marginTop:8 }}>
            No payments found
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
                {['Invoice No.','Date','Vendor',
                  'Inv. Ref','Paid Amt','Balance',
                  'Mode','Reference','Status'].map(h=>(
                  <th key={h} style={{ padding:'8px 12px',
                    fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left',
                    textTransform:'uppercase',
                    letterSpacing:.3,
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p,i)=>(
                <tr key={p.id} style={{
                  borderBottom:'1px solid #F0EEF0',
                  background:i%2===0?'#fff':'#FDFBFD' }}>
                  <td style={{ padding:'8px 12px' }}>
                    <strong style={{ color:'#714B67',
                      fontFamily:'DM Mono,monospace',
                      fontSize:12 }}>{p.invNo}</strong>
                  </td>
                  <td style={{ padding:'8px 12px',
                    fontSize:11, color:'#6C757D' }}>
                    {p.paymentDate
                      ?new Date(p.paymentDate)
                          .toLocaleDateString('en-IN')
                      :new Date(p.updatedAt||p.invDate)
                          .toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding:'8px 12px',
                    fontWeight:600 }}>{p.vendorName}</td>
                  <td style={{ padding:'8px 12px',
                    fontFamily:'DM Mono,monospace',
                    fontSize:11, color:'#714B67' }}>
                    {p.vendorInvNo||'—'}
                  </td>
                  <td style={{ padding:'8px 12px',
                    fontWeight:700, color:'#155724',
                    fontFamily:'DM Mono,monospace' }}>
                    {fmtC(p.paidAmount)}
                  </td>
                  <td style={{ padding:'8px 12px',
                    fontWeight:700, color:
                      parseFloat(p.balance||0)>0
                        ?'#DC3545':'#155724',
                    fontFamily:'DM Mono,monospace' }}>
                    {fmtC(p.balance)}
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ padding:'2px 8px',
                      borderRadius:8, fontSize:10,
                      fontWeight:700,
                      background:'#D1ECF1',
                      color:'#0C5460' }}>
                      {p.paymentMode||'—'}
                    </span>
                  </td>
                  <td style={{ padding:'8px 12px',
                    fontFamily:'DM Mono,monospace',
                    fontSize:11, color:'#6C757D' }}>
                    {p.paymentRef||'—'}
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ padding:'2px 8px',
                      borderRadius:10, fontSize:10,
                      fontWeight:700,
                      background:p.status==='PAID'
                        ?'#D4EDDA':'#FFF3CD',
                      color:p.status==='PAID'
                        ?'#155724':'#856404' }}>
                      {p.status==='PAID'?'Cleared':'Partial'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ background:'#F8F4F8',
              borderTop:'2px solid #714B67' }}>
              <tr>
                <td colSpan={4} style={{ padding:'10px 12px',
                  fontWeight:800, color:'#714B67',
                  fontFamily:'Syne,sans-serif' }}>
                  Total
                </td>
                <td style={{ padding:'10px 12px',
                  fontWeight:800, color:'#155724',
                  fontFamily:'DM Mono,monospace',
                  fontSize:14 }}>
                  {fmtC(totalPaid)}
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
