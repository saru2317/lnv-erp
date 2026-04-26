import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const INIT = {
  itemCode:'', itemName:'', bomNo:'', routingNo:'',
  plannedQty:'', uom:'Nos',
  scheduledStart:'', scheduledEnd:'',
  priority:'Normal', rmMethod:'push',
  mouldId:'', cavityCount:'', batchSize:'',
  remarks:'',
}

export default function WONew() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const planId   = params.get('planId')
  const soNo     = params.get('soNo')

  const [form,        setForm]        = useState(INIT)
  const [woNo,        setWoNo]        = useState('Auto-generated')
  const [config,      setConfig]      = useState(null)
  const [items,       setItems]       = useState([])
  const [boms,        setBoms]        = useState([])
  const [routings,    setRoutings]    = useState([])
  const [bomComps,    setBomComps]    = useState([])   // BOM components
  const [operations,  setOperations]  = useState([])   // Routing operations
  const [saving,      setSaving]      = useState(false)
  const [loading,     setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rN, rC, rI, rB, rR] = await Promise.all([
        fetch(`${BASE_URL}/pp/wo/next-no`,     { headers: hdr2() }),
        fetch(`${BASE_URL}/pp/config`,         { headers: hdr2() }),
        fetch(`${BASE_URL}/mdm/item`,          { headers: hdr2() }),
        fetch(`${BASE_URL}/mdm/bom`,           { headers: hdr2() }),
        fetch(`${BASE_URL}/mdm/routing`,       { headers: hdr2() }),
      ])
      const [dN, dC, dI, dB, dR] = await Promise.all([rN.json(), rC.json(), rI.json(), rB.json(), rR.json()])
      setWoNo(dN.woNo || `WO-${new Date().getFullYear()}-0001`)
      setConfig(dC.data)
      setItems(dI.data  || [])
      setBoms(dB.data   || [])
      setRoutings(dR.data || [])

      // Pre-fill from plan
      if (planId) {
        const rP = await fetch(`${BASE_URL}/pp/plan/${planId}`, { headers: hdr2() })
        const dP = await rP.json()
        if (dP.data) setForm(f => ({ ...f, itemCode: dP.data.itemCode, itemName: dP.data.itemName, plannedQty: dP.data.plannedQty, uom: dP.data.uom }))
      }

      // Pre-fill rm method from config
      if (dC.data) setForm(f => ({ ...f, rmMethod: dC.data.rmMethod || 'push' }))

    } catch (e) { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [planId])
  useEffect(() => { load() }, [load])

  const fSet = k => e => setForm(f => ({ ...f, [k]: typeof e === 'object' ? e.target.value : e }))

  // When item changes — load its BOM + routing
  const onItemChange = async (code) => {
    setForm(f => ({ ...f, itemCode: code }))
    const item = items.find(i => i.code === code)
    if (item) setForm(f => ({ ...f, itemName: item.name, uom: item.uom || f.uom }))

    // Find matching BOM
    const bom = boms.find(b => b.itemCode === code)
    if (bom) {
      setForm(f => ({ ...f, bomNo: bom.bomNo }))
      const lines = Array.isArray(bom.lines) ? bom.lines : []
      setBomComps(lines.map(l => ({
        itemCode: l.itemCode, itemName: l.itemName || l.componentName,
        reqQty: parseFloat(l.quantity || l.qty || 0),
        uom: l.uom, stdCost: parseFloat(l.stdCost || 0),
        status: 'OK'
      })))
    }

    // Find matching Routing
    const routing = routings.find(r => r.itemCode === code)
    if (routing) {
      setForm(f => ({ ...f, routingNo: routing.routingNo }))
      const ops = Array.isArray(routing.operations) ? routing.operations : []
      setOperations(ops.map((op, i) => ({
        opNo:      (i+1) * 10,
        opName:    op.operationName || op.opName,
        workCenter:op.workCenter || '',
        machine:   op.machine || '',
        setupTime: op.setupTime || 0,
        runTime:   op.runTime || 0,
        fieldDefs: config?.processes?.find(p => p.name === (op.operationName || op.opName))?.fields || [],
      })))
    } else if (config?.processes?.length) {
      // Use PP Config processes as default operations
      setOperations(config.processes.map((p, i) => ({
        opNo:      (i+1) * 10,
        opName:    p.name,
        workCenter:p.machine || '',
        machine:   p.machine || '',
        fieldDefs: p.fields || [],
      })))
    }
  }

  const save = async (status = 'DRAFT') => {
    if (!form.itemName) return toast.error('Item is required')
    if (!form.plannedQty) return toast.error('Planned quantity is required')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/pp/wo`, {
        method: 'POST', headers: hdr(),
        body: JSON.stringify({
          ...form, woNo, status,
          planId: planId ? parseInt(planId) : null,
          soNo: soNo || null,
          plannedQty:  parseFloat(form.plannedQty),
          cavityCount: form.cavityCount ? parseInt(form.cavityCount) : null,
          batchSize:   form.batchSize   ? parseFloat(form.batchSize) : null,
          operations,
          bomComponents: status !== 'DRAFT' ? bomComps : [],  // only push if releasing
          scheduledStart: form.scheduledStart || null,
          scheduledEnd:   form.scheduledEnd   || null,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(status === 'DRAFT' ? `${data.data?.woNo} saved as draft` : `${data.data?.woNo} created & released!`)
      nav('/pp/wo')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const isMould = config?.prodType === 'mould'
  const isBatch = config?.prodType === 'batch'

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div>

  const SHdr = ({title}) => (
    <div style={{background:'linear-gradient(135deg,#714B67,#4A3050)',padding:'8px 16px',borderRadius:'6px 6px 0 0'}}>
      <span style={{color:'#fff',fontSize:13,fontWeight:700,fontFamily:'Syne,sans-serif'}}>{title}</span>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          New Work Order <small>CO01</small>
          {config && <small style={{background:'#EDE0EA',color:'#714B67',padding:'2px 8px',borderRadius:4,fontFamily:'DM Mono,monospace',marginLeft:8}}>{config.industryName}</small>}
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/wo')}>Cancel</button>
          <button className="btn btn-s sd-bsm" disabled={saving} onClick={()=>save('DRAFT')}>Save Draft</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={()=>save('RELEASED')}>
            {saving ? 'Creating...' : 'Create & Release'}
          </button>
        </div>
      </div>

      {/* WO Header */}
      <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
        <SHdr title="Work Order Header" />
        <div style={{padding:16,background:'#fff'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>WO Number</label>
              <input style={{...inp,background:'#F8F4F8',color:'#714B67',fontWeight:700,fontFamily:'DM Mono,monospace'}} value={woNo} readOnly/>
            </div>
            <div>
              <label style={lbl}>Priority</label>
              <select style={{...inp,cursor:'pointer'}} value={form.priority} onChange={fSet('priority')}>
                {['Critical','High','Normal','Low'].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Scheduled Start</label>
              <input type="date" style={inp} value={form.scheduledStart} onChange={fSet('scheduledStart')}/>
            </div>
            <div>
              <label style={lbl}>Scheduled End</label>
              <input type="date" style={inp} value={form.scheduledEnd} onChange={fSet('scheduledEnd')}/>
            </div>
          </div>

          {/* SO reference if from sales */}
          {soNo && (
            <div style={{background:'#D1ECF1',border:'1px solid #B8DAFF',borderRadius:6,padding:'8px 12px',marginBottom:12,fontSize:12,color:'#0C5460'}}>
              Generated from Sales Order: <strong>{soNo}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Item + BOM + Routing */}
      <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
        <SHdr title="Item / Product" />
        <div style={{padding:16,background:'#fff'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Item / Product *</label>
              <select style={{...inp,cursor:'pointer'}} value={form.itemCode} onChange={e=>onItemChange(e.target.value)}>
                <option value="">-- Select Item --</option>
                {items.filter(i=>i.type==='FG'||i.type==='Semi-FG'||!i.type).map(i=>(
                  <option key={i.id} value={i.code}>{i.code} · {i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Planned Qty *</label>
              <input type="number" style={inp} value={form.plannedQty} onChange={fSet('plannedQty')} placeholder="500"/>
            </div>
            <div>
              <label style={lbl}>UOM</label>
              <input style={inp} value={form.uom} onChange={fSet('uom')} placeholder="Nos"/>
            </div>
            <div>
              <label style={lbl}>RM Method</label>
              <select style={{...inp,cursor:'pointer'}} value={form.rmMethod} onChange={fSet('rmMethod')}>
                <option value="push">Push — Issue on Release</option>
                <option value="pull">Pull — Backflush on Complete</option>
                <option value="manual">Manual — Operator Issues</option>
              </select>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>BOM</label>
              <input style={{...inp,background:'#F8F9FA'}} value={form.bomNo || (bomComps.length?'Auto-detected':'No BOM found')} readOnly/>
            </div>
            <div>
              <label style={lbl}>Routing</label>
              <input style={{...inp,background:'#F8F9FA'}} value={form.routingNo || (operations.length?'From PP Config':'No Routing')} readOnly/>
            </div>
          </div>

          {/* Industry-specific */}
          {isMould && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,padding:'12px',background:'#EDE0EA',borderRadius:6}}>
              <div>
                <label style={lbl}>Mould ID</label>
                <input style={inp} value={form.mouldId} onChange={fSet('mouldId')} placeholder="M-001"/>
              </div>
              <div>
                <label style={lbl}>Cavity Count</label>
                <input type="number" style={inp} value={form.cavityCount} onChange={fSet('cavityCount')} placeholder="4"/>
              </div>
              <div>
                <label style={lbl}>Shots Required</label>
                <input style={{...inp,background:'#F8F9FA',color:'#714B67',fontWeight:700}} readOnly
                  value={form.cavityCount && form.plannedQty ? `${Math.ceil(parseFloat(form.plannedQty)/parseInt(form.cavityCount))} shots` : '—'}/>
              </div>
            </div>
          )}
          {isBatch && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:'12px',background:'#EDE0EA',borderRadius:6}}>
              <div>
                <label style={lbl}>Batch Size (Max per tank/furnace)</label>
                <input type="number" style={inp} value={form.batchSize} onChange={fSet('batchSize')} placeholder="500"/>
              </div>
              <div>
                <label style={lbl}>Batches Required</label>
                <input style={{...inp,background:'#F8F9FA',color:'#714B67',fontWeight:700}} readOnly
                  value={form.batchSize && form.plannedQty ? `${Math.ceil(parseFloat(form.plannedQty)/parseFloat(form.batchSize))} batches` : '—'}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOM Components */}
      {bomComps.length > 0 && (
        <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
          <SHdr title={`BOM Components — ${bomComps.length} materials (${form.rmMethod === 'push' ? 'Will be reserved on release' : form.rmMethod === 'pull' ? 'Will be backflushed on completion' : 'Operator will issue manually'})`}/>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#F8F4F8'}}>
              <th style={{padding:'7px 12px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left'}}>Component</th>
              <th style={{padding:'7px 12px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'right'}}>Req Qty</th>
              <th style={{padding:'7px 12px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left'}}>UOM</th>
              <th style={{padding:'7px 12px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'center'}}>Stock Status</th>
            </tr></thead>
            <tbody>
              {bomComps.map((c, i) => (
                <tr key={i} style={{borderBottom:'1px solid #F0EEF0',background:c.status==='short'?'#FFF5F5':'#fff'}}>
                  <td style={{padding:'8px 12px'}}>
                    <div style={{fontWeight:600,fontSize:12}}>{c.itemName}</div>
                    <div style={{fontSize:10,color:'#714B67',fontFamily:'DM Mono,monospace'}}>{c.itemCode}</div>
                  </td>
                  <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:12}}>{c.reqQty}</td>
                  <td style={{padding:'8px 12px',fontSize:12,color:'#6C757D'}}>{c.uom}</td>
                  <td style={{padding:'8px 12px',textAlign:'center'}}>
                    <span style={{background:c.status==='short'?'#F8D7DA':'#D4EDDA',color:c.status==='short'?'#721C24':'#155724',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                      {c.status === 'short' ? 'SHORTAGE' : 'Available'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Operations from Routing / Config */}
      {operations.length > 0 && (
        <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
          <SHdr title={`Production Operations — ${operations.length} stages from ${form.routingNo ? 'Routing' : 'PP Config'}`}/>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#F8F4F8'}}>
              <th style={{padding:'7px 12px',fontSize:10,fontWeight:700,color:'#6C757D'}}>Op#</th>
              <th style={{padding:'7px 12px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left'}}>Operation</th>
              <th style={{padding:'7px 12px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left'}}>Work Center</th>
              <th style={{padding:'7px 12px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'center'}}>Fields</th>
            </tr></thead>
            <tbody>
              {operations.map((op, i) => (
                <tr key={i} style={{borderBottom:'1px solid #F0EEF0'}}>
                  <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',fontWeight:800,color:'#714B67',fontSize:13}}>{op.opNo}</td>
                  <td style={{padding:'8px 12px',fontWeight:600,fontSize:12}}>{op.opName}</td>
                  <td style={{padding:'8px 12px',fontSize:12,color:'#6C757D'}}>{op.workCenter || '—'}</td>
                  <td style={{padding:'8px 12px',textAlign:'center',fontSize:11,color:'#6C757D'}}>{op.fieldDefs?.length || 0} fields</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Remarks */}
      <div style={{border:'1px solid #E0D5E0',borderRadius:8,padding:16,background:'#fff',marginBottom:14}}>
        <label style={lbl}>Remarks / Special Instructions</label>
        <textarea style={{...inp,resize:'vertical'}} rows={2} value={form.remarks} onChange={fSet('remarks')} placeholder="Any special instructions for production floor..."/>
      </div>

      {/* Footer */}
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,padding:'8px 0 20px'}}>
        <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/wo')}>Cancel</button>
        <button className="btn btn-s sd-bsm" disabled={saving} onClick={()=>save('DRAFT')}>Save Draft</button>
        <button className="btn btn-p sd-bsm" disabled={saving} onClick={()=>save('RELEASED')}>
          {saving?'Creating...':'Create & Release WO'}
        </button>
      </div>
    </div>
  )
}
