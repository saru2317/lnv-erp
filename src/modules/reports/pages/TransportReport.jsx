import React, { useState } from 'react'

const MONTHLY = [
  { m:'Oct', trips:42, km:18240, fuel:3648, fuelCost:335616, toll:12600, totalCost:348216 },
  { m:'Nov', trips:48, km:20880, fuel:4176, fuelCost:384192, toll:14400, totalCost:398592 },
  { m:'Dec', trips:38, km:16530, fuel:3306, fuelCost:304152, toll:11400, totalCost:315552 },
  { m:'Jan', trips:52, km:22620, fuel:4524, fuelCost:416208, toll:15600, totalCost:431808 },
  { m:'Feb', trips:46, km:20010, fuel:4002, fuelCost:368184, toll:13800, totalCost:381984 },
  { m:'Mar', trips:55, km:23925, fuel:4785, fuelCost:440220, toll:16500, totalCost:456720 },
]

const VEHICLES = [
  { reg:'TN38 AB 1234', type:'Innova Crysta', trips:18, km:7200, fuel:1152, fuelCost:105984, mileage:6.25, cost_km:14.7, status:'active' },
  { reg:'TN38 CD 5678', type:'10T Lorry',     trips:12, km:9840, fuel:2050, fuelCost:188600, mileage:4.8,  cost_km:19.2, status:'active' },
  { reg:'TN38 EF 9012', type:'Mini Van',       trips:14, km:4200, fuel:588,  fuelCost:54096,  mileage:7.14, cost_km:12.9, status:'active' },
  { reg:'TN38 GH 3456', type:'Bolero',         trips:8,  km:2100, fuel:294,  fuelCost:27048,  mileage:7.14, cost_km:12.9, status:'active' },
  { reg:'TN38 IJ 7890', type:'Auto/Bike',      trips:3,  km:585,  fuel:117,  fuelCost:9477,   mileage:5.0,  cost_km:16.2, status:'due_soon' },
]

const TRIP_TYPES = [
  { type:'Goods Delivery',   trips:22, km:12870, pct:54 },
  { type:'RM Collection',    trips:14, km:5740,  pct:24 },
  { type:'Staff Transport',  trips:12, km:3240,  pct:14 },
  { type:'Courier / Local',  trips:7,  km:2075,  pct:8  },
]

const fmtL = n => '₹' + (n / 100000).toFixed(1) + 'L'
const fmt  = n => '₹' + n.toLocaleString('en-IN')

export default function TransportReport() {
  const [view, setView] = useState('monthly')
  const last = MONTHLY[MONTHLY.length - 1]

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Transport Report <small>TM Module · Fleet Analytics</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>FY 2025-26</option><option>Q4 FY26</option></select>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{ gridTemplateColumns:'repeat(5,1fr)', marginBottom:16 }}>
        {[
          { cls:'purple', l:'Trips MTD',         v:last.trips,                   s:'Mar 2026'      },
          { cls:'blue',   l:'Total KMs',          v:last.km.toLocaleString('en-IN'), s:'This month' },
          { cls:'orange', l:'Fuel Cost MTD',      v:fmtL(last.fuelCost),          s:'All vehicles'  },
          { cls:'green',  l:'Total Fleet Cost',   v:fmtL(last.totalCost),         s:'Incl. toll'    },
          { cls:'red',    l:'Fuel Consumed',      v:last.fuel+' L',               s:'This month'    },
        ].map(k => (
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[['monthly','📊 Monthly Trend'],['vehicles','🚗 Vehicle-wise'],['triptype','🗺️ Trip Type']].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)}
            style={{ padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600,
              cursor:'pointer', border:'1px solid var(--odoo-border)',
              background: view===k ? 'var(--odoo-purple)' : '#fff',
              color: view===k ? '#fff' : 'var(--odoo-gray)' }}>
            {l}
          </button>
        ))}
      </div>

      {view === 'monthly' && (
        <table className="fi-data-table">
          <thead>
            <tr><th>Month</th><th>Trips</th><th>Total KMs</th><th>Fuel (L)</th>
              <th>Fuel Cost</th><th>Toll</th><th>Total Cost</th><th>Cost/KM</th></tr>
          </thead>
          <tbody>
            {MONTHLY.map((m, i) => (
              <tr key={m.m} style={{ background: i===MONTHLY.length-1?'#EDE0EA':'', fontWeight: i===MONTHLY.length-1?700:400 }}>
                <td style={{ fontWeight:600 }}>{m.m}</td>
                <td style={{ textAlign:'center' }}>{m.trips}</td>
                <td style={{ fontFamily:'DM Mono,monospace', textAlign:'right' }}>{m.km.toLocaleString('en-IN')}</td>
                <td style={{ fontFamily:'DM Mono,monospace', textAlign:'right', color:'var(--odoo-blue)' }}>{m.fuel.toLocaleString('en-IN')} L</td>
                <td style={{ fontFamily:'DM Mono,monospace', textAlign:'right', color:'var(--odoo-orange)', fontWeight:600 }}>{fmtL(m.fuelCost)}</td>
                <td style={{ fontFamily:'DM Mono,monospace', textAlign:'right' }}>{fmt(m.toll)}</td>
                <td style={{ fontFamily:'DM Mono,monospace', textAlign:'right', fontWeight:700, color:'var(--odoo-purple)' }}>{fmtL(m.totalCost)}</td>
                <td style={{ fontFamily:'DM Mono,monospace', textAlign:'right', color:'var(--odoo-gray)' }}>
                  ₹{(m.totalCost / m.km).toFixed(1)}/km
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view === 'vehicles' && (
        <table className="fi-data-table">
          <thead>
            <tr><th>Vehicle</th><th>Type</th><th>Trips</th><th>KMs</th>
              <th>Fuel (L)</th><th>Fuel Cost</th><th>Mileage</th><th>Cost/KM</th><th>Status</th></tr>
          </thead>
          <tbody>
            {VEHICLES.map(v => (
              <tr key={v.reg}>
                <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)', fontSize:12 }}>{v.reg}</td>
                <td style={{ fontSize:11 }}>{v.type}</td>
                <td style={{ textAlign:'center' }}>{v.trips}</td>
                <td style={{ fontFamily:'DM Mono,monospace', textAlign:'right' }}>{v.km.toLocaleString('en-IN')}</td>
                <td style={{ fontFamily:'DM Mono,monospace', textAlign:'right', color:'var(--odoo-blue)' }}>{v.fuel} L</td>
                <td style={{ fontFamily:'DM Mono,monospace', textAlign:'right', fontWeight:700 }}>{fmtL(v.fuelCost)}</td>
                <td style={{ textAlign:'center', fontWeight:700,
                  color: v.mileage > 6.5 ? 'var(--odoo-green)' : v.mileage > 5 ? 'var(--odoo-orange)' : 'var(--odoo-red)' }}>
                  {v.mileage} km/L
                </td>
                <td style={{ fontFamily:'DM Mono,monospace', textAlign:'right', color:'var(--odoo-gray)' }}>
                  ₹{v.cost_km}/km
                </td>
                <td>
                  <span style={{ padding:'3px 8px', borderRadius:10, fontSize:11, fontWeight:600,
                    background: v.status==='active'?'#D4EDDA':'#FFF3CD',
                    color: v.status==='active'?'#155724':'#856404' }}>
                    {v.status==='active'?'Active':'Docs Due'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view === 'triptype' && (
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--odoo-purple)' }}>
                {['Trip Type','No. of Trips','Total KMs','% Share','Distribution'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', color:'#fff', fontSize:11,
                    fontWeight:700, textAlign:'left', border:'1px solid #5A3A56' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRIP_TYPES.map((t, i) => (
                <tr key={t.type} style={{ background: i%2===0?'#fff':'#FAFAFA', borderBottom:'1px solid var(--odoo-border)' }}>
                  <td style={{ padding:'12px 14px', fontWeight:700, fontSize:12 }}>{t.type}</td>
                  <td style={{ padding:'12px 14px', textAlign:'center', fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:13 }}>{t.trips}</td>
                  <td style={{ padding:'12px 14px', fontFamily:'DM Mono,monospace', fontWeight:600 }}>{t.km.toLocaleString('en-IN')} km</td>
                  <td style={{ padding:'12px 14px', textAlign:'center', fontWeight:700, color:'var(--odoo-purple)' }}>{t.pct}%</td>
                  <td style={{ padding:'12px 14px', minWidth:200 }}>
                    <div style={{ height:10, background:'var(--odoo-border)', borderRadius:5 }}>
                      <div style={{ height:'100%', borderRadius:5, background:'var(--odoo-purple)', width: t.pct+'%' }} />
                    </div>
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
