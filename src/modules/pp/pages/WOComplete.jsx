import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function WOComplete() {
  const nav = useNavigate()
  const [closed, setClosed] = useState(false)

  if (closed) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}></div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:'var(--odoo-green)'}}>WO-2025-017 Closed Successfully!</div>
      <div style={{fontSize:'13px',color:'var(--odoo-gray)',textAlign:'center'}}>
        200 Kg Ring Yarn posted to FG stock &nbsp;|&nbsp; COGM variance journal created &nbsp;|&nbsp; WM updated
      </div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}>← Work Orders</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/pp/report')}> View Report</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Close Work Order <small>WO-2025-017 · Final Settlement</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}>← Back</button>
          <button className="btn btn-p sd-bsm" onClick={() => setClosed(true)}> Close & Post FG to Stock</button>
        </div>
      </div>

      <div className="pp-alert success">All production entries complete. Ready for final settlement and stock posting.</div>

      {/* WO Summary */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Final Settlement — WO-2025-017</div>
        <div className="fi-form-sec-body">
          <div className="acct-strip" style={{marginBottom:'14px'}}>
            {[['Work Order','WO-2025-017'],['Product','Ring Yarn (40s Count)'],['Machine','RFM-01'],['Planned Qty','200 Kg'],['Produced','200 Kg'],['Status','100% Complete']].map(([l,v])=>(
              <div key={l} className="acct-strip-item"><span>{l}</span><div>{v}</div></div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'14px'}}>
            {[['Planned Cost','₹42,000','var(--odoo-blue)'],['Actual Cost','₹43,250','var(--odoo-orange)'],
              ['Variance','₹1,250 (Over)','var(--odoo-red)'],['Efficiency','94%','var(--odoo-green)']].map(([l,v,c])=>(
              <div key={l} style={{background:'#fff',borderRadius:'8px',padding:'14px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',textAlign:'center'}}>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase',marginBottom:'6px'}}>{l}</div>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'18px',color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Cost Breakdown</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>Cost Element</th><th>Planned (₹)</th><th>Actual (₹)</th><th>Variance (₹)</th><th>%</th></tr></thead>
            <tbody>
              {[['Raw Material — Cotton Sliver','28,000','28,600','+600','2.1%'],
                ['Labour — Ring Spinning','8,000','8,400','+400','5.0%'],
                ['Machine Overhead — RFM-01','4,500','4,800','+300','6.7%'],
                ['Power & Utilities','1,500','1,450','-50','-3.3%'],
                ['Total','42,000','43,250','+1,250','3.0%'],
              ].map(([el,p,a,v,pct],i)=>(
                <tr key={el} style={i===4?{fontWeight:'700',background:'#F8F9FA'}:{}}>
                  <td>{el}</td>
                  <td className="dr">₹{p}</td>
                  <td className="dr">₹{a}</td>
                  <td style={{color:v.startsWith('-')?'var(--odoo-green)':'var(--odoo-red)',fontWeight:'600'}}>{v}</td>
                  <td style={{color:v.startsWith('-')?'var(--odoo-green)':'var(--odoo-orange)',fontSize:'11px'}}>{pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FI Auto Journals */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr"> Auto FI Journals on Closure</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>Account</th><th>Dr</th><th>Cr</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td>1400 · Finished Goods Inventory</td><td className="dr">₹43,250</td><td>—</td><td>FG stock posting — 200 Kg</td></tr>
              <tr><td>6110 · COGM — Manufacturing Cost</td><td>—</td><td className="cr">₹42,000</td><td>Standard cost transfer</td></tr>
              <tr><td>6800 · Production Variance</td><td>—</td><td className="cr">₹1,250</td><td>Over-absorption variance</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}>← Back</button>
        <button className="btn btn-p sd-bsm" onClick={() => setClosed(true)}> Close & Post FG to Stock</button>
      </div>
    </div>
  )
}
