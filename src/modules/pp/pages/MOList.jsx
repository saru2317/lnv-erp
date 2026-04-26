// ════════════════════════════════════════════════════════════
// MOList.jsx — Manufacturing Order list (Odoo MO concept)
// ════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })

const STATUS_STYLE = {
  DRAFT:       ['#E2E3E5','#383d41'],
  CONFIRMED:   ['#D1ECF1','#0C5460'],
  IN_PROGRESS: ['#FFF3CD','#856404'],
  DONE:        ['#D4EDDA','#155724'],
  CLOSED:      ['#EDE0EA','#714B67'],
  CANCELLED:   ['#F8D7DA','#721C24'],
}

const SEED = [
  { id:1, moNo:'MO-2026-0001', soNo:'SO-2026-042', customerName:'Kovai Auto Components', itemName:'Brake Bracket', itemCode:'BRK-001', plannedQty:500, uom:'Nos', producedQty:320, status:'IN_PROGRESS', dueDate:'2026-04-18', priority:'High',   workOrders:[{woNo:'WO-2026-0001',status:'IN_PROGRESS'},{woNo:'WO-2026-0002',status:'COMPLETED'}] },
  { id:2, moNo:'MO-2026-0002', soNo:'SO-2026-043', customerName:'Apex Auto Parts',       itemName:'Engine Mount',  itemCode:'ENG-006', plannedQty:300, uom:'Nos', producedQty:300, status:'DONE',        dueDate:'2026-04-15', priority:'Normal', workOrders:[{woNo:'WO-2026-0003',status:'COMPLETED'}] },
  { id:3, moNo:'MO-2026-0003', soNo:'SO-2026-044', customerName:'Delta Engineering',     itemName:'Gear Housing',  itemCode:'GER-A2',  plannedQty:150, uom:'Nos', producedQty:0,   status:'CONFIRMED',   dueDate:'2026-04-22', priority:'High',   workOrders:[] },
  { id:4, moNo:'MO-2026-0004', soNo:'',            customerName:'—',                     itemName:'PP Cap 20ml',   itemCode:'CAP-20ML',plannedQty:10000,uom:'Nos',producedQty:0,   status:'DRAFT',       dueDate:'2026-04-25', priority:'Normal', workOrders:[] },
]

export function MOList() {
  const nav = useNavigate()
  const [mos,     setMos]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('All')
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/pp/mo`, { headers: hdr2() })
      const data = await res.json()
      setMos(data.data?.length ? data.data : SEED)
    } catch { setMos(SEED) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const confirm = async (id, e) => {
    e.stopPropagation()
    try {
      const res  = await fetch(`${BASE_URL}/pp/mo/${id}/confirm`, { method:'POST', headers: hdr() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      load()
    } catch (e) { toast.error(e.message) }
  }

  const STATUSES = ['All','DRAFT','CONFIRMED','IN_PROGRESS','DONE','CLOSED','CANCELLED']
  const shown    = mos.filter(m => {
    const ms = filter === 'All' || m.status === filter
    const mt = !search || m.moNo?.toLowerCase().includes(search.toLowerCase()) ||
      m.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      m.soNo?.toLowerCase().includes(search.toLowerCase()) ||
      m.customerName?.toLowerCase().includes(search.toLowerCase())
    return ms && mt
  })

  const inProg  = mos.filter(m=>m.status==='IN_PROGRESS').length
  const done    = mos.filter(m=>m.status==='DONE').length
  const draft   = mos.filter(m=>m.status==='DRAFT').length
  const conf    = mos.filter(m=>m.status==='CONFIRMED').length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Manufacturing Orders <small>MO · Odoo-style Production</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="MO No / Item / SO / Customer..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:260}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/pp/mo/new')}>+ New MO</button>
        </div>
      </div>

      {/* MO concept strip */}
      <div style={{background:'#D1ECF1',border:'1px solid #B8DAFF',borderRadius:6,padding:'8px 14px',marginBottom:12,fontSize:12,color:'#0C5460',display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
        <strong>MO Flow:</strong>
        {['SO / Manual','→ MO Created','→ Confirm MO','→ WOs Auto-Created','→ Production Entry','→ MO Done','→ FG to Stock'].map((s,i)=>(
          <span key={i} style={{background:'rgba(255,255,255,.6)',padding:'2px 8px',borderRadius:4,fontWeight:600}}>{s}</span>
        ))}
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
        {[['Draft',       draft, '#E2E3E5','#383d41'],
          ['Confirmed',   conf,  '#D1ECF1','#0C5460'],
          ['In Progress', inProg,'#FFF3CD','#856404'],
          ['Done',        done,  '#D4EDDA','#155724']
        ].map(([l,v,bg,c])=>(
          <div key={l} style={{background:bg,borderRadius:8,padding:'10px 16px',textAlign:'center',cursor:'pointer'}} onClick={()=>setFilter(l.toUpperCase().replace(' ','_'))}>
            <div style={{fontSize:22,fontWeight:800,color:c,fontFamily:'DM Mono,monospace'}}>{v}</div>
            <div style={{fontSize:11,fontWeight:700,color:c,opacity:.8}}>{l}</div>
          </div>
        ))}
      </div>

      <div className="pp-chips">
        {STATUSES.map(s=>(
          <div key={s} className={`pp-chip${filter===s?' on':''}`} onClick={()=>setFilter(s)}>
            {s.replace('_',' ')} <span>{s==='All'?mos.length:mos.filter(m=>m.status===s).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>MO No.</th><th>SO Ref</th><th>Customer</th><th>Item</th>
          <th style={{textAlign:'right'}}>Qty</th>
          <th style={{textAlign:'center'}}>Progress</th>
          <th>WOs</th><th>Due Date</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading
            ? <tr><td colSpan={10} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
            : shown.length===0
            ? <tr><td colSpan={10} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No manufacturing orders. <button className="btn-xs pri" onClick={()=>nav('/pp/mo/new')}>Create MO →</button>
              </td></tr>
            : shown.map(m=>{
              const [sbg,stx] = STATUS_STYLE[m.status] || ['#EEE','#333']
              const pct = m.plannedQty > 0 ? Math.min(100,Math.round((parseFloat(m.producedQty||0)/parseFloat(m.plannedQty))*100)) : 0
              const wos = m.workOrders || []
              return (
                <tr key={m.id} style={{cursor:'pointer'}} onClick={()=>nav(`/pp/mo/${m.id}`)}>
                  <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{m.moNo}</strong></td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-orange)'}}>{m.soNo||'—'}</td>
                  <td style={{fontSize:12}}>{m.customerName||'—'}</td>
                  <td style={{fontWeight:600,fontSize:12,maxWidth:180}}>
                    {m.itemName}
                    {m.itemCode&&<div style={{fontSize:10,color:'#714B67',fontFamily:'DM Mono,monospace'}}>{m.itemCode}</div>}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>
                    {parseFloat(m.plannedQty||0).toLocaleString()} <span style={{fontSize:10,color:'#6C757D'}}>{m.uom}</span>
                  </td>
                  <td style={{textAlign:'center',minWidth:110}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
                      <div style={{width:60,height:6,background:'#E0D5E0',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:pct===100?'#28A745':pct>50?'#FFC107':'#714B67',borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:'#6C757D'}}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{textAlign:'center'}}>
                    {wos.length===0
                      ? <span style={{fontSize:11,color:'#CCC'}}>—</span>
                      : <span style={{fontSize:11,color:'#714B67',fontWeight:700}}>{wos.length} WO{wos.length>1?'s':''}</span>
                    }
                  </td>
                  <td style={{fontSize:11,color:m.dueDate&&new Date(m.dueDate)<new Date()?'#DC3545':'#6C757D',fontWeight:m.dueDate&&new Date(m.dueDate)<new Date()?700:400}}>
                    {m.dueDate?new Date(m.dueDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}
                  </td>
                  <td>
                    <span style={{background:sbg,color:stx,padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                      {m.status.replace('_',' ')}
                    </span>
                  </td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{display:'flex',gap:4}}>
                      {m.status==='DRAFT' && (
                        <button className="btn-xs pri" onClick={e=>confirm(m.id,e)}>Confirm MO</button>
                      )}
                      {(m.status==='CONFIRMED'||m.status==='IN_PROGRESS') && (
                        <button className="btn-xs pri" onClick={e=>{e.stopPropagation();nav('/pp/entry')}}>Production</button>
                      )}
                      <button className="btn-xs" onClick={e=>{e.stopPropagation();nav(`/pp/mo/${m.id}`)}}>View</button>
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

export default MOList
