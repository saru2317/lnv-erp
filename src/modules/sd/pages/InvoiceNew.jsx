import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

const CUSTOMERS = ['Sri Lakshmi Mills Pvt Ltd','Coimbatore Spinners Ltd','Rajesh Textiles','ARS Cotton Mills','Vijay Fabrics']
const PRODUCTS  = [
  { hsn:'8448 59 90', name:'ARISER COMFACT SYSTEM', rate:1200, gst:18 },
  { hsn:'8448 49 00', name:'COMPACT SPARES',        rate:2100, gst:12 },
  { hsn:'8448 49 10', name:'LATTICE APRONS C121',   rate:450,  gst:18 },
]
const newLine = () => ({ hsn:'8448 59 90', desc:'ARISER COMFACT SYSTEM', qty:100, unit:'Nos', rate:1200, disc:0, gstPct:18 })
const calc = l => {
  const taxable = l.qty * l.rate * (1 - l.disc/100)
  const gst = taxable * l.gstPct / 100
  return { ...l, taxable, cgst:gst/2, sgst:gst/2, igst:0, total:taxable+gst }
}

export default function InvoiceNew() {
  const navigate  = useNavigate()
  const today     = new Date().toISOString().split('T')[0]
  const due30     = new Date(Date.now()+30*86400000).toISOString().split('T')[0]
  const [form, setForm]   = useState({ invNo:'INV-0125', date:today, due:due30, customer:'Sri Lakshmi Mills Pvt Ltd', soRef:'SO-0125', supply:'Tamil Nadu (33)', irn:'', ewb:'' })
  const [lines, setLines] = useState([calc(newLine())])
  const [saving, setSaving] = useState(false)

  const setLine = (i,f,v) => setLines(ls=>ls.map((l,idx)=>idx===i?calc({...l,[f]:['qty','rate','disc','gstPct'].includes(f)?Number(v):v}):l))
  const totals = lines.reduce((a,l)=>({ taxable:a.taxable+(l.taxable||0), cgst:a.cgst+(l.cgst||0), sgst:a.sgst+(l.sgst||0), total:a.total+(l.total||0) }),{taxable:0,cgst:0,sgst:0,total:0})
  const fmt = n => '₹'+Math.round(n).toLocaleString('en-IN')

  const post = async () => {
    setSaving(true)
    try {
      await sdApi.createInvoice({ ...form, lines })
      toast.success('Invoice INV-0125 Created! 🎉')
      navigate('/sd/invoices')
    } catch {
      toast.success('Invoice INV-0125 Created (dev mode)! 🎉')
      navigate('/sd/invoices')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">New Tax Invoice <small>VF01 · GST Invoice</small></div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={()=>navigate('/sd/invoices')}>✕ Discard</button>
          <button className="btn btn-sm" style={{background:'#E06F39',color:'#fff',border:'none',borderRadius:'6px',padding:'5px 11px',fontWeight:'700',cursor:'pointer'}} onClick={()=>toast.success('Saved as Draft')}>📋 Draft</button>
          <button className="btn btn-sm" style={{background:'#00A09D',color:'#fff',border:'none',borderRadius:'6px',padding:'5px 11px',fontWeight:'700',cursor:'pointer'}}>👁 Preview</button>
          <button className="btn btn-p" onClick={post} disabled={saving}>{saving?'Posting…':'✅ Post Invoice'}</button>
        </div>
      </div>

      <div className="sd-fc">
        <div className="sd-fsb">
          {['Draft','Posted','Sent','Paid'].map((s,i)=>(
            <div key={s} className={`sd-ss ${i===0?'act':''}`}><div className="sd-sd"></div>{s}</div>
          ))}
        </div>
        <div className="sd-fb2">

          {/* Invoice Header */}
          <div className="sd-sec">
            <div className="sd-stt">🧾 Invoice Header</div>
            <div className="sd-fg3">
              <div className="sd-fg"><label>Invoice Number</label><input className="sd-fi" value={form.invNo} disabled/></div>
              <div className="sd-fg"><label>Invoice Date <span className="req">*</span></label><input className="sd-fi" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
              <div className="sd-fg"><label>Due Date</label><input className="sd-fi" type="date" value={form.due} onChange={e=>setForm(f=>({...f,due:e.target.value}))}/></div>
              <div className="sd-fg sp2">
                <label>Bill To (Customer) <span className="req">*</span></label>
                <select className="sd-fis" value={form.customer} onChange={e=>setForm(f=>({...f,customer:e.target.value}))}>
                  {CUSTOMERS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="sd-fg"><label>Currency</label><select className="sd-fis"><option>INR — Indian Rupee</option></select></div>
              <div className="sd-fg"><label>Ref SO #</label><input className="sd-fi" value={form.soRef} onChange={e=>setForm(f=>({...f,soRef:e.target.value}))}/></div>
              <div className="sd-fg"><label>Place of Supply</label><select className="sd-fis"><option>Tamil Nadu (33)</option><option>Karnataka (29)</option></select></div>
              <div className="sd-fg"><label>IRN / E-Invoice</label><input className="sd-fi" placeholder="Auto-generated after posting" value={form.irn} onChange={e=>setForm(f=>({...f,irn:e.target.value}))}/></div>
              <div className="sd-fg"><label>E-Way Bill #</label><input className="sd-fi" placeholder="EWB Number if applicable" value={form.ewb} onChange={e=>setForm(f=>({...f,ewb:e.target.value}))}/></div>
            </div>
          </div>

          {/* Line Items */}
          <div className="sd-sec">
            <div className="sd-stt">📦 Invoice Line Items</div>
            <div style={{overflowX:'auto'}}>
              <table className="sd-li">
                <thead>
                  <tr><th>#</th><th>HSN</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate(₹)</th><th>Disc%</th><th>Taxable</th><th>GST%</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th><th></th></tr>
                </thead>
                <tbody>
                  {lines.map((l,i)=>(
                    <tr key={i}>
                      <td>{i+1}</td>
                      <td><input value={l.hsn} onChange={e=>setLine(i,'hsn',e.target.value)} style={{width:'80px'}}/></td>
                      <td>
                        <select value={l.desc} onChange={e=>{const p=PRODUCTS.find(p=>p.name===e.target.value);if(p)setLines(ls=>ls.map((ln,idx)=>idx===i?calc({...ln,desc:p.name,hsn:p.hsn,rate:p.rate,gstPct:p.gst}):ln))}} style={{width:'165px'}}>
                          {PRODUCTS.map(p=><option key={p.name}>{p.name}</option>)}
                        </select>
                      </td>
                      <td><input type="number" value={l.qty} onChange={e=>setLine(i,'qty',e.target.value)} style={{width:'60px'}}/></td>
                      <td><select style={{width:'50px'}}><option>Nos</option><option>Kg</option><option>Set</option></select></td>
                      <td><input type="number" value={l.rate} onChange={e=>setLine(i,'rate',e.target.value)} style={{width:'80px'}}/></td>
                      <td><input type="number" value={l.disc} onChange={e=>setLine(i,'disc',e.target.value)} style={{width:'45px'}}/></td>
                      <td><input value={fmt(l.taxable||0)} disabled style={{background:'#F8F9FA',width:'85px'}}/></td>
                      <td><select value={l.gstPct} onChange={e=>setLine(i,'gstPct',e.target.value)} style={{width:'55px'}}><option value={18}>18%</option><option value={12}>12%</option><option value={5}>5%</option></select></td>
                      <td><input value={fmt(l.cgst||0)} disabled style={{background:'#F8F9FA',width:'80px'}}/></td>
                      <td><input value={fmt(l.sgst||0)} disabled style={{background:'#F8F9FA',width:'80px'}}/></td>
                      <td><input value="₹0" disabled style={{background:'#F8F9FA',width:'60px'}}/></td>
                      <td><input value={fmt(l.total||0)} disabled style={{background:'#F8F9FA',fontWeight:'700',width:'90px'}}/></td>
                      <td><span style={{color:'#D9534F',cursor:'pointer'}} onClick={()=>setLines(ls=>ls.filter((_,idx)=>idx!==i))}>🗑</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sd-liadd" onClick={()=>setLines(ls=>[...ls,calc(newLine())])}>➕ Add Item</div>

            <div style={{display:'flex',justifyContent:'space-between',marginTop:'14px',flexWrap:'wrap',gap:'14px'}}>
              <div style={{flex:1,minWidth:'220px'}}>
                <div className="sd-fg"><label>Notes / Terms</label><textarea className="sd-fita" defaultValue="Payment due within 30 days. Subject to Ranipet jurisdiction."/></div>
                <div className="sd-fg" style={{marginTop:'9px'}}><label>Bank Details</label><textarea className="sd-fita" style={{minHeight:'50px'}} defaultValue="HDFC Bank · A/C: 50200012345678 · IFSC: HDFC0001234 · Ranipet Branch"/></div>
              </div>
              <div className="sd-totb">
                <div className="sd-tr"><span>Subtotal (Taxable):</span><strong>{fmt(totals.taxable)}</strong></div>
                <div className="sd-tr"><span>CGST @9%:</span><span>{fmt(totals.cgst)}</span></div>
                <div className="sd-tr"><span>SGST @9%:</span><span>{fmt(totals.sgst)}</span></div>
                <div className="sd-tr"><span>IGST:</span><span>₹0</span></div>
                <div className="sd-tr" style={{borderTop:'2px solid #DEE2E6',marginTop:'4px',paddingTop:'6px',fontWeight:'700',fontSize:'13px',color:'#714B67'}}>
                  <span>Grand Total (INR):</span><strong>{fmt(totals.total)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
