import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

export default function AdvanceRegister() {
  const [tab,     setTab]     = useState('All')
  const [rows,    setRows]    = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/advances`, { headers: hdr2() })
      const d = await r.json()
      setRows(d.data || [])
      setSummary({ totalCustomer:d.totalCustomer||0, totalVendor:d.totalVendor||0, total:d.total||0 })
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = tab==='All' ? rows : rows.filter(r=>r.type.startsWith(tab))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Advance Register
          <small> Customer · Vendor · Employee advances</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:14}}>
        {[
          { cls:'blue',   label:'Customer Advances', val:INR(summary.totalCustomer||0), sub:'Received from customers' },
          { cls:'orange', label:'Vendor Advances',   val:INR(summary.totalVendor||0),   sub:'Paid to vendors' },
          { cls:'purple', label:'Total Outstanding', val:INR(summary.total||0),         sub:'All advances' },
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
          }}>{t}</button>
        ))}
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>JV No.</th><th>Date</th><th>Party</th><th>Type</th>
            <th style={{textAlign:'right'}}>Amount</th>
            <th style={{textAlign:'center'}}>Status</th>
          </tr></thead>
          <tbody>
            {filtered.length===0 ? (
              <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No advances found. Post advance JVs to see them here.
              </td></tr>
            ) : filtered.map((r,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{r.jeNo||'—'}</td>
                <td style={{fontSize:11}}>{r.date?new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}):'—'}</td>
                <td style={{fontWeight:600,fontSize:12}}>{r.party}</td>
                <td>
                  <span style={{background:r.type.includes('Customer')?'#CCE5FF':'#FFF3CD',
                    color:r.type.includes('Customer')?'#004085':'#856404',
                    padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                    {r.type}
                  </span>
                </td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:13}}>{INR(r.amount)}</td>
                <td style={{textAlign:'center'}}>
                  <span style={{background:'#FFF3CD',color:'#856404',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                    Outstanding
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length>0&&(
            <tfoot>
              <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #714B67'}}>
                <td colSpan={4} style={{padding:'9px 12px',color:'#714B67'}}>TOTAL</td>
                <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14}}>
                  {INR(filtered.reduce((a,r)=>a+r.amount,0))}
                </td>
                <td/>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  )
}
