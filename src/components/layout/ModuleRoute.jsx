import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'

export default function ModuleRoute({ moduleKey, children }) {
  const { hasAccess, user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!hasAccess(moduleKey)) {
    return (
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', height:'60vh', gap:16
      }}>
        <div style={{fontSize:48}}>🔒</div>
        <div style={{fontSize:20, fontWeight:700, color:'#1C1C1C'}}>Access Restricted</div>
        <div style={{fontSize:14, color:'#6C757D', textAlign:'center', maxWidth:360}}>
          Your role <strong>{user.role}</strong> does not have access to this module.<br/>
          Contact your administrator to request access.
        </div>
        <button onClick={()=>window.history.back()}
          style={{marginTop:8, padding:'8px 20px', background:'#714B67', color:'#fff',
            border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
          ← Go Back
        </button>
      </div>
    )
  }
  return children
}
