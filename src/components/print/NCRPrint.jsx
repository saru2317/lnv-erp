import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO } from './_printUtils'
const SAMPLE={ncrNo:'NCR-2026-089',date:'17 Mar 2026',severity:'Minor',source:'Customer Complaint',
  product:'Powder Coated Brackets',batch:'BATCH-A-2026-045',qty:12,customer:'TVS Motors',soRef:'SO-2026-0118',
  defect:'Pin-hole defects on 12 nos. Customer complained about poor surface finish.',
  rootCause:'Oven temperature inconsistency in Zone 3. Powder not fully cured.',
  immAction:'12 nos segregated and sent for rework. Customer informed.',
  corrAction:'1. Calibrate Zone 3 thermocouple. 2. Increase oven dwell time to 25 min. 3. Daily oven temp log.',
  prevAction:'Monthly oven calibration schedule. Operator training on curing parameters.',
  closureDate:'25 Mar 2026', raisedBy:'QC Inspector', reviewedBy:'QM Lead', approvedBy:'GM Works',
}
const BOX=(title,content,color='#C0392B')=>(
  <div style={{border:`1px solid ${color}33`,borderRadius:4,overflow:'hidden',marginBottom:10}}>
    <div style={{padding:'5px 10px',background:`${color}18`,fontSize:9,fontWeight:700,color,textTransform:'uppercase',letterSpacing:.5}}>{title}</div>
    <div style={{padding:'8px 10px',fontSize:10,color:'#333',lineHeight:1.6}}>{content}</div>
  </div>
)
export default function NCRPrint({ncr,onClose}){
  const d=ncr||SAMPLE
  return(
    <PrintWrapper title={`NCR — ${d.ncrNo}`} onClose={onClose}>
      <div className="print-page">
        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #C0392B',paddingBottom:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:900,color:'#C0392B'}}>{CO.name}</div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3}}>{CO.addr}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{background:'#C0392B',color:'#fff',padding:'6px 16px',borderRadius:'6px 6px 0 0',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:800}}>NON-CONFORMANCE REPORT</div>
            <div style={{border:'1px solid #C0392B',borderTop:'none',padding:'8px 12px',borderRadius:'0 0 6px 6px',lineHeight:1.8}}>
              <div><b style={{fontFamily:'DM Mono,monospace',color:'#C0392B'}}>{d.ncrNo}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Date: </span><b>{d.date}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Severity: </span>
                <span style={{padding:'1px 7px',borderRadius:8,fontSize:9,fontWeight:700,background:d.severity==='Major'?'#F8D7DA':'#FFF3CD',color:d.severity==='Major'?'#721C24':'#856404'}}>{d.severity}</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
          {[['NCR No.',d.ncrNo],['Product',d.product],['Batch',d.batch],['Customer',d.customer],
            ['Source',d.source],['Qty Affected',d.qty+' Nos'],['SO Ref',d.soRef],['Closure Date',d.closureDate]].map(([k,v])=>(
            <div key={k} style={{border:'1px solid #ddd',borderRadius:3,padding:'5px 8px'}}>
              <div style={{fontSize:8,color:'#888',textTransform:'uppercase'}}>{k}</div>
              <div style={{fontWeight:700,fontSize:10,marginTop:1}}>{v}</div>
            </div>
          ))}
        </div>
        {BOX('Defect Description',d.defect,'#C0392B')}
        {BOX('Root Cause Analysis',d.rootCause,'#784212')}
        {BOX('Immediate / Containment Action',d.immAction,'#E06F39')}
        {BOX('Corrective Action',d.corrAction,'#196F3D')}
        {BOX('Preventive Action',d.prevAction,'#1A5276')}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,borderTop:'1px solid #ddd',paddingTop:12}}>
          {[['Raised By',d.raisedBy],['Reviewed By',d.reviewedBy],['Approved / Closed By',d.approvedBy]].map(([r,n])=>(
            <div key={r} style={{textAlign:'center'}}>
              <div style={{height:38,borderBottom:'1px solid #333',marginBottom:3}}/>
              <div style={{fontSize:10,fontWeight:700}}>{n}</div>
              <div style={{fontSize:9,color:'#555'}}>{r}</div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
