import React,{useState,useEffect}from 'react'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN')
const getGrade=pct=>pct>=90?'A+':pct>=80?'A':pct>=70?'B+':pct>=60?'B':pct>=50?'C':pct>=35?'D':'F'
const getColor=pct=>pct>=50?'#1E8449':pct>=35?'#B8860B':'#C0392B'
const inp={padding:'7px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}

export default function ResultView(){
  const [exams,setExams]=useState([])
  const [classes,setClasses]=useState([])
  const [sections,setSections]=useState([])
  const [students,setStudents]=useState([])
  const [marks,setMarks]=useState([])
  const [selExam,setSelExam]=useState('')
  const [selClass,setSelClass]=useState('')
  const [selSec,setSelSec]=useState('')
  const [loading,setLoading]=useState(false)
  const instId=localStorage.getItem('lnv_edu_inst')||''

  useEffect(()=>{
    fetch(`${BASE}/edu/exams?institutionId=${instId}`,{headers:hdr2()}).then(r=>r.json()).then(d=>setExams(d.data||[]))
    fetch(`${BASE}/edu/classes?institutionId=${instId}`,{headers:hdr2()}).then(r=>r.json()).then(d=>setClasses(d.data||[]))
  },[])

  useEffect(()=>{
    if(!selClass)return
    const cls=classes.find(c=>String(c.id)===selClass)
    setSections(cls?.sections||[]);setSelSec('')
  },[selClass,classes])

  useEffect(()=>{
    if(!selSec||!selExam)return
    setLoading(true)
    Promise.all([
      fetch(`${BASE}/edu/students?sectionId=${selSec}`,{headers:hdr2()}).then(r=>r.json()),
      fetch(`${BASE}/edu/marks?examId=${selExam}&sectionId=${selSec}`,{headers:hdr2()}).then(r=>r.json()),
    ]).then(([sD,mD])=>{
      setStudents(sD.data||[])
      setMarks(mD.data||[])
      setLoading(false)
    }).catch(()=>setLoading(false))
  },[selSec,selExam])

  // Build result per student
  const results=students.map(s=>{
    const sMarks=marks.filter(m=>m.studentId===s.id)
    const total=sMarks.reduce((sum,m)=>sum+Number(m.totalMarks||0),0)
    const max=sMarks.length*100
    const pct=max>0?(total/max*100):0
    const absent=sMarks.some(m=>m.isAbsent)
    return{...s,total,max,pct:pct.toFixed(1),grade:getGrade(pct),passed:pct>=35&&!absent,absent}
  }).sort((a,b)=>b.pct-a.pct)

  const ranks=results.map((r,i)=>({...r,rank:r.absent?'AB':i+1}))
  const passCount=ranks.filter(r=>r.passed).length
  const failCount=ranks.filter(r=>!r.passed&&!r.absent).length

  return(
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>🏆 Results</div>
        {ranks.length>0&&<button onClick={()=>window.print()}
          style={{padding:'7px 16px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
          🖨️ Print Results
        </button>}
      </div>

      {/* Selectors */}
      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:'12px 16px',marginBottom:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:4,textTransform:'uppercase'}}>Exam</div>
            <select value={selExam} onChange={e=>setSelExam(e.target.value)} style={inp}>
              <option value=''>Select Exam</option>
              {exams.map(e=><option key={e.id} value={e.id}>{e.examName}</option>)}
            </select>
          </div>
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
        </div>
      </div>

      {/* Stats */}
      {ranks.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:14}}>
          {[
            ['Total',ranks.length,'#6E2C00'],
            ['Pass',passCount,'#1E8449'],
            ['Fail',failCount,'#C0392B'],
            ['Pass %',`${ranks.length>0?(passCount/ranks.length*100).toFixed(0):0}%`,'#1A5276'],
            ['Class Avg',`${ranks.length>0?(ranks.reduce((s,r)=>s+parseFloat(r.pct||0),0)/ranks.length).toFixed(1):0}%`,'#B8860B'],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:'#fff',border:`1px solid ${c}22`,borderRadius:8,padding:'10px 14px',borderLeft:`3px solid ${c}`,textAlign:'center'}}>
              <div style={{fontSize:10,color:'#888'}}>{l}</div>
              <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results Table */}
      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
        {loading?<div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading results...</div>:
        ranks.length===0?
          <div style={{padding:60,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>🏆</div>
            <div style={{fontSize:14,color:'#888'}}>Select Exam + Class + Section to view results</div>
          </div>:
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr style={{background:'#1A5276',color:'#fff'}}>
              {['Rank','Roll No','Student Name','Total Marks','%','Grade','Result'].map(h=>(
                <th key={h} style={{padding:'9px 12px',textAlign:'center',fontSize:11,fontWeight:600}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranks.map((r,i)=>{
              const c=getColor(parseFloat(r.pct||0))
              return(
                <tr key={r.id} style={{background:r.rank===1?'#FEF9E7':r.rank===2?'#F5F5F5':r.rank===3?'#FDF2E9':i%2===0?'#fff':'#F0F7FF',
                  borderBottom:'1px solid #E8EEF8'}}>
                  <td style={{padding:'9px 12px',textAlign:'center',fontWeight:800,
                    color:r.rank===1?'#B8860B':r.rank===2?'#888':r.rank===3?'#CD7F32':'#555',fontSize:15}}>
                    {r.rank===1?'🥇':r.rank===2?'🥈':r.rank===3?'🥉':r.rank}
                  </td>
                  <td style={{padding:'9px 12px',textAlign:'center',color:'#888'}}>{r.rollNo||'—'}</td>
                  <td style={{padding:'9px 12px',fontWeight:700}}>{r.name}</td>
                  <td style={{padding:'9px 12px',textAlign:'center',fontWeight:700}}>{r.absent?'AB':`${r.total}/${r.max}`}</td>
                  <td style={{padding:'9px 12px',textAlign:'center',fontWeight:700,color:c}}>{r.absent?'AB':`${r.pct}%`}</td>
                  <td style={{padding:'9px 12px',textAlign:'center'}}>
                    <span style={{fontWeight:800,fontSize:16,color:c}}>{r.absent?'AB':r.grade}</span>
                  </td>
                  <td style={{padding:'9px 12px',textAlign:'center'}}>
                    <span style={{padding:'3px 12px',borderRadius:10,fontSize:10,fontWeight:700,
                      background:r.absent?'#F5F5F5':r.passed?'#E8F5E9':'#FDEDEC',
                      color:r.absent?'#666':r.passed?'#1E8449':'#C0392B'}}>
                      {r.absent?'ABSENT':r.passed?'PASS':'FAIL'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>}
      </div>
    </div>
  )
}
