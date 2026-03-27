import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'
import ListViewToggle from '@components/ui/ListViewToggle'
import { useListView } from '@hooks/useListView'

const STATIC = [
  { id:'QT-0031', date:'26 Jan 26', valid:'25 Feb 26', customer:'ARS Cotton Mills',  amount:'₹5,20,000', status:'pending',   salesExec:'Admin',    remarks:'Confirm by Feb 25' },
  { id:'QT-0030', date:'20 Jan 26', valid:'19 Feb 26', customer:'New Prospect Ltd',  amount:'₹2,10,000', status:'draft',     salesExec:'Sales T1', remarks:'Initial quote' },
  { id:'QT-0029', date:'10 Jan 26', valid:'09 Feb 26', customer:'Green Mills',        amount:'₹8,40,000', status:'overdue',   salesExec:'Admin',    remarks:'Follow up required' },
  { id:'QT-0028', date:'05 Jan 26', valid:'04 Feb 26', customer:'Vijay Fabrics',      amount:'₹1,80,000', status:'won',       salesExec:'Sales T1', remarks:'Converted to SO' },
  { id:'QT-0027', date:'02 Jan 26', valid:'01 Feb 26', customer:'Rajesh Textiles',   amount:'₹3,10,000', status:'cancelled', salesExec:'Admin',    remarks:'Customer declined' },
]

const SC = {
  pending:{bg:'#FFF3CD',c:'#856404'}, draft:{bg:'#F5F5F5',c:'#666'},
  overdue:{bg:'#F8D7DA',c:'#721C24'}, won:{bg:'#D4EDDA',c:'#155724'},
  cancelled:{bg:'#F8D7DA',c:'#721C24'},
}

export default function QuotList() {
  const navigate = useNavigate()
  const { viewMode, toggleView } = useListView('SD-QuotList')
  const [search, setSearch] = useState('')

  const filtered = STATIC.filter(q =>
    q.customer.toLowerCase().includes(search.toLowerCase()) || q.id.includes(search)
  )

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Sales Quotations <small>VA21</small></div>
        <div className="lv-acts">
          <ListViewToggle viewMode={viewMode} onToggle={toggleView} />
          <button className="btn btn-p" onClick={() => navigate('/sd/quotations/new')}>New Quotation</button>
        </div>
      </div>

      <div className="sd-fb">
        <div className="sd-fs"> <input placeholder="Search QT #, customer..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="sd-fsel"><option>All Status</option><option>Pending</option><option>Won</option><option>Cancelled</option></select>
      </div>

      {/* NORMAL VIEW */}
      {viewMode === 'normal' && (
        <div>
          <div className="dc">
          <table className="sd-tbl">
            <thead><tr><th>QT #</th><th>Date</th><th>Valid Till</th><th>Customer</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} style={{cursor:'pointer'}} onClick={() => navigate(`/sd/quotations/${q.id}`)}>
                  <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:11}}>{q.id}</strong></td>
                  <td style={{fontSize:12}}>{q.date}</td>
                  <td style={{fontSize:12}}>{q.valid}</td>
                  <td style={{fontWeight:600}}>{q.customer}</td>
                  <td style={{fontFamily:'DM Mono,monospace'}}><strong>{q.amount}</strong></td>
                  <td><Badge status={q.status}>{q.status.toUpperCase()}</Badge></td>
                  <td onClick={e => e.stopPropagation()} style={{display:'flex',gap:4}}>
                    <button className="act-btn-view" onClick={() => navigate(`/sd/quotations/${q.id}`)}>View</button>
                    {q.status !== 'cancelled' && q.status !== 'won' && (
                      <button style={{padding:'3px 10px',fontSize:11,fontWeight:700,borderRadius:4,border:'1px solid #714B67',background:'#EDE0EA',color:'#714B67',cursor:'pointer'}}
                        onClick={() => navigate(`/sd/quotations/${q.id}?edit=true`)}>Edit</button>
                    )}
                    {q.status === 'pending' && (
                      <button className="act-btn-green" onClick={() => navigate('/sd/orders/new')}>→ SO</button>
                    )}
                    <button className="act-btn-print" onClick={() => navigate('/print/quotation')}>Print</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL VIEW */}
      {viewMode === 'detail' && (
        <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:4}}>
          {filtered.map(q => {
            const sc = SC[q.status] || {bg:'#eee',c:'#555'}
            return (
              <div key={q.id} onClick={() => navigate(`/sd/quotations/${q.id}`)}
                style={{background:'#fff',border:'1px solid var(--odoo-border)',borderRadius:8,
                  overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                  borderLeft:`4px solid ${sc.c}`,cursor:'pointer'}}>
                <div style={{padding:'10px 16px',background:'var(--odoo-bg)',borderBottom:'1px solid var(--odoo-border)',
                  display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:13,color:'var(--odoo-purple)'}}>{q.id}</span>
                    <span style={{fontSize:12,color:'var(--odoo-gray)'}}>{q.date}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{q.customer}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,color:'var(--odoo-purple)'}}>{q.amount}</span>
                    <span style={{padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:700,background:sc.bg,color:sc.c}}>{q.status.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px 16px'}}>
                  {[['Valid Till',q.valid],['Sales Exec',q.salesExec],['Remarks',q.remarks]].map(([l,v]) => (
                    <div key={l}>
                      <div style={{fontSize:9,color:'var(--odoo-gray)',textTransform:'uppercase',letterSpacing:.5,marginBottom:2}}>{l}</div>
                      <div style={{fontSize:12,fontWeight:600}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div onClick={e => e.stopPropagation()} style={{padding:'8px 16px',background:'var(--odoo-bg)',borderTop:'1px solid var(--odoo-border)',display:'flex',gap:8}}>
                  <button className="act-btn-view" onClick={() => navigate(`/sd/quotations/${q.id}`)}>View</button>
                  {q.status === 'pending' && <button className="act-btn-green" onClick={() => navigate('/sd/orders/new')}>Convert to SO</button>}
                  <button className="act-btn-print" onClick={() => navigate('/print/quotation')}>Print</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
