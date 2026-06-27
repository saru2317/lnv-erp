import React,{useState,useEffect}from 'react'
import toast from 'react-hot-toast'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const inp={padding:'6px 8px',border:'1.5px solid #DDD',borderRadius:4,fontSize:12,outline:'none',textAlign:'center',width:'100%',boxSizing:'border-box'}

export default function MarkEntry(){
  const [exams,setExams]=useState([])
  const [classes,setClasses]=useState([])
  const [sections,setSections]=useState([])
  const [subjects,setSubjects]=useState([])
  const [students,setStudents]=useState([])
  const [marks,setMarks]=useState({}) // {studentId_subjectId: {theory,practical}}
  const [selExam,setSelExam]=useState('')
  const [selClass,setSelClass]=useState('')
  const [selSec,setSelSec]=useState('')
  const [selSubject,setSelSubject]=useState('')
  const [saving,setSaving]=useState(false)
  const instId=localStorage.getItem('lnv_edu_inst')||''

  useEffect(()=>{
    fetch(`${BASE}/edu/exams`,{headers:hdr2()}).then(r=>r.json()).then(d=>setExams(d.data||[]))
    fetch(`${BASE}/edu/classes?institutionId=${instId}`,{headers:hdr2()}).then(r=>r.json()).then(d=>setClasses(d.data||[]))
    fetch(`${BASE}/edu/subjects`,{headers:hdr2()}).then(r=>r.json()).then(d=>setSubjects(d.data||[]))
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

  const setMark=(studentId,field,value)=>{
    const key=`${studentId}_${selSubject}`
    setMarks(prev=>({...prev,[key]:{...(prev[key]||{}), [field]:value}}))
  }
  const getMark=(studentId,field)=>marks[`${studentId}_${selSubject}`]?.[field]||''

  const selSubjectData=subjects.find(s=>String(s.id)===selSubject)
  const hasPractical=selSubjectData&&Number(selSubjectData.maxPracticalMarks||0)>0

  const saveMarks=async()=>{
    if(!selExam||!selSec||!selSubject)return toast.error('Select exam, section and subject')
    const entries=students.map(s=>{
      const key=`${s.id}_${selSubject}`
      const m=marks[key]||{}
      const theory=parseFloat(m.theory)||null
      const practical=parseFloat(m.practical)||null
      const total=((theory||0)+(practical||0))||null
      return{examId:parseInt(selExam),studentId:s.id,subjectId:parseInt(selSubject),
        theoryMarks:theory,practicalMarks:hasPractical?practical:null,totalMarks:total,
        isAbsent:m.absent||false}
    }).filter(e=>e.theoryMarks!==null||e.isAbsent)

    if(entries.length===0)return toast.error('Enter at least one mark')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/edu/marks`,{method:'POST',headers:hdr(),body:JSON.stringify({entries})})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`✅ ${entries.length} marks saved!`)
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  const present=students.filter(s=>!marks[`${s.id}_${selSubject}`]?.absent).length
  const avgMarks=students.length>0?
    (students.reduce((sum,s)=>{const m=marks[`${s.id}_${selSubject}`];return sum+(m?.theory?parseFloat(m.theory):0)},0)/students.length).toFixed(1):0

  return(
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📊 Mark Entry</div>
        {students.length>0&&selSubject&&(
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:12,color:'#888'}}>Avg: <strong>{avgMarks}</strong></span>
            <button onClick={saveMarks} disabled={saving}
              style={{padding:'7px 18px',background:'#1E8449',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
              {saving?'⏳...':'💾 Save Marks'}
            </button>
          </div>
        )}
      </div>

      {/* Selectors */}
      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:'14px 16px',marginBottom:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:12}}>
          {[
            ['Exam',<select value={selExam} onChange={e=>setSelExam(e.target.value)} style={{...inp,textAlign:'left'}}>
              <option value=''>Select Exam</option>
              {exams.map(e=><option key={e.id} value={e.id}>{e.examName}</option>)}
            </select>],
            ['Class',<select value={selClass} onChange={e=>setSelClass(e.target.value)} style={{...inp,textAlign:'left'}}>
              <option value=''>Select Class</option>
              {classes.map(c=><option key={c.id} value={c.id}>{c.className}</option>)}
            </select>],
            ['Section',<select value={selSec} onChange={e=>setSelSec(e.target.value)} disabled={!selClass} style={{...inp,textAlign:'left'}}>
              <option value=''>Select Section</option>
              {sections.map(s=><option key={s.id} value={s.id}>Section {s.sectionName}</option>)}
            </select>],
            ['Subject',<select value={selSubject} onChange={e=>setSelSubject(e.target.value)} style={{...inp,textAlign:'left'}}>
              <option value=''>Select Subject</option>
              {subjects.map(s=><option key={s.id} value={s.id}>{s.subjectName}</option>)}
            </select>],
          ].map(([label,el])=>(
            <div key={label}>
              <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:4,textTransform:'uppercase'}}>{label}</div>
              {el}
            </div>
          ))}
        </div>
        {selSubjectData&&(
          <div style={{marginTop:10,background:'#EBF5FB',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#1A5276',fontWeight:600}}>
            📚 {selSubjectData.subjectName}
            {selSubjectData.maxTheoryMarks&&` | Theory: /${selSubjectData.maxTheoryMarks}`}
            {hasPractical&&` | Practical: /${selSubjectData.maxPracticalMarks}`}
            {selSubjectData.passMarks&&` | Pass: ${selSubjectData.passMarks}`}
          </div>
        )}
      </div>

      {/* Mark Entry Table */}
      {students.length>0&&selSubject?(
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#1A5276',color:'#fff'}}>
                <th style={{padding:'9px 12px',textAlign:'left',fontSize:11,width:40}}>Roll</th>
                <th style={{padding:'9px 12px',textAlign:'left',fontSize:11}}>Student Name</th>
                <th style={{padding:'9px 12px',textAlign:'center',fontSize:11,width:100}}>Theory /{selSubjectData?.maxTheoryMarks||100}</th>
                {hasPractical&&<th style={{padding:'9px 12px',textAlign:'center',fontSize:11,width:100}}>Practical /{selSubjectData?.maxPracticalMarks}</th>}
                <th style={{padding:'9px 12px',textAlign:'center',fontSize:11,width:80}}>Total</th>
                <th style={{padding:'9px 12px',textAlign:'center',fontSize:11,width:60}}>Absent</th>
                <th style={{padding:'9px 12px',textAlign:'center',fontSize:11,width:60}}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s,i)=>{
                const key=`${s.id}_${selSubject}`
                const m=marks[key]||{}
                const theory=parseFloat(m.theory||0)
                const practical=parseFloat(m.practical||0)
                const total=theory+(hasPractical?practical:0)
                const max=Number(selSubjectData?.maxTheoryMarks||100)+(hasPractical?Number(selSubjectData?.maxPracticalMarks||0):0)
                const pct=max>0?(total/max)*100:0
                const grade=pct>=90?'A+':pct>=80?'A':pct>=70?'B+':pct>=60?'B':pct>=50?'C':pct>=35?'D':'F'
                const gradeColor=pct>=50?'#1E8449':pct>=35?'#B8860B':'#C0392B'
                const isAbsent=m.absent||false

                return(
                  <tr key={s.id} style={{background:isAbsent?'#FFF5F5':i%2===0?'#fff':'#F0F7FF',
                    borderBottom:'1px solid #E8EEF8',opacity:isAbsent?.6:1}}>
                    <td style={{padding:'8px 12px',color:'#888',fontWeight:600,textAlign:'center'}}>{s.rollNo||i+1}</td>
                    <td style={{padding:'8px 12px',fontWeight:700}}>{s.name}</td>
                    <td style={{padding:'6px 8px',textAlign:'center'}}>
                      <input type='number' value={getMark(s.id,'theory')} disabled={isAbsent}
                        onChange={e=>setMark(s.id,'theory',e.target.value)}
                        min='0' max={selSubjectData?.maxTheoryMarks||100}
                        style={{...inp,width:70,background:isAbsent?'#F5F5F5':'#fff',
                          borderColor:theory>Number(selSubjectData?.maxTheoryMarks||100)?'#C0392B':
                            theory>0&&theory>=Number(selSubjectData?.passMarks||35)?'#1E8449':'#DDD'}}/>
                    </td>
                    {hasPractical&&<td style={{padding:'6px 8px',textAlign:'center'}}>
                      <input type='number' value={getMark(s.id,'practical')} disabled={isAbsent}
                        onChange={e=>setMark(s.id,'practical',e.target.value)}
                        min='0' max={selSubjectData?.maxPracticalMarks}
                        style={{...inp,width:70,background:isAbsent?'#F5F5F5':'#fff'}}/>
                    </td>}
                    <td style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:gradeColor}}>
                      {isAbsent?'AB':total>0?total:'—'}
                    </td>
                    <td style={{padding:'8px 12px',textAlign:'center'}}>
                      <input type='checkbox' checked={isAbsent}
                        onChange={e=>setMark(s.id,'absent',e.target.checked)}
                        style={{width:15,height:15,accentColor:'#C0392B'}}/>
                    </td>
                    <td style={{padding:'8px 12px',textAlign:'center'}}>
                      {!isAbsent&&total>0&&<span style={{fontWeight:700,fontSize:13,color:gradeColor}}>{grade}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{background:'#1A5276',color:'#fff'}}>
                <td colSpan={2} style={{padding:'9px 12px',fontWeight:700}}>Total: {students.length} students | {present} Present</td>
                <td style={{padding:'9px 12px',textAlign:'center',fontWeight:700}}>Avg: {avgMarks}</td>
                <td colSpan={hasPractical?4:3}/>
              </tr>
            </tfoot>
          </table>
          <div style={{padding:'12px 16px',background:'#F0F7FF',display:'flex',justifyContent:'flex-end'}}>
            <button onClick={saveMarks} disabled={saving}
              style={{padding:'10px 28px',background:'#1A5276',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:800,fontSize:14}}>
              {saving?'⏳ Saving...':'💾 Save All Marks'}
            </button>
          </div>
        </div>
      ):selSec&&selSubject&&students.length===0?(
        <div style={{padding:40,textAlign:'center',background:'#fff',borderRadius:8,border:'1px solid #E8E0E8',color:'#aaa'}}>No students in this section</div>
      ):(
        <div style={{padding:60,textAlign:'center',background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
          <div style={{fontSize:48,marginBottom:12}}>📊</div>
          <div style={{fontSize:14,color:'#888'}}>Select Exam → Class → Section → Subject to enter marks</div>
        </div>
      )}
    </div>
  )
}
