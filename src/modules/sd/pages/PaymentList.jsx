import React from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'

const STATIC = [
  { id:'PMT-0041', date:'27 Jan 26', customer:'Sri Lakshmi Mills',  inv:'INV-0124', mode:'NEFT',   amount:'₹3,91,780', status:'paid'    },
  { id:'PMT-0040', date:'24 Jan 26', customer:'Vijay Fabrics',      inv:'INV-0120', mode:'Cheque', amount:'₹2,82,068', status:'paid'    },
  { id:'PMT-0039', date:'20 Jan 26', customer:'MEC Spinning',       inv:'INV-0118', mode:'Cash',   amount:'₹45,000',   status:'pending' },
]
const modeColor = { NEFT:'#017E84', Cheque:'#714B67', Cash:'#E06F39', IMPS:'#00A09D' }

export default function PaymentList() {
  const navigate = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Payment Receipts <small>F-28 · Customer Payments</small></div>
        <div className="lv-acts">
          <ListViewToggle viewMode={viewMode} onToggle={toggleView} /><button className="btn btn-p" onClick={()=>navigate('/sd/payments/new')}>Record Payment</button></div>
      </div>
      
      {viewMode === 'normal' && (
      <div className="dc">
        <table className="sd-tbl">
          <thead><tr><th>PMT #</th><th>Date</th><th>Customer</th><th>Invoice Ref</th><th>Mode</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {STATIC.map(p=>(
              <tr key={p.id}>
                <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{p.id}</strong></td>
                <td>{p.date}</td><td>{p.customer}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'#6C757D'}}>{p.inv}</td>
                <td><span style={{background:modeColor[p.mode]||'#6C757D',color:'#fff',borderRadius:'3px',padding:'2px 6px',fontSize:'9px',fontWeight:'700'}}>{p.mode}</span></td>
                <td><strong>{p.amount}</strong></td>
                <td><Badge status={p.status}>{p.status.toUpperCase()}</Badge></td>
                <td><button className="btn btn-s btn-xs">Receipt</button></td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan={5}>Total</td><td>₹7,18,848</td><td colSpan={2}></td></tr></tfoot>
        </table>
      </div>
    </div>
      )}

      {viewMode === 'detail' && (
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
          <div style={{padding:'12px 16px',background:'#fff',border:'1px solid var(--odoo-border)',borderRadius:8,
            color:'var(--odoo-gray)',fontSize:13,textAlign:'center'}}>
            Detail view — select a record to expand full details
          </div>
        </div>
      )}
  )
}