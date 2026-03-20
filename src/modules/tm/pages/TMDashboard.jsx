import React from 'react'
import { useNavigate } from 'react-router-dom'

const TODAY_TRIPS = [
  { id:'TRP-2026-048', type:'staff',  vehicle:'TN38 AB 1234 · Innova', driver:'Murugan D.', route:'Factory → Director Home', dept:'Management', purpose:'Director Drop', dept_type:'Staff', time:'06:00', ret:'20:00', status:'completed' },
  { id:'TRP-2026-049', type:'goods',  vehicle:'TN38 CD 5678 · Lorry',  driver:'Selvam D.', route:'Coimbatore → Chennai', dept:'Sales', purpose:'Delivery — Ashok Leyland', dept_type:'Delivery', time:'07:30', ret:'18:00', status:'transit' },
  { id:'TRP-2026-050', type:'purchase',vehicle:'TN38 EF 9012 · Mini Van',driver:'Rajan K.', route:'SIPCOT → Factory', dept:'Purchase', purpose:'RM Collection — Lakshmi Textile', dept_type:'Collection', time:'09:00', ret:'12:00', status:'completed' },
  { id:'TRP-2026-051', type:'staff',  vehicle:'TN38 GH 3456 · Bolero', driver:'Kumar V.', route:'Factory → Tirupur', dept:'Quality', purpose:'Client Visit — TVS Motors', dept_type:'Business', time:'10:00', ret:'17:00', status:'transit' },
  { id:'TRP-2026-052', type:'courier',vehicle:'TN38 IJ 7890 · Auto',   driver:'Dinesh R.', route:'Factory → Courier Hub', dept:'Dispatch', purpose:'BlueDart — 3 packages', dept_type:'Courier', time:'14:00', ret:'15:30', status:'planned' },
]

const VEHICLES = [
  { reg:'TN38 AB 1234', type:'Innova Crysta', cat:'Staff/Director', driver:'Murugan D.', fc:'Dec 2026', ins:'Mar 2026', tax:'Jun 2026', status:'active',      odo:48250, trips:3 },
  { reg:'TN38 CD 5678', type:'10T Lorry',     cat:'Goods Carrier',  driver:'Selvam D.',  fc:'Jun 2026', ins:'Oct 2026', tax:'Jun 2026', status:'transit',     odo:82100, trips:1 },
  { reg:'TN38 EF 9012', type:'Mini Van',       cat:'Multi Purpose',  driver:'Rajan K.',   fc:'Sep 2026', ins:'Dec 2026', tax:'Dec 2026', status:'active',      odo:31500, trips:2 },
  { reg:'TN38 GH 3456', type:'Bolero',         cat:'Staff/Business', driver:'Kumar V.',   fc:'Dec 2026', ins:'Jun 2026', tax:'Jun 2026', status:'transit',     odo:62800, trips:1 },
  { reg:'TN38 IJ 7890', type:'Auto / Bike',    cat:'Courier/Local',  driver:'Dinesh R.',  fc:'Mar 2026', ins:'Mar 2026', tax:'Mar 2026', status:'due_soon',   odo:18400, trips:5 },
]

const TRIP_STATUS = {
  completed: {label:' Completed',  bg:'#D4EDDA', color:'#155724'},
  transit:   {label:' In Transit', bg:'#D1ECF1', color:'#0C5460'},
  planned:   {label:' Planned',    bg:'#FFF3CD', color:'#856404'},
  cancelled: {label:' Cancelled',  bg:'#F8D7DA', color:'#721C24'},
}

const V_STATUS = {
  active:   {label:'🟢 Active',       bg:'#D4EDDA', color:'#155724'},
  transit:  {label:' On Trip',      bg:'#D1ECF1', color:'#0C5460'},
  due_soon: {label:' Docs Due',     bg:'#FFF3CD', color:'#856404'},
  maintenance:{label:' Maintenance',bg:'#F8D7DA', color:'#721C24'},
}

const TYPE_COLOR = {
  staff:    {bg:'#EDE0EA', color:'#714B67', icon:''},
  goods:    {bg:'#D1ECF1', color:'#0C5460', icon:''},
  purchase: {bg:'#D4EDDA', color:'#155724', icon:''},
  courier:  {bg:'#FFF3CD', color:'#856404', icon:''},
}

export default function TMDashboard() {
  const nav = useNavigate()
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Transport Dashboard <small>Today — {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/tm/booking')}>New Booking</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/tm/trip/new')}>New Trip Sheet</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:16}}>
        {[
          {cls:'purple', l:'Fleet Size',       v:'5',       s:'Total vehicles'},
          {cls:'green',  l:'Trips Today',       v:'5',       s:'2 in transit'},
          {cls:'blue',   l:'Fuel Cost MTD',     v:'₹42,000', s:'18 fill-ups'},
          {cls:'orange', l:'Docs Expiring',     v:'1',       s:'FC due in 30 days'},
          {cls:'red',    l:'Pending Bookings',  v:'3',       s:'Not yet allocated'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:16}}>
        {/* Today's trips */}
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--odoo-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h4 style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700,color:'var(--odoo-dark)'}}>Today's Trip Plan</h4>
            <button onClick={()=>nav('/tm/trips')} style={{fontSize:11,color:'var(--odoo-purple)',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>View All →</button>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#F8F9FA'}}>
                {['Trip No.','Type','Vehicle','Route / Purpose','Time','Status','Action'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',fontSize:11,fontWeight:700,color:'var(--odoo-gray)',textAlign:'left',borderBottom:'1px solid var(--odoo-border)'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TODAY_TRIPS.map(t=>{
                const st = TRIP_STATUS[t.status]
                const tc = TYPE_COLOR[t.type]
                return (
                  <tr key={t.id} style={{borderBottom:'1px solid var(--odoo-border)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FDF8FC'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)',fontWeight:600}}>{t.id}</td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:tc.bg,color:tc.color}}>
                        {tc.icon} {t.dept_type}
                      </span>
                    </td>
                    <td style={{padding:'9px 12px',fontSize:11}}>
                      <div style={{fontWeight:600,color:'var(--odoo-dark)'}}>{t.vehicle}</div>
                      <div style={{fontSize:10,color:'var(--odoo-gray)'}}>{t.driver}</div>
                    </td>
                    <td style={{padding:'9px 12px',fontSize:11,maxWidth:180}}>
                      <div style={{fontWeight:600,color:'var(--odoo-dark)'}}>{t.purpose}</div>
                      <div style={{fontSize:10,color:'var(--odoo-gray)'}}>{t.route}</div>
                    </td>
                    <td style={{padding:'9px 12px',fontSize:11,fontFamily:'DM Mono,monospace',whiteSpace:'nowrap'}}>
                      {t.time} – {t.ret}
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span>
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      {t.status==='transit' && <button className="btn-xs" onClick={()=>nav('/tm/trip/new')} style={{whiteSpace:'nowrap'}}>Close</button>}
                      {t.status==='planned' && <button className="btn-xs pri" style={{background:'var(--odoo-green)',color:'#fff',whiteSpace:'nowrap'}}>Dispatch</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Fleet status */}
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--odoo-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h4 style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700,color:'var(--odoo-dark)'}}> Fleet Status</h4>
            <button onClick={()=>nav('/tm/vehicles')} style={{fontSize:11,color:'var(--odoo-purple)',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>Manage →</button>
          </div>
          {VEHICLES.map(v=>{
            const vs = V_STATUS[v.status]
            return (
              <div key={v.reg} style={{padding:'10px 14px',borderBottom:'1px solid var(--odoo-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--odoo-dark)',fontFamily:'DM Mono,monospace'}}>{v.reg}</div>
                  <div style={{fontSize:11,color:'var(--odoo-gray)'}}>{v.type} · {v.cat}</div>
                  <div style={{fontSize:10,color:'var(--odoo-gray)',marginTop:2}}>{v.driver} · {v.odo.toLocaleString('en-IN')} km</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:vs.bg,color:vs.color,display:'block',marginBottom:3}}>{vs.label}</span>
                  <span style={{fontSize:9,color:'var(--odoo-gray)'}}>FC: {v.fc} | Ins: {v.ins}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <h4 style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--odoo-dark)',marginBottom:12}}> Quick Actions</h4>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
          {[
            {icon:'',label:'Staff Booking',      path:'/tm/booking', color:'#714B67'},
            {icon:'',label:'Goods Delivery',     path:'/tm/booking', color:'#017E84'},
            {icon:'',label:'RM Collection',      path:'/tm/booking', color:'#00A09D'},
            {icon:'',label:'Courier Booking',    path:'/tm/booking', color:'#856404'},
            {icon:'',label:'Fuel Entry',          path:'/tm/fuel',    color:'#E06F39'},
            {icon:'',label:'Vehicle Maintenance',path:'/tm/vehicles', color:'#D9534F'},
          ].map(qa=>(
            <div key={qa.label} onClick={()=>nav(qa.path)}
              style={{padding:'12px 8px',borderRadius:7,border:`2px solid ${qa.color}22`,
                background:`${qa.color}11`,cursor:'pointer',textAlign:'center',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background=`${qa.color}22`;e.currentTarget.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{e.currentTarget.style.background=`${qa.color}11`;e.currentTarget.style.transform=''}}>
              <div style={{fontSize:22,marginBottom:4}}>{qa.icon}</div>
              <div style={{fontSize:10,fontWeight:700,color:qa.color,lineHeight:1.3}}>{qa.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
