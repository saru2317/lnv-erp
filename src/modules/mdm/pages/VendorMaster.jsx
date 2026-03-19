import React, { useState } from 'react'
import toast from 'react-hot-toast'

export default function VendorMaster() {
  const [showNew, setShowNew] = useState(false)
  const [search,  setSearch]  = useState('')
  const [form,    setForm]    = useState({})

  const ROWS = [
    ['V-001', 'Lakshmi Textile Mills Pvt Ltd', '33AAACL1234F1Z5', 'Coimbatore', 'Raw Material', 'Net 30', 'Active'],
    ['V-002', 'Coimbatore Spares Co.', '33AAACS5678P1Z5', 'Coimbatore', 'Spare Parts', 'Advance', 'Active'],
    ['V-003', 'Sri Murugan Traders', '33AAASM9012Q1Z5', 'Coimbatore', 'Chemicals', 'Net 15', 'Active'],
    ['V-004', 'Chennai Chemicals Ltd', '33AAACC3456R1Z2', 'Chennai', 'Chemicals', 'Net 30', 'Active'],
    ['V-005', 'KG Denim Ltd', '33AAACKG789S1Z1', 'Erode', 'Raw Material', 'Net 45', 'Active'],
    ['V-006', 'Aruna Industries', '33AAACI0123T1Z8', 'Salem', 'Packing', 'Net 30', 'Active'],
  ]

  const filtered = ROWS.filter(r =>
    r.join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const save = () => {
    if (!form.code) return toast.error('Vendor Code required')
    toast.success('Record saved!')
    setShowNew(false); setForm({})
  }

  const inp = { padding:'7px 10px', border:'1px solid var(--odoo-border)',
    borderRadius:5, fontSize:12, outline:'none', width:'100%' }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Vendor Master <small>SAP: XK01/XK03</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p" onClick={() => { setShowNew(true); setForm({}) }}>+ New</button>
        </div>
      </div>

      <div style={{ padding:'8px 12px', background:'#E6F7F7', border:'1px solid #00A09D',
        borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
        <strong>Vendor Master</strong> — All suppliers with payment terms and GST info
      </div>

      {showNew && (
        <div style={{ background:'#fff', border:'1px solid var(--odoo-purple)',
          borderRadius:8, marginBottom:16, overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', background:'var(--odoo-purple)',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>New Vendor Master</span>
            <button onClick={() => setShowNew(false)}
              style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:18 }}>x</button>
          </div>
          <div style={{ padding:16, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px 16px' }}>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>Vendor Code</label>
              <input style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                value={form.code || ''} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>Vendor Name</label>
              <input style={{ ...inp }}
                value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>GSTIN</label>
              <input style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                value={form.gstin || ''} onChange={e => setForm(p => ({ ...p, gstin: e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>Mobile</label>
              <input style={{ ...inp }}
                value={form.mobile || ''} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>City</label>
              <input style={{ ...inp }}
                value={form.city || ''} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
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
            <th>Code</th>
            <th>Vendor Name</th>
            <th>GSTIN</th>
            <th>City</th>
            <th>Category</th>
            <th>Pay Terms</th>
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
              <td>
                <span style={{
                  padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:600,
                  background: r[6]==='Active' ? '#D4EDDA' : '#F5F5F5',
                  color: r[6]==='Active' ? '#155724' : '#666'
                }}>{r[6]}</span>
              </td>
              <td>
                <button
                  onClick={() => toast.success('Edit VendorMaster')}
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