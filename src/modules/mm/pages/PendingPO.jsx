import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN')

export default function PendingPO() {
  const nav = useNavigate()
  const [pos,     setPOs]    = useState([])
  const [loading, setLoading]= useState(true)
  const [search,  setSearch] = useState('')

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(
        `${BASE_URL}/mm/po?status=APPROVED,SENT,PARTIAL_GRN`,
        { headers:{ Authorization:`Bearer ${getToken()}` }})
      const data = await res.json()
      setPOs(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  },[])

  useEffect(()=>{ fetchPending() },[])

  // Calculate overdue days
  const getOverdue = (po) => {
    if (!po.deliveryDate) return { label:'No date set', color:'#6C757D', overdue:false }
    const due  = new Date(po.deliveryDate)
    const today= new Date()
    const diff = Math.floor((today-due)/(1000*60*60*24))
    if (diff <= 0) {
      const remaining = Math.abs(diff)
      if (remaining === 0) return { label:'Due Today!', color:'#856404', overdue:false }
      return { label:`${remaining} day(s) left`, color:'#155724', overdue:false }
    }
    return { label:`${diff} day(s) overdue`, color:'#DC3545', overdue:true }
  }

  const filtered = pos.filter(p =>
    !search ||
    p.poNo?.toLowerCase().includes(search.toLowerCase()) ||
    p.vendorName?.toLowerCase().includes(search.toLowerCase())
  )

  const overdueCnt  = pos.filter(p=>getOverdue(p).overdue).length
  const dueTodayCnt = pos.filter(p=>getOverdue(p).label==='Due Today!').length
  const partialCnt  = pos.filter(p=>p.status==='PARTIAL_GRN').length

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          Pending GRN — Purchase Orders
          <small>Awaiting Receipt</small>
        </div>
        <div className="lv-acts">
          <input placeholder="Search PO, Vendor..."
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ padding:'6px 12px', border:'1px solid #E0D5E0',
              borderRadius:5, fontSize:12, width:180 }} />
          <button className="btn btn-s sd-bsm"
            onClick={fetchPending}>↻ Refresh</button>
        </div>
      </div>

      {/* Alert */}
      {overdueCnt > 0 && (
        <div className="mm-alert warn">
          ⚠️ <strong>{overdueCnt} Purchase Order(s)</strong> are
          overdue! Follow up with vendors immediately.
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          { l:'Total Pending', v:pos.length,
            c:'#714B67', bg:'#EDE0EA' },
          { l:'Overdue',       v:overdueCnt,
            c:'#DC3545', bg:'#F8D7DA' },
          { l:'Due Today',     v:dueTodayCnt,
            c:'#856404', bg:'#FFF3CD' },
          { l:'Partial GRN',  v:partialCnt,
            c:'#0C5460', bg:'#D1ECF1' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg,
            borderRadius:8, padding:'10px 14px',
            border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c,
              fontWeight:700, textTransform:'uppercase' }}>
              {k.l}
            </div>
            <div style={{ fontSize:24, fontWeight:800,
              color:k.c, fontFamily:'Syne,sans-serif' }}>
              {k.v}
            </div>
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
          <div style={{ fontSize:32, marginBottom:12 }}>🎉</div>
          <div style={{ fontWeight:700 }}>
            No pending POs!
          </div>
          <div style={{ fontSize:12, color:'#aaa', marginTop:4 }}>
            All purchase orders have been received.
          </div>
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0',
          borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%',
            borderCollapse:'collapse', fontSize:12 }}>
            <thead style={{ background:'#F8F4F8',
              position:'sticky', top:0 }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['PO No.','Vendor','Category',
                  'Order Date','Expected Delivery',
                  'Status','Overdue','Amount',
                  'Actions'].map(h=>(
                  <th key={h} style={{ padding:'9px 12px',
                    fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left',
                    textTransform:'uppercase',
                    letterSpacing:.3,
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a,b)=>{
                  // Sort overdue first
                  const aD=getOverdue(a), bD=getOverdue(b)
                  if (aD.overdue && !bD.overdue) return -1
                  if (!aD.overdue && bD.overdue) return 1
                  return 0
                })
                .map((p,i)=>{
                  const od = getOverdue(p)
                  return (
                    <tr key={p.id}
                      style={{ borderBottom:'1px solid #F0EEF0',
                        background: od.overdue
                          ? '#FFF5F5'
                          : i%2===0?'#fff':'#FDFBFD',
                        cursor:'pointer' }}
                      onClick={()=>nav(`/mm/po/${p.id}`)}>
                      <td style={{ padding:'9px 12px' }}>
                        <strong style={{ color:'#714B67',
                          fontFamily:'DM Mono,monospace',
                          fontSize:12 }}>
                          {p.poNo}
                        </strong>
                      </td>
                      <td style={{ padding:'9px 12px',
                        fontWeight:600 }}>
                        {p.vendorName}
                      </td>
                      <td style={{ padding:'9px 12px',
                        fontSize:11, color:'#6C757D' }}>
                        {p.purchaseCategory||'—'}
                      </td>
                      <td style={{ padding:'9px 12px',
                        fontSize:11, color:'#6C757D' }}>
                        {new Date(p.poDate)
                          .toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding:'9px 12px',
                        fontSize:11,
                        color: od.overdue?'#DC3545':'#6C757D',
                        fontWeight: od.overdue?700:400 }}>
                        {p.deliveryDate
                          ? new Date(p.deliveryDate)
                              .toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ padding:'2px 8px',
                          borderRadius:10, fontSize:11,
                          fontWeight:700,
                          background:
                            p.status==='PARTIAL_GRN'
                              ?'#D1ECF1':'#FFF3CD',
                          color:
                            p.status==='PARTIAL_GRN'
                              ?'#0C5460':'#856404' }}>
                          {p.status==='PARTIAL_GRN'
                            ?'Partial GRN':'Pending GRN'}
                        </span>
                      </td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ fontWeight:700,
                          color:od.color, fontSize:12 }}>
                          {od.overdue ? '🔴' :
                           od.label==='Due Today!'?'🟡':'🟢'
                          } {od.label}
                        </span>
                      </td>
                      <td style={{ padding:'9px 12px',
                        fontWeight:800,
                        fontFamily:'DM Mono,monospace' }}>
                        {fmtC(p.totalAmount)}
                      </td>
                      <td style={{ padding:'9px 12px' }}
                        onClick={e=>e.stopPropagation()}>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="btn-xs suc"
                            onClick={()=>nav(
                              `/wm/grn/new?po=${p.id}`)}>
                            📦 GRN
                          </button>
                          <button className="btn-xs"
                            style={{ color:'#0C5460' }}
                            onClick={()=>nav(`/mm/po/${p.id}`)}>
                            📞 Follow Up
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
