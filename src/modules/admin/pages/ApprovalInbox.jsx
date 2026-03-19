import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const PENDING = [
  { id:'PR-2026-042', type:'PR', typeLabel:'Purchase Indent', amount:284500, submittedBy:'Production Supervisor', submittedOn:'16 Mar 2026', dept:'Production', level:1, levelLabel:'HOD Review', daysWaiting:2, escalated:true,  desc:'Powder Coat — RAL 9005 × 500Kg + Chemicals' },
  { id:'PO-2026-089', type:'PO', typeLabel:'Purchase Order',  amount:952000, submittedBy:'Purchase Manager',     submittedOn:'15 Mar 2026', dept:'Purchase',   level:2, levelLabel:'GM Approval', daysWaiting:1, escalated:false, desc:'Lakshmi Textile Mills — Raw Material Supply' },
  { id:'SO-2026-124', type:'SO', typeLabel:'Sales Order',     amount:437190, submittedBy:'Sales Executive',      submittedOn:'17 Mar 2026', dept:'Sales',       level:1, levelLabel:'Sales Mgr', daysWaiting:0, escalated:false,  desc:'Ashok Leyland — Powder Coated Brackets × 500' },
  { id:'PV-2026-031', type:'PV', typeLabel:'Payment Voucher', amount:142000, submittedBy:'Accounts Exec',        submittedOn:'14 Mar 2026', dept:'Finance',     level:2, levelLabel:'GM Approval', daysWaiting:3, escalated:true,  desc:'Lakshmi Textile Mills — Invoice Settlement' },
  { id:'PR-2026-041', type:'PR', typeLabel:'Purchase Indent', amount:48500,  submittedBy:'Maintenance HOD',      submittedOn:'17 Mar 2026', dept:'Maintenance', level:1, levelLabel:'HOD Review', daysWaiting:0, escalated:false, desc:'Spare Parts — Conveyor Bearing × 4, Belt × 2' },
]

const HISTORY = [
  { id:'PO-2026-085', type:'PO', typeLabel:'Purchase Order',  amount:380000, action:'Approved', actionBy:'GM', actionOn:'15 Mar 2026', level:2 },
  { id:'PR-2026-039', type:'PR', typeLabel:'Purchase Indent', amount:92000,  action:'Rejected', actionBy:'HOD', actionOn:'14 Mar 2026', level:1, reason:'Budget exceeded for this month' },
  { id:'SO-2026-122', type:'SO', typeLabel:'Sales Order',     amount:142800, action:'Approved', actionBy:'Sales Mgr', actionOn:'13 Mar 2026', level:1 },
  { id:'PV-2026-029', type:'PV', typeLabel:'Payment Voucher', amount:285000, action:'Approved', actionBy:'GM', actionOn:'12 Mar 2026', level:2 },
]

const TYPE_COLORS = {
  PR: { bg:'#1A5276', label:'Purchase Indent'  },
  PO: { bg:'#196F3D', label:'Purchase Order'   },
  SO: { bg:'#714B67', label:'Sales Order'      },
  PV: { bg:'#784212', label:'Payment Voucher'  },
}

export default function ApprovalInbox() {
  const navigate = useNavigate()
  const [view, setView]     = useState('pending')
  const [filter, setFilter] = useState('All')
  const [items, setItems]   = useState(PENDING)

  const approve = id => {
    setItems(is => is.filter(i => i.id !== id))
    toast.success(`${id} Approved! Next level notified.`)
  }

  const reject = id => {
    setItems(is => is.filter(i => i.id !== id))
    toast.error(`${id} Rejected. Submitter notified.`)
  }

  const filtered = filter==='All' ? items : items.filter(i => i.type===filter)
  const totalAmt = filtered.reduce((s,i) => s+i.amount, 0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Approval Inbox
          <small>Pending approvals · Escalations · History</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm"
            onClick={() => navigate('/config/approvals')}>
            Configure Workflows
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)', marginBottom:16}}>
        {[
          { cls:'red',    l:'Pending Approvals', v:items.length,  s:'Requires your action' },
          { cls:'orange', l:'Escalated',         v:items.filter(i=>i.escalated).length, s:'Past due date' },
          { cls:'purple', l:'Pending Value',     v:'₹'+Math.round(totalAmt/1000)+'K', s:'Total amount' },
          { cls:'green',  l:'Approved Today',    v:3, s:'By all approvers' },
        ].map(k => (
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:0, borderBottom:'2px solid var(--odoo-border)', marginBottom:16}}>
        {[['pending','Pending',items.length],['history','History',HISTORY.length]].map(([k,l,c]) => (
          <button key={k} onClick={() => setView(k)}
            style={{padding:'9px 20px', fontSize:12, fontWeight:600, cursor:'pointer',
              border:'none', background:'transparent',
              borderBottom: view===k ? '2px solid var(--odoo-purple)' : '2px solid transparent',
              color: view===k ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
              marginBottom:-2, display:'flex', alignItems:'center', gap:6}}>
            {l}
            <span style={{padding:'1px 7px', borderRadius:10, fontSize:10, fontWeight:700,
              background: view===k ? 'var(--odoo-purple)' : '#eee',
              color: view===k ? '#fff' : '#666'}}>{c}</span>
          </button>
        ))}
      </div>

      {/* Filter pills */}
      {view === 'pending' && (
        <div style={{display:'flex', gap:6, marginBottom:14, flexWrap:'wrap'}}>
          {['All','PR','PO','SO','PV'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{padding:'4px 14px', borderRadius:20, fontSize:11, fontWeight:600,
                cursor:'pointer', border:'1px solid var(--odoo-border)',
                background: filter===f ? 'var(--odoo-dark)' : '#fff',
                color: filter===f ? '#fff' : 'var(--odoo-gray)'}}>
              {f === 'All' ? 'All Types' : TYPE_COLORS[f]?.label || f}
            </button>
          ))}
        </div>
      )}

      {/* PENDING */}
      {view === 'pending' && (
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {filtered.length === 0 && (
            <div style={{padding:40, textAlign:'center', color:'var(--odoo-gray)', fontSize:13}}>
              No pending approvals. You are all caught up!
            </div>
          )}
          {filtered.map(item => {
            const tc = TYPE_COLORS[item.type] || { bg:'#555' }
            return (
              <div key={item.id} style={{background:'#fff', border:'1px solid var(--odoo-border)',
                borderRadius:8, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                borderLeft: item.escalated ? '4px solid var(--odoo-red)' : '4px solid '+tc.bg}}>
                <div style={{padding:'12px 16px'}}>
                  <div style={{display:'flex', justifyContent:'space-between',
                    alignItems:'flex-start', marginBottom:10}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      {/* Type badge */}
                      <span style={{padding:'4px 10px', borderRadius:6, fontSize:11,
                        fontWeight:700, background:tc.bg, color:'#fff'}}>{item.type}</span>
                      {/* Doc ID */}
                      <span style={{fontFamily:'DM Mono,monospace', fontSize:13, fontWeight:700,
                        color:'var(--odoo-purple)'}}>{item.id}</span>
                      {/* Escalated badge */}
                      {item.escalated && (
                        <span style={{padding:'2px 8px', borderRadius:8, fontSize:10,
                          fontWeight:700, background:'#F8D7DA', color:'#721C24'}}>
                          ESCALATED
                        </span>
                      )}
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800,
                        color:'var(--odoo-purple)'}}>
                        ₹{item.amount.toLocaleString('en-IN')}
                      </div>
                      <div style={{fontSize:10, color:'var(--odoo-gray)'}}>
                        {item.dept} · {item.submittedBy}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{fontSize:12, color:'var(--odoo-dark)', marginBottom:8, fontWeight:500}}>
                    {item.desc}
                  </div>

                  {/* Meta row */}
                  <div style={{display:'flex', gap:16, fontSize:11, color:'var(--odoo-gray)',
                    marginBottom:12, flexWrap:'wrap'}}>
                    <span>Submitted: <strong>{item.submittedOn}</strong></span>
                    <span>Level: <strong style={{color:'var(--odoo-purple)'}}>{item.level} — {item.levelLabel}</strong></span>
                    <span style={{color: item.daysWaiting >= 2 ? 'var(--odoo-red)' : 'var(--odoo-gray)',
                      fontWeight: item.daysWaiting >= 2 ? 700 : 400}}>
                      Waiting: <strong>{item.daysWaiting} day{item.daysWaiting!==1?'s':''}</strong>
                      {item.daysWaiting >= 2 && ' ⚠️ Escalation threshold reached'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{display:'flex', gap:8}}>
                    <button onClick={() => approve(item.id)}
                      style={{padding:'7px 20px', background:'var(--odoo-green)', color:'#fff',
                        border:'none', borderRadius:6, fontWeight:700, fontSize:13,
                        cursor:'pointer', display:'flex', alignItems:'center', gap:5}}>
                      ✓ Approve
                    </button>
                    <button onClick={() => reject(item.id)}
                      style={{padding:'7px 16px', background:'var(--odoo-red)', color:'#fff',
                        border:'none', borderRadius:6, fontWeight:700, fontSize:13,
                        cursor:'pointer'}}>
                      ✕ Reject
                    </button>
                    <button onClick={() => toast.success(`Opening ${item.id}...`)}
                      style={{padding:'7px 14px', background:'#fff', color:'var(--odoo-purple)',
                        border:'1px solid var(--odoo-purple)', borderRadius:6, fontSize:12,
                        cursor:'pointer'}}>
                      View Document
                    </button>
                    <button onClick={() => toast.success(`${item.id} forwarded to next level!`)}
                      style={{padding:'7px 14px', background:'#fff', color:'var(--odoo-gray)',
                        border:'1px solid var(--odoo-border)', borderRadius:6, fontSize:12,
                        cursor:'pointer'}}>
                      Forward
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* HISTORY */}
      {view === 'history' && (
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>Document</th><th>Type</th><th>Amount</th>
              <th>Level</th><th>Action</th><th>By</th><th>Date</th><th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((h,i) => (
              <tr key={h.id} style={{background:i%2===0?'#fff':'#FAFAFA'}}>
                <td style={{fontFamily:'DM Mono,monospace', fontWeight:700,
                  color:'var(--odoo-purple)', fontSize:12}}>{h.id}</td>
                <td>
                  <span style={{padding:'2px 8px', borderRadius:6, fontSize:10,
                    fontWeight:700, background:TYPE_COLORS[h.type]?.bg||'#555', color:'#fff'}}>
                    {h.type}
                  </span>
                </td>
                <td style={{fontFamily:'DM Mono,monospace', fontWeight:700,
                  color:'var(--odoo-purple)'}}>
                  ₹{h.amount.toLocaleString('en-IN')}
                </td>
                <td style={{textAlign:'center'}}>L{h.level}</td>
                <td>
                  <span style={{padding:'2px 8px', borderRadius:8, fontSize:11, fontWeight:700,
                    background: h.action==='Approved'?'#D4EDDA':'#F8D7DA',
                    color: h.action==='Approved'?'#155724':'#721C24'}}>
                    {h.action}
                  </span>
                </td>
                <td style={{fontSize:11}}>{h.actionBy}</td>
                <td style={{fontSize:11}}>{h.actionOn}</td>
                <td style={{fontSize:11, color:'var(--odoo-gray)'}}>{h.reason||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
