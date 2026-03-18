import React, { useState } from 'react'
import { COMPANY } from './_configData'

const INDUSTRIES = ['Surface Treatment / Coating','Heat Treatment','Injection Moulding','Fabrication / Sheet Metal',
  'Metal Manufacturing','Textile / Spinning','Food Processing','Pharma','Chemical / Coating','Assembly Job Work','Printing','General Manufacturing']
const COMPANY_TYPES = ['Private Limited','Public Limited','LLP','Partnership','Proprietorship','OPC']
const FISCAL_STARTS = ['January','April','July','October']
const DATE_FORMATS = ['DD-MM-YYYY','MM-DD-YYYY','YYYY-MM-DD','DD/MM/YYYY']
const TIMEZONES = ['Asia/Kolkata','Asia/Dubai','Asia/Singapore','Europe/London','America/New_York']

export default function CompanyProfile() {
  const [form, setForm]   = useState(COMPANY)
  const [tab,  setTab]    = useState('basic')
  const [saved, setSaved] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const TABS = [
    { key:'basic',    label:'🏢 Basic Info'   },
    { key:'address',  label:'📍 Address'      },
    { key:'statutory',label:'📋 Statutory'    },
    { key:'settings', label:'⚙️ Preferences'  },
  ]

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Company Profile <small>Legal entity, registration & preferences</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={handleSave}>
            {saved ? '✅ Saved!' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Logo banner */}
      <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'14px 16px',
        background:'#F8F9FA', borderRadius:'10px', marginBottom:'16px', border:'1px solid var(--odoo-border)' }}>
        <div style={{ width:'64px', height:'64px', borderRadius:'12px', background:'var(--odoo-purple)',
          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
          fontSize:'20px', fontWeight:'900', fontFamily:'Syne,sans-serif', flexShrink:0 }}>
          {form.shortName}
        </div>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:'800', fontSize:'16px' }}>{form.name}</div>
          <div style={{ fontSize:'12px', color:'var(--odoo-gray)', marginTop:'2px' }}>
            {form.type} &nbsp;·&nbsp; {form.industry} &nbsp;·&nbsp; Est. {form.founded}
          </div>
        </div>
        <button className="btn btn-s sd-bsm" style={{ marginLeft:'auto' }}>📷 Upload Logo</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0', marginBottom:'16px', borderBottom:'2px solid var(--odoo-border)' }}>
        {TABS.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'8px 18px', cursor:'pointer', fontSize:'12px', fontWeight:'700', transition:'all .15s',
              borderBottom: tab===t.key ? '2px solid var(--odoo-purple)' : '2px solid transparent',
              color: tab===t.key ? 'var(--odoo-purple)' : 'var(--odoo-gray)', marginBottom:'-2px' }}>
            {t.label}
          </div>
        ))}
      </div>

      <div className="fi-panel">
        <div className="fi-panel-body">

          {tab === 'basic' && (
            <div className="sd-form-grid">
              <div className="sd-field" style={{ gridColumn:'1/-1' }}>
                <label>Company Full Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="sd-field">
                <label>Short Name / Abbreviation</label>
                <input value={form.shortName} onChange={e => set('shortName', e.target.value)} maxLength={6} placeholder="Max 6 chars" />
              </div>
              <div className="sd-field">
                <label>Legal Name (as per ROC)</label>
                <input value={form.legalName} onChange={e => set('legalName', e.target.value)} />
              </div>
              <div className="sd-field">
                <label>Company Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)}>
                  {COMPANY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="sd-field">
                <label>Industry / Sector</label>
                <select value={form.industry} onChange={e => set('industry', e.target.value)}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="sd-field">
                <label>Year Founded</label>
                <input value={form.founded} onChange={e => set('founded', e.target.value)} placeholder="YYYY" />
              </div>
              <div className="sd-field">
                <label>Company Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="sd-field">
                <label>Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="sd-field">
                <label>Website</label>
                <input value={form.website} onChange={e => set('website', e.target.value)} />
              </div>
            </div>
          )}

          {tab === 'address' && (
            <div className="sd-form-grid">
              <div className="sd-field" style={{ gridColumn:'1/-1' }}>
                <label>Street Address</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div className="sd-field">
                <label>City</label>
                <input value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div className="sd-field">
                <label>State</label>
                <input value={form.state} onChange={e => set('state', e.target.value)} />
              </div>
              <div className="sd-field">
                <label>Pincode</label>
                <input value={form.pincode} onChange={e => set('pincode', e.target.value)} maxLength={6} />
              </div>
              <div className="sd-field">
                <label>Country</label>
                <input value={form.country} onChange={e => set('country', e.target.value)} />
              </div>
            </div>
          )}

          {tab === 'statutory' && (
            <div className="sd-form-grid">
              <div className="sd-field">
                <label>GSTIN</label>
                <input value={form.gstin} onChange={e => set('gstin', e.target.value)} style={{ fontFamily:'DM Mono,monospace' }} maxLength={15} />
              </div>
              <div className="sd-field">
                <label>PAN</label>
                <input value={form.pan} onChange={e => set('pan', e.target.value)} style={{ fontFamily:'DM Mono,monospace' }} maxLength={10} />
              </div>
              <div className="sd-field">
                <label>CIN</label>
                <input value={form.cin} onChange={e => set('cin', e.target.value)} style={{ fontFamily:'DM Mono,monospace' }} />
              </div>
              <div style={{ gridColumn:'1/-1', padding:'10px 14px', background:'#FFF3CD', borderRadius:'6px', fontSize:'12px', color:'#856404' }}>
                💡 GSTIN format: 2-digit state code + PAN + entity number + Z + check digit (e.g. 33AABCL1234F1Z5)
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="sd-form-grid">
              <div className="sd-field">
                <label>Fiscal Year Start</label>
                <select value={form.fiscalStart} onChange={e => set('fiscalStart', e.target.value)}>
                  {FISCAL_STARTS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="sd-field">
                <label>Base Currency</label>
                <input value={form.currency} disabled style={{ background:'#F8F9FA' }} />
                <span style={{ fontSize:'10px', color:'var(--odoo-gray)' }}>Change in Currency module</span>
              </div>
              <div className="sd-field">
                <label>Timezone</label>
                <select value={form.timezone} onChange={e => set('timezone', e.target.value)}>
                  {TIMEZONES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="sd-field">
                <label>Date Format</label>
                <select value={form.dateFormat} onChange={e => set('dateFormat', e.target.value)}>
                  {DATE_FORMATS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
