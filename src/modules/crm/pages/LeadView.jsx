import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DealCompetitor from './DealCompetitor'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const STAGES = [
  { key:'NEW',         label:'New',          color:'#6C757D' },
  { key:'CONTACTED',   label:'Contacted',    color:'#004085' },
  { key:'QUALIFIED',   label:'Qualified',    color:'#856404' },
  { key:'PROPOSAL',    label:'Proposal Sent',color:'#4B2E83' },
  { key:'NEGOTIATION', label:'Negotiation',  color:'#0C5460' },
  { key:'WON',         label:'Won',          color:'#155724' },
  { key:'LOST',        label:'Lost',         color:'#721C24' },
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
  const [activities,  setActivities]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showActivity,setShowActivity]= useState(false)
  const [actForm,     setActForm]     = useState({ type:'call', subject:'', notes:'', scheduledAt:'' })
  const [saving,      setSaving]      = useState(false)
  const [activeTab,   setActiveTab]   = useState('info')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [lr, ar] = await Promise.all([
        fetch(`${BASE_URL}/crm/leads/${id}`, { headers: hdr2() }).then(r=>r.json()),
        fetch(`${BASE_URL}/crm/leads/${id}/activities`, { headers: hdr2() }).then(r=>r.json()),
      ])
      setLead(lr.data||lr)
      setActivities(Array.isArray(ar.data) ? ar.data : Array.isArray(ar) ? ar : [])
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
      setLead(l=>({...l, stage:newStage}))
      toast.success(`Stage updated to ${newStage}`)
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
              {lead.company||lead.name}
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
          {/* CREATE QUOTATION — main CRM→SD link */}
          <button onClick={createQuotation}
            style={{padding:'7px 16px',background:'#0C5460',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            📋 Create Quotation
          </button>
          {lead.stage!=='WON'&&lead.stage!=='LOST'&&(
            <>
              <button onClick={()=>updateStage('WON')}
                style={{padding:'7px 14px',background:'#D4EDDA',color:'#155724',border:'1px solid #C3E6CB',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                🏆 Mark Won
              </button>
              <button onClick={()=>updateStage('LOST')}
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
          {STAGES.filter(s=>!['WON','LOST'].includes(s.key)).map((s,i,arr)=>{
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
        {lead.stage==='WON'&&<div style={{marginTop:8,textAlign:'center',fontWeight:700,color:'#155724',fontSize:13}}>🏆 Lead Won!</div>}
        {lead.stage==='LOST'&&<div style={{marginTop:8,textAlign:'center',fontWeight:700,color:'#721C24',fontSize:13}}>✗ Lead Lost</div>}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:14,padding:'5px 8px',background:'#F0EEEB',borderRadius:8}}>
        {[['info','\uD83D\uDCCB Info'],['activities','\uD83D\uDCC5 Activities'],['quotations','\uD83D\uDCCB Quotations'],['competitors','\uD83C\uDFAF Competitors']].map(([k,l])=>(
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
