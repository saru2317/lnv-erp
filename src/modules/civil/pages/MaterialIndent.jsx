import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'
const today = () => new Date().toISOString().slice(0,10)

const STATUS_CFG = {
  PENDING:   { bg:'#FEF9E7', color:'#B8860B', label:'Pending' },
  APPROVED:  { bg:'#E8F5E9', color:'#1E8449', label:'Approved' },
  PO_RAISED: { bg:'#EBF5FB', color:'#1A5276', label:'PO Raised' },
  DELIVERED: { bg:'#F0EBF0', color:'#714B67', label:'Delivered' },
  CANCELLED: { bg:'#FDEDEC', color:'#C0392B', label:'Cancelled' },
}

const COMMON_MATERIALS = ['Cement (OPC 53 Grade)','Sand (River)','Sand (M-Sand)','Aggregate 20mm',
  'Aggregate 40mm','TMT Steel Fe 500D','TMT Steel Fe 415','Bricks (9 inch)',
  'Hollow Blocks 6 inch','Binding Wire','Tiles (Vitrified)','GI Pipe 1 inch',
  'CPVC Pipe 1 inch','PVC Conduit 25mm','Electrical Wire 2.5 Sqmm','Water Proofing Compound']

const emptyItem = () => ({ itemName:'', specification:'', unit:'Bag', qty:'', requiredDate:'', remarks:'' })
const UNITS = ['Bag','MT','Kg','CuM','SqM','RMT','Nos','Litre','Load','Set']

export default function MaterialIndent() {
  const nav = useNavigate()
  const [view,       setView]       = useState('list') // list | new
  const [projects,   setProjects]   = useState([])
  const [indents,    setIndents]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [selProject, setSelProject] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [form,       setForm]       = useState({ projectId:'', raisedBy:'', urgency:'NORMAL' })
  const [items,      setItems]      = useState([emptyItem()])

  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,{headers:hdr2()}).then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{})
    loadIndents()
  },[])

  const loadIndents = async (pid='') => {
    setLoading(true)
    const params = new URLSearchParams()
    if (pid) params.set('projectId', pid)
    const r = await fetch(`${BASE}/civil/indent?${params}`,{headers:hdr2()})
    const d = await r.json()
    setIndents(d.data||[])
    setLoading(false)
  }

  const setItem = (idx,k,v) => setItems(prev=>{ const n=[...prev]; n[idx]={...n[idx],[k]:v}; return n })
  const addItem = () => setItems(p=>[...p, emptyItem()])
  const removeItem = idx => { if(items.length>1) setItems(p=>p.filter((_,i)=>i!==idx)) }

  const save = async () => {
    if (!form.projectId) return toast.error('Select project')
    if (!form.raisedBy.trim()) return toast.error('Raised by required')
    const valid = items.filter(i=>i.itemName && i.qty)
    if (valid.length===0) return toast.error('Add at least one item')
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/civil/indent`,{method:'POST',headers:hdr(),
        body:JSON.stringify({ ...form, items:valid })})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ Indent ${d.data.indentNo} raised!`)
      setView('list'); loadIndents()
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const approve = async (id) => {
    await fetch(`${BASE}/civil/indent/${id}`,{method:'PATCH',headers:hdr(),body:JSON.stringify({status:'APPROVED',approvedBy:'Admin'})})
    toast.success('Indent approved'); loadIndents()
  }

  const inp = {width:'100%',padding:'8px 10px',border:'1.5px solid #E8D5C4',borderRadius:7,fontSize:12,background:'#FFFAF7',outline:'none',boxSizing:'border-box'}

  return (
    <div style={{background:'#F9F6F8',minHeight:'100vh',fontFamily:'DM Sans,Arial,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:'#6E2C00'}}>📦 Material Indent</div>
          <div style={{fontSize:12,color:'#888'}}>Site material requests to office</div>
        </div>
        {view==='list' ? (
          <button onClick={()=>setView('new')}
            style={{padding:'9px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>
            + New Indent
          </button>
        ) : (
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setView('list')} style={{padding:'9px 16px',background:'#FDF2E9',color:'#6E2C00',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>← Cancel</button>
            <button onClick={save} disabled={saving} style={{padding:'9px 20px',background:'#1E8449',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>
              {saving?'Saving...':'✅ Submit Indent'}
            </button>
          </div>
        )}
      </div>

      {/* NEW INDENT FORM */}
      {view==='new' && (
        <div>
          <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
              <div style={{gridColumn:'1/-1'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:5,textTransform:'uppercase'}}>Project *</div>
                <select value={form.projectId} onChange={e=>setForm(f=>({...f,projectId:e.target.value}))}
                  style={{...inp,fontSize:13}}>
                  <option value=''>— Select Project —</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:5,textTransform:'uppercase'}}>Raised By *</div>
                <input defaultValue={form.raisedBy} onBlur={e=>setForm(f=>({...f,raisedBy:e.target.value}))}
                  placeholder='Site supervisor name' style={{...inp,fontSize:13}} />
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'#C0392B',marginBottom:5,textTransform:'uppercase'}}>Urgency</div>
                <select value={form.urgency} onChange={e=>setForm(f=>({...f,urgency:e.target.value}))} style={{...inp,fontSize:13}}>
                  <option value='NORMAL'>Normal</option>
                  <option value='URGENT'>🔴 Urgent</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',overflow:'hidden'}}>
            <div style={{padding:'12px 18px',background:'#6E2C00',color:'#fff',fontWeight:700,fontSize:15}}>Material Requirements</div>
            <div style={{padding:16}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:'#FDF2E9'}}>
                    {['#','Material Name','Specification / Brand','Unit','Quantity','Required By','Remarks',''].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item,idx)=>(
                    <tr key={idx} style={{borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'6px 8px',color:'#888',fontWeight:700}}>{idx+1}</td>
                      <td style={{padding:'4px 6px',minWidth:180}}>
                        <input value={item.itemName} onChange={e=>setItem(idx,'itemName',e.target.value)}
                          list='materials-list' placeholder='Material name' style={inp} />
                        <datalist id='materials-list'>
                          {COMMON_MATERIALS.map(m=><option key={m} value={m}/>)}
                        </datalist>
                      </td>
                      <td style={{padding:'4px 6px',minWidth:140}}>
                        <input value={item.specification} onChange={e=>setItem(idx,'specification',e.target.value)}
                          placeholder='Brand / Grade / Size' style={inp} />
                      </td>
                      <td style={{padding:'4px 6px'}}>
                        <select value={item.unit} onChange={e=>setItem(idx,'unit',e.target.value)} style={{...inp,width:80}}>
                          {UNITS.map(u=><option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td style={{padding:'4px 6px'}}>
                        <input type='number' value={item.qty} onChange={e=>setItem(idx,'qty',e.target.value)}
                          placeholder='0' style={{...inp,width:70,textAlign:'right'}} />
                      </td>
                      <td style={{padding:'4px 6px'}}>
                        <input type='date' value={item.requiredDate} onChange={e=>setItem(idx,'requiredDate',e.target.value)}
                          style={{...inp,width:130}} />
                      </td>
                      <td style={{padding:'4px 6px',minWidth:120}}>
                        <input value={item.remarks} onChange={e=>setItem(idx,'remarks',e.target.value)}
                          placeholder='Remarks' style={inp} />
                      </td>
                      <td style={{padding:'4px 6px'}}>
                        <button onClick={()=>removeItem(idx)}
                          style={{padding:'4px 8px',background:'#FDEDEC',color:'#C0392B',border:'none',borderRadius:5,cursor:'pointer'}}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addItem}
                style={{margin:'12px 0',padding:'7px 18px',background:'#FDF2E9',color:'#6E2C00',
                  border:'1.5px dashed #6E2C00',borderRadius:7,cursor:'pointer',fontWeight:700,fontSize:12}}>
                + Add Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INDENT LIST */}
      {view==='list' && (
        <>
          <div style={{background:'#fff',borderRadius:10,padding:'12px 16px',marginBottom:16,
            boxShadow:'0 1px 4px rgba(0,0,0,.06)',display:'flex',gap:12}}>
            <select value={selProject} onChange={e=>{ setSelProject(e.target.value); loadIndents(e.target.value) }}
              style={{width:360,padding:'9px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none'}}>
              <option value=''>— All Projects —</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
            </select>
          </div>

          <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 6px rgba(0,0,0,.07)',overflow:'hidden'}}>
            {loading ? (
              <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
            ) : indents.length===0 ? (
              <div style={{padding:60,textAlign:'center'}}>
                <div style={{fontSize:48,marginBottom:12}}>📦</div>
                <div style={{fontSize:16,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No indents raised yet</div>
                <button onClick={()=>setView('new')} style={{padding:'9px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>
                  + Raise First Indent
                </button>
              </div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{background:'#6E2C00',color:'#fff'}}>
                    {['Indent No','Project','Date','Raised By','Urgency','Items','Status','Action'].map(h=>(
                      <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {indents.map((ind,i)=>{
                    const sc  = STATUS_CFG[ind.status]||STATUS_CFG.PENDING
                    const its = (() => { try { return JSON.parse(ind.items||'[]') } catch { return [] } })()
                    return (
                      <tr key={ind.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                        <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:11,color:'#6E2C00',fontWeight:700}}>{ind.indentNo}</td>
                        <td style={{padding:'9px 12px',fontWeight:600,fontSize:12}}>{ind.project?.projectCode||'—'}</td>
                        <td style={{padding:'9px 12px',fontSize:12}}>{fmtD(ind.createdAt)}</td>
                        <td style={{padding:'9px 12px'}}>{ind.raisedBy}</td>
                        <td style={{padding:'9px 12px'}}>
                          {ind.urgency==='URGENT' ? (
                            <span style={{padding:'2px 8px',background:'#FDEDEC',color:'#C0392B',borderRadius:10,fontSize:11,fontWeight:700}}>🔴 URGENT</span>
                          ) : <span style={{fontSize:12,color:'#888'}}>Normal</span>}
                        </td>
                        <td style={{padding:'9px 12px',textAlign:'center',fontWeight:700,color:'#1A5276'}}>{its.length}</td>
                        <td style={{padding:'9px 12px'}}>
                          <span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:sc.bg,color:sc.color}}>{sc.label}</span>
                        </td>
                        <td style={{padding:'9px 12px'}}>
                          {ind.status==='PENDING' && (
                            <button onClick={()=>approve(ind.id)}
                              style={{padding:'4px 10px',background:'#E8F5E9',color:'#1E8449',border:'none',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
