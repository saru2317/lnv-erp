import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2 })
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

const TYPE_COLORS = {
  standard:  { bg:'#E8F5E9', color:'#1E8449', label:'Standard' },
  customer:  { bg:'#EBF5FB', color:'#1A5276', label:'Customer Specific' },
  wholesale: { bg:'#FEF9E7', color:'#B8860B', label:'Wholesale' },
  retail:    { bg:'#F0EBF0', color:'#714B67', label:'Retail' },
  special:   { bg:'#FDEDEC', color:'#C0392B', label:'Special / Offer' },
}

const inp = { width:'100%', padding:'8px 10px', border:'1px solid #ddd', borderRadius:6, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }
const lbl = { fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:4 }

export default function PriceBook() {
  const [prices,     setPrices]   = useState([])
  const [loading,    setLoading]  = useState(true)
  const [modal,      setModal]    = useState(false)
  const [editRow,    setEditRow]  = useState(null)
  const [search,     setSearch]   = useState('')
  const [filterType, setFilter]   = useState('')
  const [items,      setItems]    = useState([])
  const [form,       setForm]     = useState({
    priceListName:'', priceListType:'standard', currency:'INR',
    validFrom:'', validTo:'', itemCode:'', itemName:'',
    priceUomType:'per_piece', basePrice:'', minQty:1, minPrice:'', notes:''
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/sd/price-book`, { headers:hdr2() })
      const d = await r.json()
      setPrices(d.data || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch(`${BASE}/mdm/items?limit=500`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setItems(d.data||d||[])).catch(()=>{})
  }, [])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const openNew = () => {
    setEditRow(null)
    setForm({ priceListName:'', priceListType:'standard', currency:'INR',
      validFrom:'', validTo:'', itemCode:'', itemName:'',
      priceUomType:'per_piece', basePrice:'', minQty:1, minPrice:'', notes:'' })
    setModal(true)
  }

  const openEdit = row => {
    setEditRow(row)
    setForm({
      priceListName: row.priceListName||'', priceListType: row.priceListType||'standard',
      currency:      row.currency||'INR',
      validFrom:     row.validFrom?row.validFrom.slice(0,10):'',
      validTo:       row.validTo  ?row.validTo.slice(0,10)  :'',
      itemCode:      row.itemCode||'', itemName: row.itemName||'',
      priceUomType:  row.priceUomType||'per_piece',
      basePrice:     row.basePrice||'', minQty: row.minQty||1,
      minPrice:      row.minPrice||'', notes: row.notes||'',
    })
    setModal(true)
  }

  const save = async () => {
    if (!form.priceListName.trim()) return toast.error('Price list name required')
    if (!form.itemName.trim())      return toast.error('Item name required')
    if (!form.basePrice)            return toast.error('Base price required')
    try {
      const url    = editRow ? `${BASE}/sd/price-book/${editRow.id}` : `${BASE}/sd/price-book`
      const method = editRow ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers:hdr(), body:JSON.stringify(form) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(editRow ? 'Price updated ✅' : 'Price added ✅')
      setModal(false); load()
    } catch { toast.error('Failed to save') }
  }

  const del = async id => {
    if (!confirm('Delete this price entry?')) return
    try {
      await fetch(`${BASE}/sd/price-book/${id}`, { method:'DELETE', headers:hdr2() })
      toast.success('Deleted'); load()
    } catch { toast.error('Failed') }
  }

  const filtered = prices.filter(p => {
    const q = search.toLowerCase()
    const mQ = !q || [p.itemName,p.priceListName,p.itemCode].join(' ').toLowerCase().includes(q)
    const mT = !filterType || p.priceListType === filterType
    return mQ && mT
  })

  const groups = filtered.reduce((acc,p) => {
    if (!acc[p.priceListName]) acc[p.priceListName] = { type:p.priceListType, items:[] }
    acc[p.priceListName].items.push(p)
    return acc
  }, {})

  return (
    <div style={{ padding:20, background:'#F9F6F8', minHeight:'100vh' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'#714B67' }}>📋 Price Book</div>
          <div style={{ fontSize:13, color:'#888', marginTop:2 }}>Customer & product-wise price lists · {prices.length} entries</div>
        </div>
        <button onClick={openNew} style={{ padding:'9px 20px', background:'#714B67', color:'#fff',
          border:'none', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:13 }}>
          + New Price Entry
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          ['Total Entries',prices.length,'#714B67'],
          ['Price Lists',Object.keys(groups).length,'#1A5276'],
          ['Standard',prices.filter(p=>p.priceListType==='standard').length,'#1E8449'],
          ['Customer',prices.filter(p=>p.priceListType==='customer').length,'#D35400'],
          ['Expired',prices.filter(p=>p.validTo&&new Date(p.validTo)<new Date()).length,'#C0392B'],
        ].map(([l,v,c])=>(
          <div key={l} style={{ background:'#fff', borderRadius:10, padding:'12px 16px',
            boxShadow:'0 1px 4px rgba(0,0,0,.06)', borderLeft:`3px solid ${c}` }}>
            <div style={{ fontSize:22, fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background:'#fff', borderRadius:10, padding:'12px 16px', marginBottom:16,
        boxShadow:'0 1px 4px rgba(0,0,0,.06)', display:'flex', gap:12, alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder='🔍 Search item, price list name...'
          style={{ ...inp, width:280 }} />
        <select value={filterType} onChange={e=>setFilter(e.target.value)} style={{ ...inp, width:200 }}>
          <option value=''>All Types</option>
          {Object.entries(TYPE_COLORS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={load} style={{ padding:'8px 16px', background:'#F0EBF0', color:'#714B67',
          border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>🔄 Refresh</button>
        <div style={{ marginLeft:'auto', fontSize:12, color:'#888' }}>{filtered.length} of {prices.length}</div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>⏳ Loading...</div>
      ) : Object.keys(groups).length === 0 ? (
        <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:12,
          boxShadow:'0 1px 6px rgba(0,0,0,.07)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:16, fontWeight:600, color:'#714B67', marginBottom:8 }}>No price entries yet</div>
          <div style={{ fontSize:13, color:'#888', marginBottom:20 }}>
            Create price lists for standard pricing, customer-specific rates, wholesale prices
          </div>
          <button onClick={openNew} style={{ padding:'9px 20px', background:'#714B67', color:'#fff',
            border:'none', borderRadius:7, cursor:'pointer', fontWeight:700 }}>+ New Price Entry</button>
        </div>
      ) : Object.entries(groups).map(([listName, group]) => {
        const tc = TYPE_COLORS[group.type] || TYPE_COLORS.standard
        return (
          <div key={listName} style={{ background:'#fff', borderRadius:12, marginBottom:16,
            boxShadow:'0 1px 6px rgba(0,0,0,.07)', overflow:'hidden' }}>
            <div style={{ padding:'12px 18px', background:tc.bg, borderBottom:`2px solid ${tc.color}33`,
              display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1 }}>
                <span style={{ fontSize:15, fontWeight:700, color:tc.color }}>{listName}</span>
                <span style={{ marginLeft:10, padding:'2px 10px', borderRadius:12, fontSize:11,
                  fontWeight:700, background:tc.color, color:'#fff' }}>{tc.label}</span>
              </div>
              <div style={{ fontSize:12, color:'#888' }}>{group.items.length} items</div>
              <button onClick={()=>{
                setForm(f=>({...f,priceListName:listName,priceListType:group.type}))
                setEditRow(null); setModal(true)
              }} style={{ padding:'4px 12px', background:tc.color, color:'#fff',
                border:'none', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:600 }}>
                + Add Item
              </button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F9F6F8' }}>
                  {['Item Code','Item Name','Price per','Base Price','Min Qty','Min Price','Valid From','Valid To','Notes',''].map(h=>(
                    <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11,
                      fontWeight:700, color:'#666', borderBottom:'1px solid #F0E8EC', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.items.map((p,i)=>(
                  <tr key={p.id} style={{ background:i%2===0?'#fff':'#FDFBFD', borderBottom:'1px solid #F5F0F5' }}>
                    <td style={{ padding:'9px 14px', fontFamily:'monospace', fontSize:11, color:'#714B67' }}>{p.itemCode||'—'}</td>
                    <td style={{ padding:'9px 14px', fontWeight:600 }}>{p.itemName}</td>
                    <td style={{ padding:'9px 14px', color:'#555', fontSize:12 }}>
                      {{'per_piece':'Per Piece','per_kg':'Per Kg','per_litre':'Per Litre','per_mtr':'Per Mtr','per_sqft':'Per Sq.Ft','per_set':'Per Set'}[p.priceUomType]||p.priceUomType}
                    </td>
                    <td style={{ padding:'9px 14px', fontWeight:700, color:'#1E8449', fontSize:14 }}>{fmtC(p.basePrice)}</td>
                    <td style={{ padding:'9px 14px', color:'#555', textAlign:'center' }}>{p.minQty}</td>
                    <td style={{ padding:'9px 14px', color:'#C0392B', fontSize:12 }}>{p.minPrice?fmtC(p.minPrice):'—'}</td>
                    <td style={{ padding:'9px 14px', fontSize:12, color:'#888' }}>{fmtD(p.validFrom)}</td>
                    <td style={{ padding:'9px 14px', fontSize:12,
                      color:p.validTo&&new Date(p.validTo)<new Date()?'#C0392B':'#888' }}>
                      {fmtD(p.validTo)}
                      {p.validTo&&new Date(p.validTo)<new Date()&&(
                        <div style={{ fontSize:10, color:'#C0392B', fontWeight:700 }}>EXPIRED</div>
                      )}
                    </td>
                    <td style={{ padding:'9px 14px', fontSize:11, color:'#888', maxWidth:140,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.notes||'—'}</td>
                    <td style={{ padding:'9px 14px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={()=>openEdit(p)} style={{ padding:'3px 9px', background:'#EBF5FB',
                          color:'#1A5276', border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>✏️</button>
                        <button onClick={()=>del(p.id)} style={{ padding:'3px 9px', background:'#FDEDEC',
                          color:'#C0392B', border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {/* MODAL */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:100,
          display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:580,
            maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize:18, fontWeight:700, color:'#714B67', marginBottom:20 }}>
              {editRow?'✏️ Edit Price Entry':'➕ New Price Entry'}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Price List Name * <span style={{ fontSize:11, color:'#888', fontWeight:400 }}>(e.g. Standard 2026, Texmo Industries, Wholesale)</span></label>
                <input defaultValue={form.priceListName} onBlur={e=>set('priceListName',e.target.value)}
                  placeholder='e.g. Standard Price 2026 or Customer Name' style={inp} />
              </div>

              <div>
                <label style={lbl}>Price List Type *</label>
                <select value={form.priceListType} onChange={e=>set('priceListType',e.target.value)} style={inp}>
                  <option value='standard'>Standard (Default for all customers)</option>
                  <option value='customer'>Customer Specific</option>
                  <option value='wholesale'>Wholesale</option>
                  <option value='retail'>Retail</option>
                  <option value='special'>Special / Offer</option>
                </select>
              </div>

              <div>
                <label style={lbl}>Currency</label>
                <select value={form.currency} onChange={e=>set('currency',e.target.value)} style={inp}>
                  <option value='INR'>INR — Indian Rupee</option>
                  <option value='USD'>USD — US Dollar</option>
                  <option value='EUR'>EUR — Euro</option>
                </select>
              </div>

              <div>
                <label style={lbl}>Item Code</label>
                <input defaultValue={form.itemCode} onBlur={e=>set('itemCode',e.target.value)}
                  placeholder='e.g. FG-SFG-0001' style={inp} list='pb-codes' />
                <datalist id='pb-codes'>
                  {items.map(i=><option key={i.itemCode} value={i.itemCode}>{i.itemName}</option>)}
                </datalist>
              </div>

              <div>
                <label style={lbl}>Item Name *</label>
                <input defaultValue={form.itemName} onBlur={e=>set('itemName',e.target.value)}
                  placeholder='e.g. Chair Bottom Bush - Red' style={inp} list='pb-names' />
                <datalist id='pb-names'>
                  {items.map(i=><option key={i.itemCode} value={i.itemName} />)}
                </datalist>
              </div>

              <div>
                <label style={lbl}>Base Price (₹) *</label>
                <input type='number' defaultValue={form.basePrice} onBlur={e=>set('basePrice',e.target.value)}
                  placeholder='0.00' style={inp} step='0.01' />
              </div>

              <div>
                <label style={lbl}>Minimum Price (₹) <span style={{ fontSize:11, color:'#C0392B', fontWeight:400 }}>(Floor price — SO needs approval if below)</span></label>
                <input type='number' defaultValue={form.minPrice} onBlur={e=>set('minPrice',e.target.value)}
                  placeholder='0.00' style={inp} step='0.01' />
              </div>

              <div>
                <label style={lbl}>Price Per</label>
                <select value={form.priceUomType} onChange={e=>set('priceUomType',e.target.value)} style={inp}>
                  <option value='per_piece'>Per Piece / Nos</option>
                  <option value='per_kg'>Per Kg</option>
                  <option value='per_litre'>Per Litre</option>
                  <option value='per_mtr'>Per Metre</option>
                  <option value='per_sqft'>Per Sq.Ft</option>
                  <option value='per_set'>Per Set</option>
                </select>
              </div>

              <div>
                <label style={lbl}>Minimum Qty</label>
                <input type='number' defaultValue={form.minQty} onBlur={e=>set('minQty',e.target.value)}
                  placeholder='1' style={inp} />
              </div>

              <div>
                <label style={lbl}>Valid From</label>
                <input type='date' value={form.validFrom} onChange={e=>set('validFrom',e.target.value)} style={inp} />
              </div>

              <div>
                <label style={lbl}>Valid To</label>
                <input type='date' value={form.validTo} onChange={e=>set('validTo',e.target.value)} style={inp} />
              </div>

              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Notes</label>
                <input defaultValue={form.notes} onBlur={e=>set('notes',e.target.value)}
                  placeholder='e.g. Bulk discount for orders above 1000 pcs' style={inp} />
              </div>
            </div>

            {form.basePrice && (
              <div style={{ marginTop:14, background:'#E8F5E9', borderRadius:8, padding:'12px 16px',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:13, color:'#1E8449' }}>
                  <strong>{form.itemName||'Item'}</strong> — {form.priceListName||'Price List'}
                </div>
                <div style={{ fontSize:18, fontWeight:700, color:'#1E8449' }}>
                  {fmtC(form.basePrice)} / {{'per_piece':'Pc','per_kg':'Kg','per_litre':'L','per_mtr':'Mtr','per_sqft':'Sqft','per_set':'Set'}[form.priceUomType]||'Pc'}
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={()=>setModal(false)} style={{ padding:'8px 20px', background:'#f0f0f0',
                border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>Cancel</button>
              <button onClick={save} style={{ padding:'8px 20px', background:'#714B67', color:'#fff',
                border:'none', borderRadius:7, cursor:'pointer', fontWeight:700 }}>
                💾 {editRow?'Update':'Save'} Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
