import React, { useState } from 'react'

const ASSETS = [
  { code:'FA-001', desc:'Ring Frame Machine #1 (SPG-01)', cat:'Plant & Machinery',  dept:'Production',  date:'01 Apr 2019', gross:4200000, depr:2100000, net:2100000, method:'SLM 10%', status:'active',  loc:'Ring Floor',     assigned:'—' },
  { code:'FA-002', desc:'Open End Spinner (OE-01)',        cat:'Plant & Machinery',  dept:'Production',  date:'15 Jul 2020', gross:2800000, depr:1120000, net:1680000, method:'SLM 10%', status:'active',  loc:'OE Floor',       assigned:'—' },
  { code:'FA-003', desc:'Dell Server — PowerEdge R740',    cat:'IT Equipment',       dept:'IT',          date:'20 Jun 2022', gross:180000,  depr:120000,  net:60000,   method:'WDV 33%', status:'low_val', loc:'Server Room',     assigned:'Karthik M.' },
  { code:'FA-004', desc:'Honda Activa (Office Bike)',       cat:'Vehicles',           dept:'Admin',       date:'10 Jan 2021', gross:95000,   depr:38000,   net:57000,   method:'WDV 15%', status:'active',  loc:'Vehicle Bay',    assigned:'Dinesh R.' },
  { code:'FA-005', desc:'Conference Room AC — 2TR',         cat:'Electrical',         dept:'Admin',       date:'05 Mar 2023', gross:75000,   depr:11250,   net:63750,   method:'SLM 15%', status:'active',  loc:'Conf. Room',      assigned:'—' },
  { code:'FA-006', desc:'Weighbridge — 50T Electronic',     cat:'Plant & Machinery',  dept:'Stores',      date:'01 Oct 2018', gross:1200000, depr:720000,  net:480000,  method:'SLM 10%', status:'active',  loc:'Main Gate',      assigned:'—' },
  { code:'FA-007', desc:'Laptop — Dell Latitude 5520',      cat:'IT Equipment',       dept:'Finance',     date:'12 Sep 2023', gross:85000,   depr:28050,   net:56950,   method:'WDV 33%', status:'active',  loc:'Finance Office', assigned:'Priya S.' },
]

const ST = { active:{label:'Active',bg:'#D4EDDA',color:'#155724'}, low_val:{label:'Low Value',bg:'#FFF3CD',color:'#856404'}, disposed:{label:'Disposed',bg:'#E2E3E5',color:'#383D41'}, maintenance:{label:'In Maintenance',bg:'#F8D7DA',color:'#721C24'} }
const fmt = n => '₹' + n.toLocaleString('en-IN')

import { useNavigate } from 'react-router-dom'
export default function AssetRegister() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [cat, setCat]       = useState('all')
  const filtered = ASSETS.filter(a =>
    (cat==='all'||a.cat===cat) &&
    (!search || a.desc.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase()))
  )
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Asset Register <small>Fixed Asset Ledger (FA)</small></div>
        <div className="fi-lv-actions">
          <input placeholder="Search assets…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{padding:'6px 12px',border:'1px solid var(--odoo-border)',borderRadius:5,fontSize:12,width:180}}/>
          <select value={cat} onChange={e=>setCat(e.target.value)} className="fi-filter-select">
            <option value="all">All Categories</option>
            {[...new Set(ASSETS.map(a=>a.cat))].map(c=><option key={c}>{c}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/print/invoice')}>Print Register</button>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm">+ Add Asset</button>
        </div>
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Code</th><th>Description</th><th>Category</th><th>Dept</th><th>Purchase Date</th><th>Gross Value</th><th>Acc. Depr.</th><th>Net Value</th><th>Method</th><th>Location</th><th>Assigned To</th><th>Status</th></tr></thead>
        <tbody>
          {filtered.map(a=>{
            const st = ST[a.status]
            const pct = ((a.depr/a.gross)*100).toFixed(0)
            return (<tr key={a.code}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{a.code}</strong></td>
              <td style={{fontSize:12,fontWeight:600,maxWidth:200}}>{a.desc}</td>
              <td style={{fontSize:11}}>{a.cat}</td>
              <td style={{fontSize:11}}>{a.dept}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{a.date}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:12,textAlign:'right'}}>{fmt(a.gross)}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:12,textAlign:'right',color:'var(--odoo-red)'}}>{fmt(a.depr)}</td>
              <td>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:a.net<50000?'var(--odoo-orange)':'var(--odoo-green)',textAlign:'right'}}>{fmt(a.net)}</div>
                <div style={{height:3,background:'var(--odoo-border)',borderRadius:2,marginTop:2}}>
                  <div style={{height:'100%',borderRadius:2,background:parseInt(pct)>80?'var(--odoo-red)':'var(--odoo-green)',width:`${pct}%`}}/>
                </div>
              </td>
              <td style={{fontSize:11,color:'var(--odoo-gray)'}}>{a.method}</td>
              <td style={{fontSize:11}}>{a.loc}</td>
              <td style={{fontSize:11}}>{a.assigned}</td>
              <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span></td>
            </tr>)
          })}
        </tbody>
      </table>
    </div>
  )
}
