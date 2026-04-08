import React, { useState } from 'react'

const COA = [
  { grp:' ASSETS (1xxx)', cls:'asset', items:[
    { code:'1100', name:'Cash in Hand',            type:'Current Asset',   bal:'₹40,000',   bc:'cr' },
    { code:'1200', name:'Bank — HDFC Current',     type:'Current Asset',   bal:'₹27,56,000',bc:'cr' },
    { code:'1210', name:'Bank — ICICI OD A/C',     type:'Current Asset',   bal:'₹0',         bc:'cr' },
    { code:'1300', name:'Accounts Receivable (AR)',type:'Current Asset',   bal:'₹12,20,000',bc:'cr' },
    { code:'1310', name:'Advance to Customers',    type:'Current Asset',   bal:'₹1,20,000', bc:'cr' },
    { code:'1400', name:'Stock / Inventory',        type:'Current Asset',  bal:'₹40,40,000',bc:'cr' },
    { code:'1410', name:'Work-in-Progress (PP)',    type:'Current Asset',  bal:'₹2,80,000', bc:'cr' },
    { code:'1500', name:'Plant & Machinery',        type:'Fixed Asset',    bal:'₹61,58,000',bc:'cr' },
    { code:'1510', name:'Furniture & Fixtures',    type:'Fixed Asset',     bal:'₹3,20,000', bc:'cr' },
    { code:'1520', name:'Computers & IT',           type:'Fixed Asset',    bal:'₹74,000',   bc:'cr' },
    { code:'1600', name:'GST Input Credit (ITC)',   type:'Current Asset',  bal:'₹62,000',   bc:'cr' },
    { code:'1700', name:'TDS Receivable',           type:'Current Asset',  bal:'₹36,000',   bc:'cr' },
  ]},
  { grp:' LIABILITIES (2xxx)', cls:'liab', items:[
    { code:'2100', name:'Accounts Payable (AP)',    type:'Current Liability',bal:'₹5,60,000', bc:'dr' },
    { code:'2110', name:'Advance from Customers',   type:'Current Liability',bal:'₹1,48,000', bc:'dr' },
    { code:'2200', name:'GST Payable (CGST)',        type:'Current Liability',bal:'₹2,82,000', bc:'dr' },
    { code:'2210', name:'GST Payable (SGST)',        type:'Current Liability',bal:'₹2,82,000', bc:'dr' },
    { code:'2220', name:'GST Payable (IGST)',        type:'Current Liability',bal:'₹0',         bc:'dr' },
    { code:'2300', name:'TDS Payable',               type:'Current Liability',bal:'₹42,000',   bc:'dr' },
    { code:'2310', name:'PF Payable',                type:'Current Liability',bal:'₹38,000',   bc:'dr' },
    { code:'2320', name:'ESI Payable',               type:'Current Liability',bal:'₹24,000',   bc:'dr' },
    { code:'2400', name:'Salary Payable',            type:'Current Liability',bal:'₹84,000',   bc:'dr' },
    { code:'2500', name:'Share Capital',             type:'Equity',           bal:'₹50,00,000',bc:'dr' },
    { code:'2600', name:'Retained Earnings',         type:'Equity',           bal:'₹52,54,000',bc:'dr' },
    { code:'2700', name:'Term Loan — HDFC',          type:'Long Term',        bal:'₹27,00,000',bc:'dr' },
  ]},
  { grp:' INCOME (5xxx)', cls:'inc', items:[
    { code:'5100', name:'Sales Revenue',             type:'Income',   bal:'₹48,60,000',bc:'dr' },
    { code:'5110', name:'Service Revenue',           type:'Income',   bal:'₹0',         bc:'dr' },
    { code:'5200', name:'Other Income',              type:'Income',   bal:'₹24,000',   bc:'dr' },
    { code:'5300', name:'Interest Income',           type:'Income',   bal:'₹17,000',   bc:'dr' },
  ]},
  { grp:' EXPENSES (6xxx)', cls:'exp', items:[
    { code:'6100', name:'COGS — Direct Material',    type:'COGS',     bal:'₹26,40,000',bc:'cr' },
    { code:'6110', name:'COGM — Direct Labour',      type:'COGM/PP',  bal:'₹4,80,000', bc:'cr' },
    { code:'6120', name:'COGM — Mfg Overhead',       type:'COGM/PP',  bal:'₹2,60,000', bc:'cr' },
    { code:'6130', name:'COGM — Power & Fuel',       type:'COGM/PP',  bal:'₹1,20,000', bc:'cr' },
    { code:'6200', name:'Salary & Wages',            type:'OpEx',     bal:'₹8,40,000', bc:'cr' },
    { code:'6210', name:'Provident Fund',            type:'OpEx',     bal:'₹1,00,800', bc:'cr' },
    { code:'6220', name:'ESI',                       type:'OpEx',     bal:'₹37,800',   bc:'cr' },
    { code:'6300', name:'Rent & Utilities',          type:'OpEx',     bal:'₹1,20,000', bc:'cr' },
    { code:'6400', name:'Depreciation',              type:'OpEx',     bal:'₹42,000',   bc:'cr' },
    { code:'6500', name:'Finance Charges',           type:'OpEx',     bal:'₹86,000',   bc:'cr' },
    { code:'6600', name:'Freight & Logistics',       type:'OpEx',     bal:'₹84,000',   bc:'cr' },
    { code:'6700', name:'Maintenance Expense (PM)',  type:'PM',       bal:'₹48,000',   bc:'cr' },
    { code:'6800', name:'Admin & Other Expenses',    type:'OpEx',     bal:'₹90,000',   bc:'cr' },
    { code:'6900', name:'Quality Control (QM)',      type:'QM',       bal:'₹22,000',   bc:'cr' },
  ]},
]

// ── Layer 2: Month-wise summary per account ──────────────────
const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
function genMonthData(code) {
  const seed = parseInt(code) % 7 + 1
  return MONTHS.map((m, i) => {
    const dr = Math.round((seed * 12000 + i * 8000 + Math.sin(i+seed)*5000) * 10) / 10
    const cr = Math.round((seed * 8000  + i * 4000 + Math.cos(i+seed)*3000) * 10) / 10
    return { month: m, dr: dr > 0 ? dr : 0, cr: cr > 0 ? cr : 0, bal: dr - cr }
  })
}

// ── Layer 3: Transaction list per month ──────────────────────
const VOUCHER_TYPES = ['JV','PV','RV','SB','PB','CN','DN']
const NARRATIONS = [
  'Being purchase of materials','Being salary paid','Being rent paid',
  'Being sales invoice raised','Being payment received','Being journal entry',
  'Being GST payment','Being bank charges debited','Being advance adjusted',
]
function genTxns(code, month) {
  const seed = parseInt(code) % 5 + 2
  return Array.from({ length: seed + 3 }, (_, i) => ({
    date: `${String(i + 1).padStart(2,'0')}-${month}-2025`,
    voucher: `${VOUCHER_TYPES[(parseInt(code)+i)%7]}-${String(1000+parseInt(code)+i).slice(1)}`,
    narration: NARRATIONS[(parseInt(code)+i) % NARRATIONS.length],
    dr: i % 3 === 0 ? Math.round((parseInt(code) * 100 + i * 500)) : 0,
    cr: i % 3 !== 0 ? Math.round((parseInt(code) * 80  + i * 400)) : 0,
  }))
}

// ── Breadcrumb ───────────────────────────────────────────────
function Breadcrumb({ items, onNavigate }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6,
      fontSize:12, color:'#6C757D', marginBottom:14, flexWrap:'wrap' }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color:'#CCC' }}>›</span>}
          <span
            onClick={() => i < items.length-1 ? onNavigate(i) : null}
            style={{
              color: i < items.length-1 ? '#714B67' : '#1C1C1C',
              cursor: i < items.length-1 ? 'pointer' : 'default',
              fontWeight: i === items.length-1 ? 700 : 400,
              textDecoration: i < items.length-1 ? 'underline' : 'none',
            }}>
            {item}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

// ── Layer 3: Transactions ────────────────────────────────────
function TransactionView({ account, month, onBack }) {
  const txns  = genTxns(account.code, month)
  const totDr = txns.reduce((s,t)=>s+t.dr,0)
  const totCr = txns.reduce((s,t)=>s+t.cr,0)

  return (
    <div>
      <Breadcrumb
        items={['Chart of Accounts', account.code + ' · ' + account.name, month + ' 2025']}
        onNavigate={(i) => i === 0 ? onBack('root') : onBack('account')}
      />

      {/* Account info bar */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14,
        padding:'10px 16px', background:'#FBF7FA', border:'1px solid #E0D5E0',
        borderRadius:7, borderLeft:'4px solid #714B67' }}>
        <div>
          <span style={{ fontFamily:'DM Mono,monospace', fontSize:13,
            fontWeight:700, color:'#714B67' }}>{account.code}</span>
          <span style={{ fontSize:13, fontWeight:600, color:'#1C1C1C',
            marginLeft:10 }}>{account.name}</span>
        </div>
        <span style={{ fontSize:11, background:'#EDE0EA', color:'#714B67',
          padding:'2px 8px', borderRadius:8, fontWeight:600 }}>{account.type}</span>
        <span style={{ marginLeft:'auto', fontSize:13, fontWeight:700,
          color:'#714B67', fontFamily:'DM Mono,monospace' }}>
          Period: {month} 2025
        </span>
      </div>

      {/* Transactions table */}
      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
        overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
              {['Date','Voucher No.','Narration','Debit (₹)','Credit (₹)','Balance (₹)'].map(h=>(
                <th key={h} style={{ padding:'9px 14px', fontSize:11, fontWeight:700,
                  color:'#6C757D', textAlign: h.includes('₹') ? 'right' : 'left',
                  textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {txns.map((t, i) => {
              const runBal = txns.slice(0,i+1).reduce((s,x)=>s+x.dr-x.cr,0)
              return (
                <tr key={i} style={{ borderBottom:'1px solid #F0EEF0',
                  background: i%2===0?'#fff':'#FDFBFD' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                  <td style={{ padding:'9px 14px', fontSize:12,
                    fontFamily:'DM Mono,monospace', color:'#6C757D' }}>{t.date}</td>
                  <td style={{ padding:'9px 14px', fontSize:12,
                    fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67' }}>{t.voucher}</td>
                  <td style={{ padding:'9px 14px', fontSize:12, color:'#1C1C1C' }}>{t.narration}</td>
                  <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    color: t.dr > 0 ? '#0C5460' : '#CCC', fontWeight: t.dr>0?700:400 }}>
                    {t.dr > 0 ? t.dr.toLocaleString('en-IN') : '—'}
                  </td>
                  <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    color: t.cr > 0 ? '#721C24' : '#CCC', fontWeight: t.cr>0?700:400 }}>
                    {t.cr > 0 ? t.cr.toLocaleString('en-IN') : '—'}
                  </td>
                  <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right',
                    fontFamily:'DM Mono,monospace', fontWeight:700,
                    color: runBal >= 0 ? '#155724' : '#721C24' }}>
                    {Math.abs(runBal).toLocaleString('en-IN')} {runBal>=0?'Dr':'Cr'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background:'#F8F4F8', borderTop:'2px solid #714B67' }}>
              <td colSpan={3} style={{ padding:'9px 14px', fontSize:12,
                fontWeight:700, color:'#1C1C1C' }}>
                Total — {month} 2025
              </td>
              <td style={{ padding:'9px 14px', fontSize:13, textAlign:'right',
                fontFamily:'DM Mono,monospace', fontWeight:800, color:'#0C5460' }}>
                {totDr.toLocaleString('en-IN')}
              </td>
              <td style={{ padding:'9px 14px', fontSize:13, textAlign:'right',
                fontFamily:'DM Mono,monospace', fontWeight:800, color:'#721C24' }}>
                {totCr.toLocaleString('en-IN')}
              </td>
              <td style={{ padding:'9px 14px', fontSize:13, textAlign:'right',
                fontFamily:'DM Mono,monospace', fontWeight:800,
                color:(totDr-totCr)>=0?'#155724':'#721C24' }}>
                {Math.abs(totDr-totCr).toLocaleString('en-IN')} {(totDr-totCr)>=0?'Dr':'Cr'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── Layer 2: Month-wise summary ──────────────────────────────
function AccountLedger({ account, onMonthClick, onBack }) {
  const months = genMonthData(account.code)
  const totDr  = months.reduce((s,m)=>s+m.dr,0)
  const totCr  = months.reduce((s,m)=>s+m.cr,0)

  return (
    <div>
      <Breadcrumb
        items={['Chart of Accounts', account.code + ' · ' + account.name]}
        onNavigate={(i) => i === 0 ? onBack() : null}
      />

      {/* Account header */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14,
        padding:'12px 16px', background:'#FBF7FA', border:'1px solid #E0D5E0',
        borderRadius:7, borderLeft:'4px solid #714B67' }}>
        <div>
          <div style={{ fontFamily:'DM Mono,monospace', fontSize:14,
            fontWeight:800, color:'#714B67' }}>{account.code}</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#1C1C1C' }}>{account.name}</div>
        </div>
        <span style={{ fontSize:11, background:'#EDE0EA', color:'#714B67',
          padding:'2px 8px', borderRadius:8, fontWeight:600 }}>{account.type}</span>
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <div style={{ fontSize:11, color:'#6C757D', textTransform:'uppercase', letterSpacing:.5 }}>
            Closing Balance
          </div>
          <div style={{ fontFamily:'DM Mono,monospace', fontSize:16,
            fontWeight:800, color:'#714B67' }}>{account.bal}</div>
        </div>
      </div>

      {/* Hint */}
      <div style={{ fontSize:12, color:'#6C757D', marginBottom:10,
        display:'flex', alignItems:'center', gap:6 }}>
        <span>💡</span>
        <span>Click on any month to view individual transactions</span>
      </div>

      {/* Month-wise table */}
      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
        overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
              {['Month','Debit (₹)','Credit (₹)','Net (₹)',''].map(h=>(
                <th key={h} style={{ padding:'9px 14px', fontSize:11, fontWeight:700,
                  color:'#6C757D', textAlign: h==='Month'||h==='' ? 'left' : 'right',
                  textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={i}
                onClick={() => onMonthClick(m.month)}
                style={{ borderBottom:'1px solid #F0EEF0', cursor:'pointer',
                  background: i%2===0?'#fff':'#FDFBFD' }}
                onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600,
                  color:'#1C1C1C' }}>{m.month} 2025</td>
                <td style={{ padding:'10px 14px', fontSize:13, textAlign:'right',
                  fontFamily:'DM Mono,monospace', color:'#0C5460', fontWeight:600 }}>
                  {m.dr.toLocaleString('en-IN')}
                </td>
                <td style={{ padding:'10px 14px', fontSize:13, textAlign:'right',
                  fontFamily:'DM Mono,monospace', color:'#721C24', fontWeight:600 }}>
                  {m.cr.toLocaleString('en-IN')}
                </td>
                <td style={{ padding:'10px 14px', fontSize:13, textAlign:'right',
                  fontFamily:'DM Mono,monospace', fontWeight:700,
                  color: m.bal>=0?'#155724':'#721C24' }}>
                  {Math.abs(m.bal).toLocaleString('en-IN')} {m.bal>=0?'Dr':'Cr'}
                </td>
                <td style={{ padding:'10px 14px', textAlign:'right' }}>
                  <span style={{ fontSize:11, color:'#714B67', fontWeight:600 }}>
                    View Txns ›
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background:'#F8F4F8', borderTop:'2px solid #714B67' }}>
              <td style={{ padding:'10px 14px', fontSize:13,
                fontWeight:800, color:'#1C1C1C' }}>Total FY 2025–26</td>
              <td style={{ padding:'10px 14px', fontSize:14, textAlign:'right',
                fontFamily:'DM Mono,monospace', fontWeight:800, color:'#0C5460' }}>
                {totDr.toLocaleString('en-IN')}
              </td>
              <td style={{ padding:'10px 14px', fontSize:14, textAlign:'right',
                fontFamily:'DM Mono,monospace', fontWeight:800, color:'#721C24' }}>
                {totCr.toLocaleString('en-IN')}
              </td>
              <td style={{ padding:'10px 14px', fontSize:14, textAlign:'right',
                fontFamily:'DM Mono,monospace', fontWeight:800,
                color:(totDr-totCr)>=0?'#155724':'#721C24' }}>
                {Math.abs(totDr-totCr).toLocaleString('en-IN')} {(totDr-totCr)>=0?'Dr':'Cr'}
              </td>
              <td/>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── Layer 1: Main COA ────────────────────────────────────────
export default function ChartOfAccounts() {
  const [open, setOpen]     = useState({0:true,1:true,2:true,3:true})
  const [showAdd, setShowAdd] = useState(false)

  // Drill-down state
  const [layer, setLayer]           = useState('root')   // root | account | txn
  const [selAccount, setSelAccount] = useState(null)
  const [selMonth, setSelMonth]     = useState(null)

  const goAccount = (item) => { setSelAccount(item); setLayer('account') }
  const goMonth   = (m)    => { setSelMonth(m);      setLayer('txn')     }
  const goBack    = (to)   => {
    if (to === 'root' || to === undefined) { setLayer('root'); setSelAccount(null); setSelMonth(null) }
    if (to === 'account') { setLayer('account'); setSelMonth(null) }
  }

  // ── Layer 3 ──
  if (layer === 'txn') return (
    <TransactionView account={selAccount} month={selMonth} onBack={goBack} />
  )

  // ── Layer 2 ──
  if (layer === 'account') return (
    <AccountLedger account={selAccount} onMonthClick={goMonth} onBack={() => goBack('root')} />
  )

  // ── Layer 1 (root) ──
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Chart of Accounts
          <small>Account Master · LNV Manufacturing</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => setShowAdd(!showAdd)}>
            Add Account
          </button>
        </div>
      </div>

      {/* Hint */}
      <div style={{ fontSize:12, color:'#6C757D', marginBottom:10,
        padding:'7px 12px', background:'#FBF7FA', borderRadius:5,
        border:'1px solid #E0D5E0', display:'flex', alignItems:'center', gap:6 }}>
        <span>💡</span>
        <span>Click on any account to drill down → Month Summary → Transactions (Tally-style)</span>
      </div>

      {/* Add Account Form */}
      {showAdd && (
        <div className="fi-form-sec" style={{marginBottom:'14px'}}>
          <div className="fi-form-sec-hdr">New Account</div>
          <div className="fi-form-sec-body">
            <div className="fi-form-row">
              <div className="fi-form-grp">
                <label>Account Code <span>*</span></label>
                <input className="fi-form-ctrl" placeholder="e.g. 6910"/>
              </div>
              <div className="fi-form-grp">
                <label>Account Name <span>*</span></label>
                <input className="fi-form-ctrl" placeholder="Account description"/>
              </div>
              <div className="fi-form-grp">
                <label>Account Group</label>
                <select className="fi-form-ctrl">
                  <option>Asset</option><option>Liability</option>
                  <option>Income</option><option>Expense</option>
                </select>
              </div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp">
                <label>Account Type</label>
                <select className="fi-form-ctrl">
                  <option>Current Asset</option><option>Fixed Asset</option>
                  <option>Current Liability</option><option>Long Term</option>
                  <option>Equity</option><option>Income</option>
                  <option>COGS</option><option>COGM/PP</option>
                  <option>OpEx</option><option>PM</option><option>QM</option>
                </select>
              </div>
              <div className="fi-form-grp">
                <label>Normal Balance</label>
                <select className="fi-form-ctrl">
                  <option>Debit</option><option>Credit</option>
                </select>
              </div>
              <div className="fi-form-grp" style={{justifyContent:'flex-end'}}>
                <label>&nbsp;</label>
                <div style={{display:'flex',gap:'8px'}}>
                  <button className="btn btn-s sd-bsm" onClick={() => setShowAdd(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-p sd-bsm">Save Account</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COA Groups */}
      {COA.map((grp, gi) => (
        <div key={gi} className="coa-group">
          <div className="coa-grp-hdr"
            onClick={() => setOpen(p=>({...p,[gi]:!p[gi]}))}>
            {open[gi]?'▾':'►'} {grp.grp}
            <span style={{marginLeft:'auto',fontSize:'11px',
              fontWeight:'400',color:'var(--odoo-gray)'}}>
              {grp.items.length} accounts
            </span>
          </div>
          {open[gi] && (
            <div className="coa-items">
              {grp.items.map(item => (
                <div key={item.code} className="coa-item"
                  onClick={() => goAccount(item)}
                  style={{ cursor:'pointer' }}
                  onMouseEnter={e=>{
                    e.currentTarget.style.background='#FBF7FA'
                    e.currentTarget.style.paddingLeft='18px'
                    e.currentTarget.style.transition='all .15s'
                  }}
                  onMouseLeave={e=>{
                    e.currentTarget.style.background=''
                    e.currentTarget.style.paddingLeft=''
                  }}>
                  <span>
                    <span className="ca-code">{item.code}</span>
                    {item.name}
                    <span style={{fontSize:'10px',background:'#F0EEEB',
                      padding:'1px 6px',borderRadius:'8px',marginLeft:'8px',
                      color:'var(--odoo-gray)'}}>
                      {item.type}
                    </span>
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span className={`ca-bal ${item.bc}`}>
                      {item.bal} {item.bc==='cr'?'Dr':'Cr'}
                    </span>
                    <span style={{ fontSize:11, color:'#714B67',
                      fontWeight:600, opacity:.7 }}>Ledger ›</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
