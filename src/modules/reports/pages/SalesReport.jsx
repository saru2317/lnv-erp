import React, { useState } from 'react'

const MONTHLY = [
  { m:'Apr 25', rev:3210000, orders:48, invoiced:2980000, collected:2760000, newCust:4, topCust:'Ashok Leyland' },
  { m:'May 25', rev:3612000, orders:52, invoiced:3450000, collected:3220000, newCust:3, topCust:'TVS Motors' },
  { m:'Jun 25', rev:2980000, orders:41, invoiced:2810000, collected:2640000, newCust:2, topCust:'Ashok Leyland' },
  { m:'Jul 25', rev:4120000, orders:61, invoiced:3980000, collected:3820000, newCust:5, topCust:'Sri Lakshmi Mills' },
  { m:'Aug 25', rev:3870000, orders:57, invoiced:3720000, collected:3510000, newCust:3, topCust:'Ashok Leyland' },
  { m:'Sep 25', rev:4450000, orders:63, invoiced:4280000, collected:4100000, newCust:6, topCust:'TVS Motors' },
  { m:'Oct 25', rev:3890000, orders:55, invoiced:3720000, collected:3540000, newCust:2, topCust:'Coimbatore Spinners' },
  { m:'Nov 25', rev:4210000, orders:59, invoiced:4050000, collected:3880000, newCust:4, topCust:'Ashok Leyland' },
  { m:'Dec 25', rev:3540000, orders:49, invoiced:3390000, collected:3240000, newCust:1, topCust:'TVS Motors' },
  { m:'Jan 26', rev:4320000, orders:63, invoiced:4150000, collected:3980000, newCust:5, topCust:'Ashok Leyland' },
  { m:'Feb 26', rev:4120000, orders:58, invoiced:3960000, collected:3780000, newCust:3, topCust:'Sri Lakshmi Mills' },
  { m:'Mar 26', rev:4860000, orders:68, invoiced:4640000, collected:4320000, newCust:7, topCust:'Ashok Leyland' },
]

const CUSTOMERS = [
  { name:'Ashok Leyland',       cat:'Auto OEM',    orders:24, rev:5840000, collected:4988000, due:852000,  lastOrder:'14 Mar 26' },
  { name:'TVS Motors',           cat:'Auto OEM',    orders:18, rev:4210000, collected:4210000, due:0,       lastOrder:'12 Mar 26' },
  { name:'Sri Lakshmi Mills',    cat:'Textile',     orders:15, rev:3620000, collected:2980000, due:640000,  lastOrder:'10 Mar 26' },
  { name:'Coimbatore Spinners',  cat:'Textile',     orders:12, rev:2480000, collected:2120000, due:360000,  lastOrder:'08 Mar 26' },
  { name:'Rajesh Textiles',      cat:'Textile',     orders:9,  rev:1840000, collected:1840000, due:0,       lastOrder:'06 Mar 26' },
  { name:'ARS Cotton Mills',     cat:'Textile',     orders:8,  rev:1620000, collected:1380000, due:240000,  lastOrder:'05 Mar 26' },
  { name:'Vijay Fabrics',        cat:'Garments',    orders:6,  rev:980000,  collected:980000,  due:0,       lastOrder:'03 Mar 26' },
  { name:'Karan Industries',     cat:'Engineering', orders:5,  rev:840000,  collected:720000,  due:120000,  lastOrder:'01 Mar 26' },
]

const CATEGORY = [
  { cat:'Powder Coating',  orders:124, rev:12480000, pct:46 },
  { cat:'Surface Treatment',orders:86, rev:7820000,  pct:29 },
  { cat:'Epoxy Coating',   orders:52,  rev:4340000,  pct:16 },
  { cat:'Zinc Plating',    orders:28,  rev:2160000,  pct:8  },
  { cat:'Other Services',  orders:14,  rev:320000,   pct:1  },
]

const fmt = n => '₹' + n.toLocaleString('en-IN')
const fmtL = n => '₹' + (n/100000).toFixed(1) + 'L'

export default function SalesReport() {
  const [period, setPeriod]   = useState('monthly')
  const [view,   setView]     = useState('summary')
  const maxRev = Math.max(...MONTHLY.map(m=>m.rev))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Sales Report <small>SD Module · Revenue Analytics</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" value={period} onChange={e=>setPeriod(e.target.value)}>
            <option value="monthly">FY 2025-26 Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Year on Year</option>
          </select>
          <button className="btn btn-s sd-bsm">⬇️ Export Excel</button>
          <button className="btn btn-s sd-bsm">🖨️ Print</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:16}}>
        {[
          {cls:'purple',l:'Total Revenue FY',   v:'₹4.72Cr', s:'Apr 25 – Mar 26'},
          {cls:'green', l:'Total Orders',        v:'694',     s:'All customers'},
          {cls:'blue',  l:'Avg Order Value',     v:'₹68,012', s:'Per order'},
          {cls:'orange',l:'Collection Efficiency',v:'93.8%',  s:'Of invoiced amount'},
          {cls:'red',   l:'Outstanding AR',      v:'₹21.2L',  s:'Pending collection'},
        ].map(k=>(<div key={k.l} className={`fi-kpi-card ${k.cls}`}><div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div></div>))}
      </div>

      {/* View tabs */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {[['summary','📊 Monthly Summary'],['customers','👥 Customer-wise'],['category','🏷️ Category-wise']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)}
            style={{padding:'6px 16px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid var(--odoo-border)',background:view===k?'var(--odoo-purple)':'#fff',
              color:view===k?'#fff':'var(--odoo-gray)'}}>
            {l}
          </button>
        ))}
      </div>

      {/* Monthly Summary */}
      {view==='summary' && (
        <div>
          {/* Sparkline chart */}
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',
            padding:18,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <h4 style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,marginBottom:14}}>
              📈 Monthly Revenue Trend — FY 2025-26
            </h4>
            <div style={{display:'flex',gap:6,alignItems:'flex-end',height:120}}>
              {MONTHLY.map((m,i)=>{
                const h = (m.rev/maxRev)*110
                const isLast = i===MONTHLY.length-1
                return (
                  <div key={m.m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                    <span style={{fontSize:9,color:isLast?'var(--odoo-purple)':'var(--odoo-gray)',fontWeight:isLast?700:400}}>{fmtL(m.rev)}</span>
                    <div style={{width:'100%',height:h,borderRadius:'4px 4px 0 0',
                      background:isLast?'var(--odoo-purple)':'#C4A4BB',transition:'height .5s'}}
                      title={`${m.m}: ${fmt(m.rev)}`}/>
                    <span style={{fontSize:9,color:isLast?'var(--odoo-purple)':'var(--odoo-gray)',fontWeight:isLast?700:400}}>{m.m}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <table className="fi-data-table">
            <thead>
              <tr>
                <th>Month</th><th>Orders</th><th>Revenue</th><th>Invoiced</th>
                <th>Collected</th><th>Collection %</th><th>New Customers</th><th>Top Customer</th>
              </tr>
            </thead>
            <tbody>
              {MONTHLY.map((m,i)=>{
                const collPct = ((m.collected/m.invoiced)*100).toFixed(1)
                return (
                  <tr key={m.m} style={{background:i===MONTHLY.length-1?'#EDE0EA':'',fontWeight:i===MONTHLY.length-1?700:400}}>
                    <td style={{fontWeight:600}}>{m.m}</td>
                    <td style={{textAlign:'center'}}>{m.orders}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)'}}>{fmtL(m.rev)}</td>
                    <td style={{fontFamily:'DM Mono,monospace'}}>{fmtL(m.invoiced)}</td>
                    <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>{fmtL(m.collected)}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{flex:1,height:5,background:'var(--odoo-border)',borderRadius:3}}>
                          <div style={{height:'100%',borderRadius:3,background:parseFloat(collPct)>95?'var(--odoo-green)':parseFloat(collPct)>85?'var(--odoo-orange)':'var(--odoo-red)',width:`${collPct}%`}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:600,minWidth:36}}>{collPct}%</span>
                      </div>
                    </td>
                    <td style={{textAlign:'center'}}>{m.newCust > 0 ? <span style={{color:'var(--odoo-green)',fontWeight:600}}>+{m.newCust}</span> : '—'}</td>
                    <td style={{fontSize:11}}>{m.topCust}</td>
                  </tr>
                )
              })}
              <tr style={{background:'var(--odoo-purple)',color:'#fff',fontWeight:700}}>
                <td style={{fontFamily:'Syne,sans-serif',padding:'10px 12px'}}>FY TOTAL</td>
                <td style={{textAlign:'center',padding:'10px 12px'}}>{MONTHLY.reduce((s,m)=>s+m.orders,0)}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:13,padding:'10px 12px'}}>₹4.72Cr</td>
                <td style={{fontFamily:'DM Mono,monospace',padding:'10px 12px'}}>₹4.51Cr</td>
                <td style={{fontFamily:'DM Mono,monospace',padding:'10px 12px'}}>₹4.23Cr</td>
                <td style={{padding:'10px 12px'}}>93.8%</td>
                <td style={{textAlign:'center',padding:'10px 12px'}}>45</td>
                <td style={{padding:'10px 12px'}}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Customer-wise */}
      {view==='customers' && (
        <table className="fi-data-table">
          <thead>
            <tr><th>Customer</th><th>Category</th><th>Orders</th><th>Revenue</th>
              <th>Collected</th><th>Outstanding</th><th>Last Order</th><th>Health</th></tr>
          </thead>
          <tbody>
            {CUSTOMERS.map(c=>(
              <tr key={c.name}>
                <td style={{fontWeight:700,fontSize:12}}>{c.name}</td>
                <td><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:'#EDE0EA',color:'var(--odoo-purple)'}}>{c.cat}</span></td>
                <td style={{textAlign:'center'}}>{c.orders}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)'}}>{fmtL(c.rev)}</td>
                <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>{fmtL(c.collected)}</td>
                <td style={{fontFamily:'DM Mono,monospace',color:c.due>0?'var(--odoo-red)':'var(--odoo-green)',fontWeight:c.due>0?700:400}}>
                  {c.due>0 ? fmtL(c.due) : '✅ Clear'}
                </td>
                <td style={{fontSize:11}}>{c.lastOrder}</td>
                <td>
                  <div style={{height:5,width:80,background:'var(--odoo-border)',borderRadius:3}}>
                    <div style={{height:'100%',borderRadius:3,background:c.due===0?'var(--odoo-green)':'var(--odoo-orange)',width:`${(c.collected/c.rev*100).toFixed(0)}%`}}/>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Category */}
      {view==='category' && (
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'var(--odoo-purple)'}}>{['Service Category','Orders','Revenue','Revenue %','Trend'].map(h=><th key={h} style={{padding:'10px 14px',fontSize:11,fontWeight:700,color:'#fff',textAlign:'left'}}>{h}</th>)}</tr></thead>
            <tbody>
              {CATEGORY.map((c,i)=>(
                <tr key={c.cat} style={{background:i%2===0?'#fff':'#F8F9FA',borderBottom:'1px solid var(--odoo-border)'}}>
                  <td style={{padding:'12px 14px',fontWeight:700,fontSize:12}}>{c.cat}</td>
                  <td style={{padding:'12px 14px',textAlign:'center'}}>{c.orders}</td>
                  <td style={{padding:'12px 14px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)'}}>{fmtL(c.rev)}</td>
                  <td style={{padding:'12px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:100,height:8,background:'var(--odoo-border)',borderRadius:4}}>
                        <div style={{height:'100%',borderRadius:4,background:'var(--odoo-purple)',width:`${c.pct}%`}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color:'var(--odoo-purple)'}}>{c.pct}%</span>
                    </div>
                  </td>
                  <td style={{padding:'12px 14px',color:'var(--odoo-green)',fontWeight:600,fontSize:12}}>▲ Stable</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
