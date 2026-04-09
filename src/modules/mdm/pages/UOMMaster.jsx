import React, { useState, useEffect } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const INIT     = { code:'', name:'', symbol:'', type:'', decimals:'2', active:true, description:'' }
const UOM_TYPES = ['Length','Weight','Volume','Area','Count','Time','Temperature','Other']

export default function UOMMaster() {
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [form,       setForm]       = useState(INIT)
  const [showForm,   setShowForm]   = useState(false)
  const [editId,     setEditId]     = useState(null)
  const [search,     setSearch]     = useState('')
  const [filterType, setFilterType] = useState('All')

  // ── Fetch from backend ──────────────────────────────────
  const fetchUOMs = async () => {
    try {
      setLoading(true)
      setError('')
      const res  = await fetch(`${BASE_URL}/mdm/uom`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setRows(data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUOMs() }, [])

  // ── Filter ──────────────────────────────────────────────
  const filtered = rows.filter(r =>
    (filterType === 'All' || r.type === filterType) &&
    (r.code.toLowerCase().includes(search.toLowerCase()) ||
     r.name.toLowerCase().includes(search.toLowerCase()))
  )

  // ── CRUD ────────────────────────────────────────────────
  const openNew  = () => { setForm(INIT); setEditId(null); setShowForm(true) }
  const openEdit = (r) => { setForm({...r, decimals: String(r.decimals)}); setEditId(r.id); setShowForm(true) }
  const cancel   = () => { setShowForm(false); setForm(INIT); setEditId(null) }

  const save = async () => {
    if (!form.code || !form.name || !form.symbol) {
      alert('Code, Name and Symbol are required!'); return
    }
    setSaving(true)
    try {
      const url    = editId ? `${BASE_URL}/mdm/uom/${editId}` : `${BASE_URL}/mdm/uom`
      const method = editId ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ ...form, code: form.code.toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      if (editId) {
        setRows(rows.map(r => r.id === editId ? data.data : r))
      } else {
        setRows([...rows, data.data])
      }
      cancel()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (id) => {
    const row = rows.find(r => r.id === id)
    try {
      await fetch(`${BASE_URL}/mdm/uom/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ active: !row.active }),
      })
      setRows(rows.map(r => r.id === id ? {...r, active: !r.active} : r))
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const inp = (field) => ({
    value: form[field] ?? '',
    onChange: e => setForm(f => ({...f, [field]: e.target.value})),
    style: { width:'100%', padding:'8px 10px', border:'1.5px solid #E0D5E0',
      borderRadius:5, fontSize:13, fontFamily:'DM Sans,sans-serif',
      outline:'none', boxSizing:'border-box' },
    onFocus: e => e.target.style.borderColor='#714B67',
    onBlur:  e => e.target.style.borderColor='#E0D5E0',
  })

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            Unit of Measure Master
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            MDM › Unit of Measure &nbsp;|&nbsp; {rows.length} UOMs configured
            {error && <span style={{ color:'#D9534F', marginLeft:8 }}>⚠️ {error}</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={fetchUOMs} style={{ padding:'8px 14px', background:'#fff',
            color:'#714B67', border:'1.5px solid #714B67', borderRadius:6,
            fontSize:12, fontWeight:600, cursor:'pointer' }}>
            🔄 Refresh
          </button>
          <button onClick={openNew} style={{ padding:'8px 18px', background:'#714B67',
            color:'#fff', border:'none', borderRadius:6, fontSize:13,
            fontWeight:700, cursor:'pointer' }}>
            + New UOM
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:14, alignItems:'center' }}>
        <input placeholder="Search code / name..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding:'7px 12px', border:'1.5px solid #E0D5E0', borderRadius:5,
            fontSize:13, width:220, fontFamily:'DM Sans,sans-serif', outline:'none' }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding:'7px 12px', border:'1.5px solid #E0D5E0', borderRadius:5,
            fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', cursor:'pointer' }}>
          <option>All</option>
          {UOM_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <span style={{ fontSize:12, color:'#6C757D', marginLeft:'auto' }}>
          Showing {filtered.length} of {rows.length}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'1px solid #E0D5E0' }}>
          ⏳ Loading UOMs from server...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
                {['Code','Name','Symbol','Type','Decimals','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ borderBottom:'1px solid #F0EEF0',
                  background: i%2===0 ? '#fff' : '#FDFBFD' }}
                  onMouseEnter={e => e.currentTarget.style.background='#FBF7FA'}
                  onMouseLeave={e => e.currentTarget.style.background= i%2===0?'#fff':'#FDFBFD'}>
                  <td style={{ padding:'10px 14px', fontSize:13, fontWeight:700,
                    color:'#714B67', fontFamily:'DM Mono,monospace' }}>{r.code}</td>
                  <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600 }}>{r.name}</td>
                  <td style={{ padding:'10px 14px', fontSize:13,
                    fontFamily:'DM Mono,monospace', color:'#6C757D' }}>{r.symbol}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ padding:'3px 9px', borderRadius:10, fontSize:11, fontWeight:600,
                      background:'#EDE0EA', color:'#714B67' }}>{r.type || '—'}</span>
                  </td>
                  <td style={{ padding:'10px 14px', fontSize:13,
                    fontFamily:'DM Mono,monospace', textAlign:'center' }}>{r.decimals}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <span onClick={() => toggleActive(r.id)} style={{
                      padding:'3px 9px', borderRadius:10, fontSize:11, fontWeight:600, cursor:'pointer',
                      background: r.active ? '#D4EDDA' : '#F8D7DA',
                      color: r.active ? '#155724' : '#721C24'
                    }}>{r.active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    <button onClick={() => openEdit(r)} style={{ padding:'4px 12px',
                      background:'#714B67', color:'#fff', border:'none',
                      borderRadius:4, fontSize:12, cursor:'pointer' }}>Edit</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding:32, textAlign:'center',
                  color:'#6C757D', fontSize:13 }}>
                  {error ? '❌ Failed to load data' : 'No UOMs found'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'#fff', borderRadius:10, width:480,
            boxShadow:'0 20px 60px rgba(0,0,0,.2)', overflow:'hidden' }}>
            <div style={{ background:'#714B67', padding:'14px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ color:'#fff', fontFamily:'Syne,sans-serif',
                fontSize:15, fontWeight:700, margin:0 }}>
                {editId ? 'Edit UOM' : 'New Unit of Measure'}
              </h3>
              <span onClick={cancel} style={{ color:'rgba(255,255,255,.7)',
                cursor:'pointer', fontSize:18 }}>✕</span>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#1C1C1C',
                    display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>
                    UOM Code *
                  </label>
                  <input {...inp('code')} placeholder="e.g. KG" maxLength={10} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#1C1C1C',
                    display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>
                    Symbol *
                  </label>
                  <input {...inp('symbol')} placeholder="e.g. kg" maxLength={10} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#1C1C1C',
                  display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>
                  UOM Name *
                </label>
                <input {...inp('name')} placeholder="e.g. Kilogram" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#1C1C1C',
                    display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>
                    Type
                  </label>
                  <select {...inp('type')} style={{ ...inp('type').style, cursor:'pointer' }}>
                    <option value=''>Select Type</option>
                    {UOM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#1C1C1C',
                    display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>
                    Decimal Places
                  </label>
                  <select {...inp('decimals')} style={{ ...inp('decimals').style, cursor:'pointer' }}>
                    {['0','1','2','3','4'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#1C1C1C',
                  display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>
                  Description
                </label>
                <input {...inp('description')} placeholder="Optional description" />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type='checkbox' checked={form.active}
                  onChange={e => setForm(f => ({...f, active: e.target.checked}))}
                  style={{ accentColor:'#714B67', width:15, height:15 }} />
                <label style={{ fontSize:13, color:'#1C1C1C', cursor:'pointer' }}>Active</label>
              </div>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
              display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
              <button onClick={cancel} style={{ padding:'8px 18px', background:'#fff',
                color:'#6C757D', border:'1.5px solid #E0D5E0', borderRadius:5,
                fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:'8px 18px',
                background: saving ? '#9E7D96' : '#714B67', color:'#fff',
                border:'none', borderRadius:5, fontSize:13, fontWeight:700,
                cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? '⏳ Saving...' : '💾 Save UOM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
