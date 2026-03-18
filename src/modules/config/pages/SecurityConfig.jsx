import React, { useState } from 'react'
import { SESSION_LOG, USERS } from './_configData'

export default function SecurityConfig() {
  const [sessions,  setSessions]  = useState(SESSION_LOG)
  const [tab,       setTab]       = useState('sessions')
  const [policy,    setPolicy]    = useState({
    minLength: 8, requireUpper: true, requireNumber: true, requireSpecial: false,
    expireDays: 90, maxAttempts: 5, sessionTimeout: 480, mfa: false
  })
  const setP = (k, v) => setPolicy(p => ({ ...p, [k]: v }))

  const activeSessions = sessions.filter(s => s.status === 'Active')
  const killSession = id => setSessions(ss => ss.map(s => s.id===id ? {...s, status:'Killed', logoutTime:'Just now'} : s))

  const scoreColor = () => {
    let score = 0
    if (policy.minLength >= 8) score++
    if (policy.requireUpper) score++
    if (policy.requireNumber) score++
    if (policy.requireSpecial) score++
    if (policy.mfa) score += 2
    if (score <= 2) return ['#C0392B','Weak']
    if (score <= 4) return ['#E65100','Medium']
    return ['#117A65','Strong']
  }
  const [color, label] = scoreColor()

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Security & Sessions <small>Active sessions · Password policy</small></div>
        <div className="fi-lv-actions">
          <div style={{padding:'4px 12px',borderRadius:'6px',background:'#E8F5E9',color:'#2E7D32',fontSize:'12px',fontWeight:'700'}}>
            🟢 {activeSessions.length} Active Sessions
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:0,marginBottom:'16px',borderBottom:'2px solid var(--odoo-border)'}}>
        {[['sessions','🖥️ Active Sessions'],['policy','🔒 Password Policy'],['log','📋 Login History']].map(([k,l])=>(
          <div key={k} onClick={()=>setTab(k)}
            style={{padding:'8px 18px',cursor:'pointer',fontSize:'12px',fontWeight:'700',
              borderBottom:tab===k?'2px solid var(--odoo-purple)':'2px solid transparent',
              color:tab===k?'var(--odoo-purple)':'var(--odoo-gray)',marginBottom:'-2px'}}>{l}</div>
        ))}
      </div>

      {tab==='sessions' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'14px'}}>
            {[
              {l:'Active Now',v:activeSessions.length,c:'var(--odoo-green)',i:'🟢'},
              {l:'Total Today',v:sessions.length,c:'var(--odoo-blue)',i:'📊'},
              {l:'Unique Users',v:[...new Set(sessions.map(s=>s.userId))].length,c:'var(--odoo-purple)',i:'👥'},
            ].map(k=>(
              <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.c}}>
                <div className="crm-kpi-icon">{k.i}</div>
                <div className="crm-kpi-val" style={{color:k.c}}>{k.v}</div>
                <div className="crm-kpi-lbl">{k.l}</div>
              </div>
            ))}
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {activeSessions.map(s=>(
              <div key={s.id} style={{padding:'12px 16px',background:'#fff',borderRadius:'8px',
                border:'1px solid var(--odoo-border)',display:'flex',alignItems:'center',gap:'12px',
                borderLeft:'4px solid var(--odoo-green)'}}>
                <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'var(--odoo-purple)',
                  display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'13px',fontWeight:'800'}}>
                  {s.userName.split(' ').map(w=>w[0]).slice(0,2).join('')}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:'700',fontSize:'13px'}}>{s.userName}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>
                    🛡️ {s.role} &nbsp;·&nbsp; 🌐 {s.ip} &nbsp;·&nbsp; 🖥️ {s.browser}
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>Login: {s.loginTime}</div>
                  <div style={{fontSize:'10px',color:'var(--odoo-green)',fontWeight:'700',marginTop:'1px'}}>● Active</div>
                </div>
                <button onClick={()=>killSession(s.id)}
                  style={{padding:'5px 10px',borderRadius:'6px',border:'1px solid #C62828',background:'#FFEBEE',
                    color:'#C62828',fontSize:'11px',fontWeight:'700',cursor:'pointer'}}>
                  🔒 End Session
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='policy' && (
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'14px'}}>
          <div className="fi-panel" style={{margin:0}}>
            <div className="fi-panel-hdr"><h3>🔒 Password Policy</h3></div>
            <div className="fi-panel-body">
              <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                {[
                  {k:'minLength',l:'Minimum Length',type:'number',min:6,max:32},
                  {k:'expireDays',l:'Password Expires (days, 0 = never)',type:'number',min:0,max:365},
                  {k:'maxAttempts',l:'Max Failed Login Attempts',type:'number',min:3,max:20},
                  {k:'sessionTimeout',l:'Session Timeout (minutes)',type:'number',min:15,max:1440},
                ].map(f=>(
                  <div key={f.k} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <label style={{fontSize:'12px',fontWeight:'600'}}>{f.l}</label>
                    <input type="number" value={policy[f.k]} onChange={e=>setP(f.k,parseInt(e.target.value))}
                      min={f.min} max={f.max}
                      style={{width:'80px',padding:'5px 8px',border:'1px solid var(--odoo-border)',borderRadius:'5px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:'700'}} />
                  </div>
                ))}
                <div style={{borderTop:'1px solid var(--odoo-border)',paddingTop:'12px'}}>
                  {[
                    {k:'requireUpper',l:'Require Uppercase Letter'},
                    {k:'requireNumber',l:'Require Number'},
                    {k:'requireSpecial',l:'Require Special Character (!@#$)'},
                    {k:'mfa',l:'Enable Multi-Factor Authentication (MFA)'},
                  ].map(f=>(
                    <label key={f.k} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',cursor:'pointer',borderBottom:'1px solid #F0F0F0'}}>
                      <div onClick={()=>setP(f.k,!policy[f.k])}
                        style={{width:'36px',height:'20px',borderRadius:'10px',position:'relative',cursor:'pointer',flexShrink:0,
                          background:policy[f.k]?'var(--odoo-purple)':'#DDD',transition:'all .2s'}}>
                        <div style={{position:'absolute',top:'2px',left:policy[f.k]?'18px':'2px',width:'16px',height:'16px',borderRadius:'50%',background:'#fff',transition:'all .2s'}}></div>
                      </div>
                      <span style={{fontSize:'12px',fontWeight:'600'}}>{f.l}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button className="btn btn-p btn-s" style={{marginTop:'14px'}}>Save Policy</button>
            </div>
          </div>

          {/* Security score card */}
          <div className="fi-panel" style={{margin:0}}>
            <div className="fi-panel-hdr"><h3>🛡️ Security Score</h3></div>
            <div className="fi-panel-body" style={{textAlign:'center'}}>
              <div style={{width:'80px',height:'80px',borderRadius:'50%',border:`6px solid ${color}`,
                display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',
                fontFamily:'Syne,sans-serif',fontWeight:'900',fontSize:'24px',color}}>
                {label==='Weak'?'⚠️':label==='Medium'?'🛡️':'🔐'}
              </div>
              <div style={{fontWeight:'800',fontSize:'16px',color,marginBottom:'4px'}}>{label}</div>
              <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginBottom:'16px'}}>Security Level</div>
              <div style={{display:'flex',flexDirection:'column',gap:'6px',textAlign:'left'}}>
                {[
                  {l:'Min 8 chars',ok:policy.minLength>=8},
                  {l:'Uppercase required',ok:policy.requireUpper},
                  {l:'Number required',ok:policy.requireNumber},
                  {l:'Special char',ok:policy.requireSpecial},
                  {l:'MFA enabled',ok:policy.mfa},
                  {l:'Session timeout',ok:policy.sessionTimeout<=480},
                ].map(x=>(
                  <div key={x.l} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11px'}}>
                    <span style={{fontSize:'14px'}}>{x.ok?'✅':'⬜'}</span>
                    <span style={{color:x.ok?'var(--odoo-text)':'var(--odoo-gray)',fontWeight:x.ok?'600':'400'}}>{x.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='log' && (
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead><tr><th>User</th><th>Role</th><th>IP</th><th>Browser</th><th>Login</th><th>Logout</th><th>Status</th></tr></thead>
            <tbody>
              {sessions.map(s=>(
                <tr key={s.id}>
                  <td><strong style={{fontSize:'12px'}}>{s.userName}</strong></td>
                  <td><span style={{fontSize:'10px',padding:'2px 6px',borderRadius:'5px',background:'#EDE0EA',color:'var(--odoo-purple)',fontWeight:'700'}}>{s.role}</span></td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{s.ip}</td>
                  <td style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{s.browser}</td>
                  <td style={{fontSize:'11px'}}>{s.loginTime}</td>
                  <td style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{s.logoutTime}</td>
                  <td>
                    <span style={{padding:'2px 7px',borderRadius:'6px',fontSize:'10px',fontWeight:'700',
                      background:s.status==='Active'?'#E8F5E9':s.status==='Killed'?'#FFEBEE':'#F5F5F5',
                      color:s.status==='Active'?'#2E7D32':s.status==='Killed'?'#C62828':'#757575'}}>
                      ● {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
