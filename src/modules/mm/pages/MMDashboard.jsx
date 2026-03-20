import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function MMDashboard() {
  const nav = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">MM · Materials Management <small>Dashboard</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/grn/new')}>Record GRN</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/po/new')}>＋ New PO</button>
        </div>
      </div>
      <div className="mm-alert warn"> <strong>5 Purchase Orders</strong> are pending GRN for more than 7 days.{' '}
        <span onClick={() => nav('/mm/po/pending')} style={{cursor:'pointer',textDecoration:'underline',fontWeight:700}}>View Pending POs →</span>
      </div>
      <div className="mm-kpi-grid">
        {[
          {cls:'pur',ic:'',lb:'Purchase Orders (MTD)',val:'₹28.4L',sub:'18 POs · 3 pending approval',to:'/mm/po'},
          {cls:'grn',ic:'',lb:'GRN Received (MTD)',  val:'₹21.6L',sub:'14 GRNs · 4 POs awaiting',to:'/mm/grn'},
          {cls:'orn',ic:'',lb:'Vendor Invoices Due', val:'₹8.2L', sub:'6 invoices · 2 overdue',to:'/mm/invoices'},
          {cls:'blu',ic:'',lb:'Active Vendors',      val:'24',    sub:'3 new this month',to:'/mm/vendors'},
        ].map(k => (
          <div key={k.lb} className={`mm-kpi ${k.cls}`} onClick={() => nav(k.to)}>
            <div className="mm-kpi-ic">{k.ic}</div>
            <div className="mm-kpi-lb">{k.lb}</div>
            <div className="mm-kpi-val">{k.val}</div>
            <div className="mm-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="mm-pg-grid">
        <div className="mm-panel">
          <div className="mm-ph"><h3>Recent Purchase Orders</h3><button className="btn btn-s sd-bsm" onClick={() => nav('/mm/po')}>View All</button></div>
          <table className="mm-tbl">
            <thead><tr><th>PO No.</th><th>Vendor</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {[
                {id:'PO-2025-042',v:'Lakshmi Textile Mills', a:'₹4,85,000',b:'mm-bdg-approved',l:'Approved'},
                {id:'PO-2025-041',v:'Coimbatore Spares Co.',  a:'₹1,20,000',b:'mm-bdg-sent',    l:'Sent'},
                {id:'PO-2025-040',v:'Sri Murugan Traders',    a:'₹2,36,500',b:'mm-bdg-received', l:'GRN Done'},
                {id:'PO-2025-039',v:'Aruna Industries',       a:'₹88,200',  b:'mm-bdg-partial',  l:'Partial GRN'},
                {id:'PO-2025-038',v:'KG Denim Ltd.',          a:'₹6,42,000',b:'mm-bdg-draft',    l:'Draft'},
              ].map(p => (
                <tr key={p.id} onClick={() => nav(`/mm/po/${p.id}`)}>
                  <td><strong style={{color:'var(--odoo-purple)',fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{p.id}</strong></td>
                  <td>{p.v}</td><td><strong>{p.a}</strong></td>
                  <td><span className={`mm-badge ${p.b}`}>{p.l}</span></td>
                  <td onClick={e=>e.stopPropagation()}><button className="btn-xs">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mm-panel">
          <div className="mm-ph"><h3>Vendor Payables</h3><button className="btn btn-s sd-bsm" onClick={() => nav('/mm/vendors/ledger')}>View Ledger</button></div>
          <div className="mm-pb">
            {[
              {n:'Lakshmi Textile Mills', p:80, c:'var(--odoo-red)',    b:'mm-bdg-overdue',l:'₹1,42,000'},
              {n:'Coimbatore Spares Co.', p:55, c:'var(--odoo-orange)', b:'mm-bdg-pending',l:'₹88,500'},
              {n:'Sri Murugan Traders',   p:30, c:'var(--odoo-purple)', b:'mm-bdg-pending',l:'₹36,200'},
              {n:'Aruna Industries',      p:100,c:'var(--odoo-green)',  b:'mm-bdg-paid',   l:'Paid'},
            ].map(v => (
              <div key={v.n} style={{marginBottom:'10px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px',fontSize:'12px'}}>
                  <span>{v.n}</span><span className={`mm-badge ${v.b}`}>{v.l}</span>
                </div>
                <div style={{height:'6px',background:'#F0EEEB',borderRadius:'3px'}}>
                  <div style={{width:`${v.p}%`,height:'100%',background:v.c,borderRadius:'3px'}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mm-panel">
        <div className="mm-ph"><h3> Quick Actions</h3></div>
        <div className="mm-pb" style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/po/new')}>New Purchase Order</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/grn/new')}>Record GRN</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/invoices/new')}>Enter Vendor Invoice</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/vendors/new')}>Add Vendor</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/rfq')}> Create RFQ</button>
        </div>
      </div>
    </div>
  )
}
