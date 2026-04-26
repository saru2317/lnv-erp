import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function HRPolicy() {
  const nav = useNavigate()
  return (
    <div style={{ padding:40, textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>📄</div>
      <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800,
        color:'#714B67', marginBottom:8 }}>📄 HR Policies</h2>
      <p style={{ color:'#6C757D', fontSize:14, marginBottom:24 }}>
        Company HR policy documents
      </p>
      <div style={{ display:'inline-block', padding:'10px 20px',
        background:'#FFF3CD', borderRadius:8, fontSize:13,
        color:'#856404', fontWeight:600, border:'1px solid #FFEEBA' }}>
        🚧 Coming Soon — Under Development
      </div>
      <br/><br/>
      <button onClick={()=>nav('/hcm')}
        style={{ padding:'8px 20px', background:'#714B67', color:'#fff',
          border:'none', borderRadius:6, fontSize:13,
          cursor:'pointer', fontWeight:600 }}>
        ← Back to HCM Dashboard
      </button>
    </div>
  )
}
