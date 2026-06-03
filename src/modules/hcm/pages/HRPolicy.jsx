import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })
const fmtD = s  => s ? new Date(s).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

export default function HRPolicy() {
  const [policies, setPolicies] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch(`${BASE}/hr-policy`, { headers: hdr2() })
      .then(r=>r.json())
      .then(d=>setPolicies(d.data||[]))
      .catch(()=>toast.error('Failed to load policies'))
      .finally(()=>setLoading(false))
  }, [])

  return (
    <div>
      <div className="hcm-pg-hdr">
        <div>
          <h2 className="hcm-pg-title">HR Policies</h2>
          <p className="hcm-pg-sub">Company HR policies & compliance documents</p>
        </div>
      </div>
      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div>
      ) : policies.length === 0 ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>
          <div style={{fontSize:40,marginBottom:8}}>📄</div>
          No HR policies found. Create them from HR Policy Master.
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
          {policies.map(p=>(
            <div key={p.id} style={{background:'#fff',borderRadius:8,
              border:'1.5px solid #E0D5E0',padding:'16px 18px'}}>
              <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:4}}>{p.title||p.name}</div>
              <div style={{fontSize:11,color:'#6C757D',marginBottom:8}}>{p.category||p.type||'General'} · Effective: {fmtD(p.effectiveFrom||p.createdAt)}</div>
              <div style={{fontSize:12,color:'#495057',lineHeight:1.6}}>
                {(p.description||'').slice(0,120)}{p.description?.length>120?'...':''}
              </div>
              {p.status && (
                <span style={{marginTop:8,display:'inline-block',padding:'2px 8px',
                  borderRadius:10,fontSize:10,fontWeight:700,
                  background:p.status==='ACTIVE'?'#D4EDDA':'#FFF3CD',
                  color:p.status==='ACTIVE'?'#155724':'#856404'}}>
                  {p.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
