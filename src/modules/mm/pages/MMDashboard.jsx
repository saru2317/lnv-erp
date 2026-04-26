import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { mmApi } from '../services/mmApi'

const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN')
const fmtL = n => '₹'+(Number(n||0)/100000).toFixed(1)+'L'

export default function MMDashboard() {
  const nav = useNavigate()
  const [stats,   setStats]   = useState(null)
  const [pos,     setPOs]     = useState([])
  const [invs,    setInvs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    Promise.all([
      mmApi.dashboard(),
      mmApi.getPOList(),
      mmApi.getInvoices('?status=PENDING'),
    ]).then(([dash, poData, invData])=>{
      setStats(dash)
      setPOs((poData.data||[]).slice(0,5))
      setInvs((invData.data||[]).slice(0,5))
    }).catch(e=>toast.error(e.message))
      .finally(()=>setLoading(false))
  },[])

  if (loading) return (
    <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>
      ⏳ Loading MM Dashboard...
    </div>
  )

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">MM · Materials Management <small>Dashboard</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm"
            onClick={()=>nav('/mm/grn/new')}>📦 Record GRN</button>
          <button className="btn btn-p sd-bsm"
            onClick={()=>nav('/mm/po/new')}>＋ New PO</button>
        </div>
      </div>

      {stats?.pendingGRN>0 && (
        <div className="mm-alert warn">
          ⚠️ <strong>{stats.pendingGRN} Purchase Orders</strong> are
          pending GRN.{' '}
          <span onClick={()=>nav('/mm/po/pending')}
            style={{ cursor:'pointer', textDecoration:'underline',
              fontWeight:700 }}>View Pending POs →</span>
        </div>
      )}

      <div className="mm-kpi-grid">
        {[
          { cls:'pur', ic:'🛒', lb:'Purchase Orders (MTD)',
            val: fmtL(stats?.poMTD?.amount||0),
            sub:`${stats?.poMTD?.count||0} POs · ${stats?.pendingPO||0} pending`,
            to:'/mm/po' },
          { cls:'grn', ic:'📦', lb:'GRN Received (MTD)',
            val:`${stats?.grnMTD?.count||0} GRNs`,
            sub:`${stats?.pendingGRN||0} POs awaiting receipt`,
            to:'/mm/grn' },
          { cls:'orn', ic:'🧾', lb:'Vendor Invoices Due',
            val:fmtL(stats?.pendingInv?.amount||0),
            sub:`${stats?.pendingInv?.count||0} invoices · ${stats?.overdue||0} overdue`,
            to:'/mm/invoices' },
          { cls:'blu', ic:'🏢', lb:'Pending Actions',
            val:((stats?.pendingPO||0)+(stats?.overdue||0)),
            sub:'POs to approve + overdue invoices',
            to:'/mm/po' },
        ].map(k=>(
          <div key={k.lb} className={`mm-kpi ${k.cls}`}
            onClick={()=>nav(k.to)}>
            <div className="mm-kpi-ic">{k.ic}</div>
            <div className="mm-kpi-lb">{k.lb}</div>
            <div className="mm-kpi-val">{k.val}</div>
            <div className="mm-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="mm-pg-grid">
        {/* Recent POs */}
        <div className="mm-panel">
          <div className="mm-ph">
            <h3>Recent Purchase Orders</h3>
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav('/mm/po')}>View All</button>
          </div>
          {pos.length===0 ? (
            <div style={{ padding:30, textAlign:'center', color:'#6C757D',
              fontSize:12 }}>No POs yet</div>
          ) : (
            <table className="mm-tbl">
              <thead>
                <tr><th>PO No.</th><th>Vendor</th><th>Amount</th>
                  <th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {pos.map(p=>(
                  <tr key={p.id} onClick={()=>nav(`/mm/po/${p.id}`)}>
                    <td><strong style={{ color:'var(--odoo-purple)',
                      fontFamily:'DM Mono,monospace', fontSize:11 }}>
                      {p.poNo}</strong></td>
                    <td style={{ fontSize:12 }}>{p.vendorName}</td>
                    <td><strong>{fmtC(p.totalAmount)}</strong></td>
                    <td><span style={{ padding:'2px 6px', borderRadius:8,
                      fontSize:10, fontWeight:700,
                      background:p.status==='DRAFT'?'#E9ECEF':'#D4EDDA',
                      color:p.status==='DRAFT'?'#383D41':'#155724' }}>
                      {p.status}</span></td>
                    <td onClick={e=>e.stopPropagation()}>
                      <button className="btn-xs">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Vendor Payables */}
        <div className="mm-panel">
          <div className="mm-ph">
            <h3>Vendor Payables</h3>
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav('/mm/invoices')}>View All</button>
          </div>
          {invs.length===0 ? (
            <div style={{ padding:30, textAlign:'center', color:'#6C757D',
              fontSize:12 }}>No pending invoices</div>
          ) : (
            <div className="mm-pb">
              {invs.map(inv=>{
                const isOverdue = inv.dueDate &&
                  new Date(inv.dueDate)<new Date()
                return (
                  <div key={inv.id} style={{ display:'flex',
                    alignItems:'center', gap:10,
                    padding:'10px 0',
                    borderBottom:'1px solid #F0EEF0' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>
                        {inv.vendorName}</div>
                      <div style={{ fontSize:11, color:'#6C757D' }}>
                        {inv.invNo} · Due: {inv.dueDate
                          ?new Date(inv.dueDate).toLocaleDateString('en-IN')
                          :'—'}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:800, fontSize:14,
                        color:isOverdue?'#DC3545':'#856404',
                        fontFamily:'DM Mono,monospace' }}>
                        {fmtC(inv.balance)}</div>
                      {isOverdue && (
                        <span style={{ fontSize:10, color:'#DC3545',
                          fontWeight:700 }}>OVERDUE</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
