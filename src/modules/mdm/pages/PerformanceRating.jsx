import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block', marginBottom:4,
  textTransform:'uppercase', letterSpacing:.4 }

const STAR_COLORS = { 5:'#F59E0B', 4:'#22C55E', 3:'#3B82F6', 2:'#F97316', 1:'#EF4444' }
const RATING_LABELS = { 5:'Outstanding', 4:'Exceeds Expectations', 3:'Meets Expectations', 2:'Below Expectations', 1:'Poor' }
const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN')

function StarSelector({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  return (
    <div style={{ display:'flex', gap:4 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          style={{ fontSize:28, cursor:'pointer', transition:'transform .1s',
            color: s <= active ? STAR_COLORS[active] || '#F59E0B' : '#E0D5E0',
            transform: s <= active ? 'scale(1.1)' : 'scale(1)' }}>★</span>
      ))}
      {value > 0 && (
        <span style={{ fontSize:12, fontWeight:700, color:STAR_COLORS[value],
          alignSelf:'center', marginLeft:6 }}>{RATING_LABELS[value]}</span>
      )}
    </div>
  )
}

export default function PerformanceRating() {
  const [policies,  setPolicies]  = useState([])
  const [selPolicy, setSelPolicy] = useState(null)
  const [employees, setEmployees] = useState([])
  const [ratings,   setRatings]   = useState({}) // empCode → {rating, remarks}
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [search,    setSearch]    = useState('')
  const [deptFilter,setDeptFilter]= useState('All')
  const [gradeFilter,setGradeFilter]=useState('All')
  const [ratedBy,   setRatedBy]   = useState('')

  // Fetch policies that need performance ratings
  useEffect(() => {
    fetch(`${BASE_URL}/increment`, { headers:authHdrs() })
      .then(r => r.json())
      .then(d => {
        const active = (d.data||[]).filter(p => ['PERFORMANCE','HYBRID'].includes(p.model))
        setPolicies(active)
        if (active.length > 0) setSelPolicy(active[0])
      })
  }, [])

  // Fetch employees + existing ratings when policy selected
  useEffect(() => {
    if (!selPolicy) return
    setLoading(true)
    Promise.all([
      fetch(`${BASE_URL}/pay-component/employee-ctc`, { headers:authHdrs() }),
      fetch(`${BASE_URL}/increment/${selPolicy.id}/ratings`, { headers:authHdrs() })
        .catch(() => ({ json: () => ({ data:[] }) }))
    ]).then(async ([empRes, ratRes]) => {
      const empData = await empRes.json()
      const ratData = await ratRes.json().catch(() => ({ data:[] }))
      setEmployees(empData.data || [])
      // Pre-fill existing ratings
      const existingMap = {}
      ;(ratData.data||[]).forEach(r => {
        existingMap[r.empCode] = { rating: r.rating, remarks: r.remarks||'' }
      })
      setRatings(existingMap)
    }).finally(() => setLoading(false))
  }, [selPolicy])

  const setRating = (empCode, field, val) =>
    setRatings(prev => ({ ...prev, [empCode]: { ...(prev[empCode]||{}), [field]: val } }))

  const saveAll = async () => {
    if (!selPolicy) return toast.error('Select a policy first!')
    if (!ratedBy)   return toast.error('Enter HOD / Rater name!')
    const entries = Object.entries(ratings).filter(([,v]) => v.rating > 0)
    if (entries.length === 0) return toast.error('Rate at least one employee!')
    setSaving(true)
    try {
      const payload = entries.map(([empCode, v]) => {
        const emp = employees.find(e => e.empCode === empCode)
        return { empCode, empName: emp?.empName||empCode,
          gradeCode: emp?.gradeCode||null, department: emp?.department||null,
          fyYear: selPolicy.fyYear, rating: v.rating,
          ratingLabel: RATING_LABELS[v.rating], ratingBy: ratedBy, remarks: v.remarks||'' }
      })
      const res  = await fetch(`${BASE_URL}/increment/${selPolicy.id}/ratings`,
        { method:'POST', headers:authHdrs(), body:JSON.stringify({ ratings: payload }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${entries.length} ratings saved!`)
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  // Filters
  const depts  = ['All', ...new Set(employees.map(e=>e.department).filter(Boolean))]
  const grades = ['All', ...new Set(employees.map(e=>e.gradeCode).filter(Boolean))]
  const filtered = employees.filter(e =>
    (deptFilter==='All'  || e.department===deptFilter) &&
    (gradeFilter==='All' || e.gradeCode===gradeFilter) &&
    (e.empCode?.toLowerCase().includes(search.toLowerCase()) ||
     e.empName?.toLowerCase().includes(search.toLowerCase()))
  )

  const rated   = Object.values(ratings).filter(r=>r.rating>0).length
  const unrated = filtered.length - Object.keys(ratings).filter(k=>
    filtered.find(e=>e.empCode===k) && ratings[k]?.rating>0).length

  // Rating distribution
  const dist = [5,4,3,2,1].map(r => ({
    r, count: Object.values(ratings).filter(v=>v.rating===r).length
  }))

  if (policies.length === 0) return (
    <div style={{ padding:40, textAlign:'center', color:'#6C757D',
      background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0', margin:20 }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⭐</div>
      <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>No Active Increment Policies</div>
      <div style={{ fontSize:12 }}>Create a HYBRID or PERFORMANCE increment policy first,
        then come here to enter performance ratings.</div>
    </div>
  )

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            Performance Rating Entry
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            HOD rates each employee — drives increment calculation
          </p>
        </div>
        <button onClick={saveAll} disabled={saving}
          style={{ padding:'8px 20px', background:saving?'#9E7D96':'#714B67',
            color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          {saving ? '⏳ Saving...' : `💾 Save ${rated} Ratings`}
        </button>
      </div>

      {/* Policy selector + Rater */}
      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
        padding:14, marginBottom:16, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        <div>
          <label style={lbl}>Increment Policy *</label>
          <select value={selPolicy?.id||''} style={{ ...inp, cursor:'pointer' }}
            onChange={e=>setSelPolicy(policies.find(p=>p.id===parseInt(e.target.value)))}>
            {policies.map(p=>(
              <option key={p.id} value={p.id}>{p.policyNo} — {p.name} ({p.model})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Rated By (HOD Name) *</label>
          <input value={ratedBy} onChange={e=>setRatedBy(e.target.value)} style={inp}
            placeholder="e.g. Rajesh Kumar (Production HOD)"
            onFocus={e=>e.target.style.borderColor='#714B67'}
            onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
        </div>
        <div>
          <label style={lbl}>Progress</label>
          <div style={{ display:'flex', alignItems:'center', gap:10, height:38 }}>
            <div style={{ flex:1, background:'#F0EEF0', borderRadius:10, height:8, overflow:'hidden' }}>
              <div style={{ width: employees.length>0?`${(rated/employees.length*100).toFixed(0)}%`:'0%',
                height:'100%', background:'#714B67', transition:'width .3s', borderRadius:10 }} />
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:'#714B67', whiteSpace:'nowrap' }}>
              {rated} / {employees.length} rated
            </span>
          </div>
        </div>
      </div>

      {/* KPI + Distribution */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        {dist.map(d=>(
          <div key={d.r} style={{ background:'#fff', borderRadius:8, padding:'10px 14px',
            border:`1px solid ${STAR_COLORS[d.r]}33`, textAlign:'center' }}>
            <div style={{ fontSize:18, marginBottom:4 }}>
              {Array.from({length:d.r},(_,i)=><span key={i} style={{ color:STAR_COLORS[d.r] }}>★</span>)}
            </div>
            <div style={{ fontSize:11, color:'#6C757D', marginBottom:2 }}>{RATING_LABELS[d.r]}</div>
            <div style={{ fontSize:24, fontWeight:800, color:STAR_COLORS[d.r],
              fontFamily:'Syne,sans-serif' }}>{d.count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <input placeholder="🔍 Search employee..." value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{ ...inp, width:220 }}
          onFocus={e=>e.target.style.borderColor='#714B67'}
          onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
        <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}
          style={{ ...inp, width:160, cursor:'pointer' }}>
          {depts.map(d=><option key={d}>{d}</option>)}
        </select>
        <select value={gradeFilter} onChange={e=>setGradeFilter(e.target.value)}
          style={{ ...inp, width:120, cursor:'pointer' }}>
          {grades.map(g=><option key={g}>{g}</option>)}
        </select>
        {unrated > 0 && (
          <span style={{ fontSize:12, color:'#856404', fontWeight:600,
            background:'#FFF3CD', padding:'4px 10px', borderRadius:20,
            border:'1px solid #FFEEBA' }}>
            ⚠️ {unrated} employees not yet rated
          </span>
        )}
        <span style={{ fontSize:11, color:'#6C757D', marginLeft:'auto' }}>
          {filtered.length} employees
        </span>
      </div>

      {/* Employee Rating Table */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading employees...</div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden',
          boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0, zIndex:10, background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['#','Emp Code','Employee Name','Grade','Dept','Current CTC',
                  'Performance Rating ⭐','Remarks'].map(h=>(
                  <th key={h} style={{ padding:'10px 12px', fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.4,
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp,i) => {
                const r = ratings[emp.empCode] || {}
                const isRated = r.rating > 0
                return (
                  <tr key={emp.empCode} style={{ borderBottom:'1px solid #F0EEF0',
                    background: isRated ? `${STAR_COLORS[r.rating]}11` : i%2===0?'#fff':'#FDFBFD',
                    transition:'background .2s' }}>
                    <td style={{ padding:'10px 12px', fontSize:11, color:'#6C757D',
                      textAlign:'center' }}>{i+1}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace',
                      fontWeight:700, color:'#714B67', fontSize:12 }}>{emp.empCode}</td>
                    <td style={{ padding:'10px 12px', fontWeight:600, fontSize:13 }}>
                      {emp.empName}</td>
                    <td style={{ padding:'10px 12px' }}>
                      {emp.gradeCode && (
                        <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11,
                          fontWeight:600, background:'#EDE0EA', color:'#714B67' }}>
                          {emp.gradeCode}
                        </span>
                      )}
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:12, color:'#6C757D' }}>
                      {emp.department||'—'}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace',
                      fontSize:12, fontWeight:600 }}>
                      {fmt(emp.ctcMonthly)}/mo</td>
                    <td style={{ padding:'8px 12px', minWidth:280 }}>
                      <StarSelector
                        value={r.rating||0}
                        onChange={v => setRating(emp.empCode,'rating',v)} />
                    </td>
                    <td style={{ padding:'6px 8px', minWidth:180 }}>
                      <input value={r.remarks||''} placeholder="HOD remarks..."
                        onChange={e=>setRating(emp.empCode,'remarks',e.target.value)}
                        style={{ ...inp, fontSize:11 }}
                        onFocus={e=>e.target.style.borderColor='#714B67'}
                        onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                    </td>
                  </tr>
                )
              })}
              {filtered.length===0 && (
                <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
                  No employees found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
