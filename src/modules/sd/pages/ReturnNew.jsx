import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const CUSTOMERS = ['Sri Lakshmi Mills Pvt Ltd','Coimbatore Spinners Ltd','Ashok Leyland Ltd','Rajesh Textiles','TVS Motors']
const INVOICES  = [
  { id:'INV-0124', label:'INV-0124 — Sri Lakshmi Mills — ₹3,91,780', customer:'Sri Lakshmi Mills Pvt Ltd',
    lines:[
      { sl:1, code:'SV-PC-001', desc:'Powder Coating — RAL 9005 Black', qty:500, uom:'Kg',  rate:780, gstPct:18, total:461100 },
      { sl:2, code:'PR-002',    desc:'Compact Spares — Set',             qty:5,   uom:'Set', rate:2100,gstPct:12, total:11760  },
    ]
  },
  { id:'INV-0123', label:'INV-0123 — Coimbatore Spinners — ₹8,12,600', customer:'Coimbatore Spinners Ltd',
    lines:[
      { sl:1, code:'SV-PC-002', desc:'Powder Coating — RAL 9010 White', qty:800, uom:'Kg', rate:850, gstPct:18, total:802400 },
    ]
  },
]

const RETURN_TYPES = [
  { id:'material', label:'Material Return', icon:'', desc:'Physical goods returned to factory. Stock gets credited back.' },
  { id:'credit',   label:'Credit Note Only', icon:'', desc:'No material return. Only financial credit note issued to customer.' },
  { id:'both',     label:'Material + Credit Note', icon:'↩', desc:'Material returned AND credit note issued. Full return process.' },
]

const calcLine = l => {
  const taxable = l.retQty * l.rate
  const gst     = taxable * l.gstPct / 100
  return { ...l, taxable, gstAmt:gst, lineTotal:taxable+gst }
}

export default function ReturnNew() {
  const navigate  = useNavigate()
  const today     = new Date().toISOString().split('T')[0]

  const [returnType, setReturnType] = useState(null)
  const [form, setForm] = useState({
    cnNo:'CN-0013', date:today, customer:'Sri Lakshmi Mills Pvt Ltd',
    invId:'INV-0124', reason:'Defective / Damaged goods',
    deliveryNote:'', vehicleNo:'', receivedBy:'',
    remarks:'', debitAcc:'Customer Receivables', creditAcc:'Sales Returns',
  })
  const [lines, setLines]   = useState([])
  const [saving, setSaving] = useState(false)

  const F = f => ({ value:form[f], onChange:e=>setForm(p=>({...p,[f]:e.target.value})) })

  const selInv = INVOICES.find(i => i.id === form.invId)

  // When invoice selected — load its lines for return
  const loadInvLines = invId => {
    const inv = INVOICES.find(i => i.id === invId)
    if (inv) {
      setLines(inv.lines.map(l => calcLine({ ...l, retQty:0, retReason:'' })))
    }
    setForm(p => ({ ...p, invId }))
  }

  const setLineField = (idx, field, val) => {
    setLines(ls => ls.map((l, i) => i===idx ? calcLine({...l, [field]: field==='retQty' ? Number(val) : val}) : l))
  }

  const totals = lines.reduce((a,l) => ({
    taxable:  a.taxable  + (l.taxable  || 0),
    gstAmt:   a.gstAmt   + (l.gstAmt   || 0),
    lineTotal:a.lineTotal+ (l.lineTotal || 0),
  }), { taxable:0, gstAmt:0, lineTotal:0 })

  const fmt = n => n?.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })

  const save = async () => {
    if (!returnType) return toast.error('Select return type first')
    if ((returnType==='material'||returnType==='both') && lines.every(l=>l.retQty===0))
      return toast.error('Enter return quantity for at least one item')
    setSaving(true)
    setTimeout(() => {
      toast.success(`Return ${form.cnNo} created successfully!`)
      navigate('/sd/returns')
      setSaving(false)
    }, 600)
  }

  return (
    <div style={{maxWidth:'100%', overflowX:'hidden'}}>
      <div className="lv-hdr">
        <div className="lv-ttl">New Sales Return <small>SD · Returns & Credit Notes</small></div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={() => navigate('/sd/returns')}>Cancel</button>
          <button className="btn btn-p" onClick={save} disabled={saving}>
            {saving ? 'Creating…' : 'Create Return'}
          </button>
        </div>
      </div>

      <div className="sd-fc">
        {/* ── STEP 1: Return Type ── */}
        <div className="sd-sec">
          <div className="sd-stt">Step 1 — Select Return Type</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {RETURN_TYPES.map(rt => (
              <div key={rt.id} onClick={() => setReturnType(rt.id)}
                style={{ padding:'14px 16px', borderRadius:8, cursor:'pointer',
                  border: returnType===rt.id
                    ? '2px solid var(--odoo-purple)'
                    : '1px solid var(--odoo-border)',
                  background: returnType===rt.id ? 'var(--odoo-purple-lt)' : '#fff',
                  transition:'all .15s' }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{rt.icon}</div>
                <div style={{ fontWeight:700, fontSize:13,
                  color: returnType===rt.id ? 'var(--odoo-purple)' : 'var(--odoo-dark)',
                  marginBottom:4 }}>{rt.label}</div>
                <div style={{ fontSize:11, color:'var(--odoo-gray)', lineHeight:1.4 }}>{rt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {returnType && (
          <>
            {/* ── STEP 2: Basic Details ── */}
            <div className="sd-sec">
              <div className="sd-stt">Step 2 — Return Details</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px 16px' }}>
                <div className="sd-fg">
                  <label>CN / Return Number</label>
                  <input className="sd-fi" value={form.cnNo} disabled
                    style={{ fontFamily:'DM Mono,monospace' }} />
                </div>
                <div className="sd-fg">
                  <label>Return Date <span className="req">*</span></label>
                  <input className="sd-fi" type="date" {...F('date')} />
                </div>
                <div className="sd-fg">
                  <label>Customer <span className="req">*</span></label>
                  <select className="sd-fis" {...F('customer')}>
                    {CUSTOMERS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sd-fg">
                  <label>Original Invoice <span className="req">*</span></label>
                  <select className="sd-fis" value={form.invId}
                    onChange={e => loadInvLines(e.target.value)}>
                    {INVOICES.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                  </select>
                </div>
                <div className="sd-fg">
                  <label>Return Reason <span className="req">*</span></label>
                  <select className="sd-fis" {...F('reason')}>
                    <option>Defective / Damaged goods</option>
                    <option>Wrong product supplied</option>
                    <option>Wrong quantity supplied</option>
                    <option>Quality not as per spec / NCR</option>
                    <option>Customer cancelled order</option>
                    <option>Short supply — balance return</option>
                    <option>Job work — material return after processing</option>
                  </select>
                </div>
                <div className="sd-fg">
                  <label>Remarks</label>
                  <input className="sd-fi" placeholder="Additional notes..."
                    {...F('remarks')} />
                </div>
              </div>
            </div>

            {/* ── STEP 3: Material Return (if applicable) ── */}
            {(returnType === 'material' || returnType === 'both') && (
              <div className="sd-sec">
                <div className="sd-stt">Step 3 — Material Return Details</div>

                {/* Transport info */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px 16px', marginBottom:14 }}>
                  <div className="sd-fg">
                    <label>Delivery Note / LR No.</label>
                    <input className="sd-fi" placeholder="LR-2026-0089"
                      {...F('deliveryNote')}
                      style={{ fontFamily:'DM Mono,monospace' }} />
                  </div>
                  <div className="sd-fg">
                    <label>Vehicle No.</label>
                    <input className="sd-fi" placeholder="TN38 CD 5678"
                      {...F('vehicleNo')}
                      style={{ fontFamily:'DM Mono,monospace' }} />
                  </div>
                  <div className="sd-fg">
                    <label>Received By (Store)</label>
                    <input className="sd-fi" placeholder="Store In-Charge name"
                      {...F('receivedBy')} />
                  </div>
                </div>

                {/* Return items table */}
                <div style={{ border:'1px solid var(--odoo-border)', borderRadius:6, overflowX:'auto', width:'100%' }}>
                  <div style={{ padding:'8px 12px', background:'var(--odoo-purple)',
                    display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color:'#fff', fontWeight:700, fontSize:12 }}>
                      Return Items — from {form.invId}
                    </span>
                    <span style={{ color:'rgba(255,255,255,.7)', fontSize:11 }}>
                      Enter return quantity for each item
                    </span>
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#F8F3F7' }}>
                        {['#','Description','UOM','Inv.Qty','Ret.Qty','Rate','Total (₹)','Condition'].map(h => (
                          <th key={h} style={{ padding:'7px 8px', fontSize:10, fontWeight:700,
                            color:'var(--odoo-gray)', borderBottom:'1px solid var(--odoo-border)', whiteSpace:'nowrap',
                            textAlign: ['Inv.Qty','Ret.Qty','Rate','Total (₹)'].includes(h) ? 'right' : 'left' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lines.length === 0 && (
                        <tr><td colSpan={11} style={{ padding:'20px', textAlign:'center',
                          color:'var(--odoo-gray)', fontSize:12 }}>
                          Select an invoice to load items
                        </td></tr>
                      )}
                      {lines.map((l, i) => (
                        <tr key={i} style={{ background: i%2===0?'#fff':'#FAFAFA',
                          borderBottom:'1px solid var(--odoo-border)' }}>
                          <td style={{ padding:'8px 10px', fontSize:11 }}>{l.sl}</td>
                          <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace',
                            fontSize:11, fontWeight:600, color:'var(--odoo-purple)' }}>{l.code}</td>
                          <td style={{ padding:'8px 10px', fontWeight:600, fontSize:12 }}>{l.desc}</td>
                          <td style={{ padding:'8px 10px', fontSize:11 }}>{l.uom}</td>
                          <td style={{ padding:'8px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace', fontWeight:600 }}>{l.qty}</td>
                          {/* Return qty — editable */}
                          <td style={{ padding:'6px 8px', textAlign:'right' }}>
                            <input type="number" min={0} max={l.qty}
                              value={l.retQty || ''}
                              onChange={e => setLineField(i,'retQty',e.target.value)}
                              placeholder="0"
                              style={{ width:70, textAlign:'right', padding:'4px 8px',
                                fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:13,
                                border:'1px solid var(--odoo-purple)', borderRadius:4,
                                color: l.retQty > l.qty ? 'var(--odoo-red)' : 'var(--odoo-purple)',
                                outline:'none', background: l.retQty > 0 ? 'var(--odoo-purple-lt)' : '#fff' }} />
                            {l.retQty > l.qty && (
                              <div style={{ fontSize:9, color:'var(--odoo-red)', marginTop:2 }}>
                                Max: {l.qty}
                              </div>
                            )}
                          </td>
                          <td style={{ padding:'8px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace' }}>{fmt(l.rate)}</td>
                          <td style={{ padding:'8px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            color: l.retQty > 0 ? 'var(--odoo-dark)' : 'var(--odoo-gray)' }}>
                            {l.retQty > 0 ? fmt(l.taxable) : '—'}
                          </td>
                          <td style={{ padding:'8px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            color: l.retQty > 0 ? 'var(--odoo-orange)' : 'var(--odoo-gray)' }}>
                            {l.retQty > 0 ? fmt(l.gstAmt) : '—'}
                          </td>
                          <td style={{ padding:'8px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace', fontWeight:700,
                            color: l.retQty > 0 ? 'var(--odoo-purple)' : 'var(--odoo-gray)' }}>
                            {l.retQty > 0 ? fmt(l.lineTotal) : '—'}
                          </td>
                          {/* Condition */}
                          <td style={{ padding:'6px 8px' }}>
                            <select value={l.retReason || 'Damaged'}
                              onChange={e => setLineField(i,'retReason',e.target.value)}
                              style={{ fontSize:10, padding:'3px 6px',
                                border:'1px solid var(--odoo-border)', borderRadius:4,
                                background:'#fff', color:'var(--odoo-gray)', width:110 }}>
                              <option>Damaged</option>
                              <option>Defective</option>
                              <option>Wrong Item</option>
                              <option>Excess Qty</option>
                              <option>Good Condition</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {totals.lineTotal > 0 && (
                      <tfoot>
                        <tr style={{ background:'#EDE0EA' }}>
                          <td colSpan={7} style={{ padding:'9px 10px', fontWeight:700,
                            textAlign:'right', fontFamily:'Syne,sans-serif' }}>
                            RETURN TOTAL
                          </td>
                          <td style={{ padding:'9px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace', fontWeight:700 }}>
                            ₹{fmt(totals.taxable)}
                          </td>
                          <td style={{ padding:'9px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace', fontWeight:700,
                            color:'var(--odoo-orange)' }}>
                            ₹{fmt(totals.gstAmt)}
                          </td>
                          <td style={{ padding:'9px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace', fontWeight:800, fontSize:14,
                            color:'var(--odoo-purple)' }}>
                            ₹{fmt(totals.lineTotal)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Stock credit info */}
                {totals.lineTotal > 0 && (
                  <div style={{ marginTop:10, padding:'10px 12px', background:'#D4EDDA',
                    border:'1px solid #C3E6CB', borderRadius:6, fontSize:12, color:'#155724' }}>
                    <strong>Stock Update on Save:</strong> Returned items will be credited back to warehouse stock.
                    A <strong>Goods Receipt</strong> entry will be auto-created in WM module.
                  </div>
                )}
              </div>
            )}

            {/* ── Credit Note Accounting ── */}
            {(returnType === 'credit' || returnType === 'both') && (
              <div className="sd-sec">
                <div className="sd-stt">
                  {returnType === 'both' ? 'Step 4' : 'Step 3'} — Credit Note / Accounting
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px 16px' }}>
                  <div className="sd-fg">
                    <label>Credit Note Amount (₹)</label>
                    <input className="sd-fi" type="number"
                      value={returnType==='both' ? (totals.lineTotal||'').toString() : ''}
                      placeholder={returnType==='both' ? 'Auto from items' : 'Enter amount'}
                      style={{ fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:14,
                        color:'var(--odoo-purple)' }}
                      readOnly={returnType==='both'}
                      onChange={e => setForm(p => ({...p, creditAmt:e.target.value}))} />
                  </div>
                  <div className="sd-fg">
                    <label>Debit Account</label>
                    <select className="sd-fis" {...F('debitAcc')}>
                      <option>Customer Receivables</option>
                      <option>Sales Returns Account</option>
                      <option>Advance from Customer</option>
                    </select>
                  </div>
                  <div className="sd-fg">
                    <label>Credit Account</label>
                    <select className="sd-fis" {...F('creditAcc')}>
                      <option>Sales Returns</option>
                      <option>Revenue Account</option>
                      <option>GST Liability</option>
                    </select>
                  </div>
                  <div className="sd-fg">
                    <label>Adjustment Type</label>
                    <select className="sd-fis">
                      <option>Adjust against next invoice</option>
                      <option>Refund to customer (bank)</option>
                      <option>Adjust against advance</option>
                    </select>
                  </div>
                  <div className="sd-fg">
                    <label>GST Reversal</label>
                    <select className="sd-fis">
                      <option>Yes — Reverse GST (CGST + SGST)</option>
                      <option>No — GST already remitted</option>
                    </select>
                  </div>
                </div>

                {/* Journal preview */}
                <div style={{ marginTop:12, background:'#F8F9FA', borderRadius:6,
                  border:'1px solid var(--odoo-border)', overflow:'hidden' }}>
                  <div style={{ padding:'6px 12px', background:'#1C1C1C',
                    fontSize:11, fontWeight:700, color:'#fff' }}>
                    Journal Entry Preview (on posting)
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                    <thead>
                      <tr style={{ background:'#F0F0F0' }}>
                        {['Ledger','Dr (₹)','Cr (₹)'].map(h => (
                          <th key={h} style={{ padding:'6px 12px', textAlign:h==='Ledger'?'left':'right',
                            fontWeight:700, color:'var(--odoo-gray)', borderBottom:'1px solid var(--odoo-border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Sales Returns A/c',    fmt(totals.lineTotal || 0), '—'],
                        ['CGST Output Tax',       '—', fmt((totals.gstAmt||0)/2)],
                        ['SGST Output Tax',       '—', fmt((totals.gstAmt||0)/2)],
                        ['Customer Receivables', '—', fmt(totals.taxable || 0)],
                      ].map(([ledger, dr, cr]) => (
                        <tr key={ledger} style={{ borderBottom:'1px solid var(--odoo-border)' }}>
                          <td style={{ padding:'6px 12px', fontWeight:500 }}>{ledger}</td>
                          <td style={{ padding:'6px 12px', textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            color: dr!=='—' ? 'var(--odoo-blue)' : 'var(--odoo-gray)' }}>{dr}</td>
                          <td style={{ padding:'6px 12px', textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            color: cr!=='—' ? 'var(--odoo-green)' : 'var(--odoo-gray)' }}>{cr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Save bar ── */}
            <div style={{ display:'flex', gap:10, padding:'16px 0',
              borderTop:'1px solid var(--odoo-border)', marginTop:8 }}>
              <button className="btn btn-p" onClick={save} disabled={saving}>
                {saving ? 'Creating…' : `Create ${returnType==='material'?'Material Return':returnType==='credit'?'Credit Note':'Return + Credit Note'}`}
              </button>
              <button className="btn btn-s" onClick={() => navigate('/sd/returns')}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
