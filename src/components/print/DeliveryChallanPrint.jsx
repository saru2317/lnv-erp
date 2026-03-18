import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO, fmt, TH, TD } from './_printUtils'

const SAMPLE = {
  dcNo:'DC-2026-0089', date:'17 Mar 2026', soRef:'SO-2026-0124',
  vehicleNo:'TN38 CD 5678', driverName:'Selvam D.',
  ewb:'EWB-2026-00441', dispatchThrough:'Own Vehicle',
  customer:{name:'Ashok Leyland Ltd',gstin:'33AAACE5678M1Z2',addr:'No. 1, Hosur Rd, Chennai — 600032'},
  lines:[
    {sl:1,desc:'Powder Coated Brackets — Type A',unit:'Nos',qty:500,remarks:'As per PO'},
    {sl:2,desc:'Surface Treated Flanges — 50mm', unit:'Nos',qty:300,remarks:'QC Passed'},
  ],
  preparedBy:'Dispatch Dept', checkedBy:'Store In-Charge',
}

export default function DeliveryChallanPrint({ dc, onClose }) {
  const d = dc || SAMPLE
  return (
    <PrintWrapper title={`Delivery Challan — ${d.dcNo}`} onClose={onClose}>
      <div className="print-page">
        {/* Duplicate watermark note */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
          {['ORIGINAL','DUPLICATE'].map(copy=>(
            <div key={copy} style={{padding:'0 6px',borderRight:copy==='ORIGINAL'?'2px dashed #999':'none'}}>
              <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #00A09D',paddingBottom:8,marginBottom:10}}>
                <div>
                  <div style={{fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:900,color:'#00A09D'}}>{CO.name}</div>
                  <div style={{fontSize:8.5,color:'#555',marginTop:2,lineHeight:1.5}}>{CO.addr}<br/>GSTIN: <b>{CO.gstin}</b></div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{background:'#00A09D',color:'#fff',padding:'4px 12px',borderRadius:'5px 5px 0 0',fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:800}}>DELIVERY CHALLAN</div>
                  <div style={{border:'1px solid #00A09D',borderTop:'none',padding:'5px 10px',borderRadius:'0 0 5px 5px',lineHeight:1.7,fontSize:9}}>
                    <div><b style={{fontFamily:'DM Mono,monospace',color:'#00A09D'}}>{d.dcNo}</b></div>
                    <div>Date: <b>{d.date}</b></div>
                    <div>SO Ref: <b style={{fontFamily:'DM Mono,monospace'}}>{d.soRef}</b></div>
                    <div style={{background:'#E6F7F7',padding:'2px 5px',borderRadius:3,fontWeight:700,fontSize:9,color:'#00A09D',marginTop:2}}>{copy}</div>
                  </div>
                </div>
              </div>
              <div style={{border:'1px solid #ddd',borderRadius:3,padding:'6px 8px',marginBottom:8}}>
                <div style={{fontSize:8,fontWeight:700,color:'#00A09D',textTransform:'uppercase',marginBottom:3}}>Consignee</div>
                <div style={{fontWeight:700,fontSize:10}}>{d.customer.name}</div>
                <div style={{fontSize:8.5,color:'#555'}}>{d.customer.addr}<br/>GSTIN: <b>{d.customer.gstin}</b></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:8,fontSize:8.5}}>
                {[['Vehicle No.',d.vehicleNo],['Driver',d.driverName],['E-Way Bill',d.ewb],['Dispatch Via',d.dispatchThrough]].map(([k,v])=>(
                  <div key={k} style={{border:'1px solid #ddd',borderRadius:3,padding:'4px 6px'}}>
                    <div style={{color:'#888',fontSize:8}}>{k}</div>
                    <div style={{fontWeight:700,fontFamily:'DM Mono,monospace',fontSize:9}}>{v||'—'}</div>
                  </div>
                ))}
              </div>
              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:8}}>
                <thead><tr>{['#','Description','Unit','Quantity','Remarks'].map(h=><th key={h} style={{...TH('#00A09D'),fontSize:8.5}}>{h}</th>)}</tr></thead>
                <tbody>{d.lines.map((l,i)=>(
                  <tr key={i} style={{background:i%2===0?'#fff':'#F0FFFE'}}>
                    <td style={{...TD(),fontSize:9}}>{l.sl}</td>
                    <td style={{...TD('left'),fontWeight:600,fontSize:9}}>{l.desc}</td>
                    <td style={{...TD(),fontSize:9}}>{l.unit}</td>
                    <td style={{...TD(),fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:10}}>{l.qty}</td>
                    <td style={{...TD('left'),fontSize:9,color:'#555'}}>{l.remarks}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,borderTop:'1px solid #ddd',paddingTop:8}}>
                {[['Prepared By',d.preparedBy],['Checked / Packed By',d.checkedBy],['Received By (Customer)','']].map(([r,n])=>(
                  <div key={r} style={{textAlign:'center'}}>
                    <div style={{height:32,borderBottom:'1px solid #333',marginBottom:3}}/>
                    <div style={{fontSize:9,fontWeight:700}}>{n}</div>
                    <div style={{fontSize:8,color:'#555'}}>{r}</div>
                    <div style={{fontSize:8,color:'#aaa',marginTop:2}}>Date: _________</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
