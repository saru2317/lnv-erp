import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const CHIPS = ['All', 'Open', 'CAPA Open', 'Critical', 'Closed']

export default function NCRList() {
  const nav = useNavigate()
  const [chip,    setChip]  = useState('All')
  const [ncrs,    setNCRs]  = useState([])
  const [loading, setLoad]  = useState(true)
  const [search,  setSearch]= useState('')

  const loadNCRs = useCallback(async () => {
    setLoad(true)
    try {
      const res  = await fetch(`${BASE_URL}/qm/ncr`,
        { headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      setNCRs(data.data || [])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoad(false)
    }
  }, [])

  useEffect(() => { loadNCRs() }, [loadNCRs])

  // chip count helper — uses state var `ncrs`
  const chipCount = (c) => {
    if (c === 'All') return ncrs.length
    if (c === 'Critical') return ncrs.filter(n => n.severity === 'Critical').length
    return ncrs.filter(n => n.status === c).length
  }

  const filtered = ncrs.filter(n => {
    const matchChip =
      chip === 'All' ||
      (chip === 'Critical' ? n.severity === 'Critical' : n.status === chip)
    const matchSearch =
      !search ||
      n.ncrNo?.toLowerCase().includes(search.toLowerCase()) ||
      n.itemName?.toLowerCase().includes(search.toLowerCase())
    return matchChip && matchSearch
  })

  const severityClr = s =>
    s === 'Critical' ? 'var(--odoo-red)' :
    s === 'Major'    ? 'var(--odoo-orange)' :
                       'var(--odoo-blue)'

  const statusBadge = n => {
    if (n.status === 'Closed')     return 'badge-pass'
    if (n.status === 'CAPA Open')  return 'badge-wip'
    if (n.severity === 'Critical') return 'badge-critical'
    return 'badge-open'
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">NCR Register <small>Non-Conformance Reports</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/ncr/new')}>Raise NCR</button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 0 4px' }}>
        <input
          className="sd-search"
          placeholder="Search NCR No. or Material..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
      </div>

      {/* Chips — uses `ncrs` state, NOT undefined NCRS */}
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
            <th>NCR No.</th><th>Date</th><th>Source</th><th>Material</th>
            <th>Issue</th><th>Severity</th><th>Assigned To</th><th>CAPA</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? <tr><td colSpan={10} style={{ padding: 30, textAlign: 'center' }}>⏳ Loading...</td></tr>
            : filtered.length === 0
            ? <tr><td colSpan={10} style={{ padding: 30, textAlign: 'center', color: '#6C757D' }}>No NCRs found</td></tr>
            : filtered.map(n => (
              <tr
                key={n.id}
                style={{ cursor: 'pointer', background: n.severity === 'Critical' ? '#FFF5F5' : 'inherit' }}
                onClick={() => nav(`/qm/ncr/${n.id}`)}
              >
                <td>
                  <strong style={{ fontFamily: 'DM Mono,monospace', fontSize: '12px', color: 'var(--odoo-purple)' }}>
                    {n.ncrNo}
                  </strong>
                </td>
                <td>{new Date(n.date || n.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <span style={{ background: '#EDE0EA', color: 'var(--odoo-purple)', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                    {n.source}
                  </span>
                </td>
                <td><strong>{n.itemName}</strong></td>
                <td style={{ fontSize: '12px', maxWidth: '200px' }}>{n.description}</td>
                <td>
                  <span style={{ fontWeight: '700', fontSize: '12px', color: severityClr(n.severity) }}>
                    {n.severity}
                  </span>
                </td>
                <td>{n.assignedTo || '—'}</td>
                <td style={{
                  fontFamily: 'DM Mono,monospace', fontSize: '11px',
                  color: n.capaNo ? 'var(--odoo-blue)' : 'var(--odoo-gray)',
                  fontWeight: n.capaNo ? '700' : '400'
                }}>
                  {n.capaNo || '—'}
                </td>
                <td><span className={`badge ${statusBadge(n)}`}>{n.status}</span></td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-xs" onClick={() => nav(`/qm/ncr/${n.id}`)}>View</button>
                    {!n.capaNo && (
                      <button className="btn-xs pri" onClick={() => nav('/qm/capa/new')}>CAPA</button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}
