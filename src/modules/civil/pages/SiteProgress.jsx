import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

export default function SiteProgress() {
  const nav = useNavigate()
  const [projects, setProjects] = useState([])
  const [selProject, setSelProject] = useState('')
  const [dprs, setDPRs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,{headers:hdr2()}).then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{})
  },[])

  const load = useCallback(async (pid) => {
    if (!pid) return
    setLoading(true)
    const r = await fetch(`${BASE}/civil/dpr/${pid}`,{headers:hdr2()})
    const d = await r.json()
    setDPRs(d.data||[])
    setLoading(false)
  },[])

  useEffect(()=>{ load(selProject) },[selProject,load])

  return (
    <div style={{background:'#F9F6F8',minHeight:'100vh',fontFamily:'DM Sans,Arial,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:'#6E2C00'}}>📅 Site Progress (DPR Register)</div>
          <div style={{fontSize:12,color:'#888'}}>{dprs.length} DPR entries</div>
        </div>
        <button onClick={()=>nav('/civil/dpr/new')}
          style={{padding:'9px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>
          + New DPR Entry
        </button>
      </div>

      {/* Project filter */}
      <div style={{background:'#fff',borderRadius:10,padding:'12px 16px',marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <select value={selProject} onChange={e=>setSelProject(e.target.value)}
          style={{width:400,padding:'9px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none'}}>
          <option value=''>— All Projects —</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
        </select>
      </div>

      {/* DPR List */}
      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 6px rgba(0,0,0,.07)',overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
        ) : dprs.length === 0 ? (
          <div style={{padding:60,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>📅</div>
            <div style={{fontSize:16,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No DPR entries yet</div>
            <button onClick={()=>nav('/civil/dpr/new')}
              style={{padding:'9px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>
              + First DPR Entry
            </button>
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{background:'#6E2C00',color:'#fff'}}>
                {['DPR No','Date','Supervisor','Weather','Activities Updated','Issues','Remarks','Action'].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dprs.map((d,i)=>{
                const acts = (() => { try { return JSON.parse(d.activities||'[]') } catch { return [] } })()
                return (
                  <tr key={d.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                    <td style={{padding:'10px 12px',fontFamily:'monospace',fontSize:11,color:'#6E2C00',fontWeight:700}}>{d.dprNo}</td>
                    <td style={{padding:'10px 12px',fontWeight:600}}>{fmtD(d.date)}</td>
                    <td style={{padding:'10px 12px'}}>{d.supervisor}</td>
                    <td style={{padding:'10px 12px',color:'#555',fontSize:12}}>{d.weather}</td>
                    <td style={{padding:'10px 12px',textAlign:'center'}}>
                      <span style={{padding:'3px 10px',background:'#E8F5E9',color:'#1E8449',borderRadius:12,fontSize:11,fontWeight:700}}>
                        {acts.length} activities
                      </span>
                    </td>
                    <td style={{padding:'10px 12px',fontSize:12,color:d.issues?'#C0392B':'#888',maxWidth:160,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.issues||'—'}</td>
                    <td style={{padding:'10px 12px',fontSize:12,color:'#555',maxWidth:160,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.remarks||'—'}</td>
                    <td style={{padding:'10px 12px'}}>
                      <button onClick={()=>nav(`/civil/projects/${d.projectId}`)}
                        style={{padding:'4px 10px',background:'#FDF2E9',color:'#6E2C00',border:'none',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:600}}>
                        Project →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
