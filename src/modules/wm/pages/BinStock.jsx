// ════════════════════════════════════════════════════════════
// BinStock.jsx — wired to real stock with bin info
// ════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })

export function BinStock() {
  const [stock,   setStock]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [locFilter, setLocFilter] = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/wm/bin-stock`, { headers: hdr2() })
      const d = await r.json()
      setStock(d.data || [])
    } catch { toast.error('Failed to load bin stock') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  // Unique locations for filter
  const locations = ['All', ...new Set(stock.map(s => s.binLocation).filter(Boolean))]

  const shown = stock.filter(s => {
    const ml = locFilter === 'All' || s.binLocation === locFilter
    const ms = !search ||
      s.itemCode?.toLowerCase().includes(search.toLowerCase()) ||
      s.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      s.binLocation?.toLowerCase().includes(search.toLowerCase())
    return ml && ms
  })

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Bin-wise Stock <small>LS26 · Location Inventory</small></div>
        <div className="lv-acts">
          <input className="sd-search" placeholder="Search item / bin..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:180}}/>
          <select className="sd-search" value={locFilter} onChange={e=>setLocFilter(e.target.value)} style={{width:160}}>
            {locations.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
        </div>
      </div>

      <table className="wm-data-table">
        <thead><tr>
          <th>Item Code</th><th>Material</th><th>Bin / Location</th>
          <th style={{textAlign:'right'}}>Qty</th><th>UOM</th>
          <th>Batch No.</th><th>Capacity Used</th><th>Value</th>
        </tr></thead>
        <tbody>
          {loading
            ? <tr><td colSpan={8} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
            : shown.length === 0
            ? <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No stock in bins. Post GRNs to update stock levels.
              </td></tr>
            : shown.map((s, i) => {
              const pct = Math.min(100, Math.round((parseFloat(s.qty) / 600) * 100))
              const val = '₹' + parseFloat(s.value||0).toLocaleString('en-IN', {maximumFractionDigits:0})
              return (
                <tr key={`${s.itemCode}_${s.binLocation}_${i}`} style={{borderBottom:'1px solid #F0EEF0',background:i%2===0?'#fff':'#FDFBFD'}}>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)',fontWeight:700}}>{s.itemCode||'—'}</td>
                  <td style={{fontWeight:600}}>{s.itemName}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>
                    <span style={{background:'#EDE0EA',color:'#714B67',padding:'2px 6px',borderRadius:4,fontWeight:700}}>
                      {s.binLocation || '—'}
                    </span>
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:13}}>{parseFloat(s.qty).toFixed(3)}</td>
                  <td style={{textAlign:'center'}}>{s.uom}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{s.batchNo || '—'}</td>
                  <td style={{minWidth:120}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{flex:1,height:6,background:'#E0D5E0',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:pct>=90?'var(--odoo-red)':pct>=60?'var(--odoo-orange)':'var(--odoo-green)',borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:'#6C757D',width:30}}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:'#714B67'}}>{val}</td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// ExpiryTracking.jsx — real GRN batch expiry dates
// ════════════════════════════════════════════════════════════
export default BinStock
