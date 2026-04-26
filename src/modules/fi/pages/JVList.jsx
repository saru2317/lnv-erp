import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })

export default function JVList() {
  const nav = useNavigate()
  const [jes,     setJes]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('All')
  const [modal,   setModal]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/je${search?`?search=${search}`:''}`, { headers: hdr2() })
      const data = await res.json()
      setJes(data.data || [])
    } catch { toast.error('Failed to load journals') }
    finally { setLoading(false) }
  }, [search])
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t) }, [search])

  const REF_TYPES = ['All','SD','MM','FI','HCM','PP','WM','PM']
  const shown     = jes.filter(j => filter === 'All' || j.refType === filter)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Journal Entries <small>FB03 · All Postings</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="Search narration..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/fi/daybook')}>Day Book</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/fi/jv/new')}>New JV</button>
        </div>
      </div>

      <div className="pp-chips">
        {REF_TYPES.map(t=>(
          <div key={t} className={`pp-chip${filter===t?' on':''}`} onClick={()=>setFilter(t)}>
            {t} <span>{t==='All'?jes.length:jes.filter(j=>j.refType===t).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>JV No.</th><th>Date</th><th>Narration</th><th>Ref</th>
          <th style={{textAlign:'right'}}>Debit</th><th style={{textAlign:'right'}}>Credit</th>
          <th style={{textAlign:'center'}}>Source</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading
            ? <tr><td colSpan={8} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
            : shown.length === 0
            ? <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No journal entries yet. <button className="btn-xs pri" onClick={()=>nav('/fi/jv/new')}>Create JV →</button>
              </td></tr>
            : shown.map(j=>(
              <tr key={j.id} style={{cursor:'pointer'}} onClick={()=>setModal(j)}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{j.jeNo}</strong></td>
                <td style={{fontSize:11}}>{new Date(j.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}</td>
                <td style={{fontSize:12,maxWidth:280}}>{j.narration}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{j.refNo||'—'}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-red)'}}>{INR(j.totalDebit)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-green)'}}>{INR(j.totalCredit)}</td>
                <td style={{textAlign:'center'}}>
                  <span style={{background:'#EDE0EA',color:'#714B67',padding:'2px 6px',borderRadius:4,fontSize:10,fontWeight:700}}>{j.refType||'FI'}</span>
                </td>
                <td onClick={e=>e.stopPropagation()}>
                  <button className="btn-xs" onClick={()=>setModal(j)}>View</button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>

      {/* JV Detail Modal */}
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:10,width:600,maxHeight:'80vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
            <div style={{background:'#714B67',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <strong style={{color:'#fff',fontFamily:'Syne,sans-serif',fontSize:15}}>{modal.jeNo}</strong>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',color:'rgba(255,255,255,.7)',cursor:'pointer',fontSize:20}}>&#x2715;</button>
            </div>
            <div style={{padding:20}}>
              <div style={{fontSize:12,color:'#6C757D',marginBottom:12}}>
                {new Date(modal.date).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}
                {' · '}{modal.narration}
              </div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#F8F4F8'}}>
                  <th style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#6C757D'}}>Account</th>
                  <th style={{padding:'6px 10px',textAlign:'right',fontWeight:700,color:'var(--odoo-red)'}}>Debit</th>
                  <th style={{padding:'6px 10px',textAlign:'right',fontWeight:700,color:'var(--odoo-green)'}}>Credit</th>
                  <th style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#6C757D'}}>Narration</th>
                </tr></thead>
                <tbody>
                  {(modal.lines||[]).map((l,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #F0EEF0'}}>
                      <td style={{padding:'6px 10px'}}>{l.debitAcctCode||l.creditAcctCode}</td>
                      <td style={{padding:'6px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-red)'}}>{l.debit>0?INR(l.debit):''}</td>
                      <td style={{padding:'6px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>{l.credit>0?INR(l.credit):''}</td>
                      <td style={{padding:'6px 10px',fontSize:11,color:'#6C757D'}}>{l.narration}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:'#F8F4F8',fontWeight:700}}>
                    <td style={{padding:'8px 10px'}}>TOTAL</td>
                    <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-red)'}}>{INR(modal.totalDebit)}</td>
                    <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>{INR(modal.totalCredit)}</td>
                    <td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

