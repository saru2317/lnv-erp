import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

const inp = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block',
  marginBottom:3, textTransform:'uppercase', letterSpacing:'0.5px' }

const CATEGORIES = ['All','Civil Works','Concrete','Masonry','Finishing','Carpentry','MEP','Structural','External','Misc']

const CAT_COLORS = {
  'Civil Works': { bg:'#EBF5FB', color:'#1A5276' },
  'Concrete':    { bg:'#FDF2E9', color:'#6E2C00' },
  'Masonry':     { bg:'#FEF9E7', color:'#B8860B' },
  'Finishing':   { bg:'#E8F5E9', color:'#1E8449' },
  'Carpentry':   { bg:'#F0EBF0', color:'#714B67' },
  'MEP':         { bg:'#E8F8F5', color:'#117A65' },
  'Structural':  { bg:'#FDEDEC', color:'#C0392B' },
  'External':    { bg:'#FDF2E9', color:'#D35400' },
  'Misc':        { bg:'#F5F5F5', color:'#555555' },
}

const UNITS = ['LS','SqM','SqFt','CuM','RMT','Nos','MT','Kg','Litre','Point','Month','KWP','Acre','TR']

const emptyForm = {
  activityName:'', category:'Civil Works', defaultUnit:'LS',
  unitOptions:'LS', description:'', sortOrder:''
}

export default function BOQMaster() {
  const [items,    setItems]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [filter,   setFilter]  = useState('All')
  const [search,   setSearch]  = useState('')
  const [modal,    setModal]   = useState(false)
  const [editRow,  setEditRow] = useState(null)
  const [seeding,  setSeeding] = useState(false)
  const [saving,   setSaving]  = useState(false)
  const [form,     setForm]    = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'All') params.set('category', filter)
      if (search) params.set('search', search)
      const r = await fetch(`${BASE}/civil-ext/boq-master?${params}`, { headers:hdr2() })
      const d = await r.json()
      setItems(d.data || [])
    } catch {} finally { setLoading(false) }
  }, [filter, search])

  useEffect(() => { load() }, [load])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-update unitOptions when defaultUnit changes
  const setUnit = (v) => {
    setForm(f => ({
      ...f,
      defaultUnit: v,
      unitOptions: f.unitOptions.includes(v) ? f.unitOptions : v + (f.unitOptions ? ',' + f.unitOptions : '')
    }))
  }

  const openNew = () => {
    setEditRow(null)
    setForm(emptyForm)
    setModal(true)
  }

  const openEdit = (item) => {
    setEditRow(item)
    setForm({
      activityName: item.activityName,
      category:     item.category,
      defaultUnit:  item.defaultUnit,
      unitOptions:  item.unitOptions,
      description:  item.description || '',
      sortOrder:    item.sortOrder || '',
    })
    setModal(true)
  }

  const save = async () => {
    if (!form.activityName.trim()) return toast.error('Activity name required')
    setSaving(true)
    try {
      const url    = editRow ? `${BASE}/civil-ext/boq-master/${editRow.id}` : `${BASE}/civil-ext/boq-master`
      const method = editRow ? 'PATCH' : 'POST'
      const r = await fetch(url, { method, headers:hdr(), body:JSON.stringify(form) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(editRow ? '✅ Activity updated!' : `✅ ${d.data.code} added!`)
      setModal(false); load()
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const deactivate = async (item) => {
    if (item.isDefault) return toast.error('System default — deactivate from edit modal')
    if (!confirm(`Deactivate "${item.activityName}"?`)) return
    await fetch(`${BASE}/civil-ext/boq-master/${item.id}`, {
      method:'DELETE', headers:hdr()
    }).then(r => r.json()).then(d => {
      if (d.error) toast.error(d.error)
      else { toast.success('Deactivated'); load() }
    })
  }

  const seedDefaults = async () => {
    setSeeding(true)
    try {
      const r = await fetch(`${BASE}/civil-ext/boq-master/seed-defaults`, { method:'POST', headers:hdr() })
      const d = await r.json()
      toast.success(d.message)
      load()
    } catch { toast.error('Seed failed') }
    finally { setSeeding(false) }
  }

  // Grouped by category
  const grouped = items.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category].push(m)
    return acc
  }, {})

  const catCounts = CATEGORIES.filter(c => c !== 'All').reduce((acc, c) => {
    acc[c] = items.filter(i => i.category === c).length
    return acc
  }, {})

  return (
    <div style={{ background:'#F8F5F8', minHeight:'100vh', fontFamily:'DM Sans,sans-serif' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        background:'#fff', borderBottom:'1px solid #E8E0E8', padding:'10px 16px', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#6E2C00' }}>📐 BOQ Activity Master</div>
          <div style={{ fontSize:11, color:'#aaa', paddingLeft:8, borderLeft:'1px solid #E8E0E8' }}>
            {items.length} activities · Civil → Settings
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={seedDefaults} disabled={seeding}
            style={{ padding:'7px 14px', background:'#FDF2E9', border:'1px solid #6E2C00',
              borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:600, color:'#6E2C00' }}>
            {seeding ? '⏳...' : '🌱 Load Defaults'}
          </button>
          <button onClick={openNew}
            style={{ padding:'7px 18px', background:'#6E2C00', color:'#fff',
              border:'none', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:700 }}>
            + Add Activity
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ padding:'0 0 12px', display:'flex', gap:6, flexWrap:'wrap' }}>
        {CATEGORIES.map(c => {
          const cc = CAT_COLORS[c] || { bg:'#F5F5F5', color:'#555' }
          const cnt = c === 'All' ? items.length : catCounts[c] || 0
          return (
            <button key={c} onClick={() => setFilter(c)}
              style={{ padding:'5px 12px', border:'none', borderRadius:20, cursor:'pointer',
                fontSize:11, fontWeight:700, transition:'all .15s',
                background: filter===c ? '#6E2C00' : cc.bg,
                color: filter===c ? '#fff' : cc.color,
                boxShadow: filter===c ? '0 2px 6px rgba(110,44,0,.3)' : 'none' }}>
              {c} {cnt > 0 && <span style={{ opacity:.7 }}>({cnt})</span>}
            </button>
          )
        })}
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder='🔍 Search activity...'
          style={{ ...inp, width:200, marginLeft:8 }} />
      </div>

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div style={{ textAlign:'center', padding:50, background:'#fff',
          borderRadius:8, border:'1px solid #E8E0E8' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📐</div>
          <div style={{ fontSize:15, fontWeight:700, color:'#6E2C00', marginBottom:8 }}>No BOQ Activities Yet</div>
          <div style={{ fontSize:12, color:'#888', marginBottom:20 }}>
            Load 48 default activities or add your own custom activities
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={seedDefaults} disabled={seeding}
              style={{ padding:'9px 22px', background:'#FDF2E9', border:'1px solid #6E2C00',
                borderRadius:6, cursor:'pointer', fontWeight:700, color:'#6E2C00', fontSize:13 }}>
              🌱 Load 48 Default Activities
            </button>
            <button onClick={openNew}
              style={{ padding:'9px 22px', background:'#6E2C00', color:'#fff',
                border:'none', borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:13 }}>
              + Add Custom
            </button>
          </div>
        </div>
      )}

      {/* Grouped Table View */}
      {!loading && items.length > 0 && filter === 'All' && (
        Object.entries(grouped).map(([cat, catItems]) => {
          const cc = CAT_COLORS[cat] || { bg:'#F5F5F5', color:'#555' }
          return (
            <div key={cat} style={{ background:'#fff', border:'1px solid #E8E0E8',
              borderRadius:8, marginBottom:12, overflow:'hidden' }}>
              <div style={{ background:`linear-gradient(135deg,${cc.color}22,${cc.color}11)`,
                borderBottom:`2px solid ${cc.color}44`,
                padding:'9px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:13, fontWeight:700, color:cc.color }}>
                  {cat}
                </div>
                <div style={{ fontSize:11, color:cc.color, fontWeight:600 }}>
                  {catItems.length} activities
                </div>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#FAFAFA' }}>
                    {['Code','Activity Name','Default Unit','Unit Options','Description','Default',''].map(h=>(
                      <th key={h} style={{ padding:'7px 12px', textAlign:'left',
                        fontSize:10, fontWeight:700, color:'#888', borderBottom:'1px solid #EEE' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, i) => (
                    <tr key={item.id} style={{ background:i%2===0?'#fff':'#FDFCFD',
                      borderBottom:'1px solid #F5F0F5' }}>
                      <td style={{ padding:'8px 12px', fontFamily:'monospace',
                        fontSize:10, color:'#6E2C00', fontWeight:700 }}>{item.code}</td>
                      <td style={{ padding:'8px 12px', fontWeight:600 }}>{item.activityName}</td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ padding:'2px 8px', background:cc.bg, color:cc.color,
                          borderRadius:10, fontSize:10, fontWeight:700 }}>
                          {item.defaultUnit}
                        </span>
                      </td>
                      <td style={{ padding:'8px 12px', color:'#777', fontSize:11 }}>
                        {item.unitOptions?.split(',').map(u => (
                          <span key={u} style={{ padding:'1px 6px', background:'#F0F0F0',
                            color:'#555', borderRadius:8, fontSize:10, marginRight:3 }}>{u}</span>
                        ))}
                      </td>
                      <td style={{ padding:'8px 12px', color:'#888', fontSize:11,
                        maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.description || '—'}
                      </td>
                      <td style={{ padding:'8px 12px', textAlign:'center' }}>
                        {item.isDefault
                          ? <span style={{ fontSize:11, color:'#B8860B' }}>🔒 System</span>
                          : <span style={{ fontSize:11, color:'#1E8449' }}>✏️ Custom</span>}
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => openEdit(item)}
                            style={{ padding:'3px 8px', background:'#EBF5FB', color:'#1A5276',
                              border:'none', borderRadius:4, cursor:'pointer', fontSize:10 }}>✏️</button>
                          <button onClick={() => deactivate(item)}
                            style={{ padding:'3px 8px', background:'#FDEDEC', color:'#C0392B',
                              border:'none', borderRadius:4, cursor:'pointer', fontSize:10,
                              opacity: item.isDefault ? 0.4 : 1 }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })
      )}

      {/* Flat table for filtered view */}
      {!loading && items.length > 0 && filter !== 'All' && (
        <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#6E2C00', color:'#fff' }}>
                {['Code','Activity Name','Category','Default Unit','Unit Options','Description',''].map(h=>(
                  <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const cc = CAT_COLORS[item.category] || { bg:'#F5F5F5', color:'#555' }
                return (
                  <tr key={item.id} style={{ background:i%2===0?'#fff':'#FDF9F7',
                    borderBottom:'1px solid #F5EDE0' }}>
                    <td style={{ padding:'9px 12px', fontFamily:'monospace',
                      fontSize:10, color:'#6E2C00', fontWeight:700 }}>{item.code}</td>
                    <td style={{ padding:'9px 12px', fontWeight:700 }}>{item.activityName}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ padding:'2px 8px', background:cc.bg, color:cc.color,
                        borderRadius:10, fontSize:10, fontWeight:700 }}>{item.category}</span>
                    </td>
                    <td style={{ padding:'9px 12px', fontWeight:700, color:'#6E2C00' }}>{item.defaultUnit}</td>
                    <td style={{ padding:'9px 12px', color:'#777', fontSize:11 }}>
                      {item.unitOptions?.split(',').map(u => (
                        <span key={u} style={{ padding:'1px 6px', background:'#F0F0F0',
                          color:'#555', borderRadius:8, fontSize:10, marginRight:3 }}>{u}</span>
                      ))}
                    </td>
                    <td style={{ padding:'9px 12px', color:'#888', fontSize:11 }}>{item.description||'—'}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => openEdit(item)}
                          style={{ padding:'3px 8px', background:'#EBF5FB', color:'#1A5276',
                            border:'none', borderRadius:4, cursor:'pointer', fontSize:10 }}>✏️</button>
                        <button onClick={() => deactivate(item)}
                          style={{ padding:'3px 8px', background:'#FDEDEC', color:'#C0392B',
                            border:'none', borderRadius:4, cursor:'pointer', fontSize:10 }}>✕</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {modal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0,
          background:'rgba(0,0,0,.6)', zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, width:540,
            boxShadow:'0 16px 48px rgba(0,0,0,.25)', position:'relative', zIndex:10000 }}>

            <div style={{ fontSize:16, fontWeight:800, color:'#6E2C00', marginBottom:18 }}>
              {editRow ? '✏️ Edit BOQ Activity' : '➕ Add BOQ Activity'}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Activity Name *</label>
                <input defaultValue={form.activityName}
                  onBlur={e => set('activityName', e.target.value)}
                  placeholder='e.g. Terrace Waterproofing with APP Membrane'
                  style={inp} />
              </div>

              <div>
                <label style={lbl}>Category *</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} style={inp}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>Default Unit *</label>
                <select value={form.defaultUnit} onChange={e => setUnit(e.target.value)} style={inp}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>

              {/* Unit Options — checkboxes */}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Unit Options (customer can choose from these)</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                  {UNITS.map(u => {
                    const selected = form.unitOptions?.split(',').map(x=>x.trim()).includes(u)
                    return (
                      <button key={u} onClick={() => {
                        const current = form.unitOptions?.split(',').map(x=>x.trim()).filter(Boolean) || []
                        const next = selected
                          ? current.filter(x => x !== u)
                          : [...current, u]
                        set('unitOptions', next.join(','))
                      }}
                        style={{ padding:'4px 10px', border:`1.5px solid ${selected?'#6E2C00':'#DDD'}`,
                          borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:selected?700:400,
                          background:selected?'#FDF2E9':'#fff', color:selected?'#6E2C00':'#888' }}>
                        {u}
                      </button>
                    )
                  })}
                </div>
                <div style={{ fontSize:10, color:'#aaa', marginTop:4 }}>
                  Selected: {form.unitOptions || '—'}
                </div>
              </div>

              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Description / Notes</label>
                <input defaultValue={form.description}
                  onBlur={e => set('description', e.target.value)}
                  placeholder='e.g. Includes formwork, concrete M20, finishing'
                  style={inp} />
              </div>

              <div>
                <label style={lbl}>Sort Order</label>
                <input type='number' defaultValue={form.sortOrder}
                  onBlur={e => set('sortOrder', e.target.value)}
                  placeholder='99' style={inp} />
              </div>

              {editRow?.isDefault && (
                <div style={{ gridColumn:'1/-1', background:'#FEF9E7', borderRadius:6,
                  padding:'8px 12px', fontSize:11, color:'#B8860B' }}>
                  🔒 This is a system default activity. You can edit details but cannot delete it.
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18 }}>
              <button onClick={() => setModal(false)}
                style={{ padding:'7px 18px', background:'#f0f0f0', border:'none',
                  borderRadius:5, cursor:'pointer', fontWeight:600 }}>Cancel</button>
              <button onClick={save} disabled={saving}
                style={{ padding:'7px 22px', background:'#6E2C00', color:'#fff',
                  border:'none', borderRadius:5, cursor:'pointer', fontWeight:700,
                  opacity:saving?.6:1 }}>
                {saving ? '⏳...' : `💾 ${editRow ? 'Update' : 'Save Activity'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
