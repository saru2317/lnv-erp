import React from 'react'

const TB_ROWS = [
  {grp:'ASSETS', rows:[]},
  {code:'1100',name:'Cash in Hand',           oDr:'',          oCr:'',          pDr:'₹2,20,000', pCr:'₹1,80,000', cDr:'₹40,000',     cCr:''},
  {code:'1200',name:'Bank — HDFC Current',    oDr:'₹18,42,000',oCr:'',          pDr:'₹15,07,000',pCr:'₹5,93,000', cDr:'₹27,56,000',  cCr:''},
  {code:'1300',name:'Accounts Receivable',    oDr:'₹8,40,000', oCr:'',          pDr:'₹48,60,000',pCr:'₹44,80,000',cDr:'₹12,20,000',  cCr:''},
  {code:'1400',name:'Stock / Inventory',      oDr:'₹38,40,000',oCr:'',          pDr:'₹8,60,000', pCr:'₹6,60,000', cDr:'₹40,40,000',  cCr:''},
  {code:'1500',name:'Fixed Assets — P&M',     oDr:'₹62,00,000',oCr:'',          pDr:'',          pCr:'₹42,000',   cDr:'₹61,58,000',  cCr:''},
  {grp:'LIABILITIES', rows:[]},
  {code:'2100',name:'Accounts Payable (AP)',   oDr:'',          oCr:'₹4,20,000', pDr:'₹28,40,000',pCr:'₹29,80,000',cDr:'',            cCr:'₹5,60,000'},
  {code:'2200',name:'GST Payable',            oDr:'',          oCr:'₹2,40,000', pDr:'₹3,24,000', pCr:'₹6,48,000', cDr:'',            cCr:'₹5,64,000'},
  {code:'2300',name:'Share Capital',          oDr:'',          oCr:'₹50,00,000',pDr:'',          pCr:'',          cDr:'',            cCr:'₹50,00,000'},
  {code:'2400',name:'Term Loan — HDFC',       oDr:'',          oCr:'₹28,20,000',pDr:'₹1,20,000', pCr:'',          cDr:'',            cCr:'₹27,00,000'},
  {code:'2500',name:'TDS Payable',            oDr:'',          oCr:'₹84,000',   pDr:'₹84,000',   pCr:'₹1,26,000', cDr:'',            cCr:'₹42,000'},
  {grp:'INCOME', rows:[]},
  {code:'5100',name:'Sales Revenue',          oDr:'',          oCr:'',          pDr:'',          pCr:'₹48,60,000',cDr:'',            cCr:'₹48,60,000'},
  {code:'5200',name:'Other Income',           oDr:'',          oCr:'',          pDr:'',          pCr:'₹24,000',   cDr:'',            cCr:'₹24,000'},
  {grp:'EXPENSES', rows:[]},
  {code:'6100',name:'COGS — Direct Material', oDr:'',          oCr:'',          pDr:'₹28,40,000',pCr:'',          cDr:'₹28,40,000',  cCr:''},
  {code:'6110',name:'COGM — Mfg Cost (PP)',   oDr:'',          oCr:'',          pDr:'₹6,20,000', pCr:'',          cDr:'₹6,20,000',   cCr:''},
  {code:'6200',name:'Salary & Wages',         oDr:'',          oCr:'',          pDr:'₹8,40,000', pCr:'',          cDr:'₹8,40,000',   cCr:''},
  {code:'6300',name:'Rent & Utilities',       oDr:'',          oCr:'',          pDr:'₹1,20,000', pCr:'',          cDr:'₹1,20,000',   cCr:''},
  {code:'6400',name:'Depreciation',           oDr:'',          oCr:'',          pDr:'₹42,000',   pCr:'',          cDr:'₹42,000',     cCr:''},
  {code:'6500',name:'Finance Charges',        oDr:'',          oCr:'',          pDr:'₹24,000',   pCr:'',          cDr:'₹24,000',     cCr:''},
  {code:'6600',name:'Freight & Logistics',    oDr:'',          oCr:'',          pDr:'₹84,000',   pCr:'',          cDr:'₹84,000',     cCr:''},
  {code:'6700',name:'Maintenance Expense (PM)',oDr:'',         oCr:'',          pDr:'₹48,000',   pCr:'',          cDr:'₹48,000',     cCr:''},
  {code:'6800',name:'Admin & Other Expenses', oDr:'',          oCr:'',          pDr:'₹90,000',   pCr:'',          cDr:'₹90,000',     cCr:''},
]

export default function TrialBalance() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Trial Balance <small>As of 28 Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export Excel</button>
          <button className="btn btn-s sd-bsm">🖨️ Print</button>
        </div>
      </div>

      <div className="fi-alert success">✅ Trial Balance is balanced — Total Debits = Total Credits = <strong>₹1,97,32,000</strong></div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Code</th><th>Account Name</th>
          <th>Opening Dr</th><th>Opening Cr</th>
          <th>Period Dr</th><th>Period Cr</th>
          <th>Closing Dr</th><th>Closing Cr</th>
        </tr></thead>
        <tbody>
          {TB_ROWS.map((r,i) => r.grp ? (
            <tr key={i}><td colSpan={8} style={{background:'#EDE0EA',fontWeight:'700',padding:'8px 14px',color:'var(--odoo-purple)',fontFamily:'Syne,sans-serif'}}>{r.grp}</td></tr>
          ) : (
            <tr key={i}>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-gray)'}}>{r.code}</td>
              <td>{r.name}</td>
              <td className="dr">{r.oDr}</td><td className="cr">{r.oCr}</td>
              <td className="dr">{r.pDr}</td><td className="cr">{r.pCr}</td>
              <td className="dr">{r.cDr}</td><td className="cr">{r.cCr}</td>
            </tr>
          ))}
          <tr style={{background:'#F8F9FA',fontWeight:'700',fontFamily:'Syne,sans-serif'}}>
            <td colSpan={2}>TOTALS</td>
            <td className="dr">₹1,27,22,000</td><td className="cr">₹85,64,000</td>
            <td className="dr">₹1,54,59,000</td><td className="cr">₹1,45,13,000</td>
            <td className="dr" style={{fontSize:'14px',color:'var(--odoo-purple)'}}>₹1,97,32,000</td>
            <td className="cr" style={{fontSize:'14px',color:'var(--odoo-purple)'}}>₹1,97,32,000</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
