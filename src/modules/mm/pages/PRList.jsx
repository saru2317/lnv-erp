import ListViewToggle from '@components/ui/ListViewToggle'
import { useListView } from '@hooks/useListView'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DEMO_PRS = [
  { id:'PR-2026-0041', date:'12 Mar 2026', dept:'Production',  items:'Battery 12V 65AH × 10',      priority:'Urgent',  csReqd:true,  status:'cs_done',    csNo:'CS-2026-0018', poNo:'PO-2026-0089' },
  { id:'PR-2026-0040', date:'10 Mar 2026', dept:'Maintenance', items:'Hydraulic Oil × 50 Ltrs',     priority:'Normal',  csReqd:true,  status:'pending_cs', csNo:null,           poNo:null },
  { id:'PR-2026-0039', date:'08 Mar 2026', dept:'Production',  items:'Powder Coat (RAL 9005) × 25', priority:'Normal',  csReqd:false, status:'po_raised',  csNo:null,           poNo:'PO-2026-0088' },
  { id:'PR-2026-0038', date:'05 Mar 2026', dept:'Admin',       items:'Printer Cartridges × 6',      priority:'Normal',  csReqd:false, status:'po_raised',  csNo:null,           poNo:'PO-2026-0085' },
  { id:'PR-2026-0037', date:'01 Mar 2026', dept:'Quality',     items:'Thickness Gauge × 2',          priority:'Urgent',  csReqd:true,  status:'cs_done',    csNo:'CS-2026-0017', poNo:'PO-2026-0083' },
  { id:'PR-2026-0036', date:'28 Feb 2026', dept:'Maintenance', items:'V-Belt A-42 × 10',             priority:'Normal',  csReqd:true,  status:'approved',   csNo:'CS-2026-0016', poNo:null },
  { id:'PR-2026-0035', date:'25 Feb 2026', dept:'Production',  items:'MS Flat 50×6 × 100 kg',        priority:'Normal',  csReqd:true,  status:'pending_quotes', csNo:null,       poNo:null },
  { id:'PR-2026-0034', date:'22 Feb 2026', dept:'Admin',       items:'Office Chair × 4',             priority:'Low',     csReqd:true,  status:'draft',      csNo:null,           poNo:null },
]

const STATUS = {
  draft:          { label:'Draft',            bg:'#E2E3E5', color:'#383D41' },
  pending_quotes: { label:'Pending Quotes',   bg:'#FFF3CD', color:'#856404' },
  pending_cs:     { label:'CS Pending',       bg:'#D1ECF1', color:'#0C5460' },
  cs_done:        { label:'CS Done',          bg:'#EDE0EA', color:'#714B67' },
  approved:       { label:'HOD Approved',     bg:'#D4EDDA', color:'#155724' },
  po_raised:      { label:'PO Raised',        bg:'#D4EDDA', color:'#155724' },
}

const PRIORITY = {
  Urgent: { bg:'#F8D7DA', color:'#721C24' },
  Normal: { bg:'#D4EDDA', color:'#155724' },
  Low:    { bg:'#E2E3E5', color:'#383D41' },
}

export default function PRList() {
  const { viewMode, toggleView } = useListView('MM-PRList')
  const nav = useNavigate()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = DEMO_PRS.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter
    const matchSearch = !search || p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.items.toLowerCase().includes(search.toLowerCase()) ||
      p.dept.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Purchase Indents (PR)
          <small>Material Requisition · ME51N</small>
        </div>
        <div className="fi-lv-actions">
          <input className="fi-search" placeholder="Search PR…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{padding:'6px 12px',border:'1px solid var(--odoo-border)',borderRadius:5,fontSize:12,width:180}} />
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/pr/new')}>
            + New Indent
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:16}}>
        {[
          {cls:'purple', l:'Total PRs',       v:DEMO_PRS.length,                                      s:'This month'},
          {cls:'orange', l:'Pending Quotes',  v:DEMO_PRS.filter(p=>p.status==='pending_quotes').length,s:'Awaiting vendors'},
          {cls:'blue',   l:'CS Pending',      v:DEMO_PRS.filter(p=>p.status==='pending_cs').length,    s:'Enter quotes'},
          {cls:'green',  l:'Approved',        v:DEMO_PRS.filter(p=>p.status==='approved'||p.status==='cs_done').length, s:'Ready for PO'},
          {cls:'green',  l:'PO Raised',       v:DEMO_PRS.filter(p=>p.status==='po_raised').length,     s:'Completed'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {[['all','All'],['draft','Draft'],['pending_quotes','Pending Quotes'],
          ['pending_cs','CS Pending'],['approved','Approved'],['po_raised','PO Raised']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:600,
              cursor:'pointer',border:'1px solid var(--odoo-border)',
              background:filter===k?'var(--odoo-purple)':'#fff',
              color:filter===k?'#fff':'var(--odoo-gray)'}}>
            {l}
          </button>
        ))}
      </div>

      {/* Table */}
      <table className="fi-data-table">
        <thead>
          <tr>
            <th>PR No.</th><th>Date</th><th>Department</th><th>Items</th>
            <th>Priority</th><th>CS Reqd?</th><th>CS No.</th><th>PO No.</th>
            <th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(pr => {
            const st = STATUS[pr.status]
            const pr_p = PRIORITY[pr.priority]
            return (
              <tr key={pr.id}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)',cursor:'pointer'}}
                  onClick={()=>nav('/mm/pr/new')}>{pr.id}</strong></td>
                <td style={{fontSize:12}}>{pr.date}</td>
                <td style={{fontSize:12}}>{pr.dept}</td>
                <td style={{fontSize:12,maxWidth:200}}>{pr.items}</td>
                <td><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,
                  background:pr_p.bg,color:pr_p.color}}>{pr.priority}</span></td>
                <td style={{textAlign:'center'}}>
                  {pr.csReqd
                    ? <span style={{color:'var(--odoo-purple)',fontWeight:700}}>Yes</span>
                    : <span style={{color:'var(--odoo-gray)'}}>— No</span>}
                </td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)'}}>
                  {pr.csNo
                    ? <span style={{cursor:'pointer'}} onClick={()=>nav('/mm/cs/new')}>{pr.csNo}</span>
                    : <span style={{color:'var(--odoo-gray)'}}>—</span>}
                </td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-green)'}}>
                  {pr.poNo || <span style={{color:'var(--odoo-gray)'}}>—</span>}
                </td>
                <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,
                  background:st.bg,color:st.color}}>{st.label}</span></td>
                <td>
                  <div style={{display:'flex',gap:4}}>
                    {(pr.status==='pending_quotes'||pr.status==='pending_cs') && pr.csReqd &&
                      <button className="btn-xs pri" onClick={()=>nav('/mm/cs/new')}
                        style={{background:'var(--odoo-purple)',color:'#fff',whiteSpace:'nowrap'}}>
                         Enter CS
                      </button>}
                    {pr.status==='approved' &&
                      <button className="btn-xs pri" onClick={()=>nav('/mm/po/new')}
                        style={{background:'var(--odoo-green)',color:'#fff',whiteSpace:'nowrap'}}>
                         Raise PO
                      </button>}
                    {pr.status==='draft' &&
                      <button className="btn-xs" onClick={()=>nav('/mm/pr/new')}>
                         Edit
                      </button>}
                    <button className="btn-xs">View</button>
                    <button className="btn-xs" onClick={() => nav('/print/pr')}>Print</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
