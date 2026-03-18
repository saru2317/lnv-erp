import React, { useState } from 'react'

const COA = [
  {grp:'📦 ASSETS (1xxx)', cls:'asset', items:[
    {code:'1100',name:'Cash in Hand',           type:'Current Asset',  bal:'₹40,000',  bc:'cr'},
    {code:'1200',name:'Bank — HDFC Current',    type:'Current Asset',  bal:'₹27,56,000',bc:'cr'},
    {code:'1210',name:'Bank — ICICI OD A/C',    type:'Current Asset',  bal:'₹0',        bc:'cr'},
    {code:'1300',name:'Accounts Receivable (AR)',type:'Current Asset', bal:'₹12,20,000',bc:'cr'},
    {code:'1310',name:'Advance to Customers',   type:'Current Asset',  bal:'₹1,20,000', bc:'cr'},
    {code:'1400',name:'Stock / Inventory',       type:'Current Asset', bal:'₹40,40,000',bc:'cr'},
    {code:'1410',name:'Work-in-Progress (PP)',   type:'Current Asset', bal:'₹2,80,000', bc:'cr'},
    {code:'1500',name:'Plant & Machinery',       type:'Fixed Asset',   bal:'₹61,58,000',bc:'cr'},
    {code:'1510',name:'Furniture & Fixtures',   type:'Fixed Asset',    bal:'₹3,20,000', bc:'cr'},
    {code:'1520',name:'Computers & IT',          type:'Fixed Asset',   bal:'₹74,000',   bc:'cr'},
    {code:'1600',name:'GST Input Credit (ITC)',  type:'Current Asset', bal:'₹62,000',   bc:'cr'},
    {code:'1700',name:'TDS Receivable',          type:'Current Asset', bal:'₹36,000',   bc:'cr'},
  ]},
  {grp:'⚖️ LIABILITIES (2xxx)', cls:'liab', items:[
    {code:'2100',name:'Accounts Payable (AP)',   type:'Current Liability',bal:'₹5,60,000', bc:'dr'},
    {code:'2110',name:'Advance from Customers',  type:'Current Liability',bal:'₹1,48,000', bc:'dr'},
    {code:'2200',name:'GST Payable (CGST)',       type:'Current Liability',bal:'₹2,82,000', bc:'dr'},
    {code:'2210',name:'GST Payable (SGST)',       type:'Current Liability',bal:'₹2,82,000', bc:'dr'},
    {code:'2220',name:'GST Payable (IGST)',       type:'Current Liability',bal:'₹0',         bc:'dr'},
    {code:'2300',name:'TDS Payable',              type:'Current Liability',bal:'₹42,000',   bc:'dr'},
    {code:'2310',name:'PF Payable',               type:'Current Liability',bal:'₹38,000',   bc:'dr'},
    {code:'2320',name:'ESI Payable',              type:'Current Liability',bal:'₹24,000',   bc:'dr'},
    {code:'2400',name:'Salary Payable',           type:'Current Liability',bal:'₹84,000',   bc:'dr'},
    {code:'2500',name:'Share Capital',            type:'Equity',           bal:'₹50,00,000',bc:'dr'},
    {code:'2600',name:'Retained Earnings',        type:'Equity',           bal:'₹52,54,000',bc:'dr'},
    {code:'2700',name:'Term Loan — HDFC',         type:'Long Term',        bal:'₹27,00,000',bc:'dr'},
  ]},
  {grp:'💰 INCOME (5xxx)', cls:'inc', items:[
    {code:'5100',name:'Sales Revenue',            type:'Income',   bal:'₹48,60,000',bc:'dr'},
    {code:'5110',name:'Service Revenue',          type:'Income',   bal:'₹0',         bc:'dr'},
    {code:'5200',name:'Other Income',             type:'Income',   bal:'₹24,000',   bc:'dr'},
    {code:'5300',name:'Interest Income',          type:'Income',   bal:'₹17,000',   bc:'dr'},
  ]},
  {grp:'💸 EXPENSES (6xxx)', cls:'exp', items:[
    {code:'6100',name:'COGS — Direct Material',   type:'COGS',     bal:'₹26,40,000',bc:'cr'},
    {code:'6110',name:'COGM — Direct Labour',     type:'COGM/PP',  bal:'₹4,80,000', bc:'cr'},
    {code:'6120',name:'COGM — Mfg Overhead',     type:'COGM/PP',   bal:'₹2,60,000', bc:'cr'},
    {code:'6130',name:'COGM — Power & Fuel',      type:'COGM/PP',  bal:'₹1,20,000', bc:'cr'},
    {code:'6200',name:'Salary & Wages',           type:'OpEx',     bal:'₹8,40,000', bc:'cr'},
    {code:'6210',name:'Provident Fund',           type:'OpEx',     bal:'₹1,00,800', bc:'cr'},
    {code:'6220',name:'ESI',                      type:'OpEx',     bal:'₹37,800',   bc:'cr'},
    {code:'6300',name:'Rent & Utilities',         type:'OpEx',     bal:'₹1,20,000', bc:'cr'},
    {code:'6400',name:'Depreciation',             type:'OpEx',     bal:'₹42,000',   bc:'cr'},
    {code:'6500',name:'Finance Charges',          type:'OpEx',     bal:'₹86,000',   bc:'cr'},
    {code:'6600',name:'Freight & Logistics',      type:'OpEx',     bal:'₹84,000',   bc:'cr'},
    {code:'6700',name:'Maintenance Expense (PM)', type:'PM',       bal:'₹48,000',   bc:'cr'},
    {code:'6800',name:'Admin & Other Expenses',   type:'OpEx',     bal:'₹90,000',   bc:'cr'},
    {code:'6900',name:'Quality Control (QM)',     type:'QM',       bal:'₹22,000',   bc:'cr'},
  ]},
]

export default function ChartOfAccounts() {
  const [open, setOpen] = useState({0:true,1:true,2:true,3:true})
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Chart of Accounts <small>Account Master · LNV Manufacturing</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => setShowAdd(!showAdd)}>➕ Add Account</button>
        </div>
      </div>

      {showAdd && (
        <div className="fi-form-sec" style={{marginBottom:'14px'}}>
          <div className="fi-form-sec-hdr">➕ New Account</div>
          <div className="fi-form-sec-body">
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Account Code <span>*</span></label><input className="fi-form-ctrl" placeholder="e.g. 6910"/></div>
              <div className="fi-form-grp"><label>Account Name <span>*</span></label><input className="fi-form-ctrl" placeholder="Account description"/></div>
              <div className="fi-form-grp"><label>Account Group</label>
                <select className="fi-form-ctrl"><option>Asset</option><option>Liability</option><option>Income</option><option>Expense</option></select>
              </div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Account Type</label>
                <select className="fi-form-ctrl"><option>Current Asset</option><option>Fixed Asset</option><option>Current Liability</option><option>Long Term</option><option>Equity</option><option>Income</option><option>COGS</option><option>COGM/PP</option><option>OpEx</option><option>PM</option><option>QM</option></select>
              </div>
              <div className="fi-form-grp"><label>Normal Balance</label>
                <select className="fi-form-ctrl"><option>Debit</option><option>Credit</option></select>
              </div>
              <div className="fi-form-grp" style={{justifyContent:'flex-end'}}>
                <label>&nbsp;</label>
                <div style={{display:'flex',gap:'8px'}}>
                  <button className="btn btn-s sd-bsm" onClick={() => setShowAdd(false)}>Cancel</button>
                  <button className="btn btn-p sd-bsm">✅ Save Account</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {COA.map((grp, gi) => (
        <div key={gi} className="coa-group">
          <div className="coa-grp-hdr" onClick={() => setOpen(p=>({...p,[gi]:!p[gi]}))}>
            {open[gi]?'▾':'►'} {grp.grp}
            <span style={{marginLeft:'auto',fontSize:'11px',fontWeight:'400',color:'var(--odoo-gray)'}}>{grp.items.length} accounts</span>
          </div>
          {open[gi] && (
            <div className="coa-items">
              {grp.items.map(item => (
                <div key={item.code} className="coa-item">
                  <span>
                    <span className="ca-code">{item.code}</span>
                    {item.name}
                    <span style={{fontSize:'10px',background:'#F0EEEB',padding:'1px 6px',borderRadius:'8px',marginLeft:'8px',color:'var(--odoo-gray)'}}>{item.type}</span>
                  </span>
                  <span className={`ca-bal ${item.bc}`}>{item.bal} {item.bc==='cr'?'Dr':'Cr'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
