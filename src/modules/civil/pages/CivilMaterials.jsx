import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const inp  = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl  = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.5px' }

const CATEGORIES = ['All','Concrete','Steel','Masonry','Finishing','Plumbing','Electrical','Shuttering','Waterproofing','Misc']
const UNITS      = ['Bag','CuM','MT','Kg','RMT','SqFt','SqM','Nos','Litre','Load','Bundle','Set']
const TRACK_METHODS = [
  { value:'DAILY',  label:'Daily Count',   desc:'Cement, Steel — count every day' },
  { value:'ISSUE',  label:'Issue Based',   desc:'Track by quantity issued to site' },
  { value:'WEEKLY', label:'Weekly Count',  desc:'Sand, Aggregate — count weekly' },
]

const STATUS_CFG = {
  DAILY:  { bg:'#E8F5E9', color:'#1E8449', label:'Daily Count' },
  ISSUE:  { bg:'#EBF5FB', color:'#1A5276', label:'Issue Based' },
  WEEKLY: { bg:'#FEF9E7', color:'#B8860B', label:'Weekly Count' },
}

export default function CivilMaterials() {
  const [mats,     setMats]    = useState([])
  const [loading,  setLoading] = useState(true)
  const [filter,   setFilter]  = useState('All')
  const [search,   setSearch]  = useState('')
  const [modal,    setModal]   = useState(false)
  const [editRow,  setEditRow] = useState(null)
  const [seeding,  setSeeding] = useState(false)
  const [form, setForm] = useState({
    matName:'', category:'Concrete', specification:'', brand:'',
    unit:'Bag', stdRate:'', hsnCode:'', isMeasurable:true, trackMethod:'ISSUE', minStock:'', remarks:''
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'All') params.set('category', filter)
      if (search) params.set('search', search)
      const r = await fetch(`${BASE}/civil-ext/materials?${params}`, { headers:hdr2() })
      const d = await r.json()
      setMats(d.data || [])
    } catch {} finally { setLoading(false) }
  }, [filter, search])

  useEffect(() => { load() }, [load])

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }))

  const openNew = () => {
    setEditRow(null)
    setForm({ matName:'', category:'Concrete', specification:'', brand:'', unit:'Bag', stdRate:'', hsnCode:'', isMeasurable:true, trackMethod:'ISSUE', minStock:'', remarks:'' })
    setModal(true)
  }

  const openEdit = (m) => {
    setEditRow(m)
    setForm({ matName:m.matName, category:m.category, specification:m.specification||'', brand:m.brand||'', unit:m.unit, stdRate:m.stdRate||'', hsnCode:m.hsnCode||'', isMeasurable:m.isMeasurable, trackMethod:m.trackMethod||'ISSUE', minStock:m.minStock||'', remarks:m.remarks||'' })
    setModal(true)
  }

  const save = async () => {
    if (!form.matName.trim()) return toast.error('Material name required')
    try {
      const url    = editRow ? `${BASE}/civil-ext/materials/${editRow.id}` : `${BASE}/civil-ext/materials`
      const method = editRow ? 'PATCH' : 'POST'
      const r = await fetch(url, { method, headers:hdr(), body:JSON.stringify(form) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(editRow ? 'Material updated ✅' : `Material ${d.data.matCode} added ✅`)
      setModal(false); load()
    } catch { toast.error('Failed') }
  }

  const seedDefaults = async () => {
    setSeeding(true)
    try {
      const r = await fetch(`${BASE}/civil-ext/materials/seed-defaults`, { method:'POST', headers:hdr() })
      const d = await r.json()
      toast.success(d.message)
      load()
    } catch { toast.error('Seed failed') }
    finally { setSeeding(false) }
  }

  const deactivate = async (id) => {
    if (!confirm('Deactivate this material?')) return
    await fetch(`${BASE}/civil-ext/materials/${id}`, { method:'PATCH', headers:hdr(), body:JSON.stringify({ isActive:false }) })
    toast.success('Deactivated'); load()
  }

  const grouped = mats.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category].push(m)
    return acc
  }, {})

  return (
    <div style={{ background:'#F8F5F8', minHeight:'100vh', fontFamily:'DM Sans,sans-serif' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'#6E2C00' }}>📦 Civil Material Master</div>
          <div style={{ fontSize:11, color:'#888' }}>{mats.length} materials · Construction-specific master</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={seedDefaults} disabled={seeding}
            style={{ padding:'7px 16px', background:'#FDF2E9', border:'1px solid #6E2C00', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:600, color:'#6E2C00' }}>
            {seeding ? '⏳...' : '🌱 Load Defaults'}
          </button>
          <button onClick={openNew}
            style={{ padding:'7px 18px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:700 }}>
            + Add Material
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, padding:'10px 14px', marginBottom:14, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder='🔍 Search material...'
          style={{ ...inp, width:220 }} />
        <div style={{ display:'flex', gap:4 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              style={{ padding:'5px 12px', border:'none', borderRadius:5, cursor:'pointer', fontSize:11, fontWeight:700,
                background: filter===c ? '#6E2C00' : '#F0E8EC', color: filter===c ? '#fff' : '#6E2C00' }}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={load} style={{ padding:'6px 12px', background:'#F0E8EC', color:'#6E2C00', border:'none', borderRadius:5, cursor:'pointer', fontSize:12 }}>🔄</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        {[
          ['Total Materials',  mats.length,                                     '#6E2C00'],
          ['Daily Count',      mats.filter(m=>m.trackMethod==='DAILY').length,  '#1E8449'],
          ['Issue Based',      mats.filter(m=>m.trackMethod==='ISSUE').length,  '#1A5276'],
          ['Weekly Count',     mats.filter(m=>m.trackMethod==='WEEKLY').length, '#B8860B'],
        ].map(([l,v,c])=>(
          <div key={l} style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, padding:'10px 14px', borderLeft:`3px solid ${c}` }}>
            <div style={{ fontSize:20, fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Material Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>⏳ Loading...</div>
      ) : mats.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:8, border:'1px solid #E8E0E8' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
          <div style={{ fontSize:15, fontWeight:700, color:'#6E2C00', marginBottom:8 }}>No materials yet</div>
          <div style={{ fontSize:12, color:'#888', marginBottom:16 }}>Load default construction materials or add manually</div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={seedDefaults} disabled={seeding}
              style={{ padding:'8px 20px', background:'#FDF2E9', border:'1px solid #6E2C00', borderRadius:5, cursor:'pointer', fontWeight:700, color:'#6E2C00', fontSize:13 }}>
              🌱 Load 25 Default Materials
            </button>
            <button onClick={openNew}
              style={{ padding:'8px 20px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:13 }}>
              + Add Manual
            </button>
          </div>
        </div>
      ) : filter === 'All' ? (
        // Grouped by category
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, marginBottom:14, overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,#6E2C00,#8B3A00)', padding:'9px 16px', color:'#fff', fontSize:12, fontWeight:700 }}>
              {cat} ({items.length})
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#FDF2E9' }}>
                  {['Code','Name','Specification','Unit','Std Rate','Track Method','Min Stock',''].map(h=>(
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, fontWeight:700, color:'#6E2C00' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((m,i)=>{
                  const tc = STATUS_CFG[m.trackMethod]||STATUS_CFG.ISSUE
                  return (
                    <tr key={m.id} style={{ background:i%2===0?'#fff':'#FDF9F7', borderBottom:'1px solid #F5EDE0' }}>
                      <td style={{ padding:'8px 12px', fontFamily:'monospace', fontSize:10, color:'#6E2C00', fontWeight:700 }}>{m.matCode}</td>
                      <td style={{ padding:'8px 12px', fontWeight:700 }}>{m.matName}</td>
                      <td style={{ padding:'8px 12px', color:'#555', fontSize:11 }}>{m.specification||'—'}</td>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}>{m.unit}</td>
                      <td style={{ padding:'8px 12px', fontWeight:700, color:'#1E8449' }}>{m.stdRate>0?fmtC(m.stdRate):'—'}</td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700, background:tc.bg, color:tc.color }}>{tc.label}</span>
                      </td>
                      <td style={{ padding:'8px 12px', color:'#888' }}>{m.minStock>0?`${m.minStock} ${m.unit}`:'—'}</td>
                      <td style={{ padding:'8px 12px', display:'flex', gap:4 }}>
                        <button onClick={()=>openEdit(m)} style={{ padding:'3px 8px', background:'#EBF5FB', color:'#1A5276', border:'none', borderRadius:4, cursor:'pointer', fontSize:10 }}>✏️</button>
                        <button onClick={()=>deactivate(m.id)} style={{ padding:'3px 8px', background:'#FDEDEC', color:'#C0392B', border:'none', borderRadius:4, cursor:'pointer', fontSize:10 }}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#6E2C00', color:'#fff' }}>
                {['Code','Name','Category','Specification','Unit','Std Rate','Track Method',''].map(h=>(
                  <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mats.map((m,i)=>{
                const tc = STATUS_CFG[m.trackMethod]||STATUS_CFG.ISSUE
                return (
                  <tr key={m.id} style={{ background:i%2===0?'#fff':'#FDF9F7', borderBottom:'1px solid #F5EDE0' }}>
                    <td style={{ padding:'9px 12px', fontFamily:'monospace', fontSize:10, color:'#6E2C00', fontWeight:700 }}>{m.matCode}</td>
                    <td style={{ padding:'9px 12px', fontWeight:700 }}>{m.matName}</td>
                    <td style={{ padding:'9px 12px', color:'#555' }}>{m.category}</td>
                    <td style={{ padding:'9px 12px', color:'#555', fontSize:11 }}>{m.specification||'—'}</td>
                    <td style={{ padding:'9px 12px', fontWeight:600 }}>{m.unit}</td>
                    <td style={{ padding:'9px 12px', fontWeight:700, color:'#1E8449' }}>{m.stdRate>0?fmtC(m.stdRate):'—'}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700, background:tc.bg, color:tc.color }}>{tc.label}</span>
                    </td>
                    <td style={{ padding:'9px 12px', display:'flex', gap:4 }}>
                      <button onClick={()=>openEdit(m)} style={{ padding:'3px 8px', background:'#EBF5FB', color:'#1A5276', border:'none', borderRadius:4, cursor:'pointer', fontSize:10 }}>✏️</button>
                      <button onClick={()=>deactivate(m.id)} style={{ padding:'3px 8px', background:'#FDEDEC', color:'#C0392B', border:'none', borderRadius:4, cursor:'pointer', fontSize:10 }}>✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, width:560, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 16px 48px rgba(0,0,0,.25)', position:'relative', zIndex:10000 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#6E2C00', marginBottom:18 }}>
              {editRow ? '✏️ Edit Material' : '➕ Add Civil Material'}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Material Name *</label>
                <input defaultValue={form.matName} onBlur={e=>set('matName',e.target.value)} placeholder='e.g. Cement OPC 53 Grade' style={inp} />
              </div>
              <div>
                <label style={lbl}>Category *</label>
                <select value={form.category} onChange={e=>set('category',e.target.value)} style={inp}>
                  {CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Unit *</label>
                <select value={form.unit} onChange={e=>set('unit',e.target.value)} style={inp}>
                  {UNITS.map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Specification / Grade / Standard</label>
                <input defaultValue={form.specification} onBlur={e=>set('specification',e.target.value)}
                  placeholder='e.g. OPC 53 Grade IS 12269 / Fe500D IS 1786' style={inp} />
              </div>
              <div>
                <label style={lbl}>Brand (if specific)</label>
                <input defaultValue={form.brand} onBlur={e=>set('brand',e.target.value)} placeholder='e.g. Ultratech / TATA / Any' style={inp} />
              </div>
              <div>
                <label style={lbl}>Standard Rate (₹)</label>
                <input type='number' defaultValue={form.stdRate} onBlur={e=>set('stdRate',e.target.value)} placeholder='0' style={inp} />
              </div>
              <div>
                <label style={lbl}>HSN Code</label>
                <input defaultValue={form.hsnCode} onBlur={e=>set('hsnCode',e.target.value)} placeholder='e.g. 25231000' style={inp} />
              </div>
              <div>
                <label style={lbl}>Min Stock Alert</label>
                <input type='number' defaultValue={form.minStock} onBlur={e=>set('minStock',e.target.value)} placeholder='0' style={inp} />
              </div>

              {/* Track Method */}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Tracking Method *</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                  {TRACK_METHODS.map(t=>(
                    <div key={t.value} onClick={()=>set('trackMethod',t.value)}
                      style={{ padding:'10px 12px', border:`2px solid ${form.trackMethod===t.value?'#6E2C00':'#ddd'}`,
                        borderRadius:7, cursor:'pointer', background:form.trackMethod===t.value?'#FDF2E9':'#fff' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:form.trackMethod===t.value?'#6E2C00':'#555' }}>{t.label}</div>
                      <div style={{ fontSize:10, color:'#888', marginTop:3 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Remarks</label>
                <input defaultValue={form.remarks} onBlur={e=>set('remarks',e.target.value)} placeholder='Any notes' style={inp} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18 }}>
              <button onClick={()=>setModal(false)} style={{ padding:'7px 18px', background:'#f0f0f0', border:'none', borderRadius:5, cursor:'pointer', fontWeight:600 }}>Cancel</button>
              <button onClick={save} style={{ padding:'7px 22px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontWeight:700 }}>
                💾 {editRow?'Update':'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
