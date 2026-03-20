import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { MODULES } from '@utils/constants'

export default function ModuleNav() {
  const { allowedModules } = useAuth()
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      height: '44px', background: '#fff',
      borderBottom: '1px solid #DDD5D0',
      display: 'flex', alignItems: 'stretch',
      padding: '0 10px', gap: 0,
      overflowX: 'auto', flexShrink: 0,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      zIndex: 900,
    }}>
      {Object.values(MODULES).map((mod) => {
        const allowed = allowedModules.includes(mod.key)
        const active  = pathname.startsWith(`/${mod.key}`)
        return (
          <button
            key={mod.key}
            onClick={() => allowed && navigate(mod.path)}
            title={!allowed ? 'Access restricted for your role ' : mod.label}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '0 13px', cursor: allowed ? 'pointer' : 'not-allowed',
              color: active ? '#714B67' : '#6C757D',
              fontFamily: 'DM Sans, sans-serif', fontSize: '11.5px', fontWeight: active ? 700 : 500,
              borderBottom: `3px solid ${active ? '#714B67' : 'transparent'}`,
              background: 'none', border: 'none',
              borderBottomWidth: '3px', borderBottomStyle: 'solid',
              borderBottomColor: active ? '#714B67' : 'transparent',
              whiteSpace: 'nowrap', height: '100%',
              opacity: allowed ? 1 : 0.4,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '13px' }}>{mod.icon}</span>
            {mod.label.split(' ')[0]}
            {!allowed && ' '}
          </button>
        )
      })}
    </nav>
  )
}
