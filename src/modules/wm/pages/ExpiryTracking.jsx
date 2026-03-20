import React from 'react'

const BATCHES = [
  { batch:'BTH-2024-88', mat:'Solvent Chemical (MAT-005)', qty:10, uom:'Litre', bin:'BIN-E10', mfg:'01 Sep 2024', exp:'01 Mar 2025', days:'1 day',    dc:'var(--odoo-red)',   pb:'badge-critical', pl:' Expiring!',    act:'dispose' },
  { batch:'BTH-2024-91', mat:'Lubricant Oil (MAT-007)',    qty:5,  uom:'Litre', bin:'BIN-G02', mfg:'01 Oct 2024', exp:'25 Mar 2025', days:'25 days',  dc:'var(--odoo-orange)',pb:'badge-low',     pl:' Expiring Soon',act:'priority' },
  { batch:'BTH-2025-01', mat:'Cotton Sliver (MAT-001)',    qty:480,uom:'Kg',    bin:'BIN-A12', mfg:'15 Jan 2025', exp:'15 Jan 2026', days:'321 days', dc:'var(--odoo-green)', pb:'badge-ok',      pl:' OK',            act:'' },
]

export default function ExpiryTracking() {
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Expiry Tracking <small>Batch-wise Expiry Monitor</small></div>
      </div>
      <div className="wm-alert warn">
         2 batches expiring within 30 days. Please plan consumption or disposal.
      </div>
      <table className="wm-data-table">
        <thead>
          <tr>
            <th>Batch No.</th><th>Material</th><th>Qty</th><th>UOM</th><th>Bin</th>
            <th>Mfg Date</th><th>Expiry Date</th><th>Days Left</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {BATCHES.map(b => (
            <tr key={b.batch}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{b.batch}</strong></td>
              <td>{b.mat}</td>
              <td style={{fontWeight:'600'}}>{b.qty}</td>
              <td>{b.uom}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{b.bin}</td>
              <td>{b.mfg}</td>
              <td>{b.exp}</td>
              <td style={{color:b.dc,fontWeight:'700'}}>{b.days}</td>
              <td><span className={`badge ${b.pb}`}>{b.pl}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                {b.act==='dispose'  && <button className="btn-xs dan">Dispose</button>}
                {b.act==='priority' && <button className="btn-xs" style={{borderColor:'var(--odoo-orange)',color:'var(--odoo-orange)'}}>Priority Use</button>}
                {b.act===''         && <span style={{color:'var(--odoo-gray)'}}>—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
