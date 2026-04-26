import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListView } from '@hooks/useListView'
import ListViewToggle from '@components/ui/ListViewToggle'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const STATUS = {
  DRAFT:        { bg:'#E2E3E5', color:'#383D41', label:'Draft',        icon:'✏️' },
  SUBMITTED:    { bg:'#FFF3CD', color:'#856404', label:'Pending HOD',  icon:'📤' },
  HOD_APPROVED: { bg:'#D4EDDA', color:'#155724', label:'HOD Approved', icon:'✅' },
  HOD_REJECTED: { bg:'#F8D7DA', color:'#721C24', label:'Rejected',     icon:'❌' },
  CS_CREATED:   { bg:'#EDE0EA', color:'#714B67', label:'CS Created',   icon:'📊' },
  PO_RAISED:    { bg:'#D1ECF1', color:'#0C5460', label:'PO Raised',    icon:'📋' },
  PRECLOSED:    { bg:'#E9ECEF', color:'#6C757D', label:'Pre-closed',   icon:'🔒' },
  CLOSED:       { bg:'#E9ECEF', color:'#6C757D', label:'Closed',       icon:'🔒' },
}
const PRIORITY = {
  Urgent:{ bg:'#F8D7DA', color:'#721C24' },
  Normal:{ bg:'#D4EDDA', color:'#155724' },
  Low:   { bg:'#E9ECEF', color:'#6C757D' },
}

function RejectModal({ pr, onSave, onCancel }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const reject = async () => {
    if (!reason) return toast.error('Reason required!')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/mm/pr/${pr.id}/reject`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({ rejectReason:reason }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('PR Rejected')
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:440,
        overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#DC3545', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontSize:15,
            fontWeight:700 }}>❌ Reject PR</h3>
          <span onClick={onCancel}
            style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20 }}>
          <div style={{ fontSize:13, color:'#495057', marginBottom:12 }}>
            <strong>{pr.prNo}</strong> — {pr.department}<br/>
            <span style={{ fontSize:11, color:'#6C757D' }}>
              By: {pr.requestedByName}
            </span>
          </div>
          <label style={{ fontSize:11, fontWeight:700, color:'#495057',
            display:'block', marginBottom:4 }}>Rejection Reason *</label>
          <textarea value={reason}
            onChange={e=>setReason(e.target.value)}
            rows={3} style={{ padding:'8px 10px', border:'1.5px solid #E0D5E0',
              borderRadius:5, fontSize:12, outline:'none', width:'100%',
              boxSizing:'border-box', resize:'vertical' }}
            placeholder="Reason for rejection..." />
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end', gap:10,
          background:'#F8F7FA' }}>
          <button onClick={onCancel}
            style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
              border:'1.5px solid #E0D5E0', borderRadius:6,
              fontSize:13, cursor:'pointer' }}>Cancel</button>
          <button onClick={reject} disabled={saving}
            style={{ padding:'8px 24px', background:'#DC3545',
              color:'#fff', border:'none', borderRadius:6,
              fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {saving?'⏳':'❌'} Reject
          </button>
        </div>
      </div>
    </div>
  )
}

function PRDetailModal({ pr, onClose, onApprove, onReject }) {
  const nav = useNavigate()
  if (!pr) return null
  const sc = STATUS[pr.status]||STATUS.DRAFT

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:680,
        maxHeight:'90vh', overflow:'hidden', display:'flex',
        flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0,
              fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 }}>
              📋 {pr.prNo}
            </h3>
            <p style={{ color:'rgba(255,255,255,.7)', margin:'2px 0 0',
              fontSize:11 }}>
              {pr.department} · By: {pr.requestedByName} ·
              Priority: {pr.priority}
            </p>
          </div>
          <span onClick={onClose}
            style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:20 }}>
          {/* Status */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <span style={{ padding:'4px 12px', borderRadius:10,
              fontSize:11, fontWeight:700,
              background:sc.bg, color:sc.color }}>
              {sc.icon} {sc.label}
            </span>
            <span style={{ padding:'4px 12px', borderRadius:10,
              fontSize:11, fontWeight:600,
              background: PRIORITY[pr.priority]?.bg||'#E9ECEF',
              color: PRIORITY[pr.priority]?.color||'#6C757D' }}>
              {pr.priority}
            </span>
          </div>

          {/* Items table */}
          <div style={{ fontSize:12, fontWeight:700, color:'#714B67',
            marginBottom:8 }}>Items Requested:</div>
          <table style={{ width:'100%', borderCollapse:'collapse',
            fontSize:12, marginBottom:14 }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['#','Item','Spec','Qty','Unit',
                  'Required By','Est. Rate','Purpose'].map(h=>(
                  <th key={h} style={{ padding:'7px 10px', fontSize:10,
                    fontWeight:700, color:'#6C757D', textAlign:'left',
                    textTransform:'uppercase', letterSpacing:.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(pr.lines||[]).map((l,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #F0EEF0' }}>
                  <td style={{ padding:'7px 10px', color:'#6C757D',
                    textAlign:'center' }}>{i+1}</td>
                  <td style={{ padding:'7px 10px', fontWeight:600 }}>
                    {l.itemName}</td>
                  <td style={{ padding:'7px 10px', color:'#6C757D',
                    fontSize:11 }}>{l.specification||'—'}</td>
                  <td style={{ padding:'7px 10px', fontWeight:700,
                    color:'#714B67', textAlign:'center' }}>
                    {parseFloat(l.qty)}</td>
                  <td style={{ padding:'7px 10px' }}>{l.unit}</td>
                  <td style={{ padding:'7px 10px', fontSize:11,
                    color:'#6C757D' }}>
                    {l.requiredBy
                      ?new Date(l.requiredBy).toLocaleDateString('en-IN')
                      :'—'}</td>
                  <td style={{ padding:'7px 10px',
                    fontFamily:'DM Mono,monospace', fontSize:11 }}>
                    {l.estimatedRate
                      ?`₹${Number(l.estimatedRate).toLocaleString('en-IN')}`
                      :'—'}</td>
                  <td style={{ padding:'7px 10px', fontSize:11,
                    color:'#6C757D' }}>{l.purpose||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Approval trail */}
          {(pr.hodApprovedBy||pr.rejectedBy||pr.remarks) && (
            <div style={{ background:'#F8F7FA', borderRadius:8,
              padding:'12px 14px', fontSize:12 }}>
              <div style={{ fontWeight:700, color:'#714B67',
                marginBottom:6 }}>Approval Trail:</div>
              {pr.hodApprovedBy && (
                <div style={{ color:'#155724' }}>
                  ✅ HOD: <strong>{pr.hodApprovedBy}</strong>
                  {pr.hodRemarks && ` — ${pr.hodRemarks}`}
                </div>
              )}
              {pr.rejectedBy && (
                <div style={{ color:'#DC3545' }}>
                  ❌ Rejected by: <strong>{pr.rejectedBy}</strong>
                  {pr.rejectReason && ` — ${pr.rejectReason}`}
                </div>
              )}
              {pr.remarks && (
                <div style={{ color:'#6C757D', marginTop:4 }}>
                  📝 {pr.remarks}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'space-between',
          alignItems:'center', background:'#F8F7FA' }}>
          <button onClick={onClose}
            style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
              border:'1.5px solid #E0D5E0', borderRadius:6,
              fontSize:13, cursor:'pointer' }}>Close</button>
          <div style={{ display:'flex', gap:8 }}>
            {pr.status==='SUBMITTED' && (
              <>
                <button onClick={()=>{ onReject(pr); onClose() }}
                  style={{ padding:'8px 16px', background:'#fff',
                    color:'#DC3545', border:'1.5px solid #DC3545',
                    borderRadius:6, fontSize:12, cursor:'pointer',
                    fontWeight:600 }}>❌ Reject</button>
                <button onClick={()=>{ onApprove(pr); onClose() }}
                  style={{ padding:'8px 20px', background:'#28A745',
                    color:'#fff', border:'none', borderRadius:6,
                    fontSize:12, cursor:'pointer', fontWeight:700 }}>
                  ✅ HOD Approve
                </button>
              </>
            )}
            {pr.status==='HOD_APPROVED' && (
              <button onClick={()=>{
                nav(`/mm/cs/new?pr=${pr.id}&prNo=${pr.prNo}`)
                onClose()
              }} style={{ padding:'8px 20px', background:'#714B67',
                color:'#fff', border:'none', borderRadius:6,
                fontSize:12, cursor:'pointer', fontWeight:700 }}>
                📊 Create CS →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PRList() {
  const nav = useNavigate()
  const { viewMode, toggleView } = useListView('MM-PRList')
  const [prs,      setPRs]     = useState([])
  const [loading,  setLoading] = useState(true)
  const [filter,   setFilter]  = useState('all')
  const [search,   setSearch]  = useState('')
  const [selPR,    setSelPR]   = useState(null)
  const [loadingPR, setLoadingPR] = useState(false)
  const [rejectPR, setRejectPR]= useState(null)
  const [approving,setApproving]=useState(null)
  const [precloseModal, setPrecloseModal] = useState(null)
  const [precloseReason, setPrecloseReason] = useState('')

  const fetchPRs = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/mm/pr`,
        { headers:authHdrs2() })
      const data = await res.json()
      setPRs(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchPRs() }, [])

  const preclose = async () => {
    if (!precloseReason) return toast.error('Reason required!')
    try {
      const res  = await fetch(`${BASE_URL}/mm/pr/${precloseModal.id}/preclose`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({ reason:precloseReason }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('PR Pre-closed')
      setPrecloseModal(null)
      setPrecloseReason('')
      fetchPRs()
    } catch(e){ toast.error(e.message) }
  }

  const approve = async (pr) => {
    setApproving(pr.id)
    try {
      const res  = await fetch(`${BASE_URL}/mm/pr/${pr.id}/approve`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({ hodRemarks:'Approved' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      fetchPRs()
    } catch(e){ toast.error(e.message) } finally { setApproving(null) }
  }

  // Fetch full PR with lines for detail modal
  const openDetail = async (pr) => {
    setLoadingPR(true)
    try {
      const res  = await fetch(`${BASE_URL}/mm/pr/${pr.id}`,
        { headers:authHdrs2() })
      const data = await res.json()
      setSelPR(data.data||pr)
    } catch { setSelPR(pr) } finally { setLoadingPR(false) }
  }

  const submit = async (pr) => {
    try {
      const res  = await fetch(`${BASE_URL}/mm/pr/${pr.id}/submit`,
        { method:'POST', headers:authHdrs(), body:'{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      fetchPRs()
    } catch(e){ toast.error(e.message) }
  }

  const filtered = prs.filter(p => {
    const matchFilter = filter==='all' || p.status===filter
    const matchSearch = !search ||
      p.prNo?.toLowerCase().includes(search.toLowerCase()) ||
      p.department?.toLowerCase().includes(search.toLowerCase()) ||
      p.requestedByName?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const kpi = {
    draft:    prs.filter(p=>p.status==='DRAFT').length,
    pending:  prs.filter(p=>p.status==='SUBMITTED').length,
    approved: prs.filter(p=>p.status==='HOD_APPROVED').length,
    rejected: prs.filter(p=>p.status==='HOD_REJECTED').length,
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Purchase Indents (PR)
          <small>Material Requisition · ME51N</small>
        </div>
        <div className="fi-lv-actions">
          <ListViewToggle viewMode={viewMode} onToggle={toggleView} />
          <input placeholder="Search PR…" value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{ padding:'6px 12px', border:'1px solid #E0D5E0',
              borderRadius:5, fontSize:12, width:180 }} />
          <button className="btn btn-p sd-bsm"
            onClick={()=>nav('/mm/pr/new')}>+ New Indent</button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          { l:'Draft',       v:kpi.draft,    c:'#6C757D', bg:'#E9ECEF', k:'DRAFT'        },
          { l:'Pending HOD', v:kpi.pending,  c:'#856404', bg:'#FFF3CD', k:'SUBMITTED'    },
          { l:'HOD Approved',v:kpi.approved, c:'#155724', bg:'#D4EDDA', k:'HOD_APPROVED' },
          { l:'Rejected',    v:kpi.rejected, c:'#DC3545', bg:'#F8D7DA', k:'HOD_REJECTED' },
        ].map(k=>(
          <div key={k.l} onClick={()=>setFilter(filter===k.k?'all':k.k)}
            style={{ background:k.bg, borderRadius:8,
              padding:'10px 14px', border:`2px solid ${filter===k.k?k.c:k.c+'22'}`,
              cursor:'pointer', transition:'all .2s' }}>
            <div style={{ fontSize:10, color:k.c, fontWeight:700,
              textTransform:'uppercase' }}>{k.l}</div>
            <div style={{ fontSize:24, fontWeight:800, color:k.c,
              fontFamily:'Syne,sans-serif' }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        {[['all','All'],['DRAFT','Draft'],['SUBMITTED','Pending HOD'],
          ['HOD_APPROVED','Approved'],['CS_CREATED','CS Done'],
          ['PO_RAISED','PO Raised']].map(([k,l])=>{
          const sc = STATUS[k]||{ bg:'#E9ECEF', color:'#6C757D' }
          return (
            <div key={k} onClick={()=>setFilter(k)}
              style={{ padding:'4px 12px', borderRadius:20,
                cursor:'pointer', fontSize:12, fontWeight:600,
                border:`2px solid ${filter===k?sc.color:'#E0D5E0'}`,
                background:filter===k?sc.bg:'#fff',
                color:filter===k?sc.color:'#6C757D' }}>
              {l} ({k==='all'?prs.length:prs.filter(p=>p.status===k).length})
            </div>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          ⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ fontWeight:700 }}>No purchase indents</div>
          <button className="btn btn-p sd-bsm" style={{ marginTop:12 }}
            onClick={()=>nav('/mm/pr/new')}>+ New Indent</button>
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden' }}>
          <div style={{ maxHeight:'calc(100vh - 400px)', overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ position:'sticky', top:0, zIndex:10,
                background:'#F8F4F8',
                boxShadow:'0 2px 4px rgba(0,0,0,.06)' }}>
                <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                  {['#','PR No.','Date','Department','Requested By',
                    'Items','Priority','Created By','Status','Actions'].map(h=>(
                    <th key={h} style={{ padding:'9px 12px', fontSize:10,
                      fontWeight:700, color:'#6C757D', textAlign:'left',
                      textTransform:'uppercase', letterSpacing:.3,
                      whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p,i)=>{
                  const sc = STATUS[p.status]||STATUS.DRAFT
                  const pr = PRIORITY[p.priority]||PRIORITY.Normal
                  return (
                    <tr key={p.id} style={{ borderBottom:'1px solid #F0EEF0',
                      background:i%2===0?'#fff':'#FDFBFD',
                      cursor:'pointer' }}
                      onClick={()=>openDetail(p)}>
                      <td style={{ padding:'9px 12px', textAlign:'center',
                        color:'#6C757D', fontSize:11, fontWeight:600 }}>
                        {i+1}
                      </td>
                      <td style={{ padding:'9px 12px',
                        fontFamily:'DM Mono,monospace',
                        fontWeight:700, color:'#714B67', fontSize:12 }}>
                        {p.prNo}
                      </td>
                      <td style={{ padding:'9px 12px', fontSize:11,
                        color:'#6C757D' }}>
                        {new Date(p.prDate||p.createdAt)
                          .toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding:'9px 12px', fontWeight:600 }}>
                        {p.department}
                      </td>
                      <td style={{ padding:'9px 12px', fontSize:12 }}>
                        {p.requestedByName||p.requestedBy||'—'}
                      </td>
                      <td style={{ padding:'9px 12px', textAlign:'center',
                        fontWeight:700, color:'#714B67' }}>
                        {p.lines?.length||0} item(s)
                      </td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:10,
                          fontSize:10, fontWeight:700,
                          background:pr.bg, color:pr.color }}>
                          {p.priority}
                        </span>
                      </td>
                      <td style={{ padding:'9px 12px', fontSize:11,
                        color:'#6C757D' }}>
                        <div>{p.requestedByName||p.requestedBy||'—'}</div>
                        <div style={{ fontSize:10, color:'#aaa' }}>
                          {new Date(p.createdAt).toLocaleDateString('en-IN',
                            {day:'2-digit',month:'short',year:'2-digit'})}
                          {' '}
                          {new Date(p.createdAt).toLocaleTimeString('en-IN',
                            {hour:'2-digit',minute:'2-digit'})}
                        </div>
                      </td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:10,
                          fontSize:11, fontWeight:700,
                          background:sc.bg, color:sc.color }}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td style={{ padding:'9px 12px' }}
                        onClick={e=>e.stopPropagation()}>
                        <div style={{ display:'flex', gap:4 }}>
                          {p.status==='DRAFT' && (
                            <>
                              <button className="btn-xs"
                                onClick={()=>nav(`/mm/pr/edit/${p.id}`)}>
                                ✏️ Edit
                              </button>
                              <button className="btn-xs pri"
                                onClick={()=>submit(p)}>
                                📤 Submit
                              </button>
                            </>
                          )}
                          {p.status==='SUBMITTED' && (
                            <>
                              <button className="btn-xs suc"
                                disabled={approving===p.id}
                                onClick={()=>approve(p)}>
                                {approving===p.id?'⏳':'✅'} Approve
                              </button>
                              <button className="btn-xs"
                                style={{ color:'#DC3545' }}
                                onClick={()=>setRejectPR(p)}>
                                ❌
                              </button>
                            </>
                          )}
                          {p.status==='HOD_APPROVED' && (
                            <>
                              <button className="btn-xs pri"
                                onClick={()=>nav(
                                  `/mm/cs/new?pr=${p.id}&prNo=${p.prNo}`)}>
                                📊 Create CS
                              </button>
                              <button className="btn-xs pri"
                                style={{background:'#0C5460',color:'#fff'}}
                                onClick={()=>nav(
                                  `/mm/po/new?prNo=${p.prNo}`)}>
                                🛒 Create PO
                              </button>
                              <button className="btn-xs"
                                style={{color:'#DC3545'}}
                                onClick={()=>setPrecloseModal(p)}>
                                🔒
                              </button>
                            </>
                          )}
                          <button className="btn-xs"
                            onClick={()=>openDetail(p)}>View</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selPR && (
        <PRDetailModal pr={selPR}
          onClose={()=>setSelPR(null)}
          onApprove={approve}
          onReject={setRejectPR} />
      )}

      {rejectPR && (
        <RejectModal pr={rejectPR}
          onSave={()=>{ setRejectPR(null); fetchPRs() }}
          onCancel={()=>setRejectPR(null)} />
      )}

      {precloseModal && (
        <div style={{ position:'fixed', inset:0,
          background:'rgba(0,0,0,.5)',
          display:'flex', alignItems:'center',
          justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'#fff', borderRadius:10,
            width:420, overflow:'hidden',
            boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ background:'#6C757D', padding:'14px 20px',
              display:'flex', justifyContent:'space-between',
              alignItems:'center' }}>
              <h3 style={{ color:'#fff', margin:0,
                fontSize:15, fontWeight:700 }}>
                🔒 Pre-close PR
              </h3>
              <span onClick={()=>setPrecloseModal(null)}
                style={{ color:'#fff', cursor:'pointer',
                  fontSize:20 }}>✕</span>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ fontSize:13, color:'#495057',
                marginBottom:12 }}>
                <strong>{precloseModal.prNo}</strong> —
                {precloseModal.department}
              </div>
              <label style={{ fontSize:11, fontWeight:700,
                color:'#495057', display:'block',
                marginBottom:4 }}>Pre-close Reason *</label>
              <textarea value={precloseReason}
                onChange={e=>setPrecloseReason(e.target.value)}
                rows={3}
                style={{ padding:'8px 10px',
                  border:'1.5px solid #E0D5E0',
                  borderRadius:5, fontSize:12,
                  outline:'none', width:'100%',
                  boxSizing:'border-box', resize:'vertical' }}
                placeholder="Reason for pre-closing..." />
            </div>
            <div style={{ padding:'12px 20px',
              borderTop:'1px solid #E0D5E0',
              display:'flex', justifyContent:'flex-end',
              gap:10, background:'#F8F7FA' }}>
              <button onClick={()=>setPrecloseModal(null)}
                style={{ padding:'8px 20px', background:'#fff',
                  color:'#6C757D',
                  border:'1.5px solid #E0D5E0',
                  borderRadius:6, fontSize:13,
                  cursor:'pointer' }}>Cancel</button>
              <button onClick={preclose}
                style={{ padding:'8px 24px',
                  background:'#6C757D', color:'#fff',
                  border:'none', borderRadius:6,
                  fontSize:13, fontWeight:700,
                  cursor:'pointer' }}>
                🔒 Pre-close PR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
