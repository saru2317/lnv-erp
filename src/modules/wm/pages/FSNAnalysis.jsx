import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok      = () => localStorage.getItem('lnv_token')
const hdr      = () => ({ Authorization: `Bearer ${tok()}` })
const INR      = v  => '₹' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:0 })

const CAT_CFG = {
  'Fast':        { bg:'#D4EDDA', c:'#155724', dot:'#28A745', label:'Fast Moving'    },
  'Slow':        { bg:'#FFF3CD', c:'#856404', dot:'#FFC107', label:'Slow Moving'    },
  'Non-Moving':  { bg:'#F8D7DA', c:'#721C24', dot:'#DC3545', label:'Non-Moving'     },
}

export default function FSNAnalysis() {
  const [data,    setData]    = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [days,    setDays]    = useState(90)
  const [filter,  setFilter]  = useState('All')
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/wm/fsn-analysis?days=${days}`, { headers: hdr() })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setData(d.data || [])
      setSummary(d.summary || {})
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [days])

  useEffect(() => { load() }, [load])

  const filtered = data.filter(r =>
    (filter === 'All' || r.category === filter) &&
    (!search || r.itemName?.toLowerCase().includes(search.toLowerCase()) || r.itemCode?.toLowerCase().includes(search.toLowerCase()))
  )

  const totalValue = (summary.fastValue||0) + (summary.slowValue||0) + (summary.nonValue||0)

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          FSN Analysis
          <small> Fast · Slow · Non-Moving Stock Classification</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={days} onChange={e=>setDays(+e.target.value)} style={{width:140}}>
            <option value={30}>30 day threshold</option>
            <option value={60}>60 day threshold</option>
            <option value={90}>90 day threshold</option>
            <option value={180}>180 day threshold</option>
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
        </div>
      </div>

      <div className="fi-alert info" style={{marginBottom:12}}>
        <strong>Fast</strong> = moved in last 30 days &nbsp;|&nbsp;
        <strong>Slow</strong> = moved in 31–{days} days &nbsp;|&nbsp;
        <strong>Non-Moving</strong> = no movement in {days}+ days
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {[
          { key:'Fast',       count:summary.fast||0,      value:summary.fastValue||0,  ...CAT_CFG['Fast']       },
          { key:'Slow',       count:summary.slow||0,      value:summary.slowValue||0,  ...CAT_CFG['Slow']       },
          { key:'Non-Moving', count:summary.nonMoving||0, value:summary.nonValue||0,   ...CAT_CFG['Non-Moving'] },
        ].map(c => (
          <div key={c.key} onClick={()=>setFilter(filter===c.key?'All':c.key)}
            style={{ background:filter===c.key?c.bg:'#fff', border:`2px solid ${filter===c.key?c.dot:'#E0D5E0'}`,
              borderRadius:10, padding:'14px 18px', cursor:'pointer', transition:'all .2s' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:c.dot }}/>
              <span style={{ fontSize:11, fontWeight:700, color:c.c, textTransform:'uppercase' }}>{c.label}</span>
            </div>
            <div style={{ fontSize:24, fontWeight:800, color:c.c }}>{c.count} <span style={{fontSize:12}}>items</span></div>
            <div style={{ fontSize:12, color:c.c, marginTop:4 }}>{INR(c.value)}
              <span style={{fontSize:10,color:'#9B8EA0',marginLeft:6}}>
                {totalValue>0?Math.round(c.value/totalValue*100):0}% of total value
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
        <input className="sd-search" placeholder="Search item..." value={search}
          onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
        {['All','Fast','Slow','Non-Moving'].map(f => (
          <button key={f} className="btn btn-s sd-bsm"
            style={{ background: filter===f?'#714B67':'', color:filter===f?'#fff':'' }}
            onClick={()=>setFilter(f)}>{f} {f!=='All' && `(${data.filter(r=>r.category===f).length})`}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading FSN Analysis...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Item Code</th><th>Item Name</th><th>UOM</th>
            <th style={{textAlign:'right'}}>Stock Qty</th>
            <th style={{textAlign:'right'}}>Stock Value</th>
            <th>Last Movement</th>
            <th style={{textAlign:'right'}}>Days Since</th>
            <th style={{textAlign:'right'}}>Issues (90d)</th>
            <th style={{textAlign:'center'}}>Category</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No items found
              </td></tr>
            ) : filtered.map((r,i) => {
              const cfg = CAT_CFG[r.category] || CAT_CFG['Fast']
              return (
                <tr key={i}>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:'var(--odoo-purple)'}}>{r.itemCode||'—'}</td>
                  <td style={{fontWeight:600,fontSize:12}}>{r.itemName}</td>
                  <td style={{fontSize:11,color:'#6C757D'}}>{r.uom}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{parseFloat(r.currentStock||0).toLocaleString('en-IN')}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(r.stockValue)}</td>
                  <td style={{fontSize:11}}>{r.lastMovDate ? new Date(r.lastMovDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : <span style={{color:'#DC3545'}}>Never</span>}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color: r.daysSince>90?'#DC3545':r.daysSince>30?'#856404':'#155724'}}>
                    {r.daysSince != null ? `${r.daysSince}d` : '—'}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{r.issueQty90d > 0 ? r.issueQty90d.toLocaleString('en-IN') : '—'}</td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:cfg.bg,color:cfg.c,padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:700}}>
                      {r.category}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{background:'#EDE0EA',fontWeight:700}}>
                <td colSpan={3} style={{padding:'8px 12px'}}>Total ({filtered.length} items)</td>
                <td style={{textAlign:'right',padding:'8px 12px',fontFamily:'DM Mono,monospace'}}>{filtered.reduce((a,r)=>a+(r.currentStock||0),0).toLocaleString('en-IN')}</td>
                <td style={{textAlign:'right',padding:'8px 12px',fontFamily:'DM Mono,monospace'}}>{INR(filtered.reduce((a,r)=>a+(r.stockValue||0),0))}</td>
                <td colSpan={4}/>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  )
}
