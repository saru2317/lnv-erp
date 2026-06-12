import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok      = () => localStorage.getItem('lnv_token')
const hdr      = () => ({ Authorization: `Bearer ${tok()}` })

const BUCKETS  = ['0-30', '31-60', '61-90', '90+']
const BKT_CFG  = {
  '0-30':  { bg:'#D4EDDA', c:'#155724', label:'0–30 Days'  },
  '31-60': { bg:'#D1ECF1', c:'#0C5460', label:'31–60 Days' },
  '61-90': { bg:'#FFF3CD', c:'#856404', label:'61–90 Days' },
  '90+':   { bg:'#F8D7DA', c:'#721C24', label:'90+ Days'   },
}

export default function StockAging() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/wm/stock-aging`, { headers: hdr() })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setData(d.data || [])
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = data.filter(r =>
    (filter === 'All' || r.oldestDays === filter) &&
    (!search || r.itemName?.toLowerCase().includes(search.toLowerCase()) || r.itemCode?.toLowerCase().includes(search.toLowerCase()))
  )

  // Totals per bucket
  const bucketTotals = {}
  BUCKETS.forEach(b => { bucketTotals[b] = data.reduce((a,r) => a + (r.buckets?.[b]||0), 0) })

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Stock Aging Report <small>Inventory age by receipt date</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <div className="fi-alert warn" style={{marginBottom:12}}>
        Items in <strong>90+ days</strong> bucket are candidates for dead stock write-off or return to vendor.
      </div>

      {/* Bucket Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {BUCKETS.map(b => {
          const cfg = BKT_CFG[b]
          const count = data.filter(r => r.oldestDays === b).length
          return (
            <div key={b} onClick={()=>setFilter(filter===b?'All':b)}
              style={{ background:filter===b?cfg.bg:'#fff', border:`2px solid ${filter===b?cfg.c:'#E0D5E0'}`,
                borderRadius:10, padding:'12px 16px', cursor:'pointer', transition:'all .2s' }}>
              <div style={{fontSize:11,fontWeight:700,color:cfg.c,marginBottom:4}}>{cfg.label}</div>
              <div style={{fontSize:22,fontWeight:800,color:cfg.c}}>{count} <span style={{fontSize:11}}>items</span></div>
              <div style={{fontSize:11,color:'#6C757D',marginTop:4}}>
                {bucketTotals[b]?.toLocaleString('en-IN')} units total
              </div>
            </div>
          )
        })}
      </div>

      {/* Search + Filter */}
      <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
        <input className="sd-search" placeholder="Search item..." value={search}
          onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
        <span style={{fontSize:12,color:'#6C757D'}}>{filtered.length} items</span>
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading Stock Aging...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Item Code</th><th>Item Name</th><th>UOM</th>
            <th style={{textAlign:'right',background:'#D4EDDA',color:'#155724'}}>0–30 Days</th>
            <th style={{textAlign:'right',background:'#D1ECF1',color:'#0C5460'}}>31–60 Days</th>
            <th style={{textAlign:'right',background:'#FFF3CD',color:'#856404'}}>61–90 Days</th>
            <th style={{textAlign:'right',background:'#F8D7DA',color:'#721C24'}}>90+ Days</th>
            <th style={{textAlign:'right'}}>Total</th>
            <th style={{textAlign:'center'}}>Oldest Bucket</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{padding:40,textAlign:'center',color:'#6C757D'}}>No stock aging data found</td></tr>
            ) : filtered.map((r,i) => {
              const cfg = BKT_CFG[r.oldestDays] || BKT_CFG['0-30']
              return (
                <tr key={i}>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:'var(--odoo-purple)'}}>{r.itemCode||'—'}</td>
                  <td style={{fontWeight:600,fontSize:12}}>{r.itemName}</td>
                  <td style={{fontSize:11,color:'#6C757D'}}>{r.uom}</td>
                  {BUCKETS.map(b => (
                    <td key={b} style={{textAlign:'right',fontFamily:'DM Mono,monospace',
                      background:(r.buckets?.[b]||0)>0?BKT_CFG[b].bg:'transparent',
                      color:(r.buckets?.[b]||0)>0?BKT_CFG[b].c:'#CCC'}}>
                      {(r.buckets?.[b]||0) > 0 ? (r.buckets[b]).toLocaleString('en-IN') : '—'}
                    </td>
                  ))}
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{(r.total||0).toLocaleString('en-IN')}</td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:cfg.bg,color:cfg.c,padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
