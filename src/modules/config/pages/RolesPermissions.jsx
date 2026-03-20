import React, { useState } from 'react'
import { ROLES, ALL_MODULES } from './_configData'

const PERMISSIONS = [
  { k:'view',     icon:'',  label:'View',     sub:'Read records' },
  { k:'create',   icon:'',  label:'Create',   sub:'Add new entries' },
  { k:'edit',     icon:'',  label:'Edit',     sub:'Modify existing' },
  { k:'delete',   icon:'',  label:'Delete',   sub:'Remove entries' },
  { k:'approve',  icon:'',  label:'Approve',  sub:'Workflow approval' },
  { k:'export',   icon:'⬇',  label:'Export',   sub:'Download data' },
  { k:'reports',  icon:'',  label:'Reports',  sub:'View reports' },
  { k:'settings', icon:'',  label:'Settings', sub:'Config access' },
]

// Default permission set per role
const DEFAULT_PERMS = {
  admin:     {view:true, create:true, edit:true, delete:true, approve:true, export:true, reports:true, settings:true},
  manager:   {view:true, create:true, edit:true, delete:false,approve:true, export:true, reports:true, settings:false},
  accounts:  {view:true, create:true, edit:true, delete:false,approve:true, export:true, reports:true, settings:false},
  operations:{view:true, create:true, edit:true, delete:false,approve:false,export:false,reports:true, settings:false},
  hr:        {view:true, create:true, edit:true, delete:false,approve:true, export:true, reports:true, settings:false},
  sales:     {view:true, create:true, edit:true, delete:false,approve:false,export:false,reports:true, settings:false},
  transport: {view:true, create:true, edit:true, delete:false,approve:true, export:true, reports:true, settings:false},
  civil:     {view:true, create:true, edit:true, delete:false,approve:true, export:true, reports:true, settings:false},
  viewer:    {view:true, create:false,edit:false,delete:false,approve:false,export:false,reports:true, settings:false},
}

const GROUP_COLORS = {
  Core:       '#714B67',
  Operations: '#017E84',
  Finance:    '#196F3D',
  People:     '#6C3483',
  Support:    '#E06F39',
  System:     '#1A5276',
}

export default function RolesPermissions() {
  const [roles,   setRoles]   = useState(ROLES)
  const [perms,   setPerms]   = useState(DEFAULT_PERMS)
  const [tab,     setTab]     = useState('matrix')    // matrix | permissions | new
  const [selRole, setSelRole] = useState('admin')
  const [saved,   setSaved]   = useState(false)

  const [newRole, setNewRole] = useState({
    name:'', label:'', desc:'', color:'#714B67', modules:[]
  })

  const userCnt = (roleId) => {
    const counts = {
      'ROLE-001':1,'ROLE-002':1,'ROLE-003':1,'ROLE-004':2,'ROLE-005':1,'ROLE-006':1,
      'ROLE-007':0,'ROLE-008':0,'ROLE-009':0,
    }
    return counts[roleId] || 0
  }

  const toggleMod = (roleId, mod) => {
    if (roleId === 'ROLE-001') return // admin always full
    setRoles(rs => rs.map(r => r.id === roleId
      ? {...r, modules: r.modules.includes(mod)
          ? r.modules.filter(m => m !== mod)
          : [...r.modules, mod]}
      : r
    ))
  }

  const togglePerm = (roleName, perm) => {
    if (roleName === 'admin') return
    setPerms(p => ({
      ...p,
      [roleName]: { ...p[roleName], [perm]: !p[roleName]?.[perm] }
    }))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addRole = () => {
    if (!newRole.name || !newRole.label) return
    setRoles(r => [...r, {
      id: `ROLE-${String(r.length+1).padStart(3,'0')}`,
      name: newRole.name, label: newRole.label,
      desc: newRole.desc, color: newRole.color,
      modules: ['home', ...newRole.modules]
    }])
    setNewRole({ name:'', label:'', desc:'', color:'#714B67', modules:[] })
    setTab('matrix')
  }

  const modGroups = [...new Set(ALL_MODULES.map(m => m.group))]
  const currentRole = roles.find(r => r.name === selRole)

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Roles & Permissions
          <small>RBAC — Module access + Action-level permissions</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => setTab('new')}>+ New Role</button>
          <button className="btn btn-p sd-bsm" onClick={handleSave}
            style={saved ? {background:'#155724',color:'#fff'} : {}}>
            {saved ? ' Saved!' : ' Save Changes'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="fi-alert info" style={{marginBottom:16}}>
         <strong>RBAC:</strong> Each user is assigned one role. The role controls (1) which <strong>modules</strong> are visible in the nav, and (2) which <strong>actions</strong> they can perform. Admin always has full access.
      </div>

      {/* Role summary cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10, marginBottom:20}}>
        {roles.map(r => (
          <div key={r.id}
            onClick={() => { setSelRole(r.name); setTab('permissions') }}
            style={{
              background:'#fff', borderRadius:8, padding:'12px 14px',
              border: `2px solid ${selRole===r.name && tab==='permissions' ? r.color : 'var(--odoo-border)'}`,
              cursor:'pointer', transition:'all .15s', boxShadow:'0 1px 4px rgba(0,0,0,.05)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = r.color}
            onMouseLeave={e => { if(!(selRole===r.name && tab==='permissions')) e.currentTarget.style.borderColor = 'var(--odoo-border)' }}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
              <div style={{width:10, height:10, borderRadius:3, background:r.color, flexShrink:0}} />
              <span style={{fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'var(--odoo-dark)'}}>{r.label}</span>
            </div>
            <div style={{fontSize:10, color:'var(--odoo-gray)', marginBottom:6, lineHeight:1.4}}>{r.desc}</div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:10}}>
              <span style={{background:`${r.color}22`, color:r.color, padding:'2px 7px', borderRadius:10, fontWeight:700}}>
                {r.modules.length} modules
              </span>
              <span style={{color:'var(--odoo-gray)'}}>{userCnt(r.id)} users</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex', borderBottom:'2px solid var(--odoo-border)', marginBottom:20}}>
        {[
          ['matrix',      ' Module Access Matrix'],
          ['permissions', ' Action Permissions'],
          ['new',         ' Create New Role'],
        ].map(([k, l]) => (
          <div key={k} onClick={() => setTab(k)}
            style={{padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer',
              color: tab===k ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
              borderBottom: tab===k ? '2px solid var(--odoo-purple)' : '2px solid transparent',
              marginBottom:-2}}>
            {l}
          </div>
        ))}
      </div>

      {/* ── TAB: MODULE ACCESS MATRIX ── */}
      {tab === 'matrix' && (
        <div style={{background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          overflow:'auto', boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <table style={{width:'100%', borderCollapse:'collapse', minWidth:900}}>
            <thead>
              <tr style={{background:'var(--odoo-purple)'}}>
                <th style={{padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700,
                  color:'#fff', position:'sticky', left:0, background:'var(--odoo-purple)', minWidth:160, zIndex:2}}>
                  Module
                </th>
                {roles.map(r => (
                  <th key={r.id} style={{padding:'10px 10px', textAlign:'center', fontSize:11,
                    fontWeight:700, color:'#fff', minWidth:80}}>
                    <div style={{width:8, height:8, borderRadius:2, background:r.color,
                      margin:'0 auto 3px'}} />
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modGroups.map(group => {
                const groupMods = ALL_MODULES.filter(m => m.group === group)
                const gc = GROUP_COLORS[group] || '#714B67'
                return (
                  <React.Fragment key={group}>
                    {/* Group header row */}
                    <tr>
                      <td colSpan={roles.length + 1}
                        style={{padding:'7px 14px', background:`${gc}15`,
                          borderBottom:'1px solid var(--odoo-border)',
                          borderTop:'2px solid var(--odoo-border)'}}>
                        <span style={{fontSize:11, fontWeight:700, color:gc,
                          textTransform:'uppercase', letterSpacing:1}}>
                          ── {group} Modules
                        </span>
                      </td>
                    </tr>
                    {/* Module rows */}
                    {groupMods.map((mod, mi) => (
                      <tr key={mod.key}
                        style={{background: mi%2===0 ? '#fff' : '#FAFAFA',
                          borderBottom:'1px solid var(--odoo-border)'}}>
                        {/* Module label — sticky */}
                        <td style={{padding:'10px 14px', fontWeight:600, fontSize:12,
                          position:'sticky', left:0,
                          background: mi%2===0 ? '#fff' : '#FAFAFA',
                          zIndex:1, borderRight:'2px solid var(--odoo-border)'}}>
                          <div style={{display:'flex', alignItems:'center', gap:8}}>
                            <span style={{fontSize:16}}>{mod.icon}</span>
                            <span>{mod.label}</span>
                          </div>
                        </td>
                        {/* Role checkboxes */}
                        {roles.map(role => {
                          const hasIt = role.modules.includes(mod.key)
                          const isAdmin = role.name === 'admin'
                          const isCore  = mod.key === 'home'
                          const locked  = isAdmin || isCore
                          return (
                            <td key={role.id}
                              style={{padding:'8px', textAlign:'center',
                                background: hasIt ? `${role.color}11` : 'transparent'}}>
                              <div
                                onClick={() => !locked && toggleMod(role.id, mod.key)}
                                style={{
                                  width:26, height:26, borderRadius:6, margin:'0 auto',
                                  display:'flex', alignItems:'center', justifyContent:'center',
                                  cursor: locked ? 'not-allowed' : 'pointer',
                                  background: hasIt ? role.color : '#F0F0F0',
                                  border: `2px solid ${hasIt ? role.color : 'var(--odoo-border)'}`,
                                  transition:'all .15s', fontSize:13,
                                  opacity: locked ? 0.6 : 1,
                                }}
                                title={locked ? 'Cannot modify' : (hasIt ? 'Click to revoke' : 'Click to grant')}>
                                {hasIt ? '' : ''}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
          <div style={{padding:'12px 16px', background:'#F8F9FA',
            borderTop:'1px solid var(--odoo-border)', fontSize:11, color:'var(--odoo-gray)',
            display:'flex', gap:20}}>
            <span> = Access granted &nbsp;|&nbsp; Empty = No access</span>
            <span style={{color:'var(--odoo-orange)'}}> Home module is always visible to all roles</span>
            <span style={{color:'var(--odoo-red)'}}> Admin always has full access</span>
          </div>
        </div>
      )}

      {/* ── TAB: ACTION PERMISSIONS ── */}
      {tab === 'permissions' && (
        <div>
          {/* Role selector */}
          <div style={{display:'flex', gap:8, marginBottom:16, flexWrap:'wrap'}}>
            {roles.map(r => (
              <div key={r.name} onClick={() => setSelRole(r.name)}
                style={{padding:'6px 16px', borderRadius:20, cursor:'pointer',
                  fontSize:12, fontWeight:600, transition:'all .15s',
                  background: selRole===r.name ? r.color : '#fff',
                  color: selRole===r.name ? '#fff' : 'var(--odoo-gray)',
                  border:`1.5px solid ${selRole===r.name ? r.color : 'var(--odoo-border)'}`}}>
                {r.label}
              </div>
            ))}
          </div>

          {currentRole && (
            <div style={{background:'#fff', borderRadius:8, border:`2px solid ${currentRole.color}`,
              overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>

              {/* Role header */}
              <div style={{background:currentRole.color, padding:'14px 20px',
                display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <span style={{fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:800, color:'#fff'}}>{currentRole.label}</span>
                  <span style={{fontSize:11, color:'rgba(255,255,255,.7)', marginLeft:12}}>{currentRole.desc}</span>
                </div>
                <div style={{fontSize:11, color:'rgba(255,255,255,.7)'}}>
                  {currentRole.modules.length} modules · {userCnt(currentRole.id)} users assigned
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:0}}>
                {/* Left: Module access */}
                <div style={{padding:20, borderRight:'1px solid var(--odoo-border)'}}>
                  <div style={{fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700,
                    marginBottom:14, color:'var(--odoo-dark)'}}>Module Access</div>
                  {modGroups.map(group => {
                    const gMods = ALL_MODULES.filter(m => m.group === group)
                    const gc = GROUP_COLORS[group]
                    return (
                      <div key={group} style={{marginBottom:12}}>
                        <div style={{fontSize:10, fontWeight:700, color:gc,
                          textTransform:'uppercase', letterSpacing:1, marginBottom:6}}>{group}</div>
                        <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                          {gMods.map(mod => {
                            const has = currentRole.modules.includes(mod.key)
                            const locked = selRole==='admin' || mod.key==='home'
                            return (
                              <div key={mod.key}
                                onClick={() => !locked && toggleMod(currentRole.id, mod.key)}
                                style={{
                                  display:'flex', alignItems:'center', gap:5,
                                  padding:'4px 10px', borderRadius:20, fontSize:11,
                                  fontWeight:600, cursor: locked ? 'default' : 'pointer',
                                  background: has ? `${currentRole.color}22` : '#F0F0F0',
                                  color: has ? currentRole.color : '#999',
                                  border:`1.5px solid ${has ? currentRole.color : '#E0E0E0'}`,
                                  transition:'all .15s',
                                }}>
                                <span style={{fontSize:13}}>{mod.icon}</span>
                                {mod.label}
                                {has && <span style={{fontSize:10, fontWeight:800}}></span>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Right: Action permissions */}
                <div style={{padding:20}}>
                  <div style={{fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700,
                    marginBottom:14, color:'var(--odoo-dark)'}}> Action Permissions</div>
                  {selRole === 'admin' && (
                    <div style={{background:'#FFF3CD', border:'1px solid #FAD7A0',
                      borderRadius:6, padding:'10px 14px', fontSize:12,
                      color:'#856404', marginBottom:14}}>
                       Admin role always has all permissions and cannot be restricted.
                    </div>
                  )}
                  <div style={{display:'flex', flexDirection:'column', gap:10}}>
                    {PERMISSIONS.map(p => {
                      const has = selRole==='admin' ? true : (perms[selRole]?.[p.k] ?? false)
                      const locked = selRole === 'admin'
                      return (
                        <div key={p.k}
                          onClick={() => !locked && togglePerm(selRole, p.k)}
                          style={{
                            display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                            borderRadius:8, cursor: locked ? 'default' : 'pointer',
                            background: has ? `${currentRole.color}11` : '#F8F9FA',
                            border:`1.5px solid ${has ? currentRole.color : 'var(--odoo-border)'}`,
                            transition:'all .15s',
                          }}>
                          <div style={{width:32, height:32, borderRadius:8,
                            background: has ? currentRole.color : '#E0E0E0',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:16, flexShrink:0, transition:'background .15s'}}>
                            {p.icon}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12, fontWeight:700, color: has ? 'var(--odoo-dark)' : '#999'}}>{p.label}</div>
                            <div style={{fontSize:10, color:'var(--odoo-gray)'}}>{p.sub}</div>
                          </div>
                          <div style={{
                            width:40, height:22, borderRadius:11, position:'relative',
                            background: has ? currentRole.color : '#CCC',
                            transition:'background .2s', flexShrink:0,
                          }}>
                            <div style={{
                              position:'absolute', top:3, borderRadius:'50%',
                              width:16, height:16, background:'#fff',
                              left: has ? 21 : 3,
                              transition:'left .2s',
                              boxShadow:'0 1px 3px rgba(0,0,0,.3)',
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CREATE NEW ROLE ── */}
      {tab === 'new' && (
        <div style={{background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          padding:24, maxWidth:800, boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <h3 style={{fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700,
            marginBottom:20, color:'var(--odoo-dark)'}}>Create New Role</h3>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16}}>
            {[
              ['Role Key (system name)', 'name', 'e.g. supervisor (no spaces, lowercase)'],
              ['Display Label',          'label','e.g. Supervisor'],
              ['Description',            'desc', 'What does this role do?'],
            ].map(([lbl, k, ph]) => (
              <div key={k} style={{gridColumn: k==='desc' ? '1/-1' : 'auto'}}>
                <label style={{fontSize:11, fontWeight:700, color:'var(--odoo-gray)',
                  textTransform:'uppercase', letterSpacing:.5, marginBottom:6, display:'block'}}>{lbl}</label>
                <input value={newRole[k]} onChange={e => setNewRole(n => ({...n, [k]: e.target.value}))}
                  placeholder={ph}
                  style={{width:'100%', padding:'8px 12px', border:'1.5px solid var(--odoo-border)',
                    borderRadius:5, fontSize:12, outline:'none', background:'#FFFDE7', boxSizing:'border-box'}}
                  onFocus={e => e.target.style.borderColor='var(--odoo-purple)'}
                  onBlur={e  => e.target.style.borderColor='var(--odoo-border)'} />
              </div>
            ))}
            <div>
              <label style={{fontSize:11, fontWeight:700, color:'var(--odoo-gray)',
                textTransform:'uppercase', letterSpacing:.5, marginBottom:6, display:'block'}}>Role Colour</label>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                {['#714B67','#1A5276','#196F3D','#784212','#6C3483','#117A65','#E06F39','#1B4F72','#6C757D'].map(c => (
                  <div key={c} onClick={() => setNewRole(n => ({...n, color:c}))}
                    style={{width:28, height:28, borderRadius:7, background:c, cursor:'pointer',
                      border:`3px solid ${newRole.color===c ? 'var(--odoo-dark)' : 'transparent'}`,
                      transition:'border .15s'}} />
                ))}
              </div>
            </div>
          </div>

          {/* Module selection */}
          <div style={{marginBottom:20}}>
            <label style={{fontSize:11, fontWeight:700, color:'var(--odoo-gray)',
              textTransform:'uppercase', letterSpacing:.5, marginBottom:10, display:'block'}}>
              Module Access — click to toggle
            </label>
            {modGroups.map(group => {
              const gc = GROUP_COLORS[group]
              return (
                <div key={group} style={{marginBottom:10}}>
                  <div style={{fontSize:10, fontWeight:700, color:gc,
                    textTransform:'uppercase', letterSpacing:1, marginBottom:6}}>{group}</div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                    {ALL_MODULES.filter(m => m.group===group).map(mod => {
                      const has = mod.key==='home' || newRole.modules.includes(mod.key)
                      const locked = mod.key === 'home'
                      return (
                        <div key={mod.key}
                          onClick={() => {
                            if (locked) return
                            setNewRole(n => ({...n,
                              modules: has ? n.modules.filter(x=>x!==mod.key) : [...n.modules, mod.key]
                            }))
                          }}
                          style={{display:'flex', alignItems:'center', gap:5, padding:'5px 12px',
                            borderRadius:20, fontSize:11, fontWeight:600,
                            cursor: locked ? 'default' : 'pointer',
                            background: has ? `${newRole.color}22` : '#F0F0F0',
                            color: has ? newRole.color : '#999',
                            border:`1.5px solid ${has ? newRole.color : '#E0E0E0'}`,
                            transition:'all .15s'}}>
                          <span style={{fontSize:13}}>{mod.icon}</span>
                          {mod.label}
                          {has && <span></span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Preview */}
          {newRole.name && (
            <div style={{background:`${newRole.color}11`, border:`1.5px solid ${newRole.color}`,
              borderRadius:8, padding:'12px 16px', marginBottom:16, fontSize:12}}>
              <strong style={{color:newRole.color}}>Preview: </strong>
              <span style={{color:'var(--odoo-dark)', fontWeight:600}}>{newRole.label || '—'}</span>
              <span style={{color:'var(--odoo-gray)', marginLeft:10}}>({newRole.name})</span>
              <span style={{marginLeft:10, color:'var(--odoo-gray)'}}>{1 + newRole.modules.length} modules</span>
            </div>
          )}

          <div style={{display:'flex', gap:10, justifyContent:'flex-end',
            paddingTop:16, borderTop:'1px solid var(--odoo-border)'}}>
            <button className="btn btn-s sd-bsm" onClick={() => setTab('matrix')}>Cancel</button>
            <button className="btn btn-p sd-bsm" onClick={addRole}
              disabled={!newRole.name || !newRole.label}
              style={{opacity: (!newRole.name || !newRole.label) ? 0.5 : 1}}>
               Create Role
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
