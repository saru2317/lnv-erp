import React, { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' })
const user = () => { try { return JSON.parse(atob(tok().split('.')[1])) } catch { return {} } }

const fmtD  = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'
const fmtDT = d => d ? new Date(d).toLocaleString('en-IN',  { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

const MODULES = ['SD','MM','PP','QM','FI','WM','HCM','CRM','AM','PM','Admin','Config','MDM','Home Dashboard']

const SCREENS = {
  SD:  ['Quotation List','New Quotation','Sales Order List','New Sales Order','Invoice List','New Invoice','Invoice View','Invoice Print','Delivery Challan','Payment Receipts','Customer Ledger','e-Invoice','e-Way Bill','SD Reports'],
  MM:  ['Purchase Indent','CS / PCS','Purchase Order','GRN List','GRN New','Vendor Invoice','Vendor Payments','Vendor Ledger'],
  PP:  ['Work Order List','New Work Order','Production Entry','MRP Run','BOM Master','Routing Master','Mould Master','Work Center Board','Capacity Planning','PP Dashboard'],
  QM:  ['Inspection List','New Inspection','NCR List','CAPA List','Customer Complaints','PPAP','Quality Reports'],
  FI:  ['Journal Entry','Day Book','General Ledger','Trial Balance','P&L Report','Balance Sheet','Cash Flow','Budget vs Actual','COGM Report','GSTR-1','GSTR-3B','AR Aging','AP Aging'],
  WM:  ['Stock List','GRN','Goods Issue','Stock Transfer','Stock Adjustment','Physical Inventory','FSN Analysis','Stock Aging','Reorder List','Warehouse Map'],
  HCM: ['Employee List','New Employee','Attendance Register','Leave Management','Payroll Processing','Statutory Reports','Increment Management','Recruitment'],
  CRM: ['Lead List','New Lead','Opportunity Pipeline','Activity Log','CRM Quotations','Competitor Analysis','Sales Targets','CRM Reports','Customer Complaints'],
  AM:  ['Asset Register','New Asset','Depreciation','Asset Issue','Asset Disposal'],
  PM:  ['Machine Register','PM Schedule','Breakdown Register','Calibration','Spare Parts'],
  Admin:  ['LNV Billing','Users','Roles','Support Dashboard'],
  Config: ['Company Profile','Module Settings','Number Series'],
  MDM:    ['Item Master','Customer Master','Vendor Master','BOM','Routing'],
  'Home Dashboard': ['Executive Dashboard','KPI Strip','Sales Trend','Production Summary'],
}

const CATEGORIES = [
  { key:'Bug',              icon:'🐛', label:'Error / Bug',          color:'#C0392B', desc:'Something is not working correctly' },
  { key:'ReportCorrection', icon:'📊', label:'Report Correction',    color:'#D35400', desc:'Existing report needs modification' },
  { key:'NewDevelopment',   icon:'⚡', label:'New Development',      color:'#1A5276', desc:'New feature or enhancement needed' },
  { key:'NewReport',        icon:'📋', label:'New Report',           color:'#117A65', desc:'New report or dashboard needed' },
]

const STATUS_CONFIG = {
  OPEN:              { label:'Open',              color:'#1A5276', bg:'#EBF5FB' },
  ACKNOWLEDGED:      { label:'Acknowledged',      color:'#B8860B', bg:'#FFF8E1' },
  IN_PROGRESS:       { label:'In Progress',       color:'#D35400', bg:'#FEF9E7' },
  ON_HOLD:           { label:'On Hold',           color:'#666666', bg:'#F5F5F5' },
  RESOLVED:          { label:'Resolved',          color:'#1E8449', bg:'#E8F5E9' },
  CUSTOMER_ACCEPTED: { label:'Customer Accepted', color:'#714B67', bg:'#F0EBF0' },
  CLOSED:            { label:'Closed',            color:'#555555', bg:'#EEEEEE' },
  REJECTED:          { label:'Rejected',          color:'#C0392B', bg:'#FDEDEC' },
}

const PRIORITY_CONFIG = {
  LOW:      { label:'Low',      color:'#555555', bg:'#F5F5F5' },
  MEDIUM:   { label:'Medium',   color:'#B8860B', bg:'#FFF8E1' },
  HIGH:     { label:'High',     color:'#D35400', bg:'#FEF9E7' },
  CRITICAL: { label:'Critical', color:'#C0392B', bg:'#FDEDEC' },
}

// ── Styles ──
const S = {
  wrap:   { padding:'20px', background:'#F9F6F8', minHeight:'100vh', fontFamily:'DM Sans,Arial,sans-serif' },
  card:   { background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 6px rgba(113,75,103,.09)', marginBottom:16 },
  btn:    (c='#714B67',w='#fff') => ({ padding:'9px 20px', background:c, color:w, border:'none', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:13, transition:'all .15s' }),
  inp:    { width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:7, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
  label:  { fontSize:12, fontWeight:700, color:'#666', display:'block', marginBottom:5 },
  badge:  (color,bg) => ({ padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:700, color, background:bg }),
}

// ══════════════════════════════════════════
// AI TYPING ANIMATION COMPONENT
// ══════════════════════════════════════════
function AIAnalysisScreen({ category, module, screen, reason, onDone }) {
  const [phase,    setPhase]    = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [dots,     setDots]     = useState('')

  const phases = [
    '🔍 Scanning issue details...',
    '🧠 Analyzing with LNV ERP knowledge base...',
    '⚙️ Checking module configuration...',
    '📊 Evaluating feasibility...',
    '✅ Generating support recommendations...',
  ]

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400)
    return () => clearInterval(dotTimer)
  }, [])

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhase(p => {
        if (p >= phases.length - 1) { clearInterval(phaseTimer); return p }
        return p + 1
      })
    }, 900)

    // Call AI API
    fetch(`${BASE}/support/ai-analyze`, {
      method: 'POST', headers: hdr(),
      body: JSON.stringify({ category, module, screen, reason })
    })
    .then(r => r.json())
    .then(d => {
      setTimeout(() => {
        setAnalysis(d.data)
        clearInterval(phaseTimer)
        setPhase(phases.length - 1)
      }, 4500)
    })
    .catch(() => {
      setTimeout(() => {
        setAnalysis({
          feasibility: 'NeedsReview', severity: 'Medium',
          summary: 'Support request received',
          rootCause: reason,
          aiSuggestion: 'Your request has been received and will be reviewed by our team.',
          leadTime: '2-3 working days',
          immediateAction: 'Our team will contact you within the SLA period.',
          priority: 'MEDIUM',
          teamMessage: `Category: ${category} | Module: ${module} | Screen: ${screen}`
        })
        clearInterval(phaseTimer)
        setPhase(phases.length - 1)
      }, 4500)
    })

    return () => clearInterval(phaseTimer)
  }, [])

  const feasColors = {
    BugConfirmed: '#C0392B', Possible: '#1E8449',
    NotPossible: '#666', NeedsReview: '#B8860B'
  }
  const feasLabels = {
    BugConfirmed: '🐛 Bug Confirmed', Possible: '✅ Feasible',
    NotPossible: '❌ Not Feasible', NeedsReview: '🔍 Needs Review'
  }

  return (
    <div style={{ textAlign:'center', padding:'32px 0' }}>
      {/* AI Robot Animation */}
      <div style={{ fontSize:64, marginBottom:16, animation:'pulse 1s infinite' }}>🤖</div>
      <div style={{ fontSize:18, fontWeight:700, color:'#714B67', marginBottom:8 }}>
        LNV ERP Support AI is analyzing{dots}
      </div>

      {/* Phase steps */}
      <div style={{ maxWidth:440, margin:'20px auto', textAlign:'left' }}>
        {phases.map((p,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0',
            opacity: i > phase ? .3 : 1, transition:'opacity .3s' }}>
            <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
              background: i < phase ? '#1E8449' : i === phase ? '#714B67' : '#ddd',
              color:'#fff', fontSize:11, fontWeight:700 }}>
              {i < phase ? '✓' : i + 1}
            </div>
            <div style={{ fontSize:13, color: i === phase ? '#714B67' : '#555', fontWeight: i === phase ? 700 : 400 }}>
              {p}{i === phase ? dots : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Result */}
      {analysis && (
        <div style={{ maxWidth:600, margin:'24px auto', textAlign:'left' }}>
          <div style={{ background:'#F0EBF0', borderRadius:12, padding:20, border:'2px solid #714B67' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ fontSize:24 }}>🤖</div>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:'#714B67' }}>AI Analysis Complete</div>
                <div style={{ fontSize:12, color:'#888' }}>Powered by Claude AI</div>
              </div>
              <div style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700,
                background: feasColors[analysis.feasibility] || '#666', color:'#fff' }}>
                {feasLabels[analysis.feasibility] || analysis.feasibility}
              </div>
            </div>

            <div style={{ background:'#fff', borderRadius:8, padding:14, marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#666', marginBottom:4 }}>📋 Summary</div>
              <div style={{ fontSize:14, color:'#2C3E50', fontWeight:600 }}>{analysis.summary}</div>
            </div>

            <div style={{ background:'#fff', borderRadius:8, padding:14, marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#666', marginBottom:4 }}>🔍 AI Analysis</div>
              <div style={{ fontSize:13, color:'#2C3E50', lineHeight:1.6 }}>{analysis.aiSuggestion}</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <div style={{ background:'#EBF5FB', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:11, color:'#666', marginBottom:3 }}>⏱ Lead Time</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#1A5276' }}>{analysis.leadTime || '2-3 working days'}</div>
              </div>
              <div style={{ background:'#FEF9E7', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:11, color:'#666', marginBottom:3 }}>🎯 Priority</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#D35400' }}>{analysis.priority || 'MEDIUM'}</div>
              </div>
            </div>

            {analysis.limitReached && (
              <div style={{ background:'#FEF9E7', borderRadius:8, padding:12, marginBottom:10, border:'1px solid #B8860B' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#B8860B' }}>⚠️ AI Analysis Limit Reached</div>
                <div style={{ fontSize:12, color:'#555', marginTop:4 }}>Your monthly AI quota ({usage?.aiLimit||10} tickets) is used. This ticket will be reviewed manually. Basic tickets remaining: {usage?.basicRemaining||0}</div>
              </div>
            )}
            {analysis.immediateAction && (
              <div style={{ background:'#E8F5E9', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:11, color:'#666', marginBottom:3 }}>💡 What you can do now</div>
                <div style={{ fontSize:13, color:'#1E8449' }}>{analysis.immediateAction}</div>
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button onClick={() => onDone(analysis)} style={{ ...S.btn(), flex:1 }}>
              Continue → Fill Contact Details
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
    </div>
  )
}

// ══════════════════════════════════════════
// NEW TICKET WIZARD
// ══════════════════════════════════════════
function NewTicketWizard({ onSave, onCancel }) {
  const [step,      setStep]      = useState(1) // 1=Q1 2=Details 3=AI 4=Contact 5=Preview
  const [form,      setForm]      = useState({
    category:'', module:'', screen:'', reason:'', attachmentUrl:'',
    contactName:'', contactEmail:'', contactPhone:'', bestTime:'Morning',
    clientName:'', clientEmail:'',
  })
  const [aiResult,  setAiResult]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [usage,     setUsage]     = useState(null)
  const formRef = React.useRef(form)
  React.useEffect(() => { formRef.current = form }, [form])

  const co = (() => { try { return JSON.parse(localStorage.getItem('lnv_company') || '{}') } catch { return {} } })()
  const u  = user()

  useEffect(() => {
    const cName = co.name || 'LNV Manufacturing Pvt. Ltd.'
    if (!form.clientName) setForm(f => ({ ...f, clientName: cName, contactEmail: u.email || '', contactName: u.name || '' }))
    // Load usage
    fetch(`${BASE}/support/usage/${encodeURIComponent(cName)}`, { headers: hdr() })
      .then(r=>r.json()).then(d=>setUsage(d.data)).catch(()=>{})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Step 1 — Category
  const Step1 = () => (
    <div>
      {usage && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          <div style={{ background: usage.aiRemaining <= 2 ? '#FDEDEC' : '#E8F5E9', borderRadius:8, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:11, color:'#888' }}>🤖 AI Analysis Tickets</div>
              <div style={{ fontSize:15, fontWeight:700, color: usage.aiRemaining <= 2 ? '#C0392B' : '#1E8449' }}>
                {usage.aiRemaining} remaining
              </div>
            </div>
            <div style={{ fontSize:11, color:'#888', textAlign:'right' }}>
              {usage.aiTickets}/{usage.aiLimit}<br/>used
            </div>
          </div>
          <div style={{ background: usage.basicRemaining <= 5 ? '#FEF9E7' : '#EBF5FB', borderRadius:8, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:11, color:'#888' }}>📋 Basic Tickets</div>
              <div style={{ fontSize:15, fontWeight:700, color: usage.basicRemaining <= 5 ? '#D35400' : '#1A5276' }}>
                {usage.basicRemaining} remaining
              </div>
            </div>
            <div style={{ fontSize:11, color:'#888', textAlign:'right' }}>
              {usage.basicTickets}/{usage.basicLimit}<br/>used
            </div>
          </div>
        </div>
      )}
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:32, marginBottom:8 }}>🎫</div>
        <div style={{ fontSize:18, fontWeight:700, color:'#714B67' }}>What type of support do you need?</div>
        <div style={{ fontSize:13, color:'#888', marginTop:4 }}>Select the category that best describes your request</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {CATEGORIES.map(cat => (
          <div key={cat.key} onClick={() => { set('category', cat.key); setStep(2) }}
            style={{ border:`2px solid ${form.category===cat.key ? cat.color : '#eee'}`,
              borderRadius:12, padding:20, cursor:'pointer', transition:'all .15s',
              background: form.category===cat.key ? cat.color+'11' : '#fff',
              ':hover': { borderColor: cat.color }
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor=cat.color}
            onMouseLeave={e => e.currentTarget.style.borderColor=form.category===cat.key?cat.color:'#eee'}>
            <div style={{ fontSize:32, marginBottom:8 }}>{cat.icon}</div>
            <div style={{ fontSize:15, fontWeight:700, color:cat.color, marginBottom:4 }}>{cat.label}</div>
            <div style={{ fontSize:12, color:'#777' }}>{cat.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )

  // Step 2 — Module / Screen / Details
  const Step2 = () => {
    const cat = CATEGORIES.find(c => c.key === form.category)
    return (
      <div>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:28 }}>{cat?.icon}</div>
          <div style={{ fontSize:17, fontWeight:700, color:'#714B67', marginTop:6 }}>{cat?.label}</div>
          <div style={{ fontSize:13, color:'#888' }}>Tell us more about the issue</div>
        </div>

        <div style={{ display:'grid', gap:16 }}>
          <div>
            <label style={S.label}>Which Module? *</label>
            <select value={form.module} onChange={e => { set('module',e.target.value); set('screen','') }}
              style={S.inp}>
              <option value=''>— Select Module —</option>
              {MODULES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {form.module && (
            <div>
              <label style={S.label}>Which Screen / Page? *</label>
              <select value={form.screen} onChange={e => set('screen',e.target.value)} style={S.inp}>
                <option value=''>— Select Screen —</option>
                {(SCREENS[form.module]||[]).map(s => <option key={s}>{s}</option>)}
                <option value='Other'>Other (describe below)</option>
              </select>
            </div>
          )}

          <div>
            <label style={S.label}>
              {form.category === 'Bug'              && 'Describe the error / bug *'}
              {form.category === 'NewDevelopment'   && 'Describe the new feature requirement *'}
              {form.category === 'ReportCorrection' && 'Describe what needs to change in the report *'}
              {form.category === 'NewReport'        && 'Describe the new report requirement *'}
            </label>
            <textarea
              key="reason-input"
              defaultValue={form.reason}
              onBlur={e => set('reason', e.target.value)}
              onChange={e => { formRef.current = {...formRef.current, reason: e.target.value} }}
              rows={5}
              placeholder={
                form.category === 'Bug'              ? 'e.g. When I click Save on New Invoice, it shows error — describe step by step what happened' :
                form.category === 'NewDevelopment'   ? 'e.g. We need a feature to auto-generate PO from approved PCS with one click. Currently it is manual.' :
                form.category === 'ReportCorrection' ? 'e.g. In Sales Summary report, the GST amount column is not showing correctly.' :
                'e.g. We need a report showing machine-wise production output for each shift with efficiency %'
              }
              style={{ ...S.inp, resize:'vertical' }} />
          </div>

          {(form.category === 'ReportCorrection' || form.category === 'NewReport') && (
            <div style={{ background:'#F9F6F8', borderRadius:8, padding:14 }}>
              <label style={S.label}>📎 Upload Screenshot / Sample Report (optional)</label>
              <div style={{ fontSize:12, color:'#888', marginBottom:8 }}>Share a screenshot or sample format to help us understand better</div>
              <input type='text' key='attach-url' defaultValue={form.attachmentUrl} onBlur={e => set('attachmentUrl',e.target.value)}
                placeholder='Paste Google Drive / OneDrive link to your file'
                style={S.inp} />
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={() => setStep(1)} style={{ ...S.btn('#f0f0f0','#333') }}>← Back</button>
          <button onClick={() => {
            if (!form.module) return toast.error('Please select a module')
            if (!form.screen) return toast.error('Please select a screen')
            const currentReason = formRef.current?.reason || form.reason
            if (!currentReason.trim()) return toast.error('Please describe your issue')
            set('reason', currentReason)
            setStep(3)
          }} style={{ ...S.btn(), flex:1 }}>
            Analyze with AI →
          </button>
        </div>
      </div>
    )
  }

  // Step 4 — Contact
  const Step4 = () => (
    <div>
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:28 }}>📞</div>
        <div style={{ fontSize:17, fontWeight:700, color:'#714B67', marginTop:6 }}>Contact Information</div>
        <div style={{ fontSize:13, color:'#888' }}>Who should we contact about this ticket?</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div className='full' style={{ gridColumn:'1/-1' }}>
          <label style={S.label}>Company / Client Name *</label>
          <input key="cl-name" defaultValue={form.clientName} onBlur={e=>set('clientName',e.target.value)} style={S.inp} />
        </div>
        <div>
          <label style={S.label}>Contact Person Name *</label>
          <input key="ct-name" defaultValue={form.contactName} onBlur={e=>set('contactName',e.target.value)} style={S.inp} placeholder='Your name' />
        </div>
        <div>
          <label style={S.label}>Contact Email *</label>
          <input key="ct-email" type='email' defaultValue={form.contactEmail} onBlur={e=>set('contactEmail',e.target.value)} style={S.inp} placeholder='your@email.com' />
        </div>
        <div>
          <label style={S.label}>Phone Number</label>
          <input key="ct-phone" defaultValue={form.contactPhone} onBlur={e=>set('contactPhone',e.target.value)} style={S.inp} placeholder='+91 99999 99999' />
        </div>
        <div>
          <label style={S.label}>Best Time to Contact</label>
          <select value={form.bestTime} onChange={e => set('bestTime',e.target.value)} style={S.inp}>
            <option>Morning (9am–12pm)</option>
            <option>Afternoon (12pm–4pm)</option>
            <option>Evening (4pm–7pm)</option>
            <option>Anytime</option>
          </select>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        <button onClick={() => setStep(3)} style={{ ...S.btn('#f0f0f0','#333') }}>← Back</button>
        <button onClick={() => {
          if (!form.contactName.trim()) return toast.error('Contact name required')
          if (!form.contactEmail.trim()) return toast.error('Contact email required')
          setStep(5)
        }} style={{ ...S.btn(), flex:1 }}>
          Preview Ticket →
        </button>
      </div>
    </div>
  )

  // Step 5 — Preview
  const Step5 = () => {
    const cat = CATEGORIES.find(c => c.key === form.category)
    const priorityCfg = PRIORITY_CONFIG[aiResult?.priority || 'MEDIUM']

    return (
      <div>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:28 }}>📋</div>
          <div style={{ fontSize:17, fontWeight:700, color:'#714B67', marginTop:6 }}>Review Your Support Ticket</div>
          <div style={{ fontSize:13, color:'#888' }}>Please review before submitting</div>
        </div>

        {/* Ticket Preview Card */}
        <div style={{ border:'2px solid #714B67', borderRadius:12, overflow:'hidden', marginBottom:20 }}>
          {/* Header */}
          <div style={{ background:'#714B67', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ color:'#E8D5E3', fontSize:11 }}>SUPPORT TICKET</div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:15 }}>TKT-{new Date().getFullYear()}-XXXX</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <span style={{ ...S.badge(cat?.color||'#333','#fff'), fontSize:12 }}>{cat?.icon} {cat?.label}</span>
              <span style={{ ...S.badge(priorityCfg.color, priorityCfg.bg), fontSize:12 }}>{priorityCfg.label}</span>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
              {[
                ['Module',   form.module],
                ['Screen',   form.screen],
                ['Client',   form.clientName],
                ['Contact',  form.contactName],
                ['Email',    form.contactEmail],
                ['Phone',    form.contactPhone||'—'],
                ['Best Time',form.bestTime],
                ['Status',   'OPEN'],
              ].map(([k,v]) => (
                <div key={k} style={{ background:'#F9F6F8', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, color:'#888', marginBottom:2 }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#2C3E50' }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ background:'#F9F6F8', borderRadius:8, padding:14, marginBottom:14 }}>
              <div style={{ fontSize:11, color:'#888', marginBottom:4 }}>Issue Description</div>
              <div style={{ fontSize:13, color:'#2C3E50', lineHeight:1.6 }}>{form.reason}</div>
            </div>

            {aiResult && (
              <div style={{ background:'#F0EBF0', borderRadius:8, padding:14, border:'1px solid #714B67' }}>
                <div style={{ fontSize:11, color:'#888', marginBottom:4 }}>🤖 AI Analysis</div>
                <div style={{ fontSize:13, color:'#714B67', fontWeight:600, marginBottom:4 }}>{aiResult.summary}</div>
                <div style={{ fontSize:12, color:'#555' }}>{aiResult.aiSuggestion}</div>
                <div style={{ fontSize:12, color:'#1A5276', marginTop:6 }}>⏱ Estimated Lead Time: {aiResult.leadTime}</div>
              </div>
            )}
          </div>
        </div>

        {/* What happens next */}
        <div style={{ background:'#E8F5E9', borderRadius:10, padding:16, marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1E8449', marginBottom:8 }}>✅ What happens after submission:</div>
          <div style={{ display:'grid', gap:6 }}>
            {[
              '🎫 Ticket created with unique ID (TKT-XXXX)',
              '📧 Acknowledgement email sent to ' + form.contactEmail,
              '🔔 LNV Support team notified instantly',
              '⏱ Team will contact you within SLA period',
              '📱 Track your ticket status anytime',
            ].map((item,i) => (
              <div key={i} style={{ fontSize:12, color:'#1E8449', display:'flex', gap:6 }}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setStep(4)} style={{ ...S.btn('#f0f0f0','#333') }}>← Edit</button>
          <button onClick={handleSave} disabled={saving} style={{ ...S.btn(), flex:1, opacity:saving?.5:1 }}>
            {saving ? '⏳ Submitting...' : '🎫 Submit Support Ticket'}
          </button>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/support`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({
          ...form,
          aiAnalysis:    aiResult?.aiSuggestion,
          aiFeasibility: aiResult?.feasibility,
          aiLeadTime:    aiResult?.leadTime,
          aiSuggestion:  aiResult?.aiSuggestion,
          aiCategory:    aiResult?.summary,
          priority:      aiResult?.priority || 'MEDIUM',
        })
      })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ Ticket ${d.data.ticketNo} submitted successfully!`)
      onSave(d.data)
    } catch (e) { toast.error('Failed to submit ticket') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ ...S.card, maxWidth:680, margin:'0 auto' }}>
      {/* Progress Bar */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          {[['1','Category'],['2','Details'],['3','AI Analysis'],['4','Contact'],['5','Preview']].map(([n,label],i) => (
            <div key={n} style={{ textAlign:'center', flex:1 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', margin:'0 auto 4px',
                background: step > i+1 ? '#1E8449' : step === i+1 ? '#714B67' : '#ddd',
                color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:700 }}>
                {step > i+1 ? '✓' : n}
              </div>
              <div style={{ fontSize:10, color: step >= i+1 ? '#714B67' : '#aaa', fontWeight: step === i+1 ? 700 : 400 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ height:4, background:'#eee', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(step-1)/4*100}%`, background:'#714B67', borderRadius:2, transition:'width .3s' }} />
        </div>
      </div>

      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && (
        <AIAnalysisScreen
          category={form.category} module={form.module}
          screen={form.screen} reason={form.reason}
          onDone={result => { setAiResult(result); setStep(4) }}
        />
      )}
      {step === 4 && <Step4 />}
      {step === 5 && <Step5 />}
    </div>
  )
}

// ══════════════════════════════════════════
// TICKET LIST (Client View)
// ══════════════════════════════════════════
function TicketList({ onNew, onView }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState({ status:'', category:'' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.status)   params.set('status',   filter.status)
      if (filter.category) params.set('category', filter.category)
      const r = await fetch(`${BASE}/support?${params}`, { headers: hdr() })
      const d = await r.json()
      setTickets(d.data || [])
    } catch {} finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'#714B67' }}>🎫 My Support Tickets</div>
          <div style={{ fontSize:13, color:'#888' }}>Track all your support requests</div>
        </div>
        <button onClick={onNew} style={S.btn()}>+ New Support Ticket</button>
      </div>

      {/* Filters */}
      <div style={{ ...S.card, display:'flex', gap:12, padding:14 }}>
        <select value={filter.status} onChange={e => setFilter(f=>({...f,status:e.target.value}))}
          style={{ ...S.inp, width:180 }}>
          <option value=''>All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filter.category} onChange={e => setFilter(f=>({...f,category:e.target.value}))}
          style={{ ...S.inp, width:200 }}>
          <option value=''>All Categories</option>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
        </select>
        <button onClick={load} style={{ ...S.btn('#F0EBF0','#714B67'), padding:'8px 16px' }}>🔄 Refresh</button>
      </div>

      {/* Ticket Table */}
      <div style={S.card}>
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>⏳ Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎫</div>
            <div style={{ fontSize:16, fontWeight:600, color:'#714B67', marginBottom:8 }}>No tickets yet</div>
            <div style={{ fontSize:13, color:'#888', marginBottom:20 }}>Click + New Support Ticket to raise your first request</div>
            <button onClick={onNew} style={S.btn()}>+ New Support Ticket</button>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#714B67', color:'#fff' }}>
                {['Ticket No','Category','Module','Issue','Status','Priority','Created','Action'].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((t,i) => {
                const cat = CATEGORIES.find(c=>c.key===t.category)
                const sc  = STATUS_CONFIG[t.status]   || STATUS_CONFIG.OPEN
                const pc  = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM
                return (
                  <tr key={t.id} style={{ background:i%2===0?'#fff':'#F9F6F8', borderBottom:'1px solid #F0E8EC' }}>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace', fontWeight:700, color:'#714B67', fontSize:12 }}>{t.ticketNo}</td>
                    <td style={{ padding:'10px 12px' }}><span style={{ fontSize:12 }}>{cat?.icon} {cat?.label}</span></td>
                    <td style={{ padding:'10px 12px', fontWeight:600 }}>{t.module}</td>
                    <td style={{ padding:'10px 12px', maxWidth:220 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.reason}</div>
                      {t.screen && <div style={{ fontSize:11, color:'#888' }}>{t.screen}</div>}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={S.badge(sc.color,sc.bg)}>{sc.label}</span>
                      {t.breached && <div style={{ fontSize:10, color:'#C0392B', fontWeight:700, marginTop:2 }}>⚠️ SLA Breached</div>}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={S.badge(pc.color,pc.bg)}>{pc.label}</span>
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:12, color:'#888' }}>{fmtD(t.createdAt)}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <button onClick={() => onView(t)} style={{ ...S.btn('#EBF5FB','#1A5276'), padding:'4px 10px', fontSize:11 }}>View</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// TICKET DETAIL VIEW
// ══════════════════════════════════════════
function TicketDetail({ ticket: initial, onBack, isAdmin }) {
  const [ticket,  setTicket]  = useState(initial)
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [rating,  setRating]  = useState(initial.rating || 0)

  const cat = CATEGORIES.find(c => c.key === ticket.category)
  const sc  = STATUS_CONFIG[ticket.status]    || STATUS_CONFIG.OPEN
  const pc  = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM

  const comms = (() => { try { return JSON.parse(ticket.communications||'[]') } catch { return [] } })()

  const updateStatus = async (status) => {
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/support/${ticket.id}`, {
        method:'PATCH', headers: hdr(),
        body: JSON.stringify({ status, newComment: `Status updated to ${STATUS_CONFIG[status]?.label}` })
      })
      const d = await r.json()
      setTicket(d.data)
      toast.success('Status updated')
    } catch { toast.error('Failed to update') }
    finally { setSaving(false) }
  }

  const addNote = async () => {
    if (!note.trim()) return
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/support/${ticket.id}`, {
        method:'PATCH', headers: hdr(),
        body: JSON.stringify({ newComment: note })
      })
      const d = await r.json()
      setTicket(d.data)
      setNote('')
      toast.success('Note added')
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const submitRating = async (r) => {
    setRating(r)
    await fetch(`${BASE}/support/${ticket.id}`, {
      method:'PATCH', headers: hdr(),
      body: JSON.stringify({ rating: r, status: 'CUSTOMER_ACCEPTED' })
    })
    toast.success('Thank you for your feedback! ⭐')
  }

  return (
    <div>
      {/* Back + Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ ...S.btn('#F0EBF0','#714B67') }}>← Back</button>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:'#714B67' }}>{ticket.ticketNo}</div>
          <div style={{ fontSize:12, color:'#888' }}>Created {fmtDT(ticket.createdAt)} by {ticket.contactName}</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <span style={S.badge(sc.color,sc.bg)}>{sc.label}</span>
          <span style={S.badge(pc.color,pc.bg)}>{pc.label}</span>
          <span style={{ ...S.badge(cat?.color||'#333','#fff'), fontSize:12 }}>{cat?.icon} {cat?.label}</span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16 }}>
        {/* LEFT */}
        <div>
          {/* Issue Details */}
          <div style={S.card}>
            <div style={{ fontSize:15, fontWeight:700, color:'#714B67', marginBottom:14 }}>📋 Issue Details</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              {[['Module',ticket.module],['Screen',ticket.screen],['Client',ticket.clientName],['Contact',ticket.contactName],
                ['Email',ticket.contactEmail],['Phone',ticket.contactPhone||'—'],['Best Time',ticket.bestTime||'—'],
                ['Lead Time',ticket.aiLeadTime||'—']].map(([k,v])=>(
                <div key={k} style={{ background:'#F9F6F8', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, color:'#888', marginBottom:2 }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'#F9F6F8', borderRadius:8, padding:14, marginBottom:14 }}>
              <div style={{ fontSize:11, color:'#888', marginBottom:4 }}>Issue Description</div>
              <div style={{ fontSize:13, lineHeight:1.7 }}>{ticket.reason}</div>
            </div>
            {ticket.attachmentUrl && (
              <div style={{ background:'#EBF5FB', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:11, color:'#888', marginBottom:4 }}>📎 Attachment</div>
                <a href={ticket.attachmentUrl} target='_blank' rel='noreferrer' style={{ color:'#1A5276', fontSize:13 }}>
                  View Attachment →
                </a>
              </div>
            )}
          </div>

          {/* AI Analysis */}
          {ticket.aiAnalysis && (
            <div style={{ ...S.card, border:'1px solid #714B67' }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#714B67', marginBottom:14 }}>🤖 AI Analysis</div>
              <div style={{ background:'#F0EBF0', borderRadius:8, padding:14, marginBottom:10 }}>
                <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Summary</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#714B67' }}>{ticket.aiCategory}</div>
              </div>
              <div style={{ background:'#F9F6F8', borderRadius:8, padding:14, marginBottom:10 }}>
                <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Analysis</div>
                <div style={{ fontSize:13, lineHeight:1.7 }}>{ticket.aiAnalysis}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div style={{ background:'#E8F5E9', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:11, color:'#888' }}>Feasibility</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1E8449', marginTop:2 }}>{ticket.aiFeasibility}</div>
                </div>
                <div style={{ background:'#EBF5FB', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:11, color:'#888' }}>Lead Time</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1A5276', marginTop:2 }}>{ticket.aiLeadTime}</div>
                </div>
              </div>
            </div>
          )}

          {/* Resolution */}
          {ticket.resolution && (
            <div style={{ ...S.card, border:'1px solid #1E8449' }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#1E8449', marginBottom:10 }}>✅ Resolution</div>
              <div style={{ fontSize:13, lineHeight:1.7 }}>{ticket.resolution}</div>
              {ticket.resolvedAt && <div style={{ fontSize:12, color:'#888', marginTop:8 }}>Resolved on {fmtDT(ticket.resolvedAt)}</div>}
            </div>
          )}

          {/* Rating (for resolved tickets) */}
          {['RESOLVED','CUSTOMER_ACCEPTED'].includes(ticket.status) && !isAdmin && (
            <div style={S.card}>
              <div style={{ fontSize:15, fontWeight:700, color:'#714B67', marginBottom:12 }}>⭐ Rate This Resolution</div>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                {[1,2,3,4,5].map(r => (
                  <button key={r} onClick={() => submitRating(r)}
                    style={{ fontSize:28, background:'none', border:'none', cursor:'pointer', opacity: rating >= r ? 1 : .3, transition:'opacity .15s' }}>
                    ⭐
                  </button>
                ))}
              </div>
              {rating > 0 && <div style={{ fontSize:13, color:'#1E8449' }}>Thank you! You rated this {rating}/5 ⭐</div>}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div>
          {/* Admin Status Controls */}
          {isAdmin && (
            <div style={S.card}>
              <div style={{ fontSize:14, fontWeight:700, color:'#714B67', marginBottom:12 }}>⚙️ Update Status</div>
              <div style={{ display:'grid', gap:6 }}>
                {Object.entries(STATUS_CONFIG).map(([k,v]) => (
                  <button key={k} onClick={() => updateStatus(k)} disabled={ticket.status===k||saving}
                    style={{ padding:'8px 12px', background: ticket.status===k ? v.bg : '#f9f6f8',
                      color: ticket.status===k ? v.color : '#555',
                      border: `1px solid ${ticket.status===k ? v.color : '#ddd'}`,
                      borderRadius:6, cursor:ticket.status===k?'default':'pointer',
                      fontWeight: ticket.status===k ? 700 : 400, fontSize:12, textAlign:'left' }}>
                    {ticket.status===k ? '● ' : '○ '}{v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Communication Log */}
          <div style={S.card}>
            <div style={{ fontSize:14, fontWeight:700, color:'#714B67', marginBottom:12 }}>💬 Communication Log</div>
            <div style={{ maxHeight:300, overflowY:'auto', marginBottom:12 }}>
              {comms.length === 0 ? (
                <div style={{ color:'#aaa', fontSize:12, textAlign:'center', padding:20 }}>No messages yet</div>
              ) : comms.map((c,i) => (
                <div key={i} style={{ padding:'10px 12px', background:'#F9F6F8', borderRadius:8, marginBottom:8, borderLeft:`3px solid ${c.type==='STATUS_CHANGE'?'#1E8449':c.type==='SYSTEM'?'#714B67':'#1A5276'}` }}>
                  <div style={{ fontSize:10, color:'#888', marginBottom:3 }}>{c.from} · {fmtDT(c.date)}</div>
                  <div style={{ fontSize:12, color:'#2C3E50' }}>{c.message}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input defaultValue={note} onChange={e => setNote(e.target.value)}
                placeholder='Add a note or message...'
                style={{ ...S.inp, flex:1 }}
                onKeyDown={e => e.key==='Enter' && addNote()} />
              <button onClick={addNote} disabled={saving} style={S.btn()}>Send</button>
            </div>
          </div>

          {/* Ticket Info */}
          <div style={S.card}>
            <div style={{ fontSize:14, fontWeight:700, color:'#714B67', marginBottom:12 }}>ℹ️ Ticket Info</div>
            {[
              ['Ticket No',   ticket.ticketNo],
              ['Created',     fmtDT(ticket.createdAt)],
              ['Updated',     fmtDT(ticket.updatedAt)],
              ['Assigned To', ticket.assignedTo||'Unassigned'],
              ['SLA Hours',   ticket.slaHours + ' hours'],
              ['Rating',      ticket.rating ? '⭐'.repeat(ticket.rating) : 'Not rated'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #F0E8EC' }}>
                <div style={{ fontSize:12, color:'#888' }}>{k}</div>
                <div style={{ fontSize:12, fontWeight:600 }}>{v}</div>
              </div>
            ))}
            {isAdmin && (
              <div style={{ marginTop:10 }}>
                <label style={S.label}>Assign To</label>
                <input defaultValue={ticket.assignedTo||''} onBlur={async e => {
                  await fetch(`${BASE}/support/${ticket.id}`,{ method:'PATCH', headers:hdr(), body:JSON.stringify({assignedTo:e.target.value}) })
                  toast.success('Assigned')
                }} style={S.inp} placeholder='Team member name' />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════════════
function AdminDashboard({ onViewTicket }) {
  const [stats,   setStats]   = useState(null)
  const [tickets, setTickets] = useState([])
  const [filter,  setFilter]  = useState({ status:'', category:'', priority:'', search:'' })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.status)   params.set('status',   filter.status)
      if (filter.category) params.set('category', filter.category)
      if (filter.priority) params.set('priority', filter.priority)
      if (filter.search)   params.set('search',   filter.search)

      const [tr, sr] = await Promise.all([
        fetch(`${BASE}/support?${params}&limit=50`, { headers: hdr() }).then(r=>r.json()),
        fetch(`${BASE}/support/stats/dashboard`,    { headers: hdr() }).then(r=>r.json()),
      ])
      setTickets(tr.data || [])
      setStats(sr.data)
    } catch {} finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'#714B67' }}>🛠️ Support Dashboard — LNV Team</div>
          <div style={{ fontSize:13, color:'#888' }}>All client support tickets in one view</div>
        </div>
        <button onClick={load} style={{ ...S.btn('#F0EBF0','#714B67') }}>🔄 Refresh</button>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:20 }}>
          {[
            ['Total',       stats.total,      '#714B67', '#F0EBF0'],
            ['Open',        stats.open,       '#1A5276', '#EBF5FB'],
            ['In Progress', stats.inProgress, '#D35400', '#FEF9E7'],
            ['Resolved',    stats.resolved,   '#1E8449', '#E8F5E9'],
            ['Critical',    stats.critical,   '#C0392B', '#FDEDEC'],
            ['Avg Resolve', (stats.avgResolutionHours||0)+'h', '#B8860B', '#FFF8E1'],
          ].map(([label,val,color,bg]) => (
            <div key={label} style={{ background:'#fff', borderRadius:10, padding:'14px 16px',
              boxShadow:'0 1px 4px rgba(0,0,0,.06)', borderLeft:`3px solid ${color}`, textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:700, color }}>{val}</div>
              <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ ...S.card, display:'flex', gap:10, padding:14, flexWrap:'wrap' }}>
        <input value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))}
          placeholder='🔍 Search ticket, client, issue...'
          style={{ ...S.inp, width:240 }} />
        <select value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))} style={{ ...S.inp, width:160 }}>
          <option value=''>All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filter.category} onChange={e=>setFilter(f=>({...f,category:e.target.value}))} style={{ ...S.inp, width:180 }}>
          <option value=''>All Categories</option>
          {CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
        </select>
        <select value={filter.priority} onChange={e=>setFilter(f=>({...f,priority:e.target.value}))} style={{ ...S.inp, width:150 }}>
          <option value=''>All Priority</option>
          {Object.keys(PRIORITY_CONFIG).map(k=><option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {/* Usage Management */}
      {stats && stats.byCategory && (
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#714B67', marginBottom:12 }}>📊 This Month Ticket Usage — All Clients</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {[
              ['🐛 Bug',          stats.byCategory.find(c=>c.category==='Bug')?._count?.id||0,              '#C0392B','#FDEDEC'],
              ['⚡ New Dev',       stats.byCategory.find(c=>c.category==='NewDevelopment')?._count?.id||0,   '#1A5276','#EBF5FB'],
              ['📊 Report Fix',   stats.byCategory.find(c=>c.category==='ReportCorrection')?._count?.id||0, '#D35400','#FEF9E7'],
              ['📋 New Report',   stats.byCategory.find(c=>c.category==='NewReport')?._count?.id||0,        '#117A65','#E8F8F5'],
            ].map(([label,count,color,bg])=>(
              <div key={label} style={{ background:bg, borderRadius:8, padding:'12px 14px', borderLeft:`3px solid ${color}` }}>
                <div style={{ fontSize:13, color }}>{label}</div>
                <div style={{ fontSize:22, fontWeight:700, color, marginTop:4 }}>{count}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12, fontSize:12, color:'#888' }}>
            💡 AI Limit: 10 tickets/client/month | Basic Limit: 25 tickets/client/month | Resets on 1st of each month
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <div style={S.card}>
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>⏳ Loading...</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#714B67', color:'#fff' }}>
                {['Ticket','Client','Category','Module','Issue','Status','Priority','SLA','Created','Action'].map(h=>(
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan={10} style={{ padding:32, textAlign:'center', color:'#ccc' }}>No tickets found</td></tr>
              ) : tickets.map((t,i) => {
                const cat = CATEGORIES.find(c=>c.key===t.category)
                const sc  = STATUS_CONFIG[t.status]    || STATUS_CONFIG.OPEN
                const pc  = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM
                const slaColor = t.breached ? '#C0392B' : (t.hoursLeft||0) < 4 ? '#D35400' : '#1E8449'
                return (
                  <tr key={t.id} style={{ background:i%2===0?'#fff':'#F9F6F8', borderBottom:'1px solid #F0E8EC',
                    outline: t.priority==='CRITICAL' ? '1px solid #C0392B' : 'none' }}>
                    <td style={{ padding:'9px 12px', fontFamily:'monospace', fontWeight:700, color:'#714B67', fontSize:12 }}>{t.ticketNo}</td>
                    <td style={{ padding:'9px 12px', fontWeight:600, fontSize:12 }}>
                      {t.clientName}
                      <div style={{ fontSize:10, color:'#888' }}>{t.contactName}</div>
                    </td>
                    <td style={{ padding:'9px 12px', fontSize:12 }}>{cat?.icon} {cat?.label}</td>
                    <td style={{ padding:'9px 12px', fontWeight:600, fontSize:12 }}>{t.module}</td>
                    <td style={{ padding:'9px 12px', maxWidth:180 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>{t.reason}</div>
                    </td>
                    <td style={{ padding:'9px 12px' }}><span style={S.badge(sc.color,sc.bg)}>{sc.label}</span></td>
                    <td style={{ padding:'9px 12px' }}><span style={S.badge(pc.color,pc.bg)}>{pc.label}</span></td>
                    <td style={{ padding:'9px 12px', fontSize:11, color:slaColor, fontWeight:700 }}>
                      {t.breached ? '⚠️ BREACHED' : `${t.hoursLeft||0}h left`}
                    </td>
                    <td style={{ padding:'9px 12px', fontSize:11, color:'#888' }}>{fmtD(t.createdAt)}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <button onClick={() => onViewTicket(t,true)} style={{ ...S.btn('#EBF5FB','#1A5276'), padding:'4px 10px', fontSize:11 }}>
                        Open
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MAIN SUPPORT PAGE
// ══════════════════════════════════════════
export default function SupportPage() {
  const [view,       setView]       = useState('list') // list|new|detail|admin
  const [selTicket,  setSelTicket]  = useState(null)
  const [isAdmin,    setIsAdmin]    = useState(false)
  const [adminView,  setAdminView]  = useState(false)

  const u = user()
  const isSuper = u?.role === 'SUPER_ADMIN' || u?.email === 'admin@lnverp.com'

  const handleViewTicket = (ticket, admin=false) => {
    setSelTicket(ticket)
    setIsAdmin(admin)
    setView('detail')
  }

  return (
    <div style={S.wrap}>
      {/* Page Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, background:'#714B67', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🎫</div>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:'#714B67' }}>LNV ERP Support</div>
            <div style={{ fontSize:12, color:'#888' }}>AI-powered support system</div>
          </div>
        </div>

        {/* Tab switcher for super admin */}
        {isSuper && view !== 'detail' && (
          <div style={{ display:'flex', gap:0, background:'#F0EBF0', borderRadius:8, padding:3 }}>
            <button onClick={() => { setAdminView(false); setView('list') }}
              style={{ padding:'7px 16px', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:13,
                background: !adminView ? '#714B67' : 'transparent', color: !adminView ? '#fff' : '#714B67' }}>
              My Tickets
            </button>
            <button onClick={() => { setAdminView(true); setView('admin') }}
              style={{ padding:'7px 16px', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:13,
                background: adminView ? '#714B67' : 'transparent', color: adminView ? '#fff' : '#714B67' }}>
              🛠️ All Clients
            </button>
          </div>
        )}
      </div>

      {/* Views */}
      {view === 'new' && (
        <NewTicketWizard
          onSave={(ticket) => { setSelTicket(ticket); setView('list') }}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'list' && (
        <TicketList
          onNew={() => setView('new')}
          onView={(t) => handleViewTicket(t, false)}
        />
      )}

      {view === 'admin' && (
        <AdminDashboard
          onViewTicket={handleViewTicket}
        />
      )}

      {view === 'detail' && selTicket && (
        <TicketDetail
          ticket={selTicket}
          isAdmin={isAdmin}
          onBack={() => setView(adminView ? 'admin' : 'list')}
        />
      )}
    </div>
  )
}
