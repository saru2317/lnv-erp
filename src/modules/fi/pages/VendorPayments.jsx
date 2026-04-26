import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})

export default function VendorPayments() {
  const nav = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/je?refType=MM`, { headers: hdr2() })
      const data = await res.json()
      setPayments(data.data || [])
    } catch { toast.error('Failed to load payments') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const shown = payments.filter(p =>
    !search ||
    p.narration?.toLowerCase().includes(search.toLowerCase()) ||
    p.jeNo?.includes(search) ||
    p.refNo?.includes(search)
  )
  const total = shown.reduce((a,p) => a + parseFloat(p.totalDebit||0), 0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Vendor Payments <small>Outgoing Payment Register</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="Search payment / vendor..."
            value={search} onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/fi/voucher?type=PV')}>
            Record Payment (PV)
          </button>
        </div>
      </div>

      <div style={{background:'#F8D7DA',borderRadius:8,padding:'10px 16px',marginBottom:12,
        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontWeight:700,color:'#721C24'}}>Total Payments — {shown.length} vouchers</span>
        <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:18,color:'#721C24'}}>{INR(total)}</span>
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Voucher No.</th><th>Date</th><th>Vendor / Narration</th>
          <th>Invoice Ref</th><th style={{textAlign:'right'}}>Amount</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
          ) : shown.length === 0 ? (
            <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
              No payments recorded yet.
              <button className="btn-xs pri" style={{marginLeft:10}}
                onClick={()=>nav('/fi/voucher?type=PV')}>Record First Payment →</button>
            </td></tr>
          ) : shown.map(p => (
            <tr key={p.id}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{p.jeNo}</strong></td>
              <td style={{fontSize:11}}>{new Date(p.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}</td>
              <td style={{fontWeight:600,fontSize:12,maxWidth:280}}>{p.narration}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{p.refNo||'—'}</td>
              <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-red)',fontSize:13}}>{INR(p.totalDebit)}</td>
              <td><button className="btn-xs" onClick={()=>nav('/fi/daybook')}>View</button></td>
            </tr>
          ))}
        </tbody>
        {shown.length > 0 && (
          <tfoot>
            <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #E0D5E0'}}>
              <td colSpan={4} style={{padding:'8px 12px',color:'#714B67'}}>TOTAL</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-red)',fontSize:14}}>{INR(total)}</td>
              <td/>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
