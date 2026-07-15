import React,{useState,useEffect}from 'react'
import toast from 'react-hot-toast'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'
const inp={padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}
const lbl={fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}

const TYPE_COLORS={
  GENERAL:  {bg:'#EBF5FB',color:'#1A5276',icon:'📢'},
  EXAM:     {bg:'#FDEDEC',color:'#C0392B',icon:'📝'},
  FEE:      {bg:'#FEF9E7',color:'#B8860B',icon:'💰'},
  HOLIDAY:  {bg:'#E8F5E9',color:'#1E8449',icon:'🎉'},
  URGENT:   {bg:'#FDEDEC',color:'#C0392B',icon:'🚨'},
  TRANSPORT:{bg:'#E8F8F5',color:'#117A65',icon:'🚌'},
}

export default function NoticeBoard(){
  const [instId,setInstId]=useState(localStorage.getItem('lnv_edu_inst')||'')
  const [notices,setNotices]=useState([])
  const [loading,setLoading]=useState(true)
  const [showAdd,setShowAdd]=useState(false)
  const [saving,setSaving]=useState(false)
  const [filter,setFilter]=useState('')
  const [form,setForm]=useState({title:'',content:'',type:'GENERAL',targetAudience:'ALL',sendSMS:false,sendWhatsApp:false})
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    const onStorage=()=>setInstId(localStorage.getItem('lnv_edu_inst')||'')
    window.addEventListener('storage',onStorage)
    return ()=>window.removeEventListener('storage',onStorage)
  },[])

  const load=async()=>{
    setLoading(true)
    const r=await fetch(`${BASE}/edu/notices?institutionId=${instId}`,{headers:hdr2()})
    const d=await r.json()
    setNotices(d.data||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[instId])

  const save=async()=>{
    if(!form.title.trim())return toast.error('Title required')
    if(!form.content.trim())return toast.error('Content required')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/edu/notices`,{method:'POST',headers:hdr(),body:JSON.stringify({...form,institutionId:instId})})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`✅ Notice published!${form.sendSMS?' SMS sending...':''}${form.sendWhatsApp?' WhatsApp sending...':''}`)
      setShowAdd(false);setForm({title:'',content:'',type:'GENERAL',targetAudience:'ALL',sendSMS:false,sendWhatsApp:false});load()
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  const filtered=filter?notices.filter(n=>n.type===filter):notices

  return(
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📢 Notice Board</div>
          <div style={{fontSize:11,color:'#888'}}>{notices.length} notices published</div>
        </div>
        <button onClick={()=>setShowAdd(true)}
          style={{padding:'7px 18px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
          + New Notice
        </button>
      </div>

      {/* Filter */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        {['','GENERAL','EXAM','FEE','HOLIDAY','URGENT','TRANSPORT'].map(t=>{
          const tc=TYPE_COLORS[t]||{bg:'#F5F5F5',color:'#555',icon:'📋'}
          return(
            <button key={t} onClick={()=>setFilter(t)}
              style={{padding:'5px 14px',border:'none',borderRadius:20,cursor:'pointer',fontSize:11,fontWeight:700,
                background:filter===t?(tc.color||'#6E2C00'):(tc.bg||'#F5F5F5'),
                color:filter===t?'#fff':(tc.color||'#555')}}>
              {t?(tc.icon+' '+t):'All Notices'}
            </button>
          )
        })}
      </div>

      {loading?<div style={{textAlign:'center',padding:40,color:'#aaa'}}>⏳ Loading...</div>:
      filtered.length===0?
        <div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
          <div style={{fontSize:48,marginBottom:12}}>📢</div>
          <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No Notices</div>
          <button onClick={()=>setShowAdd(true)} style={{padding:'9px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>+ Publish Notice</button>
        </div>:
      <div style={{display:'grid',gap:12}}>
        {filtered.map(n=>{
          const tc=TYPE_COLORS[n.type]||TYPE_COLORS.GENERAL
          return(
            <div key={n.id} style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,
              borderLeft:`4px solid ${tc.color}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <span style={{fontSize:20}}>{tc.icon}</span>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:'#333'}}>{n.title}</div>
                    <div style={{fontSize:11,color:'#888',marginTop:2}}>
                      {fmtD(n.publishDate)} · For: {n.targetAudience}
                      {n.sendSMS&&' · SMS ✅'}
                      {n.sendWhatsApp&&' · WhatsApp ✅'}
                    </div>
                  </div>
                </div>
                <span style={{padding:'3px 10px',borderRadius:10,fontSize:10,fontWeight:700,background:tc.bg,color:tc.color,flexShrink:0}}>
                  {n.type}
                </span>
              </div>
              <div style={{fontSize:13,color:'#555',lineHeight:1.6}}>{n.content}</div>
            </div>
          )
        })}
      </div>}

      {/* Add Notice Modal */}
      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:580,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'#6E2C00',marginBottom:18}}>📢 Publish New Notice</div>
            <div style={{display:'grid',gap:14}}>
              <div><label style={lbl}>Title *</label>
                <input defaultValue={form.title} onBlur={e=>set('title',e.target.value)} placeholder='Notice title' style={{...inp,fontSize:14}}/></div>
              <div><label style={lbl}>Content *</label>
                <textarea defaultValue={form.content} onBlur={e=>set('content',e.target.value)}
                  placeholder='Notice content...' rows={4} style={{...inp,resize:'none'}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={lbl}>Notice Type</label>
                  <select value={form.type} onChange={e=>set('type',e.target.value)} style={inp}>
                    {Object.keys(TYPE_COLORS).map(t=><option key={t}>{t}</option>)}
                  </select></div>
                <div><label style={lbl}>Target Audience</label>
                  <select value={form.targetAudience} onChange={e=>set('targetAudience',e.target.value)} style={inp}>
                    <option value='ALL'>All</option>
                    <option value='PARENTS'>Parents Only</option>
                    <option value='STAFF'>Staff Only</option>
                    <option value='STUDENTS'>Students Only</option>
                  </select></div>
              </div>
              {/* Send Options */}
              <div style={{background:'#E8F5E9',borderRadius:8,padding:14}}>
                <div style={{fontSize:12,fontWeight:700,color:'#1E8449',marginBottom:10}}>📱 Send Notification</div>
                <div style={{display:'flex',gap:20}}>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
                    <input type='checkbox' checked={form.sendSMS} onChange={e=>set('sendSMS',e.target.checked)} style={{accentColor:'#6E2C00'}}/>
                    📱 Send SMS to Parents
                  </label>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
                    <input type='checkbox' checked={form.sendWhatsApp} onChange={e=>set('sendWhatsApp',e.target.checked)} style={{accentColor:'#25D366'}}/>
                    💬 Send WhatsApp
                  </label>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
              <button onClick={()=>setShowAdd(false)} style={{padding:'7px 16px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={save} disabled={saving} style={{padding:'7px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                {saving?'⏳...':'📢 Publish Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
