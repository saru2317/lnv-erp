import React,{useState,useEffect,useCallback}from 'react'
import toast from 'react-hot-toast'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'
const inp={padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}
const lbl={fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}

const STATUS_CFG={
  DRAFT:    {bg:'#F5F5F5',color:'#666'},
  SUBMITTED:{bg:'#EBF5FB',color:'#1A5276'},
  APPROVED: {bg:'#E8F5E9',color:'#1E8449'},
  PAID:     {bg:'#F0EBF0',color:'#714B67'},
}

export default function ContractorBill(){
  const [projects,  setProjects]  = useState([])
  const [wos,       setWOs]       = useState([])
  const [bills,     setBills]     = useState([])
  const [selProject,setSelProject]= useState('')
  const [selWO,     setSelWO]     = useState('')
  const [woDetail,  setWODetail]  = useState(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [form,setForm]=useState({
    periodFrom:'',periodTo:'',measuredQty:'',rate:'',
    tdsAmt:'0',otherDeduct:'0',jmsRef:'',remarks:''
  })
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  // Computed
  const grossAmt=parseFloat(form.measuredQty||0)*parseFloat(form.rate||0)
  const netPayable=grossAmt-parseFloat(form.tdsAmt||0)-parseFloat(form.otherDeduct||0)

  // Load projects
  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{})
  },[])

  // Load WOs when project selected
  useEffect(()=>{
    if(!selProject){setWOs([]);setSelWO('');setWODetail(null);setBills([]);return}
    fetch(`${BASE}/civil/contractor-wo?projectId=${selProject}`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setWOs(d.data||[])).catch(()=>{})
  },[selProject])

  // Load WO detail + bills when WO selected
  const loadWO=useCallback(async(woId)=>{
    if(!woId){setWODetail(null);setBills([]);return}
    setLoading(true)
    try{
      const r=await fetch(`${BASE}/civil/contractor-wo/${woId}`,{headers:hdr2()})
      const d=await r.json()
      setWODetail(d.data)
      setBills(d.data?.bills||[])
      // Pre-fill rate from WO
      if(d.data?.rate) set('rate',String(d.data.rate))
    }catch{}finally{setLoading(false)}
  },[])

  useEffect(()=>{loadWO(selWO)},[selWO])

  // Save bill → POST /civil/contractor-wo/:id/bill
  const save=async()=>{
    if(!selWO)return toast.error('Select a Work Order')
    if(!form.measuredQty||!form.rate)return toast.error('Measured Qty and Rate required')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/civil/contractor-wo/${selWO}/bill`,{
        method:'POST',headers:hdr(),
        body:JSON.stringify({
          projectId:   parseInt(selProject),
          periodFrom:  form.periodFrom||null,
          periodTo:    form.periodTo||null,
          measuredQty: parseFloat(form.measuredQty),
          rate:        parseFloat(form.rate),
          grossAmt,
          tdsAmt:      parseFloat(form.tdsAmt||0),
          otherDeduct: parseFloat(form.otherDeduct||0),
          netPayable,
          jmsRef:      form.jmsRef||null,
        })
      })
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`✅ ${d.data.billNo} created!`)
      setShowAdd(false)
      setForm({periodFrom:'',periodTo:'',measuredQty:'',rate:woDetail?.rate||'',tdsAmt:'0',otherDeduct:'0',jmsRef:'',remarks:''})
      loadWO(selWO)
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  const updateStatus=async(billId,status)=>{
    try{
      await fetch(`${BASE}/civil/contractor-wo/${selWO}/bill/${billId}`,{
        method:'PATCH',headers:hdr(),body:JSON.stringify({status})
      }).catch(()=>
        // fallback if individual bill PATCH not wired
        fetch(`${BASE}/civil-ext/contractor-bills/${billId}`,{method:'PATCH',headers:hdr(),body:JSON.stringify({status})})
      )
      toast.success(`Status → ${status}`)
      loadWO(selWO)
    }catch{toast.error('Failed')}
  }

  const proj=projects.find(p=>String(p.id)===String(selProject))
  const wo=wos.find(w=>String(w.id)===String(selWO))

  return(
    <div style={{fontFamily:'DM Sans,sans-serif',display:'flex',flexDirection:'column',height:'100%'}}>

      {/* Sticky Header */}
      <div style={{position:'sticky',top:-16,zIndex:100,background:'#fff',
        margin:'-16px -16px 0 -16px',
        borderBottom:'2px solid #E8E0E8',boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px'}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>🧾 Contractor Bills</div>
            <div style={{fontSize:11,color:'#888'}}>Bill against Work Orders · Linked to BOQ</div>
          </div>
          {selWO&&(
            <button onClick={()=>setShowAdd(true)}
              style={{padding:'8px 18px',background:'#6E2C00',color:'#fff',border:'none',
                borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
              + New Bill
            </button>
          )}
        </div>

        {/* Project + WO Selectors */}
        <div style={{padding:'10px 16px',background:'#FAFAFA',borderTop:'1px solid #F0EDE8',
          display:'flex',gap:10,alignItems:'center'}}>
          <select value={selProject} onChange={e=>{setSelProject(e.target.value);setSelWO('')}}
            style={{...inp,width:240}}>
            <option value=''>Select Project</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
          </select>
          <select value={selWO} onChange={e=>setSelWO(e.target.value)}
            disabled={!selProject} style={{...inp,width:280,opacity:selProject?1:0.5}}>
            <option value=''>Select Work Order</option>
            {wos.map(w=><option key={w.id} value={w.id}>{w.woNo} — {w.contractorName} ({w.activity})</option>)}
          </select>
          {selProject&&wos.length===0&&(
            <div style={{fontSize:11,color:'#C0392B'}}>⚠️ No Work Orders for this project. Create one first.</div>
          )}
        </div>
      </div>

      {/* WO Summary Card */}
      {woDetail&&(
        <div style={{margin:'12px 0',background:'#fff',border:'1px solid #E8E0E8',
          borderRadius:8,padding:16}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
            {[
              ['🤝 Contractor', woDetail.contractorName],
              ['🔧 Activity',   woDetail.activity],
              ['📐 Rate Basis', `${fmtC(woDetail.rate)} / ${woDetail.unit}`],
              ['📊 Total Billed',fmtC(bills.filter(b=>b.status!=='DRAFT').reduce((s,b)=>s+Number(b.grossAmt||0),0))],
              ['💰 Net Payable', fmtC(bills.filter(b=>b.status!=='DRAFT').reduce((s,b)=>s+Number(b.netPayable||0),0))],
            ].map(([l,v])=>(
              <div key={l} style={{textAlign:'center',padding:'8px 12px',
                background:'#FDF2E9',borderRadius:6}}>
                <div style={{fontSize:10,color:'#888',marginBottom:4}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:'#6E2C00'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bills Table */}
      <div style={{flex:1,overflowY:'auto',overflowX:'auto',background:'#fff',
        border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
        {!selProject?(
          <div style={{padding:80,textAlign:'center',color:'#aaa'}}>
            <div style={{fontSize:48,marginBottom:12}}>🧾</div>
            <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:6}}>Select a Project</div>
            <div style={{fontSize:12}}>Then select a Work Order to view bills</div>
          </div>
        ):!selWO?(
          <div style={{padding:60,textAlign:'center',color:'#aaa'}}>
            <div style={{fontSize:40,marginBottom:10}}>📋</div>
            <div style={{fontSize:13,fontWeight:600,color:'#555'}}>Select a Work Order to view bills</div>
          </div>
        ):loading?(
          <div style={{padding:60,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
        ):bills.length===0?(
          <div style={{padding:60,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>🧾</div>
            <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:6}}>No Bills Yet</div>
            <button onClick={()=>setShowAdd(true)}
              style={{padding:'9px 22px',background:'#6E2C00',color:'#fff',border:'none',
                borderRadius:6,cursor:'pointer',fontWeight:700}}>+ Create First Bill</button>
          </div>
        ):(
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#6E2C00',color:'#fff'}}>
                {['Bill No','Period','Qty','Rate','Gross Amt','TDS','Net Payable','Status','Actions'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,fontWeight:600,whiteSpace:'nowrap',background:'#6E2C00'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bills.map((b,i)=>{
                const sc=STATUS_CFG[b.status]||STATUS_CFG.DRAFT
                return(
                  <tr key={b.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FEF9F5'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDF9F7'}>
                    <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:10,color:'#6E2C00',fontWeight:700}}>{b.billNo}</td>
                    <td style={{padding:'9px 12px',fontSize:11,color:'#555',whiteSpace:'nowrap'}}>
                      {b.periodFrom?`${fmtD(b.periodFrom)} → ${fmtD(b.periodTo)}`:'—'}
                    </td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontWeight:600}}>{Number(b.measuredQty||0).toFixed(2)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right'}}>{fmtC(b.rate)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#6E2C00'}}>{fmtC(b.grossAmt)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',color:'#C0392B'}}>{fmtC(b.tdsAmt)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#1E8449'}}>{fmtC(b.netPayable)}</td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:sc.bg,color:sc.color}}>{b.status}</span>
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <div style={{display:'flex',gap:4}}>
                        {b.status==='DRAFT'&&(
                          <button onClick={()=>updateStatus(b.id,'SUBMITTED')}
                            style={{padding:'4px 8px',background:'#EBF5FB',color:'#1A5276',
                              border:'1px solid #AED6F1',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                            Submit
                          </button>
                        )}
                        {b.status==='SUBMITTED'&&(
                          <button onClick={()=>updateStatus(b.id,'APPROVED')}
                            style={{padding:'4px 8px',background:'#E8F5E9',color:'#1E8449',
                              border:'1px solid #A9DFBF',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                            Approve
                          </button>
                        )}
                        {b.status==='APPROVED'&&(
                          <button onClick={()=>updateStatus(b.id,'PAID')}
                            style={{padding:'4px 8px',background:'#F0EBF0',color:'#714B67',
                              border:'1px solid #D7BDE2',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Totals row */}
            <tfoot>
              <tr style={{background:'#FDF2E9',fontWeight:700}}>
                <td colSpan={4} style={{padding:'9px 12px',fontSize:12,color:'#6E2C00'}}>TOTAL</td>
                <td style={{padding:'9px 12px',textAlign:'right',color:'#6E2C00'}}>
                  {fmtC(bills.reduce((s,b)=>s+Number(b.grossAmt||0),0))}
                </td>
                <td style={{padding:'9px 12px',textAlign:'right',color:'#C0392B'}}>
                  {fmtC(bills.reduce((s,b)=>s+Number(b.tdsAmt||0),0))}
                </td>
                <td style={{padding:'9px 12px',textAlign:'right',color:'#1E8449'}}>
                  {fmtC(bills.reduce((s,b)=>s+Number(b.netPayable||0),0))}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ── ADD BILL MODAL ── */}
      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:540,
            boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#6E2C00'}}>🧾 New Contractor Bill</div>
                <div style={{fontSize:11,color:'#888'}}>{wo?.woNo} — {wo?.contractorName}</div>
              </div>
              <button onClick={()=>setShowAdd(false)}
                style={{background:'#f0f0f0',border:'none',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontWeight:700,fontSize:14}}>✕</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div><label style={lbl}>Bill Period From</label>
                <input type='date' value={form.periodFrom} onChange={e=>set('periodFrom',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Bill Period To</label>
                <input type='date' value={form.periodTo} onChange={e=>set('periodTo',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Measured Quantity ({wo?.unit||'Unit'}) *</label>
                <input type='number' value={form.measuredQty} onChange={e=>set('measuredQty',e.target.value)}
                  placeholder='0.00' step='0.01' style={{...inp,fontSize:14,fontWeight:700}}/></div>
              <div><label style={lbl}>Rate (₹/{wo?.unit||'Unit'}) *</label>
                <input type='number' value={form.rate} onChange={e=>set('rate',e.target.value)}
                  placeholder='0.00' step='0.01' style={{...inp,fontSize:14,fontWeight:700}}/></div>
              <div><label style={lbl}>TDS Amount (₹)</label>
                <input type='number' value={form.tdsAmt} onChange={e=>set('tdsAmt',e.target.value)}
                  placeholder='0.00' step='0.01' style={inp}/></div>
              <div><label style={lbl}>Other Deductions (₹)</label>
                <input type='number' value={form.otherDeduct} onChange={e=>set('otherDeduct',e.target.value)}
                  placeholder='0.00' step='0.01' style={inp}/></div>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>JMS / Reference No</label>
                <input value={form.jmsRef} onChange={e=>set('jmsRef',e.target.value)}
                  placeholder='Bill ref / measurement book ref' style={inp}/></div>
            </div>

            {/* Live calculation */}
            <div style={{marginTop:14,background:'#F8F5F8',borderRadius:8,padding:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,textAlign:'center'}}>
                {[
                  ['Gross Amount', fmtC(grossAmt), '#6E2C00'],
                  ['TDS + Deductions', fmtC(parseFloat(form.tdsAmt||0)+parseFloat(form.otherDeduct||0)), '#C0392B'],
                  ['Net Payable', fmtC(netPayable), '#1E8449'],
                ].map(([l,v,c])=>(
                  <div key={l} style={{background:'#fff',borderRadius:6,padding:'8px 12px',
                    border:`1.5px solid ${c}33`}}>
                    <div style={{fontSize:10,color:'#888',marginBottom:4}}>{l}</div>
                    <div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:16}}>
              <button onClick={()=>setShowAdd(false)}
                style={{padding:'8px 18px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={save} disabled={saving}
                style={{padding:'8px 24px',background:'#6E2C00',color:'#fff',border:'none',
                  borderRadius:5,cursor:'pointer',fontWeight:700,opacity:saving?0.6:1}}>
                {saving?'⏳ Saving...':'💾 Save Bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
