import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LEAD_SOURCES, LEAD_STATUSES, INDUSTRIES, SALESREPS } from './_crmData'

export default function LeadNew() {
  const nav = useNavigate()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    company:'',contact:'',phone:'',email:'',industry:'',
    source:'Website',owner:SALESREPS[0].name,status:'New Lead',
    requirement:'',value:'',nextFollowup:'',notes:'',
    website:'',city:'',state:'',gst:'',
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSave = () => {
    if(!form.company||!form.contact||!form.phone) { alert('Fill required fields'); return }
    setSaved(true)
  }

  if(saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',textAlign:'center'}}>
      <div style={{fontSize:'48px',marginBottom:'16px'}}></div>
      <h2 style={{fontFamily:'Syne,sans-serif',color:'var(--odoo-purple)',marginBottom:'8px'}}>Lead Created!</h2>
      <div style={{color:'var(--odoo-gray)',marginBottom:'24px'}}>LEAD-{String(Math.floor(Math.random()*90)+10).padStart(4,'0')} — {form.company} has been added to your pipeline.</div>
      <div style={{display:'flex',gap:'12px'}}>
        <button className="btn btn-p btn-s" onClick={()=>nav('/crm/leads')}>← Lead List</button>
        <button className="btn btn-s sd-bsm" onClick={()=>{setSaved(false);setForm({company:'',contact:'',phone:'',email:'',industry:'',source:'Website',owner:SALESREPS[0].name,status:'New Lead',requirement:'',value:'',nextFollowup:'',notes:'',website:'',city:'',state:'',gst:''})}}>+ Add Another</button>
        <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/opportunities/new')}>Convert to Opportunity →</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Lead <small>Capture lead information</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/leads')}>Cancel</button>
          <button className="btn btn-p btn-s" onClick={handleSave}>Save Lead</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'16px'}}>
        {/* Left — Company & Contact */}
        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3> Company Information</h3></div>
            <div className="fi-panel-body">
              <div className="sd-form-grid">
                <div className="sd-field">
                  <label>Company Name <span style={{color:'red'}}>*</span></label>
                  <input value={form.company} onChange={e=>set('company',e.target.value)} placeholder="Enter company name" />
                </div>
                <div className="sd-field">
                  <label>Industry</label>
                  <select value={form.industry} onChange={e=>set('industry',e.target.value)}>
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="sd-field">
                  <label>Website</label>
                  <input value={form.website} onChange={e=>set('website',e.target.value)} placeholder="www.example.com" />
                </div>
                <div className="sd-field">
                  <label>GST Number</label>
                  <input value={form.gst} onChange={e=>set('gst',e.target.value)} placeholder="29AAAAA0000A1Z5" />
                </div>
                <div className="sd-field">
                  <label>City</label>
                  <input value={form.city} onChange={e=>set('city',e.target.value)} placeholder="City" />
                </div>
                <div className="sd-field">
                  <label>State</label>
                  <input value={form.state} onChange={e=>set('state',e.target.value)} placeholder="State" />
                </div>
              </div>
            </div>
          </div>

          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3> Contact Person</h3></div>
            <div className="fi-panel-body">
              <div className="sd-form-grid">
                <div className="sd-field">
                  <label>Contact Person <span style={{color:'red'}}>*</span></label>
                  <input value={form.contact} onChange={e=>set('contact',e.target.value)} placeholder="Full name" />
                </div>
                <div className="sd-field">
                  <label>Designation</label>
                  <input placeholder="e.g. Purchase Manager" />
                </div>
                <div className="sd-field">
                  <label>Phone <span style={{color:'red'}}>*</span></label>
                  <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="10-digit mobile" />
                </div>
                <div className="sd-field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="email@company.com" />
                </div>
              </div>
            </div>
          </div>

          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>Requirement</h3></div>
            <div className="fi-panel-body">
              <div className="sd-field">
                <label>Requirement / Inquiry Description</label>
                <textarea rows={3} value={form.requirement} onChange={e=>set('requirement',e.target.value)}
                  placeholder="Describe what the customer is looking for..." style={{width:'100%',resize:'vertical'}} />
              </div>
              <div className="sd-form-grid" style={{marginTop:'10px'}}>
                <div className="sd-field">
                  <label>Estimated Value (₹)</label>
                  <input type="number" value={form.value} onChange={e=>set('value',e.target.value)} placeholder="0" />
                </div>
                <div className="sd-field">
                  <label>Next Follow-up Date</label>
                  <input type="date" value={form.nextFollowup} onChange={e=>set('nextFollowup',e.target.value)} />
                </div>
              </div>
              <div className="sd-field" style={{marginTop:'10px'}}>
                <label>Internal Notes</label>
                <textarea rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)}
                  placeholder="Internal notes visible only to your team..." style={{width:'100%',resize:'vertical'}} />
              </div>
            </div>
          </div>
        </div>

        {/* Right — Lead Details */}
        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3> Lead Details</h3></div>
            <div className="fi-panel-body">
              <div className="sd-field">
                <label>Lead Source</label>
                <select value={form.source} onChange={e=>set('source',e.target.value)}>
                  {LEAD_SOURCES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="sd-field" style={{marginTop:'10px'}}>
                <label>Lead Status</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)}>
                  {LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="sd-field" style={{marginTop:'10px'}}>
                <label>Assign To</label>
                <select value={form.owner} onChange={e=>set('owner',e.target.value)}>
                  {SALESREPS.map(r=><option key={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>Source Conversion Stats</h3></div>
            <div className="fi-panel-body">
              {[{s:'Referral',r:'50%'},{s:'Exhibition',r:'30%'},{s:'Website',r:'25%'},{s:'Cold Calling',r:'8%'}].map(x=>(
                <div key={x.s} style={{display:'flex',justifyContent:'space-between',fontSize:'12px',padding:'4px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                  <span>{x.s}</span>
                  <strong style={{color:'var(--odoo-green)'}}>{x.r} conv. rate</strong>
                </div>
              ))}
              <div style={{marginTop:'8px',fontSize:'11px',color:'var(--odoo-gray)'}}> Referral leads have highest conversion</div>
            </div>
          </div>

          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3> AI Suggestion</h3></div>
            <div className="fi-panel-body">
              <div style={{background:'#EDE0EA',borderRadius:'6px',padding:'10px',fontSize:'12px'}}>
                <div style={{fontWeight:'700',color:'var(--odoo-purple)',marginBottom:'4px'}}> Win Tips</div>
                {form.industry==='Automotive'
                  ? <div>Auto industry leads close <strong>40% faster</strong> with a plant demo. Schedule within 5 days.</div>
                  : form.source==='Referral'
                  ? <div>Referral leads convert <strong>2x better</strong>. Contact within 24 hrs for best results.</div>
                  : <div>Fill requirement details for better AI recommendations.</div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
