import React, { useState } from 'react'
import { COMPANY } from './_configData'
import { useAuth } from '@context/AuthContext'

const INDUSTRIES = ['Surface Treatment / Coating','Heat Treatment','Injection Moulding','Fabrication / Sheet Metal',
  'Metal Manufacturing','Textile / Spinning','Food Processing','Pharma','Chemical / Coating','Assembly Job Work','Printing','General Manufacturing']
const COMPANY_TYPES = ['Private Limited','Public Limited','LLP','Partnership','Proprietorship','OPC']
const FISCAL_STARTS = ['January','April','July','October']
const DATE_FORMATS = ['DD-MM-YYYY','MM-DD-YYYY','YYYY-MM-DD','DD/MM/YYYY']
const TIMEZONES = ['Asia/Kolkata','Asia/Dubai','Asia/Singapore','Europe/London','America/New_York']

const ALWAYS_ON_MODULES = [
  { k:'home',    icon:'🏠', name:'Home Dashboard',  desc:'Always visible — system core' },
  { k:'admin',   icon:'👤', name:'Admin',            desc:'Always visible — system core' },
  { k:'config',  icon:'⚙️', name:'Config',           desc:'Always visible — system core' },
  { k:'reports', icon:'📊', name:'Reports',          desc:'Always visible — system core' },
  { k:'mdm',     icon:'🗄️', name:'MDM',              desc:'Always visible — master data' },
]

const ALL_MODULES = [
  { k:'sd',    icon:'🛒', name:'Sales (SD)',        desc:'Orders, Invoices, Deliveries'     },
  { k:'mm',    icon:'📦', name:'Purchase (MM)',     desc:'PO, GRN, Vendor Invoices'         },
  { k:'wm',    icon:'🏭', name:'Warehouse (WM)',    desc:'Stock, Transfers, Gate Entry'     },
  { k:'fi',    icon:'💰', name:'Finance (FI)',      desc:'GL, GST, AP/AR, Vouchers'         },
  { k:'pp',    icon:'⚙️', name:'Production (PP)',   desc:'Work Orders, BOM, COGM'           },
  { k:'qm',    icon:'✅', name:'Quality (QM)',      desc:'Inspection, NCR, CAPA'            },
  { k:'pm',    icon:'🔧', name:'Maintenance (PM)',  desc:'Breakdown, PM Schedule'           },
  { k:'hcm',   icon:'👥', name:'HR (HCM)',          desc:'Payroll, Leave, Attendance'       },
  { k:'crm',   icon:'🤝', name:'CRM',               desc:'Leads, Follow-ups, Pipeline'      },
  { k:'am',    icon:'🏗️', name:'Assets (AM)',       desc:'Fixed Assets, Depreciation'       },
  { k:'tm',    icon:'🚛', name:'Transport (TM)',    desc:'Trips, Vehicles, Fleet'           },
  { k:'vm',    icon:'🪪', name:'Visitor (VM)',      desc:'Gate Pass, Visitor Log'           },
  { k:'cn',    icon:'🍽️', name:'Canteen (CN)',      desc:'Meal Tracking, Subsidy'           },
  { k:'civil', icon:'👷', name:'Civil',             desc:'Site Projects, Materials'         },
  { k:'kpi',   icon:'🎯', name:'KPI / KRA',         desc:'Performance, Targets'             },
]

export default function CompanyProfile() {
  const { isSuperAdmin } = useAuth()
  const [form,    setForm]    = useState(COMPANY)
  const [tab,     setTab]     = useState('basic')
  const [saved,   setSaved]   = useState(false)
  const [modules, setModules] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lnv_active_modules') || 'null') || ALL_MODULES.map(m=>m.k) }
    catch { return ALL_MODULES.map(m=>m.k) }
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleModule = (k) => {
    setModules(prev => {
      const next = prev.includes(k) ? prev.filter(m=>m!==k) : [...prev, k]
      localStorage.setItem('lnv_active_modules', JSON.stringify(next))
      return next
    })
  }

  const handleSave = () => {
    localStorage.setItem('lnv_company', JSON.stringify(form))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const TABS = [
    { key:'basic',    label:' Basic Info'   },
    { key:'address',  label:' Address'      },
    { key:'statutory',label:' Statutory'    },
    { key:'settings', label:' Preferences'  },
    { key:'modules',  label:'⚙️ Modules', superAdminOnly:true },
  ]

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Company Profile <small>Legal entity, registration & preferences</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={handleSave}>
            {saved ? ' Saved!' : ' Save Changes'}
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
        <button className="btn btn-s sd-bsm" style={{ marginLeft:'auto' }}> Upload Logo</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0', marginBottom:'16px', borderBottom:'2px solid var(--odoo-border)' }}>
        {TABS.filter(t => !t.superAdminOnly || isSuperAdmin).map(t => (
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
                 GSTIN format: 2-digit state code + PAN + entity number + Z + check digit (e.g. 33AABCL1234F1Z5)
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
          )}

          {/* ── Modules Tab ── */}
          {tab === 'modules' && (
            <div>
              {!isSuperAdmin ? (
                <div style={{padding:60,textAlign:'center'}}>
                  <div style={{fontSize:48,marginBottom:12}}>🔒</div>
                  <div style={{fontSize:18,fontWeight:700,color:'#1C1C1C',marginBottom:8}}>Super Admin Only</div>
                  <div style={{fontSize:13,color:'#6C757D',maxWidth:360,margin:'0 auto'}}>
                    Module activation is controlled by <strong>LNV Infotech</strong>.<br/>
                    Contact <code>admin@lnverp.com</code> to enable or disable modules.
                  </div>
                </div>
              ) : (
              <>
              <div style={{marginBottom:12,color:'#6C757D',fontSize:12}}>
                Enable or disable modules for your company. Disabled modules will be hidden from all users.
              </div>

              {/* Always-on core modules */}
              <div style={{marginBottom:14,padding:'10px 14px',background:'#E8F5E9',
                border:'1px solid #A5D6A7',borderRadius:8}}>
                <div style={{fontSize:11,fontWeight:700,color:'#2E7D32',marginBottom:8}}>
                  🔒 Core Modules — Always Active (cannot be disabled)
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {ALWAYS_ON_MODULES.map(m=>(
                    <div key={m.k} style={{display:'flex',alignItems:'center',gap:6,
                      padding:'5px 12px',background:'#fff',borderRadius:6,
                      border:'1.5px solid #A5D6A7',fontSize:12}}>
                      <span>{m.icon}</span>
                      <span style={{fontWeight:700,color:'#2E7D32'}}>{m.name}</span>
                      <span style={{fontSize:10,color:'#2E7D32'}}>✅</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{fontSize:11,fontWeight:700,color:'#6C757D',
                textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>
                Optional Modules — Toggle On / Off
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {ALL_MODULES.map(m => {
                  const active = modules.includes(m.k)
                  return (
                    <div key={m.k}
                      onClick={() => toggleModule(m.k)}
                      style={{
                        border:`2px solid ${active?'#714B67':'#E0D5E0'}`,
                        borderRadius:8, padding:'10px 14px', cursor:'pointer',
                        background: active?'#EDE0EA':'#fff', transition:'all .15s',
                        display:'flex', alignItems:'center', gap:10,
                      }}>
                      <span style={{fontSize:20}}>{m.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:700,color:active?'#714B67':'#333'}}>{m.name}</div>
                        <div style={{fontSize:10,color:'#9B8EA0'}}>{m.desc}</div>
                      </div>
                      <div style={{
                        width:36, height:20, borderRadius:10,
                        background: active?'#714B67':'#CED4DA',
                        position:'relative', transition:'background .2s', flexShrink:0
                      }}>
                        <div style={{
                          position:'absolute', top:2,
                          left: active?16:2,
                          width:16, height:16, borderRadius:'50%',
                          background:'#fff', transition:'left .2s',
                          boxShadow:'0 1px 3px rgba(0,0,0,.2)'
                        }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{marginTop:14,padding:10,background:'#FFF3CD',borderRadius:6,fontSize:11,color:'#856404'}}>
                ⚠️ Disabling a module only hides it from the UI — existing data is preserved.
                Re-enable anytime to restore access.
              </div>
              </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
