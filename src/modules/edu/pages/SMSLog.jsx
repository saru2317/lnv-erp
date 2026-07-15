import React, { useState, useEffect } from 'react'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const inp  = { padding:'7px 9px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none' }
const th   = { padding:'8px 10px', fontSize:11, color:'#6E2C00', textAlign:'left', borderBottom:'2px solid #E8E0E8' }
const td   = { padding:'7px 10px', fontSize:12, borderBottom:'1px solid #F0F0F0' }

const STATUS_STYLE = {
  PENDING:   { bg:'#FEF9E7', color:'#B8860B' },
  SENT:      { bg:'#E8F5E9', color:'#1E8449' },
  DELIVERED: { bg:'#E8F5E9', color:'#1E8449' },
  FAILED:    { bg:'#FDEDEC', color:'#C0392B' },
}
const TYPE_ICONS = { ABSENT:'🚸', FEE_DUE:'💰', RESULT:'📊', BUS:'🚌', EXAM:'📝', CUSTOM:'✉️' }

export default function SMSLog() {
  const [instId,  setInstId]  = useState(localStorage.getItem('lnv_edu_inst') || '')
  const [logs,    setLogs]    = useState([])
  const [counts,  setCounts]  = useState({ total:0, pending:0, sent:0, failed:0 })
  const [status,  setStatus]  = useState('')
  const [type,    setType]    = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const onStorage = () => setInstId(localStorage.getItem('lnv_edu_inst') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ institutionId:instId })
    if (status) params.set('status', status)
    if (type)   params.set('messageType', type)
    fetch(`${BASE}/edu/sms-log?${params}`, { headers:hdr2() })
      .then(r=>r.json())
      .then(d => { setLogs(d.data||[]); setCounts(d.counts||{total:0,pending:0,sent:0,failed:0}) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [instId, status, type])

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📱 SMS Log</div>
        <div style={{fontSize:11,color:'#888',marginTop:2}}>
          No SMS gateway is connected yet — this is an audit log of messages queued to send. Everything sits at PENDING until a real gateway (MSG91/Textlocal/Twilio) is wired in.
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
        {[
          {label:'Total', val:counts.total, color:'#6E2C00'},
          {label:'Pending', val:counts.pending, color:'#B8860B'},
          {label:'Sent', val:counts.sent, color:'#1E8449'},
          {label:'Failed', val:counts.failed, color:'#C0392B'},
        ].map(c => (
          <div key={c.label} style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:'12px 16px',textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:800,color:c.color}}>{c.val}</div>
            <div style={{fontSize:11,color:'#888',fontWeight:700,textTransform:'uppercase'}}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
        <div style={{display:'flex',gap:10,marginBottom:14}}>
          <select value={status} onChange={e=>setStatus(e.target.value)} style={{...inp,width:150}}>
            <option value=''>All Statuses</option>
            <option value='PENDING'>Pending</option>
            <option value='SENT'>Sent</option>
            <option value='DELIVERED'>Delivered</option>
            <option value='FAILED'>Failed</option>
          </select>
          <select value={type} onChange={e=>setType(e.target.value)} style={{...inp,width:150}}>
            <option value=''>All Types</option>
            <option value='ABSENT'>Absence</option>
            <option value='FEE_DUE'>Fee Due</option>
            <option value='RESULT'>Result</option>
            <option value='BUS'>Transport</option>
            <option value='EXAM'>Exam</option>
            <option value='CUSTOM'>Custom</option>
          </select>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:40,color:'#aaa'}}>⏳ Loading...</div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={th}>Type</th><th style={th}>Recipient</th><th style={th}>Student</th>
              <th style={th}>Message</th><th style={th}>Status</th><th style={th}>Date</th>
            </tr></thead>
            <tbody>
              {logs.map(l => {
                const s = STATUS_STYLE[l.status] || STATUS_STYLE.PENDING
                return (
                  <tr key={l.id}>
                    <td style={td}>{TYPE_ICONS[l.messageType]||'✉️'} {l.messageType}</td>
                    <td style={td}>{l.recipientName || '—'}<div style={{fontSize:10,color:'#888'}}>{l.recipientPhone}</div></td>
                    <td style={td}>{l.student?.name || '—'}</td>
                    <td style={{...td,maxWidth:320}}>{l.message}</td>
                    <td style={td}>
                      <span style={{padding:'3px 10px',borderRadius:12,background:s.bg,color:s.color,fontSize:10,fontWeight:700}}>
                        {l.status}
                      </span>
                    </td>
                    <td style={{...td,fontSize:11,color:'#888'}}>{new Date(l.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                  </tr>
                )
              })}
              {logs.length===0 && <tr><td colSpan={6} style={{...td,textAlign:'center',color:'#aaa'}}>No SMS log entries yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
