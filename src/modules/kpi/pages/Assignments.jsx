import React, { useState } from 'react'
import { ASSIGNMENTS_DEFAULT, KPI_MASTER_DEFAULT } from './_kpiData'

export default function Assignments({ assignments, kpiMaster }) {
  const [assigns, setAssigns] = useState(assignments || ASSIGNMENTS_DEFAULT)
  const master = kpiMaster || KPI_MASTER_DEFAULT

  const roleCt = assigns.filter(a=>a.type==='role').length
  const empCt  = assigns.filter(a=>a.type==='employee').length
  const deptCt = assigns.filter(a=>a.type==='department').length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">KPI Assignment <small>Role / Employee / Department</small></div>
        <div className="fi-lv-actions"><button className="btn btn-p sd-bsm">+ New Assignment</button></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        {[['','Role-Based','All employees of a role share same KPI set',roleCt,'var(--odoo-purple)','#EDE0EA'],
          ['','Employee-Based','Individual custom KPI set + incentive link',empCt,'var(--odoo-green)','#D4EDDA'],
          ['','Department/Model','Plant-level or division KPIs',deptCt,'var(--odoo-blue)','#D1ECF1']
        ].map(([ic,title,sub,ct,c,bg])=>(
          <div key={title} style={{background:'#fff',borderRadius:8,border:`2px solid ${c}33`,
            padding:20,textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,.06)',cursor:'pointer'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=c}
            onMouseLeave={e=>e.currentTarget.style.borderColor=`${c}33`}>
            <div style={{fontSize:32,marginBottom:8}}>{ic}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:800,marginBottom:4}}>{title}</div>
            <div style={{fontSize:11,color:'var(--odoo-gray)',marginBottom:12}}>{sub}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:28,fontWeight:800,color:c}}>{ct}</div>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Assignment Name</th><th>Type</th><th>Target</th><th>KPIs Assigned</th><th>Count</th><th>Incentive Linked</th><th>Action</th></tr></thead>
        <tbody>
          {assigns.map((a,i)=>(
            <tr key={i}>
              <td style={{fontWeight:700,fontSize:12}}>{a.name}</td>
              <td><span style={{padding:'3px 9px',borderRadius:10,fontSize:11,fontWeight:600,
                background:a.type==='role'?'#EDE0EA':a.type==='employee'?'#D4EDDA':'#D1ECF1',
                color:a.type==='role'?'#714B67':a.type==='employee'?'#155724':'#0C5460'}}>
                {a.type.charAt(0).toUpperCase()+a.type.slice(1)}
              </span></td>
              <td style={{fontSize:12}}>{a.target}</td>
              <td style={{fontSize:11,maxWidth:300}}>{a.kpis.join(', ')}</td>
              <td style={{textAlign:'center',fontWeight:700,color:'var(--odoo-purple)'}}>{a.kpis.length}</td>
              <td style={{textAlign:'center'}}>
                <span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,
                  background:a.incLinked?'#D4EDDA':'#F8F9FA',color:a.incLinked?'#155724':'#999'}}>
                  {a.incLinked?' Yes':'— No'}
                </span>
              </td>
              <td><div style={{display:'flex',gap:4}}>
                <button className="btn-xs">Edit</button>
                <button className="btn-xs">Del</button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
