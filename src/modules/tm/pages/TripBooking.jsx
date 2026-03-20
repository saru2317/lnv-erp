import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const VEHICLES = [
  {id:'V1', reg:'TN38 AB 1234', type:'Innova Crysta',  cat:'Staff/Director', cap:'7 Pax',    driver:'Murugan D.',  status:'available'},
  {id:'V2', reg:'TN38 CD 5678', type:'10T Lorry',      cat:'Goods Carrier',  cap:'10 Tonnes',driver:'Selvam D.',   status:'on_trip'},
  {id:'V3', reg:'TN38 EF 9012', type:'Mini Van',        cat:'Multi Purpose',  cap:'5 Pax / 1T',driver:'Rajan K.',  status:'available'},
  {id:'V4', reg:'TN38 GH 3456', type:'Bolero',          cat:'Staff/Business', cap:'7 Pax',    driver:'Kumar V.',   status:'available'},
  {id:'V5', reg:'TN38 IJ 7890', type:'Auto / Bike',     cat:'Courier/Local',  cap:'50 kg',    driver:'Dinesh R.',  status:'available'},
]

const PENDING_BOOKINGS = [
  { id:'BK-2026-041', type:'staff',    date:'17 Mar', reqBy:'Saravana Kumar', dept:'Admin',    purpose:'Director pickup — Airport',    from:'Factory',        to:'CBE Airport',  time:'06:00', passengers:'2', vehicle:null, status:'pending' },
  { id:'BK-2026-042', type:'delivery', date:'17 Mar', reqBy:'Arjun Sharma',   dept:'Sales',    purpose:'Delivery — Ashok Leyland',     from:'Factory',        to:'Chennai',      time:'07:00', weight:'500 kg',vehicle:null, status:'pending' },
  { id:'BK-2026-043', type:'collection',date:'17 Mar',reqBy:'Purchase Team',  dept:'Purchase', purpose:'RM Collection — Lakshmi Mills', from:'Ranipet SIPCOT', to:'Factory',      time:'09:00', weight:'2 Tonnes',vehicle:null, status:'allocated' },
  { id:'BK-2026-044', type:'staff',    date:'17 Mar', reqBy:'Deepa Menon',    dept:'HR',       purpose:'Employee transport — Hosur',   from:'Factory',        to:'Hosur',        time:'08:30', passengers:'6', vehicle:'V4',status:'allocated' },
  { id:'BK-2026-045', type:'courier',  date:'17 Mar', reqBy:'Dispatch',       dept:'Dispatch', purpose:'BlueDart 3 parcels',            from:'Factory',        to:'BlueDart Hub', time:'14:00', weight:'10 kg', vehicle:null, status:'pending' },
]

const BTYPE = {
  staff:      {icon:'',label:'Staff Trip',    color:'#714B67', bg:'#EDE0EA'},
  delivery:   {icon:'',label:'Goods Delivery',color:'#017E84', bg:'#D1ECF1'},
  collection: {icon:'',label:'RM Collection', color:'#00A09D', bg:'#E6F7F7'},
  courier:    {icon:'',label:'Courier',        color:'#856404', bg:'#FFF3CD'},
  personal:   {icon:'',label:'Personal',       color:'#6C757D', bg:'#E2E3E5'},
}

const BSTATUS = {
  pending:   {label:'⏳ Pending',   bg:'#FFF3CD',color:'#856404'},
  allocated: {label:' Allocated', bg:'#D4EDDA',color:'#155724'},
  dispatched:{label:' On Road',   bg:'#D1ECF1',color:'#0C5460'},
  completed: {label:' Done',      bg:'#E2E3E5',color:'#383D41'},
}

const V_STATUS = { available:{label:'Available',color:'#155724'}, on_trip:{label:'On Trip',color:'#856404'} }

export default function TripBooking() {
  const nav  = useNavigate()
  const [tab, setTab]       = useState('plan')    // plan | new
  const [btype, setBtype]   = useState('staff')
  const [bookings, setBookings] = useState(PENDING_BOOKINGS)
  const [allocating, setAllocating] = useState(null)
  const [selectedVeh, setSelectedVeh] = useState({})

  // form state
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], time:'', dept:'',
    reqBy:'', purpose:'', from:'', to:'',
    passengers:'', weight:'', courier:'', trackNo:'', remarks:'',
  })
  const updF = (k,v) => setForm(f=>({...f,[k]:v}))

  const allocate = (bkId, vehId) => {
    setBookings(bs => bs.map(b => b.id===bkId ? {...b, vehicle:vehId, status:'allocated'} : b))
    setAllocating(null)
  }

  const inp = {padding:'7px 10px',border:'1.5px solid var(--odoo-border)',borderRadius:5,
    fontSize:12,outline:'none',background:'#FFFDE7',boxSizing:'border-box',width:'100%',fontFamily:'DM Sans,sans-serif'}
  const lbl = {fontSize:11,fontWeight:700,color:'var(--odoo-gray)',textTransform:'uppercase',letterSpacing:.5,marginBottom:4,display:'block'}

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Trip Booking & Planning <small>Allocate vehicles to requests</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>setTab('new')}>+ New Booking</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/tm/trip/new')}>Create Trip Sheet</button>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/print/tripsheet')}>Print</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'2px solid var(--odoo-border)',marginBottom:16}}>
        {[['plan',' Trip Plan & Allocation'],['new',' New Booking Request']].map(([k,l])=>(
          <div key={k} onClick={()=>setTab(k)}
            style={{padding:'9px 20px',fontSize:13,fontWeight:600,cursor:'pointer',
              color:tab===k?'var(--odoo-purple)':'var(--odoo-gray)',
              borderBottom:tab===k?'2px solid var(--odoo-purple)':'2px solid transparent',marginBottom:-2}}>
            {l}
          </div>
        ))}
      </div>

      {/* ── TRIP PLAN TAB ── */}
      {tab === 'plan' && (
        <div>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',
            padding:16,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <h4 style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,marginBottom:12}}>
               Vehicle Availability — Today
            </h4>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {VEHICLES.map(v=>(
                <div key={v.id} style={{padding:'10px 14px',borderRadius:7,
                  border:`2px solid ${v.status==='available'?'var(--odoo-green)':'var(--odoo-orange)'}`,
                  background:v.status==='available'?'#F0FFF4':'#FFFDE7',minWidth:180}}>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:'var(--odoo-dark)'}}>{v.reg}</div>
                  <div style={{fontSize:11,color:'var(--odoo-gray)'}}>{v.type} · {v.cap}</div>
                  <div style={{fontSize:10,marginTop:3}}>
                    <span style={{fontWeight:600,color:V_STATUS[v.status].color}}>● {V_STATUS[v.status].label}</span>
                    <span style={{color:'var(--odoo-gray)',marginLeft:6}}>{v.driver}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending bookings */}
          <table className="fi-data-table">
            <thead>
              <tr>
                <th>Booking No.</th><th>Type</th><th>Date/Time</th><th>Requested By</th>
                <th>From → To</th><th>Purpose</th><th>Load/Pax</th>
                <th>Vehicle Allocated</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(bk=>{
                const bt = BTYPE[bk.type]
                const bs = BSTATUS[bk.status]
                const allocVeh = bk.vehicle ? VEHICLES.find(v=>v.id===bk.vehicle) : null
                return (
                  <tr key={bk.id}>
                    <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{bk.id}</strong></td>
                    <td><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:bt.bg,color:bt.color}}>{bt.icon} {bt.label}</span></td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:11,whiteSpace:'nowrap'}}>{bk.date} {bk.time}</td>
                    <td>
                      <div style={{fontSize:12,fontWeight:600}}>{bk.reqBy}</div>
                      <div style={{fontSize:10,color:'var(--odoo-gray)'}}>{bk.dept}</div>
                    </td>
                    <td style={{fontSize:11}}>
                      <span style={{color:'var(--odoo-gray)'}}>{bk.from}</span>
                      <span style={{margin:'0 4px',color:'var(--odoo-purple)'}}>→</span>
                      <span style={{fontWeight:600}}>{bk.to}</span>
                    </td>
                    <td style={{fontSize:12,maxWidth:160}}>{bk.purpose}</td>
                    <td style={{fontSize:11,textAlign:'center'}}>
                      {bk.passengers && <span> {bk.passengers}</span>}
                      {bk.weight && <span>{bk.weight}</span>}
                    </td>
                    <td>
                      {allocVeh
                        ? <div>
                            <div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:600,color:'var(--odoo-green)'}}>{allocVeh.reg}</div>
                            <div style={{fontSize:10,color:'var(--odoo-gray)'}}>{allocVeh.driver}</div>
                          </div>
                        : allocating===bk.id
                          ? <select onChange={e=>{if(e.target.value)allocate(bk.id,e.target.value)}}
                              style={{...inp,width:160,padding:'4px 6px'}}>
                              <option value="">Select vehicle…</option>
                              {VEHICLES.filter(v=>v.status==='available').map(v=>(
                                <option key={v.id} value={v.id}>{v.reg} · {v.type}</option>
                              ))}
                            </select>
                          : <span style={{fontSize:11,color:'var(--odoo-gray)'}}>— Not allocated</span>
                      }
                    </td>
                    <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:bs.bg,color:bs.color}}>{bs.label}</span></td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        {bk.status==='pending' && !allocating &&
                          <button className="btn-xs pri" style={{background:'var(--odoo-purple)',color:'#fff',whiteSpace:'nowrap'}}
                            onClick={()=>setAllocating(bk.id)}> Allocate</button>}
                        {bk.status==='allocated' &&
                          <button className="btn-xs pri" style={{background:'var(--odoo-green)',color:'#fff',whiteSpace:'nowrap'}}
                            onClick={()=>nav('/tm/trip/new')}>Trip Sheet</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── NEW BOOKING TAB ── */}
      {tab === 'new' && (
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          {/* Trip type selector */}
          <div style={{marginBottom:20}}>
            <label style={lbl}>Trip Type</label>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {Object.entries(BTYPE).map(([k,v])=>(
                <div key={k} onClick={()=>setBtype(k)}
                  style={{padding:'10px 16px',borderRadius:7,cursor:'pointer',
                    border:`2px solid ${btype===k?v.color:'var(--odoo-border)'}`,
                    background:btype===k?v.bg:'#fff',transition:'all .15s'}}>
                  <div style={{fontSize:20,textAlign:'center'}}>{v.icon}</div>
                  <div style={{fontSize:11,fontWeight:700,color:btype===k?v.color:'var(--odoo-gray)',textAlign:'center',marginTop:3}}>{v.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:14}}>
            <div><label style={lbl}>Booking Date</label><input type="date" value={form.date} onChange={e=>updF('date',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Time Required</label><input type="time" value={form.time} onChange={e=>updF('time',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Department</label>
              <select value={form.dept} onChange={e=>updF('dept',e.target.value)} style={inp}>
                <option>Select dept…</option>
                {['Production','Sales','Purchase','Admin','Quality','Maintenance','HR','Management'].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Requested By</label><input value={form.reqBy} onChange={e=>updF('reqBy',e.target.value)} style={inp} placeholder="Name"/></div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div><label style={lbl}>From Location</label><input value={form.from} onChange={e=>updF('from',e.target.value)} style={inp} placeholder="Pick-up location"/></div>
            <div><label style={lbl}>To Location</label><input value={form.to} onChange={e=>updF('to',e.target.value)} style={inp} placeholder="Drop-off / Delivery location"/></div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:14,marginBottom:14}}>
            <div><label style={lbl}>Purpose / Reference</label><input value={form.purpose} onChange={e=>updF('purpose',e.target.value)} style={inp} placeholder={btype==='delivery'?'Customer name / Invoice no.':btype==='collection'?'Supplier / PO no.':btype==='courier'?'Courier company / Consignment':'Purpose of trip'}/></div>
            {(btype==='staff'||btype==='personal') && <div><label style={lbl}>No. of Passengers</label><input type="number" value={form.passengers} onChange={e=>updF('passengers',e.target.value)} style={inp}/></div>}
            {(btype==='delivery'||btype==='collection') && <div><label style={lbl}>Weight / Volume</label><input value={form.weight} onChange={e=>updF('weight',e.target.value)} style={inp} placeholder="e.g. 500 kg"/></div>}
            {btype==='courier' && <div><label style={lbl}>No. of Packages</label><input value={form.weight} onChange={e=>updF('weight',e.target.value)} style={inp} placeholder="No. of parcels"/></div>}
            <div><label style={lbl}>Remarks</label><input value={form.remarks} onChange={e=>updF('remarks',e.target.value)} style={inp} placeholder="Special instructions"/></div>
          </div>

          <div style={{display:'flex',gap:12,justifyContent:'flex-end',paddingTop:12,borderTop:'1px solid var(--odoo-border)'}}>
            <button className="btn btn-s sd-bsm" onClick={()=>setTab('plan')}>Cancel</button>
            <button className="btn btn-p sd-bsm" onClick={()=>{setTab('plan')}}>
               Submit Booking Request
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
