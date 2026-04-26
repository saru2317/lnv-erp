import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const SEED = [
  { id:1, complaintNo:'CC-2026-001', date:'2026-04-10', customer:'ABC Textiles',  partName:'Ring Yarn 30s',     issue:'CSP below spec — 1940 vs min 2100',        severity:'Critical', status:'In Progress', owner:'QC Dept',    ncrRef:'NCR-2026-018', _8dRef:'8D-2026-001' },
  { id:2, complaintNo:'CC-2026-002', date:'2026-04-08', customer:'DEF Exports',   partName:'OE Yarn 12s',       issue:'Nep count high — 310/km vs spec ≤200',      severity:'Major',    status:'CAPA Issued', owner:'Production', ncrRef:'NCR-2026-016', _8dRef:'' },
  { id:3, complaintNo:'CC-2026-003', date:'2026-04-05', customer:'GHI Spinners',  partName:'Cotton Sliver',     issue:'Moisture content variation in export lot',   severity:'Minor',    status:'Closed',      owner:'QC Dept',    ncrRef:'NCR-2026-015', _8dRef:'' },
  { id:4, complaintNo:'CC-2026-004', date:'2026-04-01', customer:'JKL Industries',partName:'Ring Yarn 40s',     issue:'Count variation ±0.8 Ne — spec ±0.3',       severity:'Major',    status:'Open',        owner:'Production', ncrRef:'',             _8dRef:'' },
]

const SEV_COLOR = { Critical:['#F8D7DA','#721C24'], Major:['#FFF3CD','#856404'], Minor:['#D1ECF1','#0C5460'] }
const STS_COLOR = { Open:['#FFF3CD','#856404'], 'In Progress':['#D1ECF1','#0C5460'], 'CAPA Issued':['#EDE0EA','#714B67'], Closed:['#D4EDDA','#155724'] }

export default function CustomerComplaintList() {
  const nav = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/qm/customer-complaints`, { headers:{ Authorization:`Bearer ${getToken()}` } })
      const data = await res.json()
      setComplaints(data.data?.length ? data.data : SEED)
    } catch { setComplaints(SEED) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const statuses = ['All','Open','In Progress','CAPA Issued','Closed']
  const shown = complaints.filter(c => {
    const ms = filter === 'All' || c.status === filter
    const mt = !search || c.complaintNo?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer?.toLowerCase().includes(search.toLowerCase()) ||
      c.partName?.toLowerCase().includes(search.toLowerCase())
    return ms && mt
  })

  // Stats
  const open     = complaints.filter(c => c.status === 'Open').length
  const critical = complaints.filter(c => c.severity === 'Critical').length
  const closed   = complaints.filter(c => c.status === 'Closed').length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Customer Complaints <small>8D &amp; CAPA Driven Resolution</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="Search complaint / customer / part..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:260}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/qm/complaint/new')}>New Complaint</button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
        {[
          ['Total',    complaints.length, '#EDE0EA','#714B67'],
          ['Open',     open,              '#FFF3CD','#856404'],
          ['Critical', critical,          '#F8D7DA','#721C24'],
          ['Closed',   closed,            '#D4EDDA','#155724'],
        ].map(([l,v,bg,c])=>(
          <div key={l} style={{background:bg,borderRadius:8,padding:'10px 16px',textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:800,color:c,fontFamily:'DM Mono,monospace'}}>{v}</div>
            <div style={{fontSize:11,fontWeight:700,color:c,opacity:.8}}>{l}</div>
          </div>
        ))}
      </div>

      <div className="pp-chips">
        {statuses.map(s=>(
          <div key={s} className={`pp-chip${filter===s?' on':''}`} onClick={()=>setFilter(s)}>
            {s} <span>{s==='All'?complaints.length:complaints.filter(c=>c.status===s).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Complaint No.</th><th>Date</th><th>Customer</th><th>Part</th>
          <th>Issue</th><th>Severity</th><th>Owner</th><th>NCR</th><th>8D</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading
            ? <tr><td colSpan={11} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
            : shown.length===0
            ? <tr><td colSpan={11} style={{padding:30,textAlign:'center',color:'#6C757D'}}>No complaints found</td></tr>
            : shown.map(c=>{
              const [sevBg,sevTx] = SEV_COLOR[c.severity] || ['#EEE','#333']
              const [stsBg,stsTx] = STS_COLOR[c.status]   || ['#EEE','#333']
              return (
              <tr key={c.id} style={{cursor:'pointer',background:c.severity==='Critical'?'#FFF9F9':'inherit'}}
                onClick={()=>nav(`/qm/complaint/${c.id}`)}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{c.complaintNo}</strong></td>
                <td style={{fontSize:'11px'}}>{c.date ? new Date(c.date).toLocaleDateString('en-IN') : '—'}</td>
                <td style={{fontSize:'12px',fontWeight:600}}>{c.customer}</td>
                <td style={{fontSize:'12px'}}>{c.partName}</td>
                <td style={{fontSize:'12px',maxWidth:200}}>{c.issue}</td>
                <td><span style={{background:sevBg,color:sevTx,padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>{c.severity}</span></td>
                <td style={{fontSize:'12px'}}>{c.owner||'—'}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:c.ncrRef?'var(--odoo-orange)':'#CCC'}}>{c.ncrRef||'—'}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:c._8dRef?'var(--odoo-blue)':'#CCC'}}>{c._8dRef||'—'}</td>
                <td><span style={{background:stsBg,color:stsTx,padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>{c.status}</span></td>
                <td onClick={e=>e.stopPropagation()}>
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn-xs" onClick={()=>nav(`/qm/complaint/${c.id}`)}>View</button>
                    {!c.ncrRef && <button className="btn-xs pri" onClick={()=>nav('/qm/ncr/new')}>NCR</button>}
                    {!c._8dRef && c.ncrRef && <button className="btn-xs pri" onClick={()=>nav('/qm/8d/new')}>8D</button>}
                  </div>
                </td>
              </tr>
            )})}
        </tbody>
      </table>
    </div>
  )
}
