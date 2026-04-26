import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// ─── Tool definitions ─────────────────────────────────────────────
const TOOLS = [
  { id:'pareto',       label:'1. Pareto Chart',        icon:'📊', desc:'80/20 rule — identify vital few causes' },
  { id:'fishbone',     label:'2. Fishbone / Ishikawa', icon:'🐟', desc:'Cause & Effect — 6M framework' },
  { id:'control',      label:'3. Control Chart (SPC)', icon:'📈', desc:'Monitor process stability over time' },
  { id:'histogram',    label:'4. Histogram',           icon:'📉', desc:'Data distribution & variation' },
  { id:'scatter',      label:'5. Scatter Diagram',     icon:'🔵', desc:'Correlation between two variables' },
  { id:'checksheet',   label:'6. Check Sheet',         icon:'✅', desc:'Structured data collection' },
  { id:'flowchart',    label:'7. Stratification',      icon:'🔀', desc:'Layer data to find patterns' },
]

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:3, textTransform:'uppercase' }

// ─── SVG Chart Components ─────────────────────────────────────────
function ParetoChart({ data }) {
  if (!data.length) return <EmptyChart msg="Add defect data to generate Pareto Chart" />
  const W = 520, H = 280, PAD = { t:20, r:80, b:60, l:60 }
  const sorted  = [...data].sort((a, b) => b.count - a.count)
  const total   = sorted.reduce((s, d) => s + parseInt(d.count || 0), 0)
  const cw      = (W - PAD.l - PAD.r) / sorted.length
  let cumPct    = 0
  const points  = []

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily:'DM Sans,sans-serif' }}>
      {/* Grid lines */}
      {[0,20,40,60,80,100].map(p => {
        const y = PAD.t + (H - PAD.t - PAD.b) * (1 - p/100)
        return <g key={p}>
          <line x1={PAD.l} y1={y} x2={W-PAD.r} y2={y} stroke="#F0EEF0" strokeWidth={1}/>
          <text x={PAD.l - 6} y={y + 4} fontSize={9} fill="#6C757D" textAnchor="end">{Math.round(total * p/100)}</text>
          <text x={W - PAD.r + 6} y={y + 4} fontSize={9} fill="#714B67" textAnchor="start">{p}%</text>
        </g>
      })}
      {/* Bars */}
      {sorted.map((d, i) => {
        const barH = total > 0 ? ((H - PAD.t - PAD.b) * (d.count / total)) : 0
        const x    = PAD.l + i * cw
        const y    = H - PAD.b - barH
        cumPct    += (d.count / total) * 100
        points.push({ x: x + cw / 2, y: PAD.t + (H - PAD.t - PAD.b) * (1 - cumPct/100) })
        return <g key={i}>
          <rect x={x+2} y={y} width={cw-4} height={barH} fill="#714B67" rx={2} opacity={.85}/>
          <text x={x + cw/2} y={H - PAD.b + 14} fontSize={9} fill="#333" textAnchor="middle">{d.label?.slice(0,8)}</text>
          <text x={x + cw/2} y={y - 3} fontSize={9} fill="#333" textAnchor="middle">{d.count}</text>
        </g>
      })}
      {/* Pareto line */}
      {points.length > 1 && (
        <polyline fill="none" stroke="#FF6B35" strokeWidth={2}
          points={[`${PAD.l},${H - PAD.b}`, ...points.map(p => `${p.x},${p.y}`), `${W - PAD.r},${points[points.length-1]?.y}`].join(' ')} />
      )}
      {/* 80% reference line */}
      <line x1={PAD.l} y1={PAD.t + (H-PAD.t-PAD.b)*0.2} x2={W-PAD.r} y2={PAD.t + (H-PAD.t-PAD.b)*0.2} stroke="#28A745" strokeWidth={1} strokeDasharray="4,4"/>
      <text x={PAD.l + 4} y={PAD.t + (H-PAD.t-PAD.b)*0.2 - 4} fontSize={9} fill="#28A745">80%</text>
      {/* Axes */}
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H-PAD.b} stroke="#333" strokeWidth={1.5}/>
      <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="#333" strokeWidth={1.5}/>
      <line x1={W-PAD.r} y1={PAD.t} x2={W-PAD.r} y2={H-PAD.b} stroke="#714B67" strokeWidth={1.5}/>
    </svg>
  )
}

function ControlChart({ data, ucl, lcl, cl }) {
  if (!data.length) return <EmptyChart msg="Add measurement data to plot Control Chart" />
  const W = 520, H = 240, PAD = { t:20, r:20, b:40, l:50 }
  const vals  = data.map(d => parseFloat(d.value) || 0)
  const min   = Math.min(...vals, parseFloat(lcl) || 0) - 1
  const max   = Math.max(...vals, parseFloat(ucl) || 0) + 1
  const scaleY = v => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - min) / (max - min))
  const scaleX = i => PAD.l + (i / (data.length - 1 || 1)) * (W - PAD.l - PAD.r)

  const getColor = v => {
    const u = parseFloat(ucl), l = parseFloat(lcl)
    if (u && v > u) return '#DC3545'
    if (l && v < l) return '#DC3545'
    return '#714B67'
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily:'DM Sans,sans-serif' }}>
      {/* UCL/LCL/CL lines */}
      {[[ucl,'#DC3545','UCL'],[cl,'#28A745','CL'],[lcl,'#DC3545','LCL']].map(([v,color,label]) => v ? (
        <g key={label}>
          <line x1={PAD.l} y1={scaleY(parseFloat(v))} x2={W-PAD.r} y2={scaleY(parseFloat(v))} stroke={color} strokeWidth={1.5} strokeDasharray={label==='CL'?'0':'5,3'}/>
          <text x={W-PAD.r+4} y={scaleY(parseFloat(v))+4} fontSize={9} fill={color}>{label}</text>
        </g>
      ) : null)}
      {/* Data line */}
      {data.length > 1 && (
        <polyline fill="none" stroke="#714B67" strokeWidth={1.5}
          points={data.map((d, i) => `${scaleX(i)},${scaleY(parseFloat(d.value)||0)}`).join(' ')} />
      )}
      {/* Points */}
      {data.map((d, i) => {
        const v = parseFloat(d.value) || 0
        return <g key={i}>
          <circle cx={scaleX(i)} cy={scaleY(v)} r={4} fill={getColor(v)} />
          <text x={scaleX(i)} y={H-PAD.b+14} fontSize={8} fill="#6C757D" textAnchor="middle">{d.label || i+1}</text>
        </g>
      })}
      {/* Axes */}
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H-PAD.b} stroke="#333" strokeWidth={1.5}/>
      <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="#333" strokeWidth={1.5}/>
    </svg>
  )
}

function HistogramChart({ data }) {
  if (!data.length) return <EmptyChart msg="Add measurement values to plot Histogram" />
  const W = 520, H = 240, PAD = { t:20, r:20, b:40, l:50 }
  const vals  = data.map(d => parseFloat(d.value) || 0).filter(v => !isNaN(v))
  if (!vals.length) return <EmptyChart msg="No valid values" />
  const min   = Math.min(...vals), max = Math.max(...vals)
  const bins  = 8
  const bw    = (max - min) / bins || 1
  const freq  = Array(bins).fill(0)
  vals.forEach(v => { const i = Math.min(Math.floor((v - min) / bw), bins - 1); freq[i]++ })
  const maxF  = Math.max(...freq)
  const cw    = (W - PAD.l - PAD.r) / bins

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily:'DM Sans,sans-serif' }}>
      {freq.map((f, i) => {
        const barH = maxF > 0 ? (H - PAD.t - PAD.b) * (f / maxF) : 0
        const x    = PAD.l + i * cw
        const y    = H - PAD.b - barH
        return <g key={i}>
          <rect x={x+1} y={y} width={cw-2} height={barH} fill="#714B67" rx={2} opacity={.8}/>
          <text x={x + cw/2} y={H - PAD.b + 14} fontSize={8} fill="#6C757D" textAnchor="middle">
            {(min + i * bw).toFixed(1)}
          </text>
          {f > 0 && <text x={x + cw/2} y={y - 3} fontSize={9} fill="#333" textAnchor="middle">{f}</text>}
        </g>
      })}
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H-PAD.b} stroke="#333" strokeWidth={1.5}/>
      <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="#333" strokeWidth={1.5}/>
    </svg>
  )
}

function ScatterChart({ data }) {
  if (!data.length) return <EmptyChart msg="Add X,Y data pairs to plot Scatter Diagram" />
  const W = 520, H = 260, PAD = { t:20, r:20, b:40, l:50 }
  const xs = data.map(d => parseFloat(d.x) || 0), ys = data.map(d => parseFloat(d.y) || 0)
  const minX = Math.min(...xs), maxX = Math.max(...xs) || 1
  const minY = Math.min(...ys), maxY = Math.max(...ys) || 1
  const sx = v => PAD.l + (v - minX) / (maxX - minX) * (W - PAD.l - PAD.r)
  const sy = v => PAD.t + (1 - (v - minY) / (maxY - minY)) * (H - PAD.t - PAD.b)
  // Simple linear regression
  const n = data.length
  const sumX = xs.reduce((a,b)=>a+b,0), sumY = ys.reduce((a,b)=>a+b,0)
  const sumXY = data.reduce((a,d)=>a+parseFloat(d.x)*parseFloat(d.y),0)
  const sumX2 = xs.reduce((a,b)=>a+b*b,0)
  const slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX) || 0
  const int   = (sumY - slope*sumX) / n
  const x1r = minX, y1r = slope*x1r + int, x2r = maxX, y2r = slope*x2r + int

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily:'DM Sans,sans-serif' }}>
      {/* Trend line */}
      {n > 1 && <line x1={sx(x1r)} y1={sy(y1r)} x2={sx(x2r)} y2={sy(y2r)} stroke="#FF6B35" strokeWidth={1.5} strokeDasharray="5,3" opacity={.7}/>}
      {data.map((d, i) => (
        <circle key={i} cx={sx(parseFloat(d.x))} cy={sy(parseFloat(d.y))} r={5} fill="#714B67" opacity={.75}/>
      ))}
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H-PAD.b} stroke="#333" strokeWidth={1.5}/>
      <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="#333" strokeWidth={1.5}/>
      <text x={W/2} y={H-5} fontSize={10} fill="#6C757D" textAnchor="middle">X Variable</text>
      <text x={12} y={H/2} fontSize={10} fill="#6C757D" textAnchor="middle" transform={`rotate(-90,12,${H/2})`}>Y Variable</text>
    </svg>
  )
}

function EmptyChart({ msg }) {
  return (
    <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#CCC', fontSize:13, fontStyle:'italic', background:'#F8F9FA', borderRadius:6, border:'1px dashed #E0D5E0' }}>
      {msg}
    </div>
  )
}

// ── Check Sheet ───────────────────────────────────────────────────
function CheckSheet({ rows, setRows }) {
  const [newDefect, setNewDefect] = useState('')
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat']
  const addRow = () => {
    if (!newDefect.trim()) return
    setRows(p => [...p, { defect: newDefect.trim(), counts: Array(6).fill(0) }])
    setNewDefect('')
  }
  const inc = (ri, di) => setRows(p => p.map((r, i) => i !== ri ? r : { ...r, counts: r.counts.map((c, j) => j !== di ? c : c+1) }))

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:12 }}>
        <input style={{ ...inp, flex:1 }} value={newDefect} onChange={e => setNewDefect(e.target.value)}
          placeholder="Add defect / check item..." onKeyDown={e => e.key==='Enter' && addRow()} />
        <button onClick={addRow} style={{ padding:'7px 16px', background:'#714B67', color:'#fff', border:'none', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer' }}>+ Add</button>
      </div>
      {rows.length === 0 ? <EmptyChart msg="Add defect types to create check sheet" /> : (
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'#F8F4F8' }}>
              <th style={{ padding:'8px 12px', textAlign:'left', fontWeight:700, color:'#6C757D', fontSize:11 }}>Defect / Item</th>
              {days.map(d => <th key={d} style={{ padding:'8px 12px', textAlign:'center', fontWeight:700, color:'#6C757D', fontSize:11 }}>{d}</th>)}
              <th style={{ padding:'8px 12px', textAlign:'center', fontWeight:700, color:'#714B67', fontSize:11 }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => {
              const total = r.counts.reduce((a, b) => a + b, 0)
              return (
                <tr key={ri} style={{ borderBottom:'1px solid #F0EEF0' }}>
                  <td style={{ padding:'8px 12px', fontWeight:600 }}>{r.defect}</td>
                  {r.counts.map((c, di) => (
                    <td key={di} style={{ padding:'4px 8px', textAlign:'center' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                        <div style={{ fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:13 }}>{'||||'.slice(0, c % 5)}{c >= 5 ? `  ×${Math.floor(c/5)}` : ''}</div>
                        <button onClick={() => inc(ri, di)} style={{ padding:'1px 8px', background:'#EDE0EA', color:'#714B67', border:'none', borderRadius:3, fontSize:10, cursor:'pointer', fontWeight:700 }}>
                          {c} +
                        </button>
                      </div>
                    </td>
                  ))}
                  <td style={{ padding:'8px 12px', textAlign:'center', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#714B67', fontSize:14 }}>{total}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── API ───────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })

// ── MAIN ─────────────────────────────────────────────────────────
export default function SevenQCTools() {
  const nav      = useNavigate()
  const [tool,   setTool]   = useState('pareto')
  const [title,  setTitle]  = useState('')
  const [saving, setSaving] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [sessions,  setSessions]  = useState([])   // saved sessions list
  const [showLoad,  setShowLoad]  = useState(false)

  // ── All chart data — EMPTY by default (user enters real data) ──
  const [defects,  setDefects]  = useState([])
  const [newDefect, setNewDefect] = useState({ label:'', count:'' })

  const [ctrlData, setCtrlData]  = useState([])
  const [ctrlLimits, setCtrlLimits] = useState({ ucl:'', cl:'', lcl:'' })
  const [newCtrl, setNewCtrl] = useState({ label:'', value:'' })

  const [histData,    setHistData]    = useState([])
  const [scatterData, setScatterData] = useState([])
  const [newHist,    setNewHist]    = useState('')
  const [newScatter, setNewScatter] = useState({ x:'', y:'' })

  const [csRows, setCsRows] = useState([])

  // ── Load saved sessions list ──────────────────────────────────
  const loadSessions = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/qm/7qc-sessions`, { headers: hdr2() })
      const data = await res.json()
      setSessions(data.data || [])
    } catch {}
  }

  // ── Load a specific session ───────────────────────────────────
  const loadSession = async (id) => {
    try {
      const res  = await fetch(`${BASE_URL}/qm/7qc-sessions/${id}`, { headers: hdr2() })
      const data = await res.json()
      const s    = data.data
      if (!s) return toast.error('Session not found')
      setTitle(s.title || '')
      setTool(s.activeTool || 'pareto')
      setSessionId(s.id)
      const d = typeof s.sessionData === 'string' ? JSON.parse(s.sessionData) : (s.sessionData || {})
      if (d.defects)    setDefects(d.defects)
      if (d.ctrlData)   setCtrlData(d.ctrlData)
      if (d.ctrlLimits) setCtrlLimits(d.ctrlLimits)
      if (d.histData)   setHistData(d.histData)
      if (d.scatterData)setScatterData(d.scatterData)
      if (d.csRows)     setCsRows(d.csRows)
      toast.success(`Session "${s.title}" loaded`)
      setShowLoad(false)
    } catch (e) { toast.error('Failed to load session') }
  }

  // ── Save current analysis ─────────────────────────────────────
  const save = async () => {
    if (!title.trim()) return toast.error('Enter an analysis title before saving')
    setSaving(true)
    try {
      const payload = {
        title,
        activeTool: tool,
        sessionData: { defects, ctrlData, ctrlLimits, histData, scatterData, csRows },
        ncrRef: '',
        createdBy: JSON.parse(localStorage.getItem('lnv_user') || '{}')?.name || 'Admin',
      }
      const url    = sessionId ? `${BASE_URL}/qm/7qc-sessions/${sessionId}` : `${BASE_URL}/qm/7qc-sessions`
      const method = sessionId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: hdr(), body: JSON.stringify(payload) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      if (!sessionId) setSessionId(data.data?.id)
      toast.success(`Analysis "${title}" saved!`)
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const newSession = () => {
    setSessionId(null); setTitle(''); setTool('pareto')
    setDefects([]); setCtrlData([]); setCtrlLimits({ucl:'',cl:'',lcl:''})
    setHistData([]); setScatterData([]); setCsRows([])
    toast.success('New session started')
  }

  return (
    <div>
      {/* Load session modal */}
      {showLoad && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:10,width:520,maxHeight:'80vh',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.25)'}}>
            <div style={{background:'#714B67',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <strong style={{color:'#fff',fontFamily:'Syne,sans-serif',fontSize:15}}>Load Saved Analysis</strong>
              <button onClick={()=>setShowLoad(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.7)',cursor:'pointer',fontSize:20}}>&#x2715;</button>
            </div>
            <div style={{overflowY:'auto',maxHeight:'60vh'}}>
              {sessions.length === 0
                ? <div style={{padding:40,textAlign:'center',color:'#999'}}>No saved sessions yet</div>
                : sessions.map(s=>(
                  <div key={s.id} onClick={()=>loadSession(s.id)}
                    style={{padding:'12px 20px',borderBottom:'1px solid #F0EEF0',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FDF8FC'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <div>
                      <div style={{fontWeight:700,color:'#714B67'}}>{s.title}</div>
                      <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
                        Tool: {s.activeTool} · {new Date(s.updatedAt||s.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <button className="btn-xs pri">Load</button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          7 QC Tools <small>Statistical Quality Analysis</small>
          {sessionId && <small style={{fontFamily:'DM Mono,monospace',color:'#714B67',marginLeft:8}}>#{sessionId}</small>}
        </div>
        <div className="fi-lv-actions">
          {/* Title input inline */}
          <input
            className="sd-search"
            placeholder="Analysis title (required to save)..."
            value={title}
            onChange={e=>setTitle(e.target.value)}
            style={{width:260}}
          />
          <button className="btn btn-s sd-bsm" onClick={()=>{loadSessions();setShowLoad(true)}}>Load</button>
          <button className="btn btn-s sd-bsm" onClick={newSession}>New</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving?'Saving...':'Save Analysis'}
          </button>
        </div>
      </div>

      {/* Tool selector */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {TOOLS.map(t => (
          <div key={t.id} onClick={() => setTool(t.id)} style={{
            padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700,
            border:'1.5px solid', transition:'all .15s',
            borderColor: tool === t.id ? '#714B67' : '#E0D5E0',
            background:  tool === t.id ? '#714B67' : '#fff',
            color:        tool === t.id ? '#fff'    : '#6C757D',
          }}>
            {t.icon} {t.label.split('.')[1]?.trim() || t.label}
          </div>
        ))}
      </div>

      {/* Active tool info strip */}
      <div style={{ background:'#EDE0EA', borderRadius:6, padding:'8px 14px', marginBottom:14, fontSize:12, color:'#714B67', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div><strong>{TOOLS.find(t=>t.id===tool)?.label}</strong> — {TOOLS.find(t=>t.id===tool)?.desc}</div>
        <span style={{ fontSize:11, color:'#999', fontStyle:'italic' }}>
          {sessionId ? `Session #${sessionId} · ${title}` : 'New session — enter title above and Save'}
        </span>
      </div>

      {/* ── PARETO ── */}
      {tool === 'pareto' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:14 }}>
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:16, background:'#fff' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:10 }}>Pareto Chart — Defect Frequency</div>
            <ParetoChart data={defects} />
          </div>
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:16, background:'#fff' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:10 }}>Defect Data</div>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input style={{ ...inp, flex:1 }} value={newDefect.label} placeholder="Defect name"
                onChange={e => setNewDefect(d => ({ ...d, label: e.target.value }))} />
              <input style={{ ...inp, width:70 }} value={newDefect.count} placeholder="Count" type="number"
                onChange={e => setNewDefect(d => ({ ...d, count: e.target.value }))} />
              <button onClick={() => { if (newDefect.label && newDefect.count) { setDefects(p=>[...p,{ label:newDefect.label, count:parseInt(newDefect.count) }]); setNewDefect({label:'',count:''}) } }}
                style={{ padding:'4px 10px', background:'#714B67', color:'#fff', border:'none', borderRadius:4, fontSize:11, cursor:'pointer', fontWeight:700, whiteSpace:'nowrap' }}>
                + Add
              </button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr style={{ background:'#F8F4F8' }}>
                <th style={{ padding:'5px 8px', textAlign:'left', fontSize:10, fontWeight:700, color:'#6C757D' }}>Defect</th>
                <th style={{ padding:'5px 8px', textAlign:'center', fontSize:10, fontWeight:700, color:'#6C757D' }}>Count</th>
                <th style={{ padding:'5px 8px', textAlign:'center', fontSize:10, fontWeight:700, color:'#6C757D' }}>%</th>
                <th></th>
              </tr></thead>
              <tbody>
                {[...defects].sort((a,b)=>b.count-a.count).map((d, i) => {
                  const total = defects.reduce((s,x)=>s+parseInt(x.count||0),0)
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid #F0EEF0' }}>
                      <td style={{ padding:'5px 8px' }}>{d.label}</td>
                      <td style={{ padding:'5px 8px', textAlign:'center', fontFamily:'DM Mono,monospace', fontWeight:700 }}>{d.count}</td>
                      <td style={{ padding:'5px 8px', textAlign:'center', color:'#714B67', fontWeight:700 }}>{total>0?((d.count/total)*100).toFixed(1):0}%</td>
                      <td style={{ padding:'5px 4px' }}>
                        <button onClick={() => setDefects(p=>p.filter((_,j)=>j!==defects.indexOf(d)))}
                          style={{ background:'none', border:'none', color:'#DC3545', cursor:'pointer', fontSize:12 }}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CONTROL CHART ── */}
      {tool === 'control' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:14 }}>
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:16, background:'#fff' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:10 }}>X-Bar Control Chart (SPC)</div>
            <ControlChart data={ctrlData} ucl={ctrlLimits.ucl} lcl={ctrlLimits.lcl} cl={ctrlLimits.cl} />
          </div>
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:16, background:'#fff', display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:8 }}>Control Limits</div>
              {[['UCL','ucl','#DC3545'],['CL (Mean)','cl','#28A745'],['LCL','lcl','#DC3545']].map(([l,k,c]) => (
                <div key={k} style={{ marginBottom:8 }}>
                  <label style={{ ...lbl, color:c }}>{l}</label>
                  <input style={{ ...inp, borderColor:c }} type="number" step="0.1"
                    value={ctrlLimits[k]} onChange={e=>setCtrlLimits(p=>({...p,[k]:e.target.value}))} />
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:8 }}>Add Measurement</div>
              <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                <input style={{ ...inp, width:60 }} value={newCtrl.label} placeholder="Pt" onChange={e=>setNewCtrl(p=>({...p,label:e.target.value}))} />
                <input style={{ ...inp, flex:1 }} type="number" step="0.01" value={newCtrl.value} placeholder="Value"
                  onChange={e=>setNewCtrl(p=>({...p,value:e.target.value}))} />
              </div>
              <button onClick={()=>{ if(newCtrl.value){ setCtrlData(p=>[...p,{label:newCtrl.label||String(p.length+1),value:newCtrl.value}]); setNewCtrl({label:'',value:''}) }}}
                style={{ width:'100%', padding:'6px', background:'#714B67', color:'#fff', border:'none', borderRadius:4, fontSize:11, cursor:'pointer', fontWeight:700 }}>
                + Add Point
              </button>
            </div>
            {/* Out of control points */}
            {ctrlData.filter(d => parseFloat(d.value) > parseFloat(ctrlLimits.ucl) || parseFloat(d.value) < parseFloat(ctrlLimits.lcl)).length > 0 && (
              <div style={{ background:'#FFF5F5', border:'1px solid #F5C6CB', borderRadius:6, padding:'8px 10px', fontSize:11 }}>
                <strong style={{ color:'#DC3545' }}>Out of Control Points:</strong>
                {ctrlData.filter(d => parseFloat(d.value) > parseFloat(ctrlLimits.ucl) || parseFloat(d.value) < parseFloat(ctrlLimits.lcl)).map((d, i) => (
                  <div key={i} style={{ color:'#DC3545' }}>{d.label}: {d.value}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HISTOGRAM ── */}
      {tool === 'histogram' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:14 }}>
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:16, background:'#fff' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:10 }}>Histogram — Data Distribution</div>
            <HistogramChart data={histData} />
            {/* Stats */}
            {histData.length > 0 && (() => {
              const vals = histData.map(d=>parseFloat(d.value)).filter(v=>!isNaN(v))
              const avg  = vals.reduce((a,b)=>a+b,0)/vals.length
              const std  = Math.sqrt(vals.reduce((a,b)=>a+(b-avg)**2,0)/vals.length)
              return (
                <div style={{ display:'flex', gap:20, marginTop:12, fontSize:12 }}>
                  {[['n', vals.length],['Mean', avg.toFixed(3)],['Std Dev', std.toFixed(3)],['Min', Math.min(...vals).toFixed(2)],['Max', Math.max(...vals).toFixed(2)]].map(([l,v])=>(
                    <div key={l} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:14, fontWeight:800, color:'#714B67', fontFamily:'DM Mono,monospace' }}>{v}</div>
                      <div style={{ fontSize:10, color:'#6C757D', fontWeight:700 }}>{l}</div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:16, background:'#fff' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:8 }}>Add Values</div>
            <div style={{ display:'flex', gap:6, marginBottom:8 }}>
              <input style={inp} type="number" step="0.01" value={newHist} placeholder="Value"
                onChange={e=>setNewHist(e.target.value)} />
              <button onClick={()=>{ if(newHist){ setHistData(p=>[...p,{value:newHist}]); setNewHist('') }}}
                style={{ padding:'4px 10px', background:'#714B67', color:'#fff', border:'none', borderRadius:4, fontSize:11, cursor:'pointer', fontWeight:700 }}>+</button>
            </div>
            <div style={{ maxHeight:200, overflowY:'auto', fontSize:11 }}>
              {histData.map((d, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'3px 6px', borderBottom:'1px solid #F0EEF0' }}>
                  <span style={{ fontFamily:'DM Mono,monospace' }}>{d.value}</span>
                  <button onClick={()=>setHistData(p=>p.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:'#DC3545', cursor:'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SCATTER ── */}
      {tool === 'scatter' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:14 }}>
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:16, background:'#fff' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:10 }}>Scatter Diagram — Correlation Analysis</div>
            <ScatterChart data={scatterData} />
          </div>
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:16, background:'#fff' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:8 }}>Add Data Points (X, Y)</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
              <input style={inp} type="number" value={newScatter.x} placeholder="X value" onChange={e=>setNewScatter(p=>({...p,x:e.target.value}))} />
              <input style={inp} type="number" value={newScatter.y} placeholder="Y value" onChange={e=>setNewScatter(p=>({...p,y:e.target.value}))} />
            </div>
            <button onClick={()=>{ if(newScatter.x&&newScatter.y){ setScatterData(p=>[...p,newScatter]); setNewScatter({x:'',y:''}) }}}
              style={{ width:'100%', padding:'6px', background:'#714B67', color:'#fff', border:'none', borderRadius:4, fontSize:11, cursor:'pointer', fontWeight:700, marginBottom:10 }}>
              + Add Point
            </button>
            <div style={{ maxHeight:200, overflowY:'auto', fontSize:11 }}>
              {scatterData.map((d, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'3px 6px', borderBottom:'1px solid #F0EEF0' }}>
                  <span style={{ fontFamily:'DM Mono,monospace' }}>({d.x}, {d.y})</span>
                  <button onClick={()=>setScatterData(p=>p.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:'#DC3545', cursor:'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CHECK SHEET ── */}
      {tool === 'checksheet' && (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:16, background:'#fff' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:10 }}>Check Sheet — Data Collection (Mon–Sat)</div>
          <CheckSheet rows={csRows} setRows={setCsRows} />
        </div>
      )}

      {/* ── STRATIFICATION (Flowchart placeholder) ── */}
      {tool === 'flowchart' && (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:20, background:'#fff' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:14 }}>Stratification — Layer Data by Category</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {['By Machine','By Shift','By Operator','By Material Lot','By Day','By Line'].map(cat => (
              <div key={cat} style={{ border:'1px solid #E0D5E0', borderRadius:6, padding:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67', marginBottom:8 }}>{cat}</div>
                <ParetoChart data={defects.slice(0,3).map(d=>({ ...d, count: Math.floor(d.count * (0.5 + Math.random())) }))} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FISHBONE (redirects to Why-Why) ── */}
      {tool === 'fishbone' && (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:20, background:'#fff', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:10 }}>🐟</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#714B67', marginBottom:8 }}>Fishbone / Ishikawa Diagram</div>
          <div style={{ fontSize:13, color:'#6C757D', marginBottom:16 }}>
            The Fishbone (Cause &amp; Effect) diagram is integrated into the Why-Why Analysis tool with full 6M framework.
          </div>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/why-analysis')}>
            Open Why-Why Analysis (with Fishbone)
          </button>
        </div>
      )}
    </div>
  )
}
