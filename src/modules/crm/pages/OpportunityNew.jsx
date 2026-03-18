import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OPP_STAGES, LEADS, SALESREPS, CUSTOMERS } from './_crmData'

export default function OpportunityNew() {
  const nav = useNavigate()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    company:'',contact:'',product:'',value:'',stage:'Requirement Understanding',
    closeDate:'',owner:SALESREPS[0].name,winProb:'50',competitor:'',notes:'',
    leadId:'',customerId:'',paymentTerms:'30 Days',
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSave = () => {
    if(!form.company||!form.product) { alert('Fill required fields'); return }
    setSaved(true)
  }

  if(saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',textAlign:'center'}}>
      <div style={{fontSize:'48px',marginBottom:'16px'}}>📊</div>
      <h2 style={{fontFamily:'Syne,sans-serif',color:'var(--odoo-orange)',marginBottom:'8px'}}>Opportunity Created!</h2>
      <div style={{color:'var(--odoo-gray)',marginBottom:'24px'}}>OPP-{String(Math.floor(Math.random()*90)+19).padStart(4,'0')} — {form.company} has been added to the pipeline.</div>
      <div style={{display:'flex',gap:'12px'}}>
        <button className="btn btn-p btn-s" onClick={()=>nav('/crm/opportunities')}>← Opportunities</button>
        <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/quotations/new')}>Create Quotation →</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Opportunity <small>Convert lead to sales opportunity</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/opportunities')}>Cancel</button>
          <button className="btn btn-p btn-s" onClick={handleSave}>💾 Save Opportunity</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'16px'}}>
        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>📋 Opportunity Details</h3></div>
            <div className="fi-panel-body">
              <div className="sd-form-grid">
                <div className="sd-field">
                  <label>Company <span style={{color:'red'}}>*</span></label>
                  <input value={form.company} onChange={e=>set('company',e.target.value)} placeholder="Company name" />
                </div>
                <div className="sd-field">
                  <label>Contact Person</label>
                  <input value={form.contact} onChange={e=>set('contact',e.target.value)} placeholder="Contact name" />
                </div>
                <div className="sd-field" style={{gridColumn:'1/-1'}}>
                  <label>Product / Service <span style={{color:'red'}}>*</span></label>
                  <input value={form.product} onChange={e=>set('product',e.target.value)} placeholder="e.g. Zinc Phosphating Line, Powder Coating Setup" />
                </div>
                <div className="sd-field">
                  <label>Expected Value (₹)</label>
                  <input type="number" value={form.value} onChange={e=>set('value',e.target.value)} placeholder="0" />
                </div>
                <div className="sd-field">
                  <label>Expected Close Date</label>
                  <input type="date" value={form.closeDate} onChange={e=>set('closeDate',e.target.value)} />
                </div>
                <div className="sd-field">
                  <label>Win Probability (%)</label>
                  <input type="number" min="0" max="100" value={form.winProb} onChange={e=>set('winProb',e.target.value)} />
                </div>
                <div className="sd-field">
                  <label>Payment Terms</label>
                  <select value={form.paymentTerms} onChange={e=>set('paymentTerms',e.target.value)}>
                    {['Advance','15 Days','30 Days','45 Days','60 Days','LC'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="sd-field">
                  <label>Competitor</label>
                  <input value={form.competitor} onChange={e=>set('competitor',e.target.value)} placeholder="Competing vendor (if any)" />
                </div>
                <div className="sd-field">
                  <label>Link to Lead</label>
                  <select value={form.leadId} onChange={e=>set('leadId',e.target.value)}>
                    <option value="">— None —</option>
                    {LEADS.filter(l=>l.status==='Qualified').map(l=><option key={l.id} value={l.id}>{l.id} — {l.company}</option>)}
                  </select>
                </div>
              </div>
              <div className="sd-field" style={{marginTop:'10px'}}>
                <label>Notes</label>
                <textarea rows={3} value={form.notes} onChange={e=>set('notes',e.target.value)}
                  placeholder="Key requirements, technical notes, competitive intel…" style={{width:'100%',resize:'vertical'}} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>📊 Pipeline Stage</h3></div>
            <div className="fi-panel-body">
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {OPP_STAGES.filter(s=>s!=='Won'&&s!=='Lost').map((s,i)=>(
                  <div key={s} style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',
                    padding:'6px 10px',borderRadius:'6px',border:'1px solid',
                    borderColor:form.stage===s?'var(--odoo-purple)':'var(--odoo-border)',
                    background:form.stage===s?'#EDE0EA':'#fff'}}
                    onClick={()=>set('stage',s)}>
                    <div style={{width:'20px',height:'20px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                      background:form.stage===s?'var(--odoo-purple)':'var(--odoo-border)',color:'#fff',fontSize:'10px',fontWeight:'700'}}>
                      {i+1}
                    </div>
                    <span style={{fontSize:'12px',fontWeight:form.stage===s?'700':'400'}}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>👤 Assign</h3></div>
            <div className="fi-panel-body">
              <div className="sd-field">
                <label>Sales Rep</label>
                <select value={form.owner} onChange={e=>set('owner',e.target.value)}>
                  {SALESREPS.map(r=><option key={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div style={{marginTop:'10px',padding:'10px',background:'#F0EEEB',borderRadius:'6px',fontSize:'12px'}}>
                <div style={{fontWeight:'700',color:'var(--odoo-purple)',marginBottom:'6px'}}>📊 Win Probability</div>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <div style={{flex:1,background:'#e0e0e0',borderRadius:'4px',height:'8px'}}>
                    <div style={{width:`${form.winProb||0}%`,height:'100%',borderRadius:'4px',
                      background:form.winProb>=70?'var(--odoo-green)':form.winProb>=40?'var(--odoo-orange)':'var(--odoo-red)',
                      transition:'width .3s'}}></div>
                  </div>
                  <strong>{form.winProb||0}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
