import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { sdApi } from '../services/sdApi'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const BLANK_LINE = { itemCode:'', itemName:'', description:'', qty:1, unit:'NOS', unitPrice:0, gstRate:18 }

export default function QuotNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // CRM params (when coming from CRM Lead)
  const crmLeadId    = searchParams.get('crmLeadId')
  const crmLeadName  = searchParams.get('leadName')
  const crmCompany   = searchParams.get('company')
  const crmContact   = searchParams.get('contact')
  const crmEmail     = searchParams.get('email')
  const crmPhone     = searchParams.get('phone')

  // Form state
  const [customerName,    setCustName]    = useState(crmCompany||crmLeadName||'')
  const [customerGstin,   setCustGstin]   = useState('')
  const [customerState,   setCustState]   = useState('')
  const [contactPerson,   setContact]     = useState(crmContact||'')
  const [contactEmail,    setEmail]       = useState(crmEmail||'')
  const [contactPhone,    setPhone]       = useState(crmPhone||'')
  const [validDays,       setValidDays]   = useState(30)
  const [paymentTerms,    setPayTerms]    = useState('NET30')
  const [deliveryTerms,   setDelivTerms]  = useState('Ex-Works')
  const [notes,           setNotes]       = useState('')
  const [lines,           setLines]       = useState([{ ...BLANK_LINE }])
  const [saving,          setSaving]      = useState(false)
  const [customers,       setCustomers]   = useState([])
  const [items,           setItems]       = useState([])
  const [processes,       setProcesses]   = useState([])
  const [custSearch,      setCustSearch]  = useState('')
  const [showCustDrop,    setShowCustDrop]= useState(false)
  const [priceBook,       setPriceBook]   = useState([])

  // Load customers, items, processes, price book
  useEffect(() => {
    fetch(`${BASE_URL}/sd/customers`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>{ const arr=d.data||d; setCustomers(Array.isArray(arr)?arr:[]) }).catch(()=>{})
    fetch(`${BASE_URL}/mdm/items`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>{ const arr=d.data||d; setItems(Array.isArray(arr)?arr:[]) }).catch(()=>{})
    fetch(`${BASE_URL}/process`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>{ const arr=d.data||d; setProcesses(Array.isArray(arr)?arr:[]) }).catch(()=>{})
    fetch(`${BASE_URL}/sd/price-book`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>{ const arr=d.data||d; setPriceBook(Array.isArray(arr)?arr:[]) }).catch(()=>{})
  }, [])

  // CRM Lead — show banner
  const fromCRM = !!crmLeadId

  // Customer selection
  const filteredCusts = Array.isArray(customers) ? customers.filter(c =>
    c.name?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.code?.toLowerCase().includes(custSearch.toLowerCase())
  ).slice(0, 8) : []

  const selectCustomer = c => {
    setCustName(c.name)
    setCustGstin(c.gstin||'')
    setCustState(c.state||'')
    setCustSearch(c.name)
    setShowCustDrop(false)
  }

  // Auto-fill price from price book when item selected
  const autoFillPrice = async (lineIdx, itemCode, itemName) => {
    // Check price book first
    const pb = priceBook.find(p => p.itemCode===itemCode || p.itemName===itemName)
    if (pb) {
      updateLine(lineIdx, 'unitPrice', pb.basePrice)
      toast.success(`Price auto-filled from Price Book: ${INR(pb.basePrice)}`)
      return
    }
    // Try API resolve
    try {
      const res = await fetch(`${BASE_URL}/sd/price-book/resolve`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ itemCode, itemName, customerName })
      })
      const d = await res.json()
      if (d.data?.basePrice) {
        updateLine(lineIdx, 'unitPrice', d.data.basePrice)
        toast.success(`Price: ${INR(d.data.basePrice)} from ${d.data.priceListName}`)
      }
    } catch {}
  }

  // Line management
  const updateLine = (idx, key, val) => {
    setLines(ls => ls.map((l,i) => i===idx ? {...l, [key]: val} : l))
  }

  const addLine = () => setLines(ls => [...ls, { ...BLANK_LINE }])

  const removeLine = idx => setLines(ls => ls.filter((_,i) => i!==idx))

  // GST calculation
  const calcLine = l => {
    const taxable = parseFloat(l.qty||0) * parseFloat(l.unitPrice||0)
    const gst     = taxable * parseFloat(l.gstRate||0) / 100
    const isIntra = customerState?.toLowerCase().includes('tamil')
    return {
      taxable,
      cgst: isIntra ? gst/2 : 0,
      sgst: isIntra ? gst/2 : 0,
      igst: isIntra ? 0 : gst,
      total: taxable + gst,
    }
  }

  const totals = lines.reduce((acc, l) => {
    const c = calcLine(l)
    return { taxable: acc.taxable+c.taxable, cgst: acc.cgst+c.cgst, sgst: acc.sgst+c.sgst, igst: acc.igst+c.igst, grand: acc.grand+c.total }
  }, { taxable:0, cgst:0, sgst:0, igst:0, grand:0 })

  // Save quotation
  const save = async (sendToCustomer=false) => {
    if (!customerName) return toast.error('Customer name required')
    if (!lines.some(l=>l.itemName&&parseFloat(l.unitPrice)>0)) return toast.error('Add at least one line with price')

    setSaving(true)
    try {
      const payload = {
        customerName, customerGstin, customerState,
        contactPerson, contactEmail, contactPhone,
        validDays: parseInt(validDays), paymentTerms, deliveryTerms,
        notes, crmLeadId: crmLeadId||null,
        lines: lines.filter(l=>l.itemName).map(l => ({
          itemCode: l.itemCode||null, itemName: l.itemName,
          description: l.description||null,
          qty: parseFloat(l.qty||1), unit: l.unit||'NOS',
          unitPrice: parseFloat(l.unitPrice||0),
          gstRate: parseFloat(l.gstRate||18),
        }))
      }

      const r = await sdApi.createQuotation(payload)
      const quotNo = r?.data?.quotNo || r?.quotNo

      if (sendToCustomer) toast.success(`Quotation ${quotNo} created and marked as SENT`)
      else toast.success(`Quotation ${quotNo} saved as DRAFT`)

      navigate('/sd/quotations')
    } catch (e) { toast.error(e.message||'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'#714B67' }}>
            New Quotation
          </div>
          {fromCRM && (
            <div style={{ marginTop:4, background:'#FFF3CD', border:'1px solid #FFEEBA',
              borderRadius:6, padding:'4px 12px', fontSize:11, color:'#856404', fontWeight:600,
              display:'inline-flex', alignItems:'center', gap:6 }}>
              🔗 Created from CRM Lead: <strong>{crmLeadName||crmCompany}</strong>
              &nbsp;· Auto-populated below
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>navigate('/sd/quotations')}
            style={{ padding:'7px 16px', background:'#fff', border:'1px solid #E0D5E0', borderRadius:6, fontSize:12, cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={()=>save(false)} disabled={saving}
            style={{ padding:'7px 16px', background:'#6C757D', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            Save Draft
          </button>
          <button onClick={()=>save(true)} disabled={saving}
            style={{ padding:'7px 16px', background:'#714B67', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            {saving ? 'Saving...' : 'Save & Send'}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:14 }}>

        {/* Left — Main form */}
        <div>

          {/* Customer section */}
          <div style={{ background:'#fff', border:'1px solid #E0D5E0', borderRadius:8, padding:16, marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#714B67', marginBottom:12 }}>
              Customer Details
              {fromCRM && <span style={{ fontSize:11, color:'#856404', fontWeight:400, marginLeft:8 }}>← from CRM Lead</span>}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12, marginBottom:10 }}>
              {/* Customer search */}
              <div style={{ position:'relative' }}>
                <label style={lbl}>Customer Name *</label>
                <input style={inp} value={custSearch||customerName}
                  onChange={e=>{ setCustSearch(e.target.value); setCustName(e.target.value); setShowCustDrop(true) }}
                  onFocus={()=>setShowCustDrop(true)}
                  onBlur={()=>setTimeout(()=>setShowCustDrop(false),200)}
                  placeholder="Type to search customer..."
                  onMouseOver={e=>e.target.style.borderColor='#714B67'}
                  onMouseOut={e=>e.target.style.borderColor='#E0D5E0'}/>
                {showCustDrop && filteredCusts.length>0 && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100,
                    background:'#fff', border:'1px solid #E0D5E0', borderRadius:6,
                    boxShadow:'0 4px 16px rgba(0,0,0,.12)', maxHeight:200, overflowY:'auto' }}>
                    {filteredCusts.map(c=>(
                      <div key={c.id} onClick={()=>selectCustomer(c)}
                        style={{ padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid #F0EEEB' }}
                        onMouseOver={e=>e.currentTarget.style.background='#F8F4F8'}
                        onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                        <div style={{ fontWeight:600, fontSize:12 }}>{c.name}</div>
                        <div style={{ fontSize:10, color:'#6C757D' }}>{c.code} · {c.gstin||'No GSTIN'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>GSTIN</label>
                <input style={inp} value={customerGstin} onChange={e=>setCustGstin(e.target.value)}
                  placeholder="33AABCA1234A1Z5"
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              <div>
                <label style={lbl}>State (for GST)</label>
                <input style={inp} value={customerState} onChange={e=>setCustState(e.target.value)}
                  placeholder="Tamil Nadu"
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                <div style={{ fontSize:10, color:'#6C757D', marginTop:2 }}>
                  Tamil Nadu = CGST+SGST · Others = IGST
                </div>
              </div>
              <div>
                <label style={lbl}>Contact Person</label>
                <input style={inp} value={contactPerson} onChange={e=>setContact(e.target.value)}
                  placeholder="Mr. Kumar"
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input style={inp} value={contactEmail} onChange={e=>setEmail(e.target.value)}
                  placeholder="customer@email.com"
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div style={{ background:'#fff', border:'1px solid #E0D5E0', borderRadius:8, padding:16, marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#714B67' }}>Items / Services</div>
              <button onClick={addLine}
                style={{ padding:'5px 14px', background:'#714B67', color:'#fff', border:'none',
                  borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                + Add Line
              </button>
            </div>

            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ background:'#F8F4F8' }}>
                  <th style={{ padding:'7px 8px', textAlign:'left', fontWeight:700, width:'30%' }}>Item / Service</th>
                  <th style={{ padding:'7px 8px', textAlign:'left', fontWeight:700, width:'18%' }}>Description</th>
                  <th style={{ padding:'7px 8px', textAlign:'right', fontWeight:700, width:'8%' }}>Qty</th>
                  <th style={{ padding:'7px 8px', textAlign:'left', fontWeight:700, width:'7%' }}>Unit</th>
                  <th style={{ padding:'7px 8px', textAlign:'right', fontWeight:700, width:'12%' }}>Unit Price</th>
                  <th style={{ padding:'7px 8px', textAlign:'right', fontWeight:700, width:'7%' }}>GST%</th>
                  <th style={{ padding:'7px 8px', textAlign:'right', fontWeight:700, width:'12%' }}>Total</th>
                  <th style={{ width:30 }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l,i) => {
                  const c = calcLine(l)
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid #F0EEEB' }}>
                      {/* Item selector */}
                      <td style={{ padding:'5px 4px' }}>
                        <select style={{ ...inp, fontSize:11, cursor:'pointer' }}
                          value={l.itemCode||l.itemName}
                          onChange={e=>{
                            const proc = processes.find(p=>String(p.id)===e.target.value||p.code===e.target.value)
                            const item = items.find(it=>it.code===e.target.value)
                            if (proc) {
                              updateLine(i,'itemCode', proc.code||String(proc.id))
                              updateLine(i,'itemName', proc.name||proc.processName)
                              autoFillPrice(i, proc.code||String(proc.id), proc.name||proc.processName)
                            } else if (item) {
                              updateLine(i,'itemCode', item.code)
                              updateLine(i,'itemName', item.name)
                              autoFillPrice(i, item.code, item.name)
                            } else if (e.target.value==='MANUAL') {
                              updateLine(i,'itemCode','')
                              updateLine(i,'itemName','')
                            }
                          }}>
                          <option value="">-- Select --</option>
                          {processes.length>0&&<optgroup label="Coating Processes">
                            {processes.map(p=><option key={p.id} value={p.code||p.id}>{p.name||p.processName}</option>)}
                          </optgroup>}
                          {items.length>0&&<optgroup label="Items">
                            {items.map(it=><option key={it.code} value={it.code}>{it.code} — {it.name}</option>)}
                          </optgroup>}
                          <option value="MANUAL">Enter manually</option>
                        </select>
                        {/* Manual name entry */}
                        {(!l.itemCode||l.itemCode==='')&&l.itemName===''&&(
                          <input style={{ ...inp, marginTop:4, fontSize:11 }} placeholder="Item/service name"
                            value={l.itemName} onChange={e=>updateLine(i,'itemName',e.target.value)}/>
                        )}
                        {l.itemCode===''&&l.itemName!==''&&(
                          <input style={{ ...inp, marginTop:4, fontSize:11 }} placeholder="Item/service name"
                            value={l.itemName} onChange={e=>updateLine(i,'itemName',e.target.value)}/>
                        )}
                      </td>
                      <td style={{ padding:'5px 4px' }}>
                        <input style={{ ...inp, fontSize:11 }} value={l.description}
                          onChange={e=>updateLine(i,'description',e.target.value)}
                          placeholder="Additional details..."/>
                      </td>
                      <td style={{ padding:'5px 4px' }}>
                        <input type="number" style={{ ...inp, fontSize:11, textAlign:'right' }}
                          value={l.qty} onChange={e=>updateLine(i,'qty',parseFloat(e.target.value)||1)} min="0.01" step="0.01"/>
                      </td>
                      <td style={{ padding:'5px 4px' }}>
                        <select style={{ ...inp, fontSize:11, cursor:'pointer' }}
                          value={l.unit} onChange={e=>updateLine(i,'unit',e.target.value)}>
                          {['NOS','KGS','MTR','SQFT','SQM','LTR','SET','BOX','TON','BATCH'].map(u=><option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td style={{ padding:'5px 4px' }}>
                        <input type="number" style={{ ...inp, fontSize:11, textAlign:'right', fontFamily:'DM Mono,monospace' }}
                          value={l.unitPrice} onChange={e=>updateLine(i,'unitPrice',parseFloat(e.target.value)||0)} min="0" step="0.01"/>
                      </td>
                      <td style={{ padding:'5px 4px' }}>
                        <select style={{ ...inp, fontSize:11, cursor:'pointer' }}
                          value={l.gstRate} onChange={e=>updateLine(i,'gstRate',parseFloat(e.target.value))}>
                          {[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td style={{ padding:'5px 8px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:12 }}>
                        {INR(c.total)}
                      </td>
                      <td style={{ padding:'5px 4px', textAlign:'center' }}>
                        {lines.length>1&&(
                          <button onClick={()=>removeLine(i)}
                            style={{ background:'#F8D7DA', border:'none', borderRadius:4,
                              color:'#721C24', cursor:'pointer', padding:'3px 7px', fontSize:13, fontWeight:700 }}>
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end' }}>
              <div style={{ width:280 }}>
                {[
                  ['Taxable Amount', INR(totals.taxable), false],
                  ...(totals.cgst>0 ? [['CGST', INR(totals.cgst), false],['SGST', INR(totals.sgst), false]] : []),
                  ...(totals.igst>0 ? [['IGST', INR(totals.igst), false]] : []),
                  ['Grand Total', INR(totals.grand), true],
                ].map(([l,v,bold])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0',
                    borderBottom:'1px solid #F0EEEB', fontWeight:bold?800:400,
                    fontSize:bold?14:12, color:bold?'#714B67':'#333' }}>
                    <span>{l}</span>
                    <span style={{ fontFamily:'DM Mono,monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ background:'#fff', border:'1px solid #E0D5E0', borderRadius:8, padding:16 }}>
            <label style={lbl}>Terms & Notes</label>
            <textarea style={{ ...inp, height:80, resize:'vertical' }}
              value={notes} onChange={e=>setNotes(e.target.value)}
              placeholder="Payment terms, delivery conditions, special instructions..."/>
          </div>
        </div>

        {/* Right — Summary panel */}
        <div>
          {/* Quotation settings */}
          <div style={{ background:'#fff', border:'1px solid #E0D5E0', borderRadius:8, padding:16, marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#714B67', marginBottom:12 }}>Quotation Settings</div>
            <div style={{ marginBottom:10 }}>
              <label style={lbl}>Valid For (days)</label>
              <select style={{ ...inp, cursor:'pointer' }} value={validDays} onChange={e=>setValidDays(parseInt(e.target.value))}>
                {[7,15,30,45,60,90].map(d=><option key={d} value={d}>{d} days</option>)}
              </select>
              <div style={{ fontSize:10, color:'#6C757D', marginTop:3 }}>
                Valid till: {new Date(Date.now()+validDays*86400000).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={lbl}>Payment Terms</label>
              <select style={{ ...inp, cursor:'pointer' }} value={paymentTerms} onChange={e=>setPayTerms(e.target.value)}>
                {['NET7','NET15','NET30','NET45','NET60','100% Advance','50% Advance 50% on Delivery','LC at Sight'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Delivery Terms</label>
              <select style={{ ...inp, cursor:'pointer' }} value={deliveryTerms} onChange={e=>setDelivTerms(e.target.value)}>
                {['Ex-Works','FOB Chennai','CIF','Door Delivery','As per PO'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Totals summary card */}
          <div style={{ background:'#F8F4F8', border:'1.5px solid #714B67', borderRadius:8, padding:16, marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#714B67', marginBottom:10 }}>Summary</div>
            {[
              ['Taxable', INR(totals.taxable)],
              ['GST',     INR(totals.cgst+totals.sgst+totals.igst)],
            ].map(([l,v])=>(
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0',
                borderBottom:'1px solid #E0D5E0', fontSize:12, color:'#495057' }}>
                <span>{l}</span>
                <span style={{ fontFamily:'DM Mono,monospace' }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 4px',
              fontWeight:800, fontSize:18, color:'#714B67' }}>
              <span>Grand Total</span>
              <span style={{ fontFamily:'DM Mono,monospace' }}>{INR(totals.grand)}</span>
            </div>
            <div style={{ fontSize:11, color:'#6C757D', marginTop:4 }}>
              {lines.filter(l=>l.itemName).length} line(s) · {validDays} days validity
            </div>
          </div>

          {/* CRM info panel */}
          {fromCRM && (
            <div style={{ background:'#FFF3CD', border:'1px solid #FFEEBA', borderRadius:8, padding:14 }}>
              <div style={{ fontWeight:700, fontSize:12, color:'#856404', marginBottom:8 }}>CRM Lead Info</div>
              {[
                ['Lead Name', crmLeadName],
                ['Company',   crmCompany],
                ['Contact',   crmContact],
                ['Email',     crmEmail],
                ['Phone',     crmPhone],
              ].filter(([,v])=>v).map(([l,v])=>(
                <div key={l} style={{ fontSize:11, marginBottom:4 }}>
                  <span style={{ color:'#856404', fontWeight:600 }}>{l}:</span>
                  <span style={{ color:'#333', marginLeft:4 }}>{v}</span>
                </div>
              ))}
              <div style={{ fontSize:10, color:'#856404', marginTop:8, fontStyle:'italic' }}>
                This quotation will be linked to the CRM lead automatically
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={()=>save(false)} disabled={saving}
              style={{ padding:'10px', background:'#6C757D', color:'#fff', border:'none',
                borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              💾 Save as Draft
            </button>
            <button onClick={()=>save(true)} disabled={saving}
              style={{ padding:'10px', background:'#714B67', color:'#fff', border:'none',
                borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              📧 Save & Mark as Sent
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
