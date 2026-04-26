import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:0 })

const BUCKET_CFG = {
  current: { label:'Current (not yet due)', color:'#155724', bg:'#D4EDDA', text:'On track' },
  '1_30':  { label:'1–30 Days Overdue',     color:'#856404', bg:'#FFF3CD', text:'Remind' },
  '31_60': { label:'31–60 Days Overdue',    color:'#E06F39', bg:'#FDECEA', text:'Follow up urgently' },
  '61_90': { label:'61–90 Days Overdue',    color:'#721C24', bg:'#F8D7DA', text:'Legal warning' },
  over_90: { label:'>90 Days Overdue',      color:'#491010', bg:'#EDACAC', text:'Bad debt risk' },
}

export default function ARaging() {
  const nav = useNavigate()
  const [rows,    setRows]    = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [bucket,  setBucket]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [selected,setSelected]= useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/ar-aging`, { headers: hdr2() })
      const d = await r.json()
      setRows(d.data    || [])
      setSummary(d.summary || {})
    } catch { toast.error('Failed to load AR Aging') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(r => {
    const ms = search.toLowerCase()
    const matchSearch = !ms || r.customerName?.toLowerCase().includes(ms) || r.invoiceNo?.toLowerCase().includes(ms)
    const matchBucket = bucket === 'all' || r.bucket === bucket
    return matchSearch && matchBucket
  })

  // Group by customer for summary view
  const byCustomer = filtered.reduce((acc, r) => {
    if (!acc[r.customerName]) acc[r.customerName] = { name:r.customerName, invoices:[], total:0 }
    acc[r.customerName].invoices.push(r)
    acc[r.customerName].total += r.balance
    return acc
  }, {})

  const totalOS    = summary.total  || 0
  const overdueTot = (summary.d1_30||0)+(summary.d31_60||0)+(summary.d61_90||0)+(summary.over90||0)

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">AR Aging
          <small> Accounts Receivable — Overdue Analysis</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/fi/receipts')}>Record Receipt</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/fi/credit-limit')}>Credit Dashboard</button>
        </div>
      </div>

      {/* KPI Buckets */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:14}}>
        {Object.entries(BUCKET_CFG).map(([key,bc]) => {
          const amt = key==='current'?summary.current:
                      key==='1_30'?summary.d1_30:
                      key==='31_60'?summary.d31_60:
                      key==='61_90'?summary.d61_90:summary.over90
          return (
            <div key={key} onClick={()=>setBucket(bucket===key?'all':key)}
              style={{background: bucket===key ? bc.bg : '#fff',
                border:`2px solid ${bucket===key ? bc.color : '#E0D5E0'}`,
                borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'all .15s'}}>
              <div style={{fontSize:10,fontWeight:700,color:bc.color,marginBottom:4,textTransform:'uppercase'}}>
                {bc.label}
              </div>
              <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:17,color:bc.color}}>
                {INR(amt||0)}
              </div>
              <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{bc.text}</div>
            </div>
          )
        })}
      </div>

      {/* Overdue bar */}
      {totalOS > 0 && (
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:'12px 16px',marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:12}}>
            <span style={{fontWeight:700,color:'#714B67'}}>Total Receivables: {INR(totalOS)} | Overdue: {INR(overdueTot)}</span>
            <span style={{color:'#6C757D'}}>{summary.count} invoices pending</span>
          </div>
          <div style={{display:'flex',height:10,borderRadius:4,overflow:'hidden',gap:2}}>
            {Object.entries(BUCKET_CFG).map(([key,bc])=>{
              const amt = key==='current'?summary.current:key==='1_30'?summary.d1_30:key==='31_60'?summary.d31_60:key==='61_90'?summary.d61_90:summary.over90
              const pct = totalOS > 0 ? (amt||0)/totalOS*100 : 0
              return pct > 0 ? (
                <div key={key} title={`${bc.label}: ${INR(amt)}`}
                  style={{width:`${pct}%`,background:bc.color,transition:'width .3s',
                    borderRadius: key==='current'?'4px 0 0 4px':key==='over_90'?'0 4px 4px 0':'0'}}/>
              ) : null
            })}
          </div>
          <div style={{display:'flex',gap:16,marginTop:6,flexWrap:'wrap'}}>
            {Object.entries(BUCKET_CFG).map(([key,bc])=>(
              <span key={key} style={{fontSize:10,color:bc.color,fontWeight:600,display:'flex',alignItems:'center',gap:3}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:bc.color,display:'inline-block'}}/>
                {bc.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
        <input className="sd-search" placeholder="Search customer / invoice..."
          value={search} onChange={e=>setSearch(e.target.value)} style={{width:240}}/>
        {bucket !== 'all' && (
          <button className="btn-xs" onClick={()=>setBucket('all')} style={{background:'#EDE0EA',color:'#714B67',border:'1px solid #714B67'}}>
            Clear filter ×
          </button>
        )}
        <span style={{marginLeft:'auto',fontSize:12,color:'#6C757D'}}>
          Showing {filtered.length} invoices
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading AR Aging...</div>
      ) : filtered.length === 0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          <div style={{fontSize:28,marginBottom:8}}>✅</div>
          <div style={{fontWeight:700,fontSize:15}}>
            {rows.length === 0 ? 'No outstanding receivables!' : 'No invoices match this filter'}
          </div>
          <div style={{fontSize:12,marginTop:4}}>
            {rows.length === 0 ? 'All invoices are paid.' : ''}
          </div>
        </div>
      ) : (
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Customer</th>
              <th>Invoice Date</th>
              <th>Due Date</th>
              <th style={{textAlign:'right'}}>Invoice Amt</th>
              <th style={{textAlign:'right'}}>Paid</th>
              <th style={{textAlign:'right'}}>Balance</th>
              <th style={{textAlign:'center'}}>Days Overdue</th>
              <th style={{textAlign:'center'}}>Bucket</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const bc = BUCKET_CFG[r.bucket] || BUCKET_CFG.current
              const isOverdue = r.agingDays > 0
              return (
                <tr key={i} onClick={()=>setSelected(selected?.invoiceNo===r.invoiceNo?null:r)}
                  style={{cursor:'pointer',background:selected?.invoiceNo===r.invoiceNo?'#F8F4F8':'transparent'}}>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>
                    {r.invoiceNo}
                  </td>
                  <td style={{fontWeight:600,fontSize:12}}>{r.customerName}</td>
                  <td style={{fontSize:11}}>
                    {r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : '—'}
                  </td>
                  <td style={{fontSize:11,color: isOverdue ? '#DC3545' : '#333',fontWeight: isOverdue?700:400}}>
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
                        color: r.agingDays > 60 ? '#DC3545' : r.agingDays > 30 ? '#856404' : '#E06F39'}}>
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
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{display:'flex',gap:3}}>
                      <button className="btn-xs" onClick={()=>nav('/fi/receipts')}>Collect</button>
                      {r.agingDays > 0 && (
                        <button className="btn-xs" style={{background:'#FFF3CD',color:'#856404',border:'1px solid #FFEEBA'}}
                          onClick={()=>toast.success(`Reminder drafted for ${r.customerName}`)}>
                          Remind
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #714B67'}}>
              <td colSpan={4} style={{padding:'10px 12px',color:'#714B67'}}>
                TOTAL — {filtered.length} invoices
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

      {/* Selected invoice panel */}
      {selected && (
        <div style={{marginTop:12,background:'#F8F4F8',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
          <div style={{fontWeight:700,color:'#714B67',marginBottom:8}}>
            {selected.invoiceNo} — {selected.customerName}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,fontSize:12}}>
            {[
              ['Invoice Date', selected.invoiceDate ? new Date(selected.invoiceDate).toLocaleDateString('en-IN') : '—'],
              ['Due Date',     selected.dueDate     ? new Date(selected.dueDate).toLocaleDateString('en-IN')     : 'Not set'],
              ['Days Overdue', selected.agingDays > 0 ? `${selected.agingDays} days` : 'Not overdue'],
              ['Balance Due',  INR(selected.balance)],
            ].map(([l,v])=>(
              <div key={l}>
                <div style={{fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase',marginBottom:2}}>{l}</div>
                <div style={{fontWeight:700,color:'#333'}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,display:'flex',gap:8}}>
            <button className="btn btn-p sd-bsm" onClick={()=>nav('/fi/receipts')}>Record Receipt</button>
            <button className="btn btn-s sd-bsm" onClick={()=>setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
