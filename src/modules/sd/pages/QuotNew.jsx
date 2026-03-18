import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const PRODUCTS = [
  {hsn:'8448 59 90',name:'ARISER COMFACT SYSTEM',rate:1200,gst:18},
  {hsn:'8448 49 00',name:'COMPACT SPARES',rate:2100,gst:12},
  {hsn:'8448 49 10',name:'LATTICE APRONS C121',rate:450,gst:18},
]
const newLine = () => ({hsn:'8448 59 90',product:'ARISER COMFACT SYSTEM',qty:100,rate:1200,gstPct:18})
const calc = l => {const t=l.qty*l.rate;const g=t*l.gstPct/100;return{...l,taxable:t,total:t+g}}
const fmt = n => '₹'+Math.round(n||0).toLocaleString('en-IN')

export default function QuotNew() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const valid = new Date(Date.now()+30*86400000).toISOString().split('T')[0]
  const [lines, setLines] = useState([calc(newLine())])
  const setLine=(i,f,v)=>setLines(ls=>ls.map((l,idx)=>idx===i?calc({...l,[f]:['qty','rate','gstPct'].includes(f)?Number(v):v}):l))
  const totals = lines.reduce((a,l)=>({taxable:a.taxable+(l.taxable||0),total:a.total+(l.total||0)}),{taxable:0,total:0})

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">New Sales Quotation <small>VA21</small></div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={()=>navigate('/sd/quotations')}>✕ Cancel</button>
          <button className="btn btn-sm" style={{background:'#E06F39',color:'#fff',border:'none',borderRadius:'6px',padding:'5px 11px',fontWeight:'700',cursor:'pointer'}} onClick={()=>toast.success('Quotation saved as draft!')}>📋 Save Draft</button>
          <button className="btn btn-p" onClick={()=>{toast.success('QT-0032 Sent! 📧');navigate('/sd/quotations')}}>📧 Send Quotation</button>
        </div>
      </div>
      <div className="sd-fc"><div className="sd-fb2">
        <div className="sd-sec">
          <div className="sd-stt">📝 Quotation Header</div>
          <div className="sd-fg3">
            <div className="sd-fg"><label>Quotation #</label><input className="sd-fi" value="QT-0032" disabled/></div>
            <div className="sd-fg"><label>Date</label><input className="sd-fi" type="date" defaultValue={today}/></div>
            <div className="sd-fg"><label>Valid Until</label><input className="sd-fi" type="date" defaultValue={valid}/></div>
            <div className="sd-fg sp2"><label>Customer <span className="req">*</span></label>
              <select className="sd-fis"><option value="">-- Select --</option><option>Sri Lakshmi Mills</option><option>Coimbatore Spinners</option><option>Rajesh Textiles</option><option>ARS Cotton Mills</option></select>
            </div>
            <div className="sd-fg"><label>Currency</label><select className="sd-fis"><option>INR</option><option>USD</option></select></div>
          </div>
        </div>
        <div className="sd-sec">
          <div className="sd-stt">📦 Items</div>
          <div style={{overflowX:'auto'}}>
            <table className="sd-li">
              <thead><tr><th>#</th><th>HSN</th><th>Product</th><th>Qty</th><th>Unit</th><th>Rate</th><th>GST%</th><th>Total</th><th></th></tr></thead>
              <tbody>
                {lines.map((l,i)=>(
                  <tr key={i}>
                    <td>{i+1}</td>
                    <td><input value={l.hsn} onChange={e=>setLine(i,'hsn',e.target.value)} style={{width:'80px'}}/></td>
                    <td><select value={l.product} onChange={e=>{const p=PRODUCTS.find(p=>p.name===e.target.value);if(p)setLines(ls=>ls.map((ln,idx)=>idx===i?calc({...ln,product:p.name,hsn:p.hsn,rate:p.rate,gstPct:p.gst}):ln))}} style={{width:'165px'}}>{PRODUCTS.map(p=><option key={p.name}>{p.name}</option>)}</select></td>
                    <td><input type="number" value={l.qty} onChange={e=>setLine(i,'qty',e.target.value)} style={{width:'60px'}}/></td>
                    <td><select style={{width:'50px'}}><option>Nos</option><option>Kg</option></select></td>
                    <td><input type="number" value={l.rate} onChange={e=>setLine(i,'rate',e.target.value)} style={{width:'75px'}}/></td>
                    <td><select value={l.gstPct} onChange={e=>setLine(i,'gstPct',e.target.value)} style={{width:'50px'}}><option value={18}>18%</option><option value={12}>12%</option><option value={5}>5%</option></select></td>
                    <td><input value={fmt(l.total)} disabled style={{background:'#F8F9FA',fontWeight:'700',width:'90px'}}/></td>
                    <td><span style={{color:'#D9534F',cursor:'pointer'}} onClick={()=>setLines(ls=>ls.filter((_,idx)=>idx!==i))}>🗑</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sd-liadd" onClick={()=>setLines(ls=>[...ls,calc(newLine())])}>➕ Add Item</div>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:'10px'}}>
            <div className="sd-totb">
              <div className="sd-tr"><span>Subtotal:</span><strong>{fmt(totals.taxable)}</strong></div>
              <div className="sd-tr"><span>GST @18%:</span><span>{fmt(totals.total-totals.taxable)}</span></div>
              <div className="sd-tr" style={{borderTop:'2px solid #DEE2E6',marginTop:'4px',paddingTop:'6px',fontWeight:'700',fontSize:'13px',color:'#714B67'}}><span>Total:</span><strong>{fmt(totals.total)}</strong></div>
            </div>
          </div>
        </div>
      </div></div>
    </div>
  )
}
