import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })

const CERT_TYPES = ['All', 'COC', 'Test Report', 'COC + NABL', 'Mill Certificate']

export default function CertificateList() {
  const nav = useNavigate()
  const [certs,   setCerts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('All')
  const [modal,   setModal]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Certificates come from PASSED inspection lots
      const res  = await fetch(`${BASE_URL}/qm/inspection?result=PASS`, { headers: hdr2() })
      const data = await res.json()
      const lots = data.data || []

      // Map inspection lots → certificates
      const mapped = lots
        .filter(l => l.result === 'PASS' || l.result === 'PARTIAL')
        .map(l => ({
          id:        l.id,
          certNo:    l.hasCert ? `COC-${l.lotNo}` : `TR-${l.lotNo}`,
          lotNo:     l.lotNo,
          date:      l.inspDate || l.createdAt,
          customer:  l.source === 'SD' ? 'Customer' : 'Internal',
          product:   l.itemName,
          qty:       `${l.lotQty} ${l.unit}`,
          yieldPct:  `${l.yieldPct || 100}%`,
          type:      l.hasCert ? 'COC' : 'Test Report',
          result:    l.result,
          inspector: l.inspector,
          validUntil: (() => {
            const d = new Date(l.inspDate || l.createdAt)
            d.setDate(d.getDate() + 30)
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
          })(),
        }))

      setCerts(mapped)
    } catch { toast.error('Failed to load certificates') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const shown = certs.filter(c => {
    const mt = filter === 'All' || c.type === filter
    const ms = !search || c.certNo.toLowerCase().includes(search.toLowerCase()) || c.product?.toLowerCase().includes(search.toLowerCase()) || c.customer?.toLowerCase().includes(search.toLowerCase())
    return mt && ms
  })

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">COC / Test Certificates <small>Quality Certificates Issued</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="Search cert / product..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm">Bulk Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/inspection/new')}>New Inspection</button>
        </div>
      </div>

      {/* Type chips */}
      <div className="pp-chips">
        {CERT_TYPES.map(t => (
          <div key={t} className={`pp-chip${filter === t ? ' on' : ''}`} onClick={() => setFilter(t)}>
            {t} <span>{t === 'All' ? certs.length : certs.filter(c => c.type === t).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Cert No.</th><th>Lot No.</th><th>Date</th><th>Customer</th>
          <th>Product</th><th>Qty</th><th>Yield</th><th>Type</th><th>Valid Until</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading
            ? <tr><td colSpan={10} style={{ padding: 30, textAlign: 'center' }}>Loading...</td></tr>
            : shown.length === 0
            ? (
              <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontWeight: 700, color: '#333' }}>No certificates yet</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  Certificates are auto-generated from passed inspection lots.
                  <br/>Create an inspection in the Inspection Register and mark it PASS.
                </div>
                <button className="btn btn-p sd-bsm" style={{ marginTop: 12 }} onClick={() => nav('/qm/inspection/new')}>
                  New Inspection
                </button>
              </td></tr>
            )
            : shown.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setModal(c)}>
                <td><strong style={{ fontFamily: 'DM Mono,monospace', fontSize: 12, color: 'var(--odoo-purple)' }}>{c.certNo}</strong></td>
                <td style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: 'var(--odoo-blue)' }}>{c.lotNo}</td>
                <td style={{ fontSize: 11 }}>{new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                <td style={{ fontSize: 12, fontWeight: 600 }}>{c.customer}</td>
                <td style={{ fontSize: 12 }}>{c.product}</td>
                <td style={{ fontFamily: 'DM Mono,monospace', fontSize: 11 }}>{c.qty}</td>
                <td>
                  <span style={{ fontFamily: 'DM Mono,monospace', fontWeight: 700, color: parseFloat(c.yieldPct) >= 98 ? '#155724' : '#856404' }}>{c.yieldPct}</span>
                </td>
                <td>
                  <span style={{ background: '#EDE0EA', color: '#714B67', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{c.type}</span>
                </td>
                <td style={{ fontSize: 11, color: '#6C757D' }}>{c.validUntil}</td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-xs" onClick={() => setModal(c)}>View</button>
                    <button className="btn-xs pri">Print</button>
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>

      {/* Certificate preview modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, width: 560, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            {/* Cert header */}
            <div style={{ background: '#714B67', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, color: '#fff', fontSize: 16 }}>CERTIFICATE OF CONFORMANCE</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{modal.certNo} · {new Date(modal.date).toLocaleDateString('en-IN')}</div>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: 20 }}>&#x2715;</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 16, fontStyle: 'italic', fontSize: 12, color: '#6C757D' }}>
                This certifies that the goods described below have been inspected and found to conform to all applicable specifications.
              </div>
              {[
                ['Certificate No.', modal.certNo],
                ['Inspection Lot', modal.lotNo],
                ['Product', modal.product],
                ['Quantity', modal.qty],
                ['Inspection Result', modal.result],
                ['Yield / Pass Rate', modal.yieldPct],
                ['Inspector', modal.inspector || 'QC Dept'],
                ['Issue Date', new Date(modal.date).toLocaleDateString('en-IN')],
                ['Valid Until', modal.validUntil],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F0EEF0', fontSize: 13 }}>
                  <span style={{ color: '#6C757D', fontWeight: 600 }}>{l}</span>
                  <span style={{ fontWeight: 700 }}>{v || '—'}</span>
                </div>
              ))}
              <div style={{ marginTop: 20, padding: '12px', background: '#D4EDDA', borderRadius: 6, textAlign: 'center', color: '#155724', fontWeight: 700 }}>
                ✓ PASSED — APPROVED FOR DISPATCH
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-s sd-bsm" onClick={() => setModal(null)}>Close</button>
                <button className="btn btn-p sd-bsm" onClick={() => window.print()}>Print Certificate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
