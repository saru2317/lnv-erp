import React, { useState } from 'react'
import { CURRENCIES } from './_configData'

export default function CurrencyConfig() {
  const [currencies, setCurrencies] = useState(CURRENCIES)
  const [showForm,   setShowForm]   = useState(false)
  const [editCode,   setEditCode]   = useState(null)
  const [form, setForm] = useState({ code:'', name:'', symbol:'', rate:'', status:'Active' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.code || !form.name || !form.rate) { alert('Code, name and rate required'); return }
    if (editCode) {
      setCurrencies(cs => cs.map(c => c.code===editCode ? {...c,...form,rate:parseFloat(form.rate)} : c))
      setEditCode(null)
    } else {
      setCurrencies(cs => [...cs, {...form, rate:parseFloat(form.rate), isBase:false}])
    }
    setForm({ code:'', name:'', symbol:'', rate:'', status:'Active' })
    setShowForm(false)
  }

  const handleEdit = c => {
    setForm({ code:c.code, name:c.name, symbol:c.symbol, rate:c.rate, status:c.status })
    setEditCode(c.code); setShowForm(true)
  }

  const base = currencies.find(c => c.isBase)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Currency Configuration <small>Multi-currency · Exchange rates</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={() => { setEditCode(null); setShowForm(true) }}>+ Add Currency</button>
        </div>
      </div>

      {/* Base currency card */}
      <div style={{ padding:'14px 16px', background:'linear-gradient(135deg,var(--odoo-blue),#014F86)', borderRadius:'10px', color:'#fff', marginBottom:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <div style={{ fontSize:'40px' }}>{base?.symbol}</div>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:'800', fontSize:'16px' }}>{base?.name} — Base Currency</div>
            <div style={{ fontSize:'12px', opacity:.85 }}>All transactions stored in {base?.code}. Exchange rates are relative to 1 {base?.code}.</div>
          </div>
          <div style={{ marginLeft:'auto', padding:'6px 14px', background:'rgba(255,255,255,.2)', borderRadius:'8px', fontSize:'12px', fontWeight:'700' }}>
            🔒 Cannot change base currency
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fi-panel" style={{ marginBottom:'16px', border:'2px solid var(--odoo-purple)' }}>
          <div className="fi-panel-hdr"><h3>{editCode ? '✏️ Edit Currency' : '➕ Add Currency'}</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field"><label>Currency Code *</label><input value={form.code} onChange={e=>set('code',e.target.value.toUpperCase())} placeholder="USD" maxLength={3} style={{fontFamily:'DM Mono,monospace',textTransform:'uppercase'}} disabled={!!editCode} /></div>
              <div className="sd-field"><label>Currency Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="US Dollar" /></div>
              <div className="sd-field"><label>Symbol *</label><input value={form.symbol} onChange={e=>set('symbol',e.target.value)} placeholder="$" maxLength={4} /></div>
              <div className="sd-field">
                <label>Exchange Rate (1 {base?.code} = ? {form.code||'CCY'})</label>
                <input type="number" value={form.rate} onChange={e=>set('rate',e.target.value)} placeholder="e.g. 0.012" step="0.001" />
              </div>
              <div className="sd-field">
                <label>Status</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)}><option>Active</option><option>Inactive</option></select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
              <button className="btn btn-p btn-s" onClick={handleSave}>✓ {editCode?'Update':'Add'}</button>
              <button className="btn btn-s sd-bsm" onClick={() => { setShowForm(false); setEditCode(null) }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Currency cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'10px' }}>
        {currencies.filter(c => !c.isBase).map(c => (
          <div key={c.code} style={{ padding:'14px 16px', background:'#fff', borderRadius:'10px',
            border:`1px solid ${c.status==='Active'?'var(--odoo-border)':'#E0E0E0'}`,
            opacity: c.status === 'Inactive' ? 0.6 : 1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'8px', background:'var(--odoo-purple)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'16px', fontWeight:'900' }}>{c.symbol}</div>
              <div>
                <div style={{ fontWeight:'700', fontSize:'13px' }}>{c.name}</div>
                <div style={{ fontFamily:'DM Mono,monospace', fontSize:'11px', color:'var(--odoo-gray)' }}>{c.code}</div>
              </div>
              <span style={{ marginLeft:'auto', padding:'2px 7px', borderRadius:'6px', fontSize:'10px', fontWeight:'700',
                background:c.status==='Active'?'#E8F5E9':'#F5F5F5', color:c.status==='Active'?'#2E7D32':'#757575' }}>
                {c.status}
              </span>
            </div>
            <div style={{ padding:'8px 10px', background:'#F8F9FA', borderRadius:'6px', marginBottom:'10px' }}>
              <div style={{ fontSize:'11px', color:'var(--odoo-gray)', marginBottom:'2px' }}>Exchange Rate</div>
              <div style={{ fontFamily:'DM Mono,monospace', fontWeight:'700', fontSize:'13px' }}>
                1 {base?.code} = <span style={{ color:'var(--odoo-orange)', fontSize:'16px' }}>{c.rate}</span> {c.code}
              </div>
              <div style={{ fontSize:'10px', color:'var(--odoo-gray)', marginTop:'2px' }}>
                1 {c.code} = ₹{(1/c.rate*base?.rate || 0).toFixed(4)}
              </div>
            </div>
            <button className="btn-act-edit" onClick={() => handleEdit(c)} style={{ width:'100%', textAlign:'center', justifyContent:'center' }}>Update Rate</button>
          </div>
        ))}
      </div>
    </div>
  )
}
