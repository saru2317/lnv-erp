import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})

const SRC_COLORS = {
  SD:'#D4EDDA', MM:'#FFF3CD', WM:'#D1ECF1',
  PP:'#EDE0EA', PM:'#F8D7DA', HCM:'#F4ECF7', FI:'#E2E3E5'
}
const SRC_TEXT = {
  SD:'#155724', MM:'#856404', WM:'#0C5460',
  PP:'#714B67', PM:'#721C24', HCM:'#6C3483', FI:'#383d41'
}
const SRC_LABELS = {
  SD:'Sales', MM:'Purchase', PP:'Production',
  WM:'Warehouse', HCM:'Payroll', PM:'Maintenance', FI:'Finance'
}

export default function InterModuleJournals() {
  const nav = useNavigate()
  const [jes,      setJes]      = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('All')
  const [expanded, setExpanded] = useState({})
  const [search,   setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.all(
        ['SD','MM','PP','WM','HCM','PM'].map(t =>
          fetch(`${BASE_URL}/fi/je?refType=${t}`, { headers: hdr2() })
            .then(r => r.json()).catch(() => ({ data: [] }))
        )
      )
      const all = results.flatMap(r => r.data || [])
        .sort((a,b) => new Date(b.date) - new Date(a.date))
      setJes(all)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const SOURCES = ['All','SD','MM','PP','WM','HCM','PM']
  const shown   = jes.filter(j => {
    const ms = filter === 'All' || j.refType === filter
    const mt = !search ||
      j.narration?.toLowerCase().includes(search.toLowerCase()) ||
      j.jeNo?.includes(search)
    return ms && mt
  })

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Inter-Module Journals
          <small> Auto-posted JVs from all modules</small>
        </div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="Search JV / narration..."
            value={search} onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
        </div>
      </div>

      <div style={{background:'#EDE0EA',borderRadius:6,padding:'8px 14px',marginBottom:12,fontSize:12,color:'#714B67'}}>
        All journals auto-posted by other modules appear here.
        SD → Sales JV · MM → Purchase JV · HCM → Payroll JV · PP → COGM JV · WM → GI/GR JV
      </div>

      {/* Source filter chips */}
      <div className="pp-chips">
        {SOURCES.map(s => (
          <div key={s} className={`pp-chip${filter===s?' on':''}`} onClick={()=>setFilter(s)}>
            {SRC_LABELS[s]||s}
            <span>{s==='All' ? jes.length : jes.filter(j=>j.refType===s).length}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading auto JVs...</div>
      ) : shown.length === 0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8,background:'#fff'}}>
          <div style={{fontSize:36,marginBottom:10}}>🔗</div>
          <div style={{fontWeight:700,fontSize:15,color:'#333'}}>No inter-module journals yet</div>
          <div style={{fontSize:12,marginTop:4}}>
            Post sales invoices, GRNs, payroll or production orders — they auto-create JVs here.
          </div>
        </div>
      ) : (
        <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
          {/* Header */}
          <div style={{display:'grid',gridTemplateColumns:'28px 140px 80px 1fr 120px 80px',
            padding:'7px 14px',background:'#F8F4F8',borderBottom:'2px solid #E0D5E0',
            fontSize:10,fontWeight:700,color:'#6C757D',gap:8,textTransform:'uppercase'}}>
            <span/><span>JV No.</span><span>Source</span>
            <span>Narration</span>
            <span style={{textAlign:'right'}}>Amount</span>
            <span style={{textAlign:'center'}}>Action</span>
          </div>

          {shown.map((j, idx) => {
            const isOpen = !!expanded[j.id]
            const bg     = SRC_COLORS[j.refType] || '#EEE'
            const tx     = SRC_TEXT[j.refType]   || '#333'
            return (
              <div key={j.id} style={{borderBottom: idx<shown.length-1?'1px solid #F0EEF0':'none'}}>
                {/* Voucher row */}
                <div onClick={() => toggle(j.id)} style={{
                  display:'grid',gridTemplateColumns:'28px 140px 80px 1fr 120px 80px',
                  padding:'10px 14px',gap:8,cursor:'pointer',alignItems:'center',
                  background: isOpen ? '#FDF8FC' : idx%2===0 ? '#fff' : '#FDFBFD',
                }}>
                  <span style={{
                    color:'#714B67',fontSize:13,fontWeight:700,textAlign:'center',
                    display:'inline-block',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition:'transform .15s'
                  }}>›</span>

                  <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:12,color:'#714B67'}}>
                    {j.jeNo}
                  </span>

                  <span>
                    <span style={{background:bg,color:tx,padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700}}>
                      {SRC_LABELS[j.refType]||j.refType}
                    </span>
                  </span>

                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:'#333'}}>{j.narration}</div>
                    <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>
                      {new Date(j.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                      {j.refNo && <span style={{marginLeft:8,fontFamily:'DM Mono,monospace'}}>Ref: {j.refNo}</span>}
                    </div>
                  </div>

                  <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:13,color:tx}}>
                    {INR(j.totalDebit)}
                  </span>

                  <div style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
                    <button className="btn-xs" onClick={()=>nav('/fi/daybook')}>View</button>
                  </div>
                </div>

                {/* Expanded lines — Tally drill-down */}
                {isOpen && (
                  <div style={{background:'#FDF8FC',borderTop:'1px solid #E0D5E0'}}>
                    <div style={{
                      display:'grid',gridTemplateColumns:'28px 140px 80px 1fr 1fr 120px',
                      padding:'5px 14px',background:bg,
                      fontSize:9,fontWeight:700,color:tx,gap:8,textTransform:'uppercase'
                    }}>
                      <span/><span>#</span><span/>
                      <span>Debit Account</span><span>Credit Account</span>
                      <span style={{textAlign:'right'}}>Amount</span>
                    </div>

                    {(j.lines||[]).map((l, li) => (
                      <div key={li} style={{
                        display:'grid',gridTemplateColumns:'28px 140px 80px 1fr 1fr 120px',
                        padding:'6px 14px',borderBottom:'1px solid #F0EEF0',
                        gap:8,alignItems:'center',
                        background: li%2===0 ? '#fff' : '#FDFBFD',
                        fontSize:12,
                      }}>
                        <span/><span style={{color:'#6C757D',fontSize:11}}>{li+1}</span><span/>

                        {/* Dr account — click → GL */}
                        <span
                          style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67',
                            cursor: l.debitAcctCode?'pointer':'default',
                            textDecoration: l.debitAcctCode?'underline':'none'}}
                          onClick={()=>l.debitAcctCode&&nav(`/fi/ledger?acct=${l.debitAcctCode}`)}>
                          {l.debitAcctCode||'—'}
                        </span>

                        {/* Cr account — click → GL */}
                        <span
                          style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67',
                            cursor: l.creditAcctCode?'pointer':'default',
                            textDecoration: l.creditAcctCode?'underline':'none'}}
                          onClick={()=>l.creditAcctCode&&nav(`/fi/ledger?acct=${l.creditAcctCode}`)}>
                          {l.creditAcctCode||'—'}
                        </span>

                        <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,
                          color: parseFloat(l.debit)>0 ? 'var(--odoo-red)' : 'var(--odoo-green)'}}>
                          {parseFloat(l.debit)>0 ? INR(l.debit) : parseFloat(l.credit)>0 ? INR(l.credit) : '—'}
                        </span>
                      </div>
                    ))}

                    {/* Voucher sub-total */}
                    <div style={{
                      display:'grid',gridTemplateColumns:'28px 140px 80px 1fr 1fr 120px',
                      padding:'6px 14px',background:bg,fontSize:11,fontWeight:800,color:tx,gap:8
                    }}>
                      <span/><span>Total</span><span/><span/><span/>
                      <span style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(j.totalDebit)}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
