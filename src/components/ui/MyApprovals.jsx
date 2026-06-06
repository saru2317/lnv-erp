// ═══════════════════════════════════════════════════════════════════
// LNV ERP — MyApprovals.jsx
// Shared approval inbox — used by FI, SD, MM modules
// Filters by module type, role-aware
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const INR  = n => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2 })
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'

export default function MyApprovals({ module }) {
  const nav = useNavigate()
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [remark,   setRemark]   = useState('')
  const [acting,   setActing]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/fi/my-approvals`, { headers: hdr2() })
      const d = await r.json()
      const all = d.data || []
      // Filter by module if specified
      setItems(module ? all.filter(i => i.module === module) : all)
    } catch(e) { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [module])

  const getApproveUrl = (item) => {
    if (item.source === 'matrix' && item.txnId)
      return `${BASE}/approval-matrix/transactions/${item.txnId}/approve`
    if (item.type === 'VENDOR_INVOICE') return `${BASE}/mm/invoices/${item.id}/approve`
    if (item.type === 'INVOICE')        return `${BASE}/sd/invoices/${item.id}/approve`
    if (item.type === 'LEAVE')          return `${BASE}/leave/${item.id}/approve`
    if (item.type === 'PO')             return `${BASE}/mm/po/${item.id}/approve`
    if (item.type === 'PR')             return `${BASE}/mm/pr/${item.id}/approve`
    if (item.type === 'WO')             return `${BASE}/pp/wo/${item.id}/approve`
    if (item.type === 'PV' && item.source === 'mm_payment_req') return `${BASE}/mm/payment-requests/${item.id}/approve`
    if (item.type === 'PV')             return `${BASE}/fi/pv/${item.id}/approve`
    if (item.type === 'JV')             return `${BASE}/fi/jv/${item.id}/approve`
    return null
  }

  const getRejectUrl = (item) => {
    if (item.source === 'matrix' && item.txnId)
      return `${BASE}/approval-matrix/transactions/${item.txnId}/reject`
    if (item.type === 'VENDOR_INVOICE') return `${BASE}/mm/invoices/${item.id}/reject`
    if (item.type === 'INVOICE')        return `${BASE}/sd/invoices/${item.id}/reject`
    if (item.type === 'LEAVE')          return `${BASE}/leave/${item.id}/reject`
    if (item.type === 'PO')             return `${BASE}/mm/po/${item.id}/reject`
    if (item.type === 'PR')             return `${BASE}/mm/pr/${item.id}/reject`
    if (item.type === 'WO')             return `${BASE}/pp/wo/${item.id}/reject`
    if (item.type === 'PV' && item.source === 'mm_payment_req') return `${BASE}/mm/payment-requests/${item.id}/reject`
    if (item.type === 'PV')             return `${BASE}/fi/pv/${item.id}/reject`
    if (item.type === 'JV')             return `${BASE}/fi/jv/${item.id}/reject`
    return null
  }

  const approve = async () => {
    if (!selected) return
    const url = getApproveUrl(selected)
    if (!url) { toast.error('Approve not configured for ' + selected.type); return }
    setActing(true)
    try {
      const userName = JSON.parse(localStorage.getItem('lnv_user')||'{}').name || 'User'
      const r = await fetch(url, {
        method:'POST', headers:hdr(),
        body: JSON.stringify({ approvedBy:userName, by:userName, remark, level:selected.level })
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success(`✅ ${selected.docNo} Approved!`)
      setSelected(null); setRemark(''); load()
    } catch(e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  const reject = async () => {
    if (!selected || !remark.trim()) { toast.error('Enter rejection reason'); return }
    const url = getRejectUrl(selected)
    if (!url) { toast.error('Reject not configured for ' + selected.type); return }
    setActing(true)
    try {
      const userName = JSON.parse(localStorage.getItem('lnv_user')||'{}').name || 'User'
      const r = await fetch(url, {
        method:'POST', headers:hdr(),
        body: JSON.stringify({ rejectedBy:userName, by:userName, reason:remark })
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success(`❌ ${selected.docNo} Rejected`)
      setSelected(null); setRemark(''); load()
    } catch(e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  const TYPE_INFO = {
    INVOICE:         { label:'Sales Invoice',      icon:'🧾', color:'#714B67', bg:'#EDE0EA' },
    SO:              { label:'Sales Order',         icon:'📋', color:'#5B2C6F', bg:'#EDE0EA' },
    QUOTATION:       { label:'Quotation',           icon:'💬', color:'#7D3C98', bg:'#F4ECF7' },
    CREDIT_NOTE:     { label:'Credit Note',         icon:'📉', color:'#922B21', bg:'#FDEDEC' },
    DC:              { label:'Delivery Challan',    icon:'🚚', color:'#0E6655', bg:'#D5F5E3' },
    PR:              { label:'Purchase Indent',     icon:'📝', color:'#1F618D', bg:'#D6EAF8' },
    PO:              { label:'Purchase Order',      icon:'📦', color:'#196F3D', bg:'#D4EDDA' },
    GRN:             { label:'Goods Receipt',       icon:'🏭', color:'#117A65', bg:'#D1F2EB' },
    VENDOR_INVOICE:  { label:'Vendor Invoice',      icon:'📦', color:'#196F3D', bg:'#D4EDDA' },
    PV:              { label:'Payment Voucher',     icon:'💰', color:'#784212', bg:'#FDEBD0' },
    JV:              { label:'Journal Entry',       icon:'📒', color:'#6E2F1A', bg:'#FDEBD0' },
    LEAVE:           { label:'Leave Request',       icon:'🏖',  color:'#2E86C1', bg:'#D6EAF8' },
    INCREMENT:       { label:'Increment',           icon:'📈', color:'#117864', bg:'#D1F2EB' },
    SALARY_REV:      { label:'Salary Revision',     icon:'💵', color:'#1A5276', bg:'#D6EAF8' },
    HR_POLICY:       { label:'HR Policy',           icon:'📜', color:'#1F618D', bg:'#D6EAF8' },
    RECRUITMENT:     { label:'Recruitment',         icon:'👤', color:'#2874A6', bg:'#D6EAF8' },
    WO:              { label:'Work Order',          icon:'⚙️',  color:'#6C3483', bg:'#F4ECF7' },
    BOM:             { label:'Bill of Materials',   icon:'🔩', color:'#6C3483', bg:'#F4ECF7' },
    PRODUCTION_PLAN: { label:'Production Plan',     icon:'🏗',  color:'#5B2C6F', bg:'#F4ECF7' },
    NCR:             { label:'NCR/Non-Conformance', icon:'⚠️',  color:'#B7950B', bg:'#FEF9E7' },
  }

  return (
    <div style={{ display:'flex', gap:0, height:'calc(100vh - 160px)' }}>

      {/* ── Left: List ── */}
      <div style={{ width:420, borderRight:'1px solid #E8E0E8', overflowY:'auto', flexShrink:0 }}>
        {/* Header */}
        <div style={{ padding:'14px 16px', borderBottom:'1px solid #E8E0E8',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          position:'sticky', top:0, background:'#fff', zIndex:2 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:'#2D3748' }}>
              📥 My Approvals
            </div>
            <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>
              {items.length} pending · {module || 'All modules'}
            </div>
          </div>
          <button onClick={load}
            style={{ padding:'5px 12px', background:'#F3EEF3', color:'#714B67',
              border:'1px solid #E0D5E0', borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:600 }}>
            ↻ Refresh
          </button>
        </div>

        {/* Items */}
        {loading ? (
          <div style={{ padding:32, textAlign:'center', color:'#6C757D' }}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ padding:40, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <div style={{ fontWeight:700, color:'#155724' }}>All clear!</div>
            <div style={{ fontSize:12, color:'#6C757D', marginTop:4 }}>No pending approvals</div>
          </div>
        ) : items.map(item => {
          const ti = TYPE_INFO[item.type] || { label:item.type, icon:'📄', color:'#6C757D', bg:'#F0F0F0' }
          const isSel = selected?.id === item.id && selected?.type === item.type
          return (
            <div key={`${item.type}-${item.id}`}
              onClick={() => { setSelected(item); setRemark('') }}
              style={{ padding:'12px 16px', borderBottom:'1px solid #F5F5F5', cursor:'pointer',
                background: isSel ? '#FBF7FA' : '#fff',
                borderLeft: isSel ? '3px solid #714B67' : '3px solid transparent',
                transition:'all .15s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:16 }}>{ti.icon}</span>
                  <span style={{ fontWeight:700, fontSize:13, color:'#2D3748', fontFamily:'DM Mono,monospace' }}>
                    {item.docNo}
                  </span>
                </div>
                <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:12, color:'#714B67' }}>
                  {INR(item.amount)}
                </span>
              </div>
              <div style={{ fontSize:12, color:'#495057', marginBottom:3 }}>{item.party}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ background:ti.bg, color:ti.color, padding:'2px 7px',
                  borderRadius:3, fontSize:10, fontWeight:700 }}>{ti.label}</span>
                <span style={{ fontSize:10, color:'#999' }}>
                  {item.submittedBy} · {fmtD(item.date)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Right: Detail + Actions ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
        {!selected ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'#6C757D' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>👈</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Select an item to review</div>
            <div style={{ fontSize:12, marginTop:6 }}>Click any pending approval on the left</div>
          </div>
        ) : (
          <>
            {/* Doc Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:800, color:'#2D3748', fontFamily:'DM Mono,monospace' }}>
                  {selected.docNo}
                </div>
                <div style={{ fontSize:12, color:'#6C757D', marginTop:3 }}>
                  {selected.party} · Submitted by {selected.submittedBy}
                </div>
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:'#714B67', fontFamily:'DM Mono,monospace' }}>
                {INR(selected.amount)}
              </div>
            </div>

            {/* Info grid */}
            <div style={{ background:'#F8F9FA', border:'1px solid #E8E0E8', borderRadius:8,
              padding:'14px 16px', marginBottom:16, fontSize:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  ['Document Type', (TYPE_INFO[selected.type]||{}).label || selected.type],
                  ['Party Name',    selected.party],
                  ['Amount',        INR(selected.amount)],
                  ['Submitted By',  selected.submittedBy],
                  ['Submitted On',  fmtD(selected.date)],
                  ['Module',        selected.module],
                  ...(selected.extra ? [['Details', selected.extra]] : []),
                  ...(selected.level ? [['Approval Level', selected.level]] : []),
                ].map(([k,v])=>(
                  <div key={k} style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:'#6C757D', textTransform:'uppercase' }}>{k}</span>
                    <span style={{ fontWeight:600, color:'#2D3748' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Remark */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#6C757D',
                textTransform:'uppercase', display:'block', marginBottom:6 }}>
                Remark / Note (required for rejection)
              </label>
              <textarea
                value={remark} onChange={e=>setRemark(e.target.value)}
                rows={3} placeholder="Enter approval remark or rejection reason..."
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #DDD',
                  borderRadius:6, fontSize:13, outline:'none', resize:'vertical',
                  boxSizing:'border-box' }} />
            </div>

            {/* Action Buttons */}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={approve} disabled={acting}
                style={{ flex:1, padding:'11px', background:'#155724', color:'#fff',
                  border:'none', borderRadius:6, fontWeight:700, fontSize:14,
                  cursor:acting?'not-allowed':'pointer', opacity:acting?.6:1 }}>
                {acting ? '⏳...' : '✅ Approve'}
              </button>
              <button onClick={reject} disabled={acting}
                style={{ flex:1, padding:'11px', background:'#721C24', color:'#fff',
                  border:'none', borderRadius:6, fontWeight:700, fontSize:14,
                  cursor:acting?'not-allowed':'pointer', opacity:acting?.6:1 }}>
                {acting ? '⏳...' : '❌ Reject'}
              </button>
              <button onClick={()=>setSelected(null)}
                style={{ padding:'11px 20px', background:'#fff', color:'#6C757D',
                  border:'1px solid #DDD', borderRadius:6, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                Cancel
              </button>
            </div>

            {/* Quick nav */}
            <div style={{ marginTop:16, padding:'10px 14px', background:'#FFF3CD',
              border:'1px solid #FFEAA7', borderRadius:6, fontSize:11, color:'#856404' }}>
              ℹ️ After approving a vendor invoice → it appears in <strong>FI → Voucher Entry</strong> for payment
            </div>
          </>
        )}
      </div>
    </div>
  )
}
