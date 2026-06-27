import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN')

export default function EduDashboard() {
  const nav = useNavigate()
  const [institutions, setInstitutions] = useState([])
  const [selInst,      setSelInst]      = useState(() => localStorage.getItem('lnv_edu_inst') || '')
  const [stats, setStats] = useState({
    totalStudents:0, presentToday:0, absentToday:0,
    feeCollectedToday:0, feePending:0, totalStaff:0,
    staffPresent:0, busesRunning:0
  })

  useEffect(()=>{
    fetch(`${BASE}/edu/institutions`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>{ 
        setInstitutions(d.data||[])
        if (!selInst && d.data?.[0]) {
          setSelInst(String(d.data[0].id))
          localStorage.setItem('lnv_edu_inst', String(d.data[0].id))
        }
      }).catch(()=>{})
  },[])

  useEffect(()=>{
    if (!selInst) return
    fetch(`${BASE}/edu/dashboard?institutionId=${selInst}`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>{ if(d.data) setStats(d.data) }).catch(()=>{})
  },[selInst])

  const today = new Date().toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})
  const attPct = stats.totalStudents > 0 ? ((stats.presentToday/stats.totalStudents)*100).toFixed(1) : 0

  const STAT_CARDS = [
    { label:'Total Students',      value:stats.totalStudents,         icon:'👨‍🎓', color:'#6E2C00', bg:'#FDF2E9', path:'/edu/students' },
    { label:'Present Today',       value:stats.presentToday,          icon:'✅',    color:'#1E8449', bg:'#E8F5E9', path:'/edu/attendance/student' },
    { label:'Absent Today',        value:stats.absentToday,           icon:'❌',    color:'#C0392B', bg:'#FDEDEC', path:'/edu/attendance/student' },
    { label:'Attendance %',        value:`${attPct}%`,                icon:'📊',    color:'#1A5276', bg:'#EBF5FB', path:'/edu/reports' },
    { label:'Fee Collected Today', value:fmtC(stats.feeCollectedToday),icon:'💰',   color:'#1E8449', bg:'#E8F5E9', path:'/edu/fee-collection' },
    { label:'Fee Pending',         value:fmtC(stats.feePending),      icon:'⚠️',    color:'#B8860B', bg:'#FEF9E7', path:'/edu/fee-reports' },
    { label:'Total Staff',         value:stats.totalStaff,            icon:'👩‍🏫',   color:'#714B67', bg:'#F0EBF0', path:'/edu/staff' },
    { label:'Buses Running',       value:stats.busesRunning,          icon:'🚌',    color:'#117A65', bg:'#E8F8F5', path:'/edu/bus-tracking' },
  ]

  const QUICK_ACTIONS = [
    { label:'Mark Attendance',    icon:'✅', path:'/edu/attendance/student', color:'#1E8449' },
    { label:'Collect Fee',        icon:'💵', path:'/edu/fee-collection',     color:'#6E2C00' },
    { label:'New Admission',      icon:'➕', path:'/edu/students/new',       color:'#1A5276' },
    { label:'Enter Marks',        icon:'📝', path:'/edu/marks',             color:'#B8860B' },
    { label:'Send Notice',        icon:'📢', path:'/edu/notices',           color:'#714B67' },
    { label:'Bus Tracking',       icon:'📍', path:'/edu/bus-tracking',      color:'#117A65' },
    { label:'Issue Book',         icon:'📚', path:'/edu/library/issue',     color:'#D35400' },
    { label:'View Reports',       icon:'📊', path:'/edu/reports',           color:'#2C3E50' },
  ]

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:14}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>🏫 Education Dashboard</div>
          <div style={{fontSize:11,color:'#888'}}>📅 {today}</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {/* Institution Switcher */}
          {institutions.length > 0 && (
            <select value={selInst}
              onChange={e=>{
                setSelInst(e.target.value)
                localStorage.setItem('lnv_edu_inst',e.target.value)
                // Notify EduLayout to update sidebar
                window.dispatchEvent(new Event('storage'))
              }}
              style={{padding:'6px 12px',border:'2px solid #6E2C00',borderRadius:6,
                fontSize:12,fontWeight:700,color:'#6E2C00',background:'#FDF2E9',outline:'none',cursor:'pointer'}}>
              {institutions.map(i=>(
                <option key={i.id} value={i.id}>{i.type==='SCHOOL'?'🏫':'🎓'} {i.shortName||i.name}</option>
              ))}
            </select>
          )}
          <button onClick={()=>nav('/edu/students/new')}
            style={{padding:'7px 16px',background:'#6E2C00',color:'#fff',border:'none',
              borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
            + New Admission
          </button>
          <button onClick={()=>nav('/edu/fee-collection')}
            style={{padding:'7px 16px',background:'#1E8449',color:'#fff',border:'none',
              borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
            💵 Collect Fee
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {STAT_CARDS.map(s=>(
          <div key={s.label} onClick={()=>nav(s.path)}
            style={{background:'#fff',border:`1px solid ${s.color}22`,borderRadius:10,
              padding:'14px 16px',cursor:'pointer',borderLeft:`4px solid ${s.color}`,
              transition:'all .15s',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{fontSize:11,color:'#888',fontWeight:600}}>{s.label}</div>
              <div style={{fontSize:22}}>{s.icon}</div>
            </div>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:'#555',marginBottom:10}}>⚡ Quick Actions</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:10}}>
          {QUICK_ACTIONS.map(a=>(
            <button key={a.label} onClick={()=>nav(a.path)}
              style={{background:'#fff',border:`1.5px solid ${a.color}33`,borderRadius:10,
                padding:'14px 8px',cursor:'pointer',textAlign:'center',
                display:'flex',flexDirection:'column',gap:6,alignItems:'center',
                transition:'all .15s'}}>
              <div style={{fontSize:26}}>{a.icon}</div>
              <div style={{fontSize:10,fontWeight:700,color:a.color,lineHeight:1.3}}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Two column layout */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>

        {/* Attendance Summary */}
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:10,overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#1E8449,#27AE60)',padding:'10px 16px',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>✅ Today's Attendance</div>
            <button onClick={()=>nav('/edu/attendance/student')}
              style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',
                borderRadius:4,padding:'3px 10px',cursor:'pointer',fontSize:11}}>Mark →</button>
          </div>
          <div style={{padding:16}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:28,fontWeight:800,color:'#1E8449'}}>{stats.presentToday}</div>
                <div style={{fontSize:11,color:'#888'}}>Present</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:28,fontWeight:800,color:'#C0392B'}}>{stats.absentToday}</div>
                <div style={{fontSize:11,color:'#888'}}>Absent</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:28,fontWeight:800,color:'#1A5276'}}>{attPct}%</div>
                <div style={{fontSize:11,color:'#888'}}>Attendance</div>
              </div>
            </div>
            <div style={{height:10,background:'#F0F0F0',borderRadius:5,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${attPct}%`,
                background:attPct>=90?'#1E8449':attPct>=75?'#B8860B':'#C0392B',borderRadius:5}}/>
            </div>
            <div style={{fontSize:10,color:'#aaa',marginTop:6,textAlign:'center'}}>
              {attPct >= 90 ? '🎉 Excellent attendance today!' :
               attPct >= 75 ? '⚠️ Below 90% target' : '🚨 Critical — below 75%'}
            </div>
          </div>
        </div>

        {/* Fee Summary */}
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:10,overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#6E2C00,#8B3A00)',padding:'10px 16px',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>💰 Fee Summary</div>
            <button onClick={()=>nav('/edu/fee-collection')}
              style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',
                borderRadius:4,padding:'3px 10px',cursor:'pointer',fontSize:11}}>Collect →</button>
          </div>
          <div style={{padding:16}}>
            {[
              ['Collected Today', fmtC(stats.feeCollectedToday), '#1E8449'],
              ['Pending Fees',    fmtC(stats.feePending),         '#C0392B'],
            ].map(([l,v,c])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',
                padding:'10px 0',borderBottom:'1px solid #F5F0F5'}}>
                <div style={{fontSize:13,color:'#555'}}>{l}</div>
                <div style={{fontSize:15,fontWeight:700,color:c}}>{v}</div>
              </div>
            ))}
            <button onClick={()=>nav('/edu/fee-reports')}
              style={{marginTop:12,width:'100%',padding:'8px',background:'#FDF2E9',
                border:'1px solid #6E2C00',borderRadius:5,cursor:'pointer',
                color:'#6E2C00',fontWeight:700,fontSize:12}}>
              View Fee Reports →
            </button>
          </div>
        </div>

        {/* Bus Live Status */}
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:10,overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#117A65,#138D75)',padding:'10px 16px',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>🚌 Bus Status</div>
            <button onClick={()=>nav('/edu/bus-tracking')}
              style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',
                borderRadius:4,padding:'3px 10px',cursor:'pointer',fontSize:11}}>Live →</button>
          </div>
          <div style={{padding:16,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:8}}>🚌</div>
            <div style={{fontSize:15,fontWeight:700,color:'#117A65'}}>{stats.busesRunning} Buses Running</div>
            <div style={{fontSize:11,color:'#888',marginTop:4}}>Click Live Tracking for GPS view</div>
            <button onClick={()=>nav('/edu/bus-tracking')}
              style={{marginTop:12,padding:'8px 20px',background:'#117A65',color:'#fff',
                border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
              📍 Open Live Map
            </button>
          </div>
        </div>

        {/* Upcoming Events */}
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:10,overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#1A5276,#21618C)',padding:'10px 16px',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>📅 Upcoming</div>
            <button onClick={()=>nav('/edu/exams')}
              style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',
                borderRadius:4,padding:'3px 10px',cursor:'pointer',fontSize:11}}>View All →</button>
          </div>
          <div style={{padding:16}}>
            {[
              { date:'25 Jun', event:'Unit Test 1 — Class 9 & 10', type:'EXAM', color:'#C0392B' },
              { date:'28 Jun', event:'Fee Last Date — June Month',  type:'FEE',  color:'#B8860B' },
              { date:'30 Jun', event:'PTM — All Classes 10 AM',    type:'EVENT', color:'#1A5276' },
              { date:'01 Jul', event:'Term 2 Begins',              type:'ACAD', color:'#1E8449' },
            ].map((e,i)=>(
              <div key={i} style={{display:'flex',gap:12,padding:'8px 0',
                borderBottom:'1px solid #F5F0F5',alignItems:'center'}}>
                <div style={{background:`${e.color}22`,color:e.color,borderRadius:6,
                  padding:'4px 8px',fontSize:11,fontWeight:700,minWidth:50,textAlign:'center'}}>
                  {e.date}
                </div>
                <div style={{fontSize:12,color:'#555',flex:1}}>{e.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
