import React from 'react'

export default function LoadingScreen({ message = 'Loading module...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '300px', gap: '16px', color: '#6C757D',
    }}>
      <div style={{
        width: '36px', height: '36px', border: '3px solid #DDD5D0',
        borderTop: '3px solid #714B67', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
        {message}
      </span>
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
