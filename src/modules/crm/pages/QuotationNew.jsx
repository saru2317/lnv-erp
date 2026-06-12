import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const fmtC = n => `₹${parseFloat(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`

// Calculate line totals
function calcLine(l, isIGST) {
  const qty     = parseFloat(l.qty||1)
  const rate    = parseFloat(l.rate||0)
  const disc    = parseFloat(l.discount||0)
  const gstPct  = parseFloat(l.gstRate||18)
  const taxable = qty * rate * (1 - disc/100)
  const gstAmt  = taxable * gstPct / 100
  return { ...l, qty, rate, taxable,
    cgst: isIGST?0:gstAmt/2, sgst:isIGST?0:gstAmt/2,
    igst: isIGST?gstAmt:0, total: taxable+gstAmt }
}

const newLine = () => ({ itemCode:'', description:'', qty:1, uom:'Nos', rate:'', discount:0, gstRate:18, taxable:0, cgst:0, sgst:0, igst:0, total:0 })

const inp = { padding:'6px 8px', fontSize:12, border:'1px solid #ddd', borderRadius:4, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#6C757D', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:.4 }

export default function QuotationNew() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()

  const [customers, setCustomers] = useState([])
  const [items,     setItems]     = useState([])
  const [allLeads,  setAllLeads]  = useState([])
  const [leads,     setLeads]     = useState([])
  const [users,     setUsers]     = useState([])
  const [saving,    setSaving]    = useState(false)

  const [custSearch, setCustSearch] = useState('')
  const [custOpen,   setCustOpen]   = useState(false)
  const custRef = useRef(null)

  const [form, setForm] = useState({
    customerId:'', customerName:'', customerGstin:'', customerState:'',
    billToAddress:'', shipToAddress:'', sameAddress:true,
    supplyType:'Intrastate', placeOfSupply:'Tamil Nadu - 33',
    crmLeadId:'', validTill:'', paymentTerms:'30 Days',
    deliveryTerms:'Ex-Works', incoterms:'Ex-Works',
    poReference:'', poDate:'',
    salesExec: JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name || '',
    preparedBy:'', approvedBy:'',
    notes:'', termsConditions:'Prices are subject to change without prior notice.\nGoods once sold will not be taken back.\nDelivery subject to availability of stock.',
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const isIGST = form.supplyType === 'Interstate'

  const [lines, setLines] = useState([newLine()])

  // Load masters
  useEffect(() => {
    fetch(`${BASE_URL}/sd/customers?limit=500`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setCustomers(d.data||[])).catch(()=>{})
    fetch(`${BASE_URL}/mdm/items?limit=500`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setItems((d.data||[]).filter(i=>['FG','SFG'].includes(i.itemType)))).catch(()=>{})
    fetch(`${BASE_URL}/crm/leads?limit=500`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>{ setAllLeads(d.data||[]); setLeads(d.data||[]) }).catch(()=>{})
    fetch(`${BASE_URL}/auth/users`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setUsers(d.data||[])).catch(()=>{})
  }, [])

  // Pre-fill from URL
  useEffect(() => {
    const cId = searchParams.get('customerId'), cName = searchParams.get('customerName')
    const lId = searchParams.get('leadId')
    if (cId)   set('customerId', cId)
    if (cName) { set('customerName', cName); setCustSearch(cName) }
    if (lId)   set('crmLeadId', lId)
  }, [searchParams])

  // Auto-load lead when URL leadId + data ready
  useEffect(() => {
    const lId = searchParams.get('leadId')
    if (lId && allLeads.length > 0 && items.length > 0) handleLeadSelect(lId)
  }, [allLeads, items])

  // Close dropdown
  useEffect(() => {
    const fn = e => { if (custRef.current && !custRef.current.contains(e.target)) setCustOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const selectCustomer = c => {
    set('customerId',    c.id)
    set('customerName',  c.name)
    set('customerGstin', c.gstin||'')
    set('customerState', c.state||'')
    const addr = [c.address, c.city, c.state, c.pincode].filter(Boolean).join(', ')
    set('billToAddress', addr)
    set('shipToAddress', addr)
    // Interstate if different state
    const myState = JSON.parse(localStorage.getItem('lnv_company')||'{}')?.state || 'Tamil Nadu'
    set('supplyType', c.state && c.state !== myState ? 'Interstate' : 'Intrastate')
    setCustSearch(c.name); setCustOpen(false)
    // Filter leads
    const custLeads = allLeads.filter(l =>
      String(l.customerId) === String(c.id) ||
      (l.companyName||l.company||'').toLowerCase() === c.name.toLowerCase()
    )
    setLeads(custLeads)
    if (custLeads.length === 1) handleLeadSelect(custLeads[0].id)
    else set('crmLeadId', '')
  }

  const handleLeadSelect = (leadId) => {
    set('crmLeadId', leadId)
    if (!leadId) return
    const lead = allLeads.find(l => String(l.id) === String(leadId))
    if (!lead) return
    const reqText = lead.requirements || lead.notes || ''
    if (reqText) {
      const matched = items.filter(item =>
        reqText.toLowerCase().includes(item.name.toLowerCase()) ||
        reqText.toLowerCase().includes((item.code||'').toLowerCase())
      )
      if (matched.length > 0) {
        setLines(matched.map(item => calcLine({
          ...newLine(), itemCode:item.code, description:item.name,
          uom:item.uom||'Nos', rate:item.salePrice||item.mrp||0,
          hsnCode:item.hsnCode||item.hsn||'', gstRate:item.gstRate||18,
        }, isIGST)))
        toast.success(`${matched.length} item(s) auto-loaded from lead`)
      } else {
        setLines([calcLine({ ...newLine(), description:reqText.slice(0,200), rate:lead.dealValue||0 }, isIGST)])
        toast('Requirements loaded — update rate/qty as needed', { icon:'📋' })
      }
    }
    if (!form.value && lead.dealValue) set('value', lead.dealValue)
  }

  // Line operations
  const updLine = (i, patch) => setLines(ls => ls.map((l,idx) => idx!==i ? l : calcLine({...l,...patch}, isIGST)))
  const addLine   = () => setLines(ls=>[...ls, newLine()])
  const removeLine= i  => setLines(ls=>ls.filter((_,idx)=>idx!==i))

  const selectItem = (i, item) => updLine(i, {
    itemCode:    item.code,
    description: item.name,
    uom:         item.uom||'Nos',
    rate:        parseFloat(item.salePrice||item.mrp||0),
    hsnCode:     item.hsnCode||item.hsn||'',
    gstRate:     item.gstRate||18,
  })

  const [charges, setCharges] = useState({
    freightAmt:0, freightGst:false,
    packingAmt:0, packingGst:false,
    loadingAmt:0,
    insuranceAmt:0,
    otherChargesAmt:0, otherChargesDesc:'',
  })
  const setC = (k,v) => setCharges(c=>({...c,[k]:v}))

  // Totals
  const totals = lines.reduce((a,l)=>({
    taxable: a.taxable + (l.taxable||0),
    cgst:    a.cgst    + (l.cgst||0),
    sgst:    a.sgst    + (l.sgst||0),
    igst:    a.igst    + (l.igst||0),
    total:   a.total   + (l.total||0),
  }), { taxable:0, cgst:0, sgst:0, igst:0, total:0 })
  const totalCharges = parseFloat(charges.freightAmt||0) + parseFloat(charges.packingAmt||0) +
                       parseFloat(charges.loadingAmt||0) + parseFloat(charges.insuranceAmt||0) +
                       parseFloat(charges.otherChargesAmt||0)
  // GST on freight/packing if applicable
  const chargesGst   = (charges.freightGst ? parseFloat(charges.freightAmt||0)*0.18 : 0) +
                       (charges.packingGst  ? parseFloat(charges.packingAmt||0)*0.18  : 0)
  const subTotalWithCharges = totals.total + totalCharges + chargesGst
  const roundOff   = Math.round(subTotalWithCharges) - subTotalWithCharges
  const grandTotal = subTotalWithCharges + roundOff

  const handleSave = async () => {
    if (!form.customerName) { toast.error('Select customer'); return }
    if (lines.every(l=>!l.description)) { toast.error('Add at least one item'); return }
    setSaving(true)
    try {
      const payload = {
        customerName:  form.customerName,
        customerId:    form.customerId ? parseInt(form.customerId) : null,
        customerGstin: form.customerGstin||null,
        customerState: form.customerState||null,
        crmLeadId:     form.crmLeadId ? parseInt(form.crmLeadId) : null,
        validTill:     form.validTill ? new Date(form.validTill) : null,
        paymentTerms:  form.paymentTerms,
        deliveryTerms: form.deliveryTerms,
        supplyType:    form.supplyType,
        notes:         [form.notes, form.termsConditions].filter(Boolean).join('\n---\n'),
        taxableAmt:    totals.taxable,
        cgst:          totals.cgst + (isIGST ? 0 : chargesGst/2),
        sgst:          totals.sgst + (isIGST ? 0 : chargesGst/2),
        igst:          totals.igst + (isIGST ? chargesGst : 0),
        freightAmt:    parseFloat(charges.freightAmt)||0,
        packingAmt:    parseFloat(charges.packingAmt)||0,
        loadingAmt:    parseFloat(charges.loadingAmt)||0,
        insuranceAmt:  parseFloat(charges.insuranceAmt)||0,
        otherChargesAmt:  parseFloat(charges.otherChargesAmt)||0,
        otherChargesDesc: charges.otherChargesDesc||null,
        roundOff:      roundOff,
        grandTotal:    grandTotal,
        lines: lines.filter(l=>l.description).map(l=>({
          itemCode:    l.itemCode||null,
          itemName:    l.description,
          description: l.description,
          qty:         parseFloat(l.qty||1),
          unit:        l.uom||'Nos',
          unitPrice:   parseFloat(l.rate||0),
          gstRate:     parseFloat(l.gstRate||18),
          discount:    parseFloat(l.discount||0),
          taxable:     parseFloat(l.taxable||0),
          cgst:        parseFloat(l.cgst||0),
          sgst:        parseFloat(l.sgst||0),
          igst:        parseFloat(l.igst||0),
          total:       parseFloat(l.total||0),
        })),
      }
      const r = await fetch(`${BASE_URL}/crm/quotations`, { method:'POST', headers:hdr(), body:JSON.stringify(payload) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(`${d.data?.quotNo} created!`)
      nav('/crm/quotations')
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const filteredCusts = custSearch
    ? customers.filter(c=>c.name?.toLowerCase().includes(custSearch.toLowerCase())).slice(0,10)
    : customers.slice(0,10)

  const selectedLead = allLeads.find(l=>String(l.id)===String(form.crmLeadId))

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Quotation <small>CRM Quotation</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/quotations')}>Cancel</button>
          <button className="btn btn-p btn-s" onClick={handleSave} disabled={saving}>
            {saving?'Saving…':'💾 Save Quotation'}
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'3fr 1fr',gap:14}}>
        <div>
          {/* ── SECTION 1: Customer ── */}
          <div className="fi-panel" style={{marginBottom:12}}>
            <div className="fi-panel-hdr" style={{background:'linear-gradient(135deg,#714B67,#8B5E7E)',color:'#fff'}}>
              <h3>Customer Details</h3>
            </div>
            <div className="fi-panel-body">
              <div className="sd-form-grid">

                {/* Customer searchable dropdown */}
                <div className="sd-field" ref={custRef} style={{position:'relative',gridColumn:'1/-1'}}>
                  <label style={lbl}>Customer <span style={{color:'red'}}>*</span></label>
                  <input value={custSearch}
                    onChange={e=>{setCustSearch(e.target.value);set('customerName',e.target.value);set('customerId','');setCustOpen(true);setLeads(allLeads);set('crmLeadId','')}}
                    onFocus={()=>setCustOpen(true)} placeholder="Search customer master…" autoComplete="off"
                    style={{...inp,borderColor:form.customerId?'#714B67':'#ddd'}} />
                  {form.customerId &&
                    <div style={{fontSize:10,color:'#2E7D32',marginTop:2}}>✅ Linked to Customer Master (ID: {form.customerId})</div>}
                  {custOpen && filteredCusts.length > 0 && (
                    <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:9999,
                      background:'#fff',border:'1.5px solid #714B67',borderRadius:6,
                      boxShadow:'0 6px 20px rgba(0,0,0,.15)',maxHeight:220,overflowY:'auto'}}>
                      {filteredCusts.map(c=>(
                        <div key={c.id} onClick={()=>selectCustomer(c)}
                          style={{padding:'8px 12px',cursor:'pointer',fontSize:12,borderBottom:'1px solid #F0EEEB',
                            display:'flex',justifyContent:'space-between',alignItems:'center'}}
                          onMouseEnter={e=>e.currentTarget.style.background='#EDE0EA'}
                          onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                          <div>
                            <div style={{fontWeight:700}}>{c.name}</div>
                            <div style={{fontSize:10,color:'#6C757D'}}>{c.city||''}{c.state?`, ${c.state}`:''} · {c.gstin||'No GSTIN'}</div>
                          </div>
                          <code style={{fontSize:10,color:'#714B67',background:'#EDE0EA',padding:'1px 6px',borderRadius:4}}>{c.code}</code>
                        </div>
                      ))}
                      {custSearch && !filteredCusts.find(c=>c.name===custSearch) && (
                        <div onClick={()=>{set('customerName',custSearch);setCustOpen(false)}}
                          style={{padding:'8px 12px',cursor:'pointer',fontSize:12,color:'#714B67',fontWeight:600,background:'#F8F4F8'}}>
                          + Use "{custSearch}" as prospect
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="sd-field">
                  <label style={lbl}>GSTIN</label>
                  <input value={form.customerGstin} onChange={e=>set('customerGstin',e.target.value)}
                    placeholder="22AAAAA0000A1Z5" style={inp} />
                </div>
                <div className="sd-field">
                  <label style={lbl}>Supply Type</label>
                  <select value={form.supplyType} onChange={e=>set('supplyType',e.target.value)} style={inp}>
                    <option>Intrastate</option>
                    <option>Interstate</option>
                    <option>Export</option>
                  </select>
                </div>
                <div className="sd-field" style={{gridColumn:'1/-1'}}>
                  <label style={lbl}>Bill To Address</label>
                  <textarea rows={2} value={form.billToAddress} onChange={e=>{set('billToAddress',e.target.value);if(form.sameAddress)set('shipToAddress',e.target.value)}}
                    placeholder="Customer billing address" style={{...inp,resize:'vertical'}} />
                </div>
                <div className="sd-field" style={{gridColumn:'1/-1'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                    <label style={{...lbl,marginBottom:0}}>Ship To Address</label>
                    <label style={{fontSize:10,color:'#714B67',cursor:'pointer',display:'flex',gap:4,alignItems:'center'}}>
                      <input type="checkbox" checked={form.sameAddress} onChange={e=>{set('sameAddress',e.target.checked);if(e.target.checked)set('shipToAddress',form.billToAddress)}} />
                      Same as Bill To
                    </label>
                  </div>
                  <textarea rows={2} value={form.shipToAddress} onChange={e=>set('shipToAddress',e.target.value)}
                    disabled={form.sameAddress} placeholder="Shipping address"
                    style={{...inp,resize:'vertical',background:form.sameAddress?'#F8F9FA':'#fff'}} />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: Order References ── */}
          <div className="fi-panel" style={{marginBottom:12}}>
            <div className="fi-panel-hdr" style={{background:'linear-gradient(135deg,#714B67,#8B5E7E)',color:'#fff'}}>
              <h3>Order References</h3>
            </div>
            <div className="fi-panel-body">
              <div className="sd-form-grid">
                <div className="sd-field">
                  <label style={lbl}>Link to Lead / Opportunity
                    {form.customerId && <span style={{fontSize:10,color:'#6C757D',fontWeight:400,marginLeft:4}}>
                      ({leads.length} lead{leads.length!==1?'s':''})
                    </span>}
                  </label>
                  <select value={form.crmLeadId} onChange={e=>handleLeadSelect(e.target.value)} style={inp}>
                    <option value="">— {form.customerId?(leads.length===0?'No leads':'Select lead'):'Select customer first'} —</option>
                    {leads.map(l=>(
                      <option key={l.id} value={l.id}>
                        {l.leadNo} — {l.stage} · ₹{parseFloat(l.dealValue||0).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                  {selectedLead?.requirements && (
                    <div style={{fontSize:10,color:'#714B67',marginTop:3,padding:'4px 8px',background:'#EDE0EA',borderRadius:4}}>
                      📋 {selectedLead.requirements.slice(0,100)}{selectedLead.requirements.length>100?'…':''}
                    </div>
                  )}
                </div>
                <div className="sd-field">
                  <label style={lbl}>Customer PO Reference</label>
                  <input value={form.poReference} onChange={e=>set('poReference',e.target.value)}
                    placeholder="Customer PO number" style={inp} />
                </div>
                <div className="sd-field">
                  <label style={lbl}>Customer PO Date</label>
                  <input type="date" value={form.poDate} onChange={e=>set('poDate',e.target.value)} style={inp} />
                </div>
                <div className="sd-field">
                  <label style={lbl}>Valid Till</label>
                  <input type="date" value={form.validTill} onChange={e=>set('validTill',e.target.value)} style={inp} />
                </div>
                <div className="sd-field">
                  <label style={lbl}>Payment Terms</label>
                  <select value={form.paymentTerms} onChange={e=>set('paymentTerms',e.target.value)} style={inp}>
                    {['Advance','15 Days','30 Days','45 Days','60 Days','LC','Against Delivery'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="sd-field">
                  <label style={lbl}>Delivery Terms</label>
                  <select value={form.deliveryTerms} onChange={e=>set('deliveryTerms',e.target.value)} style={inp}>
                    {['Ex-Works','FOR Destination','CIF','FOB','Door Delivery'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="sd-field">
                  <label style={lbl}>Prepared By</label>
                  <select value={form.salesExec} onChange={e=>set('salesExec',e.target.value)} style={inp}>
                    <option value="">— Select —</option>
                    {users.filter(u=>['SALES','MANAGER','ADMIN','SUPER_ADMIN'].includes(u.role)).map(u=>(
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sd-field">
                  <label style={lbl}>Place of Supply</label>
                  <input value={form.placeOfSupply} onChange={e=>set('placeOfSupply',e.target.value)}
                    placeholder="e.g. Tamil Nadu - 33" style={inp} />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: Line Items ── */}
          <div className="fi-panel" style={{marginBottom:12}}>
            <div className="fi-panel-hdr" style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'linear-gradient(135deg,#714B67,#8B5E7E)',color:'#fff',padding:'10px 16px',borderRadius:'8px 8px 0 0'}}>
              <h3 style={{margin:0,fontSize:14,fontWeight:700}}>Line Items</h3>
              <button onClick={addLine} style={{padding:'4px 12px',background:'rgba(255,255,255,.2)',color:'#fff',
                border:'1px solid rgba(255,255,255,.4)',borderRadius:5,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                + Add Line
              </button>
            </div>
            <div style={{overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}>
                <thead>
                  <tr style={{background:'#F0EEEB'}}>
                    {['#','Item','Description','HSN','Qty','UOM','Rate','Disc%','GST%','Taxable','GST Amt','Total',''].map(h=>(
                      <th key={h} style={{padding:'7px 8px',textAlign:'left',fontSize:10,fontWeight:700,color:'#6C757D',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                      <td style={{padding:'4px 8px',fontSize:11,color:'#6C757D',width:24}}>{i+1}</td>
                      <td style={{padding:'4px 6px',minWidth:130}}>
                        <select value={l.itemCode||''} onChange={e=>{
                          const item = items.find(it=>it.code===e.target.value)
                          if (item) selectItem(i,item)
                          else updLine(i,{itemCode:e.target.value})
                        }} style={{...inp,fontSize:11}}>
                          <option value="">Select…</option>
                          {items.map(it=><option key={it.id} value={it.code}>{it.code} — {it.name}</option>)}
                        </select>
                      </td>
                      <td style={{padding:'4px 6px',minWidth:160}}>
                        <input value={l.description||''} onChange={e=>updLine(i,{description:e.target.value})}
                          placeholder="Description" style={{...inp,fontSize:11}} />
                      </td>
                      <td style={{padding:'4px 6px',width:70}}>
                        <input value={l.hsnCode||''} onChange={e=>updLine(i,{hsnCode:e.target.value})}
                          placeholder="HSN" style={{...inp,fontSize:11}} />
                      </td>
                      <td style={{padding:'4px 6px',width:60}}>
                        <input type="number" value={l.qty} onChange={e=>updLine(i,{qty:e.target.value})}
                          style={{...inp,fontSize:11,textAlign:'right'}} />
                      </td>
                      <td style={{padding:'4px 6px',width:55}}>
                        <input value={l.uom} onChange={e=>updLine(i,{uom:e.target.value})}
                          style={{...inp,fontSize:11}} />
                      </td>
                      <td style={{padding:'4px 6px',width:80}}>
                        <input type="number" value={l.rate} onChange={e=>updLine(i,{rate:e.target.value})}
                          placeholder="0" style={{...inp,fontSize:11,textAlign:'right'}} />
                      </td>
                      <td style={{padding:'4px 6px',width:55}}>
                        <input type="number" value={l.discount||0} onChange={e=>updLine(i,{discount:e.target.value})}
                          style={{...inp,fontSize:11,textAlign:'right'}} />
                      </td>
                      <td style={{padding:'4px 6px',width:65}}>
                        <select value={l.gstRate||18} onChange={e=>updLine(i,{gstRate:parseFloat(e.target.value)})}
                          style={{...inp,fontSize:11}}>
                          {[0,5,12,18,28].map(g=><option key={g} value={g}>{g}%</option>)}
                        </select>
                      </td>
                      <td style={{padding:'4px 8px',fontSize:11,fontWeight:600,textAlign:'right',color:'#1C1C1C',whiteSpace:'nowrap'}}>
                        {fmtC(l.taxable)}
                      </td>
                      <td style={{padding:'4px 8px',fontSize:11,textAlign:'right',color:'#1565C0',whiteSpace:'nowrap'}}>
                        {fmtC(isIGST ? l.igst : (l.cgst+l.sgst))}
                      </td>
                      <td style={{padding:'4px 8px',fontSize:11,fontWeight:700,textAlign:'right',color:'#2E7D32',whiteSpace:'nowrap'}}>
                        {fmtC(l.total)}
                      </td>
                      <td style={{padding:'4px 6px',width:24}}>
                        {lines.length>1&&<button onClick={()=>removeLine(i)}
                          style={{color:'#C62828',background:'none',border:'none',cursor:'pointer',fontSize:14,padding:0}}>✕</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr style={{background:'#F0EEEB',fontWeight:700}}>
                    <td colSpan={9} style={{padding:'8px 10px',fontSize:12,textAlign:'right',color:'#6C757D'}}>Subtotal</td>
                    <td style={{padding:'8px 10px',fontSize:12,textAlign:'right'}}>{fmtC(totals.taxable)}</td>
                    <td style={{padding:'8px 10px',fontSize:12,textAlign:'right',color:'#1565C0'}}>{fmtC(isIGST?totals.igst:(totals.cgst+totals.sgst))}</td>
                    <td style={{padding:'8px 10px',fontSize:13,textAlign:'right',color:'#2E7D32'}}>{fmtC(totals.total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── SECTION 4: Additional Charges ── */}
          <div className="fi-panel" style={{marginBottom:12}}>
            <div className="fi-panel-hdr" style={{background:'linear-gradient(135deg,#714B67,#8B5E7E)',color:'#fff'}}>
              <h3>Additional Charges</h3>
            </div>
            <div className="fi-panel-body">
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>

                {/* Freight */}
                <div style={{padding:'10px 12px',background:'#F8F9FA',borderRadius:6,border:'1px solid #E0D5E0'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <label style={{...lbl,marginBottom:0}}>🚚 Freight / Transport</label>
                    <label style={{fontSize:10,color:'#714B67',cursor:'pointer',display:'flex',gap:4,alignItems:'center'}}>
                      <input type="checkbox" checked={charges.freightGst}
                        onChange={e=>setC('freightGst',e.target.checked)} />
                      +18% GST
                    </label>
                  </div>
                  <input type="number" value={charges.freightAmt||''} onChange={e=>setC('freightAmt',e.target.value)}
                    placeholder="0" style={{...inp}} />
                  {charges.freightGst && charges.freightAmt>0 &&
                    <div style={{fontSize:10,color:'#6C757D',marginTop:3}}>
                      GST: {fmtC(parseFloat(charges.freightAmt||0)*0.18)} · Total: {fmtC(parseFloat(charges.freightAmt||0)*1.18)}
                    </div>}
                </div>

                {/* Packing */}
                <div style={{padding:'10px 12px',background:'#F8F9FA',borderRadius:6,border:'1px solid #E0D5E0'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <label style={{...lbl,marginBottom:0}}>📦 Packing & Forwarding</label>
                    <label style={{fontSize:10,color:'#714B67',cursor:'pointer',display:'flex',gap:4,alignItems:'center'}}>
                      <input type="checkbox" checked={charges.packingGst}
                        onChange={e=>setC('packingGst',e.target.checked)} />
                      +18% GST
                    </label>
                  </div>
                  <input type="number" value={charges.packingAmt||''} onChange={e=>setC('packingAmt',e.target.value)}
                    placeholder="0" style={{...inp}} />
                  {charges.packingGst && charges.packingAmt>0 &&
                    <div style={{fontSize:10,color:'#6C757D',marginTop:3}}>
                      GST: {fmtC(parseFloat(charges.packingAmt||0)*0.18)} · Total: {fmtC(parseFloat(charges.packingAmt||0)*1.18)}
                    </div>}
                </div>

                {/* Loading */}
                <div style={{padding:'10px 12px',background:'#F8F9FA',borderRadius:6,border:'1px solid #E0D5E0'}}>
                  <label style={{...lbl}}>🏗️ Loading / Unloading</label>
                  <input type="number" value={charges.loadingAmt||''} onChange={e=>setC('loadingAmt',e.target.value)}
                    placeholder="0" style={{...inp}} />
                </div>

                {/* Insurance */}
                <div style={{padding:'10px 12px',background:'#F8F9FA',borderRadius:6,border:'1px solid #E0D5E0'}}>
                  <label style={{...lbl}}>🛡️ Insurance</label>
                  <input type="number" value={charges.insuranceAmt||''} onChange={e=>setC('insuranceAmt',e.target.value)}
                    placeholder="0" style={{...inp}} />
                </div>

                {/* Other Charges — full width */}
                <div style={{gridColumn:'1/-1',padding:'10px 12px',background:'#F8F9FA',borderRadius:6,border:'1px solid #E0D5E0'}}>
                  <label style={{...lbl}}>➕ Other Charges</label>
                  <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:8}}>
                    <input value={charges.otherChargesDesc||''} onChange={e=>setC('otherChargesDesc',e.target.value)}
                      placeholder="Description (e.g. Installation, Commissioning)" style={{...inp}} />
                    <input type="number" value={charges.otherChargesAmt||''} onChange={e=>setC('otherChargesAmt',e.target.value)}
                      placeholder="Amount" style={{...inp}} />
                  </div>
                </div>
              </div>

              {/* Charges summary */}
              {totalCharges > 0 && (
                <div style={{marginTop:10,padding:'8px 12px',background:'#EDE0EA',borderRadius:6,
                  display:'flex',justifyContent:'space-between',fontSize:12,fontWeight:700}}>
                  <span style={{color:'#714B67'}}>Total Additional Charges</span>
                  <span style={{color:'#714B67',fontFamily:'DM Mono,monospace'}}>{fmtC(totalCharges + chargesGst)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 5: Notes & Terms ── */}
          <div className="fi-panel" style={{marginBottom:12}}>
            <div className="fi-panel-hdr" style={{background:'linear-gradient(135deg,#714B67,#8B5E7E)',color:'#fff'}}>
              <h3>Notes & Terms</h3>
            </div>
            <div className="fi-panel-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={lbl}>Notes to Customer</label>
                  <textarea rows={3} value={form.notes} onChange={e=>set('notes',e.target.value)}
                    placeholder="Special instructions, delivery notes…"
                    style={{...inp,resize:'vertical'}} />
                </div>
                <div>
                  <label style={lbl}>Terms & Conditions</label>
                  <textarea rows={3} value={form.termsConditions} onChange={e=>set('termsConditions',e.target.value)}
                    style={{...inp,resize:'vertical'}} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Summary ── */}
        <div>
          <div className="fi-panel" style={{marginBottom:12,position:'sticky',top:80}}>
            <div className="fi-panel-hdr" style={{background:'linear-gradient(135deg,#714B67,#8B5E7E)',color:'#fff'}}>
              <h3>Amount Summary</h3>
            </div>
            <div className="fi-panel-body">
              {[
                ['Taxable Amount',  fmtC(totals.taxable), '#1C1C1C'],
                ...(isIGST ? [
                  ['IGST',           fmtC(totals.igst),    '#117A65'],
                ] : [
                  ['CGST',           fmtC(totals.cgst),    '#1565C0'],
                  ['SGST',           fmtC(totals.sgst),    '#1565C0'],
                ]),
                ...(charges.freightAmt>0  ? [['🚚 Freight',         fmtC(charges.freightAmt),         '#6C757D']] : []),
                ...(charges.freightGst && charges.freightAmt>0 ? [['   GST on Freight', fmtC(parseFloat(charges.freightAmt)*0.18), '#1565C0']] : []),
                ...(charges.packingAmt>0  ? [['📦 Packing & Fwd',   fmtC(charges.packingAmt),         '#6C757D']] : []),
                ...(charges.packingGst && charges.packingAmt>0 ? [['   GST on Packing', fmtC(parseFloat(charges.packingAmt)*0.18),  '#1565C0']] : []),
                ...(charges.loadingAmt>0  ? [['🏗️ Loading',          fmtC(charges.loadingAmt),         '#6C757D']] : []),
                ...(charges.insuranceAmt>0? [['🛡️ Insurance',         fmtC(charges.insuranceAmt),       '#6C757D']] : []),
                ...(charges.otherChargesAmt>0 ? [[`➕ ${charges.otherChargesDesc||'Other Charges'}`, fmtC(charges.otherChargesAmt), '#6C757D']] : []),
                ['Round Off',      `${roundOff>=0?'+':''}${fmtC(roundOff)}`, '#6C757D'],
              ].map(([l,v,c])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',
                  padding:'7px 0',borderBottom:'1px solid #F0EEEB',fontSize:12}}>
                  <span style={{color:'#6C757D'}}>{l}</span>
                  <span style={{fontWeight:600,color:c,fontFamily:'DM Mono,monospace'}}>{v}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',
                fontSize:16,fontWeight:800,borderTop:'2px solid #714B67',marginTop:4}}>
                <span>Grand Total</span>
                <span style={{color:'#2E7D32',fontFamily:'DM Mono,monospace'}}>{fmtC(grandTotal)}</span>
              </div>

              <div style={{marginTop:12,padding:10,background:'#F0EEEB',borderRadius:6,fontSize:11}}>
                <div style={{fontWeight:700,color:'#714B67',marginBottom:6}}>GST Type</div>
                <div style={{display:'flex',gap:8}}>
                  {['Intrastate','Interstate'].map(t=>(
                    <div key={t} onClick={()=>set('supplyType',t)}
                      style={{flex:1,padding:'6px',textAlign:'center',borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700,
                        background:form.supplyType===t?'#714B67':'#fff',
                        color:form.supplyType===t?'#fff':'#6C757D',
                        border:`1px solid ${form.supplyType===t?'#714B67':'#ddd'}`}}>
                      {t==='Intrastate'?'CGST+SGST':'IGST'}
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-p btn-s" style={{width:'100%',marginTop:14}} onClick={handleSave} disabled={saving}>
                {saving?'Saving…':'💾 Save Quotation'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
