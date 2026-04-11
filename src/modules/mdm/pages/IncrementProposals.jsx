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
  fontSize: 11, fontWeight: 700, color: '#495057', display: 'block', marginBottom: 4,
  textTransform: 'uppercase', letterSpacing: .4
}

const fmt = n => Number(n || 0).toLocaleString('en-IN')
const fmtC = n => '₹' + fmt(n)
const STAR_COLORS = { 5: '#F59E0B', 4: '#22C55E', 3: '#3B82F6', 2: '#F97316', 1: '#EF4444' }
const RATING_LABELS = { 5: 'Outstanding', 4: 'Exceeds', 3: 'Meets', 2: 'Below', 1: 'Poor' }

// ── Override Modal ─────────────────────────────────────────
function OverrideModal({ proposal, policyId, onSave, onCancel }) {
  const [pct, setPct] = useState(proposal.finalIncrementPct || 0)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const newBasic = Math.round(parseFloat(proposal.currentBasic) * (1 + pct / 100))
  const newGross = Math.round(parseFloat(proposal.currentGross) * (newBasic / parseFloat(proposal.currentBasic)))
  const newCTC = Math.round(parseFloat(proposal.currentCTC) * (newBasic / parseFloat(proposal.currentBasic)))
  const impact = newCTC - parseFloat(proposal.currentCTC)

  const save = async () => {
    if (!reason) return toast.error('Override reason required!')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/increment/${policyId}/proposals/${proposal.empCode}`,
        {
          method: 'PATCH', headers: authHdrs(),
          body: JSON.stringify({ overridePct: pct, overrideReason: reason })
        })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Override applied!')
      onSave()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, width: 500, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,.3)'
      }}>
        <div style={{
          background: '#856404', padding: '14px 20px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ color: '#fff', margin: 0, fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
            ✏️ Override — {proposal.empName}
          </h3>
          <span onClick={onCancel} style={{ color: '#fff', cursor: 'pointer', fontSize: 20 }}>✕</span>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Current vs Auto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Auto Increment %', `${proposal.finalIncrementPct}%`, '#0C5460', '#D1ECF1'],
              ['Auto Increment Amt', fmtC(proposal.incrementAmt), '#155724', '#D4EDDA'],
            ].map(([l, v, c, bg]) => (
              <div key={l} style={{ background: bg, borderRadius: 6, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: c, fontWeight: 700, textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: c, fontFamily: 'Syne,sans-serif' }}>{v}</div>
              </div>
            ))}
          </div>

          <div>
            <label style={lbl}>New Increment % *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" value={pct} min="0" max="100" step="0.1"
                onChange={e => setPct(parseFloat(e.target.value) || 0)}
                style={{ ...inp, width: 100, fontWeight: 700, fontSize: 16, color: '#856404' }}
                onFocus={e => e.target.style.borderColor = '#856404'}
                onBlur={e => e.target.style.borderColor = '#E0D5E0'} />
              <span style={{ fontSize: 13, color: '#6C757D' }}>%</span>
              <span style={{ fontSize: 12, color: '#856404', fontWeight: 600 }}>
                → +{fmtC(newBasic - parseFloat(proposal.currentBasic))} Basic
              </span>
            </div>
          </div>

          {/* Impact preview */}
          <div style={{
            background: '#FFF3CD', borderRadius: 8, padding: 12,
            border: '1px solid #FFEEBA', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8
          }}>
            {[
              ['New Basic', fmtC(newBasic)],
              ['New Gross', fmtC(newGross)],
              ['New CTC', fmtC(newCTC)],
            ].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#856404', fontWeight: 700 }}>{l}</div>
                <div style={{
                  fontSize: 14, fontWeight: 800, color: '#856404',
                  fontFamily: 'Syne,sans-serif'
                }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{
            fontSize: 12, color: impact >= 0 ? '#155724' : '#721C24',
            background: impact >= 0 ? '#D4EDDA' : '#F8D7DA', padding: '6px 12px', borderRadius: 6,
            fontWeight: 600
          }}>
            {impact >= 0 ? '↑' : '↓'} Monthly CTC impact: {fmtC(Math.abs(impact))}/month
            vs auto calculation
          </div>

          <div>
            <label style={lbl}>Override Reason * <span style={{ color: '#DC3545' }}>(mandatory)</span></label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              style={{ ...inp, minHeight: 70, resize: 'vertical' }}
              placeholder="e.g. Exceptional contribution to new product launch, promoted to senior role..." />
          </div>
        </div>
        <div style={{
          padding: '12px 20px', borderTop: '1px solid #E0D5E0',
          display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#F8F7FA'
        }}>
          <button onClick={onCancel} style={{
            padding: '8px 20px', background: '#fff',
            color: '#6C757D', border: '1.5px solid #E0D5E0', borderRadius: 6, fontSize: 13, cursor: 'pointer'
          }}>
            Cancel</button>
          <button onClick={save} disabled={saving}
            style={{
              padding: '8px 24px', background: saving ? '#9E7D96' : '#856404',
              color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}>
            {saving ? '⏳ Saving...' : '✏️ Apply Override'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────
export default function IncrementProposals() {
  const [policies, setPolicies] = useState([])
  const [selPolicy, setSelPolicy] = useState(null)
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('All')
  const [override, setOverride] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch policies
  useEffect(() => {
    fetch(`${BASE_URL}/increment`, { headers: authHdrs() })
      .then(r => r.json())
      .then(d => {
        const active = (d.data || [])
        setPolicies(active)
        if (active.length > 0) setSelPolicy(active[0])
      })
  }, [])

  // Fetch proposals when policy changes
  const fetchProposals = useCallback(async () => {
    if (!selPolicy) return
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/increment/${selPolicy.id}/proposals`,
        { headers: authHdrs() })
      const data = await res.json()
      if (res.ok) setProposals(data.data || [])
      else toast.error(data.error)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [selPolicy])

  useEffect(() => { fetchProposals() }, [selPolicy])

  const submitForApproval = async () => {
    if (!selPolicy) return
    if (!confirm('Submit all proposals for MD approval?')) return
    setSubmitting(true)
    try {
      const res = await fetch(`${BASE_URL}/increment/${selPolicy.id}/submit`,
        { method: 'POST', headers: authHdrs(), body: '{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      // Refresh policies
      const polRes = await fetch(`${BASE_URL}/increment`, { headers: authHdrs() })
      const polData = await polRes.json()
      const active = (polData.data || []).filter(p => ['DRAFT', 'APPROVED', 'PENDING'].includes(p.status))
      setPolicies(active)
      setSelPolicy(active.find(p => p.id === selPolicy.id) || active[0])
    } catch (e) { toast.error(e.message) } finally { setSubmitting(false) }
  }

  // Filters
  const grades = ['All', ...new Set(proposals.map(p => p.gradeCode).filter(Boolean))]
  const filtered = proposals.filter(p =>
    (gradeFilter === 'All' || p.gradeCode === gradeFilter) &&
    (p.empCode?.toLowerCase().includes(search.toLowerCase()) ||
      p.empName?.toLowerCase().includes(search.toLowerCase()))
  )

  // Summary stats
  const totalMonthlyImpact = proposals.reduce((s, p) =>
    s + (parseFloat(p.newCTC) - parseFloat(p.currentCTC)), 0)
  const avgIncrement = proposals.length > 0
    ? proposals.reduce((s, p) => s + parseFloat(p.finalIncrementPct), 0) / proposals.length
    : 0
  const overrideCount = proposals.filter(p => p.isOverridden).length
  const manualCount = proposals.filter(p => p.isManual).length

  const canSubmit = selPolicy?.status === 'DRAFT' && proposals.length > 0

  return (
    <div style={{ padding: 20, background: '#F8F7FA', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#1C1C1C', margin: 0 }}>
            Increment Proposals Review
          </h2>
          <p style={{ fontSize: 12, color: '#6C757D', margin: '3px 0 0' }}>
            HR reviews auto-calculated proposals — override if needed → Submit for MD approval
          </p>
        </div>
        {canSubmit && (
          <button onClick={submitForApproval} disabled={submitting}
            style={{
              padding: '8px 20px', background: submitting ? '#9E7D96' : '#714B67',
              color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}>
            {submitting ? '⏳ Submitting...' : '📤 Submit for MD Approval'}
          </button>
        )}
        {selPolicy?.status === 'PENDING' && (
          <span style={{
            padding: '8px 16px', background: '#FFF3CD', color: '#856404',
            borderRadius: 6, fontSize: 12, fontWeight: 700, border: '1px solid #FFEEBA'
          }}>
            ⏳ Pending MD Approval — read only
          </span>
        )}
      </div>

      {/* Policy selector */}
      {policies.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', color: '#6C757D',
          background: '#fff', borderRadius: 8, border: '2px dashed #E0D5E0'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>No active increment policies</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Create and generate proposals in Increment Policy first</div>
        </div>
      ) : (
        <>
          <div style={{
            background: '#fff', borderRadius: 8, border: '1px solid #E0D5E0',
            padding: 14, marginBottom: 16, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12
          }}>
            <div>
              <label style={lbl}>Increment Policy</label>
              <select value={selPolicy?.id || ''} style={{ ...inp, cursor: 'pointer' }}
                onChange={e => setSelPolicy(policies.find(p => p.id === parseInt(e.target.value)))}>
                {policies.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.policyNo} — {p.name} | {p.model} | {p.status}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 12, color: '#6C757D', lineHeight: 1.8 }}>
                <div>FY: <strong>{selPolicy?.fyYear}</strong></div>
                <div>Effective: <strong>{selPolicy?.effectiveDate
                  ? new Date(selPolicy.effectiveDate).toLocaleDateString('en-IN') : '—'}</strong></div>
                <div>Model: <strong>{selPolicy?.model}</strong> | Cap: <strong>{selPolicy?.maxIncrementPct}%</strong></div>
              </div>
            </div>
          </div>

          {/* KPI Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Employees', value: proposals.length, color: '#714B67', bg: '#EDE0EA', fmt: 'num' },
              { label: 'Avg Increment', value: avgIncrement.toFixed(1) + '%', color: '#0C5460', bg: '#D1ECF1', fmt: 'str' },
              { label: 'Monthly Impact', value: fmtC(totalMonthlyImpact), color: '#155724', bg: '#D4EDDA', fmt: 'str' },
              { label: 'Annual Impact', value: fmtC(totalMonthlyImpact * 12), color: '#856404', bg: '#FFF3CD', fmt: 'str' },
              { label: 'Overrides', value: overrideCount, color: '#721C24', bg: '#F8D7DA', fmt: 'num' },
            ].map(k => (
              <div key={k.label} style={{
                background: k.bg, borderRadius: 8, padding: '12px 16px',
                border: `1px solid ${k.color}22`
              }}>
                <div style={{
                  fontSize: 11, color: k.color, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: .5
                }}>{k.label}</div>
                <div style={{
                  fontSize: k.fmt === 'num' ? 28 : 18, fontWeight: 800, color: k.color,
                  fontFamily: 'Syne,sans-serif', lineHeight: 1.2, marginTop: 2
                }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Grade distribution */}
          {proposals.length > 0 && (
            <div style={{
              background: '#fff', borderRadius: 8, border: '1px solid #E0D5E0',
              padding: 14, marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#6C757D',
                textTransform: 'uppercase', letterSpacing: .4
              }}>Grade Summary:</span>
              {['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'].map(g => {
                const gProps = proposals.filter(p => p.gradeCode === g)
                if (gProps.length === 0) return null
                const avgPct = gProps.reduce((s, p) => s + parseFloat(p.finalIncrementPct), 0) / gProps.length
                return (
                  <div key={g} style={{
                    background: '#F8F4F8', borderRadius: 8,
                    padding: '6px 12px', border: '1px solid #E0D5E0', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#714B67' }}>{g}</div>
                    <div style={{ fontSize: 10, color: '#6C757D' }}>{gProps.length} emp</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#155724' }}>{avgPct.toFixed(1)}%</div>
                  </div>
                )
              })}
              {manualCount > 0 && (
                <span style={{
                  fontSize: 11, color: '#856404', background: '#FFF3CD',
                  padding: '4px 10px', borderRadius: 20, fontWeight: 600
                }}>
                  ⚠️ {manualCount} manual (G7/G8) — set individually
                </span>
              )}
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <input placeholder="🔍 Search employee..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inp, width: 220 }}
              onFocus={e => e.target.style.borderColor = '#714B67'}
              onBlur={e => e.target.style.borderColor = '#E0D5E0'} />
            <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
              style={{ ...inp, width: 120, cursor: 'pointer' }}>
              {grades.map(g => <option key={g}>{g}</option>)}
            </select>
            <span style={{ fontSize: 11, color: '#6C757D', marginLeft: 'auto' }}>
              {filtered.length} of {proposals.length} employees
            </span>
          </div>

          {/* Proposals Table */}
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6C757D' }}>⏳ Loading proposals...</div>
          ) : proposals.length === 0 ? (
            <div style={{
              padding: 40, textAlign: 'center', color: '#6C757D',
              background: '#fff', borderRadius: 8, border: '2px dashed #E0D5E0'
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
              <div style={{ fontWeight: 700 }}>No proposals yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Go to Increment Policy → click "Generate Proposals" first
              </div>
            </div>
          ) : (
            <div style={{
              border: '1px solid #E0D5E0', borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,.05)',
              maxHeight: 'calc(100vh - 420px)', overflowY: 'auto', overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F8F4F8' }}>
                  <tr style={{ borderBottom: '2px solid #E0D5E0' }}>
                    {['#', 'Emp', 'Name', 'Grade', 'Rating',
                      'Current Basic', 'Current CTC',
                      'Incr %', 'Incr Amt',
                      'New Basic', 'New CTC',
                      'CTC Impact', 'Status', ''].map(h => (
                        <th key={h} style={{
                          padding: '9px 10px', fontSize: 10, fontWeight: 700,
                          color: '#6C757D', textAlign: 'left', textTransform: 'uppercase',
                          letterSpacing: .3, whiteSpace: 'nowrap'
                        }}>{h}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const ctcImpact = parseFloat(p.newCTC) - parseFloat(p.currentCTC)
                    const isOverridden = p.isOverridden
                    const isManual = p.isManual
                    return (
                      <tr key={p.empCode} style={{
                        borderBottom: '1px solid #F0EEF0',
                        background: isOverridden ? '#FFF8E6' : isManual ? '#F8F4F8' : i % 2 === 0 ? '#fff' : '#FDFBFD'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FBF7FA'}
                        onMouseLeave={e => e.currentTarget.style.background =
                          isOverridden ? '#FFF8E6' : isManual ? '#F8F4F8' : i % 2 === 0 ? '#fff' : '#FDFBFD'}>
                        <td style={{
                          padding: '9px 10px', fontSize: 11, color: '#6C757D',
                          textAlign: 'center'
                        }}>{i + 1}</td>
                        <td style={{
                          padding: '9px 10px', fontFamily: 'DM Mono,monospace',
                          fontWeight: 700, color: '#714B67', fontSize: 11
                        }}>{p.empCode}</td>
                        <td style={{
                          padding: '9px 10px', fontWeight: 600, fontSize: 13,
                          whiteSpace: 'nowrap'
                        }}>{p.empName}</td>
                        <td style={{ padding: '9px 10px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 10, fontSize: 11,
                            fontWeight: 600, background: '#EDE0EA', color: '#714B67'
                          }}>
                            {p.gradeCode || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 10px' }}>
                          {p.ratingScore ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ color: STAR_COLORS[p.ratingScore], fontSize: 14 }}>
                                {'★'.repeat(p.ratingScore)}
                              </span>
                              <span style={{
                                fontSize: 10, color: STAR_COLORS[p.ratingScore],
                                fontWeight: 600
                              }}>{RATING_LABELS[p.ratingScore]}</span>
                            </div>
                          ) : <span style={{ fontSize: 11, color: '#6C757D' }}>—</span>}
                        </td>
                        <td style={{
                          padding: '9px 10px', fontFamily: 'DM Mono,monospace',
                          fontSize: 12
                        }}>{fmtC(p.currentBasic)}</td>
                        <td style={{
                          padding: '9px 10px', fontFamily: 'DM Mono,monospace',
                          fontSize: 12
                        }}>{fmtC(p.currentCTC)}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                          {isManual ? (
                            <span style={{ fontSize: 11, color: '#856404', fontStyle: 'italic' }}>Manual</span>
                          ) : (
                            <span style={{
                              fontWeight: 800, fontSize: 14,
                              color: isOverridden ? '#856404' : '#714B67',
                              fontFamily: 'Syne,sans-serif'
                            }}>
                              {parseFloat(p.finalIncrementPct).toFixed(1)}%
                              {isOverridden && <span style={{ fontSize: 9, color: '#856404' }}> ✏️OVR</span>}
                            </span>
                          )}
                        </td>
                        <td style={{
                          padding: '9px 10px', fontFamily: 'DM Mono,monospace',
                          fontSize: 12, color: '#155724', fontWeight: 600
                        }}>
                          {isManual ? '—' : '+' + fmtC(p.incrementAmt)}
                        </td>
                        <td style={{
                          padding: '9px 10px', fontFamily: 'DM Mono,monospace',
                          fontSize: 12, fontWeight: 700, color: '#1C1C1C'
                        }}>
                          {fmtC(p.newBasic)}
                        </td>
                        <td style={{
                          padding: '9px 10px', fontFamily: 'DM Mono,monospace',
                          fontSize: 12, fontWeight: 700, color: '#0C5460'
                        }}>
                          {fmtC(p.newCTC)}
                        </td>
                        <td style={{ padding: '9px 10px' }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700,
                            color: ctcImpact > 0 ? '#155724' : '#6C757D',
                            fontFamily: 'DM Mono,monospace'
                          }}>
                            {isManual ? '—' : '+' + fmtC(ctcImpact) + '/mo'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 10px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 10, fontSize: 10,
                            fontWeight: 600,
                            background: isOverridden ? '#FFF3CD' : isManual ? '#F0EEF0' : '#D4EDDA',
                            color: isOverridden ? '#856404' : isManual ? '#6C757D' : '#155724'
                          }}>
                            {isManual ? 'Manual' : isOverridden ? '✏️ Overridden' : '✅ Auto'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 10px' }}>
                          {selPolicy?.status === 'DRAFT' && !isManual && (
                            <button onClick={() => setOverride(p)}
                              style={{
                                padding: '3px 10px', background: '#856404', color: '#fff',
                                border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                                fontWeight: 600, whiteSpace: 'nowrap'
                              }}>
                              ✏️ Override
                            </button>
                          )}
                          {isManual && selPolicy?.status === 'DRAFT' && (
                            <button onClick={() => setOverride(p)}
                              style={{
                                padding: '3px 10px', background: '#714B67', color: '#fff',
                                border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                                fontWeight: 600
                              }}>
                              Set %
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Footer totals */}
                <tfoot style={{ background: '#F8F4F8', borderTop: '2px solid #E0D5E0' }}>
                  <tr>
                    <td colSpan={5} style={{
                      padding: '10px 10px', fontSize: 11,
                      fontWeight: 700, color: '#714B67'
                    }}>
                      TOTAL ({proposals.length} employees)
                    </td>
                    <td style={{
                      padding: '10px 10px', fontFamily: 'DM Mono,monospace',
                      fontSize: 12, fontWeight: 700
                    }}>
                      {fmtC(proposals.reduce((s, p) => s + parseFloat(p.currentBasic), 0))}
                    </td>
                    <td style={{
                      padding: '10px 10px', fontFamily: 'DM Mono,monospace',
                      fontSize: 12, fontWeight: 700
                    }}>
                      {fmtC(proposals.reduce((s, p) => s + parseFloat(p.currentCTC), 0))}
                    </td>
                    <td style={{
                      padding: '10px 10px', fontSize: 12, fontWeight: 700,
                      color: '#714B67', textAlign: 'center'
                    }}>
                      {avgIncrement.toFixed(1)}% avg
                    </td>
                    <td style={{
                      padding: '10px 10px', fontFamily: 'DM Mono,monospace',
                      fontSize: 12, fontWeight: 700, color: '#155724'
                    }}>
                      +{fmtC(proposals.reduce((s, p) => s + parseFloat(p.incrementAmt || 0), 0))}
                    </td>
                    <td style={{
                      padding: '10px 10px', fontFamily: 'DM Mono,monospace',
                      fontSize: 12, fontWeight: 700
                    }}>
                      {fmtC(proposals.reduce((s, p) => s + parseFloat(p.newBasic), 0))}
                    </td>
                    <td style={{
                      padding: '10px 10px', fontFamily: 'DM Mono,monospace',
                      fontSize: 12, fontWeight: 700, color: '#0C5460'
                    }}>
                      {fmtC(proposals.reduce((s, p) => s + parseFloat(p.newCTC), 0))}
                    </td>
                    <td style={{
                      padding: '10px 10px', fontFamily: 'DM Mono,monospace',
                      fontSize: 12, fontWeight: 700, color: '#155724'
                    }}>
                      +{fmtC(totalMonthlyImpact)}/mo
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {override && (
        <OverrideModal
          proposal={override}
          policyId={selPolicy?.id}
          onSave={() => { setOverride(null); fetchProposals() }}
          onCancel={() => setOverride(null)} />
      )}
    </div>
  )
}
