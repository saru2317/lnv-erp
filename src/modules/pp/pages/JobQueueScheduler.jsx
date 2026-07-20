import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs2 = () => ({ Authorization:`Bearer ${getToken()}` })

const COLUMNS = [
  { status:'PENDING',     label:'Pending',      color:'#856404', bg:'#FFF3CD' },
  { status:'RECEIVED',    label:'Received',     color:'#0C5460', bg:'#D1ECF1' },
  { status:'IN_PROGRESS', label:'In Progress',  color:'#084298', bg:'#CFE2FF' },
  { status:'COMPLETED',   label:'Completed',    color:'#155724', bg:'#D4EDDA' },
  { status:'DISPATCHED',  label:'Dispatched',   color:'#4B2E83', bg:'#E2D9F3' },
]

const PRIORITY_DOT = { Urgent:'#DC3545', High:'#FD7E14', Normal:'#6C757D' }

export default function JobQueueScheduler() {
  const nav = useNavigate()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/pp/job-cards?status=PENDING,RECEIVED,IN_PROGRESS,COMPLETED,DISPATCHED`, { headers:authHdrs2() })
      const d = await res.json()
      setCards(d.data||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])
  useEffect(()=>{ load() },[load])

  const progressPct = j => {
    const total = Array.isArray(j.stages) ? j.stages.length : 0
    if (!total) return 0
    return Math.round((j.currentStage/total)*100)
  }

  const goto = j => {
    if (j.status==='PENDING') return nav('/wm/job-work-receipt')
    if (j.status==='COMPLETED' || j.status==='DISPATCHED') return nav(`/pp/job-tracker?id=${j.id}`)
    return nav(`/pp/process-exec?id=${j.id}`)
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Job Queue <small>{cards.length} active job cards, by stage</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/pp/job-card/new')}>+ New Job Card</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, alignItems:'start' }}>
          {COLUMNS.map(col=>{
            const colCards = cards.filter(j=>j.status===col.status)
            return (
              <div key={col.status} style={{ background:'#F8F4F8', borderRadius:8, padding:10, minHeight:200 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:col.color, textTransform:'uppercase' }}>{col.label}</span>
                  <span style={{ background:col.bg, color:col.color, borderRadius:10, padding:'1px 8px', fontSize:11, fontWeight:700 }}>{colCards.length}</span>
                </div>
                {colCards.length===0 ? (
                  <div style={{ fontSize:11, color:'#ADB5BD', textAlign:'center', padding:'20px 0' }}>Empty</div>
                ) : colCards.map(j=>(
                  <div key={j.id} onClick={()=>goto(j)} style={{ background:'#fff', borderRadius:6, padding:'8px 10px',
                    marginBottom:8, border:'1px solid #E0D5E0', cursor:'pointer', boxShadow:'0 1px 2px rgba(0,0,0,.04)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:'#714B67', fontWeight:700 }}>{j.jcNo}</span>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:PRIORITY_DOT[j.priority]||'#6C757D' }} title={j.priority} />
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, marginTop:2 }}>{j.itemName}</div>
                    <div style={{ fontSize:10, color:'#6C757D' }}>{j.customerName}</div>
                    {col.status==='IN_PROGRESS' && (
                      <div style={{ background:'#E9ECEF', borderRadius:4, height:4, marginTop:6, overflow:'hidden' }}>
                        <div style={{ background:'#714B67', height:'100%', width:`${progressPct(j)}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
