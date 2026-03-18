import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MONTHLY_ATTENDANCE = [
  { m:'Oct', present:142, absent:8,  leave:6,  late:12, ot:18, strength:156 },
  { m:'Nov', present:148, absent:5,  leave:8,  late:9,  ot:22, strength:161 },
  { m:'Dec', present:138, absent:12, leave:10, late:14, ot:15, strength:160 },
  { m:'Jan', present:151, absent:4,  leave:7,  late:8,  ot:24, strength:162 },
  { m:'Feb', present:145, absent:7,  leave:9,  late:11, ot:20, strength:161 },
  { m:'Mar', present:153, absent:3,  leave:6,  late:7,  ot:28, strength:162 },
]

const DEPT_STRENGTH = [
  { dept:'Production',  strength:68, present:65, absent:2, leave:1, payroll:3264000 },
  { dept:'Maintenance', strength:18, present:17, absent:0, leave:1, payroll:918000  },
  { dept:'Quality',     strength:12, present:12, absent:0, leave:0, payroll:648000  },
  { dept:'HR & Admin',  strength:8,  present:7,  absent:1, leave:0, payroll:560000  },
  { dept:'Finance',     strength:6,  present:6,  absent:0, leave:0, payroll:480000  },
  { dept:'Sales',       strength:10, present:9,  absent:0, leave:1, payroll:650000  },
  { dept:'Purchase',    strength:6,  present:6,  absent:0, leave:0, payroll:390000  },
  { dept:'Transport',   strength:8,  present:8,  absent:0, leave:0, payroll:360000  },
  { dept:'IT / ERP',    strength:4,  present:4,  absent:0, leave:0, payroll:340000  },
  { dept:'Management',  strength:10, present:10, absent:0, leave:0, payroll:1800000 },
]

const LEAVE_SUMMARY = [
  { type:'Casual Leave (CL)',    entitled:12, availed:3.2, balance:8.8, enc:0   },
  { type:'Sick Leave (SL)',      entitled:12, availed:2.1, balance:9.9, enc:0   },
  { type:'Earned Leave (EL)',    entitled:15, availed:4.8, balance:10.2,enc:2.1 },
  { type:'Maternity Leave (ML)', entitled:26, availed:0,   balance:26,  enc:0   },
  { type:'Loss of Pay (LOP)',    entitled:0,  availed:0.8, balance:0,   enc:0   },
]

const PAYROLL_SUMMARY = [
  { m:'Oct', gross:9210000, deductions:1842000, net:7368000, heads:156 },
  { m:'Nov', m_:'Nov', gross:9540000, deductions:1908000, net:7632000, heads:161 },
  { m:'Dec', gross:9350000, deductions:1870000, net:7480000, heads:160 },
  { m:'Jan', gross:9720000, deductions:1944000, net:7776000, heads:162 },
  { m:'Feb', gross:9580000, deductions:1916000, net:7664000, heads:161 },
  { m:'Mar', gross:9410000, deductions:1882000, net:7528000, heads:162 },
]

const fmtL = n => '₹' + (n / 100000).toFixed(1) + 'L'
const maxPR = Math.max(...PAYROLL_SUMMARY.map(p => p.gross))

export default function HRReport() {
  const nav = useNavigate()
  const [view, setView] = useState('attendance')

  const lastMth = MONTHLY_ATTENDANCE[MONTHLY_ATTENDANCE.length - 1]
  const totalStrength = DEPT_STRENGTH.reduce((s, d) => s + d.strength, 0)
  const totalPayroll  = DEPT_STRENGTH.reduce((s, d) => s + d.payroll, 0)
  const avgAttendance = ((lastMth.present / lastMth.strength) * 100).toFixed(1)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">HR Report <small>HCM Module · People Analytics</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select">
            <option>FY 2025-26</option><option>Q4 FY26</option>
          </select>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/print/payslip')}>Print Payslip</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{ gridTemplateColumns:'repeat(5,1fr)', marginBottom:16 }}>
        {[
          { cls:'purple', l:'Total Headcount',    v:totalStrength, s:'As of Mar 2026'     },
          { cls:'green',  l:'Attendance % (MTD)', v:avgAttendance+'%', s:'Mar 2026'       },
          { cls:'blue',   l:'Monthly Payroll',    v:fmtL(totalPayroll), s:'Gross MTD'     },
          { cls:'orange', l:'OT Hours',           v:lastMth.ot+'h',    s:'This month'    },
          { cls:'red',    l:'LOP / Absent',       v:lastMth.absent,    s:'This month'    },
        ].map(k => (
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[
          ['attendance', '📅 Attendance'],
          ['dept',       '🏭 Dept-wise'],
          ['leave',      '🌴 Leave Summary'],
          ['payroll',    '💰 Payroll Trend'],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)}
            style={{ padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600,
              cursor:'pointer', border:'1px solid var(--odoo-border)',
              background: view===k ? 'var(--odoo-purple)' : '#fff',
              color: view===k ? '#fff' : 'var(--odoo-gray)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Attendance Monthly */}
      {view === 'attendance' && (
        <div>
          <div style={{ background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
            padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
            <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:14 }}>
              📅 Monthly Attendance Trend
            </h4>
            <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:120 }}>
              {MONTHLY_ATTENDANCE.map((m, i) => {
                const pct = (m.present / m.strength) * 100
                const h   = (pct / 100) * 110
                const isLast = i === MONTHLY_ATTENDANCE.length - 1
                return (
                  <div key={m.m} style={{ flex:1, display:'flex', flexDirection:'column',
                    alignItems:'center', gap:3 }}>
                    <span style={{ fontSize:9, fontWeight:700,
                      color: isLast ? 'var(--odoo-purple)' : 'var(--odoo-gray)' }}>
                      {pct.toFixed(0)}%
                    </span>
                    <div style={{ width:'100%', height:h, borderRadius:'4px 4px 0 0',
                      background: isLast ? 'var(--odoo-purple)' : '#C4A4BB' }} />
                    <span style={{ fontSize:9, color: isLast ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
                      fontWeight: isLast ? 700 : 400 }}>{m.m}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <table className="fi-data-table">
            <thead>
              <tr>
                <th>Month</th><th>Strength</th><th>Present</th><th>Absent</th>
                <th>On Leave</th><th>Late</th><th>OT Hours</th><th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {MONTHLY_ATTENDANCE.map((m, i) => {
                const pct = ((m.present / m.strength) * 100).toFixed(1)
                return (
                  <tr key={m.m} style={{ background: i === MONTHLY_ATTENDANCE.length-1 ? '#EDE0EA' : '',
                    fontWeight: i === MONTHLY_ATTENDANCE.length-1 ? 700 : 400 }}>
                    <td style={{ fontWeight:600 }}>{m.m}</td>
                    <td style={{ textAlign:'center' }}>{m.strength}</td>
                    <td style={{ textAlign:'center', color:'var(--odoo-green)', fontWeight:600 }}>{m.present}</td>
                    <td style={{ textAlign:'center', color: m.absent > 5 ? 'var(--odoo-red)' : 'var(--odoo-dark)' }}>{m.absent}</td>
                    <td style={{ textAlign:'center' }}>{m.leave}</td>
                    <td style={{ textAlign:'center', color: m.late > 10 ? 'var(--odoo-orange)' : 'inherit' }}>{m.late}</td>
                    <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace' }}>{m.ot}h</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ flex:1, height:5, background:'var(--odoo-border)', borderRadius:3 }}>
                          <div style={{ height:'100%', borderRadius:3,
                            background: parseFloat(pct) > 95 ? 'var(--odoo-green)' : parseFloat(pct) > 85 ? 'var(--odoo-orange)' : 'var(--odoo-red)',
                            width: pct + '%' }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, minWidth:36 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dept-wise */}
      {view === 'dept' && (
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>Department</th><th>Strength</th><th>Present</th><th>Absent</th>
              <th>On Leave</th><th>Attendance %</th><th>Monthly Payroll</th>
            </tr>
          </thead>
          <tbody>
            {DEPT_STRENGTH.map(d => {
              const pct = ((d.present / d.strength) * 100).toFixed(0)
              return (
                <tr key={d.dept}>
                  <td style={{ fontWeight:700 }}>{d.dept}</td>
                  <td style={{ textAlign:'center', fontWeight:600 }}>{d.strength}</td>
                  <td style={{ textAlign:'center', color:'var(--odoo-green)', fontWeight:600 }}>{d.present}</td>
                  <td style={{ textAlign:'center', color: d.absent > 0 ? 'var(--odoo-red)' : 'var(--odoo-gray)' }}>{d.absent || '—'}</td>
                  <td style={{ textAlign:'center' }}>{d.leave || '—'}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:60, height:5, background:'var(--odoo-border)', borderRadius:3 }}>
                        <div style={{ height:'100%', borderRadius:3, background:'var(--odoo-green)', width: pct + '%' }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:600 }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)' }}>
                    {fmtL(d.payroll)}
                  </td>
                </tr>
              )
            })}
            <tr style={{ background:'var(--odoo-purple)', color:'#fff', fontWeight:700 }}>
              <td style={{ padding:'10px 12px', fontFamily:'Syne,sans-serif' }}>TOTAL</td>
              <td style={{ padding:'10px 12px', textAlign:'center' }}>{totalStrength}</td>
              <td colSpan={3} />
              <td style={{ padding:'10px 12px' }}>
                {((DEPT_STRENGTH.reduce((s,d)=>s+d.present,0)/totalStrength)*100).toFixed(0)}%
              </td>
              <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace', fontSize:13 }}>
                {fmtL(totalPayroll)}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Leave Summary */}
      {view === 'leave' && (
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>Leave Type</th><th>Annual Entitlement</th><th>Availed (Avg)</th>
              <th>Balance (Avg)</th><th>Encashed</th><th>Utilisation %</th>
            </tr>
          </thead>
          <tbody>
            {LEAVE_SUMMARY.map(l => {
              const util = l.entitled > 0 ? ((l.availed / l.entitled) * 100).toFixed(0) : 0
              return (
                <tr key={l.type}>
                  <td style={{ fontWeight:700 }}>{l.type}</td>
                  <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace' }}>{l.entitled || '—'}</td>
                  <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace', color:'var(--odoo-orange)', fontWeight:600 }}>{l.availed}</td>
                  <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace', color:'var(--odoo-green)', fontWeight:600 }}>{l.balance}</td>
                  <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace' }}>{l.enc || '—'}</td>
                  <td>
                    {l.entitled > 0 ? (
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:80, height:5, background:'var(--odoo-border)', borderRadius:3 }}>
                          <div style={{ height:'100%', borderRadius:3,
                            background: parseInt(util) > 70 ? 'var(--odoo-orange)' : 'var(--odoo-green)',
                            width: Math.min(parseInt(util), 100) + '%' }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:600 }}>{util}%</span>
                      </div>
                    ) : <span style={{ color:'var(--odoo-gray)' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Payroll Trend */}
      {view === 'payroll' && (
        <div>
          <div style={{ background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
            padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
            <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:14 }}>
              💰 Monthly Payroll Trend
            </h4>
            <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:120 }}>
              {PAYROLL_SUMMARY.map((p, i) => {
                const h = (p.gross / maxPR) * 110
                const isLast = i === PAYROLL_SUMMARY.length - 1
                return (
                  <div key={p.m} style={{ flex:1, display:'flex', flexDirection:'column',
                    alignItems:'center', gap:3 }}>
                    <span style={{ fontSize:9, fontWeight:700,
                      color: isLast ? 'var(--odoo-purple)' : 'var(--odoo-gray)' }}>
                      {fmtL(p.gross)}
                    </span>
                    <div style={{ width:'100%', height:h, borderRadius:'4px 4px 0 0',
                      background: isLast ? 'var(--odoo-purple)' : '#C4A4BB' }} />
                    <span style={{ fontSize:9, color: isLast ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
                      fontWeight: isLast ? 700 : 400 }}>{p.m}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <table className="fi-data-table">
            <thead>
              <tr><th>Month</th><th>Headcount</th><th>Gross Payroll</th><th>Deductions</th><th>Net Payroll</th><th>Avg CTC/Head</th></tr>
            </thead>
            <tbody>
              {PAYROLL_SUMMARY.map((p, i) => (
                <tr key={p.m} style={{ background: i === PAYROLL_SUMMARY.length-1 ? '#EDE0EA' : '',
                  fontWeight: i === PAYROLL_SUMMARY.length-1 ? 700 : 400 }}>
                  <td style={{ fontWeight:600 }}>{p.m}</td>
                  <td style={{ textAlign:'center' }}>{p.heads}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)' }}>{fmtL(p.gross)}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', color:'var(--odoo-red)' }}>{fmtL(p.deductions)}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-green)' }}>{fmtL(p.net)}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', color:'var(--odoo-gray)' }}>
                    {fmtL(Math.round(p.gross / p.heads))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
