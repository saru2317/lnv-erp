import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || '/api'
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const ROOM_ICONS = {
  LIVING:'🛋️', KITCHEN:'🍳', BEDROOM:'🛏️', STUDY:'📚', POOJA:'🪔',
  BATHROOM:'🚿', BALCONY:'🌇', OTHER:'🏠',
}

export default function PublicUnitStatus() {
  const { token } = useParams()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch(`${BASE}/civil/public/unit-status/${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d.data) })
      .catch(() => setError('Could not load status — check your connection'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Sans,sans-serif'}}>
      <div style={{color:'#888'}}>⏳ Loading your house status...</div>
    </div>
  )

  if (error) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      fontFamily:'DM Sans,sans-serif',padding:20,textAlign:'center'}}>
      <div>
        <div style={{fontSize:40,marginBottom:10}}>🔒</div>
        <div style={{fontSize:16,fontWeight:700,color:'#C0392B'}}>{error}</div>
        <div style={{fontSize:13,color:'#888',marginTop:8}}>Please contact your builder for a valid link.</div>
      </div>
    </div>
  )

  const p = data.progress
  const barColor = p>=90?'#1E8449':p>=50?'#B8860B':'#1A5276'

  return (
    <div style={{minHeight:'100vh',background:'#FAF8FA',fontFamily:'DM Sans,sans-serif',paddingBottom:30}}>
      {/* Header */}
      <div style={{background:'#6E2C00',color:'#fff',padding:'20px 16px',textAlign:'center'}}>
        <div style={{fontSize:12,opacity:0.8,marginBottom:4}}>{data.projectName} · {data.siteLocation}</div>
        <div style={{fontSize:22,fontWeight:800}}>🏠 {data.unitNo}</div>
        <div style={{fontSize:13,opacity:0.9}}>{data.unitType}{data.ownerName?` · ${data.ownerName}`:''}</div>
      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:16}}>
        {/* Overall progress */}
        <div style={{background:'#fff',borderRadius:12,padding:18,marginBottom:14,boxShadow:'0 1px 6px rgba(0,0,0,.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:'#333'}}>Construction Progress</div>
            <div style={{fontSize:22,fontWeight:900,color:barColor}}>{p}%</div>
          </div>
          <div style={{height:12,background:'#F0E8EC',borderRadius:6,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${Math.min(p,100)}%`,background:barColor,borderRadius:6,transition:'width .4s'}} />
          </div>
          <div style={{fontSize:11,color:'#888',marginTop:8,textTransform:'uppercase',fontWeight:700}}>Status: {data.status}</div>
        </div>

        {/* Room-wise breakdown */}
        {data.rooms?.length > 0 && (
          <div style={{background:'#fff',borderRadius:12,padding:18,marginBottom:14,boxShadow:'0 1px 6px rgba(0,0,0,.06)'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#333',marginBottom:12}}>Room-wise Progress</div>
            {data.rooms.map((r,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',
                borderBottom:i<data.rooms.length-1?'1px solid #F5F0F2':'none'}}>
                <div style={{fontSize:18}}>{ROOM_ICONS[r.roomType]||'🏠'}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600}}>{r.roomName}</div>
                  <div style={{height:6,background:'#F0E8EC',borderRadius:3,marginTop:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.min(r.progress,100)}%`,
                      background:r.progress>=90?'#1E8449':r.progress>=50?'#B8860B':'#1A5276',borderRadius:3}} />
                  </div>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:'#666',minWidth:34,textAlign:'right'}}>{r.progress}%</div>
              </div>
            ))}
          </div>
        )}

        {/* Billing summary */}
        <div style={{background:'#fff',borderRadius:12,padding:18,marginBottom:14,boxShadow:'0 1px 6px rgba(0,0,0,.06)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#333',marginBottom:12}}>Payment Summary</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
            <div style={{textAlign:'center',padding:'10px 4px',background:'#EBF5FB',borderRadius:8}}>
              <div style={{fontSize:10,color:'#1A5276',fontWeight:700}}>BILLED</div>
              <div style={{fontSize:14,fontWeight:800,color:'#1A5276'}}>{fmtC(data.billing.totalBilled)}</div>
            </div>
            <div style={{textAlign:'center',padding:'10px 4px',background:'#E8F5E9',borderRadius:8}}>
              <div style={{fontSize:10,color:'#1E8449',fontWeight:700}}>PAID</div>
              <div style={{fontSize:14,fontWeight:800,color:'#1E8449'}}>{fmtC(data.billing.totalPaid)}</div>
            </div>
            <div style={{textAlign:'center',padding:'10px 4px',background:data.billing.pending>0?'#FDEDEC':'#F0F0F0',borderRadius:8}}>
              <div style={{fontSize:10,color:data.billing.pending>0?'#C0392B':'#888',fontWeight:700}}>PENDING</div>
              <div style={{fontSize:14,fontWeight:800,color:data.billing.pending>0?'#C0392B':'#888'}}>{fmtC(data.billing.pending)}</div>
            </div>
          </div>

          {data.bills?.length > 0 && (
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'#888',marginBottom:6,marginTop:14}}>RECENT BILLS</div>
              {data.bills.slice(0,5).map(b => (
                <div key={b.raBillNo} style={{display:'flex',justifyContent:'space-between',
                  padding:'7px 0',borderBottom:'1px solid #F5F0F2',fontSize:12}}>
                  <div>
                    <div style={{fontWeight:600}}>{b.raBillNo}</div>
                    <div style={{fontSize:10,color:'#888'}}>{fmtD(b.billDate)}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:700}}>{fmtC(b.netPayable)}</div>
                    <div style={{fontSize:10,color:b.status==='PAID'?'#1E8449':'#B8860B',fontWeight:700}}>{b.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{textAlign:'center',fontSize:10,color:'#aaa',marginTop:10}}>
          This is a live, read-only status page. For any questions, please contact your builder directly.
        </div>
      </div>
    </div>
  )
}
