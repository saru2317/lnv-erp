import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO, TH, TD } from './_printUtils'
const SAMPLE={irNo:'IR-2026-041',date:'17 Mar 2026',type:'Incoming',joRef:'JO-2026-047',soRef:'SO-2026-0124',
  customer:'Ashok Leyland Ltd',product:'Powder Coated Brackets — Type A',batch:'BATCH-A-2026-047',qty:500,
  inspector:'QC Inspector — Karthik',inspDate:'17 Mar 2026',standard:'IS 9844 / Customer Spec CS-2024-012',
  params:[
    {sl:1,param:'Coating Thickness',   method:'Elcometer 456',spec:'60–80 micron',results:['68μ','72μ','71μ','69μ','73μ'],avg:'70.6μ', status:'Pass'},
    {sl:2,param:'Adhesion (Cross-cut)',method:'Cross-cut test',spec:'≥ 4B (ISO 2409)',results:['5B','5B','4B','5B','5B'],avg:'4.8B',status:'Pass'},
    {sl:3,param:'Gloss Level',         method:'Glossmeter',  spec:'30–40 GU',results:['34','36','35','33','37'],avg:'35 GU',status:'Pass'},
    {sl:4,param:'Surface Defects',     method:'Visual',      spec:'Zero defects',results:['0','0','0','1','0'],avg:'0.2',  status:'Pass'},
    {sl:5,param:'Colour Match',        method:'Visual/RAL',  spec:'RAL 9005',results:['','','','',''],avg:'100%', status:'Pass'},
  ],
  qtyOk:498, qtyRej:2, rejReason:'2 nos with pin-hole defects — sent for rework',
  verdict:'ACCEPTED', remarks:'Batch conforms to customer specification. 2 nos for rework.',
  preparedBy:'Karthik M.', reviewedBy:'QM Lead',
}
export default function InspectionReportPrint({ir,onClose}){
  const d=ir||SAMPLE
  return(
    <PrintWrapper title={`Inspection Report — ${d.irNo}`} onClose={onClose}>
      <div className="print-page">
        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #6C3483',paddingBottom:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:900,color:'#6C3483'}}>{CO.name}</div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3}}>{CO.addr}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{background:'#6C3483',color:'#fff',padding:'6px 16px',borderRadius:'6px 6px 0 0',fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:800}}>INSPECTION REPORT</div>
            <div style={{border:'1px solid #6C3483',borderTop:'none',padding:'8px 12px',borderRadius:'0 0 6px 6px',lineHeight:1.8}}>
              <div><b style={{fontFamily:'DM Mono,monospace',color:'#6C3483'}}>{d.irNo}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Date: </span><b>{d.date}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Type: </span><b>{d.type} Inspection</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Standard: </span><b style={{fontSize:8}}>{d.standard}</b></div>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
          {[['Customer',d.customer],['Product',d.product],['Batch No.',d.batch],['JO / SO Ref',d.joRef+' / '+d.soRef],['Total Qty',d.qty+' Nos'],['Inspector',d.inspector],['Inspect Date',d.inspDate],['Verdict',d.verdict]].map(([k,v])=>(
            <div key={k} style={{border:'1px solid #ddd',borderRadius:3,padding:'5px 8px'}}>
              <div style={{fontSize:8,color:'#888',textTransform:'uppercase'}}>{k}</div>
              <div style={{fontWeight:700,fontSize:k==='Verdict'?12:10,marginTop:1,
                color:k==='Verdict'?(v==='ACCEPTED'?'#155724':'#721C24'):'#1C1C1C',
                background:k==='Verdict'?(v==='ACCEPTED'?'#D4EDDA':'#F8D7DA'):'transparent',
                padding:k==='Verdict'?'2px 6px':'0',borderRadius:k==='Verdict'?4:0,display:'inline-block'}}>{v}</div>
            </div>
          ))}
        </div>
        {/* Inspection parameters */}
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:12}}>
          <thead><tr>
            <th style={TH('#6C3483')}>#</th>
            <th style={{...TH('#6C3483'),textAlign:'left'}}>Parameter</th>
            <th style={TH('#6C3483')}>Method</th>
            <th style={TH('#6C3483')}>Specification</th>
            <th style={TH('#6C3483')} colSpan={5}>Sample Readings</th>
            <th style={TH('#6C3483')}>Average</th>
            <th style={TH('#6C3483')}>Status</th>
          </tr></thead>
          <tbody>{d.params.map((p,i)=>(
            <tr key={i} style={{background:i%2===0?'#fff':'#F8F0FF'}}>
              <td style={TD()}>{p.sl}</td>
              <td style={{...TD('left'),fontWeight:600}}>{p.param}</td>
              <td style={{...TD(),fontSize:9}}>{p.method}</td>
              <td style={{...TD(),fontSize:9,fontWeight:600}}>{p.spec}</td>
              {p.results.map((r,ri)=>(
                <td key={ri} style={{...TD(),fontFamily:'DM Mono,monospace',fontSize:9}}>{r}</td>
              ))}
              <td style={{...TD(),fontFamily:'DM Mono,monospace',fontWeight:700,color:'#6C3483'}}>{p.avg}</td>
              <td style={TD()}>
                <span style={{padding:'2px 8px',borderRadius:8,fontSize:9,fontWeight:700,background:p.status==='Pass'?'#D4EDDA':'#F8D7DA',color:p.status==='Pass'?'#155724':'#721C24'}}>{p.status}</span>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {/* Summary */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#6C3483',textTransform:'uppercase',marginBottom:6}}>Quantity Summary</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {[['Total',d.qty,'#1C1C1C'],['Accepted',d.qtyOk,'#155724'],['Rejected',d.qtyRej,'#721C24']].map(([k,v,c])=>(
                <div key={k} style={{textAlign:'center',padding:'6px',background:k==='Rejected'?'#F8D7DA':'#D4EDDA',borderRadius:4}}>
                  <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,color:c}}>{v}</div>
                  <div style={{fontSize:9,color:'#555'}}>{k}</div>
                </div>
              ))}
            </div>
            {d.rejReason&&<div style={{fontSize:9,color:'#721C24',marginTop:8,padding:'4px 6px',background:'#F8D7DA',borderRadius:3}}>Rejection Reason: {d.rejReason}</div>}
          </div>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#6C3483',textTransform:'uppercase',marginBottom:4}}>Remarks</div>
            <div style={{fontSize:10,lineHeight:1.6,color:'#333'}}>{d.remarks}</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,borderTop:'1px solid #ddd',paddingTop:12}}>
          {[['Inspector',d.preparedBy],['QC Lead / Reviewer',d.reviewedBy],['Customer Representative','']].map(([r,n])=>(
            <div key={r} style={{textAlign:'center'}}>
              <div style={{height:40,borderBottom:'1px solid #333',marginBottom:4}}/>
              <div style={{fontSize:10,fontWeight:700}}>{n||'Signature'}</div>
              <div style={{fontSize:9,color:'#555'}}>{r}</div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
