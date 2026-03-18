import React, { useState } from 'react'
import { AUDIT_LOGS, ACTION_CONFIG, MODULES, ACTIONS } from './_auditData'

export default function AuditTrail() {
  const [module,  setModule]  = useState('All')
  const [action,  setAction]  = useState('All')
  const [user,    setUser]    = useState('')
  const [dateFrom,setDateFrom]= useState('')
  const [dateTo,  setDateTo]  = useState('')
  const [detail,  setDetail]  = useState(null)

  const filtered = AUDIT_LOGS.filter(l =>
    (module==='All' || l.module===module) &&
    (action==='All' || l.action===action) &&
    (user==='' || l.user.toLowerCase().includes(user.toLowerCase()) || l.ref.toLowerCase().includes(user.toLowerCase()))
  )

  const counts = ACTIONS.filter(a=>a!=='All').reduce((acc,a) => ({...acc,[a]:AUDIT_LOGS.filter(l=>l.action===a).length}),{})

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Audit Trail <small>All module activity log</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export CSV</button>
          <button className="btn btn-s sd-bsm">Print</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'10px',marginBottom:'16px'}}>
        {[['Total Logs',AUDIT_LOGS.length,'var(--odoo-purple)','📋'],
          ['Creates',counts.CREATE||0,'var(--odoo-green)','➕'],
          ['Updates',counts.UPDATE||0,'var(--odoo-orange)','✏️'],
          ['Deletes',counts.DELETE||0,'var(--odoo-red)','🗑️'],
          ['Approvals',counts.APPROVE||0,'#6B2FA0','✅'],
          ['Logins',counts.LOGIN||0,'var(--odoo-blue)','🔐'],
        ].map(([l,v,c,ic])=>(
          <div key={l} style={{background:'#fff',borderRadius:'8px',padding:'12px',
            boxShadow:'0 1px 4px rgba(0,0,0,.08)',borderLeft:`3px solid ${c}`,textAlign:'center'}}>
            <div style={{fontSize:'18px',marginBottom:'2px'}}>{ic}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'20px',color:c}}>{v}</div>
            <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase'}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{background:'#fff',borderRadius:'8px',padding:'14px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',
        marginBottom:'14px',display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center'}}>
        <select className="fi-filter-select" style={{width:'130px'}} onChange={e=>setModule(e.target.value)}>
          {MODULES.map(m=><option key={m}>{m}</option>)}
        </select>
        <select className="fi-filter-select" style={{width:'130px'}} onChange={e=>setAction(e.target.value)}>
          {ACTIONS.map(a=><option key={a}>{a}</option>)}
        </select>
        <input placeholder="🔍 User / Reference..." className="fi-filter-select" style={{flex:1,minWidth:'180px'}}
          onChange={e=>setUser(e.target.value)}/>
        <div style={{display:'flex',gap:'6px',alignItems:'center',fontSize:'12px',color:'var(--odoo-gray)'}}>
          <span>From</span>
          <input type="date" className="fi-filter-select" style={{width:'140px'}} onChange={e=>setDateFrom(e.target.value)}/>
          <span>To</span>
          <input type="date" className="fi-filter-select" style={{width:'140px'}} onChange={e=>setDateTo(e.target.value)}/>
        </div>
        <div style={{fontSize:'12px',color:'var(--odoo-gray)',fontWeight:'600'}}>
          Showing <strong style={{color:'var(--odoo-purple)'}}>{filtered.length}</strong> of {AUDIT_LOGS.length}
        </div>
      </div>

      {/* Log table */}
      <table className="fi-data-table">
        <thead>
          <tr>
            <th>Audit ID</th>
            <th>Timestamp</th>
            <th>User</th>
            <th>Module</th>
            <th>Entity</th>
            <th>Reference</th>
            <th>Action</th>
            <th>IP Address</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(log => {
            const cfg = ACTION_CONFIG[log.action] || {}
            return (
              <tr key={log.id} className={cfg.rowCls} style={{cursor:'pointer'}}
                onClick={() => setDetail(detail?.id===log.id ? null : log)}>
                <td>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-gray)'}}>{log.id}</span>
                </td>
                <td>
                  <div style={{fontSize:'12px',fontWeight:'600'}}>{log.ts.split(' ')[0]}</div>
                  <div style={{fontSize:'10px',color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace'}}>{log.ts.split(' ')[1]}</div>
                </td>
                <td>
                  <div style={{fontWeight:'700',fontSize:'12px'}}>{log.user}</div>
                  <div style={{fontSize:'10px',color:'var(--odoo-gray)',background:'#EDE0EA',
                    display:'inline-block',padding:'1px 6px',borderRadius:'4px',marginTop:'2px'}}>{log.role}</div>
                </td>
                <td>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',
                    color:'var(--odoo-purple)',background:'#F7F0F5',padding:'2px 8px',borderRadius:'4px'}}>{log.module}</span>
                </td>
                <td style={{fontSize:'12px'}}>{log.entity}</td>
                <td>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-blue)',fontWeight:'600'}}>{log.ref}</span>
                </td>
                <td>
                  <span className={cfg.cls}>{cfg.icon} {log.action}</span>
                </td>
                <td>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-gray)'}}>{log.ip}</span>
                </td>
                <td>
                  <button className="btn-xs pri" onClick={e=>{e.stopPropagation();setDetail(detail?.id===log.id?null:log)}}>
                    {detail?.id===log.id ? '▲ Hide':'▼ View'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Detail drawer */}
      {detail && (
        <div style={{
          position:'fixed',right:0,top:0,bottom:0,width:'420px',
          background:'#fff',boxShadow:'-4px 0 20px rgba(0,0,0,.15)',
          zIndex:1000,overflowY:'auto',padding:'20px'
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'16px'}}>Audit Detail</div>
            <button onClick={()=>setDetail(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'20px',color:'var(--odoo-gray)'}}>✕</button>
          </div>

          {/* Header info */}
          <div style={{background:'#F8F9FA',borderRadius:'8px',padding:'14px',marginBottom:'14px'}}>
            <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'8px'}}>
              <span className={ACTION_CONFIG[detail.action]?.cls}>{ACTION_CONFIG[detail.action]?.icon} {detail.action}</span>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)',fontWeight:'700',background:'#EDE0EA',padding:'2px 8px',borderRadius:'4px'}}>{detail.module}</span>
            </div>
            {[['Audit ID',detail.id],['Timestamp',detail.ts],['User',`${detail.user} (${detail.role})`],
              ['Entity',detail.entity],['Reference',detail.ref],['IP Address',detail.ip],['Browser',detail.browser]
            ].map(([l,v])=>(
              <div key={l} style={{display:'flex',gap:'8px',padding:'5px 0',borderBottom:'1px solid var(--odoo-border)',fontSize:'12px'}}>
                <span style={{minWidth:'90px',color:'var(--odoo-gray)',fontWeight:'700'}}>{l}</span>
                <span style={{fontFamily:['Audit ID','IP Address','Reference','Timestamp'].includes(l)?'DM Mono,monospace':'inherit',
                  fontWeight:'600',fontSize:'11px'}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Changes */}
          <div style={{fontWeight:'800',fontSize:'13px',color:'var(--odoo-dark)',marginBottom:'8px'}}>📝 Data Changes</div>
          <div className="audit-diff-box">
            {/* UPDATE — show before/after */}
            {detail.changes?.before ? (
              Object.keys(detail.changes.before).map(key => (
                <div key={key} style={{marginBottom:'6px'}}>
                  <span className="audit-diff-key">{key}:</span>
                  <span className="audit-diff-old"> {detail.changes.before[key]}</span>
                  <span style={{color:'var(--odoo-gray)',margin:'0 6px'}}>→</span>
                  <span className="audit-diff-new">{detail.changes.after[key]}</span>
                </div>
              ))
            ) : (
              /* CREATE/DELETE/other — flat key-value */
              Object.entries(detail.changes).map(([k,v]) => (
                <div key={k} style={{marginBottom:'6px'}}>
                  <span className="audit-diff-key">{k}:</span>
                  <span style={{
                    color: detail.action==='DELETE'?'var(--odoo-red)':
                           detail.action==='CREATE'?'var(--odoo-green)':
                           detail.action==='LOGIN' ?'var(--odoo-blue)':'var(--odoo-dark)',
                    fontWeight:'600',marginLeft:'8px'
                  }}>{v}</span>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
            <button className="btn btn-s sd-bsm" style={{flex:1}} onClick={()=>setDetail(null)}>Close</button>
            <button className="btn btn-s sd-bsm" style={{flex:1}}>Export This</button>
          </div>
        </div>
      )}

      {/* Overlay when drawer open */}
      {detail && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.3)',zIndex:999}}
          onClick={()=>setDetail(null)}/>
      )}
    </div>
  )
}
