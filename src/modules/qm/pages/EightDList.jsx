import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const STATUS_COLORS = {
  D1:'#EDE0EA', D2:'#FFF3CD', D3:'#D4EDDA', D4:'#F8D7DA',
  D5:'#D1ECF1', D6:'#D4EDDA', D7:'#E2E3E5', D8:'#CCE5FF', Closed:'#D4EDDA',
}
const STATUS_TEXT = {
  D1:'#714B67', D2:'#856404', D3:'#155724', D4:'#721C24',
  D5:'#0C5460', D6:'#155724', D7:'#383d41', D8:'#004085', Closed:'#155724',
}

const SEED = [
  { id:1, reportNo:'8D-2026-0001', title:'Ring Yarn CSP Below Spec — Customer ABC', customer:'ABC Textiles', partName:'Ring Yarn 30s', severity:'Critical', status:'D4', reportDate:'2026-04-10', ncrRef:'NCR-2026-018' },
  { id:2, reportNo:'8D-2026-0002', title:'Solvent Purity Variance — Supplier Batch',  customer:'Internal',    partName:'Solvent Chemical', severity:'Major',    status:'D6', reportDate:'2026-04-08', ncrRef:'NCR-2026-016' },
  { id:3, reportNo:'8D-2026-0003', title:'OE Yarn Nep Count Exceeded Spec',           customer:'DEF Exports', partName:'OE Yarn 12s',     severity:'Minor',    status:'Closed', reportDate:'2026-03-28', ncrRef:'NCR-2026-015' },
]

export default function EightDList() {
  const nav      = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/qm/8d`, { headers: { Authorization:`Bearer ${getToken()}` } })
      const data = await res.json()
      setReports(data.data?.length ? data.data : SEED)
    } catch { setReports(SEED) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const statuses = ['All','D1','D2','D3','D4','D5','D6','D7','D8','Closed']
  const shown = reports.filter(r => {
    const ms = filter === 'All' || r.status === filter
    const mt = !search || r.reportNo?.toLowerCase().includes(search.toLowerCase()) || r.title?.toLowerCase().includes(search.toLowerCase()) || r.customer?.toLowerCase().includes(search.toLowerCase())
    return ms && mt
  })

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">8D Reports <small>Problem Solving — 8 Disciplines</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="Search 8D No. / title..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/8d/new')}>New 8D Report</button>
        </div>
      </div>

      <div className="pp-chips">
        {statuses.map(s => (
          <div key={s} className={`pp-chip${filter===s?' on':''}`} onClick={() => setFilter(s)}>
            {s} <span>{s==='All'?reports.length:reports.filter(r=>r.status===s).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>8D No.</th><th>Title</th><th>Customer</th><th>Part</th>
          <th>NCR Ref</th><th>Severity</th><th>Date</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading
            ? <tr><td colSpan={9} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
            : shown.length===0
            ? <tr><td colSpan={9} style={{padding:30,textAlign:'center',color:'#6C757D'}}>No 8D reports found</td></tr>
            : shown.map(r=>(
            <tr key={r.id} style={{cursor:'pointer'}} onClick={()=>nav(`/qm/8d/${r.id}`)}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.reportNo}</strong></td>
              <td style={{fontSize:'12px',maxWidth:220,fontWeight:600}}>{r.title}</td>
              <td style={{fontSize:'12px'}}>{r.customer||'—'}</td>
              <td style={{fontSize:'12px'}}>{r.partName||'—'}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-orange)'}}>{r.ncrRef||'—'}</td>
              <td>
                <span style={{fontWeight:700,fontSize:'12px',
                  color:r.severity==='Critical'?'var(--odoo-red)':r.severity==='Major'?'var(--odoo-orange)':'var(--odoo-blue)'}}>
                  {r.severity}
                </span>
              </td>
              <td style={{fontSize:'11px'}}>{r.reportDate ? new Date(r.reportDate).toLocaleDateString('en-IN') : '—'}</td>
              <td>
                <span style={{
                  background: STATUS_COLORS[r.status]||'#EEE',
                  color:      STATUS_TEXT[r.status]||'#333',
                  padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700
                }}>{r.status}</span>
              </td>
              <td onClick={e=>e.stopPropagation()}>
                <button className="btn-xs" onClick={()=>nav(`/qm/8d/${r.id}`)}>Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
