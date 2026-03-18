import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import toast from 'react-hot-toast'

const ROLES = [
  { key: 'admin',      label: 'Admin',      icon: '👑', desc: 'Full access' },
  { key: 'manager',   label: 'Manager',    icon: '🏭', desc: 'Production' },
  { key: 'accounts',  label: 'Accounts',   icon: '💰', desc: 'Finance' },
  { key: 'operations',label: 'Operator',   icon: '⚙️', desc: 'Production' },
  { key: 'hr',        label: 'HR',         icon: '👥', desc: 'People' },
  { key: 'sales',     label: 'Sales',      icon: '📦', desc: 'Orders' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [role, setRole]       = useState('admin')
  const [password, setPassword] = useState('lnv@2025')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await login({ role, password })
      navigate('/home')
    } catch (err) {
      setError('Incorrect password — Hint: lnv@2025')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #714B67 0%, #875A7B 50%, #5A3A52 100%)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px',
        color: '#fff', maxWidth: '520px',
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontSize: '48px',
          fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px',
        }}>LNV</div>
        <div style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>
          Manufacturing ERP
        </div>
        <div style={{ fontSize: '14px', opacity: 0.8, lineHeight: 1.6, marginBottom: '40px' }}>
          Surface Treatment · Powder Coating · Automotive Supply
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            ['🏭', 'Multi-Module', 'SD · MM · WM · PP · FI · QM · PM · HCM'],
            ['☁️', 'Cloud Ready', 'Access anywhere, any device'],
            ['📊', 'Real-Time', 'Live dashboards & KPIs'],
            ['🔐', 'Role-Based', '6 roles · Secure RBAC'],
          ].map(([ic, nm, ds]) => (
            <div key={nm} style={{
              background: 'rgba(255,255,255,0.1)', borderRadius: '10px',
              padding: '14px', backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{ic}</div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{nm}</div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>{ds}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '40px', fontSize: '11px', opacity: 0.5 }}>
          © 2026 LNV Infotech Soft Solutions Pvt. Ltd.
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px',
      }}>
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '40px',
          width: '100%', maxWidth: '420px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 800, marginBottom: '4px', color: '#1C1C1C' }}>
            Sign In to LNV ERP
          </div>
          <div style={{ fontSize: '12px', color: '#6C757D', marginBottom: '24px' }}>
            LNV Manufacturing Pvt. Ltd. · Ranipet, Tamil Nadu
          </div>

          {/* Role selector */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Select Role
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {ROLES.map((r) => (
                <div
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  style={{
                    border: `2px solid ${role === r.key ? '#714B67' : '#DDD5D0'}`,
                    background: role === r.key ? '#EDE0EA' : '#fff',
                    borderRadius: '8px', padding: '10px 8px', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{r.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: role === r.key ? '#714B67' : '#1C1C1C' }}>{r.label}</div>
                  <div style={{ fontSize: '10px', color: '#6C757D' }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Password
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              border: '1.5px solid #DDD5D0', borderRadius: '6px', padding: '8px 12px',
            }}>
              <span>🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={{ border: 'none', outline: 'none', flex: 1, fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}
              />
            </div>
            <div style={{ fontSize: '11px', color: '#6C757D', marginTop: '4px' }}>
              Demo: password is <strong>lnv@2025</strong>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FDEDEC', border: '1px solid #F5B7B1', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: '#C0392B', marginBottom: '12px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: '#714B67',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'all 0.15s',
            }}
          >
            {loading ? '⏳ Signing In…' : '🔐 Sign In to LNV ERP'}
          </button>
        </div>
      </div>
    </div>
  )
}
