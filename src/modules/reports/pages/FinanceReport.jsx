import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0})
const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December']

function Row({ label, value, bold, indent, positive, negative, sub }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
      padding: bold ? '10px 14px' : '7px 14px',
      paddingLeft: indent ? 28 : 14,
      background: bold ? '#FDF2E9' : 'transparent',
      borderRadius: bold ? 6 : 0,
      borderBottom: bold ? 'none' : '1px solid #F5F0F2'}}>
      <span style={{fontSize: bold?13:12, fontWeight: bold?800:400, color: bold?'#6E2C00':'#555'}}>
        {label}{sub && <span style={{fontSize:10,color:'#aaa',marginLeft:6}}>{sub}</span>}
      </span>
      <span style={{fontSize: bold?15:13, fontWeight: bold?800:600,
        color: positive ? '#1E8449' : negative ? '#C0392B' : (bold?'#6E2C00':'#333')}}>
        {negative ? '(' : ''}{fmtC(Math.abs(value))}{negative ? ')' : ''}
      </span>
    </div>
  )
}

export default function FinanceReport() {
  const nav = useNavigate()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth()+1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${BASE}/fi/profit-loss?month=${month}&year=${year}`, { headers:hdr2() })
      .then(r=>r.json()).then(d => setData(d.data||null))
      .finally(() => setLoading(false))
  }, [month, year])

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Finance Report <small>Profit &amp; Loss + EBITDA</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/fi')}>Open Full Module →</button>
        </div>
      </div>

      <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:'14px 20px',
        marginBottom:16,display:'flex',gap:12,alignItems:'center'}}>
        <select value={month} onChange={e=>setMonth(parseInt(e.target.value))}
          style={{padding:'7px 12px',border:'1.5px solid #DDD',borderRadius:6,fontSize:13}}>
          {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
          style={{padding:'7px 12px',border:'1.5px solid #DDD',borderRadius:6,fontSize:13}}>
          {[year-1,year,year+1].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:60,color:'#aaa'}}>⏳ Loading...</div>
      ) : !data ? (
        <div style={{textAlign:'center',padding:60,color:'#C0392B'}}>Could not load report</div>
      ) : (
        <>
          {/* EBITDA highlight card */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
            <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:'16px',textAlign:'center'}}>
              <div style={{fontSize:11,color:'#888',fontWeight:700,textTransform:'uppercase'}}>Revenue</div>
              <div style={{fontSize:22,fontWeight:800,color:'#1A5276'}}>{fmtC(data.revenue)}</div>
            </div>
            <div style={{background:'#FDF2E9',borderRadius:8,border:'2px solid #6E2C00',padding:'16px',textAlign:'center'}}>
              <div style={{fontSize:11,color:'#6E2C00',fontWeight:700,textTransform:'uppercase'}}>EBITDA</div>
              <div style={{fontSize:24,fontWeight:900,color:'#6E2C00'}}>{fmtC(data.ebitda)}</div>
              <div style={{fontSize:11,color:'#B8860B',fontWeight:700,marginTop:2}}>{data.margins.ebitdaMarginPct}% margin</div>
            </div>
            <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:'16px',textAlign:'center'}}>
              <div style={{fontSize:11,color:'#888',fontWeight:700,textTransform:'uppercase'}}>Net Profit</div>
              <div style={{fontSize:22,fontWeight:800,color:data.netProfit>=0?'#1E8449':'#C0392B'}}>{fmtC(data.netProfit)}</div>
              <div style={{fontSize:11,color:'#888',fontWeight:700,marginTop:2}}>{data.margins.netMarginPct}% margin</div>
            </div>
          </div>

          {/* Full waterfall */}
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:'8px 0',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <Row label="Revenue" value={data.revenue} />
            <Row label="Less: Cost of Goods Sold" value={data.cogs} negative indent />
            <Row label="Gross Profit" value={data.grossProfit} bold sub={`${data.margins.grossMarginPct}% margin`} />

            <Row label="Less: Operating Expenses" value={data.opex} negative indent />
            <Row label="EBITDA" value={data.ebitda} bold sub={`${data.margins.ebitdaMarginPct}% margin`} />

            <Row label="Less: Depreciation" value={data.depreciation} negative indent />
            <Row label="EBIT (Operating Profit)" value={data.ebit} bold />

            <Row label="Less: Interest & Finance Charges" value={data.interest} negative indent />
            <Row label="Profit Before Tax" value={data.pbt} bold />

            <Row label="Less: Income Tax" value={data.tax} negative indent />
            <Row label="Net Profit" value={data.netProfit} bold positive={data.netProfit>=0} negative={data.netProfit<0} sub={`${data.margins.netMarginPct}% margin`} />
          </div>

          <div style={{fontSize:11,color:'#aaa',marginTop:10,textAlign:'center'}}>
            EBITDA = Earnings Before Interest, Taxes, Depreciation &amp; Amortization. Computed from actual GL postings for {MONTHS[month]} {year}.
          </div>
        </>
      )}
    </div>
  )
}
