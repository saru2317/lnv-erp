import React from 'react'

export function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '8px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ title, actions }) {
  return (
    <div style={{
      padding: '12px 16px', borderBottom: '1px solid #DDD5D0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <h3 style={{
        fontFamily: 'Syne, sans-serif', fontSize: '13px',
        fontWeight: 700, margin: 0, color: '#1C1C1C',
      }}>
        {title}
      </h3>
      {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
    </div>
  )
}

export function CardBody({ children, style }) {
  return (
    <div style={{ padding: '14px 16px', ...style }}>
      {children}
    </div>
  )
}

export function FormSection({ title, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '8px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      marginBottom: '14px', overflow: 'hidden',
    }}>
      <div style={{
        padding: '11px 18px', background: '#F8F9FA',
        borderBottom: '1px solid #DDD5D0',
        fontFamily: 'Syne, sans-serif', fontSize: '13px',
        fontWeight: 700, color: '#714B67',
      }}>
        {title}
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  )
}
