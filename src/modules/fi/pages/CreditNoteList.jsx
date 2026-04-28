// ══════════════════════════════════════════════════════
// SAVE AS: CreditNoteList.jsx
// ══════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

export default function CreditNoteList() {
  const [tab,     setTab]     = useState('All')
  const [rows,    setRows]    = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/credit-notes`, { headers: hdr2() })
      const d = await r.json()
      setRows(d.data || [])
      setSummary({ totalCustomer:d.totalCustomer||0, totalVendor:d.totalVendor||0 })
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = tab==='All' ? rows : rows.filter(r=>r.type.startsWith(tab))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Credit Note Register
          <small> Customer Returns · Vendor Debit Notes</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:14}}>
        {[
          { cls:'orange', label:'Customer Credit Notes', val:INR(summary.totalCustomer||0), sub:'Sales returns' },
          { cls:'blue',   label:'Vendor Debit Notes',    val:INR(summary.totalVendor||0),   sub:'Purchase returns' },
          { cls:'purple', label:'Total',                 val:INR((summary.totalCustomer||0)+(summary.totalVendor||0)), sub:'Combined' },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {['All','Customer','Vendor'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:'5px 16px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
            border:'1px solid #E0D5E0',
            background:tab===t?'#714B67':'#fff',
            color:tab===t?'#fff':'#6C757D'
          }}>{t} Note</button>
        ))}
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>JV No.</th><th>Date</th><th>Description</th><th>Type</th>
            <th>Ref No.</th>
            <th style={{textAlign:'right'}}>Amount</th>
            <th style={{textAlign:'center'}}>Status</th>
          </tr></thead>
          <tbody>
            {filtered.length===0 ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No credit notes found. Sales returns and purchase returns auto-appear here.
              </td></tr>
            ) : filtered.map((r,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{r.jeNo}</td>
                <td style={{fontSize:11}}>{r.date?new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}):'—'}</td>
                <td style={{fontSize:12,maxWidth:200}}>{r.narration}</td>
                <td>
                  <span style={{background:r.type.includes('Customer')?'#FFF3CD':'#D1ECF1',
                    color:r.type.includes('Customer')?'#856404':'#0C5460',
                    padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                    {r.type}
                  </span>
                </td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{r.refNo||'—'}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#DC3545'}}>{INR(r.amount)}</td>
                <td style={{textAlign:'center'}}>
                  <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>Posted</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
