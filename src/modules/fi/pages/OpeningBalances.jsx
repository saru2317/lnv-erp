import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n  => n ? '₹' + Math.abs(Number(n)).toLocaleString('en-IN', { minimumFractionDigits:2 }) : '—'

// Tally-style group order for display
const TYPE_ORDER = ['ASSET','LIABILITY','EQUITY','INCOME','EXPENSE']
const TYPE_LABEL = {
  ASSET:    '🏦 Assets',
  LIABILITY:'📋 Liabilities',
  EQUITY:   '💼 Capital & Equity',
  INCOME:   '📈 Income',
  EXPENSE:  '📉 Expenses',
}
const TYPE_SIDE = {
  ASSET:    'debit',
  EXPENSE:  'debit',
  LIABILITY:'credit',
  EQUITY:   'credit',
  INCOME:   'credit',
}

export default function OpeningBalances() {
  const nav  = useNavigate()
  const year = new Date().getFullYear()

  const [coa,      setCOA]      = useState([])
  const [balances, setBalances] = useState({}) // code → { debit, credit }
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [filter,   setFilter]   = useState('ALL')
  const [search,   setSearch]   = useState('')
  const [uploading,setUploading]= useState(false)
  const fileRef                 = useRef()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [coaRes, obRes] = await Promise.all([
        fetch(`${BASE}/fi/coa`,                           { headers: hdr2() }).then(r=>r.json()),
        fetch(`${BASE}/fi/opening-balances?year=${year}`, { headers: hdr2() }).then(r=>r.json()).catch(()=>({ data:[] }))
      ])

      const accounts = coaRes.data || []
      setCOA(accounts)

      // Load existing opening balances
      const bals = {}
      ;(obRes.data || []).forEach(b => {
        bals[b.code] = {
          debit:  b.debit  > 0 ? String(b.debit)  : '',
          credit: b.credit > 0 ? String(b.credit) : '',
        }
      })
      setBalances(bals)
    } catch(e) {
      toast.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { load() }, [load])

  const setBalance = (code, side, value) => {
    setBalances(prev => ({
      ...prev,
      [code]: { ...(prev[code] || {}), [side]: value }
    }))
  }

  // Totals
  const totalDr = Object.values(balances).reduce((s,b) => s + parseFloat(b.debit  || 0), 0)
  const totalCr = Object.values(balances).reduce((s,b) => s + parseFloat(b.credit || 0), 0)
  const diff    = totalDr - totalCr
  const balanced = Math.abs(diff) <= 1

  // ── Download Excel Template ──────────────────────────────────
  const downloadTemplate = () => {
    const rows = [
      // Header row
      ['Code', 'Account Name', 'Type', 'Sub Type', 'Dr Opening Balance', 'Cr Opening Balance', 'Notes'],
      // Instruction row
      ['', '← Fill Dr or Cr (not both)', '', '', 'Assets / Expenses', 'Liabilities / Income / Equity', 'Optional'],
      // Blank separator
      [],
    ]

    // Add all accounts grouped by type
    TYPE_ORDER.forEach(type => {
      // Group header
      rows.push([`--- ${TYPE_LABEL[type]} ---`, '', '', '', '', '', ''])
      coa
        .filter(a => a.type === type)
        .forEach(a => {
          const bal  = balances[a.code] || {}
          rows.push([
            a.code,
            (a.parentCode ? '  ' : '') + a.name,  // indent child accounts
            a.type,
            a.subType || '',
            parseFloat(bal.debit  || '') || '',
            parseFloat(bal.credit || '') || '',
            a.parentCode ? '' : 'GROUP',
          ])
        })
      rows.push([]) // blank row between groups
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)

    // Column widths
    ws['!cols'] = [
      { wch:10 }, { wch:45 }, { wch:12 },
      { wch:20 }, { wch:22 }, { wch:22 }, { wch:12 }
    ]

    // Style header row (bold)
    const range = XLSX.utils.decode_range(ws['!ref'])
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r:0, c:C })]
      if (cell) cell.s = { font:{ bold:true } }
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Opening Balances')
    XLSX.writeFile(wb, `LNV_Opening_Balances_FY${year}-${year+1}.xlsx`)
    toast.success('Template downloaded!')
  }

  // ── Upload & Parse Excel ──────────────────────────────────────
  const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb    = XLSX.read(ev.target.result, { type:'binary' })
        const ws    = wb.Sheets[wb.SheetNames[0]]
        const rows  = XLSX.utils.sheet_to_json(ws, { header:1 })

        let imported = 0
        const newBalances = { ...balances }

        rows.forEach(row => {
          const code  = String(row[0] || '').trim()
          const drVal = parseFloat(row[4] || 0)
          const crVal = parseFloat(row[5] || 0)

          // Skip headers, blanks, group rows
          if (!code || code.startsWith('---') || code === 'Code') return

          // Match against COA
          const account = coa.find(a => a.code === code)
          if (!account) return

          if (drVal > 0 || crVal > 0) {
            newBalances[code] = {
              debit:  drVal > 0 ? String(drVal) : '',
              credit: crVal > 0 ? String(crVal) : '',
            }
            imported++
          }
        })

        setBalances(newBalances)
        toast.success(`✅ ${imported} account balance(s) imported from Excel!`)
      } catch(e) {
        toast.error('Failed to parse Excel: ' + e.message)
      } finally {
        setUploading(false)
        e.target.value = '' // reset file input
      }
    }
    reader.readAsBinaryString(file)
  }

  const save = async () => {
    if (!balanced) return toast.error(`Unbalanced by ₹${Math.abs(diff).toFixed(2)} — Dr and Cr must match!`)

    const entries = coa
      .map(a => ({
        code:   a.code,
        name:   a.name,
        debit:  parseFloat(balances[a.code]?.debit  || 0),
        credit: parseFloat(balances[a.code]?.credit || 0),
      }))
      .filter(e => e.debit > 0 || e.credit > 0)

    if (!entries.length) return toast.error('Enter at least one balance!')

    setSaving(true)
    try {
      const res  = await fetch(`${BASE}/fi/opening-balances`, {
        method: 'POST', headers: hdr(),
        body: JSON.stringify({ year, entries })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // Group accounts by type
  const grouped = TYPE_ORDER.reduce((acc, type) => {
    acc[type] = coa.filter(a =>
      a.type === type &&
      (filter === 'ALL' || a.type === filter) &&
      (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search)) &&
      !a.parentCode // show only parent/group accounts for cleaner entry
    )
    return acc
  }, {})

  // Show only accounts with parent for detailed entry
  const allLeafAccounts = coa.filter(a => a.parentCode) // leaf accounts (has parent)

  const displayAccounts = (type) => coa.filter(a =>
    a.type === type &&
    (filter === 'ALL' || a.type === filter) &&
    (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search))
  )

  return (
    <div>
      {/* Tally-style header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Opening Balances
          <small>F11 · FY {year}-{year+1} · {coa.length} accounts</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm"
            onClick={() => nav('/fi/trial-balance')}>
            Trial Balance
          </button>

          {/* Download Template */}
          <button className="btn btn-s sd-bsm"
            disabled={!coa.length}
            onClick={downloadTemplate}
            title="Download Excel template with all ledger accounts">
            ⬇️ Download Template
          </button>

          {/* Upload Excel */}
          <label style={{
            padding:'6px 14px', borderRadius:5, fontSize:12,
            fontWeight:700, cursor:'pointer',
            background: uploading ? '#E9ECEF' : '#D1ECF1',
            color:'#0C5460', border:'1.5px solid #BEE5EB',
            display:'inline-flex', alignItems:'center', gap:6,
          }}>
            {uploading ? '⏳ Reading...' : '⬆️ Upload Excel'}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display:'none' }}
              onChange={handleUpload}
            />
          </label>

          <button className="btn btn-p sd-bsm"
            disabled={saving || !balanced}
            onClick={save}>
            {saving ? '⏳ Saving...' : '💾 Save Opening Balances'}
          </button>
        </div>
      </div>

      {/* Balance indicator — Tally-style */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
        gap:10, marginBottom:14
      }}>
        <div style={{ background:'#D4EDDA', borderRadius:8,
          padding:'10px 16px', textAlign:'center' }}>
          <div style={{ fontSize:20, fontWeight:800,
            color:'#155724', fontFamily:'DM Mono,monospace' }}>
            {fmtC(totalDr)}
          </div>
          <div style={{ fontSize:10, fontWeight:700,
            color:'#155724', textTransform:'uppercase' }}>
            Total Debit (Dr)
          </div>
        </div>
        <div style={{ background: balanced ? '#D4EDDA' : '#F8D7DA',
          borderRadius:8, padding:'10px 16px', textAlign:'center',
          border: balanced ? '2px solid #C3E6CB' : '2px solid #F5C6CB' }}>
          <div style={{ fontSize:20, fontWeight:800,
            color: balanced ? '#155724' : '#DC3545',
            fontFamily:'DM Mono,monospace' }}>
            {balanced ? '✅ BALANCED' : `⚠️ ₹${Math.abs(diff).toFixed(2)} DIFF`}
          </div>
          <div style={{ fontSize:10, fontWeight:700,
            color: balanced ? '#155724' : '#DC3545',
            textTransform:'uppercase' }}>
            {balanced ? 'Dr = Cr — Ready to save' : diff > 0 ? 'Dr exceeds Cr' : 'Cr exceeds Dr'}
          </div>
        </div>
        <div style={{ background:'#F8D7DA', borderRadius:8,
          padding:'10px 16px', textAlign:'center' }}>
          <div style={{ fontSize:20, fontWeight:800,
            color:'#721C24', fontFamily:'DM Mono,monospace' }}>
            {fmtC(totalCr)}
          </div>
          <div style={{ fontSize:10, fontWeight:700,
            color:'#721C24', textTransform:'uppercase' }}>
            Total Credit (Cr)
          </div>
        </div>
      </div>

      {/* Excel Upload/Download Info Banner */}
      <div style={{ background:'#EBF5FB', border:'1px solid #AED6F1',
        borderRadius:6, padding:'10px 16px', marginBottom:14,
        fontSize:12, color:'#1A5276',
        display:'flex', alignItems:'center', gap:12,
        flexWrap:'wrap' }}>
        <span style={{ fontSize:20 }}>📊</span>
        <div>
          <strong>Excel Import/Export:</strong>
          &nbsp;Click <strong>⬇️ Download Template</strong> to get an Excel file with all {coa.length} ledger accounts
          → Fill Dr/Cr balances in Excel → Click <strong>⬆️ Upload Excel</strong> to load them back.
          <br/>
          <span style={{ fontSize:11, color:'#6C757D' }}>
            Supported: .xlsx · .xls · .csv &nbsp;|&nbsp;
            Column E = Dr (Assets, Expenses) &nbsp;|&nbsp;
            Column F = Cr (Liabilities, Income, Capital)
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:12,
        alignItems:'center', flexWrap:'wrap' }}>
        <input style={{ padding:'6px 12px', border:'1.5px solid #E0D5E0',
          borderRadius:5, fontSize:12, outline:'none', width:220 }}
          placeholder="Search account..."
          value={search}
          onChange={e => setSearch(e.target.value)} />
        {['ALL', ...TYPE_ORDER].map(t => (
          <button key={t}
            onClick={() => setFilter(t)}
            style={{
              padding:'5px 12px', borderRadius:14, fontSize:11,
              fontWeight:700, cursor:'pointer',
              background: filter === t ? '#714B67' : '#F8F4F8',
              color:      filter === t ? '#fff'    : '#714B67',
              border:    `1.5px solid ${filter === t ? '#714B67' : '#E0D5E0'}`,
            }}>
            {t === 'ALL' ? 'All' : TYPE_LABEL[t] || t}
          </button>
        ))}
        <button style={{ padding:'5px 12px', borderRadius:14,
          fontSize:11, fontWeight:700, cursor:'pointer',
          background:'#FFF3CD', color:'#856404',
          border:'1.5px solid #FFE69C', marginLeft:'auto' }}
          onClick={() => {
            // Quick fill — populate default sides based on account type
            const defaults = {}
            coa.forEach(a => {
              const existing = balances[a.code]
              if (!existing?.debit && !existing?.credit) return
              defaults[a.code] = existing
            })
          }}>
          Clear Empty
        </button>
      </div>

      {/* Account Table — Tally-style */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          Loading accounts...
        </div>
      ) : (
        TYPE_ORDER.filter(t => filter === 'ALL' || t === filter).map(type => {
          const accounts = displayAccounts(type)
          if (!accounts.length) return null
          return (
            <div key={type} style={{ marginBottom:20 }}>
              {/* Group Header */}
              <div style={{
                background:'#714B67', color:'#fff',
                padding:'8px 14px', borderRadius:'6px 6px 0 0',
                fontSize:12, fontWeight:700,
                display:'flex', justifyContent:'space-between'
              }}>
                <span>{TYPE_LABEL[type]}</span>
                <span style={{ opacity:.8, fontSize:10 }}>
                  {TYPE_SIDE[type] === 'debit' ? 'Normal: Dr balance' : 'Normal: Cr balance'}
                </span>
              </div>

              {/* Account rows */}
              <div style={{ border:'1.5px solid #E0D5E0',
                borderTop:'none', borderRadius:'0 0 6px 6px',
                overflow:'hidden' }}>
                {/* Table header */}
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'80px 1fr 180px 180px',
                  background:'#F8F4F8', padding:'6px 12px',
                  fontSize:10, fontWeight:700,
                  color:'#6C757D', textTransform:'uppercase',
                  borderBottom:'1px solid #E0D5E0'
                }}>
                  <span>Code</span>
                  <span>Account Name</span>
                  <span style={{ textAlign:'right' }}>Debit (₹) Dr</span>
                  <span style={{ textAlign:'right' }}>Credit (₹) Cr</span>
                </div>

                {accounts.map((a, i) => {
                  const bal     = balances[a.code] || {}
                  const drVal   = bal.debit  || ''
                  const crVal   = bal.credit || ''
                  const hasBal  = parseFloat(drVal||0) > 0 || parseFloat(crVal||0) > 0
                  const isParent = !a.parentCode
                  return (
                    <div key={a.code}
                      style={{
                        display:'grid',
                        gridTemplateColumns:'80px 1fr 180px 180px',
                        padding:'6px 12px',
                        borderBottom:'1px solid #F5F5F5',
                        background: hasBal  ? '#FFFBF0'
                                  : isParent? '#F8F4F8'
                                  : i%2===0  ? '#fff' : '#FAFAFA',
                        alignItems:'center',
                      }}>
                      <span style={{
                        fontFamily:'DM Mono,monospace',
                        fontSize:11, fontWeight:700,
                        color:'#714B67'
                      }}>{a.code}</span>

                      <span style={{
                        fontSize:12,
                        fontWeight: isParent ? 700 : 400,
                        color: isParent ? '#1A1A2E' : '#495057',
                        paddingLeft: a.parentCode ? 16 : 0,
                      }}>
                        {a.name}
                        {isParent && (
                          <span style={{ fontSize:9, color:'#6C757D',
                            marginLeft:6, background:'#E0D5E0',
                            padding:'1px 5px', borderRadius:8 }}>
                            GROUP
                          </span>
                        )}
                      </span>

                      {/* Dr field */}
                      <div style={{ textAlign:'right', padding:'0 6px' }}>
                        <input
                          type="number" min={0}
                          value={drVal}
                          onChange={e => setBalance(a.code, 'debit', e.target.value)}
                          onFocus={e => e.target.select()}
                          placeholder="0"
                          style={{
                            width:'100%', padding:'5px 8px',
                            border: parseFloat(drVal||0) > 0
                              ? '2px solid #28A745' : '1px solid #DEE2E6',
                            borderRadius:4, fontSize:12,
                            textAlign:'right', outline:'none',
                            background: parseFloat(drVal||0) > 0 ? '#F0FFF8' : '#fff',
                            fontFamily:'DM Mono,monospace', fontWeight:700,
                            color:'#155724',
                          }} />
                      </div>

                      {/* Cr field */}
                      <div style={{ textAlign:'right', padding:'0 6px' }}>
                        <input
                          type="number" min={0}
                          value={crVal}
                          onChange={e => setBalance(a.code, 'credit', e.target.value)}
                          onFocus={e => e.target.select()}
                          placeholder="0"
                          style={{
                            width:'100%', padding:'5px 8px',
                            border: parseFloat(crVal||0) > 0
                              ? '2px solid #DC3545' : '1px solid #DEE2E6',
                            borderRadius:4, fontSize:12,
                            textAlign:'right', outline:'none',
                            background: parseFloat(crVal||0) > 0 ? '#FFF5F5' : '#fff',
                            fontFamily:'DM Mono,monospace', fontWeight:700,
                            color:'#721C24',
                          }} />
                      </div>
                    </div>
                  )
                })}

                {/* Type subtotal */}
                {(() => {
                  const typeDr = accounts.reduce((s,a) => s + parseFloat(balances[a.code]?.debit ||0),0)
                  const typeCr = accounts.reduce((s,a) => s + parseFloat(balances[a.code]?.credit||0),0)
                  if (!typeDr && !typeCr) return null
                  return (
                    <div style={{
                      display:'grid',
                      gridTemplateColumns:'80px 1fr 180px 180px',
                      padding:'6px 12px',
                      background:'#EDE0EA',
                      fontWeight:700, fontSize:12
                    }}>
                      <span />
                      <span style={{ color:'#714B67' }}>Subtotal</span>
                      <span style={{ textAlign:'right', paddingRight:14,
                        fontFamily:'DM Mono,monospace', color:'#155724' }}>
                        {typeDr > 0 ? fmtC(typeDr) : '—'}
                      </span>
                      <span style={{ textAlign:'right', paddingRight:14,
                        fontFamily:'DM Mono,monospace', color:'#721C24' }}>
                        {typeCr > 0 ? fmtC(typeCr) : '—'}
                      </span>
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        })
      )}

      {/* Grand Total Row */}
      {!loading && (
        <div style={{
          display:'grid', gridTemplateColumns:'80px 1fr 180px 180px',
          padding:'10px 12px',
          background: balanced ? '#D4EDDA' : '#F8D7DA',
          borderRadius:6, fontWeight:800, fontSize:13,
          border: `2px solid ${balanced ? '#C3E6CB' : '#F5C6CB'}`,
          marginBottom:16
        }}>
          <span />
          <span style={{ color: balanced ? '#155724' : '#721C24' }}>
            Grand Total {balanced ? '✅' : '⚠️ Unbalanced'}
          </span>
          <span style={{ textAlign:'right', paddingRight:14,
            fontFamily:'DM Mono,monospace',
            color: balanced ? '#155724' : '#721C24' }}>
            {fmtC(totalDr)}
          </span>
          <span style={{ textAlign:'right', paddingRight:14,
            fontFamily:'DM Mono,monospace',
            color: balanced ? '#155724' : '#721C24' }}>
            {fmtC(totalCr)}
          </span>
        </div>
      )}

      {/* Save button bottom */}
      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm"
          onClick={() => nav('/fi/trial-balance')}>
          View Trial Balance
        </button>
        <button className="btn btn-p sd-bsm"
          disabled={saving || !balanced || loading}
          onClick={save}>
          {saving ? '⏳ Saving...' : '💾 Save Opening Balances'}
        </button>
      </div>
    </div>
  )
}
