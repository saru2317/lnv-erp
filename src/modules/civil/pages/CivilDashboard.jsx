import React from 'react'
import { useNavigate } from 'react-router-dom'
const PROJECTS = [
  { id:'PRJ-2026-001', name:'New Production Block — Phase 2', type:'Civil Construction', budget:12000000, spent:7440000, progress:62, pm:'Admin Kumar',   status:'active',    end:'30 Jun 2026' },
  { id:'PRJ-2026-002', name:'Canteen Extension',               type:'Civil Work',         budget:1800000,  spent:1080000, progress:60, pm:'Site Engineer', status:'active',    end:'30 Apr 2026' },
  { id:'PRJ-2026-003', name:'Solar Panel Installation',        type:'Electrical',         budget:4200000,  spent:420000,  progress:10, pm:'Admin Kumar',   status:'started',   end:'15 May 2026' },
  { id:'PRJ-2026-004', name:'Borewell — Unit II',              type:'Civil',              budget:350000,   spent:350000,  progress:100,pm:'Site Engineer', status:'completed', end:'15 Jan 2026' },
]
const ST={active:{label:'In Progress',bg:'#D1ECF1',color:'#0C5460'},started:{label:'Started',bg:'#FFF3CD',color:'#856404'},completed:{label:'Completed',bg:'#D4EDDA',color:'#155724'}}
const fmt=n=>'₹'+(n/100000).toFixed(1)+'L'
export default function CivilDashboard() {
  const nav=useNavigate()
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Civil / Project Dashboard</div>
        <div className="fi-lv-actions"><button className="btn btn-p sd-bsm" onClick={()=>nav('/civil/projects')}>+ New Project</button></div>
      </div>
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
        {[
          {cls:'purple',l:'Active Projects', v:'3',       s:'In progress'},
          {cls:'green', l:'Total Budget',    v:'₹1.83Cr', s:'All projects'},
          {cls:'orange',l:'Total Spent',     v:'₹88.9L',  s:'48% utilised'},
          {cls:'blue',  l:'Pending Bills',   v:'₹12.5L',  s:'Contractor bills'},
        ].map(k=>(<div key={k.l} className={`fi-kpi-card ${k.cls}`}><div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div></div>))}
      </div>
      <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{padding:'12px 16px',borderBottom:'1px solid var(--odoo-border)',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700}}>🏗️ Active Projects</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#F8F9FA'}}>{['Project No.','Name','Type','Budget','Spent','Progress','PM','End Date','Status','Action'].map(h=>(<th key={h} style={{padding:'8px 12px',fontSize:11,fontWeight:700,color:'var(--odoo-gray)',textAlign:'left',borderBottom:'1px solid var(--odoo-border)'}}>{h}</th>))}</tr></thead>
          <tbody>
            {PROJECTS.map(p=>{
              const st=ST[p.status]
              const pct = p.progress
              return (<tr key={p.id} style={{borderBottom:'1px solid var(--odoo-border)'}}>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)',fontWeight:600}}>{p.id}</td>
                <td style={{padding:'10px 12px',fontSize:12,fontWeight:700,maxWidth:200}}>{p.name}</td>
                <td style={{padding:'10px 12px',fontSize:11}}>{p.type}</td>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12}}>{fmt(p.budget)}</td>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-orange)'}}>{fmt(p.spent)}</td>
                <td style={{padding:'10px 12px',minWidth:140}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,height:6,background:'var(--odoo-border)',borderRadius:3}}>
                      <div style={{height:'100%',borderRadius:3,background:pct>80?'var(--odoo-green)':pct>50?'var(--odoo-purple)':'var(--odoo-orange)',width:`${pct}%`,transition:'width .5s'}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:'var(--odoo-dark)',minWidth:28}}>{pct}%</span>
                  </div>
                </td>
                <td style={{padding:'10px 12px',fontSize:11}}>{p.pm}</td>
                <td style={{padding:'10px 12px',fontSize:11}}>{p.end}</td>
                <td style={{padding:'10px 12px'}}><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span></td>
                <td style={{padding:'10px 12px'}}><div style={{display:'flex',gap:4}}>
                  <button className="btn-xs" onClick={()=>nav('/civil/progress')}>📊 Progress</button>
                  <button className="btn-xs" onClick={()=>nav('/civil/bills')}>🧾 Bills</button>
                </div></td>
              </tr>)
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
