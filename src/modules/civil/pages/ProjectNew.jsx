import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })

// ── Styles — same as all LNV ERP modules ──
const inp  = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl  = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block',
  marginBottom:3, textTransform:'uppercase', letterSpacing:'0.5px' }
const sec  = { background:'#fff', border:'1px solid #E8E0E8', borderRadius:8,
  marginBottom:14, overflow:'hidden' }
const secH = (color='#6E2C00') => ({ background:`linear-gradient(135deg,${color},${color}CC)`,
  color:'#fff', padding:'9px 16px', fontSize:12, fontWeight:700,
  display:'flex', alignItems:'center', gap:8 })
const secB = { padding:'16px' }
const g2   = { display:'grid', gridTemplateColumns:'1fr 1fr',             gap:14, marginBottom:12 }
const g3   = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr',         gap:14, marginBottom:12 }
const g4   = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr',     gap:14, marginBottom:12 }
const g5   = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:14, marginBottom:12 }

const STATES = ['Tamil Nadu','Karnataka','Kerala','Andhra Pradesh','Telangana',
  'Maharashtra','Gujarat','Rajasthan','Delhi','Uttar Pradesh','West Bengal',
  'Madhya Pradesh','Punjab','Haryana','Odisha','Bihar','Goa']

const PROJECT_TYPES = ['Building Construction','Road / Infrastructure','Interior Works',
  'Renovation / Repair','Industrial Building','Commercial Complex',
  'Residential Complex','Bridge / Flyover','Water / Drainage Work','Landscaping']

const today = () => new Date().toISOString().split('T')[0]

const F = ({ label, children, span }) => (
  <div style={span?{gridColumn:`1 / span ${span}`}:{}}>
    <label style={lbl}>{label}</label>
    {children}
  </div>
)

export default function ProjectNew() {
  const nav  = useNavigate()
  const [saving,    setSaving]    = useState(false)
  const [mode,      setMode]      = useState('')          // '' | 'WITH_EST' | 'WITHOUT_EST'
  const [estimates, setEstimates] = useState([])
  const [selEst,    setSelEst]    = useState('')
  const [estData,   setEstData]   = useState(null)        // loaded estimate + boq
  const [estLoading,setEstLoading]= useState(false)
  const [boqItems,  setBOQItems]  = useState([])          // auto-generated BOQ from estimate

  const loadEstimates = async () => {
    try {
      const r = await fetch(`${BASE}/civil-ext/estimates`, { headers:{ Authorization:`Bearer ${tok()}` } })
      const d = await r.json()
      setEstimates(d.data||[])
    } catch {}
  }

  const loadEstimate = async (id) => {
    if (!id) { setEstData(null); setBOQItems([]); return }
    setEstLoading(true)
    try {
      const r = await fetch(`${BASE}/civil-ext/estimates/${id}/boq`, { headers:{ Authorization:`Bearer ${tok()}` } })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      const est = d.data.estimate
      // Auto-fill form from estimate
      setForm(f=>({
        ...f,
        projectName:   est.clientName + ' — ' + est.projectType,
        projectType:   est.projectType||'Building Construction',
        clientName:    est.clientName,
        clientPhone:   est.clientPhone||'',
        clientEmail:   est.clientEmail||'',
        siteLocation:  est.projectLocation||'',
        contractValue: String(Math.round(est.grandTotal||est.totalCost)),
      }))
      setEstData(d.data)
      setBOQItems(d.data.boqItems||[])
      toast.success(`✅ Estimate ${est.estimateNo} loaded — ${d.data.boqItems?.length} BOQ items ready`)
    } catch { toast.error('Failed to load estimate') }
    finally { setEstLoading(false) }
  }

  const [form,   setForm]   = useState({
    // Project
    projectName:'', projectType:'Building Construction',
    startDate:'', targetDate:'', notes:'',
    // Client
    clientName:'', clientContact:'', clientPhone:'',
    clientEmail:'', clientGstin:'', clientAddress:'',
    // Site
    siteLocation:'', siteAddress:'', city:'',
    state:'Tamil Nadu', pincode:'', siteArea:'',
    // Team
    pm:'', supervisor:'', supervisorPhone:'',
    structuralEngineer:'', architect:'', mainContractor:'',
    // Finance
    contractValue:'', advancePaid:'', retentionPct:'10',
    paymentTerms:'RA Bill based (Progress payment)',
    loanInvolved:'NO', bankName:'',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const fmtC = n => n ? '₹' + Number(n).toLocaleString('en-IN') : ''

  const save = async () => {
    if (!form.projectName.trim()) return toast.error('Project name required')
    if (!form.clientName.trim())  return toast.error('Client name required')
    if (!form.contractValue)      return toast.error('Contract value required')
    if (mode==='WITH_EST' && !selEst) return toast.error('Please select an estimation')
    setSaving(true)
    try {
      // Step 1: Create project
      const r = await fetch(`${BASE}/civil/projects`, {
        method:'POST', headers:hdr(),
        body:JSON.stringify({
          ...form,
          estimateId: selEst ? parseInt(selEst) : undefined,
        })
      })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      const projectId = d.data.id

      // Step 2: If estimate used, create BOQ from estimate breakdown
      if (mode==='WITH_EST' && boqItems.length > 0) {
        const boqR = await fetch(`${BASE}/civil/boq/${projectId}`, {
          method:'POST', headers:hdr(),
          body:JSON.stringify({ items: boqItems })
        })
        const boqD = await boqR.json()
        toast.success(`✅ ${d.data.projectCode} created with ${boqItems.length} BOQ items from estimate!`)
      } else {
        toast.success(`✅ ${d.data.projectCode} created!`)
      }
      nav(`/civil/projects/${projectId}`)
    } catch { toast.error('Failed to create project') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ background:'#F8F5F8', minHeight:'100vh', fontFamily:'DM Sans,sans-serif' }}>

      {/* ── Page Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>nav('/civil/projects')}
            style={{ padding:'6px 14px', background:'#fff', border:'1px solid #ddd',
              borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:600, color:'#555' }}>
            ← Back
          </button>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#6E2C00' }}>🏗️ New Construction Project</div>
            <div style={{ fontSize:11, color:'#888' }}>Civil → Projects → New</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>nav('/civil/projects')}
            style={{ padding:'7px 18px', background:'#fff', border:'1px solid #ddd',
              borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:600, color:'#555' }}>
            Discard
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding:'7px 22px', background:'#6E2C00', color:'#fff',
              border:'none', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:700,
              opacity:saving?0.6:1 }}>
            {saving ? '⏳ Saving...' : '💾 Save Project'}
          </button>
        </div>
      </div>

      {/* ── MODE SELECTION ── */}
      {!mode && (
        <div style={{background:'#fff',border:'2px solid #E8E0E8',borderRadius:12,
          padding:32,marginBottom:20,textAlign:'center',boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
          <div style={{fontSize:20,marginBottom:8}}>🏗️</div>
          <div style={{fontSize:16,fontWeight:800,color:'#6E2C00',marginBottom:6}}>
            How do you want to create this project?
          </div>
          <div style={{fontSize:12,color:'#888',marginBottom:24}}>
            Choose whether this project was pre-estimated or is a direct entry
          </div>
          <div style={{display:'flex',gap:16,justifyContent:'center'}}>
            <div onClick={()=>{setMode('WITH_EST');loadEstimates()}}
              style={{width:280,padding:24,border:'2px solid #E8D5C4',borderRadius:10,
                cursor:'pointer',background:'#FDF2E9',textAlign:'left'}}
              onMouseEnter={e=>{e.currentTarget.style.border='2px solid #6E2C00'}}
              onMouseLeave={e=>{e.currentTarget.style.border='2px solid #E8D5C4'}}>
              <div style={{fontSize:32,marginBottom:10}}>📊</div>
              <div style={{fontSize:14,fontWeight:800,color:'#6E2C00',marginBottom:6}}>With Estimation</div>
              <div style={{fontSize:11,color:'#666',lineHeight:1.6}}>
                Customer already has an approved cost estimation. BOQ will be auto-generated from it.
                <br/><br/>
                <strong style={{color:'#6E2C00'}}>✅ Estimation vs Actual tracking enabled automatically</strong>
              </div>
            </div>
            <div onClick={()=>setMode('WITHOUT_EST')}
              style={{width:280,padding:24,border:'2px solid #D5E8F0',borderRadius:10,
                cursor:'pointer',background:'#EBF5FB',textAlign:'left'}}
              onMouseEnter={e=>{e.currentTarget.style.border='2px solid #1A5276'}}
              onMouseLeave={e=>{e.currentTarget.style.border='2px solid #D5E8F0'}}>
              <div style={{fontSize:32,marginBottom:10}}>📝</div>
              <div style={{fontSize:14,fontWeight:800,color:'#1A5276',marginBottom:6}}>Without Estimation</div>
              <div style={{fontSize:11,color:'#666',lineHeight:1.6}}>
                Direct project entry without prior estimation. BOQ can be added manually later.
                <br/><br/>
                <strong style={{color:'#888'}}>⚠️ Manual BOQ entry required for Est vs Actual</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ESTIMATION SELECTOR ── */}
      {mode==='WITH_EST' && (
        <div style={{background:'#fff',border:'2px solid #6E2C00',borderRadius:10,padding:16,marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:800,color:'#6E2C00'}}>📊 Select Customer Estimation</div>
            <button onClick={()=>{setMode('');setSelEst('');setEstData(null);setBOQItems([])}}
              style={{padding:'4px 10px',background:'#f0f0f0',border:'none',borderRadius:4,cursor:'pointer',fontSize:11}}>
              ← Change Mode
            </button>
          </div>
          <select value={selEst} onChange={e=>{setSelEst(e.target.value);loadEstimate(e.target.value)}}
            style={{padding:'9px 12px',border:'1.5px solid #DDD',borderRadius:6,fontSize:13,outline:'none',width:'100%',marginBottom:10}}>
            <option value=''>-- Select estimation --</option>
            {estimates.map(e=>(
              <option key={e.id} value={e.id}>
                {e.estimateNo} — {e.clientName} | {e.projectLocation||'—'} | ₹{Number(e.grandTotal||e.totalCost||0).toLocaleString('en-IN')}
              </option>
            ))}
          </select>
          {estLoading && <div style={{color:'#888',fontSize:12}}>⏳ Loading estimate...</div>}
          {estData && (
            <div style={{background:'#F8F5F8',borderRadius:8,padding:14}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:10}}>
                {[
                  ['Client',    estData.estimate.clientName],
                  ['Location',  estData.estimate.projectLocation||'—'],
                  ['Area',      `${estData.estimate.builtupAreaSqft} Sqft`],
                  ['Rate/Sqft', '₹'+Number(estData.estimate.effectiveRate).toLocaleString('en-IN')],
                  ['Total',     '₹'+Number(estData.estimate.grandTotal||estData.estimate.totalCost).toLocaleString('en-IN')],
                ].map(([l,v])=>(
                  <div key={l} style={{textAlign:'center',background:'#fff',borderRadius:6,padding:'7px 10px'}}>
                    <div style={{fontSize:9,color:'#888',marginBottom:2}}>{l}</div>
                    <div style={{fontSize:11,fontWeight:700,color:'#6E2C00'}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,fontWeight:700,color:'#555',marginBottom:6}}>📐 Auto-generated BOQ ({boqItems.length} activities):</div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {boqItems.map(b=>(
                  <span key={b.slNo} style={{padding:'2px 8px',background:'#6E2C00',color:'#fff',borderRadius:10,fontSize:10}}>{b.activity}</span>
                ))}
              </div>
              <div style={{marginTop:8,fontSize:11,color:'#1E8449',fontWeight:600}}>✅ Form auto-filled. Review and save.</div>
            </div>
          )}
        </div>
      )}

      {mode==='WITHOUT_EST' && (
        <div style={{background:'#EBF5FB',border:'1px solid #AED6F1',borderRadius:8,
          padding:'10px 16px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:12,color:'#1A5276',fontWeight:600}}>📝 Direct Entry Mode — Fill in project details manually</div>
          <button onClick={()=>setMode('')}
            style={{padding:'4px 10px',background:'#fff',border:'1px solid #AED6F1',borderRadius:4,cursor:'pointer',fontSize:11,color:'#1A5276'}}>
            ← Change Mode
          </button>
        </div>
      )}

      {/* ── FORM — show only after mode selected ── */}
      {mode && (<>

      {/* ── Two Column Layout ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:14, alignItems:'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div>

          {/* Section 1 — Project Info */}
          <div style={sec}>
            <div style={secH()}>🏗️ Project Information</div>
            <div style={secB}>
              <div style={g2}>
                <F label="Project Name *">
                  <input style={inp} defaultValue={form.projectName}
                    onBlur={set('projectName')} placeholder='e.g. New Production Block Phase 2' />
                </F>
                <F label="Project Type">
                  <select style={inp} value={form.projectType} onChange={set('projectType')}>
                    {PROJECT_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </F>
              </div>
              <div style={g3}>
                <F label="Start Date">
                  <input type='date' style={inp} value={form.startDate} onChange={set('startDate')} />
                </F>
                <F label="Target Completion">
                  <input type='date' style={inp} value={form.targetDate} onChange={set('targetDate')} />
                </F>
                <F label="Project Status">
                  <select style={inp} value={form.status||'PLANNING'} onChange={set('status')}>
                    <option value='PLANNING'>Planning</option>
                    <option value='ACTIVE'>Active</option>
                  </select>
                </F>
              </div>
              <F label="Scope / Description">
                <textarea style={{ ...inp, resize:'none' }} rows={2}
                  defaultValue={form.notes} onBlur={set('notes')}
                  placeholder='Brief scope of work...' />
              </F>
            </div>
          </div>

          {/* Section 2 — Client Info */}
          <div style={sec}>
            <div style={secH('#1A5276')}>🤝 Client / Owner Information</div>
            <div style={secB}>
              <div style={g3}>
                <F label="Client / Owner Name *">
                  <input style={inp} defaultValue={form.clientName}
                    onBlur={set('clientName')} placeholder='Rajesh Builders Pvt Ltd' />
                </F>
                <F label="Contact Person">
                  <input style={inp} defaultValue={form.clientContact}
                    onBlur={set('clientContact')} placeholder='Contact name' />
                </F>
                <F label="Phone">
                  <input style={inp} defaultValue={form.clientPhone}
                    onBlur={set('clientPhone')} placeholder='+91 99999 99999' />
                </F>
              </div>
              <div style={g3}>
                <F label="Email">
                  <input style={inp} type='email' defaultValue={form.clientEmail}
                    onBlur={set('clientEmail')} placeholder='client@email.com' />
                </F>
                <F label="GSTIN">
                  <input style={{ ...inp, textTransform:'uppercase', fontFamily:'monospace' }}
                    defaultValue={form.clientGstin} onBlur={set('clientGstin')}
                    placeholder='33AAAA00000A1Z5' />
                </F>
                <F label="Address">
                  <input style={inp} defaultValue={form.clientAddress}
                    onBlur={set('clientAddress')} placeholder='Client office address' />
                </F>
              </div>
            </div>
          </div>

          {/* Section 3 — Site Info */}
          <div style={sec}>
            <div style={secH('#117A65')}>📍 Site Information</div>
            <div style={secB}>
              <div style={g3}>
                <F label="Site Name / Location">
                  <input style={inp} defaultValue={form.siteLocation}
                    onBlur={set('siteLocation')} placeholder='e.g. Survey No.45, Saibaba Colony' />
                </F>
                <F label="City">
                  <input style={inp} defaultValue={form.city}
                    onBlur={set('city')} placeholder='Coimbatore' />
                </F>
                <F label="Pincode">
                  <input style={inp} defaultValue={form.pincode}
                    onBlur={set('pincode')} placeholder='641001' />
                </F>
              </div>
              <div style={g3}>
                <F label="State">
                  <select style={inp} value={form.state} onChange={set('state')}>
                    {STATES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Site Area (Sq.Ft / Acres)">
                  <input style={inp} defaultValue={form.siteArea}
                    onBlur={set('siteArea')} placeholder='e.g. 5000 Sq.Ft' />
                </F>
                <F label="Site Address">
                  <input style={inp} defaultValue={form.siteAddress}
                    onBlur={set('siteAddress')} placeholder='Full site address' />
                </F>
              </div>
            </div>
          </div>

          {/* Section 4 — Team */}
          <div style={sec}>
            <div style={secH('#D35400')}>👷 Project Team</div>
            <div style={secB}>
              <div style={g3}>
                <F label="Project Manager">
                  <input style={inp} defaultValue={form.pm}
                    onBlur={set('pm')} placeholder='PM name' />
                </F>
                <F label="Site Supervisor">
                  <input style={inp} defaultValue={form.supervisor}
                    onBlur={set('supervisor')} placeholder='Supervisor name' />
                </F>
                <F label="Supervisor Phone">
                  <input style={inp} defaultValue={form.supervisorPhone}
                    onBlur={set('supervisorPhone')} placeholder='+91 99999 99999' />
                </F>
              </div>
              <div style={g3}>
                <F label="Structural Engineer">
                  <input style={inp} defaultValue={form.structuralEngineer}
                    onBlur={set('structuralEngineer')} placeholder='Engineer name' />
                </F>
                <F label="Architect">
                  <input style={inp} defaultValue={form.architect}
                    onBlur={set('architect')} placeholder='Architect name' />
                </F>
                <F label="Main Contractor">
                  <input style={inp} defaultValue={form.mainContractor}
                    onBlur={set('mainContractor')} placeholder='Contractor if outsourced' />
                </F>
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>

          {/* Financial Summary Card */}
          {form.contractValue && (
            <div style={{ ...sec, border:'1px solid #6E2C00' }}>
              <div style={secH()}>💰 Financial Summary</div>
              <div style={secB}>
                {[
                  ['Contract Value',  fmtC(form.contractValue),  '#1E8449'],
                  ['Advance Received',fmtC(form.advancePaid||0), '#D35400'],
                  ['Retention %',     `${form.retentionPct||10}%`,'#714B67'],
                  ['Net Balance',     fmtC(Number(form.contractValue||0)-Number(form.advancePaid||0)), '#1A5276'],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between',
                    padding:'8px 0', borderBottom:'1px solid #F5F0F5' }}>
                    <div style={{ fontSize:12, color:'#777' }}>{l}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Finance Section */}
          <div style={sec}>
            <div style={secH('#714B67')}>💰 Financial Terms</div>
            <div style={secB}>
              <F label="Contract Value (₹) *">
                <input type='number' style={inp} defaultValue={form.contractValue}
                  onBlur={set('contractValue')} placeholder='0.00' />
              </F>
              <div style={{ ...g2, marginTop:12 }}>
                <F label="Advance Received (₹)">
                  <input type='number' style={inp} defaultValue={form.advancePaid}
                    onBlur={set('advancePaid')} placeholder='0' />
                </F>
                <F label="Retention %">
                  <input type='number' style={inp} defaultValue={form.retentionPct}
                    onBlur={set('retentionPct')} placeholder='10' />
                </F>
              </div>
              <F label="Payment Terms">
                <select style={inp} value={form.paymentTerms} onChange={set('paymentTerms')}>
                  <option>RA Bill based (Progress payment)</option>
                  <option>Milestone based</option>
                  <option>Monthly payment</option>
                  <option>Lump sum on completion</option>
                  <option>Bank loan disbursement</option>
                </select>
              </F>
              <div style={{ marginTop:12 }}>
                <F label="Bank Loan Involved?">
                  <select style={inp} value={form.loanInvolved} onChange={set('loanInvolved')}>
                    <option value='NO'>No — Direct payment from client</option>
                    <option value='YES'>Yes — Client has bank loan</option>
                    <option value='CONTRACTOR'>Yes — Contractor has bank loan</option>
                  </select>
                </F>
              </div>
              {form.loanInvolved !== 'NO' && (
                <div style={{ marginTop:12 }}>
                  <F label="Bank Name">
                    <input style={inp} defaultValue={form.bankName}
                      onBlur={set('bankName')} placeholder='SBI / HDFC / Canara...' />
                  </F>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div style={{ background:'#FDF2E9', borderRadius:8, padding:14,
            border:'1px solid #E8D5C4', fontSize:12 }}>
            <div style={{ fontWeight:700, color:'#6E2C00', marginBottom:8 }}>💡 Tips</div>
            <div style={{ color:'#6E2C00', lineHeight:1.7 }}>
              • Enter BOQ after creating project<br/>
              • Daily progress updated by supervisor via DPR<br/>
              • RA Bills auto-calculated from BOQ progress<br/>
              • Retention released at project completion
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom Save Bar ── */}
      <div style={{ position:'sticky', bottom:0, background:'#fff',
        borderTop:'1px solid #E8E0E8', padding:'12px 20px', margin:'0 -20px -16px',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        boxShadow:'0 -2px 8px rgba(0,0,0,.06)' }}>
        <div style={{ fontSize:12, color:'#888' }}>
          {form.projectName && <span style={{ color:'#6E2C00', fontWeight:700 }}>🏗️ {form.projectName}</span>}
          {form.clientName  && <span style={{ color:'#555' }}> · {form.clientName}</span>}
          {form.contractValue && <span style={{ color:'#1E8449', fontWeight:700 }}> · {fmtC(form.contractValue)}</span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>nav('/civil/projects')}
            style={{ padding:'7px 18px', background:'#fff', border:'1px solid #ddd',
              borderRadius:5, cursor:'pointer', fontSize:12, color:'#555', fontWeight:600 }}>
            Discard
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding:'7px 24px', background:'#6E2C00', color:'#fff',
              border:'none', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:700,
              opacity:saving?0.6:1 }}>
            {saving ? '⏳ Creating...' : '💾 Create Project'}
          </button>
        </div>
      </div>
      </>)}
    </div>
  )
}
