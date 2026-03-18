import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ITEMS, INDUSTRIES, PRODUCTION_TYPES, calcShotOutput } from './_ppConfig'

export default function ItemRouting() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const initId = params.get('id') || ITEMS[0]?.id

  const [selItemId, setSelItemId] = useState(initId)
  const [itemRoutes, setItemRoutes] = useState(() => {
    const map = {}
    ITEMS.forEach(item => {
      const ind = INDUSTRIES[item.industry]
      map[item.id] = (ind?.stages || []).map((s, i) => ({
        ...s, order: i + 1, active: true, mandatory: true, wcOverride: s.machine
      }))
    })
    return map
  })
  const [dragIdx, setDragIdx]   = useState(null)
  const [saved, setSaved]       = useState({})
  const [search, setSearch]     = useState('')

  const item    = ITEMS.find(i => i.id === selItemId)
  const ind     = item ? INDUSTRIES[item.industry] : null
  const route   = itemRoutes[selItemId] || []
  const pt      = item ? PRODUCTION_TYPES[item.prodType] : null

  const filteredItems = ITEMS.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase())
  )

  // Drag handlers
  const onDragStart = i => setDragIdx(i)
  const onDragOver  = e => e.preventDefault()
  const onDrop      = (e, dropIdx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === dropIdx) return
    const newRoute = [...route]
    const [moved]  = newRoute.splice(dragIdx, 1)
    newRoute.splice(dropIdx, 0, moved)
    const reordered = newRoute.map((s, i) => ({ ...s, order: i + 1 }))
    setItemRoutes(r => ({ ...r, [selItemId]: reordered }))
    setDragIdx(null)
  }

  const toggleStage = idx => {
    const newR = route.map((s, i) => i === idx ? { ...s, active: !s.active } : s)
    setItemRoutes(r => ({ ...r, [selItemId]: newR }))
  }

  const toggleMandatory = idx => {
    const newR = route.map((s, i) => i === idx ? { ...s, mandatory: !s.mandatory } : s)
    setItemRoutes(r => ({ ...r, [selItemId]: newR }))
  }

  const setWC = (idx, val) => {
    const newR = route.map((s, i) => i === idx ? { ...s, wcOverride: val } : s)
    setItemRoutes(r => ({ ...r, [selItemId]: newR }))
  }

  const handleSave = () => {
    setSaved(s => ({ ...s, [selItemId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [selItemId]: false })), 2000)
  }

  const resetRoute = () => {
    const stages = (ind?.stages || []).map((s, i) => ({
      ...s, order: i + 1, active: true, mandatory: true, wcOverride: s.machine
    }))
    setItemRoutes(r => ({ ...r, [selItemId]: stages }))
  }

  const activeCount = route.filter(s => s.active).length
  const shotInfo    = item?.prodType === 'mould' && item?.cavity
    ? calcShotOutput(1000, item.cavity) : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>

      {/* LEFT — Item selector */}
      <div className="fi-panel" style={{ height: 'fit-content' }}>
        <div className="fi-panel-hdr" style={{ padding: '10px 14px' }}>
          <h3 style={{ margin: 0, fontSize: '12px' }}>📦 Select Item</h3>
        </div>
        <div style={{ padding: '8px' }}>
          <input className="sd-search" placeholder="🔍 Search…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: '100%', marginBottom: '8px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '500px', overflow: 'auto' }}>
            {filteredItems.map(it => {
              const iind = INDUSTRIES[it.industry]
              return (
                <div key={it.id} onClick={() => setSelItemId(it.id)}
                  style={{ padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', transition: 'all .15s',
                    border: '1px solid', borderColor: it.id === selItemId ? 'var(--odoo-purple)' : 'var(--odoo-border)',
                    background: it.id === selItemId ? '#EDE0EA' : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{iind?.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: it.id === selItemId ? 'var(--odoo-purple)' : 'var(--odoo-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--odoo-gray)', fontFamily: 'DM Mono,monospace' }}>{it.code}</div>
                    </div>
                    {saved[it.id] && <span style={{ fontSize: '10px', color: 'var(--odoo-green)' }}>✓</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* RIGHT — Route editor */}
      <div>
        {item ? (
          <>
            {/* Item header */}
            <div className="fi-panel" style={{ marginBottom: '14px' }}>
              <div className="fi-panel-body" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{ind?.icon}</span>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '15px' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--odoo-gray)', fontFamily: 'DM Mono,monospace' }}>{item.code} · {item.uom}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <span style={{ padding: '2px 7px', background: ind?.light, color: ind?.color, borderRadius: '8px', fontSize: '10px', fontWeight: '700' }}>{ind?.name}</span>
                        <span style={{ padding: '2px 7px', background: '#EDE0EA', color: 'var(--odoo-purple)', borderRadius: '8px', fontSize: '10px', fontWeight: '700' }}>{pt?.icon} {pt?.label}</span>
                        <span style={{ padding: '2px 7px', background: '#E8F5E9', color: '#2E7D32', borderRadius: '8px', fontSize: '10px', fontWeight: '700' }}>{activeCount} active stages</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-s sd-bsm" onClick={resetRoute}>↺ Reset</button>
                    <button className="btn btn-p btn-s" onClick={handleSave}>
                      {saved[selItemId] ? '✓ Saved!' : '💾 Save Route'}
                    </button>
                  </div>
                </div>

                {/* Mould info */}
                {item.prodType === 'mould' && item.cavity && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: '#FFF3CD', borderRadius: '6px', display: 'flex', gap: '20px', fontSize: '12px' }}>
                    <span>💉 <strong>Mould:</strong> {item.mouldId || '—'}</span>
                    <span>🔲 <strong>Cavity:</strong> {item.cavity}</span>
                    <span>📊 <strong>1000 pcs =</strong> {Math.ceil(1000 / item.cavity)} shots</span>
                    <span style={{ color: 'var(--odoo-gray)' }}>Output per shot = {item.cavity} pcs</span>
                  </div>
                )}
                {item.prodType === 'batch' && item.batchCapacity && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: '#E3F2FD', borderRadius: '6px', fontSize: '12px' }}>
                    🪣 <strong>Batch Capacity:</strong> {item.batchCapacity} {item.uom}/batch &nbsp;·&nbsp;
                    Multiple job cards can be clubbed into one batch up to this capacity.
                  </div>
                )}
              </div>
            </div>

            {/* Drag instructions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '11px', color: 'var(--odoo-gray)' }}>
              <span>🖱️ Drag stages to reorder · Toggle ✓/✗ to activate/skip · Set WC override per stage</span>
            </div>

            {/* Stage rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {route.map((stage, idx) => (
                <div key={stage.id + idx}
                  draggable onDragStart={() => onDragStart(idx)} onDragOver={onDragOver} onDrop={e => onDrop(e, idx)}
                  style={{ display: 'grid', gridTemplateColumns: '32px 36px 1fr 160px 80px 80px', gap: '8px', alignItems: 'center',
                    padding: '10px 14px', borderRadius: '8px', transition: 'all .15s', cursor: 'grab',
                    background: stage.active ? '#fff' : '#F5F5F5',
                    border: '1px solid', borderColor: stage.active ? 'var(--odoo-border)' : '#DDD',
                    opacity: stage.active ? 1 : 0.55,
                    boxShadow: dragIdx === idx ? '0 4px 12px rgba(113,75,103,.25)' : 'none' }}>

                  {/* Drag handle + order */}
                  <div style={{ textAlign: 'center', color: 'var(--odoo-gray)', fontSize: '13px', cursor: 'grab' }}>⠿</div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px',
                      borderRadius: '50%', background: stage.active ? 'var(--odoo-purple)' : '#CCC', color: '#fff', fontSize: '10px', fontWeight: '700' }}>
                      {idx + 1}
                    </span>
                  </div>

                  {/* Stage info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{stage.icon}</span>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '12px', color: stage.active ? 'var(--odoo-text)' : 'var(--odoo-gray)' }}>{stage.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--odoo-gray)' }}>{stage.fields?.length || 0} fields · {stage.desc}</div>
                    </div>
                  </div>

                  {/* WC override */}
                  <input value={stage.wcOverride || ''} onChange={e => setWC(idx, e.target.value)}
                    placeholder="Work Centre…"
                    style={{ padding: '4px 8px', border: '1px solid var(--odoo-border)', borderRadius: '4px', fontSize: '11px', background: stage.active ? '#fff' : '#F0F0F0' }} />

                  {/* Mandatory toggle */}
                  <div style={{ textAlign: 'center' }}>
                    <button onClick={() => toggleMandatory(idx)}
                      style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '10px', fontWeight: '700',
                        background: stage.mandatory ? '#E8F5E9' : '#FFF3E0',
                        color: stage.mandatory ? '#2E7D32' : '#E65100',
                        borderColor: stage.mandatory ? '#A5D6A7' : '#FFCC80' }}>
                      {stage.mandatory ? '🔒 Must' : '⚡ Skip'}
                    </button>
                  </div>

                  {/* Active toggle */}
                  <div style={{ textAlign: 'center' }}>
                    <button onClick={() => toggleStage(idx)}
                      style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '10px', fontWeight: '700',
                        background: stage.active ? '#EDE0EA' : '#F5F5F5',
                        color: stage.active ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
                        borderColor: stage.active ? 'var(--odoo-purple)' : '#DDD' }}>
                      {stage.active ? '✓ Active' : '✗ Off'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Flow preview */}
            <div style={{ marginTop: '14px', padding: '12px 14px', background: '#F8F9FA', borderRadius: '8px', border: '1px solid var(--odoo-border)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--odoo-gray)', marginBottom: '8px' }}>🗺️ PRODUCTION FLOW PREVIEW</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', alignItems: 'center' }}>
                {route.filter(s => s.active).map((s, i, arr) => (
                  <React.Fragment key={s.id + i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px',
                      background: s.mandatory ? 'var(--odoo-purple)' : 'var(--odoo-orange)',
                      color: '#fff', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                      <span>{s.icon}</span> {s.name}
                    </div>
                    {i < arr.length - 1 && <span style={{ fontSize: '14px', color: 'var(--odoo-gray)', padding: '0 4px' }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--odoo-gray)' }}>
                🟣 Mandatory &nbsp;·&nbsp; 🟠 Optional/Skippable
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--odoo-gray)' }}>Select an item to configure its route</div>
        )}
      </div>
    </div>
  )
}
