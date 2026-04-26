import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const LOTS = [
  {lot:'QIL-048',date:'28 Feb',source:'PP',wo:'WO-2025-019',mat:'Ring Yarn (30s)',qty:400,tested:400,pass:394,fail:6,yield:98.5,ncr:'—',sb:'badge-pass',sl:'Pass'},
  {lot:'QIL-047',date:'27 Feb',source:'PP',wo:'WO-2025-018',mat:'OE Yarn (12s)',qty:588,tested:588,pass:580,fail:8,yield:98.6,ncr:'NCR-018',sb:'badge-pass',sl:'Pass'},
  {lot:'QIL-046',date:'25 Feb',source:'PP',wo:'WO-2025-016',mat:'Ring Yarn (40s)',qty:384,tested:384,pass:368,fail:16,yield:95.8,ncr:'NCR-017',sb:'badge-review',sl:'Review'},
  {lot:'QIL-045',date:'23 Feb',source:'PP',wo:'WO-2025-015',mat:'Cotton Sliver',qty:792,tested:792,pass:792,fail:0,yield:100,ncr:'—',sb:'badge-pass',sl:'Pass'},
  {lot:'QIL-044',date:'20 Feb',source:'MM',wo:'GRN-2025-018',mat:'Cotton Bale (RM)',qty:500,tested:500,pass:500,fail:0,yield:100,ncr:'—',sb:'badge-pass',sl:'Pass'},
  {lot:'QIL-043',date:'18 Feb',source:'MM',wo:'GRN-2025-017',mat:'Solvent Chemical',qty:100,tested:100,pass:80,fail:20,yield:80.0,ncr:'NCR-016',sb:'badge-fail',sl:'Fail'},
  {lot:'QIL-042',date:'16 Feb',source:'PP',wo:'WO-2025-014',mat:'Ring Yarn (30s)',qty:400,tested:400,pass:396,fail:4,yield:99.0,ncr:'—',sb:'badge-pass',sl:'Pass'},
  {lot:'QIL-041',date:'14 Feb',source:'SD',wo:'DO-2025-022',mat:'Ring Yarn (30s) — Pre-shipment',qty:200,tested:200,pass:200,fail:0,yield:100,ncr:'—',sb:'badge-pass',sl:'Pass'},
]

const CHIPS = ['All','Pass','Review','Fail']
const SOURCE = ['All Sources','PP — Production','MM — Incoming','SD — Pre-shipment']

export default function InspectionList() {
  const nav = useNavigate()
  const [chip, setChip] = useState('All')
  const [src,  setSrc]  = useState('All Sources')
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/qm/inspection`,
        { headers:{ Authorization:`Bearer ${getToken()}` }})
      const data = await res.json()
      setLots(data.data||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{ fetch_() },[])

  const filtered = lots.filter(l => {
    const matchChip = chip==='All' ||
      l.result?.toLowerCase()===chip.toLowerCase()
    const matchSrc  = src==='All Sources' ||
      l.source===src.split(' ')[0]
    const matchSearch = !search ||
      l.lotNo?.toLowerCase().includes(search.toLowerCase()) ||
      l.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      l.refNo?.toLowerCase().includes(search.toLowerCase())
    return matchChip && matchSrc && matchSearch
  })

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Inspection Lots <small>QA03 · Inspection Register</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/inspection/new')}>New Inspection</button>
        </div>
      </div>

      <div className="pp-chips">
        {CHIPS.map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={() => setChip(c)}>{c}
            <span>{c==='All'?LOTS.length:LOTS.filter(l=>l.sl===c).length}</span>
          </div>
        ))}
      </div>

      <div className="fi-filter-bar">
        <div className="fi-filter-search">
          <input placeholder="Search lot, material, WO..."
            value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="fi-filter-select" onChange={e=>setSrc(e.target.value)}>
          {SOURCE.map(s=><option key={s}>{s}</option>)}
        </select>
        <input type="date" className="fi-filter-select" defaultValue="2025-02-01"/>
        <input type="date" className="fi-filter-select" defaultValue="2025-02-28"/>
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',
          background:'#fff',borderRadius:8,border:'2px dashed #E0D5E0'}}>
          <div style={{fontSize:32}}>🔬</div>
          <div style={{fontWeight:700,marginTop:8}}>No inspection lots</div>
          <button className="btn btn-p sd-bsm"
            style={{marginTop:12}} onClick={()=>nav('/qm/inspection/new')}>
            + New Inspection
          </button>
        </div>
      ) : (
      <table className="fi-data-table">
        <thead><tr>
          <th>Lot No.</th><th>Date</th><th>Source</th><th>Ref</th>
          <th>Material</th><th>Qty</th><th>Pass</th><th>Fail</th>
          <th>Yield %</th><th>NCR</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(l=>{
            const yld = parseFloat(l.yieldPct||0)
            const yColor = yld>=98?'var(--odoo-green)':yld>=95?'var(--odoo-orange)':'var(--odoo-red)'
            const rBadge = l.result==='PASS'?'badge-pass':l.result==='FAIL'?'badge-fail':'badge-review'
            return (
            <tr key={l.id} style={{cursor:'pointer'}}
              onClick={()=>nav(`/qm/inspection/${l.id}`)}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{l.lotNo}</strong></td>
              <td>{new Date(l.inspDate||l.createdAt).toLocaleDateString('en-IN')}</td>
              <td><span style={{background:'#EDE0EA',color:'var(--odoo-purple)',padding:'2px 7px',borderRadius:'4px',fontSize:'11px',fontWeight:'700'}}>{l.source}</span></td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-gray)'}}>{l.refNo||'—'}</td>
              <td><strong>{l.itemName}</strong></td>
              <td>{parseFloat(l.lotQty||0)} {l.unit}</td>
              <td style={{color:'var(--odoo-green)',fontWeight:'600'}}>{parseFloat(l.passQty||0)}</td>
              <td style={{color:parseFloat(l.failQty||0)>0?'var(--odoo-red)':'var(--odoo-gray)',fontWeight:parseFloat(l.failQty||0)>0?'700':'400'}}>{parseFloat(l.failQty||0)||'—'}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                  <div className="yield-bar" style={{width:'50px'}}>
                    <div className="yield-fill" style={{width:`${yld}%`,background:yColor}}></div>
                  </div>
                  <span style={{fontSize:'11px',fontWeight:'700',color:yColor}}>{yld.toFixed(1)}%</span>
                </div>
              </td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:l.ncrNo?'var(--odoo-red)':'var(--odoo-gray)',fontWeight:l.ncrNo?'700':'400'}}>{l.ncrNo||'—'}</td>
              <td><span className={`badge ${rBadge}`}>{l.result}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',gap:'4px'}}>
                  <button className="btn-xs" onClick={()=>nav(`/qm/inspection/${l.id}`)}>View</button>
                  {l.result==='REVIEW'&&<button className="btn-xs pri" onClick={()=>nav('/qm/ncr/new')}>NCR</button>}
                  {l.result==='PASS'&&<button className="btn-xs" onClick={()=>nav('/qm/certificates')}>Cert</button>}
                </div>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
      )}
    </div>
  )
}
