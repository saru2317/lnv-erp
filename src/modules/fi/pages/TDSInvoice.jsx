import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const BLANK = {
  vendorName:'', pan:'', invoiceNo:'', invoiceDate: new Date().toISOString().split('T')[0],
  amount:'', section:'194C', description:''
}

export default function TDSInvoice() {
  const [sections, setSections]   = useState([])
  const [form,     setForm]       = useState(BLANK)
  const [calc,     setCalc]       = useState(null)
  const [posting,  setPosting]    = useState(false)
  const [result,   setResult]     = useState(null)
  const [history,  setHistory]    = useState([])
  const [calcLoading, setCalcLoading] = useState(false)

  useEffect(() => {
    fetch(`${BASE_URL}/fi/tds/sections`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setSections(d.data||[])).catch(()=>{})
  }, [])

  const F = k => ({ value:form[k]??'', onChange:e=>{ setForm(p=>({...p,[k]:e.target.value})); setCalc(null) } })

  const calculate = useCallback(async () => {
    if (!form.amount || !form.section) return
    setCalcLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/tds/calculate-invoice`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ amount:parseFloat(form.amount), section:form.section, pan:form.pan })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setCalc(d)
    } catch (e) { toast.error(e.message) }
    finally { setCalcLoading(false) }
  }, [form.amount, form.section, form.pan])

  useEffect(() => {
    if (form.amount && parseFloat(form.amount) > 0) {
      const t = setTimeout(calculate, 600)
      return () => clearTimeout(t)
    }
  }, [form.amount, form.section, form.pan, calculate])

  const post = async () => {
    if (!form.vendorName || !form.invoiceNo || !form.amount || !form.section)
      return toast.error('Vendor name, invoice no, amount and section required')
    if (!calc?.applicable) return toast.error('TDS not applicable — amount below threshold')
    setPosting(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/tds/deduct-invoice`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setResult(d.data)
      setHistory(h => [{ ...form, ...d.data, postedAt: new Date() }, ...h.slice(0,9)])
      setForm(BLANK); setCalc(null)
    } catch (e) { toast.error(e.message) }
    finally { setPosting(false) }
  }

  const selSec = sections.find(s=>s.section===form.section)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">TDS on Invoice
          <small> Deduct TDS at booking — not at payment</small>
        </div>
      </div>

      <div className="fi-alert info" style={{marginBottom:14}}>
        <strong>Invoice-level TDS</strong> (recommended): Dr Expense → Cr AP (net) + Cr TDS Payable.
        Ensures accurate period-wise liability even before payment is made.
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:16}}>

        {/* Form */}
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:20}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#714B67',marginBottom:16}}>
            New TDS Deduction Entry
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div style={{gridColumn:'1/-1'}}>
              <label style={lbl}>Vendor / Party Name *</label>
              <input style={inp} {...F('vendorName')} placeholder="ABC Contractors Pvt. Ltd."
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>PAN No.</label>
              <input style={{...inp,fontFamily:'DM Mono,monospace',textTransform:'uppercase'}}
                {...F('pan')} placeholder="AABCA1234A" maxLength={10}
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              {form.pan && form.pan.length!==10 && (
                <div style={{fontSize:10,color:'#DC3545',marginTop:2}}>PAN must be 10 characters — else TDS @ 20%</div>
              )}
            </div>
            <div>
              <label style={lbl}>Invoice No. *</label>
              <input style={inp} {...F('invoiceNo')} placeholder="INV/2026/001"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Invoice Date</label>
              <input type="date" style={inp} {...F('invoiceDate')}/>
            </div>
            <div>
              <label style={lbl}>Invoice Amount (₹) *</label>
              <input type="number" style={inp} {...F('amount')} placeholder="500000"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>TDS Section *</label>
              <select style={{...inp,cursor:'pointer'}} value={form.section}
                onChange={e=>{ setForm(p=>({...p,section:e.target.value})); setCalc(null) }}>
                {sections.map(s=>(
                  <option key={s.section} value={s.section}>
                    {s.section} — {s.name} ({s.rate}%)
                  </option>
                ))}
              </select>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={lbl}>Description</label>
              <input style={inp} {...F('description')} placeholder="Construction work / Professional fees / Rent..."
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
          </div>

          {/* Section info */}
          {selSec && (
            <div style={{background:'#EDE0EA',borderRadius:6,padding:'8px 12px',marginBottom:12,fontSize:11}}>
              <strong style={{color:'#714B67'}}>{selSec.section} — {selSec.name}</strong>
              <span style={{marginLeft:8,color:'#6C757D'}}>
                Rate: {selSec.rate}% (no PAN: {selSec.rateNoNoPAN}%) ·
                Threshold: {INR(selSec.threshold)}
              </span>
            </div>
          )}

          <button className="btn btn-p sd-bsm" disabled={posting||!calc?.applicable} onClick={post}
            style={{width:'100%',padding:12,fontSize:14}}>
            {posting ? 'Posting JV...' : 'Deduct TDS & Post JV'}
          </button>
        </div>

        {/* Calculation + JV Preview */}
        <div>
          {/* Calc result */}
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>TDS Calculation</div>
            {!form.amount ? (
              <div style={{color:'#6C757D',fontSize:12,textAlign:'center',padding:16}}>
                Enter invoice amount to see TDS calculation
              </div>
            ) : calcLoading ? (
              <div style={{color:'#6C757D',fontSize:12,textAlign:'center',padding:16}}>Calculating...</div>
            ) : calc ? (
              <div>
                <div style={{background: calc.applicable?'#F8F4F8':'#FFF3CD', borderRadius:8, padding:12, marginBottom:10}}>
                  {[
                    ['Invoice Amount',   INR(calc.taxable),   '#333'],
                    [`TDS Rate (${calc.section})`, `${calc.rate}%`, '#714B67'],
                    ['TDS Amount',       INR(calc.tdsAmt),    '#DC3545'],
                    ['Net Payable',      INR(calc.netAmt),    '#155724'],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',
                      padding:'5px 0',borderBottom:'1px solid #E0D5E0',
                      fontWeight:l==='TDS Amount'||l==='Net Payable'?700:400}}>
                      <span style={{fontSize:12,color:'#495057'}}>{l}</span>
                      <span style={{fontFamily:'DM Mono,monospace',fontSize:13,color:c}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{padding:'8px 12px',borderRadius:6,fontSize:11,fontWeight:600,
                  background:calc.applicable?'#D4EDDA':'#FFF3CD',
                  color:calc.applicable?'#155724':'#856404'}}>
                  {calc.applicable
                    ? `\u2714 TDS Applicable — ${calc.message}`
                    : `\u26A0 ${calc.message}`}
                </div>
                {!calc.hasPAN && (
                  <div style={{marginTop:8,padding:'6px 10px',background:'#F8D7DA',borderRadius:6,
                    fontSize:11,color:'#721C24',fontWeight:600}}>
                    No PAN — TDS @ {calc.rate}% (higher rate applies)
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* JV Preview */}
          {calc?.applicable && (
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
              <div style={{fontWeight:700,fontSize:12,color:'#714B67',marginBottom:10}}>JV Preview</div>
              {[
                ['Dr', '5000 — Expense A/c',   INR(calc.taxable),  '#333'   ],
                ['Cr', '2100 — Accounts Payable', INR(calc.netAmt), '#155724'],
                ['Cr', '2300 — TDS Payable',   INR(calc.tdsAmt),   '#DC3545'],
              ].map(([side,acct,amt,c])=>(
                <div key={acct} style={{display:'flex',gap:8,padding:'5px 0',
                  borderBottom:'1px solid #F0EEEB',fontSize:11}}>
                  <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,
                    width:20,color:side==='Dr'?'#004085':'#155724'}}>{side}</span>
                  <span style={{flex:1,color:'#495057'}}>{acct}</span>
                  <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:c}}>{amt}</span>
                </div>
              ))}
            </div>
          )}

          {/* Success result */}
          {result && (
            <div style={{marginTop:12,background:'#D4EDDA',border:'1px solid #C3E6CB',
              borderRadius:8,padding:14}}>
              <div style={{fontWeight:800,color:'#155724',marginBottom:4}}>\u2714 JV Posted Successfully</div>
              <div style={{fontSize:12,color:'#155724'}}>JV: <strong>{result.jeNo}</strong></div>
              <div style={{fontSize:12,color:'#155724'}}>TDS: <strong>{INR(result.tdsAmt)}</strong> deducted</div>
              <div style={{fontSize:12,color:'#155724'}}>Net AP: <strong>{INR(result.netAmt)}</strong></div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{marginTop:16}}>
          <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:10}}>Recent TDS Entries (This Session)</div>
          <table className="fi-data-table">
            <thead><tr>
              <th>JV No.</th><th>Vendor</th><th>Invoice No.</th><th>Section</th>
              <th style={{textAlign:'right'}}>Amount</th>
              <th style={{textAlign:'right'}}>TDS</th>
              <th style={{textAlign:'right'}}>Net AP</th>
            </tr></thead>
            <tbody>
              {history.map((h,i)=>(
                <tr key={i}>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{h.jeNo}</td>
                  <td style={{fontWeight:600,fontSize:12}}>{h.vendorName}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{h.invoiceNo}</td>
                  <td><span style={{background:'#EDE0EA',color:'#714B67',padding:'2px 8px',borderRadius:8,fontSize:11,fontWeight:700}}>{h.section}</span></td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(parseFloat(h.amount||0))}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#DC3545',fontWeight:700}}>{INR(h.tdsAmt||0)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#155724',fontWeight:700}}>{INR(h.netAmt||0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
