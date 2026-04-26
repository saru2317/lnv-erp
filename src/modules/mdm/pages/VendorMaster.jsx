import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const STATES = ['Tamil Nadu','Karnataka','Kerala','Andhra Pradesh','Telangana','Maharashtra',
  'Gujarat','Rajasthan','Punjab','Haryana','Delhi','Uttar Pradesh','West Bengal','Other']
const PAYMENT_TERMS = ['Immediate','7 Days','15 Days','Net 30','Net 45','Net 60','Net 90','Advance','LC']
const VENDOR_CATEGORIES = ['Raw Material','Spare Parts','Chemicals','Packing Material',
  'Services','Consumables','Capital Goods','Trading Goods','Sub-contractor','Other']

const PURCHASE_TYPES = [
  { code:'R',      label:'R — Regular'                        },
  { code:'SEZ',    label:'SEZ — Special Economic Zone'        },
  { code:'SEWOP',  label:'SEWOP — SEZ Without Payment'        },
  { code:'DE',     label:'DE — Direct Expenses'               },
  { code:'Goods',  label:'Goods'                              },
  { code:'Service',label:'Service'                            },
  { code:'WPAY',   label:'WPAY — With Payment'                },
  { code:'WOPAY',  label:'WOPAY — Without Payment'            },
  { code:'EXPWOP', label:'EXPWOP — Export Without Payment'    },
  { code:'EXPWP',  label:'EXPWP — Export With Payment'        },
]

const MSME_TYPES    = ['Micro','Small','Medium']
const BANK_ACCT_TYPES = ['Current Account','Saving Account','RDA','Regular Saving','FDA','OD Account']

const BLANK = {
  code:'', name:'', type:'B',
  gstin:'', gstRegType:'registered', pan:'', phone:'', altPhone:'', email:'', website:'',
  address:'', city:'', state:'Tamil Nadu', pincode:'', country:'India',
  paymentTerms:'Net 30', creditDays:'30', creditLimit:'',
  currency:'INR', priceList:'Standard', vendorCategory:'',
  bankName:'', bankBranch:'', accountNo:'', ifsc:'',
  contactPerson:'', remarks:'',
  contacts:[],
  // Supplier Info
  purchaseType:'R', tcsApplicable:false,
  msmeRegistered:false, msmeNumber:'', msmeType:'Micro',
  // Multiple Banks
  banks:[],
}

const TABS = [
  { id:'general',  label:'General Data',    icon:'🏢' },
  { id:'address',  label:'Address',          icon:'📍' },
  { id:'purchase', label:'Purchase Data',    icon:'🛒' },
  { id:'bank',     label:'Bank Details',     icon:'🏦' },
  { id:'contacts', label:'Contacts',         icon:'👥' },
  { id:'supplier', label:'Supplier Info',    icon:'📋' },
]

const inp = {
  padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box',
  fontFamily:'DM Sans,sans-serif', transition:'border-color .2s'
}
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block',
  marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }
const grid = (cols) => ({ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:'12px 16px' })
const FG = ({ label, children, span=1, req=false }) => (
  <div style={{ gridColumn:`span ${span}` }}>
    <label style={lbl}>{label}{req && <span style={{ color:'#DC3545' }}> *</span>}</label>
    {children}
  </div>
)

// ── Vendor Form Modal ─────────────────────────────────────
function VendorForm({ vendor, onSave, onCancel, rows=[] }) {
  const isEdit = !!vendor?.id
  const [form,     setForm]    = useState(vendor ? {
    code: vendor.code, name: vendor.name, type: vendor.type||'B',
    gstin: vendor.gstin||'', phone: vendor.phone||'', email: vendor.email||'',
    creditDays: String(vendor.creditDays||30),
    address: vendor.address||'', city: vendor.city||'',
    state: vendor.state||'Tamil Nadu', pincode: vendor.pincode||'',
    altPhone: vendor.altPhone||'', website: vendor.website||'',
    panNo: vendor.panNo||'', contactPerson: vendor.contactPerson||'',
    paymentTerms: vendor.paymentTerms||'Net 30', creditLimit: vendor.creditLimit||'',
    currency: vendor.currency||'INR', priceList: vendor.priceList||'Standard',
    vendorCategory: vendor.vendorCategory||'',
    bankName: vendor.bankName||'', bankBranch: vendor.bankBranch||'',
    accountNo: vendor.accountNo||'', ifsc: vendor.ifsc||'',
    remarks: vendor.remarks||'', contacts: vendor.contacts||[],
  } : BLANK)
  const [tab,      setTab]     = useState('general')
  const [saving,   setSaving]  = useState(false)
  const [contacts, setContacts]= useState(vendor?.contacts || [])

  const [banks, setBanks] = useState(vendor?.banks || [])

  const addBank    = () => setBanks(b => [...b, { id:Date.now(), bankName:'', branch:'', accountNo:'', ifsc:'', accountType:'Current Account', isPrimary:b.length===0 }])
  const delBank    = (id) => setBanks(b => b.filter(x => x.id !== id))
  const updBank    = (id, k, v) => setBanks(b => b.map(x => x.id===id ? {...x,[k]:v} : x))
  const setPrimaryBank = (id) => setBanks(b => b.map(x => ({...x, isPrimary: x.id===id})))

  const addContact  = () => setContacts(c => [...c, { id:Date.now(), name:'', designation:'', phone:'', email:'', isPrimary:c.length===0 }])
  const delContact  = (id) => setContacts(c => c.filter(x => x.id !== id))
  const updContact  = (id, k, v) => setContacts(c => c.map(x => x.id===id ? {...x,[k]:v} : x))
  const setPrimary  = (id) => setContacts(c => c.map(x => ({...x, isPrimary: x.id===id})))

  const F = (f) => ({
    value: form[f] ?? '',
    onChange: e => setForm(p => ({...p, [f]: e.target.value})),
    style: inp,
    onFocus: e => e.target.style.borderColor='#714B67',
    onBlur:  e => e.target.style.borderColor='#E0D5E0',
  })

  // Sequential code: C + FirstLetter + 0001,0002...  (C = Creditor)
  const getNextCode = (name, existingRows) => {
    const list   = existingRows || []
    const fl     = name?.trim() ? name.trim()[0].toUpperCase() : 'X'
    const prefix = 'C' + fl
    const existing = list.filter(r => r.code && r.code.startsWith(prefix))
    if (existing.length === 0) return prefix + '0001'
    const nums = existing.map(r => parseInt(r.code.replace(prefix,''), 10) || 0)
    return prefix + String(Math.max(...nums) + 1).padStart(4, '0')
  }

  const genCode = () => setForm(f => ({...f, code: getNextCode(f.name, rows)}))

  const onNameChange = (e) => {
    const name = e.target.value
    const wasAuto = !form.code || /^C[A-Z][0-9]{4}$/.test(form.code)
    const newCode = (wasAuto && name.trim()) ? getNextCode(name, rows) : form.code
    setForm(f => ({ ...f, name, code: newCode }))
  }

  const save = async () => {
    if (!form.code || !form.name) return toast.error('Code and Name required!')
    setSaving(true)
    try {
      const url    = isEdit ? `${BASE_URL}/vendors/${vendor.id}` : `${BASE_URL}/vendors`
      const method = isEdit ? 'PATCH' : 'POST'
      const payload = { ...form, creditDays: +form.creditDays || 30, contacts, banks }
      const res  = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Vendor ${isEdit ? 'updated' : 'created'}!`)
      onSave()
    } catch(err) {
      toast.error('Error: ' + err.message)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:'92%', maxWidth:900,
        height:'auto', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700 }}>
              {isEdit ? `Edit Vendor — ${vendor.code}` : 'New Vendor Master'}
            </h3>
            <p style={{ color:'rgba(255,255,255,.6)', margin:'2px 0 0', fontSize:11 }}>
              SAP: XK01 / XK03 — Vendor / Supplier Master Data
            </p>
          </div>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'2px solid #E0D5E0', background:'#F8F7FA' }}>
          {TABS.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'10px 18px', fontSize:12, fontWeight:600, cursor:'pointer',
                color: tab===t.id ? '#714B67' : '#6C757D', whiteSpace:'nowrap',
                borderBottom: tab===t.id ? '2px solid #714B67' : '2px solid transparent',
                marginBottom:-2, background: tab===t.id ? '#fff' : 'transparent' }}>
              {t.icon} {t.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', height:480, minHeight:480, maxHeight:480, padding:'16px 20px' }}>

          {/* GENERAL */}
          {tab === 'general' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'#F8F4F8', borderRadius:8, padding:16, border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
                  🏢 Basic Information
                </div>
                <div style={grid(3)}>
                  <FG label="Vendor Code" req>
                    <div style={{ display:'flex', gap:4 }}>
                      <input {...F('code')} placeholder="CA0001"
                        style={{ ...inp, fontFamily:'DM Mono,monospace', flex:1 }}
                        disabled={isEdit} />
                      {!isEdit && (
                        <button onClick={genCode}
                          style={{ padding:'8px 10px', background:'#714B67', color:'#fff',
                            border:'none', borderRadius:5, fontSize:11, cursor:'pointer' }}>
                          Auto
                        </button>
                      )}
                    </div>
                  </FG>
                  <FG label="Vendor Name" req span={2}>
                    <input value={form.name ?? ''} onChange={onNameChange}
                      style={inp} placeholder="e.g. Asian Paints Ltd"
                      onFocus={e=>e.target.style.borderColor='#714B67'}
                      onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                  </FG>
                  <FG label="Vendor Category">
                    <select {...F('vendorCategory')} style={{ ...inp, cursor:'pointer' }}>
                      <option value=''>— Select Category —</option>
                      {VENDOR_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </FG>
                  <FG label="GSTIN">
                    <input {...F('gstin')} placeholder="33AABCA1234A1Z5" maxLength={15}
                      style={{ ...inp, fontFamily:'DM Mono,monospace', textTransform:'uppercase' }} />
                  </FG>
                  <FG label="GST Registration Type">
                    <select {...F('gstRegType')} style={{ ...inp, cursor:'pointer',
                      background: form.gstRegType==='unregistered'?'#FFF3CD':
                                  form.gstRegType==='composition'?'#D1ECF1':
                                  form.gstRegType==='non_gst'?'#F8D7DA':'#fff',
                      borderColor: form.gstRegType==='unregistered'?'#FFC107':
                                   form.gstRegType==='composition'?'#17A2B8':
                                   form.gstRegType==='non_gst'?'#DC3545':'#E0D5E0',
                    }}>
                      <option value="registered">Registered (Regular)</option>
                      <option value="composition">Composition Dealer</option>
                      <option value="unregistered">Unregistered</option>
                      <option value="non_gst">Non-GST Supply (Petrol/Alcohol)</option>
                      <option value="sez">SEZ / Export</option>
                    </select>
                    {form.gstRegType==='unregistered' && (
                      <div style={{fontSize:10,color:'#856404',marginTop:3,fontWeight:600}}>
                        RCM applies — you pay GST to govt. ITC claimable if item eligible.
                      </div>
                    )}
                    {form.gstRegType==='composition' && (
                      <div style={{fontSize:10,color:'#0C5460',marginTop:3,fontWeight:600}}>
                        No GST on their invoice. You cannot claim any ITC — full cost absorbed.
                      </div>
                    )}
                    {form.gstRegType==='non_gst' && (
                      <div style={{fontSize:10,color:'#721C24',marginTop:3,fontWeight:600}}>
                        Outside GST scope. No ITC available. Cost goes directly to expense.
                      </div>
                    )}
                  </FG>
                  <FG label="PAN No">
                    <input {...F('panNo')} placeholder="AABCA1234A" maxLength={10}
                      style={{ ...inp, fontFamily:'DM Mono,monospace', textTransform:'uppercase' }} />
                  </FG>
                </div>
              </div>
              <div style={{ background:'#F8F4F8', borderRadius:8, padding:16, border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
                  📞 Contact Information
                </div>
                <div style={grid(3)}>
                  <FG label="Phone"><input {...F('phone')} placeholder="9XXXXXXXXX" /></FG>
                  <FG label="Alt Phone"><input {...F('altPhone')} placeholder="0422-XXXXXXX" /></FG>
                  <FG label="Email"><input {...F('email')} type='email' placeholder="purchase@vendor.com" /></FG>
                  <FG label="Contact Person"><input {...F('contactPerson')} placeholder="Mr. Rajan Kumar" /></FG>
                  <FG label="Website"><input {...F('website')} placeholder="www.vendor.com" /></FG>
                </div>
              </div>
              <FG label="Remarks">
                <textarea {...F('remarks')}
                  style={{ ...inp, minHeight:55, resize:'vertical' }}
                  placeholder="Internal notes about this vendor" />
              </FG>
            </div>
          )}

          {/* ADDRESS */}
          {tab === 'address' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'#F8F4F8', borderRadius:8, padding:16, border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
                  📍 Registered / Office Address
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={lbl}>Address</label>
                  <textarea {...F('address')} style={{ ...inp, minHeight:70, resize:'vertical' }}
                    placeholder="Door No., Street, Area" />
                </div>
                <div style={grid(4)}>
                  <FG label="City" span={1}><input {...F('city')} placeholder="Coimbatore" /></FG>
                  <FG label="State">
                    <select {...F('state')} style={{ ...inp, cursor:'pointer' }}>
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </FG>
                  <FG label="Pincode"><input {...F('pincode')} placeholder="641001" maxLength={6} /></FG>
                  <FG label="Country"><input {...F('country')} placeholder="India" /></FG>
                </div>
                {form.state && (
                  <div style={{ marginTop:10, padding:'8px 12px', background:'#fff',
                    borderRadius:5, fontSize:11, display:'flex', gap:16 }}>
                    <span>📍 State: <strong style={{ color:'#714B67' }}>{form.state}</strong></span>
                    <span>GST Code: <strong style={{ color:'#714B67' }}>
                      {({'Tamil Nadu':'33','Karnataka':'29','Kerala':'32','Andhra Pradesh':'37',
                        'Telangana':'36','Maharashtra':'27','Gujarat':'24','Delhi':'07',
                        'Rajasthan':'08','Punjab':'03','West Bengal':'19','Haryana':'06','Uttar Pradesh':'09'})[form.state]||'--'}
                    </strong></span>
                    <strong style={{ color: form.state==='Tamil Nadu'?'#155724':'#856404' }}>
                      {form.state==='Tamil Nadu' ? '✅ CGST + SGST' : '⚡ IGST (Inter-state)'}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PURCHASE DATA */}
          {tab === 'purchase' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'#F8F4F8', borderRadius:8, padding:16, border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
                  🛒 Purchase / Payment Terms
                </div>
                <div style={grid(3)}>
                  <FG label="Payment Terms">
                    <select {...F('paymentTerms')} style={{ ...inp, cursor:'pointer' }}>
                      {PAYMENT_TERMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </FG>
                  <FG label="Credit Days">
                    <input {...F('creditDays')} type='number' placeholder="30" min="0" />
                  </FG>
                  <FG label="Credit Limit (₹)">
                    <input {...F('creditLimit')} type='number' placeholder="500000" />
                  </FG>
                  <FG label="Currency">
                    <select {...F('currency')} style={{ ...inp, cursor:'pointer' }}>
                      <option>INR</option><option>USD</option><option>EUR</option><option>GBP</option>
                    </select>
                  </FG>
                  <FG label="Price List">
                    <select {...F('priceList')} style={{ ...inp, cursor:'pointer' }}>
                      <option>Standard</option><option>Negotiated</option><option>Contract</option>
                    </select>
                  </FG>
                </div>
                {/* Summary */}
                <div style={{ marginTop:12, background:'#fff', borderRadius:6, padding:'10px 14px',
                  display:'flex', gap:24, fontSize:12 }}>
                  <span>Payment: <strong>{form.paymentTerms||'Net 30'}</strong></span>
                  <span>Credit Days: <strong>{form.creditDays||30} days</strong></span>
                  <span>Credit Limit: <strong>₹{(+form.creditLimit||0).toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* BANK — Multiple Banks */}
          {tab === 'bank' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:12, color:'#6C757D' }}>
                  💡 Add multiple bank accounts. Mark one as <strong>Primary</strong> — payment will be made to primary bank.
                </div>
                <button onClick={addBank}
                  style={{ padding:'7px 16px', background:'#714B67', color:'#fff',
                    border:'none', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  + Add Bank Account
                </button>
              </div>
              {banks.length === 0 ? (
                <div style={{ padding:30, textAlign:'center', color:'#6C757D',
                  border:'2px dashed #E0D5E0', borderRadius:8 }}>
                  🏦 No bank accounts — click "+ Add Bank Account"
                </div>
              ) : banks.map((b, i) => (
                <div key={b.id} style={{ border: b.isPrimary?'2px solid #714B67':'1px solid #E0D5E0',
                  borderRadius:8, overflow:'hidden', marginBottom:10 }}>
                  <div style={{ background: b.isPrimary?'#714B67':'#F8F4F8',
                    padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color: b.isPrimary?'#fff':'#714B67' }}>
                        Bank #{i+1} {b.bankName ? `— ${b.bankName}` : ''}
                      </span>
                      {b.isPrimary
                        ? <span style={{ background:'#F5C518', color:'#1C1C1C', padding:'1px 8px',
                            borderRadius:10, fontSize:10, fontWeight:700 }}>⭐ PRIMARY — Payment Bank</span>
                        : <button onClick={() => setPrimaryBank(b.id)}
                            style={{ padding:'2px 10px', background:'#fff', color:'#714B67',
                              border:'1px solid #714B67', borderRadius:10, fontSize:10,
                              fontWeight:600, cursor:'pointer' }}>Set as Payment Bank</button>
                      }
                    </div>
                    <span onClick={() => delBank(b.id)}
                      style={{ cursor:'pointer', color: b.isPrimary?'rgba(255,255,255,.7)':'#DC3545', fontSize:18 }}>✕</span>
                  </div>
                  <div style={{ padding:14, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                    <div>
                      <label style={lbl}>Bank Name</label>
                      <input style={inp} value={b.bankName}
                        onChange={e=>updBank(b.id,'bankName',e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        onFocus={e=>e.target.style.borderColor='#714B67'}
                        onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                    </div>
                    <div>
                      <label style={lbl}>Branch</label>
                      <input style={inp} value={b.branch}
                        onChange={e=>updBank(b.id,'branch',e.target.value)}
                        placeholder="e.g. Gandhipuram"
                        onFocus={e=>e.target.style.borderColor='#714B67'}
                        onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                    </div>
                    <div>
                      <label style={lbl}>Account Type</label>
                      <select style={{ ...inp, cursor:'pointer' }} value={b.accountType}
                        onChange={e=>updBank(b.id,'accountType',e.target.value)}>
                        {BANK_ACCT_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Account Number</label>
                      <input style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                        value={b.accountNo}
                        onChange={e=>updBank(b.id,'accountNo',e.target.value)}
                        placeholder="XXXXXXXXXXXX"
                        onFocus={e=>e.target.style.borderColor='#714B67'}
                        onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                    </div>
                    <div>
                      <label style={lbl}>IFSC Code</label>
                      <input style={{ ...inp, fontFamily:'DM Mono,monospace', textTransform:'uppercase' }}
                        value={b.ifsc}
                        onChange={e=>updBank(b.id,'ifsc',e.target.value.toUpperCase())}
                        placeholder="HDFC0001234" maxLength={11}
                        onFocus={e=>e.target.style.borderColor='#714B67'}
                        onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                    </div>
                    <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:2 }}>
                      <div style={{ background: b.isPrimary?'#D4EDDA':'#F8F9FA',
                        border:`1px solid ${b.isPrimary?'#28A745':'#E0D5E0'}`,
                        borderRadius:6, padding:'8px 12px', fontSize:12, width:'100%',
                        color: b.isPrimary?'#155724':'#6C757D', fontWeight:600, textAlign:'center' }}>
                        {b.isPrimary ? '✅ Primary Payment Bank' : '⬜ Secondary Bank'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUPPLIER INFO */}
          {tab === 'supplier' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Purchase Type */}
              <div style={{ background:'#F8F4F8', borderRadius:8, padding:16, border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
                  📋 Purchase Classification
                </div>
                <div style={grid(3)}>
                  <FG label="Type of Purchase" span={2}>
                    <select {...F('purchaseType')} style={{ ...inp, cursor:'pointer' }}>
                      {PURCHASE_TYPES.map(p => (
                        <option key={p.code} value={p.code}>{p.label}</option>
                      ))}
                    </select>
                  </FG>
                  <FG label="TCS Applicable">
                    <div style={{ display:'flex', alignItems:'center', gap:10, height:38,
                      padding:'0 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
                      background:'#fff', cursor:'pointer' }}
                      onClick={() => setForm(f => ({...f, tcsApplicable: !f.tcsApplicable}))}>
                      <input type='checkbox' checked={!!form.tcsApplicable} readOnly
                        style={{ width:16, height:16, accentColor:'#714B67', cursor:'pointer' }} />
                      <span style={{ fontSize:12, fontWeight:600,
                        color: form.tcsApplicable ? '#714B67' : '#6C757D' }}>
                        {form.tcsApplicable ? '✅ TCS Mandatory' : 'TCS Not Applicable'}
                      </span>
                    </div>
                  </FG>
                </div>
                {/* Purchase type description */}
                {form.purchaseType && (
                  <div style={{ marginTop:10, padding:'8px 12px', background:'#fff',
                    borderRadius:5, fontSize:11, color:'#6C757D', border:'1px solid #E0D5E0' }}>
                    💡 Selected: <strong style={{ color:'#714B67' }}>
                      {PURCHASE_TYPES.find(p=>p.code===form.purchaseType)?.label}
                    </strong>
                    {['SEZ','SEWOP','EXPWOP','EXPWP'].includes(form.purchaseType) &&
                      <span style={{ marginLeft:8, color:'#856404', fontWeight:600 }}>
                        ⚡ Special GST treatment applicable
                      </span>
                    }
                  </div>
                )}
              </div>

              {/* MSME Details */}
              <div style={{ background:'#F8F4F8', borderRadius:8, padding:16, border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
                  🏭 MSME Registration
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12,
                  padding:'10px 14px', background:'#fff', borderRadius:6,
                  border:'1.5px solid #E0D5E0', cursor:'pointer', width:'fit-content' }}
                  onClick={() => setForm(f => ({...f, msmeRegistered: !f.msmeRegistered}))}>
                  <input type='checkbox' checked={!!form.msmeRegistered} readOnly
                    style={{ width:16, height:16, accentColor:'#714B67', cursor:'pointer' }} />
                  <span style={{ fontSize:13, fontWeight:600,
                    color: form.msmeRegistered ? '#714B67' : '#6C757D' }}>
                    {form.msmeRegistered ? '✅ MSME Registered' : 'MSME Registered?'}
                  </span>
                </div>
                {form.msmeRegistered && (
                  <div style={grid(3)}>
                    <FG label="MSME Registration Number" span={2}>
                      <input {...F('msmeNumber')} placeholder="UDYAM-TN-XX-XXXXXXX"
                        style={{ ...inp, fontFamily:'DM Mono,monospace', textTransform:'uppercase' }} />
                    </FG>
                    <FG label="MSME Type">
                      <select {...F('msmeType')} style={{ ...inp, cursor:'pointer' }}>
                        {MSME_TYPES.map(t => (
                          <option key={t} value={t}>{t} Enterprise</option>
                        ))}
                      </select>
                    </FG>
                    <div style={{ gridColumn:'span 3', padding:'8px 12px',
                      background:'#D4EDDA', borderRadius:5, fontSize:11, color:'#155724', fontWeight:600 }}>
                      ✅ MSME {form.msmeType} Enterprise — Eligible for priority payment within 45 days
                      as per MSME Development Act.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CONTACTS */}
          {tab === 'contacts' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:12, color:'#6C757D' }}>
                  💡 Multiple contact persons per vendor. Primary contact shown in lists.
                </div>
                <button onClick={addContact}
                  style={{ padding:'7px 16px', background:'#714B67', color:'#fff',
                    border:'none', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  + Add Contact
                </button>
              </div>
              {contacts.length === 0 ? (
                <div style={{ padding:30, textAlign:'center', color:'#6C757D',
                  border:'2px dashed #E0D5E0', borderRadius:8 }}>
                  👥 No contacts — click "+ Add Contact"
                </div>
              ) : contacts.map((c, i) => (
                <div key={c.id} style={{ border: c.isPrimary?'2px solid #714B67':'1px solid #E0D5E0',
                  borderRadius:8, overflow:'hidden', marginBottom:10 }}>
                  <div style={{ background: c.isPrimary?'#714B67':'#F8F4F8',
                    padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color: c.isPrimary?'#fff':'#714B67' }}>
                        Contact #{i+1}
                      </span>
                      {c.isPrimary
                        ? <span style={{ background:'#F5C518', color:'#1C1C1C', padding:'1px 8px',
                            borderRadius:10, fontSize:10, fontWeight:700 }}>⭐ PRIMARY</span>
                        : <button onClick={() => setPrimary(c.id)}
                            style={{ padding:'2px 10px', background:'#fff', color:'#714B67',
                              border:'1px solid #714B67', borderRadius:10, fontSize:10,
                              fontWeight:600, cursor:'pointer' }}>Set Primary</button>
                      }
                    </div>
                    <span onClick={() => delContact(c.id)}
                      style={{ cursor:'pointer', color: c.isPrimary?'rgba(255,255,255,.7)':'#DC3545', fontSize:18 }}>✕</span>
                  </div>
                  <div style={{ padding:14, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
                    <div><label style={lbl}>Name</label>
                      <input style={inp} value={c.name} onChange={e=>updContact(c.id,'name',e.target.value)}
                        placeholder="Mr. Rajan Kumar" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                    <div><label style={lbl}>Designation</label>
                      <input style={inp} value={c.designation} onChange={e=>updContact(c.id,'designation',e.target.value)}
                        placeholder="Sales Manager" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                    <div><label style={lbl}>Mobile</label>
                      <input style={inp} value={c.phone} onChange={e=>updContact(c.id,'phone',e.target.value)}
                        placeholder="9XXXXXXXXX" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                    <div><label style={lbl}>Email</label>
                      <input style={inp} value={c.email} onChange={e=>updContact(c.id,'email',e.target.value)}
                        placeholder="rajan@vendor.com" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'space-between', alignItems:'center', background:'#F8F7FA' }}>
          <div style={{ display:'flex', gap:8 }}>
            {TABS.map(t => (
              <span key={t.id} onClick={() => setTab(t.id)}
                style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                  cursor:'pointer', border:'1px solid #E0D5E0',
                  background: tab===t.id ? '#714B67' : '#fff',
                  color: tab===t.id ? '#fff' : '#6C757D' }}>
                {t.icon}
              </span>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onCancel}
              style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
                border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              style={{ padding:'8px 24px', background: saving?'#9E7D96':'#714B67',
                color:'#fff', border:'none', borderRadius:6, fontSize:13,
                fontWeight:700, cursor: saving?'not-allowed':'pointer' }}>
              {saving ? '⏳ Saving...' : (isEdit ? '💾 Update Vendor' : '💾 Create Vendor')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN LIST ─────────────────────────────────────────────
export default function VendorMaster() {
  const [rows,     setRows]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [catFilter,setCatFilter]= useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editVen,  setEditVen]  = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res  = await fetch(`${BASE_URL}/vendors`, { headers: authHdrs() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRows(data.data || [])
    } catch(err) {
      toast.error('Failed to load: ' + err.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const deactivate = async (id) => {
    if (!confirm('Deactivate this vendor?')) return
    await fetch(`${BASE_URL}/vendors/${id}`, { method:'DELETE', headers: authHdrs() })
    toast.success('Vendor deactivated!')
    fetchData()
  }

  const categories = ['All', ...new Set(rows.map(r => r.vendorCategory).filter(Boolean))]

  const filtered = rows.filter(r =>
    (catFilter === 'All' || r.vendorCategory === catFilter) &&
    (r.code?.toLowerCase().includes(search.toLowerCase()) ||
     r.name?.toLowerCase().includes(search.toLowerCase()) ||
     r.city?.toLowerCase().includes(search.toLowerCase()) ||
     r.gstin?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            Vendor Master
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            SAP: XK01/XK03 &nbsp;|&nbsp; {rows.length} vendors
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={fetchData}
            style={{ padding:'8px 14px', background:'#fff', color:'#714B67',
              border:'1.5px solid #714B67', borderRadius:6, fontSize:12,
              fontWeight:600, cursor:'pointer' }}>🔄 Refresh</button>
          <button onClick={() => { setEditVen(null); setShowForm(true) }}
            style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
              border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            + New Vendor
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:'8px 12px', background:'#E6F7F7', border:'1px solid #00A09D',
        borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
        <strong>Vendor Master</strong> — All suppliers with purchase terms, bank details and GST info.
        SAP XK01 equivalent. Code format: <strong>C + FirstLetter + Sequential (CA0001)</strong>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Vendors',    value: rows.length,                                  color:'#714B67', bg:'#EDE0EA' },
          { label:'Raw Material',     value: rows.filter(r=>r.vendorCategory==='Raw Material').length, color:'#155724', bg:'#D4EDDA' },
          { label:'Services',         value: rows.filter(r=>r.vendorCategory==='Services').length,     color:'#0C5460', bg:'#D1ECF1' },
          { label:'Active',           value: rows.filter(r=>r.isActive).length,            color:'#856404', bg:'#FFF3CD' },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, borderRadius:8,
            padding:'12px 16px', border:`1px solid ${k.color}22` }}>
            <div style={{ fontSize:11, color:k.color, fontWeight:600,
              textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color,
              fontFamily:'Syne,sans-serif', lineHeight:1.2 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center', flexWrap:'wrap' }}>
        <input placeholder="🔍 Search code, name, city, GSTIN..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:'7px 12px', border:'1.5px solid #E0D5E0', borderRadius:6,
            fontSize:12, outline:'none', width:300 }} />
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {categories.slice(0,6).map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                cursor:'pointer', border:'1px solid #E0D5E0',
                background: catFilter===c ? '#714B67' : '#fff',
                color: catFilter===c ? '#fff' : '#6C757D' }}>
              {c}
            </button>
          ))}
        </div>
        <span style={{ fontSize:11, color:'#6C757D', marginLeft:'auto' }}>
          {filtered.length} of {rows.length}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'1px solid #E0D5E0' }}>
          ⏳ Loading vendors...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div style={{ maxHeight:'calc(100vh - 380px)', overflowY:'auto', overflowX:'auto',
          border:'1px solid #E0D5E0', borderRadius:8, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <table style={{ width:'100%', minWidth:950, borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0, zIndex:10, background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Code','Vendor Name','Category','GSTIN','City / State',
                  'Credit Days','Pay Terms','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase',
                    letterSpacing:.5, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ borderBottom:'1px solid #F0EEF0',
                  background: i%2===0?'#fff':'#FDFBFD' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                  <td style={{ padding:'10px 14px', fontFamily:'DM Mono,monospace',
                    fontWeight:700, color:'#714B67', fontSize:12 }}>{r.code}</td>
                  <td style={{ padding:'10px 14px', fontWeight:600, fontSize:13 }}>{r.name}</td>
                  <td style={{ padding:'10px 14px' }}>
                    {r.vendorCategory ? (
                      <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11,
                        fontWeight:600, background:'#EDE0EA', color:'#714B67' }}>
                        {r.vendorCategory}
                      </span>
                    ) : <span style={{ color:'#CCC' }}>—</span>}
                  </td>
                  <td style={{ padding:'10px 14px', fontSize:11,
                    fontFamily:'DM Mono,monospace', color:'#495057' }}>
                    {r.gstin || <span style={{ color:'#CCC' }}>—</span>}
                  </td>
                  <td style={{ padding:'10px 14px', fontSize:12 }}>
                    {r.city}{r.state ? `, ${r.state}` : ''}
                  </td>
                  <td style={{ padding:'10px 14px', fontSize:12, textAlign:'center',
                    fontWeight:600, color:'#714B67' }}>{r.creditDays} days</td>
                  <td style={{ padding:'10px 14px', fontSize:12 }}>{r.paymentTerms || 'Net 30'}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ padding:'3px 9px', borderRadius:10, fontSize:11, fontWeight:600,
                      background: r.isActive?'#D4EDDA':'#F8D7DA',
                      color: r.isActive?'#155724':'#721C24' }}>
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => { setEditVen(r); setShowForm(true) }}
                        style={{ padding:'4px 12px', background:'#714B67', color:'#fff',
                          border:'none', borderRadius:4, fontSize:12, cursor:'pointer' }}>
                        Edit
                      </button>
                      {r.isActive && (
                        <button onClick={() => deactivate(r.id)}
                          style={{ padding:'4px 10px', background:'#fff', color:'#6C757D',
                            border:'1px solid #6C757D', borderRadius:4, fontSize:12, cursor:'pointer' }}>
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={9} style={{ padding:40, textAlign:'center',
                  color:'#6C757D', fontSize:13 }}>
                  {rows.length === 0
                    ? '🏭 No vendors yet — click "+ New Vendor" to add one'
                    : 'No vendors match your search'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <VendorForm
          vendor={editVen}
          rows={rows}
          onSave={() => { setShowForm(false); setEditVen(null); fetchData() }}
          onCancel={() => { setShowForm(false); setEditVen(null) }}
        />
      )}
    </div>
  )
}
