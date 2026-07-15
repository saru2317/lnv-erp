import React,{useState,useEffect}from 'react'
import toast from 'react-hot-toast'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'
const inp={padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}
const lbl={fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}

const STATUS_CLR={UPCOMING:{bg:'#EBF5FB',color:'#1A5276'},ONGOING:{bg:'#E8F5E9',color:'#1E8449'},COMPLETED:{bg:'#F5F5F5',color:'#666'},RESULT_PUBLISHED:{bg:'#F0EBF0',color:'#714B67'}}
const TYPE_CLR={INTERNAL:{bg:'#FEF9E7',color:'#B8860B'},BOARD:{bg:'#FDEDEC',color:'#C0392B'},ENTRANCE:{bg:'#EBF5FB',color:'#1A5276'}}

export default function ExamMaster(){
  const [instId,setInstId]=useState(localStorage.getItem('lnv_edu_inst')||'')
  const [exams,setExams]=useState([])
  const [loading,setLoading]=useState(true)
  const [showAdd,setShowAdd]=useState(false)
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({examName:'',examCode:'',term:'1',examType:'INTERNAL',startDate:'',endDate:'',resultDate:''})
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    const onStorage=()=>setInstId(localStorage.getItem('lnv_edu_inst')||'')
    window.addEventListener('storage',onStorage)
    return ()=>window.removeEventListener('storage',onStorage)
  },[])

  const load=async()=>{
    setLoading(true)
    const r=await fetch(`${BASE}/edu/exams?institutionId=${instId}`,{headers:hdr2()})
    const d=await r.json();setExams(d.data||[]);setLoading(false)
  }
  useEffect(()=>{load()},[instId])

  const save=async()=>{
    if(!form.examName.trim())return toast.error('Exam name required')
    if(!form.examCode.trim())return toast.error('Exam code required')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/edu/exams`,{method:'POST',headers:hdr(),body:JSON.stringify({...form,term:parseInt(form.term||1),institutionId:instId})})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`✅ ${d.data.examName} created!`)
      setShowAdd(false);setForm({examName:'',examCode:'',term:'1',examType:'INTERNAL',startDate:'',endDate:'',resultDate:''});load()
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  const updateStatus=async(id,status)=>{
    await fetch(`${BASE}/edu/exams/${id}`,{method:'PATCH',headers:hdr(),body:JSON.stringify({status})})
    toast.success(`Status updated to ${status}`);load()
  }

  return(
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📝 Exam Master</div>
          <div style={{fontSize:11,color:'#888'}}>{exams.length} exams configured</div>
        </div>
        <button onClick={()=>setShowAdd(true)}
          style={{padding:'7px 18px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
          + New Exam
        </button>
      </div>

      {loading?<div style={{textAlign:'center',padding:40,color:'#aaa'}}>⏳ Loading...</div>:
      exams.length===0?
        <div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
          <div style={{fontSize:48,marginBottom:12}}>📝</div>
          <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No Exams Configured</div>
          <button onClick={()=>setShowAdd(true)} style={{padding:'9px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>+ Create Exam</button>
        </div>:
      <div style={{display:'grid',gap:10}}>
        {exams.map(e=>{
          const sc=STATUS_CLR[e.status]||STATUS_CLR.UPCOMING
          const tc=TYPE_CLR[e.examType]||TYPE_CLR.INTERNAL
          return(
            <div key={e.id} style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,
              display:'grid',gridTemplateColumns:'1fr auto',gap:16,alignItems:'center'}}>
              <div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
                  <span style={{fontSize:15,fontWeight:700,color:'#333'}}>{e.examName}</span>
                  <span style={{fontFamily:'monospace',fontSize:10,color:'#aaa'}}>{e.examCode}</span>
                  <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:tc.bg,color:tc.color}}>{e.examType}</span>
                  <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:sc.bg,color:sc.color}}>{e.status}</span>
                </div>
                <div style={{display:'flex',gap:16,fontSize:12,color:'#555'}}>
                  <span>📅 Term {e.term}</span>
                  {e.startDate&&<span>Start: {fmtD(e.startDate)}</span>}
                  {e.endDate&&<span>End: {fmtD(e.endDate)}</span>}
                  {e.resultDate&&<span>Result: {fmtD(e.resultDate)}</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:6}}>
                {e.status==='UPCOMING'&&<button onClick={()=>updateStatus(e.id,'ONGOING')}
                  style={{padding:'5px 12px',background:'#E8F5E9',color:'#1E8449',border:'none',borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:700}}>▶ Start</button>}
                {e.status==='ONGOING'&&<button onClick={()=>updateStatus(e.id,'COMPLETED')}
                  style={{padding:'5px 12px',background:'#EBF5FB',color:'#1A5276',border:'none',borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:700}}>✅ Complete</button>}
                {e.status==='COMPLETED'&&<button onClick={()=>updateStatus(e.id,'RESULT_PUBLISHED')}
                  style={{padding:'5px 12px',background:'#F0EBF0',color:'#714B67',border:'none',borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:700}}>📢 Publish</button>}
              </div>
            </div>
          )
        })}
      </div>}

      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:500,boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'#6E2C00',marginBottom:18}}>📝 New Exam</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Exam Name *</label>
                <input defaultValue={form.examName} onBlur={e=>set('examName',e.target.value)} placeholder='e.g. Unit Test 1' style={{...inp,fontSize:14}}/></div>
              <div><label style={lbl}>Exam Code *</label>
                <input defaultValue={form.examCode} onBlur={e=>set('examCode',e.target.value)} placeholder='UT1-2526' style={inp}/></div>
              <div><label style={lbl}>Term</label>
                <select value={form.term} onChange={e=>set('term',e.target.value)} style={inp}>
                  <option value='1'>Term 1</option><option value='2'>Term 2</option><option value='3'>Term 3</option>
                </select></div>
              <div><label style={lbl}>Exam Type</label>
                <select value={form.examType} onChange={e=>set('examType',e.target.value)} style={inp}>
                  <option value='INTERNAL'>Internal</option><option value='BOARD'>Board</option><option value='ENTRANCE'>Entrance</option>
                </select></div>
              <div><label style={lbl}>Start Date</label><input type='date' value={form.startDate} onChange={e=>set('startDate',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>End Date</label><input type='date' value={form.endDate} onChange={e=>set('endDate',e.target.value)} style={inp}/></div>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Result Date</label><input type='date' value={form.resultDate} onChange={e=>set('resultDate',e.target.value)} style={inp}/></div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
              <button onClick={()=>setShowAdd(false)} style={{padding:'7px 16px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={save} disabled={saving} style={{padding:'7px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                {saving?'⏳...':'💾 Create Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
