import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// PriceBook is now managed from Pricing Conditions page
export default function PriceBook() {
  const nav = useNavigate()
  useEffect(() => { nav('/sd/pricing', { replace: true }) }, [nav])
  return null
}
