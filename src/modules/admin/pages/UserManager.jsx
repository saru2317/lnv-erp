import React, { useState } from 'react'

const USERS = [
  {id:'USR-001',user:'admin',    name:'Admin User',  email:'admin@lnvmfg.com',   role:'Admin',   dept:'IT',      last:'01 Mar 2025 10:42',active:true, sessions:1},
  {id:'USR-002',user:'ramesh.k', name:'Ramesh Kumar',email:'ramesh.k@lnvmfg.com',role:'Manager', dept:'Prod',    last:'01 Mar 2025 09:15',active:true, sessions:1},
  {id:'USR-003',user:'priya.s',  name:'Priya Sharma',email:'priya.s@lnvmfg.com', role:'Accounts',dept:'Accounts',last:'01 Mar 2025 10:10',active:true, sessions:1},
  {id:'USR-004',user:'vijay.a',  name:'Vijay A.',    email:'vijay.a@lnvmfg.com', role:'Sales',   dept:'Sales',   last:'28 Feb 2025 18:30',active:true, sessions:0},
  {id:'USR-005',user:'kavitha.m',name:'Kavitha M.',  email:'kavitha@lnvmfg.com', role:'Operations',dept:'QC',   last:'28 Feb 2025 14:00',active:true, sessions:0},
  {id:'USR-006',user:'anitha.r', name:'Anitha R.',   email:'anitha.r@lnvmfg.com',role:'HR',      dept:'HR',      last:'28 Feb 2025 16:45',active:true, sessions:0},
  {id:'USR-007',user:'suresh.m', name:'Suresh M.',   email:'suresh.m@lnvmfg.com',role:'Operations',dept:'Maint.',last:'27 Feb 2025 14:22',active:false,sessions:0},
]

const ROLE_COLORS = {Admin:'var(--odoo-red)',Manager:'var(--odoo-purple)',Accounts:'var(--odoo-green)',
  Sales:'var(--odoo-blue)',Operations:'var(--odoo-orange)',HR:'#6B2FA0'}

export default function UserManager() {
  const [users, setUsers] = useState(USERS)
  const [modal, setModal] = useState(null)

  const toggleActive = (id) => setUsers(us => us.map(u => u.id===id ? {...u,active:!u.active} : u))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">User Management <small>{users.filter(u=>u.active).length} active users</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={() => setModal('new')}>Add User</button>
        </div>
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>User ID</th><th>Username</th><th>Full Name</th><th>Email</th>
          <th>Role</th><th>Department</th><th>Last Login</th><th>Sessions</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{opacity:u.active?1:.55}}>
              <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-gray)'}}>{u.id}</span></td>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'13px',color:'var(--odoo-purple)'}}>{u.user}</strong></td>
              <td><strong>{u.name}</strong></td>
              <td style={{fontSize:'12px',color:'var(--odoo-gray)'}}>{u.email}</td>
              <td>
                <span style={{fontWeight:'700',fontSize:'11px',background:`${ROLE_COLORS[u.role]}18`,
                  color:ROLE_COLORS[u.role],padding:'2px 8px',borderRadius:'10px'}}>{u.role}</span>
              </td>
              <td style={{fontSize:'12px'}}>{u.dept}</td>
              <td style={{fontSize:'11px',color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace'}}>{u.last}</td>
              <td style={{textAlign:'center'}}>
                {u.sessions > 0
                  ? <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'700'}}>🟢 Online</span>
                  : <span style={{color:'var(--odoo-gray)',fontSize:'11px'}}>—</span>}
              </td>
              <td>
                <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'}}>
                  <div onClick={() => toggleActive(u.id)} style={{
                    width:'36px',height:'20px',borderRadius:'10px',
                    background:u.active?'var(--odoo-green)':'#ccc',
                    position:'relative',cursor:'pointer',transition:'background .2s'}}>
                    <div style={{position:'absolute',top:'2px',left:u.active?'18px':'2px',
                      width:'16px',height:'16px',borderRadius:'50%',background:'#fff',transition:'left .2s'}}></div>
                  </div>
                  <span style={{fontSize:'11px',fontWeight:'700',color:u.active?'var(--odoo-green)':'var(--odoo-gray)'}}>{u.active?'Active':'Inactive'}</span>
                </label>
              </td>
              <td>
                <div style={{display:'flex',gap:'4px'}}>
                  <button className="btn-xs" onClick={() => setModal(u)}>Edit</button>
                  <button className="btn-xs" style={{color:'var(--odoo-orange)'}}>🔑 Reset PW</button>
                  {u.sessions>0 && <button className="btn-xs" style={{color:'var(--odoo-red)'}}>⏏️ Logout</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div className="fi-modal-overlay" onClick={() => setModal(null)}>
          <div className="fi-modal-box" onClick={e=>e.stopPropagation()}>
            <div className="fi-modal-hdr">
              {modal==='new'?'➕ New User':`✏️ Edit — ${modal.user}`}
              <button className="fi-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="fi-modal-body">
              <div className="fi-form-row">
                <div className="fi-form-grp"><label>Full Name <span>*</span></label><input className="fi-form-ctrl" defaultValue={modal.name||''} placeholder="Full name"/></div>
                <div className="fi-form-grp"><label>Username <span>*</span></label><input className="fi-form-ctrl" defaultValue={modal.user||''} placeholder="username" style={{fontFamily:'DM Mono,monospace'}}/></div>
              </div>
              <div className="fi-form-row">
                <div className="fi-form-grp"><label>Email <span>*</span></label><input type="email" className="fi-form-ctrl" defaultValue={modal.email||''}/></div>
                <div className="fi-form-grp"><label>Role <span>*</span></label>
                  <select className="fi-form-ctrl" defaultValue={modal.role||'Operations'}>
                    {['Admin','Manager','Accounts','Sales','Operations','HR'].map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              {modal==='new' && (
                <div className="fi-form-row">
                  <div className="fi-form-grp"><label>Password <span>*</span></label><input type="password" className="fi-form-ctrl" placeholder="Set initial password"/></div>
                  <div className="fi-form-grp"><label>Confirm Password</label><input type="password" className="fi-form-ctrl" placeholder="Confirm password"/></div>
                </div>
              )}
              <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
                <button className="btn btn-s sd-bsm" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn btn-p sd-bsm" onClick={() => setModal(null)}>{modal==='new'?'Create User':'Save Changes'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
