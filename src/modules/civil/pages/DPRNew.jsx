import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const today = () => new Date().toISOString().slice(0,10)

const WEATHER = ['Clear','Partly Cloudy','Overcast','Light Rain','Heavy Rain','Hot','Windy']

export default function DPRNew() {
  const nav = useNavigate()
  const [projects,  setProjects]  = useState([])
  const [selProject,setSelProject]= useState('')
  const [boqItems,  setBOQItems]  = useState([])
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({
    date: today(), supervisor:'', weather:'Clear', issues:'', remarks:''
  })
  const [activities, setActivities] = useState([])
  const [labourRows, setLabourRows] = useState([
    { trade:'Mason',       type:'Skilled',    count:'', rate:700 },
    { trade:'Carpenter',   type:'Skilled',    count:'', rate:700 },
    { trade:'Plumber',     type:'Skilled',    count:'', rate:700 },
    { trade:'Electrician', type:'Skilled',    count:'', rate:700 },
    { trade:'Unskilled',   type:'Unskilled',  count:'', rate:450 },
    { trade:'Contractor',  type:'Contractor', count:'', rate:0, contractorName:'' },
  ])

  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,{headers:hdr2()}).then(r=>r.json())
      .then(d=>setProjects(d.data||[])).catch(()=>{})
  },[])

  const selectProject = async (pid) => {
    setSelProject(pid)
    if (!pid) { setBOQItems([]); setActivities([]); return }
    const r = await fetch(`${BASE}/civil/boq/${pid}`,{headers:hdr2()})
    const d = await r.json()
    const boq = d.data||[]
    setBOQItems(boq)
    setActivities(boq.map(b=>({
      boqId:     b.id,
      activity:  b.activity,
      description:b.description,
      unit:      b.unit,
      totalQty:  Number(b.quantity),
      prevPct:   Number(b.donePct||0),
      todayQty:  '',
      cumulativePct: Number(b.donePct||0),
      remarks:   ''
    })))
  }

  const setAct = (idx,k,v) => {
    setActivities(prev => {
      const next = [...prev]
      next[idx] = {...next[idx],[k]:v}
      if (k==='todayQty' && next[idx].totalQty > 0) {
        const todayAdded = parseFloat(v)||0
        const prevDone   = next[idx].prevPct * next[idx].totalQty / 100
        const cumDone    = prevDone + todayAdded
        next[idx].cumulativePct = Math.min(100, Math.round(cumDone / next[idx].totalQty * 100))
      }
      if (k==='cumulativePct') {
        next[idx].cumulativePct = Math.min(100, parseFloat(v)||0)
      }
      return next
    })
  }

  const setLabour = (idx,k,v) => {
    setLabourRows(prev => {
      const next = [...prev]
      next[idx] = {...next[idx],[k]:v}
      return next
    })
  }

  const totalWorkers = labourRows.reduce((s,l)=>s+parseInt(l.count||0),0)

  const save = async () => {
    if (!selProject)        return toast.error('Select a project')
    if (!form.supervisor.trim()) return toast.error('Supervisor name required')
    setSaving(true)
    try {
      // Save DPR
      const dprPayload = {
        projectId:  selProject,
        date:       form.date,
        supervisor: form.supervisor,
        weather:    form.weather,
        activities: activities.filter(a=>a.todayQty||a.cumulativePct>a.prevPct),
        issues:     form.issues||null,
        remarks:    form.remarks||null,
      }
      const r = await fetch(`${BASE}/civil/dpr`,{method:'POST',headers:hdr(),body:JSON.stringify(dprPayload)})
      const d = await r.json()
      if (d.error) return toast.error(d.error)

      // Save Labour
      const labEntries = labourRows.filter(l=>parseInt(l.count||0)>0).map(l=>({
        type:           l.type,
        trade:          l.trade,
        count:          parseInt(l.count),
        rate:           parseFloat(l.rate)||0,
        amount:         parseInt(l.count||0) * parseFloat(l.rate||0),
        isContractor:   l.type==='Contractor',
        contractorName: l.contractorName||null,
      }))
      if (labEntries.length > 0) {
        await fetch(`${BASE}/civil/labour`,{method:'POST',headers:hdr(),
          body:JSON.stringify({ projectId:selProject, dprId:d.data.id,
            date:form.date, entries:labEntries })})
      }

      toast.success(`✅ DPR ${d.data.dprNo} submitted! ${totalWorkers} workers logged.`)
      nav(`/civil/projects/${selProject}`)
    } catch { toast.error('Failed to save DPR') }
    finally { setSaving(false) }
  }

  return (
    <div style={{background:'#F9F6F8',minHeight:'100vh',fontFamily:'DM Sans,Arial,sans-serif'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <button onClick={()=>nav(-1)} style={{padding:'8px 14px',background:'#FDF2E9',border:'none',borderRadius:8,cursor:'pointer',color:'#6E2C00',fontWeight:700}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:800,color:'#6E2C00'}}>📅 New Daily Progress Report</div>
          <div style={{fontSize:12,color:'#888'}}>Today's site progress — supervisor entry</div>
        </div>
        <button onClick={save} disabled={saving}
          style={{padding:'9px 24px',background:saving?'#aaa':'#6E2C00',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>
          {saving?'⏳ Saving...':'✅ Submit DPR'}
        </button>
      </div>

      {/* Header Info */}
      <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:14}}>
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:5,textTransform:'uppercase'}}>Project *</div>
            <select value={selProject} onChange={e=>selectProject(e.target.value)}
              style={{width:'100%',padding:'10px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none'}}>
              <option value=''>— Select Project —</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
            </select>
          </div>
          {[
            ['Date *',      <input type='date' value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
              style={{width:'100%',padding:'10px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none',boxSizing:'border-box'}} />],
            ['Supervisor *', <input defaultValue={form.supervisor} onBlur={e=>setForm(f=>({...f,supervisor:e.target.value}))}
              placeholder='Site supervisor name'
              style={{width:'100%',padding:'10px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none',boxSizing:'border-box'}} />],
            ['Weather',     <select value={form.weather} onChange={e=>setForm(f=>({...f,weather:e.target.value}))}
              style={{width:'100%',padding:'10px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none'}}>
              {WEATHER.map(w=><option key={w}>{w}</option>)}
            </select>],
          ].map(([label,input])=>(
            <div key={label}>
              <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:5,textTransform:'uppercase'}}>{label}</div>
              {input}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Progress */}
      {selProject && activities.length > 0 && (
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{fontSize:15,fontWeight:700,color:'#6E2C00',marginBottom:14}}>📊 Activity-wise Progress</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:700}}>
              <thead>
                <tr style={{background:'#FDF2E9'}}>
                  {['Activity','Description','Unit','Total Qty','Prev %','Today Qty','Cumulative %','Remarks'].map(h=>(
                    <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map((a,idx)=>(
                  <tr key={idx} style={{background:idx%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                    <td style={{padding:'8px 10px',fontWeight:700,color:'#6E2C00'}}>{a.activity}</td>
                    <td style={{padding:'8px 10px',fontSize:12,color:'#555'}}>{a.description}</td>
                    <td style={{padding:'8px 10px',color:'#888'}}>{a.unit}</td>
                    <td style={{padding:'8px 10px',textAlign:'right'}}>{a.totalQty}</td>
                    <td style={{padding:'8px 10px',textAlign:'center'}}>
                      <span style={{padding:'2px 8px',background:'#EBF5FB',color:'#1A5276',borderRadius:10,fontSize:11,fontWeight:700}}>{a.prevPct}%</span>
                    </td>
                    <td style={{padding:'4px 6px'}}>
                      <input type='number' defaultValue={a.todayQty} onBlur={e=>setAct(idx,'todayQty',e.target.value)}
                        onFocus={e=>e.target.select()}
                        placeholder='0' min='0'
                        style={{width:70,padding:'6px 8px',border:'1.5px solid #6E2C00',borderRadius:5,fontSize:13,textAlign:'right',outline:'none',fontWeight:700}} />
                    </td>
                    <td style={{padding:'4px 6px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <input type='number' value={a.cumulativePct} onChange={e=>setAct(idx,'cumulativePct',e.target.value)}
                          min='0' max='100'
                          style={{width:60,padding:'6px 8px',border:'1.5px solid #1E8449',borderRadius:5,fontSize:12,textAlign:'right',outline:'none',fontWeight:700,color:'#1E8449'}} />
                        <span style={{fontSize:12,color:'#1E8449',fontWeight:700}}>%</span>
                      </div>
                    </td>
                    <td style={{padding:'4px 6px'}}>
                      <input value={a.remarks} onChange={e=>setAct(idx,'remarks',e.target.value)}
                        placeholder='Remarks'
                        style={{width:'100%',padding:'6px 8px',border:'1px solid #E8D5C4',borderRadius:5,fontSize:11,outline:'none'}} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Labour Attendance */}
      {selProject && (
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:700,color:'#6E2C00'}}>👷 Labour Attendance</div>
            <div style={{fontSize:13,fontWeight:700,color:'#1E8449'}}>Total: {totalWorkers} workers</div>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#FDF2E9'}}>
                  {['Trade','Type','Count','Daily Rate (₹)','Amount',''].map(h=>(
                    <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labourRows.map((l,idx)=>(
                  <tr key={`${idx}-${l.trade}`} style={{background:idx%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                    <td style={{padding:'8px 10px',fontWeight:700}}>{l.trade}</td>
                    <td style={{padding:'8px 10px',color:'#555',fontSize:12}}>{l.type}</td>
                    <td style={{padding:'4px 6px'}}>
                      <input type='number' defaultValue={l.count} onBlur={e=>setLabour(idx,'count',e.target.value)}
                        onFocus={e=>e.target.select()}
                        placeholder='0' min='0'
                        style={{width:70,padding:'7px 10px',border:'1.5px solid #6E2C00',borderRadius:6,fontSize:16,textAlign:'center',outline:'none',fontWeight:700}} />
                    </td>
                    <td style={{padding:'4px 6px'}}>
                      <input type='number' defaultValue={l.rate} onBlur={e=>setLabour(idx,'rate',e.target.value)}
                        onFocus={e=>e.target.select()}
                        style={{width:90,padding:'7px 10px',border:'1px solid #E8D5C4',borderRadius:6,fontSize:13,textAlign:'right',outline:'none'}} />
                    </td>
                    <td style={{padding:'8px 10px',fontWeight:700,color:'#1E8449',fontSize:14}}>
                      {parseInt(l.count||0) > 0
                        ? '₹' + (parseInt(l.count||0)*parseFloat(l.rate||0)).toLocaleString('en-IN')
                        : <span style={{color:'#ccc'}}>₹0</span>}
                    </td>
                    <td style={{padding:'4px 6px'}}>
                      {l.type==='Contractor' && (
                        <input defaultValue={l.contractorName||''} onBlur={e=>setLabour(idx,'contractorName',e.target.value)}
                          placeholder='Contractor name'
                          style={{width:140,padding:'6px 8px',border:'1px solid #E8D5C4',borderRadius:5,fontSize:11,outline:'none'}} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:'#FDF2E9',fontWeight:700}}>
                  <td colSpan={2} style={{padding:'10px 10px',color:'#6E2C00'}}>TOTAL</td>
                  <td style={{padding:'10px 10px',color:'#6E2C00',fontWeight:800,fontSize:18}}>{totalWorkers}</td>
                  <td/>
                  <td style={{padding:'10px 10px',color:'#1E8449',fontWeight:800,fontSize:15}}>
                    ₹{labourRows.reduce((s,l)=>s+parseInt(l.count||0)*parseFloat(l.rate||0),0).toLocaleString('en-IN')}
                  </td>
                  <td style={{padding:'10px 10px'}}>
                    <div style={{fontSize:10,color:'#888',fontStyle:'italic'}}>
                      Click outside count box to update total
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Issues & Remarks */}
      {selProject && (
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'#C0392B',marginBottom:6,textTransform:'uppercase'}}>⚠️ Issues / Problems Today</div>
              <textarea value={form.issues} onChange={e=>setForm(f=>({...f,issues:e.target.value}))}
                rows={3} placeholder='Any issues, delays, problems...'
                style={{width:'100%',padding:'10px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,resize:'none',outline:'none',boxSizing:'border-box'}} />
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:6,textTransform:'uppercase'}}>📝 General Remarks</div>
              <textarea value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))}
                rows={3} placeholder='General remarks, instructions...'
                style={{width:'100%',padding:'10px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,resize:'none',outline:'none',boxSizing:'border-box'}} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
