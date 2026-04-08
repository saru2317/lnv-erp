import React, { useState } from 'react'

const INIT = { code:'', name:'', symbol:'', type:'', decimals:'2', active:true, description:'' }
const UOM_TYPES = ['Length','Weight','Volume','Area','Count','Time','Temperature','Other']

const SAMPLE = [
  { id:1, code:'KG',  name:'Kilogram',  symbol:'kg',  type:'Weight', decimals:3, active:true },
  { id:2, code:'GRM', name:'Gram',      symbol:'g',   type:'Weight', decimals:3, active:true },
  { id:3, code:'MTR', name:'Metre',     symbol:'m',   type:'Length', decimals:3, active:true },
  { id:4, code:'CM',  name:'Centimetre',symbol:'cm',  type:'Length', decimals:2, active:true },
  { id:5, code:'NOS', name:'Numbers',   symbol:'nos', type:'Count',  decimals:0, active:true },
  { id:6, code:'PCS', name:'Pieces',    symbol:'pcs', type:'Count',  decimals:0, active:true },
  { id:7, code:'LTR', name:'Litre',     symbol:'ltr', type:'Volume', decimals:3, active:true },
  { id:8, code:'BOX', name:'Box',       symbol:'box', type:'Count',  decimals:0, active:false },
]

export default function UOMMaster() {
  const [rows, setRows]       = useState(SAMPLE)
  const [form, setForm]       = useState(INIT)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]   = useState(null)
  const [search, setSearch]   = useState('')
  const [filterType, setFilterType] = useState('All')

  const filtered = rows.filter(r =>
    (filterType === 'All' || r.type === filterType) &&
    (r.code.toLowerCase().includes(search.toLowerCase()) ||
     r.name.toLowerCase().includes(search.toLowerCase()))
  )

  const openNew  = () => { setForm(INIT); setEditId(null); setShowForm(true) }
  const openEdit = (r) => { setForm({...r, active: r.active}); setEditId(r.id); setShowForm(true) }
  const cancel   = () => { setShowForm(false); setForm(INIT); setEditId(null) }

  const save = () => {
    if (!form.code || !form.name || !form.symbol) {
      alert('Code, Name and Symbol are required!'); return
    }
    if (editId) {
      setRows(rows.map(r => r.id === editId ? { ...form, id: editId } : r))
    } else {
      setRows([...rows, { ...form, id: Date.now() }])
    }
    cancel()
  }

  const toggleActive = (id) => setRows(rows.map(r => r.id === id ? {...r, active: !r.active} : r))

  const inp = (field, extra={}) => ({
    value: form[field] ?? '',
    onChange: e => setForm(f => ({...f, [field]: e.target.value})),
    style: {
      width:'100%', padding:'8px 10px', border:'1.5px solid #E0D5E0',
      borderRadius:5, fontSize:13, fontFamily:'DM Sans,sans-serif',
      outline:'none', boxSizing:'border-box', ...extra
    },
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
          </p>
        </div>
        <button onClick={openNew} style={{
          padding:'8px 18px', background:'#714B67', color:'#fff',
          border:'none', borderRadius:6, fontSize:13, fontWeight:700,
          cursor:'pointer', fontFamily:'DM Sans,sans-serif'
        }}>+ New UOM</button>
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

      {/* Table */}
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
                    background:'#EDE0EA', color:'#714B67' }}>{r.type}</span>
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
                  <button onClick={() => openEdit(r)} style={{
                    padding:'4px 12px', background:'#714B67', color:'#fff',
                    border:'none', borderRadius:4, fontSize:12, cursor:'pointer', marginRight:6
                  }}>Edit</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding:32, textAlign:'center', color:'#6C757D', fontSize:13 }}>
                No UOMs found
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'#fff', borderRadius:10, width:480,
            boxShadow:'0 20px 60px rgba(0,0,0,.2)', overflow:'hidden' }}>

            {/* Modal Header */}
            <div style={{ background:'#714B67', padding:'14px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ color:'#fff', fontFamily:'Syne,sans-serif',
                fontSize:15, fontWeight:700, margin:0 }}>
                {editId ? 'Edit UOM' : 'New Unit of Measure'}
              </h3>
              <span onClick={cancel} style={{ color:'rgba(255,255,255,.7)',
                cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</span>
            </div>

            {/* Modal Body */}
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#1C1C1C',
                    display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>
                    UOM Code *
                  </label>
                  <input {...inp('code')} placeholder="e.g. KG" maxLength={10}
                    style={{ ...inp('code').style, textTransform:'uppercase' }} />
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
                <input type='checkbox' id='uom_active'
                  checked={form.active}
                  onChange={e => setForm(f => ({...f, active: e.target.checked}))}
                  style={{ accentColor:'#714B67', width:15, height:15 }} />
                <label htmlFor='uom_active' style={{ fontSize:13, color:'#1C1C1C', cursor:'pointer' }}>
                  Active
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
              display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
              <button onClick={cancel} style={{
                padding:'8px 18px', background:'#fff', color:'#6C757D',
                border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:13,
                cursor:'pointer', fontFamily:'DM Sans,sans-serif'
              }}>Cancel</button>
              <button onClick={save} style={{
                padding:'8px 18px', background:'#714B67', color:'#fff',
                border:'none', borderRadius:5, fontSize:13, fontWeight:700,
                cursor:'pointer', fontFamily:'DM Sans,sans-serif'
              }}>💾 Save UOM</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
