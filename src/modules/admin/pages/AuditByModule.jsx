import React, { useState } from 'react'
import { AUDIT_LOGS, ACTION_COLORS, MODULES } from './_auditData'

export default function AuditByModule() {
  const [activeModule, setActiveModule] = useState('SD')
  const logs = AUDIT_LOGS.filter(l => l.module === activeModule)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Audit by Module <small>Module-wise activity breakdown</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      {/* Module selector cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:'10px',marginBottom:'18px'}}>
        {MODULES.filter(m => m !== 'All').map(m => {
          const count = AUDIT_LOGS.filter(l => l.module === m).length
          const dels  = AUDIT_LOGS.filter(l => l.module === m && l.action === 'DELETE').length
          return (
            <div key={m} onClick={() => setActiveModule(m)}
              style={{background:'#fff',borderRadius:'8px',padding:'12px',cursor:'pointer',textAlign:'center',
                boxShadow:'0 1px 4px rgba(0,0,0,.08)',transition:'all .15s',
                border:`2px solid ${activeModule===m?'var(--odoo-purple)':'transparent'}`,
                background:activeModule===m?'#F7F0F5':'#fff'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'20px',
                color:activeModule===m?'var(--odoo-purple)':'var(--odoo-dark)'}}>{count}</div>
              <div style={{fontSize:'12px',fontWeight:'700',color:'var(--odoo-dark)'}}>{m}</div>
              {dels > 0 && <div style={{fontSize:'10px',color:'var(--odoo-red)',marginTop:'2px'}}>
                 {dels} delete{dels>1?'s':''}
              </div>}
            </div>
          )
        })}
      </div>

      {/* Module logs */}
      <div className="fi-panel">
        <div className="fi-panel-hdr">
          <h3>{activeModule} Module — {logs.length} Events</h3>
          <div style={{display:'flex',gap:'8px'}}>
            {['CREATE','UPDATE','DELETE','APPROVE'].map(a => {
              const n = logs.filter(l=>l.action===a).length
              return n > 0 ? <span key={a} className={ACTION_COLORS[a]}>{a}: {n}</span> : null
            })}
          </div>
        </div>
        {logs.length === 0 ? (
          <div style={{padding:'40px',textAlign:'center',color:'var(--odoo-gray)'}}>
            No activity recorded for {activeModule} module yet.
          </div>
        ) : (
          <div style={{padding:'0'}}>
            <table className="fi-data-table">
              <thead><tr>
                <th>Log ID</th><th>Timestamp</th><th>User</th><th>Action</th>
                <th>Entity</th><th>Reference</th><th>What Changed</th>
              </tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{background:log.action==='DELETE'?'#FFF5F5':'inherit'}}>
                    <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)',fontWeight:'700'}}>{log.id}</span></td>
                    <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{log.ts}</span></td>
                    <td><strong style={{fontSize:'12px'}}>{log.user}</strong><div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{log.ip}</div></td>
                    <td><span className={ACTION_COLORS[log.action]}>{log.action}</span></td>
                    <td style={{fontSize:'12px',fontWeight:'600'}}>{log.entity}</td>
                    <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-blue)',fontWeight:'700'}}>{log.ref}</span></td>
                    <td style={{maxWidth:'260px'}}>
                      {log.action === 'UPDATE' && log.changes.field && (
                        <div style={{fontSize:'11px',display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap'}}>
                          <strong>{log.changes.field}:</strong>
                          <span className="diff-old">{log.changes.old}</span>
                          <span>→</span>
                          <span className="diff-new">{log.changes.new}</span>
                        </div>
                      )}
                      {log.action === 'CREATE' && (
                        <div style={{fontSize:'11px',color:'var(--odoo-green)',fontWeight:'600'}}>
                           New {log.entity} created — {Object.entries(log.changes.new||{}).map(([k,v])=>`${k}: ${v}`).join(' · ')}
                        </div>
                      )}
                      {log.action === 'DELETE' && (
                        <div style={{fontSize:'11px',color:'var(--odoo-red)',fontWeight:'600'}}>
                           {Object.entries(log.changes.old||{}).map(([k,v])=>`${k}: ${v}`).join(' · ')}
                        </div>
                      )}
                      {log.action === 'APPROVE' && (
                        <div style={{fontSize:'11px',color:'var(--odoo-blue)',fontWeight:'600'}}>
                           {log.changes.field}: <span className="diff-old">{log.changes.old}</span> → <span className="diff-new">{log.changes.new}</span>
                        </div>
                      )}
                      {log.action === 'EXPORT' && (
                        <div style={{fontSize:'11px',color:'var(--odoo-purple)',fontWeight:'600'}}>
                           {Object.entries(log.changes.new||{}).map(([k,v])=>`${k}: ${v}`).join(' · ')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
