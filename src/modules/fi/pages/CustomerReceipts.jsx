import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})

export default function CustomerReceipts() {
  const nav = useNavigate()
  const [receipts, setReceipts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/je?refType=SD`, { headers: hdr2() })
      const data = await res.json()
      // Only receipt JEs — bank account debited
      setReceipts((data.data||[]).filter(j =>
        j.lines?.some(l => l.debitAcctCode==='1200' || l.debitAcctCode==='1100')
      ))
    } catch { toast.error('Failed to load receipts') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const shown = receipts.filter(r =>
    !search ||
    r.narration?.toLowerCase().includes(search.toLowerCase()) ||
    r.jeNo?.includes(search) ||
    r.refNo?.includes(search)
  )
  const total = shown.reduce((a,r) => a + parseFloat(r.totalCredit||0), 0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Customer Receipts <small>Incoming Payment Register</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="Search receipt / customer..."
            value={search} onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/fi/voucher?type=RV')}>
            Record Receipt (RV)
          </button>
        </div>
      </div>

      <div style={{background:'#D4EDDA',borderRadius:8,padding:'10px 16px',marginBottom:12,
        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontWeight:700,color:'#155724'}}>Total Receipts — {shown.length} vouchers</span>
        <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:18,color:'#155724'}}>{INR(total)}</span>
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Voucher No.</th><th>Date</th><th>Customer / Narration</th>
          <th>Invoice Ref</th><th style={{textAlign:'right'}}>Amount</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
          ) : shown.length === 0 ? (
            <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
              No receipts recorded yet.
              <button className="btn-xs pri" style={{marginLeft:10}}
                onClick={()=>nav('/fi/voucher?type=RV')}>Record First Receipt →</button>
            </td></tr>
          ) : shown.map(r => (
            <tr key={r.id}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{r.jeNo}</strong></td>
              <td style={{fontSize:11}}>{new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}</td>
              <td style={{fontWeight:600,fontSize:12,maxWidth:280}}>{r.narration}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{r.refNo||'—'}</td>
              <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-green)',fontSize:13}}>{INR(r.totalCredit)}</td>
              <td><button className="btn-xs" onClick={()=>nav('/fi/daybook')}>View</button></td>
            </tr>
          ))}
        </tbody>
        {shown.length > 0 && (
          <tfoot>
            <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #E0D5E0'}}>
              <td colSpan={4} style={{padding:'8px 12px',color:'#714B67'}}>TOTAL</td>
              <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-green)',fontSize:14}}>{INR(total)}</td>
              <td/>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
