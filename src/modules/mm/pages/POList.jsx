import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const nav = useNavigate()
  const { viewMode, toggleView } = useListView('MM-POList')
  const [pos,    setPOs]   = useState([])
  const [loading,setLoad]  = useState(true)
  const [chip,   setChip]  = useState('all')
  const [search, setSearch]= useState('')

  const fetchPOs = useCallback(async () => {
    setLoad(true)
    try {
      const data = await mmApi.getPOList()
      setPOs(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoad(false) }
  }, [])

  useEffect(()=>{ fetchPOs() }, [])

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
                        <button className="btn-xs suc"
                          onClick={e=>approve(e,p.id)}>Approve</button>
                      )}
                      {p.status==='APPROVED' && (
                        <button className="btn-xs pri"
                          onClick={()=>nav(`/mm/grn/new?po=${p.id}`)}>GRN</button>
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
