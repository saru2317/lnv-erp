import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })

const TYPE_COLORS = {
  ASSET:     ['#D1ECF1','#0C5460'],
  LIABILITY: ['#FFF3CD','#856404'],
  EQUITY:    ['#EDE0EA','#714B67'],
  INCOME:    ['#D4EDDA','#155724'],
  EXPENSE:   ['#F8D7DA','#721C24'],
}

export default function TrialBalance() {
  const [tb,      setTB]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [from,    setFrom]    = useState(`${new Date().getFullYear()}-04-01`)
  const [to,      setTo]      = useState(new Date().toISOString().split('T')[0])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/trial-balance?from=${from}&to=${to}`, { headers: hdr2() })
      const data = await res.json()
      setTB(data.data)
    } catch { toast.error('Failed to load Trial Balance') }
    finally { setLoading(false) }
  }, [from, to])
  useEffect(() => { load() }, [load])

  const TYPES = ['ASSET','LIABILITY','EQUITY','INCOME','EXPENSE']
  const [bg2,tx2] = ['#D4EDDA','#155724']

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Trial Balance <small>Account-wise Debit/Credit Summary</small></div>
        <div className="fi-lv-actions">
          <input type="date" className="sd-search" value={from} onChange={e=>setFrom(e.target.value)} style={{width:140}}/>
          <span style={{color:'#6C757D',fontSize:12}}>to</span>
          <input type="date" className="sd-search" value={to} onChange={e=>setTo(e.target.value)} style={{width:140}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      {tb && (
        <div style={{background:tb.balanced?'#D4EDDA':'#F8D7DA',border:`1px solid ${tb.balanced?'#C3E6CB':'#F5C6CB'}`,borderRadius:6,padding:'8px 14px',marginBottom:12,fontSize:13,color:tb.balanced?'#155724':'#721C24',fontWeight:700}}>
          {tb.balanced ? '✓ Trial Balance is BALANCED — Dr = Cr' : `⚠ NOT BALANCED — Difference: ${INR(Math.abs((tb.totalDr||0)-(tb.totalCr||0)))}`}
        </div>
      )}

      {loading ? <div style={{padding:30,textAlign:'center'}}>Loading...</div>
      : tb && (
        <div>
          <table className="fi-data-table">
            <thead><tr>
              <th>Code</th><th>Account Name</th><th>Type</th>
              <th style={{textAlign:'right',color:'var(--odoo-red)'}}>Debit</th>
              <th style={{textAlign:'right',color:'var(--odoo-green)'}}>Credit</th>
            </tr></thead>
            <tbody>
              {TYPES.map(type => {
                const rows = tb.rows.filter(r=>r.type===type)
                if (!rows.length) return null
                const subDr = rows.reduce((a,r)=>a+r.debit,0)
                const subCr = rows.reduce((a,r)=>a+r.credit,0)
                const [tbg,ttx] = TYPE_COLORS[type]||['#EEE','#333']
                return (
                  <React.Fragment key={type}>
                    <tr style={{background:tbg}}>
                      <td colSpan={3} style={{padding:'6px 12px',fontWeight:800,color:ttx,fontSize:11,textTransform:'uppercase',letterSpacing:.5}}>{type}</td>
                      <td style={{padding:'6px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,color:'var(--odoo-red)'}}>{subDr>0?INR(subDr):'—'}</td>
                      <td style={{padding:'6px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,color:'var(--odoo-green)'}}>{subCr>0?INR(subCr):'—'}</td>
                    </tr>
                    {rows.map((r,i)=>(
                      <tr key={r.code} style={{borderBottom:'1px solid #F0EEF0',background:i%2===0?'#fff':'#FDFBFD'}}>
                        <td style={{padding:'7px 12px',fontFamily:'DM Mono,monospace',fontSize:12,color:'#714B67'}}>{r.code}</td>
                        <td style={{padding:'7px 12px',fontSize:12,paddingLeft:24}}>{r.name}</td>
                        <td style={{padding:'7px 12px',fontSize:11,color:'#6C757D'}}>{r.subType}</td>
                        <td style={{padding:'7px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:r.debit>0?'var(--odoo-red)':'#DDD'}}>{r.debit>0?INR(r.debit):'—'}</td>
                        <td style={{padding:'7px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:r.credit>0?'var(--odoo-green)':'#DDD'}}>{r.credit>0?INR(r.credit):'—'}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{background:'#F8F4F8',fontWeight:800,borderTop:'3px solid #714B67'}}>
                <td colSpan={3} style={{padding:'10px 12px',color:'#714B67',fontSize:13}}>GRAND TOTAL</td>
                <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:15,color:'var(--odoo-red)'}}>{INR(tb.totalDr)}</td>
                <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:15,color:'var(--odoo-green)'}}>{INR(tb.totalCr)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

