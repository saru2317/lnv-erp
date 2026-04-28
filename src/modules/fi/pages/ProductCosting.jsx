import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

export default function ProductCosting() {
  const now = new Date()
  const [month,     setMonth]     = useState(now.getMonth()+1)
  const [year,      setYear]      = useState(now.getFullYear())
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('all') // all | over | under | ok
  const [sel,       setSel]       = useState(null)  // selected item for breakdown
  const [breakdown, setBreakdown] = useState(null)
  const [bdLoading, setBdLoading] = useState(false)
  const [stdModal,  setStdModal]  = useState(null)  // { code, name, stdCost }
  const [newStd,    setNewStd]    = useState('')
  const [stdReason, setStdReason] = useState('')
  const [saving,    setSaving]    = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/product-costing?month=${month}&year=${year}`, { headers: hdr2() })
      const d = await r.json()
      setData(d)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { load() }, [load])

  const loadBreakdown = async code => {
    setBdLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/product-costing/${code}/breakdown`, { headers: hdr2() })
      const d = await r.json()
      setBreakdown(d)
    } catch {} finally { setBdLoading(false) }
  }

  const updateStd = async () => {
    if (!newStd) return toast.error('Enter new standard cost')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/product-costing/update-std`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ itemCode: stdModal.code, stdCost: parseFloat(newStd), reason: stdReason })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setStdModal(null); setNewStd(''); setStdReason(''); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const rows = data?.data || []
  const filtered = rows.filter(r => filter==='all' || r.status===filter)

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Product Costing
          <small> Standard Cost vs Actual · Variance Analysis · {MONTHS[month]} {year}</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={month} onChange={e=>setMonth(parseInt(e.target.value))} style={{width:80}}>
            {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="sd-search" value={year} onChange={e=>setYear(parseInt(e.target.value))} style={{width:80}}>
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
        {[
          { cls:'purple', label:'Total Std Cost',     val:INR(data?.totalStdCost||0),    sub:'Expected production cost' },
          { cls:'orange', label:'Total Actual Cost',  val:INR(data?.totalActualCost||0), sub:'Real production cost' },
          { cls: (data?.totalVariance||0)>0?'red':'green',
            label:'Total Variance',
            val:INR(Math.abs(data?.totalVariance||0)),
            sub:(data?.totalVariance||0)>0?'Over budget':'Under budget' },
          { cls:'blue',   label:'Items Over Budget',  val:data?.itemsOver||0,            sub:`${data?.itemsUnder||0} under budget` },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* What is standard costing */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
        {[
          { icon:'📋', label:'Material Cost', desc:'BOM components × std rate', color:'#004085' },
          { icon:'👷', label:'Labour Cost',   desc:'Hours × labour rate per product', color:'#155724' },
          { icon:'🏭', label:'Overhead Cost', desc:'Machine hours × overhead rate', color:'#856404' },
        ].map(c=>(
          <div key={c.label} style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,
            padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:22}}>{c.icon}</span>
            <div>
              <div style={{fontWeight:700,fontSize:12,color:c.color}}>{c.label}</div>
              <div style={{fontSize:11,color:'#6C757D'}}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {[
          ['all','All Items','#714B67'],
          ['over','Over Budget \u2191','#DC3545'],
          ['under','Under Budget \u2193','#155724'],
          ['ok','On Target \u2714','#856404'],
        ].map(([k,l,c])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{
            padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
            border:`1.5px solid ${filter===k?c:'#E0D5E0'}`,
            background:filter===k?c:'#fff',
            color:filter===k?'#fff':c
          }}>{l} ({k==='all'?rows.length:rows.filter(r=>r.status===k).length})</button>
        ))}
      </div>

      {/* Main table */}
      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading product costing...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Item Code</th><th>Item Name</th><th style={{textAlign:'center'}}>WOs</th>
            <th style={{textAlign:'right'}}>Qty Produced</th>
            <th style={{textAlign:'right'}}>Std Cost/Unit</th>
            <th style={{textAlign:'right'}}>Actual Cost/Unit</th>
            <th style={{textAlign:'right'}}>Variance/Unit</th>
            <th style={{textAlign:'center'}}>Var %</th>
            <th style={{textAlign:'right'}}>Total Variance</th>
            <th style={{textAlign:'center'}}>Status</th>
            <th></th>
          </tr></thead>
          <tbody>
            {filtered.length===0 ? (
              <tr><td colSpan={11} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                {rows.length===0
                  ? 'No items with standard cost set. Add std cost to items and run Work Orders.'
                  : 'No items match filter.'}
              </td></tr>
            ) : filtered.map(r => {
              const vc = r.status==='over'?'#DC3545':r.status==='under'?'#155724':'#856404'
              return (
                <tr key={r.code} onClick={()=>{ setSel(sel?.code===r.code?null:r); if(sel?.code!==r.code){ setBreakdown(null); loadBreakdown(r.code) } }}
                  style={{cursor:'pointer', background:sel?.code===r.code?'#F8F4F8':'transparent'}}>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{r.code}</td>
                  <td style={{fontWeight:600,fontSize:12}}>{r.name}</td>
                  <td style={{textAlign:'center',fontFamily:'DM Mono,monospace',color:'#6C757D'}}>{r.woCount||'—'}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{r.totalQtyProduced>0?r.totalQtyProduced.toLocaleString('en-IN'):'—'}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(r.stdCost)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:r.actualCostPerUnit>0?700:400,
                    color:r.actualCostPerUnit>0?'#333':'#CCC'}}>
                    {r.actualCostPerUnit>0?INR(r.actualCostPerUnit):'No WO data'}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:vc}}>
                    {r.actualCostPerUnit>0?(r.variance>=0?'+':'')+INR(r.variance):'—'}
                  </td>
                  <td style={{textAlign:'center'}}>
                    {r.actualCostPerUnit>0?(
                      <span style={{background:vc+'22',color:vc,padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:800}}>
                        {r.variancePct>=0?'+':''}{r.variancePct}%
                      </span>
                    ):'—'}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,
                    color:r.totalQtyProduced>0?vc:'#CCC'}}>
                    {r.totalQtyProduced>0?(r.variance*r.totalQtyProduced>=0?'+':'')+INR(r.variance*r.totalQtyProduced):'—'}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:vc+'22',color:vc,padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                      {r.status==='over'?'Over Budget':r.status==='under'?'Under Budget':r.actualCostPerUnit>0?'On Target':'No Data'}
                    </span>
                  </td>
                  <td onClick={e=>e.stopPropagation()}>
                    <button className="btn-xs" onClick={()=>{ setStdModal(r); setNewStd(r.stdCost); setStdReason('') }}>
                      Update Std
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Cost breakdown panel */}
      {sel && (
        <div style={{marginTop:12,background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#714B67',marginBottom:12}}>
            Cost Breakdown — {sel.code} · {sel.name}
          </div>
          {bdLoading ? <div style={{color:'#6C757D',fontSize:12}}>Loading breakdown...</div>
          : breakdown ? (
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
              {/* Material breakdown */}
              <div>
                <div style={{fontWeight:700,fontSize:12,color:'#004085',marginBottom:8}}>Material Components (BOM)</div>
                {breakdown.breakdown?.material?.items?.length > 0 ? (
                  <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
                    <thead><tr style={{background:'#F0F7FF'}}>
                      <th style={{padding:'5px 8px',textAlign:'left',fontWeight:700}}>Component</th>
                      <th style={{padding:'5px 8px',textAlign:'right',fontWeight:700}}>Qty</th>
                      <th style={{padding:'5px 8px',textAlign:'right',fontWeight:700}}>Rate</th>
                      <th style={{padding:'5px 8px',textAlign:'right',fontWeight:700}}>Cost</th>
                    </tr></thead>
                    <tbody>
                      {breakdown.breakdown.material.items.map((b,i)=>(
                        <tr key={i} style={{borderTop:'1px solid #F0EEEB'}}>
                          <td style={{padding:'4px 8px'}}>{b.name}</td>
                          <td style={{padding:'4px 8px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{b.qty}</td>
                          <td style={{padding:'4px 8px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(b.stdRate)}</td>
                          <td style={{padding:'4px 8px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(b.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div style={{fontSize:11,color:'#6C757D'}}>No BOM found for this item.</div>}
              </div>

              {/* Cost summary */}
              <div style={{background:'#F8F4F8',borderRadius:8,padding:14}}>
                <div style={{fontWeight:700,fontSize:12,color:'#714B67',marginBottom:10}}>Cost Summary</div>
                {[
                  ['Material',  breakdown.breakdown?.material?.total||0, '#004085'],
                  ['Labour',    breakdown.breakdown?.labour?.total||0,    '#155724'],
                  ['Overhead',  breakdown.breakdown?.overhead?.total||0,  '#856404'],
                ].map(([l,v,c])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',
                    borderBottom:'1px solid #E0D5E0'}}>
                    <span style={{fontSize:12,color:c,fontWeight:600}}>{l}</span>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:c}}>{INR(v)}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',
                  fontWeight:800,fontSize:14,borderTop:'2px solid #714B67',marginTop:4}}>
                  <span style={{color:'#714B67'}}>Total Std Cost</span>
                  <span style={{fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(breakdown.breakdown?.total||0)}</span>
                </div>
                <div style={{marginTop:8,padding:'6px 10px',background:'#EDE0EA',borderRadius:6,
                  fontSize:11,color:'#714B67',textAlign:'center'}}>
                  Item Std Cost: <strong>{INR(sel.stdCost)}</strong>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Update Std Cost Modal */}
      {stdModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:420,boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67',marginBottom:4}}>
              Update Standard Cost
            </div>
            <div style={{fontSize:13,color:'#6C757D',marginBottom:14}}>
              {stdModal.code} — {stdModal.name}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={lbl}>Current Std Cost</label>
                <div style={{...inp,background:'#F8F9FA',color:'#6C757D'}}>{INR(stdModal.stdCost)}</div>
              </div>
              <div>
                <label style={lbl}>New Std Cost (₹) *</label>
                <input type="number" style={inp} value={newStd} onChange={e=>setNewStd(e.target.value)}
                  placeholder="0.00"
                  onFocus={e=>e.target.style.borderColor='#714B67'}
                  onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={lbl}>Reason</label>
                <input style={inp} value={stdReason} onChange={e=>setStdReason(e.target.value)}
                  placeholder="Annual revision / material price change..."
                  onFocus={e=>e.target.style.borderColor='#714B67'}
                  onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              </div>
            </div>
            {newStd && parseFloat(newStd) !== parseFloat(stdModal.stdCost) && (
              <div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:6,
                padding:'6px 12px',fontSize:11,color:'#856404',marginBottom:12}}>
                Change: {INR(stdModal.stdCost)} → {INR(newStd)}
                ({parseFloat(newStd)>parseFloat(stdModal.stdCost)?'+':''}{((parseFloat(newStd)-parseFloat(stdModal.stdCost))/parseFloat(stdModal.stdCost)*100).toFixed(1)}%)
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p sd-bsm" disabled={saving} onClick={updateStd}>
                {saving?'Updating...':'Update Std Cost'}
              </button>
              <button className="btn btn-s sd-bsm" onClick={()=>setStdModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
