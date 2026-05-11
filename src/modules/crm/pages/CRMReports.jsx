import React, { useState, useEffect } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

export default function CRMReports() {
  const [leads,   setLeads]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE_URL}/crm/leads`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setLeads(Array.isArray(d.data)?d.data:Array.isArray(d)?d:[]))
      .catch(()=>setLeads([])).finally(()=>setLoading(false))
  }, [])

  const won   = leads.filter(l=>l.stage==='WON')
  const lost  = leads.filter(l=>l.stage==='LOST')
  const total = leads.length
  const winRate  = total>0?Math.round(won.length/total*100):0
  const wonVal   = won.reduce((a,l)=>a+parseFloat(l.dealValue||0),0)
  const lostVal  = lost.reduce((a,l)=>a+parseFloat(l.dealValue||0),0)

  // Source analysis
  const bySource = {}
  leads.forEach(l=>{ if(!bySource[l.source||'Unknown']) bySource[l.source||'Unknown']={count:0,won:0,val:0}; bySource[l.source||'Unknown'].count++; if(l.stage==='WON'){bySource[l.source||'Unknown'].won++;bySource[l.source||'Unknown'].val+=parseFloat(l.dealValue||0)} })
  const sourceRows = Object.entries(bySource).map(([s,d])=>({source:s,...d,rate:Math.round(d.won/d.count*100)})).sort((a,b)=>b.val-a.val)

  return (
    <div>
      <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67',marginBottom:16}}>
        CRM Reports — Win/Loss Analysis
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          {label:'Total Leads',   val:total,       sub:'All time',    color:'#714B67',bg:'#EDE0EA'},
          {label:'Won',           val:won.length,  sub:INR(wonVal),   color:'#155724',bg:'#D4EDDA'},
          {label:'Lost',          val:lost.length, sub:INR(lostVal),  color:'#721C24',bg:'#F8D7DA'},
          {label:'Win Rate',      val:winRate+'%', sub:`${won.length}/${total} leads`,color:'#856404',bg:'#FFF3CD'},
        ].map(k=>(
          <div key={k.label} style={{background:k.bg,border:`1px solid ${k.color}22`,borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:11,fontWeight:700,color:k.color,textTransform:'uppercase',marginBottom:6}}>{k.label}</div>
            <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:22,color:k.color}}>{k.val}</div>
            <div style={{fontSize:11,color:'#6C757D',marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Win Rate visual */}
      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,padding:20,marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14,color:'#714B67',marginBottom:12}}>Win vs Loss</div>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <div style={{flex:1,height:24,borderRadius:12,overflow:'hidden',background:'#F8D7DA',display:'flex'}}>
            <div style={{width:`${winRate}%`,background:'#155724',borderRadius:'12px 0 0 12px',
              display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700,transition:'width .5s'}}>
              {winRate>10?winRate+'%':''}
            </div>
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#721C24',fontSize:11,fontWeight:700}}>
              {(100-winRate)>10?(100-winRate)+'%':''}
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:16,fontSize:12}}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#155724',display:'inline-block'}}></span>Won {won.length}</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#F8D7DA',border:'1px solid #DC3545',display:'inline-block'}}></span>Lost {lost.length}</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#FFF3CD',border:'1px solid #FFC107',display:'inline-block'}}></span>Active {total-won.length-lost.length}</span>
        </div>
      </div>

      {/* Source analysis */}
      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,padding:20}}>
        <div style={{fontWeight:700,fontSize:14,color:'#714B67',marginBottom:12}}>Leads by Source</div>
        {loading ? <div style={{color:'#6C757D',fontSize:12}}>Loading...</div> : (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#F8F4F8'}}>
                {['Source','Leads','Won','Win Rate','Won Value'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:h==='Won Value'?'right':'left',fontWeight:700,fontSize:11,color:'#714B67'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sourceRows.map((r,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #F0EEEB'}}>
                  <td style={{padding:'9px 12px',fontWeight:600}}>{r.source}</td>
                  <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace'}}>{r.count}</td>
                  <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',color:'#155724',fontWeight:700}}>{r.won}</td>
                  <td style={{padding:'9px 12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,background:'#F0EEEB',borderRadius:3,height:6,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${r.rate}%`,background:r.rate>=50?'#155724':r.rate>=25?'#856404':'#DC3545',borderRadius:3}}/>
                      </div>
                      <span style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:700,minWidth:30,
                        color:r.rate>=50?'#155724':r.rate>=25?'#856404':'#DC3545'}}>{r.rate}%</span>
                    </div>
                  </td>
                  <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>{r.val>0?INR(r.val):'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
