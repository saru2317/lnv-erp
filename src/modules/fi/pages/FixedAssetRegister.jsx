import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const INR2 = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const BLANK = {
  name:'', category:'Plant & Machinery', description:'', location:'',
  serialNo:'', purchaseDate:'', purchaseVendor:'', cost:'',
  usefulLifeYrs:'', method:'SLM', depRate:'', residualValue:0,
  assetTagNo:'', insuranceNo:'', insuranceExpiry:'', warrantyExpiry:'', remarks:''
}

const CATEGORIES = ['Plant & Machinery','Furniture','IT Equipment','Vehicle','Building','Land','Electrical Equipment','Laboratory Equipment']

const DEP_RATES = {
  'Plant & Machinery': { SLM: 6.67, WDV: 18.10 },
  'Furniture':         { SLM: 10,   WDV: 25.89 },
  'IT Equipment':      { SLM: 20,   WDV: 45.07 },
  'Vehicle':           { SLM: 9.50, WDV: 25.89 },
  'Building':          { SLM: 1.63, WDV: 10.00 },
  'Electrical Equipment': { SLM: 10, WDV: 25.89 },
}

const STATUS_CFG = {
  active:             { label:'Active',            bg:'#D4EDDA', color:'#155724' },
  under_repair:       { label:'Under Repair',      bg:'#FFF3CD', color:'#856404' },
  fully_depreciated:  { label:'Fully Depreciated', bg:'#F8D7DA', color:'#721C24' },
  disposed:           { label:'Disposed',          bg:'#E2E3E5', color:'#383D41' },
}

export default function FixedAssetRegister() {
  const [assets,   setAssets]   = useState([])
  const [summary,  setSummary]  = useState({})
  const [loading,  setLoading]  = useState(true)
  const [sel,      setSel]      = useState(null)
  const [schedule, setSchedule] = useState([])
  const [schedLoading, setSchedLoading] = useState(false)
  const [catFilter,setCatFilter]= useState('all')
  const [statusFilter,setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(BLANK)
  const [editId,   setEditId]   = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [depModal, setDepModal] = useState(false)
  const [depPeriod,setDepPeriod]= useState(() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [depRunning,setDepRunning]=useState(false)
  const [depResults,setDepResults]=useState(null)
  const [disposeModal,setDisposeModal]=useState(null)
  const [disposeAmt,  setDisposeAmt]  =useState('')
  const [disposeDate, setDisposeDate] =useState(new Date().toISOString().split('T')[0])
  const [disposeReason,setDisposeReason]=useState('')
  const [disposing, setDisposing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/fixed-assets`, { headers: hdr2() })
      const d = await r.json()
      setAssets(d.data || [])
      setSummary(d.summary || {})
    } catch { toast.error('Failed to load assets') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const F = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  const openNew = () => {
    setForm(BLANK); setEditId(null); setShowForm(true); setSel(null)
  }

  const openEdit = a => {
    setForm({
      ...a,
      purchaseDate:    a.purchaseDate    ? a.purchaseDate.split('T')[0]    : '',
      insuranceExpiry: a.insuranceExpiry ? a.insuranceExpiry.split('T')[0] : '',
      warrantyExpiry:  a.warrantyExpiry  ? a.warrantyExpiry.split('T')[0]  : '',
    })
    setEditId(a.id); setShowForm(true); setSel(null)
  }

  // Auto-fill dep rate when category/method changes
  const onCatChange = cat => {
    const rate = DEP_RATES[cat]?.[form.method] || ''
    const life = cat === 'IT Equipment' ? 5 : cat === 'Building' ? 60 : cat === 'Vehicle' ? 10 : 15
    setForm(p => ({ ...p, category: cat, depRate: rate, usefulLifeYrs: life }))
  }
  const onMethodChange = method => {
    const rate = DEP_RATES[form.category]?.[method] || ''
    setForm(p => ({ ...p, method, depRate: rate }))
  }

  const save = async () => {
    if (!form.name || !form.purchaseDate || !form.cost || !form.depRate)
      return toast.error('Name, purchase date, cost and dep rate required')
    setSaving(true)
    try {
      const url    = editId ? `${BASE_URL}/fi/fixed-assets/${editId}` : `${BASE_URL}/fi/fixed-assets`
      const method = editId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: hdr(), body: JSON.stringify(form) })
      const d      = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message || 'Saved')
      setShowForm(false); setForm(BLANK); setEditId(null); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const loadSchedule = async (asset) => {
    setSchedLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/fixed-assets/${asset.id}/schedule`, { headers: hdr2() })
      const d = await r.json()
      setSchedule(d.data || [])
    } catch {}
    finally { setSchedLoading(false) }
  }

  const openDetail = async a => {
    setSel(a); setSchedule([])
    await loadSchedule(a)
  }

  const runDepreciation = async () => {
    if (!depPeriod) return toast.error('Select period')
    setDepRunning(true); setDepResults(null)
    try {
      const res = await fetch(`${BASE_URL}/fi/fixed-assets/run-depreciation`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ period: depPeriod })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setDepResults(d.results || [])
      load()
    } catch (e) { toast.error(e.message) }
    finally { setDepRunning(false) }
  }

  const disposeAsset = async () => {
    if (!disposeModal) return
    setDisposing(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/fixed-assets/${disposeModal.id}/dispose`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ disposalDate: disposeDate, disposalAmt: parseFloat(disposeAmt||0), disposalReason: disposeReason })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setDisposeModal(null); setDisposeAmt(''); setDisposeReason(''); setSel(null); load()
    } catch (e) { toast.error(e.message) }
    finally { setDisposing(false) }
  }

  const filtered = assets.filter(a =>
    (catFilter    === 'all' || a.category === catFilter) &&
    (statusFilter === 'all' || a.status   === statusFilter)
  )

  const cats = [...new Set(assets.map(a => a.category))]

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Fixed Asset Register
          <small> Gross Block · Depreciation · WDV</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm" onClick={()=>{ setDepModal(true); setDepResults(null) }}>Run Depreciation</button>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={openNew}>+ Add Asset</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
        {[
          { cls:'purple', label:'Gross Block',               val: INR(summary.grossBlock||0),   sub:`${assets.length} assets` },
          { cls:'red',    label:'Accumulated Depreciation',  val: INR(summary.totalAccDep||0),  sub:'Total written off' },
          { cls:'green',  label:'Net Block (WDV)',           val: INR(summary.netBlock||0),     sub:'Current book value' },
          { cls:'orange', label:'Monthly Depreciation',      val: INR2(summary.monthlyDep||0),  sub:'Active assets only' },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:20,marginBottom:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#714B67',marginBottom:16}}>
            {editId ? 'Edit Asset' : 'Add New Fixed Asset'}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:12}}>
            <div style={{gridColumn:'1/3'}}>
              <label style={lbl}>Asset Name *</label>
              <input style={inp} {...F('name')} placeholder="Ring Frame Machine M-001"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Category *</label>
              <select style={{...inp,cursor:'pointer'}} value={form.category} onChange={e=>onCatChange(e.target.value)}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Purchase Date *</label>
              <input type="date" style={inp} {...F('purchaseDate')}/>
            </div>
            <div>
              <label style={lbl}>Cost (₹) *</label>
              <input type="number" style={inp} {...F('cost')} placeholder="1800000"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Useful Life (Years) *</label>
              <input type="number" style={inp} {...F('usefulLifeYrs')} placeholder="15"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Dep. Method *</label>
              <select style={{...inp,cursor:'pointer'}} value={form.method} onChange={e=>onMethodChange(e.target.value)}>
                <option value="SLM">SLM — Straight Line</option>
                <option value="WDV">WDV — Written Down Value</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Dep. Rate (%) *</label>
              <input type="number" style={inp} {...F('depRate')} step="0.01" placeholder="6.67"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>
                {DEP_RATES[form.category]?.[form.method] ? `As per Companies Act: ${DEP_RATES[form.category][form.method]}%` : ''}
              </div>
            </div>
            <div>
              <label style={lbl}>Residual Value (₹)</label>
              <input type="number" style={inp} {...F('residualValue')} placeholder="0"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Location</label>
              <input style={inp} {...F('location')} placeholder="Shop Floor / Office"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Serial / Tag No</label>
              <input style={inp} {...F('serialNo')}
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Purchase Vendor</label>
              <input style={inp} {...F('purchaseVendor')}
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
          </div>

          {/* Preview depreciation */}
          {form.cost && form.depRate && (
            <div style={{background:'#EDE0EA',borderRadius:6,padding:'8px 14px',marginBottom:12,fontSize:12,display:'flex',gap:24}}>
              <span>Annual Dep: <strong>{INR2((parseFloat(form.cost)-parseFloat(form.residualValue||0))*parseFloat(form.depRate)/100)}</strong></span>
              <span>Monthly: <strong>{INR2((parseFloat(form.cost)-parseFloat(form.residualValue||0))*parseFloat(form.depRate)/100/12)}</strong></span>
              <span>WDV after 1 yr: <strong>{INR(parseFloat(form.cost)-(parseFloat(form.cost)-parseFloat(form.residualValue||0))*parseFloat(form.depRate)/100)}</strong></span>
            </div>
          )}

          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
              {saving ? 'Saving...' : editId ? 'Update Asset' : 'Add Asset'}
            </button>
            <button className="btn btn-s sd-bsm" onClick={()=>{ setShowForm(false); setEditId(null) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:4}}>
          <button onClick={()=>setCatFilter('all')} style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
            border:'1px solid #E0D5E0',background:catFilter==='all'?'#714B67':'#fff',color:catFilter==='all'?'#fff':'#6C757D'}}>
            All Categories
          </button>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCatFilter(catFilter===c?'all':c)} style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid #E0D5E0',background:catFilter===c?'#495057':'#fff',color:catFilter===c?'#fff':'#6C757D'}}>
              {c}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:4}}>
          {[['all','All'],['active','Active'],['under_repair','Under Repair'],['fully_depreciated','Fully Dep.'],['disposed','Disposed']].map(([k,l])=>(
            <button key={k} onClick={()=>setStatusFilter(k)} style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid #E0D5E0',background:statusFilter===k?'#E06F39':'#fff',color:statusFilter===k?'#fff':'#6C757D'}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading assets...</div>
      ) : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Code</th><th>Asset Name</th><th>Category</th><th>Purchased</th>
            <th style={{textAlign:'right'}}>Cost</th>
            <th style={{textAlign:'center'}}>Method</th>
            <th style={{textAlign:'right'}}>Dep/Year</th>
            <th style={{textAlign:'right'}}>Acc. Dep</th>
            <th style={{textAlign:'right'}}>WDV</th>
            <th style={{textAlign:'center'}}>Status</th>
            <th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={11} style={{padding:40,textAlign:'center',color:'#6C757D'}}>No assets found.</td></tr>
            ) : filtered.map(a=>{
              const sc = STATUS_CFG[a.status] || STATUS_CFG.active
              return (
                <tr key={a.id} onClick={()=>openDetail(a)} style={{cursor:'pointer'}}>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{a.code}</td>
                  <td><strong style={{fontSize:12}}>{a.name}</strong>
                    {a.location && <div style={{fontSize:10,color:'#6C757D'}}>{a.location}</div>}
                  </td>
                  <td style={{fontSize:12}}>{a.category}</td>
                  <td style={{fontSize:11}}>{a.purchaseDate?new Date(a.purchaseDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12}}>{INR(a.cost)}</td>
                  <td style={{textAlign:'center',fontSize:11}}>
                    <span style={{background:'#EDE0EA',color:'#714B67',padding:'2px 7px',borderRadius:8,fontWeight:700,fontSize:10}}>
                      {a.method}
                    </span>
                    <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{a.depRate}%</div>
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#E06F39',fontSize:12}}>{INR2(a.annualDep||0)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,color:'#721C24'}}>{INR(a.accDepreciation||0)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:13,
                    color: a.wdv<=0 ? '#721C24' : '#155724'}}>
                    {a.wdv<=0 ? '\u20b90' : INR(a.wdv)}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:sc.bg,color:sc.color,padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>{sc.label}</span>
                  </td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{display:'flex',gap:3}}>
                      <button className="btn-xs" onClick={()=>openEdit(a)}>Edit</button>
                      {a.status !== 'disposed' && (
                        <button className="btn-xs" style={{color:'#721C24',borderColor:'#F5C6CB',background:'#FFF5F5'}}
                          onClick={()=>{ setDisposeModal(a); setDisposeAmt(''); setDisposeReason('') }}>
                          Dispose
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #714B67'}}>
              <td colSpan={4} style={{padding:'9px 12px',color:'#714B67'}}>TOTAL — {filtered.length} assets</td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(filtered.reduce((a,r)=>a+r.cost,0))}</td>
              <td/>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#E06F39'}}>{INR2(filtered.reduce((a,r)=>a+(r.annualDep||0),0))}</td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#721C24'}}>{INR(filtered.reduce((a,r)=>a+(r.accDepreciation||0),0))}</td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:14,color:'#155724'}}>{INR(filtered.reduce((a,r)=>a+(r.wdv||0),0))}</td>
              <td colSpan={2}/>
            </tr>
          </tfoot>
        </table>
      )}

      {/* ── Asset Detail Modal ── */}
      {sel && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:40,overflowY:'auto'}}>
          <div style={{background:'#fff',borderRadius:12,width:760,maxWidth:'95vw',boxShadow:'0 8px 32px rgba(0,0,0,.2)',marginBottom:40}}>
            {/* Modal header */}
            <div style={{padding:'16px 20px',borderBottom:'1px solid #E0D5E0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67'}}>{sel.code} — {sel.name}</div>
                <div style={{fontSize:12,color:'#6C757D'}}>{sel.category} · {sel.method} @ {sel.depRate}%</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {(() => { const sc = STATUS_CFG[sel.status]||STATUS_CFG.active; return <span style={{background:sc.bg,color:sc.color,padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:700}}>{sc.label}</span> })()}
                <span onClick={()=>setSel(null)} style={{cursor:'pointer',fontSize:20,color:'#6C757D',padding:'0 4px'}}>&times;</span>
              </div>
            </div>

            <div style={{padding:20}}>
              {/* Asset details grid */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
                {[
                  ['Purchase Date', sel.purchaseDate ? new Date(sel.purchaseDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'],
                  ['Cost (Gross Block)', INR(sel.cost)],
                  ['Residual Value', INR(sel.residualValue||0)],
                  ['Useful Life', `${sel.usefulLifeYrs} Years`],
                  ['Annual Depreciation', INR2(sel.annualDep||0)],
                  ['Monthly Depreciation', INR2(sel.monthlyDep||0)],
                  ['Accumulated Dep.', INR(sel.accDepreciation||0)],
                  ['WDV (Book Value)', INR(sel.wdv||0)],
                  ['Dep % Consumed', `${Math.round((sel.accDepreciation||0)/(sel.cost||1)*100)}%`],
                  ...(sel.location ? [['Location', sel.location]] : []),
                  ...(sel.serialNo ? [['Serial No', sel.serialNo]] : []),
                  ...(sel.purchaseVendor ? [['Vendor', sel.purchaseVendor]] : []),
                ].map(([l,v])=>(
                  <div key={l}>
                    <div style={{fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase',marginBottom:3}}>{l}</div>
                    <div style={{fontWeight:600,fontSize:13}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* WDV progress bar */}
              <div style={{marginBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
                  <span style={{color:'#6C757D'}}>Depreciated</span>
                  <span style={{color:'#6C757D'}}>Remaining</span>
                </div>
                <div style={{background:'#F0EEEB',borderRadius:4,height:12,overflow:'hidden',display:'flex'}}>
                  <div style={{
                    width:`${Math.min(100,Math.round((sel.accDepreciation||0)/(sel.cost||1)*100))}%`,
                    background:'#DC3545',borderRadius:'4px 0 0 4px',transition:'width .4s'
                  }}/>
                  <div style={{flex:1,background:'#28A745',borderRadius:'0 4px 4px 0'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginTop:3}}>
                  <span style={{color:'#DC3545',fontWeight:600}}>{INR(sel.accDepreciation||0)}</span>
                  <span style={{color:'#28A745',fontWeight:700,fontSize:13}}>{INR(sel.wdv||0)}</span>
                </div>
              </div>

              <div style={{background:'#EDE0EA',borderRadius:6,padding:'8px 12px',fontSize:11,color:'#714B67',marginBottom:14}}>
                Monthly depreciation JV auto-posted: <strong>Dr 6400 Depreciation Expense</strong> / <strong>Cr 1500 Accumulated Depreciation</strong>
              </div>

              {/* Depreciation Schedule */}
              <div style={{fontWeight:700,fontSize:12,color:'#714B67',marginBottom:8}}>Depreciation Schedule (Full Life)</div>
              {schedLoading ? (
                <div style={{padding:16,textAlign:'center',color:'#6C757D',fontSize:12}}>Loading schedule...</div>
              ) : (
                <div style={{maxHeight:220,overflowY:'auto',border:'1px solid #E0D5E0',borderRadius:6}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead><tr style={{background:'#F8F4F8',position:'sticky',top:0}}>
                      <th style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#714B67'}}>Year</th>
                      <th style={{padding:'6px 10px',textAlign:'right',fontWeight:700}}>Opening WDV</th>
                      <th style={{padding:'6px 10px',textAlign:'right',fontWeight:700,color:'#E06F39'}}>Depreciation</th>
                      <th style={{padding:'6px 10px',textAlign:'right',fontWeight:700,color:'#155724'}}>Closing WDV</th>
                    </tr></thead>
                    <tbody>
                      {schedule.map((s,i)=>(
                        <tr key={i} style={{borderTop:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                          <td style={{padding:'5px 10px',fontFamily:'DM Mono,monospace',fontWeight:600}}>{s.year}</td>
                          <td style={{padding:'5px 10px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR2(s.opening)}</td>
                          <td style={{padding:'5px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#E06F39',fontWeight:700}}>{INR2(s.dep)}</td>
                          <td style={{padding:'5px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,
                            color:s.closing<=0?'#DC3545':'#155724'}}>{INR2(s.closing)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{display:'flex',gap:8,marginTop:14}}>
                <button className="btn btn-s sd-bsm" onClick={()=>openEdit(sel)}>Edit Asset</button>
                {sel.status !== 'disposed' && (
                  <button className="btn btn-s sd-bsm" style={{color:'#721C24',borderColor:'#F5C6CB'}}
                    onClick={()=>{ setDisposeModal(sel); setSel(null); setDisposeAmt(''); setDisposeReason('') }}>
                    Dispose Asset
                  </button>
                )}
                <button className="btn btn-s sd-bsm" onClick={()=>setSel(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Run Depreciation Modal ── */}
      {depModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:500,boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67',marginBottom:4}}>
              Run Monthly Depreciation
            </div>
            <div style={{fontSize:12,color:'#6C757D',marginBottom:14}}>
              Posts depreciation JV for all active assets for selected period.
            </div>
            <div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:6,padding:'8px 12px',marginBottom:14,fontSize:11,color:'#856404'}}>
              This posts: <strong>Dr 6400 Depreciation / Cr 1500 Accumulated Depreciation</strong> for each active asset.
              Monthly dep total: <strong>{INR2(summary.monthlyDep||0)}</strong>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Period (YYYY-MM)</label>
              <input style={inp} value={depPeriod} onChange={e=>setDepPeriod(e.target.value)}
                placeholder="2026-04" type="month"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>

            {depResults && (
              <div style={{maxHeight:180,overflowY:'auto',border:'1px solid #E0D5E0',borderRadius:6,marginBottom:14}}>
                {depResults.map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 10px',
                    borderBottom:'1px solid #F0EEEB',fontSize:11,
                    background:r.status==='posted'?'#F0FFF4':r.status==='already_posted'?'#FFF3CD':'#FFF5F5'}}>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:600}}>{r.asset}</span>
                    <span>{r.name}</span>
                    <span style={{fontFamily:'DM Mono,monospace',color:r.status==='posted'?'#155724':'#856404'}}>
                      {r.status==='posted' ? INR2(r.depAmt) : r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p sd-bsm" disabled={depRunning} onClick={runDepreciation}>
                {depRunning ? 'Running...' : `Post Depreciation — ${depPeriod}`}
              </button>
              <button className="btn btn-s sd-bsm" onClick={()=>{ setDepModal(false); setDepResults(null) }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dispose Asset Modal ── */}
      {disposeModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:460,boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#721C24',marginBottom:4}}>Dispose Asset</div>
            <div style={{fontSize:13,color:'#6C757D',marginBottom:14}}>
              <strong>{disposeModal.code}</strong> — {disposeModal.name}
              <div style={{fontSize:12,marginTop:4}}>WDV: <strong>{INR(disposeModal.wdv||0)}</strong></div>
            </div>
            <div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:6,padding:'8px 12px',marginBottom:14,fontSize:11,color:'#856404'}}>
              JV posted: Remove asset at cost, remove acc dep, record sale proceeds + gain/loss on disposal.
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={lbl}>Disposal Date</label>
                <input type="date" style={inp} value={disposeDate} onChange={e=>setDisposeDate(e.target.value)}/>
              </div>
              <div>
                <label style={lbl}>Sale Proceeds (₹)</label>
                <input type="number" style={inp} value={disposeAmt} onChange={e=>setDisposeAmt(e.target.value)}
                  placeholder="0 if scrapped"
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={lbl}>Reason</label>
                <input style={inp} value={disposeReason} onChange={e=>setDisposeReason(e.target.value)}
                  placeholder="Sold / Scrapped / Obsolete / Lost..."
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              </div>
            </div>
            {disposeAmt && (
              <div style={{background: parseFloat(disposeAmt)>=(disposeModal.wdv||0)?'#D4EDDA':'#FFF3CD',
                border:'1px solid #C3E6CB',borderRadius:6,padding:'6px 12px',marginBottom:12,fontSize:11,
                color: parseFloat(disposeAmt)>=(disposeModal.wdv||0)?'#155724':'#856404',fontWeight:600}}>
                {parseFloat(disposeAmt) >= (disposeModal.wdv||0)
                  ? `Profit on disposal: ${INR(parseFloat(disposeAmt)-(disposeModal.wdv||0))}`
                  : `Loss on disposal: ${INR((disposeModal.wdv||0)-parseFloat(disposeAmt))}`}
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p sd-bsm" disabled={disposing} onClick={disposeAsset}
                style={{background:'#DC3545',border:'1px solid #DC3545'}}>
                {disposing ? 'Processing...' : 'Confirm Disposal'}
              </button>
              <button className="btn btn-s sd-bsm" onClick={()=>setDisposeModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
