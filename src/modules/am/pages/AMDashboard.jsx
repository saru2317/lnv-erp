import React from 'react'
import { useNavigate } from 'react-router-dom'

const ASSET_CATS = [
  { cat:'Plant & Machinery',   count:28, gross:32000000, depr:6400000, net:25600000, method:'SLM 10%' },
  { cat:'Electrical Equipment',count:42, gross:4800000,  depr:960000,  net:3840000,  method:'SLM 15%' },
  { cat:'Computers & IT',      count:38, gross:1200000,  depr:600000,  net:600000,   method:'WDV 33%' },
  { cat:'Furniture & Fixtures',count:34, gross:600000,   depr:60000,   net:540000,   method:'SLM 10%' },
  { cat:'Vehicles',            count:5,  gross:3500000,  depr:700000,  net:2800000,  method:'WDV 15%' },
]

const PROPERTIES = [
  { name:'Main Factory Building',  type:'Factory',  area:'18,000 sqft', value:12000000, status:'Owned' },
  { name:'Admin & Office Block',   type:'Office',   area:'3,200 sqft',  value:2500000,  status:'Owned' },
  { name:'Godown / Warehouse',     type:'Warehouse',area:'5,500 sqft',  value:3000000,  status:'Leased', rent:'₹45,000/mo' },
]

const fmt = (n) => '₹' + (n/100000).toFixed(1) + 'L'

export default function AMDashboard() {
  const nav = useNavigate()
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Asset Management Dashboard</div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/am/depreciation')}>📉 Run Depreciation</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/am/assets')}>+ Add Asset</button>
        </div>
      </div>
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:16}}>
        {[
          {cls:'purple',l:'Total Assets',      v:'147',       s:'All categories'},
          {cls:'green', l:'Gross Block',        v:'₹4.21Cr',   s:'Purchase value'},
          {cls:'blue',  l:'Net Block',          v:'₹3.34Cr',   s:'After depreciation'},
          {cls:'orange',l:'Monthly Depr.',      v:'₹3.5L',     s:'Current month'},
          {cls:'red',   l:'For Disposal',       v:'4',         s:'Pending approval'},
        ].map(k=>(<div key={k.l} className={`fi-kpi-card ${k.cls}`}><div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div></div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:16}}>
        {/* Asset category table */}
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--odoo-border)',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700}}>🏭 Company Assets by Category</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#F8F9FA'}}>{['Category','Count','Gross Value','Acc. Depr.','Net Value','Method'].map(h=>(<th key={h} style={{padding:'8px 12px',fontSize:11,fontWeight:700,color:'var(--odoo-gray)',textAlign:'left',borderBottom:'1px solid var(--odoo-border)'}}>{h}</th>))}</tr></thead>
            <tbody>
              {ASSET_CATS.map(a=>(<tr key={a.cat} style={{borderBottom:'1px solid var(--odoo-border)',cursor:'pointer'}} onClick={()=>nav('/am/assets')}
                onMouseEnter={e=>e.currentTarget.style.background='#FDF8FC'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                <td style={{padding:'10px 12px',fontWeight:600,fontSize:12}}>{a.cat}</td>
                <td style={{padding:'10px 12px',textAlign:'center'}}>{a.count}</td>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12}}>{fmt(a.gross)}</td>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-red)'}}>{fmt(a.depr)}</td>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:'var(--odoo-green)'}}>{fmt(a.net)}</td>
                <td style={{padding:'10px 12px',fontSize:11,color:'var(--odoo-gray)'}}>{a.method}</td>
              </tr>))}
              <tr style={{background:'#EDE0EA',fontWeight:700}}>
                <td style={{padding:'10px 12px',fontFamily:'Syne,sans-serif',fontSize:12}}>TOTAL</td>
                <td style={{padding:'10px 12px',textAlign:'center',fontFamily:'DM Mono,monospace'}}>{ASSET_CATS.reduce((s,a)=>s+a.count,0)}</td>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12}}>₹4.21Cr</td>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-red)'}}>₹0.87Cr</td>
                <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontSize:13,color:'var(--odoo-purple)'}}>₹3.34Cr</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Property */}
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--odoo-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700}}>🏢 Company Properties</span>
            <button onClick={()=>nav('/am/property')} style={{fontSize:11,color:'var(--odoo-purple)',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>Manage →</button>
          </div>
          {PROPERTIES.map(p=>(<div key={p.name} style={{padding:'12px 16px',borderBottom:'1px solid var(--odoo-border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'var(--odoo-dark)'}}>{p.name}</div>
                <div style={{fontSize:11,color:'var(--odoo-gray)',marginTop:2}}>{p.type} · {p.area}</div>
                {p.rent && <div style={{fontSize:11,color:'#856404',marginTop:2}}>Rent: {p.rent}</div>}
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:13,fontWeight:700,fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)'}}>₹{(p.value/100000).toFixed(1)}L</div>
                <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:p.status==='Owned'?'#D4EDDA':'#FFF3CD',color:p.status==='Owned'?'#155724':'#856404'}}>{p.status}</span>
              </div>
            </div>
          </div>))}
        </div>
      </div>
    </div>
  )
}
