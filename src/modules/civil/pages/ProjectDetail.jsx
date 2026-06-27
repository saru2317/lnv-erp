import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const STATUS_CFG = {
  PLANNING:  { bg:'#EBF5FB', color:'#1A5276', label:'Planning' },
  ACTIVE:    { bg:'#E8F5E9', color:'#1E8449', label:'Active' },
  ON_HOLD:   { bg:'#FEF9E7', color:'#B8860B', label:'On Hold' },
  COMPLETED: { bg:'#F0EBF0', color:'#714B67', label:'Completed' },
  CANCELLED: { bg:'#FDEDEC', color:'#C0392B', label:'Cancelled' },
}
const TABS = ['Overview','BOQ','DPR Log','Labour','Contractors','RA Bills','Materials','Specs & VO']

export default function ProjectDetail() {
  const { id }  = useParams()
  const nav     = useNavigate()
  const [proj,  setProj]  = useState(null)
  const [tab,   setTab]   = useState('Overview')
  const [boq,   setBOQ]   = useState([])
  const [dprs,  setDPRs]  = useState([])
  const [raBills,setRaBills]=useState([])
  const [specs, setSpecs] = useState([])
  const [vos,   setVOs]   = useState([])
  const [loading,setLoading]=useState(true)
  const [editStatus,setEditStatus]=useState(false)
  const [contractorWOs,setContractorWOs]=useState([])
  const [materials,    setMaterials]    =useState([])

  const load = useCallback(async () => {
    try {
      const [pr, bq, dp, ra, sp, vo, cwo, mat] = await Promise.all([
        fetch(`${BASE}/civil/projects/${id}`,        {headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/boq/${id}`,             {headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/dpr/${id}`,             {headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/ra-bills/${id}`,        {headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/specs/${id}`,           {headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/variation-orders/${id}`,{headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil-ext/contractor-wo?projectId=${id}`,{headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/stock/${id}`,           {headers:hdr2()}).then(r=>r.json()),
      ])
      setProj(pr.data); setBOQ(bq.data||[]); setDPRs(dp.data||[])
      setRaBills(ra.data||[]); setSpecs(sp.data||[]); setVOs(vo.data||[])
      setContractorWOs(cwo.data||[]); setMaterials(mat.data||[])
    } catch(e){ toast.error('Load failed') }
    finally { setLoading(false) }
  },[id])

  useEffect(()=>{ load() },[load])

  const updateStatus = async (status) => {
    await fetch(`${BASE}/civil/projects/${id}`,{method:'PATCH',headers:hdr(),body:JSON.stringify({status})})
    toast.success('Status updated'); setEditStatus(false); load()
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading project...</div>
  if (!proj)   return <div style={{padding:40,textAlign:'center',color:'#C0392B'}}>❌ Project not found</div>

  const sc  = STATUS_CFG[proj.status]||STATUS_CFG.PLANNING
  const pct = proj.progress||0
  const boqTotal = boq.reduce((s,b)=>s+Number(b.amount||0),0)
  const boqDone  = boq.reduce((s,b)=>s+Number(b.doneAmt||0),0)
  const raBilled = raBills.filter(r=>r.status!=='DRAFT').reduce((s,r)=>s+Number(r.thisBillAmt||0),0)
  const voTotal  = vos.filter(v=>v.status==='APPROVED').reduce((s,v)=>s+Number(v.variationAmt||0),0)

  return (
    <div style={{background:'#F9F6F8',minHeight:'100vh',fontFamily:'DM Sans,Arial,sans-serif'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:20}}>
        <button onClick={()=>nav('/civil/projects')}
          style={{padding:'8px 14px',background:'#FDF2E9',border:'none',borderRadius:8,cursor:'pointer',color:'#6E2C00',fontWeight:700,marginTop:4}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <div style={{fontSize:20,fontWeight:800,color:'#6E2C00'}}>{proj.projectName}</div>
            {editStatus ? (
              <select onChange={e=>updateStatus(e.target.value)} defaultValue={proj.status}
                style={{padding:'3px 8px',borderRadius:6,border:'1px solid #ddd',fontSize:12}}>
                {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            ) : (
              <span onClick={()=>setEditStatus(true)} style={{padding:'3px 12px',borderRadius:12,fontSize:12,fontWeight:700,
                background:sc.bg,color:sc.color,cursor:'pointer'}}>{sc.label} ✏️</span>
            )}
          </div>
          <div style={{fontSize:12,color:'#888'}}>{proj.projectCode} · {proj.clientName} · {proj.siteLocation||'—'}</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>nav('/civil/dpr/new')}
            style={{padding:'8px 14px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12}}>
            + DPR Entry
          </button>
          <button onClick={()=>nav('/civil/indent')}
            style={{padding:'8px 14px',background:'#1A5276',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12}}>
            + Material Indent
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{background:'#fff',borderRadius:12,padding:16,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
          <div style={{fontSize:13,fontWeight:700,color:'#6E2C00'}}>Overall Progress</div>
          <div style={{fontSize:18,fontWeight:800,color:pct>=80?'#1E8449':pct>=50?'#B8860B':'#C0392B'}}>{pct}%</div>
        </div>
        <div style={{height:12,background:'#F0E8EC',borderRadius:6,overflow:'hidden',marginBottom:12}}>
          <div style={{height:'100%',width:`${pct}%`,borderRadius:6,
            background:pct>=80?'#1E8449':pct>=50?'#B8860B':'#6E2C00',transition:'width .5s'}}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
          {[
            ['Contract',  fmtC(proj.contractValue), '#1E8449'],
            ['BOQ Done',  fmtC(boqDone),            '#6E2C00'],
            ['RA Billed', fmtC(raBilled),           '#D35400'],
            ['Variation', fmtC(voTotal),             '#714B67'],
            ['Target',    fmtD(proj.targetDate),     '#1A5276'],
          ].map(([l,v,c])=>(
            <div key={l} style={{textAlign:'center',background:'#F9F6F8',borderRadius:8,padding:'8px 4px'}}>
              <div style={{fontSize:10,color:'#888'}}>{l}</div>
              <div style={{fontSize:13,fontWeight:700,color:c,marginTop:3}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{display:'flex',gap:4,background:'#fff',borderRadius:10,padding:5,marginBottom:16,
        boxShadow:'0 1px 4px rgba(0,0,0,.06)',overflowX:'auto'}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:'8px 16px',border:'none',borderRadius:7,cursor:'pointer',
              fontWeight:700,fontSize:12,whiteSpace:'nowrap',transition:'all .15s',
              background:tab===t?'#6E2C00':'transparent',
              color:tab===t?'#fff':'#888'}}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab==='Overview' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {[
            {title:'Project Info', items:[
              ['Project Code', proj.projectCode],['Type', proj.projectType],
              ['Start Date', fmtD(proj.startDate)],['Target Date', fmtD(proj.targetDate)],
              ['PM', proj.pm||'—'],['Status', sc.label],
            ]},
            {title:'Client Info', items:[
              ['Client Name', proj.clientName],['Phone', proj.clientPhone||'—'],
              ['GSTIN', proj.clientGstin||'—'],['Email', proj.clientEmail||'—'],
            ]},
            {title:'Site Info', items:[
              ['Location', proj.siteLocation||'—'],['City', proj.city||'—'],
              ['State', proj.state||'—'],['Area', proj.siteArea||'—'],
            ]},
            {title:'Team', items:[
              ['Supervisor', proj.supervisor||'—'],['Phone', proj.supervisorPhone||'—'],
              ['Engineer', proj.structuralEngineer||'—'],['Architect', proj.architect||'—'],
            ]},
          ].map(({title,items})=>(
            <div key={title} style={{background:'#fff',borderRadius:12,padding:18,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
              <div style={{fontSize:14,fontWeight:700,color:'#6E2C00',marginBottom:14,
                paddingBottom:8,borderBottom:'2px solid #FDF2E9'}}>{title}</div>
              {items.map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',
                  padding:'7px 0',borderBottom:'1px solid #F9F6F8'}}>
                  <div style={{fontSize:12,color:'#888'}}>{k}</div>
                  <div style={{fontSize:12,fontWeight:600,color:'#2C3E50',textAlign:'right',maxWidth:'60%'}}>{v}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* BOQ TAB */}
      {tab==='BOQ' && (
        <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',overflow:'hidden'}}>
          <div style={{padding:'14px 18px',background:'#6E2C00',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>📐 Bill of Quantities</div>
            <button onClick={()=>nav(`/civil/boq?projectId=${id}`)}
              style={{padding:'6px 14px',background:'rgba(255,255,255,.2)',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12}}>
              Edit BOQ
            </button>
          </div>
          {boq.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>
              No BOQ items yet.
              <div style={{marginTop:12}}>
                <button onClick={()=>nav(`/civil/boq?projectId=${id}`)}
                  style={{padding:'8px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontWeight:700}}>
                  + Add BOQ Items
                </button>
              </div>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#FDF2E9'}}>
                  {['#','Activity','Description','Unit','Qty','Rate','Amount','Done %','Done Amt'].map(h=>(
                    <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boq.map((b,i)=>(
                  <tr key={b.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                    <td style={{padding:'9px 12px',color:'#888',fontSize:11}}>{b.slNo}</td>
                    <td style={{padding:'9px 12px',fontWeight:700,color:'#6E2C00'}}>{b.activity}</td>
                    <td style={{padding:'9px 12px'}}>{b.description}</td>
                    <td style={{padding:'9px 12px',color:'#555'}}>{b.unit}</td>
                    <td style={{padding:'9px 12px',textAlign:'right'}}>{Number(b.quantity).toLocaleString('en-IN')}</td>
                    <td style={{padding:'9px 12px',textAlign:'right'}}>{fmtC(b.rate)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700}}>{fmtC(b.amount)}</td>
                    <td style={{padding:'9px 12px',textAlign:'center'}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <div style={{flex:1,height:6,background:'#F0E8EC',borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${b.donePct||0}%`,background:'#1E8449',borderRadius:3}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:'#1E8449',minWidth:30}}>{Number(b.donePct||0).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{padding:'9px 12px',textAlign:'right',color:'#1E8449',fontWeight:700}}>{fmtC(b.doneAmt)}</td>
                  </tr>
                ))}
                <tr style={{background:'#FDF2E9',fontWeight:700}}>
                  <td colSpan={6} style={{padding:'10px 12px',color:'#6E2C00',fontSize:13}}>TOTAL</td>
                  <td style={{padding:'10px 12px',textAlign:'right',color:'#6E2C00',fontSize:13}}>{fmtC(boqTotal)}</td>
                  <td style={{padding:'10px 12px',textAlign:'center',color:'#1E8449'}}>
                    {boqTotal>0?Math.round(boqDone/boqTotal*100):0}%
                  </td>
                  <td style={{padding:'10px 12px',textAlign:'right',color:'#1E8449',fontSize:13}}>{fmtC(boqDone)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* DPR LOG TAB */}
      {tab==='DPR Log' && (
        <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',overflow:'hidden'}}>
          <div style={{padding:'14px 18px',background:'#6E2C00',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>📅 Daily Progress Reports</div>
            <button onClick={()=>nav('/civil/dpr/new')}
              style={{padding:'6px 14px',background:'rgba(255,255,255,.2)',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12}}>
              + New DPR
            </button>
          </div>
          {dprs.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>
              No DPR entries yet.
              <div style={{marginTop:12}}>
                <button onClick={()=>nav('/civil/dpr/new')}
                  style={{padding:'8px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontWeight:700}}>
                  + First DPR Entry
                </button>
              </div>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#FDF2E9'}}>
                  {['DPR No','Date','Supervisor','Weather','Issues','Remarks'].map(h=>(
                    <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dprs.map((d,i)=>(
                  <tr key={d.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                    <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:11,color:'#6E2C00',fontWeight:700}}>{d.dprNo}</td>
                    <td style={{padding:'9px 12px'}}>{fmtD(d.date)}</td>
                    <td style={{padding:'9px 12px',fontWeight:600}}>{d.supervisor}</td>
                    <td style={{padding:'9px 12px',color:'#555'}}>{d.weather}</td>
                    <td style={{padding:'9px 12px',color:d.issues?'#C0392B':'#888',fontSize:12}}>{d.issues||'No issues'}</td>
                    <td style={{padding:'9px 12px',color:'#555',fontSize:12,maxWidth:200,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.remarks||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* LABOUR TAB */}
      {tab==='Labour' && (
        <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:700,color:'#6E2C00'}}>👷 Labour Register</div>
            <button onClick={()=>nav('/civil/labour')}
              style={{padding:'7px 14px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontWeight:700,fontSize:12}}>
              Mark Attendance
            </button>
          </div>
          <div style={{textAlign:'center',padding:40,color:'#aaa'}}>
            <div style={{fontSize:36,marginBottom:12}}>👷</div>
            View labour attendance for this project in Labour Register
          </div>
        </div>
      )}

      {/* RA BILLS TAB */}
      {tab==='RA Bills' && (
        <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',overflow:'hidden'}}>
          <div style={{padding:'14px 18px',background:'#6E2C00',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>💰 Running Account Bills</div>
            <button onClick={()=>nav(`/civil/ra-bills?projectId=${id}`)}
              style={{padding:'6px 14px',background:'rgba(255,255,255,.2)',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12}}>
              + Generate RA Bill
            </button>
          </div>
          {raBills.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No RA bills raised yet.</div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#FDF2E9'}}>
                  {['RA Bill No','Date','Running Total','This Bill','Less Retention','Net Payable','Status'].map(h=>(
                    <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {raBills.map((r,i)=>{
                  const stCfg = {DRAFT:{bg:'#F5F5F5',color:'#666'},SUBMITTED:{bg:'#EBF5FB',color:'#1A5276'},
                    APPROVED:{bg:'#E8F5E9',color:'#1E8449'},PAID:{bg:'#F0EBF0',color:'#714B67'}}
                  const s = stCfg[r.status]||stCfg.DRAFT
                  return (
                    <tr key={r.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:11,color:'#6E2C00',fontWeight:700}}>{r.raBillNo}</td>
                      <td style={{padding:'9px 12px'}}>{fmtD(r.billDate)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right'}}>{fmtC(r.runningTotal)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#D35400'}}>{fmtC(r.thisBillAmt)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:'#C0392B'}}>- {fmtC(r.lessRetention)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#1E8449'}}>{fmtC(r.netPayable)}</td>
                      <td style={{padding:'9px 12px'}}>
                        <span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:s.bg,color:s.color}}>{r.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CONTRACTORS TAB */}
      {tab==='Contractors' && (
        <div style={{background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'12px 18px',background:'#6E2C00',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>🤝 Contractor Work Orders</div>
            <button onClick={()=>nav('/civil/contractor-wo')}
              style={{padding:'5px 12px',background:'rgba(255,255,255,.2)',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>
              + New WO
            </button>
          </div>
          {contractorWOs.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No work orders for this project yet</div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#FDF2E9'}}>
                {['WO No','Contractor','Activity','Rate','Est Qty','Est Amt','Logs','Status'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {contractorWOs.map((w,i)=>{
                  const isPaid=w.status==='CLOSED'
                  return(
                    <tr key={w.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:10,color:'#6E2C00',fontWeight:700}}>{w.woNo}</td>
                      <td style={{padding:'8px 12px',fontWeight:700}}>{w.contractorName}</td>
                      <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{w.activity}</td>
                      <td style={{padding:'8px 12px'}}>₹{Number(w.rate||0).toLocaleString('en-IN')}/{w.unit}</td>
                      <td style={{padding:'8px 12px',textAlign:'right'}}>{Number(w.estimatedQty||0).toFixed(2)}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:'#1E8449'}}>₹{Number(Number(w.estimatedQty||0)*Number(w.rate||0)).toLocaleString('en-IN')}</td>
                      <td style={{padding:'8px 12px',textAlign:'center'}}>
                        <span style={{padding:'2px 8px',background:'#EBF5FB',color:'#1A5276',borderRadius:10,fontSize:10,fontWeight:700}}>
                          {w._count?.dailyLogs||0} logs
                        </span>
                      </td>
                      <td style={{padding:'8px 12px'}}>
                        <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                          background:isPaid?'#F0EBF0':'#E8F5E9',color:isPaid?'#714B67':'#1E8449'}}>
                          {w.status||'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{background:'#FDF2E9',fontWeight:700}}>
                  <td colSpan={5} style={{padding:'8px 12px',color:'#6E2C00'}}>TOTAL ESTIMATED</td>
                  <td style={{padding:'8px 12px',textAlign:'right',color:'#1E8449'}}>
                    ₹{contractorWOs.reduce((s,w)=>s+Number(w.estimatedQty||0)*Number(w.rate||0),0).toLocaleString('en-IN')}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* MATERIALS TAB */}
      {tab==='Materials' && (
        <div style={{background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'12px 18px',background:'#117A65',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>📦 Site Material Stock</div>
            <button onClick={()=>nav('/civil/indent')}
              style={{padding:'5px 12px',background:'rgba(255,255,255,.2)',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>
              + Material Indent
            </button>
          </div>
          {materials.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No material stock data for this project</div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#E8F5F0'}}>
                {['Material','Category','Unit','Received','Issued','Balance','Value'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#117A65'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {materials.map((m,i)=>{
                  const balance=Number(m.receivedQty||0)-Number(m.issuedQty||0)
                  const isLow=balance<Number(m.minStock||0)
                  return(
                    <tr key={m.id} style={{background:isLow?'#FFF5F5':i%2===0?'#fff':'#F8FFF8',borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'8px 12px',fontWeight:700}}>{m.matName||m.itemName}</td>
                      <td style={{padding:'8px 12px',color:'#555',fontSize:11}}>{m.category||'—'}</td>
                      <td style={{padding:'8px 12px'}}>{m.unit}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',color:'#1E8449',fontWeight:600}}>{Number(m.receivedQty||0).toFixed(2)}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',color:'#D35400',fontWeight:600}}>{Number(m.issuedQty||0).toFixed(2)}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:isLow?'#C0392B':'#1E8449'}}>
                        {balance.toFixed(2)} {isLow&&'⚠️'}
                      </td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:'#6E2C00'}}>
                        ₹{Number(m.value||0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SPECS & VO TAB */}
      {tab==='Specs & VO' && (
        <div style={{display:'grid',gap:16}}>
          {/* Specifications */}
          <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <div style={{fontSize:14,fontWeight:700,color:'#6E2C00',marginBottom:14}}>📋 Customer Specifications</div>
            {specs.length===0 ? (
              <div style={{textAlign:'center',padding:20,color:'#aaa',fontSize:13}}>No specifications added yet</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{background:'#FDF2E9'}}>
                    {['Category','Item','Specification','Brand','Grade','Test Required'].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specs.map((s,i)=>(
                    <tr key={s.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'8px 12px',fontWeight:700,color:'#6E2C00'}}>{s.category}</td>
                      <td style={{padding:'8px 12px',fontWeight:600}}>{s.item}</td>
                      <td style={{padding:'8px 12px'}}>{s.specification}</td>
                      <td style={{padding:'8px 12px',color:'#555'}}>{s.brand||'—'}</td>
                      <td style={{padding:'8px 12px',color:'#555'}}>{s.grade||'—'}</td>
                      <td style={{padding:'8px 12px',textAlign:'center',color:s.testRequired?'#C0392B':'#888'}}>
                        {s.testRequired?'✅ Required':'—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Variation Orders */}
          <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <div style={{fontSize:14,fontWeight:700,color:'#6E2C00',marginBottom:14}}>📝 Variation Orders</div>
            {vos.length===0 ? (
              <div style={{textAlign:'center',padding:20,color:'#aaa',fontSize:13}}>No variation orders yet</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{background:'#FDF2E9'}}>
                    {['VO No','Type','Description','Amount','Status'].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vos.map((v,i)=>{
                    const vsCfg={PENDING:{bg:'#FEF9E7',color:'#B8860B'},APPROVED:{bg:'#E8F5E9',color:'#1E8449'},
                      REJECTED:{bg:'#FDEDEC',color:'#C0392B'}}
                    const vs=vsCfg[v.status]||vsCfg.PENDING
                    return (
                      <tr key={v.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                        <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:11,color:'#6E2C00',fontWeight:700}}>{v.voNo}</td>
                        <td style={{padding:'8px 12px',fontSize:12,color:'#555'}}>{v.voType?.replace('_',' ')}</td>
                        <td style={{padding:'8px 12px',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.description}</td>
                        <td style={{padding:'8px 12px',fontWeight:700,color:Number(v.variationAmt)>=0?'#1E8449':'#C0392B'}}>
                          {Number(v.variationAmt)>=0?'+':''}{fmtC(v.variationAmt)}
                        </td>
                        <td style={{padding:'8px 12px'}}>
                          <span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:vs.bg,color:vs.color}}>{v.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
