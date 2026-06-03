// ═══════════════════════════════════════════════════════════════════
// LNV ERP — SD / InvoiceView.jsx  (VF03)
// Full approval workflow: DRAFT → Submit → L1/L2 Approve → Post
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })

const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{ minimumFractionDigits:2, maximumFractionDigits:2 })
const fmtD = s => s ? new Date(s).toLocaleDateString('en-IN',{ day:'2-digit', month:'short', year:'numeric' }) : '—'
const fmtDT= s => s ? new Date(s).toLocaleString('en-IN',{ day:'2-digit', month:'short', year:'numeric',
  hour:'2-digit', minute:'2-digit' }) : '—'

const ST = {
  DRAFT:            { bg:'#E2E3E5', c:'#383D41', label:'Draft'             },
  PENDING_APPROVAL: { bg:'#FFF3CD', c:'#856404', label:'Pending Approval'  },
  APPROVED:         { bg:'#D4EDDA', c:'#155724', label:'Approved ✓'        },
  REJECTED:         { bg:'#F8D7DA', c:'#721C24', label:'Rejected ✗'        },
  POSTED:           { bg:'#D1ECF1', c:'#0C5460', label:'Posted'            },
  PARTIAL:          { bg:'#EDE0EA', c:'#714B67', label:'Partial'           },
  OVERDUE:          { bg:'#F8D7DA', c:'#721C24', label:'Overdue'           },
  PAID:             { bg:'#D4EDDA', c:'#155724', label:'Paid ✓'            },
  CANCELLED:        { bg:'#E2E3E5', c:'#6C757D', label:'Cancelled'         },
}

const APPROVAL_LEVELS = [
  { level:1, role:'Sales Manager',     label:'L1 — Sales Mgr Review'    },
  { level:2, role:'Managing Director', label:'L2 — MD Final Approval'   },
]

const sec  = { background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, marginBottom:14, overflow:'hidden' }
const secH = { background:'linear-gradient(135deg,#714B67,#8B5E7E)', color:'#fff',
  padding:'9px 16px', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:8 }
const secB = { padding:'16px' }

const Row = ({ label, value, mono, bold, color }) => (
  <div style={{ display:'flex', justifyContent:'space-between',
    padding:'5px 0', borderBottom:'1px solid #F5F0F5' }}>
    <span style={{ fontSize:11, color:'#6C757D' }}>{label}</span>
    <span style={{ fontSize:12, fontWeight:bold?700:500,
      fontFamily:mono?'DM Mono,monospace':'inherit', color:color||'#2D3748' }}>{value}</span>
  </div>
)

export default function InvoiceView() {
  const nav      = useNavigate()
  const { id }   = useParams()
  const [inv,    setInv]    = useState(null)
  const [loading,setLoading]= useState(true)
  const [acting, setActing] = useState(false)
  const [rejectForm, setRejectForm] = useState({ show:false, level:1, reason:'' })
  const [approveForm,setApproveForm]= useState({ show:false, level:1, remark:'' })

  const load = () => {
    setLoading(true)
    fetch(`${BASE}/sd/invoices/${id}`, { headers:{ Authorization:`Bearer ${tok()}` } })
      .then(r=>r.json())
      .then(d => { if (d.data) setInv(d.data); else toast.error('Invoice not found') })
      .catch(()=>toast.error('Failed to load'))
      .finally(()=>setLoading(false))
  }

  useEffect(()=>{ if(id) load() }, [id])

  const act = async (fn, successMsg) => {
    setActing(true)
    try {
      const res = await fn()
      if (res.error) throw new Error(res.error)
      toast.success(res.message || successMsg)
      load()
    } catch(e) { toast.error(e.message) }
    finally { setActing(false) }
  }

  const submitForApproval = () => act(
    () => sdApi.submitForApproval(id, {}),
    'Submitted for approval'
  )

  const doApprove = () => act(
    () => sdApi.approveInvoice(id, { level:approveForm.level, approvedBy:'Admin', remark:approveForm.remark }),
    'Invoice approved'
  ).then(()=>setApproveForm({ show:false, level:1, remark:'' }))

  const doReject = () => {
    if (!rejectForm.reason.trim()) return toast.error('Enter rejection reason')
    act(
      () => sdApi.rejectInvoice(id, { level:rejectForm.level, rejectedBy:'Admin', reason:rejectForm.reason }),
      'Invoice rejected'
    ).then(()=>setRejectForm({ show:false, level:1, reason:'' }))
  }

  const postInvoice = () => act(() => sdApi.postInvoice(id), 'Invoice posted!')
  const recallInvoice = () => act(() => sdApi.recallInvoice(id), 'Recalled to Draft')
  const cancelInvoice = async () => {
    if (!window.confirm('Cancel this invoice?')) return
    act(async () => {
      const r = await fetch(`${BASE}/sd/invoices/${id}/cancel`, { method:'POST', headers:hdr() })
      return r.json()
    }, 'Invoice cancelled')
  }

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>Loading...</div>
  if (!inv)    return <div style={{ padding:60, textAlign:'center', color:'#DC3545' }}>
    Invoice not found. <button className="btn btn-s" onClick={()=>nav('/sd/invoices')}>← Back</button>
  </div>

  const lines   = (() => {
    if (Array.isArray(inv.lines) && inv.lines.length) return inv.lines
    try { return JSON.parse(inv.lines||'[]') } catch { return [] }
  })()
  const approvalLog = (() => {
    if (Array.isArray(inv.approvalLog)) return inv.approvalLog
    try { return JSON.parse(inv.approvalLog||'[]') } catch { return [] }
  })()

  const st      = ST[inv.status] || ST.DRAFT
  const cgst    = parseFloat(inv.cgst||0)
  const sgst    = parseFloat(inv.sgst||0)
  const igst    = parseFloat(inv.igst||0)
  const taxable = parseFloat(inv.taxableAmt||0)
  const grand   = parseFloat(inv.grandTotal||0)
  const paid    = parseFloat(inv.paidAmt||0)
  const balance = grand - paid
  const isIGST  = igst > 0
  const curLevel= inv.approvalLevel || 0
  const isOverdue = inv.dueDate && new Date(inv.dueDate)<new Date() && !['PAID','CANCELLED'].includes(inv.status)

  // ── Approval Timeline ────────────────────────────────────────
  const ApprovalTimeline = () => (
    <div style={sec}>
      <div style={secH}>
        🔐 Approval Workflow — Invoice {inv.invoiceNo}
        <span style={{ marginLeft:'auto', background:'rgba(255,255,255,0.2)',
          padding:'2px 10px', borderRadius:10, fontSize:10 }}>
          {inv.status === 'PENDING_APPROVAL' ? `Level ${curLevel} Pending` :
           inv.status === 'APPROVED'         ? 'Fully Approved ✓' :
           inv.status === 'REJECTED'         ? 'Rejected ✗' :
           inv.status === 'DRAFT'            ? 'Not Submitted' : inv.status}
        </span>
      </div>
      <div style={secB}>

        {/* Submit button — only for DRAFT */}
        {inv.status === 'DRAFT' && (
          <div style={{ background:'#FFF3CD', border:'1px solid #FFEAA7',
            borderRadius:6, padding:'12px 16px', marginBottom:14,
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'#856404' }}>
                📋 Ready to submit for approval?
              </div>
              <div style={{ fontSize:11, color:'#856404', marginTop:3 }}>
                Invoice will go to Sales Manager (L1) → MD (L2) before posting
              </div>
            </div>
            <button disabled={acting} onClick={submitForApproval}
              style={{ padding:'9px 20px', background:'#714B67', color:'#fff',
                border:'none', borderRadius:6, fontWeight:700, fontSize:13,
                cursor:'pointer', opacity:acting?0.6:1 }}>
              📤 Submit for Approval
            </button>
          </div>
        )}

        {/* Rejected — recall or resubmit */}
        {inv.status === 'REJECTED' && (
          <div style={{ background:'#F8D7DA', border:'1px solid #F5C6CB',
            borderRadius:6, padding:'12px 16px', marginBottom:14,
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'#721C24' }}>
                ✗ Rejected by {inv.rejectedBy} — {inv.approvalRemark}
              </div>
              <div style={{ fontSize:11, color:'#721C24', marginTop:3 }}>
                Edit the invoice and resubmit, or recall to Draft.
              </div>
            </div>
            <button disabled={acting} onClick={recallInvoice}
              style={{ padding:'8px 18px', background:'#721C24', color:'#fff',
                border:'none', borderRadius:6, fontWeight:700, fontSize:12,
                cursor:'pointer' }}>
              ↩ Recall to Draft
            </button>
          </div>
        )}

        {/* Approved — ready to post */}
        {inv.status === 'APPROVED' && (
          <div style={{ background:'#D4EDDA', border:'1px solid #C3E6CB',
            borderRadius:6, padding:'12px 16px', marginBottom:14,
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'#155724' }}>
                ✓ Fully Approved by {inv.approvedBy}
              </div>
              <div style={{ fontSize:11, color:'#155724', marginTop:3 }}>
                Invoice is approved — post it to deduct FG stock and create JV entry.
              </div>
            </div>
            <button disabled={acting} onClick={postInvoice}
              style={{ padding:'9px 20px', background:'#155724', color:'#fff',
                border:'none', borderRadius:6, fontWeight:700, fontSize:13,
                cursor:'pointer' }}>
              📤 Post Invoice
            </button>
          </div>
        )}

        {/* Approval level timeline */}
        <div style={{ position:'relative', paddingLeft:8 }}>
          {/* Vertical line */}
          <div style={{ position:'absolute', left:20, top:16, bottom:16,
            width:2, background:'#E8E0E8', zIndex:0 }} />

          {APPROVAL_LEVELS.map(lv => {
            const log = approvalLog.find(l=>l.level===lv.level)
            const isPending = inv.status==='PENDING_APPROVAL' && curLevel===lv.level
            const isDone    = log?.action==='Approved'
            const isRejected= log?.action==='Rejected'
            const dotColor  = isDone ? '#28A745' : isRejected ? '#DC3545' : isPending ? '#714B67' : '#CCC'

            return (
              <div key={lv.level} style={{ display:'flex', gap:14, marginBottom:12,
                position:'relative', zIndex:1 }}>
                {/* Dot */}
                <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0,
                  background:dotColor, color:'#fff', display:'flex',
                  alignItems:'center', justifyContent:'center', fontWeight:800,
                  fontSize:13, boxShadow: isPending?`0 0 0 4px ${dotColor}30`:'none' }}>
                  {isDone?'✓':isRejected?'✗':lv.level}
                </div>

                {/* Card */}
                <div style={{ flex:1, border:`1px solid ${dotColor}40`,
                  borderRadius:6, padding:'10px 14px',
                  background: isDone?'#F0FFF4':isRejected?'#FFF5F5':isPending?'#FFFBF0':'#FAFAFA' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:12, color:dotColor }}>{lv.label}</div>
                      <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>{lv.role}</div>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px',
                      borderRadius:8, background:dotColor+'20', color:dotColor }}>
                      {isDone?'Approved':isRejected?'Rejected':isPending?'⏳ Awaiting':'Pending'}
                    </span>
                  </div>

                  {/* Log entry */}
                  {log && (
                    <div style={{ marginTop:6, fontSize:11, color:'#495057',
                      background:dotColor+'10', padding:'5px 8px', borderRadius:4 }}>
                      {log.action} by <strong>{log.by}</strong> on {fmtDT(log.at)}
                      {log.remark && <div style={{ color:'#6C757D', marginTop:2 }}>
                        "{log.remark}"
                      </div>}
                    </div>
                  )}

                  {!log && isPending && (
                    <div style={{ marginTop:6, fontSize:11, color:'#856404' }}>
                      ⏳ Awaiting review from {lv.role}
                    </div>
                  )}

                  {/* Action buttons for pending level */}
                  {isPending && !approveForm.show && !rejectForm.show && (
                    <div style={{ display:'flex', gap:8, marginTop:10 }}>
                      <button onClick={()=>setApproveForm({ show:true, level:lv.level, remark:'' })}
                        style={{ padding:'6px 18px', background:'#28A745', color:'#fff',
                          border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>
                        ✓ Approve
                      </button>
                      <button onClick={()=>setRejectForm({ show:true, level:lv.level, reason:'' })}
                        style={{ padding:'6px 16px', background:'#DC3545', color:'#fff',
                          border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>
                        ✗ Reject
                      </button>
                      <button disabled={acting} onClick={recallInvoice}
                        style={{ padding:'6px 14px', background:'#fff', border:'1px solid #CCC',
                          borderRadius:6, fontSize:12, cursor:'pointer', color:'#6C757D' }}>
                        ↩ Recall
                      </button>
                    </div>
                  )}

                  {/* Approve form */}
                  {isPending && approveForm.show && approveForm.level===lv.level && (
                    <div style={{ marginTop:10, background:'#F0FFF4',
                      border:'1px solid #C3E6CB', borderRadius:6, padding:'10px 12px' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#155724', marginBottom:6 }}>
                        Confirm Approval — Level {lv.level}
                      </div>
                      <input placeholder="Approval remark (optional)"
                        value={approveForm.remark}
                        onChange={e=>setApproveForm(p=>({...p,remark:e.target.value}))}
                        style={{ width:'100%', padding:'7px 10px', border:'1px solid #C3E6CB',
                          borderRadius:5, fontSize:12, outline:'none', marginBottom:8,
                          boxSizing:'border-box' }} />
                      <div style={{ display:'flex', gap:8 }}>
                        <button disabled={acting} onClick={doApprove}
                          style={{ padding:'7px 20px', background:'#28A745', color:'#fff',
                            border:'none', borderRadius:6, fontWeight:700, fontSize:12,
                            cursor:'pointer' }}>
                          ✓ Confirm Approve
                        </button>
                        <button onClick={()=>setApproveForm({show:false,level:1,remark:''})}
                          style={{ padding:'7px 14px', background:'#fff', border:'1px solid #CCC',
                            borderRadius:6, fontSize:12, cursor:'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reject form */}
                  {isPending && rejectForm.show && rejectForm.level===lv.level && (
                    <div style={{ marginTop:10, background:'#FFF5F5',
                      border:'1px solid #F5C6CB', borderRadius:6, padding:'10px 12px' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#721C24', marginBottom:6 }}>
                        Rejection Reason *
                      </div>
                      <textarea placeholder="Enter reason for rejection (required)"
                        value={rejectForm.reason}
                        onChange={e=>setRejectForm(p=>({...p,reason:e.target.value}))}
                        rows={2}
                        style={{ width:'100%', padding:'7px 10px', border:'1px solid #F5C6CB',
                          borderRadius:5, fontSize:12, outline:'none', resize:'vertical',
                          marginBottom:8, boxSizing:'border-box' }} />
                      <div style={{ display:'flex', gap:8 }}>
                        <button disabled={acting} onClick={doReject}
                          style={{ padding:'7px 18px', background:'#DC3545', color:'#fff',
                            border:'none', borderRadius:6, fontWeight:700, fontSize:12,
                            cursor:'pointer' }}>
                          ✗ Confirm Reject
                        </button>
                        <button onClick={()=>setRejectForm({show:false,level:1,reason:''})}
                          style={{ padding:'7px 14px', background:'#fff', border:'1px solid #CCC',
                            borderRadius:6, fontSize:12, cursor:'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth:1300, margin:'0 auto' }}>

      {/* ── Page Header ── */}
      <div className="lv-hdr" style={{ marginBottom:12 }}>
        <div className="lv-ttl" style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span>Invoice</span>
          <span style={{ fontFamily:'DM Mono,monospace', fontSize:13, color:'#714B67',
            background:'#F3EEF3', padding:'2px 10px', borderRadius:4 }}>{inv.invoiceNo}</span>
          <span style={{ background:st.bg, color:st.c, padding:'3px 10px',
            borderRadius:10, fontSize:11, fontWeight:700 }}>{st.label}</span>
          {isOverdue && <span style={{ background:'#F8D7DA', color:'#721C24',
            padding:'3px 8px', borderRadius:4, fontSize:11, fontWeight:700 }}>⚠ OVERDUE</span>}
        </div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/sd/invoices')}>← Back</button>
          {inv.status==='DRAFT' && (
            <button className="btn btn-s sd-bsm" onClick={()=>nav(`/sd/invoices/new?editId=${id}`)}>
              ✏️ Edit
            </button>
          )}
          {inv.status==='APPROVED' && (
            <button className="btn btn-p sd-bsm" disabled={acting} onClick={postInvoice}>
              📤 Post Invoice
            </button>
          )}
          {['POSTED','PARTIAL','OVERDUE'].includes(inv.status) && (
            <button className="btn btn-p sd-bsm" onClick={()=>nav(`/sd/payments/new?invId=${id}`)}>
              💰 Record Payment
            </button>
          )}
          {['DRAFT','APPROVED'].includes(inv.status) && (
            <button className="btn btn-s sd-bsm" disabled={acting}
              style={{ color:'#DC3545', borderColor:'#DC3545' }} onClick={cancelInvoice}>
              ✕ Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Top Info Grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div style={sec}>
          <div style={secH}>📄 Invoice Details</div>
          <div style={secB}>
            <Row label="Invoice No."  value={inv.invoiceNo}  mono bold color="#714B67" />
            <Row label="Date"         value={fmtD(inv.date||inv.createdAt)} />
            <Row label="Due Date"     value={fmtD(inv.dueDate)} color={isOverdue?'#DC3545':'inherit'} bold={isOverdue} />
            <Row label="Supply Type"  value={inv.supplyType==='interstate'?'Interstate (IGST)':'Intrastate (CGST+SGST)'} />
            {inv.soRef  && <Row label="SO Ref"       value={inv.soRef}       mono />}
            {inv.dcRef  && <Row label="DC Ref"       value={inv.dcRef}       mono />}
            {inv.poReference && <Row label="Cust PO" value={inv.poReference} mono />}
            <Row label="Submitted By" value={inv.submittedBy||'—'} />
            {inv.approvedBy && <Row label="Approved By" value={inv.approvedBy} color="#155724" bold />}
            {inv.rejectedBy && <Row label="Rejected By" value={inv.rejectedBy} color="#DC3545" bold />}
          </div>
        </div>
        <div style={sec}>
          <div style={secH}>👤 Customer</div>
          <div style={secB}>
            <Row label="Customer"  value={inv.customerName||'—'} bold />
            <Row label="GSTIN"     value={inv.customerGstin||'—'} mono />
            <Row label="State"     value={inv.customerState||'—'} />
            {inv.billToAddress && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:10, color:'#6C757D', fontWeight:700,
                  textTransform:'uppercase', marginBottom:4 }}>Bill To</div>
                <div style={{ fontSize:11, color:'#495057', lineHeight:'1.5',
                  background:'#F8F9FA', padding:'6px 8px', borderRadius:4 }}>
                  {inv.billToAddress}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── APPROVAL WORKFLOW PANEL ── */}
      <ApprovalTimeline />

      {/* ── Payment Banner ── */}
      {['POSTED','PARTIAL','OVERDUE','PAID'].includes(inv.status) && (
        <div style={{ background:balance>0?'#FFF3CD':'#D4EDDA',
          border:`1px solid ${balance>0?'#FFEAA7':'#C3E6CB'}`,
          borderRadius:8, padding:'12px 20px', marginBottom:14,
          display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16 }}>
          {[['Grand Total',fmtC(grand),'#2D3748'],['Paid',fmtC(paid),'#155724'],
            ['Balance Due',fmtC(balance),balance>0?'#856404':'#155724'],['Status',st.label,st.c]
          ].map(([l,v,c])=>(
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#6C757D', fontWeight:700,
                textTransform:'uppercase', marginBottom:3 }}>{l}</div>
              <div style={{ fontSize:16, fontWeight:800,
                fontFamily:'DM Mono,monospace', color:c }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lines ── */}
      <div style={sec}>
        <div style={secH}>📦 Invoice Line Items ({lines.length})</div>
        {lines.length===0
          ? <div style={{ padding:24, textAlign:'center', color:'#6C757D' }}>No line items stored.</div>
          : <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:900 }}>
                <thead>
                  <tr style={{ background:'#714B67', color:'#fff' }}>
                    {['#','Item','HSN','Qty','Unit','Rate','Disc%','Taxable',
                      isIGST?'IGST%':'GST%', isIGST?'IGST':'CGST+SGST','Total'].map((h,i)=>(
                      <th key={i} style={{ padding:'8px 10px', textAlign:i>=7?'right':'left',
                        fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l,i)=>{
                    const qty=parseFloat(l.qty||0), rate=parseFloat(l.rate||l.unitPrice||0)
                    const disc=parseFloat(l.discPct||0)
                    const gstPct=parseFloat(l.gstPct||l.gstRate||18)
                    const tax=parseFloat(l.taxable||l.taxableAmt||(qty*rate*(1-disc/100)))
                    const lcgst=parseFloat(l.cgst||0), lsgst=parseFloat(l.sgst||0), ligst=parseFloat(l.igst||0)
                    const ltotal=parseFloat(l.total||l.totalAmt||(tax+lcgst+lsgst+ligst))
                    return (
                      <tr key={i} style={{ background:i%2===0?'#fff':'#FAFAFA', borderBottom:'1px solid #F0F0F0' }}>
                        <td style={{ padding:'7px 10px', color:'#999', fontWeight:700 }}>{i+1}</td>
                        <td style={{ padding:'7px 10px' }}>
                          <div style={{ fontWeight:600 }}>{l.itemName||l.description||'—'}</div>
                          {l.itemCode && <div style={{ fontSize:10, color:'#6C757D', fontFamily:'DM Mono,monospace' }}>{l.itemCode}</div>}
                        </td>
                        <td style={{ padding:'7px 10px', fontFamily:'DM Mono,monospace', fontSize:11, color:'#6C757D' }}>{l.hsnCode||'—'}</td>
                        <td style={{ padding:'7px 10px', textAlign:'right', fontFamily:'DM Mono,monospace' }}>{qty.toLocaleString('en-IN',{maximumFractionDigits:3})}</td>
                        <td style={{ padding:'7px 10px', color:'#6C757D' }}>{l.unit||'Nos'}</td>
                        <td style={{ padding:'7px 10px', textAlign:'right', fontFamily:'DM Mono,monospace' }}>{fmtC(rate)}</td>
                        <td style={{ padding:'7px 10px', textAlign:'right', color:'#6C757D' }}>{disc>0?`${disc}%`:'—'}</td>
                        <td style={{ padding:'7px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', background:'#F8F5F8', fontWeight:600 }}>{fmtC(tax)}</td>
                        <td style={{ padding:'7px 10px', textAlign:'right', color:'#856404' }}>{gstPct}%</td>
                        <td style={{ padding:'7px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', color:'#856404' }}>
                          {isIGST?fmtC(ligst):`${fmtC(lcgst)} + ${fmtC(lsgst)}`}
                        </td>
                        <td style={{ padding:'7px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700, color:'#2D3748' }}>{fmtC(ltotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background:'#F3EEF3', fontWeight:700 }}>
                    <td colSpan={7} style={{ padding:'9px 12px', color:'#714B67' }}>Totals</td>
                    <td style={{ padding:'9px 10px', textAlign:'right', fontFamily:'DM Mono,monospace' }}>{fmtC(taxable)}</td>
                    <td />
                    <td style={{ padding:'9px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', color:'#856404' }}>
                      {isIGST?fmtC(igst):`${fmtC(cgst)} + ${fmtC(sgst)}`}
                    </td>
                    <td style={{ padding:'9px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontSize:14, color:'#714B67' }}>{fmtC(grand)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
        }
      </div>

      {/* ── GST + Notes ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div style={sec}>
          <div style={secH}>🧾 GST Summary</div>
          <div style={secB}>
            <Row label="Taxable Amount" value={fmtC(taxable)} mono bold />
            {isIGST ? <Row label="IGST" value={fmtC(igst)} mono color="#856404" />
              : <><Row label="CGST" value={fmtC(cgst)} mono color="#856404" />
                  <Row label="SGST" value={fmtC(sgst)} mono color="#856404" /></>}
            <div style={{ borderTop:'2px solid #714B67', marginTop:8, paddingTop:8 }}>
              <Row label="Grand Total" value={fmtC(grand)} mono bold color="#714B67" />
            </div>
            {paid>0 && <Row label="Paid" value={fmtC(paid)} mono color="#155724" />}
            {balance>0 && <Row label="Balance Due" value={fmtC(balance)} mono bold color="#DC3545" />}
          </div>
        </div>
        <div style={sec}>
          <div style={secH}>📝 Notes</div>
          <div style={secB}>
            {inv.notes
              ? <div style={{ fontSize:11, color:'#495057', lineHeight:'1.6', whiteSpace:'pre-wrap' }}>{inv.notes}</div>
              : <div style={{ color:'#CCC', fontSize:12 }}>No notes.</div>}
            <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid #F0F0F0' }}>
              <Row label="Created At"   value={fmtDT(inv.createdAt)} />
              {inv.submittedAt && <Row label="Submitted At" value={fmtDT(inv.submittedAt)} />}
              {inv.approvedAt  && <Row label="Approved At"  value={fmtDT(inv.approvedAt)}  />}
              {inv.paidDate    && <Row label="Paid On"      value={fmtD(inv.paidDate)}      />}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8,
        padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:12, color:'#6C757D' }}>
          <strong style={{ color:'#714B67', fontFamily:'DM Mono,monospace' }}>{inv.invoiceNo}</strong>
          {' · '}{inv.customerName}
          {' · Grand Total: '}<strong style={{ color:'#714B67', fontFamily:'DM Mono,monospace', fontSize:15 }}>{fmtC(grand)}</strong>
          {balance>0 && <span style={{ color:'#DC3545', marginLeft:12 }}>
            Balance: <strong style={{ fontFamily:'DM Mono,monospace' }}>{fmtC(balance)}</strong>
          </span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/sd/invoices')}>← List</button>
          {inv.status==='DRAFT' && (
            <button className="btn btn-p sd-bsm" disabled={acting} onClick={submitForApproval}>
              📤 Submit for Approval
            </button>
          )}
          {inv.status==='APPROVED' && (
            <button className="btn btn-p sd-bsm" disabled={acting} onClick={postInvoice}>
              📤 Post Invoice
            </button>
          )}
          {['POSTED','PARTIAL','OVERDUE'].includes(inv.status) && (
            <button className="btn btn-p sd-bsm" onClick={()=>nav(`/sd/payments/new?invId=${id}`)}>
              💰 Record Payment
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
