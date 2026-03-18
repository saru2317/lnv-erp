import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const EMP = {id:'EMP-001',name:'Ramesh Kumar',dept:'Production',desg:'Plant Manager',type:'Staff',grade:'M3',
  doj:'01 Jan 2018',shift:'General',ctc:540000,basic:22500,status:'Active',ph:'9876543210',
  email:'ramesh.k@lnvmfg.com',dob:'15 Mar 1982',blood:'O+',addr:'45, Gandhi Nagar, Ranipet - 632401',
  aadhaar:'1234-5678-9012',pan:'ABCDE1234F',bank:'SBI - 123456789',pf:'TN/RNP/001/0001',esi:'98765432',
  yrs:7,gender:'Male',marital:'Married',emergency:'Meena K. — 9876543220'}

const LEAVE_BALANCE = [
  {type:'EL',label:'Earned Leave',total:15,availed:3,bal:12,cls:'leave-el'},
  {type:'CL',label:'Casual Leave',total:12,availed:2,bal:10,cls:'leave-cl'},
  {type:'SL',label:'Sick Leave',total:12,availed:1,bal:11,cls:'leave-sl'},
  {type:'FH',label:'Festival Holiday',total:5,availed:0,bal:5,cls:'leave-fh'},
]

const TABS = ['Overview','Attendance','Leave','Payslips','Documents']

export default function EmployeeProfile() {
  const nav = useNavigate()
  const [tab, setTab] = useState('Overview')
  const isToday = (date) => {
    const today = new Date()
    const bday = new Date(EMP.dob)
    return bday.getDate()===today.getDate() && bday.getMonth()===today.getMonth()
  }

  return (
    <div>
      {/* Profile header */}
      <div style={{background:'#fff',borderRadius:'10px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',marginBottom:'16px'}}>
        <div style={{display:'flex',gap:'16px',alignItems:'flex-start'}}>
          <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'var(--odoo-purple)',
            display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',
            fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'26px',flexShrink:0}}>RK</div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'20px',color:'var(--odoo-dark)'}}>{EMP.name}</div>
              {isToday(EMP.dob) && <span style={{background:'#FFF3CD',color:'#856404',padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700'}}>🎂 Birthday Today!</span>}
            </div>
            <div style={{color:'var(--odoo-purple)',fontWeight:'600',fontSize:'14px',marginTop:'2px'}}>{EMP.desg} · {EMP.dept}</div>
            <div style={{display:'flex',gap:'12px',marginTop:'8px',flexWrap:'wrap'}}>
              {[['Emp ID',EMP.id],['DOJ',EMP.doj],['Type',EMP.type],['Grade',EMP.grade],['Shift',EMP.shift]].map(([l,v])=>(
                <div key={l} style={{fontSize:'11px'}}>
                  <span style={{color:'var(--odoo-gray)'}}>{l}: </span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:'8px',flexShrink:0}}>
            <button className="btn btn-s sd-bsm">Edit</button>
            <button className="btn btn-p sd-bsm" onClick={() => nav('/hcm/pay/payslip')}>Payslip</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'4px',marginBottom:'16px',background:'#fff',borderRadius:'8px',padding:'6px',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:'8px',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'700',
            background:tab===t?'var(--odoo-purple)':'transparent',
            color:tab===t?'#fff':'var(--odoo-gray)',transition:'all .2s'}}>
            {t}
          </button>
        ))}
      </div>

      {tab==='Overview' && (
        <div className="fi-panel-grid">
          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>👤 Personal Details</h3></div>
            <div className="fi-panel-body">
              {[['📞 Mobile',EMP.ph],['📧 Email',EMP.email],['🎂 DOB',`${EMP.dob} (42 yrs)`],
                ['🩸 Blood',EMP.blood],['👤 Gender',EMP.gender],['💍 Marital',EMP.marital],
                ['📍 Address',EMP.addr],['🆘 Emergency',EMP.emergency]].map(([l,v])=>(
                <div key={l} style={{display:'flex',gap:'8px',padding:'7px 0',borderBottom:'1px solid var(--odoo-border)',fontSize:'12px'}}>
                  <span style={{minWidth:'120px',color:'var(--odoo-gray)',fontWeight:'600'}}>{l}</span>
                  <span style={{fontWeight:'600'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="fi-panel" style={{marginBottom:'14px'}}>
              <div className="fi-panel-hdr"><h3>🏛️ ID & Statutory</h3></div>
              <div className="fi-panel-body">
                {[['Aadhaar',EMP.aadhaar],['PAN',EMP.pan],['Bank A/C',EMP.bank],
                  ['PF No.',EMP.pf],['ESI No.',EMP.esi]].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--odoo-border)',fontSize:'12px'}}>
                    <span style={{color:'var(--odoo-gray)',fontWeight:'600'}}>{l}</span>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:'600'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="fi-panel">
              <div className="fi-panel-hdr"><h3>📅 Leave Balance — 2025</h3></div>
              <div className="fi-panel-body">
                {LEAVE_BALANCE.map(l=>(
                  <div key={l.type} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                    <span className={l.cls}>{l.type}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{l.label}</div>
                      <div style={{background:'#F0EEEB',borderRadius:'3px',height:'5px',marginTop:'3px'}}>
                        <div style={{width:`${(l.bal/l.total)*100}%`,height:'100%',borderRadius:'3px',background:'var(--odoo-green)'}}></div>
                      </div>
                    </div>
                    <div style={{textAlign:'right',fontSize:'12px'}}>
                      <strong style={{color:'var(--odoo-green)'}}>{l.bal}</strong>
                      <span style={{color:'var(--odoo-gray)'}}> / {l.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='Payslips' && (
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>Recent Payslips</h3></div>
          <div className="fi-panel-body">
            {['February 2025','January 2025','December 2024'].map(m=>(
              <div key={m} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'10px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                <div>
                  <div style={{fontWeight:'700',fontSize:'13px'}}>{m}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>Net Pay: ₹38,420 · Credited 1st</div>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button className="btn-xs" onClick={() => nav('/hcm/pay/payslip')}>View</button>
                  <button className="btn-xs">PDF</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(tab==='Attendance'||tab==='Leave'||tab==='Documents') && (
        <div className="pp-alert info">
          {tab==='Attendance' && <><strong>Attendance:</strong> 24/26 days present · 1 late mark · 1 WFH (Feb 2025)</>}
          {tab==='Leave' && <>📅 <strong>Leave History:</strong> 3 EL taken (15-17 Jan), 1 SL (8 Feb). All approved.</>}
          {tab==='Documents' && <><strong>Documents:</strong> Aadhaar ✅, PAN ✅, Passbook ✅, Photo ✅, Qualification ✅</>}
        </div>
      )}
    </div>
  )
}
