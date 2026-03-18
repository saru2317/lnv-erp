import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const ACCOUNTS = [
  '1100 · Cash in Hand','1200 · Bank — HDFC Current','1300 · Accounts Receivable',
  '1400 · Stock / Inventory','1500 · Fixed Assets — P&M',
  '2100 · Accounts Payable','2200 · GST Payable (CGST)','2210 · GST Payable (SGST)',
  '2300 · TDS Payable','2400 · Salary Payable',
  '5100 · Sales Revenue','5200 · Other Income','5210 · Round-Off Income',
  '6100 · COGS — Direct Material','6110 · COGM — Manufacturing Cost',
  '6200 · Salary & Wages','6210 · Provident Fund','6220 · ESI',
  '6300 · Rent & Utilities','6400 · Depreciation','6500 · Finance Charges',
  '6600 · Freight & Logistics','6700 · Maintenance Expense',
  '6800 · Admin & Other Expenses','6810 · Round-Off Expense',
]
const COST_CENTERS = ['Production','Sales','Admin','HR Dept','Maintenance','Finance']

const INIT_LINES = [
  {id:1,acct:'6200 · Salary & Wages',      cc:'HR Dept',narr:'Salary Feb 2025',dr:'840000',cr:''},
  {id:2,acct:'1200 · Bank — HDFC Current',  cc:'Admin',  narr:'Bank transfer',  dr:'',      cr:'840000'},
]

// Round to 2 decimals
const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100
const fmtINR = n => n === '' || n === 0 ? '' : '₹' + parseFloat(n).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})
const fmtDisp = n => n === 0 ? '₹0.00' : '₹' + Math.abs(n).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})

export default function JVNew() {
  const nav = useNavigate()
  const [lines, setLines] = useState(INIT_LINES)
  const [nextId, setNextId] = useState(3)
  const [roundOff, setRoundOff] = useState({show:false, acct:'', amt:0, side:''})
  const [posted, setPosted] = useState(false)

  // ─── Compute totals + auto round-off whenever lines change ───
  useEffect(() => {
    const totalDr = r2(lines.reduce((s,l) => s + (parseFloat(l.dr)||0), 0))
    const totalCr = r2(lines.reduce((s,l) => s + (parseFloat(l.cr)||0), 0))
    const diff = r2(totalDr - totalCr)                  // positive = Dr excess, negative = Cr excess
    const absDiff = Math.abs(diff)

    if (absDiff === 0) {
      setRoundOff({show:false, acct:'', amt:0, side:''})
    } else if (absDiff <= 1.00) {
      // Auto round-off — show the field
      if (diff > 0) {
        // Dr side is MORE → need Cr to fill → Round-Off Income (Cr)
        setRoundOff({show:true, acct:'5210 · Round-Off Income',  amt:absDiff, side:'cr'})
      } else {
        // Cr side is MORE → need Dr to fill → Round-Off Expense (Dr)
        setRoundOff({show:true, acct:'6810 · Round-Off Expense', amt:absDiff, side:'dr'})
      }
    } else {
      // Diff > ₹1 — no auto round-off, just show warning
      setRoundOff({show:false, acct:'', amt:0, side:''})
    }
  }, [lines])

  const totalDr = r2(lines.reduce((s,l) => s + (parseFloat(l.dr)||0), 0))
  const totalCr = r2(lines.reduce((s,l) => s + (parseFloat(l.cr)||0), 0))
  const rawDiff = r2(totalDr - totalCr)
  const absDiff = Math.abs(rawDiff)

  // Final totals including round-off line
  const finalDr = roundOff.show && roundOff.side==='dr' ? r2(totalDr + roundOff.amt) : totalDr
  const finalCr = roundOff.show && roundOff.side==='cr' ? r2(totalCr + roundOff.amt) : totalCr
  const balanced = r2(finalDr - finalCr) === 0

  // Status indicator
  const getBalStatus = () => {
    if (balanced) return {icon:'✅', label:'Balanced', color:'var(--odoo-green)'}
    if (absDiff <= 1.00) return {icon:'🔄', label:`Auto Round-Off: ${fmtDisp(absDiff)}`, color:'var(--odoo-blue)'}
    if (absDiff <= 10)   return {icon:'⚠️', label:`Difference: ${fmtDisp(absDiff)} — Check entries`, color:'var(--odoo-orange)'}
    return {icon:'❌', label:`Difference: ${fmtDisp(absDiff)} — Cannot post`, color:'var(--odoo-red)'}
  }
  const balStatus = getBalStatus()

  const addLine = () => {
    setLines([...lines, {id:nextId,acct:ACCOUNTS[0],cc:COST_CENTERS[0],narr:'',dr:'',cr:''}])
    setNextId(nextId+1)
  }
  const delLine = id => setLines(lines.filter(l => l.id !== id))
  const updateLine = (id, field, val) => setLines(lines.map(l => l.id===id ? {...l,[field]:val} : l))

  if (posted) {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px 20px',gap:'16px'}}>
        <div style={{fontSize:'48px'}}>✅</div>
        <div style={{fontFamily:'Syne,sans-serif',fontSize:'22px',fontWeight:'800',color:'var(--odoo-green)'}}>JV-2025-0149 Posted Successfully!</div>
        {roundOff.show && <div style={{fontSize:'13px',color:'var(--odoo-gray)'}}>Auto Round-Off of {fmtDisp(roundOff.amt)} posted to {roundOff.acct}</div>}
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/jv')}>← Back to Journal List</button>
          <button className="btn btn-p sd-bsm" onClick={() => {setLines(INIT_LINES);setPosted(false)}}>New Journal</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Journal Entry <small>FB50 · Manual Journal Voucher</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/jv')}>✕ Cancel</button>
          <button className="btn btn-s sd-bsm">Save Draft</button>
          <button className="btn btn-p sd-bsm"
            disabled={!balanced}
            title={balanced ? 'Post Journal' : absDiff <= 1 ? 'Round-off will be auto-posted' : 'Difference > ₹1 — check entries'}
            onClick={() => setPosted(true)}>
            {balanced ? '✅ Post Journal' : absDiff <= 1 ? '✅ Post + Round-Off' : `⚠️ Diff: ${fmtDisp(absDiff)}`}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📓 Journal Header</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>JV Number</label><input className="fi-form-ctrl" defaultValue="JV-2025-0149" readOnly/></div>
            <div className="fi-form-grp"><label>Posting Date <span>*</span></label><input type="date" className="fi-form-ctrl" defaultValue="2025-02-28"/></div>
            <div className="fi-form-grp"><label>Document Type</label>
              <select className="fi-form-ctrl">
                <option>SA — General Journal</option><option>KR — Vendor Invoice</option>
                <option>DR — Customer Invoice</option><option>ZP — Payment</option>
                <option>ZR — Receipt</option><option>AF — Depreciation</option>
                <option>PR — Production</option><option>WA — Goods Issue</option>
              </select>
            </div>
          </div>
          <div className="fi-form-row2">
            <div className="fi-form-grp"><label>Narration / Description <span>*</span></label>
              <input className="fi-form-ctrl" placeholder="e.g. Salary Feb 2025 / Invoice INV-2025-042..."/></div>
            <div className="fi-form-grp"><label>Reference / Voucher No.</label>
              <input className="fi-form-ctrl" placeholder="Voucher No. or external reference"/></div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Debit / Credit Lines</div>
        <div className="fi-form-sec-body" style={{padding:'0'}}>
          <div className="fi-lt-wrap">
            <table className="fi-lt">
              <thead><tr>
                <th style={{width:'32px'}}>#</th>
                <th style={{minWidth:'220px'}}>Account</th>
                <th style={{width:'120px'}}>Cost Center</th>
                <th>Narration</th>
                <th style={{width:'130px'}}>Debit (₹)</th>
                <th style={{width:'130px'}}>Credit (₹)</th>
                <th style={{width:'32px'}}></th>
              </tr></thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={l.id}>
                    <td style={{color:'var(--odoo-gray)',fontSize:'11px',fontWeight:'700'}}>{i+1}</td>
                    <td>
                      <select style={{width:'220px'}} value={l.acct} onChange={e => updateLine(l.id,'acct',e.target.value)}>
                        {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
                      </select>
                    </td>
                    <td>
                      <select style={{width:'110px'}} value={l.cc} onChange={e => updateLine(l.id,'cc',e.target.value)}>
                        {COST_CENTERS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td><input value={l.narr} style={{width:'150px'}} onChange={e => updateLine(l.id,'narr',e.target.value)} placeholder="Narration..."/></td>
                    <td>
                      <input type="number" value={l.dr} style={{width:'120px',color:'var(--odoo-red)',fontWeight:'600'}} placeholder="0.00"
                        onChange={e => updateLine(l.id,'dr',e.target.value)}
                        onFocus={e => { if(l.cr) updateLine(l.id,'cr','') }}/>
                    </td>
                    <td>
                      <input type="number" value={l.cr} style={{width:'120px',color:'var(--odoo-green)',fontWeight:'600'}} placeholder="0.00"
                        onChange={e => updateLine(l.id,'cr',e.target.value)}
                        onFocus={e => { if(l.dr) updateLine(l.id,'dr','') }}/>
                    </td>
                    <td>
                      <span className="li-del" style={{cursor:'pointer',color:'var(--odoo-red)',fontSize:'14px'}} onClick={() => delLine(l.id)}>🗑</span>
                    </td>
                  </tr>
                ))}

                {/* ── AUTO ROUND-OFF ROW ── */}
                {roundOff.show && (
                  <tr style={{background:'#EBF5FB',borderTop:'2px dashed var(--odoo-blue)'}}>
                    <td style={{color:'var(--odoo-blue)',fontSize:'11px',fontWeight:'700'}}>🔄</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <span style={{
                          background:'var(--odoo-blue)',color:'#fff',
                          padding:'2px 7px',borderRadius:'4px',
                          fontSize:'10px',fontWeight:'700',whiteSpace:'nowrap'
                        }}>AUTO</span>
                        <select style={{width:'180px',color:'var(--odoo-blue)',fontWeight:'600'}}
                          value={roundOff.acct}
                          onChange={e => setRoundOff(p => ({...p, acct:e.target.value}))}>
                          <option>5210 · Round-Off Income</option>
                          <option>6810 · Round-Off Expense</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <span style={{fontSize:'11px',color:'var(--odoo-blue)',padding:'0 6px'}}>Auto</span>
                    </td>
                    <td>
                      <span style={{fontSize:'12px',color:'var(--odoo-blue)',padding:'0 4px'}}>
                        Round-Off adjustment
                      </span>
                    </td>
                    {/* Show the round-off amount in the correct column */}
                    <td>
                      <input
                        type="number"
                        value={roundOff.side==='dr' ? roundOff.amt : ''}
                        readOnly
                        style={{
                          width:'120px',
                          color:'var(--odoo-blue)',
                          fontWeight:'700',
                          background:'#EBF5FB',
                          border:'1px solid var(--odoo-blue)',
                          borderRadius:'4px',
                          padding:'4px 6px',
                          fontFamily:'DM Mono,monospace',
                          cursor:'not-allowed'
                        }}
                        placeholder="—"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={roundOff.side==='cr' ? roundOff.amt : ''}
                        readOnly
                        style={{
                          width:'120px',
                          color:'var(--odoo-blue)',
                          fontWeight:'700',
                          background:'#EBF5FB',
                          border:'1px solid var(--odoo-blue)',
                          borderRadius:'4px',
                          padding:'4px 6px',
                          fontFamily:'DM Mono,monospace',
                          cursor:'not-allowed'
                        }}
                        placeholder="—"
                      />
                    </td>
                    <td>
                      <span title="Auto-calculated. Cannot delete."
                        style={{fontSize:'12px',color:'var(--odoo-blue)',cursor:'not-allowed',opacity:.5}}>🔒</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="fi-lt-add">
              <button className="btn btn-s sd-bsm" onClick={addLine}>Add Line</button>
            </div>
          </div>

          {/* Balance Bar */}
          <div className="jv-balance-bar">
            <div className="jv-total dr">
              <label>Total Debit</label>
              <span>{fmtDisp(finalDr)}</span>
            </div>

            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
              <div className="jv-bal-icon">{balStatus.icon}</div>
              <div style={{
                fontSize:'11px',fontWeight:'700',
                color: balStatus.color,
                textAlign:'center', maxWidth:'180px'
              }}>
                {balStatus.label}
              </div>
              {roundOff.show && (
                <div style={{
                  fontSize:'10px',
                  background:'#EBF5FB',
                  color:'var(--odoo-blue)',
                  padding:'2px 8px',
                  borderRadius:'10px',
                  border:'1px solid var(--odoo-blue)',
                  fontWeight:'600'
                }}>
                  {roundOff.side==='cr'
                    ? `+₹${roundOff.amt} → ${roundOff.acct}`
                    : `+₹${roundOff.amt} → ${roundOff.acct}`}
                </div>
              )}
            </div>

            <div className="jv-total cr">
              <label>Total Credit</label>
              <span>{fmtDisp(finalCr)}</span>
            </div>

            <div className="jv-total diff">
              <label>Difference</label>
              <span style={{
                color: absDiff===0 ? 'var(--odoo-green)'
                     : absDiff<=1  ? 'var(--odoo-blue)'
                     : absDiff<=10 ? 'var(--odoo-orange)'
                     : 'var(--odoo-red)',
                fontSize: absDiff===0 ? '18px' : '16px'
              }}>
                {absDiff===0 ? '₹0.00 ✅' : `₹${absDiff.toFixed(2)}`}
              </span>
              {absDiff > 0 && absDiff <= 1 && (
                <div style={{fontSize:'10px',color:'var(--odoo-blue)',marginTop:'2px'}}>Auto Round-Off 🔄</div>
              )}
              {absDiff > 1 && absDiff <= 10 && (
                <div style={{fontSize:'10px',color:'var(--odoo-orange)',marginTop:'2px'}}>Check entries ⚠️</div>
              )}
              {absDiff > 10 && (
                <div style={{fontSize:'10px',color:'var(--odoo-red)',marginTop:'2px'}}>Cannot post ❌</div>
              )}
            </div>
          </div>

          {/* Round-Off Explanation Banner */}
          {roundOff.show && (
            <div style={{
              margin:'10px 14px',padding:'10px 14px',
              background:'#EBF5FB',border:'1px solid var(--odoo-blue)',
              borderRadius:'6px',fontSize:'12px',color:'var(--odoo-blue)',
              display:'flex',alignItems:'center',gap:'8px'
            }}>
              <span style={{fontSize:'16px'}}>🔄</span>
              <span>
                <strong>Auto Round-Off Applied:</strong>&nbsp;
                Difference of <strong>₹{roundOff.amt.toFixed(2)}</strong> is within ₹1.00 tolerance.&nbsp;
                Auto-posting to <strong>{roundOff.acct}</strong> on {roundOff.side==='cr'?'Credit':'Debit'} side to balance the entry.
              </span>
            </div>
          )}
          {absDiff > 1 && absDiff <= 10 && (
            <div style={{margin:'10px 14px',padding:'10px 14px',background:'#FEF5E7',border:'1px solid #FAD7A0',borderRadius:'6px',fontSize:'12px',color:'var(--odoo-orange)',display:'flex',alignItems:'center',gap:'8px'}}>
              <span>⚠️</span>
              <span><strong>Difference of ₹{absDiff.toFixed(2)} exceeds auto round-off limit (₹1.00).</strong> Please check your entries and correct the amount.</span>
            </div>
          )}
          {absDiff > 10 && (
            <div style={{margin:'10px 14px',padding:'10px 14px',background:'#FDEDEC',border:'1px solid #F5B7B1',borderRadius:'6px',fontSize:'12px',color:'var(--odoo-red)',display:'flex',alignItems:'center',gap:'8px'}}>
              <span>❌</span>
              <span><strong>Cannot post! Difference of ₹{absDiff.toFixed(2)} is too large.</strong> Fix the debit/credit amounts before posting.</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/fi/jv')}>✕ Cancel</button>
        <button className="btn btn-s sd-bsm">Save Draft</button>
        <button className="btn btn-p sd-bsm"
          disabled={!balanced}
          onClick={() => setPosted(true)}>
          {balanced ? '✅ Post Journal' : `⚠️ Diff: ${fmtDisp(absDiff)}`}
        </button>
        <div className="fi-status-flow">
          <span className="fi-sf-step act">📝 Entry</span>
          <span className="fi-sf-arr">›</span>
          <span className={`fi-sf-step ${balanced?'done':''}`}>Posted</span>
          <span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">📜 In Ledger</span>
        </div>
      </div>
    </div>
  )
}
