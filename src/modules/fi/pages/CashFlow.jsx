import React, { useState } from 'react'

export default function CashFlow() {
  const [open, setOpen] = useState({op:true,inv:true,fin:true})
  const tog = k => setOpen(p=>({...p,[k]:!p[k]}))
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Cash Flow Statement <small>February 2025</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>Feb 2025</option><option>Q3 FY25</option><option>FY 2024-25</option></select>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>
      <div style={{maxWidth:'700px'}}>
        <div className="fin-report">
          <div className="fin-report-hdr"><h2>💧 Cash Flow Statement (Indirect Method)</h2><span>Month ended 28 Feb 2025</span></div>

          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('op')}>{open.op?'▾':'►'} A. CASH FROM OPERATING ACTIVITIES</div>
            {open.op && <>
              <div className="fin-row"><span className="fn">Net Profit (PAT)</span><span className="fv pos">₹10,44,000</span></div>
              <div className="fin-row" style={{background:'#F8F9FA',fontWeight:'600',paddingLeft:'20px'}}><span className="fn">Adjustments for non-cash items:</span></div>
              <div className="fin-row l2"><span className="fn">+ Depreciation</span><span className="fv">₹42,000</span></div>
              <div className="fin-row l2"><span className="fn">+ COGM Provisions (PP)</span><span className="fv">₹28,000</span></div>
              <div className="fin-row" style={{background:'#F8F9FA',fontWeight:'600',paddingLeft:'20px'}}><span className="fn">Changes in Working Capital:</span></div>
              <div className="fin-row l2"><span className="fn">Decrease in Accounts Receivable (AR)</span><span className="fv pos">₹2,20,000</span></div>
              <div className="fin-row l2"><span className="fn">Increase in Accounts Payable (AP)</span><span className="fv pos">₹1,40,000</span></div>
              <div className="fin-row l2"><span className="fn">Increase in Inventory (WM)</span><span className="fv neg">₹2,00,000</span></div>
              <div className="fin-row l2"><span className="fn">Increase in WIP (PP)</span><span className="fv neg">₹1,20,000</span></div>
              <div className="fin-row l2"><span className="fn">Increase in GST Payable</span><span className="fv pos">₹62,000</span></div>
              <div className="fin-row l2"><span className="fn">Increase in TDS / PF Payable</span><span className="fv pos">₹24,000</span></div>
              <div className="fin-row sub"><span className="fn">Net Cash from Operations</span><span className="fv pos">₹12,40,000</span></div>
            </>}
          </div>

          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('inv')}>{open.inv?'▾':'►'} B. CASH FROM INVESTING ACTIVITIES</div>
            {open.inv && <>
              <div className="fin-row"><span className="fn">Purchase of Fixed Assets (PM capex)</span><span className="fv neg">₹0</span></div>
              <div className="fin-row"><span className="fn">Proceeds from Asset Sale</span><span className="fv">₹0</span></div>
              <div className="fin-row sub"><span className="fn">Net Cash from Investing</span><span className="fv">₹0</span></div>
            </>}
          </div>

          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('fin')}>{open.fin?'▾':'►'} C. CASH FROM FINANCING ACTIVITIES</div>
            {open.fin && <>
              <div className="fin-row"><span className="fn">Term Loan Repayment (HDFC)</span><span className="fv neg">₹1,20,000</span></div>
              <div className="fin-row"><span className="fn">Dividend Paid</span><span className="fv">₹0</span></div>
              <div className="fin-row sub"><span className="fn">Net Cash from Financing</span><span className="fv neg">₹1,20,000</span></div>
            </>}
          </div>

          <div className="fin-row" style={{padding:'10px 20px',fontWeight:'700',background:'#F8F9FA'}}>
            <span>Opening Cash Balance (01 Feb)</span>
            <span style={{color:'var(--odoo-blue)',fontFamily:'Syne,sans-serif'}}>₹18,42,000</span>
          </div>
          <div className="fin-row" style={{padding:'10px 20px',fontWeight:'700'}}>
            <span>Net Increase in Cash</span>
            <span style={{color:'var(--odoo-green)',fontFamily:'Syne,sans-serif'}}>₹11,20,000</span>
          </div>
          <div className="fin-row gt"><span>CLOSING CASH BALANCE (28 Feb)</span><span className="fv">₹29,62,000</span></div>
        </div>
      </div>
    </div>
  )
}
