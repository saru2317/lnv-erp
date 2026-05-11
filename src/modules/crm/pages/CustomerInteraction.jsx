import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

export default function CustomerInteraction() {
  const navigate  = useNavigate()
  const [acts,    setActs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    fetch(`${BASE_URL}/crm/interactions`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setActs(Array.isArray(d.data)?d.data:Array.isArray(d)?d:[]))
      .catch(()=>setActs([])).finally(()=>setLoading(false))
  }, [])

  const filtered = acts.filter(a =>
    !search || a.leadName?.toLowerCase().includes(search.toLowerCase()) ||
    a.subject?.toLowerCase().includes(search.toLowerCase())
  )

  const ICONS = { call:'\uD83D\uDCDE', email:'\uD83D\uDCE7', meeting:'\uD83E\uDD1D', note:'\uD83D\uDCDD', task:'\u2705' }
  const COLORS= { call:'#0C5460', email:'#856404', meeting:'#714B67', note:'#6C757D', task:'#155724' }

  return (
    <div>
      <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67',marginBottom:14}}>
        Customer Interactions
        <small style={{fontSize:12,fontWeight:400,color:'#6C757D',marginLeft:8}}>{filtered.length} interactions</small>
      </div>

      <div style={{marginBottom:12}}>
        <input placeholder="Search by customer or subject..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{padding:'7px 12px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none',width:300}}/>
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div>
      : filtered.length===0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          <div style={{fontSize:28,marginBottom:8}}>\uD83E\uDD1D</div>
          <div style={{fontWeight:700}}>No interactions yet</div>
          <div style={{fontSize:12,marginTop:4}}>Log activities from each lead to see them here</div>
        </div>
      ) : (
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
                {['Type','Customer/Lead','Subject','Notes','Date',''].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:700,fontSize:11,color:'#714B67'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a,i)=>{
                const c = COLORS[a.type]||'#6C757D'
                return (
                  <tr key={i} style={{borderBottom:'1px solid #F0EEEB',cursor:'pointer',background:i%2===0?'#fff':'#FAFAFA'}}
                    onClick={()=>a.leadId&&navigate('/crm/leads/'+a.leadId)}
                    onMouseOver={e=>e.currentTarget.style.background='#F8F4F8'}
                    onMouseOut={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{fontSize:16}}>{ICONS[a.type]||'\uD83D\uDCCC'}</span>
                      <span style={{fontSize:11,marginLeft:4,color:c,fontWeight:600}}>{a.type}</span>
                    </td>
                    <td style={{padding:'9px 12px',fontWeight:600}}>{a.leadName||'—'}</td>
                    <td style={{padding:'9px 12px',fontSize:12}}>{a.subject}</td>
                    <td style={{padding:'9px 12px',fontSize:11,color:'#6C757D',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {a.notes||'—'}
                    </td>
                    <td style={{padding:'9px 12px',fontSize:11,color:'#6C757D',whiteSpace:'nowrap'}}>
                      {a.createdAt?new Date(a.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}):'—'}
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      {a.leadId&&<button onClick={()=>navigate('/crm/leads/'+a.leadId)}
                        style={{padding:'3px 10px',background:'#EDE0EA',color:'#714B67',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:600}}>
                        View Lead
                      </button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
