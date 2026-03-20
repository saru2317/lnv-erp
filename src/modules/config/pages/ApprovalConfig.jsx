import React, { useState } from 'react'
import toast from 'react-hot-toast'

const INITIAL_CONFIGS = [
  {
    id:'APR-001', docType:'Purchase Indent (PR)', module:'MM', active:true,
    escalationDays:2,
    levels:[
      { level:1, role:'HOD / Dept Head',    users:['Dept HOD'],          limitMin:0,      limitMax:50000,   action:'Review & Forward' },
      { level:2, role:'Purchase Manager',   users:['Purchase Manager'],  limitMin:0,      limitMax:200000,  action:'Review & Approve' },
      { level:3, role:'General Manager',    users:['GM — Works'],        limitMin:50000,  limitMax:500000,  action:'Final Approve'    },
    ]
  },
  {
    id:'APR-002', docType:'Purchase Order (PO)', module:'MM', active:true,
    escalationDays:2,
    levels:[
      { level:1, role:'Purchase Manager',   users:['Purchase Manager'],  limitMin:0,      limitMax:100000,  action:'Review & Approve' },
      { level:2, role:'General Manager',    users:['GM — Works'],        limitMin:100000, limitMax:500000,  action:'Approve'          },
      { level:3, role:'Managing Director',  users:['MD'],                limitMin:500000, limitMax:9999999, action:'Final Approve'    },
    ]
  },
  {
    id:'APR-003', docType:'Sales Order (SO)', module:'SD', active:true,
    escalationDays:2,
    levels:[
      { level:1, role:'Sales Manager',      users:['Sales Manager'],     limitMin:0,      limitMax:200000,  action:'Review & Approve' },
      { level:2, role:'General Manager',    users:['GM — Sales'],        limitMin:200000, limitMax:9999999, action:'Final Approve'    },
    ]
  },
  {
    id:'APR-004', docType:'Payment Voucher (PV)', module:'FI', active:true,
    escalationDays:2,
    levels:[
      { level:1, role:'Accounts Head',      users:['Accounts Manager'],  limitMin:0,      limitMax:50000,   action:'Verify & Forward' },
      { level:2, role:'General Manager',    users:['GM — Finance'],      limitMin:0,      limitMax:500000,  action:'Approve'          },
      { level:3, role:'Managing Director',  users:['MD'],                limitMin:500000, limitMax:9999999, action:'Final Approve'    },
    ]
  },
  {
    id:'APR-005', docType:'Credit Note / Discount', module:'SD', active:true,
    escalationDays:1,
    levels:[
      { level:1, role:'Sales Manager',      users:['Sales Manager'],     limitMin:0,      limitMax:10000,   action:'Approve'          },
      { level:2, role:'General Manager',    users:['GM'],                limitMin:10000,  limitMax:9999999, action:'Final Approve'    },
    ]
  },
]

const MODULE_COLORS = { MM:'#1A5276', SD:'#714B67', FI:'#196F3D', PP:'#784212', QM:'#6C3483' }
const fmt = n => n >= 9999999 ? 'No Limit' : '₹'+Number(n).toLocaleString('en-IN')

export default function ApprovalConfig() {
  const [configs, setConfigs] = useState(INITIAL_CONFIGS)
  const [expanded, setExpanded] = useState('APR-001')
  const [editDays, setEditDays] = useState({})

  const toggleActive = id =>
    setConfigs(cs => cs.map(c => c.id===id ? {...c, active:!c.active} : c))

  const saveEscalation = (id, days) => {
    setConfigs(cs => cs.map(c => c.id===id ? {...c, escalationDays:Number(days)} : c))
    toast.success('Escalation days updated!')
    setEditDays(e => ({...e, [id]:false}))
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Approval Configuration
          <small>Dynamic multi-level approval workflows per document type</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-p" onClick={() => toast.success('New approval workflow — coming soon!')}>
            + New Workflow
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div style={{padding:'10px 14px', background:'#FFF8E1', border:'1px solid #F5C518',
        borderRadius:6, marginBottom:16, fontSize:12, color:'#856404', display:'flex', gap:8, alignItems:'flex-start'}}>
        <span style={{fontSize:18}}></span>
        <div>
          <strong>Auto-Escalation:</strong> If an approver does not act within the configured days,
          the approval request automatically escalates to the next level.
          The original approver receives a reminder and the next approver gets a new notification.
        </div>
      </div>

      {/* Workflow cards */}
      {configs.map(cfg => {
        const mc = MODULE_COLORS[cfg.module] || '#555'
        const isExp = expanded === cfg.id
        return (
          <div key={cfg.id} style={{background:'#fff', border:'1px solid var(--odoo-border)',
            borderRadius:8, marginBottom:12, overflow:'hidden',
            boxShadow:'0 1px 4px rgba(0,0,0,.06)',
            opacity: cfg.active ? 1 : .6}}>

            {/* Header */}
            <div style={{padding:'12px 16px', display:'flex', alignItems:'center', gap:12,
              cursor:'pointer', background: isExp ? 'var(--odoo-purple-lt)' : '#fff',
              borderBottom: isExp ? '1px solid var(--odoo-border)' : 'none'}}
              onClick={() => setExpanded(isExp ? null : cfg.id)}>
              {/* Module badge */}
              <span style={{padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700,
                background:mc, color:'#fff', minWidth:36, textAlign:'center'}}>{cfg.module}</span>
              {/* Doc type */}
              <div style={{flex:1}}>
                <div style={{fontWeight:700, fontSize:13, color:'var(--odoo-dark)'}}>{cfg.docType}</div>
                <div style={{fontSize:11, color:'var(--odoo-gray)', marginTop:2}}>
                  {cfg.levels.length} approval levels &nbsp;·&nbsp;
                  Auto-escalate after {cfg.escalationDays} day{cfg.escalationDays>1?'s':''}
                </div>
              </div>
              {/* Level pills */}
              <div style={{display:'flex', gap:4}}>
                {cfg.levels.map(l => (
                  <span key={l.level} style={{width:24, height:24, borderRadius:'50%',
                    background:'var(--odoo-purple)', color:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:700}}>
                    {l.level}
                  </span>
                ))}
              </div>
              {/* Active toggle */}
              <div onClick={e => {e.stopPropagation(); toggleActive(cfg.id)}}
                style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer'}}>
                <div style={{width:36, height:20, borderRadius:10,
                  background: cfg.active ? 'var(--odoo-green)' : '#ccc',
                  position:'relative', transition:'all .2s'}}>
                  <div style={{width:16, height:16, borderRadius:'50%', background:'#fff',
                    position:'absolute', top:2,
                    left: cfg.active ? 18 : 2, transition:'left .2s',
                    boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
                </div>
                <span style={{fontSize:11, fontWeight:600,
                  color: cfg.active ? 'var(--odoo-green)' : 'var(--odoo-gray)'}}>
                  {cfg.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <span style={{color:'var(--odoo-gray)', fontSize:16}}>{isExp ? '▲' : '▼'}</span>
            </div>

            {/* Expanded content */}
            {isExp && (
              <div style={{padding:16}}>
                {/* Escalation config */}
                <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16,
                  padding:'10px 14px', background:'#FFF8E1', borderRadius:6,
                  border:'1px solid #F5C51840'}}>
                  <span style={{fontSize:16}}>⏰</span>
                  <span style={{fontSize:12, fontWeight:600, color:'#856404'}}>
                    Auto-Escalation:
                  </span>
                  {editDays[cfg.id] ? (
                    <div style={{display:'flex', gap:6, alignItems:'center'}}>
                      <input type="number" min={1} max={30}
                        defaultValue={cfg.escalationDays}
                        style={{width:60, padding:'4px 8px', border:'1px solid var(--odoo-border)',
                          borderRadius:4, fontFamily:'DM Mono,monospace', fontSize:13, textAlign:'center'}}
                        id={`esc-${cfg.id}`} />
                      <span style={{fontSize:12}}>days</span>
                      <button onClick={() => saveEscalation(cfg.id, document.getElementById(`esc-${cfg.id}`).value)}
                        style={{padding:'3px 10px', fontSize:11, fontWeight:700,
                          borderRadius:5, border:'none', background:'var(--odoo-green)',
                          color:'#fff', cursor:'pointer'}}>Save</button>
                    </div>
                  ) : (
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <span style={{fontFamily:'DM Mono,monospace', fontSize:14, fontWeight:700,
                        color:'#856404'}}>{cfg.escalationDays} days</span>
                      <button onClick={() => setEditDays(e => ({...e, [cfg.id]:true}))}
                        style={{padding:'2px 8px', fontSize:10, fontWeight:600,
                          borderRadius:5, border:'1px solid #F5C518',
                          background:'#fff', color:'#856404', cursor:'pointer'}}>Edit</button>
                    </div>
                  )}
                  <span style={{fontSize:11, color:'#856404', marginLeft:4}}>
                    — If Level {'{N}'} approver doesn't act in {cfg.escalationDays} day{cfg.escalationDays>1?'s':''}, auto-escalates to Level {'{N+1}'}
                  </span>
                </div>

                {/* Levels timeline */}
                <div style={{position:'relative'}}>
                  {/* Vertical line */}
                  <div style={{position:'absolute', left:20, top:24, bottom:24,
                    width:2, background:'var(--odoo-border)', zIndex:0}}/>

                  {cfg.levels.map((lv, li) => (
                    <div key={lv.level} style={{display:'flex', gap:16, marginBottom:12,
                      position:'relative', zIndex:1}}>
                      {/* Level circle */}
                      <div style={{width:40, height:40, borderRadius:'50%', flexShrink:0,
                        background:'var(--odoo-purple)', color:'#fff',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:800,
                        boxShadow:'0 2px 8px rgba(113,75,103,.4)'}}>
                        {lv.level}
                      </div>
                      {/* Level card */}
                      <div style={{flex:1, background:'var(--odoo-bg)', borderRadius:6,
                        padding:'10px 14px', border:'1px solid var(--odoo-border)'}}>
                        <div style={{display:'flex', justifyContent:'space-between',
                          alignItems:'flex-start', marginBottom:8}}>
                          <div>
                            <div style={{fontWeight:700, fontSize:13}}>{lv.role}</div>
                            <div style={{fontSize:11, color:'var(--odoo-gray)', marginTop:2}}>
                              {lv.users.join(' / ')}
                            </div>
                          </div>
                          <span style={{padding:'3px 10px', borderRadius:6, fontSize:11,
                            fontWeight:600, background:'#EDE0EA', color:'var(--odoo-purple)'}}>
                            {lv.action}
                          </span>
                        </div>
                        <div style={{display:'flex', gap:12, fontSize:11}}>
                          <div style={{background:'#fff', padding:'4px 10px', borderRadius:4,
                            border:'1px solid var(--odoo-border)'}}>
                            <span style={{color:'var(--odoo-gray)'}}>Min: </span>
                            <strong>{fmt(lv.limitMin)}</strong>
                          </div>
                          <div style={{background:'#fff', padding:'4px 10px', borderRadius:4,
                            border:'1px solid var(--odoo-border)'}}>
                            <span style={{color:'var(--odoo-gray)'}}>Max: </span>
                            <strong>{fmt(lv.limitMax)}</strong>
                          </div>
                          {li < cfg.levels.length-1 && (
                            <div style={{background:'#FFF8E1', padding:'4px 10px', borderRadius:4,
                              border:'1px solid #F5C518', color:'#856404'}}>
                              ⏰ Escalates after {cfg.escalationDays}d if no action
                            </div>
                          )}
                          {li === cfg.levels.length-1 && (
                            <div style={{background:'#D4EDDA', padding:'4px 10px', borderRadius:4,
                              border:'1px solid #C3E6CB', color:'#155724'}}>
                               Final Approval — Document gets approved
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Rejected end */}
                  <div style={{display:'flex', gap:16, position:'relative', zIndex:1}}>
                    <div style={{width:40, height:40, borderRadius:'50%', flexShrink:0,
                      background:'var(--odoo-red)', color:'#fff',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:16, fontWeight:800}}>
                      
                    </div>
                    <div style={{flex:1, background:'#FFF5F5', borderRadius:6,
                      padding:'10px 14px', border:'1px solid #F8D7DA',
                      display:'flex', alignItems:'center'}}>
                      <span style={{fontSize:12, color:'#721C24', fontWeight:600}}>
                        Rejected — Document goes back to creator with rejection reason.
                        Creator can edit & resubmit.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
