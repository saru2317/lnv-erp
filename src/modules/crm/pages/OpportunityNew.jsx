import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { OPP_STAGES } from './_crmData'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

// Reusable searchable dropdown component
function SearchDropdown({ label, required, value, onChange, onSelect, options, placeholder, renderOption, renderSelected, extra }) {
  const [open, setOpen]   = useState(false)
  const [q,    setQ]      = useState(value||'')
  const ref = useRef(null)

  useEffect(() => { setQ(value||'') }, [value])

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const filtered = q
    ? options.filter(o => JSON.stringify(o).toLowerCase().includes(q.toLowerCase())).slice(0,12)
    : options.slice(0,12)

  return (
    <div className="sd-field" ref={ref} style={{position:'relative'}}>
      <label>{label}{required && <span style={{color:'red'}}> *</span>}</label>
      <input value={q}
        onChange={e=>{ setQ(e.target.value); onChange && onChange(e.target.value); setOpen(true) }}
        onFocus={()=>setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        style={{width:'100%'}}
      />
      {extra}
      {open && (
        <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:9999,
          background:'#fff',border:'1.5px solid #714B67',borderRadius:6,
          boxShadow:'0 6px 20px rgba(0,0,0,.15)',maxHeight:240,overflowY:'auto'}}>
          {filtered.length === 0 ? (
            <div style={{padding:'10px 14px',fontSize:12,color:'#6C757D'}}>No results found</div>
          ) : filtered.map((o,i) => (
            <div key={i}
              onClick={()=>{ onSelect(o); setOpen(false) }}
              style={{padding:'8px 14px',cursor:'pointer',fontSize:12,borderBottom:'1px solid #F0EEEB'}}
              onMouseEnter={e=>e.currentTarget.style.background='#EDE0EA'}
              onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
              {renderOption(o)}
            </div>
          ))}
          {/* Free-text option */}
          {q && !filtered.find(o=>renderOption(o)===q) && (
            <div onClick={()=>{ onChange&&onChange(q); onSelect({_free:q}); setOpen(false) }}
              style={{padding:'8px 14px',cursor:'pointer',fontSize:12,color:'#714B67',fontWeight:600,background:'#F8F4F8',borderTop:'1px solid #E0D5E0'}}>
              + Use "{q}" as free text
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OpportunityNew() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({
    company:'', customerId:'', contact:'', contactId:'',
    itemId:'', product:'', value:'',
    stage:'Requirement Understanding', closeDate:'',
    owner:'', winProb:'50', competitor:'', notes:'',
    leadId:'', paymentTerms:'30 Days',
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const [customers,  setCustomers]  = useState([])
  const [items,      setItems]      = useState([])
  const [leads,      setLeads]      = useState([])
  const [users,      setUsers]      = useState([])
  const [contacts,   setContacts]   = useState([]) // contacts of selected customer
  const [saving,     setSaving]     = useState(false)

  // Load masters
  useEffect(() => {
    // Customers from SD module
    fetch(`${BASE_URL}/sd/customers?limit=500`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setCustomers(d.data||[])).catch(()=>{})
    // Items — FG and SFG only (finished/semi-finished goods for sales)
    fetch(`${BASE_URL}/mdm/items?limit=500`, { headers:hdr2() })
      .then(r=>r.json())
      .then(d=>setItems((d.data||[]).filter(i=>['FG','SFG'].includes(i.itemType))))
      .catch(()=>{})
    fetch(`${BASE_URL}/crm/leads?limit=100`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setLeads(d.data||[])).catch(()=>{})
    fetch(`${BASE_URL}/auth/users`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setUsers(d.data||[])).catch(()=>{})
  }, [])

  // Pre-fill from URL params (from CustomerView → New Opportunity button)
  useEffect(() => {
    const custId   = searchParams.get('customerId')
    const custName = searchParams.get('customerName')
    const leadId   = searchParams.get('leadId')
    if (custId)   set('customerId', custId)
    if (custName) set('company', custName)
    if (leadId)   set('leadId', leadId)
  }, [searchParams])

  // When customer is pre-filled from URL, load their contacts
  useEffect(() => {
    if (form.customerId && customers.length) {
      const c = customers.find(c=>String(c.id)===String(form.customerId))
      if (c) {
        const ctcts = Array.isArray(c.contacts) ? c.contacts : []
        setContacts(ctcts)
      }
    }
  }, [form.customerId, customers])

  // On customer select — load contacts from customer.contacts JSON
  const handleSelectCustomer = (c) => {
    if (c._free) { set('company', c._free); set('customerId',''); setContacts([]); return }
    set('company',    c.name)
    set('customerId', c.id)
    const ctcts = Array.isArray(c.contacts) ? c.contacts : []
    setContacts(ctcts)
    // Auto-fill first contact if available
    if (ctcts.length > 0) {
      set('contact', ctcts[0].name || ctcts[0].contactName || '')
    } else if (c.phone || c.email) {
      set('contact', c.contactPerson || '')
    }
  }

  // On item select
  const handleSelectItem = (item) => {
    if (item._free) { set('product', item._free); set('itemId',''); return }
    set('product', item.name)
    set('itemId',  item.id)
  }

  const handleSave = async () => {
    if (!form.company) { toast.error('Customer is required'); return }
    if (!form.product) { toast.error('Product/Service is required'); return }
    setSaving(true)
    try {
      const payload = {
        company:      form.company,
        customerId:   form.customerId ? parseInt(form.customerId) : null,
        contactName:  form.contact || null,
        title:        form.product,
        dealValue:    form.value ? parseFloat(form.value) : null,
        stage:        form.stage,
        expectedCloseDate: form.closeDate ? new Date(form.closeDate) : null,
        assignedTo:   form.owner || null,
        winProbability: parseInt(form.winProb)||50,
        competitor:   form.competitor || null,
        notes:        form.notes || null,
        leadId:       form.leadId ? parseInt(form.leadId) : null,
        paymentTerms: form.paymentTerms,
      }
      const r = await fetch(`${BASE_URL}/crm/opportunities`, { method:'POST', headers:hdr(), body:JSON.stringify(payload) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(`${d.data?.oppNo || 'Opportunity'} created!`)
      nav('/crm/opportunities')
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const salesUsers = users.filter(u=>['SALES','MANAGER','ADMIN','SUPER_ADMIN'].includes(u.role))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Opportunity <small>Convert lead / customer to opportunity</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/opportunities')}>Cancel</button>
          <button className="btn btn-p btn-s" onClick={handleSave} disabled={saving}>
            {saving?'Saving…':'✓ Save Opportunity'}
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
        <div>
          <div className="fi-panel" style={{marginBottom:14}}>
            <div className="fi-panel-hdr"><h3>Opportunity Details</h3></div>
            <div className="fi-panel-body">
              <div className="sd-form-grid">

                {/* ── Customer Master Dropdown ── */}
                <SearchDropdown
                  label="Customer" required
                  value={form.company}
                  placeholder="Search customer master…"
                  options={customers}
                  onChange={v=>{ set('company',v); set('customerId','') }}
                  onSelect={handleSelectCustomer}
                  renderOption={c=>c._free?`+ "${c._free}"`:
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:12}}>{c.name}</div>
                        <div style={{fontSize:10,color:'#6C757D'}}>{c.city||''}{c.state?`, ${c.state}`:''}</div>
                      </div>
                      <code style={{fontSize:10,color:'#714B67',background:'#EDE0EA',padding:'1px 6px',borderRadius:4}}>{c.code}</code>
                    </div>}
                  extra={form.customerId&&<div style={{fontSize:10,color:'#2E7D32',marginTop:2}}>✅ Linked to Customer Master</div>}
                />

                {/* ── Contact Person — from customer contacts JSON ── */}
                <div className="sd-field">
                  <label>Contact Person</label>
                  {contacts.length > 0 ? (
                    <select value={form.contact} onChange={e=>set('contact',e.target.value)}>
                      <option value="">— Select Contact —</option>
                      {contacts.map((c,i)=>(
                        <option key={i} value={c.name||c.contactName||''}>
                          {c.name||c.contactName||''}{c.designation?` (${c.designation})`:''}{c.mobile?` · ${c.mobile}`:''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input value={form.contact} onChange={e=>set('contact',e.target.value)}
                      placeholder={form.customerId?"No contacts in master — type name":"Select customer first"} />
                  )}
                </div>

                {/* ── Item / Product Master Dropdown ── */}
                <SearchDropdown
                  label="Product / Service" required
                  value={form.product}
                  placeholder="Search item master…"
                  options={items}
                  onChange={v=>{ set('product',v); set('itemId','') }}
                  onSelect={handleSelectItem}
                  renderOption={item=>item._free?`+ "${item._free}"`:
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:12}}>{item.name}</div>
                        <div style={{fontSize:10,color:'#6C757D'}}>{item.category||item.itemGroup||''} · {item.uom||''}</div>
                      </div>
                      <code style={{fontSize:10,color:'#1565C0',background:'#E3F2FD',padding:'1px 6px',borderRadius:4}}>{item.code}</code>
                    </div>}
                  extra={form.itemId&&<div style={{fontSize:10,color:'#2E7D32',marginTop:2}}>✅ Linked to Item Master</div>}
                />

                <div className="sd-field">
                  <label>Expected Value (₹)</label>
                  <input type="number" value={form.value}
                    onChange={e=>set('value',e.target.value)} placeholder="0" />
                </div>

                <div className="sd-field">
                  <label>Expected Close Date</label>
                  <input type="date" value={form.closeDate}
                    onChange={e=>set('closeDate',e.target.value)} />
                </div>

                <div className="sd-field">
                  <label>Win Probability (%)</label>
                  <input type="number" min="0" max="100" value={form.winProb}
                    onChange={e=>set('winProb',e.target.value)} />
                </div>

                <div className="sd-field">
                  <label>Payment Terms</label>
                  <select value={form.paymentTerms} onChange={e=>set('paymentTerms',e.target.value)}>
                    {['Advance','15 Days','30 Days','45 Days','60 Days','LC'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="sd-field">
                  <label>Competitor</label>
                  <input value={form.competitor} onChange={e=>set('competitor',e.target.value)}
                    placeholder="Competing vendor (if any)" />
                </div>

                <div className="sd-field">
                  <label>Link to Lead</label>
                  <select value={form.leadId} onChange={e=>set('leadId',e.target.value)}>
                    <option value="">— None —</option>
                    {leads.map(l=>(
                      <option key={l.id} value={l.id}>
                        {l.leadNo} — {l.companyName||l.company}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="sd-field" style={{marginTop:10}}>
                <label>Notes</label>
                <textarea rows={3} value={form.notes} onChange={e=>set('notes',e.target.value)}
                  placeholder="Key requirements, technical notes, competitive intel…"
                  style={{width:'100%',resize:'vertical'}} />
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Pipeline Stage */}
          <div className="fi-panel" style={{marginBottom:14}}>
            <div className="fi-panel-hdr"><h3>Pipeline Stage</h3></div>
            <div className="fi-panel-body">
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {OPP_STAGES.filter(s=>s!=='Won'&&s!=='Lost').map((s,i)=>(
                  <div key={s} onClick={()=>set('stage',s)}
                    style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',
                      padding:'6px 10px',borderRadius:6,border:'1px solid',
                      borderColor:form.stage===s?'#714B67':'var(--odoo-border)',
                      background:form.stage===s?'#EDE0EA':'#fff'}}>
                    <div style={{width:20,height:20,borderRadius:'50%',flexShrink:0,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      background:form.stage===s?'#714B67':'#CCC',
                      color:'#fff',fontSize:10,fontWeight:700}}>{i+1}</div>
                    <span style={{fontSize:12,fontWeight:form.stage===s?700:400}}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assign */}
          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>Assign To</h3></div>
            <div className="fi-panel-body">
              <div className="sd-field">
                <label>Sales Rep</label>
                <select value={form.owner} onChange={e=>set('owner',e.target.value)}>
                  <option value="">— Select —</option>
                  {salesUsers.map(u=>(
                    <option key={u.id} value={u.name}>{u.name} · {u.role}</option>
                  ))}
                </select>
              </div>

              {/* Win probability bar */}
              <div style={{marginTop:10,padding:12,background:'#F0EEEB',borderRadius:6}}>
                <div style={{fontSize:11,fontWeight:700,color:'#714B67',marginBottom:8}}>Win Probability</div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{flex:1,background:'#e0e0e0',borderRadius:4,height:10}}>
                    <div style={{width:`${form.winProb||0}%`,height:'100%',borderRadius:4,transition:'width .3s',
                      background:form.winProb>=70?'#2E7D32':form.winProb>=40?'#E65100':'#C62828'}}/>
                  </div>
                  <strong style={{fontSize:14,minWidth:36}}>{form.winProb||0}%</strong>
                </div>
              </div>

              {/* Summary */}
              {(form.company||form.product) && (
                <div style={{marginTop:12,padding:12,background:'#fff',border:'1px solid var(--odoo-border)',borderRadius:6,fontSize:11}}>
                  <div style={{fontWeight:700,marginBottom:6,color:'#1C1C1C'}}>Summary</div>
                  {form.company&&<div style={{marginBottom:3}}><span style={{color:'#6C757D'}}>Customer:</span> <strong>{form.company}</strong></div>}
                  {form.product&&<div style={{marginBottom:3}}><span style={{color:'#6C757D'}}>Product:</span> {form.product}</div>}
                  {form.value&&<div style={{marginBottom:3}}><span style={{color:'#6C757D'}}>Value:</span> <strong style={{color:'#2E7D32'}}>₹{parseFloat(form.value).toLocaleString('en-IN')}</strong></div>}
                  {form.closeDate&&<div><span style={{color:'#6C757D'}}>Close by:</span> {form.closeDate}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
