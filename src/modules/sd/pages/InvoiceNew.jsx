// ═══════════════════════════════════════════════════════════════════
// LNV ERP — SD / InvoiceNew.jsx  (VF01 — Full SAP-Style)
// Sources: Direct | From SO (?soId=) | From DC (?dcId=)
// Sections: Header · Bill/Ship To · Lines · Charges · GST · Terms
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })

// ── Styles ───────────────────────────────────────────────────────
const inp  = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const inpR = { ...inp, textAlign:'right', fontFamily:'DM Mono,monospace' }
const lbl  = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block',
  marginBottom:3, textTransform:'uppercase', letterSpacing:'0.5px' }
const sec  = { background:'#fff', border:'1px solid #E8E0E8', borderRadius:8,
  marginBottom:14, overflow:'hidden' }
const secH = { background:'linear-gradient(135deg,#714B67,#8B5E7E)', color:'#fff',
  padding:'9px 16px', fontSize:12, fontWeight:700, display:'flex',
  alignItems:'center', gap:8 }
const secB = { padding:'16px' }
const grid2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:12 }
const grid3 = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:12 }
const grid4 = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:14, marginBottom:12 }

// ── Helpers ──────────────────────────────────────────────────────
const fmtC  = n => '₹' + Number(n||0).toLocaleString('en-IN',{ minimumFractionDigits:2, maximumFractionDigits:2 })
const today = () => new Date().toISOString().split('T')[0]
const dueN  = (d=30) => new Date(Date.now()+d*86400000).toISOString().split('T')[0]

const numToWords = (n) => {
  if (!n || isNaN(n)) return ''
  const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven',
    'Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  const inWords = (num) => {
    if (num===0) return ''
    if (num<20)  return a[num]+' '
    if (num<100) return b[Math.floor(num/10)]+' '+(a[num%10]?a[num%10]+' ':'')
    if (num<1000) return a[Math.floor(num/100)]+ ' Hundred '+(inWords(num%100))
    if (num<100000) return inWords(Math.floor(num/1000))+'Thousand '+(inWords(num%1000))
    if (num<10000000) return inWords(Math.floor(num/100000))+'Lakh '+(inWords(num%100000))
    return inWords(Math.floor(num/10000000))+'Crore '+(inWords(num%10000000))
  }
  const [whole, dec] = Number(n).toFixed(2).split('.')
  let words = inWords(parseInt(whole)).trim()
  if (parseInt(dec)>0) words += ' and '+inWords(parseInt(dec)).trim()+' Paise'
  return 'Rupees '+words+' Only'
}

const calcLine = (l, isIGST=false) => {
  const qty    = parseFloat(l.qty    || 0)
  const rate   = parseFloat(l.rate   || l.unitPrice || 0)
  const disc   = parseFloat(l.discPct|| 0)
  const gstPct = parseFloat(l.gstPct || l.gstRate || 18)
  const taxable= qty * rate * (1 - disc/100)
  const gstAmt = taxable * gstPct / 100
  return { ...l, qty, rate, discPct:disc, gstPct, taxable,
    cgst:isIGST?0:gstAmt/2, sgst:isIGST?0:gstAmt/2,
    igst:isIGST?gstAmt:0, total:taxable+gstAmt }
}

const DEFAULT_TERMS = `1. Goods once sold will not be taken back.
2. All disputes subject to Ranipet jurisdiction only.
3. E&OE (Errors and Omissions Excepted).
4. Payment due as per agreed terms. Interest @18% p.a. on overdue amounts.
5. Goods remain property of LNV Manufacturing until full payment received.`

const BLANK_FORM = {
  customerId:'', customerCode:'', customerName:'', customerGstin:'',
  customerState:'', billToAddress:'', shipToAddress:'', sameAddress:true,
  soId:'', soNo:'', dcId:'', dcRef:'',
  poReference:'', poDate:'',
  invDate:today(), dueDate:dueN(30),
  supplyType:'Intrastate', placeOfSupply:'Tamil Nadu - 33',
  dispatchFrom:'LNV Manufacturing Pvt Ltd, Ranipet, TN - 632 402',
  dispatchThrough:'', deliveryNote:'', destination:'',
  vehicleNo:'', ewbNo:'', irn:'',
  bankName:'HDFC Bank', accountNo:'', ifsc:'', branch:'',
  packForward:0, freight:0, insurance:0, otherCharges:0, otherLabel:'Other',
  roundOff:0,
  remarks:'', termsConditions:DEFAULT_TERMS,
}

// Table styles — module level to avoid re-render
const thSt  = { padding:'8px 10px', textAlign:'left', fontSize:10,
  fontWeight:700, whiteSpace:'nowrap', borderRight:'1px solid rgba(255,255,255,0.2)' }
const thStR = { ...thSt, textAlign:'right' }
const tdSt  = { padding:'7px 8px', fontSize:12, borderBottom:'1px solid #F0F0F0', verticalAlign:'middle' }
const tdStR = { ...tdSt, textAlign:'right', fontFamily:'DM Mono,monospace' }

// Field — defined at module level to prevent remount on every render
const Field = ({ label, children, col }) => (
  <div style={col ? { gridColumn:`span ${col}` } : {}}>
    <label style={lbl}>{label}</label>
    {children}
  </div>
)

export default function InvoiceNew() {
  const nav         = useNavigate()
  const [sp]        = useSearchParams()
  const soIdParam   = sp.get('soId')
  const dcIdParam   = sp.get('dcId')

  const [invNo,    setInvNo]    = useState('Auto-generated')
  const [customers,setCustomers]= useState([])
  const [openSOs,  setOpenSOs]  = useState([])
  const [fgItems,  setFgItems]  = useState([])
  const [shipAddrs,setShipAddrs]= useState([])
  const [lines,    setLines]    = useState([])
  const [saving,   setSaving]   = useState(false)
  const [source,   setSource]   = useState({ type:'direct', ref:null })
  const [form,     setForm]     = useState(BLANK_FORM)
  const sf = (k, v) => setForm(f => ({ ...f, [k]:v }))

  const isIGST = form.supplyType === 'Interstate'

  // ── Totals ───────────────────────────────────────────────────
  const lineTotals = lines.reduce((a,l)=>({
    taxable:a.taxable+(l.taxable||0), cgst:a.cgst+(l.cgst||0),
    sgst:a.sgst+(l.sgst||0), igst:a.igst+(l.igst||0), lineTotal:a.lineTotal+(l.total||0)
  }),{ taxable:0, cgst:0, sgst:0, igst:0, lineTotal:0 })

  const charges   = parseFloat(form.packForward||0) + parseFloat(form.freight||0)
                  + parseFloat(form.insurance||0)   + parseFloat(form.otherCharges||0)
  const subTotal  = lineTotals.lineTotal + charges
  const roundOff  = Math.round(subTotal) - subTotal
  const grandTotal= subTotal + roundOff

  // ── Mount ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      sdApi.getCustomers().catch(()=>({ data:[] })),
      sdApi.getOrders({ status:'CONFIRMED,PROCESSING,DELIVERED' }).catch(()=>({ data:[] })),
      fetch(`${BASE}/mdm/items`, { headers:hdr2() }).then(r=>r.json()).catch(()=>({ data:[] })),
      fetch(`${BASE}/sd/invoices/next-no`, { headers:hdr2() }).then(r=>r.json()).catch(()=>({ invNo:'INV-AUTO' })),
    ]).then(([cR,soR,itR,noR]) => {
      setCustomers(cR.data||[])
      setOpenSOs(soR.data||[])
      setFgItems((itR.data||[]).filter(i=>i.type==='FG'||i.itemType==='FG'||!i.type))
      setInvNo((noR&&(noR.invNo||noR.invoiceNo))||'INV-AUTO')
    }).catch(e=>console.error('init',e))

    if (dcIdParam)      loadFromDC(dcIdParam)
    else if (soIdParam) loadFromSO(soIdParam)
  }, [])

  // ── Load from DC ─────────────────────────────────────────────
  const loadFromDC = async (id) => {
    try {
      const res = await sdApi.getInvoiceFromDC(id)
      if (res.error) { toast.error('DC: '+res.error); return }
      const dc = res.data; if (!dc) return
      setSource({ type:'dc', ref:dc.dcRef })
      const igst = !(dc.customerGstin||'').startsWith('33')
      setForm(f=>({ ...f,
        customerId:dc.customerId||'', customerName:dc.customerName||'',
        customerGstin:dc.customerGstin||'', customerState:dc.customerState||'',
        billToAddress:dc.billToAddress||'', shipToAddress:dc.shipToAddress||'',
        soId:dc.soId||'', soNo:dc.soRef||'',
        dcId:dc.dcId, dcRef:dc.dcRef, ewbNo:dc.ewbNo||'', vehicleNo:dc.vehicleNo||'',
        supplyType:igst?'Interstate':'Intrastate',
      }))
      if (dc.lines?.length) {
        setLines(dc.lines.map(l=>calcLine(l,igst)))
        toast.success(`DC ${dc.dcRef} — ${dc.lines.length} item(s) loaded`)
      }
    } catch(e){ toast.error('DC load failed: '+e.message) }
  }

  // ── Load from SO ─────────────────────────────────────────────
  const loadFromSO = async (id) => {
    try {
      const res = await sdApi.getOrderById(id)
      const so = res.data||res; if (!so) return
      setSource({ type:'so', ref:so.soNo })
      const igst = so.supplyType==='Interstate'
      setForm(f=>({ ...f,
        customerId:so.customerId||'', customerName:so.customerName||'',
        customerGstin:so.customerGstin||'', soId:so.id, soNo:so.soNo,
        poReference:so.poReference||'',
        supplyType:igst?'Interstate':'Intrastate',
        dueDate:so.paymentTerms==='Net 15'?dueN(15):dueN(30),
      }))
      if (so.lines?.length)
        setLines(so.lines.map(l=>calcLine({
          itemCode:l.itemCode, itemName:l.itemName||'', hsnCode:l.hsnCode||'',
          qty:parseFloat(l.qty||0), unit:l.unit||'Nos',
          rate:parseFloat(l.rate||l.unitPrice||0),
          discPct:parseFloat(l.discPct||0), gstPct:parseFloat(l.gstPct||l.gstRate||18),
        }, igst)))
      toast.success(`SO ${so.soNo} loaded`)
    } catch(e){ toast.error('SO load failed: '+e.message) }
  }

  const onCustomerChange = (custId) => {
    const c = customers.find(c=>String(c.id||c.customerId)===String(custId))
    if (!c) return
    let addrs = []
    try { const r=c.shipToAddresses; addrs=r?(typeof r==='string'?JSON.parse(r):r):[] } catch{}
    setShipAddrs(addrs)
    const igst = !(c.gstin||'').startsWith('33')
    setForm(f=>({ ...f,
      customerId:c.id||c.customerId, customerCode:c.code||'',
      customerName:c.name||c.customerName||'', customerGstin:c.gstin||'',
      customerState:c.state||'',
      billToAddress:[c.address,c.city,c.state,c.pincode].filter(Boolean).join(', '),
      shipToAddress:[c.address,c.city,c.state,c.pincode].filter(Boolean).join(', '),
      supplyType:igst?'Interstate':'Intrastate',
    }))
  }

  const onSOChange = async (id) => { sf('soId',id); if(id) await loadFromSO(id) }

  // ── Line ops ─────────────────────────────────────────────────
  const updLine = (i,ch) => setLines(p=>p.map((l,idx)=>idx!==i?l:calcLine({...l,...ch},isIGST)))
  const addLine = () => setLines(p=>[...p, calcLine({ itemCode:'',itemName:'',hsnCode:'',qty:1,unit:'Nos',rate:0,discPct:0,gstPct:18 },isIGST)])
  const delLine = (i) => setLines(p=>p.filter((_,idx)=>idx!==i))

  const onItemSelect = (i, code) => {
    const item = fgItems.find(it=>(it.code||it.itemCode)===code)
    updLine(i,{
      itemCode:code, itemName:item?.name||item?.itemName||'',
      hsnCode:item?.hsnCode||item?.hsn||'', unit:item?.uom||item?.unit||'Nos',
      rate:item?.stdCost?parseFloat(item.stdCost):0,
    })
  }

  // ── Save ─────────────────────────────────────────────────────
  const save = async (post=false) => {
    if (!form.customerName) return toast.error('Select a customer!')
    const validLines = lines.filter(l=>l.itemName&&parseFloat(l.qty||0)>0)
    if (!validLines.length) return toast.error('Add at least one invoice line!')
    setSaving(true)
    try {
      const payload = {
        customerId:form.customerId||null, customerName:form.customerName,
        customerGstin:form.customerGstin||null, customerState:form.customerState||null,
        soRef:form.soNo||null, dcRef:form.dcRef||null, dcId:form.dcId||null,
        dueDate:form.dueDate||null,
        supplyType:isIGST?'interstate':'domestic',
        notes:`${form.remarks||''}\n${form.termsConditions||''}`.trim()||null,
        lines: validLines.map(l=>({
          itemCode:l.itemCode||null, itemName:l.itemName,
          description:l.itemName, hsnCode:l.hsnCode||null,
          qty:parseFloat(l.qty), unit:l.unit||'Nos',
          unitPrice:parseFloat(l.rate||0), gstRate:parseFloat(l.gstPct||18),
        })),
      }
      const res = await sdApi.createInvoice(payload)
      if (res.error) throw new Error(res.error)
      if (post && res.data?.id) await sdApi.postInvoice(res.data.id).catch(()=>{})
      toast.success(`${res.data?.invoiceNo||invNo} ${post?'posted!':'saved as draft'}`)
      nav('/sd/invoices')
    } catch(e){ toast.error(e.message) }
    finally { setSaving(false) }
  }

  // table styles defined at module level below

  const srcColor = source.type==='dc' ? '#155724' : source.type==='so' ? '#004085' : '#6C757D'
  const srcBg    = source.type==='dc' ? '#D4EDDA' : source.type==='so' ? '#CCE5FF' : '#E2E3E5'

  return (
    <div style={{ maxWidth:1400, margin:'0 auto' }}>

      {/* ── Top Header Bar ── */}
      <div className="lv-hdr" style={{ marginBottom:12 }}>
        <div className="lv-ttl" style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span>New Tax Invoice</span>
          <span style={{ fontSize:10, fontFamily:'DM Mono,monospace', color:'#714B67',
            background:'#F3EEF3', padding:'2px 8px', borderRadius:4 }}>
            VF01 · {invNo}
          </span>
          {source.ref && (
            <span style={{ fontSize:10, fontWeight:700, background:srcBg, color:srcColor,
              border:`1px solid ${srcColor}40`, borderRadius:4, padding:'2px 8px' }}>
              ✅ {source.type.toUpperCase()}: {source.ref}
            </span>
          )}
        </div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/sd/invoices')}>← Cancel</button>
          <button className="btn btn-s sd-bsm" disabled={saving} onClick={()=>save(false)}>💾 Save Draft</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={()=>save(true)}>📤 Save & Post</button>
        </div>
      </div>

      {/* DC notice */}
      {source.type==='dc' && (
        <div style={{ marginBottom:12, padding:'9px 16px', background:'#D4EDDA',
          border:'1px solid #C3E6CB', borderRadius:6, fontSize:12, color:'#155724' }}>
          🚚 <strong>DC Source: {source.ref}</strong> — PGI posted. Posting this invoice will close the challan.
        </div>
      )}

      {/* ═══ SECTION 1: Invoice Header ═══ */}
      <div style={sec}>
        <div style={secH}>📄 Invoice Header</div>
        <div style={secB}>
          <div style={grid3}>
            <Field label="Customer *">
              <select style={inp} value={form.customerId} onChange={e=>onCustomerChange(e.target.value)}>
                <option value="">-- Select Customer --</option>
                {customers.map(c=>(
                  <option key={c.id||c.customerId} value={c.id||c.customerId}>
                    {c.code} — {c.name||c.customerName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={source.type==='dc'?'🚚 Challan Reference':'Against Sales Order'}>
              {source.type==='dc'
                ? <input style={{ ...inp, background:'#D4EDDA', fontFamily:'DM Mono,monospace', fontWeight:700 }}
                    value={form.dcRef} readOnly />
                : <select style={inp} value={form.soId} onChange={e=>onSOChange(e.target.value)}>
                    <option value="">-- Direct Invoice (no SO) --</option>
                    {openSOs.map(so=><option key={so.id} value={so.id}>{so.soNo} · {so.customerName}</option>)}
                  </select>
              }
            </Field>
            <Field label="Customer GSTIN">
              <input style={{ ...inp, fontFamily:'DM Mono,monospace', background:'#F8F9FA' }}
                value={form.customerGstin} readOnly />
            </Field>
          </div>

          <div style={grid4}>
            <Field label="Invoice Date *">
              <input type="date" style={inp} value={form.invDate} onChange={e=>sf('invDate',e.target.value)} />
            </Field>
            <Field label="Due Date">
              <input type="date" style={inp} value={form.dueDate} onChange={e=>sf('dueDate',e.target.value)} />
            </Field>
            <Field label="Supply Type">
              <select style={inp} value={form.supplyType}
                onChange={e=>{ sf('supplyType',e.target.value); setLines(p=>p.map(l=>calcLine(l,e.target.value==='Interstate'))) }}>
                <option>Intrastate</option>
                <option>Interstate</option>
              </select>
            </Field>
            <Field label="Place of Supply">
              <input style={inp} value={form.placeOfSupply} onChange={e=>sf('placeOfSupply',e.target.value)} />
            </Field>
          </div>

          <div style={grid4}>
            <Field label="Customer PO No.">
              <input style={inp} value={form.poReference} onChange={e=>sf('poReference',e.target.value)} placeholder="Cust PO #" />
            </Field>
            <Field label="Customer PO Date">
              <input type="date" style={inp} value={form.poDate} onChange={e=>sf('poDate',e.target.value)} />
            </Field>
            <Field label="E-Way Bill No.">
              <input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={form.ewbNo}
                onChange={e=>sf('ewbNo',e.target.value)} placeholder="EWB number" />
            </Field>
            <Field label="Vehicle No.">
              <input style={{ ...inp, fontFamily:'DM Mono,monospace', textTransform:'uppercase' }}
                value={form.vehicleNo} onChange={e=>sf('vehicleNo',e.target.value.toUpperCase())} placeholder="TN 28 ..." />
            </Field>
          </div>

          <div style={grid3}>
            <Field label="Dispatch From">
              <input style={inp} value={form.dispatchFrom} onChange={e=>sf('dispatchFrom',e.target.value)} />
            </Field>
            <Field label="Dispatch Through (Transporter)">
              <input style={inp} value={form.dispatchThrough} onChange={e=>sf('dispatchThrough',e.target.value)} placeholder="Transporter name" />
            </Field>
            <Field label="Destination">
              <input style={inp} value={form.destination} onChange={e=>sf('destination',e.target.value)} placeholder="City / Destination" />
            </Field>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: Bill To / Ship To ═══ */}
      <div style={sec}>
        <div style={secH}>📍 Bill To / Ship To</div>
        <div style={{ ...secB, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <label style={lbl}>Bill To Address</label>
            <textarea style={{ ...inp, resize:'vertical', minHeight:80 }} rows={4}
              value={form.billToAddress}
              onChange={e=>{ sf('billToAddress',e.target.value); if(form.sameAddress) sf('shipToAddress',e.target.value) }}
              placeholder="Billing address..." />
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
              <label style={lbl}>Ship To Address</label>
              <label style={{ fontSize:10, color:'#714B67', cursor:'pointer', display:'flex', gap:4, alignItems:'center' }}>
                <input type="checkbox" checked={form.sameAddress}
                  onChange={e=>{ sf('sameAddress',e.target.checked); if(e.target.checked) sf('shipToAddress',form.billToAddress) }} />
                Same as Bill To
              </label>
            </div>
            {form.sameAddress
              ? <div style={{ ...inp, background:'#F8F9FA', color:'#6C757D', minHeight:80,
                  display:'flex', alignItems:'center', whiteSpace:'pre-wrap', fontSize:12 }}>
                  {form.billToAddress || '(same as billing address)'}
                </div>
              : <>
                  {shipAddrs.length > 0 && (
                    <select style={{ ...inp, marginBottom:6 }}
                      onChange={e=>{ if(e.target.value) sf('shipToAddress',e.target.value) }}>
                      <option value="">-- Select ship-to address --</option>
                      {shipAddrs.map((a,i)=><option key={i} value={typeof a==='object'?(a.address||JSON.stringify(a)):a}>{typeof a==='object'?(a.label||a.city||`Address ${i+1}`):a}</option>)}
                    </select>
                  )}
                  <textarea style={{ ...inp, resize:'vertical', minHeight:72 }} rows={3}
                    value={form.shipToAddress} onChange={e=>sf('shipToAddress',e.target.value)}
                    placeholder="Ship to address..." />
                </>
            }
          </div>
        </div>
      </div>

      {/* ═══ SECTION 3: Line Items ═══ */}
      <div style={sec}>
        <div style={secH}>
          <span>📦 Invoice Line Items</span>
          <button onClick={addLine}
            style={{ marginLeft:'auto', padding:'3px 14px', fontSize:11, cursor:'pointer',
              background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.4)',
              borderRadius:4, color:'#fff', fontWeight:600 }}>
            + Add Row
          </button>
        </div>

        {lines.length===0 ? (
          <div style={{ padding:32, textAlign:'center', color:'#6C757D', fontSize:13 }}>
            {source.type==='dc'
              ? '⚠️ No items in DC — click + Add Row'
              : 'Select SO / DC above to auto-load, or click + Add Row'}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:1100 }}>
              <thead>
                <tr style={{ background:'#714B67', color:'#fff' }}>
                  <th style={{ ...thSt, width:32 }}>#</th>
                  <th style={{ ...thSt, minWidth:200 }}>Item / Description</th>
                  <th style={{ ...thSt, width:90 }}>HSN</th>
                  <th style={{ ...thStR, width:80 }}>Qty</th>
                  <th style={{ ...thSt, width:72 }}>Unit</th>
                  <th style={{ ...thStR, width:100 }}>Rate (₹)</th>
                  <th style={{ ...thStR, width:68 }}>Disc%</th>
                  <th style={{ ...thStR, width:110 }}>Taxable (₹)</th>
                  <th style={{ ...thSt, width:72 }}>GST%</th>
                  {isIGST
                    ? <th style={{ ...thStR, width:100 }}>IGST (₹)</th>
                    : <><th style={{ ...thStR, width:95 }}>CGST (₹)</th>
                        <th style={{ ...thStR, width:95 }}>SGST (₹)</th></>
                  }
                  <th style={{ ...thStR, width:115 }}>Total (₹)</th>
                  <th style={{ ...thSt, width:36 }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l,i)=>(
                  <tr key={i} style={{ background:i%2===0?'#fff':'#FAFAFA' }}>
                    <td style={{ ...tdSt, color:'#999', fontWeight:700, textAlign:'center' }}>{i+1}</td>
                    <td style={{ ...tdSt, minWidth:200 }}>
                      <select style={{ ...inp, marginBottom:l.itemCode?0:3 }} value={l.itemCode}
                        onChange={e=>onItemSelect(i,e.target.value)}>
                        <option value="">-- Select FG Item --</option>
                        {fgItems.map(it=>(
                          <option key={it.code||it.itemCode} value={it.code||it.itemCode}>
                            {it.code||it.itemCode} — {it.name||it.itemName}
                          </option>
                        ))}
                      </select>
                      {!l.itemCode && (
                        <input style={{ ...inp, marginTop:3, fontSize:11 }}
                          value={l.itemName} onChange={e=>updLine(i,{itemName:e.target.value})}
                          placeholder="Item description (manual)" />
                      )}
                    </td>
                    <td style={tdSt}>
                      <input style={{ ...inp, fontFamily:'DM Mono,monospace', fontSize:11 }}
                        value={l.hsnCode} onChange={e=>updLine(i,{hsnCode:e.target.value})} placeholder="HSN" />
                    </td>
                    <td style={tdSt}>
                      <input type="number" style={inpR} value={l.qty} min={0} step="0.001"
                        onChange={e=>updLine(i,{qty:parseFloat(e.target.value)||0})} />
                    </td>
                    <td style={tdSt}>
                      <select style={inp} value={l.unit} onChange={e=>updLine(i,{unit:e.target.value})}>
                        {['Nos','Kg','Mtr','Ltr','Box','Set','Pcs','MT','Gms'].map(u=><option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={tdSt}>
                      <input type="number" style={inpR} value={l.rate} min={0} step="0.01"
                        onChange={e=>updLine(i,{rate:parseFloat(e.target.value)||0})} />
                    </td>
                    <td style={tdSt}>
                      <input type="number" style={inpR} value={l.discPct} min={0} max={100} step="0.01"
                        onChange={e=>updLine(i,{discPct:parseFloat(e.target.value)||0})} />
                    </td>
                    <td style={{ ...tdStR, background:'#F8F5F8', fontWeight:600 }}>{fmtC(l.taxable)}</td>
                    <td style={tdSt}>
                      <select style={{ ...inp, fontSize:11 }} value={l.gstPct}
                        onChange={e=>updLine(i,{gstPct:parseFloat(e.target.value)})}>
                        {[0,5,12,18,28].map(g=><option key={g} value={g}>{g}%</option>)}
                      </select>
                    </td>
                    {isIGST
                      ? <td style={{ ...tdStR, color:'#856404' }}>{fmtC(l.igst)}</td>
                      : <><td style={{ ...tdStR, color:'#856404' }}>{fmtC(l.cgst)}</td>
                          <td style={{ ...tdStR, color:'#856404' }}>{fmtC(l.sgst)}</td></>
                    }
                    <td style={{ ...tdStR, fontWeight:700, color:'#2D3748' }}>{fmtC(l.total)}</td>
                    <td style={{ ...tdSt, textAlign:'center' }}>
                      <button onClick={()=>delLine(i)}
                        style={{ background:'#F8D7DA', color:'#721C24', border:'none',
                          borderRadius:3, padding:'3px 7px', cursor:'pointer', fontSize:12 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Line totals row */}
              <tfoot>
                <tr style={{ background:'#F3EEF3', fontWeight:700 }}>
                  <td colSpan={7} style={{ padding:'8px 12px', fontSize:12, color:'#714B67' }}>
                    Sub Totals ({lines.length} item{lines.length!==1?'s':''})
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', color:'#2D3748' }}>
                    {fmtC(lineTotals.taxable)}
                  </td>
                  <td />
                  {isIGST
                    ? <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', color:'#856404' }}>{fmtC(lineTotals.igst)}</td>
                    : <><td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', color:'#856404' }}>{fmtC(lineTotals.cgst)}</td>
                        <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', color:'#856404' }}>{fmtC(lineTotals.sgst)}</td></>
                  }
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontSize:14, color:'#714B67' }}>
                    {fmtC(lineTotals.lineTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ═══ SECTION 4: Additional Charges + Grand Total ═══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

        {/* Additional Charges */}
        <div style={sec}>
          <div style={secH}>➕ Additional Charges</div>
          <div style={secB}>
            {[
              ['Packing & Forwarding (₹)', 'packForward'],
              ['Freight / Transport (₹)',  'freight'],
              ['Insurance (₹)',            'insurance'],
            ].map(([label, key])=>(
              <div key={key} style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:10 }}>
                <label style={{ ...lbl, marginBottom:0, color:'#495057' }}>{label}</label>
                <input type="number" style={{ ...inpR, width:160 }} value={form[key]} min={0} step="0.01"
                  onChange={e=>sf(key, parseFloat(e.target.value)||0)} />
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, gap:8 }}>
              <input style={{ ...inp, flex:1, fontSize:11 }} value={form.otherLabel}
                onChange={e=>sf('otherLabel',e.target.value)} placeholder="Other charge label" />
              <input type="number" style={{ ...inpR, width:160 }} value={form.otherCharges} min={0} step="0.01"
                onChange={e=>sf('otherCharges', parseFloat(e.target.value)||0)} />
            </div>
            {charges > 0 && (
              <div style={{ borderTop:'1px solid #E0D5E0', paddingTop:8, display:'flex',
                justifyContent:'space-between', fontWeight:700, color:'#714B67', fontSize:12 }}>
                <span>Total Charges</span>
                <span style={{ fontFamily:'DM Mono,monospace' }}>{fmtC(charges)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Grand Total */}
        <div style={sec}>
          <div style={secH}>🧾 Invoice Summary</div>
          <div style={secB}>
            {[
              ['Taxable Amount',           fmtC(lineTotals.taxable), '#2D3748'],
              isIGST
                ? ['IGST',                fmtC(lineTotals.igst),    '#856404']
                : ['CGST',                fmtC(lineTotals.cgst),    '#856404'],
              !isIGST
                ? ['SGST',                fmtC(lineTotals.sgst),    '#856404']
                : null,
              charges > 0
                ? ['Additional Charges',  fmtC(charges),            '#495057']
                : null,
              ['Round Off',               fmtC(roundOff),            '#6C757D'],
            ].filter(Boolean).map(([k,v,c])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between',
                padding:'6px 0', borderBottom:'1px solid #F0F0F0' }}>
                <span style={{ fontSize:12, color:'#6C757D' }}>{k}</span>
                <span style={{ fontFamily:'DM Mono,monospace', fontWeight:600, color:c }}>{v}</span>
              </div>
            ))}
            {/* Grand Total */}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 4px',
              borderTop:'2px solid #714B67', marginTop:6 }}>
              <span style={{ fontSize:14, fontWeight:800, color:'#714B67' }}>GRAND TOTAL</span>
              <span style={{ fontSize:18, fontWeight:800, fontFamily:'DM Mono,monospace', color:'#714B67' }}>
                {fmtC(grandTotal)}
              </span>
            </div>
            {/* Amount in words */}
            <div style={{ background:'#F3EEF3', borderRadius:5, padding:'6px 10px',
              fontSize:10, color:'#714B67', fontStyle:'italic', lineHeight:'1.5' }}>
              {numToWords(grandTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 5: Bank Details + Remarks ═══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div style={sec}>
          <div style={secH}>🏦 Bank Details (for Payment)</div>
          <div style={secB}>
            <div style={grid2}>
              <Field label="Bank Name">
                <input style={inp} value={form.bankName} onChange={e=>sf('bankName',e.target.value)} />
              </Field>
              <Field label="Branch">
                <input style={inp} value={form.branch} onChange={e=>sf('branch',e.target.value)} placeholder="Branch name" />
              </Field>
            </div>
            <div style={grid2}>
              <Field label="Account No.">
                <input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={form.accountNo}
                  onChange={e=>sf('accountNo',e.target.value)} placeholder="Acct number" />
              </Field>
              <Field label="IFSC Code">
                <input style={{ ...inp, fontFamily:'DM Mono,monospace', textTransform:'uppercase' }}
                  value={form.ifsc} onChange={e=>sf('ifsc',e.target.value.toUpperCase())} placeholder="HDFC0001234" />
              </Field>
            </div>
          </div>
        </div>

        <div style={sec}>
          <div style={secH}>📝 Remarks</div>
          <div style={secB}>
            <textarea style={{ ...inp, resize:'vertical' }} rows={5}
              value={form.remarks}
              onChange={e=>sf('remarks',e.target.value)}
              placeholder="Delivery notes, special instructions, etc..." />
          </div>
        </div>
      </div>

      {/* ═══ SECTION 6: Terms & Conditions ═══ */}
      <div style={sec}>
        <div style={secH}>📋 Terms & Conditions</div>
        <div style={secB}>
          <textarea style={{ ...inp, resize:'vertical', fontSize:11, lineHeight:'1.6' }} rows={6}
            value={form.termsConditions}
            onChange={e=>sf('termsConditions',e.target.value)} />
        </div>
      </div>

      {/* ═══ Footer Action Bar ═══ */}
      <div style={{ position:'sticky', bottom:0, background:'#fff', borderTop:'2px solid #E8E0E8',
        padding:'12px 16px', display:'flex', justifyContent:'space-between',
        alignItems:'center', zIndex:10, boxShadow:'0 -4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:12, color:'#6C757D' }}>
          Grand Total: <strong style={{ color:'#714B67', fontSize:15, fontFamily:'DM Mono,monospace' }}>
            {fmtC(grandTotal)}
          </strong>
          {lines.length > 0 && <span style={{ marginLeft:12 }}>{lines.length} line{lines.length!==1?'s':''}</span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/sd/invoices')}>Cancel</button>
          <button className="btn btn-s sd-bsm" disabled={saving} onClick={()=>save(false)}>💾 Save Draft</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={()=>save(true)}>📤 Save & Post Invoice</button>
        </div>
      </div>

    </div>
  )
}
