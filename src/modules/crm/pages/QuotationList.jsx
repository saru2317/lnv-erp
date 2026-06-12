import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const fmt  = n => n ? `₹${parseFloat(n).toLocaleString('en-IN',{maximumFractionDigits:0})}` : '₹0'
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const STATUS_CLR = {
  DRAFT:    { bg:'#F5F5F5', c:'#6C757D' },
  SENT:     { bg:'#E3F2FD', c:'#1565C0' },
  APPROVED: { bg:'#D4EDDA', c:'#155724' },
  REJECTED: { bg:'#F8D7DA', c:'#721C24' },
  EXPIRED:  { bg:'#FFF3CD', c:'#856404' },
  WON:      { bg:'#D4EDDA', c:'#155724' },
  LOST:     { bg:'#F8D7DA', c:'#721C24' },
}

export default function QuotationList() {
  const nav = useNavigate()
  const [quotes,  setQuotes]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/crm/quotations?limit=200`, { headers:hdr2() })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setQuotes(d.data || [])
    } catch(e) { toast.error('Failed to load quotations') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = quotes
    .filter(q => !statusF || q.status === statusF)
    .filter(q => !search ||
      q.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      q.quotNo?.toLowerCase().includes(search.toLowerCase())
    )

  // KPIs
  const totalAmt  = quotes.reduce((s,q) => s + parseFloat(q.grandTotal||0), 0)
  const wonAmt    = quotes.filter(q=>q.status==='APPROVED'||q.status==='WON').reduce((s,q)=>s+parseFloat(q.grandTotal||0),0)
  const draftCnt  = quotes.filter(q=>q.status==='DRAFT').length
  const winRate   = quotes.length > 0
    ? Math.round(quotes.filter(q=>q.status==='APPROVED'||q.status==='WON').length / quotes.length * 100)
    : 0

  const STATUSES = ['', 'DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED']

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
          Quotations
          <small style={{fontSize:12,fontWeight:400,color:'#6C757D',marginLeft:8}}>
            {loading ? '…' : `${quotes.length} total`}
          </small>
        </div>
        <button onClick={()=>nav('/crm/quotations/new')}
          style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',
            borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
          + New Quotation
        </button>
      </div>

      {/* KPI strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
        {[
          {l:'Total Quotations', v:quotes.length,   c:'#714B67', bg:'#EDE0EA', i:'📋'},
          {l:'Total Value',      v:fmt(totalAmt),    c:'#1565C0', bg:'#E3F2FD', i:'💰'},
          {l:'Won / Approved',   v:fmt(wonAmt),      c:'#155724', bg:'#D4EDDA', i:'🏆'},
          {l:'Win Rate',         v:`${winRate}%`,    c:'#856404', bg:'#FFF3CD', i:'📊'},
        ].map(k=>(
          <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'12px 14px',
            border:'1px solid var(--odoo-border)',borderLeft:`4px solid ${k.c}`,
            display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>{k.i}</span>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{loading?'…':k.v}</div>
              <div style={{fontSize:10,color:'#6C757D'}}>{k.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter pills */}
      <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
        {STATUSES.map(s=>(
          <button key={s} onClick={()=>setStatusF(s)}
            style={{padding:'5px 14px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',
              border:`1.5px solid ${statusF===s?'#714B67':'var(--odoo-border)'}`,
              background:statusF===s?'#714B67':'#fff',
              color:statusF===s?'#fff':'#6C757D'}}>
            {s||'All'} {s && `(${quotes.filter(q=>q.status===s).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{marginBottom:12}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search customer or quotation number…"
          style={{padding:'7px 12px',border:'1px solid var(--odoo-border)',borderRadius:6,
            fontSize:12,outline:'none',width:300}} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading quotations…</div>
      ) : (
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'var(--odoo-purple)'}}>
                {['Quotation No','Customer','Taxable Amt','GST','Grand Total','Valid Till','Status','Date',''].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,
                    fontWeight:700,color:'#fff',textTransform:'uppercase',letterSpacing:.5}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                    {search || statusF ? 'No quotations match your filter' : 'No quotations yet — '}
                    {!search && !statusF && (
                      <span style={{color:'#714B67',cursor:'pointer',fontWeight:700}}
                        onClick={()=>nav('/crm/quotations/new')}>+ Create first quotation</span>
                    )}
                  </td>
                </tr>
              ) : filtered.map((q,i) => {
                const sc = STATUS_CLR[q.status] || STATUS_CLR.DRAFT
                return (
                  <tr key={q.id}
                    onClick={()=>nav(`/crm/quotations/${q.id}`)}
                    style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#EDE0EA'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                    <td style={{padding:'10px 12px'}}>
                      <code style={{fontWeight:700,color:'#714B67',fontSize:11,
                        background:'#EDE0EA',padding:'2px 6px',borderRadius:4}}>{q.quotNo}</code>
                    </td>
                    <td style={{padding:'10px 12px',fontWeight:600,fontSize:12}}>{q.customerName}</td>
                    <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12}}>
                      {fmt(q.taxableAmt)}
                    </td>
                    <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:11,color:'#1565C0'}}>
                      {fmt((parseFloat(q.cgst||0)+parseFloat(q.sgst||0)+parseFloat(q.igst||0)))}
                    </td>
                    <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontWeight:700,
                      fontSize:13,color:'#2E7D32'}}>
                      {fmt(q.grandTotal)}
                    </td>
                    <td style={{padding:'10px 12px',fontSize:11,
                      color: q.validTill && new Date(q.validTill)<new Date() ? '#C62828':'#1C1C1C'}}>
                      {fmtD(q.validTill)}
                      {q.validTill && new Date(q.validTill)<new Date() &&
                        <span style={{fontSize:9,marginLeft:4,color:'#C62828',fontWeight:700}}>EXPIRED</span>}
                    </td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{padding:'3px 10px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:sc.bg, color:sc.c}}>{q.status}</span>
                    </td>
                    <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D'}}>
                      {fmtD(q.createdAt)}
                    </td>
                    <td style={{padding:'10px 12px'}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>nav(`/crm/quotations/${q.id}`)}
                        style={{padding:'4px 10px',borderRadius:5,border:'1px solid var(--odoo-border)',
                          background:'#fff',fontSize:11,cursor:'pointer',marginRight:4}}>View</button>
                      {q.status==='APPROVED' && (
                        <button onClick={()=>nav(`/sd/orders/new?quotId=${q.id}`)}
                          style={{padding:'4px 10px',borderRadius:5,border:'none',
                            background:'#D4EDDA',color:'#155724',fontSize:11,cursor:'pointer',fontWeight:700}}>
                          → SO
                        </button>
                      )}
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
