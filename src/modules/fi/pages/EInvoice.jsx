import React, { useState } from 'react'

const INVOICES = [
  { inv:'INV-2026-0082', cust:'Ashok Leyland',      gstin:'33AABCA1234B1Z1', date:'05 Mar', val:391680,  irn:'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890', qr:true,  status:'generated', ack:'2603000001' },
  { inv:'INV-2026-0083', cust:'TVS Motors',          gstin:'33AABCT5678B1Z2', date:'08 Mar', val:812160,  irn:'b2c3d4e5f6789012345678901234567890123456789012345678901234567890ab', qr:true,  status:'generated', ack:'2603000002' },
  { inv:'INV-2026-0084', cust:'Coimbatore Spinners', gstin:'33AABCS9012B1Z3', date:'10 Mar', val:142800,  irn:null, qr:false, status:'pending',   ack:null },
  { inv:'INV-2026-0085', cust:'Rajesh Textiles',     gstin:'33AABCR3456B1Z4', date:'12 Mar', val:463510,  irn:null, qr:false, status:'failed',    ack:null, err:'GSTIN mismatch with GST Portal' },
  { inv:'INV-2026-0086', cust:'ARS Cotton Mills',    gstin:'33AABCA7890B1Z5', date:'14 Mar', val:282068,  irn:'c3d4e5f6789012345678901234567890123456789012345678901234567890abc', qr:true,  status:'generated', ack:'2603000003' },
]

const STATUS_CONFIG = {
  generated: { label:'✅ IRN Generated', bg:'#D4EDDA', color:'#155724' },
  pending:   { label:'🕐 Pending',       bg:'#FFF3CD', color:'#856404' },
  failed:    { label:'❌ Failed',         bg:'#F8D7DA', color:'#721C24' },
}

export default function EInvoice() {
  const [selected, setSelected] = useState(null)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">E-Invoice (IRN) <small>Invoice Reference Number · GST Portal Integration</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">🔄 Sync with Portal</button>
          <button className="btn btn-p sd-bsm">⬇️ Bulk Download QR</button>
        </div>
      </div>

      <div className="fi-alert info" style={{marginBottom:16}}>
        ℹ️ E-Invoice mandatory for turnover &gt; ₹5 Cr. IRN generated from GST Portal (IRP). QR code must be printed on invoice.
      </div>

      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
        {[
          {cls:'green',  l:'IRN Generated', v:`${INVOICES.filter(i=>i.status==='generated').length}`, s:'This month'},
          {cls:'orange', l:'Pending',       v:`${INVOICES.filter(i=>i.status==='pending').length}`,   s:'Awaiting generation'},
          {cls:'red',    l:'Failed',        v:`${INVOICES.filter(i=>i.status==='failed').length}`,    s:'Error on portal'},
          {cls:'purple', l:'Total Value',   v:'₹20.9L', s:'E-Invoice covered'},
        ].map(k => (
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead>
          <tr>
            <th>Invoice No.</th><th>Customer</th><th>GSTIN</th><th>Date</th>
            <th>Value</th><th>ACK No.</th><th>IRN</th><th>QR</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {INVOICES.map(inv => {
            const sc = STATUS_CONFIG[inv.status]
            return (
              <tr key={inv.inv}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{inv.inv}</strong></td>
                <td style={{fontSize:12,fontWeight:600}}>{inv.cust}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-gray)'}}>{inv.gstin}</td>
                <td>{inv.date}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:600}}>₹{inv.val.toLocaleString('en-IN')}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{inv.ack || '—'}</td>
                <td style={{maxWidth:120}}>
                  {inv.irn
                    ? <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--odoo-gray)',
                        display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {inv.irn.substring(0,20)}…
                      </span>
                    : <span style={{color:'var(--odoo-gray)',fontSize:11}}>—</span>
                  }
                </td>
                <td style={{textAlign:'center'}}>{inv.qr ? '✅' : '—'}</td>
                <td>
                  <span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:sc.bg,color:sc.color}}>
                    {sc.label}
                  </span>
                  {inv.err && <div style={{fontSize:10,color:'var(--odoo-red)',marginTop:2}}>{inv.err}</div>}
                </td>
                <td>
                  {inv.status==='generated' && <button className="btn-xs" style={{marginRight:4}}>📄 PDF</button>}
                  {inv.status==='pending'   && <button className="btn-xs pri">Generate IRN</button>}
                  {inv.status==='failed'    && <button className="btn-xs" style={{background:'var(--odoo-red)',color:'#fff'}}>Retry</button>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
