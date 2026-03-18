import React, { useState } from 'react'

export default function BalanceSheet() {
  const [open, setOpen] = useState({ca:true,fa:true,cl:true,lt:true,eq:true})
  const tog = k => setOpen(p=>({...p,[k]:!p[k]}))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Balance Sheet <small>As of 28 Feb 2025</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>28 Feb 2025</option><option>31 Jan 2025</option><option>31 Mar 2024</option></select>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-s sd-bsm">Print</button>
        </div>
      </div>

      <div className="fi-alert success">Balance Sheet balanced — Total Assets = Liabilities + Equity = <strong>₹1,45,14,000</strong></div>

      <div className="fi-panel-eq">
        {/* ASSETS */}
        <div className="fin-report">
          <div className="fin-report-hdr"><h2>ASSETS</h2><span>As on 28 Feb 2025</span></div>
          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('ca')}>{open.ca?'▾':'►'} CURRENT ASSETS</div>
            {open.ca && <>
              <div className="fin-row drillable"><span className="fn">Cash in Hand</span><span className="fv">₹40,000</span></div>
              <div className="fin-row drillable"><span className="fn">Bank — HDFC Current A/C</span><span className="fv">₹27,56,000</span></div>
              <div className="fin-row drillable"><span className="fn">Accounts Receivable (AR)</span><span className="fv">₹12,20,000</span></div>
              <div className="fin-row drillable"><span className="fn">GST Input Credit (ITC)</span><span className="fv">₹62,000</span></div>
              <div className="fin-row drillable"><span className="fn">Stock / Inventory (WM)</span><span className="fv">₹40,40,000</span></div>
              <div className="fin-row drillable"><span className="fn">Work-in-Progress (PP)</span><span className="fv">₹2,80,000</span></div>
              <div className="fin-row drillable"><span className="fn">Advance to Suppliers</span><span className="fv">₹2,80,000</span></div>
              <div className="fin-row drillable"><span className="fn">TDS Receivable</span><span className="fv">₹36,000</span></div>
              <div className="fin-row sub"><span className="fn">Total Current Assets</span><span className="fv pos">₹87,14,000</span></div>
            </>}
          </div>
          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('fa')}>{open.fa?'▾':'►'} FIXED ASSETS</div>
            {open.fa && <>
              <div className="fin-row drillable"><span className="fn">Plant & Machinery (Gross)</span><span className="fv">₹62,00,000</span></div>
              <div className="fin-row"><span className="fn">Less: Accumulated Depreciation</span><span className="fv neg">₹6,46,000</span></div>
              <div className="fin-row drillable"><span className="fn">Furniture & Fixtures</span><span className="fv">₹3,20,000</span></div>
              <div className="fin-row drillable"><span className="fn">Computers & IT Equipment</span><span className="fv">₹74,000</span></div>
              <div className="fin-row sub"><span className="fn">Net Fixed Assets</span><span className="fv pos">₹59,48,000</span></div>
            </>}
          </div>
          <div className="fin-row" style={{padding:'12px 20px',background:'#F8F9FA',fontSize:'13px'}}>
            <span className="fn">Capital WIP (PP Open Orders)</span><span className="fv">₹1,52,000</span>
          </div>
          <div className="fin-row gt"><span>TOTAL ASSETS</span><span className="fv">₹1,48,14,000</span></div>
        </div>

        {/* LIABILITIES + EQUITY */}
        <div className="fin-report">
          <div className="fin-report-hdr"><h2>⚖️ LIABILITIES & EQUITY</h2><span>As on 28 Feb 2025</span></div>
          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('cl')}>{open.cl?'▾':'►'} CURRENT LIABILITIES</div>
            {open.cl && <>
              <div className="fin-row drillable"><span className="fn">Accounts Payable (AP)</span><span className="fv">₹5,60,000</span></div>
              <div className="fin-row drillable"><span className="fn">GST Payable (Net)</span><span className="fv">₹5,64,000</span></div>
              <div className="fin-row"><span className="fn">Salary Payable (HCM)</span><span className="fv">₹84,000</span></div>
              <div className="fin-row"><span className="fn">TDS Payable</span><span className="fv">₹42,000</span></div>
              <div className="fin-row"><span className="fn">PF / ESI Payable</span><span className="fv">₹62,000</span></div>
              <div className="fin-row"><span className="fn">Advance from Customers (SD)</span><span className="fv">₹1,48,000</span></div>
              <div className="fin-row sub"><span className="fn">Total Current Liabilities</span><span className="fv">₹14,60,000</span></div>
            </>}
          </div>
          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('lt')}>{open.lt?'▾':'►'} LONG TERM LIABILITIES</div>
            {open.lt && <>
              <div className="fin-row drillable"><span className="fn">Term Loan — HDFC Bank</span><span className="fv">₹27,00,000</span></div>
              <div className="fin-row sub"><span className="fn">Total Long Term Liabilities</span><span className="fv">₹27,00,000</span></div>
            </>}
          </div>
          <div className="fin-section">
            <div className="fin-sec-title" onClick={() => tog('eq')}>{open.eq?'▾':'►'} SHAREHOLDERS EQUITY</div>
            {open.eq && <>
              <div className="fin-row"><span className="fn">Share Capital</span><span className="fv">₹50,00,000</span></div>
              <div className="fin-row"><span className="fn">Retained Earnings (Prior years)</span><span className="fv">₹42,10,000</span></div>
              <div className="fin-row"><span className="fn">Net Profit (Current Period)</span><span className="fv pos">₹10,44,000</span></div>
              <div className="fin-row sub"><span className="fn">Total Equity</span><span className="fv pos">₹1,02,54,000</span></div>
            </>}
          </div>
          <div className="fin-row gt"><span>TOTAL LIABILITIES + EQUITY</span><span className="fv">₹1,48,14,000</span></div>
        </div>
      </div>
    </div>
  )
}
