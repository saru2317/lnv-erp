import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })

export default function PLReport() {
  const [pl,      setPL]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [from,    setFrom]    = useState(`${new Date().getFullYear()}-04-01`)
  const [to,      setTo]      = useState(new Date().toISOString().split('T')[0])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/pl?from=${from}&to=${to}`, { headers: hdr2() })
      const data = await res.json()
      setPL(data.data)
    } catch { toast.error('Failed to load P&L') }
    finally { setLoading(false) }
  }, [from, to])
  useEffect(() => { load() }, [load])

  const [open, setOpen] = useState({ income:true, directExp:true, indirectExp:true })
  const tog = k => setOpen(p=>({...p,[k]:!p[k]}))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Profit &amp; Loss Statement</div>
        <div className="fi-lv-actions">
          <input type="date" className="sd-search" value={from} onChange={e=>setFrom(e.target.value)} style={{width:140}}/>
          <span style={{color:'#6C757D',fontSize:12}}>to</span>
          <input type="date" className="sd-search" value={to} onChange={e=>setTo(e.target.value)} style={{width:140}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-s sd-bsm">Print</button>
        </div>
      </div>

      {loading ? <div style={{padding:30,textAlign:'center'}}>Loading P&L...</div>
      : pl && (
        <div style={{maxWidth:700}}>
          {/* Net Profit highlight */}
          <div style={{background:pl.netProfit>=0?'#D4EDDA':'#F8D7DA',border:`2px solid ${pl.netProfit>=0?'#C3E6CB':'#F5C6CB'}`,borderRadius:8,padding:'12px 20px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontWeight:800,fontSize:16,color:pl.netProfit>=0?'#155724':'#721C24',fontFamily:'Syne,sans-serif'}}>
              {pl.netProfit>=0?'Net Profit':'Net Loss'}
            </div>
            <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:22,color:pl.netProfit>=0?'#155724':'#721C24'}}>
              {INR(Math.abs(pl.netProfit))}
            </div>
            <div style={{fontSize:12,color:pl.netProfit>=0?'#155724':'#721C24'}}>
              Margin: {pl.totalIncome>0?((pl.netProfit/pl.totalIncome)*100).toFixed(1):0}%
            </div>
          </div>

          <div className="fin-report">
            <div className="fin-report-hdr"><h2>Profit &amp; Loss Account</h2><span>{from} to {to}</span></div>

            {/* INCOME */}
            <div className="fin-section">
              <div className="fin-sec-title" onClick={()=>tog('income')}>{open.income?'▾':'►'} INCOME</div>
              {open.income && pl.incomeAccts.filter(a=>a.net>0).map(a=>(
                <div key={a.code} className="fin-row">
                  <span className="fn">{a.code} · {a.name}</span>
                  <span className="fv pos">{INR(a.net)}</span>
                </div>
              ))}
              <div className="fin-row total"><span className="fn">Total Income</span><span className="fv pos">{INR(pl.totalIncome)}</span></div>
            </div>

            {/* DIRECT EXPENSES */}
            <div className="fin-section">
              <div className="fin-sec-title" onClick={()=>tog('directExp')}>{open.directExp?'▾':'►'} DIRECT EXPENSES</div>
              {open.directExp && pl.expenseAccts.filter(a=>a.subType?.includes('Direct')&&a.net>0).map(a=>(
                <div key={a.code} className="fin-row">
                  <span className="fn">{a.code} · {a.name}</span>
                  <span className="fv neg">{INR(a.net)}</span>
                </div>
              ))}
              <div className="fin-row">
                <span className="fn">Gross Profit</span>
                <span className="fv pos">{INR(pl.totalIncome - pl.expenseAccts.filter(a=>a.subType?.includes('Direct')).reduce((s,a)=>s+a.net,0))}</span>
              </div>
            </div>

            {/* INDIRECT EXPENSES */}
            <div className="fin-section">
              <div className="fin-sec-title" onClick={()=>tog('indirectExp')}>{open.indirectExp?'▾':'►'} INDIRECT EXPENSES</div>
              {open.indirectExp && pl.expenseAccts.filter(a=>!a.subType?.includes('Direct')&&a.net>0).map(a=>(
                <div key={a.code} className="fin-row">
                  <span className="fn">{a.code} · {a.name}</span>
                  <span className="fv neg">{INR(a.net)}</span>
                </div>
              ))}
            </div>

            <div className="fin-row total">
              <span className="fn">{pl.netProfit>=0?'NET PROFIT':'NET LOSS'}</span>
              <span className={`fv ${pl.netProfit>=0?'pos':'neg'}`}>{INR(Math.abs(pl.netProfit))}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

