import React from 'react'

const TYPES = {
  info:    { bg: '#EBF5FB', border: '#AED6F1', color: '#2471A3' },
  warn:    { bg: '#FEF5E7', border: '#FAD7A0', color: '#D68910' },
  success: { bg: '#EAF9F6', border: '#A2DED0', color: '#1E8449' },
  danger:  { bg: '#FDEDEC', border: '#F5B7B1', color: '#C0392B' },
}

export default function Alert({ type = 'info', children }) {
  const t = TYPES[type] || TYPES.info
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px', borderRadius: '6px', marginBottom: '14px',
      fontSize: '13px', background: t.bg, border: `1px solid ${t.border}`, color: t.color,
    }}>
      {children}
    </div>
  )
}
