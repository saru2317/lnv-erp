import React, { useState } from 'react'
import toast from 'react-hot-toast'

export default function BOMList() {
  const [showNew, setShowNew] = useState(false)
  const [search,  setSearch]  = useState('')
  const [form,    setForm]    = useState({})

  const ROWS = [
    ['BOM-001', 'Powder Coated Assembly A', 'Finished Good', '5 components', '100', 'Nos', 'Rev 2.0', 'Active'],
    ['BOM-002', 'Surface Treated Bracket Set', 'Finished Good', '3 components', '50', 'Set', 'Rev 1.5', 'Active'],
    ['BOM-003', 'ARISER COMFACT SYSTEM', 'Trading Item', '8 components', '1', 'Nos', 'Rev 3.0', 'Active'],
    ['BOM-004', 'Compact Spares Set', 'Kit Assembly', '6 components', '1', 'Set', 'Rev 1.0', 'Active'],
    ['BOM-005', 'Job Work Assembly B', 'Semi-Finished', '4 components', '200', 'Nos', 'Rev 1.0', 'Inactive'],
  ]

  const filtered = ROWS.filter(r =>
    r.join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const save = () => {
    if (!form.bomNo) return toast.error('BOM Number required')
    toast.success('Record saved!')
    setShowNew(false); setForm({})
  }

  const inp = { padding:'7px 10px', border:'1px solid var(--odoo-border)',
    borderRadius:5, fontSize:12, outline:'none', width:'100%' }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Bill of Materials <small>SAP: CS01/CS03</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p" onClick={() => { setShowNew(true); setForm({}) }}>+ New</button>
        </div>
      </div>

      <div style={{ padding:'8px 12px', background:'#E6F7F7', border:'1px solid #00A09D',
        borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
        <strong>Bill of Materials</strong> — Product structure with components and quantities
      </div>

      {showNew && (
        <div style={{ background:'#fff', border:'1px solid var(--odoo-purple)',
          borderRadius:8, marginBottom:16, overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', background:'var(--odoo-purple)',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>New Bill of Materials</span>
            <button onClick={() => setShowNew(false)}
              style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:18 }}>x</button>
          </div>
          <div style={{ padding:16, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px 16px' }}>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>BOM Number</label>
              <input style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                value={form.bomNo || ''} onChange={e => setForm(p => ({ ...p, bomNo: e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>Product Name</label>
              <input style={{ ...inp }}
                value={form.product || ''} onChange={e => setForm(p => ({ ...p, product: e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>Category</label>
              <input style={{ ...inp }}
                value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>Base Qty</label>
              <input style={{ ...inp }}
                value={form.baseQty || ''} onChange={e => setForm(p => ({ ...p, baseQty: e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>Revision</label>
              <input style={{ ...inp }}
                value={form.revision || ''} onChange={e => setForm(p => ({ ...p, revision: e.target.value }))} />
            </div>
            <div style={{ gridColumn:'1 / -1', display:'flex', gap:8,
              paddingTop:8, borderTop:'1px solid var(--odoo-border)' }}>
              <button className="btn btn-p" onClick={save}>Save</button>
              <button className="btn btn-s" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:'6px 12px', border:'1px solid var(--odoo-border)',
            borderRadius:6, fontSize:12, outline:'none', width:300 }} />
        <span style={{ fontSize:11, color:'var(--odoo-gray)', marginLeft:'auto' }}>
          {filtered.length} records
        </span>
      </div>

      <table className="fi-data-table">
        <thead>
          <tr>
            <th>BOM No</th>
            <th>Product</th>
            <th>Category</th>
            <th>Components</th>
            <th>Qty</th>
            <th>UOM</th>
            <th>Revision</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={i} style={{ background: i%2===0 ? '#fff' : '#FAFAFA' }}>
              <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700,
                color:'var(--odoo-purple)', fontSize:12 }}>{r[0]}</td>
              <td style={{ fontWeight:600, fontSize:12 }}>{r[1]}</td>
              <td style={{ fontSize:11 }}>{r[2]}</td>
              <td style={{ fontSize:11 }}>{r[3]}</td>
              <td style={{ fontSize:11 }}>{r[4]}</td>
              <td style={{ fontSize:11 }}>{r[5]}</td>
              <td style={{ fontSize:11 }}>{r[6]}</td>
              <td>
                <span style={{
                  padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:600,
                  background: r[7]==='Active' ? '#D4EDDA' : '#F5F5F5',
                  color: r[7]==='Active' ? '#155724' : '#666'
                }}>{r[7]}</span>
              </td>
              <td>
                <button
                  onClick={() => toast.success('Edit BOMList')}
                  style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                    border:'1px solid var(--odoo-purple)', background:'var(--odoo-purple-lt)',
                    color:'var(--odoo-purple)', cursor:'pointer' }}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}