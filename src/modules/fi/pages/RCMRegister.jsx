import React from 'react'

const RCM_ROWS = [
  { serv:'Legal Services',         vendor:'Advocate Shankar & Co.',  date:'05 Mar', amt:50000,  cgst:4500, sgst:4500, igst:0,   rcm:9000,  status:'paid'    },
  { serv:'GTA (Freight)',           vendor:'Chennai Cargo Pvt Ltd',   date:'08 Mar', amt:18000,  cgst:0,    sgst:0,    igst:1800, rcm:1800,  status:'pending' },
  { serv:'Security Services',       vendor:'Vijay Security (Unreg.)', date:'10 Mar', amt:25000,  cgst:2250, sgst:2250, igst:0,   rcm:4500,  status:'paid'    },
  { serv:'Sponsorship Services',    vendor:'Event Organizers Ltd',    date:'12 Mar', amt:100000, cgst:9000, sgst:9000, igst:0,   rcm:18000, status:'pending' },
  { serv:'Import of Services',      vendor:'Foreign Consultant',      date:'14 Mar', amt:150000, cgst:0,    sgst:0,    igst:27000,rcm:27000, status:'paid'    },
]

export default function RCMRegister() {
  const totalRCM = RCM_ROWS.reduce((s,r)=>s+r.rcm,0)
  const paidRCM  = RCM_ROWS.filter(r=>r.status==='paid').reduce((s,r)=>s+r.rcm,0)
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">RCM Register <small>Reverse Charge Mechanism · Self-Invoice Liability</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">+ New RCM Entry</button>
          <button className="btn btn-p sd-bsm">Push to GSTR-3B</button>
        </div>
      </div>
      <div className="fi-alert warn" style={{marginBottom:16}}>
         Under RCM, <strong>you (recipient) pay GST</strong> directly to govt — not the vendor. Self-invoice required. ITC available only after payment.
      </div>
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:20}}>
        {[
          {cls:'purple',l:'Total RCM Liability', v:`₹${totalRCM.toLocaleString('en-IN')}`, s:'This month'},
          {cls:'green', l:'RCM Paid',             v:`₹${paidRCM.toLocaleString('en-IN')}`,  s:'Cash paid to govt'},
          {cls:'red',   l:'RCM Pending',          v:`₹${(totalRCM-paidRCM).toLocaleString('en-IN')}`, s:'To be paid'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Service Type</th><th>Vendor</th><th>Date</th><th>Amount</th><th>CGST</th><th>SGST</th><th>IGST</th><th>RCM Liability</th><th>Status</th></tr></thead>
        <tbody>
          {RCM_ROWS.map((r,i)=>(
            <tr key={i}>
              <td style={{fontSize:12,fontWeight:600}}>{r.serv}</td>
              <td style={{fontSize:12}}>{r.vendor}</td>
              <td>{r.date}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>₹{r.amt.toLocaleString('en-IN')}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-green)'}}>{r.cgst>0?`₹${r.cgst.toLocaleString('en-IN')}`:'—'}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-green)'}}>{r.sgst>0?`₹${r.sgst.toLocaleString('en-IN')}`:'—'}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-blue)'}}>{r.igst>0?`₹${r.igst.toLocaleString('en-IN')}`:'—'}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:13,fontWeight:700,color:'var(--odoo-purple)'}}>₹{r.rcm.toLocaleString('en-IN')}</td>
              <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,
                background:r.status==='paid'?'#D4EDDA':'#FFF3CD',
                color:r.status==='paid'?'#155724':'#856404'}}>
                {r.status==='paid'?' Paid':' Pending'}
              </span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
