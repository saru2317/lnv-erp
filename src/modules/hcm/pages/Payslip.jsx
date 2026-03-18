import React, { useState } from 'react'

const EMPLOYEES_PICK = [
  {id:'EMP-001',name:'Ramesh Kumar',desg:'Plant Manager',dept:'Production',grade:'M3',bank:'SBI ****6789',pf:'TN/RNP/001/0001',esi:'98765432',basic:22500,doj:'01 Jan 2018'},
  {id:'EMP-002',name:'Priya Sharma',desg:'Sr. Accountant',dept:'Accounts',grade:'S3',bank:'Indian Bank ****4521',pf:'TN/RNP/001/0002',esi:'98765433',basic:16000,doj:'15 Mar 2020'},
  {id:'EMP-004',name:'Rajesh Kumar',desg:'Operator',dept:'Production',grade:'W2',bank:'IOB ****3812',pf:'TN/RNP/001/0004',esi:'98765435',basic:10000,doj:'10 Jan 2020'},
]

export default function Payslip() {
  const [empId, setEmpId] = useState('EMP-001')
  const [month, setMonth] = useState('February 2025')
  const emp = EMPLOYEES_PICK.find(e=>e.id===empId)

  if (!emp) return null
  const basic=emp.basic, da=Math.round(basic*0.30), hra=Math.round(basic*0.10), conv=800, special=Math.round(basic*0.08)
  const ot_hrs = empId==='EMP-004'?3.5:0, ot_pay = ot_hrs>0?Math.round(basic/208*ot_hrs*2):0
  const gross=basic+da+hra+conv+special+ot_pay
  const pf_ee=Math.min(Math.round(basic*0.12),1800), esi_ee=gross<=21000?Math.round(gross*0.0075):0, pt=150
  const total_ded=pf_ee+esi_ee+pt
  const net=gross-total_ded
  const days_worked=24, lop=0

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Payslip <small>{month}</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" onChange={e=>setEmpId(e.target.value)}>
            {EMPLOYEES_PICK.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select className="fi-filter-select" onChange={e=>setMonth(e.target.value)}>
            <option>February 2025</option><option>January 2025</option><option>December 2024</option>
          </select>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/print/payslip')}>🖨️ Print</button>
          <button className="btn btn-s sd-bsm">⬇️ Download PDF</button>
          <button className="btn btn-s sd-bsm">📧 Email</button>
        </div>
      </div>

      <div className="payslip-wrap">
        {/* Header */}
        <div className="payslip-hdr">
          <div className="payslip-company">🏭 LNV Manufacturing Pvt. Ltd.</div>
          <div style={{fontSize:'12px',color:'var(--odoo-gray)',marginTop:'2px'}}>Ranipet, Tamil Nadu — 632 401</div>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:'16px',fontWeight:'800',color:'var(--odoo-purple)',marginTop:'10px'}}>
            SALARY SLIP — {month.toUpperCase()}
          </div>
        </div>

        {/* Employee details */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'16px',
          background:'#F8F9FA',borderRadius:'8px',padding:'14px'}}>
          {[['Employee ID',emp.id],['Name',emp.name],['Designation',emp.desg],['Department',emp.dept],
            ['Grade',emp.grade],['DOJ',emp.doj],['PF No.',emp.pf],['ESI No.',emp.esi],
            ['Working Days',days_worked],['LOP Days',lop||'Nil'],['Bank',emp.bank],['Pay Month',month]
          ].map(([l,v])=>(
            <div key={l} style={{display:'flex',gap:'8px',fontSize:'12px'}}>
              <span style={{color:'var(--odoo-gray)',minWidth:'120px',fontWeight:'600'}}>{l}:</span>
              <strong style={{fontFamily:l.includes('PF')||l.includes('ESI')||l==='Employee ID'?'DM Mono,monospace':'inherit'}}>{v}</strong>
            </div>
          ))}
        </div>

        {/* Earnings & Deductions */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
          <div>
            <div style={{fontWeight:'800',fontSize:'12px',color:'var(--odoo-green)',textTransform:'uppercase',
              borderBottom:'2px solid var(--odoo-green)',paddingBottom:'6px',marginBottom:'8px'}}>EARNINGS</div>
            {[['Basic Wage',basic],['DA (30%)',da],['HRA (10%)',hra],['Conveyance',conv],
              ['Special Allowance',special],
              ...(ot_pay>0?[['OT Pay (3.5 hrs)',ot_pay]]:[])].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',
                borderBottom:'1px solid var(--odoo-border)',fontSize:'13px'}}>
                <span>{l}</span>
                <strong style={{fontFamily:'DM Mono,monospace'}}>₹{v.toLocaleString()}</strong>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',
              background:'#EAF9F6',borderRadius:'5px',padding:'8px',marginTop:'4px',fontSize:'13px',fontWeight:'800'}}>
              <span style={{color:'var(--odoo-green)'}}>GROSS SALARY</span>
              <strong style={{color:'var(--odoo-green)',fontFamily:'DM Mono,monospace'}}>₹{gross.toLocaleString()}</strong>
            </div>
          </div>

          <div>
            <div style={{fontWeight:'800',fontSize:'12px',color:'var(--odoo-red)',textTransform:'uppercase',
              borderBottom:'2px solid var(--odoo-red)',paddingBottom:'6px',marginBottom:'8px'}}>DEDUCTIONS</div>
            {[['PF (Employee)',pf_ee],['ESI (Employee)',esi_ee],['Professional Tax',pt]].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',
                borderBottom:'1px solid var(--odoo-border)',fontSize:'13px'}}>
                <span>{l}</span>
                <strong style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-red)'}}>₹{v.toLocaleString()}</strong>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px',
              background:'#F8D7DA',borderRadius:'5px',marginTop:'4px',fontSize:'13px',fontWeight:'800'}}>
              <span style={{color:'var(--odoo-red)'}}>TOTAL DEDUCTIONS</span>
              <strong style={{color:'var(--odoo-red)',fontFamily:'DM Mono,monospace'}}>₹{total_ded.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <div className="payslip-net">
          <div style={{fontSize:'12px',fontWeight:'700',opacity:.8,marginBottom:'4px'}}>NET PAY</div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'28px'}}>₹{net.toLocaleString()}</div>
          <div style={{fontSize:'12px',opacity:.8,marginTop:'4px'}}>
            {net > 99999 ? `${(net/100000).toFixed(2)} Lakh` : `${(net/1000).toFixed(1)}K`} — {month}
          </div>
        </div>

        <div style={{marginTop:'14px',fontSize:'11px',color:'var(--odoo-gray)',textAlign:'center'}}>
          This is a computer-generated payslip. No signature required. | LNV Manufacturing Pvt. Ltd. | Ranipet, Tamil Nadu
        </div>
      </div>
    </div>
  )
}
