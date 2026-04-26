import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })

const inp  = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl  = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }
const ta   = { ...inp, resize:'vertical' }

const INIT_8D = {
  reportNo:      '',
  title:         '',
  customer:      '',
  partName:      '',
  partNo:        '',
  reportDate:    new Date().toISOString().split('T')[0],
  ncrRef:        '',
  severity:      'Major',
  // D1 — Team
  d1_champion:   '',
  d1_leader:     '',
  d1_members:    '',
  d1_date:       new Date().toISOString().split('T')[0],
  // D2 — Problem Description
  d2_is:         '',
  d2_isnot:      '',
  d2_5w2h:       '',
  d2_statement:  '',
  // D3 — Interim Containment
  d3_action:     '',
  d3_responsible:'',
  d3_date:       '',
  d3_verified:   false,
  // D4 — Root Cause
  d4_escape:     '',
  d4_occurrence: '',
  d4_systemic:   '',
  d4_method:     '5-Why',
  d4_whys:       ['','','','',''],
  // D5 — Permanent Corrective Action
  d5_occurrence_action: '',
  d5_escape_action:     '',
  d5_validation:        '',
  d5_date:              '',
  // D6 — Implement & Validate
  d6_actions:    '',
  d6_evidence:   '',
  d6_date:       '',
  d6_verified:   false,
  // D7 — Prevent Recurrence
  d7_lesson:     '',
  d7_standards:  '',
  d7_systems:    '',
  d7_training:   '',
  // D8 — Closure
  d8_team_recognition: '',
  d8_customer_sign:    '',
  d8_close_date:       '',
  d8_closed:           false,
  status:        'D1',
}

const D_STEPS = [
  { id:'D1', label:'D1 — Team',           icon:'👥', color:'#EDE0EA', text:'#714B67' },
  { id:'D2', label:'D2 — Problem',        icon:'🔍', color:'#FFF3CD', text:'#856404' },
  { id:'D3', label:'D3 — Containment',    icon:'🛡️', color:'#D4EDDA', text:'#155724' },
  { id:'D4', label:'D4 — Root Cause',     icon:'🌳', color:'#F8D7DA', text:'#721C24' },
  { id:'D5', label:'D5 — Corrective Act.', icon:'🔧', color:'#D1ECF1', text:'#0C5460' },
  { id:'D6', label:'D6 — Implement',      icon:'✅', color:'#D4EDDA', text:'#155724' },
  { id:'D7', label:'D7 — Prevent',        icon:'🔄', color:'#E2E3E5', text:'#383d41' },
  { id:'D8', label:'D8 — Closure',        icon:'🏆', color:'#CCE5FF', text:'#004085' },
]

const SHdr = ({ step, title, icon, color, text }) => (
  <div style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`2px solid ${text}44` }}>
    <span style={{ color: text, fontSize:13, fontWeight:800, fontFamily:'Syne,sans-serif' }}>
      {icon} {step} — {title}
    </span>
    <span style={{ background: text, color:'#fff', padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>
      {step}
    </span>
  </div>
)

export default function EightDReport() {
  const nav       = useNavigate()
  const { id }    = useParams()
  const [form,    setForm]    = useState(INIT_8D)
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [tab,     setTab]     = useState('D1')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rN = await fetch(`${BASE_URL}/qm/8d/next-no`, { headers: hdr2() })
      const dN = await rN.json()
      setForm(f => ({ ...f, reportNo: dN.reportNo || '8D-AUTO' }))
      if (id) {
        const rE = await fetch(`${BASE_URL}/qm/8d/${id}`, { headers: hdr2() })
        const dE = await rE.json()
        if (dE.data) setForm({ ...INIT_8D, ...dE.data })
      }
    } catch { /* use defaults */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const fSet  = k => e => setForm(f => ({ ...f, [k]: typeof e === 'object' ? e.target.value : e }))
  const fBool = k => e => setForm(f => ({ ...f, [k]: e.target.checked }))
  const updWhy = (i, v) => setForm(f => ({ ...f, d4_whys: f.d4_whys.map((w, idx) => idx !== i ? w : v) }))

  const completedSteps = D_STEPS.filter(s => {
    const d = s.id.toLowerCase()
    return form[`${d}_verified`] || (d === 'd8' && form.d8_closed) || (d === 'd7' && form.d7_lesson) || (d === 'd5' && form.d5_occurrence_action)
  }).length

  const save = async () => {
    if (!form.title) return toast.error('Report title is required')
    setSaving(true)
    try {
      const url    = id ? `${BASE_URL}/qm/8d/${id}` : `${BASE_URL}/qm/8d`
      const method = id ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: hdr(), body: JSON.stringify(form) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(id ? '8D Report updated' : `8D Report ${data.data?.reportNo || form.reportNo} created!`)
      nav('/qm/8d')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>Loading...</div>

  const Field = ({ label, k, rows, ph, type='text' }) => (
    <div>
      <label style={lbl}>{label}</label>
      {rows ? <textarea style={ta} rows={rows} value={form[k]||''} onChange={fSet(k)} placeholder={ph} />
             : <input type={type} style={inp} value={form[k]||''} onChange={fSet(k)} placeholder={ph} />}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          8D Problem Solving Report
          <small style={{ fontFamily:'DM Mono,monospace', color:'#714B67', marginLeft:8 }}>{form.reportNo}</small>
        </div>
        <div className="fi-lv-actions">
          <span style={{ fontSize:11, color:'#6C757D', marginRight:8 }}>
            {completedSteps}/{D_STEPS.length} disciplines complete
          </span>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/8d')}>Back</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving ? 'Saving...' : id ? 'Update 8D' : 'Save 8D Report'}
          </button>
        </div>
      </div>

      {/* Report Header */}
      <div style={{ border:'1px solid #E0D5E0', borderRadius:8, padding:16, background:'#fff', marginBottom:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:12 }}>
          <Field label="Report Title *" k="title" ph="e.g. Ring Yarn Tensile Failure — Customer ABC" />
          <Field label="Customer"       k="customer"   ph="Customer name" />
          <Field label="Part Name"      k="partName"   ph="e.g. Ring Yarn 30s" />
          <Field label="Part No."       k="partNo"     ph="PY-BH-6001..." />
          <Field label="Report Date"    k="reportDate" type="date" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:12 }}>
          <Field label="NCR Reference" k="ncrRef" ph="NCR-2026-001" />
          <div>
            <label style={lbl}>Severity</label>
            <select style={{ ...inp, cursor:'pointer' }} value={form.severity} onChange={fSet('severity')}>
              {['Critical','Major','Minor'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select style={{ ...inp, cursor:'pointer' }} value={form.status} onChange={fSet('status')}>
              {D_STEPS.map(s => <option key={s.id} value={s.id}>{s.id} — {s.label.split('—')[1]?.trim()}</option>)}
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* D-Step tabs */}
      <div style={{ display:'flex', gap:0, overflowX:'auto', borderBottom:'2px solid #E0D5E0', marginBottom:0 }}>
        {D_STEPS.map((s, i) => {
          const isActive = tab === s.id
          return (
            <div key={s.id} onClick={() => setTab(s.id)} style={{
              padding:'8px 14px', cursor:'pointer', whiteSpace:'nowrap', fontSize:11, fontWeight:700,
              background:   isActive ? s.color   : '#fff',
              color:        isActive ? s.text    : '#6C757D',
              borderBottom: isActive ? `3px solid ${s.text}` : '3px solid transparent',
              marginBottom:'-2px',
            }}>
              {s.icon} {s.id}
            </div>
          )
        })}
      </div>

      <div style={{ border:'1px solid #E0D5E0', borderTop:'none', borderRadius:'0 0 8px 8px', background:'#fff', marginBottom:14, overflow:'hidden' }}>

        {/* D1 — Team */}
        {tab === 'D1' && (
          <div>
            <SHdr step="D1" title="Define the Team" icon="👥" color="#EDE0EA" text="#714B67" />
            <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
              <Field label="Champion / Sponsor" k="d1_champion" ph="Senior Manager name" />
              <Field label="Team Leader"         k="d1_leader"   ph="QC Engineer name" />
              <Field label="Team Formation Date" k="d1_date"     type="date" />
              <div></div>
              <div style={{ gridColumn:'1 / -1' }}>
                <Field label="Team Members (name, role — comma separated)" k="d1_members" rows={2}
                  ph="Rajesh Q (QC), Kavitha M (Production), Suresh P (Maintenance)..." />
              </div>
            </div>
          </div>
        )}

        {/* D2 — Problem Description */}
        {tab === 'D2' && (
          <div>
            <SHdr step="D2" title="Describe the Problem" icon="🔍" color="#FFF3CD" text="#856404" />
            <div style={{ padding:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:12 }}>
                <div>
                  <label style={{ ...lbl, color:'#28A745' }}>IS (Problem IS present when...)</label>
                  <textarea style={ta} rows={3} value={form.d2_is} onChange={fSet('d2_is')}
                    placeholder="What: Tensile strength below spec&#10;Where: Final Inspection&#10;When: Lot QI-2026-0042&#10;How many: 3 of 5 bobbins" />
                </div>
                <div>
                  <label style={{ ...lbl, color:'#DC3545' }}>IS NOT (Problem is NOT present when...)</label>
                  <textarea style={ta} rows={3} value={form.d2_isnot} onChange={fSet('d2_isnot')}
                    placeholder="What: Not observed in 40s count&#10;Where: Not in incoming QC&#10;When: Not in previous 3 lots" />
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>5W2H Analysis</label>
                <textarea style={ta} rows={3} value={form.d2_5w2h} onChange={fSet('d2_5w2h')}
                  placeholder="Who: Customer ABC reported | What: CSP below 2100 | When: Lot shipped 15 Apr | Where: Ring yarn 30s | Why: Machine vibration | How: Tensometer test | How Many: 3/5 fail" />
              </div>
              <Field label="Problem Statement (summary)" k="d2_statement" rows={2}
                ph="Ring Yarn 30s CSP measured at 1940 vs specification ≥2100 — detected at Final Inspection for Customer ABC" />
            </div>
          </div>
        )}

        {/* D3 — Interim Containment */}
        {tab === 'D3' && (
          <div>
            <SHdr step="D3" title="Interim Containment Action" icon="🛡️" color="#D4EDDA" text="#155724" />
            <div style={{ padding:16 }}>
              <div style={{ background:'#F0FFF4', border:'1px solid #C3E6CB', borderRadius:6, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#155724' }}>
                Immediate actions to protect the customer while root cause is being investigated
              </div>
              <Field label="Containment Action *" k="d3_action" rows={3}
                ph="1. Quarantine all Ring Yarn 30s from affected machine (M-03)&#10;2. 100% inspection of pending shipment lots&#10;3. Notify customer of delay" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                <Field label="Responsible Person" k="d3_responsible" ph="e.g. QC Manager" />
                <Field label="Completion Date"    k="d3_date"        type="date" />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, cursor:'pointer', fontSize:13 }}>
                <input type="checkbox" checked={!!form.d3_verified} onChange={fBool('d3_verified')}
                  style={{ accentColor:'#155724', width:15, height:15 }} />
                <span style={{ color:'#155724', fontWeight:700 }}>Containment Verified &amp; Effective</span>
              </label>
            </div>
          </div>
        )}

        {/* D4 — Root Cause */}
        {tab === 'D4' && (
          <div>
            <SHdr step="D4" title="Root Cause Analysis" icon="🌳" color="#F8D7DA" text="#721C24" />
            <div style={{ padding:16 }}>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>RCA Method</label>
                <select style={{ ...inp, width:'auto', cursor:'pointer' }} value={form.d4_method} onChange={fSet('d4_method')}>
                  {['5-Why','Fishbone (6M)','Fault Tree','FMEA'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              {/* 5-Why chain */}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>5-Why Chain</label>
                {form.d4_whys.map((w, i) => (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:6 }}>
                    <span style={{ width:50, fontFamily:'DM Mono,monospace', fontSize:11, fontWeight:700, color:'#721C24', flexShrink:0 }}>Why {i+1}:</span>
                    <input style={{ ...inp, flex:1 }} value={w} onChange={e => updWhy(i, e.target.value)} placeholder={`Why ${i+1}...`} />
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <Field label="Occurrence Root Cause *" k="d4_occurrence" rows={3}
                  ph="The direct cause that made the defect happen" />
                <Field label="Escape Root Cause *"     k="d4_escape"     rows={3}
                  ph="Why the defect was not detected before leaving" />
                <Field label="Systemic Root Cause"     k="d4_systemic"   rows={3}
                  ph="System / process gap that allowed this to happen" />
              </div>
            </div>
          </div>
        )}

        {/* D5 — Permanent Corrective Action */}
        {tab === 'D5' && (
          <div>
            <SHdr step="D5" title="Choose Permanent Corrective Action" icon="🔧" color="#D1ECF1" text="#0C5460" />
            <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Field label="Corrective Action for Occurrence *" k="d5_occurrence_action" rows={3}
                ph="Action to fix the root cause of occurrence" />
              <Field label="Corrective Action for Escape *"     k="d5_escape_action"     rows={3}
                ph="Action to improve detection / escape prevention" />
              <Field label="Validation Plan"                    k="d5_validation"        rows={3}
                ph="How will you validate the action is effective?" />
              <Field label="Planned Completion Date"            k="d5_date"              type="date" />
            </div>
          </div>
        )}

        {/* D6 — Implement */}
        {tab === 'D6' && (
          <div>
            <SHdr step="D6" title="Implement &amp; Validate Corrective Actions" icon="✅" color="#D4EDDA" text="#155724" />
            <div style={{ padding:16 }}>
              <Field label="Implementation Actions Taken" k="d6_actions"  rows={3} ph="Describe what was actually done..." />
              <div style={{ marginTop:12 }}>
                <Field label="Evidence of Effectiveness"  k="d6_evidence" rows={3} ph="Test results, comparison data, inspection report reference..." />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                <Field label="Completion Date" k="d6_date" type="date" />
                <div></div>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, cursor:'pointer', fontSize:13 }}>
                <input type="checkbox" checked={!!form.d6_verified} onChange={fBool('d6_verified')}
                  style={{ accentColor:'#155724', width:15, height:15 }} />
                <span style={{ color:'#155724', fontWeight:700 }}>Corrective Actions Verified Effective</span>
              </label>
            </div>
          </div>
        )}

        {/* D7 — Prevent Recurrence */}
        {tab === 'D7' && (
          <div>
            <SHdr step="D7" title="Prevent Recurrence — Systemic Actions" icon="🔄" color="#E2E3E5" text="#383d41" />
            <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Field label="Lessons Learned" k="d7_lesson"    rows={3} ph="Key learnings from this problem..." />
              <Field label="Standards / Docs Updated" k="d7_standards" rows={3} ph="SOPs, control plans, inspection sheets updated..." />
              <Field label="Systems / Controls Updated" k="d7_systems" rows={3} ph="PFMEA, Control Plan, poka-yoke added..." />
              <Field label="Training Required" k="d7_training" rows={3} ph="Who needs training on what..." />
            </div>
          </div>
        )}

        {/* D8 — Closure */}
        {tab === 'D8' && (
          <div>
            <SHdr step="D8" title="Congratulate the Team — Report Closure" icon="🏆" color="#CCE5FF" text="#004085" />
            <div style={{ padding:16 }}>
              <div style={{ background:'#CCE5FF', border:'1px solid #B8DAFF', borderRadius:6, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#004085', textAlign:'center', fontWeight:700 }}>
                Before closing: Ensure D1–D7 are all verified and effective.
                Customer should sign off if this was a customer complaint.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="Team Recognition" k="d8_team_recognition" rows={2} ph="Acknowledge team effort and learnings..." />
                <Field label="Customer Sign-off Reference" k="d8_customer_sign" ph="Email ref / signature date..." />
                <Field label="Closure Date" k="d8_close_date" type="date" />
                <div></div>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:16, cursor:'pointer', fontSize:14, fontWeight:700 }}>
                <input type="checkbox" checked={!!form.d8_closed} onChange={fBool('d8_closed')}
                  style={{ accentColor:'#004085', width:18, height:18 }} />
                <span style={{ color:'#004085' }}>8D Report Closed — All disciplines verified complete</span>
              </label>
              {form.d8_closed && (
                <div style={{ marginTop:14, background:'#D4EDDA', border:'2px solid #C3E6CB', borderRadius:8, padding:'16px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:40 }}>🏆</div>
                  <div style={{ fontSize:18, fontWeight:800, color:'#155724', fontFamily:'Syne,sans-serif' }}>8D Report Complete!</div>
                  <div style={{ fontSize:13, color:'#155724', marginTop:4 }}>
                    All 8 disciplines verified. Problem solved and prevented from recurrence.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0 20px' }}>
        {/* D-step progress */}
        <div style={{ display:'flex', gap:4 }}>
          {D_STEPS.map(s => (
            <div key={s.id} onClick={() => setTab(s.id)} style={{
              width:32, height:8, borderRadius:4, cursor:'pointer',
              background: tab === s.id ? s.text : s.color,
              border: `1px solid ${s.text}44`,
            }} title={s.label} />
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-s sd-bsm" onClick={() => { const idx = D_STEPS.findIndex(s=>s.id===tab); if(idx>0) setTab(D_STEPS[idx-1].id) }} disabled={tab==='D1'}>← Prev</button>
          <button className="btn btn-s sd-bsm" onClick={() => { const idx = D_STEPS.findIndex(s=>s.id===tab); if(idx<7) setTab(D_STEPS[idx+1].id) }} disabled={tab==='D8'}>Next →</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving ? 'Saving...' : 'Save 8D Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
