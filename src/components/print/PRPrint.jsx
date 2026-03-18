import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO, TH, TD } from './_printUtils'
const SAMPLE={prNo:'PR-2026-042',date:'17 Mar 2026',dept:'Production',priority:'High',csRequired:'Yes',requiredBy:'22 Mar 2026',
  lines:[
    {sl:1,code:'RM-001',desc:'Powder Coat — RAL 9005 Black',uom:'Kg', qty:500,estRate:1600,purpose:'Production — Batch A047',vendorSug:'Lakshmi Textile Mills'},
    {sl:2,code:'RM-002',desc:'Powder Coat — RAL 9010 White',uom:'Kg', qty:300,estRate:1600,purpose:'Production — Batch A048',vendorSug:''},
    {sl:3,code:'SP-001',desc:'Masking Tape 25mm',           uom:'Roll',qty:200,estRate:85,  purpose:'Daily use',vendorSug:''},
  ],
  remarks:'Urgent — stock depleted. Comparative statement required.',
  approvals:[{role:'Requested By',name:'Production Supervisor'},{role:'HOD',name:'PP Manager'},{role:'Purchase',name:''},{role:'GM',name:''},{role:'MD',name:''}],
}
export default function PRPrint({pr,onClose}){
  const d=pr||SAMPLE
  const total=d.lines.reduce((a,l)=>a+(l.qty*l.estRate),0)
  return(
    <PrintWrapper title={`Purchase Indent — ${d.prNo}`} onClose={onClose}>
      <div className="print-page">
        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #1A5276',paddingBottom:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:900,color:'#1A5276'}}>{CO.name}</div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3}}>{CO.addr}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{background:'#1A5276',color:'#fff',padding:'6px 16px',borderRadius:'6px 6px 0 0',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:800}}>PURCHASE INDENT</div>
            <div style={{border:'1px solid #1A5276',borderTop:'none',padding:'8px 12px',borderRadius:'0 0 6px 6px',lineHeight:1.8}}>
              <div><b style={{fontFamily:'DM Mono,monospace',color:'#1A5276'}}>{d.prNo}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Date: </span><b>{d.date}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Dept: </span><b>{d.dept}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Priority: </span>
                <span style={{background:d.priority==='High'?'#F8D7DA':'#FFF3CD',color:d.priority==='High'?'#721C24':'#856404',padding:'1px 6px',borderRadius:8,fontSize:9,fontWeight:700}}>{d.priority}</span></div>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
          {[['Required By',d.requiredBy],['CS Required',d.csRequired],['Department',d.dept],['Priority',d.priority]].map(([k,v])=>(
            <div key={k} style={{border:'1px solid #ddd',borderRadius:3,padding:'6px 8px'}}>
              <div style={{fontSize:8,color:'#888',textTransform:'uppercase',letterSpacing:.5}}>{k}</div>
              <div style={{fontWeight:700,fontSize:11,marginTop:2}}>{v}</div>
            </div>
          ))}
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:10}}>
          <thead><tr>{['#','Item Code','Description','UOM','Qty','Est. Rate','Est. Value','Purpose','Vendor Suggestion'].map(h=><th key={h} style={TH('#1A5276')}>{h}</th>)}</tr></thead>
          <tbody>{d.lines.map((l,i)=>(
            <tr key={i} style={{background:i%2===0?'#fff':'#EBF2F8'}}>
              <td style={TD()}>{l.sl}</td>
              <td style={{...TD(),fontFamily:'DM Mono,monospace',fontSize:9}}>{l.code}</td>
              <td style={{...TD('left'),fontWeight:600}}>{l.desc}</td>
              <td style={TD()}>{l.uom}</td>
              <td style={{...TD(),fontFamily:'DM Mono,monospace',fontWeight:700}}>{l.qty}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>₹{l.estRate}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace',fontWeight:700,color:'#1A5276'}}>₹{(l.qty*l.estRate).toLocaleString('en-IN')}</td>
              <td style={{...TD('left'),fontSize:9}}>{l.purpose}</td>
              <td style={{...TD('left'),fontSize:9,color:'#555'}}>{l.vendorSug||'—'}</td>
            </tr>
          ))}</tbody>
          <tfoot><tr style={{background:'#EBF2F8'}}>
            <td colSpan={6} style={{...TD('right'),fontWeight:700}}>ESTIMATED TOTAL</td>
            <td style={{...TD('right'),fontWeight:800,fontFamily:'DM Mono,monospace',color:'#1A5276',fontSize:12}}>₹{total.toLocaleString('en-IN')}</td>
            <td colSpan={2}/>
          </tr></tfoot>
        </table>
        {d.remarks&&<div style={{border:'1px solid #ddd',borderRadius:4,padding:'7px 10px',fontSize:10,marginBottom:12}}><b style={{color:'#1A5276'}}>Remarks: </b>{d.remarks}</div>}
        <div style={{display:'grid',gridTemplateColumns:`repeat(${d.approvals.length},1fr)`,gap:10,borderTop:'1px solid #ddd',paddingTop:12}}>
          {d.approvals.map(a=>(
            <div key={a.role} style={{textAlign:'center',border:'1px solid #ddd',borderRadius:4,overflow:'hidden'}}>
              <div style={{background:'#1A5276',padding:'4px',fontSize:8,fontWeight:700,color:'#fff'}}>{a.role}</div>
              <div style={{height:35,background:'#FAFAFA'}}/>
              <div style={{padding:'3px',fontSize:8,color:'#888',background:'#F0F0F0'}}>{a.name||'Name / Date'}</div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
