import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHeaders = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN')

const PATTERNS = [
  { id:'ROUTING', label:'🛠️ Routing-Based', desc:'Machining, fabrication, assembly — from BOM + Routing + Work Centers' },
  { id:'CYCLE',   label:'⚙️ Cycle-Based',   desc:'Injection/blow moulding — cavity + cycle time driven' },
  { id:'BATCH',   label:'🔥 Batch-Based',   desc:'Heat treatment, textile — whole batch processed together' },
  { id:'SURFACE', label:'🎨 Surface Treatment', desc:'Powder Coating, CED, Liquid Painting — rate per Kg or Sq.Ft by material type' },
]

export default function CostPricing() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const itemCode = params.get('itemCode')

  const [pricingQty, setPricingQty] = useState('1')
  const [efficiency, setEfficiency] = useState('100')
  const [pattern, setPattern] = useState(null) // null = not yet chosen/detected
  const [costData, setCostData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [marginPct, setMarginPct] = useState('')
  const [saving, setSaving] = useState(false)

  // Pattern-specific params (CYCLE/BATCH) — pre-filled from saved data if it exists
  const [cp, setCp] = useState({
    partWeightKg:'', cavityCount:'', cycleTimeSec:'', mouldCost:'', mouldLifeShots:'', powerCostPerKg:'',
    batchSize:'', batchCycleTimeMin:'', batchPowerCost:'',
    machineDepCostPerPart:'', packingCostPerPart:'', transportCostPerPart:'',
    perHourOverhead:'', overheadPeriodHrs:'8', marketingPct:'',
  })
  const [savingParams, setSavingParams] = useState(false)

  // Surface Treatment pattern state
  const [stProcesses, setStProcesses] = useState([])
  const [stProcessName, setStProcessName] = useState('')
  const [stUomBasis, setStUomBasis] = useState('KG')
  const [stWeightOrArea, setStWeightOrArea] = useState('')
  const [stData, setStData] = useState(null)
  const [stLoading, setStLoading] = useState(false)
  // New/edit process rate form
  const [stEditing, setStEditing] = useState(false)
  const [stForm, setStForm] = useState({
    processName:'', rmType:'NONE', rmRatePerKg:'', coverageRatioKg:'',
    labourCostPerKg:'', energyCostPerKg:'', electricityCostPerKg:'', maintenanceCostPerKg:'',
    packingCostPerKg:'', consumablesCostPerKg:'', adminCostPerKg:'', employeeCostPerKg:'',
    labourCostPerSqft:'', energyCostPerSqft:'', electricityCostPerSqft:'', maintenanceCostPerSqft:'',
    packingCostPerSqft:'', consumablesCostPerSqft:'', adminCostPerSqft:'', employeeCostPerSqft:'',
    marketingPct:'', rmComponents:[],
  })

  const loadStProcesses = async () => {
    const r = await fetch(`${BASE_URL}/pp/surface-treatment-processes`, { headers: authHeaders() })
    const d = await r.json()
    setStProcesses(d.data||[])
  }
  useEffect(() => { if (pattern === 'SURFACE') loadStProcesses() }, [pattern])

  const calcStCost = async () => {
    if (!stProcessName || !stWeightOrArea) return
    setStLoading(true)
    try {
      const q = new URLSearchParams({ processName: stProcessName, uomBasis: stUomBasis,
        weightOrArea: stWeightOrArea, qty: pricingQty, efficiency })
      const r = await fetch(`${BASE_URL}/pp/surface-treatment-cost?${q}`, { headers: authHeaders() })
      const d = await r.json()
      if (d.error) { toast.error(d.error); setStData(null) }
      else setStData(d.data)
    } catch { toast.error('Failed to calculate') }
    finally { setStLoading(false) }
  }

  const saveStProcess = async () => {
    setSavingParams(true)
    try {
      const r = await fetch(`${BASE_URL}/pp/surface-treatment-processes`, { method:'POST', headers: authHeaders(), body: JSON.stringify(stForm) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(d.message)
      setStEditing(false)
      loadStProcesses()
    } catch { toast.error('Failed to save process') }
    finally { setSavingParams(false) }
  }

  const stSuggested = stData ? Math.round(stData.costPerPiece * (1 + (parseFloat(marginPct||stData.marketingPct||0)/100)) * 100)/100 : 0

  const loadCostEstimate = async (qty, eff, pat) => {
    if (!itemCode) return
    setLoading(true)
    try {
      const q = new URLSearchParams({ qty, efficiency: eff })
      if (pat) q.set('pattern', pat)
      const r = await fetch(`${BASE_URL}/pp/standard-cost/${encodeURIComponent(itemCode)}?${q}`, { headers: authHeaders() })
      const d = await r.json()
      if (d.error) { toast.error(d.error); setCostData(null) }
      else {
        setCostData(d.data)
        if (!pattern) setPattern(d.data.pattern) // adopt whatever the backend detected, first load only
        if (marginPct === '' && d.data.defaultMarginPct != null) setMarginPct(String(d.data.defaultMarginPct))
      }
    } catch { toast.error('Failed to load cost estimate') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadCostEstimate(pricingQty, efficiency, pattern) }, [itemCode])

  const switchPattern = (newPattern) => {
    setPattern(newPattern)
    if (newPattern !== 'SURFACE') loadCostEstimate(pricingQty, efficiency, newPattern)
  }

  const suggested = costData ? Math.round(costData.costPerPiece * (1 + (parseFloat(marginPct||0)/100)) * 100)/100 : 0

  const saveParams = async () => {
    setSavingParams(true)
    try {
      const r = await fetch(`${BASE_URL}/pp/standard-cost/${encodeURIComponent(itemCode)}/params`, {
        method:'POST', headers: authHeaders(), body: JSON.stringify({ pattern, ...cp }),
      })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success('Costing parameters saved')
      loadCostEstimate(pricingQty, efficiency, pattern)
    } catch { toast.error('Failed to save parameters') }
    finally { setSavingParams(false) }
  }

  const applyPricing = async () => {
    if (!costData) return
    setSaving(true)
    try {
      const listRes = await fetch(`${BASE_URL}/items?search=${encodeURIComponent(itemCode)}`, { headers: authHeaders() })
      const listData = await listRes.json()
      const item = (listData.data||[]).find(i => i.code === itemCode)
      if (!item) return toast.error('Could not find item to update')
      const r = await fetch(`${BASE_URL}/items/${item.id}`, {
        method:'PATCH', headers: authHeaders(),
        body: JSON.stringify({ stdCost: costData.costPerPiece, mrp: suggested }),
      })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ Saved — Std Cost ₹${costData.costPerPiece}, MRP ₹${suggested}`)
    } catch { toast.error('Failed to save pricing') }
    finally { setSaving(false) }
  }

  if (!itemCode) return (
    <div style={{padding:60,textAlign:'center',color:'#aaa'}}>
      No item specified — open this from an item's Cost & Pricing button in Item Master.
    </div>
  )

  const cpField = (key, label, ph='') => (
    <div>
      <label style={{fontSize:11,color:'#888'}}>{label}</label>
      <input type='number' value={cp[key]} onChange={e=>setCp({...cp,[key]:e.target.value})}
        placeholder={ph} style={{display:'block',marginTop:4,padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,width:'100%',boxSizing:'border-box',fontSize:12}} />
    </div>
  )

  return (
    <div style={{fontFamily:'DM Sans,sans-serif',maxWidth:760}}>
      <div style={{background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'14px 20px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#714B67'}}>💰 Cost & Pricing — {itemCode}</div>
          <div style={{fontSize:12,color:'#888',marginTop:2}}>{costData?.itemName || 'Loading...'}</div>
        </div>
        <button onClick={()=>nav('/mdm/items')} style={{padding:'7px 14px',background:'#fff',border:'1px solid #ddd',borderRadius:6,cursor:'pointer',fontWeight:600,color:'#555'}}>← Back to Item Master</button>
      </div>

      <div style={{padding:'0 20px 20px'}}>
        {/* Pattern selector — one shared engine, three production-rate patterns */}
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
          {PATTERNS.map(p => (
            <button key={p.id} onClick={()=>switchPattern(p.id)} title={p.desc}
              style={{padding:'8px 14px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700,
                border: pattern===p.id ? '2px solid #714B67' : '1.5px solid #E0D5E0',
                background: pattern===p.id ? '#F3EAF1' : '#fff',
                color: pattern===p.id ? '#714B67' : '#888'}}>
              {p.label}
            </button>
          ))}
        </div>
        {pattern && <div style={{fontSize:11,color:'#888',marginBottom:14}}>{PATTERNS.find(p=>p.id===pattern)?.desc}</div>}
        {costData?.isApproximatedPattern && (
          <div style={{fontSize:11,color:'#B8860B',background:'#FEF9E7',padding:'8px 12px',borderRadius:6,marginBottom:14}}>
            ⚠️ This item's industry (continuous process, e.g. textile spinning) doesn't precisely fit any of the three patterns — Batch is the closest approximation, not an exact model. Treat this cost as directional, not precise.
          </div>
        )}

        <div style={{display:'flex',gap:10,alignItems:'flex-end',marginBottom:14,flexWrap:'wrap'}}>
          <div>
            <label style={{fontSize:11,color:'#888'}}>Quantity for costing basis</label>
            <input type='number' min='1' value={pricingQty}
              onChange={e=>setPricingQty(e.target.value)}
              onBlur={()=>loadCostEstimate(pricingQty, efficiency, pattern)}
              style={{display:'block',marginTop:4,padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,width:100,fontSize:13}} />
          </div>
          <div>
            <label style={{fontSize:11,color:'#888'}}>Real-world Efficiency % <span style={{color:'#B8860B'}}>(manual — 100% assumes zero downtime/rejects)</span></label>
            <input type='number' min='1' max='100' value={efficiency}
              onChange={e=>setEfficiency(e.target.value)}
              onBlur={()=>loadCostEstimate(pricingQty, efficiency, pattern)}
              style={{display:'block',marginTop:4,padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,width:100,fontSize:13}} />
          </div>
          <button onClick={()=>loadCostEstimate(pricingQty, efficiency, pattern)}
            style={{padding:'8px 14px',background:'#F0EBF0',color:'#714B67',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
            🔄 Recalculate
          </button>
        </div>

        {/* CYCLE pattern params */}
        {pattern === 'CYCLE' && (
          <div style={{background:'#FAF8FA',border:'1px solid #E0D5E0',borderRadius:8,padding:14,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#714B67',marginBottom:10}}>Moulding Parameters</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
              {cpField('partWeightKg','Part Weight (Kg)','0.028')}
              {cpField('cavityCount','Cavity Count','8')}
              {cpField('cycleTimeSec','Cycle Time (sec)','18')}
              {cpField('mouldCost','Mould Cost (₹)','1200000')}
              {cpField('mouldLifeShots','Mould Life (shots)','1000000')}
              {cpField('powerCostPerKg','Power Cost/Kg (₹)','10')}
              {cpField('machineDepCostPerPart','Machine Dep/Part (₹)','0.15')}
              {cpField('packingCostPerPart','Packing/Part (₹)','0.03')}
              {cpField('transportCostPerPart','Transport/Part (₹)','0.1')}
              {cpField('perHourOverhead','Overhead per Period (₹)','1600')}
              {cpField('overheadPeriodHrs','Overhead Period (hrs)','8')}
              {cpField('marketingPct','Marketing %','2')}
            </div>
            <button onClick={saveParams} disabled={savingParams}
              style={{padding:'7px 14px',background:'#714B67',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
              {savingParams ? 'Saving...' : '💾 Save Moulding Parameters'}
            </button>
          </div>
        )}

        {/* BATCH pattern params */}
        {pattern === 'BATCH' && (
          <div style={{background:'#FAF8FA',border:'1px solid #E0D5E0',borderRadius:8,padding:14,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#714B67',marginBottom:10}}>Batch Process Parameters</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
              {cpField('batchSize','Batch Size (units)','50')}
              {cpField('batchCycleTimeMin','Batch Cycle Time (min)','90')}
              {cpField('batchPowerCost','Power Cost / Batch (₹)','200')}
              {cpField('machineDepCostPerPart','Fixture/Jig Dep per Part (₹)','0.10')}
              {cpField('packingCostPerPart','Packing/Part (₹)','0.05')}
              {cpField('transportCostPerPart','Transport/Part (₹)','0.10')}
              {cpField('perHourOverhead','Overhead per Period (₹)','1600')}
              {cpField('overheadPeriodHrs','Overhead Period (hrs)','8')}
              {cpField('marketingPct','Marketing %','2')}
            </div>
            <button onClick={saveParams} disabled={savingParams}
              style={{padding:'7px 14px',background:'#714B67',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
              {savingParams ? 'Saving...' : '💾 Save Batch Parameters'}
            </button>
          </div>
        )}

        {/* SURFACE TREATMENT — Powder Coating / CED / Liquid Painting.
            Rates live on the process, reusable across items — select
            which process this item goes through fresh, each costing. */}
        {pattern === 'SURFACE' && (
          <div>
            <div style={{background:'#FAF8FA',border:'1px solid #E0D5E0',borderRadius:8,padding:14,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:700,color:'#714B67'}}>Process & Material</div>
                <button onClick={()=>setStEditing(!stEditing)}
                  style={{padding:'5px 10px',background:'#F0EBF0',color:'#714B67',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>
                  {stEditing ? '✕ Cancel' : '+ New / Edit Process Rates'}
                </button>
              </div>

              {!stEditing ? (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                  <div>
                    <label style={{fontSize:11,color:'#888'}}>Process</label>
                    <select value={stProcessName} onChange={e=>setStProcessName(e.target.value)}
                      style={{display:'block',marginTop:4,padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,width:'100%',fontSize:12}}>
                      <option value=''>Select process...</option>
                      {stProcesses.map(p=><option key={p.id} value={p.processName}>{p.processName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:'#888'}}>Material Type → UOM Basis</label>
                    <select value={stUomBasis} onChange={e=>setStUomBasis(e.target.value)}
                      style={{display:'block',marginTop:4,padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,width:'100%',fontSize:12}}>
                      <option value='KG'>Casting / Aluminium — Kg</option>
                      <option value='SQFT'>Sheet Metal — Sq.Ft</option>
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:'#888'}}>Component {stUomBasis==='KG'?'Weight (Kg)':'Area (Sq.Ft)'}</label>
                    <input type='number' value={stWeightOrArea} onChange={e=>setStWeightOrArea(e.target.value)}
                      onBlur={calcStCost} placeholder={stUomBasis==='KG'?'1':'2.5'}
                      style={{display:'block',marginTop:4,padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,width:'100%',boxSizing:'border-box',fontSize:12}} />
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                    <div>
                      <label style={{fontSize:11,color:'#888'}}>Process Name</label>
                      <input value={stForm.processName} onChange={e=>setStForm({...stForm,processName:e.target.value})}
                        placeholder='Powder Coating / CED / Liquid Painting'
                        style={{display:'block',marginTop:4,padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,width:'100%',boxSizing:'border-box',fontSize:12}} />
                    </div>
                    <div>
                      <label style={{fontSize:11,color:'#888'}}>RM Type</label>
                      <select value={stForm.rmType} onChange={e=>setStForm({...stForm,rmType:e.target.value})}
                        style={{display:'block',marginTop:4,padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,width:'100%',fontSize:12}}>
                        <option value='NONE'>None (e.g. CED — dip-tank process)</option>
                        <option value='COVERAGE'>Coverage Ratio (e.g. Powder Coating)</option>
                        <option value='MULTI_COMPONENT'>Multi-Component BOM (e.g. Liquid Painting)</option>
                      </select>
                    </div>
                  </div>

                  {stForm.rmType === 'COVERAGE' && (
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                      <div>
                        <label style={{fontSize:11,color:'#888'}}>RM Rate (₹/Kg) — e.g. powder cost</label>
                        <input type='number' value={stForm.rmRatePerKg} onChange={e=>setStForm({...stForm,rmRatePerKg:e.target.value})}
                          placeholder='180' style={{display:'block',marginTop:4,padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,width:'100%',boxSizing:'border-box',fontSize:12}} />
                      </div>
                      <div>
                        <label style={{fontSize:11,color:'#888'}}>Coverage Ratio (Kg part per Kg RM) — supplier-recommended, not optimistic target</label>
                        <input type='number' value={stForm.coverageRatioKg} onChange={e=>setStForm({...stForm,coverageRatioKg:e.target.value})}
                          placeholder='275' style={{display:'block',marginTop:4,padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,width:'100%',boxSizing:'border-box',fontSize:12}} />
                      </div>
                    </div>
                  )}

                  {stForm.rmType === 'MULTI_COMPONENT' && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11,color:'#888',marginBottom:6}}>RM Components (Paint, Primer, Top Coat, Thinner, Hardener...)</div>
                      {stForm.rmComponents.map((c,i)=>(
                        <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:8,marginBottom:6}}>
                          <input value={c.componentName} onChange={e=>{const arr=[...stForm.rmComponents];arr[i]={...arr[i],componentName:e.target.value};setStForm({...stForm,rmComponents:arr})}}
                            placeholder='Component name' style={{padding:'6px 8px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12}} />
                          <input type='number' value={c.ratePerKg} onChange={e=>{const arr=[...stForm.rmComponents];arr[i]={...arr[i],ratePerKg:e.target.value};setStForm({...stForm,rmComponents:arr})}}
                            placeholder='₹/Kg' style={{padding:'6px 8px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12}} />
                          <input type='number' value={c.consumptionKgPerUnit} onChange={e=>{const arr=[...stForm.rmComponents];arr[i]={...arr[i],consumptionKgPerUnit:e.target.value};setStForm({...stForm,rmComponents:arr})}}
                            placeholder='Kg per unit' style={{padding:'6px 8px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12}} />
                          <button onClick={()=>setStForm({...stForm,rmComponents:stForm.rmComponents.filter((_,idx)=>idx!==i)})}
                            style={{padding:'6px 10px',background:'#fdecea',color:'#C0392B',border:'none',borderRadius:5,cursor:'pointer',fontSize:11}}>✕</button>
                        </div>
                      ))}
                      <button onClick={()=>setStForm({...stForm,rmComponents:[...stForm.rmComponents,{componentName:'',ratePerKg:'',consumptionKgPerUnit:''}]})}
                        style={{padding:'5px 10px',background:'#F0EBF0',color:'#714B67',border:'none',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>+ Add Component</button>
                    </div>
                  )}

                  <div style={{fontSize:11,fontWeight:700,color:'#714B67',margin:'10px 0 6px'}}>8 Fixed Rates — Kg basis (Casting, Aluminium)</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:10}}>
                    {['labourCostPerKg','energyCostPerKg','electricityCostPerKg','maintenanceCostPerKg','packingCostPerKg','consumablesCostPerKg','adminCostPerKg','employeeCostPerKg'].map(f=>(
                      <input key={f} type='number' value={stForm[f]} onChange={e=>setStForm({...stForm,[f]:e.target.value})}
                        placeholder={f.replace('CostPerKg','').replace(/([A-Z])/g,' $1').trim()}
                        style={{padding:'6px 8px',border:'1.5px solid #DDD',borderRadius:5,fontSize:11}} />
                    ))}
                  </div>
                  <div style={{fontSize:11,fontWeight:700,color:'#714B67',margin:'10px 0 6px'}}>Same 8, Sq.Ft basis (Sheet Metal)</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:10}}>
                    {['labourCostPerSqft','energyCostPerSqft','electricityCostPerSqft','maintenanceCostPerSqft','packingCostPerSqft','consumablesCostPerSqft','adminCostPerSqft','employeeCostPerSqft'].map(f=>(
                      <input key={f} type='number' value={stForm[f]} onChange={e=>setStForm({...stForm,[f]:e.target.value})}
                        placeholder={f.replace('CostPerSqft','').replace(/([A-Z])/g,' $1').trim()}
                        style={{padding:'6px 8px',border:'1.5px solid #DDD',borderRadius:5,fontSize:11}} />
                    ))}
                  </div>
                  <div style={{marginBottom:10,maxWidth:200}}>
                    <label style={{fontSize:11,color:'#888'}}>Marketing %</label>
                    <input type='number' value={stForm.marketingPct} onChange={e=>setStForm({...stForm,marketingPct:e.target.value})}
                      style={{display:'block',marginTop:4,padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,width:'100%',boxSizing:'border-box',fontSize:12}} />
                  </div>

                  <button onClick={saveStProcess} disabled={savingParams}
                    style={{padding:'7px 14px',background:'#714B67',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
                    {savingParams ? 'Saving...' : '💾 Save Process Rates'}
                  </button>
                </div>
              )}
            </div>

            {stLoading ? (
              <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Calculating...</div>
            ) : !stData ? (
              <div style={{padding:40,textAlign:'center',color:'#aaa'}}>Select a process and enter weight/area to see the cost breakdown</div>
            ) : (
              <>
                <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:16}}>
                  {stData.rmBreakdown.map((r,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}}>
                      <span style={{color:'#666'}}>{r.name}</span>
                      <span style={{fontWeight:700,color:'#1A5276'}}>{fmtC(r.total)}</span>
                    </div>
                  ))}
                  {[['Labour', stData.labourCost],['Energy (LPG/Diesel)', stData.energyCost],['Electricity', stData.electricityCost],
                    ['Repair & Maintenance', stData.maintenanceCost],['Packing', stData.packingCost],['Consumables', stData.consumablesCost],
                    ['Admin', stData.adminCost],['Employee', stData.employeeCost]].map(([label,val])=>(
                    <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}}>
                      <span style={{color:'#666'}}>{label} Cost</span>
                      <span style={{fontWeight:700,color:'#714B67'}}>{fmtC(val)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',marginTop:8,borderTop:'1.5px solid #E0D5E0',fontSize:14}}>
                    <span style={{fontWeight:700}}>Total Cost ({stData.qty} pcs)</span>
                    <span style={{fontWeight:800,color:'#1E8449'}}>{fmtC(stData.totalCost)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:13}}>
                    <span style={{color:'#888'}}>Cost per Piece</span>
                    <span style={{fontWeight:700}}>{fmtC(stData.costPerPiece)}</span>
                  </div>
                </div>

                <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:16,display:'flex',gap:16,alignItems:'flex-end'}}>
                  <div style={{flex:1}}>
                    <label style={{fontSize:11,color:'#888'}}>Margin %{stData.marketingPct!=null && <span style={{color:'#1E8449'}}> (process default: {stData.marketingPct}%)</span>}</label>
                    <input type='number' value={marginPct} onChange={e=>setMarginPct(e.target.value)}
                      placeholder='e.g. 20' style={{display:'block',marginTop:4,padding:'9px 10px',border:'1.5px solid #DDD',borderRadius:5,width:'100%',boxSizing:'border-box',fontSize:14}} />
                  </div>
                  <div style={{flex:1,textAlign:'right'}}>
                    <div style={{fontSize:11,color:'#888'}}>Suggested Selling Price</div>
                    <div style={{fontSize:26,fontWeight:800,color:'#1E8449'}}>{fmtC(stSuggested)}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {pattern !== 'SURFACE' && (loading ? (
          <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Calculating standard cost...</div>
        ) : !costData ? (
          <div style={{padding:40,textAlign:'center',color:'#aaa'}}>Could not load cost estimate for this item</div>
        ) : (
          <>
            {pattern==='ROUTING' && (!costData.hasBom || !costData.hasRouting) && (
              <div style={{fontSize:11,color:'#B8860B',background:'#FEF9E7',padding:'8px 12px',borderRadius:6,marginBottom:14}}>
                ⚠️ {!costData.hasBom && !costData.hasRouting ? 'No BOM or Routing found for this item' : !costData.hasBom ? 'No BOM found' : 'No Routing found'} — cost below only reflects what's available.
              </div>
            )}
            {(pattern==='CYCLE' || pattern==='BATCH') && !costData.hasCostingParams && (
              <div style={{fontSize:11,color:'#B8860B',background:'#FEF9E7',padding:'8px 12px',borderRadius:6,marginBottom:14}}>
                ⚠️ No {pattern==='CYCLE'?'moulding':'batch'} parameters saved yet — fill in the fields above and click Save to see a real cost estimate.
              </div>
            )}

            {costData.productionQtyPerHr != null && (
              <div style={{fontSize:12,color:'#1A5276',background:'#EBF5FB',padding:'8px 12px',borderRadius:6,marginBottom:12}}>
                📊 Real production rate at {efficiency}% efficiency: <b>{costData.productionQtyPerHr} units/hr</b>
              </div>
            )}

            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:16}}>
              {[
                ['Material Cost', costData.materialCost, '#1A5276'],
                ['Labour Cost', costData.labourCost, '#B8860B'],
                ['Electricity/Power Cost', costData.electricityCost, '#D68910'],
                ['Consumables/Ancillary Cost', costData.consumablesCost, '#8E44AD'],
                ['Overhead Cost', costData.overheadCost, '#714B67'],
              ].map(([label,val,color])=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}}>
                  <span style={{color:'#666'}}>{label}</span>
                  <span style={{fontWeight:700,color}}>{fmtC(val)}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',marginTop:8,borderTop:'1.5px solid #E0D5E0',fontSize:14}}>
                <span style={{fontWeight:700}}>Total Cost ({pricingQty} qty)</span>
                <span style={{fontWeight:800,color:'#1E8449'}}>{fmtC(costData.totalCost)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:13}}>
                <span style={{color:'#888'}}>Cost per Piece</span>
                <span style={{fontWeight:700}}>{fmtC(costData.costPerPiece)}</span>
              </div>
            </div>

            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:16,display:'flex',gap:16,alignItems:'flex-end'}}>
              <div style={{flex:1}}>
                <label style={{fontSize:11,color:'#888'}}>
                  Margin % {costData.defaultMarginPct!=null && <span style={{color:'#1E8449'}}>(category default: {costData.defaultMarginPct}%)</span>}
                </label>
                <input type='number' value={marginPct} onChange={e=>setMarginPct(e.target.value)}
                  placeholder='e.g. 35' style={{display:'block',marginTop:4,padding:'9px 10px',border:'1.5px solid #DDD',borderRadius:5,width:'100%',boxSizing:'border-box',fontSize:14}} />
              </div>
              <div style={{flex:1,textAlign:'right'}}>
                <div style={{fontSize:11,color:'#888'}}>Suggested Selling Price (MRP)</div>
                <div style={{fontSize:26,fontWeight:800,color:'#1E8449'}}>{fmtC(suggested)}</div>
              </div>
            </div>

            <button onClick={applyPricing} disabled={saving}
              style={{width:'100%',padding:'12px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,cursor:saving?'default':'pointer',fontWeight:700,fontSize:14}}>
              {saving ? 'Saving...' : `Save — Std Cost ${fmtC(costData.costPerPiece)} · MRP ${fmtC(suggested)}`}
            </button>
          </>
        ))}
      </div>
    </div>
  )
}
