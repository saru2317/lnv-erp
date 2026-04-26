import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const inp  = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl  = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
const GROUP_STYLE = {
  ASSET:     { cls:'asset', label:' ASSETS (1xxx)',     bc:'dr' },
  LIABILITY: { cls:'liab',  label:' LIABILITIES (2xxx)', bc:'cr' },
  EQUITY:    { cls:'liab',  label:' EQUITY (3xxx)',      bc:'cr' },
  INCOME:    { cls:'inc',   label:' INCOME (4xxx)',      bc:'cr' },
  EXPENSE:   { cls:'exp',   label:' EXPENSES (5xxx-6xxx)',bc:'dr' },
}

// ── Breadcrumb ────────────────────────────────────────────────
function Breadcrumb({ items, onNavigate }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6,
      fontSize:12, color:'#6C757D', marginBottom:14, flexWrap:'wrap' }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color:'#CCC' }}>›</span>}
          <span onClick={() => i < items.length-1 ? onNavigate(i) : null}
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

// ── LAYER 3: Transactions for account + month ─────────────────
function TransactionView({ account, month, year, onBack }) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)

  const fy   = month === 'Apr'||month==='May'||month==='Jun'||month==='Jul'||month==='Aug'||month==='Sep'||month==='Oct'||month==='Nov'||month==='Dec' ? year : year+1
  const mIdx = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(month)
  const from = new Date(fy, mIdx, 1).toISOString().split('T')[0]
  const to   = new Date(fy, mIdx+1, 0).toISOString().split('T')[0]

  useEffect(() => {
    fetch(`${BASE_URL}/fi/gl/${account.code}?from=${from}&to=${to}`, { headers: hdr2() })
      .then(r=>r.json())
      .then(d => setRows(d.data?.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [account.code, from, to])

  const totDr  = rows.reduce((s,r)=>s+parseFloat(r.debit||0),0)
  const totCr  = rows.reduce((s,r)=>s+parseFloat(r.credit||0),0)

  return (
    <div>
      <Breadcrumb
        items={['Chart of Accounts', `${account.code} · ${account.name}`, `${month} ${fy}`]}
        onNavigate={i => i===0 ? onBack('root') : onBack('account')}
      />
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14,
        padding:'10px 16px', background:'#FBF7FA', border:'1px solid #E0D5E0',
        borderRadius:7, borderLeft:'4px solid #714B67' }}>
        <div>
          <span style={{ fontFamily:'DM Mono,monospace', fontSize:13, fontWeight:700, color:'#714B67' }}>{account.code}</span>
          <span style={{ fontSize:13, fontWeight:600, color:'#1C1C1C', marginLeft:10 }}>{account.name}</span>
        </div>
        <span style={{ fontSize:11, background:'#EDE0EA', color:'#714B67', padding:'2px 8px', borderRadius:8, fontWeight:600 }}>{account.type}</span>
        <span style={{ marginLeft:'auto', fontSize:13, fontWeight:700, color:'#714B67', fontFamily:'DM Mono,monospace' }}>
          Period: {month} {fy}
        </span>
      </div>

      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
              {['Date','Voucher No.','Narration','Debit (\u20b9)','Credit (\u20b9)','Balance (\u20b9)'].map(h=>(
                <th key={h} style={{ padding:'9px 14px', fontSize:11, fontWeight:700,
                  color:'#6C757D', textAlign: h.includes('\u20b9')?'right':'left',
                  textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} style={{padding:30,textAlign:'center',color:'#6C757D'}}>No transactions for {month} {fy}</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}
                onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                <td style={{ padding:'9px 14px', fontSize:12, fontFamily:'DM Mono,monospace', color:'#6C757D' }}>
                  {new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                </td>
                <td style={{ padding:'9px 14px', fontSize:12, fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67' }}>{r.jeNo}</td>
                <td style={{ padding:'9px 14px', fontSize:12, color:'#1C1C1C' }}>{r.narration}</td>
                <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right', fontFamily:'DM Mono,monospace',
                  color: r.debit>0 ? '#0C5460':'#CCC', fontWeight:r.debit>0?700:400 }}>
                  {r.debit>0 ? INR(r.debit) : '—'}
                </td>
                <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right', fontFamily:'DM Mono,monospace',
                  color: r.credit>0 ? '#721C24':'#CCC', fontWeight:r.credit>0?700:400 }}>
                  {r.credit>0 ? INR(r.credit) : '—'}
                </td>
                <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right', fontFamily:'DM Mono,monospace',
                  fontWeight:700, color: r.balance>=0?'#155724':'#721C24' }}>
                  {INR(r.balance)} {r.balSide}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background:'#F8F4F8', borderTop:'2px solid #714B67' }}>
              <td colSpan={3} style={{ padding:'9px 14px', fontSize:12, fontWeight:700, color:'#1C1C1C' }}>Total — {month} {fy}</td>
              <td style={{ padding:'9px 14px', fontSize:13, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#0C5460' }}>{INR(totDr)}</td>
              <td style={{ padding:'9px 14px', fontSize:13, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#721C24' }}>{INR(totCr)}</td>
              <td style={{ padding:'9px 14px', fontSize:13, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:(totDr-totCr)>=0?'#155724':'#721C24' }}>
                {INR(Math.abs(totDr-totCr))} {(totDr-totCr)>=0?'Dr':'Cr'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── LAYER 2: Month-wise summary ───────────────────────────────
function AccountLedger({ account, year, onMonthClick, onBack }) {
  const [months,  setMonths]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch GL for full year and group by month
    const from = `${year}-04-01`
    const to   = `${year+1}-03-31`
    fetch(`${BASE_URL}/fi/gl/${account.code}?from=${from}&to=${to}`, { headers: hdr2() })
      .then(r=>r.json())
      .then(d => {
        const rows = d.data?.rows || []
        // Group by month
        const map = {}
        rows.forEach(r => {
          const m = new Date(r.date).toLocaleString('en-IN',{month:'short'})
          if (!map[m]) map[m] = { dr:0, cr:0 }
          map[m].dr += parseFloat(r.debit  || 0)
          map[m].cr += parseFloat(r.credit || 0)
        })
        setMonths(MONTHS.map(m => ({
          month: m,
          dr:    map[m]?.dr || 0,
          cr:    map[m]?.cr || 0,
          bal:   (map[m]?.dr||0) - (map[m]?.cr||0),
        })))
      })
      .catch(() => setMonths(MONTHS.map(m => ({ month:m, dr:0, cr:0, bal:0 }))))
      .finally(() => setLoading(false))
  }, [account.code, year])

  const totDr = months.reduce((s,m)=>s+m.dr, 0)
  const totCr = months.reduce((s,m)=>s+m.cr, 0)

  return (
    <div>
      <Breadcrumb
        items={['Chart of Accounts', `${account.code} · ${account.name}`]}
        onNavigate={() => onBack()}
      />
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14,
        padding:'12px 16px', background:'#FBF7FA', border:'1px solid #E0D5E0',
        borderRadius:7, borderLeft:'4px solid #714B67' }}>
        <div>
          <div style={{ fontFamily:'DM Mono,monospace', fontSize:14, fontWeight:800, color:'#714B67' }}>{account.code}</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#1C1C1C' }}>{account.name}</div>
        </div>
        <span style={{ fontSize:11, background:'#EDE0EA', color:'#714B67', padding:'2px 8px', borderRadius:8, fontWeight:600 }}>{account.type}</span>
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <div style={{ fontSize:11, color:'#6C757D', textTransform:'uppercase', letterSpacing:.5 }}>Closing Balance</div>
          <div style={{ fontFamily:'DM Mono,monospace', fontSize:16, fontWeight:800, color:'#714B67' }}>{account.bal}</div>
        </div>
      </div>

      <div style={{ fontSize:12, color:'#6C757D', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
        <span>💡</span><span>Click on any month to view individual transactions</span>
      </div>

      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
              {['Month','Debit (\u20b9)','Credit (\u20b9)','Net (\u20b9)',''].map(h=>(
                <th key={h} style={{ padding:'9px 14px', fontSize:11, fontWeight:700,
                  color:'#6C757D', textAlign:h==='Month'||h===''?'left':'right',
                  textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading months...</td></tr>
            ) : months.map((m, i) => (
              <tr key={i}
                onClick={() => onMonthClick(m.month)}
                style={{ borderBottom:'1px solid #F0EEF0', cursor:'pointer', background:i%2===0?'#fff':'#FDFBFD' }}
                onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600, color:'#1C1C1C' }}>{m.month} {year}</td>
                <td style={{ padding:'10px 14px', fontSize:13, textAlign:'right', fontFamily:'DM Mono,monospace', color:'#0C5460', fontWeight:m.dr>0?600:400 }}>
                  {m.dr > 0 ? INR(m.dr) : '—'}
                </td>
                <td style={{ padding:'10px 14px', fontSize:13, textAlign:'right', fontFamily:'DM Mono,monospace', color:'#721C24', fontWeight:m.cr>0?600:400 }}>
                  {m.cr > 0 ? INR(m.cr) : '—'}
                </td>
                <td style={{ padding:'10px 14px', fontSize:13, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700, color:m.bal>=0?'#155724':'#721C24' }}>
                  {m.dr===0&&m.cr===0 ? '—' : `${INR(Math.abs(m.bal))} ${m.bal>=0?'Dr':'Cr'}`}
                </td>
                <td style={{ padding:'10px 14px', textAlign:'right' }}>
                  <span style={{ fontSize:11, color:'#714B67', fontWeight:600 }}>View Txns ›</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background:'#F8F4F8', borderTop:'2px solid #714B67' }}>
              <td style={{ padding:'10px 14px', fontSize:13, fontWeight:800, color:'#1C1C1C' }}>Total FY {year}–{year+1}</td>
              <td style={{ padding:'10px 14px', fontSize:14, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#0C5460' }}>{INR(totDr)}</td>
              <td style={{ padding:'10px 14px', fontSize:14, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#721C24' }}>{INR(totCr)}</td>
              <td style={{ padding:'10px 14px', fontSize:14, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:(totDr-totCr)>=0?'#155724':'#721C24' }}>
                {INR(Math.abs(totDr-totCr))} {(totDr-totCr)>=0?'Dr':'Cr'}
              </td>
              <td/>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── LAYER 1: Main COA ─────────────────────────────────────────
export default function ChartOfAccounts() {
  const [accts,      setAccts]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [open,       setOpen]       = useState({ ASSET:true, LIABILITY:true, EQUITY:true, INCOME:true, EXPENSE:true })
  const [showAdd,    setShowAdd]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [newAcct,    setNewAcct]    = useState({ code:'', name:'', type:'EXPENSE', subType:'' })
  const year = new Date().getFullYear()

  // Drill-down state
  const [layer,      setLayer]      = useState('root')
  const [selAccount, setSelAccount] = useState(null)
  const [selMonth,   setSelMonth]   = useState(null)

  const goAccount = (item) => { setSelAccount(item); setLayer('account') }
  const goMonth   = (m)    => { setSelMonth(m);      setLayer('txn')     }
  const goBack    = (to)   => {
    if (to === 'root')    { setLayer('root');    setSelAccount(null); setSelMonth(null) }
    if (to === 'account') { setLayer('account'); setSelMonth(null) }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/coa/balances`, { headers: hdr2() })
      const data = await res.json()
      setAccts(data.data || [])
    } catch { toast.error('Failed to load COA') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const saveAcct = async () => {
    if (!newAcct.code || !newAcct.name) return toast.error('Code and name required')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/coa`, { method:'POST', headers: hdr(), body: JSON.stringify(newAcct) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.data.code} · ${data.data.name} created`)
      setShowAdd(false); setNewAcct({ code:'', name:'', type:'EXPENSE', subType:'' }); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // Group by type
  const grouped = {}
  accts.forEach(a => {
    const t = a.type
    if (!grouped[t]) grouped[t] = []
    grouped[t].push(a)
  })

  // ── LAYER 3 ──
  if (layer === 'txn') return (
    <TransactionView account={selAccount} month={selMonth} year={year} onBack={goBack} />
  )

  // ── LAYER 2 ──
  if (layer === 'account') return (
    <AccountLedger account={selAccount} year={year} onMonthClick={goMonth} onBack={() => goBack('root')} />
  )

  // ── LAYER 1 ROOT ──
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Chart of Accounts <small>Account Master</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : 'Add Account'}
          </button>
        </div>
      </div>

      {/* Hint */}
      <div style={{ fontSize:12, color:'#6C757D', marginBottom:10, padding:'7px 12px',
        background:'#FBF7FA', borderRadius:5, border:'1px solid #E0D5E0', display:'flex', alignItems:'center', gap:6 }}>
        <span>💡</span>
        <span>Click on any account to drill down → Month Summary → Transactions (Tally-style)</span>
      </div>

      {/* Add Account Form */}
      {showAdd && (
        <div style={{ border:'2px solid #714B67', borderRadius:8, padding:16, background:'#FDF8FC', marginBottom:14 }}>
          <div style={{ fontWeight:700, color:'#714B67', marginBottom:12 }}>New Account</div>
          <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 150px 1fr', gap:12, marginBottom:10 }}>
            <div><label style={lbl}>Code *</label><input style={inp} value={newAcct.code} onChange={e=>setNewAcct(a=>({...a,code:e.target.value}))} placeholder="6910"/></div>
            <div><label style={lbl}>Account Name *</label><input style={inp} value={newAcct.name} onChange={e=>setNewAcct(a=>({...a,name:e.target.value}))} placeholder="Misc Expenses"/></div>
            <div>
              <label style={lbl}>Type *</label>
              <select style={{...inp,cursor:'pointer'}} value={newAcct.type} onChange={e=>setNewAcct(a=>({...a,type:e.target.value}))}>
                {['ASSET','LIABILITY','EQUITY','INCOME','EXPENSE'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Sub-Type</label><input style={inp} value={newAcct.subType} onChange={e=>setNewAcct(a=>({...a,subType:e.target.value}))} placeholder="Indirect Expense"/></div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button className="btn btn-s sd-bsm" onClick={()=>setShowAdd(false)}>Cancel</button>
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={saveAcct}>{saving?'Saving...':'Save Account'}</button>
          </div>
        </div>
      )}

      {/* COA Groups */}
      {loading ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading Chart of Accounts...</div>
      ) : (
        Object.entries(GROUP_STYLE).map(([type, gs]) => {
          const items = grouped[type] || []
          if (!items.length) return null
          return (
            <div key={type} className="coa-group">
              <div className="coa-grp-hdr" onClick={() => setOpen(p=>({...p,[type]:!p[type]}))}>
                {open[type]?'▾':'►'} {gs.label}
                <span style={{ marginLeft:'auto', fontSize:11, fontWeight:400, color:'var(--odoo-gray)' }}>
                  {items.length} accounts
                </span>
              </div>
              {open[type] && (
                <div className="coa-items">
                  {items.map(item => (
                    <div key={item.code} className="coa-item"
                      onClick={() => goAccount({ ...item, bal: item.balance > 0 ? INR(item.balance) : '—', type: item.subType || item.type })}
                      style={{ cursor:'pointer' }}
                      onMouseEnter={e=>{ e.currentTarget.style.background='#FBF7FA'; e.currentTarget.style.paddingLeft='18px'; e.currentTarget.style.transition='all .15s' }}
                      onMouseLeave={e=>{ e.currentTarget.style.background=''; e.currentTarget.style.paddingLeft='' }}>
                      <span>
                        <span className="ca-code">{item.code}</span>
                        {item.name}
                        <span style={{ fontSize:10, background:'#F0EEEB', padding:'1px 6px', borderRadius:8, marginLeft:8, color:'var(--odoo-gray)' }}>
                          {item.subType || item.type}
                        </span>
                      </span>
                      <span style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span className={`ca-bal ${gs.bc}`}>
                          {item.balance > 0 ? INR(item.balance) : '—'} {item.balSide||gs.bc==='dr'?'Dr':'Cr'}
                        </span>
                        <span style={{ fontSize:11, color:'#714B67', fontWeight:600, opacity:.7 }}>Ledger ›</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
