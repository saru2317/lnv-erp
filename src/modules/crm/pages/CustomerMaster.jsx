import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const fmt = n => n ? `₹${parseFloat(n).toLocaleString('en-IN',{maximumFractionDigits:0})}` : '₹0'

export default function CustomerMaster() {
  const nav = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [typeF,     setTypeF]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (typeF)  params.append('type', typeF)
      const r = await fetch(`${BASE_URL}/sd/customers?${params}&limit=500`, { headers:hdr2() })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setCustomers(d.data || [])
    } catch(e) { toast.error('Failed to load customers') }
    finally { setLoading(false) }
  }, [search, typeF])

  useEffect(() => { load() }, [load])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => load(), 300)
    return () => clearTimeout(t)
  }, [search])

  const totalRevenue = customers.reduce((s,c)=>s+parseFloat(c.creditLimit||0),0)
  const activeCount  = customers.length
  const topCust      = customers[0]

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Customer Master
          <small>{loading?'Loading…':`${customers.length} customers`}</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={()=>nav('/mdm/customers/new')}>+ New Customer</button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
        {[
          {l:'Total Customers', v:customers.length,     clr:'#714B67', ic:'🏢'},
          {l:'Type A',          v:customers.filter(c=>c.type==='A').length, clr:'#117A65', ic:'⭐'},
          {l:'Type B',          v:customers.filter(c=>c.type==='B').length, clr:'#1A5276', ic:'🔵'},
          {l:'Top Customer',    v:topCust?.name?.split(' ').slice(0,2).join(' ')||'—', clr:'#E06F39', ic:'🏆'},
        ].map(k=>(
          <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'12px 14px',
            border:'1px solid var(--odoo-border)',borderLeft:`4px solid ${k.clr}`,
            display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>{k.ic}</span>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:k.clr,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
              <div style={{fontSize:10,color:'#6C757D'}}>{k.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search customer name, code, GSTIN…"
          style={{padding:'7px 12px',border:'1px solid var(--odoo-border)',borderRadius:6,
            fontSize:12,outline:'none',width:280}} />
        <select value={typeF} onChange={e=>setTypeF(e.target.value)}
          style={{padding:'7px 10px',border:'1px solid var(--odoo-border)',borderRadius:6,fontSize:12,outline:'none'}}>
          <option value="">All Types</option>
          <option value="A">Type A</option>
          <option value="B">Type B</option>
          <option value="C">Type C</option>
        </select>
        <span style={{fontSize:11,color:'#6C757D',marginLeft:'auto'}}>
          {loading?'Loading…':`${customers.length} customers`}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading customers…</div>
      ) : customers.length===0 ? (
        <div style={{padding:40,textAlign:'center',background:'#fff',borderRadius:8,
          border:'1px solid var(--odoo-border)',color:'#6C757D'}}>
          No customers found — <button onClick={()=>nav('/mdm/customers/new')}
            style={{color:'#714B67',fontWeight:700,background:'none',border:'none',cursor:'pointer'}}>
            + Add your first customer
          </button>
        </div>
      ) : (
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'var(--odoo-purple)'}}>
                {['Code','Company','Type','City / State','Phone','Email','GSTIN','Credit Limit',''].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,
                    fontWeight:700,color:'#fff',textTransform:'uppercase',letterSpacing:.5}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c,i)=>(
                <tr key={c.id}
                  onClick={()=>nav(`/crm/customers/${c.id}`)}
                  style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#EDE0EA'}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                  <td style={{padding:'10px 12px'}}>
                    <code style={{fontSize:11,fontWeight:700,color:'#714B67',
                      background:'#EDE0EA',padding:'2px 6px',borderRadius:4}}>{c.code}</code>
                  </td>
                  <td style={{padding:'10px 12px'}}>
                    <div style={{fontWeight:700,fontSize:13}}>{c.name}</div>
                    {c.address&&<div style={{fontSize:10,color:'#6C757D'}}>{c.address?.slice(0,40)}</div>}
                  </td>
                  <td style={{padding:'10px 12px'}}>
                    <span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,
                      background:c.type==='A'?'#D4EDDA':c.type==='B'?'#E3F2FD':'#FFF3E0',
                      color:c.type==='A'?'#155724':c.type==='B'?'#1565C0':'#E65100'}}>
                      Type {c.type||'B'}
                    </span>
                  </td>
                  <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D'}}>
                    {c.city||'—'}{c.state?`, ${c.state}`:''}
                  </td>
                  <td style={{padding:'10px 12px',fontSize:11}}>{c.phone||'—'}</td>
                  <td style={{padding:'10px 12px',fontSize:11,color:'#6C757D'}}>{c.email||'—'}</td>
                  <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:11}}>{c.gstin||'—'}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,fontSize:12,color:'#2E7D32'}}>
                    {c.creditLimit ? fmt(c.creditLimit) : '—'}
                  </td>
                  <td style={{padding:'10px 12px'}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>nav(`/crm/customers/${c.id}`)}
                      style={{padding:'4px 10px',borderRadius:5,border:'1px solid var(--odoo-border)',
                        background:'#fff',fontSize:11,cursor:'pointer'}}>View</button>
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
