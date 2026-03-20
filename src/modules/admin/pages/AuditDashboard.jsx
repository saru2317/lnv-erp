import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AUDIT_LOGS, ACTION_COLORS } from './_auditData'

const TODAY = AUDIT_LOGS.filter(l => l.ts.startsWith('2025-03-01'))
const MODULE_COUNTS = ['SD','MM','WM','FI','PP','QM','PM','HCM','SYSTEM'].map(m => ({
  m, count: AUDIT_LOGS.filter(l => l.module === m).length
})).sort((a,b) => b.count - a.count)

export default function AuditDashboard() {
  const nav = useNavigate()

  const creates = AUDIT_LOGS.filter(l=>l.action==='CREATE').length
  const updates = AUDIT_LOGS.filter(l=>l.action==='UPDATE').length
  const deletes = AUDIT_LOGS.filter(l=>l.action==='DELETE').length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Audit Trail Dashboard <small>System-wide Activity Monitor</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/admin/audit/logs')}>Full Audit Log</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="pp-alert warn">
         <strong>Admin Only</strong> — This section is visible only to Admin role. All ERP actions are permanently logged and cannot be deleted.
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'18px'}}>
        {[{l:'Total Events',     v:AUDIT_LOGS.length,  clr:'var(--odoo-purple)',ic:''},
          {l:'Creates',          v:creates,             clr:'var(--odoo-green)', ic:''},
          {l:'Updates',          v:updates,             clr:'var(--odoo-orange)',ic:''},
          {l:'Deletes',          v:deletes,             clr:'var(--odoo-red)',   ic:''},
          {l:'Active Users Today',v:new Set(TODAY.map(l=>l.user)).size, clr:'var(--odoo-blue)',ic:''},
        ].map(k => (
          <div key={k.l} style={{background:'#fff',borderRadius:'8px',padding:'14px',
            boxShadow:'0 1px 4px rgba(0,0,0,.08)',borderLeft:`4px solid ${k.clr}`,textAlign:'center'}}>
            <div style={{fontSize:'22px',marginBottom:'4px'}}>{k.ic}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'22px',color:k.clr}}>{k.v}</div>
            <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase'}}>{k.l}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Recent activity */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3> Recent Activity</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/admin/audit/logs')}>View All</button>
          </div>
          <div className="fi-panel-body" style={{padding:'0'}}>
            {AUDIT_LOGS.slice(0,8).map(log => (
              <div key={log.id} style={{display:'flex',gap:'10px',alignItems:'flex-start',
                padding:'10px 14px',borderBottom:'1px solid var(--odoo-border)',cursor:'pointer',
                transition:'background .15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#F8F9FA'}
                onMouseLeave={e=>e.currentTarget.style.background='inherit'}
                onClick={() => nav(`/admin/audit/logs`)}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap',marginBottom:'3px'}}>
                    <strong style={{fontSize:'12px'}}>{log.user}</strong>
                    <span className={ACTION_COLORS[log.action]}>{log.action}</span>
                    <span style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{log.entity}</span>
                    <span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',
                      color:'var(--odoo-purple)',fontWeight:'700'}}>{log.ref}</span>
                  </div>
                  <div style={{display:'flex',gap:'10px',fontSize:'10px',color:'var(--odoo-gray)'}}>
                    <span>{log.module}</span>
                    <span> {log.ts.split(' ')[1]}</span>
                    <span> {log.ip}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module activity */}
        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>Activity by Module</h3></div>
            <div className="fi-panel-body">
              {MODULE_COUNTS.filter(m=>m.count>0).map(m => (
                <div key={m.m} style={{marginBottom:'10px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'3px'}}>
                    <strong>{m.m}</strong>
                    <span style={{fontWeight:'700',color:'var(--odoo-purple)'}}>{m.count} events</span>
                  </div>
                  <div style={{background:'#F0EEEB',borderRadius:'4px',height:'7px'}}>
                    <div style={{width:`${m.count/AUDIT_LOGS.length*100}%`,height:'100%',
                      borderRadius:'4px',background:'var(--odoo-purple)'}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3> Critical Events</h3></div>
            <div className="fi-panel-body">
              {AUDIT_LOGS.filter(l=>l.action==='DELETE').map(l=>(
                <div key={l.id} style={{padding:'8px 0',borderBottom:'1px solid var(--odoo-border)',cursor:'pointer'}}
                  onClick={() => nav('/admin/audit/logs')}>
                  <div style={{display:'flex',gap:'6px',alignItems:'center',marginBottom:'2px'}}>
                    <span className="audit-delete">DELETE</span>
                    <strong style={{fontSize:'12px'}}>{l.entity} — {l.ref}</strong>
                  </div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>By {l.user} · {l.ts}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
