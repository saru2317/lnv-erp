import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = ['Personal','Employment','Salary & Bank','Documents','Checklist']

export default function EmployeeNew() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [saved, setSaved] = useState(false)

  if (saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}>🎉</div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:'var(--odoo-green)'}}>EMP-011 Created! Welcome Onboard!</div>
      <div style={{fontSize:'13px',color:'var(--odoo-gray)'}}>ID card, email, ESI/PF registration initiated</div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/hcm/employees')}>← Employee List</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/hcm/profile')}>View Profile</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Employee Onboarding <small>EMP-011</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/hcm/employees')}>✕ Cancel</button>
          {step<4 && <button className="btn btn-s sd-bsm" onClick={()=>setStep(s=>Math.min(s+1,4))}>Next →</button>}
          {step===4 && <button className="btn btn-p sd-bsm" onClick={()=>setSaved(true)}>Complete Onboarding</button>}
        </div>
      </div>

      {/* Step indicator */}
      <div style={{display:'flex',gap:'0',marginBottom:'20px',background:'#fff',borderRadius:'8px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
        {STEPS.map((s,i)=>(
          <div key={s} onClick={()=>setStep(i)} style={{
            flex:1,padding:'12px',textAlign:'center',cursor:'pointer',fontSize:'12px',fontWeight:'700',
            background:i===step?'var(--odoo-purple)':i<step?'var(--odoo-green)':'#fff',
            color:i<=step?'#fff':'var(--odoo-gray)',
            borderRight:'1px solid var(--odoo-border)',transition:'all .2s'}}>
            <div>{i<step?'✅':i===step?'●':'○'}</div>
            {s}
          </div>
        ))}
      </div>

      {step===0 && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">👤 Personal Information</div>
          <div className="fi-form-sec-body">
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>First Name <span>*</span></label><input className="fi-form-ctrl" placeholder="First name"/></div>
              <div className="fi-form-grp"><label>Last Name <span>*</span></label><input className="fi-form-ctrl" placeholder="Last name"/></div>
              <div className="fi-form-grp"><label>Date of Birth <span>*</span></label><input type="date" className="fi-form-ctrl"/></div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Gender</label>
                <select className="fi-form-ctrl"><option>Male</option><option>Female</option><option>Other</option></select>
              </div>
              <div className="fi-form-grp"><label>Blood Group</label>
                <select className="fi-form-ctrl"><option>A+</option><option>B+</option><option>O+</option><option>AB+</option><option>A-</option></select>
              </div>
              <div className="fi-form-grp"><label>Marital Status</label>
                <select className="fi-form-ctrl"><option>Single</option><option>Married</option></select>
              </div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Mobile <span>*</span></label><input className="fi-form-ctrl" placeholder="10-digit mobile"/></div>
              <div className="fi-form-grp"><label>Email</label><input type="email" className="fi-form-ctrl" placeholder="personal@email.com"/></div>
              <div className="fi-form-grp"><label>Emergency Contact</label><input className="fi-form-ctrl" placeholder="Name & Number"/></div>
            </div>
            <div className="fi-form-grp"><label>Permanent Address <span>*</span></label>
              <textarea className="fi-form-ctrl" rows={2} placeholder="Full address with pincode"></textarea>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Aadhaar No.</label><input className="fi-form-ctrl" placeholder="XXXX-XXXX-XXXX" style={{fontFamily:'DM Mono,monospace'}}/></div>
              <div className="fi-form-grp"><label>PAN No.</label><input className="fi-form-ctrl" placeholder="ABCDE1234F" style={{fontFamily:'DM Mono,monospace'}}/></div>
              <div className="fi-form-grp"><label>ESI No. (if existing)</label><input className="fi-form-ctrl" placeholder="ESI number"/></div>
            </div>
          </div>
        </div>
      )}

      {step===1 && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">🏢 Employment Details</div>
          <div className="fi-form-sec-body">
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Date of Joining <span>*</span></label><input type="date" className="fi-form-ctrl" defaultValue="2025-03-01"/></div>
              <div className="fi-form-grp"><label>Employee Type <span>*</span></label>
                <select className="fi-form-ctrl"><option>Worker</option><option>Staff</option><option>Contractor</option></select>
              </div>
              <div className="fi-form-grp"><label>Grade / Band</label>
                <select className="fi-form-ctrl"><option>W1</option><option>W2</option><option>W3</option><option>W4</option><option>S1</option><option>S2</option><option>S3</option><option>M1</option><option>M2</option><option>M3</option></select>
              </div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Department <span>*</span></label>
                <select className="fi-form-ctrl"><option>Production</option><option>Quality</option><option>Maintenance</option><option>Accounts</option><option>HR & Admin</option><option>Sales</option><option>Warehouse</option></select>
              </div>
              <div className="fi-form-grp"><label>Designation <span>*</span></label><input className="fi-form-ctrl" placeholder="e.g. Ring Frame Operator"/></div>
              <div className="fi-form-grp"><label>Reports To</label>
                <select className="fi-form-ctrl"><option>Ramesh Kumar — Plant Manager</option><option>Priya Sharma — Sr. Accountant</option></select>
              </div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Shift Assignment</label>
                <select className="fi-form-ctrl"><option>General (9AM-5PM)</option><option>A Shift (6AM-2PM)</option><option>B Shift (2PM-10PM)</option><option>C Shift (10PM-6AM)</option></select>
              </div>
              <div className="fi-form-grp"><label>Work Location</label>
                <select className="fi-form-ctrl"><option>Ranipet Plant</option></select>
              </div>
              <div className="fi-form-grp"><label>Probation Period</label>
                <select className="fi-form-ctrl"><option>3 months</option><option>6 months</option><option>1 year</option></select>
              </div>
            </div>
          </div>
        </div>
      )}

      {step===2 && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">Salary & Bank Details</div>
          <div className="fi-form-sec-body">
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Annual CTC <span>*</span></label>
                <div style={{display:'flex',gap:'8px'}}><span style={{padding:'8px 12px',background:'#F8F9FA',border:'1px solid var(--odoo-border)',borderRadius:'5px',fontSize:'13px'}}>₹</span>
                <input type="number" className="fi-form-ctrl" placeholder="e.g. 216000" style={{flex:1}}/></div>
              </div>
              <div className="fi-form-grp"><label>Pay Structure</label>
                <select className="fi-form-ctrl"><option>Worker-Standard</option><option>Staff-Standard</option><option>Management</option></select>
              </div>
              <div className="fi-form-grp"><label>Payment Mode</label>
                <select className="fi-form-ctrl"><option>Bank Transfer (NEFT)</option><option>Cash</option></select>
              </div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Bank Name</label>
                <select className="fi-form-ctrl"><option>SBI</option><option>Indian Bank</option><option>IOB</option><option>Canara Bank</option></select>
              </div>
              <div className="fi-form-grp"><label>Account Number</label><input className="fi-form-ctrl" placeholder="Account number" style={{fontFamily:'DM Mono,monospace'}}/></div>
              <div className="fi-form-grp"><label>IFSC Code</label><input className="fi-form-ctrl" placeholder="SBIN0001234" style={{fontFamily:'DM Mono,monospace'}}/></div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>PF Applicable?</label>
                <select className="fi-form-ctrl"><option>Yes — Auto enroll</option><option>No — Excluded</option></select>
              </div>
              <div className="fi-form-grp"><label>ESI Applicable?</label>
                <select className="fi-form-ctrl"><option>Yes — Gross ≤ ₹21,000</option><option>No — Excluded</option></select>
              </div>
              <div className="fi-form-grp"><label>PT Applicable?</label>
                <select className="fi-form-ctrl"><option>Yes — TN PT Slab</option><option>No</option></select>
              </div>
            </div>
          </div>
        </div>
      )}

      {step===3 && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">Documents</div>
          <div className="fi-form-sec-body">
            {[['Aadhaar Card','aadhar'],['PAN Card','pan'],['Qualification Certificates','qual'],
              ['Previous Experience Letter','exp'],['Bank Passbook / Cancelled Cheque','bank'],
              ['Passport Photo (2 copies)','photo']].map(([doc,key])=>(
              <div key={key} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                <div style={{flex:1,fontSize:'13px',fontWeight:'600'}}>{doc}</div>
                <input type="checkbox" style={{width:'18px',height:'18px',accentColor:'var(--odoo-green)'}}/>
                <span style={{fontSize:'11px',color:'var(--odoo-gray)',width:'70px'}}>Collected</span>
                <button className="btn-xs">📎 Upload</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step===4 && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">Onboarding Checklist</div>
          <div className="fi-form-sec-body">
            {[['ID Card issued','🪪'],['ESS login created (Employee Portal)','💻'],
              ['ESI/PF registration done','🏛️'],['Biometric enrollment done','👆'],
              ['Leave balance credited for year','📅'],['Email & system access given','📧'],
              ['Plant induction completed','🏭'],['Supervisor informed','👤'],
              ['Salary master entry done','💰'],['Emergency contact recorded','📞']
            ].map(([task,ic])=>(
              <div key={task} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                <span style={{fontSize:'20px'}}>{ic}</span>
                <div style={{flex:1,fontSize:'13px',fontWeight:'600'}}>{task}</div>
                <input type="checkbox" defaultChecked style={{width:'18px',height:'18px',accentColor:'var(--odoo-green)'}}/>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fi-form-acts">
        {step>0 && <button className="btn btn-s sd-bsm" onClick={()=>setStep(s=>s-1)}>← Back</button>}
        <button className="btn btn-s sd-bsm" onClick={() => nav('/hcm/employees')}>✕ Cancel</button>
        {step<4
          ? <button className="btn btn-p sd-bsm" onClick={()=>setStep(s=>s+1)}>Next Step →</button>
          : <button className="btn btn-p sd-bsm" onClick={()=>setSaved(true)}>Complete Onboarding</button>
        }
      </div>
    </div>
  )
}
