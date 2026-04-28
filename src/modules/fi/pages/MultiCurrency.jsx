import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

export default function MultiCurrency() {
  const [rates,      setRates]      = useState([])
  const [forexPL,    setForexPL]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('rates')
  const [editRate,   setEditRate]   = useState(null)
  const [newRate,    setNewRate]    = useState('')
  const [rateType,   setRateType]   = useState('spot')
  const [saving,     setSaving]     = useState(false)
  const [convFrom,   setConvFrom]   = useState('USD')
  const [convTo,     setConvTo]     = useState('INR')
  const [convAmt,    setConvAmt]    = useState('1000')
  const [convResult, setConvResult] = useState(null)
  const [converting, setConverting] = useState(false)
  const [forexYear,  setForexYear]  = useState(new Date().getFullYear())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/exchange-rates`, { headers: hdr2() })
      const d = await r.json()
      setRates(d.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])

  const loadForex = useCallback(async () => {
    try {
      const r = await fetch(`${BASE_URL}/fi/forex-pl?year=${forexYear}`, { headers: hdr2() })
      const d = await r.json()
      setForexPL(d)
    } catch {}
  }, [forexYear])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (activeTab==='forex') loadForex() }, [activeTab, loadForex])

  const updateRate = async () => {
    if (!newRate) return toast.error('Enter rate')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/exchange-rates`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ currency:editRate.currency, rateToINR:parseFloat(newRate), rateType })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setEditRate(null); setNewRate(''); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const convert = async () => {
    if (!convAmt) return
    setConverting(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/exchange-rates/convert`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ from:convFrom, to:convTo, amount:parseFloat(convAmt) })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setConvResult(d)
    } catch (e) { toast.error(e.message) }
    finally { setConverting(false) }
  }

  const TABS = [
    { key:'rates',     label:'\uD83D\uDCB1 Exchange Rates'  },
    { key:'converter', label:'\uD83D\uDD04 Currency Converter' },
    { key:'forex',     label:'\uD83D\uDCC8 Forex P&L'       },
  ]

  const currencies = ['INR',...rates.map(r=>r.currency)]

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Multi-Currency
          <small> Exchange Rates · Converter · Forex Gain/Loss</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh Rates</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:16,padding:'6px 8px',
        background:'#F0EEEB',borderRadius:10,border:'1px solid #E0D5E0'}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
            padding:'6px 16px',borderRadius:7,fontSize:12,fontWeight:700,cursor:'pointer',
            border:'none',transition:'all .15s',
            background:activeTab===t.key?'#714B67':'transparent',
            color:activeTab===t.key?'#fff':'#6C757D',
            boxShadow:activeTab===t.key?'0 2px 8px #714B6755':'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── TAB 1: EXCHANGE RATES ── */}
      {activeTab==='rates' && (
        <div>
          <div className="fi-alert info" style={{marginBottom:14}}>
            Base currency: <strong>INR</strong>. All rates are per 1 unit of foreign currency.
            Update rates daily for accurate forex calculations.
          </div>
          <table className="fi-data-table">
            <thead><tr>
              <th>Currency</th><th>Name</th><th>Symbol</th>
              <th style={{textAlign:'right'}}>Rate to INR</th>
              <th style={{textAlign:'right'}}>INR to Currency</th>
              <th>Type</th><th>Updated</th><th></th>
            </tr></thead>
            <tbody>
              {/* INR base row */}
              <tr style={{background:'#F8F4F8'}}>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:800,color:'#714B67'}}>INR</td>
                <td style={{fontWeight:700}}>Indian Rupee (Base)</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:14}}>\u20b9</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>1.0000</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>1.0000</td>
                <td><span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>Base</span></td>
                <td style={{fontSize:11,color:'#6C757D'}}>—</td>
                <td/>
              </tr>
              {rates.map(r=>(
                <tr key={r.currency}>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:800,color:'var(--odoo-purple)',fontSize:13}}>{r.currency}</td>
                  <td style={{fontWeight:600,fontSize:12}}>{r.name}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:14}}>{r.symbol}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:14}}>
                    {INR(r.rateToINR)}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#6C757D',fontSize:12}}>
                    {(1/r.rateToINR).toFixed(6)}
                  </td>
                  <td>
                    <span style={{background:r.rateType==='spot'?'#D1ECF1':'#FFF3CD',
                      color:r.rateType==='spot'?'#0C5460':'#856404',
                      padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                      {r.rateType==='spot'?'Spot':'Forward'}
                    </span>
                  </td>
                  <td style={{fontSize:11,color:'#6C757D'}}>
                    {r.effectiveDate?new Date(r.effectiveDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}
                  </td>
                  <td>
                    <button className="btn-xs" onClick={()=>{ setEditRate(r); setNewRate(r.rateToINR); setRateType(r.rateType||'spot') }}>
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Update rate modal */}
          {editRate && (
            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{background:'#fff',borderRadius:12,padding:28,width:400,boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67',marginBottom:4}}>
                  Update Rate — {editRate.currency}
                </div>
                <div style={{fontSize:13,color:'#6C757D',marginBottom:14}}>
                  {editRate.name} · Current: {INR(editRate.rateToINR)}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                  <div>
                    <label style={lbl}>New Rate (₹ per {editRate.currency}) *</label>
                    <input type="number" style={inp} value={newRate} onChange={e=>setNewRate(e.target.value)} step="0.01"
                      onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                  </div>
                  <div>
                    <label style={lbl}>Rate Type</label>
                    <select style={{...inp,cursor:'pointer'}} value={rateType} onChange={e=>setRateType(e.target.value)}>
                      <option value="spot">Spot Rate</option>
                      <option value="forward">Forward Rate</option>
                      <option value="average">Average Rate</option>
                    </select>
                  </div>
                </div>
                {newRate && parseFloat(newRate) !== parseFloat(editRate.rateToINR) && (
                  <div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:6,
                    padding:'6px 12px',fontSize:11,color:'#856404',marginBottom:12}}>
                    Change: {INR(editRate.rateToINR)} → {INR(newRate)}
                    ({parseFloat(newRate)>parseFloat(editRate.rateToINR)?'+':''}{((parseFloat(newRate)-parseFloat(editRate.rateToINR))/parseFloat(editRate.rateToINR)*100).toFixed(2)}%)
                  </div>
                )}
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-p sd-bsm" disabled={saving} onClick={updateRate}>
                    {saving?'Updating...':'Update Rate'}
                  </button>
                  <button className="btn btn-s sd-bsm" onClick={()=>setEditRate(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CONVERTER ── */}
      {activeTab==='converter' && (
        <div style={{maxWidth:500,margin:'0 auto'}}>
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:12,padding:24}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67',marginBottom:20}}>
              Currency Converter
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 80px 1fr',gap:12,alignItems:'end',marginBottom:16}}>
              <div>
                <label style={lbl}>From Currency</label>
                <select style={{...inp,cursor:'pointer'}} value={convFrom} onChange={e=>{ setConvFrom(e.target.value); setConvResult(null) }}>
                  {currencies.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{textAlign:'center',paddingBottom:8}}>
                <button onClick={()=>{ setConvFrom(convTo); setConvTo(convFrom); setConvResult(null) }}
                  style={{background:'#EDE0EA',border:'1px solid #E0D5E0',borderRadius:20,
                    padding:'6px 10px',cursor:'pointer',fontSize:16,color:'#714B67'}}>
                  \u21C4
                </button>
              </div>
              <div>
                <label style={lbl}>To Currency</label>
                <select style={{...inp,cursor:'pointer'}} value={convTo} onChange={e=>{ setConvTo(e.target.value); setConvResult(null) }}>
                  {currencies.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={lbl}>Amount ({convFrom})</label>
              <input type="number" style={{...inp,fontSize:18,fontFamily:'DM Mono,monospace',fontWeight:700}}
                value={convAmt} onChange={e=>{ setConvAmt(e.target.value); setConvResult(null) }}
                placeholder="1000"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <button className="btn btn-p sd-bsm" onClick={convert} disabled={converting}
              style={{width:'100%',padding:12,fontSize:14}}>
              {converting?'Converting...':'Convert'}
            </button>

            {convResult && (
              <div style={{marginTop:16,padding:16,background:'#EDE0EA',borderRadius:8,textAlign:'center'}}>
                <div style={{fontSize:12,color:'#6C757D',marginBottom:4}}>
                  {parseFloat(convAmt).toLocaleString('en-IN')} {convFrom} =
                </div>
                <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:32,color:'#714B67'}}>
                  {parseFloat(convResult.converted).toLocaleString('en-IN',{minimumFractionDigits:2})} {convTo}
                </div>
                <div style={{fontSize:11,color:'#6C757D',marginTop:8}}>
                  1 {convFrom} = {convResult.rate?.toFixed(4)||'—'} {convTo}
                  {convTo!=='INR'&&convFrom!=='INR'&&(
                    <span style={{marginLeft:8}}>· Via INR: {INR(convResult.inINR)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: FOREX P&L ── */}
      {activeTab==='forex' && (
        <div>
          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:14}}>
            <select className="sd-search" value={forexYear} onChange={e=>{ setForexYear(parseInt(e.target.value)); setForexPL(null) }} style={{width:100}}>
              {[2023,2024,2025,2026].map(y=><option key={y} value={y}>FY {y}-{y+1}</option>)}
            </select>
            <button className="btn btn-s sd-bsm" onClick={loadForex}>Load</button>
          </div>

          {forexPL ? (
            <div>
              <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:14}}>
                {[
                  { cls:'green',  label:'Forex Gain',   val:INR(forexPL.totalGain||0),  sub:`${forexPL.gains?.length||0} entries` },
                  { cls:'red',    label:'Forex Loss',   val:INR(forexPL.totalLoss||0),  sub:`${forexPL.losses?.length||0} entries` },
                  { cls: (forexPL.netForex||0)>=0?'green':'red',
                    label:'Net Forex P&L', val:INR(Math.abs(forexPL.netForex||0)),
                    sub:(forexPL.netForex||0)>=0?'Net Gain':'Net Loss' },
                ].map(k=>(
                  <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
                    <div className="fi-kpi-label">{k.label}</div>
                    <div className="fi-kpi-value">{k.val}</div>
                    <div className="fi-kpi-sub">{k.sub}</div>
                  </div>
                ))}
              </div>

              {[['Forex Gains (Cr 4900)',forexPL.gains||[],'#155724'],
                ['Forex Losses (Dr 7100)',forexPL.losses||[],'#DC3545']].map(([title,rows,c])=>(
                <div key={title} style={{marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:12,color:c,marginBottom:8}}>{title}</div>
                  {rows.length===0 ? (
                    <div style={{padding:16,textAlign:'center',color:'#6C757D',fontSize:12,
                      border:'1px solid #E0D5E0',borderRadius:6}}>No {title.includes('Gain')?'gains':'losses'} found</div>
                  ) : (
                    <table className="fi-data-table">
                      <thead><tr>
                        <th>JV No.</th><th>Date</th><th>Description</th>
                        <th style={{textAlign:'right'}}>Amount</th>
                      </tr></thead>
                      <tbody>
                        {rows.map((r,i)=>(
                          <tr key={i}>
                            <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{r.jeNo}</td>
                            <td style={{fontSize:11}}>{r.date?new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                            <td style={{fontSize:12}}>{r.narration}</td>
                            <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:c}}>{INR(r.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          ) : <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Click Load to see Forex P&L</div>}
        </div>
      )}
    </div>
  )
}
