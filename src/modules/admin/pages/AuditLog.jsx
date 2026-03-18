import React, { useState } from 'react'
import { AUDIT_LOGS, ACTION_COLORS, MODULES, ACTIONS, USERS } from './_auditData'

export default function AuditLog() {
  const [module,   setModule]   = useState('All')
  const [action,   setAction]   = useState('All')
  const [user,     setUser]     = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState(null)
  const [page,     setPage]     = useState(1)
  const PER_PAGE = 10

  const filtered = AUDIT_LOGS.filter(l =>
    (module === 'All' || l.module === module) &&
    (action === 'All' || l.action === action) &&
    (user   === 'All' || l.user   === user)   &&
    (!search || l.ref.toLowerCase().includes(search.toLowerCase()) ||
               l.entity.toLowerCase().includes(search.toLowerCase()) ||
               l.user.toLowerCase().includes(search.toLowerCase()))
  )
  const paged  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)
  const pages  = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Audit Log <small>{filtered.length} records</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export CSV</button>
          <button className="btn btn-s sd-bsm">⬇️ Export PDF</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{background:'#fff',borderRadius:'8px',padding:'14px',
        boxShadow:'0 1px 4px rgba(0,0,0,.08)',marginBottom:'14px',
        display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center'}}>
        <select className="fi-filter-select" onChange={e=>{setModule(e.target.value);setPage(1)}}>
          {MODULES.map(m=><option key={m}>{m}</option>)}
        </select>
        <select className="fi-filter-select" onChange={e=>{setAction(e.target.value);setPage(1)}}>
          {ACTIONS.map(a=><option key={a}>{a}</option>)}
        </select>
        <select className="fi-filter-select" onChange={e=>{setUser(e.target.value);setPage(1)}}>
          {USERS.map(u=><option key={u}>{u}</option>)}
        </select>
        <div style={{display:'flex',gap:'6px',alignItems:'center',fontSize:'12px',color:'var(--odoo-gray)'}}>
          <span>From</span>
          <input type="date" className="fi-filter-select" onChange={e=>setDateFrom(e.target.value)}/>
          <span>To</span>
          <input type="date" className="fi-filter-select" onChange={e=>setDateTo(e.target.value)}/>
        </div>
        <div className="fi-filter-search" style={{flex:1,minWidth:'160px'}}>
          🔍<input placeholder="Search ref, entity, user..." onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
        </div>
        <button className="btn btn-s sd-bsm" onClick={()=>{setModule('All');setAction('All');setUser('All');setSearch('');setPage(1)}}>
          ✕ Clear
        </button>
      </div>

      {/* Action chips */}
      <div className="pp-chips">
        {ACTIONS.map(a => (
          <div key={a} className={`pp-chip${action===a?' on':''}`} onClick={()=>{setAction(a);setPage(1)}}>
            {a} <span>{a==='All'?AUDIT_LOGS.length:AUDIT_LOGS.filter(l=>l.action===a).length}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <table className="fi-data-table">
        <thead>
          <tr>
            <th>Log ID</th>
            <th>Timestamp</th>
            <th>User</th>
            <th>Module</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Reference</th>
            <th>IP Address</th>
            <th>Changes</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(log => (
            <React.Fragment key={log.id}>
              <tr
                style={{
                  cursor:'pointer',
                  background: log.action==='DELETE' ? '#FFF5F5' :
                              expanded===log.id     ? '#F7F0F5' : 'inherit'
                }}
                onClick={() => setExpanded(expanded===log.id ? null : log.id)}
              >
                <td>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',
                    color:'var(--odoo-purple)',fontWeight:'700'}}>{log.id}</span>
                </td>
                <td>
                  <div style={{fontSize:'12px',fontFamily:'DM Mono,monospace',fontWeight:'600'}}>
                    {log.ts.split(' ')[0]}
                  </div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace'}}>
                    {log.ts.split(' ')[1]}
                  </div>
                </td>
                <td>
                  <div style={{fontWeight:'700',fontSize:'12px'}}>{log.user}</div>
                  <div style={{fontSize:'10px',color:'var(--odoo-gray)',textTransform:'capitalize'}}>{log.role}</div>
                </td>
                <td>
                  <span style={{background:'#EDE0EA',color:'var(--odoo-purple)',
                    padding:'2px 8px',borderRadius:'4px',fontSize:'11px',fontWeight:'700'}}>
                    {log.module}
                  </span>
                </td>
                <td>
                  <span className={ACTION_COLORS[log.action]}>{log.action}</span>
                </td>
                <td style={{fontSize:'12px',fontWeight:'600'}}>{log.entity}</td>
                <td>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:'12px',
                    color:'var(--odoo-blue)',fontWeight:'700'}}>{log.ref}</span>
                </td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-gray)'}}>
                  {log.ip}
                </td>
                <td>
                  <button className="btn-xs pri"
                    onClick={e=>{e.stopPropagation();setExpanded(expanded===log.id?null:log.id)}}>
                    {expanded===log.id ? '▲ Hide' : '▼ Diff'}
                  </button>
                </td>
              </tr>

              {/* Expanded diff row */}
              {expanded === log.id && (
                <tr>
                  <td colSpan={9} style={{background:'#F7F0F5',padding:'14px 20px'}}>
                    <div style={{fontWeight:'700',fontSize:'12px',color:'var(--odoo-purple)',marginBottom:'10px'}}>
                      📋 Change Details — {log.entity} · {log.ref}
                    </div>
                    <div style={{display:'flex',gap:'24px',flexWrap:'wrap'}}>

                      {/* UPDATE diff */}
                      {log.action === 'UPDATE' && log.changes.field && (
                        <div style={{background:'#fff',borderRadius:'8px',padding:'12px',minWidth:'300px',
                          boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
                          <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',
                            textTransform:'uppercase',marginBottom:'8px'}}>Field Changed</div>
                          <div style={{fontSize:'13px',fontWeight:'800',marginBottom:'8px',color:'var(--odoo-dark)'}}>
                            {log.changes.field}
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                            <div>
                              <div style={{fontSize:'10px',color:'var(--odoo-gray)',marginBottom:'3px'}}>BEFORE</div>
                              <span className="diff-old">{log.changes.old}</span>
                            </div>
                            <span style={{fontSize:'18px',color:'var(--odoo-gray)'}}>→</span>
                            <div>
                              <div style={{fontSize:'10px',color:'var(--odoo-gray)',marginBottom:'3px'}}>AFTER</div>
                              <span className="diff-new">{log.changes.new}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CREATE — new data */}
                      {log.action === 'CREATE' && log.changes.new && (
                        <div style={{background:'#F0FFF8',borderRadius:'8px',padding:'12px',minWidth:'300px',
                          boxShadow:'0 1px 4px rgba(0,0,0,.06)',borderLeft:'3px solid var(--odoo-green)'}}>
                          <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-green)',
                            textTransform:'uppercase',marginBottom:'8px'}}>✅ Created Data</div>
                          {Object.entries(log.changes.new).map(([k,v]) => (
                            <div key={k} style={{display:'flex',gap:'8px',padding:'4px 0',
                              borderBottom:'1px solid #D4EDDA',fontSize:'12px'}}>
                              <span style={{color:'var(--odoo-gray)',minWidth:'100px',fontWeight:'600',
                                textTransform:'capitalize'}}>{k}:</span>
                              <span className="diff-new">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* DELETE — old data */}
                      {log.action === 'DELETE' && log.changes.old && (
                        <div style={{background:'#FFF5F5',borderRadius:'8px',padding:'12px',minWidth:'300px',
                          boxShadow:'0 1px 4px rgba(0,0,0,.06)',borderLeft:'3px solid var(--odoo-red)'}}>
                          <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-red)',
                            textTransform:'uppercase',marginBottom:'8px'}}>🗑️ Deleted Data</div>
                          {Object.entries(log.changes.old).map(([k,v]) => (
                            <div key={k} style={{display:'flex',gap:'8px',padding:'4px 0',
                              borderBottom:'1px solid #F8D7DA',fontSize:'12px'}}>
                              <span style={{color:'var(--odoo-gray)',minWidth:'100px',fontWeight:'600',
                                textTransform:'capitalize'}}>{k}:</span>
                              <span className="diff-old">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* APPROVE / LOGIN / EXPORT */}
                      {['APPROVE','LOGIN','EXPORT'].includes(log.action) && (
                        <div style={{background:'#F8F9FA',borderRadius:'8px',padding:'12px',minWidth:'260px',
                          boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
                          <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',
                            textTransform:'uppercase',marginBottom:'8px'}}>Details</div>
                          {Object.entries(log.changes.new||log.changes.old||{}).map(([k,v]) => (
                            <div key={k} style={{display:'flex',gap:'8px',padding:'4px 0',fontSize:'12px'}}>
                              <span style={{color:'var(--odoo-gray)',minWidth:'90px',fontWeight:'600',
                                textTransform:'capitalize'}}>{k}:</span>
                              <strong>{v}</strong>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      <div style={{background:'#F8F9FA',borderRadius:'8px',padding:'12px',minWidth:'200px',
                        boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
                        <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',
                          textTransform:'uppercase',marginBottom:'8px'}}>Audit Metadata</div>
                        {[['Log ID',log.id],['Timestamp',log.ts],['User',log.user],
                          ['Role',log.role],['IP Address',log.ip],['Module',log.module]].map(([l,v]) => (
                          <div key={l} style={{display:'flex',gap:'6px',padding:'3px 0',fontSize:'11px'}}>
                            <span style={{color:'var(--odoo-gray)',minWidth:'80px'}}>{l}:</span>
                            <strong style={{fontFamily:l==='IP Address'||l==='Log ID'?'DM Mono,monospace':'inherit',
                              fontSize:'11px'}}>{v}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{display:'flex',gap:'6px',justifyContent:'center',marginTop:'14px',alignItems:'center'}}>
          <button className="btn btn-s sd-bsm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
          {Array.from({length:pages},(_,i)=>i+1).map(p=>(
            <button key={p} className={`btn ${p===page?'btn-p':'btn-s'} sd-bsm`}
              style={{minWidth:'36px'}} onClick={()=>setPage(p)}>{p}</button>
          ))}
          <button className="btn btn-s sd-bsm" disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next →</button>
          <span style={{fontSize:'12px',color:'var(--odoo-gray)',marginLeft:'8px'}}>
            {filtered.length} total records
          </span>
        </div>
      )}
    </div>
  )
}
