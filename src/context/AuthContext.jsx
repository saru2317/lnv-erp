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
  const MODULE_ACCESS = {
    ADMIN:      ['home','sd','mm','wm','fi','pp','qm','pm','hcm','crm','admin','config','tm','am','civil','vm','cn','reports','kpi','mdm'],
    MANAGER:    ['home','sd','mm','wm','fi','pp','qm','pm','hcm','crm','tm','am','civil','reports','kpi'],
    ACCOUNTS:   ['home','fi','sd','mm','am','reports'],
    PRODUCTION: ['home','pp','qm','pm','wm','mm','tm','reports'],
    HR:         ['home','hcm','cn','vm','reports'],
    SALES:      ['home','sd','crm','reports'],
  }

  const hasAccess = (moduleKey) => {
    if (!user) return false
    const role = user.role?.toUpperCase()
    return MODULE_ACCESS[role]?.includes(moduleKey) ?? false
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, demoLogin, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
