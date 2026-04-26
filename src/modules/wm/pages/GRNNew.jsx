import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken  = () => localStorage.getItem('lnv_token')
const authHdrs  = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })
const authHdrs2 = () => ({ Authorization:`Bearer ${getToken()}` })
const fmtC = n  => '₹'+Number(n||0).toLocaleString('en-IN',
  {minimumFractionDigits:2,maximumFractionDigits:2})
const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
  borderRadius:5, fontSize:12, outline:'none', width:'100%',
  boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057',
  display:'block', marginBottom:3, textTransform:'uppercase',
  letterSpacing:.3 }

// ── Movement Types (SAP-style) ────────────────────────────
const MOVEMENT_TYPES = [
  { code:'101', label:'101 — GR against Purchase Order',
    desc:'Standard PO inward', color:'#155724', bg:'#D4EDDA' },
  { code:'102', label:'102 — GR against Service PO',
    desc:'Service/Labour inward', color:'#0C5460', bg:'#D1ECF1' },
  { code:'103', label:'103 — GR Capital Goods',
    desc:'Asset/Capital inward', color:'#714B67', bg:'#EDE0EA' },
  { code:'121', label:'121 — GR without PO',
    desc:'Emergency/Direct inward (needs approval)',
    color:'#856404', bg:'#FFF3CD' },
  { code:'131', label:'131 — GR Job Work Return',
    desc:'Processed goods from subcontractor',
    color:'#495057', bg:'#E9ECEF' },
  { code:'141', label:'141 — Branch/Transfer Receipt',
    desc:'Internal transfer inward', color:'#1A1A2E', bg:'#F0F0F0' },
]

// Cost Center matrix by PO category
const CC_MAP = {
  'Raw Material':          'CC-PROD',
  'Chemicals':             'CC-TREAT',
  'Packing Material':      'CC-DISP',
  'Spares & Consumables':  'CC-MAINT',
  'Capital Goods':         'CC-CAPEX',
  'Services':              'CC-ADMIN',
  'Others':                'CC-ADMIN',
}

const LOCATIONS = [
  'Ranipet Main Store','Warehouse B',
  'Production Floor','Chemical Store',
  'Dispatch Area','QC Lab',
]

const EMPTY_LINE = {
  poLineId:'', itemCode:'', itemName:'', hsnCode:'',
  specification:'',
  orderedQty:0, dcQty:0, receivedQty:0, unit:'Nos',
  rate:0, discount:0, gstRate:18,
  taxableAmt:0, cgst:0, sgst:0, igst:0, totalAmt:0,
  batchNo:'', mfgDate:'', expiryDate:'',
  binLocation:'', costCenter:'', qcRequired:false,
  quality:'Accepted', remarks:''
}

function calcLine(l, isIGST=false) {
  const qty  = parseFloat(l.receivedQty||0)
  const rate = parseFloat(l.rate||0)
  const disc = parseFloat(l.discount||0)
  const gst  = parseFloat(l.gstRate||18)
  const taxable = qty * rate * (1 - disc/100)
  const cgst = isIGST ? 0 : taxable * gst/200
  const sgst = isIGST ? 0 : taxable * gst/200
  const igst = isIGST ? taxable * gst/100 : 0
  return {
    taxableAmt: taxable,
    cgst, sgst, igst,
    totalAmt: taxable + cgst + sgst + igst
  }
}

export default function GRNNew() {
  const nav = useNavigate()
  const [params] = useSearchParams()

  const [pos,      setPOs]     = useState([])
  const [gates,    setGates]   = useState([])
  const [grnNo,    setGrnNo]   = useState('Auto-generated')
  const [selPO,    setSelPO]   = useState(null)
  const [selGE,    setSelGE]   = useState(null)
  const [saving,   setSaving]  = useState(false)
  const [isIGST,   setIsIGST]  = useState(false)
  const [lines,    setLines]   = useState([])

  const [hdr, setHdr] = useState({
    movementType:  '101',
    grnDate:       new Date().toISOString().split('T')[0],
    poId:          '',
    poNo:          '',
    poType:        '',
    gateEntryId:   '',
    gateEntryNo:   '',
    vendorCode:    '',
    vendorName:    '',
    vendorGstin:   '',
    dcNo:          '',
    dcDate:        '',
    vehicleNo:     '',
    receivedAt:    'Ranipet Main Store',
    costCenter:    '',
    remarks:       '',
  })

  useEffect(()=>{
    fetch(`${BASE_URL}/wm/pending-pos`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setPOs(d.data||[]))
      .catch(()=>{})

    fetch(`${BASE_URL}/wm/gate-entry?status=IN`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setGates(d.data||[]))
      .catch(()=>{})

    fetch(`${BASE_URL}/wm/grn/next-no`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setGrnNo(d.grnNo||'GRN-AUTO'))
      .catch(()=>{})

    // Pre-select from URL params
    const poId = params.get('po')
    const geId = params.get('ge')
    if (poId) loadPO(parseInt(poId))
    if (geId) loadGateEntry(parseInt(geId))
  },[])

  const loadGateEntry = async (id) => {
    try {
      const ge = gates.find(g=>g.id===id) ||
        await fetch(`${BASE_URL}/wm/gate-entry`,
          { headers:authHdrs2() })
          .then(r=>r.json())
          .then(d=>(d.data||[]).find(g=>g.id===id))
      if (!ge) return
      setSelGE(ge)
      setHdr(p=>({...p,
        gateEntryId: ge.id,
        gateEntryNo: ge.gateNo,
        vehicleNo:   ge.vehicleNo||'',
        vendorCode:  ge.vendorCode||p.vendorCode,
        vendorName:  ge.vendorName||p.vendorName,
        dcNo:        ge.dcNo||p.dcNo,
      }))
      // If gate entry has PO linked
      if (ge.poId) loadPO(ge.poId)
    } catch(e){ console.error(e) }
  }

  const loadPO = async (id) => {
    try {
      const res  = await fetch(`${BASE_URL}/mm/po/${id}`,
        { headers:authHdrs2() })
      const data = await res.json()
      const po   = data.data
      if (!po) return
      setSelPO(po)

      // Auto-detect IGST (vendor state != 33)
      const vGstin = po.vendorGstin||''
      const isIG   = vGstin.slice(0,2)!=='33'
      setIsIGST(isIG)

      // Auto cost center from PO category
      const cc = CC_MAP[po.purchaseCategory]||'CC-STORE'

      // Movement type from PO type
      const movType = po.poType==='SPO'?'102'
        :po.poType==='DPO'?'121':'101'

      setHdr(p=>({...p,
        poId:         po.id,
        poNo:         po.poNo,
        poType:       po.poType||'PO',
        vendorCode:   po.vendorCode||'',
        vendorName:   po.vendorName||'',
        vendorGstin:  po.vendorGstin||'',
        costCenter:   cc,
        movementType: movType,
      }))

      // Build lines from PO lines with pricing
      const mapped = (po.lines||[]).map((l,i)=>({
        ...EMPTY_LINE,
        poLineId:   l.id,
        itemCode:   l.itemCode||'',
        itemName:   l.itemName||'',
        hsnCode:    l.hsnCode||'',
        specification: l.specification||'',
        orderedQty: parseFloat(l.qty||0),
        dcQty:      parseFloat(l.qty||0), // default DC=PO qty
        receivedQty:parseFloat(l.pendingQty||l.qty||0),
        unit:       l.unit||'Nos',
        rate:       parseFloat(l.rate||0),
        discount:   parseFloat(l.discount||0),
        gstRate:    parseFloat(l.gstRate||18),
        costCenter: cc,
        qcRequired: false,
        lineNo:     i+1,
      })).map(l=>({
        ...l, ...calcLine(l, isIG)
      }))
      setLines(mapped)
      toast.success(`PO ${po.poNo} loaded — ${mapped.length} items, Vendor: ${po.vendorName}`)
    } catch(e){ toast.error(e.message) }
  }

  const updateLine = (i, field, val) => {
    setLines(prev=>prev.map((l,idx)=>{
      if (idx!==i) return l
      const updated = { ...l, [field]:val }
      // Recalc on qty/rate/discount/gst change
      if (['receivedQty','rate','discount','gstRate'].includes(field)) {
        Object.assign(updated, calcLine(updated, isIGST))
      }
      return updated
    }))
  }

  const addLine = () => setLines(p=>[...p,
    { ...EMPTY_LINE, lineNo:p.length+1 }])
  const delLine = i => setLines(p=>p.filter((_,idx)=>idx!==i))

  // Totals
  const subTotal   = lines.reduce((s,l)=>s+parseFloat(l.taxableAmt||0),0)
  const totalCGST  = lines.reduce((s,l)=>s+parseFloat(l.cgst||0),0)
  const totalSGST  = lines.reduce((s,l)=>s+parseFloat(l.sgst||0),0)
  const totalIGST  = lines.reduce((s,l)=>s+parseFloat(l.igst||0),0)
  const totalTax   = totalCGST+totalSGST+totalIGST
  const grandTotal = subTotal+totalTax

  // 3-way match
  const poTotal  = selPO?.totalAmount||0
  const dcTotal  = lines.reduce((s,l)=>
    s+parseFloat(l.dcQty||0)*parseFloat(l.rate||0),0)
  const grnTotal = grandTotal
  const match3Way= (
    Math.abs(parseFloat(poTotal)-dcTotal)<1 &&
    Math.abs(dcTotal-grnTotal)<1
  )

  const save = async (status='DRAFT') => {
    if (!hdr.vendorName) return toast.error('Select a PO or enter vendor!')
    if (!lines.length)   return toast.error('No items to receive!')
    if (hdr.movementType==='121' && !hdr.costCenter)
      return toast.error('Cost Center required for GR without PO!')
    setSaving(true)
    try {
      const payload = {
        ...hdr,
        status,
        subTotal, totalCGST, totalSGST,
        totalIGST, totalTax, totalAmount:grandTotal,
        lines: lines.map(l=>({
          poLineId:    l.poLineId||null,
          itemCode:    l.itemCode,
          itemName:    l.itemName,
          hsnCode:     l.hsnCode,
          specification:l.specification,
          orderedQty:  parseFloat(l.orderedQty||0),
          dcQty:       parseFloat(l.dcQty||0),
          receivedQty: parseFloat(l.receivedQty||0),
          unit:        l.unit,
          rate:        parseFloat(l.rate||0),
          discount:    parseFloat(l.discount||0),
          taxableAmt:  parseFloat(l.taxableAmt||0),
          gstRate:     parseFloat(l.gstRate||18),
          cgst:        parseFloat(l.cgst||0),
          sgst:        parseFloat(l.sgst||0),
          igst:        parseFloat(l.igst||0),
          totalAmt:    parseFloat(l.totalAmt||0),
          batchNo:     l.batchNo,
          mfgDate:     l.mfgDate||null,
          expiryDate:  l.expiryDate||null,
          binLocation: l.binLocation,
          costCenter:  l.costCenter,
          qcRequired:  l.qcRequired,
          quality:     l.quality,
          remarks:     l.remarks,
        }))
      }
      const res  = await fetch(`${BASE_URL}/wm/grn`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      nav('/wm/grn')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const selMT = MOVEMENT_TYPES.find(m=>m.code===hdr.movementType)
  const sHdr  = (title, icon) => (
    <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
      padding:'8px 16px', display:'flex', gap:8, alignItems:'center' }}>
      <span>{icon}</span>
      <span style={{ color:'#fff', fontSize:13, fontWeight:700,
        fontFamily:'Syne,sans-serif' }}>{title}</span>
    </div>
  )
  const g3 = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }
  const g2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }

  return (
    <div style={{ display:'flex', flexDirection:'column',
      height:'100%', overflow:'hidden' }}>

      {/* ── Sticky Header ─────────────────────────── */}
      <div style={{ flexShrink:0, position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8', borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div>
            <div className="lv-ttl">
              Record Goods Receipt
              <span style={{ marginLeft:10,
                padding:'3px 10px', borderRadius:8, fontSize:12,
                fontWeight:700, background:selMT?.bg||'#D4EDDA',
                color:selMT?.color||'#155724' }}>
                {hdr.movementType} — {selMT?.desc}
              </span>
              <small style={{ fontFamily:'DM Mono,monospace',
                color:'#714B67', marginLeft:8 }}>{grnNo}</small>
            </div>
          </div>
          <div className="lv-acts">
            {/* Flow steps */}
            <div style={{ display:'flex', gap:0, marginRight:8 }}>
              {['GRN Entry','QC Check','Stock Posted','Invoice'].map((s,i)=>(
                <div key={s} style={{ display:'flex', alignItems:'center' }}>
                  <span style={{ padding:'3px 10px', fontSize:10,
                    fontWeight:700,
                    background:i===0?'#714B67':'#E9ECEF',
                    color:i===0?'#fff':'#6C757D',
                    borderRadius:i===0?'10px 0 0 10px'
                      :i===3?'0 10px 10px 0':'0' }}>
                    {s}
                  </span>
                  {i<3 && <span style={{ color:'#6C757D' }}>›</span>}
                </div>
              ))}
            </div>
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav('/wm/grn')}>✕ Cancel</button>
            <button className="btn btn-s sd-bsm"
              disabled={saving} onClick={()=>save('DRAFT')}>
              💾 Save Draft
            </button>
            <button className="btn btn-p sd-bsm"
              disabled={saving} onClick={()=>save('POSTED')}>
              {saving?'⏳ Posting...':'✅ Post GRN'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable Body ────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 0',
        paddingBottom:60 }}>

        {/* Movement Type Selector */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', marginBottom:14 }}>
          {sHdr('Movement Type (SAP MIGO)', '🔄')}
          <div style={{ padding:16, background:'#fff' }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {MOVEMENT_TYPES.map(mt=>(
                <div key={mt.code}
                  onClick={()=>setHdr(p=>({...p,movementType:mt.code}))}
                  style={{ padding:'8px 14px', borderRadius:8,
                    cursor:'pointer', border:`2px solid ${
                      hdr.movementType===mt.code?mt.color:'#E0D5E0'}`,
                    background:hdr.movementType===mt.code?mt.bg:'#fff',
                    transition:'all .15s', minWidth:180 }}>
                  <div style={{ fontSize:12, fontWeight:800,
                    color:hdr.movementType===mt.code?mt.color:'#6C757D' }}>
                    {mt.code}
                  </div>
                  <div style={{ fontSize:11, fontWeight:600,
                    color:hdr.movementType===mt.code?mt.color:'#495057' }}>
                    {mt.label.split('—')[1]?.trim()}
                  </div>
                  <div style={{ fontSize:10, color:'#6C757D',
                    marginTop:2 }}>
                    {mt.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Source Documents */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', marginBottom:14 }}>
          {sHdr('Source Documents', '📋')}
          <div style={{ padding:16, background:'#fff' }}>
            <div style={{ ...g3, marginBottom:12 }}>
              {/* Gate Entry Link */}
              <div>
                <label style={lbl}>Gate Entry Reference</label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={hdr.gateEntryId}
                  onChange={e=>{
                    const id=parseInt(e.target.value)
                    setHdr(p=>({...p,gateEntryId:id}))
                    if(id) loadGateEntry(id)
                  }}>
                  <option value="">-- Select Gate Entry --</option>
                  {gates.map(g=>(
                    <option key={g.id} value={g.id}>
                      {g.gateNo} · {g.vehicleNo} · {g.vendorName}
                    </option>
                  ))}
                </select>
              </div>
              {/* PO Reference */}
              <div>
                <label style={lbl}>
                  Purchase Order *
                  {hdr.poType && (
                    <span style={{ marginLeft:6, padding:'1px 6px',
                      borderRadius:4, fontSize:9, fontWeight:700,
                      background:'#D1ECF1', color:'#0C5460' }}>
                      {hdr.poType}
                    </span>
                  )}
                </label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={hdr.poId}
                  onChange={e=>{
                    if(e.target.value) loadPO(parseInt(e.target.value))
                    else { setSelPO(null); setLines([]) }
                  }}>
                  <option value="">-- Select PO --</option>
                  {pos.map(p=>(
                    <option key={p.id} value={p.id}>
                      {p.poNo} [{p.poType||'PO'}] · {p.vendorName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>GRN Date *</label>
                <input type="date" style={inp}
                  value={hdr.grnDate}
                  onChange={e=>setHdr(p=>({...p,grnDate:e.target.value}))} />
              </div>
            </div>

            <div style={{ ...g3, marginBottom:12 }}>
              <div>
                <label style={lbl}>Vendor</label>
                <input style={{ ...inp, background:'#F8F9FA',
                  fontWeight:600 }}
                  value={hdr.vendorName}
                  readOnly={!!hdr.poId}
                  onChange={e=>setHdr(p=>({...p,vendorName:e.target.value}))}
                  placeholder="Vendor name" />
              </div>
              <div>
                <label style={lbl}>Vendor GSTIN</label>
                <input style={{ ...inp, background:'#F8F9FA',
                  fontFamily:'DM Mono,monospace' }}
                  value={hdr.vendorGstin}
                  readOnly={!!hdr.poId}
                  onChange={e=>setHdr(p=>({...p,vendorGstin:e.target.value}))}
                  placeholder="GSTIN" />
              </div>
              <div>
                <label style={lbl}>Cost Center</label>
                <select style={{ ...inp, cursor:'pointer',
                  background:hdr.costCenter?'#F8F4F8':'#FFFDE7',
                  color:hdr.costCenter?'#714B67':'#856404',
                  fontWeight:700 }}
                  value={hdr.costCenter}
                  onChange={e=>setHdr(p=>({...p,costCenter:e.target.value}))}>
                  <option value="">-- Select Cost Center --</option>
                  {['CC-PROD','CC-TREAT','CC-DISP','CC-MAINT',
                    'CC-CAPEX','CC-ADMIN','CC-STORE','CC-QC',
                    'CC-HR','CC-IT'].map(cc=>(
                    <option key={cc}>{cc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={g3}>
              <div>
                <label style={lbl}>DC / Challan No.</label>
                <input style={inp} value={hdr.dcNo}
                  placeholder="Delivery Challan No."
                  onChange={e=>setHdr(p=>({...p,dcNo:e.target.value}))} />
              </div>
              <div>
                <label style={lbl}>DC Date</label>
                <input type="date" style={inp}
                  value={hdr.dcDate}
                  onChange={e=>setHdr(p=>({...p,dcDate:e.target.value}))} />
              </div>
              <div>
                <label style={lbl}>Received At (Location)</label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={hdr.receivedAt}
                  onChange={e=>setHdr(p=>({...p,receivedAt:e.target.value}))}>
                  {LOCATIONS.map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Vendor info bar */}
            {selPO && (
              <div style={{ marginTop:12, background:'#F8F4F8',
                borderRadius:8, padding:'10px 14px',
                border:'1px solid #E0D5E0',
                display:'flex', gap:12, alignItems:'center',
                flexWrap:'wrap' }}>
                <div style={{ width:36, height:36,
                  background:'#714B67', borderRadius:'50%',
                  display:'flex', alignItems:'center',
                  justifyContent:'center', color:'#fff',
                  fontWeight:800, fontSize:13, flexShrink:0 }}>
                  {selPO.vendorName?.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>
                    {selPO.vendorName}
                  </div>
                  <div style={{ fontSize:11, color:'#6C757D' }}>
                    {selPO.vendorGstin||'No GSTIN'} ·
                    PO Date: {new Date(selPO.poDate)
                      .toLocaleDateString('en-IN')} ·
                    PO Value: {fmtC(selPO.totalAmount)} ·
                    Category: {selPO.purchaseCategory}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8,
                  flexWrap:'wrap' }}>
                  <span style={{ padding:'3px 10px',
                    borderRadius:8, fontSize:11, fontWeight:700,
                    background:'#D1ECF1', color:'#0C5460' }}>
                    {isIGST?'IGST':'CGST+SGST'} Applied
                  </span>
                  {selGE && (
                    <span style={{ padding:'3px 10px',
                      borderRadius:8, fontSize:11, fontWeight:700,
                      background:'#D4EDDA', color:'#155724' }}>
                      🚛 Gate Entry: {selGE.gateNo}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Gate Entry info bar */}
            {selGE && (
              <div style={{ marginTop:8, background:'#F0FFF4',
                borderRadius:8, padding:'8px 14px',
                border:'1px solid #C3E6CB',
                display:'flex', gap:12, alignItems:'center',
                fontSize:12 }}>
                <span style={{ fontSize:16 }}>🚛</span>
                <span>
                  <strong>{selGE.vehicleNo}</strong> ·
                  Driver: {selGE.driverName||'—'} ·
                  DC: {selGE.dcNo||'—'} ·
                  Entry: {selGE.entryTime||'—'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', marginBottom:14 }}>
          {sHdr('Line Items — Price & Tax Details', '📦')}
          <div style={{ padding:'8px 16px', background:'#fff',
            display:'flex', justifyContent:'space-between',
            alignItems:'center' }}>
            <div style={{ fontSize:12, color:'#6C757D' }}>
              {selPO
                ? `${lines.length} item(s) loaded from PO ${hdr.poNo}`
                : 'Select a PO to auto-load items'}
            </div>
            <button onClick={addLine}
              style={{ padding:'4px 14px', background:'#714B67',
                color:'#fff', border:'none', borderRadius:5,
                fontSize:11, cursor:'pointer', fontWeight:600 }}>
              + Add Row
            </button>
          </div>
          <div style={{ overflowX:'auto', background:'#fff' }}>
            <table style={{ width:'100%',
              borderCollapse:'collapse', fontSize:11,
              minWidth:1400 }}>
              <thead style={{ background:'#F8F4F8' }}>
                <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                  {['#','Item','HSN',
                    'PO Qty','DC Qty','GRN Qty','Unit',
                    'Rate','Disc%','Taxable',
                    'GST%','CGST','SGST','IGST','Total',
                    'Batch','Expiry','Bin','CC','QC',''].map(h=>(
                    <th key={h} style={{ padding:'6px 8px',
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
                  const isDCMismatch = Math.abs(
                    parseFloat(l.dcQty||0) -
                    parseFloat(l.orderedQty||0)) > 0.01
                  const isGRNMismatch = Math.abs(
                    parseFloat(l.receivedQty||0) -
                    parseFloat(l.dcQty||0)) > 0.01
                  return (
                    <tr key={i} style={{
                      borderBottom:'1px solid #F0EEF0',
                      background:i%2===0?'#fff':'#FDFBFD' }}>
                      {/* # */}
                      <td style={{ padding:'4px 6px',
                        textAlign:'center', color:'#6C757D',
                        fontWeight:700 }}>{i+1}</td>

                      {/* Item */}
                      <td style={{ padding:'3px 4px', minWidth:160 }}>
                        <div style={{ fontWeight:600, fontSize:11,
                          color:'#1C1C1C' }}>
                          {l.itemName||'—'}
                        </div>
                        {l.itemCode && (
                          <div style={{ fontSize:9,
                            color:'#714B67',
                            fontFamily:'DM Mono,monospace' }}>
                            {l.itemCode}
                          </div>
                        )}
                      </td>

                      {/* HSN */}
                      <td style={{ padding:'3px 4px', width:65 }}>
                        <input style={{ width:'100%',
                          padding:'3px 5px',
                          border:'1px solid #E0D5E0',
                          borderRadius:4, fontSize:10,
                          fontFamily:'DM Mono,monospace',
                          boxSizing:'border-box' }}
                          value={l.hsnCode||''}
                          placeholder="HSN"
                          onChange={e=>updateLine(i,'hsnCode',
                            e.target.value)} />
                      </td>

                      {/* PO Qty */}
                      <td style={{ padding:'4px 6px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        color:'#6C757D',
                        background:'#F8F9FA' }}>
                        {parseFloat(l.orderedQty||0)}
                      </td>

                      {/* DC Qty */}
                      <td style={{ padding:'3px 4px', width:60 }}>
                        <input type="number" min={0}
                          style={{ width:'100%', padding:'3px 5px',
                            border:`1px solid ${isDCMismatch
                              ?'#FFC107':'#E0D5E0'}`,
                            borderRadius:4, fontSize:10,
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            background:isDCMismatch?'#FFFDE7':'#fff',
                            boxSizing:'border-box' }}
                          value={l.dcQty}
                          onChange={e=>updateLine(i,'dcQty',
                            e.target.value)} />
                      </td>

                      {/* GRN Qty */}
                      <td style={{ padding:'3px 4px', width:60 }}>
                        <input type="number" min={0}
                          style={{ width:'100%', padding:'3px 5px',
                            border:`1px solid ${isGRNMismatch
                              ?'#FFC107':'#E0D5E0'}`,
                            borderRadius:4, fontSize:10,
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            background:'#FFFDE7',
                            boxSizing:'border-box' }}
                          value={l.receivedQty}
                          onChange={e=>updateLine(i,'receivedQty',
                            e.target.value)} />
                      </td>

                      {/* Unit */}
                      <td style={{ padding:'4px 6px',
                        textAlign:'center' }}>{l.unit}</td>

                      {/* Rate */}
                      <td style={{ padding:'4px 8px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        background:'#F8F9FA' }}>
                        {fmtC(l.rate)}
                      </td>

                      {/* Disc% */}
                      <td style={{ padding:'3px 4px', width:50 }}>
                        <input type="number" min={0} max={100}
                          style={{ width:'100%', padding:'3px 5px',
                            border:'1px solid #E0D5E0',
                            borderRadius:4, fontSize:10,
                            textAlign:'right',
                            boxSizing:'border-box' }}
                          value={l.discount}
                          onChange={e=>updateLine(i,'discount',
                            e.target.value)} />
                      </td>

                      {/* Taxable */}
                      <td style={{ padding:'4px 8px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        background:'#F8F9FA', fontWeight:700 }}>
                        {fmtC(l.taxableAmt)}
                      </td>

                      {/* GST% */}
                      <td style={{ padding:'3px 4px', width:55 }}>
                        <select style={{ width:'100%',
                          padding:'3px 4px',
                          border:'1px solid #E0D5E0',
                          borderRadius:4, fontSize:10 }}
                          value={l.gstRate}
                          onChange={e=>updateLine(i,'gstRate',
                            e.target.value)}>
                          {[0,5,12,18,28].map(r=>(
                            <option key={r} value={r}>{r}%</option>
                          ))}
                        </select>
                      </td>

                      {/* CGST/SGST/IGST */}
                      {[l.cgst,l.sgst,l.igst].map((v,vi)=>(
                        <td key={vi} style={{ padding:'4px 8px',
                          textAlign:'right',
                          fontFamily:'DM Mono,monospace',
                          color:'#E06F39', fontSize:10,
                          background:'#FFF8F0' }}>
                          {v>0?fmtC(v):'—'}
                        </td>
                      ))}

                      {/* Total */}
                      <td style={{ padding:'4px 8px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        fontWeight:800, color:'#714B67',
                        background:'#EDE0EA' }}>
                        {fmtC(l.totalAmt)}
                      </td>

                      {/* Batch */}
                      <td style={{ padding:'3px 4px', width:90 }}>
                        <input style={{ width:'100%',
                          padding:'3px 5px',
                          border:'1px solid #E0D5E0',
                          borderRadius:4, fontSize:10,
                          boxSizing:'border-box' }}
                          value={l.batchNo||''}
                          placeholder="Batch No."
                          onChange={e=>updateLine(i,'batchNo',
                            e.target.value)} />
                      </td>

                      {/* Expiry */}
                      <td style={{ padding:'3px 4px', width:100 }}>
                        <input type="date"
                          style={{ width:'100%', padding:'3px 4px',
                            border:'1px solid #E0D5E0',
                            borderRadius:4, fontSize:10,
                            boxSizing:'border-box' }}
                          value={l.expiryDate||''}
                          onChange={e=>updateLine(i,'expiryDate',
                            e.target.value)} />
                      </td>

                      {/* Bin */}
                      <td style={{ padding:'3px 4px', width:80 }}>
                        <input style={{ width:'100%',
                          padding:'3px 5px',
                          border:'1px solid #E0D5E0',
                          borderRadius:4, fontSize:10,
                          boxSizing:'border-box' }}
                          value={l.binLocation||''}
                          placeholder="BIN-A01"
                          onChange={e=>updateLine(i,'binLocation',
                            e.target.value)} />
                      </td>

                      {/* Cost Center */}
                      <td style={{ padding:'3px 4px', width:90 }}>
                        <select style={{ width:'100%',
                          padding:'3px 4px',
                          border:'1px solid #E0D5E0',
                          borderRadius:4, fontSize:9 }}
                          value={l.costCenter||hdr.costCenter||''}
                          onChange={e=>updateLine(i,'costCenter',
                            e.target.value)}>
                          <option value="">—</option>
                          {['CC-PROD','CC-TREAT','CC-DISP',
                            'CC-MAINT','CC-CAPEX','CC-ADMIN',
                            'CC-STORE','CC-QC'].map(cc=>(
                            <option key={cc}>{cc}</option>
                          ))}
                        </select>
                      </td>

                      {/* QC Required */}
                      <td style={{ padding:'4px 6px',
                        textAlign:'center' }}>
                        <input type="checkbox"
                          checked={l.qcRequired||false}
                          onChange={e=>updateLine(i,'qcRequired',
                            e.target.checked)} />
                      </td>

                      {/* Delete */}
                      <td style={{ padding:'3px 6px',
                        textAlign:'center' }}>
                        <button onClick={()=>delLine(i)}
                          style={{ background:'#DC3545',
                            color:'#fff', border:'none',
                            borderRadius:4, padding:'2px 6px',
                            cursor:'pointer', fontSize:10 }}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {lines.length===0 && (
            <div style={{ padding:30, textAlign:'center',
              color:'#6C757D', fontSize:12,
              background:'#fff' }}>
              Select a PO above to auto-load items with pricing
            </div>
          )}
        </div>

        {/* Totals + 3-Way Match */}
        <div style={{ display:'grid',
          gridTemplateColumns:'1fr 360px',
          gap:14, marginBottom:14 }}>

          {/* 3-Way Match */}
          <div style={{ border:'1px solid #E0D5E0',
            borderRadius:8, overflow:'hidden' }}>
            {sHdr('3-Way Match Verification', '🔍')}
            <div style={{ padding:16, background:'#fff' }}>
              <div style={{ display:'grid',
                gridTemplateColumns:'1fr 1fr 1fr',
                gap:12, marginBottom:12 }}>
                {[
                  ['PO Amount',  parseFloat(poTotal),  '📋'],
                  ['DC Amount',  dcTotal,               '📄'],
                  ['GRN Amount', grnTotal,              '📦'],
                ].map(([l,v,ic])=>(
                  <div key={l} style={{ background:'#F8F7FA',
                    borderRadius:8, padding:'10px 14px',
                    border:'1px solid #E0D5E0',
                    textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'#6C757D',
                      marginBottom:4 }}>{ic} {l}</div>
                    <div style={{ fontFamily:'DM Mono,monospace',
                      fontSize:15, fontWeight:800,
                      color:'#714B67' }}>
                      {fmtC(v)}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:match3Way?'#D4EDDA':'#FFF3CD',
                borderRadius:8, padding:'10px 14px',
                display:'flex', gap:10, alignItems:'center',
                border:`1px solid ${match3Way?'#C3E6CB':'#FFE69C'}` }}>
                <span style={{ fontSize:20 }}>
                  {match3Way?'✅':'⚠️'}
                </span>
                <div>
                  <div style={{ fontWeight:700, fontSize:13,
                    color:match3Way?'#155724':'#856404' }}>
                    {match3Way
                      ?'3-Way Match: PO ✅ DC ✅ GRN ✅'
                      :'Quantity/Amount Variance Detected!'}
                  </div>
                  <div style={{ fontSize:11, color:'#6C757D' }}>
                    {match3Way
                      ?'All three match — proceed to post GRN'
                      :'Review DC Qty and GRN Qty before posting'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop:12 }}>
                <label style={lbl}>Remarks</label>
                <textarea value={hdr.remarks}
                  onChange={e=>setHdr(p=>({...p,remarks:e.target.value}))}
                  rows={2} style={{ ...inp, resize:'vertical' }}
                  placeholder="Any notes about this GRN..." />
              </div>
            </div>
          </div>

          {/* Amount Summary */}
          <div style={{ border:'1px solid #E0D5E0',
            borderRadius:8, overflow:'hidden',
            alignSelf:'start' }}>
            {sHdr('Amount Summary', '💰')}
            <div style={{ padding:16, background:'#fff' }}>
              {[
                ['Sub Total (Taxable)', fmtC(subTotal),  '#1C1C1C'],
                ['Total CGST',         fmtC(totalCGST),  '#E06F39'],
                ['Total SGST',         fmtC(totalSGST),  '#E06F39'],
                ['Total IGST',         fmtC(totalIGST),  '#E06F39'],
                ['Total Tax',          fmtC(totalTax),   '#714B67'],
              ].map(([l,v,c])=>(
                <div key={l} style={{ display:'flex',
                  justifyContent:'space-between', padding:'5px 0',
                  borderBottom:'1px solid #F0EEF0',
                  fontSize:12 }}>
                  <span style={{ color:'#6C757D' }}>{l}</span>
                  <span style={{ fontFamily:'DM Mono,monospace',
                    color:c, fontWeight:600 }}>{v}</span>
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
              <div style={{ marginTop:10,
                background:isIGST?'#EDE0EA':'#D4EDDA',
                borderRadius:6, padding:'6px 10px',
                fontSize:11, fontWeight:600,
                color:isIGST?'#714B67':'#155724',
                textAlign:'center' }}>
                {isIGST?'IGST Applied (Interstate)':
                  'CGST + SGST Applied (Intrastate)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
