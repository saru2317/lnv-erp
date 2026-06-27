import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const inp = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.5px' }

const WORK_TYPES = [
  { value:'LABOUR_CONTRACT', label:'Labour Contract',     desc:'You give materials. They give labour + machine.' },
  { value:'WORK_CONTRACT',   label:'Work Contract',       desc:'They bring everything. You pay per unit done.' },
  { value:'MATERIAL_PLUS_LABOUR', label:'Material + Labour', desc:'You give some material. They bring rest + labour.' },
  { value:'RMC',             label:'RMC Supply',          desc:'Ready Mix Concrete supply by truck.' },
]

const RATE_BASIS = [
  { value:'PER_CUM',   label:'Per CuM',    units:'CuM'   },
  { value:'PER_SQFT',  label:'Per Sq.Ft',  units:'SqFt'  },
  { value:'PER_DAY',   label:'Per Day',    units:'Day'   },
  { value:'PER_POINT', label:'Per Point',  units:'Point' },
  { value:'PER_UNIT',  label:'Per Unit',   units:'Nos'   },
  { value:'LUMPSUM',   label:'Lump Sum',   units:'LS'    },
]

const STATUS_CFG = {
  ACTIVE:    { bg:'#E8F5E9', color:'#1E8449', label:'Active' },
  COMPLETED: { bg:'#F0EBF0', color:'#714B67', label:'Completed' },
  ON_HOLD:   { bg:'#FEF9E7', color:'#B8860B', label:'On Hold' },
  CANCELLED: { bg:'#FDEDEC', color:'#C0392B', label:'Cancelled' },
}

export default function ContractorWO() {
  const nav = useNavigate()
  const [view,       setView]       = useState('list')
  const [projects,   setProjects]   = useState([])
  const [wos,        setWOs]        = useState([])
  const [selProject, setSelProject] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [selWO,      setSelWO]      = useState(null)
  const [editWO,     setEditWO]     = useState(null)
  const [editForm,   setEditForm]   = useState({})
  const [logModal,   setLogModal]   = useState(false)
  const [billModal,  setBillModal]  = useState(false)
  const [logForm,    setLogForm]    = useState({ date:'', workDone:'', labourCount:'', machineHrs:'', remarks:'' })
  const [billForm,   setBillForm]   = useState({ measuredQty:'', periodFrom:'', periodTo:'', otherDeduct:'0', materialCost:'0', remarks:'' })

  const [form, setForm] = useState({
    projectId:'', contractorName:'', contractorPhone:'', contractorGstin:'',
    workType:'LABOUR_CONTRACT', activity:'', scope:'',
    rateBasis:'PER_CUM', rate:'', unit:'CuM', estimatedQty:'',
    materialByOwner:true, machineByContractor:true,
    startDate:'', endDate:'', tdsRate:'1', remarks:''
  })

  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,{headers:hdr2()}).then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{})
  },[])

  const load = useCallback(async (pid)=>{
    if (!pid) return
    setLoading(true)
    const r = await fetch(`${BASE}/civil-ext/contractor-wo?projectId=${pid}`,{headers:hdr2()})
    const d = await r.json()
    setWOs(d.data||[])
    setLoading(false)
  },[])

  useEffect(()=>{ load(selProject) },[selProject,load])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const save = async () => {
    if (!form.projectId)        return toast.error('Select project')
    if (!form.contractorName.trim()) return toast.error('Contractor name required')
    if (!form.activity.trim())  return toast.error('Activity required')
    if (!form.rate)             return toast.error('Rate required')
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/civil-ext/contractor-wo`,{method:'POST',headers:hdr(),body:JSON.stringify(form)})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ Work Order ${d.data.woNo} created!`)
      setView('list'); load(form.projectId)
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const addLog = async () => {
    if (!logForm.workDone) return toast.error('Work done qty required')
    await fetch(`${BASE}/civil-ext/contractor-wo/${selWO.id}/log`,{method:'POST',headers:hdr(),body:JSON.stringify({...logForm,date:logForm.date||new Date()})})
    toast.success('✅ Daily log added')
    setLogModal(false); load(selProject)
  }

  const generateBill = async () => {
    const r = await fetch(`${BASE}/civil-ext/contractor-wo/${selWO.id}/bill`,{method:'POST',headers:hdr(),body:JSON.stringify(billForm)})
    const d = await r.json()
    if (d.error) return toast.error(d.error)
    toast.success(`✅ Bill ${d.data.billNo} generated!`)
    setBillModal(false); load(selProject)
  }

  const openEditWO = (wo) => {
    setEditWO(wo)
    setEditForm({
      contractorName: wo.contractorName||'', phone: wo.phone||'',
      activity: wo.activity||'', scope: wo.scope||'',
      unit: wo.unit||'', rate: wo.rate||'',
      estimatedQty: wo.estimatedQty||'', tdsRate: wo.tdsRate||1,
      startDate: wo.startDate?new Date(wo.startDate).toISOString().slice(0,10):'',
      endDate: wo.endDate?new Date(wo.endDate).toISOString().slice(0,10):'',
      remarks: wo.remarks||''
    })
  }
  const saveEditWO = async () => {
    if (!editForm.contractorName?.trim()) return toast.error('Contractor name required')
    try {
      const r = await fetch(`${BASE}/civil-ext/contractor-wo/${editWO.id}`,{
        method:'PATCH', headers:hdr(),
        body:JSON.stringify({...editForm, rate:parseFloat(editForm.rate||0), estimatedQty:parseFloat(editForm.estimatedQty||0)})
      })
      const d = await r.json()
      if(d.error) return toast.error(d.error)
      toast.success('✅ Work Order updated!')
      setEditWO(null); load(selProject)
    } catch { toast.error('Failed') }
  }
  const deleteWO = async (wo) => {
    if (!window.confirm(`Delete ${wo.woNo}? This cannot be undone.`)) return
    try {
      await fetch(`${BASE}/civil-ext/contractor-wo/${wo.id}`,{method:'DELETE',headers:hdr2()})
      toast.success('Work Order deleted'); load(selProject)
    } catch { toast.error('Failed') }
  }

  const estAmt = parseFloat(form.estimatedQty||0) * parseFloat(form.rate||0)

  return (
    <div style={{background:'#F8F5F8',minHeight:'100vh',fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {view!=='list' && <button onClick={()=>setView('list')} style={{padding:'6px 14px',background:'#fff',border:'1px solid #ddd',borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:600,color:'#555'}}>← Back</button>}
          <div>
            <div style={{fontSize:16,fontWeight:800,color:'#6E2C00'}}>🤝 Contractor Work Orders</div>
            <div style={{fontSize:11,color:'#888'}}>Labour contract | Work contract | RMC</div>
          </div>
        </div>
        {view==='list' && (
          <button onClick={()=>setView('new')}
            style={{padding:'7px 18px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:700}}>
            + New Work Order
          </button>
        )}
        {view==='new' && (
          <button onClick={save} disabled={saving}
            style={{padding:'7px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:700,opacity:saving?0.6:1}}>
            {saving?'⏳...':'💾 Create WO'}
          </button>
        )}
      </div>

      {/* NEW WO FORM */}
      {view==='new' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:14,alignItems:'start'}}>
          <div>
            {/* Contractor + Project */}
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,marginBottom:14,overflow:'hidden'}}>
              <div style={{background:'linear-gradient(135deg,#6E2C00,#8B3A00)',color:'#fff',padding:'9px 16px',fontSize:12,fontWeight:700}}>Contractor & Project</div>
              <div style={{padding:16}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:12}}>
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={lbl}>Project *</label>
                    <select value={form.projectId} onChange={e=>set('projectId',e.target.value)} style={inp}>
                      <option value=''>— Select Project —</option>
                      {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Contractor Name *</label>
                    <input defaultValue={form.contractorName} onBlur={e=>set('contractorName',e.target.value)} placeholder='e.g. Murugan Concrete Works' style={inp} /></div>
                  <div><label style={lbl}>Phone</label>
                    <input defaultValue={form.contractorPhone} onBlur={e=>set('contractorPhone',e.target.value)} placeholder='+91 99999 99999' style={inp} /></div>
                  <div><label style={lbl}>GSTIN</label>
                    <input defaultValue={form.contractorGstin} onBlur={e=>set('contractorGstin',e.target.value)} style={{...inp,textTransform:'uppercase',fontFamily:'monospace'}} /></div>
                </div>
              </div>
            </div>

            {/* Work Type */}
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,marginBottom:14,overflow:'hidden'}}>
              <div style={{background:'linear-gradient(135deg,#6E2C00,#8B3A00)',color:'#fff',padding:'9px 16px',fontSize:12,fontWeight:700}}>Work Type *</div>
              <div style={{padding:16}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                  {WORK_TYPES.map(wt=>(
                    <div key={wt.value} onClick={()=>set('workType',wt.value)}
                      style={{padding:'10px 14px',border:`2px solid ${form.workType===wt.value?'#6E2C00':'#ddd'}`,
                        borderRadius:7,cursor:'pointer',background:form.workType===wt.value?'#FDF2E9':'#fff'}}>
                      <div style={{fontSize:13,fontWeight:700,color:form.workType===wt.value?'#6E2C00':'#555'}}>{wt.label}</div>
                      <div style={{fontSize:11,color:'#888',marginTop:3}}>{wt.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12}}>
                    <input type='checkbox' checked={form.materialByOwner} onChange={e=>set('materialByOwner',e.target.checked)} />
                    <span>Material supplied by Owner (us)</span>
                  </label>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12}}>
                    <input type='checkbox' checked={form.machineByContractor} onChange={e=>set('machineByContractor',e.target.checked)} />
                    <span>Machine/Equipment by Contractor</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Scope & Rate */}
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
              <div style={{background:'linear-gradient(135deg,#1A5276,#21618C)',color:'#fff',padding:'9px 16px',fontSize:12,fontWeight:700}}>Work Scope & Rate</div>
              <div style={{padding:16}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
                  <div><label style={lbl}>Activity *</label>
                    <select value={form.activity} onChange={e=>set('activity',e.target.value)} style={inp}>
                      <option value=''>— Select —</option>
                      {['Foundation Concrete','Column Concrete','Slab Concrete','Masonry','Plastering','Flooring','Electrical','Plumbing','Painting','Shuttering','Steel Fixing','Carpentry'].map(a=><option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Rate Basis *</label>
                    <select value={form.rateBasis} onChange={e=>{ set('rateBasis',e.target.value); const rb=RATE_BASIS.find(r=>r.value===e.target.value); if(rb) set('unit',rb.units) }} style={inp}>
                      {RATE_BASIS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Rate (₹) per {form.unit} *</label>
                    <input type='number' defaultValue={form.rate} onBlur={e=>set('rate',e.target.value)} placeholder='0' style={inp} /></div>
                  <div><label style={lbl}>Estimated Quantity ({form.unit})</label>
                    <input type='number' defaultValue={form.estimatedQty} onBlur={e=>set('estimatedQty',e.target.value)} placeholder='0' style={inp} /></div>
                  <div><label style={lbl}>Start Date</label>
                    <input type='date' value={form.startDate} onChange={e=>set('startDate',e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>Expected End Date</label>
                    <input type='date' value={form.endDate} onChange={e=>set('endDate',e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>TDS Rate %</label>
                    <input type='number' defaultValue={form.tdsRate} onBlur={e=>set('tdsRate',e.target.value)} placeholder='1' style={inp} /></div>
                </div>
                <div><label style={lbl}>Scope of Work *</label>
                  <textarea defaultValue={form.scope} onBlur={e=>set('scope',e.target.value)} rows={3}
                    placeholder='Describe work scope, location, specification...'
                    style={{...inp,resize:'none'}} /></div>
              </div>
            </div>
          </div>

          {/* Right Summary */}
          <div>
            <div style={{background:'#fff',border:'1px solid #6E2C00',borderRadius:8,overflow:'hidden'}}>
              <div style={{background:'linear-gradient(135deg,#6E2C00,#8B3A00)',color:'#fff',padding:'9px 16px',fontSize:12,fontWeight:700}}>WO Summary</div>
              <div style={{padding:16}}>
                {[
                  ['Work Type',    WORK_TYPES.find(w=>w.value===form.workType)?.label||'—', '#6E2C00'],
                  ['Rate Basis',   RATE_BASIS.find(r=>r.value===form.rateBasis)?.label||'—', '#555'],
                  ['Rate',         form.rate?fmtC(form.rate)+' / '+form.unit:'—', '#1A5276'],
                  ['Est. Qty',     form.estimatedQty||'—', '#555'],
                  ['Est. Amount',  estAmt>0?fmtC(estAmt):'—', '#1E8449'],
                  ['TDS Rate',     form.tdsRate+'%', '#C0392B'],
                  ['Material By',  form.materialByOwner?'Owner (us)':'Contractor', '#555'],
                  ['Machine By',   form.machineByContractor?'Contractor':'Owner', '#555'],
                ].map(([l,v,c])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #F5EDE0'}}>
                    <div style={{fontSize:11,color:'#888'}}>{l}</div>
                    <div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WO LIST */}
      {view==='list' && (
        <>
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
            <select value={selProject} onChange={e=>setSelProject(e.target.value)}
              style={{width:400,padding:'8px 12px',border:'1.5px solid #E8D5C4',borderRadius:6,fontSize:13,background:'#FFFAF7',outline:'none'}}>
              <option value=''>— Select Project —</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
            </select>
          </div>
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
            {loading ? <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
            : wos.length===0 ? (
              <div style={{padding:60,textAlign:'center'}}>
                <div style={{fontSize:40,marginBottom:12}}>🤝</div>
                <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No contractor work orders yet</div>
                <button onClick={()=>setView('new')} style={{padding:'8px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>
                  + Create First WO
                </button>
              </div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:'#6E2C00',color:'#fff'}}>
                    {['WO No','Contractor','Work Type','Activity','Rate','Est. Amount','Material By','Start','Status','Actions'].map(h=>(
                      <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wos.map((wo,i)=>{
                    const sc  = STATUS_CFG[wo.status]||STATUS_CFG.ACTIVE
                    const wt  = WORK_TYPES.find(w=>w.value===wo.workType)
                    return (
                      <tr key={wo.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                        <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:10,color:'#6E2C00',fontWeight:700}}>{wo.woNo}</td>
                        <td style={{padding:'9px 12px',fontWeight:700}}>{wo.contractorName}</td>
                        <td style={{padding:'9px 12px',fontSize:11,color:'#555'}}>{wt?.label||wo.workType}</td>
                        <td style={{padding:'9px 12px'}}>{wo.activity}</td>
                        <td style={{padding:'9px 12px',fontWeight:700,color:'#1A5276'}}>{fmtC(wo.rate)}/{wo.unit}</td>
                        <td style={{padding:'9px 12px',fontWeight:700,color:'#1E8449'}}>{fmtC(wo.estimatedAmt)}</td>
                        <td style={{padding:'9px 12px',fontSize:11,color:wo.materialByOwner?'#D35400':'#555'}}>{wo.materialByOwner?'Owner':'Contractor'}</td>
                        <td style={{padding:'9px 12px',fontSize:11,color:'#888'}}>{fmtD(wo.startDate)}</td>
                        <td style={{padding:'9px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:sc.bg,color:sc.color}}>{sc.label}</span></td>
                        <td style={{padding:'9px 12px'}}>
                          <div style={{display:'flex',gap:4}}>
                            <button onClick={()=>{setSelWO(wo);setLogModal(true);setLogForm({date:new Date().toISOString().slice(0,10),workDone:'',labourCount:'',machineHrs:'',remarks:''})}}
                              style={{padding:'3px 8px',background:'#E8F5E9',color:'#1E8449',border:'none',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>Log</button>
                            <button onClick={()=>{setSelWO(wo);setBillModal(true);setBillForm({measuredQty:'',periodFrom:'',periodTo:'',otherDeduct:'0',materialCost:'0',remarks:''})}}
                              style={{padding:'3px 8px',background:'#EBF5FB',color:'#1A5276',border:'none',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>Bill</button>
                          </div>
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

      {/* Daily Log Modal */}
      {logModal && selWO && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>e.target===e.currentTarget&&setLogModal(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:440,boxShadow:'0 8px 32px rgba(0,0,0,.15)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'#6E2C00',marginBottom:4}}>📅 Daily Work Log</div>
            <div style={{fontSize:12,color:'#888',marginBottom:16}}>{selWO.woNo} — {selWO.contractorName}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div><label style={lbl}>Date</label>
                <input type='date' value={logForm.date} onChange={e=>setLogForm(f=>({...f,date:e.target.value}))} style={inp} /></div>
              <div><label style={lbl}>Work Done ({selWO.unit}) *</label>
                <input type='number' value={logForm.workDone} onChange={e=>setLogForm(f=>({...f,workDone:e.target.value}))} placeholder='0' style={inp} /></div>
              <div><label style={lbl}>Labour Count</label>
                <input type='number' value={logForm.labourCount} onChange={e=>setLogForm(f=>({...f,labourCount:e.target.value}))} placeholder='0' style={inp} /></div>
              <div><label style={lbl}>Machine Hours</label>
                <input type='number' value={logForm.machineHrs} onChange={e=>setLogForm(f=>({...f,machineHrs:e.target.value}))} placeholder='0' style={inp} /></div>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Remarks</label>
                <input value={logForm.remarks} onChange={e=>setLogForm(f=>({...f,remarks:e.target.value}))} placeholder='Any remarks' style={inp} /></div>
            </div>
            {logForm.workDone && <div style={{marginTop:12,background:'#E8F5E9',borderRadius:6,padding:10,fontSize:12,color:'#1E8449',fontWeight:700}}>
              Today: {logForm.workDone} {selWO.unit} × {fmtC(selWO.rate)} = {fmtC(parseFloat(logForm.workDone)*Number(selWO.rate))}
            </div>}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:16}}>
              <button onClick={()=>setLogModal(false)} style={{padding:'7px 16px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={addLog} style={{padding:'7px 20px',background:'#1E8449',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>✅ Add Log</button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {billModal && selWO && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>e.target===e.currentTarget&&setBillModal(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:480,boxShadow:'0 8px 32px rgba(0,0,0,.15)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'#6E2C00',marginBottom:4}}>💰 Generate Contractor Bill</div>
            <div style={{fontSize:12,color:'#888',marginBottom:16}}>{selWO.woNo} — {selWO.contractorName} · {fmtC(selWO.rate)}/{selWO.unit}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div><label style={lbl}>Period From</label>
                <input type='date' value={billForm.periodFrom} onChange={e=>setBillForm(f=>({...f,periodFrom:e.target.value}))} style={inp} /></div>
              <div><label style={lbl}>Period To</label>
                <input type='date' value={billForm.periodTo} onChange={e=>setBillForm(f=>({...f,periodTo:e.target.value}))} style={inp} /></div>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Measured Qty ({selWO.unit}) — leave blank to use daily logs total</label>
                <input type='number' value={billForm.measuredQty} onChange={e=>setBillForm(f=>({...f,measuredQty:e.target.value}))} placeholder='Auto from daily logs' style={inp} /></div>
              <div><label style={lbl}>Other Deductions (₹)</label>
                <input type='number' value={billForm.otherDeduct} onChange={e=>setBillForm(f=>({...f,otherDeduct:e.target.value}))} style={inp} /></div>
              <div><label style={lbl}>Material Cost (Owner) (₹)</label>
                <input type='number' value={billForm.materialCost} onChange={e=>setBillForm(f=>({...f,materialCost:e.target.value}))} style={inp} /></div>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Remarks / JMS Reference</label>
                <input value={billForm.remarks} onChange={e=>setBillForm(f=>({...f,remarks:e.target.value}))} placeholder='JMS no / remarks' style={inp} /></div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:16}}>
              <button onClick={()=>setBillModal(false)} style={{padding:'7px 16px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={generateBill} style={{padding:'7px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>💰 Generate Bill</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT WO MODAL */}
      {editWO && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setEditWO(null)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:560,
            maxHeight:'88vh',overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <div style={{fontSize:16,fontWeight:800,color:'#1A5276'}}>✏️ Edit Work Order</div>
              <div style={{fontSize:11,color:'#888'}}>{editWO.woNo}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                ['Contractor Name *','contractorName','text'],['Phone','phone','text'],
                ['Activity *','activity','text'],['Unit','unit','text'],
                ['Rate (₹)','rate','number'],['Estimated Qty','estimatedQty','number'],
                ['TDS Rate %','tdsRate','number'],['Start Date','startDate','date'],
                ['End Date','endDate','date'],
              ].map(([l,k,t])=>(
                <div key={k}>
                  <label style={{fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}}>{l}</label>
                  <input type={t} value={editForm[k]||''} onChange={e=>setEditForm(f=>({...f,[k]:e.target.value}))}
                    style={{padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}}/>
                </div>
              ))}
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}}>Scope / Description</label>
                <input value={editForm.scope||''} onChange={e=>setEditForm(f=>({...f,scope:e.target.value}))}
                  style={{padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
              <button onClick={()=>setEditWO(null)}
                style={{padding:'8px 18px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={saveEditWO}
                style={{padding:'8px 24px',background:'#1A5276',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                💾 Update WO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
