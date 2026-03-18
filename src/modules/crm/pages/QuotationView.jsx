import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QUOTATIONS, QT_STATUS_COLORS, fmtFull } from './_crmData'

export default function QuotationView() {
  const nav = useNavigate()
  const { id } = useParams()
  const qt = QUOTATIONS.find(q=>q.id===id) || QUOTATIONS[0]
  const [status, setStatus] = useState(qt.status)
  const [showRevise, setShowRevise] = useState(false)
  const [newDiscount, setNewDiscount] = useState(qt.discount)

  const tax = qt.finalAmount * 0.18
  const total = qt.finalAmount + tax

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--odoo-purple)',marginRight:'6px'}} onClick={()=>nav('/crm/quotations')}>← Quotations</button>
          {qt.id} <small>— {qt.company}</small>
        </div>
        <div className="fi-lv-actions">
          <span className={`crm-badge ${QT_STATUS_COLORS[status]||'crm-badge-new'}`} style={{fontSize:'13px',padding:'4px 14px'}}>{status}</span>
          {status==='Draft'&&<button className="btn btn-p btn-s" onClick={()=>setStatus('Sent')}>📧 Send to Customer</button>}
          {status==='Sent'&&<><button className="btn btn-s sd-bsm" onClick={()=>setShowRevise(true)}>✏️ Revise</button>
          <button className="btn btn-p btn-s" style={{background:'var(--odoo-green)'}} onClick={()=>setStatus('Won')}>✓ Mark Won</button>
          <button className="btn btn-s" style={{background:'var(--odoo-red)',color:'#fff'}} onClick={()=>setStatus('Lost')}>✗ Mark Lost</button></>}
          {status==='Won'&&<button className="btn btn-p btn-s" onClick={()=>nav('/crm/opportunities')}>→ Create Sales Order</button>}
        </div>
      </div>

      {status==='Won'&&<div className="pp-alert" style={{background:'#D4EDDA',borderColor:'var(--odoo-green)',marginBottom:'14px'}}>🏆 <strong>Quotation Won!</strong> Proceed to create a Sales Order in the SD module.</div>}
      {status==='Sent'&&<div className="pp-alert warn" style={{marginBottom:'14px'}}>📧 Quotation sent to {qt.company}. Valid until <strong>{qt.validity}</strong>. Awaiting customer response.</div>}

      {showRevise&&(
        <div className="fi-panel" style={{marginBottom:'14px',border:'2px solid var(--odoo-orange)'}}>
          <div className="fi-panel-hdr"><h3>✏️ Revise Quotation</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field">
                <label>New Discount (%)</label>
                <input type="number" value={newDiscount} onChange={e=>setNewDiscount(e.target.value)} min="0" max="100" />
              </div>
              <div className="sd-field">
                <label>New Validity Date</label>
                <input type="date" defaultValue={qt.validity} />
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
              <button className="btn btn-p btn-s" onClick={()=>setShowRevise(false)}>Save Revision</button>
              <button className="btn btn-s sd-bsm" onClick={()=>setShowRevise(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'16px'}}>
        {/* Quotation Document */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📄 Quotation Document</h3></div>
          <div className="fi-panel-body">
            {/* Header */}
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'20px',paddingBottom:'16px',borderBottom:'2px solid var(--odoo-purple)'}}>
              <div>
                <div style={{fontSize:'22px',fontWeight:'800',fontFamily:'Syne,sans-serif',color:'var(--odoo-purple)'}}>LNV Manufacturing Pvt. Ltd.</div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>Surface Treatment & Coating Solutions</div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>Ranipet, Tamil Nadu — GSTIN: 33AABCL1234F1Z5</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'DM Mono,monospace',fontWeight:'800',fontSize:'18px',color:'var(--odoo-purple)'}}>{qt.id}</div>
                <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>Date: {qt.date}</div>
                <div style={{fontSize:'12px',color:'var(--odoo-orange)'}}>Valid: {qt.validity}</div>
              </div>
            </div>

            {/* To */}
            <div style={{marginBottom:'16px',padding:'10px',background:'#F8F9FA',borderRadius:'6px'}}>
              <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',marginBottom:'4px'}}>TO:</div>
              <div style={{fontWeight:'700',fontSize:'14px'}}>{qt.company}</div>
            </div>

            {/* Items table */}
            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'16px'}}>
              <thead>
                <tr style={{background:'var(--odoo-purple)',color:'#fff'}}>
                  {['#','Product / Service','Unit Price','Discount','Net Amount'].map(h=>(
                    <th key={h} style={{padding:'8px 10px',textAlign:h==='#'?'center':'left',fontSize:'12px'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{borderBottom:'1px solid var(--odoo-border)'}}>
                  <td style={{padding:'10px',textAlign:'center',fontSize:'12px'}}>1</td>
                  <td style={{padding:'10px',fontWeight:'600',fontSize:'13px'}}>{qt.product}</td>
                  <td style={{padding:'10px',fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{fmtFull(qt.amount)}</td>
                  <td style={{padding:'10px',fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-orange)'}}>{qt.discount}%</td>
                  <td style={{padding:'10px',fontFamily:'DM Mono,monospace',fontWeight:'700',fontSize:'12px'}}>{fmtFull(qt.finalAmount)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <div style={{width:'280px'}}>
                {[['Subtotal',fmtFull(qt.finalAmount)],['GST @ 18%',fmtFull(tax)]].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 10px',fontSize:'12px',borderBottom:'1px solid var(--odoo-border)'}}>
                    <span>{l}</span><span style={{fontFamily:'DM Mono,monospace'}}>{v}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',fontSize:'14px',fontWeight:'800',background:'var(--odoo-purple)',color:'#fff',borderRadius:'0 0 6px 6px'}}>
                  <span>TOTAL</span><span style={{fontFamily:'DM Mono,monospace'}}>{fmtFull(total)}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div style={{marginTop:'16px',padding:'10px',background:'#F0EEEB',borderRadius:'6px',fontSize:'12px'}}>
              <div style={{fontWeight:'700',marginBottom:'6px'}}>Terms & Conditions:</div>
              <div style={{color:'var(--odoo-gray)',lineHeight:'1.7'}}>
                Payment: {qt.status==='Won'?'Per agreed terms':'30 Days from invoice'} · Delivery: 30 days from order confirmation · Warranty: 1 year against manufacturing defects
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>📊 Quote Details</h3></div>
            <div className="fi-panel-body">
              {[['Salesperson',qt.owner],['Opportunity',qt.oppId||'Direct'],['Discount',qt.discount+'%'],['Final Amount',fmtFull(qt.finalAmount)],['GST (18%)',fmtFull(tax)],['Total',fmtFull(total)]].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--odoo-border)',fontSize:'12px'}}>
                  <span style={{color:'var(--odoo-gray)'}}>{k}</span>
                  <strong style={{fontFamily:k.includes('Amount')||k.includes('Total')||k.includes('GST')?'DM Mono,monospace':'inherit'}}>{v}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>⚡ Actions</h3></div>
            <div className="fi-panel-body" style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              <button className="btn btn-s sd-bsm" style={{width:'100%'}}>🖨️ Print Quotation</button>
              <button className="btn btn-s sd-bsm" style={{width:'100%'}}>📧 Email to Customer</button>
              <button className="btn btn-s sd-bsm" style={{width:'100%'}}>⬇️ Download PDF</button>
              {status==='Won'&&<button className="btn btn-p btn-s" style={{width:'100%'}} onClick={()=>nav('/crm/opportunities')}>→ Create Sales Order</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
