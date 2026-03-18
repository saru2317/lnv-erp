import React from 'react'

const MONTHLY_KPI = [
  {mc:'WND-01',bds:3,downtime:28,mttr:9.3,mtbf:96,avail:94.2,pmDue:0,clr:'var(--odoo-red)'},
  {mc:'SPG-01',bds:1,downtime:3,mttr:3.0,mtbf:168,avail:98.8,pmDue:28,clr:'var(--odoo-orange)'},
  {mc:'SPG-02',bds:0,downtime:0,mttr:0,mtbf:999,avail:100,pmDue:0,clr:'var(--odoo-green)'},
  {mc:'OE-01', bds:0,downtime:0,mttr:0,mtbf:999,avail:100,pmDue:0,clr:'var(--odoo-green)'},
  {mc:'OE-02', bds:1,downtime:6,mttr:6.0,mtbf:144,avail:97.5,pmDue:0,clr:'var(--odoo-orange)'},
  {mc:'CRD-01',bds:0,downtime:0,mttr:0,mtbf:999,avail:100,pmDue:0,clr:'var(--odoo-green)'},
  {mc:'BLW-01',bds:1,downtime:2,mttr:2.0,mtbf:192,avail:99.2,pmDue:0,clr:'var(--odoo-green)'},
  {mc:'DRW-01',bds:0,downtime:0,mttr:0,mtbf:999,avail:100,pmDue:0,clr:'var(--odoo-green)'},
]

export default function PMReport() {
  const totalBDs = MONTHLY_KPI.reduce((s,m)=>s+m.bds,0)
  const totalDown = MONTHLY_KPI.reduce((s,m)=>s+m.downtime,0)
  const avgAvail = (MONTHLY_KPI.reduce((s,m)=>s+m.avail,0)/MONTHLY_KPI.length).toFixed(1)
  const avgMTBF = Math.round(MONTHLY_KPI.filter(m=>m.mtbf<999).reduce((s,m)=>s+m.mtbf,0)/MONTHLY_KPI.filter(m=>m.mtbf<999).length)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">PM Summary Report <small>February 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export PDF</button>
          <button className="btn btn-s sd-bsm">📧 Email Report</button>
        </div>
      </div>

      <div className="pm-kpi-grid">
        {[{cls:'red',   ic:'🔴',l:'Breakdowns (MTD)',v:totalBDs,s:'WND-01 worst performer'},
          {cls:'orange',ic:'⏱️',l:'Total Downtime',  v:`${totalDown} hrs`,s:'Production loss: ~₹4.2L'},
          {cls:'blue',  ic:'📊',l:'Avg MTBF',        v:`${avgMTBF} hrs`,s:'Target: ≥ 168 hrs'},
          {cls:'green', ic:'🏭',l:'Plant Availability',v:`${avgAvail}%`,s:'Target: ≥ 97%'},
        ].map(k=>(
          <div key={k.l} className={`pm-kpi-card ${k.cls}`}>
            <div className="pm-kpi-icon">{k.ic}</div>
            <div className="pm-kpi-label">{k.l}</div>
            <div className="pm-kpi-value">{k.v}</div>
            <div className="pm-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      {/* PM Compliance */}
      <div className="fi-panel-grid">
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📅 PM Compliance — Feb 2025</h3></div>
          <div className="fi-panel-body">
            {[['Scheduled PMs',8],['Completed on Time',5],['Overdue / Missed',3],['PM Compliance %','62.5%']].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                <span style={{fontSize:'13px',fontWeight:'600'}}>{l}</span>
                <strong style={{color:l.includes('%')?(parseFloat(v)<80?'var(--odoo-orange)':'var(--odoo-green)'):'var(--odoo-dark)'}}>{v}</strong>
              </div>
            ))}
            <div style={{marginTop:'12px',background:'#FFF3CD',borderRadius:'6px',padding:'10px',fontSize:'12px',color:'#856404'}}>
              ⚠️ PM compliance is below target (80%). SPG-01 and CB-01 are overdue.
            </div>
          </div>
        </div>

        {/* Availability by machine */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>🏭 Machine Availability</h3></div>
          <div className="fi-panel-body">
            {MONTHLY_KPI.map(m=>(
              <div key={m.mc} style={{marginBottom:'10px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'3px'}}>
                  <strong>{m.mc}</strong>
                  <span style={{fontWeight:'700',color:m.avail>=98?'var(--odoo-green)':m.avail>=95?'var(--odoo-orange)':'var(--odoo-red)'}}>{m.avail}%</span>
                </div>
                <div style={{background:'#F0EEEB',borderRadius:'4px',height:'7px'}}>
                  <div style={{width:`${m.avail}%`,height:'100%',borderRadius:'4px',
                    background:m.avail>=98?'var(--odoo-green)':m.avail>=95?'var(--odoo-orange)':'var(--odoo-red)'}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Machine-wise KPI Table */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📋 Machine-wise Reliability KPIs — Feb 2025</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr>
              <th>Machine</th><th>Breakdowns</th><th>Downtime (hrs)</th>
              <th>MTTR (hrs)</th><th>MTBF (hrs)</th><th>Availability</th><th>PM Overdue</th>
            </tr></thead>
            <tbody>
              {MONTHLY_KPI.map(m=>(
                <tr key={m.mc} style={{background:m.avail<95?'#FFF5F5':m.avail<98?'#FFFBF0':'inherit'}}>
                  <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{m.mc}</strong></td>
                  <td style={{textAlign:'center',fontWeight:'700',color:m.bds>0?'var(--odoo-red)':'var(--odoo-green)'}}>{m.bds||'—'}</td>
                  <td style={{textAlign:'center',fontWeight:'700',color:m.downtime>0?'var(--odoo-orange)':'var(--odoo-green)'}}>{m.downtime||'—'}</td>
                  <td style={{textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{m.mttr||'—'}</td>
                  <td style={{textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:'12px',color:m.mtbf<120?'var(--odoo-red)':m.mtbf<168?'var(--odoo-orange)':'var(--odoo-green)'}}>
                    {m.mtbf===999?'No BD':m.mtbf}
                  </td>
                  <td>
                    <span style={{fontWeight:'700',color:m.avail>=98?'var(--odoo-green)':m.avail>=95?'var(--odoo-orange)':'var(--odoo-red)'}}>{m.avail}%</span>
                  </td>
                  <td style={{color:m.pmDue>0?'var(--odoo-red)':'var(--odoo-green)',fontWeight:'700',textAlign:'center'}}>
                    {m.pmDue>0?`${m.pmDue}d`:'—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:'#F8F9FA',fontWeight:'700'}}>
                <td>Plant Total</td>
                <td style={{textAlign:'center',color:'var(--odoo-red)'}}>{totalBDs}</td>
                <td style={{textAlign:'center',color:'var(--odoo-orange)'}}>{totalDown}</td>
                <td style={{textAlign:'center'}}>—</td>
                <td style={{textAlign:'center',fontFamily:'DM Mono,monospace'}}>{avgMTBF} avg</td>
                <td style={{color:'var(--odoo-green)'}}>{avgAvail}% avg</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
