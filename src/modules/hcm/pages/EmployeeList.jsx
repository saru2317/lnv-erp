import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ Authorization: `Bearer ${getToken()}` })

const DEPT_COLORS = {
  'Production':'#8E44AD','Accounts':'#196F3D','Quality':'#117A65',
  'Maintenance':'#E06F39','HR':'#2874A6','Sales':'#B7950B','Warehouse':'#784212',
  'IT':'#1A5276','Admin':'#784212'
}
const TYPE_COLORS = { Staff:'#2874A6', Worker:'#E06F39', Contractor:'#C0392B' }

const getInitials = name => name?.split(' ').map(n=>n[0]).slice(0,2).join('') || '?'
const getAvatarColor = dept => DEPT_COLORS[dept] || '#714B67'
const getExtra = emp => {
  try { return JSON.parse(emp.remarks||'{}') } catch { return {} }
}

export default function EmployeeList() {
  const nav = useNavigate()
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [dept,      setDept]      = useState('All')
  const [type,      setType]      = useState('All')
  const [search,    setSearch]    = useState('')
  const [view,       setView]       = useState('table')
  const [showInactive, setShowInactive] = useState(false)

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dept !== 'All') params.set('dept', dept)
      if (showInactive) params.set('active', 'false')
    const res  = await fetch(`${BASE_URL}/employees?${params}`, { headers: authHdrs() })
      const data = await res.json()
      if (res.ok) setEmployees(data.data || [])
      else toast.error(data.error)
    } catch(e) { toast.error(e.message) } finally { setLoading(false) }
  }, [dept, showInactive])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const deactivate = async empCode => {
    if (!confirm('Deactivate this employee?')) return
    await fetch(`${BASE_URL}/employees/${empCode}`, { method:'DELETE', headers:authHdrs() })
    toast.success('Employee deactivated')
    fetchEmployees()
  }

  // Client-side filter for type & search
  const filtered = employees.filter(e => {
    const extra = getExtra(e)
    const category = extra.category || 'Worker'
    const matchType = type === 'All' || category === type
    const matchSearch = !search ||
      e.empCode?.toLowerCase().includes(search.toLowerCase()) ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.designation?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const depts = ['All','Production','Quality','Accounts','Maintenance','HR','Sales','Warehouse']

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Employee Register
          <small>{employees.length} employees · {showInactive ? '🔴 Inactive' : '🟢 Active'}</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm"
            style={{ background: view==='card'?'#EDE0EA':'' }}
            onClick={() => setView('card')}>⊞ Cards</button>
          <button className="btn btn-s sd-bsm"
            style={{ background: view==='table'?'#EDE0EA':'' }}
            onClick={() => setView('table')}>Table</button>
          <button className="btn btn-s sd-bsm" onClick={fetchEmployees}>🔄</button>
          <button className="btn btn-s sd-bsm"
            style={{ background: showInactive ? '#F8D7DA' : '', color: showInactive ? '#721C24' : '' }}
            onClick={() => setShowInactive(v => !v)}>
            {showInactive ? '🔴 Inactive' : '🟢 Active'}
          </button>
          <button className="btn btn-p sd-bsm"
            onClick={() => nav('/hcm/employees/new')}>+ New Employee</button>
        </div>
      </div>

      {/* Filters — sticky */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'14px',
        position:'sticky', top:0, zIndex:20, background:'#F8F7FA',
        paddingTop:8, paddingBottom:8,
        flexWrap:'wrap', alignItems:'center' }}>
        <div className="pp-chips" style={{ margin:0, flexWrap:'wrap' }}>
          {['All','Staff','Worker','Contractor'].map(t => (
            <div key={t} className={`pp-chip${type===t?' on':''}`}
              onClick={() => setType(t)}>{t}</div>
          ))}
        </div>
        <select className="fi-filter-select" value={dept}
          onChange={e => setDept(e.target.value)} style={{ width:'160px' }}>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <div className="fi-filter-search" style={{ flex:1 }}>
          <input placeholder="Search name, ID, designation..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>👤</div>
          <div style={{ fontWeight:700 }}>No employees found</div>
          <div style={{ fontSize:12, marginTop:4 }}>
            Click "+ New Employee" to add first employee
          </div>
        </div>
      ) : view === 'card' ? (
        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'14px' }}>
          {filtered.map(e => {
            const extra = getExtra(e)
            return (
              <div key={e.empCode} className="emp-card"
                style={{ cursor:'pointer' }}
                onClick={() => nav(`/hcm/profile/${e.empCode}`)}>
                <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                  <div className="emp-avatar"
                    style={{ background: getAvatarColor(e.department) }}>
                    {getInitials(e.name)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="emp-name">{e.name}</div>
                    <div className="emp-role">{e.designation}</div>
                    <div className="emp-dept">{e.department}</div>
                    <div className="emp-id">{e.empCode}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'11px', fontWeight:'600',
                    color: TYPE_COLORS[extra.category||'Worker'],
                    background:`${TYPE_COLORS[extra.category||'Worker']}18`,
                    padding:'2px 7px', borderRadius:'10px' }}>
                    {extra.category||'Worker'}
                  </span>
                  {extra.gradeCode && (
                    <span style={{ fontSize:'11px', color:'#6C757D',
                      background:'#F0EEEB', padding:'2px 7px', borderRadius:'10px' }}>
                      {extra.gradeCode}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ maxHeight:'calc(100vh - 280px)', overflowY:'auto',
          border:'1px solid #E0D5E0', borderRadius:8,
          boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table className="fi-data-table" style={{ marginBottom:0 }}>
          <thead style={{ position:'sticky', top:0, zIndex:10,
            background:'#F8F4F8' }}><tr>
            <th>Emp ID</th><th>Name</th><th>Department</th><th>Designation</th>
            <th>Type</th><th>Grade</th><th>DOJ</th><th>Shift</th><th>Basic</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(e => {
              const extra = getExtra(e)
              return (
                <tr key={e.empCode} style={{ cursor:'pointer' }}
                  style={{ cursor:'pointer' }}
                onClick={() => nav(`/hcm/profile/${e.empCode}`)}>
                  <td><span style={{ fontFamily:'DM Mono,monospace', fontSize:'12px',
                    color:'var(--odoo-purple)', fontWeight:'700' }}>{e.empCode}</span></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'50%',
                        background: getAvatarColor(e.department), display:'flex',
                        alignItems:'center', justifyContent:'center', color:'#fff',
                        fontSize:'11px', fontWeight:'800', flexShrink:0 }}>
                        {getInitials(e.name)}
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontWeight:'700', fontSize:'13px' }}>{e.name}</span>
                          {!e.isActive && (
                            <span style={{ fontSize:'10px', background:'#F8D7DA',
                              color:'#721C24', padding:'1px 6px', borderRadius:10,
                              fontWeight:700 }}>Inactive</span>
                          )}
                        </div>
                        <div style={{ fontSize:'10px', color:'var(--odoo-gray)' }}>{e.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>{e.department}</td>
                  <td>{e.designation}</td>
                  <td><span style={{ fontSize:'11px', fontWeight:'700',
                    color: TYPE_COLORS[extra.category||'Worker'] }}>
                    {extra.category||'Worker'}
                  </span></td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontSize:'12px' }}>
                    {extra.gradeCode||'—'}</td>
                  <td style={{ fontSize:'12px' }}>
                    {e.doj ? new Date(e.doj).toLocaleDateString('en-IN') : '—'}</td>
                  <td><span className={`shift-${(extra.shiftCode||'G').toLowerCase()}`}>
                    {extra.shiftCode||'G'}</span></td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontSize:'12px' }}>
                    {e.basicSalary ? `₹${Number(e.basicSalary).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td onClick={e2 => e2.stopPropagation()}>
                    <div style={{ display:'flex', gap:'4px' }}>
                      <button className="btn-xs"
                        onClick={()=>nav(`/hcm/profile/${e.empCode}`)}>👁 View</button>
                      <button className="btn-xs"
                        onClick={()=>nav(`/hcm/employees/edit/${e.empCode}`)}>✏️ Edit</button>
                      {!showInactive && (
                        <button className="btn-xs"
                          style={{color:'#DC3545',border:'1px solid #DC3545'}}
                          onClick={()=>deactivate(e.empCode)}>× Off</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}
