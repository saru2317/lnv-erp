import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })
const fmtC = n  => n != null ? '₹' + Math.abs(Number(n)).toLocaleString('en-IN', { minimumFractionDigits:2 }) : '—'
const fmtD = d  => {
  if (!d) return '—'
  const dt = d instanceof Date ? d : new Date(d)
  return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })
}

// ── Amount / Date parsers (ported from bank_tally_recon_V3) ──────────────────
const parseAmt = v => {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return v === 0 ? null : Math.abs(v)
  const n = parseFloat(String(v).replace(/,/g,'').replace(/[^\d.-]/g,''))
  return isNaN(n) || n === 0 ? null : Math.abs(n)
}

const parseDate = v => {
  if (!v) return null
  if (v instanceof Date) return isNaN(v) ? null : v
  const s = String(v).trim()
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    const yr = m[3].length === 2 ? '20'+m[3] : m[3]
    const d  = new Date(`${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`)
    if (!isNaN(d)) return d
  }
  const d2 = new Date(s)
  return isNaN(d2) ? null : d2
}

const findHeaderRow = (rows, keywords) => {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const cells = rows[i].map(c => String(c||'').toLowerCase().trim())
    if (keywords.some(kw => cells.some(c => c.includes(kw)))) return i
  }
  return 0
}

const findCol = (hdrRow, keywords) => {
  for (const kw of keywords) {
    const idx = hdrRow.findIndex(c => String(c||'').toLowerCase().trim().includes(kw))
    if (idx !== -1) return idx
  }
  return -1
}

// ── Bank Statement Parser ────────────────────────────────────────────────────
const parseBankStatement = rows2d => {
  const hdrIdx  = findHeaderRow(rows2d, ['credit','debit','amount','particulars','transaction','date'])
  const hdr     = rows2d[hdrIdx].map(c => String(c||'').toLowerCase().trim())

  const colDate  = findCol(hdr, ['transaction date','value date','date'])
  const colPart  = findCol(hdr, ['particulars','narration','description','remarks','transaction details'])
  const colCr    = findCol(hdr, ['credit amount','credit amt','credit(inr)','credit','deposit','deposits'])
  const colDr    = findCol(hdr, ['debit amount','debit amt','debit(inr)','debit','withdrawal','withdrawals'])
  const colBal   = findCol(hdr, ['balance','running balance','closing balance'])
  const colRef   = findCol(hdr, ['ref no','reference','chq no','cheque','utr','txn id'])

  const result = []
  for (let i = hdrIdx + 1; i < rows2d.length; i++) {
    const row = rows2d[i]
    if (!row || row.every(c => c === '' || c == null)) continue
    const crAmt = colCr !== -1 ? parseAmt(row[colCr]) : null
    const drAmt = colDr !== -1 ? parseAmt(row[colDr]) : null
    if (!crAmt && !drAmt) continue

    result.push({
      _idx:     i,
      dateRaw:  colDate !== -1 ? fmtD(row[colDate]) : '',
      date:     colDate !== -1 ? parseDate(row[colDate]) : null,
      narration:colPart !== -1 ? String(row[colPart]||'').trim() : '',
      credit:   crAmt || 0,
      debit:    drAmt || 0,
      amount:   crAmt || drAmt || 0,
      type:     crAmt ? 'CR' : 'DR',
      ref:      colRef !== -1 ? String(row[colRef]||'').trim() : '',
      balance:  colBal !== -1 ? parseAmt(row[colBal]) : null,
      _used:    false,
    })
  }
  return result
}

// ── Smart Matching Algorithm ──────────────────────────────────────────────────
const AMT_TOL   = 1      // ₹1 tolerance
const DATE_DAYS = 5      // 5-day window

const runMatch = (bankEntries, bookEntries) => {
  const bank  = bankEntries.map(b => ({ ...b, _used:false }))
  const book  = bookEntries.map(b => ({ ...b, _used:false }))
  const matched   = []
  const bankOnly  = []
  const bookOnly  = []

  // Build amount buckets from bank
  const buckets = {}
  bank.forEach(b => {
    const key = b.amount.toFixed(2)
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(b)
  })

  Object.entries(buckets).forEach(([amtKey, bankGrp]) => {
    const amt      = parseFloat(amtKey)
    const bookGrp  = book.filter(t => !t._used && Math.abs(t.amount - amt) <= AMT_TOL)

    if (!bookGrp.length) return

    if (bankGrp.length === 1 && bookGrp.length === 1) {
      // Simple 1-to-1
      bankGrp[0]._used = true
      bookGrp[0]._used = true
      matched.push({ bank: bankGrp[0], book: bookGrp[0],
        dayDiff: bankGrp[0].date && bookGrp[0].date
          ? Math.abs((bankGrp[0].date - new Date(bookGrp[0].date)) / 86400000)
          : null })
      return
    }

    // Many-to-many — score by date proximity
    const bList = bankGrp.filter(b => !b._used)
    const tList = [...bookGrp]

    const pairs = []
    bList.forEach((b, bi) => {
      tList.forEach((t, ti) => {
        const bDate = b.date
        const tDate = t.date ? new Date(t.date) : null
        const days  = bDate && tDate ? Math.abs((bDate - tDate) / 86400000) : 9999
        pairs.push({ bi, ti, days })
      })
    })
    pairs.sort((a, b) => a.days - b.days)

    const usedBi = new Set(), usedTi = new Set()
    pairs.forEach(p => {
      if (usedBi.has(p.bi) || usedTi.has(p.ti)) return
      if (p.days <= DATE_DAYS || p.days === 9999) {
        usedBi.add(p.bi); usedTi.add(p.ti)
        bList[p.bi]._used = true
        tList[p.ti]._used = true
        matched.push({ bank: bList[p.bi], book: tList[p.ti], dayDiff: p.days === 9999 ? null : p.days })
      }
    })
  })

  bank.filter(b => !b._used).forEach(b => bankOnly.push(b))
  book.filter(t => !t._used).forEach(t => bookOnly.push(t))

  return { matched, bankOnly, bookOnly }
}

// ════════════════════════════════════════════════════════════════════════════
export default function BankRecon() {
  const nav     = useNavigate()
  const fileRef = useRef()

  const today  = new Date().toISOString().split('T')[0]
  const first  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [bankAccounts, setBankAccounts] = useState([])
  const [selAcct,      setSelAcct]      = useState('')
  const [dateFrom,     setDateFrom]     = useState(first)
  const [dateTo,       setDateTo]       = useState(today)

  const [bookEntries,  setBookEntries]  = useState([])
  const [bankEntries,  setBankEntries]  = useState([])
  const [bankFileName, setBankFileName] = useState('')
  const [result,       setResult]       = useState(null)
  const [tab,          setTab]          = useState('matched')
  const [loading,      setLoading]      = useState(false)
  const [search,       setSearch]       = useState('')

  // Load bank accounts from COA
  useEffect(() => {
    fetch(`${BASE}/fi/coa`, { headers: hdr2() })
      .then(r => r.json())
      .then(d => {
        const banks = (d.data || []).filter(a =>
          a.subType === 'Bank' || a.subType === 'Cash' || a.code?.startsWith('12')
        )
        setBankAccounts(banks)
        if (banks.length) setSelAcct(banks[0].code)
      })
      .catch(() => {})
  }, [])

  // Load book entries from GL
  const loadBookEntries = useCallback(async () => {
    if (!selAcct) return toast.error('Select a bank account!')
    setLoading(true)
    setResult(null)
    try {
      const res  = await fetch(
        `${BASE}/fi/gl/${selAcct}?from=${dateFrom}&to=${dateTo}`,
        { headers: hdr2() }
      )
      const data = await res.json()
      const rows = data.data?.rows || []
      // Map GL rows to recon format
      const entries = rows.map((r, i) => ({
        _idx:     i,
        date:     r.date,
        dateRaw:  fmtD(r.date),
        narration:r.narration || '',
        jeNo:     r.jeNo      || '',
        refType:  r.refType   || '',
        refNo:    r.refNo     || '',
        debit:    parseFloat(r.debit  || 0),
        credit:   parseFloat(r.credit || 0),
        amount:   parseFloat(r.debit  || 0) || parseFloat(r.credit || 0),
        type:     parseFloat(r.debit||0) > 0 ? 'DR' : 'CR',
        _used:    false,
      })).filter(e => e.amount > 0)
      setBookEntries(entries)
      toast.success(`${entries.length} book entries loaded from LNV ERP`)
    } catch(e) {
      toast.error('Failed to load GL: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [selAcct, dateFrom, dateTo])

  // Upload & parse bank statement
  const handleBankUpload = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setBankFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const wb   = XLSX.read(ev.target.result, { type:'binary', cellDates:true })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:false })
        const parsed = parseBankStatement(rows)
        setBankEntries(parsed)
        setResult(null)
        toast.success(`${parsed.length} transactions loaded from ${file.name}`)
      } catch(e) {
        toast.error('Failed to parse bank file: ' + e.message)
      }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  // Run reconciliation
  const runRecon = () => {
    if (!bankEntries.length) return toast.error('Upload bank statement first!')
    if (!bookEntries.length)  return toast.error('Load book entries first!')
    const res = runMatch(bankEntries, bookEntries)
    setResult(res)
    setTab('matched')
    toast.success(`✅ ${res.matched.length} matched · ${res.bankOnly.length} bank-only · ${res.bookOnly.length} book-only`)
  }

  // Export to Excel
  const exportExcel = () => {
    if (!result) return
    const wb = XLSX.utils.book_new()

    // Sheet 1: Matched
    const matchedRows = [
      ['Bank Date','Bank Narration','Bank Type','Bank Amount',
       'Book Date','Book JE No.','Book Narration','Book Amount','Day Diff','Status'],
      ...result.matched.map(r => [
        r.bank.dateRaw, r.bank.narration, r.bank.type, r.bank.amount,
        fmtD(r.book.date), r.book.jeNo, r.book.narration, r.book.amount,
        r.dayDiff != null ? r.dayDiff : '—', 'MATCHED'
      ])
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matchedRows), 'Matched')

    // Sheet 2: Bank Unmatched
    const bankOnlyRows = [
      ['Bank Date','Narration','Type','Amount','Reference','Status'],
      ...result.bankOnly.map(r => [r.dateRaw, r.narration, r.type, r.amount, r.ref, 'BANK ONLY'])
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bankOnlyRows), 'Bank Unmatched')

    // Sheet 3: Book Unmatched
    const bookOnlyRows = [
      ['Book Date','JE No.','Narration','Ref Type','Ref No.','Amount','Status'],
      ...result.bookOnly.map(r => [fmtD(r.date), r.jeNo, r.narration, r.refType, r.refNo, r.amount, 'BOOK ONLY'])
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bookOnlyRows), 'Book Unmatched')

    XLSX.writeFile(wb, `BankRecon_${selAcct}_${dateFrom}_to_${dateTo}.xlsx`)
    toast.success('Exported to Excel!')
  }

  const bankAmt   = bankEntries.reduce((s,b) => s + b.amount, 0)
  const bookAmt   = bookEntries.reduce((s,b) => s + b.amount, 0)
  const matchedAmt= result?.matched.reduce((s,m) => s + m.bank.amount, 0) || 0
  const bankGap   = bankAmt - matchedAmt
  const bookGap   = bookAmt - (result?.matched.reduce((s,m) => s + m.book.amount, 0) || 0)

  const filterRows = (rows, key='narration') =>
    !search ? rows : rows.filter(r =>
      String(r[key]||r.bank?.[key]||'').toLowerCase().includes(search.toLowerCase()) ||
      String(r.book?.[key]||'').toLowerCase().includes(search.toLowerCase())
    )

  const TABS = [
    { key:'matched', label:'✅ Matched',       count: result?.matched.length  || 0, color:'#155724', bg:'#D4EDDA' },
    { key:'bankonly',label:'🏦 Bank Only',      count: result?.bankOnly.length || 0, color:'#721C24', bg:'#F8D7DA' },
    { key:'bookonly',label:'📒 Book Only',      count: result?.bookOnly.length || 0, color:'#856404', bg:'#FFF3CD' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Bank Reconciliation
          <small>BRS · Bank Statement vs LNV ERP Books</small>
        </div>
        <div className="fi-lv-actions">
          {result && (
            <button className="btn btn-s sd-bsm" onClick={exportExcel}>
              ⬇️ Export Excel
            </button>
          )}
          {bankEntries.length > 0 && bookEntries.length > 0 && (
            <button className="btn btn-p sd-bsm" onClick={runRecon}>
              🔄 Run Reconciliation
            </button>
          )}
        </div>
      </div>

      {/* Setup Panel */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">⚙️ Reconciliation Setup</div>
        <div className="fi-form-sec-body">
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:12, alignItems:'end' }}>
            {/* Bank Account */}
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                Bank Account (LNV ERP)
              </label>
              <select
                style={{ padding:'8px 10px', border:'1.5px solid #E0D5E0',
                  borderRadius:5, fontSize:12, width:'100%', outline:'none' }}
                value={selAcct}
                onChange={e => setSelAcct(e.target.value)}>
                <option value="">-- Select Bank --</option>
                {bankAccounts.map(a => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                From Date
              </label>
              <input type="date"
                style={{ padding:'8px 10px', border:'1.5px solid #E0D5E0',
                  borderRadius:5, fontSize:12, width:'100%', outline:'none' }}
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)} />
            </div>

            {/* Date To */}
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                To Date
              </label>
              <input type="date"
                style={{ padding:'8px 10px', border:'1.5px solid #E0D5E0',
                  borderRadius:5, fontSize:12, width:'100%', outline:'none' }}
                value={dateTo}
                onChange={e => setDateTo(e.target.value)} />
            </div>

            {/* Load Button */}
            <button className="btn btn-p sd-bsm"
              disabled={loading || !selAcct}
              onClick={loadBookEntries}>
              {loading ? '⏳' : '📒 Load Book'}
            </button>
          </div>

          {/* Bank Statement Upload */}
          <div style={{ marginTop:14, padding:'12px 16px',
            background:'#F8F9FA', borderRadius:6,
            border:'2px dashed #E0D5E0',
            display:'flex', alignItems:'center', gap:16,
            flexWrap:'wrap' }}>
            <div style={{ fontSize:28 }}>🏦</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:12, color:'#1A1A2E', marginBottom:2 }}>
                Upload Bank Statement (Excel)
              </div>
              <div style={{ fontSize:11, color:'#6C757D' }}>
                Supports: .xlsx · .xls · .csv from any bank
                (HDFC, SBI, ICICI, Axis, BoB, etc.)
                <br/>
                Auto-detects: Date, Narration, Credit/Debit columns
              </div>
            </div>
            <label style={{
              padding:'8px 16px', borderRadius:5, fontSize:12,
              fontWeight:700, cursor:'pointer',
              background:'#D1ECF1', color:'#0C5460',
              border:'1.5px solid #BEE5EB',
              display:'inline-flex', alignItems:'center', gap:8 }}>
              ⬆️ Upload Bank Statement
              <input ref={fileRef} type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display:'none' }}
                onChange={handleBankUpload} />
            </label>
            {bankFileName && (
              <div style={{ fontSize:11, color:'#155724',
                background:'#D4EDDA', padding:'4px 10px',
                borderRadius:10, fontFamily:'DM Mono,monospace' }}>
                ✅ {bankFileName} · {bankEntries.length} txns
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:14 }}>
        {[
          ['Bank Transactions',   bankEntries.length,             '#0C5460','#D1ECF1'],
          ['Book Entries',        bookEntries.length,             '#714B67','#EDE0EA'],
          ['Matched',             result?.matched.length  || '—', '#155724','#D4EDDA'],
          ['Bank Unmatched',      result?.bankOnly.length || '—', '#721C24','#F8D7DA'],
          ['Book Unmatched',      result?.bookOnly.length || '—', '#856404','#FFF3CD'],
        ].map(([l,v,c,bg]) => (
          <div key={l} style={{ background:bg, borderRadius:8,
            padding:'10px 14px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800,
              color:c, fontFamily:'DM Mono,monospace' }}>{v}</div>
            <div style={{ fontSize:10, fontWeight:700,
              color:c, opacity:.8, textTransform:'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Amount Summary */}
      {result && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
          {[
            ['Bank Total',   bankAmt,    '#0C5460','#D1ECF1'],
            ['Book Total',   bookAmt,    '#714B67','#EDE0EA'],
            ['Difference',   Math.abs(bankAmt - bookAmt), Math.abs(bankAmt-bookAmt) < 1 ? '#155724' : '#DC3545',
              Math.abs(bankAmt-bookAmt) < 1 ? '#D4EDDA' : '#F8D7DA'],
          ].map(([l,v,c,bg]) => (
            <div key={l} style={{ background:bg, borderRadius:8,
              padding:'10px 16px', textAlign:'center',
              border:`1px solid ${c}30` }}>
              <div style={{ fontSize:20, fontWeight:800,
                color:c, fontFamily:'DM Mono,monospace' }}>
                {fmtC(v)}
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:c }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Run button (if ready but not run) */}
      {!result && bankEntries.length > 0 && bookEntries.length > 0 && (
        <div style={{ textAlign:'center', padding:'20px',
          background:'#EBF5FB', borderRadius:8, marginBottom:14,
          border:'1px solid #AED6F1' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#1A5276', marginBottom:10 }}>
            ✅ Bank ({bankEntries.length} txns) + Book ({bookEntries.length} entries) ready!
          </div>
          <button className="btn btn-p sd-bsm"
            onClick={runRecon}
            style={{ fontSize:14, padding:'10px 24px' }}>
            🔄 Run Smart Reconciliation
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Search */}
          <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
            <input
              placeholder="Search narration, JE No., amount..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding:'7px 12px', border:'1.5px solid #E0D5E0',
                borderRadius:5, fontSize:12, outline:'none', width:280 }} />
            <span style={{ fontSize:11, color:'#6C757D' }}>
              Matching: amount ±₹{AMT_TOL} · date ±{DATE_DAYS} days
            </span>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:6, marginBottom:0 }}>
            {TABS.map(t => (
              <button key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding:'8px 16px', borderRadius:'6px 6px 0 0',
                  fontSize:12, fontWeight:700, cursor:'pointer',
                  background: tab === t.key ? t.bg : '#F8F4F8',
                  color:      tab === t.key ? t.color : '#6C757D',
                  border:    `1.5px solid ${tab === t.key ? t.color+'40' : '#E0D5E0'}`,
                  borderBottom: tab === t.key ? `2px solid ${t.color}` : '1px solid #E0D5E0',
                }}>
                {t.label} <span style={{ fontFamily:'DM Mono,monospace' }}>({t.count})</span>
              </button>
            ))}
          </div>

          <div style={{ border:'1.5px solid #E0D5E0', borderRadius:'0 6px 6px 6px',
            overflow:'hidden', marginBottom:20 }}>

            {/* ── MATCHED ── */}
            {tab === 'matched' && (
              <table className="fi-data-table">
                <thead>
                  <tr style={{ background:'#D4EDDA' }}>
                    <th>#</th>
                    <th>Bank Date</th>
                    <th>Bank Narration</th>
                    <th style={{ textAlign:'right' }}>Bank Amt</th>
                    <th>Book Date</th>
                    <th>JE No.</th>
                    <th>Book Narration</th>
                    <th style={{ textAlign:'right' }}>Book Amt</th>
                    <th style={{ textAlign:'center' }}>Day Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {filterRows(result.matched).length === 0 ? (
                    <tr><td colSpan={9} style={{ padding:20, textAlign:'center', color:'#6C757D' }}>
                      No matched entries
                    </td></tr>
                  ) : filterRows(result.matched).map((m, i) => (
                    <tr key={i} style={{ background: i%2===0 ? '#F0FFF8' : '#EAFAF1' }}>
                      <td style={{ fontWeight:700, color:'#6C757D', fontSize:11 }}>{i+1}</td>
                      <td style={{ fontSize:11, color:'#6C757D' }}>{m.bank.dateRaw}</td>
                      <td style={{ fontSize:12, maxWidth:200 }}>{m.bank.narration}</td>
                      <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                        fontWeight:700, color:'#155724' }}>{fmtC(m.bank.amount)}</td>
                      <td style={{ fontSize:11, color:'#6C757D' }}>{fmtD(m.book.date)}</td>
                      <td style={{ fontSize:11, fontFamily:'DM Mono,monospace',
                        color:'#714B67' }}>{m.book.jeNo}</td>
                      <td style={{ fontSize:12, maxWidth:200 }}>{m.book.narration}</td>
                      <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                        fontWeight:700, color:'#155724' }}>{fmtC(m.book.amount)}</td>
                      <td style={{ textAlign:'center' }}>
                        {m.dayDiff != null ? (
                          <span style={{
                            padding:'1px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                            background: m.dayDiff === 0 ? '#D4EDDA' : m.dayDiff <= 2 ? '#FFF3CD' : '#F8D7DA',
                            color:      m.dayDiff === 0 ? '#155724' : m.dayDiff <= 2 ? '#856404' : '#721C24',
                          }}>{m.dayDiff}d</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── BANK ONLY ── */}
            {tab === 'bankonly' && (
              <table className="fi-data-table">
                <thead>
                  <tr style={{ background:'#F8D7DA' }}>
                    <th>#</th>
                    <th>Date</th>
                    <th>Narration</th>
                    <th>Type</th>
                    <th style={{ textAlign:'right' }}>Amount</th>
                    <th>Reference</th>
                    <th>Possible Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filterRows(result.bankOnly, 'narration').length === 0 ? (
                    <tr><td colSpan={7} style={{ padding:20, textAlign:'center', color:'#155724' }}>
                      🎉 No unmatched bank entries!
                    </td></tr>
                  ) : filterRows(result.bankOnly, 'narration').map((b, i) => (
                    <tr key={i} style={{ background: i%2===0 ? '#FFF5F5' : '#FFF' }}>
                      <td style={{ fontWeight:700, color:'#6C757D', fontSize:11 }}>{i+1}</td>
                      <td style={{ fontSize:11, color:'#6C757D' }}>{b.dateRaw}</td>
                      <td style={{ fontSize:12 }}>{b.narration}</td>
                      <td>
                        <span style={{ padding:'1px 8px', borderRadius:10, fontSize:10,
                          fontWeight:700,
                          background: b.type==='CR' ? '#D4EDDA' : '#F8D7DA',
                          color:      b.type==='CR' ? '#155724' : '#721C24' }}>
                          {b.type}
                        </span>
                      </td>
                      <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                        fontWeight:700, color:'#DC3545' }}>{fmtC(b.amount)}</td>
                      <td style={{ fontSize:11, color:'#6C757D' }}>{b.ref || '—'}</td>
                      <td style={{ fontSize:11, color:'#856404' }}>
                        → Create JE in LNV ERP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── BOOK ONLY ── */}
            {tab === 'bookonly' && (
              <table className="fi-data-table">
                <thead>
                  <tr style={{ background:'#FFF3CD' }}>
                    <th>#</th>
                    <th>Book Date</th>
                    <th>JE No.</th>
                    <th>Narration</th>
                    <th>Ref Type</th>
                    <th>Ref No.</th>
                    <th style={{ textAlign:'right' }}>Amount</th>
                    <th>Possible Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filterRows(result.bookOnly, 'narration').length === 0 ? (
                    <tr><td colSpan={8} style={{ padding:20, textAlign:'center', color:'#155724' }}>
                      🎉 No unmatched book entries!
                    </td></tr>
                  ) : filterRows(result.bookOnly, 'narration').map((b, i) => (
                    <tr key={i} style={{ background: i%2===0 ? '#FFFBF0' : '#FFF' }}>
                      <td style={{ fontWeight:700, color:'#6C757D', fontSize:11 }}>{i+1}</td>
                      <td style={{ fontSize:11, color:'#6C757D' }}>{fmtD(b.date)}</td>
                      <td style={{ fontFamily:'DM Mono,monospace', fontSize:11,
                        color:'#714B67' }}>{b.jeNo}</td>
                      <td style={{ fontSize:12 }}>{b.narration}</td>
                      <td>
                        <span style={{ padding:'1px 6px', borderRadius:8, fontSize:10,
                          background:'#EDE0EA', color:'#714B67', fontWeight:700 }}>
                          {b.refType || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize:11, color:'#6C757D' }}>{b.refNo || '—'}</td>
                      <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                        fontWeight:700, color:'#856404' }}>{fmtC(b.amount)}</td>
                      <td style={{ fontSize:11, color:'#856404' }}>
                        → Verify with bank / timing diff
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && !(bankEntries.length && bookEntries.length) && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#6C757D' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔄</div>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>
            Bank Reconciliation
          </div>
          <div style={{ fontSize:12, maxWidth:420, margin:'0 auto', lineHeight:1.8 }}>
            <strong>Step 1:</strong> Select bank account + date range → <strong>Load Book</strong>
            <br/>
            <strong>Step 2:</strong> Upload Bank Statement (Excel from your bank)
            <br/>
            <strong>Step 3:</strong> Click <strong>Run Reconciliation</strong>
            <br/><br/>
            Smart matching: amount ±₹1 · date ±5 days · many-to-many support
          </div>
        </div>
      )}
    </div>
  )
}
