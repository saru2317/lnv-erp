import React, { createContext, useContext, useState, useEffect } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // ── On app start — restore session ──────────────────────
  useEffect(() => {
    const token    = localStorage.getItem('lnv_token')
    const userData = localStorage.getItem('lnv_user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  // ── Real API Login ───────────────────────────────────────
  const login = async (email, password) => {
    const res  = await fetch(`${BASE_URL}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')

    localStorage.setItem('lnv_token', data.token)
    localStorage.setItem('lnv_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  // ── Demo login (fallback if backend not running) ─────────
  const demoLogin = (role) => {
    const demoUser = {
      id: 0, empCode: 'DEMO',
      name: 'Saravana Kumar',
      email: 'admin@lnverp.com',
      role: role.toUpperCase(),
    }
    localStorage.setItem('lnv_user', JSON.stringify(demoUser))
    setUser(demoUser)
  }

  // ── Logout ───────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('lnv_token')
    localStorage.removeItem('lnv_user')
    setUser(null)
  }

  // ── hasAccess helper ─────────────────────────────────────
  const ALL_MODS = ['home','sd','mm','wm','fi','pp','qm','pm','hcm','crm','admin','config','tm','am','civil','vm','cn','reports','kpi','mdm','ai']

  const MODULE_ACCESS = {
    SUPER_ADMIN: ALL_MODS,
    ADMIN:       ALL_MODS,
    MANAGER:     ['home','sd','mm','wm','fi','pp','qm','pm','hcm','crm','tm','am','civil','reports','kpi'],
    ACCOUNTS:    ['home','fi','mm','sd','am','reports','kpi'],
    PRODUCTION:  ['home','pp','qm','pm','wm','mm','tm','reports'],
    OPERATIONS:  ['home','pp','qm','pm','wm','mm','tm','reports'],
    PLANNER:     ['home','pp','qm','pm','wm','mm','tm','reports'],
    HR:          ['home','hcm','cn','vm','reports'],
    SALES:       ['home','sd','crm','reports','kpi'],
    TRANSPORT:   ['home','tm','wm','reports'],
    CIVIL:       ['home','civil','reports'],
    PURCHASE:    ['home','mm','wm','reports'],
    WAREHOUSE:   ['home','wm','mm','reports'],
    VIEWER:      ['home','reports'],
  }

  const hasAccess = (moduleKey) => {
    if (!user) return false
    const role = (user.role || '').toString().toUpperCase().trim()
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true
    const allowed = MODULE_ACCESS[role]
    if (!allowed) return false
    return allowed.includes(moduleKey)
  }

  // Super Admin — LNV system owner only (full system config access)
  const isSuperAdmin = user?.email === 'admin@lnverp.com' ||
                       (user?.role || '').toUpperCase() === 'SUPER_ADMIN'

  // ── Module activation — reads from CompanyProfile config ──
  const ALWAYS_ON = ['home', 'config', 'admin', 'reports', 'mdm', 'ai'] // core — never hidden
  const isModuleEnabled = (moduleKey) => {
    if (ALWAYS_ON.includes(moduleKey?.toLowerCase())) return true // always visible
    try {
      const active = JSON.parse(localStorage.getItem('lnv_active_modules') || 'null')
      if (!active) return true // default all enabled if not configured
      return active.includes(moduleKey?.toLowerCase())
    } catch { return true }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, demoLogin, logout, hasAccess, isSuperAdmin, isModuleEnabled }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
