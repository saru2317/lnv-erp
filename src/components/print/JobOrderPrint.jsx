import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO, TH, TD } from './_printUtils'
const SAMPLE={joNo:'JO-2026-047',date:'17 Mar 2026',soRef:'SO-2026-0124',startDate:'18 Mar 2026',endDate:'21 Mar 2026',
  customer:'Ashok Leyland Ltd',process:'Powder Coating — RAL 9005 Black',machine:'Powder Coat Line #2',shift:'Morning (6AM-2PM)',
  lines:[
    {sl:1,desc:'Brackets — Type A',material:'MS Brackets',qty:500,uom:'Nos',coatType:'Powder — RAL 9005',thickness:'60-80 micron',std:'IS 9844'},
    {sl:2,desc:'Flanges — 50mm',   material:'CI Flanges',  qty:300,uom:'Nos',coatType:'Surface Treatment',thickness:'—',std:'IS 1477'},
  ],
  rawMaterials:[
    {desc:'Powder Coat RAL 9005',code:'RM-001',uom:'Kg',qty:45,issueQty:''},
    {desc:'Masking Tape 25mm',   code:'SP-001',uom:'Roll',qty:20,issueQty:''},
    {desc:'Pre-treatment Chemical',code:'CH-001',uom:'Ltr',qty:10,issueQty:''},
  ],
  instructions:'Pre-treat all parts. Check for rust/oil before coating. Maintain oven temp 180-200°C.',
  qcParams:'Thickness: 60-80μ. Adhesion: Cross-cut ≥ 4B. Salt spray: 500hrs min.',
  supervisor:'Production Supervisor',
}
export default function JobOrderPrint({jo,onClose}){
  const d=jo||SAMPLE
  return(
    <PrintWrapper title={`Job Order — ${d.joNo}`} onClose={onClose}>
      <div className="print-page">
        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #784212',paddingBottom:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:900,color:'#784212'}}>{CO.name}</div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3}}>{CO.addr}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{background:'#784212',color:'#fff',padding:'6px 16px',borderRadius:'6px 6px 0 0',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:800}}>JOB ORDER / WORK ORDER</div>
            <div style={{border:'1px solid #784212',borderTop:'none',padding:'8px 12px',borderRadius:'0 0 6px 6px',lineHeight:1.8}}>
              <div><b style={{fontFamily:'DM Mono,monospace',color:'#784212'}}>{d.joNo}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Date: </span><b>{d.date}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>SO Ref: </span><b style={{fontFamily:'DM Mono,monospace'}}>{d.soRef}</b></div>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
          {[['Customer',d.customer],['Process / Operation',d.process],['Machine / Line',d.machine],['Start Date',d.startDate],['End Date',d.endDate],['Shift',d.shift]].map(([k,v])=>(
            <div key={k} style={{border:'1px solid #ddd',borderRadius:3,padding:'6px 8px'}}>
              <div style={{fontSize:8,color:'#888',textTransform:'uppercase',letterSpacing:.5}}>{k}</div>
              <div style={{fontWeight:700,fontSize:11,marginTop:2}}>{v}</div>
            </div>
          ))}
        </div>
        {/* Items */}
        <div style={{marginBottom:12}}>
          <div style={{padding:'6px 10px',background:'#784212',color:'#fff',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,borderRadius:'4px 4px 0 0'}}>Production Items</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['#','Description','Material','Qty','UOM','Coating / Process','Thickness','Standard'].map(h=><th key={h} style={TH('#784212')}>{h}</th>)}</tr></thead>
            <tbody>{d.lines.map((l,i)=>(
              <tr key={i} style={{background:i%2===0?'#fff':'#FBF5EE'}}>
                <td style={TD()}>{l.sl}</td>
                <td style={{...TD('left'),fontWeight:600}}>{l.desc}</td>
                <td style={{...TD('left'),fontSize:9}}>{l.material}</td>
                <td style={{...TD(),fontFamily:'DM Mono,monospace',fontWeight:700}}>{l.qty}</td>
                <td style={TD()}>{l.uom}</td>
                <td style={{...TD('left'),fontSize:9}}>{l.coatType}</td>
                <td style={{...TD(),fontFamily:'DM Mono,monospace',fontSize:9}}>{l.thickness}</td>
                <td style={{...TD(),fontSize:9}}>{l.std}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {/* Raw Materials */}
        <div style={{marginBottom:12}}>
          <div style={{padding:'6px 10px',background:'#1A5276',color:'#fff',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,borderRadius:'4px 4px 0 0'}}>Raw Material Issue</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Material','Code','UOM','Required Qty','Issued Qty','Store Sign'].map(h=><th key={h} style={TH('#1A5276')}>{h}</th>)}</tr></thead>
            <tbody>{d.rawMaterials.map((m,i)=>(
              <tr key={i} style={{background:i%2===0?'#fff':'#EBF2F8'}}>
                <td style={{...TD('left'),fontWeight:600}}>{m.desc}</td>
                <td style={{...TD(),fontFamily:'DM Mono,monospace',fontSize:9}}>{m.code}</td>
                <td style={TD()}>{m.uom}</td>
                <td style={{...TD(),fontFamily:'DM Mono,monospace',fontWeight:700}}>{m.qty}</td>
                <td style={{...TD(),minWidth:80,background:'#FFFDE7'}}>{m.issueQty}</td>
                <td style={{...TD(),minWidth:80}}></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {/* Instructions */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#784212',textTransform:'uppercase',marginBottom:4}}>Process Instructions</div>
            <div style={{fontSize:10,color:'#555',lineHeight:1.6}}>{d.instructions}</div>
          </div>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#784212',textTransform:'uppercase',marginBottom:4}}>QC Parameters</div>
            <div style={{fontSize:10,color:'#555',lineHeight:1.6}}>{d.qcParams}</div>
          </div>
        </div>
        {/* Execution log */}
        <div style={{border:'1px solid #ddd',borderRadius:4,overflow:'hidden',marginBottom:12}}>
          <div style={{padding:'6px 10px',background:'#F8F9FA',fontSize:9,fontWeight:700,color:'#555',textTransform:'uppercase'}}>Production Execution Log</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Date','Shift','Operator','Qty Processed','Qty Rejected','Oven Temp','Remarks'].map(h=><th key={h} style={{...TH('#F0F0F0'),color:'#555',fontSize:9}}>{h}</th>)}</tr></thead>
            <tbody>{[1,2,3].map(i=>(
              <tr key={i}><td colSpan={7} style={{height:24,border:'1px solid #eee'}}></td></tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,borderTop:'1px solid #ddd',paddingTop:12}}>
          {[['Production Supervisor',d.supervisor],['QC Inspector',''],['Store (RM Issued)',''],['HOD / Manager','']].map(([r,n])=>(
            <div key={r} style={{textAlign:'center'}}>
              <div style={{height:38,borderBottom:'1px solid #333',marginBottom:3}}/>
              <div style={{fontSize:9,fontWeight:700}}>{n||'Signature'}</div>
              <div style={{fontSize:8,color:'#555'}}>{r}</div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
