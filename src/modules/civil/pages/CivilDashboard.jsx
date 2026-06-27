import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const STATUS_COLORS = {
  ACTIVE:    { bg:'#E8F5E9', color:'#1E8449', label:'Active' },
  PLANNING:  { bg:'#EBF5FB', color:'#1A5276', label:'Planning' },
  ON_HOLD:   { bg:'#FEF9E7', color:'#B8860B', label:'On Hold' },
  COMPLETED: { bg:'#F0EBF0', color:'#714B67', label:'Completed' },
  CANCELLED: { bg:'#FDEDEC', color:'#C0392B', label:'Cancelled' },
}

export default function CivilDashboard() {
  const nav = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/civil/dashboard`, { headers:hdr() })
      .then(r=>r.json()).then(d=>{ setData(d.data); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [])

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading Civil Dashboard...</div>

  return (
    <div style={{background:'#F9F6F8',minHeight:'100vh',fontFamily:'DM Sans,Arial,sans-serif'}}>

      {/* Header Bar — tight, no gap */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',
        padding:'10px 16px',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontSize:20,fontWeight:800,color:'#6E2C00'}}>🏗️ Civil Dashboard</div>
          <div style={{fontSize:11,color:'#aaa',paddingLeft:8,borderLeft:'1px solid #E8E0E8'}}>Construction Project Management</div>
        </div>
        <button onClick={()=>nav('/civil/projects/new')}
          style={{padding:'7px 18px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12}}>
          + New Project
        </button>
      </div>

      {/* Stats Strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:10,marginBottom:12,padding:'0 4px'}}>
        {[
          ['Total Projects',  data?.total||0,                   '#6E2C00'],
          ['Active Sites',    data?.active||0,                  '#1E8449'],
          ['Contract Value',  fmtC(data?.contractValue||0),     '#1A5276'],
          ['RA Billed',       fmtC(data?.totalBilled||0),       '#D35400'],
          ['Planning',        data?.planning||0,                '#B8860B'],
          ['Completed',       data?.completed||0,               '#714B67'],
          ['Workers Today',   data?.todayWorkers||0,            '#117A65'],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:'#fff',borderRadius:10,padding:'12px 14px',
            boxShadow:'0 1px 4px rgba(0,0,0,.06)',borderLeft:`3px solid ${c}`}}>
            <div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:11,color:'#888',marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12,padding:'0 4px'}}>
        {(data?.projects||[]).map(p => {
          const sc  = STATUS_COLORS[p.status] || STATUS_COLORS.PLANNING
          const pct = p.progress || 0
          const labourCost     = Number(p.labourCost||0)
          const contractorCost = Number(p.contractorCost||0)
          const materialCost   = Number(p.materialCost||0)
          const actualCost     = labourCost + contractorCost + materialCost
          const overBudget     = actualCost > Number(p.contractValue||0) * 0.95
          return (
            <div key={p.id} onClick={()=>nav(`/civil/projects/${p.id}`)}
              style={{background:'#fff',borderRadius:12,padding:18,cursor:'pointer',
                boxShadow:'0 1px 6px rgba(0,0,0,.07)',border:`1px solid ${overBudget?'#C0392B':'#F0E8EC'}`,
                transition:'box-shadow .15s'}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.12)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,.07)'}>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:'#6E2C00'}}>{p.projectName}</div>
                  <div style={{fontSize:12,color:'#888',marginTop:2}}>{p.projectCode} · {p.clientName}</div>
                </div>
                <span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,
                  background:sc.bg,color:sc.color}}>{sc.label}</span>
              </div>

              {/* Progress bar */}
              <div style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <div style={{fontSize:12,color:'#555'}}>Overall Progress</div>
                  <div style={{fontSize:13,fontWeight:700,color:pct>=80?'#1E8449':pct>=50?'#B8860B':'#C0392B'}}>{pct}%</div>
                </div>
                <div style={{height:8,background:'#F0E8EC',borderRadius:4,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:pct>=80?'#1E8449':pct>=50?'#B8860B':'#C0392B',borderRadius:4,transition:'width .3s'}} />
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                {[
                  ['📍',p.siteLocation||'—','Site'],
                  ['💰',fmtC(p.contractValue),'Contract'],
                  ['📅',fmtD(p.targetDate),'Target'],
                ].map(([icon,val,label])=>(
                  <div key={label} style={{background:'#F9F6F8',borderRadius:6,padding:'6px 10px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:'#888'}}>{icon} {label}</div>
                    <div style={{fontSize:12,fontWeight:600,color:'#2C3E50',marginTop:2}}>{val}</div>
                  </div>
                ))}
              </div>

              {p.supervisor && (
                <div style={{marginTop:10,fontSize:12,color:'#888'}}>
                  👷 Supervisor: <strong style={{color:'#555'}}>{p.supervisor}</strong>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Recent DPRs */}
      {(data?.recentDPRs||[]).length > 0 && (
        <div style={{background:'#fff',borderRadius:8,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)',margin:'0 4px 12px'}}>
          <div style={{fontSize:15,fontWeight:700,color:'#6E2C00',marginBottom:14}}>📅 Recent Daily Progress Reports</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{background:'#6E2C00',color:'#fff'}}>
                {['DPR No','Project','Date','Supervisor','Issues'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:12,fontWeight:600}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentDPRs.map((d,i)=>(
                <tr key={d.id} style={{background:i%2===0?'#fff':'#FDF2E9',borderBottom:'1px solid #F5EDE0'}}>
                  <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:12,color:'#6E2C00',fontWeight:700}}>{d.dprNo}</td>
                  <td style={{padding:'8px 12px',fontWeight:600}}>{d.project?.projectName||'—'}</td>
                  <td style={{padding:'8px 12px',fontSize:12,color:'#888'}}>{fmtD(d.date)}</td>
                  <td style={{padding:'8px 12px'}}>{d.supervisor}</td>
                  <td style={{padding:'8px 12px',fontSize:12,color:d.issues?'#C0392B':'#888'}}>{d.issues||'No issues'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {(!data?.projects || data.projects.length === 0) && (
        <div style={{textAlign:'center',padding:40,background:'#fff',borderRadius:8,boxShadow:'0 1px 4px rgba(0,0,0,.06)',margin:'0 4px'}}>
          <div style={{fontSize:56,marginBottom:16}}>🏗️</div>
          <div style={{fontSize:18,fontWeight:700,color:'#6E2C00',marginBottom:8}}>No Projects Yet</div>
          <div style={{fontSize:13,color:'#888',marginBottom:20}}>Create your first construction project to get started</div>
          <button onClick={()=>nav('/civil/projects/new')}
            style={{padding:'10px 24px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:14}}>
            + Create First Project
          </button>
        </div>
      )}
    </div>
  )
}
