import React from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'

const STATIC = [
  { id:'CN-0012', date:'15 Jan 26', customer:'Rajesh Textiles', inv:'INV-0118', reason:'Defective goods',   taxable:'₹21,017', gst:'₹3,783', total:'₹24,800', status:'paid'    },
  { id:'CN-0011', date:'10 Jan 26', customer:'Vijay Fabrics',   inv:'INV-0116', reason:'Wrong quantity',    taxable:'₹12,500', gst:'₹2,250', total:'₹14,750', status:'pending' },
]
export default function ReturnList() {
  const navigate = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Sales Returns / Credit Notes</div>
        <div className="lv-acts"><button className="btn btn-s" onClick={()=>navigate('/print/invoice')}>Print</button>
          <button className="btn btn-p" onClick={()=>navigate('/sd/returns/new')}>New Return</button></div>
      </div>
      <div className="dc">
        <table className="sd-tbl">
          <thead><tr><th>CN #</th><th>Date</th><th>Customer</th><th>Inv Ref</th><th>Reason</th><th>Taxable</th><th>GST</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {STATIC.map(r=>(
              <tr key={r.id}>
                <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{r.id}</strong></td>
                <td>{r.date}</td><td>{r.customer}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'#6C757D'}}>{r.inv}</td>
                <td>{r.reason}</td><td>{r.taxable}</td><td>{r.gst}</td><td><strong>{r.total}</strong></td>
                <td><Badge status={r.status}>{r.status.toUpperCase()}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
