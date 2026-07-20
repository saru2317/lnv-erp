import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '₹' + Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

export default function ReturnList() {
  const nav = useNavigate()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeF, setTypeF] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (search) q.set('search', search)
      if (typeF)  q.set('returnType', typeF)
      const res = await fetch(`${BASE_URL}/sd/returns?${q}`, { headers:hdr2() })
      const d = await res.json()
      setReturns(d.data||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[search, typeF])

  useEffect(()=>{ const t=setTimeout(load,300); return ()=>clearTimeout(t) },[load])

  const totalValue = returns.reduce((s,r)=>s+parseFloat(r.totalAmt||0),0)

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
            Sales Returns <small style={{fontSize:11,fontWeight:400,color:'#6C757D',marginLeft:8}}>Credit Notes</small>
          </div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>Goods returned by customers — auto-posts a credit note journal entry</div>
        </div>
        <button onClick={()=>nav('/sd/returns/new')}
          style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
          + New Return
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12}}>
        {[
          { l:'Total Returns', v:returns.length, c:'#714B67', bg:'#EDE0EA' },
          { l:'Total Value',   v:INR(totalValue), c:'#DC3545', bg:'#F8D7DA' },
          { l:'This Month',    v:returns.filter(r=>{
              const d=new Date(r.createdAt); const n=new Date()
              return d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear()
            }).length, c:'#0C5460', bg:'#D1ECF1' },
        ].map(k=>(
          <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'10px 14px',border:'1px solid #E0D5E0',borderLeft:`4px solid ${k.c}`}}>
            <div style={{fontSize:15,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
            <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{k.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search return no, customer..."
          style={{padding:'7px 12px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none',width:220}} />
        <select value={typeF} onChange={e=>setTypeF(e.target.value)}
          style={{padding:'7px 10px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none'}}>
          <option value="">All Types</option>
          <option value="Full Return">Full Return</option>
          <option value="Partial Return">Partial Return</option>
        </select>
        <span style={{marginLeft:'auto',fontSize:11,color:'#6C757D'}}>{returns.length} records</span>
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>⏳ Loading...</div>
      ) : returns.length===0 ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D',background:'#fff',borderRadius:8,border:'2px dashed #E0D5E0'}}>
          No returns recorded yet.
          <div style={{marginTop:12}}>
            <button onClick={()=>nav('/sd/returns/new')} style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>+ New Return</button>
          </div>
        </div>
      ) : (
        <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead style={{background:'#F8F4F8'}}>
              <tr style={{borderBottom:'2px solid #E0D5E0'}}>
                {['Return No','Customer','Invoice Ref','Type','Lines','Amount','Status'].map(h=>(
                  <th key={h} style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left',textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {returns.map((r,i)=>(
                <tr key={r.id} style={{borderBottom:'1px solid #F0EEF0',background:i%2===0?'#fff':'#FDFBFD'}}>
                  <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',color:'#714B67',fontWeight:600}}>{r.returnNo}</td>
                  <td style={{padding:'8px 10px'}}>{r.customerName}</td>
                  <td style={{padding:'8px 10px',fontSize:11,color:'#6C757D'}}>{r.invoiceNo||'—'}</td>
                  <td style={{padding:'8px 10px'}}>{r.returnType}</td>
                  <td style={{padding:'8px 10px'}}>{r._count?.lines ?? '—'}</td>
                  <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',fontWeight:600,color:'#DC3545'}}>{INR(r.totalAmt)}</td>
                  <td style={{padding:'8px 10px'}}>
                    <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:'#D4EDDA',color:'#155724'}}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
