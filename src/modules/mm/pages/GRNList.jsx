import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ListViewToggle from '@components/ui/ListViewToggle'
import { useListView } from '@hooks/useListView'

const GRNS = [
  { id:'GRN-2025-018', po:'PO-2025-040', vendor:'Sri Murugan Traders',  date:'26 Feb 2025', mat:'Packing Boxes',   ord:'1000 Nos', recv:'1000 Nos', ql:'Accepted',  sl:'Fully Received' },
  { id:'GRN-2025-017', po:'PO-2025-039', vendor:'Aruna Industries',      date:'24 Feb 2025', mat:'Solvent Chemical', ord:'50 Litre',  recv:'30 Litre',  ql:'Accepted',  sl:'Partial Receipt' },
  { id:'GRN-2025-016', po:'PO-2025-037', vendor:'Shree Cotton Mills',    date:'21 Feb 2025', mat:'Cotton Sliver',    ord:'300 Kg',    recv:'295 Kg',    ql:'QC Pending',sl:'Fully Received' },
]

export default function GRNList() {
  const nav = useNavigate()
  const { viewMode, toggleView } = useListView('MM-GRNList')

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Goods Receipt Notes <small>MB51</small></div>
        <div className="lv-acts">
          <ListViewToggle viewMode={viewMode} onToggle={toggleView} />
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/grn/new')}>+ Record GRN</button>
        </div>
      </div>

      <div className="mm-filt">
        <div className="mm-fs-input"><input placeholder="Search GRN No., PO No., Vendor..."/></div>
        <select className="mm-fsel"><option>All Vendors</option><option>Sri Murugan Traders</option></select>
        <select className="mm-fsel"><option>All Status</option><option>Fully Received</option><option>Partial</option></select>
      </div>

      {viewMode === 'normal' && (
        <div>
          <table className="mm-tbl">
            <thead>
              <tr>
                <th><input type="checkbox"/></th>
                <th>GRN No.</th><th>PO No.</th><th>Vendor</th><th>Date</th>
                <th>Material</th><th>Ordered</th><th>Received</th>
                <th>Quality</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {GRNS.map(g => (
                <tr key={g.id}>
                  <td><input type="checkbox"/></td>
                  <td><strong style={{color:'var(--odoo-purple)',fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{g.id}</strong></td>
                  <td style={{color:'var(--odoo-purple)',fontSize:'12px'}}>{g.po}</td>
                  <td>{g.vendor}</td><td>{g.date}</td><td>{g.mat}</td>
                  <td>{g.ord}</td><td>{g.recv}</td>
                  <td><span className="mm-badge mm-bdg-approved">{g.ql}</span></td>
                  <td><span className="mm-badge mm-bdg-received">{g.sl}</span></td>
                  <td onClick={e => e.stopPropagation()} style={{display:'flex',gap:4}}>
                    <button className="btn-xs">View</button>
                    <button className="btn-xs" onClick={() => nav('/print/grn')}>Print</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'detail' && (
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
          <div style={{padding:'12px 16px',background:'#fff',border:'1px solid var(--odoo-border)',
            borderRadius:8,color:'var(--odoo-gray)',fontSize:13,textAlign:'center'}}>
            Detail view — select a record to expand full details
          </div>
        </div>
      )}
    </div>
  )
}
