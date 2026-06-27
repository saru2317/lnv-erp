import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const today = () => new Date().toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})
const fmtC  = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})

export default function TabletHome() {
  const nav = useNavigate()
  const [projects, setProjects] = useState([])
  const [selProject, setSelProject] = useState('')
  const [proj, setProj] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const supervisor = JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name || 'Supervisor'

  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>{
        setProjects(d.data||[])
        // Auto-select first active project
        const active = (d.data||[]).find(p=>p.status==='ACTIVE')
        if (active) { setSelProject(String(active.id)); setProj(active) }
        setLoading(false)
      }).catch(()=>setLoading(false))
  },[])

  useEffect(()=>{
    if (!selProject) return
    const p = projects.find(p=>String(p.id)===selProject)
    setProj(p||null)
    // Load today's stats
    fetch(`${BASE}/civil/labour/${selProject}`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>{
        const today = new Date().toISOString().slice(0,10)
        const todayLab = (d.data||[]).filter(l=>l.date?.slice(0,10)===today)
        const workers = todayLab.reduce((s,l)=>s+l.totalWorkers,0)
        setStats({ workers })
      }).catch(()=>{})
  },[selProject, projects])

  const MENU = [
    { icon:'📅', label:'Daily Progress\nReport (DPR)',  color:'#6E2C00', bg:'#FDF2E9', border:'#6E2C00', path:'/civil/dpr/new',        desc:'Update activity % completion' },
    { icon:'👷', label:'Labour\nAttendance',             color:'#1E8449', bg:'#E8F5E9', border:'#1E8449', path:'/civil/labour',          desc:'Mark workers present today' },
    { icon:'📦', label:'Issue\nMaterials',               color:'#1A5276', bg:'#EBF5FB', border:'#1A5276', path:'/civil/issue-slip',      desc:'Issue from site stock' },
    { icon:'📋', label:'Raise Material\nIndent',         color:'#B8860B', bg:'#FEF9E7', border:'#B8860B', path:'/civil/indent',          desc:'Request materials from office' },
    { icon:'🏗',  label:'Concrete\nPour Entry',          color:'#117A65', bg:'#E8F8F5', border:'#117A65', path:'/civil/dpr/new',         desc:'Record RMC or site mix pour' },
    { icon:'⚠️', label:'Report\nIssue / Problem',       color:'#C0392B', bg:'#FDEDEC', border:'#C0392B', path:'/civil/dpr/new',         desc:'Log site problems today' },
  ]

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'#1a1a2e',fontFamily:'DM Sans,sans-serif'}}>
      <div style={{textAlign:'center',color:'#fff'}}>
        <div style={{fontSize:48,marginBottom:16}}>🏗️</div>
        <div style={{fontSize:20,fontWeight:700}}>Loading...</div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#1C0A00',fontFamily:'DM Sans,Arial,sans-serif'}}>

      {/* Top Header */}
      <div style={{background:'linear-gradient(135deg,#6E2C00,#8B3A00)',padding:'28px 28px 20px',
        borderBottom:'3px solid #B8680040'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:13,color:'#FDEBD0',marginBottom:4,fontWeight:600}}>
              🏗️ LNV ERP — Site Supervisor
            </div>
            <div style={{fontSize:30,fontWeight:800,color:'#fff',marginBottom:6}}>
              Good Day, {supervisor}! 👷
            </div>
            <div style={{fontSize:16,color:'#E8C9A0',fontWeight:600}}>📅 {today()}</div>
          </div>
          <button onClick={()=>nav('/civil')}
            style={{padding:'8px 14px',background:'rgba(255,255,255,.15)',color:'#fff',
              border:'1px solid rgba(255,255,255,.3)',borderRadius:8,cursor:'pointer',
              fontSize:12,fontWeight:600}}>
            🖥️ Office View
          </button>
        </div>

        {/* Project Selector */}
        <div style={{marginTop:16}}>
          <div style={{fontSize:11,color:'#FDEBD0',marginBottom:6,fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>
            📍 Active Project
          </div>
          <select value={selProject} onChange={e=>setSelProject(e.target.value)}
            style={{width:'100%',padding:'16px 18px',background:'rgba(255,255,255,.15)',
              color:'#fff',border:'1.5px solid rgba(255,255,255,.3)',borderRadius:12,
              fontSize:18,fontWeight:700,outline:'none',cursor:'pointer'}}>
            <option value='' style={{color:'#333'}}>— Select Project —</option>
            {projects.map(p=>(
              <option key={p.id} value={p.id} style={{color:'#333'}}>
                {p.projectCode} — {p.projectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Project Stats Strip */}
      {proj && (
        <div style={{background:'#2C1000',padding:'14px 20px',
          display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10}}>
          {[
            ['Progress',  `${proj.progress||0}%`,     proj.progress>=80?'#1E8449':proj.progress>=50?'#B8860B':'#C0392B'],
            ['Client',     proj.clientName?.split(' ')[0]||'—', '#E8C9A0'],
            ['Workers',    stats?.workers||'0',         '#1E8449'],
            ['Status',     proj.status||'—',            '#B8860B'],
          ].map(([l,v,c])=>(
            <div key={l} style={{textAlign:'center',background:'rgba(255,255,255,.06)',
              borderRadius:8,padding:'10px 6px'}}>
              <div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:13,color:'#B8A090',marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {proj && (
        <div style={{padding:'12px 20px',background:'#240D00'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <div style={{fontSize:12,color:'#B8A090'}}>Overall Progress</div>
            <div style={{fontSize:13,fontWeight:700,
              color:proj.progress>=80?'#1E8449':proj.progress>=50?'#B8860B':'#C0392B'}}>
              {proj.progress||0}%
            </div>
          </div>
          <div style={{height:10,background:'rgba(255,255,255,.1)',borderRadius:5,overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:5,transition:'width .5s',
              width:`${proj.progress||0}%`,
              background:proj.progress>=80?'#1E8449':proj.progress>=50?'#B8860B':'#C0392B'}}/>
          </div>
        </div>
      )}

      {/* Main Menu Grid */}
      <div style={{padding:20}}>
        <div style={{fontSize:16,color:'#B8A090',fontWeight:700,marginBottom:18,
          textTransform:'uppercase',letterSpacing:.5}}>
          Today's Tasks
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
          {MENU.map((item,i)=>(
            <button key={i}
              onClick={()=>{
                if (!selProject && item.path !== '/civil') {
                  toast.error('Select a project first!')
                  return
                }
                nav(item.path)
              }}
              style={{background:item.bg,border:`3px solid ${item.border}`,
                borderRadius:20,padding:'28px 20px',cursor:'pointer',
                textAlign:'left',transition:'all .15s',
                boxShadow:'0 6px 20px rgba(0,0,0,.4)',
                display:'flex',flexDirection:'column',gap:10}}>
              <div style={{fontSize:52,lineHeight:1}}>{item.icon}</div>
              <div style={{fontSize:20,fontWeight:800,color:item.color,lineHeight:1.3,
                whiteSpace:'pre-line'}}>{item.label}</div>
              <div style={{fontSize:13,color:'#777',marginTop:4}}>{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Info */}
      {proj && (
        <div style={{padding:'0 20px 20px'}}>
          <div style={{background:'rgba(255,255,255,.05)',borderRadius:12,padding:16,
            border:'1px solid rgba(255,255,255,.1)'}}>
            <div style={{fontSize:12,color:'#B8A090',fontWeight:700,marginBottom:10,
              textTransform:'uppercase',letterSpacing:.5}}>📍 Site Info</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[
                ['Project',    proj.projectName],
                ['Client',     proj.clientName],
                ['Location',   proj.siteLocation||'—'],
                ['Supervisor', proj.supervisor||'—'],
                ['Contract',   fmtC(proj.contractValue)],
                ['Target',     proj.targetDate ? new Date(proj.targetDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'],
              ].map(([l,v])=>(
                <div key={l} style={{background:'rgba(255,255,255,.06)',borderRadius:8,padding:'8px 10px'}}>
                  <div style={{fontSize:10,color:'#888',marginBottom:2}}>{l}</div>
                  <div style={{fontSize:12,fontWeight:700,color:'#E8D0C0',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <div style={{padding:40,textAlign:'center'}}>
          <div style={{fontSize:60,marginBottom:16}}>🏗️</div>
          <div style={{fontSize:18,fontWeight:700,color:'#E8C9A0',marginBottom:8}}>No Projects Assigned</div>
          <div style={{fontSize:13,color:'#888'}}>Contact your project manager</div>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{position:'sticky',bottom:0,background:'#150700',
        borderTop:'2px solid rgba(255,255,255,.15)',
        display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',padding:'12px 0'}}>
        {[
          { icon:'🏠', label:'Home',     path:'/civil/tablet' },
          { icon:'📊', label:'Progress', path:'/civil/progress' },
          { icon:'📦', label:'Stock',    path:'/civil/site-stock' },
          { icon:'🖥️', label:'Office',   path:'/civil' },
        ].map(item=>(
          <button key={item.label} onClick={()=>nav(item.path)}
            style={{background:'transparent',border:'none',cursor:'pointer',
              padding:'8px 4px',textAlign:'center'}}>
            <div style={{fontSize:28}}>{item.icon}</div>
            <div style={{fontSize:13,color:'#B8A090',marginTop:4,fontWeight:600}}>{item.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
