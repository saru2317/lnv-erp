import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const FLAG = { USD:'🇺🇸', EUR:'🇪🇺', GBP:'🇬🇧', JPY:'🇯🇵', AED:'🇦🇪', SGD:'🇸🇬', CNY:'🇨🇳', INR:'🇮🇳', AUD:'🇦🇺', CAD:'🇨🇦', CHF:'🇨🇭' }
const inp = { padding:'7px 10px', fontSize:12, border:'1.5px solid var(--odoo-border)', borderRadius:6, outline:'none', fontFamily:'DM Sans,sans-serif', width:'100%', boxSizing:'border-box' }

export default function CurrencyConfig() {
  const [rates,    setRates]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editCode, setEditCode] = useState(null)
  const [form,     setForm]     = useState({ currency:'', name:'', symbol:'', rateToINR:'', rateType:'spot' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  // Convert tool
  const [convFrom, setConvFrom] = useState('USD')
  const [convTo,   setConvTo]   = useState('INR')
  const [convAmt,  setConvAmt]  = useState('')
  const [convRes,  setConvRes]  = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/exchange-rates`, { headers: hdr2() })
      const d = await r.json()
      setRates(d.data || [])
    } catch { toast.error('Failed to load exchange rates') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openEdit = (r) => {
    setForm({ currency:r.currency, name:r.name||'', symbol:r.symbol||'', rateToINR:r.rateToINR, rateType:r.rateType||'spot' })
    setEditCode(r.currency)
    setShowForm(true)
  }

  const openNew = () => {
    setForm({ currency:'', name:'', symbol:'', rateToINR:'', rateType:'spot' })
    setEditCode(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.currency || !form.rateToINR) { toast.error('Currency code and rate required'); return }
    setSaving(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/exchange-rates`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ currency:form.currency.toUpperCase(), rateToINR:parseFloat(form.rateToINR), rateType:form.rateType, effectiveDate:new Date().toISOString() })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(d.message)
      setShowForm(false)
      load()
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const convert = async () => {
    if (!convAmt) return
    try {
      const r = await fetch(`${BASE_URL}/fi/exchange-rates/convert`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ from:convFrom, to:convTo, amount:parseFloat(convAmt) })
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setConvRes(d)
    } catch(e) { toast.error(e.message) }
  }

  // INR is always base
  const allCurrencies = [{ currency:'INR', name:'Indian Rupee', symbol:'₹', rateToINR:1, rateType:'base', isBase:true }, ...rates]

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Currency Configuration <small>Multi-currency · Exchange rates</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>↻ Refresh Rates</button>
          <button className="btn btn-p sd-bsm" onClick={openNew}>+ Add Currency</button>
        </div>
      </div>

      {/* Base Currency Banner */}
      <div style={{padding:'14px 18px',background:'linear-gradient(135deg,#714B67,#9B59B6)',borderRadius:10,color:'#fff',marginBottom:16,
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:32}}>🇮🇳</span>
          <div>
            <div style={{fontSize:12,opacity:.8,fontWeight:600}}>BASE CURRENCY</div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22}}>Indian Rupee — INR (₹)</div>
            <div style={{fontSize:11,opacity:.75}}>All exchange rates are relative to INR · LNV Manufacturing Pvt. Ltd.</div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:11,opacity:.75}}>LNV ERP is configured for</div>
          <div style={{fontWeight:800,fontSize:16}}>Indian GST & Compliance</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
        {/* ── Left: Currency List ── */}
        <div>
          {/* Add/Edit Form */}
          {showForm && (
            <div style={{background:'#fff',border:'2px solid var(--odoo-purple)',borderRadius:8,padding:18,marginBottom:14}}>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'var(--odoo-purple)',marginBottom:14}}>
                {editCode ? `Edit Rate — ${editCode}` : '+ Add New Currency'}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>Currency Code *</label>
                  <input value={form.currency} onChange={e=>set('currency',e.target.value.toUpperCase())}
                    placeholder="USD" maxLength={3} style={inp} disabled={!!editCode} />
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>Currency Name</label>
                  <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="US Dollar" style={inp} />
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>Symbol</label>
                  <input value={form.symbol} onChange={e=>set('symbol',e.target.value)} placeholder="$" style={inp} />
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>Rate to INR *</label>
                  <input type="number" step="0.01" value={form.rateToINR} onChange={e=>set('rateToINR',e.target.value)}
                    placeholder="84.25" style={inp} />
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>Rate Type</label>
                  <select value={form.rateType} onChange={e=>set('rateType',e.target.value)} style={inp}>
                    <option value="spot">Spot Rate</option>
                    <option value="forward">Forward Rate</option>
                    <option value="rbi">RBI Reference Rate</option>
                    <option value="bank">Bank Rate</option>
                  </select>
                </div>
                <div style={{display:'flex',alignItems:'flex-end',gap:8}}>
                  <button className="btn btn-p sd-bsm" onClick={handleSave} disabled={saving} style={{flex:1}}>
                    {saving?'Saving…':'✓ Save'}
                  </button>
                  <button className="btn btn-s sd-bsm" onClick={()=>setShowForm(false)} style={{flex:1}}>Cancel</button>
                </div>
              </div>
              {form.rateToINR && form.currency && (
                <div style={{background:'#F0EEEB',padding:'8px 12px',borderRadius:6,fontSize:12}}>
                  Preview: <strong>1 {form.currency} = ₹{parseFloat(form.rateToINR).toFixed(2)}</strong>
                  &nbsp;·&nbsp; <strong>₹100 = {(100/parseFloat(form.rateToINR)).toFixed(4)} {form.currency}</strong>
                </div>
              )}
            </div>
          )}

          {/* Currency Table */}
          {loading ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading rates…</div>
          ) : (
            <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'var(--odoo-purple)'}}>
                    {['','Currency','Rate to INR','1 INR =','Type','Updated',''].map((h,i)=>(
                      <th key={i} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#fff',textTransform:'uppercase',letterSpacing:.5}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* INR base row */}
                  <tr style={{borderBottom:'1px solid #F0EEEB',background:'#F8F4F8'}}>
                    <td style={{padding:'10px 12px',fontSize:20}}>🇮🇳</td>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{fontWeight:700,fontSize:13}}>INR</div>
                      <div style={{fontSize:11,color:'#6C757D'}}>Indian Rupee</div>
                    </td>
                    <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:15}}>₹ 1.00</td>
                    <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12,color:'#6C757D'}}>₹ 1.0000</td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700}}>BASE</span>
                    </td>
                    <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D'}}>—</td>
                    <td style={{padding:'10px 12px'}}></td>
                  </tr>
                  {rates.map((r,i)=>(
                    <tr key={r.currency} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                      <td style={{padding:'10px 12px',fontSize:20}}>{FLAG[r.currency]||'🏳️'}</td>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{fontWeight:700,fontSize:13}}>{r.currency}</div>
                        <div style={{fontSize:11,color:'#6C757D'}}>{r.name||'—'}</div>
                      </td>
                      <td style={{padding:'10px 12px'}}>
                        <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:15,color:'#714B67'}}>
                          ₹ {parseFloat(r.rateToINR).toFixed(2)}
                        </span>
                      </td>
                      <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12,color:'#6C757D'}}>
                        {r.symbol}{(1/parseFloat(r.rateToINR)).toFixed(4)}
                      </td>
                      <td style={{padding:'10px 12px'}}>
                        <span style={{background:'#EDE0EA',color:'var(--odoo-purple)',padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>
                          {r.rateType||'spot'}
                        </span>
                      </td>
                      <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D'}}>{fmtDate(r.effectiveDate||r.updatedAt)}</td>
                      <td style={{padding:'10px 12px'}}>
                        <button onClick={()=>openEdit(r)}
                          style={{padding:'4px 12px',borderRadius:5,border:'1px solid var(--odoo-border)',background:'#fff',fontSize:11,cursor:'pointer'}}>
                          Edit Rate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Right: Converter ── */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Currency Converter */}
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
            <div style={{padding:'12px 16px',background:'#1A5276',color:'#fff',fontWeight:700,fontSize:13}}>
              🔄 Currency Converter
            </div>
            <div style={{padding:16}}>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>Amount</label>
                <input type="number" value={convAmt} onChange={e=>setConvAmt(e.target.value)}
                  placeholder="Enter amount" style={inp} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:6,alignItems:'center',marginBottom:10}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>From</label>
                  <select value={convFrom} onChange={e=>setConvFrom(e.target.value)} style={inp}>
                    {allCurrencies.map(c=><option key={c.currency} value={c.currency}>{c.currency}</option>)}
                  </select>
                </div>
                <div style={{fontSize:18,marginTop:16,cursor:'pointer'}} onClick={()=>{const t=convFrom;setConvFrom(convTo);setConvTo(t);setConvRes(null)}}>⇄</div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>To</label>
                  <select value={convTo} onChange={e=>setConvTo(e.target.value)} style={inp}>
                    {allCurrencies.map(c=><option key={c.currency} value={c.currency}>{c.currency}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={convert} style={{width:'100%',padding:'8px',background:'#1A5276',color:'#fff',border:'none',borderRadius:6,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                Convert
              </button>
              {convRes && (
                <div style={{marginTop:12,padding:'12px',background:'#EBF5FB',borderRadius:6,textAlign:'center'}}>
                  <div style={{fontSize:11,color:'#6C757D'}}>Result</div>
                  <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'#1A5276'}}>
                    {parseFloat(convRes.converted).toLocaleString('en-IN',{maximumFractionDigits:4})} {convTo}
                  </div>
                  <div style={{fontSize:11,color:'#6C757D',marginTop:4}}>
                    Rate: 1 {convFrom} = {convRes.rate?.toFixed(4)} {convTo}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div style={{background:'#FFF3CD',border:'1px solid #FFEAA7',borderRadius:8,padding:14,fontSize:11,color:'#856404'}}>
            <div style={{fontWeight:700,marginBottom:6}}>⚠️ Exchange Rate Notes</div>
            <ul style={{margin:0,paddingLeft:16,lineHeight:1.8}}>
              <li>Rates are manually maintained — update regularly</li>
              <li>INR is always the base currency</li>
              <li>Used for multi-currency invoices & reports</li>
              <li>RBI reference: <strong>rbi.org.in</strong></li>
            </ul>
          </div>

          {/* Quick Stats */}
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:14}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:10,color:'#1C1C1C'}}>📊 Active Currencies</div>
            {rates.slice(0,5).map(r=>(
              <div key={r.currency} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid #F0EEEB'}}>
                <span style={{fontSize:12}}>{FLAG[r.currency]||'🏳️'} {r.currency}</span>
                <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:12,color:'#714B67'}}>₹{parseFloat(r.rateToINR).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
