import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

const inp = {
  padding: '8px 10px', border: '1.5px solid #E0D5E0', borderRadius: 5,
  fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'DM Sans,sans-serif'
}
const lbl = {
  fontSize: 11, fontWeight: 700, color: '#495057', display: 'block',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: .4
}

const fmt = n => Number(n).toLocaleString('en-IN')

// Working days preview widget
function WorkingDaysPreview({ weekOffRule }) {
  const [data, setData] = useState(null)
  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1

  useEffect(() => {
    if (!weekOffRule) return
    fetch(`${BASE_URL}/pay-component/working-days?year=${year}&month=${month}&weekOffRule=${weekOffRule}`,
      { headers: authHdrs() })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => { })
  }, [weekOffRule])

  if (!data) return null
  return (
    <div style={{
      marginTop: 12, background: '#F8F4F8', borderRadius: 8, padding: 12,
      border: '1px solid #E0D5E0'
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#714B67', marginBottom: 8 }}>
        📅 Working Days Preview — {new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
        {data.yearBreakup?.map(m => {
          const mn = new Date(year, m.month - 1).toLocaleString('en-IN', { month: 'short' })
          const isCurrent = m.month === month
          return (
            <div key={m.month} style={{
              textAlign: 'center', padding: '6px 4px',
              borderRadius: 6, background: isCurrent ? '#714B67' : '#fff',
              border: `1px solid ${isCurrent ? '#714B67' : '#E0D5E0'}`,
              color: isCurrent ? '#fff' : '#495057'
            }}>
              <div style={{ fontSize: 9, fontWeight: 600, opacity: .8 }}>{mn}</div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Syne,sans-serif' }}>{m.days}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function StatutoryConfig() {
  const [configs, setConfigs] = useState([])
  const [editId, setEditId] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [weekOff, setWeekOff] = useState('SUNDAY_ONLY')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/pay-component/statutory`, { headers: authHdrs() })
      const data = await res.json()
      if (res.ok) setConfigs(data.data || [])
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [])

  // Rate codes — always stored as decimal (0.12 = 12%)
  const RATE_CODES = ['PF_EMP_RATE','PF_ER_RATE','ESI_EMP_RATE','ESI_ER_RATE','GRATUITY_RATE']

  const save = async (id) => {
    setSaving(true)
    try {
      const cfg = configs.find(c => c.id === id)
      const isRate = cfg && RATE_CODES.includes(cfg.code)
      // Rate: user enters 12.5 → store 0.125 | Amount: user enters 15000 → store 15000
      const valueToSave = isRate
        ? (parseFloat(editVal) / 100).toString()
        : editVal
      const res = await fetch(`${BASE_URL}/pay-component/statutory/${id}`,
        { method: 'PATCH', headers: authHdrs(), body: JSON.stringify({ value: valueToSave }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Updated!')
      setEditId(null); fetch_()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  // Group configs
  const pfConfigs = configs.filter(c => c.code.startsWith('PF'))
  const esiConfigs = configs.filter(c => c.code.startsWith('ESI'))
  const otherConfigs = configs.filter(c => !c.code.startsWith('PF') && !c.code.startsWith('ESI'))

  const pfCeiling = configs.find(c => c.code === 'PF_WAGE_CEILING')
  const esiCeiling = configs.find(c => c.code === 'ESI_GROSS_CEILING')

  const ConfigGroup = ({ title, icon, items, color, bg }) => (
    <div style={{
      background: '#fff', borderRadius: 8, border: '1px solid #E0D5E0',
      overflow: 'hidden', marginBottom: 16
    }}>
      <div style={{ padding: '10px 16px', background: bg, borderBottom: '1px solid #E0D5E0' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color }}>{icon} {title}</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {items.map((c, i) => (
            <tr key={c.id} style={{
              borderBottom: '1px solid #F0EEF0',
              background: i % 2 === 0 ? '#fff' : '#FDFBFD'
            }}>
              <td style={{ padding: '10px 14px', width: '35%' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1C1C1C' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#6C757D', marginTop: 2 }}>{c.description}</div>
              </td>
              <td style={{ padding: '10px 14px', width: '15%' }}>
                <span style={{
                  fontFamily: 'DM Mono,monospace', fontWeight: 700,
                  fontSize: 14, color: '#714B67'
                }}>
                  {parseFloat(c.value) < 1
                    ? (parseFloat(c.value) * 100).toFixed(2) + '%'
                    : '₹' + fmt(c.value)}
                </span>
              </td>
              <td style={{ padding: '10px 14px', fontSize: 11, color: '#6C757D', width: '30%' }}>
                Last updated: {new Date(c.updatedAt).toLocaleDateString('en-IN')}
                {c.updatedBy && ` by ${c.updatedBy}`}
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                {editId === c.id ? (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        type="text"
                        inputMode="decimal"
                        placeholder={['PF_EMP_RATE','PF_ER_RATE','ESI_EMP_RATE','ESI_ER_RATE','GRATUITY_RATE'].includes(c.code) ? 'e.g. 12.5' : 'e.g. 15000'}
                        min="0"
                        style={{
                          ...inp, width: 130,
                          paddingRight: parseFloat(c.value) < 1 ? '30px' : '10px'
                        }}
                        onFocus={e => e.target.style.borderColor = '#714B67'}
                        onBlur={e => e.target.style.borderColor = '#E0D5E0'}
                      />
                      {['PF_EMP_RATE','PF_ER_RATE','ESI_EMP_RATE','ESI_ER_RATE','GRATUITY_RATE'].includes(c.code) && (
                        <span style={{
                          position: 'absolute', right: 8, top: '50%',
                          transform: 'translateY(-50%)', fontSize: 11,
                          color: '#6C757D', pointerEvents: 'none'
                        }}>
                          (decimal)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#6C757D', whiteSpace: 'nowrap' }}>
                      {parseFloat(c.value) < 1
                        ? 'Enter as %\ne.g. 12.5 means 12.5%'
                        : 'Enter amount ₹'}
                    </div>
                    <button onClick={() => save(c.id)} disabled={saving}
                      style={{
                        padding: '5px 12px', background: '#714B67', color: '#fff',
                        border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 700
                      }}>
                      {saving ? '...' : 'Save'}</button>
                    <button onClick={() => setEditId(null)}
                      style={{
                        padding: '5px 10px', background: '#fff', color: '#6C757D',
                        border: '1px solid #E0D5E0', borderRadius: 4, fontSize: 11, cursor: 'pointer'
                      }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => {
                    const isRate = ['PF_EMP_RATE','PF_ER_RATE','ESI_EMP_RATE','ESI_ER_RATE','GRATUITY_RATE'].includes(c.code)
                    setEditId(c.id)
                    setEditVal(isRate ? (parseFloat(c.value)*100).toString() : parseFloat(c.value).toString())
                  }}
                    style={{
                      padding: '4px 12px', background: '#714B67', color: '#fff',
                      border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer'
                    }}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div style={{ padding: 20, background: '#F8F7FA', minHeight: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#1C1C1C', margin: 0 }}>
          Statutory Configuration
        </h2>
        <p style={{ fontSize: 12, color: '#6C757D', margin: '3px 0 0' }}>
          PF / ESI ceilings, tax rates — admin configurable when govt revises limits
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        background: '#FFF3CD', padding: '10px 14px', borderRadius: 8,
        border: '1px solid #FFEEBA', marginBottom: 20, fontSize: 12, color: '#856404'
      }}>
        ⚠️ <strong>Important:</strong> These values affect all payroll calculations.
        Change only when the Government officially revises statutory limits.
        All changes are logged with user and date.
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6C757D' }}>⏳ Loading...</div>
      ) : (
        <>
          {/* PF section with ceiling explanation */}
          <ConfigGroup title="Provident Fund (PF)" icon="🏛️" items={pfConfigs}
            color="#0C5460" bg="#D1ECF1" />

          {pfCeiling && (
            <div style={{
              background: '#E8F4F8', borderRadius: 8, padding: 14,
              border: '1px solid #BEE5EB', marginBottom: 16, fontSize: 12, color: '#0C5460'
            }}>
              <strong>📖 PF Ceiling Logic:</strong><br />
              If Basic ≤ ₹{fmt(pfCeiling.value)} → PF = Basic × 12%<br />
              If Basic &gt; ₹{fmt(pfCeiling.value)} → PF = ₹{fmt(pfCeiling.value)} × 12%
              = <strong>₹{fmt(parseFloat(pfCeiling.value) * 0.12)} fixed</strong>
              &nbsp;(ceiling applied — Basic beyond ₹{fmt(pfCeiling.value)} not counted)
            </div>
          )}

          <ConfigGroup title="Employee State Insurance (ESI)" icon="🏥" items={esiConfigs}
            color="#155724" bg="#D4EDDA" />

          {esiCeiling && (
            <div style={{
              background: '#EAF7EC', borderRadius: 8, padding: 14,
              border: '1px solid #C3E6CB', marginBottom: 16, fontSize: 12, color: '#155724'
            }}>
              <strong>📖 ESI Ceiling Logic:</strong><br />
              If Gross ≤ ₹{fmt(esiCeiling.value)} → ESI applicable (Emp: 0.75%, Er: 3.25%)<br />
              If Gross &gt; ₹{fmt(esiCeiling.value)} → ESI = <strong>₹0 (NOT applicable)</strong>
              &nbsp;— employee moves out of ESI bracket
            </div>
          )}

          <ConfigGroup title="Other Statutory" icon="📋" items={otherConfigs}
            color="#856404" bg="#FFF3CD" />

          {/* Working Days Config */}
          <div style={{
            background: '#fff', borderRadius: 8, border: '1px solid #E0D5E0',
            overflow: 'hidden', marginBottom: 16
          }}>
            <div style={{ padding: '10px 16px', background: '#EDE0EA', borderBottom: '1px solid #E0D5E0' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#714B67' }}>📅 Week Off / Working Days Rule</span>
            </div>
            <div style={{ padding: 16 }}>
              <label style={lbl}>Company Week Off Rule</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                {[
                  { val: 'SUNDAY_ONLY', label: 'Sunday Only (6-day week)' },
                  { val: 'SAT_SUN', label: 'Saturday + Sunday (5-day week)' },
                  { val: 'ALT_SAT_SUN', label: '2nd & 4th Sat + Sunday' },
                  { val: 'ALL_SAT_SUN', label: 'All Saturdays + Sunday' },
                  { val: 'FIXED', label: 'Fixed Days (always same number)' },
                ].map(o => (
                  <div key={o.val} onClick={() => setWeekOff(o.val)}
                    style={{
                      padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      border: weekOff === o.val ? '2px solid #714B67' : '1px solid #E0D5E0',
                      background: weekOff === o.val ? '#714B67' : '#fff',
                      color: weekOff === o.val ? '#fff' : '#6C757D'
                    }}>
                    {o.label}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#6C757D', marginTop: 6 }}>
                💡 This config is used in Staff salary calculation.
                System auto-calculates actual working days per calendar month.
              </div>
              <WorkingDaysPreview weekOffRule={weekOff} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
