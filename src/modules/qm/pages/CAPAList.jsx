import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const CHIPS = ['All', 'In Progress', 'Closed']

export default function CAPAList() {
  const nav = useNavigate()
  const [chip,    setChip]  = useState('All')
  const [capas,   setCAPAs] = useState([])
  const [loading, setLoad]  = useState(true)

  const loadCAPAs = useCallback(async () => {
    setLoad(true)
    try {
      const res  = await fetch(`${BASE_URL}/qm/capa`,
        { headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      setCAPAs(data.data || [])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoad(false)
    }
  }, [])

  useEffect(() => { loadCAPAs() }, [loadCAPAs])

  const chipCount = (c) =>
    c === 'All' ? capas.length : capas.filter(x => x.status === c).length

  const filtered = chip === 'All' ? capas : capas.filter(c => c.status === chip)

  const progressColor = (p) =>
    p === 100 ? 'var(--odoo-green)' :
    p >= 70   ? 'var(--odoo-orange)' :
                'var(--odoo-blue)'

  const isDuePast = (due, status) => {
    if (status === 'Closed') return false
    if (!due) return false
    return new Date(due) < new Date()
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">CAPA List <small>Corrective &amp; Preventive Actions</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/capa/new')}>New CAPA</button>
        </div>
      </div>

      {/* Chips */}
      <div className="pp-chips">
        {CHIPS.map(c => (
          <div key={c} className={`pp-chip${chip === c ? ' on' : ''}`} onClick={() => setChip(c)}>
            {c} <span>{chipCount(c)}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead>
          <tr>
            <th>CAPA No.</th><th>NCR Ref</th><th>Type</th><th>Issue</th>
            <th>Action</th><th>Owner</th><th>Due</th><th>Progress</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? <tr><td colSpan={9} style={{ padding: 30, textAlign: 'center' }}>⏳ Loading...</td></tr>
            : filtered.length === 0
            ? <tr><td colSpan={9} style={{ padding: 30, textAlign: 'center', color: '#6C757D' }}>No CAPAs found</td></tr>
            : filtered.map(c => (
              <tr
                key={c.id}
                style={{ cursor: 'pointer' }}
                onClick={() => nav(`/qm/capa/${c.id}`)}
              >
                <td>
                  <strong style={{ fontFamily: 'DM Mono,monospace', fontSize: '12px', color: 'var(--odoo-purple)' }}>
                    {c.capaNo}
                  </strong>
                </td>
                <td style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: 'var(--odoo-orange)' }}>
                  {c.ncrNo || c.ncrRef || '—'}
                </td>
                <td>
                  <span style={{
                    background: c.type === 'Corrective' ? '#F8D7DA' : '#D4EDDA',
                    color:      c.type === 'Corrective' ? '#721C24' : '#155724',
                    padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700'
                  }}>
                    {c.type}
                  </span>
                </td>
                <td style={{ fontSize: '12px' }}>{c.issue}</td>
                <td style={{ fontSize: '12px' }}>{c.action}</td>
                <td>{c.owner || c.assignedTo || '—'}</td>
                <td style={{
                  color:      isDuePast(c.dueDate, c.status) ? 'var(--odoo-red)' : 'inherit',
                  fontWeight: isDuePast(c.dueDate, c.status) ? '700' : '400'
                }}>
                  {c.dueDate ? new Date(c.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="yield-bar" style={{ width: '60px' }}>
                      <div
                        className="yield-fill"
                        style={{ width: `${c.progress || 0}%`, background: progressColor(c.progress || 0) }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700' }}>{c.progress || 0}%</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${c.status === 'Closed' ? 'badge-closed' : 'badge-wip'}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}
