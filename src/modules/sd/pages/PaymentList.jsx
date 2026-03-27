import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'
import ListViewToggle from '@components/ui/ListViewToggle'
import { useListView } from '@hooks/useListView'

const STATIC = [
  { id:'PMT-0041', date:'28 Jan 26', customer:'Sri Lakshmi Mills',   invRef:'INV-0124', amount:'3,91,780', mode:'Bank Transfer', status:'paid'    },
  { id:'PMT-0040', date:'25 Jan 26', customer:'Rajesh Textiles',     invRef:'INV-0118', amount:'1,42,800', mode:'Cheque',        status:'pending' },
  { id:'PMT-0039', date:'22 Jan 26', customer:'Vijay Fabrics',       invRef:'INV-0116', amount:'2,81,050', mode:'Bank Transfer', status:'paid'    },
]

export default function PaymentList() {
  const navigate = useNavigate()
  const { viewMode, toggleView } = useListView('SD-PaymentList')
  const [search, setSearch] = useState('')

  const filtered = STATIC.filter(p =>
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.customer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Payment Receipts <small>F-28 · {filtered.length} records</small></div>
        <div className="lv-acts">
          <ListViewToggle viewMode={viewMode} onToggle={toggleView} />
          <button className="btn btn-p" onClick={() => navigate('/sd/payments/new')}>+ New Receipt</button>
        </div>
      </div>

      <div className="sd-fb">
        <div className="sd-fs">
          <input placeholder="Search PMT #, customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {viewMode === 'normal' && (
        <div className="dc">
          <table className="sd-tbl">
            <thead>
              <tr><th>Receipt #</th><th>Date</th><th>Customer</th><th>Invoice Ref</th><th>Amount</th><th>Mode</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{cursor:'pointer'}}>
                  <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:11}}>{p.id}</strong></td>
                  <td style={{fontSize:12}}>{p.date}</td>
                  <td style={{fontWeight:600}}>{p.customer}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{p.invRef}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700}}>Rs.{p.amount}</td>
                  <td style={{fontSize:12}}>{p.mode}</td>
                  <td><Badge status={p.status}>{p.status.toUpperCase()}</Badge></td>
                  <td style={{display:'flex',gap:4}}>
                    <button className="act-btn-view">View</button>
                    <button className="act-btn-print">Print</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'detail' && (
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
          {filtered.map(p => (
            <div key={p.id} style={{background:'#fff',border:'1px solid var(--odoo-border)',
              borderRadius:8,padding:'12px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)'}}>{p.id}</span>
                <span style={{fontFamily:'DM Mono,monospace',fontWeight:700}}>Rs.{p.amount}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px 12px',fontSize:11}}>
                {[['Customer',p.customer],['Invoice',p.invRef],['Mode',p.mode],['Date',p.date]].map(([l,v]) => (
                  <div key={l}><div style={{color:'var(--odoo-gray)',fontSize:9,textTransform:'uppercase',marginBottom:2}}>{l}</div><div style={{fontWeight:600}}>{v}</div></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
