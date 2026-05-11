import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const STAGES = [
  { key:'NEW',         label:'New',          color:'#6C757D', bg:'#F5F5F5' },
  { key:'CONTACTED',   label:'Contacted',    color:'#004085', bg:'#CCE5FF' },
  { key:'QUALIFIED',   label:'Qualified',    color:'#856404', bg:'#FFF3CD' },
  { key:'PROPOSAL',    label:'Proposal',     color:'#4B2E83', bg:'#EDE0EA' },
  { key:'NEGOTIATION', label:'Negotiation',  color:'#0C5460', bg:'#D1ECF1' },
  { key:'WON',         label:'Won',          color:'#155724', bg:'#D4EDDA' },
  { key:'LOST',        label:'Lost',         color:'#721C24', bg:'#F8D7DA' },
]

const SOURCES = ['Website','Cold Call','Referral','Trade Show','Social Media','Email Campaign','Walk-in','Existing Customer','Other']

export default function LeadList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [leads,   setLeads]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [stage,   setStage]   = useState(searchParams.get('stage')||'')
  const [source,  setSource]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (stage)  params.set('stage',  stage)
      if (source) params.set('source', source)
      const r = await fetch(`${BASE_URL}/crm/leads?${params}`, { headers: hdr2() })
      const d = await r.json()
      setLeads(Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [])
    } catch { setLeads([]) }
    finally { setLoading(false) }
  }, [search, stage, source])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
          Leads <small style={{fontSize:12,fontWeight:400,color:'#6C757D',marginLeft:8}}>{leads.length} records</small>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button style={{padding:'7px 14px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export</button>
          <button onClick={()=>navigate('/crm/leads/new')}
            style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            + New Lead
          </button>
        </div>
      </div>

      {/* Stage filter chips */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        <button onClick={()=>setStage('')} style={{
          padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
          border:'1px solid #E0D5E0',background:stage===''?'#714B67':'#fff',color:stage===''?'#fff':'#6C757D'}}>
          All ({leads.length})
        </button>
        {STAGES.map(s=>{
          const cnt = leads.filter(l=>l.stage===s.key).length
          return (
            <button key={s.key} onClick={()=>setStage(stage===s.key?'':s.key)} style={{
              padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
              border:`1px solid ${stage===s.key?s.color:'#E0D5E0'}`,
              background:stage===s.key?s.color:'#fff',
              color:stage===s.key?'#fff':s.color}}>
              {s.label} ({cnt})
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <input placeholder="Search company, contact, phone..." value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{padding:'7px 12px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none',width:280}}/>
        <select value={source} onChange={e=>setSource(e.target.value)}
          style={{padding:'7px 12px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>
          <option value="">All Sources</option>
          {SOURCES.map(s=><option key={s}>{s}</option>)}
        </select>
        <button onClick={load} style={{padding:'7px 14px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>Search</button>
      </div>

      {/* Table */}
      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading leads...</div>
      : leads.length===0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          <div style={{fontSize:28,marginBottom:8}}>\uD83D\uDCCC</div>
          <div style={{fontWeight:700}}>No leads found</div>
          <div style={{fontSize:12,marginTop:4}}>Start capturing leads from various sources</div>
          <button onClick={()=>navigate('/crm/leads/new')}
            style={{marginTop:14,padding:'8px 20px',background:'#714B67',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            + Add First Lead
          </button>
        </div>
      ) : (
        <div style={{overflowX:'auto',background:'#fff',borderRadius:8,border:'1px solid #E0D5E0'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
                {['Company / Lead','Contact','Phone','Source','Stage','Deal Value','Assigned To','Last Activity',''].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:h==='Deal Value'?'right':'left',fontWeight:700,fontSize:11,color:'#714B67',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l,i)=>{
                const s = STAGES.find(x=>x.key===l.stage)||STAGES[0]
                return (
                  <tr key={l.id||i} onClick={()=>navigate('/crm/leads/'+l.id)}
                    style={{borderBottom:'1px solid #F0EEEB',cursor:'pointer',background:i%2===0?'#fff':'#FAFAFA'}}
                    onMouseOver={e=>e.currentTarget.style.background='#F8F4F8'}
                    onMouseOut={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{fontWeight:700,fontSize:13}}>{l.company||l.name}</div>
                      {l.industry&&<div style={{fontSize:10,color:'#6C757D'}}>{l.industry}</div>}
                    </td>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{fontWeight:600,fontSize:12}}>{l.contactName||'—'}</div>
                      <div style={{fontSize:10,color:'#6C757D'}}>{l.email||''}</div>
                    </td>
                    <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:11}}>{l.phone||'—'}</td>
                    <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D'}}>{l.source||'—'}</td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{padding:'3px 10px',borderRadius:10,fontSize:10,fontWeight:700,background:s.bg,color:s.color}}>{s.label}</span>
                    </td>
                    <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>
                      {l.dealValue>0?INR(l.dealValue):'—'}
                    </td>
                    <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D'}}>{l.assignedTo||'—'}</td>
                    <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D'}}>
                      {l.lastActivity?new Date(l.lastActivity).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}
                    </td>
                    <td style={{padding:'10px 12px'}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>navigate('/crm/leads/'+l.id)}
                        style={{padding:'3px 10px',background:'#EDE0EA',color:'#714B67',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:600}}>
                        View
                      </button>
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
