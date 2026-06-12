import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ Authorization: `Bearer ${tok()}` })
const INR  = v => '₹' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:0 })

const ZONES = [
  { key:'RM-STORE',   label:'RM Store',        icon:'📦', color:'#CCE5FF', border:'#004085', desc:'Raw Materials & Components' },
  { key:'SHOP-FLOOR', label:'Shop Floor / WIP', icon:'⚙️', color:'#FFF3CD', border:'#856404', desc:'Work In Progress' },
  { key:'FG-STORE',   label:'FG Store',         icon:'✅', color:'#D4EDDA', border:'#155724', desc:'Finished Goods' },
  { key:'QC-HOLD',    label:'QC Inspection',    icon:'🔍', color:'#F8D7DA', border:'#721C24', desc:'Pending QC Clearance' },
]

export default function WHMap() {
  const nav = useNavigate()
  const [stock,    setStock]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null) // selected zone key
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`${BASE_URL}/wm/stock`, { headers: hdr() })
      .then(r => r.json())
      .then(d => { setStock(d.data || []) })
      .catch(() => toast.error('Failed to load stock'))
      .finally(() => setLoading(false))
  }, [])

  // Group stock by zone
  const zoneStock = {}
  ZONES.forEach(z => { zoneStock[z.key] = [] })
  stock.forEach(s => {
    const byLoc = s.byLocation || {}
    ZONES.forEach(z => {
      const qty = parseFloat(byLoc[z.key] || 0)
      if (qty > 0) {
        zoneStock[z.key].push({ ...s, zoneQty: qty, zoneValue: qty * parseFloat(s.stdCost||0) })
      }
    })
  })

  // Zone summary
  const zoneSummary = ZONES.map(z => ({
    ...z,
    itemCount: zoneStock[z.key].length,
    totalQty:  zoneStock[z.key].reduce((a,s)=>a+s.zoneQty,0),
    totalValue:zoneStock[z.key].reduce((a,s)=>a+s.zoneValue,0),
    utilPct:   Math.min(100, Math.round(zoneStock[z.key].length / Math.max(1, stock.length) * 100)),
  }))

  const selectedItems = selected
    ? (zoneStock[selected] || []).filter(s =>
        !search || s.itemName?.toLowerCase().includes(search.toLowerCase()) ||
        s.itemCode?.toLowerCase().includes(search.toLowerCase()))
    : []

  const selectedZone = ZONES.find(z => z.key === selected)

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Warehouse Map <small>Zone-wise Stock — LNV Manufacturing</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => { setLoading(true); fetch(`${BASE_URL}/wm/stock`,{headers:hdr()}).then(r=>r.json()).then(d=>{setStock(d.data||[]);setLoading(false)}) }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading warehouse map...</div>
      ) : (
        <>
          {/* Zone Cards — Visual Map */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:20 }}>
            {zoneSummary.map(z => (
              <div key={z.key}
                onClick={() => setSelected(selected === z.key ? null : z.key)}
                style={{
                  background:  selected===z.key ? z.color : '#fff',
                  border:      `2px solid ${selected===z.key ? z.border : '#E0D5E0'}`,
                  borderRadius: 12, padding:'18px 20px', cursor:'pointer',
                  transition:'all .2s', boxShadow: selected===z.key ? `0 4px 16px ${z.border}30` : 'none'
                }}>
                {/* Zone header */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div>
                    <span style={{fontSize:20,marginRight:8}}>{z.icon}</span>
                    <span style={{fontSize:14,fontWeight:800,color:selected===z.key?z.border:'#333'}}>{z.label}</span>
                  </div>
                  <span style={{fontSize:11,color:'#6C757D'}}>{z.desc}</span>
                </div>

                {/* Stats */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  <div style={{background:'rgba(255,255,255,.7)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                    <div style={{fontSize:20,fontWeight:800,color:z.border}}>{z.itemCount}</div>
                    <div style={{fontSize:10,color:'#6C757D',textTransform:'uppercase'}}>SKUs</div>
                  </div>
                  <div style={{background:'rgba(255,255,255,.7)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                    <div style={{fontSize:16,fontWeight:800,color:z.border}}>{parseFloat(z.totalQty).toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
                    <div style={{fontSize:10,color:'#6C757D',textTransform:'uppercase'}}>Total Qty</div>
                  </div>
                  <div style={{background:'rgba(255,255,255,.7)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                    <div style={{fontSize:14,fontWeight:800,color:z.border}}>{INR(z.totalValue)}</div>
                    <div style={{fontSize:10,color:'#6C757D',textTransform:'uppercase'}}>Value</div>
                  </div>
                </div>

                {/* Utilization bar */}
                <div style={{marginTop:10}}>
                  <div style={{height:6,background:'#E0D5E0',borderRadius:3}}>
                    <div style={{height:'100%',width:`${z.utilPct}%`,background:z.border,borderRadius:3,transition:'width .5s'}}/>
                  </div>
                  <div style={{fontSize:10,color:'#6C757D',marginTop:3}}>{z.utilPct}% of total SKUs in this zone</div>
                </div>

                {/* Action buttons */}
                <div style={{display:'flex',gap:6,marginTop:10}}>
                  {z.key === 'RM-STORE' && (
                    <button className="btn btn-s sd-bsm" style={{fontSize:10,padding:'3px 8px'}}
                      onClick={e=>{e.stopPropagation();nav('/wm/grn/new')}}>+ GRN</button>
                  )}
                  {z.key === 'SHOP-FLOOR' && (
                    <button className="btn btn-s sd-bsm" style={{fontSize:10,padding:'3px 8px'}}
                      onClick={e=>{e.stopPropagation();nav('/wm/goods-issue')}}>Issue Material</button>
                  )}
                  {z.key === 'FG-STORE' && (
                    <button className="btn btn-s sd-bsm" style={{fontSize:10,padding:'3px 8px'}}
                      onClick={e=>{e.stopPropagation();nav('/sd/invoices/new')}}>Create Invoice</button>
                  )}
                  {z.key === 'QC-HOLD' && (
                    <button className="btn btn-s sd-bsm" style={{fontSize:10,padding:'3px 8px'}}
                      onClick={e=>{e.stopPropagation();nav('/wm/qc')}}>QC Inspection</button>
                  )}
                  <button className="btn btn-s sd-bsm" style={{fontSize:10,padding:'3px 8px'}}
                    onClick={e=>{e.stopPropagation();nav(`/wm/transfer`)}}>Transfer</button>
                </div>
              </div>
            ))}
          </div>

          {/* Zone Detail Panel */}
          {selected && selectedZone && (
            <div style={{background:'#fff',border:`2px solid ${selectedZone.border}`,borderRadius:12,padding:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:800,color:selectedZone.border}}>
                  {selectedZone.icon} {selectedZone.label} — Stock Details
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <input className="sd-search" placeholder="Search item..." value={search}
                    onChange={e=>setSearch(e.target.value)} style={{width:180,fontSize:12}}/>
                  <button className="btn btn-s sd-bsm" onClick={()=>{setSelected(null);setSearch('')}}>✕ Close</button>
                </div>
              </div>

              {selectedItems.length === 0 ? (
                <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>
                  {search ? 'No items match search' : `No stock in ${selectedZone.label}`}
                </div>
              ) : (
                <table className="fi-data-table">
                  <thead><tr>
                    <th>Item Code</th><th>Item Name</th><th>Category</th><th>UOM</th>
                    <th style={{textAlign:'right'}}>Qty in Zone</th>
                    <th style={{textAlign:'right'}}>Unit Cost</th>
                    <th style={{textAlign:'right'}}>Zone Value</th>
                    <th>Status</th>
                  </tr></thead>
                  <tbody>
                    {selectedItems.map((s,i) => {
                      const low = s.reorderQty > 0 && s.zoneQty <= s.reorderQty
                      return (
                        <tr key={i}>
                          <td style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:'var(--odoo-purple)'}}>{s.itemCode||'—'}</td>
                          <td style={{fontWeight:600,fontSize:12}}>{s.itemName}</td>
                          <td style={{fontSize:11,color:'#6C757D'}}>{s.category||'—'}</td>
                          <td style={{fontSize:11}}>{s.uom}</td>
                          <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,
                            color:low?'#DC3545':'#333'}}>{parseFloat(s.zoneQty).toLocaleString('en-IN',{maximumFractionDigits:3})}</td>
                          <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:11}}>{INR(s.stdCost)}</td>
                          <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>{INR(s.zoneValue)}</td>
                          <td>
                            <span style={{
                              background:low?'#F8D7DA':s.zoneQty===0?'#E2E3E5':'#D4EDDA',
                              color:low?'#721C24':s.zoneQty===0?'#6C757D':'#155724',
                              padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700
                            }}>{low?'Low Stock':s.zoneQty===0?'Empty':'OK'}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:selectedZone.color,fontWeight:700}}>
                      <td colSpan={4} style={{padding:'8px 12px'}}>Total ({selectedItems.length} items)</td>
                      <td style={{textAlign:'right',padding:'8px 12px',fontFamily:'DM Mono,monospace'}}>
                        {selectedItems.reduce((a,s)=>a+s.zoneQty,0).toLocaleString('en-IN',{maximumFractionDigits:0})}
                      </td>
                      <td/>
                      <td style={{textAlign:'right',padding:'8px 12px',fontFamily:'DM Mono,monospace'}}>
                        {INR(selectedItems.reduce((a,s)=>a+s.zoneValue,0))}
                      </td>
                      <td/>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}

          {!selected && (
            <div style={{textAlign:'center',padding:'20px',color:'#6C757D',fontSize:12}}>
              👆 Click any zone above to see detailed stock list
            </div>
          )}
        </>
      )}
    </div>
  )
}
