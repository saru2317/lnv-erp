import React,{useState,useEffect}from 'react'
import {useNavigate,useParams}from 'react-router-dom'
import toast from 'react-hot-toast'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}):'—'
const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN')

const TABS=['Profile','Academic','Attendance','Fees','Marks','Transport']
const TAB_ICONS=['👤','🎓','✅','💰','📊','🚌']

export default function StudentDetail(){
  const {id}=useParams()
  const nav=useNavigate()
  const [student,setStudent]=useState(null)
  const [tab,setTab]=useState(0)
  const [loading,setLoading]=useState(true)
  const [attendance,setAttendance]=useState([])
  const [fees,setFees]=useState([])
  const [marks,setMarks]=useState([])

  useEffect(()=>{
    fetch(`${BASE}/edu/students/${id}`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>{setStudent(d.data);setLoading(false)}).catch(()=>setLoading(false))
  },[id])

  useEffect(()=>{
    if(!student)return
    if(tab===2)fetch(`${BASE}/edu/attendance/student?studentId=${id}`,{headers:hdr2()}).then(r=>r.json()).then(d=>setAttendance(d.data||[]))
    if(tab===3)fetch(`${BASE}/edu/fee/demands?studentId=${id}`,{headers:hdr2()}).then(r=>r.json()).then(d=>setFees(d.data||[]))
    if(tab===4)fetch(`${BASE}/edu/marks?studentId=${id}`,{headers:hdr2()}).then(r=>r.json()).then(d=>setMarks(d.data||[]))
  },[tab,student,id])

  if(loading)return<div style={{textAlign:'center',padding:60,fontFamily:'DM Sans,sans-serif',color:'#aaa'}}>⏳ Loading student...</div>
  if(!student)return<div style={{textAlign:'center',padding:60,fontFamily:'DM Sans,sans-serif'}}>Student not found</div>

  const attPct=attendance.length>0?(attendance.filter(a=>a.status==='PRESENT').length/attendance.length*100).toFixed(1):0
  const feePaid=fees.filter(f=>f.status==='PAID').reduce((s,f)=>s+Number(f.netAmount||0),0)
  const feePending=fees.filter(f=>f.status==='PENDING').reduce((s,f)=>s+Number(f.balanceAmount||0),0)

  return(
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#6E2C00,#8B3A00)',padding:'16px 20px',marginBottom:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:'rgba(255,255,255,.2)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>
              {student.gender==='Female'?'👧':'👦'}
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>{student.name}</div>
              <div style={{fontSize:12,color:'#FDEBD0',marginTop:2}}>
                {student.admissionNo} · {student.section?.class?.className} — Section {student.section?.sectionName}
              </div>
              <div style={{display:'flex',gap:8,marginTop:6}}>
                {[student.category,student.gender,student.bloodGroup].filter(Boolean).map(v=>(
                  <span key={v} style={{padding:'2px 8px',background:'rgba(255,255,255,.2)',color:'#fff',
                    borderRadius:10,fontSize:10,fontWeight:700}}>{v}</span>
                ))}
                <span style={{padding:'2px 8px',background:student.status==='ACTIVE'?'#1E8449':'#C0392B',
                  color:'#fff',borderRadius:10,fontSize:10,fontWeight:700}}>{student.status}</span>
              </div>
            </div>
          </div>
          <button onClick={()=>nav('/edu/students')}
            style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',
              borderRadius:6,padding:'6px 14px',cursor:'pointer',fontWeight:600,fontSize:12}}>
            ← Back
          </button>
        </div>
        {/* Quick stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginTop:14}}>
          {[
            ['📅 DOB',fmtD(student.dob)],
            ['✅ Attendance',`${attPct}%`],
            ['💰 Fee Paid',fmtC(feePaid)],
            ['⚠️ Pending',fmtC(feePending)],
          ].map(([l,v])=>(
            <div key={l} style={{background:'rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',textAlign:'center'}}>
              <div style={{fontSize:10,color:'#FDEBD0'}}>{l}</div>
              <div style={{fontSize:14,fontWeight:700,color:'#fff',marginTop:2}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:'#fff',borderBottom:'1px solid #E8E0E8',display:'flex',gap:0}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)}
            style={{padding:'10px 18px',border:'none',borderBottom:`3px solid ${tab===i?'#6E2C00':'transparent'}`,
              cursor:'pointer',fontSize:12,fontWeight:tab===i?700:400,
              color:tab===i?'#6E2C00':'#888',background:'transparent',display:'flex',gap:6,alignItems:'center'}}>
            {TAB_ICONS[i]} {t}
          </button>
        ))}
      </div>

      <div style={{padding:'16px 0'}}>

        {/* TAB 0: Profile */}
        {tab===0&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
              <div style={{fontSize:13,fontWeight:700,color:'#6E2C00',marginBottom:12,borderBottom:'1px solid #F5EDE0',paddingBottom:8}}>👤 Personal Details</div>
              {[
                ['Name',student.name],['Admission No',student.admissionNo],
                ['Date of Birth',fmtD(student.dob)],['Gender',student.gender||'—'],
                ['Blood Group',student.bloodGroup||'—'],['Aadhar',student.aadhar||'—'],
                ['Category',student.category],['Religion',student.religion||'—'],
                ['Mother Tongue',student.motherTongue||'—'],['Nationality',student.nationality||'Indian'],
                ['Address',student.address||'—'],['City',student.city||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{display:'flex',padding:'6px 0',borderBottom:'1px solid #F8F5F8',fontSize:12}}>
                  <span style={{color:'#888',minWidth:120}}>{l}</span>
                  <span style={{fontWeight:600,color:'#333'}}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{background:'#EBF5FB',border:'1px solid #AED6F1',borderRadius:8,padding:16,marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,color:'#1A5276',marginBottom:12}}>👨 Father Details</div>
                {[['Name',student.fatherName||'—'],['Phone',student.fatherPhone||'—'],['Occupation',student.fatherOccupation||'—']].map(([l,v])=>(
                  <div key={l} style={{display:'flex',padding:'5px 0',fontSize:12}}>
                    <span style={{color:'#888',minWidth:100}}>{l}</span>
                    <span style={{fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{background:'#F0EBF0',border:'1px solid #D7BDE2',borderRadius:8,padding:16,marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,color:'#714B67',marginBottom:12}}>👩 Mother Details</div>
                {[['Name',student.motherName||'—'],['Phone',student.motherPhone||'—'],['Occupation',student.motherOccupation||'—']].map(([l,v])=>(
                  <div key={l} style={{display:'flex',padding:'5px 0',fontSize:12}}>
                    <span style={{color:'#888',minWidth:100}}>{l}</span>
                    <span style={{fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
              {student.rteStudent&&(
                <div style={{background:'#FDEDEC',border:'1px solid #F1948A',borderRadius:8,padding:'10px 14px'}}>
                  <span style={{fontSize:12,fontWeight:700,color:'#C0392B'}}>🎓 RTE Student (Right to Education)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: Academic */}
        {tab===1&&(
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#6E2C00',marginBottom:12}}>🎓 Academic Details</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              {[
                ['Class',student.section?.class?.className||'—'],
                ['Section',`Section ${student.section?.sectionName||'—'}`],
                ['Roll Number',student.rollNo||'—'],
                ['Admission Date',fmtD(student.admissionDate)],
                ['Previous School',student.previousSchool||'—'],
                ['Previous Class',student.previousClass||'—'],
                ['TC Number',student.tcNumber||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{background:'#F8F5F8',borderRadius:6,padding:'10px 14px'}}>
                  <div style={{fontSize:10,color:'#888',marginBottom:4}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:'#333'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Attendance */}
        {tab===2&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:14}}>
              {[
                ['Total Days',attendance.length,'#6E2C00'],
                ['Present',attendance.filter(a=>a.status==='PRESENT').length,'#1E8449'],
                ['Absent',attendance.filter(a=>a.status==='ABSENT').length,'#C0392B'],
                ['Attendance %',`${attPct}%`,attPct>=75?'#1E8449':'#C0392B'],
              ].map(([l,v,c])=>(
                <div key={l} style={{background:'#fff',border:`1px solid ${c}22`,borderRadius:8,padding:'12px 14px',borderLeft:`3px solid ${c}`,textAlign:'center'}}>
                  <div style={{fontSize:11,color:'#888'}}>{l}</div>
                  <div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
              {attendance.length===0?
                <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No attendance records yet</div>:
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{background:'#6E2C00',color:'#fff'}}>
                    {['Date','Status','In Time','Remarks'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {attendance.slice(0,30).map((a,i)=>(
                      <tr key={a.id} style={{background:a.status==='ABSENT'?'#FFF5F5':i%2===0?'#fff':'#FAFAFA',borderBottom:'1px solid #F0F0F0'}}>
                        <td style={{padding:'8px 12px',fontWeight:600}}>{fmtD(a.date)}</td>
                        <td style={{padding:'8px 12px'}}>
                          <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                            background:a.status==='PRESENT'?'#E8F5E9':a.status==='ABSENT'?'#FDEDEC':'#FEF9E7',
                            color:a.status==='PRESENT'?'#1E8449':a.status==='ABSENT'?'#C0392B':'#B8860B'}}>
                            {a.status}
                          </span>
                        </td>
                        <td style={{padding:'8px 12px',color:'#888'}}>{a.inTime||'—'}</td>
                        <td style={{padding:'8px 12px',color:'#888',fontSize:11}}>{a.remarks||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
            </div>
          </div>
        )}

        {/* TAB 3: Fees */}
        {tab===3&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
              {[
                ['Total Demand',fmtC(fees.reduce((s,f)=>s+Number(f.netAmount||0),0)),'#6E2C00'],
                ['Paid',fmtC(feePaid),'#1E8449'],
                ['Pending',fmtC(feePending),'#C0392B'],
              ].map(([l,v,c])=>(
                <div key={l} style={{background:'#fff',border:`1px solid ${c}22`,borderRadius:8,padding:'12px 14px',borderLeft:`3px solid ${c}`,textAlign:'center'}}>
                  <div style={{fontSize:11,color:'#888'}}>{l}</div>
                  <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
              {fees.length===0?<div style={{padding:40,textAlign:'center',color:'#aaa'}}>No fee records</div>:
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{background:'#6E2C00',color:'#fff'}}>
                    {['Fee Type','Period','Amount','Concession','Net','Status'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {fees.map((f,i)=>{
                      const sc={PAID:{bg:'#E8F5E9',color:'#1E8449'},PENDING:{bg:'#FEF9E7',color:'#B8860B'},PARTIAL:{bg:'#EBF5FB',color:'#1A5276'}}[f.status]||{bg:'#F5F5F5',color:'#666'}
                      return(
                        <tr key={f.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                          <td style={{padding:'8px 12px',fontWeight:600}}>{f.feeType?.feeName||'—'}</td>
                          <td style={{padding:'8px 12px',color:'#888',fontSize:11}}>{f.month?new Date(2026,f.month-1).toLocaleString('default',{month:'short'}):'Annual'}</td>
                          <td style={{padding:'8px 12px'}}>{fmtC(f.amount)}</td>
                          <td style={{padding:'8px 12px',color:'#1E8449'}}>{Number(f.concessionAmt)>0?`-${fmtC(f.concessionAmt)}`:'—'}</td>
                          <td style={{padding:'8px 12px',fontWeight:700,color:'#6E2C00'}}>{fmtC(f.netAmount)}</td>
                          <td style={{padding:'8px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:sc.bg,color:sc.color}}>{f.status}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>}
            </div>
          </div>
        )}

        {/* TAB 4: Marks */}
        {tab===4&&(
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
            {marks.length===0?<div style={{padding:40,textAlign:'center',color:'#aaa'}}>No marks entered yet</div>:
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#1A5276',color:'#fff'}}>
                  {['Exam','Subject','Theory','Practical','Total','Grade'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {marks.map((m,i)=>{
                    const pct=m.totalMarks&&m.exam?.maxMarks?(Number(m.totalMarks)/Number(m.exam?.maxMarks)*100):0
                    const grade=pct>=90?'A+':pct>=80?'A':pct>=70?'B+':pct>=60?'B':pct>=50?'C':pct>=35?'D':'F'
                    const gc=pct>=50?'#1E8449':pct>=35?'#B8860B':'#C0392B'
                    return(
                      <tr key={m.id} style={{background:i%2===0?'#fff':'#EBF5FB',borderBottom:'1px solid #D6EAF8'}}>
                        <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{m.exam?.examName||'—'}</td>
                        <td style={{padding:'8px 12px',fontWeight:600}}>{m.subject?.subjectName||'—'}</td>
                        <td style={{padding:'8px 12px',textAlign:'center'}}>{m.isAbsent?'AB':m.theoryMarks||'—'}</td>
                        <td style={{padding:'8px 12px',textAlign:'center'}}>{m.practicalMarks||'—'}</td>
                        <td style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:gc}}>{m.isAbsent?'AB':m.totalMarks||'—'}</td>
                        <td style={{padding:'8px 12px',textAlign:'center'}}><span style={{fontWeight:800,color:gc,fontSize:14}}>{m.isAbsent?'AB':grade}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>}
          </div>
        )}

        {/* TAB 5: Transport */}
        {tab===5&&(
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#117A65',marginBottom:14}}>🚌 Transport Details</div>
            {student.busRoute?(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {[
                  ['Bus Route',student.busRoute?.routeName||'—'],
                  ['Route No',student.busRoute?.routeNo||'—'],
                  ['Bus Stop',student.busStop?.stopName||'—'],
                  ['Pickup Time',student.busStop?.pickupTime||'—'],
                  ['Drop Time',student.busStop?.dropTime||'—'],
                  ['Bus Fee',student.busStop?.feeAmount?`₹${student.busStop.feeAmount}/month`:'—'],
                ].map(([l,v])=>(
                  <div key={l} style={{background:'#E8F8F5',borderRadius:6,padding:'10px 14px'}}>
                    <div style={{fontSize:10,color:'#888',marginBottom:4}}>{l}</div>
                    <div style={{fontSize:13,fontWeight:700,color:'#117A65'}}>{v}</div>
                  </div>
                ))}
              </div>
            ):(
              <div style={{textAlign:'center',padding:30,color:'#aaa'}}>
                <div style={{fontSize:36,marginBottom:8}}>🚶</div>
                <div style={{fontSize:13}}>Day Scholar — No bus assigned</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
