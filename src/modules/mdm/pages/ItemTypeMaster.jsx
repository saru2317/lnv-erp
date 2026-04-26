import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const INIT       = { code: '', name: '', category: '', valuationMethod: '', description: '', active: true }
const CATEGORIES = ['Inventory', 'Non-Inventory', 'Service', 'Asset', 'Expense']
const VALUATIONS = ['FIFO', 'LIFO', 'Weighted Average', 'Standard Cost', 'Moving Average']

const CAT_COLOR = { Inventory: ['#D4EDDA','#155724'], 'Non-Inventory': ['#FFF3CD','#856404'], Service: ['#D1ECF1','#0C5460'], Asset: ['#EDE0EA','#714B67'], Expense: ['#F8D7DA','#721C24'] }

const VAL_HINT = {
  'Weighted Average': 'Running average recalculated on each GRN — SAP MAP (Moving Avg Price)',
  'Moving Average':   'Same as Weighted Average, updated per GRN receipt',
  'Standard Cost':    'Fixed price per item — variances posted to separate account (SAP S-Price)',
  'FIFO':             'First In First Out — oldest stock cost consumed first',
  'LIFO':             'Last In First Out — not allowed under IFRS/Ind-AS',
}

const LBL = { fontSize: 11, fontWeight: 700, color: '#1C1C1C', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .4 }
const TH  = { padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#6C757D', textAlign: 'left', textTransform: 'uppercase', letterSpacing: .5 }

// ── Inject CSS hover once — NO onMouseEnter/Leave inline handlers ──────────
const STYLE_ID = 'it-hover-style'
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `.it-row { cursor: pointer; transition: background .1s; } .it-row:hover { background: #FBF7FA !important; }`
  document.head.appendChild(s)
}

function InputField({ value, onChange, placeholder, maxLength }) {
  const [f, setF] = useState(false)
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength}
      style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${f ? '#714B67' : '#E0D5E0'}`, borderRadius: 5, fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none', boxSizing: 'border-box' }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  )
}
function SelectField({ value, onChange, children, style = {} }) {
  const [f, setF] = useState(false)
  return (
    <select value={value} onChange={onChange}
      style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${f ? '#714B67' : '#E0D5E0'}`, borderRadius: 5, fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none', cursor: 'pointer', boxSizing: 'border-box', ...style }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}>
      {children}
    </select>
  )
}

export default function ItemTypeMaster() {
  const [rows,      setRows]     = useState([])
  const [loading,   setLoading]  = useState(true)
  const [saving,    setSaving]   = useState(false)
  const [form,      setForm]     = useState(INIT)
  const [showForm,  setShowForm] = useState(false)
  const [editId,    setEditId]   = useState(null)
  const [search,    setSearch]   = useState('')
  const [catFilter, setCatFilter]= useState('All')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/mdm/item-type`, { headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setRows(data.data || [])
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = rows.filter(r => {
    const mc = catFilter === 'All' || r.category === catFilter
    const ms = !search || r.code.toLowerCase().includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase())
    return mc && ms
  })

  const openNew  = () => { setForm(INIT); setEditId(null); setShowForm(true) }
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.id); setShowForm(true) }
  const cancel   = () => { setShowForm(false); setForm(INIT); setEditId(null) }
  const fSet     = k  => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.code || !form.name) return toast.error('Code and Name required')
    setSaving(true)
    try {
      const url    = editId ? `${BASE_URL}/mdm/item-type/${editId}` : `${BASE_URL}/mdm/item-type`
      const method = editId ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...form, code: form.code.toUpperCase() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(editId ? 'Updated' : 'Created')
      cancel(); fetchData()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const catCounts = CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: rows.filter(r => r.category === c).length }), {})

  return (
    <div style={{ padding: 20, background: '#F8F7FA', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#1C1C1C', margin: 0 }}>Item Type Master</h2>
          <p style={{ fontSize: 12, color: '#6C757D', margin: '3px 0 0' }}>
            MDM &rsaquo; Item Type &nbsp;|&nbsp;
            <strong>{rows.length}</strong> types &middot;
            <strong style={{ color: '#155724' }}> {rows.filter(r => r.active).length}</strong> active
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchData}
            style={{ padding: '7px 14px', background: '#fff', color: '#714B67', border: '1.5px solid #714B67', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Refresh
          </button>
          <button onClick={openNew}
            style={{ padding: '8px 18px', background: '#714B67', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + New Type
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['All', ...CATEGORIES].map(c => {
          const active = catFilter === c
          return (
            <div key={c} onClick={() => setCatFilter(c)} style={{
              padding: '4px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              border: '1.5px solid', userSelect: 'none',
              borderColor: active ? '#714B67' : '#E0D5E0',
              background:  active ? '#714B67' : '#fff',
              color:        active ? '#fff'    : '#6C757D',
            }}>
              {c} <span style={{ opacity: .75 }}>{c === 'All' ? rows.length : catCounts[c] || 0}</span>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <input placeholder="Search code / name..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '7px 12px', border: '1.5px solid #E0D5E0', borderRadius: 5, fontSize: 13, width: 240, fontFamily: 'DM Sans,sans-serif', outline: 'none' }} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 16 }}>&#x2715;</button>}
        <span style={{ fontSize: 12, color: '#6C757D', marginLeft: 'auto' }}>{filtered.length} of {rows.length}</span>
      </div>

      {/* Table — NO onMouseEnter/Leave on rows, hover handled by CSS class .it-row:hover */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E0D5E0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8F4F8', borderBottom: '2px solid #E0D5E0' }}>
              {['Type Code','Type Name','Category','Valuation Method','Description','Status','Actions'].map(h => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#6C757D' }}>Loading...</td></tr>
              : filtered.length === 0
              ? <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#6C757D' }}>No types found</td></tr>
              : filtered.map((r, i) => {
                  const [catBg, catFg] = CAT_COLOR[r.category] || ['#EEE','#333']
                  return (
                    // ✅ CSS class hover only — no inline DOM mutation
                    <tr key={r.id} className="it-row"
                      style={{ borderBottom: '1px solid #F0EEF0', background: i % 2 === 0 ? '#fff' : '#FDFBFD' }}
                      onClick={() => openEdit(r)}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#714B67', fontFamily: 'DM Mono,monospace' }}>{r.code}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: catBg, color: catFg }}>
                          {r.category || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#6C757D' }}>{r.valuationMethod || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#6C757D', maxWidth: 200 }}>{r.description || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                          background: r.active ? '#D4EDDA' : '#F8D7DA', color: r.active ? '#155724' : '#721C24' }}>
                          {r.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(r)}
                          style={{ padding: '4px 12px', background: '#714B67', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 10, width: 500, boxShadow: '0 20px 60px rgba(0,0,0,.25)', overflow: 'hidden' }}>

            <div style={{ background: '#714B67', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#fff', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, margin: 0 }}>
                {editId ? 'Edit Item Type' : 'New Item Type'}
              </h3>
              <span onClick={cancel} style={{ color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: 20 }}>&#x2715;</span>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>Type Code *</label>
                  <InputField value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. FG" maxLength={10} />
                </div>
                <div>
                  <label style={LBL}>Category</label>
                  <SelectField value={form.category} onChange={fSet('category')}>
                    <option value=''>Select Category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </SelectField>
                </div>
              </div>

              <div>
                <label style={LBL}>Type Name *</label>
                <InputField value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Finished Goods" />
              </div>

              <div>
                <label style={LBL}>Valuation Method</label>
                <SelectField value={form.valuationMethod} onChange={fSet('valuationMethod')}>
                  <option value=''>Select Method</option>
                  {VALUATIONS.map(v => <option key={v}>{v}</option>)}
                </SelectField>
                {form.valuationMethod && VAL_HINT[form.valuationMethod] && (
                  <div style={{ marginTop: 6, background: '#F8F4F8', borderRadius: 5, padding: '6px 10px', fontSize: 11, color: '#714B67' }}>
                    {VAL_HINT[form.valuationMethod]}
                  </div>
                )}
              </div>

              <div>
                <label style={LBL}>Description</label>
                <InputField value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type='checkbox' checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  style={{ accentColor: '#714B67', width: 15, height: 15 }} />
                <span style={{ fontSize: 13 }}>Active</span>
              </label>
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #E0D5E0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#F8F7FA' }}>
              <button onClick={cancel} style={{ padding: '8px 18px', background: '#fff', color: '#6C757D', border: '1.5px solid #E0D5E0', borderRadius: 5, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving}
                style={{ padding: '8px 18px', background: '#714B67', color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
                {saving ? 'Saving...' : 'Save Type'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
