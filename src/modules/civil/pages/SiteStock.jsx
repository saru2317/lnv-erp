import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

export default function SiteStock() {
  const nav = useNavigate()
  const [projects,   setProjects]   = useState([])
  const [selProject, setSelProject] = useState('')
  const [stock,      setStock]      = useState([])
  const [issues,     setIssues]     = useState([])
  const [loading,    setLoading]    = useState(false)
  const [tab,        setTab]        = useState('stock')
  const [totalValue, setTotalValue] = useState(0)
  const [lowCount,   setLowCount]   = useState(0)

  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,{headers:hdr2()}).then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{})
  },[])

  const load = useCallback(async (pid)=>{
    if (!pid) return
    setLoading(true)
    try {
      const [sr, ir] = await Promise.all([
        fetch(`${BASE}/civil-ext/site-stock/${pid}`,{headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil-ext/issue-slips?projectId=${pid}`,{headers:hdr2()}).then(r=>r.json()),
      ])
      setStock(sr.data||[])
      setTotalValue(sr.totalValue||0)
      setLowCount(sr.lowStockCount||0)
      setIssues(ir.data||[])
    } catch {} finally { setLoading(false) }
  },[])

  useEffect(()=>{ load(selProject) },[selProject,load])

  // Physical count modal
  const [showCount, setShowCount] = useState(false)
  const [countItems, setCountItems] = useState([])
  const [countBy, setCountBy] = useState('')
  const [posting, setPosting] = useState(false)

  const openCount = () => {
    setCountItems(stock.map(s=>({
      matCode: s.matCode, matName: s.matName, unit: s.unit,
      sysBalance: Number(s.qtyBalance||0), physicalQty: '', rate: Number(s.lastRate||0), variance:0
    })))
    setShowCount(true)
  }

  const setCountQty = (idx, qty) => {
    setCountItems(prev => {
      const n = [...prev]
      n[idx] = { ...n[idx], physicalQty: qty, variance: parseFloat(qty||0) - n[idx].sysBalance }
      return n
    })
  }

  const submitCount = async () => {
    if (!countBy.trim()) return toast.error('Conducted by required')
    setPosting(true)
    try {
      const r = await fetch(`${BASE}/civil-ext/physical-counts`,{method:'POST',headers:hdr(),
        body:JSON.stringify({ projectId:selProject, conductedBy:countBy,
          items:countItems.filter(i=>i.physicalQty!=='') })})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      // Auto-post
      await fetch(`${BASE}/civil-ext/physical-counts/${d.data.id}/post`,{method:'PATCH',headers:hdr()})
      toast.success('✅ Physical count posted — stock adjusted')
      setShowCount(false); load(selProject)
    } catch { toast.error('Failed') }
    finally { setPosting(false) }
  }

  return (
    <div style={{ background:'#F8F5F8', minHeight:'100vh', fontFamily:'DM Sans,sans-serif' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'#6E2C00' }}>📊 Site Stock Register</div>
          <div style={{ fontSize:11, color:'#888' }}>Material stock per project site — issue based tracking</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {selProject && (
            <>
              <button onClick={openCount}
                style={{ padding:'7px 14px', background:'#FDF2E9', border:'1px solid #6E2C00', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:600, color:'#6E2C00' }}>
                📋 Weekly Count
              </button>
              <button onClick={()=>nav('/civil/issue-slip')}
                style={{ padding:'7px 16px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:700 }}>
                + Issue Materials
              </button>
            </>
          )}
        </div>
      </div>

      {/* Project Select */}
      <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, padding:'10px 14px', marginBottom:14, display:'flex', gap:12, alignItems:'center' }}>
        <select value={selProject} onChange={e=>setSelProject(e.target.value)}
          style={{ width:400, padding:'8px 12px', border:'1.5px solid #E8D5C4', borderRadius:6, fontSize:13, background:'#FFFAF7', outline:'none' }}>
          <option value=''>— Select Project —</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
        </select>
        {selProject && (
          <>
            <div style={{ padding:'6px 14px', background:'#E8F5E9', borderRadius:6, fontSize:12, fontWeight:700, color:'#1E8449' }}>
              Stock Value: {fmtC(totalValue)}
            </div>
            {lowCount > 0 && (
              <div style={{ padding:'6px 14px', background:'#FDEDEC', borderRadius:6, fontSize:12, fontWeight:700, color:'#C0392B' }}>
                ⚠️ {lowCount} items low/out of stock
              </div>
            )}
          </>
        )}
      </div>

      {/* Tabs */}
      {selProject && (
        <div style={{ display:'flex', gap:4, background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, padding:4, marginBottom:14, width:'fit-content' }}>
          {[['stock','📦 Stock Balance'],['issues','📋 Issue Slips']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{ padding:'7px 18px', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:12,
                background:tab===k?'#6E2C00':'transparent', color:tab===k?'#fff':'#888' }}>
              {l}
            </button>
          ))}
        </div>
      )}

      {/* STOCK BALANCE */}
      {tab==='stock' && selProject && (
        <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#aaa' }}>⏳ Loading...</div>
          ) : stock.length===0 ? (
            <div style={{ padding:60, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
              <div style={{ fontSize:15, fontWeight:600, color:'#6E2C00', marginBottom:8 }}>No stock entries yet</div>
              <div style={{ fontSize:12, color:'#888', marginBottom:16 }}>Stock is updated when materials are received at site</div>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#6E2C00', color:'#fff' }}>
                  {['Material','Specification','Unit','Received','Issued','Balance','Rate','Stock Value','Status'].map(h=>(
                    <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stock.map((s,i)=>{
                  const pct = s.qtyReceived > 0 ? Math.round(Number(s.qtyIssued)/Number(s.qtyReceived)*100) : 0
                  const isLow = Number(s.qtyBalance) <= 0
                  return (
                    <tr key={s.id} style={{ background:isLow?'#FFF5F5':i%2===0?'#fff':'#FDF9F7', borderBottom:'1px solid #F5EDE0' }}>
                      <td style={{ padding:'9px 12px', fontWeight:700 }}>{s.matName}</td>
                      <td style={{ padding:'9px 12px', color:'#555', fontSize:11 }}>{s.specification||'—'}</td>
                      <td style={{ padding:'9px 12px', color:'#888' }}>{s.unit}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right', color:'#1E8449', fontWeight:600 }}>{Number(s.qtyReceived||0).toFixed(2)}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right', color:'#D35400', fontWeight:600 }}>{Number(s.qtyIssued||0).toFixed(2)}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right', fontWeight:800, fontSize:13,
                        color:isLow?'#C0392B':Number(s.qtyBalance)<5?'#D35400':'#1E8449' }}>
                        {Number(s.qtyBalance||0).toFixed(2)}
                      </td>
                      <td style={{ padding:'9px 12px', textAlign:'right' }}>{fmtC(s.lastRate)}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right', fontWeight:700, color:'#1A5276' }}>{fmtC(s.stockValue)}</td>
                      <td style={{ padding:'9px 12px' }}>
                        {isLow ? (
                          <span style={{ padding:'2px 8px', background:'#FDEDEC', color:'#C0392B', borderRadius:10, fontSize:10, fontWeight:700 }}>OUT OF STOCK</span>
                        ) : Number(s.qtyBalance) < 5 ? (
                          <span style={{ padding:'2px 8px', background:'#FEF9E7', color:'#B8860B', borderRadius:10, fontSize:10, fontWeight:700 }}>LOW</span>
                        ) : (
                          <span style={{ padding:'2px 8px', background:'#E8F5E9', color:'#1E8449', borderRadius:10, fontSize:10, fontWeight:700 }}>OK</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ background:'#FDF2E9', fontWeight:700 }}>
                  <td colSpan={7} style={{ padding:'10px 12px', color:'#6E2C00' }}>TOTAL STOCK VALUE</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', color:'#6E2C00', fontSize:14 }}>{fmtC(totalValue)}</td>
                  <td/>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ISSUE SLIPS */}
      {tab==='issues' && selProject && (
        <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, overflow:'hidden' }}>
          {issues.length===0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#aaa' }}>No issue slips yet</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#6E2C00', color:'#fff' }}>
                  {['Issue No','Date','Issued To','Type','Activity / WO','Items','Value','Issued By'].map(h=>(
                    <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.map((s,i)=>{
                  const its = (() => { try { return JSON.parse(s.items||'[]') } catch { return [] } })()
                  return (
                    <tr key={s.id} style={{ background:i%2===0?'#fff':'#FDF9F7', borderBottom:'1px solid #F5EDE0' }}>
                      <td style={{ padding:'9px 12px', fontFamily:'monospace', fontSize:10, color:'#6E2C00', fontWeight:700 }}>{s.issueNo}</td>
                      <td style={{ padding:'9px 12px' }}>{fmtD(s.date)}</td>
                      <td style={{ padding:'9px 12px', fontWeight:600 }}>{s.issuedTo}</td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                          background:s.issueType==='CONTRACTOR'?'#FEF9E7':s.issueType==='ACTIVITY'?'#E8F5E9':'#EBF5FB',
                          color:s.issueType==='CONTRACTOR'?'#B8860B':s.issueType==='ACTIVITY'?'#1E8449':'#1A5276' }}>
                          {s.issueType}
                        </span>
                      </td>
                      <td style={{ padding:'9px 12px', fontSize:11, color:'#555' }}>{s.activityRef||s.contractorWONo||'—'}</td>
                      <td style={{ padding:'9px 12px', textAlign:'center', fontWeight:700, color:'#1A5276' }}>{its.length}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right', fontWeight:700, color:'#C0392B' }}>{fmtC(s.totalValue)}</td>
                      <td style={{ padding:'9px 12px', color:'#555' }}>{s.issuedBy}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PHYSICAL COUNT MODAL */}
      {showCount && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, width:700, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#6E2C00', marginBottom:4 }}>📋 Weekly Physical Stock Count</div>
            <div style={{ fontSize:12, color:'#888', marginBottom:16 }}>Enter actual physical quantity found at site. System will calculate variance and adjust stock.</div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Conducted By *</label>
              <input value={countBy} onChange={e=>setCountBy(e.target.value)} placeholder='Name of person conducting count'
                style={{ ...inp, width:300 }} />
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, marginBottom:16 }}>
              <thead>
                <tr style={{ background:'#FDF2E9' }}>
                  {['Material','Unit','System Balance','Physical Qty','Variance'].map(h=>(
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, fontWeight:700, color:'#6E2C00' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {countItems.map((item,idx)=>(
                  <tr key={idx} style={{ borderBottom:'1px solid #F5EDE0' }}>
                    <td style={{ padding:'7px 12px', fontWeight:600 }}>{item.matName}</td>
                    <td style={{ padding:'7px 12px', color:'#888' }}>{item.unit}</td>
                    <td style={{ padding:'7px 12px', textAlign:'right', fontWeight:700 }}>{item.sysBalance.toFixed(2)}</td>
                    <td style={{ padding:'7px 8px' }}>
                      <input type='number' value={item.physicalQty} onChange={e=>setCountQty(idx,e.target.value)}
                        placeholder='Enter actual'
                        style={{ width:100, padding:'6px 8px', border:'1.5px solid #6E2C00', borderRadius:5, fontSize:12, textAlign:'right', outline:'none' }} />
                    </td>
                    <td style={{ padding:'7px 12px', textAlign:'right', fontWeight:700,
                      color:item.physicalQty===''?'#ccc':item.variance>0?'#1E8449':item.variance<0?'#C0392B':'#888' }}>
                      {item.physicalQty===''?'—':(item.variance>=0?'+':'')+item.variance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={()=>setShowCount(false)} style={{ padding:'8px 18px', background:'#f0f0f0', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>Cancel</button>
              <button onClick={submitCount} disabled={posting}
                style={{ padding:'8px 22px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:700 }}>
                {posting?'⏳ Posting...':'✅ Post Count & Adjust Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
