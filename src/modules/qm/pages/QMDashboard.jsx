import React from 'react'
import { useNavigate } from 'react-router-dom'

const RECENT_LOTS = [
  {lot:'QIL-048',date:'28 Feb',mat:'Ring Yarn (30s)',qty:400,pass:394,fail:6,yield:98.5,ncr:'—',sb:'badge-pass'},
  {lot:'QIL-047',date:'27 Feb',mat:'OE Yarn (12s)',qty:588,pass:580,fail:8,yield:98.6,ncr:'NCR-018',sb:'badge-pass'},
  {lot:'QIL-046',date:'25 Feb',mat:'Ring Yarn (40s)',qty:384,pass:368,fail:16,yield:95.8,ncr:'NCR-017',sb:'badge-review'},
  {lot:'QIL-045',date:'23 Feb',mat:'Cotton Sliver',qty:792,pass:792,fail:0,yield:100,ncr:'—',sb:'badge-pass'},
]

const OPEN_NCRS = [
  {id:'NCR-019',mat:'Ring Yarn (30s)',issue:'Twist variation — CV% high',raised:'28 Feb',severity:'Major',sb:'badge-open'},
  {id:'NCR-018',mat:'OE Yarn (12s)',issue:'Nep count above limit',raised:'27 Feb',severity:'Minor',sb:'badge-wip'},
  {id:'NCR-017',mat:'Ring Yarn (40s)',issue:'Strength below spec — 16 Kg fail',raised:'25 Feb',severity:'Critical',sb:'badge-critical'},
]

export default function QMDashboard() {
  const nav = useNavigate()
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">QM Dashboard <small>Quality Overview · Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/report')}>📈 Quality Report</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/inspection/new')}>🔬 New Inspection</button>
        </div>
      </div>

      <div className="qm-kpi-grid">
        {[{cls:'green', ic:'🔬',l:'Overall Pass Rate', v:'97.4%', s:'842 lots inspected MTD'},
          {cls:'red',   ic:'❌',l:'Rejections (MTD)',  v:'62 Kg', s:'0.34% rejection rate'},
          {cls:'orange',ic:'📋',l:'Open NCRs',         v:'8',     s:'3 critical pending'},
          {cls:'blue',  ic:'🏅',l:'Certificates Issued',v:'48',   s:'All shipments covered'},
        ].map(k=>(
          <div key={k.l} className={`qm-kpi-card ${k.cls}`}>
            <div className="qm-kpi-icon">{k.ic}</div>
            <div className="qm-kpi-label">{k.l}</div>
            <div className="qm-kpi-value">{k.v}</div>
            <div className="qm-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Recent Inspections */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3>🔬 Recent Inspection Lots</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/inspection')}>View All</button>
          </div>
          <div style={{padding:'0'}}>
            <table className="fi-data-table" style={{margin:0}}>
              <thead><tr><th>Lot No.</th><th>Material</th><th>Yield %</th><th>NCR</th><th>Status</th></tr></thead>
              <tbody>
                {RECENT_LOTS.map(l=>(
                  <tr key={l.lot} style={{cursor:'pointer'}} onClick={() => nav('/qm/inspection')}>
                    <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{l.lot}</strong><div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{l.date} · {l.qty} Kg</div></td>
                    <td>{l.mat}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <div className="yield-bar" style={{width:'60px'}}>
                          <div className="yield-fill" style={{width:`${l.yield}%`,background:l.yield>=98?'var(--odoo-green)':l.yield>=95?'var(--odoo-orange)':'var(--odoo-red)'}}></div>
                        </div>
                        <span style={{fontSize:'11px',fontWeight:'700',color:l.yield>=98?'var(--odoo-green)':l.yield>=95?'var(--odoo-orange)':'var(--odoo-red)'}}>{l.yield}%</span>
                      </div>
                    </td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:l.ncr==='—'?'var(--odoo-gray)':'var(--odoo-red)',fontWeight:l.ncr==='—'?'400':'700'}}>{l.ncr}</td>
                    <td><span className={`badge ${l.sb}`}>{l.sb==='badge-pass'?'✅ Pass':l.sb==='badge-fail'?'❌ Fail':'⚠️ Review'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open NCRs */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3>❌ Open NCRs</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/ncr')}>View All</button>
          </div>
          <div className="fi-panel-body">
            {OPEN_NCRS.map(n=>(
              <div key={n.id} style={{padding:'10px',borderRadius:'6px',marginBottom:'8px',
                background:n.severity==='Critical'?'#FFF5F5':n.severity==='Major'?'#FFFBF0':'#F8F9FA',
                border:`1px solid ${n.severity==='Critical'?'#F5B7B1':n.severity==='Major'?'#FAD7A0':'var(--odoo-border)'}`,
                cursor:'pointer'}} onClick={() => nav('/qm/ncr')}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                  <strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{n.id}</strong>
                  <span className={`badge ${n.sb}`}>{n.severity}</span>
                </div>
                <div style={{fontSize:'12px',fontWeight:'600'}}>{n.mat}</div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginTop:'2px'}}>{n.issue}</div>
                <div style={{fontSize:'10px',color:'var(--odoo-gray)',marginTop:'3px'}}>Raised: {n.raised}</div>
              </div>
            ))}
            <button className="btn btn-p sd-bsm" style={{width:'100%',marginTop:'4px'}} onClick={() => nav('/qm/ncr/new')}>
              ➕ Raise New NCR
            </button>
          </div>
        </div>
      </div>

      {/* Yield Trend by Product */}
      <div className="fi-panel">
        <div className="fi-panel-hdr"><h3>📊 Yield by Product (Feb 2025)</h3></div>
        <div className="fi-panel-body">
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px'}}>
            {[{prod:'Ring Yarn (30s)',yield:98.5,lots:18,clr:'var(--odoo-purple)'},
              {prod:'Ring Yarn (40s)',yield:95.8,lots:12,clr:'var(--odoo-orange)'},
              {prod:'OE Yarn (12s)',yield:98.6,lots:8,clr:'var(--odoo-blue)'},
              {prod:'Compact Sliver',yield:99.2,lots:10,clr:'var(--odoo-green)'},
            ].map(p=>(
              <div key={p.prod} style={{background:'#F8F9FA',borderRadius:'8px',padding:'14px',textAlign:'center'}}>
                <div style={{fontSize:'12px',fontWeight:'700',color:'var(--odoo-dark)',marginBottom:'8px'}}>{p.prod}</div>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:'24px',fontWeight:'800',color:p.yield>=98?'var(--odoo-green)':p.yield>=95?'var(--odoo-orange)':'var(--odoo-red)'}}>{p.yield}%</div>
                <div className="yield-bar" style={{margin:'8px 0 4px'}}>
                  <div className="yield-fill" style={{width:`${p.yield}%`,background:p.clr}}></div>
                </div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{p.lots} lots inspected</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fi-panel">
        <div className="fi-panel-hdr"><h3>⚡ Quick Actions</h3></div>
        <div className="fi-panel-body" style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/inspection/new')}>🔬 New Inspection</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/ncr/new')}>❌ Raise NCR</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/capa/new')}>✅ New CAPA</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/certificates')}>🏅 Issue Certificate</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/vendor')}>⭐ Vendor Rating</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/report')}>📈 Quality Report</button>
        </div>
      </div>
    </div>
  )
}
