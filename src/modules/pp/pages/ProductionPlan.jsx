import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const STATUS_STYLE = {
  Draft:        ['#E2E3E5','#383d41'],
  Planned:      ['#D1ECF1','#0C5460'],
  'WO Created': ['#FFF3CD','#856404'],
  Released:     ['#CCE5FF','#004085'],
  'In Progress':['#EDE0EA','#714B67'],
  Completed:    ['#D4EDDA','#155724'],
  Cancelled:    ['#F8D7DA','#721C24'],
}

const PRIORITIES = ['Critical','High','Normal','Low']
const UOM_LIST   = ['Nos','Kg','Metre','Litre','Set','Box','Pair','Lot']

const INIT = {
  itemName:'', itemCode:'', plannedQty:'', uom:'Nos',
  startDate:'', endDate:'', workCenter:'', priority:'Normal',
  soNo:'', planMonth:'', remarks:''
}

const SEED = [
  { id:1, planNo:'PLAN-2026-0001', itemName:'PP Cap 20ml',           itemCode:'CAP-20ML',  plannedQty:10000, uom:'Nos', startDate:'2026-05-01', endDate:'2026-05-03', priority:'High',     status:'Draft',      soNo:'SO-2026-001', workCenter:'IMM-150T' },
  { id:2, planNo:'PLAN-2026-0002', itemName:'HDPE Container 500ml',  itemCode:'CTN-500ML', plannedQty:5000,  uom:'Nos', startDate:'2026-05-04', endDate:'2026-05-06', priority:'Normal',   status:'Planned',    soNo:'SO-2026-002', workCenter:'IMM-200T' },
  { id:3, planNo:'PLAN-2026-0003', itemName:'ABS Housing Cover',     itemCode:'HSG-ABS01', plannedQty:2000,  uom:'Nos', startDate:'2026-05-07', endDate:'2026-05-09', priority:'High',     status:'WO Created', soNo:'SO-2026-003', workCenter:'IMM-150T' },
  { id:4, planNo:'PLAN-2026-0004', itemName:'Nylon Gear — 24T',      itemCode:'NGR-24T',   plannedQty:3000,  uom:'Nos', startDate:'2026-05-10', endDate:'2026-05-12', priority:'Normal',   status:'Draft',      soNo:'',            workCenter:'IMM-80T'  },
]

export default function ProductionPlan() {
  const nav = useNavigate()
  const [plans,    setPlans]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('All')
  const [search,   setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(INIT)
  const [planNo,   setPlanNo]   = useState('Auto')
  const [saving,   setSaving]   = useState(false)
  const [items,    setItems]    = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rP, rN, rI] = await Promise.all([
        fetch(`${BASE_URL}/pp/plan`,         { headers: hdr2() }),
        fetch(`${BASE_URL}/pp/plan/next-no`, { headers: hdr2() }),
        fetch(`${BASE_URL}/mdm/item`,        { headers: hdr2() }),
      ])
      const [dP, dN, dI] = await Promise.all([rP.json(), rN.json(), rI.json()])
      setPlans(dP.data?.length ? dP.data : SEED)
      setPlanNo(dN.planNo || 'PLAN-AUTO')
      setItems(dI.data || [])
    } catch { setPlans(SEED) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const fSet = k => e => setForm(f => ({ ...f, [k]: typeof e === 'object' ? e.target.value : e }))

  // Auto-fill from item selection
  const onItemSelect = e => {
    const item = items.find(i => i.code === e.target.value)
    setForm(f => ({ ...f, itemCode: e.target.value, itemName: item?.name || f.itemName, uom: item?.uom || f.uom }))
  }

  const savePlan = async () => {
    if (!form.itemName)   return toast.error('Item name is required')
    if (!form.plannedQty) return toast.error('Planned quantity is required')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/pp/plan`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ ...form, planNo, plannedQty: parseFloat(form.plannedQty) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(`${data.data?.planNo} created`)
      setShowForm(false); setForm(INIT); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ── CREATE WO from Plan ───────────────────────────────────────
  // This is the ONLY entry point for WO creation
  const createWO = (plan) => {
    nav(`/pp/wo/new?planId=${plan.id}&soNo=${plan.soNo||''}&itemCode=${plan.itemCode||''}&itemName=${encodeURIComponent(plan.itemName)}&qty=${plan.plannedQty}&uom=${plan.uom}`)
  }

  // ── Status update ─────────────────────────────────────────────
  const updateStatus = async (id, status) => {
    try {
      await fetch(`${BASE_URL}/pp/plan/${id}`, { method:'PUT', headers: hdr(), body: JSON.stringify({ status }) })
      toast.success(`Plan marked as ${status}`)
      load()
    } catch { toast.error('Failed to update') }
  }

  const STATUSES = ['All','Draft','Planned','WO Created','Released','In Progress','Completed']
  const shown    = plans.filter(p => {
    const ms = filter === 'All' || p.status === filter
    const mt = !search || p.planNo?.toLowerCase().includes(search.toLowerCase()) ||
      p.itemName?.toLowerCase().includes(search.toLowerCase()) || p.soNo?.toLowerCase().includes(search.toLowerCase())
    return ms && mt
  })

  // Group by week
  const grouped = {}
  shown.forEach(p => {
    const wk = p.startDate
      ? `Week of ${new Date(p.startDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}`
      : 'Unscheduled'
    if (!grouped[wk]) grouped[wk] = []
    grouped[wk].push(p)
  })

  // KPIs
  const totalPlanned  = plans.filter(p=>p.status==='Planned').length
  const totalWO       = plans.filter(p=>p.status==='WO Created'||p.status==='Released'||p.status==='In Progress').length
  const totalDone     = plans.filter(p=>p.status==='Completed').length
  const totalDraft    = plans.filter(p=>p.status==='Draft').length

  const SHdr = () => (
    <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)', padding:'8px 14px', borderRadius:'6px 6px 0 0', marginBottom:0 }}>
      <span style={{ color:'#fff', fontSize:13, fontWeight:700, fontFamily:'Syne,sans-serif' }}>New Production Plan — {planNo}</span>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Production Plan <small>Manufacturing Schedule</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="Plan No / Item / SO..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/mrp')}>Run MRP</button>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/gantt')}>Gantt</button>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={()=>setShowForm(s=>!s)}>
            {showForm ? 'Cancel' : '+ New Plan'}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
        {[
          ['Draft',       totalDraft,   '#E2E3E5','#383d41'],
          ['Planned',     totalPlanned, '#D1ECF1','#0C5460'],
          ['WO Created',  totalWO,      '#FFF3CD','#856404'],
          ['Completed',   totalDone,    '#D4EDDA','#155724'],
        ].map(([l,v,bg,c])=>(
          <div key={l} style={{background:bg,borderRadius:8,padding:'10px 16px',textAlign:'center',cursor:'pointer'}} onClick={()=>setFilter(l)}>
            <div style={{fontSize:22,fontWeight:800,color:c,fontFamily:'DM Mono,monospace'}}>{v}</div>
            <div style={{fontSize:11,fontWeight:700,color:c,opacity:.8}}>{l}</div>
          </div>
        ))}
      </div>

      {/* New Plan form */}
      {showForm && (
        <div style={{border:'2px solid #714B67',borderRadius:8,overflow:'hidden',marginBottom:16}}>
          <SHdr />
          <div style={{padding:16,background:'#FDF8FC'}}>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={lbl}>Item / Product *</label>
                <select style={{...inp,cursor:'pointer'}} value={form.itemCode} onChange={onItemSelect}>
                  <option value="">-- Select Item --</option>
                  {items.filter(i=>i.type==='FG'||i.type==='Semi-FG'||!i.type).map(i=>(
                    <option key={i.id} value={i.code}>{i.code} · {i.name}</option>
                  ))}
                </select>
                {!items.length && (
                  <input style={inp} value={form.itemName} onChange={fSet('itemName')} placeholder="Type item name..." />
                )}
              </div>
              <div>
                <label style={lbl}>Planned Qty *</label>
                <input type="number" style={inp} value={form.plannedQty} onChange={fSet('plannedQty')} placeholder="500"/>
              </div>
              <div>
                <label style={lbl}>UOM</label>
                <select style={{...inp,cursor:'pointer'}} value={form.uom} onChange={fSet('uom')}>
                  {UOM_LIST.map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <select style={{...inp,cursor:'pointer'}} value={form.priority} onChange={fSet('priority')}>
                  {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={lbl}>Start Date</label>
                <input type="date" style={inp} value={form.startDate} onChange={fSet('startDate')}/>
              </div>
              <div>
                <label style={lbl}>End Date</label>
                <input type="date" style={inp} value={form.endDate} onChange={fSet('endDate')}/>
              </div>
              <div>
                <label style={lbl}>Work Center</label>
                <input style={inp} value={form.workCenter} onChange={fSet('workCenter')} placeholder="e.g. BOOTH-01"/>
              </div>
              <div>
                <label style={lbl}>SO Reference</label>
                <input style={inp} value={form.soNo} onChange={fSet('soNo')} placeholder="SO-2026-001"/>
              </div>
              <div>
                <label style={lbl}>Remarks</label>
                <input style={inp} value={form.remarks} onChange={fSet('remarks')} placeholder="Notes..."/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="btn btn-s sd-bsm" onClick={()=>setShowForm(false)}>Cancel</button>
              <button className="btn btn-p sd-bsm" disabled={saving} onClick={savePlan}>
                {saving ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status chips */}
      <div className="pp-chips">
        {STATUSES.map(s=>(
          <div key={s} className={`pp-chip${filter===s?' on':''}`} onClick={()=>setFilter(s)}>
            {s} <span>{s==='All'?plans.length:plans.filter(p=>p.status===s).length}</span>
          </div>
        ))}
      </div>

      {/* Plan groups by week */}
      {loading ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading production plans...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8,background:'#fff'}}>
          <div style={{fontSize:36,marginBottom:10}}>📋</div>
          <div style={{fontWeight:700,fontSize:15,color:'#333'}}>No production plans yet</div>
          <div style={{fontSize:12,marginTop:6}}>Create a plan first, then generate Work Orders from each plan.</div>
          <button className="btn btn-p sd-bsm" style={{marginTop:14}} onClick={()=>setShowForm(true)}>+ Create First Plan</button>
        </div>
      ) : (
        Object.entries(grouped).map(([week, items]) => (
          <div key={week} style={{marginBottom:20}}>
            {/* Week header */}
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:'2px solid #EDE0EA',marginBottom:10}}>
              <div style={{fontWeight:800,color:'#714B67',fontSize:11,textTransform:'uppercase',letterSpacing:.5}}>{week}</div>
              <div style={{fontSize:11,color:'#6C757D'}}>{items.length} plans</div>
              <div style={{fontSize:11,color:'#6C757D',marginLeft:'auto'}}>
                Total: {items.reduce((a,p)=>a+parseFloat(p.plannedQty||0),0).toFixed(0)} units planned
              </div>
            </div>

            {items.map(p => {
              const [bg,tx] = STATUS_STYLE[p.status] || ['#EEE','#333']
              const canCreateWO = p.status === 'Draft' || p.status === 'Planned'
              const hasWO       = p.status === 'WO Created' || p.status === 'Released' || p.status === 'In Progress'

              return (
                <div key={p.id} style={{
                  background:'#fff', border:'1px solid #E0D5E0', borderRadius:8,
                  marginBottom:8, overflow:'hidden',
                  boxShadow:'0 1px 4px rgba(0,0,0,.05)',
                }}>
                  <div style={{display:'flex',alignItems:'center',padding:'12px 16px',gap:14}}>

                    {/* Plan number */}
                    <div style={{minWidth:130}}>
                      <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,color:'var(--odoo-purple)',fontSize:12}}>{p.planNo}</div>
                      {p.soNo && <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>SO: {p.soNo}</div>}
                    </div>

                    {/* Item */}
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13}}>{p.itemName}</div>
                      <div style={{fontSize:11,color:'#6C757D',marginTop:2,display:'flex',gap:12}}>
                        {p.itemCode && <span style={{fontFamily:'DM Mono,monospace'}}>{p.itemCode}</span>}
                        {p.workCenter && <span>WC: {p.workCenter}</span>}
                        {p.remarks && <span style={{fontStyle:'italic'}}>{p.remarks}</span>}
                      </div>
                    </div>

                    {/* Qty */}
                    <div style={{textAlign:'right',minWidth:90}}>
                      <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:18,color:'#714B67'}}>
                        {parseFloat(p.plannedQty||0).toLocaleString()}
                      </div>
                      <div style={{fontSize:10,color:'#6C757D'}}>{p.uom}</div>
                    </div>

                    {/* Dates */}
                    <div style={{textAlign:'center',minWidth:110,fontSize:11,color:'#6C757D'}}>
                      {p.startDate && <div>{new Date(p.startDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div>}
                      {p.endDate   && <div style={{fontSize:10,color:'#999'}}>→ {new Date(p.endDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div>}
                    </div>

                    {/* Priority */}
                    <div style={{minWidth:60,textAlign:'center'}}>
                      <span style={{
                        fontWeight:700, fontSize:11,
                        color: p.priority==='Critical'?'#721C24':p.priority==='High'?'#DC3545':p.priority==='Normal'?'#6C757D':'#ADB5BD'
                      }}>{p.priority}</span>
                    </div>

                    {/* Status */}
                    <div style={{minWidth:100,textAlign:'center'}}>
                      <span style={{background:bg,color:tx,padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:700}}>
                        {p.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{display:'flex',gap:6,minWidth:160,justifyContent:'flex-end'}}>
                      {canCreateWO && (
                        <button
                          onClick={() => createWO(p)}
                          style={{padding:'6px 14px',background:'#714B67',color:'#fff',border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
                          + Create WO
                        </button>
                      )}
                      {hasWO && (
                        <button className="btn-xs" onClick={()=>nav(`/pp/wo?planId=${p.id}`)}>View WOs</button>
                      )}
                      {p.status === 'Draft' && (
                        <button className="btn-xs" onClick={()=>updateStatus(p.id,'Planned')}>Mark Planned</button>
                      )}
                    </div>
                  </div>

                  {/* WO created indicator */}
                  {hasWO && (
                    <div style={{background:'#D4EDDA',borderTop:'1px solid #C3E6CB',padding:'5px 16px',display:'flex',gap:8,alignItems:'center',fontSize:11}}>
                      <span style={{color:'#155724',fontWeight:700}}>✓ Work Order created and released to production floor</span>
                      <button className="btn-xs" style={{marginLeft:'auto'}} onClick={()=>nav(`/pp/entry-list`)}>
                        Go to Production Entry →
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
