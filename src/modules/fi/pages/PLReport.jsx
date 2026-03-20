import React, { useState } from 'react'

export default function PLReport() {
  const [open, setOpen] = useState({income:true,cogs:true,mfg:true,opex:true,fin:true})
  const tog = k => setOpen(p => ({...p,[k]:!p[k]}))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Profit & Loss Statement <small>February 2025</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>Feb 2025</option><option>Jan 2025</option><option>Q3 FY25</option><option>FY 2024-25</option></select>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-s sd-bsm">Print</button>
        </div>
      </div>

      <div className="fi-panel-eq">
        {/* P&L Statement */}
        <div className="fin-report">
          <div className="fin-report-hdr"><h2>Profit & Loss Account</h2><span>Month ended 28 Feb 2025</span></div>

          {/* INCOME */}
          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('income')}>{open.income?'▾':'►'} INCOME</div>
            {open.income && <>
              <div className="fin-row drillable"><span className="fn">Sales Revenue (Net of Returns)</span><span className="fv pos">₹48,60,000</span></div>
              <div className="fin-row l2"><span className="fn" style={{fontSize:'12px',color:'var(--odoo-gray)'}}>B2B Sales</span><span className="fv" style={{fontSize:'12px'}}>₹41,20,000</span></div>
              <div className="fin-row l2"><span className="fn" style={{fontSize:'12px',color:'var(--odoo-gray)'}}>B2C Sales</span><span className="fv" style={{fontSize:'12px'}}>₹7,40,000</span></div>
              <div className="fin-row"><span className="fn">Other Income</span><span className="fv">₹24,000</span></div>
              <div className="fin-row sub"><span className="fn">Total Income</span><span className="fv" style={{color:'var(--odoo-green)'}}>₹48,84,000</span></div>
            </>}
          </div>

          {/* COGS */}
          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('cogs')}>{open.cogs?'▾':'►'} COST OF GOODS SOLD (COGS)</div>
            {open.cogs && <>
              <div className="fin-row"><span className="fn">Opening Stock</span><span className="fv">₹38,40,000</span></div>
              <div className="fin-row"><span className="fn">+ Purchases (Raw Material — MM)</span><span className="fv">₹28,40,000</span></div>
              <div className="fin-row"><span className="fn">− Closing Stock (WM)</span><span className="fv neg">₹40,40,000</span></div>
              <div className="fin-row sub"><span className="fn">Total COGS</span><span className="fv neg">₹26,40,000</span></div>
            </>}
          </div>

          {/* COGM from PP */}
          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('mfg')}>{open.mfg?'▾':'►'} COST OF GOODS MANUFACTURED (COGM — from PP)</div>
            {open.mfg && <>
              <div className="fin-row drillable"><span className="fn">Direct Material Consumed (WM → PP)</span><span className="fv">₹18,40,000</span></div>
              <div className="fin-row drillable"><span className="fn">Direct Labour (HCM Payroll)</span><span className="fv">₹4,80,000</span></div>
              <div className="fin-row drillable"><span className="fn">Manufacturing Overhead</span><span className="fv">₹2,60,000</span></div>
              <div className="fin-row l2"><span className="fn" style={{fontSize:'12px',color:'var(--odoo-gray)'}}>Power & Fuel</span><span className="fv" style={{fontSize:'12px'}}>₹1,20,000</span></div>
              <div className="fin-row l2"><span className="fn" style={{fontSize:'12px',color:'var(--odoo-gray)'}}>Maintenance Repairs (PM)</span><span className="fv" style={{fontSize:'12px'}}>₹48,000</span></div>
              <div className="fin-row l2"><span className="fn" style={{fontSize:'12px',color:'var(--odoo-gray)'}}>Quality Control (QM)</span><span className="fv" style={{fontSize:'12px'}}>₹22,000</span></div>
              <div className="fin-row l2"><span className="fn" style={{fontSize:'12px',color:'var(--odoo-gray)'}}>Factory Depreciation</span><span className="fv" style={{fontSize:'12px'}}>₹42,000</span></div>
              <div className="fin-row l2"><span className="fn" style={{fontSize:'12px',color:'var(--odoo-gray)'}}>Other Factory Overhead</span><span className="fv" style={{fontSize:'12px'}}>₹28,000</span></div>
              <div className="fin-row sub"><span className="fn">Total COGM</span><span className="fv neg">₹25,80,000</span></div>
            </>}
          </div>

          {/* OPERATING EXPENSES */}
          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('opex')}>{open.opex?'▾':'►'} OPERATING EXPENSES</div>
            {open.opex && <>
              <div className="fin-row drillable"><span className="fn">Salary & Wages (HCM)</span><span className="fv">₹8,40,000</span></div>
              <div className="fin-row"><span className="fn">Rent & Utilities</span><span className="fv">₹1,20,000</span></div>
              <div className="fin-row"><span className="fn">Freight & Logistics (SD)</span><span className="fv">₹84,000</span></div>
              <div className="fin-row"><span className="fn">Admin & Other Expenses</span><span className="fv">₹90,000</span></div>
              <div className="fin-row sub"><span className="fn">Total OpEx</span><span className="fv neg">₹11,34,000</span></div>
            </>}
          </div>

          <div className="fin-row" style={{padding:'12px 20px',background:'#F8F9FA',fontWeight:'700',fontSize:'14px'}}>
            <span>EBITDA</span>
            <span style={{color:'var(--odoo-green)',fontFamily:'Syne,sans-serif',fontSize:'18px'}}>₹11,30,000</span>
          </div>

          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('fin')}>{open.fin?'▾':'►'} FINANCE COSTS</div>
            {open.fin && <>
              <div className="fin-row"><span className="fn">Bank Interest</span><span className="fv">₹24,000</span></div>
              <div className="fin-row"><span className="fn">Loan Interest (Term Loan)</span><span className="fv">₹62,000</span></div>
              <div className="fin-row sub"><span className="fn">Total Finance Costs</span><span className="fv neg">₹86,000</span></div>
            </>}
          </div>

          <div className="fin-row gt"><span>NET PROFIT (PAT)</span><span className="fv">₹10,44,000</span></div>
        </div>

        {/* Ratios + Breakdown */}
        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3> Key Ratios</h3></div>
            <div className="fi-panel-body">
              {[
                {l:'Gross Margin',v:'45.8%',c:'var(--odoo-green)'},
                {l:'Net Profit Margin',v:'21.4%',c:'var(--odoo-green)'},
                {l:'EBITDA Margin',v:'23.1%',c:'var(--odoo-green)'},
                {l:'COGM % of Revenue',v:'52.9%',c:'var(--odoo-orange)'},
                {l:'OpEx Ratio',v:'23.2%',c:'var(--odoo-orange)'},
                {l:'Revenue Growth (MoM)',v:'↑ 11.7%',c:'var(--odoo-green)'},
              ].map(r=>(
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F0EEEB',fontSize:'13px'}}>
                  <span>{r.l}</span><strong style={{color:r.c}}>{r.v}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>Cost Breakdown</h3></div>
            <div className="fi-panel-body">
              {[
                {l:'COGS',v:'54%',pct:54,c:'var(--odoo-purple)'},
                {l:'COGM',v:'53%',pct:53,c:'var(--odoo-blue)'},
                {l:'Salary',v:'17%',pct:17,c:'var(--odoo-orange)'},
                {l:'Net Profit',v:'21%',pct:21,c:'var(--odoo-green)'},
              ].map(r=>(
                <div key={r.l} style={{marginBottom:'10px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'3px'}}><span>{r.l}</span><span>{r.v}</span></div>
                  <div style={{background:'#F0EEEB',borderRadius:'4px',height:'8px'}}>
                    <div style={{width:`${r.pct}%`,height:'100%',background:r.c,borderRadius:'4px'}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
