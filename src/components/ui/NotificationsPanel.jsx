import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Live API only — no hardcoded notifications
const ALL_NOTIFICATIONS = []

const TYPE_CONFIG = {
  critical: { color:'#721C24', bg:'#F8D7DA', border:'#F5C6CB', dot:'#D9534F', label:'Critical' },
  warning:  { color:'#856404', bg:'#FFF3CD', border:'#FFEEBA', dot:'#E06F39', label:'Warning'  },
  info:     { color:'#0C5460', bg:'#D1ECF1', border:'#BEE5EB', dot:'#017E84', label:'Info'     },
  success:  { color:'#155724', bg:'#D4EDDA', border:'#C3E6CB', dot:'#00A09D', label:'Success'  },
}

const MODULE_COLORS = {
  FI:'#196F3D', SD:'#714B67', MM:'#1A5276', PP:'#784212',
  QM:'#6C3483', PM:'#117A65', TM:'#E06F39', HCM:'#6C3483',
}

export default function NotificationsPanel() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [open, setOpen]       = useState(false)
  const [filter, setFilter]   = useState('all')
  const [pendingApprovals, setPendingApprovals] = useState([])
  const panelRef = useRef(null)

  // Fetch live pending approvals
  const fetchApprovals = async () => {
    try {
      const tok = localStorage.getItem('lnv_token')
      if (!tok) return
      const r = await fetch(`${BASE}/fi/my-approvals`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      const d = await r.json()
      const approvals = (d.data || []).map(a => ({
        id:     `APPROVAL-${a.type}-${a.id}`,
        type:   'critical',
        module: a.module || 'FI',
        icon:   a.type === 'LEAVE' ? '🏖' : a.type === 'WO' ? '⚙️' : a.type === 'VENDOR_INVOICE' ? '📦' : '🧾',
        title:  `Pending Approval: ${a.docNo}`,
        body:   `${a.party} · ${a.amount > 0 ? '₹'+Number(a.amount).toLocaleString('en-IN') : ''} · ${a.submittedBy || ''}`,
        path:   a.actionUrl || '/admin/approvals',
        time:   'Pending',
        read:   false,
        roles:  ['admin','accounts','sales','hr','production','manager','operations'],
        isApproval: true,
      }))
      setPendingApprovals(approvals)
    } catch {}
  }

  useEffect(() => {
    fetchApprovals()
    const t = setInterval(fetchApprovals, 30000)
    return () => clearInterval(t)
  }, [])

  // All notifs = live approvals only
  const allNotifs = [...pendingApprovals]

  // Filter by role — normalize both sides to lowercase for safety
  const userRole = (user?.role || '').toLowerCase()
  const roleNotifs = allNotifs.filter(n =>
    !userRole || n.roles.map(r => r.toLowerCase()).includes(userRole)
  )

  // Apply tab filter
  const displayed = roleNotifs.filter(n => {
    if (filter === 'unread')   return !n.read
    if (filter === 'critical') return n.type === 'critical' || n.type === 'warning'
    return true
  })

  const unreadCount = roleNotifs.filter(n => !n.read).length

  const markRead = (id) => setPendingApprovals(ns => ns.map(n => n.id === id ? {...n, read:true} : n))
  const markAllRead = () => setPendingApprovals(ns => ns.map(n => ({...n, read:true})))
  const dismiss = (id, e) => { e.stopPropagation(); setPendingApprovals(ns => ns.filter(n => n.id !== id)) }

  const handleClick = (notif) => {
    markRead(notif.id)
    setOpen(false)
    navigate(notif.path)
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={panelRef} style={{ position:'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        style={{
          width:34, height:34, borderRadius:4,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', color: open ? '#fff' : 'rgba(255,255,255,.78)',
          fontSize:15, position:'relative', border:'none',
          background: open ? 'rgba(255,255,255,.2)' : 'transparent',
          transition:'all .15s',
        }}
        onMouseEnter={e => { if(!open) e.currentTarget.style.background='rgba(255,255,255,.12)' }}
        onMouseLeave={e => { if(!open) e.currentTarget.style.background='transparent' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position:'absolute', top:4, right:4,
            minWidth:14, height:14, padding:'0 3px',
            background:'var(--odoo-red)',
            borderRadius:7, border:'2px solid var(--odoo-purple)',
            fontSize:7, color:'#fff', fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center',
            lineHeight:1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:9999,
          width:420, background:'#fff', borderRadius:10,
          boxShadow:'0 12px 40px rgba(0,0,0,.18)',
          border:'1px solid var(--odoo-border)',
          overflow:'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding:'14px 16px', borderBottom:'1px solid var(--odoo-border)',
            background:'linear-gradient(135deg,#4A3050,#714B67)',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontFamily:'Tahoma,Verdana,sans-serif', fontSize:14, fontWeight:800, color:'#fff' }}>
                 Notifications
                {unreadCount > 0 && (
                  <span style={{ marginLeft:8, background:'var(--odoo-red)', color:'#fff',
                    borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  style={{ background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)',
                    color:'#fff', fontSize:11, padding:'3px 10px', borderRadius:5,
                    cursor:'pointer', fontFamily:'Tahoma,Verdana,sans-serif', fontWeight:600 }}>
                   Mark all read
                </button>
              )}
            </div>
            {/* Filter tabs */}
            <div style={{ display:'flex', gap:6 }}>
              {[['all','All'],['unread','Unread'],['critical','Alerts']].map(([k,l]) => (
                <div key={k} onClick={() => setFilter(k)}
                  style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                    cursor:'pointer', transition:'all .15s',
                    background: filter===k ? '#fff' : 'rgba(255,255,255,.15)',
                    color: filter===k ? 'var(--odoo-purple)' : 'rgba(255,255,255,.8)',
                    border:`1px solid ${filter===k ? '#fff' : 'rgba(255,255,255,.25)'}` }}>
                  {l}
                  {k==='unread' && unreadCount>0 &&
                    <span style={{ marginLeft:4, background:'var(--odoo-red)', color:'#fff',
                      borderRadius:8, padding:'0 5px', fontSize:9 }}>{unreadCount}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight:380, overflowY:'auto' }}>
            {displayed.length === 0 ? (
              <div style={{ padding:'32px 16px', textAlign:'center', color:'var(--odoo-gray)' }}>
                <div style={{ fontSize:32, marginBottom:8 }}></div>
                <div style={{ fontSize:13, fontWeight:600 }}>
                  {filter==='unread' ? 'All caught up!' : 'No notifications'}
                </div>
                <div style={{ fontSize:11, marginTop:4 }}>
                  {filter==='unread' ? 'No unread notifications' : 'Nothing here yet'}
                </div>
              </div>
            ) : (
              displayed.map((notif, i) => {
                const tc = TYPE_CONFIG[notif.type]
                const mc = MODULE_COLORS[notif.module] || '#714B67'
                return (
                  <div key={notif.id}
                    onClick={() => handleClick(notif)}
                    style={{
                      display:'flex', gap:10, padding:'11px 14px',
                      cursor:'pointer', transition:'background .15s',
                      background: notif.read ? '#fff' : '#FDF8FC',
                      borderBottom:'1px solid var(--odoo-border)',
                      borderLeft: `3px solid ${notif.read ? 'transparent' : tc.dot}`,
                      position:'relative',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='#F9F4F8'}
                    onMouseLeave={e => e.currentTarget.style.background=notif.read?'#fff':'#FDF8FC'}>

                    {/* Icon badge */}
                    <div style={{
                      width:36, height:36, borderRadius:9, flexShrink:0,
                      background: tc.bg, display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:18,
                      border:`1px solid ${tc.border}`,
                    }}>
                      {notif.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:2 }}>
                        <div style={{ fontSize:12, fontWeight: notif.read ? 600 : 700,
                          color:'var(--odoo-dark)', lineHeight:1.3, flex:1, paddingRight:8 }}>
                          {notif.title}
                          {!notif.read && (
                            <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%',
                              background:tc.dot, marginLeft:5, verticalAlign:'middle' }} />
                          )}
                        </div>
                        {/* Dismiss */}
                        <span onClick={(e) => dismiss(notif.id, e)}
                          style={{ fontSize:12, color:'#CCC', cursor:'pointer', flexShrink:0, lineHeight:1,
                            padding:'2px 4px', borderRadius:3, transition:'all .1s' }}
                          onMouseEnter={e => e.currentTarget.style.color='var(--odoo-red)'}
                          onMouseLeave={e => e.currentTarget.style.color='#CCC'}>
                          
                        </span>
                      </div>

                      <div style={{ fontSize:11, color:'var(--odoo-gray)', lineHeight:1.4, marginBottom:5 }}>
                        {notif.body}
                      </div>

                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {/* Module chip */}
                        <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:8,
                          background:`${mc}18`, color:mc, border:`1px solid ${mc}30` }}>
                          {notif.module}
                        </span>
                        {/* Type chip */}
                        <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:8,
                          background:tc.bg, color:tc.color }}>
                          {tc.label}
                        </span>
                        {/* Time */}
                        <span style={{ fontSize:10, color:'var(--odoo-gray)', marginLeft:'auto' }}>
                          {notif.time}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding:'10px 16px', borderTop:'1px solid var(--odoo-border)',
            background:'#F8F9FA', display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <span style={{ fontSize:11, color:'var(--odoo-gray)' }}>
              {roleNotifs.length} total · {unreadCount} unread
            </span>
            <button
              onClick={() => { setOpen(false); navigate('/admin/audit') }}
              style={{ fontSize:11, fontWeight:600, color:'var(--odoo-purple)',
                background:'none', border:'none', cursor:'pointer', padding:'4px 8px',
                borderRadius:4, transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#EDE0EA'}
              onMouseLeave={e => e.currentTarget.style.background='none'}>
              View All Activity →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
