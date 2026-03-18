import React, { useState } from 'react'

const CC_DATA = {
  'Production': [
    {acct:'6100 · COGS',narr:'Material issued to WO-017 (WM)',dr:'₹6,20,000',cr:'',bal:'₹6,20,000'},
    {acct:'6110 · COGM Labour',narr:'Payroll — production workers Feb (HCM)',dr:'₹4,80,000',cr:'',bal:'₹11,00,000'},
    {acct:'6130 · Power & Fuel',narr:'Electricity bill Feb 2025',dr:'₹1,20,000',cr:'',bal:'₹12,20,000'},
    {acct:'6700 · Maintenance',narr:'Machine M-102 repair (PM)',dr:'₹48,000',cr:'',bal:'₹12,68,000'},
    {acct:'6400 · Depreciation',narr:'P&M depreciation Feb 2025',dr:'₹42,000',cr:'',bal:'₹13,10,000'},
  ],
  'Sales': [
    {acct:'6600 · Freight',narr:'Freight — ABC Textiles delivery (SD)',dr:'₹84,000',cr:'',bal:'₹84,000'},
    {acct:'6800 · Admin',narr:'Sales team expenses',dr:'₹32,000',cr:'',bal:'₹1,16,000'},
    {acct:'5100 · Revenue',narr:'Sales Revenue Feb 2025 (SD)',dr:'',cr:'₹48,60,000',bal:'₹47,44,000 Cr'},
  ],
  'Admin': [
    {acct:'6300 · Rent',narr:'Office rent Feb 2025',dr:'₹60,000',cr:'',bal:'₹60,000'},
    {acct:'6800 · Admin',narr:'Stationery & misc.',dr:'₹58,000',cr:'',bal:'₹1,18,000'},
    {acct:'6200 · Salary',narr:'Admin staff salary Feb (HCM)',dr:'₹1,80,000',cr:'',bal:'₹2,98,000'},
  ],
  'HR Dept': [
    {acct:'6200 · Salary',narr:'Total payroll Feb 2025 (HCM)',dr:'₹8,40,000',cr:'',bal:'₹8,40,000'},
    {acct:'6210 · PF',narr:'Provident Fund contribution Feb',dr:'₹1,00,800',cr:'',bal:'₹9,40,800'},
    {acct:'6220 · ESI',narr:'ESI contribution Feb',dr:'₹37,800',cr:'',bal:'₹9,78,600'},
  ],
  'Maintenance': [
    {acct:'6700 · Maintenance',narr:'Annual maintenance contract (PM)',dr:'₹18,000',cr:'',bal:'₹18,000'},
    {acct:'6700 · Maintenance',narr:'Machine M-102 emergency repair (PM)',dr:'₹30,000',cr:'',bal:'₹48,000'},
  ],
}

const CC_TOTALS = {
  'Production':  {total:'₹13,10,000',income:'₹0',net:'₹13,10,000 Cost'},
  'Sales':       {total:'₹1,16,000', income:'₹48,60,000',net:'₹47,44,000 Profit'},
  'Admin':       {total:'₹2,98,000', income:'₹0',net:'₹2,98,000 Cost'},
  'HR Dept':     {total:'₹9,78,600', income:'₹0',net:'₹9,78,600 Cost'},
  'Maintenance': {total:'₹48,000',   income:'₹0',net:'₹48,000 Cost'},
}

export default function CostCenterLedger() {
  const [cc, setCC] = useState('Production')
  const rows = CC_DATA[cc] || []
  const tot = CC_TOTALS[cc]

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Cost Center Ledger <small>Department-wise Expense View</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" value={cc} onChange={e => setCC(e.target.value)}>
            {Object.keys(CC_DATA).map(c => <option key={c}>{c}</option>)}
          </select>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        <div className="fi-kpi-card purple">
          <div className="fi-kpi-label">Cost Center</div>
          <div className="fi-kpi-value" style={{fontSize:'20px'}}>{cc}</div>
        </div>
        <div className="fi-kpi-card red">
          <div className="fi-kpi-label">Total Expenses</div>
          <div className="fi-kpi-value">{tot.total}</div>
        </div>
        <div className="fi-kpi-card green">
          <div className="fi-kpi-label">Net (Profit / Cost)</div>
          <div className="fi-kpi-value" style={{fontSize:'16px'}}>{tot.net}</div>
        </div>
      </div>

      <table className="fi-data-table">
        <thead><tr><th>Account</th><th>Narration / Source</th><th>Debit (₹)</th><th>Credit (₹)</th><th>Running Balance</th></tr></thead>
        <tbody>
          {rows.map((r,i) => (
            <tr key={i}>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.acct}</td>
              <td>{r.narr}</td>
              <td className="dr">{r.dr}</td>
              <td className="cr">{r.cr}</td>
              <td className="bal pos">{r.bal}</td>
            </tr>
          ))}
          <tr style={{background:'#EDE0EA',fontWeight:'700'}}>
            <td colSpan={2} style={{padding:'10px 14px',fontFamily:'Syne,sans-serif'}}>Cost Center Total — {cc}</td>
            <td className="dr">{tot.total}</td>
            <td className="cr">{tot.income}</td>
            <td style={{fontFamily:'Syne,sans-serif',fontSize:'14px',color:'var(--odoo-purple)'}}>{tot.net}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
