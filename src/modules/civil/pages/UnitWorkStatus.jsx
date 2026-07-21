import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

const TRADE_COLORS = {
  'Civil':        { bar:'#ea580c', bg:'#fff7ed', text:'#c2410c', border:'#fdba74' },
  'Tile Work':    { bar:'#9333ea', bg:'#faf5ff', text:'#7e22ce', border:'#d8b4fe' },
  'Plumbing':     { bar:'#0284c7', bg:'#f0f9ff', text:'#0369a1', border:'#7dd3fc' },
  'Electrical':   { bar:'#eab308', bg:'#fefce8', text:'#a16207', border:'#fde047' },
  'Wall Work':    { bar:'#16a34a', bg:'#f0fdf4', text:'#15803d', border:'#86efac' },
  'Painting':     { bar:'#db2777', bg:'#fdf2f8', text:'#be185d', border:'#f9a8d4' },
  'MEP':          { bar:'#0d9488', bg:'#f0fdfa', text:'#0f766e', border:'#5eead4' },
  'Finishing':    { bar:'#4f46e5', bg:'#eef2ff', text:'#4338ca', border:'#a5b4fc' },
  'General':      { bar:'#64748b', bg:'#f8fafc', text:'#475569', border:'#cbd5e1' },
}
const tradeColor = t => TRADE_COLORS[t] || TRADE_COLORS['General']

const STATUS_STYLE = {
  'Completed':   { bg:'#d1fae5', text:'#065f46', border:'#6ee7b7' },
  'In Progress': { bg:'#dbeafe', text:'#1e40af', border:'#93c5fd' },
  'Pending':     { bg:'#f1f5f9', text:'#475569', border:'#cbd5e1' },
}

const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'
const dayName = d => d ? new Date(d).toLocaleDateString('en-IN',{weekday:'short'}) : ''

export default function UnitWorkStatus() {
  const { unitId } = useParams()
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tradeFilter, setTradeFilter] = useState('all')
  const [roomFilter, setRoomFilter] = useState('all')
  const [openTask, setOpenTask] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/civil/units/${unitId}/work-status`, { headers:hdr2() })
      const d = await r.json()
      if (d.error) { toast.error(d.error); setData(null) }
      else setData(d.data)
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[unitId])

  useEffect(()=>{ load() },[load])

  if (loading) return <div style={{padding:60,textAlign:'center',color:'#94a3b8'}}>⏳ Loading work status...</div>
  if (!data) return <div style={{padding:60,textAlign:'center',color:'#94a3b8'}}>Could not load this house's work status.</div>

  const allTasks = data.rooms.flatMap(r => r.tasks.map(t => ({ ...t, roomName:r.roomName, roomId:r.roomId })))
  const trades = [...new Set(allTasks.map(t=>t.trade))]
  const rooms = data.rooms.map(r=>({ id:r.roomId, name:r.roomName }))

  const tradeSummary = trades.map(trade => {
    const tTasks = allTasks.filter(t=>t.trade===trade)
    const totalAmt = tTasks.length
    const avgPct = totalAmt ? tTasks.reduce((s,t)=>s+t.donePct,0)/totalAmt : 0
    return { trade, pct:Math.round(avgPct), count:totalAmt }
  })

  const filtered = allTasks.filter(t =>
    (tradeFilter==='all' || t.trade===tradeFilter) &&
    (roomFilter==='all' || String(t.roomId)===String(roomFilter))
  )
  const grouped = {}
  filtered.forEach(t => { if (!grouped[t.roomName]) grouped[t.roomName]=[]; grouped[t.roomName].push(t) })

  return (
    <div style={{background:'#f8fafc',minHeight:'100vh',padding:'16px',fontFamily:'DM Sans,Inter,sans-serif'}}>
      <div style={{maxWidth:1100,margin:'0 auto',display:'flex',flexDirection:'column',gap:16}}>

        {/* Header */}
        <div style={{background:'#fff',borderRadius:16,padding:18,boxShadow:'0 1px 3px rgba(0,0,0,.06)',border:'1px solid #e2e8f0',
          display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <button onClick={()=>nav(-1)} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:13}}>← Back</button>
              <h1 style={{fontSize:19,fontWeight:800,color:'#0f172a',margin:0}}>{data.projectName}</h1>
              <span style={{background:'#dbeafe',color:'#1d4ed8',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,border:'1px solid #bfdbfe'}}>
                {data.unitNo}{data.unitType?` (${data.unitType})`:''}
              </span>
            </div>
            <p style={{color:'#64748b',fontSize:12,marginTop:4}}>Tap any task to view its <strong>day-by-day execution log</strong>, pulled from real site DPR history.</p>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase'}}>Overall</div>
            <div style={{fontSize:26,fontWeight:900,color:'#0f172a'}}>{data.overallProgress}%</div>
          </div>
        </div>

        {/* Trade summary cards */}
        {tradeSummary.length>0 && (
          <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(tradeSummary.length,3)},1fr)`,gap:12}}>
            {tradeSummary.map(ts => {
              const c = tradeColor(ts.trade)
              return (
                <div key={ts.trade} style={{background:'#fff',borderRadius:16,padding:16,boxShadow:'0 1px 3px rgba(0,0,0,.06)',
                  border:'1px solid #e2e8f0',borderLeft:`4px solid ${c.bar}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.3}}>{ts.trade}</span>
                    <span style={{fontSize:11,color:'#94a3b8'}}>{ts.count} item{ts.count!==1?'s':''}</span>
                  </div>
                  <div style={{marginTop:10}}>
                    <div style={{fontSize:22,fontWeight:800,color:'#1e293b'}}>{ts.pct}%</div>
                    <div style={{background:'#f1f5f9',height:8,borderRadius:4,marginTop:6,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${ts.pct}%`,background:c.bar,borderRadius:4,transition:'width .4s'}} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Filters */}
        <div style={{background:'#fff',borderRadius:16,padding:14,boxShadow:'0 1px 3px rgba(0,0,0,.06)',border:'1px solid #e2e8f0',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',minWidth:50}}>Trade:</span>
            <button onClick={()=>setTradeFilter('all')}
              style={{padding:'6px 12px',fontSize:12,fontWeight:700,borderRadius:10,cursor:'pointer',border:'none',
                background:tradeFilter==='all'?'#0f172a':'#f1f5f9',color:tradeFilter==='all'?'#fff':'#475569'}}>All Trades</button>
            {trades.map(t=>(
              <button key={t} onClick={()=>setTradeFilter(t)}
                style={{padding:'6px 12px',fontSize:12,fontWeight:700,borderRadius:10,cursor:'pointer',border:'none',
                  background:tradeFilter===t?'#0f172a':'#f1f5f9',color:tradeFilter===t?'#fff':'#475569'}}>{t}</button>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',borderTop:'1px solid #f1f5f9',paddingTop:10}}>
            <span style={{fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',minWidth:50}}>Room:</span>
            <button onClick={()=>setRoomFilter('all')}
              style={{padding:'6px 12px',fontSize:12,fontWeight:700,borderRadius:10,cursor:'pointer',border:'none',
                background:roomFilter==='all'?'#0f172a':'#f1f5f9',color:roomFilter==='all'?'#fff':'#475569'}}>All Rooms</button>
            {rooms.map(r=>(
              <button key={r.id} onClick={()=>setRoomFilter(String(r.id))}
                style={{padding:'6px 12px',fontSize:12,fontWeight:700,borderRadius:10,cursor:'pointer',border:'none',
                  background:roomFilter===String(r.id)?'#0f172a':'#f1f5f9',color:roomFilter===String(r.id)?'#fff':'#475569'}}>{r.name}</button>
            ))}
          </div>
        </div>

        {/* Room cards grid */}
        {Object.keys(grouped).length===0 ? (
          <div style={{background:'#fff',borderRadius:16,padding:50,textAlign:'center',color:'#94a3b8',border:'1px solid #e2e8f0'}}>
            No tasks found for the selected filters.
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
            {Object.entries(grouped).map(([roomName, tasks]) => (
              <div key={roomName} style={{background:'#fff',borderRadius:16,padding:16,boxShadow:'0 1px 3px rgba(0,0,0,.06)',border:'1px solid #e2e8f0'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:10,marginBottom:10,borderBottom:'1px solid #f1f5f9'}}>
                  <h3 style={{fontSize:14,fontWeight:800,color:'#0f172a',margin:0}}>{roomName}</h3>
                  <span style={{fontSize:11,fontWeight:700,color:'#475569',background:'#f1f5f9',padding:'3px 10px',borderRadius:20}}>{tasks.length} item{tasks.length!==1?'s':''}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {tasks.map(task => {
                    const c = tradeColor(task.trade)
                    const s = STATUS_STYLE[task.status]
                    return (
                      <div key={task.boqId} onClick={()=>setOpenTask(task)}
                        style={{background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:12,padding:12,cursor:'pointer'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                          <span style={{fontSize:10,fontWeight:700,color:c.text}}>{task.trade}</span>
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:s.bg,color:s.text,border:`1px solid ${s.border}`}}>{task.status}</span>
                        </div>
                        <div style={{fontSize:13,fontWeight:700,color:'#1e293b',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span>{task.activity}</span>
                          <span style={{color:'#94a3b8',fontSize:12}}>›</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#64748b',marginTop:6}}>
                          <span>Progress: <strong style={{color:'#334155'}}>{task.donePct.toFixed(0)}%</strong></span>
                          <span style={{background:'#fff',padding:'1px 8px',borderRadius:6,border:'1px solid #e2e8f0'}}>{task.dailyLogs.length} Daily Logs</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drill-down modal */}
      {openTask && (
        <div onClick={()=>setOpenTask(null)} style={{position:'fixed',inset:0,background:'rgba(15,23,42,.6)',zIndex:1000,
          display:'flex',alignItems:'center',justifyContent:'center',padding:12}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:20,maxWidth:640,width:'100%',maxHeight:'88vh',
            display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>

            <div style={{padding:18,background:'#0f172a',color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{display:'flex',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                  <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',padding:'3px 10px',borderRadius:20,
                    background:`${tradeColor(openTask.trade).bar}33`,color:tradeColor(openTask.trade).border}}>{openTask.trade}</span>
                  <span style={{fontSize:12,color:'#94a3b8'}}>{openTask.roomName}</span>
                </div>
                <h2 style={{fontSize:17,fontWeight:800,margin:0}}>{openTask.activity}</h2>
                <p style={{fontSize:11,color:'#94a3b8',marginTop:4}}>{openTask.description}</p>
              </div>
              <button onClick={()=>setOpenTask(null)} style={{background:'#1e293b',border:'none',color:'#94a3b8',
                borderRadius:20,width:32,height:32,cursor:'pointer',fontSize:14,flexShrink:0}}>✕</button>
            </div>

            <div style={{padding:18,overflowY:'auto',background:'#f8fafc',flex:1}}>
              <div style={{background:'#fff',borderRadius:14,padding:14,border:'1px solid #e2e8f0',display:'flex',
                justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:16,flexWrap:'wrap'}}>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#64748b',marginBottom:4}}>
                    <span>Overall Completion</span><strong style={{color:'#1e293b'}}>{openTask.donePct.toFixed(0)}%</strong>
                  </div>
                  <div style={{background:'#f1f5f9',height:8,borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${openTask.donePct}%`,background:'#10b981',borderRadius:4}} />
                  </div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <div style={{background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:10,padding:'8px 12px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:'#94a3b8'}}>Total Qty</div>
                    <div style={{fontSize:12,fontWeight:700,color:'#1e293b'}}>{openTask.quantity} {openTask.unit}</div>
                  </div>
                  <div style={{background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:10,padding:'8px 12px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:'#94a3b8'}}>Days Logged</div>
                    <div style={{fontSize:12,fontWeight:700,color:'#1e293b'}}>{openTask.dailyLogs.length}</div>
                  </div>
                </div>
              </div>

              <div style={{fontSize:12,fontWeight:800,color:'#1e293b',textTransform:'uppercase',letterSpacing:.3,marginBottom:12}}>
                📅 Day-by-Day Activity Log
              </div>

              {openTask.dailyLogs.length===0 ? (
                <div style={{textAlign:'center',color:'#94a3b8',padding:30,background:'#fff',borderRadius:12,border:'1px dashed #e2e8f0'}}>
                  No DPR entries logged against this activity yet.
                </div>
              ) : (
                <div style={{position:'relative',paddingLeft:20}}>
                  <div style={{position:'absolute',left:5,top:6,bottom:6,width:2,background:'#e2e8f0'}} />
                  {openTask.dailyLogs.slice().reverse().map((log,i) => (
                    <div key={i} style={{position:'relative',marginBottom:12}}>
                      <div style={{position:'absolute',left:-19,top:4,width:12,height:12,borderRadius:'50%',
                        background:'#2563eb',border:'2px solid #fff',boxShadow:'0 0 0 2px #dbeafe'}} />
                      <div style={{background:'#fff',borderRadius:14,padding:12,border:'1px solid #e2e8f0'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #f1f5f9',paddingBottom:6,marginBottom:6,flexWrap:'wrap',gap:6}}>
                          <div style={{display:'flex',gap:6,alignItems:'center'}}>
                            <span style={{fontSize:11,fontWeight:700,color:'#2563eb',background:'#eff6ff',padding:'2px 8px',borderRadius:8,border:'1px solid #dbeafe'}}>{dayName(log.date)}</span>
                            <span style={{fontSize:11,color:'#94a3b8'}}>{fmtD(log.date)}</span>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:'#059669',background:'#ecfdf5',padding:'2px 8px',borderRadius:6,border:'1px solid #a7f3d0'}}>
                            +{log.pctGain.toFixed(0)}% ({log.todayQty} {openTask.unit})
                          </span>
                        </div>
                        {log.remarks && <p style={{fontSize:12,color:'#334155',margin:'0 0 8px'}}>{log.remarks}</p>}
                        <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6,fontSize:11,color:'#64748b',
                          borderTop:'1px dashed #f1f5f9',paddingTop:6}}>
                          <span>👷 {log.labourContext || 'No labour logged that day'}</span>
                          <span style={{color:'#94a3b8',fontSize:10}}>{log.dprNo}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{fontSize:10,color:'#94a3b8',marginTop:10,textAlign:'center'}}>
                Worker counts shown are project-wide for that day, not task-specific — that granularity isn't captured yet.
              </div>
            </div>

            <div style={{padding:14,background:'#fff',borderTop:'1px solid #e2e8f0',display:'flex',justifyContent:'flex-end'}}>
              <button onClick={()=>setOpenTask(null)} style={{padding:'10px 20px',background:'#0f172a',color:'#fff',
                border:'none',borderRadius:10,fontWeight:700,fontSize:12,cursor:'pointer'}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
