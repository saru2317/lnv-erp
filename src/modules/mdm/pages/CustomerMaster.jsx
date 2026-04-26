import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const STATES = ['Tamil Nadu','Karnataka','Kerala','Andhra Pradesh','Telangana','Maharashtra',
  'Gujarat','Rajasthan','Punjab','Haryana','Delhi','Uttar Pradesh','West Bengal','Other']
const PAYMENT_TERMS = ['Immediate','7 Days','15 Days','Net 30','Net 45','Net 60','Net 90','Advance']
const CUSTOMER_TYPES = [
  { key:'A', label:'Type A — Key Account',    color:'#D4EDDA', text:'#155724' },
  { key:'B', label:'Type B — Regular',        color:'#D1ECF1', text:'#0C5460' },
]

const BLANK = {
  // General
  code:'', name:'', type:'B', gstin:'', gstRegType:'registered', phone:'', email:'', creditDays:'30',
  // Address
  address:'', city:'', state:'Tamil Nadu', pincode:'',
  // Additional
  contactPerson:'', altPhone:'', website:'', panNo:'',
  // Sales
  paymentTerms:'Net 30', priceList:'Standard', currency:'INR',
  salesRep:'', creditLimit:'', overdueLimit:'',
  // Bank
  bankName:'', bankBranch:'', accountNo:'', ifsc:'',
}

const TABS = [
  { id:'general',  label:'General Data',   icon:'🏢' },
  { id:'address',  label:'Address',         icon:'📍' },
  { id:'sales',    label:'Sales Data',      icon:'💼' },
  { id:'bank',     label:'Bank Details',    icon:'🏦' },
  { id:'shipto',   label:'Ship-to Address', icon:'🚚' },
  { id:'contacts', label:'Contacts',        icon:'👥' },
]

const inp = {
  padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box',
  fontFamily:'DM Sans,sans-serif', transition:'border-color .2s'
}
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block',
  marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }
const FG  = ({ label, children, span=1, req=false }) => (
  <div style={{ gridColumn:`span ${span}` }}>
    <label style={lbl}>{label}{req && <span style={{ color:'#DC3545' }}> *</span>}</label>
    {children}
  </div>
)

// ── Customer Form Modal ───────────────────────────────────
function CustomerForm({ customer, onSave, onCancel, rows = [] }) {
  const isEdit = !!customer?.id
  const [form, setForm]   = useState(customer ? {
    code: customer.code, name: customer.name, type: customer.type||'B',
    gstin: customer.gstin||'', phone: customer.phone||'', email: customer.email||'',
    creditDays: String(customer.creditDays||30), address: customer.address||'',
    city: customer.city||'', state: customer.state||'Tamil Nadu',
    pincode: customer.pincode||'',
    contactPerson:'', altPhone:'', website:'', panNo:'',
    paymentTerms:'Net 30', priceList:'Standard', currency:'INR',
    salesRep:'', creditLimit:'', overdueLimit:'',
    bankName:'', bankBranch:'', accountNo:'', ifsc:'',
  } : BLANK)
  const [tab,      setTab]    = useState('general')
  const [saving,   setSaving] = useState(false)
  const [shipTos,  setShipTos] = useState(customer?.shipToAddresses || [])
  const [contacts, setContacts]= useState(customer?.contacts || [])

  const addShipTo  = () => setShipTos(s => [...s, { id:Date.now(), label:'', address:'', city:'', state:'Tamil Nadu', pincode:'', gstin:'', gstType:'Regular', contactPerson:'', phone:'', isDefault:s.length===0 }])
  const delShipTo  = (id) => setShipTos(s => s.filter(x => x.id !== id))
  const updShipTo  = (id, k, v) => setShipTos(s => s.map(x => x.id===id ? {...x,[k]:v} : x))
  const setDefault = (id) => setShipTos(s => s.map(x => ({...x, isDefault: x.id===id})))
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

  // Sequential code: D + FirstLetter + 0001,0002...
  const getNextCode = (name, existingRows) => {
    const list   = existingRows || []
    const fl     = name?.trim() ? name.trim()[0].toUpperCase() : 'X'
    const prefix = 'D' + fl
    const existing = list.filter(r => r.code && r.code.startsWith(prefix))
    if (existing.length === 0) return prefix + '0001'
    const nums = existing.map(r => parseInt(r.code.replace(prefix,''), 10) || 0)
    return prefix + String(Math.max(...nums) + 1).padStart(4, '0')
  }

  const genCode = () => setForm(f => ({...f, code: getNextCode(f.name, rows)}))

  const onNameChange = (e) => {
    const name = e.target.value
    const wasAuto = !form.code || /^D[A-Z][0-9]{4}$/.test(form.code)
    const newCode = (wasAuto && name.trim()) ? getNextCode(name, rows) : form.code
    setForm(f => ({ ...f, name, code: newCode }))
  }

  // GSTIN validation - 15 char format
  const validateGSTIN = (v) => {
    if (!v) return true
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v)
  }

  const save = async () => {
    if (!form.code || !form.name) return toast.error('Code and Name required!')
    if (form.gstin && !validateGSTIN(form.gstin))
      return toast.error('Invalid GSTIN format!')
    setSaving(true)
    try {
      const url    = isEdit ? `${BASE_URL}/customers/${customer.id}` : `${BASE_URL}/customers`
      const method = isEdit ? 'PATCH' : 'POST'
      const res    = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(form) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Customer ${isEdit?'updated':'created'}!`)
      onSave()
    } catch(err) {
      toast.error('Error: ' + err.message)
    } finally { setSaving(false) }
  }

  const grid = (cols=2) => ({
    display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:'12px 16px'
  })

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:'90%', maxWidth:900,
        maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700 }}>
              {isEdit ? `Edit Customer — ${customer.code}` : 'New Customer Master'}
            </h3>
            <p style={{ color:'rgba(255,255,255,.6)', margin:'2px 0 0', fontSize:11 }}>
              SAP: XD01 / XD03 — Customer Master Data
            </p>
          </div>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'2px solid #E0D5E0', background:'#F8F7FA' }}>
          {TABS.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'10px 20px', cursor:'pointer', fontSize:12, fontWeight:600,
                color: tab===t.id ? '#714B67' : '#6C757D',
                borderBottom: tab===t.id ? '2px solid #714B67' : '2px solid transparent',
                marginBottom:-2, whiteSpace:'nowrap' }}>
              {t.icon} {t.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', height:480, minHeight:480, maxHeight:480, padding:'16px 20px' }}>

          {/* GENERAL DATA */}
          {tab==='general' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'#F8F4F8', borderRadius:8, padding:16,
                border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
                  📋 Basic Information
                </div>
                <div style={grid(3)}>
                  <FG label="Customer Code" req>
                    <div style={{ display:'flex', gap:4 }}>
                      <input {...F('code')} placeholder="CUST-001"
                        style={{ ...inp, fontFamily:'DM Mono,monospace', flex:1 }}
                        disabled={isEdit}
                        onFocus={e=>e.target.style.borderColor='#714B67'}
                        onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                      {!isEdit && (
                        <button onClick={genCode}
                          style={{ padding:'8px 10px', background:'#714B67', color:'#fff',
                            border:'none', borderRadius:5, fontSize:11, cursor:'pointer' }}>
                          Auto
                        </button>
                      )}
                    </div>
                  </FG>
                  <FG label="Customer Name" req span={2}>
                    <input value={form.name ?? ''} onChange={onNameChange}
                      style={inp} placeholder="e.g. Autocats India Pvt Ltd"
                      onFocus={e=>e.target.style.borderColor='#714B67'}
                      onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                  </FG>
                  <FG label="Customer Type">
                    <select {...F('type')} style={{ ...inp, cursor:'pointer' }}>
                      {CUSTOMER_TYPES.map(t => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                  </FG>
                  <FG label="GSTIN">
                    <input {...F('gstin')} placeholder="33AABCA1234A1Z5"
                      style={{ ...inp, fontFamily:'DM Mono,monospace',
                        textTransform:'uppercase',
                        borderColor: form.gstin && !validateGSTIN(form.gstin) ? '#DC3545' : '#E0D5E0' }} />
                    {form.gstin && !validateGSTIN(form.gstin) && (
                      <span style={{ fontSize:10, color:'#DC3545' }}>Invalid GSTIN format</span>
                    )}
                  </FG>
                  <FG label="GST Registration Type">
                    <select {...F('gstRegType')} style={{ ...inp, cursor:'pointer',
                      background: form.gstRegType==='unregistered'?'#FFF3CD':
                                  form.gstRegType==='composition'?'#D1ECF1':'#fff',
                      borderColor: form.gstRegType==='unregistered'?'#FFC107':
                                   form.gstRegType==='composition'?'#17A2B8':'#E0D5E0',
                    }}>
                      <option value="registered">Registered (Regular) — B2B</option>
                      <option value="unregistered">Unregistered — B2C (Consumer)</option>
                      <option value="composition">Composition Dealer</option>
                      <option value="sez">SEZ / Export Customer</option>
                      <option value="overseas">Overseas / Export</option>
                    </select>
                    {form.gstRegType==='unregistered' && (
                      <div style={{fontSize:10,color:'#856404',marginTop:3,fontWeight:600}}>
                        B2C — GST charged and paid by you. Invoice reported as B2C in GSTR-1.
                      </div>
                    )}
                    {form.gstRegType==='sez' && (
                      <div style={{fontSize:10,color:'#155724',marginTop:3,fontWeight:600}}>
                        Zero-rated supply. No GST charged. LUT/Bond required. ITC refund available.
                      </div>
                    )}
                  </FG>
                  <FG label="PAN No">
                    <input {...F('panNo')} placeholder="AABCA1234A"
                      style={{ ...inp, fontFamily:'DM Mono,monospace', textTransform:'uppercase' }} />
                  </FG>
                </div>
              </div>

              <div style={{ background:'#F8F4F8', borderRadius:8, padding:16,
                border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
                  📞 Contact Information
                </div>
                <div style={grid(3)}>
                  <FG label="Phone">
                    <input {...F('phone')} placeholder="9876543210" />
                  </FG>
                  <FG label="Alt Phone">
                    <input {...F('altPhone')} placeholder="9876543211" />
                  </FG>
                  <FG label="Email">
                    <input {...F('email')} type="email" placeholder="purchase@company.com" />
                  </FG>
                  <FG label="Contact Person">
                    <input {...F('contactPerson')} placeholder="Mr. Rajesh Kumar" />
                  </FG>
                  <FG label="Website">
                    <input {...F('website')} placeholder="www.company.com" />
                  </FG>
                </div>
              </div>
            </div>
          )}

          {/* ADDRESS */}
          {tab==='address' && (
            <div style={{ background:'#F8F4F8', borderRadius:8, padding:16,
              border:'1px solid #E0D5E0' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
                📍 Billing / Registered Address
              </div>
              <div style={grid(2)}>
                <FG label="Address" span={2}>
                  <textarea {...F('address')} placeholder="Door No, Street Name, Area"
                    style={{ ...inp, minHeight:70, resize:'vertical' }} />
                </FG>
                <FG label="City">
                  <input {...F('city')} placeholder="Coimbatore" />
                </FG>
                <FG label="State">
                  <select {...F('state')} style={{ ...inp, cursor:'pointer' }}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </FG>
                <FG label="Pincode">
                  <input {...F('pincode')} placeholder="641001" maxLength={6} />
                </FG>
                <FG label="Country">
                  <input style={inp} value="India" readOnly
                    style={{ ...inp, background:'#F8F7FA', color:'#6C757D' }} />
                </FG>
              </div>
            </div>
          )}

          {/* SALES DATA */}
          {tab==='sales' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'#F8F4F8', borderRadius:8, padding:16,
                border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
                  💼 Sales Area Data
                </div>
                <div style={grid(3)}>
                  <FG label="Payment Terms">
                    <select {...F('paymentTerms')} style={{ ...inp, cursor:'pointer' }}>
                      {PAYMENT_TERMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </FG>
                  <FG label="Credit Days">
                    <input {...F('creditDays')} type="number" placeholder="30" min="0" />
                  </FG>
                  <FG label="Currency">
                    <select {...F('currency')} style={{ ...inp, cursor:'pointer' }}>
                      <option>INR</option><option>USD</option><option>EUR</option>
                    </select>
                  </FG>
                  <FG label="Price List">
                    <select {...F('priceList')} style={{ ...inp, cursor:'pointer' }}>
                      <option>Standard</option><option>Wholesale</option>
                      <option>Retail</option><option>Special</option>
                    </select>
                  </FG>
                  <FG label="Credit Limit (₹)">
                    <input {...F('creditLimit')} type="number" placeholder="500000" />
                  </FG>
                  <FG label="Sales Rep">
                    <input {...F('salesRep')} placeholder="Senthil Kumar" />
                  </FG>
                </div>
              </div>
            </div>
          )}

          {/* BANK */}
          {tab==='bank' && (
            <div style={{ background:'#F8F4F8', borderRadius:8, padding:16,
              border:'1px solid #E0D5E0' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
                🏦 Bank Details
              </div>
              <div style={grid(2)}>
                <FG label="Bank Name">
                  <input {...F('bankName')} placeholder="HDFC Bank" />
                </FG>
                <FG label="Branch">
                  <input {...F('bankBranch')} placeholder="Coimbatore Main" />
                </FG>
                <FG label="Account No">
                  <input {...F('accountNo')} placeholder="1234567890"
                    style={{ ...inp, fontFamily:'DM Mono,monospace' }} />
                </FG>
                <FG label="IFSC Code">
                  <input {...F('ifsc')} placeholder="HDFC0001234"
                    style={{ ...inp, fontFamily:'DM Mono,monospace', textTransform:'uppercase' }} />
                </FG>
              </div>
            </div>
          )}

          {/* SHIP-TO ADDRESSES */}
          {tab==='shipto' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:12, color:'#6C757D' }}>
                  💡 Each ship-to has its own GSTIN. State determines CGST+SGST or IGST.
                </div>
                <button onClick={addShipTo} style={{ padding:'7px 16px', background:'#28A745',
                  color:'#fff', border:'none', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  + Add Ship-to Address
                </button>
              </div>
              {shipTos.length === 0 ? (
                <div style={{ padding:30, textAlign:'center', color:'#6C757D',
                  border:'2px dashed #E0D5E0', borderRadius:8 }}>
                  🚚 No ship-to addresses — click "+ Add Ship-to Address"
                </div>
              ) : shipTos.map((s, i) => (
                <div key={s.id} style={{ border: s.isDefault ? '2px solid #714B67' : '1px solid #E0D5E0',
                  borderRadius:8, overflow:'hidden', marginBottom:10 }}>
                  <div style={{ background: s.isDefault ? '#714B67' : '#F8F4F8',
                    padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color: s.isDefault?'#fff':'#714B67' }}>Ship-to #{i+1}</span>
                      {s.isDefault
                        ? <span style={{ background:'#F5C518', color:'#1C1C1C', padding:'1px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>⭐ DEFAULT</span>
                        : <button onClick={() => setDefault(s.id)} style={{ padding:'2px 10px', background:'#fff', color:'#714B67', border:'1px solid #714B67', borderRadius:10, fontSize:10, fontWeight:600, cursor:'pointer' }}>Set Default</button>
                      }
                    </div>
                    <span onClick={() => delShipTo(s.id)} style={{ cursor:'pointer', color: s.isDefault?'rgba(255,255,255,.7)':'#DC3545', fontSize:18 }}>✕</span>
                  </div>
                  <div style={{ padding:14 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                      <div><label style={lbl}>Label / Name</label>
                        <input style={inp} value={s.label} onChange={e=>updShipTo(s.id,'label',e.target.value)} placeholder="Factory, Warehouse, Store" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                      <div><label style={lbl}>City</label>
                        <input style={inp} value={s.city} onChange={e=>updShipTo(s.id,'city',e.target.value)} placeholder="City" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                      <div><label style={lbl}>State</label>
                        <select style={{...inp,cursor:'pointer'}} value={s.state} onChange={e=>updShipTo(s.id,'state',e.target.value)}>
                          {STATES.map(st=><option key={st}>{st}</option>)}</select></div>
                      <div><label style={lbl}>Pincode</label>
                        <input style={inp} value={s.pincode} onChange={e=>updShipTo(s.id,'pincode',e.target.value)} placeholder="641001" maxLength={6} onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                    </div>
                    <div style={{ marginBottom:10 }}><label style={lbl}>Full Address</label>
                      <textarea style={{...inp,minHeight:50,resize:'vertical'}} value={s.address} onChange={e=>updShipTo(s.id,'address',e.target.value)} placeholder="Door No., Street, Area, Landmark" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                    <div style={{ background:'#F8F4F8', borderRadius:6, padding:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#714B67', marginBottom:8, textTransform:'uppercase', letterSpacing:.4 }}>🧾 GST Details — Place of Supply</div>
                      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:10 }}>
                        <div><label style={lbl}>GSTIN (Ship-to)</label>
                          <input style={{...inp,fontFamily:'DM Mono,monospace',textTransform:'uppercase'}} value={s.gstin||''} onChange={e=>updShipTo(s.id,'gstin',e.target.value)} placeholder="33AABCA1234A1Z5" maxLength={15} onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                        <div><label style={lbl}>GST Type</label>
                          <select style={{...inp,cursor:'pointer'}} value={s.gstType||'Regular'} onChange={e=>updShipTo(s.id,'gstType',e.target.value)}>
                            <option>Regular</option><option>Composition</option><option>Unregistered</option><option>SEZ</option><option>Export</option></select></div>
                        <div><label style={lbl}>Site Contact</label>
                          <input style={inp} value={s.contactPerson||''} onChange={e=>updShipTo(s.id,'contactPerson',e.target.value)} placeholder="Contact at site" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                        <div><label style={lbl}>Site Phone</label>
                          <input style={inp} value={s.phone||''} onChange={e=>updShipTo(s.id,'phone',e.target.value)} placeholder="9XXXXXXXXX" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                      </div>
                      {s.state && (
                        <div style={{ marginTop:8, padding:'6px 10px', background:'#fff', borderRadius:5, fontSize:11, display:'flex', gap:16, flexWrap:'wrap' }}>
                          <span>📍 <strong>{s.state}</strong></span>
                          <span>GST Code: <strong style={{color:'#714B67'}}>
                            {({'Tamil Nadu':'33','Karnataka':'29','Kerala':'32','Andhra Pradesh':'37','Telangana':'36','Maharashtra':'27','Gujarat':'24','Delhi':'07','Rajasthan':'08','Punjab':'03','West Bengal':'19','Haryana':'06','Uttar Pradesh':'09'})[s.state]||'--'}
                          </strong></span>
                          <strong style={{color:s.state==='Tamil Nadu'?'#155724':'#856404'}}>
                            {s.state==='Tamil Nadu'?'✅ CGST + SGST':'⚡ IGST (Inter-state)'}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CONTACTS */}
          {tab==='contacts' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:12, color:'#6C757D' }}>💡 Multiple contacts per customer. Primary contact shown in lists.</div>
                <button onClick={addContact} style={{ padding:'7px 16px', background:'#714B67', color:'#fff', border:'none', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer' }}>+ Add Contact</button>
              </div>
              {contacts.length === 0 ? (
                <div style={{ padding:30, textAlign:'center', color:'#6C757D', border:'2px dashed #E0D5E0', borderRadius:8 }}>
                  👥 No contacts — click "+ Add Contact"
                </div>
              ) : contacts.map((c, i) => (
                <div key={c.id} style={{ border: c.isPrimary?'2px solid #714B67':'1px solid #E0D5E0', borderRadius:8, overflow:'hidden', marginBottom:10 }}>
                  <div style={{ background: c.isPrimary?'#714B67':'#F8F4F8', padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color: c.isPrimary?'#fff':'#714B67' }}>Contact #{i+1}</span>
                      {c.isPrimary
                        ? <span style={{ background:'#F5C518', color:'#1C1C1C', padding:'1px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>⭐ PRIMARY</span>
                        : <button onClick={() => setPrimary(c.id)} style={{ padding:'2px 10px', background:'#fff', color:'#714B67', border:'1px solid #714B67', borderRadius:10, fontSize:10, fontWeight:600, cursor:'pointer' }}>Set Primary</button>
                      }
                    </div>
                    <span onClick={() => delContact(c.id)} style={{ cursor:'pointer', color: c.isPrimary?'rgba(255,255,255,.7)':'#DC3545', fontSize:18 }}>✕</span>
                  </div>
                  <div style={{ padding:14, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
                    <div><label style={lbl}>Contact Name</label>
                      <input style={inp} value={c.name} onChange={e=>updContact(c.id,'name',e.target.value)} placeholder="Mr. Rajesh Kumar" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                    <div><label style={lbl}>Designation</label>
                      <input style={inp} value={c.designation} onChange={e=>updContact(c.id,'designation',e.target.value)} placeholder="Purchase Manager" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                    <div><label style={lbl}>Mobile</label>
                      <input style={inp} value={c.phone} onChange={e=>updContact(c.id,'phone',e.target.value)} placeholder="9XXXXXXXXX" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                    <div><label style={lbl}>Email</label>
                      <input style={inp} value={c.email} onChange={e=>updContact(c.id,'email',e.target.value)} placeholder="rajesh@company.com" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background:'#F8F7FA' }}>
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
              style={{ padding:'8px 24px',
                background: saving ? '#9E7D96' : '#714B67',
                color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700,
                cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '⏳ Saving...' : (isEdit ? '💾 Update Customer' : '💾 Create Customer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN LIST ─────────────────────────────────────────────
export default function CustomerMaster() {
  const [rows,     setRows]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [typeF,    setTypeF]    = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editCust, setEditCust] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res  = await fetch(`${BASE_URL}/customers`, { headers: authHdrs() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRows(data.data || [])
    } catch(err) {
      toast.error('Failed to load: ' + err.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const deactivate = async (id) => {
    if (!confirm('Deactivate this customer?')) return
    await fetch(`${BASE_URL}/customers/${id}`, { method:'DELETE', headers: authHdrs() })
    toast.success('Customer deactivated!')
    fetchData()
  }

  const filtered = rows.filter(r =>
    (typeF === 'All' || r.type === typeF) &&
    (r.code.toLowerCase().includes(search.toLowerCase()) ||
     r.name.toLowerCase().includes(search.toLowerCase()) ||
     (r.city||'').toLowerCase().includes(search.toLowerCase()) ||
     (r.gstin||'').toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            Customer Master
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            MDM › Customers &nbsp;|&nbsp; SAP: XD01/XD03 &nbsp;|&nbsp; {rows.length} customers
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={fetchData}
            style={{ padding:'8px 14px', background:'#fff', color:'#714B67',
              border:'1.5px solid #714B67', borderRadius:6, fontSize:12,
              fontWeight:600, cursor:'pointer' }}>🔄 Refresh</button>
          <button onClick={() => { setEditCust(null); setShowForm(true) }}
            style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
              border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            + New Customer
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:'8px 12px', background:'#E6F7F7', border:'1px solid #00A09D',
        borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
        <strong>Customer Master</strong> — Complete customer data: General, Address, Sales Terms, Bank Details
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Customers', value: rows.length,                                color:'#714B67', bg:'#EDE0EA' },
          { label:'Type A (Key)',     value: rows.filter(r=>r.type==='A').length,        color:'#155724', bg:'#D4EDDA' },
          { label:'Type B (Regular)', value: rows.filter(r=>r.type==='B').length,        color:'#0C5460', bg:'#D1ECF1' },
          { label:'States Covered',   value: new Set(rows.map(r=>r.state).filter(Boolean)).size, color:'#856404', bg:'#FFF3CD' },
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
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
        <input placeholder="🔍 Search code, name, city, GSTIN..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:'7px 12px', border:'1.5px solid #E0D5E0', borderRadius:6,
            fontSize:12, outline:'none', width:320 }} />
        <div style={{ display:'flex', gap:4 }}>
          {['All','A','B'].map(t => (
            <button key={t} onClick={() => setTypeF(t)}
              style={{ padding:'6px 14px', borderRadius:20, fontSize:11, fontWeight:600,
                cursor:'pointer', border:'1px solid #E0D5E0',
                background: typeF===t ? '#714B67' : '#fff',
                color: typeF===t ? '#fff' : '#6C757D' }}>
              {t==='All'?'All':t==='A'?'Type A (Key)':'Type B (Regular)'}
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
          ⏳ Loading customers...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div style={{ maxHeight:'calc(100vh - 380px)', overflowY:'auto', overflowX:'auto',
          border:'1px solid #E0D5E0', borderRadius:8,
          boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <table style={{ width:'100%', minWidth:900, borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0, zIndex:10, background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Code','Customer Name','Type','GSTIN','Phone','City','State',
                  'Credit Days','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase',
                    letterSpacing:.5, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const ct = CUSTOMER_TYPES.find(t => t.key === r.type)
                return (
                  <tr key={r.id} style={{ borderBottom:'1px solid #F0EEF0',
                    background:i%2===0?'#fff':'#FDFBFD' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                    <td style={{ padding:'10px 14px', fontFamily:'DM Mono,monospace',
                      fontWeight:700, color:'#714B67', fontSize:12 }}>{r.code}</td>
                    <td style={{ padding:'10px 14px', fontWeight:600, fontSize:13 }}>{r.name}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ padding:'3px 9px', borderRadius:10, fontSize:11,
                        fontWeight:700, background:ct?.color, color:ct?.text }}>
                        {r.type}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:11,
                      fontFamily:'DM Mono,monospace', color:'#495057' }}>
                      {r.gstin || '—'}
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:12 }}>{r.phone || '—'}</td>
                    <td style={{ padding:'10px 14px', fontSize:12 }}>{r.city || '—'}</td>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'#6C757D' }}>{r.state || '—'}</td>
                    <td style={{ padding:'10px 14px', fontSize:12, textAlign:'center' }}>
                      <span style={{ padding:'3px 9px', borderRadius:10, fontSize:11,
                        fontWeight:600, background:'#EDE0EA', color:'#714B67' }}>
                        {r.creditDays} days
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ padding:'3px 9px', borderRadius:10, fontSize:11,
                        fontWeight:600, background:'#D4EDDA', color:'#155724' }}>
                        Active
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => { setEditCust(r); setShowForm(true) }}
                          style={{ padding:'4px 12px', background:'#714B67', color:'#fff',
                            border:'none', borderRadius:4, fontSize:12, cursor:'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => deactivate(r.id)}
                          style={{ padding:'4px 10px', background:'#fff', color:'#6C757D',
                            border:'1px solid #6C757D', borderRadius:4,
                            fontSize:12, cursor:'pointer' }}>
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={10} style={{ padding:40, textAlign:'center',
                  color:'#6C757D', fontSize:13 }}>
                  {rows.length === 0
                    ? '👥 No customers yet — click "+ New Customer" to add one'
                    : 'No customers match your search'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <CustomerForm
          rows={rows}
          customer={editCust}
          onSave={() => { setShowForm(false); setEditCust(null); fetchData() }}
          onCancel={() => { setShowForm(false); setEditCust(null) }}
        />
      )}
    </div>
  )
}
