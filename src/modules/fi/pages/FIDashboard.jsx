import React from 'react'
import { useNavigate } from 'react-router-dom'

const CHART_MONTHS = [
  {m:'Sep',rev:65,exp:55},{m:'Oct',rev:52,exp:44},{m:'Nov',rev:70,exp:60},
  {m:'Dec',rev:80,exp:67},{m:'Jan',rev:75,exp:63},{m:'Feb',rev:100,exp:83},
]

export default function FIDashboard() {
  const nav = useNavigate()
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">FI Dashboard <small>Finance Overview · Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/pl')}>📊 P&amp;L</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/bs')}>⚖️ Balance Sheet</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/fi/jv/new')}>📓 New Journal</button>
        </div>
      </div>

      <div className="fi-kpi-grid">
        {[
          {cls:'purple',ic:'📈',lb:'Revenue (MTD)',     val:'₹48.6L', sub:'↑ 12% vs last month'},
          {cls:'green', ic:'💰',lb:'Net Profit (MTD)',  val:'₹8.4L',  sub:'Margin: 17.3%'},
          {cls:'orange',ic:'👥',lb:'Receivables (AR)',  val:'₹12.2L', sub:'3 overdue invoices'},
          {cls:'red',   ic:'🏭',lb:'Payables (AP)',     val:'₹5.8L',  sub:'2 overdue payments'},
        ].map(k => (
          <div key={k.lb} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-icon">{k.ic}</div>
            <div className="fi-kpi-label">{k.lb}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Revenue vs Expense Chart */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3>📊 Revenue vs Expenses (Last 6 Months)</h3>
          </div>
          <div className="chart-wrap">
            <div style={{display:'flex',gap:'12px',marginBottom:'10px',fontSize:'11px'}}>
              <span style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'10px',height:'10px',background:'var(--odoo-purple)',borderRadius:'2px',display:'inline-block'}}></span>Revenue</span>
              <span style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'10px',height:'10px',background:'var(--odoo-orange)',borderRadius:'2px',display:'inline-block'}}></span>Expenses</span>
              <span style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'10px',height:'10px',background:'var(--odoo-green)',borderRadius:'2px',display:'inline-block'}}></span>Net Profit</span>
            </div>
            <div className="chart-bars">
              {CHART_MONTHS.map(c => (
                <React.Fragment key={c.m}>
                  <div className="cb-col">
                    <div className="cb-bar" style={{height:`${c.rev}%`,background:'var(--odoo-purple)'}}></div>
                    <div className="cb-label">{c.m}</div>
                  </div>
                  <div className="cb-col">
                    <div className="cb-bar" style={{height:`${c.exp}%`,background:'var(--odoo-orange)'}}></div>
                    <div className="cb-label">{c.m}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* GST Summary */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3>🧾 GST Summary · Feb 2025</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/gstr3b')}>View GSTR-3B</button>
          </div>
          <div className="fi-panel-body">
            <div style={{marginBottom:'10px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}><span>Output GST (Sales)</span><strong style={{color:'var(--odoo-red)'}}>₹6,48,000</strong></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}><span>Input GST / ITC (Purchases)</span><strong style={{color:'var(--odoo-green)'}}>₹3,24,000</strong></div>
              <div style={{borderTop:'1px solid var(--odoo-border)',marginTop:'8px',paddingTop:'8px',display:'flex',justifyContent:'space-between',fontSize:'13px',fontWeight:'700'}}>
                <span>Net GST Payable</span>
                <strong style={{color:'var(--odoo-purple)',fontFamily:'Syne,sans-serif',fontSize:'18px'}}>₹3,24,000</strong>
              </div>
            </div>
            <div style={{display:'flex',gap:'6px',marginTop:'10px'}}>
              {[{l:'CGST',v:'₹1,62,000',bg:'#EDE0EA',c:'var(--odoo-purple)'},{l:'SGST',v:'₹1,62,000',bg:'#EBF5FB',c:'var(--odoo-blue)'},{l:'IGST',v:'₹0',bg:'#FEF5E7',c:'var(--odoo-orange)'}].map(g=>(
                <div key={g.l} style={{flex:1,textAlign:'center',background:g.bg,borderRadius:'6px',padding:'8px'}}>
                  <div style={{fontSize:'10px',color:'var(--odoo-gray)',fontWeight:'700'}}>{g.l}</div>
                  <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',color:g.c,fontSize:'14px'}}>{g.v}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-p sd-bsm" style={{width:'100%',marginTop:'10px'}} onClick={() => nav('/fi/gst-pay')}>💳 Pay GST Now</button>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px',marginBottom:'14px'}}>
        {[
          {lb:'Gross Margin',v:'45.8%',c:'var(--odoo-green)'},{lb:'Net Profit Margin',v:'17.3%',c:'var(--odoo-green)'},
          {lb:'EBITDA Margin',v:'21.9%',c:'var(--odoo-green)'},{lb:'OpEx Ratio',v:'24.1%',c:'var(--odoo-orange)'},
          {lb:'Revenue Growth (MoM)',v:'↑ 11.7%',c:'var(--odoo-green)'},{lb:'Current Ratio',v:'6.93',c:'var(--odoo-green)'},
        ].map(r=>(
          <div key={r.lb} style={{background:'#fff',borderRadius:'8px',padding:'12px 16px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'12px',color:'var(--odoo-gray)'}}>{r.lb}</span>
            <strong style={{color:r.c,fontFamily:'Syne,sans-serif'}}>{r.v}</strong>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="fi-panel">
        <div className="fi-panel-hdr"><h3>⚡ Quick Actions</h3></div>
        <div className="fi-panel-body" style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/fi/jv/new')}>📓 New Journal Entry</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/pl')}>📊 View P&amp;L</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/bs')}>⚖️ Balance Sheet</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/gstr3b')}>🧾 GSTR-3B</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/ar-aging')}>👥 AR Aging</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/bank-recon')}>🏦 Bank Recon</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/inter-module')}>🔗 Module Journals</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/cogm')}>🏭 COGM Report</button>
        </div>
      </div>
    </div>
  )
}
