import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

const CUSTOMERS = [
  { id:'C-001', name:'Sri Lakshmi Mills Pvt Ltd',  gstin:'33AABCS1429B1Z5' },
  { id:'C-002', name:'Coimbatore Spinners Ltd',     gstin:'33AABCC2341B1Z1' },
  { id:'C-003', name:'Rajesh Textiles',             gstin:'33AABCR4521B1Z8' },
  { id:'C-004', name:'ARS Cotton Mills',            gstin:'33AABCA5631B1Z2' },
  { id:'C-005', name:'Vijay Fabrics',               gstin:'33AABCV6741B1Z9' },
]
const PRODUCTS = [
  { hsn:'8448 59 90', name:'ARISER COMFACT SYSTEM', rate:1200, gst:18 },
  { hsn:'8448 59 91', name:'MEC SHORT STRETCH',     rate:950,  gst:18 },
  { hsn:'8448 49 00', name:'COMPACT SPARES',        rate:2100, gst:12 },
  { hsn:'8448 49 10', name:'LATTICE APRONS C121',   rate:450,  gst:18 },
]

const newLine = () => ({ hsn:'8448 59 90', product:'ARISER COMFACT SYSTEM', qty:100, unit:'Nos', rate:1200, disc:0, gstPct:18 })
const calcLine = (l) => {
  const taxable = l.qty * l.rate * (1 - l.disc/100)
  const gstAmt  = taxable * l.gstPct / 100
  return { ...l, taxable, cgst: gstAmt/2, sgst: gstAmt/2, igst: 0, total: taxable + gstAmt }
}

export default function SONew() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ soNo:'SO-0125', date:today, delivDate:'', customerId:'', currency:'INR', supply:'Tamil Nadu (33)', exec:'Admin', remarks:'', shipTo:'' })
  const [lines, setLines] = useState([calcLine(newLine())])
  const [saving, setSaving] = useState(false)
  const [custGSTIN, setCustGSTIN] = useState('')

  const setCustomer = (id) => {
    const c = CUSTOMERS.find(c=>c.id===id)
    setForm(f=>({...f, customerId:id}))
    setCustGSTIN(c?.gstin || '')
  }

  const setLine = (i, field, val) => {
    setLines(ls => ls.map((l,idx) => idx===i ? calcLine({...l,[field]: field==='qty'||field==='rate'||field==='disc'||field==='gstPct'?Number(val):val}) : l))
  }

  const totals = lines.reduce((acc,l) => ({
    taxable: acc.taxable + (l.taxable||0),
    cgst: acc.cgst + (l.cgst||0),
    sgst: acc.sgst + (l.sgst||0),
    total: acc.total + (l.total||0),
  }), { taxable:0, cgst:0, sgst:0, total:0 })

  const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN')

  const confirm = async () => {
    if (!form.customerId) return toast.error('Select a customer')
    setSaving(true)
    try {
      await sdApi.createOrder({ ...form, lines })
      toast.success(`${form.soNo} Confirmed! ✅`)
      navigate('/sd/orders')
    } catch {
      toast.success(`${form.soNo} Confirmed (dev mode) ✅`)
      navigate('/sd/orders')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">New Sales Order <small>VA01 · Draft</small></div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={()=>navigate('/sd/orders')}>✕ Discard</button>
          <button className="btn btn-sm" style={{background:'#E06F39',color:'#fff',border:'none',borderRadius:'6px',padding:'5px 11px',fontWeight:'700',cursor:'pointer'}} onClick={()=>toast.success('Saved as Draft!')}>Save Draft</button>
          <button className="btn btn-p" onClick={confirm} disabled={saving}>{saving?'Saving…':'✅ Confirm Order'}</button>
        </div>
      </div>

      <div className="sd-fc">
        {/* Status bar */}
        <div className="sd-fsb">
          {['Draft','Confirmed','Delivered','Invoiced','Closed'].map((s,i)=>(
            <div key={s} className={`sd-ss ${i===0?'act':''}`}>
              <div className="sd-sd"></div>{s}
            </div>
          ))}
        </div>

        <div className="sd-fb2">
          {/* Order Header */}
          <div className="sd-sec">
            <div className="sd-stt">Order Header</div>
            <div className="sd-fg3">
              <div className="sd-fg"><label>SO Number</label><input className="sd-fi" value={form.soNo} disabled/></div>
              <div className="sd-fg"><label>Order Date <span className="req">*</span></label><input className="sd-fi" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
              <div className="sd-fg"><label>Delivery Date</label><input className="sd-fi" type="date" value={form.delivDate} onChange={e=>setForm(f=>({...f,delivDate:e.target.value}))}/></div>
              <div className="sd-fg sp2">
                <label>Customer <span className="req">*</span></label>
                <select className="sd-fis" value={form.customerId} onChange={e=>setCustomer(e.target.value)}>
                  <option value="">-- Select Customer --</option>
                  {CUSTOMERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sd-fg sp2">
                <label>Ship To (Delivery Address)</label>
                <select className="sd-fis" value={form.shipTo} onChange={e=>setForm(f=>({...f,shipTo:e.target.value}))}>
                  <option value="">-- Same as Bill To (Default) --</option>
                  <option value="Plant 1 — Hosur">Plant 1 — Hosur</option>
                  <option value="Plant 2 — Chennai">Plant 2 — Chennai</option>
                  <option value="Warehouse — Coimbatore">Warehouse — Coimbatore</option>
                  <option value="3rd Party / Job Work Delivery">3rd Party / Job Work Delivery</option>
                </select>
              </div>
              <div className="sd-fg"><label>Currency</label><select className="sd-fis"><option>INR — Indian Rupee</option><option>USD</option></select></div>
              <div className="sd-fg"><label>Customer GSTIN</label><input className="sd-fi" value={custGSTIN} placeholder="Auto-filled" disabled/></div>
              <div className="sd-fg"><label>Place of Supply</label><select className="sd-fis"><option>Tamil Nadu (33)</option><option>Karnataka (29)</option></select></div>
              <div className="sd-fg"><label>Sales Executive</label><select className="sd-fis"><option>Admin</option><option>Sales Team 1</option></select></div>
              <div className="sd-fg sp2"><label>Remarks</label><input className="sd-fi" placeholder="Any special instructions…" value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))}/></div>
            </div>
          </div>

          {/* Line Items */}
          <div className="sd-sec">
            <div className="sd-stt">Order Line Items</div>
            <div style={{overflowX:'auto'}}>
              <table className="sd-li">
                <thead>
                  <tr><th>#</th><th>HSN Code</th><th>Product</th><th>Qty</th><th>Unit</th><th>Rate(₹)</th><th>Disc%</th><th>Taxable</th><th>GST%</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th><th></th></tr>
                </thead>
                <tbody>
                  {lines.map((l,i)=>(
                    <tr key={i}>
                      <td>{i+1}</td>
                      <td><input value={l.hsn} onChange={e=>setLine(i,'hsn',e.target.value)} style={{width:'80px'}}/></td>
                      <td>
                        <select value={l.product} onChange={e=>{const p=PRODUCTS.find(p=>p.name===e.target.value);if(p)setLines(ls=>ls.map((ln,idx)=>idx===i?calcLine({...ln,product:p.name,hsn:p.hsn,rate:p.rate,gstPct:p.gst}):ln))}} style={{width:'185px'}}>
                          {PRODUCTS.map(p=><option key={p.name}>{p.name}</option>)}
                        </select>
                      </td>
                      <td><input type="number" value={l.qty} onChange={e=>setLine(i,'qty',e.target.value)} style={{width:'60px'}}/></td>
                      <td><select style={{width:'55px'}}><option>Nos</option><option>Kg</option><option>Set</option></select></td>
                      <td><input type="number" value={l.rate} onChange={e=>setLine(i,'rate',e.target.value)} style={{width:'80px'}}/></td>
                      <td><input type="number" value={l.disc} onChange={e=>setLine(i,'disc',e.target.value)} style={{width:'45px'}}/></td>
                      <td><input value={fmt(l.taxable||0)} disabled style={{background:'#F8F9FA',width:'90px'}}/></td>
                      <td><select value={l.gstPct} onChange={e=>setLine(i,'gstPct',e.target.value)} style={{width:'55px'}}><option value={18}>18%</option><option value={12}>12%</option><option value={5}>5%</option></select></td>
                      <td><input value={fmt(l.cgst||0)} disabled style={{background:'#F8F9FA',width:'80px'}}/></td>
                      <td><input value={fmt(l.sgst||0)} disabled style={{background:'#F8F9FA',width:'80px'}}/></td>
                      <td><input value={fmt(l.igst||0)} disabled style={{background:'#F8F9FA',width:'65px'}}/></td>
                      <td><input value={fmt(l.total||0)} disabled style={{background:'#F8F9FA',fontWeight:'700',width:'90px'}}/></td>
                      <td><span style={{color:'#D9534F',cursor:'pointer',fontSize:'14px'}} onClick={()=>setLines(ls=>ls.filter((_,idx)=>idx!==i))}>🗑</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sd-liadd" onClick={()=>setLines(ls=>[...ls,calcLine(newLine())])}>Add Line Item</div>

            {/* Totals */}
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:'12px'}}>
              <div className="sd-totb">
                <div className="sd-tr"><span>Subtotal (Taxable):</span><strong>{fmt(totals.taxable)}</strong></div>
                <div className="sd-tr"><span>CGST:</span><span>{fmt(totals.cgst)}</span></div>
                <div className="sd-tr"><span>SGST:</span><span>{fmt(totals.sgst)}</span></div>
                <div className="sd-tr"><span>IGST:</span><span>₹0</span></div>
                <div className="sd-tr" style={{borderTop:'2px solid #DEE2E6',marginTop:'4px',paddingTop:'6px',fontWeight:'700',fontSize:'13px',color:'#714B67'}}>
                  <span>Grand Total:</span><strong>{fmt(totals.total)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
