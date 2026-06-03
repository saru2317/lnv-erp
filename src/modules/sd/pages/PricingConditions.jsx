import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n  => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2 })
const fmtD = s  => s ? new Date(s).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const TYPE_STYLE = {
  standard:            { bg:'#E8F4FD', c:'#1A5276', label:'Standard'         },
  wholesale:           { bg:'#D4EDDA', c:'#155724', label:'Wholesale'        },
  'customer-specific': { bg:'#EDE0EA', c:'#714B67', label:'Customer-Specific'},
  export:              { bg:'#FFF3CD', c:'#856404', label:'Export'           },
  promotional:         { bg:'#F8D7DA', c:'#721C24', label:'Promotional'      },
}

export default function PricingConditions() {
  const nav     = useNavigate()
  const fileRef = useRef()

  // ── State ──────────────────────────────────────────────────────────────────
  const [view,       setView]      = useState('lists')      // lists | prices | customers

  // Get current user role from localStorage
  const getUser = () => { try { return JSON.parse(localStorage.getItem('lnv_user')||'{}') } catch { return {} } }
  const userRole = getUser().role || 'SALES'
  const userName = getUser().name || 'User'
  const canApprove  = ['MANAGER','ACCOUNTS','ADMIN'].includes(userRole)
  const isSales     = ['SALES','ADMIN'].includes(userRole)

  const [pendingApprovals, setPendingApprovals] = useState([])
  const [loading,    setLoading]   = useState(true)
  const [saving,     setSaving]    = useState(false)

  const [priceLists, setPriceLists] = useState([])
  const [selList,    setSelList]    = useState(null)      // selected price list object
  const [entries,    setEntries]    = useState([])        // items in selected list
  const [customers,  setCustomers]  = useState([])        // all customers
  const [items,      setItems]      = useState([])        // billing items
  const [custPricing,setCustPricing]= useState([])        // customer-priceList assignments
  const [editId,     setEditId]     = useState(null)
  const [editPrice,  setEditPrice]  = useState('')

  // New Price List form
  const [showNewList, setShowNewList] = useState(false)
  const [newList, setNewList]  = useState({
    name:'', type:'standard', currency:'INR', validFrom:'', validTo:''
  })

  // Add Item to Price List form
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem]  = useState({
    itemCode:'', itemName:'', basePrice:'', minQty:1
  })

  // Assign Price List to Customer
  const [showAssign, setShowAssign]  = useState(false)
  const [assignCust, setAssignCust]  = useState('')

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    // Load all entries and group client-side (most reliable approach)
    try {
      const allRes   = await fetch(`${BASE}/price-book`, { headers: hdr2() })
      const allData  = await allRes.json()
      const allEntries = allData.data || []
      const listMap  = {}
      allEntries.forEach(e => {
        if (!listMap[e.priceListName]) {
          listMap[e.priceListName] = {
            priceListName:  e.priceListName,
            priceListType:  e.priceListType || 'standard',
            currency:       e.currency || 'INR',
            validFrom:      e.validFrom,
            validTo:        e.validTo,
            approvalStatus: e.approvalStatus || 'DRAFT',
            approvedBy:     e.approvedBy,
            rejectedReason: e.rejectedReason,
            itemCount:      0,
          }
        }
        // Status priority: ACTIVE > PENDING > REJECTED > DRAFT
        // Always use the highest priority status found
        const STATUS_PRIORITY = { ACTIVE:4, PENDING:3, REJECTED:2, DRAFT:1 }
        const curPriority = STATUS_PRIORITY[listMap[e.priceListName].approvalStatus] || 0
        const newPriority = STATUS_PRIORITY[e.approvalStatus] || 0
        if (newPriority >= curPriority) {
          listMap[e.priceListName].approvalStatus = e.approvalStatus || 'DRAFT'
          listMap[e.priceListName].approvedBy     = e.approvedBy
          listMap[e.priceListName].rejectedReason = e.rejectedReason
          listMap[e.priceListName].notes          = e.notes
        }
        if (e.itemName !== '-- Price List Created --') {
          listMap[e.priceListName].itemCount++
        }
      })
      setPriceLists(Object.values(listMap))
    } catch(e) { console.error('Lists error:', e) }

    try {
      const custRes = await fetch(`${BASE}/sd/customers`, { headers: hdr2() }).then(r=>r.json()).catch(()=>({ data:[] }))
      const custs   = custRes.data || []
      setCustomers(custs)
      setCustPricing(custs
        .filter(c => c.priceList && c.priceList !== 'Standard')
        .map(c => ({ customerId: c.id, customerCode: c.code, customerName: c.name, priceList: c.priceList }))
      )
    } catch { /* ignore */ }

    try {
      const itemsRes = await fetch(`${BASE}/items`, { headers: hdr2() }).then(r=>r.json()).catch(()=>({ data:[] }))
      setItems((itemsRes.data || []).filter(i => i.billingItem !== false))
    } catch { /* ignore */ }

    // Load pending approvals (for MD/Finance dashboard)
    try {
      const pendRes = await fetch(`${BASE}/price-book/pending-approvals`, { headers: hdr2() }).then(r=>r.json()).catch(()=>({ data:[] }))
      setPendingApprovals(pendRes.data || [])
    } catch { /* ignore */ }

    setLoading(false)
  }, [])

  const loadEntries = useCallback(async (listName) => {
    if (!listName) return
    try {
      const res  = await fetch(`${BASE}/price-book?priceListName=${encodeURIComponent(listName)}`, { headers: hdr2() })
      const data = await res.json()
      setEntries((data.data || []).filter(e => e.itemName !== '-- Price List Created --'))
    } catch { toast.error('Failed to load price entries') }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Sync selList when priceLists refreshes (so approval status stays current)
  useEffect(() => {
    if (selList && priceLists.length > 0) {
      const updated = priceLists.find(l => l.priceListName === selList.priceListName)
      if (updated) setSelList(updated)
    }
  }, [priceLists])

  useEffect(() => {
    if (selList) loadEntries(selList.priceListName)
  }, [selList, loadEntries])

  // ── Create Price List ──────────────────────────────────────────────────────
  const createList = async () => {
    if (!newList.name.trim()) return toast.error('Price List Name required!')
    setSaving(true)
    try {
      await fetch(`${BASE}/price-book`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({
          priceListName: newList.name,
          priceListType: newList.type,
          currency:      newList.currency,
          validFrom:     newList.validFrom || null,
          validTo:       newList.validTo   || null,
          itemName:      '-- Price List Created --',
          basePrice:     0,
        })
      })
      toast.success(`"${newList.name}" created!`)
      setShowNewList(false)
      setNewList({ name:'', type:'standard', currency:'INR', validFrom:'', validTo:'' })
      // Small delay to ensure DB write completes
      setTimeout(() => loadAll(), 300)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ── Add Item to Price List ─────────────────────────────────────────────────
  const addItem = async () => {
    if (!selList || !newItem.itemName || !newItem.basePrice)
      return toast.error('Select item and enter price!')
    setSaving(true)
    try {
      const res = await fetch(`${BASE}/price-book`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({
          priceListName: selList.priceListName,
          priceListType: selList.priceListType || 'standard',
          currency:      selList.currency || 'INR',
          validFrom:     selList.validFrom || null,
          validTo:       selList.validTo   || null,
          itemCode:      newItem.itemCode || null,
          itemName:      newItem.itemName,
          basePrice:     parseFloat(newItem.basePrice),
          minQty:        parseFloat(newItem.minQty || 1),
        })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(`${newItem.itemName} added to ${selList.priceListName}!`)
      setShowAddItem(false)
      setNewItem({ itemCode:'', itemName:'', basePrice:'', minQty:1 })
      loadEntries(selList.priceListName)
      loadAll()
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ── Inline edit price ──────────────────────────────────────────────────────
  const saveEdit = async (id) => {
    try {
      await fetch(`${BASE}/price-book/${id}`, {
        method:'PATCH', headers: hdr(),
        body: JSON.stringify({ basePrice: parseFloat(editPrice) })
      })
      toast.success('Price updated!')
      setEditId(null)
      loadEntries(selList.priceListName)
    } catch(e) { toast.error(e.message) }
  }

  // ── Delete item from price list ────────────────────────────────────────────
  const deleteItem = async (id) => {
    if (!window.confirm('Remove this item from price list?')) return
    await fetch(`${BASE}/price-book/${id}`, { method:'DELETE', headers: hdr2() })
    loadEntries(selList.priceListName)
    loadAll()
  }

  // ── Assign price list to customer ──────────────────────────────────────────
  const assignToCustomer = async () => {
    if (!assignCust || !selList) return toast.error('Select a customer!')
    try {
      const cust = customers.find(c => String(c.id) === String(assignCust))
      const res  = await fetch(`${BASE}/customers/${assignCust}`, {
        method:'PATCH', headers: hdr(),
        body: JSON.stringify({ priceList: selList.priceListName })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(`"${selList.priceListName}" assigned to ${cust?.name}!`)
      setShowAssign(false)
      setAssignCust('')
      loadAll()
    } catch(e) { toast.error(e.message) }
  }

  // ── Excel upload ───────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selList) { toast.error('Select a price list first!'); return }
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const wb   = XLSX.read(ev.target.result, { type:'binary' })
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1 })
        const itemsToImport = rows.slice(1)
          .filter(r => r[1] && r[2])
          .map(r => ({ itemCode: String(r[0]||''), itemName: String(r[1]), basePrice: parseFloat(r[2]||0), minQty: parseFloat(r[3]||1) }))
        const res = await fetch(`${BASE}/price-book/bulk`, {
          method:'POST', headers: hdr(),
          body: JSON.stringify({ priceListName: selList.priceListName, items: itemsToImport })
        })
        const data = await res.json()
        toast.success(`${data.count} prices imported!`)
        loadEntries(selList.priceListName); loadAll()
      } catch(e) { toast.error('Import failed: ' + e.message) }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Item Code','Item Name *','Base Price (₹) *','Min Qty'],
      ['FG-001','Sample Item','100','1'],
    ])
    ws['!cols'] = [{wch:14},{wch:40},{wch:16},{wch:10}]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Price Upload')
    XLSX.writeFile(wb, `PriceUpload_${selList?.priceListName||'template'}.xlsx`)
    toast.success('Template downloaded!')
  }

  // ── Customer pricing tab ───────────────────────────────────────────────────
  const removeAssignment = async (cust) => {
    if (!window.confirm(`Remove ${selList?.priceListName} from ${cust.customerName}?`)) return
    await fetch(`${BASE}/customers/${cust.customerId}`, {
      method:'PATCH', headers: hdr(),
      body: JSON.stringify({ priceList: 'Standard' })
    })
    toast.success('Removed — customer now uses Standard Price List')
    loadAll()
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const sel = selList ? (TYPE_STYLE[selList.priceListType] || TYPE_STYLE.standard) : null

  // customers assigned to selected price list
  const assignedCusts = custPricing.filter(c =>
    selList && c.priceList === selList.priceListName
  )

  return (
    <div>
      {/* ── Header ── */}
      <div className="lv-hdr">
        <div className="lv-ttl">
          Pricing Conditions
          <small>VK00 · Price Lists · Item Prices · Customer Assignments</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-p"
            onClick={() => setShowNewList(true)}>
            + New Price List
          </button>
        </div>
      </div>

      {/* ── Pending approvals alert for MD/Finance ── */}
      {canApprove && pendingApprovals.length > 0 && (
        <div style={{ background:'#FFF3CD', border:'1px solid #FFE69C',
          borderRadius:8, padding:'10px 18px', marginBottom:12,
          display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:22 }}>🔔</span>
          <div style={{ flex:1 }}>
            <strong style={{ color:'#856404' }}>
              {pendingApprovals.length} Price List(s) pending your approval
            </strong>
            <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>
              {pendingApprovals.map(p => p.priceListName).join(' · ')}
            </div>
          </div>
          <span style={{ fontSize:11, color:'#856404', fontWeight:600 }}>
            Select from left panel to review →
          </span>
        </div>
      )}

      {/* ── How it works banner ── */}
      <div style={{ background:'#EBF5FB', border:'1px solid #AED6F1', borderRadius:8,
        padding:'12px 18px', marginBottom:16, fontSize:12, color:'#1A5276',
        display:'flex', gap:20, flexWrap:'wrap' }}>
        <div style={{ fontWeight:700, fontSize:13, minWidth:160 }}>
          💡 How Pricing Works:
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          {[
            ['1️⃣', 'Create a Price List'],
            ['→', ''],
            ['2️⃣', 'Add Items + Prices'],
            ['→', ''],
            ['3️⃣', 'Assign to Customer'],
            ['→', ''],
            ['4️⃣', 'Auto-fills in Sales Order'],
          ].map(([icon, label], i) => icon === '→' ? (
            <span key={i} style={{ fontSize:18, color:'#AED6F1' }}>→</span>
          ) : (
            <span key={i} style={{ background:'#fff', border:'1px solid #AED6F1',
              borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:600 }}>
              {icon} {label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16 }}>
        {/* ── LEFT: Price List selector ── */}
        <div>
          <div style={{ fontWeight:700, fontSize:12, color:'#714B67',
            marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>
            Price Lists ({priceLists.length})
          </div>

          {loading ? (
            <div style={{ padding:20, textAlign:'center', color:'#6C757D' }}>Loading...</div>
          ) : priceLists.length === 0 ? (
            <div style={{ padding:20, textAlign:'center', color:'#6C757D',
              background:'#fff', border:'1.5px solid #E0D5E0', borderRadius:8 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>💰</div>
              No price lists yet.
              <br/>
              <button className="btn-xs pri" style={{ marginTop:8 }}
                onClick={() => setShowNewList(true)}>
                + Create First
              </button>
            </div>
          ) : priceLists.map(l => {
            const s = TYPE_STYLE[l.priceListType] || TYPE_STYLE.standard
            const isSelected = selList?.priceListName === l.priceListName
            return (
              <div key={l.priceListName}
                onClick={() => setSelList(l)}
                style={{
                  padding:'12px 14px', marginBottom:8, borderRadius:8,
                  cursor:'pointer',
                  background: isSelected ? s.c : '#fff',
                  color:      isSelected ? '#fff' : '#1A1A2E',
                  border:`1.5px solid ${isSelected ? s.c : '#E0D5E0'}`,
                  transition:'all .15s',
                }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center' }}>
                  <div style={{ fontWeight:700, fontSize:12,
                    color: isSelected ? '#fff' : s.c }}>
                    {l.priceListName}
                  </div>
                  {/* Approval status badge */}
                  <span style={{
                    fontSize:9, fontWeight:700, padding:'1px 6px',
                    borderRadius:8,
                    background: l.approvalStatus==='ACTIVE'    ? '#D4EDDA'
                               : l.approvalStatus==='PENDING'   ? '#FFF3CD'
                               : l.approvalStatus==='REJECTED'  ? '#F8D7DA'
                               : 'rgba(255,255,255,.2)',
                    color: l.approvalStatus==='ACTIVE'    ? '#155724'
                         : l.approvalStatus==='PENDING'   ? '#856404'
                         : l.approvalStatus==='REJECTED'  ? '#721C24'
                         : isSelected ? '#fff' : '#6C757D',
                  }}>
                    {l.approvalStatus || 'DRAFT'}
                  </span>
                </div>
                <div style={{ display:'flex', gap:8, marginTop:4,
                  fontSize:10, opacity:.85 }}>
                  <span style={{ background: isSelected ? 'rgba(255,255,255,.25)' : s.bg,
                    color: isSelected ? '#fff' : s.c,
                    padding:'1px 6px', borderRadius:8, fontWeight:700 }}>
                    {s.label}
                  </span>
                  <span>{l.itemCount || 0} items</span>
                  <span>{l.currency || 'INR'}</span>
                </div>
                {l.rejectedReason && (
                  <div style={{ fontSize:10, marginTop:3,
                    color: isSelected ? '#ffcccc' : '#DC3545' }}>
                    ⚠ {l.rejectedReason}
                  </div>
                )}
                {l.validTo && (
                  <div style={{ fontSize:10, marginTop:3, opacity:.7 }}>
                    Valid till {fmtD(l.validTo)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── RIGHT: Price list detail ── */}
        <div>
          {!selList ? (
            <div style={{ padding:60, textAlign:'center', color:'#6C757D',
              background:'#fff', border:'1.5px solid #E0D5E0', borderRadius:8 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>👈</div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>
                Select a Price List
              </div>
              <div style={{ fontSize:12 }}>
                Pick a price list from the left to see items and manage prices
              </div>
            </div>
          ) : (
            <>
              {/* Selected list header */}
              <div style={{ background: sel.bg, border:`1.5px solid ${sel.c}40`,
                borderRadius:8, padding:'12px 18px', marginBottom:12,
                display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color: sel.c }}>
                    {selList.priceListName}
                  </div>
                  <div style={{ fontSize:11, color: sel.c, opacity:.8, marginTop:2 }}>
                    {sel.label} · {selList.currency || 'INR'}
                    {selList.validFrom && ` · Valid: ${fmtD(selList.validFrom)} → ${fmtD(selList.validTo)}`}
                  </div>
                </div>
                <div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button className="btn btn-s sd-bsm"
                    onClick={downloadTemplate}>
                    ⬇️ Template
                  </button>
                  <label style={{ padding:'6px 14px', borderRadius:5, fontSize:12,
                    fontWeight:700, cursor:'pointer',
                    background:'#D1ECF1', color:'#0C5460',
                    border:'1.5px solid #BEE5EB' }}>
                    ⬆️ Import Excel
                    <input ref={fileRef} type="file"
                      accept=".xlsx,.xls"
                      style={{ display:'none' }}
                      onChange={handleUpload} />
                  </label>
                  <button className="btn btn-s sd-bsm"
                    style={{ background:'#D4EDDA', color:'#155724',
                      border:'1.5px solid #C3E6CB' }}
                    onClick={() => setShowAssign(true)}>
                    👤 Assign to Customer
                  </button>
                  {/* Approval action buttons */}
                  {/* SALES: Submit for approval — choose who approves */}
                  {selList.approvalStatus === 'DRAFT' && isSales && (
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-s sd-bsm"
                        style={{ background:'#FFF3CD', color:'#856404',
                          border:'1.5px solid #FFE69C' }}
                        onClick={async () => {
                          await fetch(`${BASE}/price-book/${encodeURIComponent(selList.priceListName)}/submit`,
                            { method:'POST', headers: hdr(),
                              body: JSON.stringify({
                                submittedBy: userName, assignTo: 'MANAGER',
                                note: `${selList.priceListName} — submitted for MD approval`
                              }) })
                          toast.success('Sent to MD for approval!')
                          setTimeout(() => loadAll(), 300)
                        }}>
                        📤 Submit → MD
                      </button>
                      <button className="btn btn-s sd-bsm"
                        style={{ background:'#EDE0EA', color:'#714B67',
                          border:'1.5px solid #D0C0D0' }}
                        onClick={async () => {
                          await fetch(`${BASE}/price-book/${encodeURIComponent(selList.priceListName)}/submit`,
                            { method:'POST', headers: hdr(),
                              body: JSON.stringify({
                                submittedBy: userName, assignTo: 'ACCOUNTS',
                                note: `${selList.priceListName} — submitted for Finance approval`
                              }) })
                          toast.success('Sent to Finance Officer for approval!')
                          setTimeout(() => loadAll(), 300)
                        }}>
                        📤 Submit → Finance
                      </button>
                    </div>
                  )}

                  {/* Pending badge for non-approvers */}
                  {selList.approvalStatus === 'PENDING' && !canApprove && (
                    <span style={{ fontSize:11, fontWeight:700, color:'#856404',
                      background:'#FFF3CD', padding:'5px 12px', borderRadius:6 }}>
                      ⏳ Waiting for Approval
                    </span>
                  )}

                  {/* MD / Finance: Approve or Reject */}
                  {selList.approvalStatus === 'PENDING' && canApprove && (
                    <>
                      <div style={{ fontSize:11, color:'#856404',
                        background:'#FFF3CD', padding:'5px 12px',
                        borderRadius:6, fontWeight:600 }}>
                        🔔 Pending your approval
                        {selList.notes && (
                          <div style={{ fontSize:10, color:'#6C757D',
                            marginTop:2 }}>
                            {selList.notes}
                          </div>
                        )}
                      </div>
                      <button className="btn btn-s sd-bsm"
                        style={{ background:'#D4EDDA', color:'#155724',
                          border:'1.5px solid #C3E6CB' }}
                        onClick={async () => {
                          const res = await fetch(`${BASE}/price-book/${encodeURIComponent(selList.priceListName)}/approve`,
                            { method:'POST', headers: hdr(),
                              body: JSON.stringify({
                                approvedBy: userName, role: userRole,
                                note: 'Approved'
                              }) })
                          const data = await res.json()
                          if (!res.ok) return toast.error(data.error)
                          toast.success('✅ Price list APPROVED — now ACTIVE in Sales Orders!')
                          setTimeout(() => loadAll(), 300)
                        }}>
                        ✅ Approve
                      </button>
                      <button className="btn btn-s sd-bsm"
                        style={{ background:'#F8D7DA', color:'#721C24',
                          border:'1.5px solid #F5C6CB' }}
                        onClick={async () => {
                          const reason = prompt('Reason for rejection? (sent back to Sales for revision)')
                          if (!reason) return
                          const res = await fetch(`${BASE}/price-book/${encodeURIComponent(selList.priceListName)}/reject`,
                            { method:'POST', headers: hdr(),
                              body: JSON.stringify({
                                reason, rejectedBy: userName, role: userRole
                              }) })
                          toast.error('Price list rejected — returned to Sales')
                          setTimeout(() => loadAll(), 300)
                        }}>
                        ❌ Reject
                      </button>
                    </>
                  )}

                  {selList.approvalStatus === 'ACTIVE' && (
                    <span style={{ fontSize:11, fontWeight:700, color:'#155724',
                      background:'#D4EDDA', padding:'5px 12px', borderRadius:6 }}>
                      ✅ ACTIVE — Live in Sales Orders
                    </span>
                  )}
                  <button className="btn btn-p sd-bsm"
                    onClick={() => setShowAddItem(true)}>
                    + Add Item Price
                  </button>
                </div>
              </div>

              {/* Sub tabs */}
              <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                {[
                  ['prices',    `📦 Item Prices (${entries.length})`],
                  ['customers', `👤 Assigned Customers (${assignedCusts.length})`],
                ].map(([k,l]) => (
                  <button key={k} onClick={() => setView(k)}
                    style={{ padding:'6px 16px', borderRadius:14, fontSize:11,
                      fontWeight:700, cursor:'pointer',
                      background: view===k ? sel.c : '#F8F4F8',
                      color:      view===k ? '#fff' : sel.c,
                      border:`1.5px solid ${sel.c}40` }}>
                    {l}
                  </button>
                ))}
              </div>

              {/* ── PRICES tab ── */}
              {view === 'prices' && (
                <>
                  {/* Add Item inline form */}
                  {showAddItem && (
                    <div style={{ background:'#fff', border:`2px solid ${sel.c}`,
                      borderRadius:8, padding:'14px 18px', marginBottom:12 }}>
                      <div style={{ fontWeight:700, fontSize:13,
                        color: sel.c, marginBottom:10 }}>
                        Add Item to "{selList.priceListName}"
                      </div>
                      <div style={{ display:'grid',
                        gridTemplateColumns:'2fr 1fr 1fr auto', gap:10,
                        alignItems:'end' }}>
                        <div>
                          <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                            display:'block', marginBottom:3, textTransform:'uppercase' }}>
                            Item * (billing items only)
                          </label>
                          <select
                            style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
                              borderRadius:5, fontSize:12, width:'100%', outline:'none' }}
                            value={newItem.itemCode}
                            onChange={e => {
                              const item = items.find(i => (i.itemCode||i.code) === e.target.value)
                              setNewItem(p => ({
                                ...p,
                                itemCode: e.target.value,
                                itemName: item?.itemName || item?.name || '',
                                basePrice: String(item?.salePrice || item?.stdCost || ''),
                              }))
                            }}>
                            <option value="">-- Select Item --</option>
                            {items.map(i => (
                              <option key={i.itemCode||i.code} value={i.itemCode||i.code}>
                                {i.itemCode||i.code} — {i.itemName||i.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                            display:'block', marginBottom:3, textTransform:'uppercase' }}>
                            Price (₹) *
                          </label>
                          <input type="number" min={0}
                            style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
                              borderRadius:5, fontSize:12, width:'100%',
                              boxSizing:'border-box', outline:'none' }}
                            value={newItem.basePrice}
                            onChange={e => setNewItem(p => ({ ...p, basePrice: e.target.value }))}
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                            display:'block', marginBottom:3, textTransform:'uppercase' }}>
                            Min Qty
                          </label>
                          <input type="number" min={1}
                            style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
                              borderRadius:5, fontSize:12, width:'100%',
                              boxSizing:'border-box', outline:'none' }}
                            value={newItem.minQty}
                            onChange={e => setNewItem(p => ({ ...p, minQty: e.target.value }))} />
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-p sd-bsm"
                            disabled={saving} onClick={addItem}>
                            {saving ? '⏳' : '✅ Add'}
                          </button>
                          <button className="btn btn-s sd-bsm"
                            onClick={() => setShowAddItem(false)}>✕</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Item prices table */}
                  <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
                    borderRadius:8, overflow:'hidden' }}>
                    <table className="fi-data-table">
                      <thead>
                        <tr>
                          <th>Item Code</th>
                          <th>Item Name</th>
                          <th style={{ textAlign:'right' }}>Price (₹)</th>
                          <th style={{ textAlign:'right' }}>Min Qty</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.length === 0 ? (
                          <tr><td colSpan={5}
                            style={{ padding:30, textAlign:'center', color:'#6C757D' }}>
                            No items priced yet. Click "+ Add Item Price" or Import Excel.
                          </td></tr>
                        ) : entries.map((e, i) => (
                          <tr key={e.id}
                            style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                            <td style={{ fontFamily:'DM Mono,monospace',
                              fontSize:11, color:'#714B67', fontWeight:700 }}>
                              {e.itemCode || '—'}
                            </td>
                            <td style={{ fontWeight:600, fontSize:12 }}>
                              {e.itemName}
                            </td>
                            <td style={{ textAlign:'right' }}>
                              {editId === e.id ? (
                                <div style={{ display:'flex', gap:4,
                                  justifyContent:'flex-end' }}>
                                  <input type="number"
                                    style={{ width:90, padding:'4px 8px',
                                      textAlign:'right',
                                      border:`2px solid ${sel.c}`,
                                      borderRadius:4, fontSize:12, outline:'none' }}
                                    value={editPrice}
                                    onChange={ev => setEditPrice(ev.target.value)}
                                    onKeyDown={ev => ev.key==='Enter' && saveEdit(e.id)}
                                    autoFocus />
                                  <button onClick={() => saveEdit(e.id)}
                                    style={{ background:'#D4EDDA', color:'#155724',
                                      border:'none', borderRadius:3,
                                      padding:'2px 6px', cursor:'pointer' }}>✅</button>
                                  <button onClick={() => setEditId(null)}
                                    style={{ background:'#F8D7DA', color:'#721C24',
                                      border:'none', borderRadius:3,
                                      padding:'2px 6px', cursor:'pointer' }}>✕</button>
                                </div>
                              ) : (
                                <strong
                                  style={{ fontFamily:'DM Mono,monospace',
                                    color: sel.c, cursor:'pointer',
                                    padding:'2px 8px', background: sel.bg,
                                    borderRadius:6, fontSize:13 }}
                                  onClick={() => {
                                    setEditId(e.id)
                                    setEditPrice(String(e.basePrice))
                                  }}
                                  title="Click to edit price">
                                  {fmtC(e.basePrice)}
                                  <span style={{ fontSize:9,
                                    marginLeft:4 }}>✏️</span>
                                </strong>
                              )}
                            </td>
                            <td style={{ textAlign:'right', fontSize:12,
                              color:'#6C757D' }}>
                              {e.minQty || 1}
                            </td>
                            <td>
                              <button
                                style={{ background:'#F8D7DA', color:'#721C24',
                                  border:'none', borderRadius:3,
                                  padding:'2px 8px', cursor:'pointer',
                                  fontSize:11 }}
                                onClick={() => deleteItem(e.id)}>
                                🗑️ Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── CUSTOMERS tab ── */}
              {view === 'customers' && (
                <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
                  borderRadius:8, overflow:'hidden' }}>
                  <table className="fi-data-table">
                    <thead>
                      <tr>
                        <th>Customer Code</th>
                        <th>Customer Name</th>
                        <th>Price List Assigned</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedCusts.length === 0 ? (
                        <tr><td colSpan={4}
                          style={{ padding:30, textAlign:'center', color:'#6C757D' }}>
                          No customers assigned to this price list yet.
                          <br/>
                          <button className="btn-xs pri" style={{ marginTop:8 }}
                            onClick={() => setShowAssign(true)}>
                            Assign Customer →
                          </button>
                        </td></tr>
                      ) : assignedCusts.map(c => (
                        <tr key={c.customerId}>
                          <td style={{ fontFamily:'DM Mono,monospace',
                            fontSize:11, color:'#714B67', fontWeight:700 }}>
                            {c.customerCode}
                          </td>
                          <td style={{ fontWeight:600, fontSize:12 }}>
                            {c.customerName}
                          </td>
                          <td>
                            <span style={{ background: sel.bg, color: sel.c,
                              padding:'2px 8px', borderRadius:10,
                              fontSize:11, fontWeight:700 }}>
                              {c.priceList}
                            </span>
                          </td>
                          <td>
                            <button
                              style={{ background:'#FFF3CD', color:'#856404',
                                border:'1px solid #FFE69C', borderRadius:3,
                                padding:'2px 8px', cursor:'pointer', fontSize:11 }}
                              onClick={() => removeAssignment(c)}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── New Price List Modal ── */}
      {showNewList && (
        <div className="hcm-modal-overlay" onClick={() => setShowNewList(false)}>
          <div className="hcm-modal" onClick={e=>e.stopPropagation()}
            style={{ maxWidth:460 }}>
            <div className="hcm-modal-hdr">
              <h3>✨ New Price List</h3>
              <span onClick={() => setShowNewList(false)}
                style={{ cursor:'pointer' }}>✕</span>
            </div>
            <div style={{ padding:'16px 20px' }}>
              {/* Explanation */}
              <div style={{ background:'#EBF5FB', borderRadius:6,
                padding:'10px 14px', marginBottom:14, fontSize:12, color:'#1A5276' }}>
                <strong>What is a Price List?</strong><br/>
                A price list contains item prices for a specific customer group.
                After creating, add items with prices, then assign customers.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  ['name',      'Price List Name *', 'text',   'e.g. Premium Customer Rate'],
                  ['validFrom', 'Valid From',         'date',   ''],
                  ['validTo',   'Valid To',           'date',   ''],
                ].map(([k,l,t,p]) => (
                  <div key={k} style={{ gridColumn: k==='name' ? 'span 2' : '' }}>
                    <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                      display:'block', marginBottom:3, textTransform:'uppercase' }}>
                      {l}
                    </label>
                    <input type={t} value={newList[k]}
                      onChange={e => setNewList(p => ({ ...p, [k]: e.target.value }))}
                      placeholder={p}
                      style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
                        borderRadius:5, fontSize:12, width:'100%',
                        boxSizing:'border-box', outline:'none' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                    display:'block', marginBottom:3, textTransform:'uppercase' }}>
                    Type
                  </label>
                  <select value={newList.type}
                    onChange={e => setNewList(p => ({ ...p, type: e.target.value }))}
                    style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
                      borderRadius:5, fontSize:12, width:'100%', outline:'none' }}>
                    {Object.entries(TYPE_STYLE).map(([k,v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                    display:'block', marginBottom:3, textTransform:'uppercase' }}>
                    Currency
                  </label>
                  <select value={newList.currency}
                    onChange={e => setNewList(p => ({ ...p, currency: e.target.value }))}
                    style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
                      borderRadius:5, fontSize:12, width:'100%', outline:'none' }}>
                    {['INR','USD','EUR','AED'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #F0F0F0',
              display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="hcm-btn-outline"
                onClick={() => setShowNewList(false)}>Cancel</button>
              <button className="hcm-btn-primary"
                disabled={saving} onClick={createList}>
                {saving ? '⏳' : '✅ Create Price List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign to Customer Modal ── */}
      {showAssign && selList && (
        <div className="hcm-modal-overlay" onClick={() => setShowAssign(false)}>
          <div className="hcm-modal" onClick={e=>e.stopPropagation()}
            style={{ maxWidth:420 }}>
            <div className="hcm-modal-hdr">
              <h3>👤 Assign to Customer</h3>
              <span onClick={() => setShowAssign(false)}
                style={{ cursor:'pointer' }}>✕</span>
            </div>
            <div style={{ padding:'16px 20px' }}>
              <div style={{ background:'#EDE0EA', borderRadius:6,
                padding:'8px 14px', marginBottom:14, fontSize:12,
                color:'#714B67', fontWeight:600 }}>
                Price List: {selList.priceListName}
              </div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                display:'block', marginBottom:6, textTransform:'uppercase' }}>
                Select Customer *
              </label>
              <select value={assignCust}
                onChange={e => setAssignCust(e.target.value)}
                style={{ padding:'9px 12px', border:'1.5px solid #E0D5E0',
                  borderRadius:5, fontSize:13, width:'100%', outline:'none' }}>
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                    {c.priceList && c.priceList !== 'Standard'
                      ? ` (currently: ${c.priceList})` : ''}
                  </option>
                ))}
              </select>
              <div style={{ fontSize:11, color:'#6C757D', marginTop:8 }}>
                ℹ This customer will get "{selList.priceListName}" rates in Sales Orders.
                If an item is not in this list, Standard pricing applies.
              </div>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #F0F0F0',
              display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="hcm-btn-outline"
                onClick={() => setShowAssign(false)}>Cancel</button>
              <button className="hcm-btn-primary"
                disabled={!assignCust} onClick={assignToCustomer}>
                ✅ Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
