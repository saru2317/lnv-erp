import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:0 })

const BUCKET_CFG = {
  current: { label:'Current (not yet due)', color:'#155724', bg:'#D4EDDA' },
  '1_30':  { label:'1–30 Days Due',         color:'#856404', bg:'#FFF3CD' },
  '31_60': { label:'31–60 Days Due',        color:'#E06F39', bg:'#FDECEA' },
  '61_90': { label:'61–90 Days Due',        color:'#721C24', bg:'#F8D7DA' },
  over_90: { label:'>90 Days Due',          color:'#491010', bg:'#EDACAC' },
}

export default function APAging() {
  const nav = useNavigate()
  const [rows,    setRows]    = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [bucket,  setBucket]  = useState('all')
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/ap-aging`, { headers: hdr2() })
      const d = await r.json()
      setRows(d.data    || [])
      setSummary(d.summary || {})
    } catch { toast.error('Failed to load AP Aging') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(r => {
    const ms = search.toLowerCase()
    const matchSearch = !ms || r.vendorName?.toLowerCase().includes(ms) || r.grnNo?.toLowerCase().includes(ms)
    const matchBucket = bucket === 'all' || r.bucket === bucket
    return matchSearch && matchBucket
  })

  const totalAP    = summary.total || 0
  const overdueTot = (summary.d1_30||0)+(summary.d31_60||0)+(summary.d61_90||0)+(summary.over90||0)

  // Group by vendor for payable summary
  const byVendor = filtered.reduce((acc,r) => {
    if (!acc[r.vendorName]) acc[r.vendorName] = { name:r.vendorName, grns:[], total:0 }
    acc[r.vendorName].grns.push(r)
    acc[r.vendorName].total += r.balance
    return acc
  }, {})

  const topVendors = Object.values(byVendor).sort((a,b)=>b.total-a.total).slice(0,5)

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">AP Aging
          <small> Accounts Payable — Vendor Payment Due Analysis</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/fi/payments')}>Make Payment</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/fi/pdc')}>PDC Register</button>
        </div>
      </div>

      {/* KPI Buckets */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:14}}>
        {Object.entries(BUCKET_CFG).map(([key,bc])=>{
          const amt = key==='current'?summary.current:key==='1_30'?summary.d1_30:key==='31_60'?summary.d31_60:key==='61_90'?summary.d61_90:summary.over90
          return (
            <div key={key} onClick={()=>setBucket(bucket===key?'all':key)}
              style={{background:bucket===key?bc.bg:'#fff',
                border:`2px solid ${bucket===key?bc.color:'#E0D5E0'}`,
                borderRadius:10,padding:'12px 14px',cursor:'pointer',transition:'all .15s'}}>
              <div style={{fontSize:10,fontWeight:700,color:bc.color,marginBottom:4,textTransform:'uppercase'}}>{bc.label}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:17,color:bc.color}}>{INR(amt||0)}</div>
              <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>
                {rows.filter(r=>r.bucket===key).length} bills
              </div>
            </div>
          )
        })}
      </div>

      {/* AP bar + top vendors */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:14}}>
        {/* Stacked bar */}
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:'12px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:12}}>
            <span style={{fontWeight:700,color:'#714B67'}}>Total AP: {INR(totalAP)}</span>
            <span style={{color: overdueTot>0?'#DC3545':'#155724',fontWeight:700}}>
              Overdue: {INR(overdueTot)}
            </span>
          </div>
          {totalAP > 0 && (
            <div style={{display:'flex',height:10,borderRadius:4,overflow:'hidden',gap:1}}>
              {Object.entries(BUCKET_CFG).map(([key,bc])=>{
                const amt = key==='current'?summary.current:key==='1_30'?summary.d1_30:key==='31_60'?summary.d31_60:key==='61_90'?summary.d61_90:summary.over90
                const pct = (amt||0)/totalAP*100
                return pct>0?<div key={key} style={{width:`${pct}%`,background:bc.color,
                  borderRadius:key==='current'?'4px 0 0 4px':key==='over_90'?'0 4px 4px 0':'0'}}/>:null
              })}
            </div>
          )}
          <div style={{marginTop:8,fontSize:11,color:'#6C757D'}}>
            {summary.count||0} outstanding bills · Cash required this week for past-due amounts
          </div>
        </div>

        {/* Top vendors */}
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:'12px 16px'}}>
          <div style={{fontWeight:700,fontSize:11,color:'#714B67',marginBottom:8,textTransform:'uppercase'}}>Top 5 Payables</div>
          {topVendors.map((v,i)=>(
            <div key={v.name} style={{display:'flex',justifyContent:'space-between',
              padding:'4px 0',borderBottom:'1px solid #F0EEEB',fontSize:11}}>
              <span style={{color:'#333',fontWeight:i===0?700:400,
                maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {v.name}
              </span>
              <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>
                {INR(v.total)}
              </span>
            </div>
          ))}
          {topVendors.length === 0 && <div style={{fontSize:11,color:'#6C757D'}}>No data</div>}
        </div>
      </div>

      {/* Search */}
      <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
        <input className="sd-search" placeholder="Search vendor / GRN..."
          value={search} onChange={e=>setSearch(e.target.value)} style={{width:240}}/>
        {bucket !== 'all' && (
          <button className="btn-xs" onClick={()=>setBucket('all')}
            style={{background:'#EDE0EA',color:'#714B67',border:'1px solid #714B67'}}>
            Clear ×
          </button>
        )}
        <span style={{marginLeft:'auto',fontSize:12,color:'#6C757D'}}>
          {filtered.length} bills
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading AP Aging...</div>
      ) : filtered.length === 0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          <div style={{fontSize:28,marginBottom:8}}>✅</div>
          <div style={{fontWeight:700,fontSize:15}}>
            {rows.length === 0 ? 'No outstanding payables!' : 'No bills match this filter'}
          </div>
        </div>
      ) : (
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>GRN / Bill No.</th>
              <th>Vendor</th>
              <th>Bill Date</th>
              <th>Due Date</th>
              <th style={{textAlign:'right'}}>Bill Amt</th>
              <th style={{textAlign:'right'}}>Paid</th>
              <th style={{textAlign:'right'}}>Balance</th>
              <th style={{textAlign:'center'}}>Days Due</th>
              <th style={{textAlign:'center'}}>Bucket</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r,i)=>{
              const bc = BUCKET_CFG[r.bucket]||BUCKET_CFG.current
              const isOverdue = r.agingDays > 0
              return (
                <tr key={i}>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>
                    {r.grnNo}
                  </td>
                  <td style={{fontWeight:600,fontSize:12}}>{r.vendorName}</td>
                  <td style={{fontSize:11}}>
                    {r.grnDate ? new Date(r.grnDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : '—'}
                  </td>
                  <td style={{fontSize:11,color:isOverdue?'#DC3545':'#333',fontWeight:isOverdue?700:400}}>
                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : 'Not set'}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12}}>{INR(r.totalAmt)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,color:'#155724'}}>
                    {r.paidAmt > 0 ? INR(r.paidAmt) : '—'}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:13,color:bc.color}}>
                    {INR(r.balance)}
                  </td>
                  <td style={{textAlign:'center'}}>
                    {r.agingDays > 0 ? (
                      <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,
                        color:r.agingDays>60?'#DC3545':r.agingDays>30?'#856404':'#E06F39'}}>
                        {r.agingDays}d
                      </span>
                    ) : (
                      <span style={{color:'#155724',fontSize:12}}>Not due</span>
                    )}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:bc.bg,color:bc.color,padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                      {r.bucket==='current'?'Current':r.bucket==='1_30'?'1–30d':r.bucket==='31_60'?'31–60d':r.bucket==='61_90'?'61–90d':'>90d'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-xs" onClick={()=>nav('/fi/payments')}>Pay</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #714B67'}}>
              <td colSpan={4} style={{padding:'10px 12px',color:'#714B67'}}>
                TOTAL — {filtered.length} bills
              </td>
              <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>
                {INR(filtered.reduce((a,r)=>a+r.totalAmt,0))}
              </td>
              <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#155724'}}>
                {INR(filtered.reduce((a,r)=>a+r.paidAmt,0))}
              </td>
              <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:15,fontWeight:800,color:'#714B67'}}>
                {INR(filtered.reduce((a,r)=>a+r.balance,0))}
              </td>
              <td colSpan={3}/>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  )
}
