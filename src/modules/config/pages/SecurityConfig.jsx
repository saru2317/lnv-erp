import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const fmtDate = d => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'

const ROLE_CLR = { ADMIN:'#714B67',SUPER_ADMIN:'#714B67',MANAGER:'#E06F39',ACCOUNTS:'#00A09D',PRODUCTION:'#017E84',OPERATIONS:'#017E84',HR:'#8E44AD',SALES:'#015E63',PURCHASE:'#1A5276',WAREHOUSE:'#1F618D',VIEWER:'#6C757D' }

export default function SecurityConfig() {
  const [tab,     setTab]     = useState('sessions')
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [policy,  setPolicy]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('lnv_security_policy') || 'null') || {
      minLength:8, requireUpper:true, requireNumber:true, requireSpecial:false,
      expireDays:90, maxAttempts:5, sessionTimeout:480, mfa:false
    }} catch { return { minLength:8, requireUpper:true, requireNumber:true, requireSpecial:false, expireDays:90, maxAttempts:5, sessionTimeout:480, mfa:false } }
  })
  const setP = (k,v) => setPolicy(p => ({...p, [k]:v}))

  // Load real users + derive sessions from lastLogin
  useEffect(() => {
    setLoading(true)
    fetch(`${BASE_URL}/auth/users`, { headers: hdr2() })
      .then(r => r.json())
      .then(d => setUsers(d.data || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const today     = new Date()
  today.setHours(0,0,0,0)

  // Active = logged in today and isActive
  const activeSessions = users.filter(u => u.isActive && u.lastLogin && new Date(u.lastLogin) >= today)
  // Login history = all users who have ever logged in
  const loginHistory   = users.filter(u => u.lastLogin).sort((a,b) => new Date(b.lastLogin) - new Date(a.lastLogin))

  // Kill session = deactivate user temporarily
  const killSession = async (user) => {
    if (!window.confirm(`Force logout ${user.name}? This will deactivate their account. Re-enable in User Management.`)) return
    try {
      await fetch(`${BASE_URL}/auth/users/${user.id}`, {
        method: 'PATCH', headers: hdr(),
        body: JSON.stringify({ isActive: false })
      })
      toast.success(`${user.name} session terminated`)
      setUsers(us => us.map(u => u.id === user.id ? {...u, isActive:false} : u))
    } catch(e) { toast.error('Failed: ' + e.message) }
  }

  const savePolicy = () => {
    setSaving(true)
    localStorage.setItem('lnv_security_policy', JSON.stringify(policy))
    setTimeout(() => {
      toast.success('Security policy saved')
      setSaving(false)
    }, 400)
  }

  // Security score
  const scoreColor = () => {
    let s = 0
    if (policy.minLength >= 8)    s++
    if (policy.requireUpper)      s++
    if (policy.requireNumber)     s++
    if (policy.requireSpecial)    s++
    if (policy.mfa)               s += 2
    if (policy.sessionTimeout <= 480) s++
    if (s <= 3) return ['#C0392B','Weak',  '⚠️']
    if (s <= 5) return ['#E65100','Medium','🔶']
    return              ['#117A65','Strong','🛡️']
  }
  const [scoreClr, scoreLbl, scoreIcon] = scoreColor()

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Security & Sessions
          <small>Active sessions · Password policy · Login history</small>
        </div>
        <div className="fi-lv-actions">
          <div style={{padding:'4px 14px',borderRadius:6,background:'#E8F5E9',color:'#2E7D32',fontSize:12,fontWeight:700}}>
            🟢 {loading ? '…' : activeSessions.length} Active Today
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginBottom:16,borderBottom:'2px solid var(--odoo-border)'}}>
        {[
          ['sessions','🟢 Active Sessions'],
          ['policy','🔐 Password Policy'],
          ['log','📋 Login History'],
        ].map(([k,l])=>(
          <div key={k} onClick={()=>setTab(k)}
            style={{padding:'8px 18px',cursor:'pointer',fontSize:12,fontWeight:700,
              borderBottom:tab===k?'2px solid var(--odoo-purple)':'2px solid transparent',
              color:tab===k?'var(--odoo-purple)':'var(--odoo-gray)',marginBottom:-2}}>{l}
          </div>
        ))}
      </div>

      {/* ── ACTIVE SESSIONS ── */}
      {tab === 'sessions' && (
        <div>
          {/* KPI strip */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
            {[
              {l:'Active Today',   v: loading?'…':activeSessions.length, c:'#2E7D32', i:'🟢'},
              {l:'Total Users',    v: loading?'…':users.filter(u=>u.isActive).length, c:'#714B67', i:'👥'},
              {l:'Inactive Users', v: loading?'…':users.filter(u=>!u.isActive).length, c:'#C62828', i:'🔴'},
            ].map(k=>(
              <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'14px 18px',
                border:'1px solid var(--odoo-border)',borderLeft:`4px solid ${k.c}`,
                display:'flex',alignItems:'center',gap:14}}>
                <span style={{fontSize:24}}>{k.i}</span>
                <div>
                  <div style={{fontSize:22,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
                  <div style={{fontSize:11,color:'var(--odoo-gray)'}}>{k.l}</div>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading sessions…</div>
          ) : activeSessions.length === 0 ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D',background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)'}}>
              No users logged in today
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {activeSessions.map(u => (
                <div key={u.id} style={{padding:'12px 16px',background:'#fff',borderRadius:8,
                  border:'1px solid var(--odoo-border)',borderLeft:'4px solid #2E7D32',
                  display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:38,height:38,borderRadius:'50%',
                    background: ROLE_CLR[u.role]||'#714B67',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    color:'#fff',fontSize:13,fontWeight:800,flexShrink:0}}>
                    {u.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13}}>{u.name}</div>
                    <div style={{fontSize:11,color:'var(--odoo-gray)'}}>
                      {u.email} &nbsp;·&nbsp;
                      <span style={{background:(ROLE_CLR[u.role]||'#714B67')+'22',
                        color:ROLE_CLR[u.role]||'#714B67',padding:'1px 6px',borderRadius:6,fontWeight:700}}>
                        {u.role}
                      </span>
                      {u.department && <> &nbsp;·&nbsp; {u.department}</>}
                    </div>
                  </div>
                  <div style={{textAlign:'right',marginRight:12}}>
                    <div style={{fontSize:11,color:'var(--odoo-gray)'}}>Last login</div>
                    <div style={{fontSize:11,fontWeight:600}}>{fmtDate(u.lastLogin)}</div>
                    <div style={{fontSize:10,color:'#2E7D32',fontWeight:700,marginTop:2}}>● Active Today</div>
                  </div>
                  <button onClick={()=>killSession(u)}
                    style={{padding:'5px 12px',borderRadius:6,border:'1px solid #C62828',
                      background:'#FFEBEE',color:'#C62828',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                    ⛔ End Session
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{marginTop:14,padding:'10px 14px',background:'#FFF3CD',borderRadius:6,fontSize:11,color:'#856404'}}>
            ⚠️ <strong>Note:</strong> LNV ERP uses JWT-based auth. "Active Today" shows users who logged in today based on <code>lastLogin</code> timestamp. "End Session" deactivates the user — re-enable from User Management.
          </div>
        </div>
      )}

      {/* ── PASSWORD POLICY ── */}
      {tab === 'policy' && (
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14}}>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
            <div style={{padding:'12px 16px',background:'var(--odoo-purple)',color:'#fff',fontWeight:700,fontSize:13}}>
              🔐 Password Policy
            </div>
            <div style={{padding:20}}>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {[
                  {k:'minLength',      l:'Minimum Password Length',             type:'number',min:6, max:32},
                  {k:'expireDays',     l:'Password Expires After (days, 0=never)',type:'number',min:0, max:365},
                  {k:'maxAttempts',    l:'Max Failed Login Attempts (lockout)',  type:'number',min:3, max:20},
                  {k:'sessionTimeout', l:'Session Timeout (minutes)',            type:'number',min:15,max:1440},
                ].map(f=>(
                  <div key={f.k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'10px 14px',background:'#F8F9FA',borderRadius:6}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:600}}>{f.l}</div>
                      <div style={{fontSize:10,color:'#6C757D'}}>
                        {f.k==='minLength'&&`Current: ${policy.minLength} chars`}
                        {f.k==='expireDays'&&(policy.expireDays===0?'Never expires':`Expires every ${policy.expireDays} days`)}
                        {f.k==='maxAttempts'&&`Account locked after ${policy.maxAttempts} attempts`}
                        {f.k==='sessionTimeout'&&`Auto logout after ${policy.sessionTimeout} min (${Math.round(policy.sessionTimeout/60)}h)`}
                      </div>
                    </div>
                    <input type="number" value={policy[f.k]} onChange={e=>setP(f.k,parseInt(e.target.value)||0)}
                      min={f.min} max={f.max}
                      style={{width:80,padding:'6px 8px',border:'1.5px solid var(--odoo-border)',
                        borderRadius:6,textAlign:'center',fontFamily:'DM Mono,monospace',
                        fontWeight:700,fontSize:14,outline:'none'}} />
                  </div>
                ))}

                <div style={{borderTop:'1px solid var(--odoo-border)',paddingTop:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#6C757D',textTransform:'uppercase',
                    letterSpacing:.5,marginBottom:10}}>Password Requirements</div>
                  {[
                    {k:'requireUpper',  l:'Require Uppercase Letter (A-Z)'},
                    {k:'requireNumber', l:'Require Number (0-9)'},
                    {k:'requireSpecial',l:'Require Special Character (!@#$%^&*)'},
                    {k:'mfa',           l:'Enable Multi-Factor Authentication (MFA)'},
                  ].map(f=>(
                    <div key={f.k} onClick={()=>setP(f.k,!policy[f.k])}
                      style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
                        borderRadius:6,cursor:'pointer',marginBottom:6,
                        background:policy[f.k]?'#EDE0EA':'#F8F9FA',
                        border:`1.5px solid ${policy[f.k]?'var(--odoo-purple)':'var(--odoo-border)'}`}}>
                      <div style={{width:38,height:22,borderRadius:11,position:'relative',flexShrink:0,
                        background:policy[f.k]?'var(--odoo-purple)':'#CCC',transition:'background .2s'}}>
                        <div style={{position:'absolute',top:3,borderRadius:'50%',width:16,height:16,
                          background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)',
                          left:policy[f.k]?19:3}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:policy[f.k]?700:400,
                        color:policy[f.k]?'var(--odoo-dark)':'#6C757D'}}>{f.l}</span>
                      {f.k==='mfa'&&<span style={{fontSize:10,background:'#FFF3CD',color:'#856404',
                        padding:'1px 6px',borderRadius:4,fontWeight:700}}>Coming Soon</span>}
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-p btn-s" style={{marginTop:16}} onClick={savePolicy} disabled={saving}>
                {saving?'Saving…':'💾 Save Policy'}
              </button>
            </div>
          </div>

          {/* Security Score */}
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
            <div style={{padding:'12px 16px',background:scoreClr,color:'#fff',fontWeight:700,fontSize:13}}>
              {scoreIcon} Security Score
            </div>
            <div style={{padding:20,textAlign:'center'}}>
              <div style={{width:90,height:90,borderRadius:'50%',border:`6px solid ${scoreClr}`,
                display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',
                fontSize:32}}>{scoreIcon}</div>
              <div style={{fontWeight:800,fontSize:20,color:scoreClr,marginBottom:4}}>{scoreLbl}</div>
              <div style={{fontSize:11,color:'#6C757D',marginBottom:20}}>Security Level</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,textAlign:'left'}}>
                {[
                  {l:'Min 8 chars',         ok:policy.minLength>=8},
                  {l:'Uppercase required',   ok:policy.requireUpper},
                  {l:'Number required',      ok:policy.requireNumber},
                  {l:'Special char',         ok:policy.requireSpecial},
                  {l:'MFA enabled',          ok:policy.mfa},
                  {l:'Session timeout ≤ 8h', ok:policy.sessionTimeout<=480},
                  {l:'Max 5 attempts',       ok:policy.maxAttempts<=5},
                ].map(x=>(
                  <div key={x.l} style={{display:'flex',alignItems:'center',gap:8,
                    padding:'6px 10px',borderRadius:6,
                    background:x.ok?'#E8F5E9':'#F8F9FA'}}>
                    <span style={{fontSize:14}}>{x.ok?'✅':'⬜'}</span>
                    <span style={{fontSize:11,fontWeight:x.ok?700:400,
                      color:x.ok?'#2E7D32':'#6C757D'}}>{x.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGIN HISTORY ── */}
      {tab === 'log' && (
        <div>
          {loading ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading…</div>
          ) : (
            <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'var(--odoo-purple)'}}>
                    {['User','Role','Department','Email','Last Login','Status'].map(h=>(
                      <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,
                        fontWeight:700,color:'#fff',textTransform:'uppercase',letterSpacing:.5}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.length === 0 ? (
                    <tr><td colSpan={6} style={{padding:30,textAlign:'center',color:'#6C757D'}}>No login history found</td></tr>
                  ) : loginHistory.map((u,i)=>(
                    <tr key={u.id} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                      <td style={{padding:'10px 14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:30,height:30,borderRadius:'50%',
                            background:ROLE_CLR[u.role]||'#714B67',flexShrink:0,
                            display:'flex',alignItems:'center',justifyContent:'center',
                            color:'#fff',fontSize:10,fontWeight:800}}>
                            {u.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
                          </div>
                          <span style={{fontSize:12,fontWeight:600}}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,fontWeight:700,
                          background:(ROLE_CLR[u.role]||'#714B67')+'22',color:ROLE_CLR[u.role]||'#714B67'}}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{padding:'10px 14px',fontSize:11,color:'#6C757D'}}>{u.department||'—'}</td>
                      <td style={{padding:'10px 14px',fontSize:11,fontFamily:'DM Mono,monospace'}}>{u.email}</td>
                      <td style={{padding:'10px 14px',fontSize:11}}>{fmtDate(u.lastLogin)}</td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{padding:'3px 10px',borderRadius:10,fontSize:10,fontWeight:700,
                          background:u.isActive?'#D4EDDA':'#F8D7DA',
                          color:u.isActive?'#155724':'#721C24'}}>
                          {u.isActive?'Active':'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{marginTop:10,fontSize:11,color:'#6C757D'}}>
            Showing last login time per user from the user master. Total {loginHistory.length} users have login records.
          </div>
        </div>
      )}
    </div>
  )
}
