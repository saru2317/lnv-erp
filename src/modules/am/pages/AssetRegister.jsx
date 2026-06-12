import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ Authorization: `Bearer ${tok()}` })
const INR  = n => '₹' + parseFloat(n||0).toLocaleString('en-IN', { minimumFractionDigits:0 })

const ST = {
  active:      { label:'Active',         bg:'#D4EDDA', color:'#155724' },
  low_val:     { label:'Low Value',      bg:'#FFF3CD', color:'#856404' },
  disposed:    { label:'Disposed',       bg:'#E2E3E5', color:'#383D41' },
  maintenance: { label:'In Maintenance', bg:'#F8D7DA', color:'#721C24' },
  fully_dep:   { label:'Fully Dep.',     bg:'#CCE5FF', color:'#004085' },
}

export default function AssetRegister() {
  const nav = useNavigate()
  const [assets,  setAssets]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [cat,     setCat]     = useState('all')
  const [dept,    setDept]    = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/fixed-assets`, { headers: hdr() })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setAssets(d.data || d || [])
    } catch(e) { toast.error('Failed to load assets: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const categories = ['all', ...new Set(assets.map(a => a.category || a.cat).filter(Boolean))]
  const departments = ['all', ...new Set(assets.map(a => a.department || a.dept).filter(Boolean))]

  const filtered = assets.filter(a => {
    const mc = cat  === 'all' || (a.category||a.cat) === cat
    const md = dept === 'all' || (a.department||a.dept) === dept
    const ms = !search ||
      (a.description||a.desc||'').toLowerCase().includes(search.toLowerCase()) ||
      (a.code||'').toLowerCase().includes(search.toLowerCase())
    return mc && md && ms
  })

  const totalGross = filtered.reduce((s,a) => s + parseFloat(a.grossValue||a.gross||0), 0)
  const totalDepr  = filtered.reduce((s,a) => s + parseFloat(a.accDepr||a.depr||0), 0)
  const totalNet   = filtered.reduce((s,a) => s + parseFloat(a.netValue||a.net||0), 0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Asset Register <small>Fixed Asset Ledger (FA)</small></div>
        <div className="fi-lv-actions">
          <input placeholder="Search assets…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{padding:'6px 12px',border:'1px solid var(--odoo-border)',borderRadius:5,fontSize:12,width:180}}/>
          <select value={cat} onChange={e=>setCat(e.target.value)} className="fi-filter-select">
            {categories.map(c=><option key={c} value={c}>{c==='all'?'All Categories':c}</option>)}
          </select>
          <select value={dept} onChange={e=>setDept(e.target.value)} className="fi-filter-select">
            {departments.map(d=><option key={d} value={d}>{d==='all'?'All Departments':d}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/am/new')}>+ Add Asset</button>
        </div>
      </div>

      {/* KPI Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          {label:'Total Assets',    value:filtered.length,    sub:'in register',         color:'#714B67'},
          {label:'Gross Block',     value:INR(totalGross),    sub:'original cost',       color:'#004085'},
          {label:'Acc. Depreciation',value:INR(totalDepr),   sub:'total written off',   color:'#856404'},
          {label:'Net Block (WDV)', value:INR(totalNet),      sub:'current book value',  color:'#155724'},
        ].map(k=>(
          <div key={k.label} style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#9B8EA0',textTransform:'uppercase',marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.color}}>{k.value}</div>
            <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading assets...</div>
      ) : filtered.length === 0 ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>
          {assets.length === 0
            ? 'No assets found. Click "+ Add Asset" to register your first fixed asset.'
            : 'No assets match the filter.'}
        </div>
      ) : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Code</th><th>Description</th><th>Category</th><th>Dept</th>
            <th>Purchase Date</th>
            <th style={{textAlign:'right'}}>Gross Value</th>
            <th style={{textAlign:'right'}}>Acc. Depr.</th>
            <th style={{textAlign:'right'}}>Net Value</th>
            <th style={{textAlign:'right'}}>Dep%</th>
            <th>Method</th><th>Location</th><th>Status</th>
          </tr></thead>
          <tbody>
            {filtered.map((a,i) => {
              const gross = parseFloat(a.grossValue||a.gross||0)
              const depr  = parseFloat(a.accDepr||a.depr||0)
              const net   = parseFloat(a.netValue||a.net||0)
              const pct   = gross > 0 ? Math.round(depr/gross*100) : 0
              const st    = ST[a.status] || ST.active
              return (
                <tr key={a.id||a.code||i} style={{cursor:'pointer'}}
                  onClick={()=>nav(`/am/assets/${a.id||a.code}`)}>
                  <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{a.code}</strong></td>
                  <td style={{fontSize:12,fontWeight:600,maxWidth:200}}>{a.description||a.desc}</td>
                  <td style={{fontSize:11}}>{a.category||a.cat}</td>
                  <td style={{fontSize:11}}>{a.department||a.dept}</td>
                  <td style={{fontSize:11}}>{a.purchaseDate||a.date}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(gross)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#856404'}}>{INR(depr)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>{INR(net)}</td>
                  <td style={{textAlign:'right'}}>
                    <div style={{display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end'}}>
                      <div style={{width:40,height:5,background:'#E0D5E0',borderRadius:2}}>
                        <div style={{width:`${pct}%`,height:'100%',background:pct>=80?'#DC3545':pct>=50?'#FFC107':'#28A745',borderRadius:2}}/>
                      </div>
                      <span style={{fontSize:10}}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{fontSize:11}}>{a.depMethod||a.method||'—'}</td>
                  <td style={{fontSize:11}}>{a.location||a.loc||'—'}</td>
                  <td><span style={{background:st.bg,color:st.color,padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>{st.label}</span></td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{background:'#EDE0EA',fontWeight:700}}>
              <td colSpan={5} style={{padding:'8px 12px'}}>Total ({filtered.length})</td>
              <td style={{textAlign:'right',padding:'8px 12px',fontFamily:'DM Mono,monospace'}}>{INR(totalGross)}</td>
              <td style={{textAlign:'right',padding:'8px 12px',fontFamily:'DM Mono,monospace',color:'#856404'}}>{INR(totalDepr)}</td>
              <td style={{textAlign:'right',padding:'8px 12px',fontFamily:'DM Mono,monospace',color:'#155724'}}>{INR(totalNet)}</td>
              <td colSpan={4}/>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  )
}
