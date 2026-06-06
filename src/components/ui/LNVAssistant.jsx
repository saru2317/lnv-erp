// ═══════════════════════════════════════════════════════════════════
// LNV ERP — LNVAssistant.jsx
// Floating AI chat button — appears on all pages when AI is enabled
// Module-aware quick prompts + natural language → DB query
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

// ── Detect current module from URL ───────────────────────────────
const getModule = (pathname) => {
  const seg = pathname.split('/')[1]?.toUpperCase()
  const map = { SD:'SD', MM:'MM', PP:'PP', FI:'FI', QM:'QM', WM:'WM', HCM:'HCM', CRM:'CRM' }
  return map[seg] || 'GENERAL'
}

// ── Quick prompts per module ──────────────────────────────────────
const QUICK_PROMPTS = {
  SD:      ['What are today\'s sales?', 'Show pending invoices', 'Top customer this month?'],
  MM:      ['POs pending approval?', 'GRNs done today?', 'Low stock items?'],
  PP:      ['WOs in progress?', 'Production status today?', 'Any delayed work orders?'],
  FI:      ['Cash position today?', 'AR outstanding amount?', 'P&L this month summary'],
  QM:      ['Pending inspections?', 'Rejection rate today?'],
  WM:      ['FG stock available?', 'Stock below reorder level?'],
  HCM:     ['Attendance today?', 'Pending leave requests?'],
  CRM:     ['Open leads count?', 'Follow-ups due today?'],
  GENERAL: ['Show today\'s summary', 'What\'s pending approval?', 'Any alerts?'],
}

// ── LNV Logo Icon ────────────────────────────────────────────────
const LNVLogo = ({ size=36 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="8" fill="url(#lnvGrad)"/>
    <defs>
      <linearGradient id="lnvGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9B4F96"/>
        <stop offset="100%" stopColor="#5B1F6E"/>
      </linearGradient>
    </defs>
    <text x="18" y="24" textAnchor="middle" fill="white"
      fontSize="13" fontWeight="800" fontFamily="Arial,sans-serif" letterSpacing="0.5">
      LNV
    </text>
  </svg>
)

// ── Message bubble ────────────────────────────────────────────────
const Bubble = ({ msg }) => {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display:'flex', justifyContent: isUser?'flex-end':'flex-start',
      marginBottom:10, alignItems:'flex-end', gap:6 }}>
      {!isUser && (
        <div style={{ width:28, height:28, borderRadius:6, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <LNVLogo size={28} />
        </div>
      )}
      <div style={{
        maxWidth:'80%', padding:'9px 13px', borderRadius: isUser?'14px 14px 4px 14px':'14px 14px 14px 4px',
        background: isUser ? '#714B67' : '#F3EEF3',
        color: isUser ? '#fff' : '#2D3748',
        fontSize:12, lineHeight:'1.55',
        boxShadow:'0 1px 3px rgba(0,0,0,0.1)',
        whiteSpace:'pre-wrap',
      }}>
        {msg.content}
        {msg.typing && <span style={{ opacity:.5 }}>▊</span>}
      </div>
    </div>
  )
}

export default function LNVAssistant({ config }) {
  const location  = useLocation()
  const [open,    setOpen]    = useState(false)
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [pulse,   setPulse]   = useState(true)
  const bottomRef = useRef()
  const inputRef  = useRef()

  const currentModule = getModule(location.pathname)
  const prompts       = config?.quickPrompts?.[currentModule] || QUICK_PROMPTS[currentModule] || QUICK_PROMPTS.GENERAL
  const name          = config?.assistantName || 'LNV Claude'
  const prevModuleRef = React.useRef(currentModule)

  // Clear history when module changes
  React.useEffect(() => {
    if (prevModuleRef.current !== currentModule) {
      prevModuleRef.current = currentModule
      setHistory([])  // clear chat history
      setInput('')
    }
  }, [currentModule])

  // Stop pulse after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000)
    return () => clearTimeout(t)
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [history])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Welcome message on first open
  useEffect(() => {
    if (open && history.length === 0) {
      setHistory([{
        role:'assistant',
        content: `Hi! I'm ${name} 👋\n\nI can help you understand your ${currentModule === 'GENERAL' ? 'ERP' : currentModule} data. Ask me anything or use a quick prompt below.`
      }])
    }
  }, [open])

  const send = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setHistory(h => [...h, { role:'user', content: msg }])
    setLoading(true)

    // Add typing indicator
    setHistory(h => [...h, { role:'assistant', content:'', typing:true }])

    try {
      const r = await fetch(`${BASE}/ai/chat`, {
        method:'POST', headers:hdr(),
        body: JSON.stringify({
          message:     msg,
          module:      currentModule,
          currentPath: location.pathname,
          history:     history.filter(h=>!h.typing).slice(-6),
        })
      })
      const d = await r.json()

      setHistory(h => {
        const filtered = h.filter(x => !x.typing)
        return [...filtered, {
          role: 'assistant',
          content: d.error ? `⚠️ ${d.error}` : (d.answer || 'I could not process that.')
        }]
      })
    } catch(e) {
      setHistory(h => {
        const filtered = h.filter(x => !x.typing)
        return [...filtered, { role:'assistant', content:'⚠️ Connection error. Please try again.' }]
      })
    } finally {
      setLoading(false)
    }
  }, [input, history, currentModule, loading])

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // Module badge color
  const modColors = {
    SD:'#714B67', MM:'#196F3D', PP:'#6C3483', FI:'#784212',
    QM:'#117864', WM:'#1F618D', HCM:'#2E86C1', CRM:'#1A5276', GENERAL:'#495057'
  }
  const modColor = modColors[currentModule] || '#714B67'

  return (
    <>
      {/* ── Floating Button ── */}
      {!open && (
        <div onClick={() => setOpen(true)}
          style={{ position:'fixed', bottom:24, right:24, zIndex:9999,
            display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          {/* Tooltip */}
          <div style={{ background:'#1C1C1C', color:'#fff', padding:'5px 12px',
            borderRadius:16, fontSize:11, fontWeight:700, whiteSpace:'nowrap',
            opacity: pulse ? 1 : 0, transition:'opacity .3s',
            boxShadow:'0 2px 8px rgba(0,0,0,.2)' }}>
            Ask {name}
          </div>
          {/* Button */}
          <div style={{ width:54, height:54, borderRadius:'50%', cursor:'pointer',
            background:`linear-gradient(135deg,#714B67,#9B59B6)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            userSelect:'none',
            boxShadow: pulse
              ? '0 0 0 8px rgba(113,75,103,0.2), 0 4px 20px rgba(113,75,103,0.5)'
              : '0 4px 16px rgba(113,75,103,0.4)',
            animation: pulse ? 'lnvPulse 2s ease-in-out infinite' : 'none',
            transition:'box-shadow .3s',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <LNVLogo size={40} />
          </div>
          {/* Module badge */}
          <div style={{ background:modColor, color:'#fff', padding:'2px 8px',
            borderRadius:8, fontSize:9, fontWeight:800, letterSpacing:'0.5px' }}>
            {currentModule}
          </div>
        </div>
      )}

      {/* ── Chat Drawer ── */}
      {open && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999,
          width:360, height:520, borderRadius:16, overflow:'hidden',
          boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
          display:'flex', flexDirection:'column',
          background:'#fff', border:'1px solid #E8E0E8' }}>

          {/* Header */}
          <div style={{ background:`linear-gradient(135deg,#714B67,#9B59B6)`,
            padding:'12px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
              🤖
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:13, color:'#fff' }}>{name}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.75)',
                display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:'50%',
                  background:'#4CAF50', animation:'lnvBlink 2s infinite' }} />
                {currentModule} module · Ready
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff',
                width:28, height:28, borderRadius:'50%', cursor:'pointer',
                fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>
            {history.map((msg, i) => <Bubble key={i} msg={msg} />)}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {history.length <= 1 && prompts.length > 0 && (
            <div style={{ padding:'6px 12px', borderTop:'1px solid #F0F0F0', flexShrink:0 }}>
              <div style={{ fontSize:10, color:'#999', marginBottom:5, fontWeight:700, textTransform:'uppercase' }}>
                Quick Questions
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {prompts.map((p, i) => (
                  <button key={i} onClick={() => send(p)}
                    style={{ padding:'4px 10px', fontSize:10, fontWeight:600,
                      background:`${modColor}12`, color:modColor,
                      border:`1px solid ${modColor}30`, borderRadius:12,
                      cursor:'pointer', whiteSpace:'nowrap' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ padding:'10px 12px', borderTop:'1px solid #F0F0F0',
            display:'flex', gap:8, flexShrink:0, background:'#FAFAFA' }}>
            <input ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={`Ask ${name} anything...`}
              disabled={loading}
              style={{ flex:1, padding:'8px 12px', border:'1.5px solid #E0D5E0',
                borderRadius:20, fontSize:12, outline:'none',
                background:'#fff', fontFamily:'DM Sans,sans-serif' }} />
            <button onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{ width:36, height:36, borderRadius:'50%',
                background: input.trim() && !loading ? '#714B67' : '#E0D5E0',
                border:'none', cursor: input.trim() && !loading ? 'pointer':'default',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:16, transition:'background .2s', flexShrink:0 }}>
              {loading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes lnvPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(113,75,103,0.4), 0 4px 20px rgba(113,75,103,0.5); }
          50%       { box-shadow: 0 0 0 12px rgba(113,75,103,0), 0 4px 20px rgba(113,75,103,0.5); }
        }
        @keyframes lnvBlink {
          0%, 100% { opacity:1; }
          50%       { opacity:0.3; }
        }
      `}</style>
    </>
  )
}
