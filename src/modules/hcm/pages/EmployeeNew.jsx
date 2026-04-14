import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2 = () => ({ Authorization:`Bearer ${getToken()}` })

const STEPS = ['Personal','Employment','Salary & Bank','Documents','Checklist']

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box',
  fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block',
  marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }

const RELATIONSHIPS = ['Father','Mother','Spouse','Son','Daughter','Brother','Sister','Guardian','Other']

// ── Family Member Row ─────────────────────────────────────
function FamilyRow({ member, onChange, onDelete }) {
  const F = f => ({ value:member[f]||'', style:inp,
    onChange:e=>onChange({...member,[f]:e.target.value}),
    onFocus:e=>e.target.style.borderColor='#714B67',
    onBlur:e=>e.target.style.borderColor='#E0D5E0' })
  return (
    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1.5fr auto',
      gap:8, marginBottom:8, background:'#F8F7FA', padding:'10px 12px', borderRadius:8,
      border:'1px solid #E0D5E0' }}>
      <div><label style={{ ...lbl, marginBottom:2 }}>Name</label>
        <input {...F('name')} placeholder="Full name" /></div>
      <div><label style={{ ...lbl, marginBottom:2 }}>Age</label>
        <input type="number" {...F('age')} placeholder="Age" min={0} max={100} /></div>
      <div><label style={{ ...lbl, marginBottom:2 }}>Relationship</label>
        <select {...F('relationship')} style={{ ...inp, cursor:'pointer' }}>
          <option value="">Select</option>
          {RELATIONSHIPS.map(r=><option key={r}>{r}</option>)}
        </select>
      </div>
      <div><label style={{ ...lbl, marginBottom:2 }}>Contact No.</label>
        <input {...F('contact')} placeholder="Mobile number" maxLength={10} /></div>
      <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:2 }}>
        <button onClick={onDelete}
          style={{ padding:'7px 10px', background:'#fff', color:'#DC3545',
            border:'1px solid #DC3545', borderRadius:5, cursor:'pointer',
            fontSize:16, lineHeight:1 }}>×</button>
      </div>
    </div>
  )
}

// ── Experience Row ────────────────────────────────────────
function ExpRow({ exp, onChange, onDelete }) {
  const F = f => ({ value:exp[f]||'', style:inp,
    onChange:e=>onChange({...exp,[f]:e.target.value}),
    onFocus:e=>e.target.style.borderColor='#714B67',
    onBlur:e=>e.target.style.borderColor='#E0D5E0' })
  return (
    <div style={{ background:'#F8F7FA', padding:'10px 12px', borderRadius:8,
      border:'1px solid #E0D5E0', marginBottom:8 }}>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr auto', gap:8,
        marginBottom:6 }}>
        <div><label style={{ ...lbl, marginBottom:2 }}>Company Name</label>
          <input {...F('company')} placeholder="Company name" /></div>
        <div><label style={{ ...lbl, marginBottom:2 }}>Designation</label>
          <input {...F('designation')} placeholder="Job title" /></div>
        <div><label style={{ ...lbl, marginBottom:2 }}>From Year</label>
          <input type="month" {...F('fromDate')} /></div>
        <div><label style={{ ...lbl, marginBottom:2 }}>To Year</label>
          <input type="month" {...F('toDate')} /></div>
        <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:2 }}>
          <button onClick={onDelete}
            style={{ padding:'7px 10px', background:'#fff', color:'#DC3545',
              border:'1px solid #DC3545', borderRadius:5, cursor:'pointer',
              fontSize:16 }}>×</button>
        </div>
      </div>
      <div><label style={{ ...lbl, marginBottom:2 }}>Reason for Leaving</label>
        <input {...F('reason')} placeholder="Better opportunity / Higher studies / Personal..." /></div>
    </div>
  )
}

// ── Upload Row ────────────────────────────────────────────
function DocRow({ label, docKey, file, onUpload }) {
  const ref = useRef()
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0',
      borderBottom:'1px solid #E0D5E0' }}>
      <div style={{ flex:1, fontSize:'13px', fontWeight:'600' }}>{label}</div>
      {file ? (
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:'#155724', fontWeight:600,
            background:'#D4EDDA', padding:'3px 8px', borderRadius:10 }}>
            ✅ {file.name}
          </span>
          <button onClick={()=>onUpload(docKey, null)}
            style={{ background:'none', border:'none', color:'#DC3545',
              cursor:'pointer', fontSize:16 }}>×</button>
        </div>
      ) : (
        <span style={{ fontSize:11, color:'#6C757D' }}>Not uploaded</span>
      )}
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png"
        style={{ display:'none' }}
        onChange={e=>onUpload(docKey, e.target.files[0])} />
      <button onClick={()=>ref.current.click()}
        style={{ padding:'5px 14px', background:'#714B67', color:'#fff',
          border:'none', borderRadius:5, fontSize:11, cursor:'pointer',
          fontWeight:600, whiteSpace:'nowrap' }}>
        📎 Upload
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
export default function EmployeeNew() {
  const nav = useNavigate()
  const { empCode } = useParams()
  const isEdit = !!empCode
  const [step,   setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [created,setCreated]= useState(null)

  // Masters
  const [depts,   setDepts]   = useState([])
  const [grades,  setGrades]  = useState([])
  const [shifts,  setShifts]  = useState([])
  const [desigs,  setDesigs]  = useState([])
  const [empList, setEmpList] = useState([])

  // Step 1 — Personal
  const [personal, setPersonal] = useState({
    name:'', dob:'', gender:'Male', bloodGroup:'O+', maritalStatus:'Single',
    phone:'', email:'', aadhaar:'', pan:'', esiNo:'',
    presentAddress:'', sameAddress:true, communicationAddress:''
  })
  const [family,  setFamily]  = useState([]) // [{name,age,relationship,contact}]
  const [expList, setExpList] = useState([]) // [{company,designation,fromDate,toDate,reason}]

  // Step 2 — Employment
  const [employment, setEmployment] = useState({
    doj: new Date().toISOString().split('T')[0],
    category:'Worker', gradeCode:'', department:'',
    designation:'', reportsTo:'', shiftCode:'G',
    workLocation:'Main Plant', probationMonths:6
  })

  // Step 3 — Salary & Bank
  const [salary, setSalary] = useState({
    basicSalary:'', bankName:'SBI', bankAccount:'', ifsc:'',
    pfApplicable:true, esiApplicable:true, ptApplicable:true,
    paymentMode:'Bank Transfer'
  })

  // Step 4 — Documents (file objects)
  const [docFiles, setDocFiles] = useState({
    aadhaar:null, pan:null, qual:null, exp:null, bank:null, photo:null
  })

  // Step 5 — Checklist
  const [checklist, setChecklist] = useState({
    idCard:false, ess:false, esipf:false, biometric:false,
    leaveBalance:false, email:false, induction:false,
    supervisor:false, salaryMaster:false, emergency:false
  })

  // Fetch existing employee for edit
  useEffect(() => {
    if (!empCode) return
    fetch(`${BASE_URL}/employees/${empCode}`, { headers:authHdrs2() })
      .then(r=>r.json())
      .then(d => {
        if (!d.data) return
        const e = d.data
        const x = (() => { try { return JSON.parse(e.remarks||'{}') } catch { return {} } })()
        setPersonal({
          name: e.name||'', dob: e.dob?e.dob.split('T')[0]:'',
          gender: x.gender||'Male', bloodGroup: x.bloodGroup||'O+',
          maritalStatus: x.maritalStatus||'Single',
          phone: e.phone||'', email: e.email||'',
          aadhaar: x.aadhaar||'', pan: e.pan||'', esiNo: e.esiNo||'',
          presentAddress: e.address||'', sameAddress: x.sameAddress!==false,
          communicationAddress: x.communicationAddress||''
        })
        if (x.family?.length) setFamily(x.family)
        if (x.experience?.length) setExpList(x.experience)
        setEmployment({
          doj: e.doj?e.doj.split('T')[0]:'',
          category: x.category||'Worker',
          gradeCode: x.gradeCode||'',
          department: e.department||'',
          designation: e.designation||'',
          reportsTo: x.reportsTo||'',
          shiftCode: x.shiftCode||'G',
          workLocation: x.workLocation||'',
          probationMonths: x.probationMonths||6
        })
        setSalary({
          basicSalary: e.basicSalary?String(e.basicSalary):'',
          bankName: x.bankName||'SBI',
          bankAccount: e.bankAccount||'',
          ifsc: e.ifsc||'',
          pfApplicable: x.pfApplicable!==false,
          esiApplicable: x.esiApplicable!==false,
          ptApplicable: x.ptApplicable!==false,
          paymentMode: x.paymentMode||'Bank Transfer'
        })
      }).catch(()=>{})
  }, [empCode])

  // Fetch masters
  useEffect(() => {
    const t = `Bearer ${getToken()}`
    const h = { Authorization:t }
    Promise.all([
      fetch(`${BASE_URL}/hr-master/departments`,  { headers:h }).then(r=>r.json()),
      fetch(`${BASE_URL}/hr-master/grades`,       { headers:h }).then(r=>r.json()),
      fetch(`${BASE_URL}/hr-master/shifts`,       { headers:h }).then(r=>r.json()),
      fetch(`${BASE_URL}/hr-master/designations`, { headers:h }).then(r=>r.json()),
      fetch(`${BASE_URL}/employees/list/dropdown`,{ headers:h }).then(r=>r.json()),
    ]).then(([d,g,s,ds,el]) => {
      setDepts(d.data||[])
      setGrades(g.data||[])
      setShifts(s.data||[])
      setDesigs(ds.data||[])
      setEmpList(el.data||[])
    }).catch(()=>{})
  }, [])

  // Filter shifts by category
  const availableShifts = shifts.filter(s => {
    if (employment.category === 'Worker') return s.shiftType === 'FIXED'
    if (employment.category === 'Staff')  return true // both fixed and flexi
    return true
  })

  const P = f => ({
    value: personal[f]||'',
    className: 'fi-form-ctrl',
    onChange: e => setPersonal(p=>({...p,[f]:e.target.value}))
  })
  const E = f => ({
    value: employment[f]||'',
    className: 'fi-form-ctrl',
    onChange: e => setEmployment(p=>({...p,[f]:e.target.value}))
  })
  const S = f => ({
    value: salary[f]||'',
    className: 'fi-form-ctrl',
    onChange: e => setSalary(p=>({...p,[f]:e.target.value}))
  })

  const handleDocUpload = (key, file) =>
    setDocFiles(p=>({...p,[key]:file}))

  const validateStep = () => {
    if (step===0 && !personal.name)   { toast.error('Name required!');       return false }
    if (step===0 && !personal.phone)  { toast.error('Mobile required!');      return false }
    if (step===1 && !employment.department) { toast.error('Department required!'); return false }
    if (step===1 && !employment.doj)  { toast.error('Date of Joining required!'); return false }
    return true
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...personal,
        address: personal.presentAddress,
        ...employment,
        ...salary,
        basicSalary: parseFloat(salary.basicSalary)||0,
        remarks: JSON.stringify({
          // personal extras
          gender: personal.gender, bloodGroup: personal.bloodGroup,
          maritalStatus: personal.maritalStatus, aadhaar: personal.aadhaar,
          sameAddress: personal.sameAddress,
          communicationAddress: personal.sameAddress
            ? personal.presentAddress : personal.communicationAddress,
          family, experience: expList,
          // employment
          category: employment.category, gradeCode: employment.gradeCode,
          shiftCode: employment.shiftCode, workLocation: employment.workLocation,
          probationMonths: employment.probationMonths, reportsTo: employment.reportsTo,
          // salary
          bankName: salary.bankName, pfApplicable: salary.pfApplicable,
          esiApplicable: salary.esiApplicable, ptApplicable: salary.ptApplicable,
          paymentMode: salary.paymentMode,
          // checklist
          checklistDone: checklist
        })
      }
      const url    = isEdit?`${BASE_URL}/employees/${empCode}`:`${BASE_URL}/employees`
      const method = isEdit?'PATCH':'POST'
      const res    = await fetch(url,{method,headers:authHdrs(),body:JSON.stringify(payload)})
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (isEdit) { toast.success('Employee updated!'); nav(`/hcm/profile/${empCode}`) }
      else { setCreated(data.data); toast.success(`${data.data.empCode} created!`) }
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  if (created) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
      padding:'60px',gap:'16px' }}>
      <div style={{ fontSize:'48px' }}>🎉</div>
      <div style={{ fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',
        color:'var(--odoo-green)' }}>{created.empCode} Created! Welcome Onboard!</div>
      <div style={{ fontSize:'13px',color:'var(--odoo-gray)' }}>
        {created.name}</div>
      <div style={{ display:'flex',gap:'10px' }}>
        <button className="btn btn-s sd-bsm"
          onClick={()=>nav('/hcm/employees')}>← Employee List</button>
        <button className="btn btn-p sd-bsm"
          onClick={()=>nav(`/hcm/profile/${created.empCode}`)}>View Profile</button>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          {isEdit?`Edit Employee — ${empCode}`:'New Employee Onboarding'}
          <small>{isEdit?'Update details':'Auto-generated ID on save'}</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm"
            onClick={()=>isEdit?nav(`/hcm/profile/${empCode}`):nav('/hcm/employees')}>
            ← {isEdit?'Back to Profile':'Cancel'}
          </button>
        </div>
      </div>

      {/* Step bar */}
      <div style={{ display:'flex',gap:'0',marginBottom:'20px',background:'#fff',
        borderRadius:'8px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.08)' }}>
        {STEPS.map((s,i)=>(
          <div key={s} onClick={()=>setStep(i)} style={{
            flex:1,padding:'12px',textAlign:'center',cursor:'pointer',
            fontSize:'12px',fontWeight:'700',
            background:i===step?'var(--odoo-purple)':i<step?'var(--odoo-green)':'#fff',
            color:i<=step?'#fff':'var(--odoo-gray)',
            borderRight:'1px solid var(--odoo-border)',transition:'all .2s'}}>
            <div>{i<step?'✓':i===step?'●':'○'}</div>
            {s}
          </div>
        ))}
      </div>

      {/* ── STEP 0 — PERSONAL ────────────────────────── */}
      {step===0 && (
        <>
          <div className="fi-form-sec">
            <div className="fi-form-sec-hdr">👤 Personal Information</div>
            <div className="fi-form-sec-body">
              <div className="fi-form-row">
                <div className="fi-form-grp"><label>Full Name *</label>
                  <input {...P('name')} placeholder="e.g. Rajan Kumar" /></div>
                <div className="fi-form-grp"><label>Date of Birth</label>
                  <input type="date" {...P('dob')} /></div>
                <div className="fi-form-grp"><label>Gender</label>
                  <select {...P('gender')}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select></div>
              </div>
              <div className="fi-form-row">
                <div className="fi-form-grp"><label>Blood Group</label>
                  <select {...P('bloodGroup')}>
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b=><option key={b}>{b}</option>)}
                  </select></div>
                <div className="fi-form-grp"><label>Marital Status</label>
                  <select {...P('maritalStatus')}>
                    <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                  </select></div>
                <div className="fi-form-grp"><label>Mobile *</label>
                  <input {...P('phone')} placeholder="10-digit mobile" maxLength={10} /></div>
              </div>
              <div className="fi-form-row">
                <div className="fi-form-grp"><label>Email</label>
                  <input type="email" {...P('email')} placeholder="personal@email.com" /></div>
                <div className="fi-form-grp"><label>Aadhaar No.</label>
                  <input {...P('aadhaar')} placeholder="XXXX-XXXX-XXXX"
                    style={{ fontFamily:'DM Mono,monospace' }} /></div>
                <div className="fi-form-grp"><label>PAN No.</label>
                  <input {...P('pan')} placeholder="ABCDE1234F"
                    style={{ fontFamily:'DM Mono,monospace' }} /></div>
              </div>

              {/* Address */}
              <div className="fi-form-grp"><label>Present Address *</label>
                <textarea className="fi-form-ctrl" rows={2}
                  value={personal.presentAddress}
                  onChange={e=>setPersonal(p=>({...p,presentAddress:e.target.value}))}
                  placeholder="Door No., Street, Area, City, Pincode" /></div>

              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <input type="checkbox" id="sameAddr" checked={personal.sameAddress}
                  onChange={e=>setPersonal(p=>({...p,sameAddress:e.target.checked}))}
                  style={{ width:16, height:16, accentColor:'#714B67', cursor:'pointer' }} />
                <label htmlFor="sameAddr" style={{ fontSize:12, fontWeight:600,
                  color:'#714B67', cursor:'pointer' }}>
                  Communication address same as present address
                </label>
              </div>
              {!personal.sameAddress && (
                <div className="fi-form-grp"><label>Communication Address</label>
                  <textarea className="fi-form-ctrl" rows={2}
                    value={personal.communicationAddress}
                    onChange={e=>setPersonal(p=>({...p,communicationAddress:e.target.value}))}
                    placeholder="Communication / Permanent address" /></div>
              )}
            </div>
          </div>

          {/* Family Details */}
          <div className="fi-form-sec" style={{ marginTop:14 }}>
            <div className="fi-form-sec-hdr" style={{ display:'flex',
              justifyContent:'space-between', alignItems:'center' }}>
              <span>👨‍👩‍👧 Family Members</span>
              <button onClick={()=>setFamily(f=>[...f,
                { name:'', age:'', relationship:'', contact:'' }])}
                style={{ padding:'4px 14px', background:'#714B67', color:'#fff',
                  border:'none', borderRadius:5, fontSize:11, cursor:'pointer',
                  fontWeight:700 }}>+ Add Member</button>
            </div>
            <div className="fi-form-sec-body">
              {family.length===0 ? (
                <div style={{ fontSize:12, color:'#6C757D', textAlign:'center', padding:'16px 0' }}>
                  Click "+ Add Member" to add family details
                </div>
              ) : family.map((m,i)=>(
                <FamilyRow key={i} member={m}
                  onChange={v=>setFamily(f=>f.map((x,j)=>j===i?v:x))}
                  onDelete={()=>setFamily(f=>f.filter((_,j)=>j!==i))} />
              ))}
            </div>
          </div>

          {/* Work Experience */}
          <div className="fi-form-sec" style={{ marginTop:14 }}>
            <div className="fi-form-sec-hdr" style={{ display:'flex',
              justifyContent:'space-between', alignItems:'center' }}>
              <span>💼 Previous Work Experience</span>
              <button onClick={()=>setExpList(e=>[...e,
                { company:'', designation:'', fromDate:'', toDate:'', reason:'' }])}
                style={{ padding:'4px 14px', background:'#714B67', color:'#fff',
                  border:'none', borderRadius:5, fontSize:11, cursor:'pointer',
                  fontWeight:700 }}>+ Add Experience</button>
            </div>
            <div className="fi-form-sec-body">
              {expList.length===0 ? (
                <div style={{ fontSize:12, color:'#6C757D', textAlign:'center', padding:'16px 0' }}>
                  Click "+ Add Experience" for previous work history
                </div>
              ) : expList.map((exp,i)=>(
                <ExpRow key={i} exp={exp}
                  onChange={v=>setExpList(e=>e.map((x,j)=>j===i?v:x))}
                  onDelete={()=>setExpList(e=>e.filter((_,j)=>j!==i))} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── STEP 1 — EMPLOYMENT ──────────────────────── */}
      {step===1 && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">🏭 Employment Details</div>
          <div className="fi-form-sec-body">
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Date of Joining *</label>
                <input type="date" {...E('doj')} /></div>
              <div className="fi-form-grp"><label>Employee Type *</label>
                <select value={employment.category} className="fi-form-ctrl"
                  onChange={e=>setEmployment(p=>({...p,category:e.target.value,
                    shiftCode:e.target.value==='Worker'?'G':p.shiftCode}))}>
                  <option value="Worker">Worker</option>
                  <option value="Staff">Staff</option>
                  <option value="Contractor">Contractor</option>
                </select></div>
              <div className="fi-form-grp"><label>Grade</label>
                <select {...E('gradeCode')}>
                  <option value="">-- Select Grade --</option>
                  {grades.map(g=>(
                    <option key={g.code} value={g.code}>{g.code} — {g.name}</option>
                  ))}
                </select></div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Department *</label>
                <select value={employment.department} className="fi-form-ctrl"
                  onChange={e=>setEmployment(p=>({...p,department:e.target.value}))}>
                  <option value="">-- Select Department --</option>
                  {depts.map(d=>(
                    <option key={d.code} value={d.name}>{d.name}</option>
                  ))}
                </select></div>
              <div className="fi-form-grp"><label>Designation *</label>
                <select value={employment.designation} className="fi-form-ctrl"
                  onChange={e=>setEmployment(p=>({...p,designation:e.target.value}))}>
                  <option value="">-- Select Designation --</option>
                  {desigs.map(d=>(
                    <option key={d.code} value={d.name}>{d.name}</option>
                  ))}
                  <option value="__other__">Other (type below)</option>
                </select>
                {employment.designation==='__other__' && (
                  <input style={{ ...inp, marginTop:6 }}
                    placeholder="Type designation"
                    onChange={e=>setEmployment(p=>({...p,designation:e.target.value}))} />
                )}
              </div>
              <div className="fi-form-grp"><label>Reports To</label>
                <select value={employment.reportsTo} className="fi-form-ctrl"
                  onChange={e=>setEmployment(p=>({...p,reportsTo:e.target.value}))}>
                  <option value="">-- Select Reporting Manager --</option>
                  {empList.map(e=>(
                    <option key={e.empCode} value={e.empCode}>
                      {e.empCode} — {e.name} ({e.designation||e.department||''})
                    </option>
                  ))}
                </select></div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp">
                <label>Shift
                  {employment.category==='Worker' && (
                    <span style={{ marginLeft:6, fontSize:10, color:'#856404',
                      background:'#FFF3CD', padding:'1px 6px', borderRadius:10 }}>
                      Fixed only (Workers)
                    </span>
                  )}
                  {employment.category==='Staff' && (
                    <span style={{ marginLeft:6, fontSize:10, color:'#0C5460',
                      background:'#D1ECF1', padding:'1px 6px', borderRadius:10 }}>
                      Fixed or Flexi (Staff)
                    </span>
                  )}
                </label>
                <select value={employment.shiftCode} className="fi-form-ctrl"
                  onChange={e=>setEmployment(p=>({...p,shiftCode:e.target.value}))}>
                  {availableShifts.map(s=>(
                    <option key={s.code} value={s.code}>
                      {s.name} — {s.shiftType==='FLEXI'
                        ? `Flexi (Core: ${s.flexiCoreStart}–${s.flexiCoreEnd})`
                        : `${s.startTime}–${s.endTime}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fi-form-grp"><label>Work Location</label>
                <input {...E('workLocation')} placeholder="Main Plant / Ranipet" /></div>
              <div className="fi-form-grp"><label>Probation Period</label>
                <select value={employment.probationMonths} className="fi-form-ctrl"
                  onChange={e=>setEmployment(p=>({...p,probationMonths:parseInt(e.target.value)}))}>
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>1 year</option>
                  <option value={0}>No Probation</option>
                </select></div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2 — SALARY & BANK ───────────────────── */}
      {step===2 && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">💰 Salary & Bank Details</div>
          <div className="fi-form-sec-body">
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Basic Salary (₹/Month) *</label>
                <input type="number" {...S('basicSalary')} placeholder="e.g. 15000" /></div>
              <div className="fi-form-grp"><label>Payment Mode</label>
                <select {...S('paymentMode')}>
                  <option>Bank Transfer (NEFT)</option><option>Cash</option>
                </select></div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Bank Name</label>
                <select {...S('bankName')}>
                  {['SBI','Indian Bank','IOB','Canara Bank','HDFC','ICICI',
                    'Axis Bank','UCO Bank','Bank of Baroda','PNB'].map(b=>(
                    <option key={b}>{b}</option>
                  ))}
                </select></div>
              <div className="fi-form-grp"><label>Account Number</label>
                <input {...S('bankAccount')} placeholder="Account number"
                  style={{ fontFamily:'DM Mono,monospace' }} /></div>
              <div className="fi-form-grp"><label>IFSC Code</label>
                <input {...S('ifsc')} placeholder="SBIN0001234"
                  style={{ fontFamily:'DM Mono,monospace' }} /></div>
            </div>
            <div className="fi-form-row">
              {[['PF Applicable?','pfApplicable'],
                ['ESI Applicable?','esiApplicable'],
                ['PT Applicable?','ptApplicable']].map(([label,field])=>(
                <div key={field} className="fi-form-grp"><label>{label}</label>
                  <select value={salary[field]?'yes':'no'} className="fi-form-ctrl"
                    onChange={e=>setSalary(p=>({...p,[field]:e.target.value==='yes'}))}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3 — DOCUMENTS ───────────────────────── */}
      {step===3 && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">📄 Documents Collection</div>
          <div className="fi-form-sec-body">
            <div style={{ fontSize:11, color:'#6C757D', marginBottom:12,
              background:'#FFF3CD', padding:'8px 12px', borderRadius:6 }}>
              📎 Accepted formats: PDF, JPG, PNG (Max 5MB each)
            </div>
            {[
              ['Aadhaar Card','aadhaar'],
              ['PAN Card','pan'],
              ['Qualification Certificates','qual'],
              ['Previous Experience Letter','exp'],
              ['Bank Passbook / Cancelled Cheque','bank'],
              ['Passport Photo (2 copies)','photo'],
            ].map(([label,key])=>(
              <DocRow key={key} label={label} docKey={key}
                file={docFiles[key]} onUpload={handleDocUpload} />
            ))}
            <div style={{ marginTop:12, background:'#D4EDDA', padding:'8px 12px',
              borderRadius:6, fontSize:12, color:'#155724' }}>
              ✅ {Object.values(docFiles).filter(Boolean).length} of 6 documents uploaded
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4 — CHECKLIST ───────────────────────── */}
      {step===4 && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">✅ Onboarding Checklist</div>
          <div className="fi-form-sec-body">
            {[
              ['ID Card issued','idCard','🪪'],
              ['ESS login created','ess','💻'],
              ['ESI/PF registration done','esipf','🏛️'],
              ['Biometric enrollment done','biometric','🔒'],
              ['Leave balance credited','leaveBalance','🌴'],
              ['Email & system access','email','📧'],
              ['Plant induction completed','induction','🏭'],
              ['Supervisor informed','supervisor','👤'],
              ['Salary master entry done','salaryMaster','💰'],
              ['Emergency contact recorded','emergency','🆘'],
            ].map(([task,key,ic])=>(
              <div key={key} style={{ display:'flex', alignItems:'center', gap:'12px',
                padding:'10px 0', borderBottom:'1px solid var(--odoo-border)' }}>
                <span style={{ fontSize:'20px' }}>{ic}</span>
                <div style={{ flex:1, fontSize:'13px', fontWeight:'600' }}>{task}</div>
                <input type="checkbox" checked={checklist[key]}
                  onChange={e=>setChecklist(p=>({...p,[key]:e.target.checked}))}
                  style={{ width:'18px', height:'18px',
                    accentColor:'var(--odoo-green)', cursor:'pointer' }} />
              </div>
            ))}
            <div style={{ marginTop:16, background:'#D4EDDA', padding:'10px 14px',
              borderRadius:8, fontSize:12, color:'#155724' }}>
              ✅ {Object.values(checklist).filter(Boolean).length} of 10 tasks completed
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fi-form-acts">
        {step > 0 && (
          <button className="btn btn-s sd-bsm"
            onClick={()=>setStep(s=>s-1)}>← Back</button>
        )}
        <button className="btn btn-s sd-bsm"
          onClick={()=>isEdit?nav(`/hcm/profile/${empCode}`):nav('/hcm/employees')}>
          {isEdit?'← Back to Profile':'Cancel'}
        </button>
        {step < 4
          ? <button className="btn btn-p sd-bsm"
              onClick={()=>{ if(validateStep()) setStep(s=>s+1) }}>
              Next Step →</button>
          : <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
              {saving?'⏳ Saving...':isEdit?'💾 Update Employee':'✅ Complete Onboarding'}
            </button>
        }
      </div>
    </div>
  )
}
