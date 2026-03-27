import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'
import ListViewToggle from '@components/ui/ListViewToggle'
import { useListView } from '@hooks/useListView'

const STATIC = [
  { id:'INV-0124', date:'27 Jan 26', customer:'Sri Lakshmi Mills',   soRef:'SO-0124', taxable:'3,32,780', gst:'59,000',    total:'3,91,780', due:'26 Feb 26', status:'paid'    },
  { id:'INV-0123', date:'25 Jan 26', customer:'Coimbatore Spinners', soRef:'SO-0123', taxable:'6,88,644', gst:'1,23,956',  total:'8,12,600', due:'24 Feb 26', status:'pending' },
  { id:'INV-0121', date:'20 Jan 26', customer:'ARS Cotton Mills',    soRef:'SO-0121', taxable:'3,92,805', gst:'70,705',    total:'4,63,510', due:'19 Jan 26', status:'overdue' },
  { id:'INV-0120', date:'18 Jan 26', customer:'Vijay Fabrics',       soRef:'SO-0120', taxable:'2,38,178', gst:'42,872',    total:'2,81,050', due:'17 Feb 26', status:'paid'    },
]

const SC = {
  paid:    { bg:'#D4EDDA', c:'#155724' },
  pending: { bg:'#FFF3CD', c:'#856404' },
  overdue: { bg:'#F8D7DA', c:'#721C24' },
}

export default function InvoiceList() {
  const navigate = useNavigate()
  const { viewMode, toggleView } = useListView('SD-InvoiceList')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const filtered = STATIC.filter(i =>
    (i.id.toLowerCase().includes(search.toLowerCase()) ||
     i.customer.toLowerCase().includes(search.toLowerCase())) &&
    (status === '' || i.status === status)
  )

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Invoices <small>VF05 · {filtered.length} records</small></div>
        <div className="lv-acts">
          <ListViewToggle viewMode={viewMode} onToggle={toggleView} />
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p" onClick={() => navigate('/sd/invoices/new')}>+ New Invoice</button>
        </div>
      </div>

      <div className="sd-fb">
        <div className="sd-fs">
          <input placeholder="Search invoice #, customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="sd-fsel" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {viewMode === 'normal' && (
        <div className="dc">
          <table className="sd-tbl">
            <thead>
              <tr>
                <th><input type="checkbox"/></th>
                <th>Invoice #</th><th>Date</th><th>Customer</th><th>SO Ref</th>
                <th>Taxable</th><th>GST</th><th>Total</th><th>Due Date</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} onClick={() => navigate(`/sd/invoices/${inv.id}`)} style={{cursor:'pointer'}}>
                  <td onClick={e => e.stopPropagation()}><input type="checkbox"/></td>
                  <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:11}}>{inv.id}</strong></td>
                  <td style={{fontSize:12}}>{inv.date}</td>
                  <td style={{fontWeight:600}}>{inv.customer}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)'}}>{inv.soRef}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>Rs.{inv.taxable}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>Rs.{inv.gst}</td>
                  <td><strong style={{fontFamily:'DM Mono,monospace'}}>Rs.{inv.total}</strong></td>
                  <td style={{fontSize:12}}>{inv.due}</td>
                  <td><Badge status={inv.status}>{inv.status.toUpperCase()}</Badge></td>
                  <td onClick={e => e.stopPropagation()} style={{display:'flex',gap:4}}>
                    <button className="act-btn-view" onClick={() => navigate(`/sd/invoices/${inv.id}`)}>View</button>
                    <button className="act-btn-print" onClick={() => navigate('/print/invoice')}>Print</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'detail' && (
        <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:4}}>
          {filtered.map(inv => {
            const sc = SC[inv.status] || {bg:'#eee',c:'#555'}
            return (
              <div key={inv.id} onClick={() => navigate(`/sd/invoices/${inv.id}`)}
                style={{background:'#fff',border:'1px solid var(--odoo-border)',borderRadius:8,
                  overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                  borderLeft:`4px solid ${sc.c}`,cursor:'pointer'}}>
                <div style={{padding:'10px 16px',background:'var(--odoo-bg)',
                  borderBottom:'1px solid var(--odoo-border)',
                  display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:13,color:'var(--odoo-purple)'}}>{inv.id}</span>
                    <span style={{fontSize:12,color:'var(--odoo-gray)'}}>{inv.date}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{inv.customer}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)'}}>Rs.{inv.total}</span>
                    <span style={{padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:700,background:sc.bg,color:sc.c}}>{inv.status.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px 16px'}}>
                  {[['SO Ref',inv.soRef],['Taxable','Rs.'+inv.taxable],['GST','Rs.'+inv.gst],['Due Date',inv.due]].map(([l,v]) => (
                    <div key={l}>
                      <div style={{fontSize:9,color:'var(--odoo-gray)',textTransform:'uppercase',letterSpacing:.5,marginBottom:2}}>{l}</div>
                      <div style={{fontSize:12,fontWeight:600}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
