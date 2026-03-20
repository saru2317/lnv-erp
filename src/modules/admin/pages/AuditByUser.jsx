import React, { useState } from 'react'
import { AUDIT_LOGS, ACTION_COLORS, USERS } from './_auditData'

export default function AuditByUser() {
  const [activeUser, setActiveUser] = useState('Admin')
  const userList = USERS.filter(u => u !== 'All')
  const logs = AUDIT_LOGS.filter(l => l.user === activeUser)

  const stats = {
    create:  logs.filter(l=>l.action==='CREATE').length,
    update:  logs.filter(l=>l.action==='UPDATE').length,
    delete:  logs.filter(l=>l.action==='DELETE').length,
    approve: logs.filter(l=>l.action==='APPROVE').length,
    login:   logs.filter(l=>l.action==='LOGIN').length,
    export:  logs.filter(l=>l.action==='EXPORT').length,
  }
  const modules = [...new Set(logs.map(l=>l.module))]

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Audit by User <small>Per-user activity trail</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-panel-grid">
        {/* User list */}
        <div style={{flex:'0 0 220px',minWidth:'180px'}}>
          <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',overflow:'hidden'}}>
            <div style={{padding:'10px 14px',background:'#F0EEEB',fontWeight:'700',fontSize:'12px',
              color:'var(--odoo-gray)',textTransform:'uppercase',letterSpacing:'.5px'}}>Users</div>
            {userList.map(u => {
              const uLogs = AUDIT_LOGS.filter(l=>l.user===u)
              const uDels = uLogs.filter(l=>l.action==='DELETE').length
              return (
                <div key={u} onClick={() => setActiveUser(u)}
                  style={{padding:'10px 14px',cursor:'pointer',
                    background:activeUser===u?'#EDE0EA':'#fff',
                    borderBottom:'1px solid var(--odoo-border)',transition:'background .1s'}}>
                  <div style={{fontWeight:'700',fontSize:'13px',
                    color:activeUser===u?'var(--odoo-purple)':'var(--odoo-dark)'}}>{u}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)',display:'flex',gap:'8px',marginTop:'2px'}}>
                    <span>{uLogs.length} events</span>
                    {uDels>0&&<span style={{color:'var(--odoo-red)'}}>{uDels}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* User detail */}
        <div style={{flex:1}}>
          <div style={{background:'var(--odoo-purple)',borderRadius:'8px',padding:'14px 18px',
            color:'#fff',marginBottom:'14px',display:'flex',gap:'16px',flexWrap:'wrap',alignItems:'center'}}>
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'18px'}}>{activeUser}</div>
              <div style={{fontSize:'11px',opacity:.7,marginTop:'2px'}}>
                Modules accessed: {modules.join(', ')} · {logs.length} total events
              </div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {Object.entries(stats).filter(([,v])=>v>0).map(([a,n])=>(
                <div key={a} style={{background:'rgba(255,255,255,.15)',borderRadius:'6px',
                  padding:'4px 10px',textAlign:'center'}}>
                  <div style={{fontSize:'14px',fontWeight:'800'}}>{n}</div>
                  <div style={{fontSize:'10px',textTransform:'uppercase',opacity:.8}}>{a}</div>
                </div>
              ))}
            </div>
          </div>

          {logs.length === 0 ? (
            <div style={{padding:'40px',textAlign:'center',color:'var(--odoo-gray)',background:'#fff',borderRadius:'8px'}}>
              No activity for this user.
            </div>
          ) : (
            <table className="fi-data-table">
              <thead><tr>
                <th>Log ID</th><th>Timestamp</th><th>Module</th><th>Action</th>
                <th>Entity</th><th>Reference</th><th>What Changed</th>
              </tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{background:log.action==='DELETE'?'#FFF5F5':'inherit'}}>
                    <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)',fontWeight:'700'}}>{log.id}</span></td>
                    <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{log.ts}</span></td>
                    <td><span style={{background:'#EDE0EA',color:'var(--odoo-purple)',padding:'2px 7px',borderRadius:'4px',fontSize:'11px',fontWeight:'700'}}>{log.module}</span></td>
                    <td><span className={ACTION_COLORS[log.action]}>{log.action}</span></td>
                    <td style={{fontSize:'12px',fontWeight:'600'}}>{log.entity}</td>
                    <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-blue)',fontWeight:'700'}}>{log.ref}</span></td>
                    <td style={{fontSize:'11px',maxWidth:'220px'}}>
                      {log.action==='UPDATE'&&log.changes.field&&(
                        <span><strong>{log.changes.field}:</strong> <span className="diff-old">{log.changes.old}</span> → <span className="diff-new">{log.changes.new}</span></span>
                      )}
                      {log.action==='CREATE'&&<span style={{color:'var(--odoo-green)'}}>New record</span>}
                      {log.action==='DELETE'&&<span style={{color:'var(--odoo-red)'}}>{log.changes.old?.reason||'Deleted'}</span>}
                      {log.action==='LOGIN'&&<span style={{color:'var(--odoo-blue)'}}>System login · {log.ip}</span>}
                      {log.action==='EXPORT'&&<span style={{color:'var(--odoo-purple)'}}>{log.changes.new?.format}</span>}
                      {log.action==='APPROVE'&&<span className="diff-new">Approved</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
