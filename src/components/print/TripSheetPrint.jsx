/**
 * TripSheetPrint — Transport Trip Sheet (A4)
 */
import React from 'react'
import PrintWrapper from './PrintWrapper'

const COMPANY = { name:'LNV Manufacturing Pvt. Ltd.', short:'P C S — AUTO COATS', gstin:'33AABCL1234F1Z5' }

const SAMPLE_TRIP = {
  tripNo:'TRP-2026-052', date:'17 Mar 2026',
  bookingRef:'BK-2026-042', purpose:'Goods Delivery',
  vehicle:'TN38 CD 5678 · 10T Lorry', driver:'Selvam D.',
  driverLic:'TN38 20230012345',
  from:'Factory — SIDCO, Ranipet',
  to:'Ashok Leyland — Chennai',
  depTime:'07:00 AM', expReturn:'08:00 PM',
  odoStart:'82100', odoEnd:'83048',
  fuelLtr:'80', fuelRate:'92', fuelAmt:'7360',
  toll:'420', parking:'0',
  actualReturn:'07:45 PM',
  distance:'948',
  mileage:'11.9',
  deliveries:[
    { ref:'INV-2026-0124', customer:'Ashok Leyland — Plant 1',  items:'Powder Coated Parts — Batch A047', qty:'500 Kg', status:'Delivered' },
    { ref:'INV-2026-0123', customer:'Ashok Leyland — Plant 2',  items:'Surface Treated Components',      qty:'300 Kg', status:'Delivered' },
  ],
  remarks:'Delivery completed. POD signed. Vehicle in good condition.',
  status:'Closed',
}

export default function TripSheetPrint({ trip, onClose }) {
  const t = trip || SAMPLE_TRIP
  const totalExpense = (parseFloat(t.fuelAmt)||0) + (parseFloat(t.toll)||0) + (parseFloat(t.parking)||0)

  const row = (label, value, mono=false) => (
    <tr key={label}>
      <td style={{padding:'5px 8px',border:'1px solid #ddd',fontWeight:600,
        fontSize:10,background:'#F8F9FA',width:'30%',color:'#555'}}>{label}</td>
      <td style={{padding:'5px 8px',border:'1px solid #ddd',fontSize:10,
        fontFamily: mono ? 'DM Mono,monospace' : 'inherit',fontWeight: mono ? 600 : 400}}>
        {value || '—'}
      </td>
    </tr>
  )

  return (
    <PrintWrapper title={`Trip Sheet — ${t.tripNo}`} onClose={onClose}>
      <div className="print-page">

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#4A3050,#714B67)',
          borderRadius:6,padding:'12px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:800,color:'#F5C518'}}>
              {COMPANY.short}
            </div>
            <div style={{fontSize:10,color:'rgba(255,255,255,.7)'}}>Transport Management · Trip Sheet</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#fff',letterSpacing:2}}>TRIP SHEET</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:'#F5C518'}}>{t.tripNo}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11,color:'rgba(255,255,255,.7)'}}>Date</div>
            <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{t.date}</div>
            <div style={{marginTop:4,padding:'2px 10px',borderRadius:10,
              background: t.status==='Closed'?'#00A09D':'#E06F39',
              color:'#fff',fontSize:10,fontWeight:700,display:'inline-block'}}>
              {t.status}
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          <div style={{border:'1px solid #ddd',borderRadius:4,overflow:'hidden'}}>
            <div style={{padding:'6px 10px',background:'#714B67',color:'#fff',
              fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>
              Trip Information
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              {[
                ['Trip No.',     t.tripNo,     true ],
                ['Booking Ref',  t.bookingRef, true ],
                ['Purpose',      t.purpose,    false],
                ['From',         t.from,       false],
                ['To',           t.to,         false],
                ['Departure',    t.depTime,    true ],
                ['Exp. Return',  t.expReturn,  true ],
              ].map(([l,v,m])=>row(l,v,m))}
            </table>
          </div>
          <div style={{border:'1px solid #ddd',borderRadius:4,overflow:'hidden'}}>
            <div style={{padding:'6px 10px',background:'#714B67',color:'#fff',
              fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>
              Vehicle &amp; Driver
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              {[
                ['Vehicle',       t.vehicle,    false],
                ['Driver',        t.driver,     false],
                ['Driver Lic.',   t.driverLic,  true ],
                ['Odo Start',     t.odoStart+' km', true],
                ['Odo End',       t.odoEnd ? t.odoEnd+' km' : '—', true],
                ['Distance',      t.distance ? t.distance+' km' : '—', true],
                ['Actual Return', t.actualReturn, true],
              ].map(([l,v,m])=>row(l,v,m))}
            </table>
          </div>
        </div>

        {/* Deliveries */}
        {t.deliveries?.length > 0 && (
          <div style={{marginBottom:12}}>
            <div style={{padding:'6px 10px',background:'#1A5276',color:'#fff',
              fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,
              borderRadius:'4px 4px 0 0'}}>
              Delivery / Collection Details
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',
              border:'1px solid #ddd',borderTop:'none'}}>
              <thead>
                <tr style={{background:'#F8F9FA'}}>
                  {['Ref No.','Customer / Destination','Items / Material','Qty/Wt','Status','POD Signed'].map(h=>(
                    <th key={h} style={{padding:'6px 8px',border:'1px solid #ddd',
                      fontSize:9,fontWeight:700,color:'#555',textAlign:'left'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.deliveries.map((d,i)=>(
                  <tr key={i} style={{background:i%2===0?'#fff':'#F8F9FA'}}>
                    <td style={{padding:'6px 8px',border:'1px solid #ddd',
                      fontFamily:'DM Mono,monospace',fontSize:9,fontWeight:600,
                      color:'#714B67'}}>{d.ref}</td>
                    <td style={{padding:'6px 8px',border:'1px solid #ddd',
                      fontSize:10,fontWeight:600}}>{d.customer}</td>
                    <td style={{padding:'6px 8px',border:'1px solid #ddd',fontSize:9}}>{d.items}</td>
                    <td style={{padding:'6px 8px',border:'1px solid #ddd',
                      fontFamily:'DM Mono,monospace',fontSize:9,textAlign:'center'}}>{d.qty}</td>
                    <td style={{padding:'6px 8px',border:'1px solid #ddd',textAlign:'center'}}>
                      <span style={{padding:'2px 7px',borderRadius:8,fontSize:9,fontWeight:600,
                        background:'#D4EDDA',color:'#155724'}}>{d.status}</span>
                    </td>
                    <td style={{padding:'6px 8px',border:'1px solid #ddd',
                      height:28,minWidth:80}}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Fuel & Expenses */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <div style={{border:'1px solid #ddd',borderRadius:4,overflow:'hidden'}}>
            <div style={{padding:'6px 10px',background:'#E06F39',color:'#fff',
              fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>
              Fuel &amp; Expenses
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              {[
                ['Fuel (Litres)',   t.fuelLtr+' L',         true],
                ['Fuel Rate',       'Rs '+t.fuelRate+'/L',  true],
                ['Fuel Amount',     'Rs '+t.fuelAmt,        true],
                ['Toll Charges',    t.toll ? 'Rs '+t.toll : '—', true],
                ['Parking',         t.parking && t.parking!=='0' ? 'Rs '+t.parking : '—', true],
                ['Mileage',         t.mileage ? t.mileage+' km/L' : '—', true],
              ].map(([l,v,m])=>row(l,v,m))}
              <tr>
                <td style={{padding:'6px 8px',border:'1px solid #ddd',fontWeight:700,
                  background:'#FFF3CD',fontSize:11}}>Total Expense</td>
                <td style={{padding:'6px 8px',border:'1px solid #ddd',fontFamily:'DM Mono,monospace',
                  fontWeight:800,fontSize:13,color:'#856404',background:'#FFF3CD'}}>
                  Rs {totalExpense.toLocaleString('en-IN')}
                </td>
              </tr>
            </table>
          </div>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'10px',display:'flex',flexDirection:'column'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#555',
              textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>Remarks</div>
            <div style={{fontSize:10,flex:1,minHeight:60,
              borderBottom:'1px dashed #ddd',paddingBottom:8,marginBottom:8}}>
              {t.remarks}
            </div>
            <div style={{fontSize:9,color:'#888'}}>
              Vehicle condition on return: Good / Damaged (circle one)
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',
          gap:12,borderTop:'2px solid #714B67',paddingTop:12}}>
          {[
            ['Driver Signature', t.driver],
            ['Authorized By',   ''],
            ['Transport Head',  ''],
            ['HOD / Dept Head', ''],
          ].map(([role,name])=>(
            <div key={role} style={{border:'1px solid #ddd',borderRadius:4,overflow:'hidden'}}>
              <div style={{background:'#714B67',padding:'5px 8px',
                fontSize:9,fontWeight:700,color:'#fff',textAlign:'center'}}>{role}</div>
              <div style={{height:45,background:'#FAFAFA'}}/>
              <div style={{padding:'4px 6px',background:'#F0EEEB',
                fontSize:8,color:'#888',textAlign:'center'}}>
                {name && <span style={{fontWeight:600,color:'#1C1C1C'}}>{name}</span>}
                {!name && 'Name & Designation'}
                <br/>Date: __________
              </div>
            </div>
          ))}
        </div>

        <div style={{textAlign:'center',marginTop:10,paddingTop:8,
          borderTop:'1px solid #eee',fontSize:8,color:'#aaa'}}>
          {COMPANY.name} · Transport Management · Trip Sheet {t.tripNo} · {t.date}
        </div>

      </div>
    </PrintWrapper>
  )
}
