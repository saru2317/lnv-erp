import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const MOV_STYLE = {
  IN:         { bg:'#D4EDDA', color:'#155724', label:'GR In',     icon:'↓' },
  OUT:        { bg:'#F8D7DA', color:'#721C24', label:'GI Out',    icon:'↑' },
  TRANSFER:   { bg:'#D1ECF1', color:'#0C5460', label:'Transfer',  icon:'⇄' },
  ADJUSTMENT: { bg:'#FFF3CD', color:'#856404', label:'Adjustment',icon:'~' },
}

export default function MovementLog() {
  const [movements, setMovements] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [typeFilter,setType]      = useState('All')
  const [dateFrom,  setFrom]      = useState('')
  const [dateTo,    setTo]        = useState('')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      let url = `${BASE_URL}/wm/movements?`
      if (typeFilter!=='All') url+=`type=${typeFilter}&`
      if (dateFrom) url+=`from=${dateFrom}&`
      if (dateTo)   url+=`to=${dateTo}`
      const res  = await fetch(url,
        { headers:{ Authorization:`Bearer ${getToken()}` }})
      const data = await res.json()
      setMovements(data.data||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[typeFilter, dateFrom, dateTo])

  useEffect(()=>{ fetch_() },[fetch_])

  const filtered = movements.filter(m =>
    !search ||
    m.refNo?.toLowerCase().includes(search.toLowerCase()) ||
    m.item?.itemName?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8', borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Movement Log <small>MB51 · All Stock Movements</small>
          </div>
          <div className="lv-acts">
            <input placeholder="Search doc, material..."
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12, width:160 }} />
            <select value={typeFilter}
              onChange={e=>setType(e.target.value)}
              style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12, cursor:'pointer' }}>
              {['All','IN','OUT','TRANSFER','ADJUSTMENT'].map(t=>(
                <option key={t}>{t}</option>
              ))}
            </select>
            <input type="date" value={dateFrom}
              onChange={e=>setFrom(e.target.value)}
              style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12 }} />
            <input type="date" value={dateTo}
              onChange={e=>setTo(e.target.value)}
              style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12 }} />
            <button className="btn btn-s sd-bsm">Export</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center',
          color:'#6C757D' }}>⏳ Loading movements...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8,
          border:'2px dashed #E0D5E0', marginTop:14 }}>
          <div style={{ fontSize:32 }}>📋</div>
          <div style={{ fontWeight:700, marginTop:8 }}>No movements found</div>
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', marginTop:14 }}>
          <table style={{ width:'100%', borderCollapse:'collapse',
            fontSize:12 }}>
            <thead style={{ background:'#F8F4F8',
              position:'sticky', top:60 }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Doc No.','Type','Date','Material',
                  'Qty In','Qty Out','Balance','Ref','Remarks'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px', fontSize:10,
                    fontWeight:700, color:'#6C757D', textAlign:'left',
                    textTransform:'uppercase', letterSpacing:.3,
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m,i)=>{
                const sc = MOV_STYLE[m.movement]||MOV_STYLE.IN
                return (
                  <tr key={m.id} style={{
                    borderBottom:'1px solid #F0EEF0',
                    background:i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'8px 10px' }}>
                      <strong style={{ color:'#714B67',
                        fontFamily:'DM Mono,monospace',
                        fontSize:12 }}>{m.refNo||'—'}</strong>
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:8,
                        fontSize:10, fontWeight:700,
                        background:sc.bg, color:sc.color }}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td style={{ padding:'8px 10px', fontSize:11,
                      color:'#6C757D' }}>
                      {new Date(m.date||m.createdAt)
                        .toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>
                      {m.item?.itemName||'—'}
                    </td>
                    <td style={{ padding:'8px 10px', textAlign:'right',
                      color:'#155724', fontWeight:700,
                      fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(m.qtyIn||0)>0
                        ?'+'+parseFloat(m.qtyIn).toFixed(2):'—'}
                    </td>
                    <td style={{ padding:'8px 10px', textAlign:'right',
                      color:'#DC3545', fontWeight:700,
                      fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(m.qtyOut||0)>0
                        ?'-'+parseFloat(m.qtyOut).toFixed(2):'—'}
                    </td>
                    <td style={{ padding:'8px 10px', textAlign:'right',
                      fontWeight:800, fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(m.balanceQty||0).toFixed(2)}
                    </td>
                    <td style={{ padding:'8px 10px', fontSize:11,
                      color:'#714B67', fontFamily:'DM Mono,monospace' }}>
                      {m.refType||'—'}
                    </td>
                    <td style={{ padding:'8px 10px', fontSize:11,
                      color:'#6C757D' }}>{m.remarks||'—'}</td>
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
