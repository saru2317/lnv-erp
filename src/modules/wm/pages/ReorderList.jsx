import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

export default function ReorderList() {
  const nav = useNavigate()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [selected,setSelected]= useState([])

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/reorder`,
        { headers:{ Authorization:`Bearer ${getToken()}` }})
      const data = await res.json()
      setItems(data.data||[])
      // Auto-select critical/zero items
      setSelected((data.data||[])
        .filter(i=>['CRITICAL','ZERO'].includes(i.status))
        .map(i=>i.itemCode))
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{ fetch_() },[])

  const toggleSel = code => setSelected(prev=>
    prev.includes(code)?prev.filter(c=>c!==code):[...prev,code])

  const createPOs = () => {
    if (!selected.length) return toast.error('Select items first!')
    toast.success(`Creating POs for ${selected.length} items...`)
    nav('/mm/po/new')
  }

  const STATUS = {
    ZERO:     { bg:'#E9ECEF', color:'#495057', label:'Zero Stock', act:'danger' },
    CRITICAL: { bg:'#F8D7DA', color:'#721C24', label:'Critical',   act:'danger' },
    LOW:      { bg:'#FFF3CD', color:'#856404', label:'Low',        act:'warn'   },
  }

  return (
    <div>
      <div style={{ position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8', borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Reorder Alerts <small>Below Minimum Stock Level</small>
          </div>
          <div className="lv-acts">
            <button className="btn btn-s sd-bsm" onClick={fetch_}>
              ↻ Refresh
            </button>
            <button className="btn btn-p sd-bsm" onClick={createPOs}>
              🛒 Create Reorder POs ({selected.length})
            </button>
          </div>
        </div>
      </div>

      {items.filter(i=>['CRITICAL','ZERO'].includes(i.status)).length>0 && (
        <div className="mm-alert warn">
          🔴 <strong>
            {items.filter(i=>['CRITICAL','ZERO'].includes(i.status)).length} items
          </strong> are critically low — raise purchase orders immediately!
        </div>
      )}

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          ⏳ Loading...
        </div>
      ) : items.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#155724',
          background:'#D4EDDA', borderRadius:8, marginTop:14 }}>
          <div style={{ fontSize:32 }}>✅</div>
          <div style={{ fontWeight:700, marginTop:8 }}>
            All stocks above reorder level!
          </div>
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', marginTop:14 }}>
          <table style={{ width:'100%', borderCollapse:'collapse',
            fontSize:12 }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['','Material','UOM','Current Stock',
                  'Reorder Level','Order Qty','Shortage',
                  'Priority','Action'].map(h=>(
                  <th key={h} style={{ padding:'8px 12px', fontSize:10,
                    fontWeight:700, color:'#6C757D', textAlign:'left',
                    textTransform:'uppercase', letterSpacing:.3,
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it,i)=>{
                const sc = STATUS[it.status]||STATUS.LOW
                const isSel = selected.includes(it.itemCode)
                return (
                  <tr key={it.itemCode} style={{
                    borderBottom:'1px solid #F0EEF0',
                    background:isSel?'#F8F4F8'
                      :i%2===0?'#fff':'#FDFBFD',
                    cursor:'pointer' }}
                    onClick={()=>toggleSel(it.itemCode)}>
                    <td style={{ padding:'8px 12px' }}>
                      <input type="checkbox"
                        checked={isSel}
                        onChange={()=>toggleSel(it.itemCode)}
                        onClick={e=>e.stopPropagation()} />
                    </td>
                    <td style={{ padding:'8px 12px', fontWeight:700 }}>
                      {it.itemName}
                      <div style={{ fontSize:10, color:'#714B67',
                        fontFamily:'DM Mono,monospace' }}>
                        {it.itemCode}
                      </div>
                    </td>
                    <td style={{ padding:'8px 12px' }}>{it.uom}</td>
                    <td style={{ padding:'8px 12px', fontWeight:800,
                      color:sc.color, fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(it.currentQty).toFixed(2)}
                    </td>
                    <td style={{ padding:'8px 12px', color:'#6C757D',
                      fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(it.reorderQty).toFixed(2)}
                    </td>
                    <td style={{ padding:'8px 12px', fontWeight:700,
                      fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(it.orderQty).toFixed(2)}
                    </td>
                    <td style={{ padding:'8px 12px', fontWeight:800,
                      color:'#DC3545',
                      fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(it.shortage).toFixed(2)}
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <span style={{ padding:'2px 8px',
                        borderRadius:10, fontSize:10, fontWeight:700,
                        background:sc.bg, color:sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding:'8px 12px' }}
                      onClick={e=>e.stopPropagation()}>
                      <button
                        className={`btn-xs ${sc.act==='danger'?'dan':''}`}
                        style={sc.act==='warn'?{
                          borderColor:'#856404',color:'#856404'}:{}}
                        onClick={()=>nav('/mm/po/new')}>
                        🛒 Raise PO
                      </button>
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
