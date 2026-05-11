import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const SOURCES   = ['Website','Cold Call','Referral','Trade Show','Social Media','Email Campaign','Walk-in','Existing Customer','Other']
const INDUSTRIES= ['Surface Treatment','Textile','Automotive','Engineering','Food & Beverage','Pharma','Construction','General Manufacturing','Other']
const STAGES    = ['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION']

export default function LeadNew() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    company:'', contactName:'', designation:'', email:'', phone:'', mobile:'',
    source:'Website', industry:'', stage:'NEW', assignedTo:'',
    dealValue:'', expectedCloseDate:'', requirements:'', notes:'',
    address:'', city:'', state:'', country:'India',
  })

  const F = k => ({
    value: form[k]??'',
    onChange: e => setForm(p=>({...p,[k]:e.target.value})),
    onFocus: e => e.target.style.borderColor='#714B67',
    onBlur:  e => e.target.style.borderColor='#E0D5E0',
  })

  const save = async () => {
    if (!form.company) return toast.error('Company name is required')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/crm/leads`, {
        method:'POST', headers: hdr(), body: JSON.stringify(form)
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error||'Failed to save')
      toast.success(`Lead created: ${d.data?.leadNo||d.leadNo||''}`)
      navigate('/crm/leads/'+( d.data?.id||d.id ))
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>New Lead</div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>navigate('/crm/leads')}
            style={{padding:'7px 16px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            {saving?'Saving...':'Save Lead'}
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:14}}>
        {/* Main form */}
        <div>
          {/* Company info */}
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Company Information</div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12,marginBottom:10}}>
              <div>
                <label style={lbl}>Company Name *</label>
                <input style={inp} {...F('company')} placeholder="ABC Industries Pvt. Ltd."/>
              </div>
              <div>
                <label style={lbl}>Industry</label>
                <select style={{...inp,cursor:'pointer'}} value={form.industry} onChange={e=>setForm(p=>({...p,industry:e.target.value}))}>
                  <option value="">Select...</option>
                  {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Source *</label>
                <select style={{...inp,cursor:'pointer'}} value={form.source} onChange={e=>setForm(p=>({...p,source:e.target.value}))}>
                  {SOURCES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              <div>
                <label style={lbl}>City</label>
                <input style={inp} {...F('city')} placeholder="Coimbatore"/>
              </div>
              <div>
                <label style={lbl}>State</label>
                <input style={inp} {...F('state')} placeholder="Tamil Nadu"/>
              </div>
              <div>
                <label style={lbl}>Country</label>
                <input style={inp} {...F('country')} placeholder="India"/>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Contact Person</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:10}}>
              <div>
                <label style={lbl}>Contact Name</label>
                <input style={inp} {...F('contactName')} placeholder="Mr. Ramesh Kumar"/>
              </div>
              <div>
                <label style={lbl}>Designation</label>
                <input style={inp} {...F('designation')} placeholder="Purchase Manager"/>
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" style={inp} {...F('email')} placeholder="contact@company.com"/>
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input style={inp} {...F('phone')} placeholder="044-12345678"/>
              </div>
              <div>
                <label style={lbl}>Mobile</label>
                <input style={inp} {...F('mobile')} placeholder="9876543210"/>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Requirements & Notes</div>
            <div style={{marginBottom:10}}>
              <label style={lbl}>Requirements / Product Interest</label>
              <textarea style={{...inp,height:80,resize:'vertical'}}
                value={form.requirements} onChange={e=>setForm(p=>({...p,requirements:e.target.value}))}
                placeholder="Powder coating on steel brackets, approx 5000 pcs/month, RAL 9005..."/>
            </div>
            <div>
              <label style={lbl}>Internal Notes</label>
              <textarea style={{...inp,height:60,resize:'vertical'}}
                value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                placeholder="Referred by existing customer XYZ. Decision maker is MD..."/>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div>
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Lead Details</div>
            <div style={{marginBottom:10}}>
              <label style={lbl}>Stage</label>
              <select style={{...inp,cursor:'pointer'}} value={form.stage} onChange={e=>setForm(p=>({...p,stage:e.target.value}))}>
                {STAGES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{marginBottom:10}}>
              <label style={lbl}>Deal Value (₹)</label>
              <input type="number" style={inp} {...F('dealValue')} placeholder="500000"/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={lbl}>Expected Close Date</label>
              <input type="date" style={inp} {...F('expectedCloseDate')}/>
            </div>
            <div>
              <label style={lbl}>Assigned To</label>
              <input style={inp} {...F('assignedTo')} placeholder="Sales rep name"/>
            </div>
          </div>

          <button onClick={save} disabled={saving}
            style={{width:'100%',padding:12,background:'#714B67',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}>
            {saving?'Saving...':'\uD83D\uDCCC Save Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}
