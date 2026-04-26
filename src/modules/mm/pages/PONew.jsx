import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { mmApi } from '../services/mmApi'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
  borderRadius:5, fontSize:12, outline:'none', width:'100%',
  boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057',
  display:'block', marginBottom:3, textTransform:'uppercase',
  letterSpacing:.3 }
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN',
  {minimumFractionDigits:2,maximumFractionDigits:2})

const PO_TYPES = [
  { value:'PO',       label:'Purchase Order',  prefix:'PO'  },
  { value:'SPO',      label:'Service PO',      prefix:'SPO' },
  { value:'OPO',      label:'Open PO',         prefix:'OPO' },
  { value:'DPO',      label:'Direct PO',       prefix:'DPO' },
]

const EMPTY_LINE = {
  itemCode:'', itemName:'', hsnCode:'', specification:'',
  qty:1, unit:'Nos', rate:0, discount:0, gstRate:18,
}

const EMPTY_ADD_DED = { type:'Addition', description:'', amount:0 }

const DEFAULT_TC = `1. Goods must be delivered as per the specifications mentioned above.
2. Payment will be made within the agreed credit period after receipt of invoice.
3. Any damages during transit will be the responsibility of the supplier.
4. We reserve the right to reject goods that do not meet quality standards.
5. Late delivery may attract penalty as per mutual agreement.`

// ── Supplier Address Popup ─────────────────────────────────
function SupplierAddressPopup({ vendor, onSelect, onClose }) {
  const addresses = [
    {
      type:'Registered Office',
      address: vendor?.address||'',
      city: vendor?.city||'',
      state: vendor?.state||'',
      pin: vendor?.pincode||''
    },
    ...(vendor?.contacts ? (() => {
      try {
        const c = JSON.parse(vendor.contacts||'[]')
        return c.filter(x=>x.address).map(x=>({
          type: x.name||'Branch',
          address: x.address||'',
          city: x.city||'',
          state: x.state||'',
          pin: x.pin||''
        }))
      } catch { return [] }
    })() : [])
  ].filter(a=>a.address)

  return (
    <div style={{ position:'fixed', inset:0,
      background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:520,
        overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between',
          alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontSize:15,
            fontWeight:700 }}>
            📍 Select Delivery Address
          </h3>
          <span onClick={onClose}
            style={{ color:'#fff', cursor:'pointer',
              fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:16 }}>
          <div style={{ fontSize:13, fontWeight:700,
            color:'#714B67', marginBottom:12 }}>
            {vendor?.vendorName}
            <span style={{ fontSize:11, color:'#6C757D',
              fontWeight:400, marginLeft:8 }}>
              {vendor?.gstin}
            </span>
          </div>
          {addresses.length===0 ? (
            <div style={{ padding:20, textAlign:'center',
              color:'#6C757D', fontSize:12 }}>
              No delivery address found in master.
              <br/>Add address in MDM → Vendor Master.
            </div>
          ) : (
            <div style={{ display:'flex',
              flexDirection:'column', gap:8 }}>
              {addresses.map((a,i)=>(
                <div key={i} onClick={()=>onSelect(a)}
                  style={{ padding:'10px 14px',
                    border:'2px solid #E0D5E0',
                    borderRadius:8, cursor:'pointer',
                    transition:'all .15s' }}
                  onMouseEnter={e=>
                    e.currentTarget.style.borderColor='#714B67'}
                  onMouseLeave={e=>
                    e.currentTarget.style.borderColor='#E0D5E0'}>
                  <div style={{ fontSize:11, fontWeight:700,
                    color:'#714B67', marginBottom:3 }}>
                    {a.type}
                  </div>
                  <div style={{ fontSize:12, color:'#1C1C1C' }}>
                    {a.address}
                  </div>
                  <div style={{ fontSize:11, color:'#6C757D' }}>
                    {[a.city,a.state,a.pin].filter(Boolean).join(', ')}
                  </div>
                </div>
              ))}
              <div onClick={()=>onSelect({
                type:'LNV Factory',
                address:'LNV Manufacturing Pvt. Ltd., Ranipet',
                city:'Ranipet', state:'Tamil Nadu', pin:'632401'
              })} style={{ padding:'10px 14px',
                border:'2px dashed #714B67',
                borderRadius:8, cursor:'pointer',
                background:'#F8F4F8' }}>
                <div style={{ fontSize:11, fontWeight:700,
                  color:'#714B67' }}>
                  🏭 Our Factory (Default)
                </div>
                <div style={{ fontSize:12, color:'#1C1C1C' }}>
                  LNV Manufacturing Pvt. Ltd., Ranipet
                </div>
                <div style={{ fontSize:11, color:'#6C757D' }}>
                  Ranipet, Tamil Nadu - 632401
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding:'12px 20px',
          borderTop:'1px solid #E0D5E0', background:'#F8F7FA',
          display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose}
            style={{ padding:'8px 20px', background:'#fff',
              color:'#6C757D', border:'1.5px solid #E0D5E0',
              borderRadius:6, fontSize:13, cursor:'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────
export default function PONew() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const [vendors,  setVendors]  = useState([])
  const [items,    setItems]    = useState([])
  const [saving,   setSaving]   = useState(false)
  const [selVendor,setSelVendor]= useState(null)
  const [lines,    setLines]    = useState([{...EMPTY_LINE}])
  const [addDeds,  setAddDeds]  = useState([])
  const [showAddrPopup, setShowAddrPopup] = useState(false)
  const [poNumber, setPoNumber] = useState('Auto-generated on save')

  const [hdr, setHdr] = useState({
    poType:        'PO',
    vendorCode:    '',
    poDate:        new Date().toISOString().split('T')[0],
    deliveryDate:  '',
    validTo:       '',
    deliveryLocation: 'Ranipet Main Store',
    deliveryAddress: '',
    paymentTerms:  'Net 30 Days',
    purchaseCategory: 'Raw Material',
    referenceNo:   '',
    prNo:          '',
    csNo:          '',
    remarks:       '',
    termsConditions: DEFAULT_TC,
    // Other Details
    reverseCharge:   'No',
    purchaseType:    'Local',
    shippingBillNo:  '',
    shippingDate:    '',
    bobNo:           '',
    includeTarget:   false,
  })

  useEffect(()=>{
    // Read CS data from sessionStorage IMMEDIATELY (before any async)
    let csData = null
    try {
      const raw = sessionStorage.getItem('cs_to_po')
      if (raw) {
        csData = JSON.parse(raw)
        sessionStorage.removeItem('cs_to_po')
        console.log('[PONew] CS payload loaded:', csData)
      }
    } catch(e) { console.error('[PONew] CS parse error:', e) }

    Promise.all([mmApi.getVendors(), mmApi.getItems()])
      .then(([vd, id]) => {
        const allVendors = vd.data || []
        const allItems   = id.data || []
        setVendors(allVendors)
        setItems(allItems)

        // ── CS Data Auto-fill ─────────────────────────────
        if (csData) {
          // 1. Match vendor
          const vendor =
            allVendors.find(v => v.vendorCode === csData.vendorCode) ||
            allVendors.find(v =>
              v.vendorName?.toLowerCase() ===
              csData.vendorName?.toLowerCase()) ||
            allVendors.find(v =>
              v.vendorName?.toLowerCase().includes(
                (csData.vendorName||'').toLowerCase()))

          if (vendor) {
            setSelVendor(vendor)
            setHdr(p => ({
              ...p,
              vendorCode:   vendor.vendorCode,
              prNo:         csData.prNo        || '',
              csNo:         csData.csNo        || '',
              paymentTerms: csData.paymentTerms||
                            vendor.paymentTerms|| p.paymentTerms,
            }))
          } else {
            // Set at least PR/CS reference
            setHdr(p => ({
              ...p,
              prNo: csData.prNo || '',
              csNo: csData.csNo || '',
            }))
            if (csData.vendorName) {
              toast(`Vendor "${csData.vendorName}" not in master — select manually`,
                { icon: '⚠️', duration: 5000 })
            }
          }

          // 2. Load line items
          const items = csData.items || []
          if (items.length > 0) {
            const mappedLines = items.map(item => {
              const master = allItems.find(it =>
                it.itemName?.toLowerCase() ===
                item.itemName?.toLowerCase())
              return {
                itemCode:      master?.itemCode   || '',
                itemName:      item.itemName       || '',
                hsnCode:       item.hsnCode        ||
                               master?.hsnCode     || '',
                specification: item.specification  || '',
                qty:           parseFloat(item.qty || 1),
                unit:          item.unit           ||
                               master?.uom         || 'Nos',
                rate:          parseFloat(item.rate     || 0),
                discount:      parseFloat(item.discount || 0),
                gstRate:       parseFloat(item.gstRate  || 18),
              }
            })
            setLines(mappedLines)
            toast.success(
              `CS ${csData.csNo} loaded! ${vendor?vendor.vendorName:csData.vendorName||'Vendor'} · ${mappedLines.length} item(s)`,
              { duration: 5000 }
            )
          } else {
            toast(`CS ${csData.csNo} loaded — no items found`,
              { icon: '⚠️' })
          }
        }

        // ── URL params ────────────────────────────────────
        const prNo = searchParams.get('prNo')
        const csNo = searchParams.get('csNo')
        if (prNo && !csData) setHdr(p => ({ ...p, prNo }))
        if (csNo && !csData) setHdr(p => ({ ...p, csNo }))
      })
      .catch(() => {})

    // Get PO number preview
    fetch(`${BASE_URL}/mm/po/next-no`,
      { headers: authHdrs2() })
      .then(r => r.json())
      .then(d => setPoNumber(d.poNo || 'Auto-generated'))
      .catch(() => {})
  }, [])

  const onVendorChange = e => {
    const v = vendors.find(v=>v.vendorCode===e.target.value)
    setSelVendor(v||null)
    setHdr(p=>({...p, vendorCode:e.target.value,
      paymentTerms: v?.paymentTerms||p.paymentTerms }))
  }

  const updateLine = (i,f,v) =>
    setLines(prev=>prev.map((l,idx)=>idx===i?{...l,[f]:v}:l))

  const onItemSelect = (i, code) => {
    const item = items.find(it=>it.itemCode===code)
    setLines(prev=>prev.map((l,idx)=>idx!==i?l:{
      ...l,
      itemCode:  code,
      itemName:  item?.itemName||l.itemName,
      hsnCode:   item?.hsnCode||'',   // ← HSN auto-load from master
      unit:      item?.uom||l.unit,
      rate:      parseFloat(item?.stdCost||l.rate)||0,
    }))
  }

  const addLine = () => setLines(p=>[...p,{...EMPTY_LINE}])
  const delLine = i  => setLines(p=>p.filter((_,idx)=>idx!==i))

  const calcLine = l => {
    const qty     = parseFloat(l.qty||0)
    const rate    = parseFloat(l.rate||0)
    const disc    = parseFloat(l.discount||0)
    const gstRate = parseFloat(l.gstRate||18)
    const taxable = qty*rate*(1-disc/100)
    const isIGST  = selVendor?.gstin?.slice(0,2)!=='33'
    const cgst    = isIGST?0:taxable*gstRate/200
    const sgst    = isIGST?0:taxable*gstRate/200
    const igst    = isIGST?taxable*gstRate/100:0
    return { taxable, cgst, sgst, igst,
      total: taxable+cgst+sgst+igst }
  }

  const subTotal   = lines.reduce((s,l)=>s+calcLine(l).taxable,0)
  const totalGST   = lines.reduce((s,l)=>{
    const c=calcLine(l); return s+c.cgst+c.sgst+c.igst },0)
  const addTotal   = addDeds.filter(a=>a.type==='Addition')
    .reduce((s,a)=>s+parseFloat(a.amount||0),0)
  const dedTotal   = addDeds.filter(a=>a.type==='Deduction')
    .reduce((s,a)=>s+parseFloat(a.amount||0),0)
  const grandTotal = subTotal+totalGST+addTotal-dedTotal

  const save = async (status='DRAFT') => {
    if (!hdr.vendorCode) return toast.error('Select a vendor!')
    if (!lines[0].itemName) return toast.error('Add at least one item!')
    setSaving(true)
    try {
      const payload = {
        ...hdr,
        vendorName:    selVendor?.vendorName||hdr.vendorCode,
        vendorGstin:   selVendor?.gstin||'',
        lines,
        addDeductions: addDeds,
      }
      const res  = await fetch(`${BASE_URL}/mm/po`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (status==='APPROVED') {
        await fetch(`${BASE_URL}/mm/po/${data.data.id}`,
          { method:'PATCH', headers:authHdrs(),
            body:JSON.stringify({ status:'APPROVED',
              approvedBy:'Admin' }) })
      }
      toast.success(data.message)
      nav('/mm/po')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const sectionHdr = (title, icon) => (
    <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
      padding:'8px 16px', borderRadius:'6px 6px 0 0',
      display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ fontSize:14 }}>{icon}</span>
      <span style={{ color:'#fff', fontSize:13,
        fontWeight:700, fontFamily:'Syne,sans-serif' }}>
        {title}
      </span>
    </div>
  )

  const section = (title, icon, children) => (
    <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
      overflow:'hidden', marginBottom:14 }}>
      {sectionHdr(title, icon)}
      <div style={{ padding:16, background:'#fff' }}>
        {children}
      </div>
    </div>
  )

  const grid3 = { display:'grid',
    gridTemplateColumns:'1fr 1fr 1fr', gap:12 }
  const grid2 = { display:'grid',
    gridTemplateColumns:'1fr 1fr', gap:12 }

  return (
    <div style={{ display:'flex', flexDirection:'column',
      height:'100%', overflow:'hidden' }}>

      {/* Sticky Header */}
      <div style={{ flexShrink:0, position:'sticky', top:0,
        zIndex:100, background:'#F8F4F8',
        borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
      <div className="lv-hdr">
        <div className="lv-ttl">
          New Purchase Order
          <small style={{ marginLeft:8, fontFamily:'DM Mono,monospace',
            color:'#714B67' }}>{poNumber}</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm"
            onClick={()=>nav('/mm/po')}>✕ Cancel</button>
          <button className="btn btn-s sd-bsm"
            disabled={saving} onClick={()=>save('DRAFT')}>
            💾 Save Draft
          </button>
          <button className="btn btn-p sd-bsm"
            disabled={saving} onClick={()=>save('APPROVED')}>
            {saving?'⏳ Saving...':'✅ Submit for Approval'}
          </button>
        </div>
      </div>
      </div>{/* end sticky header */}

      {/* Scrollable Content */}
      <div style={{ flex:1, overflowY:'auto',
        padding:'14px 0', paddingBottom:40 }}>

      {/* Section 1: PO Type + Basic Header */}
      {section('PO Header', '📋', (
        <>
          {/* PO Type */}
          <div style={{ display:'flex', gap:8,
            marginBottom:14, flexWrap:'wrap' }}>
            <label style={{ ...lbl, alignSelf:'center',
              whiteSpace:'nowrap' }}>PO Type:</label>
            {PO_TYPES.map(pt=>(
              <div key={pt.value}
                onClick={()=>setHdr(p=>({...p,poType:pt.value}))}
                style={{ padding:'5px 14px', borderRadius:20,
                  cursor:'pointer', fontSize:12, fontWeight:600,
                  border:`2px solid ${hdr.poType===pt.value
                    ?'#714B67':'#E0D5E0'}`,
                  background:hdr.poType===pt.value
                    ?'#714B67':'#fff',
                  color:hdr.poType===pt.value?'#fff':'#6C757D',
                  transition:'all .15s' }}>
                {pt.label}
              </div>
            ))}
          </div>

          <div style={grid3}>
            <div>
              <label style={lbl}>PO Number</label>
              <input style={{ ...inp, background:'#F8F4F8',
                color:'#714B67', fontWeight:700,
                fontFamily:'DM Mono,monospace' }}
                value={poNumber} readOnly />
            </div>
            <div>
              <label style={lbl}>PO Date *</label>
              <input type="date" style={inp} value={hdr.poDate}
                onChange={e=>setHdr(p=>({...p,
                  poDate:e.target.value}))} />
            </div>
            <div>
              <label style={lbl}>Valid To</label>
              <input type="date" style={inp} value={hdr.validTo}
                onChange={e=>setHdr(p=>({...p,
                  validTo:e.target.value}))} />
            </div>
          </div>

          <div style={{ ...grid3, marginTop:12 }}>
            <div>
              <label style={lbl}>Purchase Category</label>
              <select style={{ ...inp, cursor:'pointer' }}
                value={hdr.purchaseCategory}
                onChange={e=>setHdr(p=>({...p,
                  purchaseCategory:e.target.value}))}>
                {['Raw Material','Spares & Consumables',
                  'Packing Material','Chemicals',
                  'Capital Goods','Services','Others'].map(c=>(
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Reference / PR No.</label>
              <input style={inp} value={hdr.prNo}
                onChange={e=>setHdr(p=>({...p,
                  prNo:e.target.value}))}
                placeholder="PR-2026-0001" />
            </div>
            <div>
              <label style={lbl}>CS No.</label>
              <input style={inp} value={hdr.csNo}
                onChange={e=>setHdr(p=>({...p,
                  csNo:e.target.value}))}
                placeholder="CS-2026-0001" />
            </div>
          </div>
        </>
      ))}

      {/* Section 2: Vendor */}
      {section('Vendor Details', '🏢', (
        <>
          <div style={grid3}>
            <div>
              <label style={lbl}>Vendor *</label>
              <select style={{ ...inp, cursor:'pointer' }}
                value={hdr.vendorCode}
                onChange={onVendorChange}>
                <option value="">-- Select Vendor --</option>
                {vendors.map(v=>(
                  <option key={v.vendorCode} value={v.vendorCode}>
                    {v.vendorCode} — {v.vendorName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Vendor GSTIN</label>
              <input style={{ ...inp, background:'#F8F9FA' }}
                value={selVendor?.gstin||''} readOnly />
            </div>
            <div>
              <label style={lbl}>Payment Terms</label>
              <select style={{ ...inp, cursor:'pointer' }}
                value={hdr.paymentTerms}
                onChange={e=>setHdr(p=>({...p,
                  paymentTerms:e.target.value}))}>
                {['Net 30 Days','Net 45 Days','Net 60 Days',
                  'Advance','Against Delivery','LC',
                  '50% Advance + 50% on Delivery'].map(t=>(
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {selVendor && (
            <div style={{ marginTop:12, background:'#F8F4F8',
              borderRadius:8, padding:'10px 14px',
              display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ width:36, height:36,
                background:'#714B67', borderRadius:'50%',
                display:'flex', alignItems:'center',
                justifyContent:'center', color:'#fff',
                fontWeight:800, fontSize:13,
                flexShrink:0 }}>
                {selVendor.vendorName?.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13 }}>
                  {selVendor.vendorName}
                </div>
                <div style={{ fontSize:11, color:'#6C757D' }}>
                  {selVendor.gstin||'No GSTIN'} ·{' '}
                  {selVendor.city||''} ·{' '}
                  {selVendor.paymentTerms||''}
                </div>
              </div>
              <span style={{ padding:'3px 10px', borderRadius:8,
                fontSize:11, fontWeight:700,
                background:'#D4EDDA', color:'#155724' }}>
                Approved Vendor
              </span>
            </div>
          )}
        </>
      ))}

      {/* Section 3: Delivery */}
      {section('Delivery Details', '🚚', (
        <div style={grid3}>
          <div>
            <label style={lbl}>Expected Delivery Date</label>
            <input type="date" style={inp}
              value={hdr.deliveryDate}
              onChange={e=>setHdr(p=>({...p,
                deliveryDate:e.target.value}))} />
          </div>
          <div>
            <label style={lbl}>Delivery Location</label>
            <select style={{ ...inp, cursor:'pointer' }}
              value={hdr.deliveryLocation}
              onChange={e=>setHdr(p=>({...p,
                deliveryLocation:e.target.value}))}>
              {['Ranipet Main Store','Warehouse B',
                'Production Floor','Dispatch Area',
                'Quality Lab'].map(l=>(
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Delivery At (Supplier Address)</label>
            <div style={{ display:'flex', gap:6 }}>
              <input style={{ ...inp, flex:1, fontSize:11,
                color:'#6C757D' }}
                value={hdr.deliveryAddress
                  ? `${hdr.deliveryAddress.city||''}, ${hdr.deliveryAddress.state||''}`
                  : 'Click to select address'}
                readOnly />
              <button onClick={()=>setShowAddrPopup(true)}
                style={{ padding:'7px 12px', background:'#714B67',
                  color:'#fff', border:'none', borderRadius:5,
                  fontSize:11, cursor:'pointer',
                  whiteSpace:'nowrap' }}>
                📍 Select
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Section 4: Line Items */}
      <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
        overflow:'hidden', marginBottom:14 }}>
        {sectionHdr('Line Items', '📦')}
        <div style={{ padding:'10px 16px 0',
          display:'flex', justifyContent:'flex-end',
          background:'#fff' }}>
          <button onClick={addLine}
            style={{ padding:'4px 14px', background:'#714B67',
              color:'#fff', border:'none', borderRadius:5,
              fontSize:11, cursor:'pointer', fontWeight:600 }}>
            + Add Row
          </button>
        </div>
        <div style={{ overflowX:'auto', background:'#fff',
          padding:'8px 0' }}>
          <table style={{ width:'100%',
            borderCollapse:'collapse',
            fontSize:11, minWidth:1100 }}>
            <thead>
              <tr style={{ background:'#F8F4F8',
                borderBottom:'2px solid #E0D5E0' }}>
                {['#','Item','HSN','Spec','Qty','Unit',
                  'Rate','Disc%','Taxable','GST%',
                  'CGST','SGST','IGST','Total',''].map(h=>(
                  <th key={h} style={{ padding:'7px 8px',
                    fontSize:9, fontWeight:700, color:'#6C757D',
                    textAlign:'center', textTransform:'uppercase',
                    letterSpacing:.3, whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l,i)=>{
                const c = calcLine(l)
                return (
                  <tr key={i} style={{
                    borderBottom:'1px solid #F0EEF0',
                    background:i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'4px 6px',
                      textAlign:'center', color:'#6C757D',
                      fontWeight:700, width:28 }}>{i+1}</td>

                    {/* Item select + name */}
                    <td style={{ padding:'3px 4px', minWidth:180 }}>
                      <select style={{ width:'100%', padding:'4px 5px',
                        border:'1px solid #E0D5E0', borderRadius:4,
                        fontSize:11, cursor:'pointer',
                        marginBottom:2 }}
                        value={l.itemCode}
                        onChange={e=>onItemSelect(i,e.target.value)}>
                        <option value="">-- Select Item --</option>
                        {items.map(it=>(
                          <option key={it.itemCode}
                            value={it.itemCode}>
                            {it.itemName}
                          </option>
                        ))}
                      </select>
                      {!l.itemCode && (
                        <input style={{ width:'100%',
                          padding:'3px 5px',
                          border:'1px solid #E0D5E0',
                          borderRadius:4, fontSize:11,
                          boxSizing:'border-box' }}
                          placeholder="Or type item name"
                          value={l.itemName}
                          onChange={e=>updateLine(i,
                            'itemName',e.target.value)} />
                      )}
                    </td>

                    {/* HSN — auto from master */}
                    <td style={{ padding:'3px 4px', width:80 }}>
                      <input style={{ width:'100%',
                        padding:'4px 5px',
                        border:'1px solid #E0D5E0',
                        borderRadius:4, fontSize:11,
                        background: l.hsnCode&&l.itemCode
                          ?'#D4EDDA':'#fff',
                        boxSizing:'border-box' }}
                        value={l.hsnCode}
                        placeholder="HSN"
                        onChange={e=>updateLine(i,
                          'hsnCode',e.target.value)} />
                    </td>

                    {/* Specification */}
                    <td style={{ padding:'3px 4px',
                      minWidth:100 }}>
                      <input style={{ width:'100%',
                        padding:'4px 5px',
                        border:'1px solid #E0D5E0',
                        borderRadius:4, fontSize:11,
                        boxSizing:'border-box' }}
                        value={l.specification||''}
                        placeholder="Spec/brand"
                        onChange={e=>updateLine(i,
                          'specification',e.target.value)} />
                    </td>

                    {/* Qty */}
                    <td style={{ padding:'3px 4px', width:60 }}>
                      <input type="number" min={0}
                        style={{ width:'100%', padding:'4px 5px',
                          border:'1px solid #E0D5E0',
                          borderRadius:4, fontSize:11,
                          textAlign:'right',
                          fontFamily:'DM Mono,monospace',
                          boxSizing:'border-box' }}
                        value={l.qty}
                        onChange={e=>updateLine(i,
                          'qty',e.target.value)} />
                    </td>

                    {/* Unit */}
                    <td style={{ padding:'3px 4px', width:65 }}>
                      <select style={{ width:'100%',
                        padding:'4px 3px',
                        border:'1px solid #E0D5E0',
                        borderRadius:4, fontSize:11 }}
                        value={l.unit}
                        onChange={e=>updateLine(i,
                          'unit',e.target.value)}>
                        {['Nos','Kg','Ltr','Mtr','Box','Set',
                          'Pcs','MT','Roll','Pack','Sqft',
                          'Rmt'].map(u=>(
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </td>

                    {/* Rate */}
                    <td style={{ padding:'3px 4px', width:80 }}>
                      <input type="number" min={0}
                        style={{ width:'100%', padding:'4px 5px',
                          border:'1px solid #E0D5E0',
                          borderRadius:4, fontSize:11,
                          textAlign:'right',
                          fontFamily:'DM Mono,monospace',
                          background:'#FFFDE7',
                          boxSizing:'border-box' }}
                        value={l.rate}
                        onChange={e=>updateLine(i,
                          'rate',e.target.value)} />
                    </td>

                    {/* Disc% */}
                    <td style={{ padding:'3px 4px', width:55 }}>
                      <input type="number" min={0} max={100}
                        style={{ width:'100%', padding:'4px 5px',
                          border:'1px solid #E0D5E0',
                          borderRadius:4, fontSize:11,
                          textAlign:'right',
                          fontFamily:'DM Mono,monospace',
                          boxSizing:'border-box' }}
                        value={l.discount}
                        onChange={e=>updateLine(i,
                          'discount',e.target.value)} />
                    </td>

                    {/* Taxable */}
                    <td style={{ padding:'4px 8px',
                      textAlign:'right',
                      fontFamily:'DM Mono,monospace',
                      fontSize:11, background:'#F8F9FA',
                      color:'#1C1C1C' }}>
                      {fmtC(c.taxable)}
                    </td>

                    {/* GST% */}
                    <td style={{ padding:'3px 4px', width:60 }}>
                      <select style={{ width:'100%',
                        padding:'4px 3px',
                        border:'1px solid #E0D5E0',
                        borderRadius:4, fontSize:11 }}
                        value={l.gstRate}
                        onChange={e=>updateLine(i,
                          'gstRate',e.target.value)}>
                        {[0,5,12,18,28].map(r=>(
                          <option key={r} value={r}>{r}%</option>
                        ))}
                      </select>
                    </td>

                    {/* CGST / SGST / IGST */}
                    {[c.cgst,c.sgst,c.igst].map((v,vi)=>(
                      <td key={vi} style={{ padding:'4px 8px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        fontSize:11, color:'#E06F39',
                        background:'#FFF8F0' }}>
                        {fmtC(v)}
                      </td>
                    ))}

                    {/* Total */}
                    <td style={{ padding:'4px 8px',
                      textAlign:'right',
                      fontFamily:'DM Mono,monospace',
                      fontSize:12, fontWeight:700,
                      color:'#714B67',
                      background:'#EDE0EA' }}>
                      {fmtC(c.total)}
                    </td>

                    {/* Delete */}
                    <td style={{ padding:'3px 6px',
                      textAlign:'center', width:32 }}>
                      {lines.length>1 && (
                        <button onClick={()=>delLine(i)}
                          style={{ background:'#DC3545',
                            color:'#fff', border:'none',
                            borderRadius:4, padding:'2px 6px',
                            cursor:'pointer', fontSize:11 }}>
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Additions / Deductions */}
      <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
        overflow:'hidden', marginBottom:14 }}>
        {sectionHdr('Additions / Deductions', '⊕')}
        <div style={{ padding:16, background:'#fff' }}>
          <div style={{ display:'flex', justifyContent:'flex-end',
            marginBottom:8 }}>
            <button onClick={()=>setAddDeds(p=>[...p,
              {...EMPTY_ADD_DED}])}
              style={{ padding:'4px 14px', background:'#0C5460',
                color:'#fff', border:'none', borderRadius:5,
                fontSize:11, cursor:'pointer',
                fontWeight:600 }}>
              + Add Row
            </button>
          </div>
          {addDeds.length===0 ? (
            <div style={{ textAlign:'center', color:'#6C757D',
              fontSize:12, padding:'12px 0' }}>
              No additions or deductions
            </div>
          ) : (
            <table style={{ width:'100%',
              borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#F8F4F8' }}>
                  {['Type','Description','Amount',''].map(h=>(
                    <th key={h} style={{ padding:'7px 10px',
                      fontSize:10, fontWeight:700,
                      color:'#6C757D', textAlign:'left',
                      textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {addDeds.map((a,i)=>(
                  <tr key={i} style={{
                    borderBottom:'1px solid #F0EEF0' }}>
                    <td style={{ padding:'4px 8px', width:150 }}>
                      <select style={{ ...inp, fontSize:11 }}
                        value={a.type}
                        onChange={e=>{
                          const copy=[...addDeds]
                          copy[i]={...copy[i],type:e.target.value}
                          setAddDeds(copy)
                        }}>
                        <option>Addition</option>
                        <option>Deduction</option>
                      </select>
                    </td>
                    <td style={{ padding:'4px 8px' }}>
                      <input style={{ ...inp, fontSize:11 }}
                        placeholder="e.g. Freight, Packing, Discount"
                        value={a.description}
                        onChange={e=>{
                          const copy=[...addDeds]
                          copy[i]={...copy[i],
                            description:e.target.value}
                          setAddDeds(copy)
                        }} />
                    </td>
                    <td style={{ padding:'4px 8px', width:140 }}>
                      <input type="number" min={0}
                        style={{ ...inp, fontSize:11,
                          textAlign:'right',
                          fontFamily:'DM Mono,monospace' }}
                        value={a.amount}
                        onChange={e=>{
                          const copy=[...addDeds]
                          copy[i]={...copy[i],
                            amount:e.target.value}
                          setAddDeds(copy)
                        }} />
                    </td>
                    <td style={{ padding:'4px 8px', width:40 }}>
                      <button onClick={()=>setAddDeds(
                        p=>p.filter((_,idx)=>idx!==i))}
                        style={{ background:'#DC3545',
                          color:'#fff', border:'none',
                          borderRadius:4, padding:'3px 7px',
                          cursor:'pointer', fontSize:11 }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Section 6: Totals + Purchase Ledger */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px',
        gap:14, marginBottom:14 }}>
        {/* Purchase Ledger */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden' }}>
          {sectionHdr('Purchase Ledger', '📒')}
          <div style={{ padding:16, background:'#fff',
            display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={lbl}>Supplier Ledger</label>
              <input style={inp}
                value={selVendor?.vendorName||''}
                readOnly placeholder="Auto from vendor" />
            </div>
            <div>
              <label style={lbl}>Item-wise Purchase Ledger</label>
              {lines.map((l,i)=>(
                <div key={i} style={{ display:'flex', gap:6,
                  marginBottom:6, alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'#6C757D',
                    minWidth:100 }}>
                    {l.itemName||`Item ${i+1}`}
                  </span>
                  <select style={{ ...inp, flex:1, fontSize:11 }}>
                    <option>Purchase Account</option>
                    <option>Raw Material A/c</option>
                    <option>Consumables A/c</option>
                    <option>Capital Goods A/c</option>
                    <option>Service A/c</option>
                  </select>
                </div>
              ))}
            </div>
            <div>
              <label style={lbl}>Remarks</label>
              <textarea value={hdr.remarks}
                onChange={e=>setHdr(p=>({...p,
                  remarks:e.target.value}))}
                rows={2}
                style={{ ...inp, resize:'vertical' }}
                placeholder="Internal remarks..." />
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', alignSelf:'start' }}>
          {sectionHdr('Amount Summary', '💰')}
          <div style={{ padding:16, background:'#fff' }}>
            {[
              ['Sub Total (Taxable)', fmtC(subTotal), '#1C1C1C'],
              ['Total GST',          fmtC(totalGST),  '#E06F39'],
              ...(addDeds.filter(a=>a.type==='Addition')
                .map(a=>[`+ ${a.description||'Addition'}`,
                  fmtC(a.amount), '#0C5460'])),
              ...(addDeds.filter(a=>a.type==='Deduction')
                .map(a=>[`− ${a.description||'Deduction'}`,
                  fmtC(a.amount), '#DC3545'])),
            ].map(([l,v,c])=>(
              <div key={l} style={{ display:'flex',
                justifyContent:'space-between',
                padding:'6px 0',
                borderBottom:'1px solid #F0EEF0' }}>
                <span style={{ fontSize:12,
                  color:'#6C757D' }}>{l}</span>
                <span style={{ fontFamily:'DM Mono,monospace',
                  fontSize:13, fontWeight:600, color:c }}>
                  {v}
                </span>
              </div>
            ))}
            <div style={{ display:'flex',
              justifyContent:'space-between',
              padding:'10px 0 0',
              borderTop:'2px solid #714B67',
              marginTop:4 }}>
              <span style={{ fontSize:14, fontWeight:800,
                color:'#714B67',
                fontFamily:'Syne,sans-serif' }}>
                Grand Total
              </span>
              <span style={{ fontFamily:'DM Mono,monospace',
                fontSize:16, fontWeight:800,
                color:'#155724' }}>
                {fmtC(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 7: Terms & Conditions */}
      {section('Terms & Conditions', '📜', (
        <textarea value={hdr.termsConditions}
          onChange={e=>setHdr(p=>({...p,
            termsConditions:e.target.value}))}
          rows={6}
          style={{ ...inp, resize:'vertical',
            fontFamily:'DM Sans,sans-serif', fontSize:12 }} />
      ))}

      {/* Section 8: Other Details */}
      {section('Other Details', '🔧', (
        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(3,1fr)',
          gap:12 }}>
          <div>
            <label style={lbl}>Reverse Charge</label>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              {['Yes','No'].map(v=>(
                <label key={v} style={{ display:'flex',
                  alignItems:'center', gap:5, fontSize:12,
                  cursor:'pointer' }}>
                  <input type="radio" name="reverseCharge"
                    value={v}
                    checked={hdr.reverseCharge===v}
                    onChange={()=>setHdr(p=>({...p,
                      reverseCharge:v}))} />
                  {v}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Type of Purchase</label>
            <select style={{ ...inp, cursor:'pointer' }}
              value={hdr.purchaseType}
              onChange={e=>setHdr(p=>({...p,
                purchaseType:e.target.value}))}>
              {['Local','Interstate','Import','SEZ',
                'Deemed Export','Job Work'].map(t=>(
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Include Target</label>
            <div style={{ marginTop:6 }}>
              <label style={{ display:'flex',
                alignItems:'center', gap:8,
                cursor:'pointer', fontSize:12 }}>
                <input type="checkbox"
                  checked={hdr.includeTarget}
                  onChange={e=>setHdr(p=>({...p,
                    includeTarget:e.target.checked}))}
                  style={{ width:16, height:16 }} />
                <span>Include in Target Calculation</span>
              </label>
            </div>
          </div>
          <div>
            <label style={lbl}>Shipping Bill No.</label>
            <input style={inp} value={hdr.shippingBillNo}
              onChange={e=>setHdr(p=>({...p,
                shippingBillNo:e.target.value}))}
              placeholder="For imports only" />
          </div>
          <div>
            <label style={lbl}>Shipping Date</label>
            <input type="date" style={inp}
              value={hdr.shippingDate}
              onChange={e=>setHdr(p=>({...p,
                shippingDate:e.target.value}))} />
          </div>
          <div>
            <label style={lbl}>Bill of Entry (BoE) No.</label>
            <input style={inp} value={hdr.bobNo}
              onChange={e=>setHdr(p=>({...p,bobNo:e.target.value}))}
              placeholder="BoE number" />
          </div>
        </div>
      ))}

      </div>{/* end scrollable content */}

      {/* Supplier Address Popup */}
      {showAddrPopup && (
        <SupplierAddressPopup
          vendor={selVendor}
          onSelect={addr=>{
            setHdr(p=>({...p, deliveryAddress:addr}))
            setShowAddrPopup(false)
          }}
          onClose={()=>setShowAddrPopup(false)} />
      )}
    </div>
  )
}
