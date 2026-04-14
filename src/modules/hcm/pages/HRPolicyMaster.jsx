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

const STATUS_CONFIG = {
  DRAFT: { bg: '#F0EEF0', text: '#6C757D', label: 'Draft', icon: '✏️' },
  PENDING: { bg: '#FFF3CD', text: '#856404', label: 'Pending', icon: '⏳' },
  APPROVED: { bg: '#D1ECF1', text: '#0C5460', label: 'Approved', icon: '✅' },
  ACTIVE: { bg: '#D4EDDA', text: '#155724', label: 'Active', icon: '🟢' },
  ARCHIVED: { bg: '#E0E0E0', text: '#555', label: 'Archived', icon: '📦' },
}

const GRADES = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8']

// ── Toggle Switch ──────────────────────────────────────────
function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative',
          background: value ? '#714B67' : '#CCC', transition: 'background .2s'
        }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left .2s'
        }} />
      </div>
      {label && <span style={{ fontSize: 12, color: value ? '#714B67' : '#6C757D', fontWeight: 600 }}>{label}</span>}
    </div>
  )
}

// ── Field Row ──────────────────────────────────────────────
function FieldRow({ label, hint, children }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16,
      alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0EEF0'
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1C1C1C' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: '#6C757D', marginTop: 2 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{
      background: '#F8F4F8', borderRadius: 8, padding: '10px 14px',
      marginBottom: 4, borderLeft: '3px solid #714B67'
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#714B67' }}>{icon} {title}</div>
      {subtitle && <div style={{ fontSize: 11, color: '#6C757D', marginTop: 2 }}>{subtitle}</div>}
    </div>
  )
}

// ── Policy Form (Create / Edit) ────────────────────────────
function PolicyForm({ policy, grades, onSave, onCancel }) {
  const isEdit = !!policy?.id
  const [activeTab, setActiveTab] = useState('worker')
  const [saving, setSaving] = useState(false)

  // Main
  const [name, setName] = useState(policy?.name || '')
  const [effDate, setEffDate] = useState(
    policy?.effectiveFrom ? policy.effectiveFrom.split('T')[0] :
      new Date().toISOString().split('T')[0]
  )

  // Worker Policy
  const [wp, setWp] = useState(policy?.workerPolicy || {
    workingDaysMonth: 26, graceMins: 30, lateRule: 'HALF_DAY',
    lateOtCredit: true, earlyOutRule: 'HALF_DAY', earlyOutOtCredit: true,
    halfDayCutoffMins: 240, otEligible: true, minOtMins: 30, otMultiplier: 1.5,
    leaveEnabled: false, permEnabled: false, pfApplicable: true, esiApplicable: true
  })

  // Staff Policy
  const [sp, setSp] = useState(policy?.staffPolicy || {
    workingDaysMonth: 26, defaultGraceMins: 30, halfDayCutoffMins: 240,
    permEnabled: true, permMonthlyHrs: 4, permMaxPerDayHrs: 2,
    permMinPerReqHrs: 1, permAllowedSlot: 'SHIFT_START',
    leaveEnabled: true, otEligible: false,
    pfApplicable: true, esiApplicable: true
  })

  // Grade Policies
  const DEFAULT_GP = GRADES.map(g => ({
    gradeCode: g, graceMins: g <= 'G4' ? 30 : g <= 'G6' ? 45 : 0,
    noLateMarking: g >= 'G7',
    freeLateDays: g <= 'G2' ? 2 : g <= 'G6' ? 3 : 0,
    freeLateMaxMins: 5,
    deductType: 'HALF_DAY',
    accumulateRule: g <= 'G4' ? 'EACH_LATE' : 'COUNT_BASED',
    latesPerHalfDay: 3, latesPerFullDay: 6
  }))
  const [gp, setGp] = useState(
    policy?.gradePolicies?.length > 0 ? policy.gradePolicies : DEFAULT_GP
  )

  const setGpField = (gradeCode, field, val) =>
    setGp(prev => prev.map(g => g.gradeCode === gradeCode ? { ...g, [field]: val } : g))

  const W = (field, type = 'text') => ({
    value: wp[field] ?? '',
    onChange: e => setWp(p => ({ ...p, [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })),
    style: inp,
    onFocus: e => e.target.style.borderColor = '#714B67',
    onBlur: e => e.target.style.borderColor = '#E0D5E0',
  })
  const S = (field, type = 'text') => ({
    value: sp[field] ?? '',
    onChange: e => setSp(p => ({ ...p, [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })),
    style: inp,
    onFocus: e => e.target.style.borderColor = '#714B67',
    onBlur: e => e.target.style.borderColor = '#E0D5E0',
  })

  const save = async () => {
    if (!name || !effDate) return toast.error('Name and Effective Date required!')
    setSaving(true)
    try {
      const payload = { name, effectiveFrom: effDate, workerPolicy: wp, staffPolicy: sp, gradePolicies: gp }
      const url = isEdit ? `${BASE_URL}/hr-policy/${policy.id}` : `${BASE_URL}/hr-policy`
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(isEdit ? 'Policy updated!' : 'Policy created as DRAFT!')
      onSave()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const TABS = [
    { id: 'worker', label: '👷 Worker / Contractor' },
    { id: 'staff', label: '👔 Staff — General' },
    { id: 'grades', label: '🏷️ Staff — Grade Rules' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, width: '92%', maxWidth: 1000,
        maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,.35)'
      }}>

        {/* Header */}
        <div style={{
          background: '#714B67', padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ color: '#fff', margin: 0, fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700 }}>
              {isEdit ? `Edit Policy — ${policy.policyNo}` : '+ New HR Policy'}
            </h3>
            <p style={{ color: 'rgba(255,255,255,.6)', margin: '2px 0 0', fontSize: 11 }}>
              All values configurable by Company Admin — LNV does not define policy
            </p>
          </div>
          <span onClick={onCancel} style={{ color: '#fff', cursor: 'pointer', fontSize: 20 }}>✕</span>
        </div>

        {/* Policy Name + Date */}
        <div style={{
          padding: '14px 20px', background: '#FAF8FA', borderBottom: '1px solid #E0D5E0',
          display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16
        }}>
          <div>
            <label style={lbl}>Policy Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inp}
              placeholder="e.g. FY 2026-27 HR Policy"
              onFocus={e => e.target.style.borderColor = '#714B67'} onBlur={e => e.target.style.borderColor = '#E0D5E0'} />
          </div>
          <div>
            <label style={lbl}>Effective From *</label>
            <input type="date" value={effDate} onChange={e => setEffDate(e.target.value)} style={inp}
              onFocus={e => e.target.style.borderColor = '#714B67'} onBlur={e => e.target.style.borderColor = '#E0D5E0'} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E0D5E0', background: '#F8F7FA' }}>
          {TABS.map(t => (
            <div key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                padding: '10px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                color: activeTab === t.id ? '#714B67' : '#6C757D',
                borderBottom: activeTab === t.id ? '2px solid #714B67' : '2px solid transparent',
                marginBottom: -2
              }}>
              {t.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>

          {/* ── WORKER TAB ── */}
          {activeTab === 'worker' && (
            <div>
              <div style={{
                background: '#FFF3CD', padding: '8px 12px', borderRadius: 6,
                fontSize: 12, color: '#856404', marginBottom: 16, border: '1px solid #FFEEBA'
              }}>
                👷 Worker + Contractor follow the <strong>same policy</strong>.
                Staff have their own separate rules (see Staff tab).
              </div>

              <SectionHeader icon="💰" title="Salary" subtitle="How worker monthly salary is calculated" />
              <FieldRow label="Working Days / Month" hint="Base days for salary calculation">
                <input {...W('workingDaysMonth', 'number')} type="number" min="1" max="31" style={{ ...inp, width: 100 }} />
              </FieldRow>

              <SectionHeader icon="⏰" title="Attendance & Late Rules" subtitle="Grace period and late deduction logic" />
              <FieldRow label="Grace Period (minutes)" hint="Late within this → no deduction">
                <input {...W('graceMins', 'number')} type="number" min="0" max="120" style={{ ...inp, width: 100 }} />
              </FieldRow>
              <FieldRow label="Late Rule" hint="Deduction when late beyond grace period">
                <select {...W('lateRule')} style={{ ...inp, width: 200, cursor: 'pointer' }}>
                  <option value="HALF_DAY">Half Day Absent</option>
                  <option value="FULL_DAY">Full Day Absent</option>
                </select>
              </FieldRow>
              <FieldRow label="Late Hours → OT Credit" hint="If late but worked extra, credit as OT">
                <Toggle value={wp.lateOtCredit} onChange={v => setWp(p => ({ ...p, lateOtCredit: v }))}
                  label={wp.lateOtCredit ? 'Yes — late extra hrs credited as OT' : 'No — no OT credit'} />
              </FieldRow>
              <FieldRow label="Early Out Rule" hint="If employee leaves before shift end">
                <select {...W('earlyOutRule')} style={{ ...inp, width: 200, cursor: 'pointer' }}>
                  <option value="HALF_DAY">Half Day Absent</option>
                  <option value="PROPORTIONAL">Proportional Deduction</option>
                </select>
              </FieldRow>
              <FieldRow label="Half Day Cutoff (minutes)" hint="If worked < this → half day mark">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input {...W('halfDayCutoffMins', 'number')} type="number" style={{ ...inp, width: 100 }} />
                  <span style={{ fontSize: 11, color: '#6C757D' }}>
                    = {Math.floor((wp.halfDayCutoffMins || 240) / 60)}h {(wp.halfDayCutoffMins || 240) % 60}m
                  </span>
                </div>
              </FieldRow>

              <SectionHeader icon="🔧" title="Overtime (OT)" subtitle="OT eligibility and calculation" />
              <FieldRow label="OT Eligible" hint="Workers are typically OT eligible">
                <Toggle value={wp.otEligible} onChange={v => setWp(p => ({ ...p, otEligible: v }))}
                  label={wp.otEligible ? 'Yes — OT applicable' : 'No OT'} />
              </FieldRow>
              {wp.otEligible && <>
                <FieldRow label="Min OT Minutes" hint="Minimum mins worked extra to qualify as OT">
                  <input {...W('minOtMins', 'number')} type="number" style={{ ...inp, width: 100 }} />
                </FieldRow>
                <FieldRow label="OT Multiplier" hint="1.5 = time and a half">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input {...W('otMultiplier', 'number')} type="number" step="0.1" min="1" style={{ ...inp, width: 100 }} />
                    <span style={{ fontSize: 11, color: '#6C757D' }}>× Basic per hour</span>
                  </div>
                </FieldRow>
              </>}

              <SectionHeader icon="📋" title="Entitlements" subtitle="Leave, Permission, Statutory" />
              <FieldRow label="Leave Applicable" hint="Usually NO for workers">
                <Toggle value={wp.leaveEnabled} onChange={v => setWp(p => ({ ...p, leaveEnabled: v }))}
                  label={wp.leaveEnabled ? 'Yes' : 'No'} />
              </FieldRow>
              <FieldRow label="Permission Applicable" hint="Usually NO for workers">
                <Toggle value={wp.permEnabled} onChange={v => setWp(p => ({ ...p, permEnabled: v }))}
                  label={wp.permEnabled ? 'Yes' : 'No'} />
              </FieldRow>
              <FieldRow label="PF Applicable">
                <Toggle value={wp.pfApplicable} onChange={v => setWp(p => ({ ...p, pfApplicable: v }))}
                  label={wp.pfApplicable ? 'Yes' : 'No'} />
              </FieldRow>
              <FieldRow label="ESI Applicable">
                <Toggle value={wp.esiApplicable} onChange={v => setWp(p => ({ ...p, esiApplicable: v }))}
                  label={wp.esiApplicable ? 'Yes' : 'No'} />
              </FieldRow>
            </div>
          )}

          {/* ── STAFF TAB ── */}
          {activeTab === 'staff' && (
            <div>
              <div style={{
                background: '#D1ECF1', padding: '8px 12px', borderRadius: 6,
                fontSize: 12, color: '#0C5460', marginBottom: 16, border: '1px solid #BEE5EB'
              }}>
                👔 Staff salary is based on <strong>Company Working Days</strong> — not present days.
                Grade-wise late rules configured separately in the next tab.
              </div>

              <SectionHeader icon="💰" title="Salary" />
              <FieldRow label="Company Working Days / Month" hint="Full salary based on this">
                <input {...S('workingDaysMonth', 'number')} type="number" min="1" max="31" style={{ ...inp, width: 100 }} />
              </FieldRow>
              <FieldRow label="Default Grace Period (mins)" hint="Overridden per grade in Grade Rules tab">
                <input {...S('defaultGraceMins', 'number')} type="number" style={{ ...inp, width: 100 }} />
              </FieldRow>
              <FieldRow label="Half Day Cutoff (minutes)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input {...S('halfDayCutoffMins', 'number')} type="number" style={{ ...inp, width: 100 }} />
                  <span style={{ fontSize: 11, color: '#6C757D' }}>
                    = {Math.floor((sp.halfDayCutoffMins || 240) / 60)}h {(sp.halfDayCutoffMins || 240) % 60}m
                  </span>
                </div>
              </FieldRow>

              <SectionHeader icon="🕐" title="Permission Policy" />
              <FieldRow label="Permission Applicable">
                <Toggle value={sp.permEnabled} onChange={v => setSp(p => ({ ...p, permEnabled: v }))}
                  label={sp.permEnabled ? 'Yes' : 'No'} />
              </FieldRow>
              {sp.permEnabled && <>
                <FieldRow label="Monthly Permission Hours" hint="Total permission hours allowed per month">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input {...S('permMonthlyHrs', 'number')} type="number" style={{ ...inp, width: 100 }} />
                    <span style={{ fontSize: 11, color: '#6C757D' }}>hrs / month</span>
                  </div>
                </FieldRow>
                <FieldRow label="Max Per Day (hours)" hint="Cannot take more than this in one day">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input {...S('permMaxPerDayHrs', 'number')} type="number" style={{ ...inp, width: 100 }} />
                    <span style={{ fontSize: 11, color: '#6C757D' }}>hrs / day</span>
                  </div>
                </FieldRow>
                <FieldRow label="Min Per Request (hours)">
                  <input {...S('permMinPerReqHrs', 'number')} type="number" step="0.5" style={{ ...inp, width: 100 }} />
                </FieldRow>
                <FieldRow label="Allowed Slot" hint="When during shift can permission be taken">
                  <select {...S('permAllowedSlot')} style={{ ...inp, width: 240, cursor: 'pointer' }}>
                    <option value="SHIFT_START">Shift Start only — Late IN permission (morning entry)</option>
                    <option value="SHIFT_END">Shift End only — Early OUT permission (evening exit)</option>
                    <option value="SHIFT_START_END">Shift Start & End — Morning IN or Evening OUT only</option>
                    <option value="ANYTIME">Anytime during shift</option>
                  </select>
                </FieldRow>
              </>}

              <SectionHeader icon="🌴" title="Leave & OT" />
              <FieldRow label="Leave Applicable">
                <Toggle value={sp.leaveEnabled} onChange={v => setSp(p => ({ ...p, leaveEnabled: v }))}
                  label={sp.leaveEnabled ? 'Yes' : 'No'} />
              </FieldRow>
              <FieldRow label="OT Applicable" hint="Usually NO for staff">
                <Toggle value={sp.otEligible} onChange={v => setSp(p => ({ ...p, otEligible: v }))}
                  label={sp.otEligible ? 'Yes' : 'No'} />
              </FieldRow>
              <FieldRow label="PF Applicable">
                <Toggle value={sp.pfApplicable} onChange={v => setSp(p => ({ ...p, pfApplicable: v }))}
                  label={sp.pfApplicable ? 'Yes' : 'No'} />
              </FieldRow>
              <FieldRow label="ESI Applicable">
                <Toggle value={sp.esiApplicable} onChange={v => setSp(p => ({ ...p, esiApplicable: v }))}
                  label={sp.esiApplicable ? 'Yes' : 'No'} />
              </FieldRow>
            </div>
          )}

          {/* ── GRADE RULES TAB ── */}
          {activeTab === 'grades' && (
            <div>
              <div style={{
                background: '#EDE0EA', padding: '8px 12px', borderRadius: 6,
                fontSize: 12, color: '#714B67', marginBottom: 16, border: '1px solid #D4BFCF'
              }}>
                🏷️ Configure late policy per grade. G7/G8 typically have no late marking.
                First <strong>N lates ≤ M mins</strong> are free — then deduction applies.
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F8F4F8', borderBottom: '2px solid #E0D5E0' }}>
                      {['Grade', 'Grace (min)', 'No Late Marking', 'Free Lates', 'Free Max (min)', 'Deduct Rule', 'Accumulate', 'Lates→HalfDay', 'Lates→FullDay'].map(h => (
                        <th key={h} style={{
                          padding: '9px 10px', fontSize: 10, fontWeight: 700,
                          color: '#6C757D', textAlign: 'left', textTransform: 'uppercase', letterSpacing: .3,
                          whiteSpace: 'nowrap'
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gp.map((g, i) => (
                      <tr key={g.gradeCode} style={{
                        borderBottom: '1px solid #F0EEF0',
                        background: g.noLateMarking ? '#F8F4F8' : i % 2 === 0 ? '#fff' : '#FDFBFD'
                      }}>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            fontFamily: 'DM Mono,monospace', fontWeight: 700,
                            color: '#714B67', fontSize: 13
                          }}>{g.gradeCode}</span>
                        </td>
                        <td style={{ padding: '6px 8px', width: 90 }}>
                          <input type="number" value={g.graceMins} min="0" max="120"
                            disabled={g.noLateMarking}
                            onChange={e => setGpField(g.gradeCode, 'graceMins', parseInt(e.target.value) || 0)}
                            style={{
                              ...inp, fontSize: 12, width: 70,
                              opacity: g.noLateMarking ? .5 : 1
                            }} />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <Toggle value={g.noLateMarking}
                            onChange={v => setGpField(g.gradeCode, 'noLateMarking', v)} />
                        </td>
                        <td style={{ padding: '6px 8px', width: 90 }}>
                          <input type="number" value={g.freeLateDays} min="0"
                            disabled={g.noLateMarking}
                            onChange={e => setGpField(g.gradeCode, 'freeLateDays', parseInt(e.target.value) || 0)}
                            style={{
                              ...inp, fontSize: 12, width: 70,
                              opacity: g.noLateMarking ? .5 : 1
                            }} />
                        </td>
                        <td style={{ padding: '6px 8px', width: 90 }}>
                          <input type="number" value={g.freeLateMaxMins} min="0"
                            disabled={g.noLateMarking}
                            onChange={e => setGpField(g.gradeCode, 'freeLateMaxMins', parseInt(e.target.value) || 0)}
                            style={{
                              ...inp, fontSize: 12, width: 70,
                              opacity: g.noLateMarking ? .5 : 1
                            }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <select value={g.deductType} disabled={g.noLateMarking}
                            onChange={e => setGpField(g.gradeCode, 'deductType', e.target.value)}
                            style={{
                              ...inp, fontSize: 11, cursor: 'pointer', width: 140,
                              opacity: g.noLateMarking ? .5 : 1
                            }}>
                            <option value="HALF_DAY">Half Day</option>
                            <option value="FULL_DAY">Full Day</option>
                            <option value="PROPORTIONAL">Proportional</option>
                          </select>
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <select value={g.accumulateRule} disabled={g.noLateMarking}
                            onChange={e => setGpField(g.gradeCode, 'accumulateRule', e.target.value)}
                            style={{
                              ...inp, fontSize: 11, cursor: 'pointer', width: 130,
                              opacity: g.noLateMarking ? .5 : 1
                            }}>
                            <option value="EACH_LATE">Each Late</option>
                            <option value="COUNT_BASED">Count Based</option>
                          </select>
                        </td>
                        <td style={{ padding: '6px 8px', width: 90 }}>
                          <input type="number" value={g.latesPerHalfDay} min="1"
                            disabled={g.noLateMarking || g.accumulateRule === 'EACH_LATE'}
                            onChange={e => setGpField(g.gradeCode, 'latesPerHalfDay', parseInt(e.target.value) || 1)}
                            style={{
                              ...inp, fontSize: 12, width: 70,
                              opacity: (g.noLateMarking || g.accumulateRule === 'EACH_LATE') ? .4 : 1
                            }} />
                        </td>
                        <td style={{ padding: '6px 8px', width: 90 }}>
                          <input type="number" value={g.latesPerFullDay} min="1"
                            disabled={g.noLateMarking || g.accumulateRule === 'EACH_LATE'}
                            onChange={e => setGpField(g.gradeCode, 'latesPerFullDay', parseInt(e.target.value) || 1)}
                            style={{
                              ...inp, fontSize: 12, width: 70,
                              opacity: (g.noLateMarking || g.accumulateRule === 'EACH_LATE') ? .4 : 1
                            }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div style={{
                marginTop: 16, background: '#F8F7FA', borderRadius: 8, padding: 12,
                border: '1px solid #E0D5E0'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#714B67', marginBottom: 8 }}>
                  📖 HOW IT WORKS — Example (G3)
                </div>
                {(() => {
                  const g3 = gp.find(g => g.gradeCode === 'G3') || {}
                  return (
                    <div style={{ fontSize: 11, color: '#6C757D', lineHeight: 1.8 }}>
                      Grace: <strong>{g3.graceMins} min</strong> →
                      First <strong>{g3.freeLateDays} lates ≤ {g3.freeLateMaxMins} min</strong> are FREE (warning only) →
                      After free buffer: <strong>{g3.deductType === 'HALF_DAY' ? 'Half Day deduction' : g3.deductType}</strong>
                      {g3.accumulateRule === 'COUNT_BASED' &&
                        ` → Every ${g3.latesPerHalfDay} lates = 1 Half Day, ${g3.latesPerFullDay} lates = 1 Full Day`}
                      → Resets every month
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid #E0D5E0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F7FA'
        }}>
          <div style={{ fontSize: 11, color: '#6C757D' }}>
            💡 Policy saved as DRAFT — submit for MD approval to activate
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{
              padding: '8px 20px', background: '#fff',
              color: '#6C757D', border: '1.5px solid #E0D5E0', borderRadius: 6, fontSize: 13, cursor: 'pointer'
            }}>
              Cancel</button>
            <button onClick={save} disabled={saving}
              style={{
                padding: '8px 24px', background: saving ? '#9E7D96' : '#714B67',
                color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer'
              }}>
              {saving ? '⏳ Saving...' : '💾 Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Approval Modal ─────────────────────────────────────────
function ApprovalModal({ policy, action, onDone, onCancel }) {
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)
  const isReject = action === 'reject'
  const doAction = async () => {
    if (isReject && !remarks) return toast.error('Rejection reason required!')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/hr-policy/${policy.id}/${action}`, {
        method: 'POST', headers: authHdrs(), body: JSON.stringify({ remarks })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      onDone()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, width: 460, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,.3)'
      }}>
        <div style={{
          background: isReject ? '#DC3545' : '#714B67', padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ color: '#fff', margin: 0, fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
            {action === 'approve' ? '✅ Approve Policy' : action === 'reject' ? '❌ Reject Policy' : '🟢 Activate Policy'}
          </h3>
          <span onClick={onCancel} style={{ color: '#fff', cursor: 'pointer', fontSize: 20 }}>✕</span>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: '#1C1C1C', marginBottom: 12 }}>
            <strong>{policy.policyNo}</strong> — {policy.name}
          </div>
          {action === 'activate' && (
            <div style={{
              background: '#FFF3CD', padding: '10px 12px', borderRadius: 6,
              fontSize: 12, color: '#856404', marginBottom: 12
            }}>
              ⚠️ This will <strong>archive the current active policy</strong> and make this one LIVE.
              All attendance and salary calculations will use the new policy immediately.
            </div>
          )}
          <label style={lbl}>Remarks {isReject ? '*' : ''}</label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
            style={{ ...inp, minHeight: 80, resize: 'vertical' }}
            placeholder={isReject ? 'Reason for rejection...' : 'Optional remarks...'} />
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
          <button onClick={doAction} disabled={saving}
            style={{
              padding: '8px 24px', border: 'none', borderRadius: 6, fontSize: 13,
              fontWeight: 700, cursor: 'pointer', color: '#fff',
              background: saving ? '#999' : isReject ? '#DC3545' : action === 'activate' ? '#28A745' : '#714B67'
            }}>
            {saving ? '⏳...' : action === 'approve' ? '✅ Approve' : action === 'reject' ? '❌ Reject' : '🟢 Activate Now'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────
export default function HRPolicyMaster() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPolicy, setEditPolicy] = useState(null)
  const [approval, setApproval] = useState(null) // {policy, action}
  const [expandLog, setExpandLog] = useState(null)

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/hr-policy`, { headers: authHdrs() })
      const data = await res.json()
      if (res.ok) setPolicies(data.data || [])
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPolicies() }, [])

  const activePolicy = policies.find(p => p.isActive)

  return (
    <div style={{ padding: 20, background: '#F8F7FA', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#1C1C1C', margin: 0 }}>
            HR Policy Engine
          </h2>
          <p style={{ fontSize: 12, color: '#6C757D', margin: '3px 0 0' }}>
            Company Admin defines policy → MD approves → System auto-applies
          </p>
        </div>
        <button onClick={() => { setEditPolicy(null); setShowForm(true) }}
          style={{
            padding: '8px 18px', background: '#714B67', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}>
          + New Policy
        </button>
      </div>

      {/* Active Policy Banner */}
      {activePolicy && (
        <div style={{
          background: '#D4EDDA', border: '1px solid #C3E6CB', borderRadius: 8,
          padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#155724', fontSize: 13 }}>
              🟢 ACTIVE POLICY: {activePolicy.policyNo} — {activePolicy.name}
            </div>
            <div style={{ fontSize: 11, color: '#155724', marginTop: 2 }}>
              Effective from {new Date(activePolicy.effectiveFrom).toLocaleDateString('en-IN')}
              &nbsp;|&nbsp; Approved by: {activePolicy.approvedBy || '—'}
              &nbsp;|&nbsp; All attendance & salary calculations use this policy
            </div>
          </div>
          <span style={{ fontSize: 24 }}>✅</span>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Policies', value: policies.length, color: '#714B67', bg: '#EDE0EA' },
          { label: 'Draft', value: policies.filter(p => p.status === 'DRAFT').length, color: '#6C757D', bg: '#F0EEF0' },
          { label: 'Pending Approval', value: policies.filter(p => p.status === 'PENDING').length, color: '#856404', bg: '#FFF3CD' },
          { label: 'Active', value: policies.filter(p => p.status === 'ACTIVE').length, color: '#155724', bg: '#D4EDDA' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: 8, padding: '12px 16px', border: `1px solid ${k.color}22` }}>
            <div style={{ fontSize: 11, color: k.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color, fontFamily: 'Syne,sans-serif' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Policy List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6C757D' }}>⏳ Loading...</div>
      ) : policies.length === 0 ? (
        <div style={{
          padding: 60, textAlign: 'center', color: '#6C757D',
          background: '#fff', borderRadius: 8, border: '2px dashed #E0D5E0'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>No HR Policies yet</div>
          <div style={{ fontSize: 12 }}>Click "+ New Policy" to create your first HR policy</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {policies.map(p => {
            const sc = STATUS_CONFIG[p.status] || {}
            const isExpanded = expandLog === p.id
            return (
              <div key={p.id} style={{
                background: '#fff', borderRadius: 8,
                border: p.isActive ? '2px solid #28A745' : '1px solid #E0D5E0',
                overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)'
              }}>
                {/* Policy Header Row */}
                <div style={{
                  padding: '14px 18px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{
                      fontFamily: 'DM Mono,monospace', fontSize: 12,
                      fontWeight: 700, color: '#714B67'
                    }}>{p.policyNo}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1C' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#6C757D', marginTop: 2 }}>
                        Effective: {new Date(p.effectiveFrom).toLocaleDateString('en-IN')}
                        {p.approvedBy && ` · Approved by ${p.approvedBy}`}
                        {p.rejectedBy && ` · Rejected: ${p.rejectRemarks}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 10, fontSize: 11,
                      fontWeight: 700, background: sc.bg, color: sc.text
                    }}>
                      {sc.icon} {sc.label}
                    </span>

                    {/* Actions per status */}
                    {p.status === 'DRAFT' && (
                      <>
                        <button onClick={() => { setEditPolicy(p); setShowForm(true) }}
                          style={{
                            padding: '5px 12px', background: '#714B67', color: '#fff',
                            border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer'
                          }}>Edit</button>
                        <button onClick={async () => {
                          if (!confirm('Submit for MD approval?')) return
                          const res = await fetch(`${BASE_URL}/hr-policy/${p.id}/submit`, { method: 'POST', headers: authHdrs(), body: '{}' })
                          const d = await res.json()
                          toast.success(d.message || 'Submitted!'); fetchPolicies()
                        }} style={{
                          padding: '5px 12px', background: '#856404', color: '#fff',
                          border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer'
                        }}>
                          Submit for Approval ⏳</button>
                      </>
                    )}
                    {p.status === 'PENDING' && (
                      <>
                        <button onClick={() => setApproval({ policy: p, action: 'approve' })}
                          style={{
                            padding: '5px 12px', background: '#28A745', color: '#fff',
                            border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer'
                          }}>✅ Approve</button>
                        <button onClick={() => setApproval({ policy: p, action: 'reject' })}
                          style={{
                            padding: '5px 12px', background: '#DC3545', color: '#fff',
                            border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer'
                          }}>❌ Reject</button>
                      </>
                    )}
                    {p.status === 'APPROVED' && (
                      <button onClick={() => setApproval({ policy: p, action: 'activate' })}
                        style={{
                          padding: '5px 14px', background: '#28A745', color: '#fff',
                          border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                        }}>
                        🟢 Activate Now</button>
                    )}
                    <button onClick={() => setExpandLog(isExpanded ? null : p.id)}
                      style={{
                        padding: '5px 12px', background: '#fff', color: '#6C757D',
                        border: '1px solid #E0D5E0', borderRadius: 5, fontSize: 11, cursor: 'pointer'
                      }}>
                      {isExpanded ? '▲ Hide' : '▼ Log'}
                    </button>
                  </div>
                </div>

                {/* Policy Summary */}
                <div style={{ padding: '0 18px 14px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {p.workerPolicy && (
                    <div style={{
                      background: '#FFF8F0', borderRadius: 6, padding: '8px 12px',
                      border: '1px solid #FFDCAA', fontSize: 11
                    }}>
                      <div style={{ fontWeight: 700, color: '#856404', marginBottom: 4 }}>👷 Worker/Contractor</div>
                      <div style={{ color: '#6C757D', lineHeight: 1.7 }}>
                        Grace: <strong>{p.workerPolicy.graceMins}min</strong> ·
                        Late: <strong>{p.workerPolicy.lateRule}</strong> ·
                        OT: <strong>{p.workerPolicy.otEligible ? 'Yes' : 'No'}</strong> ·
                        Leave: <strong>{p.workerPolicy.leaveEnabled ? 'Yes' : 'No'}</strong>
                      </div>
                    </div>
                  )}
                  {p.staffPolicy && (
                    <div style={{
                      background: '#F0F8FF', borderRadius: 6, padding: '8px 12px',
                      border: '1px solid #AAD4F5', fontSize: 11
                    }}>
                      <div style={{ fontWeight: 700, color: '#0C5460', marginBottom: 4 }}>👔 Staff</div>
                      <div style={{ color: '#6C757D', lineHeight: 1.7 }}>
                        Work Days: <strong>{p.staffPolicy.workingDaysMonth}</strong> ·
                        Perm: <strong>{p.staffPolicy.permEnabled ? `${p.staffPolicy.permMonthlyHrs}hrs/mo` : 'No'}</strong> ·
                        Leave: <strong>{p.staffPolicy.leaveEnabled ? 'Yes' : 'No'}</strong> ·
                        OT: <strong>{p.staffPolicy.otEligible ? 'Yes' : 'No'}</strong>
                      </div>
                    </div>
                  )}
                  {p.gradePolicies?.length > 0 && (
                    <div style={{
                      background: '#F8F4F8', borderRadius: 6, padding: '8px 12px',
                      border: '1px solid #D4BFCF', fontSize: 11
                    }}>
                      <div style={{ fontWeight: 700, color: '#714B67', marginBottom: 4 }}>🏷️ Grade Rules</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {p.gradePolicies.map(g => (
                          <span key={g.gradeCode} style={{
                            padding: '2px 8px', borderRadius: 10,
                            background: g.noLateMarking ? '#EDE0EA' : '#F0EEF0',
                            color: g.noLateMarking ? '#714B67' : '#6C757D', fontSize: 10, fontWeight: 600
                          }}>
                            {g.gradeCode}: {g.noLateMarking ? 'Flex' : g.graceMins + 'm grace, ' + g.freeLateDays + ' free'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Approval Log */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid #F0EEF0', padding: '12px 18px',
                    background: '#FDFBFD'
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: '#714B67',
                      marginBottom: 8, textTransform: 'uppercase', letterSpacing: .4
                    }}>
                      📋 Approval Log
                    </div>
                    {p.approvalLog?.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#6C757D' }}>No log entries yet</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {p.approvalLog?.map(log => (
                          <div key={log.id} style={{
                            display: 'flex', gap: 12, fontSize: 11,
                            alignItems: 'flex-start'
                          }}>
                            <span style={{
                              color: '#6C757D', whiteSpace: 'nowrap',
                              fontFamily: 'DM Mono,monospace'
                            }}>
                              {new Date(log.createdAt).toLocaleDateString('en-IN')}
                            </span>
                            <span style={{
                              padding: '1px 8px', borderRadius: 10, fontSize: 10,
                              fontWeight: 700, whiteSpace: 'nowrap',
                              background: log.action === 'ACTIVATED' ? '#D4EDDA' : log.action === 'APPROVED' ? '#D1ECF1' : log.action === 'REJECTED' ? '#F8D7DA' : '#F0EEF0',
                              color: log.action === 'ACTIVATED' ? '#155724' : log.action === 'APPROVED' ? '#0C5460' : log.action === 'REJECTED' ? '#721C24' : '#6C757D'
                            }}>{log.action}</span>
                            <span style={{ color: '#495057' }}>by <strong>{log.byUser}</strong></span>
                            {log.remarks && <span style={{ color: '#6C757D' }}>— {log.remarks}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <PolicyForm policy={editPolicy}
          onSave={() => { setShowForm(false); setEditPolicy(null); fetchPolicies() }}
          onCancel={() => { setShowForm(false); setEditPolicy(null) }} />
      )}
      {approval && (
        <ApprovalModal policy={approval.policy} action={approval.action}
          onDone={() => { setApproval(null); fetchPolicies() }}
          onCancel={() => setApproval(null)} />
      )}
    </div>
  )
}
