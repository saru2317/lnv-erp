import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'
import ListViewToggle from '@components/ui/ListViewToggle'
import { useListView } from '@hooks/useListView'

const ORDERS = [
  { id:'SO-0124', soNo:'SO-0124', date:'27 Jan 2026', customer:'Sri Lakshmi Mills Pvt Ltd',  items:'3 items', taxable:'₹3,32,780', gst:'₹59,000',  total:'₹3,91,780', status:'confirmed', delivDate:'05 Feb 2026', salesExec:'Admin',    payTerms:'Net 30',   shipTo:'Plant 1 — Hosur' },
  { id:'SO-0123', soNo:'SO-0123', date:'25 Jan 2026', customer:'Coimbatore Spinners Ltd',     items:'2 items', taxable:'₹6,88,644', gst:'₹1,23,956',total:'₹8,12,600', status:'pending',   delivDate:'10 Feb 2026', salesExec:'Sales T1',  payTerms:'Net 45',   shipTo:'Head Office'     },
  { id:'SO-0122', soNo:'SO-0122', date:'22 Jan 2026', customer:'Rajesh Textiles',             items:'1 item',  taxable:'₹1,21,017', gst:'₹21,783',  total:'₹1,42,800', status:'delivered', delivDate:'30 Jan 2026', salesExec:'Admin',    payTerms:'Net 15',   shipTo:'Factory'         },
  { id:'SO-0121', soNo:'SO-0121', date:'20 Jan 2026', customer:'ARS Cotton Mills',            items:'4 items', taxable:'₹3,92,805', gst:'₹70,705',  total:'₹4,63,510', status:'overdue',   delivDate:'28 Jan 2026', salesExec:'Sales T1',  payTerms:'Net 30',   shipTo:'Plant 2'         },
  { id:'SO-0120', soNo:'SO-0120', date:'18 Jan 2026', customer:'Vijay Fabrics',               items:'2 items', taxable:'₹2,38,178', gst:'₹42,872',  total:'₹2,81,050', status:'paid',      delivDate:'25 Jan 2026', salesExec:'Admin',    payTerms:'Net 30',   shipTo:'Warehouse'       },
]

const STATUS_COLORS = {
  confirmed:{bg:'#D4EDDA',c:'#155724'}, pending:{bg:'#FFF3CD',c:'#856404'},
  delivered:{bg:'#D1ECF1',c:'#0C5460'}, overdue:{bg:'#F8D7DA',c:'#721C24'},
  paid:{bg:'#D4EDDA',c:'#155724'},
}

export default function SOList() {
  const navigate = useNavigate()
  const { viewMode, toggleView } = useListView('SD-SOList')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = ORDERS.filter(o =>
    (o.customer.toLowerCase().includes(search.toLowerCase()) || o.soNo.includes(search)) &&
    (statusFilter==='' || o.status===statusFilter)
  )

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Sales Orders <small>VA05 · {filtered.length} Open</small></div>
        <div className="lv-acts">
          <ListViewToggle viewMode={viewMode} onToggle={toggleView} />
          <button className="btn btn-s sd-bsm" onClick={() => navigate('/sd/item-ledger')}>Item Ledger</button>
          <button className="btn btn-s sd-bsm" onClick={() => navigate('/sd/quotations/new')}>New Quotation</button>
          <button className="btn btn-p" onClick={() => navigate('/sd/orders/new')}>+ New Sales Order</button>
        </div>
      </div>

      {/* Filters */}
      <div className="sd-fb">
        <div className="sd-fs">
           <input placeholder="Search SO #, customer..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="sd-fsel" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </select>
        <select className="sd-fsel"><option>All Dates</option><option>This Month</option><option>Last Month</option></select>
        <select className="sd-fsel"><option>All Customers</option>{[...new Set(ORDERS.map(o=>o.customer))].map(c=><option key={c}>{c}</option>)}</select>
        <button className="btn btn-s sd-bsm">Export</button>
      </div>

      {/*  NORMAL TABLE VIEW  */}
      {viewMode === 'normal' && (
        <div className="dc">
          <table className="sd-tbl">
            <thead>
              <tr>
                <th><input type="checkbox"/></th>
                <th>SO NUMBER</th><th>DATE</th><th>CUSTOMER</th><th>ITEMS</th>
                <th>TAXABLE</th><th>GST</th><th>TOTAL</th><th>STATUS</th><th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} onClick={()=>navigate(`/sd/orders/${o.id}`)} style={{cursor:'pointer'}}>
                  <td onClick={e=>e.stopPropagation()}><input type="checkbox"/></td>
                  <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:11}}>{o.soNo}</strong></td>
                  <td style={{fontSize:12}}>{o.date}</td>
                  <td><strong style={{fontSize:12}}>{o.customer}</strong></td>
                  <td style={{fontSize:12}}>{o.items}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>{o.taxable}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>{o.gst}</td>
                  <td><strong style={{fontFamily:'DM Mono,monospace'}}>{o.total}</strong></td>
                  <td><Badge status={o.status}>{o.status.toUpperCase()}</Badge></td>
                  <td onClick={e=>e.stopPropagation()} style={{display:'flex',gap:4}}>
                    <button className="act-btn-view" onClick={()=>navigate(`/sd/orders/${o.id}`)}>View</button>
                    <button className="act-btn-print" onClick={()=>navigate('/print/so')}>Print</button>
                    {o.status!=='paid'&&o.status!=='overdue'&&(
                      <button className="act-btn-green" onClick={()=>navigate('/sd/invoices/new')}>Invoice</button>
                    )}
                    {o.status==='overdue'&&(
                      <button className="act-btn-orange">Remind</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:'var(--odoo-purple-lt)',fontWeight:700}}>
                <td colSpan={5} style={{padding:'10px 12px'}}>Total ({filtered.length} shown)</td>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace'}}>
                  ₹{filtered.reduce((s,o)=>s+parseInt(o.taxable.replace(/[^0-9]/g,'')),0).toLocaleString('en-IN')}
                </td>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace'}}>
                  ₹{filtered.reduce((s,o)=>s+parseInt(o.gst.replace(/[^0-9]/g,'')),0).toLocaleString('en-IN')}
                </td>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)',fontSize:14,fontWeight:800}}>
                  ₹{filtered.reduce((s,o)=>s+parseInt(o.total.replace(/[^0-9]/g,'')),0).toLocaleString('en-IN')}
                </td>
                <td colSpan={2}/>
              </tr>
            </tfoot>
          </table>
          <div className="sd-pgn">
            <span>Showing 1–{filtered.length} of {ORDERS.length}</span>
            <div className="sd-pbs">
              <div className="sd-pb">‹</div>
              <div className="sd-pb" style={{background:'#714B67',color:'#fff',borderColor:'#714B67'}}>1</div>
              <div className="sd-pb">2</div>
              <div className="sd-pb">3</div>
              <div className="sd-pb">›</div>
            </div>
          </div>
        </div>
      )}

      {/*  DETAIL CARD VIEW  */}
      {viewMode === 'detail' && (
        <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:4}}>
          {filtered.map(o => {
            const sc = STATUS_COLORS[o.status]||{bg:'#eee',c:'#555'}
            return (
              <div key={o.id}
                style={{background:'#fff',border:'1px solid var(--odoo-border)',
                  borderRadius:8,overflow:'hidden',
                  boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                  borderLeft:`4px solid ${sc.c}`,
                  cursor:'pointer',transition:'all .2s'}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.12)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'}
                onClick={()=>navigate(`/sd/orders/${o.id}`)}>

                {/* Card header */}
                <div style={{padding:'10px 16px',background:'var(--odoo-bg)',
                  borderBottom:'1px solid var(--odoo-border)',
                  display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontFamily:'DM Mono,monospace',fontSize:14,fontWeight:800,
                      color:'var(--odoo-purple)'}}>{o.soNo}</span>
                    <span style={{fontSize:12,color:'var(--odoo-gray)'}}>{o.date}</span>
                    <span style={{fontSize:12,fontWeight:600,color:'var(--odoo-dark)'}}>{o.customer}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,
                      color:'var(--odoo-purple)'}}>{o.total}</span>
                    <span style={{padding:'3px 12px',borderRadius:10,fontSize:11,
                      fontWeight:700,background:sc.bg,color:sc.c}}>
                      {o.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Card body — all fields in grid */}
                <div style={{padding:'12px 16px',
                  display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'10px 16px'}}>
                  {[
                    ['Items',          o.items],
                    ['Taxable',        o.taxable],
                    ['GST',            o.gst],
                    ['Delivery Date',  o.delivDate],
                    ['Sales Executive',o.salesExec],
                    ['Payment Terms',  o.payTerms],
                    ['Ship To',        o.shipTo],
                  ].map(([label,val]) => (
                    <div key={label}>
                      <div style={{fontSize:9,color:'var(--odoo-gray)',
                        textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>{label}</div>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--odoo-dark)'}}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Card footer */}
                <div onClick={e=>e.stopPropagation()}
                  style={{padding:'8px 16px',background:'var(--odoo-bg)',
                    borderTop:'1px solid var(--odoo-border)',
                    display:'flex',gap:8,alignItems:'center'}}>
                  <button className="act-btn-view"
                    onClick={()=>navigate(`/sd/orders/${o.id}`)}>View Details</button>
                  <button className="act-btn-print"
                    onClick={()=>navigate('/print/so')}>Print SO</button>
                  {o.status!=='paid'&&o.status!=='overdue'&&(
                    <button className="act-btn-green"
                      onClick={()=>navigate('/sd/invoices/new')}>Create Invoice</button>
                  )}
                  {o.status==='overdue'&&(
                    <button className="act-btn-orange">Send Reminder</button>
                  )}
                  <span style={{marginLeft:'auto',fontSize:11,color:'var(--odoo-gray)'}}>
                    {o.items} · {o.payTerms}
                  </span>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{padding:40,textAlign:'center',color:'var(--odoo-gray)',fontSize:13}}>
              No orders found for the selected filter.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
