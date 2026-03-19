import React, { useState } from 'react'
import toast from 'react-hot-toast'

export default function HRMaster() {
  const [showNew, setShowNew] = useState(false)
  const [search,  setSearch]  = useState('')
  const [form,    setForm]    = useState({})

  const ROWS = [
    ['PC-001', 'Basic Salary', 'Pay Component', 'Monthly Earning', 'Yes', 'Active'],
    ['PC-002', 'House Rent Allowance', 'Pay Component', '40 pct of Basic', 'Partial', 'Active'],
    ['PC-003', 'Transport Allowance', 'Pay Component', 'Fixed 1600/month', 'Exempt', 'Active'],
    ['PC-004', 'Provident Fund Employee', 'Pay Component', '12 pct Deduction', 'No', 'Active'],
    ['PC-005', 'ESI Employee', 'Pay Component', '0.75 pct Deduction', 'No', 'Active'],
    ['LT-001', 'Casual Leave', 'Leave Type', '12 days/year Paid', '—', 'Active'],
    ['LT-002', 'Sick Leave', 'Leave Type', '12 days/year Paid', '—', 'Active'],
    ['LT-003', 'Earned Leave', 'Leave Type', '15 days Encashable', '—', 'Active'],
    ['SG-001', 'Operator Grade 1', 'Salary Grade', '10000 to 18000', '—', 'Active'],
    ['SG-002', 'Senior Operator', 'Salary Grade', '18000 to 28000', '—', 'Active'],
    ['SH-001', 'General Shift', 'Shift', '8:30 AM to 5:30 PM', '—', 'Active'],
  ]

  const filtered = ROWS.filter(r =>
    r.join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const save = () => {
    if (!form.code) return toast.error('Code required')
    toast.success('Record saved!')
    setShowNew(false); setForm({})
  }

  const inp = { padding:'7px 10px', border:'1px solid var(--odoo-border)',
    borderRadius:5, fontSize:12, outline:'none', width:'100%' }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">HR Masters <small>SAP: PA20 / PE51</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p" onClick={() => { setShowNew(true); setForm({}) }}>+ New</button>
        </div>
      </div>

      <div style={{ padding:'8px 12px', background:'#E6F7F7', border:'1px solid #00A09D',
        borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
        <strong>HR Masters</strong> — Pay components, salary grades, leave types and shifts
      </div>

      {showNew && (
        <div style={{ background:'#fff', border:'1px solid var(--odoo-purple)',
          borderRadius:8, marginBottom:16, overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', background:'var(--odoo-purple)',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>New HR Masters</span>
            <button onClick={() => setShowNew(false)}
              style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:18 }}>x</button>
          </div>
          <div style={{ padding:16, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px 16px' }}>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>Code</label>
              <input style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                value={form.code || ''} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>Name</label>
              <input style={{ ...inp }}
                value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>Details</label>
              <input style={{ ...inp }}
                value={form.details || ''} onChange={e => setForm(p => ({ ...p, details: e.target.value }))} />
            </div>
            <div className="sd-fg">
              <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
                display:'block', marginBottom:4 }}>Amount / Rate</label>
              <input style={{ ...inp }}
                value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
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
            <th>Name</th>
            <th>Type</th>
            <th>Details</th>
            <th>Taxable</th>
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
              <td>
                <span style={{
                  padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:600,
                  background: r[5]==='Active' ? '#D4EDDA' : '#F5F5F5',
                  color: r[5]==='Active' ? '#155724' : '#666'
                }}>{r[5]}</span>
              </td>
              <td>
                <button
                  onClick={() => toast.success('Edit HRMaster')}
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