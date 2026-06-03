import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${tok()}` })
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
  borderRadius:5, fontSize:12, outline:'none',
  width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057',
  display:'block', marginBottom:3, textTransform:'uppercase' }

const newLine = () => ({
  itemCode:'', itemName:'', hsnCode:'',
  qty:1, unit:'Nos', rate:0,
  discPct:0, gstPct:18,
  taxable:0, cgst:0, sgst:0, igst:0, total:0,
  confirmDate:'',   // Order schedule line
  plant:'MAIN',
})

const calcLine = (l, isIGST=false) => {
  const taxable = parseFloat(l.qty||0) * parseFloat(l.rate||0) * (1 - parseFloat(l.discPct||0)/100)
  const gstAmt  = taxable * parseFloat(l.gstPct||18) / 100
  return {
    ...l, taxable,
    cgst: isIGST ? 0 : gstAmt/2,
    sgst: isIGST ? 0 : gstAmt/2,
    igst: isIGST ? gstAmt : 0,
    total: taxable + gstAmt
  }
}

export default function SONew() {
  const nav  = useNavigate()
  const [params] = useSearchParams()
  const quotId   = params.get('quotId')

  const today = new Date().toISOString().split('T')[0]
  const [soNo,      setSoNo]      = useState('Auto-generated')
  const [customers, setCustomers] = useState([])
  const [items,     setItems]     = useState([])
  const [selCust,   setSelCust]   = useState(null)
  const [saving,    setSaving]    = useState(false)
  const saveInProgress = useRef(false)
  const [lines,     setLines]     = useState([newLine()])

  const [form, setForm] = useState({
    customerId:'', customerCode:'', customerName:'',
    customerGstin:'', shipToAddress:'',
    orderDate: today, deliveryDate:'',
    paymentTerms:'Net 30', supplyType:'Intrastate',
    salesExec: JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name || 'Admin',
    currency:'INR', remarks:'', quotRef:'',
    poReference:'', poDate:'',
    billToAddress:'', shipToAddress:'',
    incoterms:'Ex-Works', freightTerms:'',
    deliveryPriority:'Normal', reasonForOrder:'',
    salesOrg:'LNV', distributionChannel:'10',
    termsAndConditions:'', specialInstructions:'',
  })

  const isIGST = form.supplyType === 'Interstate'

  useEffect(() => {
    // Load customers and items
    Promise.all([
      sdApi.getCustomers(),
      fetch(`${BASE}/items`, { headers: hdr2() }).then(r=>r.json()),
      fetch(`${BASE}/sd/orders/next-no`, { headers: hdr2() }).then(r=>r.json()).catch(()=>({soNo:'SO-AUTO'}))
    ]).then(([custRes, itemRes, noRes]) => {
      setCustomers(custRes.data || custRes || [])
      // Only billing items in SO dropdown
      setItems((itemRes.data || []).filter(i => i.billingItem !== false))
      setSoNo(noRes.soNo || 'SO-AUTO')
    }).catch(() => {})

    // If converting from quotation
    if (quotId) {
      sdApi.getQuotationById(quotId).then(res => {
        const q = res.data || res
        if (!q) return
        const supplyType = q.supplyType || 'Intrastate'
        const useIGST    = supplyType === 'Interstate'
        setForm(f => ({
          ...f,
          customerId:    q.customerId || '',
          customerName:  q.customerName || '',
          customerCode:  q.customerCode || '',
          customerGstin: q.customerGstin || '',
          quotRef:       q.quotNo || '',
          paymentTerms:  q.paymentTerms || 'Net 30',
        }))
        if (q.lines?.length) {
          setLines(q.lines.map(l => calcLine({
            itemCode:  l.itemCode || '',
            itemName:  l.itemName || l.description || '',
            hsnCode:   l.hsnCode  || '',
            qty:       parseFloat(l.qty || 1),
            unit:      l.unit     || 'Nos',
            rate:      parseFloat(l.rate || l.unitPrice || 0),
            discPct:   parseFloat(l.discPct || l.discount || 0),
            gstPct:    parseFloat(l.gstPct  || l.gstRate || 18),
          }, useIGST)))
        }
        toast.success('Quotation data loaded!')
      }).catch(() => {})
    }
  }, [quotId])

  const onCustomerChange = (id) => {
    const c = customers.find(c => (c.id||c.customerId) === parseInt(id) || String(c.id) === id)
    setSelCust(c)

    // Build Bill To from customer master address fields
    const billParts = [c?.address, c?.city, c?.state, c?.pincode].filter(Boolean)
    const billToStr = billParts.join(', ')

    // Ship To — pick the default one from shipToAddresses
    const shipTos   = Array.isArray(c?.shipToAddresses) ? c.shipToAddresses
                    : (c?.shipToAddresses ? JSON.parse(c.shipToAddresses) : [])
    const defShip   = shipTos.find(s => s.isDefault) || shipTos[0]
    const shipToStr = defShip
      ? [defShip.label, defShip.address, defShip.city, defShip.state, defShip.pincode].filter(Boolean).join(', ')
      : billToStr  // fallback to billing address

    setForm(f => ({
      ...f,
      customerId:    c?.id || c?.customerId || id,
      customerCode:  c?.customerCode || c?.code || '',
      customerName:  c?.customerName || c?.name || '',
      customerGstin: c?.gstin || c?.customerGstin || '',
      billToAddress: billToStr,
      shipToAddress: shipToStr,
      paymentTerms:  c?.paymentTerms || f.paymentTerms,
      incoterms:     c?.incoterms    || f.incoterms,
      currency:      c?.currency     || f.currency || 'INR',
      supplyType:    c?.gstin?.slice(0,2) === '33' ? 'Intrastate' : 'Interstate',
    }))
  }

  const onItemChange = async (i, itemCode) => {
    const item = items.find(it => it.itemCode === itemCode || it.code === itemCode)
    // Default rate from item master
    const defaultRate = parseFloat(item?.salePrice || item?.mrp || item?.stdCost || 0)

    // Look up rate from customer's price list
    let finalRate = defaultRate
    let priceSource = 'Item Master'
    if (itemCode && form.customerId) {
      try {
        const res  = await fetch(
          `${BASE}/price-book/lookup?itemCode=${itemCode}&customerId=${form.customerId}`,
          { headers: hdr2() }
        )
        const data = await res.json()
        if (data.rate > 0) {
          finalRate   = data.rate
          priceSource = data.priceListUsed || data.source
        }
      } catch { /* use default */ }
    }

    updLine(i, {
      itemCode:    itemCode,
      itemName:    item?.itemName || item?.name || '',
      hsnCode:     item?.hsnCode  || '',
      unit:        item?.uom      || 'Nos',
      rate:         finalRate,
      gstPct:       parseFloat(item?.gstPct || 18),
      _priceSource: priceSource,
      _belowMin:    false,  // set after minPrice lookup
    })
  }

  const updLine = (i, changes) => {
    setLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l
      const merged = { ...l, ...changes }
      return calcLine(merged, isIGST)
    }))
  }

  const totals = lines.reduce((acc, l) => ({
    taxable: acc.taxable + (l.taxable||0),
    cgst:    acc.cgst    + (l.cgst||0),
    sgst:    acc.sgst    + (l.sgst||0),
    igst:    acc.igst    + (l.igst||0),
    total:   acc.total   + (l.total||0),
  }), { taxable:0, cgst:0, sgst:0, igst:0, total:0 })

  const fmtC = n => '₹' + Math.round(n||0).toLocaleString('en-IN')

  const save = async (confirm=false) => {
    if (saveInProgress.current) { toast('Already saving...'); return }
    saveInProgress.current = true
    if (!form.customerName) return toast.error('Select a customer!')
    if (!lines.some(l => l.itemName && l.qty > 0))
      return toast.error('Add at least one item!')
    setSaving(true)
    try {
      const payload = {
        ...form,
        soNo,
        orderDate:      form.orderDate,
        deliveryDate:   form.deliveryDate || null,
        subTotal:       totals.taxable,
        totalGST:       totals.cgst + totals.sgst + totals.igst,
        totalAmount:    totals.total,
        status:         confirm ? 'CONFIRMED' : 'DRAFT',
        lines: lines.filter(l => l.itemName).map(l => ({
          itemCode:    l.itemCode    || null,
          itemName:    l.itemName,
          hsnCode:     l.hsnCode     || null,
          qty:         parseFloat(l.qty),
          unit:        l.unit,
          rate:        parseFloat(l.rate),
          discPct:     parseFloat(l.discPct||0),
          taxableAmt:  l.taxable,
          gstPct:      parseFloat(l.gstPct),
          cgst:        l.cgst,
          sgst:        l.sgst,
          igst:        l.igst,
          totalAmt:    l.total,
          confirmDate: l.confirmDate || null,
          plant:       l.plant       || 'MAIN',
        }))
      }
      const res  = await sdApi.createOrder(payload)
      if (res.error) throw new Error(res.error)
      const newSoId = res.data?.id

      // Level 2: Check if any line prices are below minimum
      if (newSoId) {
        const checkRes = await fetch(`${BASE}/sd/orders/${newSoId}/check-price`,
          { method:'POST', headers: hdr() }).then(r=>r.json()).catch(()=>null)
        if (checkRes?.needsApproval) {
          toast(`⚠️ ${res.data?.soNo} saved — sent for PRICE APPROVAL. ${checkRes.violations?.length} item(s) below minimum price.`,
            { duration:6000, icon:'🔔' })
        } else {
          toast.success(`${res.data?.soNo || soNo} created!`)
        }
      } else {
        toast.success(`${res.data?.soNo || soNo} created!`)
      }
      nav('/sd/orders')
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false); saveInProgress.current = false }
  }

  return (
    <div>
      {/* Header */}
      <div className="lv-hdr">
        <div className="lv-ttl">
          New Sales Order
          <small>VA01 · {soNo}{quotId ? ` · From Quotation` : ''}</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm"
            onClick={() => nav('/sd/orders')}>← Cancel</button>
          <button className="btn btn-s sd-bsm"
            disabled={saving} onClick={() => save(false)}>
            💾 Save Draft
          </button>
          <button className="btn btn-p sd-bsm"
            disabled={saving} onClick={() => save(true)}>
            ✅ Confirm SO
          </button>
        </div>
      </div>

      {/* ── SECTION 1: Customer & Order Header ── */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">👤 Customer & Order Header</div>
        <div className="fi-form-sec-body">
          {/* Row 1: Customer + GSTIN + Supply Type */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Sold-to Customer *</label>
              <select style={inp} value={form.customerId} onChange={e => onCustomerChange(e.target.value)}>
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c.id||c.customerId} value={c.id||c.customerId}>
                    {c.customerCode||c.code} — {c.customerName||c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Customer GSTIN</label>
              <input style={{ ...inp, background:'#F8F9FA', fontFamily:'DM Mono,monospace', fontSize:11 }}
                value={form.customerGstin} readOnly />
            </div>
            <div>
              <label style={lbl}>Supply Type</label>
              <select style={inp} value={form.supplyType}
                onChange={e => {
                  setForm(f => ({ ...f, supplyType: e.target.value }))
                  setLines(prev => prev.map(l => calcLine(l, e.target.value==='Interstate')))
                }}>
                <option>Intrastate</option>
                <option>Interstate</option>
              </select>
            </div>
          </div>

          {/* Row 2: Dates + PO Ref + Priority */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Order Date *</label>
              <input type="date" style={inp} value={form.orderDate}
                onChange={e => setForm(f => ({ ...f, orderDate:e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>PO Date</label>
              <input type="date" style={inp} value={form.poDate}
                onChange={e => setForm(f => ({ ...f, poDate:e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Requested Delivery</label>
              <input type="date" style={inp} value={form.deliveryDate}
                onChange={e => setForm(f => ({ ...f, deliveryDate:e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Customer PO Ref.</label>
              <input style={inp} value={form.poReference}
                onChange={e => setForm(f => ({ ...f, poReference:e.target.value }))}
                placeholder="PO number" />
            </div>
            <div>
              <label style={lbl}>Delivery Priority</label>
              <select style={inp} value={form.deliveryPriority}
                onChange={e => setForm(f => ({ ...f, deliveryPriority:e.target.value }))}>
                {['Normal','Urgent','Critical','Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Payment + Terms */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Payment Terms</label>
              <select style={inp} value={form.paymentTerms}
                onChange={e => setForm(f => ({ ...f, paymentTerms:e.target.value }))}>
                {['Advance','Net 15','Net 30','Net 45','Net 60','LC','Cash on Delivery','COD'].map(t=>(
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Incoterms</label>
              <select style={inp} value={form.incoterms}
                onChange={e => setForm(f => ({ ...f, incoterms:e.target.value }))}>
                {['Ex-Works','FOB','CIF','DAP','DDP','FCA','CPT','CFR'].map(t=>(
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Freight Terms</label>
              <select style={inp} value={form.freightTerms}
                onChange={e => setForm(f => ({ ...f, freightTerms:e.target.value }))}>
                <option value="">-- Select --</option>
                {['Prepaid','Collect','Prepaid & Add','Third Party'].map(t=>(
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Reason for Order</label>
              <select style={inp} value={form.reasonForOrder}
                onChange={e => setForm(f => ({ ...f, reasonForOrder:e.target.value }))}>
                <option value="">-- Select --</option>
                {['New Order','Repeat Order','Sample Order','Export Order','Emergency','Project'].map(t=>(
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Bill To / Ship To */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            {/* Bill To — auto from customer master (read-only) */}
            <div>
              <label style={lbl}>
                Bill To Address
                <span style={{ fontSize:9, color:'#155724', marginLeft:6,
                  background:'#D4EDDA', padding:'1px 6px', borderRadius:8 }}>
                  Auto from Customer Master
                </span>
              </label>
              <textarea
                style={{ ...inp, resize:'none', background:'#F8F9FA',
                  color:'#495057', fontSize:11 }}
                rows={2}
                value={form.billToAddress}
                readOnly
                placeholder="Select customer to auto-fill billing address" />
              {selCust && !form.billToAddress && (
                <div style={{ fontSize:10, color:'#DC3545', marginTop:2 }}>
                  ⚠ No billing address in customer master
                </div>
              )}
            </div>

            {/* Ship To — dropdown from customer master shipToAddresses */}
            <div>
              <label style={lbl}>
                Ship To Address *
                {selCust && (() => {
                  const sts = Array.isArray(selCust.shipToAddresses)
                    ? selCust.shipToAddresses
                    : (selCust.shipToAddresses ? JSON.parse(selCust.shipToAddresses||'[]') : [])
                  return sts.length > 0
                    ? <span style={{ fontSize:9, color:'#0C5460', marginLeft:6,
                        background:'#D1ECF1', padding:'1px 6px', borderRadius:8 }}>
                        {sts.length} address(es) available
                      </span>
                    : <span style={{ fontSize:9, color:'#856404', marginLeft:6,
                        background:'#FFF3CD', padding:'1px 6px', borderRadius:8 }}>
                        No ship-to in master
                      </span>
                })()}
              </label>
              {(() => {
                const sts = selCust
                  ? (Array.isArray(selCust.shipToAddresses)
                    ? selCust.shipToAddresses
                    : (selCust.shipToAddresses
                        ? JSON.parse(selCust.shipToAddresses || '[]')
                        : []))
                  : []
                return sts.length > 0 ? (
                  <select style={inp}
                    value={form.shipToAddress}
                    onChange={e => setForm(f => ({ ...f, shipToAddress: e.target.value }))}>
                    {sts.map((s, i) => {
                      const addr = [s.label, s.address, s.city, s.state, s.pincode]
                                    .filter(Boolean).join(', ')
                      return (
                        <option key={i} value={addr}>
                          {s.isDefault ? '★ ' : ''}{s.label || `Ship-to ${i+1}`} — {s.city || s.address}
                        </option>
                      )
                    })}
                    {/* Option to use billing address */}
                    <option value={form.billToAddress}>Same as Bill To</option>
                  </select>
                ) : (
                  <input style={inp}
                    value={form.shipToAddress}
                    onChange={e => setForm(f => ({ ...f, shipToAddress: e.target.value }))}
                    placeholder="Enter ship-to address or add in Customer Master" />
                )
              })()}
            </div>
          </div>

          {/* Row 5: Sales Org fields */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Sales Org</label>
              <input style={{ ...inp, background:'#F8F9FA' }} value={form.salesOrg} readOnly />
            </div>
            <div>
              <label style={lbl}>Distribution Channel</label>
              <select style={inp} value={form.distributionChannel}
                onChange={e => setForm(f => ({ ...f, distributionChannel:e.target.value }))}>
                {[['10','Direct Sales'],['20','Dealer'],['30','Export'],['40','E-Commerce']].map(([v,l])=>(
                  <option key={v} value={v}>{v} — {l}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Sales Executive</label>
              <input style={inp} value={form.salesExec}
                onChange={e => setForm(f => ({ ...f, salesExec:e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Currency</label>
              <select style={inp} value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency:e.target.value }))}>
                {['INR','USD','EUR','AED','GBP'].map(c=>(
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr"
          style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center' }}>
          <span>📦 Line Items</span>
          <button onClick={() => setLines(p => [...p, newLine()])}
            style={{ padding:'3px 12px', fontSize:11, cursor:'pointer',
              background:'#fff', border:'1px solid #E0D5E0',
              borderRadius:4, color:'#714B67' }}>
            + Add Row
          </button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#714B67', color:'#fff' }}>
                {['#','Item','HSN','Qty','Unit','Rate','Disc%','Taxable',
                  isIGST?'IGST':'CGST', isIGST?'—':'SGST','Total',''].map((h,i) => (
                  <th key={i} style={{ padding:'7px 10px', textAlign:'left',
                    whiteSpace:'nowrap', fontSize:10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} style={{ borderBottom:'1px solid #F0F0F0',
                  background: i%2===0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding:'5px 8px', color:'#6C757D',
                    fontWeight:700, width:30 }}>{i+1}</td>
                  <td style={{ padding:'4px 6px', minWidth:180 }}>
                    <select style={{ ...inp, fontSize:11 }}
                      value={l.itemCode}
                      onChange={e => onItemChange(i, e.target.value)}>
                      <option value="">-- Select Item --</option>
                      {items.map(it => (
                        <option key={it.itemCode||it.code}
                          value={it.itemCode||it.code}>
                          {it.itemCode||it.code} — {it.itemName||it.name}
                        </option>
                      ))}
                    </select>
                    {!l.itemCode && (
                      <input style={{ ...inp, fontSize:11, marginTop:2 }}
                        value={l.itemName}
                        placeholder="Or type item name"
                        onChange={e => updLine(i, { itemName:e.target.value })} />
                    )}
                  </td>
                  <td style={{ padding:'4px 6px', width:90 }}>
                    <input style={{ ...inp, fontSize:10,
                      fontFamily:'DM Mono,monospace' }}
                      value={l.hsnCode}
                      placeholder="HSN"
                      onChange={e => updLine(i, { hsnCode:e.target.value })} />
                  </td>
                  <td style={{ padding:'4px 6px', width:70 }}>
                    <input type="number" style={{ ...inp, textAlign:'right' }}
                      value={l.qty} min={0}
                      onChange={e => updLine(i, { qty:parseFloat(e.target.value)||0 })} />
                  </td>
                  <td style={{ padding:'4px 6px', width:70 }}>
                    <select style={inp} value={l.unit}
                      onChange={e => updLine(i, { unit:e.target.value })}>
                      {['Nos','Kg','Mtr','Ltr','Box','Set','Pcs'].map(u=>(
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding:'4px 6px', width:90 }}>
                    <input type="number" style={{ ...inp, textAlign:'right' }}
                      value={l.rate} min={0}
                      onChange={e => updLine(i, { rate:parseFloat(e.target.value)||0 })} />
                  </td>
                  <td style={{ padding:'4px 6px', width:60 }}>
                    <input type="number" style={{ ...inp, textAlign:'right' }}
                      value={l.discPct} min={0} max={100}
                      onChange={e => updLine(i, { discPct:parseFloat(e.target.value)||0 })} />
                  </td>
                  <td style={{ padding:'4px 8px', fontFamily:'DM Mono,monospace',
                    textAlign:'right', background:'#F8F9FA' }}>
                    {fmtC(l.taxable)}
                  </td>
                  <td style={{ padding:'4px 8px', fontFamily:'DM Mono,monospace',
                    textAlign:'right', color:'#856404' }}>
                    {isIGST ? fmtC(l.igst) : fmtC(l.cgst)}
                  </td>
                  {!isIGST && (
                    <td style={{ padding:'4px 8px', fontFamily:'DM Mono,monospace',
                      textAlign:'right', color:'#856404' }}>
                      {fmtC(l.sgst)}
                    </td>
                  )}
                  {isIGST && <td>—</td>}
                  <td style={{ padding:'4px 8px', fontFamily:'DM Mono,monospace',
                    textAlign:'right', fontWeight:700 }}>
                    {fmtC(l.total)}
                  </td>
                  <td style={{ padding:'4px 6px', textAlign:'center' }}>
                    {lines.length > 1 && (
                      <button onClick={() => setLines(p => p.filter((_,idx)=>idx!==i))}
                        style={{ background:'#F8D7DA', color:'#721C24',
                          border:'none', borderRadius:3,
                          padding:'2px 6px', cursor:'pointer' }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background:'#EDE0EA', fontWeight:700 }}>
                <td colSpan={7} style={{ padding:'8px 10px',
                  fontSize:12, color:'#714B67' }}>
                  Totals
                </td>
                <td style={{ padding:'8px 10px', textAlign:'right',
                  fontFamily:'DM Mono,monospace' }}>
                  {fmtC(totals.taxable)}
                </td>
                <td style={{ padding:'8px 10px', textAlign:'right',
                  fontFamily:'DM Mono,monospace', color:'#856404' }}>
                  {isIGST ? fmtC(totals.igst) : fmtC(totals.cgst)}
                </td>
                {!isIGST && (
                  <td style={{ padding:'8px 10px', textAlign:'right',
                    fontFamily:'DM Mono,monospace', color:'#856404' }}>
                    {fmtC(totals.sgst)}
                  </td>
                )}
                {isIGST && <td>—</td>}
                <td style={{ padding:'8px 10px', textAlign:'right',
                  fontFamily:'DM Mono,monospace', fontWeight:800,
                  fontSize:14, color:'#714B67' }}>
                  {fmtC(totals.total)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Terms & Conditions + Remarks */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📋 Terms & Conditions</div>
        <div className="fi-form-sec-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Terms & Conditions</label>
              <select style={inp} value={form.termsAndConditions}
                onChange={e => setForm(f => ({ ...f, termsAndConditions:e.target.value }))}>
                <option value="">-- Select T&C --</option>
                {['Standard T&C','Export T&C','Credit Sale T&C','Advance Payment T&C',
                  'LC Terms','Warranty Terms','OEM Terms'].map(t=>(
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Special Instructions</label>
              <input style={inp} value={form.specialInstructions}
                onChange={e => setForm(f => ({ ...f, specialInstructions:e.target.value }))}
                placeholder="e.g. Fragile — Handle with care" />
            </div>
          </div>
          <div>
            <label style={lbl}>Remarks / Header Text</label>
            <textarea style={{ ...inp, resize:'vertical' }} rows={2}
              value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks:e.target.value }))}
              placeholder="Internal notes, delivery instructions, SO conditions..." />
          </div>
        </div>
      </div>

      {/* Amount Summary */}
      <div style={{ display:'flex', justifyContent:'flex-end',
        marginBottom:20 }}>
        <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
          borderRadius:8, padding:'14px 20px', minWidth:260 }}>
          {[
            ['Sub Total (Taxable)',  fmtC(totals.taxable), '#495057'],
            isIGST
              ? ['IGST',            fmtC(totals.igst),    '#856404']
              : ['CGST',            fmtC(totals.cgst),    '#856404'],
            !isIGST
              ? ['SGST',            fmtC(totals.sgst),    '#856404']
              : null,
            ['Grand Total',         fmtC(totals.total),   '#714B67'],
          ].filter(Boolean).map(([l,v,c]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between',
              padding:'5px 0', borderBottom:'1px solid #F0F0F0' }}>
              <span style={{ fontSize:12, color:'#6C757D' }}>{l}</span>
              <span style={{ fontSize:13, fontWeight:700,
                fontFamily:'DM Mono,monospace', color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer buttons */}
      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm"
          onClick={() => nav('/sd/orders')}>Cancel</button>
        <button className="btn btn-s sd-bsm"
          disabled={saving} onClick={() => save(false)}>
          💾 Save Draft
        </button>
        <button className="btn btn-p sd-bsm"
          disabled={saving} onClick={() => save(true)}>
          ✅ Confirm SO
        </button>
      </div>
    </div>
  )
}
