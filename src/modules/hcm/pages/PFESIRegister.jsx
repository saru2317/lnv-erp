import React from 'react'
import { EMPLOYEES } from './_sharedData'

export default function PFESIRegister() {
  const data = EMPLOYEES.map(e=>{
    const basic=e.basic, da=Math.round(e.basic*0.30)
    const gross=basic+da+Math.round(e.basic*0.10)+800+500
    const pf_wages=Math.min(basic,15000)
    const pf_ee=Math.round(pf_wages*0.12), pf_er=Math.round(pf_wages*0.13)
    const esi_wages=gross<=21000?gross:0
    const esi_ee=Math.round(esi_wages*0.0075), esi_er=Math.round(esi_wages*0.0325)
    return {...e,gross,pf_wages,pf_ee,pf_er,esi_wages,esi_ee,esi_er,pf_total:pf_ee+pf_er,esi_total:esi_ee+esi_er}
  })
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">PF & ESI Register <small>February 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Download Challan</button>
          <button className="btn btn-p sd-bsm">File ECR</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'16px'}}>
        {[['PF EE Total',`₹${data.reduce((s,d)=>s+d.pf_ee,0).toLocaleString()}`,'var(--odoo-blue)'],
          ['PF ER Total',`₹${data.reduce((s,d)=>s+d.pf_er,0).toLocaleString()}`,'var(--odoo-purple)'],
          ['ESI EE Total',`₹${data.reduce((s,d)=>s+d.esi_ee,0).toLocaleString()}`,'var(--odoo-green)'],
          ['ESI ER Total',`₹${data.reduce((s,d)=>s+d.esi_er,0).toLocaleString()}`,'var(--odoo-orange)'],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:'#fff',borderRadius:'8px',padding:'12px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',borderLeft:`4px solid ${c}`}}>
            <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'4px'}}>{l}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <div className="pp-alert info">📅 PF Challan due: <strong>15 March 2025</strong> · ESI Challan due: <strong>15 March 2025</strong></div>
      <table className="fi-data-table">
        <thead><tr><th>Employee</th><th>PF Wages</th><th>PF(EE) 12%</th><th>PF(ER) 13%</th><th>PF Total</th><th>ESI Wages</th><th>ESI(EE) 0.75%</th><th>ESI(ER) 3.25%</th></tr></thead>
        <tbody>
          {data.map(e=>(
            <tr key={e.id}>
              <td><strong>{e.name}</strong><div style={{fontSize:'10px',color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace'}}>{e.id}</div></td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>₹{e.pf_wages.toLocaleString()}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-blue)'}}>₹{e.pf_ee.toLocaleString()}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>₹{e.pf_er.toLocaleString()}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700'}}>₹{e.pf_total.toLocaleString()}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{e.esi_wages>0?`₹${e.esi_wages.toLocaleString()}`:'Excluded'}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-green)'}}>{e.esi_ee>0?`₹${e.esi_ee}`:'—'}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-orange)'}}>{e.esi_er>0?`₹${e.esi_er}`:'—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr style={{background:'#F8F9FA',fontWeight:'700'}}>
          <td>Total</td>
          <td></td>
          <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-blue)'}}>₹{data.reduce((s,d)=>s+d.pf_ee,0).toLocaleString()}</td>
          <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)'}}>₹{data.reduce((s,d)=>s+d.pf_er,0).toLocaleString()}</td>
          <td style={{fontFamily:'DM Mono,monospace',fontWeight:'800'}}>₹{data.reduce((s,d)=>s+d.pf_total,0).toLocaleString()}</td>
          <td></td>
          <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>₹{data.reduce((s,d)=>s+d.esi_ee,0).toLocaleString()}</td>
          <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-orange)'}}>₹{data.reduce((s,d)=>s+d.esi_er,0).toLocaleString()}</td>
        </tr></tfoot>
      </table>
    </div>
  )
}
