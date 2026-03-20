import React from 'react'
import { useNavigate } from 'react-router-dom'

const TODAY_BDAYS = [
  {name:'Rajesh Kumar',dept:'Production',emp:'EMP-004',yrs:5},
  {name:'Priya Devi',dept:'Accounts',emp:'EMP-018',yrs:2},
]

const PENDING = [
  {type:'Leave Approval',count:6,route:'/hcm/leave/approval',clr:'var(--odoo-orange)'},
  {type:'OT Approval',count:12,route:'/hcm/overtime',clr:'var(--odoo-blue)'},
  {type:'Exit Clearance',count:1,route:'/hcm/exit',clr:'var(--odoo-red)'},
  {type:'Open Positions',count:4,route:'/hcm/jobs',clr:'var(--odoo-purple)'},
]

const DEPT_ATT = [
  {dept:'Production',present:42,total:45,pct:93.3},
  {dept:'Quality',present:12,total:12,pct:100},
  {dept:'Accounts',present:8,total:9,pct:88.9},
  {dept:'Maintenance',present:7,total:8,pct:87.5},
  {dept:'HR & Admin',present:5,total:5,pct:100},
  {dept:'Warehouse',present:10,total:11,pct:90.9},
]

export default function HCMDashboard() {
  const nav = useNavigate()
  const today = new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">HCM Dashboard <small>{today}</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/hcm/attendance')}>Mark Attendance</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/hcm/employees/new')}>New Employee</button>
        </div>
      </div>

      {/* Birthday wishes */}
      {TODAY_BDAYS.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:`repeat(${TODAY_BDAYS.length},1fr)`,gap:'12px',marginBottom:'18px'}}>
          {TODAY_BDAYS.map(b=>(
            <div key={b.emp} className="bday-card">
              <div style={{fontSize:'28px',marginBottom:'6px'}}></div>
              <div style={{fontSize:'16px',fontWeight:'800',fontFamily:'Syne,sans-serif'}}>{b.name}</div>
              <div style={{fontSize:'11px',opacity:.8}}>{b.dept} · {b.emp} · {b.yrs} years with LNV </div>
              <button style={{marginTop:'10px',background:'rgba(255,255,255,.2)',border:'1.5px solid rgba(255,255,255,.5)',
                color:'#fff',borderRadius:'6px',padding:'5px 14px',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>
                 Send Wishes
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="hcm-kpi-grid">
        {[{cls:'purple',ic:'',l:'Total Employees',v:'148',s:'Active headcount',tr:'↑ 2 this month',tc:'up'},
          {cls:'green', ic:'',l:'Present Today',  v:'138',s:'93.2% attendance',tr:'7 on leave · 3 late',tc:'wn'},
          {cls:'blue',  ic:'',l:'Gross Payroll (MTD)',v:'₹18.4L',s:'148 employees',tr:'Feb processed ',tc:'up'},
          {cls:'orange',ic:'',l:'Pending Approvals',v:'19',s:'Leave + OT + Exit',tr:'Action needed',tc:'dn'},
        ].map(k=>(
          <div key={k.l} className={`hcm-kpi-card ${k.cls}`}>
            <div className="hcm-kpi-icon">{k.ic}</div>
            <div className="hcm-kpi-label">{k.l}</div>
            <div className="hcm-kpi-value">{k.v}</div>
            <div className={`hcm-kpi-trend ${k.tc}`}>{k.tr}</div>
            <div className="hcm-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Today's Attendance */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3>Attendance Today — Dept. Wise</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/hcm/attendance')}>Full Register</button>
          </div>
          <div className="fi-panel-body">
            {DEPT_ATT.map(d=>(
              <div key={d.dept} style={{marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                  <strong>{d.dept}</strong>
                  <span style={{color:d.pct===100?'var(--odoo-green)':d.pct>=90?'var(--odoo-orange)':'var(--odoo-red)',fontWeight:'700'}}>
                    {d.present}/{d.total} · {d.pct}%
                  </span>
                </div>
                <div style={{background:'#F0EEEB',borderRadius:'4px',height:'7px'}}>
                  <div style={{width:`${d.pct}%`,height:'100%',borderRadius:'4px',
                    background:d.pct===100?'var(--odoo-green)':d.pct>=90?'var(--odoo-orange)':'var(--odoo-red)'}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3> Pending Actions</h3></div>
          <div className="fi-panel-body">
            {PENDING.map(p=>(
              <div key={p.type} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',
                borderBottom:'1px solid var(--odoo-border)',cursor:'pointer'}} onClick={() => nav(p.route)}>
                <div style={{width:'36px',height:'36px',borderRadius:'8px',background:`${p.clr}22`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontFamily:'Syne,sans-serif',fontWeight:'800',color:p.clr,fontSize:'16px'}}>{p.count}</div>
                <div style={{flex:1,fontSize:'13px',fontWeight:'600'}}>{p.type}</div>
                <span style={{color:'var(--odoo-gray)',fontSize:'18px'}}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month summary row */}
      <div className="fi-panel">
        <div className="fi-panel-hdr"><h3> HR Calendar — This Week</h3></div>
        <div className="fi-panel-body">
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px'}}>
            {[['Mon 24','Normal',138,'var(--odoo-green)'],['Tue 25','Normal',141,'var(--odoo-green)'],
              ['Wed 26','Normal',135,'var(--odoo-orange)'],['Thu 27','Payroll Cut-off',138,'var(--odoo-blue)'],
              ['Fri 28','Month End',142,'var(--odoo-purple)']].map(([d,note,cnt,c])=>(
              <div key={d} style={{background:'#F8F9FA',borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                <div style={{fontWeight:'700',fontSize:'12px',color:c}}>{d}</div>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'18px',color:'var(--odoo-dark)'}}>{cnt}</div>
                <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
