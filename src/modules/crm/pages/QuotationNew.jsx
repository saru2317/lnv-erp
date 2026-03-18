import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OPPORTUNITIES, SALESREPS, fmtFull } from './_crmData'

const PRODUCTS = [
  {name:'Zinc Phosphating Line',price:800000},
  {name:'Powder Coating System',price:1200000},
  {name:'E-Coat Paint Line',price:2200000},
  {name:'Hot Dip Galvanizing',price:1500000},
  {name:'Passivation Treatment Pack',price:350000},
  {name:'Chemical Treatment Annual Pack',price:320000},
  {name:'Anodizing Setup',price:650000},
  {name:'Chrome Plating Unit',price:950000},
  {name:'Annual Maintenance Contract',price:480000},
]

export default function QuotationNew() {
  const nav = useNavigate()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    oppId:'',company:'',contact:'',product:'',price:'',discount:'0',
    deliveryDays:'30',validity:'2025-03-31',paymentTerms:'30 Days',
    owner:SALESREPS[0].name,notes:'',taxRate:'18',
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const gross    = parseFloat(form.price)||0
  const disc     = gross * (parseFloat(form.discount)||0) / 100
  const afterDisc= gross - disc
  const tax      = afterDisc * (parseFloat(form.taxRate)||18) / 100
  const total    = afterDisc + tax

  const handleProductSelect = (name) => {
    const p = PRODUCTS.find(x=>x.name===name)
    set('product',name)
    if(p) set('price',p.price)
  }

  const handleOppSelect = (id) => {
    const o = OPPORTUNITIES.find(x=>x.id===id)
    set('oppId',id)
    if(o){set('company',o.company);set('contact',o.contact)}
  }

  if(saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',textAlign:'center'}}>
      <div style={{fontSize:'48px',marginBottom:'16px'}}>📄</div>
      <h2 style={{fontFamily:'Syne,sans-serif',color:'var(--odoo-blue)',marginBottom:'8px'}}>Quotation Created!</h2>
      <div style={{fontFamily:'DM Mono,monospace',fontSize:'18px',fontWeight:'700',color:'var(--odoo-purple)',marginBottom:'8px'}}>
        QT-CRM-{String(Math.floor(Math.random()*90)+29).padStart(4,'0')}
      </div>
      <div style={{color:'var(--odoo-gray)',marginBottom:'24px'}}>{form.company} — {fmtFull(total)} (incl. GST)</div>
      <div style={{display:'flex',gap:'12px'}}>
        <button className="btn btn-p btn-s" onClick={()=>nav('/crm/quotations')}>← Quotations</button>
        <button className="btn btn-s sd-bsm">📧 Send to Customer</button>
        <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/quotations')}>Print</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Quotation <small>Create and send to customer</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/quotations')}>Cancel</button>
          <button className="btn btn-s sd-bsm" onClick={handleSave => setSaved(true)}>Save Draft</button>
          <button className="btn btn-p btn-s" onClick={()=>setSaved(true)}>📧 Save & Send</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'16px'}}>
        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>🏢 Customer Details</h3></div>
            <div className="fi-panel-body">
              <div className="sd-form-grid">
                <div className="sd-field">
                  <label>Link to Opportunity</label>
                  <select value={form.oppId} onChange={e=>handleOppSelect(e.target.value)}>
                    <option value="">— Select Opportunity —</option>
                    {OPPORTUNITIES.filter(o=>o.stage!=='Won'&&o.stage!=='Lost').map(o=><option key={o.id} value={o.id}>{o.id} — {o.company}</option>)}
                  </select>
                </div>
                <div className="sd-field">
                  <label>Company</label>
                  <input value={form.company} onChange={e=>set('company',e.target.value)} placeholder="Company name" />
                </div>
                <div className="sd-field">
                  <label>Contact Person</label>
                  <input value={form.contact} onChange={e=>set('contact',e.target.value)} placeholder="Contact name" />
                </div>
                <div className="sd-field">
                  <label>Payment Terms</label>
                  <select value={form.paymentTerms} onChange={e=>set('paymentTerms',e.target.value)}>
                    {['Advance','15 Days','30 Days','45 Days','60 Days','LC'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="sd-field">
                  <label>Delivery (Days)</label>
                  <input type="number" value={form.deliveryDays} onChange={e=>set('deliveryDays',e.target.value)} />
                </div>
                <div className="sd-field">
                  <label>Valid Until</label>
                  <input type="date" value={form.validity} onChange={e=>set('validity',e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>Product / Service</h3></div>
            <div className="fi-panel-body">
              <div className="sd-form-grid">
                <div className="sd-field" style={{gridColumn:'1/-1'}}>
                  <label>Product / Service</label>
                  <select value={form.product} onChange={e=>handleProductSelect(e.target.value)}>
                    <option value="">— Select Product —</option>
                    {PRODUCTS.map(p=><option key={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="sd-field">
                  <label>Base Price (₹)</label>
                  <input type="number" value={form.price} onChange={e=>set('price',e.target.value)} />
                </div>
                <div className="sd-field">
                  <label>Discount (%)</label>
                  <input type="number" min="0" max="100" value={form.discount} onChange={e=>set('discount',e.target.value)} />
                </div>
                <div className="sd-field">
                  <label>GST Rate (%)</label>
                  <select value={form.taxRate} onChange={e=>set('taxRate',e.target.value)}>
                    <option value="0">0%</option><option value="5">5%</option>
                    <option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                  </select>
                </div>
              </div>
              {/* Price Calculation */}
              <div style={{marginTop:'14px',background:'#F8F9FA',borderRadius:'8px',padding:'12px'}}>
                {[
                  ['Base Price','',gross],['Discount',`(${form.discount||0}%)`,disc],
                  ['After Discount','',afterDisc],['GST',`(${form.taxRate}%)`,tax],
                ].map(([l,s,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',
                    borderBottom:'1px solid var(--odoo-border)',fontSize:'12px'}}>
                    <span>{l} <span style={{color:'var(--odoo-gray)'}}>{s}</span></span>
                    <span style={{fontFamily:'DM Mono,monospace'}}>{fmtFull(v)}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0 0',fontWeight:'800',fontSize:'14px',color:'var(--odoo-purple)'}}>
                  <span>Total (incl. GST)</span>
                  <span style={{fontFamily:'DM Mono,monospace'}}>{fmtFull(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>📝 Terms & Notes</h3></div>
            <div className="fi-panel-body">
              <div className="sd-field">
                <label>Notes / Special Terms</label>
                <textarea rows={3} value={form.notes} onChange={e=>set('notes',e.target.value)}
                  placeholder="Any special terms, warranty, installation support details…" style={{width:'100%'}} />
              </div>
            </div>
          </div>
        </div>

        {/* Right — Summary */}
        <div>
          <div className="fi-panel" style={{marginBottom:'14px',background:'linear-gradient(135deg,var(--odoo-purple),#875A7B)',color:'#fff'}}>
            <div className="fi-panel-hdr" style={{borderBottomColor:'rgba(255,255,255,.2)'}}>
              <h3 style={{color:'#fff'}}>Quote Summary</h3>
            </div>
            <div className="fi-panel-body">
              <div style={{textAlign:'center',padding:'10px 0'}}>
                <div style={{fontSize:'11px',opacity:.8,marginBottom:'4px'}}>NET QUOTATION VALUE</div>
                <div style={{fontSize:'28px',fontWeight:'800',fontFamily:'Syne,sans-serif'}}>{fmtFull(total)}</div>
                <div style={{fontSize:'11px',opacity:.7,marginTop:'4px'}}>incl. {form.taxRate}% GST</div>
              </div>
              <div style={{borderTop:'1px solid rgba(255,255,255,.2)',paddingTop:'12px',fontSize:'12px'}}>
                {[['Company',form.company||'—'],['Product',form.product||'—'],['Discount',form.discount+'%'],['Valid Until',form.validity||'—'],['Payment',form.paymentTerms]].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'3px 0'}}>
                    <span style={{opacity:.7}}>{k}</span><strong>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>👤 Assigned To</h3></div>
            <div className="fi-panel-body">
              <div className="sd-field">
                <label>Sales Rep</label>
                <select value={form.owner} onChange={e=>set('owner',e.target.value)}>
                  {SALESREPS.map(r=><option key={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div style={{marginTop:'10px',background:'#EDE0EA',borderRadius:'6px',padding:'10px',fontSize:'12px'}}>
                <div style={{fontWeight:'700',color:'var(--odoo-purple)',marginBottom:'4px'}}>🤖 AI Pricing Insight</div>
                <div>Average discount for similar deals: <strong>6-8%</strong></div>
                <div style={{marginTop:'4px'}}>Win rate at {form.discount||0}% discount: <strong>{form.discount>=5?'68%':form.discount>=3?'52%':'40%'}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
