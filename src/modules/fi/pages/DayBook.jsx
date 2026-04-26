import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const fmt  = n => (!n||n===0) ? '—' : INR(n)
const fmtD = d => new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})

const TYPE_COLORS = {
  SD:  { bg:'#D4EDDA', color:'#155724', label:'Sales'      },
  MM:  { bg:'#FFF3CD', color:'#856404', label:'Purchase'   },
  FI:  { bg:'#EDE0EA', color:'#714B67', label:'Journal'    },
  HCM: { bg:'#F4ECF7', color:'#6C3483', label:'Payroll'    },
  PP:  { bg:'#D1ECF1', color:'#0C5460', label:'Production' },
  WM:  { bg:'#CCE5FF', color:'#004085', label:'Warehouse'  },
  PM:  { bg:'#F8D7DA', color:'#721C24', label:'Maintenance'},
}

// ── Breadcrumb ────────────────────────────────────────────────
function Breadcrumb({ crumbs, onNavigate }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6,
      fontSize:12, color:'#6C757D', marginBottom:14, flexWrap:'wrap' }}>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color:'#CCC' }}>›</span>}
          <span onClick={() => i < crumbs.length-1 && onNavigate(i)}
            style={{ color: i < crumbs.length-1 ? '#714B67' : '#1C1C1C',
              cursor: i < crumbs.length-1 ? 'pointer' : 'default',
              fontWeight: i===crumbs.length-1 ? 700 : 400,
              textDecoration: i < crumbs.length-1 ? 'underline' : 'none' }}>
            {c}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

// ── LAYER 3: Account Ledger (from DayBook drill) ──────────────
function AccountLedger({ acctCode, acctName, fromDate, toDate, onBack }) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE_URL}/fi/gl/${acctCode}?from=${fromDate}&to=${toDate}`, { headers: hdr2() })
      .then(r=>r.json())
      .then(d => setRows(d.data?.rows || []))
      .catch(()=>setRows([]))
      .finally(()=>setLoading(false))
  }, [acctCode, fromDate, toDate])

  const totDr = rows.reduce((s,r)=>s+parseFloat(r.debit||0), 0)
  const totCr = rows.reduce((s,r)=>s+parseFloat(r.credit||0), 0)

  return (
    <div>
      <Breadcrumb
        crumbs={['Day Book', `${acctCode} · ${acctName}`]}
        onNavigate={i => i===0 && onBack('root')}
      />
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14,
        padding:'10px 16px', background:'#FBF7FA', border:'1px solid #E0D5E0',
        borderRadius:7, borderLeft:'4px solid #714B67' }}>
        <div>
          <span style={{ fontFamily:'DM Mono,monospace', fontSize:13, fontWeight:700, color:'#714B67' }}>{acctCode}</span>
          <span style={{ fontSize:13, fontWeight:600, color:'#1C1C1C', marginLeft:10 }}>{acctName}</span>
        </div>
        <span style={{ marginLeft:'auto', fontSize:12, color:'#6C757D' }}>
          {fromDate} to {toDate}
        </span>
      </div>

      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
              {['Date','Voucher No.','Narration','Debit (\u20b9)','Credit (\u20b9)','Balance (\u20b9)'].map(h=>(
                <th key={h} style={{ padding:'9px 14px', fontSize:10, fontWeight:700,
                  color:'#6C757D', textAlign:h.includes('\u20b9')?'right':'left',
                  textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} style={{padding:30,textAlign:'center',color:'#6C757D'}}>No transactions in this period</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}
                onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                <td style={{ padding:'9px 14px', fontSize:12, fontFamily:'DM Mono,monospace', color:'#6C757D' }}>
                  {new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                </td>
                <td style={{ padding:'9px 14px', fontSize:12, fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67' }}>{r.jeNo}</td>
                <td style={{ padding:'9px 14px', fontSize:12 }}>{r.narration}</td>
                <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right', fontFamily:'DM Mono,monospace', color:r.debit>0?'#0C5460':'#CCC', fontWeight:r.debit>0?700:400 }}>
                  {r.debit>0?INR(r.debit):'—'}
                </td>
                <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right', fontFamily:'DM Mono,monospace', color:r.credit>0?'#721C24':'#CCC', fontWeight:r.credit>0?700:400 }}>
                  {r.credit>0?INR(r.credit):'—'}
                </td>
                <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700, color:r.balance>=0?'#155724':'#721C24' }}>
                  {INR(r.balance)} {r.balSide}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background:'#F8F4F8', borderTop:'2px solid #714B67' }}>
              <td colSpan={3} style={{ padding:'9px 14px', fontWeight:800, color:'#1C1C1C' }}>Total</td>
              <td style={{ padding:'9px 14px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#0C5460', fontSize:14 }}>{INR(totDr)}</td>
              <td style={{ padding:'9px 14px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#721C24', fontSize:14 }}>{INR(totCr)}</td>
              <td/>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── LAYER 2: Voucher Detail ───────────────────────────────────
function VoucherDetail({ je, onAccountClick, onBack }) {
  const tc     = TYPE_COLORS[je.refType] || TYPE_COLORS.FI
  const lines  = je.lines || []
  const totDr  = lines.reduce((s,l)=>s+parseFloat(l.debit||0), 0)
  const totCr  = lines.reduce((s,l)=>s+parseFloat(l.credit||0), 0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Voucher Detail <small>{je.jeNo} · {fmtD(je.date)}</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Print</button>
        </div>
      </div>

      <Breadcrumb
        crumbs={['Day Book', je.jeNo + ' Detail']}
        onNavigate={i => i===0 && onBack()}
      />

      {/* Voucher header card */}
      <div style={{ padding:'12px 16px', background:'#FBF7FA', border:'1px solid #E0D5E0',
        borderRadius:7, borderLeft:`4px solid ${tc.color}`, marginBottom:14,
        display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, color:'#6C757D', textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>Voucher No.</div>
          <div style={{ fontFamily:'DM Mono,monospace', fontSize:15, fontWeight:800, color:'#714B67' }}>{je.jeNo}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'#6C757D', textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>Date</div>
          <div style={{ fontSize:13, fontWeight:700 }}>{fmtD(je.date)}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'#6C757D', textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>Type</div>
          <span style={{ padding:'3px 10px', borderRadius:8, fontSize:12, fontWeight:700, background:tc.bg, color:tc.color }}>{tc.label}</span>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:'#6C757D', textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>Narration</div>
          <div style={{ fontSize:12, color:'#1C1C1C' }}>{je.narration}</div>
        </div>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#0C5460', fontWeight:700, textTransform:'uppercase', letterSpacing:.5 }}>Total Dr</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#0C5460', fontFamily:'DM Mono,monospace' }}>{INR(totDr)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#721C24', fontWeight:700, textTransform:'uppercase', letterSpacing:.5 }}>Total Cr</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#721C24', fontFamily:'DM Mono,monospace' }}>{INR(totCr)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:totDr===totCr?'#155724':'#856404' }}>Balanced</div>
            <div style={{ fontSize:13, fontWeight:800, color:totDr===totCr?'#155724':'#856404' }}>{totDr===totCr?'✓ Yes':'✗ No'}</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize:12, color:'#6C757D', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
        <span>💡</span><span>Click on any account name to view its ledger</span>
      </div>

      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
              {['#','Account','Narration','Debit (\u20b9)','Credit (\u20b9)'].map(h=>(
                <th key={h} style={{ padding:'9px 14px', fontSize:10, fontWeight:700,
                  color:'#6C757D', textAlign:h.includes('\u20b9')?'right':'left',
                  textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}
                onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                <td style={{ padding:'10px 14px', fontSize:12, color:'#6C757D', width:36 }}>{i+1}</td>
                <td style={{ padding:'10px 14px' }}>
                  {/* Click account → drill to account ledger */}
                  {(l.debitAcctCode||l.creditAcctCode) ? (
                    <span
                      onClick={() => onAccountClick(l.debitAcctCode||l.creditAcctCode, l.narration||je.narration)}
                      style={{ fontSize:13, fontWeight:600, color:'#714B67', cursor:'pointer',
                        textDecoration:'underline', textDecorationStyle:'dotted' }}>
                      {l.debitAcctCode||l.creditAcctCode}
                    </span>
                  ) : '—'}
                  <span style={{ fontSize:10, marginLeft:6, color:'#6C757D' }}>
                    {parseFloat(l.debit)>0?'(Dr)':'(Cr)'}
                  </span>
                </td>
                <td style={{ padding:'10px 14px', fontSize:12, color:'#6C757D' }}>{l.narration||je.narration}</td>
                <td style={{ padding:'10px 14px', fontSize:13, textAlign:'right', fontFamily:'DM Mono,monospace',
                  color:parseFloat(l.debit)>0?'#0C5460':'#CCC', fontWeight:parseFloat(l.debit)>0?700:400 }}>
                  {parseFloat(l.debit)>0?INR(l.debit):'—'}
                </td>
                <td style={{ padding:'10px 14px', fontSize:13, textAlign:'right', fontFamily:'DM Mono,monospace',
                  color:parseFloat(l.credit)>0?'#721C24':'#CCC', fontWeight:parseFloat(l.credit)>0?700:400 }}>
                  {parseFloat(l.credit)>0?INR(l.credit):'—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background:'#F8F4F8', borderTop:'2px solid #714B67' }}>
              <td colSpan={3} style={{ padding:'10px 14px', fontSize:13, fontWeight:800, color:'#1C1C1C' }}>Total</td>
              <td style={{ padding:'10px 14px', fontSize:14, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#0C5460' }}>{INR(totDr)}</td>
              <td style={{ padding:'10px 14px', fontSize:14, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#721C24' }}>{INR(totCr)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── LAYER 1: Day Book Main ────────────────────────────────────
export default function DayBook() {
  const today = new Date().toISOString().split('T')[0]
  const [fromDate, setFromDate] = useState(today)
  const [toDate,   setToDate]   = useState(today)
  const [vType,    setVType]    = useState('All')
  const [search,   setSearch]   = useState('')
  const [entries,  setEntries]  = useState([])
  const [loading,  setLoading]  = useState(true)

  // Drill-down state
  const [layer,      setLayer]      = useState('root')
  const [selJE,      setSelJE]      = useState(null)
  const [selAcct,    setSelAcct]    = useState(null)

  const goVoucher    = (je)              => { setSelJE(je);                       setLayer('voucher') }
  const goAccount    = (code, name)      => { setSelAcct({ code, name });         setLayer('account') }
  const goBack       = (to)             => {
    if (to==='root'||!to)  { setLayer('root');    setSelJE(null);    setSelAcct(null) }
    if (to==='voucher')    { setLayer('voucher'); setSelAcct(null)  }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/daybook?from=${fromDate}&to=${toDate}`, { headers: hdr2() })
      const data = await res.json()
      setEntries(data.data || [])
    } catch { toast.error('Failed to load day book') }
    finally { setLoading(false) }
  }, [fromDate, toDate])
  useEffect(() => { load() }, [load])

  // ── LAYER 3: Account Ledger ──
  if (layer==='account') return (
    <AccountLedger
      acctCode={selAcct.code} acctName={selAcct.name}
      fromDate={fromDate} toDate={toDate}
      onBack={goBack}
    />
  )

  // ── LAYER 2: Voucher Detail ──
  if (layer==='voucher') return (
    <VoucherDetail
      je={selJE}
      onAccountClick={(code, name) => goAccount(code, name)}
      onBack={() => goBack('root')}
    />
  )

  // ── LAYER 1: Day Book ──
  const SOURCES = ['All','FI','SD','MM','HCM','PP','WM','PM']
  const shown   = entries.filter(e => {
    const ms = vType==='All' || e.refType===vType
    const mt = !search ||
      e.jeNo?.toLowerCase().includes(search.toLowerCase()) ||
      e.narration?.toLowerCase().includes(search.toLowerCase()) ||
      e.refNo?.toLowerCase().includes(search.toLowerCase())
    return ms && mt
  })

  // Group by date → by JE
  const byDate = {}
  shown.forEach(je => {
    const d = new Date(je.date).toISOString().split('T')[0]
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(je)
  })

  const totDr = shown.reduce((s,e)=>s+parseFloat(e.totalDebit||0), 0)
  const totCr = shown.reduce((s,e)=>s+parseFloat(e.totalCredit||0), 0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Day Book
          <small> {fromDate===toDate ? fmtD(fromDate) : `${fmtD(fromDate)} to ${fmtD(toDate)}`}</small>
        </div>
        <div className="fi-lv-actions">
          <input type="date" className="sd-search" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{width:150}}/>
          <span style={{color:'#6C757D',fontSize:12}}>to</span>
          <input type="date" className="sd-search" value={toDate} onChange={e=>setToDate(e.target.value)} style={{width:150}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-p sd-bsm" onClick={()=>window.open('/fi/jv/new','_self')}>New JV</button>
        </div>
      </div>

      {/* Hint */}
      <div style={{ fontSize:12, color:'#6C757D', marginBottom:10, padding:'7px 12px',
        background:'#FBF7FA', borderRadius:5, border:'1px solid #E0D5E0',
        display:'flex', alignItems:'center', gap:6 }}>
        <span>💡</span>
        <span>Click on any voucher to drill down → Debit/Credit lines → Click account → Ledger (Tally-style)</span>
      </div>

      {/* Type filter chips */}
      <div className="pp-chips">
        {SOURCES.map(s => (
          <div key={s} className={`pp-chip${vType===s?' on':''}`} onClick={()=>setVType(s)}>
            {TYPE_COLORS[s]?.label||s}
            <span>{s==='All' ? entries.length : entries.filter(e=>e.refType===s).length}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      {!loading && shown.length > 0 && (
        <div style={{ display:'flex', gap:20, padding:'8px 14px', background:'#F8F4F8',
          borderRadius:6, marginBottom:12, fontSize:12, alignItems:'center' }}>
          <span style={{color:'#6C757D'}}>{shown.length} vouchers</span>
          <span style={{marginLeft:'auto', color:'#0C5460', fontFamily:'DM Mono,monospace', fontWeight:700}}>
            Total Dr: {INR(totDr)}
          </span>
          <span style={{color:'#721C24', fontFamily:'DM Mono,monospace', fontWeight:700}}>
            Total Cr: {INR(totCr)}
          </span>
        </div>
      )}

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading day book...</div>
      ) : shown.length === 0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8,background:'#fff'}}>
          <div style={{fontSize:36,marginBottom:10}}>📒</div>
          <div style={{fontWeight:700,fontSize:15}}>No vouchers found</div>
          <div style={{fontSize:12,marginTop:4}}>Try changing the date range or post some journal entries</div>
        </div>
      ) : (
        <div>
          {Object.entries(byDate).sort().map(([date, jes]) => (
            <div key={date} style={{marginBottom:16}}>
              {/* Date header */}
              <div style={{ fontWeight:800, color:'#714B67', fontSize:12, textTransform:'uppercase',
                padding:'6px 0', borderBottom:'2px solid #EDE0EA', marginBottom:8,
                display:'flex', justifyContent:'space-between' }}>
                <span>{fmtD(date)}</span>
                <span style={{fontWeight:400,color:'#6C757D'}}>{jes.length} vouchers</span>
              </div>

              {jes.map((je, idx) => {
                const tc    = TYPE_COLORS[je.refType] || TYPE_COLORS.FI
                const lines = je.lines || []
                return (
                  <div key={je.id} style={{
                    background:'#fff', border:'1px solid #E0D5E0', borderRadius:8,
                    marginBottom:8, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.05)',
                  }}>
                    {/* Voucher header row — CLICK TO DRILL */}
                    <div
                      onClick={() => goVoucher(je)}
                      style={{ display:'flex', alignItems:'center', gap:14,
                        padding:'11px 16px', cursor:'pointer',
                        borderLeft:`4px solid ${tc.color}`,
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                      onMouseLeave={e=>e.currentTarget.style.background='#fff'}>

                      {/* Voucher No */}
                      <div style={{minWidth:130}}>
                        <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:12,color:'#714B67'}}>{je.jeNo}</div>
                        <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{je.refNo||'—'}</div>
                      </div>

                      {/* Type badge */}
                      <span style={{background:tc.bg,color:tc.color,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:700,flexShrink:0}}>
                        {tc.label}
                      </span>

                      {/* Narration */}
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:'#1C1C1C'}}>{je.narration}</div>
                        <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{lines.length} lines · Click to expand</div>
                      </div>

                      {/* Amounts */}
                      <div style={{textAlign:'right',minWidth:120}}>
                        <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:14,color:'#0C5460'}}>{INR(je.totalDebit)}</div>
                        <div style={{fontSize:10,color:'#6C757D'}}>Dr / Cr balanced</div>
                      </div>

                      <span style={{color:'#714B67',fontSize:16,fontWeight:700}}>›</span>
                    </div>

                    {/* Quick preview of lines (collapsed by default) — click row to go deeper */}
                    <div style={{borderTop:'1px solid #F0EEF0',padding:'6px 16px 6px 20px',
                      background:'#FDFBFD',display:'flex',gap:8,flexWrap:'wrap'}}>
                      {lines.slice(0,4).map((l,li)=>(
                        <span key={li}
                          onClick={e=>{e.stopPropagation(); goAccount(l.debitAcctCode||l.creditAcctCode, l.narration||je.narration)}}
                          style={{fontSize:11,fontFamily:'DM Mono,monospace',color:'#714B67',
                            cursor:'pointer',textDecoration:'underline',
                            background:'#EDE0EA',padding:'2px 6px',borderRadius:3}}>
                          {l.debitAcctCode||l.creditAcctCode}
                          <span style={{color:'#6C757D',marginLeft:3,fontFamily:'DM Sans,sans-serif',textDecoration:'none'}}>
                            {parseFloat(l.debit)>0?`Dr ${INR(l.debit)}`:`Cr ${INR(l.credit)}`}
                          </span>
                        </span>
                      ))}
                      {lines.length > 4 && (
                        <span style={{fontSize:11,color:'#6C757D'}}>+{lines.length-4} more lines</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Grand Total */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
            padding:'12px 16px', background:'#714B67', borderRadius:8,
            marginTop:8, color:'#fff', fontWeight:800 }}>
            <span style={{fontFamily:'DM Mono,monospace'}}>GRAND TOTAL — {shown.length} vouchers</span>
            <span style={{textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:15}}>Dr: {INR(totDr)}</span>
            <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:15}}>Cr: {INR(totCr)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
