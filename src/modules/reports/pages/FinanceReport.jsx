import React from 'react'
import { useNavigate } from 'react-router-dom'
export default function FinanceReport() {
  const nav = useNavigate()
  const titles = {HRReport:'HR Report', QualityReport:'Quality Report', TransportReport:'Transport Report', FinanceReport:'Finance Report'}
  const links = {
    HRReport: '/hcm', QualityReport: '/qm',
    TransportReport: '/tm', FinanceReport: '/fi'
  }
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">{titles['FinanceReport']} <small>Cross-module analytics</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={()=>nav(links['FinanceReport'])}>
            Open Full Module →
          </button>
        </div>
      </div>
      <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:32,textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{fontSize:48,marginBottom:12}}>📊</div>
        <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:'var(--odoo-dark)',marginBottom:8}}>{titles['FinanceReport']}</div>
        <div style={{fontSize:13,color:'var(--odoo-gray)',marginBottom:20}}>Detailed analytics available in the module — click below to view</div>
        <button className="btn btn-p sd-bsm" onClick={()=>nav(links['FinanceReport'])} style={{fontSize:13,padding:'10px 24px'}}>
          Open {titles['FinanceReport']} Module →
        </button>
      </div>
    </div>
  )
}
