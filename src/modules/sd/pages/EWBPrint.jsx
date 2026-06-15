import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || '/api'
const hdr2 = () => ({ Authorization: `Bearer ${localStorage.getItem('lnv_token')}` })

export default function EWBPrint() {
  const { id } = useParams()        // DC id
  const nav    = useNavigate()
  const [dc,      setDc]      = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/sd/delivery-challan/${id}`, { headers: hdr2() })
      .then(r => r.json())
      .then(async d => {
        const dcData = d.data || d
        let co = {}
        try { co = JSON.parse(localStorage.getItem('lnv_company') || '{}') } catch {}
        setCompany({
          name:    co.name    || 'LNV Manufacturing Pvt. Ltd.',
          address: co.address || 'Coimbatore, Tamil Nadu - 641001',
          gstin:   co.gstin   || '33AABCL1234A1Z5',
          phone:   co.phone   || '',
          state:   co.state   || 'Tamil Nadu',
          stateCode: co.stateCode || '33',
        })
        // If DC has invoice ref, fetch invoice to get line values
        if (dcData.invoiceRef || dcData.invoiceId) {
          try {
            const invId = dcData.invoiceId
            const invRef = dcData.invoiceRef
            let invData = null
            if (invId) {
              const ir = await fetch(`${BASE}/sd/invoices/${invId}`, { headers: hdr2() })
              const id2 = await ir.json()
              invData = id2.data || id2
            } else if (invRef) {
              const ir = await fetch(`${BASE}/sd/invoices?search=${encodeURIComponent(invRef)}`, { headers: hdr2() })
              const id2 = await ir.json()
              invData = (id2.data || [])[0]
            }
            if (invData) {
              // Merge invoice lines (with values) into DC
              const invLines = Array.isArray(invData.lines) ? invData.lines : JSON.parse(invData.lines || '[]')
              const dcLines  = Array.isArray(dcData.lines) ? dcData.lines : JSON.parse(dcData.lines || '[]')
              // Match by itemCode or itemName, bring in price/amount
              dcData._invLines = invLines
              dcData._grandTotal = parseFloat(invData.grandTotal || invData.totalAmt || 0)
              dcData._taxableAmt = parseFloat(invData.taxableAmt || invData.totalAmt || 0)
              dcData.customerGstin = dcData.customerGstin || invData.customerGstin
            }
          } catch {}
        }
        setDc(dcData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // No auto-print — user clicks Print EWB button manually

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>⏳ Loading e-Way Bill...</div>
  if (!dc)     return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>DC not found</div>

  const lines = Array.isArray(dc.lines) ? dc.lines : JSON.parse(dc.lines || '[]')
  const fmtD  = s => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
  const fmtDT = s => s ? new Date(s).toLocaleString('en-IN',  { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'
  const totalVal = dc._taxableAmt || dc._grandTotal || lines.reduce((s, l) => s + parseFloat(l.totalAmt || l.lineTotal || l.amount || l.taxableAmt || 0), 0)

  const ewbNo     = dc.ewbNo     || '(Not Generated)'
  const ewbDate   = dc.ewbDate   ? fmtDT(dc.ewbDate) : '—'
  const validTill = dc.ewbValidTill ? fmtDT(dc.ewbValidTill) : '—'
  const isSandbox = !dc.ewbNo || dc.ewbNo.startsWith('EWB')

  const cell = (label, value, bold = false) => (
    <td style={{ border: '1px solid #333', padding: '5px 8px', verticalAlign: 'top', fontSize: 11 }}>
      <div style={{ fontSize: 9, color: '#555', marginBottom: 1 }}>{label}</div>
      <div style={{ fontWeight: bold ? 700 : 400, fontSize: bold ? 13 : 11 }}>{value || '—'}</div>
    </td>
  )

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body * { visibility: hidden; }
          .page, .page * { visibility: visible; }
          .page { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        table { border-collapse: collapse; width: 100%; }
        .page { max-width: 210mm; margin: 0 auto; padding: 8mm; background: #fff; }
        .section-title {
          background: #714B67; color: #fff;
          padding: 4px 10px; font-size: 11px; font-weight: 700;
          margin: 8px 0 0;
        }
      `}</style>

      {/* Print / Back controls */}
      <div className="no-print" style={{ padding: '10px 20px', background: '#714B67', display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={() => nav('/sd/ewaybill')} style={{ padding: '6px 16px', background: '#fff', color: '#714B67', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>
          ← Back
        </button>
        <button onClick={() => window.print()} style={{ padding: '6px 16px', background: '#28A745', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>
          🖨️ Print EWB
        </button>
        {isSandbox && (
          <span style={{ background: '#FFF3CD', color: '#856404', padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
            🧪 SANDBOX — Dummy EWB
          </span>
        )}
      </div>

      <div className="page">

        {/* ── HEADER ── */}
        <table style={{ border: '2px solid #333', marginBottom: 0 }}>
          <tbody>
            <tr>
              <td colSpan={3} style={{ padding: '6px 10px', borderBottom: '2px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#714B67' }}>e-WAY BILL</div>
                    <div style={{ fontSize: 9, color: '#555' }}>As per Rule 138 of CGST Rules, 2017</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 2, color: '#333' }}>
                      {ewbNo}
                    </div>
                    <div style={{ fontSize: 9, color: '#555' }}>e-Way Bill Number</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 10 }}>
                    <div style={{ fontWeight: 700 }}>Generated: {ewbDate}</div>
                    <div style={{ fontWeight: 700, color: new Date(dc.ewbValidTill) < new Date() ? '#DC3545' : '#155724' }}>
                      Valid Till: {validTill}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── PART A: SUPPLY DETAILS ── */}
        <div className="section-title">PART A — SUPPLY DETAILS</div>
        <table style={{ border: '1px solid #333' }}>
          <tbody>
            <tr>
              <td colSpan={4} style={{ border: '1px solid #333', padding: '5px 8px', background: '#F9F6F8' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Supply Type</div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>
                  {dc.dcType === 'outward' ? 'Outward — Regular Supply' : 'Inward Supply'}
                </div>
              </td>
            </tr>
            <tr>
              {cell('Document Type', 'Tax Invoice')}
              {cell('Document No', dc.invoiceRef || dc.dcNo, true)}
              {cell('Document Date', fmtD(dc.dcDate))}
              {cell('Total Value (₹)', totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 }), true)}
            </tr>
          </tbody>
        </table>

        {/* ── FROM / TO ── */}
        <div className="section-title">CONSIGNOR (FROM) & CONSIGNEE (TO)</div>
        <table style={{ border: '1px solid #333' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #333', padding: '6px 10px', width: '50%', verticalAlign: 'top' }}>
                <div style={{ fontSize: 9, color: '#555', marginBottom: 3 }}>FROM (Consignor / Supplier)</div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{company?.name}</div>
                <div style={{ fontSize: 10, marginTop: 2 }}>{company?.address}</div>
                <div style={{ fontSize: 10, marginTop: 4 }}>
                  <strong>GSTIN:</strong> {company?.gstin} &nbsp;|&nbsp;
                  <strong>State:</strong> {company?.state} ({company?.stateCode})
                </div>
              </td>
              <td style={{ border: '1px solid #333', padding: '6px 10px', width: '50%', verticalAlign: 'top' }}>
                <div style={{ fontSize: 9, color: '#555', marginBottom: 3 }}>TO (Consignee / Buyer)</div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{dc.customerName}</div>
                <div style={{ fontSize: 10, marginTop: 2 }}>{dc.shipToAddress || dc.billToAddress}</div>
                <div style={{ fontSize: 10, marginTop: 4 }}>
                  <strong>GSTIN:</strong> {dc.customerGstin && dc.customerGstin !== 'URP' ? dc.customerGstin : 'URP (Unregistered)'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── GOODS DETAILS ── */}
        <div className="section-title">GOODS DETAILS</div>
        <table style={{ border: '1px solid #333' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              {['#', 'Item / Description', 'HSN Code', 'Qty', 'Unit', 'Taxable Value (₹)', 'Tax Rate'].map(h => (
                <th key={h} style={{ border: '1px solid #333', padding: '5px 8px', fontSize: 10, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.length > 0 ? lines.map((l, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #333', padding: '4px 8px', fontSize: 10 }}>{i + 1}</td>
                <td style={{ border: '1px solid #333', padding: '4px 8px', fontSize: 10, fontWeight: 600 }}>{l.itemName || l.description}</td>
                <td style={{ border: '1px solid #333', padding: '4px 8px', fontSize: 10 }}>{l.hsnCode || l.hsn || (dc._invLines||[]).find(il=>il.itemCode===l.itemCode)?.hsnCode || '3926'}</td>
                <td style={{ border: '1px solid #333', padding: '4px 8px', fontSize: 10 }}>{l.qty}</td>
                <td style={{ border: '1px solid #333', padding: '4px 8px', fontSize: 10 }}>{l.uom || 'NOS'}</td>
                <td style={{ border: '1px solid #333', padding: '4px 8px', fontSize: 10 }}>₹{(() => {
                      const inv = (dc._invLines||[]).find(il => il.itemCode === l.itemCode || il.itemName === l.itemName)
                      const lineVal = parseFloat(inv?.totalAmt || inv?.amount || inv?.taxableAmt || inv?.lineTotal || l.totalAmt || l.amount || 0)
                      // If no line value, distribute total equally
                      const val = lineVal > 0 ? lineVal : (totalVal / Math.max(lines.length, 1))
                      return val.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                    })()}</td>
                <td style={{ border: '1px solid #333', padding: '4px 8px', fontSize: 10 }}>{l.gstRate || 18}%</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} style={{ border: '1px solid #333', padding: '10px', textAlign: 'center', fontSize: 11, color: '#888' }}>
                  No items in DC
                </td>
              </tr>
            )}
            <tr style={{ background: '#f9f6f8' }}>
              <td colSpan={5} style={{ border: '1px solid #333', padding: '5px 8px', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>TOTAL</td>
              <td style={{ border: '1px solid #333', padding: '5px 8px', fontSize: 12, fontWeight: 800 }}>
                ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ border: '1px solid #333' }}></td>
            </tr>
          </tbody>
        </table>

        {/* ── PART B: TRANSPORT DETAILS ── */}
        <div className="section-title">PART B — TRANSPORT DETAILS</div>
        <table style={{ border: '1px solid #333' }}>
          <tbody>
            <tr>
              {cell('Mode of Transport', 'Road (1)')}
              {cell('Vehicle Number', dc.vehicleNo, true)}
              {cell('Driver Name', dc.driverName)}
              {cell('Driver Phone', dc.driverPhone)}
            </tr>
            <tr>
              {cell('Place of Despatch', 'Coimbatore, Tamil Nadu')}
              {cell('Place of Delivery', dc.shipToAddress?.split(',').slice(-2).join(',').trim() || 'Destination')}
              {cell('Approximate Distance', '—')}
              {cell('Vehicle Type', 'Regular')}
            </tr>
          </tbody>
        </table>

        {/* ── LINKED DOCUMENTS ── */}
        <div className="section-title">LINKED DOCUMENTS</div>
        <table style={{ border: '1px solid #333' }}>
          <tbody>
            <tr>
              {cell('Delivery Challan No', dc.dcNo, true)}
              {cell('Invoice / Ref No', dc.invoiceRef || '—', true)}
              {cell('SO Reference', dc.soRef || '—')}
              {cell('DC Date', fmtD(dc.dcDate))}
            </tr>
          </tbody>
        </table>

        {/* ── VALIDITY & SIGNATURE ── */}
        <table style={{ border: '1px solid #333', marginTop: 8 }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #333', padding: '8px 10px', width: '40%' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Validity</div>
                <div style={{ fontSize: 11 }}>
                  <strong>From:</strong> {ewbDate}<br />
                  <strong>To:</strong> {validTill}
                </div>
                {isSandbox && (
                  <div style={{ marginTop: 6, padding: '4px 8px', background: '#FFF3CD', borderRadius: 4, fontSize: 9, color: '#856404' }}>
                    ⚠️ SANDBOX — For testing only. Not valid for actual movement of goods.
                  </div>
                )}
              </td>
              <td style={{ border: '1px solid #333', padding: '8px 10px', width: '30%', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#555', marginBottom: 20 }}>Verified By / Signature</div>
                <div style={{ borderTop: '1px solid #333', paddingTop: 4, fontSize: 10 }}>{company?.name}</div>
              </td>
              <td style={{ border: '1px solid #333', padding: '8px 10px', width: '30%', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#555', marginBottom: 4 }}>QR Code</div>
                <div style={{ width: 80, height: 80, border: '1px solid #ddd', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#888' }}>
                  {dc.ewbNo ? 'QR' : 'N/A'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: 6, fontSize: 9, color: '#888', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: 4 }}>
          This is a computer generated e-Way Bill. Valid for movement of goods as per GST Rules.
          Generated by LNV ERP — {company?.name} | GSTIN: {company?.gstin}
        </div>

      </div>
    </>
  )
}
