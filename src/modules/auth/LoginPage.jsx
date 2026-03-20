import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

const DEMO_USERS = [
  { email:'admin@lnverp.com',      password:'admin123',  role:'admin',      name:'Admin User',   label:'Super Admin' },
  { email:'manager@lnverp.com',    password:'lnv@2025',  role:'manager',    name:'Ravi Kumar',   label:'Plant Manager' },
  { email:'accounts@lnverp.com',   password:'lnv@2025',  role:'accounts',   name:'Priya Nair',   label:'Accounts' },
  { email:'operations@lnverp.com', password:'lnv@2025',  role:'operations', name:'Suresh Babu',  label:'Operations' },
  { email:'hr@lnverp.com',         password:'lnv@2025',  role:'hr',         name:'Deepa Menon',  label:'HR Manager' },
  { email:'sales@lnverp.com',      password:'lnv@2025',  role:'sales',      name:'Arjun Sharma', label:'Sales Rep' },
]

const FEATURES = [
  { icon:'', title:'Multi-Industry',      desc:'Manufacturing · Trading · Textile · Service' },
  { icon:'', title:'Cloud SaaS',          desc:'Access anywhere on any device' },
  { icon:'', title:'Real-Time Analytics', desc:'Live dashboards & insights' },
  { icon:'', title:'Enterprise Security', desc:'Role-based multi-company access' },
]

const MOD_PILLS = ['SD · Sales','MM · Purchase','WM · Inventory','PP · Manufacturing','FI · Finance','QM · Quality','HCM · Payroll']
const INDUSTRIES = ['Select Industry','Manufacturing','Trading','Textile','Retail','Service','Construction']
const SIZES = ['Select Size','1–10','10–50','50–200','200+']

function BgShape({ size, style: extraStyle, delay }) {
  const [y, setY] = useState(0)
  useEffect(() => {
    let t = delay || 0
    const id = setInterval(() => { t += 0.05; setY(Math.sin(t) * 22) }, 50)
    return () => clearInterval(id)
  }, [delay])
  return (
    <div style={{ position:'absolute', borderRadius:'50%', opacity:0.06,
      width:size, height:size, background:'#fff',
      transform:`translateY(${y}px)`, transition:'transform .1s linear',
      pointerEvents:'none', ...extraStyle }} />
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [tab, setTab]         = useState('signin')
  const [email, setEmail]     = useState('admin@lnverp.com')
  const [pass, setPass]       = useState('admin123')
  const [remember, setRemember] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  // register
  const [rComp, setRComp]     = useState('')
  const [rInd,  setRInd]      = useState('Select Industry')
  const [rSize, setRSize]     = useState('Select Size')
  const [rEmail,setREmail]    = useState('')
  const [rPass, setRPass]     = useState('')

  const handleLogin = async () => {
    setError('')
    if (!email || !pass) { setError('Please enter your email and password.'); return }
    const user = DEMO_USERS.find(u => u.email === email && u.password === pass)
    if (!user) { setError('Invalid email or password. Click a demo credential below to fill in.'); return }
    setLoading(true)
    try {
      await login({ role: user.role, password: pass, name: user.name })
      navigate('/home')
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = (extra = {}) => ({
    width:'100%', padding:'10px 14px',
    border:'1.5px solid #DDD5D0', borderRadius:6,
    fontFamily:'DM Sans,sans-serif', fontSize:13,
    color:'#1C1C1C', outline:'none', boxSizing:'border-box',
    background:'#fff', transition:'border-color .2s, box-shadow .2s', ...extra,
  })
  const lbl = { display:'block', fontSize:12, fontWeight:600, color:'#1C1C1C', marginBottom:6, letterSpacing:.3 }

  return (
    <div style={{ minHeight:'100vh', display:'flex',
      background:'linear-gradient(135deg,#4A3050 0%,#714B67 40%,#875A7B 100%)',
      position:'relative', overflow:'hidden', fontFamily:'DM Sans,sans-serif' }}>

      {/* Radial glow */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse at 30% 50%,rgba(0,160,157,.15) 0%,transparent 60%), radial-gradient(ellipse at 80% 20%,rgba(224,111,57,.1) 0%,transparent 50%)' }} />

      {/* Floating shapes */}
      <BgShape size={400} delay={0}   style={{ top:'-100px', left:'-100px' }} />
      <BgShape size={300} delay={1.5} style={{ bottom:'-80px', right:'460px' }} />
      <BgShape size={200} delay={3}   style={{ top:'50%', right:'440px' }} />

      {/* ══ LEFT PANEL ══ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
        alignItems:'center', padding:'60px', position:'relative', zIndex:1 }}>

        {/* Brand */}
        <div style={{ textAlign:'center' }}>
          <div style={{ width:88, height:88, borderRadius:22, margin:'0 auto 22px',
            background:'linear-gradient(135deg,#E06F39,#F5C518)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Syne,sans-serif', fontSize:34, fontWeight:800, color:'#fff',
            boxShadow:'0 16px 48px rgba(224,111,57,.5)' }}>LNV</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:44, fontWeight:800,
            color:'#fff', letterSpacing:'-1.5px', lineHeight:1.1, margin:0 }}>
            LNV <span style={{ color:'#F5C518' }}>ERP</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,.55)', fontSize:13, marginTop:8,
            letterSpacing:3, textTransform:'uppercase' }}>by LNV Infotech Soft Solutions</p>
        </div>

        {/* Feature grid */}
        <div style={{ marginTop:44, display:'grid', gridTemplateColumns:'1fr 1fr',
          gap:12, maxWidth:440, width:'100%' }}>
          {FEATURES.map(f => (
            <div key={f.title}
              style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)',
                borderRadius:12, padding:16, backdropFilter:'blur(8px)', cursor:'default', transition:'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.14)'; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.transform='' }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{f.icon}</div>
              <strong style={{ display:'block', color:'#fff', fontSize:13, marginBottom:3 }}>{f.title}</strong>
              <span style={{ color:'rgba(255,255,255,.5)', fontSize:11 }}>{f.desc}</span>
            </div>
          ))}
        </div>

        {/* Module pills */}
        <div style={{ marginTop:32, display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', maxWidth:480 }}>
          {MOD_PILLS.map(p => (
            <span key={p} style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)',
              borderRadius:20, padding:'5px 14px', color:'rgba(255,255,255,.7)',
              fontSize:11, fontWeight:600, letterSpacing:.5 }}>{p}</span>
          ))}
        </div>

        <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)',
          fontSize:11, color:'rgba(255,255,255,.4)', whiteSpace:'nowrap' }}>
          © 2026 LNV Infotech Soft Solutions Pvt. Ltd. · All rights reserved
        </div>
      </div>

      {/* ══ RIGHT FORM PANEL ══ */}
      <div style={{ width:460, background:'#fff', display:'flex', flexDirection:'column',
        justifyContent:'center', padding:'52px 44px', position:'relative', zIndex:1,
        boxShadow:'-16px 0 48px rgba(0,0,0,.25)', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ width:38, height:38, borderRadius:9,
              background:'linear-gradient(135deg,#E06F39,#F5C518)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:800, color:'#fff' }}>LNV</div>
            <span style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:'#1C1C1C' }}>LNV ERP</span>
          </div>
          {tab === 'signin' ? <>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, color:'#1C1C1C', margin:'0 0 5px' }}>Welcome Back </h2>
            <p style={{ color:'#6C757D', fontSize:13, margin:0 }}>Sign in to your LNV ERP account to continue</p>
          </> : <>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, color:'#1C1C1C', margin:'0 0 5px' }}>Register Company </h2>
            <p style={{ color:'#6C757D', fontSize:13, margin:0 }}>Start your 30-day free trial — no credit card required</p>
          </>}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'2px solid #DDD5D0', marginBottom:24 }}>
          {[['signin','Sign In'],['register','Register Company']].map(([k,l]) => (
            <div key={k} onClick={() => { setTab(k); setError('') }}
              style={{ flex:1, padding:10, textAlign:'center', fontSize:13, fontWeight:600,
                cursor:'pointer', transition:'all .2s',
                color: tab===k ? '#714B67' : '#6C757D',
                borderBottom: tab===k ? '2px solid #714B67' : '2px solid transparent',
                marginBottom:-2 }}>
              {l}
            </div>
          ))}
        </div>

        {/* ── SIGN IN ── */}
        {tab === 'signin' && (
          <div>
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Company Email / User ID</label>
              <input style={inp()} type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handleLogin()}
                placeholder="admin@yourcompany.com"
                onFocus={e => { e.target.style.borderColor='#714B67'; e.target.style.boxShadow='0 0 0 3px rgba(113,75,103,.12)' }}
                onBlur={e  => { e.target.style.borderColor='#DDD5D0'; e.target.style.boxShadow='none' }} />
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Password</label>
              <div style={{ position:'relative' }}>
                <input style={inp({ paddingRight:44 })}
                  type={showPass ? 'text' : 'password'} value={pass}
                  onChange={e => setPass(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && handleLogin()}
                  placeholder="••••••••"
                  onFocus={e => { e.target.style.borderColor='#714B67'; e.target.style.boxShadow='0 0 0 3px rgba(113,75,103,.12)' }}
                  onBlur={e  => { e.target.style.borderColor='#DDD5D0'; e.target.style.boxShadow='none' }} />
                <span onClick={() => setShowPass(s => !s)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    cursor:'pointer', fontSize:15, color:'#6C757D', userSelect:'none' }}>
                  {showPass ? '' : ''}
                </span>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6C757D', cursor:'pointer' }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  style={{ accentColor:'#714B67' }} />
                Remember me
              </label>
              <a href="#" style={{ fontSize:12, color:'#714B67', fontWeight:600, textDecoration:'none' }}>Forgot password?</a>
            </div>

            {error && (
              <div style={{ background:'#FDEDEC', border:'1px solid #F5B7B1', borderRadius:6,
                padding:'10px 14px', fontSize:12, color:'#C0392B', marginBottom:16 }}>
                 {error}
              </div>
            )}

            <button onClick={handleLogin} disabled={loading}
              style={{ width:'100%', padding:12, background: loading ? '#9E7D96' : '#714B67',
                color:'#fff', border:'none', borderRadius:6, fontFamily:'DM Sans,sans-serif',
                fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
                transition:'all .2s', letterSpacing:.3 }}
              onMouseEnter={e => { if(!loading){ e.currentTarget.style.background='#875A7B'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(113,75,103,.4)' }}}
              onMouseLeave={e => { e.currentTarget.style.background=loading?'#9E7D96':'#714B67'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='none' }}>
              {loading ? '⏳ Signing in…' : ' Sign In to LNV ERP'}
            </button>

            {/* Demo creds */}
            <div style={{ marginTop:16, background:'#FDF8FC', border:'1px solid #E8D5E5', borderRadius:6, padding:'12px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#714B67', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>
                 Demo Credentials — click to fill
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                {DEMO_USERS.map(u => (
                  <div key={u.email} onClick={() => { setEmail(u.email); setPass(u.password); setError('') }}
                    style={{ padding:'5px 8px', borderRadius:4, cursor:'pointer', fontSize:11,
                      border:'1px solid #E8D5E5', background:'#fff', transition:'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='#EDE0EA'; e.currentTarget.style.borderColor='#C8A8C0' }}
                    onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#E8D5E5' }}>
                    <div style={{ fontWeight:700, color:'#714B67', fontSize:11 }}>{u.label}</div>
                    <div style={{ color:'#6C757D', fontSize:10 }}>{u.email}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:8, fontSize:11, color:'#6C757D' }}>
                Password: <strong style={{ color:'#714B67' }}>admin123</strong> (admin) · <strong style={{ color:'#714B67' }}>lnv@2025</strong> (others)
              </div>
            </div>
          </div>
        )}

        {/* ── REGISTER ── */}
        {tab === 'register' && (
          <div>
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Company Name</label>
              <input style={inp()} value={rComp} onChange={e => setRComp(e.target.value)}
                placeholder="e.g. Gayathri Marketing Pvt Ltd"
                onFocus={e => { e.target.style.borderColor='#714B67'; e.target.style.boxShadow='0 0 0 3px rgba(113,75,103,.12)' }}
                onBlur={e  => { e.target.style.borderColor='#DDD5D0'; e.target.style.boxShadow='none' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              <div>
                <label style={lbl}>Industry</label>
                <select style={inp({ cursor:'pointer' })} value={rInd} onChange={e => setRInd(e.target.value)}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Company Size</label>
                <select style={inp({ cursor:'pointer' })} value={rSize} onChange={e => setRSize(e.target.value)}>
                  {SIZES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Admin Email</label>
              <input style={inp()} type="email" value={rEmail} onChange={e => setREmail(e.target.value)}
                placeholder="admin@yourcompany.com"
                onFocus={e => { e.target.style.borderColor='#714B67'; e.target.style.boxShadow='0 0 0 3px rgba(113,75,103,.12)' }}
                onBlur={e  => { e.target.style.borderColor='#DDD5D0'; e.target.style.boxShadow='none' }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={lbl}>Password</label>
              <input style={inp()} type="password" value={rPass} onChange={e => setRPass(e.target.value)}
                placeholder="Min 8 characters"
                onFocus={e => { e.target.style.borderColor='#714B67'; e.target.style.boxShadow='0 0 0 3px rgba(113,75,103,.12)' }}
                onBlur={e  => { e.target.style.borderColor='#DDD5D0'; e.target.style.boxShadow='none' }} />
            </div>
            <button
              onClick={() => { setTab('signin'); setError(''); alert('Registration noted! Use demo credentials to explore.') }}
              style={{ width:'100%', padding:12, background:'#714B67', color:'#fff', border:'none',
                borderRadius:6, fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:700,
                cursor:'pointer', transition:'all .2s', letterSpacing:.3 }}
              onMouseEnter={e => { e.currentTarget.style.background='#875A7B'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(113,75,103,.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background='#714B67'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='none' }}>
               Register &amp; Start 30-Day Trial
            </button>
            <p style={{ fontSize:11, color:'#6C757D', textAlign:'center', marginTop:10 }}>
              No credit card required · Free trial · Cancel anytime
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
