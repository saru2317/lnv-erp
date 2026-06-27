import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const printSlip = (slip, projects) => {
  const proj = projects?.find(p=>p.id===slip.projectId)
  const items = (() => { try { return JSON.parse(slip.items||'[]') } catch { return [] } })()
  const html = `<!DOCTYPE html><html><head><title>Issue Slip ${slip.slipNo}</title>
<style>
  body{font-family:Arial,sans-serif;margin:24px;font-size:12px}
  .header{text-align:center;border-bottom:3px solid #117A65;padding-bottom:10px;margin-bottom:16px}
  .title{font-size:18px;font-weight:900;color:#117A65}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
  .box{border:1px solid #ddd;border-radius:4px;padding:8px}
  .box label{font-size:9px;color:#888;text-transform:uppercase;font-weight:700;display:block;margin-bottom:2px}
  table{width:100%;border-collapse:collapse}
  th{background:#117A65;color:#fff;padding:7px 10px;text-align:left;font-size:11px}
  td{padding:6px 10px;border-bottom:1px solid #eee;font-size:11px}
  .total{font-weight:700;text-align:right;padding:8px;background:#E8F5F0}
  .sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:20px}
  .sbox{border:1px solid #ddd;border-radius:4px;padding:8px;text-align:center}
  .sbox h4{color:#117A65;font-size:10px;margin:0 0 24px}
  .sbox p{font-size:9px;color:#888;border-top:1px solid #ddd;padding-top:4px;margin:0}
  @media print{.no-print{display:none}}
</style></head><body>
<div class="no-print" style="margin-bottom:10px">
  <button onclick="window.print()" style="padding:6px 14px;background:#117A65;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700">🖨️ Print</button>
  <button onclick="window.close()" style="padding:6px 14px;background:#f0f0f0;border:none;border-radius:4px;cursor:pointer;margin-left:8px">✕ Close</button>
</div>
<div class="header"><div class="title">MATERIAL ISSUE SLIP</div><div style="color:#555;margin-top:3px">${slip.slipNo} | Date: ${new Date(slip.issueDate||slip.createdAt).toLocaleDateString('en-IN')}</div></div>
<div class="grid">
  <div class="box"><label>Project</label><strong>${proj?.projectName||'—'}</strong></div>
  <div class="box"><label>Issued To</label><strong>${slip.issuedTo||'Site'}</strong></div>
  <div class="box"><label>Issued By</label><strong>${slip.issuedBy||'Store'}</strong></div>
  <div class="box"><label>Purpose</label><strong>${slip.purpose||'—'}</strong></div>
</div>
<table><thead><tr><th>#</th><th>Material</th><th>Unit</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
<tbody>${items.map((it,i)=>`<tr${i%2?' style="background:#F8FFF8"':''}><td>${i+1}</td><td>${it.matName||it.name||'—'}</td><td>${it.unit||'—'}</td><td style="text-align:right;font-weight:700">${Number(it.qty||it.quantity||0).toFixed(3)}</td><td style="text-align:right">₹${Number(it.rate||0).toLocaleString('en-IN')}</td><td style="text-align:right;font-weight:700;color:#117A65">₹${Number((it.qty||it.quantity||0)*(it.rate||0)).toLocaleString('en-IN')}</td></tr>`).join('')}
</tbody><tfoot><tr><td colspan="5" class="total">TOTAL</td><td class="total" style="color:#117A65">₹${items.reduce((s,it)=>s+Number((it.qty||it.quantity||0)*(it.rate||0)),0).toLocaleString('en-IN')}</td></tr></tfoot></table>
<div class="sign">
  <div class="sbox"><h4>Store In-charge</h4><p>Name & Signature</p></div>
  <div class="sbox"><h4>Site Engineer</h4><p>Name & Signature</p></div>
  <div class="sbox"><h4>Received By</h4><p>Name, Signature & Date</p></div>
</div>
<div style="text-align:center;margin-top:14px;font-size:9px;color:#aaa">LNV ERP Construction Suite | ${new Date().toLocaleDateString('en-IN')}</div>
</body></html>`
  const w = window.open('','_blank','width=800,height:600'); w.document.write(html); w.document.close()
}

const inp = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.5px' }

export default function IssueSip() {
  const nav = useNavigate()
  const [projects,   setProjects]   = useState([])
  const [materials,  setMaterials]  = useState([])
  const [contractors,setContractors]= useState([])
  const [saving,     setSaving]     = useState(false)
  const [form, setForm] = useState({
    projectId:'', date: new Date().toISOString().slice(0,10),
    issuedTo:'Site', issueType:'SITE',
    activityRef:'', contractorWONo:'', issuedBy:''
  })
  const [items, setItems] = useState([{ matCode:'', matName:'', specification:'', unit:'', qty:'', rate:'', activityRef:'' }])

  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,    {headers:hdr2()}).then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{})
    fetch(`${BASE}/civil-ext/materials`,{headers:hdr2()}).then(r=>r.json()).then(d=>setMaterials(d.data||[])).catch(()=>{})
  },[])

  const loadContractors = async (pid) => {
    if (!pid) return
    const r = await fetch(`${BASE}/civil-ext/contractor-wo?projectId=${pid}`,{headers:hdr2()})
    const d = await r.json()
    setContractors(d.data||[])
  }

  const setForm_ = (k,v) => setForm(f=>({...f,[k]:v}))

  const setItem = (idx,k,v) => setItems(prev=>{
    const n = [...prev]
    n[idx] = {...n[idx],[k]:v}
    if (k==='matCode') {
      const mat = materials.find(m=>m.matCode===v)
      if (mat) { n[idx].matName=mat.matName; n[idx].unit=mat.unit; n[idx].rate=mat.stdRate; n[idx].specification=mat.specification||'' }
    }
    return n
  })

  const addRow = () => setItems(p=>[...p,{matCode:'',matName:'',specification:'',unit:'',qty:'',rate:'',activityRef:''}])
  const removeRow = idx => { if(items.length>1) setItems(p=>p.filter((_,i)=>i!==idx)) }

  const total = items.reduce((s,i)=>s+parseFloat(i.qty||0)*parseFloat(i.rate||0),0)

  const save = async () => {
    if (!form.projectId)     return toast.error('Select project')
    if (!form.issuedBy.trim()) return toast.error('Issued by required')
    const valid = items.filter(i=>i.matCode && i.qty)
    if (valid.length===0) return toast.error('Add at least one material')
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/civil-ext/issue-slips`,{method:'POST',headers:hdr(),
        body:JSON.stringify({...form, items:valid.map(i=>({...i,qty:parseFloat(i.qty),rate:parseFloat(i.rate||0),value:parseFloat(i.qty)*parseFloat(i.rate||0)}))})})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ Issue Slip ${d.data.issueNo} created! Stock updated.`)
      nav('/civil/site-stock')
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const ACTIVITIES = ['Foundation','Plinth Beam','Ground Floor Columns','Ground Floor Slab','Brick Masonry','Plastering','Flooring','Electrical','Plumbing','Painting','External Works']

  return (
    <div style={{background:'#F8F5F8',minHeight:'100vh',fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>nav(-1)} style={{padding:'6px 14px',background:'#fff',border:'1px solid #ddd',borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:600,color:'#555'}}>← Back</button>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:'#6E2C00'}}>📤 Material Issue Slip</div>
            <div style={{fontSize:11,color:'#888'}}>Issue materials from site stock to activity / contractor</div>
          </div>
        </div>
        <button onClick={save} disabled={saving}
          style={{padding:'7px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:700,opacity:saving?.6:1}}>
          {saving?'⏳ Saving...':'💾 Issue & Update Stock'}
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:14,alignItems:'start'}}>
        <div>
          {/* Header */}
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,marginBottom:14}}>
            <div style={{background:'linear-gradient(135deg,#6E2C00,#8B3A00)',color:'#fff',padding:'9px 16px',fontSize:12,fontWeight:700,marginBottom:14,borderRadius:6}}>
              📋 Issue Details
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:12}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={lbl}>Project *</label>
                <select value={form.projectId} onChange={e=>{setForm_('projectId',e.target.value);loadContractors(e.target.value)}} style={inp}>
                  <option value=''>— Select Project —</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Date *</label>
                <input type='date' value={form.date} onChange={e=>setForm_('date',e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Issue Type</label>
                <select value={form.issueType} onChange={e=>setForm_('issueType',e.target.value)} style={inp}>
                  <option value='SITE'>Site (General)</option>
                  <option value='ACTIVITY'>Activity Specific</option>
                  <option value='CONTRACTOR'>To Contractor</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Issued By *</label>
                <input defaultValue={form.issuedBy} onBlur={e=>setForm_('issuedBy',e.target.value)}
                  placeholder='Store keeper / supervisor name' style={inp} />
              </div>
              {form.issueType==='ACTIVITY' && (
                <div>
                  <label style={lbl}>Activity Reference</label>
                  <select value={form.activityRef} onChange={e=>setForm_('activityRef',e.target.value)} style={inp}>
                    <option value=''>— Select Activity —</option>
                    {ACTIVITIES.map(a=><option key={a}>{a}</option>)}
                  </select>
                </div>
              )}
              {form.issueType==='CONTRACTOR' && (
                <>
                  <div>
                    <label style={lbl}>Issued To (Contractor)</label>
                    <input defaultValue={form.issuedTo} onBlur={e=>setForm_('issuedTo',e.target.value)}
                      placeholder='Contractor name' style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Contractor WO Reference</label>
                    <select value={form.contractorWONo} onChange={e=>setForm_('contractorWONo',e.target.value)} style={inp}>
                      <option value=''>— Select WO —</option>
                      {contractors.map(c=><option key={c.id} value={c.woNo}>{c.woNo} — {c.contractorName}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Items */}
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
            <div style={{background:'linear-gradient(135deg,#6E2C00,#8B3A00)',color:'#fff',padding:'9px 16px',fontSize:12,fontWeight:700,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>Materials to Issue</span>
              <span style={{fontSize:13,fontWeight:800,color:'#FDEBD0'}}>Total: {fmtC(total)}</span>
            </div>
            <div style={{padding:12,overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:700}}>
                <thead>
                  <tr style={{background:'#FDF2E9'}}>
                    {['#','Material','Specification','Unit','Quantity','Rate (₹)','Value',''].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item,idx)=>(
                    <tr key={idx} style={{borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'6px 10px',color:'#888',fontWeight:700}}>{idx+1}</td>
                      <td style={{padding:'4px 6px',minWidth:200}}>
                        <select value={item.matCode} onChange={e=>setItem(idx,'matCode',e.target.value)}
                          style={{...inp,fontSize:11}}>
                          <option value=''>— Select Material —</option>
                          {materials.map(m=><option key={m.matCode} value={m.matCode}>{m.matName} ({m.unit})</option>)}
                        </select>
                      </td>
                      <td style={{padding:'4px 6px',minWidth:140}}>
                        <input value={item.specification} onChange={e=>setItem(idx,'specification',e.target.value)}
                          placeholder='Grade / Brand' style={{...inp,fontSize:11}} />
                      </td>
                      <td style={{padding:'6px 10px',fontWeight:600,color:'#555',minWidth:50}}>{item.unit||'—'}</td>
                      <td style={{padding:'4px 6px'}}>
                        <input type='number' value={item.qty} onChange={e=>setItem(idx,'qty',e.target.value)}
                          placeholder='0' style={{...inp,width:80,textAlign:'right'}} />
                      </td>
                      <td style={{padding:'4px 6px'}}>
                        <input type='number' value={item.rate} onChange={e=>setItem(idx,'rate',e.target.value)}
                          placeholder='0' style={{...inp,width:90,textAlign:'right'}} />
                      </td>
                      <td style={{padding:'6px 10px',textAlign:'right',fontWeight:700,color:'#C0392B'}}>
                        {fmtC(parseFloat(item.qty||0)*parseFloat(item.rate||0))}
                      </td>
                      <td style={{padding:'4px 6px'}}>
                        <button onClick={()=>removeRow(idx)}
                          style={{padding:'3px 8px',background:'#FDEDEC',color:'#C0392B',border:'none',borderRadius:4,cursor:'pointer'}}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addRow}
                style={{margin:'10px 0',padding:'6px 16px',background:'#FDF2E9',color:'#6E2C00',border:'1.5px dashed #6E2C00',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:11}}>
                + Add Material
              </button>
            </div>
          </div>
        </div>

        {/* Right — Summary */}
        <div>
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#6E2C00',marginBottom:12}}>📋 Issue Summary</div>
            {[
              ['Items',          items.filter(i=>i.matCode).length,  '#1A5276'],
              ['Total Value',    fmtC(total),                        '#C0392B'],
            ].map(([l,v,c])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F5EDE0'}}>
                <div style={{fontSize:12,color:'#777'}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:c}}>{v}</div>
              </div>
            ))}
            <div style={{marginTop:14,background:'#FDF2E9',borderRadius:6,padding:12,fontSize:11,color:'#6E2C00',lineHeight:1.7}}>
              <strong>Note:</strong><br/>
              • Stock deducted immediately on save<br/>
              • Issue slip cannot be reversed<br/>
              • Weekly count corrects any variance<br/>
              • Partial cans/rolls — track by ISSUE method
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
