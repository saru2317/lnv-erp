import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const STATUS = {
  PENDING: { bg:'#FFF3CD', color:'#856404', label:'Pending'  },
  PARTIAL: { bg:'#D1ECF1', color:'#0C5460', label:'Partial'  },
  PAID:    { bg:'#D4EDDA', color:'#155724', label:'Paid'     },
  OVERDUE: { bg:'#F8D7DA', color:'#721C24', label:'Overdue'  },
}
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN')

function PayModal({ inv, onSave, onCancel }) {
  const [amount, setAmount] = useState(parseFloat(inv.balance||0))
  const [mode,   setMode]   = useState('Bank Transfer')
  const [ref,    setRef]    = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/mm/invoices/${inv.id}/pay`,
        { method:'PATCH', headers:authHdrs(),
          body:JSON.stringify({ payAmount:amount, paymentMode:mode, paymentRef:ref }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0',
    borderRadius:5, fontSize:12, outline:'none', width:'100%',
    boxSizing:'border-box' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:420,
        overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#155724', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontSize:15,
            fontWeight:700 }}>💳 Pay Invoice</h3>
          <span onClick={onCancel}
            style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:'#D4EDDA', padding:'10px 14px',
            borderRadius:8, fontSize:12 }}>
            <strong>{inv.invNo}</strong> — {inv.vendorName}<br/>
            Total: {fmtC(inv.totalAmount)} |
            Paid: {fmtC(inv.paidAmount)} |
            Balance: <strong>{fmtC(inv.balance)}</strong>
          </div>
          <div><label style={{ fontSize:11, fontWeight:700, color:'#495057',
            display:'block', marginBottom:3 }}>Pay Amount *</label>
            <input type="number" style={inp}
              value={amount}
              onChange={e=>setAmount(e.target.value)} />
          </div>
          <div><label style={{ fontSize:11, fontWeight:700, color:'#495057',
            display:'block', marginBottom:3 }}>Payment Mode</label>
            <select style={{ ...inp, cursor:'pointer' }}
              value={mode} onChange={e=>setMode(e.target.value)}>
              {['Bank Transfer','NEFT','RTGS','Cheque','Cash','UPI'].map(m=>(
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div><label style={{ fontSize:11, fontWeight:700, color:'#495057',
            display:'block', marginBottom:3 }}>Reference No.</label>
            <input style={inp} value={ref}
              onChange={e=>setRef(e.target.value)}
              placeholder="UTR / Cheque No." />
          </div>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end', gap:10,
          background:'#F8F7FA' }}>
          <button onClick={onCancel}
            style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
              border:'1.5px solid #E0D5E0', borderRadius:6,
              fontSize:13, cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding:'8px 24px', background:'#155724',
              color:'#fff', border:'none', borderRadius:6,
              fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {saving?'⏳ Saving...':'💳 Pay Now'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VendorInvList() {
  const nav = useNavigate()
  const [invs,   setInvs]  = useState([])
  const [loading,setLoad]  = useState(true)
  const [chip,   setChip]  = useState('all')
  const [payInv, setPayInv]= useState(null)
  const [search, setSearch]= useState('')
  const [viewInv,setViewInv]= useState(null)

  const fetchInvs = useCallback(async () => {
    setLoad(true)
    try {
      const res  = await fetch(`${BASE_URL}/mm/invoices`, { headers:{ Authorization:`Bearer ${getToken()}` }})
      const data = await res.json()
      setInvs(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoad(false) }
  }, [])

  useEffect(()=>{ fetchInvs() }, [])

  // Auto flag overdue
  const enriched = invs.map(inv => ({
    ...inv,
    status: inv.status==='PENDING' && inv.dueDate &&
      new Date(inv.dueDate)<new Date() ? 'OVERDUE' : inv.status
  }))

  const chipFiltered = chip==='all' ? enriched
    : enriched.filter(i=>i.status.toUpperCase()===chip.toUpperCase())
  const filtered = chipFiltered.filter(i =>
    !search ||
    i.invNo?.toLowerCase().includes(search.toLowerCase()) ||
    i.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    i.poNo?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8', borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">Vendor Invoices <small>MIRO · Invoice Verification</small></div>
          <div className="lv-acts">
            <input placeholder="Search invoice, vendor, PO..."
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{ padding:'6px 12px', border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12, width:200 }} />
            <button className="btn btn-s sd-bsm">Export</button>
            <button className="btn btn-p sd-bsm"
              onClick={()=>nav('/mm/invoices/new')}>＋ Enter Invoice</button>
          </div>
        </div>
      </div>

      <div className="mm-chips">
        {[{k:'all',l:'All',n:enriched.length},
          {k:'pending',l:'Pending',n:enriched.filter(i=>i.status==='PENDING').length},
          {k:'partial',l:'Partial',n:enriched.filter(i=>i.status==='PARTIAL').length},
          {k:'overdue',l:'Overdue',n:enriched.filter(i=>i.status==='OVERDUE').length,red:true},
          {k:'paid',l:'Paid',n:enriched.filter(i=>i.status==='PAID').length},
        ].map(c=>(
          <div key={c.k}
            className={`mm-chip${chip===c.k?' on':''}`}
            style={c.red&&chip!==c.k?{color:'#DC3545',borderColor:'#DC3545'}:{}}
            onClick={()=>setChip(c.k)}>
            {c.l} <strong style={{ marginLeft:4 }}>{c.n}</strong>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🧾</div>
          <div style={{ fontWeight:700 }}>No invoices found</div>
          <button className="btn btn-p sd-bsm" style={{ marginTop:12 }}
            onClick={()=>nav('/mm/invoices/new')}>+ Enter Invoice</button>
        </div>
      ) : (
        <table className="mm-tbl">
          <thead>
            <tr>
              <th><input type="checkbox"/></th>
              <th>Invoice No.</th><th>Vendor Inv No.</th>
              <th>Vendor</th><th>PO Ref</th>
              <th>Inv Date</th><th>Due Date</th>
              <th>Amount</th><th>Paid</th>
              <th>Balance</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv=>{
              const sc = STATUS[inv.status]||STATUS.PENDING
              const isOverdue = inv.status==='OVERDUE'
              return (
                <tr key={inv.id}
                  style={{ background:isOverdue?'#FFF5F5':'inherit' }}>
                  <td><input type="checkbox"/></td>
                  <td><strong style={{ color:'var(--odoo-purple)',
                    fontFamily:'DM Mono,monospace', fontSize:12 }}>
                    {inv.invNo}</strong></td>
                  <td style={{ fontSize:11, color:'#6C757D' }}>
                    {inv.vendorInvNo||'—'}</td>
                  <td style={{ fontWeight:600 }}>{inv.vendorName}</td>
                  <td style={{ fontSize:12, color:'var(--odoo-purple)' }}>
                    {inv.poNo||'—'}</td>
                  <td>{new Date(inv.invDate).toLocaleDateString('en-IN')}</td>
                  <td style={{ color:isOverdue?'#DC3545':'inherit',
                    fontWeight:isOverdue?700:400 }}>
                    {inv.dueDate
                      ? new Date(inv.dueDate).toLocaleDateString('en-IN')
                      : '—'}
                  </td>
                  <td><strong>{fmtC(inv.totalAmount)}</strong></td>
                  <td style={{ color:'#155724' }}>{fmtC(inv.paidAmount)}</td>
                  <td><strong style={{ color:
                    parseFloat(inv.balance||0)>0?
                      isOverdue?'#DC3545':'#856404':'#155724' }}>
                    {fmtC(inv.balance)}</strong></td>
                  <td><span style={{ padding:'2px 8px', borderRadius:10,
                    fontSize:11, fontWeight:700,
                    background:sc.bg, color:sc.color }}>
                    {sc.label}</span></td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn-xs"
                        onClick={()=>setViewInv(inv)}>
                        👁 View
                      </button>
                      {inv.status!=='PAID' && (
                        <button className="btn-xs suc"
                          onClick={()=>setPayInv(inv)}>
                          💳 Pay
                        </button>
                      )}
                      {inv.status!=='PAID' && (
                        <button className="btn-xs"
                          style={{ color:'#DC3545' }}
                          onClick={async()=>{
                            if(!window.confirm('Cancel this invoice?')) return
                            try {
                              await fetch(`${BASE_URL}/mm/invoices/${inv.id}`,
                                { method:'PATCH', headers:authHdrs(),
                                  body:JSON.stringify({status:'CANCELLED'}) })
                              toast.success('Invoice cancelled')
                              fetchInvs()
                            } catch(e){ toast.error(e.message) }
                          }}>
                          ❌
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

      {payInv && (
        <PayModal inv={payInv}
          onSave={()=>{ setPayInv(null); fetchInvs() }}
          onCancel={()=>setPayInv(null)} />
      )}

      {viewInv && (
        <div style={{ position:'fixed', inset:0,
          background:'rgba(0,0,0,.5)', display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'#fff', borderRadius:10, width:580,
            maxHeight:'85vh', overflow:'hidden', display:'flex',
            flexDirection:'column',
            boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ background:'#714B67', padding:'14px 20px',
              display:'flex', justifyContent:'space-between',
              alignItems:'center' }}>
              <h3 style={{ color:'#fff', margin:0, fontSize:15,
                fontWeight:700 }}>
                🧾 {viewInv.invNo}
              </h3>
              <span onClick={()=>setViewInv(null)}
                style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
            </div>
            <div style={{ overflowY:'auto', flex:1, padding:20 }}>
              <div style={{ display:'grid',
                gridTemplateColumns:'1fr 1fr', gap:1,
                background:'#E0D5E0', borderRadius:8,
                overflow:'hidden', marginBottom:14 }}>
                {[
                  ['Invoice No.',     viewInv.invNo],
                  ['Vendor Inv No.',  viewInv.vendorInvNo||'—'],
                  ['Vendor',          viewInv.vendorName],
                  ['PO Reference',    viewInv.poNo||'—'],
                  ['Invoice Date',    viewInv.invDate
                    ?new Date(viewInv.invDate).toLocaleDateString('en-IN'):'—'],
                  ['Due Date',        viewInv.dueDate
                    ?new Date(viewInv.dueDate).toLocaleDateString('en-IN'):'—'],
                  ['Total Amount',    fmtC(viewInv.totalAmount)],
                  ['Paid Amount',     fmtC(viewInv.paidAmount)],
                  ['Balance',         fmtC(viewInv.balance)],
                  ['Payment Mode',    viewInv.paymentMode||'—'],
                  ['Payment Ref',     viewInv.paymentRef||'—'],
                  ['Status',          STATUS[viewInv.status]?.label||viewInv.status],
                ].map(([l,v])=>(
                  <div key={l} style={{ background:'#fff',
                    padding:'10px 14px' }}>
                    <div style={{ fontSize:10, color:'#6C757D',
                      fontWeight:700, textTransform:'uppercase',
                      marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding:'12px 20px',
              borderTop:'1px solid #E0D5E0',
              display:'flex', justifyContent:'flex-end',
              gap:10, background:'#F8F7FA' }}>
              {viewInv.status!=='PAID' && (
                <button onClick={()=>{ setPayInv(viewInv); setViewInv(null) }}
                  style={{ padding:'8px 20px', background:'#155724',
                    color:'#fff', border:'none', borderRadius:6,
                    fontSize:13, cursor:'pointer', fontWeight:700 }}>
                  💳 Pay Now
                </button>
              )}
              <button onClick={()=>setViewInv(null)}
                style={{ padding:'8px 20px', background:'#714B67',
                  color:'#fff', border:'none', borderRadius:6,
                  fontSize:13, cursor:'pointer', fontWeight:700 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
