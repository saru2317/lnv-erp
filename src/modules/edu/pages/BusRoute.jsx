import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const inp  = { padding:'7px 9px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const sel  = { ...inp }
const th   = { padding:'8px 10px', fontSize:11, color:'#6E2C00', textAlign:'left', borderBottom:'2px solid #E8E0E8' }
const td   = { padding:'7px 10px', fontSize:12, borderBottom:'1px solid #F0F0F0' }
const btnPrimary   = { padding:'7px 16px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:12 }
const btnSecondary = { padding:'6px 12px', background:'#fff', color:'#6E2C00', border:'1.5px solid #6E2C00', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:11 }
const btnDanger    = { padding:'4px 9px', background:'#fdecea', color:'#C0392B', border:'none', borderRadius:4, cursor:'pointer', fontSize:11 }

const emptyRouteForm = { routeNo:'', routeName:'', vehicleId:'', morningStart:'', afternoonStart:'', totalKm:'' }
const emptyStopForm  = { stopName:'', stopOrder:1, pickupTime:'', dropTime:'', feeAmount:'' }

export default function BusRoute() {
  const [instId,    setInstId]    = useState(localStorage.getItem('lnv_edu_inst') || '')
  const [routes,    setRoutes]    = useState([])
  const [vehicles,  setVehicles]  = useState([])
  const [showForm,  setShowForm]  = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form,      setForm]      = useState(emptyRouteForm)
  const [stopsFor,  setStopsFor]  = useState(null) // route object, when Manage Stops modal open
  const [stopForm,  setStopForm]  = useState(emptyStopForm)
  const [editingStopId, setEditingStopId] = useState(null)

  useEffect(() => {
    const onStorage = () => setInstId(localStorage.getItem('lnv_edu_inst') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const load = () => {
    fetch(`${BASE}/edu/bus-routes?institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json()).then(d=>setRoutes(d.data||[]))
    fetch(`${BASE}/edu/vehicles`, { headers:hdr2() }).then(r=>r.json()).then(d=>setVehicles(d.data||[]))
  }
  useEffect(() => { load() }, [instId])

  // ── Route CRUD ──
  const openNew = () => { setForm(emptyRouteForm); setEditingId(null); setShowForm(true) }
  const openEdit = (r) => {
    setForm({ routeNo:r.routeNo, routeName:r.routeName, vehicleId:r.vehicleId||'',
      morningStart:r.morningStart||'', afternoonStart:r.afternoonStart||'', totalKm:r.totalKm||'' })
    setEditingId(r.id); setShowForm(true)
  }
  const saveRoute = async () => {
    if (!form.routeName) return toast.error('Route Name is required')
    try {
      const url = editingId ? `${BASE}/edu/bus-routes/${editingId}` : `${BASE}/edu/bus-routes`
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? form : { ...form, institutionId: instId }
      const r = await fetch(url, { method, headers:hdr(), body:JSON.stringify(body) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(editingId ? '✅ Route updated' : '✅ Route created')
      setShowForm(false); load()
    } catch { toast.error('Save failed') }
  }
  const toggleActive = async (r) => {
    await fetch(`${BASE}/edu/bus-routes/${r.id}`, { method:'PATCH', headers:hdr(), body:JSON.stringify({ isActive: !r.isActive }) })
    load()
  }

  // ── Stops management ──
  const openStops = (route) => {
    setStopsFor(route); setEditingStopId(null)
    setStopForm({ ...emptyStopForm, stopOrder:(route.stops?.length||0)+1 })
  }
  const closeStops = () => { setStopsFor(null); setEditingStopId(null); load() }

  const openEditStop = (s) => {
    setEditingStopId(s.id)
    setStopForm({
      stopName: s.stopName, stopOrder: s.stopOrder,
      pickupTime: s.pickupTime||'', dropTime: s.dropTime||'', feeAmount: s.feeAmount||'',
    })
  }
  const cancelEditStop = () => {
    setEditingStopId(null)
    setStopForm({ ...emptyStopForm, stopOrder:(stopsFor?.stops?.length||0)+1 })
  }

  const refreshStopsFor = async () => {
    const updated = await fetch(`${BASE}/edu/bus-routes?institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json())
    const freshRoute = (updated.data||[]).find(x=>x.id===stopsFor.id)
    setStopsFor(freshRoute)
    setRoutes(updated.data||[])
    return freshRoute
  }

  const saveStop = async () => {
    if (!stopForm.stopName) return toast.error('Stop name required')
    try {
      const url    = editingStopId ? `${BASE}/edu/bus-stops/${editingStopId}` : `${BASE}/edu/bus-stops`
      const method = editingStopId ? 'PATCH' : 'POST'
      const body   = editingStopId ? stopForm : { ...stopForm, routeId: stopsFor.id }
      const r = await fetch(url, { method, headers:hdr(), body: JSON.stringify(body) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(editingStopId ? '✅ Stop updated' : '✅ Stop added')
      const freshRoute = await refreshStopsFor()
      setEditingStopId(null)
      setStopForm({ ...emptyStopForm, stopOrder:(freshRoute?.stops?.length||0)+1 })
    } catch { toast.error(editingStopId ? 'Failed to update stop' : 'Failed to add stop') }
  }
  const removeStop = async (stopId) => {
    try {
      await fetch(`${BASE}/edu/bus-stops/${stopId}`, { method:'DELETE', headers:hdr2() })
      await refreshStopsFor()
      if (editingStopId === stopId) cancelEditStop()
      toast.success('Stop removed')
    } catch { toast.error('Failed to remove stop') }
  }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>🚌 Bus Routes</div>
        <button onClick={openNew} style={btnPrimary}>+ New Route</button>
      </div>

      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <th style={th}>Route No</th><th style={th}>Name</th><th style={th}>Vehicle</th>
            <th style={th}>Morning</th><th style={th}>Afternoon</th><th style={th}>Total KM</th>
            <th style={th}>Stops</th><th style={th}>Students</th><th style={th}>Status</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {routes.map(r => (
              <tr key={r.id}>
                <td style={td}>{r.routeNo}</td>
                <td style={td}>{r.routeName}</td>
                <td style={td}>{r.vehicle?.vehicleNo || <span style={{color:'#aaa'}}>Unassigned</span>}</td>
                <td style={td}>{r.morningStart||'—'}</td>
                <td style={td}>{r.afternoonStart||'—'}</td>
                <td style={td}>{r.totalKm||'—'}</td>
                <td style={td}>{r.stops?.length||0}</td>
                <td style={td}>{r.students?.length||0}</td>
                <td style={td}>
                  <span style={{color:r.isActive?'#1E8449':'#C0392B',fontWeight:700,fontSize:11}}>
                    {r.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={td}>
                  <button onClick={()=>openStops(r)} style={{...btnSecondary,marginRight:6,padding:'4px 10px'}}>🚏 Stops</button>
                  <button onClick={()=>openEdit(r)} style={{...btnSecondary,marginRight:6,padding:'4px 10px'}}>Edit</button>
                  <button onClick={()=>toggleActive(r)} style={btnDanger}>{r.isActive?'Deactivate':'Activate'}</button>
                </td>
              </tr>
            ))}
            {routes.length===0 && <tr><td colSpan={10} style={{...td,textAlign:'center',color:'#aaa'}}>No bus routes yet for this institution</td></tr>}
          </tbody>
        </table>
      </div>

      {/* New/Edit Route modal */}
      {showForm && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:8,padding:20,width:420,maxHeight:'85vh',overflow:'auto'}}>
            <div style={{fontSize:15,fontWeight:800,color:'#6E2C00',marginBottom:6}}>
              {editingId ? 'Edit Route' : 'New Route'}
            </div>
            {!editingId && (
              <div style={{fontSize:11,color:'#888',marginBottom:10}}>
                Route No is generated automatically (institution-aware prefix — School gets RT-, College gets CLG-RT-)
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div>
                <label style={{fontSize:11,color:'#888'}}>Route Name *</label>
                <input value={form.routeName} onChange={e=>setForm({...form,routeName:e.target.value})} style={inp} />
              </div>
              <div>
                <label style={{fontSize:11,color:'#888'}}>Vehicle</label>
                <select value={form.vehicleId} onChange={e=>setForm({...form,vehicleId:e.target.value})} style={sel}>
                  <option value=''>— Unassigned —</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNo} ({v.capacity} seats)</option>)}
                </select>
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Morning Start</label>
                  <input type='time' value={form.morningStart} onChange={e=>setForm({...form,morningStart:e.target.value})} style={inp} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Afternoon Start</label>
                  <input type='time' value={form.afternoonStart} onChange={e=>setForm({...form,afternoonStart:e.target.value})} style={inp} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Total KM</label>
                  <input value={form.totalKm} onChange={e=>setForm({...form,totalKm:e.target.value})} style={inp} />
                </div>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18}}>
              <button onClick={()=>setShowForm(false)} style={btnSecondary}>Cancel</button>
              <button onClick={saveRoute} style={btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Stops modal */}
      {stopsFor && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:8,padding:20,width:520,maxHeight:'85vh',overflow:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:800,color:'#6E2C00'}}>🚏 Stops — {stopsFor.routeName}</div>
              <button onClick={closeStops} style={{...btnSecondary,padding:'4px 10px'}}>✕ Close</button>
            </div>

            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:16}}>
              <thead><tr>
                <th style={th}>#</th><th style={th}>Stop Name</th><th style={th}>Pickup</th>
                <th style={th}>Drop</th><th style={th}>Fee</th><th style={th}></th>
              </tr></thead>
              <tbody>
                {(stopsFor.stops||[]).map(s => (
                  <tr key={s.id}>
                    <td style={td}>{s.stopOrder}</td>
                    <td style={td}>{s.stopName}</td>
                    <td style={td}>{s.pickupTime||'—'}</td>
                    <td style={td}>{s.dropTime||'—'}</td>
                    <td style={td}>{s.feeAmount||'—'}</td>
                    <td style={td}>
                      <button onClick={()=>openEditStop(s)} style={{...btnSecondary,marginRight:6,padding:'4px 10px'}}>Edit</button>
                      <button onClick={()=>removeStop(s.id)} style={btnDanger}>Remove</button>
                    </td>
                  </tr>
                ))}
                {(stopsFor.stops||[]).length===0 && <tr><td colSpan={6} style={{...td,textAlign:'center',color:'#aaa'}}>No stops yet</td></tr>}
              </tbody>
            </table>

            <div style={{background:'#FAF8FA',border:'1px solid #E8E0E8',borderRadius:6,padding:12}}>
              <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:8}}>
                {editingStopId ? '✏️ Edit Stop' : '+ Add Stop'}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',gap:8,marginBottom:8}}>
                <input placeholder='Stop name' value={stopForm.stopName} onChange={e=>setStopForm({...stopForm,stopName:e.target.value})} style={inp} />
                <input type='number' placeholder='Order' value={stopForm.stopOrder} onChange={e=>setStopForm({...stopForm,stopOrder:e.target.value})} style={inp} />
                <input type='time' value={stopForm.pickupTime} onChange={e=>setStopForm({...stopForm,pickupTime:e.target.value})} style={inp} />
                <input type='time' value={stopForm.dropTime} onChange={e=>setStopForm({...stopForm,dropTime:e.target.value})} style={inp} />
                <input placeholder='Fee ₹' value={stopForm.feeAmount} onChange={e=>setStopForm({...stopForm,feeAmount:e.target.value})} style={inp} />
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={saveStop} style={btnPrimary}>{editingStopId ? '💾 Update Stop' : '+ Add Stop'}</button>
                {editingStopId && <button onClick={cancelEditStop} style={btnSecondary}>Cancel</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
