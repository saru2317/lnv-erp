import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const TYPES = [
  { value:'call',    label:'Call',    icon:'\uD83D\uDCDE', color:'#0C5460' },
  { value:'email',   label:'Email',   icon:'\uD83D\uDCE7', color:'#856404' },
  { value:'meeting', label:'Meeting', icon:'\uD83E\uDD1D', color:'#714B67' },
  { value:'note',    label:'Note',    icon:'\uD83D\uDCDD', color:'#6C757D' },
  { value:'task',    label:'Task',    icon:'\u2705',        color:'#155724' },
]

export default function ActivityLog() {
  const navigate = useNavigate()
  const [acts,    setActs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [typeF,   setTypeF]   = useState('')

  useEffect(() => {
    fetch(`${BASE_URL}/crm/activities`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setActs(Array.isArray(d.data)?d.data:Array.isArray(d)?d:[]))
      .catch(()=>setActs([])).finally(()=>setLoading(false))
  }, [])

  const filtered = typeF ? acts.filter(a=>a.type===typeF) : acts

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
          Activity Log <small style={{fontSize:12,fontWeight:400,color:'#6C757D',marginLeft:8}}>{filtered.length} activities</small>
        </div>
      </div>

      {/* Type filter */}
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <button onClick={()=>setTypeF('')} style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
          border:'1px solid #E0D5E0',background:typeF===''?'#714B67':'#fff',color:typeF===''?'#fff':'#6C757D'}}>
          All ({acts.length})
        </button>
        {TYPES.map(t=>(
          <button key={t.value} onClick={()=>setTypeF(typeF===t.value?'':t.value)} style={{
            padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
            border:`1px solid ${typeF===t.value?t.color:'#E0D5E0'}`,
            background:typeF===t.value?t.color:'#fff',
            color:typeF===t.value?'#fff':t.color}}>
            {t.icon} {t.label} ({acts.filter(a=>a.type===t.value).length})
          </button>
        ))}
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading activities...</div>
      : filtered.length===0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          <div style={{fontSize:28,marginBottom:8}}>\uD83D\uDCC5</div>
          <div style={{fontWeight:700}}>No activities logged</div>
          <div style={{fontSize:12,marginTop:4}}>Log calls and meetings from each lead</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {filtered.map((a,i)=>{
            const t = TYPES.find(x=>x.value===a.type)||TYPES[0]
            return (
              <div key={i} style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,
                padding:14,display:'flex',gap:12,alignItems:'flex-start',
                borderLeft:`4px solid ${t.color}`,cursor:'pointer'}}
                onClick={()=>a.leadId&&navigate('/crm/leads/'+a.leadId)}
                onMouseOver={e=>e.currentTarget.style.background='#F8F4F8'}
                onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                <span style={{fontSize:20,flexShrink:0}}>{t.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13}}>{a.subject}</div>
                      <div style={{fontSize:11,color:t.color,fontWeight:600,marginTop:2}}>{a.leadName||'—'}</div>
                    </div>
                    <div style={{fontSize:11,color:'#6C757D',textAlign:'right'}}>
                      {a.createdAt?new Date(a.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}):''}
                    </div>
                  </div>
                  {a.notes&&<div style={{fontSize:12,color:'#495057',marginTop:6,padding:'6px 10px',background:'#F8F9FA',borderRadius:5}}>{a.notes}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
