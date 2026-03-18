import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'
import { sdApi } from '../services/sdApi'

const STATIC = [
  { id:'INV-0124', date:'27 Jan 26', customer:'Sri Lakshmi Mills',   soRef:'SO-0124', taxable:'₹3,32,780', gst:'₹59,000',    total:'₹3,91,780', due:'26 Feb 26', status:'paid'    },
  { id:'INV-0123', date:'25 Jan 26', customer:'Coimbatore Spinners', soRef:'SO-0123', taxable:'₹6,88,644', gst:'₹1,23,956', total:'₹8,12,600', due:'24 Feb 26', status:'pending' },
  { id:'INV-0121', date:'20 Jan 26', customer:'ARS Cotton Mills',    soRef:'SO-0121', taxable:'₹3,92,805', gst:'₹70,705',   total:'₹4,63,510', due:'19 Jan 26', status:'overdue' },
  { id:'INV-0120', date:'18 Jan 26', customer:'Vijay Fabrics',       soRef:'SO-0120', taxable:'₹2,38,178', gst:'₹42,872',   total:'₹2,81,050', due:'17 Feb 26', status:'paid'    },
]

export default function InvoiceList() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState(STATIC)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')

  useEffect(() => {
    sdApi.getInvoices({ search, status })
      .then(r => { if (r.data?.length) setInvoices(r.data) })
      .catch(() => {})
  }, [search, status])

  const filtered = invoices.filter(i =>
    i.id.toLowerCase().includes(search.toLowerCase()) ||
    i.customer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Tax Invoices <small>VF01 · GST Invoices</small></div>
        <div className="lv-acts">
          <button className="btn btn-s btn-sm">Export</button>
          <button className="btn btn-s btn-sm">GST Report</button>
          <button className="btn btn-p" onClick={() => navigate('/sd/invoices/new')}>New Invoice</button>
        </div>
      </div>

      <div className="sd-fb">
        <div className="sd-fs">🔍<input placeholder="Search invoice #, customer…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="sd-fsel" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All Status</option><option value="draft">Draft</option><option value="pending">Pending</option>
          <option value="paid">Paid</option><option value="overdue">Overdue</option>
        </select>
        <select className="sd-fsel"><option>All Months</option><option>Jan 2026</option><option>Dec 2025</option></select>
        <button className="btn btn-s btn-sm">GST Summary</button>
      </div>

      <div className="dc">
        <table className="sd-tbl">
          <thead>
            <tr><th><input type="checkbox"/></th><th>Invoice #</th><th>Date</th><th>Customer</th><th>SO Ref</th><th>Taxable</th><th>GST</th><th>Total</th><th>Due Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(inv => (
              <tr key={inv.id}>
                <td><input type="checkbox"/></td>
                <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{inv.id}</strong></td>
                <td>{inv.date}</td><td>{inv.customer}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'#6C757D'}}>{inv.soRef}</td>
                <td>{inv.taxable}</td><td>{inv.gst}</td><td><strong>{inv.total}</strong></td>
                <td style={{color: inv.status==='overdue'?'#B03A37':'inherit'}}>{inv.due}</td>
                <td><Badge status={inv.status}>{inv.status.toUpperCase()}</Badge></td>
                <td style={{display:'flex',gap:'4px'}}>
                  <button className="act-btn-view" onClick={()=>navigate(`/sd/invoices/${inv.id}`)}>👁 View</button>
                  {inv.status==='paid'    && <button className="act-btn-print" onClick={e=>{e.stopPropagation();navigate('/print/invoice')}}>🖨 Print</button>}
                  {inv.status==='pending' && <button className="act-btn-green">Payment</button>}
                  {inv.status==='overdue' && <button className="act-btn-orange">📱 WhatsApp</button>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={5}>Total</td><td>₹16,52,407</td><td>₹2,96,533</td><td>₹19,48,940</td><td colSpan={3}></td></tr>
          </tfoot>
        </table>
        <div className="sd-pgn">
          <span>Showing 1–{filtered.length} of {invoices.length}</span>
          <div className="sd-pbs">
            <div className="sd-pb">‹</div>
            <div className="sd-pb" style={{background:'#714B67',color:'#fff',borderColor:'#714B67'}}>1</div>
            <div className="sd-pb">2</div><div className="sd-pb">›</div>
          </div>
        </div>
      </div>
    </div>
  )
}
