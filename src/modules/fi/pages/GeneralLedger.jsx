import React, { useState } from 'react'

const ACCOUNTS_LIST = [
  {code:'1100',name:'Cash in Hand'},
  {code:'1200',name:'Bank — HDFC Current'},
  {code:'1300',name:'Accounts Receivable (AR)'},
  {code:'1400',name:'Stock / Inventory'},
  {code:'1500',name:'Fixed Assets — P&M'},
  {code:'2100',name:'Accounts Payable (AP)'},
  {code:'2200',name:'GST Payable'},
  {code:'5100',name:'Sales Revenue'},
  {code:'6100',name:'COGS — Direct Material'},
  {code:'6200',name:'Salary & Wages'},
]

const LEDGER_DATA = {
  '1200': {
    name:'Bank — HDFC Current', opening:'₹18,42,000 Cr', totalDr:'₹5,93,000', totalCr:'₹15,07,000', closing:'₹27,56,000 Cr',
    rows:[
      {date:'01 Feb',jv:'—',narr:'Opening Balance',ref:'—',dr:'',cr:'',bal:'₹18,42,000 Cr',balCls:'pos'},
      {date:'05 Feb',jv:'JV-2025-0130',narr:'Payment to Lakshmi Textiles (MM)',ref:'PAY-018',dr:'₹66,000',cr:'',bal:'₹17,76,000 Cr',balCls:'pos'},
      {date:'10 Feb',jv:'JV-2025-0135',narr:'Receipt from ABC Textiles (SD)',ref:'REC-024',dr:'',cr:'₹4,72,000',bal:'₹22,48,000 Cr',balCls:'pos'},
      {date:'15 Feb',jv:'JV-2025-0138',narr:'Salary Feb advance (HCM)',ref:'SAL-002',dr:'₹4,20,000',cr:'',bal:'₹18,28,000 Cr',balCls:'pos'},
      {date:'20 Feb',jv:'JV-2025-0142',narr:'Receipt from MNO Fabrics (SD)',ref:'REC-028',dr:'',cr:'₹8,50,000',bal:'₹26,78,000 Cr',balCls:'pos'},
      {date:'26 Feb',jv:'JV-2025-0146',narr:'Receipt from XYZ Industries (SD)',ref:'REC-031',dr:'',cr:'₹1,85,000',bal:'₹28,63,000 Cr',balCls:'pos'},
      {date:'27 Feb',jv:'JV-2025-0147',narr:'Payment to Aruna Industries (MM)',ref:'PAY-022',dr:'₹48,500',cr:'',bal:'₹28,14,500 Cr',balCls:'pos'},
      {date:'28 Feb',jv:'JV-2025-0148',narr:'Bank charges Feb 2025',ref:'BNK-001',dr:'₹58,500',cr:'',bal:'₹27,56,000 Cr',balCls:'pos'},
    ]
  },
  '1300': {
    name:'Accounts Receivable (AR)', opening:'₹8,40,000 Dr', totalDr:'₹48,60,000', totalCr:'₹44,80,000', closing:'₹12,20,000 Dr',
    rows:[
      {date:'01 Feb',jv:'—',narr:'Opening Balance',ref:'—',dr:'',cr:'',bal:'₹8,40,000 Dr',balCls:'pos'},
      {date:'24 Feb',jv:'JV-2025-0144',narr:'Sales to MNO Fabrics INV-041 (SD)',ref:'INV-041',dr:'₹3,54,000',cr:'',bal:'₹11,94,000 Dr',balCls:'pos'},
      {date:'28 Feb',jv:'JV-2025-0148',narr:'Sales to ABC Textiles INV-042 (SD)',ref:'INV-042',dr:'₹2,36,000',cr:'',bal:'₹14,30,000 Dr',balCls:'pos'},
      {date:'20 Feb',jv:'JV-2025-0142',narr:'Payment received MNO Fabrics',ref:'REC-028',dr:'',cr:'₹8,50,000',bal:'₹5,80,000 Dr',balCls:'pos'},
      {date:'26 Feb',jv:'JV-2025-0146',narr:'Payment received XYZ Industries',ref:'REC-031',dr:'',cr:'₹1,85,000',bal:'₹3,95,000 Dr',balCls:'pos'},
      {date:'28 Feb',jv:'—',narr:'Closing Balance',ref:'—',dr:'',cr:'',bal:'₹12,20,000 Dr',balCls:'pos'},
    ]
  },
  '5100': {
    name:'Sales Revenue', opening:'₹0', totalDr:'₹0', totalCr:'₹48,60,000', closing:'₹48,60,000 Cr',
    rows:[
      {date:'24 Feb',jv:'JV-2025-0144',narr:'Sales to MNO Fabrics (SD)',ref:'INV-041',dr:'',cr:'₹3,00,000',bal:'₹3,00,000 Cr',balCls:'pos'},
      {date:'26 Feb',jv:'JV-2025-0145',narr:'Sales — surface treatment lot',ref:'INV-039',dr:'',cr:'₹28,00,000',bal:'₹31,00,000 Cr',balCls:'pos'},
      {date:'28 Feb',jv:'JV-2025-0148',narr:'Sales to ABC Textiles (SD)',ref:'INV-042',dr:'',cr:'₹2,00,000',bal:'₹33,00,000 Cr',balCls:'pos'},
      {date:'28 Feb',jv:'JV-2025-0149',narr:'Other sales — Feb 2025',ref:'—',dr:'',cr:'₹15,60,000',bal:'₹48,60,000 Cr',balCls:'pos'},
    ]
  },
}

export default function GeneralLedger() {
  const [acct, setAcct] = useState('1200')
  const data = LEDGER_DATA[acct] || LEDGER_DATA['1200']

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">General Ledger <small>FBL3N · Account Statement</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" value={acct} onChange={e => setAcct(e.target.value)}>
            {ACCOUNTS_LIST.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
          </select>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-filter-bar">
        <div className="fi-filter-search"><input placeholder="Search narration, JV no..."/></div>
        <input type="date" className="fi-filter-select" defaultValue="2025-02-01"/>
        <input type="date" className="fi-filter-select" defaultValue="2025-02-28"/>
        <button className="btn btn-s sd-bsm"> Reset</button>
      </div>

      <div className="acct-strip">
        {[
          {l:'Account',v:`${acct} · ${data.name}`},
          {l:'Opening Balance',v:data.opening},
          {l:'Total Debits (MTD)',v:data.totalDr},
          {l:'Total Credits (MTD)',v:data.totalCr},
          {l:'Closing Balance',v:data.closing},
        ].map(i => (
          <div key={i.l} className="acct-strip-item"><span>{i.l}</span><div>{i.v}</div></div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Date</th><th>JV No.</th><th>Narration</th><th>Ref</th>
          <th>Debit (₹)</th><th>Credit (₹)</th><th>Balance (₹)</th>
        </tr></thead>
        <tbody>
          {data.rows.map((r,i) => (
            <tr key={i} style={i===0||i===data.rows.length-1 ? {background:'#EDE0EA',fontWeight:'700'} : {}}>
              <td>{r.date}</td>
              <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)'}}>{r.jv}</span></td>
              <td>{r.narr}</td>
              <td style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{r.ref}</td>
              <td className="dr">{r.dr}</td>
              <td className="cr">{r.cr}</td>
              <td className={`bal ${r.balCls}`}>{r.bal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
