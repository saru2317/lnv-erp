import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE   = import.meta.env.VITE_API_URL || '/api'
const getToken = () => localStorage.getItem('lnv_token') || ''
const hdr    = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })
const api    = (path, opts) => fetch(`${BASE}${path}`, { headers: hdr(), ...opts }).then(r => r.json())

const STATUS_COLOR = {
  GENERATED:  { bg: '#D4EDDA', color: '#155724' },
  CANCELLED:  { bg: '#F8D7DA', color: '#721C24' },
  PENDING:    { bg: '#FFF3CD', color: '#856404' },
  DRAFT:      { bg: '#E2E3E5', color: '#383D41' },
}

export default function EInvoice() {
  const curYear = new Date().getFullYear()
  const [from,    setFrom]    = useState(`${curYear}-04-01`)
  const [to,      setTo]      = useState(new Date().toISOString().slice(0, 10))
  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [sandbox,  setSandbox]  = useState(true)
  const [genId,    setGenId]    = useState(null)   // generating state
  const [selected, setSelected] = useState(null)   // IRN detail modal
  const [ewbModal, setEwbModal] = useState(null)   // EWB modal for DC

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api(`/einvoice/list?from=${from}&to=${to}`)
      setInvoices(d.data || [])
      setSandbox(d.sandbox ?? true)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [from, to])

  useEffect(() => { load() }, [load])

  const generateIRN = async (inv) => {
    if (inv.irn) return toast.error('IRN already generated')
    setGenId(inv.id)
    try {
      const d = await api(`/einvoice/generate/${inv.id}`, { method: 'POST' })
      if (d.error) throw new Error(d.error)
      toast.success(`IRN generated: ${d.irn?.slice(0, 16)}...`)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setGenId(null) }
  }

  const cancelIRN = async (inv) => {
    if (!inv.irn) return
    if (!confirm(`Cancel IRN for ${inv.invoiceNo}? This cannot be undone.`)) return
    try {
      const d = await api(`/einvoice/cancel/${inv.id}`, { method: 'POST', body: JSON.stringify({ reason: '1', remark: 'Cancelled by user' }) })
      if (d.error) throw new Error(d.error)
      toast.success('IRN cancelled')
      load()
    } catch (e) { toast.error(e.message) }
  }

  const stats = {
    total:     invoices.length,
    generated: invoices.filter(i => i.eInvStatus === 'GENERATED').length,
    pending:   invoices.filter(i => !i.eInvStatus || i.eInvStatus === 'PENDING').length,
    cancelled: invoices.filter(i => i.eInvStatus === 'CANCELLED').length,
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: '#714B67' }}>📄 e-Invoice (IRN)</h2>
          <small style={{ color: '#888' }}>GST · Invoice Reference Number Generation</small>
        </div>
        {sandbox && (
          <span style={{ background: '#FFF3CD', color: '#856404', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            🧪 SANDBOX MODE
          </span>
        )}
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Invoices', value: stats.total,     color: '#714B67' },
          { label: 'IRN Generated',  value: stats.generated, color: '#28A745' },
          { label: 'Pending',        value: stats.pending,   color: '#FFC107' },
          { label: 'Cancelled',      value: stats.cancelled, color: '#DC3545' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
        <span style={{ color: '#888' }}>to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
        <button onClick={load} style={{ padding: '6px 16px', background: '#714B67', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#714B67', color: '#fff' }}>
              {['Invoice No','Date','Customer','GSTIN','Amount','Invoice Status','IRN Status','IRN No','Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#888' }}>⏳ Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#888' }}>No invoices found for selected period</td></tr>
            ) : invoices.map((inv, i) => {
              const irnSt  = inv.eInvStatus || 'PENDING'
              const stClr  = STATUS_COLOR[irnSt] || STATUS_COLOR.PENDING
              const invStC = STATUS_COLOR[inv.status] || STATUS_COLOR.DRAFT
              return (
                <tr key={inv.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9F6F8', borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600, color: '#714B67' }}>{inv.invoiceNo}</td>
                  <td style={{ padding: '9px 12px' }}>{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '9px 12px' }}>{inv.customerName || '—'}</td>
                  <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11 }}>{inv.customerGstin || 'URP'}</td>
                  <td style={{ padding: '9px 12px', fontWeight: 600 }}>₹{parseFloat(inv.grandTotal || inv.totalAmt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ ...invStC, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{inv.status}</span>
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ ...stClr, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{irnSt}</span>
                  </td>
                  <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.irn ? (
                      <span title={inv.irn} style={{ cursor: 'pointer', color: '#28A745' }} onClick={() => setSelected(inv)}>
                        {inv.irn.slice(0, 16)}...
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!inv.irn && (
                        <button onClick={() => generateIRN(inv)} disabled={genId === inv.id}
                          style={{ padding: '4px 10px', background: '#28A745', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                          {genId === inv.id ? '⏳' : '⚡ Gen IRN'}
                        </button>
                      )}
                      {inv.irn && inv.eInvStatus === 'GENERATED' && (
                        <>
                          <button onClick={() => setSelected(inv)}
                            style={{ padding: '4px 10px', background: '#714B67', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>
                            👁 View
                          </button>
                          <button onClick={() => cancelIRN(inv)}
                            style={{ padding: '4px 10px', background: '#DC3545', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>
                            ✕ Cancel
                          </button>
                        </>
                      )}
                      {inv.eInvStatus === 'CANCELLED' && (
                        <span style={{ color: '#DC3545', fontSize: 11 }}>Cancelled</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* IRN Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 520, maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: '#714B67' }}>📄 IRN Details — {selected.invoiceNo}</h3>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              {[
                ['Invoice No',   selected.invoiceNo],
                ['IRN',          selected.irn],
                ['Ack No',       selected.ackNo || '—'],
                ['Ack Date',     selected.ackDate ? new Date(selected.ackDate).toLocaleString('en-IN') : '—'],
                ['Status',       selected.eInvStatus],
                ['Customer',     selected.customerName],
                ['GSTIN',        selected.customerGstin || 'URP'],
                ['Amount',       `₹${parseFloat(selected.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '7px 8px', color: '#888', width: 120 }}>{k}</td>
                  <td style={{ padding: '7px 8px', fontFamily: k === 'IRN' || k === 'Ack No' ? 'monospace' : 'inherit', fontSize: k === 'IRN' ? 11 : 13, wordBreak: 'break-all' }}>{v}</td>
                </tr>
              ))}
            </table>
            {selected.qrCode && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <img src={selected.qrCode} alt="QR Code" style={{ width: 120, height: 120, border: '1px solid #eee', borderRadius: 8 }} />
                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>QR Code</div>
              </div>
            )}
            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { navigator.clipboard.writeText(selected.irn || ''); toast.success('IRN copied') }}
                style={{ padding: '7px 16px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                📋 Copy IRN
              </button>
              <button onClick={() => setSelected(null)}
                style={{ padding: '7px 16px', background: '#714B67', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
