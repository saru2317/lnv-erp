import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const STATUS_CFG = {
  DRAFT:     { bg:'#F5F5F5', color:'#666',    label:'Draft' },
  SUBMITTED: { bg:'#EBF5FB', color:'#1A5276', label:'Submitted' },
  APPROVED:  { bg:'#E8F5E9', color:'#1E8449', label:'Approved' },
  PAID:      { bg:'#F0EBF0', color:'#714B67', label:'Paid' },
}

export default function RABill() {
  const nav = useNavigate()
  const [view,       setView]       = useState('list')
  const [projects,   setProjects]   = useState([])
  const [bills,      setBills]      = useState([])
  const [selProject, setSelProject] = useState('')
  const [boq,        setBOQ]        = useState([])
  const [loading,    setLoading]    = useState(false)
  const [generating, setGenerating] = useState(false)
  const [preview,    setPreview]    = useState(null)
  const [form,       setForm]       = useState({ periodFrom:'', periodTo:'', previousBilled:'0', advanceRecovery:'0', remarks:'' })

  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,{headers:hdr2()}).then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{})
  },[])

  const loadBills = async (pid='') => {
    setLoading(true)
    const url = pid ? `${BASE}/civil/ra-bills/${pid}` : `${BASE}/civil/ra-bills/0`
    if (!pid) { setBills([]); setLoading(false); return }
    const r = await fetch(url,{headers:hdr2()})
    const d = await r.json()
    setBills(d.data||[])
    setLoading(false)
  }

  const selectProject = async (pid) => {
    setSelProject(pid)
    if (!pid) { setBOQ([]); setBills([]); return }
    loadBills(pid)
    const r = await fetch(`${BASE}/civil/boq/${pid}`,{headers:hdr2()})
    const d = await r.json()
    setBOQ(d.data||[])
    // Auto-fill previous billed
    const prev = await fetch(`${BASE}/civil/ra-bills/${pid}`,{headers:hdr2()}).then(r=>r.json())
    const prevBills = (prev.data||[]).filter(b=>b.status!=='DRAFT')
    const prevTotal = prevBills.reduce((s,b)=>s+Number(b.thisBillAmt||0),0)
    setForm(f=>({...f, previousBilled:prevTotal.toString()}))
    setPreview(null)
  }

  const calcPreview = () => {
    if (!selProject || boq.length===0) return toast.error('Select project with BOQ first')
    const runningTotal = boq.reduce((s,b)=>s+Number(b.doneAmt||0),0)
    const prev         = parseFloat(form.previousBilled||0)
    const thisBill     = runningTotal - prev
    const proj         = projects.find(p=>p.id===parseInt(selProject))
    const retention    = Number(proj?.retentionPct||10)
    const lessRet      = thisBill * retention / 100
    const lessAdv      = parseFloat(form.advanceRecovery||0)
    const netPayable   = thisBill - lessRet - lessAdv
    setPreview({ runningTotal, thisBill, lessRet, lessAdv, netPayable, retention, proj })
    setView('preview')
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const r = await fetch(`${BASE}/civil/ra-bills`,{method:'POST',headers:hdr(),
        body:JSON.stringify({ projectId:selProject, previousBilled:form.previousBilled,
          periodFrom:form.periodFrom, periodTo:form.periodTo,
          advanceRecovery:form.advanceRecovery, remarks:form.remarks })})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ ${d.data.raBillNo} generated!`)
      setView('list'); loadBills(selProject)
    } catch { toast.error('Failed') }
    finally { setGenerating(false) }
  }

  const updateStatus = async (id, status) => {
    await fetch(`${BASE}/civil/ra-bills/${id}`,{method:'PATCH',headers:hdr(),body:JSON.stringify({status})})
    toast.success('Status updated'); loadBills(selProject)
  }

  const printBill = (b) => {
    const proj = projects.find(p=>p.id===parseInt(selProject))
    const html = `<!DOCTYPE html><html><head><title>RA Bill ${b.raBillNo}</title>
<style>
  body{font-family:Arial,sans-serif;margin:24px;font-size:12px;color:#333}
  .header{text-align:center;border-bottom:3px solid #6E2C00;padding-bottom:12px;margin-bottom:20px}
  .title{font-size:20px;font-weight:900;color:#6E2C00}
  .sub{font-size:13px;color:#555;margin-top:4px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
  .info-box{border:1px solid #ddd;border-radius:5px;padding:10px}
  .info-box label{font-size:9px;color:#888;text-transform:uppercase;font-weight:700;display:block;margin-bottom:3px}
  .info-box span{font-size:13px;font-weight:700;color:#333}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#6E2C00;color:#fff;padding:8px 10px;text-align:left;font-size:11px}
  td{padding:7px 10px;border-bottom:1px solid #eee;font-size:11px}
  .tr-alt{background:#FDF9F7}
  .amount-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
  .net-row{display:flex;justify-content:space-between;padding:10px 12px;background:#E8F5E9;border-radius:6px;margin-top:6px}
  .sign-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:24px}
  .sign-box{border:1px solid #ddd;border-radius:5px;padding:10px;text-align:center}
  .sign-box h4{color:#6E2C00;font-size:10px;margin:0 0 30px}
  .sign-box p{font-size:9px;color:#888;border-top:1px solid #ddd;padding-top:5px;margin:0}
  .footer{text-align:center;margin-top:16px;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:8px}
  @media print{.no-print{display:none}}
</style></head><body>
<div class="no-print" style="margin-bottom:12px">
  <button onclick="window.print()" style="padding:7px 16px;background:#6E2C00;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700">🖨️ Print / Save PDF</button>
  <button onclick="window.close()" style="padding:7px 16px;background:#f0f0f0;border:none;border-radius:4px;cursor:pointer;margin-left:8px">✕ Close</button>
</div>
<div class="header">
  <div class="title">RUNNING ACCOUNT BILL</div>
  <div class="sub">${b.raBillNo} &nbsp;|&nbsp; Date: ${fmtD(b.billDate)}</div>
</div>
<div class="info-grid">
  <div class="info-box"><label>Project</label><span>${proj?.projectName||'—'}</span></div>
  <div class="info-box"><label>Client / Owner</label><span>${proj?.clientName||'—'}</span></div>
  <div class="info-box"><label>Site Location</label><span>${proj?.siteLocation||'—'}</span></div>
  <div class="info-box"><label>Period</label><span>${b.periodFrom?fmtD(b.periodFrom)+' to '+fmtD(b.periodTo):'—'}</span></div>
</div>
<div style="max-width:420px">
  <div class="amount-row"><span>Cumulative Work Done (Running Total)</span><strong>${fmtC(b.runningTotal)}</strong></div>
  <div class="amount-row"><span>Less: Previous Billed</span><strong style="color:#C0392B">- ${fmtC(Number(b.runningTotal)-Number(b.thisBillAmt))}</strong></div>
  <div class="amount-row"><strong>This Bill Amount</strong><strong style="color:#1A5276">${fmtC(b.thisBillAmt)}</strong></div>
  <div class="amount-row"><span>Less: Retention</span><strong style="color:#C0392B">- ${fmtC(b.lessRetention)}</strong></div>
  <div class="amount-row"><span>Less: Advance Recovery</span><strong style="color:#C0392B">- ${fmtC(b.lessAdvance)}</strong></div>
  <div class="net-row"><strong style="font-size:14px;color:#1E8449">NET PAYABLE</strong><strong style="font-size:18px;color:#1E8449">${fmtC(b.netPayable)}</strong></div>
</div>
<div class="sign-grid">
  <div class="sign-box"><h4>Prepared By</h4><p>Site Engineer / PM<br>Name & Signature</p></div>
  <div class="sign-box"><h4>Verified By</h4><p>Project Manager<br>Name & Signature</p></div>
  <div class="sign-box"><h4>Client Acknowledgement</h4><p>${proj?.clientName||'Client'}<br>Name, Signature & Date</p></div>
</div>
<div class="footer">LNV ERP Construction Suite | Generated: ${new Date().toLocaleDateString('en-IN')} | Confidential</div>
</body></html>`
    const w = window.open('','_blank','width=800,height:650')
    w.document.write(html); w.document.close()
  }

  return (
    <div style={{background:'#F9F6F8',minHeight:'100vh',fontFamily:'DM Sans,Arial,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:'#6E2C00'}}>💰 Running Account Bills</div>
          <div style={{fontSize:12,color:'#888'}}>Generate RA bills based on BOQ progress</div>
        </div>
        {view==='list' && selProject && (
          <button onClick={()=>setView('new')}
            style={{padding:'9px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>
            + Generate RA Bill
          </button>
        )}
        {view!=='list' && (
          <button onClick={()=>setView('list')}
            style={{padding:'9px 16px',background:'#FDF2E9',color:'#6E2C00',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>← Back</button>
        )}
      </div>

      {/* Project selector */}
      <div style={{background:'#fff',borderRadius:10,padding:'12px 16px',marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <select value={selProject} onChange={e=>selectProject(e.target.value)}
          style={{width:400,padding:'9px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none'}}>
          <option value=''>— Select Project —</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName} ({p.clientName})</option>)}
        </select>
      </div>

      {/* NEW RA BILL FORM */}
      {view==='new' && selProject && (
        <div>
          {/* BOQ Progress Summary */}
          <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <div style={{fontSize:15,fontWeight:700,color:'#6E2C00',marginBottom:14}}>📐 Current BOQ Progress</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#FDF2E9'}}>
                  {['Activity','Description','BOQ Amount','Done %','Done Amount'].map(h=>(
                    <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boq.map((b,i)=>(
                  <tr key={b.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                    <td style={{padding:'8px 12px',fontWeight:700,color:'#6E2C00'}}>{b.activity}</td>
                    <td style={{padding:'8px 12px',fontSize:12}}>{b.description}</td>
                    <td style={{padding:'8px 12px',textAlign:'right'}}>{fmtC(b.amount)}</td>
                    <td style={{padding:'8px 12px',textAlign:'center'}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <div style={{flex:1,height:6,background:'#F0E8EC',borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${b.donePct||0}%`,background:'#1E8449',borderRadius:3}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:'#1E8449'}}>{Number(b.donePct||0).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:'#1E8449'}}>{fmtC(b.doneAmt)}</td>
                  </tr>
                ))}
                <tr style={{background:'#FDF2E9',fontWeight:700}}>
                  <td colSpan={2} style={{padding:'10px 12px',color:'#6E2C00'}}>RUNNING TOTAL (Cumulative work done)</td>
                  <td style={{padding:'10px 12px',textAlign:'right',color:'#6E2C00'}}>{fmtC(boq.reduce((s,b)=>s+Number(b.amount||0),0))}</td>
                  <td/>
                  <td style={{padding:'10px 12px',textAlign:'right',color:'#1E8449',fontSize:15}}>{fmtC(boq.reduce((s,b)=>s+Number(b.doneAmt||0),0))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bill Settings */}
          <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <div style={{fontSize:15,fontWeight:700,color:'#6E2C00',marginBottom:14}}>📋 Bill Details</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:5,textTransform:'uppercase'}}>Period From</div>
                <input type='date' value={form.periodFrom} onChange={e=>setForm(f=>({...f,periodFrom:e.target.value}))}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none',boxSizing:'border-box'}} />
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:5,textTransform:'uppercase'}}>Period To</div>
                <input type='date' value={form.periodTo} onChange={e=>setForm(f=>({...f,periodTo:e.target.value}))}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none',boxSizing:'border-box'}} />
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:5,textTransform:'uppercase'}}>Previous Billed (₹)</div>
                <input type='number' value={form.previousBilled} onChange={e=>setForm(f=>({...f,previousBilled:e.target.value}))}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none',boxSizing:'border-box'}} />
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'#C0392B',marginBottom:5,textTransform:'uppercase'}}>Advance Recovery (₹)</div>
                <input type='number' value={form.advanceRecovery} onChange={e=>setForm(f=>({...f,advanceRecovery:e.target.value}))}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none',boxSizing:'border-box'}} />
              </div>
              <div style={{gridColumn:'2/-1'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:5,textTransform:'uppercase'}}>Remarks</div>
                <input defaultValue={form.remarks} onBlur={e=>setForm(f=>({...f,remarks:e.target.value}))}
                  placeholder='e.g. RA Bill No. 2 — June 2026'
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid #E8D5C4',borderRadius:8,fontSize:13,background:'#FFFAF7',outline:'none',boxSizing:'border-box'}} />
              </div>
            </div>
          </div>

          <button onClick={calcPreview}
            style={{padding:'11px 32px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:14}}>
            📊 Preview RA Bill →
          </button>
        </div>
      )}

      {/* PREVIEW */}
      {view==='preview' && preview && (
        <div style={{maxWidth:600,margin:'0 auto'}}>
          <div style={{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,.10)'}}>
            <div style={{background:'#6E2C00',padding:'18px 24px',color:'#fff'}}>
              <div style={{fontSize:18,fontWeight:800}}>Running Account Bill</div>
              <div style={{fontSize:13,color:'#FDEBD0',marginTop:4}}>{preview.proj?.projectName} — {preview.proj?.clientName}</div>
            </div>
            <div style={{padding:24}}>
              {[
                ['Cumulative Work Done (Running Total)',  fmtC(preview.runningTotal),  '#2C3E50', false],
                ['Less: Previous Billed',                `- ${fmtC(parseFloat(form.previousBilled||0))}`, '#C0392B', false],
                ['This Bill Amount',                      fmtC(preview.thisBill),      '#1A5276', true],
                [`Less: Retention @ ${preview.retention}%`, `- ${fmtC(preview.lessRet)}`, '#C0392B', false],
                ['Less: Advance Recovery',               `- ${fmtC(preview.lessAdv)}`, '#C0392B', false],
              ].map(([label,value,color,bold])=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',
                  padding:'12px 0',borderBottom:'1px solid #F5EDE0'}}>
                  <div style={{fontSize:13,color:'#555',fontWeight:bold?700:400}}>{label}</div>
                  <div style={{fontSize:13,fontWeight:bold?800:600,color}}>{value}</div>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'16px 0',
                background:'#E8F5E9',borderRadius:10,paddingLeft:16,paddingRight:16,marginTop:8}}>
                <div style={{fontSize:16,fontWeight:800,color:'#1E8449'}}>NET PAYABLE</div>
                <div style={{fontSize:22,fontWeight:800,color:'#1E8449'}}>{fmtC(preview.netPayable)}</div>
              </div>
            </div>
            <div style={{padding:'16px 24px',borderTop:'1px solid #F5EDE0',display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={()=>setView('new')}
                style={{padding:'9px 20px',background:'#f0f0f0',border:'none',borderRadius:7,cursor:'pointer',fontWeight:600}}>← Edit</button>
              <button onClick={generate} disabled={generating}
                style={{padding:'9px 28px',background:'#1E8449',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:14}}>
                {generating?'⏳ Generating...':'✅ Generate RA Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIST */}
      {view==='list' && (
        <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 6px rgba(0,0,0,.07)',overflow:'hidden'}}>
          {!selProject ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa',fontSize:13}}>Select a project to see RA bills</div>
          ) : loading ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
          ) : bills.length===0 ? (
            <div style={{padding:60,textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:12}}>💰</div>
              <div style={{fontSize:16,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No RA bills yet</div>
              <button onClick={()=>setView('new')} style={{padding:'9px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}>
                + Generate First RA Bill
              </button>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#6E2C00',color:'#fff'}}>
                  {['RA Bill No','Date','Running Total','This Bill','Retention','Advance','Net Payable','Status','Action'].map(h=>(
                    <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bills.map((b,i)=>{
                  const sc = STATUS_CFG[b.status]||STATUS_CFG.DRAFT
                  return (
                    <tr key={b.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:11,color:'#6E2C00',fontWeight:700}}>{b.raBillNo}</td>
                      <td style={{padding:'9px 12px',fontSize:12}}>{fmtD(b.billDate)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right'}}>{fmtC(b.runningTotal)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#1A5276'}}>{fmtC(b.thisBillAmt)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:'#C0392B'}}>-{fmtC(b.lessRetention)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:'#D35400'}}>-{fmtC(b.lessAdvance)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',fontWeight:800,color:'#1E8449',fontSize:14}}>{fmtC(b.netPayable)}</td>
                      <td style={{padding:'9px 12px'}}>
                        <span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:sc.bg,color:sc.color}}>{sc.label}</span>
                      </td>
                      <td style={{padding:'9px 12px'}}>
                        <button onClick={()=>printBill(b)}
                          style={{padding:'4px 8px',background:'#F0EBF0',color:'#714B67',border:'none',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700,marginRight:4}}>
                          🖨️ Print
                        </button>
                        {b.status==='DRAFT' && (
                          <button onClick={()=>updateStatus(b.id,'SUBMITTED')}
                            style={{padding:'4px 8px',background:'#EBF5FB',color:'#1A5276',border:'none',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>Submit</button>
                        )}
                        {b.status==='SUBMITTED' && (
                          <button onClick={()=>updateStatus(b.id,'APPROVED')}
                            style={{padding:'4px 8px',background:'#E8F5E9',color:'#1E8449',border:'none',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>Approve</button>
                        )}
                        {b.status==='APPROVED' && (
                          <button onClick={()=>updateStatus(b.id,'PAID')}
                            style={{padding:'4px 8px',background:'#F0EBF0',color:'#714B67',border:'none',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>Mark Paid</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
