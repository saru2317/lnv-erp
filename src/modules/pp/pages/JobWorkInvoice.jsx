import React, { useState } from 'react'
import { JOB_CARDS, JOB_STEPS, RATE_CARDS, PP_CUSTOMERS } from './_ppConfig'

export default function JobWorkInvoice() {
  const [jobId,    setJobId]    = useState(JOB_CARDS[0]?.id||'')
  const [saved,    setSaved]    = useState(false)
  const [invoiceNo]= useState(`JWI-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100).padStart(3,'0')}`)

  const job      = JOB_CARDS.find(j=>j.id===jobId)
  const steps    = JOB_STEPS[jobId]||[]
  const customer = PP_CUSTOMERS.find(c=>c.id===job?.customerId)
  const doneSteps= steps.filter(s=>s.status==='Done'||s.status==='Running')

  const lineItems= doneSteps.map(s=>{
    const rc = RATE_CARDS.find(r=>r.customerId===job?.customerId&&r.process===s.step&&r.status==='Active')
    const qty= s.qty||job?.qty||0
    const rate= rc?parseFloat(rc.rate):0
    const amt = rate*qty
    return {step:s.step, qty, unit:rc?.unit||'Per Piece', rate, amount:amt, wcId:s.wcId, operator:s.operator}
  })

  const subtotal = lineItems.reduce((s,l)=>s+l.amount,0)
  const gstRate  = 18
  const gstAmt   = subtotal*gstRate/100
  const total    = subtotal+gstAmt

  const today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'})

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Job Work Invoice <small>Auto-calculated from rate card</small></div>
        <div className="fi-lv-actions">
          <select className="sd-select" value={jobId} onChange={e=>{setJobId(e.target.value);setSaved(false)}}>
            {JOB_CARDS.map(j=><option key={j.id} value={j.id}>{j.id} — {j.customerName}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={()=>window.print()}>Print</button>
          <button className="btn btn-p btn-s" onClick={()=>setSaved(true)}>Save Invoice</button>
        </div>
      </div>

      {saved&&<div className="pp-alert" style={{marginBottom:'14px',background:'#D4EDDA',borderColor:'#C3E6CB',color:'#155724'}}>Invoice <strong>{invoiceNo}</strong> saved! Ready for dispatch.</div>}

      {job&&customer&&(
        <div style={{background:'#fff',border:'1px solid var(--odoo-border)',borderRadius:'12px',overflow:'hidden',maxWidth:'860px'}}>
          {/* Invoice header */}
          <div style={{background:'var(--odoo-purple)',padding:'20px 24px',color:'#fff',display:'flex',justifyContent:'space-between'}}>
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:'22px',fontWeight:'800',marginBottom:'4px'}}>JOB WORK INVOICE</div>
              <div style={{fontSize:'13px',opacity:.85}}>Tax Invoice under GST</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:'18px',fontWeight:'800'}}>{invoiceNo}</div>
              <div style={{fontSize:'12px',opacity:.85}}>Date: {today}</div>
              <div style={{marginTop:'4px'}}>
                <span style={{padding:'3px 10px',borderRadius:'10px',fontSize:'11px',fontWeight:'700',
                  background:doneSteps.length===steps.length?'#D4EDDA22':'#FFF3CD22',
                  border:'1px solid rgba(255,255,255,.3)',color:'#fff'}}>
                  {doneSteps.length===steps.length?' Fully Completed':'⏳ Partial — In Progress'}
                </span>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0',borderBottom:'1px solid var(--odoo-border)'}}>
            <div style={{padding:'16px 20px',borderRight:'1px solid var(--odoo-border)'}}>
              <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'6px'}}>FROM (Processor)</div>
              <div style={{fontWeight:'800',fontSize:'14px',color:'var(--odoo-purple)'}}>LNV Manufacturing Pvt. Ltd.</div>
              <div style={{fontSize:'12px',color:'var(--odoo-gray)',marginTop:'2px'}}>Ranipet, Tamil Nadu — 632401</div>
              <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>GSTIN: 33AABCL1234F1Z5</div>
            </div>
            <div style={{padding:'16px 20px'}}>
              <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'6px'}}>TO (Customer)</div>
              <div style={{fontWeight:'800',fontSize:'14px'}}>{customer.name}</div>
              <div style={{fontSize:'12px',color:'var(--odoo-gray)',marginTop:'2px'}}>{customer.city||'—'}, {customer.state||'Tamil Nadu'}</div>
              <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>GSTIN: {customer.gst||'—'}</div>
              <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>Contact: {customer.contact} · {customer.phone}</div>
            </div>
          </div>

          {/* Job reference */}
          <div style={{padding:'10px 20px',background:'#F8F9FA',borderBottom:'1px solid var(--odoo-border)',display:'flex',gap:'24px',fontSize:'12px'}}>
            <span>Job Card: <strong style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)'}}>{job.id}</strong></span>
            <span>Customer DC: <strong style={{fontFamily:'DM Mono,monospace'}}>{job.dcNo}</strong></span>
            <span>Item: <strong>{job.item}</strong></span>
            <span> Total Qty: <strong style={{fontFamily:'DM Mono,monospace'}}>{job.qty} {job.unit}</strong></span>
          </div>

          {/* Line items */}
          <div style={{padding:'0'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
              <thead>
                <tr style={{background:'#F0EEEB'}}>
                  <th style={{padding:'8px 20px',textAlign:'left',fontWeight:'700',fontSize:'11px',color:'var(--odoo-gray)'}}>S.No</th>
                  <th style={{padding:'8px',textAlign:'left',fontWeight:'700',fontSize:'11px',color:'var(--odoo-gray)'}}>Process / Service</th>
                  <th style={{padding:'8px',textAlign:'right',fontWeight:'700',fontSize:'11px',color:'var(--odoo-gray)'}}>Work Center</th>
                  <th style={{padding:'8px',textAlign:'right',fontWeight:'700',fontSize:'11px',color:'var(--odoo-gray)'}}>Qty</th>
                  <th style={{padding:'8px',textAlign:'right',fontWeight:'700',fontSize:'11px',color:'var(--odoo-gray)'}}>Unit</th>
                  <th style={{padding:'8px',textAlign:'right',fontWeight:'700',fontSize:'11px',color:'var(--odoo-gray)'}}>Rate (₹)</th>
                  <th style={{padding:'8px 20px',textAlign:'right',fontWeight:'700',fontSize:'11px',color:'var(--odoo-gray)'}}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((l,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid var(--odoo-border)'}}>
                    <td style={{padding:'8px 20px',color:'var(--odoo-gray)'}}>{i+1}</td>
                    <td style={{padding:'8px',fontWeight:'600'}}>{l.step}</td>
                    <td style={{padding:'8px',textAlign:'right',fontSize:'11px',color:'var(--odoo-gray)'}}>{l.wcId||'—'}</td>
                    <td style={{padding:'8px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:'600'}}>{l.qty}</td>
                    <td style={{padding:'8px',textAlign:'right',fontSize:'11px',color:'var(--odoo-gray)'}}>{l.unit}</td>
                    <td style={{padding:'8px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{l.rate.toFixed(2)}</td>
                    <td style={{padding:'8px 20px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)'}}>{l.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{display:'flex',justifyContent:'flex-end',padding:'12px 20px',borderTop:'2px solid var(--odoo-border)'}}>
            <div style={{minWidth:'260px'}}>
              {[
                {l:'Subtotal (Taxable Amount)',v:subtotal.toFixed(2),bold:false},
                {l:`CGST @ ${gstRate/2}%`,    v:(gstAmt/2).toFixed(2),bold:false},
                {l:`SGST @ ${gstRate/2}%`,    v:(gstAmt/2).toFixed(2),bold:false},
              ].map(({l,v,bold})=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:'12px',borderBottom:'1px solid var(--odoo-border)'}}>
                  <span style={{color:'var(--odoo-gray)'}}>{l}</span>
                  <span style={{fontFamily:'DM Mono,monospace',fontWeight:bold?'800':'400'}}>₹{v}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 0',fontSize:'16px',fontWeight:'800'}}>
                <span style={{color:'var(--odoo-purple)'}}>TOTAL</span>
                <span style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)'}}>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{padding:'12px 20px',background:'#F8F9FA',borderTop:'1px solid var(--odoo-border)',fontSize:'11px',color:'var(--odoo-gray)',display:'flex',justifyContent:'space-between'}}>
            <span>Payment terms: 30 days from invoice date</span>
            <span>This is a computer-generated invoice</span>
          </div>
        </div>
      )}
    </div>
  )
}
