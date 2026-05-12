import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${getToken()}` })

const SEED = [
  { id:1, routingNo:'RT-2026-0001', itemName:'PP Cap 20ml',         itemCode:'CAP-20ML', isActive:true, operations:[
    {opNo:'10',processName:'Material Drying',   wcId:'WC-001',setupTime:30,machineTime:120},
    {opNo:'20',processName:'Mould Setup',       wcId:'WC-002',setupTime:45,machineTime:30 },
    {opNo:'30',processName:'Trial Shot',        wcId:'WC-003',setupTime:0, machineTime:30 },
    {opNo:'40',processName:'Production Run',    wcId:'WC-004',setupTime:0, machineTime:480},
    {opNo:'50',processName:'Inline QC',         wcId:'WC-007',setupTime:0, machineTime:60 },
    {opNo:'60',processName:'Degating / Trimming',wcId:'WC-008',setupTime:0,machineTime:45 },
    {opNo:'70',processName:'Final Inspection',  wcId:'WC-009',setupTime:0, machineTime:30 },
    {opNo:'80',processName:'Packing',           wcId:'WC-010',setupTime:0, machineTime:60 },
  ]},
  { id:2, routingNo:'RT-2026-0002', itemName:'HDPE Container 500ml',itemCode:'CTN-500ML', isActive:true, operations:[
    {opNo:'10',processName:'Material Drying',   wcId:'WC-001',setupTime:45,machineTime:150},
    {opNo:'20',processName:'Mould Setup',       wcId:'WC-005',setupTime:60,machineTime:45 },
    {opNo:'30',processName:'Trial Shot',        wcId:'WC-005',setupTime:0, machineTime:30 },
    {opNo:'40',processName:'Production Run',    wcId:'WC-005',setupTime:0, machineTime:480},
    {opNo:'50',processName:'Inline QC',         wcId:'WC-007',setupTime:0, machineTime:60 },
    {opNo:'60',processName:'Degating / Trimming',wcId:'WC-008',setupTime:0,machineTime:60 },
    {opNo:'70',processName:'Final Inspection',  wcId:'WC-009',setupTime:0, machineTime:30 },
    {opNo:'80',processName:'Packing',           wcId:'WC-010',setupTime:0, machineTime:60 },
  ]},
  { id:3, routingNo:'RT-2026-0003', itemName:'ABS Housing Cover',   itemCode:'HSG-ABS01', isActive:true, operations:[
    {opNo:'10',processName:'Material Drying',   wcId:'WC-001',setupTime:30,machineTime:90 },
    {opNo:'20',processName:'Mould Setup',       wcId:'WC-002',setupTime:60,machineTime:30 },
    {opNo:'30',processName:'Production Run',    wcId:'WC-002',setupTime:0, machineTime:360},
    {opNo:'40',processName:'Insert Loading',    wcId:'WC-002',setupTime:0, machineTime:120},
    {opNo:'50',processName:'Inline QC',         wcId:'WC-007',setupTime:0, machineTime:45 },
    {opNo:'60',processName:'Final Inspection',  wcId:'WC-009',setupTime:0, machineTime:30 },
    {opNo:'70',processName:'Packing',           wcId:'WC-010',setupTime:0, machineTime:45 },
  ]},
]

export default function RoutingList() {
  const nav = useNavigate()
  const [routings, setRoutings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/pp/routing-master`, { headers: hdr2() })
      const data = await res.json()
      setRoutings(data.data?.length ? data.data : SEED)
    } catch { setRoutings(SEED) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const deleteRouting = async (id, routingNo) => {
    if (!confirm(`Delete Routing ${routingNo}? This cannot be undone.`)) return
    try {
      await fetch(`${BASE_URL}/pp/routing-master/${id}`, { method:'DELETE', headers: hdr2() })
      toast.success(`Routing ${routingNo} deleted`)
      load()
    } catch { toast.error('Delete failed') }
  }

  const shown = routings.filter(r =>
    !search || r.routingNo?.toLowerCase().includes(search.toLowerCase()) ||
    r.itemName?.toLowerCase().includes(search.toLowerCase()) || r.itemCode?.toLowerCase().includes(search.toLowerCase())
  )

  // Total std time per routing
  const totalTime = ops => {
    const mins = (ops||[]).reduce((a, o) => a + parseFloat(o.setupTime||0) + parseFloat(o.machineTime||0), 0)
    return mins >= 60 ? `${(mins/60).toFixed(1)} hrs` : `${mins} min`
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Routing List <small>CA03 · Production Routing Master</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="Search routing / item..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/pp/routing/new')}>+ Create Routing (CA01)</button>
        </div>
      </div>

      {/* Info */}
      <div style={{background:'#EDE0EA',borderRadius:6,padding:'8px 14px',marginBottom:12,fontSize:12,color:'#714B67'}}>
        <strong>Routing</strong> defines the sequence of operations to manufacture a product — work center, setup time, machine time per step.
        Routings are linked to items and used to create Work Orders.
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Routing No.</th><th>Item / Product</th><th>Code</th>
          <th style={{textAlign:'center'}}>Operations</th>
          <th style={{textAlign:'center'}}>Std Time</th>
          <th style={{textAlign:'center'}}>Status</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading...</td></tr>
          ) : shown.length === 0 ? (
            <tr><td colSpan={7} style={{padding:40,textAlign:'center'}}>
              <div style={{fontSize:32,marginBottom:8}}>🔀</div>
              <div style={{fontWeight:700,color:'#333'}}>No routings yet</div>
              <div style={{fontSize:12,color:'#6C757D',marginTop:4}}>Create routings to define production steps per item</div>
              <button className="btn btn-p sd-bsm" style={{marginTop:12}} onClick={()=>nav('/pp/routing/new')}>Create First Routing</button>
            </td></tr>
          ) : shown.map(r => (
            <React.Fragment key={r.id}>
              <tr style={{cursor:'pointer'}} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{r.routingNo}</strong></td>
                <td style={{fontWeight:600}}>{r.itemName}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#714B67'}}>{r.itemCode||'—'}</td>
                <td style={{textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700}}>
                  {(r.operations||[]).length} ops
                </td>
                <td style={{textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:600,color:'var(--odoo-blue)'}}>
                  {totalTime(r.operations)}
                </td>
                <td style={{textAlign:'center'}}>
                  <span style={{background:r.isActive?'#D4EDDA':'#F8D7DA',color:r.isActive?'#155724':'#721C24',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                    {r.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td onClick={e=>e.stopPropagation()}>
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn-xs" onClick={()=>nav(`/pp/routing-master`)}>Edit</button>
                    <button className="btn-xs" onClick={()=>deleteRouting(r.id, r.routingNo)}
                      style={{background:'#F8D7DA',color:'#721C24',border:'1px solid #F5C6CB'}}>
                      Del
                    </button>
                    <span style={{color:'#999',fontSize:12,alignSelf:'center'}}>{expanded===r.id?'▲':'▼'}</span>
                  </div>
                </td>
              </tr>

              {/* Expanded operations */}
              {expanded === r.id && (
                <tr>
                  <td colSpan={7} style={{padding:'0 0 8px 0',background:'#F8F4F8'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead>
                        <tr style={{background:'#EDE0EA'}}>
                          <th style={{padding:'5px 14px',textAlign:'center',fontWeight:700,color:'#714B67',width:60}}>Op#</th>
                          <th style={{padding:'5px 14px',textAlign:'left',fontWeight:700,color:'#714B67'}}>Operation / Process</th>
                          <th style={{padding:'5px 14px',textAlign:'center',fontWeight:700,color:'#714B67'}}>Work Center</th>
                          <th style={{padding:'5px 14px',textAlign:'center',fontWeight:700,color:'#714B67'}}>Setup (min)</th>
                          <th style={{padding:'5px 14px',textAlign:'center',fontWeight:700,color:'#714B67'}}>Machine (min)</th>
                          <th style={{padding:'5px 14px',textAlign:'center',fontWeight:700,color:'#714B67'}}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(r.operations||[]).map((op, i) => (
                          <tr key={i} style={{borderBottom:'1px solid #E0D5E0',background:'#fff'}}>
                            <td style={{padding:'6px 14px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:800,color:'#714B67'}}>{op.opNo}</td>
                            <td style={{padding:'6px 14px',fontWeight:600}}>{op.processName}</td>
                            <td style={{padding:'6px 14px',textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{op.wcId||op.workCenter||'—'}</td>
                            <td style={{padding:'6px 14px',textAlign:'center',fontFamily:'DM Mono,monospace'}}>{op.setupTime||0}</td>
                            <td style={{padding:'6px 14px',textAlign:'center',fontFamily:'DM Mono,monospace'}}>{op.machineTime||op.laborTime||0}</td>
                            <td style={{padding:'6px 14px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>
                              {parseFloat(op.setupTime||0)+parseFloat(op.machineTime||op.laborTime||0)} min
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
