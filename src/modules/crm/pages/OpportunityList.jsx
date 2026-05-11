// ══════════════════════════════════════════════════════════
// SAVE AS: OpportunityList.jsx  (Kanban pipeline view)
// ══════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const STAGES = [
  { key:'NEW',         label:'New',           color:'#6C757D', bg:'#F5F5F5' },
  { key:'CONTACTED',   label:'Contacted',     color:'#004085', bg:'#EBF3FB' },
  { key:'QUALIFIED',   label:'Qualified',     color:'#856404', bg:'#FFFBF0' },
  { key:'PROPOSAL',    label:'Proposal Sent', color:'#4B2E83', bg:'#F5F0FA' },
  { key:'NEGOTIATION', label:'Negotiation',   color:'#0C5460', bg:'#EDF7F8' },
  { key:'WON',         label:'Won',           color:'#155724', bg:'#F0FAF3' },
]

export default function OpportunityList() {
  const navigate = useNavigate()
  const [leads,   setLeads]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE_URL}/crm/leads`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setLeads(Array.isArray(d.data)?d.data:Array.isArray(d)?d:[]))
      .catch(()=>setLeads([])).finally(()=>setLoading(false))
  }, [])

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
          Sales Pipeline <small style={{fontSize:12,fontWeight:400,color:'#6C757D',marginLeft:8}}>Kanban View</small>
        </div>
        <button onClick={()=>navigate('/crm/leads/new')}
          style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
          + New Lead
        </button>
      </div>

      {/* Pipeline total */}
      <div style={{background:'#EDE0EA',borderRadius:8,padding:'10px 16px',marginBottom:14,
        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontWeight:700,color:'#714B67'}}>Total Pipeline Value</div>
        <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:20,color:'#714B67'}}>
          {INR(leads.filter(l=>!['LOST'].includes(l.stage)).reduce((a,l)=>a+parseFloat(l.dealValue||0),0))}
        </div>
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading pipeline...</div> : (
        /* Kanban columns */
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,overflowX:'auto'}}>
          {STAGES.map(s=>{
            const stageLeads = leads.filter(l=>l.stage===s.key)
            const stageVal   = stageLeads.reduce((a,l)=>a+parseFloat(l.dealValue||0),0)
            return (
              <div key={s.key} style={{minWidth:180}}>
                {/* Column header */}
                <div style={{background:s.color,borderRadius:'8px 8px 0 0',padding:'8px 12px',marginBottom:2}}>
                  <div style={{color:'#fff',fontWeight:700,fontSize:12}}>{s.label}</div>
                  <div style={{color:'rgba(255,255,255,.8)',fontSize:11}}>{stageLeads.length} leads · {INR(stageVal)}</div>
                </div>
                {/* Cards */}
                <div style={{background:s.bg,borderRadius:'0 0 8px 8px',minHeight:400,padding:8,
                  border:`1px solid ${s.color}22`,borderTop:'none'}}>
                  {stageLeads.map((l,i)=>(
                    <div key={l.id||i} onClick={()=>navigate('/crm/leads/'+l.id)}
                      style={{background:'#fff',border:`1px solid ${s.color}33`,borderRadius:8,
                        padding:10,marginBottom:8,cursor:'pointer',borderLeft:`3px solid ${s.color}`,
                        boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}
                      onMouseOver={e=>e.currentTarget.style.boxShadow='0 3px 12px rgba(0,0,0,.12)'}
                      onMouseOut={e=>e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'}>
                      <div style={{fontWeight:700,fontSize:12,marginBottom:3}}>{l.company||l.name}</div>
                      <div style={{fontSize:11,color:'#6C757D',marginBottom:4}}>{l.contactName||''}</div>
                      {l.dealValue>0&&(
                        <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:13,color:s.color}}>
                          {INR(l.dealValue)}
                        </div>
                      )}
                      {l.expectedCloseDate&&(
                        <div style={{fontSize:10,color:'#6C757D',marginTop:4}}>
                          Close: {new Date(l.expectedCloseDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                        </div>
                      )}
                    </div>
                  ))}
                  {stageLeads.length===0&&(
                    <div style={{textAlign:'center',color:`${s.color}66`,fontSize:11,padding:20}}>No leads</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
