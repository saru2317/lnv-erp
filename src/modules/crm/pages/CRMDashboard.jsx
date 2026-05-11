import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const STAGES = [
  { key:'NEW',         label:'New Leads',     color:'#6C757D', icon:'\uD83D\uDCCC' },
  { key:'CONTACTED',   label:'Contacted',     color:'#004085', icon:'\uD83D\uDCDE' },
  { key:'QUALIFIED',   label:'Qualified',     color:'#856404', icon:'\u2714\uFE0F'  },
  { key:'PROPOSAL',    label:'Proposal Sent', color:'#4B2E83', icon:'\uD83D\uDCCB' },
  { key:'NEGOTIATION', label:'Negotiation',   color:'#0C5460', icon:'\uD83E\uDD1D' },
  { key:'WON',         label:'Won',           color:'#155724', icon:'\uD83C\uDFC6' },
  { key:'LOST',        label:'Lost',          color:'#721C24', icon:'\u274C'        },
]

export default function CRMDashboard() {
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE_URL}/crm/dashboard`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setData(d.data||d)).catch(()=>{})
      .finally(()=>setLoading(false))
  }, [])

  const leads  = data?.leads  || []
  const stages = STAGES.map(s => ({ ...s, count: leads.filter(l=>l.stage===s.key).length, value: leads.filter(l=>l.stage===s.key).reduce((a,l)=>a+parseFloat(l.dealValue||0),0) }))
  const total  = leads.length
  const wonVal = stages.find(s=>s.key==='WON')?.value||0
  const pipeline = stages.filter(s=>!['WON','LOST'].includes(s.key)).reduce((a,s)=>a+s.value,0)
  const winRate  = total>0 ? Math.round((stages.find(s=>s.key==='WON')?.count||0)/total*100) : 0

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:20,color:'#714B67'}}>
          CRM Dashboard
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>navigate('/crm/leads/new')}
            style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            + New Lead
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          {label:'Total Leads',    val:total,        sub:'All time',          color:'#714B67', bg:'#EDE0EA'},
          {label:'Pipeline Value', val:INR(pipeline),sub:'Active deals',      color:'#0C5460', bg:'#D1ECF1'},
          {label:'Won Value',      val:INR(wonVal),  sub:'Closed deals',      color:'#155724', bg:'#D4EDDA'},
          {label:'Win Rate',       val:winRate+'%',  sub:`${total} total leads`,color:'#856404',bg:'#FFF3CD'},
        ].map(k=>(
          <div key={k.label} style={{background:k.bg,border:`1px solid ${k.color}22`,borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:11,fontWeight:700,color:k.color,textTransform:'uppercase',marginBottom:6}}>{k.label}</div>
            <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:22,color:k.color}}>{k.val}</div>
            <div style={{fontSize:11,color:'#6C757D',marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Pipeline funnel */}
      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,padding:20,marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14,color:'#714B67',marginBottom:14}}>Sales Pipeline</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
          {stages.map((s,i)=>{
            const maxCount = Math.max(...stages.map(x=>x.count),1)
            const height   = Math.max(40, Math.round((s.count/maxCount)*120))
            return (
              <div key={s.key} onClick={()=>navigate(`/crm/leads?stage=${s.key}`)}
                style={{textAlign:'center',cursor:'pointer'}}
                onMouseOver={e=>e.currentTarget.style.opacity='.8'}
                onMouseOut={e=>e.currentTarget.style.opacity='1'}>
                <div style={{fontSize:11,fontWeight:700,color:s.color,marginBottom:6}}>{s.count}</div>
                <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',height:130}}>
                  <div style={{width:'80%',height,background:s.color,borderRadius:'4px 4px 0 0',
                    transition:'height .3s', opacity:s.key==='LOST'?0.4:1}}/>
                </div>
                <div style={{fontSize:11,color:'#6C757D',marginTop:6,fontWeight:600}}>{s.label}</div>
                {s.value>0&&<div style={{fontSize:10,color:s.color,fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(s.value)}</div>}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {/* Recent leads */}
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #E0D5E0',display:'flex',justifyContent:'space-between'}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67'}}>Recent Leads</div>
            <button onClick={()=>navigate('/crm/leads')}
              style={{fontSize:11,color:'#714B67',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>View All</button>
          </div>
          {leads.slice(0,6).map((l,i)=>{
            const s = STAGES.find(x=>x.key===l.stage)||STAGES[0]
            return (
              <div key={l.id||i} onClick={()=>navigate('/crm/leads/'+l.id)}
                style={{padding:'10px 16px',borderBottom:'1px solid #F0EEEB',cursor:'pointer',
                  display:'flex',justifyContent:'space-between',alignItems:'center'}}
                onMouseOver={e=>e.currentTarget.style.background='#F8F4F8'}
                onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                <div>
                  <div style={{fontWeight:600,fontSize:12}}>{l.company||l.name}</div>
                  <div style={{fontSize:11,color:'#6C757D'}}>{l.contactName} · {l.source}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:s.color+'22',color:s.color}}>{s.label}</span>
                  {l.dealValue>0&&<div style={{fontSize:11,fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724',marginTop:2}}>{INR(l.dealValue)}</div>}
                </div>
              </div>
            )
          })}
          {leads.length===0&&<div style={{padding:30,textAlign:'center',color:'#6C757D',fontSize:12}}>No leads yet</div>}
        </div>

        {/* Today's activities */}
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #E0D5E0',display:'flex',justifyContent:'space-between'}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67'}}>Today's Activities</div>
            <button onClick={()=>navigate('/crm/activities')}
              style={{fontSize:11,color:'#714B67',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>View All</button>
          </div>
          {(data?.todayActivities||[]).slice(0,6).map((a,i)=>(
            <div key={i} style={{padding:'10px 16px',borderBottom:'1px solid #F0EEEB',display:'flex',gap:10,alignItems:'flex-start'}}>
              <span style={{fontSize:16}}>{a.type==='call'?'\uD83D\uDCDE':a.type==='meeting'?'\uD83E\uDD1D':a.type==='email'?'\uD83D\uDCE7':'\uD83D\uDCC5'}</span>
              <div>
                <div style={{fontSize:12,fontWeight:600}}>{a.subject}</div>
                <div style={{fontSize:11,color:'#6C757D'}}>{a.leadName} · {a.time}</div>
              </div>
            </div>
          ))}
          {!(data?.todayActivities?.length)&&(
            <div style={{padding:30,textAlign:'center',color:'#6C757D',fontSize:12}}>
              No activities today<br/>
              <button onClick={()=>navigate('/crm/activities')}
                style={{marginTop:8,padding:'5px 14px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>
                + Schedule Activity
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
