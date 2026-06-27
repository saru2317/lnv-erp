import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'
const inp={padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}
const lbl={fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}

export default function AcademicYear(){
  const [years,setYears]=useState([])
  const [loading,setLoading]=useState(true)
  const [showAdd,setShowAdd]=useState(false)
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({yearCode:'',startDate:'',endDate:'',terms:'3',isCurrent:false})
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const instId=localStorage.getItem('lnv_edu_inst')||''

  const load=async()=>{
    setLoading(true)
    const r=await fetch(`${BASE}/edu/academic-years?institutionId=${instId}`,{headers:hdr2()})
    const d=await r.json()
    setYears(d.data||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  const save=async()=>{
    if(!form.yearCode.trim())return toast.error('Year code required')
    if(!form.startDate)return toast.error('Start date required')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/edu/academic-years`,{method:'POST',headers:hdr(),
        body:JSON.stringify({...form,institutionId:parseInt(instId),terms:parseInt(form.terms||3)})})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`✅ ${d.data.yearCode} created!`)
      setShowAdd(false);setForm({yearCode:'',startDate:'',endDate:'',terms:'3',isCurrent:false});load()
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  const setCurrent=async(id)=>{
    await fetch(`${BASE}/edu/academic-years/${id}/set-current`,{method:'PATCH',headers:hdr()})
    toast.success('✅ Set as current year!');load()
  }

  return(
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📅 Academic Year</div>
          <div style={{fontSize:11,color:'#888'}}>{years.length} years configured</div>
        </div>
        <button onClick={()=>setShowAdd(true)}
          style={{padding:'7px 18px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
          + New Year
        </button>
      </div>

      {loading?<div style={{textAlign:'center',padding:40,color:'#aaa'}}>⏳ Loading...</div>:
      years.length===0?
        <div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
          <div style={{fontSize:48,marginBottom:12}}>📅</div>
          <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No Academic Years</div>
          <div style={{fontSize:12,color:'#888',marginBottom:16}}>Run seedEdu.js or create manually</div>
          <button onClick={()=>setShowAdd(true)} style={{padding:'9px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>+ Create Year</button>
        </div>:
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
        {years.map(y=>(
          <div key={y.id} style={{background:'#fff',border:`2px solid ${y.isCurrent?'#1E8449':'#E8E0E8'}`,borderRadius:10,overflow:'hidden'}}>
            <div style={{background:y.isCurrent?'linear-gradient(135deg,#1E8449,#27AE60)':'#F8F5F8',padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:22,fontWeight:800,color:y.isCurrent?'#fff':'#6E2C00'}}>{y.yearCode}</div>
              {y.isCurrent&&<span style={{background:'rgba(255,255,255,.2)',color:'#fff',padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:700}}>CURRENT</span>}
            </div>
            <div style={{padding:16}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12,marginBottom:12}}>
                {[['Start',fmtD(y.startDate)],['End',fmtD(y.endDate)],['Terms',`${y.terms} Terms`]].map(([l,v])=>(
                  <div key={l}><div style={{color:'#888'}}>{l}</div><div style={{fontWeight:700}}>{v}</div></div>
                ))}
              </div>
              {!y.isCurrent&&<button onClick={()=>setCurrent(y.id)}
                style={{width:'100%',padding:'7px',background:'#FDF2E9',color:'#6E2C00',border:'1px solid #6E2C00',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
                Set as Current
              </button>}
            </div>
          </div>
        ))}
      </div>}

      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:440,boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'#6E2C00',marginBottom:18}}>📅 New Academic Year</div>
            <div style={{display:'grid',gap:14}}>
              <div><label style={lbl}>Year Code * (e.g. 2025-26)</label>
                <input defaultValue={form.yearCode} onBlur={e=>set('yearCode',e.target.value)} placeholder='2025-26' style={inp}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={lbl}>Start Date *</label><input type='date' value={form.startDate} onChange={e=>set('startDate',e.target.value)} style={inp}/></div>
                <div><label style={lbl}>End Date *</label><input type='date' value={form.endDate} onChange={e=>set('endDate',e.target.value)} style={inp}/></div>
              </div>
              <div><label style={lbl}>Terms</label>
                <select value={form.terms} onChange={e=>set('terms',e.target.value)} style={inp}>
                  <option value='2'>2 Terms (Semester)</option>
                  <option value='3'>3 Terms (School)</option>
                </select></div>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
                <input type='checkbox' checked={form.isCurrent} onChange={e=>set('isCurrent',e.target.checked)} style={{accentColor:'#6E2C00'}}/>
                Set as Current Year
              </label>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
              <button onClick={()=>setShowAdd(false)} style={{padding:'7px 16px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={save} disabled={saving} style={{padding:'7px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                {saving?'⏳...':'💾 Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
