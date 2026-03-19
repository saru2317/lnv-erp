import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const PRICE_LISTS = ['Standard Price List', 'Wholesale Price List',
  'Special Rate — Ashok Leyland', 'Export Price List']

const ITEMS = [
  // Powder Coating Services
  { code:'SV-PC-001', name:'Powder Coating — RAL 9005 Black',     cat:'Surface Treatment', uom:'Kg',  stdRate:850, whRate:780, alRate:720, expRate:12.5, gst:18, minQty:50  },
  { code:'SV-PC-002', name:'Powder Coating — RAL 9010 White',     cat:'Surface Treatment', uom:'Kg',  stdRate:850, whRate:780, alRate:720, expRate:12.5, gst:18, minQty:50  },
  { code:'SV-PC-003', name:'Powder Coating — Custom RAL',          cat:'Surface Treatment', uom:'Kg',  stdRate:920, whRate:850, alRate:790, expRate:13.5, gst:18, minQty:100 },
  { code:'SV-ST-001', name:'Surface Treatment — Phosphating',      cat:'Surface Treatment', uom:'Kg',  stdRate:420, whRate:380, alRate:350, expRate:6.2,  gst:18, minQty:100 },
  { code:'SV-ST-002', name:'ED Coating — Cathodic',               cat:'Surface Treatment', uom:'Kg',  stdRate:680, whRate:620, alRate:580, expRate:10.0, gst:18, minQty:100 },
  { code:'SV-ST-003', name:'Zinc Plating',                        cat:'Surface Treatment', uom:'Kg',  stdRate:560, whRate:510, alRate:480, expRate:8.2,  gst:18, minQty:50  },
  // Products / Spares
  { code:'PR-001',    name:'ARISER COMFACT SYSTEM',               cat:'Product',           uom:'Nos', stdRate:1200, whRate:1100, alRate:1050, expRate:17.5, gst:18, minQty:10 },
  { code:'PR-002',    name:'COMPACT SPARES — SET',                cat:'Product',           uom:'Set', stdRate:2100, whRate:1950, alRate:1850, expRate:31.0, gst:12, minQty:5  },
  { code:'PR-003',    name:'LATTICE APRONS C121',                  cat:'Product',           uom:'Nos', stdRate:450,  whRate:420,  alRate:400,  expRate:6.6,  gst:18, minQty:20 },
  // Job Work
  { code:'JW-001',    name:'Job Work — Labour Charge (Powder)',    cat:'Job Work',          uom:'Kg',  stdRate:320, whRate:290, alRate:270, expRate:4.7,  gst:18, minQty:0  },
  { code:'JW-002',    name:'Job Work — Labour Charge (Surface)',   cat:'Job Work',          uom:'Kg',  stdRate:180, whRate:160, alRate:150, expRate:2.6,  gst:18, minQty:0  },
  { code:'JW-003',    name:'Job Work — Setup / Jigging Charge',    cat:'Job Work',          uom:'Lot', stdRate:2500, whRate:2200, alRate:2000, expRate:36.0, gst:18, minQty:0 },
]

const CATS = ['All', ...new Set(ITEMS.map(i => i.cat))]

export default function PriceBook() {
  const navigate    = useNavigate()
  const [pl, setPL] = useState('Standard Price List')
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [editIdx, setEditIdx] = useState(null)
  const [items, setItems] = useState(ITEMS)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ code:'', name:'', cat:'Surface Treatment', uom:'Kg', stdRate:'', whRate:'', alRate:'', expRate:'', gst:18, minQty:0 })

  const plKey = { 'Standard Price List':'stdRate', 'Wholesale Price List':'whRate',
    'Special Rate — Ashok Leyland':'alRate', 'Export Price List':'expRate' }[pl] || 'stdRate'

  const filtered = items.filter(i =>
    (cat === 'All' || i.cat === cat) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) ||
     i.code.toLowerCase().includes(search.toLowerCase()))
  )

  const saveEdit = (idx, field, val) => {
    setItems(its => its.map((it, i) => i === idx ? { ...it, [field]: Number(val) || val } : it))
  }

  const addItem = () => {
    if (!newItem.code || !newItem.name) return toast.error('Code and Name required')
    setItems(its => [...its, { ...newItem, stdRate:Number(newItem.stdRate), whRate:Number(newItem.whRate), alRate:Number(newItem.alRate), expRate:Number(newItem.expRate) }])
    toast.success(`Item ${newItem.code} added to price book!`)
    setShowAdd(false)
    setNewItem({ code:'', name:'', cat:'Surface Treatment', uom:'Kg', stdRate:'', whRate:'', alRate:'', expRate:'', gst:18, minQty:0 })
  }

  const fmt = n => n?.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Price Book <small>Item-wise Rates · All Price Lists</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => navigate('/sd/pricing')}>
            Pricing Conditions
          </button>
          <button className="btn btn-s sd-bsm" onClick={() => toast.success('Exporting price book...')}>
            Export Excel
          </button>
          <button className="btn btn-p" onClick={() => setShowAdd(true)}>
            + Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        {/* Price List selector */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--odoo-gray)' }}>Price List:</label>
          <div style={{ display:'flex', gap:4 }}>
            {PRICE_LISTS.map(p => (
              <button key={p} onClick={() => setPL(p)}
                style={{ padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:600,
                  cursor:'pointer', border:'1px solid var(--odoo-border)',
                  background: pl===p ? 'var(--odoo-purple)' : '#fff',
                  color: pl===p ? '#fff' : 'var(--odoo-gray)', whiteSpace:'nowrap' }}>
                {p.length > 20 ? p.slice(0,20)+'…' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:14, alignItems:'center' }}>
        {/* Category filter */}
        <div style={{ display:'flex', gap:4 }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                cursor:'pointer', border:'1px solid var(--odoo-border)',
                background: cat===c ? 'var(--odoo-dark)' : '#fff',
                color: cat===c ? '#fff' : 'var(--odoo-gray)' }}>
              {c}
            </button>
          ))}
        </div>
        {/* Search */}
        <input style={{ padding:'6px 12px', border:'1px solid var(--odoo-border)',
          borderRadius:6, fontSize:12, width:220, outline:'none' }}
          placeholder="Search item code or name..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{ fontSize:11, color:'var(--odoo-gray)', marginLeft:'auto' }}>
          {filtered.length} items
        </span>
      </div>

      {/* Add Item Form */}
      {showAdd && (
        <div className="fi-panel" style={{ marginBottom:16, border:'1px solid var(--odoo-green)', borderRadius:8 }}>
          <div className="fi-panel-hdr" style={{ background:'var(--odoo-green)' }}>
            <h3 style={{ color:'#fff', fontSize:13 }}>Add New Item to Price Book</h3>
            <button onClick={() => setShowAdd(false)} style={{ background:'none', border:'none',
              color:'#fff', cursor:'pointer', fontSize:16 }}>x</button>
          </div>
          <div style={{ padding:16, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            <div className="sd-fg">
              <label>Item Code <span className="req">*</span></label>
              <input className="sd-fi" placeholder="SV-PC-004"
                value={newItem.code} onChange={e => setNewItem(p => ({ ...p, code:e.target.value }))}
                style={{ fontFamily:'DM Mono,monospace' }} />
            </div>
            <div className="sd-fg" style={{ gridColumn:'span 2' }}>
              <label>Item Name <span className="req">*</span></label>
              <input className="sd-fi" placeholder="e.g. Powder Coating — RAL 3020 Red"
                value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name:e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label>Category</label>
              <select className="sd-fis" value={newItem.cat}
                onChange={e => setNewItem(p => ({ ...p, cat:e.target.value }))}>
                <option>Surface Treatment</option><option>Product</option><option>Job Work</option>
              </select>
            </div>
            <div className="sd-fg">
              <label>UOM</label>
              <select className="sd-fis" value={newItem.uom}
                onChange={e => setNewItem(p => ({ ...p, uom:e.target.value }))}>
                <option>Kg</option><option>Nos</option><option>Set</option>
                <option>Lot</option><option>Mtr</option><option>Ltr</option>
              </select>
            </div>
            <div className="sd-fg">
              <label>GST %</label>
              <select className="sd-fis" value={newItem.gst}
                onChange={e => setNewItem(p => ({ ...p, gst:Number(e.target.value) }))}>
                <option value={0}>0%</option><option value={5}>5%</option>
                <option value={12}>12%</option><option value={18}>18%</option><option value={28}>28%</option>
              </select>
            </div>
            <div className="sd-fg">
              <label>Min Qty</label>
              <input className="sd-fi" type="number" placeholder="0"
                value={newItem.minQty} onChange={e => setNewItem(p => ({ ...p, minQty:Number(e.target.value) }))} />
            </div>
            <div className="sd-fg">
              <label>Standard Rate (₹)</label>
              <input className="sd-fi" type="number" placeholder="850"
                value={newItem.stdRate} onChange={e => setNewItem(p => ({ ...p, stdRate:e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label>Wholesale Rate (₹)</label>
              <input className="sd-fi" type="number" placeholder="780"
                value={newItem.whRate} onChange={e => setNewItem(p => ({ ...p, whRate:e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label>AL Special Rate (₹)</label>
              <input className="sd-fi" type="number" placeholder="720"
                value={newItem.alRate} onChange={e => setNewItem(p => ({ ...p, alRate:e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label>Export Rate (USD)</label>
              <input className="sd-fi" type="number" placeholder="12.50"
                value={newItem.expRate} onChange={e => setNewItem(p => ({ ...p, expRate:e.target.value }))} />
            </div>
            <div style={{ gridColumn:'1 / -1', display:'flex', gap:8 }}>
              <button className="btn btn-p" onClick={addItem}>Add to Price Book</button>
              <button className="btn btn-s" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Price Book Table */}
      <div style={{ background:'#fff', border:'1px solid var(--odoo-border)',
        borderRadius:8, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        {/* Active PL header */}
        <div style={{ padding:'10px 14px', background:'var(--odoo-purple)',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>
            {pl}
          </span>
          <span style={{ color:'rgba(255,255,255,.7)', fontSize:11 }}>
            Click any rate to edit inline
          </span>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8F3F7' }}>
              <th style={{ padding:'9px 12px', textAlign:'left', fontSize:11,
                fontWeight:700, color:'var(--odoo-gray)', borderBottom:'1px solid var(--odoo-border)' }}>
                Code
              </th>
              <th style={{ padding:'9px 12px', textAlign:'left', fontSize:11,
                fontWeight:700, color:'var(--odoo-gray)', borderBottom:'1px solid var(--odoo-border)' }}>
                Item / Service
              </th>
              <th style={{ padding:'9px 12px', textAlign:'center', fontSize:11,
                fontWeight:700, color:'var(--odoo-gray)', borderBottom:'1px solid var(--odoo-border)' }}>
                Category
              </th>
              <th style={{ padding:'9px 12px', textAlign:'center', fontSize:11,
                fontWeight:700, color:'var(--odoo-gray)', borderBottom:'1px solid var(--odoo-border)' }}>
                UOM
              </th>
              <th style={{ padding:'9px 12px', textAlign:'right', fontSize:11,
                fontWeight:700, color:'var(--odoo-purple)', borderBottom:'1px solid var(--odoo-border)',
                background:'var(--odoo-purple-lt)' }}>
                Rate (₹) ▾
              </th>
              <th style={{ padding:'9px 12px', textAlign:'center', fontSize:11,
                fontWeight:700, color:'var(--odoo-gray)', borderBottom:'1px solid var(--odoo-border)' }}>
                GST %
              </th>
              <th style={{ padding:'9px 12px', textAlign:'right', fontSize:11,
                fontWeight:700, color:'var(--odoo-gray)', borderBottom:'1px solid var(--odoo-border)' }}>
                Rate + GST
              </th>
              <th style={{ padding:'9px 12px', textAlign:'center', fontSize:11,
                fontWeight:700, color:'var(--odoo-gray)', borderBottom:'1px solid var(--odoo-border)' }}>
                Min Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const rate     = item[plKey]
              const rateGST  = rate * (1 + item.gst / 100)
              const isEditing = editIdx === idx
              const catColors = {
                'Surface Treatment': { bg:'#EBF2F8', c:'#1A5276' },
                'Product':           { bg:'#EDE0EA', c:'#714B67' },
                'Job Work':          { bg:'#FFF3CD', c:'#856404' },
              }
              const cc = catColors[item.cat] || { bg:'#eee', c:'#555' }

              return (
                <tr key={item.code}
                  style={{ background: idx%2===0?'#fff':'#FAFAFA',
                    borderBottom:'1px solid var(--odoo-border)',
                    transition:'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#F8F3F7'}
                  onMouseLeave={e => e.currentTarget.style.background=idx%2===0?'#fff':'#FAFAFA'}>
                  <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace',
                    fontSize:11, fontWeight:600, color:'var(--odoo-purple)' }}>
                    {item.code}
                  </td>
                  <td style={{ padding:'8px 12px', fontWeight:600, fontSize:12 }}>
                    {item.name}
                  </td>
                  <td style={{ padding:'8px 12px', textAlign:'center' }}>
                    <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10,
                      fontWeight:600, background:cc.bg, color:cc.c }}>
                      {item.cat}
                    </span>
                  </td>
                  <td style={{ padding:'8px 12px', textAlign:'center', fontSize:11,
                    color:'var(--odoo-gray)' }}>
                    {item.uom}
                  </td>
                  {/* Editable Rate */}
                  <td style={{ padding:'8px 12px', textAlign:'right',
                    background:'var(--odoo-purple-lt)' }}
                    onClick={() => setEditIdx(idx)}>
                    {isEditing ? (
                      <input type="number"
                        defaultValue={rate}
                        autoFocus
                        onBlur={e => { saveEdit(idx, plKey, e.target.value); setEditIdx(null) }}
                        onKeyDown={e => { if (e.key==='Enter') { saveEdit(idx, plKey, e.target.value); setEditIdx(null) } }}
                        style={{ width:80, textAlign:'right', fontFamily:'DM Mono,monospace',
                          fontSize:13, fontWeight:700, border:'1px solid var(--odoo-purple)',
                          borderRadius:4, padding:'2px 6px', outline:'none' }} />
                    ) : (
                      <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700,
                        fontSize:13, color:'var(--odoo-purple)', cursor:'text' }}>
                        ₹{fmt(rate)}
                      </span>
                    )}
                  </td>
                  <td style={{ padding:'8px 12px', textAlign:'center', fontSize:12,
                    fontWeight:600, color:'var(--odoo-gray)' }}>
                    {item.gst}%
                  </td>
                  <td style={{ padding:'8px 12px', textAlign:'right',
                    fontFamily:'DM Mono,monospace', fontSize:12, color:'var(--odoo-dark)' }}>
                    ₹{fmt(rateGST)}
                  </td>
                  <td style={{ padding:'8px 12px', textAlign:'center',
                    fontSize:11, color:'var(--odoo-gray)' }}>
                    {item.minQty > 0 ? item.minQty+' '+item.uom : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--odoo-gray)', fontSize:13 }}>
            No items found for the selected filter.
          </div>
        )}
      </div>

      {/* Price comparison footer */}
      <div style={{ marginTop:16, padding:'12px 14px', background:'var(--odoo-bg)',
        border:'1px solid var(--odoo-border)', borderRadius:6, fontSize:12 }}>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, color:'var(--odoo-dark)' }}>Rate Comparison:</span>
          {PRICE_LISTS.map(p => {
            const k = { 'Standard Price List':'stdRate', 'Wholesale Price List':'whRate',
              'Special Rate — Ashok Leyland':'alRate', 'Export Price List':'expRate' }[p] || 'stdRate'
            const avg = (items.reduce((s,i) => s + (i[k] || 0), 0) / items.length).toFixed(0)
            return (
              <span key={p} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:10, height:10, borderRadius:'50%',
                  background: p===pl ? 'var(--odoo-purple)' : 'var(--odoo-border)',
                  display:'inline-block' }} />
                <span style={{ color: p===pl ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
                  fontWeight: p===pl ? 700 : 400, fontSize:11 }}>
                  {p.split(' — ')[0]}: Avg ₹{Number(avg).toLocaleString('en-IN')}
                </span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
