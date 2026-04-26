import React, { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

const EMPTY_WHY = { why: '', answer: '', evidence: '' }
const CATS = ['Machine','Material','Method','Man','Measurement','Environment']  // Ishikawa 6M

const INIT = {
  title: '', problem: '', department: '', date: new Date().toISOString().split('T')[0],
  ncrRef: '', capaRef: '', conductedBy: JSON.parse(localStorage.getItem('lnv_user') || '{}')?.name || 'Admin',
  whys: [
    { ...EMPTY_WHY, why: 'Why 1: Why did this problem occur?' },
    { ...EMPTY_WHY, why: 'Why 2: Why did that happen?' },
    { ...EMPTY_WHY, why: 'Why 3: Why did that happen?' },
    { ...EMPTY_WHY, why: 'Why 4: Why did that happen?' },
    { ...EMPTY_WHY, why: 'Why 5: Why did that happen?' },
  ],
  rootCause: '', immediateAction: '', correctiveAction: '', preventiveAction: '',
  fishbone: {
    Machine:     [], Material:    [], Method:  [],
    Man:         [], Measurement: [], Environment: [],
  }
}

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:13, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:.3 }

const SHdr = ({ title, sub }) => (
  <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)', padding:'8px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
    <span style={{ color:'#fff', fontSize:13, fontWeight:700, fontFamily:'Syne,sans-serif' }}>{title}</span>
    {sub && <span style={{ color:'rgba(255,255,255,.6)', fontSize:11 }}>{sub}</span>}
  </div>
)

export default function WhyWhyAnalysis() {
  const nav = useNavigate()
  const [form,    setForm]   = useState(INIT)
  const [saving,  setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('5why')  // '5why' | 'fishbone'
  const [newCause, setNewCause]   = useState({ cat:'Machine', text:'' })

  const fSet = k => e => setForm(f => ({ ...f, [k]: typeof e === 'object' ? e.target.value : e }))

  const updateWhy = (i, k, v) =>
    setForm(f => ({ ...f, whys: f.whys.map((w, idx) => idx !== i ? w : { ...w, [k]: v }) }))

  const addWhy = () => {
    if (form.whys.length >= 9) return toast.error('Max 9 whys')
    setForm(f => ({ ...f, whys: [...f.whys, { ...EMPTY_WHY, why: `Why ${f.whys.length + 1}:` }] }))
  }
  const delWhy = i => {
    if (form.whys.length <= 3) return toast.error('Minimum 3 whys required')
    setForm(f => ({ ...f, whys: f.whys.filter((_, idx) => idx !== i) }))
  }

  // Fishbone
  const addCause = () => {
    if (!newCause.text.trim()) return toast.error('Enter a cause first')
    setForm(f => ({ ...f, fishbone: { ...f.fishbone, [newCause.cat]: [...(f.fishbone[newCause.cat] || []), newCause.text.trim()] } }))
    setNewCause(c => ({ ...c, text:'' }))
  }
  const delCause = (cat, i) =>
    setForm(f => ({ ...f, fishbone: { ...f.fishbone, [cat]: f.fishbone[cat].filter((_, idx) => idx !== i) } }))

  const save = async () => {
    if (!form.problem)    return toast.error('Problem statement is required')
    if (!form.rootCause)  return toast.error('Root Cause is required')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/qm/why-analysis`, {
        method: 'POST', headers: hdr(), body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success('Why-Why Analysis saved!')
      if (form.capaRef) nav(`/qm/capa/new?ncrRef=${form.ncrRef}`)
      else              nav('/qm/capa')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const CAT_COLORS = { Machine:'#EDE0EA', Material:'#D4EDDA', Method:'#D1ECF1', Man:'#FFF3CD', Measurement:'#F8D7DA', Environment:'#E2E3E5' }
  const CAT_TEXT   = { Machine:'#714B67', Material:'#155724', Method:'#0C5460', Man:'#856404', Measurement:'#721C24', Environment:'#383d41' }

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Why-Why Analysis <small>5-Why &amp; Fishbone (Ishikawa)</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/capa')}>Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving ? 'Saving...' : 'Save Analysis'}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
        <SHdr title="Problem Statement" />
        <div style={{ padding:16, background:'#fff' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Analysis Title</label>
              <input style={inp} value={form.title} onChange={fSet('title')} placeholder="e.g. Ring Yarn Tensile Failure Analysis" />
            </div>
            <div>
              <label style={lbl}>Department</label>
              <input style={inp} value={form.department} onChange={fSet('department')} placeholder="e.g. Production" />
            </div>
            <div>
              <label style={lbl}>NCR Ref</label>
              <input style={inp} value={form.ncrRef} onChange={fSet('ncrRef')} placeholder="NCR-2026-001" />
            </div>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" style={inp} value={form.date} onChange={fSet('date')} />
            </div>
          </div>
          <div>
            <label style={lbl}>Problem Statement *
              <span style={{ fontWeight:400, marginLeft:4, textTransform:'none', fontSize:10, color:'#999' }}>
                (Clear, concise description of the problem)
              </span>
            </label>
            <textarea style={{ ...inp, resize:'vertical' }} rows={2}
              value={form.problem} onChange={fSet('problem')}
              placeholder="e.g. Ring Yarn 30s CSP below spec — 1940 vs min 2100. Detected in Final Inspection, Lot QI-2026-0042" />
          </div>
        </div>
      </div>

      {/* Tab selector */}
      <div style={{ display:'flex', borderBottom:'2px solid #E0D5E0', marginBottom:0 }}>
        {[['5why','5-Why Analysis'],['fishbone','Fishbone (Ishikawa)']].map(([id, label]) => (
          <div key={id} onClick={() => setActiveTab(id)} style={{
            padding:'8px 20px', cursor:'pointer', fontSize:12, fontWeight:700,
            color:      activeTab === id ? '#714B67'   : '#6C757D',
            borderBottom: activeTab === id ? '3px solid #714B67' : '3px solid transparent',
            marginBottom:'-2px', background: activeTab === id ? '#FDF8FC' : 'transparent'
          }}>{label}</div>
        ))}
      </div>

      <div style={{ border:'1px solid #E0D5E0', borderTop:'none', borderRadius:'0 0 8px 8px', background:'#fff', marginBottom:14 }}>

        {/* ── 5 WHY TAB ── */}
        {activeTab === '5why' && (
          <div style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14, alignItems:'center' }}>
              <div style={{ fontSize:12, color:'#6C757D' }}>
                Start with the problem → ask "Why?" repeatedly until root cause found (typically 5 levels)
              </div>
              <button onClick={addWhy} style={{ padding:'4px 12px', background:'#EDE0EA', color:'#714B67', border:'none', borderRadius:4, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                + Add Why
              </button>
            </div>

            {/* Problem box */}
            <div style={{ display:'flex', alignItems:'stretch', marginBottom:8 }}>
              <div style={{ width:4, background:'#DC3545', borderRadius:4, marginRight:12, flexShrink:0 }} />
              <div style={{ flex:1, background:'#FFF5F5', border:'1px solid #F5C6CB', borderRadius:6, padding:'10px 14px' }}>
                <div style={{ fontSize:10, fontWeight:800, color:'#DC3545', textTransform:'uppercase', marginBottom:4 }}>PROBLEM</div>
                <div style={{ fontSize:13, color:'#333' }}>{form.problem || 'Enter problem statement above'}</div>
              </div>
            </div>

            {/* Why chain */}
            {form.whys.map((w, i) => (
              <div key={i} style={{ display:'flex', alignItems:'stretch', marginBottom:8 }}>
                {/* Connector line */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:28, flexShrink:0, marginRight:8 }}>
                  <div style={{ width:2, flex:1, background:'#E0D5E0' }} />
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#714B67', flexShrink:0 }} />
                  <div style={{ width:2, flex:1, background:'#E0D5E0' }} />
                </div>
                <div style={{ flex:1, border:'1.5px solid #E0D5E0', borderRadius:6, overflow:'hidden' }}>
                  <div style={{ background:'#F8F4F8', padding:'6px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <input style={{ background:'transparent', border:'none', outline:'none', fontSize:11, fontWeight:700, color:'#714B67', flex:1 }}
                      value={w.why} onChange={e => updateWhy(i, 'why', e.target.value)} placeholder={`Why ${i+1}:`} />
                    <button onClick={() => delWhy(i)} style={{ background:'none', border:'none', color:'#DC3545', cursor:'pointer', fontSize:14, padding:'0 4px' }}>✕</button>
                  </div>
                  <div style={{ padding:'8px 12px', display:'grid', gridTemplateColumns:'2fr 1fr', gap:8 }}>
                    <div>
                      <label style={{ ...lbl, marginBottom:2 }}>Answer / Finding *</label>
                      <input style={{ ...inp, fontSize:12 }} value={w.answer}
                        onChange={e => updateWhy(i, 'answer', e.target.value)}
                        placeholder="Because..." />
                    </div>
                    <div>
                      <label style={{ ...lbl, marginBottom:2 }}>Evidence / Source</label>
                      <input style={{ ...inp, fontSize:12 }} value={w.evidence}
                        onChange={e => updateWhy(i, 'evidence', e.target.value)}
                        placeholder="Lab report, photo..." />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Root Cause box */}
            <div style={{ display:'flex', alignItems:'stretch', marginTop:4 }}>
              <div style={{ width:4, background:'#28A745', borderRadius:4, marginRight:12, flexShrink:0 }} />
              <div style={{ flex:1, background:'#F0FFF4', border:'2px solid #C3E6CB', borderRadius:6, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:800, color:'#155724', textTransform:'uppercase', marginBottom:6 }}>ROOT CAUSE (Confirmed)</div>
                <textarea style={{ ...inp, background:'transparent', border:'1px solid #C3E6CB', resize:'vertical', fontSize:12 }}
                  rows={2} value={form.rootCause} onChange={fSet('rootCause')}
                  placeholder="Summarize the root cause identified through the why-chain above..." />
              </div>
            </div>
          </div>
        )}

        {/* ── FISHBONE TAB ── */}
        {activeTab === 'fishbone' && (
          <div style={{ padding:20 }}>
            <div style={{ fontSize:12, color:'#6C757D', marginBottom:14 }}>
              Ishikawa Cause &amp; Effect Diagram — categorize causes using the 6M framework
            </div>

            {/* Add cause */}
            <div style={{ display:'flex', gap:10, marginBottom:16, padding:'12px', background:'#F8F4F8', borderRadius:6 }}>
              <div style={{ flex:'0 0 160px' }}>
                <label style={lbl}>Category (6M)</label>
                <select style={{ ...inp, cursor:'pointer' }} value={newCause.cat} onChange={e => setNewCause(c => ({ ...c, cat: e.target.value }))}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex:1 }}>
                <label style={lbl}>Cause / Factor</label>
                <input style={inp} value={newCause.text} onChange={e => setNewCause(c => ({ ...c, text: e.target.value }))}
                  placeholder="e.g. Old machine bearings not replaced" onKeyDown={e => e.key === 'Enter' && addCause()} />
              </div>
              <div style={{ display:'flex', alignItems:'flex-end' }}>
                <button onClick={addCause} style={{ padding:'8px 18px', background:'#714B67', color:'#fff', border:'none', borderRadius:5, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  + Add
                </button>
              </div>
            </div>

            {/* Fishbone diagram */}
            <div style={{ position:'relative', background:'#F8F9FA', borderRadius:8, padding:'20px 20px 20px 40px', minHeight:300 }}>
              {/* Spine */}
              <div style={{ position:'absolute', top:'50%', left:0, right:0, height:3, background:'#714B67', transform:'translateY(-50%)' }} />
              {/* Effect box */}
              <div style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'#714B67', color:'#fff', padding:'8px 14px', borderRadius:6, fontSize:12, fontWeight:700, maxWidth:160, textAlign:'center', zIndex:2 }}>
                {form.problem || 'EFFECT'}
              </div>

              {/* 6M cause groups - 2 rows × 3 cols */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, paddingRight:200 }}>
                {CATS.map(cat => (
                  <div key={cat} style={{ background:'#fff', border:`2px solid ${CAT_COLORS[cat]}`, borderRadius:6, padding:'10px 12px', minHeight:80 }}>
                    <div style={{ fontSize:11, fontWeight:800, color: CAT_TEXT[cat], marginBottom:8,
                      borderBottom:`2px solid ${CAT_COLORS[cat]}`, paddingBottom:4 }}>
                      {cat}
                    </div>
                    {(form.fishbone[cat] || []).length === 0
                      ? <div style={{ fontSize:11, color:'#CCC', fontStyle:'italic' }}>No causes added</div>
                      : (form.fishbone[cat] || []).map((c, i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                          <div style={{ fontSize:11, color:'#333', flex:1 }}>• {c}</div>
                          <button onClick={() => delCause(cat, i)} style={{ background:'none', border:'none', color:'#DC3545', cursor:'pointer', fontSize:12, padding:'0 2px', flexShrink:0 }}>✕</button>
                        </div>
                      ))
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Plan */}
      <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
        <SHdr title="Action Plan" />
        <div style={{ padding:16, background:'#fff', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
          {[
            ['immediateAction',   'Immediate / Containment Action',    'e.g. Quarantine affected lots, stop production'],
            ['correctiveAction',  'Corrective Action (Fix the cause)',  'e.g. Replace bearing, recalibrate machine'],
            ['preventiveAction',  'Preventive Action (Prevent recur.)', 'e.g. Revise PM schedule, add control point'],
          ].map(([key, label, ph]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <textarea style={{ ...inp, resize:'vertical' }} rows={3}
                value={form[key]} onChange={fSet(key)} placeholder={ph} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'8px 0 20px' }}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/capa')}>Cancel</button>
        <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
          {saving ? 'Saving...' : 'Save Analysis'}
        </button>
      </div>
    </div>
  )
}
