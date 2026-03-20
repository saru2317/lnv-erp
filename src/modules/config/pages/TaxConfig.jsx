import React, { useState } from 'react'
import { TAX_RATES, HSN_CODES } from './_configData'

export default function TaxConfig() {
  const [taxes,    setTaxes]    = useState(TAX_RATES)
  const [hsn,      setHsn]      = useState(HSN_CODES)
  const [tab,      setTab]      = useState('gst')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', rate:'', type:'GST', cgst:'', sgst:'', igst:'', cess:'0', status:'Active', applicableTo:'' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleRateChange = v => {
    const r = parseFloat(v) || 0
    set('rate', v)
    if (form.type === 'GST') {
      setForm(f => ({ ...f, rate:v, cgst:r/2, sgst:r/2, igst:r, name:`GST ${v}%` }))
    }
  }

  const handleSave = () => {
    if (!form.name || !form.rate) { alert('Name and rate required'); return }
    const id = `TAX-${String(taxes.length+1).padStart(3,'0')}`
    setTaxes(t => [...t, { id, ...form, rate:parseFloat(form.rate), cgst:parseFloat(form.cgst||0), sgst:parseFloat(form.sgst||0), igst:parseFloat(form.igst||0), cess:parseFloat(form.cess||0) }])
    setForm({ name:'', rate:'', type:'GST', cgst:'', sgst:'', igst:'', cess:'0', status:'Active', applicableTo:'' })
    setShowForm(false)
  }

  const gstRates = taxes.filter(t => t.type === 'GST')
  const tdsRates = taxes.filter(t => t.type === 'TDS')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Tax & GST Configuration <small>Rate master for all tax calculations</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={() => setShowForm(!showForm)}>+ Add Tax Rate</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:'16px', borderBottom:'2px solid var(--odoo-border)' }}>
        {[['gst',' GST Rates'],['tds',' TDS Rates'],['hsn',' HSN Codes']].map(([k,l]) => (
          <div key={k} onClick={()=>setTab(k)}
            style={{ padding:'8px 18px', cursor:'pointer', fontSize:'12px', fontWeight:'700',
              borderBottom: tab===k ? '2px solid var(--odoo-purple)' : '2px solid transparent',
              color: tab===k ? 'var(--odoo-purple)' : 'var(--odoo-gray)', marginBottom:'-2px' }}>{l}</div>
        ))}
      </div>

      {showForm && tab !== 'hsn' && (
        <div className="fi-panel" style={{ marginBottom:'16px', border:'2px solid var(--odoo-purple)' }}>
          <div className="fi-panel-hdr"><h3>New Tax Rate</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field">
                <label>Tax Type</label>
                <select value={form.type} onChange={e=>set('type',e.target.value)}><option>GST</option><option>TDS</option></select>
              </div>
              <div className="sd-field">
                <label>Rate (%)*</label>
                <input type="number" value={form.rate} onChange={e=>handleRateChange(e.target.value)} placeholder="e.g. 18" />
              </div>
              <div className="sd-field"><label>Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. GST 18%" /></div>
              <div className="sd-field"><label>Applicable To</label><input value={form.applicableTo} onChange={e=>set('applicableTo',e.target.value)} placeholder="e.g. Industrial Goods" /></div>
              {form.type === 'GST' && (<>
                <div className="sd-field"><label>CGST (%)</label><input value={form.cgst} onChange={e=>set('cgst',e.target.value)} /></div>
                <div className="sd-field"><label>SGST (%)</label><input value={form.sgst} onChange={e=>set('sgst',e.target.value)} /></div>
                <div className="sd-field"><label>IGST (%)</label><input value={form.igst} onChange={e=>set('igst',e.target.value)} /></div>
                <div className="sd-field"><label>CESS (%)</label><input value={form.cess} onChange={e=>set('cess',e.target.value)} /></div>
              </>)}
            </div>
            <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
              <button className="btn btn-p btn-s" onClick={handleSave}> Save</button>
              <button className="btn btn-s sd-bsm" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'gst' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px', marginBottom:'16px' }}>
            {gstRates.map(t => (
              <div key={t.id} style={{ padding:'14px', background:'#fff', borderRadius:'10px', border:'1px solid var(--odoo-border)',
                borderTop:`4px solid var(--odoo-purple)`, textAlign:'center' }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:'900', fontSize:'24px', color:'var(--odoo-purple)' }}>{t.rate}%</div>
                <div style={{ fontSize:'11px', fontWeight:'700', marginBottom:'8px' }}>{t.name}</div>
                <div style={{ display:'flex', justifyContent:'center', gap:'6px', flexWrap:'wrap', marginBottom:'8px' }}>
                  {[['CGST',t.cgst],['SGST',t.sgst],['IGST',t.igst]].map(([l,v]) => (
                    <span key={l} style={{ fontSize:'10px', padding:'1px 5px', background:'#EDE0EA', borderRadius:'4px', color:'var(--odoo-purple)', fontWeight:'700' }}>
                      {l} {v}%
                    </span>
                  ))}
                </div>
                <div style={{ fontSize:'10px', color:'var(--odoo-gray)' }}>{t.applicableTo}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'tds' && (
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead><tr><th>Name</th><th>Rate</th><th>Applicable To</th><th>Status</th></tr></thead>
            <tbody>
              {tdsRates.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td><span style={{ fontFamily:'DM Mono,monospace', fontWeight:'800', color:'var(--odoo-orange)', fontSize:'14px' }}>{t.rate}%</span></td>
                  <td style={{ fontSize:'12px' }}>{t.applicableTo}</td>
                  <td><span style={{ padding:'3px 8px', borderRadius:'8px', fontSize:'10px', fontWeight:'700', background:'#E8F5E9', color:'#2E7D32' }}>● {t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'hsn' && (
        <div>
          <div style={{ marginBottom:'12px', display:'flex', gap:'8px' }}>
            <button className="btn btn-p btn-s" onClick={() => {
              const code = prompt('HSN Code:'); const desc = prompt('Description:'); const rate = prompt('GST Rate (%):')
              if (code && desc && rate) setHsn(h => [...h, { code, desc, gstRate:parseFloat(rate), type:'Goods' }])
            }}>+ Add HSN Code</button>
          </div>
          <div className="sd-table-wrap">
            <table className="sd-table">
              <thead><tr><th>HSN Code</th><th>Description</th><th>Type</th><th>GST Rate</th></tr></thead>
              <tbody>
                {hsn.map(h => (
                  <tr key={h.code}>
                    <td><span style={{ fontFamily:'DM Mono,monospace', fontWeight:'800', color:'var(--odoo-purple)' }}>{h.code}</span></td>
                    <td style={{ fontSize:'12px' }}>{h.desc}</td>
                    <td><span style={{ padding:'2px 7px', borderRadius:'6px', fontSize:'10px', fontWeight:'700',
                      background:h.type==='Goods'?'#E3F2FD':'#F3E5F5', color:h.type==='Goods'?'#1565C0':'#6A1B9A' }}>{h.type}</span></td>
                    <td><span style={{ fontFamily:'DM Mono,monospace', fontWeight:'800', color:'var(--odoo-orange)' }}>{h.gstRate}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
