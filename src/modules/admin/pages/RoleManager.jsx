import React, { useState } from 'react'

const MODULES_LIST = ['Home','SD','MM','WM','FI','PP','QM','PM','HCM','CRM','Admin']
const PERMS = ['View','Create','Edit','Delete','Approve','Export']

const ROLES = {
  Admin:     {desc:'Full system access',color:'var(--odoo-red)',   perms:{'SD':['View','Create','Edit','Delete','Approve','Export'],'MM':['View','Create','Edit','Delete','Approve','Export'],'FI':['View','Create','Edit','Delete','Approve','Export'],'HCM':['View','Create','Edit','Delete','Approve','Export'],'Admin':['View','Create','Edit','Delete','Approve','Export']}},
  Manager:   {desc:'Plant & Ops manager',color:'var(--odoo-purple)',perms:{'SD':['View','Create','Edit','Approve'],'MM':['View','Create','Edit','Approve'],'PP':['View','Create','Edit','Approve'],'QM':['View','Create','Edit','Approve'],'PM':['View','Create','Edit','Approve'],'WM':['View','Create','Edit','Approve'],'HCM':['View']}},
  Accounts:  {desc:'Finance & billing',color:'var(--odoo-green)',  perms:{'FI':['View','Create','Edit','Approve','Export'],'SD':['View','Create','Edit'],'MM':['View']}},
  Sales:     {desc:'Sales & CRM',color:'var(--odoo-blue)',         perms:{'SD':['View','Create','Edit'],'CRM':['View','Create','Edit','Export'],'MM':['View']}},
  Operations:{desc:'Production & QC floor',color:'var(--odoo-orange)',perms:{'PP':['View','Create','Edit'],'QM':['View','Create','Edit'],'PM':['View','Create','Edit'],'WM':['View','Create','Edit'],'MM':['View','Create']}},
  HR:        {desc:'HR & payroll',color:'#6B2FA0',                 perms:{'HCM':['View','Create','Edit','Approve','Export'],'Admin':['View']}},
}

export default function RoleManager() {
  const [activeRole, setActiveRole] = useState('Admin')
  const role = ROLES[activeRole]

  const hasPermission = (mod, perm) => {
    return role.perms[mod]?.includes(perm) || false
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Roles & Permissions <small>Module-wise access control</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm">Save Changes</button>
        </div>
      </div>

      <div style={{display:'flex',gap:'14px'}}>
        {/* Role list */}
        <div style={{width:'220px',flexShrink:0}}>
          <div style={{fontWeight:'700',fontSize:'12px',color:'var(--odoo-gray)',textTransform:'uppercase',
            marginBottom:'8px',letterSpacing:'.5px'}}>Roles</div>
          {Object.entries(ROLES).map(([name, r]) => (
            <div key={name} onClick={() => setActiveRole(name)} style={{
              padding:'12px 14px',borderRadius:'8px',cursor:'pointer',marginBottom:'6px',
              background:activeRole===name?'var(--odoo-purple)':'#fff',
              color:activeRole===name?'#fff':'var(--odoo-dark)',
              boxShadow:'0 1px 4px rgba(0,0,0,.08)',
              borderLeft:`3px solid ${activeRole===name?'transparent':r.color}`,
              transition:'all .15s'}}>
              <div style={{fontWeight:'700',fontSize:'13px'}}>{name}</div>
              <div style={{fontSize:'11px',opacity:.7,marginTop:'2px'}}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* Permissions matrix */}
        <div style={{flex:1}}>
          <div style={{background:'#fff',borderRadius:'10px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
            <div style={{background:role.color,color:'#fff',padding:'14px 18px',fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'15px'}}>
              🔑 {activeRole} — Permissions Matrix
              <span style={{fontSize:'12px',fontWeight:'400',opacity:.8,marginLeft:'8px'}}>{role.desc}</span>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#F0EEEB'}}>
                    <th style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:'700',textTransform:'uppercase',minWidth:'100px',borderBottom:'2px solid var(--odoo-border)'}}>Module</th>
                    {PERMS.map(p => (
                      <th key={p} style={{padding:'10px 14px',textAlign:'center',fontSize:'11px',fontWeight:'700',textTransform:'uppercase',borderBottom:'2px solid var(--odoo-border)'}}>
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES_LIST.map((mod, i) => (
                    <tr key={mod} style={{background:i%2===0?'#fff':'#FAFAFA',borderBottom:'1px solid var(--odoo-border)'}}>
                      <td style={{padding:'10px 14px',fontWeight:'700',fontSize:'13px',color:'var(--odoo-dark)'}}>
                        <span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)',
                          background:'#EDE0EA',padding:'1px 6px',borderRadius:'4px',marginRight:'8px'}}>{mod}</span>
                      </td>
                      {PERMS.map(perm => {
                        const has = hasPermission(mod, perm)
                        return (
                          <td key={perm} style={{textAlign:'center',padding:'10px'}}>
                            <div style={{
                              width:'24px',height:'24px',borderRadius:'50%',margin:'0 auto',
                              display:'flex',alignItems:'center',justifyContent:'center',
                              background:has?`${role.color}20`:'#F0EEEB',
                              border:`2px solid ${has?role.color:'transparent'}`,
                              cursor:'pointer',transition:'all .15s',fontSize:'12px'}}>
                              {has ? <span style={{color:role.color}}>✓</span> : <span style={{color:'#ccc'}}>—</span>}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
