import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const SEED = [
  { id:1, ppapNo:'PPAP-2026-001', partName:'Ring Yarn 30s', partNo:'PY-BH-6001', customer:'ABC Textiles', level:'Level 3', revision:'A', submissionDate:'2026-04-10', status:'Submitted',  completionPct:85, pswStatus:'Pending' },
  { id:2, ppapNo:'PPAP-2026-002', partName:'OE Yarn 12s',   partNo:'PY-BH-7001', customer:'DEF Exports',  level:'Level 2', revision:'B', submissionDate:'2026-04-05', status:'Approved',   completionPct:100, pswStatus:'Approved' },
  { id:3, ppapNo:'PPAP-2026-003', partName:'Cotton Sliver', partNo:'PY-BH-6004', customer:'GHI Spinners', level:'Level 3', revision:'A', submissionDate:'',           status:'In Progress',completionPct:45,  pswStatus:'Not Started' },
]

const STATUS_STYLE = {
  'In Progress': ['#FFF3CD','#856404'],
  'Submitted':   ['#D1ECF1','#0C5460'],
  'Approved':    ['#D4EDDA','#155724'],
  'Rejected':    ['#F8D7DA','#721C24'],
  'On Hold':     ['#E2E3E5','#383d41'],
}

export default function PPAPList() {
  const nav = useNavigate()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/qm/ppap`, { headers:{ Authorization:`Bearer ${getToken()}` } })
      const data = await res.json()
      setItems(data.data?.length ? data.data : SEED)
    } catch { setItems(SEED) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const statuses = ['All','In Progress','Submitted','Approved','Rejected','On Hold']
  const shown = items.filter(p => {
    const ms = filter==='All' || p.status===filter
    const mt = !search || p.ppapNo?.toLowerCase().includes(search.toLowerCase()) || p.partName?.toLowerCase().includes(search.toLowerCase()) || p.customer?.toLowerCase().includes(search.toLowerCase())
    return ms && mt
  })

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">PPAP Register <small>Production Part Approval Process — AIAG</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="PPAP No. / Part / Customer..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:240}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/qm/ppap/new')}>New PPAP</button>
        </div>
      </div>

      {/* Info strip */}
      <div style={{background:'#EDE0EA',borderRadius:6,padding:'8px 14px',marginBottom:12,fontSize:11,color:'#714B67',display:'flex',gap:16,flexWrap:'wrap'}}>
        <strong>PPAP — AIAG Standard:</strong>
        <span>18 Elements · 5 Submission Levels · PSW Sign-off</span>
        <span>Level 1: Warrant only · Level 3: Full package (most common) · Level 5: On-site</span>
        <span style={{marginLeft:'auto',fontWeight:700}}>{items.length} submissions · {items.filter(i=>i.status==='Approved').length} approved</span>
      </div>

      <div className="pp-chips">
        {statuses.map(s=>(
          <div key={s} className={`pp-chip${filter===s?' on':''}`} onClick={()=>setFilter(s)}>
            {s} <span>{s==='All'?items.length:items.filter(i=>i.status===s).length}</span>
          </div>
        ))}
      </div>

      {/* Cards view */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14}}>
        {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D',gridColumn:'1/-1'}}>Loading...</div>
        : shown.length===0 ? <div style={{padding:30,textAlign:'center',color:'#6C757D',gridColumn:'1/-1'}}>No PPAP submissions found</div>
        : shown.map(p=>{
          const [bg,tx] = STATUS_STYLE[p.status]||['#EEE','#333']
          const pct = p.completionPct || 0
          return (
            <div key={p.id} style={{background:'#fff',borderRadius:8,border:'1.5px solid #E0D5E0',overflow:'hidden',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}
              onClick={()=>nav(`/qm/ppap/${p.id}`)}>
              {/* Card header */}
              <div style={{background:'linear-gradient(135deg,#714B67,#4A3050)',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:800,color:'#fff'}}>{p.ppapNo}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.7)',marginTop:2}}>{p.customer}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <span style={{background:bg,color:tx,padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,display:'block',marginBottom:4}}>{p.status}</span>
                  <span style={{background:'rgba(255,255,255,.2)',color:'#fff',padding:'1px 6px',borderRadius:10,fontSize:10,fontWeight:700}}>{p.level}</span>
                </div>
              </div>
              {/* Card body */}
              <div style={{padding:'12px 14px'}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:2}}>{p.partName}</div>
                <div style={{fontSize:11,color:'#6C757D',fontFamily:'DM Mono,monospace',marginBottom:10}}>{p.partNo} · Rev {p.revision||'A'}</div>
                {/* Progress bar */}
                <div style={{marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#6C757D',marginBottom:4}}>
                    <span>Elements Complete</span>
                    <strong style={{color:pct===100?'#155724':pct>=50?'#856404':'#721C24'}}>{pct}%</strong>
                  </div>
                  <div style={{height:6,background:'#E0D5E0',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:pct===100?'#28A745':pct>=50?'#FFC107':'#DC3545',borderRadius:3,transition:'width .3s'}}/>
                  </div>
                </div>
                {/* PSW status */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12}}>
                  <span style={{color:'#6C757D'}}>PSW:</span>
                  <span style={{fontWeight:700,color:p.pswStatus==='Approved'?'#155724':p.pswStatus==='Pending'?'#856404':'#6C757D'}}>{p.pswStatus||'Not Started'}</span>
                </div>
                {p.submissionDate && (
                  <div style={{fontSize:11,color:'#6C757D',marginTop:4}}>Submitted: {new Date(p.submissionDate).toLocaleDateString('en-IN')}</div>
                )}
              </div>
            </div>
          )
        })}
        {/* Add new card */}
        <div onClick={()=>nav('/qm/ppap/new')} style={{background:'#fff',borderRadius:8,border:'2px dashed #E0D5E0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:160,cursor:'pointer',color:'#714B67',gap:8}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#714B67';e.currentTarget.style.background='#FDF8FC'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#E0D5E0';e.currentTarget.style.background='#fff'}}>
          <div style={{fontSize:32}}>+</div>
          <div style={{fontWeight:700,fontSize:13}}>New PPAP Submission</div>
          <div style={{fontSize:11,color:'#999'}}>Start 18-element package</div>
        </div>
      </div>
    </div>
  )
}
