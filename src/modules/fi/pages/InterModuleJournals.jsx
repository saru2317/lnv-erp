import React, { useState } from 'react'

const AUTO_JVS = [
  {jv:'JV-2025-0148',date:'28 Feb',src:'SD',srcName:'Sales (SD)',event:'Invoice Posted — INV-2025-042 · ABC Textiles',
   dr:[{acct:'1300 · Accounts Receivable',amt:'₹2,36,000'}],
   cr:[{acct:'5100 · Sales Revenue',amt:'₹2,00,000'},{acct:'2200 · GST CGST Payable',amt:'₹18,000'},{acct:'2210 · GST SGST Payable',amt:'₹18,000'}],
   total:'₹2,36,000',sb:'badge-posted'},
  {jv:'JV-2025-0147',date:'27 Feb',src:'MM',srcName:'Procurement (MM)',event:'Vendor Invoice Received — VINV-2025-012 · Lakshmi Textiles',
   dr:[{acct:'1400 · Stock / Inventory',amt:'₹1,76,271'},{acct:'1600 · GST ITC CGST',amt:'₹10,576'},{acct:'1600 · GST ITC SGST',amt:'₹10,576'}],
   cr:[{acct:'2100 · Accounts Payable',amt:'₹2,08,000'}],
   total:'₹2,08,000',sb:'badge-posted'},
  {jv:'JV-2025-0143',date:'24 Feb',src:'WM',srcName:'Warehouse (WM)',event:'Goods Issue — GI-2025-042 to Production WO-017',
   dr:[{acct:'6100 · COGS — Direct Material',amt:'₹1,44,000'}],
   cr:[{acct:'1400 · Stock / Inventory',amt:'₹1,44,000'}],
   total:'₹1,44,000',sb:'badge-posted'},
  {jv:'JV-2025-0142',date:'23 Feb',src:'PP',srcName:'Production (PP)',event:'Work Order WO-2025-017 Closed — Ring Yarn 30s 500 Kg',
   dr:[{acct:'6110 · COGM — Direct Labour',amt:'₹1,44,000'},{acct:'6120 · COGM — Mfg Overhead',amt:'₹68,000'},{acct:'1410 · Finished Goods',amt:'₹2,12,000'}],
   cr:[{acct:'6100 · COGS — Direct Material',amt:'₹6,20,000'}],
   total:'₹8,24,000',sb:'badge-posted'},
  {jv:'JV-2025-0141',date:'22 Feb',src:'PM',srcName:'Maintenance (PM)',event:'Work Order MO-2025-009 — Machine M-102 Repair Completed',
   dr:[{acct:'6700 · Maintenance Expense',amt:'₹48,000'}],
   cr:[{acct:'2100 · Accounts Payable (service vendor)',amt:'₹48,000'}],
   total:'₹48,000',sb:'badge-posted'},
  {jv:'JV-2025-0139',date:'20 Feb',src:'HCM',srcName:'Payroll (HCM)',event:'Payroll Run — Feb 2025 · All Employees',
   dr:[{acct:'6200 · Salary & Wages',amt:'₹8,40,000'},{acct:'6210 · Provident Fund',amt:'₹1,00,800'},{acct:'6220 · ESI',amt:'₹37,800'}],
   cr:[{acct:'1200 · Bank — HDFC',amt:'₹7,98,000'},{acct:'2300 · TDS Payable',amt:'₹42,000'},{acct:'2310 · PF Payable',amt:'₹1,00,800'},{acct:'2320 · ESI Payable',amt:'₹37,800'}],
   total:'₹9,78,600',sb:'badge-posted'},
  {jv:'JV-2025-0138',date:'19 Feb',src:'SD',srcName:'Sales (SD)',event:'Customer Payment Received — ABC Textiles — REC-024',
   dr:[{acct:'1200 · Bank — HDFC',amt:'₹4,72,000'}],
   cr:[{acct:'1300 · Accounts Receivable',amt:'₹4,72,000'}],
   total:'₹4,72,000',sb:'badge-posted'},
]

const SRC_COLORS = {SD:'var(--odoo-green)',MM:'var(--odoo-orange)',WM:'var(--odoo-blue)',PP:'var(--odoo-purple)',PM:'var(--odoo-red)',HCM:'#8E44AD'}

export default function InterModuleJournals() {
  const [sel, setSel] = useState(null)
  const [filter, setFilter] = useState('All')

  const filtered = filter==='All' ? AUTO_JVS : AUTO_JVS.filter(j=>j.src===filter)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Auto Journal Entries <small>Cross-Module Accounting Integration</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-alert info"> Every transaction in SD, MM, WM, PP, PM, HCM automatically posts a Journal Entry here. Finance team gets real-time accounting — no manual re-entry.</div>

      <div className="fi-chips">
        {['All','SD','MM','WM','PP','PM','HCM'].map(s=>(
          <div key={s} className={`fi-chip${filter===s?' on':''}`} onClick={() => setFilter(s)}>{s}</div>
        ))}
      </div>

      {/* Module Integration Map */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'14px'}}>
        {[
          {src:'SD',icon:'▸',name:'Sales',ev:'Invoice → AR Dr / Revenue Cr\nReceipt → Bank Dr / AR Cr\nCredit Note → Revenue Dr / AR Cr'},
          {src:'MM',icon:'▸',name:'Purchase',ev:'PO Receipt → Stock Dr / AP Cr\nVendor Pay → AP Dr / Bank Cr\nReturn → AP Dr / Stock Cr'},
          {src:'WM',icon:'▸',name:'Warehouse',ev:'Goods Issue → COGS Dr / Stock Cr\nGoods Receipt → Stock Dr / AP Cr\nAdjust → COGS Dr/Cr / Stock Cr/Dr'},
          {src:'PP',icon:'▸',name:'Production',ev:'WO Close → COGM Dr / FG Dr / Stock Cr\nLabour → COGM Labour Dr\nOverhead → COGM Overhead Dr'},
          {src:'PM',icon:'▸',name:'Maintenance',ev:'Work Order → Maint Exp Dr / AP Cr\nCapex → FA Dr / AP Cr\nDepreciation → Dep Dr / Acc Dep Cr'},
          {src:'HCM',icon:'▸',name:'Payroll',ev:'Payroll Run → Salary Dr / Bank Cr\nPF/ESI → PF Dr / PF Payable Cr\nTDS → TDS Payable Cr'},
        ].map(m=>(
          <div key={m.src} style={{background:'#fff',borderRadius:'8px',padding:'12px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',borderLeft:`4px solid ${SRC_COLORS[m.src]}`}}>
            <div style={{fontWeight:'700',marginBottom:'6px',display:'flex',gap:'6px',alignItems:'center'}}>
              <span>{m.icon}</span><span style={{color:SRC_COLORS[m.src]}}>{m.src} — {m.name}</span>
            </div>
            <div style={{fontSize:'11px',color:'var(--odoo-gray)',lineHeight:'1.6',whiteSpace:'pre-line'}}>{m.ev}</div>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>JV No.</th><th>Date</th><th>Source</th><th>Event / Transaction</th><th>Total</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          {filtered.map(r=>(
            <tr key={r.jv} onClick={() => setSel(r)}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.jv}</strong></td>
              <td>{r.date}</td>
              <td>
                <span className="badge" style={{background:SRC_COLORS[r.src]+'22',color:SRC_COLORS[r.src],border:`1px solid ${SRC_COLORS[r.src]}66`,fontWeight:'700'}}>
                  {r.src}
                </span>
              </td>
              <td style={{maxWidth:'320px',fontSize:'12px'}}>{r.event}</td>
              <td style={{fontWeight:'700'}}>{r.total}</td>
              <td><span className={`badge ${r.sb}`}>Auto-Posted</span></td>
              <td onClick={e=>e.stopPropagation()}>
                <button className="btn-xs" onClick={() => setSel(r)}>View JV ▼</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* JV Drill-down */}
      {sel && (
        <div className="fi-modal-overlay" onClick={() => setSel(null)}>
          <div className="fi-modal-box" onClick={e=>e.stopPropagation()}>
            <div className="fi-modal-hdr">
              <h3> {sel.jv} · {sel.srcName} Auto-Journal</h3>
              <span className="fi-modal-close" onClick={() => setSel(null)}></span>
            </div>
            <div className="fi-modal-body">
              <div style={{background:'#F8F9FA',padding:'10px 14px',borderRadius:'6px',marginBottom:'16px',fontSize:'13px'}}>
                <strong>Event:</strong> {sel.event}<br/>
                <strong>Source Module:</strong> <span style={{color:SRC_COLORS[sel.src],fontWeight:'700'}}>{sel.srcName}</span> &nbsp;&nbsp;
                <strong>Date:</strong> {sel.date} &nbsp;&nbsp;
                <strong>Total:</strong> <span style={{fontFamily:'Syne,sans-serif',fontWeight:'800',color:'var(--odoo-purple)'}}>{sel.total}</span>
              </div>
              <table className="fi-data-table" style={{marginBottom:'16px'}}>
                <thead><tr><th>Dr/Cr</th><th>Account</th><th>Amount</th></tr></thead>
                <tbody>
                  {sel.dr.map((d,i)=>(
                    <tr key={'d'+i}><td><span style={{background:'#FDEDEC',color:'var(--odoo-red)',padding:'2px 8px',borderRadius:'4px',fontSize:'11px',fontWeight:'700'}}>DR</span></td><td>{d.acct}</td><td className="dr">{d.amt}</td></tr>
                  ))}
                  {sel.cr.map((c,i)=>(
                    <tr key={'c'+i}><td><span style={{background:'#EAF9F6',color:'var(--odoo-green)',padding:'2px 8px',borderRadius:'4px',fontSize:'11px',fontWeight:'700'}}>CR</span></td><td>{c.acct}</td><td className="cr">{c.amt}</td></tr>
                  ))}
                  <tr style={{background:'#EDE0EA',fontWeight:'700'}}>
                    <td colSpan={2} style={{padding:'10px 14px',fontFamily:'Syne,sans-serif'}}>TOTAL (Balanced)</td>
                    <td style={{fontFamily:'Syne,sans-serif',color:'var(--odoo-purple)'}}>{sel.total}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{display:'flex',gap:'8px'}}>
                <button className="btn btn-s sd-bsm" onClick={() => setSel(null)}>Close</button>
                <button className="btn btn-p sd-bsm"> View in Ledger</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
