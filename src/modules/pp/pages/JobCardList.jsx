import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs2 = () => ({ Authorization:`Bearer ${getToken()}` })

const STATUSES = ['PENDING','RECEIVED','IN_PROGRESS','COMPLETED','DISPATCHED','ON_HOLD']
const STATUS_STYLE = {
  PENDING:     { bg:'#FFF3CD', color:'#856404' },
  RECEIVED:    { bg:'#D1ECF1', color:'#0C5460' },
  IN_PROGRESS: { bg:'#CFE2FF', color:'#084298' },
  COMPLETED:   { bg:'#D4EDDA', color:'#155724' },
  DISPATCHED:  { bg:'#E2D9F3', color:'#4B2E83' },
  ON_HOLD:     { bg:'#F8D7DA', color:'#721C24' },
}

export default function JobCardList() {
  const nav = useNavigate()
  const [cards,   setCards]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/pp/job-cards`, { headers:authHdrs2() })
      const d = await res.json()
      setCards(d.data||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])
  useEffect(()=>{ load() },[load])

  const filtered = cards.filter(j => {
    const matchS = statusF==='All' || j.status===statusF
    const matchQ = !search ||
      j.jcNo?.toLowerCase().includes(search.toLowerCase()) ||
      j.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      j.itemName?.toLowerCase().includes(search.toLowerCase())
    return matchS && matchQ
  })

  const progressPct = j => {
    const total = Array.isArray(j.stages) ? j.stages.length : 0
    if (!total) return 0
    return Math.round((j.currentStage/total)*100)
  }

  const counts = STATUSES.reduce((acc,s)=>({...acc, [s]: cards.filter(j=>j.status===s).length}), {})

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Job Cards <small>{cards.length} total · {counts.IN_PROGRESS||0} in progress</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" style={{width:180}} value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="JC No / Customer / Item..." />
          <select className="sd-select" value={statusF} onChange={e=>setStatusF(e.target.value)}>
            <option>All</option>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/pp/job-card/new')}>+ New Job Card</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginBottom:14 }}>
        {STATUSES.map(s=>(
          <div key={s} onClick={()=>setStatusF(statusF===s?'All':s)} style={{ cursor:'pointer',
            background:STATUS_STYLE[s].bg, borderRadius:8, padding:'8px 10px',
            border: statusF===s ? `2px solid ${STATUS_STYLE[s].color}` : '1px solid transparent' }}>
            <div style={{ fontSize:9, color:STATUS_STYLE[s].color, fontWeight:700, textTransform:'uppercase' }}>{s.replace('_',' ')}</div>
            <div style={{ fontSize:18, fontWeight:800, color:STATUS_STYLE[s].color, fontFamily:'Syne,sans-serif' }}>{counts[s]||0}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          No job cards {statusF!=='All'?`with status ${statusF}`:'yet'}.
          <div style={{marginTop:12}}>
            <button className="btn btn-p sd-bsm" onClick={()=>nav('/pp/job-card/new')}>+ New Job Card</button>
          </div>
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['JC No','Customer','Item','Received Qty','Progress','Priority','Status',''].map(h=>(
                  <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((j,i)=>(
                <tr key={j.id} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}>
                  <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace', color:'#714B67', fontWeight:600 }}>{j.jcNo}</td>
                  <td style={{ padding:'8px 10px' }}>{j.customerName}</td>
                  <td style={{ padding:'8px 10px', fontWeight:600 }}>{j.itemCode?`${j.itemCode} — `:''}{j.itemName}</td>
                  <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace' }}>{Number(j.receivedQty).toFixed(2)} {j.uom}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <div style={{ background:'#E9ECEF', borderRadius:6, height:6, width:80, overflow:'hidden' }}>
                      <div style={{ background:'#714B67', height:'100%', width:`${progressPct(j)}%` }} />
                    </div>
                    <span style={{ fontSize:10, color:'#6C757D' }}>{progressPct(j)}%</span>
                  </td>
                  <td style={{ padding:'8px 10px' }}>{j.priority}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ padding:'3px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                      background:STATUS_STYLE[j.status]?.bg, color:STATUS_STYLE[j.status]?.color }}>
                      {j.status?.replace('_',' ')}
                    </span>
                  </td>
                  <td style={{ padding:'8px 10px' }}>
                    <button className="btn btn-s sd-bsm" style={{padding:'3px 8px',fontSize:11}}
                      onClick={()=>nav(`/pp/job-tracker?id=${j.id}`)}>Track</button>
                    {' '}
                    <button className="btn btn-s sd-bsm" style={{padding:'3px 8px',fontSize:11}}
                      onClick={()=>nav(`/pp/process-exec?id=${j.id}`)}>Execute</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
