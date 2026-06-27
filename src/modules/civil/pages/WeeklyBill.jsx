import React,{useState,useEffect,useCallback}from 'react'
import toast from 'react-hot-toast'

const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'
const fmtDay=d=>d?new Date(d).toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short'}):'—'
const inp={padding:'7px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',boxSizing:'border-box'}
const lbl={fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}

// Get Monday of current week
const getMondayOfWeek=(date=new Date())=>{
  const d=new Date(date)
  const day=d.getDay()
  d.setDate(d.getDate()-(day===0?6:day-1))
  d.setHours(0,0,0,0)
  return d.toISOString().slice(0,10)
}
const getSunday=(monday)=>{
  const d=new Date(monday)
  d.setDate(d.getDate()+6)
  return d.toISOString().slice(0,10)
}
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function WeeklyBill(){
  const [projects,  setProjects]  = useState([])
  const [wos,       setWOs]       = useState([])
  const [weeks,     setWeeks]     = useState([])
  const [selProject,setSelProject]= useState('')
  const [selWO,     setSelWO]     = useState('')
  const [selWeek,   setSelWeek]   = useState(getMondayOfWeek())
  const [weekData,  setWeekData]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  // Daily log entry form
  const [logForm,   setLogForm]   = useState({})
  const setLog=(day,field,val)=>setLogForm(f=>({...f,[day]:{...(f[day]||{}), [field]:val}}))

  // Load projects
  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{})
  },[])

  // Load WOs when project changes
  useEffect(()=>{
    if(!selProject){setWOs([]);setSelWO('');setWeekData(null);return}
    fetch(`${BASE}/civil/contractor-wo?projectId=${selProject}`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setWOs(d.data||[])).catch(()=>{})
  },[selProject])

  // Load available weeks when WO changes
  useEffect(()=>{
    if(!selWO){setWeeks([]);setWeekData(null);return}
    fetch(`${BASE}/civil/contractor-wo/${selWO}/weeks`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setWeeks(d.data||[])).catch(()=>{})
  },[selWO])

  // Load week data
  const loadWeek=useCallback(async()=>{
    if(!selWO||!selWeek)return
    setLoading(true)
    try{
      const r=await fetch(`${BASE}/civil/contractor-wo/${selWO}/weekly?weekStart=${selWeek}`,{headers:hdr2()})
      const d=await r.json()
      setWeekData(d.data)
      // Pre-fill log form with existing data
      const form={}
      const sunday=getSunday(selWeek)
      for(let i=0;i<7;i++){
        const d2=new Date(selWeek)
        d2.setDate(d2.getDate()+i)
        const dateStr=d2.toISOString().slice(0,10)
        const existing=d.data?.logs?.find(l=>l.date?.slice(0,10)===dateStr)
        form[dateStr]={
          workDone: existing?Number(existing.workDone):'',
          labourCount: existing?Number(existing.labourCount):'',
          machineHrs: existing?Number(existing.machineHrs||0):'',
          remarks: existing?.remarks||'',
          saved: !!existing,
          logId: existing?.id,
        }
      }
      setLogForm(form)
    }catch{toast.error('Failed to load week data')}finally{setLoading(false)}
  },[selWO,selWeek])

  useEffect(()=>{loadWeek()},[loadWeek])

  // Save daily log entry
  const saveLog=async(dateStr)=>{
    const entry=logForm[dateStr]
    if(!entry?.workDone&&entry?.workDone!==0)return toast.error('Enter work done quantity')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/civil/contractor-wo/${selWO}/log`,{
        method:'POST',headers:hdr(),
        body:JSON.stringify({
          date:dateStr,
          workDone:parseFloat(entry.workDone||0),
          labourCount:parseInt(entry.labourCount||0),
          machineHrs:parseFloat(entry.machineHrs||0),
          remarks:entry.remarks||'',
        })
      })
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`✅ ${fmtD(dateStr)} saved!`)
      setLog(dateStr,'saved',true)
      setLog(dateStr,'logId',d.data?.id)
      loadWeek()
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  // Generate Word document
  const generateDoc=async()=>{
    if(!weekData)return
    toast.loading('Generating document...',{id:'doc'})
    try{
      const company=JSON.parse(localStorage.getItem('lnv_company')||'{}')
      const proj=projects.find(p=>String(p.id)===String(selProject))
      const wo=weekData.wo
      const logs=weekData.logs||[]
      const summary=weekData.summary||{}
      const weekEnd=getSunday(selWeek)

      // Dynamic import of docx for browser
      const {
        Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,
        AlignmentType,BorderStyle,WidthType,ShadingType,VerticalAlign
      } = await import('https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.min.js').catch(()=>{
        // fallback: generate HTML and print
        return null
      })

      if(!Document){
        // Fallback: HTML print version
        generateHTMLPrint(company,proj,wo,logs,summary,weekEnd)
        toast.dismiss('doc')
        return
      }

      toast.success('Document ready!',{id:'doc'})
    }catch(e){
      toast.error('Doc generation failed — using print preview',{id:'doc'})
      const company=JSON.parse(localStorage.getItem('lnv_company')||'{}')
      const proj=projects.find(p=>String(p.id)===String(selProject))
      generateHTMLPrint(company,proj,weekData.wo,weekData.logs||[],weekData.summary||{},getSunday(selWeek))
    }
  }

  const generateHTMLPrint=(company,proj,wo,logs,summary,weekEnd)=>{
    const html=`<!DOCTYPE html>
<html><head><title>Contractor Weekly Bill</title>
<style>
  body{font-family:Arial,sans-serif;margin:20px;font-size:12px;color:#333}
  .header{text-align:center;border-bottom:3px solid #6E2C00;padding-bottom:10px;margin-bottom:20px}
  .header h1{color:#6E2C00;font-size:22px;margin:0}
  .header h2{font-size:16px;margin:5px 0;color:#555}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px}
  .info-box{border:1px solid #ddd;border-radius:5px;padding:12px}
  .info-box h3{margin:0 0 8px;color:#6E2C00;font-size:11px;text-transform:uppercase}
  .info-row{display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px}
  .info-row label{color:#888}
  .info-row span{font-weight:700}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  th{background:#6E2C00;color:#fff;padding:8px;font-size:11px;text-align:left}
  td{padding:7px 8px;border-bottom:1px solid #eee;font-size:11px}
  .tr-alt{background:#FDF9F7}
  .tr-total{background:#FDF2E9;font-weight:700;color:#6E2C00}
  .tr-holiday{background:#FFF5F5;color:#C0392B}
  .summary-box{border:2px solid #6E2C00;border-radius:8px;padding:16px;width:340px;margin-left:auto;margin-bottom:20px}
  .sum-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;font-size:12px}
  .sum-total{display:flex;justify-content:space-between;padding:8px;background:#6E2C00;color:#fff;font-weight:700;font-size:14px;border-radius:4px;margin-top:6px}
  .sign-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;margin-top:20px}
  .sign-box{border:1px solid #ddd;border-radius:5px;padding:12px;text-align:center}
  .sign-box h4{color:#6E2C00;margin:0 0 40px;font-size:11px}
  .sign-box p{margin:0;font-size:10px;color:#888;border-top:1px solid #ddd;padding-top:6px}
  .footer{text-align:center;margin-top:20px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:10px}
  @media print{body{margin:0}.no-print{display:none}}
</style></head><body>
<div class="no-print" style="margin-bottom:15px">
  <button onclick="window.print()" style="padding:8px 20px;background:#6E2C00;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:13px;font-weight:700">🖨️ Print / Save as PDF</button>
  <button onclick="window.close()" style="padding:8px 20px;background:#f0f0f0;border:none;border-radius:5px;cursor:pointer;font-size:13px;margin-left:10px">✕ Close</button>
</div>

<div class="header">
  <h1>${company?.name||'LNV ERP Construction Suite'}</h1>
  <h2>CONTRACTOR WEEKLY BILL</h2>
  <p style="margin:4px;color:#666">Bill No: <strong>CWB-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9999)+1).padStart(4,'0')}</strong> &nbsp;|&nbsp; 
     Week: <strong>${fmtD(selWeek)} to ${fmtD(weekEnd)}</strong></p>
</div>

<div class="info-grid">
  <div class="info-box">
    <h3>📋 Project Details</h3>
    <div class="info-row"><label>Project Code</label><span>${proj?.projectCode||'—'}</span></div>
    <div class="info-row"><label>Project Name</label><span>${proj?.projectName||'—'}</span></div>
    <div class="info-row"><label>Site Location</label><span>${proj?.siteLocation||'—'}</span></div>
    <div class="info-row"><label>Client</label><span>${proj?.clientName||'—'}</span></div>
  </div>
  <div class="info-box">
    <h3>🤝 Contractor Details</h3>
    <div class="info-row"><label>Contractor</label><span>${wo?.contractorName||'—'}</span></div>
    <div class="info-row"><label>Phone</label><span>${wo?.contractorPhone||'—'}</span></div>
    <div class="info-row"><label>Work Order No</label><span>${wo?.woNo||'—'}</span></div>
    <div class="info-row"><label>Activity</label><span>${wo?.activity||'—'}</span></div>
    <div class="info-row"><label>Rate</label><span>${fmtC(wo?.rate||0)} / ${wo?.unit||'Unit'}</span></div>
  </div>
</div>

<p style="color:#6E2C00;font-weight:700;margin-bottom:8px">📝 Work Scope: <span style="font-weight:400;color:#333">${wo?.scope||'—'}</span></p>

<table>
  <thead>
    <tr>
      <th>#</th><th>Date / Day</th><th>Qty (${wo?.unit||'Unit'})</th><th>Labour</th><th>Mach.Hrs</th><th>Rate (₹)</th><th>Amount (₹)</th><th>Remarks</th>
    </tr>
  </thead>
  <tbody>
    ${Array.from({length:7},(_,i)=>{
      const d2=new Date(selWeek); d2.setDate(d2.getDate()+i)
      const dateStr=d2.toISOString().slice(0,10)
      const log=logs.find(l=>l.date?.slice(0,10)===dateStr)
      const qty=log?Number(log.workDone):0
      const amt=qty*(wo?.rate||0)
      const isHoliday=!log||qty===0
      return `<tr class="${isHoliday?'tr-holiday':i%2===0?'':'tr-alt'}">
        <td>${i+1}</td>
        <td><strong>${fmtDay(dateStr)}</strong></td>
        <td style="text-align:center">${isHoliday?'—':qty.toFixed(3)}</td>
        <td style="text-align:center">${isHoliday?'—':log?.labourCount||0}</td>
        <td style="text-align:center">${isHoliday?'—':Number(log?.machineHrs||0).toFixed(1)}</td>
        <td style="text-align:right">${isHoliday?'—':fmtC(wo?.rate||0)}</td>
        <td style="text-align:right;font-weight:700">${isHoliday?'—':fmtC(amt)}</td>
        <td>${log?.remarks||isHoliday?'Holiday / No work':''}</td>
      </tr>`
    }).join('')}
    <tr class="tr-total">
      <td colspan="2">TOTAL</td>
      <td style="text-align:center">${Number(summary.totalQty||0).toFixed(3)}</td>
      <td style="text-align:center">${summary.totalLabour||0}</td>
      <td colspan="2"></td>
      <td style="text-align:right">${fmtC(summary.grossAmt||0)}</td>
      <td></td>
    </tr>
  </tbody>
</table>

<div class="summary-box">
  <div style="font-weight:700;color:#6E2C00;margin-bottom:10px;font-size:13px">💰 BILL SUMMARY</div>
  <div class="sum-row"><span>Total Qty (${wo?.unit||'Unit'})</span><strong>${Number(summary.totalQty||0).toFixed(3)}</strong></div>
  <div class="sum-row"><span>Rate per ${wo?.unit||'Unit'}</span><strong>${fmtC(wo?.rate||0)}</strong></div>
  <div class="sum-row"><span>Gross Amount</span><strong>${fmtC(summary.grossAmt||0)}</strong></div>
  <div class="sum-row" style="color:#C0392B"><span>TDS Deduction (${wo?.tdsRate||1}%)</span><strong>(${fmtC(summary.tdsAmt||0)})</strong></div>
  <div class="sum-total"><span>NET PAYABLE</span><span>${fmtC(summary.netPayable||0)}</span></div>
</div>

<div class="sign-grid">
  <div class="sign-box">
    <h4>Prepared By</h4>
    <p>Site Engineer / Supervisor<br>Name & Signature</p>
  </div>
  <div class="sign-box">
    <h4>Verified By</h4>
    <p>Project Manager<br>Name & Signature</p>
  </div>
  <div class="sign-box">
    <h4>Contractor Acknowledgement</h4>
    <p>${wo?.contractorName||'Contractor'}<br>Name, Signature & Date</p>
  </div>
</div>

<div class="footer">
  Generated by LNV ERP Construction Suite &nbsp;|&nbsp; ${new Date().toLocaleDateString('en-IN')} &nbsp;|&nbsp; Computer generated document
</div>
</body></html>`

    const win=window.open('','_blank','width=900,height=700')
    win.document.write(html)
    win.document.close()
  }

  const wo=wos.find(w=>String(w.id)===String(selWO))
  const proj=projects.find(p=>String(p.id)===String(selProject))
  const summary=weekData?.summary||{}
  const logs=weekData?.logs||[]

  // Build 7-day grid
  const weekDays=Array.from({length:7},(_,i)=>{
    const d=new Date(selWeek); d.setDate(d.getDate()+i)
    return d.toISOString().slice(0,10)
  })

  return(
    <div style={{fontFamily:'DM Sans,sans-serif',display:'flex',flexDirection:'column',height:'100%'}}>

      {/* Sticky Header */}
      <div style={{position:'sticky',top:-16,zIndex:100,background:'#fff',
        margin:'-16px -16px 0 -16px',
        borderBottom:'2px solid #E8E0E8',boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px'}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📋 Contractor Weekly Bill</div>
            <div style={{fontSize:11,color:'#888'}}>Daily work entry → Weekly bill → Print / Download</div>
          </div>
          {weekData&&(
            <button onClick={generateDoc}
              style={{padding:'8px 18px',background:'#1A5276',color:'#fff',border:'none',
                borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
              🖨️ Print / Download
            </button>
          )}
        </div>

        {/* Selectors */}
        <div style={{padding:'10px 16px',background:'#FAFAFA',borderTop:'1px solid #F0EDE8',
          display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <select value={selProject} onChange={e=>{setSelProject(e.target.value);setSelWO('');setWeekData(null)}}
            style={{...inp,width:250}}>
            <option value=''>Select Project</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
          </select>
          <select value={selWO} onChange={e=>setSelWO(e.target.value)}
            disabled={!selProject} style={{...inp,width:270,opacity:selProject?1:0.5}}>
            <option value=''>Select Work Order</option>
            {wos.map(w=><option key={w.id} value={w.id}>{w.woNo} — {w.contractorName}</option>)}
          </select>
          {/* Week picker */}
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <label style={{fontSize:11,color:'#888',fontWeight:600}}>Week Starting:</label>
            <input type='date' value={selWeek}
              onChange={e=>{
                // Snap to Monday
                const d=new Date(e.target.value)
                const day=d.getDay()
                d.setDate(d.getDate()-(day===0?6:day-1))
                setSelWeek(d.toISOString().slice(0,10))
              }}
              style={{...inp,width:150}}/>
            <span style={{fontSize:11,color:'#888'}}>to {fmtD(getSunday(selWeek))}</span>
          </div>
          {/* Quick week selector from existing logs */}
          {weeks.length>0&&(
            <select onChange={e=>setSelWeek(e.target.value)} value={selWeek}
              style={{...inp,width:180}}>
              <option value=''>Past weeks with data</option>
              {weeks.map(w=><option key={w.weekStart} value={w.weekStart}>
                {fmtD(w.weekStart)} ({w.logCount} entries, {Number(w.totalQty).toFixed(2)} {wo?.unit||'units'})
              </option>)}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:'auto',padding:'12px 0'}}>
        {!selWO?(
          <div style={{padding:80,textAlign:'center',color:'#aaa'}}>
            <div style={{fontSize:56,marginBottom:16}}>📋</div>
            <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:8}}>Select Project & Work Order</div>
            <div style={{fontSize:12}}>Then select a week to enter daily work logs</div>
          </div>
        ):loading?(
          <div style={{padding:60,textAlign:'center',color:'#aaa'}}>⏳ Loading week data...</div>
        ):(
          <>
            {/* WO Info Card */}
            {wo&&(
              <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,
                padding:16,marginBottom:12,display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
                {[
                  ['🤝 Contractor', wo.contractorName],
                  ['🔧 Activity',   wo.activity],
                  ['📐 Rate',       `${fmtC(wo.rate)} / ${wo.unit}`],
                  ['📊 Scope',      wo.scope?.slice(0,40)+'...'],
                  ['📋 WO No',      wo.woNo],
                ].map(([l,v])=>(
                  <div key={l} style={{background:'#FDF2E9',borderRadius:6,padding:'8px 12px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:'#888',marginBottom:4}}>{l}</div>
                    <div style={{fontSize:12,fontWeight:700,color:'#6E2C00'}}>{v||'—'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Daily Log Entry Grid */}
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden',marginBottom:12}}>
              <div style={{padding:'12px 16px',background:'#6E2C00',color:'#fff',
                display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontWeight:700,fontSize:14}}>
                  📅 Daily Work Log — {fmtD(selWeek)} to {fmtD(getSunday(selWeek))}
                </div>
                <div style={{fontSize:11,opacity:0.8}}>Enter work done each day → Save row</div>
              </div>

              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:'#FDF2E9',color:'#6E2C00'}}>
                    {['Day/Date',`Work Done (${wo?.unit||'Unit'})`,`Amount (₹)`,'Labour Count','Machine Hrs','Remarks','Action'].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,
                        borderBottom:'2px solid #E8D5C4',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekDays.map((dateStr,i)=>{
                    const entry=logForm[dateStr]||{}
                    const qty=parseFloat(entry.workDone||0)
                    const amt=qty*(wo?.rate||0)
                    const isSunday=i===6
                    const isSaved=entry.saved
                    const isWeekend=isSunday
                    return(
                      <tr key={dateStr}
                        style={{background:isWeekend?'#FFF8F0':isSaved?'#F0FFF4':i%2===0?'#fff':'#FAFAFA',
                          borderBottom:'1px solid #F5EDE0'}}>
                        <td style={{padding:'8px 12px',fontWeight:700,whiteSpace:'nowrap'}}>
                          <div style={{color:'#6E2C00'}}>{DAYS[i]}</div>
                          <div style={{fontSize:10,color:'#888'}}>{fmtD(dateStr)}</div>
                          {isSaved&&<div style={{fontSize:9,color:'#1E8449',fontWeight:700}}>✅ Saved</div>}
                        </td>
                        <td style={{padding:'8px 12px'}}>
                          <input type='number' min='0' step='0.001'
                            value={entry.workDone??''} 
                            onChange={e=>setLog(dateStr,'workDone',e.target.value)}
                            placeholder={isWeekend?'0.000':'Enter qty'}
                            style={{...inp,width:110,fontWeight:700,fontSize:13,
                              borderColor:isSaved?'#A9DFBF':'#DDD'}}/>
                        </td>
                        <td style={{padding:'8px 12px',fontWeight:700,
                          color:qty>0?'#1E8449':'#aaa',whiteSpace:'nowrap'}}>
                          {qty>0?fmtC(amt):'—'}
                        </td>
                        <td style={{padding:'8px 12px'}}>
                          <input type='number' min='0'
                            value={entry.labourCount??''}
                            onChange={e=>setLog(dateStr,'labourCount',e.target.value)}
                            placeholder='0'
                            style={{...inp,width:80}}/>
                        </td>
                        <td style={{padding:'8px 12px'}}>
                          <input type='number' min='0' step='0.5'
                            value={entry.machineHrs??''}
                            onChange={e=>setLog(dateStr,'machineHrs',e.target.value)}
                            placeholder='0.0'
                            style={{...inp,width:80}}/>
                        </td>
                        <td style={{padding:'8px 12px'}}>
                          <input value={entry.remarks||''}
                            onChange={e=>setLog(dateStr,'remarks',e.target.value)}
                            placeholder={isWeekend?'Holiday':'Work details...'}
                            style={{...inp,width:200}}/>
                        </td>
                        <td style={{padding:'8px 12px'}}>
                          <button onClick={()=>saveLog(dateStr)} disabled={saving}
                            style={{padding:'5px 12px',
                              background:isSaved?'#117A65':'#6E2C00',
                              color:'#fff',border:'none',borderRadius:4,
                              cursor:'pointer',fontSize:11,fontWeight:700,
                              whiteSpace:'nowrap',opacity:saving?0.6:1}}>
                            {isSaved?'🔄 Update':'💾 Save'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Weekly Summary */}
            {weekData&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:12}}>
                {/* Stats */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,alignContent:'start'}}>
                  {[
                    ['📦 Total Qty',     `${Number(summary.totalQty||0).toFixed(3)} ${wo?.unit||''}`, '#6E2C00','#FDF2E9'],
                    ['👷 Total Labour',  `${summary.totalLabour||0} man-days`, '#1A5276','#EBF5FB'],
                    ['📅 Work Days',     `${logs.filter(l=>Number(l.workDone)>0).length} / 7`, '#117A65','#E8F5F0'],
                    ['💰 Gross Amount',  fmtC(summary.grossAmt||0), '#B8860B','#FEF9E7'],
                  ].map(([l,v,c,bg])=>(
                    <div key={l} style={{background:bg,borderRadius:8,padding:'12px 16px',
                      border:`1px solid ${c}33`,textAlign:'center'}}>
                      <div style={{fontSize:10,color:'#888',marginBottom:4}}>{l}</div>
                      <div style={{fontSize:15,fontWeight:800,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Bill Summary Box */}
                <div style={{background:'#fff',border:'2px solid #6E2C00',borderRadius:8,padding:16}}>
                  <div style={{fontSize:13,fontWeight:800,color:'#6E2C00',marginBottom:12}}>💰 Bill Summary</div>
                  {[
                    [`Total ${wo?.unit||'Qty'}`, `${Number(summary.totalQty||0).toFixed(3)}`, '#333'],
                    [`Rate / ${wo?.unit||'Unit'}`, fmtC(wo?.rate||0), '#333'],
                    ['Gross Amount', fmtC(summary.grossAmt||0), '#333'],
                    [`TDS (${wo?.tdsRate||1}%)`, `(${fmtC(summary.tdsAmt||0)})`, '#C0392B'],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',
                      padding:'5px 0',borderBottom:'1px solid #f0f0f0',fontSize:12}}>
                      <span style={{color:'#666'}}>{l}</span>
                      <span style={{fontWeight:700,color:c}}>{v}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',
                    padding:'10px 12px',background:'#6E2C00',color:'#fff',
                    borderRadius:6,marginTop:10,fontSize:14,fontWeight:800}}>
                    <span>Net Payable</span>
                    <span>{fmtC(summary.netPayable||0)}</span>
                  </div>
                  <button onClick={generateDoc}
                    style={{width:'100%',marginTop:12,padding:'9px',background:'#1A5276',
                      color:'#fff',border:'none',borderRadius:6,cursor:'pointer',
                      fontWeight:700,fontSize:12}}>
                    🖨️ Print / Download Bill
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
