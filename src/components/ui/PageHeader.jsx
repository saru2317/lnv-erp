import React from 'react'

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      marginBottom: '16px', gap: '12px', flexWrap: 'wrap',
    }}>
      <div>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontSize: '18px',
          fontWeight: 800, color: '#1C1C1C', margin: 0,
        }}>
          {title}
        </h2>
        {subtitle && (
          <span style={{ fontSize: '12px', color: '#6C757D', marginTop: '2px', display: 'block' }}>
            {subtitle}
          </span>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  )
}
