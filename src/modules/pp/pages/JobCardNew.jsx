import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const EMPTY_FORM = {
  customerId:'', customerName:'', dcNo:'', loId:'', loNo:'', bomId:'', bomNo:'',
  itemCode:'', itemName:'', receivedQty:'', uom:'Nos',
  priority:'Normal', dueDate:'', remarks:'',
}

export default function JobCardNew() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [customers, setCustomers] = useState([])
  const [processes, setProcesses] = useState([])
  const [boms, setBoms] = useState([])
  const [linkedLO, setLinkedLO] = useState(null)
  const [loLines, setLoLines] = useState(null)
  const [selectedStages, setSelectedStages] = useState([])
  const [customStage, setCustomStage] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    fetch(`${BASE_URL}/sd/customers`, { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setCustomers(d.data||[])).catch(()=>{})
    // Real Process Master, synced from the active PP Configurator config —
    // same source routing operations use, so stage names line up with
    // whatever the shop actually calls each process.
    fetch(`${BASE_URL}/pp/config`, { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setProcesses(d.data?.processes||[])).catch(()=>{})
    // Job-work / hybrid BOMs only — a plain manufacturing BOM has
    // nothing to do with a Job Card, since it assumes our own material.
    fetch(`${BASE_URL}/pp/bom`, { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setBoms((d.data||[]).filter(b=>b.bizType==='jobwork'||b.bizType==='hybrid')))
      .catch(()=>{})

    const loId = params.get('loId')
    if (loId) {
      fetch(`${BASE_URL}/sd/labour-orders/${loId}`, { headers:authHdrs2() })
        .then(r=>r.json()).then(d=>{
          if (!d.data) return
          const lo = d.data
          setLinkedLO(lo)
          const lns = lo.lines?.length ? lo.lines : [{ // legacy single-item order, no lines[] — treat header as one line
            itemCode: lo.itemCode, itemName: lo.itemName, orderedQty: lo.orderedQty, uom: lo.uom,
            processName: lo.processName, materialSupply: lo.materialSupply,
            rateWithMat: lo.rateWithMat, rateWithoutMat: lo.rateWithoutMat, pricingBasis: lo.pricingBasis,
          }]
          setLoLines(lns)
          setForm(f=>({ ...f,
            loId: String(lo.id), loNo: lo.loNo,
            customerId: lo.customerId?String(lo.customerId):'', customerName: lo.customerName,
            dueDate: lo.expectedDeliveryDate ? lo.expectedDeliveryDate.slice(0,10) : '',
          }))
          if (lns.length === 1) applyLOLine(lns[0])
        }).catch(()=>{})
    }
  },[]) // eslint-disable-line

  const applyLOLine = line => {
    setForm(f=>({ ...f,
      itemCode: line.itemCode||'', itemName: line.itemName,
      receivedQty: String(line.orderedQty), uom: line.uom,
    }))
    if (line.processName) setSelectedStages([line.processName])
  }

  const onCustomerChange = e => {
    const id = e.target.value
    const c = customers.find(c=>String(c.id)===id)
    set('customerId', id); set('customerName', c?.name||c?.customerName||'')
  }

  const onBOMChange = e => {
    const id = e.target.value
    const b = boms.find(b=>String(b.id)===id)
    set('bomId', id); set('bomNo', b?.bomNo||'')
  }

  const toggleStage = name => {
    setSelectedStages(prev => prev.includes(name) ? prev.filter(s=>s!==name) : [...prev, name])
  }

  const addCustomStage = () => {
    const name = customStage.trim()
    if (!name) return
    if (!selectedStages.includes(name)) setSelectedStages(prev=>[...prev, name])
    setCustomStage('')
  }

  const removeStage = name => setSelectedStages(prev => prev.filter(s=>s!==name))

  const moveStage = (idx, dir) => {
    setSelectedStages(prev => {
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  const save = async () => {
    if (!form.customerName)  return toast.error('Select customer — this material belongs to them')
    if (!form.itemName)      return toast.error('Item name required')
    if (!form.receivedQty || parseFloat(form.receivedQty)<=0) return toast.error('Enter a valid received quantity')
    if (selectedStages.length===0) return toast.error('Add at least one processing stage')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/pp/job-cards`, {
        method:'POST', headers:authHdrs(),
        body: JSON.stringify({
          customerId: form.customerId||null, customerName: form.customerName, dcNo: form.dcNo||null,
          loId: form.loId||null, loNo: form.loNo||null,
          bomId: form.bomId||null, bomNo: form.bomNo||null,
          itemCode: form.itemCode||null, itemName: form.itemName,
          receivedQty: form.receivedQty, uom: form.uom,
          stages: selectedStages,
          priority: form.priority, dueDate: form.dueDate||null, remarks: form.remarks||null,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      nav('/pp/job-cards')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Job Card <small>Customer material intake — job work</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/job-cards')}>✕ Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving?'⏳ Saving...':'Save Job Card'}
          </button>
        </div>
      </div>

      <div className="pp-alert" style={{marginBottom:14,background:'#D1ECF1',borderColor:'#BEE5EB',color:'#0C5460'}}>
        This just creates the paperwork — it does <strong>not</strong> post any stock yet. Warehouse confirms the physical receipt separately (WM → Job Work Receipt), same way a GRN is separate from Goods Receipt.
      </div>

      {linkedLO && loLines?.length > 1 && !form.itemName && (
        <div className="wm-form-sec" style={{marginBottom:14}}>
          <div className="wm-form-sec-hdr">{linkedLO.loNo} has {loLines.length} lines — pick which one this Job Card is for</div>
          <div className="wm-form-sec-body">
            {loLines.map((line,i)=>(
              <div key={i} onClick={()=>applyLOLine(line)}
                style={{padding:'10px 14px',border:'1px solid #E0D5E0',borderRadius:6,marginBottom:8,cursor:'pointer',
                  background:i%2===0?'#fff':'#FDFBFD'}}>
                <div style={{fontWeight:600,fontSize:13}}>{line.itemCode?`${line.itemCode} — `:''}{line.itemName}</div>
                <div style={{fontSize:11,color:'#6C757D'}}>{Number(line.orderedQty).toFixed(2)} {line.uom} · {line.processName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {linkedLO && form.itemName && (
        <div className="pp-alert" style={{marginBottom:14,background:'#D4EDDA',borderColor:'#C3E6CB',color:'#155724'}}>
          ✓ Linked to <strong>{linkedLO.loNo}</strong> — customer, item, and quantity auto-filled{loLines?.length>1?` (line: ${form.itemName})`:''} from the agreed order.
          {loLines?.length>1 && <button onClick={()=>setForm(f=>({...f,itemCode:'',itemName:'',receivedQty:''}))}
            style={{marginLeft:10,fontSize:11,background:'none',border:'none',color:'#155724',textDecoration:'underline',cursor:'pointer'}}>change line</button>}
        </div>
      )}

      <div className="wm-form-sec" style={{marginBottom:14}}>
        <div className="wm-form-sec-hdr">Customer &amp; Material</div>
        <div className="wm-form-sec-body">
          <div className="wm-form-row2">
            <div className="wm-form-grp"><label>Customer <span>*</span></label>
              <select className="wm-form-ctrl" value={form.customerId} onChange={onCustomerChange} disabled={!!linkedLO}>
                <option value="">-- Select Customer --</option>
                {customers.map(c=>(
                  <option key={c.id} value={c.id}>{c.name||c.customerName}</option>
                ))}
              </select>
            </div>
            <div className="wm-form-grp"><label>Customer's DC No.</label>
              <input className="wm-form-ctrl" placeholder="Their delivery challan ref"
                value={form.dcNo} onChange={e=>set('dcNo',e.target.value)}/>
            </div>
          </div>
          <div className="wm-form-row4">
            <div className="wm-form-grp"><label>Item Code</label>
              <input className="wm-form-ctrl" placeholder="Optional"
                value={form.itemCode} onChange={e=>set('itemCode',e.target.value)}/>
            </div>
            <div className="wm-form-grp"><label>Item Name <span>*</span></label>
              <input className="wm-form-ctrl" placeholder="What are they sending?" readOnly={!!linkedLO && !!form.itemName}
                value={form.itemName} onChange={e=>set('itemName',e.target.value)}/>
            </div>
            <div className="wm-form-grp"><label>Received Qty <span>*</span></label>
              <input type="number" className="wm-form-ctrl" placeholder="Qty" readOnly={!!linkedLO && !!form.itemName}
                value={form.receivedQty} onChange={e=>set('receivedQty',e.target.value)}/>
            </div>
            <div className="wm-form-grp"><label>UOM</label>
              <input className="wm-form-ctrl" value={form.uom} onChange={e=>set('uom',e.target.value)}/>
            </div>
          </div>
        </div>
      </div>

      <div className="wm-form-sec" style={{marginBottom:14}}>
        <div className="wm-form-sec-hdr">Bill of Material (optional)</div>
        <div className="wm-form-sec-body">
          <div className="wm-form-grp">
            <label>Job Work BOM</label>
            <select className="wm-form-ctrl" value={form.bomId} onChange={onBOMChange}>
              <option value="">-- No BOM — just track stages, no material consumption --</option>
              {boms.map(b=>(
                <option key={b.id} value={b.id}>{b.bomNo} — {b.itemName}{b.customerName?` (${b.customerName})`:''}</option>
              ))}
            </select>
            {boms.length===0 && (
              <small style={{color:'#6C757D'}}>No Job Work / Hybrid BOMs exist yet — create one under PP → BOM if this job needs consumption tracked against specific components.</small>
            )}
            {form.bomId && (
              <div className="pp-alert" style={{marginTop:10,background:'#D1ECF1',borderColor:'#BEE5EB',color:'#0C5460'}}>
                Linking a BOM lets Process Execution post material consumption against the customer's (or our own) stock ledger as each stage completes, instead of just tracking output quantity.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="wm-form-sec" style={{marginBottom:14}}>
        <div className="wm-form-sec-hdr">Processing Stages <span>*</span></div>
        <div className="wm-form-sec-body">
          {processes.length>0 && (
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
              {processes.map(p=>(
                <button key={p.id||p.name} type="button"
                  onClick={()=>toggleStage(p.name)}
                  className={selectedStages.includes(p.name)?'btn btn-p sd-bsm':'btn btn-s sd-bsm'}>
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <input className="wm-form-ctrl" placeholder="Or type a custom stage name..."
              value={customStage} onChange={e=>setCustomStage(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addCustomStage() } }}/>
            <button type="button" className="btn btn-s sd-bsm" onClick={addCustomStage}>+ Add</button>
          </div>

          {selectedStages.length>0 && (
            <div>
              <label style={{fontSize:11,color:'#6C757D',fontWeight:700}}>SEQUENCE (order matters)</label>
              {selectedStages.map((s,i)=>(
                <div key={s} style={{display:'flex',alignItems:'center',gap:8,
                  padding:'8px 10px',background:i%2===0?'#fff':'#FDFBFD',
                  border:'1px solid #E0D5E0',borderRadius:6,marginTop:6}}>
                  <span style={{fontWeight:700,color:'#714B67',minWidth:20}}>{i+1}.</span>
                  <span style={{flex:1}}>{s}</span>
                  <button type="button" className="btn btn-s sd-bsm" style={{padding:'2px 8px'}}
                    disabled={i===0} onClick={()=>moveStage(i,-1)}>↑</button>
                  <button type="button" className="btn btn-s sd-bsm" style={{padding:'2px 8px'}}
                    disabled={i===selectedStages.length-1} onClick={()=>moveStage(i,1)}>↓</button>
                  <button type="button" className="btn btn-s sd-bsm" style={{padding:'2px 8px',color:'#DC3545'}}
                    onClick={()=>removeStage(s)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="wm-form-sec">
        <div className="wm-form-sec-hdr">Priority &amp; Notes</div>
        <div className="wm-form-sec-body">
          <div className="wm-form-row4">
            <div className="wm-form-grp"><label>Priority</label>
              <select className="wm-form-ctrl" value={form.priority} onChange={e=>set('priority',e.target.value)}>
                <option>Normal</option><option>High</option><option>Urgent</option>
              </select>
            </div>
            <div className="wm-form-grp"><label>Due Date</label>
              <input type="date" className="wm-form-ctrl" value={form.dueDate} onChange={e=>set('dueDate',e.target.value)}/>
            </div>
            <div className="wm-form-grp" style={{gridColumn:'span 2'}}><label>Remarks</label>
              <input className="wm-form-ctrl" placeholder="Optional notes..."
                value={form.remarks} onChange={e=>set('remarks',e.target.value)}/>
            </div>
          </div>
        </div>
      </div>

      <div className="wm-form-acts">
        <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/job-cards')}>✕ Cancel</button>
        <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
          {saving?'⏳ Saving...':'Save Job Card'}
        </button>
      </div>
    </div>
  )
}
