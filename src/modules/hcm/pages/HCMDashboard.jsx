import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ Authorization: `Bearer ${getToken()}` })

export default function HCMDashboard() {
  const nav   = useNavigate()
  const today = new Date().toLocaleDateString('en-IN',{
    weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const todayDate = new Date().toISOString().split('T')[0]
  const todayMonth = new Date().getMonth()+1
  const todayYear  = new Date().getFullYear()

  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [bdays,     setBdays]     = useState([])
  const [pending,   setPending]   = useState({ leave:0, exit:0, jobs:0, mrf:0 })
  const [deptAtt,   setDeptAtt]   = useState([])
  const [todayAtt,  setTodayAtt]  = useState({ present:0, absent:0, late:0, onLeave:0 })

  useEffect(() => {
    const h = authHdrs()
    Promise.all([
      // Total employees
      fetch(`${BASE_URL}/employees`, { headers:h }).then(r=>r.json()),
      // Today's attendance
      fetch(`${BASE_URL}/attendance/register?month=${todayMonth}&year=${todayYear}`,
        { headers:h }).then(r=>r.json()),
      // Pending leaves
      fetch(`${BASE_URL}/leave/applications?status=PENDING`, { headers:h }).then(r=>r.json()),
      // Exit management
      fetch(`${BASE_URL}/exit`, { headers:h }).then(r=>r.json()),
      // Job openings
      fetch(`${BASE_URL}/recruitment/jobs`, { headers:h }).then(r=>r.json()),
      // MRF pending
      fetch(`${BASE_URL}/mrf`, { headers:h }).then(r=>r.json()),
    ]).then(([empData, attData, leaveData, exitData, jobData, mrfData]) => {
      const employees = empData.data || []
      const allAtt    = attData.data || []

      // Today's attendance
      const todayRecs = allAtt.filter(r =>
        r.attendanceDate?.split('T')[0] === todayDate)
      const present   = todayRecs.filter(r=>['PRESENT','LATE','OD'].includes(r.status)).length
      const absent    = todayRecs.filter(r=>['ABSENT','LOP'].includes(r.status)).length
      const late      = todayRecs.filter(r=>r.isLate).length
      const onLeave   = todayRecs.filter(r=>r.status==='LEAVE').length

      setTodayAtt({ present, absent, late, onLeave })

      // Dept wise attendance today
      const deptMap = {}
      employees.forEach(e => {
        if (!e.department) return
        if (!deptMap[e.department]) deptMap[e.department]={ dept:e.department, total:0, present:0 }
        deptMap[e.department].total++
      })
      todayRecs.forEach(r => {
        if (!r.department) return
        if (!deptMap[r.department]) deptMap[r.department]={ dept:r.department, total:0, present:0 }
        if (['PRESENT','LATE','OD'].includes(r.status)) deptMap[r.department].present++
      })
      const deptArr = Object.values(deptMap).map(d=>({
        ...d, pct: d.total>0?Math.round(d.present/d.total*100):0
      })).sort((a,b)=>b.total-a.total).slice(0,6)
      setDeptAtt(deptArr)

      // Birthday check
      const todayMD = `${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`
      const bdays = employees.filter(e => {
        if (!e.dob) return false
        const dob = new Date(e.dob)
        const md  = `${String(dob.getMonth()+1).padStart(2,'0')}-${String(dob.getDate()).padStart(2,'0')}`
        return md === todayMD
      }).map(e => {
        const extra = (() => { try { return JSON.parse(e.remarks||'{}') } catch { return {} } })()
        const yrs = e.doj ? new Date().getFullYear() - new Date(e.doj).getFullYear() : 0
        return { name:e.name, dept:e.department, emp:e.empCode, yrs }
      })
      setBdays(bdays)

      // Pending actions
      const pendingLeave = (leaveData.data||[]).length
      const pendingExit  = (exitData.data||[]).filter(e=>e.fnfStatus!=='Completed').length
      const openJobs     = (jobData.data||[]).filter(j=>j.status==='Open').length
      const pendingMRF   = (mrfData.data||[]).filter(m=>['SUBMITTED','HR_REVIEW'].includes(m.status)).length
      setPending({ leave:pendingLeave, exit:pendingExit, jobs:openJobs, mrf:pendingMRF })

      setStats({
        total:    employees.length,
        present,
        attPct:   employees.length>0?Math.round(present/employees.length*100):0,
        onLeave,
        late,
        absent,
      })
      setLoading(false)
    }).catch(e => { toast.error(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>
      ⏳ Loading HCM Dashboard...
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">HCM Dashboard <small>{today}</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm"
            onClick={()=>nav('/hcm/attendance')}>📋 Attendance</button>
          <button className="btn btn-p sd-bsm"
            onClick={()=>nav('/hcm/employees/new')}>+ New Employee</button>
        </div>
      </div>

      {/* Birthday wishes */}
      {bdays.length > 0 && (
        <div style={{ display:'grid',
          gridTemplateColumns:`repeat(${Math.min(bdays.length,3)},1fr)`,
          gap:12, marginBottom:18 }}>
          {bdays.map(b=>(
            <div key={b.emp} className="bday-card">
              <div style={{ fontSize:28, marginBottom:6 }}>🎂</div>
              <div style={{ fontSize:16, fontWeight:800,
                fontFamily:'Syne,sans-serif' }}>{b.name}</div>
              <div style={{ fontSize:11, opacity:.8 }}>
                {b.dept} · {b.emp} · {b.yrs} years with us 🎉
              </div>
              <button style={{ marginTop:10,
                background:'rgba(255,255,255,.2)',
                border:'1.5px solid rgba(255,255,255,.5)',
                color:'#fff', borderRadius:6, padding:'5px 14px',
                cursor:'pointer', fontSize:12, fontWeight:700 }}>
                🎊 Send Wishes
              </button>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="hcm-kpi-grid">
        {[
          { cls:'purple', ic:'👥', l:'Total Employees', v:stats?.total||0,
            s:'Active headcount', tr:`${stats?.onLeave||0} on leave today` },
          { cls:'green',  ic:'✅', l:'Present Today',
            v:`${stats?.present||0}`,
            s:`${stats?.attPct||0}% attendance`,
            tr:`${stats?.late||0} late · ${stats?.absent||0} absent` },
          { cls:'orange', ic:'⏳', l:'Pending Approvals',
            v:pending.leave+pending.mrf,
            s:'Leave + MRF requests',
            tr:`${pending.leave} leave · ${pending.mrf} MRF` },
          { cls:'blue',   ic:'💼', l:'Open Positions',
            v:pending.jobs,
            s:'Active job openings',
            tr:`${pending.exit} exit pending F&F` },
        ].map(k=>(
          <div key={k.l} className={`hcm-kpi-card ${k.cls}`}>
            <div className="hcm-kpi-icon">{k.ic}</div>
            <div className="hcm-kpi-label">{k.l}</div>
            <div className="hcm-kpi-value">{k.v}</div>
            <div className="hcm-kpi-trend">{k.tr}</div>
            <div className="hcm-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Dept Attendance */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3>📊 Attendance Today — Dept. Wise</h3>
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav('/hcm/attendance')}>Full Register</button>
          </div>
          <div className="fi-panel-body">
            {deptAtt.length === 0 ? (
              <div style={{ fontSize:12, color:'#6C757D', textAlign:'center',
                padding:'20px 0' }}>
                No attendance processed today.<br/>
                <span style={{ color:'#714B67', cursor:'pointer', fontWeight:600 }}
                  onClick={()=>nav('/hcm/attendance')}>
                  Go to Attendance Register →
                </span>
              </div>
            ) : deptAtt.map(d=>(
              <div key={d.dept} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  fontSize:12, marginBottom:4 }}>
                  <strong>{d.dept}</strong>
                  <span style={{ fontWeight:700,
                    color:d.pct===100?'var(--odoo-green)':
                      d.pct>=90?'var(--odoo-orange)':'var(--odoo-red)' }}>
                    {d.present}/{d.total} · {d.pct}%
                  </span>
                </div>
                <div style={{ background:'#F0EEEB', borderRadius:4, height:7 }}>
                  <div style={{ width:`${d.pct}%`, height:'100%', borderRadius:4,
                    background:d.pct===100?'var(--odoo-green)':
                      d.pct>=90?'var(--odoo-orange)':'var(--odoo-red)',
                    transition:'width .5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>⚡ Pending Actions</h3></div>
          <div className="fi-panel-body">
            {[
              { type:'Leave Approvals',       count:pending.leave, route:'/hcm/leave/approval',  clr:'#E06F39' },
              { type:'Manpower Requisitions', count:pending.mrf,   route:'/hcm/mrf',             clr:'#714B67' },
              { type:'Open Job Positions',    count:pending.jobs,  route:'/hcm/jobs',            clr:'#2874A6' },
              { type:'Exit F&F Pending',      count:pending.exit,  route:'/hcm/exit',            clr:'#DC3545' },
            ].map(p=>(
              <div key={p.type} onClick={()=>nav(p.route)}
                style={{ display:'flex', alignItems:'center', gap:12,
                  padding:'10px 0', borderBottom:'1px solid var(--odoo-border)',
                  cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='#F8F4F8'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:40, height:40, borderRadius:8,
                  background:`${p.clr}22`, display:'flex',
                  alignItems:'center', justifyContent:'center',
                  fontFamily:'Syne,sans-serif', fontWeight:800,
                  color:p.clr, fontSize:18 }}>{p.count}</div>
                <div style={{ flex:1, fontSize:13, fontWeight:600 }}>{p.type}</div>
                <span style={{ color:'var(--odoo-gray)', fontSize:18 }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="fi-panel" style={{ marginTop:0 }}>
        <div className="fi-panel-hdr"><h3>🚀 Quick Actions</h3></div>
        <div className="fi-panel-body">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
            {[
              { label:'New Employee',      icon:'👤', route:'/hcm/employees/new',   clr:'#714B67' },
              { label:'Apply Leave',       icon:'🌴', route:'/hcm/leave/register',  clr:'#155724' },
              { label:'Attendance',        icon:'📋', route:'/hcm/attendance',      clr:'#0C5460' },
              { label:'New Requisition',   icon:'📝', route:'/hcm/mrf',             clr:'#856404' },
              { label:'Payroll Process',   icon:'💰', route:'/hcm/pay/process',     clr:'#2874A6' },
              { label:'Increment Policy',  icon:'📈', route:'/hcm/increment',       clr:'#E06F39' },
            ].map(q=>(
              <div key={q.label} onClick={()=>nav(q.route)}
                style={{ padding:'14px 10px', background:`${q.clr}11`,
                  borderRadius:8, textAlign:'center', cursor:'pointer',
                  border:`1px solid ${q.clr}33`,
                  transition:'all .2s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=`${q.clr}22`
                  e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={e=>{ e.currentTarget.style.background=`${q.clr}11`
                  e.currentTarget.style.transform='translateY(0)' }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{q.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:q.clr }}>
                  {q.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
