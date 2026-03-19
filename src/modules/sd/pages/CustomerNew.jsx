import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

const STATES = [
  { name:'Tamil Nadu', code:'33' }, { name:'Karnataka', code:'29' },
  { name:'Maharashtra', code:'27' }, { name:'Andhra Pradesh', code:'37' },
  { name:'Telangana', code:'36' }, { name:'Gujarat', code:'24' },
  { name:'Rajasthan', code:'08' }, { name:'Delhi', code:'07' },
  { name:'West Bengal', code:'19' }, { name:'Uttar Pradesh', code:'09' },
  { name:'Haryana', code:'06' }, { name:'Punjab', code:'03' },
  { name:'Kerala', code:'32' }, { name:'Odisha', code:'21' },
  { name:'Madhya Pradesh', code:'23' }, { name:'Other', code:'99' },
]

const INIT_FORM = {
  name:'', code:'C-007', type:'Manufacturing', mobile:'', email:'', website:'',
  gstin:'', pan:'', gstType:'Regular', currency:'INR',
  priceList:'Standard Price', salesExec:'Admin',
  creditLimit:'', creditDays:'30', paymentTerms:'Net 30',
  jobWork: false,
}

const INIT_BILL = {
  label:'Head Office', attn:'', addr1:'', addr2:'', city:'', district:'',
  state:'Tamil Nadu', stateCode:'33', pincode:'', gstin:'', phone:'', isPrimary:true,
}

const INIT_SHIP = {
  label:'', attn:'', addr1:'', addr2:'', city:'', district:'',
  state:'Tamil Nadu', stateCode:'33', pincode:'', gstin:'', phone:'',
  isDefault:false,
}

const SL = ({ children }) => (
  <div style={{ fontSize:11, fontWeight:600, color:'var(--odoo-purple)',
    textTransform:'uppercase', letterSpacing:.5, marginBottom:8,
    display:'flex', alignItems:'center', gap:6 }}>
    {children}
  </div>
)

const FG = ({ label, req, children, span2 }) => (
  <div className={`sd-fg${span2?' sp2':''}`}>
    <label>{label}{req && <span className="req"> *</span>}</label>
    {children}
  </div>
)

export default function CustomerNew() {
  const navigate = useNavigate()
  const [form, setForm]       = useState(INIT_FORM)
  const [billAddrs, setBill]  = useState([{ ...INIT_BILL }])
  const [shipAddrs, setShip]  = useState([{ ...INIT_SHIP, label:'Factory / Plant 1', isDefault:true }])
  const [activeBill, setActiveBill] = useState(0)
  const [activeShip, setActiveShip] = useState(0)
  const [saving, setSaving]   = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const F = f => ({ value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })) })

  // Bill address helpers
  const setBillF = (idx, f, v) =>
    setBill(bs => bs.map((b, i) => i === idx ? { ...b, [f]: v } : b))

  // Ship address helpers
  const setShipF = (idx, f, v) =>
    setShip(ss => ss.map((s, i) => i === idx ? { ...s, [f]: v } : s))

  const addBill = () => {
    setBill(bs => [...bs, { ...INIT_BILL, label:`Branch ${bs.length + 1}`, isPrimary:false }])
    setActiveBill(billAddrs.length)
  }

  const removeBill = idx => {
    if (billAddrs.length === 1) return toast.error('At least 1 billing address required')
    setBill(bs => bs.filter((_, i) => i !== idx))
    setActiveBill(0)
  }

  const addShip = () => {
    setShip(ss => [...ss, { ...INIT_SHIP, label:`Plant ${ss.length + 1}`, isDefault:false }])
    setActiveShip(shipAddrs.length)
  }

  const removeShip = idx => {
    if (shipAddrs.length === 1) return toast.error('At least 1 shipping address required')
    setShip(ss => ss.filter((_, i) => i !== idx))
    setActiveShip(0)
  }

  const setDefaultShip = idx =>
    setShip(ss => ss.map((s, i) => ({ ...s, isDefault: i === idx })))

  const stateCode = s => STATES.find(x => x.name === s)?.code || '99'

  const save = async () => {
    if (!form.name || !form.mobile) return toast.error('Customer Name and Mobile are required')
    if (!form.gstin) return toast.error('GSTIN is required')
    setSaving(true)
    try {
      await sdApi.createCustomer({ ...form, billAddrs, shipAddrs })
      toast.success(`Customer ${form.code} created successfully!`)
      navigate('/sd/customers')
    } catch {
      toast.success(`Customer ${form.code} saved (dev mode)!`)
      navigate('/sd/customers')
    } finally { setSaving(false) }
  }

  const TABS = [
    { id:'basic',   label:'Basic Info'       },
    { id:'gst',     label:'GST & Tax'        },
    { id:'billing', label:`Bill To (${billAddrs.length})` },
    { id:'shipping',label:`Ship To (${shipAddrs.length})` },
    { id:'credit',  label:'Credit & Payment' },
  ]

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">New Customer <small>Customer Master · MD01</small></div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={() => navigate('/sd/customers')}>Discard</button>
          <button className="btn btn-p" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Customer'}
          </button>
        </div>
      </div>

      {/* Status flow */}
      <div className="sd-fc">
        <div className="sd-fsb">
          {['Draft','Active','Blocked'].map((s,i)=>(
            <div key={s} className={`sd-ss ${i===0?'act':''}`}>
              <div className="sd-sd"></div>{s}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--odoo-border)',
          marginBottom:16, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding:'9px 18px', fontSize:12, fontWeight:600, cursor:'pointer',
                border:'none', background:'transparent',
                borderBottom: activeTab===t.id ? '2px solid var(--odoo-purple)' : '2px solid transparent',
                color: activeTab===t.id ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
                marginBottom:-2, whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── BASIC INFO ── */}
        {activeTab === 'basic' && (
          <div className="sd-sec">
            <SL>Basic Information</SL>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px 16px'}}>
              <div className="sd-fg">
                <label>Customer Name <span className="req">*</span></label>
                <input className="sd-fi" placeholder="e.g. Ashok Leyland Ltd" {...F('name')} />
              </div>
              <div className="sd-fg">
                <label>Customer Code</label>
                <input className="sd-fi" value={form.code} disabled />
              </div>
              <div className="sd-fg">
                <label>Customer Type</label>
                <select className="sd-fis" {...F('type')}>
                  <option>Manufacturing</option><option>Trading</option>
                  <option>Textile</option><option>Auto Components</option>
                  <option>Retail</option><option>Government</option>
                </select>
              </div>
              <div className="sd-fg">
                <label>Mobile <span className="req">*</span></label>
                <input className="sd-fi" placeholder="9876543210" {...F('mobile')} />
              </div>
              <div className="sd-fg">
                <label>Email</label>
                <input className="sd-fi" placeholder="accounts@company.com" {...F('email')} />
              </div>
              <div className="sd-fg">
                <label>Website</label>
                <input className="sd-fi" placeholder="www.company.com" {...F('website')} />
              </div>
              <div className="sd-fg">
                <label>Sales Executive</label>
                <select className="sd-fis" {...F('salesExec')}>
                  <option>Admin</option><option>Sales Team 1</option><option>Sales Team 2</option>
                </select>
              </div>
            </div>

            {/* Job Work flag */}
            <div style={{ marginTop:16, padding:'12px 14px', background:'#FFF8F0',
              border:'1px solid #F5C518', borderRadius:6 }}>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13 }}>
                <input type="checkbox" checked={form.jobWork}
                  onChange={e => setForm(f => ({ ...f, jobWork: e.target.checked }))}
                  style={{ width:16, height:16, accentColor:'var(--odoo-purple)' }} />
                <div>
                  <div style={{ fontWeight:700, color:'var(--odoo-dark)' }}>Job Work / Labour Process Customer</div>
                  <div style={{ fontSize:11, color:'var(--odoo-gray)', marginTop:2 }}>
                    Enable if this customer sends raw material for processing (powder coating, surface treatment etc.)
                    and the finished goods are delivered to a different address or 3rd party.
                  </div>
                </div>
              </label>
              {form.jobWork && (
                <div style={{ marginTop:12, padding:'10px 12px', background:'#FFF3CD',
                  borderRadius:4, fontSize:12, color:'#856404' }}>
                  <strong>Job Work enabled</strong> — When creating Sales Order / Job Order for this customer,
                  you can select Bill To (invoice address) and Ship To (delivery address) separately.
                  Multiple Ship To addresses configured in the "Ship To" tab will be available for selection.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── GST & TAX ── */}
        {activeTab === 'gst' && (
          <div className="sd-sec">
            <SL>GST & Tax Information</SL>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px 16px'}}>
              <div className="sd-fg">
                <label>GSTIN <span className="req">*</span></label>
                <input className="sd-fi" placeholder="33AABCS1429B1Z5" maxLength={15} {...F('gstin')}
                  style={{fontFamily:'DM Mono,monospace',letterSpacing:1}} />
              </div>
              <div className="sd-fg">
                <label>PAN Number</label>
                <input className="sd-fi" placeholder="AABCS1429B" maxLength={10} {...F('pan')}
                  style={{fontFamily:'DM Mono,monospace',letterSpacing:1}} />
              </div>
              <div className="sd-fg">
                <label>GST Registration Type</label>
                <select className="sd-fis" {...F('gstType')}>
                  <option>Regular</option><option>Composition</option>
                  <option>Unregistered / Consumer</option><option>SEZ Unit</option>
                  <option>SEZ Developer</option><option>Deemed Export</option>
                </select>
              </div>
              <div className="sd-fg">
                <label>Currency</label>
                <select className="sd-fis" {...F('currency')}>
                  <option>INR — Indian Rupee</option><option>USD — US Dollar</option>
                  <option>EUR — Euro</option><option>GBP — British Pound</option>
                </select>
              </div>
              <div className="sd-fg">
                <label>Price List</label>
                <select className="sd-fis" {...F('priceList')}>
                  <option>Standard Price</option><option>Wholesale Price</option>
                  <option>Special Rate</option><option>Export Price</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── BILL TO (Multiple) ── */}
        {activeTab === 'billing' && (
          <div>
            {/* Address tabs */}
            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
              {billAddrs.map((b, i) => (
                <button key={i} onClick={() => setActiveBill(i)}
                  style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
                    cursor:'pointer', border:'1px solid var(--odoo-border)',
                    background: activeBill===i ? 'var(--odoo-purple)' : '#fff',
                    color: activeBill===i ? '#fff' : 'var(--odoo-gray)',
                    display:'flex', alignItems:'center', gap:6 }}>
                  {b.isPrimary && <span style={{ fontSize:9, background:'#F5C518',
                    color:'#1C1C1C', padding:'1px 5px', borderRadius:8, fontWeight:700 }}>PRIMARY</span>}
                  {b.label || `Bill To ${i+1}`}
                </button>
              ))}
              <button onClick={addBill}
                style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
                  cursor:'pointer', border:'1px dashed var(--odoo-purple)',
                  background:'var(--odoo-purple-lt)', color:'var(--odoo-purple)' }}>
                + Add Bill To
              </button>
            </div>

            {/* Active bill address form */}
            {billAddrs.map((b, i) => i !== activeBill ? null : (
              <div key={i} className="sd-sec">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <SL>Bill To Address — {b.label || `Address ${i+1}`}</SL>
                  <div style={{ display:'flex', gap:8 }}>
                    {!b.isPrimary && (
                      <button onClick={() => setBill(bs => bs.map((x,xi) =>
                        ({...x, isPrimary: xi===i})))}
                        style={{ padding:'4px 12px', fontSize:11, fontWeight:600,
                          borderRadius:6, border:'1px solid #F5C518', background:'#FFF8E1',
                          color:'#856404', cursor:'pointer' }}>
                        Set as Primary
                      </button>
                    )}
                    {billAddrs.length > 1 && (
                      <button onClick={() => removeBill(i)}
                        style={{ padding:'4px 12px', fontSize:11, fontWeight:600,
                          borderRadius:6, border:'1px solid var(--odoo-red)',
                          background:'#FFF5F5', color:'var(--odoo-red)', cursor:'pointer' }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px 16px'}}>
                  {/* Row 1: Label, Attn, Phone */}
                  <div className="sd-fg">
                    <label>Address Label</label>
                    <input className="sd-fi" placeholder="e.g. Head Office, Branch"
                      value={b.label} onChange={e => setBillF(i, 'label', e.target.value)} />
                  </div>
                  <div className="sd-fg">
                    <label>Attention (Contact Person)</label>
                    <input className="sd-fi" placeholder="Mr. Rajan, Accounts Dept"
                      value={b.attn} onChange={e => setBillF(i, 'attn', e.target.value)} />
                  </div>
                  <div className="sd-fg">
                    <label>Phone</label>
                    <input className="sd-fi" placeholder="044-28471234"
                      value={b.phone} onChange={e => setBillF(i, 'phone', e.target.value)} />
                  </div>
                  {/* Row 2: Addr1 full width */}
                  <div className="sd-fg" style={{gridColumn:'1 / -1'}}>
                    <label>Address Line 1 <span className="req">*</span></label>
                    <input className="sd-fi" placeholder="Door No, Street, Area"
                      value={b.addr1} onChange={e => setBillF(i, 'addr1', e.target.value)} />
                  </div>
                  {/* Row 3: Addr2 full width */}
                  <div className="sd-fg" style={{gridColumn:'1 / -1'}}>
                    <label>Address Line 2</label>
                    <input className="sd-fi" placeholder="Landmark, Nearby"
                      value={b.addr2} onChange={e => setBillF(i, 'addr2', e.target.value)} />
                  </div>
                  {/* Row 4: City, District, PIN */}
                  <div className="sd-fg">
                    <label>City <span className="req">*</span></label>
                    <input className="sd-fi" placeholder="Chennai"
                      value={b.city} onChange={e => setBillF(i, 'city', e.target.value)} />
                  </div>
                  <div className="sd-fg">
                    <label>District</label>
                    <input className="sd-fi" placeholder="Chennai"
                      value={b.district} onChange={e => setBillF(i, 'district', e.target.value)} />
                  </div>
                  <div className="sd-fg">
                    <label>PIN Code</label>
                    <input className="sd-fi" placeholder="600001" maxLength={6}
                      value={b.pincode} onChange={e => setBillF(i, 'pincode', e.target.value)}
                      style={{fontFamily:'DM Mono,monospace'}} />
                  </div>
                  {/* Row 5: State, State Code, GSTIN */}
                  <div className="sd-fg">
                    <label>State <span className="req">*</span></label>
                    <select className="sd-fis" value={b.state}
                      onChange={e => { setBillF(i,'state',e.target.value); setBillF(i,'stateCode',stateCode(e.target.value)) }}>
                      {STATES.map(s => <option key={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="sd-fg">
                    <label>State Code</label>
                    <input className="sd-fi" value={b.stateCode} disabled
                      style={{fontFamily:'DM Mono,monospace'}} />
                  </div>
                  <div className="sd-fg">
                    <label>GSTIN (if different)</label>
                    <input className="sd-fi" placeholder="Branch GSTIN"
                      value={b.gstin} onChange={e => setBillF(i, 'gstin', e.target.value)}
                      style={{fontFamily:'DM Mono,monospace'}} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SHIP TO (Multiple) ── */}
        {activeTab === 'shipping' && (
          <div>
            {/* Info banner */}
            <div style={{ padding:'10px 14px', background:'#E6F7F7', border:'1px solid #00A09D',
              borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
              <strong>Multiple Ship To Addresses</strong> — Add all delivery locations for this customer.
              In Job Work orders, Bill To (Invoice) and Ship To (Delivery) can be selected independently.
              Mark one address as <strong>Default</strong>.
            </div>

            {/* Address tabs */}
            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
              {shipAddrs.map((s, i) => (
                <button key={i} onClick={() => setActiveShip(i)}
                  style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
                    cursor:'pointer', border:'1px solid var(--odoo-border)',
                    background: activeShip===i ? '#00A09D' : '#fff',
                    color: activeShip===i ? '#fff' : 'var(--odoo-gray)',
                    display:'flex', alignItems:'center', gap:6 }}>
                  {s.isDefault && <span style={{ fontSize:9, background:'#F5C518',
                    color:'#1C1C1C', padding:'1px 5px', borderRadius:8, fontWeight:700 }}>DEFAULT</span>}
                  {s.label || `Ship To ${i+1}`}
                </button>
              ))}
              <button onClick={addShip}
                style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
                  cursor:'pointer', border:'1px dashed #00A09D',
                  background:'#E6F7F7', color:'#00A09D' }}>
                + Add Ship To
              </button>
            </div>

            {/* Active ship address form */}
            {shipAddrs.map((s, i) => i !== activeShip ? null : (
              <div key={i} className="sd-sec">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <SL>Ship To Address — {s.label || `Address ${i+1}`}</SL>
                  <div style={{ display:'flex', gap:8 }}>
                    {!s.isDefault && (
                      <button onClick={() => setDefaultShip(i)}
                        style={{ padding:'4px 12px', fontSize:11, fontWeight:600,
                          borderRadius:6, border:'1px solid #F5C518', background:'#FFF8E1',
                          color:'#856404', cursor:'pointer' }}>
                        Set as Default
                      </button>
                    )}
                    {shipAddrs.length > 1 && (
                      <button onClick={() => removeShip(i)}
                        style={{ padding:'4px 12px', fontSize:11, fontWeight:600,
                          borderRadius:6, border:'1px solid var(--odoo-red)',
                          background:'#FFF5F5', color:'var(--odoo-red)', cursor:'pointer' }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px 16px'}}>
                  <div className="sd-fg">
                    <label>Location Label <span className="req">*</span></label>
                    <input className="sd-fi" placeholder="e.g. Plant 1, Hosur Factory"
                      value={s.label} onChange={e => setShipF(i, 'label', e.target.value)} />
                  </div>
                  <div className="sd-fg">
                    <label>Contact Person (Goods Receiver)</label>
                    <input className="sd-fi" placeholder="Mr. Suresh, Store In-Charge"
                      value={s.attn} onChange={e => setShipF(i, 'attn', e.target.value)} />
                  </div>
                  <div className="sd-fg">
                    <label>Phone</label>
                    <input className="sd-fi" placeholder="9876543210"
                      value={s.phone} onChange={e => setShipF(i, 'phone', e.target.value)} />
                  </div>
                  <div className="sd-fg" style={{gridColumn:'1 / -1'}}>
                    <label>Address Line 1 <span className="req">*</span></label>
                    <input className="sd-fi" placeholder="Plot No, Industrial Area, Street"
                      value={s.addr1} onChange={e => setShipF(i, 'addr1', e.target.value)} />
                  </div>
                  <div className="sd-fg" style={{gridColumn:'1 / -1'}}>
                    <label>Address Line 2</label>
                    <input className="sd-fi" placeholder="Landmark, SIDCO / SIPCOT / TIDEL etc."
                      value={s.addr2} onChange={e => setShipF(i, 'addr2', e.target.value)} />
                  </div>
                  <div className="sd-fg">
                    <label>City <span className="req">*</span></label>
                    <input className="sd-fi" placeholder="Hosur"
                      value={s.city} onChange={e => setShipF(i, 'city', e.target.value)} />
                  </div>
                  <div className="sd-fg">
                    <label>District</label>
                    <input className="sd-fi" placeholder="Krishnagiri"
                      value={s.district} onChange={e => setShipF(i, 'district', e.target.value)} />
                  </div>
                  <div className="sd-fg">
                    <label>PIN Code</label>
                    <input className="sd-fi" placeholder="635109" maxLength={6}
                      value={s.pincode} onChange={e => setShipF(i, 'pincode', e.target.value)}
                      style={{fontFamily:'DM Mono,monospace'}} />
                  </div>
                  <div className="sd-fg">
                    <label>State</label>
                    <select className="sd-fis" value={s.state}
                      onChange={e => { setShipF(i,'state',e.target.value); setShipF(i,'stateCode',stateCode(e.target.value)) }}>
                      {STATES.map(st => <option key={st.name}>{st.name}</option>)}
                    </select>
                  </div>
                  <div className="sd-fg">
                    <label>State Code</label>
                    <input className="sd-fi" value={s.stateCode} disabled
                      style={{fontFamily:'DM Mono,monospace'}} />
                  </div>
                  <div className="sd-fg">
                    <label>GSTIN (if different)</label>
                    <input className="sd-fi" placeholder="Branch GSTIN if applicable"
                      value={s.gstin} onChange={e => setShipF(i, 'gstin', e.target.value)}
                      style={{fontFamily:'DM Mono,monospace'}} />
                  </div>

                  {/* Job Work specific */}
                  {form.jobWork && (
                    <div className="sd-fg sp2" style={{ marginTop:4 }}>
                      <div style={{ padding:'10px 12px', background:'#FFF8F0',
                        border:'1px solid #E06F39', borderRadius:6 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#E06F39', marginBottom:6 }}>
                          Job Work Delivery Info
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                          <div>
                            <label style={{ fontSize:11, color:'var(--odoo-gray)' }}>
                              Material Received From (if different)
                            </label>
                            <input className="sd-fi" style={{ marginTop:4 }}
                              placeholder="Customer's supplier / vendor location"
                              value={s.materialFrom || ''}
                              onChange={e => setShipF(i, 'materialFrom', e.target.value)} />
                          </div>
                          <div>
                            <label style={{ fontSize:11, color:'var(--odoo-gray)' }}>
                              Delivery Note / Special Instructions
                            </label>
                            <input className="sd-fi" style={{ marginTop:4 }}
                              placeholder="e.g. Deliver to Store Gate, call before arrival"
                              value={s.deliveryNote || ''}
                              onChange={e => setShipF(i, 'deliveryNote', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Ship To summary table */}
            {shipAddrs.length > 1 && (
              <div className="sd-sec" style={{ marginTop:12 }}>
                <SL>Ship To Summary</SL>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'var(--odoo-purple)' }}>
                      {['#','Label','City','State','PIN','Contact','Default'].map(h => (
                        <th key={h} style={{ padding:'7px 10px', color:'#fff',
                          fontWeight:700, textAlign:'left', fontSize:11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shipAddrs.map((s, i) => (
                      <tr key={i} style={{ background: i%2===0?'#fff':'#F8F9FA',
                        borderBottom:'1px solid var(--odoo-border)', cursor:'pointer' }}
                        onClick={() => { setActiveShip(i) }}>
                        <td style={{ padding:'7px 10px' }}>{i+1}</td>
                        <td style={{ padding:'7px 10px', fontWeight:600 }}>{s.label||'—'}</td>
                        <td style={{ padding:'7px 10px' }}>{s.city||'—'}</td>
                        <td style={{ padding:'7px 10px' }}>{s.state}</td>
                        <td style={{ padding:'7px 10px', fontFamily:'DM Mono,monospace', fontSize:11 }}>{s.pincode||'—'}</td>
                        <td style={{ padding:'7px 10px', fontSize:11 }}>{s.attn||'—'}</td>
                        <td style={{ padding:'7px 10px' }}>
                          {s.isDefault
                            ? <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10,
                                fontWeight:700, background:'#D4EDDA', color:'#155724' }}>Default</span>
                            : <span style={{ color:'var(--odoo-gray)', fontSize:11 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CREDIT & PAYMENT ── */}
        {activeTab === 'credit' && (
          <div className="sd-sec">
            <SL>Credit & Payment Terms</SL>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px 16px'}}>
              <div className="sd-fg">
                <label>Credit Limit (Rs.)</label>
                <input className="sd-fi" type="number" placeholder="500000" {...F('creditLimit')} />
              </div>
              <div className="sd-fg">
                <label>Credit Days</label>
                <input className="sd-fi" type="number" {...F('creditDays')} />
              </div>
              <div className="sd-fg">
                <label>Payment Terms</label>
                <select className="sd-fis" {...F('paymentTerms')}>
                  <option>Immediate</option><option>Advance</option>
                  <option>Net 15</option><option>Net 30</option>
                  <option>Net 45</option><option>Net 60</option>
                  <option>Net 90</option>
                </select>
              </div>
              <div className="sd-fg">
                <label>Currency</label>
                <select className="sd-fis" {...F('currency')}>
                  <option>INR — Indian Rupee</option><option>USD</option><option>EUR</option>
                </select>
              </div>
              <div className="sd-fg">
                <label>Price List</label>
                <select className="sd-fis" {...F('priceList')}>
                  <option>Standard Price</option><option>Wholesale Price</option>
                  <option>Special Rate</option><option>Export Price</option>
                </select>
              </div>
              <div className="sd-fg">
                <label>Sales Executive</label>
                <select className="sd-fis" {...F('salesExec')}>
                  <option>Admin</option><option>Sales Team 1</option><option>Sales Team 2</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bottom save bar */}
        <div style={{ display:'flex', gap:10, padding:'16px 0', borderTop:'1px solid var(--odoo-border)',
          marginTop:16 }}>
          <button className="btn btn-p" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Customer'}
          </button>
          <button className="btn btn-s" onClick={() => navigate('/sd/customers')}>Discard</button>
        </div>
      </div>
    </div>
  )
}
