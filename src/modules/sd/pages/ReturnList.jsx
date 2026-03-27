import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'
import ListViewToggle from '@components/ui/ListViewToggle'
import { useListView } from '@hooks/useListView'

const STATIC = [
  { id:'CN-0012', date:'20 Jan 26', customer:'Sri Lakshmi Mills',   invRef:'INV-0120', amount:'38,200', type:'Credit Note Only',    status:'posted'  },
  { id:'CN-0011', date:'15 Jan 26', customer:'Coimbatore Spinners', invRef:'INV-0115', amount:'12,800', type:'Material + Credit Note', status:'pending' },
  { id:'CN-0010', date:'10 Jan 26', customer:'Rajesh Textiles',     invRef:'INV-0110', amount:'8,500',  type:'Material Return',       status:'posted'  },
]

export default function ReturnList() {
  const navigate = useNavigate()
  const { viewMode, toggleView } = useListView('SD-ReturnList')
  const [search, setSearch] = useState('')

  const filtered = STATIC.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.customer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Returns / Credit Notes <small>{filtered.length} records</small></div>
        <div className="lv-acts">
          <ListViewToggle viewMode={viewMode} onToggle={toggleView} />
          <button className="btn btn-p" onClick={() => navigate('/sd/returns/new')}>+ New Return</button>
        </div>
      </div>

      <div className="sd-fb">
        <div className="sd-fs">
          <input placeholder="Search CN #, customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {viewMode === 'normal' && (
        <div className="dc">
          <table className="sd-tbl">
            <thead>
              <tr><th>CN #</th><th>Date</th><th>Customer</th><th>Invoice Ref</th><th>Type</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{cursor:'pointer'}} onClick={() => navigate(`/sd/returns/${r.id}`)}>
                  <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:11}}>{r.id}</strong></td>
                  <td style={{fontSize:12}}>{r.date}</td>
                  <td style={{fontWeight:600}}>{r.customer}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{r.invRef}</td>
                  <td style={{fontSize:11}}>{r.type}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:600}}>Rs.{r.amount}</td>
                  <td><Badge status={r.status}>{r.status.toUpperCase()}</Badge></td>
                  <td onClick={e => e.stopPropagation()} style={{display:'flex',gap:4}}>
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
          {filtered.map(r => (
            <div key={r.id} style={{background:'#fff',border:'1px solid var(--odoo-border)',
              borderRadius:8,padding:'12px 16px',cursor:'pointer'}}
              onClick={() => navigate(`/sd/returns/${r.id}`)}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)'}}>{r.id}</span>
                <span style={{fontFamily:'DM Mono,monospace',fontWeight:700}}>Rs.{r.amount}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px 12px',fontSize:11}}>
                {[['Customer',r.customer],['Invoice',r.invRef],['Type',r.type],['Date',r.date]].map(([l,v]) => (
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
