import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

const fmtC = n  => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
const fmtD = s  => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

const STATUS = {
  DRAFT:            { bg:'#E2E3E5', c:'#383D41', label:'Draft'              },
  PENDING_APPROVAL: { bg:'#FFF3CD', c:'#856404', label:'⏳ Pending Approval' },
  APPROVED:         { bg:'#D4EDDA', c:'#155724', label:'✓ Approved'         },
  REJECTED:         { bg:'#F8D7DA', c:'#721C24', label:'✗ Rejected'         },
  POSTED:           { bg:'#D1ECF1', c:'#0C5460', label:'Posted'             },
  PENDING:          { bg:'#FFF3CD', c:'#856404', label:'Pending'            },
  PAID:             { bg:'#CCE5FF', c:'#004085', label:'✓ Paid'             },
  PARTIAL:          { bg:'#EDE0EA', c:'#714B67', label:'Partial'            },
  OVERDUE:          { bg:'#F8D7DA', c:'#721C24', label:'⚠ Overdue'         },
  CANCELLED:        { bg:'#E2E3E5', c:'#6C757D', label:'Cancelled'          },
}

export default function InvoiceList() {
  const nav = useNavigate()
  const { user } = useAuth()
  const role = user?.role || ''
  // Only Finance/Accounts/Manager/Admin can Pay and Cancel posted invoices
  const canPay    = ['ACCOUNTS','FINANCE','MANAGER','ADMIN','SUPER_ADMIN'].includes(role)
  const canCancel = ['ACCOUNTS','FINANCE','MANAGER','ADMIN','SUPER_ADMIN'].includes(role)
  const canPost   = ['ACCOUNTS','FINANCE','MANAGER','ADMIN','SUPER_ADMIN'].includes(role)
  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('')

  const deleteInvoice = async (e, inv) => {
    e.stopPropagation()
    if (!window.confirm(`Delete ${inv.invoiceNo}? Cannot be undone.`)) return
    try {
      const r = await fetch(`${BASE}/sd/invoices/${inv.id}`, { method:'DELETE', headers:hdr2() })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success(`${inv.invoiceNo} deleted`)
      load()
    } catch(ex) { toast.error(ex.message) }
  }

  const cancelInvoice = async (e, inv) => {
    e.stopPropagation()
    if (!window.confirm(`Cancel ${inv.invoiceNo}? This will reverse the accounting entries.`)) return
    try {
      const r = await fetch(`${BASE}/sd/invoices/${inv.id}/cancel`, { method:'POST', headers:hdr2() })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success(`${inv.invoiceNo} cancelled`)
      load()
    } catch(ex) { toast.error(ex.message) }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await sdApi.getInvoices(status ? { status } : {})
      // Handle both { data: [...] } and direct array responses
      const data = res?.data || (Array.isArray(res) ? res : [])
      if (res?.error) throw new Error(res.error)
      setInvoices(data)
    } catch(e) {
      toast.error('Failed to load invoices: ' + e.message)
      setInvoices([])
    }
    finally { setLoading(false) }
  }, [status])

  useEffect(() => { load() }, [load])

  const postInvoice = async (e, id) => {
    e.stopPropagation()
    try {
      const res = await sdApi.postInvoice(id)
      if (res.error) throw new Error(res.error)
      toast.success('Invoice posted!')
      load()
    } catch(e) { toast.error(e.message) }
  }

  const submitApproval = async (e, id) => {
    e.stopPropagation()
    try {
      const res = await sdApi.submitForApproval(id, {})
      if (res.error) throw new Error(res.error)
      toast.success(res.message || 'Submitted for approval!')
      load()
    } catch(e) { toast.error(e.message) }
  }

  const filtered = invoices.filter(inv =>
    !search ||
    inv.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.soNo?.toLowerCase().includes(search.toLowerCase())
  )

  const totalTaxable  = filtered.reduce((s,i) => s + parseFloat(i.taxableAmt||0), 0)
  const totalGST      = filtered.reduce((s,i) => s + parseFloat((parseFloat(i.cgst||0)+parseFloat(i.sgst||0)+parseFloat(i.igst||0))), 0)
  const grandTotal    = filtered.reduce((s,i) => s + parseFloat(i.grandTotal||0), 0)
  const pendingAmt    = filtered.filter(i=>['PENDING','POSTED','PARTIAL'].includes(i.status))
                                .reduce((s,i) => s + parseFloat(i.balanceAmt||i.totalAmount||0), 0)

  return (
    <div>
      {/* Header */}
      <div className="lv-hdr">
        <div className="lv-ttl">
          Customer Invoices
          <small>VF05 · {filtered.length} record(s)</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-s sd-bsm">GST Summary</button>
          <button className="btn btn-p"
            onClick={() => nav('/sd/invoices/new')}>
            + New Invoice
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="sd-fb">
        <div className="sd-fs">
          <input placeholder="Search Invoice #, SO #, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="sd-fsel"
          value={status}
          onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {Object.entries(STATUS).map(([k,v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button className="btn btn-s sd-bsm">Export</button>
      </div>

      {/* KPI Strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)',
        gap:8, marginBottom:14 }}>
        {[
          ['Total Invoices',   filtered.length,                       '#714B67','#EDE0EA'],
          ['Posted',           filtered.filter(i=>['POSTED','PAID','PARTIAL'].includes(i.status)).length, '#155724','#D4EDDA'],
          ['Pending Approval', filtered.filter(i=>i.status==='PENDING_APPROVAL').length,                '#856404','#FFF3CD'],
          ['Pending Payment',  filtered.filter(i=>['PENDING','POSTED'].includes(i.status)).length,        '#1A5276','#CCE5FF'],
          ['Overdue',          filtered.filter(i=>i.status==='OVERDUE').length,                            '#721C24','#F8D7DA'],
          ['Outstanding Amt',  null,                                  '#1A1A2E','#F8F9FA'],
        ].map(([l,v,c,bg]) => (
          <div key={l} style={{ background:bg, borderRadius:8,
            padding:'10px 14px', textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800,
              color:c, fontFamily:'Tahoma,monospace' }}>
              {l === 'Outstanding Amt' ? fmtC(pendingAmt) : v}
            </div>
            <div style={{ fontSize:10, fontWeight:700,
              color:c, opacity:.8, textTransform:'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="dc">
        <table className="sd-tbl">
          <thead>
            <tr>
              <th>INV NUMBER</th>
              <th>DATE</th>
              <th>CUSTOMER</th>
              <th>SO REF</th>
              <th>TAXABLE</th>
              <th>GST</th>
              <th>TOTAL</th>
              <th>DUE DATE</th>
              <th>BALANCE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11}
                style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
                Loading...
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={11}
                style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🧾</div>
                No invoices found.
                <button className="btn-xs pri" style={{ marginLeft:8 }}
                  onClick={() => nav('/sd/invoices/new')}>
                  + Create Invoice
                </button>
              </td></tr>
            ) : filtered.map(inv => {
              const st = STATUS[inv.status] || STATUS.PENDING
              const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date()
                && !['PAID','CANCELLED'].includes(inv.status)
              return (
                <tr key={inv.id}
                  style={{ cursor:'pointer',
                    background: isOverdue ? '#FFF5F5' : 'inherit' }}
                  onClick={() => nav(`/sd/invoices/${inv.id}`)}>
                  <td>
                    <strong style={{ color:'#714B67',
                      fontFamily:'Tahoma,monospace', fontSize:11 }}>
                      {inv.invoiceNo}
                    </strong>
                    {isOverdue && (
                      <div style={{ fontSize:9, color:'#DC3545',
                        fontWeight:700 }}>⚠ OVERDUE</div>
                    )}
                  </td>
                  <td style={{ fontSize:12, color:'#6C757D' }}>
                    {fmtD(inv.date || inv.createdAt)}
                  </td>
                  <td>
                    <strong style={{ fontSize:12 }}>
                      {inv.customerName || '—'}
                    </strong>
                    {inv.customerCode || inv.customerId && (
                      <div style={{ fontSize:10, color:'#6C757D',
                        fontFamily:'Tahoma,monospace' }}>
                        {inv.customerCode || inv.customerId}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize:11, color:'#6C757D',
                    fontFamily:'Tahoma,monospace' }}>
                    {inv.soRef || inv.soNo || '—'}
                  </td>
                  <td style={{ fontFamily:'Tahoma,monospace', fontSize:12 }}>
                    {fmtC(inv.taxableAmt)}
                  </td>
                  <td style={{ fontFamily:'Tahoma,monospace',
                    fontSize:12, color:'#856404' }}>
                    {fmtC((parseFloat(inv.cgst||0)+parseFloat(inv.sgst||0)+parseFloat(inv.igst||0)))}
                  </td>
                  <td>
                    <strong style={{ fontFamily:'Tahoma,monospace',
                      color:'#714B67' }}>
                      {fmtC(inv.grandTotal)}
                    </strong>
                  </td>
                  <td style={{ fontSize:11,
                    color: isOverdue ? '#DC3545' : '#6C757D' }}>
                    {fmtD(inv.dueDate)}
                  </td>
                  <td style={{ fontFamily:'Tahoma,monospace',
                    fontSize:12, fontWeight:700,
                    color: parseFloat(inv.balanceAmt||0) > 0 ? '#DC3545' : '#155724' }}>
                    {fmtC((parseFloat(inv.grandTotal||0) - parseFloat(inv.paidAmt||0)))}
                  </td>
                  <td>
                    <span style={{ background:st.bg, color:st.c,
                      padding:'2px 8px', borderRadius:10,
                      fontSize:11, fontWeight:700 }}>
                      {st.label}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}
                    style={{ display:'flex', gap:4 }}>
                    <button className="act-btn-view"
                      onClick={() => nav(`/sd/invoices/${inv.id}`)}>
                      View
                    </button>
                    {['POSTED','PENDING','PARTIAL','OVERDUE'].includes(inv.status) && (
                      <button className="btn-xs"
                        title="Print Invoice"
                        style={{ background:'#E8F4FD', color:'#0D6EFD', border:'1px solid #B8D4F0' }}
                        onClick={e => { e.stopPropagation(); nav(`/sd/invoices/${inv.id}/print`) }}>
                        🖨️
                      </button>
                    )}
                    {['DRAFT','PENDING_APPROVAL'].includes(inv.status) && (
                      <button className="btn-xs"
                        style={{ background:'#EDE0EA', color:'#714B67', border:'1px solid #D0C4D8' }}
                        onClick={e=>{ e.stopPropagation(); nav(`/sd/invoices/${inv.id}/edit`) }}>
                        ✏️
                      </button>
                    )}
                    {['DRAFT','PENDING_APPROVAL'].includes(inv.status) && (
                      <button className="btn-xs"
                        style={{ background:'#F8D7DA', color:'#721C24', border:'none' }}
                        onClick={e => deleteInvoice(e, inv)}>
                        🗑
                      </button>
                    )}
                    {['POSTED','PENDING','PARTIAL','OVERDUE'].includes(inv.status) && canCancel && (
                      <button className="btn-xs"
                        style={{ background:'#FFF3CD', color:'#856404', border:'1px solid #FFEAA7' }}
                        onClick={e => cancelInvoice(e, inv)}>
                        Cancel
                      </button>
                    )}
                    {inv.status === 'DRAFT' && (
                      <button className="act-btn-green"
                        onClick={e => submitApproval(e, inv.id)}>
                        Submit
                      </button>
                    )}
                    {inv.status === 'PENDING_APPROVAL' && (
                      <button style={{ padding:'3px 8px', fontSize:10, fontWeight:700,
                        background:'#FFF3CD', color:'#856404', border:'1px solid #FFEAA7',
                        borderRadius:4, cursor:'pointer' }}
                        onClick={e => { e.stopPropagation(); nav('/admin/approvals') }}>
                        Inbox →
                      </button>
                    )}
                    {inv.status === 'APPROVED' && canPost && (
                      <button className="act-btn-green"
                        onClick={e => postInvoice(e, inv.id)}>
                        Post
                      </button>
                    )}
                    {['POSTED','PENDING','PARTIAL','OVERDUE'].includes(inv.status) && canPay && (
                      <button className="act-btn-green"
                        onClick={() => nav(`/sd/payments/new?invId=${inv.id}`)}>
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ background:'#EDE0EA', fontWeight:700 }}>
                <td colSpan={4} style={{ padding:'10px 12px' }}>
                  Total ({filtered.length} invoices)
                </td>
                <td style={{ padding:'10px 12px',
                  fontFamily:'Tahoma,monospace' }}>
                  {fmtC(totalTaxable)}
                </td>
                <td style={{ padding:'10px 12px',
                  fontFamily:'Tahoma,monospace', color:'#856404' }}>
                  {fmtC(totalGST)}
                </td>
                <td style={{ padding:'10px 12px',
                  fontFamily:'Tahoma,monospace',
                  color:'#714B67', fontSize:14, fontWeight:800 }}>
                  {fmtC(grandTotal)}
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
