import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerPortalServiceWorker } from './portalPwa'

const BASE = import.meta.env.VITE_API_URL || '/api'

export default function PortalLogin() {
  const nav = useNavigate()
  useEffect(() => { registerPortalServiceWorker() }, [])
  const [step,     setStep]     = useState('email') // 'email' | 'otp'
  const [email,    setEmail]    = useState('')
  const [otp,      setOtp]      = useState('')
  const [maskedTo, setMaskedTo] = useState('')
  const [demoOtp,  setDemoOtp]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const requestOtp = async () => {
    if (!email.trim()) return setError('Enter your registered email')
    setError(''); setLoading(true)
    try {
      const r = await fetch(`${BASE}/portal/request-otp`, { method:'POST',
        headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:email.trim() }) })
      const d = await r.json()
      if (d.error) { setError(d.error); return }
      setMaskedTo(d.message)
      setDemoOtp(d.demoOtp || null)
      setStep('otp')
    } catch { setError('Could not connect — check your internet and try again') }
    finally { setLoading(false) }
  }

  const verifyOtp = async () => {
    if (!otp.trim()) return setError('Enter the OTP sent to your email')
    setError(''); setLoading(true)
    try {
      const r = await fetch(`${BASE}/portal/verify-otp`, { method:'POST',
        headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:email.trim(), otp:otp.trim() }) })
      const d = await r.json()
      if (d.error) { setError(d.error); return }
      localStorage.setItem('portal_token', d.token)
      localStorage.setItem('portal_children', JSON.stringify(d.children))
      // Default to the first child — the dashboard's switcher lets them change
      localStorage.setItem('portal_selected_child', String(d.children[0].id))
      nav('/portal/fees')
    } catch { setError('Could not connect — check your internet and try again') }
    finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',background:'#FAF8FA',display:'flex',alignItems:'center',
      justifyContent:'center',fontFamily:'DM Sans,sans-serif',padding:20}}>
      <div style={{background:'#fff',borderRadius:14,padding:'32px 28px',width:'100%',maxWidth:380,
        boxShadow:'0 4px 20px rgba(0,0,0,.08)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:32,marginBottom:8}}>🎓</div>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>Parent Portal</div>
          <div style={{fontSize:12,color:'#888',marginTop:4}}>One login for all your children</div>
        </div>

        {step === 'email' && (
          <>
            <label style={{fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase'}}>Registered Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email"
              onKeyDown={e=>e.key==='Enter' && requestOtp()}
              placeholder="your@email.com"
              style={{width:'100%',padding:'11px 12px',border:'1.5px solid #DDD',borderRadius:8,
                fontSize:14,outline:'none',marginTop:6,marginBottom:16,boxSizing:'border-box'}} />
            <button onClick={requestOtp} disabled={loading}
              style={{width:'100%',padding:'11px',background:'#6E2C00',color:'#fff',border:'none',
                borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:14}}>
              {loading ? '⏳ Sending...' : 'Send OTP'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div style={{fontSize:12,color:'#1E8449',background:'#E8F5E9',padding:'8px 12px',
              borderRadius:6,marginBottom:16,textAlign:'center'}}>{maskedTo}</div>
            {demoOtp && (
              <div style={{fontSize:12,color:'#B8860B',background:'#FEF9E7',border:'1px dashed #F9C74F',
                padding:'10px 12px',borderRadius:6,marginBottom:16,textAlign:'center'}}>
                🎬 <b>Demo Mode</b> — no real email sent yet<br/>
                <span style={{fontSize:20,fontWeight:800,letterSpacing:4,color:'#6E2C00'}}>{demoOtp}</span>
              </div>
            )}
            <label style={{fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase'}}>Enter OTP</label>
            <input value={otp} onChange={e=>setOtp(e.target.value)}
              onKeyDown={e=>e.key==='Enter' && verifyOtp()}
              placeholder="6-digit code" maxLength={6}
              style={{width:'100%',padding:'11px 12px',border:'1.5px solid #DDD',borderRadius:8,
                fontSize:20,letterSpacing:6,textAlign:'center',outline:'none',marginTop:6,marginBottom:16,boxSizing:'border-box'}} />
            <button onClick={verifyOtp} disabled={loading}
              style={{width:'100%',padding:'11px',background:'#1E8449',color:'#fff',border:'none',
                borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:14,marginBottom:10}}>
              {loading ? '⏳ Verifying...' : 'Verify & Login'}
            </button>
            <button onClick={()=>{setStep('email');setOtp('');setError('')}}
              style={{width:'100%',padding:'8px',background:'transparent',color:'#888',border:'none',
                cursor:'pointer',fontSize:12}}>
              ← Use a different email
            </button>
          </>
        )}

        {error && (
          <div style={{marginTop:14,padding:'8px 12px',background:'#FDEDEC',color:'#C0392B',
            borderRadius:6,fontSize:12,textAlign:'center'}}>{error}</div>
        )}
      </div>
    </div>
  )
}
