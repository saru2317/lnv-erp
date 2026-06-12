import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DealCompetitor from './DealCompetitor'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const STAGES = [
  { key:'Requirement Understanding', label:'Requirement', color:'#6C757D' },
  { key:'Solution Discussion',       label:'Discussion',  color:'#004085' },
  { key:'Demo / Presentation',       label:'Demo',        color:'#856404' },
  { key:'Proposal Submitted',        label:'Proposal',    color:'#4B2E83' },
  { key:'Negotiation',               label:'Negotiation', color:'#0C5460' },
  { key:'Decision Pending',          label:'Decision',    color:'#E06F39' },
  { key:'Won',                       label:'Won',         color:'#155724' },
  { key:'Lost',                      label:'Lost',        color:'#721C24' },
]

const ACTIVITY_TYPES = [
  { value:'call',    label:'Call',    icon:'\uD83D\uDCDE' },
  { value:'email',   label:'Email',   icon:'\uD83D\uDCE7' },
  { value:'meeting', label:'Meeting', icon:'\uD83E\uDD1D' },
  { value:'note',    label:'Note',    icon:'\uD83D\uDCDD' },
  { value:'task',    label:'Task',    icon:'\u2705'        },
]

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

export default function LeadView() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [lead,        setLead]        = useState(null)
  const [activities,    setActivities]    = useState([])
  const [negotiations,  setNegotiations]  = useState([])
  const [showNegForm,   setShowNegForm]   = useState(false)
  const [negForm,       setNegForm]       = useState({ ourPrice:'', theirPrice:'', counterPrice:'', discount:'0', notes:'', status:'OPEN' })
  const setNF = (k,v) => setNegForm(f=>({...f,[k]:v}))
  const [loading,     setLoading]     = useState(true)
  const [showActivity,setShowActivity]= useState(false)
  const [actForm,     setActForm]     = useState({ type:'call', subject:'', notes:'', scheduledAt:'' })
  const [saving,      setSaving]      = useState(false)
  const [activeTab,   setActiveTab]   = useState('info')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [lr, ar, nr] = await Promise.all([
        fetch(`${BASE_URL}/crm/leads/${id}`, { headers: hdr2() }).then(r=>r.json()),
        fetch(`${BASE_URL}/crm/leads/${id}/activities`, { headers: hdr2() }).then(r=>r.json()),
        fetch(`${BASE_URL}/crm/leads/${id}/negotiations`, { headers: hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
      ])
      setLead(lr.data||lr)
      setActivities(Array.isArray(ar.data) ? ar.data : Array.isArray(ar) ? ar : [])
      setNegotiations(Array.isArray(nr.data) ? nr.data : [])
    } catch {}
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  // Update stage
  const updateStage = async newStage => {
    try {
      await fetch(`${BASE_URL}/crm/leads/${id}`, {
        method:'PATCH', headers: hdr(),
        body: JSON.stringify({ stage: newStage })
      })
      // Auto-log stage change to timeline
      await fetch(`${BASE_URL}/crm/leads/${id}/activities`, {
        method:'POST', headers:hdr(),
        body:JSON.stringify({
          type:'stage_change',
          subject:`Stage → ${newStage}`,
          notes:`${lead.stage} → ${newStage}`,
          leadName: lead.companyName||lead.company,
        })
      }).catch(()=>{})
      setLead(l=>({...l, stage:newStage}))
      toast.success(`Stage updated to ${newStage}`)
      load()
    } catch { toast.error('Failed to update stage') }
  }

  // Add activity
  const addActivity = async () => {
    if (!actForm.subject) return toast.error('Activity subject required')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/crm/leads/${id}/activities`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ ...actForm, leadId:+id, leadName:lead?.company||lead?.name })
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Activity logged')
      setShowActivity(false)
      setActForm({ type:'call', subject:'', notes:'', scheduledAt:'' })
      load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // Create quotation from this lead
  const createQuotation = () => {
    if (!lead) return
    const params = new URLSearchParams({
      crmLeadId:  lead.id,
      leadName:   lead.name||lead.company||'',
      company:    lead.company||lead.name||'',
      contact:    lead.contactName||'',
      email:      lead.email||'',
      phone:      lead.phone||lead.mobile||'',
    })
    navigate(`/sd/quotations/new?${params.toString()}`)
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading lead...</div>
  if (!lead)   return <div style={{padding:40,textAlign:'center',color:'#DC3545'}}>Lead not found</div>

  const stg = STAGES.find(s=>s.key===lead.stage)||STAGES[0]
  const stgIdx = STAGES.findIndex(s=>s.key===lead.stage)

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <button onClick={()=>navigate('/crm/leads')}
              style={{background:'none',border:'none',cursor:'pointer',color:'#6C757D',fontSize:12}}>
              ← Leads
            </button>
            <span style={{color:'#6C757D'}}>/</span>
            <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
              {lead.companyName||lead.company||lead.name}
            </span>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{padding:'3px 12px',borderRadius:10,fontSize:11,fontWeight:700,
              background:stg.color+'22',color:stg.color}}>{stg.label}</span>
            {lead.leadNo&&<span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{lead.leadNo}</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
          <button onClick={()=>setShowActivity(true)}
            style={{padding:'7px 14px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>
            + Log Activity
          </button>
          {/* CONVERT TO CUSTOMER */}
          {!lead.customerId && (
            <button onClick={async ()=>{
              if (!window.confirm(`Add "${lead.companyName||lead.company}" to Customer Master?`)) return
              try {
                const r = await fetch(`${BASE_URL}/sd/customers`, {
                  method:'POST', headers:hdr(),
                  body: JSON.stringify({
                    name:    lead.companyName||lead.company,
                    phone:   lead.phone||lead.mobile||null,
                    email:   lead.email||null,
                    city:    lead.city||null,
                    state:   lead.state||null,
                    country: lead.country||'India',
                    type:    'B',
                  })
                })
                const d = await r.json()
                if (!r.ok) throw new Error(d.error)
                // Link lead to new customer
                await fetch(`${BASE_URL}/crm/leads/${lead.id}`, {
                  method:'PATCH', headers:hdr(),
                  body: JSON.stringify({ customerId: d.data?.id })
                })
                toast.success(`${lead.companyName||lead.company} added to Customer Master!`)
                // Refresh lead data
                const lr = await fetch(`${BASE_URL}/crm/leads/${lead.id}`, { headers:hdr2() }).then(r=>r.json())
                setLead(lr.data||lr)
              } catch(e) { toast.error(e.message) }
            }}
              style={{padding:'7px 14px',background:'#E8F5E9',color:'#155724',border:'1px solid #A5D6A7',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              👤 Convert to Customer
            </button>
          )}
          {lead.customerId && (
            <button onClick={()=>navigate(`/crm/customers/${lead.customerId}`)}
              style={{padding:'7px 14px',background:'#EDE0EA',color:'#714B67',border:'1px solid #D4B8CE',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              👤 View Customer
            </button>
          )}
          <button onClick={createQuotation}
            style={{padding:'7px 16px',background:'#0C5460',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            📋 Create Quotation
          </button>
          {lead.stage!=='Won'&&lead.stage!=='Lost'&&(
            <>
              <button onClick={()=>updateStage('Won')}
                style={{padding:'7px 14px',background:'#D4EDDA',color:'#155724',border:'1px solid #C3E6CB',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                🏆 Mark Won
              </button>
              <button onClick={()=>updateStage('Lost')}
                style={{padding:'7px 14px',background:'#F8D7DA',color:'#721C24',border:'1px solid #F5C6CB',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                ✗ Mark Lost
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stage progress bar */}
      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:14,marginBottom:14}}>
        <div style={{display:'flex',gap:0}}>
          {STAGES.filter(s=>!['Won','Lost'].includes(s.key)).map((s,i,arr)=>{
            const active = lead.stage===s.key
            const done   = stgIdx > i
            return (
              <div key={s.key} onClick={()=>updateStage(s.key)}
                style={{flex:1,cursor:'pointer',position:'relative'}}>
                <div style={{
                  padding:'8px 4px',textAlign:'center',
                  background:active?s.color:done?s.color+'44':'#F8F9FA',
                  color:active||done?'#fff':'#6C757D',
                  fontSize:11,fontWeight:active?700:400,
                  borderRadius:i===0?'6px 0 0 6px':i===arr.length-1?'0 6px 6px 0':'0',
                  borderRight:i<arr.length-1?'1px solid #fff':'none',
                  transition:'all .2s',
                }}>
                  {s.label}
                </div>
              </div>
            )
          })}
        </div>
        {lead.stage==='Won'&&<div style={{marginTop:8,textAlign:'center',fontWeight:700,color:'#155724',fontSize:13}}>🏆 Lead Won!</div>}
        {lead.stage==='Lost'&&<div style={{marginTop:8,textAlign:'center',fontWeight:700,color:'#721C24',fontSize:13}}>✗ Lead Lost</div>}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:14,padding:'5px 8px',background:'#F0EEEB',borderRadius:8,flexWrap:'wrap'}}>
        {[['info','📋 Info'],['timeline','🕐 Timeline'],['negotiation','💰 Negotiation'],['quotations','📄 Quotations'],['activities','📅 Activities'],['competitors','🎯 Competitors']].map(([k,l])=>(
          <button key={k} onClick={()=>setActiveTab(k)} style={{
            padding:'6px 16px',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',
            background:activeTab===k?'#714B67':'transparent',
            color:activeTab===k?'#fff':'#6C757D'}}>
            {l}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {activeTab==='info'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Company Info</div>
            {[
              ['Company',    lead.company     ],
              ['Industry',   lead.industry    ],
              ['City',       lead.city        ],
              ['State',      lead.state       ],
              ['Country',    lead.country     ],
            ].map(([k,v])=>v&&(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F0EEEB',fontSize:12}}>
                <span style={{color:'#6C757D',fontWeight:600}}>{k}</span>
                <span style={{color:'#333'}}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Contact & Deal</div>
            {[
              ['Contact',    lead.contactName   ],
              ['Designation',lead.designation   ],
              ['Phone',      lead.phone         ],
              ['Mobile',     lead.mobile        ],
              ['Email',      lead.email         ],
              ['Source',     lead.source        ],
              ['Assigned To',lead.assignedTo    ],
              ['Deal Value', lead.dealValue?INR(lead.dealValue):null],
              ['Close Date', lead.expectedCloseDate?new Date(lead.expectedCloseDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):null],
            ].map(([k,v])=>v&&(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F0EEEB',fontSize:12}}>
                <span style={{color:'#6C757D',fontWeight:600}}>{k}</span>
                <span style={{color:'#333',fontWeight:k==='Deal Value'?700:400,fontFamily:k==='Deal Value'?'DM Mono,monospace':''}}>{v}</span>
              </div>
            ))}
          </div>

          {lead.requirements&&(
            <div style={{gridColumn:'1/-1',background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
              <div style={{fontWeight:700,fontSize:12,color:'#714B67',marginBottom:8}}>Requirements</div>
              <div style={{fontSize:12,color:'#495057',lineHeight:1.7}}>{lead.requirements}</div>
            </div>
          )}
          {lead.notes&&(
            <div style={{gridColumn:'1/-1',background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:8,padding:14}}>
              <div style={{fontWeight:700,fontSize:12,color:'#856404',marginBottom:6}}>Internal Notes</div>
              <div style={{fontSize:12,color:'#856404'}}>{lead.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Activities */}
      {activeTab==='activities'&&(
        <div>
          {activities.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              <div style={{fontSize:24,marginBottom:8}}>\uD83D\uDCC5</div>
              <div style={{fontWeight:700}}>No activities yet</div>
              <div style={{fontSize:12,marginTop:4}}>Log calls, meetings, emails to track progress</div>
              <button onClick={()=>setShowActivity(true)}
                style={{marginTop:12,padding:'6px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                + Log First Activity
              </button>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {activities.map((a,i)=>{
                const at = ACTIVITY_TYPES.find(t=>t.value===a.type)||ACTIVITY_TYPES[0]
                return (
                  <div key={i} style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,
                    padding:14,display:'flex',gap:12,alignItems:'flex-start',
                    borderLeft:`4px solid ${a.type==='call'?'#0C5460':a.type==='meeting'?'#714B67':a.type==='email'?'#856404':'#6C757D'}`}}>
                    <span style={{fontSize:20,flexShrink:0}}>{at.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13}}>{a.subject}</div>
                      {a.notes&&<div style={{fontSize:12,color:'#495057',marginTop:4}}>{a.notes}</div>}
                      <div style={{fontSize:11,color:'#6C757D',marginTop:6}}>
                        {at.label} · {a.createdAt?new Date(a.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):''} · {a.createdBy||'System'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Quotations */}
      {activeTab==='quotations'&&(
        <div>
          <div style={{marginBottom:12,display:'flex',justifyContent:'flex-end'}}>
            <button onClick={createQuotation}
              style={{padding:'7px 16px',background:'#0C5460',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              📋 Create New Quotation
            </button>
          </div>
          {(lead.quotations||[]).length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              <div style={{fontSize:24,marginBottom:8}}>📋</div>
              <div style={{fontWeight:700}}>No quotations yet</div>
              <div style={{fontSize:12,marginTop:4}}>Click "Create Quotation" to send a proposal</div>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,background:'#fff',borderRadius:8,overflow:'hidden',border:'1px solid #E0D5E0'}}>
              <thead>
                <tr style={{background:'#F8F4F8'}}>
                  {['Quot #','Date','Total','Status',''].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:700,fontSize:11,color:'#714B67'}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(lead.quotations||[]).map((q,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #F0EEEB'}}>
                    <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>{q.quotNo}</td>
                    <td style={{padding:'9px 12px',fontSize:11,color:'#6C757D'}}>{q.createdAt?new Date(q.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):''}</td>
                    <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(q.grandTotal||0)}</td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:'#CCE5FF',color:'#004085'}}>{q.status}</span>
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <button onClick={()=>navigate('/sd/quotations/'+q.id)}
                        style={{padding:'3px 10px',background:'#EDE0EA',color:'#714B67',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:600}}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}


      {/* Tab: Competitors */}
      {activeTab==='competitors'&&(
        <DealCompetitor leadId={id} leadName={lead.company||lead.name} />
      )}

      {/* ── TIMELINE TAB ── */}
      {activeTab==='timeline'&&(
        <div style={{display:'flex',flexDirection:'column',gap:0}}>
          {[...activities].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>No timeline events yet</div>
          ) : [...activities].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map((a,i)=>{
            const typeIcon = { call:'📞', email:'📧', meeting:'🤝', note:'📝', task:'✅', stage_change:'🔄', quotation:'📄', negotiation:'💰', po_received:'📦' }
            const typeClr  = { call:'#004085', email:'#856404', meeting:'#4B2E83', note:'#6C757D', negotiation:'#117A65', quotation:'#714B67', po_received:'#155724', stage_change:'#1565C0' }
            return (
              <div key={a.id} style={{display:'flex',gap:12,paddingBottom:16,position:'relative'}}>
                {/* Timeline line */}
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:(typeClr[a.type]||'#6C757D')+'22',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,
                    border:`2px solid ${typeClr[a.type]||'#6C757D'}44`}}>
                    {typeIcon[a.type]||'📋'}
                  </div>
                  {i < activities.length-1 && <div style={{width:2,flex:1,background:'#E0D5E0',marginTop:4,minHeight:20}}/>}
                </div>
                {/* Content */}
                <div style={{flex:1,paddingBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{fontWeight:700,fontSize:13,color:'#1C1C1C'}}>{a.subject}</div>
                    <div style={{fontSize:10,color:'#6C757D',whiteSpace:'nowrap',marginLeft:8}}>
                      {new Date(a.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                  <div style={{fontSize:11,color:typeClr[a.type]||'#6C757D',fontWeight:600,marginBottom:2,textTransform:'uppercase',letterSpacing:.3}}>
                    {a.type?.replace('_',' ')} {a.createdBy ? `· ${a.createdBy}` : ''}
                  </div>
                  {a.notes && <div style={{fontSize:12,color:'#495057',padding:'6px 10px',background:'#F8F9FA',borderRadius:5,marginTop:4}}>{a.notes}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── NEGOTIATION TAB ── */}
      {activeTab==='negotiation'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:'#1C1C1C'}}>
              Price Negotiation Rounds
            </div>
            <button onClick={()=>setShowNegForm(!showNegForm)}
              style={{padding:'6px 14px',background:'#714B67',color:'#fff',border:'none',
                borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              + New Round
            </button>
          </div>

          {/* Negotiation Form */}
          {showNegForm && (
            <div style={{background:'#fff',border:'2px solid #714B67',borderRadius:8,padding:16,marginBottom:14}}>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>
                Round {negotiations.length+1} — Price Negotiation
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:10}}>
                {[
                  {k:'ourPrice',    l:'Our Price (₹) *',       ph:'278500'},
                  {k:'theirPrice',  l:"Customer's Price (₹)",  ph:'250000'},
                  {k:'counterPrice',l:'Counter Offer (₹)',      ph:'265000'},
                ].map(f=>(
                  <div key={f.k}>
                    <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3}}>{f.l}</label>
                    <input type="number" value={negForm[f.k]} onChange={e=>setNF(f.k,e.target.value)}
                      placeholder={f.ph}
                      style={{width:'100%',padding:'7px 8px',border:'1px solid #ddd',borderRadius:5,fontSize:12,outline:'none',boxSizing:'border-box'}} />
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3}}>Discount Offered (%)</label>
                  <input type="number" value={negForm.discount} onChange={e=>setNF('discount',e.target.value)}
                    placeholder="0"
                    style={{width:'100%',padding:'7px 8px',border:'1px solid #ddd',borderRadius:5,fontSize:12,outline:'none',boxSizing:'border-box'}} />
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3}}>Status</label>
                  <select value={negForm.status} onChange={e=>setNF('status',e.target.value)}
                    style={{width:'100%',padding:'7px 8px',border:'1px solid #ddd',borderRadius:5,fontSize:12,outline:'none'}}>
                    <option value="OPEN">Open</option>
                    <option value="COUNTERED">Countered</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3}}>Notes</label>
                <textarea rows={2} value={negForm.notes} onChange={e=>setNF('notes',e.target.value)}
                  placeholder="Customer concerns, our justification, next steps…"
                  style={{width:'100%',padding:'7px 8px',border:'1px solid #ddd',borderRadius:5,fontSize:12,outline:'none',resize:'vertical',boxSizing:'border-box'}} />
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setShowNegForm(false)}
                  style={{padding:'6px 14px',borderRadius:5,border:'1px solid #ddd',background:'#fff',fontSize:12,cursor:'pointer'}}>Cancel</button>
                <button disabled={saving} onClick={async()=>{
                  if (!negForm.ourPrice) { toast.error('Our price required'); return }
                  setSaving(true)
                  try {
                    const r = await fetch(`${BASE_URL}/crm/leads/${id}/negotiations`, {
                      method:'POST', headers:hdr(),
                      body:JSON.stringify(negForm)
                    })
                    const d = await r.json()
                    if (!r.ok) throw new Error(d.error)
                    toast.success(d.message)
                    setNegForm({ ourPrice:'', theirPrice:'', counterPrice:'', discount:'0', notes:'', status:'OPEN' })
                    setShowNegForm(false)
                    load()
                  } catch(e) { toast.error(e.message) }
                  finally { setSaving(false) }
                }} style={{padding:'6px 16px',borderRadius:5,border:'none',
                  background:'#714B67',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  {saving?'Saving…':'✓ Save Round'}
                </button>
              </div>
            </div>
          )}

          {/* Negotiation History */}
          {negotiations.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              <div style={{fontSize:28,marginBottom:8}}>💰</div>
              <div style={{fontWeight:700}}>No negotiation rounds yet</div>
              <div style={{fontSize:12,marginTop:4}}>Click "New Round" to start tracking price negotiation</div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {negotiations.map((n,i)=>{
                const stClr = {OPEN:'#1565C0',COUNTERED:'#E65100',ACCEPTED:'#155724',REJECTED:'#C62828'}
                const stBg  = {OPEN:'#E3F2FD',COUNTERED:'#FFF3E0',ACCEPTED:'#D4EDDA',REJECTED:'#FFEBEE'}
                return (
                  <div key={n.id} style={{background:'#fff',borderRadius:8,border:'1px solid #E0D5E0',
                    borderLeft:`4px solid ${stClr[n.status]||'#714B67'}`,overflow:'hidden'}}>
                    <div style={{padding:'10px 16px',background:'#F8F9FA',display:'flex',
                      justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #E0D5E0'}}>
                      <div style={{fontWeight:700,fontSize:13}}>Round {n.round}</div>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:700,
                          background:stBg[n.status]||'#F0EEEB',color:stClr[n.status]||'#714B67'}}>
                          {n.status}
                        </span>
                        <span style={{fontSize:11,color:'#6C757D'}}>
                          {new Date(n.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                        </span>
                      </div>
                    </div>
                    <div style={{padding:'12px 16px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                      <div style={{textAlign:'center',padding:'8px',background:'#EDE0EA',borderRadius:6}}>
                        <div style={{fontSize:10,color:'#714B67',fontWeight:700,marginBottom:2}}>OUR PRICE</div>
                        <div style={{fontSize:16,fontWeight:800,color:'#714B67',fontFamily:'Syne,sans-serif'}}>
                          ₹{parseFloat(n.ourPrice||0).toLocaleString('en-IN')}
                        </div>
                        {n.discount>0&&<div style={{fontSize:10,color:'#E65100'}}>{n.discount}% disc offered</div>}
                      </div>
                      {n.theirPrice && (
                        <div style={{textAlign:'center',padding:'8px',background:'#FFEBEE',borderRadius:6}}>
                          <div style={{fontSize:10,color:'#C62828',fontWeight:700,marginBottom:2}}>CUSTOMER PRICE</div>
                          <div style={{fontSize:16,fontWeight:800,color:'#C62828',fontFamily:'Syne,sans-serif'}}>
                            ₹{parseFloat(n.theirPrice).toLocaleString('en-IN')}
                          </div>
                          <div style={{fontSize:10,color:'#6C757D'}}>
                            Gap: ₹{(parseFloat(n.ourPrice)-parseFloat(n.theirPrice)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}
                      {n.counterPrice && (
                        <div style={{textAlign:'center',padding:'8px',background:'#E8F5E9',borderRadius:6}}>
                          <div style={{fontSize:10,color:'#2E7D32',fontWeight:700,marginBottom:2}}>COUNTER OFFER</div>
                          <div style={{fontSize:16,fontWeight:800,color:'#2E7D32',fontFamily:'Syne,sans-serif'}}>
                            ₹{parseFloat(n.counterPrice).toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}
                    </div>
                    {n.notes&&<div style={{padding:'8px 16px',fontSize:12,color:'#495057',
                      borderTop:'1px solid #F0EEEB',background:'#FAFAFA'}}>📝 {n.notes}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Log Activity Modal */}
      {showActivity&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:480,boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67',marginBottom:14}}>Log Activity</div>

            {/* Activity type */}
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              {ACTIVITY_TYPES.map(t=>(
                <button key={t.value} onClick={()=>setActForm(p=>({...p,type:t.value}))}
                  style={{flex:1,padding:'8px 4px',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:600,
                    border:`2px solid ${actForm.type===t.value?'#714B67':'#E0D5E0'}`,
                    background:actForm.type===t.value?'#EDE0EA':'#fff',color:'#714B67'}}>
                  <div style={{fontSize:18}}>{t.icon}</div>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{marginBottom:10}}>
              <label style={lbl}>Subject *</label>
              <input style={inp} value={actForm.subject} onChange={e=>setActForm(p=>({...p,subject:e.target.value}))}
                placeholder={actForm.type==='call'?'Called about coating requirements...':actForm.type==='meeting'?'Meeting at customer site...':'Follow-up email sent...'}
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={lbl}>Notes</label>
              <textarea style={{...inp,height:70,resize:'none'}} value={actForm.notes}
                onChange={e=>setActForm(p=>({...p,notes:e.target.value}))}
                placeholder="Discussion outcome, next steps..."/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Scheduled At</label>
              <input type="datetime-local" style={inp} value={actForm.scheduledAt}
                onChange={e=>setActForm(p=>({...p,scheduledAt:e.target.value}))}/>
            </div>

            <div style={{display:'flex',gap:8}}>
              <button onClick={addActivity} disabled={saving}
                style={{flex:1,padding:'9px',background:'#714B67',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                {saving?'Saving...':'Log Activity'}
              </button>
              <button onClick={()=>setShowActivity(false)}
                style={{padding:'9px 16px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:7,fontSize:13,cursor:'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
