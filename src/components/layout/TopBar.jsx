import React, { useState, useEffect } from 'react'
import { useAuth } from '@hooks/useAuth'
import { ROLES } from '@utils/constants'
import { format } from 'date-fns'

export default function TopBar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const roleInfo = ROLES[user?.role] || {}

  return (
    <header style={{
      height: '52px', background: '#714B67', color: '#fff',
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '0 16px', flexShrink: 0, zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      {/* Toggle */}
      <button onClick={onToggleSidebar}
        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>
        
      </button>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
        <div style={{
          width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)',
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '13px',
        }}>LNV</div>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px' }}>
          LNV ERP <span style={{ fontSize: '11px', opacity: 0.7 }}>v11</span>
        </span>
      </div>

      {/* Search */}
      <div style={{
        flex: 1, maxWidth: '400px',
        background: 'rgba(255,255,255,0.15)', borderRadius: '6px',
        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
      }}>
        <span style={{ fontSize: '13px', opacity: 0.7 }}></span>
        <input
          placeholder="Search modules, orders, employees…"
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
            width: '100%',
          }}
        />
      </div>

      {/* Right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Role badge */}
        <span style={{
          padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
          background: 'rgba(255,255,255,0.2)', color: '#fff',
        }}>
          {roleInfo.icon} {roleInfo.label}
        </span>

        {/* Time */}
        <span style={{ fontSize: '11px', opacity: 0.8, fontFamily: 'DM Mono, monospace' }}>
          {format(time, 'dd MMM · HH:mm:ss')}
        </span>

        {/* User */}
        <div
          onClick={logout}
          title="Click to logout"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.2)', borderRadius: '20px',
            padding: '4px 12px 4px 6px', cursor: 'pointer',
          }}
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '13px',
          }}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>
            {user?.name || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  )
}
