import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EMPLOYEES, DEPT_COLORS, TYPE_COLORS } from './_sharedData'

const DEPTS = ['All','Production','Quality','Accounts','Maintenance','HR & Admin','Sales','Warehouse']

const getInitials = (name) => name.split(' ').map(n=>n[0]).slice(0,2).join('')
const getAvatarColor = (dept) => DEPT_COLORS[dept] || 'var(--odoo-purple)'

export default function EmployeeList() {
  const nav = useNavigate()
  const [dept, setDept] = useState('All')
  const [type, setType] = useState('All')
  const [view, setView] = useState('table') // table | card

  const filtered = EMPLOYEES.filter(e =>
    (dept==='All'||e.dept===dept) &&
    (type==='All'||e.type===type)
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Employee Register <small>{EMPLOYEES.length} employees · Active</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" style={{background:view==='card'?'#EDE0EA':''}} onClick={()=>setView('card')}>⊞ Cards</button>
          <button className="btn btn-s sd-bsm" style={{background:view==='table'?'#EDE0EA':''}} onClick={()=>setView('table')}>☰ Table</button>
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/hcm/employees/new')}>➕ New Employee</button>
        </div>
      </div>

      <div style={{display:'flex',gap:'10px',marginBottom:'14px',flexWrap:'wrap',alignItems:'center'}}>
        <div className="pp-chips" style={{margin:0,flexWrap:'wrap'}}>
          {['All','Staff','Worker','Contractor'].map(t=>(
            <div key={t} className={`pp-chip${type===t?' on':''}`} onClick={()=>setType(t)}>{t}</div>
          ))}
        </div>
        <select className="fi-filter-select" onChange={e=>setDept(e.target.value)} style={{width:'160px'}}>
          {DEPTS.map(d=><option key={d}>{d}</option>)}
        </select>
        <div className="fi-filter-search" style={{flex:1}}>🔍<input placeholder="Search name, ID, designation..."/></div>
      </div>

      {view==='card' ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'14px'}}>
          {filtered.map(e=>(
            <div key={e.id} className="emp-card" onClick={() => nav('/hcm/profile')}>
              <div style={{display:'flex',gap:'10px',alignItems:'flex-start'}}>
                <div className="emp-avatar" style={{background:getAvatarColor(e.dept)}}>{getInitials(e.name)}</div>
                <div style={{flex:1}}>
                  <div className="emp-name">{e.name}</div>
                  <div className="emp-role">{e.desg}</div>
                  <div className="emp-dept">{e.dept}</div>
                  <div className="emp-id">{e.id}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:'6px',marginTop:'10px',flexWrap:'wrap'}}>
                <span style={{fontSize:'11px',fontWeight:'600',color:TYPE_COLORS[e.type],
                  background:`${TYPE_COLORS[e.type]}18`,padding:'2px 7px',borderRadius:'10px'}}>{e.type}</span>
                <span style={{fontSize:'11px',color:'var(--odoo-gray)',background:'#F0EEEB',
                  padding:'2px 7px',borderRadius:'10px'}}>{e.grade}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Emp ID</th><th>Name</th><th>Department</th><th>Designation</th>
            <th>Type</th><th>Grade</th><th>DOJ</th><th>Shift</th><th>CTC</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(e=>(
              <tr key={e.id} style={{cursor:'pointer'}} onClick={() => nav('/hcm/profile')}>
                <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)',fontWeight:'700'}}>{e.id}</span></td>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:getAvatarColor(e.dept),
                      display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',
                      fontSize:'11px',fontWeight:'800',flexShrink:0}}>{getInitials(e.name)}</div>
                    <div>
                      <div style={{fontWeight:'700',fontSize:'13px'}}>{e.name}</div>
                      <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{e.ph}</div>
                    </div>
                  </div>
                </td>
                <td>{e.dept}</td>
                <td>{e.desg}</td>
                <td><span style={{fontSize:'11px',fontWeight:'700',color:TYPE_COLORS[e.type]}}>{e.type}</span></td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{e.grade}</td>
                <td style={{fontSize:'12px'}}>{e.doj}</td>
                <td><span className={`shift-${e.shift.toLowerCase().replace('general','gen')}`}>{e.shift}</span></td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>₹{(e.ctc/12000).toFixed(1)}K/mo</td>
                <td onClick={e2=>e2.stopPropagation()}>
                  <div style={{display:'flex',gap:'4px'}}>
                    <button className="btn-xs" onClick={() => nav('/hcm/profile')}>View</button>
                    <button className="btn-xs">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
