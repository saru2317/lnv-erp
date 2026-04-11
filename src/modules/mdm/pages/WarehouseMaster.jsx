import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const PLANTS    = ['MAIN','PLANT2','RANIPET','SITRA']
const CAP_UNITS = ['Sqft','Sqmt','Pallets','Bins','Tons','KL']
const LOC_TYPES = ['Storage Location','Rack','Bin','Zone','Cold Storage','Quarantine','Dispatch','Open Yard']

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block',
  marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }

const SEVER_COLOR = {
  MINOR:    { bg:'#D4EDDA', text:'#155724' },
  MAJOR:    { bg:'#FFF3CD', text:'#856404' },
  CRITICAL: { bg:'#F8D7DA', text:'#721C24' },
}

// ── Location Type Form Modal ──────────────────────────────
function LocTypeForm({ item, onSave, onCancel }) {
  const isEdit = !!item?.id
  const [form, setForm] = useState(item || { code:'', name:'', icon:'📦', colorBg:'#D1ECF1', colorText:'#0C5460', description:'' })
  const [saving, setSaving] = useState(false)
  const F = f => ({ value:form[f]??'', onChange:e=>setForm(p=>({...p,[f]:e.target.value})),
    style:inp, onFocus:e=>e.target.style.borderColor='#714B67', onBlur:e=>e.target.style.borderColor='#E0D5E0' })
  const save = async () => {
    if (!form.code || !form.name) return toast.error('Code and Name required!')
    setSaving(true)
    try {
      const url    = isEdit ? `${BASE_URL}/warehouse/location-types/${item.id}` : `${BASE_URL}/warehouse/location-types`
      const method = isEdit ? 'PATCH' : 'POST'
      const res  = await fetch(url, { method, headers:authHdrs(), body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Location Type ${isEdit?'updated':'created'}!`)
      onSave()
    } catch(err) { toast.error(err.message) } finally { setSaving(false) }
  }
  const ICON_OPTIONS = ['📦','🏭','🔒','🚚','🪨','✅','🔧','⚙️','🗑️','❄️','🔬','🛢️']
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:500, overflow:'hidden',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px', display:'flex',
          justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 }}>
            {isEdit ? `Edit — ${item.code}` : '+ New Location Type'}
          </h3>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12 }}>
            <div><label style={lbl}>Code *</label>
              <input {...F('code')} placeholder="DS" disabled={isEdit}
                style={{ ...inp, fontFamily:'DM Mono,monospace' }} /></div>
            <div><label style={lbl}>Name *</label>
              <input {...F('name')} placeholder="Dispatch Bay" /></div>
          </div>
          <div><label style={lbl}>Icon</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {ICON_OPTIONS.map(ic => (
                <div key={ic} onClick={() => setForm(f=>({...f,icon:ic}))}
                  style={{ width:36, height:36, borderRadius:6, cursor:'pointer', display:'flex',
                    alignItems:'center', justifyContent:'center', fontSize:18,
                    border: form.icon===ic ? '2px solid #714B67' : '1px solid #E0D5E0',
                    background: form.icon===ic ? '#EDE0EA' : '#F8F7FA' }}>{ic}</div>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Background Color</label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="color" value={form.colorBg}
                  onChange={e=>setForm(f=>({...f,colorBg:e.target.value}))}
                  style={{ width:40, height:36, border:'1px solid #E0D5E0', borderRadius:4, cursor:'pointer' }} />
                <span style={{ fontSize:11, color:'#6C757D' }}>{form.colorBg}</span>
              </div>
            </div>
            <div><label style={lbl}>Text Color</label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="color" value={form.colorText}
                  onChange={e=>setForm(f=>({...f,colorText:e.target.value}))}
                  style={{ width:40, height:36, border:'1px solid #E0D5E0', borderRadius:4, cursor:'pointer' }} />
                <span style={{ fontSize:11, color:'#6C757D' }}>{form.colorText}</span>
              </div>
            </div>
          </div>
          <div style={{ padding:'8px 12px', background:form.colorBg, borderRadius:8 }}>
            <span style={{ padding:'4px 12px', borderRadius:10, fontSize:12,
              fontWeight:700, background:form.colorBg, color:form.colorText }}>
              {form.icon} {form.name || 'Preview'}
            </span>
          </div>
          <div><label style={lbl}>Description</label>
            <input {...F('description')} placeholder="Optional description" /></div>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
          <button onClick={onCancel} style={{ padding:'8px 20px', background:'#fff',
            color:'#6C757D', border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13, cursor:'pointer' }}>
            Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding:'8px 24px', background:saving?'#9E7D96':'#714B67',
            color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {saving ? '⏳ Saving...' : '💾 Save'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Warehouse Form Modal ──────────────────────────────────
function WarehouseForm({ wh, whTypes, onSave, onCancel }) {
  const isEdit = !!wh?.id
  const BLANK  = { code:'', name:'', type: whTypes[0]?.code||'WH', plant:'MAIN',
    capacity:'', capacityUnit:'Sqft', incharge:'', remarks:'' }
  const BLANK_LOC = { id:Date.now(), code:'', name:'', type:'Storage Location', capacity:'', remarks:'' }
  const [form,      setForm]     = useState(wh ? {...wh, type:wh.type||'WH'} : BLANK)
  const [locs,      setLocs]     = useState(
    wh?.storageLocations?.length > 0 ? wh.storageLocations :
    wh?.locations?.length > 0 ? wh.locations : [])
  const [activeTab, setActiveTab]= useState('general')
  const [saving,    setSaving]   = useState(false)
  const F = f => ({ value:form[f]??'', onChange:e=>setForm(p=>({...p,[f]:e.target.value})),
    style:inp, onFocus:e=>e.target.style.borderColor='#714B67', onBlur:e=>e.target.style.borderColor='#E0D5E0' })
  const addLoc = () => setLocs(l => [...l, { ...BLANK_LOC, id:Date.now() }])
  const delLoc = id => setLocs(l => l.filter(x=>x.id!==id))
  const updLoc = (id,k,v) => setLocs(l => l.map(x=>x.id===id?{...x,[k]:v}:x))
  const genCode = () => {
    const t = form.type || 'WH'
    const n = String(Date.now()).slice(-3)
    setForm(f=>({...f, code:`${t}-${n}`}))
  }
  const save = async () => {
    if (!form.code || !form.name) return toast.error('Code and Name required!')
    setSaving(true)
    try {
      const url    = isEdit ? `${BASE_URL}/warehouse/${wh.id}` : `${BASE_URL}/warehouse`
      const method = isEdit ? 'PATCH' : 'POST'
      const res  = await fetch(url, { method, headers:authHdrs(), body:JSON.stringify({...form, locations:locs}) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Warehouse ${isEdit?'updated':'created'}!`)
      onSave()
    } catch(err) { toast.error(err.message) } finally { setSaving(false) }
  }
  const whType = whTypes.find(t=>t.code===form.type) || whTypes[0] || {}
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:'85%', maxWidth:900,
        overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700 }}>
              {isEdit ? `Edit — ${wh.code}` : 'New Warehouse / Location'}
            </h3>
            <p style={{ color:'rgba(255,255,255,.6)', margin:'2px 0 0', fontSize:11 }}>
              SAP WM: Plant → Warehouse → Storage Location → Bin
            </p>
          </div>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ display:'flex', borderBottom:'2px solid #E0D5E0', background:'#F8F7FA' }}>
          {[{ id:'general', label:'🏭 General Info' }, { id:'locations', label:`📍 Storage Locations (${locs.length})` }]
            .map(t => (
              <div key={t.id} onClick={()=>setActiveTab(t.id)}
                style={{ padding:'10px 20px', fontSize:12, fontWeight:600, cursor:'pointer',
                  color:activeTab===t.id?'#714B67':'#6C757D',
                  borderBottom:activeTab===t.id?'2px solid #714B67':'2px solid transparent',
                  marginBottom:-2, background:activeTab===t.id?'#fff':'transparent' }}>
                {t.label}
              </div>
            ))}
        </div>
        <div style={{ overflowY:'auto', height:460, padding:'16px 20px' }}>
          {activeTab==='general' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Warehouse / Location Type</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {whTypes.map(t => (
                    <div key={t.code} onClick={()=>setForm(f=>({...f,type:t.code}))}
                      style={{ padding:'8px 14px', borderRadius:8, cursor:'pointer',
                        border: form.type===t.code?'2px solid #714B67':'1px solid #E0D5E0',
                        background: form.type===t.code?'#714B67':'#fff',
                        color: form.type===t.code?'#fff':'#6C757D',
                        fontSize:12, fontWeight:600 }}>
                      {t.icon} {t.name}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr', gap:12 }}>
                <div><label style={lbl}>Code *</label>
                  <div style={{ display:'flex', gap:4 }}>
                    <input {...F('code')} placeholder="WH-001"
                      style={{ ...inp, fontFamily:'DM Mono,monospace', flex:1 }} disabled={isEdit} />
                    {!isEdit && <button onClick={genCode} style={{ padding:'8px',background:'#714B67',
                      color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer' }}>Auto</button>}
                  </div>
                </div>
                <div><label style={lbl}>Name *</label>
                  <input {...F('name')} placeholder="Main Finished Goods Store" /></div>
                <div><label style={lbl}>Plant / Site</label>
                  <select {...F('plant')} style={{ ...inp, cursor:'pointer' }}>
                    {PLANTS.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div><label style={lbl}>Capacity</label>
                  <input {...F('capacity')} type="number" placeholder="5000" min="0" /></div>
                <div><label style={lbl}>Capacity Unit</label>
                  <select {...F('capacityUnit')} style={{ ...inp, cursor:'pointer' }}>
                    {CAP_UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Incharge</label>
                  <input {...F('incharge')} placeholder="Rajan Kumar" /></div>
              </div>
              <div style={{ background:'#F8F4F8', borderRadius:8, padding:14, border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  marginBottom:10, textTransform:'uppercase', letterSpacing:.4 }}>🗂️ SAP WM Hierarchy</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, flexWrap:'wrap' }}>
                  <span style={{ padding:'4px 12px', background:'#EDE0EA', borderRadius:6, fontWeight:600, color:'#714B67' }}>
                    🏭 {form.plant||'MAIN'}</span>
                  <span style={{ color:'#CCC' }}>→</span>
                  <span style={{ padding:'4px 12px', background:whType.colorBg||'#D1ECF1',
                    borderRadius:6, fontWeight:600, color:whType.colorText||'#0C5460' }}>
                    {whType.icon} {form.type}: {form.code||'CODE'}</span>
                  <span style={{ color:'#CCC' }}>→</span>
                  <span style={{ padding:'4px 12px', background:'#D1ECF1', borderRadius:6, fontWeight:600, color:'#0C5460' }}>
                    📍 {locs.length} Locations</span>
                  <span style={{ color:'#CCC' }}>→</span>
                  <span style={{ padding:'4px 12px', background:'#F0EEF0', borderRadius:6, fontWeight:600, color:'#6C757D' }}>
                    📦 Bins</span>
                </div>
              </div>
              <div><label style={lbl}>Remarks</label>
                <textarea {...F('remarks')} style={{ ...inp, minHeight:55, resize:'vertical' }}
                  placeholder="Notes about this warehouse" /></div>
            </div>
          )}
          {activeTab==='locations' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:12, color:'#6C757D' }}>
                  💡 Storage Locations are areas inside the warehouse (Zone A, Rack 1, Cold Storage)
                </div>
                <button onClick={addLoc} style={{ padding:'7px 16px', background:'#714B67',
                  color:'#fff', border:'none', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  + Add Location</button>
              </div>
              {locs.length===0 ? (
                <div style={{ padding:40, textAlign:'center', color:'#6C757D',
                  border:'2px dashed #E0D5E0', borderRadius:8 }}>
                  📍 No storage locations yet<br/>
                  <span style={{ fontSize:11 }}>e.g. Zone A, Rack 1, Cold Storage, Bin Row-01</span>
                </div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead style={{ background:'#F8F4F8' }}>
                    <tr>{['#','Code','Name','Type','Capacity','Remarks',''].map(h=>(
                      <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'left', textTransform:'uppercase',
                        borderBottom:'2px solid #E0D5E0', letterSpacing:.4 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {locs.map((loc,i)=>(
                      <tr key={loc.id||i} style={{ borderBottom:'1px solid #F0EEF0' }}>
                        <td style={{ padding:'8px 10px', fontSize:11, color:'#6C757D', width:30, textAlign:'center' }}>{i+1}</td>
                        <td style={{ padding:'6px 8px', width:130 }}>
                          <input style={{ ...inp, fontFamily:'DM Mono,monospace', fontSize:11 }}
                            value={loc.code} onChange={e=>updLoc(loc.id,'code',e.target.value)} placeholder="SL-001"
                            onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                        </td>
                        <td style={{ padding:'6px 8px' }}>
                          <input style={{ ...inp, fontSize:11 }}
                            value={loc.name} onChange={e=>updLoc(loc.id,'name',e.target.value)} placeholder="Zone A"
                            onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                        </td>
                        <td style={{ padding:'6px 8px', width:140 }}>
                          <select style={{ ...inp, fontSize:11, cursor:'pointer' }}
                            value={loc.type||loc.locType||'Storage Location'}
                            onChange={e=>updLoc(loc.id,'type',e.target.value)}>
                            {LOC_TYPES.map(t=><option key={t}>{t}</option>)}
                          </select>
                        </td>
                        <td style={{ padding:'6px 8px', width:100 }}>
                          <input style={{ ...inp, fontSize:11 }}
                            value={loc.capacity||''} onChange={e=>updLoc(loc.id,'capacity',e.target.value)} placeholder="500 Sqft"
                            onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                        </td>
                        <td style={{ padding:'6px 8px' }}>
                          <input style={{ ...inp, fontSize:11 }}
                            value={loc.remarks||''} onChange={e=>updLoc(loc.id,'remarks',e.target.value)} placeholder="Note"
                            onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                        </td>
                        <td style={{ padding:'6px 8px', width:30, textAlign:'center' }}>
                          <span onClick={()=>delLoc(loc.id||i)}
                            style={{ cursor:'pointer', color:'#DC3545', fontSize:16, fontWeight:700 }}>✕</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'space-between', alignItems:'center', background:'#F8F7FA' }}>
          <div style={{ fontSize:11, color:'#6C757D' }}>
            {locs.length>0 && `📍 ${locs.length} location${locs.length!==1?'s':''} defined`}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onCancel} style={{ padding:'8px 20px', background:'#fff',
              color:'#6C757D', border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13, cursor:'pointer' }}>
              Cancel</button>
            <button onClick={save} disabled={saving}
              style={{ padding:'8px 24px', background:saving?'#9E7D96':'#714B67',
                color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {saving ? '⏳ Saving...' : isEdit ? '💾 Update' : '💾 Create Warehouse'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────
export default function WarehouseMaster() {
  const [tab,       setTab]      = useState('warehouses')  // warehouses | loc-types
  const [rows,      setRows]     = useState([])
  const [whTypes,   setWhTypes]  = useState([])
  const [loading,   setLoading]  = useState(true)
  const [search,    setSearch]   = useState('')
  const [typeF,     setTypeF]    = useState('All')
  const [showForm,  setShowForm] = useState(false)
  const [editWH,    setEditWH]   = useState(null)
  const [showLTForm,setShowLTForm]=useState(false)
  const [editLT,    setEditLT]   = useState(null)

  const fetchTypes = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/warehouse/location-types`, { headers:authHdrs() })
      const data = await res.json()
      if (res.ok) setWhTypes(data.data || [])
    } catch(e) { console.error(e) }
  }, [])

  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true)
      const res  = await fetch(`${BASE_URL}/warehouse`, { headers:authHdrs() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRows(data.data || [])
    } catch(err) { toast.error('Failed: ' + err.message) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTypes(); fetchWarehouses() }, [])

  const deactivate = async id => {
    if (!confirm('Deactivate this warehouse?')) return
    await fetch(`${BASE_URL}/warehouse/${id}`, { method:'DELETE', headers:authHdrs() })
    toast.success('Deactivated!'); fetchWarehouses()
  }
  const deleteLT = async id => {
    if (!confirm('Delete this location type?')) return
    await fetch(`${BASE_URL}/warehouse/location-types/${id}`, { method:'DELETE', headers:authHdrs() })
    toast.success('Deleted!'); fetchTypes()
  }

  const filtered = rows.filter(r =>
    (typeF==='All' || r.type===typeF) &&
    (r.code?.toLowerCase().includes(search.toLowerCase()) ||
     r.name?.toLowerCase().includes(search.toLowerCase()) ||
     r.plant?.toLowerCase().includes(search.toLowerCase()))
  )
  const totalLocs = rows.reduce((s,r)=>s+(r.storageLocations?.length||r.locations?.length||0),0)

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            Warehouse / Locations
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            SAP: MM — WM &nbsp;|&nbsp; Plant → Warehouse → Storage Location → Bin
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>{fetchTypes();fetchWarehouses()}}
            style={{ padding:'8px 14px', background:'#fff', color:'#714B67',
              border:'1.5px solid #714B67', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>
            🔄 Refresh</button>
          {tab==='warehouses' && (
            <button onClick={()=>{setEditWH(null);setShowForm(true)}}
              style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
                border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              + New Warehouse</button>
          )}
          {tab==='loc-types' && (
            <button onClick={()=>{setEditLT(null);setShowLTForm(true)}}
              style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
                border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              + New Type</button>
          )}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Warehouses', value:rows.length,                                     color:'#714B67', bg:'#EDE0EA' },
          { label:'Main Warehouses',  value:rows.filter(r=>r.type==='WH').length,            color:'#0C5460', bg:'#D1ECF1' },
          { label:'Store Rooms',      value:rows.filter(r=>['ST','SP'].includes(r.type)).length, color:'#155724', bg:'#D4EDDA' },
          { label:'Quarantine/Scrap', value:rows.filter(r=>['QA','SCRAP'].includes(r.type)).length, color:'#721C24', bg:'#F8D7DA' },
          { label:'Storage Locations',value:totalLocs,                                       color:'#856404', bg:'#FFF3CD' },
        ].map(k=>(
          <div key={k.label} style={{ background:k.bg, borderRadius:8, padding:'12px 16px', border:`1px solid ${k.color}22` }}>
            <div style={{ fontSize:11, color:k.color, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color, fontFamily:'Syne,sans-serif', lineHeight:1.2 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:14, borderBottom:'2px solid #E0D5E0' }}>
        {[{ id:'warehouses', label:'🏭 Warehouses' }, { id:'loc-types', label:`🏷️ Location Types (${whTypes.length})` }]
          .map(t=>(
            <div key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:'8px 18px', fontSize:12, fontWeight:600, cursor:'pointer',
                color:tab===t.id?'#714B67':'#6C757D',
                borderBottom:tab===t.id?'2px solid #714B67':'2px solid transparent',
                marginBottom:-2, background:tab===t.id?'#fff':'transparent' }}>
              {t.label}
            </div>
          ))}
      </div>

      {/* ── WAREHOUSES TAB ── */}
      {tab==='warehouses' && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center', flexWrap:'wrap' }}>
            <input placeholder="🔍 Search code, name, plant..." value={search}
              onChange={e=>setSearch(e.target.value)}
              style={{ padding:'7px 12px', border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:12, outline:'none', width:280 }} />
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {['All', ...whTypes.map(t=>t.code)].map(t=>(
                <button key={t} onClick={()=>setTypeF(t)}
                  style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                    cursor:'pointer', border:'1px solid #E0D5E0',
                    background:typeF===t?'#714B67':'#fff', color:typeF===t?'#fff':'#6C757D' }}>
                  {t==='All' ? 'All' : (whTypes.find(x=>x.code===t)?.icon||'')+ ' ' + (whTypes.find(x=>x.code===t)?.name||t)}
                </button>
              ))}
            </div>
            <span style={{ fontSize:11, color:'#6C757D', marginLeft:'auto' }}>{filtered.length} of {rows.length}</span>
          </div>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#6C757D', background:'#fff', borderRadius:8 }}>
              ⏳ Loading...</div>
          ) : (
            <div style={{ maxHeight:'calc(100vh-420px)', overflowY:'auto',
              border:'1px solid #E0D5E0', borderRadius:8, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead style={{ position:'sticky', top:0, zIndex:10, background:'#F8F4F8' }}>
                  <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                    {['Code','Name','Type','Plant','Capacity','Incharge','Locations','Actions'].map(h=>(
                      <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700,
                        color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r,i)=>{
                    const wt = whTypes.find(t=>t.code===r.type) || {}
                    const locCount = r.storageLocations?.length || r.locations?.length || 0
                    return (
                      <tr key={r.id} style={{ borderBottom:'1px solid #F0EEF0',
                        background:i%2===0?'#fff':'#FDFBFD' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                        <td style={{ padding:'10px 14px', fontFamily:'DM Mono,monospace',
                          fontWeight:700, color:'#714B67', fontSize:12 }}>{r.code}</td>
                        <td style={{ padding:'10px 14px', fontWeight:600, fontSize:13 }}>{r.name}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ padding:'3px 10px', borderRadius:10, fontSize:11,
                            fontWeight:700, background:wt.colorBg||'#E0E0E0', color:wt.colorText||'#555' }}>
                            {wt.icon||'📦'} {wt.name||r.type}
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:12, color:'#6C757D' }}>{r.plant}</td>
                        <td style={{ padding:'10px 14px', fontSize:12 }}>
                          {r.capacity ? `${r.capacity} ${r.capacityUnit||'Sqft'}` : '—'}
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:12 }}>{r.incharge||'—'}</td>
                        <td style={{ padding:'10px 14px', textAlign:'center' }}>
                          <span style={{ padding:'2px 10px', borderRadius:10, fontSize:11,
                            fontWeight:600, background:'#D1ECF1', color:'#0C5460' }}>
                            {locCount} locs
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ display:'flex', gap:4 }}>
                            <button onClick={()=>{setEditWH(r);setShowForm(true)}}
                              style={{ padding:'4px 12px', background:'#714B67', color:'#fff',
                                border:'none', borderRadius:4, fontSize:12, cursor:'pointer' }}>Edit</button>
                            <button onClick={()=>deactivate(r.id)}
                              style={{ padding:'4px 10px', background:'#fff', color:'#6C757D',
                                border:'1px solid #6C757D', borderRadius:4, fontSize:12, cursor:'pointer' }}>×</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length===0 && !loading && (
                    <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
                      {rows.length===0 ? '🏭 No warehouses yet — click "+ New Warehouse"' : 'No match'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── LOCATION TYPES TAB ── */}
      {tab==='loc-types' && (
        <div>
          <div style={{ marginBottom:12, fontSize:12, color:'#6C757D',
            background:'#E6F7F7', padding:'8px 12px', borderRadius:6, border:'1px solid #00A09D' }}>
            💡 Location Types define the nature of each warehouse/store (e.g. Quarantine, Dispatch Bay).
            System types cannot be deleted. Add custom types for your plant.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
            {whTypes.map(t=>(
              <div key={t.id} style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
                overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                <div style={{ padding:'12px 16px', background:t.colorBg, display:'flex',
                  justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:22 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontWeight:700, color:t.colorText, fontSize:14 }}>{t.name}</div>
                      <div style={{ fontSize:10, fontFamily:'DM Mono,monospace', color:t.colorText, opacity:.7 }}>
                        {t.code}
                      </div>
                    </div>
                  </div>
                  {t.isSystem && (
                    <span style={{ fontSize:10, padding:'2px 8px', background:'rgba(0,0,0,.1)',
                      borderRadius:10, color:t.colorText, fontWeight:600 }}>SYSTEM</span>
                  )}
                </div>
                <div style={{ padding:'10px 16px', display:'flex', justifyContent:'space-between',
                  alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'#6C757D' }}>
                    {rows.filter(r=>r.type===t.code).length} warehouses
                  </span>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>{setEditLT(t);setShowLTForm(true)}}
                      style={{ padding:'4px 12px', background:'#714B67', color:'#fff',
                        border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>Edit</button>
                    {!t.isSystem && (
                      <button onClick={()=>deleteLT(t.id)}
                        style={{ padding:'4px 10px', background:'#fff', color:'#DC3545',
                          border:'1px solid #DC3545', borderRadius:4, fontSize:11, cursor:'pointer' }}>Delete</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && <WarehouseForm wh={editWH} whTypes={whTypes}
        onSave={()=>{setShowForm(false);setEditWH(null);fetchWarehouses()}}
        onCancel={()=>{setShowForm(false);setEditWH(null)}} />}
      {showLTForm && <LocTypeForm item={editLT}
        onSave={()=>{setShowLTForm(false);setEditLT(null);fetchTypes()}}
        onCancel={()=>{setShowLTForm(false);setEditLT(null)}} />}
    </div>
  )
}
