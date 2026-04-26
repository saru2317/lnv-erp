import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })

export default function FIDashboard() {
  const nav = useNavigate()
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE_URL}/fi/dashboard`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setKpis(d.data)).catch(()=>{})
      .finally(()=>setLoading(false))
  }, [])

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">FI Dashboard <small>Finance Overview</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/fi/pl')}>P&amp;L</button>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/fi/bs')}>Balance Sheet</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/fi/jv/new')}>New Journal</button>
        </div>
      </div>

      <div className="fi-kpi-grid">
        {loading ? [1,2,3,4].map(i=>(
          <div key={i} className="fi-kpi-card" style={{height:80,background:'#F0EEF0',borderRadius:8,animationName:'pulse'}}/>
        )) : [
          { cls:'purple', lb:'Revenue (MTD)',    val: kpis ? INR(kpis.revenueMTD)   : '—', sub: kpis?`Margin: ${kpis.margin}%`:'Current month' },
          { cls:'green',  lb:'Net Profit (MTD)', val: kpis ? INR(kpis.netProfitMTD):'—', sub: kpis?.netProfitMTD>=0?'Profitable':'Loss' },
          { cls:'orange', lb:'Receivables (AR)', val: kpis ? INR(kpis.arOutstanding):'—', sub:'Outstanding invoices' },
          { cls:'red',    lb:'Payables (AP)',    val: kpis ? INR(kpis.apOutstanding):'—', sub:'Vendor dues' },
        ].map(k=>(
          <div key={k.lb} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.lb}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginTop:14}}>
        {[
          ['/fi/jv',        'Journal Entries', 'FB03'],
          ['/fi/daybook',   'Day Book',         'All Vouchers'],
          ['/fi/gl',        'General Ledger',   'Account-wise'],
          ['/fi/tb',        'Trial Balance',    'Dr/Cr Summary'],
          ['/fi/pl',        'P&L Statement',    'Profit & Loss'],
          ['/fi/bs',        'Balance Sheet',    'Financial Position'],
          ['/fi/gstr1',     'GSTR-1',           'Outward Supply'],
          ['/fi/gstr3b',    'GSTR-3B',          'Monthly Return'],
        ].map(([path,label,sub])=>(
          <div key={path} onClick={()=>nav(path)} style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:'12px 14px',cursor:'pointer',transition:'all .1s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#714B67';e.currentTarget.style.background='#FDF8FC'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#E0D5E0';e.currentTarget.style.background='#fff'}}>
            <div style={{fontWeight:700,color:'#333',fontSize:13}}>{label}</div>
            <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Default export (use named exports above for individual files)
