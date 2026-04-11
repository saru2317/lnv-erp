import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block',
  marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }

const CAT_CONFIG = {
  EARNING:       { bg:'#D4EDDA', text:'#155724', label:'Earning',       icon:'💰' },
  DEDUCTION:     { bg:'#F8D7DA', text:'#721C24', label:'Deduction',     icon:'➖' },
  EMPLOYER_COST: { bg:'#D1ECF1', text:'#0C5460', label:'Employer Cost', icon:'🏛️' },
}
const CALC_LABELS = {
  PERCENT_OF:'% of Base', FIXED:'Fixed Amount', BALANCING:'Balancing Figure',
  FORMULA:'Formula', MANUAL:'Manual Entry', SLAB:'Slab (Auto)'
}

const fmt = n => n != null ? Number(n).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 }) : '—'
const fmtPct = n => n != null ? (Number(n)*100).toFixed(2)+'%' : '—'

// ── Component Form ─────────────────────────────────────────
function ComponentForm({ item, onSave, onCancel }) {
  const isEdit = !!item?.id
  const [form, setForm] = useState(item || {
    code:'', name:'', category:'EARNING', subCategory:'ALLOWANCE',
    calcType:'FIXED', calcBase:'', calcValue:'', calcFormula:'',
    isTaxable:true, isPFApplicable:false, pfCap:'', annualBasis:'MONTHLY',
    sortOrder:'', description:''
  })
  const [saving, setSaving] = useState(false)
  const F = f => ({ value:form[f]??'', onChange:e=>setForm(p=>({...p,[f]:e.target.value})),
    style:inp, onFocus:e=>e.target.style.borderColor='#714B67', onBlur:e=>e.target.style.borderColor='#E0D5E0' })
  const Toggle = ({ field, label }) => (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div onClick={()=>setForm(p=>({...p,[field]:!p[field]}))}
        style={{ width:40, height:22, borderRadius:11, cursor:'pointer', position:'relative',
          background:form[field]?'#714B67':'#CCC', transition:'background .2s' }}>
        <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff',
          position:'absolute', top:3, left:form[field]?21:3, transition:'left .2s' }} />
      </div>
      <span style={{ fontSize:12, color:form[field]?'#714B67':'#6C757D' }}>{label}</span>
    </div>
  )
  const save = async () => {
    if (!form.code||!form.name) return toast.error('Code and Name required!')
    setSaving(true)
    try {
      const url    = isEdit?`${BASE_URL}/pay-component/components/${item.id}`:`${BASE_URL}/pay-component/components`
      const method = isEdit?'PATCH':'POST'
      const res    = await fetch(url,{method,headers:authHdrs(),body:JSON.stringify(form)})
      const d      = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(isEdit?'Updated!':'Component created!')
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:620, maxHeight:'90vh',
        overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px', display:'flex',
          justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 }}>
            {isEdit?`Edit — ${item.code}`:'+ New Pay Component'}</h3>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20, overflowY:'auto', display:'flex', flexDirection:'column', gap:12 }}>
          {item?.isSystem && (
            <div style={{ background:'#FFF3CD', padding:'8px 12px', borderRadius:6, fontSize:11,
              color:'#856404', border:'1px solid #FFEEBA' }}>
              🔒 System component — Code and Calc Type are locked. Only Value and Description editable.
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12 }}>
            <div><label style={lbl}>Code *</label>
              <input {...F('code')} placeholder="MEAL_ALL" disabled={isEdit}
                style={{ ...inp, fontFamily:'DM Mono,monospace' }} /></div>
            <div><label style={lbl}>Name *</label>
              <input {...F('name')} placeholder="Meal Allowance" /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Category</label>
              <select {...F('category')} disabled={item?.isSystem} style={{ ...inp, cursor:'pointer' }}>
                <option value="EARNING">💰 Earning</option>
                <option value="DEDUCTION">➖ Deduction</option>
                <option value="EMPLOYER_COST">🏛️ Employer Cost</option>
              </select>
            </div>
            <div><label style={lbl}>Sub Category</label>
              <select {...F('subCategory')} style={{ ...inp, cursor:'pointer' }}>
                {['ALLOWANCE','REIMBURSEMENT','STATUTORY','BENEFIT','WELFARE','CONTRACTOR'].map(o=>
                  <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Calculation Type</label>
              <select {...F('calcType')} disabled={item?.isSystem} style={{ ...inp, cursor:'pointer' }}>
                {Object.entries(CALC_LABELS).map(([k,v])=>
                  <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            {['PERCENT_OF','FORMULA'].includes(form.calcType) && (
              <div><label style={lbl}>Calculate Based On</label>
                <select {...F('calcBase')} style={{ ...inp, cursor:'pointer' }}>
                  {['GROSS','BASIC','NET','CTC','ANNUAL_INCOME'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            )}
          </div>
          {form.calcType==='FORMULA' && (
            <div><label style={lbl}>Formula</label>
              <input {...F('calcFormula')} placeholder="e.g. BASIC/12 or BASIC*0.0481"
                style={{ ...inp, fontFamily:'DM Mono,monospace' }} /></div>
          )}
          {['PERCENT_OF','FIXED'].includes(form.calcType) && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={lbl}>
                {form.calcType==='PERCENT_OF' ? 'Percentage (e.g. 0.50 = 50%)' : 'Fixed Amount (₹)'}
              </label>
                <input {...F('calcValue')} type="number" step="0.0001" placeholder={form.calcType==='PERCENT_OF'?'0.50':'1600'} /></div>
              {form.calcType==='PERCENT_OF' && (
                <div><label style={lbl}>PF Wage Cap (₹) — optional</label>
                  <input {...F('pfCap')} type="number" placeholder="15000 (for PF components)" /></div>
              )}
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Taxable?</label>
              <Toggle field="isTaxable" label={form.isTaxable?'Yes — Taxable':'No — Exempt'} /></div>
            <div><label style={lbl}>PF Applicable?</label>
              <Toggle field="isPFApplicable" label={form.isPFApplicable?'Yes':'No'} /></div>
            <div><label style={lbl}>Sort Order</label>
              <input {...F('sortOrder')} type="number" placeholder="99" /></div>
          </div>
          <div><label style={lbl}>Description / Notes</label>
            <textarea {...F('description')} style={{ ...inp, minHeight:60, resize:'vertical' }}
              placeholder="Notes about this component, tax section, etc." /></div>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
          <button onClick={onCancel} style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
            border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13, cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding:'8px 24px', background:saving?'#9E7D96':'#714B67',
              color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {saving?'⏳ Saving...':'💾 Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CTC Calculator ─────────────────────────────────────────
function CTCCalculator({ onClose }) {
  const [gross,   setGross]   = useState('')
  const [state,   setState]   = useState('Tamil Nadu')
  const [result,  setResult]  = useState(null)
  const [comps,   setComps]   = useState([])
  const [loading, setLoading] = useState(false)

  const calculate = async () => {
    if (!gross) return toast.error('Enter Gross Amount')
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/pay-component/calculate`,
        { method:'POST', headers:authHdrs(), body:JSON.stringify({ grossAmount:gross, state }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.data)
      setComps(data.components||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }

  const Section = ({ title, color, rows }) => (
    <div style={{ marginBottom:12 }}>
      <div style={{ background:color, padding:'6px 12px', fontSize:11, fontWeight:700,
        color:'#fff', borderRadius:'6px 6px 0 0' }}>{title}</div>
      <table style={{ width:'100%', borderCollapse:'collapse',
        border:'1px solid #E0D5E0', borderTop:'none', borderRadius:'0 0 6px 6px', overflow:'hidden' }}>
        <tbody>
          {rows.map(([label, value, sub], i) => value !== undefined && (
            <tr key={i} style={{ borderBottom:'1px solid #F0EEF0',
              background:i%2===0?'#fff':'#FDFBFD' }}>
              <td style={{ padding:'7px 12px', fontSize:12, color:'#495057' }}>{label}</td>
              {sub && <td style={{ padding:'7px 8px', fontSize:11, color:'#6C757D', textAlign:'center' }}>{sub}</td>}
              <td style={{ padding:'7px 12px', fontSize:12, fontWeight:600,
                textAlign:'right', fontFamily:'DM Mono,monospace', color:'#1C1C1C' }}>
                ₹{fmt(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const earningComps  = comps.filter(c=>c.category==='EARNING')
  const deductComps   = comps.filter(c=>c.category==='DEDUCTION')
  const employerComps = comps.filter(c=>c.category==='EMPLOYER_COST')

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:'80%', maxWidth:800,
        maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.35)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px', display:'flex',
          justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 }}>
            🧮 CTC Calculator — Live Preview</h3>
          <span onClick={onClose} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:'14px 20px', background:'#FAF8FA', borderBottom:'1px solid #E0D5E0',
          display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, alignItems:'flex-end' }}>
          <div>
            <label style={lbl}>Gross Salary (₹/Month) *</label>
            <input value={gross} onChange={e=>setGross(e.target.value)} type="number"
              style={inp} placeholder="e.g. 69450"
              onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
          </div>
          <div>
            <label style={lbl}>State (for Professional Tax)</label>
            <select value={state} onChange={e=>setState(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {['Tamil Nadu','Karnataka','Maharashtra','Andhra Pradesh','Telangana'].map(s=>
                <option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={calculate} disabled={loading}
            style={{ padding:'9px 24px', background:loading?'#9E7D96':'#714B67',
              color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {loading?'⏳...':'🧮 Calculate'}
          </button>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:20 }}>
          {!result ? (
            <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
              Enter Gross Amount and click Calculate to see full CTC breakup
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {/* Left Column */}
              <div>
                <Section title="💰 EARNINGS (Gross)" color="#28A745" rows={
                  earningComps.map(c => [c.name, result.vals[c.code],
                    c.calcType==='PERCENT_OF' ? fmtPct(c.calcValue)+' of '+c.calcBase :
                    c.calcType==='FORMULA' ? c.calcFormula :
                    c.calcType==='FIXED' ? 'Fixed' : c.calcType
                  ])
                } />
                <div style={{ background:'#D4EDDA', padding:'8px 12px', borderRadius:6,
                  display:'flex', justifyContent:'space-between', marginBottom:16,
                  border:'1px solid #C3E6CB' }}>
                  <span style={{ fontWeight:700, color:'#155724' }}>GROSS TOTAL (A)</span>
                  <span style={{ fontWeight:800, fontFamily:'DM Mono,monospace', color:'#155724', fontSize:14 }}>
                    ₹{fmt(result.earnings)}</span>
                </div>

                <Section title="➖ EMPLOYEE DEDUCTIONS" color="#DC3545" rows={[
                  ...deductComps.map(c => [c.name, result.vals[c.code],
                    c.calcType==='PERCENT_OF' ? fmtPct(c.calcValue) : 'Slab']),
                  ['Professional Tax', result.vals['PT'], 'Slab — '+state]
                ]} />
                <div style={{ background:'#D4EDDA', padding:'8px 12px', borderRadius:6,
                  display:'flex', justifyContent:'space-between', marginBottom:16,
                  border:'2px solid #28A745' }}>
                  <span style={{ fontWeight:700, color:'#155724', fontSize:14 }}>🏠 NET TAKE HOME</span>
                  <span style={{ fontWeight:800, fontFamily:'DM Mono,monospace', color:'#155724', fontSize:16 }}>
                    ₹{fmt(result.netTakeHome)}</span>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <Section title="🏛️ EMPLOYER COST (B)" color="#0C5460" rows={
                  employerComps.map(c => [c.name, result.vals[c.code],
                    c.calcType==='PERCENT_OF' ? fmtPct(c.calcValue)+' of '+c.calcBase :
                    c.calcType==='FORMULA' ? c.calcFormula : 'Fixed'
                  ])
                } />
                <div style={{ background:'#D1ECF1', padding:'8px 12px', borderRadius:6,
                  display:'flex', justifyContent:'space-between', marginBottom:16,
                  border:'1px solid #BEE5EB' }}>
                  <span style={{ fontWeight:700, color:'#0C5460' }}>EMPLOYER COST SUB TOTAL (B)</span>
                  <span style={{ fontWeight:800, fontFamily:'DM Mono,monospace', color:'#0C5460', fontSize:14 }}>
                    ₹{fmt(result.empCost)}</span>
                </div>

                {/* CTC Summary */}
                <div style={{ background:'#714B67', borderRadius:8, padding:16, color:'#fff' }}>
                  <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase',
                    letterSpacing:.5, marginBottom:12, opacity:.8 }}>CTC SUMMARY</div>
                  {[
                    ['Gross (A)',         result.earnings,     '#D4EDDA'],
                    ['+ Employer Cost (B)',result.empCost,     '#D1ECF1'],
                    ['= CTC / Month',     result.ctcMonthly,  '#FFF3CD'],
                    ['= CTC / Year',      result.ctcAnnual,   '#FFF3CD'],
                  ].map(([label, val, bg]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center', padding:'6px 10px', marginBottom:6,
                      background:bg, borderRadius:6 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'#1C1C1C' }}>{label}</span>
                      <span style={{ fontSize:14, fontWeight:800, fontFamily:'DM Mono,monospace',
                        color:'#714B67' }}>₹{fmt(val)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:'1px solid rgba(255,255,255,.3)', paddingTop:10, marginTop:4 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>🏠 Net Take Home</span>
                      <span style={{ fontSize:16, fontWeight:800, fontFamily:'DM Mono,monospace',
                        color:'#D4EDDA' }}>₹{fmt(result.netTakeHome)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── PT SLAB PANEL ──────────────────────────────────────────
function PTSlabs({ onClose }) {
  const [slabs,   setSlabs]   = useState([])
  const [states,  setStates]  = useState([])
  const [selState,setSelState]= useState('Tamil Nadu')
  const [adding,  setAdding]  = useState(false)
  const [form,    setForm]    = useState({ fromAmount:'', toAmount:'', ptMonthly:'' })
  const [loading, setLoading] = useState(false)

  const fetchSlabs = async () => {
    const res  = await fetch(`${BASE_URL}/pay-component/pt-slabs`, { headers:authHdrs() })
    const data = await res.json()
    if (res.ok) {
      setSlabs(data.data||[])
      setStates([...new Set((data.data||[]).map(s=>s.state))])
    }
  }
  useEffect(()=>{ fetchSlabs() }, [])

  const filtered = slabs.filter(s=>s.state===selState)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:620,
        overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px', display:'flex',
          justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 }}>
            🏛️ Professional Tax Slabs</h3>
          <span onClick={onClose} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20 }}>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            {states.map(s => (
              <button key={s} onClick={()=>setSelState(s)}
                style={{ padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:600,
                  cursor:'pointer', border:'1px solid #E0D5E0',
                  background:selState===s?'#714B67':'#fff',
                  color:selState===s?'#fff':'#6C757D' }}>{s}</button>
            ))}
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:16 }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Gross From (₹)','Gross To (₹)','PT / Month (₹)','PT / Year (₹)'].map(h=>(
                  <th key={h} style={{ padding:'8px 12px', fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'right', textTransform:'uppercase', letterSpacing:.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s,i) => (
                <tr key={s.id} style={{ borderBottom:'1px solid #F0EEF0',
                  background:i%2===0?'#fff':'#FDFBFD' }}>
                  <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:'DM Mono,monospace', fontSize:12 }}>₹{fmt(s.fromAmount)}</td>
                  <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:'DM Mono,monospace', fontSize:12 }}>{s.toAmount?'₹'+fmt(s.toAmount):'No Limit'}</td>
                  <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:'DM Mono,monospace', fontSize:12, fontWeight:700, color:'#DC3545' }}>₹{fmt(s.ptMonthly)}</td>
                  <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:'DM Mono,monospace', fontSize:12, color:'#714B67' }}>₹{fmt(s.ptAnnual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background:'#FFF3CD', padding:'8px 12px', borderRadius:6,
            fontSize:11, color:'#856404', border:'1px solid #FFEEBA' }}>
            💡 PT slabs pre-loaded for TN, Karnataka, Maharashtra. Admin can add/edit slabs
            for their state. System auto-picks correct slab every payroll run.
          </div>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end', background:'#F8F7FA' }}>
          <button onClick={onClose} style={{ padding:'8px 20px', background:'#714B67',
            color:'#fff', border:'none', borderRadius:6, fontSize:13, cursor:'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────
export default function PayComponentMaster() {
  const [tab,       setTab]      = useState('components')
  const [comps,     setComps]    = useState([])
  const [loading,   setLoading]  = useState(true)
  const [showForm,  setShowForm] = useState(false)
  const [editComp,  setEditComp] = useState(null)
  const [showCalc,  setShowCalc] = useState(false)
  const [showPT,    setShowPT]   = useState(false)
  const [catFilter, setCatFilter]= useState('ALL')

  const fetchComps = useCallback(async () => {
    try {
      setLoading(true)
      const res  = await fetch(`${BASE_URL}/pay-component/components`, { headers:authHdrs() })
      const data = await res.json()
      if (res.ok) setComps(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchComps() }, [])

  const deleteComp = async id => {
    if (!confirm('Delete this component?')) return
    const res = await fetch(`${BASE_URL}/pay-component/components/${id}`,{method:'DELETE',headers:authHdrs()})
    const d   = await res.json()
    if (!res.ok) return toast.error(d.error)
    toast.success('Deleted!'); fetchComps()
  }

  const filtered = comps.filter(c => catFilter==='ALL' || c.category===catFilter)
  const byCategory = cat => filtered.filter(c=>c.category===cat)

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            Pay Component Master
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            Define all earnings, deductions & employer costs — system auto-calculates CTC
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setShowPT(true)}
            style={{ padding:'8px 14px', background:'#fff', color:'#714B67',
              border:'1.5px solid #714B67', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>
            🏛️ PT Slabs</button>
          <button onClick={()=>setShowCalc(true)}
            style={{ padding:'8px 14px', background:'#0C5460', color:'#fff',
              border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>
            🧮 CTC Calculator</button>
          <button onClick={()=>{setEditComp(null);setShowForm(true)}}
            style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
              border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            + New Component</button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Components', value:comps.length,                                     color:'#714B67', bg:'#EDE0EA' },
          { label:'Earnings',         value:comps.filter(c=>c.category==='EARNING').length,    color:'#155724', bg:'#D4EDDA' },
          { label:'Deductions',       value:comps.filter(c=>c.category==='DEDUCTION').length,  color:'#721C24', bg:'#F8D7DA' },
          { label:'Employer Costs',   value:comps.filter(c=>c.category==='EMPLOYER_COST').length, color:'#0C5460', bg:'#D1ECF1' },
        ].map(k=>(
          <div key={k.label} style={{ background:k.bg, borderRadius:8, padding:'12px 16px', border:`1px solid ${k.color}22` }}>
            <div style={{ fontSize:11, color:k.color, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color, fontFamily:'Syne,sans-serif' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[['ALL','All'],['EARNING','💰 Earnings'],['DEDUCTION','➖ Deductions'],['EMPLOYER_COST','🏛️ Employer Costs']].map(([v,l])=>(
          <button key={v} onClick={()=>setCatFilter(v)}
            style={{ padding:'6px 14px', borderRadius:20, fontSize:11, fontWeight:600,
              cursor:'pointer', border:'1px solid #E0D5E0',
              background:catFilter===v?'#714B67':'#fff',
              color:catFilter===v?'#fff':'#6C757D' }}>{l}</button>
        ))}
      </div>

      {/* Components Table */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
      ) : (
        ['EARNING','DEDUCTION','EMPLOYER_COST'].map(cat => {
          const rows = byCategory(cat)
          if (rows.length===0) return null
          const cc = CAT_CONFIG[cat]
          return (
            <div key={cat} style={{ marginBottom:20, border:'1px solid #E0D5E0',
              borderRadius:8, overflow:'hidden' }}>
              <div style={{ padding:'10px 16px', background:cc.bg, display:'flex',
                justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:700, fontSize:13, color:cc.text }}>
                  {cc.icon} {cc.label} Components ({rows.length})
                </span>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead style={{ background:'#F8F4F8' }}>
                  <tr style={{ borderBottom:'1px solid #E0D5E0' }}>
                    {['Code','Component Name','Calc Type','Base','Value / Formula','Taxable','System','Actions'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px', fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c,i)=>(
                    <tr key={c.id} style={{ borderBottom:'1px solid #F0EEF0',
                      background:i%2===0?'#fff':'#FDFBFD' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                      <td style={{ padding:'9px 12px', fontFamily:'DM Mono,monospace',
                        fontWeight:700, color:'#714B67', fontSize:12 }}>{c.code}</td>
                      <td style={{ padding:'9px 12px', fontWeight:600, fontSize:13 }}>
                        {c.name}
                        {c.description && (
                          <div style={{ fontSize:10, color:'#6C757D', fontWeight:400 }}>{c.description}</div>
                        )}
                      </td>
                      <td style={{ padding:'9px 12px', fontSize:11 }}>
                        <span style={{ padding:'2px 8px', borderRadius:10, fontWeight:600,
                          background:'#EDE0EA', color:'#714B67' }}>
                          {CALC_LABELS[c.calcType]||c.calcType}
                        </span>
                      </td>
                      <td style={{ padding:'9px 12px', fontSize:12, color:'#6C757D' }}>
                        {c.calcBase||'—'}</td>
                      <td style={{ padding:'9px 12px', fontFamily:'DM Mono,monospace', fontSize:12 }}>
                        {c.calcType==='PERCENT_OF' ? fmtPct(c.calcValue) :
                         c.calcType==='FIXED'      ? '₹'+fmt(c.calcValue) :
                         c.calcType==='FORMULA'    ? c.calcFormula :
                         c.calcType==='SLAB'       ? 'Auto Slab' : '—'}
                      </td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600,
                          background:c.isTaxable?'#F8D7DA':'#D4EDDA',
                          color:c.isTaxable?'#721C24':'#155724' }}>
                          {c.isTaxable?'Taxable':'Exempt'}
                        </span>
                      </td>
                      <td style={{ padding:'9px 12px' }}>
                        {c.isSystem && <span style={{ padding:'2px 8px', borderRadius:10,
                          fontSize:10, fontWeight:600, background:'#EDE0EA', color:'#714B67' }}>
                          🔒 System</span>}
                      </td>
                      <td style={{ padding:'9px 12px' }}>
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={()=>{setEditComp(c);setShowForm(true)}}
                            style={{ padding:'3px 10px', background:'#714B67', color:'#fff',
                              border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>Edit</button>
                          {!c.isSystem && (
                            <button onClick={()=>deleteComp(c.id)}
                              style={{ padding:'3px 8px', background:'#fff', color:'#DC3545',
                                border:'1px solid #DC3545', borderRadius:4, fontSize:11, cursor:'pointer' }}>×</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })
      )}

      {showForm && <ComponentForm item={editComp}
        onSave={()=>{setShowForm(false);setEditComp(null);fetchComps()}}
        onCancel={()=>{setShowForm(false);setEditComp(null)}} />}
      {showCalc && <CTCCalculator onClose={()=>setShowCalc(false)} />}
      {showPT   && <PTSlabs onClose={()=>setShowPT(false)} />}
    </div>
  )
}
