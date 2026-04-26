import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })

const PLANNER_ROLES = ['admin','manager','operations','planner','production_manager']
const getRole   = () => { try { return JSON.parse(localStorage.getItem('lnv_user')||'{}').role||'operator' } catch { return 'operator' } }
const isPlanner = () => PLANNER_ROLES.includes(getRole())

const STATUS_STYLE = {
  DRAFT:       ['#E2E3E5','#383d41'],
  RELEASED:    ['#D1ECF1','#0C5460'],
  IN_PROGRESS: ['#FFF3CD','#856404'],
  COMPLETED:   ['#D4EDDA','#155724'],
  CANCELLED:   ['#F8D7DA','#721C24'],
  ON_HOLD:     ['#EDE0EA','#714B67'],
}

const SEED = [
  { id:1, woNo:'WO-2026-0001', itemName:'Brake Bracket — Powder Coat',  itemCode:'BRK-001', plannedQty:500, uom:'Nos', producedQty:320, rejectedQty:8,  status:'IN_PROGRESS', scheduledStart:'2026-04-10', scheduledEnd:'2026-04-12', priority:'High',   workCenter:'BOOTH-01' },
  { id:2, woNo:'WO-2026-0002', itemName:'Engine Mount — Surface Treat.', itemCode:'ENG-006', plannedQty:300, uom:'Nos', producedQty:300, rejectedQty:2,  status:'COMPLETED',   scheduledStart:'2026-04-08', scheduledEnd:'2026-04-09', priority:'Normal', workCenter:'TANK-01'  },
  { id:3, woNo:'WO-2026-0003', itemName:'Gear Housing — Heat Treatment', itemCode:'GER-A2',  plannedQty:150, uom:'Nos', producedQty:0,   rejectedQty:0,  status:'RELEASED',    scheduledStart:'2026-04-13', scheduledEnd:'2026-04-15', priority:'High',   workCenter:'FURNACE-01'},
]

export default function WOList() {
  const nav   = useNavigate()
  const [params] = useSearchParams()
  const planId   = params.get('planId')
  const planner  = isPlanner()

  const [wos,     setWos]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState(planner ? 'All' : 'RELEASED')  // operator sees Released by default
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const query = planId ? `?planId=${planId}` : planner ? '' : '?status=RELEASED,IN_PROGRESS'
      const res   = await fetch(`${BASE_URL}/pp/wo${query}`, { headers: hdr2() })
      const data  = await res.json()
      setWos(data.data?.length ? data.data : SEED)
    } catch { setWos(SEED) }
    finally { setLoading(false) }
  }, [planId, planner])
  useEffect(() => { load() }, [load])

  const release = async (id, e) => {
    e.stopPropagation()
    try {
      const res  = await fetch(`${BASE_URL}/pp/wo/${id}/release`, { method:'POST', headers: hdr() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('WO released to production floor!')
      load()
    } catch (e) { toast.error(e.message) }
  }

  // Planner sees all statuses; operator only sees active
  const PLANNER_STATUSES  = ['All','DRAFT','RELEASED','IN_PROGRESS','COMPLETED','CANCELLED','ON_HOLD']
  const OPERATOR_STATUSES = ['RELEASED','IN_PROGRESS']
  const STATUSES = planner ? PLANNER_STATUSES : OPERATOR_STATUSES

  const shown = wos.filter(w => {
    const ms = filter === 'All' || w.status === filter
    const mt = !search ||
      w.woNo?.toLowerCase().includes(search.toLowerCase()) ||
      w.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      w.itemCode?.toLowerCase().includes(search.toLowerCase())
    return ms && mt
  })

  const inProg  = wos.filter(w=>w.status==='IN_PROGRESS').length
  const released= wos.filter(w=>w.status==='RELEASED').length
  const done    = wos.filter(w=>w.status==='COMPLETED').length
  const draft   = wos.filter(w=>w.status==='DRAFT').length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          {planner ? 'Work Order List' : 'Work Order Queue'}
          <small>{planner ? ' CO03 · All Production Orders' : ' Released WOs — Start Production Entry'}</small>
        </div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="WO No. / Item / Code..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          {/* Planner: back to plan to create new WO */}
          {planner && (
            <button className="btn btn-p sd-bsm" onClick={()=>nav('/pp/plan')}>
              + Go to Production Plan
            </button>
          )}
          {/* Operator: quick jump to entry */}
          {!planner && (
            <button className="btn btn-p sd-bsm" onClick={()=>nav('/pp/entry')}>
              Production Entry →
            </button>
          )}
        </div>
      </div>

      {/* Info strip for operator */}
      {!planner && (
        <div style={{background:'#D1ECF1',border:'1px solid #B8DAFF',borderRadius:6,padding:'8px 14px',marginBottom:12,fontSize:12,color:'#0C5460',display:'flex',gap:8,alignItems:'center'}}>
          <strong>Production Queue</strong> — Select a Released WO below and click Production Entry to start.
          Work orders are created by the planning team.
        </div>
      )}

      {/* KPI strip — planner only */}
      {planner && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
          {[
            ['Draft',      draft,    '#E2E3E5','#383d41'],
            ['Released',   released, '#D1ECF1','#0C5460'],
            ['In Progress',inProg,   '#FFF3CD','#856404'],
            ['Completed',  done,     '#D4EDDA','#155724'],
          ].map(([l,v,bg,c])=>(
            <div key={l} style={{background:bg,borderRadius:8,padding:'10px 16px',textAlign:'center',cursor:'pointer'}}
              onClick={()=>setFilter(l.toUpperCase().replace(' ','_'))}>
              <div style={{fontSize:22,fontWeight:800,color:c,fontFamily:'DM Mono,monospace'}}>{v}</div>
              <div style={{fontSize:11,fontWeight:700,color:c,opacity:.8}}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Status chips */}
      <div className="pp-chips">
        {STATUSES.map(s=>(
          <div key={s} className={`pp-chip${filter===s?' on':''}`} onClick={()=>setFilter(s)}>
            {s.replace('_',' ')} <span>{s==='All'?wos.length:wos.filter(w=>w.status===s).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>WO No.</th>
          <th>Item</th>
          <th style={{textAlign:'right'}}>Planned</th>
          <th style={{textAlign:'right'}}>Produced</th>
          <th style={{textAlign:'center'}}>Progress</th>
          <th>Priority</th>
          <th>Schedule</th>
          <th>Status</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          {loading
            ? <tr><td colSpan={9} style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading...</td></tr>
            : shown.length === 0
            ? <tr><td colSpan={9} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                {planner
                  ? <span>No work orders found. <button className="btn-xs pri" onClick={()=>nav('/pp/plan')}>Go to Production Plan to create WOs →</button></span>
                  : 'No released work orders available. Wait for planning team to release WOs.'
                }
              </td></tr>
            : shown.map(w => {
              const [sbg,stx] = STATUS_STYLE[w.status] || ['#EEE','#333']
              const pct = parseFloat(w.plannedQty) > 0
                ? Math.min(100, Math.round((parseFloat(w.producedQty||0)/parseFloat(w.plannedQty))*100))
                : 0
              const isActive = w.status === 'RELEASED' || w.status === 'IN_PROGRESS'

              return (
                <tr key={w.id}
                  style={{ cursor: isActive ? 'pointer' : 'default', background: isActive && !planner ? '#FDFBFD' : 'inherit' }}
                  onClick={() => isActive && !planner && nav(`/pp/entry?woId=${w.id}`)}>
                  <td>
                    <strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{w.woNo}</strong>
                    {isActive && !planner && <div style={{fontSize:9,color:'#28A745',fontWeight:700}}>→ Click to start entry</div>}
                  </td>
                  <td style={{fontWeight:600,maxWidth:200,fontSize:12}}>
                    {w.itemName}
                    {w.itemCode && <div style={{fontSize:10,color:'#714B67',fontFamily:'DM Mono,monospace'}}>{w.itemCode}</div>}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>
                    {parseFloat(w.plannedQty||0).toLocaleString()}
                    <span style={{fontSize:10,color:'#6C757D',marginLeft:3}}>{w.uom}</span>
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:parseFloat(w.producedQty||0)>0?'#155724':'#6C757D'}}>
                    {parseFloat(w.producedQty||0).toLocaleString()}
                  </td>
                  <td style={{textAlign:'center',minWidth:110}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
                      <div style={{width:60,height:6,background:'#E0D5E0',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:pct===100?'#28A745':pct>50?'#FFC107':'#714B67',borderRadius:3,transition:'width .3s'}}/>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:'#6C757D'}}>{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{fontWeight:700,fontSize:12,
                      color:w.priority==='Critical'?'#721C24':w.priority==='High'?'#DC3545':'#6C757D'}}>
                      {w.priority}
                    </span>
                  </td>
                  <td style={{fontSize:11,color:'#6C757D'}}>
                    {w.scheduledStart ? new Date(w.scheduledStart).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—'}
                    {w.scheduledEnd   ? ` → ${new Date(w.scheduledEnd).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}` : ''}
                  </td>
                  <td>
                    <span style={{background:sbg,color:stx,padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                      {w.status.replace('_',' ')}
                    </span>
                  </td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{display:'flex',gap:4}}>
                      {/* Planner actions */}
                      {planner && w.status === 'DRAFT' && (
                        <button className="btn-xs pri" onClick={e=>release(w.id,e)}>Release</button>
                      )}
                      {/* Operator action */}
                      {!planner && isActive && (
                        <button className="btn-xs pri" onClick={()=>nav(`/pp/entry?woId=${w.id}`)}>
                          Start Entry
                        </button>
                      )}
                      {/* View detail — both */}
                      <button className="btn-xs" onClick={()=>nav(`/pp/wo/${w.id}`)}>View</button>
                    </div>
                  </td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </div>
  )
}
