import React, { useState } from 'react'

const PAY_STRUCTURES = {
  'Worker-Standard': {
    earnings:[
      {comp:'Basic Wage',basis:'Fixed',calc:'Grade-wise slab',taxable:true,pf:true,esi:true,pct:100},
      {comp:'Dearness Allowance (DA)',basis:'% of Basic',calc:'30% of Basic',taxable:true,pf:false,esi:true,pct:30},
      {comp:'House Rent Allowance (HRA)',basis:'% of Basic',calc:'10% of Basic',taxable:false,pf:false,esi:true,pct:10},
      {comp:'Conveyance Allowance',basis:'Fixed',calc:'₹800/month',taxable:false,pf:false,esi:true,pct:0},
      {comp:'Special Allowance',basis:'CTC Balancer',calc:'CTC - All others',taxable:true,pf:false,esi:true,pct:0},
      {comp:'OT Pay',basis:'Per Hour',calc:'Basic ÷ 208 × OT Hrs × 2',taxable:true,pf:true,esi:true,pct:0},
    ],
    deductions:[
      {comp:'PF Employee (EE)',basis:'% of Basic',calc:'12% of Basic (max ₹15,000)',taxable:false,pct:12},
      {comp:'ESI Employee (EE)',basis:'% of Gross',calc:'0.75% of Gross Wages',taxable:false,pct:0.75},
      {comp:'Professional Tax (PT)',basis:'Slab',calc:'₹150/month (₹200 in Feb)',taxable:false,pct:0},
      {comp:'LOP Deduction',basis:'Per Day',calc:'Basic ÷ 26 × LOP Days',taxable:false,pct:0},
    ],
    employer:[
      {comp:'PF Employer (ER)',basis:'% of Basic',calc:'13% of Basic',pct:13},
      {comp:'ESI Employer (ER)',basis:'% of Gross',calc:'3.25% of Gross Wages',pct:3.25},
      {comp:'Gratuity Provision',basis:'% of Basic',calc:'4.81% of Basic',pct:4.81},
      {comp:'Bonus Provision',basis:'% of Basic',calc:'8.33% of Basic',pct:8.33},
    ]
  }
}

export default function PayComponents() {
  const [struct, setStruct] = useState('Worker-Standard')
  const [basic, setBasic] = useState(10000)
  const structure = PAY_STRUCTURES['Worker-Standard']

  const da = Math.round(basic*0.30)
  const hra = Math.round(basic*0.10)
  const conv = 800
  const gross = basic+da+hra+conv+500 // 500 special
  const pf_ee = Math.min(Math.round(basic*0.12), 1800)
  const esi_ee = Math.round(gross*0.0075)
  const pt = 150
  const net = gross - pf_ee - esi_ee - pt

  const pf_er = Math.min(Math.round(basic*0.13),1950)
  const esi_er = Math.round(gross*0.0325)
  const gratuity = Math.round(basic*0.0481)
  const bonus = Math.round(basic*0.0833)
  const employer_cost = gross + pf_er + esi_er + gratuity + bonus

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Pay Components & CTC Structure <small>Master Configuration</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Add Component</button>
          <button className="btn btn-p sd-bsm">Save Structure</button>
        </div>
      </div>

      <div style={{display:'flex',gap:'10px',marginBottom:'14px',flexWrap:'wrap',alignItems:'center'}}>
        {['Worker-Standard','Staff-Standard','Management'].map(s=>(
          <button key={s} className={`btn ${struct===s?'btn-p':'btn-s'} sd-bsm`} onClick={()=>setStruct(s)}>{s}</button>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Structure table */}
        <div>
          <div className="fi-form-sec">
            <div className="fi-form-sec-hdr">Earnings Components</div>
            <div style={{padding:'0'}}>
              <table className="fi-data-table">
                <thead><tr><th>Component</th><th>Basis</th><th>Formula</th><th>Taxable</th><th>PF</th><th>ESI</th></tr></thead>
                <tbody>
                  {structure.earnings.map(e=>(
                    <tr key={e.comp}>
                      <td><strong>{e.comp}</strong></td>
                      <td style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{e.basis}</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-blue)'}}>{e.calc}</td>
                      <td style={{textAlign:'center',color:e.taxable?'var(--odoo-orange)':'var(--odoo-green)'}}>{e.taxable?'Yes':'No'}</td>
                      <td style={{textAlign:'center',color:e.pf?'var(--odoo-green)':'var(--odoo-gray)'}}>{e.pf?'✅':'—'}</td>
                      <td style={{textAlign:'center',color:e.esi?'var(--odoo-green)':'var(--odoo-gray)'}}>{e.esi?'✅':'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="fi-form-sec" style={{marginTop:'14px'}}>
            <div className="fi-form-sec-hdr">➖ Deductions</div>
            <div style={{padding:'0'}}>
              <table className="fi-data-table">
                <thead><tr><th>Component</th><th>Basis</th><th>Formula</th></tr></thead>
                <tbody>
                  {structure.deductions.map(d=>(
                    <tr key={d.comp}>
                      <td><strong>{d.comp}</strong></td>
                      <td style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{d.basis}</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-red)'}}>{d.calc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live CTC calculator */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>🧮 CTC Calculator (Live Preview)</h3></div>
          <div className="fi-panel-body">
            <div className="fi-form-grp" style={{marginBottom:'14px'}}>
              <label>Basic Wage / Month</label>
              <input type="number" className="fi-form-ctrl" value={basic} onChange={e=>setBasic(parseInt(e.target.value)||0)}
                style={{fontFamily:'DM Mono,monospace',fontWeight:'700'}}/>
            </div>

            <div style={{fontWeight:'700',fontSize:'11px',color:'var(--odoo-purple)',textTransform:'uppercase',marginBottom:'8px'}}>Earnings</div>
            {[['Basic Wage',basic],['Dearness Allowance (30%)',da],['HRA (10%)',hra],['Conveyance',conv],['Special Allowance',500]].map(([l,v])=>(
              <div key={l} className="ctc-row">
                <span className="ctc-label">{l}</span>
                <span className="ctc-amount" style={{color:'var(--odoo-green)'}}>₹{v.toLocaleString()}</span>
              </div>
            ))}
            <div className="ctc-row" style={{background:'#EAF9F6',borderRadius:'6px',padding:'8px',margin:'4px 0'}}>
              <span className="ctc-label" style={{fontWeight:'800'}}>Gross Salary</span>
              <span className="ctc-amount" style={{color:'var(--odoo-green)',fontFamily:'Syne,sans-serif',fontSize:'16px'}}>₹{gross.toLocaleString()}</span>
            </div>

            <div style={{fontWeight:'700',fontSize:'11px',color:'var(--odoo-red)',textTransform:'uppercase',margin:'12px 0 8px'}}>Deductions</div>
            {[['PF (Employee 12%)',pf_ee],['ESI (Employee 0.75%)',esi_ee],['Professional Tax',pt]].map(([l,v])=>(
              <div key={l} className="ctc-row">
                <span className="ctc-label">{l}</span>
                <span className="ctc-amount" style={{color:'var(--odoo-red)'}}>- ₹{v.toLocaleString()}</span>
              </div>
            ))}
            <div style={{background:'var(--odoo-purple)',color:'#fff',borderRadius:'8px',padding:'12px',margin:'8px 0',textAlign:'center'}}>
              <div style={{fontSize:'11px',fontWeight:'700',opacity:.8,marginBottom:'4px'}}>NET TAKE-HOME</div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'22px'}}>₹{net.toLocaleString()}</div>
            </div>

            <div style={{fontWeight:'700',fontSize:'11px',color:'var(--odoo-orange)',textTransform:'uppercase',margin:'12px 0 8px'}}>Employer Cost</div>
            {[['PF (Employer 13%)',pf_er],['ESI (Employer 3.25%)',esi_er],['Gratuity (4.81%)',gratuity],['Bonus (8.33%)',bonus]].map(([l,v])=>(
              <div key={l} className="ctc-row">
                <span className="ctc-label">{l}</span>
                <span className="ctc-amount" style={{color:'var(--odoo-orange)'}}>₹{v.toLocaleString()}</span>
              </div>
            ))}
            <div className="ctc-row" style={{background:'#FEF5E7',borderRadius:'6px',padding:'8px',margin:'4px 0'}}>
              <span className="ctc-label" style={{fontWeight:'800'}}>Total E-Cost (CTC)</span>
              <span className="ctc-amount" style={{color:'var(--odoo-orange)',fontFamily:'Syne,sans-serif',fontSize:'16px'}}>₹{employer_cost.toLocaleString()}</span>
            </div>
            <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginTop:'8px',textAlign:'center'}}>
              Annual CTC: ₹{(employer_cost*12).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
