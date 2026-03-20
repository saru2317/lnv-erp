/**
 * ApprovalFlow — reusable approval widget
 * Used inside PR, PO, SO, PV pages
 * 
 * Props:
 *   docType: 'PR' | 'PO' | 'SO' | 'PV'
 *   docNo: string
 *   amount: number
 *   currentUser: string (role)
 *   onApprove: fn
 *   onReject: fn
 */
import React, { useState } from 'react'
import toast from 'react-hot-toast'

const APPROVAL_WORKFLOWS = {
  PR: {
    label: 'Purchase Indent',
    escalationDays: 2,
    levels: [
      { level:1, role:'HOD / Dept Head',   users:['manager','operations'], label:'HOD Review'    },
      { level:2, role:'Purchase Manager',  users:['accounts','manager'],   label:'Purchase Mgr'  },
      { level:3, role:'General Manager',   users:['admin'],                label:'GM Approval'   },
    ]
  },
  PO: {
    label: 'Purchase Order',
    escalationDays: 2,
    levels: [
      { level:1, role:'Purchase Manager',  users:['accounts','manager'],   label:'Purchase Mgr'  },
      { level:2, role:'General Manager',   users:['admin','manager'],      label:'GM Approval'   },
      { level:3, role:'Managing Director', users:['admin'],                label:'MD Approval'   },
    ]
  },
  SO: {
    label: 'Sales Order',
    escalationDays: 2,
    levels: [
      { level:1, role:'Sales Manager',     users:['sales','manager'],      label:'Sales Mgr'     },
      { level:2, role:'General Manager',   users:['admin','manager'],      label:'GM Approval'   },
    ]
  },
  PV: {
    label: 'Payment Voucher',
    escalationDays: 2,
    levels: [
      { level:1, role:'Accounts Head',     users:['accounts'],             label:'Accounts Head' },
      { level:2, role:'General Manager',   users:['admin','manager'],      label:'GM Approval'   },
      { level:3, role:'Managing Director', users:['admin'],                label:'MD Approval'   },
    ]
  },
}

const STATUS_COLORS = {
  'Pending':  { bg:'#FFF3CD', c:'#856404', dot:'#F5C518'  },
  'Approved': { bg:'#D4EDDA', c:'#155724', dot:'#28A745'  },
  'Rejected': { bg:'#F8D7DA', c:'#721C24', dot:'#DC3545'  },
  'Escalated':{ bg:'#EBF2F8', c:'#1A5276', dot:'#1A5276'  },
  'Skipped':  { bg:'#F5F5F5', c:'#888',    dot:'#ccc'     },
}

export default function ApprovalFlow({
  docType = 'PR',
  docNo   = 'DOC-001',
  amount  = 0,
  status  = 'Draft', // Draft | Pending | Approved | Rejected
  currentLevel = 0,  // 0 = not submitted, 1,2,3 = current approval level
  approvals  = [],   // [{level, approver, action, date, remark}]
  currentUser = 'admin',
  onSubmit,
  onApprove,
  onReject,
  readOnly = false,
}) {
  const wf = APPROVAL_WORKFLOWS[docType] || APPROVAL_WORKFLOWS.PR
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)

  // Determine each level's status
  const getLevelStatus = (level) => {
    const apr = approvals.find(a => a.level === level)
    if (apr) return apr.action // 'Approved' | 'Rejected' | 'Escalated'
    if (status === 'Draft' || currentLevel === 0) return 'Pending'
    if (level < currentLevel) return 'Approved' // passed
    if (level === currentLevel) return 'Pending'
    return 'Skipped'
  }

  const canActOnLevel = (level) =>
    !readOnly &&
    status === 'Pending' &&
    level === currentLevel &&
    wf.levels.find(l => l.level === level)?.users.includes(currentUser)

  const handleApprove = (level) => {
    if (onApprove) onApprove(level)
    else toast.success(`Level ${level} approved by ${currentUser}!`)
  }

  const handleReject = (level) => {
    if (!rejectReason.trim()) return toast.error('Please enter rejection reason')
    if (onReject) onReject(level, rejectReason)
    else toast.error(`Level ${level} rejected: ${rejectReason}`)
    setShowReject(false)
    setRejectReason('')
  }

  return (
    <div style={{background:'#fff', border:'1px solid var(--odoo-border)',
      borderRadius:8, overflow:'hidden', marginBottom:12}}>

      {/* Header */}
      <div style={{padding:'10px 14px', background:'var(--odoo-purple)',
        display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <span style={{color:'rgba(255,255,255,.7)', fontSize:11}}>Approval Status</span>
          <span style={{fontFamily:'DM Mono,monospace', fontSize:12,
            fontWeight:700, color:'#F5C518'}}>{docNo}</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{fontSize:11, color:'rgba(255,255,255,.7)'}}>
            ⏰ Auto-escalate: {wf.escalationDays} days
          </span>
          {status !== 'Draft' && (
            <span style={{padding:'3px 10px', borderRadius:10, fontSize:11, fontWeight:700,
              background: status==='Approved'?'#28A745':status==='Rejected'?'#DC3545':'#F5C518',
              color:'#fff'}}>
              {status}
            </span>
          )}
        </div>
      </div>

      {/* Draft state — show submit button */}
      {status === 'Draft' && !readOnly && (
        <div style={{padding:'14px 16px', background:'#F8F9FA',
          borderBottom:'1px solid var(--odoo-border)'}}>
          {!showSubmit ? (
            <button onClick={() => setShowSubmit(true)}
              style={{padding:'8px 20px', background:'var(--odoo-purple)', color:'#fff',
                border:'none', borderRadius:6, fontWeight:700, fontSize:13,
                cursor:'pointer', display:'flex', alignItems:'center', gap:6}}>
              Submit for Approval
            </button>
          ) : (
            <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
              <span style={{fontSize:12, color:'var(--odoo-gray)'}}>
                Submit <strong>{docNo}</strong> (₹{amount.toLocaleString('en-IN')}) for approval?
              </span>
              <button onClick={() => { onSubmit && onSubmit(); setShowSubmit(false) }}
                style={{padding:'6px 16px', background:'var(--odoo-green)', color:'#fff',
                  border:'none', borderRadius:6, fontWeight:700, fontSize:12,
                  cursor:'pointer'}}>
                Yes, Submit
              </button>
              <button onClick={() => setShowSubmit(false)}
                style={{padding:'6px 14px', background:'#fff', color:'var(--odoo-gray)',
                  border:'1px solid var(--odoo-border)', borderRadius:6, fontSize:12,
                  cursor:'pointer'}}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Approval levels timeline */}
      <div style={{padding:'14px 16px'}}>
        <div style={{position:'relative'}}>
          {/* Connector line */}
          <div style={{position:'absolute', left:16, top:20, bottom:20,
            width:2, background:'var(--odoo-border)', zIndex:0}}/>

          {wf.levels.map((lv, li) => {
            const lvStatus = getLevelStatus(lv.level)
            const sc = STATUS_COLORS[lvStatus] || STATUS_COLORS.Pending
            const apr = approvals.find(a => a.level === lv.level)
            const canAct = canActOnLevel(lv.level)

            return (
              <div key={lv.level} style={{display:'flex', gap:14, marginBottom:10,
                position:'relative', zIndex:1}}>
                {/* Status dot */}
                <div style={{width:32, height:32, borderRadius:'50%', flexShrink:0,
                  background: lvStatus==='Approved' ? 'var(--odoo-green)' :
                               lvStatus==='Rejected' ? 'var(--odoo-red)' :
                               lvStatus==='Pending' && lv.level===currentLevel ? 'var(--odoo-purple)' :
                               '#E0E0E0',
                  color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:700,
                  boxShadow: canAct ? '0 0 0 3px rgba(113,75,103,.3)' : 'none',
                  transition:'all .2s'}}>
                  {lvStatus==='Approved' ? '' :
                   lvStatus==='Rejected' ? '' :
                   lv.level}
                </div>

                {/* Level info */}
                <div style={{flex:1, background: sc.bg, borderRadius:6,
                  padding:'8px 12px', border:`1px solid ${sc.dot}40`,
                  minHeight:48}}>
                  <div style={{display:'flex', justifyContent:'space-between',
                    alignItems:'flex-start'}}>
                    <div>
                      <div style={{fontSize:12, fontWeight:700, color:sc.c}}>
                        Level {lv.level} — {lv.role}
                      </div>
                      {apr && (
                        <div style={{fontSize:11, color:'var(--odoo-gray)', marginTop:2}}>
                          {apr.action} by {apr.approver} on {apr.date}
                          {apr.remark && <span> · "{apr.remark}"</span>}
                        </div>
                      )}
                      {!apr && lvStatus === 'Pending' && lv.level === currentLevel && (
                        <div style={{fontSize:11, color:'#856404', marginTop:2}}>
                          ⏳ Awaiting action from {lv.role}
                          {wf.escalationDays > 0 &&
                            <span> · Auto-escalates in {wf.escalationDays} days if no action</span>}
                        </div>
                      )}
                      {!apr && lvStatus === 'Skipped' && (
                        <div style={{fontSize:11, color:'var(--odoo-gray)', marginTop:2}}>
                          Not yet reached
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <span style={{padding:'2px 8px', borderRadius:8, fontSize:10,
                      fontWeight:700, background:sc.bg, color:sc.c,
                      border:`1px solid ${sc.dot}60`, whiteSpace:'nowrap'}}>
                      {lvStatus}
                    </span>
                  </div>

                  {/* Action buttons for current approver */}
                  {canAct && !showReject && (
                    <div style={{display:'flex', gap:8, marginTop:8}}>
                      <button onClick={() => handleApprove(lv.level)}
                        style={{padding:'5px 16px', background:'var(--odoo-green)', color:'#fff',
                          border:'none', borderRadius:6, fontWeight:700, fontSize:12,
                          cursor:'pointer', display:'flex', alignItems:'center', gap:5}}>
                         Approve
                      </button>
                      <button onClick={() => setShowReject(lv.level)}
                        style={{padding:'5px 14px', background:'var(--odoo-red)', color:'#fff',
                          border:'none', borderRadius:6, fontWeight:700, fontSize:12,
                          cursor:'pointer'}}>
                         Reject
                      </button>
                      <button onClick={() => toast.success('Forwarded to next level!')}
                        style={{padding:'5px 14px', background:'#fff', color:'var(--odoo-gray)',
                          border:'1px solid var(--odoo-border)', borderRadius:6, fontSize:12,
                          cursor:'pointer'}}>
                        Forward
                      </button>
                    </div>
                  )}

                  {/* Reject form */}
                  {showReject === lv.level && (
                    <div style={{marginTop:8, display:'flex', gap:8, alignItems:'flex-start',
                      flexWrap:'wrap'}}>
                      <input placeholder="Rejection reason (required)"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        style={{flex:1, minWidth:200, padding:'6px 10px',
                          border:'1px solid var(--odoo-red)', borderRadius:5,
                          fontSize:12, outline:'none'}} />
                      <button onClick={() => handleReject(lv.level)}
                        style={{padding:'6px 14px', background:'var(--odoo-red)', color:'#fff',
                          border:'none', borderRadius:6, fontWeight:700, fontSize:12,
                          cursor:'pointer'}}>
                        Confirm Reject
                      </button>
                      <button onClick={() => { setShowReject(false); setRejectReason('') }}
                        style={{padding:'6px 10px', background:'#fff', border:'1px solid var(--odoo-border)',
                          borderRadius:6, fontSize:12, cursor:'pointer'}}>
                        Cancel
                      </button>
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
}
