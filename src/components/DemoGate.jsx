import React, { useState, useEffect } from 'react'

// ── Change this password anytime before sharing ──
const DEMO_PASSWORD = 'LNV@Demo2026'
const GATE_KEY      = 'lnv_demo_access'

export default function DemoGate({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [input,    setInput]    = useState('')
  const [error,    setError]    = useState('')
  const [shake,    setShake]    = useState(false)
  const [show,     setShow]     = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    // Check if already unlocked in this session
    if (sessionStorage.getItem(GATE_KEY) === 'true') setUnlocked(true)
  }, [])

  const attempt = () => {
    if (!input.trim()) return
    setChecking(true)
    // Small delay — feels more secure
    setTimeout(() => {
      if (input === DEMO_PASSWORD) {
        sessionStorage.setItem(GATE_KEY, 'true')
        setUnlocked(true)
      } else {
        setError('Incorrect access code. Contact LNV Infotech for access.')
        setShake(true)
        setInput('')
        setTimeout(() => setShake(false), 600)
      }
      setChecking(false)
    }, 500)
  }

  if (unlocked) return children

  return (
    <div style={{
      minHeight:'100vh', background:'#1a0a2e',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'DM Sans, sans-serif', position:'relative', overflow:'hidden'
    }}>
      {/* Background blobs */}
      {[
        { w:420, h:420, top:'-80px',  left:'-80px',  bg:'#714B67' },
        { w:300, h:300, bottom:'-60px', right:'-60px', bg:'#4B2E83' },
        { w:200, h:200, top:'40%',    left:'60%',    bg:'#E06F39' },
      ].map((b,i) => (
        <div key={i} style={{
          position:'absolute', width:b.w, height:b.h, borderRadius:'50%',
          background:b.bg, opacity:.12, filter:'blur(60px)',
          top:b.top, left:b.left, right:b.right, bottom:b.bottom,
          pointerEvents:'none'
        }}/>
      ))}

      {/* Gate card */}
      <div style={{
        width:420, background:'rgba(255,255,255,0.05)',
        border:'1px solid rgba(255,255,255,0.12)',
        borderRadius:20, padding:'40px 36px',
        backdropFilter:'blur(20px)',
        boxShadow:'0 24px 80px rgba(0,0,0,.5)',
        animation: shake ? 'shake 0.5s' : 'none',
      }}>
        {/* Logo */}
        <div style={{textAlign:'center', marginBottom:32}}>
          <div style={{
            width:64, height:64, borderRadius:16, background:'linear-gradient(135deg,#714B67,#E06F39)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', fontSize:28, fontWeight:800, color:'#fff',
            boxShadow:'0 8px 24px rgba(113,75,103,.4)'
          }}>L</div>
          <div style={{fontSize:22, fontWeight:800, color:'#fff', letterSpacing:-.5}}>LNV ERP</div>
          <div style={{fontSize:12, color:'rgba(255,255,255,.5)', marginTop:4}}>
            Enterprise Resource Planning
          </div>
        </div>

        {/* Divider */}
        <div style={{height:1, background:'rgba(255,255,255,.1)', marginBottom:28}}/>

        <div style={{fontSize:13, fontWeight:600, color:'rgba(255,255,255,.7)', marginBottom:6, textAlign:'center'}}>
          DEMO ACCESS REQUIRED
        </div>
        <div style={{fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:24, textAlign:'center'}}>
          Enter the access code provided by LNV Infotech Soft Solutions
        </div>

        {/* Input */}
        <div style={{position:'relative', marginBottom:12}}>
          <input
            type={show ? 'text' : 'password'}
            placeholder="Enter access code"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            autoFocus
            style={{
              width:'100%', padding:'13px 44px 13px 16px',
              borderRadius:10, fontSize:14, outline:'none',
              background:'rgba(255,255,255,.08)',
              border:`1.5px solid ${error ? '#FF6B6B' : 'rgba(255,255,255,.15)'}`,
              color:'#fff', boxSizing:'border-box',
              fontFamily:'DM Mono, monospace', letterSpacing:2,
              transition:'border-color .2s',
            }}
            onFocus={e => e.target.style.borderColor = error ? '#FF6B6B' : '#714B67'}
            onBlur={e  => e.target.style.borderColor = error ? '#FF6B6B' : 'rgba(255,255,255,.15)'}
          />
          {/* Show/hide toggle */}
          <button onClick={() => setShow(s => !s)} style={{
            position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', cursor:'pointer',
            color:'rgba(255,255,255,.4)', fontSize:16, padding:0, lineHeight:1,
          }}>
            {show ? '\uD83D\uDE48' : '\uD83D\uDC41'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{fontSize:11, color:'#FF6B6B', marginBottom:12, textAlign:'center', fontWeight:600}}>
            {error}
          </div>
        )}

        {/* Button */}
        <button
          onClick={attempt}
          disabled={!input.trim() || checking}
          style={{
            width:'100%', padding:'13px',
            background: input.trim() && !checking
              ? 'linear-gradient(135deg, #714B67, #E06F39)'
              : 'rgba(255,255,255,.1)',
            border:'none', borderRadius:10,
            color: input.trim() && !checking ? '#fff' : 'rgba(255,255,255,.3)',
            fontSize:14, fontWeight:700, cursor: input.trim() && !checking ? 'pointer' : 'default',
            transition:'all .2s', letterSpacing:.3,
          }}>
          {checking ? 'Verifying...' : 'Access Demo'}
        </button>

        {/* Footer */}
        <div style={{marginTop:32, textAlign:'center'}}>
          <div style={{fontSize:11, color:'rgba(255,255,255,.25)', marginBottom:8}}>
            Don&apos;t have an access code?
          </div>
          <a href="mailto:info@lnvinfotech.com" style={{
            fontSize:12, color:'rgba(113,75,103,.8)', textDecoration:'none', fontWeight:600
          }}>
            Contact LNV Infotech Soft Solutions
          </a>
        </div>

        <div style={{marginTop:20, padding:'10px 14px', background:'rgba(255,255,255,.04)',
          borderRadius:8, border:'1px solid rgba(255,255,255,.07)'}}>
          <div style={{fontSize:10, color:'rgba(255,255,255,.3)', textAlign:'center', lineHeight:1.6}}>
            This is a protected demo environment.<br/>
            Unauthorized access is strictly prohibited.<br/>
            All activity is monitored and logged.
          </div>
        </div>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) }
          15%      { transform: translateX(-8px) }
          30%      { transform: translateX(8px) }
          45%      { transform: translateX(-6px) }
          60%      { transform: translateX(6px) }
          75%      { transform: translateX(-4px) }
          90%      { transform: translateX(4px) }
        }
      `}</style>
    </div>
  )
}
