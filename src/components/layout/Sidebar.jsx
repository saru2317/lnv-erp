import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MODULES } from '@utils/constants'
import { useAuth } from '@hooks/useAuth'

export default function Sidebar({ collapsed }) {
  const { allowedModules } = useAuth()
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  const accessible = Object.values(MODULES).filter(m => allowedModules.includes(m.key))

  return (
    <aside style={{
      width: collapsed ? '44px' : '220px',
      minWidth: collapsed ? '44px' : '220px',
      background: '#fff',
      borderRight: '1px solid #DDD5D0',
      overflowY: 'auto', overflowX: 'hidden',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      flexShrink: 0,
    }}>
      {accessible.map((mod) => {
        const active = pathname.startsWith(`/${mod.key}`)
        return (
          <div
            key={mod.key}
            onClick={() => navigate(mod.path)}
            title={collapsed ? mod.label : ''}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', cursor: 'pointer',
              background: active ? '#EDE0EA' : 'transparent',
              color: active ? '#714B67' : '#6C757D',
              fontWeight: active ? 700 : 500,
              fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
              borderLeft: active ? '3px solid #714B67' : '3px solid transparent',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F8F9FA' }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{mod.icon}</span>
            {!collapsed && <span>{mod.label}</span>}
          </div>
        )
      })}
    </aside>
  )
}
