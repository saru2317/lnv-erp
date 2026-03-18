import React, { useState } from 'react'
import { EMPLOYEES_DEFAULT, ASSIGNMENTS_DEFAULT } from './_kpiData'

export default function KPIEmployees({ employees, assignments }) {
  const [emps, setEmps] = useState(employees || EMPLOYEES_DEFAULT)
  const assigns = assignments || ASSIGNMENTS_DEFAULT

  const getKPISet = (emp) => {
    const a = assigns.find(x => x.type==='role' && x.target===emp.role)
    return a ? a.name : '—'
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Employees & Roles <small>KPI module participants</small></div>
        <div className="fi-lv-actions"><button className="btn btn-p sd-bsm">+ Add Employee</button></div>
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Emp Code</th><th>Name</th><th>Role</th><th>Department</th><th>Base Salary</th><th>Incentive Eligible</th><th>KPI Set Assigned</th><th>Action</th></tr></thead>
        <tbody>
          {emps.map(e=>(
            <tr key={e.code}>
              <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{e.code}</td>
              <td style={{fontWeight:700,fontSize:12}}>{e.name}</td>
              <td style={{fontSize:11}}>{e.role}</td>
              <td style={{fontSize:11}}>{e.dept}</td>
              <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',fontWeight:600}}>₹{e.sal.toLocaleString('en-IN')}</td>
              <td style={{textAlign:'center'}}>
                <span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,
                  background:e.incElig?'#D4EDDA':'#F8F9FA',color:e.incElig?'#155724':'#999'}}>
                  {e.incElig?'✅ Yes':'— No'}
                </span>
              </td>
              <td style={{fontSize:11,color:'var(--odoo-gray)'}}>{getKPISet(e)}</td>
              <td><div style={{display:'flex',gap:4}}>
                <button className="btn-xs">✏️ Edit</button>
                <button className="btn-xs" onClick={()=>setEmps(es=>es.filter(x=>x.code!==e.code))}>🗑️</button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
