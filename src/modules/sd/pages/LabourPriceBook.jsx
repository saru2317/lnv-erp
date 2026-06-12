import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => v ? `₹${parseFloat(v).toLocaleString('en-IN',{minimumFractionDigits:2})}` : '—'

// ── Master definitions ──────────────────────────────────────────
const PROCESSES = [
  {
    code:'PC', name:'Powder Coating',
    icon:'🎨', color:'#714B67',
    hasMaterial:true,
    materials:[
      { key:'Casting',    label:'Casting',    basis:'KG',   desc:'Weight based — per KG of casting' },
      { key:'Sheet Metal',label:'Sheet Metal',basis:'SQFT', desc:'Area based — per SQFT of surface' },
      { key:'Aluminium',  label:'Aluminium',  basis:'KG',   desc:'Weight based — per KG of aluminium' },
    ]
  },
  {
    code:'CED', name:'CED (Cathodic Electro Deposition)',
    icon:'⚡', color:'#1565C0',
    hasMaterial:true,
    materials:[
      { key:'Casting',    label:'Casting',    basis:'KG',   desc:'Per KG' },
      { key:'Sheet Metal',label:'Sheet Metal',basis:'SQFT', desc:'Per SQFT' },
      { key:'Aluminium',  label:'Aluminium',  basis:'KG',   desc:'Per KG' },
    ]
  },
  {
    code:'LP', name:'Liquid Painting',
    icon:'🖌️', color:'#E65100',
    hasMaterial:true,
    materials:[
      { key:'Casting',    label:'Casting',    basis:'KG',   desc:'Per KG' },
      { key:'Sheet Metal',label:'Sheet Metal',basis:'SQFT', desc:'Per SQFT' },
      { key:'Aluminium',  label:'Aluminium',  basis:'KG',   desc:'Per KG' },
    ]
  },
  {
    code:'IM', name:'Injection Moulding',
    icon:'🏭', color:'#2E7D32',
    hasMaterial:false,
    materials:[
      { key:'N/A', label:'Plastic / Polymer', basis:'KG', desc:'Per KG of material processed' },
    ]
  },
  {
    code:'LW', name:'Late Works / Overtime',
    icon:'🕐', color:'#856404',
    hasMaterial:false,
    materials:[
      { key:'N/A', label:'Labour', basis:'HOUR', desc:'Per hour of overtime/late work' },
    ]
  },
  {
    code:'SC', name:'Sheet Cutting Job',
    icon:'✂️', color:'#1A5276',
    hasMaterial:false,
    materials:[
      { key:'Sheet Metal', label:'Sheet Metal', basis:'SQFT', desc:'Per SQFT cut' },
    ]
  },
  {
    code:'WS', name:'Welding Shop',
    icon:'🔧', color:'#4A235A',
    hasMaterial:false,
    materials:[
      { key:'N/A', label:'General Welding', basis:'HOUR', desc:'Per hour' },
      { key:'Sheet Metal', label:'Sheet Metal Welding', basis:'PIECE', desc:'Per piece' },
    ]
  },
  {
    code:'OT', name:'Other Job Works',
    icon:'📦', color:'#6C757D',
    hasMaterial:false,
    materials:[
      { key:'N/A', label:'General', basis:'PIECE', desc:'Per piece / lot' },
    ]
  },
]

const GST_RATES = [5, 12, 18, 28]
const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0', borderRadius:5, outline:'none', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block', marginBottom:3, textTransform:'uppercase' }

const BLANK_FORM = {
  processCode:'', materialType:'', pricingBasis:'KG',
  rateWithMat:0, rateWithoutMat:0, minQty:1, minCharge:0,
  hsnCode:'9988', gstRate:18, rmCostPerUnit:0, chemCostPerUnit:0,
  overheadPct:0, profitPct:15, validFrom:'', validTo:'', notes:'', customerRates:[]
}

export default function LabourPriceBook() {
  const [entries,   setEntries]   = useState([])
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [showForm,  setShowForm]  = useState(false)
  const [editId,    setEditId]    = useState(null)
  const [form,      setForm]      = useState({...BLANK_FORM})
  const [procF,     setProcF]     = useState('')
  const [showCost,  setShowCost]  = useState(false)

  // Read enabled processes from company config (set in Config → Labour Process Access)
  const enabledCodes = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lnv_labour_processes')||'null')
      return saved?.enabled || PROCESSES.map(p=>p.code) // default all
    } catch { return PROCESSES.map(p=>p.code) }
  })()

  // Only show enabled processes
  const visibleProcesses = PROCESSES.filter(p => enabledCodes.includes(p.code))
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const selProc = PROCESSES.find(p => p.code===form.processCode)
  const selMat  = selProc?.materials.find(m => m.key===form.materialType)

  const load = async () => {
    setLoading(true)
    try {
      const [er, cr] = await Promise.all([
        fetch(`${BASE}/sd/labour-pricebook?active=false`, { headers:hdr2() }).then(r=>r.json()),
        fetch(`${BASE}/sd/customers?limit=200`,           { headers:hdr2() }).then(r=>r.json()),
      ])
      setEntries(er.data||[])
      setCustomers(cr.data||[])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openNew = (procCode='', matKey='', basis='KG') => {
    setEditId(null)
    setForm({ ...BLANK_FORM, processCode:procCode, materialType:matKey, pricingBasis:basis })
    setShowForm(true)
  }

  const openEdit = (e) => {
    setEditId(e.id)
    setForm({ ...e,
      validFrom: e.validFrom ? e.validFrom.split('T')[0] : '',
      validTo:   e.validTo   ? e.validTo.split('T')[0]   : '',
      customerRates: Array.isArray(e.customerRates) ? e.customerRates : [],
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.processCode) { toast.error('Select process'); return }
    setSaving(true)
    try {
      const proc = PROCESSES.find(p=>p.code===form.processCode)
      const mat  = proc?.materials.find(m=>m.key===form.materialType)
      const payload = {
        ...form,
        processName: proc?.name || form.processCode,
        processCategory: form.processCode,
        pricingBasis: mat?.basis || form.pricingBasis,
        rateWithMat:    parseFloat(form.rateWithMat||0),
        rateWithoutMat: parseFloat(form.rateWithoutMat||0),
        minQty:         parseFloat(form.minQty||1),
        minCharge:      parseFloat(form.minCharge||0),
        gstRate:        parseFloat(form.gstRate||18),
        rmCostPerUnit:  parseFloat(form.rmCostPerUnit||0),
        chemCostPerUnit:parseFloat(form.chemCostPerUnit||0),
        overheadPct:    parseFloat(form.overheadPct||0),
        profitPct:      parseFloat(form.profitPct||15),
      }
      const url    = editId ? `${BASE}/sd/labour-pricebook/${editId}` : `${BASE}/sd/labour-pricebook`
      const method = editId ? 'PATCH' : 'POST'
      const r = await fetch(url, { method, headers:hdr(), body:JSON.stringify(payload) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(d.message)
      setShowForm(false)
      load()
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const toggleActive = async (e) => {
    await fetch(`${BASE}/sd/labour-pricebook/${e.id}`, {
      method:'PATCH', headers:hdr(), body:JSON.stringify({ isActive:!e.isActive })
    })
    setEntries(es => es.map(x => x.id===e.id ? {...x, isActive:!x.isActive} : x))
    toast.success(`${e.processName} ${e.isActive?'deactivated':'activated'}`)
  }

  const addCR    = () => set('customerRates', [...(form.customerRates||[]), { customerId:'', customerName:'', rateWithMat:0, rateWithoutMat:0 }])
  const updCR    = (i,k,v) => set('customerRates', (form.customerRates||[]).map((r,idx)=>idx===i?{...r,[k]:v}:r))
  const removeCR = (i) => set('customerRates', (form.customerRates||[]).filter((_,idx)=>idx!==i))

  const calc = (() => {
    const rm  = parseFloat(form.rmCostPerUnit||0)
    const ch  = parseFloat(form.chemCostPerUnit||0)
    const base = rm + ch
    const oh   = base * parseFloat(form.overheadPct||0) / 100
    const cost = base + oh
    const prof = cost * parseFloat(form.profitPct||0) / 100
    return { rm, ch, overhead:oh, cost, profit:prof, suggested:cost+prof }
  })()

  const filtered = entries.filter(e => {
    const isVisible = visibleProcesses.find(p=>p.code===e.processCode||p.code===e.processCategory)
    return isVisible && (!procF || e.processCode===procF || e.processCategory===procF)
  })

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
            Labour Price Book
            <small style={{fontSize:11,fontWeight:400,color:'#6C757D',marginLeft:8}}>Process × Material rate matrix</small>
          </div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
            Coating (KG/SQFT) · Moulding (KG) · Labour (HOUR) · Cutting (SQFT)
          </div>
        </div>
        <button onClick={()=>openNew()} style={{padding:'8px 18px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
          + Add Rate
        </button>
      </div>

      {/* Process × Material Matrix Overview */}
      <div style={{marginBottom:16}}>
        {visibleProcesses.map(proc => {
          const procEntries = entries.filter(e => e.processCode===proc.code || e.processCategory===proc.code)
          return (
            <div key={proc.code} style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,
              marginBottom:10,overflow:'hidden'}}>
              {/* Process Header */}
              <div style={{padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',
                background:`${proc.color}11`,borderBottom:`2px solid ${proc.color}33`,
                cursor:'pointer'}} onClick={()=>setProcF(procF===proc.code?'':proc.code)}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:22}}>{proc.icon}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:proc.color}}>{proc.name}</div>
                    <div style={{fontSize:10,color:'#6C757D'}}>
                      {proc.materials.map(m=>m.label).join(' · ')} · HSN 9988
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:11,color:'#6C757D'}}>
                    {procEntries.filter(e=>e.isActive).length}/{proc.materials.length} rates set
                  </span>
                  <button onClick={e=>{e.stopPropagation(); openNew(proc.code, proc.materials[0]?.key, proc.materials[0]?.basis)}}
                    style={{padding:'4px 12px',background:proc.color,color:'#fff',border:'none',
                      borderRadius:5,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                    + Add Rate
                  </button>
                </div>
              </div>

              {/* Material rows */}
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#F8F9FA'}}>
                      {['Material Type','Basis','W/O Material (Labour Only)','W/ Material (Incl. Material)','Min Charge','GST','Customer Rates','Status',''].map(h=>(
                        <th key={h} style={{padding:'7px 12px',textAlign:'left',fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proc.materials.map(mat => {
                      const entry = procEntries.find(e => e.materialType===mat.key)
                      const custRates = entry && Array.isArray(entry.customerRates) ? entry.customerRates : []
                      return (
                        <tr key={mat.key} style={{borderBottom:'1px solid #F0EEEB',
                          background:entry?.isActive===false?'#F8F9FA':'#fff'}}>
                          <td style={{padding:'10px 12px'}}>
                            <div style={{fontWeight:600,fontSize:12}}>{mat.label}</div>
                            <div style={{fontSize:10,color:'#6C757D'}}>{mat.desc}</div>
                          </td>
                          <td style={{padding:'10px 12px'}}>
                            <span style={{padding:'3px 8px',borderRadius:4,fontSize:11,fontWeight:700,
                              background:'#E3F2FD',color:'#1565C0'}}>
                              Per {mat.basis}
                            </span>
                          </td>
                          <td style={{padding:'10px 12px'}}>
                            {entry ? (
                              <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:14,color:'#2E7D32'}}>
                                {INR(entry.rateWithoutMat)}
                                <span style={{fontSize:9,color:'#6C757D',fontFamily:'DM Sans,sans-serif',fontWeight:400,marginLeft:4}}>/{mat.basis}</span>
                              </div>
                            ) : <span style={{color:'#CCC',fontSize:12}}>Not set</span>}
                          </td>
                          <td style={{padding:'10px 12px'}}>
                            {entry ? (
                              <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:14,color:'#856404'}}>
                                {INR(entry.rateWithMat)}
                                <span style={{fontSize:9,color:'#6C757D',fontFamily:'DM Sans,sans-serif',fontWeight:400,marginLeft:4}}>/{mat.basis}</span>
                              </div>
                            ) : <span style={{color:'#CCC',fontSize:12}}>Not set</span>}
                          </td>
                          <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12,color:'#6C757D'}}>
                            {entry?.minCharge>0 ? INR(entry.minCharge) : '—'}
                          </td>
                          <td style={{padding:'10px 12px',fontSize:12,color:'#6C757D'}}>
                            {entry ? `${entry.gstRate}%` : '—'}
                          </td>
                          <td style={{padding:'10px 12px'}}>
                            {custRates.length>0 ? (
                              <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                                background:'#EDE0EA',color:'#714B67'}}>
                                {custRates.length} customer{custRates.length>1?'s':''}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{padding:'10px 12px'}}>
                            {entry ? (
                              <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                                background:entry.isActive?'#D4EDDA':'#F5F5F5',
                                color:entry.isActive?'#155724':'#6C757D'}}>
                                {entry.isActive?'Active':'Inactive'}
                              </span>
                            ) : (
                              <span style={{fontSize:10,color:'#CCC'}}>—</span>
                            )}
                          </td>
                          <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}>
                            {entry ? (
                              <>
                                <button onClick={()=>openEdit(entry)}
                                  style={{padding:'3px 10px',background:'#EDE0EA',color:'#714B67',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',marginRight:4}}>
                                  Edit
                                </button>
                                <button onClick={()=>toggleActive(entry)}
                                  style={{padding:'3px 8px',background:entry.isActive?'#F8D7DA':'#D4EDDA',
                                    color:entry.isActive?'#721C24':'#155724',border:'none',borderRadius:5,fontSize:10,cursor:'pointer'}}>
                                  {entry.isActive?'Off':'On'}
                                </button>
                              </>
                            ) : (
                              <button onClick={()=>openNew(proc.code, mat.key, mat.basis)}
                                style={{padding:'3px 12px',background:proc.color,color:'#fff',border:'none',
                                  borderRadius:5,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                                + Set Rate
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,
          display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:30,overflowY:'auto'}}>
          <div style={{background:'#fff',borderRadius:10,padding:24,width:760,
            boxShadow:'0 8px 32px rgba(0,0,0,.25)',margin:'0 auto 40px'}}>

            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67',marginBottom:16}}>
              {editId ? 'Edit Rate' : 'Add Rate'} — Labour Price Book
            </div>

            {/* Process + Material selection */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <label style={lbl}>Process *</label>
                <select value={form.processCode} onChange={e=>{
                  const p = PROCESSES.find(x=>x.code===e.target.value)
                  set('processCode',e.target.value)
                  if (p?.materials[0]) {
                    set('materialType', p.materials[0].key)
                    set('pricingBasis', p.materials[0].basis)
                  }
                }} style={inp}>
                  <option value="">— Select Process —</option>
                  {visibleProcesses.map(p=><option key={p.code} value={p.code}>{p.icon} {p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Material Type *</label>
                <select value={form.materialType} onChange={e=>{
                  const m = selProc?.materials.find(x=>x.key===e.target.value)
                  set('materialType',e.target.value)
                  if (m) set('pricingBasis', m.basis)
                }} style={inp} disabled={!selProc}>
                  <option value="">— Select Material —</option>
                  {(selProc?.materials||[]).map(m=>(
                    <option key={m.key} value={m.key}>{m.label} (Per {m.basis})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Basis info */}
            {selMat && (
              <div style={{background:'#E3F2FD',borderRadius:6,padding:'8px 14px',marginBottom:14,
                fontSize:12,color:'#1565C0',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontWeight:700}}>Pricing Basis: Per {selMat.basis}</span>
                <span style={{color:'#6C757D'}}>· {selMat.desc}</span>
              </div>
            )}

            {/* Rates */}
            <div style={{background:'#F8F9FA',borderRadius:8,padding:14,marginBottom:12,border:'1px solid #E0D5E0'}}>
              <div style={{fontWeight:700,fontSize:12,color:'#714B67',marginBottom:10}}>
                Rates per {form.pricingBasis||'Unit'}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10}}>
                <div>
                  <label style={lbl}>Without Material (Labour Only)</label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#2E7D32'}}>₹</span>
                    <input type="number" value={form.rateWithoutMat}
                      onChange={e=>set('rateWithoutMat',e.target.value)}
                      style={{...inp,paddingLeft:22,background:'#E8F5E9',borderColor:'#A5D6A7'}} />
                  </div>
                  <div style={{fontSize:9,color:'#2E7D32',marginTop:2}}>Customer supplies material</div>
                </div>
                <div>
                  <label style={lbl}>With Material (Incl. Material)</label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#856404'}}>₹</span>
                    <input type="number" value={form.rateWithMat}
                      onChange={e=>set('rateWithMat',e.target.value)}
                      style={{...inp,paddingLeft:22,background:'#FFF3CD',borderColor:'#FFCC02'}} />
                  </div>
                  <div style={{fontSize:9,color:'#856404',marginTop:2}}>We supply material</div>
                </div>
                <div>
                  <label style={lbl}>Minimum Qty</label>
                  <input type="number" value={form.minQty} onChange={e=>set('minQty',e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Minimum Charge (₹)</label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#6C757D'}}>₹</span>
                    <input type="number" value={form.minCharge} onChange={e=>set('minCharge',e.target.value)}
                      style={{...inp,paddingLeft:22}} />
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 2fr',gap:10,marginTop:10}}>
                <div>
                  <label style={lbl}>HSN Code</label>
                  <input value={form.hsnCode} onChange={e=>set('hsnCode',e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>GST %</label>
                  <select value={form.gstRate} onChange={e=>set('gstRate',e.target.value)} style={inp}>
                    {GST_RATES.map(g=><option key={g} value={g}>{g}%</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Notes</label>
                  <input value={form.notes||''} onChange={e=>set('notes',e.target.value)}
                    placeholder="Any special conditions for this rate" style={inp} />
                </div>
              </div>
            </div>

            {/* Cost breakup toggle */}
            <div style={{marginBottom:12}}>
              <button onClick={()=>setShowCost(!showCost)}
                style={{padding:'5px 12px',background:'#EDE0EA',color:'#714B67',border:'1px solid #D4B8CE',
                  borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:600}}>
                {showCost?'▼':'▶'} Cost Breakup (optional — for margin analysis)
              </button>
              {showCost && (
                <div style={{background:'#F8F4F8',borderRadius:6,padding:12,marginTop:8}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:10}}>
                    {[
                      {k:'rmCostPerUnit',    l:'RM Cost / Unit'},
                      {k:'chemCostPerUnit',  l:'Chemical / Unit'},
                      {k:'overheadPct',      l:'Overhead %'},
                      {k:'profitPct',        l:'Profit %'},
                    ].map(f=>(
                      <div key={f.k}>
                        <label style={lbl}>{f.l}</label>
                        <input type="number" value={form[f.k]||0} onChange={e=>set(f.k,e.target.value)} style={inp} />
                      </div>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
                    {[
                      ['RM','#1565C0',calc.rm],['Chemical','#856404',calc.ch],
                      ['Overhead','#E65100',calc.overhead],['Cost','#1C1C1C',calc.cost],
                      ['Suggested','#155724',calc.suggested],
                    ].map(([l,c,v])=>(
                      <div key={l} style={{textAlign:'center',padding:'6px',background:'#fff',borderRadius:5,border:'1px solid #E0D5E0'}}>
                        <div style={{fontSize:9,color:'#6C757D',marginBottom:2}}>{l}</div>
                        <div style={{fontWeight:800,fontSize:13,color:c,fontFamily:'DM Mono,monospace'}}>{INR(v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer rates */}
            <div style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontWeight:700,fontSize:12,color:'#714B67'}}>
                  Customer-Specific Rates
                  <span style={{fontSize:10,color:'#6C757D',fontWeight:400,marginLeft:6}}>Override for specific customers</span>
                </div>
                <button onClick={addCR} style={{padding:'4px 10px',background:'#EDE0EA',color:'#714B67',
                  border:'none',borderRadius:5,fontSize:11,cursor:'pointer'}}>+ Add</button>
              </div>
              {(form.customerRates||[]).map((r,i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:8,marginBottom:6,alignItems:'center'}}>
                  <select value={r.customerId||''} onChange={e=>{
                    const c = customers.find(x=>String(x.id)===e.target.value)
                    updCR(i,'customerId',e.target.value)
                    if (c) updCR(i,'customerName',c.name)
                  }} style={inp}>
                    <option value="">Select customer</option>
                    {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#2E7D32'}}>₹</span>
                    <input type="number" value={r.rateWithoutMat||0}
                      onChange={e=>updCR(i,'rateWithoutMat',parseFloat(e.target.value))}
                      placeholder="W/O Mat rate" style={{...inp,paddingLeft:18,background:'#E8F5E9'}} />
                  </div>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#856404'}}>₹</span>
                    <input type="number" value={r.rateWithMat||0}
                      onChange={e=>updCR(i,'rateWithMat',parseFloat(e.target.value))}
                      placeholder="W/ Mat rate" style={{...inp,paddingLeft:18,background:'#FFF3CD'}} />
                  </div>
                  <button onClick={()=>removeCR(i)}
                    style={{color:'#C62828',background:'none',border:'none',cursor:'pointer',fontSize:16,padding:'0 4px'}}>✕</button>
                </div>
              ))}
            </div>

            {/* Validity */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              <div>
                <label style={lbl}>Valid From</label>
                <input type="date" value={form.validFrom||''} onChange={e=>set('validFrom',e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Valid To</label>
                <input type="date" value={form.validTo||''} onChange={e=>set('validTo',e.target.value)} style={inp} />
              </div>
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'flex-end',borderTop:'1px solid #F0EEEB',paddingTop:12}}>
              <button onClick={()=>setShowForm(false)}
                style={{padding:'8px 18px',borderRadius:6,border:'1px solid #E0D5E0',background:'#fff',fontSize:12,cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{padding:'8px 22px',borderRadius:6,border:'none',
                  background:'#714B67',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                {saving?'Saving…':'✓ Save Rate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
