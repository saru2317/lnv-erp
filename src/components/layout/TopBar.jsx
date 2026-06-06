import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@hooks/useAuth'
import { ROLES } from '@utils/constants'
import { format } from 'date-fns'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const INR  = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—'

const TYPE_META = {
  INVOICE:        { label:'Sales Invoice',    icon:'🧾', color:'#714B67' },
  SO:             { label:'Sales Order',      icon:'📋', color:'#5B2C6F' },
  QUOTATION:      { label:'Quotation',        icon:'💬', color:'#7D3C98' },
  CREDIT_NOTE:    { label:'Credit Note',      icon:'📉', color:'#922B21' },
  DC:             { label:'DC',              icon:'🚚', color:'#0E6655' },
  PR:             { label:'Purchase Indent',  icon:'📝', color:'#1F618D' },
  PO:             { label:'Purchase Order',   icon:'📦', color:'#196F3D' },
  GRN:            { label:'Goods Receipt',   icon:'🏭', color:'#117A65' },
  VENDOR_INVOICE: { label:'Vendor Invoice',   icon:'📦', color:'#196F3D' },
  PV:             { label:'Payment Voucher',  icon:'💰', color:'#784212' },
  JV:             { label:'Journal Entry',    icon:'📒', color:'#6E2F1A' },
  LEAVE:          { label:'Leave Request',    icon:'🏖', color:'#2E86C1' },
  INCREMENT:      { label:'Increment',        icon:'📈', color:'#117864' },
  SALARY_REV:     { label:'Salary Revision',  icon:'💵', color:'#1A5276' },
  WO:             { label:'Work Order',       icon:'⚙️', color:'#6C3483' },
  BOM:            { label:'Bill of Materials',icon:'🔩', color:'#6C3483' },
  NCR:            { label:'NCR',             icon:'⚠️', color:'#B7950B' },
}

export default function TopBar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const [time,       setTime]       = useState(new Date())
  const [count,      setCount]      = useState(0)
  const [items,      setItems]      = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [remark,     setRemark]     = useState('')
  const [acting,     setActing]     = useState(false)
  const roleInfo = ROLES[user?.role] || {}

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetchApprovals = async () => {
    try {
      const r = await fetch(`${BASE}/fi/my-approvals`, { headers: hdr2() })
      const d = await r.json()
      const list = d.data || []
      setItems(list)
      setCount(list.length)
    } catch {}
  }

  useEffect(() => {
    fetchApprovals()
    const t = setInterval(fetchApprovals, 30000)
    return () => clearInterval(t)
  }, [])

  const getUrl = (item, action) => {
    if (item.source === 'matrix' && item.txnId)
      return `${BASE}/approval-matrix/transactions/${item.txnId}/${action}`
    if (item.type === 'VENDOR_INVOICE') return `${BASE}/mm/invoices/${item.id}/${action}`
    if (item.type === 'INVOICE')        return `${BASE}/sd/invoices/${item.id}/${action}`
    if (item.type === 'LEAVE')          return `${BASE}/leave/${item.id}/${action}`
    if (item.type === 'PO')             return `${BASE}/mm/po/${item.id}/${action}`
    if (item.type === 'PR')             return `${BASE}/mm/pr/${item.id}/${action}`
    if (item.type === 'WO')             return `${BASE}/pp/wo/${item.id}/${action}`
    if (item.type === 'PV' && item.source === 'mm_payment_req') return `${BASE}/mm/payment-requests/${item.id}/${action}`
    if (item.type === 'PV')             return `${BASE}/fi/pv/${item.id}/${action}`
    if (item.type === 'JV')             return `${BASE}/fi/jv/${item.id}/${action}`
    return null
  }

  const doAction = async (action) => {
    if (!selected) return
    if (action === 'reject' && !remark.trim()) { alert('Enter rejection reason'); return }
    const url = getUrl(selected, action)
    if (!url) { alert(`${action} not configured for ${selected.type}`); return }
    setActing(true)
    try {
      const name = (JSON.parse(localStorage.getItem('lnv_user')||'{}').name) || user?.name || 'User'
      const body = action === 'approve'
        ? { approvedBy:name, by:name, remark }
        : { rejectedBy:name, by:name, reason:remark }
      const r = await fetch(url, { method:'POST', headers:hdr(), body:JSON.stringify(body) })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setSelected(null); setRemark('')
      await fetchApprovals()
    } catch(e) { alert(e.message) }
    setActing(false)
  }

  const meta = selected ? (TYPE_META[selected.type] || { label:selected.type, icon:'📄', color:'#6C757D' }) : null

  return (
    <>
      <header style={{
        height:'52px', background:'#714B67', color:'#fff',
        display:'flex', alignItems:'center', gap:'12px',
        padding:'0 16px', flexShrink:0, zIndex:1000,
        boxShadow:'0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <button onClick={onToggleSidebar}
          style={{ background:'none', border:'none', color:'#fff', fontSize:'18px', cursor:'pointer', padding:'4px' }}>
          ☰
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginRight:'8px' }}>
          <div style={{ width:'32px', height:'32px', background:'rgba(255,255,255,0.2)',
            borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:800, fontSize:'13px' }}>LNV</div>
          <span style={{ fontWeight:700, fontSize:'15px' }}>
            LNV ERP <span style={{ fontSize:'11px', opacity:0.7 }}>v2.0</span>
          </span>
        </div>

        <div style={{ flex:1, maxWidth:'400px', background:'rgba(255,255,255,0.15)',
          borderRadius:'6px', display:'flex', alignItems:'center', gap:'8px', padding:'6px 12px' }}>
          <span style={{ fontSize:'13px', opacity:0.7 }}>🔍</span>
          <input placeholder="Search modules, orders, employees…"
            style={{ background:'none', border:'none', outline:'none',
              color:'#fff', fontSize:'12px', width:'100%' }} />
        </div>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'12px' }}>

          <span style={{ padding:'3px 10px', borderRadius:'12px', fontSize:'11px', fontWeight:700,
            background:'rgba(255,255,255,0.2)', color:'#fff' }}>
            {roleInfo.icon} {roleInfo.label}
          </span>

          <span style={{ fontSize:'11px', opacity:0.8 }}>
            {format(time, 'dd MMM · HH:mm:ss')}
          </span>

          {/* 🔔 Bell */}
          <button onClick={() => { setDrawerOpen(true); fetchApprovals() }}
            title={count > 0 ? `${count} pending approvals` : 'No pending approvals'}
            style={{ position:'relative',
              background: count > 0 ? 'rgba(220,53,69,0.3)' : 'rgba(255,255,255,0.15)',
              border: count > 0 ? '1px solid rgba(220,53,69,0.5)' : 'none',
              borderRadius:'8px', padding:'7px 10px',
              cursor:'pointer', color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            {/* SVG Bell Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {count > 0 && (
              <span style={{ position:'absolute', top:-6, right:-6,
                background:'#DC3545', color:'#fff', borderRadius:'50%',
                minWidth:18, height:18, fontSize:10, fontWeight:800, padding:'0 3px',
                display:'flex', alignItems:'center', justifyContent:'center',
                border:'2px solid #714B67', lineHeight:1 }}>
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>

          <div onClick={logout} title="Click to logout"
            style={{ display:'flex', alignItems:'center', gap:'8px',
              background:'rgba(255,255,255,0.2)', borderRadius:'20px',
              padding:'4px 12px 4px 6px', cursor:'pointer' }}>
            <div style={{ width:'28px', height:'28px', borderRadius:'50%',
              background:'rgba(255,255,255,0.3)', display:'flex',
              alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'13px' }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ lineHeight:1.3 }}>
              <div style={{ fontSize:'12px', fontWeight:600 }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize:'10px', opacity:0.75 }}>{user?.company || 'LNV Manufacturing'}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Approval Drawer */}
      {drawerOpen && (
        <>
          <div onClick={() => { setDrawerOpen(false); setSelected(null) }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1998 }} />

          <div style={{ position:'fixed', top:0, right:0, width:780, height:'100vh',
            background:'#fff', zIndex:1999, display:'flex', flexDirection:'column',
            boxShadow:'-8px 0 32px rgba(0,0,0,0.2)' }}>

            {/* Drawer Header */}
            <div style={{ background:'linear-gradient(135deg,#714B67,#9B59B6)',
              padding:'14px 20px', display:'flex', justifyContent:'space-between',
              alignItems:'center', flexShrink:0 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:'#fff' }}>
                  📥 Pending Approvals
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)', marginTop:2 }}>
                  {count} item{count!==1?'s':''} waiting · {user?.name} · {roleInfo.label}
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={fetchApprovals}
                  style={{ padding:'5px 12px', background:'rgba(255,255,255,0.2)',
                    border:'1px solid rgba(255,255,255,0.3)', borderRadius:5,
                    color:'#fff', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                  ↻ Refresh
                </button>
                <button onClick={() => { setDrawerOpen(false); setSelected(null) }}
                  style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff',
                    width:30, height:30, borderRadius:'50%', cursor:'pointer', fontSize:16,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

              {/* Left: List */}
              <div style={{ width:300, borderRight:'1px solid #E8E0E8', overflowY:'auto', flexShrink:0 }}>
                {items.length === 0 ? (
                  <div style={{ padding:40, textAlign:'center' }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                    <div style={{ fontWeight:700, color:'#155724', fontSize:14 }}>All clear!</div>
                    <div style={{ fontSize:12, color:'#6C757D', marginTop:4 }}>No pending approvals</div>
                  </div>
                ) : items.map((item, i) => {
                  const m = TYPE_META[item.type] || { label:item.type, icon:'📄', color:'#6C757D' }
                  const isSel = selected?.id===item.id && selected?.type===item.type
                  return (
                    <div key={i} onClick={() => { setSelected(item); setRemark('') }}
                      style={{ padding:'12px 14px', borderBottom:'1px solid #F5F5F5',
                        cursor:'pointer', background:isSel?'#FBF7FA':'#fff',
                        borderLeft:`3px solid ${isSel?m.color:'transparent'}`, transition:'all .12s' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                        <span style={{ fontWeight:700, fontSize:12, color:m.color }}>
                          {m.icon} {item.docNo}
                        </span>
                        {item.amount > 0 && (
                          <span style={{ fontSize:11, fontWeight:700 }}>{INR(item.amount)}</span>
                        )}
                      </div>
                      <div style={{ fontSize:12, color:'#495057', marginBottom:4 }}>{item.party}</div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:3,
                          background:`${m.color}18`, color:m.color }}>{m.label}</span>
                        <span style={{ fontSize:10, color:'#999' }}>{fmtD(item.date)}</span>
                      </div>
                      {item.extra && (
                        <div style={{ fontSize:10, color:'#6C757D', marginTop:3, fontStyle:'italic' }}>
                          {item.extra}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Right: Detail */}
              <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
                {!selected ? (
                  <div style={{ textAlign:'center', padding:'60px 20px', color:'#6C757D' }}>
                    <div style={{ fontSize:52, marginBottom:16 }}>👈</div>
                    <div style={{ fontWeight:700, fontSize:15, color:'#2D3748' }}>Select an item to review</div>
                    <div style={{ fontSize:12, marginTop:6 }}>Click any pending approval on the left</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom:20, paddingBottom:16, borderBottom:'2px solid #E8E0E8' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <div style={{ fontSize:22, fontWeight:800, color:meta?.color }}>
                          {meta?.icon} {selected.docNo}
                        </div>
                        {selected.amount > 0 && (
                          <div style={{ fontSize:20, fontWeight:800, color:'#714B67' }}>
                            {INR(selected.amount)}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:13, color:'#6C757D' }}>
                        {selected.party}
                        {selected.submittedBy && ` · ${selected.submittedBy}`}
                        {selected.level && (
                          <span style={{ marginLeft:8, fontSize:10, fontWeight:700,
                            background:'#FFF3CD', color:'#856404', padding:'2px 7px', borderRadius:10 }}>
                            {selected.level}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ background:'#F8F9FA', border:'1px solid #E8E0E8',
                      borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        {[
                          ['Type',         meta?.label],
                          ['Party',        selected.party],
                          ...(selected.amount>0 ? [['Amount', INR(selected.amount)]] : []),
                          ['Submitted By', selected.submittedBy||'—'],
                          ['Date',         fmtD(selected.date)],
                          ['Module',       selected.module],
                          ...(selected.extra ? [['Details', selected.extra]] : []),
                          ...(selected.level ? [['Level', selected.level]] : []),
                        ].map(([k,v]) => (
                          <div key={k}>
                            <div style={{ fontSize:10, fontWeight:700, color:'#6C757D', textTransform:'uppercase', marginBottom:3 }}>{k}</div>
                            <div style={{ fontSize:13, fontWeight:600, color:'#2D3748' }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom:16 }}>
                      <label style={{ fontSize:11, fontWeight:700, color:'#6C757D',
                        textTransform:'uppercase', display:'block', marginBottom:6 }}>
                        Remark (required for rejection)
                      </label>
                      <textarea value={remark} onChange={e=>setRemark(e.target.value)}
                        rows={3} placeholder="Enter remark or rejection reason..."
                        style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #DDD',
                          borderRadius:6, fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' }} />
                    </div>

                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={()=>doAction('approve')} disabled={acting}
                        style={{ flex:1, padding:12, background:'#155724', color:'#fff',
                          border:'none', borderRadius:6, fontWeight:700, fontSize:14, cursor:'pointer' }}>
                        {acting ? '⏳...' : '✅ Approve'}
                      </button>
                      <button onClick={()=>doAction('reject')} disabled={acting}
                        style={{ flex:1, padding:12, background:'#721C24', color:'#fff',
                          border:'none', borderRadius:6, fontWeight:700, fontSize:14, cursor:'pointer' }}>
                        {acting ? '⏳...' : '❌ Reject'}
                      </button>
                      <button onClick={()=>{setSelected(null);setRemark('')}}
                        style={{ padding:'12px 18px', background:'#fff', color:'#6C757D',
                          border:'1px solid #DDD', borderRadius:6, cursor:'pointer', fontWeight:600 }}>✕</button>
                    </div>

                    <div style={{ marginTop:14, padding:'8px 12px', background:'#FFF3CD',
                      border:'1px solid #FFEAA7', borderRadius:6, fontSize:11, color:'#856404' }}>
                      ℹ️ Approve/Reject directly here — no need to navigate anywhere
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
