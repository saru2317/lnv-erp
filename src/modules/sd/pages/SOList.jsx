import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'
import { sdApi } from '../services/sdApi'

const STATIC_ORDERS = [
  { id:'SO-0124', date:'27 Jan 2026', customer:'Sri Lakshmi Mills',     items:'3 items', taxable:'₹3,32,780', gst:'₹59,000',    total:'₹3,91,780', status:'confirmed' },
  { id:'SO-0123', date:'25 Jan 2026', customer:'Coimbatore Spinners',   items:'2 items', taxable:'₹6,88,644', gst:'₹1,23,956', total:'₹8,12,600', status:'pending'   },
  { id:'SO-0122', date:'22 Jan 2026', customer:'Rajesh Textiles',       items:'1 item',  taxable:'₹1,21,017', gst:'₹21,783',   total:'₹1,42,800', status:'delivered' },
  { id:'SO-0121', date:'20 Jan 2026', customer:'ARS Cotton Mills',      items:'4 items', taxable:'₹3,92,805', gst:'₹70,705',   total:'₹4,63,510', status:'overdue'   },
  { id:'SO-0120', date:'18 Jan 2026', customer:'Vijay Fabrics',         items:'2 items', taxable:'₹2,38,178', gst:'₹42,872',   total:'₹2,81,050', status:'paid'      },
]

export default function SOList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState(STATIC_ORDERS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    sdApi.getOrders({ search, status: statusFilter })
      .then(r => { if (r.data?.length) setOrders(r.data) })
      .catch(() => {})
  }, [search, statusFilter])

  const filtered = orders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.customer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Sales Orders <small>VA05 · {filtered.length} Open</small></div>
        <div className="lv-acts">
          <button className="btn btn-s btn-sm" onClick={() => navigate('/sd/quotations/new')}>📝 New Quotation</button>
          <button className="btn btn-p" onClick={() => navigate('/sd/orders/new')}>➕ New Sales Order</button>
        </div>
      </div>

      <div className="sd-fb">
        <div className="sd-fs">🔍 <input placeholder="Search SO #, customer…" value={search} onChange={e=>setSearch(e.target.value)} /></div>
        <select className="sd-fsel" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All Status</option><option value="draft">Draft</option><option value="confirmed">Confirmed</option>
          <option value="delivered">Delivered</option><option value="paid">Invoiced</option>
        </select>
        <select className="sd-fsel"><option>All Dates</option><option>This Month</option><option>Last Month</option></select>
        <select className="sd-fsel"><option>All Customers</option><option>Sri Lakshmi Mills</option><option>Coimbatore Spinners</option></select>
        <button className="btn btn-s btn-sm">⬇️ Export</button>
      </div>

      <div className="dc">
        <table className="sd-tbl">
          <thead>
            <tr>
              <th><input type="checkbox"/></th>
              <th>SO Number</th><th>Date</th><th>Customer</th><th>Items</th>
              <th>Taxable</th><th>GST</th><th>Total</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o=>(
              <tr key={o.id} onClick={()=>navigate(`/sd/orders/${o.id}`)}>
                <td onClick={e=>e.stopPropagation()}><input type="checkbox"/></td>
                <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{o.id}</strong></td>
                <td>{o.date}</td>
                <td>{o.customer}</td>
                <td style={{color:'#6C757D'}}>{o.items}</td>
                <td>{o.taxable}</td>
                <td>{o.gst}</td>
                <td><strong>{o.total}</strong></td>
                <td><Badge status={o.status}>{o.status.toUpperCase()}</Badge></td>
                <td onClick={e=>e.stopPropagation()} style={{display:'flex',gap:'4px'}}>
                  <button className="act-btn-view" onClick={()=>navigate(`/sd/orders/${o.id}`)}>View</button>
                  <button className="act-btn-print" onClick={e=>{e.stopPropagation();navigate('/print/so')}}>🖨️</button>
                  {o.status !== 'overdue' && o.status !== 'paid' && (
                    <button className="act-btn-green" onClick={()=>navigate('/sd/invoices/new')}>Invoice</button>
                  )}
                  {o.status === 'overdue' && (
                    <button className="act-btn-orange">Remind</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>Total ({filtered.length} shown)</td>
              <td>₹17,73,424</td><td>₹3,18,316</td><td>₹21,91,740</td><td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
        <div className="sd-pgn">
          <span>Showing 1–{filtered.length} of {orders.length}</span>
          <div className="sd-pbs">
            <div className="sd-pb">‹</div>
            <div className="sd-pb" style={{background:'#714B67',color:'#fff',borderColor:'#714B67'}}>1</div>
            <div className="sd-pb">2</div><div className="sd-pb">3</div><div className="sd-pb">›</div>
          </div>
        </div>
      </div>
    </div>
  )
}
