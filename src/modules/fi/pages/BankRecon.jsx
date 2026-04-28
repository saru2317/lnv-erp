import React, { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { downloadTemplate } from '@utils/importExport'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const BANK_ACCOUNTS = [
  { code:'1200', name:'Bank — Primary Account (HDFC)' },
  { code:'1210', name:'Bank — OD Account (SBI)'       },
  { code:'1220', name:'Bank — Payroll Account'         },
]

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

// ── CSV Parser ─────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,'').toLowerCase())
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g,''))
    const row  = {}
    headers.forEach((h,i) => row[h] = vals[i]||'')
    // Normalize field names
    return {
      date:        row.date || row['value date'] || row['txn date'] || row['transaction date'] || '',
      description: row.description || row.narration || row.particulars || row.details || '',
      chequeNo:    row['cheque no'] || row.chequeno || row.ref || row['reference no'] || '',
      debit:       parseFloat(row.debit || row.withdrawal || row.dr || '0') || 0,
      credit:      parseFloat(row.credit || row.deposit || row.cr || '0') || 0,
      balance:     parseFloat(row.balance || row['closing balance'] || '0') || 0,
      amount:      parseFloat(row.debit||row.withdrawal||'0') || parseFloat(row.credit||row.deposit||'0') || 0,
    }
  }).filter(r => r.date && (r.debit > 0 || r.credit > 0))
}

export default function BankRecon() {
  const now   = new Date()
  const fileRef = useRef()
  const [month,    setMonth]    = useState(now.getMonth()+1)
  const [year,     setYear]     = useState(now.getFullYear())
  const [acct,     setAcct]     = useState('1200')
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [activeTab,setActiveTab]= useState('import')    // import | match | brs
  const [csvLines, setCsvLines] = useState([])          // parsed preview
  const [importing,setImporting]= useState(false)
  const [matchSel, setMatchSel] = useState({ gl:null, stmt:null }) // manual match selection

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/bank-recon?month=${month}&year=${year}&acctCode=${acct}`, { headers: hdr2() })
      const d = await r.json()
      setData(d)
    } catch { toast.error('Failed to load BRS') }
    finally { setLoading(false) }
  }, [month, year, acct])

  useEffect(() => { load() }, [load])

  // ── CSV File handler ──────────────────────────────────────
  const onFile = e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const parsed = parseCSV(ev.target.result)
      if (!parsed.length) return toast.error('Could not parse CSV — check format')
      setCsvLines(parsed)
      toast.success(`${parsed.length} transactions parsed`)
    }
    reader.readAsText(file)
  }

  const importLines = async () => {
    if (!csvLines.length) return toast.error('No lines to import')
    setImporting(true)
    try {
      const period = `${year}-${String(month).padStart(2,'0')}`
      const res = await fetch(`${BASE_URL}/fi/bank-statement/import`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ lines: csvLines, acctCode: acct, period })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setCsvLines([]); load()
    } catch (e) { toast.error(e.message) }
    finally { setImporting(false) }
  }

  const clearStatement = async () => {
    const period = `${year}-${String(month).padStart(2,'0')}`
    try {
      await fetch(`${BASE_URL}/fi/bank-statement?period=${period}&acctCode=${acct}`, { method:'DELETE', headers: hdr2() })
      toast.success('Bank statement cleared')
      load()
    } catch { toast.error('Failed') }
  }

  const manualMatch = async () => {
    if (!matchSel.stmt || !matchSel.gl) return toast.error('Select one GL and one statement line')
    try {
      const res = await fetch(`${BASE_URL}/fi/bank-statement/${matchSel.stmt}/match`, {
        method:'POST', headers: hdr(), body: JSON.stringify({ jeNo: matchSel.gl })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setMatchSel({ gl:null, stmt:null }); load()
    } catch (e) { toast.error(e.message) }
  }

  const TABS = [
    { key:'import', label:'\u2B06 Import Statement' },
    { key:'match',  label:'\u21C6 Match Transactions' },
    { key:'brs',    label:'\u2211 BRS Report' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Bank Reconciliation
          <small> Import Statement · Auto-Match · BRS Report</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={month} onChange={e=>setMonth(parseInt(e.target.value))} style={{width:80}}>
            {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="sd-search" value={year} onChange={e=>setYear(parseInt(e.target.value))} style={{width:80}}>
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <select className="sd-search" value={acct} onChange={e=>setAcct(e.target.value)} style={{width:200}}>
            {BANK_ACCOUNTS.map(a=><option key={a.code} value={a.code}>{a.name}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
        {[
          { cls:'purple', label:'GL Balance (Books)',       val: INR(data?.glBalance||0),    sub:'As per ledger' },
          { cls:'blue',   label:'Bank Statement Balance',   val: INR(data?.stmtBalance||0),  sub:'As per bank' },
          { cls: data?.isReconciled?'green':'red',
            label: data?.isReconciled ? 'Reconciled' : 'Difference',
            val: data?.isReconciled ? '\u2714 NIL' : INR(data?.difference||0),
            sub: data?.isReconciled ? 'Books match bank' : 'Needs investigation' },
          { cls:'orange', label:'Unmatched Items',
            val: (data?.unmatched_gl?.length||0) + (data?.unmatched_stmt?.length||0),
            sub: `${data?.unmatched_gl?.length||0} GL · ${data?.unmatched_stmt?.length||0} Stmt` },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'2px solid var(--odoo-border)',marginBottom:20}}>
        {TABS.map(t=>(
          <div key={t.key} onClick={()=>setActiveTab(t.key)} style={{
            padding:'9px 20px',fontSize:13,fontWeight:600,cursor:'pointer',
            color:activeTab===t.key?'var(--odoo-purple)':'var(--odoo-gray)',
            borderBottom:activeTab===t.key?'2px solid var(--odoo-purple)':'2px solid transparent',
            marginBottom:-2,transition:'all .15s'
          }}>{t.label}</div>
        ))}
      </div>

      {/* ── TAB 1: IMPORT ── */}
      {activeTab==='import' && (
        <div>
          {/* CSV format guide */}
          <div style={{background:'#EDE0EA',borderRadius:8,padding:14,marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:12,color:'#714B67',marginBottom:8}}>
              Expected CSV Format (download from your bank portal):
            </div>
            <code style={{fontSize:11,background:'#fff',borderRadius:4,padding:'6px 10px',display:'block',
              fontFamily:'DM Mono,monospace',color:'#333',lineHeight:1.7}}>
              Date,Description,Cheque No,Debit,Credit,Balance<br/>
              01-Apr-2026,Opening Balance,,,0,450000<br/>
              02-Apr-2026,NEFT to Vendor ABC,CHQ001,85000,,365000<br/>
              05-Apr-2026,Customer Receipt XYZ,,,,250000,615000
            </code>
            <div style={{fontSize:11,color:'#6C757D',marginTop:8}}>
              Column names are auto-detected. Supports HDFC / SBI / ICICI / Axis formats.
            </div>
          </div>

          <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:'none'}} onChange={onFile}/>

          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:14}}>
            <button onClick={() => downloadTemplate('bank_statement')}
              style={{padding:'8px 18px',background:'#EDE0EA',color:'#714B67',
                border:'1.5px solid #714B67',borderRadius:6,fontSize:13,
                fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
              &#11015; Download Template
            </button>
            <button className="btn btn-p sd-bsm" onClick={()=>fileRef.current.click()}>
              Choose CSV File
            </button>
            {data?.stmtLines?.length > 0 && (
              <button className="btn btn-s sd-bsm" style={{color:'#DC3545',borderColor:'#DC3545'}}
                onClick={clearStatement}>
                Clear Imported Statement
              </button>
            )}
            <span style={{fontSize:12,color:'#6C757D'}}>
              {data?.stmtLines?.length
                ? `${data.stmtLines.length} lines already imported for ${MONTHS[month]} ${year}`
                : `No statement imported for ${MONTHS[month]} ${year}`}
            </span>
          </div>

          {/* CSV Preview */}
          {csvLines.length > 0 && (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{fontWeight:700,fontSize:13,color:'#714B67'}}>
                  Preview — {csvLines.length} transactions
                </div>
                <button className="btn btn-p sd-bsm" disabled={importing} onClick={importLines}>
                  {importing ? 'Importing...' : `Import ${csvLines.length} Lines`}
                </button>
              </div>
              <div style={{maxHeight:300,overflowY:'auto',border:'1px solid #E0D5E0',borderRadius:8}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr style={{background:'#F8F4F8',position:'sticky',top:0}}>
                      <th style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#714B67'}}>Date</th>
                      <th style={{padding:'6px 10px',textAlign:'left',fontWeight:700}}>Description</th>
                      <th style={{padding:'6px 10px',textAlign:'left',fontWeight:700}}>Cheque No</th>
                      <th style={{padding:'6px 10px',textAlign:'right',fontWeight:700,color:'#DC3545'}}>Debit</th>
                      <th style={{padding:'6px 10px',textAlign:'right',fontWeight:700,color:'#155724'}}>Credit</th>
                      <th style={{padding:'6px 10px',textAlign:'right',fontWeight:700}}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvLines.map((l,i)=>(
                      <tr key={i} style={{borderTop:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                        <td style={{padding:'5px 10px',fontFamily:'DM Mono,monospace'}}>{l.date}</td>
                        <td style={{padding:'5px 10px',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.description}</td>
                        <td style={{padding:'5px 10px',fontFamily:'DM Mono,monospace',color:'#6C757D'}}>{l.chequeNo||'—'}</td>
                        <td style={{padding:'5px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#DC3545'}}>{l.debit>0?INR(l.debit):'—'}</td>
                        <td style={{padding:'5px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#155724'}}>{l.credit>0?INR(l.credit):'—'}</td>
                        <td style={{padding:'5px 10px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{l.balance>0?INR(l.balance):'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: MATCH ── */}
      {activeTab==='match' && (
        <div>
          {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading...</div> : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

              {/* GL unmatched */}
              <div>
                <div style={{fontWeight:700,color:'#714B67',fontSize:13,marginBottom:10}}>
                  GL Unmatched ({data?.unmatched_gl?.length||0})
                  <span style={{fontSize:11,fontWeight:400,color:'#6C757D',marginLeft:8}}>
                    In books but not in bank statement
                  </span>
                </div>
                <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                  {!data?.unmatched_gl?.length ? (
                    <div style={{padding:24,textAlign:'center',color:'#155724',fontWeight:600,fontSize:12}}>
                      All GL entries matched
                    </div>
                  ) : data.unmatched_gl.map((r,i)=>(
                    <div key={i} onClick={()=>setMatchSel(s=>({...s,gl:s.gl===r.jeNo?null:r.jeNo}))}
                      style={{padding:'8px 12px',borderBottom:'1px solid #F0EEEB',cursor:'pointer',
                        background:matchSel.gl===r.jeNo?'#EDE0EA':i%2===0?'#fff':'#FAFAFA',
                        transition:'background .1s'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div>
                          <span style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:700,color:'var(--odoo-purple)'}}>{r.jeNo}</span>
                          <span style={{fontSize:11,color:'#6C757D',marginLeft:8}}>{r.date?new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):''}</span>
                        </div>
                        <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,
                          color:r.amount>=0?'#155724':'#DC3545'}}>
                          {r.amount>=0?'+':''}{INR(Math.abs(r.amount))}
                        </span>
                      </div>
                      <div style={{fontSize:11,color:'#6C757D',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {r.narration}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statement unmatched */}
              <div>
                <div style={{fontWeight:700,color:'#0C5460',fontSize:13,marginBottom:10}}>
                  Statement Unmatched ({data?.unmatched_stmt?.length||0})
                  <span style={{fontSize:11,fontWeight:400,color:'#6C757D',marginLeft:8}}>
                    In bank but not in GL
                  </span>
                </div>
                <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                  {!data?.unmatched_stmt?.length ? (
                    <div style={{padding:24,textAlign:'center',color:'#155724',fontWeight:600,fontSize:12}}>
                      All statement lines matched
                    </div>
                  ) : data.unmatched_stmt.map((r,i)=>(
                    <div key={i} onClick={()=>setMatchSel(s=>({...s,stmt:s.stmt===r.id?null:r.id}))}
                      style={{padding:'8px 12px',borderBottom:'1px solid #F0EEEB',cursor:'pointer',
                        background:matchSel.stmt===r.id?'#D1ECF1':i%2===0?'#fff':'#FAFAFA',
                        transition:'background .1s'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div>
                          <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>
                            {r.txnDate?new Date(r.txnDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):''}
                          </span>
                          {r.chequeNo&&<span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'#6C757D',marginLeft:8}}>{r.chequeNo}</span>}
                        </div>
                        <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,
                          color:r.type==='credit'?'#155724':'#DC3545'}}>
                          {r.type==='credit'?'+':'-'}{INR(Math.abs(r.amount))}
                        </span>
                      </div>
                      <div style={{fontSize:11,color:'#6C757D',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {r.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Manual match button */}
          {(matchSel.gl || matchSel.stmt) && (
            <div style={{marginTop:14,padding:12,background:'#EDE0EA',borderRadius:8,
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:12,color:'#714B67'}}>
                {matchSel.gl && <span>GL: <strong>{matchSel.gl}</strong></span>}
                {matchSel.gl && matchSel.stmt && <span style={{margin:'0 8px'}}>\u2194</span>}
                {matchSel.stmt && <span>Statement line selected</span>}
              </div>
              <div style={{display:'flex',gap:8}}>
                {matchSel.gl && matchSel.stmt && (
                  <button className="btn btn-p sd-bsm" onClick={manualMatch}>Match Selected</button>
                )}
                <button className="btn btn-s sd-bsm" onClick={()=>setMatchSel({gl:null,stmt:null})}>Clear</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: BRS REPORT ── */}
      {activeTab==='brs' && (
        <div>
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:20}}>
            {/* BRS Header */}
            <div style={{textAlign:'center',marginBottom:20,borderBottom:'2px solid #714B67',paddingBottom:14}}>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'#714B67'}}>
                BANK RECONCILIATION STATEMENT
              </div>
              <div style={{fontSize:13,color:'#6C757D',marginTop:4}}>
                LNV Manufacturing Pvt. Ltd. · {MONTHS[month]} {year} · {BANK_ACCOUNTS.find(a=>a.code===acct)?.name}
              </div>
            </div>

            {/* Balance as per bank */}
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontWeight:700,borderBottom:'1px solid #E0D5E0',fontSize:14}}>
              <span>Balance as per Bank Statement</span>
              <span style={{fontFamily:'DM Mono,monospace'}}>{INR(data?.stmtBalance||0)}</span>
            </div>

            {/* Unmatched GL items */}
            {data?.unmatched_gl?.length > 0 && (
              <div style={{margin:'12px 0'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#856404',marginBottom:8}}>
                  Add: Entries in books not yet reflected in bank:
                </div>
                {data.unmatched_gl.filter(r=>r.amount>0).map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 16px',fontSize:12}}>
                    <span style={{color:'#6C757D'}}>{r.narration} ({r.jeNo})</span>
                    <span style={{fontFamily:'DM Mono,monospace',color:'#155724'}}>{INR(r.amount)}</span>
                  </div>
                ))}
                {data.unmatched_gl.filter(r=>r.amount<0).map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 16px',fontSize:12}}>
                    <span style={{color:'#6C757D'}}>{r.narration} ({r.jeNo})</span>
                    <span style={{fontFamily:'DM Mono,monospace',color:'#DC3545'}}>({INR(Math.abs(r.amount))})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Statement unmatched items */}
            {data?.unmatched_stmt?.length > 0 && (
              <div style={{margin:'12px 0'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#856404',marginBottom:8}}>
                  Less: Items in bank statement not yet entered in books:
                </div>
                {data.unmatched_stmt.map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 16px',fontSize:12}}>
                    <span style={{color:'#6C757D'}}>{r.description} {r.chequeNo?`(${r.chequeNo})`:''}</span>
                    <span style={{fontFamily:'DM Mono,monospace',color:r.type==='credit'?'#155724':'#DC3545'}}>
                      {r.type==='credit'?'':'-'}{INR(Math.abs(r.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Balance as per books */}
            <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',fontWeight:800,
              borderTop:'2px solid #714B67',fontSize:16,marginTop:12}}>
              <span style={{color:'#714B67'}}>Balance as per Books (GL)</span>
              <span style={{fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(data?.glBalance||0)}</span>
            </div>

            {/* Reconciliation status */}
            <div style={{marginTop:12,padding:14,borderRadius:8,
              background:data?.isReconciled?'#D4EDDA':'#FFF3CD',
              border:`1px solid ${data?.isReconciled?'#C3E6CB':'#FFEEBA'}`}}>
              <div style={{fontWeight:800,fontSize:14,color:data?.isReconciled?'#155724':'#856404'}}>
                {data?.isReconciled
                  ? '\u2714 RECONCILED — Books match Bank Statement'
                  : `\u26A0 NOT RECONCILED — Difference: ${INR(data?.difference||0)}`}
              </div>
              {!data?.isReconciled && (
                <div style={{fontSize:11,color:'#856404',marginTop:4}}>
                  Investigate unmatched items. Common reasons: timing difference, bank charges not booked, error in entry.
                </div>
              )}
            </div>

            {/* Auto-matched summary */}
            {data?.matched?.length > 0 && (
              <div style={{marginTop:14,padding:'8px 12px',background:'#F8F4F8',borderRadius:6,fontSize:11,color:'#6C757D'}}>
                Auto-matched: <strong style={{color:'#155724'}}>{data.matched.length} transactions</strong> matched between GL and bank statement
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
