import React,{useState,useEffect}from 'react'
import toast from 'react-hot-toast'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}):'—'

export default function ReportCard(){
  const [classes,setClasses]=useState([])
  const [sections,setSections]=useState([])
  const [exams,setExams]=useState([])
  const [students,setStudents]=useState([])
  const [selClass,setSelClass]=useState('')
  const [selSec,setSelSec]=useState('')
  const [selExam,setSelExam]=useState('')
  const [selStudent,setSelStudent]=useState('')
  const [reportData,setReportData]=useState(null)
  const [loading,setLoading]=useState(false)
  const instId=localStorage.getItem('lnv_edu_inst')||''
  const company=JSON.parse(localStorage.getItem('lnv_company')||'{}')

  useEffect(()=>{
    fetch(`${BASE}/edu/classes?institutionId=${instId}`,{headers:hdr2()}).then(r=>r.json()).then(d=>setClasses(d.data||[]))
    fetch(`${BASE}/edu/exams?institutionId=${instId}`,{headers:hdr2()}).then(r=>r.json()).then(d=>setExams(d.data||[]))
  },[])

  useEffect(()=>{
    if(!selClass)return
    const cls=classes.find(c=>String(c.id)===selClass)
    setSections(cls?.sections||[]);setSelSec('')
  },[selClass,classes])

  useEffect(()=>{
    if(!selSec)return
    fetch(`${BASE}/edu/students?sectionId=${selSec}`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setStudents(d.data||[]))
  },[selSec])

  const loadReport=async()=>{
    if(!selStudent||!selExam)return toast.error('Select student and exam')
    setLoading(true)
    try{
      const [marksRes,studentRes,attRes]=await Promise.all([
        fetch(`${BASE}/edu/marks?studentId=${selStudent}&examId=${selExam}`,{headers:hdr2()}),
        fetch(`${BASE}/edu/students/${selStudent}`,{headers:hdr2()}),
        fetch(`${BASE}/edu/attendance/student?studentId=${selStudent}`,{headers:hdr2()}),
      ])
      const [marksD,studentD,attD]=await Promise.all([marksRes.json(),studentRes.json(),attRes.json()])
      const marks=marksD.data||[]
      const student=studentD.data
      const attendance=attD.data||[]
      const exam=exams.find(e=>String(e.id)===selExam)
      const totalMarks=marks.reduce((s,m)=>s+Number(m.totalMarks||0),0)
      const maxMarks=marks.length*100
      const percentage=maxMarks>0?((totalMarks/maxMarks)*100).toFixed(1):0
      const attPresent=attendance.filter(a=>a.status==='PRESENT').length
      const attTotal=attendance.length
      setReportData({student,marks,exam,totalMarks,maxMarks,percentage,attPresent,attTotal})
    }catch{toast.error('Failed to load')}finally{setLoading(false)}
  }

  const getGrade=pct=>pct>=90?'A+':pct>=80?'A':pct>=70?'B+':pct>=60?'B':pct>=50?'C':pct>=35?'D':'F'
  const getGradeColor=pct=>pct>=50?'#1E8449':pct>=35?'#B8860B':'#C0392B'
  const inp={padding:'7px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}

  return(
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📄 Report Card</div>
        {reportData&&(
          <button onClick={()=>window.print()}
            style={{padding:'7px 18px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
            🖨️ Print Report Card
          </button>
        )}
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility:hidden; }
          #report-card-print, #report-card-print * { visibility:visible; }
          #report-card-print { position:fixed;left:0;top:0;width:100%;padding:20px;font-family:'Arial',sans-serif; }
          .no-print { display:none !important; }
        }
      `}</style>

      {/* Selectors */}
      <div className="no-print" style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:'14px 16px',marginBottom:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:12,alignItems:'end'}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:4,textTransform:'uppercase'}}>Class</div>
            <select value={selClass} onChange={e=>setSelClass(e.target.value)} style={inp}>
              <option value=''>Select Class</option>
              {classes.map(c=><option key={c.id} value={c.id}>{c.className}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:4,textTransform:'uppercase'}}>Section</div>
            <select value={selSec} onChange={e=>setSelSec(e.target.value)} disabled={!selClass} style={inp}>
              <option value=''>Select Section</option>
              {sections.map(s=><option key={s.id} value={s.id}>Section {s.sectionName}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:4,textTransform:'uppercase'}}>Student</div>
            <select value={selStudent} onChange={e=>setSelStudent(e.target.value)} disabled={!selSec} style={inp}>
              <option value=''>Select Student</option>
              {students.map(s=><option key={s.id} value={s.id}>{s.rollNo?`${s.rollNo}. `:''}{s.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:4,textTransform:'uppercase'}}>Exam</div>
            <select value={selExam} onChange={e=>setSelExam(e.target.value)} style={inp}>
              <option value=''>Select Exam</option>
              {exams.map(e=><option key={e.id} value={e.id}>{e.examName}</option>)}
            </select>
          </div>
          <button onClick={loadReport} disabled={loading||!selStudent||!selExam}
            style={{padding:'8px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12,height:36}}>
            {loading?'⏳':'📄 Generate'}
          </button>
        </div>
      </div>

      {/* REPORT CARD */}
      {reportData?(
        <div id="report-card-print" style={{background:'#fff',border:'2px solid #6E2C00',borderRadius:8,overflow:'hidden',maxWidth:800,margin:'0 auto'}}>

          {/* School Header */}
          <div style={{background:'linear-gradient(135deg,#6E2C00,#8B3A00)',padding:'20px 24px',textAlign:'center',color:'#fff'}}>
            <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>{company.name||'LNV Matriculation School'}</div>
            <div style={{fontSize:12,color:'#FDEBD0',marginBottom:2}}>{company.address||'Coimbatore, Tamil Nadu'}</div>
            <div style={{fontSize:14,fontWeight:700,color:'#FFD700',marginTop:8,letterSpacing:2}}>
              PROGRESS REPORT CARD
            </div>
            <div style={{fontSize:12,color:'#E8C9A0',marginTop:2}}>{reportData.exam?.examName} — Academic Year 2025-26</div>
          </div>

          {/* Student Info */}
          <div style={{background:'#FDF2E9',padding:'12px 20px',borderBottom:'1px solid #E8D5C4'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12}}>
              {[
                ['Student Name',reportData.student?.name||'—'],
                ['Admission No',reportData.student?.admissionNo||'—'],
                ['Class / Section',`${reportData.student?.section?.class?.className||'—'} — ${reportData.student?.section?.sectionName||'—'}`],
                ['Roll No',reportData.student?.rollNo||'—'],
                ['Father Name',reportData.student?.fatherName||'—'],
                ['DOB',fmtD(reportData.student?.dob)],
                ['Category',reportData.student?.category||'—'],
                ['Date of Report',fmtD(new Date())],
              ].map(([l,v])=>(
                <div key={l} style={{fontSize:11}}>
                  <div style={{color:'#888',marginBottom:2}}>{l}</div>
                  <div style={{fontWeight:700,color:'#333'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Marks Table */}
          <div style={{padding:20}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,marginBottom:16}}>
              <thead>
                <tr style={{background:'#6E2C00',color:'#fff'}}>
                  {['Subject','Theory Marks','Practical Marks','Total Marks','Grade','Result'].map(h=>(
                    <th key={h} style={{padding:'8px 12px',textAlign:'center',fontSize:11,fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.marks.length>0?reportData.marks.map((m,i)=>{
                  const pct=m.totalMarks&&m.exam?.maxMarks?Number(m.totalMarks)/Number(m.exam.maxMarks)*100:m.totalMarks?Number(m.totalMarks):0
                  const grade=getGrade(pct)
                  const gc=getGradeColor(pct)
                  const passed=pct>=35
                  return(
                    <tr key={m.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F0EDE0'}}>
                      <td style={{padding:'9px 12px',fontWeight:600}}>{m.subject?.subjectName||'—'}</td>
                      <td style={{padding:'9px 12px',textAlign:'center'}}>{m.isAbsent?'AB':m.theoryMarks||'—'}</td>
                      <td style={{padding:'9px 12px',textAlign:'center'}}>{m.practicalMarks||'—'}</td>
                      <td style={{padding:'9px 12px',textAlign:'center',fontWeight:700}}>{m.isAbsent?'AB':m.totalMarks||'—'}</td>
                      <td style={{padding:'9px 12px',textAlign:'center'}}>
                        <span style={{fontWeight:800,fontSize:14,color:gc}}>{m.isAbsent?'AB':grade}</span>
                      </td>
                      <td style={{padding:'9px 12px',textAlign:'center'}}>
                        <span style={{padding:'2px 10px',borderRadius:10,fontSize:10,fontWeight:700,
                          background:m.isAbsent?'#F5F5F5':passed?'#E8F5E9':'#FDEDEC',
                          color:m.isAbsent?'#666':passed?'#1E8449':'#C0392B'}}>
                          {m.isAbsent?'AB':passed?'PASS':'FAIL'}
                        </span>
                      </td>
                    </tr>
                  )
                }):(
                  <tr><td colSpan={6} style={{padding:20,textAlign:'center',color:'#aaa'}}>No marks entered for this exam</td></tr>
                )}
              </tbody>
              {reportData.marks.length>0&&(
                <tfoot>
                  <tr style={{background:'#6E2C00',color:'#fff',fontWeight:700}}>
                    <td style={{padding:'10px 12px'}}>TOTAL</td>
                    <td colSpan={2}/>
                    <td style={{padding:'10px 12px',textAlign:'center',fontSize:16}}>{reportData.totalMarks}/{reportData.maxMarks}</td>
                    <td style={{padding:'10px 12px',textAlign:'center',fontSize:16,color:'#FFD700'}}>{getGrade(reportData.percentage)}</td>
                    <td style={{padding:'10px 12px',textAlign:'center'}}>
                      <span style={{padding:'3px 12px',background:reportData.percentage>=35?'#1E8449':'#C0392B',color:'#fff',borderRadius:10,fontSize:11}}>
                        {reportData.percentage>=35?'PASS':'FAIL'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>

            {/* Summary Cards */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:16}}>
              {[
                ['Total Marks',`${reportData.totalMarks}/${reportData.maxMarks}`,'#6E2C00'],
                ['Percentage',`${reportData.percentage}%`,'#1A5276'],
                ['Grade',getGrade(reportData.percentage),getGradeColor(reportData.percentage)],
                ['Attendance',`${reportData.attPresent}/${reportData.attTotal} (${reportData.attTotal>0?((reportData.attPresent/reportData.attTotal)*100).toFixed(0):0}%)`,reportData.attPresent/Math.max(reportData.attTotal,1)>=0.75?'#1E8449':'#C0392B'],
              ].map(([l,v,c])=>(
                <div key={l} style={{border:`2px solid ${c}22`,borderRadius:8,padding:'10px 14px',textAlign:'center',borderTop:`4px solid ${c}`}}>
                  <div style={{fontSize:10,color:'#888',marginBottom:4}}>{l}</div>
                  <div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Remarks & Signature */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:20}}>
              <div style={{border:'1px solid #E8E0E8',borderRadius:6,padding:'12px 14px'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:8}}>Class Teacher Remarks:</div>
                <div style={{height:40,borderBottom:'1px solid #ddd'}}/>
                <div style={{fontSize:10,color:'#888',marginTop:6}}>Signature & Date</div>
              </div>
              <div style={{border:'1px solid #E8E0E8',borderRadius:6,padding:'12px 14px'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:8}}>Principal Signature:</div>
                <div style={{height:40,borderBottom:'1px solid #ddd'}}/>
                <div style={{fontSize:10,color:'#888',marginTop:6}}>Seal & Date</div>
              </div>
            </div>

            {/* Parent Signature */}
            <div style={{marginTop:12,border:'1px solid #E8E0E8',borderRadius:6,padding:'10px 14px',background:'#F8F5F8'}}>
              <div style={{fontSize:11,fontWeight:700,color:'#6E2C00',marginBottom:6}}>Parent / Guardian Signature:</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <div style={{borderBottom:'1px solid #ddd',height:30}}/>
                <div style={{fontSize:10,color:'#888',paddingTop:8}}>Date: _______________</div>
              </div>
            </div>

            <div style={{marginTop:12,textAlign:'center',fontSize:10,color:'#aaa',fontStyle:'italic'}}>
              "Education is the most powerful weapon which you can use to change the world" — Nelson Mandela
            </div>
          </div>
        </div>
      ):(
        <div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
          <div style={{fontSize:60,marginBottom:16}}>📄</div>
          <div style={{fontSize:16,fontWeight:700,color:'#6E2C00',marginBottom:8}}>Generate Report Card</div>
          <div style={{fontSize:13,color:'#888'}}>Select Class → Section → Student → Exam → Click Generate</div>
        </div>
      )}
    </div>
  )
}
