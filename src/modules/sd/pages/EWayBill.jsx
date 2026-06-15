import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE     = import.meta.env.VITE_API_URL || '/api'
const getToken = () => localStorage.getItem('lnv_token') || ''
const hdr      = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })
const api      = (path, opts) => fetch(`${BASE}${path}`, { headers: hdr(), ...opts }).then(r => r.json())

const EWB_STATUS_COLOR = {
  GENERATED:  { background: '#D4EDDA', color: '#155724' },
  CANCELLED:  { background: '#F8D7DA', color: '#721C24' },
  EXPIRED:    { background: '#F8D7DA', color: '#721C24' },
  PENDING:    { background: '#FFF3CD', color: '#856404' },
}

const CANCEL_REASONS = [
  { code: '1', label: 'Duplicate' },
  { code: '2', label: 'Order Cancelled' },
  { code: '3', label: 'Data Entry Mistake' },
  { code: '4', label: 'Others' },
]

// Helper: label-value row for review sections
function Row({ label, value, bold, mono }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: '#888', minWidth: 100, fontSize: 11 }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 400, fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? 12 : 13 }}>{value || '—'}</span>
    </div>
  )
}

export default function EWayBill() {
  const nav = useNavigate()
  const curYear = new Date().getFullYear()
  const [from,  setFrom]  = useState(`${curYear}-04-01`)
  const [to,    setTo]    = useState(new Date().toISOString().slice(0, 10))
  const [dcs,   setDcs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [sandbox, setSandbox] = useState(true)
  const [genModal, setGenModal] = useState(null)   // DC to generate EWB for
  const [cancelModal, setCancelModal] = useState(null)
  const [vehModal, setVehModal] = useState(null)
  const [form, setForm] = useState({ vehicleNo: '', driverName: '', driverPhone: '', transporterId: '', distance: 100, vehicleType: 'R', transMode: '1', supplyType: 'O', subType: '1', docType: 'INV', txnType: '1', transDocNo: '', transDate: new Date().toISOString().slice(0,10), remarks: '' })
  const [cancelForm, setCancelForm] = useState({ reason: '1', remark: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api(`/einvoice/ewb/list?from=${from}&to=${to}`)
      setDcs(d.data || [])
      setSandbox(d.sandbox ?? true)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [from, to])

  useEffect(() => { load() }, [load])

  const generateEWB = async () => {
    if (!genModal) return
    setSaving(true)
    try {
      const d = await api(`/einvoice/ewb/generate/${genModal.id}`, {
        method: 'POST',
        body: JSON.stringify(form)
      })
      if (d.error) throw new Error(d.error)
      toast.success(`EWB Generated: ${d.ewbNo}`)
      setGenModal(null)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const cancelEWB = async () => {
    if (!cancelModal) return
    setSaving(true)
    try {
      const d = await api(`/einvoice/ewb/cancel/${cancelModal.id}`, {
        method: 'POST',
        body: JSON.stringify(cancelForm)
      })
      if (d.error) throw new Error(d.error)
      toast.success(`EWB ${cancelModal.ewbNo} cancelled`)
      setCancelModal(null)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const updateVehicle = async () => {
    if (!vehModal) return
    setSaving(true)
    try {
      const d = await api(`/einvoice/ewb/update-vehicle/${vehModal.id}`, {
        method: 'POST',
        body: JSON.stringify({ vehicleNo: form.vehicleNo, fromPlace: 'Coimbatore', reasonCode: '1' })
      })
      if (d.error) throw new Error(d.error)
      toast.success('Vehicle updated')
      setVehModal(null)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const stats = {
    total:     dcs.length,
    generated: dcs.filter(d => d.ewbStatus === 'GENERATED').length,
    pending:   dcs.filter(d => !d.ewbStatus || d.ewbStatus === 'PENDING').length,
    expired:   dcs.filter(d => d.ewbStatus === 'EXPIRED').length,
  }

  const inputStyle = { padding: '7px 10px', border: '1px solid #ddd', borderRadius: 6, width: '100%', fontSize: 13 }
  const labelStyle = { fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }

  return (
    <div style={{ padding: 24, fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: '#714B67' }}>🚚 e-Way Bill</h2>
          <small style={{ color: '#888' }}>GST · Electronic Way Bill for Goods Movement</small>
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
          { label: 'Total DCs',    value: stats.total,     color: '#714B67' },
          { label: 'EWB Generated',value: stats.generated, color: '#28A745' },
          { label: 'Pending EWB',  value: stats.pending,   color: '#FFC107' },
          { label: 'Expired',      value: stats.expired,   color: '#DC3545' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
        <span style={{ alignSelf: 'center', color: '#888' }}>to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }} />
        <button onClick={load} style={{ padding: '6px 16px', background: '#714B67', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>🔄 Refresh</button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,.08)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#714B67', color: '#fff' }}>
              {['DC No','Date','Customer','Vehicle No','Driver','Invoice Ref','EWB No','Valid Till','Status','Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#888' }}>⏳ Loading...</td></tr>
            ) : dcs.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#888' }}>No delivery challans found</td></tr>
            ) : dcs.map((dc, i) => {
              const st    = dc.ewbStatus || 'PENDING'
              const stClr = EWB_STATUS_COLOR[st] || EWB_STATUS_COLOR.PENDING
              const validTill = dc.ewbValidTill ? new Date(dc.ewbValidTill) : null
              const isExpired = validTill && validTill < new Date()
              return (
                <tr key={dc.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9F6F8', borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600, color: '#714B67' }}>{dc.dcNo}</td>
                  <td style={{ padding: '9px 12px' }}>{new Date(dc.dcDate).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '9px 12px' }}>{dc.customerName || '—'}</td>
                  <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>{dc.vehicleNo || '—'}</td>
                  <td style={{ padding: '9px 12px', fontSize: 12 }}>
                    {dc.driverName || '—'}
                    {dc.driverPhone && <><br/><span style={{color:'#888',fontSize:11}}>{dc.driverPhone}</span></>}
                  </td>
                  <td style={{ padding: '9px 12px' }}>{dc.invoiceRef || '—'}</td>
                  <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: '#28A745' }}>{(dc.ewbNo && dc.ewbNo !== '') ? dc.ewbNo : '—'}</td>
                  <td style={{ padding: '9px 12px', fontSize: 11, color: isExpired ? '#DC3545' : '#333' }}>
                    {validTill ? validTill.toLocaleDateString('en-IN') : '—'}
                    {isExpired && <span style={{ marginLeft: 4, color: '#DC3545' }}>⚠️</span>}
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ ...stClr, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                      {isExpired && st === 'GENERATED' ? 'EXPIRED' : st}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {(!dc.ewbNo || dc.ewbNo === '') && (
                        <button onClick={() => { setGenModal(dc); setForm(f => ({ ...f, vehicleNo: dc.vehicleNo || '', driverName: dc.driverName || '', driverPhone: dc.driverPhone || '' })) }}
                          style={{ padding: '4px 10px', background: '#28A745', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                          🚚 Gen EWB
                        </button>
                      )}
                      {(dc.ewbNo && dc.ewbNo !== '') && st === 'GENERATED' && !isExpired && (
                        <>
                          <button onClick={() => { setVehModal(dc); setForm(f => ({ ...f, vehicleNo: dc.vehicleNo || '' })) }}
                            style={{ padding: '4px 9px', background: '#0D6EFD', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>
                            🚗 Veh
                          </button>
                          <button onClick={() => { setCancelModal(dc); setCancelForm({ reason: '1', remark: '' }) }}
                            style={{ padding: '4px 9px', background: '#DC3545', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>
                            ✕ Cancel
                          </button>
                        </>
                      )}
                      {(dc.ewbNo && dc.ewbNo !== '') && (
                        <button onClick={() => navigator.clipboard.writeText(dc.ewbNo).then(() => toast.success('EWB copied'))}
                          style={{ padding: '4px 9px', background: '#f0f0f0', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>
                          📋
                        </button>
                      )}
                      {(dc.ewbNo && dc.ewbNo !== '') && (
                        <button onClick={() => nav(`/sd/ewaybill/${dc.id}/print`)}
                          style={{ padding: '4px 9px', background: '#E8F4FD', color: '#0D6EFD', border: '1px solid #B8D4F0', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>
                          🖨️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── e-Way Bill Entry Form — Full Screen Review (like AUTOCOATS) ── */}
      {genModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#f0eeeb', zIndex: 1000, overflowY: 'auto', fontFamily: 'DM Sans, sans-serif' }}>

          {/* Top Bar */}
          <div style={{ background: '#714B67', color: '#fff', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>🚚 e-WAY BILL ENTRY FORM</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setGenModal(null)}
                style={{ padding: '6px 18px', background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.4)', borderRadius: 6, cursor: 'pointer' }}>
                ✕ Cancel
              </button>
              <button onClick={generateEWB} disabled={saving || !form.vehicleNo || !form.driverName}
                style={{ padding: '6px 20px', background: saving ? '#ccc' : '#28A745', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                {saving ? '⏳ Generating...' : '⚡ Generate e-Way Bill'}
              </button>
            </div>
          </div>

          {sandbox && (
            <div style={{ background: '#FFF3CD', color: '#856404', padding: '8px 24px', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
              🧪 SANDBOX MODE — Dummy EWB number will be generated (not valid for actual goods movement)
            </div>
          )}

          <div style={{ maxWidth: 1100, margin: '20px auto', padding: '0 16px' }}>

            {/* ── BILL FROM / DISPATCH FROM ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden', marginBottom: 12, background: '#fff' }}>
              <div style={{ borderRight: '1px solid #ccc' }}>
                <div style={{ background: '#714B67', color: '#fff', padding: '7px 14px', fontWeight: 700, fontSize: 12 }}>BILL FROM (Supplier)</div>
                <div style={{ padding: 14 }}>
                  <Row label="Name"  value="LNV Manufacturing Pvt. Ltd." />
                  <Row label="GSTIN" value="33AABCL1234A1Z5" mono />
                  <Row label="State" value="Tamil Nadu (33)" />
                </div>
              </div>
              <div>
                <div style={{ background: '#714B67', color: '#fff', padding: '7px 14px', fontWeight: 700, fontSize: 12 }}>DISPATCH FROM (Place of Origin)</div>
                <div style={{ padding: 14 }}>
                  <Row label="Address" value="Coimbatore, Tamil Nadu - 641001" />
                  <Row label="Place"   value="Coimbatore" />
                  <Row label="Pincode" value="641001" />
                  <Row label="State"   value="Tamil Nadu" />
                </div>
              </div>
            </div>

            {/* ── BILL TO / SHIP TO ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden', marginBottom: 12, background: '#fff' }}>
              <div style={{ borderRight: '1px solid #ccc' }}>
                <div style={{ background: '#1A5276', color: '#fff', padding: '7px 14px', fontWeight: 700, fontSize: 12 }}>BILL TO (Consignee)</div>
                <div style={{ padding: 14 }}>
                  <Row label="Name"    value={genModal.customerName} />
                  <Row label="GSTIN"   value={genModal.customerGstin || 'URP (Unregistered)'} mono />
                  <Row label="Address" value={genModal.billToAddress || '—'} />
                </div>
              </div>
              <div>
                <div style={{ background: '#1A5276', color: '#fff', padding: '7px 14px', fontWeight: 700, fontSize: 12 }}>SHIP TO (Delivery Address)</div>
                <div style={{ padding: 14 }}>
                  <Row label="Address" value={genModal.shipToAddress || genModal.billToAddress || '—'} />
                  <Row label="Place"   value="Destination" />
                </div>
              </div>
            </div>

            {/* ── REFERENCE LINKS ── */}
            <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ background: '#566573', color: '#fff', padding: '7px 14px', fontWeight: 700, fontSize: 12 }}>REFERENCE LINKS</div>
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                <Row label="DC Number"   value={genModal.dcNo} bold />
                <Row label="Invoice Ref" value={genModal.invoiceRef || '—'} bold />
                <Row label="DC Status"   value={genModal.status} />
              </div>
            </div>

            {/* ── TRANSACTION DETAILS ── */}
            <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ background: '#566573', color: '#fff', padding: '7px 14px', fontWeight: 700, fontSize: 12 }}>TRANSACTION DETAILS</div>
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Supply Type *</label>
                  <select style={inputStyle} value={form.supplyType || 'O'} onChange={e => setForm(f => ({ ...f, supplyType: e.target.value }))}>
                    <option value="O">Outward</option>
                    <option value="I">Inward</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Sub Type *</label>
                  <select style={inputStyle} value={form.subType || '1'} onChange={e => setForm(f => ({ ...f, subType: e.target.value }))}>
                    <option value="1">Supply</option>
                    <option value="3">Job Work</option>
                    <option value="4">SKD/CKD</option>
                    <option value="5">Recipient Not Known</option>
                    <option value="10">Sales Return</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Doc Type *</label>
                  <select style={inputStyle} value={form.docType || 'INV'} onChange={e => setForm(f => ({ ...f, docType: e.target.value }))}>
                    <option value="INV">Tax Invoice</option>
                    <option value="CHL">Delivery Challan</option>
                    <option value="BIL">Bill of Supply</option>
                    <option value="BOE">Bill of Entry</option>
                    <option value="OTH">Others</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Mode of Transport *</label>
                  <select style={inputStyle} value={form.transMode} onChange={e => setForm(f => ({ ...f, transMode: e.target.value }))}>
                    <option value="1">Road</option>
                    <option value="2">Rail</option>
                    <option value="3">Air</option>
                    <option value="4">Ship</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Transaction Type</label>
                  <select style={inputStyle} value={form.txnType || '1'} onChange={e => setForm(f => ({ ...f, txnType: e.target.value }))}>
                    <option value="1">Regular</option>
                    <option value="2">Bill To - Ship To</option>
                    <option value="3">Bill From - Dispatch From</option>
                    <option value="4">Combination</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Transporter GSTIN</label>
                  <input style={inputStyle} placeholder="Transporter GSTIN (optional)" value={form.transporterId} onChange={e => setForm(f => ({ ...f, transporterId: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Distance (km) *</label>
                  <input style={inputStyle} type="number" value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Trans Doc No</label>
                  <input style={inputStyle} placeholder="LR / RR / Airway bill no" value={form.transDocNo || ''} onChange={e => setForm(f => ({ ...f, transDocNo: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Trans Date</label>
                  <input style={inputStyle} type="date" value={form.transDate || new Date().toISOString().slice(0,10)} onChange={e => setForm(f => ({ ...f, transDate: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* ── VEHICLE DETAILS ── */}
            <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ background: '#1E8449', color: '#fff', padding: '7px 14px', fontWeight: 700, fontSize: 12 }}>VEHICLE & DRIVER DETAILS</div>
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Vehicle No *</label>
                  <input style={{ ...inputStyle, fontWeight: 700, textTransform: 'uppercase' }} placeholder="TN39AB1234" value={form.vehicleNo} onChange={e => setForm(f => ({ ...f, vehicleNo: e.target.value.replace(/\s/g,'').toUpperCase() }))} />
                </div>
                <div>
                  <label style={labelStyle}>Vehicle Type</label>
                  <select style={inputStyle} value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}>
                    <option value="R">Regular</option>
                    <option value="O">ODC</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Driver Name *</label>
                  <input style={inputStyle} placeholder="Full name" value={form.driverName} onChange={e => setForm(f => ({ ...f, driverName: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Driver Phone</label>
                  <input style={inputStyle} placeholder="10-digit mobile" value={form.driverPhone} onChange={e => setForm(f => ({ ...f, driverPhone: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* ── REMARKS ── */}
            <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ background: '#566573', color: '#fff', padding: '7px 14px', fontWeight: 700, fontSize: 12 }}>REMARKS</div>
              <div style={{ padding: 14 }}>
                <textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} placeholder="Optional remarks..." value={form.remarks || ''} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
            </div>

            {/* ── BOTTOM ACTION ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 30 }}>
              <button onClick={() => setGenModal(null)}
                style={{ padding: '10px 24px', background: '#fff', border: '1px solid #ccc', borderRadius: 7, cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={generateEWB} disabled={saving || !form.vehicleNo || !form.driverName}
                style={{ padding: '10px 28px', background: saving ? '#ccc' : '#28A745', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                {saving ? '⏳ Generating...' : '⚡ Generate e-Way Bill'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cancel EWB Modal */}
      {cancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setCancelModal(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: '#DC3545' }}>❌ Cancel e-Way Bill</h3>
            <p style={{ fontSize: 13, color: '#666' }}>EWB: <strong>{cancelModal.ewbNo}</strong></p>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Cancellation Reason *</label>
              <select style={inputStyle} value={cancelForm.reason} onChange={e => setCancelForm(f => ({ ...f, reason: e.target.value }))}>
                {CANCEL_REASONS.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Remarks</label>
              <input style={inputStyle} value={cancelForm.remark} onChange={e => setCancelForm(f => ({ ...f, remark: e.target.value }))} placeholder="Optional remarks" />
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setCancelModal(null)} style={{ padding: '8px 18px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Back</button>
              <button onClick={cancelEWB} disabled={saving}
                style={{ padding: '8px 18px', background: '#DC3545', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {saving ? '⏳...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Vehicle Modal */}
      {vehModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setVehModal(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 360 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: '#714B67' }}>🚗 Update Vehicle</h3>
            <p style={{ fontSize: 13, color: '#666' }}>EWB: <strong>{vehModal.ewbNo}</strong></p>
            <label style={labelStyle}>New Vehicle No *</label>
            <input style={inputStyle} value={form.vehicleNo} onChange={e => setForm(f => ({ ...f, vehicleNo: e.target.value }))} placeholder="TN39 AB 5678" />
            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setVehModal(null)} style={{ padding: '8px 18px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button onClick={updateVehicle} disabled={saving || !form.vehicleNo}
                style={{ padding: '8px 18px', background: '#0D6EFD', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {saving ? '⏳...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
