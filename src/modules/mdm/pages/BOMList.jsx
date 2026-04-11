import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE_URL  = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken  = () => localStorage.getItem('lnv_token')
const authHdrs  = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

const BLANK_BOM  = { bomNo:'', itemCode:'', itemName:'', revision:'A', uom:'Nos', baseQty:'1', isPrimary:true, altBom:'1', plant:'MAIN' }
const autoGenBomNo = () => `BOM-${new Date().getFullYear().toString().slice(-2)}${String(Date.now()).slice(-5)}`
const BLANK_LINE = { itemId:'', itemCode:'', itemName:'', qty:'1', uom:'Nos', wastage:'0', ict:'L', asm:false, sls:false, validFrom:'', validTo:'', remarks:'' }
const BLANK_BYPRODUCT = { _id:'', itemId:'', itemCode:'', itemName:'', qty:'', uom:'Nos', recoveryPct:'100', unitPrice:'0', remarks:'' }

// ── Tree node component ───────────────────────────────────
function TreeNode({ line, depth=0, items }) {
  const [open, setOpen] = useState(true)
  const children = items.filter(i => i.parentId === line.id)
  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px',
        background: depth===0 ? '#F8F4F8' : depth===1 ? '#F0F8F0' : '#FFF8F0',
        borderLeft: `3px solid ${depth===0?'#714B67':depth===1?'#28A745':'#FFC107'}`,
        borderRadius:4, marginBottom:3, cursor: children.length?'pointer':'default' }}
        onClick={() => children.length && setOpen(o => !o)}>
        {/* Sub-BOM indicator */}
        {children.length > 0 && (
          <span style={{ fontSize:10, color:'#714B67', fontWeight:700 }}>{open ? '▼' : '▶'}</span>
        )}
        <span style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:'#714B67', fontWeight:700, minWidth:80 }}>
          {line.item?.code || line.itemCode}
        </span>
        <span style={{ fontSize:12, fontWeight:600, flex:1 }}>{line.item?.name || line.itemName}</span>
        <span style={{ fontSize:11, color:'#6C757D', minWidth:60, textAlign:'right' }}>
          {line.qty} {line.item?.uom || 'Nos'}
        </span>
        {+line.wastage > 0 && (
          <span style={{ fontSize:10, background:'#FFF3CD', color:'#856404',
            padding:'1px 6px', borderRadius:10 }}>+{line.wastage}% waste</span>
        )}
        {line.remarks && (
          <span style={{ fontSize:10, color:'#6C757D', fontStyle:'italic' }}>({line.remarks})</span>
        )}
      </div>
      {open && children.map(c => <TreeNode key={c.id} line={c} depth={depth+1} items={items} />)}
    </div>
  )
}

// ── BOM Form (New/Edit) ───────────────────────────────────
function BOMForm({ bom, items, onSave, onCancel }) {
  const isEdit = !!bom?.id
  const [form,  setForm]  = useState(bom ? bom : { ...BLANK_BOM, bomNo: autoGenBomNo() })
  const [lines,      setLines]      = useState(bom?.lines || [])
  const [byproducts, setByproducts] = useState(bom?.byproducts || [])
  const [activeTab,  setActiveTab]  = useState('components')
  const [saving,     setSaving]     = useState(false)

  const addBP  = () => setByproducts(b => [...b, { ...BLANK_BYPRODUCT, _id: Date.now() }])
  const delBP  = (id) => setByproducts(b => b.filter(x => x._id !== id))
  const updBP  = (id, key, val) => setByproducts(b => b.map(x => {
    if (x._id !== id) return x
    const updated = { ...x, [key]: val }
    if (key === 'itemId') {
      const found = items.find(it => String(it.id) === String(val))
      if (found) { updated.itemCode = found.code; updated.itemName = found.name; updated.uom = found.uom }
    }
    return updated
  }))

  // Auto-calculate scrap value per byproduct
  const scrapValue = (bp) => {
    const qty   = parseFloat(bp.qty)       || 0
    const price = parseFloat(bp.unitPrice) || 0
    const rec   = parseFloat(bp.recoveryPct) / 100 || 0
    return (qty * price * rec).toFixed(2)
  }
  const totalScrapValue = byproducts.reduce((s, bp) => s + parseFloat(scrapValue(bp)), 0).toFixed(2)
  const [itemSearch, setItemSearch] = useState('')

  const addLine = () => setLines(l => [...l, { ...BLANK_LINE, _id: Date.now() }])
  const delLine = (idx) => setLines(l => l.filter((_, i) => i !== idx))
  const updLine = (idx, key, val) => setLines(l => l.map((r, i) => {
    if (i !== idx) return r
    const updated = { ...r, [key]: val }
    // Auto-fill item details when itemId selected
    if (key === 'itemId') {
      const found = items.find(it => String(it.id) === String(val))
      if (found) {
        updated.itemCode = found.code
        updated.itemName = found.name
        updated.uom      = found.uom
      }
    }
    return updated
  }))

  // Auto-generate BOM No
  const genBomNo = () => {
    const rev  = form.revision || 'A'
    const code = form.itemCode || autoGenBomNo()
    setForm(f => ({ ...f, bomNo: `BOM-${code}-${rev}` }))
  }

  const save = async () => {
    if (!form.bomNo || !form.itemCode || !form.itemName)
      return toast.error('BOM No, Item Code and Item Name required!')
    if (lines.length === 0)
      return toast.error('Add at least one component!')
    const invalidLine = lines.find(l => !l.itemId || l.qty === '' || l.qty === null || l.qty === undefined)
    if (invalidLine)
      return toast.error('All component lines need an Item selected!')
    setSaving(true)
    try {
      const payload = {
        ...form,
        lines: lines.map(l => ({
          itemId:  l.itemId,
          qty:     l.qty,
          wastage: l.wastage || 0,
          remarks: l.remarks || '',
        })),
        byproducts: byproducts.map(bp => ({
          itemId:      bp.itemId,
          itemCode:    bp.itemCode,
          itemName:    bp.itemName,
          qty:         parseFloat(bp.qty) || 0,
          uom:         bp.uom,
          recoveryPct: parseFloat(bp.recoveryPct) || 100,
          unitPrice:   parseFloat(bp.unitPrice)   || 0,
          scrapValue:  parseFloat(scrapValue(bp))  || 0,
          remarks:     bp.remarks || '',
        }))
      }
      const url    = isEdit ? `${BASE_URL}/bom/${bom.id}` : `${BASE_URL}/bom`
      const method = isEdit ? 'PATCH' : 'POST'
      const res    = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(payload) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(`BOM ${isEdit ? 'updated' : 'created'} successfully!`)
      onSave()
    } catch(err) {
      toast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const inp = { padding:'7px 10px', border:'1px solid var(--odoo-border)',
    borderRadius:5, fontSize:12, outline:'none', width:'100%',
    fontFamily:'DM Sans,sans-serif', boxSizing:'border-box' }
  const lbl = { fontSize:11, fontWeight:600, color:'var(--odoo-gray)', display:'block', marginBottom:4 }

  const filteredItems = items.filter(i =>
    i.code.toLowerCase().includes(itemSearch.toLowerCase()) ||
    i.name.toLowerCase().includes(itemSearch.toLowerCase())
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:'98%', maxWidth:1400,
        maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700 }}>
              {isEdit ? `Edit BOM — ${bom.bomNo}` : 'New Bill of Materials'}
            </h3>
            <p style={{ color:'rgba(255,255,255,.6)', margin:'2px 0 0', fontSize:11 }}>
              SAP: CS01 / CS03 — Product Structure
            </p>
          </div>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:20 }}>

          {/* BOM Header Section */}
          <div style={{ background:'#F8F4F8', border:'1px solid #E0D5E0',
            borderRadius:8, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
              textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
              📋 BOM Header
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px 16px' }}>
              <div>
                <label style={lbl}>BOM Number *</label>
                <div style={{ display:'flex', gap:4 }}>
                  <input style={{ ...inp, fontFamily:'DM Mono,monospace', flex:1 }}
                    value={form.bomNo} onChange={e => setForm(f => ({...f, bomNo: e.target.value}))}
                    placeholder="BOM-001" />
                  <button onClick={genBomNo}
                    style={{ padding:'7px 8px', background:'#714B67', color:'#fff',
                      border:'none', borderRadius:5, fontSize:11, cursor:'pointer', whiteSpace:'nowrap' }}>
                    Auto
                  </button>
                </div>
              </div>
              <div>
                <label style={lbl}>Item Code *</label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={form.itemCode}
                  onChange={e => {
                    const found = items.find(i => i.code === e.target.value)
                    setForm(f => ({...f,
                      itemCode: e.target.value,
                      itemName: found?.name || '',
                      uom:      found?.uom  || 'Nos',
                      bomNo:    f.bomNo || `BOM-${e.target.value}-${f.revision || 'A'}`
                    }))
                  }}>
                  <option value=''>-- Select Item --</option>
                  {items.map(i => <option key={i.id} value={i.code}>{i.code} — {i.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'span 3' }}>
                <label style={lbl}>Item Name</label>
                <input style={{ ...inp, background:'#F8F7FA', color:'#6C757D' }}
                  value={form.itemName} readOnly placeholder="Auto-filled from Item Code" />
              </div>
              <div>
                <label style={lbl}>Revision</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.revision}
                  onChange={e => setForm(f => ({...f, revision: e.target.value}))}>
                  {['A','B','C','D','1.0','1.1','1.5','2.0','2.1','3.0'].map(r =>
                    <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Alternative BOM</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.altBom}
                  onChange={e => setForm(f => ({...f, altBom: e.target.value}))}>
                  {['1','2','3','4','5'].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Plant</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.plant}
                  onChange={e => setForm(f => ({...f, plant: e.target.value}))}>
                  {['MAIN','PLANT2','STORE'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Base Qty</label>
                <input style={inp} type='number' value={form.baseQty}
                  onChange={e => setForm(f => ({...f, baseQty: e.target.value}))}
                  placeholder="1" />
              </div>
              <div>
                <label style={lbl}>Base UOM</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.uom}
                  onChange={e => setForm(f => ({...f, uom: e.target.value}))}>
                  {['Nos','Kg','Ltr','Mtr','Set','Roll','Box'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:2 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type='checkbox' checked={form.isPrimary}
                    onChange={e => setForm(f => ({...f, isPrimary: e.target.checked}))}
                    style={{ accentColor:'#714B67', width:15, height:15 }} />
                  <span style={{ fontSize:12, fontWeight:600, color:'#714B67' }}>Set as Primary BOM</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div style={{ display:'flex', gap:4, marginBottom:12 }}>
            {[
              { id:'components', label:`🔩 Components (${lines.length})` },
              { id:'byproducts', label:`♻️ Byproducts (${byproducts.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ padding:'8px 20px', borderRadius:6, fontSize:12, fontWeight:700,
                  cursor:'pointer', border:'1.5px solid',
                  borderColor: activeTab===t.id ? '#714B67' : '#E0D5E0',
                  background: activeTab===t.id ? '#714B67' : '#fff',
                  color: activeTab===t.id ? '#fff' : '#6C757D' }}>
                {t.label}
              </button>
            ))}
            {totalScrapValue > 0 && (
              <div style={{ marginLeft:'auto', background:'#D4EDDA', borderRadius:6,
                padding:'8px 16px', fontSize:12, fontWeight:700, color:'#155724' }}>
                ♻️ Total Scrap Recovery: ₹{parseFloat(totalScrapValue).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {/* COMPONENTS TAB */}
          {activeTab === 'components' && (
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
            <div style={{ background:'#F8F4F8', padding:'10px 16px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>              <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                textTransform:'uppercase', letterSpacing:.5 }}>
                🔩 Components ({lines.length})
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input placeholder="🔍 Search items to add..."
                  value={itemSearch} onChange={e => setItemSearch(e.target.value)}
                  style={{ padding:'5px 10px', border:'1px solid #E0D5E0',
                    borderRadius:5, fontSize:11, width:200, outline:'none' }} />
                <button onClick={addLine}
                  style={{ padding:'6px 14px', background:'#28A745', color:'#fff',
                    border:'none', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  + Add Component
                </button>
              </div>
            </div>

            {/* Lines table */}
            <div style={{ maxHeight:300, overflowY:'auto' }}>
              <table style={{ width:'100%', minWidth:1200, borderCollapse:'collapse' }}>
                <thead style={{ position:'sticky', top:0, background:'#F0EEF0', zIndex:5 }}>
                  <tr>
                    {[
                    {l:'Item No', w:55}, {l:'Type', w:70}, {l:'Item Code', w:160},
                    {l:'Component Name', w:'auto'}, {l:'Qty', w:75}, {l:'UOM', w:65},
                    {l:'Wastage %', w:80}, {l:'Sub-BOM', w:65}, {l:'MTO', w:55},
                    {l:'Valid From', w:115}, {l:'Valid To', w:115}, {l:'Remarks', w:120}, {l:'', w:30}
                  ].map(h => (
                      <th key={h.l} style={{ padding:'8px 8px', fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'center', verticalAlign:'middle',
                        textTransform:'uppercase', letterSpacing:.4,
                        borderBottom:'1px solid #E0D5E0', width: h.w,
                        whiteSpace:'nowrap' }}>{h.l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={line._id || idx} style={{ borderBottom:'1px solid #F0EEF0' }}>
                      {/* Item No - SAP 0010 steps */}
                      <td style={{ padding:'6px 8px', fontSize:11, color:'#714B67',
                        fontFamily:'DM Mono,monospace', fontWeight:700, width:55, textAlign:'center' }}>
                        {String((idx+1)*10).padStart(4,'0')}
                      </td>
                      {/* ICt - Item Category */}
                      <td style={{ padding:'4px 6px', width:55, textAlign:'center' }}>
                        <select style={{ ...inp, fontSize:11, padding:'5px 4px' }}
                          value={line.ict || 'L'}
                          onChange={e => updLine(idx, 'ict', e.target.value)}
                          title="Stock=Inventory tracked, Non-Stock=Direct purchase, Variable=Size based, Text=Note only">
                          <option value='L'>Stock</option>
                          <option value='N'>Non-Stock</option>
                          <option value='R'>Variable</option>
                          <option value='T'>Text</option>
                        </select>
                      </td>
                      {/* Item Code */}
                      <td style={{ padding:'4px 6px', width:160 }}>
                        <select style={{ ...inp, fontSize:11, fontFamily:'DM Mono,monospace' }}
                          value={line.itemId}
                          onChange={e => updLine(idx, 'itemId', e.target.value)}>
                          <option value=''>-- Select --</option>
                          {(itemSearch ? filteredItems : items).map(i => (
                            <option key={i.id} value={i.id}>{i.code}</option>
                          ))}
                        </select>
                      </td>
                      {/* Component Name */}
                      <td style={{ padding:'4px 8px', minWidth:180 }}>
                        <input style={{ ...inp, fontSize:11, background:'#F8F7FA' }}
                          value={line.itemName} readOnly placeholder="Auto-filled" />
                      </td>
                      {/* Qty */}
                      <td style={{ padding:'4px 6px', width:75 }}>
                        <input style={{ ...inp, fontSize:11 }} type='number'
                          value={line.qty} onChange={e => updLine(idx, 'qty', e.target.value)}
                          placeholder="1" min="0" step="0.001" />
                      </td>
                      {/* UOM */}
                      <td style={{ padding:'4px 6px', width:65 }}>
                        <input style={{ ...inp, fontSize:11, background:'#F8F7FA' }}
                          value={line.uom} readOnly />
                      </td>
                      {/* Wastage */}
                      <td style={{ padding:'4px 6px', width:70 }}>
                        <input style={{ ...inp, fontSize:11 }} type='number'
                          value={line.wastage} onChange={e => updLine(idx, 'wastage', e.target.value)}
                          placeholder="0" min="0" max="100" />
                      </td>
                      {/* Sub-BOM checkbox */}
                      <td style={{ padding:'4px 6px', width:65, textAlign:'center', verticalAlign:'middle' }} title='Has its own BOM (sub-assembly)'>
                        <input type='checkbox' checked={!!line.asm}
                          onChange={e => updLine(idx, 'asm', e.target.checked)}
                          style={{ accentColor:'#714B67', width:14, height:14 }} />
                      </td>
                      {/* MTO checkbox */}
                      <td style={{ padding:'4px 6px', width:55, textAlign:'center', verticalAlign:'middle' }} title='Make to Order - customer specific'>
                        <input type='checkbox' checked={!!line.sls}
                          onChange={e => updLine(idx, 'sls', e.target.checked)}
                          style={{ accentColor:'#714B67', width:14, height:14 }} />
                      </td>
                      {/* Valid From */}
                      <td style={{ padding:'4px 6px', width:105 }}>
                        <input style={{ ...inp, fontSize:10 }} type='date'
                          value={line.validFrom || ''}
                          onChange={e => updLine(idx, 'validFrom', e.target.value)} />
                      </td>
                      {/* Valid To */}
                      <td style={{ padding:'4px 6px', width:105 }}>
                        <input style={{ ...inp, fontSize:10 }} type='date'
                          value={line.validTo || ''}
                          onChange={e => updLine(idx, 'validTo', e.target.value)} />
                      </td>
                      {/* Remarks */}
                      <td style={{ padding:'4px 6px', minWidth:120 }}>
                        <input style={{ ...inp, fontSize:11 }}
                          value={line.remarks} onChange={e => updLine(idx, 'remarks', e.target.value)}
                          placeholder="Note" />
                      </td>
                      {/* Delete */}
                      <td style={{ padding:'4px 6px', width:28 }}>
                        <span onClick={() => delLine(idx)}
                          style={{ cursor:'pointer', color:'#DC3545', fontSize:16, fontWeight:700 }}>✕</span>
                      </td>
                    </tr>
                  ))}
                  {lines.length === 0 && (
                    <tr><td colSpan={8} style={{ padding:20, textAlign:'center',
                      color:'#6C757D', fontSize:12 }}>
                      No components added yet — click "+ Add Component"
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Line totals */}
            {lines.length > 0 && (
              <div style={{ padding:'8px 16px', background:'#F8F7FA',
                borderTop:'1px solid #E0D5E0', display:'flex', gap:24, fontSize:11, color:'#6C757D' }}>
                <span>Total Components: <strong style={{ color:'#714B67' }}>{lines.length}</strong></span>
                <span>With Wastage: <strong style={{ color:'#856404' }}>
                  {lines.filter(l => +l.wastage > 0).length}
                </strong></span>
              </div>
            )}
          </div>
          )}

          {/* BYPRODUCTS TAB */}
          {activeTab === 'byproducts' && (
            <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
              <div style={{ background:'#F8F4F8', padding:'10px 16px',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#714B67',
                    textTransform:'uppercase', letterSpacing:.5 }}>
                    ♻️ Byproducts / Co-products ({byproducts.length})
                  </span>
                  <span style={{ fontSize:11, color:'#6C757D' }}>
                    Items produced alongside main product (scrap, waste, co-products)
                  </span>
                </div>
                <button onClick={addBP}
                  style={{ padding:'6px 14px', background:'#00A09D', color:'#fff',
                    border:'none', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  + Add Byproduct
                </button>
              </div>

              <div style={{ maxHeight:320, overflowY:'auto', overflowX:'auto' }}>
                <table style={{ width:'100%', minWidth:1000, borderCollapse:'collapse' }}>
                  <thead style={{ position:'sticky', top:0, background:'#F0EEF0', zIndex:5 }}>
                    <tr>
                      {[
                        {l:'#',              w:40},
                        {l:'Item Code',      w:150},
                        {l:'Byproduct Name', w:220},
                        {l:'Qty',            w:80},
                        {l:'UOM',            w:70},
                        {l:'Recovery %',     w:90},
                        {l:'Unit Price (₹)', w:110},
                        {l:'Scrap Value (₹)',w:120},
                        {l:'Remarks',        w:140},
                        {l:'',               w:30},
                      ].map(h => (
                        <th key={h.l} style={{ padding:'8px 10px', fontSize:10, fontWeight:700,
                          color:'#6C757D', textAlign:'center', textTransform:'uppercase',
                          letterSpacing:.4, borderBottom:'1px solid #E0D5E0',
                          width:h.w, whiteSpace:'nowrap' }}>{h.l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {byproducts.map((bp, idx) => (
                      <tr key={bp._id} style={{ borderBottom:'1px solid #F0EEF0' }}>
                        <td style={{ padding:'6px 8px', textAlign:'center', fontSize:11,
                          color:'#714B67', fontWeight:700 }}>{idx+1}</td>
                        <td style={{ padding:'4px 6px', width:150 }}>
                          <select style={{ ...inp, fontSize:11, fontFamily:'DM Mono,monospace' }}
                            value={bp.itemId}
                            onChange={e => updBP(bp._id, 'itemId', e.target.value)}>
                            <option value=''>-- Select --</option>
                            {items.map(i => <option key={i.id} value={i.id}>{i.code}</option>)}
                          </select>
                        </td>
                        <td style={{ padding:'4px 6px' }}>
                          <input style={{ ...inp, fontSize:11, background:'#F8F7FA' }}
                            value={bp.itemName} readOnly placeholder="Auto-filled" />
                        </td>
                        <td style={{ padding:'4px 6px', width:80 }}>
                          <input style={{ ...inp, fontSize:11 }} type='number'
                            value={bp.qty} min="0" step="0.001"
                            onChange={e => updBP(bp._id, 'qty', e.target.value)} />
                        </td>
                        <td style={{ padding:'4px 6px', width:70 }}>
                          <input style={{ ...inp, fontSize:11, background:'#F8F7FA' }}
                            value={bp.uom} readOnly />
                        </td>
                        <td style={{ padding:'4px 6px', width:90 }}>
                          <div style={{ position:'relative' }}>
                            <input style={{ ...inp, fontSize:11, paddingRight:20 }} type='number'
                              value={bp.recoveryPct} min="0" max="100"
                              onChange={e => updBP(bp._id, 'recoveryPct', e.target.value)} />
                            <span style={{ position:'absolute', right:8, top:'50%',
                              transform:'translateY(-50%)', fontSize:11, color:'#6C757D' }}>%</span>
                          </div>
                        </td>
                        <td style={{ padding:'4px 6px', width:110 }}>
                          <div style={{ position:'relative' }}>
                            <span style={{ position:'absolute', left:8, top:'50%',
                              transform:'translateY(-50%)', fontSize:11, color:'#6C757D' }}>₹</span>
                            <input style={{ ...inp, fontSize:11, paddingLeft:20 }} type='number'
                              value={bp.unitPrice} min="0"
                              onChange={e => updBP(bp._id, 'unitPrice', e.target.value)} />
                          </div>
                        </td>
                        <td style={{ padding:'4px 6px', width:120, textAlign:'center' }}>
                          <span style={{ padding:'4px 10px', borderRadius:6, fontSize:12,
                            fontWeight:700, background:'#D4EDDA', color:'#155724' }}>
                            ₹{parseFloat(scrapValue(bp)).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td style={{ padding:'4px 6px' }}>
                          <input style={{ ...inp, fontSize:11 }}
                            value={bp.remarks}
                            onChange={e => updBP(bp._id, 'remarks', e.target.value)}
                            placeholder="e.g. Recyclable, Dispose" />
                        </td>
                        <td style={{ padding:'4px 6px', width:30, textAlign:'center' }}>
                          <span onClick={() => delBP(bp._id)}
                            style={{ cursor:'pointer', color:'#DC3545', fontSize:16, fontWeight:700 }}>✕</span>
                        </td>
                      </tr>
                    ))}
                    {byproducts.length === 0 && (
                      <tr><td colSpan={10} style={{ padding:24, textAlign:'center',
                        color:'#6C757D', fontSize:12 }}>
                        No byproducts — click "+ Add Byproduct" to add scrap, waste or co-products
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Byproduct summary */}
              {byproducts.length > 0 && (
                <div style={{ padding:'10px 16px', background:'#F8F7FA',
                  borderTop:'1px solid #E0D5E0', display:'flex', gap:24,
                  fontSize:11, color:'#6C757D', flexWrap:'wrap' }}>
                  <span>Byproducts: <strong style={{ color:'#714B67' }}>{byproducts.length}</strong></span>
                  <span>Full Recovery (100%): <strong style={{ color:'#155724' }}>
                    {byproducts.filter(b => +b.recoveryPct === 100).length}
                  </strong></span>
                  <span>Partial Recovery: <strong style={{ color:'#856404' }}>
                    {byproducts.filter(b => +b.recoveryPct > 0 && +b.recoveryPct < 100).length}
                  </strong></span>
                  <span>Dispose (0%): <strong style={{ color:'#DC3545' }}>
                    {byproducts.filter(b => +b.recoveryPct === 0).length}
                  </strong></span>
                  <span style={{ marginLeft:'auto', fontWeight:700, color:'#155724', fontSize:12 }}>
                    💰 Total Scrap Recovery: ₹{parseFloat(totalScrapValue).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background:'#F8F7FA' }}>
          <span style={{ fontSize:11, color:'#6C757D' }}>
            {form.isPrimary ? '⭐ This will be set as Primary BOM' : '📋 Non-primary BOM (alternate)'}
          </span>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onCancel}
              style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
                border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13,
                cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              style={{ padding:'8px 24px', background: saving ? '#9E7D96' : '#714B67',
                color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700,
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'DM Sans,sans-serif' }}>
              {saving ? '⏳ Saving...' : (isEdit ? '💾 Update BOM' : '💾 Create BOM')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── BOM Detail View (Tree) ────────────────────────────────
function BOMDetail({ bom, onClose, onEdit }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:'80%', maxWidth:800,
        maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:16 }}>
              {bom.bomNo}
              {bom.isPrimary && <span style={{ marginLeft:8, fontSize:11, background:'#F5C518',
                color:'#1C1C1C', padding:'2px 8px', borderRadius:10, fontWeight:700 }}>⭐ PRIMARY</span>}
            </h3>
            <p style={{ color:'rgba(255,255,255,.7)', margin:'2px 0 0', fontSize:11 }}>
              {bom.itemCode} — {bom.itemName} &nbsp;|&nbsp; Rev: {bom.revision} &nbsp;|&nbsp; {bom.lines?.length || 0} components
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onEdit}
              style={{ padding:'6px 14px', background:'rgba(255,255,255,.2)',
                color:'#fff', border:'1px solid rgba(255,255,255,.4)',
                borderRadius:5, fontSize:12, cursor:'pointer' }}>
              ✏️ Edit
            </button>
            <span onClick={onClose} style={{ color:'#fff', cursor:'pointer', fontSize:20, lineHeight:1, padding:4 }}>✕</span>
          </div>
        </div>

        {/* BOM Info Bar */}
        <div style={{ padding:'10px 20px', background:'#F8F4F8',
          display:'flex', gap:24, fontSize:12, borderBottom:'1px solid #E0D5E0' }}>
          <span>Base Qty: <strong>{bom.baseQty || 1} {bom.uom || 'Nos'}</strong></span>
          <span>Revision: <strong>{bom.revision}</strong></span>
          <span>Components: <strong style={{ color:'#714B67' }}>{bom.lines?.length || 0}</strong></span>
          <span>Status: <strong style={{ color: bom.isActive ? '#155724' : '#721C24' }}>
            {bom.isActive ? 'Active' : 'Inactive'}
          </strong></span>
        </div>

        {/* Tree View */}
        <div style={{ overflowY:'auto', flex:1, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
            textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
            🌳 Component Tree
          </div>
          {(bom.lines || []).map((line, i) => (
            <TreeNode key={line.id || i} line={line} depth={0} items={[]} />
          ))}
          {(!bom.lines || bom.lines.length === 0) && (
            <div style={{ padding:30, textAlign:'center', color:'#6C757D', fontSize:13 }}>
              No components in this BOM
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MAIN BOM LIST ─────────────────────────────────────────
export default function BOMList() {
  const [boms,      setBoms]      = useState([])
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [editBom,   setEditBom]   = useState(null)
  const [viewBom,   setViewBom]   = useState(null)
  const [statusF,   setStatusF]   = useState('active')

  // ── Fetch BOMs ──────────────────────────────────────────
  const fetchBoms = async () => {
    try {
      setLoading(true)
      const res  = await fetch(`${BASE_URL}/bom`, { headers: authHdrs() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBoms(data.data || [])
    } catch(err) {
      toast.error('Failed to load BOMs: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch Items for dropdowns ───────────────────────────
  const fetchItems = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/items`, { headers: authHdrs() })
      const data = await res.json()
      setItems(data.data || [])
    } catch(err) {
      console.log('Items fetch error:', err.message)
    }
  }

  useEffect(() => { fetchBoms(); fetchItems() }, [])

  // ── Deactivate BOM ──────────────────────────────────────
  const deactivate = async (id) => {
    if (!confirm('Deactivate this BOM?')) return
    try {
      const res = await fetch(`${BASE_URL}/bom/${id}`, { method:'DELETE', headers: authHdrs() })
      if (!res.ok) throw new Error('Failed')
      toast.success('BOM deactivated!')
      fetchBoms()
    } catch(err) {
      toast.error('Error: ' + err.message)
    }
  }

  const filtered = boms.filter(b =>
    (statusF === 'active' ? b.isActive : statusF === 'inactive' ? !b.isActive : true) &&
    (b.bomNo.toLowerCase().includes(search.toLowerCase()) ||
     b.itemCode.toLowerCase().includes(search.toLowerCase()) ||
     b.itemName.toLowerCase().includes(search.toLowerCase()))
  )

  // ── Stats ───────────────────────────────────────────────
  const totalActive   = boms.filter(b => b.isActive).length
  const totalInactive = boms.filter(b => !b.isActive).length

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Bill of Materials
          <small>SAP: CS01/CS03 · {boms.length} BOMs</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={fetchBoms}>🔄 Refresh</button>
          <button className="btn btn-p" onClick={() => { setEditBom(null); setShowForm(true) }}>
            + New BOM
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div style={{ padding:'8px 12px', background:'#E6F7F7', border:'1px solid #00A09D',
        borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
        <strong>Bill of Materials</strong> — Product structure with components, quantities and wastage.
        Multiple BOMs per item supported — mark one as <strong>Primary</strong>.
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total BOMs',    value: boms.length,     color:'#714B67', bg:'#EDE0EA' },
          { label:'Active BOMs',   value: totalActive,     color:'#155724', bg:'#D4EDDA' },
          { label:'Inactive BOMs', value: totalInactive,   color:'#721C24', bg:'#F8D7DA' },
          { label:'Total Items',   value: items.length,    color:'#0C5460', bg:'#D1ECF1' },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, borderRadius:8,
            padding:'12px 16px', border:`1px solid ${k.color}22` }}>
            <div style={{ fontSize:11, color:k.color, fontWeight:600,
              textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color,
              fontFamily:'Syne,sans-serif', lineHeight:1.2 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
        <input placeholder="🔍 Search BOM No, Item Code or Name..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:'7px 12px', border:'1px solid var(--odoo-border)',
            borderRadius:6, fontSize:12, outline:'none', width:320 }} />
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          style={{ padding:'7px 12px', border:'1px solid var(--odoo-border)',
            borderRadius:6, fontSize:12, outline:'none', cursor:'pointer' }}>
          <option value='active'>Active</option>
          <option value='inactive'>Inactive</option>
          <option value='all'>All</option>
        </select>
        <span style={{ fontSize:11, color:'var(--odoo-gray)', marginLeft:'auto' }}>
          {filtered.length} of {boms.length} BOMs
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D', fontSize:13 }}>
          ⏳ Loading BOMs...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div style={{ maxHeight:'calc(100vh - 360px)', overflowY:'auto', overflowX:'auto',
          border:'1px solid var(--odoo-border)', borderRadius:6 }}>
          <table className="fi-data-table" style={{ width:'100%', minWidth:900 }}>
            <thead style={{ position:'sticky', top:0, background:'#F8F4F8', zIndex:10 }}>
              <tr>
                <th>BOM No</th>
                <th>Item Code</th>
                <th>Product Name</th>
                <th>Plant</th>
                <th>Alt BOM</th>
                <th>Revision</th>
                <th>Components</th>
                <th>Primary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id} style={{ background: i%2===0?'#fff':'#FAFAFA',
                  opacity: b.isActive ? 1 : 0.6 }}>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700,
                    color:'var(--odoo-purple)', fontSize:12, cursor:'pointer' }}
                    onClick={() => setViewBom(b)}>
                    {b.bomNo}
                  </td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontSize:12, color:'#495057' }}>
                    {b.itemCode}
                  </td>
                  <td style={{ fontWeight:600, fontSize:12 }}>{b.itemName}</td>
                  <td style={{ fontSize:11, color:'#6C757D' }}>{b.plant || 'MAIN'}</td>
                  <td style={{ fontSize:12, textAlign:'center' }}>
                    <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11,
                      background:'#D1ECF1', color:'#0C5460', fontWeight:700 }}>
                      {b.altBom || '1'}
                    </span>
                  </td>
                  <td style={{ fontSize:12 }}>
                    <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11,
                      background:'#EDE0EA', color:'#714B67', fontWeight:600 }}>
                      Rev {b.revision}
                    </span>
                  </td>
                  <td style={{ fontSize:12, textAlign:'center' }}>
                    <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11,
                      background:'#D1ECF1', color:'#0C5460', fontWeight:600 }}>
                      {b.lineCount || b.lines?.length || 0} items
                    </span>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    {b.isPrimary
                      ? <span style={{ fontSize:16 }}>⭐</span>
                      : <span style={{ fontSize:11, color:'#CCC' }}>—</span>}
                  </td>
                  <td>
                    <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:600,
                      background: b.isActive ? '#D4EDDA' : '#F8D7DA',
                      color: b.isActive ? '#155724' : '#721C24' }}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => setViewBom(b)}
                        style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                          border:'1px solid #00A09D', background:'#E6F7F7',
                          color:'#005A58', cursor:'pointer' }}>
                        View
                      </button>
                      <button onClick={() => { setEditBom(b); setShowForm(true) }}
                        style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                          border:'1px solid var(--odoo-purple)', background:'var(--odoo-purple-lt)',
                          color:'var(--odoo-purple)', cursor:'pointer' }}>
                        Edit
                      </button>
                      {b.isActive && (
                        <button onClick={() => deactivate(b.id)}
                          style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                            border:'1px solid #6C757D', background:'#F8F9FA',
                            color:'#6C757D', cursor:'pointer' }}>
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={8} style={{ padding:32, textAlign:'center',
                  color:'#6C757D', fontSize:13 }}>
                  {boms.length === 0
                    ? '📋 No BOMs found — click "+ New BOM" to create one'
                    : 'No BOMs match your search'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* BOM Form Modal */}
      {showForm && (
        <BOMForm
          bom={editBom ? {
            ...editBom,
            lines: (editBom.lines || []).map(l => ({
              ...l,
              itemId:   l.itemId,
              itemCode: l.item?.code || '',
              itemName: l.item?.name || '',
              uom:      l.item?.uom  || 'Nos',
              _id:      l.id,
            }))
          } : null}
          items={items}
          onSave={() => { setShowForm(false); setEditBom(null); fetchBoms() }}
          onCancel={() => { setShowForm(false); setEditBom(null) }}
        />
      )}

      {/* BOM Detail / Tree View */}
      {viewBom && (
        <BOMDetail
          bom={viewBom}
          onClose={() => setViewBom(null)}
          onEdit={() => { setEditBom(viewBom); setViewBom(null); setShowForm(true) }}
        />
      )}
    </div>
  )
}
