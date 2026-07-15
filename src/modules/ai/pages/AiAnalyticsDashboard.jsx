import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN')

// Modules with real tool-calling wired up on the backend (routes/ai.js
// TOOL_REGISTRY). Others show as "coming soon" here rather than silently
// failing when asked something they have no tools for yet.
const MODULES = [
  { key:'FI', label:'Finance', icon:'💰', color:'#784212', hasInsights:true, hasQA:true,
    examples:['What was this month\'s EBITDA?', 'How does this month compare to last month?', 'What\'s our gross margin?'] },
  { key:'EDU',   label:'Education',   icon:'🎓', color:'#6E2C00', hasInsights:true, hasQA:true,
    examples:['What\'s today\'s attendance?', 'How much fee is outstanding?'] },
  { key:'CIVIL', label:'Civil',       icon:'🏗️', color:'#B8860B', hasInsights:true, hasQA:true,
    examples:['Give me a summary across all projects', 'How much payment is overdue?'] },
  { key:'SD',    label:'Sales',       icon:'🛒', color:'#714B67', hasInsights:false, hasQA:false },
  { key:'MM',    label:'Purchase',    icon:'📦', color:'#196F3D', hasInsights:false, hasQA:false },
  { key:'PP',    label:'Production',  icon:'⚙️',  color:'#6C3483', hasInsights:false, hasQA:false },
  { key:'QM',    label:'Quality',     icon:'✅', color:'#117864', hasInsights:false, hasQA:false },
  { key:'HCM',   label:'HR',          icon:'👥', color:'#2E86C1', hasInsights:false, hasQA:false },
]

// Converts any flat numeric result into chart-ready bars — not hardcoded
// to P&L field names, since EDU/Civil tools return completely different
// shapes (attendance counts, project sums, etc.), not just Revenue/COGS/EBITDA.
function toChartData(d) {
  if (!d || typeof d !== 'object') return null
  const labelMap = {
    revenue:'Revenue', cogs:'COGS', grossProfit:'Gross P.', opex:'OpEx', ebitda:'EBITDA', netProfit:'Net Profit',
    present:'Present', absent:'Absent', marked:'Marked', attendancePct:'Attendance %',
    totalDemand:'Total Fees', totalPaid:'Paid', totalDue:'Due',
    activeProjects:'Active Projects', totalContractValue:'Contract Value', totalRaBilled:'RA Billed', totalRaPaid:'RA Paid',
    overdueBillCount:'Overdue Bills', totalOverdueAmount:'Overdue Amount',
  }
  const entries = Object.entries(d).filter(([k,v]) => typeof v === 'number' && !isNaN(v))
  if (entries.length === 0) return null
  return entries.map(([k,v]) => ({ name: labelMap[k] || k, value: Math.round(v) }))
}

export default function AiAnalyticsDashboard() {
  const [aiEnabled, setAiEnabled] = useState(null) // null = loading
  const [selModule, setSelModule] = useState('FI')
  const [question,  setQuestion]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [history,   setHistory]   = useState([])
  const [insights,  setInsights]  = useState(null)
  const [insError,  setInsError]  = useState(null)
  const [insLoading,setInsLoading]= useState(true)

  const mod = MODULES.find(m => m.key === selModule)

  useEffect(() => {
    fetch(`${BASE}/ai/settings`, { headers:hdr2() })
      .then(r=>r.json()).then(d => setAiEnabled(!!d.data?.aiEnabled))
      .catch(() => setAiEnabled(false))
  }, [])

  // Proactive insights — fetched automatically, no question needed.
  // Same zero-extra-cost reasoning as the backend: these are plain
  // queries, not an LLM call, so it's safe to run on every module switch.
  useEffect(() => {
    if (!aiEnabled || !mod?.hasInsights) { setInsights(null); setInsError(null); return }
    setInsLoading(true); setInsError(null)
    fetch(`${BASE}/ai/insights?module=${selModule}`, { headers:hdr2() })
      .then(r=>r.json()).then(d => {
        if (d.error) { setInsError(d.error); setInsights(null) }
        else setInsights(d.data || null)
      })
      .catch(() => setInsError('Could not connect — check your connection'))
      .finally(() => setInsLoading(false))
  }, [selModule, aiEnabled])

  const ask = async (q) => {
    const text = (q || question).trim()
    if (!text || loading) return
    setQuestion(''); setLoading(true)
    try {
      const r = await fetch(`${BASE}/ai/analyze`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ question:text, module:selModule }) })
      const d = await r.json()
      setHistory(h => [{
        question:text, module:selModule,
        answer: d.error || d.answer,
        isError: !!d.error,
        chartData: toChartData(d.data),
        deviation: d.deviation,
        time: new Date(),
      }, ...h])
    } catch {
      setHistory(h => [{ question:text, module:selModule, answer:'Connection error — please try again.', isError:true, time:new Date() }, ...h])
    } finally { setLoading(false) }
  }

  if (aiEnabled === null) return <div style={{padding:60,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>

  if (!aiEnabled) return (
    <div style={{padding:60,textAlign:'center'}}>
      <div style={{fontSize:48,marginBottom:12}}>🤖</div>
      <div style={{fontSize:18,fontWeight:800,color:'#6E2C00',marginBottom:8}}>AI Analytics is not enabled</div>
      <div style={{fontSize:13,color:'#888'}}>A Super Admin can enable it under Config → AI Assistant.</div>
    </div>
  )

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'14px 20px',marginBottom:16}}>
        <div style={{fontSize:20,fontWeight:800,color:'#6E2C00'}}>🤖 AI Analytics</div>
        <div style={{fontSize:12,color:'#888',marginTop:2}}>Ask questions, get real computed answers with charts and deviation flags — not a chatbot guessing, actual tool-calling against your live data.</div>
      </div>

      {/* Module selector */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',padding:'0 20px'}}>
        {MODULES.map(m => {
          const clickable = m.hasInsights || m.hasQA
          return (
            <button key={m.key} onClick={()=>clickable && setSelModule(m.key)}
              disabled={!clickable}
              title={clickable ? '' : 'No AI tools registered for this module yet'}
              style={{padding:'8px 16px',borderRadius:8,border:selModule===m.key?`2px solid ${m.color}`:'1px solid #E8E0E8',
                background: selModule===m.key ? `${m.color}15` : '#fff',
                color: clickable ? (selModule===m.key?m.color:'#555') : '#ccc',
                cursor: clickable ? 'pointer' : 'not-allowed', fontWeight:700, fontSize:13,
                display:'flex',alignItems:'center',gap:6}}>
              {m.icon} {m.label} {!clickable && <span style={{fontSize:9,fontWeight:400}}>(soon)</span>}
            </button>
          )
        })}
      </div>

      <div style={{padding:'0 20px 20px'}}>
        {/* Proactive Insights — shown automatically, no question asked */}
        {mod?.hasInsights && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#888',textTransform:'uppercase',marginBottom:8}}>
              🔎 Insights — {mod.label}
            </div>
            {insLoading ? (
              <div style={{padding:20,textAlign:'center',color:'#aaa',fontSize:13}}>⏳ Checking...</div>
            ) : insError ? (
              <div style={{padding:'14px 16px',background:'#FDEDEC',border:'1px solid #F1948A',borderRadius:8,color:'#C0392B',fontSize:13}}>
                ⚠️ {insError}
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {(insights||[]).map((ins,i) => {
                  const sevStyle = {
                    critical: { bg:'#FDEDEC', border:'#F1948A', color:'#C0392B' },
                    warning:  { bg:'#FEF9E7', border:'#F9C74F', color:'#B8860B' },
                    success:  { bg:'#E8F5E9', border:'#A9DFBF', color:'#1E8449' },
                    info:     { bg:'#EBF5FB', border:'#A9CCE3', color:'#1A5276' },
                  }[ins.severity] || { bg:'#F5F5F5', border:'#ddd', color:'#555' }
                  return (
                    <div key={i} onClick={()=>ins.actionPath && (window.location.href=ins.actionPath)}
                      style={{background:sevStyle.bg,border:`1px solid ${sevStyle.border}`,borderRadius:8,
                        padding:'12px 14px',cursor:ins.actionPath?'pointer':'default',display:'flex',gap:10}}>
                      <div style={{fontSize:20}}>{ins.icon}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:sevStyle.color}}>{ins.title}</div>
                        <div style={{fontSize:12,color:'#555',marginTop:2}}>{ins.message}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Question input — only for modules with real tool-calling wired up */}
        {mod?.hasQA ? (
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:10,padding:16,marginBottom:16}}>
          <div style={{display:'flex',gap:10}}>
            <input value={question} onChange={e=>setQuestion(e.target.value)}
              onKeyDown={e=>e.key==='Enter' && ask()}
              placeholder={`Ask ${mod?.label} something...`} disabled={loading}
              style={{flex:1,padding:'12px 16px',border:'1.5px solid #DDD',borderRadius:8,fontSize:14,outline:'none'}} />
            <button onClick={()=>ask()} disabled={!question.trim()||loading}
              style={{padding:'12px 28px',background:question.trim()&&!loading?'#6E2C00':'#ddd',color:'#fff',
                border:'none',borderRadius:8,cursor:question.trim()&&!loading?'pointer':'default',fontWeight:700,fontSize:14}}>
              {loading ? '⏳ Analyzing...' : 'Ask'}
            </button>
          </div>
          {mod?.examples && history.length===0 && (
            <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
              {mod.examples.map((ex,i) => (
                <button key={i} onClick={()=>ask(ex)}
                  style={{padding:'6px 12px',background:`${mod.color}10`,color:mod.color,border:`1px solid ${mod.color}30`,
                    borderRadius:16,cursor:'pointer',fontSize:12}}>
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
        ) : mod?.hasInsights ? (
          <div style={{textAlign:'center',padding:'20px 0',color:'#aaa',fontSize:12}}>
            Interactive Q&amp;A for {mod.label} isn't wired up yet — insights above are automatic and need no question.
          </div>
        ) : null}

        {/* History — only relevant for modules with interactive Q&A */}
        {mod?.hasQA && (history.length === 0 ? (
          <div style={{textAlign:'center',padding:60,color:'#aaa'}}>Ask something above to get started</div>
        ) : history.map((h, i) => (
          <div key={i} style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:10,padding:20,marginBottom:14}}>
            <div style={{fontSize:11,color:'#888',marginBottom:8}}>{h.time.toLocaleTimeString('en-IN')} · {h.module}</div>

            <div style={{fontSize:14,fontWeight:700,color:'#333',marginBottom:10}}>❓ {h.question}</div>
            <div style={{fontSize:13,color:h.isError?'#C0392B':'#555',lineHeight:1.6,marginBottom:h.chartData||h.deviation?14:0}}>
              {h.isError ? '⚠️ ' : ''}{h.answer}
            </div>

            {h.deviation && (
              <div style={{padding:'10px 14px',borderRadius:8,marginBottom:14,
                background: h.deviation.flag==='IMPROVED' ? '#E8F5E9' : '#FDEDEC',
                color: h.deviation.flag==='IMPROVED' ? '#1E8449' : '#C0392B',
                fontSize:13, fontWeight:700}}>
                {h.deviation.flag==='IMPROVED' ? '📈' : '📉'} {h.deviation.field.toUpperCase()} {h.deviation.flag==='IMPROVED'?'improved':'declined'} by {Math.abs(h.deviation.pctChange)}% vs prior month
                <span style={{fontWeight:400,marginLeft:8,fontSize:12}}>({fmtC(h.deviation.previous)} → {fmtC(h.deviation.current)})</span>
              </div>
            )}

            {h.chartData && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={h.chartData} margin={{top:8,right:16,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{fontSize:11}} />
                  <YAxis tick={{fontSize:11}} tickFormatter={v=>`${Math.round(v/1000)}k`} />
                  <Tooltip formatter={v=>fmtC(v)} />
                  <Bar dataKey="value" fill="#6E2C00" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )))}
      </div>
    </div>
  )
}
