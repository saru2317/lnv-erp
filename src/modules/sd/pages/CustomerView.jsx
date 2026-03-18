import React from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'

export default function CustomerView() {
  const navigate = useNavigate()
  const c = { id:'C-001', name:'Sri Lakshmi Mills Pvt Ltd', gstin:'33AABCS1429B1Z5', state:'Tamil Nadu (33)', mobile:'9876543210', creditLimit:'₹5,00,000', outstanding:'₹3,91,680', terms:'Net 30 Days' }
  const txns = [
    { doc:'INV-0124', type:'Invoice',     amount:'₹3,91,780', status:'paid'      },
    { doc:'SO-0124',  type:'Sales Order', amount:'₹3,91,780', status:'confirmed' },
    { doc:'PMT-0041', type:'Payment',     amount:'₹3,91,780', status:'paid'      },
  ]
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">{c.name} <small>{c.id} · Profile</small></div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={() => navigate('/sd/customers')}>← Back</button>
          <button className="btn btn-p" onClick={() => navigate('/sd/invoices/new')}>🧾 New Invoice</button>
          <button className="btn btn-s" onClick={() => navigate('/sd/orders/new')}>📋 New Order</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        <div className="sd-fc">
          <div className="sd-fb2">
            <div className="sd-stt">👥 Customer Info</div>
            <table style={{width:'100%',fontSize:'12px'}}>
              <tbody>
                {[['Customer Code',c.id],['GSTIN',c.gstin],['State',c.state],['Mobile',c.mobile],['Credit Limit',c.creditLimit],['Outstanding',c.outstanding],['Payment Terms',c.terms]].map(([k,v])=>(
                  <tr key={k}>
                    <td style={{padding:'5px',color:'#6C757D',width:'40%'}}>{k}</td>
                    <td style={{padding:'5px',fontWeight:'600',color: k==='GSTIN'?'#714B67': k==='Outstanding'?'#E06F39': k==='Credit Limit'?'#00A09D':'#212529'}}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="dc">
          <div className="dc-hd"><h4>📊 Transaction Summary</h4></div>
          <table className="sd-tbl">
            <thead><tr><th>Doc #</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {txns.map(t=>(
                <tr key={t.doc}>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'#714B67'}}>{t.doc}</td>
                  <td>{t.type}</td>
                  <td><strong>{t.amount}</strong></td>
                  <td><Badge status={t.status}>{t.status.toUpperCase()}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
