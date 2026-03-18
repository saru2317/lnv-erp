import React, { useState } from 'react'

const VENDORS = [
  { name:'Lakshmi Textile Mills',  cat:'Raw Material', pos:18, pov:10420000, grn:8580000, inv:8580000, paid:7160000, due:1420000, onTime:82 },
  { name:'Coimbatore Spares Co.',  cat:'Spares',        pos:14, pov:4850000,  grn:4850000, inv:4850000, paid:3965000, due:885000,  onTime:95 },
  { name:'Sri Murugan Traders',    cat:'Consumables',   pos:11, pov:7360000,  grn:7360000, inv:7360000, paid:6998000, due:362000,  onTime:100 },
  { name:'Aruna Industries',       cat:'Packaging',     pos:9,  pov:3880000,  grn:2605000, inv:2605000, paid:2605000, due:0,       onTime:75 },
  { name:'KG Denim Ltd.',          cat:'Raw Material',  pos:6,  pov:1890000,  grn:1210000, inv:0,       paid:0,       due:1210000, onTime:50 },
  { name:'Chennai Cargo Pvt Ltd',  cat:'Logistics',     pos:22, pov:1240000,  grn:1240000, inv:1240000, paid:1240000, due:0,       onTime:98 },
]

const MONTHLY = [
  {m:'Apr 25', pos:14, pov:2140000, grn:1980000, paid:1860000},
  {m:'May 25', pos:16, pov:2580000, grn:2410000, paid:2280000},
  {m:'Jun 25', pos:12, pov:1980000, grn:1820000, paid:1720000},
  {m:'Jul 25', pos:18, pov:2940000, grn:2780000, paid:2640000},
  {m:'Aug 25', pos:15, pov:2680000, grn:2510000, paid:2380000},
  {m:'Sep 25', pos:20, pov:3120000, grn:2980000, paid:2840000},
  {m:'Oct 25', pos:17, pov:2860000, grn:2690000, paid:2550000},
  {m:'Nov 25', pos:19, pov:2980000, grn:2820000, paid:2680000},
  {m:'Dec 25', pos:13, pov:2240000, grn:2100000, paid:1980000},
  {m:'Jan 26', pos:21, pov:3240000, grn:3080000, paid:2920000},
  {m:'Feb 26', pos:18, pov:3100000, grn:2940000, paid:2780000},
  {m:'Mar 26', pos:23, pov:2840000, grn:2650000, paid:2480000},
]

const fmtL = n => '₹' + (n/100000).toFixed(1) + 'L'
const maxPov = Math.max(...MONTHLY.map(m=>m.pov))

export default function PurchaseReport() {
  const [view, setView] = useState('monthly')
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Purchase Report <small>MM Module · Vendor Analytics</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>FY 2025-26</option><option>Q4 FY26</option></select>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:16}}>
        {[
          {cls:'blue',  l:'Total POs FY',       v:'196',      s:'All vendors'},
          {cls:'purple',l:'Purchase Value',      v:'₹3.22Cr',  s:'FY 2025-26'},
          {cls:'green', l:'GRN Done',            v:'₹3.06Cr',  s:'95% of PO value'},
          {cls:'orange',l:'Pending Payment',     v:'₹38.8L',   s:'Outstanding AP'},
          {cls:'blue',  l:'On-time Delivery',    v:'87.4%',    s:'Vendor performance'},
        ].map(k=>(<div key={k.l} className={`fi-kpi-card ${k.cls}`}><div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div></div>))}
      </div>

      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {[['monthly','📊 Monthly Trend'],['vendors','🏭 Vendor-wise'],['pending','⚠️ Pending GRN']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)}
            style={{padding:'6px 16px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid var(--odoo-border)',background:view===k?'var(--odoo-purple)':'#fff',
              color:view===k?'#fff':'var(--odoo-gray)'}}>
            {l}
          </button>
        ))}
      </div>

      {view==='monthly' && (
        <div>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:18,marginBottom:14}}>
            <h4 style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,marginBottom:14}}>Monthly Purchase Trend</h4>
            <div style={{display:'flex',gap:6,alignItems:'flex-end',height:110}}>
              {MONTHLY.map((m,i)=>{
                const h=(m.pov/maxPov)*100
                const isLast=i===MONTHLY.length-1
                return(
                  <div key={m.m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                    <div style={{width:'100%',height:h,borderRadius:'4px 4px 0 0',background:isLast?'var(--odoo-blue)':'#A8C4D4'}}/>
                    <span style={{fontSize:9,color:isLast?'var(--odoo-blue)':'var(--odoo-gray)',fontWeight:isLast?700:400}}>{m.m}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <table className="fi-data-table">
            <thead><tr><th>Month</th><th>POs</th><th>PO Value</th><th>GRN Value</th><th>GRN %</th><th>Paid</th></tr></thead>
            <tbody>
              {MONTHLY.map((m,i)=>(
                <tr key={m.m} style={{background:i===MONTHLY.length-1?'#D1ECF1':'',fontWeight:i===MONTHLY.length-1?700:400}}>
                  <td style={{fontWeight:600}}>{m.m}</td>
                  <td style={{textAlign:'center'}}>{m.pos}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-blue)'}}>{fmtL(m.pov)}</td>
                  <td style={{fontFamily:'DM Mono,monospace'}}>{fmtL(m.grn)}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:60,height:5,background:'var(--odoo-border)',borderRadius:3}}>
                        <div style={{height:'100%',borderRadius:3,background:'var(--odoo-green)',width:`${(m.grn/m.pov*100).toFixed(0)}%`}}/>
                      </div>
                      <span style={{fontSize:11}}>{(m.grn/m.pov*100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>{fmtL(m.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view==='vendors' && (
        <table className="fi-data-table">
          <thead><tr><th>Vendor</th><th>Category</th><th>POs</th><th>PO Value</th><th>GRN</th><th>Invoiced</th><th>Paid</th><th>Outstanding</th><th>On-time %</th></tr></thead>
          <tbody>
            {VENDORS.map(v=>(
              <tr key={v.name}>
                <td style={{fontWeight:700,fontSize:12}}>{v.name}</td>
                <td style={{fontSize:11}}>{v.cat}</td>
                <td style={{textAlign:'center'}}>{v.pos}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-blue)'}}>{fmtL(v.pov)}</td>
                <td style={{fontFamily:'DM Mono,monospace'}}>{fmtL(v.grn)}</td>
                <td style={{fontFamily:'DM Mono,monospace'}}>{v.inv>0?fmtL(v.inv):'—'}</td>
                <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>{v.paid>0?fmtL(v.paid):'—'}</td>
                <td style={{fontFamily:'DM Mono,monospace',color:v.due>0?'var(--odoo-red)':'var(--odoo-green)',fontWeight:v.due>0?700:400}}>
                  {v.due>0?fmtL(v.due):'✅ Nil'}
                </td>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:60,height:5,background:'var(--odoo-border)',borderRadius:3}}>
                      <div style={{height:'100%',borderRadius:3,background:v.onTime>90?'var(--odoo-green)':v.onTime>75?'var(--odoo-orange)':'var(--odoo-red)',width:`${v.onTime}%`}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:600}}>{v.onTime}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view==='pending' && (
        <div>
          <div className="fi-alert warn" style={{marginBottom:14}}>⚠️ These POs have been raised but GRN is pending. Follow up with vendors.</div>
          <table className="fi-data-table">
            <thead><tr><th>PO No.</th><th>Vendor</th><th>PO Date</th><th>PO Value</th><th>GRN Done</th><th>Pending</th><th>Days Overdue</th></tr></thead>
            <tbody>
              {[
                {po:'PO-2026-0089',vendor:'Lakshmi Textile Mills', date:'01 Mar',pov:2840000,grn:0,     days:16},
                {po:'PO-2026-0085',vendor:'KG Denim Ltd.',         date:'05 Feb',pov:1210000,grn:0,     days:40},
                {po:'PO-2026-0082',vendor:'Aruna Industries',      date:'10 Mar',pov:1275000,grn:780000,days:7},
              ].map(r=>(
                <tr key={r.po}>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)',fontWeight:600}}>{r.po}</td>
                  <td style={{fontWeight:600,fontSize:12}}>{r.vendor}</td>
                  <td>{r.date}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700}}>{fmtL(r.pov)}</td>
                  <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>{r.grn>0?fmtL(r.grn):'—'}</td>
                  <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-red)',fontWeight:700}}>{fmtL(r.pov-r.grn)}</td>
                  <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:r.days>30?'#F8D7DA':'#FFF3CD',color:r.days>30?'#721C24':'#856404'}}>{r.days} days</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
