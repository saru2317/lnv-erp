import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const STATUS_STYLE = {
  OK:       { bg:'#D4EDDA', color:'#155724', label:'OK'       },
  LOW:      { bg:'#FFF3CD', color:'#856404', label:'Low'      },
  CRITICAL: { bg:'#F8D7DA', color:'#721C24', label:'Critical' },
  ZERO:     { bg:'#E9ECEF', color:'#495057', label:'Zero'     },
}

export default function StockList() {
  const nav = useNavigate()
  const [stocks,  setStocks]  = useState([])
  const [loading, setLoading] = useState(true)
  const [chip,    setChip]    = useState('all')
  const [search,  setSearch]  = useState('')

  const fetchStock = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/stock`,
        { headers:{ Authorization:`Bearer ${getToken()}` }})
      const data = await res.json()
      setStocks(data.data||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{ fetchStock() },[])

  const filtered = stocks.filter(s => {
    const matchChip = chip==='all' ||
      (chip==='low' && ['LOW','CRITICAL','ZERO'].includes(s.status)) ||
      s.category?.toLowerCase().includes(chip)
    const matchSearch = !search ||
      s.itemCode?.toLowerCase().includes(search.toLowerCase()) ||
      s.itemName?.toLowerCase().includes(search.toLowerCase())
    return matchChip && matchSearch
  })

  const totalValue = stocks.reduce((s,i)=>s+parseFloat(i.value||0),0)

  return (
    <div>
      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8',
        borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Stock Overview <small>MB52 · Current Inventory</small>
          </div>
          <div className="lv-acts">
            <input placeholder="Search material, code..."
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{ padding:'6px 12px',
                border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12, width:180 }} />
            <button className="btn btn-s sd-bsm"
              onClick={fetchStock}>↻</button>
            <button className="btn btn-s sd-bsm">Export</button>
            <button className="btn btn-p sd-bsm"
              onClick={()=>nav('/wm/goods-issue')}>
              📤 Issue Stock
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:12 }}>
        {[
          { l:'Total SKUs',    v:stocks.length,
            c:'#714B67', bg:'#EDE0EA' },
          { l:'Stock Value',   v:fmtC(totalValue),
            c:'#155724', bg:'#D4EDDA' },
          { l:'Low Stock',
            v:stocks.filter(s=>s.status==='LOW').length,
            c:'#856404', bg:'#FFF3CD' },
          { l:'Critical / Zero',
            v:stocks.filter(s=>['CRITICAL','ZERO'].includes(s.status)).length,
            c:'#DC3545', bg:'#F8D7DA' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg,
            borderRadius:8, padding:'10px 14px',
            border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c,
              fontWeight:700, textTransform:'uppercase' }}>
              {k.l}
            </div>
            <div style={{ fontSize:k.l==='Stock Value'?15:22,
              fontWeight:800, color:k.c,
              fontFamily:'Syne,sans-serif' }}>
              {k.v}
            </div>
          </div>
        ))}
      </div>

      {/* Chips */}
      <div className="mm-chips" style={{ marginBottom:10 }}>
        {[['all','All'],['raw material','Raw Material'],
          ['spares','Spares'],['packing','Packing'],
          ['low','⚠️ Low Stock']].map(([k,l])=>(
          <div key={k} className={`mm-chip${chip===k?' on':''}`}
            onClick={()=>setChip(k)}
            style={k==='low'&&chip!==k
              ?{color:'#DC3545',borderColor:'#DC3545'}:{}}>
            {l}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center',
          color:'#6C757D' }}>⏳ Loading stock...</div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0',
          borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%',
            borderCollapse:'collapse', fontSize:12 }}>
            <thead style={{ background:'#F8F4F8',
              position:'sticky', top:60 }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['','Code','Material','Category',
                  'UOM','Received','Issued',
                  'Balance','Reorder Lvl',
                  'Value','Status'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px',
                    fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left',
                    textTransform:'uppercase',
                    letterSpacing:.3,
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s,i)=>{
                const sc = STATUS_STYLE[s.status]||STATUS_STYLE.OK
                return (
                  <tr key={s.id} style={{
                    borderBottom:'1px solid #F0EEF0',
                    background:
                      s.status==='CRITICAL'||s.status==='ZERO'
                        ?'#FFF5F5'
                        :s.status==='LOW'?'#FFFEF0'
                        :i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'8px 10px', width:30 }}>
                      <input type="checkbox" />
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <strong style={{ color:'#714B67',
                        fontFamily:'DM Mono,monospace',
                        fontSize:11 }}>{s.itemCode}</strong>
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontWeight:600, minWidth:160 }}>
                      {s.itemName}
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontSize:11, color:'#6C757D' }}>
                      {s.category}
                    </td>
                    <td style={{ padding:'8px 10px',
                      textAlign:'center' }}>{s.uom}</td>
                    <td style={{ padding:'8px 10px',
                      textAlign:'right', color:'#155724',
                      fontWeight:600,
                      fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(s.inQty||0).toFixed(2)}
                    </td>
                    <td style={{ padding:'8px 10px',
                      textAlign:'right', color:'#DC3545',
                      fontWeight:600,
                      fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(s.outQty||0).toFixed(2)}
                    </td>
                    <td style={{ padding:'8px 10px',
                      textAlign:'right', fontWeight:800,
                      fontFamily:'DM Mono,monospace',
                      color:sc.color }}>
                      {parseFloat(s.balanceQty||0).toFixed(2)}
                    </td>
                    <td style={{ padding:'8px 10px',
                      textAlign:'right', color:'#6C757D',
                      fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(s.reorderQty||0)}
                    </td>
                    <td style={{ padding:'8px 10px',
                      textAlign:'right',
                      fontFamily:'DM Mono,monospace',
                      fontWeight:600 }}>
                      {fmtC(s.value)}
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ padding:'2px 8px',
                        borderRadius:10, fontSize:10,
                        fontWeight:700,
                        background:sc.bg, color:sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot style={{ background:'#F8F4F8',
              borderTop:'2px solid #714B67' }}>
              <tr>
                <td colSpan={9} style={{ padding:'10px 12px',
                  fontWeight:800, color:'#714B67',
                  fontFamily:'Syne,sans-serif' }}>
                  Total Stock Value
                </td>
                <td style={{ padding:'10px 12px',
                  textAlign:'right', fontWeight:800,
                  fontFamily:'DM Mono,monospace',
                  fontSize:14, color:'#155724' }}>
                  {fmtC(totalValue)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
