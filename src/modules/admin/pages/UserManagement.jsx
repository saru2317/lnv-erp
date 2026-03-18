import React, { useState } from 'react'

const USERS_LIST = [
  {id:'USR-001',name:'Admin',          email:'admin@lnvmfg.com',     role:'admin',     modules:'All modules',     status:'Active',last:'2025-03-01 09:00'},
  {id:'USR-002',name:'Ramesh Kumar',   email:'ramesh@lnvmfg.com',    role:'manager',   modules:'PP,QM,PM,WM,MM',  status:'Active',last:'2025-03-01 08:45'},
  {id:'USR-003',name:'Priya Sharma',   email:'priya@lnvmfg.com',     role:'accounts',  modules:'FI,SD,MM',        status:'Active',last:'2025-03-01 09:02'},
  {id:'USR-004',name:'Kavitha M.',     email:'kavitha@lnvmfg.com',   role:'operations',modules:'PP,QM,PM,WM,MM',  status:'Active',last:'2025-02-28 17:30'},
  {id:'USR-005',name:'Anitha R.',      email:'anitha@lnvmfg.com',    role:'hr',        modules:'HCM',             status:'Active',last:'2025-02-28 16:00'},
  {id:'USR-006',name:'Vijay A.',       email:'vijay@lnvmfg.com',     role:'sales',     modules:'SD,CRM',          status:'Active',last:'2025-02-27 18:00'},
  {id:'USR-007',name:'Suresh M.',      email:'suresh@lnvmfg.com',    role:'operations',modules:'PM,MM,WM',        status:'Active',last:'2025-02-28 14:00'},
  {id:'USR-008',name:'Test User',      email:'test@lnvmfg.com',      role:'sales',     modules:'SD',              status:'Inactive',last:'2025-01-15 10:00'},
]

const ROLE_COLORS = {
  admin:'var(--odoo-purple)',manager:'var(--odoo-blue)',
  accounts:'var(--odoo-green)',operations:'var(--odoo-orange)',
  hr:'var(--odoo-red)',sales:'#B7950B'
}

export default function UserManagement() {
  const [users, setUsers] = useState(USERS_LIST)
  const [modal, setModal] = useState(null)

  const toggleStatus = (id) => setUsers(us => us.map(u =>
    u.id===id ? {...u, status: u.status==='Active'?'Inactive':'Active'} : u
  ))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">User Management <small>RBAC — Role Based Access</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={() => setModal('new')}>➕ Add User</button>
        </div>
      </div>

      <div className="pp-alert info">
        🔐 <strong>RBAC Roles:</strong> admin — full access &nbsp;|&nbsp; manager — PP/QM/PM/WM/MM &nbsp;|&nbsp;
        accounts — FI/SD/MM &nbsp;|&nbsp; operations — PP/QM/PM/WM/MM &nbsp;|&nbsp;
        hr — HCM only &nbsp;|&nbsp; sales — SD/CRM
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>User ID</th><th>Name</th><th>Email</th><th>Role</th>
          <th>Module Access</th><th>Last Login</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{opacity: u.status==='Inactive'?0.55:1}}>
              <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)',fontWeight:'700'}}>{u.id}</span></td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'50%',
                    background:ROLE_COLORS[u.role]||'var(--odoo-gray)',flexShrink:0,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    color:'#fff',fontWeight:'800',fontSize:'12px'}}>
                    {u.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                  </div>
                  <strong style={{fontSize:'13px'}}>{u.name}</strong>
                </div>
              </td>
              <td style={{fontSize:'12px',fontFamily:'DM Mono,monospace'}}>{u.email}</td>
              <td>
                <span style={{background:`${ROLE_COLORS[u.role]}22`,color:ROLE_COLORS[u.role],
                  padding:'3px 10px',borderRadius:'10px',fontSize:'12px',fontWeight:'700',
                  textTransform:'capitalize'}}>{u.role}</span>
              </td>
              <td style={{fontSize:'11px',color:'var(--odoo-gray)',maxWidth:'160px'}}>{u.modules}</td>
              <td style={{fontSize:'11px',fontFamily:'DM Mono,monospace',color:'var(--odoo-gray)'}}>{u.last}</td>
              <td>
                <span style={{
                  background:u.status==='Active'?'#D4EDDA':'#F8D7DA',
                  color:u.status==='Active'?'#155724':'#721C24',
                  padding:'3px 10px',borderRadius:'10px',fontSize:'11px',fontWeight:'700'}}>
                  {u.status}
                </span>
              </td>
              <td>
                <div style={{display:'flex',gap:'4px'}}>
                  <button className="btn-xs" onClick={() => setModal(u)}>✏️ Edit</button>
                  <button className="btn-xs" style={{color:u.status==='Active'?'var(--odoo-red)':'var(--odoo-green)'}}
                    onClick={() => toggleStatus(u.id)}>
                    {u.status==='Active'?'🔒 Disable':'🔓 Enable'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div className="fi-modal-overlay" onClick={() => setModal(null)}>
          <div className="fi-modal-box" onClick={e => e.stopPropagation()}>
            <div className="fi-modal-hdr">
              {modal==='new' ? '➕ Add New User' : `✏️ Edit — ${modal.name}`}
              <button className="fi-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="fi-modal-body">
              <div className="fi-form-row">
                <div className="fi-form-grp"><label>Full Name <span>*</span></label>
                  <input className="fi-form-ctrl" defaultValue={modal!=='new'?modal.name:''} placeholder="Full name"/></div>
                <div className="fi-form-grp"><label>Email <span>*</span></label>
                  <input type="email" className="fi-form-ctrl" defaultValue={modal!=='new'?modal.email:''} placeholder="user@lnvmfg.com"/></div>
              </div>
              <div className="fi-form-row">
                <div className="fi-form-grp"><label>Role <span>*</span></label>
                  <select className="fi-form-ctrl" defaultValue={modal!=='new'?modal.role:''}>
                    <option value="admin">admin — Full Access</option>
                    <option value="manager">manager — PP/QM/PM/WM/MM</option>
                    <option value="accounts">accounts — FI/SD/MM</option>
                    <option value="operations">operations — PP/QM/PM/WM/MM</option>
                    <option value="hr">hr — HCM only</option>
                    <option value="sales">sales — SD/CRM</option>
                  </select>
                </div>
                <div className="fi-form-grp"><label>Password</label>
                  <input type="password" className="fi-form-ctrl" placeholder={modal==='new'?'Set password':'Leave blank to keep current'}/></div>
              </div>
              <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
                <button className="btn btn-s sd-bsm" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn btn-p sd-bsm" onClick={() => setModal(null)}>💾 {modal==='new'?'Create User':'Save Changes'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
