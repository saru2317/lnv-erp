import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

export default function ManpowerPlanning() {
  const [employees, setEmployees] = useState([])
  const [depts,     setDepts]     = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/employees?limit=500`, { headers: hdr2() }).then(r=>r.json()),
      fetch(`${BASE}/hr-master/departments`, { headers: hdr2() }).then(r=>r.json()),
    ]).then(([empRes, deptRes]) => {
      const emps  = empRes.data  || empRes  || []
      const depts = deptRes.data || deptRes || []
      setEmployees(emps)
      setDepts(depts)
    }).catch(() => toast.error('Failed to load data'))
    .finally(() => setLoading(false))
  }, [])

  // Build dept summary from actual employees
  const deptMap = {}
  employees.forEach(e => {
    const dept = e.department || e.dept || 'Others'
    if (!deptMap[dept]) deptMap[dept] = {
      dept, actual:0, active:0, onLeave:0,
      staff:0, worker:0, contractor:0
    }
    deptMap[dept].actual++
    if (e.status === 'Active' || e.isActive) deptMap[dept].active++
    if (e.status === 'OnLeave') deptMap[dept].onLeave++
    const type = (e.employeeType || e.empType || '').toLowerCase()
    if (type.includes('staff'))      deptMap[dept].staff++
    else if (type.includes('worker')) deptMap[dept].worker++
    else if (type.includes('contract')) deptMap[dept].contractor++
    else deptMap[dept].staff++ // default
  })

  const deptRows = Object.values(deptMap).sort((a,b) => b.actual - a.actual)
  const totalEmp = employees.length
  const activeEmp= employees.filter(e => e.status === 'Active' || e.isActive).length

  const DEPT_COLORS = {
    'Production':'#8E44AD', 'Accounts':'#196F3D', 'Quality':'#117A65',
    'Maintenance':'#E06F39', 'HR & Admin':'#2874A6', 'Sales':'#B7950B',
    'Warehouse':'#784212', 'Finance':'#196F3D', 'IT':'#1A5276'
  }

  return (
    <div>
      <div className="hcm-pg-hdr">
        <div>
          <h2 className="hcm-pg-title">Manpower Planning</h2>
          <p className="hcm-pg-sub">Department-wise headcount & planning</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)',
        gap:10, marginBottom:16 }}>
        {[
          ['Total Headcount',   totalEmp,                                   '#714B67','#EDE0EA'],
          ['Active',            activeEmp,                                  '#155724','#D4EDDA'],
          ['Departments',       deptRows.length,                            '#0C5460','#D1ECF1'],
          ['Staff',             employees.filter(e=>(e.employeeType||'').toLowerCase().includes('staff')||(!e.employeeType&&!e.empType)).length, '#856404','#FFF3CD'],
          ['Workers',           employees.filter(e=>(e.employeeType||e.empType||'').toLowerCase().includes('worker')).length, '#721C24','#F8D7DA'],
        ].map(([l,v,c,bg]) => (
          <div key={l} style={{ background:bg, borderRadius:8,
            padding:'10px 14px', textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:800, color:c,
              fontFamily:'DM Mono,monospace' }}>{v}</div>
            <div style={{ fontSize:10, fontWeight:700, color:c,
              textTransform:'uppercase', opacity:.8 }}>{l}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          Loading...
        </div>
      ) : (
        <>
          {/* Dept headcount visual */}
          <div style={{ background:'#fff', borderRadius:8,
            border:'1.5px solid #E0D5E0', padding:'16px 20px', marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#714B67',
              marginBottom:14 }}>
              📊 Department Headcount
            </div>
            {deptRows.map(d => {
              const color = DEPT_COLORS[d.dept] || '#6C757D'
              const pct   = totalEmp > 0 ? (d.actual/totalEmp*100).toFixed(0) : 0
              return (
                <div key={d.dept} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#1A1A2E',
                      minWidth:140 }}>{d.dept}</span>
                    <span style={{ fontSize:12, fontFamily:'DM Mono,monospace',
                      fontWeight:700, color }}>
                      {d.actual} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height:8, background:'#F0F0F0',
                    borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`,
                      background:color, borderRadius:4,
                      transition:'width .3s' }} />
                  </div>
                  <div style={{ display:'flex', gap:12, marginTop:3,
                    fontSize:10, color:'#6C757D' }}>
                    <span>Staff: {d.staff}</span>
                    <span>Worker: {d.worker}</span>
                    {d.contractor > 0 && <span>Contractor: {d.contractor}</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Dept table */}
          <div style={{ background:'#fff', borderRadius:8,
            border:'1.5px solid #E0D5E0', overflow:'hidden' }}>
            <table className="hcm-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th style={{ textAlign:'center' }}>Total</th>
                  <th style={{ textAlign:'center' }}>Active</th>
                  <th style={{ textAlign:'center' }}>On Leave</th>
                  <th style={{ textAlign:'center' }}>Staff</th>
                  <th style={{ textAlign:'center' }}>Worker</th>
                  <th style={{ textAlign:'center' }}>Contractor</th>
                  <th style={{ textAlign:'center' }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {deptRows.map(d => {
                  const color = DEPT_COLORS[d.dept] || '#6C757D'
                  const pct   = totalEmp > 0 ? (d.actual/totalEmp*100).toFixed(1) : 0
                  return (
                    <tr key={d.dept}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:10, height:10, borderRadius:'50%',
                            background:color, flexShrink:0 }} />
                          <strong style={{ fontSize:13 }}>{d.dept}</strong>
                        </div>
                      </td>
                      <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace',
                        fontWeight:800, color, fontSize:14 }}>{d.actual}</td>
                      <td style={{ textAlign:'center', color:'#155724',
                        fontWeight:700 }}>{d.active}</td>
                      <td style={{ textAlign:'center', color:'#856404' }}>{d.onLeave || '—'}</td>
                      <td style={{ textAlign:'center' }}>{d.staff}</td>
                      <td style={{ textAlign:'center' }}>{d.worker}</td>
                      <td style={{ textAlign:'center',
                        color: d.contractor > 0 ? '#721C24' : '#6C757D' }}>
                        {d.contractor || '—'}
                      </td>
                      <td style={{ textAlign:'center', fontSize:11,
                        color:'#6C757D' }}>{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:'#EDE0EA', fontWeight:700 }}>
                  <td style={{ padding:'8px 12px' }}>Total</td>
                  <td style={{ textAlign:'center', padding:'8px 12px',
                    fontFamily:'DM Mono,monospace', fontWeight:800,
                    color:'#714B67', fontSize:14 }}>{totalEmp}</td>
                  <td style={{ textAlign:'center', padding:'8px 12px' }}>{activeEmp}</td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
