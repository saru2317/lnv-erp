import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block', marginBottom:4,
  textTransform:'uppercase', letterSpacing:.4 }

const fmt  = n => Number(n||0).toLocaleString('en-IN')
const fmtC = n => '₹'+fmt(n)

const STATUS = {
  DRAFT:     { bg:'#F0EEF0', text:'#6C757D', icon:'✏️',  label:'Draft'     },
  PENDING:   { bg:'#FFF3CD', text:'#856404', icon:'⏳',  label:'Pending'   },
  APPROVED:  { bg:'#D1ECF1', text:'#0C5460', icon:'✅',  label:'Approved'  },
  PROCESSED: { bg:'#D4EDDA', text:'#155724', icon:'🎉',  label:'Processed' },
  ARCHIVED:  { bg:'#E0E0E0', text:'#555',    icon:'📦',  label:'Archived'  },
}

// Grades loaded from DB (GradeMaster)

// ── Star Rating display ────────────────────────────────────
function Stars({ rating }) {
  return <span>{Array.from({length:5},(_,i)=>
    <span key={i} style={{ color:i<rating?'#F59E0B':'#E0D5E0', fontSize:14 }}>★</span>)}</span>
}

// ── Policy Form ────────────────────────────────────────────
function PolicyForm({ policy, grades, onSave, onCancel }) {
  const isEdit = !!policy?.id
  const [tab,  setTab]  = useState('basic')
  const [saving,setSaving]=useState(false)

  const [form, setForm] = useState({
    name: policy?.name || '',
    fyYear: policy?.fyYear || `${new Date().getFullYear()}-${String(new Date().getFullYear()+1).slice(2)}`,
    effectiveDate: policy?.effectiveDate
      ? policy.effectiveDate.split('T')[0]
      : `${new Date().getFullYear()+1}-04-01`,
    model: policy?.model || 'HYBRID',
    maxIncrementPct: policy?.maxIncrementPct || 25,
    minIncrementPct: policy?.minIncrementPct || 0,
  })

  const [gradeRules, setGradeRules] = useState(
    policy?.gradeRules?.length > 0 ? policy.gradeRules :
    (grades||[]).map(g => ({ gradeCode:g.code, gradeName:g.name,
      incrementPct: g.code<='G2'?6:g.code<='G4'?8:g.code<='G6'?12:0,
      isManual: g.code>='G7', remarks:'' }))
  )

  const [perfMatrix, setPerfMatrix] = useState(
    policy?.perfMatrix?.length > 0
      ? [...policy.perfMatrix].sort((a,b)=>b.rating-a.rating)
      : [
        { rating:5, ratingLabel:'Outstanding',    incrementPct:20, multiplier:1.5  },
        { rating:4, ratingLabel:'Exceeds Expect', incrementPct:15, multiplier:1.25 },
        { rating:3, ratingLabel:'Meets Expect',   incrementPct:10, multiplier:1.0  },
        { rating:2, ratingLabel:'Below Expect',   incrementPct:5,  multiplier:0.75 },
        { rating:1, ratingLabel:'Poor',           incrementPct:0,  multiplier:0.0  },
      ]
  )

  const setGR = (gradeCode, field, val) =>
    setGradeRules(prev => prev.map(g => g.gradeCode===gradeCode ? {...g,[field]:val} : g))
  const setPM = (rating, field, val) =>
    setPerfMatrix(prev => prev.map(p => p.rating===rating ? {...p,[field]:val} : p))

  // Live preview — calculate example increment
  const previewGrade = gradeRules.find(g=>g.gradeCode==='G3') || {}
  const previewPerf  = perfMatrix.find(p=>p.rating===4) || {}
  const exBasic      = 15000
  let exPct = 0
  if (form.model==='GRADE')       exPct = parseFloat(previewGrade.incrementPct||0)
  if (form.model==='PERFORMANCE') exPct = parseFloat(previewPerf.incrementPct||0)
  if (form.model==='HYBRID')      exPct = parseFloat(previewGrade.incrementPct||0) * parseFloat(previewPerf.multiplier||1)
  exPct = Math.min(exPct, form.maxIncrementPct)
  const exAmt = Math.round(exBasic * exPct / 100)

  const save = async () => {
    if (!form.name||!form.fyYear||!form.effectiveDate||!form.model)
      return toast.error('All fields required!')
    setSaving(true)
    try {
      const payload = { ...form, gradeRules, perfMatrix }
      const url    = isEdit ? `${BASE_URL}/increment/${policy.id}` : `${BASE_URL}/increment`
      const method = isEdit ? 'PATCH' : 'POST'
      const res    = await fetch(url,{method,headers:authHdrs(),body:JSON.stringify(payload)})
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(isEdit?'Updated!':'Policy created as DRAFT!')
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const MODEL_INFO = {
    GRADE:       { color:'#0C5460', bg:'#D1ECF1', desc:'Each grade gets a fixed % increment. Simple and transparent.' },
    PERFORMANCE: { color:'#856404', bg:'#FFF3CD', desc:'Increment driven by performance rating. Poor performers get 0%.' },
    HYBRID:      { color:'#714B67', bg:'#EDE0EA', desc:'Grade base % × Performance multiplier = Final %. Most recommended.' },
  }
  const mi = MODEL_INFO[form.model] || {}

  const TABS = [
    { id:'basic',  label:'📋 Policy Setup'       },
    { id:'grades', label:'🏷️ Grade Rules'         },
    { id:'perf',   label:'⭐ Performance Matrix'  },
    { id:'preview',label:'🧮 Preview'             },
  ]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:'90%', maxWidth:960,
        maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.35)' }}>

        {/* Header */}
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700 }}>
              {isEdit?`Edit — ${policy.policyNo}`:'+ New Increment Policy'}
            </h3>
            <p style={{ color:'rgba(255,255,255,.6)', margin:'2px 0 0', fontSize:11 }}>
              Company Admin configures — 3 models: Grade / Performance / Hybrid
            </p>
          </div>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'2px solid #E0D5E0', background:'#F8F7FA' }}>
          {TABS.map(t=>(
            <div key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:'10px 20px', fontSize:12, fontWeight:600, cursor:'pointer',
                color:tab===t.id?'#714B67':'#6C757D',
                borderBottom:tab===t.id?'2px solid #714B67':'2px solid transparent', marginBottom:-2 }}>
              {t.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', flex:1, padding:'16px 20px' }}>

          {/* ── BASIC TAB ── */}
          {tab==='basic' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12 }}>
                <div><label style={lbl}>Policy Name *</label>
                  <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                    style={inp} placeholder="FY 2026-27 Annual Increment"
                    onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} /></div>
                <div><label style={lbl}>FY Year *</label>
                  <input value={form.fyYear} onChange={e=>setForm(p=>({...p,fyYear:e.target.value}))}
                    style={inp} placeholder="2026-27"
                    onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} /></div>
                <div><label style={lbl}>Effective Date *</label>
                  <input type="date" value={form.effectiveDate}
                    onChange={e=>setForm(p=>({...p,effectiveDate:e.target.value}))} style={inp}
                    onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} /></div>
              </div>

              {/* Model selector */}
              <div>
                <label style={lbl}>Increment Model *</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                  {Object.entries(MODEL_INFO).map(([m,info])=>(
                    <div key={m} onClick={()=>setForm(p=>({...p,model:m}))}
                      style={{ padding:16, borderRadius:8, cursor:'pointer',
                        border: form.model===m?`2px solid #714B67`:`1px solid #E0D5E0`,
                        background: form.model===m?'#714B67':'#fff' }}>
                      <div style={{ fontWeight:700, fontSize:13,
                        color:form.model===m?'#fff':'#1C1C1C', marginBottom:6 }}>
                        {m==='GRADE'?'📊 Grade Only':m==='PERFORMANCE'?'⭐ Performance Only':'🔀 Hybrid'}
                      </div>
                      <div style={{ fontSize:11, color:form.model===m?'rgba(255,255,255,.8)':'#6C757D',
                        lineHeight:1.5 }}>{info.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Max Increment Cap (%)</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="number" value={form.maxIncrementPct} min="0" max="100"
                      onChange={e=>setForm(p=>({...p,maxIncrementPct:parseFloat(e.target.value)||0}))}
                      style={{ ...inp, width:100 }}
                      onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                    <span style={{ fontSize:11, color:'#6C757D' }}>No employee gets more than this</span>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Min Increment Floor (%)</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="number" value={form.minIncrementPct} min="0"
                      onChange={e=>setForm(p=>({...p,minIncrementPct:parseFloat(e.target.value)||0}))}
                      style={{ ...inp, width:100 }}
                      onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                    <span style={{ fontSize:11, color:'#6C757D' }}>Minimum even for poor performers</span>
                  </div>
                </div>
              </div>

              {/* Model explanation box */}
              <div style={{ background:mi.bg, borderRadius:8, padding:14,
                border:`1px solid ${mi.color}33` }}>
                <div style={{ fontWeight:700, fontSize:12, color:mi.color, marginBottom:8 }}>
                  📖 How {form.model} model works:
                </div>
                {form.model==='GRADE' && (
                  <div style={{ fontSize:12, color:'#495057', lineHeight:1.8 }}>
                    Each grade has a fixed increment %. <br/>
                    Example: G3 = 8% → Employee with ₹15,000 Basic gets ₹1,200 increment → New Basic: ₹16,200
                  </div>
                )}
                {form.model==='PERFORMANCE' && (
                  <div style={{ fontSize:12, color:'#495057', lineHeight:1.8 }}>
                    Increment is purely based on performance rating. Grade doesn't matter.<br/>
                    Example: Rating 4 = 15% → Employee with ₹15,000 Basic gets ₹2,250 → New Basic: ₹17,250
                  </div>
                )}
                {form.model==='HYBRID' && (
                  <div style={{ fontSize:12, color:'#495057', lineHeight:1.8 }}>
                    Final % = Grade base % × Performance multiplier<br/>
                    Example: G3 base = 8% × Rating 4 multiplier (1.25x) = <strong>10%</strong><br/>
                    Employee with ₹15,000 Basic gets ₹1,500 → New Basic: ₹16,500
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── GRADE RULES TAB ── */}
          {tab==='grades' && (
            <div>
              <div style={{ background:'#D1ECF1', padding:'8px 12px', borderRadius:6,
                fontSize:12, color:'#0C5460', marginBottom:16, border:'1px solid #BEE5EB' }}>
                📊 Set increment % per grade. G7/G8 usually decided by MD manually — toggle "Manual".
                {form.model==='PERFORMANCE' && ' (Grade rules not used in Performance-only model)'}
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead style={{ background:'#F8F4F8' }}>
                  <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                    {['Grade','Grade Name','Increment %','Manual (MD decides)','Example (₹15,000 Basic)','Remarks'].map(h=>(
                      <th key={h} style={{ padding:'9px 12px', fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gradeRules.map((g,i)=>(
                    <tr key={g.gradeCode} style={{ borderBottom:'1px solid #F0EEF0',
                      background: g.isManual?'#F8F4F8':i%2===0?'#fff':'#FDFBFD' }}>
                      <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace',
                        fontWeight:700, color:'#714B67', fontSize:13 }}>{g.gradeCode}</td>
                      <td style={{ padding:'8px 12px', fontSize:12 }}>{g.gradeName}</td>
                      <td style={{ padding:'6px 8px', width:100 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <input type="number" value={g.incrementPct} min="0" max="100"
                            disabled={g.isManual}
                            onChange={e=>setGR(g.gradeCode,'incrementPct',parseFloat(e.target.value)||0)}
                            style={{ ...inp, width:70, opacity:g.isManual?.4:1, fontSize:13,
                              fontWeight:700, color:'#714B67' }} />
                          <span style={{ fontSize:12, color:'#6C757D' }}>%</span>
                        </div>
                      </td>
                      <td style={{ padding:'8px 12px', textAlign:'center' }}>
                        <div onClick={()=>setGR(g.gradeCode,'isManual',!g.isManual)}
                          style={{ width:40, height:22, borderRadius:11, cursor:'pointer',
                            position:'relative', background:g.isManual?'#714B67':'#CCC',
                            transition:'background .2s', display:'inline-block' }}>
                          <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff',
                            position:'absolute', top:3, left:g.isManual?21:3, transition:'left .2s' }} />
                        </div>
                      </td>
                      <td style={{ padding:'8px 12px', fontSize:12 }}>
                        {g.isManual ? (
                          <span style={{ color:'#856404', fontStyle:'italic' }}>MD decides manually</span>
                        ) : (
                          <span style={{ color:'#155724', fontFamily:'DM Mono,monospace' }}>
                            +{fmtC(Math.round(15000*parseFloat(g.incrementPct||0)/100))}
                            &nbsp;→&nbsp;{fmtC(15000+Math.round(15000*parseFloat(g.incrementPct||0)/100))}
                          </span>
                        )}
                      </td>
                      <td style={{ padding:'6px 8px' }}>
                        <input value={g.remarks||''} onChange={e=>setGR(g.gradeCode,'remarks',e.target.value)}
                          style={{ ...inp, fontSize:11 }} placeholder="Optional note"
                          onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PERFORMANCE MATRIX TAB ── */}
          {tab==='perf' && (
            <div>
              <div style={{ background:'#FFF3CD', padding:'8px 12px', borderRadius:6,
                fontSize:12, color:'#856404', marginBottom:16, border:'1px solid #FFEEBA' }}>
                ⭐ Configure how ratings translate to increment.
                {form.model==='GRADE' && ' (Performance matrix not used in Grade-only model)'}
                {form.model==='PERFORMANCE' && ' → Increment % is used directly.'}
                {form.model==='HYBRID' && ' → Multiplier × Grade base % = Final increment.'}
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead style={{ background:'#F8F4F8' }}>
                  <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                    {['Rating','Label',
                      form.model==='HYBRID'?'Multiplier (×)':'Increment %',
                      form.model==='PERFORMANCE'?'Increment %':'—',
                      'Example (G3 = 8% base, ₹15,000 Basic)'].map(h=>(
                      <th key={h} style={{ padding:'9px 12px', fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perfMatrix.map((p,i)=>{
                    let exPct = form.model==='PERFORMANCE' ? parseFloat(p.incrementPct||0)
                              : form.model==='HYBRID'      ? 8 * parseFloat(p.multiplier||1)
                              : 8
                    exPct = Math.min(exPct, form.maxIncrementPct)
                    const exAmt = Math.round(15000 * exPct / 100)
                    const STAR_COLORS = {5:'#F59E0B',4:'#22C55E',3:'#3B82F6',2:'#F97316',1:'#EF4444'}
                    return (
                      <tr key={p.rating} style={{ borderBottom:'1px solid #F0EEF0',
                        background:i%2===0?'#fff':'#FDFBFD' }}>
                        <td style={{ padding:'8px 12px' }}>
                          <div style={{ display:'flex', gap:2 }}>
                            {Array.from({length:5},(_,j)=>(
                              <span key={j} style={{ fontSize:18,
                                color: j<p.rating?STAR_COLORS[p.rating]:'#E0D5E0' }}>★</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding:'6px 8px', width:160 }}>
                          <input value={p.ratingLabel||''} onChange={e=>setPM(p.rating,'ratingLabel',e.target.value)}
                            style={{ ...inp, fontSize:12 }}
                            onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                        </td>
                        {form.model==='HYBRID' && (
                          <td style={{ padding:'6px 8px', width:120 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <input type="number" value={p.multiplier||0} min="0" max="3" step="0.05"
                                onChange={e=>setPM(p.rating,'multiplier',parseFloat(e.target.value)||0)}
                                style={{ ...inp, width:80, fontWeight:700, color:'#714B67' }} />
                              <span style={{ fontSize:12, color:'#6C757D' }}>×</span>
                            </div>
                          </td>
                        )}
                        {form.model==='PERFORMANCE' && (
                          <td style={{ padding:'6px 8px', width:120 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <input type="number" value={p.incrementPct||0} min="0" max="100"
                                onChange={e=>setPM(p.rating,'incrementPct',parseFloat(e.target.value)||0)}
                                style={{ ...inp, width:80, fontWeight:700, color:'#714B67' }} />
                              <span style={{ fontSize:12, color:'#6C757D' }}>%</span>
                            </div>
                          </td>
                        )}
                        {form.model==='GRADE' && (
                          <td style={{ padding:'8px 12px', fontSize:11, color:'#6C757D',
                            fontStyle:'italic' }}>Not used in Grade model</td>
                        )}
                        <td style={{ padding:'8px 12px' }}>
                          {form.model==='GRADE' ? (
                            <span style={{ fontSize:11, color:'#6C757D' }}>—</span>
                          ) : (
                            <span style={{ fontSize:12, fontFamily:'DM Mono,monospace', color:'#155724' }}>
                              {exPct.toFixed(1)}% → +{fmtC(exAmt)} → {fmtC(15000+exAmt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PREVIEW TAB ── */}
          {tab==='preview' && (
            <div>
              <div style={{ background:'#EDE0EA', padding:'8px 12px', borderRadius:6,
                fontSize:12, color:'#714B67', marginBottom:16, border:'1px solid #D4BFCF' }}>
                🧮 Live preview — how the <strong>{form.model}</strong> model will calculate for each scenario
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {/* Grade summary */}
                <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
                  overflow:'hidden' }}>
                  <div style={{ padding:'10px 14px', background:'#D1ECF1', fontWeight:700,
                    fontSize:12, color:'#0C5460' }}>📊 Grade Increment Summary</div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'#F8F4F8', borderBottom:'1px solid #E0D5E0' }}>
                      {['Grade','Base %','Example (₹15k Basic)'].map(h=>(
                        <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700,
                          color:'#6C757D', textAlign:'left', textTransform:'uppercase' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {gradeRules.map((g,i)=>(
                        <tr key={g.gradeCode} style={{ borderBottom:'1px solid #F0EEF0',
                          background:i%2===0?'#fff':'#FDFBFD' }}>
                          <td style={{ padding:'7px 10px', fontFamily:'DM Mono,monospace',
                            fontWeight:700, color:'#714B67' }}>{g.gradeCode}</td>
                          <td style={{ padding:'7px 10px', fontSize:12 }}>
                            {g.isManual ? <span style={{ color:'#856404',fontSize:11 }}>Manual</span>
                              : <strong>{g.incrementPct}%</strong>}
                          </td>
                          <td style={{ padding:'7px 10px', fontSize:11,
                            fontFamily:'DM Mono,monospace', color:'#155724' }}>
                            {g.isManual ? '—' :
                              `+${fmtC(Math.round(15000*parseFloat(g.incrementPct)/100))}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Performance summary */}
                <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
                  overflow:'hidden' }}>
                  <div style={{ padding:'10px 14px', background:'#FFF3CD', fontWeight:700,
                    fontSize:12, color:'#856404' }}>⭐ Performance Matrix Summary</div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'#F8F4F8', borderBottom:'1px solid #E0D5E0' }}>
                      {['Rating','Label',
                        form.model==='HYBRID'?'Multiplier':'Increment %',
                        'G3 Example'].map(h=>(
                        <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700,
                          color:'#6C757D', textAlign:'left', textTransform:'uppercase' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {perfMatrix.map((p,i)=>{
                        const g3Pct = parseFloat(gradeRules.find(g=>g.gradeCode==='G3')?.incrementPct||8)
                        let exPct = form.model==='GRADE'       ? g3Pct
                                  : form.model==='PERFORMANCE' ? parseFloat(p.incrementPct||0)
                                  : g3Pct * parseFloat(p.multiplier||1)
                        exPct = Math.min(exPct, form.maxIncrementPct)
                        const STAR_COLORS = {5:'#F59E0B',4:'#22C55E',3:'#3B82F6',2:'#F97316',1:'#EF4444'}
                        return (
                          <tr key={p.rating} style={{ borderBottom:'1px solid #F0EEF0',
                            background:i%2===0?'#fff':'#FDFBFD' }}>
                            <td style={{ padding:'7px 10px' }}>
                              <Stars rating={p.rating} /></td>
                            <td style={{ padding:'7px 10px', fontSize:11 }}>{p.ratingLabel}</td>
                            <td style={{ padding:'7px 10px', fontWeight:700, color:STAR_COLORS[p.rating] }}>
                              {form.model==='HYBRID'
                                ? `${p.multiplier}×`
                                : `${p.incrementPct}%`}
                            </td>
                            <td style={{ padding:'7px 10px', fontSize:11,
                              fontFamily:'DM Mono,monospace', color:'#155724' }}>
                              {exPct.toFixed(1)}% → +{fmtC(Math.round(15000*exPct/100))}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Highlight box */}
              <div style={{ marginTop:16, background:'#714B67', borderRadius:8, padding:16, color:'#fff' }}>
                <div style={{ fontSize:12, fontWeight:700, marginBottom:8, opacity:.8,
                  textTransform:'uppercase', letterSpacing:.5 }}>
                  📌 Example Calculation — G3 Employee, Rating 4 (Exceeds)
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                  {[
                    ['Current Basic', fmtC(15000)],
                    ['Increment %',   `${Math.min(form.model==='GRADE'?parseFloat(gradeRules.find(g=>g.gradeCode==='G3')?.incrementPct||8):form.model==='PERFORMANCE'?parseFloat(perfMatrix.find(p=>p.rating===4)?.incrementPct||15):parseFloat(gradeRules.find(g=>g.gradeCode==='G3')?.incrementPct||8)*parseFloat(perfMatrix.find(p=>p.rating===4)?.multiplier||1.25),form.maxIncrementPct).toFixed(1)}%`],
                    ['Increment Amt', fmtC(Math.round(15000*Math.min(form.model==='GRADE'?parseFloat(gradeRules.find(g=>g.gradeCode==='G3')?.incrementPct||8):form.model==='PERFORMANCE'?parseFloat(perfMatrix.find(p=>p.rating===4)?.incrementPct||15):parseFloat(gradeRules.find(g=>g.gradeCode==='G3')?.incrementPct||8)*parseFloat(perfMatrix.find(p=>p.rating===4)?.multiplier||1.25),form.maxIncrementPct)/100))],
                    ['New Basic', fmtC(15000+Math.round(15000*Math.min(form.model==='GRADE'?parseFloat(gradeRules.find(g=>g.gradeCode==='G3')?.incrementPct||8):form.model==='PERFORMANCE'?parseFloat(perfMatrix.find(p=>p.rating===4)?.incrementPct||15):parseFloat(gradeRules.find(g=>g.gradeCode==='G3')?.incrementPct||8)*parseFloat(perfMatrix.find(p=>p.rating===4)?.multiplier||1.25),form.maxIncrementPct)/100))],
                  ].map(([label,val])=>(
                    <div key={label} style={{ background:'rgba(255,255,255,.15)', borderRadius:6, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, opacity:.7, marginBottom:4, textTransform:'uppercase' }}>{label}</div>
                      <div style={{ fontSize:18, fontWeight:800, fontFamily:'Syne,sans-serif' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'space-between', alignItems:'center', background:'#F8F7FA' }}>
          <div style={{ fontSize:11, color:'#6C757D' }}>
            💡 Saved as DRAFT → Generate proposals → Submit for MD approval
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onCancel} style={{ padding:'8px 20px', background:'#fff',
              color:'#6C757D', border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13, cursor:'pointer' }}>
              Cancel</button>
            <button onClick={save} disabled={saving}
              style={{ padding:'8px 24px', background:saving?'#9E7D96':'#714B67',
                color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {saving?'⏳ Saving...':'💾 Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────
export default function IncrementPolicyPage() {
  const [policies,   setPolicies]  = useState([])
  const [grades,     setGrades]    = useState([])
  const [loading,    setLoading]   = useState(true)
  const [showForm,   setShowForm]  = useState(false)
  const [editPolicy, setEditPolicy]= useState(null)
  const [expandId,   setExpandId]  = useState(null)
  const [generating, setGenerating]= useState(null)
  const [actionModal,setActionModal]=useState(null) // {policy, action}
  const [remarks,    setRemarks]   = useState('')

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true)
      const [polRes, gradeRes] = await Promise.all([
        fetch(`${BASE_URL}/increment`, { headers:authHdrs() }),
        fetch(`${BASE_URL}/hr-master/grades`, { headers:authHdrs() }),
      ])
      const polData   = await polRes.json()
      const gradeData = await gradeRes.json()
      if (polRes.ok)   setPolicies(polData.data||[])
      if (gradeRes.ok) setGrades(gradeData.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchPolicies() }, [])

  const generate = async (id) => {
    setGenerating(id)
    try {
      const res  = await fetch(`${BASE_URL}/increment/${id}/generate`,
        { method:'POST', headers:authHdrs(), body:'{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      fetchPolicies()
    } catch(e){ toast.error(e.message) } finally { setGenerating(null) }
  }

  const doAction = async () => {
    if (!actionModal) return
    try {
      const res  = await fetch(`${BASE_URL}/increment/${actionModal.policy.id}/${actionModal.action}`,
        { method:'POST', headers:authHdrs(), body:JSON.stringify({ remarks }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      setActionModal(null); setRemarks(''); fetchPolicies()
    } catch(e){ toast.error(e.message) }
  }

  const totalImpact = (policy) => {
    if (!policy?.proposals) return 0
    return policy.proposals.reduce((s,p) => s + (parseFloat(p.newCTC)-parseFloat(p.currentCTC)), 0)
  }

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            Increment Policy Engine
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            Grade / Performance / Hybrid — Admin configures → MD approves → System processes
          </p>
        </div>
        <button onClick={()=>{setEditPolicy(null);setShowForm(true)}}
          style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
            border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          + New Increment Policy
        </button>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Total Cycles',  value:policies.length,                                      color:'#714B67', bg:'#EDE0EA' },
          { label:'Draft',         value:policies.filter(p=>p.status==='DRAFT').length,         color:'#6C757D', bg:'#F0EEF0' },
          { label:'Pending MD',    value:policies.filter(p=>p.status==='PENDING').length,       color:'#856404', bg:'#FFF3CD' },
          { label:'Processed',     value:policies.filter(p=>p.status==='PROCESSED').length,     color:'#155724', bg:'#D4EDDA' },
        ].map(k=>(
          <div key={k.label} style={{ background:k.bg, borderRadius:8, padding:'12px 16px', border:`1px solid ${k.color}22` }}>
            <div style={{ fontSize:11, color:k.color, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color, fontFamily:'Syne,sans-serif' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Policy List */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
      ) : policies.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📈</div>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>No Increment Policies yet</div>
          <div style={{ fontSize:12 }}>Click "+ New Increment Policy" to create your first annual increment cycle</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {policies.map(p => {
            const sc = STATUS[p.status] || {}
            const propCount = p._count?.proposals || 0
            const isExpanded = expandId === p.id
            const MODEL_BADGE = { GRADE:'📊 Grade', PERFORMANCE:'⭐ Performance', HYBRID:'🔀 Hybrid' }
            return (
              <div key={p.id} style={{ background:'#fff', borderRadius:8,
                border:'1px solid #E0D5E0', overflow:'hidden',
                boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                {/* Header row */}
                <div style={{ padding:'14px 18px', display:'flex',
                  justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <span style={{ fontFamily:'DM Mono,monospace', fontSize:12,
                      fontWeight:700, color:'#714B67' }}>{p.policyNo}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:'#1C1C1C' }}>{p.name}</div>
                      <div style={{ fontSize:11, color:'#6C757D', marginTop:2, display:'flex', gap:10 }}>
                        <span>FY: <strong>{p.fyYear}</strong></span>
                        <span>Effective: <strong>{new Date(p.effectiveDate).toLocaleDateString('en-IN')}</strong></span>
                        <span>Model: <strong>{MODEL_BADGE[p.model]}</strong></span>
                        <span>Cap: <strong>{p.maxIncrementPct}%</strong></span>
                        {propCount > 0 && <span>Proposals: <strong>{propCount} employees</strong></span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ padding:'4px 12px', borderRadius:10, fontSize:11,
                      fontWeight:700, background:sc.bg, color:sc.text }}>
                      {sc.icon} {sc.label}
                    </span>

                    {/* Action buttons per status */}
                    {p.status==='DRAFT' && <>
                      <button onClick={()=>{setEditPolicy(p);setShowForm(true)}}
                        style={{ padding:'5px 12px', background:'#fff', color:'#714B67',
                          border:'1.5px solid #714B67', borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:600 }}>
                        ✏️ Edit</button>
                      <button onClick={()=>generate(p.id)} disabled={generating===p.id}
                        style={{ padding:'5px 12px', background:'#0C5460', color:'#fff',
                          border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:600 }}>
                        {generating===p.id?'⏳ Generating...':'🔄 Generate Proposals'}</button>
                      {propCount > 0 && (
                        <button onClick={()=>setActionModal({policy:p,action:'submit'})}
                          style={{ padding:'5px 12px', background:'#856404', color:'#fff',
                            border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:600 }}>
                          📤 Submit for Approval</button>
                      )}
                    </>}

                    {p.status==='PENDING' && <>
                      <button onClick={()=>setActionModal({policy:p,action:'approve'})}
                        style={{ padding:'5px 12px', background:'#28A745', color:'#fff',
                          border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:600 }}>
                        ✅ Approve</button>
                      <button onClick={()=>setActionModal({policy:p,action:'reject'})}
                        style={{ padding:'5px 12px', background:'#DC3545', color:'#fff',
                          border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:600 }}>
                        ❌ Reject</button>
                    </>}

                    {p.status==='APPROVED' && (
                      <button onClick={()=>setActionModal({policy:p,action:'process'})}
                        style={{ padding:'5px 14px', background:'#28A745', color:'#fff',
                          border:'none', borderRadius:5, fontSize:12, cursor:'pointer', fontWeight:700 }}>
                        🚀 Process Increments</button>
                    )}

                    <button onClick={()=>setExpandId(isExpanded?null:p.id)}
                      style={{ padding:'5px 12px', background:'#fff', color:'#6C757D',
                        border:'1px solid #E0D5E0', borderRadius:5, fontSize:11, cursor:'pointer' }}>
                      {isExpanded?'▲ Hide':'▼ Details'}
                    </button>
                  </div>
                </div>

                {/* Grade rules summary chips */}
                {p.gradeRules?.length > 0 && (
                  <div style={{ padding:'0 18px 12px', display:'flex', gap:6, flexWrap:'wrap' }}>
                    {p.gradeRules.map(g=>(
                      <span key={g.gradeCode} style={{ padding:'3px 10px', borderRadius:10,
                        fontSize:11, fontWeight:600,
                        background: g.isManual?'#EDE0EA':'#D4EDDA',
                        color: g.isManual?'#714B67':'#155724' }}>
                        {g.gradeCode}: {g.isManual?'Manual':`${g.incrementPct}%`}
                      </span>
                    ))}
                    {p.perfMatrix?.length > 0 && p.model!=='GRADE' && (
                      <span style={{ padding:'3px 10px', borderRadius:10,
                        fontSize:11, fontWeight:600, background:'#FFF3CD', color:'#856404' }}>
                        ⭐ {p.perfMatrix.length} rating levels configured
                      </span>
                    )}
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ borderTop:'1px solid #F0EEF0', padding:'14px 18px',
                    background:'#FDFBFD' }}>
                    {propCount > 0 && (
                      <div style={{ background:'#D4EDDA', padding:'10px 14px', borderRadius:6,
                        marginBottom:12, fontSize:12, color:'#155724', display:'flex',
                        justifyContent:'space-between', alignItems:'center' }}>
                        <span>📊 <strong>{propCount} employees</strong> with proposals generated</span>
                        <span>Monthly CTC Impact: <strong>{fmtC(Math.abs(totalImpact(p)))}/month</strong></span>
                      </div>
                    )}
                    <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                      marginBottom:8, textTransform:'uppercase', letterSpacing:.4 }}>
                      📋 Approval Trail
                    </div>
                    <div style={{ fontSize:12, color:'#6C757D', lineHeight:2 }}>
                      {p.createdBy && <div>Created by: <strong>{p.createdBy}</strong></div>}
                      {p.submittedBy && <div>Submitted by: <strong>{p.submittedBy}</strong> on {new Date(p.submittedAt).toLocaleDateString('en-IN')}</div>}
                      {p.approvedBy && <div>Approved by: <strong>{p.approvedBy}</strong> on {new Date(p.approvedAt).toLocaleDateString('en-IN')} — {p.approvalRemarks}</div>}
                      {p.rejectedBy && <div style={{ color:'#DC3545' }}>Rejected by: <strong>{p.rejectedBy}</strong> — {p.rejectRemarks}</div>}
                      {p.processedAt && <div>Processed on: <strong>{new Date(p.processedAt).toLocaleDateString('en-IN')}</strong></div>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:10000 }}>
          <div style={{ background:'#fff', borderRadius:10, width:460, overflow:'hidden',
            boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ background: actionModal.action==='reject'?'#DC3545':
              actionModal.action==='process'?'#28A745':'#714B67',
              padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 }}>
                {actionModal.action==='submit' ?'📤 Submit for Approval':
                 actionModal.action==='approve'?'✅ Approve Increment Policy':
                 actionModal.action==='reject' ?'❌ Reject Policy':
                 '🚀 Process Increments'}
              </h3>
              <span onClick={()=>{setActionModal(null);setRemarks('')}}
                style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ fontSize:13, color:'#1C1C1C', marginBottom:12 }}>
                <strong>{actionModal.policy.policyNo}</strong> — {actionModal.policy.name}
              </div>
              {actionModal.action==='process' && (
                <div style={{ background:'#FFF3CD', padding:'10px 12px', borderRadius:6,
                  fontSize:12, color:'#856404', marginBottom:12 }}>
                  ⚠️ This will update all employee CTCs immediately.
                  Revision history will be saved. This cannot be undone.
                </div>
              )}
              <label style={lbl}>Remarks {actionModal.action==='reject'?'*':''}</label>
              <textarea value={remarks} onChange={e=>setRemarks(e.target.value)}
                style={{ ...inp, minHeight:80, resize:'vertical' }}
                placeholder={actionModal.action==='reject'?'Reason for rejection...'
                  :'Optional remarks...'} />
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
              display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
              <button onClick={()=>{setActionModal(null);setRemarks('')}}
                style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
                  border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13, cursor:'pointer' }}>
                Cancel</button>
              <button onClick={doAction}
                style={{ padding:'8px 24px', border:'none', borderRadius:6,
                  fontSize:13, fontWeight:700, cursor:'pointer', color:'#fff',
                  background: actionModal.action==='reject'?'#DC3545':
                    actionModal.action==='process'?'#28A745':'#714B67' }}>
                {actionModal.action==='submit' ?'📤 Submit':
                 actionModal.action==='approve'?'✅ Approve':
                 actionModal.action==='reject' ?'❌ Reject':
                 '🚀 Process Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <PolicyForm policy={editPolicy} grades={grades}
          onSave={()=>{setShowForm(false);setEditPolicy(null);fetchPolicies()}}
          onCancel={()=>{setShowForm(false);setEditPolicy(null)}} />
      )}
    </div>
  )
}
