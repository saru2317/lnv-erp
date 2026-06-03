import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization: `Bearer ${localStorage.getItem('lnv_token')}` })

const COPIES = ['Original', 'Duplicate', 'Triplicate', 'Fourth Copy']

export default function DCPrint() {
  const { id } = useParams()
  const nav = useNavigate()
  const [dc,      setDc]      = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/sd/delivery-challan/${id}`, { headers: hdr2() }).then(r=>r.json()),
    ]).then(async ([dcD]) => {
      const dcData = dcD.data || dcD
      // Company info from localStorage (set during login) or default
      let co = {}
      try { co = JSON.parse(localStorage.getItem('lnv_company')||'{}') } catch {}
      setCompany({
        name:    co.name    || 'LNV Manufacturing Pvt. Ltd.',
        address: co.address || 'Ranipet, Tamil Nadu - 632 401',
        gstin:   co.gstin   || '',
        phone:   co.phone   || '',
        email:   co.email   || '',
        website: co.website || '',
      })

      // If DC has no address, fetch from customer master
      if (!dcData.billToAddress) {
        try {
          let cust = null
          // Try by customerId first
          if (dcData.customerId) {
            const cr = await fetch(`${BASE}/sd/customers/${dcData.customerId}`, { headers: hdr2() })
            const cd = await cr.json()
            cust = cd.data
          }
          // Fallback: search by customer name
          if (!cust && dcData.customerName) {
            const cr = await fetch(
              `${BASE}/sd/customers?search=${encodeURIComponent(dcData.customerName)}`,
              { headers: hdr2() }
            )
            const cd = await cr.json()
            cust = (cd.data||[])[0]
          }
          if (cust) {
            const addr = [cust.address, cust.city, cust.state, cust.pincode]
              .filter(Boolean).join(', ')
            dcData.billToAddress  = addr || '—'
            dcData.shipToAddress  = addr || '—'
            dcData.customerGstin  = dcData.customerGstin || cust.gstin || ''
          }
        } catch {}
      }
      // shipToAddress defaults to billToAddress if empty
      if (!dcData.shipToAddress) dcData.shipToAddress = dcData.billToAddress
      setDc(dcData)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding:40, textAlign:'center' }}>Loading...</div>
  if (!dc)     return <div style={{ padding:40, textAlign:'center' }}>DC not found</div>

  const lines = Array.isArray(dc.lines) ? dc.lines : JSON.parse(dc.lines||'[]')
  const totalQty = lines.reduce((s,l) => s + parseFloat(l.qty||0), 0)
  const fmtD = s => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display:none !important; }
          /* Hide ERP chrome */
          nav, header, aside, .sidebar, .top-bar, .module-nav,
          [class*="Sidebar"], [class*="TopBar"], [class*="ModuleLayout"],
          [class*="AppShell"] > *:not(#dc-print-root) { display:none !important; }
          body { margin:0; padding:0; }
          .page-break { page-break-after: always; }
          .page-break:last-child { page-break-after: auto; }
          #dc-print-root { position:fixed; top:0; left:0; width:100%; z-index:99999; }
        }
        @media screen {
          #dc-print-root { max-width: 900px; margin: 0 auto; background: #f5f5f5; padding: 10px; }
        }
        @page { size: A4; margin: 10mm; }
        body { font-family: Arial, sans-serif; font-size: 11px; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #000; padding: 4px 6px; }
        th { font-weight: bold; text-align: center; background: #f0f0f0; }
        .no-border td, .no-border th { border: none; }
      `}</style>

      <div id="dc-print-root">
      {/* Toolbar */}
      <div className="no-print" style={{ padding:'10px 20px', background:'#714B67',
        display:'flex', gap:10, alignItems:'center' }}>
        <button onClick={() => window.print()}
          style={{ padding:'8px 20px', background:'#fff', color:'#714B67',
            border:'none', borderRadius:5, fontWeight:700, cursor:'pointer', fontSize:13 }}>
          🖨️ Print / Save PDF
        </button>
        <button onClick={() => nav(-1)}
          style={{ padding:'8px 16px', background:'transparent', color:'#fff',
            border:'1px solid #fff', borderRadius:5, cursor:'pointer', fontSize:12 }}>
          ← Back
        </button>
        <span style={{ color:'#fff', fontSize:12, marginLeft:10 }}>
          {dc.dcNo} · {dc.customerName} · 4 copies will print
        </span>
      </div>

      {/* 4 Copies */}
      {COPIES.map((copyLabel, copyIdx) => (
        <div key={copyIdx}
          className={copyIdx < 3 ? 'page-break' : ''}
          style={{ padding:'10mm', minHeight:'270mm', boxSizing:'border-box',
            background:'#fff', fontFamily:'Arial,sans-serif', fontSize:11 }}>

          {/* Copy label */}
          <div style={{ textAlign:'right', fontSize:10, fontWeight:'bold',
            marginBottom:4, color:'#555', textTransform:'uppercase',
            letterSpacing:1 }}>
            {copyLabel}
          </div>

          {/* Title */}
          <div style={{ textAlign:'center', fontWeight:'bold', fontSize:16,
            borderBottom:'2px solid #000', paddingBottom:4, marginBottom:8,
            letterSpacing:2, textTransform:'uppercase' }}>
            DELIVERY CHALLAN
          </div>

          {/* Company Header */}
          <table style={{ marginBottom:8, fontSize:11 }}>
            <tbody>
              <tr>
                <td style={{ width:'60%', border:'none', verticalAlign:'top', padding:0 }}>
                  <div style={{ fontWeight:'bold', fontSize:14 }}>{company?.name}</div>
                  <div style={{ whiteSpace:'pre-line', marginTop:2, lineHeight:1.5 }}>
                    {company?.address}
                  </div>
                  {company?.phone && <div>Phone: {company.phone}</div>}
                  {company?.email && <div>Email: {company.email}</div>}
                  {company?.website && <div>Web: {company.website}</div>}
                  {company?.gstin && (
                    <div style={{ marginTop:4, fontWeight:'bold' }}>
                      GSTIN: {company.gstin}
                    </div>
                  )}
                </td>
                <td style={{ width:'40%', border:'none', verticalAlign:'top',
                  textAlign:'right', padding:0 }}>
                  <table style={{ marginLeft:'auto', fontSize:11 }}>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight:'bold', paddingRight:8, border:'none' }}>DC No :</td>
                        <td style={{ border:'none' }}><strong>{dc.dcNo}</strong></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight:'bold', paddingRight:8, border:'none' }}>DC Date :</td>
                        <td style={{ border:'none' }}>{fmtD(dc.dcDate||dc.createdAt)}</td>
                      </tr>
                      {dc.soRef && (
                        <tr>
                          <td style={{ fontWeight:'bold', paddingRight:8, border:'none' }}>SO Ref :</td>
                          <td style={{ border:'none' }}>{dc.soRef}</td>
                        </tr>
                      )}
                      {dc.vehicleNo && (
                        <tr>
                          <td style={{ fontWeight:'bold', paddingRight:8, border:'none' }}>Vehicle :</td>
                          <td style={{ border:'none' }}>{dc.vehicleNo}</td>
                        </tr>
                      )}
                      {dc.ewbNo && (
                        <tr>
                          <td style={{ fontWeight:'bold', paddingRight:8, border:'none' }}>E-Way Bill :</td>
                          <td style={{ border:'none' }}>{dc.ewbNo}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Supplied To / Delivery At */}
          <table style={{ marginBottom:8, fontSize:11 }}>
            <thead>
              <tr>
                <th style={{ width:'50%', textAlign:'left', padding:'4px 8px' }}>
                  Supplied To
                </th>
                <th style={{ width:'50%', textAlign:'left', padding:'4px 8px' }}>
                  Delivery At
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ verticalAlign:'top', padding:'6px 8px', lineHeight:1.6 }}>
                  <strong>Name :</strong> {dc.customerName}<br/>
                  <strong>Address :</strong>{' '}
                  <span style={{ whiteSpace:'pre-line' }}>
                    {dc.billToAddress || '—'}
                  </span><br/>
                  {dc.customerGstin && (
                    <><strong>GSTIN :</strong> {dc.customerGstin}</>
                  )}
                </td>
                <td style={{ verticalAlign:'top', padding:'6px 8px', lineHeight:1.6 }}>
                  <strong>Name :</strong> {dc.customerName}<br/>
                  <strong>Address :</strong>{' '}
                  <span style={{ whiteSpace:'pre-line' }}>
                    {dc.shipToAddress || dc.billToAddress || '—'}
                  </span><br/>
                  {dc.customerGstin && (
                    <><strong>GSTIN :</strong> {dc.customerGstin}</>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Line Items */}
          <table style={{ marginBottom:8, fontSize:11 }}>
            <thead>
              <tr>
                <th style={{ width:'5%' }}>S.No</th>
                <th style={{ width:'55%', textAlign:'left' }}>Item Description</th>
                <th style={{ width:'10%' }}>UOM</th>
                <th style={{ width:'15%', textAlign:'right' }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td style={{ textAlign:'center' }}>{i+1}</td>
                  <td>
                    <strong>{l.itemName}</strong>
                    {l.itemCode && (
                      <span style={{ color:'#555', marginLeft:4 }}>
                        - {l.itemCode}
                      </span>
                    )}
                    {l.description && (
                      <div style={{ fontSize:10, color:'#555', marginTop:2 }}>
                        {l.description}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign:'center' }}>{l.unit || 'NOS'}</td>
                  <td style={{ textAlign:'right', fontWeight:'bold' }}>
                    {parseFloat(l.qty||0).toFixed(2)}
                  </td>
                </tr>
              ))}
              {/* Empty rows for spacing */}
              {Array(Math.max(0, 5-lines.length)).fill(0).map((_,i) => (
                <tr key={`empty-${i}`}>
                  <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                </tr>
              ))}
              {/* Total row */}
              <tr style={{ background:'#f5f5f5' }}>
                <td colSpan={2} style={{ textAlign:'right', fontWeight:'bold', paddingRight:12 }}>
                  Total
                </td>
                <td style={{ textAlign:'center', fontWeight:'bold' }}>
                  {lines[0]?.unit || 'NOS'}
                </td>
                <td style={{ textAlign:'right', fontWeight:'bold', fontSize:12 }}>
                  {totalQty.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer info */}
          <table style={{ marginBottom:8, fontSize:11, border:'none' }}>
            <tbody>
              <tr>
                <td style={{ border:'none', width:'50%', verticalAlign:'top', padding:'4px 0' }}>
                  {dc.remarks && (
                    <div><strong>Remarks :</strong> {dc.remarks}</div>
                  )}
                  <div style={{ marginTop:4 }}>
                    <strong>No of Packages :</strong> _______________
                  </div>
                  <div style={{ marginTop:4 }}>
                    <strong>Destination :</strong> {dc.shipToAddress?.split(',').slice(-3,-1).join(',').trim() || '—'}
                  </div>
                  <div style={{ marginTop:4 }}>
                    <strong>Transporter :</strong>{' '}
                    {dc.vehicleNo
                      ? `Vehicle No: ${dc.vehicleNo}${dc.driverName ? ` · Driver: ${dc.driverName}` : ''}`
                      : '—'}
                  </div>
                  {dc.ewbNo && (
                    <div style={{ marginTop:4 }}>
                      <strong>E-Way Bill No :</strong> {dc.ewbNo}
                    </div>
                  )}
                  {dc.payTerms && (
                    <div style={{ marginTop:4 }}>
                      <strong>Payment Terms :</strong> {dc.payTerms}
                    </div>
                  )}
                </td>
                <td style={{ border:'none', width:'50%', verticalAlign:'top',
                  padding:'4px 0 4px 20px', fontSize:10 }}>
                  {dc.termsConditions && (
                    <>
                      <div style={{ fontWeight:'bold', marginBottom:3 }}>Terms and Conditions :</div>
                      <div style={{ whiteSpace:'pre-line', lineHeight:1.6 }}>
                        {dc.termsConditions}
                      </div>
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Signature section */}
          <table style={{ marginTop:20, fontSize:11 }}>
            <tbody>
              <tr>
                <td style={{ width:'50%', height:60, verticalAlign:'bottom',
                  textAlign:'center', fontWeight:'bold' }}>
                  Prepared by
                </td>
                <td style={{ width:'50%', height:60, verticalAlign:'bottom',
                  textAlign:'center', fontWeight:'bold' }}>
                  Authorised Signatory<br/>
                  <span style={{ fontWeight:'normal', fontSize:10 }}>
                    {company?.name}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      </div>
    </>
  )
}
