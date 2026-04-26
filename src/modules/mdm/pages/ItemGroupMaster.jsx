import React, { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const INIT = { code: '', name: '', parentCode: '', parentKind: '', description: '', active: true }

// ── CSS hover inject ───────────────────────────────────────────────────────
if (!document.getElementById('ig-css')) {
  const s = document.createElement('style')
  s.id = 'ig-css'
  s.textContent = `.ig-row:hover { background: #FBF7FA !important; }`
  document.head.appendChild(s)
}

// ── Tree helpers ───────────────────────────────────────────────────────────
// Unified flat list: itemTypes as L1 roots, itemGroups as children
function buildDisplayTree(itemTypes, itemGroups) {
  // Every item group's parent is either an itemType code or another itemGroup code
  const allParentCodes = new Set([
    ...itemTypes.map(t => t.code),
    ...itemGroups.map(g => g.code),
  ])

  // Annotate each group with depth
  const grouped = []
  const processed = new Set()

  // L2: groups whose parentCode is an itemType
  const l2 = itemGroups.filter(g => itemTypes.some(t => t.code === g.parentCode))
  l2.forEach(g => { grouped.push({ ...g, _depth: 1, _parentKind: 'type' }); processed.add(g.code) })

  // L3+: groups whose parentCode is another group
  const addChildren = (parentCode, depth) => {
    itemGroups
      .filter(g => g.parentCode === parentCode && !processed.has(g.code))
      .forEach(g => { grouped.push({ ...g, _depth: depth, _parentKind: 'group' }); processed.add(g.code); addChildren(g.code, depth + 1) })
  }
  l2.forEach(g => addChildren(g.code, 2))

  // Orphans (no parent set yet) — show as L2 ungrouped
  itemGroups.filter(g => !processed.has(g.code)).forEach(g => {
    grouped.push({ ...g, _depth: g.parentCode ? 2 : 1, _parentKind: 'unknown' })
  })

  return grouped
}

function getAllDescendantCodes(itemGroups, code) {
  const set = new Set()
  const collect = c => itemGroups.filter(g => g.parentCode === c).forEach(g => { set.add(g.code); collect(g.code) })
  collect(code)
  return set
}

const LBL = { fontSize: 11, fontWeight: 700, color: '#1C1C1C', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .4 }
const TH  = { padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#6C757D', textAlign: 'left', textTransform: 'uppercase', letterSpacing: .5 }

function InputField({ value, onChange, placeholder, maxLength }) {
  const [f, setF] = useState(false)
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength}
      style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${f ? '#714B67' : '#E0D5E0'}`, borderRadius: 5, fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none', boxSizing: 'border-box' }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  )
}

export default function ItemGroupMaster() {
  const [groups,    setGroups]   = useState([])   // item groups from DB
  const [types,     setTypes]    = useState([])   // item types from DB (L1 parents)
  const [loading,   setLoading]  = useState(true)
  const [saving,    setSaving]   = useState(false)
  const [form,      setForm]     = useState(INIT)
  const [showForm,  setShowForm] = useState(false)
  const [editId,    setEditId]   = useState(null)
  const [search,    setSearch]   = useState('')
  const [expanded,  setExpanded] = useState({})

  // ── Fetch both Item Types (L1) and Item Groups ──────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resG, resT] = await Promise.all([
        fetch(`${BASE_URL}/mdm/item-group`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${BASE_URL}/mdm/item-type`,  { headers: { Authorization: `Bearer ${getToken()}` } }),
      ])
      const [dataG, dataT] = await Promise.all([resG.json(), resT.json()])
      const gList = dataG.data || []
      const tList = dataT.data || []
      setGroups(gList)
      setTypes(tList)
      // Expand all item type "buckets" by default
      const exp = {}
      tList.forEach(t => { exp[`type_${t.code}`] = true })
      gList.forEach(g => { exp[`grp_${g.code}`] = true })
      setExpanded(exp)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Display tree: ItemTypes as section headers, groups indented under them ──
  const displayTree = useMemo(() => buildDisplayTree(types, groups), [types, groups])

  // Search filter
  const searchMode = search.trim().length > 0
  const displayed = searchMode
    ? groups.filter(g =>
        g.code.toLowerCase().includes(search.toLowerCase()) ||
        g.name.toLowerCase().includes(search.toLowerCase())
      ).map(g => ({ ...g, _depth: 0 }))
    : displayTree

  // ── Parent dropdown options ─────────────────────────────────────────────
  // Section 1: All Item Types (L1 — from types master)
  // Section 2: Other Item Groups (excluding self and descendants)
  const { parentTypeOpts, parentGroupOpts } = useMemo(() => {
    let descendants = new Set()
    if (editId) {
      const cur = groups.find(g => g.id === editId)
      if (cur) descendants = getAllDescendantCodes(groups, cur.code)
    }
    const parentTypeOpts  = types.sort((a, b) => a.code.localeCompare(b.code))
    const parentGroupOpts = groups.filter(g => {
      if (editId && g.id === editId) return false   // not self
      if (descendants.has(g.code))   return false   // not descendant
      return true
    })
    return { parentTypeOpts, parentGroupOpts }
  }, [types, groups, editId])

  const totalParentOpts = parentTypeOpts.length + parentGroupOpts.length

  // ── Resolve display name for parentCode ────────────────────────────────
  const resolveParent = (g) => {
    if (!g.parentCode) return null
    const asType  = types.find(t => t.code === g.parentCode)
    if (asType) return { label: asType.name, kind: 'type', badge: '#EDE0EA', color: '#714B67' }
    const asGroup = groups.find(x => x.code === g.parentCode)
    if (asGroup) return { label: asGroup.name, kind: 'group', badge: '#D4EDDA', color: '#155724' }
    return { label: g.parentCode, kind: '?', badge: '#FFF3CD', color: '#856404' }
  }

  // Depth from root (types are L0, groups under types are L1, etc.)
  const depthLabel = (g) => {
    const parent = resolveParent(g)
    if (!parent) return 'L1'
    if (parent.kind === 'type') return 'L2'
    return 'L3+'
  }

  // ── CRUD ──────────────────────────────────────────────────────────────
  const openNew  = () => { setForm(INIT); setEditId(null); setShowForm(true) }
  const openEdit = (g) => { setForm({ ...g, parentCode: g.parentCode || '', parentKind: g.parentKind || '' }); setEditId(g.id); setShowForm(true) }
  const cancel   = () => { setShowForm(false); setForm(INIT); setEditId(null) }

  const save = async () => {
    if (!form.code || !form.name) return toast.error('Code and Name required')
    setSaving(true)
    try {
      const url    = editId ? `${BASE_URL}/mdm/item-group/${editId}` : `${BASE_URL}/mdm/item-group`
      const method = editId ? 'PATCH' : 'POST'
      const payload = {
        code:        form.code.toUpperCase(),
        name:        form.name,
        parentGroup: form.parentCode || '',   // keep backward compat field name
        parentCode:  form.parentCode || '',
        description: form.description,
        active:      form.active,
      }
      const res  = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(editId ? 'Updated' : 'Created')
      cancel(); fetchData()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  // Hierarchy preview in form
  const hierPreview = () => {
    if (!form.parentCode) return <><strong style={{ fontFamily: 'DM Mono,monospace', color: '#714B67' }}>{form.code || '???'}</strong> <span style={{ color: '#999', fontSize: 11 }}>(L1 — no parent set)</span></>
    const asType  = types.find(t => t.code === form.parentCode)
    const asGroup = groups.find(g => g.code === form.parentCode)
    const parentName = asType ? asType.name : asGroup ? asGroup.name : form.parentCode
    const level = asType ? 'L2' : 'L3+'
    return <>
      <span style={{ background: asType ? '#EDE0EA' : '#D4EDDA', color: asType ? '#714B67' : '#155724', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'DM Mono,monospace' }}>{form.parentCode}</span>
      <span style={{ color: '#CCC', margin: '0 5px' }}>›</span>
      <strong style={{ fontFamily: 'DM Mono,monospace', color: '#714B67' }}>{form.code || '???'}</strong>
      <span style={{ marginLeft: 6, background: '#EDE0EA', color: '#714B67', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{level}</span>
    </>
  }

  const childCount = (code) => groups.filter(g => g.parentCode === code || g.parentGroup === code).length

  return (
    <div style={{ padding: 20, background: '#F8F7FA', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#1C1C1C', margin: 0 }}>Item Group Master</h2>
          <p style={{ fontSize: 12, color: '#6C757D', margin: '3px 0 0' }}>
            MDM &rsaquo; Item Group &nbsp;|&nbsp;
            <strong>{groups.length}</strong> groups &middot;
            <strong style={{ color: '#714B67' }}> {types.length}</strong> item types loaded &middot;
            <strong style={{ color: '#155724' }}> {groups.filter(g => g.active).length}</strong> active
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchData} style={{ padding: '7px 14px', background: '#fff', color: '#714B67', border: '1.5px solid #714B67', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Refresh</button>
          <button onClick={openNew}  style={{ padding: '8px 18px', background: '#714B67', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ New Group</button>
        </div>
      </div>

      {/* Hierarchy concept strip */}
      <div style={{ background: '#EDE0EA', borderRadius: 6, padding: '8px 14px', marginBottom: 12, fontSize: 11, color: '#714B67' }}>
        <strong>Hierarchy:</strong>
        {[
          ['Item Type (L1)', '#714B67', '#EDE0EA'],
          ['Item Group (L2)', '#155724', '#D4EDDA'],
          ['Sub Group (L3+)', '#0C5460', '#D1ECF1'],
        ].map(([l, c, b]) => (
          <span key={l} style={{ marginLeft: 10, background: b, color: c, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{l}</span>
        ))}
        <span style={{ marginLeft: 12, color: '#6C757D' }}>{types.length} types · {groups.length} groups in DB</span>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
        <input placeholder="Search code / name..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '7px 12px', border: '1.5px solid #E0D5E0', borderRadius: 5, fontSize: 13, width: 240, fontFamily: 'DM Sans,sans-serif', outline: 'none' }} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 16 }}>&#x2715;</button>}
        <span style={{ fontSize: 12, color: '#6C757D', marginLeft: 'auto' }}>{displayed.length} of {groups.length} groups</span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E0D5E0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8F4F8', borderBottom: '2px solid #E0D5E0' }}>
              {['Group Code', 'Group Name', 'Parent (Type / Group)', 'Level', 'Children', 'Description', 'Status', 'Actions'].map(h => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#6C757D' }}>Loading...</td></tr>
              : displayed.length === 0
              ? <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#6C757D' }}>No groups — click + New Group to add</td></tr>
              : displayed.map((g, i) => {
                  const parent  = resolveParent(g)
                  const lvl     = depthLabel(g)
                  const cnt     = childCount(g.code)
                  const depth   = g._depth || 0

                  return (
                    <tr key={g.id || g.code} className="ig-row"
                      style={{ borderBottom: '1px solid #F0EEF0', background: i % 2 === 0 ? '#fff' : '#FDFBFD' }}
                      onClick={() => openEdit(g)}>

                      {/* Code with indent */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: searchMode ? 0 : depth * 18 }}>
                          {depth > 0 && !searchMode && <span style={{ color: '#CCC', marginRight: 4, fontSize: 12 }}>&#x2514;</span>}
                          <strong style={{ fontFamily: 'DM Mono,monospace', fontSize: 13, color: '#714B67' }}>{g.code}</strong>
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{g.name}</td>

                      {/* Parent — shows type or group badge */}
                      <td style={{ padding: '10px 14px' }}>
                        {parent
                          ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ background: parent.badge, color: parent.color, padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'DM Mono,monospace' }}>
                                {g.parentCode || g.parentGroup}
                              </span>
                              <span style={{ fontSize: 11, color: '#6C757D' }}>{parent.label}</span>
                              <span style={{ fontSize: 10, color: '#999' }}>({parent.kind})</span>
                            </div>
                          : <span style={{ color: '#CCC', fontSize: 11 }}>No parent</span>
                        }
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          background: lvl === 'L2' ? '#D4EDDA' : lvl === 'L3+' ? '#D1ECF1' : '#FFF3CD',
                          color:      lvl === 'L2' ? '#155724' : lvl === 'L3+' ? '#0C5460' : '#856404',
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700
                        }}>{lvl}</span>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {cnt > 0
                          ? <span style={{ background: '#EDE0EA', color: '#714B67', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, fontFamily: 'DM Mono,monospace' }}>{cnt}</span>
                          : <span style={{ color: '#DDD' }}>—</span>}
                      </td>

                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#6C757D', maxWidth: 160 }}>{g.description || '—'}</td>

                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: g.active ? '#D4EDDA' : '#F8D7DA', color: g.active ? '#155724' : '#721C24' }}>
                          {g.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(g)} style={{ padding: '4px 12px', background: '#714B67', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Edit</button>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 10, width: 520, boxShadow: '0 20px 60px rgba(0,0,0,.25)', overflow: 'hidden' }}>

            <div style={{ background: '#714B67', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#fff', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, margin: 0 }}>
                {editId ? 'Edit Item Group' : 'New Item Group'}
              </h3>
              <span onClick={cancel} style={{ color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: 20 }}>&#x2715;</span>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>Group Code *</label>
                  <InputField value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. RM-CON" maxLength={15} />
                </div>
                <div>
                  <label style={LBL}>
                    Parent Group
                    <span style={{ fontWeight: 400, marginLeft: 4, textTransform: 'none', fontSize: 10, color: '#999' }}>
                      ({totalParentOpts} available — types + groups)
                    </span>
                  </label>

                  {/* ── Dropdown with optgroup: Item Types + Item Groups ── */}
                  <ParentSelect
                    value={form.parentCode}
                    onChange={v => setForm(f => ({ ...f, parentCode: v }))}
                    typeOpts={parentTypeOpts}
                    groupOpts={parentGroupOpts}
                  />
                </div>
              </div>

              <div>
                <label style={LBL}>Group Name *</label>
                <InputField value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cotton Consumables" />
              </div>

              <div>
                <label style={LBL}>Description</label>
                <InputField value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
              </div>

              {/* Live hierarchy preview */}
              <div style={{ background: '#F8F4F8', borderRadius: 6, padding: '10px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#714B67', marginRight: 4 }}>Hierarchy:</span>
                {hierPreview()}
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
                {saving ? 'Saving...' : 'Save Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ParentSelect — optgroup dropdown ──────────────────────────────────────
function ParentSelect({ value, onChange, typeOpts, groupOpts }) {
  const [f, setF] = useState(false)
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${f ? '#714B67' : '#E0D5E0'}`, borderRadius: 5, fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}>
      <option value=''>— None (Root Level) —</option>

      {/* Section 1: Item Types — loaded from /mdm/item-type */}
      {typeOpts.length > 0 && (
        <optgroup label={`── Item Types (L1) — ${typeOpts.length} types ──`}>
          {typeOpts.map(t => (
            <option key={`type_${t.code}`} value={t.code}>
              {t.code} — {t.name} {t.category ? `(${t.category})` : ''}
            </option>
          ))}
        </optgroup>
      )}

      {/* Section 2: Other Item Groups — sub-groups */}
      {groupOpts.length > 0 && (
        <optgroup label={`── Item Groups (L2+) — ${groupOpts.length} groups ──`}>
          {groupOpts.map(g => (
            <option key={`grp_${g.code}`} value={g.code}>
              {g.parentCode ? `  └ ${g.code}` : g.code} — {g.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  )
}
