import React, { useState } from 'react'

const VOUCHER_TYPES = ['All','Journal (JV)','Payment (PV)','Receipt (RV)','Sales (SB)','Purchase (PB)','Contra (CN)']

const SAMPLE_ENTRIES = [
  { id:1,  date:'2025-04-01', voucher:'JV-0001', type:'Journal (JV)',  account:'Raw Material Stock',      narration:'Opening stock entry',               dr:1200000, cr:0       },
  { id:2,  date:'2025-04-01', voucher:'JV-0001', type:'Journal (JV)',  account:'Share Capital',            narration:'Opening stock entry',               dr:0,       cr:1200000 },
  { id:3,  date:'2025-04-01', voucher:'RV-0001', type:'Receipt (RV)',  account:'Bank — HDFC Current',     narration:'Capital introduced by promoter',     dr:1000000, cr:0       },
  { id:4,  date:'2025-04-01', voucher:'RV-0001', type:'Receipt (RV)',  account:'Share Capital',            narration:'Capital introduced by promoter',     dr:0,       cr:1000000 },
  { id:5,  date:'2025-04-03', voucher:'PB-0001', type:'Purchase (PB)', account:'COGS — Direct Material',  narration:'Purchase from ABC Steels - Inv#101', dr:382000,  cr:0       },
  { id:6,  date:'2025-04-03', voucher:'PB-0001', type:'Purchase (PB)', account:'CGST Input',               narration:'Purchase from ABC Steels - Inv#101', dr:34380,   cr:0       },
  { id:7,  date:'2025-04-03', voucher:'PB-0001', type:'Purchase (PB)', account:'SGST Input',               narration:'Purchase from ABC Steels - Inv#101', dr:34380,   cr:0       },
  { id:8,  date:'2025-04-03', voucher:'PB-0001', type:'Purchase (PB)', account:'Accounts Payable (AP)',    narration:'Purchase from ABC Steels - Inv#101', dr:0,       cr:450760  },
  { id:9,  date:'2025-04-05', voucher:'SB-0001', type:'Sales (SB)',    account:'Accounts Receivable (AR)',narration:'Sales to Sri Lakshmi Mills - SO#201', dr:462240,  cr:0       },
  { id:10, date:'2025-04-05', voucher:'SB-0001', type:'Sales (SB)',    account:'Sales Revenue',            narration:'Sales to Sri Lakshmi Mills - SO#201', dr:0,      cr:391680  },
  { id:11, date:'2025-04-05', voucher:'SB-0001', type:'Sales (SB)',    account:'GST Payable (CGST)',       narration:'Sales to Sri Lakshmi Mills - SO#201', dr:0,      cr:35280   },
  { id:12, date:'2025-04-05', voucher:'SB-0001', type:'Sales (SB)',    account:'GST Payable (SGST)',       narration:'Sales to Sri Lakshmi Mills - SO#201', dr:0,      cr:35280   },
  { id:13, date:'2025-04-07', voucher:'PV-0001', type:'Payment (PV)',  account:'Accounts Payable (AP)',    narration:'Payment to ABC Steels',              dr:450760,  cr:0       },
  { id:14, date:'2025-04-07', voucher:'PV-0001', type:'Payment (PV)',  account:'Bank — HDFC Current',     narration:'Payment to ABC Steels',              dr:0,       cr:450760  },
  { id:15, date:'2025-04-07', voucher:'PV-0002', type:'Payment (PV)',  account:'Salary & Wages',           narration:'Salary for March 2025',              dr:84000,   cr:0       },
  { id:16, date:'2025-04-07', voucher:'PV-0002', type:'Payment (PV)',  account:'Bank — HDFC Current',     narration:'Salary for March 2025',              dr:0,       cr:84000   },
  { id:17, date:'2025-04-10', voucher:'RV-0002', type:'Receipt (RV)',  account:'Bank — HDFC Current',     narration:'Receipt from Sri Lakshmi Mills',      dr:462240,  cr:0       },
  { id:18, date:'2025-04-10', voucher:'RV-0002', type:'Receipt (RV)',  account:'Accounts Receivable (AR)',narration:'Receipt from Sri Lakshmi Mills',      dr:0,       cr:462240  },
  { id:19, date:'2025-04-15', voucher:'CN-0001', type:'Contra (CN)',   account:'Cash in Hand',             narration:'Cash withdrawn for petty expenses',   dr:20000,   cr:0       },
  { id:20, date:'2025-04-15', voucher:'CN-0001', type:'Contra (CN)',   account:'Bank — HDFC Current',     narration:'Cash withdrawn for petty expenses',   dr:0,       cr:20000   },
]

const TYPE_COLORS = {
  'Journal (JV)': { bg:'#EDE0EA', color:'#714B67' },
  'Payment (PV)': { bg:'#F8D7DA', color:'#721C24' },
  'Receipt (RV)': { bg:'#D4EDDA', color:'#155724' },
  'Sales (SB)':   { bg:'#D1ECF1', color:'#0C5460' },
  'Purchase (PB)':{ bg:'#FFF3CD', color:'#856404' },
  'Contra (CN)':  { bg:'#E2D9F3', color:'#4B2E83' },
}

const fmt  = (n) => (!n || n===0) ? '—' : '₹' + Number(n).toLocaleString('en-IN')
const fmtD = (d) => new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})

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

// ── LAYER 3: Account Ledger ───────────────────────────────────
function AccountLedger({ accountName, fromDate, toDate, onBack }) {
  const entries = SAMPLE_ENTRIES.filter(e =>
    e.account === accountName &&
    e.date >= fromDate && e.date <= toDate
  )
  const totDr = entries.reduce((s,e)=>s+(e.dr||0),0)
  const totCr = entries.reduce((s,e)=>s+(e.cr||0),0)
  let running = 0

  return (
    <div className="fi-lv-wrap">
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Account Ledger
          <small>{accountName}</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">🖨️ Print</button>
        </div>
      </div>

      <Breadcrumb
        crumbs={['Day Book', 'Voucher Detail', accountName + ' Ledger']}
        onNavigate={(i) => i===0 ? onBack('root') : onBack('voucher')}
      />

      {/* Account info bar */}
      <div style={{ padding:'10px 16px', background:'#FBF7FA',
        border:'1px solid #E0D5E0', borderRadius:7,
        borderLeft:'4px solid #714B67', marginBottom:14,
        display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#714B67' }}>{accountName}</div>
          <div style={{ fontSize:11, color:'#6C757D' }}>
            Period: {fmtD(fromDate)} to {fmtD(toDate)}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:10, color:'#6C757D', textTransform:'uppercase', letterSpacing:.5 }}>Net Balance</div>
          <div style={{ fontSize:14, fontWeight:800, fontFamily:'DM Mono,monospace',
            color:(totDr-totCr)>=0?'#0C5460':'#721C24' }}>
            {fmt(Math.abs(totDr-totCr))} {(totDr-totCr)>=0?'Dr':'Cr'}
          </div>
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
        overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
              {['Date','Voucher','Type','Narration','Debit (₹)','Credit (₹)','Balance (₹)'].map(h=>(
                <th key={h} style={{ padding:'9px 14px', fontSize:10, fontWeight:700,
                  color:'#6C757D', textAlign:h.includes('₹')?'right':'left',
                  textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:24, textAlign:'center', color:'#6C757D' }}>
                No entries for this account in selected period
              </td></tr>
            ) : entries.map((e,i) => {
              running += (e.dr||0) - (e.cr||0)
              const tc = TYPE_COLORS[e.type]||{bg:'#EEE',color:'#333'}
              return (
                <tr key={e.id} style={{ borderBottom:'1px solid #F0EEF0',
                  background:i%2===0?'#fff':'#FDFBFD' }}
                  onMouseEnter={x=>x.currentTarget.style.background='#FBF7FA'}
                  onMouseLeave={x=>x.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                  <td style={{ padding:'9px 14px', fontSize:12,
                    fontFamily:'DM Mono,monospace', color:'#6C757D' }}>{fmtD(e.date)}</td>
                  <td style={{ padding:'9px 14px', fontSize:12,
                    fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67' }}>{e.voucher}</td>
                  <td style={{ padding:'9px 14px' }}>
                    <span style={{ padding:'2px 7px', borderRadius:8, fontSize:10,
                      fontWeight:700, background:tc.bg, color:tc.color }}>
                      {e.type.split(' ')[0]}
                    </span>
                  </td>
                  <td style={{ padding:'9px 14px', fontSize:12, color:'#6C757D' }}>{e.narration}</td>
                  <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    color:e.dr>0?'#0C5460':'#CCC', fontWeight:e.dr>0?700:400 }}>
                    {fmt(e.dr)}
                  </td>
                  <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right',
                    fontFamily:'DM Mono,monospace',
                    color:e.cr>0?'#721C24':'#CCC', fontWeight:e.cr>0?700:400 }}>
                    {fmt(e.cr)}
                  </td>
                  <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right',
                    fontFamily:'DM Mono,monospace', fontWeight:700,
                    color:running>=0?'#155724':'#721C24' }}>
                    {fmt(Math.abs(running))} {running>=0?'Dr':'Cr'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background:'#F8F4F8', borderTop:'2px solid #714B67' }}>
              <td colSpan={4} style={{ padding:'9px 14px', fontSize:12,
                fontWeight:800, color:'#1C1C1C' }}>Total</td>
              <td style={{ padding:'9px 14px', fontSize:13, textAlign:'right',
                fontFamily:'DM Mono,monospace', fontWeight:800, color:'#0C5460' }}>
                {fmt(totDr)}
              </td>
              <td style={{ padding:'9px 14px', fontSize:13, textAlign:'right',
                fontFamily:'DM Mono,monospace', fontWeight:800, color:'#721C24' }}>
                {fmt(totCr)}
              </td>
              <td style={{ padding:'9px 14px', fontSize:13, textAlign:'right',
                fontFamily:'DM Mono,monospace', fontWeight:800,
                color:(totDr-totCr)>=0?'#155724':'#721C24' }}>
                {fmt(Math.abs(totDr-totCr))} {(totDr-totCr)>=0?'Dr':'Cr'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── LAYER 2: Voucher Detail ───────────────────────────────────
function VoucherDetail({ voucherNo, fromDate, toDate, onAccountClick, onBack }) {
  const lines = SAMPLE_ENTRIES.filter(e => e.voucher === voucherNo)
  const first = lines[0] || {}
  const tc    = TYPE_COLORS[first.type] || { bg:'#EEE', color:'#333' }
  const totDr = lines.reduce((s,e)=>s+(e.dr||0),0)
  const totCr = lines.reduce((s,e)=>s+(e.cr||0),0)

  return (
    <div className="fi-lv-wrap">
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Voucher Detail
          <small>{voucherNo} · {fmtD(first.date)}</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">🖨️ Print</button>
        </div>
      </div>

      <Breadcrumb
        crumbs={['Day Book', voucherNo + ' Detail']}
        onNavigate={(i) => i===0 && onBack()}
      />

      {/* Voucher header card */}
      <div style={{ padding:'12px 16px', background:'#FBF7FA',
        border:'1px solid #E0D5E0', borderRadius:7,
        borderLeft:`4px solid ${tc.color}`, marginBottom:14,
        display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, color:'#6C757D', textTransform:'uppercase',
            letterSpacing:.5, marginBottom:2 }}>Voucher No.</div>
          <div style={{ fontFamily:'DM Mono,monospace', fontSize:15,
            fontWeight:800, color:'#714B67' }}>{voucherNo}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'#6C757D', textTransform:'uppercase',
            letterSpacing:.5, marginBottom:2 }}>Date</div>
          <div style={{ fontSize:13, fontWeight:700 }}>{fmtD(first.date)}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'#6C757D', textTransform:'uppercase',
            letterSpacing:.5, marginBottom:2 }}>Type</div>
          <span style={{ padding:'3px 10px', borderRadius:8, fontSize:12,
            fontWeight:700, background:tc.bg, color:tc.color }}>
            {first.type}
          </span>
        </div>
        <div>
          <div style={{ fontSize:11, color:'#6C757D', textTransform:'uppercase',
            letterSpacing:.5, marginBottom:2 }}>Narration</div>
          <div style={{ fontSize:12, color:'#1C1C1C' }}>{first.narration}</div>
        </div>
        <div style={{ marginLeft:'auto',
          display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#0C5460', fontWeight:700,
              textTransform:'uppercase', letterSpacing:.5 }}>Total Dr</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#0C5460',
              fontFamily:'DM Mono,monospace' }}>{fmt(totDr)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#721C24', fontWeight:700,
              textTransform:'uppercase', letterSpacing:.5 }}>Total Cr</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#721C24',
              fontFamily:'DM Mono,monospace' }}>{fmt(totCr)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
              letterSpacing:.5, color:totDr===totCr?'#155724':'#856404' }}>Balanced</div>
            <div style={{ fontSize:13, fontWeight:800,
              color:totDr===totCr?'#155724':'#856404' }}>
              {totDr===totCr?'✓ Yes':'✗ No'}
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <div style={{ fontSize:12, color:'#6C757D', marginBottom:10,
        display:'flex', alignItems:'center', gap:6 }}>
        <span>💡</span>
        <span>Click on any account name to view its ledger</span>
      </div>

      {/* Lines table */}
      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
        overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
              {['#','Account Name','Narration','Debit (₹)','Credit (₹)'].map(h=>(
                <th key={h} style={{ padding:'9px 14px', fontSize:10, fontWeight:700,
                  color:'#6C757D', textAlign:h.includes('₹')?'right':'left',
                  textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((e,i) => (
              <tr key={e.id} style={{ borderBottom:'1px solid #F0EEF0',
                background:i%2===0?'#fff':'#FDFBFD' }}
                onMouseEnter={x=>x.currentTarget.style.background='#FBF7FA'}
                onMouseLeave={x=>x.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                <td style={{ padding:'10px 14px', fontSize:12,
                  color:'#6C757D', width:36 }}>{i+1}</td>
                <td style={{ padding:'10px 14px' }}>
                  <span onClick={() => onAccountClick(e.account)}
                    style={{ fontSize:13, fontWeight:600, color:'#714B67',
                      cursor:'pointer', textDecoration:'underline',
                      textDecorationStyle:'dotted' }}>
                    {e.account}
                  </span>
                  <span style={{ fontSize:10, marginLeft:6, color:'#6C757D' }}>
                    {e.dr>0 ? '(Dr)' : '(Cr)'}
                  </span>
                </td>
                <td style={{ padding:'10px 14px', fontSize:12,
                  color:'#6C757D' }}>{e.narration}</td>
                <td style={{ padding:'10px 14px', fontSize:13, textAlign:'right',
                  fontFamily:'DM Mono,monospace',
                  color:e.dr>0?'#0C5460':'#CCC', fontWeight:e.dr>0?700:400 }}>
                  {fmt(e.dr)}
                </td>
                <td style={{ padding:'10px 14px', fontSize:13, textAlign:'right',
                  fontFamily:'DM Mono,monospace',
                  color:e.cr>0?'#721C24':'#CCC', fontWeight:e.cr>0?700:400 }}>
                  {fmt(e.cr)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background:'#F8F4F8', borderTop:'2px solid #714B67' }}>
              <td colSpan={3} style={{ padding:'10px 14px', fontSize:13,
                fontWeight:800, color:'#1C1C1C' }}>Total</td>
              <td style={{ padding:'10px 14px', fontSize:14, textAlign:'right',
                fontFamily:'DM Mono,monospace', fontWeight:800, color:'#0C5460' }}>
                {fmt(totDr)}
              </td>
              <td style={{ padding:'10px 14px', fontSize:14, textAlign:'right',
                fontFamily:'DM Mono,monospace', fontWeight:800, color:'#721C24' }}>
                {fmt(totCr)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── LAYER 1: Day Book Main ────────────────────────────────────
export default function DayBook() {
  const [fromDate, setFromDate] = useState('2025-04-01')
  const [toDate,   setToDate]   = useState('2025-04-15')
  const [vType,    setVType]    = useState('All')
  const [search,   setSearch]   = useState('')

  // Drill-down state
  const [layer,      setLayer]      = useState('root')
  const [selVoucher, setSelVoucher] = useState(null)
  const [selAccount, setSelAccount] = useState(null)

  const goVoucher = (vNo)  => { setSelVoucher(vNo);  setLayer('voucher') }
  const goAccount = (name) => { setSelAccount(name); setLayer('account') }
  const goBack    = (to)   => {
    if (to==='root'||!to)    { setLayer('root');    setSelVoucher(null); setSelAccount(null) }
    if (to==='voucher')      { setLayer('voucher'); setSelAccount(null) }
  }

  // ── Layer 3 ──
  if (layer==='account') return (
    <AccountLedger
      accountName={selAccount}
      fromDate={fromDate} toDate={toDate}
      onBack={goBack}
    />
  )

  // ── Layer 2 ──
  if (layer==='voucher') return (
    <VoucherDetail
      voucherNo={selVoucher}
      fromDate={fromDate} toDate={toDate}
      onAccountClick={goAccount}
      onBack={() => goBack('root')}
    />
  )

  // ── Layer 1 ──
  const filtered = SAMPLE_ENTRIES.filter(e => {
    const inDate   = e.date >= fromDate && e.date <= toDate
    const inType   = vType==='All' || e.type===vType
    const inSearch = search==='' ||
      e.voucher.toLowerCase().includes(search.toLowerCase()) ||
      e.account.toLowerCase().includes(search.toLowerCase()) ||
      e.narration.toLowerCase().includes(search.toLowerCase())
    return inDate && inType && inSearch
  })

  // Group by date then by voucher
  const byDate = filtered.reduce((acc,e) => {
    if (!acc[e.date]) acc[e.date] = {}
    if (!acc[e.date][e.voucher]) acc[e.date][e.voucher] = []
    acc[e.date][e.voucher].push(e)
    return acc
  }, {})

  const totDr = filtered.reduce((s,e)=>s+(e.dr||0),0)
  const totCr = filtered.reduce((s,e)=>s+(e.cr||0),0)

  return (
    <div className="fi-lv-wrap">
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Day Book
          <small>All Voucher Entries · LNV Manufacturing</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">🖨️ Print</button>
          <button className="btn btn-s sd-bsm">📤 Export</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:14,
        padding:'12px 14px', background:'#fff',
        border:'1px solid #E0D5E0', borderRadius:7,
        flexWrap:'wrap', alignItems:'flex-end' }}>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:'#6C757D',
            display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }}>
            From Date
          </label>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}
            style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
              borderRadius:5, fontSize:13, outline:'none', cursor:'pointer' }} />
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:'#6C757D',
            display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }}>
            To Date
          </label>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}
            style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
              borderRadius:5, fontSize:13, outline:'none', cursor:'pointer' }} />
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:'#6C757D',
            display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }}>
            Voucher Type
          </label>
          <select value={vType} onChange={e=>setVType(e.target.value)}
            style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
              borderRadius:5, fontSize:13, outline:'none', cursor:'pointer', minWidth:150 }}>
            {VOUCHER_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'#6C757D',
            display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }}>
            Search
          </label>
          <input placeholder="Voucher / Account / Narration..."
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0', width:'100%',
              borderRadius:5, fontSize:13, outline:'none', boxSizing:'border-box' }} />
        </div>
        {/* Summary pills */}
        <div style={{ display:'flex', gap:8, marginLeft:'auto', alignItems:'center' }}>
          <div style={{ padding:'6px 14px', background:'#D1ECF1',
            borderRadius:6, textAlign:'center', minWidth:100 }}>
            <div style={{ fontSize:10, color:'#0C5460', fontWeight:700,
              textTransform:'uppercase', letterSpacing:.5 }}>Total Debit</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#0C5460',
              fontFamily:'DM Mono,monospace' }}>₹{totDr.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ padding:'6px 14px', background:'#F8D7DA',
            borderRadius:6, textAlign:'center', minWidth:100 }}>
            <div style={{ fontSize:10, color:'#721C24', fontWeight:700,
              textTransform:'uppercase', letterSpacing:.5 }}>Total Credit</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#721C24',
              fontFamily:'DM Mono,monospace' }}>₹{totCr.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ padding:'6px 14px',
            background:totDr===totCr?'#D4EDDA':'#FFF3CD',
            borderRadius:6, textAlign:'center', minWidth:80 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
              letterSpacing:.5, color:totDr===totCr?'#155724':'#856404' }}>Balanced</div>
            <div style={{ fontSize:13, fontWeight:800,
              color:totDr===totCr?'#155724':'#856404' }}>
              {totDr===totCr?'✓ Yes':'✗ No'}
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <div style={{ fontSize:12, color:'#6C757D', marginBottom:10,
        padding:'7px 12px', background:'#FBF7FA', borderRadius:5,
        border:'1px solid #E0D5E0', display:'flex', alignItems:'center', gap:6 }}>
        <span>💡</span>
        <span>Click voucher → View lines → Click account → View ledger (Tally-style)</span>
      </div>

      {/* Day-wise → Voucher-wise grouped */}
      {Object.keys(byDate).sort().length===0 ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'1px solid #E0D5E0' }}>
          No entries found for selected period
        </div>
      ) : Object.keys(byDate).sort().map(date => {
        const vouchers   = byDate[date]
        const dayEntries = filtered.filter(e=>e.date===date)
        const dayDr      = dayEntries.reduce((s,e)=>s+(e.dr||0),0)
        const dayCr      = dayEntries.reduce((s,e)=>s+(e.cr||0),0)

        return (
          <div key={date} style={{ marginBottom:14, background:'#fff',
            borderRadius:8, border:'1px solid #E0D5E0',
            overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>

            {/* Date header */}
            <div style={{ display:'flex', alignItems:'center',
              padding:'9px 16px', background:'#F8F4F8',
              borderBottom:'1px solid #E0D5E0' }}>
              <span style={{ fontFamily:'Syne,sans-serif', fontSize:13,
                fontWeight:800, color:'#714B67', flex:1 }}>
                📅 {fmtD(date)}
              </span>
              <span style={{ fontSize:11, color:'#6C757D', marginRight:16 }}>
                {Object.keys(vouchers).length} vouchers
              </span>
              <span style={{ fontSize:12, fontFamily:'DM Mono,monospace',
                color:'#0C5460', fontWeight:700, marginRight:16 }}>
                Dr: ₹{dayDr.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize:12, fontFamily:'DM Mono,monospace',
                color:'#721C24', fontWeight:700 }}>
                Cr: ₹{dayCr.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Voucher rows — one row per voucher */}
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#FAFAFA', borderBottom:'1px solid #F0EEF0' }}>
                  {['Voucher No.','Type','Primary Account','Narration','Debit (₹)','Credit (₹)',''].map(h=>(
                    <th key={h} style={{ padding:'7px 14px', fontSize:10, fontWeight:700,
                      color:'#6C757D', textAlign:h.includes('₹')?'right':'left',
                      textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(vouchers).map((vNo, i) => {
                  const lines  = vouchers[vNo]
                  const first  = lines[0]
                  const vDr    = lines.reduce((s,e)=>s+(e.dr||0),0)
                  const vCr    = lines.reduce((s,e)=>s+(e.cr||0),0)
                  const tc     = TYPE_COLORS[first.type]||{bg:'#EEE',color:'#333'}
                  // Show debit account as primary
                  const drLine = lines.find(l=>l.dr>0) || first

                  return (
                    <tr key={vNo}
                      onClick={() => goVoucher(vNo)}
                      style={{ borderBottom:'1px solid #F0EEF0', cursor:'pointer',
                        background:i%2===0?'#fff':'#FDFBFD' }}
                      onMouseEnter={x=>{
                        x.currentTarget.style.background='#FBF7FA'
                        x.currentTarget.style.paddingLeft='18px'
                      }}
                      onMouseLeave={x=>{
                        x.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'
                        x.currentTarget.style.paddingLeft=''
                      }}>
                      <td style={{ padding:'9px 14px', fontSize:12,
                        fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67' }}>
                        {vNo}
                      </td>
                      <td style={{ padding:'9px 14px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:8,
                          fontSize:10, fontWeight:700, background:tc.bg, color:tc.color }}>
                          {first.type.split(' ')[0]}
                        </span>
                      </td>
                      <td style={{ padding:'9px 14px', fontSize:12,
                        fontWeight:600, color:'#1C1C1C' }}>
                        {drLine.account}
                        <span style={{ fontSize:10, color:'#6C757D', marginLeft:6 }}>
                          +{lines.length-1} more
                        </span>
                      </td>
                      <td style={{ padding:'9px 14px', fontSize:12, color:'#6C757D' }}>
                        {first.narration}
                      </td>
                      <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right',
                        fontFamily:'DM Mono,monospace', color:'#0C5460', fontWeight:700 }}>
                        {fmt(vDr)}
                      </td>
                      <td style={{ padding:'9px 14px', fontSize:12, textAlign:'right',
                        fontFamily:'DM Mono,monospace', color:'#721C24', fontWeight:700 }}>
                        {fmt(vCr)}
                      </td>
                      <td style={{ padding:'9px 14px', textAlign:'right' }}>
                        <span style={{ fontSize:11, color:'#714B67', fontWeight:600 }}>
                          Details ›
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}

      {/* Grand Total */}
      {filtered.length > 0 && (
        <div style={{ background:'#fff', borderRadius:8, border:'2px solid #714B67',
          overflow:'hidden', marginTop:4 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tfoot>
              <tr style={{ background:'#F8F4F8' }}>
                <td colSpan={5} style={{ padding:'11px 14px', fontSize:13,
                  fontWeight:800, color:'#1C1C1C', fontFamily:'Syne,sans-serif' }}>
                  Grand Total — {fromDate===toDate
                    ? fmtD(fromDate)
                    : `${fmtD(fromDate)} to ${fmtD(toDate)}`}
                </td>
                <td style={{ padding:'11px 14px', fontSize:14, textAlign:'right',
                  fontFamily:'DM Mono,monospace', fontWeight:800, color:'#0C5460' }}>
                  ₹{totDr.toLocaleString('en-IN')}
                </td>
                <td style={{ padding:'11px 14px', fontSize:14, textAlign:'right',
                  fontFamily:'DM Mono,monospace', fontWeight:800, color:'#721C24' }}>
                  ₹{totCr.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
