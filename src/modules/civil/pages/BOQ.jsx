import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const UNITS   = ['LS','SqM','SqFt','CuM','RMT','Nos','MT','Kg','Litre','Point','Month','KWP','Bag','Load','Acre','TR']
const emptyRow = () => ({ activity:'', description:'', unit:'SqM', quantity:'', rate:'', remarks:'', doneQty:0, donePct:0, doneAmt:0 })

export default function BOQ() {
  const nav = useNavigate()
  const [params]   = useSearchParams()
  const projectId  = params.get('projectId')
  const [projects, setProjects] = useState([])
  const [selProject,    setSelProject]    = useState(projectId||'')
  const [items,         setItems]         = useState([emptyRow()])
  const [saving,        setSaving]        = useState(false)
  const [totals,        setTotals]        = useState({ amount:0, doneAmt:0 })
  const [boqActivities, setBOQActivities] = useState([])
  const [editRow,       setEditRow]       = useState(null)
  const [viewMode,      setViewMode]      = useState('view') // 'view' | 'edit'

  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,   {headers:hdr2()}).then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{})
    fetch(`${BASE}/civil-ext/boq-master`,{headers:hdr2()}).then(r=>r.json()).then(d=>setBOQActivities(d.data||[])).catch(()=>{})
  },[])

  const loadBOQ = useCallback(async (pid) => {
    if (!pid) return
    const r = await fetch(`${BASE}/civil/boq/${pid}`,{headers:hdr2()})
    const d = await r.json()
    if (d.data?.length > 0) {
      setItems(d.data.map(b=>({
        id:b.id, activity:b.activity, description:b.description,
        unit:b.unit, quantity:b.quantity, rate:b.rate, remarks:b.remarks||'',
        doneQty:b.doneQty||0, donePct:b.donePct||0, doneAmt:b.doneAmt||0
      })))
      setTotals(d.totals||{amount:0,doneAmt:0})
      setViewMode('view') // switch to view mode when saved BOQ exists
    } else { setItems([emptyRow()]); setViewMode('edit') }
  },[])

  useEffect(()=>{ if(selProject) loadBOQ(selProject) },[selProject,loadBOQ])

  const setItem = (idx,k,v) => {
    setItems(prev => {
      const next = [...prev]
      next[idx] = {...next[idx],[k]:v}
      if (k==='quantity'||k==='rate') {
        const qty  = parseFloat(k==='quantity'?v:next[idx].quantity)||0
        const rate = parseFloat(k==='rate'?v:next[idx].rate)||0
        next[idx].amount = qty * rate
      }
      return next
    })
  }

  const addRow = () => setItems(p=>[...p, emptyRow()])

  const removeRow = idx => {
    if (items.length === 1) return
    setItems(p => p.filter((_,i)=>i!==idx))
  }

  const total       = items.reduce((s,i)=>s+(Number(i.quantity||0)*Number(i.rate||0)),0)
  const saveEditRow = async () => {
    if (!editRow?.activity?.trim()) return toast.error('Activity required')
    try {
      const r = await fetch(`${BASE}/civil/boq-item/${editRow.id}`,{
        method:'PATCH',headers:hdr(),
        body:JSON.stringify({
          activity:editRow.activity, description:editRow.description,
          unit:editRow.unit, quantity:parseFloat(editRow.quantity||0),
          rate:parseFloat(editRow.rate||0),
          amount:parseFloat(editRow.quantity||0)*parseFloat(editRow.rate||0)
        })
      })
      const d = await r.json()
      if(d.error) return toast.error(d.error)
      toast.success('✅ BOQ item updated!'); setEditRow(null); loadBOQ(selProject)
    } catch { toast.error('Failed') }
  }
  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.activity}"?`)) return
    try {
      await fetch(`${BASE}/civil/boq-item/${item.id}`,{method:'DELETE',headers:hdr2()})
      toast.success('Item deleted'); loadBOQ(selProject)
    } catch { toast.error('Failed') }
  }

  const filledRows  = items.filter(i=>i.activity&&i.activity.trim()).length
  const emptyRows   = items.length - filledRows

  const save = async () => {
    if (!selProject) return toast.error('Select a project first')
    // Only require activity to be filled — save all rows that have at least activity
    const valid   = items.filter(i => i.activity && i.activity.trim())
    const skipped = items.length - valid.length
    if (valid.length === 0) return toast.error('Add at least one BOQ item with Activity filled')
    if (skipped > 0) toast(`⚠️ ${skipped} empty row(s) skipped`, {icon:'⚠️'})
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/civil/boq/${selProject}`,{method:'POST',headers:hdr(),body:JSON.stringify({items:valid})})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ BOQ saved — ${valid.length} items · ${fmtC(total)}`)
      setViewMode('view'); loadBOQ(selProject)
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={{background:'#F9F6F8',minHeight:'100vh',fontFamily:'DM Sans,Arial,sans-serif'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <button onClick={()=>nav(-1)} style={{padding:'8px 14px',background:'#FDF2E9',border:'none',borderRadius:8,cursor:'pointer',color:'#6E2C00',fontWeight:700}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:800,color:'#6E2C00'}}>📐 Bill of Quantities (BOQ)</div>
          <div style={{fontSize:12,color:'#888'}}>Define all work items, quantities and rates</div>
        </div>
        <span style={{fontSize:11,color:'#888',marginRight:8}}>
          <strong style={{color:'#1E8449'}}>{filledRows}</strong> rows ready
          {emptyRows>0&&<span style={{color:'#C0392B'}}> · {emptyRows} empty</span>}
        </span>
        <button onClick={save} disabled={saving}
          style={{padding:'9px 24px',background:saving?'#aaa':'#1E8449',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>
          {saving?'Saving...':'💾 Save BOQ'}
        </button>
      </div>

      {/* Project Selector */}
      <div style={{background:'#fff',borderRadius:10,padding:'14px 18px',marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:6,textTransform:'uppercase'}}>Select Project</div>
        <select value={selProject} onChange={e=>setSelProject(e.target.value)}
          style={{width:'100%',padding:'9px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none'}}>
          <option value=''>— Select Project —</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName} ({p.clientName})</option>)}
        </select>
      </div>

      {/* BOQ Table */}
      {selProject && (
        <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 6px rgba(0,0,0,.07)',overflow:'hidden'}}>
          {/* Header with View/Edit toggle */}
          <div style={{background:'#6E2C00',padding:'12px 18px',display:'flex',gap:16,alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>📐 Bill of Quantities</div>
            {/* View / Edit toggle */}
            <div style={{display:'flex',background:'rgba(255,255,255,.15)',borderRadius:6,padding:2,marginLeft:'auto'}}>
              <button onClick={()=>setViewMode('view')}
                style={{padding:'4px 12px',border:'none',borderRadius:4,cursor:'pointer',
                  fontSize:11,fontWeight:700,fontFamily:'DM Sans,sans-serif',
                  background:viewMode==='view'?'#fff':'transparent',
                  color:viewMode==='view'?'#6E2C00':'rgba(255,255,255,.7)'}}>
                👁 View
              </button>
              <button onClick={()=>setViewMode('edit')}
                style={{padding:'4px 12px',border:'none',borderRadius:4,cursor:'pointer',
                  fontSize:11,fontWeight:700,fontFamily:'DM Sans,sans-serif',
                  background:viewMode==='edit'?'#fff':'transparent',
                  color:viewMode==='edit'?'#6E2C00':'rgba(255,255,255,.7)'}}>
                ✏️ Edit
              </button>
            </div>
            <div style={{display:'flex',gap:16}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'#FDEBD0'}}>Items</div>
                <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>{items.filter(i=>i.activity).length}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'#FDEBD0'}}>BOQ Value</div>
                <div style={{fontSize:15,fontWeight:700,color:'#FDEBD0'}}>{fmtC(total)}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'#FDEBD0'}}>Done</div>
                <div style={{fontSize:15,fontWeight:700,color:'#8EC5A0'}}>{fmtC(totals.doneAmt||0)}</div>
              </div>
            </div>
          </div>

          {/* ── VIEW MODE — Clean read-only table ── */}
          {viewMode==='view' && (
            <div style={{overflowX:'auto'}}>
              {items.filter(i=>i.activity).length===0?(
                <div style={{padding:40,textAlign:'center',color:'#aaa'}}>
                  <div style={{fontSize:36,marginBottom:8}}>📐</div>
                  <div style={{fontWeight:600,color:'#6E2C00',marginBottom:8}}>No BOQ items saved yet</div>
                  <button onClick={()=>setViewMode('edit')}
                    style={{padding:'8px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>
                    + Add BOQ Items
                  </button>
                </div>
              ):(
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background:'#FDF2E9'}}>
                      {['#','Activity','Description','Unit','Qty','Rate (₹)','BOQ Amount','Done Qty','Done %','Done Amt','Actions'].map(h=>(
                        <th key={h} style={{padding:'9px 12px',textAlign:['Rate (₹)','BOQ Amount','Done Amt'].includes(h)?'right':'left',
                          fontSize:10,fontWeight:700,color:'#6E2C00',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i=>i.activity).map((item,i)=>{
                      const amt=Number(item.quantity||0)*Number(item.rate||0)
                      const pct=Number(item.donePct||0)
                      return(
                        <tr key={item.id||i} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}
                          onMouseEnter={e=>e.currentTarget.style.background='#FEF9F5'}
                          onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDF9F7'}>
                          <td style={{padding:'9px 12px',color:'#aaa',fontSize:11}}>{i+1}</td>
                          <td style={{padding:'9px 12px',fontWeight:700,color:'#6E2C00'}}>{item.activity}</td>
                          <td style={{padding:'9px 12px',fontSize:11,color:'#555',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.description||'—'}</td>
                          <td style={{padding:'9px 12px',fontWeight:600}}>{item.unit}</td>
                          <td style={{padding:'9px 12px',textAlign:'right'}}>{Number(item.quantity||0).toFixed(2)}</td>
                          <td style={{padding:'9px 12px',textAlign:'right',color:'#555'}}>₹{Number(item.rate||0).toLocaleString('en-IN')}</td>
                          <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#1A5276'}}>₹{amt.toLocaleString('en-IN')}</td>
                          <td style={{padding:'9px 12px',textAlign:'right',color:'#555'}}>{Number(item.doneQty||0).toFixed(2)}</td>
                          <td style={{padding:'9px 12px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div style={{flex:1,height:5,background:'#F0E8EC',borderRadius:3,overflow:'hidden',minWidth:50}}>
                                <div style={{height:'100%',width:`${Math.min(pct,100)}%`,
                                  background:pct>=90?'#C0392B':pct>=50?'#B8860B':'#1E8449',borderRadius:3}}/>
                              </div>
                              <span style={{fontSize:10,fontWeight:700,
                                color:pct>=90?'#C0392B':pct>=50?'#B8860B':'#1E8449',minWidth:30}}>{pct}%</span>
                            </div>
                          </td>
                          <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#1E8449'}}>₹{Number(item.doneAmt||0).toLocaleString('en-IN')}</td>
                          <td style={{padding:'9px 12px'}}>
                            <div style={{display:'flex',gap:4}}>
                              <button onClick={()=>{setEditRow({...item});setViewMode('edit')}}
                                style={{padding:'3px 8px',background:'#FEF9E7',color:'#B8860B',border:'1px solid #F9E79F',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>✏️</button>
                              <button onClick={()=>deleteItem(item)}
                                style={{padding:'3px 8px',background:'#FDEDEC',color:'#C0392B',border:'1px solid #F1948A',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'#FDF2E9',fontWeight:700}}>
                      <td colSpan={6} style={{padding:'10px 12px',color:'#6E2C00',fontSize:13}}>TOTAL</td>
                      <td style={{padding:'10px 12px',textAlign:'right',color:'#1A5276',fontSize:14}}>{fmtC(total)}</td>
                      <td></td>
                      <td style={{padding:'10px 12px',textAlign:'right',color:'#1E8449',fontSize:12}}>
                        {total>0?Math.round((totals.doneAmt||0)/total*100):0}% complete
                      </td>
                      <td style={{padding:'10px 12px',textAlign:'right',color:'#1E8449',fontSize:14}}>{fmtC(totals.doneAmt||0)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}

          {/* ── EDIT MODE — existing entry grid ── */}
          {viewMode==='edit' && (

          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:900}}>
              <thead>
                <tr style={{background:'#FDF2E9'}}>
                  {['#','Activity','Description','Unit','Qty','Rate (₹)','Amount (₹)','Done %',''].map(h=>(
                    <th key={h} style={{padding:'9px 10px',textAlign:h==='Amount (₹)'||h==='Rate (₹)'?'right':'left',
                      fontSize:11,fontWeight:700,color:'#6E2C00',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item,idx)=>(
                  <tr key={idx} style={{background:idx%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                    <td style={{padding:'6px 10px',color:'#888',fontSize:11,fontWeight:700}}>{idx+1}</td>
                    <td style={{padding:'4px 6px'}}>
                      <select value={item.activity} onChange={e=>{
                          setItem(idx,'activity',e.target.value)
                          // Auto-set default unit from master
                          const act = boqActivities.find(a=>a.activityName===e.target.value)
                          if (act) setItem(idx,'unit',act.defaultUnit)
                        }}
                        style={{width:'100%',padding:'6px 8px',border:'1px solid #E8D5C4',borderRadius:5,fontSize:11,background:'#FFFAF7',outline:'none'}}>
                        <option value=''>Select activity...</option>
                        {Object.entries(boqActivities.reduce((acc,a)=>{
                          if(!acc[a.category]) acc[a.category]=[]
                          acc[a.category].push(a)
                          return acc
                        },{})).map(([cat,acts])=>(
                          <optgroup key={cat} label={cat}>
                            {acts.map(a=><option key={a.code} value={a.activityName}>{a.activityName}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </td>
                    <td style={{padding:'4px 6px'}}>
                      <input value={item.description} onChange={e=>setItem(idx,'description',e.target.value)}
                        placeholder='Work description' style={{width:'100%',padding:'6px 8px',border:'1px solid #E8D5C4',borderRadius:5,fontSize:11,outline:'none',boxSizing:'border-box'}} />
                    </td>
                    <td style={{padding:'4px 6px'}}>
                      <select value={item.unit} onChange={e=>setItem(idx,'unit',e.target.value)}
                        style={{width:'100%',padding:'6px 8px',border:'1px solid #E8D5C4',borderRadius:5,fontSize:11,background:'#FFFAF7',outline:'none'}}>
                        {(boqActivities.find(a=>a.activityName===item.activity)?.unitOptions?.split(',') || UNITS).map(u=><option key={u}>{u.trim()}</option>)}
                      </select>
                    </td>
                    <td style={{padding:'4px 6px'}}>
                      <input type='number' value={item.quantity} onChange={e=>setItem(idx,'quantity',e.target.value)}
                        placeholder='0' style={{width:80,padding:'6px 8px',border:'1px solid #E8D5C4',borderRadius:5,fontSize:11,outline:'none',textAlign:'right'}} />
                    </td>
                    <td style={{padding:'4px 6px'}}>
                      <input type='number' value={item.rate} onChange={e=>setItem(idx,'rate',e.target.value)}
                        placeholder='0' style={{width:90,padding:'6px 8px',border:'1px solid #E8D5C4',borderRadius:5,fontSize:11,outline:'none',textAlign:'right'}} />
                    </td>
                    <td style={{padding:'6px 10px',textAlign:'right',fontWeight:700,color:'#1E8449'}}>
                      {fmtC(Number(item.quantity||0)*Number(item.rate||0))}
                    </td>
                    <td style={{padding:'6px 10px',textAlign:'center'}}>
                      {item.donePct > 0 ? (
                        <span style={{padding:'2px 8px',background:'#E8F5E9',color:'#1E8449',borderRadius:10,fontSize:11,fontWeight:700}}>
                          {Number(item.donePct||0).toFixed(0)}%
                        </span>
                      ) : <span style={{color:'#ccc',fontSize:11}}>—</span>}
                    </td>
                    <td style={{padding:'4px 8px'}}>
                      <button onClick={()=>removeRow(idx)}
                        style={{padding:'4px 8px',background:'#FDEDEC',color:'#C0392B',border:'none',borderRadius:5,cursor:'pointer',fontSize:12}}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={9} style={{padding:'10px 12px'}}>
                    <button onClick={addRow}
                      style={{padding:'7px 18px',background:'#FDF2E9',color:'#6E2C00',border:'1.5px dashed #6E2C00',
                        borderRadius:7,cursor:'pointer',fontWeight:700,fontSize:12}}>
                      + Add Row
                    </button>
                  </td>
                </tr>
                <tr style={{background:'#FDF2E9',fontWeight:800}}>
                  <td colSpan={6} style={{padding:'12px 18px',color:'#6E2C00',fontSize:14}}>TOTAL BOQ VALUE</td>
                  <td style={{padding:'12px 18px',textAlign:'right',color:'#6E2C00',fontSize:16}}>{fmtC(total)}</td>
                  <td colSpan={2}/>
                </tr>
              </tfoot>
            </table>
          </div>
          )} {/* end edit mode */}
        </div>
      )}

      {/* EDIT BOQ ITEM MODAL */}
      {editRow && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setEditRow(null)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:480,
            boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'#1A5276',marginBottom:18}}>✏️ Edit BOQ Item</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}}>Activity *</label>
                <input value={editRow.activity||''} onChange={e=>setEditRow(r=>({...r,activity:e.target.value}))}
                  style={{padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}}>Description</label>
                <input value={editRow.description||''} onChange={e=>setEditRow(r=>({...r,description:e.target.value}))}
                  style={{padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}}/>
              </div>
              {[['Unit','unit'],['Quantity','quantity'],['Rate (₹)','rate']].map(([l,k])=>(
                <div key={k}>
                  <label style={{fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}}>{l}</label>
                  <input type={k==='unit'?'text':'number'} value={editRow[k]||''}
                    onChange={e=>setEditRow(r=>({...r,[k]:e.target.value}))}
                    style={{padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}}/>
                </div>
              ))}
              <div style={{padding:'8px 12px',background:'#E8F5E9',borderRadius:6,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                <div style={{fontSize:10,color:'#888'}}>Amount</div>
                <div style={{fontSize:16,fontWeight:800,color:'#1E8449'}}>
                  ₹{(parseFloat(editRow.quantity||0)*parseFloat(editRow.rate||0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
              <button onClick={()=>setEditRow(null)}
                style={{padding:'8px 18px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={saveEditRow}
                style={{padding:'8px 24px',background:'#1A5276',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                💾 Update Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
