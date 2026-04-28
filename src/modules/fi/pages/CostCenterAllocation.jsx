import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const CC_CFG = {
  Production:  { color:'#155724', bg:'#D4EDDA' },
  Admin:       { color:'#004085', bg:'#CCE5FF' },
  Sales:       { color:'#856404', bg:'#FFF3CD' },
  Maintenance: { color:'#721C24', bg:'#F8D7DA' },
}

const METHODS = [
  { value:'equal',     label:'Equal Split'           },
  { value:'sq_ft',     label:'Square Footage'        },
  { value:'headcount', label:'Headcount'             },
  { value:'asset_val', label:'Asset Value'           },
  { value:'revenue',   label:'Revenue Based'         },
  { value:'custom',    label:'Custom %'              },
]

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const BLANK = { code:'', name:'', sourceAcct:'', method:'equal',
  production:25, admin:25, sales:25, maintenance:25 }

export default function CostCenterAllocation() {
  const now = new Date()
  const [rules,      setRules]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(BLANK)
  const [saving,     setSaving]     = useState(false)
  const [period,     setPeriod]     = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`)
  const [running,    setRunning]    = useState(false)
  const [runResults, setRunResults] = useState(null)
  const [runModal,   setRunModal]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/cc-allocation/rules`, { headers: hdr2() })
      const d = await r.json()
      setRules(d.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const F = k => ({ value:form[k]??'', onChange:e=>setForm(p=>({...p,[k]:e.target.value})) })

  const total = parseFloat(form.production||0)+parseFloat(form.admin||0)+
    parseFloat(form.sales||0)+parseFloat(form.maintenance||0)
  const isValid = Math.abs(total-100) < 0.1

  // Auto-distribute equally when method changes
  const onMethod = method => {
    if (method==='equal') setForm(p=>({...p,method,production:25,admin:25,sales:25,maintenance:25}))
    else setForm(p=>({...p,method}))
  }

  const save = async () => {
    if (!form.code || !form.name || !form.sourceAcct) return toast.error('Code, name and source account required')
    if (!isValid) return toast.error(`Percentages must total 100% (currently ${total.toFixed(1)}%)`)
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/cc-allocation/rules`, {
        method:'POST', headers: hdr(), body: JSON.stringify(form)
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setShowForm(false); setForm(BLANK); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const runAllocation = async () => {
    setRunning(true); setRunResults(null)
    try {
      const res = await fetch(`${BASE_URL}/fi/cc-allocation/run`, {
        method:'POST', headers: hdr(), body: JSON.stringify({ period })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setRunResults(d.results || [])
    } catch (e) { toast.error(e.message) }
    finally { setRunning(false) }
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Cost Center Allocation
          <small> Overhead distribution rules · SAP KB15N equivalent</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>{ setShowForm(true); setForm(BLANK) }}>+ New Rule</button>
          <button className="btn btn-p sd-bsm" onClick={()=>{ setRunModal(true); setRunResults(null) }}>
            Run Allocation
          </button>
        </div>
      </div>

      <div className="fi-alert info" style={{marginBottom:14}}>
        Allocation rules split overhead expenses (rent, electricity, depreciation) across cost centers based on defined percentages.
        Run at month-end to post allocation JVs.
      </div>

      {/* CC summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
        {Object.entries(CC_CFG).map(([cc,c])=>(
          <div key={cc} style={{background:c.bg,border:`1px solid ${c.color}33`,borderRadius:8,padding:'10px 14px'}}>
            <div style={{fontWeight:700,fontSize:12,color:c.color}}>{cc}</div>
            <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
              {rules.filter(r=>r.isActive).length} active rules
            </div>
            <div style={{marginTop:6,fontSize:13,fontFamily:'DM Mono,monospace',fontWeight:700,color:c.color}}>
              Avg: {rules.length>0?Math.round(rules.reduce((a,r)=>a+parseFloat(r[cc.toLowerCase()]||0),0)/rules.length):0}%
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:20,marginBottom:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#714B67',marginBottom:14}}>
            New Allocation Rule
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr 1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Rule Code *</label>
              <input style={inp} {...F('code')} placeholder="CCR-006"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Rule Name *</label>
              <input style={inp} {...F('name')} placeholder="Factory Rent Allocation"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Source Account *</label>
              <input style={inp} {...F('sourceAcct')} placeholder="5100"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Basis</label>
              <select style={{...inp,cursor:'pointer'}} value={form.method} onChange={e=>onMethod(e.target.value)}>
                {METHODS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          {/* % sliders */}
          <div style={{background:'#F8F4F8',borderRadius:8,padding:14,marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:12,color:'#714B67'}}>Allocation Percentages</div>
              <div style={{fontSize:12,fontWeight:800,color:isValid?'#155724':'#DC3545'}}>
                Total: {total.toFixed(1)}% {isValid?'\u2714':'\u26A0 Must be 100%'}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[['production','Production'],['admin','Admin'],['sales','Sales'],['maintenance','Maintenance']].map(([k,l])=>{
                const cc = CC_CFG[l]||CC_CFG.Production
                return (
                  <div key={k}>
                    <label style={{...lbl,color:cc.color}}>{l}</label>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <input type="number" style={{...inp,width:70,textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700}}
                        min="0" max="100" step="5"
                        value={form[k]} onChange={e=>setForm(p=>({...p,[k]:parseFloat(e.target.value)||0}))}
                        onFocus={e=>e.target.style.borderColor=cc.color}
                        onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                      <span style={{fontSize:14,fontWeight:700,color:cc.color}}>%</span>
                    </div>
                    <div style={{marginTop:4,background:'#E0D5E0',borderRadius:4,height:6,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${Math.min(100,parseFloat(form[k]||0))}%`,
                        background:cc.color,borderRadius:4,transition:'width .2s'}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-p sd-bsm" disabled={saving||!isValid} onClick={save}>
              {saving?'Saving...':'Save Rule'}
            </button>
            <button className="btn btn-s sd-bsm" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Rules table */}
      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading rules...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Code</th><th>Rule Name</th><th>Source Account</th><th>Basis</th>
            <th style={{textAlign:'center',color:'#155724'}}>Production %</th>
            <th style={{textAlign:'center',color:'#004085'}}>Admin %</th>
            <th style={{textAlign:'center',color:'#856404'}}>Sales %</th>
            <th style={{textAlign:'center',color:'#721C24'}}>Maintenance %</th>
            <th style={{textAlign:'center'}}>Status</th>
          </tr></thead>
          <tbody>
            {rules.length===0 ? (
              <tr><td colSpan={9} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No rules. Auto-seeded on first load. Click refresh.
              </td></tr>
            ) : rules.map(r=>(
              <tr key={r.id}>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{r.code}</td>
                <td style={{fontWeight:600,fontSize:12}}>{r.name}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{r.sourceAcct}</td>
                <td style={{fontSize:11,color:'#6C757D'}}>{METHODS.find(m=>m.value===r.method)?.label||r.method}</td>
                {[['production','#155724'],['admin','#004085'],['sales','#856404'],['maintenance','#721C24']].map(([k,c])=>(
                  <td key={k} style={{textAlign:'center'}}>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:c}}>{r[k]}%</span>
                    <div style={{margin:'2px auto 0',width:40,background:'#F0EEEB',borderRadius:3,height:4,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${r[k]}%`,background:c,borderRadius:3}}/>
                    </div>
                  </td>
                ))}
                <td style={{textAlign:'center'}}>
                  <span style={{background:r.isActive?'#D4EDDA':'#F8D7DA',
                    color:r.isActive?'#155724':'#721C24',
                    padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                    {r.isActive?'Active':'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Run allocation modal */}
      {runModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:520,boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67',marginBottom:4}}>
              Run Cost Center Allocation
            </div>
            <div style={{fontSize:13,color:'#6C757D',marginBottom:14}}>
              Reads actual expenses and splits them across cost centers per allocation rules.
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Period *</label>
              <input type="month" style={inp} value={period} onChange={e=>setPeriod(e.target.value)}
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>

            {runResults && (
              <div style={{maxHeight:200,overflowY:'auto',border:'1px solid #E0D5E0',borderRadius:6,marginBottom:14}}>
                {runResults.map((r,i)=>(
                  <div key={i} style={{padding:'8px 12px',borderBottom:'1px solid #F0EEEB',fontSize:11}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontWeight:700,color:'#714B67'}}>{r.rule} — {r.name}</span>
                      <span style={{fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(r.total)}</span>
                    </div>
                    <div style={{display:'flex',gap:10}}>
                      {Object.entries(r.splits).filter(([,v])=>v>0).map(([cc,amt])=>{
                        const c = CC_CFG[cc]||CC_CFG.Production
                        return (
                          <span key={cc} style={{fontSize:10,background:c.bg,color:c.color,
                            padding:'1px 6px',borderRadius:8,fontWeight:700}}>
                            {cc}: {INR(amt)}
                          </span>
                        )
                      })}
                    </div>
                    <div style={{fontSize:10,color:'#714B67',marginTop:2}}>JV: {r.jeNo}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p sd-bsm" disabled={running} onClick={runAllocation}>
                {running?'Running...':'Run Allocation'}
              </button>
              <button className="btn btn-s sd-bsm" onClick={()=>{ setRunModal(false); setRunResults(null) }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
