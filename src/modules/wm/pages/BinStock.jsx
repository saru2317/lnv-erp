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
  const [whs,     setWhs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [selWh,   setSelWh]   = useState('All')
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rS, rW] = await Promise.all([
        fetch(`${BASE_URL}/wm/stock`,      { headers: hdr2() }),
        fetch(`${BASE_URL}/wm/warehouses`, { headers: hdr2() }),
      ])
      const [dS, dW] = await Promise.all([rS.json(), rW.json()])
      setStock(dS.data || [])
      setWhs(dW.data   || [])
    } catch { toast.error('Failed to load bin stock') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const shown = stock.filter(s => {
    const mw = selWh === 'All' || s.location === selWh || s.warehouse === selWh
    const ms = !search || s.itemCode?.toLowerCase().includes(search.toLowerCase()) || s.itemName?.toLowerCase().includes(search.toLowerCase()) || s.binLocation?.toLowerCase().includes(search.toLowerCase())
    return mw && ms && parseFloat(s.balanceQty) > 0
  })

  // Capacity pct (mock — use capacity from bin master if available)
  const capPct = qty => Math.min(100, Math.round((parseFloat(qty) / 600) * 100))

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Bin-wise Stock <small>LS26 · Location Inventory</small></div>
        <div className="lv-acts">
          <input className="sd-search" placeholder="Search item / bin..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:180}}/>
          <select className="sd-search" value={selWh} onChange={e=>setSelWh(e.target.value)} style={{width:160}}>
            <option value="All">All Locations</option>
            {whs.map(w=><option key={w.id} value={w.name||w.code}>{w.name||w.code}</option>)}
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
              const pct = capPct(s.balanceQty)
              const val = (parseFloat(s.balanceQty) * parseFloat(s.stdCost||0)).toLocaleString('en-IN', {style:'currency',currency:'INR',maximumFractionDigits:0})
              return (
                <tr key={s.itemCode} style={{borderBottom:'1px solid #F0EEF0',background:i%2===0?'#fff':'#FDFBFD'}}>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)',fontWeight:700}}>{s.itemCode}</td>
                  <td style={{fontWeight:600}}>{s.itemName}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{s.binLocation || s.location || '—'}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:13}}>{parseFloat(s.balanceQty).toFixed(2)}</td>
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
