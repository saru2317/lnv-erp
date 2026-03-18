/**
 * AuthContext — Manages user session, role, permissions
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '@services/api'
import toast from 'react-hot-toast'

export const AuthContext = createContext(null)

// Role → accessible modules map
export const ROLE_MODULES = {
  // ── Core Roles ────────────────────────────────────────
  admin:      ['home','sd','mm','wm','fi','pp','qm','pm','hcm','crm','tm','am','civil','vm','cn','admin','config','reports','kpi'],
  manager:    ['home','pp','qm','pm','wm','mm','tm','am','vm','reports','kpi'],
  accounts:   ['home','fi','sd','mm','am','reports','kpi'],
  operations: ['home','pp','qm','pm','wm','mm','tm','reports'],
  hr:         ['home','hcm','cn','vm','reports','kpi'],
  sales:      ['home','sd','crm','reports'],
  // ── Extended Roles ────────────────────────────────────
  transport:  ['home','tm','mm'],
  civil:      ['home','civil','am','mm'],
  viewer:     ['home','sd','mm','pp','fi'],
}

// ── Per-role permissions (what actions each role can do) ──
export const ROLE_PERMISSIONS = {
  admin:      { view:true, create:true, edit:true, delete:true, approve:true, export:true, reports:true, settings:true },
  manager:    { view:true, create:true, edit:true, delete:false, approve:true, export:true, reports:true, settings:false },
  accounts:   { view:true, create:true, edit:true, delete:false, approve:true, export:true, reports:true, settings:false },
  operations: { view:true, create:true, edit:true, delete:false, approve:false, export:false, reports:true, settings:false },
  hr:         { view:true, create:true, edit:true, delete:false, approve:true, export:true, reports:true, settings:false },
  sales:      { view:true, create:true, edit:true, delete:false, approve:false, export:false, reports:true, settings:false },
  transport:  { view:true, create:true, edit:true, delete:false, approve:true, export:true, reports:true, settings:false },
  civil:      { view:true, create:true, edit:true, delete:false, approve:true, export:true, reports:true, settings:false },
  viewer:     { view:true, create:false, edit:false, delete:false, approve:false, export:false, reports:true, settings:false },
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lnv_user')
    const token  = localStorage.getItem('lnv_token')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials)
      localStorage.setItem('lnv_token', data.token)
      localStorage.setItem('lnv_user', JSON.stringify(data.user))
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.name}!`)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials'
      toast.error(msg)
      return { success: false, message: msg }
    }
  }, [])

  // Demo login (no backend needed for dev)
  const demoLogin = useCallback((role = 'admin') => {
    const demoUsers = {
      admin:      { id: 1, name: 'Saravana Kumar', role: 'admin',      email: 'admin@lnv.com' },
      manager:    { id: 2, name: 'Ramesh P',       role: 'manager',    email: 'manager@lnv.com' },
      accounts:   { id: 3, name: 'Priya S',        role: 'accounts',   email: 'accounts@lnv.com' },
      operations: { id: 4, name: 'Karthik M',      role: 'operations', email: 'ops@lnv.com' },
      hr:         { id: 5, name: 'Kavitha R',      role: 'hr',         email: 'hr@lnv.com' },
      sales:      { id: 6, name: 'Vijay T',        role: 'sales',      email: 'sales@lnv.com' },
    }
    const user = demoUsers[role]
    localStorage.setItem('lnv_token', `demo_token_${role}`)
    localStorage.setItem('lnv_user', JSON.stringify(user))
    setUser(user)
    toast.success(`Logged in as ${user.name} (${role})`)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('lnv_token')
    localStorage.removeItem('lnv_user')
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const hasAccess = useCallback((module) => {
    if (!user) return false
    return ROLE_MODULES[user.role]?.includes(module) ?? false
  }, [user])

  // Check if user can perform a specific action
  const canDo = useCallback((action) => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role]?.[action] ?? false
  }, [user])

  // Get list of modules for current user
  const userModules = ROLE_MODULES[user?.role] ?? []

  return (
    <AuthContext.Provider value={{ user, loading, login, demoLogin, logout, hasAccess, canDo, userModules, ROLE_MODULES, ROLE_PERMISSIONS }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
