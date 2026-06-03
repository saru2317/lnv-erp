// ═══════════════════════════════════════════════════════════════════
// LNV ERP — Admin / ApprovalInbox.jsx
// Approver's inbox — all pending approvals across modules
// Click any item → right drawer shows full document + approve/reject
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

const fmtC  = n => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
const fmtD  = s => s ? new Date(s).toLocaleDateString('en-IN',{ day:'2-digit', month:'short', year:'numeric' }) : '—'
const fmtDT = s => s ? new Date(s).toLocaleString('en-IN',{ day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'
const daysSince = s => s ? Math.floor((Date.now()-new Date(s))/86400000) : 0

const DOC_META = {
  INVOICE:    { label:'Sales Invoice',    icon:'🧾', color:'#714B67', path:'/sd/invoices',  api:'/sd/invoices'      },
  SO:         { label:'Sales Order',      icon:'📋', color:'#5B2C6F', path:'/sd/orders',    api:'/sd/orders'        },
  PO:         { label:'Purchase Order',   icon:'📦', color:'#196F3D', path:'/mm/po',        api:'/mm/po'            },
  PR:         { label:'Purchase Indent',  icon:'📝', color:'#1F618D', path:'/mm/pr',        api:'/mm/pr'            },
  PV:         { label:'Payment Voucher',  icon:'💰', color:'#784212', path:'/fi/vouchers',  api:'/fi/vouchers'      },
  INCREMENT:  { label:'Increment Policy', icon:'📈', color:'#117864', path:'/hcm/increment',api:null                },
  PRICE_LIST: { label:'Price List',       icon:'💲', color:'#1A5276', path:'/sd/price-book',api:null                },
  CREDIT_NOTE:{ label:'Credit Note',      icon:'📉', color:'#922B21', path:'/sd/returns',   api:null                },
  HR_POLICY:  { label:'HR Policy',        icon:'📜', color:'#1F618D', path:'/hcm/hr-policy',api:null               },
  LEAVE:      { label:'Leave Request',    icon:'🏖', color:'#2E86C1', path:'/hcm/leave',    api:null                },
  QUOTATION:  { label:'Quotation',        icon:'💬', color:'#7D3C98', path:'/sd/quotations',api:'/sd/quotations'    },
  DC:         { label:'Delivery Challan', icon:'🚚', color:'#0E6655', path:'/sd/delivery',  api:'/sd/delivery-challan'},
  VENDOR_INVOICE: { label:'Vendor Invoice', icon:'📦', color:'#196F3D', path:'/mm/invoices', api:'/mm/invoices' },
}

const STATUS_ST = {
  PENDING:  { bg:'#FFF3CD', c:'#856404', label:'Pending'  },
  APPROVED: { bg:'#D4EDDA', c:'#155724', label:'Approved' },
  REJECTED: { bg:'#F8D7DA', c:'#721C24', label:'Rejected' },
}

// ── Fetch pending approvals from invoice route + matrix transactions ──
async function fetchPendingApprovals() {
  const results = []

  // 1. Invoice approvals (from sd.js)
  try {
    const r = await fetch(`${BASE}/sd/invoices/pending-approval`, { headers:hdr2() })
    const d = await r.json()
    ;(d.data||[]).forEach(inv => {
      results.push({
        id:          `INV-${inv.id}`,
        docType:     'INVOICE',
        docId:       inv.id,
        docNo:       inv.invoiceNo,
        description: inv.customerName,
        amount:      parseFloat(inv.grandTotal||0),
        submittedBy: inv.submittedBy || '—',
        submittedAt: inv.submittedAt || inv.createdAt,
        currentLevel:inv.approvalLevel || 1,
        status:      'PENDING',
        raw:         inv,
        source:      'sd',
      })
    })
  } catch {}

  // 2. Vendor Invoice approvals (MM → FI)
  try {
    const r = await fetch(`${BASE}/mm/invoices/pending-approval`, { headers:hdr2() })
    const d = await r.json()
    ;(d.data||[]).forEach(inv => {
      results.push({
        id:          `VINV-${inv.id}`,
        docType:     'VENDOR_INVOICE',
        docId:       inv.id,
        docNo:       inv.invNo,
        description: inv.vendorName,
        amount:      parseFloat(inv.totalAmount||0),
        submittedBy: inv.createdBy || 'Purchase Team',
        submittedAt: inv.createdAt,
        currentLevel:1,
        status:      'PENDING',
        raw:         inv,
        source:      'mm',
      })
    })
  } catch {}

  // 3. Matrix approval transactions
  try {
    const r = await fetch(`${BASE}/approval-matrix/transactions/pending`, { headers:hdr2() })
    const d = await r.json()
    ;(d.data||[]).forEach(txn => {
      // Skip if already added from sd route
      if (!results.find(x => x.docType===txn.docType && x.docId===txn.docId)) {
        results.push({
          id:          `TXN-${txn.id}`,
          txnId:       txn.id,
          docType:     txn.docType,
          docId:       txn.docId,
          docNo:       txn.docNo,
          description: txn.docNo,
          amount:      parseFloat(txn.grandTotal||0),
          submittedBy: txn.submittedBy || '—',
          submittedAt: txn.submittedAt,
          currentLevel:txn.currentLevel || 1,
          totalLevels: txn.totalLevels  || 1,
          status:      'PENDING',
          raw:         txn,
          source:      'matrix',
        })
      }
    })
  } catch {}

  return results.sort((a,b) => new Date(a.submittedAt)-new Date(b.submittedAt))
}

export default function ApprovalInbox() {
  const nav = useNavigate()
  const [items,    setItems]    = useState([])
  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)   // item for drawer
  const [docDetail,setDocDetail]= useState(null)   // fetched doc details
  const [tab,      setTab]      = useState('pending') // pending | history
  const [filter,   setFilter]   = useState('ALL')
  const [acting,   setActing]   = useState(false)
  const [remark,   setRemark]   = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [showReject,   setShowReject]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const pending = await fetchPendingApprovals()
      setItems(pending)

      // History — invoices that were approved/rejected
      const r = await fetch(`${BASE}/sd/invoices?status=APPROVED,REJECTED,POSTED`, { headers:hdr2() })
      const d = await r.json()
      setHistory((d.data||[]).filter(i=>['APPROVED','REJECTED','POSTED'].includes(i.status))
        .slice(0,30).map(inv=>({
          docType:'INVOICE', docNo:inv.invoiceNo, amount:inv.grandTotal,
          status: inv.status==='REJECTED'?'REJECTED':'APPROVED',
          actionBy: inv.approvedBy||inv.rejectedBy||'—',
          actionAt: inv.approvedAt||inv.rejectedAt||inv.updatedAt,
          description: inv.customerName,
        })))
    } catch(e) { toast.error('Failed to load approvals') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Fetch document detail for drawer ─────────────────────────
  const openDrawer = async (item) => {
    setSelected(item)
    setDocDetail(null)
    setRemark('')
    setRejectReason('')
    setShowReject(false)

    const dm = DOC_META[item.docType]
    if (!dm?.api) { setDocDetail(item.raw); return }

    try {
      const r = await fetch(`${BASE}${dm.api}/${item.docId}`, { headers:hdr2() })
      const d = await r.json()
      setDocDetail(d.data || item.raw)
    } catch { setDocDetail(item.raw) }
  }

  // ── Approve ──────────────────────────────────────────────────
  const approve = async () => {
    if (!selected) return
    setActing(true)
    try {
      let res, data

      if (selected.docType === 'VENDOR_INVOICE') {
        res = await fetch(`${BASE}/mm/invoices/${selected.docId}/approve`, {
          method:'POST', headers:hdr(),
          body: JSON.stringify({ approvedBy: req?.user?.name||'Finance', remark })
        })
        data = await res.json()
      } else if (selected.docType === 'INVOICE') {
        // Use sd.js invoice approve route
        res = await fetch(`${BASE}/sd/invoices/${selected.docId}/approve`, {
          method:'POST', headers:hdr(),
          body: JSON.stringify({ level:selected.currentLevel, approvedBy:'Admin', remark })
        })
        data = await res.json()
      } else if (selected.txnId) {
        // Use matrix transaction approve
        res = await fetch(`${BASE}/approval-matrix/transactions/${selected.txnId}/approve`, {
          method:'POST', headers:hdr(),
          body: JSON.stringify({ approvedBy:'Admin', remark })
        })
        data = await res.json()
      }

      if (!res?.ok) throw new Error(data?.error || 'Approve failed')
      toast.success(data.message || 'Approved!')
      setSelected(null)
      load()
    } catch(e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  // ── Reject ───────────────────────────────────────────────────
  const reject = async () => {
    if (!rejectReason.trim()) return toast.error('Enter rejection reason')
    setActing(true)
    try {
      let res, data

      if (selected.docType === 'VENDOR_INVOICE') {
        res = await fetch(`${BASE}/mm/invoices/${selected.docId}/reject`, {
          method:'POST', headers:hdr(),
          body: JSON.stringify({ rejectedBy:'Finance', reason:rejectReason })
        })
        data = await res.json()
      } else if (selected.docType === 'INVOICE') {
        res = await fetch(`${BASE}/sd/invoices/${selected.docId}/reject`, {
          method:'POST', headers:hdr(),
          body: JSON.stringify({ level:selected.currentLevel, rejectedBy:'Admin', reason:rejectReason })
        })
        data = await res.json()
      } else if (selected.txnId) {
        res = await fetch(`${BASE}/approval-matrix/transactions/${selected.txnId}/reject`, {
          method:'POST', headers:hdr(),
          body: JSON.stringify({ rejectedBy:'Admin', reason:rejectReason })
        })
        data = await res.json()
      }

      if (!res?.ok) throw new Error(data?.error || 'Reject failed')
      toast.error(data.message || 'Rejected')
      setSelected(null)
      load()
    } catch(e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  const filtered = filter==='ALL' ? items : items.filter(i=>i.docType===filter)
  const docTypes = [...new Set(items.map(i=>i.docType))]

  // ── Drawer: Document Detail Panel ────────────────────────────
  const Drawer = () => {
    if (!selected) return null
    const dm      = DOC_META[selected.docType] || { label:selected.docType, icon:'📄', color:'#714B67' }
    const inv     = docDetail
    const lines   = (() => {
      if (!inv?.lines) return []
      if (Array.isArray(inv.lines)) return inv.lines
      try { return JSON.parse(inv.lines) } catch { return [] }
    })()
    const approvalLog = (() => {
      if (!inv?.approvalLog) return []
      if (Array.isArray(inv.approvalLog)) return inv.approvalLog
      try { return JSON.parse(inv.approvalLog) } catch { return [] }
    })()
    const days = daysSince(selected.submittedAt)

    return (
      <>
        {/* Backdrop */}
        <div onClick={()=>setSelected(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200 }} />

        {/* Drawer */}
        <div style={{ position:'fixed', right:0, top:0, bottom:0, width:520,
          background:'#fff', zIndex:201, boxShadow:'-8px 0 32px rgba(0,0,0,0.15)',
          display:'flex', flexDirection:'column', overflowY:'hidden' }}>

          {/* Drawer Header */}
          <div style={{ background:`linear-gradient(135deg,${dm.color},${dm.color}CC)`,
            color:'#fff', padding:'14px 20px', flexShrink:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:11, opacity:.8, marginBottom:3 }}>
                  {dm.icon} {dm.label} — Approval Required
                </div>
                <div style={{ fontFamily:'Tahoma,monospace', fontSize:18, fontWeight:800 }}>
                  {selected.docNo}
                </div>
                <div style={{ fontSize:11, opacity:.85, marginTop:2 }}>
                  {selected.description}
                  {selected.amount > 0 && <span style={{ marginLeft:8, fontWeight:700 }}>
                    {fmtC(selected.amount)}
                  </span>}
                </div>
              </div>
              <button onClick={()=>setSelected(null)}
                style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'#fff',
                  width:32, height:32, borderRadius:'50%', fontSize:18, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            {/* Waiting badge */}
            <div style={{ marginTop:10, display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ background:'rgba(255,255,255,0.2)', padding:'3px 10px',
                borderRadius:10, fontSize:10, fontWeight:700 }}>
                Level {selected.currentLevel} Pending
              </span>
              {days > 0 && (
                <span style={{ background: days>2?'#DC3545':'rgba(255,255,255,0.2)',
                  padding:'3px 10px', borderRadius:10, fontSize:10, fontWeight:700 }}>
                  ⏰ Waiting {days} day{days>1?'s':''}
                </span>
              )}
              <span style={{ background:'rgba(255,255,255,0.15)', padding:'3px 10px',
                borderRadius:10, fontSize:10 }}>
                by {selected.submittedBy} on {fmtD(selected.submittedAt)}
              </span>
            </div>
          </div>

          {/* Drawer Body */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>

            {/* Doc info grid */}
            {inv && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:8, marginBottom:16, fontSize:12 }}>
                {[
                  ['Customer',   inv.customerName || inv.vendorName || '—'],
                  ['Date',       fmtD(inv.date || inv.createdAt)],
                  ['GSTIN',      inv.customerGstin || '—'],
                  ['Due Date',   fmtD(inv.dueDate)],
                  ['SO Ref',     inv.soRef || '—'],
                  ['Supply',     inv.supplyType || '—'],
                ].filter(([,v])=>v&&v!=='—').map(([k,v])=>(
                  <div key={k} style={{ background:'#F8F9FA', borderRadius:5, padding:'7px 10px' }}>
                    <div style={{ fontSize:10, color:'#6C757D', fontWeight:700, marginBottom:2 }}>{k}</div>
                    <div style={{ fontWeight:600, color:'#2D3748' }}>{v}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Vendor Invoice details panel */}
            {selected?.docType === 'VENDOR_INVOICE' && selected?.raw && (
              <div style={{ background:'#F0FFF4', border:'1px solid #C3E6CB',
                borderRadius:8, padding:'12px 14px', marginBottom:16, fontSize:12 }}>
                <div style={{ fontWeight:700, color:'#155724', marginBottom:10 }}>📦 Vendor Invoice — 3-Way Match Verification</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {[
                    ['Vendor',        selected.raw.vendorName],
                    ['Vendor GSTIN',  selected.raw.vendorGstin || '—'],
                    ['Our Invoice No',selected.raw.invNo],
                    ['Vendor Inv No',  selected.raw.vendorInvNo || '—'],
                    ['PO Reference',  selected.raw.poNo || '—'],
                    ['GRN Reference', selected.raw.grnNo || '—'],
                    ['Sub Total',     '₹'+parseFloat(selected.raw.subTotal||0).toLocaleString('en-IN')],
                    ['GST Amount',    '₹'+parseFloat(selected.raw.totalGST||0).toLocaleString('en-IN')],
                    ['Total Amount',  '₹'+parseFloat(selected.raw.totalAmount||0).toLocaleString('en-IN')],
                    ['Balance Due',   '₹'+parseFloat(selected.raw.balance||selected.raw.totalAmount||0).toLocaleString('en-IN')],
                    ['Due Date',      selected.raw.dueDate ? new Date(selected.raw.dueDate).toLocaleDateString('en-IN') : '—'],
                    ['Created By',    selected.raw.createdBy || 'Purchase Team'],
                  ].map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between',
                      padding:'3px 0', borderBottom:'1px solid #C3E6CB', fontSize:11 }}>
                      <span style={{ color:'#6C757D' }}>{k}</span>
                      <span style={{ fontWeight:600, color:'#2D3748' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:10, padding:'8px', background:'#FFFDE7',
                  border:'1px solid #FFF176', borderRadius:5, fontSize:11, color:'#856404' }}>
                  ✅ <strong>Approve</strong> → Invoice moves to Payment Queue (F-53)<br/>
                  ❌ <strong>Reject</strong> → Returned to Purchase Team
                </div>
              </div>
            )}

            {/* Amount summary */}
            {inv && (
              <div style={{ background:`${dm.color}08`, border:`1px solid ${dm.color}20`,
                borderRadius:8, padding:'12px 14px', marginBottom:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                  {[
                    ['Taxable',    inv.taxableAmt,           '#495057'],
                    ['GST',        (parseFloat(inv.cgst||0)+parseFloat(inv.sgst||0)+parseFloat(inv.igst||0)), '#856404'],
                    ['Grand Total',inv.grandTotal,            dm.color ],
                  ].map(([k,v,c])=>(
                    <div key={k} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'#6C757D', fontWeight:700, textTransform:'uppercase' }}>{k}</div>
                      <div style={{ fontFamily:'Tahoma,monospace', fontWeight:800, fontSize:14, color:c }}>
                        {fmtC(v)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Line items */}
            {lines.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#6C757D',
                  textTransform:'uppercase', marginBottom:8 }}>
                  📦 Line Items ({lines.length})
                </div>
                <div style={{ border:'1px solid #E8E0E8', borderRadius:6, overflow:'hidden' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                    <thead>
                      <tr style={{ background:'#F3EEF3' }}>
                        {['Item','HSN','Qty','Rate','Total'].map(h=>(
                          <th key={h} style={{ padding:'6px 8px', textAlign:'left',
                            fontWeight:700, color:'#714B67', fontSize:10 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l,i)=>(
                        <tr key={i} style={{ borderTop:'1px solid #F0F0F0',
                          background:i%2===0?'#fff':'#FAFAFA' }}>
                          <td style={{ padding:'6px 8px' }}>
                            <div style={{ fontWeight:600 }}>{l.itemName||l.description||'—'}</div>
                            {l.itemCode&&<div style={{ fontSize:9, color:'#999', fontFamily:'Tahoma,monospace' }}>{l.itemCode}</div>}
                          </td>
                          <td style={{ padding:'6px 8px', fontFamily:'Tahoma,monospace', color:'#6C757D', fontSize:10 }}>{l.hsnCode||'—'}</td>
                          <td style={{ padding:'6px 8px', fontFamily:'Tahoma,monospace' }}>{parseFloat(l.qty||0).toLocaleString('en-IN')}</td>
                          <td style={{ padding:'6px 8px', fontFamily:'Tahoma,monospace' }}>{fmtC(l.rate||l.unitPrice||0)}</td>
                          <td style={{ padding:'6px 8px', fontFamily:'Tahoma,monospace', fontWeight:700 }}>{fmtC(l.total||l.totalAmt||0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Approval trail */}
            {approvalLog.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#6C757D',
                  textTransform:'uppercase', marginBottom:8 }}>
                  🔐 Approval Trail
                </div>
                {approvalLog.map((log, i) => (
                  <div key={i} style={{ display:'flex', gap:10, marginBottom:6,
                    padding:'8px 10px', background: log.action==='Approved'?'#F0FFF4':log.action==='Rejected'?'#FFF5F5':'#FFFBF0',
                    border:`1px solid ${log.action==='Approved'?'#C3E6CB':log.action==='Rejected'?'#F5C6CB':'#FFEAA7'}`,
                    borderRadius:5, fontSize:11 }}>
                    <span style={{ fontSize:14 }}>
                      {log.action==='Approved'?'✓':log.action==='Rejected'?'✗':'📤'}
                    </span>
                    <div>
                      <strong>{log.action}</strong> by {log.by}
                      <span style={{ color:'#6C757D', marginLeft:6 }}>{fmtDT(log.at)}</span>
                      {log.remark && <div style={{ color:'#6C757D', marginTop:2 }}>"{log.remark}"</div>}
                    </div>
                    <span style={{ marginLeft:'auto', fontSize:10, background:`${dm.color}15`,
                      color:dm.color, padding:'1px 6px', borderRadius:3, fontWeight:700, alignSelf:'flex-start' }}>
                      L{log.level}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* View full doc link */}
            <button onClick={()=>nav(`${DOC_META[selected.docType]?.path}/${selected.docId}`)}
              style={{ width:'100%', padding:'8px', background:'#F8F9FA',
                border:'1px solid #DDD', borderRadius:6, fontSize:12, cursor:'pointer',
                color:'#495057', marginBottom:16 }}>
              🔗 Open Full Document →
            </button>
          </div>

          {/* ── Approve / Reject Footer ── */}
          <div style={{ borderTop:'2px solid #E8E0E8', padding:'16px 20px',
            background:'#fff', flexShrink:0 }}>

            {!showReject ? (
              <>
                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:10, fontWeight:700, color:'#6C757D',
                    textTransform:'uppercase', display:'block', marginBottom:4 }}>
                    Approval Remark (optional)
                  </label>
                  <input value={remark} onChange={e=>setRemark(e.target.value)}
                    placeholder="Add a note to your approval..."
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #DDD',
                      borderRadius:5, fontSize:12, outline:'none', boxSizing:'border-box' }} />
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>setShowReject(true)}
                    style={{ flex:1, padding:'11px', background:'#fff', color:'#DC3545',
                      border:'2px solid #DC3545', borderRadius:7, fontWeight:700,
                      fontSize:13, cursor:'pointer' }}>
                    ✗ Reject
                  </button>
                  <button onClick={approve} disabled={acting}
                    style={{ flex:2, padding:'11px', background:'#28A745', color:'#fff',
                      border:'none', borderRadius:7, fontWeight:800,
                      fontSize:14, cursor:'pointer', opacity:acting?0.6:1 }}>
                    {acting ? '⏳ Processing...' : '✓ Approve'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ background:'#FFF5F5', border:'1px solid #F5C6CB',
                  borderRadius:6, padding:'10px 12px', marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#721C24', marginBottom:6 }}>
                    ✗ Rejection Reason *
                  </div>
                  <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection (required)..."
                    rows={3}
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #F5C6CB',
                      borderRadius:5, fontSize:12, outline:'none', resize:'none',
                      boxSizing:'border-box', background:'#fff' }} />
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>{ setShowReject(false); setRejectReason('') }}
                    style={{ flex:1, padding:'11px', background:'#fff', color:'#6C757D',
                      border:'1px solid #DDD', borderRadius:7, fontSize:13, cursor:'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={reject} disabled={acting}
                    style={{ flex:2, padding:'11px', background:'#DC3545', color:'#fff',
                      border:'none', borderRadius:7, fontWeight:800,
                      fontSize:13, cursor:'pointer', opacity:acting?0.6:1 }}>
                    {acting ? '⏳...' : '✗ Confirm Reject'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#2D3748' }}>
            🔐 Approval Inbox
          </h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#6C757D' }}>
            All documents pending your approval — click any row to review and act
          </p>
        </div>
        <button onClick={load}
          style={{ padding:'7px 16px', background:'#fff', border:'1.5px solid #DDD',
            borderRadius:6, fontSize:12, cursor:'pointer', color:'#6C757D', fontWeight:600 }}>
          ↻ Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          ['Pending',  items.length,                                            '#856404','#FFF3CD'],
          ['Invoices', items.filter(i=>i.docType==='INVOICE').length,           '#714B67','#EDE0EA'],
          ['Overdue',  items.filter(i=>daysSince(i.submittedAt)>2).length,      '#721C24','#F8D7DA'],
          ['Approved Today', history.filter(h=>h.status==='APPROVED'&&daysSince(h.actionAt)===0).length, '#155724','#D4EDDA'],
        ].map(([l,v,c,bg])=>(
          <div key={l} style={{ background:bg, borderRadius:8, padding:'10px 14px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:c, fontFamily:'Tahoma,monospace' }}>{v}</div>
            <div style={{ fontSize:10, fontWeight:700, color:c, opacity:.8, textTransform:'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:14, borderBottom:'2px solid #E8E0E8' }}>
        {[['pending','⏳ Pending Approvals'],['history','✓ Recent History']].map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{ padding:'8px 20px', border:'none', background:'transparent',
              fontWeight:700, fontSize:13, cursor:'pointer',
              color:      tab===t?'#714B67':'#6C757D',
              borderBottom:tab===t?'2px solid #714B67':'2px solid transparent',
              marginBottom:-2 }}>
            {label} {t==='pending'&&items.length>0&&`(${items.length})`}
          </button>
        ))}

        {/* Doc type filter */}
        {tab==='pending' && (
          <div style={{ marginLeft:'auto', display:'flex', gap:6, paddingBottom:6 }}>
            {['ALL',...docTypes].map(dt=>(
              <button key={dt} onClick={()=>setFilter(dt)}
                style={{ padding:'3px 12px', borderRadius:12, fontSize:11, fontWeight:600,
                  cursor:'pointer', border:'none',
                  background: filter===dt?'#714B67':'#F0F0F0',
                  color:       filter===dt?'#fff':'#6C757D' }}>
                {dt==='ALL'?'All':DOC_META[dt]?.label||dt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── PENDING LIST ── */}
      {tab==='pending' && (
        loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>Loading pending approvals...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'#6C757D',
            background:'#fff', border:'1px dashed #DDD', borderRadius:8 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>All clear!</div>
            <div style={{ fontSize:13 }}>No pending approvals for your role.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map(item => {
              const dm   = DOC_META[item.docType] || { label:item.docType, icon:'📄', color:'#714B67' }
              const days = daysSince(item.submittedAt)
              const isSel= selected?.id === item.id

              return (
                <div key={item.id} onClick={()=>openDrawer(item)}
                  style={{ display:'flex', alignItems:'center', gap:14,
                    padding:'13px 16px', background:'#fff', borderRadius:8,
                    border:`1.5px solid ${isSel ? dm.color : days>2?'#F5C6CB':'#E8E0E8'}`,
                    cursor:'pointer', boxShadow: isSel?`0 0 0 3px ${dm.color}20`:'0 1px 3px rgba(0,0,0,0.05)',
                    transition:'all .15s' }}>

                  {/* Icon + type */}
                  <div style={{ width:42, height:42, borderRadius:8,
                    background:`${dm.color}15`, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:20, flexShrink:0 }}>
                    {dm.icon}
                  </div>

                  {/* Doc info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:'Tahoma,monospace', fontWeight:800,
                        fontSize:13, color:dm.color }}>{item.docNo}</span>
                      <span style={{ fontSize:10, background:`${dm.color}15`, color:dm.color,
                        padding:'1px 6px', borderRadius:3, fontWeight:700 }}>{dm.label}</span>
                      {days > 2 && (
                        <span style={{ fontSize:10, background:'#F8D7DA', color:'#721C24',
                          padding:'1px 6px', borderRadius:3, fontWeight:700 }}>
                          ⚠ {days}d waiting
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:12, color:'#495057', marginTop:2, fontWeight:500 }}>
                      {item.description}
                    </div>
                    <div style={{ fontSize:11, color:'#6C757D', marginTop:1 }}>
                      Submitted by {item.submittedBy} · {fmtDT(item.submittedAt)}
                      · Level {item.currentLevel} pending
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'Tahoma,monospace', fontWeight:800,
                      fontSize:15, color:'#2D3748' }}>{fmtC(item.amount)}</div>
                    <div style={{ fontSize:10, color:'#6C757D', marginTop:2 }}>Grand Total</div>
                  </div>

                  {/* Arrow */}
                  <div style={{ color:'#CCC', fontSize:18, flexShrink:0 }}>›</div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── HISTORY LIST ── */}
      {tab==='history' && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {history.length===0
            ? <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>No history yet.</div>
            : history.map((h,i) => {
                const dm  = DOC_META[h.docType] || { icon:'📄', color:'#6C757D' }
                const st  = STATUS_ST[h.status]  || STATUS_ST.APPROVED
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12,
                    padding:'10px 14px', background:'#fff', borderRadius:7,
                    border:'1px solid #F0F0F0', fontSize:12 }}>
                    <span style={{ fontSize:16 }}>{dm.icon}</span>
                    <span style={{ fontFamily:'Tahoma,monospace', fontWeight:700,
                      color:dm.color, minWidth:120 }}>{h.docNo}</span>
                    <span style={{ flex:1, color:'#495057' }}>{h.description}</span>
                    <span style={{ fontFamily:'Tahoma,monospace', color:'#6C757D' }}>{fmtC(h.amount)}</span>
                    <span style={{ background:st.bg, color:st.c, padding:'2px 10px',
                      borderRadius:10, fontSize:11, fontWeight:700 }}>{st.label}</span>
                    <span style={{ color:'#6C757D', fontSize:11, minWidth:120, textAlign:'right' }}>
                      by {h.actionBy} · {fmtD(h.actionAt)}
                    </span>
                  </div>
                )
              })
          }
        </div>
      )}

      {/* Drawer */}
      <Drawer />
    </div>
  )
}
