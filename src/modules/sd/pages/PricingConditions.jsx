import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// ─── SAMPLE DATA ───────────────────────────────────────────────────────────
const PRICE_LISTS = [
  { id:'PL-001', name:'Standard Price List',  type:'Standard',  currency:'INR', validFrom:'01 Apr 2025', validTo:'31 Mar 2026', customers:0, items:24, status:'Active' },
  { id:'PL-002', name:'Wholesale Price List', type:'Wholesale', currency:'INR', validFrom:'01 Apr 2025', validTo:'31 Mar 2026', customers:8, items:24, status:'Active' },
  { id:'PL-003', name:'Special Rate — Ashok Leyland', type:'Customer-Specific', currency:'INR', validFrom:'01 Jan 2026', validTo:'31 Mar 2026', customers:1, items:12, status:'Active' },
  { id:'PL-004', name:'Export Price List',    type:'Export',    currency:'USD', validFrom:'01 Apr 2025', validTo:'31 Mar 2026', customers:3, items:18, status:'Active' },
  { id:'PL-005', name:'Seasonal Offer — Q4',  type:'Promotional', currency:'INR', validFrom:'01 Jan 2026', validTo:'31 Mar 2026', customers:0, items:8, status:'Inactive' },
]

const DISCOUNT_RULES = [
  { id:'DR-001', name:'Volume Discount — 100+ Kg',    type:'Quantity',   basis:'Qty >= 100 Kg',    disc:'5%',   customers:'All', items:'Powder Coating', priority:1, status:'Active' },
  { id:'DR-002', name:'Volume Discount — 500+ Kg',    type:'Quantity',   basis:'Qty >= 500 Kg',    disc:'8%',   customers:'All', items:'Powder Coating', priority:1, status:'Active' },
  { id:'DR-003', name:'Customer Loyalty — Ashok Leyland', type:'Customer', basis:'Customer = AL',  disc:'10%',  customers:'Ashok Leyland', items:'All Items', priority:2, status:'Active' },
  { id:'DR-004', name:'Early Payment Discount',       type:'Payment',    basis:'Payment < 7 days', disc:'2%',   customers:'All', items:'All Items', priority:3, status:'Active' },
  { id:'DR-005', name:'OEM Special Rate',             type:'Customer',   basis:'Customer = TVS',   disc:'7%',   customers:'TVS Motors', items:'All Items', priority:2, status:'Active' },
  { id:'DR-006', name:'New Customer Promo',           type:'Promotional', basis:'First 3 orders',  disc:'5%',   customers:'New', items:'All Items', priority:4, status:'Inactive' },
]

const CUSTOMER_PRICING = [
  { customer:'Ashok Leyland Ltd',     priceList:'Special Rate — Ashok Leyland', extraDisc:'2%', creditDays:45, payTerms:'Net 45' },
  { customer:'TVS Motors',            priceList:'Wholesale Price List',          extraDisc:'5%', creditDays:30, payTerms:'Net 30' },
  { customer:'Sri Lakshmi Mills',     priceList:'Standard Price List',           extraDisc:'0%', creditDays:30, payTerms:'Net 30' },
  { customer:'Coimbatore Spinners',   priceList:'Wholesale Price List',          extraDisc:'3%', creditDays:45, payTerms:'Net 45' },
  { customer:'Rajesh Textiles',       priceList:'Standard Price List',           extraDisc:'0%', creditDays:15, payTerms:'Net 15' },
]

const TYPE_COLORS = {
  'Standard':          { bg:'#E8F4FD', c:'#1A5276' },
  'Wholesale':         { bg:'#D4EDDA', c:'#155724' },
  'Customer-Specific': { bg:'#EDE0EA', c:'#714B67' },
  'Export':            { bg:'#FFF3CD', c:'#856404' },
  'Promotional':       { bg:'#F8D7DA', c:'#721C24' },
}

export default function PricingConditions() {
  const navigate = useNavigate()
  const [view, setView]       = useState('pricelists') // pricelists | discounts | customer
  const [showNew, setShowNew] = useState(false)
  const [newPL, setNewPL]     = useState({ name:'', type:'Standard', currency:'INR', validFrom:'', validTo:'', desc:'' })

  const savePriceList = () => {
    if (!newPL.name) return toast.error('Price List Name required')
    toast.success(`Price List "${newPL.name}" created!`)
    setShowNew(false)
    setNewPL({ name:'', type:'Standard', currency:'INR', validFrom:'', validTo:'', desc:'' })
  }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Pricing Conditions <small>VK00 · Price Lists · Discounts · Customer Pricing</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => navigate('/sd/pricebook')}>
            Price Book
          </button>
          <button className="btn btn-p" onClick={() => setShowNew(true)}>
            + New Price List
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--odoo-border)',
        marginBottom:16 }}>
        {[
          ['pricelists', 'Price Lists', PRICE_LISTS.length],
          ['discounts',  'Discount Rules', DISCOUNT_RULES.length],
          ['customer',   'Customer Pricing', CUSTOMER_PRICING.length],
        ].map(([k, l, count]) => (
          <button key={k} onClick={() => setView(k)}
            style={{ padding:'9px 20px', fontSize:12, fontWeight:600, cursor:'pointer',
              border:'none', background:'transparent',
              borderBottom: view===k ? '2px solid var(--odoo-purple)' : '2px solid transparent',
              color: view===k ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
              marginBottom:-2, display:'flex', alignItems:'center', gap:6 }}>
            {l}
            <span style={{ padding:'1px 7px', borderRadius:10, fontSize:10, fontWeight:700,
              background: view===k ? 'var(--odoo-purple)' : '#eee',
              color: view===k ? '#fff' : '#666' }}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── PRICE LISTS ── */}
      {view === 'pricelists' && (
        <div>
          {/* New price list form */}
          {showNew && (
            <div className="fi-panel" style={{ marginBottom:16, border:'1px solid var(--odoo-purple)', borderRadius:8 }}>
              <div className="fi-panel-hdr" style={{ background:'var(--odoo-purple)' }}>
                <h3 style={{ color:'#fff', fontSize:13 }}>New Price List</h3>
                <button onClick={() => setShowNew(false)} style={{ background:'none', border:'none',
                  color:'#fff', cursor:'pointer', fontSize:16 }}>x</button>
              </div>
              <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div className="sd-fg" style={{ gridColumn:'1 / -1' }}>
                  <label>Price List Name <span className="req">*</span></label>
                  <input className="sd-fi" placeholder="e.g. Special Rate — Customer Name"
                    value={newPL.name} onChange={e => setNewPL(p => ({ ...p, name:e.target.value }))} />
                </div>
                <div className="sd-fg">
                  <label>Type</label>
                  <select className="sd-fis" value={newPL.type}
                    onChange={e => setNewPL(p => ({ ...p, type:e.target.value }))}>
                    <option>Standard</option><option>Wholesale</option>
                    <option>Customer-Specific</option><option>Export</option><option>Promotional</option>
                  </select>
                </div>
                <div className="sd-fg">
                  <label>Currency</label>
                  <select className="sd-fis" value={newPL.currency}
                    onChange={e => setNewPL(p => ({ ...p, currency:e.target.value }))}>
                    <option>INR</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
                <div className="sd-fg">
                  <label>Valid From</label>
                  <input className="sd-fi" type="date" value={newPL.validFrom}
                    onChange={e => setNewPL(p => ({ ...p, validFrom:e.target.value }))} />
                </div>
                <div className="sd-fg">
                  <label>Valid To</label>
                  <input className="sd-fi" type="date" value={newPL.validTo}
                    onChange={e => setNewPL(p => ({ ...p, validTo:e.target.value }))} />
                </div>
                <div className="sd-fg" style={{ gridColumn:'1 / -1' }}>
                  <label>Description / Notes</label>
                  <input className="sd-fi" placeholder="Optional notes about this price list"
                    value={newPL.desc} onChange={e => setNewPL(p => ({ ...p, desc:e.target.value }))} />
                </div>
                <div style={{ gridColumn:'1 / -1', display:'flex', gap:8 }}>
                  <button className="btn btn-p" onClick={savePriceList}>Save Price List</button>
                  <button className="btn btn-s" onClick={() => setShowNew(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:12 }}>
            {PRICE_LISTS.map(pl => {
              const tc = TYPE_COLORS[pl.type] || { bg:'#F5F5F5', c:'#555' }
              return (
                <div key={pl.id} style={{ background:'#fff', border:'1px solid var(--odoo-border)',
                  borderRadius:8, overflow:'hidden',
                  boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                  opacity: pl.status === 'Inactive' ? .7 : 1,
                  transition:'all .2s' }}>
                  {/* Card header */}
                  <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--odoo-border)',
                    display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:'var(--odoo-dark)',
                        marginBottom:5 }}>{pl.name}</div>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10,
                          fontWeight:700, background:tc.bg, color:tc.c }}>{pl.type}</span>
                        <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10,
                          fontWeight:600,
                          background: pl.status==='Active' ? '#D4EDDA' : '#F8D7DA',
                          color: pl.status==='Active' ? '#155724' : '#721C24' }}>
                          {pl.status}
                        </span>
                        <span style={{ fontSize:11, color:'var(--odoo-gray)',
                          fontFamily:'DM Mono,monospace' }}>{pl.currency}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:10, color:'var(--odoo-gray)',
                      fontFamily:'DM Mono,monospace', textAlign:'right' }}>
                      <div>{pl.id}</div>
                    </div>
                  </div>
                  {/* Card body */}
                  <div style={{ padding:'10px 14px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                      gap:8, marginBottom:10 }}>
                      {[
                        ['Items', pl.items],
                        ['Customers', pl.customers || 'All'],
                        ['Valid Till', pl.validTo],
                      ].map(([k, v]) => (
                        <div key={k} style={{ textAlign:'center', padding:'6px 8px',
                          background:'var(--odoo-bg)', borderRadius:4 }}>
                          <div style={{ fontWeight:700, fontSize:13,
                            color:'var(--odoo-purple)' }}>{v}</div>
                          <div style={{ fontSize:10, color:'var(--odoo-gray)' }}>{k}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:11, color:'var(--odoo-gray)' }}>
                      Valid: {pl.validFrom} — {pl.validTo}
                    </div>
                  </div>
                  {/* Card footer */}
                  <div style={{ padding:'8px 14px', background:'var(--odoo-bg)',
                    borderTop:'1px solid var(--odoo-border)',
                    display:'flex', gap:8 }}>
                    <button onClick={() => navigate('/sd/pricebook')}
                      style={{ padding:'4px 12px', fontSize:11, fontWeight:600,
                        borderRadius:6, border:'1px solid var(--odoo-purple)',
                        background:'var(--odoo-purple-lt)', color:'var(--odoo-purple)',
                        cursor:'pointer' }}>
                      View Prices
                    </button>
                    <button onClick={() => toast.success('Price list duplicated!')}
                      style={{ padding:'4px 12px', fontSize:11, fontWeight:600,
                        borderRadius:6, border:'1px solid var(--odoo-border)',
                        background:'#fff', color:'var(--odoo-gray)', cursor:'pointer' }}>
                      Duplicate
                    </button>
                    <button onClick={() => toast.success('Price list assigned to customers!')}
                      style={{ padding:'4px 12px', fontSize:11, fontWeight:600,
                        borderRadius:6, border:'1px solid var(--odoo-border)',
                        background:'#fff', color:'var(--odoo-gray)', cursor:'pointer' }}>
                      Assign
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── DISCOUNT RULES ── */}
      {view === 'discounts' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button className="btn btn-p" onClick={() => toast.success('New discount rule form — coming soon!')}>
              + New Discount Rule
            </button>
          </div>
          <table className="fi-data-table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Rule Name</th>
                <th>Type</th>
                <th>Condition / Basis</th>
                <th>Discount</th>
                <th>Applies To</th>
                <th>Items</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {DISCOUNT_RULES.map((d, i) => (
                <tr key={d.id} style={{ background: i%2===0?'#fff':'#FAFAFA',
                  opacity: d.status==='Inactive' ? .6 : 1 }}>
                  <td style={{ fontFamily:'DM Mono,monospace', fontSize:11,
                    fontWeight:700, color:'var(--odoo-purple)' }}>{d.id}</td>
                  <td style={{ fontWeight:600 }}>{d.name}</td>
                  <td>
                    <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:600,
                      background: d.type==='Quantity'?'#EBF2F8':d.type==='Customer'?'#EDE0EA':
                        d.type==='Payment'?'#D4EDDA':'#FFF3CD',
                      color: d.type==='Quantity'?'#1A5276':d.type==='Customer'?'#714B67':
                        d.type==='Payment'?'#155724':'#856404' }}>
                      {d.type}
                    </span>
                  </td>
                  <td style={{ fontSize:12, color:'var(--odoo-gray)' }}>{d.basis}</td>
                  <td style={{ fontWeight:800, fontSize:14, color:'var(--odoo-green)',
                    fontFamily:'DM Mono,monospace' }}>{d.disc}</td>
                  <td style={{ fontSize:11 }}>{d.customers}</td>
                  <td style={{ fontSize:11 }}>{d.items}</td>
                  <td style={{ textAlign:'center' }}>
                    <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                      background:'#EBF2F8', color:'#1A5276' }}>P{d.priority}</span>
                  </td>
                  <td>
                    <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:600,
                      background: d.status==='Active'?'#D4EDDA':'#F8D7DA',
                      color: d.status==='Active'?'#155724':'#721C24' }}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop:16, padding:'12px 14px', background:'#FFF8F0',
            border:'1px solid #F5C518', borderRadius:6, fontSize:12, color:'#856404' }}>
            <strong>Discount Priority:</strong> When multiple discounts apply, they are applied in order of Priority (P1 = highest).
            Higher priority discounts override lower ones. Quantity discounts always take highest priority.
          </div>
        </div>
      )}

      {/* ── CUSTOMER PRICING ── */}
      {view === 'customer' && (
        <div>
          <div style={{ padding:'10px 14px', background:'#E6F7F7', border:'1px solid #00A09D',
            borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
            <strong>Customer-Specific Pricing</strong> — Assign a price list and extra discount to individual customers.
            These override the standard price list when creating quotes and sales orders.
          </div>
          <table className="fi-data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Assigned Price List</th>
                <th>Extra Discount</th>
                <th>Credit Days</th>
                <th>Payment Terms</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {CUSTOMER_PRICING.map((cp, i) => (
                <tr key={i} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                  <td style={{ fontWeight:700 }}>{cp.customer}</td>
                  <td>
                    <span style={{ padding:'2px 8px', borderRadius:8, fontSize:11,
                      fontWeight:600, background:'#EDE0EA', color:'#714B67' }}>
                      {cp.priceList}
                    </span>
                  </td>
                  <td style={{ fontWeight:800, color:'var(--odoo-green)',
                    fontFamily:'DM Mono,monospace', textAlign:'center' }}>
                    {cp.extraDisc}
                  </td>
                  <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace' }}>
                    {cp.creditDays} days
                  </td>
                  <td style={{ fontSize:11 }}>{cp.payTerms}</td>
                  <td>
                    <button onClick={() => toast.success('Edit customer pricing')}
                      style={{ padding:'3px 10px', fontSize:11, fontWeight:600,
                        borderRadius:6, border:'1px solid var(--odoo-purple)',
                        background:'var(--odoo-purple-lt)', color:'var(--odoo-purple)',
                        cursor:'pointer' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-p" onClick={() => toast.success('Assign pricing to customer!')}>
              + Assign Customer Pricing
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
