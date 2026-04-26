import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })

export default function GeneralLedger() {
  const [urlParams] = useSearchParams()
  const [accts,   setAccts]   = useState([])
  const [selAcct, setSelAcct] = useState(urlParams.get('acct') || '')
  const [gl,      setGL]      = useState(null)
  const [loading, setLoading] = useState(false)
  const [from,    setFrom]    = useState(`${new Date().getFullYear()}-04-01`)
  const [to,      setTo]      = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetch(`${BASE_URL}/fi/coa`, { headers: hdr2() }).then(r=>r.json()).then(d=>setAccts(d.data||[])).catch(()=>{})
  }, [])

  const load = async (code) => {
    if (!code) return
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/gl/${code}?from=${from}&to=${to}`, { headers: hdr2() })
      const data = await res.json()
      setGL(data.data)
    } catch { toast.error('Failed to load GL') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (selAcct) load(selAcct) }, [selAcct, from, to])

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">General Ledger <small>FB03 · Account Statement</small></div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={selAcct} onChange={e=>setSelAcct(e.target.value)} style={{width:280}}>
            <option value="">-- Select Account --</option>
            {accts.map(a=><option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
          </select>
          <input type="date" className="sd-search" value={from} onChange={e=>setFrom(e.target.value)} style={{width:140}}/>
          <span style={{color:'#6C757D',fontSize:12}}>to</span>
          <input type="date" className="sd-search" value={to} onChange={e=>setTo(e.target.value)} style={{width:140}}/>
        </div>
      </div>

      {!selAcct ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8,background:'#fff'}}>
          Select an account above to view ledger entries
        </div>
      ) : loading ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading GL...</div>
      ) : gl ? (
        <div>
          {/* Account header */}
          <div style={{background:'#714B67',borderRadius:8,padding:'12px 16px',marginBottom:12,display:'flex',justifyContent:'space-between',color:'#fff'}}>
            <div><div style={{fontWeight:800,fontSize:15,fontFamily:'Syne,sans-serif'}}>{gl.account.code} · {gl.account.name}</div>
            <div style={{fontSize:11,opacity:.7,marginTop:2}}>{gl.account.type} · {gl.account.subType}</div></div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:18}}>{INR(gl.closingBalance)}</div>
              <div style={{fontSize:11,opacity:.7}}>{gl.closingSide}</div>
            </div>
          </div>
          <table className="fi-data-table">
            <thead><tr>
              <th>Date</th><th>JV No.</th><th>Narration</th><th>Ref</th>
              <th style={{textAlign:'right',color:'var(--odoo-red)'}}>Debit</th>
              <th style={{textAlign:'right',color:'var(--odoo-green)'}}>Credit</th>
              <th style={{textAlign:'right'}}>Balance</th>
            </tr></thead>
            <tbody>
              {gl.rows.length===0 ? <tr><td colSpan={7} style={{padding:30,textAlign:'center',color:'#6C757D'}}>No transactions in period</td></tr>
              : gl.rows.map((r,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #F0EEF0'}}>
                  <td style={{fontSize:11}}>{new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)'}}>{r.jeNo}</td>
                  <td style={{fontSize:12,maxWidth:250}}>{r.narration}</td>
                  <td style={{fontSize:11,color:'#6C757D'}}>{r.refNo||'—'}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:r.debit>0?'var(--odoo-red)':'#DDD'}}>{r.debit>0?INR(r.debit):'—'}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:r.credit>0?'var(--odoo-green)':'#DDD'}}>{r.credit>0?INR(r.credit):'—'}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(r.balance)} <span style={{fontSize:10,color:'#6C757D'}}>{r.balSide}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #E0D5E0'}}>
                <td colSpan={4} style={{padding:'8px 10px',color:'#714B67'}}>TOTAL</td>
                <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-red)'}}>{INR(gl.totalDr)}</td>
                <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>{INR(gl.totalCr)}</td>
                <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14,color:'#714B67'}}>{INR(gl.closingBalance)} {gl.closingSide}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}
    </div>
  )
}

