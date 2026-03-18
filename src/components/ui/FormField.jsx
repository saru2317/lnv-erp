import React from 'react'

const labelStyle = {
  fontSize: '11px', fontWeight: 700, color: '#6C757D',
  textTransform: 'uppercase', letterSpacing: '0.4px',
  marginBottom: '4px', display: 'block',
}
const inputStyle = {
  width: '100%', padding: '7px 10px',
  border: '1.5px solid #DDD5D0', borderRadius: '5px',
  fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
  color: '#1C1C1C', background: '#fff', outline: 'none',
  transition: 'border 0.15s',
}

export function FormField({ label, required, children, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label style={labelStyle}>
          {label} {required && <span style={{ color: '#D32F2F' }}>*</span>}
        </label>
      )}
      {children}
      {error && <span style={{ fontSize: '11px', color: '#D32F2F' }}>{error}</span>}
    </div>
  )
}

export function Input({ readOnly, ...props }) {
  return (
    <input
      style={{ ...inputStyle, background: readOnly ? '#F8F9FA' : '#fff', color: readOnly ? '#6C757D' : '#1C1C1C' }}
      readOnly={readOnly}
      onFocus={(e) => { if (!readOnly) e.target.style.borderColor = '#714B67' }}
      onBlur={(e) => { e.target.style.borderColor = '#DDD5D0' }}
      {...props}
    />
  )
}

export function Select({ children, ...props }) {
  return (
    <select
      style={inputStyle}
      onFocus={(e) => { e.target.style.borderColor = '#714B67' }}
      onBlur={(e) => { e.target.style.borderColor = '#DDD5D0' }}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ ...props }) {
  return (
    <textarea
      style={{ ...inputStyle, resize: 'vertical', minHeight: '62px' }}
      onFocus={(e) => { e.target.style.borderColor = '#714B67' }}
      onBlur={(e) => { e.target.style.borderColor = '#DDD5D0' }}
      {...props}
    />
  )
}
