import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO, fmt, TH, TD } from './_printUtils'
const SAMPLE={bomNo:'BOM-2026-018',date:'17 Mar 2026',product:'Powder Coated Assembly — Type A',bomQty:1,uom:'Set',revision:'Rev 2.0',validFrom:'01 Apr 2026',
  components:[
    {sl:1,code:'RM-001',desc:'Powder Coat RAL 9005',       cat:'Raw Material',uom:'Kg',  qtyPer:0.09, scrap:2,total:0.092,cost:160,  totalCost:14.72},
    {sl:2,code:'RM-003',desc:'Phosphating Chemical',       cat:'Chemical',    uom:'Ltr', qtyPer:0.02, scrap:5,total:0.021,cost:2500, totalCost:52.5},
    {sl:3,code:'SP-001',desc:'Masking Tape 25mm',          cat:'Consumable',  uom:'Mtr', qtyPer:0.05, scrap:0,total:0.05, cost:34,   totalCost:1.7},
    {sl:4,code:'UT-001',desc:'Electricity (Oven)',         cat:'Utility',     uom:'kWh', qtyPer:0.8,  scrap:0,total:0.8,  cost:8,    totalCost:6.4},
  ],
  preparedBy:'Production Engg.', approvedBy:'GM — Works',
}
export default function BOMPrint({bom,onClose}){
  const d=bom||SAMPLE
  const total=d.components.reduce((a,c)=>a+c.totalCost,0)
  return(
    <PrintWrapper title={`Bill of Materials — ${d.bomNo}`} onClose={onClose}>
      <div className="print-page">
        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #6C3483',paddingBottom:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:900,color:'#6C3483'}}>{CO.name}</div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3}}>{CO.addr}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{background:'#6C3483',color:'#fff',padding:'6px 16px',borderRadius:'6px 6px 0 0',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:800}}>BILL OF MATERIALS</div>
            <div style={{border:'1px solid #6C3483',borderTop:'none',padding:'8px 12px',borderRadius:'0 0 6px 6px',lineHeight:1.8}}>
              <div><b style={{fontFamily:'DM Mono,monospace',color:'#6C3483'}}>{d.bomNo}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Date: </span><b>{d.date}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Revision: </span><b>{d.revision}</b></div>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
          {[['Finished Product',d.product],['BOM Qty',d.bomQty+' '+d.uom],['Valid From',d.validFrom]].map(([k,v])=>(
            <div key={k} style={{border:'1px solid #ddd',borderRadius:3,padding:'6px 8px'}}>
              <div style={{fontSize:8,color:'#888',textTransform:'uppercase'}}>{k}</div>
              <div style={{fontWeight:700,fontSize:11,marginTop:2}}>{v}</div>
            </div>
          ))}
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:12}}>
          <thead><tr>{['#','Code','Component / Material','Category','UOM','Qty/Unit','Scrap%','Total Qty','Unit Cost (₹)','Total Cost (₹)'].map(h=><th key={h} style={TH('#6C3483')}>{h}</th>)}</tr></thead>
          <tbody>{d.components.map((c,i)=>(
            <tr key={i} style={{background:i%2===0?'#fff':'#F8F0FF'}}>
              <td style={TD()}>{c.sl}</td>
              <td style={{...TD(),fontFamily:'DM Mono,monospace',fontSize:9}}>{c.code}</td>
              <td style={{...TD('left'),fontWeight:600}}>{c.desc}</td>
              <td style={{...TD(),fontSize:9}}><span style={{padding:'2px 6px',borderRadius:8,fontSize:9,fontWeight:600,background:'#EDE0EA',color:'#714B67'}}>{c.cat}</span></td>
              <td style={TD()}>{c.uom}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{c.qtyPer}</td>
              <td style={TD()}>{c.scrap}%</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace',fontWeight:700}}>{c.total}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>₹{fmt(c.cost)}</td>
              <td style={{...TD('right'),fontWeight:700,fontFamily:'DM Mono,monospace',color:'#6C3483'}}>₹{fmt(c.totalCost)}</td>
            </tr>
          ))}</tbody>
          <tfoot><tr style={{background:'#EDE0EA'}}>
            <td colSpan={9} style={{...TD('right'),fontWeight:700,fontSize:11}}>TOTAL MATERIAL COST / UNIT</td>
            <td style={{...TD('right'),fontWeight:800,fontFamily:'DM Mono,monospace',color:'#6C3483',fontSize:13}}>₹{fmt(total)}</td>
          </tr></tfoot>
        </table>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,borderTop:'1px solid #ddd',paddingTop:12}}>
          {[['Prepared By',d.preparedBy],['Reviewed By','Production Manager'],['Approved By',d.approvedBy]].map(([r,n])=>(
            <div key={r} style={{textAlign:'center'}}>
              <div style={{height:40,borderBottom:'1px solid #333',marginBottom:4}}/>
              <div style={{fontSize:10,fontWeight:700}}>{n}</div>
              <div style={{fontSize:9,color:'#555'}}>{r}</div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
