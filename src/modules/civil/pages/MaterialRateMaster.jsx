import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const CATS = ['All','Concrete','Steel','Masonry','Finishing','Shuttering','Misc']

// ── Inline Sparkline component ──
const Sparkline = ({ history=[], currentRate, width=80, height=28 }) => {
  const allRates = [...history.map(h=>Number(h.newRate)), Number(currentRate)].filter(Boolean)
  if (allRates.length < 2) return (
    <span style={{fontSize:10,color:'#aaa'}}>No trend</span>
  )
  const mn = Math.min(...allRates)
  const mx = Math.max(...allRates)
  const range = mx - mn || 1
  const pts = allRates.map((v,i) => ({
    x: (i / (allRates.length-1)) * width,
    y: height - ((v - mn) / range) * (height - 4) - 2
  }))
  const d = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last = allRates[allRates.length-1]
  const first = allRates[0]
  const isUp = last > first
  const isDown = last < first
  const color = isUp ? '#C0392B' : isDown ? '#1E8449' : '#888'
  return (
    <div style={{display:'flex',alignItems:'center',gap:6}}>
      <svg width={width} height={height} style={{display:'block'}}>
        <path d={d} fill='none' stroke={color} strokeWidth={1.5} strokeLinejoin='round'/>
        {pts.map((p,i)=>i===pts.length-1&&(
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color}/>
        ))}
      </svg>
      <span style={{fontSize:10,fontWeight:700,color,whiteSpace:'nowrap'}}>
        {isUp?'▲':isDown?'▼':'—'}
        {Math.abs(((last-first)/first)*100).toFixed(1)}%
      </span>
    </div>
  )
}

// ── Min/Max range bar ──
const RangeBar = ({ current, min, max }) => {
  if (!min || !max || Number(min)===Number(max)) return <span style={{fontSize:10,color:'#aaa'}}>—</span>
  const pct = Math.min(100, Math.max(0, ((Number(current)-Number(min))/(Number(max)-Number(min)))*100))
  const color = pct > 75 ? '#C0392B' : pct > 40 ? '#B8860B' : '#1E8449'
  return (
    <div style={{minWidth:80}}>
      <div style={{height:5,background:'#F0F0F0',borderRadius:3,overflow:'hidden',marginBottom:3}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#aaa'}}>
        <span>₹{Number(min).toLocaleString('en-IN')}</span>
        <span>₹{Number(max).toLocaleString('en-IN')}</span>
      </div>
    </div>
  )
}

const CAT_CLR = {
  Concrete:   '#6E2C00', Steel:     '#1A5276',
  Masonry:    '#B8860B', Finishing: '#117A65',
  Shuttering: '#714B67', Misc:      '#555'
}

export default function MaterialRateMaster() {
  const [rates,    setRates]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('All')
  const [search,   setSearch]   = useState('')
  const [editing,  setEditing]  = useState({}) // {matCode: newRate}
  const [saving,   setSaving]   = useState(false)
  const [history,  setHistory]  = useState(null) // {matCode, data}
  const [showAdd,  setShowAdd]  = useState(false)
  const [updatedBy,setUpdatedBy]= useState('')
  const [addForm,  setAddForm]  = useState({ matName:'', category:'Concrete', unit:'Bag', currentRate:'', minRate:'', maxRate:'' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/civil-ext/material-rates`, { headers:hdr2() })
      const d = await r.json()
      setRates(d.data || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = rates.filter(r =>
    (filter === 'All' || r.category === filter) &&
    (!search || r.matName.toLowerCase().includes(search.toLowerCase()))
  )

  const grouped = filtered.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {})

  // Update single rate
  const updateRate = async (matCode) => {
    const newRate = parseFloat(editing[matCode])
    if (!newRate || newRate <= 0) return toast.error('Enter valid rate')
    try {
      const r = await fetch(`${BASE}/civil-ext/material-rates/${matCode}`,{
        method:'PATCH', headers:hdr(),
        body:JSON.stringify({ currentRate:newRate, updatedBy:updatedBy||'Admin' })
      })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ Rate updated!`)
      setEditing(prev => { const n={...prev}; delete n[matCode]; return n })
      load()
    } catch { toast.error('Failed') }
  }

  // Bulk save all edited
  const bulkSave = async () => {
    const toUpdate = Object.entries(editing).map(([matCode, currentRate]) => ({ matCode, currentRate }))
    if (toUpdate.length === 0) return toast.error('No rates changed')
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/civil-ext/material-rates/bulk-update`, {
        method:'POST', headers:hdr(),
        body:JSON.stringify({ rates:toUpdate, updatedBy:updatedBy||'Admin' })
      })
      const d = await r.json()
      toast.success(`✅ ${d.updated} rates updated!`)
      setEditing({})
      load()
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  // Load history
  const loadHistory = async (matCode, matName) => {
    const r = await fetch(`${BASE}/civil-ext/material-rates/${matCode}/history`, { headers:hdr2() })
    const d = await r.json()
    setHistory({ matCode, matName, data:d.data||[] })
  }

  const saveNew = async () => {
    if (!addForm.matName.trim()) return toast.error('Material name required')
    if (!addForm.currentRate)    return toast.error('Current rate required')
    try {
      const r = await fetch(`${BASE}/civil-ext/material-rates`, { method:'POST', headers:hdr(), body:JSON.stringify(addForm) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success('✅ Material rate added!')
      setShowAdd(false)
      setAddForm({ matName:'', category:'Concrete', unit:'Bag', currentRate:'', minRate:'', maxRate:'' })
      load()
    } catch { toast.error('Failed') }
  }

  const changedCount = Object.keys(editing).length

  const inp = { padding:'6px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12,
    outline:'none', width:'100%', boxSizing:'border-box' }

  return (
    <div style={{background:'#F8F5F8',minHeight:'100vh',fontFamily:'DM Sans,sans-serif'}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📈 Material Rate Master</div>
          <div style={{fontSize:11,color:'#888'}}>
            {rates.length} materials · Update market rates monthly
            {changedCount > 0 && <span style={{color:'#C0392B',fontWeight:700}}> · {changedCount} rate(s) changed</span>}
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input defaultValue={updatedBy} onBlur={e=>setUpdatedBy(e.target.value)}
            placeholder='Updated by (name)'
            style={{...inp,width:160}} />
          <button onClick={()=>setShowAdd(true)}
            style={{padding:'7px 14px',background:'#FDF2E9',border:'1px solid #6E2C00',
              borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:600,color:'#6E2C00'}}>
            + Add Material
          </button>
          {changedCount > 0 && (
            <button onClick={bulkSave} disabled={saving}
              style={{padding:'7px 18px',background:'#1E8449',color:'#fff',border:'none',
                borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:700}}>
              {saving?'⏳ Saving...':`💾 Save ${changedCount} Rate(s)`}
            </button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div style={{background:'#FEF9E7',border:'1px solid #F0C848',borderRadius:8,
        padding:'10px 16px',marginBottom:12,fontSize:12,color:'#B8860B',
        display:'flex',gap:10,alignItems:'center'}}>
        <span style={{fontSize:18}}>💡</span>
        <span>
          <strong>How to update:</strong> Click on any rate → type new rate → Press Enter or click ✅
          · Or edit multiple rates and click <strong>Save All</strong> at once.
          Rate changes are recorded with history for audit.
        </span>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:6,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
        {CATS.map(c=>(
          <button key={c} onClick={()=>setFilter(c)}
            style={{padding:'5px 14px',border:'none',borderRadius:20,cursor:'pointer',
              fontSize:11,fontWeight:700,
              background:filter===c?(CAT_CLR[c]||'#6E2C00'):'#fff',
              color:filter===c?'#fff':(CAT_CLR[c]||'#555'),
              border:`1px solid ${filter===c?'transparent':(CAT_CLR[c]||'#ddd')}`}}>
            {c} {c!=='All'?`(${rates.filter(r=>r.category===c).length})`:``}
          </button>
        ))}
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder='🔍 Search material...'
          style={{...inp,width:200,marginLeft:8}} />
      </div>

      {/* Rate Table */}
      {loading ? (
        <div style={{textAlign:'center',padding:40,color:'#aaa'}}>⏳ Loading rates...</div>
      ) : (
        filter === 'All'
          ? Object.entries(grouped).map(([cat, items]) => (
            <CategoryTable key={cat} cat={cat} items={items} editing={editing}
              setEditing={setEditing} updateRate={updateRate} loadHistory={loadHistory} />
          ))
          : <CategoryTable cat={filter} items={filtered} editing={editing}
              setEditing={setEditing} updateRate={updateRate} loadHistory={loadHistory} />
      )}

      {/* History Modal */}
      {history && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
          onClick={e=>e.target===e.currentTarget&&setHistory(null)}>
          <div style={{background:'#fff',borderRadius:12,width:560,maxHeight:'80vh',
            overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{background:'#6E2C00',padding:'14px 20px',color:'#fff',
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:15,fontWeight:800}}>📈 Rate History & Trend</div>
                <div style={{fontSize:12,color:'#FDEBD0'}}>{history.matName}</div>
              </div>
              <button onClick={()=>setHistory(null)}
                style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',
                  borderRadius:6,padding:'4px 12px',cursor:'pointer',fontWeight:700}}>✕</button>
            </div>
            <div style={{padding:20}}>
              {history.data.length > 1 && (
                <div style={{padding:'12px 16px',background:'#F8F5F8',borderBottom:'1px solid #E8E0E8'}}>
                  <div style={{fontSize:11,color:'#888',marginBottom:6}}>Price Trend (all time)</div>
                  <Sparkline history={history.data.slice().reverse()} currentRate={history.data[0]?.newRate} width={400} height={50}/>
                </div>
              )}
              {history.data.length === 0 ? (
                <div style={{textAlign:'center',padding:30,color:'#aaa'}}>No history yet</div>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead>
                    <tr style={{background:'#FDF2E9'}}>
                      {['Date','Old Rate','New Rate','Change','Changed By','Remarks'].map(h=>(
                        <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.map((h,i)=>{
                      const diff = Number(h.newRate) - Number(h.oldRate)
                      return (
                        <tr key={h.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                          <td style={{padding:'8px 12px',fontSize:11}}>{fmtD(h.changedAt)}</td>
                          <td style={{padding:'8px 12px',color:'#888'}}>{fmtC(h.oldRate)}</td>
                          <td style={{padding:'8px 12px',fontWeight:700,color:'#1E8449'}}>{fmtC(h.newRate)}</td>
                          <td style={{padding:'8px 12px',fontWeight:700,color:diff>0?'#C0392B':'#1E8449'}}>
                            {diff>0?'▲':'▼'} {fmtC(Math.abs(diff))}
                          </td>
                          <td style={{padding:'8px 12px'}}>{h.changedBy}</td>
                          <td style={{padding:'8px 12px',color:'#888',fontSize:11}}>{h.remarks||'—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:480,
            boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'#6E2C00',marginBottom:18}}>
              ➕ Add Material Rate
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}}>Material Name *</label>
                <input defaultValue={addForm.matName} onBlur={e=>setAddForm(f=>({...f,matName:e.target.value}))}
                  placeholder='e.g. Quarry Sand' style={inp} />
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}}>Category</label>
                <select value={addForm.category} onChange={e=>setAddForm(f=>({...f,category:e.target.value}))} style={inp}>
                  {['Concrete','Steel','Masonry','Finishing','Shuttering','Misc'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}}>Unit</label>
                <select value={addForm.unit} onChange={e=>setAddForm(f=>({...f,unit:e.target.value}))} style={inp}>
                  {['Bag','Kg','MT','CuM','SqFt','SqM','RMT','Nos','Litre','Load'].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}}>Current Rate (₹) *</label>
                <input type='number' defaultValue={addForm.currentRate} onBlur={e=>setAddForm(f=>({...f,currentRate:e.target.value}))} placeholder='0' style={inp} />
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}}>Min Rate (₹)</label>
                <input type='number' defaultValue={addForm.minRate} onBlur={e=>setAddForm(f=>({...f,minRate:e.target.value}))} placeholder='0' style={inp} />
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}}>Max Rate (₹)</label>
                <input type='number' defaultValue={addForm.maxRate} onBlur={e=>setAddForm(f=>({...f,maxRate:e.target.value}))} placeholder='0' style={inp} />
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
              <button onClick={()=>setShowAdd(false)} style={{padding:'7px 16px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={saveNew} style={{padding:'7px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>💾 Add Rate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryTable({ cat, items, editing, setEditing, updateRate, loadHistory }) {
  const color = CAT_CLR[cat] || '#555'
  const fmtC2 = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})
  const fmtD2 = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—'

  return (
    <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,marginBottom:14,overflow:'hidden'}}>
      <div style={{background:`linear-gradient(135deg,${color}22,${color}11)`,
        borderBottom:`2px solid ${color}44`,padding:'9px 16px',
        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:13,fontWeight:700,color}}>{cat} Materials</div>
        <div style={{fontSize:11,color,fontWeight:600}}>{items.length} materials</div>
      </div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead>
          <tr style={{background:'#FAFAFA'}}>
            {['Code','Material Name','Unit','Min Rate','Current Rate','Max Rate','Last Updated','Updated By','History',''].map(h=>(
              <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:700,
                color:'#888',borderBottom:'1px solid #EEE',whiteSpace:'nowrap'}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((r,i)=>{
            const isEditing  = editing[r.matCode] !== undefined
            const editVal    = editing[r.matCode] ?? ''
            const diff       = isEditing ? parseFloat(editVal||0) - Number(r.currentRate) : 0
            const isIncrease = diff > 0
            const isDecrease = diff < 0

            return (
              <tr key={r.matCode} style={{background:isEditing?`${color}08`:i%2===0?'#fff':'#FAFAFA',
                borderBottom:'1px solid #F0F0F0',
                outline:isEditing?`1px solid ${color}`:'none'}}>
                <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:10,color,fontWeight:700}}>{r.matCode}</td>
                <td style={{padding:'8px 12px',fontWeight:600}}>{r.matName}</td>
                <td style={{padding:'8px 12px',color:'#888'}}>{r.unit}</td>
                {/* Trend Sparkline */}
                <td style={{padding:'8px 12px'}}>
                  <Sparkline history={r.history||[]} currentRate={r.currentRate} width={80} height={28}/>
                </td>

                {/* Editable Rate Cell */}
                <td style={{padding:'4px 8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{color:'#555',fontWeight:600,fontSize:12}}>₹</span>
                    <input
                      type='number'
                      defaultValue={Number(r.currentRate).toFixed(2)}
                      key={r.matCode + r.currentRate} // force re-render on rate change
                      onChange={e=>setEditing(prev=>({...prev,[r.matCode]:e.target.value}))}
                      onKeyDown={e=>{ if(e.key==='Enter') updateRate(r.matCode) }}
                      style={{width:90,padding:'6px 8px',border:`1.5px solid ${isEditing?color:'#ddd'}`,
                        borderRadius:5,fontSize:13,fontWeight:700,
                        color:isEditing?color:'#333',outline:'none',
                        background:isEditing?`${color}08`:'#fff'}} />
                    {isEditing && (
                      <button onClick={()=>updateRate(r.matCode)}
                        style={{padding:'4px 8px',background:color,color:'#fff',border:'none',
                          borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:700}}>✅</button>
                    )}
                    {isEditing && diff !== 0 && (
                      <span style={{fontSize:10,fontWeight:700,color:isIncrease?'#C0392B':'#1E8449'}}>
                        {isIncrease?'▲':'▼'}{Math.abs(diff).toFixed(0)}
                      </span>
                    )}
                  </div>
                </td>

                {/* Range bar */}
                <td style={{padding:'8px 12px'}}>
                  <RangeBar current={r.currentRate} min={r.minRate} max={r.maxRate}/>
                </td>
                <td style={{padding:'8px 12px',fontSize:11,color:'#888'}}>{fmtD2(r.lastUpdated)}</td>
                <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{r.updatedBy}</td>
                <td style={{padding:'8px 12px'}}>
                  <button onClick={()=>loadHistory(r.matCode,r.matName)}
                    style={{padding:'3px 8px',background:'#EBF5FB',color:'#1A5276',border:'none',
                      borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                    📈 History
                  </button>
                </td>
                <td style={{padding:'8px 12px'}}>
                  {r.prevRate && Number(r.prevRate) !== Number(r.currentRate) && (
                    <span style={{fontSize:10,color:Number(r.currentRate)>Number(r.prevRate)?'#C0392B':'#1E8449',fontWeight:700}}>
                      {Number(r.currentRate)>Number(r.prevRate)?'▲':'▼'} prev: {fmtC2(r.prevRate)}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
