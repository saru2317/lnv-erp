import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useListView } from '@hooks/useListView'
import ListViewToggle from '@components/ui/ListViewToggle'
import toast from 'react-hot-toast'
import { mmApi } from '../services/mmApi'

const STATUS = {
  DRAFT:       { bg:'#E9ECEF', color:'#383D41', label:'Draft'       },
  APPROVED:    { bg:'#D4EDDA', color:'#155724', label:'Approved'     },
  SENT:        { bg:'#D1ECF1', color:'#0C5460', label:'Sent'         },
  PARTIAL_GRN: { bg:'#FFF3CD', color:'#856404', label:'Partial GRN'  },
  GRN_DONE:    { bg:'#EDE0EA', color:'#714B67', label:'GRN Done'     },
  CANCELLED:   { bg:'#F8D7DA', color:'#721C24', label:'Cancelled'    },
  CLOSED:      { bg:'#E9ECEF', color:'#6C757D', label:'Closed'       },
}
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN')

export default function POList() {
  const nav      = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const raiseAdvanceRequest = (p) => {
    const params = new URLSearchParams({
      vendorCode:  p.vendorCode  || '',
      vendorName:  p.vendorName  || '',
      vendorGstin: p.vendorGstin || '',
      invoiceRef:  p.poNo        || '',
      invoiceAmt:  p.totalAmount || 0,
      requestAmt:  p.totalAmount || 0,
      isAdvance:   'true',
      purpose:     `Advance Payment for PO ${p.poNo}`,
      notes:       `PO Reference: ${p.poNo}`,
    })
    nav(`/mm/payment-requests?${params.toString()}`)
  }
  const { viewMode, toggleView } = useListView('MM-POList')
  const [pos,        setPOs]       = useState([])
  const [advancedPOs, setAdvancedPOs] = useState(new Set()) // PO nos that already have a payment request
  const [loading,    setLoad]      = useState(true)
  const [chip,       setChip]      = useState('all')
  const [search,     setSearch]    = useState('')

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const tok = () => localStorage.getItem('lnv_token')

  const fetchPOs = useCallback(async () => {
    setLoad(true)
    try {
      const [poData, prData, invData] = await Promise.all([
        mmApi.getPOList(),
        fetch(`${BASE_URL}/mm/payment-requests`, {
          headers:{ Authorization:`Bearer ${tok()}` }
        }).then(r=>r.json()).catch(()=>({ data:[] })),
        fetch(`${BASE_URL}/mm/invoices`, {
          headers:{ Authorization:`Bearer ${tok()}` }
        }).then(r=>r.json()).catch(()=>({ data:[] })),
      ])
      setPOs(poData.data||[])

      const allPRs  = prData.data||[]
      const allInvs = invData.data||[]

      // Build invoice no → PO no map
      const invToPO = {}
      allInvs.forEach(inv => { if (inv.poNo) invToPO[inv.invNo] = inv.poNo })

      // Build set of BLOCKED PO nos:
      // 1. Advance request raised directly against PO (isAdvance=true)
      // 2. Invoice payment request raised for an invoice linked to this PO
      const blockedPoNos = new Set()
      allPRs
        .filter(r => ['PENDING','APPROVED'].includes(r.status))
        .forEach(r => {
          if (r.isAdvance) {
            // invoiceRef stores PO number for advance
            if (r.invoiceRef) blockedPoNos.add(r.invoiceRef)
          } else {
            // invoiceRef stores invoice number — find its linked PO
            const linkedPO = invToPO[r.invoiceRef]
            if (linkedPO) blockedPoNos.add(linkedPO)
          }
        })

      setAdvancedPOs(blockedPoNos)
    } catch(e){ toast.error(e.message) } finally { setLoad(false) }
  }, [])

  useEffect(()=>{ fetchPOs() }, [location.key])

  const cancelPO = async (e, po) => {
    e.stopPropagation()
    const nonCancellable = ['GRN_DONE', 'PARTIAL_GRN', 'CLOSED', 'CANCELLED']
    if (nonCancellable.includes(po.status)) {
      return toast.error(`Cannot cancel — goods already received against ${po.poNo}`)
    }
    if (!window.confirm(`Cancel ${po.poNo}? This will reset linked PR and CS status.`)) return
    try {
      const res  = await fetch(
        `${import.meta.env.VITE_API_URL||'http://localhost:3000/api'}/mm/po/${po.id}/cancel`,
        { method:'PATCH', headers:{
            'Content-Type':'application/json',
            Authorization:`Bearer ${localStorage.getItem('lnv_token')}` } }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      fetchPOs()
    } catch(e) { toast.error(e.message) }
  }

  const filtered = pos.filter(p => {
    const matchChip = chip==='all' ||
      (chip==='draft'    && p.status==='DRAFT') ||
      (chip==='approved' && p.status==='APPROVED') ||
      (chip==='received' && p.status==='GRN_DONE') ||
      (chip==='pending'  && ['SENT','PARTIAL_GRN'].includes(p.status))
    const matchSearch = !search ||
      p.poNo?.toLowerCase().includes(search.toLowerCase()) ||
      p.vendorName?.toLowerCase().includes(search.toLowerCase())
    return matchChip && matchSearch
  })

  const approve = async (e, id) => {
    e.stopPropagation()
    try {
      await mmApi.updatePO(id, { status:'APPROVED',
        approvedBy:'Admin' })
      toast.success('PO Approved!')
      fetchPOs()
    } catch(err){ toast.error(err.message) }
  }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Purchase Orders <small>ME2M</small></div>
        <div className="lv-acts">
          <ListViewToggle viewMode={viewMode} onToggle={toggleView} />
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm"
            onClick={()=>nav('/mm/po/new')}>+ New PO</button>
        </div>
      </div>

      <div className="mm-chips">
        {[{k:'all',l:'All',n:pos.length},
          {k:'draft',l:'Draft',n:pos.filter(p=>p.status==='DRAFT').length},
          {k:'approved',l:'Approved',n:pos.filter(p=>p.status==='APPROVED').length},
          {k:'pending',l:'Pending GRN',n:pos.filter(p=>['SENT','PARTIAL_GRN'].includes(p.status)).length},
          {k:'received',l:'GRN Done',n:pos.filter(p=>p.status==='GRN_DONE').length},
        ].map(c=>(
          <div key={c.k} className={`mm-chip${chip===c.k?' on':''}`}
            onClick={()=>setChip(c.k)}>
            {c.l} <strong style={{ marginLeft:4 }}>{c.n}</strong>
          </div>
        ))}
      </div>

      <div className="mm-filt">
        <div className="mm-fs-input">
          <input placeholder="Search PO No., Vendor..."
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          ⏳ Loading...
        </div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ fontWeight:700 }}>No Purchase Orders</div>
          <button className="btn btn-p sd-bsm"
            style={{ marginTop:12 }}
            onClick={()=>nav('/mm/po/new')}>+ Create First PO</button>
        </div>
      ) : (
        <table className="mm-tbl">
          <thead>
            <tr>
              <th><input type="checkbox"/></th>
              <th>PO No.</th><th>Date</th><th>Vendor</th>
              <th>Category</th><th>Amount</th><th>GST</th>
              <th>Total</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p=>{
              const sc = STATUS[p.status]||STATUS.DRAFT
              return (
                <tr key={p.id} onClick={()=>nav(`/mm/po/${p.id}`)}>
                  <td onClick={e=>e.stopPropagation()}>
                    <input type="checkbox"/></td>
                  <td><strong style={{ color:'var(--odoo-purple)',
                    fontFamily:'DM Mono,monospace', fontSize:12 }}>
                    {p.poNo}</strong></td>
                  <td>{new Date(p.poDate).toLocaleDateString('en-IN')}</td>
                  <td>{p.vendorName}</td>
                  <td><span style={{ fontSize:11, color:'#6C757D' }}>
                    {p.purchaseCategory||'—'}</span></td>
                  <td>{fmtC(p.subTotal)}</td>
                  <td style={{ color:'#6C757D', fontSize:12 }}>
                    {fmtC(p.totalGST)}</td>
                  <td><strong>{fmtC(p.totalAmount)}</strong></td>
                  <td><span style={{ padding:'2px 8px', borderRadius:10,
                    fontSize:11, fontWeight:700,
                    background:sc.bg, color:sc.color }}>
                    {sc.label}</span></td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn-xs"
                        onClick={()=>nav(`/mm/po/${p.id}`)}>View</button>
                      {p.status==='DRAFT' && (
                        <>
                          <button className="btn-xs"
                            onClick={()=>nav(`/mm/po/edit/${p.id}`)}>Edit</button>
                          <button className="btn-xs suc"
                            onClick={e=>approve(e,p.id)}>Approve</button>
                        </>
                      )}
                      {p.status==='APPROVED' && (
                        <button className="btn-xs pri"
                          onClick={()=>nav(`/mm/grn/new?po=${p.id}`)}>GRN</button>
                      )}
                      {['APPROVED','GRN_DONE','SENT','PARTIAL_GRN'].includes(p.status) && (() => {
                        const alreadyRaised = advancedPOs.has(p.poNo)
                        // Check if blocked by invoice payment request or direct advance
                        const blockReason   = alreadyRaised ? 'Payment request already raised for this PO' : ''
                        return (
                          <button className="btn-xs"
                            disabled={alreadyRaised}
                            title={blockReason || 'Raise advance payment request'}
                            style={{
                              background: alreadyRaised ? '#E9ECEF' : '#CCE5FF',
                              color:      alreadyRaised ? '#6C757D' : '#004085',
                              border:     `1px solid ${alreadyRaised ? '#CED4DA' : '#B8DAFF'}`,
                              cursor:     alreadyRaised ? 'not-allowed' : 'pointer',
                              opacity:    alreadyRaised ? 0.7 : 1,
                            }}
                            onClick={() => !alreadyRaised && raiseAdvanceRequest(p)}>
                            {alreadyRaised ? '✓ Req. Raised' : '💰 Adv. Request'}
                          </button>
                        )
                      })()}
                      {['DRAFT','APPROVED'].includes(p.status) && (
                        <button className="btn-xs"
                          style={{background:'#856404',color:'#fff',border:'none'}}
                          onClick={e=>cancelPO(e,p)}>
                          ✕ Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
