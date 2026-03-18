import React from 'react'

const BINS = [
  { code:'BIN-A01 to BIN-A12', desc:'Row A — Raw Material Zone',      wh:'Main Store', row:'A', type:'Rack',    cap:'600 Kg each',    cur:'480 Kg avg',   b:'badge-ok',l:'Active' },
  { code:'BIN-B01 to BIN-B06', desc:'Row B — Yarn Storage',            wh:'Main Store', row:'B', type:'Rack',    cap:'300 Kg each',    cur:'120 Kg avg',   b:'badge-ok',l:'Active' },
  { code:'BIN-C01 to BIN-C06', desc:'Row C — Spares & Small Parts',    wh:'Main Store', row:'C', type:'Shelf',   cap:'200 Nos each',   cur:'85 Nos avg',   b:'badge-ok',l:'Active' },
  { code:'BIN-E01 to BIN-E12', desc:'Row E — Chemical Storage',        wh:'Main Store', row:'E', type:'Cabinet', cap:'200 Litre each', cur:'50 Litre avg', b:'badge-ok',l:'Active' },
  { code:'BIN-F01 to BIN-F08', desc:'Row F — Packing Zone',             wh:'Main Store', row:'F', type:'Pallet',  cap:'2000 Nos each',  cur:'850 Nos avg',  b:'badge-ok',l:'Active' },
]

export default function BinMaster() {
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Bin / Location Master <small>Storage Location Configuration</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-p sd-bsm">Add Bin</button>
        </div>
      </div>
      <table className="wm-data-table">
        <thead>
          <tr>
            <th>Bin Code</th><th>Description</th><th>Warehouse</th>
            <th>Row</th><th>Type</th><th>Capacity</th><th>Current Use</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {BINS.map(b => (
            <tr key={b.code}>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)',fontWeight:'700'}}>{b.code}</td>
              <td>{b.desc}</td>
              <td>{b.wh}</td>
              <td style={{textAlign:'center',fontWeight:'700'}}>{b.row}</td>
              <td><span className="badge badge-in">{b.type}</span></td>
              <td style={{color:'var(--odoo-gray)'}}>{b.cap}</td>
              <td style={{fontWeight:'600'}}>{b.cur}</td>
              <td><span className={`badge ${b.b}`}>{b.l}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
