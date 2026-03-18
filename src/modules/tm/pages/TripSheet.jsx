import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const VEHICLES = ['TN38 AB 1234 · Innova Crysta','TN38 CD 5678 · 10T Lorry','TN38 EF 9012 · Mini Van','TN38 GH 3456 · Bolero','TN38 IJ 7890 · Auto/Bike']
const DRIVERS  = ['Murugan D.','Selvam D.','Rajan K.','Kumar V.','Dinesh R.']

export default function TripSheet() {
  const nav = useNavigate()
  const [stage, setStage] = useState('entry') // entry | dispatched | closed
  const [form, setForm] = useState({
    tripNo:'TRP-2026-052', date:new Date().toISOString().split('T')[0],
    purpose:'Goods Delivery', vehicle:'TN38 AB 1234 · Innova Crysta', driver:'Murugan D.',
    from:'Coimbatore Factory', to:'Chennai — Ashok Leyland', bookingRef:'BK-2026-042',
    depTime:'07:00', expReturn:'18:00', odoStart:'48250', odoEnd:'',
    fuelLtr:'', fuelRate:'', fuelAmt:'',
    toll:'', parking:'', remarks:'',
    actualReturn:'', intimated:false,
  })
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))

  const distance = form.odoEnd && form.odoStart ? parseInt(form.odoEnd) - parseInt(form.odoStart) : 0
  const mileage  = (form.fuelLtr && distance) ? (distance / parseFloat(form.fuelLtr)).toFixed(1) : '—'

  const inp = {padding:'7px 10px',border:'1.5px solid var(--odoo-border)',borderRadius:5,fontSize:12,outline:'none',background:stage==='closed'?'#F8F9FA':'#FFFDE7',boxSizing:'border-box',width:'100%',fontFamily:'DM Sans,sans-serif'}
  const lbl = {fontSize:11,fontWeight:700,color:'var(--odoo-gray)',textTransform:'uppercase',letterSpacing:.5,marginBottom:4,display:'block'}

  return (
    <div style={{maxWidth:1100}}>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Trip Sheet <small style={{fontFamily:'DM Mono,monospace'}}>{form.tripNo}</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/tm/booking')}>← Back</button>
          <button className="btn btn-s sd-bsm">🖨️ Print</button>
          {stage==='entry' &&
            <button className="btn btn-p sd-bsm" style={{background:'var(--odoo-green)',color:'#fff'}}
              onClick={()=>setStage('dispatched')}>🚚 Dispatch Vehicle</button>}
          {stage==='dispatched' &&
            <button className="btn btn-p sd-bsm" style={{background:'var(--odoo-purple)',color:'#fff'}}
              onClick={()=>setStage('closed')}>✅ Close Trip</button>}
          {stage==='closed' && !form.intimated &&
            <button className="btn btn-p sd-bsm" style={{background:'#856404',color:'#fff'}}
              onClick={()=>upd('intimated',true)}>📱 Intimate Requestor</button>}
        </div>
      </div>

      {/* Status banner */}
      <div style={{padding:'10px 16px',borderRadius:7,marginBottom:16,fontWeight:600,fontSize:13,
        background: stage==='entry'?'#FFF3CD':stage==='dispatched'?'#D1ECF1':'#D4EDDA',
        color: stage==='entry'?'#856404':stage==='dispatched'?'#0C5460':'#155724',
        border:`1px solid ${stage==='entry'?'#FAD7A0':stage==='dispatched'?'#BEE5EB':'#C3E6CB'}`}}>
        {stage==='entry' && '📋 Trip sheet ready — fill details and dispatch'}
        {stage==='dispatched' && '🚚 Vehicle dispatched and on road — enter return details to close'}
        {stage==='closed' && (form.intimated ? '✅ Trip closed and requestor intimated' : '✅ Trip closed — click "Intimate Requestor" to notify')}
      </div>

      {/* Trip Details */}
      <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:20,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        {/* Header banner */}
        <div style={{background:'linear-gradient(135deg,#4A3050,#714B67)',borderRadius:6,padding:'12px 20px',marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:800,color:'#F5C518'}}>P C S — AUTO COATS</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.7)'}}>Transport Management</div></div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:12,fontWeight:700,color:'#fff',letterSpacing:2}}>TRIP SHEET</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700,color:'#F5C518'}}>{form.tripNo}</div>
          </div>
          <div style={{textAlign:'right',fontSize:11,color:'rgba(255,255,255,.7)'}}>Date: <strong style={{color:'#fff'}}>{form.date}</strong></div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:14}}>
          <div><label style={lbl}>Trip No.</label><div style={{...inp,background:'#F8F9FA',fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)'}}>{form.tripNo}</div></div>
          <div><label style={lbl}>Date</label><input type="date" value={form.date} onChange={e=>upd('date',e.target.value)} style={inp}/></div>
          <div><label style={lbl}>Booking Reference</label><input value={form.bookingRef} onChange={e=>upd('bookingRef',e.target.value)} style={inp} placeholder="BK-XXXX"/></div>
          <div><label style={lbl}>Purpose</label>
            <select value={form.purpose} onChange={e=>upd('purpose',e.target.value)} style={inp}>
              {['Goods Delivery','Raw Material Collection','Sample Delivery','Staff Transport','Director Drop/Pickup','Client Visit','Courier Drop','Other'].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:14}}>
          <div><label style={lbl}>Vehicle</label>
            <select value={form.vehicle} onChange={e=>upd('vehicle',e.target.value)} style={inp}>
              {VEHICLES.map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Driver</label>
            <select value={form.driver} onChange={e=>upd('driver',e.target.value)} style={inp}>
              {DRIVERS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Route (From → To)</label><input value={`${form.from} → ${form.to}`} onChange={()=>{}} style={{...inp,background:'#F8F9FA'}} readOnly/></div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          <div><label style={lbl}>Departure Time</label><input type="time" value={form.depTime} onChange={e=>upd('depTime',e.target.value)} style={inp}/></div>
          <div><label style={lbl}>Expected Return</label><input type="time" value={form.expReturn} onChange={e=>upd('expReturn',e.target.value)} style={inp}/></div>
          <div><label style={lbl}>Odometer Start (km)</label><input type="number" value={form.odoStart} onChange={e=>upd('odoStart',e.target.value)} style={inp}/></div>
          <div><label style={lbl}>Odometer End (km)</label>
            <input type="number" value={form.odoEnd} onChange={e=>upd('odoEnd',e.target.value)}
              style={{...inp, background:stage==='dispatched'?'#FFFDE7':'#F8F9FA'}}
              disabled={stage==='entry'} placeholder={stage==='entry'?'Fill on return':''}/></div>
        </div>
      </div>

      {/* Close trip details */}
      {stage !== 'entry' && (
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:20,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,marginBottom:14}}>⛽ Fuel & Expenses</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:14}}>
            <div><label style={lbl}>Fuel (Litres)</label><input type="number" value={form.fuelLtr} onChange={e=>upd('fuelLtr',e.target.value)} style={inp} placeholder="0"/></div>
            <div><label style={lbl}>Rate/Litre (₹)</label><input type="number" value={form.fuelRate} onChange={e=>upd('fuelRate',e.target.value)} style={inp} placeholder="0"/></div>
            <div><label style={lbl}>Fuel Amount (₹)</label>
              <div style={{...inp,background:'#F0FFF4',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>
                {form.fuelLtr && form.fuelRate ? `₹${(parseFloat(form.fuelLtr)*parseFloat(form.fuelRate)).toLocaleString('en-IN')}` : '—'}
              </div>
            </div>
            <div><label style={lbl}>Toll (₹)</label><input type="number" value={form.toll} onChange={e=>upd('toll',e.target.value)} style={inp} placeholder="0"/></div>
            <div><label style={lbl}>Parking (₹)</label><input type="number" value={form.parking} onChange={e=>upd('parking',e.target.value)} style={inp} placeholder="0"/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
            <div><label style={lbl}>Actual Return Time</label><input type="time" value={form.actualReturn} onChange={e=>upd('actualReturn',e.target.value)} style={inp}/></div>
            <div>
              <label style={lbl}>Distance Travelled</label>
              <div style={{...inp,background:'#F0FFF4',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>
                {distance > 0 ? `${distance.toLocaleString('en-IN')} km` : '—'}
              </div>
            </div>
            <div>
              <label style={lbl}>Mileage</label>
              <div style={{...inp,background:'#F0FFF4',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>
                {mileage !== '—' ? `${mileage} km/L` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remarks + Signature */}
      <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{marginBottom:16}}>
          <label style={lbl}>Remarks</label>
          <textarea value={form.remarks} onChange={e=>upd('remarks',e.target.value)} rows={2}
            style={{...inp,resize:'vertical'}} placeholder="Delivery confirmation, issues, delays…"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {['Driver Signature','Authorized By','Transport Head','HOD / Dept Head'].map(s=>(
            <div key={s} style={{border:'1px solid var(--odoo-border)',borderRadius:6,overflow:'hidden'}}>
              <div style={{background:'var(--odoo-purple)',padding:'6px 10px',fontSize:10,fontWeight:700,color:'#fff',textAlign:'center'}}>{s}</div>
              <div style={{height:40,background:'#F8F9FA'}}/>
              <div style={{background:'#F0EEEB',padding:'4px',fontSize:9,color:'var(--odoo-gray)',textAlign:'center'}}>Date: ___________</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
