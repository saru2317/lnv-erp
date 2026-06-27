import React,{useState,useEffect,useCallback}from 'react'
import {useNavigate}from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'
const toISO=d=>d?new Date(d).toISOString().slice(0,10):''
const inp={padding:'7px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}
const lbl={fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}

const STATUS_CFG={
  ACTIVE:   {bg:'#E8F5E9',color:'#1E8449',label:'Active'},
  PLANNING: {bg:'#EBF5FB',color:'#1A5276',label:'Planning'},
  ON_HOLD:  {bg:'#FEF9E7',color:'#B8860B',label:'On Hold'},
  COMPLETED:{bg:'#F0EBF0',color:'#714B67',label:'Completed'},
  CANCELLED:{bg:'#FDEDEC',color:'#C0392B',label:'Cancelled'},
}

const PROJECT_TYPES=['Building Construction','Road Work','Interior','Renovation',
  'Industrial','Infrastructure','Residential Villa','Commercial Complex','Apartment']

const EMPTY_FORM={
  projectName:'',clientName:'',clientPhone:'',clientGstin:'',
  siteLocation:'',siteAddress:'',city:'',state:'',
  projectType:'Building Construction',contractValue:'',
  startDate:'',targetDate:'',pm:'',supervisor:'',supervisorPhone:'',
  retentionPct:'10',notes:''
}

export default function ProjectList(){
  const nav=useNavigate()
  const [projects,setProjects]=useState([])
  const [loading, setLoading] =useState(true)
  const [search,  setSearch]  =useState('')
  const [filter,  setFilter]  =useState('')
  // Edit modal
  const [showEdit,  setShowEdit]  =useState(false)
  const [editProj,  setEditProj]  =useState(null)
  const [saving,    setSaving]    =useState(false)
  const [form,      setForm]      =useState(EMPTY_FORM)
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  // Confirm modals
  const [confirmAction,setConfirmAction]=useState(null) // {project, action:'DELETE'|'HOLD'|'CANCEL'|'ACTIVATE'}
  const [blockInfo,    setBlockInfo]    =useState(null) // when delete blocked show counts

  const load=useCallback(async()=>{
    setLoading(true)
    try{
      const params=new URLSearchParams()
      if(filter)params.set('status',filter)
      if(search)params.set('search',search)
      const r=await fetch(`${BASE}/civil/projects?${params}`,{headers:hdr2()})
      const d=await r.json()
      setProjects(d.data||[])
    }catch{}finally{setLoading(false)}
  },[filter,search])
  useEffect(()=>{load()},[load])

  const totalContract=projects.reduce((s,p)=>s+Number(p.contractValue||0),0)

  // Open Edit
  const openEdit=(p)=>{
    setEditProj(p)
    setForm({
      projectName:p.projectName||'',clientName:p.clientName||'',
      clientPhone:p.clientPhone||'',clientGstin:p.clientGstin||'',
      siteLocation:p.siteLocation||'',siteAddress:p.siteAddress||'',
      city:p.city||'',state:p.state||'Tamil Nadu',
      projectType:p.projectType||'Building Construction',
      contractValue:p.contractValue?String(p.contractValue):'',
      startDate:toISO(p.startDate),targetDate:toISO(p.targetDate),
      pm:p.pm||'',supervisor:p.supervisor||'',supervisorPhone:p.supervisorPhone||'',
      retentionPct:p.retentionPct?String(p.retentionPct):'10',notes:p.notes||''
    })
    setShowEdit(true)
  }

  const saveEdit=async()=>{
    if(!form.projectName.trim())return toast.error('Project name required')
    if(!form.clientName.trim()) return toast.error('Client name required')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/civil/projects/${editProj.id}`,{
        method:'PATCH',headers:hdr(),
        body:JSON.stringify({
          ...form,
          contractValue: parseFloat(form.contractValue)||0,
          retentionPct:  parseFloat(form.retentionPct)||10,
        })
      })
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success('✅ Project updated!')
      setShowEdit(false);setEditProj(null);load()
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  // Status change (Hold / Cancel / Activate / Complete)
  const changeStatus=async(project,status)=>{
    try{
      await fetch(`${BASE}/civil/projects/${project.id}`,{
        method:'PATCH',headers:hdr(),body:JSON.stringify({status})
      })
      const labels={ON_HOLD:'⏸ Put on Hold',CANCELLED:'❌ Cancelled',
        ACTIVE:'✅ Re-Activated',COMPLETED:'🎉 Marked Complete'}
      toast.success(`${labels[status]||status}: ${project.projectName}`)
      setConfirmAction(null);load()
    }catch{toast.error('Failed')}
  }

  // Delete — smart: check transactions first
  const doDelete=async(project)=>{
    try{
      const r=await fetch(`${BASE}/civil/projects/${project.id}`,{method:'DELETE',headers:hdr2()})
      const d=await r.json()
      if(d.error){
        // Has transactions — show block info
        setConfirmAction(null)
        setBlockInfo({project, counts:d.counts})
        return
      }
      toast.success(`🗑 ${project.projectName} deleted`)
      setConfirmAction(null);load()
    }catch{toast.error('Failed')}
  }

  return(
    <div style={{fontFamily:'DM Sans,sans-serif',display:'flex',flexDirection:'column',height:'100%'}}>

      {/* Sticky Header */}
      <div style={{position:'sticky',top:-16,zIndex:100,background:'#fff',
        margin:'-16px -16px 0 -16px',
        borderBottom:'2px solid #E8E0E8',boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px'}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📋 Project List</div>
            <div style={{fontSize:11,color:'#888'}}>
              {projects.length} projects · Total Contract: {fmtC(totalContract)}
            </div>
          </div>
          <button onClick={()=>nav('/civil/projects/new')}
            style={{padding:'8px 18px',background:'#6E2C00',color:'#fff',border:'none',
              borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
            + New Project
          </button>
        </div>

        {/* Status stat pills */}
        <div style={{display:'flex',gap:6,padding:'6px 16px',borderTop:'1px solid #F5EDE0',
          background:'#FAFAFA',flexWrap:'wrap'}}>
          <button onClick={()=>setFilter('')}
            style={{padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:600,
              border:'1px solid #ddd',cursor:'pointer',
              background:!filter?'#6E2C00':'#fff',color:!filter?'#fff':'#555'}}>
            All ({projects.length})
          </button>
          {Object.entries(STATUS_CFG).map(([k,v])=>{
            const cnt=projects.filter(p=>p.status===k).length
            return(
              <button key={k} onClick={()=>setFilter(filter===k?'':k)}
                style={{padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:600,
                  border:`1px solid ${filter===k?v.color:'#ddd'}`,cursor:'pointer',
                  background:filter===k?v.bg:'#fff',color:filter===k?v.color:'#555'}}>
                {v.label} ({cnt})
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div style={{padding:'8px 16px',background:'#fff',borderTop:'1px solid #F0EDE8',
          display:'flex',gap:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder='🔍 Search project, client, site, code...'
            style={{...inp,width:280}}/>
          <button onClick={load}
            style={{...inp,width:'auto',padding:'7px 14px',background:'#FDF2E9',
              border:'1px solid #6E2C00',cursor:'pointer',fontWeight:600,color:'#6E2C00'}}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{flex:1,overflowY:'auto',overflowX:'auto'}}>
        {loading?(
          <div style={{padding:60,textAlign:'center',color:'#aaa'}}>
            <div style={{fontSize:32,marginBottom:12}}>⏳</div>Loading...
          </div>
        ):projects.length===0?(
          <div style={{padding:60,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>🏗️</div>
            <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No Projects Found</div>
            <button onClick={()=>nav('/civil/projects/new')}
              style={{padding:'9px 22px',background:'#6E2C00',color:'#fff',border:'none',
                borderRadius:6,cursor:'pointer',fontWeight:700}}>+ Create First Project</button>
          </div>
        ):(
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#6E2C00',color:'#fff',position:'sticky',top:0,zIndex:10}}>
                {['Code','Project Name','Client','Site','Contract Value','Progress',
                  'Target Date','Status','Actions'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,
                    fontWeight:600,whiteSpace:'nowrap',background:'#6E2C00'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p,i)=>{
                const sc=STATUS_CFG[p.status]||STATUS_CFG.PLANNING
                const pct=p.progress||0
                const overdue=p.targetDate&&new Date(p.targetDate)<new Date()&&p.status!=='COMPLETED'
                const isOnHold=p.status==='ON_HOLD'
                const isCancelled=p.status==='CANCELLED'
                const isInactive=isOnHold||isCancelled
                return(
                  <tr key={p.id}
                    style={{background:isCancelled?'#FFF5F5':isOnHold?'#FFFEF0':i%2===0?'#fff':'#FDF9F7',
                      borderBottom:'1px solid #F5EDE0',
                      opacity:isCancelled?0.7:1}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FEF9F5'}
                    onMouseLeave={e=>e.currentTarget.style.background=
                      isCancelled?'#FFF5F5':isOnHold?'#FFFEF0':i%2===0?'#fff':'#FDF9F7'}>

                    <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:10,
                      color:'#6E2C00',fontWeight:700,whiteSpace:'nowrap'}}>{p.projectCode}</td>
                    <td style={{padding:'9px 12px'}}>
                      <div style={{fontWeight:700,color:'#333'}}>{p.projectName}</div>
                      <div style={{fontSize:10,color:'#aaa'}}>{p.projectType}</div>
                    </td>
                    <td style={{padding:'9px 12px',color:'#555',whiteSpace:'nowrap'}}>
                      <div>{p.clientName}</div>
                      {p.clientPhone&&<div style={{fontSize:10,color:'#aaa'}}>{p.clientPhone}</div>}
                    </td>
                    <td style={{padding:'9px 12px',fontSize:11,color:'#555'}}>{p.siteLocation||'—'}</td>
                    <td style={{padding:'9px 12px',fontWeight:700,color:'#1E8449',whiteSpace:'nowrap'}}>
                      {fmtC(p.contractValue)}
                    </td>
                    <td style={{padding:'9px 12px',minWidth:110}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{flex:1,height:6,background:'#F0E8EC',borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pct}%`,borderRadius:3,
                            background:pct>=80?'#1E8449':pct>=50?'#B8860B':'#C0392B'}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,minWidth:28,
                          color:pct>=80?'#1E8449':pct>=50?'#B8860B':'#C0392B'}}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{padding:'9px 12px',fontSize:11,
                      color:overdue?'#C0392B':'#888',whiteSpace:'nowrap'}}>
                      {fmtD(p.targetDate)}
                      {overdue&&<div style={{fontSize:9,color:'#C0392B',fontWeight:700}}>⚠️ OVERDUE</div>}
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:sc.bg,color:sc.color,whiteSpace:'nowrap'}}>{sc.label}</span>
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                        {/* Open */}
                        <button onClick={()=>nav(`/civil/projects/${p.id}`)}
                          style={{padding:'4px 8px',background:'#EBF5FB',color:'#1A5276',
                            border:'1px solid #AED6F1',borderRadius:4,cursor:'pointer',
                            fontSize:10,fontWeight:700}}>
                          📂 Open
                        </button>
                        {/* Edit */}
                        {!isCancelled&&(
                          <button onClick={()=>openEdit(p)}
                            style={{padding:'4px 8px',background:'#FEF9E7',color:'#B8860B',
                              border:'1px solid #F9E79F',borderRadius:4,cursor:'pointer',
                              fontSize:10,fontWeight:700}}>
                            ✏️ Edit
                          </button>
                        )}
                        {/* Hold / Activate */}
                        {(p.status==='ACTIVE'||p.status==='PLANNING')&&(
                          <button onClick={()=>setConfirmAction({project:p,action:'HOLD'})}
                            style={{padding:'4px 8px',background:'#FEF9E7',color:'#B8860B',
                              border:'1px solid #F9E79F',borderRadius:4,cursor:'pointer',
                              fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>
                            ⏸ Hold
                          </button>
                        )}
                        {p.status==='ON_HOLD'&&(
                          <button onClick={()=>setConfirmAction({project:p,action:'ACTIVATE'})}
                            style={{padding:'4px 8px',background:'#E8F5E9',color:'#1E8449',
                              border:'1px solid #A9DFBF',borderRadius:4,cursor:'pointer',
                              fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>
                            ▶ Resume
                          </button>
                        )}
                        {/* Delete / Cancel — only show if NO transactions */}
                        {!isCancelled&&(()=>{
                          const cnt=p._count||{}
                          const hasTxn=(cnt.dprs||0)+(cnt.raBills||0)+(cnt.boqItems||0)+(p.progress||0) > 0
                          return hasTxn?(
                            <button onClick={()=>setConfirmAction({project:p,action:'CANCEL'})}
                              title='Has transactions — can only Cancel, not Delete'
                              style={{padding:'4px 8px',background:'#FEF9E7',color:'#B8860B',
                                border:'1px solid #F9E79F',borderRadius:4,cursor:'pointer',
                                fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>
                              ❌ Cancel
                            </button>
                          ):(
                            <button onClick={()=>setConfirmAction({project:p,action:'DELETE'})}
                              title='No transactions — safe to delete'
                              style={{padding:'4px 8px',background:'#FDEDEC',color:'#C0392B',
                                border:'1px solid #F1948A',borderRadius:4,cursor:'pointer',
                                fontSize:10,fontWeight:700}}>
                              🗑 Delete
                            </button>
                          )
                        })()}
                        {isCancelled&&(
                          <button onClick={()=>setConfirmAction({project:p,action:'ACTIVATE'})}
                            style={{padding:'4px 8px',background:'#E8F5E9',color:'#1E8449',
                              border:'1px solid #A9DFBF',borderRadius:4,cursor:'pointer',
                              fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>
                            ↩ Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {showEdit&&editProj&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setShowEdit(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:640,
            maxHeight:'90vh',overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#1A5276'}}>✏️ Edit Project</div>
                <div style={{fontSize:11,color:'#888'}}>{editProj.projectCode} — {editProj.projectName}</div>
              </div>
              <button onClick={()=>setShowEdit(false)}
                style={{background:'#f0f0f0',border:'none',borderRadius:6,
                  padding:'5px 12px',cursor:'pointer',fontWeight:700,fontSize:14}}>✕</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              {/* Project */}
              <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#6E2C00',
                borderBottom:'2px solid #6E2C0022',paddingBottom:4}}>🏗️ Project Details</div>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Project Name *</label>
                <input value={form.projectName} onChange={e=>set('projectName',e.target.value)}
                  style={{...inp,fontSize:14}}/></div>
              <div><label style={lbl}>Project Type</label>
                <select value={form.projectType} onChange={e=>set('projectType',e.target.value)} style={inp}>
                  {PROJECT_TYPES.map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div><label style={lbl}>Contract Value (₹) *</label>
                <input type='number' value={form.contractValue}
                  onChange={e=>set('contractValue',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Start Date</label>
                <input type='date' value={form.startDate}
                  onChange={e=>set('startDate',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Target Date</label>
                <input type='date' value={form.targetDate}
                  onChange={e=>set('targetDate',e.target.value)} style={inp}/></div>

              {/* Client */}
              <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#1A5276',
                borderBottom:'2px solid #1A527622',paddingBottom:4,marginTop:6}}>👤 Client Details</div>
              <div><label style={lbl}>Client Name *</label>
                <input value={form.clientName} onChange={e=>set('clientName',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Client Phone</label>
                <input value={form.clientPhone} onChange={e=>set('clientPhone',e.target.value)} style={inp}/></div>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Client GSTIN</label>
                <input value={form.clientGstin} onChange={e=>set('clientGstin',e.target.value)}
                  placeholder='22AAAAA0000A1Z5' style={inp}/></div>

              {/* Site */}
              <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#117A65',
                borderBottom:'2px solid #117A6522',paddingBottom:4,marginTop:6}}>📍 Site Details</div>
              <div><label style={lbl}>Site Location</label>
                <input value={form.siteLocation} onChange={e=>set('siteLocation',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>City</label>
                <input value={form.city} onChange={e=>set('city',e.target.value)} style={inp}/></div>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Site Address</label>
                <input value={form.siteAddress} onChange={e=>set('siteAddress',e.target.value)} style={inp}/></div>

              {/* Team */}
              <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#714B67',
                borderBottom:'2px solid #714B6722',paddingBottom:4,marginTop:6}}>👷 Project Team</div>
              <div><label style={lbl}>Project Manager</label>
                <input value={form.pm} onChange={e=>set('pm',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Site Supervisor</label>
                <input value={form.supervisor} onChange={e=>set('supervisor',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Supervisor Phone</label>
                <input value={form.supervisorPhone} onChange={e=>set('supervisorPhone',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Retention %</label>
                <input type='number' value={form.retentionPct}
                  onChange={e=>set('retentionPct',e.target.value)} style={inp}/></div>

              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Notes</label>
                <input value={form.notes} onChange={e=>set('notes',e.target.value)}
                  placeholder='Any additional notes...' style={inp}/></div>
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
              <button onClick={()=>setShowEdit(false)}
                style={{padding:'8px 18px',background:'#f0f0f0',border:'none',
                  borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={saveEdit} disabled={saving}
                style={{padding:'8px 24px',background:'#1A5276',color:'#fff',border:'none',
                  borderRadius:5,cursor:'pointer',fontWeight:700,opacity:saving?0.6:1}}>
                {saving?'⏳ Saving...':'💾 Update Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTION CONFIRM MODAL ── */}
      {confirmAction&&(()=>{
        const {project:p,action}=confirmAction
        const cfg={
          DELETE:  {icon:'🗑️', title:'Delete Project?',     color:'#C0392B', btn:'🗑 Delete',     bg:'#C0392B'},
          HOLD:    {icon:'⏸',  title:'Put Project on Hold?', color:'#B8860B', btn:'⏸ Hold',       bg:'#B8860B'},
          CANCEL:  {icon:'❌', title:'Cancel Project?',      color:'#C0392B', btn:'❌ Cancel',     bg:'#C0392B'},
          ACTIVATE:{icon:'✅', title:p.status==='ON_HOLD'?'Resume Project?':'Restore Project?',
            color:'#1E8449',btn:'✅ '+(p.status==='ON_HOLD'?'Resume':'Restore'),bg:'#1E8449'},
        }
        const c=cfg[action]
        const subtexts={
          DELETE: 'If this project has transactions (BOQ, DPR, Labour, Bills), deletion will be blocked and you can only put it On Hold.',
          HOLD:   'Project will be paused. All data retained. You can resume anytime.',
          CANCEL: 'Project will be marked Cancelled. All data retained.',
          ACTIVATE:p.status==='ON_HOLD'?'Project will be resumed to Active status.':'Project will be restored to Active status.',
        }
        return(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#fff',borderRadius:12,padding:28,width:440,
              boxShadow:'0 16px 48px rgba(0,0,0,.3)',textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:12}}>{c.icon}</div>
              <div style={{fontSize:16,fontWeight:800,color:c.color,marginBottom:8}}>{c.title}</div>
              <div style={{fontSize:14,fontWeight:700,color:'#333',marginBottom:6}}>{p.projectName}</div>
              <div style={{fontSize:11,color:'#888',marginBottom:20,lineHeight:1.6}}>{subtexts[action]}</div>
              <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                <button onClick={()=>setConfirmAction(null)}
                  style={{padding:'9px 22px',background:'#f0f0f0',border:'none',
                    borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:13}}>Cancel</button>
                <button onClick={()=>{
                  if(action==='DELETE') doDelete(p)
                  else if(action==='HOLD') changeStatus(p,'ON_HOLD')
                  else if(action==='CANCEL') changeStatus(p,'CANCELLED')
                  else if(action==='ACTIVATE') changeStatus(p,'ACTIVE')
                }} style={{padding:'9px 22px',border:'none',borderRadius:6,cursor:'pointer',
                  fontWeight:700,fontSize:13,color:'#fff',background:c.bg}}>
                  {c.btn}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── BLOCK INFO MODAL (delete blocked — has transactions) ── */}
      {blockInfo&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:460,
            boxShadow:'0 16px 48px rgba(0,0,0,.3)'}}>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:48,marginBottom:8}}>🚫</div>
              <div style={{fontSize:16,fontWeight:800,color:'#C0392B',marginBottom:4}}>Cannot Delete Project</div>
              <div style={{fontSize:13,fontWeight:700,color:'#333'}}>{blockInfo.project.projectName}</div>
            </div>
            <div style={{background:'#FDEDEC',borderRadius:8,padding:14,marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:'#C0392B',marginBottom:10}}>
                ⚠️ Transactions exist — deletion blocked:
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {Object.entries(blockInfo.counts||{}).map(([k,v])=>v>0&&(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',
                    padding:'4px 10px',background:'#fff',borderRadius:4,fontSize:12}}>
                    <span style={{color:'#666',textTransform:'capitalize'}}>{k.replace(/([A-Z])/g,' $1')}</span>
                    <span style={{fontWeight:700,color:'#C0392B'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:'#FEF9E7',borderRadius:8,padding:12,marginBottom:16,
              fontSize:12,color:'#B8860B'}}>
              💡 You can <strong>Put on Hold</strong> or <strong>Cancel</strong> the project instead of deleting.
              All data will be preserved.
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>setBlockInfo(null)}
                style={{padding:'9px 18px',background:'#f0f0f0',border:'none',
                  borderRadius:6,cursor:'pointer',fontWeight:600}}>Close</button>
              <button onClick={()=>{
                setBlockInfo(null)
                setConfirmAction({project:blockInfo.project,action:'HOLD'})
              }} style={{padding:'9px 18px',background:'#B8860B',color:'#fff',border:'none',
                borderRadius:6,cursor:'pointer',fontWeight:700}}>
                ⏸ Put on Hold Instead
              </button>
              <button onClick={()=>{
                setBlockInfo(null)
                setConfirmAction({project:blockInfo.project,action:'CANCEL'})
              }} style={{padding:'9px 18px',background:'#C0392B',color:'#fff',border:'none',
                borderRadius:6,cursor:'pointer',fontWeight:700}}>
                ❌ Cancel Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
