// BOMNew.jsx
// BOM creation already exists as a full inline form in MDM → BOMList.jsx
// This file redirects planners there rather than duplicating the form

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function BOMNew() {
  const nav = useNavigate()
  useEffect(() => {
    toast('BOM creation is in MDM → Bill of Materials', { icon: 'ℹ️', duration: 3000 })
    nav('/mdm/bom', { replace: true })
  }, [])
  return null
}
