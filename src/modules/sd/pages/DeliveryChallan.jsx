import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:0 })
const fmtD = s => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

const ST = {
  OPEN:       { bg:'#CCE5FF', c:'#004085' },
  IN_TRANSIT: { bg:'#FFF3CD', c:'#856404' },
  DELIVERED:  { bg:'#D4EDDA', c:'#155724' },
  CLOSED:     { bg:'#E2E3E5', c:'#383D41' },
  CANCELLED:  { bg:'#F8D7DA', c:'#721C24' },
}

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const BLANK_LINE = { itemCode:'', itemName:'', qty:'', unit:'Nos', description:'' }
const BLANK = {
  dcType:'outward', dcDate: new Date().toISOString().slice(0,10),
  customerId:'', customerName:'', customerGstin:'',
  billToAddress:'', shipToAddress:'', sameAddress: true,
  purpose:'Sales', vehicleNo:'', driverName:'', driverPhone:'',
  payTerms:'', soRef:'', soId:'', ewbNo:'', remarks:'',
  termsConditions: `1. Goods once sold will not be taken back.
2. All disputes subject to local jurisdiction.
3. E&OE (Errors and Omissions Excepted).
4. Payment due as per agreed terms.`,
  lines:[{ ...BLANK_LINE }]
}

export default function DeliveryChallan() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const [view,       setView]      = useState('list') // list | new | detail
  const [challans,   setChallans]  = useState([])
  const [loading,    setLoading]   = useState(true)
  const [saving,     setSaving]    = useState(false)
  const [form,       setForm]      = useState(BLANK)
  const [selected,   setSelected]  = useState(null)
  const [customers,  setCustomers] = useState([])
  const [openSOs,    setOpenSOs]   = useState([])
  const [fgItems,    setFgItems]   = useState([])
  const [shipAddresses, setShipAddresses] = useState([])
  const [fgStock,       setFgStock]       = useState({})
  const pendingEdit  = React.useRef(null) // store DC for edit
  const editFormRef  = React.useRef(null) // store full form for edit // itemCode → available qty
  const [soPendingQty,  setSoPendingQty]  = useState({}) // itemCode → pending qty from SO
  const [dcNo,       setDcNo]      = useState('Auto-generated')
  const [search,     setSearch]    = useState('')

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/sd/delivery-challan`, { headers: hdr2() })
      const d = await r.json()
      setChallans(d.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadList()
    // Load masters
    Promise.all([
      fetch(`${BASE}/sd/customers`, { headers: hdr2() }).then(r=>r.json()),
      fetch(`${BASE}/sd/orders?status=CONFIRMED,PROCESSING`, { headers: hdr2() }).then(r=>r.json()),
      fetch(`${BASE}/mdm/items`, { headers: hdr2() }).then(r=>r.json()),
      fetch(`${BASE}/sd/delivery-challan/next-no`, { headers: hdr2() }).then(r=>r.json()),
      fetch(`${BASE}/wm/stock?location=FG-STORE`, { headers: hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
    ]).then(([cD, soD, itD, noD, stD]) => {
      // Build FG stock map
      const stockMap = {}
      ;(stD.data||[]).forEach(s => {
        if (s.itemCode) stockMap[s.itemCode] = parseFloat(s.balanceQty||0)
      })
      setFgStock(stockMap)
      const custs = cD.data || []
      setCustomers(custs)
      // Apply pending edit if customers just loaded
      if (pendingEdit.current) {
        const dc = pendingEdit.current
        pendingEdit.current = null
        const cust = custs.find(c => String(c.id||c.customerId) === String(dc.customerId))
        if (cust) {
          let shipAddrs = []
          try {
            const raw = cust.shipToAddresses
            if (raw) shipAddrs = typeof raw === 'string' ? JSON.parse(raw) : raw
          } catch {}
          setShipAddresses(shipAddrs)
        }
        setView('new')
      }
      setOpenSOs(soD.data || [])
      setFgItems((itD.data||[]).filter(i => ['FG','SFG'].includes((i.itemType||'').toUpperCase())))
      setDcNo(noD.dcNo || 'Auto')
    }).catch(() => {})

    // Pre-fill from SO if navigated from SO
    const soId = searchParams.get('soId')
    const soNo = searchParams.get('soNo')
    if (soId || soNo) {
      setView('new')
      setForm(f => ({ ...f, soId: soId||'', soRef: soNo||'' }))
      if (soId) {
        fetch(`${BASE}/sd/orders/${soId}`, { headers: hdr2() })
          .then(r=>r.json())
          .then(d => {
            const so = d.data
            if (!so) return
            setForm(f => ({
              ...f,
              soId:          String(so.id),
              soRef:         so.soNo,
              customerId:    String(so.customerId||''),
              customerName:  so.customerName || '',
              customerGstin: so.customerGstin || '',
              lines: (so.lines||[]).map(l => ({
                itemCode: l.itemCode||'',
                itemName: l.itemName||l.description||'',
                qty:      String(parseFloat(l.qty||0)),
                unit:     l.unit||'Nos',
                description: l.description||'',
              }))
            }))
          }).catch(()=>{})
      }
    }
  }, [])

  const onCustomerChange = id => {
    const cust = customers.find(c => String(c.id||c.customerId) === id)
    if (!cust) return
    const addr = [cust.address, cust.city, cust.state, cust.pincode]
      .filter(Boolean).join(', ')
    // Parse multiple ship-to addresses
    let shipAddrs = []
    try {
      const raw = cust.shipToAddresses
      if (raw) {
        shipAddrs = typeof raw === 'string' ? JSON.parse(raw) : raw
      }
    } catch {}
    setShipAddresses(shipAddrs)

    setForm(f => ({
      ...f,
      customerId:      id,
      customerName:    cust.customerName || cust.name || '',
      customerGstin:   cust.gstin || '',
      billToAddress:   addr,
      shipToAddress:   addr, // default same as bill to
      sameAddress:     true,
      payTerms:        cust.paymentTerms || cust.payTerms || '',
    }))
  }

  const onSOChange = async id => {
    if (!id) { setForm(f => ({ ...f, soId:'', soRef:'' })); return }
    const so = openSOs.find(s => String(s.id) === id)
    if (!so) return

    // Fetch full SO details to get lines with itemCode
    let soLines = so.lines || []
    try {
      const r = await fetch(`${BASE}/sd/orders/${id}`, { headers: hdr2() })
      const d = await r.json()
      const so = d.data
      // SO lines can be in 'lines' (relation) or 'lineItems' (JSON field)
      if (so?.lines?.length > 0) {
        soLines = so.lines
      } else if (so?.lineItems) {
        soLines = typeof so.lineItems === 'string'
          ? JSON.parse(so.lineItems) : so.lineItems
      }
    } catch(e) { console.log('SO fetch error:', e.message) }

    // Auto-fill customer if not already selected
    const cust = customers.find(c => String(c.id||c.customerId) === String(so.customerId))
    const addr = cust ? [cust.address, cust.city, cust.state, cust.pincode]
      .filter(Boolean).join(', ') : ''

    // Calculate pending qty = ordered - already dispatched in other DCs
    const pendingMap = {}
    let totalDispatched = 0
    try {
      const dcRes = await fetch(`${BASE}/sd/delivery-challan?soRef=${so.soNo}`, { headers: hdr2() })
      const dcData = await dcRes.json()
      const existingDCs = (dcData.data||[]).filter(d => d.status !== 'CANCELLED')
      existingDCs.forEach(dc => {
        const dcLines = Array.isArray(dc.lines) ? dc.lines : JSON.parse(dc.lines||'[]')
        dcLines.forEach(l => {
          if (l.itemCode) {
            pendingMap[l.itemCode] = (pendingMap[l.itemCode]||0) + parseFloat(l.qty||0)
            totalDispatched += parseFloat(l.qty||0)
          }
        })
      })
    } catch {}
    setSoPendingQty(pendingMap)

    const mappedLines = soLines.length > 0 ? soLines.map(l => {
      const orderedQty   = parseFloat(l.qty||0)
      const dispatchedQty= pendingMap[l.itemCode] || 0
      const pendingQty   = Math.max(0, orderedQty - dispatchedQty)
      const stockAvail   = fgStock[l.itemCode] || 0
      const maxQty       = Math.min(pendingQty, stockAvail)
      return {
        itemCode:     l.itemCode || '',
        itemName:     l.itemName || l.description || '',
        qty:          String(maxQty > 0 ? maxQty : pendingQty),
        unit:         l.unit || 'Nos',
        description:  l.description || '',
        _orderedQty:  orderedQty,
        _dispatchedQty: dispatchedQty,
        _pendingQty:  pendingQty,
        _stockAvail:  stockAvail,
      }
    }) : f.lines

    setForm(f => ({
      ...f,
      soId:          String(so.id),
      soRef:         so.soNo,
      customerId:    String(so.customerId||''),
      customerName:  so.customerName || f.customerName,
      customerGstin: so.customerGstin || cust?.gstin || f.customerGstin,
      billToAddress: addr || f.billToAddress,
      shipToAddress: addr || f.shipToAddress,
      payTerms:      so.paymentTerms || cust?.paymentTerms || f.payTerms,
      lines:         mappedLines
    }))
    toast.success(`SO ${so.soNo} loaded — ${soLines.length} items`)
  }

  const updLine = (i, patch) => setForm(f => {
    const lines = [...f.lines]
    lines[i] = { ...lines[i], ...patch }
    return { ...f, lines }
  })

  const addLine   = () => setForm(f => ({ ...f, lines:[...f.lines, { ...BLANK_LINE }] }))
  const delLine   = i  => setForm(f => ({ ...f, lines:f.lines.filter((_,j)=>j!==i) }))

  const saveDC = async () => {
    if (!form.customerName) return toast.error('Select a customer!')
    if (!form.lines.some(l => l.itemName && parseFloat(l.qty||0) > 0))
      return toast.error('Add at least one line with qty!')

    // Validate each line — only for new DCs (not edits)
    if (!form._editId) {
      for (const l of form.lines) {
        if (!l.itemName || !parseFloat(l.qty||0)) continue
        const qty = parseFloat(l.qty)
        if (l._pendingQty !== undefined && qty > l._pendingQty)
          return toast.error(`${l.itemName}: Max ${l._pendingQty} (SO pending)`)
        const avail = fgStock[l.itemCode] || 0
        if (l.itemCode && avail < qty)
          return toast.error(`${l.itemName}: FG Stock only ${avail} available`)
      }
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        lines: form.lines.filter(l => l.itemName && parseFloat(l.qty||0) > 0)
      }
      // Remove internal helper fields
      delete payload._editId
      payload.lines = payload.lines.map(l => {
        const clean = { ...l }
        delete clean._orderedQty; delete clean._dispatchedQty
        delete clean._pendingQty; delete clean._stockAvail
        return clean
      })

      const isEdit = !!form._editId
      const url    = isEdit ? `${BASE}/sd/delivery-challan/${form._editId}` : `${BASE}/sd/delivery-challan`
      const method = isEdit ? 'PUT' : 'POST'

      const r = await fetch(url, { method, headers: hdr(), body: JSON.stringify(payload) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(isEdit ? `${d.data?.dcNo} updated!` : `${d.data?.dcNo} created!`)
      loadList()
      setView('list')
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const postPGI = async (dc) => {
    if (!window.confirm(`Post Goods Issue for ${dc.dcNo}?\nThis will deduct FG stock and cannot be undone.`)) return
    try {
      const r = await fetch(`${BASE}/sd/delivery-challan/${dc.id}/pgi`, {
        method:'POST', headers: hdr()
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(d.message)
      loadList()
    } catch(e) { toast.error(e.message) }
  }

  const editDC = (dc) => {
    const lines = Array.isArray(dc.lines) ? dc.lines : JSON.parse(dc.lines||'[]')

    // Load ship addresses for this customer
    const cust = customers.find(c => String(c.id||c.customerId) === String(dc.customerId))
    if (cust) {
      let shipAddrs = []
      try {
        const raw = cust.shipToAddresses
        if (raw) shipAddrs = typeof raw === 'string' ? JSON.parse(raw) : raw
      } catch {}
      setShipAddresses(shipAddrs)
    }

    const editForm = {
      ...BLANK,
      dcType:          dc.dcType        || 'outward',
      dcDate:          dc.dcDate ? new Date(dc.dcDate).toISOString().slice(0,10) : BLANK.dcDate,
      customerId:      String(dc.customerId || ''),
      customerName:    dc.customerName  || '',
      customerGstin:   dc.customerGstin || '',
      billToAddress:   dc.billToAddress || '',
      shipToAddress:   dc.shipToAddress || dc.billToAddress || '',
      sameAddress:     dc.sameAddress !== false,
      purpose:         dc.purpose       || 'Sales',
      vehicleNo:       dc.vehicleNo     || '',
      driverName:      dc.driverName    || '',
      driverPhone:     dc.driverPhone   || '',
      soRef:           dc.soRef         || '',
      soId:            String(dc.soId   || ''),
      ewbNo:           dc.ewbNo         || '',
      payTerms:        dc.payTerms      || '',
      remarks:         dc.remarks       || '',
      termsConditions: dc.termsConditions || BLANK.termsConditions,
      lines:           lines.length > 0 ? lines : [{ ...BLANK_LINE }],
      _editId:         dc.id,
    }
    editFormRef.current = editForm
    setForm(editForm)
    setView('new')

    // Force re-apply after customers are rendered in DOM
    setTimeout(() => {
      setForm(prev => ({
        ...prev,
        customerId: editForm.customerId,
        soId:       editForm.soId,
      }))
    }, 100)
  }

  const deleteDC = async (dc) => {
    if (dc.pgiPosted) {
      return toast.error('Cannot delete — PGI already posted. Use Cancel instead.')
    }
    if (!window.confirm(`Delete ${dc.dcNo}? This cannot be undone.`)) return
    try {
      const r = await fetch(`${BASE}/sd/delivery-challan/${dc.id}`, {
        method:'DELETE', headers: hdr2()
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(`${dc.dcNo} deleted`)
      loadList()
      if (view === 'detail') setView('list')
    } catch(e) { toast.error(e.message) }
  }

  const cancelDC = async (dc) => {
    if (!window.confirm(`Cancel ${dc.dcNo}?
This will reverse the PGI and restore FG stock.`)) return
    try {
      const r = await fetch(`${BASE}/sd/delivery-challan/${dc.id}/cancel`, {
        method:'POST', headers: hdr()
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(d.message)
      loadList()
      if (view === 'detail') setView('list')
    } catch(e) { toast.error(e.message) }
  }

  const createInvoice = (dc) => {
    nav(`/sd/invoices/new?dcId=${dc.id}&dcNo=${dc.dcNo}&soId=${dc.soId||''}&soNo=${dc.soRef||''}&customerId=${dc.customerId||''}&customerName=${encodeURIComponent(dc.customerName||'')}`)
  }

  const filtered = challans.filter(dc =>
    !search ||
    dc.dcNo?.toLowerCase().includes(search.toLowerCase()) ||
    dc.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    dc.soRef?.toLowerCase().includes(search.toLowerCase())
  )

  // ── LIST VIEW ────────────────────────────────────────────────────
  if (view === 'list') return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          Delivery Challans <small>VL01N · {filtered.length} records</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={loadList}>↻</button>
          <button className="btn btn-p sd-bsm" onClick={() => { setForm(BLANK); setView('new') }}>
            + New Challan
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
        {[
          ['Total',       challans.length,                                          '#714B67','#EDE0EA'],
          ['Open',        challans.filter(d=>d.status==='OPEN').length,             '#004085','#CCE5FF'],
          ['In Transit',  challans.filter(d=>d.status==='IN_TRANSIT').length,       '#856404','#FFF3CD'],
          ['Delivered',   challans.filter(d=>d.status==='DELIVERED').length,        '#155724','#D4EDDA'],
        ].map(([l,v,c,bg]) => (
          <div key={l} style={{ background:bg, borderRadius:8,
            padding:'10px 14px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:c, fontFamily:'DM Mono,monospace' }}>{v}</div>
            <div style={{ fontSize:10, fontWeight:700, color:c, opacity:.8 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom:10 }}>
        <input style={{ ...inp, width:280 }}
          placeholder="Search DC#, customer, SO..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="dc">
        <table className="sd-tbl">
          <thead><tr>
            <th>DC NUMBER</th><th>DATE</th><th>CUSTOMER</th>
            <th>SO REF</th><th>VEHICLE</th><th>PAY TERMS</th>
            <th>E-WAY BILL</th><th>STATUS</th>
            <th>PGI</th><th>ACTIONS</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ padding:40, textAlign:'center', color:'#6C757D' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ padding:60, textAlign:'center', color:'#6C757D' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🚚</div>
                No delivery challans yet
                <button className="btn-xs pri" style={{ marginLeft:8 }}
                  onClick={() => { setForm(BLANK); setView('new') }}>
                  + Create Challan
                </button>
              </td></tr>
            ) : filtered.map(dc => {
              const st = ST[dc.status] || ST.OPEN
              return (
                <tr key={dc.id} style={{ cursor:'pointer' }}
                  onClick={() => { setSelected(dc); setView('detail') }}>
                  <td>
                    <strong style={{ color:'#714B67', fontFamily:'DM Mono,monospace', fontSize:11 }}>
                      {dc.dcNo}
                    </strong>
                  </td>
                  <td style={{ fontSize:11, color:'#6C757D' }}>{fmtD(dc.dcDate||dc.createdAt)}</td>
                  <td><strong style={{ fontSize:12 }}>{dc.customerName}</strong></td>
                  <td style={{ fontSize:11, color:'#6C757D', fontFamily:'DM Mono,monospace' }}>
                    {dc.soRef || '—'}
                  </td>
                  <td style={{ fontSize:11 }}>{dc.vehicleNo || '—'}</td>
                  <td style={{ fontSize:11, color:'#6C757D' }}>{dc.payTerms || '—'}</td>
                  <td style={{ fontSize:11 }}>
                    {dc.ewbNo
                      ? <span style={{ color:'#155724', fontWeight:700, fontFamily:'DM Mono,monospace', fontSize:10 }}>{dc.ewbNo}</span>
                      : <span style={{ color:'#6C757D', fontSize:10 }}>—</span>
                    }
                  </td>
                  <td>
                    <span style={{ background:st.bg, color:st.c,
                      padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>
                      {dc.status}
                    </span>
                  </td>
                  <td>
                    {dc.pgiPosted
                      ? <span style={{ color:'#155724', fontWeight:700, fontSize:11 }}>✅ Done</span>
                      : <span style={{ color:'#856404', fontSize:11 }}>⏳ Pending</span>}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn-xs"
                        onClick={() => { setSelected(dc); setView('detail') }}>View</button>
                      <button className="btn-xs"
                        onClick={() => nav(`/sd/delivery-challan/${dc.id}/print`)}>🖨️</button>
                      {!dc.pgiPosted && dc.status !== 'CANCELLED' && (
                        <button className="btn-xs"
                          onClick={e=>{e.stopPropagation();editDC(dc)}}>✏️</button>
                      )}
                      {!dc.pgiPosted && dc.status !== 'CANCELLED' && (
                        <button className="btn-xs"
                          style={{background:'#F8D7DA',color:'#721C24',border:'none'}}
                          onClick={e=>{e.stopPropagation();deleteDC(dc)}}>🗑</button>
                      )}
                      {dc.pgiPosted && dc.status !== 'CANCELLED' && (
                        <button className="btn-xs"
                          style={{background:'#FFF3CD',color:'#856404',border:'none'}}
                          onClick={e=>{e.stopPropagation();cancelDC(dc)}}>✕</button>
                      )}
                      {!dc.pgiPosted && (
                        <button className="btn-xs pri" onClick={() => postPGI(dc)}>
                          PGI
                        </button>
                      )}
                      {dc.pgiPosted && !dc.invoiceRef && (
                        <button className="btn-xs"
                          style={{ background:'#D4EDDA', color:'#155724', border:'none' }}
                          onClick={() => createInvoice(dc)}>
                          Invoice →
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ── DETAIL VIEW ──────────────────────────────────────────────────
  if (view === 'detail' && selected) return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          {selected.dcNo} <small>{selected.customerName} · {selected.status}</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => setView('list')}>← Back</button>
          <button className="btn btn-s sd-bsm"
            onClick={() => nav(`/sd/delivery-challan/${selected.id}/print`)}>
            🖨️ Print DC
          </button>
          {/* Edit — only if OPEN and PGI not done */}
          {!selected.pgiPosted && selected.status !== 'CANCELLED' && (
            <button className="btn btn-s sd-bsm" onClick={() => editDC(selected)}>
              ✏️ Edit
            </button>
          )}
          {!selected.pgiPosted && (
            <button className="btn btn-p sd-bsm" onClick={() => postPGI(selected)}>
              📦 Post Goods Issue (PGI)
            </button>
          )}
          {selected.pgiPosted && !selected.invoiceRef && (
            <button className="btn btn-p sd-bsm" onClick={() => createInvoice(selected)}>
              🧾 Create Invoice →
            </button>
          )}
          {/* Delete — only OPEN, no PGI */}
          {!selected.pgiPosted && selected.status !== 'CANCELLED' && (
            <button onClick={() => deleteDC(selected)}
              style={{ padding:'6px 12px', fontSize:12, fontWeight:700,
                background:'#F8D7DA', color:'#721C24', border:'none',
                borderRadius:5, cursor:'pointer' }}>
              🗑 Delete
            </button>
          )}
          {/* Cancel — if PGI done but not invoiced */}
          {selected.pgiPosted && selected.status !== 'CANCELLED' && (
            <button onClick={() => cancelDC(selected)}
              style={{ padding:'6px 12px', fontSize:12, fontWeight:700,
                background:'#FFF3CD', color:'#856404', border:'none',
                borderRadius:5, cursor:'pointer' }}>
              ✕ Cancel DC
            </button>
          )}
        </div>
      </div>

      {/* Status flow */}
      <div style={{ display:'flex', gap:0, marginBottom:16, background:'#fff',
        borderRadius:8, border:'1px solid #E0D5E0', overflow:'hidden' }}>
        {['DC Created','PGI Posted','Invoice Created','Payment Received'].map((s,i) => {
          const done = i===0 ? true : i===1 ? selected.pgiPosted : i===2 ? !!selected.invoiceRef : false
          return (
            <div key={s} style={{ flex:1, padding:'10px 14px', textAlign:'center',
              background: done ? '#D4EDDA' : '#F8F9FA',
              borderRight: i<3 ? '1px solid #E0D5E0' : 'none' }}>
              <div style={{ fontSize:16 }}>{done ? '✅' : '⏳'}</div>
              <div style={{ fontSize:11, fontWeight:700, color: done?'#155724':'#6C757D' }}>{s}</div>
            </div>
          )
        })}
      </div>

      {/* DC Info */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0', padding:14 }}>
          <div style={{ fontWeight:700, marginBottom:10, color:'#714B67' }}>📄 Challan Details</div>
          {[
            ['DC Number',   selected.dcNo],
            ['Date',        fmtD(selected.dcDate||selected.createdAt)],
            ['Customer',    selected.customerName],
            ['SO Reference',selected.soRef||'—'],
            ['Purpose',     selected.purpose||'—'],
            ['E-way Bill',  selected.ewbNo||'—'],
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between',
              padding:'5px 0', borderBottom:'1px solid #F0F0F0', fontSize:12 }}>
              <span style={{ color:'#6C757D' }}>{l}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0', padding:14 }}>
          <div style={{ fontWeight:700, marginBottom:10, color:'#714B67' }}>🚚 Transport Details</div>
          {[
            ['Vehicle No',  selected.vehicleNo||'—'],
            ['Driver Name', selected.driverName||'—'],
            ['Driver Phone',selected.driverPhone||'—'],
            ['PGI Status',  selected.pgiPosted ? `✅ Posted ${fmtD(selected.pgiDate)}` : '⏳ Pending'],
            ['Invoice Ref', selected.invoiceRef||'—'],
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between',
              padding:'5px 0', borderBottom:'1px solid #F0F0F0', fontSize:12 }}>
              <span style={{ color:'#6C757D' }}>{l}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Lines */}
      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0', overflow:'hidden' }}>
        <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
          padding:'8px 14px', color:'#fff', fontWeight:700, fontSize:13 }}>
          📦 Items Dispatched
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'#F8F4F8' }}>
              {['#','Item Code','Item Name','Qty','Unit'].map(h => (
                <th key={h} style={{ padding:'8px 12px', fontSize:10, fontWeight:700,
                  color:'#6C757D', textAlign:'left', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(selected.lines)?selected.lines:JSON.parse(selected.lines||'[]')).map((l,i) => (
              <tr key={i} style={{ borderBottom:'1px solid #F0F0F0' }}>
                <td style={{ padding:'8px 12px', color:'#6C757D' }}>{i+1}</td>
                <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace',
                  color:'#714B67', fontSize:11 }}>{l.itemCode||'—'}</td>
                <td style={{ padding:'8px 12px', fontWeight:600 }}>{l.itemName}</td>
                <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace',
                  fontWeight:700 }}>{parseFloat(l.qty||0).toFixed(2)}</td>
                <td style={{ padding:'8px 12px', color:'#6C757D' }}>{l.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ── NEW CHALLAN FORM ─────────────────────────────────────────────
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          {form._editId ? `Edit ${form.dcNo||'Challan'}` : 'New Delivery Challan'}
          <small>VL01N · {form._editId ? form.dcNo : dcNo}</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => setView('list')}>← Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={saveDC}>
            {saving ? '⏳ Saving...' : form._editId ? '💾 Update Challan' : '💾 Save Challan'}
          </button>
        </div>
      </div>

      {/* Flow reminder */}
      <div style={{ background:'#EBF5FB', border:'1px solid #AED6F1', borderRadius:8,
        padding:'10px 14px', marginBottom:14, fontSize:12, color:'#1A5276' }}>
        <strong>SAP Flow:</strong> SO → <strong>Delivery Challan</strong> → PGI (FG deducted) → Invoice → Payment
      </div>

      {/* Header section */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📄 Challan Header</div>
        <div className="fi-form-sec-body">
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Customer *</label>
              {(() => {
                // Try to find matching customer by id OR name
                const matchedCx = customers.find(cx =>
                  String(cx.id) === String(form.customerId) ||
                  (cx.name||cx.customerName)?.toLowerCase() === form.customerName?.toLowerCase()
                )
                // Auto-sync customerId if matched by name
                if (matchedCx && String(matchedCx.id) !== String(form.customerId)) {
                  setTimeout(() => setForm(p => ({
                    ...p,
                    customerId:    String(matchedCx.id),
                    customerGstin: p.customerGstin || matchedCx.gstin || '',
                    billToAddress: p.billToAddress || [matchedCx.address, matchedCx.city, matchedCx.state, matchedCx.pincode].filter(Boolean).join(', '),
                    shipToAddress: p.shipToAddress || p.billToAddress || [matchedCx.address, matchedCx.city, matchedCx.state, matchedCx.pincode].filter(Boolean).join(', '),
                  })), 0)
                }
                return (
                <select style={inp}
                  value={matchedCx ? String(matchedCx.id) : String(form.customerId||'')}
                  onChange={e => onCustomerChange(e.target.value)}>
                  <option value="">-- Select Customer --</option>
                  {customers.map(cx => (
                    <option key={cx.id} value={String(cx.id)}>
                      {cx.code} — {cx.name}
                    </option>
                  ))}
                </select>
                )
              })()}
            </div>
            <div>
              <label style={lbl}>Against Sales Order</label>
              <select style={inp}
                value={(() => {
                  const matched = openSOs.find(s =>
                    String(s.id) === String(form.soId) ||
                    s.soNo === form.soRef
                  )
                  return matched ? String(matched.id) : ''
                })()}
                onChange={e => onSOChange(e.target.value)}>
                <option value="">-- Direct Dispatch --</option>
                {openSOs.map(so => (
                  <option key={so.id} value={String(so.id)}>
                    {so.soNo} · {so.customerName}
                  </option>
                ))}
              </select>
              {form.soRef && (
                <div style={{ fontSize:10, color:'#155724', marginTop:3 }}>✅ {form.soRef}</div>
              )}
            </div>
            <div>
              <label style={lbl}>Dispatch Date *</label>
              <input type="date" style={inp} value={form.dcDate}
                onChange={e => setForm(f => ({ ...f, dcDate:e.target.value }))} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Purpose</label>
              <select style={inp} value={form.purpose}
                onChange={e => setForm(f => ({ ...f, purpose:e.target.value }))}>
                {['Sales','Job Work','Goods on Approval','Exhibition','Repair & Return','Other']
                  .map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Customer GSTIN</label>
              <input style={{ ...inp, background:'#F8F9FA', fontFamily:'DM Mono,monospace', fontSize:11 }}
                value={form.customerGstin || customers.find(cx =>
                  cx.name === form.customerName || String(cx.id) === String(form.customerId)
                )?.gstin || ''}
                readOnly />
            </div>
            <div>
              <label style={lbl}>E-way Bill No</label>
              <input style={inp} value={form.ewbNo}
                onChange={e => setForm(f => ({ ...f, ewbNo:e.target.value }))}
                placeholder="EWB number (if applicable)" />
            </div>
          </div>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📍 Billing & Shipping Address</div>
        <div className="fi-form-sec-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={lbl}>Bill To Address</label>
              <textarea style={{ ...inp, height:70, resize:'vertical' }}
                value={form.billToAddress || (() => {
                  const cx = customers.find(cx =>
                    cx.name === form.customerName || String(cx.id) === String(form.customerId)
                  )
                  return cx ? [cx.address, cx.city, cx.state, cx.pincode].filter(Boolean).join(', ') : ''
                })()}
                onChange={e => setForm(f => ({
                  ...f,
                  billToAddress: e.target.value,
                  shipToAddress: f.sameAddress ? e.target.value : f.shipToAddress
                }))}
                placeholder="Customer billing address" />
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <label style={lbl}>Ship To Address</label>
                <label style={{ fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  <input type="checkbox" checked={form.sameAddress}
                    onChange={e => setForm(f => ({
                      ...f,
                      sameAddress: e.target.checked,
                      shipToAddress: e.target.checked ? f.billToAddress : f.shipToAddress
                    }))} />
                  Same as Bill To
                </label>
              </div>
              {/* Multiple ship-to dropdown */}
              {!form.sameAddress && shipAddresses.length > 0 && (
                <select style={{ ...inp, marginBottom:6 }}
                  onChange={e => {
                    const idx = parseInt(e.target.value)
                    if (isNaN(idx)) return
                    const a = shipAddresses[idx]
                    if (a) setForm(f => ({
                      ...f,
                      shipToAddress: [a.address||a.name, a.city, a.state, a.pincode]
                        .filter(Boolean).join(', '),
                    }))
                  }}>
                  <option value="">-- Select Ship To --</option>
                  {shipAddresses.map((a,i) => (
                    <option key={i} value={i}>
                      {a.name||a.label||`Address ${i+1}`} — {a.city||a.address||''}
                      {a.gstin ? ` (${a.gstin})` : ''}
                    </option>
                  ))}
                </select>
              )}
              <textarea style={{ ...inp, height:70, resize:'vertical',
                background: form.sameAddress ? '#F8F9FA' : '#fff' }}
                value={form.sameAddress ? form.billToAddress : form.shipToAddress}
                readOnly={form.sameAddress}
                onChange={e => setForm(f => ({ ...f, shipToAddress: e.target.value }))}
                placeholder="Shipping address (if different from billing)" />
              {!form.sameAddress && shipAddresses.length === 0 && (
                <div style={{ fontSize:10, color:'#856404', marginTop:3 }}>
                  ℹ️ Add ship-to addresses in Customer Master for quick selection
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop:10 }}>
            <label style={lbl}>Payment Terms</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['Immediate','7 Days','15 Days','30 Days','45 Days','60 Days','90 Days','Against Delivery'].map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, payTerms:t }))}
                  style={{ padding:'4px 10px', fontSize:11, fontWeight:700,
                    borderRadius:5, cursor:'pointer', border:'1.5px solid',
                    borderColor: form.payTerms===t ? '#714B67' : '#E0D5E0',
                    background:  form.payTerms===t ? '#714B67' : '#fff',
                    color:       form.payTerms===t ? '#fff'    : '#6C757D' }}>
                  {t}
                </button>
              ))}
              <input style={{ ...inp, width:120, fontSize:11 }}
                value={!['Immediate','7 Days','15 Days','30 Days','45 Days','60 Days','90 Days','Against Delivery'].includes(form.payTerms) ? form.payTerms : ''}
                onChange={e => setForm(f => ({ ...f, payTerms:e.target.value }))}
                placeholder="Custom terms" />
            </div>
          </div>
        </div>
      </div>

      {/* Transport section */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">🚚 Transport Details</div>
        <div className="fi-form-sec-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Vehicle Number</label>
              <input style={inp} value={form.vehicleNo}
                onChange={e => setForm(f => ({ ...f, vehicleNo:e.target.value }))}
                placeholder="TN-XX-XXXX-XXXX" />
            </div>
            <div>
              <label style={lbl}>Driver Name</label>
              <input style={inp} value={form.driverName}
                onChange={e => setForm(f => ({ ...f, driverName:e.target.value }))}
                placeholder="Driver name" />
            </div>
            <div>
              <label style={lbl}>Driver Phone</label>
              <input style={inp} value={form.driverPhone}
                onChange={e => setForm(f => ({ ...f, driverPhone:e.target.value }))}
                placeholder="Mobile number" />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr" style={{ display:'flex', justifyContent:'space-between' }}>
          <span>📦 Items to Dispatch</span>
          <button style={{ fontSize:11, padding:'3px 10px', background:'#714B67',
            color:'#fff', border:'none', borderRadius:5, cursor:'pointer' }}
            onClick={addLine}>+ Add Item</button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
                {['#','Item','Qty','Unit','Description',''].map(h => (
                  <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.lines.map((l, i) => (
                <tr key={i} style={{ borderBottom:'1px solid #F0F0F0' }}>
                  <td style={{ padding:'4px 8px', color:'#6C757D', width:30 }}>{i+1}</td>
                  <td style={{ padding:'4px 6px', minWidth:200 }}>
                    <select style={inp} value={l.itemCode}
                      onChange={e => {
                        const item = fgItems.find(it => (it.code||it.itemCode) === e.target.value)
                        updLine(i, {
                          itemCode: e.target.value,
                          itemName: item?.name || item?.itemName || '',
                          unit:     item?.uom || item?.unit || l.unit,
                        })
                      }}>
                      <option value="">-- Select FG Item --</option>
                      {fgItems.map(it => (
                        <option key={it.code||it.itemCode} value={it.code||it.itemCode}>
                          {it.code||it.itemCode} — {it.name||it.itemName}
                        </option>
                      ))}
                    </select>
                    {l.itemName && (
                      <div style={{ fontSize:10, color:'#714B67', marginTop:2 }}>{l.itemName}</div>
                    )}
                  </td>
                  <td style={{ padding:'4px 6px', width:110 }}>
                    <input type="number"
                      style={{ ...inp,
                        borderColor: (() => {
                          const qty = parseFloat(l.qty||0)
                          if (!qty) return '#E0D5E0'
                          const stock = fgStock[l.itemCode] || 0
                          const pending = l._pendingQty
                          if (l.itemCode && qty > stock) return '#DC3545'
                          if (pending !== undefined && qty > pending) return '#DC3545'
                          return '#28A745'
                        })()
                      }}
                      value={l.qty}
                      onChange={e => {
                        const newQty = parseFloat(e.target.value||0)
                        const maxPending = l._pendingQty
                        const maxStock   = fgStock[l.itemCode]
                        if (maxPending !== undefined && newQty > maxPending) {
                          toast.error(`Max allowed: ${maxPending} (SO pending qty)`, {id:'qty-err'})
                        } else if (maxStock !== undefined && l.itemCode && newQty > maxStock) {
                          toast.error(`FG Stock: ${maxStock} available`, {id:'qty-err'})
                        }
                        updLine(i, { qty: e.target.value })
                      }}
                      placeholder="0" min="0"
                      max={Math.min(
                        l._pendingQty !== undefined ? l._pendingQty : 99999,
                        l.itemCode && fgStock[l.itemCode] !== undefined ? fgStock[l.itemCode] : 99999
                      )} />
                    {/* Stock info */}
                    {l.itemCode && (
                      <div style={{ fontSize:9, marginTop:2, lineHeight:1.3 }}>
                        {l._pendingQty !== undefined && (
                          <span style={{ color:'#1A5276' }}>
                            SO: {l._pendingQty} {l.unit}
                          </span>
                        )}
                        {l.itemCode && fgStock[l.itemCode] !== undefined && (
                          <span style={{ color: fgStock[l.itemCode] >= parseFloat(l.qty||0) ? '#155724' : '#DC3545', marginLeft:4 }}>
                            | Stock: {fgStock[l.itemCode]} {l.unit}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ padding:'4px 6px', width:80 }}>
                    <input style={inp} value={l.unit}
                      onChange={e => updLine(i, { unit: e.target.value })} />
                  </td>
                  <td style={{ padding:'4px 6px' }}>
                    <input style={inp} value={l.description}
                      onChange={e => updLine(i, { description: e.target.value })}
                      placeholder="Optional description" />
                  </td>
                  <td style={{ padding:'4px 6px', width:40 }}>
                    {form.lines.length > 1 && (
                      <button onClick={() => delLine(i)}
                        style={{ background:'#F8D7DA', color:'#721C24',
                          border:'none', borderRadius:4, padding:'3px 7px',
                          cursor:'pointer', fontSize:12 }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks + T&C */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📝 Remarks & Terms</div>
        <div className="fi-form-sec-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={lbl}>Remarks / Special Instructions</label>
              <textarea style={{ ...inp, height:80, resize:'vertical' }}
                value={form.remarks}
                onChange={e => setForm(f => ({ ...f, remarks:e.target.value }))}
                placeholder="Handling instructions, fragile items, etc..." />
            </div>
            <div>
              <label style={lbl}>Terms & Conditions</label>
              <textarea style={{ ...inp, height:80, resize:'vertical', fontSize:11 }}
                value={form.termsConditions}
                onChange={e => setForm(f => ({ ...f, termsConditions:e.target.value }))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
