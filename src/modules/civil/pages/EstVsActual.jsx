import React,{useState,useEffect,useCallback}from 'react'
import toast from 'react-hot-toast'

const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'
const pct=(a,b)=>b>0?Math.round(a/b*100):0

const STATUS_CFG={
  ACTIVE:   {bg:'#E8F5E9',color:'#1E8449'},
  PLANNING: {bg:'#EBF5FB',color:'#1A5276'},
  ON_HOLD:  {bg:'#FEF9E7',color:'#B8860B'},
  COMPLETED:{bg:'#F0EBF0',color:'#714B67'},
  CANCELLED:{bg:'#FDEDEC',color:'#C0392B'},
}

const ProgressBar=({pct:p,height=8,showLabel=false})=>{
  const c=p>=90?'#C0392B':p>=75?'#B8860B':p>=50?'#1A5276':'#1E8449'
  return(
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{flex:1,height,background:'#F0E8EC',borderRadius:height/2,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${Math.min(p,100)}%`,background:c,
          borderRadius:height/2,transition:'width .3s'}}/>
      </div>
      {showLabel&&<span style={{fontSize:11,fontWeight:700,color:c,minWidth:36}}>{p}%</span>}
    </div>
  )
}

const VarBadge=({var:v,isAmt=false})=>{
  if(!v&&v!==0)return null
  const pos=v>0
  return(
    <span style={{padding:'2px 7px',borderRadius:10,fontSize:10,fontWeight:700,
      background:pos?'#FDEDEC':'#E8F5E9',
      color:pos?'#C0392B':'#1E8449',whiteSpace:'nowrap'}}>
      {pos?'▲':'▼'} {isAmt?fmtC(Math.abs(v)):Math.abs(v).toFixed(2)}
      {pos?' Over':' Under'}
    </span>
  )
}

export default function EstVsActual(){
  const [projects, setProjects] = useState([])
  const [selProject,setSelProject]=useState('')
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [activeTab,setActiveTab]=useState('BOQ')
  const [search,   setSearch]   = useState('')
  const [houseFilter, setHouseFilter] = useState('ALL')
  const [unitsWithRooms, setUnitsWithRooms] = useState([])
  const [roomHistoryFor, setRoomHistoryFor] = useState(null) // room object, or null when modal closed
  const [roomHistory, setRoomHistory] = useState([])
  const [roomHistoryLoading, setRoomHistoryLoading] = useState(false)
  const [roomAddonsView, setRoomAddonsView] = useState([])

  useEffect(() => {
    if (!roomHistoryFor) return
    setRoomHistoryLoading(true)
    fetch(`${BASE}/civil/rooms/${roomHistoryFor.id}/progress-history`, { headers:hdr2() })
      .then(r=>r.json()).then(d => setRoomHistory(d.data||[]))
      .finally(() => setRoomHistoryLoading(false))
    fetch(`${BASE}/civil/rooms/${roomHistoryFor.id}/addons`, { headers:hdr2() })
      .then(r=>r.json()).then(d => setRoomAddonsView(d.data||[]))
  }, [roomHistoryFor])

  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{})
  },[])

  const load=useCallback(async()=>{
    if(!selProject)return
    setLoading(true)
    try{
      const r=await fetch(`${BASE}/civil/est-vs-actual/${selProject}`,{headers:hdr2()})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      setData(d.data)
      // Units already come with rooms nested — reused here for the
      // room-wise drill-down, not a separate/duplicate fetch.
      const ur = await fetch(`${BASE}/civil/units?projectId=${selProject}`,{headers:hdr2()}).then(r=>r.json())
      setUnitsWithRooms(ur.data||[])
    }catch{toast.error('Failed to load')}finally{setLoading(false)}
  },[selProject])

  useEffect(()=>{load()},[load])

  const s=data?.summary||{}
  const proj=data?.project||{}
  const unitMap = Object.fromEntries((data?.byUnit||[]).map(u=>[u.unitId, u.unitNo]))
  const boqItems=(data?.boqItems||[]).filter(b=>
    (!search || b.activity?.toLowerCase().includes(search.toLowerCase())
      || b.description?.toLowerCase().includes(search.toLowerCase()))
    && (houseFilter==='ALL' || (houseFilter==='COMMON' ? !b.unitId : b.unitId===parseInt(houseFilter)))
  )

  const filteredEstTotal  = boqItems.reduce((sum,b)=>sum+Number(b.estAmt||0),0)
  const filteredDoneTotal = boqItems.reduce((sum,b)=>sum+Number(b.doneAmt||0),0)
  const filteredPct = filteredEstTotal>0 ? Math.round(filteredDoneTotal/filteredEstTotal*100) : 0

  // Print report
  const printReport=()=>{
    if(!data)return
    const html=buildPrintHTML(data)
    const win=window.open('','_blank','width=1000,height=700')
    win.document.write(html)
    win.document.close()
  }

  return(
    <div style={{fontFamily:'DM Sans,sans-serif',display:'flex',flexDirection:'column',height:'100%'}}>

      {/* ── STICKY HEADER ── */}
      <div style={{position:'sticky',top:-16,zIndex:100,background:'#fff',
        margin:'-16px -16px 0 -16px',
        borderBottom:'2px solid #E8E0E8',boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px'}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📊 Estimation vs Actual</div>
            <div style={{fontSize:11,color:'#888'}}>BOQ planned cost vs actual site expenditure · Variance analysis</div>
          </div>
          {data&&(
            <button onClick={printReport}
              style={{padding:'8px 18px',background:'#1A5276',color:'#fff',border:'none',
                borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
              🖨️ Print Report
            </button>
          )}
        </div>

        {/* Project selector */}
        <div style={{padding:'8px 16px',background:'#FAFAFA',borderTop:'1px solid #F0EDE8',
          display:'flex',gap:10,alignItems:'center'}}>
          <select value={selProject} onChange={e=>{setSelProject(e.target.value); setHouseFilter('ALL')}}
            style={{padding:'7px 10px',border:'1.5px solid #DDD',borderRadius:5,
              fontSize:12,outline:'none',width:320}}>
            <option value=''>Select Project</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName} ({p.clientName})</option>)}
          </select>
          {data&&(
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              {['BOQ','ByHouse','Cost','Timeline'].map(t=>(
                <button key={t} onClick={()=>setActiveTab(t)}
                  style={{padding:'6px 14px',border:'none',borderRadius:5,cursor:'pointer',
                    fontSize:12,fontWeight:700,
                    background:activeTab===t?'#6E2C00':'#F0EBF0',
                    color:activeTab===t?'#fff':'#6E2C00'}}>
                  {t==='BOQ'?'📐 BOQ Analysis':t==='ByHouse'?'🏠 By House':t==='Cost'?'💰 Cost Breakdown':'📅 Plan vs Actual'}
                </button>
              ))}
              {(data?.byUnit||[]).length > 0 && (
                <select value={houseFilter} onChange={e=>setHouseFilter(e.target.value)}
                  style={{padding:'6px 10px',border:'1.5px solid #E8D5C4',borderRadius:5,fontSize:11,
                    marginLeft:6,outline:'none',fontWeight:houseFilter!=='ALL'?700:400,
                    background:houseFilter!=='ALL'?'#FDF2E9':'#fff',color:'#6E2C00'}}>
                  <option value='ALL'>🏘️ All Houses (Consolidated)</option>
                  <option value='COMMON'>Common Area Only</option>
                  {(data?.byUnit||[]).map(u=>(
                    <option key={u.unitId} value={u.unitId}>🏠 {u.unitNo}{u.ownerName?` — ${u.ownerName}`:''}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{flex:1,overflowY:'auto',padding:'12px 0'}}>
        {!selProject?(
          <div style={{padding:80,textAlign:'center'}}>
            <div style={{fontSize:56,marginBottom:16}}>📊</div>
            <div style={{fontSize:16,fontWeight:700,color:'#6E2C00',marginBottom:8}}>Select a Project</div>
            <div style={{fontSize:12,color:'#888'}}>Choose a project to see estimation vs actual analysis</div>
          </div>
        ):loading?(
          <div style={{padding:60,textAlign:'center',color:'#aaa'}}>
            <div style={{fontSize:32,marginBottom:12}}>⏳</div>Loading analysis...
          </div>
        ):data&&(<>

          {/* ── PROJECT HEADER CARD ── */}
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,
            padding:16,marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#6E2C00'}}>{proj.projectName}</div>
                <div style={{fontSize:12,color:'#888'}}>{proj.projectCode} · {proj.clientName} · {proj.siteLocation}</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,
                  ...(STATUS_CFG[proj.status]||STATUS_CFG.PLANNING)}}>
                  {proj.status}
                </span>
                <span style={{fontSize:12,color:'#888'}}>{fmtD(proj.startDate)} → {fmtD(proj.targetDate)}</span>
              </div>
            </div>

            {/* KPI Strip */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
              {[
                ['Contract Value',   fmtC(s.contractValue),     '#6E2C00','#FDF2E9',  null],
                ['BOQ Estimated',    fmtC(s.estTotal),          '#1A5276','#EBF5FB',  null],
                ['Work Done (BOQ)',  fmtC(s.doneTotal),         '#117A65','#E8F5F0',  null],
                ['Actual Spent',     fmtC(s.actualTotal),       '#B8860B','#FEF9E7',  null],
                ['RA Billed',        fmtC(s.totalRaBilled),     '#D35400','#FDF2E9',  null],
                ['Gross Margin',     fmtC(s.grossMargin),
                  s.grossMargin>=0?'#1E8449':'#C0392B',
                  s.grossMargin>=0?'#E8F5E9':'#FDEDEC', null],
              ].map(([l,v,c,bg])=>(
                <div key={l} style={{background:bg,borderRadius:8,padding:'10px 14px',
                  borderLeft:`3px solid ${c}`}}>
                  <div style={{fontSize:10,color:'#888',marginBottom:4}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:800,color:c}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Overall progress */}
            <div style={{marginTop:14}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:700,color:'#555'}}>Overall BOQ Progress</span>
                <span style={{fontSize:13,fontWeight:800,
                  color:s.overallPct>=90?'#C0392B':s.overallPct>=50?'#B8860B':'#1E8449'}}>
                  {s.overallPct}% Complete
                </span>
              </div>
              <ProgressBar pct={s.overallPct} height={12}/>
            </div>
          </div>

          {/* ── BY HOUSE TAB ── */}
          {activeTab==='ByHouse'&&(
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
              <div style={{padding:'10px 16px',background:'#6E2C00',color:'#fff',fontWeight:700}}>
                🏠 Estimate vs Actual — By House
              </div>
              {(data?.commonAreaWork && (data.commonAreaWork.estTotal>0 || data.commonAreaWork.doneTotal>0)) && (
                <div style={{padding:'10px 16px',background:'#FAF8FA',borderBottom:'1px solid #E8E0E8',fontSize:12}}>
                  <b>Common Area Work</b> (foundation, compound wall, shared structure — not tied to any single house):
                  {' '}Estimated {fmtC(data.commonAreaWork.estTotal)} · Actual {fmtC(data.commonAreaWork.doneTotal)} ·
                  Variance <span style={{color:data.commonAreaWork.variance>0?'#C0392B':'#1E8449',fontWeight:700}}>
                    {fmtC(data.commonAreaWork.variance)}
                  </span>
                </div>
              )}
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background:'#FDF2E9'}}>
                      <th style={{padding:'8px 12px',textAlign:'left',fontSize:11,color:'#6E2C00',fontWeight:700}}>House</th>
                      <th style={{padding:'8px 12px',textAlign:'left',fontSize:11,color:'#6E2C00',fontWeight:700}}>Owner</th>
                      <th style={{padding:'8px 12px',textAlign:'right',fontSize:11,color:'#1A5276',fontWeight:700}}>Estimated</th>
                      <th style={{padding:'8px 12px',textAlign:'right',fontSize:11,color:'#1E8449',fontWeight:700}}>Actual</th>
                      <th style={{padding:'8px 12px',textAlign:'right',fontSize:11,color:'#B8860B',fontWeight:700}}>Variance</th>
                      <th style={{padding:'8px 12px',textAlign:'center',fontSize:11,color:'#6E2C00',fontWeight:700}}>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredUnits = (data?.byUnit||[]).filter(u =>
                        houseFilter==='ALL' || houseFilter==='COMMON' || String(u.unitId)===String(houseFilter))
                      if (filteredUnits.length===0) return (
                        <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#aaa'}}>
                          {houseFilter==='COMMON' ? 'Room-wise breakdown applies to houses, not common area — switch the filter to a specific house.'
                            : 'No houses set up for this project yet — add units under Project Detail first.'}
                        </td></tr>
                      )
                      return filteredUnits.map(u=>(
                      <tr key={u.unitId} style={{borderBottom:'1px solid #F0EBF0'}}>
                        <td style={{padding:'8px 12px',fontWeight:700}}>{u.unitNo}<div style={{fontSize:10,color:'#888',fontWeight:400}}>{u.unitType}</div></td>
                        <td style={{padding:'8px 12px'}}>{u.ownerName||'—'}</td>
                        <td style={{padding:'8px 12px',textAlign:'right'}}>{fmtC(u.estTotal)}</td>
                        <td style={{padding:'8px 12px',textAlign:'right'}}>{fmtC(u.doneTotal)}</td>
                        <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,
                          color:u.variance>0?'#C0392B':u.variance<0?'#1E8449':'#888'}}>
                          {fmtC(u.variance)}
                        </td>
                        <td style={{padding:'8px 12px',width:140}}><ProgressBar pct={u.progressPct} showLabel/></td>
                      </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Room-wise drill-down — only meaningful once narrowed to one house */}
              {houseFilter!=='ALL' && houseFilter!=='COMMON' && (() => {
                const unit = unitsWithRooms.find(u=>String(u.id)===String(houseFilter))
                const rooms = unit?.rooms || []
                return (
                  <div style={{borderTop:'2px solid #E8D5C4',padding:'14px 16px',background:'#FDF9F7'}}>
                    <div style={{fontWeight:700,color:'#6E2C00',marginBottom:10,fontSize:13}}>
                      🚪 Room-Wise Status — {unit?.unitNo}
                    </div>
                    {rooms.length===0 ? (
                      <div style={{padding:20,textAlign:'center',color:'#aaa',fontSize:12}}>
                        No rooms set up for this house yet — add rooms under Project Detail → Manage Rooms.
                      </div>
                    ) : (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
                        {rooms.map(r => (
                          <div key={r.id} onClick={()=>setRoomHistoryFor(r)}
                            style={{background:'#fff',border:'1px solid #E8D5C4',borderRadius:6,padding:'10px 12px',cursor:'pointer'}}>
                            <div style={{fontSize:11,color:'#888',marginBottom:2}}>{r.roomType} <span style={{color:'#1A5276'}}>🔍</span></div>
                            <div style={{fontWeight:700,color:'#333',fontSize:12,marginBottom:6}}>{r.roomName}</div>
                            <ProgressBar pct={r.progress||0} showLabel/>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              <div style={{padding:'10px 16px',background:'#FEF9E7',fontSize:11,color:'#B8860B'}}>
                💡 This covers BOQ-tracked construction costs only. Labour, contractor, and material costs are
                still tracked at the whole-project level — not yet split per house.
              </div>
            </div>
          )}

          {/* ── BOQ ANALYSIS TAB ── */}
          {activeTab==='BOQ'&&(
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
              <div style={{padding:'10px 16px',background:'#6E2C00',color:'#fff',
                display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontWeight:700}}>📐 BOQ — Estimated vs Actual</div>
                <div style={{display:'flex',gap:8}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder='🔍 Search activity...'
                    style={{padding:'5px 10px',border:'none',borderRadius:4,fontSize:11,width:180,outline:'none'}}/>
                </div>
              </div>
              <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:'#FDF2E9'}}>
                    <th style={{padding:'8px 12px',textAlign:'left',fontSize:11,color:'#6E2C00',fontWeight:700,whiteSpace:'nowrap'}}>#</th>
                    <th style={{padding:'8px 12px',textAlign:'left',fontSize:11,color:'#6E2C00',fontWeight:700}}>🏠 House</th>
                    <th style={{padding:'8px 12px',textAlign:'left',fontSize:11,color:'#6E2C00',fontWeight:700}}>Activity / Description</th>
                    <th style={{padding:'8px 12px',textAlign:'center',fontSize:11,color:'#6E2C00',fontWeight:700}}>Unit</th>
                    {/* Estimated */}
                    <th colSpan={3} style={{padding:'8px 12px',textAlign:'center',fontSize:11,
                      color:'#1A5276',fontWeight:700,background:'#EBF5FB',borderLeft:'2px solid #AED6F1'}}>
                      📋 ESTIMATED
                    </th>
                    {/* Actual */}
                    <th colSpan={3} style={{padding:'8px 12px',textAlign:'center',fontSize:11,
                      color:'#1E8449',fontWeight:700,background:'#E8F5E9',borderLeft:'2px solid #A9DFBF'}}>
                      ✅ ACTUAL (DONE)
                    </th>
                    {/* Variance */}
                    <th colSpan={2} style={{padding:'8px 12px',textAlign:'center',fontSize:11,
                      color:'#B8860B',fontWeight:700,background:'#FEF9E7',borderLeft:'2px solid #F9E79F'}}>
                      📊 VARIANCE
                    </th>
                    <th style={{padding:'8px 12px',textAlign:'center',fontSize:11,color:'#6E2C00',fontWeight:700}}>Progress</th>
                  </tr>
                  <tr style={{background:'#FAFAFA',fontSize:10,color:'#888'}}>
                    <th style={{padding:'5px 12px'}}></th>
                    <th style={{padding:'5px 12px'}}></th>
                    <th style={{padding:'5px 12px'}}></th>
                    <th style={{padding:'5px 12px'}}></th>
                    <th style={{padding:'5px 12px',textAlign:'right',background:'#EBF5FB',borderLeft:'2px solid #AED6F1'}}>Qty</th>
                    <th style={{padding:'5px 12px',textAlign:'right',background:'#EBF5FB'}}>Rate</th>
                    <th style={{padding:'5px 12px',textAlign:'right',background:'#EBF5FB'}}>Amount</th>
                    <th style={{padding:'5px 12px',textAlign:'right',background:'#E8F5E9',borderLeft:'2px solid #A9DFBF'}}>Qty</th>
                    <th style={{padding:'5px 12px',textAlign:'right',background:'#E8F5E9'}}>%</th>
                    <th style={{padding:'5px 12px',textAlign:'right',background:'#E8F5E9'}}>Amount</th>
                    <th style={{padding:'5px 12px',textAlign:'right',background:'#FEF9E7',borderLeft:'2px solid #F9E79F'}}>Qty Var</th>
                    <th style={{padding:'5px 12px',textAlign:'right',background:'#FEF9E7'}}>Amt Var</th>
                    <th style={{padding:'5px 12px',textAlign:'center'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {boqItems.length===0?(
                    <tr><td colSpan={13} style={{padding:40,textAlign:'center',color:'#aaa'}}>
                      No BOQ items found. Add BOQ items to the project first.
                    </td></tr>
                  ):boqItems.map((b,i)=>{
                    const overQty = b.varQty > 0
                    const overAmt = b.varAmt > 0
                    return(
                      <tr key={b.id}
                        style={{background:i%2===0?'#fff':'#FAFAFA',borderBottom:'1px solid #F5EDE0'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#FEF9F5'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                        <td style={{padding:'8px 12px',color:'#aaa',fontSize:11}}>{b.slNo}</td>
                        <td style={{padding:'8px 12px',fontSize:11}}>
                          {b.unitId
                            ? <span style={{color:'#6E2C00',fontWeight:700}}>🏠 {unitMap[b.unitId]||'—'}</span>
                            : <span style={{color:'#888'}}>Common Area</span>}
                        </td>
                        <td style={{padding:'8px 12px'}}>
                          <div style={{fontWeight:700,color:'#333',fontSize:12}}>{b.activity}</div>
                          <div style={{fontSize:10,color:'#888'}}>{b.description}</div>
                        </td>
                        <td style={{padding:'8px 12px',textAlign:'center',fontSize:11,color:'#555'}}>{b.unit}</td>
                        {/* Estimated */}
                        <td style={{padding:'8px 12px',textAlign:'right',background:'#F8FBFF',
                          borderLeft:'2px solid #AED6F1',fontWeight:600}}>
                          {Number(b.estQty).toFixed(2)}
                        </td>
                        <td style={{padding:'8px 12px',textAlign:'right',background:'#F8FBFF',color:'#555',fontSize:11}}>
                          {fmtC(b.estRate)}
                        </td>
                        <td style={{padding:'8px 12px',textAlign:'right',background:'#F8FBFF',fontWeight:700,color:'#1A5276'}}>
                          {fmtC(b.estAmt)}
                        </td>
                        {/* Actual */}
                        <td style={{padding:'8px 12px',textAlign:'right',background:'#F8FFF8',
                          borderLeft:'2px solid #A9DFBF',fontWeight:600}}>
                          {Number(b.doneQty).toFixed(2)}
                        </td>
                        <td style={{padding:'8px 12px',textAlign:'right',background:'#F8FFF8',
                          fontSize:11,color:b.donePct>=100?'#C0392B':b.donePct>=75?'#B8860B':'#1E8449',
                          fontWeight:700}}>
                          {b.donePct}%
                        </td>
                        <td style={{padding:'8px 12px',textAlign:'right',background:'#F8FFF8',fontWeight:700,color:'#1E8449'}}>
                          {fmtC(b.doneAmt)}
                        </td>
                        {/* Variance */}
                        <td style={{padding:'8px 12px',textAlign:'right',background:'#FFFDF0',
                          borderLeft:'2px solid #F9E79F'}}>
                          {b.varQty!==0&&<VarBadge var={b.varQty}/>}
                          {b.varQty===0&&<span style={{color:'#1E8449',fontSize:11}}>✓</span>}
                        </td>
                        <td style={{padding:'8px 12px',textAlign:'right',background:'#FFFDF0'}}>
                          {b.varAmt!==0&&<VarBadge var={b.varAmt} isAmt/>}
                          {b.varAmt===0&&<span style={{color:'#1E8449',fontSize:11}}>✓</span>}
                        </td>
                        {/* Progress bar */}
                        <td style={{padding:'8px 16px',minWidth:120}}>
                          <ProgressBar pct={b.donePct} showLabel/>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Totals */}
                <tfoot>
                  <tr style={{background:'#FDF2E9',fontWeight:700,fontSize:13}}>
                    <td colSpan={4} style={{padding:'10px 12px',color:'#6E2C00'}}>
                      TOTAL {houseFilter!=='ALL' && <span style={{fontSize:10,fontWeight:400,color:'#888'}}>(filtered view)</span>}
                    </td>
                    <td colSpan={2} style={{padding:'10px 12px',background:'#EBF5FB',
                      borderLeft:'2px solid #AED6F1'}}></td>
                    <td style={{padding:'10px 12px',textAlign:'right',background:'#EBF5FB',
                      color:'#1A5276',fontSize:14}}>{fmtC(filteredEstTotal)}</td>
                    <td colSpan={2} style={{padding:'10px 12px',background:'#E8F5E9',
                      borderLeft:'2px solid #A9DFBF',textAlign:'right',color:'#1E8449'}}>
                      {filteredPct}%
                    </td>
                    <td style={{padding:'10px 12px',textAlign:'right',background:'#E8F5E9',
                      color:'#1E8449',fontSize:14}}>{fmtC(filteredDoneTotal)}</td>
                    <td style={{padding:'10px 12px',background:'#FEF9E7',
                      borderLeft:'2px solid #F9E79F'}}></td>
                    <td style={{padding:'10px 12px',textAlign:'right',background:'#FEF9E7'}}>
                      <VarBadge var={filteredDoneTotal-filteredEstTotal} isAmt/>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>
          )}

          {/* ── COST BREAKDOWN TAB ── */}
          {activeTab==='Cost'&&(() => {
            const selectedUnit = houseFilter!=='ALL' && houseFilter!=='COMMON'
              ? (data?.byUnit||[]).find(u=>String(u.unitId)===String(houseFilter)) : null
            const unitWithRooms = selectedUnit ? unitsWithRooms.find(u=>String(u.id)===String(selectedUnit.unitId)) : null
            return (
            <div>
              {/* House tiles — click one to drill down; real BOQ-based cost per house */}
              {(data?.byUnit||[]).length > 0 && (
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:8}}>🏠 Cost by House — click a house to drill down</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
                    <div onClick={()=>setHouseFilter('ALL')}
                      style={{background: houseFilter==='ALL' ? '#6E2C00' : '#fff', color: houseFilter==='ALL' ? '#fff' : '#333',
                        border:'1px solid #E8D5C4', borderRadius:8, padding:'10px 12px', cursor:'pointer'}}>
                      <div style={{fontSize:11,fontWeight:700,opacity:0.85}}>🏘️ Whole Project</div>
                      <div style={{fontSize:15,fontWeight:800,marginTop:4}}>{fmtC(s.actualTotal)}</div>
                      <div style={{fontSize:10,opacity:0.75,marginTop:2}}>Consolidated</div>
                    </div>
                    {data.byUnit.map(u=>(
                      <div key={u.unitId} onClick={()=>setHouseFilter(String(u.unitId))}
                        style={{background: String(houseFilter)===String(u.unitId) ? '#6E2C00' : '#fff',
                          color: String(houseFilter)===String(u.unitId) ? '#fff' : '#333',
                          border:'1px solid #E8D5C4', borderRadius:8, padding:'10px 12px', cursor:'pointer'}}>
                        <div style={{fontSize:11,fontWeight:700,opacity:0.85}}>🏠 {u.unitNo}</div>
                        <div style={{fontSize:15,fontWeight:800,marginTop:4}}>{fmtC(u.doneTotal)}</div>
                        <div style={{fontSize:10,opacity:0.75,marginTop:2}}>{u.progressPct}% done · {u.ownerName||'—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUnit ? (
                /* ── Single-house drill-down ── */
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
                    <div style={{padding:'12px 16px',background:'#6E2C00',color:'#fff',fontWeight:700}}>
                      💰 {selectedUnit.unitNo} — Estimated vs Actual
                    </div>
                    <div style={{padding:16}}>
                      {[
                        {label:'BOQ Estimated', val:selectedUnit.estTotal, color:'#1A5276'},
                        {label:'Actual Done Value', val:selectedUnit.doneTotal, color:'#1E8449'},
                        {label:'Variance', val:selectedUnit.variance, color:selectedUnit.variance>0?'#C0392B':'#1E8449'},
                      ].map(({label,val,color})=>(
                        <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #F5EDE0'}}>
                          <span style={{fontSize:12,color:'#666'}}>{label}</span>
                          <span style={{fontSize:14,fontWeight:800,color}}>{fmtC(val)}</span>
                        </div>
                      ))}
                      <div style={{marginTop:14}}>
                        <div style={{fontSize:11,color:'#888',marginBottom:6}}>Progress</div>
                        <ProgressBar pct={selectedUnit.progressPct} showLabel/>
                      </div>
                    </div>
                  </div>

                  {/* Room-wise PROGRESS (not cost — no BOQ line is ever tagged
                      to an individual room today, only to the house as a
                      whole, so this is honestly labeled as progress, not
                      a room-level cost breakdown that doesn't exist) */}
                  <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#6E2C00',marginBottom:4}}>🚪 Room-Wise Progress — {selectedUnit.unitNo}</div>
                    <div style={{fontSize:10,color:'#B8860B',marginBottom:12}}>
                      Shown as progress %, not cost — BOQ costs are tracked per house, not yet per individual room.
                    </div>
                    {(unitWithRooms?.rooms||[]).length===0 ? (
                      <div style={{padding:20,textAlign:'center',color:'#aaa',fontSize:12}}>
                        No rooms set up yet — add rooms under Project Detail → Manage Rooms.
                      </div>
                    ) : (
                      <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        {unitWithRooms.rooms.map(r=>(
                          <div key={r.id} onClick={()=>setRoomHistoryFor(r)}
                            style={{cursor:'pointer',padding:'4px 6px',borderRadius:4}}
                            onMouseEnter={e=>e.currentTarget.style.background='#FAF8FA'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                              <span style={{fontSize:12,fontWeight:700,color:'#333'}}>{r.roomName} <span style={{fontSize:9,color:'#1A5276',fontWeight:400}}>🔍 click for history</span></span>
                              <span style={{fontSize:10,color:'#888'}}>{r.roomType}</span>
                            </div>
                            <ProgressBar pct={r.progress||0} showLabel/>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── Consolidated whole-project view (unchanged) ── */
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

              {/* Left: Cost comparison */}
              <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',background:'#6E2C00',color:'#fff',fontWeight:700}}>
                  💰 Cost Breakdown — Estimated vs Actual
                </div>
                <div style={{padding:16}}>
                  {[
                    {label:'Contract Value (Revenue)',  est:s.contractValue,    act:s.totalRaBilled,  icon:'💼', estLbl:'Contract', actLbl:'Billed'},
                    {label:'BOQ Planned Cost',          est:s.estTotal,         act:s.doneTotal,      icon:'📐', estLbl:'Estimated', actLbl:'Done Value'},
                    {label:'Labour Cost',               est:s.estTotal*0.35,    act:s.actualLabourCost,icon:'👷', estLbl:'BOQ 35%', actLbl:'Actual'},
                    {label:'Contractor Cost',           est:s.estTotal*0.40,    act:s.actualContractorCost,icon:'🤝', estLbl:'BOQ 40%', actLbl:'Actual'},
                    {label:'Material Cost',             est:s.estTotal*0.20,    act:s.actualMaterialCost,icon:'📦', estLbl:'BOQ 20%', actLbl:'Actual'},
                    {label:'Total Actual Cost',         est:s.estTotal,         act:s.actualTotal,    icon:'🔢', estLbl:'Estimated', actLbl:'Actual'},
                  ].map(({label,est,act,icon,estLbl,actLbl})=>{
                    const over=act>est
                    const pctUsed=est>0?Math.round(act/est*100):0
                    return(
                      <div key={label} style={{marginBottom:16,paddingBottom:16,
                        borderBottom:'1px solid #F5EDE0'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                          <span style={{fontSize:12,fontWeight:700,color:'#333'}}>{icon} {label}</span>
                          <span style={{fontSize:11,fontWeight:700,
                            color:over?'#C0392B':'#1E8449'}}>{pctUsed}%</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                          <div style={{background:'#EBF5FB',borderRadius:5,padding:'6px 10px'}}>
                            <div style={{fontSize:9,color:'#1A5276',fontWeight:700}}>{estLbl}</div>
                            <div style={{fontSize:13,fontWeight:700,color:'#1A5276'}}>{fmtC(est)}</div>
                          </div>
                          <div style={{background:over?'#FDEDEC':'#E8F5E9',borderRadius:5,padding:'6px 10px'}}>
                            <div style={{fontSize:9,color:over?'#C0392B':'#1E8449',fontWeight:700}}>{actLbl}</div>
                            <div style={{fontSize:13,fontWeight:700,color:over?'#C0392B':'#1E8449'}}>{fmtC(act)}</div>
                          </div>
                        </div>
                        <ProgressBar pct={Math.min(pctUsed,100)} height={6}/>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right: Profit / Margin card */}
              <div>
                {/* Margin summary */}
                <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,
                  padding:16,marginBottom:12}}>
                  <div style={{fontSize:14,fontWeight:800,color:'#6E2C00',marginBottom:16}}>
                    📈 Project Margin Analysis
                  </div>
                  {[
                    ['Contract Value',     fmtC(s.contractValue),    '#6E2C00'],
                    ['Total Actual Cost',  fmtC(s.actualTotal),      '#C0392B'],
                    ['Gross Margin',       fmtC(s.grossMargin),      s.grossMargin>=0?'#1E8449':'#C0392B'],
                    ['Margin %',          `${s.marginPct}%`,         s.marginPct>=15?'#1E8449':s.marginPct>=5?'#B8860B':'#C0392B'],
                    ['RA Billed',         fmtC(s.totalRaBilled),     '#1A5276'],
                    ['Pending to Bill',   fmtC(s.contractValue-s.totalRaBilled), '#714B67'],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',
                      padding:'8px 12px',borderBottom:'1px solid #F5EDE0',
                      background:l==='Gross Margin'||l==='Margin %'?
                        (s.grossMargin>=0?'#E8F5E9':'#FDEDEC'):'transparent',
                      borderRadius:l==='Gross Margin'||l==='Margin %'?4:0}}>
                      <span style={{fontSize:12,color:'#666'}}>{l}</span>
                      <span style={{fontSize:13,fontWeight:800,color:c}}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Cost pie visual */}
                <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#6E2C00',marginBottom:12}}>
                    🥧 Actual Cost Split
                  </div>
                  {[
                    ['Labour',     s.actualLabourCost,     '#1A5276'],
                    ['Contractor', s.actualContractorCost, '#6E2C00'],
                    ['Material',   s.actualMaterialCost,   '#117A65'],
                  ].map(([l,v,c])=>{
                    const p=s.actualTotal>0?Math.round(v/s.actualTotal*100):0
                    return(
                      <div key={l} style={{marginBottom:10}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                          <span style={{fontSize:11,fontWeight:700,color:c}}>{l}</span>
                          <span style={{fontSize:11,color:'#888'}}>{fmtC(v)} ({p}%)</span>
                        </div>
                        <div style={{height:10,background:'#f0f0f0',borderRadius:5,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${p}%`,background:c,borderRadius:5}}/>
                        </div>
                      </div>
                    )
                  })}
                  {s.actualTotal===0&&(
                    <div style={{textAlign:'center',color:'#aaa',fontSize:12,padding:20}}>
                      No actual cost data yet
                    </div>
                  )}
                </div>
              </div>
            </div>
              )}
            </div>
          )})()}

          {/* ── TIMELINE TAB ── */}
          {activeTab==='Timeline'&&(() => {
            // House-aware: when a specific house is selected, compare THIS
            // house's own progress against the shared project timeline —
            // dates themselves are project-level (no per-house schedule
            // exists yet), but the "work done" side of the comparison
            // becomes house-specific instead of the whole project's.
            const selectedUnit = houseFilter!=='ALL' && houseFilter!=='COMMON'
              ? (data?.byUnit||[]).find(u=>String(u.unitId)===String(houseFilter)) : null
            const workPct = selectedUnit ? selectedUnit.progressPct : s.overallPct
            const workLabel = selectedUnit ? `${selectedUnit.unitNo} Progress` : 'Overall Project Progress'
            // Use this house's own dates if set, otherwise fall back to the
            // project's shared dates — and be explicit about which one is
            // actually driving the numbers, since a silently-wrong
            // assumption here is worse than no number at all.
            const usingHouseDates = selectedUnit && (selectedUnit.startDate || selectedUnit.targetDate)
            const effStartDate  = usingHouseDates ? (selectedUnit.startDate || proj.startDate) : proj.startDate
            const effTargetDate = usingHouseDates ? (selectedUnit.targetDate || proj.targetDate) : proj.targetDate
            const effActualEnd  = selectedUnit ? selectedUnit.actualEndDate : proj.actualEnd
            return (
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:'#6E2C00',marginBottom:8}}>
                📅 {selectedUnit ? `${selectedUnit.unitNo} — Plan vs Actual` : 'Project Timeline'}
              </div>
              {selectedUnit && (
                <div style={{fontSize:11,color: usingHouseDates?'#1E8449':'#B8860B',marginBottom:16,padding:'6px 10px',
                  background: usingHouseDates?'#E8F5E9':'#FEF9E7',borderRadius:6,
                  border:`1px solid ${usingHouseDates?'#A9DFBF':'#F9E79F'}`}}>
                  {usingHouseDates
                    ? `✅ Using ${selectedUnit.unitNo}'s own schedule dates — set under Project Detail → Edit Details & Dates.`
                    : `⚠️ ${selectedUnit.unitNo} has no dates of its own yet — showing the whole project's shared schedule instead. Set individual dates under Edit Details & Dates for an accurate house-specific duration.`}
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
                {[
                  ['🚀 Start Date',  fmtD(effStartDate),  '#1E8449'],
                  ['🎯 Target Date', fmtD(effTargetDate), '#B8860B'],
                  ['✅ Actual End',  effActualEnd?fmtD(effActualEnd):'In Progress', '#1A5276'],
                ].map(([l,v,c])=>(
                  <div key={l} style={{background:'#FAFAFA',borderRadius:8,padding:'12px 16px',
                    borderLeft:`4px solid ${c}`,textAlign:'center'}}>
                    <div style={{fontSize:11,color:'#888',marginBottom:4}}>{l}</div>
                    <div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Days calculation */}
              {effStartDate&&effTargetDate&&(()=>{
                const start=new Date(effStartDate)
                const target=new Date(effTargetDate)
                const today=new Date()
                const totalDays=Math.ceil((target-start)/(1000*60*60*24))
                const elapsed=Math.ceil((today-start)/(1000*60*60*24))
                const remaining=Math.ceil((target-today)/(1000*60*60*24))
                const timePct=Math.min(Math.max(Math.round(elapsed/totalDays*100),0),100)
                const isOverdue=today>target&&proj.status!=='COMPLETED'
                return(
                  <div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
                      {[
                        ['Total Duration', `${totalDays} days`, '#6E2C00'],
                        ['Elapsed',`${elapsed} days (${timePct}%)`, '#1A5276'],
                        ['Remaining', isOverdue?`${Math.abs(remaining)} days OVERDUE`:`${remaining} days`, isOverdue?'#C0392B':'#1E8449'],
                        ['Progress vs Time', `Work: ${workPct}% | Time: ${timePct}%`,
                          workPct>=timePct?'#1E8449':'#C0392B'],
                      ].map(([l,v,c])=>(
                        <div key={l} style={{background:'#FAFAFA',borderRadius:6,padding:'10px 14px',
                          borderLeft:`3px solid ${c}`}}>
                          <div style={{fontSize:10,color:'#888',marginBottom:4}}>{l}</div>
                          <div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginBottom:8}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:11,color:'#888'}}>⏱ Time Elapsed</span>
                        <span style={{fontSize:11,color:'#1A5276',fontWeight:700}}>{timePct}%</span>
                      </div>
                      <div style={{height:12,background:'#EBF5FB',borderRadius:6,overflow:'hidden',position:'relative'}}>
                        <div style={{height:'100%',width:`${timePct}%`,background:'#1A5276',borderRadius:6}}/>
                        {/* Work progress overlay */}
                        <div style={{position:'absolute',top:0,left:0,height:'100%',
                          width:`${workPct}%`,background:'rgba(30,132,73,0.4)',borderRadius:6}}/>
                      </div>
                      <div style={{display:'flex',gap:16,marginTop:6,fontSize:10,color:'#888'}}>
                        <span>🔵 Time elapsed: {timePct}%</span>
                        <span>🟢 {workLabel}: {workPct}%</span>
                        {workPct>=timePct
                          ?<span style={{color:'#1E8449',fontWeight:700}}>✅ Ahead of schedule</span>
                          :<span style={{color:'#C0392B',fontWeight:700}}>⚠️ Behind schedule</span>}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )})()}
        </>)}
      </div>

      {/* ── Room History Modal — read-only drill-down: real progress log
           over time, plus this house's cost context. No editing here —
           updates only happen through DPR / Manage Rooms, this is a
           report. ── */}
      {roomHistoryFor && (
        <div onClick={()=>setRoomHistoryFor(null)}
          style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.45)',
            display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:'#fff',borderRadius:10,width:520,maxHeight:'80vh',overflow:'auto',padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#6E2C00'}}>🚪 {roomHistoryFor.roomName}</div>
                <div style={{fontSize:11,color:'#888'}}>{roomHistoryFor.roomType} · Current progress: <b style={{color:'#1E8449'}}>{roomHistoryFor.progress||0}%</b></div>
              </div>
              <button onClick={()=>setRoomHistoryFor(null)}
                style={{padding:'4px 10px',background:'#fff',color:'#6E2C00',border:'1.5px solid #6E2C00',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>✕ Close</button>
            </div>

            {/* House cost context — genuinely house-level, labeled honestly since no BOQ line is ever tagged to an individual room */}
            {(() => {
              const selectedUnit = (data?.byUnit||[]).find(u=>String(u.unitId)===String(roomHistoryFor.unitId))
              return selectedUnit && (
                <div style={{background:'#FAF8FA',border:'1px solid #E8E0E8',borderRadius:8,padding:'10px 14px',marginBottom:16}}>
                  <div style={{fontSize:10,color:'#888',marginBottom:6}}>💰 {selectedUnit.unitNo}'s overall cost (house-level — no cost is tracked per individual room)</div>
                  <div style={{display:'flex',gap:16}}>
                    <div><div style={{fontSize:9,color:'#1A5276'}}>Estimated</div><div style={{fontSize:13,fontWeight:700,color:'#1A5276'}}>{fmtC(selectedUnit.estTotal)}</div></div>
                    <div><div style={{fontSize:9,color:'#1E8449'}}>Actual</div><div style={{fontSize:13,fontWeight:700,color:'#1E8449'}}>{fmtC(selectedUnit.doneTotal)}</div></div>
                    <div><div style={{fontSize:9,color:selectedUnit.variance>0?'#C0392B':'#1E8449'}}>Variance</div><div style={{fontSize:13,fontWeight:700,color:selectedUnit.variance>0?'#C0392B':'#1E8449'}}>{fmtC(selectedUnit.variance)}</div></div>
                  </div>
                </div>
              )
            })()}

            {/* Selected add-ons — read-only here, managed from Manage Rooms */}
            {roomAddonsView.length > 0 && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:'#B8860B',marginBottom:8}}>🎨 Upgrades Selected (on top of base construction)</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {roomAddonsView.map(a => (
                    <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                      padding:'8px 10px',background:'#FEF9E7',borderRadius:6,border:'1px solid #F9E79F'}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:'#333'}}>{a.addonMaster?.addonName} <span style={{fontSize:9,color:'#B8860B'}}>({a.addonMaster?.grade})</span></div>
                        <div style={{fontSize:10,color:'#888'}}>{fmtC(a.amount)}</div>
                      </div>
                      <div style={{fontSize:11,fontWeight:700,color:'#1E8449'}}>{a.progress}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress history — real logged changes, work dimension */}
            <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:10}}>📋 Progress History (Work)</div>
            {roomHistoryLoading ? (
              <div style={{padding:30,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
            ) : roomHistory.length===0 ? (
              <div style={{padding:30,textAlign:'center',color:'#aaa',fontSize:12}}>
                No progress updates logged yet for this room — updates get recorded here once someone changes this room's % under Project Detail → Manage Rooms.
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {roomHistory.map(h => (
                  <div key={h.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'10px 12px',background:'#FAFAFA',borderRadius:6,border:'1px solid #F0EBF0'}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:'#333'}}>
                        {h.oldProgress}% → <span style={{color:'#1E8449'}}>{h.newProgress}%</span>
                      </div>
                      <div style={{fontSize:10,color:'#888'}}>by {h.updatedBy||'Site Team'}{h.remarks?` · ${h.remarks}`:''}</div>
                    </div>
                    <div style={{fontSize:11,color:'#888',textAlign:'right'}}>
                      {new Date(h.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                      <div style={{fontSize:9}}>{new Date(h.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Print HTML builder
function buildPrintHTML(data){
  const s=data.summary||{}
  const proj=data.project||{}
  const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
  const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'
  return`<!DOCTYPE html><html><head><title>Est vs Actual — ${proj.projectName}</title>
<style>
  body{font-family:Arial,sans-serif;margin:20px;font-size:11px;color:#333}
  h1{color:#6E2C00;font-size:18px;margin:0}
  .kpi{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:12px 0}
  .kpi-box{border:1px solid #ddd;border-radius:4px;padding:8px;text-align:center}
  .kpi-box label{font-size:9px;color:#888;display:block}
  .kpi-box span{font-size:14px;font-weight:700;color:#6E2C00}
  table{width:100%;border-collapse:collapse;margin:12px 0;font-size:10px}
  th{background:#6E2C00;color:#fff;padding:6px 8px;text-align:left}
  th.est{background:#1A5276}
  th.act{background:#1E8449}
  th.var{background:#B8860B}
  td{padding:5px 8px;border-bottom:1px solid #eee}
  .tr-alt{background:#FAFAFA}
  .tr-total{background:#FDF2E9;font-weight:700}
  .over{color:#C0392B}.under{color:#1E8449}
  .footer{text-align:center;margin-top:16px;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:8px}
  @media print{.no-print{display:none}}
</style></head><body>
<div class="no-print" style="margin-bottom:12px">
  <button onclick="window.print()" style="padding:7px 16px;background:#6E2C00;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700">🖨️ Print</button>
  <button onclick="window.close()" style="padding:7px 16px;background:#f0f0f0;border:none;border-radius:4px;cursor:pointer;margin-left:8px">✕ Close</button>
</div>
<h1>📊 Estimation vs Actual Report</h1>
<p style="color:#888;margin:4px 0 12px">${proj.projectCode} — ${proj.projectName} | ${proj.clientName} | ${proj.siteLocation}</p>
<div class="kpi">
  <div class="kpi-box"><label>Contract Value</label><span>${fmtC(s.contractValue)}</span></div>
  <div class="kpi-box"><label>BOQ Estimated</label><span>${fmtC(s.estTotal)}</span></div>
  <div class="kpi-box"><label>Work Done</label><span>${fmtC(s.doneTotal)}</span></div>
  <div class="kpi-box"><label>Actual Spent</label><span>${fmtC(s.actualTotal)}</span></div>
  <div class="kpi-box"><label>RA Billed</label><span>${fmtC(s.totalRaBilled)}</span></div>
  <div class="kpi-box"><label>Gross Margin</label><span style="color:${s.grossMargin>=0?'#1E8449':'#C0392B'}">${fmtC(s.grossMargin)}</span></div>
</div>
<table>
  <thead>
    <tr>
      <th>#</th><th>Activity</th><th>Unit</th>
      <th class="est">Est Qty</th><th class="est">Est Rate</th><th class="est">Est Amt</th>
      <th class="act">Done Qty</th><th class="act">Done %</th><th class="act">Done Amt</th>
      <th class="var">Qty Var</th><th class="var">Amt Var</th>
    </tr>
  </thead>
  <tbody>
    ${(data.boqItems||[]).map((b,i)=>`
    <tr class="${i%2?'tr-alt':''}">
      <td>${b.slNo}</td>
      <td><strong>${b.activity}</strong><br><small style="color:#888">${b.description}</small></td>
      <td>${b.unit}</td>
      <td>${Number(b.estQty).toFixed(2)}</td>
      <td>${fmtC(b.estRate)}</td>
      <td style="color:#1A5276;font-weight:700">${fmtC(b.estAmt)}</td>
      <td>${Number(b.doneQty).toFixed(2)}</td>
      <td style="font-weight:700;color:${b.donePct>=100?'#C0392B':'#1E8449'}">${b.donePct}%</td>
      <td style="color:#1E8449;font-weight:700">${fmtC(b.doneAmt)}</td>
      <td class="${b.varQty>0?'over':'under'}">${b.varQty>0?'▲':'▼'} ${Math.abs(b.varQty).toFixed(2)}</td>
      <td class="${b.varAmt>0?'over':'under'}">${b.varAmt>0?'▲':'▼'} ${fmtC(Math.abs(b.varAmt))}</td>
    </tr>`).join('')}
    <tr class="tr-total">
      <td colspan="5">TOTAL</td>
      <td style="color:#1A5276">${fmtC(s.estTotal)}</td>
      <td></td><td>${s.overallPct}%</td>
      <td style="color:#1E8449">${fmtC(s.doneTotal)}</td>
      <td colspan="2"></td>
    </tr>
  </tbody>
</table>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
  <div>
    <strong style="color:#6E2C00">Cost Breakdown</strong>
    <table><thead><tr><th>Item</th><th>Estimated</th><th>Actual</th></tr></thead>
    <tbody>
      <tr><td>Labour</td><td>${fmtC(s.estTotal*0.35)}</td><td>${fmtC(s.actualLabourCost)}</td></tr>
      <tr class="tr-alt"><td>Contractor</td><td>${fmtC(s.estTotal*0.40)}</td><td>${fmtC(s.actualContractorCost)}</td></tr>
      <tr><td>Material</td><td>${fmtC(s.estTotal*0.20)}</td><td>${fmtC(s.actualMaterialCost)}</td></tr>
      <tr class="tr-total"><td>Total</td><td>${fmtC(s.estTotal)}</td><td>${fmtC(s.actualTotal)}</td></tr>
    </tbody></table>
  </div>
  <div>
    <strong style="color:#6E2C00">Margin Summary</strong>
    <table><tbody>
      <tr><td>Contract Value</td><td style="font-weight:700">${fmtC(s.contractValue)}</td></tr>
      <tr class="tr-alt"><td>Total Actual Cost</td><td style="font-weight:700">${fmtC(s.actualTotal)}</td></tr>
      <tr><td>Gross Margin</td><td style="font-weight:700;color:${s.grossMargin>=0?'#1E8449':'#C0392B'}">${fmtC(s.grossMargin)}</td></tr>
      <tr class="tr-alt"><td>Margin %</td><td style="font-weight:700;color:${s.marginPct>=15?'#1E8449':'#C0392B'}">${s.marginPct}%</td></tr>
    </tbody></table>
  </div>
</div>
<div class="footer">LNV ERP Construction Suite | Generated: ${new Date().toLocaleDateString('en-IN')} | Confidential</div>
</body></html>`
}
