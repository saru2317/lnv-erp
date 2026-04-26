import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const r2   = v => Math.round(parseFloat(v||0)*100)/100
const inp  = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl  = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

// ── Tally-style inline calculator ────────────────────────────────
function CalcInput({ value, onChange, placeholder, style, autoFocus }) {
  const [expr,  setExpr]  = useState(String(value||''))
  const [showCalc, setShowCalc] = useState(false)
  const [calcExpr, setCalcExpr] = useState('')
  const [calcRes, setCalcRes]   = useState(null)
  const ref = useRef()

  useEffect(() => { setExpr(String(value||'')) }, [value])

  const evalExpr = (e) => {
    // Evaluate math expression like "50000-5000" or "100000*18/100"
    try {
      // Safe eval — only allow numbers and operators
      if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(e)) return null
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${e})`)()
      return isNaN(result) ? null : r2(result)
    } catch { return null }
  }

  const handleChange = (e) => {
    const v = e.target.value
    setExpr(v)
    // If it contains operators, show result preview
    if (/[\+\-\*\/]/.test(v) && v.length > 1) {
      const res = evalExpr(v)
      if (res !== null) setCalcRes(res)
    } else {
      setCalcRes(null)
    }
  }

  const handleBlur = () => {
    // On blur — evaluate and commit
    const res = evalExpr(expr)
    if (res !== null && res !== parseFloat(expr)) {
      setExpr(String(res))
      onChange(res)
    } else if (!isNaN(parseFloat(expr))) {
      onChange(parseFloat(expr))
    }
    setCalcRes(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === '=') {
      const res = evalExpr(expr)
      if (res !== null) { setExpr(String(res)); onChange(res); setCalcRes(null) }
    }
    if (e.key === 'Escape') { setExpr(String(value||'')); setCalcRes(null) }
  }

  return (
    <div style={{position:'relative'}}>
      <input
        ref={ref}
        autoFocus={autoFocus}
        style={{
          padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12,
          outline:'none', width:'100%', boxSizing:'border-box',
          fontFamily:'DM Mono,monospace', fontWeight:700,
          borderColor: calcRes!==null ? '#FFC107' : '#E0D5E0',
          background: calcRes!==null ? '#FFFDF0' : '#fff',
          ...style
        }}
        value={expr}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || '0'}
      />
      {calcRes !== null && (
        <div style={{
          position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
          fontSize:11, fontWeight:700, color:'#856404',
          background:'#FFF3CD', padding:'2px 6px', borderRadius:4,
        }}>
          = {INR(calcRes)} ↵
        </div>
      )}
      <div style={{position:'absolute',right:-20,top:'50%',transform:'translateY(-50%)',fontSize:10,color:'#CCC',cursor:'pointer'}}
        title="Tally-style calculator: type expressions like 50000+5000 or 100000*18/100">
        ⓘ
      </div>
    </div>
  )
}

// ── Voucher type definitions ──────────────────────────────────────
const VOUCHER_TYPES = [
  { key:'PV', label:'Payment',  icon:'💸', color:'#F8D7DA', tx:'#721C24', shortcut:'F5', desc:'Pay vendor, expense, salary' },
  { key:'RV', label:'Receipt',  icon:'💰', color:'#D4EDDA', tx:'#155724', shortcut:'F6', desc:'Receive from customer' },
  { key:'CN', label:'Contra',   icon:'🔄', color:'#D1ECF1', tx:'#0C5460', shortcut:'F4', desc:'Bank ↔ Cash transfer' },
  { key:'JV', label:'Journal',  icon:'📒', color:'#EDE0EA', tx:'#714B67', shortcut:'F7', desc:'Manual double-entry' },
]

const TDS_SECTIONS = [
  { value:'',     label:'No TDS' },
  { value:'194C', label:'Sec 194C — Contractor (1%/2%)',     rate:1  },
  { value:'194J', label:'Sec 194J — Professional Svc (10%)', rate:10 },
  { value:'194H', label:'Sec 194H — Commission (5%)',         rate:5  },
  { value:'194I', label:'Sec 194I — Rent P&M (2%)',           rate:2  },
  { value:'194IA',label:'Sec 194IA — Rent Land/Bldg (10%)',  rate:10 },
  { value:'192B', label:'Sec 192B — Salary (Slab)',           rate:null },
]

const PAYMENT_MODES = ['NEFT','RTGS','IMPS','Cheque','Cash','UPI','DD']

export default function VoucherEntry() {
  const nav  = useNavigate()
  const [urlParams] = useSearchParams()
  const initType = urlParams.get('type') || 'PV'

  const [vType,      setVType]      = useState(initType)
  const [vNo,        setVNo]        = useState('Auto')
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0])
  const [narration,  setNarration]  = useState('')
  const [saving,     setSaving]     = useState(false)

  // COA + party data
  const [accts,      setAccts]      = useState([])
  const [customers,  setCustomers]  = useState([])
  const [vendors,    setVendors]    = useState([])

  // PV fields
  const [pvVendor,   setPvVendor]   = useState('')
  const [pvVendorPan,setPvVendorPan]= useState('')
  const [pvVendorType,setPvVendorType]= useState('Company')
  const [pvInvRef,   setPvInvRef]   = useState('')
  const [pvGross,    setPvGross]    = useState(0)
  const [pvTdsSec,   setPvTdsSec]   = useState('')
  const [pvTdsAmt,   setPvTdsAmt]   = useState(0)
  const [pvNet,      setPvNet]      = useState(0)
  const [pvBank,     setPvBank]     = useState('1200')
  const [pvMode,     setPvMode]     = useState('NEFT')
  const [pvRef,      setPvRef]      = useState('')
  const [pvCalcLoading, setPvCalcLoading] = useState(false)

  // RV fields
  const [rvCust,     setRvCust]     = useState('')
  const [rvInvRef,   setRvInvRef]   = useState('')
  const [rvAmount,   setRvAmount]   = useState(0)
  const [rvBank,     setRvBank]     = useState('1200')
  const [rvMode,     setRvMode]     = useState('NEFT')
  const [rvRef,      setRvRef]      = useState('')

  // Contra fields
  const [cnFrom,     setCnFrom]     = useState('1200')
  const [cnTo,       setCnTo]       = useState('1100')
  const [cnAmount,   setCnAmount]   = useState(0)

  // JV lines (for manual JV)
  const [jvLines, setJvLines] = useState([
    { id:1, debitAcctCode:'', creditAcctCode:'', debit:'', credit:'', narration:'' },
    { id:2, debitAcctCode:'', creditAcctCode:'', debit:'', credit:'', narration:'' },
  ])
  const [jvNid, setJvNid] = useState(3)

  // Load base data
  useEffect(() => {
    const loadBase = async () => {
      try {
        const [rA, rC, rV] = await Promise.all([
          fetch(`${BASE_URL}/fi/coa/balances`, { headers: hdr2() }),
          fetch(`${BASE_URL}/mdm/customer`,    { headers: hdr2() }),
          fetch(`${BASE_URL}/mdm/vendor`,      { headers: hdr2() }),
        ])
        const [dA, dC, dV] = await Promise.all([rA.json(), rC.json(), rV.json()])
        setAccts(dA.data || [])
        setCustomers(dC.data || [])
        setVendors(dV.data || [])
      } catch {}
    }
    loadBase()
  }, [])

  // Load next voucher number when type changes
  useEffect(() => {
    const getNo = async () => {
      try {
        if (vType === 'JV') {
          const res  = await fetch(`${BASE_URL}/fi/je/next-no`, { headers: hdr2() })
          const data = await res.json()
          setVNo(data.jeNo || 'JV-AUTO')
        } else if (vType === 'PV') {
          const res  = await fetch(`${BASE_URL}/fi/pv/next-no`, { headers: hdr2() })
          const data = await res.json()
          setVNo(data.pvNo || 'PV-AUTO')
        } else if (vType === 'RV') {
          const res  = await fetch(`${BASE_URL}/fi/rv/next-no`, { headers: hdr2() })
          const data = await res.json()
          setVNo(data.rvNo || 'RV-AUTO')
        } else {
          const year = new Date().getFullYear()
          setVNo(`CN-${year}-AUTO`)
        }
      } catch {}
    }
    getNo()
  }, [vType])

  // Auto-calculate TDS when gross or section changes
  const calcTDS = useCallback(async (gross, section, partyType) => {
    if (!section || !gross) { setPvTdsAmt(0); setPvNet(gross||0); return }
    setPvCalcLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/tds/calculate`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ section, grossAmount: gross, partyType })
      })
      const data = await res.json()
      setPvTdsAmt(data.tds || 0)
      setPvNet(data.net   || gross)
      if (!data.applicable && data.reason) toast(`TDS not applicable: ${data.reason}`,{icon:'ℹ️'})
    } catch { setPvTdsAmt(0); setPvNet(gross) }
    finally { setPvCalcLoading(false) }
  }, [])

  useEffect(() => {
    if (vType === 'PV') calcTDS(pvGross, pvTdsSec, pvVendorType)
  }, [pvGross, pvTdsSec, pvVendorType, vType])

  // Vendor select → auto-fill PAN
  const onVendorSelect = e => {
    const v = vendors.find(x => x.id === parseInt(e.target.value))
    setPvVendor(v?.name || e.target.value)
    setPvVendorPan(v?.pan || '')
    setPvVendorType(v?.vendorType === 'Individual' ? 'Individual' : 'Company')
  }

  // Save voucher
  const save = async () => {
    setSaving(true)
    try {
      let res, msg

      if (vType === 'PV') {
        if (!pvVendor || !pvGross) throw new Error('Vendor and amount required')
        res = await fetch(`${BASE_URL}/fi/pv`, {
          method:'POST', headers: hdr(),
          body: JSON.stringify({ date, narration: narration||`Payment to ${pvVendor}`, payTo:pvVendor, invoiceRef:pvInvRef, grossAmount:pvGross, tdsSection:pvTdsSec, tdsAmt:pvTdsAmt, netAmount:pvNet, payMode:pvMode, bankAcct:pvBank, refNo:pvRef, partyType:pvVendorType })
        })
      } else if (vType === 'RV') {
        if (!rvCust || !rvAmount) throw new Error('Customer and amount required')
        res = await fetch(`${BASE_URL}/fi/rv`, {
          method:'POST', headers: hdr(),
          body: JSON.stringify({ date, narration: narration||`Receipt from ${rvCust}`, receiveFrom:rvCust, invoiceRef:rvInvRef, amount:rvAmount, payMode:rvMode, bankAcct:rvBank, refNo:rvRef })
        })
      } else if (vType === 'CN') {
        if (!cnAmount) throw new Error('Amount required')
        res = await fetch(`${BASE_URL}/fi/contra`, {
          method:'POST', headers: hdr(),
          body: JSON.stringify({ date, narration:narration||'Contra Entry', fromAcct:cnFrom, toAcct:cnTo, amount:cnAmount })
        })
      } else {
        // JV
        const totalDr = jvLines.reduce((a,l)=>a+parseFloat(l.debit||0),0)
        const totalCr = jvLines.reduce((a,l)=>a+parseFloat(l.credit||0),0)
        if (Math.abs(totalDr-totalCr)>0.01) throw new Error(`Not balanced — Dr:${INR(totalDr)} ≠ Cr:${INR(totalCr)}`)
        const user = JSON.parse(localStorage.getItem('lnv_user')||'{}')
        res = await fetch(`${BASE_URL}/fi/je`, {
          method:'POST', headers: hdr(),
          body: JSON.stringify({ date, narration, refType:'FI', postedById:user.id||1, lines:jvLines })
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(data.message || 'Posted!')
      nav('/fi/jv')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // Keyboard shortcuts — Tally-style F4/F5/F6/F7
  useEffect(() => {
    const handler = e => {
      // Skip if typing in an input/select/textarea
      const tag = document.activeElement?.tagName
      if (tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return
      // F4=Contra, F5=Payment, F6=Receipt, F7=Journal (Tally standard)
      if (e.key==='F4') { e.preventDefault(); setVType('CN') }
      if (e.key==='F5') { e.preventDefault(); setVType('PV') }
      if (e.key==='F6') { e.preventDefault(); setVType('RV') }
      if (e.key==='F7') { e.preventDefault(); setVType('JV') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const inp  = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
  const lbl  = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }
  const cur  = VOUCHER_TYPES.find(v=>v.key===vType)

  // Bank/Cash accounts for dropdowns
  const bankAccts = accts.filter(a => a.subType === 'Current Asset' && (a.code.startsWith('1100')||a.code.startsWith('1200')||a.code.startsWith('1210')))

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Voucher Entry
          <small style={{fontFamily:'DM Mono,monospace',color:cur?.tx,marginLeft:8,background:cur?.color,padding:'2px 8px',borderRadius:4}}>{vNo}</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/fi/jv')}>Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving?'Posting...':'Post Voucher (Ctrl+A)'}
          </button>
        </div>
      </div>

      {/* Tally-style voucher type selector */}
      <div style={{display:'flex',gap:0,marginBottom:14,border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
        {VOUCHER_TYPES.map((vt,i)=>(
          <div key={vt.key} onClick={()=>setVType(vt.key)} style={{
            flex:1, padding:'10px 14px', cursor:'pointer', textAlign:'center',
            background: vType===vt.key ? vt.color : '#fff',
            borderRight: i<3 ? '1px solid #E0D5E0' : 'none',
            transition:'all .1s',
          }}>
            <div style={{fontSize:18,marginBottom:3}}>{vt.icon}</div>
            <div style={{fontWeight:800,fontSize:13,color:vType===vt.key?vt.tx:'#333'}}>{vt.label}</div>
            <div style={{fontSize:10,color:'#6C757D',marginTop:1}}>{vt.desc}</div>
            <div style={{fontSize:9,color:'#999',marginTop:2}}>Press {vt.shortcut}</div>
          </div>
        ))}
      </div>

      {/* Common fields */}
      <div style={{display:'grid',gridTemplateColumns:'160px 1fr',gap:12,marginBottom:14,padding:16,background:'#fff',border:'1px solid #E0D5E0',borderRadius:8}}>
        <div>
          <label style={lbl}>Date</label>
          <input type="date" style={inp} value={date} onChange={e=>setDate(e.target.value)}/>
        </div>
        <div>
          <label style={lbl}>Narration / Memo</label>
          <input style={inp} value={narration} onChange={e=>setNarration(e.target.value)}
            placeholder={vType==='PV'?'Payment to vendor...':vType==='RV'?'Receipt from customer...':vType==='CN'?'Fund transfer...':'Journal narration...'}/>
        </div>
      </div>

      {/* ── PAYMENT VOUCHER (PV) ── */}
      {vType === 'PV' && (
        <div style={{border:`2px solid ${cur.color}`,borderRadius:8,overflow:'hidden'}}>
          <div style={{background:cur.color,padding:'10px 16px',display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:20}}>💸</span>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:cur.tx}}>Payment Voucher</div>
              <div style={{fontSize:11,color:cur.tx,opacity:.7}}>Accounts Payable Dr → Bank/Cash Cr, TDS Cr</div>
            </div>
          </div>
          <div style={{padding:16,background:'#fff'}}>

            {/* Party */}
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={lbl}>Pay To (Vendor / Party) *</label>
                <select style={{...inp,cursor:'pointer'}} onChange={onVendorSelect} defaultValue="">
                  <option value="">-- Select Vendor --</option>
                  {vendors.map(v=><option key={v.id} value={v.id}>{v.name||v.companyName}</option>)}
                </select>
                {!vendors.length && (
                  <input style={{...inp,marginTop:6}} value={pvVendor} onChange={e=>setPvVendor(e.target.value)} placeholder="Vendor / Party name"/>
                )}
              </div>
              <div>
                <label style={lbl}>PAN</label>
                <input style={{...inp,fontFamily:'DM Mono,monospace',textTransform:'uppercase'}} value={pvVendorPan} onChange={e=>setPvVendorPan(e.target.value)} placeholder="AABCX1234A"/>
              </div>
              <div>
                <label style={lbl}>Party Type</label>
                <select style={{...inp,cursor:'pointer'}} value={pvVendorType} onChange={e=>setPvVendorType(e.target.value)}>
                  <option>Company</option><option>Individual</option><option>HUF</option>
                </select>
              </div>
            </div>

            {/* Invoice ref */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <label style={lbl}>Invoice / Bill Reference</label>
                <input style={inp} value={pvInvRef} onChange={e=>setPvInvRef(e.target.value)} placeholder="VINV-2026-001"/>
              </div>
              <div>
                <label style={lbl}>Payment Mode</label>
                <select style={{...inp,cursor:'pointer'}} value={pvMode} onChange={e=>setPvMode(e.target.value)}>
                  {PAYMENT_MODES.map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Amount section — Tally style */}
            <div style={{background:'#FDF8FC',border:'2px solid #EDE0EA',borderRadius:8,padding:16,marginBottom:14}}>
              <div style={{fontWeight:800,color:'#714B67',fontSize:12,marginBottom:12,textTransform:'uppercase',letterSpacing:.3}}>
                Amount Calculation (type expressions: e.g. 50000+5000 or 100000*2/100)
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,alignItems:'end'}}>
                <div>
                  <label style={lbl}>Gross Amount *</label>
                  <CalcInput value={pvGross} onChange={v=>{setPvGross(v);if(!pvTdsSec)setPvNet(v)}} placeholder="Invoice gross amount"/>
                </div>
                <div>
                  <label style={lbl}>
                    TDS Section
                    <span style={{marginLeft:4,fontSize:9,background:'#FFF3CD',color:'#856404',padding:'1px 4px',borderRadius:3}}>AUTO CALC</span>
                  </label>
                  <select style={{...inp,cursor:'pointer'}} value={pvTdsSec} onChange={e=>setPvTdsSec(e.target.value)}>
                    {TDS_SECTIONS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>TDS Amount {pvCalcLoading&&<span style={{fontSize:9,color:'#714B67'}}>calculating...</span>}</label>
                  <div style={{...inp,background:'#F8F4F8',color:pvTdsAmt>0?'var(--odoo-red)':'#CCC',fontFamily:'DM Mono,monospace',fontWeight:700,display:'flex',alignItems:'center'}}>
                    {pvTdsAmt>0 ? `- ${INR(pvTdsAmt)}` : '— No TDS'}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Net Payment</label>
                  <div style={{...inp,background:'#D4EDDA',color:'#155724',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #C3E6CB'}}>
                    {INR(pvNet||pvGross)}
                  </div>
                </div>
              </div>
              {pvTdsAmt > 0 && (
                <div style={{marginTop:10,padding:'8px 12px',background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:5,fontSize:12,color:'#856404'}}>
                  <strong>TDS Entry:</strong> Dr Accounts Payable {INR(pvGross)} = Cr Bank {INR(pvNet)} + Cr TDS Payable {INR(pvTdsAmt)} (Sec {pvTdsSec})
                </div>
              )}
            </div>

            {/* Payment details */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
              <div>
                <label style={lbl}>Pay From (Bank / Cash)</label>
                <select style={{...inp,cursor:'pointer'}} value={pvBank} onChange={e=>setPvBank(e.target.value)}>
                  {bankAccts.map(a=><option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                  <option value="1200">1200 · Bank — Primary Account</option>
                  <option value="1100">1100 · Cash in Hand</option>
                </select>
              </div>
              <div>
                <label style={lbl}>UTR / Cheque / Ref No.</label>
                <input style={inp} value={pvRef} onChange={e=>setPvRef(e.target.value)} placeholder="UTR123456789"/>
              </div>
              <div>
                <label style={lbl}>Auto Journal Preview</label>
                <div style={{fontSize:11,color:'#6C757D',padding:'8px 10px',background:'#F8F9FA',borderRadius:5,border:'1px solid #E0D5E0',lineHeight:1.7}}>
                  Dr: 2100 AP {INR(pvGross)}<br/>
                  Cr: {pvBank} Bank {INR(pvNet||pvGross)}<br/>
                  {pvTdsAmt>0&&<>Cr: 2300 TDS {INR(pvTdsAmt)}</>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIPT VOUCHER (RV) ── */}
      {vType === 'RV' && (
        <div style={{border:`2px solid ${cur.color}`,borderRadius:8,overflow:'hidden'}}>
          <div style={{background:cur.color,padding:'10px 16px',display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:20}}>💰</span>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:cur.tx}}>Receipt Voucher</div>
              <div style={{fontSize:11,color:cur.tx,opacity:.7}}>Bank/Cash Dr → Accounts Receivable Cr</div>
            </div>
          </div>
          <div style={{padding:16,background:'#fff'}}>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={{...lbl}}>Receive From (Customer) *</label>
                <select style={{...inp,cursor:'pointer'}} onChange={e=>{const c=customers.find(x=>x.id===parseInt(e.target.value));setRvCust(c?.name||e.target.value)}} defaultValue="">
                  <option value="">-- Select Customer --</option>
                  {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {!customers.length && (
                  <input style={{...inp,marginTop:6}} value={rvCust} onChange={e=>setRvCust(e.target.value)} placeholder="Customer name"/>
                )}
              </div>
              <div>
                <label style={lbl}>Invoice Reference</label>
                <input style={inp} value={rvInvRef} onChange={e=>setRvInvRef(e.target.value)} placeholder="INV-2026-001"/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={lbl}>Amount Received *</label>
                <CalcInput value={rvAmount} onChange={setRvAmount} placeholder="Amount"/>
              </div>
              <div>
                <label style={lbl}>Deposit To (Bank / Cash)</label>
                <select style={{...inp,cursor:'pointer'}} value={rvBank} onChange={e=>setRvBank(e.target.value)}>
                  {bankAccts.map(a=><option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                  <option value="1200">1200 · Bank — Primary Account</option>
                  <option value="1100">1100 · Cash in Hand</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Mode</label>
                <select style={{...inp,cursor:'pointer'}} value={rvMode} onChange={e=>setRvMode(e.target.value)}>
                  {PAYMENT_MODES.map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>UTR / Cheque No.</label>
                <input style={inp} value={rvRef} onChange={e=>setRvRef(e.target.value)} placeholder="UTR123456789"/>
              </div>
            </div>
            {/* Preview */}
            <div style={{padding:'10px 14px',background:'#D4EDDA',border:'1px solid #C3E6CB',borderRadius:6,fontSize:12,color:'#155724'}}>
              <strong>Journal Preview:</strong> Dr {rvBank} Bank {INR(rvAmount)} = Cr 1300 Accounts Receivable {INR(rvAmount)}
              {' '}<span style={{opacity:.7}}>— {rvCust} | Ref: {rvInvRef||'—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTRA ENTRY (CN) ── */}
      {vType === 'CN' && (
        <div style={{border:`2px solid ${cur.color}`,borderRadius:8,overflow:'hidden'}}>
          <div style={{background:cur.color,padding:'10px 16px',display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:20}}>🔄</span>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:cur.tx}}>Contra Entry</div>
              <div style={{fontSize:11,color:cur.tx,opacity:.7}}>Bank ↔ Cash, Bank ↔ Bank transfers</div>
            </div>
          </div>
          <div style={{padding:16,background:'#fff'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 80px 1fr 1fr',gap:12,alignItems:'center',marginBottom:14}}>
              <div>
                <label style={lbl}>Transfer From</label>
                <select style={{...inp,cursor:'pointer'}} value={cnFrom} onChange={e=>setCnFrom(e.target.value)}>
                  <option value="1200">1200 · Bank — Primary Account</option>
                  <option value="1210">1210 · Bank — OD Account</option>
                  <option value="1100">1100 · Cash in Hand</option>
                </select>
              </div>
              <div style={{textAlign:'center',fontSize:24,color:'#714B67',marginTop:20}}>→</div>
              <div>
                <label style={lbl}>Transfer To</label>
                <select style={{...inp,cursor:'pointer'}} value={cnTo} onChange={e=>setCnTo(e.target.value)}>
                  <option value="1100">1100 · Cash in Hand</option>
                  <option value="1200">1200 · Bank — Primary Account</option>
                  <option value="1210">1210 · Bank — OD Account</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Amount</label>
                <CalcInput value={cnAmount} onChange={setCnAmount} placeholder="Transfer amount"/>
              </div>
            </div>
            <div style={{padding:'10px 14px',background:'#D1ECF1',border:'1px solid #B8DAFF',borderRadius:6,fontSize:12,color:'#0C5460'}}>
              <strong>Journal Preview:</strong> Dr {cnTo} {INR(cnAmount)} = Cr {cnFrom} {INR(cnAmount)}
            </div>
          </div>
        </div>
      )}

      {/* ── MANUAL JOURNAL (JV) ── */}
      {vType === 'JV' && (
        <div style={{border:`2px solid ${cur.color}`,borderRadius:8,overflow:'hidden'}}>
          <div style={{background:cur.color,padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:20}}>📒</span>
              <div>
                <div style={{fontWeight:800,fontSize:14,color:cur.tx}}>Journal Voucher</div>
                <div style={{fontSize:11,color:cur.tx,opacity:.7}}>Manual double-entry — Dr must equal Cr</div>
              </div>
            </div>
            <button onClick={()=>{setJvLines(l=>[...l,{id:jvNid,debitAcctCode:'',creditAcctCode:'',debit:'',credit:'',narration:''}]);setJvNid(n=>n+1)}}
              style={{padding:'5px 14px',background:cur.color,color:cur.tx,border:`1px solid ${cur.tx}`,borderRadius:4,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              + Add Line
            </button>
          </div>
          <div style={{background:'#fff'}}>
            {/* Headers */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 120px 120px 1fr 30px',padding:'6px 14px',background:'#F8F9FA',borderBottom:'2px solid #E0D5E0',fontSize:10,fontWeight:700,color:'#6C757D',gap:8,textTransform:'uppercase'}}>
              <span>Debit Account</span><span>Credit Account</span>
              <span style={{textAlign:'right',color:'var(--odoo-red)'}}>Debit (Dr)</span>
              <span style={{textAlign:'right',color:'var(--odoo-green)'}}>Credit (Cr)</span>
              <span>Narration</span><span/>
            </div>
            {jvLines.map((l,i)=>(
              <div key={l.id} style={{display:'grid',gridTemplateColumns:'1fr 1fr 120px 120px 1fr 30px',padding:'7px 14px',borderBottom:'1px solid #F0EEF0',gap:8,alignItems:'center',background:i%2===0?'#fff':'#FDFBFD'}}>
                <select style={{...{padding:'6px 8px',border:'1.5px solid #E0D5E0',borderRadius:4,fontSize:11,outline:'none',width:'100%'},cursor:'pointer'}}
                  value={l.debitAcctCode} onChange={e=>setJvLines(ls=>ls.map((x,j)=>j!==i?x:{...x,debitAcctCode:e.target.value}))}>
                  <option value="">-- Select --</option>
                  {accts.map(a=><option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                </select>
                <select style={{...{padding:'6px 8px',border:'1.5px solid #E0D5E0',borderRadius:4,fontSize:11,outline:'none',width:'100%'},cursor:'pointer'}}
                  value={l.creditAcctCode} onChange={e=>setJvLines(ls=>ls.map((x,j)=>j!==i?x:{...x,creditAcctCode:e.target.value}))}>
                  <option value="">-- Select --</option>
                  {accts.map(a=><option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                </select>
                <CalcInput style={{textAlign:'right',borderColor:l.debit?'#DC3545':'#E0D5E0'}}
                  value={l.debit} onChange={v=>setJvLines(ls=>ls.map((x,j)=>j!==i?x:{...x,debit:v}))}/>
                <CalcInput style={{textAlign:'right',borderColor:l.credit?'#28A745':'#E0D5E0'}}
                  value={l.credit} onChange={v=>setJvLines(ls=>ls.map((x,j)=>j!==i?x:{...x,credit:v}))}/>
                <input style={{padding:'6px 8px',border:'1.5px solid #E0D5E0',borderRadius:4,fontSize:11,outline:'none',width:'100%'}}
                  value={l.narration} onChange={e=>setJvLines(ls=>ls.map((x,j)=>j!==i?x:{...x,narration:e.target.value}))} placeholder="Line narration"/>
                <button onClick={()=>jvLines.length>2&&setJvLines(ls=>ls.filter((_,j)=>j!==i))}
                  style={{background:'none',border:'none',color:'#DC3545',cursor:'pointer',fontSize:16}}>✕</button>
              </div>
            ))}
            {/* Totals */}
            {(() => {
              const totalDr = jvLines.reduce((a,l)=>a+parseFloat(l.debit||0),0)
              const totalCr = jvLines.reduce((a,l)=>a+parseFloat(l.credit||0),0)
              const balanced = Math.abs(totalDr-totalCr)<0.01
              return (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 120px 120px 1fr 30px',padding:'8px 14px',background:balanced?'#D4EDDA':'#FFF3CD',gap:8,fontWeight:800,fontSize:12}}>
                  <span style={{color:balanced?'#155724':'#856404'}}>{balanced?'✓ BALANCED':'⚠ NOT BALANCED'}</span>
                  <span/>
                  <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-red)',fontSize:14}}>{INR(totalDr)}</span>
                  <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-green)',fontSize:14}}>{INR(totalCr)}</span>
                  <span style={{color:'#856404',fontSize:11}}>{!balanced&&`Diff: ${INR(Math.abs(totalDr-totalCr))}`}</span>
                  <span/>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0 20px'}}>
        <div style={{fontSize:11,color:'#6C757D'}}>
          Keyboard shortcuts (click outside any input first): F4=Contra · F5=Payment · F6=Receipt · F7=Journal
          <br/>Calculator: Type expressions in amount fields — e.g. <code>50000+5000</code> or <code>100000*18/100</code>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/fi/jv')}>Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving ? 'Posting...' : `Post ${cur?.label} Voucher`}
          </button>
        </div>
      </div>
    </div>
  )
}
