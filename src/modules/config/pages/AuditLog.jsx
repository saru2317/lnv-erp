import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const ACTION_STYLE = {
  LOGIN:   { bg:'#E3F2FD', c:'#1565C0', icon:'🔑' },
  CREATE:  { bg:'#E8F5E9', c:'#2E7D32', icon:'➕' },
  UPDATE:  { bg:'#FFF3E0', c:'#E65100', icon:'✏️' },
  DELETE:  { bg:'#FFEBEE', c:'#C62828', icon:'🗑️' },
  APPROVE: { bg:'#F3E5F5', c:'#6A1B9A', icon:'✅' },
  PRINT:   { bg:'#E0F2F1', c:'#00695C', icon:'🖨️' },
}
const MOD_COLOR = { SD:'#117A65', MM:'#1A5276', PP:'#714B67', FI:'#196F3D', QM:'#C0392B', PM:'#784212', HCM:'#6C3483', WM:'#1F618D', Auth:'#555' }

export default function AuditLog() {
  const [entries,  setEntries]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [moduleF,  setModuleF]  = useState('')
  const [actionF,  setActionF]  = useState('')
  const [search,   setSearch]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [page,     setPage]     = useState(1)
  const PER_PAGE = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit:200 })
      if (moduleF) params.append('module', moduleF)
      if (actionF) params.append('action', actionF)
      if (search)  params.append('search', search)
      if (dateFrom)params.append('from', dateFrom)
      if (dateTo)  params.append('to', dateTo)
      const r = await fetch(`${BASE_URL}/audit?${params}`, { headers: hdr2() })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setEntries(d.data || [])
      setPage(1)
    } catch(e) { toast.error('Failed to load audit log: ' + e.message) }
    finally { setLoading(false) }
  }, [moduleF, actionF, search, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const modules = ['','SD','MM','FI','PP','QM','WM','Auth']
  const actions = ['','LOGIN','CREATE','UPDATE','DELETE','APPROVE']

  // Stats
  const stats = {
    total:   entries.length,
    creates: entries.filter(e=>e.action==='CREATE').length,
    updates: entries.filter(e=>e.action==='UPDATE').length,
    logins:  entries.filter(e=>e.action==='LOGIN').length,
    deletes: entries.filter(e=>e.action==='DELETE').length,
  }

  const paginated = entries.slice((page-1)*PER_PAGE, page*PER_PAGE)
  const totalPages = Math.ceil(entries.length / PER_PAGE)

  const exportCSV = () => {
    const header = 'ID,Timestamp,User,Role,Module,Action,Document,Change\n'
    const rows = entries.map(e =>
      `${e.id},"${e.ts}","${e.user}","${e.role}","${e.module}","${e.action}","${e.doc}","${e.change?.replace(/"/g,"'")}"`
    ).join('\n')
    const blob = new Blob([header+rows], { type:'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    toast.success('Audit log exported')
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Audit Log
          <small>System activity trail — all modules</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-s sd-bsm" onClick={exportCSV} disabled={!entries.length}>⬇ Export CSV</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
        {[
          {l:'Total Events',  v:stats.total,   c:'#714B67', bg:'#EDE0EA', i:'📋'},
          {l:'Creates',       v:stats.creates, c:'#2E7D32', bg:'#E8F5E9', i:'➕'},
          {l:'Updates',       v:stats.updates, c:'#E65100', bg:'#FFF3E0', i:'✏️'},
          {l:'Logins',        v:stats.logins,  c:'#1565C0', bg:'#E3F2FD', i:'🔑'},
          {l:'Deletes',       v:stats.deletes, c:'#C62828', bg:'#FFEBEE', i:'🗑️'},
        ].map(k=>(
          <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'12px 14px',
            border:'1px solid var(--odoo-border)',borderLeft:`4px solid ${k.c}`,
            display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>{k.i}</span>
            <div>
              <div style={{fontSize:18,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{loading?'…':k.v}</div>
              <div style={{fontSize:10,color:'#6C757D'}}>{k.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{background:'#fff',border:'1px solid var(--odoo-border)',borderRadius:8,padding:'12px 16px',marginBottom:14}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search user, doc, change…"
            style={{padding:'6px 12px',border:'1px solid var(--odoo-border)',borderRadius:6,fontSize:12,outline:'none',width:220}} />

          <select value={moduleF} onChange={e=>setModuleF(e.target.value)}
            style={{padding:'6px 10px',border:'1px solid var(--odoo-border)',borderRadius:6,fontSize:12,outline:'none'}}>
            {modules.map(m=><option key={m} value={m}>{m||'All Modules'}</option>)}
          </select>

          <select value={actionF} onChange={e=>setActionF(e.target.value)}
            style={{padding:'6px 10px',border:'1px solid var(--odoo-border)',borderRadius:6,fontSize:12,outline:'none'}}>
            {actions.map(a=><option key={a} value={a}>{a||'All Actions'}</option>)}
          </select>

          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{padding:'6px 10px',border:'1px solid var(--odoo-border)',borderRadius:6,fontSize:12,outline:'none'}} />
          <span style={{fontSize:11,color:'#6C757D'}}>to</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{padding:'6px 10px',border:'1px solid var(--odoo-border)',borderRadius:6,fontSize:12,outline:'none'}} />

          {(moduleF||actionF||search||dateFrom||dateTo) && (
            <button onClick={()=>{setModuleF('');setActionF('');setSearch('');setDateFrom('');setDateTo('')}}
              style={{padding:'6px 12px',borderRadius:6,border:'1px solid #C62828',background:'#FFEBEE',
                color:'#C62828',fontSize:11,fontWeight:700,cursor:'pointer'}}>
              ✕ Clear
            </button>
          )}

          <span style={{fontSize:11,color:'#6C757D',marginLeft:'auto'}}>
            {loading?'Loading…':`${entries.length} events`}
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading audit log…</div>
      ) : entries.length===0 ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D',background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)'}}>
          No audit entries found
        </div>
      ) : (
        <>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'var(--odoo-purple)'}}>
                  {['Timestamp','User','Module','Action','Document','Change'].map(h=>(
                    <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,
                      color:'#fff',textTransform:'uppercase',letterSpacing:.5}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((e,i)=>{
                  const act = ACTION_STYLE[e.action]||ACTION_STYLE.CREATE
                  const mc  = MOD_COLOR[e.module]||'#714B67'
                  return (
                    <tr key={e.id} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                      <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D',fontFamily:'DM Mono,monospace',whiteSpace:'nowrap'}}>
                        {e.ts}
                      </td>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{fontWeight:600,fontSize:12}}>{e.user||'System'}</div>
                        {e.role&&e.role!=='—'&&<div style={{fontSize:10,color:'#6C757D'}}>{e.role}</div>}
                      </td>
                      <td style={{padding:'10px 12px'}}>
                        <span style={{background:mc+'22',color:mc,padding:'2px 8px',borderRadius:6,
                          fontSize:11,fontWeight:700}}>{e.module}</span>
                      </td>
                      <td style={{padding:'10px 12px'}}>
                        <span style={{background:act.bg,color:act.c,padding:'3px 8px',borderRadius:6,
                          fontSize:11,fontWeight:700,display:'flex',alignItems:'center',gap:4,width:'fit-content'}}>
                          {act.icon} {e.action}
                        </span>
                      </td>
                      <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12,
                        fontWeight:700,color:'var(--odoo-purple)'}}>{e.doc}</td>
                      <td style={{padding:'10px 12px',fontSize:11,color:'#1C1C1C',maxWidth:360}}>
                        {e.change}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginTop:14}}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                style={{padding:'5px 12px',borderRadius:5,border:'1px solid var(--odoo-border)',
                  background:page===1?'#F5F5F5':'#fff',cursor:page===1?'not-allowed':'pointer',fontSize:12}}>← Prev</button>
              {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
                const p = i+1
                return (
                  <button key={p} onClick={()=>setPage(p)}
                    style={{padding:'5px 10px',borderRadius:5,fontSize:12,cursor:'pointer',
                      background:page===p?'var(--odoo-purple)':'#fff',
                      color:page===p?'#fff':'var(--odoo-dark)',
                      border:`1px solid ${page===p?'var(--odoo-purple)':'var(--odoo-border)'}`}}>{p}</button>
                )
              })}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                style={{padding:'5px 12px',borderRadius:5,border:'1px solid var(--odoo-border)',
                  background:page===totalPages?'#F5F5F5':'#fff',cursor:page===totalPages?'not-allowed':'pointer',fontSize:12}}>Next →</button>
              <span style={{fontSize:11,color:'#6C757D'}}>Page {page} of {totalPages} · {entries.length} total</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
