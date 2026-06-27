import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

const DEMO_USERS = [
  { email:'admin@lnverp.com',      password:'admin123', label:'Super Admin'   },
  { email:'manager@lnverp.com',    password:'lnv@2025', label:'Plant Manager' },
  { email:'accounts@lnverp.com',   password:'lnv@2025', label:'Accounts'      },
  { email:'operations@lnverp.com', password:'lnv@2025', label:'Operations'    },
  { email:'hr@lnverp.com',         password:'lnv@2025', label:'HR Manager'    },
]

const ANNOUNCEMENTS = [
  { id:1, type:'new',    icon:'🚀', text:'Education Suite launched! GPS Bus Tracking, Report Cards & Fee Collection now live.' },
  { id:2, type:'update', icon:'✨', text:'Civil Cost Estimator upgraded — Labour breakdown & Calculation steps in Word export.' },
  { id:3, type:'event',  icon:'📅', text:'Free demo available — Book your slot for a personalised walkthrough of LNV ERP.' },
  { id:4, type:'update', icon:'🏗️', text:'Construction Suite now supports Raft, Pile & Isolated foundation types with auto cost.' },
]

const MODULES = [
  { icon:'🏭', label:'Production' }, { icon:'✅', label:'Quality'    },
  { icon:'📦', label:'Warehouse'  }, { icon:'💰', label:'Finance'    },
  { icon:'🛒', label:'Sales'      }, { icon:'👥', label:'HR & Payroll'},
  { icon:'🏗️', label:'Civil'      }, { icon:'🎓', label:'Education'  },
  { icon:'📊', label:'Analytics'  }, { icon:'🤝', label:'CRM'        },
]

const BADGES = [
  { icon:'🏭', label:'Production',  top:'14%',  left:'7%',   delay:0,   dur:5   },
  { icon:'💰', label:'Finance',     top:'22%',  right:'7%',  delay:1.2, dur:6   },
  { icon:'✅', label:'Quality',     top:'42%',  left:'6%',   delay:2.4, dur:4.5 },
  { icon:'📦', label:'Warehouse',   top:'42%',  right:'6%',  delay:1.8, dur:5.5 },
  { icon:'📊', label:'Analytics',   bottom:'30%',left:'7%',  delay:3.2, dur:7   },
  { icon:'🔐', label:'Secure',      bottom:'30%',right:'7%', delay:0.8, dur:4   },
  { icon:'🎓', label:'Education',   bottom:'16%',left:'20%', delay:2.0, dur:6   },
  { icon:'🏗️', label:'Civil',       bottom:'16%',right:'20%',delay:3.6, dur:5   },
]

export default function LoginPage() {
  const { login, demoLogin } = useAuth()
  const nav = useNavigate()

  const [tab,       setTab]       = useState('signin')
  const [email,     setEmail]     = useState('admin@lnverp.com')
  const [pass,      setPass]      = useState('admin123')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [focused,   setFocused]   = useState('')
  const [mounted,   setMounted]   = useState(false)
  const [annIdx,    setAnnIdx]    = useState(0)
  const [annShow,   setAnnShow]   = useState(true)
  const [dismissed,   setDismissed]   = useState([])
  const [activeSuite, setActiveSuite] = useState(0)

  const SUITES = [
    { name:'Manufacturing', color:'#C8A882', modules:['Production','Quality','Warehouse','Purchase','Sales','Finance','HR & Payroll','CRM'] },
    { name:'Construction',  color:'#8EC5A0', modules:['Projects','BOQ & Estimation','Site Progress','Labour Register','Contractor Bills','RA Billing','Material Stock','Cost Estimator'] },
    { name:'Education',     color:'#A8B8D8', modules:['Student Master','Attendance','Exam & Marks','Report Cards','Fee Collection','Staff Leave','Bus Tracking','Notice Board'] },
  ]

  // Register
  const [rComp,  setRComp]  = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPass,  setRPass]  = useState('')
  const [rInd,   setRInd]   = useState('')

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)
    const t = setInterval(() => setActiveSuite(p => (p+1)%3), 4000)
    return () => clearInterval(t)
  }, [])

  // Auto-rotate announcements
  const active = ANNOUNCEMENTS.filter(a => !dismissed.includes(a.id))
  useEffect(() => {
    if (active.length < 2) return
    const t = setInterval(() => {
      setAnnShow(false)
      setTimeout(() => { setAnnIdx(i => (i + 1) % active.length); setAnnShow(true) }, 350)
    }, 5000)
    return () => clearInterval(t)
  }, [active.length])

  const handleLogin = async () => {
    setError('')
    if (!email || !pass) { setError('Please enter your email and password.'); return }
    setLoading(true)
    try {
      await login(email, pass); nav('/home')
    } catch (err) {
      const demo = DEMO_USERS.find(u => u.email === email && u.password === pass)
      if (demo) { demoLogin('admin'); nav('/home') }
      else setError(err.message || 'Invalid credentials. Please try again.')
    } finally { setLoading(false) }
  }

  const currentAnn = active[annIdx % Math.max(active.length, 1)]
  const annColor = currentAnn?.type === 'new' ? '#1E8449' : currentAnn?.type === 'update' ? '#1A5276' : '#6E2C00'

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'DM Sans',sans-serif", overflow:'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400;1,700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }

        @keyframes floatUp   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes floatDown { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)}  }
        @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes slideInL  { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInR  { from{opacity:0;transform:translateX(32px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)}   to{opacity:1;transform:translateY(0)} }
        @keyframes annIn     { from{opacity:0;transform:translateY(-6px)}   to{opacity:1;transform:translateY(0)} }
        @keyframes annOut    { from{opacity:1;transform:translateY(0)}       to{opacity:0;transform:translateY(6px)} }
        @keyframes tickerScroll {
          0%   { transform:translateX(0); }
          100% { transform:translateX(-50%); }
        }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }

        input::placeholder { color:rgba(255,255,255,.4) !important; }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px rgba(50,25,50,.9) inset !important; -webkit-text-fill-color:white !important; }
        .demo-btn:hover { background:rgba(255,255,255,.18) !important; border-color:rgba(255,255,255,.5) !important; }
        .module-pill:hover { background:rgba(255,255,255,.22) !important; color:white !important; }
        .right-input:focus { border-color:#714B67 !important; box-shadow:0 0 0 3px rgba(113,75,103,.12) !important; }

        @media(max-width:900px) { .login-left{ display:none!important; } .login-right{ width:100%!important; } }
      `}</style>

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div className="login-left" style={{
        flex:1, position:'relative', overflow:'hidden',
        background:'linear-gradient(160deg,#0F0818 0%,#1E1028 30%,#2D1B3E 60%,#4A2F54 85%,#5A3060 100%)',
        display:'flex', flexDirection:'column',
        opacity: mounted?1:0,
        animation: mounted ? 'slideInL .7s ease forwards' : 'none',
      }}>
      {/* Ambient glow */}
      <div style={{position:'absolute',top:'15%',left:'50%',transform:'translateX(-50%)',
        width:'70%',height:'50%',
        background:'radial-gradient(ellipse,rgba(113,75,103,0.4) 0%,rgba(110,44,0,0.2) 50%,transparent 75%)',
        pointerEvents:'none',zIndex:0}}/>

        {/* ── TOP ANNOUNCEMENT TICKER ── */}
        {active.length > 0 && currentAnn && (
          <div style={{
            position:'relative', zIndex:10, flexShrink:0,
            borderBottom:'1px solid rgba(255,255,255,.1)',
          }}>
            {/* Type badge row */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'6px 20px',
              background: `${annColor}99`,
              backdropFilter:'blur(8px)',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'white',animation:'pulseDot 1.5s infinite'}}/>
                <span style={{fontSize:9,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'rgba(255,255,255,.9)'}}>
                  {currentAnn.type==='new'?'New Release':currentAnn.type==='update'?'Update':'Announcement'}
                </span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {active.map((_,i)=>(
                  <div key={i}
                    onClick={()=>{setAnnIdx(i);setAnnShow(true)}}
                    style={{
                      width: i===annIdx%active.length?20:7,
                      height:7, borderRadius:4,
                      cursor:'pointer', transition:'all .35s cubic-bezier(.34,1.56,.64,1)',
                      background: i===annIdx%active.length?'white':'rgba(255,255,255,.3)',
                      boxShadow: i===annIdx%active.length?'0 0 6px rgba(255,255,255,.5)':'none',
                    }}/>
                ))}
                <button onClick={()=>setDismissed(d=>[...d,currentAnn.id])}
                  style={{
                    background:'rgba(255,255,255,.15)',border:'none',color:'white',
                    width:18,height:18,borderRadius:'50%',cursor:'pointer',
                    fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',
                    marginLeft:4,transition:'background .2s',
                  }}
                  onMouseEnter={e=>e.target.style.background='rgba(255,255,255,.3)'}
                  onMouseLeave={e=>e.target.style.background='rgba(255,255,255,.15)'}>✕</button>
              </div>
            </div>
            {/* Message */}
            <div style={{
              padding:'10px 20px',
              background:'rgba(0,0,0,.3)', backdropFilter:'blur(12px)',
              display:'flex', gap:10, alignItems:'center',
              opacity: annShow?1:0,
              animation: annShow?'annIn .35s ease forwards':'annOut .35s ease forwards',
            }}>
              <span style={{fontSize:18,flexShrink:0}}>{currentAnn.icon}</span>
              <span style={{fontSize:11.5,color:'rgba(255,255,255,.85)',lineHeight:1.6,fontWeight:500}}>
                {currentAnn.text}
              </span>
            </div>
          </div>
        )}

        {/* ── FLOATING BADGES ── */}
        {BADGES.map((b,i) => (
          <div key={b.label} style={{
            position:'absolute', zIndex:2,
            top:b.top, bottom:b.bottom, left:b.left, right:b.right,
            background:'rgba(255,255,255,.1)',
            backdropFilter:'blur(14px)',
            border:'1px solid rgba(255,255,255,.18)',
            borderRadius:12, padding:'8px 14px',
            display:'flex', alignItems:'center', gap:8,
            color:'white', fontSize:12, fontWeight:600,
            boxShadow:'0 4px 16px rgba(0,0,0,.2)',
            animation:`${i%2===0?'floatUp':'floatDown'} ${b.dur}s ease-in-out ${b.delay}s infinite`,
            whiteSpace:'nowrap', zIndex:4,
          }}>
            <span style={{fontSize:17}}>{b.icon}</span>
            <span style={{opacity:.9}}>{b.label}</span>
          </div>
        ))}

        {/* Decorative rings */}
        {[500,360,220].map(sz=>(
          <div key={sz} style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            width:sz, height:sz, borderRadius:'50%',
            border:'1px solid rgba(255,255,255,.05)',
            pointerEvents:'none', zIndex:0,
          }}/>
        ))}

        {/* ── CENTRE CONTENT ── */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'32px 40px 32px',
          position:'relative', zIndex:3, textAlign:'center',
        }}>

          {/* Logo mark */}
          <div style={{
            width:80, height:80, borderRadius:20, marginBottom:16,
            background:'rgba(255,255,255,.1)',
            backdropFilter:'blur(16px)',
            border:'1.5px solid rgba(255,255,255,.18)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 32px rgba(0,0,0,.3)',
          }}>
            <span style={{fontSize:24,fontWeight:900,color:'white',letterSpacing:-1,fontFamily:'DM Sans,sans-serif'}}>LNV</span>
          </div>

          <div style={{fontSize:9,fontWeight:700,letterSpacing:3,color:'rgba(255,255,255,.35)',textTransform:'uppercase',marginBottom:12}}>
            LNV Infotech Soft Solutions · Coimbatore
          </div>

          <h1 style={{
            fontFamily:"'Playfair Display',serif",
            fontSize:'clamp(30px,3.2vw,48px)',
            fontWeight:700, color:'white', lineHeight:1.1,
            marginBottom:10, letterSpacing:-1,
          }}>
            Enterprise ERP<br/>
            <em style={{fontStyle:'italic',color:'rgba(255,255,255,.6)'}}>Built for India</em>
          </h1>

          <p style={{fontSize:13,color:'rgba(255,255,255,.4)',lineHeight:1.6,maxWidth:340,marginBottom:24}}>
            Manufacturing · Construction · Education — one platform for Indian SMEs
          </p>

          {/* Suite switcher — the smart minimal element */}
          <div style={{
            width:'100%', maxWidth:380,
            background:'rgba(255,255,255,.05)',
            border:'1px solid rgba(255,255,255,.08)',
            borderRadius:14, padding:18, marginBottom:20,
          }}>
            {/* Suite tabs */}
            <div style={{display:'flex',gap:4,marginBottom:14,justifyContent:'center'}}>
              {SUITES.map((s,i)=>(
                <button key={s.name} onClick={()=>setActiveSuite(i)}
                  style={{
                    padding:'4px 12px',borderRadius:16,border:'none',cursor:'pointer',
                    fontSize:10,fontWeight:700,fontFamily:'DM Sans,sans-serif',
                    background:activeSuite===i?s.color:'rgba(255,255,255,.08)',
                    color:activeSuite===i?'#1A1A1A':'rgba(255,255,255,.4)',
                    transition:'all 0.3s',
                  }}>{s.name}</button>
              ))}
            </div>
            {/* Module grid for active suite */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
              {SUITES[activeSuite].modules.map((m,i)=>(
                <div key={m} style={{
                  display:'flex',alignItems:'center',gap:6,
                  padding:'5px 8px',borderRadius:5,
                  background:'rgba(255,255,255,.04)',
                  border:'1px solid rgba(255,255,255,.05)',
                  opacity:mounted?1:0,
                  transition:`opacity 0.3s ${i*0.04}s`,
                }}>
                  <div style={{width:4,height:4,borderRadius:'50%',
                    background:SUITES[activeSuite].color,flexShrink:0}}/>
                  <span style={{fontSize:10,color:'rgba(255,255,255,.5)',fontWeight:500}}>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats — minimal */}
          <div style={{display:'flex',gap:24,justifyContent:'center'}}>
            {[['3','Suites'],['22+','Industries'],['100+','Modules']].map(([n,l])=>(
              <div key={l} style={{textAlign:'center'}}>
                <div style={{
                  fontFamily:"'Playfair Display',serif",
                  fontSize:26,fontWeight:700,color:'white',lineHeight:1,
                }}>{n}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,.3)',marginTop:3,letterSpacing:1,textTransform:'uppercase'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div style={{
          textAlign:'center', padding:'16px',
          fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:.8,
          borderTop:'1px solid rgba(255,255,255,.06)',
          flexShrink:0,
        }}>
          Made with ❤️ in Coimbatore, Tamil Nadu
        </div>
      </div>

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <div className="login-right" style={{
        width:460, flexShrink:0,
        background:'#F8F5F8',
        display:'flex', flexDirection:'column',
        overflowY:'auto',
        opacity: mounted?1:0,
        animation: mounted?'slideInR .7s ease forwards':'none',
      }}>

        {/* Top bar */}
        <div style={{
          padding:'18px 32px',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background:'white', borderBottom:'1px solid #F0EBF0',
          flexShrink:0,
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{
              width:34,height:34,borderRadius:9,
              background:'linear-gradient(135deg,#714B67,#4A2F44)',
              display:'flex',alignItems:'center',justifyContent:'center',
              color:'white',fontWeight:900,fontSize:11,letterSpacing:-0.5,
            }}>LNV</div>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:'#4A2F44',lineHeight:1}}>LNV ERP</div>
              <div style={{fontSize:9,color:'#aaa',fontWeight:500}}>Enterprise Suite</div>
            </div>
          </div>
          <a href="/" style={{
            fontSize:11,color:'#888',textDecoration:'none',fontWeight:600,
            display:'flex',alignItems:'center',gap:4,
            transition:'color .2s',
          }}
            onMouseEnter={e=>e.target.style.color='#714B67'}
            onMouseLeave={e=>e.target.style.color='#888'}>
            ← Back to website
          </a>
        </div>

        {/* Form area */}
        <div style={{
          flex:1, display:'flex', alignItems:'center', justifyContent:'center',
          padding:'32px',
        }}>
          <div style={{width:'100%',maxWidth:360,animation:mounted?'fadeUp .8s ease forwards':'none'}}>

            {/* Tabs */}
            <div style={{
              display:'flex',background:'#EDE8ED',borderRadius:12,
              padding:4,marginBottom:28,
            }}>
              {[['signin','Sign In'],['register','Get Started']].map(([t,label])=>(
                <button key={t} onClick={()=>{setTab(t);setError('')}} style={{
                  flex:1,padding:'10px',border:'none',borderRadius:9,
                  fontSize:13,fontWeight:700,cursor:'pointer',
                  fontFamily:'DM Sans,sans-serif',
                  background: tab===t?'#714B67':'transparent',
                  color: tab===t?'white':'#999',
                  transition:'all .25s',
                  boxShadow: tab===t?'0 2px 8px rgba(113,75,103,.3)':'none',
                }}>{label}</button>
              ))}
            </div>

            {tab === 'signin' ? (
              <div>
                <h2 style={{
                  fontFamily:"'Playfair Display',serif",
                  fontSize:26,fontWeight:700,color:'#1A1A1A',
                  marginBottom:4,letterSpacing:-0.5,
                }}>Welcome back</h2>
                <p style={{fontSize:13,color:'#999',marginBottom:22,lineHeight:1.5}}>
                  Sign in to your LNV ERP workspace
                </p>

                {/* Quick access */}
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#bbb',marginBottom:8}}>
                    Quick Access
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {DEMO_USERS.map(u=>(
                      <button key={u.email} className="demo-btn"
                        onClick={()=>{setEmail(u.email);setPass(u.password)}}
                        style={{
                          padding:'5px 12px',border:'1px solid #E0D8E0',
                          borderRadius:20,background:'white',fontSize:11,
                          fontWeight:700,cursor:'pointer',color:'#714B67',
                          fontFamily:'DM Sans,sans-serif',transition:'all .2s',
                        }}>
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{height:1,background:'#F0EBF0',marginBottom:20}}/>

                {/* Email */}
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#555',marginBottom:6,letterSpacing:.5,textTransform:'uppercase'}}>
                    Email Address
                  </label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:15,opacity:.35,pointerEvents:'none'}}>✉️</span>
                    <input type="email" value={email}
                      onChange={e=>setEmail(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                      onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')}
                      placeholder="your@email.com"
                      style={{
                        width:'100%',padding:'12px 14px 12px 40px',
                        border:`1.5px solid ${focused==='email'?'#714B67':'#E0D8E0'}`,
                        borderRadius:10,fontSize:13,outline:'none',
                        fontFamily:'DM Sans,sans-serif',color:'#1A1A1A',
                        background:'white',transition:'all .2s',
                        boxShadow:focused==='email'?'0 0 0 3px rgba(113,75,103,.1)':'none',
                      }}/>
                  </div>
                </div>

                {/* Password */}
                <div style={{marginBottom:8}}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#555',marginBottom:6,letterSpacing:.5,textTransform:'uppercase'}}>
                    Password
                  </label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:15,opacity:.35,pointerEvents:'none'}}>🔒</span>
                    <input type={showPass?'text':'password'} value={pass}
                      onChange={e=>setPass(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                      onFocus={()=>setFocused('pass')} onBlur={()=>setFocused('')}
                      placeholder="Enter password"
                      style={{
                        width:'100%',padding:'12px 42px 12px 40px',
                        border:`1.5px solid ${focused==='pass'?'#714B67':'#E0D8E0'}`,
                        borderRadius:10,fontSize:13,outline:'none',
                        fontFamily:'DM Sans,sans-serif',color:'#1A1A1A',
                        background:'white',transition:'all .2s',
                        boxShadow:focused==='pass'?'0 0 0 3px rgba(113,75,103,.1)':'none',
                      }}/>
                    <button onClick={()=>setShowPass(p=>!p)} style={{
                      position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                      background:'none',border:'none',cursor:'pointer',
                      fontSize:15,opacity:.4,transition:'opacity .2s',padding:2,
                    }}
                      onMouseEnter={e=>e.target.style.opacity='.8'}
                      onMouseLeave={e=>e.target.style.opacity='.4'}>
                      {showPass?'🙈':'👁️'}
                    </button>
                  </div>
                </div>

                <div style={{textAlign:'right',marginBottom:22}}>
                  <a href="#" style={{fontSize:12,color:'#714B67',textDecoration:'none',fontWeight:600}}>
                    Forgot password?
                  </a>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    background:'#FDEDEC',border:'1px solid #F1948A',
                    borderRadius:8,padding:'10px 14px',marginBottom:14,
                    fontSize:12,color:'#C0392B',display:'flex',gap:8,alignItems:'center',
                  }}>
                    <span>⚠️</span>{error}
                  </div>
                )}

                {/* Login button */}
                <button onClick={handleLogin} disabled={loading} style={{
                  width:'100%',padding:'14px',
                  background: loading?'#9B7D96':'linear-gradient(135deg,#714B67 0%,#4A2F44 100%)',
                  color:'white',border:'none',borderRadius:10,
                  fontSize:15,fontWeight:800,cursor:loading?'not-allowed':'pointer',
                  fontFamily:'DM Sans,sans-serif',transition:'all .25s',
                  boxShadow:loading?'none':'0 4px 20px rgba(113,75,103,.38)',
                  letterSpacing:.3,marginBottom:16,
                }}
                  onMouseEnter={e=>!loading&&Object.assign(e.target.style,{transform:'translateY(-2px)',boxShadow:'0 8px 28px rgba(113,75,103,.48)'})}
                  onMouseLeave={e=>!loading&&Object.assign(e.target.style,{transform:'',boxShadow:'0 4px 20px rgba(113,75,103,.38)'})}>
                  {loading?(
                    <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      <span style={{
                        width:15,height:15,border:'2px solid rgba(255,255,255,.35)',
                        borderTopColor:'white',borderRadius:'50%',
                        display:'inline-block',animation:'spin .7s linear infinite',
                      }}/>
                      Signing in...
                    </span>
                  ):'Sign In to LNV ERP →'}
                </button>

                {/* Security note */}
                <div style={{
                  padding:'11px 14px',background:'white',
                  borderRadius:8,border:'1px solid #F0EBF0',
                  display:'flex',gap:10,alignItems:'center',
                }}>
                  <span style={{fontSize:18,flexShrink:0}}>🔐</span>
                  <div style={{fontSize:11,color:'#999',lineHeight:1.5}}>
                    <strong style={{color:'#666'}}>Secure & Encrypted</strong> — AES-256 encryption · Neon cloud Singapore · Role-based access
                  </div>
                </div>
              </div>

            ) : (
              /* ── GET STARTED TAB ── */
              <div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:'#1A1A1A',marginBottom:4,letterSpacing:-0.5}}>
                  Start your trial
                </h2>
                <p style={{fontSize:13,color:'#999',marginBottom:22}}>
                  Full access to LNV ERP — no credit card required
                </p>

                {[
                  ['Company Name','text',rComp,setRComp,'🏢','e.g. Kumaran Industries Pvt. Ltd.'],
                  ['Work Email','email',rEmail,setREmail,'✉️','you@company.com'],
                  ['Password','password',rPass,setRPass,'🔒','Min 8 characters'],
                ].map(([label,type,val,setter,icon,ph])=>(
                  <div key={label} style={{marginBottom:14}}>
                    <label style={{display:'block',fontSize:11,fontWeight:700,color:'#555',marginBottom:6,letterSpacing:.5,textTransform:'uppercase'}}>{label}</label>
                    <div style={{position:'relative'}}>
                      <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:15,opacity:.35,pointerEvents:'none'}}>{icon}</span>
                      <input type={type} value={val} onChange={e=>setter(e.target.value)}
                        onFocus={()=>setFocused(label)} onBlur={()=>setFocused('')}
                        placeholder={ph}
                        style={{
                          width:'100%',padding:'12px 14px 12px 40px',
                          border:`1.5px solid ${focused===label?'#714B67':'#E0D8E0'}`,
                          borderRadius:10,fontSize:13,outline:'none',
                          fontFamily:'DM Sans,sans-serif',color:'#1A1A1A',
                          background:'white',transition:'all .2s',
                          boxShadow:focused===label?'0 0 0 3px rgba(113,75,103,.1)':'none',
                        }}/>
                    </div>
                  </div>
                ))}

                <div style={{marginBottom:20}}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#555',marginBottom:6,letterSpacing:.5,textTransform:'uppercase'}}>Industry</label>
                  <select value={rInd} onChange={e=>setRInd(e.target.value)}
                    onFocus={()=>setFocused('ind')} onBlur={()=>setFocused('')}
                    style={{
                      width:'100%',padding:'12px 14px',
                      border:`1.5px solid ${focused==='ind'?'#714B67':'#E0D8E0'}`,
                      borderRadius:10,fontSize:13,outline:'none',
                      fontFamily:'DM Sans,sans-serif',color:rInd?'#1A1A1A':'#999',
                      background:'white',cursor:'pointer',transition:'all .2s',
                    }}>
                    <option value=''>Select your industry</option>
                    {['Injection Moulding','Metal Fabrication','Surface Treatment','Construction','School / College','Trading','Textile','Food Processing','Auto Ancillary','Pharma','Electronics','Job Work','Other'].map(i=>(
                      <option key={i}>{i}</option>
                    ))}
                  </select>
                </div>

                <button style={{
                  width:'100%',padding:'14px',marginBottom:14,
                  background:'linear-gradient(135deg,#714B67 0%,#4A2F44 100%)',
                  color:'white',border:'none',borderRadius:10,
                  fontSize:15,fontWeight:800,cursor:'pointer',
                  fontFamily:'DM Sans,sans-serif',
                  boxShadow:'0 4px 20px rgba(113,75,103,.38)',
                  letterSpacing:.3,transition:'all .25s',
                }}
                  onMouseEnter={e=>Object.assign(e.target.style,{transform:'translateY(-2px)',boxShadow:'0 8px 28px rgba(113,75,103,.48)'})}
                  onMouseLeave={e=>Object.assign(e.target.style,{transform:'',boxShadow:'0 4px 20px rgba(113,75,103,.38)'})}>
                  Start Free Trial →
                </button>

                <div style={{textAlign:'center',fontSize:11,color:'#bbb',marginBottom:16}}>
                  By registering you agree to our{' '}
                  <a href="#" style={{color:'#714B67',textDecoration:'none',fontWeight:700}}>Terms of Service</a>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[['✅','Free Setup'],['📞','Demo Call'],['🔄','30-day Trial']].map(([icon,label])=>(
                    <div key={label} style={{
                      textAlign:'center',padding:'12px 6px',
                      background:'white',borderRadius:10,
                      border:'1px solid #F0EBF0',
                    }}>
                      <div style={{fontSize:22,marginBottom:5}}>{icon}</div>
                      <div style={{fontSize:10,fontWeight:700,color:'#555'}}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{marginTop:28,textAlign:'center',fontSize:10,color:'#ccc'}}>
              © 2025 LNV Infotech Soft Solutions Pvt. Ltd. · Coimbatore
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
