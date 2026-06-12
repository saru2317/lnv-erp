import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok      = () => localStorage.getItem('lnv_token')
const hdr      = () => ({ Authorization: `Bearer ${tok()}` })
const INR      = v  => '₹' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
const INR0     = v  => '₹' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:0 })

export default function StockValuation() {
  const [data,        setData]        = useState([])
  const [byCategory,  setByCategory]  = useState({})
  const [totalValue,  setTotalValue]  = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [method,      setMethod]      = useState('moving') // moving | standard

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/wm/stock-valuation`, { headers: hdr() })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setData(d.data || [])
      setByCategory(d.byCategory || {})
      setTotalValue(d.totalValue || 0)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = data.filter(r =>
    !search || r.itemName?.toLowerCase().includes(search.toLowerCase()) || r.itemCode?.toLowerCase().includes(search.toLowerCase())
  )

  const displayValue = (r) => method === 'moving' ? r.movAvgValue : r.stdValue
  const displayCost  = (r) => method === 'moving' ? r.movAvgCost  : r.stdCost
  const totalDisplay = filtered.reduce((a,r) => a + displayValue(r), 0)

  const CAT_COLORS = {
    'RM':'#CCE5FF', 'FG':'#D4EDDA', 'SFG':'#FFF3CD',
    'Raw Material':'#CCE5FF', 'Finished Goods':'#D4EDDA',
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Stock Valuation <small>Inventory value by costing method</small></div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={method} onChange={e=>setMethod(e.target.value)} style={{width:160}}>
            <option value="moving">Moving Average Cost</option>
            <option value="standard">Standard Cost</option>
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        <div style={{background:'#EDE0EA',borderRadius:10,padding:'14px 18px'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#714B67',marginBottom:4}}>TOTAL INVENTORY VALUE</div>
          <div style={{fontSize:22,fontWeight:800,color:'#714B67'}}>{INR0(totalDisplay)}</div>
          <div style={{fontSize:11,color:'#9B8EA0',marginTop:4}}>{filtered.length} SKUs</div>
        </div>
        {Object.entries(byCategory).slice(0,3).map(([cat, val]) => (
          <div key={cat} style={{background:CAT_COLORS[cat]||'#F0EEEB',borderRadius:10,padding:'14px 18px'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#495057',marginBottom:4}}>{cat.toUpperCase()}</div>
            <div style={{fontSize:18,fontWeight:800,color:'#333'}}>{INR0(val)}</div>
            <div style={{fontSize:11,color:'#6C757D',marginTop:4}}>
              {totalValue>0?Math.round(val/totalValue*100):0}% of total
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
        <input className="sd-search" placeholder="Search item..." value={search}
          onChange={e=>setSearch(e.target.value)} style={{width:240}}/>
        <span style={{fontSize:12,color:'#6C757D'}}>{filtered.length} items · Total: {INR0(totalDisplay)}</span>
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading Stock Valuation...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Item Code</th><th>Item Name</th><th>Category</th><th>UOM</th>
            <th style={{textAlign:'right'}}>Stock Qty</th>
            <th style={{textAlign:'right'}}>Unit Cost</th>
            <th style={{textAlign:'right'}}>Std Cost</th>
            <th style={{textAlign:'right'}}>Total Value</th>
            <th style={{textAlign:'right'}}>% of Total</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{padding:40,textAlign:'center',color:'#6C757D'}}>No stock valuation data found</td></tr>
            ) : filtered.map((r,i) => {
              const val = displayValue(r)
              const pct = totalDisplay > 0 ? (val/totalDisplay*100).toFixed(1) : 0
              return (
                <tr key={i}>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:'var(--odoo-purple)'}}>{r.itemCode||'—'}</td>
                  <td style={{fontWeight:600,fontSize:12}}>{r.itemName}</td>
                  <td>
                    <span style={{background:CAT_COLORS[r.category]||'#E2E3E5',color:'#333',
                      padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:700}}>
                      {r.category||'RM'}
                    </span>
                  </td>
                  <td style={{fontSize:11,color:'#6C757D'}}>{r.uom}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{parseFloat(r.qty||0).toLocaleString('en-IN')}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(displayCost(r))}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#6C757D'}}>{INR(r.stdCost)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>{INR0(val)}</td>
                  <td style={{textAlign:'right',fontSize:11}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end'}}>
                      <div style={{width:60,height:6,background:'#E0D5E0',borderRadius:3}}>
                        <div style={{width:`${Math.min(100,parseFloat(pct))}%`,height:'100%',background:'#714B67',borderRadius:3}}/>
                      </div>
                      {pct}%
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{background:'#EDE0EA',fontWeight:700}}>
                <td colSpan={4} style={{padding:'8px 12px'}}>Total ({filtered.length} items)</td>
                <td style={{textAlign:'right',padding:'8px 12px',fontFamily:'DM Mono,monospace'}}>
                  {filtered.reduce((a,r)=>a+(r.qty||0),0).toLocaleString('en-IN')}
                </td>
                <td colSpan={2}/>
                <td style={{textAlign:'right',padding:'8px 12px',fontFamily:'DM Mono,monospace',fontSize:14}}>
                  {INR0(totalDisplay)}
                </td>
                <td style={{textAlign:'right',padding:'8px 12px'}}>100%</td>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  )
}
