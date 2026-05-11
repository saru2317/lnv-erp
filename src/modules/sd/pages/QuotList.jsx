import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { sdApi } from '../services/sdApi'

const INR = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:0 })
const STATUS_CFG = {
  DRAFT:     { bg:'#F5F5F5', c:'#666'    },
  SENT:      { bg:'#CCE5FF', c:'#004085' },
  WON:       { bg:'#D4EDDA', c:'#155724' },
  LOST:      { bg:'#F8D7DA', c:'#721C24' },
  CONVERTED: { bg:'#EDE0EA', c:'#714B67' },
}

export default function QuotList() {
  const navigate = useNavigate()
  const [quots,   setQuots]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await sdApi.getQuotations({ search, status })
      const d = r?.data?.data || r?.data || r || []
      setQuots(Array.isArray(d) ? d : [])
    } catch { setQuots([]) }
    finally { setLoading(false) }
  }, [search, status])

  useEffect(() => { load() }, [load])

  const counts = { total:quots.length, sent:quots.filter(q=>q.status==='SENT').length, won:quots.filter(q=>q.status==='WON').length, converted:quots.filter(q=>q.status==='CONVERTED').length }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'#714B67' }}>
            Quotations <small style={{ fontSize:12, fontWeight:400, color:'#6C757D', marginLeft:8 }}>VA21 · {counts.total}</small>
          </div>
          <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>Create from here or from CRM Lead → Convert to SO</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ padding:'7px 14px', background:'#fff', border:'1px solid #E0D5E0', borderRadius:6, fontSize:12, cursor:'pointer' }}>Export</button>
          <button onClick={()=>navigate('/sd/quotations/new')}
            style={{ padding:'7px 16px', background:'#714B67', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            + New Quotation
          </button>
        </div>
      </div>

      {/* Status chips */}
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        {[{l:'Total',bg:'#F8F4F8',c:'#714B67',v:counts.total},{l:'Sent',bg:'#CCE5FF',c:'#004085',v:counts.sent},{l:'Won',bg:'#D4EDDA',c:'#155724',v:counts.won},{l:'Converted',bg:'#EDE0EA',c:'#714B67',v:counts.converted}].map(k=>(
          <div key={k.l} style={{ padding:'8px 16px', borderRadius:8, background:k.bg, border:`1px solid ${k.c}22`, textAlign:'center', minWidth:80 }}>
            <div style={{ fontSize:10, fontWeight:700, color:k.c, textTransform:'uppercase' }}>{k.l}</div>
            <div style={{ fontFamily:'DM Mono,monospace', fontWeight:800, fontSize:20, color:k.c }}>{k.v}</div>
          </div>
        ))}
        {/* CRM source count */}
        <div style={{ padding:'8px 16px', borderRadius:8, background:'#FFF3CD', border:'1px solid #FFEEBA', textAlign:'center', minWidth:80, marginLeft:'auto' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#856404', textTransform:'uppercase' }}>From CRM</div>
          <div style={{ fontFamily:'DM Mono,monospace', fontWeight:800, fontSize:20, color:'#856404' }}>
            {quots.filter(q=>q.crmLeadId).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input placeholder="Search quot #, customer..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ padding:'7px 12px', border:'1px solid #E0D5E0', borderRadius:6, fontSize:12, outline:'none', width:280 }}/>
        <select value={status} onChange={e=>setStatus(e.target.value)}
          style={{ padding:'7px 12px', border:'1px solid #E0D5E0', borderRadius:6, fontSize:12, cursor:'pointer' }}>
          <option value="">All Status</option>
          {['DRAFT','SENT','WON','LOST','CONVERTED'].map(s=><option key={s}>{s}</option>)}
        </select>
        <button onClick={load} style={{ padding:'7px 14px', background:'#fff', border:'1px solid #E0D5E0', borderRadius:6, fontSize:12, cursor:'pointer' }}>Search</button>
      </div>

      {loading ? <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>Loading...</div>
      : quots.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D', border:'2px dashed #E0D5E0', borderRadius:8 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
          <div style={{ fontWeight:700 }}>No quotations yet</div>
          <div style={{ fontSize:12, marginTop:4 }}>Create from here or from CRM → Leads</div>
        </div>
      ) : (
        <div style={{ overflowX:'auto', background:'#fff', borderRadius:8, border:'1px solid #E0D5E0' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
                {['Quot #','Date','Customer','Valid Till','Total','Status','Source',''].map(h=>(
                  <th key={h} style={{ padding:'10px 12px', textAlign:h==='Total'?'right':'left', fontWeight:700, fontSize:11, color:'#714B67' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quots.map((q,i)=>{
                const sc = STATUS_CFG[q.status]||STATUS_CFG.DRAFT
                const expired = q.validTill && new Date(q.validTill) < new Date()
                return (
                  <tr key={q.id||i} onClick={()=>navigate('/sd/quotations/'+q.id)}
                    style={{ borderBottom:'1px solid #F0EEEB', cursor:'pointer', background:i%2===0?'#fff':'#FAFAFA' }}
                    onMouseOver={e=>e.currentTarget.style.background='#F8F4F8'}
                    onMouseOut={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                    <td style={{ padding:'9px 12px', fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67', fontSize:11 }}>{q.quotNo}</td>
                    <td style={{ padding:'9px 12px', fontSize:11, color:'#6C757D' }}>
                      {q.createdAt?new Date(q.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}):'—'}
                    </td>
                    <td style={{ padding:'9px 12px', fontWeight:600 }}>{q.customerName}</td>
                    <td style={{ padding:'9px 12px', fontSize:11, fontWeight:expired?700:400, color:expired?'#DC3545':'#333' }}>
                      {q.validTill?new Date(q.validTill).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}):'—'}
                      {expired&&<span style={{ fontSize:10, marginLeft:4, color:'#DC3545' }}>Expired</span>}
                    </td>
                    <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:13 }}>{INR(q.grandTotal||0)}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ padding:'2px 10px', borderRadius:10, fontSize:10, fontWeight:700, background:sc.bg, color:sc.c }}>{q.status}</span>
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      {q.crmLeadId
                        ? <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700, background:'#FFF3CD', color:'#856404' }}>CRM Lead</span>
                        : <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700, background:'#F5F5F5', color:'#666' }}>Direct</span>
                      }
                    </td>
                    <td style={{ padding:'9px 12px' }} onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex', gap:4 }}>
                        {(q.status==='DRAFT'||q.status==='SENT')&&(
                          <button onClick={async e=>{ e.stopPropagation(); if(!window.confirm('Convert to Sales Order?'))return; try{ await sdApi.convertToSO(q.id); alert('Converted!'); load() }catch(err){alert(err.message)} }}
                            style={{ padding:'3px 8px', background:'#D4EDDA', color:'#155724', border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:700 }}>
                            → SO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
