import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Shift Master is managed in MDM → HR Master (Shifts tab)
export default function ShiftMaster() {
  const nav = useNavigate()
  useEffect(() => { nav('/mdm/hr', { replace: true }) }, [nav])
  return (
    <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
      Redirecting to MDM → HR Master...
    </div>
  )
}
