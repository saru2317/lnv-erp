import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MRP = [
  {mat:'Ring Yarn (MAT-002)',req:'500 Kg',stock:'80 Kg',open:'0',net:'-420 Kg',order:'500 Kg',by:'01 Mar 2025',sb:'badge-hold',sl:'🔴 Urgent',urgent:true},
  {mat:'Solvent Chemical (MAT-005)',req:'100 Litre',stock:'25 Litre',open:'0',net:'-75 Litre',order:'200 Litre',by:'03 Mar 2025',sb:'badge-hold',sl:'🔴 Urgent',urgent:true},
  {mat:'Cotton Sliver (MAT-001)',req:'880 Kg',stock:'480 Kg',open:'400 Kg',net:'0 Kg',order:'400 Kg',by:'05 Mar 2025',sb:'badge-progress',sl:'⚠️ Plan',urgent:false},
  {mat:'Lattice Aprons (MAT-003)',req:'20 Nos',stock:'35 Nos',open:'0',net:'+15 Nos',order:'—',by:'—',sb:'badge-done',sl:'✅ OK',urgent:false},
  {mat:'Packing Boxes (MAT-004)',req:'500 Nos',stock:'850 Nos',open:'0',net:'+350 Nos',order:'—',by:'—',sb:'badge-done',sl:'✅ OK',urgent:false},
  {mat:'OE Rotors (MAT-006)',req:'24 Nos',stock:'24 Nos',open:'0',net:'0 Nos',order:'24 Nos',by:'08 Mar 2025',sb:'badge-progress',sl:'⚠️ Plan',urgent:false},
  {mat:'Card Clothing (MAT-007)',req:'4 Set',stock:'5 Set',open:'0',net:'+1 Set',order:'—',by:'—',sb:'badge-done',sl:'✅ OK',urgent:false},
]

export default function MRPList() {
  const nav = useNavigate()
  const [filter, setFilter] = useState('All')

  const filtered = filter==='All' ? MRP :
    filter==='Urgent' ? MRP.filter(m=>m.urgent) :
    filter==='Plan' ? MRP.filter(m=>m.sl.includes('Plan')) :
    MRP.filter(m=>m.sl.includes('OK'))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">MRP Results <small>MD04 · Stock / Requirements List</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/mrp')}>🔄 Re-run MRP</button>
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm">📤 Raise All POs</button>
        </div>
      </div>

      <div className="pp-chips">
        {['All','Urgent','Plan','OK'].map(c=>(
          <div key={c} className={`pp-chip${filter===c?' on':''}`} onClick={() => setFilter(c)}>{c}</div>
        ))}
      </div>

      {MRP.filter(m=>m.urgent).length > 0 && (
        <div className="pp-alert warn">
          ⚠️ <strong>{MRP.filter(m=>m.urgent).length} materials need urgent PO.</strong> Ring Yarn and Solvent Chemical are critically short — production may stop.
        </div>
      )}

      <table className="fi-data-table">
        <thead><tr>
          <th>Material</th><th>Requirement</th><th>Stock</th><th>Open PO</th>
          <th>Net</th><th>Planned Order</th><th>Order By</th><th>Status</th><th>Action</th>
        </tr></thead>
        <tbody>
          {filtered.map(m=>(
            <tr key={m.mat} className={m.urgent?'mrp-critical':m.sl.includes('Plan')?'mrp-shortage':'mrp-ok'}>
              <td><strong>{m.mat}</strong></td>
              <td>{m.req}</td>
              <td style={{fontWeight:'600',color:m.net.startsWith('-')?'var(--odoo-red)':'var(--odoo-green)'}}>{m.stock}</td>
              <td>{m.open}</td>
              <td style={{fontWeight:'700',color:m.net.startsWith('-')?'var(--odoo-red)':m.net.startsWith('+')?'var(--odoo-green)':'var(--odoo-gray)'}}>{m.net}</td>
              <td style={{fontWeight:'700'}}>{m.order}</td>
              <td style={{fontSize:'12px',color:m.urgent?'var(--odoo-red)':'inherit'}}>{m.by}</td>
              <td><span className={`badge ${m.sb}`}>{m.sl}</span></td>
              <td>
                {m.order!=='—' && (
                  <button className={`btn-xs ${m.urgent?'pri':''}`}>
                    {m.urgent?'🚨 Raise PO':'📋 Plan PO'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
