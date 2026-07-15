import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'

// For the small set of pages every employee needs regardless of their module
// access — e.g. raising a Purchase Indent without full MM access. Unlike
// ModuleRoute, this only checks that someone is logged in; it does NOT check
// hasAccess(moduleKey), since the whole point is to carve this one page out
// of that gate.
export default function UniversalRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}
