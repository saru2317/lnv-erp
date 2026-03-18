import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'

const STATIC = [
  { id:'QT-0031', date:'26 Jan 26', valid:'25 Feb 26', customer:'ARS Cotton Mills',   amount:'₹5,20,000', status:'pending' },
  { id:'QT-0030', date:'20 Jan 26', valid:'19 Feb 26', customer:'New Prospect Ltd',   amount:'₹2,10,000', status:'draft'   },
  { id:'QT-0029', date:'10 Jan 26', valid:'09 Feb 26', customer:'Green Mills',         amount:'₹8,40,000', status:'overdue' },
]
export default function QuotList() {
  const navigate = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Sales Quotations <small>VA21</small></div>
        <div className="lv-acts"><button className="btn btn-p" onClick={()=>navigate('/sd/quotations/new')}>New Quotation</button></div>
      </div>
      <div className="dc">
        <table className="sd-tbl">
          <thead><tr><th>QT #</th><th>Date</th><th>Valid Till</th><th>Customer</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {STATIC.map(q=>(
              <tr key={q.id}>
                <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{q.id}</strong></td>
                <td>{q.date}</td><td>{q.valid}</td><td>{q.customer}</td><td><strong>{q.amount}</strong></td>
                <td><Badge status={q.status}>{q.status.toUpperCase()}</Badge></td>
                <td style={{display:'flex',gap:'4px'}}>
                  {q.status !== 'overdue'
                    ? <button className="act-btn-green" onClick={()=>navigate('/sd/orders/new')}>→ Convert to SO</button>
                    : <button className="act-btn-view">View</button>}
                    <button className="act-btn-print" onClick={e=>{e.stopPropagation();navigate('/print/quotation')}}>Print</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
