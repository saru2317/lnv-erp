import React, { useState } from 'react'
import { EMPLOYEES } from './_sharedData'

const SAL_DATA = EMPLOYEES.map(e => {
  const basic = e.basic
  const da = Math.round(basic*0.30)
  const hra = Math.round(basic*0.10)
  const conv = 800
  const special = Math.round((e.ctc/12) - basic - da - hra - conv - basic*0.12 - (basic+da+hra+conv)*0.0325 - basic*0.0481)
  const gross = basic+da+hra+conv+(special>0?special:0)
  const pf_ee = Math.min(Math.round(basic*0.12),1800)
  const esi_ee = gross<=21000?Math.round(gross*0.0075):0
  const pt = 150
  const net = gross-pf_ee-esi_ee-pt
  const pf_er = Math.min(Math.round(basic*0.13),1950)
  const esi_er = gross<=21000?Math.round(gross*0.0325):0
  const gratuity = Math.round(basic*0.0481)
  const ecost = gross+pf_er+esi_er+gratuity
  return {...e,basic,da,hra,conv,special:special>0?special:0,gross,pf_ee,esi_ee,pt,net,pf_er,esi_er,gratuity,ecost}
})

export default function SalaryMaster() {
  const [search, setSearch] = useState('')
  const filtered = SAL_DATA.filter(e=>e.name.toLowerCase().includes(search.toLowerCase())||e.id.includes(search))
  const totalPaybill = filtered.reduce((s,e)=>s+e.gross,0)
  const totalEcost = filtered.reduce((s,e)=>s+e.ecost,0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Salary Master <small>Employee-wise CTC Breakdown</small></div>
        <div className="fi-lv-actions">
          <input placeholder="🔍 Search employee..." className="fi-filter-select" style={{width:'200px'}} onChange={e=>setSearch(e.target.value)}/>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm">Process Payroll</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
        {[['Total Gross Pay Bill',`₹${(totalPaybill/100000).toFixed(2)}L`,'var(--odoo-green)'],
          ['Total E-Cost (Employer)',`₹${(totalEcost/100000).toFixed(2)}L`,'var(--odoo-orange)'],
          ['Avg CTC per Employee',`₹${Math.round(totalEcost/filtered.length/1000)}K/mo`,'var(--odoo-purple)'],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:'#fff',borderRadius:'8px',padding:'14px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',borderLeft:`4px solid ${c}`}}>
            <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'4px'}}>{l}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'22px',fontWeight:'800',color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{overflowX:'auto'}}>
        <table className="fi-data-table" style={{minWidth:'1100px'}}>
          <thead><tr>
            <th>Employee</th><th>Grade</th>
            <th>Basic</th><th>DA</th><th>HRA</th><th>Conv.</th><th>Special</th>
            <th>Gross</th><th>PF(EE)</th><th>ESI(EE)</th><th>PT</th>
            <th>Net Pay</th><th>E-Cost</th>
          </tr></thead>
          <tbody>
            {filtered.map(e=>(
              <tr key={e.id}>
                <td>
                  <div style={{fontWeight:'700',fontSize:'12px'}}>{e.name}</div>
                  <div style={{fontSize:'10px',color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace'}}>{e.id} · {e.dept}</div>
                </td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',textAlign:'center'}}>{e.grade}</td>
                {[e.basic,e.da,e.hra,e.conv,e.special].map((v,i)=>(
                  <td key={i} style={{fontFamily:'DM Mono,monospace',fontSize:'11px',textAlign:'right',color:'var(--odoo-dark)'}}>
                    {v>0?v.toLocaleString():'—'}
                  </td>
                ))}
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',textAlign:'right',color:'var(--odoo-green)'}}>
                  {e.gross.toLocaleString()}
                </td>
                {[e.pf_ee,e.esi_ee,e.pt].map((v,i)=>(
                  <td key={i} style={{fontFamily:'DM Mono,monospace',fontSize:'11px',textAlign:'right',color:'var(--odoo-red)'}}>
                    {v>0?v.toLocaleString():'—'}
                  </td>
                ))}
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'800',textAlign:'right',color:'var(--odoo-purple)'}}>
                  {e.net.toLocaleString()}
                </td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',textAlign:'right',color:'var(--odoo-orange)'}}>
                  {e.ecost.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background:'#EDE0EA',fontWeight:'700'}}>
              <td colSpan={7}>Total ({filtered.length} employees)</td>
              <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',color:'var(--odoo-green)'}}>
                {filtered.reduce((s,e)=>s+e.gross,0).toLocaleString()}
              </td>
              <td colSpan={3}></td>
              <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',color:'var(--odoo-purple)'}}>
                {filtered.reduce((s,e)=>s+e.net,0).toLocaleString()}
              </td>
              <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',color:'var(--odoo-orange)'}}>
                {filtered.reduce((s,e)=>s+e.ecost,0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
