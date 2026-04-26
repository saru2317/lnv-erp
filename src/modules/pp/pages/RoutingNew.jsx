import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const TIME_UNITS = ['MIN','HR','SEC']

export default function RoutingNew() {
  const nav     = useNavigate()
  const { id }  = useParams()

  const [routingNo, setRoutingNo] = useState('Auto-generated')
  const [header,    setHeader]    = useState({ itemCode:'', itemName:'', plant:'MAIN', baseQty:'1', uom:'Nos', isActive:true })
  const [ops,       setOps]       = useState([])
  const [items,     setItems]     = useState([])
  const [processes, setProcesses] = useState([])  // from PP Config
  const [ppConfig,  setPPConfig]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rN, rI, rC] = await Promise.all([
        fetch(`${BASE_URL}/mdm/routing/next-no`, { headers: hdr2() }),
        fetch(`${BASE_URL}/mdm/item`,            { headers: hdr2() }),
        fetch(`${BASE_URL}/pp/config`,           { headers: hdr2() }),
      ])
      const [dN, dI, dC] = await Promise.all([rN.json(), rI.json(), rC.json()])
      setRoutingNo(dN.routingNo || dN.nextNo || 'RTE-AUTO')
      setItems(dI.data || [])

      if (dC.data) {
        setPPConfig(dC.data)
        const procs = Array.isArray(dC.data.processes) ? dC.data.processes : JSON.parse(dC.data.processes || '[]')
        setProcesses(procs)
        // Auto-load ops from PP Config if new routing
        if (!id) {
          setOps(procs.map((p, i) => ({
            opNo:        String((i+1)*10),
            processName: p.name,
            wcId:        p.machine || '',
            setupTime:   '0',
            machineTime: '0',
            laborTime:   '0',
            unit:        'MIN',
            remarks:     '',
          })))
        }
      }

      // If editing — load existing routing
      if (id) {
        const rE  = await fetch(`${BASE_URL}/mdm/routing/${id}`, { headers: hdr2() })
        const dE  = await rE.json()
        if (dE.data) {
          const r = dE.data
          setRoutingNo(r.routingNo)
          setHeader({ itemCode:r.itemCode||'', itemName:r.itemName||'', plant:r.plant||'MAIN', baseQty:r.baseQty||'1', uom:r.uom||'Nos', isActive:r.isActive!==false })
          setOps((r.operations||[]).map(o => ({
            opNo:        o.opNo,
            processName: o.processName || o.processCode || '',
            wcId:        o.wcId || '',
            setupTime:   String(o.setupTime||0),
            machineTime: String(o.machineTime||0),
            laborTime:   String(o.laborTime||0),
            unit:        o.unit || 'MIN',
            remarks:     o.remarks || '',
          })))
        }
      }
    } catch (e) { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { load() }, [load])

  const hSet = k => e => setHeader(h => ({ ...h, [k]: typeof e === 'object' ? e.target.value : e }))

  const onItemSelect = e => {
    const item = items.find(i => i.code === e.target.value)
    setHeader(h => ({ ...h, itemCode: e.target.value, itemName: item?.name || h.itemName, uom: item?.uom || h.uom }))
  }

  const addOp = () => {
    const lastSeq = ops.length > 0 ? parseInt(ops[ops.length-1].opNo) : 0
    setOps(o => [...o, { opNo:String(lastSeq+10), processName:'', wcId:'', setupTime:'0', machineTime:'0', laborTime:'0', unit:'MIN', remarks:'' }])
  }

  const delOp  = i => setOps(o => o.filter((_,j)=>j!==i))
  const updOp  = (i,k,v) => setOps(o => o.map((x,j) => j!==i ? x : {...x,[k]:v}))

  // Load all ops from PP Config
  const loadFromConfig = () => {
    if (!processes.length) return toast.error('No PP Config found. Set up PP Configurator first.')
    setOps(processes.map((p,i) => ({
      opNo:        String((i+1)*10),
      processName: p.name,
      wcId:        p.machine || '',
      setupTime:   '0',
      machineTime: '0',
      laborTime:   '0',
      unit:        'MIN',
      remarks:     '',
    })))
    toast.success(`${processes.length} operations loaded from PP Config (${ppConfig?.industryName})`)
  }

  const save = async () => {
    if (!header.itemName) return toast.error('Item / Product is required')
    if (!ops.length)      return toast.error('Add at least one operation')
    const emptyOp = ops.find(o => !o.processName)
    if (emptyOp) return toast.error(`Operation ${emptyOp.opNo} — Process name is required`)

    setSaving(true)
    try {
      const payload = {
        routingNo,
        itemCode:  header.itemCode,
        itemName:  header.itemName,
        plant:     header.plant,
        baseQty:   parseFloat(header.baseQty),
        uom:       header.uom,
        isActive:  header.isActive,
        operations: ops.map(o => ({
          opNo:        o.opNo,
          processName: o.processName,
          wcId:        o.wcId,
          setupTime:   parseFloat(o.setupTime||0),
          machineTime: parseFloat(o.machineTime||0),
          laborTime:   parseFloat(o.laborTime||0),
          unit:        o.unit,
          remarks:     o.remarks,
        }))
      }
      const url    = id ? `${BASE_URL}/mdm/routing/${id}` : `${BASE_URL}/mdm/routing`
      const method = id ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: hdr(), body: JSON.stringify(payload) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(id ? 'Routing updated' : `${data.data?.routingNo || routingNo} created!`)
      nav('/pp/routing')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // Total std time
  const totalMins = ops.reduce((a,o) => a + parseFloat(o.setupTime||0) + parseFloat(o.machineTime||0), 0)

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div>

  const SHdr = ({title,sub}) => (
    <div style={{background:'linear-gradient(135deg,#714B67,#4A3050)',padding:'8px 14px',borderRadius:'6px 6px 0 0'}}>
      <div style={{color:'#fff',fontSize:13,fontWeight:700,fontFamily:'Syne,sans-serif'}}>{title}</div>
      {sub && <div style={{color:'rgba(255,255,255,.6)',fontSize:11,marginTop:1}}>{sub}</div>}
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          {id ? 'Edit Routing' : 'Create Routing'}
          <small> CA01 · Production Routing</small>
          <small style={{fontFamily:'DM Mono,monospace',color:'#714B67',marginLeft:8}}>{routingNo}</small>
        </div>
        <div className="fi-lv-actions">
          {processes.length > 0 && !id && (
            <button className="btn btn-s sd-bsm" onClick={loadFromConfig}>
              Load from PP Config ({ppConfig?.industryName})
            </button>
          )}
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/routing')}>Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving ? 'Saving...' : id ? 'Update Routing' : 'Save Routing'}
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
        <SHdr title="Routing Header" sub="Links this routing to an item/product"/>
        <div style={{padding:16,background:'#fff'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12}}>
            <div>
              <label style={lbl}>Item / Product *</label>
              <select style={{...inp,cursor:'pointer'}} value={header.itemCode} onChange={onItemSelect}>
                <option value="">-- Select Item --</option>
                {items.map(i=>(
                  <option key={i.id} value={i.code}>{i.code} · {i.name}</option>
                ))}
              </select>
              {!items.length && (
                <input style={{...inp,marginTop:6}} value={header.itemName} onChange={hSet('itemName')} placeholder="Type item name manually..."/>
              )}
            </div>
            <div>
              <label style={lbl}>Base Qty</label>
              <input type="number" style={inp} value={header.baseQty} onChange={hSet('baseQty')} placeholder="1"/>
            </div>
            <div>
              <label style={lbl}>UOM</label>
              <select style={{...inp,cursor:'pointer'}} value={header.uom} onChange={hSet('uom')}>
                {['Nos','Kg','Metre','Litre','Set','Box'].map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Plant</label>
              <input style={inp} value={header.plant} onChange={hSet('plant')} placeholder="MAIN"/>
            </div>
          </div>
          <label style={{display:'flex',alignItems:'center',gap:8,marginTop:12,cursor:'pointer',fontSize:13}}>
            <input type="checkbox" checked={!!header.isActive} onChange={e=>setHeader(h=>({...h,isActive:e.target.checked}))} style={{accentColor:'#714B67',width:15,height:15}}/>
            Active Routing
          </label>
        </div>
      </div>

      {/* Operations */}
      <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
        <div style={{background:'linear-gradient(135deg,#714B67,#4A3050)',padding:'8px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',borderRadius:'6px 6px 0 0'}}>
          <div>
            <span style={{color:'#fff',fontSize:13,fontWeight:700,fontFamily:'Syne,sans-serif'}}>Operations / Stages</span>
            <span style={{color:'rgba(255,255,255,.6)',fontSize:11,marginLeft:10}}>
              {ops.length} operations · Std time: {totalMins >= 60 ? `${(totalMins/60).toFixed(1)} hrs` : `${totalMins} min`}
            </span>
          </div>
          <button onClick={addOp} style={{padding:'4px 14px',background:'rgba(255,255,255,.2)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',borderRadius:4,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            + Add Op
          </button>
        </div>

        {ops.length === 0 ? (
          <div style={{padding:40,textAlign:'center',color:'#999',background:'#fff',fontSize:13}}>
            No operations yet.
            {processes.length > 0
              ? <span> Click <strong>"Load from PP Config"</strong> above to import {processes.length} stages automatically.</span>
              : <span> Click <strong>"+ Add Op"</strong> to add operations manually.</span>
            }
          </div>
        ) : (
          <div style={{background:'#fff'}}>
            {/* Table header */}
            <div style={{display:'grid',gridTemplateColumns:'70px 1fr 1fr 90px 90px 90px 80px 1fr 40px',gap:8,padding:'8px 14px',background:'#F8F4F8',borderBottom:'2px solid #E0D5E0',fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase'}}>
              <span>Op#</span><span>Process / Operation</span><span>Work Center</span>
              <span style={{textAlign:'center'}}>Setup<br/>(min)</span>
              <span style={{textAlign:'center'}}>Machine<br/>(min)</span>
              <span style={{textAlign:'center'}}>Labour<br/>(min)</span>
              <span style={{textAlign:'center'}}>Unit</span>
              <span>Remarks</span>
              <span/>
            </div>

            {ops.map((op, i) => (
              <div key={i} style={{display:'grid',gridTemplateColumns:'70px 1fr 1fr 90px 90px 90px 80px 1fr 40px',gap:8,padding:'8px 14px',borderBottom:'1px solid #F0EEF0',alignItems:'center'}}>
                {/* Op No */}
                <input style={{...inp,fontFamily:'DM Mono,monospace',fontWeight:800,color:'#714B67',textAlign:'center'}}
                  value={op.opNo} onChange={e=>updOp(i,'opNo',e.target.value)}/>

                {/* Process name — dropdown from PP config or manual */}
                {processes.length > 0 ? (
                  <select style={{...inp,cursor:'pointer'}} value={op.processName} onChange={e=>{
                    const p = processes.find(x=>x.name===e.target.value)
                    updOp(i,'processName',e.target.value)
                    if(p) updOp(i,'wcId',p.machine||op.wcId)
                  }}>
                    <option value="">-- Select Process --</option>
                    {processes.map(p=><option key={p.id||p.name} value={p.name}>{p.name}</option>)}
                    <option value="__custom">Custom...</option>
                  </select>
                ) : (
                  <input style={inp} value={op.processName} onChange={e=>updOp(i,'processName',e.target.value)} placeholder="e.g. Phosphating"/>
                )}

                {/* Work Center */}
                <input style={inp} value={op.wcId} onChange={e=>updOp(i,'wcId',e.target.value)} placeholder="e.g. TANK-01"/>

                {/* Times */}
                {['setupTime','machineTime','laborTime'].map(k=>(
                  <input key={k} type="number" step="0.5" min="0"
                    style={{...inp,textAlign:'center',fontFamily:'DM Mono,monospace'}}
                    value={op[k]} onChange={e=>updOp(i,k,e.target.value)}/>
                ))}

                {/* Unit */}
                <select style={{...inp,cursor:'pointer'}} value={op.unit} onChange={e=>updOp(i,'unit',e.target.value)}>
                  {TIME_UNITS.map(u=><option key={u}>{u}</option>)}
                </select>

                {/* Remarks */}
                <input style={{...inp,fontSize:11}} value={op.remarks} onChange={e=>updOp(i,'remarks',e.target.value)} placeholder="Notes..."/>

                {/* Delete */}
                <button onClick={()=>delOp(i)} style={{background:'none',border:'none',color:'#DC3545',cursor:'pointer',fontSize:16,padding:'0 4px'}}>✕</button>
              </div>
            ))}

            {/* Total row */}
            <div style={{display:'grid',gridTemplateColumns:'70px 1fr 1fr 90px 90px 90px 80px 1fr 40px',gap:8,padding:'8px 14px',background:'#F8F4F8',fontSize:11,fontWeight:700,color:'#714B67'}}>
              <span/>
              <span>{ops.length} ops total</span>
              <span/>
              <span style={{textAlign:'center'}}>{ops.reduce((a,o)=>a+parseFloat(o.setupTime||0),0)} min</span>
              <span style={{textAlign:'center'}}>{ops.reduce((a,o)=>a+parseFloat(o.machineTime||0),0)} min</span>
              <span style={{textAlign:'center'}}>{ops.reduce((a,o)=>a+parseFloat(o.laborTime||0),0)} min</span>
              <span/>
              <span style={{color:'#6C757D'}}>Total: {totalMins} min ({(totalMins/60).toFixed(1)} hrs)</span>
              <span/>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,padding:'8px 0 20px'}}>
        <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/routing')}>Cancel</button>
        <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
          {saving ? 'Saving...' : id ? 'Update Routing' : 'Save Routing'}
        </button>
      </div>
    </div>
  )
}
